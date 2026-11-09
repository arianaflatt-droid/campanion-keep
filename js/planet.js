/* ---------- 🚀 Planet JP, Wave 1 (Nov 5) ----------
   A launch bar across the top of every student's Keep on school days (Ms. Ariana turns it on: cls.planetOn).
   The S.S. Duck flies along the bar toward Planet JP as the day's 4 fuel tanks fill: 120 XP + 25 Math + 25 Reading
   + 25 Language (subject swaps merge, like Bubble's Baby). The launch window is 11:00–12:55 Arizona time:
   full before 11 = "ready, the window opens at 11"; full in the window = the whole screen turns into Mission Control
   with a LAUNCH button → liftoff cutscene → landing on Planet JP; not full by 12:55 = "Mission scrubbed".
   A launch is saved on the student: planet = { n: launches, last: "YYYY-MM-DD", streak, best } (one write a day).
   Wave 2 adds a space minigame between liftoff and landing; Planet JP itself comes later, one piece at a time.
   Pictures live in assets/planet/ — until one is uploaded (ART below) the stand-in drawing is used. */
import { esc } from "./game.js?v=20261109b";
import { azToday, azNow } from "./collect.js?v=20261109b";
import { axoDay, schoolDayFor } from "./axolotl.js?v=20261109b";
import { addDays } from "./doors.js?v=20261109b";
import { GAMES, gameOfDay, gameByKey, play, preload } from "./spacegames.js?v=20261109b";
import { ZONES, safariSync, freshSt, albumHTML, filmLeft, pageCount, pageSize, aliensFound, zoneAliens, FREE_FILM, ROLL_COST, shopHTML, netsOf, NETS, netImg, pjWindow, classOpenAll, PJ_LATE } from "./safari.js?v=20261109b";
import { cafeHTML } from "./cafe.js?v=20261109b";
import { shopPageHTML } from "./spaceshop.js?v=20261109b";
import { hangarHTML } from "./hangar.js?v=20261109b";
import { duckImgOf, flameFxOf, trailOf } from "./shop-data.js?v=20261109b";

export const PJ_OPEN = 11 * 60, PJ_CLOSE = 12 * 60 + 55;   // minutes after midnight, Arizona time
const A = "assets/planet/";
export const ART = { duck: true, flame: true, planet: true, pad: true, sky: true, landing: true, button: true, jpCmd: true, jpWave: true, video: false };   // flip to true as each picture is uploaded
export const planetOn = cls => !!(cls && cls.planetOn);
const now = () => (typeof window !== "undefined" && window.__pjNow ? new Date(window.__pjNow) : new Date());
const mins = () => { const t = azNow(now()); return t.h * 60 + t.m; };

// Today's 4 fuel tanks (XP + the core subjects, swaps merged) and the overall fill (0–1)
export function fuel(st, cls) {
  const iso = azToday(), d = axoDay(st, cls, iso), h = ((st && st.xpHist) || {})[iso] || {};
  const xp = Math.max(d.xp, Number(h.mo) || 0), hit = xp >= d.goal || !!h.h || !!h.lh;
  const ICON = { m: "➗", r: "\u{1F4D6}", l: "✏️" };
  const tanks = [{ icon: "⭐", name: "XP", have: hit ? Math.max(xp, d.goal) : xp, need: d.goal }].concat(d.rows.map(r => ({ icon: ICON[r.src] || "\u{1F4DA}", name: r.name, have: r.have, need: r.need })));
  const need = tanks.reduce((n, t) => n + t.need, 0), have = tanks.reduce((n, t) => n + Math.min(t.have, t.need), 0);
  // Nov 7: Ms. Ariana can launch a student by hand (tech trouble, work done somewhere else): pjGo = today's date
  if (st && (st.pjGo === iso || classOpenAll(cls))) return { tanks: tanks.map(t => Object.assign({}, t, { have: Math.max(t.have, t.need) })), pct: 1, full: true, manual: true };
  return { tanks, pct: need ? have / need : 0, full: tanks.every(t => t.have >= t.need) };
}
const launchedToday = st => !!(st && st.planet && st.planet.last === azToday());
// "off" | "fill" | "ready" (full, before 11) | "go" (full, window open) | "landed" | "scrubbed"
export function phase(st, cls) {
  if (!planetOn(cls) || !st || !schoolDayFor(cls, azToday())) return "off";
  if (launchedToday(st)) return "landed";
  const m = mins(), f = fuel(st, cls);
  const W = pjWindow(st, cls);
  if (m >= W.c) return "scrubbed";
  if (!f.full) return "fill";
  return m >= W.o ? "go" : "ready";
}
const hhmm = n => { const h = Math.floor(n / 60), m = n % 60; return (h > 12 ? h - 12 : h) + ":" + String(m).padStart(2, "0"); };
const left = to => { const n = Math.max(0, to - mins()), hh = Math.floor(n / 60), mm = n % 60; return (hh ? hh + "h " : "") + mm + "m"; };

const DUCK_SVG = '<svg class="pjduck-svg" viewBox="0 0 160 100" aria-hidden="true"><path d="M30 30 L8 14 L16 44 Z M30 70 L8 86 L16 56 Z" fill="#FF9A2E" stroke="#C25E00" stroke-width="3" stroke-linejoin="round"/>' +
  '<path d="M24 50 C24 24 60 18 96 22 C118 24 130 36 134 50 C130 64 118 76 96 78 C60 82 24 76 24 50 Z" fill="#FFFFFF" stroke="#9BB4C8" stroke-width="3"/>' +
  '<path d="M132 40 L156 50 L132 60 C136 54 136 46 132 40 Z" fill="#FF9A2E" stroke="#C25E00" stroke-width="3" stroke-linejoin="round"/>' +
  '<circle cx="92" cy="46" r="13" fill="#8FE3FF" stroke="#5B7A93" stroke-width="4"/><circle cx="87" cy="41" r="4" fill="#fff" opacity=".9"/>' +
  '<path d="M44 58 C54 66 70 66 80 60" fill="none" stroke="#DDE7EF" stroke-width="5" stroke-linecap="round"/><rect x="14" y="42" width="12" height="16" rx="3" fill="#7C8C99"/></svg>';
