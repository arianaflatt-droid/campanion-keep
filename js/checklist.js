/* ---------- ✅ Morning Checklist (the first tab students see) ----------
   The same steps every morning, in the same order (matches the "Good morning, Companion Keep" slides).
   Each step checks itself off from the student's save; tapping a step opens the tab where it's done.
   The Treasure Vault step is "check your progress", so it counts as done once the student opens it today
   (remembered on this computer only). */
import { mapOn, mapState, todayReading, PER_ISLAND } from "./readmap.js?v=20261020t";
import { tbLeft, tbLive } from "./teachbattle.js?v=20261020t";
import { esc, simulate, companionOf, goalXP } from "./game.js?v=20261020t";
import { azToday, azNow, todayXP, pullsLeft, legendaryLeft, birthdayLeft, pickleLeft, vaultLegLeft, BOSS2_LIST, boss2EggLeft, candyLegLeft, snowLegLeft,
  gingerLegLeft, feastLegLeft, brewLegLeft, goalLeft, themeLeft, hasStarter, bankXP, LEVEL_XP } from "./collect.js?v=20261020t";
import { mqReady } from "./morning.js?v=20261020t";
import { heroOn, heroOf, heroReady } from "./hero.js?v=20261020t";
import { doorsLive, doorName, goldenReady, weekDoorState, vaultState, vaultGoal, subReq } from "./doors.js?v=20261020t";
import { soloOn, soloReady, soloCfg } from "./solobrew.js?v=20261020t";
import { passReady } from "./pass.js?v=20261020t";
import { pettedToday } from "./bond.js?v=20261020t";
import { mealsReady } from "./meals.js?v=20261020t";
import { readyTests } from "./quest.js?v=20261020t";
import { unthanked } from "./kindness.js?v=20261020t";

const seenKey = (id, what) => "ck-seen-" + azToday() + "-" + id + "-" + what;
export function markSeen(id, what) { try { localStorage.setItem(seenKey(id, what), "1"); } catch (e) {} }
const seen = (id, what) => { try { return localStorage.getItem(seenKey(id, what)) === "1"; } catch (e) { return false; } };
const plural = (n, w) => n + " " + w + (n === 1 ? "" : "s");

export function eggsLeft(s, cls) {
  if (!hasStarter(s)) return 0;
  return pullsLeft(s, cls) + legendaryLeft(s) + birthdayLeft(s) + pickleLeft(s) + vaultLegLeft(s) + candyLegLeft(s) + snowLegLeft(s) + gingerLegLeft(s)
    + feastLegLeft(s) + brewLegLeft(s) + goalLeft(s) + themeLeft(s) + BOSS2_LIST.reduce((n, B) => n + boss2EggLeft(s, B), 0);
}
function presentsReady(s, cls) {
  let n = 0;
  Object.keys(s.doors || {}).forEach(d => Object.values(s.doors[d] || {}).forEach(e => { if (e && e.st === "ok") n++; }));
  return n + Object.keys(s.doors || {}).filter(d => goldenReady(s, cls, d)).length;
}

