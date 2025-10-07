// File: js/pages/settings.js
function initSettingsPage() {
    const enableBtn = document.getElementById('enable-notifications-btn');
    if (enableBtn) {
        enableBtn.addEventListener('click', () => {
            window.app.subscribeUserToPush().catch(err => {
                console.error('Failed to subscribe:', err);
                alert(`Error: ${err.message}`);
            });
        });
    }
}
initSettingsPage();