// 🛒 Space Shop (Nov 8): the student's own duck paint + flame color (st = whose duck; defaults to the page's student)
const duckHTML = st => { st = st === undefined ? C && C.st : st; return ART.duck ? '<img class="pjduck-img" src="' + duckImgOf(st) + '" alt="The S.S. Duck">' : DUCK_SVG; };
const flameHTML = st => { st = st === undefined ? C && C.st : st; const fx = flameFxOf(st);
  return ART.flame ? '<img class="pjflame' + (fx === "rainbow" ? " rainbowfx" : "") + '" src="' + A + 'ss-duck-flame.webp" alt=""' + (fx && fx !== "rainbow" ? ' style="filter:' + fx + '"' : "") + ">" : '<span class="pjflame pjflame-css"></span>'; };
const planetHTML = () => (ART.planet ? '<img class="pjplanet-img" src="' + A + 'planet-jp.webp" alt="Planet JP">' : '<span class="pjplanet-css"></span>');
const bg = k => (ART[k] ? ' style="background-image:url(' + A + { pad: "launch-pad", sky: "space-sky", landing: "jp-landing" }[k] + '.webp)"' : "");

/* ---------- the bar (drawn on the student page, under "Hi, name!") ---------- */
export function planetBar(st, cls, preview) {
  const p = phase(st, cls); if (p === "off") return preview && planetOn(cls) ? '<div class="pjbar off"><span class="pjmsg">\u{1F680} Planet JP launches on school days.</span></div>' : "";
  const f = fuel(st, cls), pct = p === "landed" ? 1 : Math.min(1, f.pct), pl = st.planet || {};
  const W = pjWindow(st, cls);
  let msg;
  if (p === "fill") msg = "Fill all 4 tanks to launch to <b>Planet JP</b>! " + (mins() < W.o ? "Launch window opens at " + hhmm(W.o) + "." : 'Window closes in <b id="pjcd">' + left(W.c) + "</b>");
  else if (p === "ready") msg = "\u{1F389} Ready for liftoff! The launch window opens in <b id=\"pjcd\">" + left(W.o) + "</b>";
  else if (p === "go") msg = '\u{1F680} Fuel tanks full! <button class="btn small gold" data-pj="open">Launch the S.S. Duck!</button>';
  else if (p === "landed") msg = (mins() < W.c ? '<button class="btn small gold" data-pj="tab">\u{1FA90} Explore Planet JP</button> ' : "") + "\u{1FA90} You landed on <b>Planet JP</b>! Launch #" + (pl.n || 1) + ((pl.streak || 0) > 1 ? " · \u{1F525} " + pl.streak + " days in a row" : "") + (pl.dust ? " · ⭐ " + pl.dust + " Stardust" : "");
  else msg = "\u{1F6D1} Mission scrubbed, try again tomorrow!";
  const tanks = p === "landed" || p === "scrubbed" ? "" : '<div class="pjtanks">' + f.tanks.map(t => '<span class="pjtank' + (t.have >= t.need ? " ok" : "") + '">' + t.icon + " " + esc(t.name) + " <b>" + Math.min(t.have, t.need) + "/" + t.need + "</b>" + (t.have >= t.need ? " ✅" : "") + "</span>").join("") + "</div>";
  return '<div class="pjbar ' + p + '"><div class="pjtrack"><div class="pjfill" style="width:' + (pct * 100).toFixed(1) + '%"></div>' +
    (trailOf(st) && pct > 0.02 ? '<div class="pjtrail tr-' + trailOf(st) + '" style="width:' + (pct * 100).toFixed(1) + '%"></div>' : "") +
    '<div class="pjship" style="left:' + (pct * 100).toFixed(1) + '%">' + duckHTML(st) + (p === "go" || p === "ready" ? flameHTML(st) : "") + "</div>" +
    '<div class="pjgoal">' + planetHTML() + "<small>Planet JP</small></div></div>" +
    '<div class="pjrow"><span class="pjmsg">' + msg + "</span>" + (preview ? '<button class="btn ghost small" data-pj="open">\u{1F440} Preview the launch</button>' : "") + "</div>" + tanks + "</div>";
}

/* ---------- the full-screen launch (its own layer, so page redraws don't restart it) ---------- */
let C = null, saved0 = {}, forceGame = null, view = null, root = null, timers = [], tick = null, lastPhase = "", popped = "";
export const planetBusy = () => !!view;
const later = (ms, fn) => timers.push(setTimeout(fn, ms));
const clearT = () => { timers.forEach(clearTimeout); timers = []; };
function rootEl() {
  if (!root) { root = document.createElement("div"); root.id = "pjroot"; document.body.appendChild(root);
    root.addEventListener("click", ev => { const b = ev.target.closest("[data-pj]"); if (b) act(b.dataset.pj); }); }
  return root;
}
document.addEventListener("click", ev => { const b = ev.target.closest && ev.target.closest('[data-pj="open"]'); if (b && C && !root?.contains(b)) openMC();
  const t = ev.target.closest && ev.target.closest('[data-pj="tab"]'); if (t && !root?.contains(t)) window.dispatchEvent(new CustomEvent("pj-tab")); });

