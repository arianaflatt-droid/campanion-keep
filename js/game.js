import { formOf, sparkleImg, azNow } from "./collect.js?v=20261002b";
// Shared rules + drawing for the teacher console and the student page.
// The code version. Bump it with every update (it matches the ?v= tags). The teacher console saves it on the class;
// any page still running older code (a tab left open all day) reloads itself so everyone plays with the same rules.
export const APP_V = "20261002b";
export function checkVersion(cls, isTeacher, save) {
  const live = (cls && cls.appVersion) || "";
  if (isTeacher && APP_V > live && save) save(APP_V);
  if (live > APP_V) {
    let tried = ""; try { tried = sessionStorage.getItem("ck-reload") || ""; } catch (e) {}
    if (tried !== live) { try { sessionStorage.setItem("ck-reload", live); } catch (e) {} location.reload(); return true; }
  }
  return false;
}

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
export const SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri"];
export const MAX_HP = 120, HALF_HP = 60;
export const BANNER_TEXT = 'Keep Your Companion at Full Health Today and Earn <b>500 XP</b>!' +
  '<span class="rings">\u2B55 Close All Your Rings to Get a <b>Legendary Egg</b>! \u{1F95A}</span>';
export const BANNER = '<div class="hero"><h2>' + BANNER_TEXT + "</h2></div>";
export const HAUNT_BANNER = '<div class="hero haunt"><p class="haunt-tag">\u{1F383} Haunt-O-Ween Mode \u{1F47B}</p><h2>' + BANNER_TEXT +
  '</h2><p class="haunt-sub">Every XP is a piece of candy! Your companion eats the first 120 each day to power its attack \u2014 the rest fills your pumpkin basket.</p></div>';
export const GOBBLE_BANNER = '<div class="hero haunt gobble"><p class="haunt-tag">\u{1F983} Gobble-Palooza \u{1F33D}</p><h2>' + BANNER_TEXT +
  '</h2><p class="haunt-sub">Every XP is a piece of corn! Your companion eats the first 120 each day to power its attack \u2014 the rest fills your cornucopia.</p></div>';
export const JINGLE_BANNER = '<div class="hero haunt jingle"><p class="haunt-tag">\u{1F384} Jingle Jam \u{1F381}</p><h2>' + BANNER_TEXT +
  '</h2><p class="haunt-sub">Every XP is a present! Your companion eats the first 120 each day to power its attack \u2014 the rest piles up under your tree.</p></div>';
export function bannerFor(cls) { return isJingle(cls) ? JINGLE_BANNER : isGobble(cls) ? GOBBLE_BANNER : isHaunt(cls) ? HAUNT_BANNER : BANNER; }

/* ---------- Haunt-O-Ween Mode ----------
   All normal rules still apply. On top of that, every XP a student earns this week is one piece of candy.
   The basket looks full at CANDY_FULL candy. */
export const CANDY_FULL = 120;
export function isHaunt(cls) { return !!(cls && cls.haunt) && !(cls && cls.gobble) && !(cls && cls.jingle); }
/* ---------- Gobble-Palooza ----------
   Works exactly like Haunt-O-Ween, with corn instead of candy, the Turducken instead of the Ghost-olotl,
   the Pie Wheel and the Gobble-Palooza shop. It uses the same save fields (candyBank, candySpent, spins, ...),
   so only one of the two modes is ever on. Turning it on starts everyone's corn at 0.
   It turns itself on Nov 1 and off after Nov 30 (when the teacher console is opened). */
export const GOBBLE_FROM = "2026-11-01", GOBBLE_TO = "2026-11-30";
export function isGobble(cls) { return !!(cls && cls.gobble) && !(cls && cls.jingle); }
/* ---------- Jingle Jam ----------
   The same again for December: presents under a mini tree, the Grinch-a-Duck, the Present Wheel and the Jingle Shop.
   It turns itself on Dec 1 and off after Dec 31 (when the teacher console is opened). */
export const JINGLE_FROM = "2026-12-01", JINGLE_TO = "2026-12-31";
export function isJingle(cls) { return !!(cls && cls.jingle); }
// A candy-style event (Haunt-O-Ween, Gobble-Palooza or Jingle Jam) is on: baskets, shop, wheel, bucket and the Battle Area.
export function eventMode(cls) { return isHaunt(cls) || isGobble(cls) || isJingle(cls); }
export function battleOn(cls) { return eventMode(cls); }
// Candy keeps stacking week after week (candyBank) until the teacher turns Haunt-O-Ween Mode off.
export function candyOf(st) {
  return (Number(st.candyBank) || 0) + weekCandy(st) + (Number(st.candyBonus) || 0) + (Number(st.stolen) || 0);
}
// Each day the companion eats the first EAT_PER_DAY candy to power up its attack. Only the extra reaches the basket.
export const EAT_PER_DAY = 120;
export function dayXP(st, d) {
  const xp = arr5(st.xp, null), lunch = arr5(st.lunchXp, null);
  return Number(xp[d] != null ? xp[d] : lunch[d] != null ? lunch[d] : 0) || 0;
}
export function dayCandy(st, d) { return Math.max(0, Math.round(dayXP(st, d) - EAT_PER_DAY)); }
export function dayEaten(st, d) { return Math.min(EAT_PER_DAY, Math.max(0, Math.round(dayXP(st, d)))); }
export function weekCandy(st) {
  let n = 0;
  for (let d = 0; d < 5; d++) n += dayCandy(st, d);
  return n;
}
// Candy slots inside the basket opening (% of the basket picture), filled bottom row first.
const CANDY_SLOTS = [
  [22, 41], [36, 42], [50, 42], [64, 42], [78, 41],
  [27, 35], [40, 35], [53, 35], [66, 35], [76, 34],
  [33, 28], [46, 28], [59, 28], [70, 29],
  [43, 21], [57, 21]
];
const CANDY_KINDS = ["\u{1F36C}", "\u{1F36D}", "\u{1F36B}", "\u{1F36C}", "\u{1F36D}"];
// Corn slots in the cornucopia's opening (% of the picture), filled from the bottom of the mouth outward.
const CORN_SLOTS = [
  [62, 74], [74, 76], [85, 70], [56, 64], [68, 64], [80, 60], [90, 56], [60, 52],
  [72, 50], [84, 46], [66, 40], [78, 36], [52, 78], [92, 80], [45, 70], [88, 88]
];
export function basketHTML(candy, cls) {
  if (SEASON.key === "gobble") return cornucopiaHTML(candy, cls);
  if (SEASON.key === "jingle") return treeHTML(candy, cls);
  const f = Math.min(1, candy / CANDY_FULL);
  const shown = candy > 0 ? Math.max(1, Math.round(f * CANDY_SLOTS.length)) : 0;
  let c = "";
  for (let i = 0; i < shown; i++) {
    const [x, y] = CANDY_SLOTS[i];
    c += '<span class="candy" style="left:' + x + "%;top:" + y + "%;transform:translate(-50%,-50%) rotate(" + ((i * 37) % 50 - 25) + 'deg);">' + CANDY_KINDS[i % CANDY_KINDS.length] + "</span>";
  }
  return '<div class="basket' + (cls ? " " + cls : "") + (f >= 1 ? " full" : "") + '" title="' + candy.toLocaleString() + ' pieces of candy">' +
    '<span class="candycount">\u{1F36C} ' + candy.toLocaleString() + "</span>" +
    '<span class="bk"><img src="assets/pumpkin-back.png" alt="">' + c + '<img src="assets/pumpkin-front.png" alt=""></span></div>';
}

// Present spots around the mini tree (% of the tree picture), filled from the pot outward and upward.
const PRESENT_SLOTS = [
  [22, 92], [78, 92], [10, 90], [90, 90], [30, 84], [70, 84], [16, 80], [84, 80],
  [26, 72], [74, 72], [12, 70], [88, 70], [34, 62], [66, 62], [22, 58], [78, 58]
];
const PRESENT_KINDS = ["\u{1F381}", "\u{1F381}", "\u{1F36C}", "\u{1F381}", "\u2B50"];
export function treeHTML(n, cls) {
  const f = Math.min(1, n / CANDY_FULL);
  const shown = n > 0 ? Math.max(1, Math.round(f * PRESENT_SLOTS.length)) : 0;
  let c = "";
  for (let i = 0; i < shown; i++) {
    const [x, y] = PRESENT_SLOTS[i];
    c += '<span class="candy" style="left:' + x + "%;top:" + y + "%;transform:translate(-50%,-50%) rotate(" + ((i * 29) % 30 - 15) + 'deg);">' + PRESENT_KINDS[i % PRESENT_KINDS.length] + "</span>";
  }
  return '<div class="basket tree' + (cls ? " " + cls : "") + (f >= 1 ? " full" : "") + '" title="' + n.toLocaleString() + ' presents">' +
    '<span class="candycount">\u{1F381} ' + n.toLocaleString() + "</span>" +
    '<span class="bk"><img src="assets/jingle/mini-tree.webp" alt="">' + c + "</span></div>";
}

