/* ---------- 🌊 The Axolotl Kingdom (Nov 10) ----------
   A reward land under the sea. It opens when a student reaches their weekly XP AND closes all their rings
   (the same rule as the Treasure Vault: doors.js vaultMet), and stays open until Sunday 10 pm (Arizona). A new week starts locked.
   Ms. Ariana turns the tab on and off in the console (cls.kdOn).
   Inside:
   - 👑 Throne Room: Queen Bubbles gives one Royal Clam a week. It holds one of 12 Kingdom treasures (a new one whenever possible;
     an extra one is turned into pearls). Pearls buy extra clams: 40 pearls each, up to 2 extra a week.
   - 🫧 Pearl Diving (Pearl Caves): a 45-second dive as the student's own Bubble's Baby. 3 dives a week.
   Saved on the student as kd = { w: the week (Monday), c: clams opened this week, x: extra clams bought this week,
     dv: dives this week, p: pearls, tr: { treasure: 1 }, best: best dive }.
   One save per clam, per dive and per extra clam. The game itself runs in its own layer (no page redraws mid-dive). */
import { esc, weekKey } from "./game.js?v=20261110i";
import { azToday, azNow } from "./collect.js?v=20261110i";
import { vaultMet, vaultGoal, subReq, addDays } from "./doors.js?v=20261110i";

const K = "assets/kingdom/";
export const KD_DIVES = 3, KD_EXTRA = 2, KD_EXTRA_COST = 40, KD_DUPE = 10, KD_CLOSE = 22 * 60, DIVE_SECS = 45;
export const TREASURES = [
  ["starfish", "Golden Starfish", "⭐"], ["conch", "Spiral Conch", "\u{1F41A}"], ["pearlnecklace", "Pearl Necklace", "\u{1F4FF}"],
  ["crown", "Coral Crown", "\u{1F451}"], ["seaglass", "Rainbow Sea Glass", "\u{1F48E}"], ["trident", "Golden Trident", "\u{1F531}"],
  ["seahorse", "Golden Seahorse", "\u{1F40E}"], ["mirror", "Shell Mirror", "\u{1FA9E}"], ["coral", "Glowing Coral", "\u{1FAB8}"],
  ["compass", "Ship Compass", "\u{1F9ED}"], ["gem", "Ocean Heart Gem", "\u{1F499}"], ["egg", "Axolotl Egg", "\u{1F95A}"]];
const TR = {}; TREASURES.forEach(([k, n, e]) => { TR[k] = { k, n, e }; });
// the treasure picture, or its emoji until the picture is uploaded
const trImg = (k, cls) => '<span class="kdtr ' + (cls || "") + '"><img src="' + K + "tr-" + k + '.webp" alt="" onerror="this.remove()"><i>' + TR[k].e + "</i></span>";

export const kdOn = cls => !!(cls && cls.kdOn);
const wk = cls => weekKey(cls);
// the week's save (a new week starts empty, but pearls and treasures stay)
export function kdOf(st, cls) {
  const k = (st && st.kd) || {}, w = wk(cls);
  return k.w === w ? Object.assign({}, k) : { w, c: 0, x: 0, dv: 0, p: Number(k.p) || 0, tr: Object.assign({}, k.tr || {}), best: Number(k.best) || 0 };
}
export const treasureCount = st => Object.keys(((st && st.kd) || {}).tr || {}).filter(k => TR[k]).length;
// open until Sunday 10 pm of this week (Arizona)
export function kdTimeOk(cls) {
  const sun = addDays(wk(cls), 6), d = azToday(), t = azNow(); if (d > sun) return false;
  return !(d === sun && t.h * 60 + t.m >= KD_CLOSE);
}
export const kdUnlocked = (st, cls) => kdOn(cls) && !!st && vaultMet(st, cls) && kdTimeOk(cls);
export const clamsLeft = (st, cls) => { const k = kdOf(st, cls); return Math.max(0, 1 + (Number(k.x) || 0) - (Number(k.c) || 0)); };
export const kdTodo = (st, cls) => kdUnlocked(st, cls) && (clamsLeft(st, cls) > 0 || (Number(kdOf(st, cls).dv) || 0) < KD_DIVES);

let C = null, view = "map", msg = null, opened = null;
export function kdSync(c) { C = c; }
const rer = () => { if (C && C.render) C.render(); };
const save = k => { if (C && C.patch && !C.preview) C.patch({ kd: k }); else if (C && C.st) { C.st.kd = k; rer(); } };

