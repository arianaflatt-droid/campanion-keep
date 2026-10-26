/* ---------- 🎉 Party Time ----------
   🎈 60 XP Party: Ms. Ariana taps Start; it ends by itself after 10 minutes (cls.party60 = { id, end }).
      Everyone at 60+ XP today gets an invitation and walks onto a live dance floor with everyone else's companion
      (each wearing a random paper party hat, only at the party). Students under 60 can peek through the window and
      come in as soon as a paste puts them at 60.
      Dance buttons (everyone sees the moves) + one Balloon Drop each: balloons fall for 20 seconds, tap them and your
      companion jumps up to pop them (white = 1 point, gold = 3, rainbow = 5).
      Party favor when it ends: 0–4 points = +10 Comfort Points, 5–9 = Lucky Egg charm or +20 Comfort Points, 10+ = an egg.
   🎊 120 XP VIP Party: Ms. Ariana turns it on and it stays open until she turns it off (cls.party120 = { id, on, hp }), so students who reach 120 later can still come in.
      Gold VIP ticket, red carpet entrance, VIP lounge, crowns, an extra 🕺 Moonwalk.
      Piñata: one class health bar, unlimited hits; when it breaks candy rains and everyone who hit it gets a little of
      the event currency (Comfort Points when no event is on). Spotlight Solo (15 seconds each, one at a time, others cheer).
      Group photo goes into each student's Party Album.
      VIP favor when it ends: a Mystery Box (egg 40%, 2 eggs 25%, Sparkle Charm 20%, Rare egg 15%) + a random VIP card
      background for today + the paper hat worn for the rest of the day (vipDay, see game.js).
   Saved on the student:
      pty60 / pty120 = { id, in, hat, mv, mn, pops, drop, solo, ch: { k, n }, hits }   (live party state; others read it)
      partyGot = { partyId: true, partyId + "-p": true }   partyAlbum = [ { id, d, who: [{ id, n, p }] } ]   vipDay
   Party music is made in the browser (no sound files); it only starts when someone taps 🎵. */
import { esc, goalXP, companionOf, petHTML, wornItem, simulate, eventMode, seasonOf, hatHTML, randomHat, onPet, vipToday, partyHat, partyCrown, headFree } from "./game.js?v=20261026a";
import { azToday } from "./collect.js?v=20261026a";
import { heldWeapon } from "./quest.js?v=20261026a";
import { tricksFor } from "./bond.js?v=20261026a";

export const PARTY_MIN = 10, PARTY_XP = 60;
const DROP_MS = 20000, SOLO_MS = 15000, A = "assets/party/";
const today = () => azToday();
const xpOn = st => { const h = ((st && st.xpHist) || {})[today()] || {}; return Math.max(Number(h.d) || 0, Number(h.l) || 0, Number(h.mo) || 0); };
const lh = st => !!((((st && st.xpHist) || {})[today()] || {}).lh);
export const isGuest = st => lh(st) || xpOn(st) >= PARTY_XP;
export const isVIP = (st, cls) => lh(st) || xpOn(st) >= goalXP(cls);
export const p60On = cls => !!(cls && cls.party60 && Date.now() < Number(cls.party60.end));
export const p120On = cls => !!(cls && cls.party120 && (cls.party120.on != null ? cls.party120.on : cls.party120.end && Date.now() < Number(cls.party120.end)));
// The countdown text: the 60 XP Party shows time left, the VIP Party is open until Ms. Ariana closes it
const timeTxt = (k, cls) => (k === "120" ? "open" : mmss(leftS(k, cls)) + " left");
const P = (k, cls) => (cls && (k === "60" ? cls.party60 : cls.party120)) || null;
const isOn = (k, cls) => (k === "60" ? p60On(cls) : p120On(cls));
const F = k => "pty" + k;
const mine = (st, k, cls) => { const p = P(k, cls), x = st && st[F(k)]; return p && x && x.id === p.id ? x : null; };
const kids = students => (students || []).filter(s => s && s.companionId && !s.isTeacher);
const guestsOf = (students, k, cls) => kids(students).filter(s => { const x = mine(s, k, cls); return x && x.in; });
const got = (st, key) => !!(((st && st.partyGot) || {})[key]);
const leftS = (k, cls) => { const p = P(k, cls); return p ? Math.max(0, Math.ceil((Number(p.end) - Date.now()) / 1000)) : 0; };
const mmss = s => Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
const canEnter = (st, k, cls) => (k === "60" ? isGuest(st) : isVIP(st, cls));
const petName = s => s.petName || (companionOf(s) || {}).name || "";

/* ---------- moves ---------- */
const MOVES = [["wave", "\u{1F44B}", "Wave"], ["spin", "\u{1F300}", "Spin"], ["jump", "\u{1F998}", "Jump"], ["wiggle", "\u{1F483}", "Wiggle"]];
const FLIP = ["flip", "\u{1F938}", "Flip"], MOON = ["moon", "\u{1F57A}", "Moonwalk"];
const movesFor = (st, k) => MOVES.concat(tricksFor(st).some(t => t.id === "flip") ? [FLIP] : []).concat(k === "120" ? [MOON] : []);

/* ---------- favors ---------- */
const addN = (s, d, f, n) => { d[f] = (d[f] != null ? d[f] : Number(s[f]) || 0) + n; };
const addBoost = (s, d, f) => { const e = Object.assign({}, d.eggBoost || s.eggBoost || {}); e[f] = (Number(e[f]) || 0) + 1; d.eggBoost = e; };
function favor60(pts) {
  if (pts >= 10) return { img: "\u{1F95A}", text: "an egg!", apply: (s, d) => addN(s, d, "doorEggs", 1) };
  if (pts >= 5) return Math.random() < 0.5 ? { img: "\u{1F340}", text: "a Lucky Egg charm (your next egg is at least Uncommon)", apply: (s, d) => addBoost(s, d, "lucky") }
    : { img: "⭐", text: "+20 Comfort Points", apply: (s, d) => addN(s, d, "cpBonus", 20) };
  return { img: "⭐", text: "+10 Comfort Points", apply: (s, d) => addN(s, d, "cpBonus", 10) };
}
const BOX = [
  [40, "\u{1F95A}", "an egg!", (s, d) => addN(s, d, "doorEggs", 1)],
  [25, "\u{1F95A}\u{1F95A}", "2 eggs!", (s, d) => addN(s, d, "doorEggs", 2)],
  [20, "✨", "a Sparkle Charm (your next egg has a 5% Sparkle chance)", (s, d) => addBoost(s, d, "sparkle")],
  [15, "\u{1F48E}", "a Rare egg! (it hatches at least a Rare)", (s, d) => { addN(s, d, "doorEggs", 1); addBoost(s, d, "rare"); }]
];
const roll = list => { let r = Math.random() * list.reduce((n, x) => n + x[0], 0); for (const x of list) { if ((r -= x[0]) < 0) return x; } return list[0]; };
const pinataPrize = cls => (eventMode(cls) ? { n: 30, text: "+30 " + seasonOf(cls).cur + " " + seasonOf(cls).coin, f: "candyBonus" } : { n: 15, text: "+15 Comfort Points ⭐", f: "cpBonus" });
// A favor waiting to be opened (the party is over and this student was in it)
function pendingFavor(st, cls) {
  for (const k of ["120", "60"]) { const p = P(k, cls), x = mine(st, k, cls); if (p && x && x.in && (!isOn(k, cls) || (k === "120" && x.left)) && !got(st, p.id)) return k; }
  return null;
}

