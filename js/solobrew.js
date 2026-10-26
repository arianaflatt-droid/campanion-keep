/* ---------- 🧪 Solo Potion Brewing (Haunt-O-Ween) and 🍽️ Solo Feast Cooking (Gobble-Palooza), in place of the boss battle ----------
   Feast Cooking works the same way: Corn (Math), Potatoes (Reading), Bread (Language) + 2 Pie Spice (Goal Subject) = 1 dish, +20 corn each, dishes fill the student's own Feast Table.
   Saved as soloFeast = { days, extra, got } (soloBrew for potions); the 15-dish Cornucopia egg is soloFeastLeg. Switch: cls.feastSolo (potions: cls.brewSolo).
   Ms. Ariana turns it on in Events (cls.brewSolo = true). The Haunt-O-Ween tab then shows each student's own cauldron
   instead of the boss. Ingredients come from that day's subject XP (every 25 XP = 1; Math = Eyeballs, Reading = Bat Wings,
   Language = Spider Legs; cls.subSwap swaps a student's subject; 🎃 Pumpkin Seeds = the student's Goal Subject from their doors), plus Free Ingredients from the wheel.
   One recipe for the whole class each day (about 1 potion a day), unlimited potions. Leftovers don't carry over.
   Each potion: +20 candy and a potion glow for the day. Shelf rewards at 3 / 6 / 10 / 15 potions.
   Saved on the student (student-writable): soloBrew = { days: { date: potions }, fx: { date: effect }, extra: { date: { e|b|s: n } }, got: { "3": true, ... } }
   Shelf rewards use fields the student page may write: doorEggs, candyBonus, doorXP, legendaryPulls, soloBrewLeg (counted by brewLegLeft). */
import { esc, isHaunt, isGobble, isJingle, isFrost, isHeart } from "./game.js?v=20261020u";
import { azToday } from "./collect.js?v=20261020u";
import { TEAM_EVENTS, ingOf, subFor, SUB_NAMES, PER_XP, EFFECTS, effect, cauldronHTML, soloTableHTML, soloHouseHTML, soloBoxHTML, DISHES } from "./teams.js?v=20261020u";
import { SUBJECT_KEYS } from "./doors.js?v=20261020u";

export const BREW = TEAM_EVENTS.potion;
const FEAST_ING = { key: "solofeast", ing: [
  { k: "e", sub: "m", name: "Corn", icon: "\u{1F33D}", subject: "Math" },
  { k: "b", sub: "r", name: "Potatoes", icon: "\u{1F954}", subject: "Reading" },
  { k: "s", sub: "l", name: "Bread", icon: "\u{1F35E}", subject: "Language" }] };
// The 4th ingredient comes from each student's own Goal Subject (the one their Daily Doors use, set in the Students tab).
export const GOAL_ING = { k: "g", name: "Pumpkin Seeds", icon: "\u{1F383}", goal: true };
export const SEED_XP = 22.5;   // Goal Subject XP per Pumpkin Seed / Pie Spice: 2 = 45 XP, so one potion or dish = 25 + 25 + 25 + 45 = 120 XP
export const goalKey = st => SUBJECT_KEYS[String((st && st.goalSubject) || "").trim().toLowerCase()] || null;
export const POTION_CANDY = 20;
// One config per season: potions (Haunt-O-Ween) and feast dishes (Gobble-Palooza).
const HAUNT = { key: "haunt", E: BREW, goal: GOAL_ING, field: "soloBrew", legField: "soloBrewLeg", sw: "brewSolo", fx: true,
  icon: "\u{1F9EA}", title: "Your Potion Cauldron", one: "potion", many: "potions", One: "Potion", verb: "Brew", done: "brewed", cur: "candy", where: "cauldron", bossName: "Ghost-olotl",
  hide: ["attack", "brew", "witchhat"], badge: "Master Brewer", legLabel: "a Brewraith egg", shelfTitle: "Your potion shelf", shelfIcon: "\u{1F9EA}",
  shelf: [
    { n: 3, icon: "\u{1F95A}", label: "an egg" },
    { n: 6, icon: "\u{1F36C}", label: "100 candy + 50 XP" },
    { n: 10, icon: "\u{1F3C5}", label: "Master Brewer badge + a Legendary egg" },
    { n: 15, icon: "\u{1F9EA}", label: "a Brewraith egg" }] };