/* ----- the bubble Bubble's Baby (the diver's color) ----- */
const PAL = ["none", "brightness(0.28) saturate(2.0) hue-rotate(270deg) contrast(1.5)", "hue-rotate(-120deg) saturate(1.3)", "hue-rotate(55deg) saturate(1.8) brightness(1.15) contrast(1.05)",
  "hue-rotate(150deg) saturate(1.8) brightness(1.15)", "hue-rotate(-55deg) saturate(1.5) brightness(1.05)"];
const diverFx = st => PAL[Number(((st && st.axo) || {}).paletteIndex) || 0] || "none";
const diverName = st => ((st && st.axo && st.axo.name) || "").trim() || "your axolotl";

/* ----- the locked gate: weekly XP + rings ----- */
function gateHTML(st, cls) {
  const v = vaultGoal(st, cls), q = subReq(st, cls), timeOk = kdTimeOk(cls);
  const rows = ['<span class="kdreq' + (v.n >= v.xp ? " ok" : "") + '">⭐ ' + Math.min(v.n, v.xp).toLocaleString() + " / " + v.xp.toLocaleString() + (v.sub && v.sub !== "all" ? " goal-subject XP" : " XP") + (v.n >= v.xp ? " ✅" : "") + "</span>"]
    .concat(v.tot < v.min && v.xp < v.min ? ['<span class="kdreq">⭐ ' + v.tot + " / " + v.min + " XP total</span>"] : [])
    .concat((q.rows || []).map(r => '<span class="kdreq' + (r.have >= r.need ? " ok" : "") + '">' + esc(r.name) + " " + Math.min(r.have, r.need) + " / " + r.need + (r.have >= r.need ? " ✅" : "") + "</span>"));
  return '<div class="kdscene kdgate" style="background-image:url(' + K + 'kingdom-gate.webp)"><div class="kdgatebox">' +
    "<h2>\u{1F512} The Kingdom gate is closed</h2>" +
    (timeOk ? "<p>Reach your <b>weekly XP</b> and close <b>all your rings</b> this week, and the gate opens until Sunday night!</p>" : "<p>The Kingdom closed for this week. A new week starts Monday!</p>") +
    '<div class="kdreqs">' + rows.join("") + "</div></div></div>";
}

/* ----- the Kingdom map ----- */
function mapHTML(st, cls) {
  const k = kdOf(st, cls), cl = clamsLeft(st, cls), dl = Math.max(0, KD_DIVES - (Number(k.dv) || 0));
  return '<div class="kdscene" style="background-image:url(' + K + 'kingdom-map.webp)">' +
    '<button class="kdspot kdcastle" data-kd="go:throne"><span>\u{1F451} Throne Room' + (cl ? ' <i class="kdbang">' + cl + "</i>" : "") + "</span></button>" +
    '<button class="kdspot kdcave" data-kd="go:dive"><span>\u{1FAE7} Pearl Caves' + (dl ? ' <i class="kdbang">' + dl + "</i>" : "") + "</span></button>" +
    '<button class="kdspot kdchestbtn" data-kd="go:chest"><span>\u{1F9F0} My Treasures <b>' + treasureCount(st) + "/12</b></span></button></div>" +
    '<p class="small" style="margin:8px 0 0;">\u{1F451} ' + (cl ? "A Royal Clam is waiting in the Throne Room!" : "You opened your Royal Clam this week.") + " · \u{1FAE7} " + dl + " of " + KD_DIVES + " dives left this week · ⚪ " + (Number(k.p) || 0) + " pearls</p>";
}

