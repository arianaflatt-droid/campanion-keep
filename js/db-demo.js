/* ---------- 🎮 Student demo (Nov 8): a pretend copy of db.js for demo.html ----------
   demo.html maps every "./db.js" import to this file (an import map), so the REAL student page runs, but everything
   it saves lives only in this browser (localStorage "ck-demo-db"). Nothing touches Firebase or the class.
   The console's 🎮 Student demo button saves a copy of the class settings ("ck-demo-class") and opens demo.html;
   this file then makes a demo student who has hit every goal, plus a few pretend classmates. */
import { BADGES } from "./badges.js?v=20261109e";
import { ROSTER } from "./game.js?v=20261109e";
const K = "ck-demo-db";
let MEM = null;   // works even if the browser blocks storage
const read = () => { if (!MEM) { try { MEM = JSON.parse(localStorage.getItem(K)) || null; } catch (e) {} if (!MEM) MEM = seed(); } return JSON.parse(JSON.stringify(MEM)); };
const subs = [];
const write = s => { MEM = s; try { localStorage.setItem(K, JSON.stringify(s)); } catch (e) {} setTimeout(() => subs.forEach(f => { try { f(); } catch (e) { console.error(e); } }), 0); };
const list = pre => Object.entries(read()).filter(([k]) => k.startsWith(pre + "/") && k.split("/").length === 2).map(([k, v]) => Object.assign({ id: k.split("/")[1] }, v));
const TEACHER = false;
export const PREVIEW = false;
export const configured = true, app = {}, db = {}, auth = { currentUser: { uid: "u1", email: TEACHER ? "ariana.flatt@unbound.school" : null } };
export const classRef = { path: "class" }, studentsCol = {}, liveRef = { path: "live/xp" };
let n = 0;
export const studentRef = id => ({ path: "students/" + id });
export const newStudentRef = () => ({ path: "students/n" + Date.now().toString(36) + (n++) });
export const battleRef = id => ({ path: "battles/" + id });
export const newBattleRef = () => ({ path: "battles/b" + Date.now().toString(36) + (n++) });
export const tradeRef = id => ({ path: "trades/" + id });
export const newTradeRef = () => ({ path: "trades/t" + Date.now().toString(36) + (n++) });
export const battlesCol = {}, tradesCol = {}, seatsCol = {}, snapsCol = {}, cardsCol = {};
export const seatRef = uid => ({ path: "seats/" + uid });
export const keysRef = { path: "private/keys" };
export const snapRef = id => ({ path: "snaps/" + id });
export const cardRef = id => ({ path: "cards/" + id });
export const rewardPicRef = id => ({ path: "rewards/" + id });
export const newsPicRef = { path: "news/pic" };
export const feederKeyRef = { path: "private/feeder" };
export const secretRef = { path: "private/secret" };
const DEL = "__DEL__";
export const deleteField = () => DEL;
function apply(d, v) {
  Object.entries(JSON.parse(JSON.stringify(v))).forEach(([k, x]) => {
    if (k.includes(".")) { const ks = k.split("."); let o = d; ks.slice(0, -1).forEach(a => { o[a] = Object.assign({}, o[a]); o = o[a]; }); if (x === DEL) delete o[ks[ks.length - 1]]; else o[ks[ks.length - 1]] = x; }
    else if (x === DEL) delete d[k]; else d[k] = x;
  });
  return d;
}
export async function setDoc(r, v) { const s = read(); s[r.path] = JSON.parse(JSON.stringify(v)); write(s); }
export async function updateDoc(r, v) { const s = read(); s[r.path] = apply(Object.assign({}, s[r.path]), v); write(s); }
export async function deleteDoc(r) { const s = read(); delete s[r.path]; write(s); }
export function writeBatch() { const ops = []; return { set: (r, v) => ops.push(() => setDoc(r, v)), update: (r, v) => ops.push(() => updateDoc(r, v)), delete: r => ops.push(() => deleteDoc(r)), commit: async () => { for (const o of ops) await o(); } }; }
const watch = (get, cb) => { const f = () => cb(JSON.parse(JSON.stringify(get()))); subs.push(f); setTimeout(f); return () => {}; };
export function watchClass(cb) { if (window.__hang) return () => {}; return watch(() => read()["class"] || null, cb); }
export function watchStudents(cb) { return watch(() => list("students"), cb); }
export function watchCards(cb) { return watch(() => list("students").map(s => { const c = Object.assign({}, s); c.name = s.pubName || s.name; return c; }), cb); }
export function watchMe(id, cb) { return watch(() => { const s = read()["students/" + id]; return s ? Object.assign({ id }, s) : null; }, cb); }
export const saveCard = async () => {};
export function watchBattles(cb) { return watch(() => list("battles"), cb); }
export function watchMyBattles(me, cb) { return watch(() => list("battles").filter(b => (b.ids || []).includes(me)), cb); }
export async function liveBattlesNow() { return list("battles").filter(b => ["invite","team","lead","fight"].includes(b.status)); }
export function watchMyTrades(me, cb) { return watch(() => list("trades").filter(t => (t.ids || []).includes(me)), cb); }
export function watchTrades(cb) { return watch(() => list("trades"), cb); }
export async function changeTrade(id, fn) { const s = read(), t = s["trades/" + id]; if (!t) return null; const r = fn(Object.assign({ id }, JSON.parse(JSON.stringify(t)))); if (!r) return null; delete r.id; s["trades/" + id] = r; write(s); return r; }
export async function changeBattle(id, fn) { const s = read(), t = s["battles/" + id]; if (!t) return null; const r = fn(Object.assign({ id }, JSON.parse(JSON.stringify(t)))); if (!r) return null; delete r.id; s["battles/" + id] = r; write(s); return r; }
export function watchRewardPic(id, cb) { return watch(() => read()["rewards/" + id] || null, cb); }
export function watchRewardPics(cb) { return watch(() => { const m = {}; Object.entries(read()).forEach(([k, v]) => { if (k.startsWith("rewards/") && v && v.img) m[k.slice(8)] = v.img; }); return m; }, cb); }
export function watchNewsPic(cb) { return watch(() => read()["news/pic"] || null, cb); }
export function watchSecret(cb) { return watch(() => read()["private/secret"] || null, cb); }
export function watchLive(cb) { return watch(() => read()["live/xp"] || null, cb); }
export function watchSeats(cb) { return watch(() => list("seats"), cb); }
export async function claimSeat() { return true; }
export async function mySeat() { return "demo"; }
export async function getKeys() { return read()["private/keys"] || {}; }
export async function snapsFor(sid) { return list("snaps").filter(x => x.sid === sid); }
export async function snapsAt(stamp) { return list("snaps").filter(x => x.stamp === stamp); }
export function isTeacherEmail(e) { return e === "ariana.flatt@unbound.school"; }
export function onAuthStateChanged(a, cb) { setTimeout(() => cb(auth.currentUser)); return () => {}; }
export async function signOut() {}
export const teacherSignIn = async () => {}, anonSignIn = async () => {};
// the server (Cloud Function) runs the real functions/actions.js against the mock data
export async function ck(op, input) {
  if (PREVIEW) throw new Error("This is a teacher preview — nothing is saved.");
  const A = await import("./server-actions.js?v=20261109e");   // the real server code, run here in the browser
  const s = read(), sid = "demo";
  if (!sid || !s["students/" + sid]) throw new Error("Open Companion Keep from your personal link first.");
  const cls = s["class"] || {}, st = Object.assign({ id: sid }, JSON.parse(JSON.stringify(s["students/" + sid])));
  const ctx = { sid, cls, st };
  const out = A.OPS[op](ctx, input || {});
  const up = out && (out.update || out.data);
  if (up) { const s2 = read(); s2["students/" + sid] = apply(Object.assign({}, s2["students/" + sid]), up); write(s2); }
  return out && (out.result !== undefined ? out.result : out);
}
export const ckMessage = e => (e && e.message) || "Something went wrong.";
// 🔑 school Google sign-in (mock): roster docs live at "roster/<email>"; window.__gEmail picks the Google account
export const SCHOOL_DOMAIN = "unbound.school";
export async function rosterList() { return Object.entries(read()).filter(([k]) => k.startsWith("roster/")).map(([k, v]) => Object.assign({ email: k.slice(7) }, v)); }
export async function seatsOnce() { return list("seats"); }
export async function rosterSave(pairs, removes) { const s = read(); (removes || []).forEach(e => delete s["roster/" + e]); pairs.forEach(([sid, email, name]) => { s["roster/" + email] = { classId: "my-class", sid, name }; }); write(s); }
export async function googleStudentSignIn() { const email = window.__gEmail || "x@gmail.com", fail = c => { const e = new Error(c); e.code = c; e.email = email; throw e; };
  if (!email.endsWith("@unbound.school")) fail("wrong-domain"); const r = read()["roster/" + email]; if (!r) fail("not-on-roster");
  const s = read(); s["seats/g-" + email] = { sid: r.sid, email, at: "x" }; write(s); localStorage.setItem("mock-gsid", r.sid); return r.sid; }
