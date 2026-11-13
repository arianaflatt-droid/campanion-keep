/* ---------- 🛝 Nebbles Phase 4 + 5: the Pet Playground and live Nebble Recess (Nov 9) ----------
   Daily Playground (in the Pet Park, while Planet JP is open): the student's buddy Nebble plays on the playground with
   the buddies of every classmate who landed on Planet JP today. Classmates' Nebbles wander around by themselves
   (their pets come from the class's public cards the page already reads, so NO extra reads and NO saves at all).
   Tap the ground to hop there, tap the emote buttons (👋 💖 ⭐ 😄 🎵), tap a classmate's Nebble to send it hearts. No Stardust.
   🔔 Nebble Recess (live, teacher-switched like Party Time): Ms. Ariana taps Start on the console Daily tab
   (cls.nbRecess = { id, end }, 10 minutes, ends by itself). Every student who owns a Nebble gets a "Join Recess" button
   on every tab (Planet JP doesn't have to be open). Everyone sees everyone's Nebble move for real.
   Each student's spot is saved on their own save as nbr = { id: recess id, x, y, e: emote, et: emote time }:
   at most one save every 3 seconds and at most 50 per recess (so a recess costs at most ~100 writes per student, card included). */
import { esc } from "./game.js?v=20261113f";
import { azToday } from "./collect.js?v=20261113f";
import { freshSt } from "./safari.js?v=20261113f";
import { NEB, PP, ownedOf, petsOf, nebHTML, nebImg, nebHappy } from "./pets.js?v=20261113f";

export const RECESS_MIN = 10, SAVE_GAP = 3000, SAVE_MAX = 50;
const EMOTES = [["wave", "\u{1F44B}"], ["love", "\u{1F496}"], ["star", "⭐"], ["lol", "\u{1F604}"], ["music", "\u{1F3B5}"]];
const EMO = {}; EMOTES.forEach(([k, e]) => { EMO[k] = e; });
const X0 = 6, X1 = 88, Y0 = 50, Y1 = 80;   // the play area (left/top % of the Nebble box)
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const buddyOf = st => { const own = ownedOf(st), b = petsOf(st).buddy; return b && own[b] && NEB[b] ? { k: b, o: own[b] } : null; };
export const recessOf = cls => { const r = cls && cls.nbRecess; return r && r.id && Number(r.end) > Date.now() ? r : null; };
const leftTxt = r => { const s = Math.max(0, Math.round((Number(r.end) - Date.now()) / 1000)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };

let daily = false, me = { x: 46, y: 64 }, myEmo = null;
export const playOpen = () => daily;
function petHTML(id, k, o, name, x, y, mine) {
  return '<button class="pgpet' + (mine ? " me" : " other") + '" id="pg-' + esc(id) + '" data-pgid="' + esc(id) + '" data-k="' + k + '" style="left:' + x + "%;top:" + y + '%">' +
    nebHTML(k, { hat: o.h }) + '<span class="pgname">' + esc(name) + '</span><span class="pgemo"></span></button>';
}
function sceneHTML(id, st, others, extra) {
  const b = buddyOf(st);
  let h = '<div class="pgscene" id="' + id + '" style="background-image:url(' + PP + 'playground-bg.webp)">';
  others.forEach(p => { h += petHTML(p.id, p.k, p.o, p.name, p.x, p.y, false); });
  if (b) h += petHTML("me", b.k, b.o, b.o.n, me.x, me.y, true);
  return h + (extra || "") + "</div>" +
    '<div class="pgemos">' + EMOTES.map(([k, e]) => '<button class="pgemobtn" data-pg="emo:' + k + '">' + e + "</button>").join("") + "</div>";
}
// 🛝 the daily playground (drawn inside the Pet Park card)
export function playgroundHTML(st, cls, students) {
  st = freshSt(st); const d = azToday(), seed = s => { let h = 7; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) % 9973; return h; };
  const others = (students || []).filter(s => s && s.id !== st.id && s.planet && s.planet.last === d && buddyOf(s)).slice(0, 14)
    .map(s => { const b = buddyOf(s), n = seed(s.id); return { id: s.id, k: b.k, o: b.o, name: (s.name || "").split(" ")[0] + "’s " + b.o.n, x: X0 + n % (X1 - X0), y: Y0 + (n >> 3) % (Y1 - Y0) }; });
  return '<div class="card pgcard"><div class="card-head"><h2>\u{1F6DD} Pet Playground</h2><button class="btn ghost small" data-pg="close">← Pet Park</button></div>' +
    '<p class="lede" style="margin:0 0 8px;font-size:14px;">' + (others.length ? "<b>" + others.length + "</b> classmate" + (others.length === 1 ? "’s Nebble is" : "s’ Nebbles are") + " here today! " : "Nobody else’s Nebble is here yet today. ") +
    "Tap the ground to hop, tap a friend’s Nebble to send hearts, and use the buttons to say hi.</p>" + sceneHTML("pgdaily", st, others) + "</div>";
}

