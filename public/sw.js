// File: sw.js
self.addEventListener('push', event => {
  const data = event.data.json();
  console.log('Push notification received:', data);
  const title = data.title || "YUKU Protocol";
  const options = {
    body: data.body,
    icon: '/yuku-icon.png', // Optional: You can change this to your logo's path
  };
  event.waitUntil(self.registration.showNotification(title, options));
});