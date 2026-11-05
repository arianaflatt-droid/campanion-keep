/* ---------- 🎄 The Grinch-a-Duck's Great Present Heist (Christmas break event, Dec 2026) ----------
   Built like Turducken's Revenge (js/revenge.js): each student chases the Grinch-a-Duck ON THEIR OWN (no class meter)
   with the same fast tap-to-attack arcade fight, one 20-second round per ⚡ energy.
   10 chapters: chapter 1 opens on the first day; each later chapter opens on its date (CH.day = days after the first day)
   OR as soon as the student beats the chapter before it (students can race ahead). Then the endless Present Mountain.
   🎁 Christmas Day (first day + 4): a free present to open (+5 energy, 25 currency and an egg), once.
   ⚡ Energy: 1 for every 10 XP on each event day (cls.heist.from to .to, whenever the XP is pasted).
   Power-ups from schoolwork on event days: ❄️ Snowball Bomb (each 25 Math), ☕ Cocoa Shield (each 25 Reading),
   🔔 Jingle Blast (each 25 Language), 🎄 Holiday Spirit (each 120 XP day). Subject swaps (cls.subSwap) count.
   The boss's HP saves between rounds. One save at the end of each round.
   Class switch: cls.heist = { on, id, from, to }. Student save: heist = { id, used, bonus, hp{n}, mh{n:[3]}, beat{n}, pw{pie,shield,cry,rage},
     tw, th, best, bells, got{}, rounds }. Rewards use fields students may write (rules countsOk): candyBonus, doorEggs, eggBoost,
   legendaryPulls, outfits, roomOwned, heistLeg (✨ Sparkle Grinch-a-Duck egg, hatched by the server kind "heist"). */
import { esc, SEASON } from "./game.js?v=20261104n";
import { azToday } from "./collect.js?v=20261104n";
import { subFor } from "./teams.js?v=20261104n";

export const PER_ENERGY = 10, ROUND_SEC = 20, XMAS_DAY = 4;
const A = "assets/heist/";
export const CHAPTERS = [
  { n: 1, day: 0, name: "Toy Workshop", icon: "\u{1F9F8}", bg: A + "bg-workshop.webp", boss: A + "gd-base.webp", hp: 3000, atk: 3.6,
    intro: "The Grinch-a-Duck is stealing the toys! Stop him!", reward: "100 {cur} + the Present Chaser badge" },
  { n: 2, day: 1, name: "Snowy Rooftops", icon: "❄️", bg: A + "bg-rooftops.webp", boss: A + "gd-angry.webp", hp: 5000, atk: 3.0, gim: "splat", splat: A + "fx-snow-splat.webp",
    intro: "He's throwing snowballs from the rooftops! Wipe the snow off your screen!", reward: "50 {cur}" },
  { n: 3, day: 2, name: "Candy Cane Forest", icon: "\u{1F36C}", bg: A + "bg-forest.webp", boss: A + "gd-peek.webp", hp: 6000, atk: 3.0, gim: "maze",
    intro: "He's hiding behind the candy canes! Hit him when he peeks out!", reward: "the Heist Hat" },
  { n: 4, day: 3, name: "Toy Factory", icon: "\u{1F3ED}", bg: A + "bg-factory.webp", boss: A + "gd-angry.webp", hp: 7000, atk: 2.9, gim: "minions", minImg: A + "minion-toy.webp", minName: "toy soldiers",
    intro: "He wound up 3 toy soldiers to guard him! Knock them down first!", reward: "75 {cur}" },
  { n: 5, day: 5, name: "Frozen Lake", icon: "⛸️", bg: A + "bg-lake.webp", boss: A + "gd-skate.webp", hp: 8000, atk: 2.9, gim: "slide",
    intro: "He's skating all over the frozen lake! Follow him and keep tapping!", reward: "an egg" },
  { n: 6, day: 6, name: "Gingerbread Village", icon: "\u{1F36A}", bg: A + "bg-gingerbread.webp", boss: A + "gd-angry.webp", hp: 9000, atk: 2.8, gim: "minions", minImg: A + "minion-ginger.webp", minName: "gingerbread guards", splat: A + "fx-frosting-splat.webp",
    intro: "Gingerbread guards! Knock them down first, and wipe off the frosting!", reward: "75 {cur}" },
  { n: 7, day: 7, name: "Sleigh Chase", icon: "\u{1F6F7}", bg: A + "bg-sleigh.webp", boss: A + "gd-sleigh.webp", hp: 10000, atk: 2.8, gim: "fly",
    intro: "He stole the sleigh! Tap him as he flies across the sky!", reward: "a Rare+ egg" },
  { n: 8, day: 8, name: "North Pole Mailroom", icon: "\u{1F4EC}", bg: A + "bg-mailroom.webp", boss: A + "gd-angry.webp", hp: 11000, atk: 2.8, gim: "gifts",
    intro: "Presents are falling! Grab the good ones (+150), but DON'T tap the ticking ones!", reward: "100 {cur}" },
  { n: 9, day: 9, name: "Mountain Lair", icon: "\u{1F3D4}️", bg: A + "bg-lair.webp", boss: A + "gd-peek.webp", hp: 12000, atk: 2.7, gim: "dark",
    intro: "It's dark in his lair… when his eyes glow, DODGE!", reward: "an egg" },
  { n: 10, day: 10, name: "MEGA GRINCH-A-DUCK", icon: "\u{1F386}", bg: A + "bg-mega.webp", boss: A + "gd-mega.webp", hp: 24000, atk: 2.7, gim: "mega",
    intro: "New Year's Eve. MEGA GRINCH-A-DUCK. Three phases. Don't give up!", reward: "✨ a Sparkle Grinch-a-Duck, the Grinch Tamer badge and the Golden Grinch Trophy" }
];
const LAST = CHAPTERS.length;
const TOWER = { n: "tower", name: "Present Mountain", icon: "⛰️", bg: A + "bg-tower.webp", atk: 2.4, splat: A + "fx-snow-splat.webp" };
const towerHP = w => 2500 + 700 * (w - 1);
const MINION_HP = 300;
const TAUNTS = [
  "Ha! I took EVERY present in Companion Keep! You'll never get them back!",
  "Snowball fight! Bet you can't see me through all this snow!",
  "Peekaboo! You'll never find me in the candy canes!",
  "My toy soldiers will stop you! Left, right, left, right!",
  "Wheee! I'm the fastest skater at the North Pole!",
  "My gingerbread guards are SO crunchy and SO tough!",
  "Ho ho NO! This sleigh is MINE now!",
  "So many presents in the mailroom… and some of them TICK! Hee hee!",
  "Come into my dark lair… if you dare!",
  "It's almost midnight! I'm MEGA GRINCH-A-DUCK now! Happy New Year to ME!",
  "Okay, okay, you got the presents back. But can you climb PRESENT MOUNTAIN?"
];

