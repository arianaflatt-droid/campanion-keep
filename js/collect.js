// Creature Collector: pulls, XP bank, levels, evolutions, lorebook and arena battles.
import { CREATURES, FAMILIES, TYPE_WEAK } from "./creatures.js";

export const PULL_XP = 120;          // every 120 XP (all-time since the collector started) = 1 pull
export const LEVEL_XP = 120;         // 120 banked XP = 1 level
export const MAX_LEVEL = 100;
export const TEAM_MAX = 4;
export const CRIT_CHANCE = 0.01, CRIT_MULT = 1.5;
export const ODDS = [["Common", 0.70], ["Uncommon", 0.20], ["Rare", 0.08], ["Super Rare", 0.02]];
export const RARITY_COLOR = { "Common": "#8FA39A", "Uncommon": "#3FA46A", "Rare": "#3D7FE0", "Super Rare": "#A259E6", "Legendary": "#E9A91C" };
export const STARTERS = ["C-01", "C-02", "C-03"];
// Sparkle: a rare colour variant. Any hatched creature has a 0.05% (1 in 2,000) chance to be a Sparkle.
export const SPARKLE_CHANCE = 0.0005;
// When the Sparkle art arrives, drop it in assets/creatures/sparkle/ with the same file names and set this to true.
// Rarities whose Sparkle art is in assets/creatures/sparkle/ (same file names). Others fall back to a colour shift.
export const SPARKLE_ART = ["Common", "Uncommon", "Rare", "Super Rare", "Legendary"];
export const hasSparkleArt = c => SPARKLE_ART.includes(c.rarity);
export const HAS_SPARKLE_ART = false; // kept for older code; use hasSparkleArt(c)
export function sparkleImg(c) { return hasSparkleArt(c) ? c.img.replace("assets/creatures/", "assets/creatures/sparkle/") : c.img; }
export function isSparkle(st, fam) { const e = (st.coll || {})[fam]; return !!(e && e.sparkle); }

const byIdMap = {}; CREATURES.forEach(c => { byIdMap[c.id] = c; });
const famMap = {}; FAMILIES.forEach(f => { famMap[f.id] = f; });
export const creature = id => byIdMap[id] || null;
export const family = id => famMap[id] || null;

/* ---------- XP history ----------
   xpHist = { "YYYY-MM-DD": { l: lunchXP, d: endOfDayXP } } written by the teacher's uploads.
   A day counts its end-of-day number, or the lunch number if end-of-day isn't in yet. */
export function xpTotal(st, cls) {
  const start = (cls && cls.collectorStart) || "0000-00-00";
  const hist = st.xpHist || {};
  let n = 0;
  Object.keys(hist).forEach(date => {
    if (date < start) return;
    const h = hist[date] || {}, v = h.d != null ? h.d : h.l != null ? h.l : 0;
    n += Math.max(0, Number(v) || 0);
  });
  return Math.round(n);
}
// Eggs are counted day by day: a day under 120 XP gives no eggs; a day at 120+ gives 1 egg per 120 XP
// (120 = 1, 240 = 2, ...). All XP still goes into the bank for levelling either way.
export function dayXPs(st, cls) {
  const start = (cls && cls.collectorStart) || "0000-00-00", hist = st.xpHist || {}, out = [];
  Object.keys(hist).sort().forEach(date => {
    if (date < start) return;
    const h = hist[date] || {}, v = h.d != null ? h.d : h.l != null ? h.l : 0;
    out.push({ date, xp: Math.max(0, Math.round(Number(v) || 0)) });
  });
  return out;
}
export function eggsFromXP(xp) { return xp >= PULL_XP ? Math.floor(xp / PULL_XP) : 0; }
// Lunch Hero bonus: +1 egg on every day a student is Lunch Hero: their lunch data already showed 120+ XP,
// or the teacher marked them Lunch Hero by hand (the ☀️ button, saved as xpHist[date].lh).
// (Lunch data is only accepted before the lunch cutoff, so this can't be earned in the afternoon.)
export const LUNCH_BONUS_EGGS = 1;
export function lunchBonusDays(st, cls) {
  if (cls && cls.lunchBonus === false) return 0;
  const start = (cls && cls.collectorStart) || "0000-00-00", goal = (cls && Number(cls.goal)) || 120, hist = st.xpHist || {};
  return Object.keys(hist).filter(d => d >= start && hist[d] && (hist[d].lh || (hist[d].l != null && Number(hist[d].l) >= goal))).length;
}
export function pullsEarned(st, cls) {
  return dayXPs(st, cls).reduce((n, d) => n + eggsFromXP(d.xp), 0) + lunchBonusDays(st, cls) * LUNCH_BONUS_EGGS + (Number(st.bonusPulls) || 0);
}
// How much more XP today (the latest day with data) until the next egg.
export function todayXP(st, cls) {
  const t = new Date(), iso = t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0");
  const d = dayXPs(st, cls).find(x => x.date === iso); return d ? d.xp : 0;
}
export function pullsLeft(st, cls) { return Math.max(0, pullsEarned(st, cls) - (Number(st.pullsUsed) || 0)); }
// Birthday eggs: the teacher sends one on a student's birthday; it always hatches Wisholotl.
export const WISH_FAM = "L-28";
export function birthdayLeft(st) { return Math.max(0, (Number(st.birthdayEggs) || 0) - (Number(st.birthdayUsed) || 0)); }
export function legendaryLeft(st) { return Math.max(0, (Number(st.legendaryPulls) || 0) - (Number(st.legendaryUsed) || 0)); }
export function bankXP(st, cls) { return Math.max(0, xpTotal(st, cls) + (Number(st.bonusXP) || 0) - (Number(st.xpSpent) || 0)); }
export function xpToNextPull(st, cls) { const x = todayXP(st, cls); return PULL_XP - (x % PULL_XP); }

