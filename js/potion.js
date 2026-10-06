/* ---------- Potion Brewing Teams (Haunt-O-Ween) ----------
   The teacher makes teams. Every day the game picks a recipe (scaled to team size).
   Ingredients come from the pasted subject XP:  25 Math XP = 1 👁️ Eyeball, 25 Reading XP = 1 🦇 Bat Wing, 25 Language XP = 1 🕷️ Spider Leg.
   Teammates' ingredients go into one cauldron for the day. When it has everything the recipe needs, the potion is brewed and
   every teammate gets candy, XP, an egg and a one-day potion effect (their companion glows). Rewards are given once per day.
   Saved on the class:
     potionOn:     the switch (only works while Haunt-O-Ween is on)
     potionTeams:  [{ id, name, members: [studentId, ...] }]
     potionRecipe: { "2026-10-07": { teamId: { e, b, s } } }   recipes the teacher changed (others are picked by the game)
     potionBrews:  { "2026-10-07": [teamId, ...] }               teams that brewed that day
     potionTop:    { at, teams: [teamId] }                       the top team(s) got the special Legendary egg
   Saved on the student:
     potionDays:   { "2026-10-07": { fx, team } }                potions brewed (rewards given) + that day's effect
     potionLegEggs: special Legendary eggs from being on the top team */
import { isHaunt, esc } from "./game.js?v=20261006f";
import { azToday } from "./collect.js?v=20261006f";

export const INGREDIENTS = [
  { k: "e", sub: "m", name: "Eyeballs", one: "Eyeball", icon: "\u{1F441}️", subject: "Math" },
  { k: "b", sub: "r", name: "Bat Wings", one: "Bat Wing", icon: "\u{1F987}", subject: "Reading" },
  { k: "s", sub: "l", name: "Spider Legs", one: "Spider Leg", icon: "\u{1F577}️", subject: "Language" }
];
export const PER_XP = 25;
export const POTION_CANDY = 30, POTION_XP = 50, POTION_EGGS = 1, MASTER_BREWS = 3;
// The special Legendary the top team wins at the end of Haunt-O-Ween (family id, e.g. "L-33"). Set when the creature is added.
export const POTION_LEGENDARY = "L-33";   // Brewraith
export const EFFECTS = [
  { k: "glow", name: "Glow Potion", icon: "\u{1F49C}" },
  { k: "shadow", name: "Shadow Potion", icon: "\u{1F5A4}" },
  { k: "pumpkin", name: "Pumpkin Potion", icon: "\u{1F9E1}" },
  { k: "slime", name: "Slime Potion", icon: "\u{1F49A}" },
  { k: "frost", name: "Frost Potion", icon: "\u{1FA75}" }
];
export const effect = k => EFFECTS.find(x => x.k === k) || EFFECTS[0];

export const potionOn = cls => !!(cls && cls.potionOn) && isHaunt(cls);
export const teams = cls => ((cls && cls.potionTeams) || []).filter(t => t && t.id);
export const teamById = (cls, id) => teams(cls).find(t => t.id === id) || null;
export const teamOf = (cls, sid) => teams(cls).find(t => (t.members || []).includes(sid)) || null;

// A steady "random" number 0–1 from a piece of text (the same day always gets the same recipe).
function seed(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619); return ((h >>> 0) % 10007) / 10007; }
export function autoRecipe(n, date) {
  const r = {}; INGREDIENTS.forEach(g => { r[g.k] = Math.max(1, Math.round(Math.max(1, n) * (0.5 + 0.6 * seed(date + ":" + g.k)))); }); return r;
}
export function recipeFor(cls, team, date) {
  const o = (((cls && cls.potionRecipe) || {})[date] || {})[team.id];
  return o ? INGREDIENTS.reduce((r, g) => (r[g.k] = Math.max(0, Number(o[g.k]) || 0), r), {}) : autoRecipe((team.members || []).length, date);
}
export const recipeChanged = (cls, team, date) => !!(((cls && cls.potionRecipe) || {})[date] || {})[team.id];

