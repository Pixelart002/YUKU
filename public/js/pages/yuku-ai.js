// ==========================================
// YUKU NEURAL CORE v3.2 (Mission Control)
// ==========================================

async function initYukuAiPage() {

    // --- 0. DEPENDENCY CHECK & INIT ---
    if (window.mermaid) mermaid.initialize({ startOnLoad: false, theme: 'dark' });

    // --- 1. SYSTEM STATE ---
    const state = {
        agent: 'mistral_default',
        chatId: null,
        vfs: {},
        files: [],
        ocrText: "",
        cm: null,
        isProcessing: false
    };

    // --- 2. UI HELPER (DOM Access) ---
    const UI = {
        get: (id) => document.getElementById(id),

        showToast: function(msg, type = 'info') {
            const box = this.get('toast-box');
            if (!box) return;
            const d = document.createElement('div');
            const c = { success: 'bg-emerald-600', error: 'bg-red-600', info: 'bg-gray-800' };
            d.className = `${c[type]} text-white px-4 py-2 rounded shadow-lg text-xs font-bold mb-2 animate-pop pointer-events-auto border border-white/10 flex items-center gap-2`;
            d.innerHTML = `<span>${type === 'success' ? '✅' : 'ℹ️'}</span> ${msg}`;
            box.appendChild(d);
            setTimeout(() => d.remove(), 3000);
        },

        toggleDrawer: function() {
            const d = this.get('drawer');
            if (d) d.classList.toggle('-translate-x-full');
        },

        toggleMenu: function(id) {
            const m = this.get(id);
            if (m) m.classList.toggle('hidden');
        }
    };

    // --- 3. SYSTEM CONTROLLER ---
    const System = {
        init: async function() {
            console.log("Booting Neural Interface...");
            IDE.init();
            Chat.loadHistory();
            
            // Console Stream Listener
            window.addEventListener('message', (e) => {
                if (e.data.type === 'log') IDE.log('LOG', e.data.args.join(' '));
                if (e.data.type === 'error') IDE.log('ERR', e.data.args.join(' '), 'text-red-400');
            });

            UI.showToast("System Online", "success");
        },

        setAgent: function(a) {
            state.agent = a;
            const labels = { 'mistral_default': 'Reasoning', 'code_editor': 'Architect', 'flux_image': 'Vision' };
            const lbl = UI.get('active-module-label');
            if (lbl) lbl.innerText = `MODULE: ${labels[a] || a}`.toUpperCase();
            const menu = UI.get('module-menu');
            if (menu) menu.classList.add('hidden');
        },

        handleFiles: async function(inp) {
            state.files = Array.from(inp.files);
            const tagContainer = UI.get('file-tags');
            if (tagContainer) {
                tagContainer.innerHTML = state.files.map(f =>
                    `<span class="text-[9px] bg-emerald-900/40 text-emerald-300 px-2 py-1 rounded border border-emerald-500/20 flex-shrink-0">📎 ${f.name}</span>`
                ).join('');
            }

            // Vision OCR
            const imgs = state.files.filter(f => f.type.startsWith('image'));
            if (imgs.length > 0 && window.Tesseract) {
                UI.showToast("Scanning Vision Data...", "info");
                try {
                    const w = await Tesseract.createWorker('eng');
                    for (const f of imgs) {
                        const r = await w.recognize(f);
                        state.ocrText += `\nFILE: ${f.name}\n${r.data.text}`;
                    }
                    await w.terminate();
                    UI.showToast("Vision Extracted", "success");
                } catch (e) { console.error(e); }
            }
        },

        api: async function(url, method, body) {
            const token = window.app.getAuthToken();
            const opts = { method, headers: { 'Authorization': `Bearer ${token}` } };

            if (body instanceof FormData) {
                opts.body = body;
            } else {
                opts.headers['Content-Type'] = 'application/json';
                if (body) opts.body = JSON.stringify(body);
            }

            const r = await fetch(window.app.config.API_BASE_URL + url, opts);
            return await r.json();
        }
    };

    // --- 4. IDE ENGINE (Recursive Tree & Editor) ---
    const IDE = {
        init: function() {
            const area = UI.get('code-editor');
            if (!area) return;

            if (typeof CodeMirror !== 'undefined') {
                state.cm = CodeMirror.fromTextArea(area, {
                    mode: 'htmlmixed',
                    theme: 'dracula',
                    lineNumbers: true,
                    lineWrapping: true,
                    scrollbarStyle: 'null'
                });
                state.cm.on('change', () => {
                    const pEl = UI.get('current-filename');
                    if (pEl) {
                        const p = pEl.innerText;
                        if (state.vfs[p] !== undefined) state.vfs[p] = state.cm.getValue();
                    }
                });
            }
        },

        updateTree: function() {
            const container = UI.get('file-tree');
            if (!container) return;
            container.innerHTML = '';

            // 1. Build Nested Object Structure from Paths
            const tree = {};
            Object.keys(state.vfs).sort().forEach(path => {
                const parts = path.split('/');
                let current = tree;
                parts.forEach((part, i) => {
                    if (!current[part]) {
                        // If it's the last part, it's a file. Otherwise a folder.
                        current[part] = (i === parts.length - 1) 
                            ? { type: 'FILE', path: path, name: part } 
                            : { type: 'FOLDER', name: part, children: {} };
                    }
                    if (current[part].type === 'FOLDER') current = current[part].children;
                });
            });

            // 2. Recursive Render Function
            const renderNode = (node, parentEl) => {
                // Sort: Folders first, then Files
                const keys = Object.keys(node).sort((a, b) => {
                    const isFolderA = node[a].type === 'FOLDER';
                    const isFolderB = node[b].type === 'FOLDER';
                    if (isFolderA === isFolderB) return a.localeCompare(b);
                    return isFolderA ? -1 : 1; // Folder comes before File
                });

                keys.forEach(key => {
                    const item = node[key];
                    const div = document.createElement('div');
                    div.className = "flex flex-col";

                    const row = document.createElement('div');
                    row.className = "flex items-center gap-2 cursor-pointer hover:bg-white/5 text-gray-400 hover:text-white py-1 px-2 rounded text-[11px] select-none transition-colors group";

                    if (item.type === 'FOLDER') {
                        // Folder UI
                        row.innerHTML = `<span class="text-emerald-500/50 group-hover:text-emerald-400 transition-colors text-[9px]">▶</span> <span class="text-emerald-600/80 group-hover:text-emerald-400">📁</span> ${item.name}`;
                        
                        const childrenContainer = document.createElement('div');
                        childrenContainer.className = "folder-block hidden"; // Hidden by default
                        
                        row.onclick = () => {
                            childrenContainer.classList.toggle('open'); // Toggle visibility
                            const arrow = row.querySelector('span');
                            if (arrow) arrow.style.transform = childrenContainer.classList.contains('open') ? 'rotate(90deg)' : '';
                        };
                        
                        div.appendChild(row);
                        div.appendChild(childrenContainer);
                        renderNode(item.children, childrenContainer); // Recursion
                    } else {
                        // File UI
                        let icon = '📄';
                        if (item.name.endsWith('.html')) icon = '🌐';
                        if (item.name.endsWith('.css')) icon = '🎨';
                        if (item.name.endsWith('.js')) icon = '⚡';
                        
                        row.innerHTML = `<span class="opacity-50">${icon}</span> ${item.name}`;
                        row.onclick = () => this.openFile(item.path);
                        div.appendChild(row);
                    }
                    parentEl.appendChild(div);
                });
            };

            renderNode(tree, container);
        },

        openFile: function(path) {
            if (!state.vfs[path] || !state.cm) return;
            
            state.cm.setValue(state.vfs[path]);
            const fnEl = UI.get('current-filename');
            if(fnEl) fnEl.innerText = path;

            let m = 'htmlmixed';
            if (path.endsWith('.js')) m = 'javascript';
            if (path.endsWith('.css')) m = 'css';
            if (path.endsWith('.py')) m = 'python';
            state.cm.setOption('mode', m);

            if (path.endsWith('.html')) this.refreshPreview();
        },

        refreshPreview: function() {
            if (!state.chatId) return;
            const frame = UI.get('preview-frame');
            if(frame) {
                frame.src = `${window.app.config.API_BASE_URL}/ai/live/${state.chatId}?t=${Date.now()}`;
                this.log('SYS', 'Preview Synced', 'text-emerald-500');
            }
        },

        runCode: async function() {
            const code = state.cm.getValue();
            const path = UI.get('current-filename').innerText;
            let lang = path.endsWith('.js') ? 'javascript' : (path.endsWith('.py') ? 'python' : null);

            if (!lang) return UI.showToast("Sandbox: JS/Python Only", "error");

            this.log("SYS", "Compiling...", "text-blue-400");
            try {
                const res = await System.api('/ai/run-code', 'POST', { language: lang, code });
                if (res.run) {
                    if (res.run.stdout) this.log("OUT", res.run.stdout, "text-green-300");
                    if (res.run.stderr) this.log("ERR", res.run.stderr, "text-red-400");
                }
            } catch (e) { this.log("SYS", "Exec Failed", "text-red-500"); }
        },

        deploy: async function() {
            UI.showToast("Deploying...", "info");
            try {
                const res = await System.api(`/ai/publish/${state.chatId}`, 'POST');
                prompt("Live URL:", res.url);
                UI.showToast("Deployed!", "success");
            } catch (e) { UI.showToast("Failed", "error"); }
        },

        download: function() {
            if(state.chatId) window.open(`${window.app.config.API_BASE_URL}/ai/download-project/${state.chatId}`, '_blank');
        },

        log: function(src, msg, color = "text-gray-400") {
            const box = UI.get('console-out');
            if(!box) return;
            const l = document.createElement('div');
            l.className = `border-b border-white/5 py-1 ${color}`;
            l.innerHTML = `<span class="opacity-50 mr-2 text-[9px] font-bold">[${src}]</span>${msg.replace(/\n/g, '<br>')}`;
            box.appendChild(l);
            box.scrollTop = box.scrollHeight;
        }
    };

    // --- 5. POPUP MANAGER ---
    const Popup = {
        openIDE: function() {
            const m = UI.get('ide-modal');
            if(m) m.classList.add('active');
            
            // Wait for transition then refresh editor
            setTimeout(() => {
                if (state.cm) state.cm.refresh();
                
                // Auto-open index or first file
                if (state.vfs['index.html']) IDE.openFile('index.html');
                else if (Object.keys(state.vfs).length > 0) IDE.openFile(Object.keys(state.vfs)[0]);
            }, 150);
        },
        
        closeIDE: function() {
            const m = UI.get('ide-modal');
            if(m) m.classList.remove('active');
        },

        openSDK: async function() {
            UI.toggleDrawer();
            const m = UI.get('sdk-modal');
            if(m) m.classList.remove('hidden', 'pointer-events-none', 'opacity-0');
            await SDK.fetch();
        },
        
        closeSDK: function() {
            const m = UI.get('sdk-modal');
            if(m) m.classList.add('hidden', 'pointer-events-none', 'opacity-0');
        }
    };

    // --- 6. SDK CONTROLLER ---
    const SDK = {
        fetch: async function() {
            try {
                const res = await System.api('/ai/api-key', 'GET');
                const el = UI.get('api-key-display');
                if(el) el.value = res.api_key || "None";
            } catch(e) {}
        },
        generate: async function() {
            try {
                const res = await System.api('/ai/api-key/generate', 'POST');
                const el = UI.get('api-key-display');
                if(el) el.value = res.api_key;
            } catch(e){ UI.showToast("Error", "error"); }
        },
        copy: function() {
            const el = UI.get('api-key-display');
            if(el) {
                navigator.clipboard.writeText(el.value);
                UI.showToast("Copied!", "success");
            }
        }
    };

    // --- 7. CHAT CONTROLLER ---
    const Chat = {
        new: async function() {
            try {
                const res = await System.api('/ai/chats/new', 'POST');
                state.chatId = res.chat_id;
                state.vfs = {};
                const stream = UI.get('chat-stream');
                if(stream) stream.innerHTML = '';
                
                Popup.closeIDE();
                const btn = UI.get('ide-trigger-btn');
                if(btn) btn.classList.add('hidden');
                
                UI.showToast("New Session", "success");
            } catch (e) { UI.showToast("Failed", "error"); }
        },

        send: async function(e) {
            e.preventDefault();
            const input = UI.get('prompt');
            const text = input.value.trim();
            if (!text && state.files.length === 0) return;

            let prompt = text;
            if (state.ocrText) prompt += `\n\n[VISION DATA]:\n${state.ocrText}`;

            this.appendMsg("user", text, state.files.map(f => f.name));
            input.value = '';
            
            const form = new FormData();
            form.append('prompt', prompt);
            form.append('tool_id', state.agent);
            if (state.chatId) form.append('chat_id', state.chatId);
            state.files.forEach(f => form.append('files', f));
            
            state.files = []; state.ocrText = ""; 
            const tags = UI.get('file-tags');
            if(tags) tags.innerHTML = '';
            
            const loadId = this.appendLoader();

            try {
                const ep = state.agent === 'flux_image' ? '/ai/generate-image' : '/ai/ask';
                const token = window.app.getAuthToken();
                const res = await fetch(`${window.app.config.API_BASE_URL}${ep}`, {
                    method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: form
                });
                const data = await res.json();
                
                const loader = UI.get(loadId);
                if(loader) loader.remove();
                
                state.chatId = data.chat_id;

                if (data.image_url) {
                    this.appendImg(data.image_url);
                } else {
                    this.appendMsg("ai", data.response);
                    
                    if (data.vfs && Object.keys(data.vfs).length > 0) {
                        state.vfs = data.vfs;
                        IDE.updateTree();
                        
                        const btn = UI.get('ide-trigger-btn');
                        if(btn) btn.classList.remove('hidden');
                        
                        if (data.data?.is_vfs_update) {
                            Popup.openIDE();
                            IDE.refreshPreview();
                            UI.showToast("VFS Updated", "success");
                        }
                    }
                }
                this.loadHistory();
            } catch (e) {
                const loader = UI.get(loadId);
                if(loader) loader.remove();
                this.appendMsg("system", "Error: " + e.message);
            }
        },

        appendMsg: function(role, text, files = []) {
            const box = UI.get('chat-stream');
            if(!box) return;

            const div = document.createElement('div');
            div.className = `flex w-full mb-6 ${role === 'user' ? 'justify-end' : 'justify-start'} animate-pop-in`;
            
            if (text.includes('```mermaid') && window.mermaid) {
                setTimeout(() => document.querySelectorAll('.mermaid-chart').forEach(el => {
                    if (!el.dataset.d) { mermaid.init(undefined, el); el.dataset.d = true; }
                }), 200);
                text = text.replace(/```mermaid([\s\S]*?)```/g, '<div class="mermaid-chart bg-black/20 p-4 rounded border border-emerald-500/20 overflow-x-auto">$1</div>');
            }

            const html = window.marked ? marked.parse(text) : text.replace(/\n/g, '<br>');
            div.innerHTML = `
                <div class="${role==='user'?'bg-emerald-900/20 border-emerald-500/40':'bg-[#18181b] border-white/10'} border p-4 rounded-xl max-w-[85%] shadow-lg backdrop-blur-md">
                    ${role === 'user' && files.length ? `<div class="text-[10px] text-emerald-400 mb-2 font-mono border-b border-emerald-500/20 pb-1">📎 ${files.join(', ')}</div>` : ''}
                    <div class="prose prose-invert prose-sm text-sm leading-relaxed font-light">${html}</div>
                </div>`;
            box.appendChild(div);
            box.scrollTop = box.scrollHeight;
        },

        appendImg: function(url) {
            const box = UI.get('chat-stream');
            if(!box) return;
            const div = document.createElement('div');
            div.className = "flex w-full mb-6 justify-start animate-pop-in";
            div.innerHTML = `<div class="bg-[#18181b] border border-white/10 p-2 rounded-xl max-w-[70%] shadow-lg"><img src="${url}" class="rounded-lg w-full mb-2"><a href="${url}" download="gen.jpg" class="block text-center bg-white/5 text-xs py-1.5 rounded hover:bg-emerald-500 hover:text-black transition-colors font-bold">DOWNLOAD ASSET</a></div>`;
            box.appendChild(div);
            box.scrollTop = box.scrollHeight;
        },

        appendLoader: function() {
            const id = 'l-' + Date.now();
            const box = UI.get('chat-stream');
            if(box) {
                box.insertAdjacentHTML('beforeend', `<div id="${id}" class="text-xs text-emerald-500 animate-pulse ml-2 mb-4">Thinking...</div>`);
                box.scrollTop = box.scrollHeight;
            }
            return id;
        },

        loadHistory: async function() {
            try {
                const chats = await System.api('/ai/chats', 'GET');
                const list = UI.get('history-list');
                if(list) list.innerHTML = chats.map(c => `
                    <div onclick="window.Chat.load('${c.id}')" class="p-3 text-xs text-gray-400 hover:text-white cursor-pointer hover:bg-white/5 truncate border-b border-white/5 flex justify-between group transition-colors">
                        <span class="font-mono">${c.title}</span><span class="opacity-0 group-hover:opacity-100 text-emerald-500">➜</span>
                    </div>`).join('');
            } catch (e) {}
        },

        load: async function(id) {
            const data = await System.api(`/ai/chats/${id}`, 'GET');
            state.chatId = data.id;
            state.vfs = data.vfs_state || {};
            
            const stream = UI.get('chat-stream');
            if(stream) stream.innerHTML = '';

            data.messages.forEach(m => {
                if (m.image_data) this.appendImg(m.image_data);
                else this.appendMsg(m.role || 'ai', m.content || m.response);
            });

            const btn = UI.get('ide-trigger-btn');
            if (Object.keys(state.vfs).length > 0) {
                IDE.updateTree();
                if(btn) btn.classList.remove('hidden');
            } else {
                if(btn) btn.classList.add('hidden');
            }
            UI.toggleDrawer();
        }
    };

    // --- 8. GLOBAL BINDING ---
    window.UI = UI;
    window.Popup = Popup;
    window.SDK = SDK;
    window.Chat = Chat;
    window.System = System;
    window.IDE = IDE;
    
    window.toggleDrawer = UI.toggleDrawer;
    window.newChat = Chat.new;

    // Start App
    System.init();
    const form = UI.get('ai-form');
    if(form) form.addEventListener('submit', (e) => Chat.send(e));
}

window.initYukuAiPage = initYukuAiPage;