/* ---------- state ---------- */
export const hsOn = cls => !!(cls && cls.heist && cls.heist.on && cls.heist.id);
const win = cls => { const r = (cls && cls.heist) || {}; return { from: r.from || "2026-12-21", to: r.to || "2027-01-03" }; };
const shiftDay = (iso, n) => { const [y, m, d] = iso.split("-").map(Number), x = new Date(y, m - 1, d + n); return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0"); };
function eventDays(cls) { const { from, to } = win(cls), today = azToday(), out = []; for (let d = from; d <= to && d <= today && out.length < 40; d = shiftDay(d, 1)) out.push(d); return out; }
export const hsStarted = cls => hsOn(cls) && azToday() >= win(cls).from;
export function hsOf(st, cls) {
  const r = st && st.heist, id = cls && cls.heist && cls.heist.id;
  return r && r.id === id ? r : { id };
}
const dayXP = (st, d) => { const h = ((st && st.xpHist) || {})[d] || {}; return Math.max(Number(h.d) || 0, Number(h.l) || 0, Number(h.mo) || 0); };
const subOn = (st, cls, d, k) => Number((((((st && st.xpHist) || {})[d]) || {}).sub || {})[subFor(cls, st, k)]) || 0;
export function hsStock(st, cls) {
  const r = hsOf(st, cls), pw = r.pw || {}, days = eventDays(cls);
  let en = Number(r.bonus) || 0, pie = 0, shield = 0, cry = 0, rage = 0;
  days.forEach(d => { en += Math.floor(dayXP(st, d) / PER_ENERGY); pie += Math.floor(subOn(st, cls, d, "m") / 25); shield += Math.floor(subOn(st, cls, d, "r") / 25); cry += Math.floor(subOn(st, cls, d, "l") / 25); if (dayXP(st, d) >= 120) rage++; });
  return { energy: Math.max(0, en - (Number(r.used) || 0)), pie: Math.max(0, pie - (Number(pw.pie) || 0)), shield: Math.max(0, shield - (Number(pw.shield) || 0)),
    cry: Math.max(0, cry - (Number(pw.cry) || 0)), rage: Math.max(0, rage - (Number(pw.rage) || 0)) };
}
const hpLeft = (r, ch) => Math.max(0, ch.hp - (Number((r.hp || {})[ch.n]) || 0));
const beaten = (r, n) => !!((r.beat || {})[n]);
const openDay = (cls, ch) => shiftDay(win(cls).from, ch.day);
// a chapter is open on its date, or right away once the chapter before it is beaten (Ms. Ariana: students can race ahead)
export const chOpen = (r, cls, ch) => ch.n === 1 || beaten(r, ch.n - 1) || azToday() >= openDay(cls, ch);
export const hsBeatCount = (st, cls) => CHAPTERS.filter(ch => beaten(hsOf(st, cls), ch.n)).length;
export const hsBest = (st, cls) => Number(hsOf(st, cls).best) || 0;
const xmasReady = (st, cls) => { const r = hsOf(st, cls); return hsStarted(cls) && azToday() >= shiftDay(win(cls).from, XMAS_DAY) && !(r.got || {}).xmas; };
const cur = () => SEASON.cur || "presents";
const rw = s => s.replace("{cur}", cur());
// the chapter a student should play next: the first open one not beaten yet
function nextCh(st, cls) { const r = hsOf(st, cls); return CHAPTERS.find(ch => !beaten(r, ch.n) && chOpen(r, cls, ch)) || null; }

/* ---------- My Companion card / checklist ---------- */
export function heistCard(st, cls) {
  if (!hsOn(cls) || !st) return "";
  const k = hsStock(st, cls), n = hsBeatCount(st, cls), started = hsStarted(cls), nx = nextCh(st, cls);
  return '<div class="card rvcard hscard"><img class="rvcard-tk" src="' + A + 'gd-angry.webp" alt=""><div class="rvcard-txt"><h3>\u{1F384} The Great Present Heist!</h3>' +
    (started ? "<p><b>⚡ " + k.energy + "</b> energy · " + (n >= LAST ? "⛰️ Present Mountain best: wave <b>" + hsBest(st, cls) + "</b>" : nx ? "Chapter <b>" + nx.n + "</b> of " + LAST + ": " + esc(nx.name) : "Chapter " + (n + 1) + " opens soon!") + "</p>" +
      (xmasReady(st, cls) ? '<p><b>\u{1F381} You have a Christmas present to open!</b></p>' : "") +
      '<p class="small">Every 10 XP = 1 ⚡. Math, Reading and Language give power-ups!</p><button class="btn gold" data-hs="open">\u{1F384} Chase the Grinch-a-Duck!</button>'
      : "<p>The Grinch-a-Duck strikes on <b>" + dayLabel(win(cls).from) + "</b>! Get ready…</p>") + "</div></div>";
}
const dayLabel = iso => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }); };
const shortDay = iso => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }); };
// for the Morning Checklist
export function heistTodo(st, cls) {
  if (!hsStarted(cls)) return null;
  const k = hsStock(st, cls), n = hsBeatCount(st, cls), nx = nextCh(st, cls);
  if (xmasReady(st, cls)) return { text: "\u{1F381} Open your Christmas present!", done: false };
  return { text: k.energy ? k.energy + " ⚡ energy ready — " + (n >= LAST ? "climb Present Mountain!" : nx ? "chapter " + nx.n + " of " + LAST + "!" : "the next chapter opens soon!") : "Earn XP for ⚡ energy (every 10 XP = 1 round).", done: !k.energy };
}