/* ---------- collection ----------
   coll = { "C-01": { lvl: 5, at: ISO } }  (one entry per family; the form comes from the level) */
export function owned(st) { return st.coll || {}; }
// Spares: duplicate creatures kept for trading instead of turning into a free level. [{ id, fam, lvl, sparkle, at }]
export function spares(st) { return (st && st.spares) || []; }
export const spareId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
export function ownedFams(st) { return Object.keys(owned(st)); }
export function hasStarter(st) { return ownedFams(st).length > 0; }
export function formIndex(fam, lvl) {
  const f = family(fam); if (!f) return 0;
  let i = 0;
  for (let k = 0; k < f.forms.length - 1; k++) { const c = creature(f.forms[k]); if (c.evolvesAt && lvl >= c.evolvesAt) i = k + 1; }
  return i;
}
export function formOf(fam, lvl) { const f = family(fam); return f ? creature(f.forms[formIndex(fam, lvl)]) : null; }
export function statsOf(c, lvl) {
  const L = Math.max(1, lvl) - 1;
  return { hp: Math.round(c.hp + c.ghp * L), df: Math.round(c.df + c.gdf * L), dmg: Math.round(c.dmg + c.gdmg * L) };
}
// Forms that show in the lorebook: every form up to the one each owned family has reached.
export function seenSet(st) {
  const out = new Set((st && st.dex) || []);   // dex = forms seen on creatures that were traded away
  Object.entries(owned(st)).forEach(([fam, e]) => {
    const f = family(fam); if (!f) return;
    const top = formIndex(fam, e.lvl || 1);
    f.forms.forEach((id, i) => { if (i <= top) out.add(id); });
  });
  return out;
}

/* ---------- limited event Legendaries ----------
   Each event creature unlocks for a student once they hit 120 XP 5 school days in a row while the event is running.
   Then every egg has a 95% chance to be it until they catch it, and 1% for another one after that (a free level).
   - Duckarune: 10 school days from its start date (class field duckStart; duckOff turns it off). Once caught, the 1% keeps going after the event.
   - Hexaduck: while Haunt-O-Ween Mode is on (the streak only counts days since the mode was turned on, class field hauntSince).
     Once caught, the 1% keeps going even after Haunt-O-Ween ends. */
