// src/service-worker.js

import { createPinia } from 'pinia'
import { useTimerStore } from './stores/timerStore'
import { useAuthStore } from './stores/authStore'

const pinia = createPinia()

const timerStore = useTimerStore(pinia)
const authStore = useAuthStore(pinia)

timerStore.initialize()
authStore.listenForAuthStateChanges()

console.log('Service Worker ativo. Stores de Timer e Auth carregadas.')

function broadcastState() {
  const currentState = {
    ...timerStore.$state,
    formattedMainTime: timerStore.formattedMainTime,
    formattedCompletedTasksTotal: timerStore.formattedCompletedTasksTotal,
    todaysTasks: timerStore.todaysTasks,
    user: authStore.user,
    isLoggedIn: authStore.isLoggedIn,
  }
  chrome.runtime.sendMessage({ type: 'STATE_UPDATE', state: currentState })
}

// OUVINTE DE MENSAGENS REATORIZADO E SIMPLIFICADO
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { action, payload } = message

  console.log(message)
  if (action === 'GET_INITIAL_STATE') {
    // Apenas transmite o estado no final
  }
  // Verifica se a ação existe na timerStore e executa-a
  else if (typeof timerStore[action] === 'function') {
    console.log(`Action '${action}' recebida com payload:`, payload)
    timerStore[action](payload)
  }
  // Se não, verifica se a ação existe na authStore e executa-a
  else if (typeof authStore[action] === 'function') {
    console.log(`Action '${action}' recebida com payload:`, payload)
    authStore[action](payload)
  }
  // Se não for encontrada em nenhuma store
  else {
    console.warn(`Ação desconhecida recebida: '${action}'`)
  }

  broadcastState()
})

setInterval(() => {
  if (timerStore.mainTimer.isRunning || timerStore.tasks.some((t) => t.status === 'running')) {
    broadcastState()
  }
}, 1000)

authStore.$subscribe(() => {
  broadcastState()
})
