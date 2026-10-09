/* ---------- Team events (Potion Brewing Teams, Feast Table Teams, ...) ----------
   The teacher makes teams for each event. Every day the game picks a recipe/menu (scaled to team size).
   Ingredients come from the pasted subject XP: every 25 XP in Math, Reading or Language = 1 of that subject's ingredient.
   Teammates' ingredients go together for the day. When the team has everything, it's done for the day and
   every teammate gets currency, XP and an egg (Potions also give a one-day glow). Rewards are given once per day.
   Saved on the class (p = the event's prefix, e.g. "potion" or "feast"):
     <p>On, <p>Teams [{ id, name, members }], <p>Recipe { date: { teamId: { e, b, s } } }, <p>Brews { date: [teamId] }, <p>Top { at, teams }
   Saved on the student: <p>Days { date: { team, fx? } } (days done + rewards given), <p>LegEggs (special Legendary eggs from the top team) */
import { isHaunt, isGobble, isJingle, isFrost, isHeart, esc } from "./game.js?v=20261009c";
import { azToday } from "./collect.js?v=20261009c";

export const PER_XP = 25;
// The Feast Table: one dish shows up on a team's table for every menu it finishes (the 10th finishes the feast).
export const DISHES = [
  { k: "cranberry", name: "Cranberry Sauce", ing: [["Cranberries", "\u{1F352}"], ["Sugar", "\u{1F36C}"], ["Oranges", "\u{1F34A}"]] },
  { k: "stuffing", name: "Stuffing", ing: [["Bread", "\u{1F35E}"], ["Onions", "\u{1F9C5}"], ["Celery", "\u{1F96C}"]] },
  { k: "sweetpotato", name: "Sweet Potato Casserole", ing: [["Sweet Potatoes", "\u{1F360}"], ["Marshmallows", "\u2601\uFE0F"], ["Brown Sugar", "\u{1F36F}"]] },
  { k: "pie", name: "Pumpkin Pie", ing: [["Pumpkins", "\u{1F383}"], ["Eggs", "\u{1F95A}"], ["Whipped Cream", "\u{1F366}"]] },
  { k: "rolls", name: "Dinner Rolls", ing: [["Flour", "\u{1F33E}"], ["Milk", "\u{1F95B}"], ["Butter", "\u{1F9C8}"]] },
  { k: "mac", name: "Mac & Cheese", ing: [["Macaroni", "\u{1F35D}"], ["Cheese", "\u{1F9C0}"], ["Milk", "\u{1F95B}"]] },
  { k: "greenbeans", name: "Green Bean Casserole", ing: [["Green Beans", "\u{1FADB}"], ["Mushrooms", "\u{1F344}"], ["Crispy Onions", "\u{1F9C5}"]] },
  { k: "mashed", name: "Mashed Potatoes", ing: [["Potatoes", "\u{1F954}"], ["Butter", "\u{1F9C8}"], ["Milk", "\u{1F95B}"]] },
  { k: "gravy", name: "Gravy", ing: [["Broth", "\u{1F372}"], ["Flour", "\u{1F33E}"], ["Salt & Pepper", "\u{1F9C2}"]] },
  { k: "turkey", name: "Roast Turkey", ing: [["Turkey", "\u{1F983}"], ["Herbs", "\u{1F33F}"], ["Butter", "\u{1F9C8}"]] }
];
// The Gingerbread House: the house starts as an empty iced base and gets one build step per finished day (10 steps, about 2 weeks).
// Picture: assets/ginger/house-<steps done>.webp (0 = the empty base, 10 = the finished house).
export const STAGES = [
  { k: "walls", name: "Stand Up the Walls", ing: [["Gingerbread Walls", "\u{1F36A}"], ["Icing", "\u{1F366}"], ["Spatulas", "\u{1F944}"]] },
  { k: "corners", name: "Ice the Corners", ing: [["Icing", "\u{1F366}"], ["Honey", "\u{1F36F}"], ["Butter", "\u{1F9C8}"]] },
  { k: "roof", name: "Put On the Roof", ing: [["Roof Pieces", "\u{1F36A}"], ["Icing", "\u{1F366}"], ["Molasses", "\u{1F36F}"]] },
  { k: "snow", name: "Pipe the Snow & Windows", ing: [["Snow Frosting", "\u2744\uFE0F"], ["Sugar", "\u{1F9C2}"], ["Milk", "\u{1F95B}"]] },
  { k: "peppermint", name: "Add Gumdrops & a Peppermint", ing: [["Gumdrops", "\u{1F36C}"], ["Peppermints", "\u{1F36D}"], ["Candy Dots", "\u{1F534}"]] },
  { k: "canes", name: "Candy Cane Door & Gumdrop Trim", ing: [["Candy Canes", "\u{1F36D}"], ["Gumdrops", "\u{1F36C}"], ["Candy Dots", "\u{1F7E1}"]] },
  { k: "wreath", name: "Hang the Wreath & Light the Windows", ing: [["Holly", "\u{1F33F}"], ["Bows", "\u{1F380}"], ["Candles", "\u{1F56F}\uFE0F"]] },
  { k: "path", name: "Holly & a Candy Path", ing: [["Jelly Beans", "\u{1FAD8}"], ["Holly", "\u{1F33F}"], ["Icing Flowers", "\u{1F33C}"]] },
  { k: "sprinkles", name: "Sprinkles Everywhere", ing: [["Sprinkles", "\u{1F308}"], ["Red Candies", "\u{1F534}"], ["Green Candies", "\u{1F7E2}"]] },
  { k: "friends", name: "Gingerbread Friends", ing: [["Cookie Dough", "\u{1F36A}"], ["Bows", "\u{1F380}"], ["Chocolate Chips", "\u{1F36B}"]] }
];
// Build-a-Snowman (Frostbite Festival): an empty snow pile that grows one step a day.
// Picture: assets/snowman/snowman-<steps done>.webp (0 = the snow pile, 10 = the finished snowman with snowflakes).
export const SNOW_STEPS = [
  { k: "roll", name: "Roll the Big Snowball", ing: [["Snow", "\u2744\uFE0F"], ["Mittens", "\u{1F9E4}"], ["Buckets", "\u{1FAA3}"]] },
  { k: "middle", name: "Stack the Middle", ing: [["Snow", "\u2744\uFE0F"], ["Muscles", "\u{1F4AA}"], ["Ice", "\u{1F9CA}"]] },
  { k: "head", name: "Add the Head", ing: [["Snow", "\u2744\uFE0F"], ["Mittens", "\u{1F9E4}"], ["Frost", "\u{1F976}"]] },
  { k: "face", name: "Coal Eyes & Smile", ing: [["Coal", "\u26AB"], ["Pebbles", "\u{1FAA8}"], ["Brushes", "\u{1F58C}\uFE0F"]] },
  { k: "nose", name: "Carrot Nose", ing: [["Carrots", "\u{1F955}"], ["Seeds", "\u{1F331}"], ["Baskets", "\u{1F9FA}"]] },
  { k: "arms", name: "Stick Arms", ing: [["Sticks", "\u{1FAB5}"], ["Leaves", "\u{1F342}"], ["Pine", "\u{1F332}"]] },
  { k: "scarf", name: "Cozy Scarf", ing: [["Yarn", "\u{1F9F6}"], ["Fabric", "\u{1F9E3}"], ["Scissors", "\u2702\uFE0F"]] },
  { k: "hat", name: "Top Hat", ing: [["Felt", "\u{1F3A9}"], ["Ribbon", "\u{1F380}"], ["Stars", "\u2B50"]] },
  { k: "buttons", name: "Buttons", ing: [["Buttons", "\u{1F518}"], ["Thread", "\u{1F9F5}"], ["Needles", "\u{1FAA1}"]] },
  { k: "magic", name: "Snowflake Magic", ing: [["Snowflakes", "\u2744\uFE0F"], ["Sparkles", "\u2728"], ["Wishes", "\u{1F31F}"]] }
];
// Candy Box Teams (Sweetheart Showdown): one chocolate a day goes into its own shaped slot in the heart box.
// Pictures: assets/heart/box/candy-box.webp and choc-1.webp ... choc-10.webp (numbered by day).
export const CHOCS = [
  { k: "strawberry", name: "Strawberry Cream Heart", ing: [["Chocolate", "\u{1F36B}"], ["Strawberries", "\u{1F353}"], ["Cream", "\u{1F95B}"]] },
  { k: "caramel", name: "Caramel Swirl", ing: [["Chocolate", "\u{1F36B}"], ["Caramel", "\u{1F36F}"], ["Sea Salt", "\u{1F9C2}"]] },
  { k: "pbcup", name: "Peanut Butter Cup", ing: [["Chocolate", "\u{1F36B}"], ["Peanut Butter", "\u{1F95C}"], ["Paper Cups", "\u{1F9C1}"]] },
  { k: "cherry", name: "Cherry Cordial", ing: [["Chocolate", "\u{1F36B}"], ["Cherries", "\u{1F352}"], ["Sugar", "\u{1F36C}"]] },
  { k: "mint", name: "Mint Truffle", ing: [["Chocolate", "\u{1F36B}"], ["Mint Leaves", "\u{1F33F}"], ["Cream", "\u{1F95B}"]] },
  { k: "coconut", name: "Coconut Snowball", ing: [["White Chocolate", "\u26AA"], ["Coconut", "\u{1F965}"], ["Sugar", "\u{1F36C}"]] },
  { k: "rose", name: "Raspberry Rose", ing: [["Chocolate", "\u{1F36B}"], ["Raspberries", "\u{1FAD0}"], ["Rose Petals", "\u{1F339}"]] },
  { k: "toffee", name: "Toffee Crunch", ing: [["Chocolate", "\u{1F36B}"], ["Butter", "\u{1F9C8}"], ["Almonds", "\u{1F330}"]] },
  { k: "orange", name: "Orange Dream", ing: [["Chocolate", "\u{1F36B}"], ["Oranges", "\u{1F34A}"], ["Honey", "\u{1F36F}"]] },
  { k: "bonbon", name: "Golden Sweetheart Bonbon", ing: [["Chocolate", "\u{1F36B}"], ["Gold Sprinkles", "\u2728"], ["Pink Frosting", "\u{1F496}"]] }
];
// Where each day's chocolate sits in the box picture: centre x, centre y and width, as fractions of the box.
const BOX_SPOTS = [[.268, .488, .165], [.452, .483, .15], [.611, .483, .15], [.765, .485, .145], [.278, .625, .17], [.5, .622, .18], [.722, .622, .17], [.25, .775, .18], [.503, .778, .18], [.75, .772, .18]];
// The Feast Table: today's menu is the team's next dish, and its ingredients are that dish's real ingredients
// (still 1 per 25 XP: the 1st from Math, the 2nd from Reading, the 3rd from Language). After all 10, the feast repeats as second helpings.
export function dishIndex(E, cls, team, date) {
  return Object.entries((cls && cls[E.p + "Brews"]) || {}).filter(([d, l]) => d < date && (l || []).includes(team.id)).length;
}
export function ingFor(E, cls, team, date) {
  if (!E.steps) return E.ing;
  const dish = E.steps[dishIndex(E, cls, team, date) % E.steps.length];
  return E.ing.map((g, i) => Object.assign({}, g, { name: dish.ing[i][0], icon: dish.ing[i][1] }));
}
// Where the 1st, 2nd, ... dish sits on the table (x = centre %, row 0 = back, 1 = front, w = width %), so the table fills in evenly.
// The 10th (the turkey) takes the middle of the front row.
const DISH_SPOTS = [[34, 0, 15], [66, 0, 16], [31, 1, 18], [69, 1, 18], [50, 0, 14], [18, 0, 15], [82, 0, 14], [13, 1, 18], [87, 1, 18], [50, 1, 25]];
export const EFFECTS = [
  { k: "glow", name: "Glow Potion", icon: "\u{1F49C}" },
  { k: "shadow", name: "Shadow Potion", icon: "\u{1F5A4}" },
  { k: "pumpkin", name: "Pumpkin Potion", icon: "\u{1F9E1}" },
  { k: "slime", name: "Slime Potion", icon: "\u{1F49A}" },
  { k: "frost", name: "Frost Potion", icon: "\u{1FA75}" }
];
export const effect = k => EFFECTS.find(x => x.k === k) || EFFECTS[0];

