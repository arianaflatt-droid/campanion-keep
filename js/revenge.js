/* ---------- 🦃 Turducken's Revenge: The Great Break Escape (Thanksgiving break mini event, Nov 2026) ----------
   The Turducken escapes Companion Keep and each student chases him on their own through 5 chapters (all open on the
   start day), then an endless Turducken Tower. A fast tap-to-attack arcade fight, one 20-second round per ⚡ energy.
   ⚡ Energy: 1 for every 10 XP on each event day (any subject; days from cls.revenge.from to .to, whenever the XP is pasted).
   Power-ups from schoolwork on event days: 🥧 Pie Bomb (each 25 Math), 📖 Storybook Shield (each 25 Reading),
   📣 Battle Cry (each 25 Language), 🔥 Rage Mode (each 120 XP day). Subject swaps (cls.subSwap) count.
   The boss's HP saves between rounds (no losing progress). One save at the end of each round.
   Class switch: cls.revenge = { on, id, from, to }. Student save: revenge = { id, used, hp{n}, mh[3], beat{n}, pw{pie,shield,cry,rage},
     tw, th, best, fe, got{}, rounds }. Rewards use fields students may write (rules countsOk): candyBonus, doorEggs, eggBoost,
   legendaryPulls, outfits, roomOwned, revengeLeg (✨ Sparkle Turducken egg, hatched by the server kind "revenge"). */
import { esc, SEASON } from "./game.js?v=20261113j";
import { azToday } from "./collect.js?v=20261113j";
import { subFor } from "./teams.js?v=20261113j";

export const PER_ENERGY = 10, ROUND_SEC = 20;
const A = "assets/revenge/";
export const CHAPTERS = [
  { n: 1, name: "Kitchen Chaos", icon: "\u{1F357}", bg: A + "bg-kitchen.webp", boss: "assets/gobble/turducken.webp", hp: 3000, atk: 3.6,
    intro: "The Turducken is stealing the Thanksgiving turkey! Stop him!", reward: "100 corn + the Turkey Chaser badge" },
  { n: 2, name: "Pie Bandit Rooftops", icon: "\u{1F967}", bg: A + "bg-rooftops.webp", boss: A + "tk-angry.webp", hp: 6000, atk: 3.0, gim: "pie",
    intro: "He's throwing pies from the rooftops! Wipe the splats off your screen!", reward: "an egg" },
  { n: 3, name: "Corn Maze Ambush", icon: "\u{1F33D}", bg: A + "bg-maze.webp", boss: A + "tk-angry.webp", hp: 8000, atk: 3.0, gim: "maze",
    intro: "He's hiding in the corn maze! Hit him when he pops out!", reward: "the Pie Hat" },
  { n: 4, name: "Parade Float Panic", icon: "\u{1F388}", bg: A + "bg-parade.webp", boss: A + "tk-float.webp", hp: 10000, atk: 2.8, gim: "minions",
    intro: "He took over the parade! Pop his 3 balloon guards first!", reward: "a Rare+ egg" },
  { n: 5, name: "MEGA TURDUCKEN", icon: "\u{1F4A5}", bg: A + "bg-mega.webp", boss: A + "tk-mega.webp", hp: 20000, atk: 2.8, gim: "mega",
    intro: "This is it. MEGA TURDUCKEN. Three phases. Don't give up!", reward: "✨ a Sparkle Turducken, the Turkey Tamer badge and the Golden Turducken Trophy" }
];
const TOWER = { n: "tower", name: "Turducken Tower", icon: "\u{1F5FC}", bg: A + "bg-mega.webp", atk: 2.4 };
const towerHP = w => 2500 + 700 * (w - 1);
const MINION_HP = 300;
const TAUNTS = [
  "You'll never catch me! I've got the turkey AND the pie! GOBBLE GOBBLE!",
  "Bet you can't get past my pie army! Splat splat!",
  "Lost in the corn maze yet? I know every row… hee hee!",
  "I'm the star of the parade now! Nobody can pop MY balloons!",
  "I've grown into MEGA TURDUCKEN! Your little taps can't hurt me!",
  "Still chasing me? Impressive… but I'm still the king of Thanksgiving!",
  "Okay, okay, you're good. But are you good enough for my TOWER?"
];

