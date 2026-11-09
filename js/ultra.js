/* ---------- 🌈 Ultra Legendaries: the goals, the tracker and the Ultra section (Nov 3) ----------
   A student earns an Ultra egg (ultraEggs +1) each time they reach a goal. The server hatches it (kind "ultra"):
   a random Ultra, new at level 1 or +5 levels on one they already have.
   Goals:
     🔥 every 30 school days in a row at 120 XP (30, 60, 90…; weekends and class days off don't count or break it)
     📅 every 4 weeks in a row at 600 XP (a short week's goal shrinks with its days off; missing a week starts over)
     💎 the first Treasure Vault opened always gives one, then 25% each vault (student.js openVault)
     🗺️ finishing all 3 Grade Level Quest tests at their own grade (st.grade = 4 or 5, set by Ms. Ariana; once)
   Saved on the student: ultraEggs, ultraUsed (server), ultraGoals = { st: { s: run start, n: given }, wk: { s, n }, vault: vaults rolled,
     q: true }, ultraLog = [{ why, at }] (newest last). */
import { esc, weekKey, weekGoal } from "./game.js?v=20261109g";
import { CLUB_ULTRA_FAMS } from "./collect.js?v=20261109g";
import { ULTRA_FAMS, ULTRA_DUPE, ultraLeft, owned, formOf, family, creature, statsOf, bankXP, LEVEL_XP, MAX_LEVEL } from "./collect.js?v=20261109g";
import { doneCount, GRADES } from "./quest.js?v=20261109g";
import { addDays, mondayOf, histWeekTotal, wkShare } from "./doors.js?v=20261109g";

export const STREAK_DAYS = 30, WEEKS_IN_ROW = 4, WEEK_XP = 600, VAULT_ULTRA = 0.25;
export const ULTRA_GRADES = [4, 5];
const WHY = {
  streak: "\u{1F525} " + STREAK_DAYS + " days in a row at 120 XP",
  weeks: "\u{1F4C5} " + WEEKS_IN_ROW + " weeks in a row at " + WEEK_XP + " XP",
  vault: "\u{1F48E} the Treasure Vault",
  quest: "\u{1F5FA}️ the Grade Level Quest"
};
export const ultraWhy = k => WHY[k] || "a goal";
const goalsOf = st => (st && st.ultraGoals) || {};
const weekday = iso => { const [y, m, d] = String(iso).split("-").map(Number); return new Date(y, m - 1, d).getDay(); };

/* 🔥 The current run of 120 XP school days: { cur, start } (start = its first day) */
export function streakRun(st, cls) {
  const goal = (cls && Number(cls.goal)) || 120, h = (st && st.xpHist) || {}, off = (cls && cls.offDays) || {};
  let run = 0, start = null;
  Object.keys(h).sort().forEach(date => {
    const wd = weekday(date); if (wd === 0 || wd === 6 || off[date]) return;   // weekends and days off for everyone don't count
    const x = h[date] || {}, v = Math.max(Number(x.d) || 0, Number(x.l) || 0, Number(x.mo) || 0, x.h || x.lh ? goal : 0);
    if (x.e && v < goal) return;   // an excused day doesn't break it
    if (v >= goal) { if (!run) start = date; run++; } else { run = 0; start = null; }
  });
  return { cur: run, start };
}
/* 📅 Weeks in a row at the week's goal (600, less in a week with days off): { cur, start, thisWeek, goal }.
   This week counts once it's reached, and doesn't break the run while it's still going. */