const GOBBLE = { key: "gobble", E: FEAST_ING, goal: { k: "g", name: "Pie Spice", icon: "\u{1F967}", goal: true }, field: "soloFeast", legField: "soloFeastLeg", sw: "feastSolo", fx: false,
  icon: "\u{1F37D}\uFE0F", title: "Your Feast Kitchen", one: "dish", many: "dishes", One: "Dish", verb: "Cook", done: "cooked", cur: "corn", where: "kitchen", bossName: "Turducken",
  hide: ["attack", "pie", "pilgrimhat"], badge: "Feast Master", legLabel: "a Cornucopia egg", shelfTitle: "Your Feast Table", shelfIcon: "\u{1F37D}\uFE0F",
  shelf: [
    { n: 3, icon: "\u{1F95A}", label: "an egg" },
    { n: 6, icon: "\u{1F33D}", label: "100 corn + 50 XP" },
    { n: 10, icon: "\u{1F3C5}", label: "Feast Master badge + a Legendary egg" },
    { n: 15, icon: "\u{1F983}", label: "a Cornucopia egg" }] };
export const soloCfg = cls => isGobble(cls) ? GOBBLE : isJingle(cls) ? JINGLE : isFrost(cls) ? FROST : isHeart(cls) ? HEART : HAUNT;
const JINGLE_ING = { key: "sologinger", ing: [
  { k: "e", sub: "m", name: "Gingerbread", icon: "\u{1F36A}", subject: "Math" },
  { k: "b", sub: "r", name: "Icing", icon: "\u{1F366}", subject: "Reading" },
  { k: "s", sub: "l", name: "Gumdrops", icon: "\u{1F36C}", subject: "Language" }] };
const JINGLE = { key: "jingle", E: JINGLE_ING, goal: { k: "g", name: "Sprinkles", icon: "\u2728", goal: true }, field: "soloGinger", legField: "soloGingerLeg", sw: "gingerSolo", fx: false,
  icon: "\u{1F36A}", title: "Your Gingerbread House", one: "batch", many: "batches", One: "Batch", verb: "Bake", done: "baked", cur: "presents", where: "kitchen", bossName: "Grinch-a-Duck",
  hide: ["attack", "cocoa", "antlers"], badge: "Master Baker", legLabel: "a Gingermischief egg", shelfTitle: "Your gingerbread bakes", shelfIcon: "\u{1F36A}", name: "Gingerbread Baking", tabName: "Jingle Jam", cls: "ginger",
  shelf: [
    { n: 3, icon: "\u{1F95A}", label: "an egg" },
    { n: 6, icon: "\u{1F381}", label: "100 presents + 50 XP" },
    { n: 10, icon: "\u{1F3C5}", label: "Master Baker badge + a Legendary egg" },
    { n: 15, icon: "\u{1F36A}", label: "a Gingermischief egg" }] };
const FROST_ING = { key: "solosnow", ing: [
  { k: "e", sub: "m", name: "Snow", icon: "\u2744\uFE0F", subject: "Math" },
  { k: "b", sub: "r", name: "Mittens", icon: "\u{1F9E4}", subject: "Reading" },
  { k: "s", sub: "l", name: "Buckets", icon: "\u{1FAA3}", subject: "Language" }] };
const FROST = { key: "frost", E: FROST_ING, goal: { k: "g", name: "Carrots", icon: "\u{1F955}", goal: true }, field: "soloSnow", legField: "soloSnowLeg", sw: "snowSolo", fx: false,
  icon: "\u26C4", title: "Your Snowman", one: "step", many: "steps", One: "Step", verb: "Build", done: "built", cur: "snowflakes", where: "snowman", bossName: "Abominable Snowlotl",
  hide: ["snowball", "cocoa", "earmuffs"], badge: "Snow Sculptor", legLabel: "a Snowmorrow egg", shelfTitle: "Your snowman steps", shelfIcon: "\u26C4", name: "Snowman Building", tabName: "Frostbite Festival", cls: "snowman", ingFor: "snowman", art: "snowman",
  shelf: [
    { n: 3, icon: "\u{1F95A}", label: "an egg" },
    { n: 6, icon: "\u2744\uFE0F", label: "100 snowflakes + 50 XP" },
    { n: 10, icon: "\u{1F3C5}", label: "Snow Sculptor badge + a Legendary egg" },
    { n: 15, icon: "\u2603\uFE0F", label: "a Snowmorrow egg" }] };