/* ---------- the event screen (its own layer on top of the page, so page redraws never interrupt a fight) ---------- */
let C = null;      // { st, cls, students, patch, flash }
let view = null;   // null | "hub" | { fight } | { result } | { xmas }
let root = null;
export const heistBusy = () => !!view;
function rootEl() { if (!root) { root = document.createElement("div"); root.id = "hsroot"; document.body.appendChild(root); root.addEventListener("pointerdown", onDown); root.addEventListener("click", onClick); } return root; }
// called on every student page render
export function heistSync(c) {
  C = c;
  if (view && !hsOn(c.cls)) { view = null; F = null; }
  if (view === "hub") drawHub();
  if (!view && root) root.innerHTML = "";
}
document.addEventListener("click", ev => { const b = ev.target.closest && ev.target.closest('[data-hs="open"]'); if (b && C && hsStarted(C.cls)) { view = "hub"; drawHub(); } });

function stockRow(k) {
  return '<div class="rvstock"><span title="Energy">⚡ <b>' + k.energy + "</b></span><span title=\"Snowball Bombs (25 Math each)\">❄️ <b>" + k.pie + "</b></span>" +
    '<span title="Cocoa Shields (25 Reading each)">☕ <b>' + k.shield + '</b></span><span title="Jingle Blasts (25 Language each)">\u{1F514} <b>' + k.cry + "</b></span>" +
    '<span title="Holiday Spirit (each 120 XP day)">\u{1F384} <b>' + k.rage + "</b></span></div>";
}
function drawHub() {
  if (!C || !C.st) return;
  const st = C.st, cls = C.cls, r = hsOf(st, cls), k = hsStock(st, cls), allBeat = beaten(r, LAST), n = hsBeatCount(st, cls);
  const taunt = allBeat ? TAUNTS[LAST] : TAUNTS[Math.min(LAST - 1, n)];
  let h = '<div class="rvover"><div class="rvtop"><b>\u{1F384} The Great Present Heist</b>' + stockRow(k) + '<button class="btn ghost small" data-hs="close">✕</button></div><div class="rvhub">';
  h += '<div class="rvtaunt"><img src="' + A + (allBeat ? "gd-mega.webp" : n >= 6 ? "gd-sleigh.webp" : "gd-angry.webp") + '" alt=""><div class="rvbubble">“' + esc(taunt) + "”</div></div>";
  if (xmasReady(st, cls)) h += '<button class="hsxmas" data-hs="xmas"><img src="' + A + 'xmas-gift.webp" alt=""><span><b>\u{1F381} Merry Christmas!</b><br>Tap to open your present: +5 ⚡ energy, ' + 25 + " " + esc(cur()) + " and an egg!</span></button>";
  h += '<p class="rvhow">Every <b>10 XP</b> = 1 ⚡ (one 20-second round). Tap the Grinch-a-Duck to hit him, fill the \u{1F525} combo for a <b>Super Smack</b>, and tap <b>DODGE</b> when you see <b>!</b> · ' +
    "❄️ each 25 Math · ☕ each 25 Reading · \u{1F514} each 25 Language · \u{1F384} each 120 XP day. <b>Beat a chapter to open the next one right away!</b></p>";
  h += '<div class="rvchaps">' + CHAPTERS.map(ch => { const left = hpLeft(r, ch), done = beaten(r, ch.n), open = chOpen(r, cls, ch), pct = left / ch.hp * 100;
    return '<div class="rvchap' + (done ? " done" : "") + (open ? "" : " locked") + '" style="background-image:linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.72)),url(' + ch.bg + ')"><span class="rvn">' + ch.n + "</span>" +
      "<b>" + ch.icon + " " + esc(ch.name) + "</b>" +
      (done ? '<span class="rvdone">✅ Beaten!</span>' : !open ? '<span class="hslock">\u{1F512} Opens ' + esc(shortDay(openDay(cls, ch))) + "</span><small>…or beat chapter " + (ch.n - 1) + " to open it now!</small>"
        : '<span class="rvhp"><i style="width:' + pct.toFixed(1) + '%"></i></span><small>' + left.toLocaleString() + " HP left</small>") +
      '<small class="rvrw">\u{1F381} ' + esc(rw(ch.reward)) + "</small>" +
      (done || !open ? "" : '<button class="btn small' + (k.energy ? " gold" : "") + '" data-hs="fight" data-n="' + ch.n + '"' + (k.energy ? "" : " disabled") + ">⚔️ Fight!</button>") + "</div>"; }).join("") + "</div>";
  h += '<div class="rvtower' + (allBeat ? "" : " locked") + '"><b>⛰️ Present Mountain</b> ' + (allBeat
    ? "Wave <b>" + (Number(r.tw) || 1) + "</b> · best: wave " + (Number(r.best) || 0) + ' <button class="btn small gold" data-hs="fight" data-n="tower"' + (k.energy ? "" : " disabled") + ">⛰️ Climb!</button>" +
      "<br><small>Wave 5: 50 " + esc(cur()) + " · 10: an egg + the Present Mountain Climber badge · 15: a Golden Bell · 20, 30, 40…: a Rare+ egg. The highest wave goes in the Hall of Fame!</small>"
    : "<small>\u{1F512} Beat MEGA GRINCH-A-DUCK to unlock endless Present Mountain.</small>") + "</div>";
  h += '<div class="rvfeath"><img class="hsbellic" src="' + A + 'golden-bell.webp" alt=""> Golden Bells: <b>' + ((Number(r.bells) || 0) % 5) + " / 5</b> <small>(rare drops after a round — 5 = a Legendary egg)</small></div>";
  rootEl().innerHTML = h + "</div></div>";
}