function weekGoalFor(cls, mon) {
  if (mon === weekKey(cls)) return weekGoal(cls) < WEEK_XP ? weekGoal(cls) : WEEK_XP;
  const off = (cls && cls.offDays) || {}; let days = 0;
  for (let i = 0; i < 5; i++) if (!off[addDays(mon, i)]) days++;
  return Math.round(WEEK_XP * days / 5);
}
export function weekRun(st, cls) {
  const h = (st && st.xpHist) || {}, dates = Object.keys(h).sort(), now = weekKey(cls);
  let run = 0, start = null, thisWeek = 0;
  if (dates.length) {
    for (let mon = mondayOf(dates[0]); mon <= now; mon = addDays(mon, 7)) {
      const goal = Math.round(weekGoalFor(cls, mon) * wkShare(st, cls)), tot = histWeekTotal(st, mon);
      if (mon === now) thisWeek = tot;
      if (goal <= 0) continue;   // a week off (winter break) is skipped
      const any = [0, 1, 2, 3, 4, 5, 6].some(i => h[addDays(mon, i)]);
      if (!any && mon !== now) continue;   // no numbers that week at all
      if (tot >= goal) { if (!run) start = mon; run++; }
      else if (mon !== now) { run = 0; start = null; }
    }
  }
  return { cur: run, start, thisWeek, goal: Math.round(weekGoalFor(cls, now) * wkShare(st, cls)) };
}
/* 🗺️ The student's own grade (Ms. Ariana sets 4 or 5) → its Grade Level Quest tests */
export const gradeOf = st => (ULTRA_GRADES.includes(Number(st && st.grade)) ? Number(st.grade) : null);
export const questTests = st => (gradeOf(st) ? doneCount(st, gradeOf(st)) : 0);

/* What the student is owed right now (the first one only; the next render gives the next). null = nothing. */
export function ultraDue(st, cls) {
  if (!st || st.isTeacher) return null;
  const g = goalsOf(st);
  const sr = streakRun(st, cls), sGiven = g.st && g.st.s === sr.start ? Number(g.st.n) || 0 : 0;
  if (sr.start && Math.floor(sr.cur / STREAK_DAYS) > sGiven) return { why: "streak", goals: Object.assign({}, g, { st: { s: sr.start, n: sGiven + 1 } }) };
  const wr = weekRun(st, cls), wGiven = g.wk && g.wk.s === wr.start ? Number(g.wk.n) || 0 : 0;
  if (wr.start && Math.floor(wr.cur / WEEKS_IN_ROW) > wGiven) return { why: "weeks", goals: Object.assign({}, g, { wk: { s: wr.start, n: wGiven + 1 } }) };
  if (gradeOf(st) && !g.q && questTests(st) >= 3) return { why: "quest", goals: Object.assign({}, g, { q: true }) };
  return null;
}
// The save that gives one Ultra egg (also used by the vault)
export function ultraGift(st, why, goals) {
  return { ultraEggs: (Number(st.ultraEggs) || 0) + 1, ultraGoals: goals || goalsOf(st),
    ultraLog: (st.ultraLog || []).slice(-19).concat([{ why, at: new Date().toISOString() }]) };
}
// 💎 Opening a Treasure Vault: the first one always has an Ultra, then 25%. Adds to `data` and returns true if it gave one.
export function vaultUltra(st, data) {
  const g = goalsOf(st), n = Number(g.vault) || 0, hit = n === 0 || Math.random() < VAULT_ULTRA;
  const goals = Object.assign({}, g, { vault: n + 1 });
  if (hit) Object.assign(data, ultraGift(st, "vault", goals)); else data.ultraGoals = goals;
  return hit;
}

/* Gives what's owed, one save at a time (page side; the rules let ultraEggs go up 1 per save). */
let syncing = false, shownFor = {};
export async function ultraSync(c) {
  const st = c.st; if (!st || c.preview || syncing) return;
  const due = ultraDue(st, c.cls); if (!due) return;
  syncing = true;
  try { const d = ultraGift(st, due.why, due.goals); await c.patch(d); Object.assign(st, d);
    if (!shownFor[st.id + ":" + (st.ultraEggs || 0)]) { shownFor[st.id + ":" + (st.ultraEggs || 0)] = 1; c.flash && c.flash("\u{1F308} You earned an ULTRA LEGENDARY egg for " + ultraWhy(due.why) + "! Hatch it in your Creature Collector!", true); } }
  catch (e) { /* tries again next time */ }
  finally { syncing = false; }
}

