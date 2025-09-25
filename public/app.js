// File: app.js

// Helper function to convert the VAPID key for the browser
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// Main function to subscribe the user to push notifications
async function subscribeUserToPush(apiBaseUrl, authToken) {
    if (!('serviceWorker' in navigator)) {
        throw new Error('Service Workers are not supported by this browser.');
    }
    const registration = await navigator.serviceWorker.register('/sw.js');
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
        throw new Error('Notification permission was not granted.');
    }
    const response = await fetch(`${apiBaseUrl}/webpush/vapid-public-key`);
    const { public_key } = await response.json();
    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(public_key)
    });
    await fetch(`${apiBaseUrl}/webpush/subscribe`, {
        method: 'POST',
        body: JSON.stringify(subscription),
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
    });
    alert('Notifications have been enabled successfully!');
}


document.addEventListener('DOMContentLoaded', () => {
    let authToken = localStorage.getItem('authToken');
    const app = {
        config: {
            API_BASE_URL: 'https://open-feliza-pixelart002-78fb4fe8.koyeb.app' // Your backend URL
        },
        elements: {
            // Your elements object here...
            navLinks: document.querySelectorAll('.nav-link'),
            contentPanels: document.querySelectorAll('.content-panel'),
            // Add all other elements you need
        },
        
        init() {
            // Your full init() function here, including login checks etc.
            this.elements.navLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.navigateTo(link.getAttribute('data-page'));
                });
            });
            // Show a default page if logged in
            if (authToken) {
                this.navigateTo('dashboard');
            }
        },
        
        getPageContent(pageId) {
            const content = {
                'dashboard': '<h2>Dashboard Content</h2><p>Overview of operations.</p>',
                // --- THIS IS THE UPDATED PART ---
                'settings': `
                    <div class="glass-panel p-6 rounded-lg max-w-2xl mx-auto">
                        <h3 class="text-2xl font-orbitron text-accent-green mb-4">SYSTEMS</h3>
                        <p class="text-text-secondary mb-4">Manage your account and notifications.</p>
                        <button id="enable-notifications-btn" class="tactical-btn py-2 px-6 rounded-md">Enable Push Notifications</button>
                    </div>`
            };
            return content[pageId] || '<p>Content not found.</p>';
        },
        
        navigateTo(pageId) {
            this.elements.contentPanels.forEach(p => p.classList.remove('active'));
            const contentContainer = document.getElementById(`${pageId}-content`);
            
            // Inject the HTML content from getPageContent
            if (contentContainer) {
                contentContainer.innerHTML = this.getPageContent(pageId);
                contentContainer.classList.add('active');
            }
            
            // Add the event listener AFTER the button has been added to the page
            if (pageId === 'settings') {
                const enableBtn = document.getElementById('enable-notifications-btn');
                if (enableBtn) {
                    enableBtn.addEventListener('click', () => {
                        subscribeUserToPush(this.config.API_BASE_URL, authToken).catch(err => {
                            console.error('Failed to subscribe:', err);
                            alert(`Error: ${err.message}`);
                        });
                    });
                }
            }
        },
        // All your other functions like handleLogin, showDashboard, etc.
    };
    
    // This is a simplified init call. Use your full app logic.
    app.init();
});