// called on every student page render. c = { st, cls, patch, preview, rerender, calm }
export function planetSync(c) {
  C = c; safariSync(c);
  if (!tick) tick = setInterval(() => {
    if (!C) return; const el = document.getElementById("pjcd"), p = phase(C.st, C.cls);
    const W = pjWindow(C.st, C.cls); if (el) el.textContent = p === "ready" ? left(W.o) : left(W.c);
    if (p !== lastPhase && C.rerender) C.rerender();
  }, 15000);
  const p = phase(c.st, c.cls); lastPhase = p;
  if (view === "mc" && p !== "go" && !c.preview) close();
  // the takeover: once a day (per page load) when the tanks are full and the window is open
  if (!view && p === "go" && c.calm && !c.preview && popped !== azToday() + c.st.id) { popped = azToday() + c.st.id; openMC(); }
}
function openMC() { view = "mc"; preload(); drawMC(); }
function close() { clearT(); musicStop(); view = null; if (root) root.innerHTML = ""; if (C && C.rerender) C.rerender(); }
function act(a) {
  if (a === "open") return openMC();
  if (a === "later" || a === "done") return close();
  if (a === "explore") { close(); window.dispatchEvent(new CustomEvent("pj-tab")); return; }
  if (a === "launch" && view === "mc") return launch();
  if (a === "skip" && view === "fly") { clearT(); const v = document.getElementById("pjvid"); if (v) v.pause(); intro(); }
  if (a === "gstart" && view === "intro") return startGame();
  if (a === "toland" && view === "results") { view = "fly"; return land(); }
  if (a.startsWith("pick:")) { forceGame = a.slice(5); drawMC(); }
}
// Every scene is drawn on a 16:9 "stage" that covers the screen (like the background picture), so the rocket can sit
// exactly on the painted launch pad / landing pad and the LAUNCH tap spot lands on the painted red button.
const stage = (cls, inner, extra) => '<div class="pjover ' + cls + '"><div class="pjcov">' + inner + "</div>" + (extra || "") + "</div>";
const rocket = (cls, inner, id) => '<div class="pjrocket ' + cls + '"><div class="pjrot"' + (id ? ' id="' + id + '"' : "") + ">" + inner + "</div></div>";
const jpCmd = say => ART.jpCmd ? '<div class="pjjp cmd"><img src="' + A + 'jp-commander.webp" alt="Commander JP">' + (say ? '<span class="pjsay">' + say + "</span>" : "") + "</div>" : "";
function drawMC() {
  const st = C.st, name = esc((st && (st.name || "")).split(" ")[0]);
  rootEl().innerHTML = stage("pjmc",
    '<button class="pjhot" data-pj="launch" aria-label="Launch"><span>PRESS TO LAUNCH</span></button>',
    '<div class="pjmc-top"><b>\u{1F6F0}️ Mission Control</b><button class="btn ghost small" data-pj="later">Not now</button></div>' +
    '<div class="pjhead"><h1 class="pjtitle">Fuel tanks full!</h1><p class="pjsub">Ready for liftoff, Captain ' + name + "? Next stop: <b>Planet JP</b> \u{1FA90}</p>" +
    (C.preview ? '<p class="pjsub small">\u{1F440} Teacher preview: nothing is saved. Game: ' + GAMES.map(g => '<button class="btn small' + (todayGame().key === g.key ? " gold" : " ghost") + '" data-pj="pick:' + g.key + '" title="' + g.name + '">' + g.icon + "</button>").join(" ") + "</p>" : "") + "</div>" +
    jpCmd("Fuel tanks are full, Captain " + name + "! Press the big red button!"));
}

/* ---------- liftoff → space → landing ---------- */
function launch() {
  view = "fly"; const st = C.st; musicStart();
  let saved = st.planet || {};
  if (!C.preview && !launchedToday(st)) {
    const today = azToday(); let prev = addDays(today, -1), i = 0;
    while (!schoolDayFor(C.cls, prev) && i++ < 20) prev = addDays(prev, -1);
    const streak = saved.last === prev ? (Number(saved.streak) || 0) + 1 : 1;
    saved = Object.assign({}, saved, { n: (Number(saved.n) || 0) + 1, last: today, streak, best: Math.max(Number(saved.best) || 0, streak), g: null, gs: null });
    Object.assign(saved, weekTrack(saved, today, C.cls));
    C.patch({ planet: saved });   // saved right away, so leaving mid-cutscene still counts
  } else if (C.preview) saved = Object.assign({}, saved, { n: (Number(saved.n) || 0) + 1, streak: (Number(saved.streak) || 0) + 1 });
  saved0 = saved;
  const r = rootEl();
  r.innerHTML = stage("pjpad", rocket("onpad", duckHTML() + flameHTML(), "pjrk") + '<div class="pjsmoke" id="pjsmoke"></div>',
    '<div class="pjcount" id="pjcount">3</div>' + jpCmd("T-minus 3…") + '<button class="btn ghost small pjskip" data-pj="skip">Skip ⏭</button>');
  const k0 = document.getElementById("pjrk"); if (k0) k0.classList.add("shake");
  const say = t => { const b = r.querySelector(".pjsay"); if (b) b.textContent = t; };
  beep(520); later(1000, () => { setTxt("pjcount", "2"); say("2…"); beep(520); });
  later(2000, () => { setTxt("pjcount", "1"); say("1…"); beep(520); });
  later(3000, () => { setTxt("pjcount", "LIFTOFF!"); say("We have liftoff! \u{1F680}"); beep(880, 0.4); rumble(2.4); const k = document.getElementById("pjrk"); if (k) k.classList.add("up"); const s = document.getElementById("pjsmoke"); if (s) s.classList.add("on"); r.firstChild.classList.add("quake"); });
  if (ART.video) later(3600, playVideo);   // Ms. Ariana's own liftoff video (assets/planet/liftoff.mp4) replaces the flight
  else { later(5400, () => space()); later(8800, intro); }
}
/* 🏅 Visit badges (Nov 7): Space Week = launch on 5 days of one week; Star Commander = launch on every school day of a week,
   4 weeks in a row (weeks with no school are skipped). Saved in planet: wk = { w: that week's Monday, c: launches, f: full },
   wr = full weeks in a row, wl = Monday of the last full week, wb = best run, w5 = had a 5-launch week. */
