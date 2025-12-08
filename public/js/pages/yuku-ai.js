window.initYukuAiPage = function() {
    console.log("🚀 DevOps AI Module Initialized");
    
    const API_BASE = 'https://giant-noell-pixelart002-1c1d1fda.koyeb.app';
    let currentChatId = null;
    
    // --- UI CONTROLLER ---
    window.AI_UI = {
        
        // Drawer Toggle Logic
        toggleDrawer: () => {
            const drawer = document.getElementById('chat-drawer');
            const overlay = document.getElementById('drawer-overlay');
            
            if (!drawer || !overlay) return;
            
            const isOpen = !drawer.classList.contains('-translate-x-full');
            
            if (isOpen) {
                // Close
                drawer.classList.add('-translate-x-full');
                overlay.classList.remove('opacity-100');
                setTimeout(() => overlay.classList.add('hidden'), 300);
            } else {
                // Open
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
            // Remove Empty State if exists
            const emptyState = c.querySelector('.opacity-30');
            if (emptyState) emptyState.remove();
            
            const div = document.createElement('div');
            div.className = "flex justify-end animate-fade-in mb-6";
            div.innerHTML = `
                <div class="max-w-[85%] bg-[#1a1a1a] border border-white/10 rounded-2xl rounded-tr-sm px-5 py-3 text-sm text-gray-200 font-mono shadow-md leading-relaxed">
                    ${text.replace(/\n/g, '<br>')}
                </div>
            `;
            c.appendChild(div);
            AI_UI.scrollToBottom();
        },
        
        appendAIMsg: (text) => {
            const c = document.getElementById('messages-container');
            const div = document.createElement('div');
            div.className = "flex justify-start animate-fade-in w-full mb-8";
            
            // Parse Markdown
            let htmlContent = text;
            if (typeof marked !== 'undefined') {
                htmlContent = marked.parse(text);
            }
            
            div.innerHTML = `
                <div class="max-w-[95%] bg-transparent pl-4 border-l-2 border-emerald-500/30">
                    <div class="prose prose-invert max-w-none text-sm font-sans leading-7 text-gray-300">
                        ${htmlContent}
                    </div>
                </div>
            `;
            c.appendChild(div);
            
            // Apply Syntax Highlighting
            if (typeof Prism !== 'undefined') {
                Prism.highlightAllUnder(div);
            }
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
                // Auto-resize
                tx.addEventListener('input', function() {
                    this.style.height = 'auto';
                    this.style.height = (this.scrollHeight) + 'px';
                    if (this.value === '') this.style.height = 'auto';
                });
                
                // Enter Key
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
                    // Silent refresh history
                    AI.loadHistory();
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
                    div.className = `p-3 rounded-lg cursor-pointer transition-all duration-200 border border-transparent flex flex-col gap-1 
                        ${isActive ? 'bg-white/10 border-white/10' : 'hover:bg-white/5 hover:border-white/5'}`;
                    
                    div.onclick = () => {
                        AI.loadChat(chat.id);
                        AI_UI.toggleDrawer(); // Close drawer on mobile
                    };
                    
                    div.innerHTML = `
                        <span class="text-xs text-gray-200 font-medium truncate tracking-wide">${chat.title}</span>
                        <span class="text-[10px] text-gray-600 font-mono">${new Date(chat.date).toLocaleDateString()}</span>
                    `;
                    list.appendChild(div);
                });
            } catch (e) { console.error(e); }
        },
        
        loadChat: async (id) => {
            const token = localStorage.getItem('authToken');
            currentChatId = id;
            const container = document.getElementById('messages-container');
            container.innerHTML = '<div class="h-full flex items-center justify-center text-xs text-gray-600 font-mono animate-pulse">RETRIEVING DATA...</div>';
            
            try {
                const res = await fetch(`${API_BASE}/ai/chats/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
                const chat = await res.json();
                
                container.innerHTML = ''; // Clear loading
                
                if (chat.messages) {
                    chat.messages.forEach(msg => {
                        if (msg.role === 'user') AI_UI.appendUserMsg(msg.content);
                        else AI_UI.appendAIMsg(msg.content);
                    });
                }
                
                AI.loadHistory(); // Update active state
            } catch (e) {
                container.innerHTML = '<div class="h-full flex items-center justify-center text-xs text-red-500 font-mono">ERROR LOADING CHAT</div>';
            }
        },
        
        newChat: () => {
            currentChatId = null;
            const container = document.getElementById('messages-container');
            
            // Reset to "Ready" State (Matches your HTML)
            container.innerHTML = `
                <div class="h-full flex flex-col items-center justify-center opacity-30 select-none">
                    <div class="w-16 h-16 rounded-2xl border border-white/10 flex items-center justify-center mb-4">
                        <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
                    </div>
                    <p class="font-mono text-xs text-gray-500 tracking-widest">READY</p>
                </div>
            `;
            
            AI_UI.toggleDrawer();
            AI.loadHistory();
        }
    };
    
    // Initialize
    AI.init();
};