export const TEAM_EVENTS = {
  potion: {
    key: "potion", p: "potion", title: "Potion Brewing Teams", icon: "\u{1F9EA}", tab: "\u{1F9EA} Potions", season: isHaunt, seasonName: "Haunt-O-Ween",
    ing: [
      { k: "e", sub: "m", name: "Eyeballs", icon: "\u{1F441}️", subject: "Math" },
      { k: "b", sub: "r", name: "Bat Wings", icon: "\u{1F987}", subject: "Reading" },
      { k: "s", sub: "l", name: "Spider Legs", icon: "\u{1F577}️", subject: "Language" }],
    cur: 30, curName: "candy", xp: 50, eggs: 1, badge: "Master Brewer", badgeN: 3, one: "potion", many: "potions", done: "Potion brewed!",
    recipe: "recipe", fill: "fill the cauldron with your team!", leg: "L-33", legName: "Brewraith", fx: true
  },
  feast: {
    key: "feast", p: "feast", title: "Feast Table Teams", icon: "\u{1F983}", tab: "\u{1F983} Feast", season: isGobble, seasonName: "Gobble-Palooza",
    ing: [
      { k: "e", sub: "m", name: "Pies", icon: "\u{1F967}", subject: "Math" },
      { k: "b", sub: "r", name: "Corn", icon: "\u{1F33D}", subject: "Reading" },
      { k: "s", sub: "l", name: "Turkey Legs", icon: "\u{1F357}", subject: "Language" }],
    cur: 30, curName: "corn", xp: 50, eggs: 1, badge: "Feast Master", badgeN: 3, one: "dish", many: "dishes", done: "Menu complete!",
    recipe: "menu", fill: "cook today’s menu with your team!", leg: "L-35", legName: "Cornucopia", fx: false,
    steps: DISHES, stepWord: "dish", today: "Today’s dish", doneLine: "is on your table!", againWord: "second helpings", countWord: " on the table"
  },
  ginger: {
    key: "ginger", p: "ginger", title: "Gingerbread House Build", icon: "\u{1F3E0}", tab: "\u{1F36A} Gingerbread", season: isJingle, seasonName: "Jingle Jam",
    ing: [
      { k: "e", sub: "m", name: "Gingerbread", icon: "\u{1F36A}", subject: "Math" },
      { k: "b", sub: "r", name: "Icing", icon: "\u{1F366}", subject: "Reading" },
      { k: "s", sub: "l", name: "Gumdrops", icon: "\u{1F36C}", subject: "Language" }],
    cur: 30, curName: "presents", xp: 50, eggs: 1, badge: "Master Baker", badgeN: 10, one: "build step", many: "build steps", done: "Build step done!",
    recipe: "build step", fill: "build with your team!", leg: "L-36", legName: "Gingermischief", fx: false,
    steps: STAGES, stepWord: "step", today: "Today’s build step", doneLine: "is done on your house!", againWord: "extra decorating", countWord: " done",
    build: true, art: "assets/ginger/house-", thing: "house", extra: "Extra Decorating"
  },
  snowman: {
    key: "snowman", p: "snowman", title: "Build-a-Snowman", icon: "\u26C4", tab: "\u26C4 Snowman", season: isFrost, seasonName: "Frostbite Festival",
    ing: [
      { k: "e", sub: "m", name: "Snow", icon: "\u2744\uFE0F", subject: "Math" },
      { k: "b", sub: "r", name: "Mittens", icon: "\u{1F9E4}", subject: "Reading" },
      { k: "s", sub: "l", name: "Buckets", icon: "\u{1FAA3}", subject: "Language" }],
    cur: 30, curName: "snowflakes", xp: 50, eggs: 1, badge: "Snow Sculptor", badgeN: 10, one: "build step", many: "build steps", done: "Snowman step done!",
    recipe: "build step", fill: "build with your team!", leg: "L-38", legName: "Snowmorrow", fx: false,
    steps: SNOW_STEPS, stepWord: "step", today: "Today’s build step", doneLine: "is done on your snowman!", againWord: "extra snow fun", countWord: " done",
    build: true, art: "assets/snowman/snowman-", thing: "snowman", extra: "Snowball Fun"
  },
  candybox: {
    key: "candybox", p: "candybox", title: "Candy Box Teams", icon: "\u{1F36B}", tab: "\u{1F36B} Candy Box", season: isHeart, seasonName: "Sweetheart Showdown",
    ing: [
      { k: "e", sub: "m", name: "Chocolate", icon: "\u{1F36B}", subject: "Math" },
      { k: "b", sub: "r", name: "Strawberries", icon: "\u{1F353}", subject: "Reading" },
      { k: "s", sub: "l", name: "Cream", icon: "\u{1F95B}", subject: "Language" }],
    cur: 30, curName: "hearts", xp: 50, eggs: 1, badge: "Master Chocolatier", badgeN: 10, one: "chocolate", many: "chocolates", done: "Chocolate made!",
    recipe: "chocolate", fill: "make it with your team!", leg: "L-40", legName: "Candivora", fx: false,
    steps: CHOCS, stepWord: "chocolate", today: "Today\u2019s chocolate", doneLine: "is in your candy box!", againWord: "extra sweets", countWord: " in the box",
    build: true, box: true, thing: "candy box", extra: "Extra Sweets", makeLine: "make it with your team to put it in your candy box!"
  }
};
export const EVENT_LIST = Object.values(TEAM_EVENTS);
const F = (E, k) => E.p + k;   // field name, e.g. F(E, "Teams") = "potionTeams"