/* ---------- state ---------- */
export const rvOn = cls => !!(cls && cls.revenge && cls.revenge.on && cls.revenge.id);
const win = cls => { const r = (cls && cls.revenge) || {}; return { from: r.from || "2026-11-23", to: r.to || "2026-11-29" }; };
const shiftDay = (iso, n) => { const [y, m, d] = iso.split("-").map(Number), x = new Date(y, m - 1, d + n); return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0"); };
function eventDays(cls) { const { from, to } = win(cls), today = azToday(), out = []; for (let d = from; d <= to && d <= today && out.length < 40; d = shiftDay(d, 1)) out.push(d); return out; }
export const rvStarted = cls => rvOn(cls) && azToday() >= win(cls).from;
export function rvOf(st, cls) {
  const r = st && st.revenge, id = cls && cls.revenge && cls.revenge.id;
  return r && r.id === id ? r : { id };
}
const dayXP = (st, d) => { const h = ((st && st.xpHist) || {})[d] || {}; return Math.max(Number(h.d) || 0, Number(h.l) || 0, Number(h.mo) || 0); };
const subOn = (st, cls, d, k) => Number((((((st && st.xpHist) || {})[d]) || {}).sub || {})[subFor(cls, st, k)]) || 0;
export function rvStock(st, cls) {
  const r = rvOf(st, cls), pw = r.pw || {}, days = eventDays(cls);
  let en = 0, pie = 0, shield = 0, cry = 0, rage = 0;
  days.forEach(d => { en += Math.floor(dayXP(st, d) / PER_ENERGY); pie += Math.floor(subOn(st, cls, d, "m") / 25); shield += Math.floor(subOn(st, cls, d, "r") / 25); cry += Math.floor(subOn(st, cls, d, "l") / 25); if (dayXP(st, d) >= 120) rage++; });
  return { energy: Math.max(0, en - (Number(r.used) || 0)), pie: Math.max(0, pie - (Number(pw.pie) || 0)), shield: Math.max(0, shield - (Number(pw.shield) || 0)),
    cry: Math.max(0, cry - (Number(pw.cry) || 0)), rage: Math.max(0, rage - (Number(pw.rage) || 0)) };
}
const hpLeft = (r, ch) => Math.max(0, ch.hp - (Number((r.hp || {})[ch.n]) || 0));
const beaten = (r, n) => !!((r.beat || {})[n]);
export const rvBeatCount = (st, cls) => CHAPTERS.filter(ch => beaten(rvOf(st, cls), ch.n)).length;
export const rvBest = (st, cls) => Number(rvOf(st, cls).best) || 0;

/* ---------- My Companion card / checklist ---------- */
export function revengeCard(st, cls) {
  if (!rvOn(cls) || !st) return "";
  const k = rvStock(st, cls), n = rvBeatCount(st, cls), started = rvStarted(cls);
  const next = CHAPTERS.find(ch => !beaten(rvOf(st, cls), ch.n));
  return '<div class="card rvcard"><img class="rvcard-tk" src="' + A + 'tk-angry.webp" alt=""><div class="rvcard-txt"><h3>\u{1F983} Turducken’s Revenge!</h3>' +
    (started ? "<p><b>⚡ " + k.energy + "</b> energy · " + (n >= 5 ? "\u{1F5FC} Tower best: wave <b>" + rvBest(st, cls) + "</b>" : "Chapter <b>" + (next ? next.n : 5) + "</b> of 5: " + esc(next ? next.name : "")) + "</p>" +
      '<p class="small">Every 10 XP = 1 ⚡. Math, Reading and Language give power-ups!</p><button class="btn gold" data-rv="open">\u{1F983} Chase the Turducken!</button>'
      : "<p>The Turducken escapes on <b>" + dayLabel(win(cls).from) + "</b>! Get ready…</p>") + "</div></div>";
}
const dayLabel = iso => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }); };

/* ---------- the event screen (its own layer on top of the page, so page redraws never interrupt a fight) ---------- */
let C = null;      // { st, cls, students, patch, flash }
let view = null;   // null | "hub" | { fight } | { result }
let root = null;
export const revengeBusy = () => !!view;
function rootEl() { if (!root) { root = document.createElement("div"); root.id = "rvroot"; document.body.appendChild(root); root.addEventListener("pointerdown", onDown); root.addEventListener("click", onClick); } return root; }
// called on every student page render
export function revengeSync(c) {
  C = c;
  if (view && !rvOn(c.cls)) { view = null; F = null; }
  if (view === "hub") drawHub();
  if (!view && root) root.innerHTML = "";
}
document.addEventListener("click", ev => { const b = ev.target.closest && ev.target.closest('[data-rv="open"]'); if (b && C && rvStarted(C.cls)) { view = "hub"; drawHub(); } });

