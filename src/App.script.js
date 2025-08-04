import { ref, onMounted, reactive } from 'vue'

export default {
  setup() {
    const timerStore = reactive({
      mainTimer: { isRunning: false, elapsedTime: 0 },
      tasks: [],
      formattedMainTime: '00:00:00',
      formattedCompletedTasksTotal: '00:00:00',
      todaysTasks: [],
    })
    const authStore = reactive({
      isLoggedIn: false,
      user: null,
    })

    function request(action, payload = {}) {
      if (window.chrome && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ action, payload })
      } else {
        console.warn(`Modo de desenvolvimento: Ação '${action}' não foi enviada.`)
      }
    }

    // --- Lógica do Relógio da UI ---
    const currentDate = ref('')
    const currentTime = ref('')
    let clockInterval = null
    const updateClock = () => {
      const now = new Date()
      const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
      currentDate.value = now.toLocaleDateString('pt-BR', dateOptions)
      currentTime.value = now.toLocaleTimeString('pt-BR')
    }

    // --- Handlers de Autenticação ---
    const isProfileMenuOpen = ref(false)
    function handleLogin() {
      request('loginWithGoogle')
    }
    function handleLogout() {
      request('logout')
      isProfileMenuOpen.value = false // Fecha o menu
    }
    function toggleProfileMenu() {
      isProfileMenuOpen.value = !isProfileMenuOpen.value
    }

    // --- Handlers das Tarefas ---
    const newTaskName = ref('')
    function handleAddTask() {
      if (newTaskName.value.trim()) {
        request('addTask', { name: newTaskName.value.trim() })
        newTaskName.value = ''
      }
    }

    function handleEditTask(task) {
      const newName = prompt('Digite o novo nome da tarefa:', task.name)
      if (newName && newName.trim() !== '') {
        request('updateTaskName', { id: task.id, newName: newName.trim() })
      }
    }

    function handleToggleTask(taskId) {
      request('toggleTask', { id: taskId })
    }
    function handleDeleteTask(taskId) {
      if (confirm('Tem a certeza de que deseja excluir esta tarefa?')) {
        request('deleteTask', { id: taskId })
      }
    }
    function handleCompleteTask(taskId) {
      request('completeTask', { id: taskId })
    }

    const showManualTaskModal = ref(false)
    const manualTask = ref({ name: '', hours: null, minutes: null, startTime: '', endTime: '' })
    const manualEntryMode = ref('duration')
    function handleManualTaskConfirm() {
      const payload = {
        entryMode: manualEntryMode.value,
        taskData: manualTask.value,
      }
      request('addManualTask', payload)
      manualTask.value = { name: '', hours: null, minutes: null, startTime: '', endTime: '' }
      showManualTaskModal.value = false
    }

    const showSetTimeModal = ref(false)
    const setTimeInputValue = ref('')
    function handleSetTimeClick() {
      showSetTimeModal.value = true
    }
    function handleSetTimeConfirm() {
      if (!setTimeInputValue.value) return
      const [hours, minutes] = setTimeInputValue.value.split(':')
      request('setMainTimerManually', { hours, minutes })
      showSetTimeModal.value = false
      setTimeInputValue.value = ''
    }

    function handleToggleMainTimer() {
      request('toggleMainTimer')
    }

    // Função auxiliar para formatar o tempo de segundos para HH:MM:SS
    function formatTime(seconds) {
      if (isNaN(seconds) || seconds < 0) seconds = 0
      const h = Math.floor(seconds / 3600)
      const m = Math.floor((seconds % 3600) / 60)
      const s = Math.floor(seconds % 60)
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    }

    // Função auxiliar para formatar a data de criação da tarefa
    function formatCreationDate(timestamp) {
      if (!timestamp) return ''
      const date = new Date(timestamp)
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

      if (date.toDateString() === today.toDateString()) return `Hoje, ${time}`
      if (date.toDateString() === yesterday.toDateString()) return `Ontem, ${time}`
      return date.toLocaleDateString('pt-BR')
    }

    // --- Ciclo de Vida e Comunicação ---
    onMounted(() => {
      updateClock()
      clockInterval = setInterval(updateClock, 1000)

      if (window.chrome && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.addListener((message) => {
          if (message.type === 'STATE_UPDATE' && message.state) {
            Object.assign(timerStore, message.state)
            Object.assign(authStore, message.state)
          }
        })
      }

      request('GET_INITIAL_STATE')
    })

    return {
      authStore,
      timerStore,
      currentDate,
      currentTime,
      newTaskName,
      handleAddTask,
      handleEditTask,
      handleToggleTask,
      handleDeleteTask,
      handleCompleteTask,
      handleToggleMainTimer,
      handleSetTimeClick,
      handleSetTimeConfirm,
      handleManualTaskConfirm,
      handleLogin,
      handleLogout,
      toggleProfileMenu,
      isProfileMenuOpen,
      manualTask,
      manualEntryMode,
      showManualTaskModal,
      showSetTimeModal,
      setTimeInputValue,
      formatTime,
      formatCreationDate,
    }
  },
}
