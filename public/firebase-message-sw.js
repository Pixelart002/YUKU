// File: firebase-messaging-sw.js

// Firebase SDKs import karein
importScripts("https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js");

// Aapke web app ki Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBVLkg5-aTOIFxtfBB0hwvOXNOTb9ns3JU",
  authDomain: "yukuprotocol01.firebaseapp.com",
  projectId: "yukuprotocol01",
  storageBucket: "yukuprotocol01.firebasestorage.app",
  messagingSenderId: "1077444358098",
  appId: "1:1077444358098:web:ca1fded28ef6ef2762620b",
  measurementId: "G-WHVQRZLFW0"
};

// Firebase ko initialize karein
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const messaging = firebase.messaging();

// Background mein notification receive hone par kya karna hai
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/yuku-icon.png' // Optional: You can put a path to your logo here
  };
  
  self.registration.showNotification(notificationTitle, notificationOptions);
});