function stockRow(k) {
  return '<div class="rvstock"><span title="Energy">⚡ <b>' + k.energy + "</b></span><span title=\"Pie Bombs (25 Math each)\">\u{1F967} <b>" + k.pie + "</b></span>" +
    '<span title="Storybook Shields (25 Reading each)">\u{1F4D6} <b>' + k.shield + '</b></span><span title="Battle Cries (25 Language each)">\u{1F4E3} <b>' + k.cry + "</b></span>" +
    '<span title="Rage Modes (each 120 XP day)">\u{1F525} <b>' + k.rage + "</b></span></div>";
}
function drawHub() {
  if (!C || !C.st) return;
  const st = C.st, cls = C.cls, r = rvOf(st, cls), k = rvStock(st, cls), days = eventDays(cls), allBeat = beaten(r, 5);
  const taunt = allBeat ? TAUNTS[6] : TAUNTS[Math.min(5, Math.max(0, days.length - 1))];
  let h = '<div class="rvover"><div class="rvtop"><b>\u{1F983} Turducken’s Revenge</b>' + stockRow(k) + '<button class="btn ghost small" data-rv="close">✕</button></div><div class="rvhub">';
  h += '<div class="rvtaunt"><img src="' + A + (allBeat ? "tk-mega.webp" : "tk-angry.webp") + '" alt=""><div class="rvbubble">“' + esc(taunt) + "”</div></div>";
  h += '<p class="rvhow">Every <b>10 XP</b> = 1 ⚡ (one 20-second round). Tap the Turducken to hit him, fill the \u{1F525} combo for a <b>Super Peck</b>, and tap <b>DODGE</b> when you see <b>!</b> · ' +
    "\u{1F967} each 25 Math · \u{1F4D6} each 25 Reading · \u{1F4E3} each 25 Language · \u{1F525} each 120 XP day</p>";
  h += '<div class="rvchaps">' + CHAPTERS.map(ch => { const left = hpLeft(r, ch), done = beaten(r, ch.n), pct = left / ch.hp * 100;
    return '<div class="rvchap' + (done ? " done" : "") + '" style="background-image:linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.72)),url(' + ch.bg + ')"><span class="rvn">' + ch.n + "</span>" +
      "<b>" + ch.icon + " " + esc(ch.name) + "</b>" + (done ? '<span class="rvdone">✅ Beaten!</span>' : '<span class="rvhp"><i style="width:' + pct.toFixed(1) + '%"></i></span><small>' + left.toLocaleString() + " HP left</small>") +
      '<small class="rvrw">\u{1F381} ' + esc(ch.reward) + "</small>" +
      (done ? "" : '<button class="btn small' + (k.energy ? " gold" : "") + '" data-rv="fight" data-n="' + ch.n + '"' + (k.energy ? "" : " disabled") + ">⚔️ Fight!</button>") + "</div>"; }).join("") + "</div>";
  h += '<div class="rvtower' + (allBeat ? "" : " locked") + '"><b>\u{1F5FC} Turducken Tower</b> ' + (allBeat
    ? "Wave <b>" + (Number(r.tw) || 1) + "</b> · best: wave " + (Number(r.best) || 0) + ' <button class="btn small gold" data-rv="fight" data-n="tower"' + (k.energy ? "" : " disabled") + ">🗼 Climb!</button>" +
      '<br><small>Wave 5: 50 corn · 10: an egg · 15: a Golden Feather · 20, 30, 40…: a Rare+ egg. The highest wave goes in the Hall of Fame!</small>'
    : "<small>\u{1F512} Beat MEGA TURDUCKEN to unlock endless mode.</small>") + "</div>";
  h += '<div class="rvfeath"><img class="rvfeathic" src="' + A + 'golden-feather.webp" alt="" onerror="this.replaceWith(\'\u{1FAB6}\')"> Golden Feathers: <b>' + ((Number(r.fe) || 0) % 5) + " / 5</b> <small>(rare drops after a round — 5 = a Legendary egg)</small></div>";
  // the chase board: where everyone is (classmates' cards)
  const rows = (C.students || []).filter(s => s.companionId && !s.isTeacher).map(s => ({ s, n: rvBeatCount(s, cls), w: rvBest(s, cls) })).filter(x => x.n || x.w).sort((a, b) => b.n - a.n || b.w - a.w).slice(0, 12);
  if (rows.length) h += '<div class="rvboard"><b>\u{1F3C3} The Chase</b>' + rows.map((x, i) => '<span class="' + (x.s.id === st.id ? "me" : "") + '">' + (i + 1) + ". " + esc(String(x.s.name || "").split(" ")[0]) + " — " + (x.n >= 5 ? "\u{1F3C6} MEGA beaten" + (x.w ? " · wave " + x.w : "") : "chapter " + (x.n + 1)) + "</span>").join("") + "</div>";
  rootEl().innerHTML = h + "</div></div>";
}

