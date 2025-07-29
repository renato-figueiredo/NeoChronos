// background.js

let state = {
  mainTimer: { isRunning: false, startTime: null, elapsedTime: 0 },
  tasks: [],
  completedTasksTotal: 0,
};

// --- Carregamento e Persistência ---
const STORAGE_KEY = 'neoChronosState';

// Carrega o estado ao iniciar
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get(STORAGE_KEY, (result) => {
    if (result[STORAGE_KEY]) {
      state = result[STORAGE_KEY];
    }
  });
});

function saveState() {
  chrome.storage.local.set({ [STORAGE_KEY]: state });
}

// --- Lógica Principal dos Timers ---
setInterval(() => {
    let stateChanged = false;
    
    // Verifica o timer principal
    if (state.mainTimer.isRunning) {
        const now = Date.now();
        state.mainTimer.elapsedTime = Math.floor((now - state.mainTimer.startTime) / 1000);
        stateChanged = true;
    }

    // Verifica os timers das tarefas
    state.tasks.forEach(task => {
        if (task.status === 'running') {
            const now = Date.now();
            task.elapsedTime = Math.floor((now - task.startTime) / 1000);
            stateChanged = true;
        }
    });

    if (stateChanged) {
        // Envia o estado atualizado para o popup, se ele estiver aberto
        chrome.runtime.sendMessage({ type: 'UPDATE_STATE', payload: state });
    }
}, 1000);

// --- Ouvinte de Mensagens (Onde a Mágica Acontece) ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { type, payload } = message;
  let task;

  switch (type) {
    case 'GET_STATE':
      sendResponse(state);
      break;

    // Timer Principal
    case 'START_MAIN_TIMER':
      if (!state.mainTimer.isRunning) {
        state.mainTimer.isRunning = true;
        state.mainTimer.startTime = Date.now() - (state.mainTimer.elapsedTime * 1000);
      }
      break;
    case 'STOP_MAIN_TIMER':
      if (state.mainTimer.isRunning) {
        state.mainTimer.isRunning = false;
      }
      break;
    case 'SET_MAIN_TIMER':
      const now = new Date();
      const startTime = new Date();
      startTime.setHours(payload.hours, payload.minutes, 0, 0);
      if (startTime <= now) {
        state.mainTimer.elapsedTime = Math.floor((now - startTime) / 1000);
        if (state.mainTimer.isRunning) {
            state.mainTimer.startTime = Date.now() - (state.mainTimer.elapsedTime * 1000);
        }
      }
      break;

    // Tarefas
    case 'ADD_TASK':
      state.tasks.push({ id: Date.now(), name: payload.name, status: 'paused', elapsedTime: 0 });
      break;
    case 'ADD_MANUAL_TASK':
      const totalSeconds = (payload.hours * 3600) + (payload.minutes * 60);
      state.tasks.push({ id: Date.now(), name: payload.name, status: 'completed', elapsedTime: totalSeconds });
      state.completedTasksTotal += totalSeconds;
      break;
    case 'TOGGLE_TASK':
      task = state.tasks.find(t => t.id === payload.id);
      if (task) {
        if (task.status === 'running') {
          task.status = 'paused';
        } else if (task.status === 'paused') {
          task.status = 'running';
          task.startTime = Date.now() - (task.elapsedTime * 1000);
        }
      }
      break;
    case 'UPDATE_TASK_NAME':
      task = state.tasks.find(t => t.id === payload.id);
      if(task) task.name = payload.newName;
      break;
    case 'DELETE_TASK':
      task = state.tasks.find(t => t.id === payload.id);
      if (task) {
        // CORREÇÃO: Subtrai o tempo se a tarefa concluída for deletada
        if(task.status === 'completed') {
            state.completedTasksTotal -= task.elapsedTime;
        }
        state.tasks = state.tasks.filter(t => t.id !== payload.id);
      }
      break;
    case 'COMPLETE_TASK':
      task = state.tasks.find(t => t.id === payload.id);
      if(task && task.status !== 'completed') {
        if(task.status === 'running') task.status = 'paused';
        task.status = 'completed';
        state.completedTasksTotal += task.elapsedTime;
      }
      break;
  }

  saveState();
  // Envia o estado atualizado para o popup
  chrome.runtime.sendMessage({ type: 'UPDATE_STATE', payload: state });
  sendResponse(state); // Confirma recebimento
  return true;
});