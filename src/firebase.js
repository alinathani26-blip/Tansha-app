import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
} from "firebase/auth";
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
export { onAuthStateChanged };

let authPromise = null;
let authUnsub = null;

export function ensureAuth() {
  if (!authPromise) {
    authPromise = new Promise((resolve) => {
      authUnsub = onAuthStateChanged(auth, (user) => {
        if (user) resolve(user);
      });
    });
  }
  return authPromise;
}

export async function login(email, password) {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    return {};
  } catch (err) {
    let msg = "Sign in failed. Check your email and password.";
    if (["auth/wrong-password","auth/user-not-found","auth/invalid-credential"].includes(err.code))
      msg = "Wrong email or password.";
    else if (err.code === "auth/too-many-requests")
      msg = "Too many attempts. Try again later.";
    return { error: msg };
  }
}

export async function logout() {
  if (authUnsub) { authUnsub(); authUnsub = null; }
  authPromise = null;
  await fbSignOut(auth);
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