const mondayOf = iso => { const d = new Date(iso + "T12:00:00Z"), k = (d.getUTCDay() + 6) % 7; return addDays(iso, -k); };
const schoolDays = (cls, mon) => [0, 1, 2, 3, 4].filter(i => schoolDayFor(cls, addDays(mon, i))).length;
export function weekTrack(pl, today, cls) {
  const w = mondayOf(today); let wk = pl.wk && pl.wk.w === w ? Object.assign({}, pl.wk) : { w, c: 0 };
  if (!pl.wk && pl.last && Number(pl.streak) > 0) {   // first time: count this week's earlier launches from the day streak
    let prior = 0; for (let i = 0, d = addDays(today, -1); i < 5 && d >= w; i++, d = addDays(d, -1)) { if (!schoolDayFor(cls, d)) continue; if (prior < (Number(pl.streak) || 1) - 1) prior++; else break; }
    wk.c = prior;
  }
  wk.c++; const out = { wk };
  if (wk.c >= 5) out.w5 = 1;
  if (!wk.f && wk.c >= schoolDays(cls, w)) {
    wk.f = 1; let ok = false, m = addDays(w, -7);
    for (let i = 0; i < 6; i++, m = addDays(m, -7)) { if (pl.wl === m) { ok = true; break; } if (schoolDays(cls, m) > 0) break; }
    out.wr = ok ? (Number(pl.wr) || 0) + 1 : 1; out.wl = w; out.wb = Math.max(Number(pl.wb) || 0, out.wr);
  }
  return out;
}
function space() {
  rootEl().innerHTML = '<div class="pjover pjspace"' + bg("sky") + '><div class="pjstars"></div><div class="pjstars far"></div><div class="pjstage">' +
    '<div class="pjfly">' + duckHTML() + flameHTML() + "</div>" + '<div class="pjnear">' + planetHTML() + "</div>" +
    '<p class="pjcap">Incoming: ' + todayGame().icon + " " + todayGame().name + "!</p></div>" + '<button class="btn ghost small pjskip" data-pj="skip">Skip ⏭</button></div>';
  whoosh();
}
function playVideo() {
  if (music) music.volume = 0.05;
  rootEl().innerHTML = '<div class="pjover pjvideo"><video id="pjvid" src="' + A + 'liftoff.mp4" autoplay playsinline></video><button class="btn ghost small pjskip" data-pj="skip">Skip ⏭</button></div>';
  const v = document.getElementById("pjvid"); if (!v) return land();
  v.onended = intro; v.onerror = intro;
  const p = v.play && v.play(); if (p && p.catch) p.catch(() => { v.muted = true; v.play().catch(intro); });
}
/* ---------- Wave 2: today's minigame, then the Stardust ---------- */
const todayGame = () => gameByKey((typeof window !== "undefined" && window.__pjGame) || (forceGame && C && C.preview ? forceGame : gameOfDay(azToday()).key));
const sfx = { beep: (f, d) => beep(f, d), thud: () => thud(), sparkle: () => sparkle() };
const LAUNCH_DUST = 10;
function intro() {
  clearT(); view = "intro"; const g = todayGame();
  rootEl().innerHTML = '<div class="pjover pjspace"' + bg("sky") + '><div class="pjstars far"></div><div class="pjstage"><div class="pjintro">' +
    '<div class="pjgicon">' + g.icon + '</div><h1 class="pjtitle">' + esc(g.name) + '</h1><p class="pjsub">' + esc(g.how) + "</p>" +
    '<p class="pjsub small">Earn up to <b>20 ⭐ Stardust</b> (plus 10 for launching)!</p><button class="btn gold pjgo" data-pj="gstart">Start!</button></div></div></div>';
}
function startGame() {
  view = "game"; const g = todayGame(); let n = 3;
  const r = rootEl(); r.innerHTML = '<div class="pjover pjspace"' + bg("sky") + '><div class="pjstage"><div class="pjcount">3</div></div></div>'; beep(520);
  const t = setInterval(() => { n--; const el = r.querySelector(".pjcount"); if (n > 0) { if (el) el.textContent = n; beep(520); return; }
    clearInterval(t); beep(880, 0.3);
    r.innerHTML = '<div class="pjghost"' + bg("sky") + "></div>";
    play(g.key, r.firstChild, sfx).then(results); }, 800);
}
function results(res) {
  view = "results"; const g = gameByKey(res.key), gain = LAUNCH_DUST + res.dust, prev = saved0 || {};
  const hs = Object.assign({}, prev.hs || {}), better = res.key === "code" ? res.score > 0 && (!hs.code || res.score < hs.code) : res.score > (hs[res.key] || 0);
  if (better) hs[res.key] = res.score;
  const first = !C.preview && C.st && C.st.planet && C.st.planet.last === azToday() && C.st.planet.g == null;   // only the day's launch game pays
  if (first || C.preview) saved0 = Object.assign({}, prev, { dust: (Number(prev.dust) || 0) + gain, g: res.key, gs: res.score, hs });
  if (first) C.patch({ planet: saved0 });
  const line = res.key === "code" ? (res.score ? "Cracked in <b>" + res.score + "</b> tr" + (res.score === 1 ? "y" : "ies") + "!" : "Zib’s code stayed secret this time.")
    : "You got <b>" + res.score + "</b> " + (res.score === 1 ? g.unit.replace(/s$/, "") : g.unit) + "!";
  rootEl().innerHTML = '<div class="pjover pjspace"' + bg("sky") + '><div class="pjstage"><div class="pjintro">' +
    '<img class="pjdustimg" src="' + A + 'stardust.webp" alt=""><h1 class="pjtitle">+' + gain + " Stardust!</h1>" +
    '<p class="pjsub">' + g.icon + " " + esc(g.name) + ": " + line + (better ? " \u{1F3C6} New best!" : "") + "</p>" +
    '<p class="pjsub small">⭐ ' + res.dust + " from the game + " + LAUNCH_DUST + " for launching · You have <b>" + (saved0.dust || 0) + "</b> Stardust</p>" +
    '<button class="btn gold pjgo" data-pj="toland">Land on Planet JP \u{1FA90}</button></div></div></div>';
  sparkle();
}
function land(skipped) {
  const s = saved0 || {}, name = esc(((C.st && C.st.name) || "").split(" ")[0]);
  rootEl().innerHTML = stage("pjland", rocket("landing" + (skipped ? " landed" : ""), duckHTML()) + '<div class="pjdust" id="pjdust"></div>',
    (ART.jpWave ? '<div class="pjjp wave" id="pjwave"><img src="' + A + 'jp-welcome.webp" alt="JP"></div>' : "") +
    '<div class="pjwelcome" id="pjwel"><h1 class="pjtitle">Welcome to Planet JP!</h1><p class="pjsub">The S.S. Duck landed safely, Captain ' + name + "!</p>" +
    '<p class="pjstat">\u{1F680} Launch <b>#' + (s.n || 1) + "</b>" + ((s.streak || 0) > 1 ? " · \u{1F525} <b>" + s.streak + "</b> days in a row" : "") + (s.dust ? " · ⭐ <b>" + s.dust + "</b> Stardust" : "") + "</p>" +
    '<p class="pjsub small">Explore the map and see who else landed in your <b>\u{1FA90} Planet JP</b> tab (open until 12:55).</p>' +
    '<div class="row" style="justify-content:center;gap:10px;"><button class="btn gold" data-pj="explore">\u{1F5FA}\uFE0F Explore Planet JP</button><button class="btn ghost" data-pj="done">Done</button></div></div>');
  const show = () => { ["pjwel", "pjwave", "pjdust"].forEach(id => { const e = document.getElementById(id); if (e) e.classList.add("on"); }); };
  if (!skipped) later(1900, () => { thud(); show(); }); else show();
  later(skipped ? 100 : 2100, sparkle);
}
const setTxt = (id, t) => { const e = document.getElementById(id); if (e) e.textContent = t; };

