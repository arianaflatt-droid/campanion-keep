// Creature Collector: pulls, XP bank, levels, evolutions, lorebook and arena battles.
import { CREATURES, FAMILIES, TYPE_WEAK } from "./creatures.js?v=20261001f";

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

// Bump ART_VERSION whenever creature pictures are replaced, so browsers load the new art instead of old saved copies.
export const ART_VERSION = "20260929b";
CREATURES.forEach(c => { if (c.img && !c.img.includes("?")) c.img += "?v=" + ART_VERSION; });
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
  return dayXPs(st, cls).reduce((n, d) => n + eggsFromXP(d.xp), 0) + lunchBonusDays(st, cls) * LUNCH_BONUS_EGGS + (Number(st.bonusPulls) || 0) + (Number(st.doorEggs) || 0);
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
export function bankXP(st, cls) { return Math.max(0, xpTotal(st, cls) + (Number(st.bonusXP) || 0) + (Number(st.xpReleased) || 0) + (Number(st.xpPrize) || 0) + (Number(st.doorXP) || 0) - (Number(st.xpSpent) || 0)); }
// Event eggs (from a Golden Present): st.themeEggs = ["jingle", ...], st.themeUsed = how many are hatched.
// Each one hatches a creature of that event's types (normal rarity odds).
export const THEME_TYPES = { haunt: ["Ghost"], gobble: ["Nature"], jingle: ["Ice", "Light"] };
export const THEME_EGG = { haunt: "Haunt-O-Ween egg", gobble: "Gobble-Palooza egg", jingle: "Jingle egg" };
export function themeLeft(st) { return Math.max(0, ((st && st.themeEggs) || []).length - (Number(st && st.themeUsed) || 0)); }
export function nextTheme(st) { return ((st && st.themeEggs) || [])[Number(st && st.themeUsed) || 0] || null; }
/* ---------- releasing ----------
   A creature (from the collection or a spare) can be released for banked XP, by rarity.
   Keep in step with the 300 cap in firestore.rules. */
export const RELEASE_XP = { "Common": 20, "Uncommon": 40, "Rare": 80, "Super Rare": 150, "Legendary": 300 };
export function releaseXP(fam) { const f = FAMILIES.find(x => x.id === fam); return (f && RELEASE_XP[f.rarity]) || 0; }
// Why this creature can't be released right now (null = it can). key is "m:FAM" (collection) or "s:ID" (spare).
export function releaseProblem(st, key, battles, trades) {
  const isSpare = String(key).startsWith("s:");
  const sp = isSpare ? spares(st).find(x => x.id === key.slice(2)) : null, fam = isSpare ? sp && sp.fam : String(key).replace(/^m:/, "");
  if (!fam || (isSpare ? !sp : !owned(st)[fam])) return "That creature isn\u2019t here anymore.";
  const f = FAMILIES.find(x => x.id === fam);
  if (f && f.event) return "Limited event Legendaries can\u2019t be released.";
  if (!isSpare) {
    if (Object.keys(owned(st)).length < 2) return "You can\u2019t release your last creature.";
    if (st.starter === fam) return "Your starter creature stays with you.";
    if (st.petCreature === fam) return "That creature is your companion right now.";
  }
  // only a battle started in the last hour counts (old challenges nobody answered don't block releasing)
  const recent = b => !b.created || Date.now() - new Date(b.created).getTime() < 3600e3;
  if ((battles || []).some(b => LIVE.includes(b.status) && !staleBattle(b) && ((b.a && b.a.id === st.id) || (b.b && b.b.id === st.id)))) return "Finish your battle first!";
  const inTrade = (trades || []).some(t => t.status === "offer" && [t.give, t.get].some(x => x && (isSpare ? x.spare === sp.id : !x.spare && x.fam === fam)) && ((t.a && t.a.id === st.id) || (t.b && t.b.id === st.id)));
  if (inTrade) return "That creature is in a trade offer. Cancel the offer first.";
  return null;
}
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
  { key: "hex",  fam: "L-27", icon: "\u{1F383}", haunt: true, boss: "ghostDefeated", bossName: "Ghost-olotl", streak: 5, first: 0.95, again: 0.01, againAfter: true },
  // Thanksolotl: all of November (Gobble-Palooza). The streak only counts November days. Arizona dates.
  { key: "thanks", fam: "L-29", icon: "\u{1F983}", from: "2026-11-01", to: "2026-11-30", label: "Gobble-Palooza", boss: "turkeyDefeated", bossName: "Turducken", streak: 5, first: 0.95, again: 0.01, againAfter: true },
  // Jinglotl: all of December (Jingle Jam). Unlocks for everyone once the class defeats the Grinch-a-Duck.
  { key: "jingle", fam: "L-30", icon: "\u{1F384}", from: "2026-12-01", to: "2026-12-31", label: "Jingle Jam", boss: "grinchDefeated", bossName: "Grinch-a-Duck", streak: 5, first: 0.95, again: 0.01, againAfter: true },
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
// Boss events (Hexaduck, Thanksolotl) unlock for everyone once the class has defeated that event's boss (no streak needed).
// The others (Duckarune) unlock with a 5-day 120 XP streak during the event.
export const bossLocked = (ev, cls) => !!ev.boss && !(cls && cls[ev.boss]);
export function eventUnlocked(ev, st, cls) {
  if (!eventOpen(ev, cls)) return false;
  if (ev.boss) return !bossLocked(ev, cls);
  return eventStreak(ev, st, cls).best >= ev.streak;
}
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
    pullsUsed: Number(t.pullsUsed) || 0, xpSpent: Number(t.xpSpent) || 0, bonusPulls: Number(t.eggsEarned) || 0, bonusXP: Number(t.xpEarned) || 0, xpReleased: Number(t.xpReleased) || 0,
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
  let pool = FAMILIES.filter(f => f.rarity === rarity && (!f.event || (opts.legendaryEgg && f.id === WISH_FAM && cls && cls.wishInPool)));   // event creatures never come from normal eggs
  if (opts.types) {   // an event egg: only creatures of those types (falls back to the whole pool if none at that rarity)
    const typed = pool.filter(f => { const c0 = CREATURES.find(c => c.id === f.forms[0]); return c0 && c0.types.some(t => opts.types.includes(t)); });
    if (typed.length) pool = typed;
  }
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
/* A battle in progress. 15 minutes with no moves (upd = last change) and it no longer holds anyone up. */
export const LIVE = ["invite", "team", "lead", "fight"];
export const STALE_MS = 15 * 60 * 1000;
export const staleBattle = b => LIVE.includes(b.status) && Date.now() - new Date(b.upd || b.created || 0).getTime() > STALE_MS;
/* ---------- battle moves (both players pick, then the round plays out) ----------
   attack = normal hit · power = 1.5x damage but 75% to hit · guard = take half damage this round
   heal = +35% HP (once per creature) · swap = switch to another creature on your team (uses your turn) */