/* ---------- the arcade fight ---------- */
let F = null, raf = 0;
const now = () => performance.now();
function chOf(n) { return n === "tower" ? TOWER : CHAPTERS.find(c => c.n === Number(n)); }
function startFight(n) {
  const st = C.st, cls = C.cls, r = rvOf(st, cls), k = rvStock(st, cls), ch = chOf(n);
  if (!ch || !k.energy || (n !== "tower" && beaten(r, ch.n)) || (n === "tower" && !beaten(r, 5))) return;
  const tower = n === "tower", tw = Number(r.tw) || 1;
  F = { n, ch, tower, t0: now() + 1400, end: 0, dmg: 0, combo: 0, cryUntil: 0, rage: false, shield: false, last: 0, nextAtk: 0, tele: 0, dodged: false,
    max: tower ? towerHP(tw) : ch.hp, done0: tower ? Number(r.th) || 0 : Number((r.hp || {})[ch.n]) || 0, wave: tw, waves: 0,
    mh: (r.mh || [0, 0, 0]).slice(0, 3), splats: [], hole: 1, holeT: 0, shown: true, used: { pie: 0, shield: 0, cry: 0, rage: 0 }, k, over: false };
  if (ch.gim === "minions" && F.done0 > 0) F.mh = [MINION_HP, MINION_HP, MINION_HP];   // already past the guards
  F.end = F.t0 + ROUND_SEC * 1000; F.nextAtk = F.t0 + ch.atk * 1000;
  view = { fight: true }; drawFight(); cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); sfx("start");
}
const left = () => Math.max(0, F.max - F.done0 - F.dmg);
const minionsUp = () => F.ch.gim === "minions" && F.mh.some(v => v < MINION_HP);
function phase() { if (F.ch.gim !== "mega") return 1; const p = left() / F.max; return p > 0.66 ? 1 : p > 0.33 ? 2 : 3; }
function mult() { return (F.rage ? 2 : 1) * (F.cryUntil > now() ? 2 : 1); }
function drawFight() {
  const ch = F.ch, k = F.k;
  const bossImg = F.tower ? (F.wave % 2 ? A + "tk-angry.webp" : A + "tk-mega.webp") : ch.boss;
  let h = '<div class="rvover"><div class="rvtop"><b>' + ch.icon + " " + esc(F.tower ? "Turducken Tower · wave " + F.wave : ch.name) + '</b><span class="rvtimer" id="rvT">' + ROUND_SEC + "</span></div>" +
    '<div class="rvstage g-' + (ch.gim || "none") + '" id="rvStage" style="background-image:url(' + ch.bg + ')">' +
    '<div class="rvbar"><i id="rvHP"></i><span id="rvHPt"></span></div>' +
    '<div class="rvcombo"><i id="rvCombo"></i><span>\u{1F525} COMBO</span></div>' +
    '<button class="rvboss" id="rvBoss" data-rv="hit" aria-label="Hit the Turducken"><img src="' + bossImg + '" alt="" draggable="false"></button>' +
    (ch.gim === "minions" ? [0, 1, 2].map(i => '<button class="rvmin" id="rvMin' + i + '" data-rv="min" data-i="' + i + '" style="left:' + (22 + i * 28) + '%"><img src="' + A + 'minion-balloon.webp" alt="" draggable="false" onerror="this.onerror=null;this.src=\'' + A + 'tk-angry.webp\';this.parentNode.classList.add(\'ph\')"><i></i></button>').join("") : "") +
    '<div class="rvwarn" id="rvWarn">!</div><div id="rvFx"></div>' +
    '<div class="rvcount" id="rvCount">' + esc(F.tower ? "Wave " + F.wave + "!" : ch.intro) + "</div></div>" +
    '<div class="rvbtns"><button class="rvdodge" data-rv="dodge">\u{1F4A8} DODGE</button>' +
    pwBtn("pie", "\u{1F967}", "Pie Bomb", k.pie) + pwBtn("shield", "\u{1F4D6}", "Shield", k.shield) + pwBtn("cry", "\u{1F4E3}", "Battle Cry", k.cry) + pwBtn("rage", "\u{1F525}", "Rage Mode", k.rage) + "</div></div>";
  rootEl().innerHTML = h; paint();
}
function pwBtn(key, icon, name, n) { return '<button class="rvpw" data-rv="pw" data-k="' + key + '" id="rvPw-' + key + '"' + (n ? "" : " disabled") + ">" + icon + " " + name + ' <b id="rvPwN-' + key + '">' + n + "</b></button>"; }
function paint() {
  if (!F) return; const $ = id => document.getElementById(id);
  const l = left(), hp = $("rvHP"), t = $("rvT"), cb = $("rvCombo");
  if (hp) hp.style.width = (l / F.max * 100).toFixed(1) + "%"; if ($("rvHPt")) $("rvHPt").textContent = l.toLocaleString() + " HP";
  if (cb) cb.style.width = Math.min(100, F.combo / 20 * 100) + "%";
  const tl = Math.max(0, Math.ceil((F.end - Math.max(now(), F.t0)) / 1000)); if (t) t.textContent = now() < F.t0 ? ROUND_SEC : tl;
  ["pie", "shield", "cry", "rage"].forEach(k => { const n = F.k[k] - F.used[k], b = $("rvPw-" + k), e = $("rvPwN-" + k); if (e) e.textContent = n; if (b) b.disabled = n <= 0 || (k === "rage" && F.rage) || (k === "shield" && F.shield); });
  const stg = $("rvStage"); if (stg) { stg.classList.toggle("p2", phase() === 2); stg.classList.toggle("p3", phase() === 3); stg.classList.toggle("cry", F.cryUntil > now()); stg.classList.toggle("rage", F.rage); stg.classList.toggle("shield", F.shield); }
  if (F.ch.gim === "minions") F.mh.forEach((v, i) => { const m = $("rvMin" + i); if (m) { m.style.display = v >= MINION_HP ? "none" : ""; const bar = m.querySelector("i"); if (bar) bar.style.width = (100 - v / MINION_HP * 100) + "%"; } });
}
function tick() {
  if (!F || F.over) return;
  const t = now(), $ = id => document.getElementById(id);
  if (t >= F.t0 && $("rvCount") && !F.go) { F.go = true; $("rvCount").textContent = "GO!"; setTimeout(() => { const c = $("rvCount"); if (c) c.style.display = "none"; }, 600); }
  if (t >= F.t0) {
    // the maze: he pops out of one of 3 rows, hides, pops out somewhere else
    if (F.ch.gim === "maze") { if (t > F.holeT) { F.shown = !F.shown; F.holeT = t + (F.shown ? 1300 : 450); if (F.shown) F.hole = Math.floor(Math.random() * 3); }
      const b = $("rvBoss"); if (b) { b.style.left = [15.5, 49.6, 84.6][F.hole] + "%"; b.classList.toggle("hid", !F.shown); } }
    // his attacks: wind up (!), then hit unless you dodged
    const sp = F.tower ? Math.max(1.2, TOWER.atk - F.wave * 0.05) : F.ch.atk * (phase() === 2 ? 0.78 : phase() === 3 ? 0.5 : 1);
    if (!F.tele && t >= F.nextAtk) { F.tele = t; F.dodged = false; const w = $("rvWarn"); if (w) w.classList.add("on"); const b = $("rvBoss"); if (b) b.classList.add("wind"); sfx("warn"); }
    if (F.tele && t - F.tele > 950) {
      const w = $("rvWarn"); if (w) w.classList.remove("on"); const b = $("rvBoss"); if (b) b.classList.remove("wind");
      if (F.dodged) { pop("DODGED! +50", "good"); addDmg(50, true); }
      else if (F.shield) { F.shield = false; pop("\u{1F4D6} BLOCKED!", "good"); sfx("block"); }
      else { F.combo = 0; pop(F.ch.gim === "pie" ? "SPLAT!" : "OUCH!", "bad"); sfx("ouch"); const s = $("rvStage"); if (s) { s.classList.add("hurt"); setTimeout(() => s.classList.remove("hurt"), 300); }
        if (F.ch.gim === "pie" || (F.tower && F.wave % 3 === 0)) addSplat(); }
      F.tele = 0; F.nextAtk = t + sp * 1000 * (0.8 + Math.random() * 0.4);
    }
    if (t >= F.end || left() <= 0) return finish();
  }
  paint(); raf = requestAnimationFrame(tick);
}
function addSplat() {
  const fx = document.getElementById("rvStage"); if (!fx || F.splats.length >= 3) return;
  const id = "sp" + Math.random().toString(36).slice(2, 7), x = 15 + Math.random() * 60, y = 18 + Math.random() * 50;
  const el = document.createElement("button"); el.className = "rvsplat"; el.dataset.rv = "splat"; el.id = id; el.style.left = x + "%"; el.style.top = y + "%"; el.dataset.hp = "2";
  el.innerHTML = '<img src="' + A + 'fx-pie-splat.webp" alt="" draggable="false">'; fx.appendChild(el); F.splats.push(id);
}
function addDmg(n, quiet) {
  F.total = (F.total || 0) + n;
  if (F.tower) {
    F.dmg += n;
    while (F.done0 + F.dmg >= F.max) {   // next wave!
      const over = F.done0 + F.dmg - F.max; F.waves++; F.wave++; F.done0 = 0; F.dmg = over; F.max = towerHP(F.wave);
      pop("\u{1F5FC} WAVE " + (F.wave - 1) + " CLEARED!", "big"); sfx("win");
      const top = document.querySelector(".rvtop b"); if (top) top.textContent = "\u{1F5FC} Turducken Tower · wave " + F.wave;
      const bi = document.querySelector("#rvBoss img"); if (bi) bi.src = F.wave % 2 ? A + "tk-angry.webp" : A + "tk-mega.webp";
    }
  } else F.dmg = Math.min(F.max - F.done0, F.dmg + n);
  if (!quiet) floatNum(n);
}
function floatNum(n) {
  const fx = document.getElementById("rvFx"); if (!fx) return;
  const e = document.createElement("span"); e.className = "rvdmg" + (n >= 100 ? " big" : ""); e.textContent = "-" + n; e.style.left = (38 + Math.random() * 24) + "%"; e.style.top = (30 + Math.random() * 20) + "%";
  fx.appendChild(e); setTimeout(() => e.remove(), 700);
}
function pop(text, kind) {
  const fx = document.getElementById("rvFx"); if (!fx) return;
  const e = document.createElement("div"); e.className = "rvpop " + (kind || ""); e.textContent = text; fx.appendChild(e); setTimeout(() => e.remove(), 1000);
}
function hitBoss() {
  const t = now(); if (!F || F.over || t < F.t0 || t - F.last < 55) return; F.last = t;
  if (F.ch.gim === "maze" && !F.shown) return;
  if (minionsUp()) { pop("Pop the balloons first!", "bad"); return; }
  const m = mult(); addDmg(10 * m); F.combo++; sfx("tap");
  const b = document.getElementById("rvBoss"); if (b) { b.classList.remove("ow"); void b.offsetWidth; b.classList.add("ow"); }
  if (F.combo >= 20) { F.combo = 0; addDmg(400 * m, true); pop("\u{1F4A5} SUPER PECK! -" + 400 * m, "big"); sfx("super"); }
}
function hitMinion(i) {
  const t = now(); if (!F || t < F.t0 || t - F.last < 55) return; F.last = t;
  F.mh[i] = Math.min(MINION_HP, F.mh[i] + 15 * mult()); sfx("tap"); if (F.mh[i] >= MINION_HP) { pop("\u{1F388} POP!", "good"); sfx("pop"); }
}
function usePw(k) {
  if (!F || now() < F.t0 || F.k[k] - F.used[k] <= 0) return;
  if (k === "rage" && F.rage) return; if (k === "shield" && F.shield) return;
  F.used[k]++;
  if (k === "pie") { if (minionsUp()) { F.mh = [MINION_HP, MINION_HP, MINION_HP]; pop("\u{1F967} PIE BOMB! All the balloons popped!", "big"); } else { addDmg(1500 * (F.rage ? 2 : 1), true); pop("\u{1F967} PIE BOMB! -" + 1500 * (F.rage ? 2 : 1), "big"); } sfx("super"); }
  if (k === "shield") { F.shield = true; pop("\u{1F4D6} Storybook Shield up!", "good"); }
  if (k === "cry") { F.cryUntil = now() + 10000; pop("\u{1F4E3} BATTLE CRY! Double damage!", "big"); sfx("super"); }
  if (k === "rage") { F.rage = true; pop("\u{1F525} RAGE MODE! Double damage all round!", "big"); sfx("super"); }
  paint();
}
async function finish() {
  F.over = true; cancelAnimationFrame(raf);
  const st = C.st, cls = C.cls, r0 = rvOf(st, cls), r = JSON.parse(JSON.stringify(r0)), ch = F.ch, today = azToday(), cur = SEASON.cur || "corn";
  r.id = cls.revenge.id; r.used = (Number(r.used) || 0) + 1; r.rounds = (Number(r.rounds) || 0) + 1;
  r.pw = Object.assign({ pie: 0, shield: 0, cry: 0, rage: 0 }, r.pw || {}); Object.keys(F.used).forEach(k => { r.pw[k] = (Number(r.pw[k]) || 0) + F.used[k]; });
  r.got = r.got || {}; r.beat = r.beat || {}; r.hp = r.hp || {};
  const data = {}, won = [];
  const give = { corn: n => { data.candyBonus = (Number(data.candyBonus != null ? data.candyBonus : st.candyBonus) || 0) + n; }, egg: () => { data.doorEggs = (Number(data.doorEggs != null ? data.doorEggs : st.doorEggs) || 0) + 1; },
    rare: () => { give.egg(); const eb = Object.assign({}, st.eggBoost || {}, data.eggBoost || {}); eb.rare = (Number(eb.rare) || 0) + 1; data.eggBoost = eb; },
    leg: () => { data.legendaryPulls = (Number(st.legendaryPulls) || 0) + 1; } };
  let victory = false;
  if (F.tower) {
    r.tw = F.wave; r.th = F.done0 + F.dmg; const cleared = F.wave - 1; r.best = Math.max(Number(r.best) || 0, cleared);
    for (let w = cleared - F.waves + 1; w <= cleared; w++) {
      if (w === 5 && !r.got.w5) { r.got.w5 = 1; give.corn(50); won.push("50 " + cur + " (wave 5)"); }
      if (w === 10 && !r.got.w10) { r.got.w10 = 1; give.egg(); won.push("an egg (wave 10)"); }
      if (w === 15 && !r.got.w15) { r.got.w15 = 1; r.fe = (Number(r.fe) || 0) + 1; won.push("a Golden Feather (wave 15)"); }
      if (w >= 20 && w % 10 === 0 && !r.got["w" + w]) { r.got["w" + w] = 1; give.rare(); won.push("a Rare+ egg (wave " + w + ")"); }
    }
  } else {
    r.hp[ch.n] = Math.min(ch.hp, (Number(r.hp[ch.n]) || 0) + F.dmg);
    if (ch.gim === "minions") r.mh = F.mh;
    if (r.hp[ch.n] >= ch.hp && !r.beat[ch.n]) {
      victory = true; r.beat[ch.n] = today;
      if (ch.n === 1 && !r.got.c1) { r.got.c1 = 1; give.corn(100); won.push("100 " + cur, "\u{1F983} the Turkey Chaser badge"); }
      if (ch.n === 2 && !r.got.c2) { r.got.c2 = 1; give.egg(); won.push("\u{1F95A} an egg"); }
      if (ch.n === 3 && !r.got.c3) { r.got.c3 = 1; data.outfits = Object.assign({}, st.outfits || {}, { "rv-piehat": true }); won.push("\u{1F967} the Pie Hat (wear it from your Gear!)"); }
      if (ch.n === 4 && !r.got.c4) { r.got.c4 = 1; give.rare(); won.push("\u{1F95A} a Rare+ egg"); }
      if (ch.n === 5 && !r.got.c5) { r.got.c5 = 1; data.revengeLeg = (Number(st.revengeLeg) || 0) + 1;
        const ro = (st.roomOwned || []).slice(); if (!ro.includes("trophy_revenge")) ro.push("trophy_revenge"); data.roomOwned = ro;
        won.push("✨ a SPARKLE TURDUCKEN egg (hatch it in your Creature Collector!)", "\u{1F3C6} the Golden Turducken Trophy (put it in My Room)", "\u{1F396}️ the Turkey Tamer badge", "\u{1F5FC} Turducken Tower is open!"); }
    }
  }
  // ✨ Golden Feather: a rare drop after any round (5 = a Legendary egg)
  if (Math.random() < (ch.gim === "mega" || F.tower ? 0.15 : 0.1)) { r.fe = (Number(r.fe) || 0) + 1; won.push("\u{1FAB6} a Golden Feather!"); }
  const fe = Number(r.fe) || 0; for (let f = 5; f <= fe; f += 5) if (!r.got["f" + f]) { r.got["f" + f] = 1; give.leg(); won.push("\u{1F31F} 5 Golden Feathers = a Legendary egg!"); }
  data.revenge = r;
  view = { result: { victory, won, dmg: F.tower ? F.total || 0 : F.dmg, ch, tower: F.tower, waves: F.waves, wave: F.wave, left: F.tower ? 0 : ch.hp - r.hp[ch.n] } };
  drawResult(true);
  try { await C.patch(data); Object.assign(C.st, data); }
  catch (e) { view.result.err = (e && (e.code || e.message)) || "error"; }
  drawResult(false); if (victory) sfx("win");
  F = null;
}
function drawResult(saving) {
  const R = view && view.result; if (!R) return;
  const ch = R.ch;
  let h = '<div class="rvover"><div class="rvresult' + (R.victory ? " win" : "") + '" style="background-image:linear-gradient(180deg,rgba(20,8,0,.55),rgba(20,8,0,.85)),url(' + ch.bg + ')">';
  if (R.victory) h += '<div class="rvconf">' + Array.from({ length: 24 }, (_, i) => '<i style="left:' + (i * 4.2) + "%;animation-delay:" + (i % 6) * 0.15 + "s;background:" + ["#FFC94A", "#E2552B", "#7CD66B", "#4AA3FF", "#FF7AB8", "#fff"][i % 6] + '"></i>').join("") + "</div>" +
    '<img class="rvwinimg" src="' + (ch.n === 5 ? A + "trophy-golden.webp" : ch.boss) + '" alt=""><h2>' + (ch.n === 5 ? "YOU BEAT MEGA TURDUCKEN!!" : "YOU BEAT " + esc(ch.name.toUpperCase()) + "!") + "</h2>";
  else if (R.tower) h += '<h2>\u{1F5FC} ' + (R.waves ? "You cleared " + R.waves + " wave" + (R.waves === 1 ? "" : "s") + "!" : "Round over!") + "</h2><p>You’re on wave <b>" + R.wave + "</b>. You did <b>" + R.dmg.toLocaleString() + "</b> damage.</p>";
  else h += "<h2>Round over!</h2><p>You did <b>" + R.dmg.toLocaleString() + "</b> damage. The Turducken has <b>" + R.left.toLocaleString() + "</b> HP left — your hits are saved!</p>";
  if (R.won.length) h += '<div class="rvwon">' + R.won.map(w => "<span>" + esc(w) + "</span>").join("") + "</div>";
  h += saving ? '<p class="small">Saving…</p>' : R.err ? '<p class="small">⚠️ That didn’t save (' + esc(R.err) + "). Ask Ms. Ariana.</p>" : "";
  const k = C && C.st ? rvStock(C.st, C.cls) : { energy: 0 };
  if (!saving) h += '<div class="row" style="justify-content:center;gap:10px;margin-top:10px;">' +
    (!R.victory && k.energy ? '<button class="btn big gold" data-rv="fight" data-n="' + (R.tower ? "tower" : ch.n) + '">Again! · ' + k.energy + " energy left</button>" : "") +
    '<button class="btn big" data-rv="hub">Back to the chase</button></div>';
  rootEl().innerHTML = h + "</div></div>";
}

