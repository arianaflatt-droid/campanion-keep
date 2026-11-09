/* ---------- ☕ Space Café snacks (Nov 7): the list only (no imports), shared by cafe.js, game.js (snack gear) and badges.js ----------
   6 regular snacks are always on the menu. Each month adds its 2 special snacks (Arizona date); they can only be cooked
   during their month and come back next year. A snack is KEPT (forever) after cooking it at 3 stars CAFE_KEEP times;
   a kept snack can be worn in the 3-day streak snack spot instead of the 🍪 Snack Pack.
   Saved on the student in planet.cf = { d: last cook day, k: that snack, s: its stars, ck: { snack: 3-star cooks }, pf: all 3-star cooks, n: cooks }. */
export const CAFE_KEEP = 3;
const P = "assets/planet/cafe/";
// kind = which recipe (the 3 cooking steps). Specials swap in their own ingredient (and tray / blender / board) — see cafe.js
const R = (k, name, kind) => ({ k, name, kind, reg: true, img: P + "snack-" + k + ".webp" });
export const REGULARS = [R("moonmilk", "Moon Milk", "milk"), R("cometcookies", "Comet Cookies", "cookies"), R("galaxydonut", "Galaxy Donut", "donut"),
  R("nebulasmoothie", "Nebula Smoothie", "smoothie"), R("starfries", "Star Fries", "fries"), R("rocketpop", "Rocket Pop", "pop")];
const S = (month, k, name, kind, ing, ingName, x) => Object.assign({ k, name, kind, month, ing: P + "sp-ing-" + ing + ".webp", ingName, img: P + "sp-" + k + ".webp" }, x || {});
export const SPECIALS = [
  S(1, "snowball-donut", "Snowball Donut", "donut", "snowglaze", "snow glaze", { glaze: 1 }),
  S(1, "frosty-pop", "Frosty Blue Pop", "pop", "icyblue", "icy blue juice"),
  S(2, "heart-smoothie", "Heart Nebula Smoothie", "smoothie", "heartberries", "heart berries", { blend: "heart" }),
  S(2, "lovebug-donut", "Love Bug Donut", "donut", "heartsprinkles", "heart sprinkles", { top: 1 }),
  S(3, "clover-milk", "Lucky Clover Moon Milk", "milk", "cloversugar", "clover mint sugar"),
  S(3, "rainbow-pop", "Rainbow Rocket Pop", "pop", "rainbowjuice", "rainbow juice"),
  S(4, "bunny-cookies", "Bunny Hop Cookies", "cookies", "candyeggs", "candy eggs", { tray: "bunny" }),
  S(4, "blossom-donut", "Blossom Donut", "donut", "petalglaze", "petal glaze", { glaze: 1 }),
  S(5, "lemon-pop", "Lemon Sunshine Pop", "pop", "lemonjuice", "lemon juice"),
  S(5, "strawberry-smoothie", "Strawberry Star Smoothie", "smoothie", "strawberries", "star strawberries", { blend: "strawberry" }),
  S(6, "watermelon-pop", "Watermelon Planet Pop", "pop", "watermelon", "watermelon juice"),
  S(6, "sandcastle-cookies", "Sandcastle Cookies", "cookies", "beachsugar", "beach sugar", { tray: "castle" }),
  S(7, "firework-fries", "Firework Fries", "fries", "popsalt", "popping-candy salt", { salt: 1 }),
  S(7, "coconut-smoothie", "Coconut Splash Smoothie", "smoothie", "coconut", "space coconut", { blend: "coconut" }),
  S(8, "apple-cookies", "Apple Comet Cookies", "cookies", "apples", "apple chunks"),
  S(8, "crayon-donut", "Crayon Rainbow Donut", "donut", "crayonsprinkles", "crayon sprinkles", { top: 1 }),
  S(9, "honey-milk", "Honey Harvest Moon Milk", "milk", "honey", "moon honey"),
  S(9, "leaf-cookies", "Autumn Leaf Cookies", "cookies", "maplesugar", "maple sugar", { tray: "leaf" }),
  S(10, "pumpkin-milk", "Pumpkin Spice Moon Milk", "milk", "pumpkinspice", "pumpkin spice"),
  S(10, "slime-smoothie", "Monster Slime Smoothie", "smoothie", "slimeberries", "slime berries", { blend: "slime" }),
  S(11, "sweetpotato-fries", "Sweet Potato Star Fries", "fries", "sweetpotato", "sweet star potato", { potato: 1 }),
  S(11, "pumpkinpie-donut", "Pumpkin Pie Donut", "donut", "pumpkinglaze", "pumpkin glaze", { glaze: 1 }),
  S(12, "peppermint-cocoa", "Peppermint Cocoa", "milk", "peppermint", "peppermint candies"),
  S(12, "gingerbread-cookies", "Gingerbread Comet Cookies", "cookies", "ginger", "ginger spice")];
export const SNACKS = REGULARS.concat(SPECIALS);
export const SNACK_BY = {}; SNACKS.forEach(s => { SNACK_BY[s.k] = s; });
export const MONTHS = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const cafeOf = st => (((st && st.planet) || {}).cf) || {};
export const perfectOf = (st, k) => Number((cafeOf(st).ck || {})[k]) || 0;
export const snackKept = (st, k) => perfectOf(st, k) >= CAFE_KEEP;
export const keptCount = (st, list) => (list || SNACKS).filter(s => snackKept(st, s.k)).length;
export const perfectTotal = st => Number(cafeOf(st).pf) || 0;
// "Snack of the Month" badge: both specials of any one month kept
export const monthPairs = st => { let n = 0; for (let m = 1; m <= 12; m++) if (SPECIALS.filter(s => s.month === m).every(s => snackKept(st, s.k))) n++; return n; };
