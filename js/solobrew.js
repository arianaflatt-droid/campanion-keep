/* ---------- 🧪 Solo Potion Brewing (Haunt-O-Ween, in place of the Ghost-olotl battle) ----------
   Ms. Ariana turns it on in Events (cls.brewSolo = true). The Haunt-O-Ween tab then shows each student's own cauldron
   instead of the boss. Ingredients come from that day's subject XP (every 25 XP = 1; Math = Eyeballs, Reading = Bat Wings,
   Language = Spider Legs; cls.subSwap swaps a student's subject; 🎃 Pumpkin Seeds = the student's Goal Subject from their doors), plus Free Ingredients from the wheel.
   One recipe for the whole class each day (about 1 potion a day), unlimited potions. Leftovers don't carry over.
   Each potion: +20 candy and a potion glow for the day. Shelf rewards at 3 / 6 / 10 / 15 potions.
   Saved on the student (student-writable): soloBrew = { days: { date: potions }, fx: { date: effect }, extra: { date: { e|b|s: n } }, got: { "3": true, ... } }
   Shelf rewards use fields the student page may write: doorEggs, candyBonus, doorXP, legendaryPulls, soloBrewLeg (counted by brewLegLeft). */
import { esc, isHaunt } from "./game.js?v=20261017a";
import { azToday } from "./collect.js?v=20261017a";
import { TEAM_EVENTS, ingOf, subFor, SUB_NAMES, PER_XP, EFFECTS, effect, cauldronHTML } from "./teams.js?v=20261017a";
import { SUBJECT_KEYS } from "./doors.js?v=20261017a";

export const BREW = TEAM_EVENTS.potion;
// The 4th ingredient comes from each student's own Goal Subject (the one their Daily Doors use, set in the Students tab).
export const GOAL_ING = { k: "g", name: "Pumpkin Seeds", icon: "\u{1F383}", goal: true };
export const SEED_XP = 22.5;   // Goal Subject XP per Pumpkin Seed: 2 seeds = 45 XP, so a potion = 25 + 25 + 25 + 45 = 120 XP
export const goalKey = st => SUBJECT_KEYS[String((st && st.goalSubject) || "").trim().toLowerCase()] || null;
const ALL_ING = () => BREW.ing.concat([GOAL_ING]);
// The ingredients a student uses: the 3 potion ingredients, plus Pumpkin Seeds when they have a Goal Subject.
const ingsFor = st => goalKey(st) ? ALL_ING() : BREW.ing;
const srcName = (st, cls, g) => g.goal ? (SUB_NAMES[goalKey(st)] || "Goal Subject") : SUB_NAMES[subFor(cls, st, g.sub)];
export const POTION_CANDY = 20;
export const SHELF = [
  { n: 3, icon: "\u{1F95A}", label: "an egg" },
  { n: 6, icon: "\u{1F36C}", label: "100 candy + 50 XP" },
  { n: 10, icon: "\u{1F3C5}", label: "Master Brewer badge + a Legendary egg" },
  { n: 15, icon: "\u{1F9EA}", label: "a Brewraith egg" }
];
export const soloOn = cls => !!(cls && cls.brewSolo) && isHaunt(cls);
const seed = str => { let h = 2166136261; for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619); return ((h >>> 0) % 10007) / 10007; };
// Today's recipe: 1 of each potion ingredient (25 XP each) + 1 Pumpkin Seed (20 Goal Subject XP). Ms. Ariana can change it (cls.soloRecipe[date]).
export function soloRecipe(cls, date) {
  const o = ((cls && cls.soloRecipe) || {})[date];
  if (o) return { e: Math.max(0, Number(o.e) || 0), b: Math.max(0, Number(o.b) || 0), s: Math.max(0, Number(o.s) || 0), g: o.g == null ? 2 : Math.max(0, Number(o.g) || 0) };
  const r = { e: 1, b: 1, s: 1, g: 2 };   // 25 Math + 25 Reading + 25 Language + 45 Goal Subject XP = 120 XP
  return r;
}
export const soloOf = st => (st && st.soloBrew) || {};
export const soloTotal = st => Object.values(soloOf(st).days || {}).reduce((a, b) => a + (Number(b) || 0), 0);
export function soloDay(st, cls, date) {
  date = date || azToday();
  const need = Object.assign({}, soloRecipe(cls, date)), got = ingOf(BREW, st, date, cls), ex = (soloOf(st).extra || {})[date] || {}, have = {}, gk = goalKey(st);
  // Pumpkin Seeds: 1 per SEED_XP of Goal Subject XP. If the Goal Subject already feeds one of the 3 ingredients (Math, Reading or
  // Language, after swaps), the XP that ingredient needs today (usually the first 25) goes to it first, and seeds count after that.
  if (gk) { const xp = Number(((((st && st.xpHist) || {})[date] || {}).sub || {})[gk]) || 0, used = BREW.ing.filter(g => subFor(cls, st, g.sub) === gk).reduce((a, g) => a + (need[g.k] || 0) * PER_XP, 0);
    got.g = Math.floor(Math.max(0, xp - used) / SEED_XP); } else got.g = 0;
  if (!gk) need.g = 0;   // no Goal Subject yet: their recipe has no Pumpkin Seeds
  ALL_ING().forEach(g => { have[g.k] = (got[g.k] || 0) + (Number(ex[g.k]) || 0); });
  const keys = ALL_ING().filter(g => need[g.k] > 0);
  const possible = keys.length ? Math.min(...keys.map(g => Math.floor(have[g.k] / need[g.k]))) : 0;
  const made = Number((soloOf(st).days || {})[date]) || 0;
  // what's left toward the next potion, after the ones already brewed
  const left = {}; ALL_ING().forEach(g => { left[g.k] = Math.max(0, have[g.k] - made * need[g.k]); });
  return { date, need, have, left, made, ready: Math.max(0, possible - made), total: soloTotal(st) };
}
export const soloReady = (st, cls) => soloOn(cls) ? soloDay(st, cls).ready : 0;

