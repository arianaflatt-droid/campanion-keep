// Firebase setup shared by both pages.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, doc, collection, onSnapshot, setDoc, updateDoc, deleteDoc, writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, signInAnonymously
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { firebaseConfig, CLASS_ID, TEACHER_EMAILS } from "./firebase-config.js";

export const configured = !String(firebaseConfig.apiKey).includes("PASTE_ME");
export const app = configured ? initializeApp(firebaseConfig) : null;
export const db = app ? getFirestore(app) : null;
export const auth = app ? getAuth(app) : null;

export const classRef = db ? doc(db, "classes", CLASS_ID) : null;
export const studentsCol = db ? collection(db, "classes", CLASS_ID, "students") : null;
export const studentRef = id => doc(db, "classes", CLASS_ID, "students", id);
export const newStudentRef = () => doc(studentsCol);

export function isTeacherEmail(email) {
  return !!email && TEACHER_EMAILS.map(e => e.toLowerCase()).includes(email.toLowerCase());
}

export function watchClass(cb, onErr) {
  return onSnapshot(classRef, snap => cb(snap.exists() ? snap.data() : null), onErr);
}
export function watchStudents(cb, onErr) {
  return onSnapshot(studentsCol, snap => {
    const list = snap.docs.map(d => Object.assign({ id: d.id }, d.data()));
    list.sort((a, b) => (a.order || 0) - (b.order || 0) || String(a.name).localeCompare(String(b.name)));
    cb(list);
  }, onErr);
}

export const teacherSignIn = () => signInWithPopup(auth, new GoogleAuthProvider());
export const anonSignIn = () => signInAnonymously(auth);
export { onAuthStateChanged, signOut, setDoc, updateDoc, deleteDoc, writeBatch };