export function cornucopiaHTML(corn, cls) {
  const f = Math.min(1, corn / CANDY_FULL);
  const shown = corn > 0 ? Math.max(1, Math.round(f * CORN_SLOTS.length)) : 0;
  let c = "";
  for (let i = 0; i < shown; i++) {
    const [x, y] = CORN_SLOTS[i];
    c += '<span class="candy" style="left:' + x + "%;top:" + y + "%;transform:translate(-50%,-50%) rotate(" + ((i * 53) % 80 - 40) + 'deg);">' + ["\u{1F33D}", "\u{1F33D}", "\u{1F34E}", "\u{1F33D}", "\u{1F342}"][i % 5] + "</span>";
  }
  return '<div class="basket corn' + (cls ? " " + cls : "") + (f >= 1 ? " full" : "") + '" title="' + corn.toLocaleString() + ' pieces of corn">' +
    '<span class="candycount">\u{1F33D} ' + corn.toLocaleString() + "</span>" +
    '<span class="bk"><img src="assets/gobble/cornucopia.webp" alt="">' + c + "</span></div>";
}

// fit: where gear sits on each companion, in em of the companion's size (Chromebook/Google emoji).
//   hat  = [x, y, size, tilt]  bottom-centre of a hat/cap/crown sits on this point
//   eyes = [x, y, size, tilt]  centre of the sunglasses
//   snack = [x, y]             snack pack beside the pet
export const ROSTER = [
  { id: "otter",   name: "River Otter",      glyph: "\u{1F9A6}", fit: { hat: [0.3, 0.3, 0.3, -20], cap: [0.3, 0.33, 0.32, -20], eyes: [0.36, 0.37, 0.32, -25], snack: [1.08, 0.82] } },
  { id: "raccoon", name: "Raccoon",          glyph: "\u{1F99D}", fit: { hat: [0.8, 0.2, 0.38, 8], cap: [0.8, 0.24, 0.4, 8], eyes: [0.85, 0.35, 0.32, -8], snack: [1.14, 0.88] } },
  { id: "fox",     name: "Red Fox",          glyph: "\u{1F98A}", fit: { hat: [0.84, 0.21, 0.36, 8], cap: [0.84, 0.25, 0.38, 8], eyes: [0.853, 0.393, 0.36, -23], snack: [1.14, 0.88] } },
  { id: "sloth",   name: "Sloth",            glyph: "\u{1F9A5}", fit: { hat: [0.47, 0.31, 0.34, -10], cap: [0.49, 0.33, 0.36, -10], eyes: [0.48, 0.51, 0.34, -30], snack: [0.98, 0.88] } },
  { id: "badger",  name: "Honey Badger",     glyph: "\u{1F9A1}", fit: { hat: [0.84, 0.21, 0.36, 12], cap: [0.84, 0.25, 0.38, 12], eyes: [0.94, 0.37, 0.3, -10], snack: [1.16, 0.88] } },
  { id: "octopus", name: "Octopus",          glyph: "\u{1F419}", fit: { hat: [0.635, 0.1, 0.5, 0], cap: [0.635, 0.16, 0.5, 0], eyes: [0.665, 0.29, 0.36, 0], snack: [1.12, 0.86] } },
  { id: "dragon",  name: "Dragon Hatchling", glyph: "\u{1F409}", fit: { hat: [0.745, 0.19, 0.38, 4], cap: [0.745, 0.23, 0.4, 4], eyes: [0.775, 0.325, 0.3, 6], snack: [1.12, 0.88] } },
  { id: "unicorn", name: "Unicorn Foal",     glyph: "\u{1F984}", fit: { hat: [0.8, 0.2, 0.32, 10], cap: [0.8, 0.23, 0.34, 10], eyes: [0.92, 0.345, 0.26, -4], snack: [1.02, 0.84] } },
  { id: "griffin", name: "Griffin Cub",      glyph: "\u{1F985}", fit: { hat: [0.5, 0.21, 0.36, -6], cap: [0.5, 0.25, 0.38, -6], eyes: [0.44, 0.33, 0.34, -10], snack: [1.12, 0.88] } },
  { id: "sprite",  name: "Pixel Sprite",     glyph: "\u{1F47E}", fit: { hat: [0.625, 0.35, 0.46, 0], cap: [0.625, 0.38, 0.48, 0], eyes: [0.625, 0.52, 0.56, 0], snack: [1.14, 0.86] } },
  { id: "pixie",   name: "Pixie",            glyph: "\u{1F9DA}", fit: { hat: [0.7, 0.19, 0.34, 6], cap: [0.72, 0.22, 0.36, 6], eyes: [0.8, 0.385, 0.3, 0], snack: [1.02, 0.82] } },
  { id: "golem",   name: "Stone Golem",      glyph: "\u{1F5FF}", fit: { hat: [0.64, 0.2, 0.36, 4], cap: [0.64, 0.23, 0.38, 4], eyes: [0.66, 0.37, 0.34, 4], snack: [1.14, 0.88] } }
];

export const ITEMS = [
  { id: "cap",    name: "Ball Cap",    glyph: "\u{1F9E2}", streak: 1 },
  { id: "shades", name: "Cool Shades", glyph: "\u{1F576}️", streak: 2 },
  { id: "snack",  name: "Snack Pack",  glyph: "\u{1F36A}", streak: 3 },
  { id: "hat",    name: "Cozy Hat",    glyph: "\u{1F3A9}", streak: 4 },
  { id: "crown",  name: "Crown",       glyph: "\u{1F451}", streak: 5 },
  // Unlocked for good once the class defeats the Ghost-olotl for the first time.
  { id: "witch",  name: "Witch Hat",   glyph: "\u{1F9D9}", streak: 5, ghost: true, img: "assets/gear/witch-hat.png" },
  // A snack-pack choice (sits where the Snack Pack goes). Also unlocked by defeating the Ghost-olotl.
  // Unlocked for good once the class defeats the Turducken for the first time (or bought in the Gobble-Palooza shop).
  { id: "pilgrim", name: "Pilgrim Hat", glyph: "\u{1F3A9}", streak: 5, turkey: true, img: "assets/gear/pilgrim-hat.webp" },
  // A snack-pack choice unlocked by defeating the Turducken.
  { id: "piesnack", name: "Pumpkin Pie", glyph: "\u{1F967}", streak: 3, turkey: true, slot: "snack", img: "assets/gear/pumpkin-pie.webp" },
  // Unlocked for good once the class defeats the Grinch-a-Duck for the first time (or bought in the Jingle Shop).
  { id: "antlers", name: "Reindeer Antlers", glyph: "\u{1F98C}", streak: 5, jingle: true, img: "assets/gear/reindeer-antlers.webp" },
  // A snack-pack choice unlocked by defeating the Grinch-a-Duck.
  { id: "cocoasnack", name: "Hot Cocoa", glyph: "\u2615", streak: 3, jingle: true, slot: "snack", img: "assets/gear/hot-cocoa.webp" },
  { id: "brewsnack", name: "Witch\u2019s Brew", glyph: "\u{1F9EA}", streak: 3, ghost: true, slot: "snack", img: "assets/gear/witchs-brew.webp" },
  { id: "cape",   name: "Hero Cape",   glyph: "\u{1F9B8}", revive: true }
];
// To use a picture instead of an emoji, drop a transparent PNG in assets/gear/ and set img, e.g. img: "assets/gear/cap.png"
ITEMS.forEach(it => { if (!("img" in it)) it.img = null; });
export const GEAR = ITEMS.filter(it => it.streak);
// Companions and gear are drawn from pictures of the Google (Chromebook) emoji, so hats and shades line up the
// same way on every computer. Each picture has 0.3em of padding around the emoji box (see .emo in style.css).
export const emojiImg = key => '<img class="emo" src="assets/emoji/' + key + '.webp" alt="">';
export function itemArt(it, cls) {
  return it.img ? '<img class="' + (cls || "") + '" src="' + it.img + '" alt="">' : emojiImg("gear-" + it.id);
}
export const SIDEKICKS = { axolotl: "Axolotl", duck: "Duck", ghost: "Ghost-olotl", turkey: "Turducken", grinch: "Grinch-a-Duck" };
// The Ghost-olotl reward: set once the class defeats the first Ghost-olotl. Stays after Haunt-O-Ween ends.
export function ghostUnlocked(cls) { return !!(cls && cls.ghostDefeated); }
// The Turducken reward: set once the class defeats the first Turducken. Stays after Gobble-Palooza ends.
export function turkeyUnlocked(cls) { return !!(cls && cls.turkeyDefeated); }
// The Grinch-a-Duck reward: set once the class defeats the first Grinch-a-Duck. Stays after Jingle Jam ends.
export function grinchUnlocked(cls) { return !!(cls && cls.grinchDefeated); }
// Is this gear's boss unlock done (true for normal gear)?
export function bossGearOk(g, cls) { return (!g.ghost || ghostUnlocked(cls)) && (!g.turkey || turkeyUnlocked(cls)) && (!g.jingle || grinchUnlocked(cls)); }