// The student's data change for brewing one potion (null if none is ready). Also returns the shelf rewards it unlocked.
export function brewOne(st, cls) {
  const d = soloDay(st, cls); if (!d.ready) return null;
  const sb = soloOf(st), n = d.total + 1, date = d.date;
  const fx = EFFECTS[Math.floor(seed(date + ":" + st.id + ":" + n) * EFFECTS.length) % EFFECTS.length].k;
  const got = Object.assign({}, sb.got || {}), won = [];
  const data = { soloBrew: Object.assign({}, sb, { days: Object.assign({}, sb.days || {}, { [date]: d.made + 1 }), fx: Object.assign({}, sb.fx || {}, { [date]: fx }), got }),
    candyBonus: (Number(st.candyBonus) || 0) + POTION_CANDY };
  SHELF.forEach(m => {
    if (n < m.n || got[m.n]) return;
    got[m.n] = true; won.push(m);
    if (m.n === 3) data.doorEggs = (Number(st.doorEggs) || 0) + 1;
    if (m.n === 6) { data.candyBonus += 100; data.doorXP = (Number(st.doorXP) || 0) + 50; }
    if (m.n === 10) data.legendaryPulls = (Number(st.legendaryPulls) || 0) + 1;
    if (m.n === 15) data.soloBrewLeg = (Number(st.soloBrewLeg) || 0) + 1;
  });
  return { data, n, fx: effect(fx), won };
}
// A Free Ingredient from the wheel: the one the student needs most for their next potion.
export function freeIngredient(st, cls) {
  const d = soloDay(st, cls), sb = soloOf(st);
  const g = ingsFor(st).filter(x => d.need[x.k] > 0).sort((a, b) => (d.left[a.k] - d.need[a.k]) - (d.left[b.k] - d.need[b.k]))[0] || BREW.ing[0];
  const ex = Object.assign({}, (sb.extra || {})[d.date] || {}); ex[g.k] = (Number(ex[g.k]) || 0) + 1;
  return { g, data: { soloBrew: Object.assign({}, sb, { extra: Object.assign({}, sb.extra || {}, { [d.date]: ex }) }) } };
}