export const MOVES = {
  attack: { icon: "\u2694\uFE0F", name: "Attack" },
  power:  { icon: "\u{1F4A5}", name: "Power Move", mult: 1.5, hit: 0.75 },
  guard:  { icon: "\u{1F6E1}\uFE0F", name: "Guard" },
  heal:   { icon: "\u{1F49A}", name: "Heal", pct: 0.35 },
  swap:   { icon: "\u{1F504}", name: "Swap" }
};
export function moveOk(bt, side, mv) {
  const team = bt.team && bt.team[side], cur = team && team[bt.active[side]];
  if (!mv || !MOVES[mv.m] || !cur || cur.cur <= 0) return false;
  if (mv.m === "heal") return !cur.healed && cur.cur < cur.hp;
  if (mv.m === "swap") return Number.isInteger(mv.to) && mv.to !== bt.active[side] && team[mv.to] && team[mv.to].cur > 0;
  return true;
}
// Play one round once both moves are in. Mutates and returns the battle.
export function resolveRound(bt) {
  const other = s => (s === "A" ? "B" : "A"), mv = bt.moves || {};
  const first = bt.turn || "A", order = [first, other(first)], who = s => (s === "A" ? bt.a.name : bt.b.name);
  bt.round = (Number(bt.round) || 0) + 1;
  const guard = {};
  // 1. swaps
  order.forEach(s => { const m = mv[s]; if (m && m.m === "swap" && moveOk(bt, s, m)) {
    const from = bt.team[s][bt.active[s]]; bt.active[s] = m.to;
    bt.log.push({ k: "swap", s, i: m.to, n: bt.team[s][m.to].name, from: from.name, who: who(s) }); } });
  // 2. heals and guards
  order.forEach(s => { const m = mv[s], f = bt.team[s][bt.active[s]]; if (!m || !f) return;
    if (m.m === "heal" && !f.healed && f.cur < f.hp) { const amt = Math.min(f.hp - f.cur, Math.round(f.hp * MOVES.heal.pct)); f.cur += amt; f.healed = true;
      bt.log.push({ k: "heal", s, i: bt.active[s], n: f.name, amt, left: f.cur, max: f.hp }); }
    if (m.m === "guard") { guard[s] = true; bt.log.push({ k: "guard", s, i: bt.active[s], n: f.name }); } });
  // 3. attacks, in order; a creature that faints first doesn't get to hit
  for (const s of order) {
    const m = mv[s], o = other(s); if (!m || (m.m !== "attack" && m.m !== "power")) continue;
    const att = bt.team[s][bt.active[s]], def = bt.team[o][bt.active[o]];
    if (!att || !def || att.cur <= 0 || def.cur <= 0) continue;
    const power = m.m === "power", miss = power && Math.random() >= MOVES.power.hit, crit = !miss && Math.random() < CRIT_CHANCE;
    let { dmg, weak } = hitDamage(att, def, crit);
    if (power) dmg = Math.round(dmg * MOVES.power.mult);
    if (guard[o]) dmg = Math.max(1, Math.round(dmg / 2));
    if (miss) dmg = 0;
    def.cur = Math.max(0, def.cur - dmg);
    bt.log.push({ k: "hit", s, ai: bt.active[s], di: bt.active[o], a: att.name, atk: power ? att.attack + " (Power)" : att.attack, d: def.name, dmg, crit, weak: weak && !miss, miss, power, guarded: !!guard[o], left: def.cur, max: def.hp });
    if (def.cur <= 0) {
      bt.log.push({ k: "faint", s: o, i: bt.active[o], n: def.name });
      bt.active[o] = null;
      if (!alive(bt.team[o])) { bt.status = "done"; bt.winner = s; bt.log.push({ k: "win", s }); bt.moves = { A: null, B: null }; return bt; }
    }
  }
  bt.moves = { A: null, B: null };
  bt.turn = other(first);   // the other player goes first next round
  bt.status = bt.active.A != null && bt.active.B != null ? "fight" : "lead";
  return bt;
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
