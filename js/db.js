// Firebase setup shared by both pages.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager, getDocs, getFirestore, doc, collection, onSnapshot, query, where, setDoc as fbSetDoc, updateDoc as fbUpdateDoc, deleteDoc as fbDeleteDoc, writeBatch as fbWriteBatch, runTransaction
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, signInAnonymously
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { firebaseConfig, CLASS_ID, TEACHER_EMAILS } from "./firebase-config.js?v=20261006y";

// Teacher preview (student.html?s=ID&preview=1): the page shows a student's view, but nothing is ever written.
export const PREVIEW = typeof location !== "undefined" && new URLSearchParams(location.search).get("preview") === "1";
const none = async () => null;

export const configured = !String(firebaseConfig.apiKey).includes("PASTE_ME");
export const app = configured ? initializeApp(firebaseConfig) : null;
// Keep a saved copy on the computer, so reopening the page doesn't download the whole class again.
function makeDb() {
  try { return initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) }); }
  catch (e) { console.warn("No offline cache:", e); return getFirestore(app); }
}
export const db = app ? makeDb() : null;
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
// A student's page only listens to (1) their own battles (for badges and their arena card) and (2) battles going on
// right now (to show who is busy). Old battles between other kids aren't downloaded at all. Battles carry ids:[a,b].
const LIVE_STATUS = ["invite", "team", "lead", "fight"];
function mergeWatch(queries, cb, onErr) {
  const parts = queries.map(() => new Map());
  const send = () => { const all = new Map(); parts.forEach(m => m.forEach((v, k) => all.set(k, v))); cb([...all.values()]); };
  const offs = queries.map((q, i) => onSnapshot(q, snap => { parts[i] = new Map(snap.docs.map(d => [d.id, Object.assign({ id: d.id }, d.data())])); send(); }, onErr));
  return () => offs.forEach(f => f());
}
// Only this student's own battles. Other kids' battle moves are never sent to this page.
export function watchMyBattles(me, cb, onErr) {
  if (!me) { cb([]); return () => {}; }
  return mergeWatch([query(battlesCol, where("ids", "array-contains", me))], cb, onErr);
}
// One quick look at the battles going on right now (used when someone sends a challenge).
export async function liveBattlesNow() {
  const snap = await getDocs(query(battlesCol, where("status", "in", LIVE_STATUS)));
  return snap.docs.map(d => Object.assign({ id: d.id }, d.data()));
}
export function watchMyTrades(me, cb, onErr) {
  if (!me) { cb([]); return () => {}; }
  return mergeWatch([query(tradesCol, where("ids", "array-contains", me))], cb, onErr);
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
