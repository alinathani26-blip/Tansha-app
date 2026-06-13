import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDHcDsSEBY2jJELE-pOqM_aKD32ofxrIZE",
  authDomain: "tansha-hospitality.firebaseapp.com",
  projectId: "tansha-hospitality",
  storageBucket: "tansha-hospitality.firebasestorage.app",
  messagingSenderId: "844537735144",
  appId: "1:844537735144:web:b1b9ac9dcaeedab214e65d",
  measurementId: "G-F48PTDSMHJ",
};

const VAPID_KEY =
  "BP_f6qX0kPcYxAXQhSOKlzS6qlEop1D6kGEyynKlbDedlxbLRIGri6dw3k8MqQ3OxALyJTzgJeZ-uS03Z2F1g2U";

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

let authPromise = null;
export function ensureAuth() {
  if (!authPromise) {
    authPromise = new Promise((resolve) => {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          resolve(user);
        } else {
          signInAnonymously(auth).catch((err) => console.error("Anonymous sign-in failed:", err));
        }
      });
    });
  }
  return authPromise;
}

export async function initMessaging(onForegroundMessage) {
  if (!(await isSupported())) return null;

  const messaging = getMessaging(app);

  onMessage(messaging, (payload) => {
    if (onForegroundMessage) onForegroundMessage(payload);
  });

  return messaging;
}

export async function requestNotificationPermission() {
  if (!("Notification" in window)) return null;
  if (!(await isSupported())) return null;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  const messaging = getMessaging(app);
  const registration = await navigator.serviceWorker.ready;

  try {
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    return token;
  } catch (err) {
    console.error("Failed to get FCM token:", err);
    return null;
  }
}

export async function registerDeviceToken(person, token) {
  await ensureAuth();
  const db = getFirestore(app);
  const ref = doc(db, "tansha", "tokens");
  const snap = await getDoc(ref);
  const tokensMap = snap.exists() ? snap.data().value || {} : {};
  const existing = Array.isArray(tokensMap[person]) ? tokensMap[person] : [];
  if (!existing.includes(token)) {
    tokensMap[person] = [...existing, token];
    await setDoc(ref, { value: tokensMap });
  }
}

export async function sendPush(persons, title, body) {
  try {
    await fetch("/api/send-push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ persons, title, body }),
    });
  } catch (err) {
    console.error("sendPush failed:", err);
  }
}