/* ---------- 🎁 Christmas Day present ---------- */
async function openXmas() {
  if (!C || !C.st || !xmasReady(C.st, C.cls)) return;
  const st = C.st, cls = C.cls, r = JSON.parse(JSON.stringify(hsOf(st, cls)));
  r.id = cls.heist.id; r.got = r.got || {}; r.got.xmas = 1; r.bonus = (Number(r.bonus) || 0) + 5;
  const data = { heist: r, candyBonus: (Number(st.candyBonus) || 0) + 25, doorEggs: (Number(st.doorEggs) || 0) + 1 };
  view = { xmas: true }; drawXmas(true); sfx("win");
  try { await C.patch(data); Object.assign(C.st, data); } catch (e) { view.err = (e && (e.code || e.message)) || "error"; }
  drawXmas(false);
}
function drawXmas(saving) {
  let h = '<div class="rvover"><div class="rvresult win" style="background-image:linear-gradient(180deg,rgba(0,20,10,.5),rgba(0,20,10,.85)),url(' + A + 'bg-workshop.webp)">' +
    '<div class="rvconf">' + confetti() + "</div>" + '<img class="rvwinimg" src="' + A + 'xmas-gift.webp" alt=""><h2>MERRY CHRISTMAS!</h2>' +
    '<div class="rvwon"><span>⚡ +5 energy</span><span>\u{1F381} 25 ' + esc(cur()) + "</span><span>\u{1F95A} an egg</span></div>" +
    (saving ? '<p class="small">Saving…</p>' : view && view.err ? '<p class="small">⚠️ That didn’t save (' + esc(view.err) + "). Ask Ms. Ariana.</p>" : "") +
    (saving ? "" : '<div class="row" style="justify-content:center;margin-top:10px;"><button class="btn big" data-hs="hub">Back to the chase</button></div>');
  rootEl().innerHTML = h + "</div></div>";
}
const confetti = () => Array.from({ length: 24 }, (_, i) => '<i style="left:' + (i * 4.2) + "%;animation-delay:" + (i % 6) * 0.15 + "s;background:" + ["#FFC94A", "#E63946", "#7CD66B", "#4AA3FF", "#FFFFFF", "#2E9E5A"][i % 6] + '"></i>').join("");