const bar = (have, need) => '<span class="pbar"><span style="width:' + Math.min(100, need ? have / need * 100 : 100) + '%"></span></span>';
export function soloCard(st, cls, flash) {
  const d = soloDay(st, cls), fxk = (soloOf(st).fx || {})[d.date], fx = fxk ? effect(fxk) : null;
  const c = { E: BREW, team: { id: "solo-" + st.id }, have: d.left, brewed: d.made > 0 && !d.ready };
  let h = '<div class="card potion tev-potion solobrew"><div class="card-head"><h2>\u{1F9EA} Your Potion Cauldron</h2><span class="fact">' + d.total + " potion" + (d.total === 1 ? "" : "s") + " brewed</span></div>" +
    cauldronHTML(c) +
    '<p class="lede" style="margin:8px 0;text-align:center;"><b>Today’s recipe</b>: ' + ingsFor(st).filter(g => d.need[g.k]).map(g => d.need[g.k] + " " + g.icon + " " + g.name).join(" + ") + "</p>";
  h += '<div class="recipe">' + ingsFor(st).filter(g => d.need[g.k]).map(g => { const sub = srcName(st, cls, g) + (g.goal ? " \u00b7 your Goal Subject" : ""), hv = Math.min(d.left[g.k], d.need[g.k]);
    return '<div class="pring"><span class="ri-ic">' + g.icon + '</span><span class="ri-nm">' + g.name + " <small>(" + esc(sub) + ")</small></span>" + bar(hv, d.need[g.k]) +
      '<b class="ri-n">' + d.left[g.k] + " / " + d.need[g.k] + (d.left[g.k] >= d.need[g.k] ? " ✅" : "") + "</b></div>"; }).join("") + "</div>";
  if (d.ready) h += '<div style="text-align:center;margin:12px 0;"><button class="attackbtn" data-act="soloBrew">\u{1F9EA} Brew a potion!' + (d.ready > 1 ? " (" + d.ready + " ready)" : "") + "</button></div>";
  else {
    const g = ingsFor(st).filter(x => d.need[x.k] && d.left[x.k] < d.need[x.k]).map(x => Math.ceil((d.need[x.k] - d.left[x.k]) * (x.goal ? SEED_XP : PER_XP)) + " more " + srcName(st, cls, x) + " XP");
    h += '<p class="small" style="text-align:center;margin:10px 0;">' + (d.made ? "✨ You brewed " + d.made + " potion" + (d.made === 1 ? "" : "s") + " today! " : "") + "Next potion: earn <b>" + g.join("</b> and <b>") + "</b>.</p>";
  }
  if (fx) h += '<div class="banner info" style="margin:8px 0;">✨ Your companion is glowing with a <b>' + fx.icon + " " + esc(fx.name) + "</b> today!</div>";
  // shelf
  const shown = Math.min(d.total, 15);
  h += '<h3 style="margin-top:14px;">\u{1F9F4} Your potion shelf</h3><div class="pshelf">' + Array.from({ length: 15 }, (_, i) => '<span class="' + (i < shown ? "on" : "") + (SHELF.some(m => m.n === i + 1) ? " goal" : "") + '">' + (i < shown ? "\u{1F9EA}" : SHELF.some(m => m.n === i + 1) ? SHELF.find(m => m.n === i + 1).icon : "") + "</span>").join("") +
    (d.total > 15 ? '<span class="more">+' + (d.total - 15) + "</span>" : "") + "</div>";
  h += '<ul class="pmiles">' + SHELF.map(m => '<li class="' + (d.total >= m.n ? "done" : "") + '"><b>' + m.n + " potions</b>: " + m.icon + " " + m.label + (d.total >= m.n ? " ✅" : " (" + (m.n - d.total) + " to go)") + "</li>").join("") + "</ul>";
  const mySw = BREW.ing.filter(g => subFor(cls, st, g.sub) !== g.sub);
  if (mySw.length) h += '<p class="small" style="margin-top:8px;">\u{1F501} <b>Just for you:</b> ' + mySw.map(g => g.icon + " " + g.name + " come from <b>" + SUB_NAMES[subFor(cls, st, g.sub)] + "</b>").join(" · ") + ".</p>";
  h += '<p class="muted small" style="margin-top:8px;">Every ' + PER_XP + " XP = 1 ingredient: " + ingsFor(st).filter(g => !g.goal).map(g => esc(srcName(st, cls, g)) + " = " + g.icon + " " + g.name).join(", ") + (goalKey(st) ? ". Every " + (2 * SEED_XP) + " " + esc(srcName(st, cls, GOAL_ING)) + " XP (your Goal Subject) = 2 " + GOAL_ING.icon + " " + GOAL_ING.name + (BREW.ing.some(g => subFor(cls, st, g.sub) === goalKey(st)) ? ", counted after the XP your other ingredient needs" : "") : "") +
    ". Each potion gives +" + POTION_CANDY + " candy. Brew as many as you can! A new recipe comes every day, and leftover ingredients don’t carry over.</p>";
  return h + "</div>";
}