// The steps: [id, tab, icon, title, status text, done?]
export function steps(s, cls, students, battles) {
  const out = [], add = (id, tab, icon, title, text, done) => out.push({ id, tab, icon, title, text, done: !!done });
  const c = companionOf(s), pet = s.petName || (c && c.name) || "your companion", sim = simulate(s, cls);
  const school = !["Sat", "Sun"].includes(azNow().day);

  // 1. companion
  add("pet", "pet", "\u{1F43E}", "Check on " + pet,
    (sim.alive ? (sim.atRisk ? "⚠️ " + pet + " needs a " + goalXP(cls) + " XP day to heal. " : pet + " is doing great. ") : pet + " needs your help! ")
    + (pettedToday(s) ? "You petted " + pet + " today \u{1F496}" : "Give " + pet + " a pet!"), pettedToday(s));
  // 2. Campfire Kitchen
  { const n = mealsReady(s, cls); add("kitchen", "pet", "\u{1F373}", "Cook in the Campfire Kitchen", n ? (n === 1 ? "A meal is" : n + " meals are") + " ready to cook for a boost!" : "Nothing to cook right now.", !n); }
  // 3. Morning Quests
  if (school) { const n = mqReady(s, cls), late = azNow().h * 60 + azNow().m >= 8 * 60 + 30;
    add("morning", "morning", "\u{1F305}", "Do your Morning Quests", n ? plural(n, "quest") + " ready — finish them before 8:15!" : late ? "The board is closed for today." : "All caught up! Earn more XP before 8:15 to open more.", !n); }
  // 4. Hero Quest
  if (heroOn(cls)) { const h = heroOf(s), n = heroReady(s, cls);
    add("hero", "hero", "⚔️", h ? "Train your hero" : "Make your hero", !h ? "Your adventure in Embervale starts here." : n ? plural(n, "thing") + " to do on your Hero Quest!" : "No training sessions left. Earn more XP for more!", h && !n); }
  // 5. eggs
  if (hasStarter(s)) { const n = eggsLeft(s, cls), lv = Math.floor(bankXP(s, cls) / LEVEL_XP);
    add("eggs", "collect", "\u{1F95A}", "Hatch your eggs", n ? "You have " + plural(n, "egg") + " to hatch!" : "No eggs right now." + (lv ? " You can level up a creature " + plural(lv, "time") + "!" : " 120 XP in a day earns one."), !n); }
  else add("eggs", "collect", "\u{1F95A}", "Pick your starter creature", "Go to the Creature Collector to pick one.", false);
  // 6. doors & presents
  if (doorsLive(cls)) { const n = presentsReady(s, cls), wk = weekDoorState(s, cls) === "ready";
    add("doors", "doors", "\u{1F6AA}", "Check your " + doorName(), n || wk ? (n ? plural(n, "present") + " to open" : "") + (n && wk ? " and " : "") + (wk ? "your Weekly Door is ready!" : "!") : "Finish a door’s task, then tap “I did it!”", !n && !wk); }
  // 7. Treasure Vault
  { const st = vaultState(s, cls), v = vaultGoal(s, cls), unit = v.sub && v.sub !== "all" ? "XP in your goal subject" : "XP";
    add("vault", doorsLive(cls) ? "doors" : "pet", "\u{1F48E}", "Check your Treasure Vault",
      st === "open" ? "Opened this week ✅" : st === "ready" ? "Your vault is ready to open!" : v.n >= v.xp && v.tot >= v.min ? "Almost! Finish your " + subReq(s, cls).short.map(r => r.name + " (" + r.have + " / " + r.need + ")").join(", ") + " this week" : v.n >= v.xp ? "Goal reached! Now " + v.tot.toLocaleString() + " / " + v.min + " XP total this week to open it" : v.n.toLocaleString() + " / " + v.xp.toLocaleString() + " " + unit + " this week" + (v.reward && v.reward.name ? " for " + v.reward.name : ""),
      st === "open" || (st !== "ready" && seen(s.id, "vault"))); }
  // 8. potion cauldron
  if (soloOn(cls)) { const k = soloCfg(cls), n = soloReady(s, cls);
    add("brew", "haunt", k.icon, k.verb + " in your " + k.where, n ? plural(n, k.one) + " ready to " + k.verb.toLowerCase() + "!" : "Earn XP to collect ingredients for your next " + k.one + ".", !n); }
  // 📚 Reading Map (when Ms. Ariana has it on)
  if (mapOn(cls)) { const M = mapState(s, cls), r = todayReading(s, cls);
    add("rmap", "rmap", "\u{1F4DA}", M.ready.length ? "Claim your Reading Map treasure" : "Read for your Reading Map",
      M.ready.length ? plural(M.ready.length, "island") + " reached \u2014 tap to claim!" : M.next ? (r >= PER_ISLAND ? "You read today! " : "Read " + (PER_ISLAND - r) + " more Reading XP today. ") + M.toNext + " more to sail to " + M.next.n + "." : "You reached Treasure Isle this week! \u{1F451}",
      !M.ready.length && (r >= PER_ISLAND || !M.next)); }
  // 9. Season Pass
  if (!(cls && cls.passOff)) { const n = passReady(s, cls); add("pass", "pass", "\u{1F39F}️", "Claim Season Pass rewards", n ? plural(n, "reward") + " ready!" : "No rewards waiting.", !n); }
  // extras (only when there's something to do)
  { const n = readyTests(s).length; if (n) add("tests", "quest", "\u{1F5FA}️", "Grade Level Quest: battle a guardian", "You passed " + plural(n, "test") + "! A guardian battle is waiting. Win it for a Legendary egg!", false); }
  { const n = tbLeft(s, cls, battles).length, live = tbLive(s, battles);
    if (live && live.status === "invite") add("tbattle", "collect", "\u{1F34E}", "Ms. Ariana started your battle!", "Go to the Battle Arena and tap Accept.", false);
    else if (n && !s.tbAsk && !live) add("tbattle", "collect", "\u{1F34E}", "Ask Ms. Ariana for a battle", "You reached the weekly goal, so you earned a battle with her!", false); }
  { const n = students ? unthanked(s, students, cls).length : 0; if (n) add("kind", "pet", "\u{1F48C}", "Read your shout-outs", plural(n, "classmate") + " sent you kind words!", false); }
  return out;
}
export const todoCount = (s, cls, students, battles) => steps(s, cls, students, battles).filter(x => !x.done).length;

export function checklistTab(s, cls, students, battles) {
  const list = steps(s, cls, students, battles), left = list.filter(x => !x.done).length, goal = goalXP(cls), xp = todayXP(s, cls);
  const hi = azNow().h < 12 ? "Good morning" : "Welcome back";
  let h = '<div class="card checklist"><div class="card-head"><h2>✅ ' + hi + ", " + esc(s.name) + '!</h2><span class="fact">' + (left ? left + " to do" : "all done!") + "</span></div>" +
    '<p class="lede" style="margin-bottom:10px;">Go down your list. Tap a step to go do it, then come back here.</p><div class="cklist">' +
    list.map((x, i) => '<button class="ckitem' + (x.done ? " done" : "") + '" data-tab="' + x.tab + '" data-ck="' + x.id + '"><span class="ckn">' + (x.done ? "✅" : i + 1) + '</span><span class="ckic">' + x.icon +
      '</span><span class="cktxt"><b>' + esc(x.title) + "</b><small>" + esc(x.text) + '</small></span><span class="ckgo">' + (x.done ? "" : "Go →") + "</span></button>").join("") + "</div>" +
    '<div class="ckgoal"><b>\u{1F3AF} Then: earn ' + goal + " XP today!</b> " + (xp >= goal ? "You did it — every 120 more earns another egg! \u{1F389}" : xp.toLocaleString() + " / " + goal + " so far") +
    '<span class="pbar"><span style="width:' + Math.min(100, xp / goal * 100) + '%"></span></span></div>' +
    (left ? "" : '<p class="arena-win" style="margin-top:10px;">\u{1F389} Your checklist is done! Now get learning!</p>') + "</div>";
  return h;
}