/* ---------- the arcade fight ---------- */
let F = null, raf = 0;
const now = () => performance.now();
function chOf(n) { return n === "tower" ? TOWER : CHAPTERS.find(c => c.n === Number(n)); }
const SPOTS = { maze: [15, 50.5, 86], slide: [22, 50, 78] };
function startFight(n) {
  const st = C.st, cls = C.cls, r = hsOf(st, cls), k = hsStock(st, cls), ch = chOf(n);
  if (!ch || !k.energy || (n !== "tower" && (beaten(r, ch.n) || !chOpen(r, cls, ch))) || (n === "tower" && !beaten(r, LAST))) return;
  const tower = n === "tower", tw = Number(r.tw) || 1;
  F = { n, ch, tower, t0: now() + 1400, end: 0, dmg: 0, combo: 0, cryUntil: 0, rage: false, shield: false, last: 0, nextAtk: 0, tele: 0, dodged: false,
    max: tower ? towerHP(tw) : ch.hp, done0: tower ? Number(r.th) || 0 : Number((r.hp || {})[ch.n]) || 0, wave: tw, waves: 0,
    mh: (((r.mh || {})[ch.n]) || [0, 0, 0]).slice(0, 3), splats: [], hole: 1, holeT: 0, shown: true, giftT: 0, stunUntil: 0,
    used: { pie: 0, shield: 0, cry: 0, rage: 0 }, k, over: false };
  if (ch.gim === "minions" && F.done0 > 0) F.mh = [MINION_HP, MINION_HP, MINION_HP];   // already past the guards
  F.end = F.t0 + ROUND_SEC * 1000; F.nextAtk = F.t0 + ch.atk * 1000;
  view = { fight: true }; drawFight(); cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); sfx("start");
}
const left = () => Math.max(0, F.max - F.done0 - F.dmg);
const minionsUp = () => F.ch.gim === "minions" && F.mh.some(v => v < MINION_HP);
function phase() { if (F.ch.gim !== "mega") return 1; const p = left() / F.max; return p > 0.66 ? 1 : p > 0.33 ? 2 : 3; }
function mult() { return (F.rage ? 2 : 1) * (F.cryUntil > now() ? 2 : 1); }
const towerBoss = w => A + (w % 2 ? "gd-angry.webp" : "gd-mega.webp");
function drawFight() {
  const ch = F.ch, k = F.k;
  const bossImg = F.tower ? towerBoss(F.wave) : ch.boss;
  let h = '<div class="rvover"><div class="rvtop"><b>' + ch.icon + " " + esc(F.tower ? "Present Mountain · wave " + F.wave : ch.name) + '</b><span class="rvtimer" id="hsT">' + ROUND_SEC + "</span></div>" +
    '<div class="rvstage g-' + (ch.gim || "none") + '" id="hsStage" style="background-image:url(' + ch.bg + ')">' +
    (ch.gim === "dark" ? '<div class="hsdark"></div>' : "") +
    '<div class="rvbar"><i id="hsHP"></i><span id="hsHPt"></span></div>' +
    '<div class="rvcombo"><i id="hsCombo"></i><span>\u{1F525} COMBO</span></div>' +
    '<button class="rvboss" id="hsBoss" data-hs="hit" aria-label="Hit the Grinch-a-Duck"><img src="' + bossImg + '" alt="" draggable="false"></button>' +
    (ch.gim === "minions" ? [0, 1, 2].map(i => '<button class="rvmin hsmin" id="hsMin' + i + '" data-hs="min" data-i="' + i + '" style="left:' + (22 + i * 28) + '%"><img src="' + ch.minImg + '" alt="" draggable="false"><i></i></button>').join("") : "") +
    '<div class="rvwarn" id="hsWarn">!</div><div id="hsFx"></div>' +
    '<div class="rvcount" id="hsCount">' + esc(F.tower ? "Wave " + F.wave + "!" : ch.intro) + "</div></div>" +
    '<div class="rvbtns"><button class="rvdodge" data-hs="dodge">\u{1F4A8} DODGE</button>' +
    pwBtn("pie", "❄️", "Snowball Bomb", k.pie) + pwBtn("shield", "☕", "Cocoa Shield", k.shield) + pwBtn("cry", "\u{1F514}", "Jingle Blast", k.cry) + pwBtn("rage", "\u{1F384}", "Holiday Spirit", k.rage) + "</div></div>";
  rootEl().innerHTML = h; paint();
}
function pwBtn(key, icon, name, n) { return '<button class="rvpw" data-hs="pw" data-k="' + key + '" id="hsPw-' + key + '"' + (n ? "" : " disabled") + ">" + icon + " " + name + ' <b id="hsPwN-' + key + '">' + n + "</b></button>"; }
function paint() {
  if (!F) return; const $ = id => document.getElementById(id);
  const l = left(), hp = $("hsHP"), t = $("hsT"), cb = $("hsCombo");
  if (hp) hp.style.width = (l / F.max * 100).toFixed(1) + "%"; if ($("hsHPt")) $("hsHPt").textContent = l.toLocaleString() + " HP";
  if (cb) cb.style.width = Math.min(100, F.combo / 20 * 100) + "%";
  const tl = Math.max(0, Math.ceil((F.end - Math.max(now(), F.t0)) / 1000)); if (t) t.textContent = now() < F.t0 ? ROUND_SEC : tl;
  ["pie", "shield", "cry", "rage"].forEach(k => { const n = F.k[k] - F.used[k], b = $("hsPw-" + k), e = $("hsPwN-" + k); if (e) e.textContent = n; if (b) b.disabled = n <= 0 || (k === "rage" && F.rage) || (k === "shield" && F.shield); });
  const stg = $("hsStage"); if (stg) { stg.classList.toggle("p2", phase() === 2); stg.classList.toggle("p3", phase() === 3); stg.classList.toggle("cry", F.cryUntil > now()); stg.classList.toggle("rage", F.rage); stg.classList.toggle("shield", F.shield); stg.classList.toggle("stun", F.stunUntil > now()); }
  if (F.ch.gim === "minions") F.mh.forEach((v, i) => { const m = $("hsMin" + i); if (m) { m.style.display = v >= MINION_HP ? "none" : ""; const bar = m.querySelector("i"); if (bar) bar.style.width = (100 - v / MINION_HP * 100) + "%"; } });
}
function tick() {
  if (!F || F.over) return;
  const t = now(), $ = id => document.getElementById(id), g = F.ch.gim;
  if (t >= F.t0 && $("hsCount") && !F.go) { F.go = true; $("hsCount").textContent = "GO!"; setTimeout(() => { const c = $("hsCount"); if (c) c.style.display = "none"; }, 600); }
  if (t >= F.t0) {
    const b = $("hsBoss");
    // candy cane forest: he peeks out from behind one of 3 candy canes, hides, peeks out somewhere else
    if (g === "maze") { if (t > F.holeT) { F.shown = !F.shown; F.holeT = t + (F.shown ? 1300 : 450); if (F.shown) F.hole = Math.floor(Math.random() * 3); }
      if (b) { b.style.left = SPOTS.maze[F.hole] + "%"; b.classList.toggle("hid", !F.shown); } }
    // frozen lake: he skates from spot to spot (always there, keep up!)
    if (g === "slide") { if (t > F.holeT) { let h = F.hole; while (h === F.hole) h = Math.floor(Math.random() * 3); F.hole = h; F.holeT = t + 1100 + Math.random() * 500; }
      if (b) b.style.left = SPOTS.slide[F.hole] + "%"; }
    // sleigh chase: he flies loops across the sky
    if (g === "fly" && b) { const s = (t - F.t0) / 1000; b.style.left = (50 + 34 * Math.sin(s * 1.1)) + "%"; b.style.top = (14 + 14 * Math.sin(s * 2.3)) + "%"; }
    // mailroom: presents fall; good ones +150, ticking ones stun you
    if (g === "gifts" && t > F.giftT) { F.giftT = t + 800 + Math.random() * 600; addGift(); }
    // his attacks: wind up (!), then hit unless you dodged
    const sp = F.tower ? Math.max(1.2, TOWER.atk - F.wave * 0.05) : F.ch.atk * (phase() === 2 ? 0.78 : phase() === 3 ? 0.5 : 1);
    if (!F.tele && t >= F.nextAtk) { F.tele = t; F.dodged = false; const w = $("hsWarn"); if (w) w.classList.add("on"); if (b) b.classList.add("wind"); sfx("warn"); }
    if (F.tele && t - F.tele > 950) {
      const w = $("hsWarn"); if (w) w.classList.remove("on"); if (b) b.classList.remove("wind");
      if (F.dodged) { pop("DODGED! +50", "good"); addDmg(50, true); }
      else if (F.shield) { F.shield = false; pop("☕ BLOCKED!", "good"); sfx("block"); }
      else { F.combo = 0; pop(F.ch.splat && g === "splat" ? "SPLAT!" : "OUCH!", "bad"); sfx("ouch"); const s = $("hsStage"); if (s) { s.classList.add("hurt"); setTimeout(() => s.classList.remove("hurt"), 300); }
        if (F.ch.splat && (!F.tower || F.wave % 3 === 0)) addSplat(); }
      F.tele = 0; F.nextAtk = t + sp * 1000 * (0.8 + Math.random() * 0.4);
    }
    if (t >= F.end || left() <= 0) return finish();
  }
  paint(); raf = requestAnimationFrame(tick);
}
function addSplat() {
  const fx = document.getElementById("hsStage"); if (!fx || F.splats.length >= 3) return;
  const id = "sp" + Math.random().toString(36).slice(2, 7), x = 15 + Math.random() * 60, y = 18 + Math.random() * 50;
  const el = document.createElement("button"); el.className = "rvsplat"; el.dataset.hs = "splat"; el.id = id; el.style.left = x + "%"; el.style.top = y + "%"; el.dataset.hp = "2";
  el.innerHTML = '<img src="' + F.ch.splat + '" alt="" draggable="false">'; fx.appendChild(el); F.splats.push(id);
}
function addGift() {
  const fx = document.getElementById("hsStage"); if (!fx) return;
  const bad = Math.random() < 0.38, el = document.createElement("button");
  el.className = "hsgift" + (bad ? " bad" : ""); el.dataset.hs = "gift"; el.dataset.bad = bad ? "1" : ""; el.style.left = (8 + Math.random() * 84) + "%";
  el.innerHTML = '<img src="' + A + (bad ? "present-tick.webp" : "present-good.webp") + '" alt="" draggable="false">';
  fx.appendChild(el); setTimeout(() => el.remove(), 2700);
}
function addDmg(n, quiet) {
  F.total = (F.total || 0) + n;
  if (F.tower) {
    F.dmg += n;
    while (F.done0 + F.dmg >= F.max) {   // next wave!
      const over = F.done0 + F.dmg - F.max; F.waves++; F.wave++; F.done0 = 0; F.dmg = over; F.max = towerHP(F.wave);
      pop("⛰️ WAVE " + (F.wave - 1) + " CLEARED!", "big"); sfx("win");
      const top = document.querySelector("#hsroot .rvtop b"); if (top) top.textContent = "⛰️ Present Mountain · wave " + F.wave;
      const bi = document.querySelector("#hsBoss img"); if (bi) bi.src = towerBoss(F.wave);
    }
  } else F.dmg = Math.min(F.max - F.done0, F.dmg + n);
  if (!quiet) floatNum(n);
}
function floatNum(n) {
  const fx = document.getElementById("hsFx"); if (!fx) return;
  const e = document.createElement("span"); e.className = "rvdmg" + (n >= 100 ? " big" : ""); e.textContent = "-" + n; e.style.left = (38 + Math.random() * 24) + "%"; e.style.top = (30 + Math.random() * 20) + "%";
  fx.appendChild(e); setTimeout(() => e.remove(), 700);
}
function pop(text, kind) {
  const fx = document.getElementById("hsFx"); if (!fx) return;
  const e = document.createElement("div"); e.className = "rvpop " + (kind || ""); e.textContent = text; fx.appendChild(e); setTimeout(() => e.remove(), 1000);
}
function hitBoss() {
  const t = now(); if (!F || F.over || t < F.t0 || t - F.last < 55) return; F.last = t;
  if (F.stunUntil > t) { pop("\u{1F4AB} Stunned!", "bad"); return; }
  if (F.ch.gim === "maze" && !F.shown) return;
  if (minionsUp()) { pop("Knock down the " + F.ch.minName + " first!", "bad"); return; }
  const m = mult(); addDmg(10 * m); F.combo++; sfx("tap");
  const b = document.getElementById("hsBoss"); if (b) { b.classList.remove("ow"); void b.offsetWidth; b.classList.add("ow"); }
  if (F.combo >= 20) { F.combo = 0; addDmg(400 * m, true); pop("\u{1F4A5} SUPER SMACK! -" + 400 * m, "big"); sfx("super"); }
}
function hitMinion(i) {
  const t = now(); if (!F || t < F.t0 || t - F.last < 55) return; F.last = t;
  F.mh[i] = Math.min(MINION_HP, F.mh[i] + 15 * mult()); sfx("tap"); if (F.mh[i] >= MINION_HP) { pop("\u{1F4A5} KNOCKED DOWN!", "good"); sfx("pop"); }
}
function tapGift(el) {
  if (!F || now() < F.t0) return;
  if (el.dataset.bad) { F.combo = 0; F.stunUntil = now() + 1500; pop("\u{1F4A5} TRAP! Stunned!", "bad"); sfx("ouch"); }
  else { addDmg(150 * (F.rage ? 2 : 1), true); pop("\u{1F381} +" + 150 * (F.rage ? 2 : 1), "good"); sfx("pop"); }
  el.remove();
}
function usePw(k) {
  if (!F || now() < F.t0 || F.k[k] - F.used[k] <= 0) return;
  if (k === "rage" && F.rage) return; if (k === "shield" && F.shield) return;
  F.used[k]++;
  if (k === "pie") { if (minionsUp()) { F.mh = [MINION_HP, MINION_HP, MINION_HP]; pop("❄️ SNOWBALL BOMB! All the " + F.ch.minName + " are down!", "big"); } else { addDmg(1500 * (F.rage ? 2 : 1), true); pop("❄️ SNOWBALL BOMB! -" + 1500 * (F.rage ? 2 : 1), "big"); } sfx("super"); }
  if (k === "shield") { F.shield = true; pop("☕ Cocoa Shield up!", "good"); }
  if (k === "cry") { F.cryUntil = now() + 10000; pop("\u{1F514} JINGLE BLAST! Double damage!", "big"); sfx("super"); }
  if (k === "rage") { F.rage = true; pop("\u{1F384} HOLIDAY SPIRIT! Double damage all round!", "big"); sfx("super"); }
  paint();
}
async function finish() {
  F.over = true; cancelAnimationFrame(raf);
  const st = C.st, cls = C.cls, r0 = hsOf(st, cls), r = JSON.parse(JSON.stringify(r0)), ch = F.ch, today = azToday(), c = cur();
  r.id = cls.heist.id; r.used = (Number(r.used) || 0) + 1; r.rounds = (Number(r.rounds) || 0) + 1;
  r.pw = Object.assign({ pie: 0, shield: 0, cry: 0, rage: 0 }, r.pw || {}); Object.keys(F.used).forEach(k => { r.pw[k] = (Number(r.pw[k]) || 0) + F.used[k]; });
  r.got = r.got || {}; r.beat = r.beat || {}; r.hp = r.hp || {};
  const data = {}, won = [];
  const give = { cur: n => { data.candyBonus = (Number(data.candyBonus != null ? data.candyBonus : st.candyBonus) || 0) + n; }, egg: () => { data.doorEggs = (Number(data.doorEggs != null ? data.doorEggs : st.doorEggs) || 0) + 1; },
    rare: () => { give.egg(); const eb = Object.assign({}, st.eggBoost || {}, data.eggBoost || {}); eb.rare = (Number(eb.rare) || 0) + 1; data.eggBoost = eb; },
    leg: () => { data.legendaryPulls = (Number(st.legendaryPulls) || 0) + 1; } };
  let victory = false, opened = null;
  if (F.tower) {
    r.tw = F.wave; r.th = F.done0 + F.dmg; const cleared = F.wave - 1; r.best = Math.max(Number(r.best) || 0, cleared);
    for (let w = cleared - F.waves + 1; w <= cleared; w++) {
      if (w === 5 && !r.got.w5) { r.got.w5 = 1; give.cur(50); won.push("50 " + c + " (wave 5)"); }
      if (w === 10 && !r.got.w10) { r.got.w10 = 1; give.egg(); won.push("an egg (wave 10)", "⛰️ the Present Mountain Climber badge"); }
      if (w === 15 && !r.got.w15) { r.got.w15 = 1; r.bells = (Number(r.bells) || 0) + 1; won.push("a Golden Bell (wave 15)"); }
      if (w >= 20 && w % 10 === 0 && !r.got["w" + w]) { r.got["w" + w] = 1; give.rare(); won.push("a Rare+ egg (wave " + w + ")"); }
    }
  } else {
    r.hp[ch.n] = Math.min(ch.hp, (Number(r.hp[ch.n]) || 0) + F.dmg);
    if (ch.gim === "minions") { r.mh = Object.assign({}, r.mh && typeof r.mh === "object" && !Array.isArray(r.mh) ? r.mh : {}); r.mh[ch.n] = F.mh; }
    if (r.hp[ch.n] >= ch.hp && !r.beat[ch.n]) {
      victory = true; r.beat[ch.n] = today;
      const g = "c" + ch.n;
      if (!r.got[g]) { r.got[g] = 1;
        if (ch.n === 1) { give.cur(100); won.push("100 " + c, "\u{1F381} the Present Chaser badge"); }
        if (ch.n === 2) { give.cur(50); won.push("50 " + c); }
        if (ch.n === 3) { data.outfits = Object.assign({}, st.outfits || {}, { "hs-heisthat": true }); won.push("\u{1F9E2} the Heist Hat (wear it from your Gear!)"); }
        if (ch.n === 4 || ch.n === 6) { give.cur(75); won.push("75 " + c); }
        if (ch.n === 5 || ch.n === 9) { give.egg(); won.push("\u{1F95A} an egg"); }
        if (ch.n === 7) { give.rare(); won.push("\u{1F95A} a Rare+ egg"); }
        if (ch.n === 8) { give.cur(100); won.push("100 " + c); }
        if (ch.n === LAST) { data.heistLeg = (Number(st.heistLeg) || 0) + 1;
          const ro = (st.roomOwned || []).slice(); if (!ro.includes("trophy_heist")) ro.push("trophy_heist"); data.roomOwned = ro;
          won.push("✨ a SPARKLE GRINCH-A-DUCK egg (hatch it in your Creature Collector!)", "\u{1F3C6} the Golden Grinch Trophy (put it in My Room)", "\u{1F396}️ the Grinch Tamer badge", "⛰️ Present Mountain is open!"); }
      }
      const nx = CHAPTERS.find(x => x.n === ch.n + 1); if (nx && today < openDay(cls, nx)) opened = nx;   // opened early!
    }
  }
  // 🔔 Golden Bell: a rare drop after any round (5 = a Legendary egg)
  if (Math.random() < (ch.gim === "mega" || F.tower ? 0.15 : 0.1)) { r.bells = (Number(r.bells) || 0) + 1; won.push("\u{1F514} a Golden Bell!"); }
  const bl = Number(r.bells) || 0; for (let f = 5; f <= bl; f += 5) if (!r.got["b" + f]) { r.got["b" + f] = 1; give.leg(); won.push("\u{1F31F} 5 Golden Bells = a Legendary egg!"); }
  data.heist = r;
  view = { result: { victory, won, opened, dmg: F.tower ? F.total || 0 : F.dmg, ch, tower: F.tower, waves: F.waves, wave: F.wave, left: F.tower ? 0 : ch.hp - r.hp[ch.n] } };
  drawResult(true);
  try { await C.patch(data); Object.assign(C.st, data); }
  catch (e) { view.result.err = (e && (e.code || e.message)) || "error"; }
  drawResult(false); if (victory) sfx("win");
  F = null;
}
function drawResult(saving) {
  const R = view && view.result; if (!R) return;
  const ch = R.ch;
  let h = '<div class="rvover"><div class="rvresult' + (R.victory ? " win" : "") + '" style="background-image:linear-gradient(180deg,rgba(0,15,8,.55),rgba(0,15,8,.85)),url(' + ch.bg + ')">';
  if (R.victory) h += '<div class="rvconf">' + confetti() + "</div>" +
    '<img class="rvwinimg" src="' + (ch.n === LAST ? A + "trophy-golden.webp" : ch.boss) + '" alt=""><h2>' + (ch.n === LAST ? "YOU BEAT MEGA GRINCH-A-DUCK!!" : "YOU BEAT " + esc(ch.name.toUpperCase()) + "!") + "</h2>" +
    (R.opened ? '<p class="hsopen">\u{1F513} You opened <b>Chapter ' + R.opened.n + ": " + esc(R.opened.name) + "</b> early!</p>" : "");
  else if (R.tower) h += '<h2>⛰️ ' + (R.waves ? "You cleared " + R.waves + " wave" + (R.waves === 1 ? "" : "s") + "!" : "Round over!") + "</h2><p>You’re on wave <b>" + R.wave + "</b>. You did <b>" + R.dmg.toLocaleString() + "</b> damage.</p>";
  else h += "<h2>Round over!</h2><p>You did <b>" + R.dmg.toLocaleString() + "</b> damage. The Grinch-a-Duck has <b>" + R.left.toLocaleString() + "</b> HP left — your hits are saved!</p>";
  if (R.won.length) h += '<div class="rvwon">' + R.won.map(w => "<span>" + esc(w) + "</span>").join("") + "</div>";
  h += saving ? '<p class="small">Saving…</p>' : R.err ? '<p class="small">⚠️ That didn’t save (' + esc(R.err) + "). Ask Ms. Ariana.</p>" : "";
  const k = C && C.st ? hsStock(C.st, C.cls) : { energy: 0 };
  if (!saving) h += '<div class="row" style="justify-content:center;gap:10px;margin-top:10px;">' +
    (!R.victory && k.energy ? '<button class="btn big gold" data-hs="fight" data-n="' + (R.tower ? "tower" : ch.n) + '">Again! · ' + k.energy + " energy left</button>" : "") +
    (R.victory && R.opened && k.energy ? '<button class="btn big gold" data-hs="fight" data-n="' + R.opened.n + '">⚔️ Chapter ' + R.opened.n + "! · " + k.energy + " energy left</button>" : "") +
    '<button class="btn big" data-hs="hub">Back to the chase</button></div>';
  rootEl().innerHTML = h + "</div></div>";
}