export function byId(list, id) { return list.find(x => x.id === id) || null; }
export function esc(s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
export function five(v) { return [v, v, v, v, v]; }
export function arr5(a, fill) { const out = []; for (let i = 0; i < 5; i++) out.push(a && a[i] != null ? a[i] : fill); return out; }
export function recordedDays(cls) { return arr5(cls && cls.recorded, false).map(Boolean); }
export function goalXP(cls) { return (cls && Number(cls.goal)) || 120; }

// Did the student reach the goal on day d? An excused day still counts as a hit when they reached the goal anyway
// (so it keeps their streak going); an excused day below the goal is just skipped (no penalty).
export function hitOn(st, d, cls) {
  const v = arr5(st && st.status, "")[d];
  if (v === "c") return true;
  if (v !== "e") return false;
  const g = goalXP(cls), xp = Number(arr5(st.xp, null)[d]) || 0, lx = Number(arr5(st.lunchXp, null)[d]) || 0;
  return xp >= g || lx >= g || !!arr5(st.early, false)[d];
}

/* ---------- survival engine ----------
   Hit 120 = full health. Miss = half health. Two misses in a row = disappears.
   Excused / not-yet-counted days are skipped. A Hero Cape brings it back on the next 120 day.
   Gear unlocks from the best run of 120 days this week and stays unlocked. */
export function simulate(st, cls) {
  const status = arr5(st.status, "");
  const items = st.items || [];
  const rec = recordedDays(cls);
  const capesOwned = items.filter(it => it.id === "cape").length;
  let capesUsed = 0;
  let health = MAX_HP, alive = true, missRun = 0, capeReady = false, capeSaved = false;
  let hitRun = 0, bestRun = 0, ovMet = 0, ovCounted = 0, daysCounted = 0;

  for (let d = 0; d < 5; d++) {
    if (!rec[d]) continue;
    daysCounted++;
    const v = status[d], hit = hitOn(st, d, cls);
    if (v === "e" && !hit) continue;   // excused and below the goal: skipped, no penalty
    ovCounted++;
    if (hit) { ovMet++; hitRun++; bestRun = Math.max(bestRun, hitRun); } else hitRun = 0;

    if (!alive) {
      if (hit) {
        if (capesUsed < capesOwned) { capesUsed++; alive = true; health = MAX_HP; missRun = 0; capeSaved = true; capeReady = false; }
        else capeReady = true;
      }
      continue;
    }
    if (hit) { health = MAX_HP; missRun = 0; }
    else {
      missRun++;
      if (missRun >= 2) { alive = false; health = 0; capeReady = false; }
      else health = HALF_HP;
    }
  }
  const unlocked = GEAR.filter(g => (bestRun >= g.streak && bossGearOk(g, cls)) || (g.id === "witch" && st.witchHat) || (g.id === "pilgrim" && st.pilgrimHat) || (g.id === "antlers" && st.antlersHat)).map(g => g.id);
  return {
    health, max: MAX_HP, alive, capeReady, capeSaved, hitRun, bestRun, unlocked,
    atRisk: alive && daysCounted > 0 && missRun === 1,
    ovMet, ovCounted, daysCounted, started: daysCounted > 0
  };
}

// null/undefined = wear newest unlock automatically, "" = nothing, otherwise the chosen item if unlocked
export function wornItem(st, sim) {
  if (st.equipped === "") return null;
  if (st.equipped && sim.unlocked.includes(st.equipped)) return byId(ITEMS, st.equipped);
  return sim.unlocked.length ? byId(ITEMS, sim.unlocked[sim.unlocked.length - 1]) : null;
}

export function tier(sim) {
  if (!sim.started) return { key: "waiting", label: "Week not started" };
  if (!sim.alive) return { key: "lost", label: sim.capeReady ? "Disappeared · Hero Cape ready" : "Disappeared" };
  if (sim.atRisk) return { key: "critical", label: "Half health" };
  return { key: "thriving", label: "Full health" };
}

// The day the board is "showing": the latest day with any counted or lunch data.
export function boardDay(cls, students, date) {
  const rec = recordedDays(cls);
  let day = -1;
  for (let d = 0; d < 5; d++) {
    if (rec[d] || students.some(s => arr5(s.early, false)[d])) day = d;
  }
  // Once that day is finalized and a later school day has started, show today (so yesterday's
  // lunch sidekicks and power-ups don't hang around until today's first upload).
  const today = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4 }[azNow(date).day];
  const fin = arr5(cls && cls.finalized, false);
  if (today != null && today > day && (day < 0 || fin[day])) day = today;
  return day;
}

// Sidekick only appears on days the student hit 120 by lunch.
export function sidekickToday(st, day) {
  if (day < 0 || !arr5(st.early, false)[day]) return null;
  return ["duck", "ghost", "turkey", "grinch"].includes(st.sidekick) ? st.sidekick : "axolotl";
}

/* ---------- art ----------
   Sidekick pictures live in assets/. Swap the PNGs to change the art (keep the file names). */
export const SIDEKICK_ART = { axolotl: "assets/axolotl.png", duck: "assets/duck.png", ghost: "assets/ghost-pet.png", turkey: "assets/gobble/turducken-sidekick.webp", grinch: "assets/jingle/grinchaduck-sidekick.webp" };
export function sidekickSVG(kind, big) {
  const k = SIDEKICK_ART[kind] ? kind : "axolotl";
  return '<img class="side ' + k + (big ? " big" : "") + '" src="' + SIDEKICK_ART[k] + '" alt="' + SIDEKICKS[k] + ' sidekick">';
}

// Hats sit on the head (anchored at their bottom-centre); shades centre on the eyes.
const HAT_SCALE = { cap: 1, hat: 1.05, crown: 0.95, witch: 1.25, pilgrim: 1.2, antlers: 1.35 };
// How far up each hat is lifted from its anchor point (the cap emoji has empty space under its brim, so it sits lower).
const HAT_LIFT = { cap: 72, hat: 88, crown: 88, witch: 88, pilgrim: 88, antlers: 70 };
const GLYPH_W = 1.25;   // emoji box is 1.25em wide x 1em tall
const pos = (x, y) => "left:" + (x / GLYPH_W * 100).toFixed(1) + "%;top:" + (y * 100).toFixed(1) + "%;";
export function gearStyle(c, worn) {
  const f = c.fit || {};
  if (worn.id === "shades") {
    const [x, y, sz, r] = f.eyes || [0.6, 0.45, 0.4, 0];
    return pos(x, y) + "font-size:" + sz + "em;transform:translate(-50%,-50%) rotate(" + r + "deg);";
  }
  if (worn.id === "snack" || worn.slot === "snack") {
    const [x, y] = f.snack || [1.1, 0.86];
    return pos(x, y) + "font-size:" + (worn.img ? "0.4em" : "0.34em") + ";transform:translate(-50%,-50%) rotate(-8deg);";
  }
  const [x, y, sz, r] = f[worn.id] || f.hat || [0.6, 0.2, 0.45, 0];
  return pos(x, y) + "font-size:" + (sz * (HAT_SCALE[worn.id] || 1)).toFixed(3) + "em;transform:translate(-50%,-" + (HAT_LIFT[worn.id] || 88) + "%) rotate(" + r + "deg);transform-origin:50% " + (HAT_LIFT[worn.id] || 88) + "%;";
}
/* ---------- Student names ----------
   Names are shown as the first name only. When two students share a first name, their last initial is added ("Maya J.").
   The roster keeps the full name (s.fullName) for matching spreadsheet uploads. "Last, First" is read as "First Last". */