// Teacher: on/off, today's recipe, subject swaps and the class shelf.
export function soloAdmin(students, cls, today) {
  const on = !!cls.brewSolo, r = soloRecipe(cls, today), sw = cls.subSwap || {}, kids = students.filter(x => x.companionId).slice().sort((a, b) => String(a.fullName || a.name).localeCompare(String(b.fullName || b.name)));
  let h = '<div class="card"><div class="card-head"><h2>\u{1F9EA} Solo Potion Brewing</h2><span class="fact">' + (on ? "ON · Ghost-olotl hidden" : "off") + "</span></div>" +
    '<p class="lede" style="margin-bottom:10px;">Turn this on to swap the Ghost-olotl battle for solo potion brewing on the Haunt-O-Ween tab. Candy, the Candy Shop and the wheel stay. The Ghost-olotl keeps its HP for later.</p>' +
    '<button class="btn' + (on ? " ghost" : "") + '" data-act="soloToggle">' + (on ? "\u{1F47B} Switch back to the Ghost-olotl battle" : "\u{1F9EA} Turn on Solo Potion Brewing") + "</button>";
  if (!on) return h + "</div>";
  h += '<h3 style="margin-top:14px;">Today’s recipe</h3><div class="row" style="gap:10px;align-items:center;">' +
    ALL_ING().map(g => '<label class="small">' + g.icon + " " + g.name + (g.goal ? " (Goal Subject)" : "") + ' <input id="soloR-' + g.k + '" type="number" min="0" max="9" value="' + r[g.k] + '" style="width:60px"></label>').join("") +
    '<button class="btn small" data-act="soloRecipe">Save today’s recipe</button></div><p class="muted small">Every ' + PER_XP + " XP in Math, Reading or Language = 1 ingredient, and every " + (2 * SEED_XP) + " Goal Subject XP = 2 \u{1F383} Pumpkin Seeds (counted after the first 25 if the Goal Subject is Math, Reading or Language). The normal recipe is 120 XP = 1 potion.</p>";
  h += '<h3 style="margin-top:14px;">Students</h3><div class="scroll-x"><table class="tbl"><thead><tr><th>Student</th><th>Potions</th><th>Today</th>' + BREW.ing.map(g => "<th>" + g.icon + " from</th>").join("") + "<th>" + GOAL_ING.icon + " Goal Subject</th></tr></thead><tbody>" +
    kids.map(x => { const d = soloDay(x, cls, today), t = d.total;
      return "<tr><td><b>" + esc(x.name) + "</b></td><td>" + t + " " + SHELF.filter(m => t >= m.n).map(m => m.icon).join("") + "</td><td>" + d.made + (d.ready ? " (+" + d.ready + " ready)" : "") + "</td>" +
        BREW.ing.map(g => { const cur = (sw[x.id] || {})[g.sub] || ""; return '<td><select data-subswap="' + x.id + ":" + g.sub + '"><option value="">' + SUB_NAMES[g.sub] + "</option>" +
          Object.entries(SUB_NAMES).filter(([k]) => k !== g.sub).map(([k, n]) => '<option value="' + k + '"' + (cur === k ? " selected" : "") + ">" + n + "</option>").join("") + "</select></td>"; }).join("") +
        "<td>" + (x.goalSubject ? esc(x.goalSubject) : '<span class="muted">not set</span>') + "</td></tr>"; }).join("") +
    "</tbody></table></div><p class=\"muted small\">Change a subject to swap where that student’s ingredient comes from. \u{1F383} Pumpkin Seeds come from each student’s Goal Subject (the one their doors use); change it in the Students tab. Students with no Goal Subject skip Pumpkin Seeds.</p>";
  return h + "</div>";
}
