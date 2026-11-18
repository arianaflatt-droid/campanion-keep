/* ---------- ✅ Morning Checklist (the first tab students see) ----------
   The same steps every morning, in the same order (matches the "Good morning, Companion Keep" slides).
   Each step checks itself off from the student's save; tapping a step opens the tab where it's done.
   The Treasure Vault step is "check your progress", so it counts as done once the student opens it today
   (remembered on this computer only). */
import { rvStarted, rvStock, rvBeatCount } from "./revenge.js?v=20261118o";
import { heistTodo } from "./heist.js?v=20261118o";
import { axoOn } from "./axolotl.js?v=20261118o";
import { newsKeyOf, shownNews } from "./news.js?v=20261118o";
import { freeReady } from "./pets.js?v=20261118o";
import { tbLeft, tbLive } from "./teachbattle.js?v=20261118o";
import { esc, simulate, companionOf, goalXP, SEASON } from "./game.js?v=20261118o";
import { azToday, azNow, todayXP, pullsLeft, legendaryLeft, birthdayLeft, pickleLeft, vaultLegLeft, BOSS2_LIST, boss2EggLeft, candyLegLeft, snowLegLeft,
  gingerLegLeft, feastLegLeft, brewLegLeft, goalLeft, themeLeft, hasStarter, bankXP, LEVEL_XP } from "./collect.js?v=20261118o";
import { mqReady } from "./morning.js?v=20261118o";
import { DOOR_ART, doorsLive, doorName, goldenReady, weekDoorState, vaultState, vaultGoal, subReq, todayPlan, SUBJECT_KEYS } from "./doors.js?v=20261118o";
import { soloOn, soloReady, soloCfg } from "./solobrew.js?v=20261118o";
import { passReady } from "./pass.js?v=20261118o";
import { pettedToday } from "./bond.js?v=20261118o";
import { mealsReady } from "./meals.js?v=20261118o";
import { readyTests } from "./quest.js?v=20261118o";
import { unthanked } from "./kindness.js?v=20261118o";
import { kdTodo } from "./kingdom.js?v=20261118o";

const seenKey = (id, what) => "ck-seen-" + azToday() + "-" + id + "-" + what;
// 📣 the class announcement (Nov 9): a new one gets a new key, so it shows up on the list again
export const newsKey = cls => newsKeyOf(cls);   // changes whenever the list students see changes
export const newsRead = (s, cls) => !newsKey(cls) || seen(s && s.id, newsKey(cls));
export function markSeen(id, what) { try { localStorage.setItem(seenKey(id, what), "1"); } catch (e) {} }
const seen = (id, what) => { try { return localStorage.getItem(seenKey(id, what)) === "1"; } catch (e) { return false; } };
// 🖼️ Nov 18 (Ms. Ariana): pictures instead of emoji for some steps
const PIC = src => '<img class="ckimg" src="' + src + '" alt="">';
const ART = "assets/ui/ck/";   // new step pictures from Ms. Ariana (until a picture is uploaded the emoji shows instead)
const PICOR = (file, emo) => '<img class="ckimg" src="' + ART + file + '.webp" alt="" onerror="this.replaceWith(document.createTextNode(\'' + emo + '\'))">';
const petPic = c => !c ? "\u{1F43E}" : c.creature ? String(c.glyph || "\u{1F43E}") : PIC("assets/emoji/pet-" + c.id + ".webp");   // their own companion
const BREW_PIC = { haunt: "assets/potion/cauldron.webp", gobble: "assets/feast/turkey.webp", jingle: "assets/ginger/house-10.webp", frost: "assets/snowman/snowman-10.webp", lucky: "assets/lucky/trap-10.webp" };
const plural = (n, w) => n + " " + w + (n === 1 ? "" : "s");

