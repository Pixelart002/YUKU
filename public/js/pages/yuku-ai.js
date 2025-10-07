function initYukuAiPage() {
    const executeBtn = document.getElementById('ai-execute-btn');
    if (executeBtn) {
        executeBtn.addEventListener('click', () => {
            window.app.handleAiQuery();
        });
    }
}