/* ---------- moving, emotes, hearts (shared by the daily playground and Recess) ---------- */
function floatHearts(el) { const s = el.closest(".pgscene"); if (!s) return; for (let i = 0; i < 3; i++) { const h = document.createElement("span"); h.className = "pkheart"; h.textContent = ["\u{1F496}", "\u{1F495}", "✨"][i];
  h.style.left = (parseFloat(el.style.left) + 4 + (i - 1) * 3) + "%"; h.style.top = (parseFloat(el.style.top) - 2 - i * 2) + "%"; s.appendChild(h); setTimeout(() => h.remove(), 1200); } }
function showEmo(el, k) {
  const b = el && el.querySelector(".pgemo"); if (!b) return; b.textContent = EMO[k] || ""; b.classList.remove("on"); void b.offsetWidth; b.classList.add("on");
  const img = el.querySelector(".nbimg"); if (img) { img.src = nebHappy(el.dataset.k); clearTimeout(el._t); el._t = setTimeout(() => { img.src = nebImg(el.dataset.k); }, 1600); }
}
function moveMe(x, y) {
  me = { x: clamp(x, X0, X1), y: clamp(y, Y0, Y1) };
  document.querySelectorAll(".pgpet.me").forEach(p => { p.classList.add("hop"); p.style.left = me.x + "%"; p.style.top = me.y + "%"; clearTimeout(p._h); p._h = setTimeout(() => p.classList.remove("hop"), 700); });
}
if (typeof document !== "undefined") document.addEventListener("click", ev => {
  const t = ev.target.closest && ev.target.closest("[data-pg]");
  if (t) { const [a, k] = t.dataset.pg.split(":");
    if (a === "open") { daily = true; return side.rerender && side.rerender(); }
    if (a === "close") { daily = false; return side.rerender && side.rerender(); }
    if (a === "emo") { myEmo = { k, at: Date.now() }; document.querySelectorAll(".pgpet.me").forEach(p => showEmo(p, k)); if (rec.open) queueSave(); return; }
    if (a === "join") return openRecess();
    if (a === "leave") return closeRecess();
    return; }
  const sc = ev.target.closest && ev.target.closest(".pgscene"); if (!sc) return;
  const other = ev.target.closest(".pgpet.other"); if (other) { floatHearts(other); showEmo(other, "love"); return; }
  if (ev.target.closest(".pgpet.me")) { const p = ev.target.closest(".pgpet.me"); showEmo(p, "lol"); return; }
  const r = sc.getBoundingClientRect(); moveMe((ev.clientX - r.left) / r.width * 100 - 4.5, (ev.clientY - r.top) / r.height * 100 - 10);
  if (rec.open) queueSave();
});
// classmates on the daily playground wander by themselves
let wander = null;
function wanderTick() { document.querySelectorAll("#pgdaily .pgpet.other").forEach(p => { if (Math.random() < 0.5) { p.style.left = (X0 + Math.random() * (X1 - X0)) + "%"; p.style.top = (Y0 + Math.random() * (Y1 - Y0)) + "%"; } if (Math.random() < 0.12) showEmo(p, EMOTES[Math.floor(Math.random() * EMOTES.length)][0]); }); }

