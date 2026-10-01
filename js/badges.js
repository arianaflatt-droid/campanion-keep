import { owned as roomOwned, fitOf as roomFit, FIT_SLOTS, setItems as roomSet } from "./room.js?v=20260930j";
import { presentsOpened } from "./doors.js?v=20260930j";
// Badges: worked out from each student's saved data, so nothing extra is stored and no rules change.
// To add a badge: add an entry with a check(st) that returns how far along the student is,
// and a goal. Put its picture in assets/badges/ (a transparent WEBP or PNG). Without a picture, the emoji shows.
import { esc, goalXP, candyOf, ghostUnlocked } from "./game.js?v=20260930j";
import { seenSet, ownedFams, owned, family, formIndex, formOf, STARTERS, CREATURES } from "./collect.js?v=20260930j";

export const hatches = st => (Number(st.pullsUsed) || 0) + (Number(st.legendaryUsed) || 0);

// the limited-event Duckarune is a bonus: it isn't needed for the lorebook badges
const EVENT_IDS = new Set(CREATURES.filter(c => c.event).map(c => c.id));
export const discovered = st => [...seenSet(st)].filter(id => !EVENT_IDS.has(id)).length;
export const families = st => ownedFams(st).length;
const famsOf = st => ownedFams(st).map(family).filter(Boolean);
const rarityCount = (st, r) => famsOf(st).filter(f => f.rarity === r).length;
// a family evolved all the way to its last form
export const fullLines = st => Object.entries(owned(st)).filter(([fam, e]) => { const f = family(fam); return f && f.forms.length > 1 && formIndex(fam, e.lvl || 1) === f.forms.length - 1; }).length;
export const starters = st => STARTERS.filter(id => owned(st)[id]).length;
export const RARITIES = ["Common", "Uncommon", "Rare", "Super Rare", "Legendary"];
export const raritiesOwned = st => RARITIES.filter(r => rarityCount(st, r) > 0).length;
export const sparkles = st => Object.values(owned(st)).filter(e => e && e.sparkle).length;
export const ALL_TYPES = [...new Set(CREATURES.flatMap(c => c.types))];
// types of the forms a student has right now (a creature with two types counts for both)
export const typesOwned = st => { const t = new Set(); Object.entries(owned(st)).forEach(([fam, e]) => { const c = formOf(fam, e.lvl || 1); if (c) c.types.forEach(x => t.add(x)); }); return t.size; };
export const evolved = st => Object.entries(owned(st)).filter(([fam, e]) => formIndex(fam, e.lvl || 1) > 0).length;
export const topLevel = st => Math.max(0, ...Object.values(owned(st)).map(e => Number(e && e.lvl) || 1));
export const xpSpent = st => Number(st.xpSpent) || 0;
// Arena stats come from the class's battles (finished battles stay in the battles list).
const sideOf = (st, b) => (b.a && b.a.id === st.id ? "A" : b.b && b.b.id === st.id ? "B" : null);
function finished(st, battles) {
  // a battle someone gave up on doesn't count for anyone's badges (so wins can't be traded)
  return (battles || []).filter(b => b && b.status === "done" && b.winner && !b.forfeit && sideOf(st, b))
    .sort((x, y) => String(x.created).localeCompare(String(y.created)));
}
const won = (st, b) => sideOf(st, b) === b.winner;
const teamLevel = t => (t || []).reduce((n, f) => n + (Number(f && f.lvl) || 1), 0);
export const battlesDone = (st, bt) => finished(st, bt).length;
export const wins = (st, bt) => finished(st, bt).filter(b => won(st, b)).length;
export const bestStreak = (st, bt) => { let best = 0, run = 0; finished(st, bt).forEach(b => { run = won(st, b) ? run + 1 : 0; best = Math.max(best, run); }); return best; };
// won with a smaller team, or a team whose levels add up to less
export const underdogWins = (st, bt) => finished(st, bt).filter(b => {
  if (!won(st, b) || !b.team) return false;
  const me = sideOf(st, b), mine = b.team[me] || [], theirs = b.team[me === "A" ? "B" : "A"] || [];
  return mine.length < theirs.length || teamLevel(mine) < teamLevel(theirs);
}).length;
export const crits = (st, bt) => (bt || []).filter(b => b && sideOf(st, b)).reduce((n, b) => n + (b.log || []).filter(e => e.k === "hit" && e.crit && e.s === sideOf(st, b)).length, 0);
// the last hit of a won battle was a weakness (double damage) hit
export const typeFinishes = (st, bt) => finished(st, bt).filter(b => {
  if (!won(st, b)) return false;
  const hits = (b.log || []).filter(e => e.k === "hit"), last = hits[hits.length - 1];
  return last && last.s === sideOf(st, b) && last.weak;
}).length;
/* Companion care: uses the saved XP history ({ date: { l: lunch, d: end of day } }), which is kept every week. */
function days(st) {
  const h = st.xpHist || {};
  return Object.keys(h).sort().map(date => { const x = h[date] || {}, d = x.d != null ? x.d : x.l;
    return { date, xp: Math.max(0, Number(d) || 0), lunch: x.l != null ? Math.max(0, Number(x.l) || 0) : null }; });
}
const goal = cls => goalXP(cls);
export const bestDay = st => Math.max(0, ...days(st).map(d => d.xp));
export const hitDays = (st, bt, cls) => days(st).filter(d => d.xp >= goal(cls)).length;
// best run of school days in a row at the goal (days with no upload are skipped)
export const bestRun = (st, bt, cls) => { let best = 0, run = 0; days(st).forEach(d => { run = d.xp >= goal(cls) ? run + 1 : 0; best = Math.max(best, run); }); return best; };
export const lunchHits = (st, bt, cls) => days(st).filter(d => d.lunch != null && d.lunch >= goal(cls)).length;
// Monday of a date's week, so days can be grouped Mon-Fri
function weekOf(date) { const t = new Date(date + "T12:00:00"); t.setDate(t.getDate() - ((t.getDay() + 6) % 7)); return t.toISOString().slice(0, 10); }
// a full-health week: all 5 school days (Mon-Fri) that week at the goal
const isWeekday = date => { const g = new Date(date + "T12:00:00").getDay(); return g >= 1 && g <= 5; };
function fullWeeks(st, cls) {
  const w = {}; days(st).filter(d => isWeekday(d.date)).forEach(d => { const k = weekOf(d.date); (w[k] = w[k] || []).push(d); });
  return Object.keys(w).sort().map(k => w[k].length >= 5 && w[k].every(d => d.xp >= goal(cls)));
}
export const fullWeekCount = (st, bt, cls) => fullWeeks(st, cls).filter(Boolean).length;
export const bestFullWeekRun = (st, bt, cls) => { let best = 0, run = 0; fullWeeks(st, cls).forEach(ok => { run = ok ? run + 1 : 0; best = Math.max(best, run); }); return best; };
// longest stretch of school days with no companion loss (losses are saved when you finalize a day)
export const bestSafeRun = st => { const lost = new Set((st.deaths || []).map(x => x.date)); let best = 0, run = 0; days(st).forEach(d => { run = lost.has(d.date) ? 0 : run + 1; best = Math.max(best, run); }); return best; };
export const capes = st => Math.max(Number(st.capesTotal) || 0, (st.items || []).filter(i => i.id === "cape").length);
/* Haunt-O-Ween */
// Gobble-Palooza uses the same save fields, so Haunt-O-Ween badges only count live candy while Haunt-O-Ween is on
// (or before Gobble-Palooza has ever run). Turning Gobble-Palooza on saves the candy totals as candyBest etc. first.
const hauntLive = cls => !!(cls && cls.haunt && !cls.gobble && !cls.jingle) || !(cls && (cls.gobbleSince || cls.jingleSince));
const hauntSpin = e => !e.s || e.s === "haunt";
export const attacks = st => Math.max(0, (Number(st.attackTotal) || 0) - (Number(st.turkeyAtk) || 0) - (Number(st.grinchAtk) || 0));   // Ghost-olotl attacks
export const helpedDefeat = (st, bt, cls) => (ghostUnlocked(cls) && attacks(st) > 0 ? 1 : 0);
export const candyEarned = (st, bt, cls) => Math.max(Number(st.candyBest) || 0, hauntLive(cls) ? candyOf(st) : 0);
export const candySpentBest = (st, bt, cls) => Math.max(Number(st.spentBest) || 0, hauntLive(cls) ? Number(st.candySpent) || 0 : 0);
export const prizeSpins = st => (st.spinLog || []).filter(e => e.id === "prize" && hauntSpin(e)).length;
export const steals = (st, bt, cls) => Math.max(Number(st.stolenBest) || 0, hauntLive(cls) ? Number(st.stolen) || 0 : 0, (st.spinLog || []).filter(e => e.id === "steal" && e.amt > 0 && hauntSpin(e)).length);
// event Legendaries caught (Duckarune, Hexaduck, and any future event creatures)
const EVENT_FAMS = [...new Set(CREATURES.filter(c => c.event).map(c => c.fam))];
/* Battles against Ms. Ariana (the teacher is player id "teacher") */
const vsTeacher = (st, bt) => finished(st, bt).filter(b => (b.a && b.a.id === "teacher") || (b.b && b.b.id === "teacher"));
const myTeam = (st, b) => (b.team && b.team[sideOf(st, b)]) || [];
const theirTeam = (st, b) => (b.team && b.team[sideOf(st, b) === "A" ? "B" : "A"]) || [];
const isLeg = f => String(f && f.fam).startsWith("L-");
export const teacherBattles = (st, bt) => vsTeacher(st, bt).length;
export const teacherWins = (st, bt) => vsTeacher(st, bt).filter(b => won(st, b)).length;
export const teacherStreak = (st, bt) => { let best = 0, run = 0; vsTeacher(st, bt).forEach(b => { run = won(st, b) ? run + 1 : 0; best = Math.max(best, run); }); return best; };
export const teacherCommonWins = (st, bt) => vsTeacher(st, bt).filter(b => won(st, b) && myTeam(st, b).length && myTeam(st, b).every(f => String(f.fam).startsWith("C-"))).length;
export const teacherLegendWins = (st, bt) => vsTeacher(st, bt).filter(b => won(st, b) && theirTeam(st, b).some(isLeg) && !myTeam(st, b).some(isLeg)).length;
export const teacherPerfect = (st, bt) => vsTeacher(st, bt).filter(b => won(st, b) && !(b.log || []).some(e => e.k === "faint" && e.s === sideOf(st, b))).length;
/* Gobble-Palooza */
export const turkeyHelped = (st, bt, cls) => (cls && cls.turkeyDefeated && (Number(st.turkeyAtk) || 0) > 0 ? 1 : 0);
/* Jingle Jam */
export const grinchHelped = (st, bt, cls) => (cls && cls.grinchDefeated && (Number(st.grinchAtk) || 0) > 0 ? 1 : 0);
export const eventsCaught = st => EVENT_FAMS.filter(f => owned(st)[f]).length;
const LORE = CREATURES.filter(c => !c.event).length, lore = pct => Math.ceil(LORE * pct / 100);