/* ---------- the tracker ---------- */
const bar = (n, goal) => '<span class="ubar"><i style="width:' + Math.min(100, goal ? n / goal * 100 : 0).toFixed(1) + '%"></i></span>';
export function ultraTracker(st, cls) {
  const sr = streakRun(st, cls), wr = weekRun(st, cls), g = goalsOf(st), gr = gradeOf(st), qt = questTests(st);
  const sIn = sr.cur % STREAK_DAYS, sNext = (Math.floor(sr.cur / STREAK_DAYS) + 1) * STREAK_DAYS;
  const wIn = wr.cur % WEEKS_IN_ROW, thisOk = wr.thisWeek >= wr.goal;
  const row = (icon, name, prog, sub, done) => '<div class="ugoal' + (done ? " done" : "") + '"><span class="ugi">' + icon + "</span><div><b>" + name + "</b>" + prog + '<small>' + sub + "</small></div></div>";
  return '<div class="ugoals">' +
    row("\u{1F525}", STREAK_DAYS + " days in a row at 120 XP", bar(sIn, STREAK_DAYS),
      sr.cur ? "Day <b>" + sr.cur + "</b> of your streak · Ultra at day " + sNext : "Hit 120 XP today to start your streak!") +
    row("\u{1F4C5}", WEEKS_IN_ROW + " weeks in a row at " + WEEK_XP + " XP", bar(wIn, WEEKS_IN_ROW),
      "Week <b>" + wIn + "</b> of " + WEEKS_IN_ROW + " · this week: " + wr.thisWeek.toLocaleString() + " / " + wr.goal + " XP" + (thisOk ? " ✅" : "")) +
    row("\u{1F48E}", "Treasure Vault", "", (Number(g.vault) || 0) ? "Every vault you open has a <b>25% chance</b> of an Ultra egg." : "Your <b>first</b> vault has an Ultra egg inside for sure!") +
    row("\u{1F5FA}️", "Grade Level Quest", gr ? bar(qt, 3) : "",
      g.q ? "✅ Done! You finished your " + esc(GRADES[gr || 4].name) + " tests." : gr ? "Finish all 3 " + esc(GRADES[gr].name) + " tests: <b>" + qt + " / 3</b> (one time)" : "Ms. Ariana will set your grade soon.", !!g.q) +
    "</div>";
}