export async function seatInfo() { return { sid: "demo", email: "demo@unbound.school" }; }
export async function googleReseat() { return null; }
export async function removeLinkSeats() { const s = read(); let n = 0; Object.keys(s).forEach(k => { if (k.startsWith("seats/") && !s[k].email) { delete s[k]; n++; } }); write(s); return n; }
export const CLASS_ID = "demo";
export function switchClass() {}
export const isBuiltInAdmin = e => e === "ariana.flatt@unbound.school";
export async function myAccess(email) { const admin = window.__notAdmin ? false : true; const classes = Object.entries(read()).filter(([k]) => k.startsWith("classDir/")).map(([k, v]) => Object.assign({ id: k.slice(9) }, v)).filter(c => admin || (c.teachers || []).includes(email)); return { admin, classes }; }
export async function saveClassDir(id, data) { const s = read(); s["classDir/" + id] = Object.assign({}, s["classDir/" + id] || {}, data); write(s); }
export async function createClass(id, dir, first) { const s = read(); s["classDir/" + id] = dir; s["classes/" + id] = first; write(s); }
export async function adminList() { return Object.keys(read()).filter(k => k.startsWith("admins/")).map(k => k.slice(7)); }
export async function setAdmin(email, on) { if (window.__adminFail) throw { code: "permission-denied" }; const s = read(); on ? (s["admins/" + email] = { at: "x" }) : delete s["admins/" + email]; write(s); }

