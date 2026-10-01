/* ---------- Daily Doors (Haunted Doors / Harvest Doors / Advent Calendar) ----------
   A side quest during an event. Every day the same list of doors (tasks) shows up; the teacher can change
   the list, or set a different list for one day. A student taps "I did it!" -> the teacher approves ->
   a present appears on the student's screen and they open it for a reward.
   - The first DOOR_GATE doors have to be approved before the rest unlock.
   - Only today's doors can be started. Doors reset every day (approved presents can still be opened later).
   - All of today's doors approved = a bonus Golden Present.
   Saved on the student: doors = { "YYYY-MM-DD": { "0": { st: "wait"|"ok"|"no"|"open", at, r }, g: { st: "open", r } } }
   plus lastDoor = "YYYY-MM-DD/<door>" (which door the last save touched; the save rules check it).
   Class: doorsOn (on/off), doorList (default list), doorDays = { "YYYY-MM-DD": [..] } (one-day lists). */
import { azToday } from "./collect.js?v=20261001b";
import { SEASON, eventMode, esc } from "./game.js?v=20261001b";

// A door that starts with "!" is always open (not locked behind the first doors). The "!" isn't shown.
export const DOOR_DEFAULT = [
  "!Earn 25 XP Before School Starts",
  "Get 25 Math XP",
  "Get 25 Reading XP",
  "Get 25 Language XP",
  "Close your Fast Math Ring",
  "Close your Vocab Ring",
  "Close your Science or Writing Ring",
  "Earn 240 XP today",
  "Close all Rings",
  "Earn 25 extra XP in Math, Language or Reading (close ALL 3 first)"
];
export const DOOR_GATE = 3;   // the first 3 doors that aren't always-open ones unlock the rest
export const isFree = task => String(task || "").trim().startsWith("!");
export const doorText = task => String(task || "").trim().replace(/^!\s*/, "");
export const DOOR_NAMES = { haunt: "Haunted Doors", gobble: "Harvest Doors", jingle: "Advent Calendar" };
export const DOOR_ICON = { haunt: "\u{1F6AA}", gobble: "\u{1F6AA}", jingle: "\u{1F4C5}" };
export const DOOR_ART = { haunt: "assets/doors/door-haunt.webp", gobble: "assets/doors/door-gobble.webp", jingle: "assets/doors/door-jingle.webp" };
export const doorName = () => DOOR_NAMES[SEASON.key] || "Daily Doors";

export function doorsLive(cls) { return !!(cls && cls.doorsOn) && eventMode(cls); }
export function doorsFor(cls, date) {
  const d = cls && cls.doorDays && cls.doorDays[date];
  if (Array.isArray(d) && d.length) return d;
  return Array.isArray(cls && cls.doorList) && cls.doorList.length ? cls.doorList : DOOR_DEFAULT;
}
export function dayDoors(st, date) { return ((st && st.doors) || {})[date] || {}; }
export const doorState = (st, date, i) => (dayDoors(st, date)[String(i)] || {}).st || "";
export const approved = v => v === "ok" || v === "open";
// Which doors are the "unlock the rest" doors (their indexes), e.g. [1, 2, 3] when door 1 is always open.
export function gateDoors(cls, date) {
  const out = [];
  doorsFor(cls, date).forEach((t, i) => { if (!isFree(t) && out.length < DOOR_GATE) out.push(i); });
  return out;
}
export function gateOpen(st, cls, date) { return gateDoors(cls, date).every(i => approved(doorState(st, date, i))); }
export function doorLocked(st, cls, date, i) {
  const list = doorsFor(cls, date);
  return !isFree(list[i]) && !gateDoors(cls, date).includes(i) && !gateOpen(st, cls, date);
}
// "doors 2–4" style label for the unlock doors
export function gateLabel(cls, date) {
  const g = gateDoors(cls, date).map(i => i + 1);
  if (!g.length) return "";
  const run = g.every((n, k) => k === 0 || n === g[k - 1] + 1);
  return g.length === 1 ? "door " + g[0] : run ? "doors " + g[0] + "\u2013" + g[g.length - 1] : "doors " + g.join(", ");
}
export const hasLocked = (cls, date) => doorsFor(cls, date).some((t, i) => !isFree(t) && !gateDoors(cls, date).includes(i));
export function allDone(st, cls, date) { return doorsFor(cls, date).every((_, i) => approved(doorState(st, date, i))); }
export function goldenReady(st, cls, date) { return allDone(st, cls, date) && !dayDoors(st, date).g; }

