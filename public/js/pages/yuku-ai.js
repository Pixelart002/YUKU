function initYukuAiPage() {
    // --- STATE & CONFIG ---
    const state = {
        activeTool: 'mistral_default',
        chatId: null,
        vfs: {}, // { "file.txt": "content" }
        filesToUpload: [],
        editorInstance: null
    };

    const els = {
        chat: document.getElementById('chat-container'),
        prompt: document.getElementById('prompt-input'),
        form: document.getElementById('ai-form'),
        filePreview: document.getElementById('file-tags'),
        historyList: document.getElementById('history-list'),
        ideOverlay: document.getElementById('ide-overlay'),
        ideToggle: document.getElementById('ide-toggle-btn'),
        toolPopover: document.getElementById('tool-popover'),
        toolDisplay: document.getElementById('active-tool-display')
    };

    // --- INITIALIZATION ---
    initCodeMirror();
    loadChatHistory();

    // --- CHAT LOGIC ---
    window.createNewChat = async () => {
        const token = window.app.getAuthToken();
        const res = await fetch(`${window.app.config.API_BASE_URL}/ai/chats/new`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        state.chatId = data.chat_id;
        state.vfs = {};
        els.chat.innerHTML = ''; 
        appendSystemMsg("New Session Started");
        loadChatHistory();
        // Close drawer on mobile
        if(window.innerWidth < 768) document.getElementById('chat-drawer').classList.add('-translate-x-full');
    };

    els.form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = els.prompt.value.trim();
        if (!text && state.filesToUpload.length === 0) return;

        appendUserBubble(text, state.filesToUpload.map(f=>f.name));
        els.prompt.value = '';
        const filesToSend = [...state.filesToUpload];
        state.filesToUpload = [];
        renderFileTags();
        
        const loaderId = appendLoader();

        try {
            const formData = new FormData();
            formData.append('prompt', text || "Process attachment.");
            formData.append('tool_id', state.activeTool);
            if (state.chatId) formData.append('chat_id', state.chatId);
            filesToSend.forEach(f => formData.append('files', f));

            const endpoint = state.activeTool === 'image' ? 'generate-image' : 'ask';
            const token = window.app.getAuthToken();

            const res = await fetch(`${window.app.config.API_BASE_URL}/ai/${endpoint}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const data = await res.json();
            document.getElementById(loaderId).remove();

            if (data.status === 'success') {
                state.chatId = data.chat_id;
                
                // Image Response
                if (data.image_url) {
                    appendImageBubble(data.image_url, data.download_filename);
                }
                // Text/Code Response
                else if (data.data) {
                    appendAiBubble(data.data.response);
                }

                // VFS Update (Auto-Open IDE if needed)
                if (data.vfs && Object.keys(data.vfs).length > 0) {
                    state.vfs = data.vfs;
                    updateFileTree();
                    // If files were updated, show IDE toggle or open it
                    els.ideToggle.classList.remove('hidden');
                    if (data.data.is_vfs_update) {
                        window.toggleIDE(true); 
                        if(state.vfs['index.html']) openFile('index.html');
                    }
                }
                
                loadChatHistory();
            }
        } catch (err) {
            document.getElementById(loaderId).remove();
            appendSystemMsg("Error: " + err.message);
        }
    });

    // --- IDE & VFS LOGIC ---
    function initCodeMirror() {
        state.editorInstance = CodeMirror.fromTextArea(document.getElementById('code-editor-area'), {
            mode: 'htmlmixed',
            theme: 'dracula',
            lineNumbers: true,
            lineWrapping: true
        });
        state.editorInstance.on('change', () => {
            // Simple debounce or save logic could go here
        });
    }

    window.toggleIDE = (forceOpen = false) => {
        if (forceOpen || els.ideOverlay.classList.contains('closed')) {
            els.ideOverlay.classList.remove('closed');
        } else {
            els.ideOverlay.classList.add('closed');
        }
    };

    function updateFileTree() {
        const tree = document.getElementById('file-tree');
        tree.innerHTML = '';
        Object.keys(state.vfs).forEach(filename => {
            const div = document.createElement('div');
            div.className = "cursor-pointer hover:text-emerald-300 text-gray-400 p-1 flex items-center gap-2";
            div.innerHTML = `<span>📄</span> ${filename}`;
            div.onclick = () => openFile(filename);
            tree.appendChild(div);
        });
    }

    function openFile(filename) {
        const content = state.vfs[filename];
        state.editorInstance.setValue(content);
        document.getElementById('ide-filename').textContent = filename;
        
        // Mode detection
        if (filename.endsWith('.css')) state.editorInstance.setOption('mode', 'css');
        else if (filename.endsWith('.js')) state.editorInstance.setOption('mode', 'javascript');
        else state.editorInstance.setOption('mode', 'htmlmixed');

        if (filename.endsWith('.html')) window.refreshPreview();
    }

    window.refreshPreview = () => {
        const frame = document.getElementById('ide-preview');
        let html = state.vfs['index.html'] || "<h1>No index.html</h1>";
        // Inject CSS/JS
        if (state.vfs['style.css']) html = html.replace('</head>', `<style>${state.vfs['style.css']}</style></head>`);
        if (state.vfs['script.js']) html = html.replace('</body>', `<script>${state.vfs['script.js']}</script></body>`);
        frame.srcdoc = html;
    };

    // --- UTILS ---
    window.selectTool = (tool) => {
        state.activeTool = tool;
        els.toolDisplay.textContent = `Using: ${tool === 'code_editor' ? 'Yuku IDE' : (tool === 'image' ? 'Flux Image' : 'Mistral Chat')}`;
        els.toolPopover.classList.add('hidden');
    };

    window.handleFiles = (input) => {
        state.filesToUpload = Array.from(input.files);
        renderFileTags();
    };

    function renderFileTags() {
        els.filePreview.innerHTML = state.filesToUpload.map(f => `<span class="text-[10px] bg-emerald-900 text-emerald-300 px-2 rounded border border-emerald-500/30">${f.name}</span>`).join('');
    }

    async function loadChatHistory() {
        const token = window.app.getAuthToken();
        const res = await fetch(`${window.app.config.API_BASE_URL}/ai/chats`, { headers: { 'Authorization': `Bearer ${token}` } });
        const chats = await res.json();
        els.historyList.innerHTML = chats.map(c => `
            <div onclick="loadChat('${c.id}')" class="p-2 rounded hover:bg-white/5 cursor-pointer text-xs text-gray-400 hover:text-white truncate border-b border-emerald-500/10">
                ${c.title}
            </div>
        `).join('');
    }

    window.loadChat = async (id) => {
        const token = window.app.getAuthToken();
        const res = await fetch(`${window.app.config.API_BASE_URL}/ai/chats/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        
        state.chatId = data.id;
        state.vfs = data.vfs_state || {};
        els.chat.innerHTML = '';
        
        data.messages.forEach(msg => {
            if(msg.tool === 'flux_image') appendImageBubble(msg.image_data, "generated.jpg");
            else appendAiBubble(msg.response);
        });
        
        if(Object.keys(state.vfs).length > 0) {
            updateFileTree();
            els.ideToggle.classList.remove('hidden');
        }
    };

    window.shareChat = async () => {
        if(!state.chatId) return alert("Start a chat first");
        const token = window.app.getAuthToken();
        const res = await fetch(`${window.app.config.API_BASE_URL}/ai/share/${state.chatId}`, { 
            method: 'POST', headers: { 'Authorization': `Bearer ${token}` } 
        });
        const d = await res.json();
        prompt("Copy Share Link:", d.share_url);
    };

    // --- BUBBLE RENDERERS ---
    function appendUserBubble(text, files) {
        const div = document.createElement('div');
        div.className = "flex justify-end w-full animate-fade-in-up";
        div.innerHTML = `
            <div class="bg-emerald-900/30 border border-emerald-500/40 rounded-2xl rounded-tr-none p-4 max-w-[80%] text-sm text-emerald-100 shadow-lg">
                ${files.length ? `<div class="text-[10px] text-emerald-500 mb-1">📎 ${files.join(', ')}</div>` : ''}
                ${text.replace(/\n/g, '<br>')}
            </div>
        `;
        els.chat.appendChild(div);
        scrollToBottom();
    }

    function appendAiBubble(text) {
        const div = document.createElement('div');
        div.className = "flex justify-start w-full animate-fade-in-up";
        
        // Parse Code Blocks for Copy Button
        const formattedText = text.replace(/```(\w+)?([\s\S]*?)```/g, (match, lang, code) => {
            const b64 = btoa(unescape(encodeURIComponent(code))); // Safe encode
            return `<div class="bg-black/50 rounded-lg border border-white/10 mt-2 overflow-hidden">
                <div class="bg-white/5 px-2 py-1 flex justify-between items-center">
                    <span class="text-[10px] text-gray-500 uppercase">${lang || 'CODE'}</span>
                    <button onclick="copyToClip('${b64}')" class="text-[10px] text-emerald-500 hover:text-white">COPY</button>
                </div>
                <pre class="p-2 text-xs overflow-x-auto text-gray-300 custom-scrollbar">${code.replace(/</g,'&lt;')}</pre>
            </div>`;
        });

        div.innerHTML = `
            <div class="bg-black/40 backdrop-blur-md border border-white/5 rounded-2xl rounded-tl-none p-4 max-w-[85%] text-sm text-gray-300 shadow-lg">
                <div class="text-[10px] text-emerald-500 font-bold mb-1">YUKU AI</div>
                ${formattedText.replace(/\n/g, '<br>')}
            </div>
        `;
        els.chat.appendChild(div);
        scrollToBottom();
    }

    function appendImageBubble(url, filename) {
        const div = document.createElement('div');
        div.className = "flex justify-start w-full animate-fade-in-up";
        div.innerHTML = `
            <div class="bg-black/40 border border-emerald-500/30 p-2 rounded-xl rounded-tl-none max-w-[70%]">
                <img src="${url}" class="rounded-lg w-full">
                <a href="${url}" download="${filename}" class="block text-center bg-emerald-600/20 text-emerald-400 text-xs py-1 mt-2 rounded hover:bg-emerald-500 hover:text-black">DOWNLOAD</a>
            </div>
        `;
        els.chat.appendChild(div);
        scrollToBottom();
    }

    function appendLoader() {
        const id = 'load-' + Date.now();
        const div = document.createElement('div');
        div.id = id;
        div.className = "flex items-center gap-2 text-xs text-gray-500 ml-2 animate-pulse";
        div.innerHTML = `<div class="w-2 h-2 bg-emerald-500 rounded-full"></div> Processing...`;
        els.chat.appendChild(div);
        scrollToBottom();
        return id;
    }

    function appendSystemMsg(text) {
        const div = document.createElement('div');
        div.className = "text-center text-[10px] text-gray-600 my-2";
        div.innerText = text;
        els.chat.appendChild(div);
    }

    function scrollToBottom() { els.chat.scrollTop = els.chat.scrollHeight; }

    // Global helper for copy button
    window.copyToClip = (b64) => {
        const code = decodeURIComponent(escape(atob(b64)));
        navigator.clipboard.writeText(code);
        alert("Code copied!");
    };
}

window.initYukuAiPage = initYukuAiPage;