export const BADGE_GROUPS = [
  { key: "hatch", title: "\u{1F95A} Hatching" },
  { key: "collect", title: "\u{1F43E} Collector" },
  { key: "lore", title: "\u{1F4D6} Lorebook Scholar" },
  { key: "rare", title: "\u{1F48E} Rarity" },
  { key: "level", title: "\u{1F4C8} Leveling" },
  { key: "arena", title: "\u2694\uFE0F Arena" },
  { key: "care", title: "\u{1F43E} Companion Care" },
  { key: "haunt", title: "\u{1F383} Haunt-O-Ween" },
  { key: "teacher", title: "\u{1F34E} Battle Ms. Ariana" },
  { key: "gobble", title: "\u{1F983} Gobble-Palooza" },
  { key: "jingle", title: "\u{1F384} Jingle Jam" },
  { key: "doors", title: "\u{1F6AA} Daily Doors" },
  { key: "room", title: "\u{1F3E0} Home Sweet Keep" },
];

export const BADGES = [
  { id: "hatch-1",   group: "hatch", name: "First Hatch",   desc: "Hatch your first egg",  goal: 1,   img: "assets/badges/hatch-1.webp",   emoji: "\u{1F423}", check: hatches },
  { id: "hatch-10",  group: "hatch", name: "10 Hatched",    desc: "Hatch 10 eggs",         goal: 10,  img: "assets/badges/hatch-10.webp",  emoji: "\u{1F95A}", check: hatches },
  { id: "hatch-50",  group: "hatch", name: "50 Hatched",    desc: "Hatch 50 eggs",         goal: 50,  img: "assets/badges/hatch-50.webp",  emoji: "\u{1FAB9}", check: hatches },
  { id: "hatch-100", group: "hatch", name: "100 Hatched",   desc: "Hatch 100 eggs",        goal: 100, img: "assets/badges/hatch-100.webp", emoji: "\u{1F3C6}", check: hatches },
  { id: "collect-10", group: "collect", name: "Collector 10", desc: "Own 10 different creature families", goal: 10, img: "assets/badges/collect-10.webp", emoji: "\u{1F331}", check: families },
  { id: "collect-25", group: "collect", name: "Collector 25", desc: "Own 25 different creature families", goal: 25, img: "assets/badges/collect-25.webp", emoji: "\u{1F4A7}", check: families },
  { id: "collect-50", group: "collect", name: "Collector 50", desc: "Own 50 different creature families", goal: 50, img: "assets/badges/collect-50.webp", emoji: "\u{1F525}", check: families },
  { id: "full-line",   group: "collect", name: "Full Line",   desc: "Evolve a creature to its final form, collecting its whole line", goal: 1, img: "assets/badges/full-line.webp", emoji: "\u{1F332}", check: fullLines },
  { id: "starter-set", group: "collect", name: "Starter Set", desc: "Collect all 3 starter creatures", goal: 3, img: "assets/badges/starter-set.webp", emoji: "\u{1F46A}", check: starters },
  { id: "lore-25",  group: "lore", name: "Lorebook 25%",  desc: "Discover 25% of the lorebook",  goal: lore(25),  img: "assets/badges/lore-25.webp",  emoji: "\u{1F4D6}", check: discovered },
  { id: "lore-50",  group: "lore", name: "Lorebook 50%",  desc: "Discover 50% of the lorebook",  goal: lore(50),  img: "assets/badges/lore-50.webp",  emoji: "\u{1F4D6}", check: discovered },
  { id: "lore-75",  group: "lore", name: "Lorebook 75%",  desc: "Discover 75% of the lorebook",  goal: lore(75),  img: "assets/badges/lore-75.webp",  emoji: "\u{1F4D6}", check: discovered },
  { id: "lore-100", group: "lore", name: "Lorebook 100%", desc: "Discover every creature in the lorebook", goal: LORE, img: "assets/badges/lore-100.webp", emoji: "\u{1F4DA}", check: discovered },
  { id: "first-rare",       group: "rare", name: "First Rare",       desc: "Own your first Rare creature",       goal: 1, img: "assets/badges/first-rare.webp",       emoji: "\u{1F499}", check: st => rarityCount(st, "Rare") },
  { id: "first-super-rare", group: "rare", name: "First Super Rare", desc: "Own your first Super Rare creature", goal: 1, img: "assets/badges/first-super-rare.webp", emoji: "\u{1F49C}", check: st => rarityCount(st, "Super Rare") },
  { id: "legend-keeper",    group: "rare", name: "Legend Keeper",    desc: "Own a Legendary or get a legendary egg from your teacher", goal: 1, img: "assets/badges/legend-keeper.webp", emoji: "\u{1F451}", check: st => Math.max(rarityCount(st, "Legendary"), Number(st.legendaryPulls) || 0) },
  { id: "rarity-hunter",    group: "rare", name: "Rarity Hunter",    desc: "Own one creature of every rarity", goal: 5, img: "assets/badges/rarity-hunter.webp", emoji: "\u{1F308}", check: raritiesOwned },
  { id: "event-1", group: "rare", name: "Event Collector", desc: "Collect one limited event Legendary", goal: 1, img: "assets/badges/event-1.webp", emoji: "\u{1F986}", check: eventsCaught },
  { id: "event-7", group: "rare", name: "Legendary Event Collector", desc: "Collect 7 limited event Legendaries", goal: 7, img: "assets/badges/event-7.webp", emoji: "\u{1F451}", check: eventsCaught },
  { id: "sparkle-1",      group: "rare", name: "Sparkle Hunter", desc: "Hatch your first \u2728 Sparkle", goal: 1, img: "assets/badges/sparkle-1.webp", emoji: "\u2728", check: sparkles },
  { id: "sparkle-5",      group: "rare", name: "Sparkle Hunter 5", desc: "Collect 5 \u2728 Sparkles", goal: 5, img: "assets/badges/sparkle-5.webp", emoji: "\u{1F31F}", check: sparkles },
  { id: "type-collector", group: "collect", name: "Type Collector", desc: "Own a creature of every type (all " + ALL_TYPES.length + ")", goal: ALL_TYPES.length, img: "assets/badges/type-collector.webp", emoji: "\u{1F52E}", check: typesOwned },
  { id: "evolve-1",     group: "level", name: "First Evolution", desc: "Evolve a creature for the first time", goal: 1, img: "assets/badges/evolve-1.webp", emoji: "\u{1F331}", check: evolved },
  { id: "evolve-final", group: "level", name: "Final Evolution", desc: "Evolve a creature to its final form", goal: 1, img: "assets/badges/evolve-final.webp", emoji: "\u{1F333}", check: fullLines },
  { id: "level-25",  group: "level", name: "Power Up: Level 25",  desc: "Get a creature to level 25",  goal: 25,  img: "assets/badges/level-25.webp",  emoji: "\u2B06\uFE0F", check: topLevel },
  { id: "level-50",  group: "level", name: "Power Up: Level 50",  desc: "Get a creature to level 50",  goal: 50,  img: "assets/badges/level-50.webp",  emoji: "\u23EB", check: topLevel },
  { id: "level-100", group: "level", name: "Max Power: Level 100", desc: "Get a creature to level 100", goal: 100, img: "assets/badges/level-100.webp", emoji: "\u{1F4AF}", check: topLevel },
  { id: "xp-1000",  group: "level", name: "XP Spender 1,000",  desc: "Spend 1,000 banked XP on levels",  goal: 1000,  img: "assets/badges/xp-1000.webp",  emoji: "\u{1F4D8}", check: xpSpent },
  { id: "xp-5000",  group: "level", name: "XP Spender 5,000",  desc: "Spend 5,000 banked XP on levels",  goal: 5000,  img: "assets/badges/xp-5000.webp",  emoji: "\u{1F4D5}", check: xpSpent },
  { id: "xp-10000", group: "level", name: "XP Spender 10,000", desc: "Spend 10,000 banked XP on levels", goal: 10000, img: "assets/badges/xp-10000.webp", emoji: "\u{1F4D2}", check: xpSpent },
  { id: "battle-1",  group: "arena", name: "First Battle", desc: "Finish your first arena battle", goal: 1, img: "assets/badges/battle-1.webp", emoji: "\u2694\uFE0F", check: battlesDone },
  { id: "win-1",     group: "arena", name: "First Win",    desc: "Win your first arena battle",    goal: 1, img: "assets/badges/win-1.webp",    emoji: "\u{1F3C6}", check: wins },
  { id: "streak-3",  group: "arena", name: "Win Streak 3",  desc: "Win 3 battles in a row",  goal: 3,  img: "assets/badges/streak-3.webp",  emoji: "\u{1F525}", check: bestStreak },
  { id: "streak-5",  group: "arena", name: "Win Streak 5",  desc: "Win 5 battles in a row",  goal: 5,  img: "assets/badges/streak-5.webp",  emoji: "\u{1F525}", check: bestStreak },
  { id: "streak-10", group: "arena", name: "Win Streak 10", desc: "Win 10 battles in a row", goal: 10, img: "assets/badges/streak-10.webp", emoji: "\u{1F525}", check: bestStreak },
  { id: "champ-10", group: "arena", name: "Champion 10", desc: "Win 10 arena battles", goal: 10, img: "assets/badges/champ-10.webp", emoji: "\u{1F3C6}", check: wins },
  { id: "champ-25", group: "arena", name: "Champion 25", desc: "Win 25 arena battles", goal: 25, img: "assets/badges/champ-25.webp", emoji: "\u{1F3C6}", check: wins },
  { id: "champ-50", group: "arena", name: "Champion 50", desc: "Win 50 arena battles", goal: 50, img: "assets/badges/champ-50.webp", emoji: "\u{1F3C6}", check: wins },
  { id: "underdog", group: "arena", name: "Underdog", desc: "Win with a lower-level or smaller team", goal: 1, img: "assets/badges/underdog.webp", emoji: "\u{1F436}", check: underdogWins },
  { id: "crit-1", group: "arena", name: "Critical Hit", desc: "Land your first critical hit", goal: 1, img: "assets/badges/crit-1.webp", emoji: "\u{1F4A5}", check: crits },
  { id: "crit-5", group: "arena", name: "Crit Master", desc: "Land 5 critical hits", goal: 5, img: "assets/badges/crit-5.webp", emoji: "\u{1F3AF}", check: crits },
  { id: "type-expert", group: "arena", name: "Type Expert", desc: "Win with a weakness (double damage) finishing hit", goal: 1, img: "assets/badges/type-expert.webp", emoji: "\u{1F9E0}", check: typeFinishes },
  { id: "feast",   group: "care", name: "First Feast", desc: "Hit 120 XP for the first time", goal: 1, img: "assets/badges/feast.webp", emoji: "\u{1F356}", check: hitDays },
  { id: "roll-5",  group: "care", name: "On a Roll 5",  desc: "Hit 120 XP 5 school days in a row",  goal: 5,  img: "assets/badges/roll-5.webp",  emoji: "\u{1F4C5}", check: bestRun },
  { id: "roll-10", group: "care", name: "On a Roll 10", desc: "Hit 120 XP 10 school days in a row", goal: 10, img: "assets/badges/roll-10.webp", emoji: "\u{1F4C5}", check: bestRun },
  { id: "roll-20", group: "care", name: "On a Roll 20", desc: "Hit 120 XP 20 school days in a row", goal: 20, img: "assets/badges/roll-20.webp", emoji: "\u{1F4C5}", check: bestRun },
  { id: "crowned", group: "care", name: "Crowned", desc: "Reach a 5-day streak and unlock the Crown", goal: 5, img: "assets/badges/crowned.webp", emoji: "\u{1F451}", check: bestRun },
  { id: "egg-240", group: "care", name: "Double Egg Day 240", desc: "Earn 240 XP in one day", goal: 240, img: "assets/badges/egg-240.webp", emoji: "\u{1F95A}", check: bestDay },
  { id: "egg-480", group: "care", name: "Double Egg Day 480", desc: "Earn 480 XP in one day", goal: 480, img: "assets/badges/egg-480.webp", emoji: "\u{1F95A}", check: bestDay },
  { id: "lunch-1",  group: "care", name: "Lunch Hero",    desc: "Hit 120 XP before lunch",          goal: 1,  img: "assets/badges/lunch-1.webp",  emoji: "\u2600\uFE0F", check: lunchHits },
  { id: "lunch-10", group: "care", name: "Lunch Hero 10", desc: "Hit 120 XP before lunch 10 times", goal: 10, img: "assets/badges/lunch-10.webp", emoji: "\u2600\uFE0F", check: lunchHits },
  { id: "health-week",  group: "care", name: "Full-Health Week",  desc: "Hit the goal all 5 school days in one week (Mon\u2013Fri)", goal: 1, img: "assets/badges/health-week.webp",  emoji: "\u2764\uFE0F", check: fullWeekCount },
  { id: "health-month", group: "care", name: "Full-Health Month", desc: "Keep full health for 4 school weeks in a row", goal: 4, img: "assets/badges/health-month.webp", emoji: "\u{1F496}", check: bestFullWeekRun },
  { id: "never-lost", group: "care", name: "Never Lost", desc: "30 school days in a row without your companion disappearing", goal: 30, img: "assets/badges/never-lost.webp", emoji: "\u{1F6E1}\uFE0F", check: bestSafeRun },
  { id: "ghost-1",  group: "haunt", name: "Ghost Buster",    desc: "Help defeat the Ghost-olotl", goal: 1, img: "assets/badges/ghost-1.webp", emoji: "\u{1F47B}", check: helpedDefeat },
  { id: "ghost-10", group: "haunt", name: "Ghost Buster 10", desc: "Attack the Ghost-olotl 10 times", goal: 10, img: "assets/badges/ghost-10.webp", emoji: "\u{1F47B}", check: attacks },
  { id: "sweet-tooth", group: "haunt", name: "Sweet Tooth", desc: "Earn 1,000 candy", goal: 1000, img: "assets/badges/sweet-tooth.webp", emoji: "\u{1F36C}", check: candyEarned },
  { id: "big-spender", group: "haunt", name: "Big Spender", desc: "Spend 500 candy at the shop", goal: 500, img: "assets/badges/big-spender.webp", emoji: "\u{1F6CD}\uFE0F", check: candySpentBest },
  { id: "witchy",      group: "haunt", name: "Witchy",      desc: "Buy the Witch\u2019s Hat", goal: 1, img: "assets/badges/witchy.webp", emoji: "\u{1F9D9}", check: st => (st.witchHat ? 1 : 0) },
  { id: "lucky-spin",  group: "haunt", name: "Lucky Spin",  desc: "Land a Prize! on the wheel", goal: 1, img: "assets/badges/lucky-spin.webp", emoji: "\u{1F381}", check: prizeSpins },
  { id: "t-challenge",     group: "teacher", name: "Challenge Accepted", desc: "Battle Ms. Ariana for the first time", goal: 1, img: "assets/badges/t-challenge.webp", emoji: "\u2694\uFE0F", check: teacherBattles },
  { id: "t-tamer",         group: "teacher", name: "Teacher Tamer", desc: "Beat Ms. Ariana once", goal: 1, img: "assets/badges/t-tamer.webp", emoji: "\u{1F34E}", check: teacherWins },
  { id: "t-top",           group: "teacher", name: "Top of the Class", desc: "Beat Ms. Ariana 5 times", goal: 5, img: "assets/badges/t-top.webp", emoji: "\u{1F4DA}", check: teacherWins },
  { id: "t-valedictorian", group: "teacher", name: "Valedictorian", desc: "Beat Ms. Ariana 3 times in a row", goal: 3, img: "assets/badges/t-valedictorian.webp", emoji: "\u{1F393}", check: teacherStreak },
  { id: "t-popquiz",       group: "teacher", name: "Pop Quiz", desc: "Beat Ms. Ariana using only Common creatures", goal: 1, img: "assets/badges/t-popquiz.webp", emoji: "\u270F\uFE0F", check: teacherCommonWins },
  { id: "t-legendary",     group: "teacher", name: "Legendary Lesson", desc: "Beat Ms. Ariana when her team has a Legendary and yours doesn\u2019t", goal: 1, img: "assets/badges/t-legendary.webp", emoji: "\u{1F451}", check: teacherLegendWins },
  { id: "t-perfect",       group: "teacher", name: "Perfect Score", desc: "Beat Ms. Ariana without any of your creatures fainting", goal: 1, img: "assets/badges/t-perfect.webp", emoji: "\u{1F4AF}", check: teacherPerfect },
  { id: "turkey-takedown", group: "gobble", name: "Turkey Takedown", desc: "Help defeat the Turducken", goal: 1, img: "assets/badges/turkey-takedown.webp", emoji: "\u{1F983}", check: turkeyHelped },
  { id: "ev-thanks",       group: "gobble", name: "Thanksolotl", desc: "Catch the limited Thanksolotl during Gobble-Palooza", goal: 1, img: "assets/badges/ev-thanks.webp", emoji: "\u{1F342}", check: st => (owned(st)["L-29"] ? 1 : 0) },
  { id: "present-rescuer", group: "jingle", name: "Present Rescuer", desc: "Help defeat the Grinch-a-Duck", goal: 1, img: "assets/badges/present-rescuer.webp", emoji: "\u{1F381}", check: grinchHelped },
  { id: "ev-jingle",       group: "jingle", name: "Jinglotl", desc: "Catch the limited Jinglotl during Jingle Jam", goal: 1, img: "assets/badges/ev-jingle.webp", emoji: "\u2744\uFE0F", check: st => (owned(st)["L-30"] ? 1 : 0) },
  // Daily Doors (Haunted Doors / Harvest Doors / Advent Calendar).
  { id: "door-1",    group: "doors", name: "Knock Knock",    desc: "Open your first Daily Doors present", goal: 1,   img: "assets/badges/door-1.webp", emoji: "\u{1F6AA}", check: st => presentsOpened(st).doors },
  { id: "door-25",   group: "doors", name: "Door Dasher",    desc: "Open 25 Daily Doors presents",        goal: 25,  img: "assets/badges/door-25.webp", emoji: "\u{1F381}", check: st => presentsOpened(st).doors },
  { id: "door-100",  group: "doors", name: "Door Master",    desc: "Open 100 Daily Doors presents",       goal: 100, img: "assets/badges/door-100.webp", emoji: "\u{1F511}", check: st => presentsOpened(st).doors },
  { id: "golden-1",  group: "doors", name: "Golden Glow",    desc: "Open a Golden Present (finish every door in one day)", goal: 1, img: "assets/badges/golden-1.webp", emoji: "\u2728", check: st => presentsOpened(st).golden },
  { id: "golden-5",  group: "doors", name: "Golden Streak",  desc: "Open 5 Golden Presents",              goal: 5,   img: "assets/badges/golden-5.webp", emoji: "\u{1F31F}", check: st => presentsOpened(st).golden },
  // Home Sweet Keep (the companion room). Art goes in assets/badges/<id>.webp; until then the emoji shows.
  { id: "room-first",    group: "room", name: "First Decoration", desc: "Buy your first room item", goal: 1, img: null, emoji: "\u{1F6CB}\uFE0F", check: st => ((st.roomBuys || []).length ? 1 : 0) },
  { id: "room-full",     group: "room", name: "Full Room", desc: "Fill every spot in your room at once", goal: 1, img: null, emoji: "\u{1F3E0}", check: st => (FIT_SLOTS.every(sl => roomFit(st)[sl]) ? 1 : 0) },
  { id: "room-seasonal", group: "room", name: "Seasonal Collector", desc: "Own a whole Haunt-O-Ween, Gobble-Palooza or Jingle Jam room set", goal: 1, img: null, emoji: "\u{1F383}", check: st => (["haunt", "gobble", "jingle"].some(t => roomSet(t).every(id => roomOwned(st).includes(id))) ? 1 : 0) },
  { id: "room-trophies", group: "room", name: "Trophy Case", desc: "Own all 3 boss trophies", goal: 3, img: null, emoji: "\u{1F3C6}", check: st => ["haunt", "gobble", "jingle"].filter(t => roomOwned(st).includes("trophy_" + t)).length },
  { id: "candy-thief", group: "haunt", name: "Candy Thief", desc: "Steal candy from Ms. Ariana", goal: 1, img: "assets/badges/candy-thief.webp", emoji: "\u{1F9B9}", check: steals },
];

