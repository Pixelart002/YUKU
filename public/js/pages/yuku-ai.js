function initYukuAiPage() {
    const ui = {
        chatHistory: document.getElementById('chat-history'),
        executeBtn: document.getElementById('ai-execute-btn'),
        promptInput: document.getElementById('ai-prompt-input'),
        codeSection: document.getElementById('code-section'),
        fileTabs: document.getElementById('file-tabs'),
        codeEditorContainer: document.getElementById('code-editor-container'),
        previewBtn: document.getElementById('preview-btn'),
        previewContainer: document.getElementById('preview-container'),
        previewFrame: document.getElementById('preview-frame'),
        chipsContainer: document.getElementById('chips-container'),
    };
    
    let chatId = sessionStorage.getItem('yuku_chat_id') || crypto.randomUUID();
    sessionStorage.setItem('yuku_chat_id', chatId);
    
    let codeMirrorInstances = {};
    let activeFile = null;
    
    const createOrUpdateCodeEditor = (files) => {
        ui.codeSection.classList.remove('hidden');
        ui.fileTabs.innerHTML = '';
        codeMirrorInstances = {}; // Reset instances
        
        Object.keys(files).forEach((filename, index) => {
            // Create Tab
            const tab = document.createElement('div');
            tab.className = 'file-tab';
            tab.textContent = filename;
            tab.dataset.filename = filename;
            ui.fileTabs.appendChild(tab);
            
            // Create Editor Instance (hidden by default)
            const editorWrapper = document.createElement('div');
            editorWrapper.id = `editor-${filename}`;
            editorWrapper.style.display = 'none';
            ui.codeEditorContainer.appendChild(editorWrapper);
            
            let mode = 'xml';
            if (filename.endsWith('.css')) mode = 'css';
            if (filename.endsWith('.js')) mode = 'javascript';
            
            codeMirrorInstances[filename] = CodeMirror(editorWrapper, {
                value: files[filename],
                mode: mode,
                theme: 'dracula',
                lineNumbers: true,
                lineWrapping: true,
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
                
                // Hide old active elements
                ui.fileTabs.querySelector('.file-tab.active').classList.remove('active');
                document.getElementById(`editor-${activeFile}`).style.display = 'none';
                
                // Show new active elements
                tab.classList.add('active');
                activeFile = filename;
                document.getElementById(`editor-${activeFile}`).style.display = 'block';
                codeMirrorInstances[activeFile].refresh();
            });
        });
    };
    
    const displayMessage = (content, author = 'user') => {
        const bubbleClass = author === 'user' ? 'user-bubble' : 'yuku-bubble';
        const justification = author === 'user' ? 'justify-end' : 'justify-start';
        const bubble = `<div class="flex ${justification}"><div class="chat-bubble ${bubbleClass} rounded-lg p-3">${content}</div></div>`;
        const target = ui.chatHistory.querySelector('.thinking') || ui.chatHistory;
        if (target.classList.contains('thinking')) {
            target.outerHTML = bubble;
        } else {
            target.innerHTML += bubble;
        }
        ui.chatHistory.scrollTop = ui.chatHistory.scrollHeight;
    };
    
    const displayYukuResponse = (response) => {
        let contentHtml = '';
        if (response.type === 'html_template') {
            contentHtml = response.content;
        } else if (response.type === 'code_project') {
            createOrUpdateCodeEditor(response.content);
            contentHtml = `<p class="text-sm">I have created a multi-file project for you in the code editor above.</p>`;
        } else if (response.type === 'error') {
            contentHtml = `<p class="text-red-400 text-sm">[ERROR from ${response.source}]: ${response.content}</p>`;
        } else {
            contentHtml = `<p class="text-sm">${response.content}</p>`;
        }
        
        displayMessage(`<p class="font-bold text-accent-green">YUKU (${response.source})</p>${contentHtml}`, 'yuku');
        
        // Display Chips
        ui.chipsContainer.innerHTML = '';
        if (response.chips && response.chips.length > 0) {
            response.chips.forEach(chipText => {
                const chip = document.createElement('button');
                chip.className = 'chip-btn';
                chip.textContent = chipText;
                chip.onclick = () => {
                    ui.promptInput.value = chipText;
                    handleSend();
                };
                ui.chipsContainer.appendChild(chip);
            });
        }
    };
    
    const handleSend = async () => {
        const prompt = ui.promptInput.value.trim();
        if (!prompt) return;
        
        displayMessage(`<p class="text-sm">${prompt}</p>`, 'user');
        ui.promptInput.value = '';
        ui.chipsContainer.innerHTML = '';
        
        ui.chatHistory.innerHTML += `<div class="flex justify-start thinking"><div class="chat-bubble yuku-bubble rounded-lg p-3"><p class="text-sm text-text-secondary animate-pulse">YUKU is thinking...</p></div></div>`;
        ui.chatHistory.scrollTop = ui.chatHistory.scrollHeight;
        
        const formData = new FormData();
        formData.append('prompt', prompt);
        formData.append('chat_id', chatId);
        
        const response = await window.app.handleAiQuery(formData);
        if (response && response.yuku_response) {
            displayYukuResponse(response.yuku_response);
        } else {
            displayYukuResponse({ type: 'error', source: 'Internal', content: 'Failed to get a response.' });
        }
    };
    
    ui.executeBtn.addEventListener('click', handleSend);
    ui.promptInput.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault();
            handleSend(); } });
    
    ui.previewBtn.addEventListener('click', async () => {
        const files = {};
        for (const filename in codeMirrorInstances) {
            files[filename] = codeMirrorInstances[filename].getValue();
        }
        const previewData = await window.app.hostCodeForPreview(files);
        if (previewData && previewData.preview_url) {
            ui.previewFrame.src = previewData.preview_url;
            ui.previewContainer.classList.remove('hidden');
        }
    });
}