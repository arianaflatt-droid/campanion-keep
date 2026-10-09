import { CREATURE_LAYOUT, CREATURE_FIT_ID } from "./creature-fit.js?v=20261009f";
import { formOf, sparkleImg, azNow, azToday, dayXPs, MAX_LEVEL, BOSS2, BOSS2_LIST } from "./collect.js?v=20261009f";
import { heldWeapon } from "./quest.js?v=20261009f";
// Shared rules + drawing for the teacher console and the student page.
// The code version. Bump it with every update (it matches the ?v= tags). The teacher console saves it on the class;
// any page still running older code (a tab left open all day) reloads itself so everyone plays with the same rules.
export const APP_V = "20261009f";
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
  '<span class="rings">\u{1F6AA} Get to <b>600 XP</b> This Week and Get a <b>Legendary Egg</b>! \u{1F95A}</span>';
export const BANNER = '<div class="hero"><h2>' + BANNER_TEXT + "</h2></div>";
export const HAUNT_BANNER = '<div class="hero haunt"><p class="haunt-tag">\u{1F383} Haunt-O-Ween Mode \u{1F47B}</p><h2>' + BANNER_TEXT +
  '</h2><p class="haunt-sub">Every XP is a piece of candy! Your companion eats the first 120 each day to power its attack \u2014 the rest fills your pumpkin basket.</p></div>';
export const GOBBLE_BANNER = '<div class="hero haunt gobble"><p class="haunt-tag">\u{1F983} Gobble-Palooza \u{1F33D}</p><h2>' + BANNER_TEXT +
  '</h2><p class="haunt-sub">Every XP is a piece of corn! Your companion eats the first 120 each day to power its attack \u2014 the rest fills your cornucopia.</p></div>';
export const JINGLE_BANNER = '<div class="hero haunt jingle"><p class="haunt-tag">\u{1F384} Jingle Jam \u{1F381}</p><h2>' + BANNER_TEXT +
  '</h2><p class="haunt-sub">Every XP is a present! Your companion eats the first 120 each day to power its attack \u2014 the rest piles up under your tree.</p></div>';
// The Weekly Door goal: 600 XP on a normal week; the teacher can set a different number for this week only (short weeks).
export const WEEK_DOOR_XP = 600;
export const weekKey = cls => (cls && cls.weekStart) || dateOfDay(0);
export function weekGoal(cls) { const o = cls && cls.weekGoal; return o && o.week === weekKey(cls) && Number(o.xp) > 0 ? Number(o.xp) : WEEK_DOOR_XP; }
export const FROST_BANNER = '<div class="hero haunt frost"><p class="haunt-tag">\u2744\uFE0F Frostbite Festival \u26C4</p><h2>' + BANNER_TEXT +
  '</h2><p class="haunt-sub">Every 120 XP day packs a snowball for the Snowlotl \u2014 every XP over 120 is a snowflake for your snow globe!</p></div>';
export const HEART_BANNER = '<div class="hero haunt heart"><p class="haunt-tag">\u{1F498} Sweetheart Showdown \u{1F36C}</p><h2>' + BANNER_TEXT +
  '</h2><p class="haunt-sub">Every XP is a candy heart! Your companion eats the first 120 each day to power its attack \u2014 the rest fills your candy jar.</p></div>';
export function bannerFor(cls) {
  const b = isHeart(cls) ? HEART_BANNER : isFrost(cls) ? FROST_BANNER : isJingle(cls) ? JINGLE_BANNER : isGobble(cls) ? GOBBLE_BANNER : isHaunt(cls) ? HAUNT_BANNER : BANNER;
  // The 2nd boss (already beaten once, 2nd-win rewards not given yet): the prize promise (Ms. Ariana can change it: cls.prize2)
  const B = b !== BANNER ? boss2Of(cls) : null;
  if (B && cls[B.defeat] && !cls[B.flag])
    return b.replace("</p></div>", '</p><p class="haunt-sub costume">\u{1F3C6} <b>Defeat the ' + B.boss + " again and you get to " + esc(boss2Prize(cls, B)) + "!</b> " + B.icon + "</p></div>")
      .replace("<b>600 XP</b> This Week", "<b>" + weekGoal(cls).toLocaleString() + " XP</b> This Week");
  return b.replace("<b>600 XP</b> This Week", "<b>" + weekGoal(cls).toLocaleString() + " XP</b> This Week");
}

/* ---------- Haunt-O-Ween Mode ----------
   All normal rules still apply. On top of that, every XP a student earns this week is one piece of candy.
   The basket looks full at CANDY_FULL candy. */
export const CANDY_FULL = 120;
export function isHaunt(cls) { return !!(cls && cls.haunt) && !(cls && cls.gobble) && !(cls && cls.jingle) && !(cls && cls.frost) && !(cls && cls.heart); }
/* ---------- Gobble-Palooza ----------
   Works exactly like Haunt-O-Ween, with corn instead of candy, the Turducken instead of the Ghost-olotl,
   the Pie Wheel and the Gobble-Palooza shop. It uses the same save fields (candyBank, candySpent, spins, ...),
   so only one of the two modes is ever on. Turning it on starts everyone's corn at 0.
   It turns itself on Nov 1 and off after Nov 30 (when the teacher console is opened). */
export const GOBBLE_FROM = "2026-11-01", GOBBLE_TO = "2026-11-30";
export function isGobble(cls) { return !!(cls && cls.gobble) && !(cls && cls.jingle) && !(cls && cls.frost) && !(cls && cls.heart); }
/* ---------- Jingle Jam ----------
   The same again for December: presents under a mini tree, the Grinch-a-Duck, the Present Wheel and the Jingle Shop.
   It turns itself on Dec 1 and off after Dec 31 (when the teacher console is opened). */
export const JINGLE_FROM = "2026-12-01", JINGLE_TO = "2026-12-31";
export function isJingle(cls) { return !!(cls && cls.jingle) && !(cls && cls.frost) && !(cls && cls.heart); }
/* ---------- Frostbite Festival ----------
   January, switched on by hand. The same engine again: snowflakes in a snow globe, the Abominable Snowlotl, the Blizzard
   Wheel and the Snow Shop. Each 120 XP day packs a snowball (an attack); 120 snowflakes pack an extra one. Instead of
   Ms. Ariana's bucket, every student who misses 120 adds a 50 HP snow block to the Snowlotl's wall, and the class has
   to break the wall before it can hurt the Snowlotl again. */
export function isFrost(cls) { return !!(cls && cls.frost) && !(cls && cls.heart); }
/* ---------- Sweetheart Showdown ----------
   February, switched on by hand. Works like Haunt-O-Ween: candy hearts in a candy jar, the Heartbreaker-otl, the Sweetheart
   Spinner and the Sweet Shop. Every student who misses 120 adds 50 hearts to Ms. Ariana's candy jar, and she spends them to
   heal the Heartbreaker-otl. A Chocolate Strawberry doubles the next attack. */