/* ---------- input ---------- */
function onDown(ev) {
  ev.stopPropagation();   // fight taps stay inside the event screen (the page underneath holds its redraws while a finger is down)
  const el = ev.target.closest("[data-hs]"); if (!el || !F) return;
  const a = el.dataset.hs;
  if (a === "hit") { ev.preventDefault(); hitBoss(); }
  else if (a === "min") { ev.preventDefault(); hitMinion(Number(el.dataset.i)); }
  else if (a === "gift") { ev.preventDefault(); tapGift(el); }
  else if (a === "splat") { ev.preventDefault(); const n = Number(el.dataset.hp) - 1; if (n <= 0) { F.splats = F.splats.filter(x => x !== el.id); el.remove(); sfx("pop"); } else { el.dataset.hp = n; el.style.opacity = 0.55; } }
  else if (a === "dodge") { ev.preventDefault(); if (F.tele && !F.dodged) { F.dodged = true; sfx("dodge"); } }
  else if (a === "pw") { ev.preventDefault(); usePw(el.dataset.k); }
}
function onClick(ev) {
  const el = ev.target.closest("[data-hs]"); if (!el) return;
  const a = el.dataset.hs;
  if (a === "close") { view = null; F = null; cancelAnimationFrame(raf); rootEl().innerHTML = ""; return; }
  if (a === "hub") { view = "hub"; drawHub(); return; }
  if (a === "xmas") { if (C && C.preview) { C.flash("This is a teacher preview — nothing is saved."); return; } openXmas(); return; }
  if (a === "fight") { if (C && C.preview) { C.flash("This is a teacher preview — nothing is saved."); return; } startFight(el.dataset.n === "tower" ? "tower" : Number(el.dataset.n)); }
}

