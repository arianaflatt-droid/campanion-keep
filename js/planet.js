/* ---------- 🚀 Planet JP, Wave 1 (Nov 5) ----------
   A launch bar across the top of every student's Keep on school days (Ms. Ariana turns it on: cls.planetOn).
   The S.S. Duck flies along the bar toward Planet JP as the day's 4 fuel tanks fill: 120 XP + 25 Math + 25 Reading
   + 25 Language (subject swaps merge, like Bubble's Baby). The launch window is 11:00–12:55 Arizona time:
   full before 11 = "ready, the window opens at 11"; full in the window = the whole screen turns into Mission Control
   with a LAUNCH button → liftoff cutscene → landing on Planet JP; not full by 12:55 = "Mission scrubbed".
   A launch is saved on the student: planet = { n: launches, last: "YYYY-MM-DD", streak, best } (one write a day).
   Wave 2 adds a space minigame between liftoff and landing; Planet JP itself comes later, one piece at a time.
   Pictures live in assets/planet/ — until one is uploaded (ART below) the stand-in drawing is used. */
import { esc } from "./game.js?v=20261106c";
import { azToday, azNow } from "./collect.js?v=20261106c";
import { axoDay, schoolDayFor } from "./axolotl.js?v=20261106c";
import { addDays } from "./doors.js?v=20261106c";
import { GAMES, gameOfDay, gameByKey, play, preload } from "./spacegames.js?v=20261106c";

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
  return { tanks, pct: need ? have / need : 0, full: tanks.every(t => t.have >= t.need) };
}
const launchedToday = st => !!(st && st.planet && st.planet.last === azToday());
// "off" | "fill" | "ready" (full, before 11) | "go" (full, window open) | "landed" | "scrubbed"
export function phase(st, cls) {
  if (!planetOn(cls) || !st || !schoolDayFor(cls, azToday())) return "off";
  if (launchedToday(st)) return "landed";
  const m = mins(), f = fuel(st, cls);
  if (m >= PJ_CLOSE) return "scrubbed";
  if (!f.full) return "fill";
  return m >= PJ_OPEN ? "go" : "ready";
}
const left = to => { const n = Math.max(0, to - mins()), hh = Math.floor(n / 60), mm = n % 60; return (hh ? hh + "h " : "") + mm + "m"; };

const DUCK_SVG = '<svg class="pjduck-svg" viewBox="0 0 160 100" aria-hidden="true"><path d="M30 30 L8 14 L16 44 Z M30 70 L8 86 L16 56 Z" fill="#FF9A2E" stroke="#C25E00" stroke-width="3" stroke-linejoin="round"/>' +
  '<path d="M24 50 C24 24 60 18 96 22 C118 24 130 36 134 50 C130 64 118 76 96 78 C60 82 24 76 24 50 Z" fill="#FFFFFF" stroke="#9BB4C8" stroke-width="3"/>' +
  '<path d="M132 40 L156 50 L132 60 C136 54 136 46 132 40 Z" fill="#FF9A2E" stroke="#C25E00" stroke-width="3" stroke-linejoin="round"/>' +
  '<circle cx="92" cy="46" r="13" fill="#8FE3FF" stroke="#5B7A93" stroke-width="4"/><circle cx="87" cy="41" r="4" fill="#fff" opacity=".9"/>' +
  '<path d="M44 58 C54 66 70 66 80 60" fill="none" stroke="#DDE7EF" stroke-width="5" stroke-linecap="round"/><rect x="14" y="42" width="12" height="16" rx="3" fill="#7C8C99"/></svg>';
const duckHTML = cls => (ART.duck ? '<img class="pjduck-img" src="' + A + 'ss-duck.webp" alt="The S.S. Duck">' : DUCK_SVG);
const flameHTML = () => (ART.flame ? '<img class="pjflame" src="' + A + 'ss-duck-flame.webp" alt="">' : '<span class="pjflame pjflame-css"></span>');
const planetHTML = () => (ART.planet ? '<img class="pjplanet-img" src="' + A + 'planet-jp.webp" alt="Planet JP">' : '<span class="pjplanet-css"></span>');
const bg = k => (ART[k] ? ' style="background-image:url(' + A + { pad: "launch-pad", sky: "space-sky", landing: "jp-landing" }[k] + '.webp)"' : "");