export function isHeart(cls) { return !!(cls && cls.heart); }
// A candy-style event (Haunt-O-Ween, Gobble-Palooza or Jingle Jam) is on: baskets, shop, wheel, bucket and the Battle Area.
export function eventMode(cls) { return isHaunt(cls) || isGobble(cls) || isJingle(cls) || isFrost(cls) || isHeart(cls); }
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
  if (SEASON.key === "frost") return globeHTML(candy, cls);
  if (SEASON.key === "heart") return jarHTML(candy, cls);
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

// Snowflakes swirling inside the snow globe (% of the globe picture), filled from the bottom of the glass upward.
const FLAKE_SLOTS = [
  [30, 62], [50, 64], [70, 62], [38, 54], [62, 54], [24, 48], [50, 48], [76, 48],
  [34, 40], [66, 40], [44, 32], [56, 32], [28, 30], [72, 30], [50, 22], [40, 18]
];
export function globeHTML(n, cls) {
  const f = Math.min(1, n / CANDY_FULL);
  const shown = n > 0 ? Math.max(1, Math.round(f * FLAKE_SLOTS.length)) : 0;
  let c = "";
  for (let i = 0; i < shown; i++) {
    const [x, y] = FLAKE_SLOTS[i];
    c += '<span class="candy flake" style="left:' + x + "%;top:" + y + "%;animation-delay:" + (-(i * 0.7)).toFixed(1) + 's;">\u2744\uFE0F</span>';
  }
  return '<div class="basket globe' + (cls ? " " + cls : "") + (f >= 1 ? " full" : "") + '" title="' + n.toLocaleString() + ' snowflakes">' +
    '<span class="candycount">\u2744\uFE0F ' + n.toLocaleString() + "</span>" +
    '<span class="bk"><img src="assets/frost/snow-globe.webp" alt="">' + c + "</span></div>";
}
// Candy hearts inside the candy jar (% of the jar picture), filled from the bottom of the glass upward.
const HEART_SLOTS = [
  [30, 78], [42, 80], [54, 80], [66, 78], [24, 70], [36, 71], [48, 72], [60, 71], [72, 70],
  [30, 62], [42, 63], [54, 63], [66, 62], [36, 54], [50, 55], [62, 54]
];
const HEART_KINDS = ["\u{1F497}", "\u{1F49C}", "\u{1F49B}", "\u{1F49A}", "\u{1F496}", "\u{1F499}"];
export const JAR_IMG = "assets/heart/candy-jar.webp";
export function jarHTML(n, cls) {
  const f = Math.min(1, n / CANDY_FULL);
  const shown = n > 0 ? Math.max(1, Math.round(f * HEART_SLOTS.length)) : 0;
  let c = "";
  for (let i = 0; i < shown; i++) {
    const [x, y] = HEART_SLOTS[i];
    c += '<span class="candy" style="left:' + x + "%;top:" + y + "%;transform:translate(-50%,-50%) rotate(" + ((i * 41) % 50 - 25) + 'deg);">' + HEART_KINDS[i % HEART_KINDS.length] + "</span>";
  }
  return '<div class="basket jar' + (cls ? " " + cls : "") + (f >= 1 ? " full" : "") + '" title="' + n.toLocaleString() + ' candy hearts">' +
    '<span class="candycount">\u{1F36C} ' + n.toLocaleString() + "</span>" +
    '<span class="bk"><img src="' + JAR_IMG + '" alt="">' + c + "</span></div>";
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
  // Only in December and January (Arizona time): a 5-day streak hat.
  { id: "xmashat", name: "Aurora\u2019s Christmas Hat", glyph: "\u{1F385}", streak: 5, months: [12, 1], img: "assets/gear/aurora-christmas-hat.webp" },
  // A 5-day streak hat, any time of year.
  { id: "hat67", name: "67 Wizard Hat", glyph: "\u{1F9D9}", streak: 5, img: "assets/gear/wizard-67-hat.webp" },
  // Unlocked for good once the class defeats the Abominable Snowlotl for the first time (or bought in the Snow Shop).
  { id: "earmuffs", name: "Cozy Earmuffs", glyph: "\u{1F3A7}", streak: 5, frost: true, img: "assets/gear/earmuffs.webp" },
  // A snack-pack choice unlocked by defeating the Abominable Snowlotl.
  { id: "conesnack", name: "Snow Cone", glyph: "\u{1F367}", streak: 3, frost: true, slot: "snack", img: "assets/gear/snow-cone.webp" },
  // Unlocked for good once the class defeats the Heartbreaker-otl for the first time (or bought in the Sweet Shop).
  { id: "cupidcrown", name: "Cupid Crown", glyph: "\u{1F451}", streak: 5, heart: true, img: "assets/gear/cupid-crown.webp" },
  // A snack-pack choice unlocked by defeating the Heartbreaker-otl.
  { id: "strawsnack", name: "Chocolate Strawberry", glyph: "\u{1F353}", streak: 3, heart: true, slot: "snack", img: "assets/gear/choc-strawberry.webp" },
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
export const SIDEKICKS = { axolotl: "Axolotl", duck: "Duck", ghost: "Ghost-olotl", turkey: "Turducken", grinch: "Grinch-a-Duck", yeti: "Snowlotl", heartotl: "Heartbreaker-otl", ghostsp: "Sparkle Ghost-olotl",
  turkeysp: "Sparkle Turducken", grinchsp: "Sparkle Grinch-a-Duck", yetisp: "Sparkle Snowlotl", heartsp: "Sparkle Heartbreaker-otl" };
// The Ghost-olotl reward: set once the class defeats the first Ghost-olotl. Stays after Haunt-O-Ween ends.
export function ghostUnlocked(cls) { return !!(cls && cls.ghostDefeated); }
export function ghost2Unlocked(cls) { return !!(cls && cls.ghost2Done); }   // the 2nd Ghost-olotl was beaten and its rewards given
// 2nd boss wins (collect.js BOSS2): the entry for the event that's on now, and the prize on its banner
export function boss2Of(cls) { const k = isHeart(cls) ? "heart" : isFrost(cls) ? "frost" : isJingle(cls) ? "jingle" : isGobble(cls) ? "gobble" : isHaunt(cls) ? "haunt" : null; return k ? Object.assign({ key: k }, BOSS2[k]) : null; }
export function boss2Prize(cls, B) { const t = ((cls && cls.prize2) || {})[B.key]; return t && String(t).trim() ? String(t).trim() : B.prize; }
export { BOSS2, BOSS2_LIST };
// The Turducken reward: set once the class defeats the first Turducken. Stays after Gobble-Palooza ends.
export function turkeyUnlocked(cls) { return !!(cls && cls.turkeyDefeated); }
// The Grinch-a-Duck reward: set once the class defeats the first Grinch-a-Duck. Stays after Jingle Jam ends.
export function grinchUnlocked(cls) { return !!(cls && cls.grinchDefeated); }
// The Snowlotl reward: set once the class defeats the first Abominable Snowlotl. Stays after Frostbite Festival ends.
export function yetiUnlocked(cls) { return !!(cls && cls.yetiDefeated); }
// The Heartbreaker-otl reward: set once the class defeats the first Heartbreaker-otl. Stays after Sweetheart Showdown ends.
export function heartUnlocked(cls) { return !!(cls && cls.heartDefeated); }
// Is this gear's boss unlock done (true for normal gear)?
// Gear with months (Aurora's Christmas Hat) only shows up and unlocks in those months (Arizona time).
export function azMonth(date) { return Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Phoenix", month: "numeric" }).format(date || new Date())); }
export function gearInSeason(g, date) { return !g.months || g.months.includes(azMonth(date)); }
export function bossGearOk(g, cls) { return gearInSeason(g) && (!g.ghost || ghostUnlocked(cls)) && (!g.turkey || turkeyUnlocked(cls)) && (!g.jingle || grinchUnlocked(cls)) && (!g.frost || yetiUnlocked(cls)) && (!g.heart || heartUnlocked(cls)); }

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
// The streak of goal days going into this week (from the XP history, before this Monday).
// Excused days under the goal are skipped; days with no upload are skipped.
// After "Start a new week" (often done on the weekend) the cut-off is the Monday that new week starts,
// so last week's days still count toward the streak.
export function weekCut(cls) { return cls && cls.weekStart && cls.weekStart > dateOfDay(0) ? cls.weekStart : dateOfDay(0); }
export function carryRun(st, cls) {
  // A streak saved when the week was cleared (or set by the teacher) for this week wins if it's longer.
  const mon = weekCut(cls), saved = st && st.streakWeek === mon ? Number(st.streakCarry) || 0 : 0;
  return Math.max(saved, histRun(st, cls, mon));
}
function histRun(st, cls, mon) {
  const goal = goalXP(cls), h = (st && st.xpHist) || {};
  let run = 0;
  Object.keys(h).filter(d => d < mon).sort().forEach(date => {
    const x = h[date] || {}, v = Number(x.d != null ? x.d : x.l) || 0;
    if (x.e && v < goal) return;
    if (x.d == null && x.l == null && !x.lh && !x.h) return;   // nothing uploaded that day
    run = v >= goal || x.lh || x.h ? run + 1 : 0;   // h = the teacher marked the day as hit by hand
  });
  return run;
}
export function simulate(st, cls) {
  const status = arr5(st.status, "");
  const items = st.items || [];
  const rec = recordedDays(cls);
  const capesOwned = items.filter(it => it.id === "cape").length;
  let capesUsed = 0;
  let health = MAX_HP, alive = true, missRun = 0, capeReady = false, capeSaved = false;
  // Streaks carry over from earlier weeks: start this week from the run of goal days that ended last week.
  const carry = carryRun(st, cls);
  let hitRun = carry, bestRun = carry, ovMet = 0, ovCounted = 0, daysCounted = 0;

  for (let d = 0; d < 5; d++) {
    // A day counts once it's recorded (end-of-day upload). A day that isn't recorded yet still counts if the student
    // already hit the goal (e.g. a Lunch Hero today): a hit can't turn into a miss, so the streak shows it right away.
    if (!rec[d] && !hitOn(st, d, cls)) continue;
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
  const unlocked = GEAR.filter(g => (bestRun >= g.streak && bossGearOk(g, cls)) || (g.id === "witch" && st.witchHat) || (g.id === "pilgrim" && st.pilgrimHat) || (g.id === "antlers" && st.antlersHat) || (g.id === "earmuffs" && st.earmuffsHat) || (g.id === "cupidcrown" && st.crownHat)).map(g => g.id);
  return {
    health, max: MAX_HP, alive, capeReady, capeSaved, hitRun, bestRun, carry, unlocked,
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
  return ["duck", "ghost", "turkey", "grinch", "yeti", "heartotl", "ghostsp", "turkeysp", "grinchsp", "yetisp", "heartsp"].includes(st.sidekick) ? st.sidekick : "axolotl";
}

/* ---------- art ----------
   Sidekick pictures live in assets/. Swap the PNGs to change the art (keep the file names). */
export const SIDEKICK_ART = { axolotl: "assets/axolotl.png", duck: "assets/duck.png", ghost: "assets/ghost-pet.png", turkey: "assets/gobble/turducken-sidekick.webp", grinch: "assets/jingle/grinchaduck-sidekick.webp", yeti: "assets/frost/snowlotl-sidekick.webp", heartotl: "assets/heart/heartbreaker-sidekick.webp", ghostsp: "assets/ghost-pet-sparkle.png",
  turkeysp: "assets/gobble/turkeysp.webp", grinchsp: "assets/jingle/grinchsp.webp", yetisp: "assets/frost/yetisp.webp", heartsp: "assets/heart/heartsp.webp" };
export function sidekickSVG(kind, big) {
  const k = SIDEKICK_ART[kind] ? kind : "axolotl";
  return '<img class="side ' + k + (big ? " big" : "") + '" src="' + SIDEKICK_ART[k] + '" alt="' + SIDEKICKS[k] + ' sidekick">';
}

// Hats sit on the head (anchored at their bottom-centre); shades centre on the eyes.
const HAT_SCALE = { cap: 1, hat: 1.05, crown: 0.95, witch: 1.25, pilgrim: 1.2, antlers: 1.35, xmashat: 1.35, hat67: 1.3, earmuffs: 1.25, cupidcrown: 1.2 };
// How far up each hat is lifted from its anchor point (the cap emoji has empty space under its brim, so it sits lower).
const HAT_LIFT = { cap: 72, hat: 88, crown: 88, witch: 88, pilgrim: 88, antlers: 70, xmashat: 78, hat67: 76, earmuffs: 45, cupidcrown: 80 };
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
  "L-30": { hat: [0.86, 0.36, 0.24, 4], cap: [0.86, 0.39, 0.26, 4], eyes: [0.88, 0.53, 0.22, 0], snack: [1.1, 0.95] },   // Jinglotl
  "S-36": { hat: [0.87, 0.35, 0.24, 10], cap: [0.87, 0.38, 0.26, 10], eyes: [0.9, 0.41, 0.2, 8], snack: [1.1, 0.95] },      // Jett
  "L-31": { hat: [0.62, 0.12, 0.3, 0], cap: [0.62, 0.16, 0.32, 0], eyes: [0.66, 0.3, 0.24, 0], snack: [1.1, 0.95] },        // Cluckledill
  "L-38": { hat: [0.68, 0.1, 0.26, 8], cap: [0.68, 0.13, 0.28, 8], eyes: [0.66, 0.34, 0.22, 0], snack: [1.1, 0.95] },      // Snowmorrow
  "L-39": { hat: [0.6, 0.2, 0.24, 8], cap: [0.6, 0.23, 0.26, 8], eyes: [0.62, 0.3, 0.2, 0], snack: [1.1, 0.95] },        // Amorduck
  "L-40": { hat: [0.64, 0.24, 0.26, 8], cap: [0.64, 0.27, 0.28, 8], eyes: [0.66, 0.35, 0.22, 0], snack: [1.1, 0.95] },      // Candivora
  "L-37": { hat: [0.86, 0.14, 0.24, 8], cap: [0.86, 0.17, 0.26, 8], eyes: [0.86, 0.26, 0.2, 0], snack: [1.1, 0.95] },      // Midniduck
  "L-36": { hat: [0.72, 0.1, 0.28, 10], cap: [0.72, 0.13, 0.3, 10], eyes: [0.7, 0.3, 0.24, 0], snack: [1.1, 0.95] },      // Gingermischief
  "L-35": { hat: [0.86, 0.22, 0.26, 6], cap: [0.86, 0.25, 0.28, 6], eyes: [0.9, 0.38, 0.22, 0], snack: [1.1, 0.95] },      // Cornucopia
  "L-34": { hat: [0.94, 0.24, 0.26, 8], cap: [0.94, 0.27, 0.28, 8], eyes: [1.0, 0.35, 0.22, 0], snack: [1.1, 0.95] },      // Voidwhisker
  "L-33": { hat: [0.71, 0.2, 0.3, 4], cap: [0.71, 0.24, 0.32, 4], eyes: [0.74, 0.41, 0.26, 0], snack: [1.1, 0.95] },      // Brewraith
  "S-37": { hat: [0.83, 0.2, 0.26, 8], cap: [0.83, 0.24, 0.28, 8], eyes: [0.86, 0.35, 0.2, 6], snack: [1.1, 0.95] }       // Cinnamon
};
// The student's starter creature (picked in the Creature Collector). It's their companion until they pick a
// Legendary or a level 100 creature; the old basic companions (fox, otter...) are only used before a starter is picked.
export function starterFam(st) {
  const coll = (st && st.coll) || {};
  if (st && st.starter && coll[st.starter]) return st.starter;
  const s0 = ["C-01", "C-02", "C-03"].find(f => coll[f]); if (s0) return s0;
  return Object.keys(coll).sort((a, b) => String(coll[a].at || "").localeCompare(String(coll[b].at || "")))[0] || null;
}
export function creatureCompanion(st, fam) {
  const e = ((st && st.coll) || {})[fam];
  if (!e) return null;
  const c = formOf(fam, e.lvl || 1); if (!c) return null;
  if ((Number(e.lvl) || 1) < PET_LEVEL && !c.event && c.rarity !== "Legendary" && fam !== starterFam(st)) return null;   // every Legendary (and the starter) can be a companion right away
  const img = e.sparkle ? sparkleImg(c) : c.img, L = CREATURE_LAYOUT[c.id];
  // The picture is sized from its outline so the creature fills the box (wide ones spill out to the sides) and stands on the ground
  const glyph = L ? '<span class="crbox"><img class="crpet crfit" src="' + img + '" alt="" style="left:' + L[0] + "em;top:" + L[1] + "em;width:" + L[2] + "em;height:" + L[2] + 'em"></span>'
    : '<img class="crpet" src="' + img + '" alt="">';
  return { id: "cr:" + fam, fam, name: c.name, creature: true, sparkle: !!e.sparkle, glyph,
    fit: CREATURE_FIT_ID[c.id] || CREATURE_FIT[fam] || { hat: [0.62, 0.1, 0.42, 0], eyes: [0.64, 0.34, 0.3, 0], snack: [1.1, 0.86] } };
}
/* ---------- Companion level bar ----------
   Every day a student hits the goal (and their companion is still around) fills one of 5 spots on their current
   companion's level bar. A full bar = +1 real level: a creature companion goes up a level in the collection (stronger
   in battles, up to level 100); the starter companion has its own level (starterLvl).
   compStart = the first day that counts (the day this started), compThru = the last day already counted,
   compBar = { fam or "starter": spots filled }. */
export const COMP_DAYS = 5;
export function compKey(st) { const c = companionOf(st); return c && c.creature ? c.fam : "starter"; }
export function compLevel(st) { const k = compKey(st); return k === "starter" ? Math.max(1, Number(st.starterLvl) || 1) : Math.max(1, Number((((st.coll || {})[k]) || {}).lvl) || 1); }
// a starter creature also gets any progress from before (when the bar was on the basic companion, key "starter")
const barOf = (st, k) => (Number(((st && st.compBar) || {})[k]) || 0) + (k !== "starter" && k === starterFam(st) ? Number(((st && st.compBar) || {}).starter) || 0 : 0);
export function compFill(st) { return Math.max(0, Math.min(COMP_DAYS - 1, barOf(st, compKey(st)))); }
// The save changes to make (or null): counts any new goal days onto the current companion's bar.
export function creditCompanion(st, cls, sim) {
  const today = azToday();
  if (!st.compStart) return { compStart: today, compThru: "" };
  const goal = goalXP(cls), thru = st.compThru || "";
  const days = dayXPs(st, cls).filter(d => d.date >= st.compStart && d.date > thru && d.date <= today && d.xp >= goal);
  if (!days.length) return null;
  const k = compKey(st), bar = Object.assign({}, st.compBar || {}), data = { compThru: days[days.length - 1].date };
  if (sim && !sim.alive) return data;   // a companion that disappeared doesn't fill its bar
  let n = barOf(st, k) + days.length, ups = 0;
  if (k !== "starter" && k === starterFam(st)) delete bar.starter;
  while (n >= COMP_DAYS) { n -= COMP_DAYS; ups++; }
  if (ups && k === "starter") data.starterLvl = Math.max(1, Number(st.starterLvl) || 1) + ups;
  else if (ups) {
    const coll = Object.assign({}, st.coll || {}), e = Object.assign({}, coll[k] || {}), lvl = Math.max(1, Number(e.lvl) || 1);
    if (lvl >= MAX_LEVEL) n = COMP_DAYS - 1;   // already level 100: the bar just stays full
    else { e.lvl = Math.min(MAX_LEVEL, lvl + ups); coll[k] = e; data.coll = coll; }
  }
  bar[k] = n; data.compBar = bar; data.compUps = ups;
  return data;
}
export function petCreatures(st) { return Object.keys((st && st.coll) || {}).map(f => creatureCompanion(st, f)).filter(Boolean); }
export function companionOf(st) {
  if (st && st.petCreature) { const c = creatureCompanion(st, st.petCreature); if (c) return c; }
  const sf = starterFam(st); if (sf) { const c = creatureCompanion(st, sf); if (c) return c; }   // the starter creature replaces the basic companion
  return byId(ROSTER, st && st.companionId);
}
// The badge a student pinned (top-right corner of their tile on The Keep). Badge art is assets/badges/<id>.webp.
export function pinnedBadgeHTML(st, cls) {
  const id = st && st.pinnedBadge;
  if (!id || !(st.badges || {})[id]) return "";
  return '<img class="pinbadge' + (cls ? " " + cls : "") + '" src="assets/badges/' + esc(id) + '.webp" alt="" title="Pinned badge" onerror="this.remove()">';
}
// Potion Brewing Teams: the companion glows the color of today's potion.
export function potionFx(st) { const d = ((st && st.potionDays) || {})[azToday()]; return d && d.fx ? " pfx pfx-" + String(d.fx).replace(/[^a-z]/g, "") : ""; }
export function petHTML(c, worn, held) {
  return '<span class="petwrap"><span class="tglyph">' + (c.creature ? c.glyph : emojiImg("pet-" + c.id)) + "</span>" +
    (worn ? '<span class="gear" style="' + gearStyle(c, worn) + '">' + itemArt(worn, "gimg") + "</span>" : "") +
    (held ? '<span class="held held-' + held.n + '"><img src="' + held.img + '" alt="' + esc(held.name) + '"></span>' : "") + "</span>";
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
    '<div class="stage' + potionFx(st) + '" aria-hidden="true">' + petHTML(c, worn, heldWeapon(st)) + (side ? sidekickSVG(side) : "") + "</div>" +
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
  const max = Math.max(1, Number(cls && cls.bossHP) || BOSS_START_HP);
  const dmg = baseDamage(cls);
  const total = students.reduce((n, s) => n + dmgOf(s, cls), 0);
  const totalHits = students.reduce((n, s) => n + (Number(s.attackTotal) || 0), 0);
  const dealt = Math.max(0, total - (Number(cls && cls.bossBase) || 0));
  const hits = Math.max(0, totalHits - (Number(cls && cls.bossBaseHits) || 0));
  const healed = Math.max(0, Number(cls && cls.bossHealed) || 0);
  // Frostbite Festival: the snow wall soaks up damage first (see wallState).
  const w = isFrost(cls) ? wallState(cls, dealt) : null, hurt = w ? Math.max(0, dealt - w.absorbed) : dealt;
  const left = Math.max(0, Math.min(max, max - hurt + healed));
  return { max, dmg, hits, dealt, healed, left, pct: left / max * 100, defeated: left <= 0, total, totalHits, wall: w };
}
/* The Snowlotl's snow wall. bucketEarned = all the wall ever built (50 per miss). Whenever the wall grows or shrinks the
   console saves a mark: wallMark = damage dealt at that moment, wallAt = wall built at that moment, wallAbs = wall already
   knocked down before the mark. Damage dealt after the mark knocks down what's left of the wall first. */
export const WALL_BLOCK = 50;
export const BOSS_START_HP = 12000;   // every event boss starts with this much health
export function wallState(cls, dealt) {
  const built = Math.max(0, Number(cls && cls.bucketEarned) || 0);
  const at = cls && cls.wallAt != null ? Math.max(0, Number(cls.wallAt) || 0) : built, abs0 = Math.max(0, Number(cls && cls.wallAbs) || 0);
  const mark = cls && cls.wallMark != null ? Number(cls.wallMark) || 0 : dealt;
  const since = Math.max(0, dealt - mark), standing = Math.max(0, at - abs0), hit = Math.min(standing, since);
  const left = standing - hit;
  return { built, left, absorbed: abs0 + hit, blocks: Math.ceil(left / WALL_BLOCK) };
}
// The new wall marks to save when the wall built total changes to newBuilt (finalizing / un-finalizing a day).
export function wallMarks(cls, students, newBuilt) {
  const b = bossState(cls, students), w = b.wall || wallState(cls, b.dealt);
  return { wallMark: b.dealt, wallAt: Math.max(0, newBuilt), wallAbs: Math.min(w.absorbed, Math.max(0, newBuilt)) };
}
export function wallHTML(w, big) {
  if (!w || w.left <= 0) return "";
  const n = Math.min(big ? 24 : 12, w.blocks), per = big ? 8 : 6;
  let rows = "";
  for (let r = 0; r * per < n; r++) {
    const k = Math.min(per, n - r * per);
    rows += '<div class="wrow" style="margin-left:' + (r % 2 ? 26 : 0) + 'px">' + '<img src="assets/frost/snow-block.webp" alt="">'.repeat(k) + "</div>";
  }
  return '<div class="snowwall' + (big ? " big" : "") + '" title="Snow wall: ' + w.left + ' HP"><div class="wstack">' + rows + '</div><span class="wlabel2">\u{1F9CA} Snow wall: <b>' + w.left.toLocaleString() + "</b> HP</span></div>";
}
// What this student's next attack does, and what it uses up.
export function nextAttack(st, cls) {
  const days = attacksReady(st, cls), extra = Math.max(0, Number(st.extraAttacks) || 0), brews = Math.max(0, Number(st.brews) || 0);
  const hat = !!st[seasonOf(cls).hatFlag], brew = brews > 0;
  return { count: days.length + extra, day: days.length ? days[0] : null, useExtra: !days.length && extra > 0,
    hat, brew, damage: baseDamage(cls) + (hat ? HAT_BONUS : 0) + (brew ? (isFrost(cls) || isHeart(cls) ? baseDamage(cls) : BREW_BONUS) : 0) };
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
    (fx && fx.heal ? '<span class="dmg heal">+' + fx.heal + "</span>" : "") + (b.wall ? wallHTML(b.wall, true) : "") + "</div>" +
    teamHTML(cls, students, fx && fx.hit) + (b.wall ? "" : bucketHTML(cls, students)) +
    (b.defeated ? '<p class="arena-win">\u{1F389} The ' + S.boss + ' has been defeated! \u{1F389}</p>' : "") +
    '<div class="arena-row"><span class="arena-k">Attacked this week</span><div class="arena-pets">' +
    (attackedToday.length ? attackedToday.map(s => { const c = companionOf(s); return '<span class="ap" title="' + esc(s.name) + "\u2019s " + esc(s.petName || c.name) + '">' + c.glyph + "<small>" + esc(s.name) + "</small></span>"; }).join("") : '<span class="arena-none">No attacks yet this week</span>') +
    "</div></div>" +
    '<div class="arena-row"><span class="arena-k">Ready to attack</span><div class="arena-pets">' +
    (ready.length ? ready.map(s => { const c = companionOf(s); return '<span class="ap ready" title="' + esc(s.name) + "\u2019s " + esc(s.petName || c.name) + '">' + c.glyph + "<small>" + esc(s.name) + "</small></span>"; }).join("") : '<span class="arena-none">Hit 120 XP to earn an attack</span>') +
    "</div></div>" +
    '<p class="arena-foot">' + b.hits.toLocaleString() + " attack" + (b.hits === 1 ? "" : "s") + " landed \u00b7 " + b.dealt.toLocaleString() + " damage dealt" + (b.wall && b.wall.absorbed ? " \u00b7 " + b.wall.absorbed.toLocaleString() + " soaked up by the snow wall" : "") + (b.healed ? " \u00b7 " + b.healed.toLocaleString() + " healed by Ms. Ariana" : "") + "</p></div>";
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
// Frostbite Festival Snow Shop. Keep prices in step with price() in firestore.rules.
export const FROST_STORE = [
  { id: "spin",     name: "Blizzard Wheel",  glyph: "\u{1F3A1}", cost: 60,  desc: "One spin on the Blizzard Wheel. Spins are saved until you use them!" },
  { id: "earmuffs", name: "Cozy Earmuffs",   img: "assets/gear/earmuffs.webp", cost: 600, once: true, desc: "Your companion wears them and every snowball does +5 damage." },
  { id: "cocoa",    name: "Hot Cocoa",       img: "assets/gear/hot-cocoa.webp", cost: 60,  desc: "Your next snowball does DOUBLE damage. Used up after one throw." },
  { id: "snowball", name: "Pack a Snowball", glyph: "\u26C4", cost: 120, desc: "One extra snowball to throw at the Abominable Snowlotl, any day." }
];
// Sweetheart Showdown Sweet Shop. Keep prices in step with price() in firestore.rules.
export const HEART_STORE = [
  { id: "spin",       name: "Sweetheart Spinner",   glyph: "\u{1F3A1}", cost: 60,  desc: "One spin on the Sweetheart Spinner. Spins are saved until you use them!" },
  { id: "cupidcrown", name: "Cupid Crown",          img: "assets/gear/cupid-crown.webp", cost: 600, once: true, desc: "Your companion wears it and every attack does +5 damage." },
  { id: "strawberry", name: "Chocolate Strawberry", img: "assets/gear/choc-strawberry.webp", cost: 60,  desc: "Your next attack does DOUBLE damage. Used up after one attack." },
  { id: "attack",     name: "Attack the Heartbreaker-otl", glyph: "\u2694\uFE0F", cost: 120, desc: "One extra attack on the Heartbreaker-otl, any day." }
];
export function candySpent(st) { return Math.max(0, Number(st.candySpent) || 0); }
export function candyLeft(st) { return Math.max(0, candyOf(st) - candySpent(st)); }
export function ownsItem(st, id) { return id === "witchhat" ? !!st.witchHat : id === "pilgrimhat" ? !!st.pilgrimHat : id === "antlers" ? !!st.antlersHat : id === "earmuffs" ? !!st.earmuffsHat : id === "cupidcrown" ? !!st.crownHat : ownedCount(st, id) > 0; }
export function ownedCount(st, id) { return (st.purchases || []).filter(p => p.id === id).length; }
export function storeArt(it, cls) { return it.img ? '<img class="' + (cls || "") + '" src="' + it.img + '" alt="">' : it.glyph; }

/* ---------- Trick or Treat Wheel ----------
   The frame, stand, pointer and centre swirl come from assets/wheel/wheel-frame.png.
   The slices are drawn here and spin underneath it. Edit WHEEL to change the prizes. */
// Orange = treats, purple = tricks (they alternate around the wheel). Rare slices land 5% of the time;
// the other six share the rest equally (15% each).
export const PRIZE_SLICE_CHANCE = 0.02;   // the "Prize!" slice on every event wheel (other rare slices stay at RARE_CHANCE)
export const WHEEL = [
  { id: "candy75", label: "75 Candy",       icon: "\u{1F36C}", kind: "treat" },
  { id: "steal",   label: "Steal Candy",    icon: "\u{1F9B9}", kind: "trick", note: "Steal 25\u201350 of Ms. Ariana\u2019s candy!" },
  { id: "reroll",  label: "Reroll",         icon: "\u{1F504}", kind: "treat", note: "Spin again for free!" },
  { id: "nothing", label: "Nothing",        icon: "\u{1F47B}", kind: "trick", note: "Nothing happens\u2026 boo!" },
  { id: "candy75", label: "75 Candy",       icon: "\u{1F36D}", kind: "treat" },
  { id: "nothing", label: "Nothing",        icon: "\u{1F987}", kind: "trick", note: "Nothing happens\u2026 boo!" },
  { id: "prize",   label: "Prize!",         icon: "\u{1F381}", kind: "treat", rare: true, chance: PRIZE_SLICE_CHANCE, note: "You won a prize! Ms. Ariana has been told." },
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
  { id: "prize",   label: "Prize!",      icon: "\u{1F381}", kind: "treat", rare: true, chance: PRIZE_SLICE_CHANCE, note: "You won a prize! Ms. Ariana has been told." },
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
  { id: "prize",   label: "Prize!",      icon: "\u{1F31F}", kind: "treat", rare: true, chance: PRIZE_SLICE_CHANCE, note: "You won a prize! Ms. Ariana has been told." },
  { id: "attack",  label: "Free Attack", icon: "\u2694\uFE0F", kind: "trick", rare: true, note: "A free attack on the Grinch-a-Duck!" }
];

// Blizzard Wheel: ice-blue slices are treats, purple slices are tricks. Same slice ids as the other wheels.
export const BLIZZARD_WHEEL = [
  { id: "candy75", label: "75 Snowflakes", icon: "\u2744\uFE0F", kind: "treat" },
  { id: "steal",   label: "Snow Grab",     icon: "\u{1F9E4}", kind: "trick", note: "Scoop up 25\u201350 snowflakes!" },
  { id: "reroll",  label: "Reroll",        icon: "\u{1F504}", kind: "treat", note: "Spin again for free!" },
  { id: "nothing", label: "Brrr!",         icon: "\u{1F976}", kind: "trick", note: "Brrr! Too cold \u2014 nothing happens!" },
  { id: "candy75", label: "75 Snowflakes", icon: "\u2744\uFE0F", kind: "treat" },
  { id: "nothing", label: "Brrr!",         icon: "\u{1F32C}\uFE0F", kind: "trick", note: "A blast of wind\u2026 nothing happens!" },
  { id: "prize",   label: "Prize!",        icon: "\u{1F31F}", kind: "treat", rare: true, chance: PRIZE_SLICE_CHANCE, note: "You won a prize! Ms. Ariana has been told." },
  { id: "attack",  label: "Free Snowball", icon: "\u26C4", kind: "trick", rare: true, note: "A free snowball at the Snowlotl!" }
];

// Sweetheart Spinner: pink slices are treats, red slices are tricks. Same slice ids as the other wheels.
export const SWEET_WHEEL = [
  { id: "candy75", label: "75 Hearts",    icon: "\u{1F36C}", kind: "treat" },
  { id: "steal",   label: "Steal Hearts", icon: "\u{1F498}", kind: "trick", note: "Sneak 25\u201350 hearts out of Ms. Ariana\u2019s candy jar!" },
  { id: "reroll",  label: "Reroll",       icon: "\u{1F504}", kind: "treat", note: "Spin again for free!" },
  { id: "nothing", label: "Heartbreak",   icon: "\u{1F494}", kind: "trick", note: "Heartbreak\u2026 nothing happens!" },
  { id: "candy75", label: "75 Hearts",    icon: "\u{1F497}", kind: "treat" },
  { id: "nothing", label: "Heartbreak",   icon: "\u{1F494}", kind: "trick", note: "Heartbreak\u2026 nothing happens!" },
  { id: "prize",   label: "Prize!",       icon: "\u{1F31F}", kind: "treat", rare: true, chance: PRIZE_SLICE_CHANCE, note: "You won a prize! Ms. Ariana has been told." },
  { id: "attack",  label: "Free Attack",  icon: "\u2694\uFE0F", kind: "trick", rare: true, note: "A free attack on the Heartbreaker-otl!" }
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
// Frostbite Festival Prize Wheel. Chances: 4 prizes at 9.5%, 2 rares at 1%, two 100 XP slices at 30%.
export const FROST_PRIZES = [
  { name: "Snowflake Straw Toppers", short: "Straw Toppers", icon: "\u2744\uFE0F", img: "assets/prizes/ff-straw.png", link: "https://a.co/d/09H1ndrI", kind: "treat" },
  { name: "100 XP", icon: "\u2B50", img: "", link: "", kind: "trick", xp: 100, chance: 0.30 },
  { name: "Snowman Squishies", short: "Squishies", icon: "\u26C4", img: "assets/prizes/ff-squishy.png", link: "https://a.co/d/087yuQNo", kind: "treat" },
  { name: "Gingerbread Duck", short: "Ginger Duck", icon: "\u{1F986}", img: "assets/prizes/ff-duck.png", link: "https://a.co/d/06R1AcEf", kind: "trick", rare: true, chance: 0.01 },
  { name: "Snowman Face Stickers", short: "Stickers", icon: "\u26C4", img: "assets/prizes/ff-stickers.png", link: "https://a.co/d/0eU4hx0s", kind: "treat" },
  { name: "100 XP", icon: "\u2B50", img: "", link: "", kind: "trick", xp: 100, chance: 0.30 },
  { name: "Silly Fuzzy Socks", short: "Fuzzy Socks", icon: "\u{1F9E6}", img: "assets/prizes/ff-socks.png", link: "https://a.co/d/01KhCCBe", kind: "treat" },
  { name: "Aurora Lamp", icon: "\u{1F4A1}", img: "assets/prizes/ff-lamp.png", link: "https://a.co/d/00xiGeeE", kind: "trick", rare: true, chance: 0.01 }
];
// Sweetheart Showdown Prize Wheel. Chances: 4 prizes at 9.5%, 2 rares at 1%, two 100 XP slices at 30%.
export const HEART_PRIZES = [
  { name: "Avocado Sticker", short: "Avocado", icon: "\u{1F951}", img: "assets/prizes/ss-stickers.png", link: "https://a.co/d/01CtVuP0", kind: "treat" },
  { name: "100 XP", icon: "\u2B50", img: "", link: "", kind: "trick", xp: 100, chance: 0.30 },
  { name: "Chocolate Squishy", short: "Squishy", icon: "\u{1F36B}", img: "assets/prizes/ss-squishy.png", link: "https://a.co/d/03aV1XvY", kind: "treat" },
  { name: "Valentine Duck", short: "Heart Duck", icon: "\u{1F986}", img: "assets/prizes/ss-duck.png", link: "https://a.co/d/0goRp4kD", kind: "trick", rare: true, chance: 0.01 },
  { name: "Valentine Straw Toppers", short: "Straw Toppers", icon: "\u{1F498}", img: "assets/prizes/ss-straw.png", link: "https://a.co/d/0gFYcTir", kind: "treat" },
  { name: "100 XP", icon: "\u2B50", img: "", link: "", kind: "trick", xp: 100, chance: 0.30 },
  { name: "Rainbow Heart Glasses", short: "Heart Glasses", icon: "\u{1F576}\uFE0F", img: "assets/prizes/ss-glasses.png", link: "https://a.co/d/07OuLYJK", kind: "treat" },
  { name: "Light-Up Heart Cup", short: "Heart Cup", icon: "\u{1F964}", img: "assets/prizes/ss-cup.png", link: "https://a.co/d/09PUeJjI", kind: "trick", rare: true, chance: 0.01 }
];
export const PRIZES = [
  { name: "Ghost Sticker", short: "Ghost Sticker", icon: "\u{1F47B}", img: "assets/prizes/prize-1.png", link: "https://a.co/d/0bfdSD1g", kind: "treat" },
  { name: "100 XP", icon: "\u2B50", img: "", link: "", kind: "trick", xp: 100, chance: 0.30 },
  { name: "Ghost Straw Toppers", short: "Straw Ghosts", icon: "\u{1F47B}", img: "assets/prizes/prize-2.png", link: "https://a.co/d/01HySKGX", kind: "treat" },
  { name: "Ghost Glass Cup", short: "Ghost Cup", icon: "\u{1F964}", img: "assets/prizes/prize-ghostcup.png", link: "https://a.co/d/08GLsFV6", kind: "trick", rare: true, chance: 0.01 },
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
    brewItem: "cocoa", brewName: "Hot Cocoa", brewNames: "Hot Cocoas", brewIcon: "\u2615", store: JINGLE_STORE, slices: PRESENT_WHEEL, prizes: JINGLE_PRIZES },
  frost: { key: "frost", name: "Frostbite Festival", icon: "\u2744\uFE0F", cur: "snowflakes", Cur: "Snowflakes", coin: "\u2744\uFE0F", basket: "snow globe",
    boss: "Abominable Snowlotl", bossImg: "assets/frost/snowlotl.webp", bossIcon: "\u26C4", defeatFlag: "yetiDefeated",
    wheel: "Blizzard Wheel", wheelIcon: "\u{1F3A1}", frame: "assets/frost/blizzard-wheel-frame.webp", face: { cx: 0.5, cy: 0.485, r: 0.394 },
    treat: "\u{1F535} Ice blue = treats", trick: "\u{1F7E3} purple = tricks",
    colors: { treat: ["#8FD3FF", "#3B8FD9"], trick: ["#9B7BFF", "#5A3DC4"] },
    shop: "Snow Shop", bucket: "The Snowlotl\u2019s Snow Wall", hatItem: "earmuffs", hatFlag: "earmuffsHat", hatGear: "earmuffs", hatName: "Cozy Earmuffs", hatIcon: "\u{1F3A7}",
    brewItem: "cocoa", brewName: "Hot Cocoa", brewNames: "Hot Cocoas", brewIcon: "\u2615", store: FROST_STORE, slices: BLIZZARD_WHEEL, prizes: FROST_PRIZES,
    attackWord: "Throw a snowball", hitWord: "snowball", wall: true, arena: "assets/frost/frost-arena.webp", doubleBrew: true },
  heart: { key: "heart", name: "Sweetheart Showdown", icon: "\u{1F498}", cur: "hearts", Cur: "Hearts", coin: "\u{1F36C}", basket: "candy jar",
    boss: "Heartbreaker-otl", bossImg: "assets/heart/heartbreaker.webp", bossIcon: "\u{1F494}", defeatFlag: "heartDefeated",
    wheel: "Sweetheart Spinner", wheelIcon: "\u{1F3A1}", frame: "assets/heart/sweetheart-wheel-frame.webp", face: { cx: 0.5, cy: 0.487, r: 0.343 },
    treat: "\u{1FA77} Pink = treats", trick: "\u2764\uFE0F red = tricks",
    colors: { treat: ["#FFB3CF", "#F06A9B"], trick: ["#E0344E", "#9E1230"] },
    shop: "Sweet Shop", bucket: "Ms. Ariana\u2019s Candy Jar", hatItem: "cupidcrown", hatFlag: "crownHat", hatGear: "cupidcrown", hatName: "Cupid Crown", hatIcon: "\u{1F451}",
    brewItem: "strawberry", brewName: "Chocolate Strawberry", brewNames: "Chocolate Strawberries", brewIcon: "\u{1F353}", store: HEART_STORE, slices: SWEET_WHEEL, prizes: HEART_PRIZES,
    arena: "assets/heart/heart-arena.webp", doubleBrew: true }
};
export function seasonOf(cls) { return isHeart(cls) ? SEASONS.heart : isFrost(cls) ? SEASONS.frost : isJingle(cls) ? SEASONS.jingle : isGobble(cls) ? SEASONS.gobble : SEASONS.haunt; }
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
  if (isFrost(cls)) {   // Frostbite Festival: the Snowlotl's snow wall instead of a bucket
    const w = bossState(cls, students).wall;
    return '<div class="bigbucket"><p class="bb-title">' + SEASON.bucket + "</p>" + (w && w.left > 0 ? wallHTML(w, true) : '<p class="bb-sub" style="font-size:15px;">\u2705 No wall right now \u2014 every snowball hits the Snowlotl!</p>') +
      '<p class="bb-sub">+' + WALL_BLOCK + " HP of wall for every student who misses " + goalXP(cls) + " XP \u00b7 break it to hurt the Snowlotl</p></div>";
  }
  const b = bucketState(cls, students);
  return '<div class="bigbucket"><p class="bb-title">' + SEASON.bucket + "</p>" + (SEASON.key === "jingle" ? sackHTML(b.left) : SEASON.key === "heart" ? jarHTML(b.left, "giant") : basketHTML(b.left, "giant")) +
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

/* ---------- Save check ----------
   Firebase's save rules (firestore.rules) are strict about what a student's save looks like. These copy the
   rules' checks so we can say WHY a save was refused, and find (and repair) student data the rules can't read. */
const NUM_FIELDS = ["attackTotal", "dmgTotal", "extraAttacks", "brews", "spins", "candySpent", "candyBank", "candyBonus", "stolen", "doorXP", "doorEggs",
  "pullsUsed", "legendaryUsed", "legendaryPulls", "xpSpent", "xpReleased", "turkeyAtk", "grinchAtk", "yetiAtk", "heartAtk", "xpPrize", "cpSpent", "cpEarned"];
const LIST5 = { attacks: v => v === true || v === false, status: v => typeof v === "string", xp: v => v === null || typeof v === "number",
  lunchXp: v => v === null || typeof v === "number", early: v => v === true || v === false };
// Problems in one student's saved data, and the fixed values (only what needs changing).
export function saveProblems(s, cls) {
  const out = [], fix = {};
  NUM_FIELDS.forEach(k => { if (k in s && typeof s[k] !== "number") { out.push(k + " is " + JSON.stringify(s[k]) + " (should be a number)"); fix[k] = s[k] != null && !isNaN(Number(s[k])) ? Math.max(0, Math.round(Number(s[k]))) : k === "dmgTotal" ? (Number(s.attackTotal) || 0) * baseDamage(cls) : 0; } });
  Object.entries(LIST5).forEach(([k, ok]) => {
    if (!(k in s)) return;
    const v = s[k], fill = k === "status" ? "" : k === "xp" || k === "lunchXp" ? null : false;
    if (!Array.isArray(v) || v.length !== 5 || !v.every(ok)) {
      out.push(k + " is " + JSON.stringify(v));
      fix[k] = [0, 1, 2, 3, 4].map(i => { const x = Array.isArray(v) ? v[i] : undefined; return ok(x) ? x : k === "xp" || k === "lunchXp" ? (x == null || isNaN(Number(x)) ? null : Number(x)) : k === "status" ? (x ? String(x) : "") : !!x; });
      fix[k] = fix[k].map(x => (x === undefined ? fill : x));
    }
  });
  ["purchases", "spinLog", "themeEggs", "goalEggs", "ideas", "roomBuys"].forEach(k => { if (k in s && !Array.isArray(s[k])) { out.push(k + " is not a list"); fix[k] = []; } });
  return { problems: out, fix };
}
// Why Firebase would refuse this attack save (empty = it should be allowed). Mirrors studentAttack() in firestore.rules.
export function attackRefusal(s, data, cls) {
  const was = (k, d) => (k in s ? s[k] : d), now = (k, d) => (k in data ? data[k] : was(k, d)), eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const why = [], sn = seasonOf(cls).key, F5 = [false, false, false, false, false], dmg = Number(cls && cls.bossDmg) || 50;
  if (!eventMode(cls)) why.push("no event mode is on");
  const allowed = ["attacks", "attackTotal", "dmgTotal", "extraAttacks", "brews", "turkeyAtk", "grinchAtk", "yetiAtk", "heartAtk"];
  Object.keys(data).forEach(k => { if (!allowed.includes(k) && !eq(data[k], s[k])) why.push("the save changes " + k); });
  [["gobble", "turkeyAtk"], ["jingle", "grinchAtk"], ["frost", "yetiAtk"], ["heart", "heartAtk"]].forEach(([k, f]) => {
    if (sn === k ? now(f, 0) !== was(f, 0) + 1 : !eq(now(f, 0), was(f, 0))) why.push(f + " count is off"); });
  const usedBrew = now("brews", 0) === was("brews", 0) - 1 && was("brews", 0) > 0;
  if (!usedBrew && !eq(now("brews", 0), was("brews", 0))) why.push("brews don't match");
  const oldA = i => (Array.isArray(s.attacks) && s.attacks[i] === true), newA = i => (Array.isArray(now("attacks", [])) && now("attacks", [])[i] === true);
  const extraOk = eq(now("attacks", F5), was("attacks", F5)) && now("extraAttacks", 0) === was("extraAttacks", 0) - 1 && was("extraAttacks", 0) > 0;
  let flips = 0, slots = true;
  for (let i = 0; i < 5; i++) { if (newA(i) !== oldA(i)) { flips++; if (!(newA(i) && !oldA(i) && hitOn(s, i, cls))) slots = false; } }
  const dayOk = eq(now("extraAttacks", 0), was("extraAttacks", 0)) && Array.isArray(now("attacks", [])) && now("attacks", []).length === 5 && slots && flips === 1;
  if (!extraOk && !dayOk) why.push("no unused 120 day or extra attack matches (attacks " + JSON.stringify(s.attacks) + ", status " + JSON.stringify(s.status) + ", extra " + JSON.stringify(s.extraAttacks) + ")");
  if (now("attackTotal", 0) !== was("attackTotal", 0) + 1) why.push("attackTotal is off");
  const hatK = { heart: "crownHat", frost: "earmuffsHat", jingle: "antlersHat", gobble: "pilgrimHat" }[sn] || "witchHat";
  const want = was("dmgTotal", was("attackTotal", 0) * dmg) + dmg + (was(hatK, false) === true ? 5 : 0) + (usedBrew ? (sn === "frost" || sn === "heart" ? dmg : 10) : 0);
  if (now("dmgTotal", 0) !== want) why.push("damage " + now("dmgTotal", 0) + " should be " + want);
  return why;
}