/* ---------- the demo class: a copy of the real class settings + a demo student who has hit every goal ---------- */
const AZ = d => new Date(d.getTime() - 7 * 3600e3).toISOString().slice(0, 10);   // Arizona date (no daylight time)
const addD = (iso, n) => { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
export function seed() {
  const today = AZ(new Date()), wd = (new Date(today + "T12:00:00Z").getUTCDay() + 6) % 7, mon = addD(today, -Math.min(wd, 4)), di = Math.min(wd, 4);
  let base = {}; try { base = JSON.parse(localStorage.getItem("ck-demo-class")) || {}; } catch (e) {}
  const cls = Object.assign({}, base, { name: "Demo class", weekStart: mon, roster: [], planetOn: true, recorded: [0, 1, 2, 3, 4].map(i => i < di), finalized: [0, 1, 2, 3, 4].map(i => i < di),
    offDays: {}, appVersion: "", linksRequired: false, secretOn: false });
  const hist = {}; for (let i = 1; i <= 10; i++) { const d = addD(today, -i), w = (new Date(d + "T12:00:00Z").getUTCDay() + 6) % 7; if (w < 5) hist[d] = { d: 140, mo: 60, sub: { m: 30, r: 30, l: 30 } }; }
  hist[today] = { d: 140, mo: 140, lh: true, sub: { m: 30, r: 30, l: 30 } };
  const seen = {}; BADGES.forEach(b => { seen[b.id] = true; });
  const kid = (name, i, extra) => Object.assign({ name, pubName: name, order: i, companionId: ROSTER[i % ROSTER.length].id, starter: "C-01", status: [0, 1, 2, 3, 4].map(d => (d <= di ? "c" : "")),
    xp: [0, 1, 2, 3, 4].map(d => (d <= di ? 140 : null)), early: [0, 1, 2, 3, 4].map(d => d === di), xpHist: hist, streakWeek: mon, streakCarry: 10, badgesSeen: seen,
    coll: { "C-01": { lvl: 12, at: "x" } } }, extra || {});
  const s = { "class": cls };
  s["students/demo"] = kid("Demo Student", 0, { companionId: "fox",
    coll: { "C-01": { lvl: 25, at: "x" }, "C-06": { lvl: 9, at: "x" }, "U-12": { lvl: 7, at: "x" }, "R-20": { lvl: 5, at: "x" }, "S-30": { lvl: 3, at: "x" } },
    planet: { n: 16, last: addD(today, -1), streak: 4, best: 4, dust: 3000, nets: { b: 3, s: 2, c: 1 }, sv: 1 },
    candyBonus: 300, cpBonus: 1500, doorEggs: 3, bond: { n: 12 } });
  const SN = ["moonmilk", "galaxydonut", "rocketpop", "starfries", "nebulasmoothie", "cometcookies", "sweetpotato-fries"];
  ["Ava", "Ben", "Mia", "Leo", "Zoe", "Max", "Ivy"].forEach((n, i) => { s["students/k" + i] = kid(n, i + 1, { planet: { n: 3 + i, last: today, dust: 60 + i * 20, cf: { d: today, k: SN[i], s: 3 } } }); });
  return s;
}
export function resetDemo() { MEM = seed(); try { localStorage.setItem(K, JSON.stringify(MEM)); } catch (e) {} }
