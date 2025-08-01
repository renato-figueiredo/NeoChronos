import { createPinia } from 'pinia';
import { useTimerStore } from './stores/timerStore';

const pinia = createPinia();
const timerStore = useTimerStore(pinia);

timerStore.initialize();
console.log("Service Worker ativo e store Pinia carregada.");

function broadcastState() {
  const currentState = {
    ...timerStore.$state,
    formattedMainTime: timerStore.formattedMainTime,
    formattedCompletedTasksTotal: timerStore.formattedCompletedTasksTotal,
    todaysTasks: timerStore.todaysTasks
  };
  chrome.runtime.sendMessage({ type: 'STATE_UPDATE', state: currentState });
}

// OUVINTE DE MENSAGENS
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const { action, payload } = message;

    switch (action) {
        case 'GET_INITIAL_STATE':
            // Não faz nada aqui, apenas transmite o estado no final
            break;
        case 'toggleMainTimer':
            timerStore.toggleMainTimer();
            break;
        case 'setMainTimerManually':
            timerStore.setMainTimerManually(payload.hours, payload.minutes);
            break;
        case 'addTask':
            timerStore.addTask(payload.name); 
            break;
        case 'addManualTask':
            timerStore.addManualTask(payload); 
            break;
        case 'toggleTask':
            timerStore.toggleTask(payload.id); 
            break;
        case 'deleteTask':
            timerStore.deleteTask(payload.id); 
            break;
        case 'completeTask':
            timerStore.completeTask(payload.id); 
            break;
        case 'updateTaskName':
            timerStore.updateTaskName(payload);
            break;
        default:
            console.warn(`Ação desconhecida recebida: '${action}'`);
    }

    broadcastState();
});

setInterval(() => {
    if (timerStore.mainTimer.isRunning || timerStore.tasks.some(t => t.status === 'running')) {
        broadcastState();
    }
}, 1000);