/* Earned badges are locked in forever: once earned, the id is saved in st.badges = { id: ISO date }
   and never removed, even if the numbers behind it go back down.
   st.badgesSeen = { id: true } marks the ones the student has already celebrated. */
const byIdB = {}; BADGES.forEach(b => { byIdB[b.id] = b; });
export const badgeById = id => byIdB[id] || null;
export const locked = st => st.badges || {};
export function badgeState(st, battles, cls) {
  const lk = locked(st);
  return BADGES.map(b => {
    const n = Math.max(0, Number(b.check(st, battles, cls)) || 0), have = !!lk[b.id] || n >= b.goal;
    return Object.assign({}, b, { n: have ? b.goal : Math.min(n, b.goal), have, at: lk[b.id] || null });
  });
}
export const badgeCount = (st, battles, cls) => badgeState(st, battles, cls).filter(b => b.have).length;
// badges the numbers say are earned but that aren't saved yet
export function newlyEarned(st, battles, cls) {
  const lk = locked(st);
  return BADGES.filter(b => !lk[b.id] && (Number(b.check(st, battles, cls)) || 0) >= b.goal).map(b => b.id);
}
// saved badges the student hasn't seen the celebration for
export function unseenBadges(st) { const seen = st.badgesSeen || {}; return Object.keys(locked(st)).filter(id => !seen[id] && byIdB[id]); }
export function badgeArt(b, cls) { return b.img ? '<img class="' + (cls || "") + '" src="' + b.img + '" alt="">' : '<span class="bdg-emoji">' + b.emoji + "</span>"; }

