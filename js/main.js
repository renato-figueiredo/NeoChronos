// js/main.js
import { ELEMENTS } from './constants.js';
import { state, setState } from './state.js';
import * as ui from './ui.js';

let uiRefreshInterval = null;

// --- Comunicação com o Background ---
function request(type, payload, callback) {
    chrome.runtime.sendMessage({ type, payload }, response => {
        if (chrome.runtime.lastError) {
            console.warn("Erro na comunicação:", chrome.runtime.lastError.message);
        } else if (callback) {
            callback(response);
        }
    });
}

// --- Funções que atualizam a UI ---
function renderFullUI() {
    ui.updateMainTimerDisplay(state.mainTimer.elapsedTime);
    ui.toggleMainTimerButton(state.mainTimer.isRunning);
    ui.updateCompletedTasksTotalDisplay(state.completedTasksTotal);
    ui.renderTasks(state.tasks);
}

// Esta função roda a cada segundo para atualizar APENAS os timers
function tickUI() {
    if (state.mainTimer.isRunning) {
        const elapsed = Math.floor((Date.now() - state.mainTimer.startTime) / 1000);
        ui.updateMainTimerDisplay(elapsed);
    }
    state.tasks.forEach(task => {
        if (task.status === 'running') {
            const elapsed = Math.floor((Date.now() - task.startTime) / 1000);
            ui.updateTaskTimerDisplay(task.id, elapsed);
        }
    });
}


// --- Handlers de Eventos ---
function handleMainToggle() {
    request(state.mainTimer.isRunning ? 'STOP_MAIN_TIMER' : 'START_MAIN_TIMER');
}

function handleSetTimeClick() {
    ui.showSetTimeModal((hours, minutes) => {
        request('SET_MAIN_TIMER', { hours, minutes });
    });
}

function handleAddTask() {
    const input = document.getElementById(ELEMENTS.NEW_TASK_NAME_INPUT);
    if (input.value.trim()) {
        request('ADD_TASK', { name: input.value.trim() });
        input.value = '';
    }
}

function handleManualTaskClick() {
    ui.showManualTaskModal((name, hours, minutes) => {
        request('ADD_MANUAL_TASK', { name, hours, minutes });
    });
}

function handleTaskListClick(event) {
    const target = event.target.closest('button');
    if (!target) return;
    
    const taskElement = target.closest('.task-card');
    const taskId = Number(taskElement.dataset.taskId);
    
    const actions = {
        'task-toggle': () => request('TOGGLE_TASK', { id: taskId }),
        'task-edit': () => {
            const newName = prompt("Digite o novo nome da tarefa:", state.tasks.find(t=>t.id === taskId).name);
            if (newName && newName.trim()) {
                request('UPDATE_TASK_NAME', { id: taskId, newName: newName.trim() });
            }
        },
        'task-delete': () => {
            if (confirm("Tem certeza que deseja excluir esta tarefa?")) {
                request('DELETE_TASK', { id: taskId });
            }
        },
        'task-complete': () => request('COMPLETE_TASK', { id: taskId })
    };

    for (const actionClass in actions) {
        if (target.classList.contains(actionClass)) {
            actions[actionClass]();
            break;
        }
    }
}

function addEventListeners() {
    document.getElementById(ELEMENTS.MAIN_TOGGLE_BTN).addEventListener('click', handleMainToggle);
    document.getElementById(ELEMENTS.MAIN_TIMER_DISPLAY).addEventListener('click', handleSetTimeClick);
    document.getElementById(ELEMENTS.ADD_TASK_BTN).addEventListener('click', handleAddTask);
    document.getElementById(ELEMENTS.ADD_MANUAL_TASK_BTN).addEventListener('click', handleManualTaskClick);
    document.getElementById(ELEMENTS.TASK_LIST).addEventListener('click', handleTaskListClick);
}

// --- Ponto de Entrada da Aplicação ---
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'UPDATE_STATE') {
        setState(message.payload);
        renderFullUI(); // Renderiza tudo quando o estado muda fundamentalmente
    }
});

document.addEventListener('DOMContentLoaded', () => {
    request('GET_STATE', {}, (initialState) => {
        setState(initialState);
        renderFullUI();
        
        ui.updateClock();
        setInterval(ui.updateClock, 1000);
        
        // Inicia o loop de atualização da UI
        if (uiRefreshInterval) clearInterval(uiRefreshInterval);
        uiRefreshInterval = setInterval(tickUI, 1000);
        
        addEventListeners();
    });
});