// Firebase setup shared by both pages.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, doc, collection, onSnapshot, setDoc as fbSetDoc, updateDoc as fbUpdateDoc, deleteDoc as fbDeleteDoc, writeBatch as fbWriteBatch, runTransaction
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, signInAnonymously
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { firebaseConfig, CLASS_ID, TEACHER_EMAILS } from "./firebase-config.js";

// Teacher preview (student.html?s=ID&preview=1): the page shows a student's view, but nothing is ever written.
export const PREVIEW = typeof location !== "undefined" && new URLSearchParams(location.search).get("preview") === "1";
const none = async () => null;

export const configured = !String(firebaseConfig.apiKey).includes("PASTE_ME");
export const app = configured ? initializeApp(firebaseConfig) : null;
export const db = app ? getFirestore(app) : null;
export const auth = app ? getAuth(app) : null;

export const classRef = db ? doc(db, "classes", CLASS_ID) : null;
export const studentsCol = db ? collection(db, "classes", CLASS_ID, "students") : null;
export const studentRef = id => doc(db, "classes", CLASS_ID, "students", id);
export const newStudentRef = () => doc(studentsCol);
export const battlesCol = db ? collection(db, "classes", CLASS_ID, "battles") : null;
export const battleRef = id => doc(db, "classes", CLASS_ID, "battles", id);
export const newBattleRef = () => doc(battlesCol);
export function watchBattles(cb, onErr) {
  return onSnapshot(battlesCol, snap => cb(snap.docs.map(d => Object.assign({ id: d.id }, d.data()))), onErr);
}
// Trades between players (students and the teacher)
export const tradesCol = db ? collection(db, "classes", CLASS_ID, "trades") : null;
export const tradeRef = id => doc(db, "classes", CLASS_ID, "trades", id);
export const newTradeRef = () => doc(tradesCol);
export function watchTrades(cb, onErr) {
  return onSnapshot(tradesCol, snap => cb(snap.docs.map(d => Object.assign({ id: d.id }, d.data()))), onErr);
}
export async function changeTrade(id, fn) {
  if (PREVIEW) return null;
  return runTransaction(db, async tx => {
    const ref = tradeRef(id), snap = await tx.get(ref);
    if (!snap.exists()) return null;
    const next = fn(JSON.parse(JSON.stringify(snap.data())));
    if (next) tx.set(ref, next);
    return next;
  });
}
// Read-modify-write a battle safely when both players act at once. fn(data) returns the new data (or null to skip).
export async function changeBattle(id, fn) {
  if (PREVIEW) return null;
  return runTransaction(db, async tx => {
    const ref = battleRef(id), snap = await tx.get(ref);
    if (!snap.exists()) return null;
    const next = fn(JSON.parse(JSON.stringify(snap.data())));
    if (next) tx.set(ref, next);
    return next;
  });
}

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
const safeBatch = d => (PREVIEW ? { set() {}, update() {}, delete() {}, commit: none } : fbWriteBatch(d));
export { onAuthStateChanged, signOut };
export const setDoc = PREVIEW ? none : fbSetDoc;
export const updateDoc = PREVIEW ? none : fbUpdateDoc;
export const deleteDoc = PREVIEW ? none : fbDeleteDoc;
export const writeBatch = safeBatch;
