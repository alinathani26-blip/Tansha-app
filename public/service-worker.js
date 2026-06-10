const CACHE_NAME = "tansha-cache-v1";

importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDHcDsSEBY2jJELE-pOqM_aKD32ofxrIZE",
  authDomain: "tansha-hospitality.firebaseapp.com",
  projectId: "tansha-hospitality",
  storageBucket: "tansha-hospitality.firebasestorage.app",
  messagingSenderId: "844537735144",
  appId: "1:844537735144:web:b1b9ac9dcaeedab214e65d",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification || {};
  self.registration.showNotification(title || "Tansha Hospitality", {
    body: body || "",
    icon: icon || "/logo192.png",
    badge: "/logo192.png",
  });
});

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.map((name) => {
          if (name !== CACHE_NAME) return caches.delete(name);
          return null;
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match("/")))
  );
});