/* ----- Throne Room ----- */
function throneHTML(st, cls) {
  const k = kdOf(st, cls), cl = clamsLeft(st, cls), canBuy = (Number(k.x) || 0) < KD_EXTRA && (Number(k.p) || 0) >= KD_EXTRA_COST;
  const pose = opened ? "queen-cheer" : cl ? "queen-gift" : "queen-wave";
  let say = opened ? (opened.dupe ? "You already have the <b>" + esc(TR[opened.k].n) + "</b>, so here are <b>+" + KD_DUPE + " pearls</b> instead!" : "Ooh, the <b>" + esc(TR[opened.k].n) + "</b>! It’s yours to keep forever!")
    : cl ? "Welcome to my Kingdom! This Royal Clam is for you. Tap it to open it!" : "Come back next week for another Royal Clam!" + ((Number(k.x) || 0) < KD_EXTRA ? " Or trade " + KD_EXTRA_COST + " pearls for an extra one." : "");
  return '<div class="kdscene" style="background-image:url(' + K + 'throne-room.webp)">' +
    '<img class="kdqueen" src="' + K + pose + '.webp" alt="Queen Bubbles">' +
    (opened ? '<div class="kdprize">' + '<img class="kdclam" src="' + K + 'clam-open.webp" alt="">' + trImg(opened.k, "big") + "</div>"
      : cl ? '<button class="kdclambtn" data-kd="clam"><img class="kdclam" src="' + K + 'clam-closed.webp" alt="Royal Clam"><span>Tap to open!</span></button>' : "") +
    '<div class="kdsay"><b>Queen Bubbles:</b> ' + say + "</div></div>" +
    '<div class="row" style="margin-top:8px;gap:8px;">' + (opened ? '<button class="btn gold" data-kd="ok">Yay! \u{1F389}</button>' : "") +
    ((Number(k.x) || 0) < KD_EXTRA && !cl && !opened ? '<button class="btn' + (canBuy ? " gold" : " ghost") + '" data-kd="extra"' + (canBuy ? "" : " disabled") + ">⚪ Trade " + KD_EXTRA_COST + " pearls for an extra clam (" + (KD_EXTRA - (Number(k.x) || 0)) + " left this week)</button>" : "") +
    '<span class="small muted">You have ⚪ ' + (Number(k.p) || 0) + " pearls. Dive in the Pearl Caves for more!</span></div>";
}
function openClam() {
  if (!C || !C.st || clamsLeft(C.st, C.cls) < 1) return;
  const k = kdOf(C.st, C.cls), have = Object.keys(k.tr || {}), left = TREASURES.map(t => t[0]).filter(x => !have.includes(x));
  const pick = left.length ? left[Math.floor(Math.random() * left.length)] : TREASURES[Math.floor(Math.random() * TREASURES.length)][0];
  const dupe = !left.length;
  k.c = (Number(k.c) || 0) + 1; k.tr = Object.assign({}, k.tr || {}); if (!dupe) k.tr[pick] = 1; else k.p = (Number(k.p) || 0) + KD_DUPE;
  k.n = (Number(((C.st.kd || {}).n)) || 0) + 1;
  opened = { k: pick, dupe }; save(k);
}
function buyExtra() {
  if (!C || !C.st) return; const k = kdOf(C.st, C.cls);
  if ((Number(k.x) || 0) >= KD_EXTRA || (Number(k.p) || 0) < KD_EXTRA_COST) return;
  k.x = (Number(k.x) || 0) + 1; k.p -= KD_EXTRA_COST; save(k);
}

/* ----- My Treasures ----- */
function chestHTML(st) {
  const have = ((st && st.kd) || {}).tr || {};
  return '<div class="card kdchest"><div class="card-head"><h2>\u{1F9F0} Royal Treasure Chest</h2><span class="fact">' + treasureCount(st) + " of 12</span></div>" +
    '<div class="kdtrs">' + TREASURES.map(([k, n]) => '<div class="kdtrcell' + (have[k] ? " have" : "") + '">' + trImg(k) + "<b>" + (have[k] ? esc(n) : "???") + "</b></div>").join("") + "</div>" +
    '<p class="small muted" style="margin:8px 0 0;">Get a new treasure from Queen Bubbles’ Royal Clam every week.</p></div>';
}