/* ---------- the bar (drawn on the student page, under "Hi, name!") ---------- */
export function planetBar(st, cls, preview) {
  const p = phase(st, cls); if (p === "off") return preview && planetOn(cls) ? '<div class="pjbar off"><span class="pjmsg">\u{1F680} Planet JP launches on school days.</span></div>' : "";
  const f = fuel(st, cls), pct = p === "landed" ? 1 : Math.min(1, f.pct), pl = st.planet || {};
  let msg;
  if (p === "fill") msg = "Fill all 4 tanks to launch to <b>Planet JP</b>! " + (mins() < PJ_OPEN ? "Launch window opens at 11:00." : 'Window closes in <b id="pjcd">' + left(PJ_CLOSE) + "</b>");
  else if (p === "ready") msg = "\u{1F389} Ready for liftoff! The launch window opens in <b id=\"pjcd\">" + left(PJ_OPEN) + "</b>";
  else if (p === "go") msg = '\u{1F680} Fuel tanks full! <button class="btn small gold" data-pj="open">Launch the S.S. Duck!</button>';
  else if (p === "landed") msg = "\u{1FA90} You landed on <b>Planet JP</b>! Launch #" + (pl.n || 1) + ((pl.streak || 0) > 1 ? " · \u{1F525} " + pl.streak + " days in a row" : "") + (pl.dust ? " · ⭐ " + pl.dust + " Stardust" : "");
  else msg = "\u{1F6D1} Mission scrubbed, try again tomorrow!";
  const tanks = p === "landed" || p === "scrubbed" ? "" : '<div class="pjtanks">' + f.tanks.map(t => '<span class="pjtank' + (t.have >= t.need ? " ok" : "") + '">' + t.icon + " " + esc(t.name) + " <b>" + Math.min(t.have, t.need) + "/" + t.need + "</b>" + (t.have >= t.need ? " ✅" : "") + "</span>").join("") + "</div>";
  return '<div class="pjbar ' + p + '"><div class="pjtrack"><div class="pjfill" style="width:' + (pct * 100).toFixed(1) + '%"></div>' +
    '<div class="pjship" style="left:' + (pct * 100).toFixed(1) + '%">' + duckHTML(cls) + (p === "go" || p === "ready" ? flameHTML() : "") + "</div>" +
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
document.addEventListener("click", ev => { const b = ev.target.closest && ev.target.closest('[data-pj="open"]'); if (b && C && !root?.contains(b)) openMC(); });

// called on every student page render. c = { st, cls, patch, preview, rerender, calm }
export function planetSync(c) {
  C = c;
  if (!tick) tick = setInterval(() => {
    if (!C) return; const el = document.getElementById("pjcd"), p = phase(C.st, C.cls);
    if (el) el.textContent = p === "ready" ? left(PJ_OPEN) : left(PJ_CLOSE);
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
    '<p class="pjsub small">More to explore on Planet JP is coming soon… come back tomorrow for another launch!</p>' +
    '<button class="btn gold" data-pj="done">Done</button></div>');
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
export function planetAdmin(students, cls) {
  const on = planetOn(cls), kids = students.filter(s => s.companionId && !s.isTeacher), today = azToday();
  const went = kids.filter(s => s.planet && s.planet.last === today), ready = kids.filter(s => !(s.planet && s.planet.last === today) && fuel(s, cls).full);
  return '<div class="card" id="pjCard"><div class="card-head"><h2>\u{1F680} Planet JP</h2><span class="fact">' + (on ? (schoolDayFor(cls, today) ? went.length + " launched today" : "no school today") : "off") + "</span></div>" +
    '<p class="lede" style="font-size:13.5px;">A launch bar across the top of every student’s Keep. It fills with <b>120 XP + 25 Math, Reading and Language</b>. Full tanks can launch the S.S. Duck from <b>11:00 to 12:55</b> (Arizona time); not full by 12:55 = “Mission scrubbed”. School days only (your calendar breaks are skipped). To try it yourself, open a student’s page in preview and press “Preview the launch”.</p>' +
    '<div class="row" style="margin:10px 0;gap:8px;"><button class="btn' + (on ? " ghost" : "") + '" data-act="pjToggle">' + (on ? "Turn Planet JP off" : "\u{1F680} Turn Planet JP on") + "</button></div>" +
    (on && (went.length || ready.length) ? '<p class="small" style="margin:4px 0;">' + (went.length ? "\u{1FA90} <b>Landed:</b> " + went.map(s => esc(s.name)).join(", ") : "") + (ready.length ? (went.length ? "<br>" : "") + "⛽ <b>Tanks full, not launched yet:</b> " + ready.map(s => esc(s.name)).join(", ") : "") + "</p>" : "") + "</div>";
}