/* ---------- input ---------- */
function onDown(ev) {
  ev.stopPropagation();   // fight taps stay inside the event screen (the page underneath holds its redraws while a finger is down)
  const el = ev.target.closest("[data-rv]"); if (!el || !F) return;
  const a = el.dataset.rv;
  if (a === "hit") { ev.preventDefault(); hitBoss(); }
  else if (a === "min") { ev.preventDefault(); hitMinion(Number(el.dataset.i)); }
  else if (a === "splat") { ev.preventDefault(); const n = Number(el.dataset.hp) - 1; if (n <= 0) { F.splats = F.splats.filter(x => x !== el.id); el.remove(); sfx("pop"); } else { el.dataset.hp = n; el.style.opacity = 0.55; } }
  else if (a === "dodge") { ev.preventDefault(); if (F.tele && !F.dodged) { F.dodged = true; sfx("dodge"); } }
  else if (a === "pw") { ev.preventDefault(); usePw(el.dataset.k); }
}
function onClick(ev) {
  const el = ev.target.closest("[data-rv]"); if (!el) return;
  const a = el.dataset.rv;
  if (a === "close") { view = null; F = null; cancelAnimationFrame(raf); rootEl().innerHTML = ""; return; }
  if (a === "hub") { view = "hub"; drawHub(); return; }
  if (a === "fight") { if (C && C.preview) { C.flash("This is a teacher preview — nothing is saved."); return; } startFight(el.dataset.n === "tower" ? "tower" : Number(el.dataset.n)); }
}

