window.initYukuAiPage = async function() {
    console.log("🚀 DevOps AI Core: Initializing...");

    const API_BASE = 'https://giant-noell-pixelart002-1c1d1fda.koyeb.app';
    let currentChatId = null;

    // --- 0. CRITICAL FIX: DYNAMIC ASSET LOADER ---
    // This ensures 'marked' and 'CodeMirror' exist even if HTML scripts fail to run
    const loadScript = (src) => {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) return resolve();
            const s = document.createElement('script');
            s.src = src;
            s.onload = resolve;
            s.onerror = reject;
            document.head.appendChild(s);
        });
    };

    const loadCSS = (href) => {
        if (document.querySelector(`link[href="${href}"]`)) return;
        const l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = href;
        document.head.appendChild(l);
    };

    try {
        // Load Dependencies Sequentially
        if (typeof marked === 'undefined') await loadScript('https://cdn.jsdelivr.net/npm/marked/marked.min.js');
        
        // Load CodeMirror Deps
        loadCSS('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/codemirror.min.css');
        loadCSS('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/theme/dracula.min.css');
        
        if (typeof CodeMirror === 'undefined') {
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/codemirror.min.js');
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/mode/javascript/javascript.min.js');
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/mode/python/python.min.js');
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/mode/shell/shell.min.js');
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/mode/htmlmixed/htmlmixed.min.js');
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/mode/xml/xml.min.js');
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/mode/css/css.min.js');
        }
        console.log("✅ Dependencies Loaded");
    } catch (e) {
        console.error("❌ Failed to load assets:", e);
        // Fallback alert so you know why it broke
        const c = document.getElementById('messages-container');
        if(c) c.innerHTML = `<div class="text-red-500 text-center mt-10">Error loading AI libraries. Check internet connection.</div>`;
        return;
    }

    // --- HELPER: CREATE CODEMIRROR BLOCK ---
    const createCodeBlock = (code, lang) => {
        const wrapper = document.createElement('div');
        wrapper.className = "my-4 rounded-lg overflow-hidden border border-white/10 bg-[#1e1e1e] shadow-lg relative group";

        // 1. Header
        const header = document.createElement('div');
        header.className = "flex justify-between items-center px-4 py-2 bg-[#252526] border-b border-white/5";
        header.innerHTML = `<span class="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">${lang || 'CODE'}</span>`;

        // Actions
        const actions = document.createElement('div');
        actions.className = "flex gap-3";

        // Copy Button
        const copyBtn = document.createElement('button');
        copyBtn.className = "text-[10px] text-gray-400 hover:text-white transition flex items-center gap-1";
        copyBtn.innerHTML = `<i class="fas fa-copy"></i> Copy`;
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(code);
            copyBtn.innerHTML = `<i class="fas fa-check text-emerald-500"></i> Copied`;
            setTimeout(() => copyBtn.innerHTML = `<i class="fas fa-copy"></i> Copy`, 2000);
        };
        actions.appendChild(copyBtn);
        header.appendChild(actions);
        wrapper.appendChild(header);

        // 2. Editor Container
        const editorDiv = document.createElement('div');
        editorDiv.className = "text-sm"; // Font size adjust
        wrapper.appendChild(editorDiv);

        // Init CodeMirror safely
        setTimeout(() => {
            // Map languages to CodeMirror modes
            const modeMap = {
                'js': 'javascript', 'javascript': 'javascript',
                'py': 'python', 'python': 'python',
                'html': 'htmlmixed', 'css': 'css',
                'sh': 'shell', 'bash': 'shell'
            };
            
            const cm = CodeMirror(editorDiv, {
                value: code.trim(),
                mode: modeMap[lang] || 'javascript',
                theme: 'dracula',
                lineNumbers: true,
                readOnly: true, // User can select/copy but not edit
                viewportMargin: Infinity
            });
            cm.setSize("100%", "auto");
        }, 10);

        return wrapper;
    };

    // --- UI CONTROLLER ---
    window.AI_UI = {
        toggleDrawer: () => {
            const drawer = document.getElementById('chat-drawer');
            const overlay = document.getElementById('drawer-overlay');
            if (!drawer || !overlay) return;

            const isOpen = !drawer.classList.contains('-translate-x-full');
            if (isOpen) {
                drawer.classList.add('-translate-x-full');
                overlay.classList.remove('opacity-100');
                setTimeout(() => overlay.classList.add('hidden'), 300);
            } else {
                overlay.classList.remove('hidden');
                setTimeout(() => overlay.classList.add('opacity-100'), 10);
                drawer.classList.remove('-translate-x-full');
            }
        },

        scrollToBottom: () => {
            const c = document.getElementById('messages-container');
            if (c) c.scrollTo({ top: c.scrollHeight, behavior: 'smooth' });
        },

        appendUserMsg: (text) => {
            const c = document.getElementById('messages-container');
            const empty = c.querySelector('.opacity-30');
            if (empty) empty.remove();

            const div = document.createElement('div');
            div.className = "flex justify-end animate-fade-in mb-6";
            // Escape HTML for safety
            const safeText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, '<br>');
            
            div.innerHTML = `
                <div class="max-w-[85%] bg-[#1a1a1a] border border-white/10 rounded-2xl rounded-tr-sm px-5 py-3 text-sm text-gray-200 font-mono shadow-md leading-relaxed break-words">
                    ${safeText}
                </div>
            `;
            c.appendChild(div);
            AI_UI.scrollToBottom();
        },

        appendAIMsg: (text) => {
            const c = document.getElementById('messages-container');
            const mainDiv = document.createElement('div');
            mainDiv.className = "flex justify-start animate-fade-in w-full mb-8";
            
            const contentDiv = document.createElement('div');
            contentDiv.className = "max-w-[95%] bg-transparent pl-4 border-l-2 border-emerald-500/30 w-full overflow-hidden";
            
            // --- SPLIT TEXT & CODE ---
            const regex = /```(\w+)?\n([\s\S]*?)```/g;
            let lastIndex = 0;
            let match;

            while ((match = regex.exec(text)) !== null) {
                // 1. Text before code
                if (match.index > lastIndex) {
                    const textPart = text.substring(lastIndex, match.index);
                    if (textPart.trim()) {
                        const p = document.createElement('div');
                        p.className = "prose prose-invert max-w-none text-sm font-sans leading-7 text-gray-300 mb-2";
                        // Safe Marked Parsing
                        p.innerHTML = (typeof marked !== 'undefined') ? marked.parse(textPart) : textPart;
                        contentDiv.appendChild(p);
                    }
                }

                // 2. Code Block
                const lang = match[1] || 'text';
                const code = match[2];
                const codeBlock = createCodeBlock(code, lang);
                contentDiv.appendChild(codeBlock);

                lastIndex = regex.lastIndex;
            }

            // 3. Remaining Text
            if (lastIndex < text.length) {
                const textPart = text.substring(lastIndex);
                if (textPart.trim()) {
                    const p = document.createElement('div');
                    p.className = "prose prose-invert max-w-none text-sm font-sans leading-7 text-gray-300 mt-2";
                    p.innerHTML = (typeof marked !== 'undefined') ? marked.parse(textPart) : textPart;
                    contentDiv.appendChild(p);
                }
            }

            mainDiv.appendChild(contentDiv);
            c.appendChild(mainDiv);
            AI_UI.scrollToBottom();
        },

        showTyping: () => {
            const c = document.getElementById('messages-container');
            const div = document.createElement('div');
            div.id = "typing-indicator";
            div.className = "flex items-center gap-1 pl-6 opacity-50 py-2 mb-4";
            div.innerHTML = `
                <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></span>
                <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style="animation-delay:0.1s"></span>
                <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style="animation-delay:0.2s"></span>
            `;
            c.appendChild(div);
            AI_UI.scrollToBottom();
        },

        removeTyping: () => {
            const el = document.getElementById('typing-indicator');
            if (el) el.remove();
        }
    };

    // --- LOGIC CONTROLLER ---
    window.AI = {
        init: () => {
            AI.loadHistory();
            
            const tx = document.getElementById('user-input');
            if (tx) {
                tx.addEventListener('input', function() {
                    this.style.height = 'auto';
                    this.style.height = (this.scrollHeight) + 'px';
                    if (this.value === '') this.style.height = 'auto';
                });
                
                tx.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        AI.sendMessage();
                    }
                });
            }
        },

        sendMessage: async (e) => {
            if (e) e.preventDefault();
            const input = document.getElementById('user-input');
            const prompt = input.value.trim();
            if (!prompt) return;

            const token = localStorage.getItem('authToken');
            if (!token) return alert("Please login first.");

            input.value = '';
            input.style.height = 'auto';
            AI_UI.appendUserMsg(prompt);
            AI_UI.showTyping();

            try {
                const formData = new FormData();
                formData.append('prompt', prompt);
                formData.append('model', 'openai');
                if (currentChatId) formData.append('chat_id', currentChatId);

                const res = await fetch(`${API_BASE}/ai/chat`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });

                const data = await res.json();
                AI_UI.removeTyping();
                
                if (data.status === 'success') {
                    AI_UI.appendAIMsg(data.response);
                    currentChatId = data.chat_id;
                    
                    // Update history if new chat
                    if (!document.getElementById(`chat-item-${data.chat_id}`)) {
                        AI.loadHistory();
                    }
                } else {
                    AI_UI.appendAIMsg(`⚠️ **System Error:** ${data.detail || 'Unknown'}`);
                }
            } catch (err) {
                AI_UI.removeTyping();
                AI_UI.appendAIMsg(`⚠️ **Connection Failed:** ${err.message}`);
            }
        },

        loadHistory: async () => {
            const token = localStorage.getItem('authToken');
            if (!token) return;

            try {
                const res = await fetch(`${API_BASE}/ai/chats`, { headers: { 'Authorization': `Bearer ${token}` } });
                const chats = await res.json();
                
                const list = document.getElementById('chat-history-list');
                if (!list) return;
                list.innerHTML = '';

                chats.forEach(chat => {
                    const isActive = currentChatId === chat.id;
                    const div = document.createElement('div');
                    div.id = `chat-item-${chat.id}`;
                    div.className = `group p-3 rounded-xl cursor-pointer transition-all duration-200 border border-transparent flex items-center justify-between gap-2
                        ${isActive ? 'bg-white/10 border-white/10' : 'hover:bg-white/5 hover:border-white/5'}`;
                    
                    div.onclick = () => { 
                        AI.loadChat(chat.id); 
                        AI_UI.toggleDrawer(); 
                    };

                    div.innerHTML = `
                        <div class="flex flex-col overflow-hidden">
                            <span class="text-xs text-gray-200 font-medium truncate tracking-wide">${chat.title}</span>
                            <span class="text-[10px] text-gray-600 font-mono">${new Date(chat.date).toLocaleDateString()}</span>
                        </div>
                        
                        <!-- DELETE BUTTON (Stops propagation) -->
                        <button onclick="event.stopPropagation(); AI.deleteChat('${chat.id}')" 
                            class="p-1.5 rounded text-gray-600 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    `;
                    list.appendChild(div);
                });
            } catch (e) { console.error("History error", e); }
        },

        loadChat: async (id) => {
            const token = localStorage.getItem('authToken');
            currentChatId = id;
            const container = document.getElementById('messages-container');
            container.innerHTML = '<div class="h-full flex items-center justify-center text-xs text-gray-600 font-mono animate-pulse">RETRIEVING DATA...</div>';
            
            try {
                const res = await fetch(`${API_BASE}/ai/chats/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
                const chat = await res.json();
                
                container.innerHTML = ''; 
                
                if (chat.messages) {
                    chat.messages.forEach(msg => {
                        if (msg.role === 'user') AI_UI.appendUserMsg(msg.content);
                        else AI_UI.appendAIMsg(msg.content);
                    });
                }
                AI.loadHistory();
            } catch(e) { 
                container.innerHTML = '<div class="h-full flex items-center justify-center text-xs text-red-500 font-mono">ERROR LOADING CHAT</div>';
            }
        },

        deleteChat: async (id) => {
            if(!confirm("Delete this chat permanently?")) return;
            const token = localStorage.getItem('authToken');
            try {
                const res = await fetch(`${API_BASE}/ai/chats/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if(res.ok) {
                    const el = document.getElementById(`chat-item-${id}`);
                    if(el) el.remove();
                    if(currentChatId === id) AI.newChat();
                }
            } catch(e) { alert("Delete failed"); }
        },

        newChat: () => {
            currentChatId = null;
            const container = document.getElementById('messages-container');
            container.innerHTML = `
                <div class="h-full flex flex-col items-center justify-center opacity-30 select-none">
                    <div class="w-16 h-16 rounded-2xl border border-white/10 flex items-center justify-center mb-4">
                        <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
                    </div>
                    <p class="font-mono text-xs text-gray-500 tracking-[0.3em]">READY</p>
                </div>
            `;
            AI_UI.toggleDrawer(); 
            AI.loadHistory(); 
        }
    };

    // Initialize
    AI.init();
};