export function badgesTab(st, battles, cls) {
  const list = badgeState(st, battles, cls), got = list.filter(b => b.have).length, pin = st.pinnedBadge, soon = Date.now() - 3 * 864e5;
  const fresh = new Set(Object.keys(locked(st)).filter(id => Date.parse(locked(st)[id]) > soon));   // NEW ribbon for 3 days
  let h = '<div class="card"><div class="bdg-head"><h2>\u{1F3C5} My Badges</h2><div class="bdg-count"><b>' + got + "</b> of " + list.length + " earned</div></div>" +
    '<p class="lede small">\u{1F4CC} Pin one earned badge and it shows in the corner of your companion on The Keep.</p>';
  BADGE_GROUPS.forEach(g => {
    const items = list.filter(b => b.group === g.key); if (!items.length) return;
    h += '<h3 class="bdg-group">' + g.title + '</h3><div class="bdg-grid">';
    items.forEach(b => {
      if (b.have) {
        const on = pin === b.id && !!locked(st)[b.id], canPin = !!locked(st)[b.id];
        h += '<div class="bdg got' + (on ? " pinned" : "") + '" title="' + esc(b.desc) + '">' + (fresh.has(b.id) ? '<span class="bdg-new">NEW</span>' : "") +
          '<div class="bdg-art">' + badgeArt(b) + "</div>" +
          '<div class="bdg-name">' + esc(b.name) + '</div><div class="bdg-desc">' + esc(b.desc) + "</div>" +
          (canPin ? '<button class="btn small bdg-pin' + (on ? " on" : "") + '" data-pinbadge="' + (on ? "" : b.id) + '">' + (on ? "\u{1F4CC} Pinned \u2014 unpin" : "\u{1F4CC} Pin to companion") + "</button>" : '<div class="bdg-done">Earned!</div>') +
          "</div>";
      } else {
        // not earned yet: an empty space with a hint, so the badge stays a surprise
        h += '<div class="bdg empty"><div class="bdg-art"><span class="bdg-slot">?</span></div>' +
          '<div class="bdg-name">???</div><div class="bdg-hint"><b>Hint:</b> ' + esc(b.desc) + "</div>" +
          '<div class="bdg-bar"><i style="width:' + Math.round(100 * b.n / b.goal) + '%"></i></div><div class="bdg-prog">' + b.n.toLocaleString() + " / " + b.goal.toLocaleString() + "</div></div>";
      }
    });
    h += "</div>";
  });
  return h + "</div>";
}