/* ---------- the Ultra section (Creature Collector tab) ---------- */
const UI = (c, cls, sil) => '<img class="' + cls + (sil ? " usil" : "") + '" src="' + esc(c.img) + '" alt="' + esc(sil ? "Unknown Ultra" : c.name) + '" loading="lazy">';
export function ultraSection(st, cls) {
  const o = owned(st), have = ULTRA_FAMS.filter(f => o[f]), left = ultraLeft(st), bank = bankXP(st, cls), log = st.ultraLog || [];
  let h = '<div class="card ultracard"><div class="card-head"><h2>\u{1F308} <span class="ugt">Ultra Legendaries</span></h2><span class="fact">' + have.length + " / " + ULTRA_FAMS.length + " found</span></div>" +
    '<p class="lede">The strongest creatures in the Keep. Every goal below gives an <b>Ultra egg</b>: a new Ultra joins at level 1, and one you already have goes up <b>+' + ULTRA_DUPE + " levels</b>.</p>";
  if (left) h += '<div class="uegg"><span class="ueggpic"><img src="assets/egg-legendary.webp" alt=""></span><div><b>You have ' + left + " Ultra egg" + (left === 1 ? "" : "s") + "!</b>" +
    (log.length ? '<small>From ' + esc(ultraWhy(log[log.length - 1].why)) + "</small>" : "") + '</div><button class="btn big ultrabtn" data-cc="hatchUltra">\u{1F308} Hatch your Ultra egg!</button></div>';
  if (!st.isTeacher) h += ultraTracker(st, cls);
  h += '<div class="ugrid">' + ULTRA_FAMS.map(f => {
    const fm = family(f), e = o[f];
    if (!e) { const c = creature(fm.forms[0]); return '<div class="ucell unk">' + UI(c, "uimg", true) + "<b>???</b><small>" + c.types.map(esc).join(" / ") + "</small></div>"; }
    const lvl = e.lvl || 1, c = formOf(f, lvl), s2 = statsOf(c, lvl), maxed = lvl >= MAX_LEVEL;
    return '<div class="ucell"><button class="mypic" data-cc="detail" data-id="' + c.id + '">' + UI(c, "uimg") + "</button><b>" + esc(e.nick || c.name) + '</b><span class="lv">Lv ' + lvl + "</span>" +
      '<small class="muted">❤ ' + s2.hp + " · \u{1F6E1} " + s2.df + " · ⚔ " + s2.dmg + "</small>" +
      '<button class="btn small" data-cc="lvl" data-fam="' + f + '"' + (bank >= LEVEL_XP && !maxed ? "" : " disabled") + ">" + (maxed ? "Max level" : "⬆ Level up · " + LEVEL_XP + " XP") + "</button></div>";
  }).join("") + "</div>";
  // 🎨 Club Ultras: only from finishing a club (js/clubs.js); unknown ones show as ??? with the club to finish
  if (CLUB_ULTRA_FAMS.length) h += '<h3 style="margin:16px 0 6px;">\u{1F3A8} Club Ultras <span class="fact">' + CLUB_ULTRA_FAMS.filter(f => o[f]).length + " / " + CLUB_ULTRA_FAMS.length + '</span></h3><p class="muted small" style="margin:0 0 8px;">Finish every step of a club to get its own Ultra. Only club members can get them!</p><div class="ugrid">' +
    CLUB_ULTRA_FAMS.map(f => { const fm = family(f), e = o[f], c0 = creature(fm.forms[0]);
      if (!e) return '<div class="ucell unk">' + UI(c0, "uimg", true) + "<b>???</b><small>" + esc(CLUB_NAMES[fm.club] || "a club") + "</small></div>";
      const lvl = e.lvl || 1, c = formOf(f, lvl), s2 = statsOf(c, lvl), maxed = lvl >= MAX_LEVEL;
      return '<div class="ucell"><button class="mypic" data-cc="detail" data-id="' + c.id + '">' + UI(c, "uimg") + "</button><b>" + esc(e.nick || c.name) + '</b><span class="lv">Lv ' + lvl + "</span>" +
        '<small class="muted">❤ ' + s2.hp + " · \u{1F6E1} " + s2.df + " · ⚔ " + s2.dmg + "</small>" +
        '<button class="btn small" data-cc="lvl" data-fam="' + f + '"' + (bank >= LEVEL_XP && !maxed ? "" : " disabled") + ">" + (maxed ? "Max level" : "⬆ Level up · " + LEVEL_XP + " XP") + "</button></div>"; }).join("") + "</div>";
  return h + "</div>";
}
const CLUB_NAMES = { imagineers: "Finish Imagineers Club", teamtrials: "Finish Team Trials", popupshop: "Finish Pop-Up Shop", impactmakers: "Finish Impact Makers", masterpiece: "Finish Masterpiece Club",
  eureka: "Finish Eureka Club", trainingcamp: "Finish Training Camp", pixelstudio: "Finish Pixel Studio", english: "Finish Language Club" };

