import { ref, onMounted } from 'vue'
import { useTimerStore } from './stores/timerStore' // Corrigido: caminho relativo

export default {
  setup() {
    const timerStore = useTimerStore()
    const setTimeInputValue = ref('') // Para guardar o valor do input 'hh:mm'

    // Lógica do Relógio da UI
    const currentDate = ref('')
    const currentTime = ref('')
    let clockInterval = null

    const updateClock = () => {
      const now = new Date()
      const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
      currentDate.value = now.toLocaleDateString('pt-BR', dateOptions)
      currentTime.value = now.toLocaleTimeString('pt-BR')
    }

    // Lógica de Manipulação de Tarefas (UI)
    const newTaskName = ref('')

    function handleAddTask() {
      if (newTaskName.value.trim()) {
        timerStore.addTask(newTaskName.value.trim())
        newTaskName.value = ''
      }
    }

    function handleEditTask(task) {
      const newName = prompt('Digite o novo nome da tarefa:', task.name)
      if (newName && newName.trim() !== '') {
        timerStore.updateTaskName(task.id, newName.trim())
      }
    }

    // Lógica do Modal de Tarefa Manual
    const showManualTaskModal = ref(false)
    const manualTask = ref({
      name: '',
      hours: null,
      minutes: null,
      startTime: '',
      endTime: '',
    })
    const manualEntryMode = ref('duration') // 'duration' ou 'period'

    function handleManualTaskConfirm() {
      let totalSeconds = 0
      if (manualEntryMode.value === 'duration') {
        const hours = manualTask.value.hours || 0
        const minutes = manualTask.value.minutes || 0
        totalSeconds = hours * 3600 + minutes * 60
      } else {
        if (manualTask.value.startTime && manualTask.value.endTime) {
          const start = new Date(`1970-01-01T${manualTask.value.startTime}`)
          const end = new Date(`1970-01-01T${manualTask.value.endTime}`)
          if (end > start) {
            totalSeconds = (end - start) / 1000
          }
        }
      }

      if (manualTask.value.name.trim() && totalSeconds > 0) {
        // A action agora recebe um objeto diferente
        timerStore.addManualTask({
          name: manualTask.value.name,
          totalSeconds: totalSeconds,
        })
        // Reseta o formulário e fecha o modal
        manualTask.value = { name: '', hours: null, minutes: null, startTime: '', endTime: '' }
        showManualTaskModal.value = false
      } else {
        alert('Por favor, preencha o nome e um tempo válido.')
      }
    }

    // Lógica do Modal de Início do Dia
    const showSetTimeModal = ref(false)

    function handleSetTimeClick() {
      showSetTimeModal.value = true
    }

    function handleSetTimeConfirm() {
      if (!setTimeInputValue.value) return // Não faz nada se estiver vazio
      const [hours, minutes] = setTimeInputValue.value.split(':')
      timerStore.setMainTimerManually(hours, minutes)
      showSetTimeModal.value = false
      setTimeInputValue.value = '' // Limpa o valor para a próxima vez
    }

    // Função auxiliar para o template
    function formatTime(seconds) {
      if (isNaN(seconds) || seconds < 0) seconds = 0
      const h = Math.floor(seconds / 3600)
      const m = Math.floor((seconds % 3600) / 60)
      const s = Math.floor(seconds % 60)
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    }

    function formatCreationDate(timestamp) {
      // Proteção para tarefas antigas que não têm data de criação
      if (!timestamp) {
        return '' // Retorna uma string vazia se não houver timestamp
      }

      const date = new Date(timestamp)
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

      if (date.toDateString() === today.toDateString()) return `Hoje, ${time}`
      if (date.toDateString() === yesterday.toDateString()) return `Ontem, ${time}`
      return date.toLocaleDateString('pt-BR')
    }

    // Ciclo de Vida e Persistência
    onMounted(() => {
      updateClock()
      clockInterval = setInterval(updateClock, 1000)
      timerStore.initialize()

      // Salva o estado a cada mudança
      timerStore.$subscribe(() => {
        timerStore.saveState()
      })
    })

    return {
      timerStore,
      currentDate,
      currentTime,
      newTaskName,
      handleAddTask,
      handleEditTask,
      showManualTaskModal,
      manualTask,
      handleManualTaskConfirm,
      formatTime,
      showSetTimeModal,
      handleSetTimeClick,
      handleSetTimeConfirm,
      manualEntryMode,
      setTimeInputValue,
      formatCreationDate,
    }
  },
}