export function firstLast(full) {
  const t = String(full || "").trim().replace(/\s+/g, " ");
  if (t.includes(",")) { const i = t.indexOf(","); return (t.slice(i + 1).trim() + " " + t.slice(0, i).trim()).trim(); }
  return t;
}
export function displayNames(students) {
  const parts = students.map(s => { const t = firstLast(s.fullName != null ? s.fullName : s.name).split(" ").filter(Boolean); return { id: s.id, first: t[0] || "", last: t.length > 1 ? t[t.length - 1] : "" }; });
  const cnt = {}; parts.forEach(p => { const k = p.first.toLowerCase(); cnt[k] = (cnt[k] || 0) + 1; });
  const out = {};
  parts.forEach(p => { out[p.id] = cnt[p.first.toLowerCase()] > 1 && p.last ? p.first + " " + p.last[0].toUpperCase() + "." : p.first; });
  return out;
}
// Keeps the full roster name in s.fullName and puts the display name in s.name (local copies only; never saved).
export function applyDisplayNames(students) {
  students.forEach(s => { if (s.fullName == null) s.fullName = s.name || ""; });
  const m = displayNames(students);
  students.forEach(s => { s.name = m[s.id] || s.fullName; });
  return students;
}

/* A level-100 creature can be picked as the companion instead (st.petCreature = its family id).
   Limited event Legendaries (Duckarune, Hexaduck, Wisholotl, Thanksolotl...) can be picked at any level. */
export const PET_LEVEL = 100;
// Where gear sits on the event Legendaries (their pictures aren't centred like the companions).
const CREATURE_FIT = {
  "L-26": { hat: [0.855, 0.37, 0.24, 6], cap: [0.855, 0.4, 0.26, 6], eyes: [0.88, 0.49, 0.2, 0], snack: [1.08, 0.9] },     // Duckarune
  "L-27": { hat: [0.79, 0.22, 0.26, 8], cap: [0.8, 0.27, 0.28, 8], eyes: [0.84, 0.345, 0.2, 10], snack: [1.08, 0.9] },     // Hexaduck
  "L-28": { hat: [0.83, 0.49, 0.26, 0], cap: [0.83, 0.52, 0.28, 0], eyes: [0.815, 0.69, 0.22, 0], snack: [1.1, 0.95] },    // Wisholotl
  "L-29": { hat: [0.37, 0.39, 0.24, -4], cap: [0.37, 0.42, 0.26, -4], eyes: [0.345, 0.465, 0.2, -6], snack: [1.1, 0.95] }, // Thanksolotl
  "L-30": { hat: [0.86, 0.36, 0.24, 4], cap: [0.86, 0.39, 0.26, 4], eyes: [0.88, 0.53, 0.22, 0], snack: [1.1, 0.95] }    // Jinglotl
};
export function creatureCompanion(st, fam) {
  const e = ((st && st.coll) || {})[fam];
  if (!e) return null;
  const c = formOf(fam, e.lvl || 1); if (!c) return null;
  if ((Number(e.lvl) || 1) < PET_LEVEL && !c.event) return null;
  const img = e.sparkle ? sparkleImg(c) : c.img;
  return { id: "cr:" + fam, fam, name: c.name, creature: true, sparkle: !!e.sparkle,
    glyph: '<img class="crpet" src="' + img + '" alt="">',
    fit: CREATURE_FIT[fam] || { hat: [0.62, 0.1, 0.42, 0], eyes: [0.64, 0.34, 0.3, 0], snack: [1.1, 0.86] } };
}
export function petCreatures(st) { return Object.keys((st && st.coll) || {}).map(f => creatureCompanion(st, f)).filter(Boolean); }
export function companionOf(st) {
  if (st && st.petCreature) { const c = creatureCompanion(st, st.petCreature); if (c) return c; }
  return byId(ROSTER, st && st.companionId);
}
// The badge a student pinned (top-right corner of their tile on The Keep). Badge art is assets/badges/<id>.webp.
export function pinnedBadgeHTML(st, cls) {
  const id = st && st.pinnedBadge;
  if (!id || !(st.badges || {})[id]) return "";
  return '<img class="pinbadge' + (cls ? " " + cls : "") + '" src="assets/badges/' + esc(id) + '.webp" alt="" title="Pinned badge" onerror="this.remove()">';
}
export function petHTML(c, worn) {
  return '<span class="petwrap"><span class="tglyph">' + (c.creature ? c.glyph : emojiImg("pet-" + c.id)) + "</span>" +
    (worn ? '<span class="gear" style="' + gearStyle(c, worn) + '">' + itemArt(worn, "gimg") + "</span>" : "") + "</span>";
}

// One tile on The Keep (class board): the companion's name with the student's display name under it.
export function tileHTML(st, sim, rank, day, popped, haunt) {
  const c = companionOf(st);
  const t = tier(sim);
  const worn = wornItem(st, sim);
  const side = sidekickToday(st, day);
  const cape = (st.items || []).some(it => it.id === "cape") ? '<span title="Hero Cape">\u{1F9B8}</span>' : "";
  return '<div class="tile t-' + t.key + (side ? " early" : "") + (popped ? " pop" : "") + (sim.atRisk ? " risk" : "") + (haunt ? " haunted" : "") + '">' +
    '<span class="rank">' + rank + "</span>" + pinnedBadgeHTML(st) +
    (haunt ? basketHTML(candyLeft(st), "corner") : "") +
    (side ? '<span class="lunch">LUNCH HERO</span>' : "") +
    '<div class="stage" aria-hidden="true">' + petHTML(c, worn) + (side ? sidekickSVG(side) : "") + "</div>" +
    '<div class="tname2">' + esc(st.petName || c.name) + "</div>" +
    '<div class="towner">' + esc(st.name || "") + "</div>" +
    '<div class="tspec">' + esc(c.name) + "</div>" +
    '<span class="tbar"><span style="width:' + Math.max(0, Math.min(100, sim.health / sim.max * 100)) + '%"></span></span>' +
    '<div class="tstat"><span>' + (sim.alive ? sim.health + " hp" : "disappeared") + "</span><span>" + sim.ovMet + " / " + sim.ovCounted + " days</span></div>" +
    (sim.atRisk ? '<div class="riskline">Half health · hit 120 tomorrow!</div>' : "") +
    (sim.capeReady ? '<div class="saveline">Hero Cape unlocked!</div>' : "") +
    '<div class="twear">' + cape + "</div></div>";
}

export function statTile(pct, color, big, label, sub) {
  const r = 26, circ = 2 * Math.PI * r, dash = Math.max(0, Math.min(100, pct)) / 100 * circ;
  return '<div class="s4"><svg class="dn" viewBox="0 0 64 64" aria-hidden="true">' +
    '<circle cx="32" cy="32" r="' + r + '" fill="none" stroke="var(--line-2)" stroke-width="9"></circle>' +
    '<circle cx="32" cy="32" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="9" stroke-linecap="round" stroke-dasharray="' +
    dash.toFixed(1) + " " + circ.toFixed(1) + '" transform="rotate(-90 32 32)"></circle></svg>' +
    '<div class="s4b"><div class="s4v">' + big + '</div><div class="s4k">' + esc(label) + '</div><div class="s4s">' + esc(sub) + "</div></div></div>";
}

// The Keep: banner + four stats + tiles. Used by the teacher's class view.
export function keepHTML(cls, students, popIds, shout) {
  const day = boardDay(cls, students);
  const rec = recordedDays(cls);
  const live = students.filter(s => s.companionId && byId(ROSTER, s.companionId))
    .map(s => ({ s, sim: simulate(s, cls) }))
    .sort((a, b) => (a.sim.alive !== b.sim.alive ? (a.sim.alive ? -1 : 1) : b.sim.health - a.sim.health || b.sim.ovMet - a.sim.ovMet));
  const alive = live.filter(r => r.sim.alive).length;
  const half = live.filter(r => r.sim.atRisk).length;
  const lunch = live.filter(r => sidekickToday(r.s, day)).length;
  let lastRec = -1; for (let d = 0; d < 5; d++) if (rec[d]) lastRec = d;
  let dayHit = 0, dayReq = 0;
  if (lastRec >= 0) live.forEach(r => { const v = arr5(r.s.status, "")[lastRec], h = hitOn(r.s, lastRec, cls); if (v === "e" && !h) return; dayReq++; if (h) dayHit++; });
  const band = p => (p >= 80 ? "var(--good)" : p >= 50 ? "var(--warn)" : "var(--bad)");
  const pct = (a, b) => (b ? Math.round(a / b * 100) : 0);

  const haunt = eventMode(cls);
  const candyTotal = haunt ? live.reduce((n, r) => n + candyOf(r.s), 0) : 0;
  const fullBaskets = haunt ? live.filter(r => candyOf(r.s) >= CANDY_FULL).length : 0;
  let h = bannerFor(cls) + '<div class="tally4">' +
    (haunt ? statTile(pct(fullBaskets, live.length), "#E8740C", candyTotal.toLocaleString(), SEASON.coin + " " + SEASON.Cur + " collected",
      fullBaskets + " full basket" + (fullBaskets === 1 ? "" : "s") + " (" + CANDY_FULL.toLocaleString() + "+)") : "") +
    statTile(pct(alive, live.length), band(pct(alive, live.length)), alive + " / " + live.length, "Companions alive", "still here this week") +
    statTile(pct(dayHit, dayReq), dayReq ? band(pct(dayHit, dayReq)) : "var(--ink-3)", dayReq ? pct(dayHit, dayReq) + "%" : "—",
      "Hit " + goalXP(cls) + " XP", lastRec >= 0 ? dayHit + " of " + dayReq + " on " + DAYS[lastRec] : "no day counting yet") +
    statTile(pct(lunch, live.length), "var(--warn)", String(lunch), "Lunch heroes", day >= 0 ? "hit " + goalXP(cls) + " by lunch " + DAYS[day] : "none yet") +
    statTile(pct(half, live.length), half ? "var(--warn)" : "var(--good)", String(half), "At half health", half ? "need " + goalXP(cls) + " XP next day" : "nobody in danger") +
    "</div>" + (shout || "");
  if (!live.length) return h + '<div class="card"><p class="lede">No companions chosen yet.</p></div>';
  h += '<div class="board">';
  live.forEach((r, i) => { h += tileHTML(r.s, r.sim, i + 1, day, popIds && popIds[r.s.id] && Date.now() - popIds[r.s.id] < 6000, haunt); });
  return h + "</div>";
}