/* ---------- sound (Web Audio, no files) ---------- */
let AC = null;
function sfx(k) {
  try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === "suspended") AC.resume(); } catch (e) { return; }
  const t = AC.currentTime, tone = (f, d, type, v, at, to) => { const o = AC.createOscillator(), g = AC.createGain(); o.type = type || "square"; o.frequency.setValueAtTime(f, t + (at || 0)); if (to) o.frequency.exponentialRampToValueAtTime(to, t + (at || 0) + d);
    g.gain.setValueAtTime(v || 0.08, t + (at || 0)); g.gain.exponentialRampToValueAtTime(0.001, t + (at || 0) + d); o.connect(g); g.connect(AC.destination); o.start(t + (at || 0)); o.stop(t + (at || 0) + d + 0.02); };
  if (k === "tap") tone(1200 + Math.random() * 300, 0.06, "triangle", 0.05);
  if (k === "super") { tone(523, 0.12, "triangle", 0.08); tone(784, 0.2, "triangle", 0.07, 0.08); tone(1568, 0.25, "sine", 0.06, 0.16); }
  if (k === "warn") tone(880, 0.12, "triangle", 0.09, 0, 660);
  if (k === "ouch") tone(200, 0.25, "sawtooth", 0.1, 0, 90);
  if (k === "dodge") tone(500, 0.15, "sine", 0.1, 0, 1200);
  if (k === "block") { tone(300, 0.1, "square", 0.08); tone(450, 0.15, "square", 0.08, 0.08); }
  if (k === "pop") { tone(1568, 0.08, "sine", 0.08); tone(2093, 0.1, "sine", 0.06, 0.05); }
  if (k === "start") [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.15, "triangle", 0.06, i * 0.1));
  if (k === "win") [784, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.22, "triangle", 0.07, i * 0.12));
}

