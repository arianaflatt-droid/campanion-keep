/* ---------- 🌅 Morning Quest Board ----------
   Ms. Ariana pastes "morning data" before the 8:30 cutoff (saved as xpHist[date].mo). Every student sees the same board of
   12 quests each school day (10, 20 ... 120 XP). A quest opens once the student's morning XP reaches its number.
   Quest types (shuffled each day): catch a creature (easy battle), fishing (timing game), treasure hunt (dig a sand map),
   mystery nest (pick 1 of 3 eggs) and training (level up a creature). Higher quests = rarer creatures and a better Sparkle chance.
   Every finished quest also pays a bonus (MQ_BONUS). Saved on the student: mq = { date, done: { tier: {...} }, hunt: { tier: [dug squares] } },
   mqCatch (creatures caught here), mqFull (whole boards finished). */
import { esc, eventMode, seasonOf } from "./game.js?v=20261020o";
import { soloOn, soloCfg, freeIngredient } from "./solobrew.js?v=20261020o";
import { CREATURES, FAMILIES } from "./creatures.js?v=20261020o";
import { azToday, azNow, owned, ownedFams, formOf, fighterFrom, resolveRound, hitDamage, MOVES, doPull, MAX_LEVEL, sparkleImg, RARITY_COLOR } from "./collect.js?v=20261020o";

export const MQ_TIERS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120];
export const MQ_CUTOFF = "08:30";        // morning data for today is only accepted before this (Arizona time)
export const MQ_BEFORE = "8:15";         // what the cards say
const RARITY_BY_TIER = ["Common", "Common", "Common", "Uncommon", "Uncommon", "Uncommon", "Rare", "Rare", "Rare", "Super Rare", "Super Rare", "Legendary"];
const SPARKLE_BY_TIER = [0.01, 0.02, 0.03, 0.04, 0.05, 0.07, 0.09, 0.11, 0.13, 0.16, 0.20, 0.25];
const SHOVELS = [3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8];
const TRAIN_LV = [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 5];
// Mystery Nest: chances for each rarity, by quest band
const NEST_ODDS = [
  [["Common", 0.7], ["Uncommon", 0.25], ["Rare", 0.05]],
  [["Common", 0.45], ["Uncommon", 0.35], ["Rare", 0.15], ["Super Rare", 0.05]],
  [["Uncommon", 0.4], ["Rare", 0.35], ["Super Rare", 0.2], ["Legendary", 0.05]],
  [["Rare", 0.45], ["Super Rare", 0.4], ["Legendary", 0.15]],
  [["Super Rare", 0.5], ["Legendary", 0.5]]
];
const band = i => (i < 3 ? 0 : i < 6 ? 1 : i < 9 ? 2 : i < 11 ? 3 : 4);
export const MQ_TYPES = {
  catch: { icon: "\u{1F3AF}", name: "Catch", img: "assets/morning/mq-icon-catch.webp" },
  fish: { icon: "\u{1F3A3}", name: "Fishing", img: "assets/morning/mq-icon-fish.webp" },
  hunt: { icon: "\u{1F5FA}️", name: "Treasure Hunt", img: "assets/morning/mq-icon-hunt.webp" },
  nest: { icon: "\u{1F95A}", name: "Mystery Nest", img: "assets/morning/mq-icon-nest.webp" },
  train: { icon: "\u{1F3CB}️", name: "Training", img: "assets/morning/mq-icon-train.webp" }
};
// The quest type's icon: Ms. Ariana's picture when there is one, otherwise the emoji
const ic = (T, c) => T.img ? '<img class="mqic' + (c ? " " + c : "") + '" src="' + T.img + '" alt="">' : T.icon;
const MIX = ["catch", "catch", "catch", "catch", "fish", "fish", "hunt", "hunt", "nest", "nest", "train", "train"];