export function eggsLeft(s, cls) {
  if (!hasStarter(s)) return 0;
  return pullsLeft(s, cls) + legendaryLeft(s) + birthdayLeft(s) + pickleLeft(s) + vaultLegLeft(s) + Math.max(0, (Number(s.trapLegEggs) || 0) + (Number(s.soloTrapLeg) || 0) - (Number(s.trapLegUsed) || 0)) + Math.max(0, (Number(s.ultraEggs) || 0) - (Number(s.ultraUsed) || 0)) + candyLegLeft(s) + snowLegLeft(s) + gingerLegLeft(s)
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

  // 0. 📣 the announcement (Nov 9)
  if (newsKey(cls)) { const L = shownNews(cls); add("news", "news", PICOR("news", "\u{1F4E3}"), L.length > 1 ? "Read the announcements" : "Read the announcement", (L.length > 1 ? L.length + " announcements: " : "") + (L[0].title ? "\u201C" + L[0].title + "\u201D" : "Something new from the teacher!"), newsRead(s, cls)); }
  // 🎁 the free starter Nebble (when Ms. Ariana has it on)
  if (freeReady(s, cls)) add("nebfree", "check", PIC("assets/pets/cherry.webp"), "Pick your FREE Nebble!", "Alien Duck brought a Nebble for you. Tap to pick your color!", false);
  // 1. companion
  add("pet", "pet", petPic(c), "Check on " + pet,
    (sim.alive ? (sim.atRisk ? "⚠️ " + pet + " needs a " + goalXP(cls) + " XP day to heal. " : pet + " is doing great. ") : pet + " needs your help! ")
    + (pettedToday(s) ? "You petted " + pet + " today \u{1F496}" : "Give " + pet + " a pet!"), pettedToday(s));
  // 🫧 Bubble's Baby (Nov 9): check on it every day
  if (axoOn(cls)) { const an = s.axo && s.axo.name ? s.axo.name : "";
    add("axo", "axo", PIC("assets/axolotl.png"), "Check on " + (an || "Bubble\u2019s Baby"), an ? "Go see how " + an + " is doing today!" : "Go see how the class baby axolotl is doing today!", seen(s.id, "axo")); }
  // 2. Campfire Kitchen
  { const n = mealsReady(s, cls); add("kitchen", "pet", PIC("assets/kitchen/kitchen-campfire.webp"), "Cook in the Campfire Kitchen", n ? (n === 1 ? "A meal is" : n + " meals are") + " ready to cook for a boost!" : "Nothing to cook right now.", !n); }
  // 3. Morning Quests
  if (school) { const n = mqReady(s, cls), late = azNow().h * 60 + azNow().m >= 8 * 60 + 30;
    add("morning", "morning", PIC("assets/morning/mq-board.webp"), "Do your Morning Quests", n ? plural(n, "quest") + " ready — finish them before 8:15!" : late ? "The board is closed for today." : "All caught up! Earn more XP before 8:15 to open more.", !n); }
  // 5. eggs
  if (hasStarter(s)) { const n = eggsLeft(s, cls), lv = Math.floor(bankXP(s, cls) / LEVEL_XP);
    add("eggs", "collect", PIC("assets/egg-common.webp"), "Hatch your eggs", n ? "You have " + plural(n, "egg") + " to hatch!" : "No eggs right now." + (lv ? " You can level up a creature " + plural(lv, "time") + "!" : " 120 XP in a day earns one."), !n); }
  else add("eggs", "collect", PIC("assets/egg-common.webp"), "Pick your starter creature", "Go to the Creature Collector to pick one.", false);
  // 6. doors & presents
  if (doorsLive(cls)) { const n = presentsReady(s, cls), wk = false;   // Nov 3: no Weekly Door (its rewards are in the vault)
    add("doors", "doors", PIC(DOOR_ART[SEASON.key] || DOOR_ART.jingle), "Check your " + doorName(), n || wk ? (n ? plural(n, "present") + " to open" : "") + (n && wk ? " and " : "") + (wk ? "your Weekly Door is ready!" : "!") : "Finish a door’s task, then tap “I did it!”", !n && !wk); }
  // 7. Treasure Vault
  { const st = vaultState(s, cls), v = vaultGoal(s, cls), unit = v.sub && v.sub !== "all" ? "XP in your goal subject" : "XP";
    add("vault", doorsLive(cls) ? "doors" : "pet", PIC("assets/vault/vault-closed.webp"), "Check your Treasure Vault",
      st === "open" ? "Opened this week ✅" : st === "ready" ? "Your vault is ready to open!" : v.n >= v.xp && v.tot >= v.min ? "Almost! Finish your " + subReq(s, cls).short.map(r => r.name + " (" + r.have + " / " + r.need + ")").join(", ") + " this week" : v.n >= v.xp ? "Goal reached! Now " + v.tot.toLocaleString() + " / " + v.min + " XP total this week to open it" : v.n.toLocaleString() + " / " + v.xp.toLocaleString() + " " + unit + " this week" + (v.reward && v.reward.name ? " for " + v.reward.name : ""),
      st === "open" || (st !== "ready" && seen(s.id, "vault"))); }
  // 8. potion cauldron
  if (soloOn(cls)) { const k = soloCfg(cls), n = soloReady(s, cls);
    add("brew", "haunt", BREW_PIC[k.key] ? PIC(BREW_PIC[k.key]) : k.icon, k.verb + " in your " + k.where, n ? plural(n, k.one) + " ready to " + k.verb.toLowerCase() + "!" : "Earn XP to collect ingredients for your next " + k.one + ".", !n); }
  // 🦃 Turducken's Revenge (Thanksgiving break)
  if (rvStarted(cls)) { const k = rvStock(s, cls), n = rvBeatCount(s, cls);
    add("revenge", "pet", PIC("assets/gobble/turducken.webp"), "Chase the Turducken", k.energy ? k.energy + " \u26A1 energy ready \u2014 " + (n >= 5 ? "climb the Tower!" : "chapter " + (n + 1) + " of 5!") : "Earn XP for \u26A1 energy (every 10 XP = 1 round).", !k.energy); }
  // 🎄 the Great Present Heist (Christmas break)
  { const t = heistTodo(s, cls); if (t) add("heist", "pet", PIC("assets/heist/gd-base.webp"), "Chase the Grinch-a-Duck", t.text, t.done); }
  // 9. Season Pass
  if (!(cls && cls.passOff)) { const n = passReady(s, cls); add("pass", "pass", PICOR("pass", "\u{1F39F}️"), "Claim Season Pass rewards", n ? plural(n, "reward") + " ready!" : "No rewards waiting.", !n); }
  // extras (only when there's something to do)
  if (kdTodo(s, cls)) add("kd", "kd", PIC("assets/kingdom/queen-wave.webp"), "Visit the Axolotl Kingdom", "You made it in this week! Open your Royal Clam and go Pearl Diving.", false);   // Nov 10
  { const n = readyTests(s).length; if (n) add("tests", "quest", PICOR("quest", "\u{1F5FA}️"), "Grade Level Quest: battle a guardian", "You passed " + plural(n, "test") + "! A guardian battle is waiting. Win it for a Legendary egg!", false); }
  { const n = tbLeft(s, cls, battles).length, live = tbLive(s, battles);
    if (live && live.status === "invite") add("tbattle", "collect", PICOR("battle", "\u{1F34E}"), "Ms. Ariana started your battle!", "Go to the Battle Arena and tap Accept.", false);
    else if (n && !s.tbAsk && !live) add("tbattle", "collect", PICOR("battle", "\u{1F34E}"), "Ask Ms. Ariana for a battle", "You reached the weekly goal, so you earned a battle with her!", false); }
  { const n = students ? unthanked(s, students, cls).length : 0; if (n) add("kind", "pet", PICOR("shoutout", "\u{1F48C}"), "Read your shout-outs", plural(n, "classmate") + " sent you kind words!", false); }
  return out;
}
export const todoCount = (s, cls, students, battles) => steps(s, cls, students, battles).filter(x => !x.done).length;