/* ---------- Battle Area: the Ghost-olotl ----------
   Each day a student hits 120 XP earns one attack (use it any time that week).
   The Ghost-olotl's health and damage per attack are set by the teacher. */
export const GHOST_IMG = "assets/ghostolotl.png";
// Damage is tracked per student (dmgTotal). bossBase / bossBaseHits mark where the current Ghost-olotl started.
export const HAT_BONUS = 5, BREW_BONUS = 10;
export function baseDamage(cls) { return Math.max(1, Number(cls && cls.bossDmg) || 50); }
export function dmgOf(st, cls) { return st.dmgTotal != null ? Number(st.dmgTotal) || 0 : (Number(st.attackTotal) || 0) * baseDamage(cls); }
export function bossState(cls, students) {
  const max = Math.max(1, Number(cls && cls.bossHP) || 6500);
  const dmg = baseDamage(cls);
  const total = students.reduce((n, s) => n + dmgOf(s, cls), 0);
  const totalHits = students.reduce((n, s) => n + (Number(s.attackTotal) || 0), 0);
  const dealt = Math.max(0, total - (Number(cls && cls.bossBase) || 0));
  const hits = Math.max(0, totalHits - (Number(cls && cls.bossBaseHits) || 0));
  const healed = Math.max(0, Number(cls && cls.bossHealed) || 0);
  const left = Math.max(0, Math.min(max, max - dealt + healed));
  return { max, dmg, hits, dealt, healed, left, pct: left / max * 100, defeated: left <= 0, total, totalHits };
}
// What this student's next attack does, and what it uses up.
export function nextAttack(st, cls) {
  const days = attacksReady(st, cls), extra = Math.max(0, Number(st.extraAttacks) || 0), brews = Math.max(0, Number(st.brews) || 0);
  const hat = !!st[seasonOf(cls).hatFlag], brew = brews > 0;
  return { count: days.length + extra, day: days.length ? days[0] : null, useExtra: !days.length && extra > 0,
    hat, brew, damage: baseDamage(cls) + (hat ? HAT_BONUS : 0) + (brew ? BREW_BONUS : 0) };
}
export function attacksReady(st, cls) {
  const used = arr5(st.attacks, false);
  const out = [];
  for (let d = 0; d < 5; d++) if (hitOn(st, d, cls) && !used[d]) out.push(d);
  return out;
}
export function bossBarHTML(b) {
  return '<div class="bossbar"><div class="bosslabel"><b>' + SEASON.boss + '</b><span>' + b.left.toLocaleString() + " / " + b.max.toLocaleString() + "</span></div>" +
    '<span class="bosstrack"><span style="width:' + b.pct.toFixed(1) + '%"></span></span></div>';
}
// Every companion in the Keep, lined up to fight the Ghost-olotl together.
export function teamHTML(cls, students, charging) {
  const team = students.filter(s => s.companionId && byId(ROSTER, s.companionId));
  if (!team.length) return "";
  return '<div class="team' + (charging ? " charge" : "") + '" aria-label="The Keep\u2019s companions">' +
    team.map((s, i) => {
      const c = companionOf(s), sim = simulate(s, cls);
      return '<span class="mate' + (sim.alive ? "" : " gone") + '" style="animation-delay:' + (i % 8) * 60 + 'ms" title="' + esc(s.petName || c.name) + '">' +
        petHTML(c, wornItem(s, sim)) + "</span>";
    }).join("") + '</div><p class="team-cap">The whole Keep attacks together!</p>';
}

// Teacher's projected Battle Area.
export function battleHTML(cls, students, fx) {
  const b = bossState(cls, students);
  const fighters = students.filter(s => s.companionId && byId(ROSTER, s.companionId));
  const attackedToday = fighters.filter(s => arr5(s.attacks, false).some(Boolean));
  const ready = fighters.filter(s => nextAttack(s, cls).count);
  const S = SEASON;
  let h = bannerFor(cls) + '<div class="arena fight ' + S.key + (b.defeated ? " won" : "") + (fx && fx.heal ? " healing" : "") + '">' +
    '<p class="arena-title">\u2694\uFE0F Battle Area</p>' + bossBarHTML(b) +
    '<div class="ghostwrap' + (fx && fx.hit ? " hit" : "") + '"><img class="ghostimg" src="' + S.bossImg + '" alt="The ' + S.boss + '">' +
    (fx && fx.hit ? '<span class="dmg">-' + (fx.amount || b.dmg) + "</span>" : "") +
    (fx && fx.heal ? '<span class="dmg heal">+' + fx.heal + "</span>" : "") + "</div>" +
    teamHTML(cls, students, fx && fx.hit) + bucketHTML(cls, students) +
    (b.defeated ? '<p class="arena-win">\u{1F389} The ' + S.boss + ' has been defeated! \u{1F389}</p>' : "") +
    '<div class="arena-row"><span class="arena-k">Attacked this week</span><div class="arena-pets">' +
    (attackedToday.length ? attackedToday.map(s => { const c = companionOf(s); return '<span class="ap" title="' + esc(s.petName || c.name) + '">' + c.glyph + "<small>" + esc(s.petName || c.name) + "</small></span>"; }).join("") : '<span class="arena-none">No attacks yet this week</span>') +
    "</div></div>" +
    '<div class="arena-row"><span class="arena-k">Ready to attack</span><div class="arena-pets">' +
    (ready.length ? ready.map(s => { const c = companionOf(s); return '<span class="ap ready">' + c.glyph + "<small>" + esc(s.petName || c.name) + "</small></span>"; }).join("") : '<span class="arena-none">Hit 120 XP to earn an attack</span>') +
    "</div></div>" +
    '<p class="arena-foot">' + b.hits.toLocaleString() + " attack" + (b.hits === 1 ? "" : "s") + " landed \u00b7 " + b.dealt.toLocaleString() + " damage dealt" + (b.healed ? " \u00b7 " + b.healed.toLocaleString() + " healed by Ms. Ariana" : "") + "</p></div>";
  return h;
}


/* ---------- Candy Shop ----------
   Students spend candy on these. Replace the placeholders with the real items:
   id (short, no spaces), name, cost (candy), what it does (desc), and a picture
   (img: "assets/store/<file>.png") or an emoji (glyph). */
