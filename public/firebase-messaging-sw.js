// File: public/firebase-messaging-sw.js
// Description: The dedicated Service Worker file for Firebase Cloud Messaging.
// This file runs in the background and handles incoming push messages.

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');


// --- YOUR FIREBASE CONFIGURATION ---
// Must match the config used in your main app.

firebase.initializeApp({
  apiKey: "AIzaSyBasB-CCcs1xGiWD76_oZTOE0mhBTZMdfY",
  authDomain: "variant-discounts.firebaseapp.com",
  projectId: "variant-discounts",
  storageBucket: "variant-discounts.firebasestorage.app",
  messagingSenderId: "188014171258",
  appId: "1:188014171258:web:6249cd3619a33142d297c3",
  measurementId: "G-PV99JF12V2"
});
// firebase.initializeApp({
//   apiKey: "AIzaSyALMcKSSJ34Ynftkn0BpfJp9jPvotKzBbw",
//   authDomain: "discount-4117a.firebaseapp.com",
//   projectId: "discount-4117a",
//   storageBucket: "discount-4117a.firebasestorage.app",
//   messagingSenderId: "270034266193",
//   appId: "1:270034266193:web:6d652870e4b7aeb74db070",
// });

// const messaging = firebase.messaging();
const messaging = firebase.messaging();

// messaging.onBackgroundMessage(function (payload) {
//   console.log("FCM SW: Received background message:", payload);

//   const notificationTitle = payload.data.title;
//   const notificationOptions = {
//     body: payload.data.body,
//     data: payload.data
//   };

//   self.registration.showNotification(notificationTitle, notificationOptions);
// });



// self.addEventListener("push", (event) => {
//   if (!event.data) return;
//   const payload = event.data.json();
  
//   self.registration.showNotification(payload.data.title, {
//     body: payload.data.body,
//     data: payload.data
//   });
// });

// Handle clicks on notifications

self.addEventListener("push", (event) => {
  if (!event.data) return;
  const payload = event.data.json();

  const notificationTitle = payload.notification?.title || payload.data?.title || "New Discount!";
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || "",
    data: { url: payload.data?.url || "/" }, // store target url for click
  };

  event.waitUntil(
    self.registration.showNotification(notificationTitle, notificationOptions)
  );
});


self.addEventListener("notificationclick", (event) => {
  console.log("Notification click received:", event);

  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});