/* ---------- console card ---------- */
export function heistAdmin(students, cls) {
  const t0 = azToday(), w0 = win(cls);
  if (!hsOn(cls) && t0.slice(5, 7) !== "12" && !(w0 && w0.from && w0.to && t0 >= w0.from && t0 <= w0.to)) return "";   // only shows in December (or while it runs)
  const on = hsOn(cls), w = w0, kids = students.filter(s => s.companionId && !s.isTeacher).slice().sort((a, b) => String(a.name).localeCompare(String(b.name)));
  let h = '<div class="card"><div class="card-head"><h2>\u{1F384} The Great Present Heist</h2><span class="fact">' + (on ? (hsStarted(cls) ? "running" : "starts " + w.from) : "off") + "</span></div>" +
    '<p class="lede" style="font-size:13.5px;">Christmas break event: each student chases the Grinch-a-Duck on their own through 10 chapters with a fast tap-to-attack fight, then an endless Present Mountain. ' +
    "Chapter 1 opens on the first day and a new one opens every day after (none on Christmas Day, which has a free present instead), but beating a chapter opens the next one right away. " +
    "Every 10 XP on the event days = 1 ⚡ round. 25 Math / Reading / Language and 120 XP days give power-ups. Beating MEGA GRINCH-A-DUCK gives a ✨ Sparkle Grinch-a-Duck egg, the Grinch Tamer badge and the Golden Grinch Trophy.</p>" +
    '<div class="row" style="gap:10px;align-items:flex-end;flex-wrap:wrap;margin:6px 0;"><div class="field"><label for="hsFrom">First day</label><input id="hsFrom" type="date" value="' + esc(w.from) + '"></div>' +
    '<div class="field"><label for="hsTo">Last day</label><input id="hsTo" type="date" value="' + esc(w.to) + '"></div>' +
    '<button class="btn' + (on ? " ghost" : "") + '" data-act="hsToggle">' + (on ? "Turn off" : "\u{1F384} Turn on") + "</button>" + (on ? '<button class="btn ghost small" data-act="hsDates">Save dates</button>' : "") + "</div>";
  if (on) h += '<div style="overflow-x:auto;"><table class="mini"><thead><tr><th>Student</th><th>⚡ left</th><th>Chapters</th><th>Now fighting</th><th>Mountain</th><th>\u{1F514}</th><th>Rounds</th><th></th></tr></thead><tbody>' +
    kids.map(s => { const r = hsOf(s, cls), k = hsStock(s, cls), n = hsBeatCount(s, cls), nx = nextCh(s, cls);
      return "<tr><td><b>" + esc(s.name) + "</b></td><td>" + k.energy + "</td><td>" + n + " / " + LAST + (n >= LAST ? " \u{1F3C6}" : "") + "</td><td>" + (nx ? nx.icon + " " + nx.n + " · " + Math.round(hpLeft(r, nx) / nx.hp * 100) + "% HP left" : "—") + "</td>" +
        "<td>" + (n >= LAST ? "wave " + (Number(r.tw) || 1) + " (best " + (Number(r.best) || 0) + ")" : "") + "</td><td>" + (Number(r.bells) || 0) + "</td><td>" + (Number(r.rounds) || 0) + "</td>" +
        '<td><button class="btn ghost small" data-act="hsReset" data-id="' + esc(s.id) + '">Reset</button></td></tr>'; }).join("") + "</tbody></table></div>";
  return h + "</div>";
}
// console clicks: returns { cls: classUpdate } or { student: [id, update] } or null
export function heistAction(act, el, cls) {
  const from = (document.getElementById("hsFrom") || {}).value || win(cls).from, to = (document.getElementById("hsTo") || {}).value || win(cls).to;
  if (act === "hsToggle") return { cls: hsOn(cls) ? { "heist.on": false } : { heist: { on: true, id: (cls.heist && cls.heist.id) || "hs-" + Date.now(), from, to } } };
  if (act === "hsDates") return { cls: { "heist.from": from, "heist.to": to } };
  if (act === "hsReset") return { student: [el.dataset.id, { heist: { id: cls.heist && cls.heist.id } }] };
  return null;
}