/* ---------- student card (My Companion) ---------- */
export function partyCards(st, cls) {
  let h = "";
  ["120", "60"].forEach(k => {
    if (!isOn(k, cls)) return;
    const ok = canEnter(st, k, cls), x = mine(st, k, cls), goal = k === "60" ? PARTY_XP : goalXP(cls), vip = k === "120";
    if (vip && x && (x.left || got(st, P(k, cls).id))) { h += '<div class="card pcard p120"><img class="pcardimg" src="' + A + 'mystery-box-open.webp" alt=""><div class="ptxt"><h3>\u{1F451} VIP Party</h3><p>✅ You partied in the VIP Lounge and got your prize! See you at the next one.</p></div></div>'; return; }
    h += '<div class="card pcard p' + k + '"><img class="pcardimg" src="' + A + (vip ? "vip-ticket.webp" : "invitation.webp") + '" alt=""><div class="ptxt"><h3>' +
      (vip ? "\u{1F38A} VIP Party!" : "\u{1F388} 60 XP Party!") + ' <span class="pcount" data-pcount="' + k + '">' + timeTxt(k, cls) + "</span></h3>" +
      (ok ? "<p>" + (vip ? "\u{1F451} You hit " + goal + " XP — you’re a VIP! Walk the red carpet into the VIP Lounge." : "\u{1F48C} You’re invited! Everyone’s companions are on the dance floor.") + "</p>" +
          '<button class="btn gold" data-party="open' + k + '">' + (x && x.in ? "\u{1F483} Back to the party" : vip ? "\u{1F39F}️ Use my VIP ticket" : "\u{1F389} Go to the party") + "</button>"
        : "<p>Hit <b>" + goal + " XP</b> to get in! You have <b>" + xpOn(st) + "</b> so far (it counts at Ms. Ariana’s next XP check).</p>" +
          '<button class="btn ghost" data-party="open' + k + '">\u{1F440} Peek through the window</button>') +
      "</div></div>";
  });
  const al = (st.partyAlbum || []).length;
  if (al) h += '<div class="palbumrow"><button class="btn ghost small" data-party="album">\u{1F4D6} My Party Album (' + al + " photo" + (al === 1 ? "" : "s") + ")</button></div>";
  return h;
}