const HEART_ING = { key: "solobox", ing: [
  { k: "e", sub: "m", name: "Chocolate", icon: "\u{1F36B}", subject: "Math" },
  { k: "b", sub: "r", name: "Strawberries", icon: "\u{1F353}", subject: "Reading" },
  { k: "s", sub: "l", name: "Cream", icon: "\u{1F95B}", subject: "Language" }] };
const HEART = { key: "heart", E: HEART_ING, goal: { k: "g", name: "Pink Frosting", icon: "\u{1F496}", goal: true }, field: "soloBox", legField: "soloBoxLeg", sw: "boxSolo", fx: false,
  icon: "\u{1F36B}", title: "Your Candy Box", one: "chocolate", many: "chocolates", One: "Chocolate", verb: "Make", done: "made", cur: "hearts", where: "candy box", bossName: "Heartbreaker-otl",
  hide: ["attack", "strawberry", "cupidcrown"], badge: "Master Chocolatier", legLabel: "a Candivora egg", shelfTitle: "Your chocolates", shelfIcon: "\u{1F36B}", name: "Chocolate Making", tabName: "Sweetheart Showdown", cls: "candybox", ingFor: "chocolate", art: "box",
  shelf: [
    { n: 3, icon: "\u{1F95A}", label: "an egg" },
    { n: 6, icon: "\u{1F496}", label: "100 hearts + 50 XP" },
    { n: 10, icon: "\u{1F3C5}", label: "Master Chocolatier badge + a Legendary egg" },
    { n: 15, icon: "\u{1F36B}", label: "a Candivora egg" }] };
