async function initYukuAiPage() {
    
    // --- 0. CRITICAL DEPENDENCY LOADER ---
    const loadScript = (src) => {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                return resolve(); // Already loaded
            }
            const s = document.createElement('script');
            s.src = src;
            s.async = false; // Force sequential loading
            s.onload = () => resolve();
            s.onerror = () => reject(new Error(`Failed to load ${src}`));
            document.body.appendChild(s);
        });
    };

    const loadStyle = (href) => {
        if (document.querySelector(`link[href="${href}"]`)) return;
        const l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = href;
        document.head.appendChild(l);
    };

    // Initial Loader UI
    const chatStream = document.getElementById('chat-stream');
    if(chatStream) chatStream.innerHTML = '<div class="flex h-full items-center justify-center text-emerald-500 animate-pulse text-xs">Initializing AI Neural Core...</div>';

    try {
        // 1. Load Styles
        loadStyle('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/codemirror.min.css');
        loadStyle('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/theme/dracula.min.css');

        // 2. Load Libraries Sequentially (Guarantees Order)
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/codemirror.min.js');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/mode/javascript/javascript.min.js');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/mode/xml/xml.min.js');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/mode/css/css.min.js');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/mode/htmlmixed/htmlmixed.min.js');
        
        // Load Mermaid & Tesseract
        await loadScript('https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js');
        await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js');

        // 3. Initialize Mermaid (Safe Check)
        if (window.mermaid) {
            mermaid.initialize({ startOnLoad: false, theme: 'dark', securityLevel: 'loose' });
        } else {
            console.warn("Mermaid failed to load globally.");
        }

    } catch (e) {
        console.error("Dependency Error:", e);
        if(chatStream) chatStream.innerHTML = `<div class="text-red-500 text-center mt-20 text-xs">System Error: Failed to load AI Core.<br>${e.message}</div>`;
        return; 
    }

    // --- 1. STATE & DOM ELEMENTS ---
    const state = {
        agent: 'mistral_default',
        chatId: null,
        vfs: {},
        history: [],
        files: [],
        ocrText: "",
        cm: null
    };

    const els = {
        chat: document.getElementById('chat-stream'),
        form: document.getElementById('ai-form'),
        prompt: document.getElementById('prompt'),
        fileTags: document.getElementById('file-tags'),
        ideOverlay: document.getElementById('ide-overlay'),
        ideBtn: document.getElementById('ide-btn'),
        ideFile: document.getElementById('ide-file'),
        tree: document.getElementById('file-tree'),
        preview: document.getElementById('preview'),
        editor: document.getElementById('editor'),
        slider: document.getElementById('history-slider'),
        timeline: document.getElementById('timeline'),
        historyList: document.getElementById('history-list'),
        activeAgent: document.getElementById('active-agent'),
        toolsPopup: document.getElementById('tools-popup'),
        fileInput: document.getElementById('file-upload'),
        drawer: document.getElementById('chat-drawer')
    };

    // --- 2. SYSTEM READY UI ---
    if(els.chat) els.chat.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full opacity-30 select-none">
            <div class="w-20 h-20 border-2 border-emerald-500 rounded-full flex items-center justify-center mb-4 animate-pulse shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                <div class="w-14 h-14 bg-emerald-500 rounded-full"></div>
            </div>
            <p class="font-orbitron text-emerald-500 text-xl tracking-[0.2em]">SYSTEM READY</p>
            <p class="text-xs text-emerald-700 mt-2 font-mono">Pollinations AI • VFS Engine • Flux Vision</p>
        </div>`;

    // Initialize Components
    initCodeMirror();
    loadHistory();

    // --- 3. CORE LOGIC ---

    window.newChat = async () => {
        try {
            const res = await apiCall('/ai/chats/new', 'POST');
            state.chatId = res.chat_id;
            state.vfs = {};
            state.history = [];
            state.files = [];
            els.chat.innerHTML = '';
            els.ideBtn.classList.add('hidden');
            renderFileTags();
            appendMsg("system", "New secure session initialized.");
            loadHistory();
            if(window.innerWidth < 768 && els.drawer) els.drawer.classList.add('-translate-x-full');
        } catch(e) { alert("Error creating chat: " + e.message); }
    };

    if (els.form) {
        els.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const text = els.prompt.value.trim();
            if (!text && state.files.length === 0) return;

            // Inject OCR Data into Prompt
            let finalPrompt = text;
            if (state.ocrText) finalPrompt += `\n\n[VISION CONTEXT]:\n${state.ocrText}`;

            // UI Updates
            appendMsg("user", text, state.files.map(f=>f.name));
            els.prompt.value = '';
            
            // Prepare FormData
            const formData = new FormData();
            formData.append('prompt', finalPrompt);
            formData.append('tool_id', state.agent);
            if (state.chatId) formData.append('chat_id', state.chatId);
            state.files.forEach(f => formData.append('files', f));

            // Reset Files
            state.files = []; state.ocrText = ""; renderFileTags();
            const loader = appendLoader();

            try {
                const endpoint = state.agent === 'flux_image' ? '/ai/generate-image' : '/ai/ask';
                const token = window.app.getAuthToken();
                
                const res = await fetch(`${window.app.config.API_BASE_URL}${endpoint}`, {
                    method: 'POST', 
                    headers: { 'Authorization': `Bearer ${token}` }, 
                    body: formData
                });
                
                const data = await res.json();
                document.getElementById(loader).remove();

                if(data.status !== 'success') throw new Error(data.detail || "Request failed");

                state.chatId = data.chat_id;

                // Handle Response
                if (data.image_url) {
                    appendImage(data.image_url, data.download_filename);
                } else {
                    appendMsg("ai", data.response || data.data?.response);
                    
                    // VFS Logic
                    if (data.vfs && Object.keys(data.vfs).length > 0) {
                        state.vfs = data.vfs;
                        state.history.push(JSON.parse(JSON.stringify(state.vfs))); // Snapshot
                        updateIDE();
                        els.ideBtn.classList.remove('hidden', 'opacity-0');
                        
                        if(data.data?.is_vfs_update) {
                            window.toggleIDE(true);
                            appendMsg("system", "VFS Updated. Opening IDE Environment...");
                        }
                    }
                }
                loadHistory();
            } catch (err) {
                document.getElementById(loader)?.remove();
                appendMsg("system", `Error: ${err.message}`);
            }
        });
    }

    // --- 4. VISION ENGINE (Tesseract) ---
    window.handleFiles = async (input) => {
        state.files = Array.from(input.files);
        state.ocrText = "";
        renderFileTags();
        
        const imgs = state.files.filter(f => f.type.startsWith('image/'));
        if (imgs.length > 0) {
            const originalText = els.activeAgent.textContent;
            els.activeAgent.textContent = "👁️ Vision Processing...";
            els.activeAgent.classList.add("animate-pulse", "text-emerald-400");
            
            try {
                if (!window.Tesseract) await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js');
                const worker = await Tesseract.createWorker('eng');
                for (const img of imgs) {
                    const ret = await worker.recognize(img);
                    state.ocrText += `\nFile: ${img.name}\nText: ${ret.data.text}\n`;
                }
                await worker.terminate();
                els.activeAgent.textContent = "👁️ Vision Data Ready";
            } catch(e) {
                console.error(e);
                els.activeAgent.textContent = "Vision Error (Using Metadata)";
            } finally {
                setTimeout(() => {
                    els.activeAgent.textContent = originalText;
                    els.activeAgent.classList.remove("animate-pulse", "text-emerald-400");
                }, 2000);
            }
        }
    };

    // --- 5. IDE ENGINE ---
    function initCodeMirror() {
        if (!els.editor) return;
        // Safety check for CodeMirror loaded
        if (typeof CodeMirror === 'undefined') return;

        state.cm = CodeMirror.fromTextArea(els.editor, {
            mode: 'htmlmixed', theme: 'dracula', lineNumbers: true, lineWrapping: true
        });
        state.cm.on('change', () => {
            const file = document.getElementById('ide-file').textContent;
            if(state.vfs[file]) state.vfs[file] = state.cm.getValue();
        });
    }

    window.runCode = async () => {
        const code = state.cm.getValue();
        const file = document.getElementById('ide-file').textContent;
        const lang = file.endsWith('.js') ? 'javascript' : (file.endsWith('.py') ? 'python' : null);
        
        if(!lang) return alert("Only Python/JS Execution Supported");

        appendMsg("system", "🚀 Sending Code to Piston Sandbox...");
        const res = await apiCall('/ai/run-code', 'POST', { language: lang, code: code });
        
        if (res.run && res.run.stderr) {
            // Auto-Healing Hook
            if(confirm(`Execution Error:\n${res.run.stderr}\n\nAuto-fix with AI?`)) {
                els.prompt.value = `Fix this error in ${file}:\n${res.run.stderr}`;
                els.form.dispatchEvent(new Event('submit'));
            }
        } else {
            alert(`OUTPUT:\n${res.run?.output || 'No output'}`);
        }
    };

    window.goLive = () => window.open(`${window.app.config.API_BASE_URL}/ai/live/${state.chatId}`, '_blank');
    window.downloadZip = () => window.open(`${window.app.config.API_BASE_URL}/ai/download-project/${state.chatId}`, '_blank');

    function updateIDE() {
        if(!els.tree) return;
        els.tree.innerHTML = '';
        Object.keys(state.vfs).forEach(f => {
            const div = document.createElement('div');
            div.className = "cursor-pointer hover:bg-emerald-900/30 text-gray-400 hover:text-emerald-300 p-1.5 rounded flex items-center gap-2 text-[11px]";
            div.innerHTML = `<span>📄</span> ${f}`;
            div.onclick = () => openFile(f);
            els.tree.appendChild(div);
        });
        
        // Time Travel Logic
        if (state.history.length > 1 && els.slider) {
            els.timeline.classList.remove('hidden');
            els.slider.max = state.history.length - 1;
            els.slider.value = state.history.length - 1;
            els.slider.oninput = (e) => {
                state.vfs = JSON.parse(JSON.stringify(state.history[e.target.value]));
                updateIDE();
                openFile(document.getElementById('ide-file').textContent);
            };
        }
    }

    function openFile(f) {
        if(!state.vfs[f]) return;
        state.cm.setValue(state.vfs[f]);
        document.getElementById('ide-file').textContent = f;
        
        if(f.endsWith('.css')) state.cm.setOption('mode', 'css');
        else if(f.endsWith('.js')) state.cm.setOption('mode', 'javascript');
        else state.cm.setOption('mode', 'htmlmixed');

        if(f.endsWith('.html')) {
            let html = state.vfs[f];
            if(state.vfs['style.css']) html = html.replace('</head>', `<style>${state.vfs['style.css']}</style></head>`);
            if(state.vfs['script.js']) html = html.replace('</body>', `<script>${state.vfs['script.js']}</script></body>`);
            els.preview.srcdoc = html;
        }
    }

    window.toggleIDE = (force) => {
        const overlay = els.ideOverlay;
        if(!overlay) return;
        if (force === true) overlay.classList.remove('closed');
        else if (force === false) overlay.classList.add('closed');
        else overlay.classList.toggle('closed');
        
        if (!overlay.classList.contains('closed')) {
            if (state.vfs['index.html']) openFile('index.html');
            else if (Object.keys(state.vfs).length > 0) openFile(Object.keys(state.vfs)[0]);
        }
    };

    // --- 6. UTILS & UI ---
    window.setAgent = (a) => {
        state.agent = a;
        els.activeAgent.textContent = `Module: ${a}`;
        els.toolsPopup.classList.add('hidden');
    };

    window.shareChat = async () => {
        if(!state.chatId) return alert("Start chat first");
        const res = await apiCall(`/ai/share-link/${state.chatId}`, 'POST');
        prompt("Copy Link:", res.link);
    };

    window.copyCode = (b64) => {
        navigator.clipboard.writeText(decodeURIComponent(escape(atob(b64))));
        alert("Copied!");
    };

    window.openSettings = () => alert("System Settings: Active");

    async function apiCall(url, method, body) {
        const token = window.app.getAuthToken();
        const opts = { method, headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } };
        if(body) opts.body = JSON.stringify(body);
        const r = await fetch(window.app.config.API_BASE_URL + url, opts);
        return await r.json();
    }

    function appendMsg(role, text, files = []) {
        const div = document.createElement('div');
        div.className = `flex w-full mb-4 ${role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`;
        
        // Mermaid
        if (text && text.includes('```mermaid') && window.mermaid) {
            setTimeout(() => {
                document.querySelectorAll('.mermaid-chart').forEach(el => {
                    if(!el.dataset.processed) {
                        try {
                            mermaid.render('m'+Date.now(), el.textContent).then(r => el.innerHTML = r.svg);
                        } catch(e){ el.innerHTML = "Diagram Error"; }
                        el.dataset.processed = true;
                    }
                });
            }, 500);
            text = text.replace(/```mermaid([\s\S]*?)```/g, '<div class="mermaid-chart bg-black/40 p-4 rounded overflow-x-auto">$1</div>');
        }
        
        // Code Blocks
        text = text ? text.replace(/```(\w+)?([\s\S]*?)```/g, (m, l, c) => {
            const b64 = btoa(unescape(encodeURIComponent(c)));
            return `<div class="bg-[#111] rounded-lg border border-white/10 mt-2 mb-2 overflow-hidden"><div class="bg-white/5 px-3 py-1.5 flex justify-between items-center border-b border-white/5"><span class="text-[10px] uppercase text-gray-500 font-bold">${l||'CODE'}</span><button onclick="window.copyCode('${b64}')" class="text-[10px] text-emerald-500 hover:text-white transition-colors">COPY</button></div><pre class="p-3 text-xs overflow-x-auto text-gray-300 custom-scrollbar font-mono leading-relaxed">${c.replace(/</g,'&lt;')}</pre></div>`;
        }) : "";

        div.innerHTML = `
            <div class="max-w-[85%] md:max-w-[75%] ${role === 'user' ? 'bg-emerald-900/20 border-emerald-500/40' : 'bg-black/40 border-white/10'} border p-4 rounded-2xl ${role==='user'?'rounded-tr-none':'rounded-tl-none'} backdrop-blur-md shadow-lg">
                ${role === 'user' && files.length ? `<div class="text-[10px] text-emerald-500 mb-2 flex flex-wrap gap-2">${files.map(n=>`<span class="bg-black/30 px-2 py-1 rounded">📎 ${n}</span>`).join('')}</div>` : ''}
                <div class="text-sm text-gray-200 leading-relaxed font-light whitespace-pre-wrap">${text}</div>
            </div>`;
        els.chat.appendChild(div);
        els.chat.scrollTop = els.chat.scrollHeight;
    }

    function appendImage(url, name) {
        const div = document.createElement('div');
        div.className = "flex w-full mb-4 justify-start animate-fade-in-up";
        div.innerHTML = `
            <div class="bg-black/40 border border-emerald-500/30 p-2 rounded-xl rounded-tl-none max-w-[70%] shadow-[0_0_20px_rgba(16,185,129,0.1)] group">
                <img src="${url}" class="rounded-lg w-full hover:scale-105 transition-transform duration-500 cursor-pointer" onclick="window.open('${url}')">
                <a href="${url}" download="${name}" class="block text-center bg-emerald-500/10 text-emerald-400 text-[10px] py-1.5 mt-2 rounded hover:bg-emerald-500 hover:text-black transition-all">DOWNLOAD</a>
            </div>`;
        els.chat.appendChild(div);
        els.chat.scrollTop = els.chat.scrollHeight;
    }

    function appendLoader() {
        const id = 'load-' + Date.now();
        const div = document.createElement('div');
        div.id = id; 
        div.className = "flex items-center gap-2 text-xs text-emerald-500/70 ml-2 animate-pulse my-2";
        div.innerHTML = `<div class="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Processing...`;
        els.chat.appendChild(div);
        els.chat.scrollTop = els.chat.scrollHeight;
        return id;
    }

    function renderFileTags() {
        els.fileTags.innerHTML = state.files.map(f => `<span class="text-[9px] bg-emerald-900/40 text-emerald-300 px-2 py-1 rounded border border-emerald-500/20 whitespace-nowrap flex items-center gap-1">📎 ${f.name}</span>`).join('');
    }

    async function loadHistory() {
        try {
            const chats = await apiCall('/ai/chats', 'GET');
            els.historyList.innerHTML = chats.map(c => `
                <div onclick="window.loadChat('${c.id}')" class="p-2 text-xs text-gray-400 hover:text-white cursor-pointer hover:bg-white/5 truncate border-b border-emerald-500/5 transition-colors flex justify-between items-center group">
                    <span class="truncate w-40">${c.title}</span>
                    <span class="opacity-0 group-hover:opacity-100 text-[10px] text-emerald-500">➜</span>
                </div>
            `).join('');
        } catch(e) { console.log("History offline"); }
    }

    window.loadChat = async (id) => {
        try {
            const data = await apiCall(`/ai/chats/${id}`, 'GET');
            state.chatId = data.id;
            state.vfs = data.vfs_state || {};
            state.history = [state.vfs];
            els.chat.innerHTML = '';
            
            data.messages.forEach(m => {
                if(m.image_data || m.image) appendImage(m.image_data || m.image, "gen.jpg");
                else appendMsg(m.role || 'ai', m.content || m.response);
            });
            
            if(Object.keys(state.vfs).length > 0) {
                updateIDE();
                els.ideBtn.classList.remove('hidden', 'opacity-0');
            } else {
                els.ideBtn.classList.add('hidden');
            }
            if(window.innerWidth < 768 && els.drawer) els.drawer.classList.add('-translate-x-full');
        } catch(e) { alert("Load failed"); }
    };
}

// Expose Global
window.initYukuAiPage = initYukuAiPage;