const SUB_IC = { m: "➕", r: "\u{1F4D6}", l: "✏️", f: "⚡", w: "\u{1F4DD}", v: "\u{1F524}", sc: "\u{1F52C}", ss: "\u{1F30E}" };
/* 🧪 Nov 18 (Ms. Ariana): the bars are glass tubes in a wooden/iron frame, each subject fills with its own glowing color,
   with a moving shine, little bubbles and a gold cap at the end when it's full. Subject pictures: assets/ui/subj/<key>.webp
   (the emoji shows until that picture is uploaded). */
const SUBIC = k => '<img class="subic" src="assets/ui/subj/' + esc(k || "x") + '.webp" alt="" onerror="this.replaceWith(document.createTextNode(\'' + (SUB_IC[k] || "\u{1F4D8}") + '\'))">';
/* 💎 Nov 18: the end of each tube is an empty socket; when the bar is full that subject's gem sits in it.
   The first time a bar fills each day (this computer) the gem pops in with sparkles. */
const GEM = { m: "blue", r: "green", l: "purple", f: "orange", w: "pink", v: "teal", sc: "lime", ss: "gold", xp: "gold" };
function gemPop(key) { const k = "ck-gem-" + azToday() + "-" + key; try { if (localStorage.getItem(k)) return false; localStorage.setItem(k, "1"); } catch (e) { return false; } return true; }
function tube(pct, cls, label, key) {
  const p = Math.max(0, Math.min(100, pct || 0)), full = p >= 100, pop = full && gemPop((cls || "") + ":" + (key || "x"));
  return '<span class="tube ' + (cls || "") + (full ? " full" : "") + '"><span class="tfill" style="width:' + p + '%"><i class="tshine"></i><i class="tbub"></i><i class="tbub b2"></i><i class="tbub b3"></i></span>' +
    (label ? '<span class="tlabel">' + label + "</span>" : "") + '<span class="tcap' + (pop ? " pop" : "") + '"><img class="tsock" src="assets/ui/ck/socket.webp" alt="">' +
    (full ? '<img class="tgem" src="assets/ui/ck/gem-' + (GEM[key] || "gold") + '.webp" alt="Done!"><i class="tspark"></i>' : "") + "</span></span>";
}
// 📚 Today's work: each core subject's XP today against what today needs (25 a day, plus catch-up from earlier days this week)
function workCard(s, cls) {
  const p = todayPlan(s, cls, azToday()); if (!p || (!p.schoolToday && p.rows.every(r => !r.target))) return "";
  const all = p.rows.every(r => r.today >= r.target);
  return '<div class="ckwork"><div class="ckbarhead"><b>' + (p.weekend ? "Make-up work this weekend" : "Today’s subjects") + "</b>" +
    '<span class="small">' + (p.weekend ? "Finish what’s still missing this week:" : "Do these every school day (they add up for your Treasure Vault):") + "</span></div>" +
    p.rows.map(r => { const ok = r.today >= r.target, pct = r.target ? r.today / r.target * 100 : 100;
      return '<div class="ckwrow s-' + esc(r.src) + (ok ? " ok" : "") + '"><span class="ckwic">' + SUBIC(r.src) + "</span>" +
        '<span class="ckwname">' + esc(r.name) + (r.extra && !p.weekend ? '<small class="ckwmore">' + r.per + " today + " + r.extra + " catch-up</small>" : "") + "</span>" +
        tube(pct, "sub", r.today + " / " + r.target, r.src) +
        '<span class="ckwweek"><small>This week</small><b>' + Math.min(r.week, r.need) + " / " + r.need + "</b></span></div>"; }).join("") +
    (all ? '<div class="ckalls">\u{1F389} All your subjects are done' + (p.weekend ? "" : " for today") + "!</div>" : "") + "</div>";
}
/* 🎯 Goal Subject test bar (Nov 10): XP left in the course for the student's Goal Subject, from Timeback (the feeder → testXp, saved by
   the teacher console). Timeback updates its number now and then, so XP earned in that subject on days AFTER that update counts down here. */