/* ---------- overlays on the normal page: favors + album ---------- */
let G = null;          // { kind: "favor60"|"box", phase, prize, saved } or { kind: "album" }
let ROOM = null;       // { k, watch, teacher }
let lastFav = false;
export const partyBusy = () => !!ROOM || !!G || lastFav;
export function partyOverlay(st, cls) {
  lastFav = false;
  if (G && G.kind === "album") return albumHTML(st);
  if (!st || !cls || ROOM) return "";
  const k = pendingFavor(st, cls);
  if (!k && !(G && G.saved)) return "";
  lastFav = true;
  const x = (k && mine(st, k, cls)) || {};
  if (!G || (G.k && k && G.k !== k && !G.saved)) G = { kind: k === "120" ? "box" : "favor60", k, phase: "closed" };
  let h = '<div class="qbover pover' + (G.kind === "box" ? " pv" : "") + '"><div class="qbpanel pgame">';
  if (G.kind === "favor60") {
    h += "<h3>\u{1F388} The party’s over — here’s your party favor!</h3><p>You got <b>" + (Number(x.pops) || G.pts || 0) + "</b> balloon point" + ((Number(x.pops) || G.pts) === 1 ? "" : "s") + ".</p>";
    h += G.phase === "closed" ? '<button class="pfavor" data-party="favor"><img src="' + A + 'favor-bag.webp" alt="Party favor bag"></button><p class="small">Tap the bag to open it!</p>'
      : '<img class="pfavor open" src="' + A + 'favor-bag.webp" alt=""><div class="pprizebig"><span>' + G.prize.img + "</span> You got " + esc(G.prize.text) + "</div>" +
        (G.saved ? '<button class="btn big" data-party="ok">Yay! \u{1F389}</button>' : '<p class="muted">Saving…</p>');
  } else {
    h += "<h3>\u{1F451} VIP favor!</h3>";
    h += G.phase === "closed" ? '<button class="pfavor shake" data-party="favor"><img src="' + A + 'mystery-box.webp" alt="Mystery Box"></button><p class="small">Tap the Mystery Box to open it!</p>'
      : '<img class="pfavor open" src="' + A + 'mystery-box-open.webp" alt=""><div class="pprizebig"><span>' + G.prize[1] + "</span> You got " + esc(G.prize[2]) + "</div>" +
        '<p>\u{1F3A8} Plus a <b>VIP card background</b> for today and your <b>party hat</b> to wear for the rest of the day!</p>' +
        (G.saved ? '<button class="btn big" data-party="ok">\u{1F451} Yay!</button>' : '<p class="muted">Saving…</p>');
  }
  return h + "</div></div>";
}
function albumHTML(st) {
  const list = (st && st.partyAlbum || []).slice().reverse(), all = LAST ? LAST.students : [];
  return '<div class="qbover pover pv"><div class="qbpanel pgame palbum"><div class="qbtop"><h3>\u{1F4D6} My Party Album</h3><button class="btn ghost small" data-party="ok">Close</button></div>' +
    (list.length ? '<div class="palbgrid">' + list.map(ph => photoHTML(ph, all, true)).join("") + "</div>" : "<p>No photos yet! Take a group photo at a VIP Party.</p>") + "</div></div>";
}
function photoHTML(ph, all, small) {
  const d = new Date(ph.d + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  return '<div class="pphoto' + (small ? " sm" : "") + '"><img class="pframe" src="' + A + 'photo-frame.webp" alt=""><div class="pphin"><div class="pphpets">' + (ph.who || []).map(w => {
    const s = (all || []).find(x => x.id === w.id), c = s && companionOf(s);
    return '<span class="pphpet">' + (c ? onPet(petHTML(c), partyCrown(c)) : "\u{1F43E}") + "<small>" + esc(w.p || "") + "</small></span>"; }).join("") +
    '</div><div class="pphdate">\u{1F38A} VIP Party · ' + esc(d) + "</div></div></div>";
}

/* ---------- the party room (a layer on top of the page that stays put between redraws) ---------- */
let LAST = null;       // the latest context from partySync: { me, cls, students, patch, render, flash, teacher }
let seen = null;       // what this screen already showed: { in: {}, mn: {}, pops: {}, drop: {}, hits: {} }
let mineLocal = null;  // my own numbers not saved yet: { pops, hits, cheer, flushT }
let dropTimer = null, dropUntil = 0, announceQ = [], announcing = false, entering = 0;
const roomEl = () => document.getElementById("partyRoom");

export function partySync(ctx) {
  LAST = ctx;
  claimPinata();
  const el = roomEl();
  if (!ROOM) { if (el) el.remove(); return; }
  const { cls, students } = ctx;
  if (!isOn(ROOM.k, cls)) { closeRoom(); if (ctx.render) setTimeout(() => ctx.render(true), 30); return; }
  const me = ctx.me, k = ROOM.k;
  if (me && ROOM.watch && !ROOM.teacher && canEnter(me, k, cls)) { enter(ctx, k); return; }   // a paste just let them in
  if (!el || el.dataset.k !== k + (ROOM.watch ? "w" : "")) build();
  update();
}
function closeRoom() {
  ROOM = null; clearInterval(dropTimer); dropTimer = null; flush(true); seen = null;
  const el = roomEl(); if (el) el.remove(); stopMusic();
}
function build() {
  const old = roomEl(); if (old) old.remove();
  const k = ROOM.k, vip = k === "120", el = document.createElement("div");
  el.id = "partyRoom"; el.dataset.k = k + (ROOM.watch ? "w" : "");
  el.className = "proom p" + k + (ROOM.watch ? " watch" : "") + (ROOM.teacher ? " teach" : "");
  el.innerHTML = '<div class="pbg" style="background-image:url(' + A + (vip ? "party-vip.webp" : "party-floor.webp") + ')"></div>' +
    '<div class="ptop"><b class="ptitle">' + (vip ? "\u{1F451} VIP Lounge" : "\u{1F388} 60 XP Party") + '</b><span class="ptime" data-pcount="' + k + '"></span><span class="pnum"></span>' +
    musicBtn() + '<button class="btn ghost small" data-party="close">' + (ROOM.teacher || ROOM.watch ? "✕ Close" : ROOM.k === "120" ? "\u{1F381} Leave & get my prize" : "\u{1F6AA} Leave") + "</button></div>" +
    '<div class="pannounce" aria-live="polite"></div>' +
    (vip ? '<div class="ppin"><div class="php"><span></span><b></b></div><button class="ppinbtn" data-party="hit" aria-label="Hit the piñata"><img src="' + A + 'pinata.webp" alt=""></button><div class="phits"></div></div>' : "") +
    '<div class="psolo"></div><div class="pfloor"></div><div class="pdrop"></div><div class="pctl"></div><div class="pmodal"></div>';
  document.body.appendChild(el);
  seen = { in: {}, mn: {}, pops: {}, drop: {}, hits: {}, sig: {} };
  guestsOf(LAST.students, k, LAST.cls).forEach(s => { const x = mine(s, k, LAST.cls); seen.in[s.id] = x.in; seen.mn[s.id] = x.mn; seen.pops[s.id] = x.pops; seen.drop[s.id] = x.drop; seen.hits[s.id] = x.hits; });
  if (!mineLocal) mineLocal = { pops: 0, hits: 0, cheer: 0 };
}
function guestInner(s, k, cls) {
  const c = companionOf(s), x = mine(s, k, cls) || {};
  let pet = petHTML(c, headFree(wornItem(s, simulate(s, cls))), heldWeapon(s));
  pet = onPet(pet, k === "120" ? partyCrown(c) : partyHat(c, x.hat));
  return '<div class="pgbody">' + pet + '</div><div class="pgname"><b>' + esc(petName(s)) + "</b><small>" + esc(s.name || "") + '</small></div><span class="pgscore"></span>';
}
function update() {
  const el = roomEl(); if (!el || !LAST) return;
  const { cls, students, me } = LAST, k = ROOM.k, vip = k === "120";
  const list = guestsOf(students, k, cls), floor = el.querySelector(".pfloor");
  el.querySelector(".pnum").textContent = list.length + (vip ? " VIP" + (list.length === 1 ? "" : "s") : " guest" + (list.length === 1 ? "" : "s"));
  el.querySelectorAll("[data-pcount]").forEach(t => { t.textContent = timeTxt(k, cls); });
  floor.style.setProperty("--gs", list.length <= 6 ? "1" : list.length <= 12 ? ".8" : list.length <= 20 ? ".66" : ".56");
  const ids = new Set(list.map(s => s.id));
  floor.querySelectorAll(".pguest").forEach(g => { if (!ids.has(g.dataset.g)) g.remove(); });
  list.forEach((s, i) => {
    const x = mine(s, k, cls) || {}, c = companionOf(s) || {}, sig = [c.id, c.fam, s.equipped, x.hat, s.petName].join("|");
    let g = floor.querySelector('.pguest[data-g="' + s.id + '"]');
    if (!g) { g = document.createElement("div"); g.className = "pguest" + (me && s.id === me.id ? " me" : ""); g.dataset.g = s.id; g.style.setProperty("--d", (i % 5) * 0.13 + "s"); floor.appendChild(g); }
    if (seen.sig[s.id] !== sig) { g.innerHTML = guestInner(s, k, cls); seen.sig[s.id] = sig; }
    const isMe = me && s.id === me.id;
    // someone new arrived
    if (x.in && seen.in[s.id] !== x.in) { seen.in[s.id] = x.in; announce((vip ? "\u{1F31F} VIP arriving… " : "\u{1F4E3} Now arriving… ") + petName(s) + " with " + (s.name || "") + "!"); g.classList.add("arrive"); setTimeout(() => g.classList.remove("arrive"), 1800); }
    // a dance move
    if (!isMe && x.mn != null && seen.mn[s.id] !== x.mn) { seen.mn[s.id] = x.mn; if (x.mv) dance(g, x.mv); }
    // balloon pops
    const pops = Number(x.pops) || 0, before = Number(seen.pops[s.id]) || 0;
    if (!isMe && pops > before) { floatText(g, "\u{1F388}+" + (pops - before)); dance(g, "jump"); }
    seen.pops[s.id] = Math.max(pops, before);
    if (!isMe && x.drop && seen.drop[s.id] !== x.drop) { seen.drop[s.id] = x.drop; if (Math.abs(Date.now() - x.drop) < DROP_MS + 5000) fakeDrop(); }
    const sc = g.querySelector(".pgscore"), shown = isMe ? Math.max(pops, mineLocal.pops) : pops;
    if (sc) sc.textContent = !vip && (shown || x.drop) ? "\u{1F388} " + shown : "";
    // piñata hits (who's hitting)
    if (vip) { const hits = Number(x.hits) || 0; if (!isMe && hits > (Number(seen.hits[s.id]) || 0)) pinHitBy(s); seen.hits[s.id] = hits; }
  });
  if (vip) { updatePinata(); updateSolo(); }
  updateControls();
  if (ROOM.invite && me) { ROOM.invite = false; modal(inviteHTML(me, k)); }
}
function updateControls() {
  const el = roomEl(); if (!el || !ROOM || !LAST) return;
  const { cls, me } = LAST, k = ROOM.k, vip = k === "120", ctl = el.querySelector(".pctl");
  let h;
  if (ROOM.teacher) h = '<div class="pmsg">\u{1F4FA} Party screen · everyone’s moves show up here live.</div>';
  else if (ROOM.watch) h = '<div class="pmsg">\u{1F440} You’re peeking through the window! Hit <b>' + (vip ? goalXP(cls) : PARTY_XP) + " XP</b> to come in — you have <b>" + xpOn(me) + "</b>. You’ll get in after Ms. Ariana’s next XP check.</div>";
  else {
    const x = mine(me, k, cls) || {};
    h = '<div class="pmoves">' + movesFor(me, k).map(m => '<button class="btn pmv" data-party="mv" data-mv="' + m[0] + '">' + m[1] + " " + m[2] + "</button>").join("") + "</div>";
    if (!vip) {
      const live = dropUntil > Date.now();
      h += '<div class="pextras">' + (live ? '<span class="pmsg">\u{1F388} Tap the balloons! <b data-dropleft="1">' + Math.ceil((dropUntil - Date.now()) / 1000) + "</b>s</span>"
        : x.drop ? '<span class="pmsg">✅ Balloon Drop done: <b>' + Math.max(Number(x.pops) || 0, mineLocal.pops) + '</b> points. Your party favor comes when the party ends!</span>'
        : '<button class="btn gold" data-party="drop">\u{1F388} Drop the balloons!</button>') + "</div>";
    } else {
      const solo = activeSolo();
      h += '<div class="pextras">' +
        (solo && solo.s.id !== me.id ? '<button class="btn gold" data-party="cheer">\u{1F44F} Cheer for ' + esc(petName(solo.s)) + "!</button>" : "") +
        (!x.solo && !solo ? '<button class="btn gold" data-party="solo">\u{1F3A4} Spotlight Solo</button>' : x.solo && !solo ? '<span class="pmsg small">✅ You had your solo!</span>' : "") +
        '<button class="btn ghost" data-party="photo">\u{1F4F8} Group photo</button><button class="btn ghost" data-party="album">\u{1F4D6} Album</button></div>';
    }
  }
  if (ctl.dataset.h !== h) { ctl.innerHTML = h; ctl.dataset.h = h; }
}
function inviteHTML(me, k) {
  return k === "120" ? '<div class="pcarpet"><img class="pcarpetimg" src="' + A + 'red-carpet.webp" alt=""><div class="pwalker">' + onPet(petHTML(companionOf(me)), partyCrown(companionOf(me))) + '</div><span class="pflash f1"></span><span class="pflash f2"></span><span class="pflash f3"></span>' +
      '<h2>\u{1F39F}️ ' + esc(petName(me)) + " is walking the red carpet!</h2></div>"
    : '<div class="pinvite"><img src="' + A + 'invitation.webp" alt=""><div class="pinvtxt"><h2>You’re invited!</h2><p>' + esc(petName(me)) + " is going to the <b>60 XP Party</b>!</p>" + onPet(petHTML(companionOf(me)), partyHat(companionOf(me), (mine(me, "60", LAST.cls) || {}).hat)) + "</div></div>";
}
function modal(h, ms) {
  const m = roomEl() && roomEl().querySelector(".pmodal"); if (!m) return;
  m.innerHTML = '<div class="pmbox">' + h + "</div>"; m.classList.add("on");
  clearTimeout(modal.t); if (ms !== 0) modal.t = setTimeout(() => { m.classList.remove("on"); m.innerHTML = ""; }, ms || 3400);
}
function announce(t) { announceQ.push(t); if (!announcing) nextAnnounce(); }
function nextAnnounce() {
  const el = roomEl(), a = el && el.querySelector(".pannounce");
  if (!a || !announceQ.length) { announcing = false; return; }
  announcing = true; a.textContent = announceQ.shift(); a.classList.remove("on"); void a.offsetWidth; a.classList.add("on");
  setTimeout(nextAnnounce, 2300);
}
function dance(g, mv) {
  const b = g && g.querySelector(".pgbody"); if (!b) return;
  b.className = "pgbody"; void b.offsetWidth; b.classList.add("dm-" + mv);
  clearTimeout(b._t); b._t = setTimeout(() => { b.className = "pgbody"; }, 1500);
}
function floatText(g, t) {
  const r = g.getBoundingClientRect(), p = document.createElement("span");
  p.className = "pfloat"; p.textContent = t; p.style.left = (r.left + r.width / 2) + "px"; p.style.top = (r.top + 10) + "px";
  (roomEl() || document.body).appendChild(p); setTimeout(() => p.remove(), 1400);
}
const myGuest = () => LAST && LAST.me && roomEl() && roomEl().querySelector('.pguest[data-g="' + LAST.me.id + '"]');

/* ---------- my own saves (bundled so 25 kids don't flood the database) ---------- */
function save(part) {
  const { me, cls } = LAST, k = ROOM.k, x = Object.assign({}, mine(me, k, cls) || { id: P(k, cls).id }, part);
  return LAST.patch({ [F(k)]: x }, true);
}
function flush(now) {
  if (!mineLocal || !LAST || !LAST.me || !ROOM) return;
  const doIt = () => {
    mineLocal.flushT = null; if (!ROOM || !LAST.me) return;
    const x = mine(LAST.me, ROOM.k, LAST.cls); if (!x) return;
    const part = {};
    if (mineLocal.pops > (Number(x.pops) || 0)) part.pops = mineLocal.pops;
    if (mineLocal.hits > (Number(x.hits) || 0)) part.hits = mineLocal.hits;
    if (mineLocal.cheerK && (!x.ch || x.ch.k !== mineLocal.cheerK || x.ch.n < mineLocal.cheer)) part.ch = { k: mineLocal.cheerK, n: mineLocal.cheer };
    if (Object.keys(part).length) save(part);
  };
  if (now) { clearTimeout(mineLocal.flushT); doIt(); return; }
  if (!mineLocal.flushT) mineLocal.flushT = setTimeout(doIt, 1100);
}

/* ---------- 🎈 Balloon Drop ---------- */
function startDrop() {
  dropUntil = Date.now() + DROP_MS; mineLocal.pops = Math.max(mineLocal.pops, Number((mine(LAST.me, "60", LAST.cls) || {}).pops) || 0);
  clearInterval(dropTimer);
  dropTimer = setInterval(() => {
    const el = roomEl(); if (!el) { clearInterval(dropTimer); return; }
    const left = dropUntil - Date.now(), t = el.querySelector("[data-dropleft]");
    if (t) t.textContent = Math.max(0, Math.ceil(left / 1000));
    if (left <= 0) { clearInterval(dropTimer); dropTimer = null; flush(true); setTimeout(updateControls, 50); return; }
    spawnBalloon(true);
  }, 420);
}
function spawnBalloon(real) {
  const layer = roomEl() && roomEl().querySelector(".pdrop"); if (!layer) return;
  const r = Math.random(), v = r < 0.05 ? 5 : r < 0.17 ? 3 : 1, b = document.createElement(real ? "button" : "span");
  b.className = "pball" + (real ? "" : " fake") + (v === 5 ? " rainbow" : v === 3 ? " gold" : "");
  if (real) { b.dataset.party = "pop"; b.dataset.v = v; b.setAttribute("aria-label", "Pop the balloon"); }
  b.style.left = (4 + Math.random() * 86) + "%"; b.style.animationDuration = (3.4 + Math.random() * 2.4) + "s";
  b.innerHTML = v === 5 ? '<img src="' + A + 'balloon-rainbow.webp" alt="">' : v === 3 ? '<img src="' + A + 'balloon-gold.webp" alt="">'
    : '<img src="' + A + 'balloon.webp" alt=""><i style="background:hsl(' + Math.floor(Math.random() * 360) + ',85%,60%)"></i>';
  b.addEventListener("animationend", () => b.remove());
  layer.appendChild(b);
}
function fakeDrop() { for (let i = 0; i < 7; i++) setTimeout(() => spawnBalloon(false), i * 260); }
function popBalloon(b) {
  const v = Number(b.dataset.v) || 1, r = b.getBoundingClientRect(); b.remove();
  mineLocal.pops += v; boop(v);
  // my companion jumps up to the balloon
  const g = myGuest(), room = roomEl();
  if (g && room) {
    const j = document.createElement("div"), gr = g.getBoundingClientRect();
    j.className = "pjumper"; j.innerHTML = g.querySelector(".pgbody").innerHTML;
    j.style.left = (r.left + r.width / 2) + "px"; j.style.top = (r.top + r.height / 2) + "px";
    j.style.setProperty("--fy", Math.max(80, gr.top - r.top) + "px");
    room.appendChild(j); setTimeout(() => j.remove(), 700);
  }
  if (!room) return;
  const p = document.createElement("span"); p.className = "pfloat big"; p.textContent = (v === 5 ? "\u{1F308}" : v === 3 ? "\u{1F31F}" : "\u{1F4A5}") + "+" + v;
  p.style.left = (r.left + r.width / 2) + "px"; p.style.top = r.top + "px"; room.appendChild(p); setTimeout(() => p.remove(), 1300);
  const sc = g && g.querySelector(".pgscore"); if (sc) sc.textContent = "\u{1F388} " + mineLocal.pops;
  flush();
}

/* ---------- 🪅 Piñata ---------- */
const pinHP = cls => Number((cls.party120 || {}).hp) || 200;
function pinTotal() {
  const { students, cls, me } = LAST;
  const loc = ROOM && ROOM.k === "120" && mineLocal ? mineLocal.hits : 0;
  return guestsOf(students, "120", cls).reduce((n, s) => n + (me && s.id === me.id ? Math.max(Number((mine(s, "120", cls) || {}).hits) || 0, loc) : Number((mine(s, "120", cls) || {}).hits) || 0), 0);
}
function updatePinata() {
  const el = roomEl(), box = el && el.querySelector(".ppin"); if (!box) return;
  const hp = pinHP(LAST.cls), t = Math.min(hp, pinTotal()), broken = t >= hp;
  box.querySelector(".php span").style.width = ((hp - t) / hp * 100) + "%";
  box.querySelector(".php b").textContent = broken ? "\u{1F389} BROKEN!" : "\u{1FA85} " + (hp - t) + " / " + hp;
  if (broken && !box.classList.contains("broken")) {
    box.classList.add("broken"); box.querySelector(".ppinbtn img").src = A + "pinata-broken.webp";
    candyRain(); claimPinata();
  }
  if (broken) {
    const who = guestsOf(LAST.students, "120", LAST.cls).filter(s => Number((mine(s, "120", LAST.cls) || {}).hits) > 0).map(s => s.name);
    box.querySelector(".phits").textContent = who.length ? "Smashed by: " + who.join(", ") : "";
  }
}
function pinHitBy(s) {
  const box = roomEl() && roomEl().querySelector(".ppin"); if (!box || box.classList.contains("broken")) return;
  const p = document.createElement("span"); p.className = "pwho"; p.textContent = "\u{1F4A5} " + (s.name || "");
  p.style.left = (15 + Math.random() * 70) + "%"; box.appendChild(p); setTimeout(() => p.remove(), 1300);
  const b = box.querySelector(".ppinbtn"); b.classList.remove("hit"); void b.offsetWidth; b.classList.add("hit");
}
function candyRain() {
  const room = roomEl(); if (!room) return;
  const c = ["\u{1F36C}", "\u{1F36D}", "\u{1F36B}", "\u{1F389}", "\u{1F381}", "\u{1F36C}"];
  for (let i = 0; i < 40; i++) setTimeout(() => {
    const p = document.createElement("span"); p.className = "pcandyfall"; p.textContent = c[i % c.length];
    p.style.left = (Math.random() * 96) + "%"; p.style.animationDuration = (1.8 + Math.random() * 1.6) + "s";
    room.appendChild(p); setTimeout(() => p.remove(), 3600);
  }, i * 70);
  boop(5);
}
// Everyone who hit the piñata gets the candy once it breaks (even if they left the lounge before it broke)
let claiming = false;
async function claimPinata() {
  if (!LAST) return;
  const { me, cls } = LAST; if (!me || !LAST.patch || claiming || !cls || !cls.party120 || !cls.party120.id) return;
  const p = cls.party120, key = p.id + "-p", x = mine(me, "120", cls) || {}, myHits = Math.max(Number(x.hits) || 0, ROOM && ROOM.k === "120" && mineLocal ? mineLocal.hits : 0);
  if (got(me, key) || myHits <= 0 || pinTotal() < pinHP(cls)) return;
  claiming = true;
  const pr = pinataPrize(cls), data = { partyGot: Object.assign({}, me.partyGot || {}, { [key]: true }) }; addN(me, data, pr.f, pr.n);
  if (myHits > (Number(x.hits) || 0)) data[F("120")] = Object.assign({}, x, { hits: myHits });
  try { await LAST.patch(data, true); } finally { claiming = false; }
  if (roomEl()) announce("\u{1F36C} Candy rain! You helped break it: " + pr.text + "!");
  else if (LAST.flash) LAST.flash("\u{1FA85} The VIP piñata broke! You helped: " + pr.text + "!", true);
}

/* ---------- 🎤 Spotlight Solo ---------- */
function activeSolo() {
  const { students, cls } = LAST, now = Date.now();
  const on = guestsOf(students, "120", cls).map(s => ({ s, t: Number((mine(s, "120", cls) || {}).solo) || 0 })).filter(o => o.t && now - o.t < SOLO_MS && o.t - now < 5000);
  return on.sort((a, b) => a.t - b.t)[0] || null;
}
function cheersFor(solo) {
  const key = solo.s.id + ":" + solo.t, { students, cls, me } = LAST;
  return guestsOf(students, "120", cls).reduce((n, s) => { const ch = (mine(s, "120", cls) || {}).ch;
    const v = ch && ch.k === key ? Number(ch.n) || 0 : 0; return n + (me && s.id === me.id && mineLocal.cheerK === key ? Math.max(v, mineLocal.cheer) : v); }, 0);
}
let soloTick = null;
function updateSolo() {
  const el = roomEl(), box = el && el.querySelector(".psolo"); if (!box) return;
  const solo = activeSolo();
  if (!solo) { if (box.dataset.k) { box.innerHTML = ""; box.dataset.k = ""; el.classList.remove("solo"); } clearInterval(soloTick); soloTick = null; return; }
  const key = solo.s.id + ":" + solo.t;
  if (box.dataset.k !== key) {
    box.dataset.k = key; el.classList.add("solo");
    box.innerHTML = '<div class="pbeam"></div><div class="psolopet">' + onPet(petHTML(companionOf(solo.s), headFree(wornItem(solo.s, simulate(solo.s, LAST.cls)))), partyCrown(companionOf(solo.s))) + "</div>" +
      '<div class="psoloname">\u{1F3A4} ' + esc(petName(solo.s)) + "’s Spotlight Solo! <span data-solol></span></div><div class=\"pcheers\"></div>";
    clearInterval(soloTick); soloTick = setInterval(() => { if (!roomEl() || !activeSolo()) { clearInterval(soloTick); soloTick = null; if (roomEl()) { updateSolo(); updateControls(); } return; } paintSolo(); }, 500);
  }
  paintSolo();
}
function paintSolo() {
  const box = roomEl() && roomEl().querySelector(".psolo"), solo = activeSolo(); if (!box || !solo) return;
  const l = box.querySelector("[data-solol]"), c = box.querySelector(".pcheers"), n = cheersFor(solo);
  if (l) l.textContent = Math.max(0, Math.ceil((SOLO_MS - (Date.now() - solo.t)) / 1000)) + "s";
  if (c && c.dataset.n !== String(n)) { c.dataset.n = n; c.textContent = n ? "\u{1F44F} " + n + " cheer" + (n === 1 ? "" : "s") + "!" : "Cheer them on! \u{1F44F}"; c.classList.remove("bump"); void c.offsetWidth; c.classList.add("bump"); }
}

/* ---------- clicks ---------- */
let lastMove = 0;
export async function partyClick(el, c) {
  const a = el.dataset.party, s = c.me, cls = c.cls;
  LAST = Object.assign({}, LAST || {}, c);
  if (a === "music") { toggleMusic(); return; }
  if (a === "album") { G = { kind: "album" }; if (ROOM && !ROOM.teacher) closeRoom(); return c.render(true); }
  if (a === "ok") { G = null; return c.render(true); }
  if (a === "open60" || a === "open120" || a === "watch60" || a === "watch120") {
    const k = a.slice(-3) === "120" ? "120" : "60"; if (!isOn(k, cls)) return;
    const teacher = !s || a.startsWith("watch");
    G = null;
    if (!teacher && canEnter(s, k, cls)) return enter(c, k);
    ROOM = { k, watch: true, teacher }; mineLocal = { pops: 0, hits: 0, cheer: 0 };
    partySync(LAST); return;
  }
  if (a === "close") {
    // Leaving the VIP Lounge is for good: the Mystery Box opens now and you can't come back in (saves database reads/writes).
    if (ROOM && ROOM.k === "120" && !ROOM.teacher && !ROOM.watch && s) { const x = mine(s, "120", cls); if (x && x.in && !x.left) { flush(true); await save({ left: Date.now() }); } }
    closeRoom(); return c.render(true);
  }
  if (a === "favor") return openFavor(c);
  if (!ROOM || ROOM.watch || !s) return;
  const k = ROOM.k;
  if (a === "mv") {
    const mv = el.dataset.mv, g = myGuest(); if (g) dance(g, mv);
    if (Date.now() - lastMove < 700) return; lastMove = Date.now();
    const x = mine(s, k, cls) || {}; seen.mn[s.id] = (Number(x.mn) || 0) + 1;
    return save({ mv, mn: seen.mn[s.id] });
  }
  if (a === "drop" && k === "60") { const x = mine(s, k, cls) || {}; if (x.drop || dropUntil > Date.now()) return; seen.drop[s.id] = Date.now(); startDrop(); await save({ drop: seen.drop[s.id] }); updateControls(); return; }
  if (a === "pop") { if (dropUntil > Date.now() - 600) popBalloon(el); return; }
  if (a === "hit" && k === "120") {
    if (pinTotal() >= pinHP(cls)) return;
    mineLocal.hits++; boop(1); const b = el; b.classList.remove("hit"); void b.offsetWidth; b.classList.add("hit");
    const p = document.createElement("span"); p.className = "pwho mine"; p.textContent = "\u{1F4A5}"; p.style.left = (25 + Math.random() * 50) + "%"; el.parentNode.appendChild(p); setTimeout(() => p.remove(), 900);
    updatePinata(); flush(); return;
  }
  if (a === "solo") { if (activeSolo() || (mine(s, k, cls) || {}).solo) return; await save({ solo: Date.now() }); updateSolo(); updateControls(); return; }
  if (a === "cheer") {
    const solo = activeSolo(); if (!solo || solo.s.id === s.id) return;
    const key = solo.s.id + ":" + solo.t; if (mineLocal.cheerK !== key) { mineLocal.cheerK = key; mineLocal.cheer = 0; }
    mineLocal.cheer++; boop(1); paintSolo(); flush(); return;
  }
  if (a === "photo") {
    const list = guestsOf(c.students, k, cls), ph = { id: P(k, cls).id, d: today(), who: list.map(g => ({ id: g.id, n: g.name || "", p: petName(g) })) };
    const album = (s.partyAlbum || []).filter(x => x.id !== ph.id).concat([ph]).slice(-40);
    modal('<div class="pflashall"></div>' + photoHTML(ph, c.students) + '<p class="pmsg">\u{1F4D6} Saved to your Party Album!</p>', 4200);
    await c.patch({ partyAlbum: album }, true); return;
  }
}
// Walk into the party (writes pty60 / pty120 the first time; the invitation / red carpet shows once)
async function enter(c, k) {
  const s = c.me, x = mine(s, k, c.cls);
  if (k === "120" && x && (x.left || got(s, P(k, c.cls).id))) return;   // already partied and got the prize
  ROOM = { k, watch: false, teacher: false };
  mineLocal = { pops: Number((x || {}).pops) || 0, hits: Number((x || {}).hits) || 0, cheer: 0 };
  if (!x || !x.in) { ROOM.invite = true; await c.patch({ [F(k)]: { id: P(k, c.cls).id, in: Date.now(), hat: randomHat(), mn: 0, pops: 0, hits: 0 } }, true); }
  startMusic();
  if (ROOM) partySync(Object.assign({}, LAST || {}, c));
}
async function openFavor(c) {
  const s = c.me, cls = c.cls; if (!G || G.phase !== "closed") return;
  const k = pendingFavor(s, cls); if (!k) return;
  const p = P(k, cls), x = mine(s, k, cls) || {}, data = { partyGot: Object.assign({}, s.partyGot || {}, { [p.id]: true }) };
  if (k === "60") { G.pts = Number(x.pops) || 0; G.prize = favor60(G.pts); G.prize.apply(s, data); }
  else { G.prize = roll(BOX); G.prize[3](s, data); data.vipDay = { d: today(), bg: 1 + Math.floor(Math.random() * 6), hat: randomHat() }; }
  G.phase = "open"; G.saved = false; boop(5); c.render(true);
  try { await c.patch(data, true); G.saved = true; } catch (e) { G = null; c.flash("That didn’t save — tell Ms. Ariana! (" + (e.code || e.message) + ")"); }
  c.render(true);
}

/* ---------- The Keep: party banner + teacher controls ---------- */
export function partyBanner(students, cls) {
  let h = "";
  ["60", "120"].forEach(k => {
    if (!isOn(k, cls)) return;
    const g = guestsOf(students, k, cls), vip = k === "120";
    h += '<div class="pbanner p' + k + '"><div><b>' + (vip ? "\u{1F451} VIP PARTY!" : "\u{1F388} 60 XP PARTY!") + '</b> <span data-pcount="' + k + '">' + timeTxt(k, cls) + "</span> · " + g.length + (vip ? " in the VIP Lounge" : " on the dance floor") + "</div>" +
      '<div class="pguests">' + g.map(s => "<span>" + (vip ? "\u{1F451} " : "\u{1F483} ") + esc(s.name) + "</span>").join("") + "</div>" +
      '<button class="btn small" data-party="watch' + k + '">\u{1F4FA} Open the party screen</button>' + musicBtn() + "</div>";
  });
  return h;
}
export function partyAdmin(students, cls) {
  const list = kids(students), goal = goalXP(cls);
  const row = (k, title, desc, startAct, stopAct) => {
    const on = isOn(k, cls), g = guestsOf(students, k, cls), elig = list.filter(s => (k === "60" ? isGuest(s) : isVIP(s, cls))).length;
    let stats = "";
    if (on) stats = '<span class="small"><span data-pcount="' + k + '">' + timeTxt(k, cls) + "</span> · " + g.length + " in · " + elig + " can come" +
      (k === "60" ? " · " + g.filter(s => (mine(s, k, cls) || {}).drop).length + " dropped balloons"
        : " · piñata " + Math.max(0, pinHP(cls) - g.reduce((n, s) => n + (Number((mine(s, k, cls) || {}).hits) || 0), 0)) + " / " + pinHP(cls)) + "</span>";
    return '<div class="row" style="gap:8px;flex-wrap:wrap;align-items:center;margin:6px 0;"><b>' + title + "</b>" + (on
      ? stats + '<button class="btn small" data-party="watch' + k + '">\u{1F4FA} Party screen</button><button class="btn ghost small" data-act="' + stopAct + '">' + (k === "120" ? "Turn off" : "End early") + "</button>"
      : '<span class="small muted">' + desc + " (" + elig + " can come right now)</span><button class=\"btn small\" data-act=\"" + startAct + '">Start</button>') + "</div>";
  };
  return '<div class="card"><div class="card-head"><h2>\u{1F389} Party Time</h2><span class="fact">60 XP: 10 minutes · VIP: until you turn it off</span></div>' +
    row("60", "\u{1F388} 60 XP Party", "Dance floor + Balloon Drop for everyone at 60+ XP. Favor when it ends.", "party60Start", "party60Stop") +
    row("120", "\u{1F451} " + goal + " XP VIP Party", "VIP Lounge, piñata, Spotlight Solos, group photo for everyone at " + goal + " XP. Mystery Box + VIP look for the day.", "party120On", "party120Off") +
    '<p class="small muted">The 60 XP Party ends by itself after 10 minutes. The VIP Party stays open until you tap Turn off, so anyone who reaches 120 later can still come in. Favors open when a party ends.</p></div>';
}
export function partyAction(act, cls, students) {
  const n = kids(students).length || 10;
  if (act === "party60Start") return { party60: { id: "p60-" + Date.now(), end: Date.now() + PARTY_MIN * 60000 } };
  if (act === "party60Stop") return cls.party60 ? { "party60.end": Date.now() } : null;
  if (act === "party120On") return { party120: { id: "p120-" + Date.now(), on: true, hp: Math.max(150, n * 15) } };
  if (act === "party120Off") return cls.party120 ? { "party120.on": false, "party120.end": Date.now() } : null;
  return null;
}
// Keeps the countdowns ticking; redraws once when a party ends.
let tick = null;
export function partyTicker(getCls, render) {
  if (tick) return; tick = setInterval(() => {
    const cls = getCls(); if (!cls) return;
    ["60", "120"].forEach(k => {
      const p = P(k, cls); if (!p || !p.end) return;
      const s = leftS(k, cls), els = document.querySelectorAll('[data-pcount="' + k + '"]');
      els.forEach(el => { el.textContent = mmss(s); });
      if (s === 0 && (els.length || (ROOM && ROOM.k === k))) { if (ROOM && ROOM.k === k) closeRoom(); render(true); }
    });
  }, 1000);
}

/* ---------- sounds + party music (Web Audio, no files) ---------- */
let AC = null, loop = null, playing = false, song = 0;
export const musicBtn = () => '<button class="btn ghost small" data-party="music">' + (playing ? "⏸️ Stop music" : "\u{1F3B5} Party music") + "</button>";
const N = { C3: 130.8, F3: 174.6, G3: 196, A3: 220, C4: 261.6, D4: 293.7, E4: 329.6, F4: 349.2, G4: 392, A4: 440, B4: 493.9, C5: 523.3, D5: 587.3, E5: 659.3, F5: 698.5, G5: 784, A5: 880 };
const SONGS = [
  { b: 0.16, tune: ["C5", "E5", "G5", "E5", "D5", "C5", "D5", "E5", "C5", "G4", "A4", "C5", "G4", "E4", "G4", "C5", "F5", "E5", "D5", "C5", "D5", "E5", "G5", "-", "E5", "D5", "C5", "D5", "C5", "-", "C5", "-"], bass: ["C3", "C3", "A3", "A3", "F3", "F3", "G3", "G3"] },
  { b: 0.15, tune: ["A4", "C5", "E5", "A5", "G5", "E5", "D5", "E5", "C5", "-", "C5", "D5", "E5", "-", "G5", "E5", "F5", "E5", "D5", "C5", "D5", "-", "B4", "G4", "A4", "C5", "E5", "D5", "C5", "B4", "A4", "-"], bass: ["A3", "A3", "F3", "F3", "C3", "C3", "G3", "G3"] }
];
let OUT = null;   // all party sounds go through this, so stopping the music silences notes already lined up
const out = () => { if (!OUT) { OUT = AC.createGain(); OUT.connect(AC.destination); } return OUT; };
function tone(f, t, len, type, vol) { const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + len); o.connect(g); g.connect(out()); o.start(t); o.stop(t + len + 0.05); }
function kick(t) { const o = AC.createOscillator(), g = AC.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.15); g.gain.setValueAtTime(0.4, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18); o.connect(g); g.connect(out()); o.start(t); o.stop(t + 0.2); }
function hat(t) { const len = 0.05, buf = AC.createBuffer(1, AC.sampleRate * len, AC.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain(); f.type = "highpass"; f.frequency.value = 6000; g.gain.value = 0.12; s.buffer = buf; s.connect(f); f.connect(g); g.connect(out()); s.start(t); }
function bar() {
  const S = SONGS[song % SONGS.length], b = S.b, t0 = AC.currentTime + 0.05;
  S.tune.forEach((n, i) => { if (n !== "-") tone(N[n], t0 + i * b, b * 0.9, "square", 0.045); });
  S.bass.forEach((n, i) => { for (let j = 0; j < 4; j++) tone(N[n], t0 + (i * 4 + j) * b, b * 0.8, "triangle", 0.14); });
  for (let i = 0; i < S.tune.length; i++) { if (i % 4 === 0) kick(t0 + i * b); if (i % 2 === 1) hat(t0 + i * b); if (i % 8 === 4) tone(200, t0 + i * b, 0.1, "sawtooth", 0.05); }
  return S.tune.length * b;
}
export function startMusic() {
  try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === "suspended") AC.resume(); } catch (e) { return; }
  if (playing) return; playing = true; song = ROOM && ROOM.k === "120" ? 1 : 0;
  if (OUT) { try { OUT.disconnect(); } catch (e) {} } OUT = null;   // a fresh output for this song
  let n = 0; const len = bar(); loop = setInterval(() => { if (!playing) return; if (++n % 4 === 0) song++; bar(); }, len * 1000);
  document.querySelectorAll('[data-party="music"]').forEach(b => { b.textContent = "⏸️ Stop music"; });
}
export function stopMusic() { playing = false; clearInterval(loop); if (OUT) { try { OUT.gain.value = 0; OUT.disconnect(); } catch (e) {} OUT = null; } document.querySelectorAll('[data-party="music"]').forEach(b => { b.textContent = "\u{1F3B5} Party music"; }); }
export function toggleMusic() { playing ? stopMusic() : startMusic(); }
function boop(v) { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const t = AC.currentTime; tone(660 + v * 90, t, 0.08, "sine", 0.18); tone(990 + v * 120, t + 0.04, 0.08, "sine", 0.1); } catch (e) {} }