/* ----- Pearl Diving (its own layer, so page redraws don't stop it) ----- */
function diveHTML(st, cls) {
  const k = kdOf(st, cls), dl = Math.max(0, KD_DIVES - (Number(k.dv) || 0));
  return '<div class="kdscene" style="background-image:url(' + K + 'dive-bg.webp)"><div class="kdgatebox">' +
    "<h2>\u{1FAE7} Pearl Diving</h2><p>Swim with <b>" + esc(diverName(st)) + "</b> and grab the pearls! ⚪ = 1 pearl, \u{1F7E1} golden = 5. Watch out for jellyfish, they make you drop 3!</p>" +
    "<p>Move with your mouse or finger (or the ⬅️ ➡️ keys). " + DIVE_SECS + " seconds.</p>" +
    (dl ? '<button class="btn gold big" data-kd="dive">\u{1F30A} Dive! (' + dl + " of " + KD_DIVES + " left this week)</button>" : "<p><b>No dives left this week.</b> Come back next week!</p>") +
    (k.best ? '<p class="small">\u{1F3C6} Your best dive: ' + k.best + " pearls</p>" : "") + "</div></div>";
}
let G = null;
function startDive() {
  if (!C || !C.st || G) return; const k = kdOf(C.st, C.cls); if ((Number(k.dv) || 0) >= KD_DIVES) return;
  const root = document.createElement("div"); root.className = "kdgame"; root.id = "kdgame";
  root.innerHTML = '<div class="kdstage" style="background-image:url(' + K + 'dive-bg.webp)"><div class="kdhud"><span>⚪ <b id="kdp">0</b></span><span>⏱️ <b id="kdt">' + DIVE_SECS + "</b></span></div>" +
    '<img class="kddiver" id="kddiver" src="assets/axolotl/frame-1.webp" alt="" style="filter:' + diverFx(C.st) + '"></div>';
  document.body.appendChild(root);
  const stage = root.querySelector(".kdstage"), dv = root.querySelector("#kddiver");
  G = { root, stage, dv, x: 50, tx: 50, items: [], score: 0, t0: performance.now(), last: performance.now(), spawn: 0, over: false, face: 1, keys: {} };
  const move = e => { const r = stage.getBoundingClientRect(); G.tx = Math.max(6, Math.min(94, (e.clientX - r.left) / r.width * 100)); };
  stage.addEventListener("pointermove", move); stage.addEventListener("pointerdown", move);
  G.kd = e => { if (e.key === "ArrowLeft" || e.key === "ArrowRight") { G.keys[e.key] = e.type === "keydown"; e.preventDefault(); } };
  addEventListener("keydown", G.kd); addEventListener("keyup", G.kd);
  requestAnimationFrame(step);
}
function spawn() {
  const r = Math.random(), kind = r < 0.22 ? "jelly" : r < 0.32 ? "gold" : "pearl";
  const el = document.createElement("img"); el.className = "kditem " + kind; el.alt = "";
  el.src = K + (kind === "jelly" ? "dive-jelly" : kind === "gold" ? "pearl-gold" : "pearl") + ".webp";
  G.stage.appendChild(el);
  G.items.push({ el, kind, x: 6 + Math.random() * 88, y: -8, v: (kind === "jelly" ? 11 : 16) + Math.random() * 10, w: Math.random() * 6.28 });
}
function pop(x, y, t, bad) { const s = document.createElement("span"); s.className = "kdpop" + (bad ? " bad" : ""); s.textContent = t; s.style.left = x + "%"; s.style.top = y + "%"; G.stage.appendChild(s); setTimeout(() => s.remove(), 900); }
function step(now) {
  if (!G || G.over) return;
  const dt = Math.min(0.05, (now - G.last) / 1000); G.last = now;
  const left = DIVE_SECS - (now - G.t0) / 1000;
  if (G.keys.ArrowLeft) G.tx = Math.max(6, G.tx - 70 * dt); if (G.keys.ArrowRight) G.tx = Math.min(94, G.tx + 70 * dt);
  const dx = G.tx - G.x; G.x += dx * Math.min(1, dt * 7); if (Math.abs(dx) > 0.5) G.face = dx > 0 ? 1 : -1;
  G.dv.style.left = G.x + "%"; G.dv.style.transform = "translate(-50%,-50%) scaleX(" + (-G.face) + ")";
  G.spawn -= dt; if (G.spawn <= 0) { spawn(); G.spawn = 0.45 + Math.random() * 0.4; }
  G.items = G.items.filter(it => {
    it.y += it.v * dt; it.w += dt * 2; const x = it.x + Math.sin(it.w) * 2;
    it.el.style.left = x + "%"; it.el.style.top = it.y + "%";
    if (Math.abs(it.y - 78) < 8 && Math.abs(x - G.x) < 7) {
      if (it.kind === "jelly") { const lost = Math.min(3, G.score); G.score -= lost; pop(x, it.y, lost ? "-" + lost : "Oops!", true); G.dv.classList.add("ouch"); setTimeout(() => G && G.dv.classList.remove("ouch"), 400); }
      else { const g = it.kind === "gold" ? 5 : 1; G.score += g; pop(x, it.y, "+" + g); }
      it.el.remove(); return false;
    }
    if (it.y > 108) { it.el.remove(); return false; }
    return true;
  });
  const p = document.getElementById("kdp"), t = document.getElementById("kdt"); if (p) p.textContent = G.score; if (t) t.textContent = Math.max(0, Math.ceil(left));
  if (left <= 0) return endDive();
  requestAnimationFrame(step);
}
function endDive() {
  G.over = true; removeEventListener("keydown", G.kd); removeEventListener("keyup", G.kd);
  const got = G.score, k = kdOf(C.st, C.cls); k.dv = (Number(k.dv) || 0) + 1; k.p = (Number(k.p) || 0) + got; k.best = Math.max(Number(k.best) || 0, got);
  save(k);
  const box = document.createElement("div"); box.className = "kdend";
  box.innerHTML = '<img src="' + K + 'queen-cheer.webp" alt=""><h2>\u{1F389} +' + got + " pearls!</h2><p>You have ⚪ <b>" + k.p + "</b> pearls. " + Math.max(0, KD_DIVES - k.dv) + " dives left this week.</p>" +
    (k.p >= KD_EXTRA_COST && (Number(k.x) || 0) < KD_EXTRA ? "<p>You can trade " + KD_EXTRA_COST + " pearls for an extra Royal Clam in the Throne Room!</p>" : "") +
    '<button class="btn gold big" data-kd="enddive">Back to the Kingdom</button>';
  G.stage.appendChild(box);
}