export const STORE = [
  { id: "spin",     name: "Trick or Treat Wheel", glyph: "\u{1F3A1}", cost: 60,  desc: "One spin on the Trick or Treat Wheel. Spins are saved until you use them!" },
  { id: "witchhat", name: "Witch\u2019s Hat",       img: "assets/gear/witch-hat.png",   cost: 600, once: true, desc: "Your companion wears it and every attack does +5 damage." },
  { id: "brew",     name: "Witch\u2019s Brew",      img: "assets/store/witchs-brew.png", cost: 60,  desc: "Your next attack does +10 damage. Used up after one attack." },
  { id: "attack",   name: "Attack the Ghost-olotl", glyph: "\u2694\uFE0F", cost: 120, desc: "One extra attack on the Ghost-olotl, any day." }
];
// Gobble-Palooza shop. Keep prices in step with price() in firestore.rules.
export const GOBBLE_STORE = [
  { id: "spin",       name: "Pie Wheel",           glyph: "\u{1F967}", cost: 60,  desc: "One spin on the Pie Wheel. Spins are saved until you use them!" },
  { id: "pilgrimhat", name: "Pilgrim Hat",         img: "assets/gear/pilgrim-hat.webp", cost: 600, once: true, desc: "Your companion wears it and every attack does +5 damage." },
  { id: "pie",        name: "Pumpkin Pie",         img: "assets/gear/pumpkin-pie.webp", cost: 60,  desc: "Your next attack does +10 damage. Used up after one attack." },
  { id: "attack",     name: "Attack the Turducken", glyph: "\u2694\uFE0F", cost: 120, desc: "One extra attack on the Turducken, any day." }
];
// Jingle Jam shop. Keep prices in step with price() in firestore.rules.
export const JINGLE_STORE = [
  { id: "spin",    name: "Present Wheel",             glyph: "\u{1F381}", cost: 60,  desc: "One spin on the Present Wheel. Spins are saved until you use them!" },
  { id: "antlers", name: "Reindeer Antlers",          img: "assets/gear/reindeer-antlers.webp", cost: 600, once: true, desc: "Your companion wears them and every attack does +5 damage." },
  { id: "cocoa",   name: "Hot Cocoa",                 img: "assets/gear/hot-cocoa.webp", cost: 60,  desc: "Your next attack does +10 damage. Used up after one attack." },
  { id: "attack",  name: "Attack the Grinch-a-Duck",  glyph: "\u2694\uFE0F", cost: 120, desc: "One extra attack on the Grinch-a-Duck, any day." }
];
export function candySpent(st) { return Math.max(0, Number(st.candySpent) || 0); }
export function candyLeft(st) { return Math.max(0, candyOf(st) - candySpent(st)); }
export function ownsItem(st, id) { return id === "witchhat" ? !!st.witchHat : id === "pilgrimhat" ? !!st.pilgrimHat : id === "antlers" ? !!st.antlersHat : ownedCount(st, id) > 0; }
export function ownedCount(st, id) { return (st.purchases || []).filter(p => p.id === id).length; }
export function storeArt(it, cls) { return it.img ? '<img class="' + (cls || "") + '" src="' + it.img + '" alt="">' : it.glyph; }

/* ---------- Trick or Treat Wheel ----------
   The frame, stand, pointer and centre swirl come from assets/wheel/wheel-frame.png.
   The slices are drawn here and spin underneath it. Edit WHEEL to change the prizes. */
// Orange = treats, purple = tricks (they alternate around the wheel). Rare slices land 5% of the time;
// the other six share the rest equally (15% each).
export const WHEEL = [
  { id: "candy75", label: "75 Candy",       icon: "\u{1F36C}", kind: "treat" },
  { id: "steal",   label: "Steal Candy",    icon: "\u{1F9B9}", kind: "trick", note: "Steal 25\u201350 of Ms. Ariana\u2019s candy!" },
  { id: "reroll",  label: "Reroll",         icon: "\u{1F504}", kind: "treat", note: "Spin again for free!" },
  { id: "nothing", label: "Nothing",        icon: "\u{1F47B}", kind: "trick", note: "Nothing happens\u2026 boo!" },
  { id: "candy75", label: "75 Candy",       icon: "\u{1F36D}", kind: "treat" },
  { id: "nothing", label: "Nothing",        icon: "\u{1F987}", kind: "trick", note: "Nothing happens\u2026 boo!" },
  { id: "prize",   label: "Prize!",         icon: "\u{1F381}", kind: "treat", rare: true, note: "You won a prize! Ms. Ariana has been told." },
  { id: "attack",  label: "Free Attack",    icon: "\u2694\uFE0F", kind: "trick", rare: true, note: "A free attack on the Ghost-olotl!" }
];
export const RARE_CHANCE = 0.05;
// Pie Wheel: pumpkin slices are treats, apple slices are tricks. Same slice ids as the Trick or Treat Wheel
// (the save rules check the ids), so "candy75" here means 75 corn.
export const PIE_WHEEL = [
  { id: "candy75", label: "75 Corn",     icon: "\u{1F33D}", kind: "treat" },
  { id: "steal",   label: "Steal Corn",  icon: "\u{1F9B9}", kind: "trick", note: "Steal 25\u201350 of Ms. Ariana\u2019s corn!" },
  { id: "reroll",  label: "Reroll",      icon: "\u{1F504}", kind: "treat", note: "Spin again for free!" },
  { id: "nothing", label: "Nothing",     icon: "\u{1F342}", kind: "trick", note: "Nothing happens\u2026 gobble gobble!" },
  { id: "candy75", label: "75 Corn",     icon: "\u{1F33D}", kind: "treat" },
  { id: "nothing", label: "Nothing",     icon: "\u{1F34E}", kind: "trick", note: "Nothing happens\u2026 gobble gobble!" },
  { id: "prize",   label: "Prize!",      icon: "\u{1F381}", kind: "treat", rare: true, note: "You won a prize! Ms. Ariana has been told." },
  { id: "attack",  label: "Free Attack", icon: "\u2694\uFE0F", kind: "trick", rare: true, note: "A free attack on the Turducken!" }
];
// Present Wheel: green slices are treats, red slices are tricks. Same slice ids as the other wheels.
export const PRESENT_WHEEL = [
  { id: "candy75", label: "75 Presents", icon: "\u{1F381}", kind: "treat" },
  { id: "steal",   label: "Steal Back",  icon: "\u{1F9B9}", kind: "trick", note: "Steal back 25\u201350 presents from the Grinch\u2019s Sack!" },
  { id: "reroll",  label: "Reroll",      icon: "\u{1F504}", kind: "treat", note: "Spin again for free!" },
  { id: "nothing", label: "Coal",        icon: "\u{1FAA8}", kind: "trick", note: "A lump of coal\u2026 nothing happens!" },
  { id: "candy75", label: "75 Presents", icon: "\u{1F381}", kind: "treat" },
  { id: "nothing", label: "Coal",        icon: "\u{1FAA8}", kind: "trick", note: "A lump of coal\u2026 nothing happens!" },
  { id: "prize",   label: "Prize!",      icon: "\u{1F31F}", kind: "treat", rare: true, note: "You won a prize! Ms. Ariana has been told." },
  { id: "attack",  label: "Free Attack", icon: "\u2694\uFE0F", kind: "trick", rare: true, note: "A free attack on the Grinch-a-Duck!" }
];

