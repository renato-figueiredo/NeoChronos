// js/ui.js
import { ELEMENTS } from './constants.js';
import { formatTime } from './timer.js';

// Pegando os elementos do DOM
const dateDisplay = document.getElementById(ELEMENTS.DATE_DISPLAY);
const timeDisplay = document.getElementById(ELEMENTS.TIME_DISPLAY);
const mainTimerDisplay = document.getElementById(ELEMENTS.MAIN_TIMER_DISPLAY);
const taskList = document.getElementById(ELEMENTS.TASK_LIST);
const completedTasksTotalDisplay = document.getElementById(ELEMENTS.COMPLETED_TASKS_TOTAL);
const mainToggleBtn = document.getElementById(ELEMENTS.MAIN_TOGGLE_BTN);

// --- Funções de Display de Tempo e Relógio ---

export function updateClock() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateDisplay.textContent = now.toLocaleDateString('pt-BR', options);
    timeDisplay.textContent = now.toLocaleTimeString('pt-BR');
}

export function updateMainTimerDisplay(timeInSeconds = 0) {
    mainTimerDisplay.textContent = formatTime(timeInSeconds);
}

export function updateCompletedTasksTotalDisplay(totalSeconds = 0) {
    completedTasksTotalDisplay.textContent = formatTime(totalSeconds);
}

export function toggleMainTimerButton(isRunning) {
    mainToggleBtn.innerHTML = isRunning ? '<i class="bi bi-pause-fill"></i>' : '<i class="bi bi-play-fill"></i>';
}

// --- Renderização da Lista de Tarefas ---

export function renderTasks(tasks = []) {
    taskList.innerHTML = ''; 

    if (tasks.length === 0) {
        taskList.innerHTML = `<li class="empty-state">Nenhuma tarefa ainda. Adicione uma!</li>`;
        return;
    }

    tasks.forEach(task => {
        const isCompleted = task.status === 'completed';
        const li = document.createElement('li');
        li.className = `card task-card ${isCompleted ? 'completed' : ''}`;
        li.dataset.taskId = task.id;

        const playPauseIcon = task.status === 'running' ? 'bi-pause-circle-fill' : 'bi-play-circle-fill';

        li.innerHTML = `
            <div class="task-card-top">
                <span class="task-name">${task.name}</span>
                <button class="neumorphic-button-outset task-delete" title="Excluir Tarefa">
                    <i class="bi bi-trash3-fill"></i>
                </button>
            </div>
            <div class="task-card-bottom">
                <span class="timer-display task-timer">${formatTime(task.elapsedTime)}</span>
                <div class="task-controls">
                    <button class="neumorphic-button-outset task-toggle" title="Iniciar/Pausar" ${isCompleted ? 'style="display: none;"' : ''}>
                        <i class="bi ${playPauseIcon}"></i>
                    </button>
                    <button class="neumorphic-button-outset task-edit" title="Editar Nome" ${isCompleted ? 'style="display: none;"' : ''}>
                        <i class="bi bi-pencil-fill"></i>
                    </button>
                    <button class="neumorphic-button-outset task-complete" title="Concluir Tarefa" ${isCompleted ? 'style="display: none;"' : ''}>
                        <i class="bi bi-check-circle-fill"></i>
                    </button>
                </div>
            </div>
        `;
        taskList.appendChild(li);
    });
}

// --- Funções de Modal Dinâmico ---

function createModal(id, title, contentHTML, onConfirm, confirmText = 'Confirmar') {
    const existingOverlay = document.getElementById('modal-overlay');
    if (existingOverlay) existingOverlay.remove();

    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'modal-overlay';
    modalOverlay.className = 'modal-overlay';

    const modalContent = document.createElement('div');
    modalContent.id = id;
    modalContent.className = 'modal-content';

    modalContent.innerHTML = `
        <h4>${title}</h4>
        ${contentHTML}
        <div class="modal-actions">
            <button id="modal-cancel-btn" class="neumorphic-button-outset">Cancelar</button>
            <button id="modal-confirm-btn" class="neumorphic-button-outset primary-action">${confirmText}</button>
        </div>
    `;

    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    const closeModal = () => modalOverlay.remove();
    
    document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target.id === 'modal-overlay') closeModal();
    });
    document.getElementById('modal-confirm-btn').addEventListener('click', () => {
        if (onConfirm()) {
            closeModal();
        }
    });
}

export function showSetTimeModal(onConfirm) {
    const content = `
        <p>Digite a hora que você começou a trabalhar (ex: 09:00).</p>
        <input type="time" id="modal-time-input" class="neumorphic-input">
    `;
    createModal('set-start-time-modal', 'Definir Horário de Início', content, () => {
        const input = document.getElementById('modal-time-input');
        if (!input.value) return false;
        const [hours, minutes] = input.value.split(':').map(Number);
        if (!isNaN(hours) && !isNaN(minutes)) {
            onConfirm(hours, minutes);
            return true;
        }
        return false;
    });
}

export function showManualTaskModal(onConfirm) {
    const content = `
        <p>Preencha os dados da tarefa que já foi concluída.</p>
        <input type="text" id="modal-task-name" class="neumorphic-input" placeholder="Nome da tarefa...">
        <div class="manual-time-inputs">
            <input type="number" id="modal-task-hours" class="neumorphic-input" placeholder="Horas" min="0">
            <input type="number" id="modal-task-minutes" class="neumorphic-input" placeholder="Minutos" min="0" max="59">
        </div>
    `;
    createModal('add-manual-task-modal', 'Adicionar Tarefa Manual', content, () => {
        const name = document.getElementById('modal-task-name').value;
        const hours = Number(document.getElementById('modal-task-hours').value) || 0;
        const minutes = Number(document.getElementById('modal-task-minutes').value) || 0;
        if (name.trim() && (hours > 0 || minutes > 0)) {
            onConfirm(name.trim(), hours, minutes);
            return true;
        }
        alert("Por favor, preencha o nome e um tempo válido.");
        return false;
    }, 'Adicionar');
}

export function updateTaskTimerDisplay(taskId, timeInSeconds) {
    const taskElement = document.querySelector(`.task-card[data-task-id="${taskId}"]`);
    if (taskElement) {
        const timerDisplay = taskElement.querySelector('.task-timer');
        if (timerDisplay) {
            timerDisplay.textContent = formatTime(timeInSeconds);
        }
    }
}