if (typeof document !== "undefined") document.addEventListener("click", ev => {
  const t = ev.target.closest && ev.target.closest("[data-kd]"); if (!t) return;
  const [a, k] = t.dataset.kd.split(":");
  if (a === "go") { view = k; opened = null; msg = null; rer(); scrollTo({ top: 0 }); }
  else if (a === "clam") openClam();
  else if (a === "ok") { opened = null; rer(); }
  else if (a === "extra") buyExtra();
  else if (a === "dive") startDive();
  else if (a === "enddive") { if (G) { G.root.remove(); G = null; } view = "map"; rer(); }
  else if (a === "enter") { try { localStorage.setItem("ck-kd-" + (C && C.st && C.st.id) + "-" + wk(C && C.cls), "1"); } catch (e) {} rer(); }
});

// the tab
export function kingdomTab(st, cls) {
  if (!kdUnlocked(st, cls)) return gateHTML(st, cls);
  let seen = false; try { seen = localStorage.getItem("ck-kd-" + st.id + "-" + wk(cls)) === "1"; } catch (e) { seen = true; }
  if (!seen) return '<div class="kdscene kdgate open" style="background-image:url(' + K + 'kingdom-gate.webp)"><div class="kdbubbles">' + Array.from({ length: 14 }, (_, i) => '<i style="left:' + (8 + i * 6.5) + "%;animation-delay:" + (i % 5) * 0.3 + 's"></i>').join("") + "</div>" +
    '<div class="kdgatebox"><h2>\u{1F389} The gate is open!</h2><p>You reached your weekly XP and closed all your rings. Welcome to the <b>Axolotl Kingdom</b>!</p><p class="small">Open until Sunday at 10 pm.</p>' +
    '<button class="btn gold big" data-kd="enter">\u{1F30A} Swim in!</button></div></div>';
  const back = view !== "map" ? '<div class="row" style="margin:0 0 10px;"><button class="btn ghost small" data-kd="go:map">← Kingdom map</button></div>' : "";
  const head = '<div class="kdhead"><h2>\u{1F30A} The Axolotl Kingdom</h2><span class="fact">⚪ ' + (Number(kdOf(st, cls).p) || 0) + " pearls · \u{1F9F0} " + treasureCount(st) + "/12</span></div>";
  if (view === "throne") return head + back + throneHTML(st, cls);
  if (view === "dive") return head + back + diveHTML(st, cls);
  if (view === "chest") return head + back + chestHTML(st);
  return head + mapHTML(st, cls);
}

/* ----- console card ----- */
export function kdAdmin(students, cls) {
  const on = kdOn(cls), kids = students.filter(s => s.companionId), inn = on ? kids.filter(s => kdUnlocked(s, cls)) : [];
  let h = '<div class="card" id="kdCard"><div class="card-head"><h2>\u{1F30A} Axolotl Kingdom</h2><span class="fact">' + (on ? "<b>ON</b> · " + inn.length + " in this week" : "off") + "</span></div>" +
    '<p class="lede" style="font-size:13.5px;">An undersea reward land. A student gets in when they reach their <b>weekly XP</b> and close <b>all their rings</b> (the same as opening the Treasure Vault). It stays open until Sunday 10 pm. Inside: Queen Bubbles’ weekly Royal Clam (12 treasures to collect) and Pearl Diving (3 dives a week).</p>' +
    '<div class="row" style="margin:10px 0;"><button class="btn' + (on ? " ghost" : "") + '" data-act="kdToggle">' + (on ? "Turn the Kingdom off" : "\u{1F30A} Turn the Kingdom on") + "</button></div>";
  if (on && inn.length) h += '<p class="small"><b>In the Kingdom this week:</b> ' + inn.map(s => esc(s.name) + " (\u{1F9F0} " + treasureCount(s) + ")").join(", ") + "</p>";
  return h + "</div>";
}