// The Prize Wheel opens when a student lands on "Prize!". 8 slices. A prize marked rare: true lands 5% of the time
// (or its own `chance`, e.g. 0.02 = 2%); the others share the rest equally. empty: true = open slot, never won.
// Replace each placeholder with the real prize: name, img ("assets/prizes/<file>.png") and link (where to order it).
// Gobble-Palooza Prize Wheel (used once Gobble-Palooza is built). Chances: 4 prizes at 9.5%, 2 rares at 1%, two 100 XP slices at 30%.
export const GOBBLE_PRIZES = [
  { name: "Turkey Stickers", icon: "\u{1F983}", img: "assets/prizes/gp-stickers.png", link: "https://www.amazon.com/dp/B0C941SMGB", kind: "treat" },
  { name: "100 XP", icon: "\u2B50", img: "", link: "", kind: "trick", xp: 100, chance: 0.30 },
  { name: "Thanksgiving Pens", icon: "\u{1F58A}\uFE0F", img: "assets/prizes/gp-pens.png", link: "https://www.amazon.com/dp/B0F1N177CX", kind: "treat" },
  { name: "Fall Cup", icon: "\u{1F964}", img: "assets/prizes/gp-cup.png", link: "https://www.amazon.com/dp/B0H5HLPTK5", kind: "trick", rare: true, chance: 0.01 },
  { name: "Fall Keychain", icon: "\u{1F341}", img: "assets/prizes/gp-keychain.png", link: "https://www.amazon.com/dp/B0FJ7KPDH5", kind: "treat" },
  { name: "100 XP", icon: "\u2B50", img: "", link: "", kind: "trick", xp: 100, chance: 0.30 },
  { name: "Turkey Straw Toppers", icon: "\u{1F983}", img: "assets/prizes/gp-straw.png", link: "https://www.amazon.com/dp/B0DBLC8659", kind: "treat" },
  { name: "Turkey Duck", icon: "\u{1F986}", img: "assets/prizes/gp-duck.png", link: "https://www.amazon.com/dp/B07LC7R5GW", kind: "trick", rare: true, chance: 0.01 }
];
// Jingle Jam Prize Wheel. Chances: 4 prizes at 9.5%, 2 rares at 1%, two 100 XP slices at 30%.
export const JINGLE_PRIZES = [
  { name: "Candy Cane Straw Topper", short: "Straw Topper", icon: "\u{1F36C}", img: "assets/prizes/jj-straw.png", link: "https://a.co/d/06f2hiiR", kind: "treat" },
  { name: "100 XP", icon: "\u2B50", img: "", link: "", kind: "trick", xp: 100, chance: 0.30 },
  { name: "Winter Stickers", short: "Stickers", icon: "\u2744\uFE0F", img: "assets/prizes/jj-stickers.png", link: "https://a.co/d/0ixeNB5h", kind: "treat" },
  { name: "Grinch Duck", icon: "\u{1F986}", img: "assets/prizes/jj-duck.png", link: "https://a.co/d/0j44SZTs", kind: "trick", rare: true, chance: 0.01 },
  { name: "Snowflake Stress Cube", short: "Stress Cube", icon: "\u{1F9CA}", img: "assets/prizes/jj-cube.png", link: "https://a.co/d/0cHjOtHu", kind: "treat" },
  { name: "100 XP", icon: "\u2B50", img: "", link: "", kind: "trick", xp: 100, chance: 0.30 },
  { name: "Holiday Cat Pins", short: "Cat Pins", icon: "\u{1F408}\u200D\u2B1B", img: "assets/prizes/jj-catpins.png", link: "https://a.co/d/0bPDTc4T", kind: "treat" },
  { name: "Holiday Mug", icon: "\u2615", img: "assets/prizes/jj-mug.png", link: "https://a.co/d/0dpP4y1t", kind: "trick", rare: true, chance: 0.01 }
];
export const PRIZES = [
  { name: "Ghost Sticker", short: "Ghost Sticker", icon: "\u{1F47B}", img: "assets/prizes/prize-1.png", link: "https://a.co/d/0bfdSD1g", kind: "treat" },
  { name: "100 XP", icon: "\u2B50", img: "", link: "", kind: "trick", xp: 100, chance: 0.30 },
  { name: "Ghost Straw Toppers", short: "Straw Ghosts", icon: "\u{1F47B}", img: "assets/prizes/prize-2.png", link: "https://a.co/d/01HySKGX", kind: "treat" },
  { name: "Ghost Tumbler", icon: "\u{1F964}", img: "assets/prizes/prize-tumbler.png", link: "https://a.co/d/05GhiRAe", kind: "trick", rare: true, chance: 0.01 },
  { name: "Holographic Halloween Sticker Pack", short: "Stickers", icon: "\u2728", img: "assets/prizes/prize-3.png", link: "https://a.co/d/08s3F0Kq", kind: "treat" },
  { name: "100 XP", icon: "\u2B50", img: "", link: "", kind: "trick", xp: 100, chance: 0.30 },
  { name: "Ghost Pins", icon: "\u{1F47B}", img: "assets/prizes/prize-4.png", link: "https://a.co/d/015lDXCy", kind: "treat" },
  { name: "Pumpkin Duck", icon: "\u{1F986}", img: "assets/prizes/prize-duck.png", link: "https://a.co/d/08xZHuni", kind: "trick", rare: true, chance: 0.01 }
];
/* ---------- Seasons ----------
   Everything that changes between Haunt-O-Ween and Gobble-Palooza. setSeason(cls) is called whenever the class loads. */
export const SEASONS = {
  haunt: { key: "haunt", name: "Haunt-O-Ween", icon: "\u{1F383}", cur: "candy", Cur: "Candy", coin: "\u{1F36C}", basket: "basket",
    boss: "Ghost-olotl", bossImg: "assets/ghostolotl.png", bossIcon: "\u{1F47B}", defeatFlag: "ghostDefeated",
    wheel: "Trick or Treat Wheel", wheelIcon: "\u{1F3A1}", frame: "assets/wheel/wheel-frame.png", treat: "\u{1F7E0} Orange = treats", trick: "\u{1F7E3} purple = tricks",
    colors: { treat: ["#FF9A33", "#E8650E"], trick: ["#6A2BD1", "#4B17A3"] },
    shop: "Candy Shop", bucket: "Ms. Ariana\u2019s Candy Bucket", hatItem: "witchhat", hatFlag: "witchHat", hatGear: "witch", hatName: "Witch\u2019s Hat", hatIcon: "\u{1F9D9}",
    brewItem: "brew", brewName: "Witch\u2019s Brew", brewNames: "Witch\u2019s Brews", brewIcon: "\u{1F9EA}", store: STORE, slices: WHEEL, prizes: PRIZES },
  gobble: { key: "gobble", name: "Gobble-Palooza", icon: "\u{1F983}", cur: "corn", Cur: "Corn", coin: "\u{1F33D}", basket: "cornucopia",
    boss: "Turducken", bossImg: "assets/gobble/turducken.webp", bossIcon: "\u{1F983}", defeatFlag: "turkeyDefeated",
    wheel: "Pie Wheel", wheelIcon: "\u{1F967}", frame: "assets/gobble/pie-wheel-frame.webp", treat: "\u{1F7E0} Pumpkin = treats", trick: "\u{1F534} apple = tricks",
    colors: { treat: ["#F4A640", "#D9731A"], trick: ["#E0443E", "#A61E24"] },
    shop: "Gobble Shop", bucket: "Ms. Ariana\u2019s Cornucopia", hatItem: "pilgrimhat", hatFlag: "pilgrimHat", hatGear: "pilgrim", hatName: "Pilgrim Hat", hatIcon: "\u{1F3A9}",
    brewItem: "pie", brewName: "Pumpkin Pie", brewNames: "Pumpkin Pies", brewIcon: "\u{1F967}", store: GOBBLE_STORE, slices: PIE_WHEEL, prizes: GOBBLE_PRIZES },
  jingle: { key: "jingle", name: "Jingle Jam", icon: "\u{1F384}", cur: "presents", Cur: "Presents", coin: "\u{1F381}", basket: "tree",
    boss: "Grinch-a-Duck", bossImg: "assets/jingle/grinchaduck.webp", bossIcon: "\u{1F986}", defeatFlag: "grinchDefeated",
    wheel: "Present Wheel", wheelIcon: "\u{1F381}", frame: "assets/jingle/present-wheel-frame.webp", face: { cx: 0.4984, cy: 0.488, r: 0.3094 },
    treat: "\u{1F7E2} Green = treats", trick: "\u{1F534} red = tricks",
    colors: { treat: ["#3FB35F", "#1E7A3A"], trick: ["#E0443E", "#A61E24"] },
    shop: "Jingle Shop", bucket: "The Grinch\u2019s Sack", hatItem: "antlers", hatFlag: "antlersHat", hatGear: "antlers", hatName: "Reindeer Antlers", hatIcon: "\u{1F98C}",
    brewItem: "cocoa", brewName: "Hot Cocoa", brewNames: "Hot Cocoas", brewIcon: "\u2615", store: JINGLE_STORE, slices: PRESENT_WHEEL, prizes: JINGLE_PRIZES }
};
export function seasonOf(cls) { return isJingle(cls) ? SEASONS.jingle : isGobble(cls) ? SEASONS.gobble : SEASONS.haunt; }
export let SEASON = SEASONS.haunt;
export function setSeason(cls) { SEASON = seasonOf(cls); return SEASON; }
export function prizeSlices() { return SEASON.prizes.map(p => Object.assign({}, p, { label: p.short || p.name })); }
// A slice's chance: its own `chance` if set, 5% if rare, otherwise an equal share of what's left.
export function sliceChances(slices) {
  // empty = a prize slot not filled in yet: it can never be won.
  const fixed = slices.map(s => (s.empty ? 0 : s.chance != null ? s.chance : s.rare ? RARE_CHANCE : null));
  const used = fixed.reduce((n, c) => n + (c || 0), 0), open = fixed.filter(c => c == null).length;
  return fixed.map(c => (c != null ? c : Math.max(0, 1 - used) / open));
}
export function pickSlice(slices) {
  const w = sliceChances(slices);
  let r = Math.random(), i = 0;
  for (; i < w.length - 1; i++) { if (r < w[i]) break; r -= w[i]; }
  return i;
}
// Where the wheel face sits inside the frame picture (fractions of the picture's width/height).
const WHEEL_FACE = { cx: 0.4960, cy: 0.4577, r: 0.3732 };
export function wheelSVG(slices) {
  const n = slices.length, step = 360 / n;
  const pt = (deg, r) => { const t = (deg - 90) * Math.PI / 180; return [(r * Math.cos(t)).toFixed(2), (r * Math.sin(t)).toFixed(2)]; };
  let g = "";
  slices.forEach((s, i) => {
    const a0 = i * step - step / 2, a1 = a0 + step, [x0, y0] = pt(a0, 101), [x1, y1] = pt(a1, 101);
    g += '<path d="M0 0 L' + x0 + " " + y0 + " A101 101 0 0 1 " + x1 + " " + y1 + ' Z" fill="url(#' + (s.kind === "trick" ? "wp" : "wo") + ')" stroke="#1d1024" stroke-width="1.1"/>';
    if (s.rare) {
      const [a, b] = pt(a0 + 1.5, 97), [c, d] = pt(a1 - 1.5, 97), [e, f] = pt(a1 - 1.5, 24), [gx, gy] = pt(a0 + 1.5, 24);
      g += '<path d="M' + gx + " " + gy + " L" + a + " " + b + " A97 97 0 0 1 " + c + " " + d + " L" + e + " " + f + ' Z" fill="none" stroke="#FFD34D" stroke-width="2.2" stroke-linejoin="round" opacity=".95"/>';
    }
    // icon near the rim, name running along the slice from the centre outwards
    const long = s.label.length > (s.img ? 7 : 9), ly = s.img ? -42 : -50, lw = s.img ? 38 : 50;
    const pic = s.img ? '<image href="' + esc(s.img) + '" x="-17" y="-99" width="34" height="34" preserveAspectRatio="xMidYMid meet"/>'
      : '<text x="0" y="-84" text-anchor="middle" dominant-baseline="middle" font-size="14">' + s.icon + "</text>";
    g += '<g transform="rotate(' + (i * step) + ')">' + pic +
      (s.rare ? '<text x="0" y="-26" text-anchor="middle" dominant-baseline="middle" font-size="8">\u2728</text>' : "") +
      '<text transform="translate(0 ' + ly + ') rotate(-90)" x="0" y="0" text-anchor="middle" dominant-baseline="middle" class="wlabel" font-size="9"' +
      (long ? ' textLength="' + lw + '" lengthAdjust="spacingAndGlyphs"' : "") + ">" + esc(s.label) + "</text></g>";
  });
  return '<svg class="wheeldisk" viewBox="-102 -102 204 204" aria-hidden="true"><defs>' +
    '<radialGradient id="wo" cx="0" cy="0" r="100" gradientUnits="userSpaceOnUse"><stop offset="0.2" stop-color="' + SEASON.colors.treat[0] + '"/><stop offset="1" stop-color="' + SEASON.colors.treat[1] + '"/></radialGradient>' +
    '<radialGradient id="wp" cx="0" cy="0" r="100" gradientUnits="userSpaceOnUse"><stop offset="0.2" stop-color="' + SEASON.colors.trick[0] + '"/><stop offset="1" stop-color="' + SEASON.colors.trick[1] + '"/></radialGradient>' +
    '<filter id="wgrain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.22 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>' +
    "</defs>" + g + '<circle r="101" fill="#000" filter="url(#wgrain)" opacity=".9" style="mix-blend-mode:multiply"/></svg>';
}
export function wheelHTML(slices, rotation, extra) {
  const f = SEASON.face || WHEEL_FACE;   // each event's frame can set its own face spot
  return '<div class="wheel' + (extra ? " " + extra : "") + '"><div class="wheelspin" style="left:' + (f.cx * 100) + "%;top:" + (f.cy * 100) + "%;width:" + (f.r * 200) + "%;height:" + (f.r * 200) +
    "%;transform:translate(-50%,-50%) rotate(" + (rotation || 0) + 'deg);">' + wheelSVG(slices) + "</div>" +
    '<img class="wheelframe" src="' + SEASON.frame + '" alt="' + SEASON.wheel + '"></div>';
}
// Rotation (degrees) that lands slice i under the pointer, after several full turns from `from`.
export function spinTo(i, n, from) {
  const step = 360 / n, jitter = (Math.random() - 0.5) * step * 0.7;
  const target = (360 - i * step + jitter) % 360;
  const base = Math.ceil(((from || 0) + 1) / 360) * 360;
  return base + 5 * 360 + target;
}


