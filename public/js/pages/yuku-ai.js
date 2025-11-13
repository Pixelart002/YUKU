/**
 * /public/js/pages/yuku-ai.js
 * * YEH POORA NAYA LOGIC HAI
 * Telegram-style UI ko YUKU backend ke saath jodata hai.
 */
function initYukuAiPage() {

    // === DOM SELECTORS (Naye UI ke hisaab se) ===
    const ui = {
        drawer: document.getElementById('drawer'),
        backdrop: document.getElementById('backdrop'),
        menuBtn: document.getElementById('menu-btn'),
        closeDrawer: document.getElementById('close-drawer'),
        toolList: document.getElementById('tool-list'),
        
        chatHistory: document.getElementById('chat-history'),
        welcomeEl: document.getElementById('welcome'),
        chatName: document.getElementById('chat-name'),
        chatStatus: document.getElementById('chat-status'),
        chatAvatar: document.getElementById('chat-avatar'),
        
        chipsContainer: document.getElementById('chips-container'),
        
        composer: document.getElementById('composer'),
        promptInput: document.getElementById('ai-prompt-input'),
        executeBtn: document.getElementById('ai-execute-btn'),
        
        codeSection: document.getElementById('code-section'),
        fileTabs: document.getElementById('file-tabs'),
        codeEditorContainer: document.getElementById('code-editor-container'),
        previewBtn: document.getElementById('preview-btn'),
        previewContainer: document.getElementById('preview-container'),
        previewFrame: document.getElementById('preview-frame'),
    };

    // === STATE ===
    let currentMode = "gemini"; // Default mode
    let codeMirrorInstances = {};
    let activeFile = null;
    let isRequestPending = false;

    // === TOOLS (Aapke ai.py se match karte hue) ===
    const tools = [
        { id: 'gemini', name: 'Gemini', description: 'Fast, high-quality text generation.', avatar: 'G' },
        { id: 'mistral', name: 'Mistral', description: 'Alternative high-quality text model.', avatar: 'M' },
        { id: 'image', name: 'Flux (Image)', description: 'Generate a high-quality image.', avatar: 'IMG' }
    ];

    // === INITIALIZATION ===
    initEventListeners();
    populateToolList();
    selectAiMode(currentMode); // Default mode select karein
    autoResizeTextarea();

    // === EVENT LISTENERS ===
    function initEventListeners() {
        ui.executeBtn.addEventListener('click', handleSend);
        ui.composer.addEventListener('submit', handleSend); // Form submit ke liye
        
        ui.promptInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        });

        // Drawer toggles
        ui.menuBtn.addEventListener('click', showDrawerOnMobile);
        ui.closeDrawer.addEventListener('click', hideDrawerOnMobile);
        ui.backdrop.addEventListener('click', hideDrawerOnMobile);

        // Code Preview
        ui.previewBtn.addEventListener('click', showLocalPreview);

        // Ensure drawer state is correct on resize
        window.addEventListener('resize', () => {
            if (window.matchMedia('(min-width: 768px)').matches) {
                ui.drawer.classList.remove('drawer-hidden');
                ui.backdrop.classList.add('hidden');
            }
        });
    }

    function autoResizeTextarea() {
        ui.promptInput.addEventListener('input', () => {
            ui.promptInput.style.height = 'auto';
            ui.promptInput.style.height = Math.min(120, ui.promptInput.scrollHeight) + 'px';
        });
    }

    // === DRAWER LOGIC ===
    function showDrawerOnMobile() {
        ui.drawer.classList.remove('drawer-hidden');
        ui.drawer.classList.add('drawer-shown');
        ui.backdrop.classList.remove('hidden');
    }
    function hideDrawerOnMobile() {
        if (window.matchMedia('(min-width: 768px)').matches) return;
        ui.drawer.classList.add('drawer-hidden');
        ui.drawer.classList.remove('drawer-shown');
        ui.backdrop.classList.add('hidden');
    }

    // === TOOL/MODE SELECTION (Puraane 'Contacts' logic ki jagah) ===
    function populateToolList() {
        ui.toolList.innerHTML = '';
        tools.forEach(tool => {
            const node = document.createElement('div');
            node.className = 'flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--bg-medium)] cursor-pointer';
            node.innerHTML = `
                <div class="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center font-semibold text-white">${tool.avatar}</div>
                <div class="flex-1 min-w-0">
                    <div class="font-medium truncate">${tool.name}</div>
                    <div class="text-sm text-text-secondary truncate">${tool.description}</div>
                </div>
            `;
            node.addEventListener('click', () => selectAiMode(tool.id));
            ui.toolList.appendChild(node);
        });
    }

    function selectAiMode(modeId) {
        const tool = tools.find(t => t.id === modeId);
        if (!tool) return;

        currentMode = tool.id;

        // Header update karein
        ui.chatName.textContent = `YUKU MCP (${tool.name})`;
        ui.chatStatus.textContent = `Using: ${tool.name}`;
        ui.chatAvatar.textContent = tool.avatar;
        ui.promptInput.placeholder = `Ask ${tool.name}...`;

        // Mobile par drawer band karein
        hideDrawerOnMobile();
    }

    // === MESSAGE & RESPONSE LOGIC (YUKU se) ===
    async function handleSend(e) {
        if (e) e.preventDefault();
        
        const prompt = ui.promptInput.value.trim();
        if (!prompt || isRequestPending) return;

        isRequestPending = true;
        ui.executeBtn.disabled = true;
        displayMessage(prompt, 'user');
        ui.promptInput.value = '';
        ui.promptInput.style.height = 'auto';
        displayThinking(true);

        // Welcome message hatayein
        if (ui.welcomeEl) {
            ui.welcomeEl.remove();
            ui.welcomeEl = null; // Taaki dobara na hate
        }

        const body = {
            prompt: prompt,
            mode: currentMode
        };

        // window.app (main.js) se API call karein
        const response = await window.app.handleAiQuery(body);

        displayThinking(false);
        if (response) {
            displayYukuResponse(response);
        } else {
            displayYukuResponse({
                engine: "System",
                type: "error",
                response: "Request failed. Check error message at the top of the page."
            });
        }
        
        isRequestPending = false;
        ui.executeBtn.disabled = false;
    }

    function displayMessage(content, author) {
        const isUser = author === 'user';
        const bubbleClass = isUser ? 'user-bubble' : 'yuku-bubble';
        const justification = isUser ? 'justify-end' : 'justify-start';
        
        const bubble = document.createElement('div');
        bubble.className = `flex ${justification}`;
        
        const bubbleContent = document.createElement('div');
        bubbleContent.className = `chat-bubble ${bubbleClass} rounded-lg p-3`;

        if (isUser) {
            bubbleContent.textContent = content;
        } else {
            // YUKU bubble (Markdown/HTML ke liye)
            bubbleContent.innerHTML = content;
        }
        
        bubble.appendChild(bubbleContent);
        ui.chatHistory.appendChild(bubble);
        ui.chatHistory.scrollTop = ui.chatHistory.scrollHeight;
    }

    function displayThinking(show) {
        const target = ui.chatHistory.querySelector('.thinking');
        if (show && !target) {
            const thinkingBubble = `
                <div class="flex justify-start thinking">
                    <div class="chat-bubble yuku-bubble rounded-lg p-3">
                        <p class="text-sm text-text-secondary animate-pulse">YUKU is processing...</p>
                    </div>
                </div>`;
            ui.chatHistory.insertAdjacentHTML('beforeend', thinkingBubble);
            ui.chatHistory.scrollTop = ui.chatHistory.scrollHeight;
        } else if (!show && target) {
            target.remove();
        }
    }

    function displayYukuResponse(data) {
        let contentHtml = '';
        const source = data.engine || 'System';

        if (data.type === 'image') {
            contentHtml = `
                <p class="font-bold text-accent-green mb-2">YUKU (${source})</p>
                <p>Image generated based on: <em>${data.original_prompt}</em></p>
                <img src="${data.image_url}" alt="Generated Image" class="mt-2 rounded-lg border border-[var(--border-color)]">
                <p class="text-xs text-text-secondary mt-2">Enhanced prompt: <em>${data.enhanced_prompt}</em></p>
            `;
        } else if (data.type === 'text') {
            const { textPart, codeBlocks } = parseCodeBlocks(data.response);
            
            contentHtml = `<p class="font-bold text-accent-green mb-2">YUKU (${source})</p>`;
            
            if (textPart) {
                contentHtml += (typeof marked !== 'undefined') ? marked.parse(textPart) : textPart.replace(/\n/g, '<br>');
            }
            
            if (codeBlocks.length > 0) {
                createOrUpdateCodeEditor(codeBlocks);
                contentHtml += `<p class="text-sm mt-2">I have generated ${codeBlocks.length} code file(s). See the editor above.</p>`;
            } else {
                // Agar koi code nahi hai toh code editor ko hide karein
                ui.codeSection.classList.add('hidden');
            }
        } else if (data.type === 'error') {
            contentHtml = `
                <p class="font-bold text-red-400 mb-2">YUKU (${source})</p>
                <p class="text-red-400 text-sm">[ERROR]: ${data.response || 'An unknown error occurred.'}</p>
            `;
        }

        displayMessage(contentHtml, 'yuku');
    }

    // === CODE PARSING & EDITOR LOGIC (YUKU se) ===
    function parseCodeBlocks(responseText) {
        const codeBlockRegex = /```(\w+)?\n([\s\S]*?)\n```/g;
        let match;
        const codeBlocks = [];
        let textPart = responseText;

        while ((match = codeBlockRegex.exec(responseText)) !== null) {
            const lang = match[1] || 'plaintext';
            const code = match[2].trim();
            codeBlocks.push({ lang, code });
        }
        
        textPart = textPart.replace(codeBlockRegex, '').trim();
        return { textPart, codeBlocks };
    }

    function createOrUpdateCodeEditor(codeBlocks) {
        ui.codeSection.classList.remove('hidden');
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
            const editorId = `editor-${filename.replace(/\./g, '_')}`;
            editorWrapper.id = editorId;
            editorWrapper.style.display = 'none';
            ui.codeEditorContainer.appendChild(editorWrapper);

            codeMirrorInstances[filename] = CodeMirror(editorWrapper, {
                value: block.code,
                mode: mode,
                theme: 'dracula',
                lineNumbers: true,
                lineWrapping: true
            });

            if (index === 0) {
                activeFile = filename;
                tab.classList.add('active');
                editorWrapper.style.display = 'block';
            }
        });

        ui.fileTabs.querySelectorAll('.file-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const filename = tab.dataset.filename;
                if (activeFile === filename) return;
                
                ui.fileTabs.querySelector('.file-tab.active')?.classList.remove('active');
                document.getElementById(`editor-${activeFile.replace(/\./g, '_')}`).style.display = 'none';
                
                tab.classList.add('active');
                activeFile = filename;
                
                document.getElementById(`editor-${activeFile.replace(/\./g, '_')}`).style.display = 'block';
                codeMirrorInstances[activeFile].refresh();
            });
        });
        
        setTimeout(() => {
            Object.values(codeMirrorInstances).forEach(cm => cm.refresh());
        }, 100);
    }

    // === PREVIEW LOGIC (YUKU se) ===
    function showLocalPreview() {
        const html = codeMirrorInstances['index.html']?.getValue() || '';
        const css = codeMirrorInstances['style.css']?.getValue() || '';
        const js = codeMirrorInstances['script.js']?.getValue() || '';

        const srcDoc = `
            <html>
                <head>
                    <style>${css}</style>
                </head>
                <body>
                    ${html}
                    <script>${js}<\/script>
                </body>
            </html>
        `;

        ui.previewFrame.srcdoc = srcDoc;
        ui.previewContainer.classList.remove('hidden');
    }
}