/* ---------- rewards ---------- */
// A regular present gives one of these. cur = the event's currency (candy / corn / presents).
export const PRESENT_ODDS = [
  { id: "xp25",   p: 0.32, xp: 25 },
  { id: "xp50",   p: 0.23, xp: 50 },
  { id: "cur20",  p: 0.20 },
  { id: "brew",   p: 0.12 },
  { id: "attack", p: 0.06 },
  { id: "egg",    p: 0.04 },
  { id: "prize",  p: 0.03 }
];
// A Golden Present gives one of three (1 in 3 each). The egg is an event egg 1 time in 5, otherwise a regular egg.
export const GOLDEN_ODDS = [
  { id: "xp500", p: 1 / 3, xp: 500 },
  { id: "gegg",  p: 1 / 3 },
  { id: "prize", p: 1 / 3 }
];
export const THEME_EGG_CHANCE = 0.2;
function roll(list) { let r = Math.random(); for (const x of list) { if (r < x.p) return x; r -= x.p; } return list[list.length - 1]; }
export function rollPresent(golden) {
  const x = roll(golden ? GOLDEN_ODDS : PRESENT_ODDS);
  if (x.id === "gegg") return { id: Math.random() < THEME_EGG_CHANCE ? "tegg" : "egg" };
  return { id: x.id };
}
export const REWARD_XP = { xp25: 25, xp50: 50, xp500: 500 };
export function rewardText(r, S) {
  S = S || SEASON;
  switch (r && r.id) {
    case "xp25": case "xp50": case "xp500": return { icon: "⭐", big: "+" + REWARD_XP[r.id] + " XP", sub: "It’s in your XP — use it to level up your creatures!" };
    case "cur20": return { icon: S.coin, big: "+20 " + S.Cur, sub: "Added to your " + S.basket + "." };
    case "brew": return { icon: S.brewIcon, big: S.brewName, sub: "Your next attack does +10 damage." };
    case "attack": return { icon: "⚔️", big: "Extra attack", sub: "One more attack on the " + S.boss + "!" };
    case "egg": return { icon: "\u{1F95A}", big: "A creature egg!", sub: "Hatch it in the Creature Collector." };
    case "tegg": return { icon: "✨", big: "An event egg!", sub: "Hatch it in the Creature Collector — it’s a special " + S.name + " creature!" };
    case "prize": return { icon: "\u{1F3C6}", big: "A Prize Wheel spin!", sub: "Spinning the Prize Wheel…" };
    default: return { icon: "\u{1F381}", big: "A present", sub: "" };
  }
}
// Every present a student has opened (for badges).
export function presentsOpened(st) {
  let n = 0, g = 0;
  Object.values((st && st.doors) || {}).forEach(day => Object.keys(day || {}).forEach(k => { if ((day[k] || {}).st === "open") { if (k === "g") g++; else n++; } }));
  return { doors: n, golden: g };
}
// Doors waiting for the teacher to check (any day).
export function waitingDoors(students, cls) {
  const out = [];
  students.forEach(s => Object.keys((s && s.doors) || {}).forEach(date => {
    const day = s.doors[date] || {};
    Object.keys(day).forEach(k => { if (k !== "g" && (day[k] || {}).st === "wait") out.push({ s, date, i: Number(k), task: doorText(doorsFor(cls, date)[Number(k)] || "Door " + (Number(k) + 1)), at: day[k].at }); });
  }));
  return out.sort((a, b) => String(a.at).localeCompare(String(b.at)));
}
// XP from presents (shown in the teacher's prize list).
export function doorXPRows(students) {
  const out = [];
  students.forEach(s => Object.keys((s && s.doors) || {}).forEach(date => {
    const day = s.doors[date] || {};
    Object.keys(day).forEach(k => { const e = day[k] || {}; if (e.st === "open" && e.r && REWARD_XP[e.r.id]) out.push({ s, date, k, e }); });
  }));
  return out;
}
export const doorToday = date => date || azToday();
export { esc };