/* ---------- quiet space music under the trip (assets/planet/space-loop.mp3, a 32 s loop; off when ck-mute is set) ---------- */
let music = null;
function musicStart() {
  try { if (localStorage.getItem("ck-mute") === "1") return; } catch (e) {}
  try { if (!music) { music = new Audio(A + "space-loop.mp3"); music.loop = true; } music.volume = 0.18; music.currentTime = 0; const p = music.play(); if (p && p.catch) p.catch(() => {}); } catch (e) {}
}
function musicStop() {
  if (!music || music.paused) return; const m = music; let v = m.volume;
  const f = setInterval(() => { v -= 0.03; if (v <= 0) { clearInterval(f); m.pause(); } else m.volume = v; }, 60);
}
/* ---------- little sounds (off when ck-mute is set) ---------- */
let AC = null;
const ac = () => { try { if (localStorage.getItem("ck-mute") === "1") return null; } catch (e) {} try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === "suspended") AC.resume(); return AC; } catch (e) { return null; } };
function beep(f, d) { const a = ac(); if (!a) return; const t = a.currentTime, o = a.createOscillator(), g = a.createGain(); o.type = "square"; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.08, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + (d || 0.18)); o.connect(g).connect(a.destination); o.start(t); o.stop(t + (d || 0.18) + 0.05); }
function noise(dur, vol, lp) { const a = ac(); if (!a) return; const n = Math.floor(a.sampleRate * dur), b = a.createBuffer(1, n, a.sampleRate), x = b.getChannelData(0); for (let i = 0; i < n; i++) x[i] = Math.random() * 2 - 1;
  const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(), t = a.currentTime; s.buffer = b; f.type = "lowpass"; f.frequency.value = lp; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(f).connect(g).connect(a.destination); s.start(t); }
const rumble = d => noise(d, 0.35, 420), whoosh = () => noise(1.4, 0.12, 1800), thud = () => noise(0.5, 0.3, 260);
function sparkle() { [1318, 1568, 1976, 2637].forEach((f, i) => setTimeout(() => beep(f, 0.12), i * 90)); }

