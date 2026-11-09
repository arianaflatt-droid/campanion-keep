// Firebase setup shared by both pages.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager, getDocs, getDoc, getFirestore, doc, collection, onSnapshot, query, where, setDoc as fbSetDoc, updateDoc as fbUpdateDoc, deleteDoc as fbDeleteDoc, writeBatch as fbWriteBatch, runTransaction, deleteField
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, signInAnonymously
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";
import { firebaseConfig, CLASS_ID, TEACHER_EMAILS, ADMIN_EMAILS, switchClass } from "./firebase-config.js?v=20261109g";
export { CLASS_ID, switchClass };

// Teacher preview (student.html?s=ID&preview=1): the page shows a student's view, but nothing is ever written.
export const PREVIEW = typeof location !== "undefined" && new URLSearchParams(location.search).get("preview") === "1";
const none = async () => null;

export const configured = !String(firebaseConfig.apiKey).includes("PASTE_ME");
export const app = configured ? initializeApp(firebaseConfig) : null;
// Keep a saved copy on the computer, so reopening the page doesn't download the whole class again.
function makeDb() {
  // Nov 6: the teacher console keeps no saved copy (memory only). A saved copy is shared by every Companion Keep tab in
  // the browser, and the console's saves could wait on another tab signed in as someone else (e.g. a student page).
  const teacherPage = typeof location !== "undefined" && !/student\.html|axolotl/i.test(location.pathname);
  if (teacherPage) return getFirestore(app);
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
// 🕵️ Secret Students (Nov 2026): today's picks live here so students can't see them (teacher-only)
export const secretRef = db ? doc(db, "classes", CLASS_ID, "private", "secret") : null;
export function watchSecret(cb) { return onSnapshot(secretRef, snap => cb(snap.exists() ? snap.data() : null), () => cb(null)); }
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
  // Only the battles that changed are read again (Nov 3): a student with lots of old battles no longer re-reads every one on each move.
  const offs = queries.map((q, i) => onSnapshot(q, snap => {
    snap.docChanges().forEach(ch => { if (ch.type === "removed") parts[i].delete(ch.doc.id); else parts[i].set(ch.doc.id, Object.assign({ id: ch.doc.id }, ch.doc.data())); });
    send(); }, onErr));
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
/* ---------- 🔑 School Google sign-in (Nov 6, roster.js) ----------
   roster/{school email} = { classId, sid, name }: written by the teacher; a student can read only their own.
   A student signs in with Google → the page reads their roster doc → saves seats/{uid} = { sid, email, at }
   (the rules check it against the roster) → they are that student on this device, just like a personal link. */
export const SCHOOL_DOMAIN = "unbound.school";
export const rosterRef = email => doc(db, "roster", String(email || "").trim().toLowerCase());
// Nov 6 (Step B): the teacher's list of emails lives in ONE private doc per class (classes/{id}/private/roster = { sid: email }),
// so a teacher only ever reads their own class's emails (and it costs 1 read). Old classes are copied over the first time.
const rosterMapRef = () => doc(db, "classes", CLASS_ID, "private", "roster");
export async function rosterList() {
  const m = await getDoc(rosterMapRef());
  if (m.exists()) return Object.entries(m.data()).filter(([k, v]) => k !== "_at" && v).map(([sid, email]) => ({ sid, email, classId: CLASS_ID }));
  const snap = await getDocs(query(collection(db, "roster"), where("classId", "==", CLASS_ID)));   // first time (admin): copy the Step A docs into the map
  const list = snap.docs.map(d => Object.assign({ email: d.id }, d.data())), map = { _at: new Date().toISOString() };
  list.forEach(x => { map[x.sid] = x.email; });
  try { await fbSetDoc(rosterMapRef(), map); } catch (e) {}
  return list;
}
export async function seatsOnce() { const snap = await getDocs(seatsCol); return snap.docs.map(d => Object.assign({ id: d.id }, d.data())); }
// pairs: [[sid, email, name]]; removes: [emails]
export async function rosterSave(pairs, removes) {
  const b = writeBatch(db), at = new Date().toISOString();
  const gone = new Set(removes || []), up = { _at: at };
  gone.forEach(e => b.delete(rosterRef(e)));
  pairs.forEach(([sid, email, name]) => { b.set(rosterRef(email), { classId: CLASS_ID, sid, name: String(name || "").slice(0, 60), at }); up[sid] = email; });
  // keep the class's private email list in step (removed students drop out; the map is merged, not replaced)
  const cur = await getDoc(rosterMapRef()).then(d => (d.exists() ? d.data() : {})).catch(() => ({}));
  Object.keys(cur).forEach(sid => { if (sid !== "_at" && gone.has(cur[sid]) && !up[sid]) up[sid] = deleteField(); });
  b.set(rosterMapRef(), up, { merge: true });
  await b.commit();
}
// Nov 6: Google only. This device's seat, checked fresh every time the page opens: { sid, email } or null.
export async function seatInfo() {
  if (!auth.currentUser) return null;
  try { const d = await getDoc(seatRef(auth.currentUser.uid)); return d.exists() ? d.data() : null; } catch (e) { return null; }
}
// A Google-signed-in student whose seat is missing (new class year, cleared…): sit down again from the roster, quietly.
export async function googleReseat() {
  const u = auth.currentUser, email = String((u && u.email) || "").toLowerCase();
  if (!u || !email.endsWith("@" + SCHOOL_DOMAIN)) return null;
  const r = await getDoc(rosterRef(email)); if (!r.exists()) return null;
  if (r.data().classId !== CLASS_ID) { moveToClass(r.data().classId); return null; }
  await fbSetDoc(seatRef(u.uid), { sid: r.data().sid, email, at: new Date().toISOString() });
  return r.data().sid;
}
// Teacher: sign out every personal-link computer (deletes the seats that came from a link, not from Google)
export async function removeLinkSeats() {
  const snap = await getDocs(seatsCol), old = snap.docs.filter(d => !d.data().email);
  for (let i = 0; i < old.length; i += 400) { const b = writeBatch(db); old.slice(i, i + 400).forEach(d => b.delete(d.ref)); await b.commit(); }
  return old.length;
}
export async function googleStudentSignIn() {
  const p = new GoogleAuthProvider(); p.setCustomParameters({ hd: SCHOOL_DOMAIN, prompt: "select_account" });
  const cred = await signInWithPopup(auth, p), email = String(cred.user.email || "").toLowerCase();
  const fail = async code => { try { await signOut(auth); } catch (e) {} const er = new Error(code); er.code = code; er.email = email; throw er; };
  if (!email.endsWith("@" + SCHOOL_DOMAIN)) return fail("wrong-domain");
  let r = null; try { r = await getDoc(rosterRef(email)); } catch (e) { return fail("not-on-roster"); }
  if (!r.exists()) return fail("not-on-roster");
  const { classId, sid } = r.data();
  if (classId !== CLASS_ID) { moveToClass(classId); return null; }   // their class is a different one: open it (the seat is made there)
  await fbSetDoc(seatRef(cred.user.uid), { sid, email, at: new Date().toISOString() });
  return sid;
}
export async function getKeys() { const d = await getDoc(keysRef); return d.exists() ? d.data() : {}; }
export function watchSeats(cb, onErr) { return onSnapshot(seatsCol, snap => cb(snap.docs.map(d => Object.assign({ id: d.id }, d.data()))), onErr); }

/* ---------- Snapshots for rollback (teacher only) ----------
   snaps/{stamp}__{studentId} = { sid, stamp, name, json } : the student's whole save as it was at that moment. */
export const snapsCol = db ? collection(db, "classes", CLASS_ID, "snaps") : null;
export const snapRef = id => doc(db, "classes", CLASS_ID, "snaps", id);
export async function snapsFor(sid) { const q = await getDocs(query(snapsCol, where("sid", "==", sid))); return q.docs.map(d => Object.assign({ id: d.id }, d.data())); }
export async function snapsAt(stamp) { const q = await getDocs(query(snapsCol, where("stamp", "==", stamp))); return q.docs.map(d => Object.assign({ id: d.id }, d.data())); }

// A student who belongs to another class: switch this computer to it (once per page visit, so it can never loop)
function moveToClass(id) {
  if (!/^[a-z0-9-]{1,40}$/.test(String(id || ""))) return;
  try { if (sessionStorage.getItem("ck-moved") === id) return; sessionStorage.setItem("ck-moved", id); } catch (e) {}
  switchClass(id);
}

/* ---------- 🏫 School setup (Nov 6, Step B) ----------
   classDir/{classId} = { className, teacherName, teachers: [emails] } — the small public list of classes. The rules read
   it to decide who teaches which class. admins/{email} = school admins (plus ADMIN_EMAILS built in). */
export const classDirRef = id => doc(db, "classDir", id);
export const isBuiltInAdmin = email => !!email && ADMIN_EMAILS.map(e => e.toLowerCase()).includes(String(email).toLowerCase());
export async function myAccess(email) {
  email = String(email || "").toLowerCase();
  let admin = isBuiltInAdmin(email);
  if (!admin) { try { admin = (await getDoc(doc(db, "admins", email))).exists(); } catch (e) {} }
  let classes = [];
  try {
    const snap = admin ? await getDocs(collection(db, "classDir")) : await getDocs(query(collection(db, "classDir"), where("teachers", "array-contains", email)));
    classes = snap.docs.map(d => Object.assign({ id: d.id }, d.data())).sort((a, b) => String(a.className || a.id).localeCompare(String(b.className || b.id)));
  } catch (e) {}
  return { admin, classes };
}
export async function saveClassDir(id, data) { await fbSetDoc(classDirRef(id), data, { merge: true }); }
export async function createClass(id, dir, first) {
  const b = writeBatch(db);
  b.set(classDirRef(id), dir);
  b.set(doc(db, "classes", id), first);
  await b.commit();
}
export async function adminList() { const snap = await getDocs(collection(db, "admins")); return snap.docs.map(d => d.id); }
export async function setAdmin(email, on) { const r = doc(db, "admins", String(email).toLowerCase()); on ? await fbSetDoc(r, { at: new Date().toISOString() }) : await fbDeleteDoc(r); }

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
  const r = await httpsCallable(fns, "ck")(Object.assign({ op, cls: CLASS_ID }, input || {}));   // cls = which class (Nov 6)
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