export const EVENTS = [
  { key: "duck", fam: "L-26", icon: "\u{1F986}", start: "2026-09-28", schoolDays: 10, streak: 5, first: 0.95, again: 0.01, againAfter: true },
  { key: "hex",  fam: "L-27", icon: "\u{1F383}", haunt: true, streak: 5, first: 0.95, again: 0.01, againAfter: true },
  // Thanksolotl: all of November (Gobble-Palooza). The streak only counts November days. Arizona dates.
  { key: "thanks", fam: "L-29", icon: "\u{1F983}", from: "2026-11-01", to: "2026-11-30", label: "Gobble-Palooza", streak: 5, first: 0.95, again: 0.01, againAfter: true },
];
export const DUCK = EVENTS[0], HEX = EVENTS[1];
const isoDate = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
export function azToday(date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Phoenix", year: "numeric", month: "2-digit", day: "2-digit" }).format(date || new Date());   // YYYY-MM-DD
}
export function duckWindow(cls) {
  const start = (cls && cls.duckStart) || DUCK.start;
  const d = new Date(start + "T12:00:00"), days = [];
  while (days.length < DUCK.schoolDays) { if (d.getDay() > 0 && d.getDay() < 6) days.push(isoDate(d)); d.setDate(d.getDate() + 1); }
  return { start: days[0], end: days[days.length - 1], days };
}
export function eventWindow(ev, cls) {
  if (ev.from) { const d = new Date(ev.from + "T12:00:00"), days = []; while (isoDate(d) <= ev.to) { if (d.getDay() > 0 && d.getDay() < 6) days.push(isoDate(d)); d.setDate(d.getDate() + 1); } return { start: ev.from, end: ev.to, days }; }
  if (ev.haunt) return { start: (cls && cls.hauntSince) || "0000-00-00", end: null };
  return duckWindow(cls);
}
export function eventOpen(ev, cls, date) {
  if (ev.from) { if (cls && cls[ev.key + "Off"]) return false; const t = azToday(date); return t >= ev.from && t <= ev.to; }
  if (ev.haunt) return !!(cls && cls.haunt);
  if (cls && cls.duckOff) return false;
  const w = duckWindow(cls), t = azToday(date);
  return t >= w.start && t <= w.end;   // weekends in the middle count too, so eggs can still be hatched
}
export const duckOpen = (cls, date) => eventOpen(DUCK, cls, date);
// best run of 120 XP school days in a row (days with no upload are skipped), and the current run; optional start date
export function streaks(st, cls, since) {
  const goal = (cls && Number(cls.goal)) || 120, h = st.xpHist || {};
  let best = 0, run = 0;
  Object.keys(h).sort().forEach(date => { if (since && date < since) return; const x = h[date] || {}, v = Number(x.d != null ? x.d : x.l) || 0; run = v >= goal ? run + 1 : 0; best = Math.max(best, run); });
  return { best, current: run };
}
export const eventStreak = (ev, st, cls) => streaks(st, cls, ev.haunt || ev.from ? eventWindow(ev, cls).start : null);
export const hasEvent = (ev, st) => !!owned(st)[ev.fam];
export const hasDuck = st => hasEvent(DUCK, st);
export function eventUnlocked(ev, st, cls) { return eventOpen(ev, cls) && eventStreak(ev, st, cls).best >= ev.streak; }
export const duckUnlocked = (st, cls) => eventUnlocked(DUCK, st, cls);
export function eventChance(ev, st, cls) {
  if (hasEvent(ev, st)) return eventOpen(ev, cls) || ev.againAfter ? ev.again : 0;
  return eventUnlocked(ev, st, cls) ? ev.first : 0;
}
// which event creature (if any) this egg becomes (uncaught ones are tried first)
function rollEvent(st, cls) {
  const order = EVENTS.slice().sort((a, b) => (hasEvent(a, st) ? 1 : 0) - (hasEvent(b, st) ? 1 : 0));
  for (const ev of order) if (Math.random() < eventChance(ev, st, cls)) return ev;
  return null;
}

/* ---------- the teacher's own collection ----------
   Saved on the class doc (cls.teacher). Each finalized day gives the teacher 1 egg for every student who hit 120 XP,
   and TEACHER_XP_PER_MISS banked XP for every student who didn't (excused days don't count).
   Her eggs can also hatch Legendaries (0.05%). She shows up in the arena as "Ms. Ariana" and can battle students. */
