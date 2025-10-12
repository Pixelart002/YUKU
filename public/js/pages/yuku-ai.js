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
        toolSelectBtn: document.getElementById('tool-select-btn'),
        toolModal: document.getElementById('tool-modal'),
        closeModalBtn: document.getElementById('close-modal-btn'),
        toolList: document.getElementById('tool-list'),
        fileInput: document.getElementById('file-input'),
        attachFileBtn: document.getElementById('attach-file-btn'),
        filePreviewContainer: document.getElementById('file-preview-container'),
    };

    let chatId = sessionStorage.getItem('yuku_chat_id') || crypto.randomUUID();
    sessionStorage.setItem('yuku_chat_id', chatId);
    let toolOverride = null;
    let codeMirrorInstances = {};
    let activeFile = null;

    const createOrUpdateCodeEditor = (files) => {
        ui.codeSection.classList.remove('hidden');
        ui.fileTabs.innerHTML = '';
        ui.codeEditorContainer.innerHTML = '';
        codeMirrorInstances = {};
        Object.keys(files).forEach((filename, index) => {
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
            
            let mode = 'xml';
            if (filename.endsWith('.css')) mode = 'css';
            if (filename.endsWith('.js')) mode = 'javascript';

            codeMirrorInstances[filename] = CodeMirror(editorWrapper, { value: files[filename], mode: mode, theme: 'dracula', lineNumbers: true, lineWrapping: true });
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
                ui.fileTabs.querySelector('.file-tab.active').classList.remove('active');
                document.getElementById(`editor-${activeFile.replace(/\./g, '_')}`).style.display = 'none';
                tab.classList.add('active');
                activeFile = filename;
                document.getElementById(`editor-${activeFile.replace(/\./g, '_')}`).style.display = 'block';
                codeMirrorInstances[activeFile].refresh();
            });
        });
    };

    const displayMessage = (content, author) => {
        const bubbleClass = author === 'user' ? 'user-bubble' : 'yuku-bubble';
        const justification = author === 'user' ? 'justify-end' : 'justify-start';
        const bubble = `<div class="flex ${justification}"><div class="chat-bubble ${bubbleClass} rounded-lg p-3">${content}</div></div>`;
        const target = ui.chatHistory.querySelector('.thinking');
        if (target) {
            target.outerHTML = bubble;
        } else {
            ui.chatHistory.innerHTML += bubble;
        }
        ui.chatHistory.scrollTop = ui.chatHistory.scrollHeight;
    };

    const displayYukuResponse = (response) => {
        let contentHtml = '';
        if (response.type === 'code_project') {
            createOrUpdateCodeEditor(response.content);
            contentHtml = `<p class="text-sm">I have created a multi-file project for you in the code editor below. Click 'Preview' to see it in action.</p>`;
        } else if (response.type === 'html_template') {
            contentHtml = response.content;
        } else if (response.type === 'error') {
            contentHtml = `<p class="text-red-400 text-sm">[ERROR from ${response.source}]: ${response.content}</p>`;
        } else {
            contentHtml = `<p class="text-sm">${response.content.replace(/\n/g, '<br>')}</p>`;
        }
        displayMessage(`<p class="font-bold text-accent-green">YUKU (${response.source})</p>${contentHtml}`, 'yuku');
        ui.chipsContainer.innerHTML = '';
        if (response.chips && response.chips.length > 0) {
            response.chips.forEach(chipText => {
                const chip = document.createElement('button');
                chip.className = 'chip-btn';
                chip.textContent = chipText;
                chip.onclick = () => { ui.promptInput.value = chipText; handleSend(); };
                ui.chipsContainer.appendChild(chip);
            });
        }
    };

    const handleSend = async () => {
        const prompt = ui.promptInput.value.trim();
        const file = ui.fileInput.files[0];
        if (!prompt && !file) return;

        displayMessage(`<p class="text-sm">${prompt}</p>`, 'user');
        ui.promptInput.value = '';
        ui.chipsContainer.innerHTML = '';
        ui.fileInput.value = '';
        ui.filePreviewContainer.innerHTML = '';
        
        ui.chatHistory.innerHTML += `<div class="flex justify-start thinking"><div class="chat-bubble yuku-bubble rounded-lg p-3"><p class="text-sm text-text-secondary animate-pulse">YUKU is processing your directive...</p></div></div>`;
        ui.chatHistory.scrollTop = ui.chatHistory.scrollHeight;

        const formData = new FormData();
        formData.append('prompt', prompt);
        formData.append('chat_id', chatId);
        if (file) { formData.append('file', file); }
        if (toolOverride) {
            formData.append('tool_override', toolOverride);
            toolOverride = null;
            ui.promptInput.placeholder = "Ask YUKU...";
        }
        const response = await window.app.handleAiQuery(formData);
        if (response && response.yuku_response) {
            displayYukuResponse(response.yuku_response);
        } else {
            displayYukuResponse({ type: 'error', source: 'Internal', content: 'Failed to get a response from the MCP.' });
        }
    };

    const openToolModal = async () => {
        const tools = await window.app.getTools();
        ui.toolList.innerHTML = '';
        if (tools) {
            for (const toolId in tools) {
                const tool = tools[toolId];
                const card = document.createElement('div');
                card.className = 'tool-card p-4 rounded-lg cursor-pointer';
                card.innerHTML = `<h4 class="font-bold text-accent-green">${tool.name}</h4><p class="text-xs text-text-secondary">${tool.description}</p>`;
                card.onclick = () => {
                    toolOverride = toolId;
                    ui.promptInput.placeholder = `Using ${tool.name}. Enter prompt...`;
                    ui.promptInput.focus();
                    ui.toolModal.classList.add('hidden');
                };
                ui.toolList.appendChild(card);
            }
        }
        ui.toolModal.classList.remove('hidden');
    };

    ui.executeBtn.addEventListener('click', handleSend);
    ui.promptInput.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } });
    ui.toolSelectBtn.addEventListener('click', openToolModal);
    ui.closeModalBtn.addEventListener('click', () => ui.toolModal.classList.add('hidden'));
    ui.attachFileBtn.addEventListener('click', () => ui.fileInput.click());
    ui.fileInput.addEventListener('change', () => {
        if (ui.fileInput.files.length > 0) {
            const fileName = ui.fileInput.files[0].name;
            ui.filePreviewContainer.innerHTML = `<div class="text-xs text-accent-green p-2">Attached: ${fileName} <button onclick="this.parentElement.remove(); document.getElementById('file-input').value = '';" class="ml-2 text-red-400 font-bold">✖</button></div>`;
        }
    });
    ui.previewBtn.addEventListener('click', async () => {
        const files = {};
        for (const filename in codeMirrorInstances) {
            files[filename] = codeMirrorInstances[filename].getValue();
        }
        if (Object.keys(files).length === 0) return;
        ui.previewBtn.disabled = true;
        ui.previewBtn.textContent = "Hosting...";
        const previewData = await window.app.hostCodeForPreview(files);
        if (previewData && previewData.preview_url) {
            ui.previewFrame.src = previewData.preview_url;
            ui.previewContainer.classList.remove('hidden');
        } else {
            alert("Failed to create preview.");
        }
        ui.previewBtn.disabled = false;
        ui.previewBtn.textContent = "Preview";
    });
}