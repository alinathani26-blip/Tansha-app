import { useState, useEffect, useRef } from "react";
import { getFirestore, doc, onSnapshot, setDoc } from "firebase/firestore";
import { app, ensureAuth } from "./firebase";

const db = getFirestore(app);

export function useFirestoreState(key, initialValue) {
  const [value, setValue] = useState(initialValue);
  const ready = useRef(false);
  const lastSynced = useRef(null);

  useEffect(() => {
    let unsub = () => {};
    let cancelled = false;
    ensureAuth().then(() => {
      if (cancelled) return;
      const ref = doc(db, "tansha", key);
      unsub = onSnapshot(ref, (snap) => {
        if (snap.exists()) {
          const data = snap.data().value;
          lastSynced.current = JSON.stringify(data);
          setValue(data);
        } else {
          lastSynced.current = JSON.stringify(initialValue);
          setDoc(ref, { value: initialValue }).catch((err) => console.error("Firestore init failed:", err));
        }
        ready.current = true;
      }, (err) => console.error("Firestore snapshot error:", err));
    });
    return () => { cancelled = true; unsub(); };
  }, [key]);

  useEffect(() => {
    if (!ready.current) return;
    const json = JSON.stringify(value);
    if (json === lastSynced.current) return;
    lastSynced.current = json;
    const ref = doc(db, "tansha", key);
    const t = setTimeout(() => {
      setDoc(ref, { value }).catch((err) => console.error("Firestore write failed:", err));
    }, 500);
    return () => clearTimeout(t);
  }, [value, key]);

  return [value, setValue];
}