export const eventOn = (E, cls) => !!(cls && cls[F(E, "On")]) && E.season(cls);
export const teams = (E, cls) => ((cls && cls[F(E, "Teams")]) || []).filter(t => t && t.id);
export const teamOf = (E, cls, sid) => teams(E, cls).find(t => (t.members || []).includes(sid)) || null;
export const daysOf = (E, st) => (st && st[F(E, "Days")]) || {};
export const doneCount = (E, st) => Object.keys(daysOf(E, st)).length;

// A steady "random" number 0–1 from a piece of text (the same day always gets the same recipe).
function seed(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619); return ((h >>> 0) % 10007) / 10007; }
export function autoRecipe(E, n, date) {
  const r = {}; E.ing.forEach(g => { r[g.k] = Math.max(1, Math.round(Math.max(1, n) * (0.5 + 0.6 * seed(E.key + date + ":" + g.k)))); }); return r;
}
export function recipeFor(E, cls, team, date) {
  const o = (((cls && cls[F(E, "Recipe")]) || {})[date] || {})[team.id];
  return o ? E.ing.reduce((r, g) => (r[g.k] = Math.max(0, Number(o[g.k]) || 0), r), {}) : autoRecipe(E, (team.members || []).length, date);
}
export const recipeChanged = (E, cls, team, date) => !!(((cls && cls[F(E, "Recipe")]) || {})[date] || {})[team.id];
// One student's ingredients for a day (from the subject XP saved by the paste).
export function ingOf(E, st, date) {
  const s = ((((st && st.xpHist) || {})[date] || {}).sub) || {};
  return E.ing.reduce((r, g) => (r[g.k] = Math.floor((Number(s[g.sub]) || 0) / PER_XP), r), {});
}
// A team's day: what each member added, the totals, what's needed and whether it's done.
export function teamDay(E, cls, team, students, date) {
  const need = recipeFor(E, cls, team, date), have = { e: 0, b: 0, s: 0 };
  const rows = (team.members || []).map(id => students.find(x => x.id === id)).filter(Boolean).map(st => {
    const g = ingOf(E, st, date); E.ing.forEach(x => { have[x.k] += g[x.k]; }); return { st, g };
  });
  const ready = E.ing.every(x => have[x.k] >= need[x.k]);
  const brewed = (((cls && cls[F(E, "Brews")]) || {})[date] || []).includes(team.id);
  const di = E.steps ? dishIndex(E, cls, team, date) : 0;
  return { E, team, need, have, rows, ready, brewed, ing: ingFor(E, cls, team, date), dish: E.steps ? (E.build && di >= E.steps.length ? { k: "extra", name: E.extra } : E.steps[di % E.steps.length]) : null, second: E.steps ? di >= E.steps.length : false };
}
export const brewCount = (E, cls, teamId) => Object.values((cls && cls[F(E, "Brews")]) || {}).filter(l => (l || []).includes(teamId)).length;
export function standings(E, cls) {
  return teams(E, cls).map(t => ({ t, n: brewCount(E, cls, t.id) })).sort((a, b) => b.n - a.n || a.t.name.localeCompare(b.t.name));
}
export function topTeams(E, cls) {
  const st = standings(E, cls), best = st.length ? st[0].n : 0; return best > 0 ? st.filter(x => x.n === best).map(x => x.t) : [];
}
export const legField = E => F(E, "LegEggs");
export const topField = E => F(E, "Top");