/* ---------- sound (Web Audio, no files) ---------- */
let AC = null;
function sfx(k) {
  try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === "suspended") AC.resume(); } catch (e) { return; }
  const t = AC.currentTime, tone = (f, d, type, v, at, to) => { const o = AC.createOscillator(), g = AC.createGain(); o.type = type || "square"; o.frequency.setValueAtTime(f, t + (at || 0)); if (to) o.frequency.exponentialRampToValueAtTime(to, t + (at || 0) + d);
    g.gain.setValueAtTime(v || 0.08, t + (at || 0)); g.gain.exponentialRampToValueAtTime(0.001, t + (at || 0) + d); o.connect(g); g.connect(AC.destination); o.start(t + (at || 0)); o.stop(t + (at || 0) + d + 0.02); };
  if (k === "tap") tone(520 + Math.random() * 160, 0.06, "square", 0.04);
  if (k === "super") { tone(330, 0.12, "sawtooth", 0.08); tone(660, 0.2, "square", 0.07, 0.08); tone(990, 0.25, "square", 0.06, 0.16); }
  if (k === "warn") tone(880, 0.12, "triangle", 0.09, 0, 660);
  if (k === "ouch") tone(200, 0.25, "sawtooth", 0.1, 0, 90);
  if (k === "dodge") tone(500, 0.15, "sine", 0.1, 0, 1200);
  if (k === "block") { tone(300, 0.1, "square", 0.08); tone(450, 0.15, "square", 0.08, 0.08); }
  if (k === "pop") tone(900, 0.08, "triangle", 0.1, 0, 300);
  if (k === "start") [392, 523, 659].forEach((f, i) => tone(f, 0.15, "square", 0.06, i * 0.12));
  if (k === "win") [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, "square", 0.07, i * 0.13));
}