JINGLE.ingFor = "gingerbread"; JINGLE.art = "ginger"; HAUNT.ingFor = "potion"; GOBBLE.ingFor = "dish";
HAUNT.name = "Potion Brewing"; HAUNT.tabName = "Haunt-O-Ween"; HAUNT.cls = "potion"; GOBBLE.name = "Feast Cooking"; GOBBLE.tabName = "Gobble-Palooza"; GOBBLE.cls = "feast";
const ALL_ING = k => k.E.ing.concat([k.goal]);
// The ingredients a student uses: the 3 main ingredients, plus the Goal Subject one when they have a Goal Subject.
const ingsFor = (st, k) => goalKey(st) ? ALL_ING(k) : k.E.ing;
const srcName = (st, cls, g) => g.goal ? (SUB_NAMES[goalKey(st)] || "Goal Subject") : SUB_NAMES[subFor(cls, st, g.sub)];
export const SHELF = HAUNT.shelf;
export const soloOn = cls => !!(cls && ((cls.brewSolo && isHaunt(cls)) || (cls.feastSolo && isGobble(cls)) || (cls.gingerSolo && isJingle(cls)) || (cls.snowSolo && isFrost(cls)) || (cls.boxSolo && isHeart(cls))));
const seed = str => { let h = 2166136261; for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619); return ((h >>> 0) % 10007) / 10007; };
// Today's recipe: 1 of each potion ingredient (25 XP each) + 1 Pumpkin Seed (20 Goal Subject XP). Ms. Ariana can change it (cls.soloRecipe[date]).
export function soloRecipe(cls, date) {
  const o = ((cls && cls.soloRecipe) || {})[date];
  if (o) return { e: Math.max(0, Number(o.e) || 0), b: Math.max(0, Number(o.b) || 0), s: Math.max(0, Number(o.s) || 0), g: o.g == null ? 2 : Math.max(0, Number(o.g) || 0) };
  const r = { e: 1, b: 1, s: 1, g: 2 };   // 25 Math + 25 Reading + 25 Language + 45 Goal Subject XP = 120 XP
  return r;
}
// Students can name their cauldron (or feast table, candy box...): saved as name on their solo save (soloBrew.name ...).
export const NAME_MAX = 24;
let naming = "";
export function potNaming(field) { naming = field || ""; }
export function potNameData(st, cls, raw) {
  const k = soloCfg(cls), name = String(raw || "").replace(/\s+/g, " ").trim().slice(0, NAME_MAX), sb = Object.assign({}, soloOf(st, k));
  if (name) sb.name = name; else delete sb.name;
  return { [k.field]: sb };
}
export const soloOf = (st, k) => (st && st[(k || HAUNT).field]) || {};
export const soloTotal = (st, k) => Object.values(soloOf(st, k).days || {}).reduce((a, b) => a + (Number(b) || 0), 0);
export function soloDay(st, cls, date) {
  date = date || azToday();
  const k = soloCfg(cls), need = Object.assign({}, soloRecipe(cls, date)), got = ingOf(k.E, st, date, cls), ex = (soloOf(st, k).extra || {})[date] || {}, have = {}, gk = goalKey(st);
  // Goal ingredient (Pumpkin Seeds / Pie Spice): 1 per SEED_XP of Goal Subject XP. If the Goal Subject already feeds one of the 3 ingredients (Math, Reading or
  // Language, after swaps), the XP that ingredient needs today (usually the first 25) goes to it first, and the goal ingredient counts after that.
  if (gk) { const xp = Number(((((st && st.xpHist) || {})[date] || {}).sub || {})[gk]) || 0, used = k.E.ing.filter(g => subFor(cls, st, g.sub) === gk).reduce((a, g) => a + (need[g.k] || 0) * PER_XP, 0);
    got.g = Math.floor(Math.max(0, xp - used) / SEED_XP); } else got.g = 0;
  if (!gk) need.g = 0;   // no Goal Subject yet: their recipe has no goal ingredient
  ALL_ING(k).forEach(g => { have[g.k] = (got[g.k] || 0) + (Number(ex[g.k]) || 0); });
  const keys = ALL_ING(k).filter(g => need[g.k] > 0);
  const possible = keys.length ? Math.min(...keys.map(g => Math.floor(have[g.k] / need[g.k]))) : 0;
  const made = Number((soloOf(st, k).days || {})[date]) || 0;
  // what's left toward the next one, after the ones already made
  const left = {}; ALL_ING(k).forEach(g => { left[g.k] = Math.max(0, have[g.k] - made * need[g.k]); });
  return { date, need, have, left, made, ready: Math.max(0, possible - made), total: soloTotal(st, k) };
}
export const soloReady = (st, cls) => soloOn(cls) ? soloDay(st, cls).ready : 0;

// The student's data change for brewing/cooking one (null if none is ready). Also returns the shelf rewards it unlocked.
export function brewOne(st, cls) {
  const d = soloDay(st, cls); if (!d.ready) return null;
  const k = soloCfg(cls), sb = soloOf(st, k), n = d.total + 1, date = d.date;
  const fx = k.fx ? EFFECTS[Math.floor(seed(date + ":" + st.id + ":" + n) * EFFECTS.length) % EFFECTS.length].k : null;
  const got = Object.assign({}, sb.got || {}), won = [];
  const nb = Object.assign({}, sb, { days: Object.assign({}, sb.days || {}, { [date]: d.made + 1 }), got });
  if (fx) nb.fx = Object.assign({}, sb.fx || {}, { [date]: fx });
  const data = { [k.field]: nb, candyBonus: (Number(st.candyBonus) || 0) + POTION_CANDY };
  k.shelf.forEach(m => {
    if (n < m.n || got[m.n]) return;
    got[m.n] = true; won.push(m);
    if (m.n === 3) data.doorEggs = (Number(st.doorEggs) || 0) + 1;
    if (m.n === 6) { data.candyBonus += 100; data.doorXP = (Number(st.doorXP) || 0) + 50; }
    if (m.n === 10) data.legendaryPulls = (Number(st.legendaryPulls) || 0) + 1;
    if (m.n === 15) data[k.legField] = (Number(st[k.legField]) || 0) + 1;
  });
  return { data, n, fx: fx ? effect(fx) : null, won, cfg: k };
}
// In solo mode there's no boss, so prizes that power boss attacks (an extra attack, a +10-damage brew) give a Free Ingredient instead.
// Swaps the present in place (r is what gets saved, so it shows the same later), adds the ingredient to data. Returns true if swapped.
export function soloSwap(r, st, cls, data) {
  if (!soloOn(cls) || !r) return false;
  const map = { attack: "ing", brew: "ing", g2: "g2i", g3: "g3i" };
  if (!map[r.id]) return false;
  const k = soloCfg(cls), fi = freeIngredient(Object.assign({}, st, data), cls);
  Object.assign(data, fi.data);
  r.from = r.id; r.id = map[r.id]; r.ing = { icon: fi.g.icon, name: fi.g.name, where: k.where };
  return true;
}
// A Free Ingredient from the wheel: the one the student needs most for their next potion/dish.
export function freeIngredient(st, cls) {
  const k = soloCfg(cls), d = soloDay(st, cls), sb = soloOf(st, k);
  const g = ingsFor(st, k).filter(x => d.need[x.k] > 0).sort((a, b) => (d.left[a.k] - d.need[a.k]) - (d.left[b.k] - d.need[b.k]))[0] || k.E.ing[0];
  const ex = Object.assign({}, (sb.extra || {})[d.date] || {}); ex[g.k] = (Number(ex[g.k]) || 0) + 1;
  return { g, data: { [k.field]: Object.assign({}, sb, { extra: Object.assign({}, sb.extra || {}, { [d.date]: ex }) }) } };
}