/* ---------- the lorebook page: what each Ultra does in battle ---------- */
const P = x => Math.round((x || 0) * 100) + "%";
function fxText(f, who) {
  if (!f) return "";
  const ch = f.ch >= 1 ? "Every time: " : P(f.ch) + " chance ";
  return {
    defdown: ch + "to lower the opponent’s Defense by " + P(f.pct) + " for the rest of the battle",
    daze: ch + "to make the opponent’s next attack " + P(f.pct) + " weaker",
    atkdown: ch + "to lower the opponent’s Attack by " + P(f.pct) + " for the rest of the battle",
    burn: ch + "to burn the opponent (it loses a little HP for 3 rounds)",
    poison: ch + "to poison the opponent (it loses a little HP for 3 rounds)",
    shield: (f.ch >= 1 ? "Every time, " : P(f.ch) + " chance ") + "the next hit on " + who + " does " + P(f.pct) + " less damage",
    boost: ch + "that " + who + "’s next attack does +" + P(f.pct) + " damage",
    bonus: ch + "to do +" + P(f.pct) + " bonus damage on that hit",
    heal: ch + "to heal " + who + " " + P(f.pct) + " of its HP"
  }[f.fx] || "";
}
export function ultraInfoHTML(c) {
  const u = c && c.ux; if (!u) return "";
  // 👽 Planet JP aliens: Ms. Ariana's own move and ability text
  if (c.moves) return '<div class="uinfo">' + c.moves.map((m, i) => '<p class="dline"><b>' + (i ? "✨ " : "⚔️ ") + esc(m.name) + "</b> (" + esc(m.type) + (m.dmg ? ", " + m.dmg + " base damage" : "") + "): " + esc(m.effect) + "</p>").join("") +
    (c.ability ? '<p class="dline"><b>\u{1F6E1}️ ' + esc(c.ability.name) + "</b>: " + esc(c.ability.text) + "</p>" : "") + (c.role ? '<p class="dline muted">Battle role: ' + esc(c.role) + "</p>" : "") +
    (c.evoNote ? '<p class="dline muted">\u{1F31F} ' + esc(c.evoNote) + "</p>" : "") + "</div>";
  const p = u.pass, sp = u.sp || {}, bits = [];
  if (sp.heal) bits.push("heals " + P(sp.heal) + " of its HP"); if (sp.def) bits.push("+" + P(sp.def) + " Defense"); if (sp.atk) bits.push("+" + P(sp.atk) + " Attack");
  if (sp.boost) bits.push("its next " + (sp.bt ? sp.bt.join(" or ") + " " : "") + "attack does +" + P(sp.boost)); if (sp.shield) bits.push("the next hit on it does " + P(sp.shield) + " less"); if (sp.crit) bits.push("that attack has +" + P(sp.crit) + " critical-hit chance");
  const pass = !p ? "" : p.fx === "first" ? "the first hit it takes in a battle does " + P(p.pct) + " less damage"
    : p.fx === "halfBoost" ? "the first time it drops below 50% HP, its next attack does +" + P(p.pct)
    : p.fx === "critBoost" ? "the first time it lands a critical hit, its next attack does +" + P(p.pct)
    : p.fx === "halfRandom" ? "the first time it drops below 50% HP, a random reaction happens: heal " + P(p.heal || 0.15) + ", +" + P(p.def || 0.2) + " Defense, or its next attack +" + P(p.boost || 0.25)
    : p.fx === "halfHeal" ? "the first time it drops below 50% HP, it heals " + P(p.pct) + " of its HP" : "the first time it drops below 50% HP, its Defense goes up " + P(p.pct);
  return '<div class="uinfo"><p class="dline"><b>⚔️ ' + esc(c.attack) + "</b> (" + esc(c.atkType || c.types[0]) + ", main attack): " + esc(fxText(u.main, c.name)) + "</p>" +
    '<p class="dline"><b>✨ ' + esc(c.alt.name) + "</b> (" + esc(c.alt.type) + ", second attack): " + esc(u.alt ? fxText(u.alt, c.name) : c.alt.evade ? P(c.alt.evade) + " chance it dodges the opponent\u2019s next attack" : c.alt.heal ? "heals " + P(c.alt.heal) + " of its HP" : "a bit less damage") + "</p>" +
    (p ? '<p class="dline"><b>\u{1F6E1}️ ' + esc(p.name) + "</b> (always on): " + esc(pass) + "</p>" : "") +
    (!u.sp ? "</div>" : "") + (!u.sp ? "" : '<p class="dline"><b>\u{1F308} ' + esc(sp.name) + "</b> (Ultra special, once per battle below 30% HP): " + esc(bits.join(", ")) + "</p></div>");
}
