function initYukuAiPage() {
    const chatHistory = document.getElementById('chat-history');
    const executeBtn = document.getElementById('ai-execute-btn');
    const promptInput = document.getElementById('ai-prompt-input');
    const fileInput = document.getElementById('file-input');
    const attachBtn = document.getElementById('attach-file-btn');
    const filePreviewContainer = document.getElementById('file-preview-container');

    // Naya chat session shuru karein ya purana load karein
    let chatId = sessionStorage.getItem('yuku_chat_id');
    if (!chatId) {
        chatId = crypto.randomUUID();
        sessionStorage.setItem('yuku_chat_id', chatId);
    }

    // Helper function: User ka message screen par dikhayein
    const displayUserMessage = (message) => {
        const bubble = `<div class="flex justify-end"><div class="chat-bubble user-bubble rounded-lg p-3"><p class="text-sm">${message}</p></div></div>`;
        chatHistory.innerHTML += bubble;
        chatHistory.scrollTop = chatHistory.scrollHeight; // Scroll to bottom
    };

    // Helper function: YUKU ka response screen par dikhayein
    const displayYukuResponse = (response) => {
        let contentHtml = '';
        switch (response.type) {
            case 'image_url':
                contentHtml = `<img src="${response.content}" class="rounded-md max-w-full" alt="Generated Image">`;
                break;
            case 'html_template':
                contentHtml = response.content;
                break;
            case 'error':
                contentHtml = `<p class="text-red-400 text-sm">[ERROR from ${response.source}]: ${response.content}</p>`;
                break;
            default:
                contentHtml = `<p class="text-sm">${response.content}</p>`;
        }
        
        const bubble = `<div class="flex justify-start"><div class="chat-bubble yuku-bubble rounded-lg p-3"><p class="font-bold text-accent-green">YUKU (${response.source})</p>${contentHtml}</div></div>`;
        
        // "Thinking" message ko replace karein
        const thinkingBubble = chatHistory.querySelector('.thinking');
        if(thinkingBubble) {
            thinkingBubble.outerHTML = bubble;
        } else {
            chatHistory.innerHTML += bubble;
        }

        // Code block ke liye copy functionality
        const newCodeBlock = chatHistory.querySelector('.chat-bubble:last-child .code-block');
        if (newCodeBlock) {
            newCodeBlock.querySelector('.copy-btn').addEventListener('click', () => {
                const code = newCodeBlock.querySelector('code').innerText;
                navigator.clipboard.writeText(code);
                // Optional: Show a "Copied!" message
            });
        }
        chatHistory.scrollTop = chatHistory.scrollHeight;
    };

    // Main send function
    const handleSend = async () => {
        const prompt = promptInput.value.trim();
        const file = fileInput.files[0];

        if (!prompt && !file) return;

        displayUserMessage(prompt);
        promptInput.value = '';
        fileInput.value = ''; // Clear file input
        filePreviewContainer.innerHTML = '';
        filePreviewContainer.classList.add('hidden');

        // "Thinking" indicator dikhayein
        const thinkingBubble = `<div class="flex justify-start thinking"><div class="chat-bubble yuku-bubble rounded-lg p-3"><p class="text-sm text-text-secondary animate-pulse">YUKU is thinking...</p></div></div>`;
        chatHistory.innerHTML += thinkingBubble;
        chatHistory.scrollTop = chatHistory.scrollHeight;

        const formData = new FormData();
        formData.append('prompt', prompt);
        formData.append('chat_id', chatId);
        if (file) {
            formData.append('file', file);
        }
        
        const response = await window.app.handleAiQuery(formData);
        if (response && response.yuku_response) {
            displayYukuResponse(response.yuku_response);
        } else {
             displayYukuResponse({type: 'error', source: 'Internal', content: 'Failed to get a response from the MCP.'});
        }
    };

    executeBtn.addEventListener('click', handleSend);
    promptInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });

    attachBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            const fileName = fileInput.files[0].name;
            filePreviewContainer.innerHTML = `<div class="text-xs text-accent-green p-2">Attached: ${fileName}</div>`;
            filePreviewContainer.classList.remove('hidden');
        }
    });
}