/* Called by the teacher console after a paste is saved (students already hold the new xpHist).
   Returns the student updates, the class update and the teams that finished. Never rewards a student twice for a day. */
export function brewRewards(E, cls, students, date) {
  if (!eventOn(E, cls)) return null;
  const brews = Object.assign({}, cls[F(E, "Brews")] || {}), list = [...(brews[date] || [])], updates = [], newTeams = [];
  teams(E, cls).forEach(t => {
    const c = teamDay(E, cls, t, students, date);
    if (!c.ready) return;
    if (!list.includes(t.id)) { list.push(t.id); newTeams.push(t); }
    c.rows.forEach(({ st }) => {
      if (daysOf(E, st)[date]) return;
      const rec = { team: t.id, at: new Date().toISOString() };
      if (E.fx) rec.fx = EFFECTS[Math.floor(seed(date + ":" + st.id + ":fx") * EFFECTS.length) % EFFECTS.length].k;
      updates.push({ st, data: {
        [F(E, "Days") + "." + date]: rec,
        candyBonus: (Number(st.candyBonus) || 0) + E.cur,
        bonusXP: (Number(st.bonusXP) || 0) + E.xp,
        bonusPulls: (Number(st.bonusPulls) || 0) + E.eggs
      } });
    });
  });
  brews[date] = list;
  return { updates, classData: newTeams.length ? { [F(E, "Brews")]: brews } : null, newTeams };
}

