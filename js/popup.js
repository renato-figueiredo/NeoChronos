document.addEventListener('DOMContentLoaded', () => {
    // Referências aos elementos principais
    const mainToggleButton = document.getElementById('main-toggle');
    const mainTimerDisplay = document.getElementById('main-timer-display');
    
    const addTaskBtn = document.getElementById('add-task-btn');
    const newTaskNameInput = document.getElementById('new-task-name');
    const taskList = document.getElementById('task-list');

    // --- LÓGICA DO CRONÔMETRO PRINCIPAL ---
    mainToggleButton.addEventListener('click', () => {
        console.log('Botão do cronômetro principal clicado!');
        // Futuramente: Adicionar lógica para iniciar/pausar o cronômetro geral.
    });

    // --- LÓGICA DAS TAREFAS ---
    addTaskBtn.addEventListener('click', () => {
        const taskName = newTaskNameInput.value;
        if (taskName) {
            console.log(`Adicionando nova tarefa: ${taskName}`);
            // Futuramente: Chamar a função que cria o elemento da tarefa no HTML.
            newTaskNameInput.value = ''; // Limpa o campo
        }
    });

    // O "ouvinte" para os botões de play/pause e concluir das tarefas
    // será adicionado dinamicamente quando criarmos as tarefas.
});