/* ---------- console card (Daily tab) ---------- */
// ✋ Manual launch (Nov 7): for a student whose tanks didn't fill because of tech trouble. Their tanks count as full today,
// so the launch window (11:00–12:55) works for them like everyone else. One write on the student; tap again to take it back.
function manualRows(kids, cls, went) {
  const today = azToday(), wait = kids.filter(s => !went.includes(s)).sort((a, b) => String(a.name).localeCompare(String(b.name)));
  if (!wait.length) return "";
  return '<details class="pjmanual"' + (wait.some(s => s.pjGo === today) ? " open" : "") + '><summary>✋ <b>Launch a student by hand</b> (tech trouble, or their subjects were done somewhere else)</summary>' +
    '<div class="pjmanrows">' + wait.map(s => { const on = s.pjGo === today, full = fuel(Object.assign({}, s, { pjGo: null }), cls).full;
      return '<div class="pjmanrow"><span>' + esc(s.name) + (full ? ' <small class="muted">tanks full</small>' : "") + "</span>" +
        (on ? '<button class="btn small gold" data-pjgo="' + s.id + '" data-on="0" title="Take it back">\u{1F680} Cleared to launch \u2715</button>' : '<button class="btn small ghost" data-pjgo="' + s.id + '" data-on="1">\u{1F680} Let launch</button>') + "</div>"; }).join("") +
    '</div><p class="small muted" style="margin:6px 0 0;">Their tanks fill right away and they can launch <b>right now, any time today</b>, then explore Planet JP until 3:30.</p></details>';
}
// 🚀 Open the launch window now for the whole class (Nov 9), any time of day, until the time she picks
function winRow(cls) {
  const w = cls.pjWin && cls.pjWin.d === azToday() ? cls.pjWin : null, now = mins();
  if (w && w.to > now) return '<div class="pjwinrow open"><b>\u{1F7E2} The launch window is open for the class until ' + hhmm(w.to) + "</b>" + (w.all ? " · everyone can launch, even without full tanks" : " · students with full tanks can launch") +
    ' <button class="btn small ghost" data-act="pjWinClose">Close it now</button></div>';
  return '<div class="pjwinrow"><b>\u{1F680} Open Planet JP now</b> (any time of day) for <select id="pjWinLen"><option value="30">30 minutes</option><option value="60" selected>1 hour</option><option value="90">1\u00bd hours</option><option value="late">until 3:30</option></select> ' +
    '<label class="small"><input type="checkbox" id="pjWinAll"> everyone can launch, even without full tanks</label> <button class="btn small gold" data-act="pjWinOpen">\u{1F680} Open the launch window</button></div>';
}
export const pjMinsNow = () => mins();
export function planetAdmin(students, cls) {
  const on = planetOn(cls), kids = students.filter(s => s.companionId && !s.isTeacher), today = azToday();
  const went = kids.filter(s => s.planet && s.planet.last === today), ready = kids.filter(s => !(s.planet && s.planet.last === today) && fuel(s, cls).full);
  return '<div class="card" id="pjCard"><div class="card-head"><h2>\u{1F680} Planet JP</h2><span class="fact">' + (on ? (schoolDayFor(cls, today) ? went.length + " launched today" : "no school today") : "off") + "</span></div>" +
    '<p class="lede" style="font-size:13.5px;">A launch bar across the top of every student’s Keep. It fills with <b>120 XP + 25 Math, Reading and Language</b>. Full tanks can launch the S.S. Duck from <b>11:00 to 12:55</b> (Arizona time); not full by 12:55 = “Mission scrubbed”. School days only (your calendar breaks are skipped). To try it yourself, open a student’s page in preview and press “Preview the launch”.</p>' +
    '<div class="row" style="margin:10px 0;gap:8px;"><button class="btn' + (on ? " ghost" : "") + '" data-act="pjToggle">' + (on ? "Turn Planet JP off" : "\u{1F680} Turn Planet JP on") + "</button></div>" +
    (on ? winRow(cls) : "") +
    (on && schoolDayFor(cls, today) ? manualRows(kids, cls, went) : "") +
    (on && (went.length || ready.length) ? '<p class="small" style="margin:4px 0;">' + (went.length ? "\u{1FA90} <b>Landed:</b> " + went.map(s => esc(s.name)).join(", ") : "") + (ready.length ? (went.length ? "<br>" : "") + "⛽ <b>Tanks full, not launched yet:</b> " + ready.map(s => esc(s.name)).join(", ") : "") + "</p>" : "") + "</div>";
}

/* ---------- 🚀 "Ava has launched!" on The Keep + Battle Area (Nov 7) ----------
   The teacher's big screens (class view and Battle Area) watch the class: when a student's launch count goes up today,
   the S.S. Duck blasts across the screen with "<name> has launched to Planet JP!". Several launches line up one after another.
   Nothing is saved; launches that happened before the screen was opened don't play. */
const seenN = {}; let kq = [], kBusy = false, kRoot = null, kPrimed = false;
export function keepLaunchWatch(students, active) {
  const today = azToday();
  (students || []).forEach(s => {
    const p = s.planet || {}, n = Number(p.n) || 0;
    if (kPrimed && seenN[s.id] != null && n > seenN[s.id] && p.last === today && active) kq.push({ name: s.name || "A student", s });
    seenN[s.id] = n;
  });
  kPrimed = true;
  if (!active) kq = [];
  if (!kBusy) kNext();
}
function kNext() {
  const q = kq.shift(); if (!q) { kBusy = false; return; } const name = q.name;
  kBusy = true;
  if (!kRoot) { kRoot = document.createElement("div"); kRoot.id = "pjkeep"; document.body.appendChild(kRoot); }
  kRoot.innerHTML = '<div class="pjk"><div class="pjktrail"></div><div class="pjkship">' + duckHTML(q.s) + flameHTML(q.s) + "</div>" +
    '<div class="pjkmsg"><span class="pjkplanet">' + planetHTML() + "</span><b>" + esc(name) + "</b> has launched to Planet JP! \u{1F680}</div></div>";
  try { rumble(1.6); setTimeout(sparkle, 1400); } catch (e) {}
  setTimeout(() => { if (kRoot) kRoot.innerHTML = ""; setTimeout(kNext, 500); }, 5600);
}