/* ---------- pictures ---------- */
// Potions: the cauldron with the team's ingredients floating in it (up to 4 of each). New ones drop in.
export const CAULDRON_ART = "assets/potion/cauldron.webp", CAULDRON_BREWED = "assets/potion/cauldron-brewed.webp";
const SPOTS = [[-0.35, -0.1], [0.2, 0.25], [-0.05, -0.45], [0.5, -0.15], [-0.62, 0.2], [0.05, 0.55], [-0.3, 0.5], [0.3, -0.5], [0.68, 0.25], [-0.55, -0.4], [0.25, 0], [-0.1, 0.15]];
const seenFloat = {};
export function cauldronHTML(c) {
  const items = [];
  for (let n = 0; n < 4; n++) c.E.ing.forEach(g => { if (c.have[g.k] > n) items.push(g); });
  const was = seenFloat[c.team.id] || 0; seenFloat[c.team.id] = items.length;
  return '<div class="cauldron has-art' + (c.brewed ? " brewed" : "") + '" aria-hidden="true">' +
    '<span class="steam s1"></span><span class="steam s2"></span><span class="bowl"></span>' +
    '<img class="caul-art" src="' + (c.brewed ? CAULDRON_BREWED : CAULDRON_ART) + '" alt="" onerror="this.parentNode.classList.remove(\'has-art\');this.remove()">' +
    '<span class="liquid"><span class="swirl"></span><span class="shine"></span></span>' +
    items.map((g, i) => '<span class="floaty' + (i >= was ? " new" : "") + '" style="--u:' + SPOTS[i][0] + ";--v:" + SPOTS[i][1] + ";animation-delay:" + (i >= was ? (i - was) * 0.25 + "s, " + ((i - was) * 0.25 + 0.9) + "s" : (-(i * 0.37)).toFixed(2) + "s") + '">' + g.icon + "</span>").join("") +
    '<span class="bub b1"></span><span class="bub b2"></span><span class="bub b3"></span></div>';
}
// Feast: the team's table with one dish for every menu it has finished. A dish that just arrived drops onto the table.
const seenDish = {};
export function tableHTML(c, cls) {
  const n = Math.min(DISHES.length, brewCount(c.E, cls, c.team.id)), was = seenDish[c.team.id] == null ? n : seenDish[c.team.id];
  seenDish[c.team.id] = n;
  const shown = DISHES.slice(0, n).map((d, i) => ({ d, i, s: DISH_SPOTS[i] })).sort((a, b) => a.s[1] - b.s[1]);
  return '<div class="feasttable" aria-hidden="true"><img class="ft-table" src="assets/feast/table.webp" alt="">' +
    shown.map(({ d, i, s }) => '<img class="ft-dish r' + s[1] + (i >= was ? " new" : "") + '" src="assets/feast/' + d.k + '.webp" alt="" title="' + esc(d.name) + '" style="left:' + s[0] + "%;width:" + s[2] + '%;">').join("") +
    // the dish being cooked today: a faint picture in its spot until the team finishes it
    (!c.brewed && n < DISHES.length ? '<img class="ft-dish ghost r' + DISH_SPOTS[n][1] + '" src="assets/feast/' + DISHES[n].k + '.webp" alt="" style="left:' + DISH_SPOTS[n][0] + "%;width:" + DISH_SPOTS[n][2] + '%;"><span class="ft-cook" style="left:' + DISH_SPOTS[n][0] + '%;bottom:' + (DISH_SPOTS[n][1] ? 40 : 54) + '%;">\u{1F373} Cooking!</span>' : "") +
    (n ? "" : '<span class="ft-empty">Cook today\u2019s dish to put it on your table!</span>') + "</div>";
}