// Celebration pop-up for badges earned since the student last looked (shows the next time they open their page).
export function badgeParty(st) {
  const ids = unseenBadges(st); if (!ids.length) return "";
  const list = ids.map(badgeById);
  const one = list.length === 1;
  return '<div class="bparty" role="dialog" aria-label="New badge"><div class="bparty-box">' +
    '<div class="bparty-rays" aria-hidden="true"></div>' +
    "<h2>" + (one ? "\u{1F389} NEW BADGE! \u{1F389}" : "\u{1F389} " + list.length + " NEW BADGES! \u{1F389}") + "</h2>" +
    (one ? '<div class="bparty-one">' + badgeArt(list[0]) + '<div class="bdg-name">' + esc(list[0].name) + '</div><div class="bdg-desc">' + esc(list[0].desc) + "</div></div>"
      : '<div class="bparty-grid">' + list.map(b => '<div>' + badgeArt(b) + '<div class="bdg-name">' + esc(b.name) + "</div></div>").join("") + "</div>") +
    '<div class="row" style="justify-content:center;gap:10px;margin-top:14px;">' +
    (one ? '<button class="btn" data-bparty="pin:' + list[0].id + '">\u{1F4CC} Pin it</button>' : "") +
    '<button class="btn primary" data-bparty="ok">' + (one ? "Awesome!" : "See my badges") + "</button></div></div></div>";
}
