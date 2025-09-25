// File: app.js

// This helper function is required by the browser
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

// This function handles the entire subscription process
async function subscribeUserToPush(apiBaseUrl) {
    // 1. Register the service worker
    const registration = await navigator.serviceWorker.register('/sw.js');
    
    // 2. Ask for permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
        throw new Error('Notification permission was not granted.');
    }

    // 3. Get the VAPID public key from your server
    const response = await fetch(`${apiBaseUrl}/webpush/vapid-public-key`);
    const { public_key } = await response.json();

    // 4. Subscribe the browser
    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(public_key)
    });

    // 5. Send the subscription object to your server to save it
    await fetch(`${apiBaseUrl}/webpush/subscribe`, {
        method: 'POST',
        body: JSON.stringify(subscription),
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}` // Assumes you store the auth token
        }
    });

    alert('Notifications have been enabled successfully!');
}

// Simplified example of how to call this from your app
document.addEventListener('DOMContentLoaded', () => {
    // This is a basic example; you should integrate this into your existing app object.
    const enableBtn = document.getElementById('enable-notifications-btn');
    if (enableBtn) {
        enableBtn.addEventListener('click', () => {
            const API_BASE_URL = 'https://open-feliza-pixelart002-78fb4fe8.koyeb.app'; // Your backend URL
            subscribeUserToPush(API_BASE_URL).catch(err => {
                console.error('Failed to subscribe to push notifications:', err);
                alert(`Error: ${err.message}`);
            });
        });
    }
});