// Gingerbread: the team's house, one picture per finished build step. A new step pops in with sparkles.
const seenHouse = {};
export function houseHTML(c, cls) {
  const E = c.E, L = E.steps.length, key = E.key + ":" + c.team.id;
  const n = Math.min(L, brewCount(E, cls, c.team.id)), was = seenHouse[key] == null ? n : seenHouse[key];
  seenHouse[key] = n;
  return '<div class="ginghouse tb-' + E.key + (n > was ? " new" : "") + (n >= L ? " done" : "") + '" aria-hidden="true">' +
    (n > was ? '<img class="gh-old" src="' + E.art + was + '.webp" alt="">' : "") +
    '<img class="gh-now" src="' + E.art + n + '.webp" alt="">' +
    (n > was ? '<span class="gh-spark s1">\u2728</span><span class="gh-spark s2">\u2728</span><span class="gh-spark s3">\u2728</span>' : "") +
    '<span class="gh-step">' + (n >= L ? "\u{1F3C6} Finished!" : "Step " + n + " / " + L) + "</span></div>";
}

// Candy Box: the open box with one chocolate in its slot for every finished day. Today's chocolate shows faintly in its slot.
const seenBox = {};
export function boxHTML(c, cls) {
  const E = c.E, L = E.steps.length, n = Math.min(L, brewCount(E, cls, c.team.id)), was = seenBox[c.team.id] == null ? n : seenBox[c.team.id];
  seenBox[c.team.id] = n;
  const choc = (i, extra) => '<img class="cb-choc' + extra + '" src="assets/heart/box/choc-' + (i + 1) + '.webp" alt="" title="' + esc(E.steps[i].name) + '" style="left:' + (BOX_SPOTS[i][0] * 100) + "%;top:" + (BOX_SPOTS[i][1] * 100) + "%;width:" + (BOX_SPOTS[i][2] * 100) + '%;">';
  let h = '<div class="candybox' + (n >= L ? " done" : "") + '" aria-hidden="true"><img class="cb-box" src="assets/heart/box/candy-box.webp" alt="">';
  for (let i = 0; i < n; i++) h += choc(i, i >= was ? " new" : "");
  if (!c.brewed && n < L) h += choc(n, " ghost");
  return h + '<span class="cb-step">' + (n >= L ? "\u{1F3C6} Box full!" : n + " / " + L + " chocolates") + "</span></div>";
}