/* ---------- 🪐 The Planet JP tab, Wave 3a (Nov 7): the map of 7 zones + the Class Colony ----------
   Opens after the day's launch and closes at 12:55 (Arizona). Zones unlock by number of launches (planet.n).
   The Colony shows every classmate who landed today (from the class's public cards — no extra reads). */
export { ZONES };
export const pjOpen = (st, cls) => phase(st, cls) === "landed" && mins() < pjWindow(st, cls).c;
const TYPE_IC = { Fire: "\u{1F525}", Water: "\u{1F4A7}", Nature: "\u{1F343}", Rock: "\u{1FAA8}", Earth: "⛰️", Air: "\u{1F32A}️", Electric: "⚡", Ice: "❄️", Light: "✨", Dark: "\u{1F311}", Ghost: "\u{1F47B}", Poison: "\u{1F9EA}", Steel: "⚙️", Normal: "\u{1F4AB}", Arcane: "\u{1F52E}", Crystal: "\u{1F48E}", Dragon: "\u{1F409}" };
let zoneOpen = null;
export function planetZone(k) { zoneOpen = k || null; }
// petOf(st) → companion HTML (passed in by the page, so this file doesn't need the game's art code)
// where each place sits on the hub picture (% of a 16:9 scene). Zones = the 7 portholes across the sky.
const HUB_ZONES = [[8, 17], [21, 13], [35, 11], [50, 10], [65, 11], [79, 13], [92, 17]];
const HUB_PLACES = [
  { k: "cafe", name: "\u2615 Space Caf\u00e9", x: 15, y: 62, w: 24, html: () => '<span class="hubcafe"><img class="hubwin" src="' + A + 'cafe/cafe-room.webp" alt=""><img class="hubchef" src="' + A + 'cafe/chef-duck-360.webp" alt=""></span>' },
  { k: "safari", name: "\u{1F6D2} Safari Shop", x: 37, y: 74, w: 18, html: () => '<img src="' + A + 'safari-shop.webp" alt="">' },
  { k: "shop", name: "\u{1F6CD}\uFE0F Space Shop", x: 62, y: 74, w: 22, html: () => '<img src="' + A + 'shop/space-shop.webp" alt="">' },
  { k: "swap", name: "\u{1F527} Swap Shop", x: 86, y: 63, w: 21, html: () => '<img src="' + A + 'shop/swap-shop.webp" alt="">' },
  { k: "hangar", name: "\u{1F527} Duck Hangar", x: 78, y: 41, w: 15, html: () => '<img src="' + A + 'hangar/hangar-building.webp" alt="">' },
  { k: "album", name: "\u{1F4D6} Photo Album", x: 30, y: 44, w: 10, html: () => '<span class="hubbook">\u{1F4D6}</span>' },
  { k: "colony", name: "\u{1F3D5}\uFE0F Class Colony", x: 54, y: 46, w: 14, html: () => '<span class="hubduck">' + duckHTML() + "</span>" }];