/* ---------- console card ---------- */
export function revengeAdmin(students, cls) {
  const on = rvOn(cls), w = win(cls), kids = students.filter(s => s.companionId && !s.isTeacher).slice().sort((a, b) => String(a.name).localeCompare(String(b.name)));
  let h = '<div class="card"><div class="card-head"><h2>\u{1F983} Turducken’s Revenge</h2><span class="fact">' + (on ? (rvStarted(cls) ? "running" : "starts " + w.from) : "off") + "</span></div>" +
    '<p class="lede" style="font-size:13.5px;">Thanksgiving break event: each student chases the Turducken through 5 chapters (all open on the first day) with a fast tap-to-attack fight, then an endless Turducken Tower. ' +
    "Every 10 XP on the event days = 1 ⚡ round (XP counts whenever you paste it). 25 Math / Reading / Language and 120 XP days give power-ups. Beating MEGA TURDUCKEN gives a ✨ Sparkle Turducken egg, the Turkey Tamer badge and the Golden Turducken Trophy.</p>" +
    '<div class="row" style="gap:10px;align-items:flex-end;flex-wrap:wrap;margin:6px 0;"><div class="field"><label for="rvFrom">First day</label><input id="rvFrom" type="date" value="' + esc(w.from) + '"></div>' +
    '<div class="field"><label for="rvTo">Last day</label><input id="rvTo" type="date" value="' + esc(w.to) + '"></div>' +
    '<button class="btn' + (on ? " ghost" : "") + '" data-act="rvToggle">' + (on ? "Turn off" : "\u{1F983} Turn on") + "</button>" + (on ? '<button class="btn ghost small" data-act="rvDates">Save dates</button>' : "") + "</div>";
  if (on) h += '<div style="overflow-x:auto;"><table class="mini"><thead><tr><th>Student</th><th>⚡ left</th><th>Chapters</th><th>Now fighting</th><th>Tower</th><th>\u{1FAB6}</th><th>Rounds</th><th></th></tr></thead><tbody>' +
    kids.map(s => { const r = rvOf(s, cls), k = rvStock(s, cls), n = rvBeatCount(s, cls), nx = CHAPTERS.find(ch => !beaten(r, ch.n));
      return "<tr><td><b>" + esc(s.name) + "</b></td><td>" + k.energy + "</td><td>" + n + " / 5" + (n >= 5 ? " \u{1F3C6}" : "") + "</td><td>" + (nx ? nx.icon + " " + Math.round(hpLeft(r, nx) / nx.hp * 100) + "% HP left" : "—") + "</td>" +
        "<td>" + (n >= 5 ? "wave " + (Number(r.tw) || 1) + " (best " + (Number(r.best) || 0) + ")" : "") + "</td><td>" + (Number(r.fe) || 0) + "</td><td>" + (Number(r.rounds) || 0) + "</td>" +
        '<td><button class="btn ghost small" data-act="rvReset" data-id="' + esc(s.id) + '">Reset</button></td></tr>'; }).join("") + "</tbody></table></div>";
  return h + "</div>";
}
// console clicks: returns { cls: classUpdate } or { student: [id, update] } or null
export function revengeAction(act, el, cls) {
  const from = (document.getElementById("rvFrom") || {}).value || win(cls).from, to = (document.getElementById("rvTo") || {}).value || win(cls).to;
  if (act === "rvToggle") return { cls: rvOn(cls) ? { "revenge.on": false } : { revenge: { on: true, id: (cls.revenge && cls.revenge.id) || "rv-" + Date.now(), from, to } } };
  if (act === "rvDates") return { cls: { "revenge.from": from, "revenge.to": to } };
  if (act === "rvReset") return { student: [el.dataset.id, { revenge: { id: cls.revenge && cls.revenge.id } }] };
  return null;
}
