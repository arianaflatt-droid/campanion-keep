// Firebase setup shared by both pages.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager, getDocs, getDoc, getFirestore, doc, collection, onSnapshot, query, where, setDoc as fbSetDoc, updateDoc as fbUpdateDoc, deleteDoc as fbDeleteDoc, writeBatch as fbWriteBatch, runTransaction, deleteField
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, signInAnonymously
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";
import { firebaseConfig, CLASS_ID, TEACHER_EMAILS } from "./firebase-config.js?v=20261028a";

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
// Live XP from Timeback: the Class XP sheet's Apps Script writes one doc here every few minutes (teacher only).
export const liveRef = db ? doc(db, "classes", CLASS_ID, "live", "xp") : null;
// Weekly Reward pictures: one small doc per student (teacher writes, everyone signed in reads)
export const rewardPicRef = id => doc(db, "classes", CLASS_ID, "rewards", id);
export function watchRewardPic(id, cb) { return onSnapshot(rewardPicRef(id), snap => cb(snap.exists() ? snap.data() : null), () => {}); }
export function watchRewardPics(cb) { return onSnapshot(collection(db, "classes", CLASS_ID, "rewards"), snap => { const m = {}; snap.docs.forEach(d => { const x = d.data(); if (x && x.img) m[d.id] = x.img; }); cb(m); }, () => {}); }
// The announcement picture (Ms. Ariana's top-of-page news, like who's winning the duck race). Everyone can read it.
export const newsPicRef = db ? doc(db, "classes", CLASS_ID, "news", "pic") : null;
export function watchNewsPic(cb) { return onSnapshot(newsPicRef, snap => cb(snap.exists() ? snap.data() : null), () => {}); }
export const feederKeyRef = db ? doc(db, "classes", CLASS_ID, "private", "feeder") : null;
export function watchLive(cb, onErr) { return onSnapshot(liveRef, snap => cb(snap.exists() ? snap.data() : null), onErr); }
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


/* ---------- Personal links (Oct 2026) ----------
   Each student's personal link carries a secret code (k). The first time a device opens it, the page saves
   seats/{this device's sign-in id} = { sid, k }. The rules only let a device change the student it is seated as,
   and only accept a seat whose code matches private/keys (which only the teacher can read). */
export const seatRef = uid => doc(db, "classes", CLASS_ID, "seats", uid);
export const seatsCol = db ? collection(db, "classes", CLASS_ID, "seats") : null;
export const keysRef = db ? doc(db, "classes", CLASS_ID, "private", "keys") : null;
export async function claimSeat(sid, k) {
  if (PREVIEW || !auth.currentUser) return null;
  await fbSetDoc(seatRef(auth.currentUser.uid), { sid, k, at: new Date().toISOString() });
  return sid;
}
export async function mySeat() {
  if (!auth.currentUser) return null;
  try { const d = await getDoc(seatRef(auth.currentUser.uid)); return d.exists() ? d.data().sid || null : null; } catch (e) { return null; }
}
export async function getKeys() { const d = await getDoc(keysRef); return d.exists() ? d.data() : {}; }
export function watchSeats(cb, onErr) { return onSnapshot(seatsCol, snap => cb(snap.docs.map(d => Object.assign({ id: d.id }, d.data()))), onErr); }

/* ---------- Snapshots for rollback (teacher only) ----------
   snaps/{stamp}__{studentId} = { sid, stamp, name, json } : the student's whole save as it was at that moment. */
export const snapsCol = db ? collection(db, "classes", CLASS_ID, "snaps") : null;
export const snapRef = id => doc(db, "classes", CLASS_ID, "snaps", id);
export async function snapsFor(sid) { const q = await getDocs(query(snapsCol, where("sid", "==", sid))); return q.docs.map(d => Object.assign({ id: d.id }, d.data())); }
export async function snapsAt(stamp) { const q = await getDocs(query(snapsCol, where("stamp", "==", stamp))); return q.docs.map(d => Object.assign({ id: d.id }, d.data())); }

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

/* ---------- Public cards (Oct 2026) ----------
   cards/{id} = a student's save WITHOUT the private parts (see PRIVATE in card.js), with name = their display name.
   Classmates' pages read cards; a student's full save can only be read by that student and the teacher. */
export const cardsCol = db ? collection(db, "classes", CLASS_ID, "cards") : null;
export const cardRef = id => doc(db, "classes", CLASS_ID, "cards", id);
export function watchCards(cb, onErr) {
  return onSnapshot(cardsCol, snap => {
    const list = snap.docs.map(d => Object.assign({ id: d.id }, d.data()));
    list.sort((a, b) => (a.order || 0) - (b.order || 0) || String(a.name).localeCompare(String(b.name)));
    cb(list);
  }, onErr);
}
// One student's own full save. pending = it still has saves on their way to Firebase.
export function watchMe(id, cb, onErr) {
  return onSnapshot(studentRef(id), { includeMetadataChanges: true }, snap => cb(snap.exists() ? Object.assign({ id: snap.id }, snap.data()) : null, snap.metadata.hasPendingWrites), onErr);
}
export const saveCard = (id, card) => (PREVIEW ? none() : fbSetDoc(cardRef(id), card));

/* ---------- the Companion Keep server ----------
   Hatching, levelling, spares, releasing and trades are decided by the server (functions/), not the page.
   ck("hatch", { kind: "normal" }) -> what hatched. Errors come back with a message the page can show. */
const fns = app ? getFunctions(app, "us-central1") : null;
export async function ck(op, input) {
  if (PREVIEW) throw Object.assign(new Error("This is a teacher preview \u2014 nothing is saved."), { code: "preview" });
  const r = await httpsCallable(fns, "ck")(Object.assign({ op }, input || {}));
  return r.data || {};
}
export const ckMessage = e => (e && e.message ? String(e.message).replace(/^(functions\/)?[a-z-]+:\s*/i, "") : "Something went wrong. Try again.");

export const teacherSignIn = () => signInWithPopup(auth, new GoogleAuthProvider());
export const anonSignIn = () => signInAnonymously(auth);
const safeBatch = d => (PREVIEW ? { set() {}, update() {}, delete() {}, commit: none } : fbWriteBatch(d));
export { onAuthStateChanged, signOut, deleteField };
export const setDoc = PREVIEW ? none : fbSetDoc;
export const updateDoc = PREVIEW ? none : fbUpdateDoc;
export const deleteDoc = PREVIEW ? none : fbDeleteDoc;
export const writeBatch = safeBatch;