if (typeof document !== "undefined") document.addEventListener("click", ev => { const b = ev.target.closest && ev.target.closest("[data-pjcolony]"); if (!b) return; const c = document.getElementById("pjcolonycard"); if (c) c.scrollIntoView({ behavior: "smooth" }); });
function hubHTML(st, n) {
  let h = '<div class="pjhubscroll"><div class="pjhub" style="background-image:url(' + A + 'jp-landing.webp)">';
  ZONES.forEach((z, i) => { const open = n >= z.at, [x, y] = HUB_ZONES[i];
    h += '<button class="hubzone' + (open ? "" : " locked") + '" style="left:' + x + "%;top:" + y + '%"' + (open ? ' data-pjzone="' + z.key + '"' : " disabled") + ">" +
      '<span class="hubport" style="background-image:url(' + A + "zone-" + z.key + '.webp)">' + (open ? "" : "<i>\u{1F512}</i>") + '</span><span class="hublbl">' + z.icon + " " + esc(z.name) + (open ? "" : " \u00b7 " + z.at + " \u{1F680}") + "</span></button>"; });
  HUB_PLACES.forEach(p => { h += '<button class="hubplace hub-' + p.k + '" style="left:' + p.x + "%;top:" + p.y + "%;width:" + p.w + '%" ' + (p.k === "colony" ? 'data-pjcolony="1"' : 'data-pjzone="' + p.k + '"') + ">" + p.html() + '<span class="hublbl">' + p.name + "</span></button>"; });
  return h + "</div></div>";
}
export function planetTab(st, cls, students, petOf, preview) {
  st = freshSt(st);
  const pl = (st && st.planet) || {}, n = Number(pl.n) || 0, today = azToday();
  const closeIn = Math.max(0, PJ_CLOSE - mins());
  let h = '<div class="card pjtab"><div class="pjtabhead">' + planetHTML() + '<div><h2>Planet JP</h2><p class="lede">' +
    (pjOpen(st, cls) ? "Open until <b>" + hhmm(pjWindow(st, cls).c) + "</b> · ⏱️ " + left(pjWindow(st, cls).c) + " left" : preview ? "\u{1F440} Teacher preview" : "Closed for today") +
    '</p></div><div class="pjtabstats"><span>\u{1F680} <b>' + n + "</b> launch" + (n === 1 ? "" : "es") + "</span><span>⭐ <b>" + (Number(pl.dust) || 0) + "</b> Stardust</span>" +
    ((pl.streak || 0) > 1 ? "<span>\u{1F525} <b>" + pl.streak + "</b> days in a row</span>" : "") + "</div></div></div>";
  if (zoneOpen === "album") return h + albumHTML(st, n);
  if (zoneOpen === "hangar") return h + '<div class="row" style="margin:0 0 10px;"><button class="btn ghost small" data-pjzone="">← Map</button></div>' + hangarHTML(st, cls, pjOpen(st, cls) || !!preview);
  if (zoneOpen === "safari") return h + '<div class="row" style="margin:0 0 10px;"><button class="btn ghost small" data-pjzone="">← Map</button></div>' + shopHTML(st);
  if (zoneOpen === "swap") return h + '<div class="row" style="margin:0 0 10px;"><button class="btn ghost small" data-pjzone="">← Map</button></div>' + shopPageHTML(st, cls, pjOpen(st, cls) || !!preview, "swap");
  if (zoneOpen === "shop") return h + '<div class="row" style="margin:0 0 10px;"><button class="btn ghost small" data-pjzone="">← Map</button></div>' + shopPageHTML(st, cls, pjOpen(st, cls) || !!preview, "shop");
  if (zoneOpen === "cafe") return h + '<div class="row" style="margin:0 0 10px;"><button class="btn ghost small" data-pjzone="">← Map</button></div>' + cafeHTML(st, cls, students, petOf, pjOpen(st, cls) || !!preview);
  const z = zoneOpen && ZONES.find(x => x.key === zoneOpen && n >= x.at);
  if (z) {
    return h + '<div class="card pjzone"><div class="pjzonescene" style="background-image:url(' + A + "zone-" + z.key + '.webp)">' +
      '<button class="btn ghost small pjback" data-pjzone="">← Map</button><div class="pjzonepet">' + (petOf ? petOf(st) : "") + "</div></div>" +
      '<h2>' + z.icon + " " + esc(z.name) + '</h2><p class="lede">' + esc(z.line) + "</p>" +
      '<p class="small">Creatures here: ' + z.types.map(t => '<span class="pjtype">' + (TYPE_IC[t] || "") + " " + t + "</span>").join(" ") + "</p>" +
      '<div class="safbox"><div><b>\u{1F4F8} Creature Safari</b><p class="small" style="margin:2px 0 0;">Creatures peek out and hide again. Tap one fast to take its photo! ' +
      "Album page: <b>" + pageCount(st, z.key) + " / " + pageSize(z.key) + "</b> · \u{1F47D} aliens <b>" + aliensFound(st, z.key) + " / 3</b> · \u{1F39E}️ <b>" + filmLeft(st) + "</b> film left today (" + FREE_FILM + " free a day, then " + ROLL_COST + " ⭐ a roll). Only here: " + zoneAliens(z.key).map(a => "<b>" + esc(a.name) + "</b>").join(", ") + " \u{1F47D}</p></div>" +
      '<button class="btn gold" data-safari="' + z.key + '">\u{1F4F8} Start safari</button></div>' +
      '<p class="small" style="margin:8px 0 0;">\u{1F6D2} Your nets: ' + NETS.map(n => netImg(n, "pjnetimg") + " " + (Number(netsOf(st)[n.k]) || 0)).join(" · ") + ". Switch to a net on the safari to catch a creature!</p></div>" + shopHTML(st);
  }
  const next = ZONES.find(x => n < x.at);
  // 🗺️ The Planet JP hub (Nov 8): one big picture of the landing area. Tap a place to go there.
  h += '<div class="card pjhubcard"><div class="card-head"><h2>\u{1F5FA}\uFE0F Planet JP</h2><span class="fact">' + ZONES.filter(x => n >= x.at).length + " of " + ZONES.length + " zones open</span></div>" +
    (next ? '<p class="lede" style="font-size:14px;margin:0 0 8px;">Tap a place to go there! Next zone: <b>' + next.icon + " " + esc(next.name) + "</b> in " + (next.at - n) + " more launch" + (next.at - n === 1 ? "" : "es") + ".</p>" : '<p class="lede" style="margin:0 0 8px;">Tap a place to go there! \u{1F3C6} You unlocked every zone!</p>') +
    hubHTML(st, n) + '<p class="small muted pjhubhint">\u2194\uFE0F Swipe the picture to see all of Planet JP.</p></div>';
  // the Class Colony: who landed today
  const kids = (students || []).filter(s => s.companionId && !s.isTeacher), landed = kids.filter(s => s.planet && s.planet.last === today);
  h += '<div class="card" id="pjcolonycard"><div class="card-head"><h2>\u{1F3D5}️ Class Colony</h2><span class="fact">' + landed.length + " of " + kids.length + " landed today</span></div>" +
    (landed.length ? '<div class="pjcolony" style="background-image:url(' + A + 'jp-landing.webp)">' + landed.sort((a, b) => String(a.name).localeCompare(String(b.name))).map(s =>
      '<div class="pjkid' + (st && s.id === st.id ? " me" : "") + '"><span class="pjcolpet">' + (petOf ? petOf(s) : "") + "</span><b>" + esc(s.name) + "</b><small>\u{1F680} " + (Number(s.planet.n) || 0) + "</small></div>").join("") + "</div>"
      : '<p class="lede">Nobody has landed yet today.</p>') + "</div>";
  return h;
}
