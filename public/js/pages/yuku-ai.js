/**
 * /public/js/pages/yuku-ai.js
 * * FINAL PRODUCTION-READY VERSION (v5)
 * Features: Custom SVG Icons, Code Editor Input, Code Editing Logic,
 * Copy/Regenerate, Loader, Welcome Prompts, All Bugs Fixed.
 * NO EXTERNAL ICON LIBRARIES.
 */
function initYukuAiPage() {
    
    // === 1. DOM SELECTORS ===
    const ui = {
        drawer: document.getElementById('sidebar-drawer'),
        backdrop: document.getElementById('sidebar-backdrop'),
        hamburgerBtn: document.getElementById('hamburger-btn'),
        closeDrawerBtn: document.getElementById('close-drawer-btn'),
        
        agentName: document.getElementById('agent-name'),
        newChatBtn: document.getElementById('new-chat-btn'),
        chatList: document.getElementById('chat-list-container'),
        
        chatHistory: document.getElementById('chat-history'),
        chatTitle: document.getElementById('chat-title'),
        chatStatus: document.getElementById('chat-status'),
        chatAvatar: document.getElementById('chat-avatar'),
        welcomeEl: document.getElementById('welcome'),
        welcomePrompts: document.getElementById('welcome-prompts'),
        
        composer: document.getElementById('composer'),
        promptInput: document.getElementById('ai-prompt-input'),
        executeBtn: document.getElementById('ai-execute-btn'),
        
        toolSelectBtn: document.getElementById('tool-select-btn'),
        toolChipPopup: document.getElementById('tool-chip-popup'),
        
        codeSection: document.getElementById('code-section'),
        fileTabs: document.getElementById('file-tabs'),
        codeEditorContainer: document.getElementById('code-editor-container'),
        copyCodeBtn: document.getElementById('copy-code-btn'),
        previewBtn: document.getElementById('preview-btn'),
        downloadCodeBtn: document.getElementById('download-code-btn'),
        closeCodeBtn: document.getElementById('close-code-btn'),
        previewContainer: document.getElementById('preview-container'),
        previewFrame: document.getElementById('preview-frame'),

        // NEW Code Editor Input
        codeComposer: document.getElementById('code-composer'),
        codePromptInput: document.getElementById('code-prompt-input'),
        codeExecuteBtn: document.getElementById('code-execute-btn'),
        codeAiStatus: document.getElementById('code-ai-status'),
    };
    
    // === 2. SVG ICONS (Custom-made) ===
    // Ab 'feather not defined' error nahi aayega
    const ICONS = {
        menu: '<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>',
        close: '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>',
        plusCircle: '<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>',
        edit: '<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z"/></svg>',
        trash: '<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>',
        plus: '<svg class="h-6 w-6 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>',
        gemini: '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M12 5V3m0 18v-2M8.6 8.6l-1.4-1.4M16.8 16.8l-1.4-1.4m-12 1.4l1.4-1.4m12-12l1.4 1.4M12 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>',
        mistral: '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>',
        image: '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l-1.586-1.586a2 2 0 00-2.828 0L6 14m6-6l.01.01M3 3h18a2 2 0 012 2v14a2 2 0 01-2 2H3a2 2 0 01-2-2V5a2 2 0 012-2z" /></svg>',
        code: '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>',
        send: '<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>',
        loader: '<svg class="h-6 w-6 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2.082A8.001 8.001 0 004.582 9H4V4m.582 5A8.003 8.003 0 0012 20a8.003 8.003 0 007.418-5M4 12h.582m15.356-2.082A8.001 8.001 0 0119.418 15H20v5h-.582m-15.356-2.082A8.001 8.001 0 014.582 9H4v5h.582m0 0A8.003 8.003 0 0112 4a8.003 8.003 0 017.418 5M20 12h-.582" /></svg>',
        copy: '<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>',
        check: '<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>',
        regenerate: '<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2.082A8.001 8.001 0 004.582 9H4V4m.582 5A8.003 8.003 0 0012 20a8.003 8.003 0 007.418-5M4 12h.582m15.356-2.082A8.001 8.001 0 0119.418 15H20v5h-.582m-15.356-2.082A8.001 8.001 0 014.582 9H4v5h.582m0 0A8.003 8.003 0 0112 4a8.003 8.003 0 017.418 5M20 12h-.582" /></svg>',
        download: '<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>',
        downloadCloud: '<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-4-4V7a4 4 0 014-4h.5A3.5 3.5 0 0111 2.037a3.5 3.5 0 011.995.329l.009.004A3.5 3.5 0 0113 9.5V13a4 4 0 01-4 4H7z" /><path stroke-linecap="round" stroke-linejoin="round" d="M9 13l3 3m0 0l3-3m-3 3v-8" /></svg>',
        preview: '<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>',
        codeMistral: '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>'
    };

    // === 3. STATE MANAGEMENT ===
    let currentChatId = null;
    let allChats = {};
    let currentMode = 'gemini';
    let isRequestPending = false;
    let isCodeRequestPending = false;
    let codeMirrorInstances = {};
    let activeFile = null;
    let agentUsername = 'agent';

    // === 4. INITIALIZATION ===
    function init() {
        console.log("YUKU AI (v5 - Production) Initializing...");
        setStaticIcons();
        initEventListeners();
        loadAgentData();
        loadAllChats();
        
        const lastChatId = Object.keys(allChats).pop();
        if (lastChatId) {
            selectChat(lastChatId);
        } else {
            handleNewChat();
        }
        autoResizeTextarea();
        createWelcomePrompts();
    }
    
    // ** ICON LOADER (FIX) **
    function setStaticIcons() {
        // Is function ko `feather.replace()` ki jagah use karein
        ui.closeDrawerBtn.innerHTML = ICONS.close;
        ui.newChatBtn.querySelector('svg')?.remove(); // Puraana SVG hatao (agar ho)
        ui.newChatBtn.insertAdjacentHTML('afterbegin', ICONS.plusCircle);
        ui.hamburgerBtn.innerHTML = ICONS.menu;
        ui.toolSelectBtn.innerHTML = ICONS.plus;
        ui.executeBtn.innerHTML = ICONS.send;
        
        // Tool Chips
        ui.toolChipPopup.querySelector('[data-mode="gemini"]').innerHTML = ICONS.gemini;
        ui.toolChipPopup.querySelector('[data-mode="mistral"]').innerHTML = ICONS.mistral;
        ui.toolChipPopup.querySelector('[data-mode="image"]').innerHTML = ICONS.image;
        ui.toolChipPopup.querySelector('[data-mode="codeeditor"]').innerHTML = ICONS.code;
        
        // Code Editor Buttons
        ui.copyCodeBtn.innerHTML = ICONS.copy;
        ui.previewBtn.innerHTML = ICONS.preview;
        ui.downloadCodeBtn.innerHTML = ICONS.download;
        ui.closeCodeBtn.innerHTML = ICONS.close;
        ui.codeExecuteBtn.innerHTML = ICONS.codeMistral;
    }

    // === 5. EVENT LISTENERS ===
    function initEventListeners() {
        ui.hamburgerBtn.addEventListener('click', () => toggleDrawer(true));
        ui.closeDrawerBtn.addEventListener('click', () => toggleDrawer(false));
        ui.backdrop.addEventListener('click', () => toggleDrawer(false));

        ui.newChatBtn.addEventListener('click', handleNewChat);
        ui.chatList.addEventListener('click', handleChatListActions);

        ui.toolSelectBtn.addEventListener('click', toggleToolPopup);
        document.addEventListener('click', (e) => {
            if (!ui.toolChipPopup.classList.contains('hidden') && !e.target.closest('#tool-select-btn')) {
                ui.toolChipPopup.classList.add('hidden');
            }
        });

        ui.toolChipPopup.querySelectorAll('.tool-chip').forEach(chip => {
            chip.addEventListener('click', () => selectAiMode(chip.dataset.mode));
        });

        // Main Chat Composer
        ui.composer.addEventListener('submit', (e) => handleSend(e));
        ui.promptInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        });
        
        // Welcome Prompts (Delegated)
        ui.welcomePrompts.addEventListener('click', (e) => {
            const button = e.target.closest('.prompt-chip');
            if (button) {
                handleSend(null, button.dataset.prompt);
            }
        });

        // Code Editor Main Buttons
        ui.closeCodeBtn.addEventListener('click', handleCloseCodeEditor);
        ui.previewBtn.addEventListener('click', handlePreviewCode);
        ui.downloadCodeBtn.addEventListener('click', handleDownloadCode);
        ui.copyCodeBtn.addEventListener('click', handleCopyCode);
        
        // ** NEW: Code Editor Input Listener **
        ui.codeComposer.addEventListener('submit', (e) => handleCodeEditSend(e));

        // Chat History (Delegated for Bubble Actions)
        ui.chatHistory.addEventListener('click', handleBubbleActions);
    }

    // === 6. DRAWER & CHAT HISTORY LOGIC ===
    function toggleDrawer(open) {
        if (open) {
            ui.drawer.classList.add('open');
            if (window.innerWidth < 768) {
                ui.backdrop.classList.remove('hidden');
            }
        } else {
            ui.drawer.classList.remove('open');
            ui.backdrop.classList.add('hidden');
        }
    }

    function loadAgentData() {
        try {
            if (window.app && typeof window.app.getUser === 'function') {
                const user = window.app.getUser();
                agentUsername = (user && user.username) ? user.username : 'agent';
            } else {
                console.warn("window.app.getUser() not found. Using default agent.");
                agentUsername = 'agent';
            }
        } catch (e) {
            console.error("Error loading agent data:", e);
            agentUsername = 'agent-error';
        }
        ui.agentName.textContent = `yuku-${agentUsername}`;
    }

    function loadAllChats() {
        const savedChats = localStorage.getItem('yukuAllChats');
        allChats = savedChats ? JSON.parse(savedChats) : {};
        renderChatList();
    }

    function renderChatList() {
        ui.chatList.innerHTML = '';
        Object.keys(allChats).sort((a, b) => allChats[b].timestamp - allChats[a].timestamp)
            .forEach(chatId => {
                const chat = allChats[chatId];
                const isActive = (chatId === currentChatId);
                const activeClass = isActive ? 'bg-[var(--bg-medium)] text-[var(--accent-green)]' : 'hover:bg-[var(--bg-medium)]';
                
                ui.chatList.insertAdjacentHTML('beforeend', `
                    <div class="group flex items-center justify-between p-2 rounded-md ${activeClass}">
                        <button data-action="select" data-chat-id="${chatId}" class="flex-1 truncate text-left">
                            ${chat.title}
                        </button>
                        <div class="flex ${isActive ? '' : 'md:hidden'} group-hover:flex">
                            <button data-action="rename" data-chat-id="${chatId}" class="p-1 hover:text-white" title="Rename">
                                ${ICONS.edit}
                            </button>
                            <button data-action="delete" data-chat-id="${chatId}" class="p-1 hover:text-red-500" title="Delete">
                                ${ICONS.trash}
                            </button>
                        </div>
                    </div>
                `);
            });
    }

    function saveAllChats() {
        localStorage.setItem('yukuAllChats', JSON.stringify(allChats));
    }
    
    function handleChatListActions(e) {
        const button = e.target.closest('button');
        if (!button) return;
        const chatId = button.dataset.chatId;
        const action = button.dataset.action;
        
        if (action === 'select') selectChat(chatId);
        else if (action === 'rename') handleRenameChat(chatId);
        else if (action === 'delete') handleDeleteChat(chatId);
    }

    function handleNewChat() {
        const newChatId = `chat_${Date.now()}`;
        currentChatId = newChatId;
        allChats[currentChatId] = {
            title: 'New Chat',
            messages: [],
            timestamp: Date.now()
        };
        saveAllChats();
        renderChatList();
        loadChatHistory();
        handleCloseCodeEditor();
        toggleDrawer(false);
    }

    function selectChat(chatId) {
        if (!allChats[chatId]) return;
        currentChatId = chatId;
        renderChatList();
        loadChatHistory();
        handleCloseCodeEditor();
        toggleDrawer(false);
    }

    async function handleRenameChat(chatId) {
        const { value: newTitle } = await Swal.fire({
            title: 'Rename Chat', input: 'text', inputValue: allChats[chatId].title,
            showCancelButton: true, confirmButtonColor: 'var(--accent-green)',
            background: 'var(--bg-medium)', color: 'var(--text-primary)',
        });
        if (newTitle) {
            allChats[chatId].title = newTitle;
            saveAllChats();
            renderChatList();
            ui.chatTitle.textContent = newTitle;
        }
    }

    async function handleDeleteChat(chatId) {
        const result = await Swal.fire({
            title: 'Delete Chat?', text: "This action cannot be undone.", icon: 'warning',
            showCancelButton: true, confirmButtonText: 'Yes, delete it!',
            confirmButtonColor: '#ef4444', background: 'var(--bg-medium)', color: 'var(--text-primary)',
        });
        if (result.isConfirmed) {
            delete allChats[chatId];
            saveAllChats();
            if (currentChatId === chatId) handleNewChat();
            else renderChatList();
        }
    }

    function loadChatHistory() {
        ui.chatHistory.innerHTML = ''; // Clear history
        const chat = allChats[currentChatId];
        if (!chat) return;

        ui.chatTitle.textContent = chat.title;
        
        if (chat.messages.length === 0) {
            ui.welcomeEl.classList.remove('hidden');
            ui.chatStatus.textContent = 'Select a tool to begin...';
        } else {
            ui.welcomeEl.classList.add('hidden');
            chat.messages.forEach(msg => {
                displayMessage(msg.author, msg.content, msg.data, msg.originalPrompt);
            });
            const lastMsg = chat.messages[chat.messages.length - 1];
            if (lastMsg.data && lastMsg.data.engine) {
                ui.chatStatus.textContent = `Last used: ${lastMsg.data.engine}`;
                currentMode = lastMsg.data.mode || 'gemini';
                ui.chatAvatar.textContent = {gemini: 'GMN', mistral: 'MST', image: 'IMG'}[currentMode] || 'AI';
            }
        }
        scrollToBottom();
    }
    
    // === 7. WELCOME & TOOL CHIPS ===
    function createWelcomePrompts() {
        const prompts = [
            { title: "Write a snake game", prompt: "Write a simple snake game in HTML, CSS, and JavaScript" },
            { title: "Explain quantum computing", prompt: "Explain quantum computing in simple terms" },
            { title: "Suggest a meal plan", prompt: "Suggest a high-protein meal plan for a week" },
            { title: "Debug this code", prompt: "Debug this python code for me: \n\ndef hello():\n  print('Hello)" }
        ];
        ui.welcomePrompts.innerHTML = '';
        prompts.forEach(p => {
            ui.welcomePrompts.insertAdjacentHTML('beforeend', `
                <button class="prompt-chip" data-prompt="${p.prompt}">
                    <strong>${p.title}</strong>
                    <p class="text-sm text-text-secondary truncate">${p.prompt}</p>
                </button>
            `);
        });
    }

    function toggleToolPopup() {
        ui.toolChipPopup.classList.toggle('hidden');
    }

    function selectAiMode(modeId) {
        if (modeId === 'codeeditor') {
            handleOpenCodeEditor();
        } else {
            currentMode = modeId;
            const tool = {gemini: 'Gemini', mistral: 'Mistral', image: 'Flux Image'}[modeId];
            ui.chatStatus.textContent = `Using: ${tool}`;
            ui.chatAvatar.textContent = {gemini: 'GMN', mistral: 'MST', image: 'IMG'}[modeId];
            // Update code editor AI status
            ui.codeAiStatus.textContent = `${tool}:`;
        }
        toggleToolPopup();
    }

    // === 8. CORE CHAT LOGIC (Send & Receive) ===
    
    async function handleSend(e, promptOverride = null) {
        if (e) e.preventDefault();
        
        const prompt = promptOverride || ui.promptInput.value.trim();
        if (!prompt || isRequestPending) return;

        isRequestPending = true;
        setSendButtonLoading(true); // LOADER ON
        ui.welcomeEl.classList.add('hidden');
        
        if (!promptOverride) {
            const userMessage = { author: 'user', content: prompt };
            allChats[currentChatId].messages.push(userMessage);
            displayMessage(userMessage.author, userMessage.content);
            ui.promptInput.value = '';
            ui.promptInput.style.height = 'auto';
        }
        
        displayThinking(true);

        const body = { prompt: prompt, mode: currentMode };

        try {
            // ** PRODUCTION-READY API CALL **
            // Yeh maan raha hai ki 'window.app.handleAiQuery' aapke main.js mein hai
            if (!window.app || typeof window.app.handleAiQuery !== 'function') {
                throw new Error("Critical Error: 'window.app.handleAiQuery' function not found. Connect main.js.");
            }
            const response = await window.app.handleAiQuery(body);
            
            displayThinking(false);
            
            if (response) {
                const aiMessage = { 
                    author: 'yuku', 
                    content: response.response, 
                    data: response,
                    originalPrompt: prompt
                };
                allChats[currentChatId].messages.push(aiMessage);
                displayYukuResponse(response, prompt);
            } else {
                throw new Error("Empty response from server");
            }

        } catch (error) {
            console.error("AI Query Error:", error);
            displayThinking(false);
            const errorData = { engine: "System", type: "error", response: error.message || "Request failed." };
            const aiMessage = { author: 'yuku', content: errorData.response, data: errorData, originalPrompt: prompt };
            allChats[currentChatId].messages.push(aiMessage);
            displayYukuResponse(errorData, prompt);
        }
        
        if (allChats[currentChatId].messages.length === 2) {
             allChats[currentChatId].title = prompt.substring(0, 30) + (prompt.length > 30 ? '...' : '');
             ui.chatTitle.textContent = allChats[currentChatId].title;
             renderChatList();
        }
        
        allChats[currentChatId].timestamp = Date.now();
        saveAllChats();
        isRequestPending = false;
        setSendButtonLoading(false); // LOADER OFF
    }
    
    function displayYukuResponse(data, originalPrompt) {
        displayMessage('yuku', data.response, data, originalPrompt);
    }

    function displayMessage(author, content, data = {}, originalPrompt = null) {
        const isUser = author === 'user';
        const bubbleClass = isUser ? 'user-bubble' : 'yuku-bubble';
        const justification = isUser ? 'justify-end' : 'justify-start';
        
        const bubble = document.createElement('div');
        bubble.className = `flex ${justification}`;
        
        const bubbleContent = document.createElement('div');
        bubbleContent.className = `chat-bubble ${bubbleClass} rounded-lg p-3`;

        let htmlContent = '';

        if (isUser) {
            htmlContent = content.replace(/\n/g, '<br>');
        } else {
            const source = data.engine || 'System';
            htmlContent = `<p class="font-bold text-[var(--accent-green)] mb-2">YUKU (${source})</p>`;
            
            if (data.type === 'image') {
                const timestamp = Date.now();
                htmlContent += `
                    <p>Image generated based on: <em>${data.original_prompt}</em></p>
                    <img src="${data.image_url}" alt="Generated Image" class="mt-2 rounded-lg border border-[var(--border-color)]">
                    <button data-action="download-image" data-url="${data.image_url}" data-timestamp="${timestamp}" class="tactical-btn text-xs py-1 mt-2">
                        ${ICONS.downloadCloud} Download Image
                    </button>
                    <p class="text-xs text-text-secondary mt-2">Enhanced prompt: <em>${data.enhanced_prompt}</em></p>
                `;
            } else if (data.type === 'text') {
                const { textPart, codeBlocks } = parseCodeBlocks(content);
                if (textPart) {
                    htmlContent += (typeof marked !== 'undefined') ? marked.parse(textPart) : textPart.replace(/\n/g, '<br>');
                }
                if (codeBlocks.length > 0) {
                    createOrUpdateCodeEditor(codeBlocks);
                    htmlContent += `<p class="text-sm mt-2">I have generated ${codeBlocks.length} code file(s). See the editor above.</p>`;
                } else {
                    // Yahan code editor ko band na karein, ho sakta hai user
                    // code editor input se hi baat kar raha ho.
                    // handleCloseCodeEditor();
                }
            } else if (data.type === 'error') {
                htmlContent = `<p class="font-bold text-red-400 mb-2">YUKU (${source})</p><p class="text-red-400 text-sm">[ERROR]: ${content || 'An unknown error occurred.'}</p>`;
            }
            
            htmlContent += `
                <div class="bubble-footer">
                    <button class="bubble-action-btn" data-action="copy" data-raw-content="${encodeURIComponent(content)}" title="Copy response">
                        ${ICONS.copy} <span class="copy-text"></span>
                    </button>
                    <button class="bubble-action-btn" data-action="regenerate" data-original-prompt="${encodeURIComponent(originalPrompt)}" title="Regenerate response">
                        ${ICONS.regenerate}
                    </button>
                </div>
            `;
        }

        bubbleContent.innerHTML = htmlContent;
        bubble.appendChild(bubbleContent);
        ui.chatHistory.appendChild(bubble);
        
        scrollToBottom();
    }

    function displayThinking(show) {
        const target = ui.chatHistory.querySelector('.thinking');
        if (show && !target) {
            ui.chatHistory.insertAdjacentHTML('beforeend', `
                <div class="flex justify-start thinking">
                    <div class="chat-bubble yuku-bubble rounded-lg p-3">
                        <div class="flex items-center gap-2 text-sm text-text-secondary">
                            <span class="animate-spin">${ICONS.loader.substring(0, ICONS.loader.length - 6) + ' class="h-4 w-4" />'}</span>
                            YUKU is processing...
                        </div>
                    </div>
                </div>`);
            scrollToBottom();
        } else if (!show && target) {
            target.remove();
        }
    }

    function setSendButtonLoading(isLoading) {
        if (isLoading) {
            ui.executeBtn.disabled = true;
            ui.executeBtn.innerHTML = ICONS.loader;
        } else {
            ui.executeBtn.disabled = false;
            ui.executeBtn.innerHTML = ICONS.send;
        }
    }

    function scrollToBottom() {
        ui.chatHistory.scrollTop = ui.chatHistory.scrollHeight;
    }

    function autoResizeTextarea() {
        ui.promptInput.addEventListener('input', () => {
            ui.promptInput.style.height = 'auto';
            ui.promptInput.style.height = Math.min(120, ui.promptInput.scrollHeight) + 'px';
        });
    }

    // === 9. BUBBLE ACTIONS ===
    function handleBubbleActions(e) {
        const button = e.target.closest('.bubble-action-btn, [data-action="download-image"]');
        if (!button) return;
        
        const action = button.dataset.action;
        
        if (action === 'copy') {
            const rawContent = decodeURIComponent(button.dataset.rawContent);
            navigator.clipboard.writeText(rawContent).then(() => {
                const textSpan = button.querySelector('.copy-text');
                button.querySelector('svg').remove();
                button.insertAdjacentHTML('afterbegin', ICONS.check);
                if(textSpan) textSpan.textContent = 'Copied!';
                
                setTimeout(() => {
                    button.querySelector('svg').remove();
                    button.insertAdjacentHTML('afterbegin', ICONS.copy);
                    if(textSpan) textSpan.textContent = '';
                }, 2000);
            });
        }
        
        if (action === 'regenerate') {
            const originalPrompt = decodeURIComponent(button.dataset.originalPrompt);
            if (originalPrompt && originalPrompt !== 'null') {
                allChats[currentChatId].messages.pop();
                button.closest('.flex.justify-start').remove();
                saveAllChats();
                handleSend(null, originalPrompt);
            } else {
                Swal.fire({ icon: 'error', title: 'Regeneration Failed', text: 'Original prompt not found.',
                    background: 'var(--bg-medium)', color: 'var(--text-primary)', });
            }
        }
        
        if (action === 'download-image') {
            handleDownloadImage(button.dataset.url, button.dataset.timestamp);
        }
    }

    // === 10. CODE EDITOR LOGIC (V2) ===
    
    // ** NEW: Code Editor Send Logic **
    async function handleCodeEditSend(e) {
        e.preventDefault();
        const editPrompt = ui.codePromptInput.value.trim();
        if (!editPrompt || isCodeRequestPending || !activeFile) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Cannot send. No active file or prompt is empty.',
                background: 'var(--bg-medium)', color: 'var(--text-primary)', });
            return;
        }

        isCodeRequestPending = true;
        const btn = ui.codeExecuteBtn;
        btn.disabled = true;
        btn.innerHTML = ICONS.loader.replace('h-6 w-6', 'h-5 w-5').replace('animate-spin', 'animate-spin');

        const currentCode = codeMirrorInstances[activeFile].getValue();
        
        // Ek special prompt banayein
        const fullPrompt = `
CONTEXT: I am working in a code editor. The user wants to modify the file "${activeFile}".
CURRENT CODE:
\`\`\`${activeFile.split('.').pop()}
${currentCode}
\`\`\`
USER INSTRUCTION: "${editPrompt}"

TASK: Provide ONLY the new, complete code for the file "${activeFile}" based on the user's instruction. Do not add any extra text, explanation, or markdown formatting around the code block.
`;
        // AI ko (Gemini/Mistral) force karein ki code edit mode mein rahe
        const body = { prompt: fullPrompt, mode: currentMode };

        try {
            const response = await window.app.handleAiQuery(body);
            if (response && response.response) {
                // Response se code extract karein
                const { codeBlocks } = parseCodeBlocks(response.response);
                if (codeBlocks.length > 0) {
                    // Sirf pehla code block lein aur editor mein daal dein
                    codeMirrorInstances[activeFile].setValue(codeBlocks[0].code);
                } else {
                    // Agar AI ne galti se text bhej diya
                    codeMirrorInstances[activeFile].setValue(response.response);
                }
            } else {
                throw new Error("Empty response from AI");
            }

        } catch (error) {
            console.error("Code Edit Error:", error);
            Swal.fire({ icon: 'error', title: 'AI Edit Failed', text: error.message,
                background: 'var(--bg-medium)', color: 'var(--text-primary)', });
        }

        isCodeRequestPending = false;
        btn.disabled = false;
        btn.innerHTML = ICONS.codeMistral;
        ui.codePromptInput.value = '';
    }
    
    function parseCodeBlocks(responseText) {
        const codeBlockRegex = /```(\w+)?\n([\sS]*?)\n```/g;
        let match;
        const codeBlocks = [];
        let textPart = responseText;
        while ((match = codeBlockRegex.exec(responseText)) !== null) {
            codeBlocks.push({ lang: match[1] || 'plaintext', code: match[2].trim() });
        }
        textPart = textPart.replace(codeBlockRegex, '').trim();
        return { textPart, codeBlocks };
    }

    function createOrUpdateCodeEditor(codeBlocks) {
        ui.codeSection.classList.remove('hidden');
        // BUG FIX: Main chat input ko disable/hide karein taaki user confuse na ho
        ui.composer.classList.add('hidden'); 
        
        ui.fileTabs.innerHTML = '';
        ui.codeEditorContainer.innerHTML = '';
        codeMirrorInstances = {};
        
        codeBlocks.forEach((block, index) => {
            let mode = block.lang.toLowerCase();
            let filename = `file.${mode}`;
            if (mode === 'html' || mode === 'xml') { filename = 'index.html'; mode = 'htmlmixed'; }
            if (mode === 'css') { filename = 'style.css'; }
            if (mode === 'javascript' || mode === 'js') { filename = 'script.js'; mode = 'javascript'; }

            const tab = document.createElement('div');
            tab.className = 'file-tab';
            tab.textContent = filename;
            tab.dataset.filename = filename;
            ui.fileTabs.appendChild(tab);

            const editorWrapper = document.createElement('div');
            editorWrapper.id = `editor-${filename.replace(/\./g, '_')}`;
            editorWrapper.style.display = 'none';
            ui.codeEditorContainer.appendChild(editorWrapper);

            codeMirrorInstances[filename] = CodeMirror(editorWrapper, {
                value: block.code, mode: mode, theme: 'dracula',
                lineNumbers: true, lineWrapping: true
            });

            if (index === 0) switchToFile(filename);
        });

        ui.fileTabs.querySelectorAll('.file-tab').forEach(tab => {
            tab.addEventListener('click', () => switchToFile(tab.dataset.filename));
        });
        
        setTimeout(() => Object.values(codeMirrorInstances).forEach(cm => cm.refresh()), 100);
    }
    
    function handleOpenCodeEditor() {
        createOrUpdateCodeEditor([
            { lang: 'html', code: '<h1>Hello YUKU!</h1>' },
            { lang: 'css', code: 'body { background: #222; color: #eee; }' }
        ]);
    }

    function switchToFile(filename) {
        if (activeFile === filename || !codeMirrorInstances[filename]) return;
        if (activeFile) {
            ui.fileTabs.querySelector(`[data-filename="${activeFile}"]`).classList.remove('active');
            document.getElementById(`editor-${activeFile.replace(/\./g, '_')}`).style.display = 'none';
        }
        ui.fileTabs.querySelector(`[data-filename="${filename}"]`).classList.add('active');
        document.getElementById(`editor-${filename.replace(/\./g, '_')}`).style.display = 'block';
        activeFile = filename;
        codeMirrorInstances[activeFile].refresh();
    }

    function handleCloseCodeEditor() {
        ui.codeSection.classList.add('hidden');
        ui.previewContainer.classList.add('hidden');
        // BUG FIX: Main chat input ko waapas laayein
        ui.composer.classList.remove('hidden');
        codeMirrorInstances = {};
        activeFile = null;
    }

    function handlePreviewCode() {
        const html = codeMirrorInstances['index.html']?.getValue() || '';
        const css = codeMirrorInstances['style.css']?.getValue() || '';
        const js = codeMirrorInstances['script.js']?.getValue() || '';
        const srcDoc = `<html><head><style>${css}</style></head><body>${html}<script>${js}<\/script></body></html>`;
        ui.previewFrame.srcdoc = srcDoc;
        ui.previewContainer.classList.remove('hidden');
    }
    
    function handleCopyCode() {
        if (!activeFile || !codeMirrorInstances[activeFile]) return;
        
        const code = codeMirrorInstances[activeFile].getValue();
        navigator.clipboard.writeText(code).then(() => {
            const btn = ui.copyCodeBtn;
            btn.innerHTML = ICONS.check;
            setTimeout(() => {
                btn.innerHTML = ICONS.copy;
            }, 2000);
        });
    }

    function handleDownloadCode() {
        if (!activeFile || !codeMirrorInstances[activeFile]) return;
        const code = codeMirrorInstances[activeFile].getValue();
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = activeFile;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
    }

    // === 11. IMAGE DOWNLOAD LOGIC ===
    async function handleDownloadImage(url, timestamp) {
        try {
            // CORS se bachne ke liye proxy ya server-side fetch behtar hai,
            // lekin frontend-only ke liye yeh koshish karein:
            const response = await fetch(url);
            const blob = await response.blob();
            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl; a.download = `yuku-img-${timestamp}.png`;
            document.body.appendChild(a); a.click();
            document.body.removeChild(a); URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error("Image Download Error:", error);
            // Fallback: Naye tab mein kholein
            window.open(url, '_blank');
            Swal.fire({ icon: 'info', title: 'Download Failed', 
                text: 'Could not download directly. Opening image in new tab for manual save.',
                background: 'var(--bg-medium)', color: 'var(--text-primary)' });
        }
    }

    // === 12. Start the App ===
    init();
}

// **ZAROORI:** Yeh file `main.js` ya aapke primary dashboard script se call honi chahiye.
// Agar yeh standalone page hai, toh is line ko uncomment karein:
document.addEventListener('DOMContentLoaded', initYukuAiPage);