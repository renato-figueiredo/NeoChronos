// src/stores/timerStore.js
import { defineStore } from 'pinia'

const STORAGE_KEY = 'neoChronosState';

function formatTime(totalSeconds) {
    if (isNaN(totalSeconds) || totalSeconds < 0) totalSeconds = 0;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
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
            .filter(task => task.status === 'completed')
            .reduce((total, task) => total + task.elapsedTime, 0);
    },
    formattedCompletedTasksTotal() {
        return formatTime(this.completedTasksTotal);
    },
    todaysTasks: (state) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Define a hora para o início do dia

        return state.tasks.filter(task => {
            // Se a tarefa não está completa, mostre sempre
            if (task.status !== 'completed') {
                return true;
            }
            // Se está completa, mostre apenas se foi criada hoje
            return task.createdAt >= today.getTime();
        });
    }
  },

  actions: {
    _tick() {
      if (this.mainTimer.isRunning) {
        this.mainTimer.elapsedTime = Math.floor((Date.now() - this.mainTimer.startTime) / 1000);
      }
      this.tasks.forEach(task => {
        if (task.status === 'running') {
          task.elapsedTime = Math.floor((Date.now() - task.startTime) / 1000);
        }
      });
    },

    initialize() {
      this.loadState(); 
      if (this._intervalId) clearInterval(this._intervalId);
      this._intervalId = setInterval(() => this._tick(), 1000);
    },

    // --- Ações do Timer Principal ---
    toggleMainTimer() {
        this.mainTimer.isRunning = !this.mainTimer.isRunning;
        if (this.mainTimer.isRunning) {
            this.mainTimer.startTime = Date.now() - (this.mainTimer.elapsedTime * 1000);
        }
    },

    setMainTimerManually(hours, minutes) {
        const now = new Date();
        const startTime = new Date();
        startTime.setHours(Number(hours), Number(minutes), 0, 0);

        if (startTime > now) {
            alert("A hora de início não pode ser no futuro.");
            return;
        }
        
        const diffInSeconds = Math.floor((now - startTime) / 1000);
        this.mainTimer.elapsedTime = diffInSeconds;

        if(this.mainTimer.isRunning) {
            this.mainTimer.startTime = Date.now() - (this.mainTimer.elapsedTime * 1000);
        }
    },

    // --- Ações das Tarefas ---
    // (O resto das ações de tarefa continuam as mesmas da versão anterior)
    addTask(name) {
        this.tasks.push({ 
            id: Date.now(), 
            name: name, 
            status: 'paused', 
            elapsedTime: 0, 
            startTime: 0,
            createdAt: Date.now(),
        });
    },
    addManualTask({ name, totalSeconds }) {
        if (!name || totalSeconds <= 0) return;
        this.tasks.push({
            id: Date.now(),
            name: name,
            status: 'completed',
            elapsedTime: totalSeconds,
            createdAt: Date.now(),
        });
    },
    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task || task.status === 'completed') return;
        task.status = (task.status === 'running') ? 'paused' : 'running';
        if (task.status === 'running') {
            task.startTime = Date.now() - (task.elapsedTime * 1000);
        }
    },
    deleteTask(taskId) {
        this.tasks = this.tasks.filter(t => t.id !== taskId);
    },
    completeTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task && task.status !== 'completed') {
            if (task.status === 'running') task.status = 'paused';
            task.status = 'completed';
        }
    },
    updateTaskName(taskId, newName) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) task.name = newName;
    },

    // --- Ações de Persistência (CORRIGIDAS) ---
    saveState() {
      const stateToSave = { ...this.$state, _intervalId: null };
      
      // Verifica se a API do Chrome está disponível
      if (window.chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ [STORAGE_KEY]: stateToSave });
      } else {
        // Se não, usa o localStorage (para o ambiente de dev)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
      }
    },

    loadState() {
      // Verifica se a API do Chrome está disponível
      if (window.chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(STORAGE_KEY, (result) => {
          if (result[STORAGE_KEY]) {
            this.processLoadedState(result[STORAGE_KEY]);
          }
        });
      } else {
        // Se não, usa o localStorage
        const savedState = localStorage.getItem(STORAGE_KEY);
        if (savedState) {
          try {
            this.processLoadedState(JSON.parse(savedState));
          } catch (e) {
            console.error("Erro ao carregar o estado do localStorage:", e);
          }
        }
      }
    },
    
    // Função auxiliar para processar o estado carregado
    processLoadedState(savedState) {
        // Pausa todos os timers ao carregar para evitar contagem em background
        savedState.mainTimer.isRunning = false;
        savedState.tasks.forEach(t => {
            if (t.status === 'running') t.status = 'paused';
        });
        this.$patch(savedState);
    }
  }
})