export const TEACHER_ID = "teacher";
export const TEACHER_XP_PER_MISS = 120;   // one level per student who missed 120
export const TEACHER_ODDS = [["Common", 0.6995], ["Uncommon", 0.20], ["Rare", 0.08], ["Super Rare", 0.02], ["Legendary", 0.0005]];
export function teacherPlayer(cls, name) {
  const t = (cls && cls.teacher) || {};
  return { id: TEACHER_ID, isTeacher: true, name: name || t.name || "Ms. Ariana", companionId: "teacher", coll: t.coll || {},
    pullsUsed: Number(t.pullsUsed) || 0, xpSpent: Number(t.xpSpent) || 0, bonusPulls: Number(t.eggsEarned) || 0, bonusXP: Number(t.xpEarned) || 0,
    legendaryPulls: 0, legendaryUsed: 0, arenaReady: !!t.arenaReady, tradeReady: t.tradeReady !== false, xpHist: {}, spares: t.spares || [], dex: t.dex || [] };
}
export function rollTeacherRarity() {
  let r = Math.random();
  for (const [name, p] of TEACHER_ODDS) { if (r < p) return name; r -= p; }
  return "Common";
}
// What finalizing day d gives the teacher.
export function teacherReward(students, d) {
  const arr = (a, i) => (Array.isArray(a) ? a[i] : undefined);
  const team = students.filter(s => s.companionId), hit = team.filter(s => arr(s.status, d) === "c").length;
  const missed = team.filter(s => { const v = arr(s.status, d); return v !== "c" && v !== "e"; }).length;
  // a day when everyone hit 120 still gives the teacher one level's worth of XP
  return { eggs: hit, xp: missed > 0 ? missed * TEACHER_XP_PER_MISS : TEACHER_XP_PER_MISS, hit, missed };
}

/* ---------- gacha ---------- */
function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
export function rollRarity() {
  let r = Math.random();
  for (const [name, p] of ODDS) { if (r < p) return name; r -= p; }
  return "Common";
}
// Returns the new coll map and what happened: { fam, id, rarity, dupe, lvl }
// opts.force = a family id (birthday egg). opts.legendaryEgg = an egg the teacher sent: once any birthday egg has been sent,
// Wisholotl is also in the pool for teacher-sent legendary eggs.
export function doPull(st, rarity, cls, opts) {
  opts = opts || {};
  const pool = FAMILIES.filter(f => f.rarity === rarity && (!f.event || (opts.legendaryEgg && f.id === WISH_FAM && cls && cls.wishInPool)));   // event creatures never come from normal eggs
  const ev = opts.force ? null : rollEvent(st, cls);
  const event = opts.force ? (family(opts.force) || {}).event || null : ev ? ev.key : null;
  const fam = opts.force || (ev ? ev.fam : pick(pool).id);
  const coll = Object.assign({}, owned(st));
  const had = coll[fam], sparkle = Math.random() < SPARKLE_CHANCE;
  if (had) coll[fam] = Object.assign({}, had, { lvl: Math.min(MAX_LEVEL, (had.lvl || 1) + 1) });
  else coll[fam] = { lvl: 1, at: new Date().toISOString() };
  // a Sparkle hatch turns the family Sparkle for good (a duplicate Sparkle still levels up too)
  const newSparkle = sparkle && !(had && had.sparkle);
  if (sparkle) coll[fam].sparkle = true;
  const lvl = coll[fam].lvl;
  return { coll, fam, prev: had ? Object.assign({}, had) : null, rarity: event ? "Legendary" : rarity, event, dupe: !!had, lvl, sparkle, newSparkle, id: formOf(fam, lvl).id, evolved: had && formIndex(fam, had.lvl || 1) !== formIndex(fam, lvl) };
}

/* ---------- arena schedule (Arizona time: no daylight saving) ---------- */
export function azNow(date) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Phoenix", weekday: "short", hour: "numeric", minute: "numeric", hour12: false })
    .formatToParts(date || new Date());
  const get = t => (parts.find(p => p.type === t) || {}).value;
  return { day: get("weekday"), h: Number(get("hour")) % 24, m: Number(get("minute")) };
}
export function arenaOpen(cls, date) {
  const o = cls && cls.arenaOverride;
  if (o === "open") return true;
  if (o === "closed") return false;
  const t = azNow(date), mins = t.h * 60 + t.m;
  if (t.day === "Sat" || t.day === "Sun") return true;
  return (mins >= 11 * 60 && mins < 12 * 60) || mins >= 14 * 60;
}
/* ---------- Trading schedule ----------
   Same hours and switches as the arena, set separately: tradeOverride ("open"/"closed"), lunchTrade, goalTrade.
   tradeOff (the old on/off switch) still counts as closed. */
