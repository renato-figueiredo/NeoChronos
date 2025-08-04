import { defineStore } from 'pinia'

const STORAGE_KEY = 'neoChronosState'

function formatTime(totalSeconds) {
  if (isNaN(totalSeconds) || totalSeconds < 0) totalSeconds = 0
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = Math.floor(totalSeconds % 60)
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export const useTimerStore = defineStore('timer', {
  state: () => ({
    mainTimer: { isRunning: false, startTime: 0, elapsedTime: 0 },
    tasks: [],
    _intervalId: null,
  }),

  getters: {
    formattedMainTime: (state) => formatTime(state.mainTimer.elapsedTime),
    completedTasksTotal: (state) => {
      return state.tasks
        .filter((task) => task.status === 'completed')
        .reduce((total, task) => total + task.elapsedTime, 0)
    },
    formattedCompletedTasksTotal() {
      return formatTime(this.completedTasksTotal)
    },
    todaysTasks: (state) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return state.tasks.filter((task) => {
        if (task.status !== 'completed') return true
        return task.createdAt >= today.getTime()
      })
    },
  },

  actions: {
    _tick() {
      if (this.mainTimer.isRunning) {
        this.mainTimer.elapsedTime = Math.floor((Date.now() - this.mainTimer.startTime) / 1000)
      }
      this.tasks.forEach((task) => {
        if (task.status === 'running') {
          task.elapsedTime = Math.floor((Date.now() - task.startTime) / 1000)
        }
      })
    },

    initialize() {
      this.loadState()
      if (this._intervalId) clearInterval(this._intervalId)
      this._intervalId = setInterval(() => this._tick(), 1000)
    },

    toggleMainTimer() {
      this.mainTimer.isRunning = !this.mainTimer.isRunning
      if (this.mainTimer.isRunning) {
        this.mainTimer.startTime = Date.now() - this.mainTimer.elapsedTime * 1000
      }
    },

    setMainTimerManually(payload) {
      const hours = payload.hours
      const minutes = payload.minutes

      const now = new Date()
      const startTime = new Date()
      startTime.setHours(Number(hours), Number(minutes), 0, 0)
      if (startTime > now) return alert('A hora de início não pode ser no futuro.')
      const diffInSeconds = Math.floor((now - startTime) / 1000)
      this.mainTimer.elapsedTime = diffInSeconds
      if (this.mainTimer.isRunning) {
        this.mainTimer.startTime = Date.now() - this.mainTimer.elapsedTime * 1000
      }
    },

    addTask(payload) {
      const name = payload.name
      this.tasks.push({
        id: Date.now(),
        name: name,
        status: 'paused',
        elapsedTime: 0,
        startTime: 0,
        createdAt: Date.now(),
      })
    },

    addManualTask(payload) {
      const entryMode = payload.entryMode
      const taskData = payload.taskData
      let totalSeconds = 0
      if (entryMode === 'duration') {
        const hours = taskData.hours || 0
        const minutes = taskData.minutes || 0
        totalSeconds = hours * 3600 + minutes * 60
      } else {
        if (taskData.startTime && taskData.endTime) {
          const start = new Date(`1970-01-01T${taskData.startTime}`)
          const end = new Date(`1970-01-01T${taskData.endTime}`)
          if (end > start) totalSeconds = (end - start) / 1000
        }
      }

      if (taskData.name && taskData.name.trim() && totalSeconds > 0) {
        this.tasks.push({
          id: Date.now(),
          name: taskData.name,
          status: 'completed',
          elapsedTime: totalSeconds,
          createdAt: Date.now(),
        })
      }
    },

    toggleTask(payload) {
      const taskId = payload.id
      const task = this.tasks.find((t) => t.id === taskId)
      if (!task || task.status === 'completed') return
      task.status = task.status === 'running' ? 'paused' : 'running'
      if (task.status === 'running') {
        task.startTime = Date.now() - task.elapsedTime * 1000
      }
    },

    deleteTask(payload) {
      const taskId = payload.id
      this.tasks = this.tasks.filter((t) => t.id !== taskId)
    },

    completeTask(payload) {
      const taskId = payload.id
      const task = this.tasks.find((t) => t.id === taskId)
      if (task && task.status !== 'completed') {
        if (task.status === 'running') task.status = 'paused'
        task.status = 'completed'
      }
    },

    updateTaskName(payload) {
      const newName = payload.newName
      const id = payload.id

      const task = this.tasks.find((t) => t.id === id)
      if (task) {
        task.name = newName
      }
    },

    saveState() {
      const stateToSave = { ...this.$state, _intervalId: null }
      chrome.storage.local.set({ [STORAGE_KEY]: stateToSave })
    },

    loadState() {
      chrome.storage.local.get(STORAGE_KEY, (result) => {
        if (result[STORAGE_KEY]) {
          this.processLoadedState(result[STORAGE_KEY])
        }
      })
    },

    processLoadedState(savedState) {
      if (savedState && savedState.mainTimer && Array.isArray(savedState.tasks)) {
        savedState.mainTimer.isRunning = false
        savedState.tasks.forEach((t) => {
          if (t.status === 'running') t.status = 'paused'
        })
        this.$patch(savedState)
      } else {
        console.warn('Estado salvo inválido ou corrompido. A começar com um estado limpo.')
        chrome.storage.local.remove(STORAGE_KEY)
      }
    },
  },
})