export function testLeftNow(s, today) {
  const x = s && s.testXp; if (!x || !(x.tot > 0)) return null;
  const k = SUBJECT_KEYS[String(x.sub || "").toLowerCase()], hist = (s && s.xpHist) || {};
  let since = 0; if (k && x.at) Object.keys(hist).forEach(d => { if (d > x.at && d <= today) since += Number(((hist[d] || {}).sub || {})[k]) || 0; });
  const left = Math.max(0, Math.round((Number(x.left) || 0) - since));
  return { sub: x.sub, left, tot: x.tot, done: x.tot - left, t: x.t, k, tbDone: !(Number(x.left) > 0) };
}
function testCard(s) {
  const x = testLeftNow(s, azToday()); if (!x) return "";
  const pct = Math.min(100, Math.max(0, x.done / x.tot * 100));
  return '<div class="ckgoal cktest s-' + esc(x.k || "x") + '"><div class="ckgrow"><span class="ckwic big">' + SUBIC(x.k) + '</span><span class="ckgtxt"><b>' + esc(x.sub) + " goal</b><small>" +
    (x.left ? "<b>" + x.left.toLocaleString() + " XP</b> left until your test!" : x.tbDone ? "\u{1F389} You finished! Your test is next." : "\u{1F525} Almost there! Your test is very close.") + "</small></span>" +
    '<span class="ckgpct">' + Math.round(pct) + "%</span></div>" + tube(pct, "test", Math.round(x.done).toLocaleString() + " / " + x.tot.toLocaleString() + " XP", x.k) +
    '<small class="ckgnote">' + esc(x.t) + "</small></div>";
}
export function checklistTab(s, cls, students, battles) {
  const list = steps(s, cls, students, battles), left = list.filter(x => !x.done).length, goal = goalXP(cls), xp = todayXP(s, cls);
  const hi = azNow().h < 12 ? "Good morning" : "Welcome back";
  let h = '<div class="card checklist"><div class="card-head"><h2>✅ ' + hi + ", " + esc(s.name) + '!</h2><span class="fact">' + (left ? left + " to do" : "all done!") + "</span></div>" +
    // Nov 7: finished steps leave the list; when everything's done the list goes away for the day
    (left ? '<p class="lede" style="margin-bottom:10px;">Go down your list. Tap a step to go do it. Done steps disappear!' + (list.length - left ? ' <span class="ckdone">✅ ' + (list.length - left) + " done</span>" : "") + '</p><div class="cklist">' +
    list.filter(x => !x.done).map((x, i) => '<button class="ckitem" data-tab="' + x.tab + '" data-ck="' + x.id + '"><span class="ckn">' + (i + 1) + '</span><span class="ckic">' + x.icon +
      '</span><span class="cktxt"><b>' + esc(x.title) + "</b><small>" + esc(x.text) + '</small></span><span class="ckgo"><span>Go</span></span></button>').join("") + "</div>"
      : '<div class="ckalldone"><span>\u{1F389}</span><b>Your checklist is all done for today!</b><small>Now get learning. New steps show up here when there\u2019s something to do.</small>' +
        (((s.planet || {}).ckd === azToday()) ? '<small>\u2B50 You got your <b>+10 Stardust</b> for today!</small>' : '<button class="btn gold" data-act="ckClaim" style="margin-top:8px;">\u2B50 Claim +10 Stardust</button>') + "</div>") +
    '<div class="ckgoal ckxp"><div class="ckgrow"><span class="ckwic big"><img class="subic" src="assets/ui/subj/xp.webp" alt="" onerror="this.replaceWith(document.createTextNode(\'\u{1F3AF}\'))"></span><span class="ckgtxt"><b>Then: earn ' + goal + " XP today!</b><small>" +
      (xp >= goal ? "You did it \u2014 every 120 more earns another egg! \u{1F389}" : "Keep going, you\u2019re on your way!") + '</small></span></div>' + tube(xp / goal * 100, "xp", xp.toLocaleString() + " / " + goal + " XP", "xp") + "</div>" +
    workCard(s, cls) + testCard(s) +
    "</div>";
  return h;
}