/* ---------- Ms. Ariana's Candy Bucket ----------
   Finalizing a day in Haunt-O-Ween Mode adds 50 candy for every student who missed 120 XP.
   Students can steal from it on the wheel; the teacher spends it to heal the Ghost-olotl. */
export const BUCKET_PER_MISS = 50;
export function bucketState(cls, students) {
  const earned = Math.max(0, Number(cls && cls.bucketEarned) || 0);
  const spent = Math.max(0, Number(cls && cls.bucketSpent) || 0);
  const stolen = students.reduce((n, s) => n + (Number(s.stolen) || 0), 0);
  return { earned, spent, stolen, left: Math.max(0, earned - spent - stolen), rate: Math.max(1, Number(cls && cls.healRate) || 1) };
}
// The Grinch's Sack (Jingle Jam's bucket). assets/jingle/grinch-sack.webp is used if it's there; otherwise a drawn sack.
export const SACK_IMG = "assets/jingle/grinch-sack.webp";
export function sackHTML(n) {
  const peek = Math.min(5, n > 0 ? Math.max(1, Math.round(n / 150)) : 0);
  const gifts = ["\u{1F381}", "\u{1F381}", "\u2B50", "\u{1F381}", "\u{1F36C}"].slice(0, peek)
    .map((g, i) => '<span class="sgift" style="left:' + [50, 36, 64, 43, 57][i] + "%;top:" + [24, 26, 24, 17, 18][i] + '%">' + g + "</span>").join("");
  return '<div class="basket sack giant" title="' + n.toLocaleString() + ' presents"><span class="candycount">\u{1F381} ' + n.toLocaleString() + "</span>" +
    '<span class="sackbox">' + gifts +
    '<img src="' + SACK_IMG + '" alt="" onerror="this.remove()">' +
    '<svg class="sackdraw" viewBox="0 0 120 120" aria-hidden="true"><defs><radialGradient id="sk" cx="40%" cy="40%" r="70%"><stop offset="0" stop-color="#7CCB5A"/><stop offset="1" stop-color="#2F6B2A"/></radialGradient></defs>' +
    '<path d="M38 34 C20 50 14 78 22 98 C30 114 90 114 98 98 C106 78 100 50 82 34 Z" fill="url(#sk)" stroke="#1C3F1A" stroke-width="3"/>' +
    '<path d="M36 34 Q60 44 84 34 L80 26 Q60 34 40 26 Z" fill="#C8202C" stroke="#7A0F16" stroke-width="2.5"/>' +
    '<path d="M44 60 q6 -4 12 0 M64 60 q6 -4 12 0" stroke="#1C3F1A" stroke-width="3" fill="none" stroke-linecap="round"/>' +
    '<path d="M50 78 q10 -6 20 0" stroke="#1C3F1A" stroke-width="3" fill="none" stroke-linecap="round"/></svg></span></div>';
}
export function bucketHTML(cls, students) {
  const b = bucketState(cls, students);
  return '<div class="bigbucket"><p class="bb-title">' + SEASON.bucket + "</p>" + (SEASON.key === "jingle" ? sackHTML(b.left) : basketHTML(b.left, "giant")) +
    '<p class="bb-sub">+' + BUCKET_PER_MISS + " for every student who misses " + goalXP(cls) + " XP</p></div>";
}

/* ---------- Finalizing a day ----------
   Returns what finalizing day d would do: who missed, who disappears because of it. */
export function finalizePreview(cls, students, d) {
  const rec = recordedDays(cls), withDay = Object.assign({}, cls, { recorded: rec.map((v, i) => v || i === d) });
  const before = Object.assign({}, cls, { recorded: rec.map((v, i) => v && i !== d) });
  const team = students.filter(s => s.companionId);
  const missed = team.filter(s => { const v = arr5(s.status, "")[d]; return v !== "c" && v !== "e"; });
  const died = team.filter(s => simulate(s, before).alive && !simulate(s, withDay).alive);
  // still at full health once this day counts (these are the students to reward)
  const full = team.filter(s => { const x = simulate(s, withDay); return x.alive && x.health >= MAX_HP; });
  return { missed, died, full, candy: eventMode(cls) ? missed.length * BUCKET_PER_MISS : 0 };
}
// Calendar date (YYYY-MM-DD) of weekday d in the current school week.
export function dateOfDay(d) {
  const now = new Date(), wd = now.getDay(), toMon = wd === 0 ? -6 : wd === 6 ? -5 : 1 - wd;   // weekends belong to the week just finished
  const mon = new Date(now.getFullYear(), now.getMonth(), now.getDate() + toMon);
  const x = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + d);
  return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0");
}