export function tradeOpen(cls, date) {
  if (cls && cls.tradeOff) return false;
  const o = cls && cls.tradeOverride;
  if (o === "open") return true;
  if (o === "closed") return false;
  const t = azNow(date), mins = t.h * 60 + t.m;
  if (t.day === "Sat" || t.day === "Sun") return true;
  return (mins >= 11 * 60 && mins < 12 * 60) || mins >= 14 * 60;
}
export function tradeOpenFor(st, cls, date) {
  const closed = cls && (cls.tradeOff || cls.tradeOverride === "closed");
  if (st && st.isTeacher) return !closed;
  if (tradeOpen(cls, date)) return true;
  if (closed) return false;
  if (!hitGoalToday(st, cls, date)) return false;
  if (cls && cls.goalTrade && !["Sat", "Sun"].includes(azNow(date).day)) return true;
  if (cls && cls.lunchTrade === false) return false;
  return lunchHour(date);
}
export const ARENA_HOURS = "Weekdays 11 am–12 pm and 2 pm–midnight · all day on weekends (Arizona time)";
// Lunch arena: weekdays 12–1 pm, only for students who already hit 120 XP today (lunch or end-of-day upload).
export const LUNCH_ARENA = "Weekdays 12–1 pm for anyone who has already hit 120 XP today";
export function lunchHour(date) { const t = azNow(date); return !["Sat", "Sun"].includes(t.day) && t.h === 12; }
export function hitGoalToday(st, cls, date) {
  const goal = (cls && Number(cls.goal)) || 120, h = ((st && st.xpHist) || {})[azToday(date)] || {};
  return Math.max(Number(h.l) || 0, Number(h.d) || 0) >= goal;
}
export function arenaOpenFor(st, cls, date) {
  if (st && st.isTeacher) return !(cls && cls.arenaOverride === "closed");
  if (arenaOpen(cls, date)) return true;
  if (cls && cls.arenaOverride === "closed") return false;
  if (!hitGoalToday(st, cls, date)) return false;
  // "120 XP battlers" switch: anyone at 120 today can battle any time on a weekday
  if (cls && cls.goalArena && !["Sat", "Sun"].includes(azNow(date).day)) return true;
  if (cls && cls.lunchArena === false) return false;
  return lunchHour(date);
}

/* ---------- battles ----------
   A battle doc: { a:{id,name}, b:{id,name}, status: invite|team|lead|done|declined, n, turn:"A"|"B",
     team:{A:[fighter],B:[fighter]}, active:{A:idx|null,B:idx|null}, log:[event], winner }
   fighter = { fam, id, lvl, name, img, type, weak, attack, hp, df, dmg, cur } */
export function fighterFrom(st, fam) {
  const e = owned(st)[fam]; if (!e) return null;
  const c = formOf(fam, e.lvl || 1), s = statsOf(c, e.lvl || 1);
  return { fam, id: c.id, lvl: e.lvl || 1, name: e.nick || c.name, species: c.name, img: e.sparkle ? sparkleImg(c) : c.img, sparkle: !!e.sparkle, face: c.face || "R", type: c.types[0], types: c.types, weak: c.weak, attack: c.attack, hp: s.hp, df: s.df, dmg: s.dmg, cur: s.hp };
}
export function teamSize(a, b) { return Math.max(0, Math.min(TEAM_MAX, ownedFams(a).length, ownedFams(b).length)); }
export function hitDamage(att, def, crit) {
  const weak = (def.weak || []).includes(att.type);
  let d = att.dmg * 50 / (50 + def.df);
  if (weak) d *= 2;
  if (crit) d *= CRIT_MULT;
  return { dmg: Math.max(1, Math.round(d)), weak };
}
export function alive(team) { return (team || []).filter(f => f.cur > 0).length; }
// Fight until one active creature faints (or the battle ends). Mutates and returns the battle.
export function resolve(bt) {
  const other = s => (s === "A" ? "B" : "A");
  let guard = 0;
  while (bt.active.A != null && bt.active.B != null && guard++ < 500) {
    const s = bt.turn, o = other(s);
    const att = bt.team[s][bt.active[s]], def = bt.team[o][bt.active[o]];
    const crit = Math.random() < CRIT_CHANCE;
    const { dmg, weak } = hitDamage(att, def, crit);
    def.cur = Math.max(0, def.cur - dmg);
    bt.log.push({ k: "hit", s, ai: bt.active[s], di: bt.active[o], a: att.name, atk: att.attack, d: def.name, dmg, crit, weak, left: def.cur, max: def.hp });
    bt.turn = o;
    if (def.cur <= 0) {
      bt.log.push({ k: "faint", s: o, i: bt.active[o], n: def.name });
      bt.active[o] = null;
      if (!alive(bt.team[o])) { bt.status = "done"; bt.winner = s; bt.log.push({ k: "win", s }); }
      else bt.status = "lead";
      break;
    }
  }
  return bt;
}
export { CREATURES, FAMILIES, TYPE_WEAK };