/* ---------- 🔔 live Recess ---------- */
let side = {}, rec = { open: false, id: null, saves: 0, last: 0, timer: null, tick: null }, root = null;
const rootEl = () => { if (!root) { root = document.createElement("div"); root.id = "pgroot"; document.body.appendChild(root); } return root; };
function queueSave() {
  if (!rec.open || side.preview || !side.patch || rec.saves >= SAVE_MAX) return;
  const wait = Math.max(0, rec.last + SAVE_GAP - Date.now()); clearTimeout(rec.timer);
  rec.timer = setTimeout(() => { if (!rec.open || rec.saves >= SAVE_MAX) return; rec.last = Date.now(); rec.saves++;
    const d = { id: rec.id, x: Math.round(me.x * 10) / 10, y: Math.round(me.y * 10) / 10 }; if (myEmo && Date.now() - myEmo.at < SAVE_GAP + 1000) { d.e = myEmo.k; d.et = myEmo.at; }
    side.patch({ nbr: d }); }, wait);
}
const recPets = (r) => (side.students || []).filter(s => s && side.st && s.id !== side.st.id && s.nbr && s.nbr.id === r.id && buddyOf(s));
function openRecess() {
  const r = recessOf(side.cls), st = side.st; if (!r || !st || !buddyOf(st)) return;
  if (rec.id !== r.id) { rec.saves = 0; rec.last = 0; me = { x: X0 + Math.random() * (X1 - X0), y: Y0 + Math.random() * (Y1 - Y0) }; }
  rec.open = true; rec.id = r.id;
  const others = recPets(r).map(s => { const b = buddyOf(s); return { id: s.id, k: b.k, o: b.o, name: (s.name || "").split(" ")[0] + "’s " + b.o.n, x: s.nbr.x, y: s.nbr.y }; });
  rootEl().innerHTML = '<div class="pgover"><div class="pgbox"><div class="pghead"><h2>\u{1F514} Nebble Recess!</h2><span class="pgleft" id="pgleft">' + leftTxt(r) + '</span><button class="btn ghost small" data-pg="leave">Leave</button></div>' +
    '<p class="small" style="margin:0 0 6px;">Everyone’s Nebbles are here for real! Tap to hop, tap a friend’s Nebble for hearts.</p>' + sceneHTML("pgrec", st, others) + "</div></div>";
  clearInterval(rec.tick); rec.tick = setInterval(() => { const r2 = recessOf(side.cls), el = document.getElementById("pgleft");
    if (!r2 || r2.id !== rec.id) { endRecess(); return; } if (el) el.textContent = leftTxt(r2); }, 1000);
  queueSave(); joinBtn();
}
function endRecess() {
  clearInterval(rec.tick); rec.open = false; if (!root) return;
  root.innerHTML = '<div class="pgover"><div class="pgbox pgend"><h2>\u{1F514} Recess is over!</h2><p>Your Nebble had so much fun playing with everyone! \u{1F496}</p><button class="btn gold" data-pg="leave">Bye!</button></div></div>';
}
function closeRecess() { clearInterval(rec.tick); clearTimeout(rec.timer); rec.open = false; if (root) root.innerHTML = ""; joinBtn(); }
function joinBtn() {
  const r = recessOf(side.cls), st = side.st, b = st && buddyOf(st), el = document.getElementById("pgjoin");
  const want = r && b && !rec.open;
  if (!want) { if (el) el.remove(); return; }
  const html = '\u{1F514} <b>Nebble Recess!</b> Bring ' + esc(b.o.n) + ' to play →';
  if (el) { if (el.innerHTML !== html) el.innerHTML = html; return; }
  const btn = document.createElement("button"); btn.id = "pgjoin"; btn.dataset.pg = "join"; btn.innerHTML = html; document.body.appendChild(btn);
}
// keep classmates' Nebbles where their latest save says (called on every page render)
function updateRecess() {
  const r = recessOf(side.cls); if (!rec.open) return; if (!r || r.id !== rec.id) return endRecess();
  const sc = document.getElementById("pgrec"); if (!sc) return;
  const seen = new Set();
  recPets(r).forEach(s => { const b = buddyOf(s); seen.add(s.id); let el = document.getElementById("pg-" + s.id);
    if (!el) { sc.insertAdjacentHTML("afterbegin", petHTML(s.id, b.k, b.o, (s.name || "").split(" ")[0] + "’s " + b.o.n, s.nbr.x, s.nbr.y, false)); el = document.getElementById("pg-" + s.id); }
    el.style.left = s.nbr.x + "%"; el.style.top = s.nbr.y + "%";
    if (s.nbr.e && s.nbr.et && s.nbr.et !== Number(el.dataset.et || 0) && Date.now() - s.nbr.et < 8000) { el.dataset.et = s.nbr.et; showEmo(el, s.nbr.e); } });
  sc.querySelectorAll(".pgpet.other").forEach(el => { if (!seen.has(el.dataset.pgid)) el.remove(); });
}
// c = { st, cls, students, patch, preview, rerender }
export function playSync(c) {
  side = Object.assign({}, c, { st: c.st ? freshSt(c.st) : null });
  if (typeof document === "undefined") return;
  if (daily && document.getElementById("pgdaily")) { if (!wander) wander = setInterval(wanderTick, 2600); } else if (wander) { clearInterval(wander); wander = null; }
  joinBtn(); updateRecess();
}

/* ---------- teacher console card ---------- */
export function recessAdmin(students, cls) {
  const r = recessOf(cls), kids = (students || []).filter(s => s.companionId && !s.isTeacher), have = kids.filter(s => buddyOf(s)).length, inN = r ? kids.filter(s => s.nbr && s.nbr.id === r.id).length : 0;
  return '<div class="card"><div class="card-head"><h2>\u{1F514} Nebble Recess</h2><span class="fact">' + (r ? "on · " + leftTxt(r) + " left" : "off") + "</span></div>" +
    '<p class="small" style="margin:0 0 8px;">A live 10-minute playground: every student with a Nebble (' + have + " now) gets a Join button on their Keep and sees everyone’s Nebbles move for real. Planet JP doesn’t have to be open. It ends by itself.</p>" +
    '<div class="row" style="gap:8px;align-items:center;">' + (r ? '<span class="small"><b>' + inN + "</b> playing</span><button class=\"btn ghost small\" data-act=\"recessStop\">End early</button>" : '<button class="btn" data-act="recessStart">\u{1F514} Start Recess (' + RECESS_MIN + " min)</button>") + "</div></div>";
}
export function recessAction(act, cls) {
  if (act === "recessStart") return { nbRecess: { id: "r-" + Date.now(), end: Date.now() + RECESS_MIN * 60000 } };
  if (act === "recessStop") return cls && cls.nbRecess ? { "nbRecess.end": Date.now() } : null;
  return null;
}