const bar = (have, need) => '<span class="pbar"><span style="width:' + Math.min(100, need ? have / need * 100 : 100) + '%"></span></span>';
export function soloCard(st, cls, flash) {
  const k = soloCfg(cls), d = soloDay(st, cls), fxk = (soloOf(st, k).fx || {})[d.date], fx = fxk ? effect(fxk) : null, ings = ingsFor(st, k);
  const c = { E: k.E, team: { id: "solo-" + st.id }, have: d.left, brewed: d.made > 0 && !d.ready };
  const pic = k.key === "gobble" ? soloTableHTML("solo-" + st.id, d.total, c.brewed) : k.art === "box" ? soloBoxHTML("solo-" + st.id, d.total, c.brewed) : k.art ? soloHouseHTML("solo-" + st.id, d.total, k.art === "snowman" ? "snowman" : "ginger") : cauldronHTML(c);
  const nm = soloOf(st, k).name;
  let h = '<div class="card potion tev-' + k.cls + ' solobrew"><div class="card-head"><h2>' + k.icon + " " + (nm ? esc(nm) : k.title) + '</h2><span class="fact">' + d.total + " " + (d.total === 1 ? k.one : k.many) + " " + k.done + "</span></div>" +
    (naming === k.field
      ? '<div class="row potname" style="gap:8px;align-items:center;margin:4px 0 8px;"><input id="potNameIn" type="text" maxlength="' + NAME_MAX + '" placeholder="Name your ' + k.where + '" value="' + esc(nm || "") + '" style="flex:1;min-width:160px">' +
        '<button class="btn small" data-act="potNameSave">Save</button><button class="btn ghost small" data-act="potNameCancel">Cancel</button></div>'
      : '<p class="small" style="margin:0 0 6px;"><button class="btn ghost small" data-act="potName">\u270F\uFE0F ' + (nm ? "Rename your " + k.where : "Name your " + k.where) + "</button></p>") +
    pic +
    '<p class="lede" style="margin:8px 0;text-align:center;"><b>Today’s recipe</b>: ' + ings.filter(g => d.need[g.k]).map(g => d.need[g.k] + " " + g.icon + " " + g.name).join(" + ") + "</p>";
  h += '<div class="recipe">' + ings.filter(g => d.need[g.k]).map(g => { const sub = srcName(st, cls, g) + (g.goal ? " \u00b7 your Goal Subject" : ""), hv = Math.min(d.left[g.k], d.need[g.k]);
    return '<div class="pring"><span class="ri-ic">' + g.icon + '</span><span class="ri-nm">' + g.name + " <small>(" + esc(sub) + ")</small></span>" + bar(hv, d.need[g.k]) +
      '<b class="ri-n">' + d.left[g.k] + " / " + d.need[g.k] + (d.left[g.k] >= d.need[g.k] ? " ✅" : "") + "</b></div>"; }).join("") + "</div>";
  if (d.ready) h += '<div style="text-align:center;margin:12px 0;"><button class="attackbtn" data-act="soloBrew">' + k.icon + " " + k.verb + " a " + k.one + "!" + (d.ready > 1 ? " (" + d.ready + " ready)" : "") + "</button></div>";
  else {
    const g = ings.filter(x => d.need[x.k] && d.left[x.k] < d.need[x.k]).map(x => Math.ceil((d.need[x.k] - d.left[x.k]) * (x.goal ? SEED_XP : PER_XP)) + " more " + srcName(st, cls, x) + " XP");
    h += '<p class="small" style="text-align:center;margin:10px 0;">' + (d.made ? "✨ You " + k.done + " " + d.made + " " + (d.made === 1 ? k.one : k.many) + " today! " : "") + "Next " + k.one + ": earn <b>" + g.join("</b> and <b>") + "</b>.</p>";
  }
  if (fx) h += '<div class="banner info" style="margin:8px 0;">✨ Your companion is glowing with a <b>' + fx.icon + " " + esc(fx.name) + "</b> today!</div>";
  // shelf
  const shown = Math.min(d.total, 15), dish = i => k.key === "gobble" ? '<img src="assets/feast/' + DISHES[i % DISHES.length].k + '.webp" alt="" style="width:100%;height:100%;object-fit:contain" onerror="this.replaceWith(document.createTextNode(\'\\u{1F37D}\\uFE0F\'))">' : k.key === "jingle" ? "\u{1F36A}" : k.key === "frost" ? "\u26C4" : k.key === "heart" ? "\u{1F36B}" : "\u{1F9EA}";
  h += '<h3 style="margin-top:14px;">' + (k.key === "gobble" ? "\u{1F9C2}" : k.key === "jingle" ? "\u{1F381}" : k.key === "frost" ? "\u2744\uFE0F" : k.key === "heart" ? "\u{1F36C}" : "\u{1F9F4}") + " " + k.shelfTitle + '</h3><div class="pshelf">' + Array.from({ length: 15 }, (_, i) => '<span class="' + (i < shown ? "on" : "") + (k.shelf.some(m => m.n === i + 1) ? " goal" : "") + '">' + (i < shown ? dish(i) : k.shelf.some(m => m.n === i + 1) ? k.shelf.find(m => m.n === i + 1).icon : "") + "</span>").join("") +
    (d.total > 15 ? '<span class="more">+' + (d.total - 15) + "</span>" : "") + "</div>";
  h += '<ul class="pmiles">' + k.shelf.map(m => '<li class="' + (d.total >= m.n ? "done" : "") + '"><b>' + m.n + " " + k.many + "</b>: " + m.icon + " " + m.label + (d.total >= m.n ? " ✅" : " (" + (m.n - d.total) + " to go)") + "</li>").join("") + "</ul>";
  const mySw = k.E.ing.filter(g => subFor(cls, st, g.sub) !== g.sub);
  if (mySw.length) h += '<p class="small" style="margin-top:8px;">\u{1F501} <b>Just for you:</b> ' + mySw.map(g => g.icon + " " + g.name + " come from <b>" + SUB_NAMES[subFor(cls, st, g.sub)] + "</b>").join(" · ") + ".</p>";
  h += '<p class="muted small" style="margin-top:8px;">Every ' + PER_XP + " XP = 1 ingredient: " + ings.filter(g => !g.goal).map(g => esc(srcName(st, cls, g)) + " = " + g.icon + " " + g.name).join(", ") + (goalKey(st) ? ". Every " + (2 * SEED_XP) + " " + esc(srcName(st, cls, k.goal)) + " XP (your Goal Subject) = 2 " + k.goal.icon + " " + k.goal.name + (k.E.ing.some(g => subFor(cls, st, g.sub) === goalKey(st)) ? ", counted after the XP your other ingredient needs" : "") : "") +
    ". Each " + k.one + " gives +" + POTION_CANDY + " " + k.cur + ". " + k.verb + " as many as you can! A new recipe comes every day, and leftover ingredients don’t carry over.</p>";
  return h + "</div>";
}

