# ⏱️ NeoChronos - Focus Timer

## 📖 Sobre o Projeto

**NeoChronos** é uma extensão para o Google Chrome desenhada para ajudar profissionais e estudantes a gerir o seu tempo de trabalho e a manter o foco.  
Com um design moderno e intuitivo baseado em **neomorfismo**, a ferramenta permite cronometrar o dia de trabalho e as tarefas individuais de forma eficiente.

Esta versão (`v1.0.0`) funciona de forma totalmente local, usando um **Service Worker** para garantir que os timers continuem a contar mesmo quando o popup da extensão está fechado.

---

## ✨ Funcionalidades (v1.0.0)

- **Cronômetro Principal**: Registe a duração total do seu dia de trabalho.
- **Gestão de Tarefas**: Crie, inicie, pause, edite, complete e apague tarefas individuais.
- **Timers em Background**: Graças ao _Service Worker_, os seus timers não param, mesmo com o popup fechado.
- **Persistência de Dados**: O seu progresso é guardado localmente no armazenamento do Chrome.
- **Adição Manual**: Esqueceu-se de cronometrar uma tarefa? Adicione-a manualmente, seja por duração (ex: `1h 30m`) ou por período (ex: `14:00 às 15:30`).
- **Ciclo de Vida Inteligente**: Mostra apenas as tarefas ativas ou concluídas no dia, mantendo a interface limpa.
- **Design Neomórfico**: Interface suave, moderna e agradável de usar.

---

## 🛠️ Tecnologias Utilizadas

- **Vue.js 3** — Framework reativo para a interface.
- **Pinia** — Gestão de estado centralizada.
- **Vite** — Build tool rápida e moderna.
- **JavaScript (ES6+)** — Lógica principal.
- **HTML5 & CSS3** — Estrutura e estilo.
- **Chrome Extension APIs** — Integração com `chrome.storage`, `Service Worker` e mais.

---

## 🚀 Como Testar

1. Clone ou faça o download deste repositório.
2. Execute `npm install` para instalar as dependências.
3. Execute `npm run build` para compilar a extensão. Isso irá gerar uma pasta `dist/`.
4. Abra o Google Chrome e acesse `chrome://extensions`.
5. Ative o **Modo de Desenvolvedor** no canto superior direito.
6. Clique em **Carregar sem compactação** e selecione a pasta `dist/`.
7. O ícone do **NeoChronos** aparecerá na sua barra de ferramentas!

---

