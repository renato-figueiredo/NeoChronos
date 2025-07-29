// js/state.js
// O estado agora é um espelho do que está no background.
// Ele é atualizado via mensagens.
export let state = {
  mainTimer: { isRunning: false, elapsedTime: 0 },
  tasks: [],
  completedTasksTotal: 0,
};

// Função para atualizar o estado local com dados vindos do background
export function setState(newState) {
    if(newState) {
      Object.assign(state, newState);
    }
}