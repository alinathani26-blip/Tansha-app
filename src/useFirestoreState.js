import { useState, useEffect, useRef } from "react";
import { getFirestore, doc, onSnapshot, setDoc } from "firebase/firestore";
import { app, ensureAuth } from "./firebase";

const db = getFirestore(app);

export function useFirestoreState(key, initialValue) {
  const [value, setValue] = useState(null);
  const [loading, setLoading] = useState(true);
  const ready = useRef(false);
  const lastSynced = useRef(null);
  const pendingWrite = useRef(null); // tracks value waiting to be written

  useEffect(() => {
    let unsub = () => {};
    let cancelled = false;
    ensureAuth().then(() => {
      if (cancelled) return;
      const ref = doc(db, "tansha", key);
      unsub = onSnapshot(ref, (snap) => {
        if (snap.exists()) {
          const data = snap.data().value;
          // Skip if we have a local change not yet written — don't overwrite user edits
          if (pendingWrite.current === null) {
            lastSynced.current = JSON.stringify(data);
            setValue(data);
          }
        } else {
          lastSynced.current = JSON.stringify(initialValue);
          setValue(initialValue);
          setDoc(ref, { value: initialValue }).catch((err) => console.error("Firestore init failed:", err));
        }
        ready.current = true;
        setLoading(false);
      }, (err) => console.error("Firestore snapshot error:", err));
    });
    return () => { cancelled = true; unsub(); };
  }, [key]);

  useEffect(() => {
    if (!ready.current) return;
    const json = JSON.stringify(value);
    if (json === lastSynced.current) return;
    lastSynced.current = json;
    pendingWrite.current = value; // mark as pending
    const ref = doc(db, "tansha", key);
    const t = setTimeout(() => {
      pendingWrite.current = null; // clear after write fires
      setDoc(ref, { value }).catch((err) => console.error("Firestore write failed:", err));
    }, 500);
    return () => clearTimeout(t);
  }, [value, key]);

  // Flush any pending write immediately when the component unmounts
  // so navigating to another section never loses unsaved changes
  useEffect(() => {
    return () => {
      if (pendingWrite.current !== null) {
        const ref = doc(db, "tansha", key);
        setDoc(ref, { value: pendingWrite.current }).catch((err) => console.error("Firestore flush failed:", err));
      }
    };
  }, [key]);

  return [value ?? initialValue, setValue, loading];
}