// One student's ingredients for a day (from the subject XP saved by the paste).
export function ingOf(st, date) {
  const s = ((((st && st.xpHist) || {})[date] || {}).sub) || {};
  return INGREDIENTS.reduce((r, g) => (r[g.k] = Math.floor((Number(s[g.sub]) || 0) / PER_XP), r), {});
}
// The team's cauldron: what each member added, the totals, what's needed and whether it's brewed.
export function cauldron(cls, team, students, date) {
  const need = recipeFor(cls, team, date), have = { e: 0, b: 0, s: 0 };
  const rows = (team.members || []).map(id => students.find(x => x.id === id)).filter(Boolean).map(st => {
    const g = ingOf(st, date); INGREDIENTS.forEach(x => { have[x.k] += g[x.k]; }); return { st, g };
  });
  const ready = INGREDIENTS.every(x => have[x.k] >= need[x.k]);
  const brewed = (((cls && cls.potionBrews) || {})[date] || []).includes(team.id);
  return { team, need, have, rows, ready, brewed };
}
export const brewCount = (cls, teamId) => Object.values((cls && cls.potionBrews) || {}).filter(l => (l || []).includes(teamId)).length;
export const potionsOf = st => Object.keys((st && st.potionDays) || {}).length;
export function standings(cls) {
  return teams(cls).map(t => ({ t, n: brewCount(cls, t.id) })).sort((a, b) => b.n - a.n || a.t.name.localeCompare(b.t.name));
}
export function topTeams(cls) {
  const st = standings(cls), best = st.length ? st[0].n : 0; return best > 0 ? st.filter(x => x.n === best).map(x => x.t) : [];
}
// Today's potion effect on a student (null if none). Used for the companion glow.
export function fxToday(st) { const d = ((st && st.potionDays) || {})[azToday()]; return d && d.fx ? effect(d.fx) : null; }

/* Called by the teacher console after a paste is saved (students already hold the new xpHist).
   Returns the student updates to write, the class update, and how many teams brewed. Never rewards a student twice for a day. */
export function brewRewards(cls, students, date) {
  if (!potionOn(cls)) return null;
  const brews = Object.assign({}, cls.potionBrews || {}), list = [...(brews[date] || [])], updates = [], newTeams = [];
  teams(cls).forEach(t => {
    const c = cauldron(cls, t, students, date);
    if (!c.ready) return;
    if (!list.includes(t.id)) { list.push(t.id); newTeams.push(t); }
    c.rows.forEach(({ st }) => {
      if (((st.potionDays || {})[date])) return;
      const fx = EFFECTS[Math.floor(seed(date + ":" + st.id + ":fx") * EFFECTS.length) % EFFECTS.length].k;
      updates.push({ st, data: {
        ["potionDays." + date]: { fx, team: t.id, at: new Date().toISOString() },
        candyBonus: (Number(st.candyBonus) || 0) + POTION_CANDY,
        bonusXP: (Number(st.bonusXP) || 0) + POTION_XP,
        bonusPulls: (Number(st.bonusPulls) || 0) + POTION_EGGS
      } });
    });
  });
  brews[date] = list;
  return { updates, classData: newTeams.length ? { potionBrews: brews } : null, newTeams };
}

/* The cauldron picture: swirling liquid with the team's ingredients floating in it (up to 4 of each).
   Uses assets/potion/cauldron.webp when that file exists, otherwise a drawn pot. Ingredients added since the last look drop in. */
export const CAULDRON_ART = "assets/potion/cauldron.webp", CAULDRON_BREWED = "assets/potion/cauldron-brewed.webp";
// where each floating ingredient sits on the liquid (-1..1 across and down the liquid's oval)
const SPOTS = [[-0.35, -0.1], [0.2, 0.25], [-0.05, -0.45], [0.5, -0.15], [-0.62, 0.2], [0.05, 0.55], [-0.3, 0.5], [0.3, -0.5], [0.68, 0.25], [-0.55, -0.4], [0.25, 0], [-0.1, 0.15]];
const seenFloat = {};
export function cauldronHTML(c) {
  const items = [];
  for (let n = 0; n < 4; n++) INGREDIENTS.forEach(g => { if (c.have[g.k] > n) items.push(g); });
  const was = seenFloat[c.team.id] || 0; seenFloat[c.team.id] = items.length;
  return '<div class="cauldron has-art' + (c.brewed ? " brewed" : "") + '" aria-hidden="true">' +
    '<span class="steam s1"></span><span class="steam s2"></span><span class="bowl"></span>' +
    '<img class="caul-art" src="' + (c.brewed ? CAULDRON_BREWED : CAULDRON_ART) + '" alt="" onerror="this.parentNode.classList.remove(\'has-art\');this.remove()">' +
    '<span class="liquid"><span class="swirl"></span><span class="shine"></span></span>' +
    items.map((g, i) => '<span class="floaty' + (i >= was ? " new" : "") + '" style="--u:' + SPOTS[i][0] + ";--v:" + SPOTS[i][1] + ";animation-delay:" + (i >= was ? (i - was) * 0.25 + "s, " + ((i - was) * 0.25 + 0.9) + "s" : (-(i * 0.37)).toFixed(2) + "s") + '">' + g.icon + "</span>").join("") +
    '<span class="bub b1"></span><span class="bub b2"></span><span class="bub b3"></span></div>';
}