/* Bonus for finishing each quest (on top of what the quest itself gives). ev = during an event, else the plain version. */
export const MQ_BONUS = {
  10: { xp: 10 }, 20: { xp: 20 }, 30: { cur: 15, xp: 30 }, 40: { xp: 40 }, 50: { cur: 25, xp: 50 }, 60: { egg: 1 },
  70: { xp: 70 }, 80: { cur: 40, xp: 80 }, 90: { attack: 1, xp: 90 }, 100: { egg: 1 }, 110: { spin: 1, xp: 110 }, 120: { golden: 1 }
};
export function bonusText(tier, cls) {
  const b = MQ_BONUS[tier], ev = eventMode(cls), S = seasonOf(cls);
  if (b.golden) return "✨ a Golden Present";
  if (b.egg) return "\u{1F95A} an egg";
  if (b.cur && ev) return S.coin + " +" + b.cur + " " + S.cur;
  if (b.attack && ev) return soloOn(cls) ? soloCfg(cls).icon + " a free ingredient" : "⚔️ an extra attack";
  if (b.spin && ev) return "\u{1F3A1} a free wheel spin";
  return "⭐ +" + b.xp + " XP";
}
// Adds the bonus to a save. golden(data) gives the Golden Present (handled by the student page) and returns a Prize Wheel slice or null.
export function applyBonus(s, tier, cls, data, golden) {
  const b = MQ_BONUS[tier], ev = eventMode(cls), base = k => (data[k] != null ? data[k] : Number(s[k]) || 0);
  if (b.golden) return golden(data);
  if (b.egg) data.doorEggs = base("doorEggs") + 1;
  else if (b.cur && ev) data.candyBonus = base("candyBonus") + b.cur;
  else if (b.attack && ev && soloOn(cls)) Object.assign(data, freeIngredient(Object.assign({}, s, data), cls).data);   // potion mode: no boss to attack
  else if (b.attack && ev) data.extraAttacks = base("extraAttacks") + 1;
  else if (b.spin && ev) data.spins = base("spins") + 1;
  else data.doorXP = base("doorXP") + b.xp;
  return null;
}