/* ---------- student card ---------- */
const bar = (have, need) => '<span class="pbar"><span style="width:' + Math.min(100, need ? have / need * 100 : 100) + '%"></span></span>';
export function teamCard(E, st, cls, students) {
  const t = teamOf(E, cls, st.id), date = azToday();
  if (!t) return '<div class="card potion"><h2>' + E.icon + " " + E.title + '</h2><p class="lede">You’re not on a team yet — your teacher will put you on one!</p></div>';
  const c = teamDay(E, cls, t, students, date), mine = daysOf(E, st)[date], fx = E.fx && mine ? effect(mine.fx) : null, n = doneCount(E, st), bc = brewCount(E, cls, t.id);
  let h = '<div class="card potion tev-' + E.key + '"><div class="card-head"><h2>' + E.icon + " " + esc(t.name) + '</h2><span class="fact">' + bc + " " + (bc === 1 ? E.one : E.many) + (E.key === "potion" ? " brewed" : E.countWord) + "</span></div>" +
    (E.key === "feast" ? tableHTML(c, cls) : E.box ? boxHTML(c, cls) : E.build ? houseHTML(c, cls) : cauldronHTML(c));
  const got = "You got +" + E.cur + " " + E.curName + ", +" + E.xp + " XP" + (E.eggs ? " and an egg" : "");
  if (c.brewed) h += '<div class="banner info" style="margin:10px 0;">✨ <b>' + E.done + "</b> " + (mine ? got + (fx ? " — plus a <b>" + fx.icon + " " + esc(fx.name) + "</b>: your companion is glowing today!" : "!") : "") +
    (c.dish ? " <b>" + esc(c.dish.name) + "</b> " + (c.second && !E.build ? "(" + E.againWord + "!) " : "") + E.doneLine : "") + "</div>";
  else h += c.dish ? '<p class="lede" style="margin:8px 0;"><b>' + E.today + ": " + esc(c.dish.name) + (c.second && !E.build ? " (" + E.againWord + ")" : "") + "</b> — " + (E.makeLine ? E.makeLine : E.build ? "build it with your team to add it to your " + E.thing + "!" : "cook it with your team to put it on your table!") + "</p>"
    : '<p class="lede" style="margin:8px 0;"><b>Today’s ' + E.recipe + "</b> — " + E.fill + "</p>";
  h += '<div class="recipe">' + c.ing.map(g => '<div class="pring"><span class="ri-ic">' + g.icon + '</span><span class="ri-nm">' + g.name + " <small>(" + g.subject + ")</small></span>" + bar(c.have[g.k], c.need[g.k]) +
    '<b class="ri-n">' + c.have[g.k] + " / " + c.need[g.k] + (c.have[g.k] >= c.need[g.k] ? " ✅" : "") + "</b></div>").join("") + "</div>";
  h += '<h3 style="margin-top:12px;">Your team</h3><div class="pteam">' + c.rows.map(({ st: m, g }) => '<span class="' + (m.id === st.id ? "me" : "") + '">' + esc(m.name || "") + " " +
    c.ing.map(x => (g[x.k] ? x.icon + g[x.k] : "")).filter(Boolean).join(" ") + (E.ing.some(x => g[x.k]) ? "" : '<small class="muted">—</small>') + "</span>").join("") + "</div>";
  h += '<p class="muted small" style="margin-top:10px;">Every ' + PER_XP + " XP in a subject = 1 ingredient: " + c.ing.map(g => g.subject + " = " + g.icon + " " + g.name).join(", ") +
    ". Ingredients show up when your teacher adds today’s XP. " + (c.dish ? (E.box ? "Each day you make the next chocolate for your box." : E.build ? "Each day you build the next step of your " + E.thing + "." : "Each day you cook the next dish on the menu.") : "A new " + E.recipe + " comes every day.") + "</p>";
  h += '<p class="small" style="margin-top:6px;">\u{1F3C5} ' + E.badge + ": <b>" + Math.min(n, E.badgeN) + " / " + E.badgeN + "</b> " + E.many + (n >= E.badgeN ? " ✅" : "") + "</p>";
  const s = standings(E, cls);
  h += '<h3 style="margin-top:12px;">\u{1F3C6} Team standings</h3><ol class="pstand">' + s.map(x => '<li class="' + (x.t.id === t.id ? "me" : "") + '">' + esc(x.t.name) + " — <b>" + x.n + "</b></li>").join("") + "</ol>" +
    '<p class="muted small">The team with the most ' + E.many + " at the end of " + E.seasonName + " wins a <b>special Legendary egg</b>!</p>";
  return h + "</div>";
}