// Teacher: on/off, today's recipe, subject swaps and the class shelf.
export function soloAdmin(students, cls, today) {
  const k = soloCfg(cls), on = !!cls[k.sw], r = soloRecipe(cls, today), sw = cls.subSwap || {}, kids = students.filter(x => x.companionId).slice().sort((a, b) => String(a.fullName || a.name).localeCompare(String(b.fullName || b.name)));
  let h = '<div class="card"><div class="card-head"><h2>' + k.icon + " Solo " + k.name + '</h2><span class="fact">' + (on ? "ON · " + k.bossName + " hidden" : "off") + "</span></div>" +
    '<p class="lede" style="margin-bottom:10px;">Turn this on to swap the ' + k.bossName + ' battle for solo ' + k.name.toLowerCase() + ' on the ' + k.tabName + ' tab. ' + (k.key === "gobble" ? "Corn, the Gobble Shop and the Pie Wheel" : k.key === "frost" ? "Snowflakes, the Snow Shop and the Blizzard Wheel" : k.key === "heart" ? "Hearts, the Sweet Shop and the Sweetheart Spinner" : k.key === "jingle" ? "Presents, the Jingle shop and the Present Wheel" : "Candy, the Candy Shop and the wheel") + ' stay. The ' + k.bossName + ' keeps its HP for later.</p>' +
    '<button class="btn' + (on ? " ghost" : "") + '" data-act="soloToggle">' + (on ? "\u{1F47B} Switch back to the " + k.bossName + " battle" : k.icon + " Turn on Solo " + k.name) + "</button>";
  if (!on) return h + "</div>";
  h += '<h3 style="margin-top:14px;">Today’s recipe</h3><div class="row" style="gap:10px;align-items:center;">' +
    ALL_ING(k).map(g => '<label class="small">' + g.icon + " " + g.name + (g.goal ? " (Goal Subject)" : "") + ' <input id="soloR-' + g.k + '" type="number" min="0" max="9" value="' + r[g.k] + '" style="width:60px"></label>').join("") +
    '<button class="btn small" data-act="soloRecipe">Save today’s recipe</button></div><p class="muted small">Every ' + PER_XP + " XP in Math, Reading or Language = 1 ingredient, and every " + (2 * SEED_XP) + " Goal Subject XP = 2 " + k.goal.icon + " " + k.goal.name + " (counted after the first 25 if the Goal Subject is Math, Reading or Language). The normal recipe is 120 XP = 1 " + k.one + ".</p>";
  h += '<h3 style="margin-top:14px;">Students</h3><div class="scroll-x"><table class="tbl"><thead><tr><th>Student</th><th>' + k.One + "s</th><th>Today</th>" + k.E.ing.map(g => "<th>" + g.icon + " from</th>").join("") + "<th>" + k.goal.icon + " Goal Subject</th></tr></thead><tbody>" +
    kids.map(x => { const d = soloDay(x, cls, today), t = d.total;
      return "<tr><td><b>" + esc(x.name) + "</b></td><td>" + t + " " + k.shelf.filter(m => t >= m.n).map(m => m.icon).join("") + "</td><td>" + d.made + (d.ready ? " (+" + d.ready + " ready)" : "") + "</td>" +
        k.E.ing.map(g => { const cur = (sw[x.id] || {})[g.sub] || ""; return '<td><select data-subswap="' + x.id + ":" + g.sub + '"><option value="">' + SUB_NAMES[g.sub] + "</option>" +
          Object.entries(SUB_NAMES).filter(([kk]) => kk !== g.sub).map(([kk, n]) => '<option value="' + kk + '"' + (cur === kk ? " selected" : "") + ">" + n + "</option>").join("") + "</select></td>"; }).join("") +
        "<td>" + (x.goalSubject ? esc(x.goalSubject) : '<span class="muted">not set</span>') + "</td></tr>"; }).join("") +
    "</tbody></table></div><p class=\"muted small\">Change a subject to swap where that student’s ingredient comes from. " + k.goal.icon + " " + k.goal.name + " come from each student’s Goal Subject (the one their doors use); change it in the Students tab. Students with no Goal Subject skip " + k.goal.name + ".</p>";
  return h + "</div>";
}