/* ---------- today's board (the same for the whole class) ---------- */
function rng(seedStr) { let h = 2166136261; for (const ch of seedStr) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const first = f => CREATURES.find(c => c.id === f.forms[0]);
const RAR = ["Common", "Uncommon", "Rare", "Super Rare", "Legendary"];
function poolFor(rarity, water) {
  let p = FAMILIES.filter(f => f.rarity === rarity && !f.event);
  if (water) { const w = p.filter(f => (first(f) || {}).types && first(f).types.includes("Water")); if (w.length) return w;
    // no Water creature at this rarity: the closest rarity that has one
    for (let d = 1; d < 5; d++) for (const r of [RAR[RAR.indexOf(rarity) - d], RAR[RAR.indexOf(rarity) + d]]) { if (!r) continue; const q = FAMILIES.filter(f => f.rarity === r && !f.event && (first(f) || {}).types && first(f).types.includes("Water")); if (q.length) return q; } }
  return p;
}
const boardCache = {};
export function boardFor(date, cls) {
  const key = date + ":" + JSON.stringify(((cls && cls.mqEdit) || {})[date] || {});
  if (boardCache[key]) return boardCache[key];
  const r = rng("mq:" + date), types = MIX.slice();
  for (let i = types.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [types[i], types[j]] = [types[j], types[i]]; }
  const used = new Set(), edit = ((cls && cls.mqEdit) || {})[date] || {};
  const out = MQ_TIERS.map((tier, i) => {
    const type = (edit[tier] && MQ_TYPES[edit[tier]]) ? edit[tier] : types[i], q = { tier, i, type };
    if (type === "catch" || type === "fish") {
      const pool = poolFor(RARITY_BY_TIER[i], type === "fish").filter(f => !used.has(f.id)), pick = pool.length ? pool : poolFor(RARITY_BY_TIER[i], type === "fish");
      const fam = pick[Math.floor(r() * pick.length)]; used.add(fam.id); q.fam = fam.id; q.rarity = fam.rarity;
    }
    return q;
  });
  boardCache[key] = out; return out;
}
export const morningXP = (st, date) => { const h = ((st && st.xpHist) || {})[date || azToday()] || {}; return h.mo != null ? Number(h.mo) || 0 : null; };
const mqOf = (st, date) => (st && st.mq && st.mq.date === date ? st.mq : { date, done: {}, hunt: {} });
export function questState(st, q, date) {
  const m = mqOf(st, date);
  if (m.done[q.tier]) return "done";
  const mo = morningXP(st, date);
  return mo != null && mo >= q.tier ? "ready" : "locked";
}
export function mqReady(st, cls) {
  const d = new Date().getDay(); if (d === 0 || d === 6) return 0;
  const date = azToday(); return boardFor(date, cls).filter(q => questState(st, q, date) === "ready").length;
}

/* ---------- the board (student tab) ---------- */
function questTitle(q) {
  if (q.type === "catch") return "Catch a <b>" + esc(first(FAMILIES.find(f => f.id === q.fam)).name) + "</b>";
  if (q.type === "fish") return "Fish up a <b>" + esc(first(FAMILIES.find(f => f.id === q.fam)).name) + "</b>";
  if (q.type === "hunt") return "Treasure Hunt: <b>" + SHOVELS[q.i] + " shovels</b>";
  if (q.type === "nest") return "Mystery Nest: <b>pick 1 of 3 eggs</b>";
  return "Training: <b>+" + TRAIN_LV[q.i] + " level" + (TRAIN_LV[q.i] === 1 ? "" : "s") + "</b> for a creature";
}
function questPic(q) {
  if (q.fam) { const c = first(FAMILIES.find(f => f.id === q.fam)); return '<img class="mqimg" src="' + esc(c.img) + '" alt="">'; }
  return '<img class="mqimg" src="' + MQ_TYPES[q.type].img + '" alt="">';
}
export function morningTab(s, cls) {
  const date = azToday(), wd = new Date().getDay(), board = boardFor(date, cls), mo = morningXP(s, date), m = mqOf(s, date);
  const nDone = board.filter(q => m.done[q.tier]).length;
  let h = '<div class="card mqintro"><div class="card-head"><h2>\u{1F305} Morning Quest Board</h2><span class="fact">' + nDone + " / 12 done</span></div>" +
    '<p class="lede" style="font-size:13.5px;">Earn XP <b>before ' + MQ_BEFORE + "</b> to unlock today’s quests! Every quest gives a bonus too, and finishing 4 gives a Hero Quest training session (a full board gives 2). The higher the quest, the rarer the creatures — and the better the ✨ Sparkle chance.</p>" +
    (wd === 0 || wd === 6 ? '<p class="small muted">No quests on the weekend — see you Monday morning!</p>'
      : mo == null ? '<p class="small"><b>⏳ Waiting for Ms. Ariana’s morning check.</b> Quests unlock once she adds this morning’s XP.</p>'
      : '<p class="small">\u{1F305} This morning you earned <b>' + mo + " XP</b>!</p>") + "</div>";
  h += '<div class="mqboard">' + board.map(q => {
    const st = wd === 0 || wd === 6 ? "locked" : questState(s, q, date), T = MQ_TYPES[q.type], d = m.done[q.tier];
    return '<div class="mqcard mq-' + st + (q.rarity === "Legendary" ? " mqleg" : "") + '"' + (q.rarity ? ' style="--rc:' + RARITY_COLOR[q.rarity] + '"' : "") + ">" +
      '<div class="mqreq">' + (st === "locked" ? "\u{1F512}" : "✅") + " Earn <b>" + q.tier + " XP</b> before " + MQ_BEFORE + "</div>" +
      '<div class="mqtype">' + ic(T) + " " + T.name + (q.rarity ? ' · <span class="mqrar">' + q.rarity + "</span>" : "") + "</div>" + questPic(q) +
      '<div class="mqtitle">' + questTitle(q) + "</div>" +
      '<div class="mqbonus">+ ' + bonusText(q.tier, cls) + ' · <span title="Sparkle chance">✨ ' + Math.round(SPARKLE_BY_TIER[q.i] * 100) + "%</span></div>" +
      (st === "done" ? '<img class="mqstamp" src="assets/morning/mq-stamp.webp" alt="Complete"><div class="mqgot">' + esc(d.r || "") + "</div>"
        : st === "ready" ? '<button class="btn mqgo" data-mq="' + q.tier + '">' + ic(T) + " Start!</button>" : "") + "</div>";
  }).join("") + "</div>";
  if (nDone === 12) h += '<div class="banner info" style="margin-top:12px;text-align:center;">\u{1F305} <b>You finished the whole board!</b> Come back tomorrow morning for new quests.</div>';
  return h;
}

/* ---------- the quests (overlay, on this page only until saved) ---------- */
let mq = null;   // { tier, q, phase, ... }
export const morningBusy = () => !!mq;
const famName = f => first(FAMILIES.find(x => x.id === f)).name;
function bestFams(s) { return ownedFams(s).sort((a, b) => (owned(s)[b].lvl || 1) - (owned(s)[a].lvl || 1)); }
function makeCatch(s) {
  const me = fighterFrom(s, mq.pick), lvl = Math.max(1, Math.min(60, (owned(s)[mq.pick].lvl || 1))), wild = fighterFrom({ coll: { [mq.q.fam]: { lvl } } }, mq.q.fam);
  // always easy: the wild creature has a little health and only tickles; about 3 hits to catch it
  wild.hp = wild.cur = Math.max(20, Math.round(hitDamage(me, wild, false).dmg * 3)); wild.dmg = Math.max(1, Math.round(me.hp * 0.04 * (50 + me.df) / 50));
  wild.dodge = 0; wild.poison = 0; wild.daze = 0; wild.alt = null; wild.pierce = 0; wild.sp = [];
  mq.bt = { a: { id: "me", name: s.name }, b: { id: "w", name: wild.name }, team: { A: [me], B: [wild] }, active: { A: 0, B: 0 }, moves: { A: null, B: null }, log: [], status: "fight", turn: "A", round: 0 };
  mq.phase = "fight"; mq.lines = ["A wild <b>" + esc(wild.name) + "</b> appears!"];
}
function playCatch(mv) {
  const bt = mq.bt, before = bt.log.length, r = Math.random();
  bt.moves = { A: mv, B: r < 0.75 ? { m: "attack" } : { m: "guard" } };
  resolveRound(bt);
  mq.lines = bt.log.slice(before).map(e => e.k === "hit" ? "<b>" + esc(e.a) + "</b> used " + esc(e.atk) + "! " + (e.miss ? "It missed!" : (e.weak ? "Super effective! " : "") + e.dmg + " damage.") : e.k === "faint" ? "<b>" + esc(e.n) + "</b> fainted!" : e.k === "guard" ? "\u{1F6E1}️ <b>" + esc(e.n) + "</b> is guarding." : e.k === "heal" ? "\u{1F49A} <b>" + esc(e.n) + "</b> healed!" : "").filter(Boolean);
  if (bt.team.B[0].cur <= 0) mq.phase = "caught";
  else if (bt.team.A[0].cur <= 0) mq.phase = "lost";
}
const sparkleRoll = q => Math.random() < SPARKLE_BY_TIER[q.i];
function pickRarity(i) { const odds = NEST_ODDS[band(i)]; let r = Math.random(); for (const [k, p] of odds) { if (r < p) return k; r -= p; } return odds[odds.length - 1][0]; }

export function morningOverlay(s, cls) {
  if (!mq) return "";
  const q = mq.q, T = MQ_TYPES[q.type];
  let h = '<div class="qbover mqover mqo-' + q.type + '"><div class="qbtop"><b>\u{1F305} ' + q.tier + " XP quest · " + ic(T) + " " + T.name + "</b>" +
    (mq.phase === "result" ? "" : '<button class="btn ghost small" data-mqa="quit">Leave</button>') + "</div>";
  if (mq.phase === "result") {
    const res = mq.res;
    h += '<div class="qbpanel win mqresult">' + (res.img ? '<img class="mqresimg' + (res.sparkle ? " sparkle" : "") + '" src="' + esc(res.img) + '" alt="">' : '<div class="mqemoji big">' + (res.icon || "\u{1F389}") + "</div>") +
      "<h3>" + res.title + "</h3>" + (res.sparkle ? '<p class="mqsparkle">✨ SPARKLE! ✨</p>' : "") + (res.sub ? "<p>" + res.sub + "</p>" : "") +
      '<p class="small">\u{1F381} Quest bonus: <b>' + bonusText(q.tier, cls) + "</b></p>" +
      (mq.saved ? '<button class="btn big" data-mqa="done">' + (mq.prize != null ? "\u{1F3C6} Spin the Prize Wheel!" : "Yay! \u{1F389}") + "</button>" : '<p class="muted">Saving…</p>') + "</div>";
    return h + "</div>";
  }
  if (q.type === "catch" || q.type === "train") {
    if (mq.phase === "pick") {
      const fams = bestFams(s);
      h += '<div class="qbpanel"><h3>' + (q.type === "catch" ? "Pick a creature to battle the wild <b>" + esc(famName(q.fam)) + "</b>" : "Pick a creature to train (+" + TRAIN_LV[q.i] + " level" + (TRAIN_LV[q.i] === 1 ? "" : "s") + ")") + "</h3>" +
        (fams.length ? '<div class="qbpick">' + fams.map(f => { const e = owned(s)[f], c = formOf(f, e.lvl || 1), maxed = q.type === "train" && (e.lvl || 1) >= MAX_LEVEL;
          return '<button class="tpick' + (mq.pick === f ? " on" : "") + '" data-mqpick="' + f + '"' + (maxed ? " disabled" : "") + '><img src="' + esc(e.sparkle ? sparkleImg(c) : c.img) + '" alt=""><b>' + esc(e.nick || c.name) + "</b><small>Lv " + (e.lvl || 1) + (maxed ? " · max" : "") + "</small></button>"; }).join("") + "</div>" +
          '<button class="btn big" data-mqa="go"' + (mq.pick ? "" : " disabled") + ">" + (q.type === "catch" ? "⚔️ Battle!" : "\u{1F3CB}️ Train!") + "</button>"
          : '<p>You need a creature first — pick your starter in the Creature Collector!</p>') + "</div>";
      return h + "</div>";
    }
    const bt = mq.bt, me = bt.team.A[0], wd = bt.team.B[0], hp = f => '<span class="qhp"><span style="width:' + Math.max(0, f.cur / f.hp * 100) + '%"></span></span><small>' + Math.max(0, f.cur) + " / " + f.hp + "</small>";
    h += '<div class="qbfield"><div class="qbside them"><div class="qbbar"><b>Wild ' + esc(wd.name) + "</b>" + hp(wd) + '</div><img src="' + esc(wd.img) + '" alt=""></div>' +
      '<div class="qbside mine"><img src="' + esc(me.img) + '" alt=""><div class="qbbar"><b>' + esc(me.name) + "</b>" + hp(me) + "</div></div></div>" +
      '<div class="qbpanel small"><p>' + (mq.lines.join("<br>") || "&nbsp;") + "</p></div>";
    if (mq.phase === "lost") h += '<div class="qbpanel"><h3>\u{1F4A8} The ' + esc(wd.name) + ' got away for now!</h3><button class="btn big" data-mqa="retry">\u{1F501} Try again</button></div>';
    else { const d = hitDamage(me, wd, false).dmg, b = (m, label, sub) => '<button class="mvbtn mv-' + m + '" data-mqmove="' + m + '">' + MOVES[m].icon + " <b>" + label + "</b><small>" + sub + "</small></button>";
      h += '<div class="qbpanel"><div class="mvgrid">' + b("attack", esc(me.attack), "about " + d + " damage") + b("power", "Power Move", "about " + Math.round(d * MOVES.power.mult) + " · 75% to hit") + b("guard", "Guard", "take half damage") + "</div></div>"; }
    return h + "</div>";
  }
  if (q.type === "fish") {
    const c = first(FAMILIES.find(f => f.id === q.fam));
    h += '<div class="mqpond"><div class="mqwater"><img class="mqbob' + (mq.phase === "dip" ? " dip" : "") + '" src="assets/morning/mq-bobber.webp" alt="bobber">' + (mq.phase === "dip" ? '<span class="mqsplash">\u{1F4A6}</span>' : "") + "</div>" +
      '<div class="qbpanel"><h3>' + (mq.phase === "dip" ? "❗ NOW! Reel it in!" : mq.phase === "wait" ? "Wait for the bobber to dip…" : esc(mq.msg || "Cast your line to fish up a " + c.name + "!")) + "</h3>" +
      (mq.phase === "ready" ? '<button class="btn big" data-mqa="cast">\u{1F3A3} Cast!</button>' : '<button class="btn big mqreel" data-mqa="reel">\u{1F3A3} Reel in!</button>') + "</div></div>";
    return h + "</div>";
  }
  if (q.type === "hunt") {
    const dug = mq.dug, left = SHOVELS[q.i] - dug.length;
    h += '<div class="qbpanel mqhunt"><h3>\u{1F5FA}️ Find the treasure chest! <span class="small">⛏️ ' + left + " shovel" + (left === 1 ? "" : "s") + " left</span></h3>" +
      '<div class="mqmap">' + [...Array(16).keys()].map(k => { const i = dug.indexOf(k); return i >= 0 ? '<span class="mqsq dug">' + (k === mq.chest ? '<img class="mqchest" src="assets/morning/mq-chest.webp" alt="chest">' : mq.finds[i]) + "</span>" : '<button class="mqsq" data-mqdig="' + k + '"' + (left > 0 ? "" : " disabled") + "></button>"; }).join("") + "</div>" +
      '<p class="small">Each dig finds something! One square hides the <b>treasure chest</b>.</p></div>';
    return h + "</div>";
  }
  if (q.type === "nest") {
    h += '<div class="qbpanel mqnest"><h3>\u{1FAB9} Pick one egg from the nest!</h3><div class="mqnestbox"><img class="mqnestbg" src="assets/morning/mq-nest.webp" alt=""><div class="mqeggs">' + [0, 1, 2].map(k => '<button class="mqegg" data-mqegg="' + k + '"><img src="assets/morning/mq-egg.webp" alt="Mystery egg"></button>').join("") + "</div></div>" +
      '<p class="small">Better chance at Rare eggs on higher quests. ✨ Sparkle chance ' + Math.round(SPARKLE_BY_TIER[q.i] * 100) + "%</p></div>";
    return h + "</div>";
  }
  return h + "</div>";
}

/* ---------- clicks (c = the student page: { me, cls, patch, render, flash, golden, openPrize }) ---------- */
let fishTimer = null;
const HUNT_FINDS = ["\u{1FA99}", "⭐", "☘️", "\u{1FA99}", "⭐"];
export async function morningClick(el, c) {
  const s = c.me, cls = c.cls, date = azToday();
  if (el.dataset.mq) {
    const q = boardFor(date, cls).find(x => x.tier === Number(el.dataset.mq)); if (!q || questState(s, q, date) !== "ready") return;
    mq = { q, phase: q.type === "fish" ? "ready" : q.type === "hunt" || q.type === "nest" ? "play" : "pick", pick: bestFams(s)[0] || null, lines: [] };
    if (q.type === "hunt") { const prev = (mqOf(s, date).hunt || {})[q.tier] || []; mq.dug = prev.slice(); mq.finds = prev.map((_, i) => HUNT_FINDS[i % HUNT_FINDS.length]);
      mq.chest = Math.floor(rng("chest:" + date + ":" + s.id + ":" + q.tier)() * 16); }
    return c.render(true);
  }
  if (!mq) return;
  const q = mq.q;
  if (el.dataset.mqpick) { mq.pick = el.dataset.mqpick; return c.render(true); }
  if (el.dataset.mqmove) { if (mq.phase !== "fight") return; playCatch({ m: el.dataset.mqmove }); c.render(true); if (mq.phase === "caught") await finish(c, catchResult(s, q, c)); return; }
  if (el.dataset.mqdig != null && q.type === "hunt") {
    const k = Number(el.dataset.mqdig); if (mq.dug.includes(k) || mq.dug.length >= SHOVELS[q.i]) return;
    mq.dug.push(k); mq.finds.push(HUNT_FINDS[(mq.dug.length - 1) % HUNT_FINDS.length]);
    const found = k === mq.chest, out = found || mq.dug.length >= SHOVELS[q.i];
    if (!out) { const m = mqOf(s, date); c.patch({ mq: { date, done: m.done, hunt: Object.assign({}, m.hunt || {}, { [q.tier]: mq.dug.slice() }) } }, true).catch(() => {}); return c.render(true); }
    c.render(true);
    const small = (mq.dug.length - (found ? 1 : 0)) * 5;   // +5 XP for every non-chest dig
    const chestXP = q.tier * 3, egg = found && q.tier >= 60;
    return setTimeout(() => finish(c, { img: found ? "assets/morning/mq-chest-open.webp" : null, icon: found ? "\u{1F4B0}" : "⛏️", title: found ? "You found the treasure chest!" : "Out of shovels!",
      sub: found ? "+" + (chestXP + small) + " XP" + (egg ? " and an egg!" : "") : "The chest stayed hidden, but you dug up +" + (small + Math.round(q.tier / 2)) + " XP.",
      r: found ? "\u{1F4B0} Found the chest" : "⛏️ +" + (small + Math.round(q.tier / 2)) + " XP",
      data: d => { d.doorXP = (d.doorXP != null ? d.doorXP : Number(s.doorXP) || 0) + (found ? chestXP + small : small + Math.round(q.tier / 2)); if (egg) d.doorEggs = (d.doorEggs != null ? d.doorEggs : Number(s.doorEggs) || 0) + 1; } }), 700);
  }
  if (el.dataset.mqegg != null && q.type === "nest") {
    const rar = pickRarity(q.i), sp = sparkleRoll(q), res = doPull(s, rar, cls, { noEvent: true, sparkle: sp }), cr = formOf(res.fam, res.lvl);
    return finish(c, { img: res.sparkle ? sparkleImg(cr) : cr.img, sparkle: res.sparkle, title: (res.dupe ? "Another " : "You hatched a ") + "<b>" + esc(cr.name) + "</b>!", sub: rar + (res.dupe ? " · it went up a level" : ""),
      r: "\u{1F95A} " + cr.name + (res.sparkle ? " ✨" : ""), data: d => { d.coll = res.coll; } });
  }
  const a = el.dataset.mqa;
  if (a === "quit") { clearTimeout(fishTimer); mq = null; return c.render(true); }
  if (a === "go" && mq.pick) {
    if (q.type === "catch") { makeCatch(s); return c.render(true); }
    const e = owned(s)[mq.pick], from = e.lvl || 1, to = Math.min(MAX_LEVEL, from + TRAIN_LV[q.i]), cr = formOf(mq.pick, to), coll = Object.assign({}, owned(s), { [mq.pick]: Object.assign({}, e, { lvl: to }) });
    return finish(c, { img: e.sparkle ? sparkleImg(cr) : cr.img, title: "<b>" + esc(e.nick || cr.name) + "</b> trained hard!", sub: "Level " + from + " → <b>" + to + "</b>" + (formOf(mq.pick, from).id !== cr.id ? " · it evolved!" : ""),
      r: "\u{1F3CB}️ " + cr.name + " Lv " + to, data: d => { d.coll = coll; } });
  }
  if (a === "retry") { makeCatch(s); return c.render(true); }
  if (a === "cast") {
    mq.phase = "wait"; mq.msg = ""; c.render(true); clearTimeout(fishTimer);
    fishTimer = setTimeout(() => { if (!mq || mq.phase !== "wait") return; mq.phase = "dip"; c.render(true);
      fishTimer = setTimeout(() => { if (!mq || mq.phase !== "dip") return; mq.phase = "ready"; mq.msg = "\u{1F4A8} It got away! Cast again."; c.render(true); }, 1100); }, 1200 + Math.random() * 2300);
    return;
  }
  if (a === "reel") {
    if (mq.phase === "wait") { clearTimeout(fishTimer); mq.phase = "ready"; mq.msg = "\u{1F4A6} Too soon — you scared it! Cast again."; return c.render(true); }
    if (mq.phase === "dip") { clearTimeout(fishTimer); return finish(c, catchResult(s, q, c)); }
    return;
  }
  if (a === "done") { const p = mq.prize; mq = null; if (p != null) c.openPrize(p); return c.render(true); }
}
function catchResult(s, q, c) {
  const sp = sparkleRoll(q), res = doPull(s, q.rarity, c.cls, { force: q.fam, sparkle: sp }), cr = formOf(res.fam, res.lvl);
  return { img: res.sparkle ? sparkleImg(cr) : cr.img, sparkle: res.sparkle, title: "You caught <b>" + esc(cr.name) + "</b>!", sub: q.rarity + (res.dupe ? " · you already had one, so it went up a level" : " · it’s in your Creature Collector"),
    r: (q.type === "fish" ? "\u{1F3A3} " : "\u{1F3AF} ") + cr.name + (res.sparkle ? " ✨" : ""), catch: true, data: d => { d.coll = res.coll; } };
}
async function finish(c, res) {
  const s = c.me, cls = c.cls, date = azToday(), q = mq.q, m = mqOf(s, date), data = {};
  res.data(data);
  const done = Object.assign({}, m.done, { [q.tier]: { t: q.type, r: res.r, at: new Date().toISOString() } }), hunt = Object.assign({}, m.hunt || {}); delete hunt[q.tier];
  data.mq = { date, done, hunt };
  data.mqDays = Object.assign({}, s.mqDays || {}, { [date]: Object.keys(done).length });   // for the Season Pass
  if (res.catch) data.mqCatch = (Number(s.mqCatch) || 0) + 1;
  if (Object.keys(done).length >= MQ_TIERS.length) data.mqFull = (Number(s.mqFull) || 0) + 1;
  mq.prize = applyBonus(s, q.tier, cls, data, c.golden);
  mq.phase = "result"; mq.res = res; mq.saved = false; c.render(true);
  try { await c.patch(data, true); mq.saved = true; }
  catch (e) { c.flash("That quest didn’t save — tell Ms. Ariana! (" + (e.code || e.message) + ")"); mq = null; }
  c.render(true);
}