/* ---------- student card ---------- */
const bar = (have, need) => '<span class="pbar"><span style="width:' + Math.min(100, need ? have / need * 100 : 100) + '%"></span></span>';
export function potionCard(st, cls, students) {
  const t = teamOf(cls, st.id), date = azToday();
  if (!t) return '<div class="card potion"><h2>\u{1F9EA} Potion Brewing Teams</h2><p class="lede">You’re not on a team yet — your teacher will put you on one!</p></div>';
  const c = cauldron(cls, t, students, date), mine = (st.potionDays || {})[date], fx = mine ? effect(mine.fx) : null, n = potionsOf(st);
  let h = '<div class="card potion"><div class="card-head"><h2>\u{1F9EA} ' + esc(t.name) + '</h2><span class="fact">' + brewCount(cls, t.id) + " potion" + (brewCount(cls, t.id) === 1 ? "" : "s") + " brewed</span></div>" +
    cauldronHTML(c);
  h += c.brewed
    ? '<div class="banner info" style="margin:10px 0;">✨ <b>Potion brewed!</b>' + (fx ? " You got +" + POTION_CANDY + " candy, +" + POTION_XP + " XP, an egg and a <b>" + fx.icon + " " + esc(fx.name) + "</b> — your companion is glowing today!" : "") + "</div>"
    : '<p class="lede" style="margin:8px 0;"><b>Today’s recipe</b> — fill the cauldron with your team!</p>';
  h += '<div class="recipe">' + INGREDIENTS.map(g => '<div class="pring"><span class="ri-ic">' + g.icon + '</span><span class="ri-nm">' + g.name + ' <small>(' + g.subject + ')</small></span>' + bar(c.have[g.k], c.need[g.k]) +
    '<b class="ri-n">' + c.have[g.k] + " / " + c.need[g.k] + (c.have[g.k] >= c.need[g.k] ? " ✅" : "") + "</b></div>").join("") + "</div>";
  h += '<h3 style="margin-top:12px;">Your team</h3><div class="pteam">' + c.rows.map(({ st: m, g }) => '<span class="' + (m.id === st.id ? "me" : "") + '">' + esc(m.name || "") + " " +
    INGREDIENTS.map(x => (g[x.k] ? x.icon + g[x.k] : "")).filter(Boolean).join(" ") + (INGREDIENTS.some(x => g[x.k]) ? "" : '<small class="muted">—</small>') + "</span>").join("") + "</div>";
  h += '<p class="muted small" style="margin-top:10px;">Every ' + PER_XP + " XP in a subject = 1 ingredient: " + INGREDIENTS.map(g => g.subject + " " + g.icon).join(", ") +
    ". Ingredients show up when your teacher adds today’s XP. A new recipe comes every day.</p>";
  h += '<p class="small" style="margin-top:6px;">\u{1F3C5} Master Brewer: <b>' + Math.min(n, MASTER_BREWS) + " / " + MASTER_BREWS + "</b> potions" + (n >= MASTER_BREWS ? " ✅" : "") + "</p>";
  const s = standings(cls);
  h += '<h3 style="margin-top:12px;">\u{1F3C6} Team standings</h3><ol class="pstand">' + s.map(x => '<li class="' + (x.t.id === t.id ? "me" : "") + '">' + esc(x.t.name) + " — <b>" + x.n + "</b></li>").join("") + "</ol>" +
    '<p class="muted small">The team with the most potions at the end of Haunt-O-Ween wins a <b>special Legendary egg</b>!</p>';
  return h + "</div>";
}
