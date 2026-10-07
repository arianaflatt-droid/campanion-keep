import { newlyEarned, badgeById, fullWeekCount, bestFullWeekRun } from "./badges.js?v=20261007b";
import { questTracker, questTeacherClick, questTeacherChange } from "./quest-ui.js?v=20261007b";
import { onTradeClick, onTradeChange, onTradeReady, settleTrades } from "./trade-ui.js?v=20261007b";
import { cpEarnedCalc } from "./room.js?v=20261007b";
import { TEAM_EVENTS, EVENT_LIST, PER_XP, eventOn, teams as tevTeams, teamOf as tevTeamOf, teamDay, recipeChanged, brewRewards, standings as tevStandings, topTeams, brewCount, legField, topField } from "./teams.js?v=20261007b";
import { GOAL_SUBJECTS, DOOR_DEFAULT, DOOR_GATE, DOOR_NAMES, doorsFor, doorsLive, autoDoors, FAST_RING, waitingDoors, doorXPRows, REWARD_XP, WEEK_DOOR_XP, weekKey, weekGoal, weekTotal } from "./doors.js?v=20261007b";
import { collectorTab, overlays as collectorOverlays, onClick as collectorClick, isBusy as collectorBusy } from "./collector-ui.js?v=20261007b";
import {
  applyDisplayNames, displayNames, firstLast, companionOf, DAYS, SHORT, ROSTER, ITEMS, GEAR, BANNER, byId, esc, arr5, five, recordedDays, goalXP,
  simulate, wornItem, tier, boardDay, sidekickToday, keepHTML, itemArt, isHaunt, battleOn, candyOf, CANDY_FULL, weekCandy, battleHTML, bossState, ghostUnlocked, STORE, candyLeft, storeArt, dmgOf, baseDamage,
  bucketState, bucketHTML, finalizePreview, dateOfDay, BUCKET_PER_MISS, WHEEL, PRIZES,
  checkVersion, APP_V, hitOn, carryRun, weekCut, gearInSeason, eventMode, isGobble, setSeason, SEASON, seasonOf, SEASONS, GOBBLE_FROM, GOBBLE_TO, turkeyUnlocked, isJingle, isFrost, isHeart, heartUnlocked, yetiUnlocked, wallMarks, WALL_BLOCK, BOSS_START_HP, JINGLE_FROM, JINGLE_TO, grinchUnlocked, SIDEKICKS
} from "./game.js?v=20261007b";
import { pickleLeft, staleBattle, EVENTS, eventOpen, tradeOpen, birthdayLeft, teacherPlayer, teacherReward, TEACHER_XP_PER_MISS, hasStarter, duckWindow, duckOpen, azToday, azNow, xpTotal, pullsLeft, legendaryLeft, bankXP, ownedFams, seenSet, arenaOpen, ARENA_HOURS, CREATURES, family, creature, formOf } from "./collect.js?v=20261007b";
import { watchTrades, watchBattles,
  configured, auth, classRef, studentRef, newStudentRef, isTeacherEmail, watchClass, watchStudents,
  teacherSignIn, onAuthStateChanged, signOut, setDoc, updateDoc, deleteDoc, writeBatch, db, changeBattle, battleRef, tradeRef
} from "./db.js?v=20261007b";

/* ================= state ================= */
let user = null, cls = null, clsLoaded = false, students = [], studentsLoaded = false;
let mode = "boot";           // boot | noconfig | signin | denied | setup | guide | class | battle
let day = todayIndex();
const busy = {};
let flashMsg = null, flashTimer = null, flashOk = false;
let ctab = (() => { try { return localStorage.getItem("ck-ctab") || "daily"; } catch (e) { return "daily"; } })();
let unsub = [], battles = [], trades = [], badgeWriting = false;

function todayIndex() { const d = new Date().getDay(); return d >= 1 && d <= 5 ? d - 1 : 0; }
function blankStudent(name, order) {
  return { name, order, companionId: null, petName: "", equipped: null, sidekick: "axolotl",
    status: five(""), xp: five(null), lunchXp: five(null), early: five(false), items: [],
    candyBank: 0, attacks: five(false), attackTotal: 0 };
}
// Every student list in the console is alphabetical by first name, then last name.
function byAlpha(a, b) { return String(a.fullName || a.name).localeCompare(String(b.fullName || b.name), undefined, { sensitivity: "base" }); }
function sOf(id) { return students.find(s => s.id === id); }
// Any error while clicking in the Collector (battles, trades) shows on screen instead of failing silently.
function showErr(e) { console.error(e); flash("Something went wrong \u2014 " + ((e && (e.code || e.message)) || e) + ". Tell Ms. Ariana!"); }
// Any button that breaks shows a message instead of silently doing nothing.
addEventListener("unhandledrejection", ev => showErr(ev.reason));
addEventListener("error", ev => { if (ev.error) showErr(ev.error); });
function flash(msg) { flashMsg = msg; flashOk = /^(Saved|Roster saved|New week|Haunt|\u{1F983} Gobble|\u{1F384} Jingle|\u2744\uFE0F Frostbite|\u{1F498} Sweetheart|Added|Everyone in that file)/u.test(msg); render(); clearTimeout(flashTimer); flashTimer = setTimeout(() => { flashMsg = null; render(); }, 6000); }
async function patch(id, data) {
  const s = sOf(id); if (s) Object.assign(s, data);
  render();
  try { await updateDoc(studentRef(id), data); } catch (e) { flash("Couldn’t save — " + (e.code || e.message)); }
}
/* Gobble-Palooza: on from GOBBLE_FROM to GOBBLE_TO. The console turns it on (once) the first time it's opened in
   November and off once November is over. The teacher can still flip it by hand. */
let autoBusy = false;
function autoGobble() {
  if (!cls || autoBusy || !studentsLoaded || cls.frost || cls.heart) return;   // Frostbite Festival and Sweetheart Showdown are switched by hand and wins over the others
  const t = azToday(), yr = GOBBLE_FROM.slice(0, 4), jy = JINGLE_FROM.slice(0, 4);
  // Jingle Jam: all of December, the same way.
  if (t >= JINGLE_FROM && t <= JINGLE_TO && !cls.jingle && cls.jingleAuto !== jy) { autoBusy = true; jingleOn().finally(() => { autoBusy = false; }); return; }
  if (t > JINGLE_TO && cls.jingle && cls.jingleAuto === jy) { autoBusy = true; updateDoc(classRef, { jingle: false, jingleAuto: jy + "-done" }).catch(() => {}).finally(() => { autoBusy = false; }); return; }
  if (t >= GOBBLE_FROM && t <= GOBBLE_TO && !cls.gobble && cls.gobbleAuto !== yr) { autoBusy = true; gobbleOn().finally(() => { autoBusy = false; }); }
  else if (t > GOBBLE_TO && cls.gobble && cls.gobbleAuto === yr) { autoBusy = true; updateDoc(classRef, { gobble: false, gobbleAuto: yr + "-done" }).catch(() => {}).finally(() => { autoBusy = false; }); }
}
// Whose candy is it right now? Haunt-O-Ween badge totals are only saved from Haunt-O-Ween candy.
const hauntCandy = () => isHaunt(cls) || !(cls.gobbleSince || cls.jingleSince || cls.frostSince || cls.heartSince);
// Turning Gobble-Palooza on: Haunt-O-Ween goes off, everyone's corn starts at 0, a fresh Turducken and an empty cornucopia.
// Spins, extra attacks and pies/brews they already own carry over. Haunt-O-Ween badge totals are saved first.
async function gobbleOn() {
  const b = bossState(cls, students), batch = writeBatch(db);
  batch.update(classRef, { gobble: true, haunt: false, jingle: false, frost: false, heart: false, doorsOn: false, gobbleSince: azToday(), gobbleAuto: GOBBLE_FROM.slice(0, 4),
    bucketEarned: 0, bucketSpent: 0, bossHP: BOSS_START_HP, bossBase: b.total, bossBaseHits: b.totalHits, bossHealed: 0 });
  students.forEach(s => batch.update(studentRef(s.id), { candyBank: 0, candySpent: 0, candyBonus: 0, stolen: 0,
    candyBest: Math.max(Number(s.candyBest) || 0, hauntCandy() ? candyOf(s) : 0),
    spentBest: Math.max(Number(s.spentBest) || 0, hauntCandy() ? Number(s.candySpent) || 0 : 0),
    stolenBest: Math.max(Number(s.stolenBest) || 0, hauntCandy() ? Number(s.stolen) || 0 : 0) }));
  try { await batch.commit(); if (mode === "battle") mode = "guide"; flash("\u{1F983} Gobble-Palooza is on!"); } catch (e) { flash("Couldn’t turn on Gobble-Palooza — " + e.code); }
}
// Turning Jingle Jam on: the other modes go off, everyone's presents start at 0, a fresh Grinch-a-Duck and an empty Grinch's Sack.
async function jingleOn() {
  const b = bossState(cls, students), batch = writeBatch(db);
  batch.update(classRef, { jingle: true, gobble: false, haunt: false, frost: false, heart: false, doorsOn: true, jingleSince: azToday(), jingleAuto: JINGLE_FROM.slice(0, 4),
    bucketEarned: 0, bucketSpent: 0, bossHP: BOSS_START_HP, bossBase: b.total, bossBaseHits: b.totalHits, bossHealed: 0 });
  students.forEach(s => batch.update(studentRef(s.id), { candyBank: 0, candySpent: 0, candyBonus: 0, stolen: 0,
    candyBest: Math.max(Number(s.candyBest) || 0, hauntCandy() ? candyOf(s) : 0),
    spentBest: Math.max(Number(s.spentBest) || 0, hauntCandy() ? Number(s.candySpent) || 0 : 0),
    stolenBest: Math.max(Number(s.stolenBest) || 0, hauntCandy() ? Number(s.stolen) || 0 : 0) }));
  try { await batch.commit(); if (mode === "battle") mode = "guide"; flash("\u{1F384} Jingle Jam is on!"); } catch (e) { flash("Couldn’t turn on Jingle Jam — " + e.code); }
}
// Turning Frostbite Festival on: the other modes go off, everyone's snowflakes start at 0, a fresh Abominable Snowlotl
// (12,000 health, 25 per snowball) and no snow wall yet. Frozen Doors come on too.
async function frostOn() {
  const fresh = Object.assign({}, cls, { bossDmg: 25 }), b = bossState(fresh, students), batch = writeBatch(db);
  batch.update(classRef, { frost: true, jingle: false, gobble: false, haunt: false, heart: false, doorsOn: true, frostSince: azToday(),
    bossHP: BOSS_START_HP, bossDmg: 25, bucketEarned: 0, bucketSpent: 0, bossBase: b.total, bossBaseHits: b.totalHits, bossHealed: 0, wallMark: 0, wallAt: 0, wallAbs: 0 });
  students.forEach(s => batch.update(studentRef(s.id), { candyBank: 0, candySpent: 0, candyBonus: 0, stolen: 0,
    candyBest: Math.max(Number(s.candyBest) || 0, hauntCandy() ? candyOf(s) : 0),
    spentBest: Math.max(Number(s.spentBest) || 0, hauntCandy() ? Number(s.candySpent) || 0 : 0),
    stolenBest: Math.max(Number(s.stolenBest) || 0, hauntCandy() ? Number(s.stolen) || 0 : 0) }));
  try { await batch.commit(); if (mode === "battle") mode = "guide"; flash("\u2744\uFE0F Frostbite Festival is on!"); } catch (e) { flash("Couldn\u2019t turn on Frostbite Festival \u2014 " + e.code); }
}
// Turning Sweetheart Showdown on: the other modes go off, everyone's candy hearts start at 0, a fresh Heartbreaker-otl
// (12,000 health) and an empty candy jar. Mailbox Doors come on too.
async function heartOn() {
  const b = bossState(cls, students), batch = writeBatch(db);
  batch.update(classRef, { heart: true, frost: false, jingle: false, gobble: false, haunt: false, doorsOn: true, heartSince: azToday(),
    bossHP: BOSS_START_HP, bucketEarned: 0, bucketSpent: 0, bossBase: b.total, bossBaseHits: b.totalHits, bossHealed: 0 });
  students.forEach(s => batch.update(studentRef(s.id), { candyBank: 0, candySpent: 0, candyBonus: 0, stolen: 0,
    candyBest: Math.max(Number(s.candyBest) || 0, hauntCandy() ? candyOf(s) : 0),
    spentBest: Math.max(Number(s.spentBest) || 0, hauntCandy() ? Number(s.candySpent) || 0 : 0),
    stolenBest: Math.max(Number(s.stolenBest) || 0, hauntCandy() ? Number(s.stolen) || 0 : 0) }));
  try { await batch.commit(); if (mode === "battle") mode = "guide"; flash("\u{1F498} Sweetheart Showdown is on!"); } catch (e) { flash("Couldn\u2019t turn on Sweetheart Showdown \u2014 " + e.code); }
}
async function toggleHeart() {
  if (!isHeart(cls)) { await heartOn(); return; }
  try { await updateDoc(classRef, { heart: false }); if (mode === "battle") mode = "guide"; flash("Saved \u2014 Sweetheart Showdown is off."); } catch (e) { flash("Couldn\u2019t change that \u2014 " + e.code); }
}
async function toggleFrost() {
  if (!isFrost(cls)) { await frostOn(); return; }
  try { await updateDoc(classRef, { frost: false }); if (mode === "battle") mode = "guide"; flash("Saved \u2014 Frostbite Festival is off."); } catch (e) { flash("Couldn\u2019t change that \u2014 " + e.code); }
}
async function toggleJingle() {
  if (!isJingle(cls)) { await jingleOn(); return; }
  try { await updateDoc(classRef, { jingle: false }); if (mode === "battle") mode = "guide"; flash("Saved \u2014 Jingle Jam is off."); } catch (e) { flash("Couldn\u2019t change that \u2014 " + e.code); }
}
async function toggleGobble() {
  if (!isGobble(cls)) { await gobbleOn(); return; }
  try { await updateDoc(classRef, { gobble: false }); if (mode === "battle") mode = "guide"; flash("Saved \u2014 Gobble-Palooza is off."); } catch (e) { flash("Couldn\u2019t change that \u2014 " + e.code); }
}
async function toggleHaunt() {
  if (!isHaunt(cls) && students.some(s => Number(s.candyBank) > 0 || Number(s.candyBonus) > 0 || Number(s.stolen) > 0)) { busy.hauntAsk = true; render(); return; }
  if (!isHaunt(cls)) { await hauntOn(true); return; }
  try { await updateDoc(classRef, { haunt: false }); if (mode === "battle") mode = "guide"; flash("Saved \u2014 Haunt-O-Ween Mode is off."); } catch (e) { flash("Couldn\u2019t change that \u2014 " + e.code); }
}
// Turning Haunt-O-Ween Mode on. fresh = everyone's stacked candy goes back to 0.
async function hauntOn(fresh) {
  const batch = writeBatch(db);
  const since = azToday();   // Hexaduck's streak counts from the day Haunt-O-Ween Mode is turned on
  batch.update(classRef, fresh ? { haunt: true, gobble: false, jingle: false, frost: false, heart: false, doorsOn: false, hauntSince: since, bucketEarned: 0, bucketSpent: 0 } : { haunt: true, gobble: false, jingle: false, frost: false, heart: false, doorsOn: false, hauntSince: since });
  if (fresh) students.forEach(s => batch.update(studentRef(s.id), { candyBank: 0, candySpent: 0, candyBonus: 0, stolen: 0,
    // keep each student's best totals so Haunt-O-Ween badges they earned stay earned
    candyBest: Math.max(Number(s.candyBest) || 0, candyOf(s)), spentBest: Math.max(Number(s.spentBest) || 0, Number(s.candySpent) || 0), stolenBest: Math.max(Number(s.stolenBest) || 0, Number(s.stolen) || 0) }));
  try { await batch.commit(); flash("Haunt-O-Ween Mode is on!"); } catch (e) { flash("Couldn’t change that — " + e.code); }
}
function studentLink(id) {
  const u = new URL("student.html", location.href);
  if (id) u.searchParams.set("s", id);
  return u.toString();
}

/* ================= boot ================= */
if (!configured) { mode = "noconfig"; render(); }
else onAuthStateChanged(auth, u => {
  user = u;
  unsub.forEach(f => f()); unsub = [];
  if (!u || u.isAnonymous) { mode = "signin"; render(); return; }
  if (!isTeacherEmail(u.email)) { mode = "denied"; render(); return; }
  mode = "boot"; render();
  unsub.push(watchClass(c => { cls = c; clsLoaded = true; setSeason(c); if (c && !c.weekStart) updateDoc(classRef, { weekStart: dateOfDay(0) }).catch(() => {}); if (c && checkVersion(c, true, v => updateDoc(classRef, { appVersion: v }).catch(() => {}))) return; autoGobble(); lockBadges();
    if (c && c.haunt && !c.hauntSince) updateDoc(classRef, { hauntSince: azToday() }).catch(() => {});   // Hexaduck streaks start today if the mode was already on
    if (c && !c.collectorStart) updateDoc(classRef, { collectorStart: (() => { const t = new Date(); return t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0"); })() }).catch(() => {}); if (!c) mode = "setup"; else if (mode === "boot" || mode === "setup") mode = "guide"; detectEvents(); liveRender(); },
    e => flash("Couldn’t load the class — " + e.code)));
  unsub.push(watchBattles(l => { battles = l; addIds(l, battleRef); closeStale(l); lockBadges(); if (ctab === "collector") liveRender(); }, () => {}));
  unsub.push(watchTrades(l => { trades = l; addIds(l, tradeRef); if (cls) settleTrades(tctx()); if (ctab === "collector") liveRender(); }, () => {}));
  unsub.push(watchStudents(list => { students = applyDisplayNames(list).sort(byAlpha); studentsLoaded = true; autoGobble(); detectEvents(); lockBadges(); liveRender(); },
    e => flash("Couldn’t load students — " + e.code)));
});

/* ================= celebrations (class view) ================= */
let unlockWriting = false, lastHealed = null;
const prizeSeen = {};
let seen = null, partyQueue = [], partyShowing = false, lastBossLeft = null, battleFx = null, fxTimer = null;
function battleHit(amount) {
  battleFx = { hit: true, amount };
  clearTimeout(fxTimer); fxTimer = setTimeout(() => { battleFx = null; render(); }, 1500);
}
const popIds = {};
// Save newly earned badges for every student (they're locked in forever; the student page celebrates them next visit).
/* One-time cleanup (Sept 2026): the Full-Health Week badge used to be given after only 3 days at the goal.
   Takes it back (and Full-Health Month) from anyone who hasn't really had a full Mon-Fri week. Runs once, then sets cls.healthWeekFixed. */
let healthFixing = false;
async function fixHealthBadges() {
  if (healthFixing || !cls || cls.healthWeekFixed || !studentsLoaded || !students.length) return;
  healthFixing = true;
  const batch = writeBatch(db); let n = 0;
  students.forEach(s => {
    const b = Object.assign({}, s.badges || {}), seen = Object.assign({}, s.badgesSeen || {}); let changed = false;
    if (b["health-week"] && fullWeekCount(s, battles, cls) < 1) { delete b["health-week"]; delete seen["health-week"]; changed = true; }
    if (b["health-month"] && bestFullWeekRun(s, battles, cls) < 4) { delete b["health-month"]; delete seen["health-month"]; changed = true; }
    if (!changed) return;
    const data = { badges: b, badgesSeen: seen };
    if (s.pinnedBadge && !b[s.pinnedBadge]) data.pinnedBadge = null;
    batch.update(studentRef(s.id), data); n++;
  });
  batch.update(classRef, { healthWeekFixed: new Date().toISOString(), healthWeekFixedCount: n });
  try { await batch.commit(); if (n) flash("Saved \u2014 took back the Full-Health Week badge from " + n + " student" + (n === 1 ? "" : "s") + " who hadn\u2019t had a full Mon\u2013Fri week yet."); }
  catch (e) { healthFixing = false; }
}
/* Comfort Points for the companion rooms: worked out from each student's XP history and saved as cpEarned
   (students can spend up to that). Counting starts on cls.roomStart (set the first time this runs). */
let cpWriting = false;
async function syncComfort() {
  if (cpWriting || !cls || !studentsLoaded || !students.length) return;
  if (!cls.roomStart) { cpWriting = true; try { await updateDoc(classRef, { roomStart: azToday() }); } catch (e) {} cpWriting = false; return; }
  const batch = writeBatch(db); let n = 0;
  students.forEach(s => { const cp = cpEarnedCalc(s, cls); if ((Number(s.cpEarned) || 0) !== cp) { batch.update(studentRef(s.id), { cpEarned: cp }); n++; } });
  if (!n) return;
  cpWriting = true; try { await batch.commit(); } catch (e) {} finally { cpWriting = false; }
}
// Excused days this week that were marked before the XP history remembered them: add the flag once.
let excusedSynced = false;
async function syncExcused() {
  if (excusedSynced || !cls || !studentsLoaded || !students.length) return;
  excusedSynced = true;
  const batch = writeBatch(db); let n = 0;
  students.forEach(s => {
    const st = arr5(s.status, ""), upd = {};
    st.forEach((v, d) => { const date = dateOfDay(d), x = (s.xpHist || {})[date] || {}; if (v === "e" && !x.e) upd["xpHist." + date + ".e"] = true; });
    if (Object.keys(upd).length) { batch.update(studentRef(s.id), upd); n++; }
  });
  if (n) try { await batch.commit(); } catch (e) { console.error(e); }
}
async function lockBadges() {
  fixHealthBadges(); syncComfort(); syncExcused();
  if (badgeWriting || !cls || !students.length) return;
  const batch = writeBatch(db), at = new Date().toISOString(); let n = 0;
  students.forEach(s => {
    if (!s.companionId) return;
    const ids = newlyEarned(s, battles, cls); if (!ids.length) return;
    const data = {}; ids.forEach(id => { data["badges." + id] = at; }); batch.update(studentRef(s.id), data); n++;
  });
  if (!n) return;
  badgeWriting = true;
  try { await batch.commit(); } catch (e) {} finally { badgeWriting = false; }
}
// The latest badge anyone earned stays up on The Keep until a newer one replaces it.
function badgeShout() {
  let best = null;
  students.forEach(s => {
    if (!s.companionId) return;
    Object.entries(s.badges || {}).forEach(([id, at]) => { if (badgeById(id) && (!best || at > best.at)) best = { s, id, at }; });
  });
  if (!best) return "";
  const same = Object.entries(best.s.badges).filter(([id, at]) => at === best.at && badgeById(id)).map(([id]) => badgeById(id));
  const b = badgeById(best.id), c = companionOf(best.s), who = best.s.name;
  const when = new Date(best.at).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  return '<div class="bshout">' + (b.img ? '<img src="' + esc(b.img) + '" alt="">' : '<span style="font-size:48px;line-height:1;">' + b.emoji + "</span>") +
    '<div class="bshout-t"><span class="bshout-k">\u{1F3C5} Latest badge \u00b7 ' + esc(when) + "</span>" +
    "<b>" + esc(who) + " earned " + (same.length > 1 ? same.length + " badges, including " + esc(b.name) + "!" : "the " + esc(b.name) + " badge!") + "</b>" +
    "<span>" + esc(b.desc) + "</span></div>" + (c ? '<span class="bshout-pet">' + c.glyph + "</span>" : "") + "</div>";
}
function detectEvents() {
  if (!clsLoaded || !studentsLoaded || !cls) return;
  const bd = boardDay(cls, students);
  const now = {};
  const fresh = [];
  students.forEach(s => {
    if (!s.companionId) return;
    const sim = simulate(s, cls);
    const side = sidekickToday(s, bd);
    const capes = (s.items || []).filter(i => i.id === "cape").length;
    now[s.id] = { unlocked: sim.unlocked.length, side: side ? bd : -1, capes, atk: Number(s.attackTotal) || 0, dmg: dmgOf(s, cls), badges: Object.keys(s.badges || {}) };
    const was = seen && seen[s.id];
    if (!seen || !was) return;
    const c = companionOf(s), pet = s.name || s.petName || c.name, petN = s.petName || c.name;   // pop-ups use the student's (first) name
    if (now[s.id].unlocked > was.unlocked) fresh.push({ id: s.id, text: pet + " unlocked the " + byId(ITEMS, sim.unlocked[sim.unlocked.length - 1]).name + "!", sub: sim.bestRun + "-day 120 XP streak", glyph: byId(ITEMS, sim.unlocked[sim.unlocked.length - 1]).glyph, pet: c.glyph });
    if (now[s.id].side >= 0 && was.side !== now[s.id].side) fresh.push({ id: s.id, text: pet + "’s " + (side === "duck" ? "duck" : side === "axolotl" ? "axolotl" : SIDEKICKS[side] || "axolotl") + " came to lunch!", sub: "Hit 120 XP before lunch", glyph: "☀️", pet: c.glyph });
    if (now[s.id].atk > (was.atk || 0) && eventMode(cls)) {
      const hitFor = Math.max(0, now[s.id].dmg - (was.dmg || 0)) || baseDamage(cls);
      fresh.push({ id: s.id, text: pet + " attacked the " + SEASON.boss + "!", sub: "\u2212" + hitFor + " health", glyph: "\u2694\uFE0F", pet: c.glyph, battle: true });
      battleHit(hitFor);
    }
    const newB = now[s.id].badges.filter(id => !(was.badges || []).includes(id)).map(badgeById).filter(Boolean);
    if (newB.length) fresh.push({ id: s.id, text: pet + " earned " + (newB.length === 1 ? "the " + newB[0].name + " badge!" : newB.length + " new badges!"), sub: newB.length === 1 ? newB[0].desc : newB.map(b => b.name).slice(0, 3).join(" \u00b7 ") + (newB.length > 3 ? "\u2026" : ""), glyph: "\u{1F3C5}", pet: c.glyph });
    if (capes > was.capes) fresh.push({ id: s.id, text: pet + "\u2019s " + petN + " is back thanks to a Hero Cape!", sub: "Welcome back", glyph: "\u{1F9B8}", pet: c.glyph });
  });
  seen = now;
  if (eventMode(cls)) {
    const S = SEASON;
    const healedNow = Number(cls.bossHealed) || 0;
    if (lastHealed !== null && healedNow > lastHealed) {
      const amt = healedNow - lastHealed;
      fresh.push({ text: "Ms. Ariana healed the " + S.boss + "!", sub: "+" + amt + " health", glyph: "\u{1F49A}", pet: S.bossIcon });
      battleFx = { heal: amt }; clearTimeout(fxTimer); fxTimer = setTimeout(() => { battleFx = null; render(); }, 1600);
    }
    lastHealed = healedNow;
    students.forEach(st => {
      const n = (st.spinLog || []).filter(e => e.id === "prize").length, was2 = prizeSeen[st.id];
      if (was2 !== undefined && n > was2) { const c = companionOf(st); fresh.push({ id: st.id, text: (st.name || st.petName || (c && c.name)) + " won a PRIZE!", sub: S.wheel, glyph: "\u{1F381}", pet: c ? c.glyph : S.icon }); }
      prizeSeen[st.id] = n;
    });
    const b = bossState(cls, students);
    if (lastBossLeft !== null && lastBossLeft > 0 && b.defeated) fresh.push({ text: "The " + S.boss + " has been defeated!", sub: "Great teamwork, everyone", glyph: "\u{1F389}", pet: S.bossIcon });
    // First defeat ever: unlock the hat, the snack and the boss sidekick for good.
    if (b.defeated && !cls[S.defeatFlag] && !unlockWriting) {
      unlockWriting = true;
      const unl = S.key === "heart"
        ? { text: "New unlocks: Cupid Crown, Chocolate Strawberry & Heartbreaker-otl pet!", sub: "Cupid Crown at a 5-day streak \u00b7 Chocolate Strawberry snack at 3 \u00b7 Heartbreaker-otl lunch sidekick", glyph: "\u{1F451}", pet: "\u{1F498}" }
        : S.key === "frost"
        ? { text: "New unlocks: Cozy Earmuffs, Snow Cone & Snowlotl pet!", sub: "Cozy Earmuffs at a 5-day streak \u00b7 Snow Cone snack at 3 \u00b7 Snowlotl lunch sidekick", glyph: "\u{1F3A7}", pet: "\u26C4" }
        : S.key === "jingle"
        ? { text: "New unlocks: Reindeer Antlers, Hot Cocoa & Grinch-a-Duck pet!", sub: "Reindeer Antlers at a 5-day streak \u00b7 Hot Cocoa snack at 3 \u00b7 Grinch-a-Duck lunch sidekick", glyph: "\u{1F98C}", pet: "\u{1F986}" }
        : S.key === "gobble"
        ? { text: "New unlocks: Pilgrim Hat, Pumpkin Pie & Turducken pet!", sub: "Pilgrim Hat at a 5-day streak \u00b7 Pumpkin Pie snack at 3 \u00b7 Turducken lunch sidekick", glyph: "\u{1F3A9}", pet: "\u{1F983}" }
        : { text: "New unlocks: Witch Hat, Witch\u2019s Brew & Ghost-olotl pet!", sub: "Witch Hat at a 5-day streak \u00b7 Witch\u2019s Brew snack at 3 \u00b7 Ghost-olotl lunch sidekick", glyph: "\u{1F9D9}", pet: "\u{1F47B}" };
      updateDoc(classRef, { [S.defeatFlag]: true, [S.defeatFlag + "At"]: new Date().toISOString() })
        .then(() => { partyQueue.push(unl); if (!partyShowing) runParty(); })
        .catch(e => flash("Couldn’t save the " + S.boss + " unlock — " + e.code))
        .finally(() => { unlockWriting = false; });
    }
    lastBossLeft = b.left;
  }
  if (!fresh.length) return;
  fresh.forEach(f => { popIds[f.id] = Date.now(); });
  if (fresh.length <= 3) partyQueue.push(...fresh);
  else partyQueue.push({ text: fresh.length + " companions have news!", sub: "Look for the glowing tiles", glyph: "\u{1F389}", pet: "\u{1F451}" });
  if (!partyShowing) runParty();
}
function runParty() {
  if (!partyQueue.length) { partyShowing = false; return; }
  partyShowing = true;
  const p = partyQueue.shift();
  if (mode !== "class" && mode !== "battle") { partyQueue = []; partyShowing = false; return; }
  const el = document.createElement("div");
  el.className = "party"; el.setAttribute("role", "status");
  el.innerHTML = '<span class="pe" aria-hidden="true">' + p.glyph + '</span><span><span class="pt">' + esc(p.text) +
    '</span><span class="ps">' + esc(p.sub) + '</span></span><span class="pe" aria-hidden="true">' + p.pet + "</span>";
  document.body.appendChild(el);
  confetti();
  setTimeout(() => { el.remove(); setTimeout(runParty, 350); }, 4200);
}
const canvas = document.getElementById("fx"); let ctx = null, raf = null;
function confetti() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  canvas.hidden = false; canvas.width = innerWidth; canvas.height = innerHeight;
  ctx = ctx || canvas.getContext("2d");
  const colors = ["#377F48", "#146A73", "#A87A0C", "#AE3A2A", "#6B5CA5", "#F7B8CE", "#FFD84D"];
  const parts = Array.from({ length: 110 }, () => ({ x: canvas.width * (0.2 + Math.random() * 0.6), y: -20 - Math.random() * canvas.height * 0.3,
    vx: (Math.random() - 0.5) * 3.2, vy: 2 + Math.random() * 3.6, s: 5 + Math.random() * 7, r: Math.random() * 3, vr: (Math.random() - 0.5) * 0.24,
    c: colors[(Math.random() * colors.length) | 0] }));
  if (raf) cancelAnimationFrame(raf);
  let frames = 0;
  (function step() {
    frames++; ctx.clearRect(0, 0, canvas.width, canvas.height); let alive = 0;
    parts.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.045; p.r += p.vr;
      if (p.y < canvas.height + 40) { alive++; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.62); ctx.restore(); } });
    if (alive && frames < 420) raf = requestAnimationFrame(step); else { ctx.clearRect(0, 0, canvas.width, canvas.height); canvas.hidden = true; }
  })();
}

/* ================= render ================= */
const app = document.getElementById("app");
/* ---------- the teacher's own creatures (saved on the class doc as cls.teacher) ---------- */
function tplayer() { return teacherPlayer(cls); }
async function tpatch(data, quiet) {
  const t = Object.assign({}, cls.teacher || {}), up = {};
  Object.keys(data).forEach(k => { t[k] = data[k]; up["teacher." + k] = data[k]; });
  cls.teacher = t;
  if (!quiet) render(true);
  try { await updateDoc(classRef, up); } catch (e) { flash("That didn\u2019t save \u2014 " + (e.code || e.message)); }
}
function tctx() {
  const me = tplayer();
  return { cls, students: students.concat([me]), battles, trades, me, patch: tpatch, render: () => render(true), flash };
}
/* ---------- Creature ideas from students (sent on days they hit 120) ---------- */
function ideaRows() {
  const rows = [];
  students.forEach(st => (st.ideas || []).forEach((x, i) => rows.push({ st, x, i })));
  return rows.sort((a, b) => (a.x.seen ? 1 : 0) - (b.x.seen ? 1 : 0) || String(b.x.at).localeCompare(String(a.x.at)));
}
/* ---------- Battles going on right now (end a stuck one) ---------- */
function viewLiveBattles() {
  const live = (battles || []).filter(b => ["invite", "team", "lead", "fight"].includes(b.status));
  if (!live.length) return "";
  const ago = b => { const m = Math.round((Date.now() - new Date(b.upd || b.created || 0).getTime()) / 60000); return m < 1 ? "just now" : m < 60 ? m + " min ago" : Math.round(m / 60) + " hr ago"; };
  return '<div class="card"><div class="card-head"><h2>\u2694\uFE0F Battles going on</h2><span class="fact">' + live.length + "</span></div>" +
    '<p class="lede" style="font-size:13px;">A battle nobody touches for 15 minutes stops holding anyone up. You can end one here any time \u2014 it doesn\u2019t count for anyone.</p>' +
    live.map(b => '<div class="dcheck"><span class="what"><b>' + esc(b.a.name) + "</b> vs <b>" + esc(b.b.name) + '</b> <span class="muted small">' + esc(b.status === "invite" ? "challenge sent" : b.status === "team" ? "picking teams" : "battling") + " \u00b7 last move " + ago(b) +
        ' <span style="opacity:.6">[' + esc(b.status) + " \u00b7 log " + ((b.log || []).length) + " \u00b7 out " + esc(String(b.active ? b.active.A : "-")) + "/" + esc(String(b.active ? b.active.B : "-")) + " \u00b7 moves " + (b.moves ? (b.moves.A ? "A" : "-") + (b.moves.B ? "B" : "-") : "none") + " \u00b7 " + esc(b.upd ? "new code" : "no stamp") + "]</span></span></span>" +
      '<button class="btn ghost small" data-endbattle="' + b.id + '">End battle</button></div>').join("") +
    (live.length > 1 ? '<div class="row" style="margin-top:8px;"><button class="btn small" data-act="endAllBattles">End all ' + live.length + "</button></div>" : "") + "</div>";
}
async function endBattle(id) {
  try { await changeBattle(id, b => (["invite", "team", "lead", "fight"].includes(b.status) ? Object.assign(b, { status: "ended", endedBy: "teacher", upd: new Date().toISOString(), moves: { A: null, B: null } }) : null)); }
  catch (e) { flash("Couldn\u2019t end that battle \u2014 " + (e.code || e.message)); }
}
function newIdeas() { return ideaRows().filter(r => !r.x.seen).length; }
function viewIdeas() {
  const rows = ideaRows(), n = rows.filter(r => !r.x.seen).length;
  let h = '<div class="card"><div class="card-head"><h2>\u{1F4A1} Student ideas</h2><span class="fact">' + (n ? "<b>" + n + "</b> new" : rows.length + " total") + "</span></div>";
  if (!rows.length) return h + '<p class="lede">When a student hits ' + goalXP(cls) + " XP, they can send you one idea for a new creature, accessory or room decoration that day. Their ideas show up here.</p></div>";
  const card = r => '<div class="idea' + (r.x.seen ? " seen" : "") + '"><div class="ideahead">' + (r.x.kind === "gear" ? "\u{1F3A9}" : r.x.kind === "room" ? "\u{1F6CF}\uFE0F" : "\u{1F43E}") + " <b>" + esc(r.x.name) + "</b> <span class=\"fact\">" + esc(r.x.kind === "gear" ? "Accessory \u00b7 " + ({ hat: "head", eyes: "eyes", snack: "snack / held", other: "other" }[r.x.slot] || "") : r.x.kind === "room" ? "Room decor \u00b7 " + String(r.x.slot || "").replace("_", " ") : (r.x.types || []).join(" / ")) + "</span>" +
      '<label class="ideaseen"><input type="checkbox" data-ideaseen="' + r.st.id + ":" + r.i + '"' + (r.x.seen ? " checked" : "") + "> Seen</label></div>" +
      '<div class="muted small">by <b>' + esc(r.st.name) + "</b> \u00b7 " + esc(new Date(r.x.date + "T12:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })) +
      (r.x.animal ? " \u00b7 based on: " + esc(r.x.animal) : "") + "</div>" +
      (r.x.lore ? '<p class="idealore">' + esc(r.x.lore) + "</p>" : "") + "</div>";
  const fresh = rows.filter(r => !r.x.seen), seen = rows.filter(r => r.x.seen);
  const shown = busy.allIdeas ? fresh : fresh.slice(0, 8);
  h += fresh.length ? '<div class="idealist">' + shown.map(card).join("") + "</div>" : '<p class="muted small">No new ideas \u2014 you\u2019ve seen them all. \u2705</p>';
  if (fresh.length > 8) h += '<button class="btn ghost small" data-act="allIdeas">' + (busy.allIdeas ? "Show fewer" : "Show all " + fresh.length + " new") + "</button>";
  // ideas already checked as seen: one short line each, tucked away
  if (seen.length) {
    const kind = x => x.kind === "gear" ? "\u{1F3A9}" : x.kind === "room" ? "\u{1F6CF}\uFE0F" : "\u{1F43E}";
    h += '<details class="seenideas" style="margin-top:10px;"' + (busy.seenIdeas ? " open" : "") + '><summary data-act="seenIdeas"><b>\u2705 Seen ideas</b> <span class="muted small">(' + seen.length + ")</span></summary>" +
      '<div class="seenlist">' + seen.map(r => '<div class="seenrow"><span>' + kind(r.x) + " <b>" + esc(r.x.name) + '</b> <span class="muted small">by ' + esc(r.st.name) + " \u00b7 " +
        esc(new Date(r.x.date + "T12:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })) + "</span></span>" +
        '<label class="ideaseen small"><input type="checkbox" data-ideaseen="' + r.st.id + ":" + r.i + '" checked> Seen</label></div>').join("") + "</div></details>";
  }
  return h + "</div>";
}
function teacherCollectorCard() {
  return '<div class="card"><div class="card-head"><h2>\u{1F9D1}\u200D\u{1F3EB} Your collection</h2><span class="fact">battle your students!</span></div>' +
    '<p class="lede" style="font-size:13.5px;">Your own collection. Students see you in the arena as <b>' + esc(tplayer().name) + "</b>.</p></div>" +
    collectorTab(tctx());
}
// While a finger/mouse is pressed, hold page redraws until it lifts. Otherwise a redraw from someone else's
// update (25 kids playing at once) swaps the button out mid-click and the click is lost.
let ptrDown = false, heldRender = null;
addEventListener("pointerdown", () => { ptrDown = true; }, true);
const ptrUp = () => setTimeout(() => { ptrDown = false; if (heldRender !== null) { const f = heldRender; heldRender = null; render(f); } }, 60);
addEventListener("pointerup", ptrUp, true); addEventListener("pointercancel", ptrUp, true);
// Live updates from the database are bundled into one redraw.
let liveTimer = null;
let liveNow = false;   // true while redrawing for a database update (typed text is kept)
function liveRender() { if (liveTimer) return; liveTimer = setTimeout(() => { liveTimer = null; liveNow = true; try { render(); } finally { liveNow = false; } }, 120); }
// Keep what the user typed (and where the cursor is) when the page redraws for someone else's update.
function saveFields(root) {
  const out = {}, act = document.activeElement;
  root.querySelectorAll("input[id], textarea[id], select[id]").forEach(el => {
    if (el.type === "file" || el.type === "checkbox" || el.type === "radio") return;
    const changed = el.tagName === "SELECT" ? [...el.options].some(o => o.selected !== o.defaultSelected) : el.value !== el.defaultValue;
    if (changed || el === act) out[el.id] = { v: el.value, focus: el === act, s: el.selectionStart, e: el.selectionEnd };
  });
  return out;
}
function restoreFields(saved) {
  Object.entries(saved).forEach(([id, f]) => {
    const el = document.getElementById(id); if (!el) return;
    el.value = f.v;
    if (f.focus) { el.focus(); try { el.setSelectionRange(f.s, f.e); } catch (e) {} }
  });
}
function render(force) {
  if (ptrDown) { heldRender = heldRender || !!force; return; }
  if (!force && mode === "guide" && ctab === "collector" && collectorBusy()) return;   // don't redraw mid egg-hatch or page flip
  document.getElementById("wrap").className = mode === "class" || mode === "battle" ? "wrap wide" : "wrap";
  document.getElementById("pageTitle").textContent = mode === "class" ? "The Keep" : mode === "battle" ? "Battle Area" : "Companion Keep Console";
  document.getElementById("eyebrow").textContent = mode === "class" ? ((cls && cls.weekLabel) || "This week")
    : (cls && cls.className ? cls.className + (cls.weekLabel ? "  ·  " + cls.weekLabel : "") : "Teacher console");
  document.getElementById("rulesCard").hidden = !(mode === "guide" && ctab === "settings");

  let top = "";
  if (mode === "battle" && !battleOn(cls)) mode = "guide";   // no Battle Area outside special modes
  const bat = battleOn(cls) ? '<button class="btn small" data-act="battleView" style="background:#5B2A86;">\u2694\uFE0F Battle Area</button>' : "";
  if (mode === "guide") top = '<button class="btn small" data-act="classView">Class view</button>' + bat + '<button class="btn ghost small" data-act="signOut">Sign out</button>';
  else if (mode === "class") top = bat + '<button class="btn ghost small" data-act="testParty">Test celebration</button><button class="btn ghost small" data-act="backConsole">Back to console</button>';
  else if (mode === "battle") top = '<button class="btn small" data-act="classView">The Keep</button><button class="btn ghost small" data-act="backConsole">Back to console</button>';
  document.getElementById("topActions").innerHTML = top;

  let h = flashMsg ? '<div class="banner ' + (flashOk ? "info" : "bad") + '">' + esc(flashMsg) + "</div>" : "";
  if (mode === "boot") h += '<div class="card"><p class="lede">Connecting to your class…</p></div>';
  else if (mode === "noconfig") h += '<div class="card"><h2>Almost there</h2><p class="lede" style="margin-top:8px;">Paste your Firebase settings into <code>js/firebase-config.js</code> (see README.md), then reload.</p></div>';
  else if (mode === "signin") h += '<div class="card"><div class="card-head"><h2>Teacher sign-in</h2></div><p class="lede">Sign in with your school Google account.</p><div class="row" style="margin-top:14px;"><button class="btn" data-act="signIn">Sign in with Google</button></div><p class="lede" style="margin-top:12px;font-size:13.5px;">Students: use the student link your teacher sent.</p></div>';
  else if (mode === "denied") h += '<div class="card"><h2>This console is for the teacher</h2><p class="lede" style="margin-top:8px;">' + esc(user && user.email) + ' isn’t on the teacher list.</p><div class="row" style="margin-top:14px;"><button class="btn ghost" data-act="signOut">Use a different account</button></div></div>';
  else if (mode === "setup") h += viewSetup();
  else if (mode === "class") h += keepHTML(cls, students, popIds, badgeShout());
  else if (mode === "battle") h += battleHTML(cls, students, battleFx) + (isFrost(cls) ? "" : healControls());
  else {
    const np = prizesOpen(), nd = waitingDoors(students, cls).length;
    const tabs = [["daily", "\u{1F4C5} Daily"], ["students", "\u{1F43E} Students"], ["collector", "\u{1F95A} Collector" + (newIdeas() ? ' <span class="tbadge" aria-label="new creature ideas">' + newIdeas() + "</span>" : "")], ["events", "\u2728 Events" + (eventMode(cls) ? " " + SEASON.icon : "") + (np + nd ? ' <span class="tbadge" aria-label="' + (np + nd) + ' to check">' + (np + nd) + "</span>" : "")], ["quest", "\u{1F5FA}\uFE0F Quest"], ["settings", "\u2699\uFE0F Settings"]];
    if (!tabs.some(x => x[0] === ctab)) ctab = "daily";
    if (nd && nd > doorHidden) h += '<div class="banner prizealert"><span>\u{1F6AA} <b>' + nd + " door" + (nd === 1 ? "" : "s") + "</b> to check" + doorNames() + '</span><span class="row" style="gap:8px;"><button class="btn small" data-act="goDoors">Check doors</button><button class="btn ghost small" data-act="hideDoors">Hide</button></span></div>';
    if (np && np > prizeHidden) h += '<div class="banner prizealert"><span>\u{1F381} <b>' + np + " prize" + (np === 1 ? "" : "s") + "</b> to order or give" + prizeNames() + '</span><span class="row" style="gap:8px;"><button class="btn small" data-act="goPrizes">View prizes</button><button class="btn ghost small" data-act="hidePrizes">Hide</button></span></div>';
    h += '<div class="tabs ctabs" role="tablist">' + tabs.map(([k, l]) => '<button role="tab" class="tab' + (ctab === k ? " on" : "") + '" data-ctab="' + k + '" aria-selected="' + (ctab === k) + '">' + l + "</button>").join("") + "</div>";
    if (ctab === "daily") h += viewDaily() + viewWeekDoor() + viewRewards();
    else if (ctab === "students") h += viewStandings() + viewAssign() + viewLosses() + viewLinks();
    else if (ctab === "collector") h += viewLiveBattles() + viewIdeas() + teacherCollectorCard() + viewCollector();
    else if (ctab === "quest") h += questTracker(students);
    else if (ctab === "events") h += viewModes() + viewBossHits() + (eventMode(cls) || waitingDoors(students, cls).length ? viewDoors() : "") + EVENT_LIST.map(E => E.season(cls) || tevTeams(E, cls).length ? viewTeamEvent(E) : "").join("") + duckAdmin() + (eventMode(cls) ? viewBucket() + viewPrizes() + viewShop() : prizeRows().length ? viewPrizes() : "");
    else h += viewClassSettings();
  }

  const active = document.activeElement, keep = active && active.id && active.matches("input, textarea") ? { id: active.id, v: active.value, pos: active.selectionStart } : null;
  const fields = liveNow ? saveFields(app) : {};
  app.innerHTML = h + (mode === "guide" ? '<p class="muted small" style="text-align:center;margin:18px 0 6px;opacity:.6;">Version ' + APP_V + "</p>" : "") + (mode === "guide" && ctab === "collector" && cls ? collectorOverlays(tctx()) : "");
  restoreFields(fields);
  if (keep) { const n = document.getElementById(keep.id); if (n) { n.value = keep.v; n.focus(); try { n.setSelectionRange(keep.pos, keep.pos); } catch (e) {} } }
  renderRules();
  if (!baseTitle) baseTitle = document.title;
  const np = cls && mode === "guide" ? prizesOpen() : 0;
  document.title = (np ? "(" + np + " \u{1F381}) " : "") + baseTitle;   // shows on the browser tab too
}
let baseTitle = "";

function renderRules() {
  const tb = document.querySelector("#itemTable tbody");
  if (tb && !tb.innerHTML) tb.innerHTML = ITEMS.map(it => "<tr><td>" + itemArt(it, "gimg") + " " + esc(it.name) + '</td><td class="eff">' +
    (it.streak ? it.streak + "-day 120 XP streak" : "You award it after a pet disappears and the student hits 120 again") + "</td></tr>").join("");
}

function viewSetup() {
  return '<div class="card"><div class="card-head"><h2>Set up your class</h2></div><div class="row">' +
    '<div class="field" style="flex:1;min-width:210px;"><label for="setClass">Class name</label><input id="setClass" type="text" maxlength="48" placeholder="Ms. Ariana’s Class"></div>' +
    '<div class="field" style="flex:1;min-width:160px;"><label for="setWeek">Week label</label><input id="setWeek" type="text" maxlength="32" placeholder="Week of Sept 28"></div>' +
    '<div class="field" style="width:130px;"><label for="setGoal">Daily XP goal</label><input id="setGoal" type="number" min="10" max="2000" step="10" value="120"></div>' +
    '<button class="btn" data-act="saveSetup">Create the class</button></div></div>';
}

/* ---------- daily XP ---------- */
function finalizeBox() {
  if (busy.finalize !== day) return "";
  const f = finalizePreview(cls, students, day);
  // No end-of-day XP uploaded yet: everyone would count as missed (and fill the bucket), so warn first.
  const team = students.filter(x => x.companionId), noData = team.filter(x => arr5(x.xp, null)[day] == null && arr5(x.status, "")[day] !== "c" && arr5(x.status, "")[day] !== "e");
  if (team.length && noData.length === team.length && busy.finalizeAnyway !== day)
    return '<div class="banner warn" style="margin-bottom:12px;"><b>\u26A0\uFE0F ' + DAYS[day] + "\u2019s end-of-day XP isn\u2019t uploaded yet.</b> If you finalize now, every student counts as missing " + goalXP(cls) + " XP" +
      (eventMode(cls) ? " and the " + esc(SEASON.bucket) + " would get <b>+" + f.candy + "</b> " + SEASON.cur : "") + ". Upload the day\u2019s XP first, then finalize." +
      '<div class="row" style="margin-top:8px;"><button class="btn ghost small" data-act="finalizeCancel">OK, I\u2019ll upload first</button><button class="btn ghost small" data-act="finalizeAnyway">Finalize anyway</button></div></div>';
  return '<div class="banner warn" style="margin-bottom:12px;"><b>Finalize ' + DAYS[day] + "?</b> This locks in the day and counts it toward health." +
    (noData.length ? "<br>\u26A0\uFE0F No end-of-day XP yet for: " + noData.map(x => esc(x.name)).join(", ") + " (they count as missed)." : "") +
    "<br>" + f.missed.length + " student" + (f.missed.length === 1 ? "" : "s") + " missed " + goalXP(cls) + " XP" + (f.missed.length ? ": " + f.missed.map(x => esc(x.name)).join(", ") : "") + "." +
    (eventMode(cls) ? "<br>" + SEASON.coin + " " + SEASON.bucket + " gets <b>+" + f.candy + "</b> " + SEASON.cur + "." : "") +
    "<br>\u2B50 Full health: <b>" + f.full.length + "</b> student" + (f.full.length === 1 ? "" : "s") + " (they go on your reward list)." +
    (f.died.length ? "<br>\u{1F480} Disappears: " + f.died.map(x => esc(x.name)).join(", ") + " (added to the losses log)." : "") +
    (() => { const tr = teacherReward(students, day); return "<br>\u{1F9D1}\u200D\u{1F3EB} Your creatures: <b>+" + tr.eggs + " egg" + (tr.eggs === 1 ? "" : "s") + "</b> and <b>+" + tr.xp + " XP</b>."; })() +
    '<div class="row" style="margin-top:8px;"><button class="btn small" data-act="finalizeOk">Yes, finalize</button><button class="btn ghost small" data-act="finalizeCancel">Cancel</button></div></div>';
}

function viewDaily() {
  const rec = recordedDays(cls), goal = goalXP(cls);
  let h = '<div class="card"><div class="card-head"><h2>Daily XP</h2><span class="fact">Goal: <b>' + goal + " XP</b> a day</span></div>";
  h += '<div class="daynav">' + DAYS.map((d, i) => '<button class="daytab" data-day="' + i + '" aria-pressed="' + (i === day) + '">' + d +
    '<span class="dot' + (rec[i] ? " on" : "") + '"></span>' + (arr5(cls.finalized, false)[i] ? '<span class="fin" title="Finalized">\u{1F512}</span>' : "") + "</button>").join("") + "</div>";

  h += '<div class="row" style="margin-bottom:10px;align-items:center;">' +
    '<label class="btn" style="background:var(--warn);color:#fff;" for="upLunch">☀️ Upload lunch spreadsheet</label><input id="upLunch" type="file" accept=".csv,.xlsx,.xls" hidden>' +
    '<label class="btn" for="upDay">Upload end-of-day spreadsheet</label><input id="upDay" type="file" accept=".csv,.xlsx,.xls" hidden>' +
    '<button class="btn ghost" data-act="pasteOpen">\u{1F4CB} Paste data</button>' +
    '<button class="btn ghost" data-act="toggleRecorded">' + (rec[day] ? "✓ " + DAYS[day] + " is counting" : "Count " + DAYS[day] + " toward health") + "</button>" +
    '<button class="btn ghost" data-act="clearDay">Clear ' + SHORT[day] + "</button>" +
    (arr5(cls.finalized, false)[day]
      ? '<button class="btn ghost" data-act="unfinalize">\u{1F512} ' + SHORT[day] + " finalized \u00b7 undo</button>"
      : '<button class="btn" data-act="finalize" style="background:var(--good);">\u2705 Finalize ' + DAYS[day] + "</button>") + "</div>" + lunchLateBox() + pasteBox() + finalizeBox() +
    '<p class="lede" style="font-size:13px;margin-bottom:12px;">CSV or XLSX with <b>name</b> and <b>completed</b> columns. The <b>lunch</b> file marks who already hit ' + goal +
    ' (their sidekick joins them today). The <b>end-of-day</b> file decides health and turns the day on.</p>';

  const up = busy.upReport;
  if (up && up.day === day) {
    h += '<div class="banner ' + (up.unmatched.length || up.missing.length ? "warn" : "info") + '"><b>' + (up.kind === "lunch" ? "Lunch" : "End of day") + " · " + esc(up.file) + ":</b> matched " +
      up.matched + " students · " + up.hit + " at " + goal + "+ XP.";
    if (up.missing.length) h += "<br>Not in this file (their " + (up.kind === "lunch" ? "lunch" : "end-of-day") + " number was cleared): " + up.missing.map(esc).join(", ");
    if (up.unmatched.length) h += "<br>In the file but not on your roster: " + up.unmatched.map(u => esc(u.name)).join(", ") +
      '<div style="margin-top:8px;"><button class="btn small" data-act="addUnmatched">Add ' + up.unmatched.length + " to roster</button></div>";
    h += "</div>";
  }
  if (!students.length) return h + '<p class="lede">Add your roster in Class settings below.</p></div>';

  h += '<div class="scroll-x"><table class="checkin"><thead><tr><th>Student</th><th>By lunch</th><th>XP</th><th class="heavy">' + goal + " XP</th><th>Tech issue</th></tr></thead><tbody>";
  students.forEach(s => {
    const c = companionOf(s);
    const v = arr5(s.status, "")[day], early = arr5(s.early, false)[day];
    const xp = arr5(s.xp, null)[day], lx = arr5(s.lunchXp, null)[day];
    const cls2 = v === "c" ? "c" : v === "e" ? "e" : rec[day] ? "m" : "";
    const sym = v === "c" ? "✓" : v === "e" ? "–" : rec[day] ? "✕" : "·";
    h += '<tr><td class="nm">' + esc(s.name) + "<small>" + (c ? c.glyph + " " + esc(s.petName || c.name) : "no companion yet") + "</small></td>" +
      '<td><button class="lunchbtn' + (early ? " on" : "") + '" data-lunch="' + s.id + '" aria-label="' + esc(s.name) + " hit goal by lunch: " + (early ? "yes" : "no") + '">' + (early ? "☀️" : "·") + "</button>" +
        (lx != null ? '<small class="muted" style="display:block;">' + lx + "</small>" : "") + "</td>" +
      '<td style="font-family:var(--mono);">' + (xp == null ? '<span class="muted">—</span>' : xp) + "</td>" +
      '<td class="heavy"><button class="ring ' + cls2 + '" data-ring="' + s.id + '" aria-label="' + esc(s.name) + " " + (v === "c" ? "hit" : v === "e" ? "excused" : "missed") + '">' + sym + "</button></td>" +
      '<td><button class="btn ghost small" data-excuse="' + s.id + '">Excuse day</button></td></tr>';
  });
  return h + "</tbody></table></div></div>";
}

/* ---------- standings ---------- */
// Hover text for a day dot: what the game has saved for that day (helps check excused / streak questions).
function dotTip(s, d, v, eh) {
  const xp = arr5(s.xp, null)[d], lx = arr5(s.lunchXp, null)[d];
  return DAYS[d] + ": " + (xp != null ? xp + " XP" : "no end-of-day XP") + (lx != null ? " (lunch " + lx + ")" : "") +
    (eh ? " \u2014 excused, but hit " + goalXP(cls) + " (counts!)" : v === "e" ? " \u2014 excused (skipped)" : v === "c" ? " \u2014 hit" : "");
}
function viewStandings() {
  const rec = recordedDays(cls);
  let h = '<div class="card"><div class="card-head"><h2>Full standings</h2><span class="fact"><b>two 120 XP misses in a row → disappears</b></span></div>';
  if (!students.length) return h + '<p class="lede">No students yet.</p></div>';
  const rows = students.map(s => ({ s, sim: s.companionId ? simulate(s, cls) : null }))
    .sort((a, b) => byAlpha(a.s, b.s));
  h += '<div class="scroll-x"><table class="grid"><thead><tr><th>Student</th><th>Companion</th><th>Mon–Fri</th><th>Days hit</th><th>Health</th><th>Standing</th>' + (eventMode(cls) ? "<th>" + SEASON.coin + " " + SEASON.Cur + " left</th>" : "") + '<th>Gear</th></tr></thead><tbody>';
  rows.forEach(({ s, sim }) => {
    const c = companionOf(s);
    h += '<tr><td class="who">' + esc(s.name) + '<span class="pet"><button class="btn ghost small" data-copylink="' + s.id + '" style="margin-top:4px;padding:3px 8px;">Copy link</button> <button class="btn ghost small" data-viewas="' + s.id + '" style="margin-top:4px;padding:3px 8px;" title="See this student\u2019s page (read-only)">\u{1F440} View as</button></span></td>';
    h += "<td>" + (c ? c.glyph + " <b>" + esc(s.petName || c.name) + '</b><span class="pet">' + esc(c.name) + "</span>" : '<span class="muted">not chosen</span>') +
      ' <button class="btn ghost small" data-assign="' + s.id + '" style="margin-left:6px;">' + (c ? "Change" : "Set") + "</button></td>";
    if (!sim) { h += '<td colspan="' + (eventMode(cls) ? 6 : 5) + '" class="muted">waiting for this student to choose</td></tr>'; return; }
    h += '<td><span class="dots">' + [0, 1, 2, 3, 4].map(d => {
      const v = arr5(s.status, "")[d], eh = v === "e" && hitOn(s, d, cls), k = v === "c" ? "c" : eh ? "c eh" : v === "e" ? "e" : rec[d] ? "m" : "";
      return '<span class="dcol"><span class="dot3 ' + k + '" title="' + esc(dotTip(s, d, v, eh)) + '"></span>' + (arr5(s.early, false)[d] ? '<span style="font-size:10px;line-height:1;">☀️</span>' : "") + "</span>";
    }).join("") + "</span></td>";
    h += '<td><span class="ovtag ' + (!sim.alive ? "bad" : sim.atRisk ? "warn" : "good") + '">' + sim.ovMet + " / " + sim.ovCounted + "</span>" +
      (sim.atRisk ? '<span class="pet">miss tomorrow = gone</span>' : "") + "</td>";
    const t = tier(sim);
    h += '<td><span class="hp t-' + t.key + '"><span class="track"><span class="bar" style="width:' + Math.max(0, Math.min(100, sim.health / sim.max * 100)) + '%"></span></span><span class="n">' + sim.health + "</span></span></td>";
    h += '<td style="color:' + (!sim.alive ? "var(--bad)" : "var(--ink-2)") + '">' + t.label + (sim.capeSaved ? '<span class="pet">saved by the cape</span>' : "") +
      (sim.capeReady ? ' <button class="btn small" data-givecape="' + s.id + '" style="margin-top:4px;">\u{1F9B8} Award Hero Cape</button>' : "") + "</td>";
    if (eventMode(cls)) { const cd = candyLeft(s), ce = candyOf(s); h += '<td style="font-family:var(--mono);color:#E8740C;">' + cd.toLocaleString() + '<span class="pet">earned ' + ce.toLocaleString() + "</span></td>"; }
    const worn = wornItem(s, sim);
    h += '<td><div class="eqrow">' + GEAR.filter(g => gearInSeason(g)).map(g => {
      const ok = sim.unlocked.includes(g.id);
      return '<button class="eq' + (worn && worn.id === g.id ? " on" : "") + '" data-equip="' + s.id + ":" + g.id + '"' + (ok ? "" : " disabled") +
        ' title="' + esc(g.name) + (ok ? "" : " — unlocks at a " + g.streak + "-day streak") + '">' + itemArt(g, "gimg") + "</button>";
    }).join("") + '</div><span class="pet">streak ' + sim.hitRun + " · best " + sim.bestRun + ' <button class="linkbtn" data-setstreak="' + s.id + '" title="Fix this student\u2019s streak">\u270F\uFE0F</button></span>';
    (s.items || []).forEach((it, idx) => { const d4 = byId(ITEMS, it.id); if (d4) h += '<button class="x" title="Remove ' + esc(d4.name) + '" data-unaward="' + s.id + ":" + idx + '">' + d4.glyph + "</button>"; });
    h += "</td></tr>";
  });
  return h + "</tbody></table></div></div>";
}

function healControls() {
  const k = bucketState(cls, students), b = bossState(cls, students);
  const S = SEASON;
  return '<div class="card" style="margin-top:14px;"><div class="card-head"><h2>' + S.coin + " Heal the " + S.boss + '</h2><span class="fact">' + (S.key === "gobble" ? "Cornucopia" : S.key === "jingle" ? "Sack" : S.key === "heart" ? "Candy jar" : "Bucket") + ": <b>" + k.left.toLocaleString() + "</b> " + S.cur + "</span></div>" +
    '<p class="lede" style="font-size:13.5px;">Each ' + (S.key === "gobble" ? "piece of corn" : S.key === "jingle" ? "present" : S.key === "heart" ? "candy heart" : "candy") + " heals <b>" + k.rate + "</b> health. The " + S.boss + " can\u2019t heal past " + b.max.toLocaleString() + ".</p>" +
    '<div class="healrow" style="justify-content:flex-start;"><div class="field"><label for="healCandy">' + S.Cur + ' to spend</label><input id="healCandy" type="number" min="1" step="1" placeholder="50"></div>' +
    '<button class="btn" data-act="heal" style="background:#2E9E5B;"' + (k.left && !b.defeated ? "" : " disabled") + ">\u{1F49A} Heal</button>" +
    '<div class="field"><label for="healRate">Health per ' + (SEASON.key === "gobble" ? "corn" : SEASON.key === "jingle" ? "present" : SEASON.key === "heart" ? "heart" : "candy") + '</label><input id="healRate" type="number" min="1" step="1" value="' + k.rate + '"></div>' +
    '<button class="btn ghost" data-act="saveRate">Save rate</button></div></div>';
}
function viewBucket() {
  if (isFrost(cls)) {   // the Snowlotl's snow wall instead of a bucket; no healing
    const w = bossState(cls, students).wall || { left: 0, built: 0, absorbed: 0 };
    return '<div class="card"><div class="card-head"><h2>\u{1F9CA} ' + SEASON.bucket + '</h2><span class="fact"><b>' + w.left.toLocaleString() + "</b> HP standing</span></div>" +
      '<p class="lede" style="font-size:13.5px;">Finalizing a day adds a ' + WALL_BLOCK + " HP snow block for every student who missed " + goalXP(cls) + " XP. Snowballs knock the wall down first, then hit the Snowlotl. " +
      "Built " + w.built.toLocaleString() + " \u00b7 knocked down " + w.absorbed.toLocaleString() + ".</p></div>";
  }
  const k = bucketState(cls, students);
  return '<div class="card"><div class="card-head"><h2>' + SEASON.icon + " " + SEASON.bucket + '</h2><span class="fact"><b>' + k.left.toLocaleString() + "</b> " + SEASON.cur + "</span></div>" +
    '<p class="lede" style="font-size:13.5px;">Finalizing a day adds ' + BUCKET_PER_MISS + " for every student who missed " + goalXP(cls) + " XP. Earned " + k.earned.toLocaleString() +
    " \u00b7 stolen on the wheel " + k.stolen.toLocaleString() + " \u00b7 spent healing " + k.spent.toLocaleString() + ".</p>" + healControls().replace('<div class="card" style="margin-top:14px;">', '<div style="margin-top:6px;">') + "</div>";
}
// Every prize any student has won, in any event. Unchecked ones show as a red number on the Events tab
// and a banner at the top of the console until Ms. Ariana ticks "Done".
let prizeHidden = 0;   // "Hide" on the banner hides it until another prize comes in
function prizeRows() {
  const rows = [];
  students.forEach(s => (s.spinLog || []).forEach((e, idx) => { if (e.id === "prize" && !(Number(e.xp) > 0)) rows.push({ s, e, idx }); }));   // XP prizes go straight into their XP: nothing to order
  // XP from Daily Doors presents is already in their XP, so it isn't listed either
  if (false) doorXPRows(students).forEach(r => rows.push({ s: r.s, door: r.date + "/" + r.k, e: { ordered: !!r.e.ordered, at: r.e.openedAt || r.e.at, xp: REWARD_XP[r.e.r.id], prizeName: "+" + REWARD_XP[r.e.r.id] + " XP (" + (r.k === "g" ? "Golden Present" : "door " + (Number(r.k) + 1)) + ")", doorXP: true } }));
  return rows;
}
function prizesOpen() { return prizeRows().filter(r => !r.e.ordered).length; }
function prizeNames() {
  const o = prizeRows().filter(r => !r.e.ordered).map(r => esc(r.s.name || "?"));
  return o.length ? ": " + (o.length > 4 ? o.slice(0, 4).join(", ") + " + " + (o.length - 4) + " more" : o.join(", ")) : "";
}
function prizeInfo(e) {
  if (e.doorXP) return { name: e.prizeName, icon: "\u2B50", img: "", link: "", xp: e.xp };
  const list = (SEASONS[e.s || "haunt"] || SEASONS.haunt).prizes;
  return list[e.prize] || { name: e.prizeName || "Prize", icon: "\u{1F381}", img: "", link: "" };
}
/* ---------- Boss hits per student, for each event ----------
   Every attack counts once (a 120 XP day, a bought attack or a Free Attack from the wheel).
   Turducken hits are saved as turkeyAtk, Grinch-a-Duck hits as grinchAtk; the rest of attackTotal are Ghost-olotl hits. */
function rawHits(st) { const all = Number(st.attackTotal) || 0, t = Number(st.turkeyAtk) || 0, g = Number(st.grinchAtk) || 0, y = Number(st.yetiAtk) || 0, hb = Number(st.heartAtk) || 0; return { haunt: Math.max(0, all - t - g - y - hb), gobble: t, jingle: g, frost: y, heart: hb }; }
// cls.hitBase = { haunt: { studentId: hits when the count was restarted }, gobble: {...}, jingle: {...} }, cls.hitReset = { haunt: ISO date, ... }
function viewBossHits() {
  const team = students.filter(x => x.companionId), base = cls.hitBase || {}, when = cls.hitReset || {};
  const rows = team.map(st => { const r = rawHits(st), o = { st };
    ["haunt", "gobble", "jingle", "frost", "heart"].forEach(k => { o[k] = Math.max(0, r[k] - (Number((base[k] || {})[st.id]) || 0)); }); o.all = o.haunt + o.gobble + o.jingle + o.frost + o.heart; return o; });
  if (!team.some(st => Number(st.attackTotal) > 0)) return "";
  const cur = SEASON.key, cols = [["haunt", "\u{1F383} Haunt-O-Ween", "Ghost-olotl"], ["gobble", "\u{1F983} Gobble-Palooza", "Turducken"], ["jingle", "\u{1F384} Jingle Jam", "Grinch-a-Duck"], ["frost", "\u2744\uFE0F Frostbite", "Snowlotl"], ["heart", "\u{1F498} Sweetheart", "Heartbreaker-otl"]];
  const key = busy.hitSort || (eventMode(cls) ? cur : "all");
  rows.sort((a, b) => b[key] - a[key] || String(a.st.name).localeCompare(String(b.st.name)));
  const tot = k => rows.reduce((n, r) => n + r[k], 0);
  const md = d => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const th = (k, l, sub) => '<th><button class="linkbtn" data-hitsort="' + k + '">' + l + (key === k ? " \u25BC" : "") + "</button>" + (sub ? '<div style="text-transform:none;letter-spacing:0;font-weight:400;">' + sub + "</div>" : "") + "</th>";
  return '<div class="card"><div class="card-head"><h2>\u2694\uFE0F Boss hits</h2><span class="fact">' + tot("all").toLocaleString() + " hits total</span></div>" +
    '<p class="lede" style="font-size:13px;">How many times each student hit each event\u2019s boss. Click a column to sort. <b>Restart</b> sets that event\u2019s count back to 0 for everyone (for a new boss or a new year).</p>' +
    '<div class="scroll-x"><table class="tbl"><thead><tr><th>Student</th>' + cols.map(([k, l, b]) => th(k, l, b + (when[k] ? " \u00b7 since " + md(when[k]) : ""))).join("") + th("all", "Total") + "</tr></thead><tbody>" +
    rows.map(r => "<tr><td><b>" + esc(r.st.name) + "</b></td>" + cols.map(([k]) => '<td class="eff"' + (k === cur && eventMode(cls) ? ' style="font-weight:800;"' : "") + ">" + r[k] + "</td>").join("") + '<td class="eff"><b>' + r.all + "</b></td></tr>").join("") +
    '<tr style="border-top:2px solid var(--line);"><td><b>Class</b></td>' + cols.map(([k]) => '<td class="eff"><b>' + tot(k) + "</b></td>").join("") + '<td class="eff"><b>' + tot("all") + "</b></td></tr>" +
    '<tr><td></td>' + cols.map(([k, l]) => "<td>" + (busy.hitReset === k ? '<button class="btn small danger" data-hitreset="' + k + '">Yes, restart</button> <button class="btn ghost small" data-hitreset="">No</button>'
      : '<button class="btn ghost small" data-hitreset="' + k + '" data-ask="1">\u21BA Restart</button>') + "</td>").join("") + "<td></td></tr>" +
    "</tbody></table></div></div>";
}

/* ---------- Daily Doors (teacher side) ---------- */
let doorHidden = 0;
function doorNames() {
  const o = [...new Set(waitingDoors(students, cls).map(r => r.s.name || "?"))].map(esc);
  return o.length ? ": " + (o.length > 4 ? o.slice(0, 4).join(", ") + " + " + (o.length - 4) + " more" : o.join(", ")) : "";
}
function viewDoors() {
  const S = SEASON, name = DOOR_NAMES[S.key] || "Daily Doors", on = doorsLive(cls), wait = waitingDoors(students, cls), today = azToday();
  const md = d => new Date(d + "T12:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  let h = '<div class="card" id="doorCard"><div class="card-head"><h2>\u{1F6AA} ' + esc(name) + '</h2><span class="fact">' + (on ? "<b>ON</b>" : "off") + (wait.length ? " \u00b7 <b>" + wait.length + "</b> to check" : "") + "</span></div>" +
    '<p class="lede" style="font-size:13.5px;">Every day students get the same doors (tasks). They tap <b>I did it!</b>, you approve it here, and a present shows up on their screen to open. ' +
    "The first " + DOOR_GATE + " doors have to be approved before the rest unlock (a door that starts with <b>!</b> is always open). All of a day\u2019s doors approved = a \u2728 Golden Present. Doors reset every day.</p>" +
    '<div class="row" style="margin:10px 0;"><button class="btn' + (on ? " ghost" : "") + '" data-act="doorsToggle">' + (on ? "Turn " + esc(name) + " off" : "\u{1F6AA} Turn " + esc(name) + " on") + "</button>" +
    (eventMode(cls) ? "" : '<span class="muted small">Only works while an event mode is on.</span>') + "</div>";
  if (wait.length) {
    h += '<h3 style="margin-top:8px;">To check</h3><div class="row" style="margin:6px 0;"><button class="btn small" data-act="doorApproveAll">\u2705 Approve all ' + wait.length + "</button></div>" +
      wait.map(r => '<div class="dcheck"><span class="who">' + esc(r.s.name) + '</span><span class="what"><b>Door ' + (r.i + 1) + ":</b> " + esc(r.task) + (r.date !== today ? ' <span class="muted small">(' + md(r.date) + ")</span>" : "") + "</span>" +
        '<button class="btn small" data-doorok="' + r.s.id + ":" + r.date + ":" + r.i + '">\u2705 Approve</button><button class="btn ghost small" data-doorno="' + r.s.id + ":" + r.date + ":" + r.i + '">\u21A9\uFE0F Not yet</button></div>').join("");
  } else if (on) h += '<p class="muted small">Nothing to check right now.</p>';
  // today's progress
  if (on) {
    const list = doorsFor(cls, today), team = students.filter(x => x.companionId);
    const done = st => list.filter((_, i) => ["ok", "open"].includes((((st.doors || {})[today] || {})[String(i)] || {}).st)).length;
    h += '<details style="margin-top:10px;"><summary><b>Today\u2019s progress</b></summary><div class="inv" style="margin-top:8px;">' +
      team.map(st => "<span>" + esc(st.name) + " " + done(st) + "/" + list.length + (done(st) === list.length ? " \u2728" : "") + "</span>").join("") + "</div></details>";
  }
  // editor
  const list = doorsFor(cls, null);
  const dd = busy.doorDay || today, dayList = (cls.doorDays || {})[dd];
  h += '<details style="margin-top:12px;"' + (busy.doorEdit ? " open" : "") + '><summary><b>\u270F\uFE0F Edit the doors</b></summary>' +
    '<div class="field" style="margin-top:10px;"><label for="doorList">Every day\u2019s doors (one per line, in order \u2014 start a line with ! to keep that door always open)</label><textarea id="doorList" rows="10">' + esc(list.join("\n")) + "</textarea></div>" +
    '<div class="row" style="margin-top:8px;"><button class="btn small" data-act="saveDoorList">Save doors</button><button class="btn ghost small" data-act="resetDoorList">Back to the starting doors</button></div>' +
    '<div style="margin-top:14px;border-top:1px solid var(--line-2);padding-top:12px;"><b>Different doors for one day</b>' +
    '<div class="row" style="margin-top:8px;align-items:flex-end;"><div class="field"><label for="doorDay">Day</label><input id="doorDay" type="date" value="' + esc(dd) + '"></div>' +
    '<span class="muted small">' + (dayList ? "\u2705 This day has its own doors." : "This day uses the every-day doors.") + "</span></div>" +
    '<div class="field" style="margin-top:8px;"><label for="doorDayList">Doors for ' + esc(md(dd)) + '</label><textarea id="doorDayList" rows="8">' + esc((dayList || list).join("\n")) + "</textarea></div>" +
    '<div class="row" style="margin-top:8px;"><button class="btn small" data-act="saveDoorDay">Save for ' + esc(md(dd)) + '</button>' + (dayList ? '<button class="btn ghost small" data-act="clearDoorDay">Use the every-day doors</button>' : "") + "</div>" +
    '<p class="muted small" style="margin-top:6px;">Changing a day\u2019s doors after students have started can move their check marks to a different task, so it\u2019s best to set days ahead.</p></div></details>';
  h += '<div class="row" style="margin-top:12px;gap:8px;align-items:flex-end;"><div class="field"><label for="fastRing">\u26A1 FastMath XP that closes the Fast Math Ring</label><input id="fastRing" type="number" min="1" style="width:90px;" value="' + (Number(cls.fastRing) || FAST_RING) + '"></div><button class="btn ghost small" data-act="saveFastRing">Save</button>' +
    '<span class="muted small">When you paste data with subject columns, doors are approved automatically (you can still approve by hand).</span></div>';
  // Goal subjects: "your Goal Subject" in a door shows each student's own subject
  const team = students.filter(x => x.companionId), unset = team.filter(x => !x.goalSubject).length;
  h += '<details class="goalsubs" style="margin-top:14px;"' + (busy.goalOpen ? " open" : "") + '><summary data-act="goalOpen"><b>\u{1F3AF} Goal subjects</b> <span class="muted small">' + (unset ? unset + " not set yet" : "all set") + "</span></summary>" +
    '<p class="muted small" style="margin:6px 0;">A door that says <b>your Goal Subject</b> shows each student\u2019s own subject (e.g. \u201cEarn 50 XP in Math\u201d).</p>' +
    '<div class="row" style="margin-bottom:8px;gap:6px;align-items:center;"><span class="small">Set everyone to:</span><select id="goalAll"><option value="">Choose\u2026</option>' + GOAL_SUBJECTS.map(g => "<option>" + esc(g) + "</option>").join("") + '</select><span class="muted small">(only students with no subject yet)</span></div>' +
    '<div class="goalgrid">' + team.map(x => '<label class="goalrow"><span>' + esc(x.name) + '</span><select data-goalsub="' + x.id + '"><option value="">\u2014</option>' +
      GOAL_SUBJECTS.map(g => '<option' + (x.goalSubject === g ? " selected" : "") + ">" + esc(g) + "</option>").join("") + "</select></label>").join("") + "</div></details>";
  return h + "</div>";
}
/* ---------- Weekly Door ---------- */
function viewWeekDoor() {
  const wk = weekKey(cls), goal = weekGoal(cls), kids = students.filter(x => x.companionId);
  const st = x => ((x.weekDoor || {})[wk]) || (weekTotal(x) >= goal ? "ready" : "");
  const opened = kids.filter(x => st(x) === "open"), ready = kids.filter(x => st(x) === "ready");
  const custom = goal !== WEEK_DOOR_XP;
  let h = '<div class="card" id="weekDoorCard"><div class="card-head"><h2>\u{1F6AA} Weekly Door</h2><span class="fact">' + opened.length + " opened \u00b7 " + ready.length + " ready</span></div>" +
    '<p class="lede" style="font-size:13.5px;">Students who reach <b>' + goal.toLocaleString() + " XP this week</b> (all their days added up) unlock a door with a Legendary egg and a Golden Present. It opens by itself as soon as their week adds up.</p>" +
    '<div class="row" style="gap:8px;align-items:flex-end;margin-top:8px;"><div class="field"><label for="weekGoalBox">XP goal for this week' + (custom ? " (normal is " + WEEK_DOOR_XP + ")" : "") + '</label><input id="weekGoalBox" type="number" min="1" step="10" style="width:110px;" value="' + goal + '"></div>' +
    '<button class="btn small" data-act="saveWeekGoal">Save for this week</button>' + (custom ? '<button class="btn ghost small" data-act="resetWeekGoal">Back to ' + WEEK_DOOR_XP + "</button>" : "") +
    '<button class="btn ghost small" data-act="weekCheck">\u{1F504} Unlock for everyone who made it</button></div>' +
    '<p class="muted small" style="margin-top:6px;">A short-week goal only lasts this week \u2014 starting a new week goes back to ' + WEEK_DOOR_XP + ".</p>";
  if (opened.length || ready.length) h += '<div class="inv" style="margin-top:8px;">' +
    opened.map(x => "<span>\u2705 " + esc(x.name) + "</span>").join("") + ready.map(x => "<span>\u{1F31F} " + esc(x.name) + " (ready)</span>").join("") +
    "</div>";
  return h + "</div>";
}
async function weekCheck(goalNow) {
  const wk = weekKey(cls), goal = goalNow || weekGoal(cls), batch = writeBatch(db); let n = 0;
  students.forEach(x => { if (x.companionId && weekTotal(x) >= goal && !(x.weekDoor || {})[wk]) { batch.update(studentRef(x.id), { weekDoor: Object.assign({}, x.weekDoor || {}, { [wk]: "ready" }) }); n++; } });
  if (n) await batch.commit();
  return n;
}
/* ---------- Team events (Potion Brewing Teams, Feast Table Teams) ---------- */
const TEV_BLURB = {
  potion: "Teams fill a cauldron every day. When you paste the day’s XP, every team with the whole recipe brews its potion",
  feast: "Teams cook one dish a day (cranberry sauce first, the turkey last), using that dish\u2019s real ingredients. When you paste the day\u2019s XP, every team with all of them adds the dish to its Thanksgiving table",
  ginger: "Teams build one step of a gingerbread house a day (10 steps, from an empty iced base to a finished house), using that step\u2019s ingredients. When you paste the day\u2019s XP, every team with all of them adds the step to its house",
  candybox: "Teams make one chocolate a day (10 chocolates, strawberry heart first, the golden bonbon last), using that chocolate\u2019s ingredients. When you paste the day\u2019s XP, every team with all of them puts the chocolate in its slot in the candy box",
  snowman: "Teams build one step of a snowman a day (10 steps, from a snow pile to a finished snowman), using that step\u2019s ingredients. When you paste the day\u2019s XP, every team with all of them adds the step to its snowman"
};
function viewTeamEvent(E) {
  const on = eventOn(E, cls), list = tevTeams(E, cls), today = azToday(), kids = students.filter(x => x.companionId), k = E.key;
  let h = '<div class="card" id="tev-' + k + '"><div class="card-head"><h2>' + E.icon + " " + E.title + '</h2><span class="fact">' + (on ? "<b>ON</b>" : "off") + " · " + list.length + " team" + (list.length === 1 ? "" : "s") + "</span></div>" +
    '<p class="lede" style="font-size:13.5px;">' + TEV_BLURB[k] + " (every " + PER_XP + " XP in a subject = 1 ingredient" + (E.steps ? ": Math, Reading and Language each give one of the " + E.stepWord + "\u2019s ingredients" : ": " + E.ing.map(g => g.subject + " " + g.icon).join(", ")) + "). " +
    "Each teammate gets +" + E.cur + " " + E.curName + ", +" + E.xp + " XP and an egg" + (E.fx ? " and a one-day glow" : "") + ". " + E.badgeN + " " + E.many + " = " + E.badge + " badge.</p>" +
    '<div class="row" style="margin:10px 0;"><button class="btn' + (on ? " ghost" : "") + '" data-act="tevToggle" data-ev="' + k + '">' + (on ? "Turn " + E.title + " off" : E.icon + " Turn " + E.title + " on") + "</button>" +
    (E.season(cls) ? "" : '<span class="muted small">Only works while ' + E.seasonName + " is on.</span>") +
    (on && list.length ? '<button class="btn ghost small" data-act="tevCheck" data-ev="' + k + '">\u{1F504} Check teams now</button>' : "") + "</div>";
  h += "<h3>Teams</h3>";
  list.forEach(t => {
    const c = teamDay(E, cls, t, students, today), changed = recipeChanged(E, cls, t, today), id = k + ":" + t.id;
    h += '<div class="pteamrow"><div class="row" style="gap:8px;align-items:center;justify-content:space-between;"><input data-ptname="' + id + '" value="' + esc(t.name) + '" style="font-weight:700;max-width:220px;" aria-label="Team name">' +
      '<span class="small">' + (t.members || []).length + " students · <b>" + brewCount(E, cls, t.id) + "</b> " + E.many + (c.brewed ? " · ✨ done today" : c.ready ? " · ready!" : "") + "</span>" +
      '<button class="btn ghost small" data-ptdel="' + id + '">Delete team</button></div>' +
      '<div class="row pneed" style="gap:10px;margin-top:8px;align-items:center;flex-wrap:wrap;"><span class="small"><b>Today:</b></span>' +
      (c.dish ? '<span class="small">' + esc(c.dish.name) + ":</span>" : "") + c.ing.map(g => '<label class="small" title="' + esc(g.name) + '">' + g.icon + " " + c.have[g.k] + ' / <input type="number" min="0" data-pneed="' + id + ":" + g.k + '" value="' + c.need[g.k] + '"></label>').join("") +
      '<button class="btn small" data-ptrecipe="' + id + '">Save ' + E.recipe + "</button>" + (changed ? '<button class="btn ghost small" data-ptreset="' + id + '">Use the game’s ' + E.recipe + "</button>" : '<span class="muted small">(picked by the game)</span>') + "</div></div>";
  });
  h += '<div class="row" style="margin-top:8px;"><button class="btn small" data-act="tevAddTeam" data-ev="' + k + '">➕ Add a team</button></div>';
  if (list.length) {
    const none = kids.filter(x => !tevTeamOf(E, cls, x.id)).length;
    h += '<details style="margin-top:12px;"' + (busy["tevOpen" + k] ? " open" : "") + '><summary data-act="tevOpen" data-ev="' + k + '"><b>\u{1F465} Put students on teams</b> <span class="muted small">' + (none ? none + " not on a team" : "everyone is on a team") + "</span></summary>" +
      '<div class="ptgrid">' + kids.map(x => { const tm = tevTeamOf(E, cls, x.id); return '<label><span>' + esc(x.name) + '</span><select data-ptmember="' + k + ":" + x.id + '"><option value="">—</option>' +
        list.map(t => '<option value="' + t.id + '"' + (tm && tm.id === t.id ? " selected" : "") + ">" + esc(t.name) + "</option>").join("") + "</select></label>"; }).join("") + "</div></details>";
    const st = tevStandings(E, cls), top = topTeams(E, cls), given = cls[topField(E)];
    h += '<h3 style="margin-top:14px;">\u{1F3C6} Standings</h3><ol class="pstand">' + st.map(x => "<li>" + esc(x.t.name) + " — <b>" + x.n + "</b> " + (x.n === 1 ? E.one : E.many) + "</li>").join("") + "</ol>";
    if (given) h += '<p class="small">✅ Special Legendary eggs given to ' + esc((given.teams || []).map(id => (list.find(t => t.id === id) || { name: "a team" }).name).join(" & ")) + ".</p>";
    else if (!E.leg) h += '<p class="muted small">At the end of ' + E.seasonName + " the top team (ties all win) gets a special Legendary egg. The button shows up here once the creature is added.</p>";
    else h += '<div class="row" style="margin-top:6px;"><button class="btn small" data-act="tevAward" data-ev="' + k + '"' + (top.length ? "" : " disabled") + ">\u{1F3C6} Give the " + esc(E.legName) + " egg to " + (top.length ? esc(top.map(t => t.name).join(" & ")) : "the top team") + "</button></div>";
  }
  return h + "</div>";
}
async function saveTevTeams(E, list, msg) { try { await updateDoc(classRef, { [E.p + "Teams"]: list }); if (msg) flash(msg); } catch (e) { flash("Couldn’t save — " + (e.code || e.message)); } }
async function tevCheckNow(E) {
  const date = azToday(), pot = brewRewards(E, cls, students, date); if (!pot) return;
  if (!pot.updates.length && !pot.classData) { flash("No team has finished yet today."); return; }
  const batch = writeBatch(db); pot.updates.forEach(u => batch.update(studentRef(u.st.id), u.data)); if (pot.classData) batch.update(classRef, pot.classData);
  try { await batch.commit(); flash(E.icon + " " + E.done + " " + (pot.newTeams.map(t => t.name).join(", ") || "rewards caught up")); } catch (e) { flash("Couldn’t save — " + (e.code || e.message)); }
}
const tevOf = v => { const [k, ...rest] = String(v || "").split(":"); return { E: TEAM_EVENTS[k], rest }; };
async function setDoor(sid, date, i, st) {
  try { await updateDoc(studentRef(sid), { ["doors." + date + "." + i + ".st"]: st, ["doors." + date + "." + i + ".checked"]: new Date().toISOString() }); }
  catch (e) { flash("Couldn\u2019t save that \u2014 " + (e.code || e.message)); }
}
let prizeUndo = [];   // check-offs this session, newest last: the checkbox attribute + value to flip back
function viewPrizes() {
  const rows = prizeRows();
  rows.sort((a, b) => (a.e.ordered ? 1 : 0) - (b.e.ordered ? 1 : 0) || String(b.e.at).localeCompare(String(a.e.at)));
  const open = rows.filter(r => !r.e.ordered).length, done = rows.length - open;
  let h = '<div class="card" id="prizeCard"><div class="card-head"><h2>\u{1F381} Prize winners</h2><span class="fact">' + (open ? "<b>" + open + "</b> to order or give" : "all done") + "</span></div>";
  if (!rows.length) return h + '<p class="lede">Nobody has won a prize yet. Prize! is a 5% slice on the ' + SEASON.wheel + ', and it opens the Prize Wheel.</p></div>';
  // Checked-off prizes drop out of the list. Undo puts back the last one; "Show done" lists them all (untick to put one back).
  if (prizeUndo.length || done) h += '<div class="row" style="margin-bottom:8px;gap:8px;">' +
    (prizeUndo.length ? '<button class="btn small" data-act="prizeUndo">\u21A9\uFE0F Undo last check-off</button>' : "") +
    (done ? '<button class="btn ghost small" data-act="prizeDone">' + (busy.prizeDone ? "Hide done" : "Show done (" + done + ")") + "</button>" : "") + "</div>";
  const shown = rows.filter(r => !r.e.ordered || busy.prizeDone);
  if (!shown.length) return h + '<p class="lede">All prizes are checked off. \u{1F389}</p></div>';
  h += '<div class="scroll-x"><table class="tbl"><thead><tr><th>Done</th><th>Student</th><th>Prize</th><th>Link</th><th>When</th></tr></thead><tbody>';
  shown.forEach(r => {
    const p = prizeInfo(r.e);
    const art = p.img ? '<img src="' + esc(p.img) + '" alt="" style="height:28px;vertical-align:middle;border-radius:6px;">' : p.icon;
    h += "<tr" + (r.e.ordered ? ' style="opacity:.55"' : "") + '><td><input type="checkbox" ' + (r.door ? 'data-doordone="' + r.s.id + ":" + r.door + '"' : 'data-ordered="' + r.s.id + ":" + r.idx + '"') + '' + (r.e.ordered ? " checked" : "") +
      ' aria-label="Ordered" style="width:20px;height:20px;"></td><td><b>' + esc(r.s.name) + "</b></td><td>" + art + " " + esc(r.e.prizeName || p.name) + "</td><td>" +
      (p.link ? '<a href="' + esc(p.link) + '" target="_blank" rel="noopener">Open link</a>' : p.xp ? (r.e.xp || r.e.doorXP ? '<span class="muted">\u2705 added to their XP</span>' : '<span class="muted">give ' + p.xp + " XP</span>") : '<span class="muted">\u2014</span>') + '</td><td class="eff">' +
      esc(new Date(r.e.at).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })) + "</td></tr>";
  });
  return h + "</tbody></table></div></div>";
}
// Limited events: Duckarune (start date, on/off) and Hexaduck (runs with Haunt-O-Ween Mode).
function duckAdmin() {
  const w = duckWindow(cls), live = duckOpen(cls), nice = d => new Date(d + "T12:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  return '<div class="card"><div class="card-head"><h2>\u{1F31F} Limited event Legendaries</h2></div>' +
    '<div class="duckadmin"><div class="row" style="align-items:flex-end;gap:10px;"><div><b>\u{1F986} Duckarune event</b> <span class="fact">' + (cls.duckOff ? "turned off" : live ? "LIVE" : azToday() < w.start ? "starts soon" : "ended") + "</span>" +
    '<div class="muted small">' + nice(w.start) + " \u2013 " + nice(w.end) + " (10 school days). 5-day 120 XP streak unlocks it: 95% per egg until caught, then 1% (even after the event ends).</div></div>" +
    '<div class="field"><label for="duckStart">Event starts</label><input id="duckStart" type="date" value="' + esc(w.start) + '"></div>' +
    '<button class="btn ghost small" data-act="saveDuck">Save</button>' +
    '<button class="btn ghost small" data-act="toggleDuck">' + (cls.duckOff ? "Turn event on" : "Turn event off") + "</button></div>" +
    '<p class="small" style="margin-top:8px;"><b>\u{1F383} Hexaduck</b> <span class="fact">' + (isHaunt(cls) ? "LIVE" : "off") + "</span> runs whenever Haunt-O-Ween Mode is on. " +
    "Defeating the Ghost-olotl unlocks it for the whole class: 95% per egg until caught, then 1% (even after Haunt-O-Ween ends). Turn it on with Haunt-O-Ween Mode above.</p>" +
    [["thanks", "\u{1F983}", "Thanksolotl", "Nov 1", "Gobble-Palooza", "Turducken"], ["jingle", "\u{1F384}", "Jinglotl", "Dec 1", "Jingle Jam", "Grinch-a-Duck"]].map(([key, ic, nm, starts, ev, boss]) => {
      const th = EVENTS.find(e => e.key === key); if (!th) return ""; const live = eventOpen(th, cls), md = d => new Date(d + "T12:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
      return '<p class="small" style="margin-top:8px;"><b>' + ic + " " + nm + '</b> <span class="fact">' + (live ? "LIVE" : azToday() > th.to ? "ended" : "starts " + starts) + "</span> runs by itself " +
        md(th.from) + " \u2013 " + md(th.to) + " (" + ev + "). Defeating the " + boss + " unlocks it for the whole class: 95% per egg until caught, then 1% after. " +
        '<button class="btn ghost small" data-evtoggle="' + key + '">' + (cls[key + "Off"] ? "Turn event back on" : "Turn event off") + "</button></p>"; }).join("") + "</div></div>";
}
function viewCollector() {
  const open = arenaOpen(cls), ov = cls.arenaOverride || "auto";
  const tOpen = tradeOpen(cls), tov = cls.tradeOff ? "closed" : cls.tradeOverride || "auto";
  const opt = (v, t) => '<option value="' + v + '"' + (ov === v ? " selected" : "") + ">" + t + "</option>";
  const topt = (v, t) => '<option value="' + v + '"' + (tov === v ? " selected" : "") + ">" + t + "</option>";
  let h = '<div class="card"><div class="card-head"><h2>\u{1F95A} Creature Collector</h2><button class="btn small ' + (open ? "" : "ghost") + '" data-act="arenaToggle" title="Click to ' + (open ? "close" : "open") + ' the arena">\u2694\uFE0F Arena ' + (open ? "OPEN \u00b7 click to close" : "closed \u00b7 click to open") + "</button>" +
    '<button class="btn small ' + (tOpen ? "" : "ghost") + '" data-act="tradeToggle" title="Click to ' + (tOpen ? "close" : "open") + ' trading">\u{1F504} Trading ' + (tOpen ? "OPEN \u00b7 click to close" : "closed \u00b7 click to open") + "</button></div>" +
    '<div class="row" style="margin-bottom:12px;"><div class="field"><label for="collStart">Counting XP since</label><input id="collStart" type="date" value="' + esc(cls.collectorStart || "") + '"></div>' +
    '<button class="btn ghost" data-act="saveCollStart">Save</button>' +
    '<div class="field"><label for="roomStart">\u{1F6CF}\uFE0F Comfort Points since</label><input id="roomStart" type="date" value="' + esc(cls.roomStart || "") + '"></div><button class="btn ghost" data-act="saveRoomStart">Save</button>' +
    '<div class="field"><label for="arenaOv">Battle arena</label><select id="arenaOv">' + opt("auto", "On schedule") + opt("open", "Open now (all day)") + opt("closed", "Closed") + "</select></div>" +
    '<label class="modebox" style="margin:0;padding:8px 12px;"><input type="checkbox" id="lunchArenaBox"' + (cls.lunchArena === false ? "" : " checked") + '><span><b>\u2600\uFE0F Lunch arena</b><small>Weekdays 12\u20131 pm for students who already hit 120 XP today</small></span></label>' +
    '<label class="modebox" style="margin:0;padding:8px 12px;"><input type="checkbox" id="goalArenaBox"' + (cls.goalArena ? " checked" : "") + '><span><b>\u2B50 120 XP battlers</b><small>Any weekday, any time: students who hit 120 XP today can battle each other</small></span></label>' +
    '<label class="modebox" style="margin:0;padding:8px 12px;"><input type="checkbox" id="lunchBonusBox"' + (cls.lunchBonus === false ? "" : " checked") + '><span><b>\u2600\uFE0F Lunch Hero bonus egg</b><small>+1 egg every day a student is Lunch Hero (lunch data at 120+ XP, or marked by hand with the \u2600\uFE0F button)</small></span></label></div>' +
    '<div class="row" style="margin-bottom:12px;"><div class="field"><label for="tradeOv">\u{1F504} Trading</label><select id="tradeOv">' + topt("auto", "On schedule") + topt("open", "Open now (all day)") + topt("closed", "Closed") + "</select></div>" +
    '<label class="modebox" style="margin:0;padding:8px 12px;"><input type="checkbox" id="lunchTradeBox"' + (cls.lunchTrade === false ? "" : " checked") + '><span><b>\u2600\uFE0F Lunch trading</b><small>Weekdays 12\u20131 pm for students who already hit 120 XP today</small></span></label>' +
    '<label class="modebox" style="margin:0;padding:8px 12px;"><input type="checkbox" id="goalTradeBox"' + (cls.goalTrade ? " checked" : "") + '><span><b>\u2B50 120 XP traders</b><small>Any weekday, any time: students who hit 120 XP today can trade with each other</small></span></label></div>' +
    '<p class="lede" style="font-size:12.5px;margin-bottom:10px;">Trading uses the same hours as the arena. Students have to tick \u201cI\u2019m ready to trade\u201d before anyone can send them an offer. Offers can always be declined or cancelled, but only accepted while trading is open.</p>' +
    '<p class="lede" style="font-size:12.5px;margin-bottom:10px;">Each day since that date: 120+ XP = 1 egg, plus 1 more for every extra 120 that day (under 120 = no egg). All XP also stays in each student\u2019s bank for levels. Arena schedule: ' + esc(ARENA_HOURS) + ".</p>";
  const rows = students.filter(x => x.companionId);
  if (!rows.length) return h + '<p class="lede">No students yet.</p></div>';
  h += '<div class="row" style="margin-bottom:10px;align-items:center;"><button class="btn" data-act="eggAll">' + (busy.eggAll ? "Yes \u2014 give all " + rows.length + " students a free egg" : "\u{1F95A} Free egg for everyone") + "</button>" +
    (busy.eggAll ? '<button class="btn ghost small" data-act="eggAllCancel">Cancel</button>' : '<span class="muted small">Free eggs use the normal odds (Common 70% \u00b7 Uncommon 20% \u00b7 Rare 8% \u00b7 Super Rare 2%).</span>') + "</div>";
  h += '<div class="scroll-x"><table class="tbl"><thead><tr><th>Student</th><th>Creatures</th><th>Lorebook</th><th>Eggs ready</th><th>XP bank</th><th>Legendary</th><th></th></tr></thead><tbody>';
  rows.forEach(x => {
    const fams = ownedFams(x), top = fams.map(f => formOf(f, (x.coll[f] || {}).lvl || 1)).sort((a, b) => ((x.coll[b.fam] || {}).lvl || 1) - ((x.coll[a.fam] || {}).lvl || 1))[0];
    h += "<tr><td><b>" + esc(x.name) + "</b></td><td>" + fams.length + (top ? ' <span class="muted">best: ' + esc(top.name) + " Lv " + ((x.coll[top.fam] || {}).lvl || 1) + "</span>" : fams.length ? "" : ' <span class="muted">no starter yet</span>') +
      (Object.values(x.coll || {}).some(e => e.sparkle) ? ' <span title="Sparkle creatures">\u2728\u00d7' + Object.values(x.coll || {}).filter(e => e.sparkle).length + "</span>" : "") +
      "</td><td>" + seenSet(x).size + " / " + CREATURES.length + "</td><td>" + pullsLeft(x, cls) + "</td><td>" + bankXP(x, cls).toLocaleString() + "</td><td>" + legendaryLeft(x) + " waiting" + (birthdayLeft(x) ? ' <span title="Birthday egg waiting">\u{1F382}</span>' : "") + '</td><td><div class="row" style="gap:6px;flex-wrap:nowrap;">' +
      '<button class="btn small" data-legend="' + x.id + '" style="background:#E9A91C;color:#3a2500;">\u{1F31F} Send legendary egg</button>' +
      '<button class="btn small" data-bonuspull="' + x.id + '">\u{1F95A} Send free egg</button>' +
      '<button class="btn small bday" data-bday="' + x.id + '" title="Sends a birthday egg that always hatches Wisholotl">\u{1F382} Birthday egg</button>' +
      '<button class="btn small ghost" data-pickle="' + x.id + '" title="For students who came to the real-life event: an egg that always hatches Cluckledill">\u{1F952} Cluckledill egg' + ((Number(x.pickleEggs) || 0) ? " (" + x.pickleEggs + " given)" : "") + "</button>" +
      (pickleLeft(x) ? '<button class="btn ghost small" data-unpickle="' + x.id + '" title="Take back a Cluckledill egg that hasn\u2019t been hatched">\u21A9</button>' : "") +
      ((Number(x.bonusPulls) || 0) > 0 && pullsLeft(x, cls) > 0 ? '<button class="btn ghost small" data-unbonus="' + x.id + '" title="Take back a free egg that hasn\u2019t been hatched">\u21A9 Take one back</button>' : "") + "</div></td></tr>";
  });
  return h + "</tbody></table></div></div>";
}

function viewRewards() {
  // Only today's finalized day shows, and it disappears once everyone is rewarded. Older days are hidden.
  const today = azToday(), log = cls.rewardLog || [];
  const i = log.findIndex(r => r.date === today && r.students.length && !r.students.every(x => (r.rewarded || []).includes(x.id)));
  if (i < 0) return "";
  const r = log[i], done = r.rewarded || [], left = r.students.filter(x => !done.includes(x.id)).length;
  let h = '<div class="card"><div class="card-head"><h2>\u2B50 Full health today</h2><span class="fact">' + left + " to reward</span></div>" +
    '<p class="lede" style="font-size:13px;margin-bottom:10px;">These companions were still at full health when you finalized today \u2014 give a small reward if you like. Tap <b>Reward all</b> (or tick each name) and this goes away.</p>' +
    '<div class="row" style="margin-bottom:8px;gap:6px;"><button class="btn small" data-rewardall="' + i + '">\u2705 Reward all</button><button class="btn ghost small" data-copyreward="' + i + '">Copy names</button></div>';
  h += '<div class="inv">' + r.students.slice().sort((a, b) => byAlpha(sOf(a.id) || a, sOf(b.id) || b)).map(x => {
    const on = done.includes(x.id), st = sOf(x.id), c = st && companionOf(st);
    return '<label style="display:inline-flex;align-items:center;gap:6px;background:var(--panel-2);border:1px solid var(--line);border-radius:10px;padding:5px 10px;cursor:pointer;' + (on ? "opacity:.55;" : "") + '">' +
      '<input type="checkbox" data-rewarded="' + i + ":" + x.id + '"' + (on ? " checked" : "") + ' style="width:18px;height:18px;">' +
      (c ? c.glyph + " " : "") + "<b>" + esc(x.name) + "</b>" + (on ? ' <small class="muted">rewarded \u2713</small>' : "") + "</label>";
  }).join("") + "</div>";
  return h + "</div>";
}

function viewLosses() {
  const range = busy.lossRange || "week";
  const today = new Date(), iso = x => x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0");
  let from = "0000-00-00", to = "9999-99-99";
  if (range === "week") { from = dateOfDay(0); to = dateOfDay(4); }
  if (range === "30") from = iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 30));
  if (range === "custom") { from = busy.lossFrom || "0000-00-00"; to = busy.lossTo || "9999-99-99"; }
  const rows = students.map(s => ({ s, list: (s.deaths || []).filter(x => x.date >= from && x.date <= to) }))
    .filter(r => r.list.length).sort((a, b) => byAlpha(a.s, b.s));
  const total = rows.reduce((n, r) => n + r.list.length, 0);
  const opt = (v, t) => '<option value="' + v + '"' + (range === v ? " selected" : "") + ">" + t + "</option>";
  let h = '<div class="card"><div class="card-head"><h2>\u{1F480} Companion losses</h2><span class="fact"><b>' + total + "</b> in this period</span></div>" +
    '<div class="row" style="margin-bottom:10px;"><div class="field"><label for="lossRange">Period</label><select id="lossRange">' +
    opt("week", "This week") + opt("30", "Last 30 days") + opt("all", "All time") + opt("custom", "Custom dates") + "</select></div>" +
    (range === "custom" ? '<div class="field"><label for="lossFrom">From</label><input id="lossFrom" type="date" value="' + esc(busy.lossFrom || "") + '"></div>' +
      '<div class="field"><label for="lossTo">To</label><input id="lossTo" type="date" value="' + esc(busy.lossTo || "") + '"></div>' : "") + "</div>";
  if (!rows.length) return h + '<p class="lede">No companions disappeared in this period. \u{1F389}</p><p class="lede" style="font-size:12.5px;margin-top:6px;">Losses are recorded when you finalize a day.</p></div>';
  h += '<div class="scroll-x"><table class="tbl"><thead><tr><th>Student</th><th>Times lost</th><th>Dates</th></tr></thead><tbody>';
  rows.forEach(r => {
    h += "<tr><td><b>" + esc(r.s.name) + "</b></td><td>" + r.list.length + '</td><td class="eff">' +
      r.list.map(x => new Date(x.date + "T12:00:00").toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })).join(", ") + "</td></tr>";
  });
  return h + '</tbody></table></div><p class="lede" style="font-size:12.5px;margin-top:8px;">Recorded when you finalize a day. A Hero Cape brings a companion back but the loss still counts here.</p></div>';
}

function viewShop() {
  const rows = [];
  students.forEach(s => (s.purchases || []).forEach((p, idx) => rows.push({ s, p, idx })));
  rows.sort((a, b) => String(b.p.at).localeCompare(String(a.p.at)));
  const S = SEASON, anyItem = id => byId(S.store, id) || byId(SEASONS.haunt.store, id) || byId(SEASONS.gobble.store, id) || byId(SEASONS.jingle.store, id) || byId(SEASONS.frost.store, id) || byId(SEASONS.heart.store, id);
  let h = '<div class="card"><div class="card-head"><h2>' + S.coin + " " + S.shop + ' purchases</h2><span class="fact">' + rows.length + " total</span></div>" +
    '<p class="lede" style="font-size:13px;margin-bottom:10px;">In the shop now: ' + S.store.map(it => storeArt(it, "gimg") + " " + esc(it.name) + " (" + it.cost + ")").join(" \u00b7 ") + "</p>";
  if (!rows.length) return h + '<p class="lede">No purchases yet.</p></div>';
  h += '<div class="scroll-x"><table class="tbl"><thead><tr><th>When</th><th>Student</th><th>Item</th><th>Cost</th><th></th></tr></thead><tbody>';
  const SHOP_SHOW = 5, list = busy.shopAll ? rows.slice(0, 60) : rows.slice(0, SHOP_SHOW);
  list.forEach(r => {
    const it = anyItem(r.p.id);
    const when = r.p.at ? new Date(r.p.at).toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" }) : "";
    h += "<tr><td>" + esc(when) + "</td><td>" + esc(r.s.name) + "</td><td>" + (it ? storeArt(it, "gimg") + " " + esc(it.name) : esc(r.p.id)) + "</td><td>" + (r.p.cost || 0) +
      '</td><td><button class="btn ghost small" data-refund="' + r.s.id + ":" + r.idx + '">Refund</button></td></tr>';
  });
  h += "</tbody></table></div>";
  if (rows.length > SHOP_SHOW) h += '<div class="row" style="margin-top:8px;"><button class="btn ghost small" data-act="shopAll">' + (busy.shopAll ? "Show fewer" : "Show all " + rows.length + " purchases") + "</button></div>";
  return h + "</div>";
}

function viewAssign() {
  if (!busy.assign) return "";
  const s = sOf(busy.assign); if (!s) return "";
  return '<div class="card"><div class="card-head"><h2>Companion for ' + esc(s.name) + '</h2></div><div class="row">' +
    '<div class="field" style="flex:1;min-width:260px;"><label for="assignComp">Companion</label><select id="assignComp"><option value="">— none (student chooses) —</option>' +
    ROSTER.map(c => '<option value="' + c.id + '"' + (s.companionId === c.id ? " selected" : "") + ">" + c.glyph + "  " + esc(c.name) + "</option>").join("") + "</select></div>" +
    '<div class="field" style="flex:1;min-width:180px;"><label for="assignName">Companion name</label><input id="assignName" type="text" maxlength="22" value="' + esc(s.petName || "") + '"></div>' +
    '<button class="btn" data-act="doAssign">Save</button><button class="btn ghost" data-act="cancelAssign">Cancel</button></div>' +
    '<p class="lede" style="margin-top:10px;font-size:13px;">Choosing “none” lets the student pick a new companion from their page.</p></div>';
}

function viewLinks() {
  return '<div class="card"><div class="card-head"><h2>Student link</h2></div>' +
    '<p class="lede">Send this one link to the whole class. Students tap their name, choose a companion, name it and pick their gear.</p>' +
    '<div class="row" style="margin-top:12px;"><input type="text" readonly value="' + esc(studentLink()) + '" style="flex:1;min-width:260px;font-family:var(--mono);font-size:13px;">' +
    '<button class="btn" data-copylink="">Copy link</button></div>' +
    '<p class="lede" style="margin-top:10px;font-size:13px;">Each student also has a personal link (Copy link in Full standings) that skips the name list.</p></div>';
}

function ghostSettings() {
  const b = bossState(cls, students), S = SEASON, g = S.key === "gobble", j = S.key === "jingle";
  return '<div style="margin-top:16px;border-top:1px solid var(--line-2);padding-top:14px;"><h3>' + S.bossIcon + " " + S.boss + "</h3>" +
    '<p class="lede" style="font-size:13.5px;margin:4px 0 10px;">Each day a student hits ' + goalXP(cls) + ' XP earns one attack. Right now: <b>' + b.left.toLocaleString() + " / " + b.max.toLocaleString() +
    "</b> health, " + b.hits + " attack" + (b.hits === 1 ? "" : "s") + " landed.</p>" +
    '<div class="row"><div class="field" style="width:150px;"><label for="gBossHP">' + S.boss + ' health</label><input id="gBossHP" type="number" min="10" max="100000" step="10" value="' + b.max + '"></div>' +
    '<div class="field" style="width:150px;"><label for="gBossDmg">Base attack damage</label><input id="gBossDmg" type="number" min="1" max="10000" step="1" value="' + b.dmg + '"></div>' +
    '<button class="btn ghost" data-act="saveBoss">Save</button>' +
    '<button class="btn ghost" data-act="newBoss">' + (busy.confirmBoss ? "Yes \u2014 summon a new one" : "Summon a new " + S.boss) + "</button></div>" +
    '<p class="lede" style="font-size:12.5px;margin-top:8px;">A new ' + S.boss + " starts at full health. Past attacks don\u2019t count against it.</p>" +
    '<p class="lede" style="font-size:13px;margin-top:8px;">' + (S.key === "heart"
      ? (heartUnlocked(cls)
        ? "\u2705 <b>Unlocked for good:</b> the Cupid Crown (5-day streak), the Chocolate Strawberry snack (3-day streak) and the Heartbreaker-otl lunch sidekick."
        : "\u{1F512} Defeat the first Heartbreaker-otl to unlock the <b>Cupid Crown</b> (5-day streak), the <b>Chocolate Strawberry</b> snack (3-day streak) and the <b>Heartbreaker-otl</b> lunch sidekick. They stay unlocked after Sweetheart Showdown.")
      : S.key === "frost"
      ? (yetiUnlocked(cls)
        ? "\u2705 <b>Unlocked for good:</b> the Cozy Earmuffs (5-day streak), the Snow Cone snack (3-day streak) and the Snowlotl lunch sidekick."
        : "\u{1F512} Defeat the first Abominable Snowlotl to unlock the <b>Cozy Earmuffs</b> (5-day streak), the <b>Snow Cone</b> snack (3-day streak) and the <b>Snowlotl</b> lunch sidekick. They stay unlocked after Frostbite Festival.")
      : j
      ? (grinchUnlocked(cls)
        ? "\u2705 <b>Unlocked for good:</b> the Reindeer Antlers (5-day streak), the Hot Cocoa snack (3-day streak) and the Grinch-a-Duck lunch sidekick."
        : "\u{1F512} Defeat the first Grinch-a-Duck to unlock the <b>Reindeer Antlers</b> (5-day streak), the <b>Hot Cocoa</b> snack (3-day streak) and the <b>Grinch-a-Duck</b> lunch sidekick. They stay unlocked after Jingle Jam.")
      : g
      ? (turkeyUnlocked(cls)
        ? "\u2705 <b>Unlocked for good:</b> the Pilgrim Hat (5-day streak), the Pumpkin Pie snack (3-day streak) and the Turducken lunch sidekick."
        : "\u{1F512} Defeat the first Turducken to unlock the <b>Pilgrim Hat</b> (5-day streak), the <b>Pumpkin Pie</b> snack (3-day streak) and the <b>Turducken</b> lunch sidekick. They stay unlocked after Gobble-Palooza.")
      : (ghostUnlocked(cls)
        ? "\u2705 <b>Unlocked for good:</b> the Witch Hat (5-day streak), the Witch\u2019s Brew snack (3-day streak) and the Ghost-olotl lunch sidekick."
        : "\u{1F512} Defeat the first Ghost-olotl to unlock the <b>Witch Hat</b> (5-day streak), the <b>Witch\u2019s Brew</b> snack (3-day streak) and the <b>Ghost-olotl</b> lunch sidekick. They stay unlocked after Haunt-O-Ween.")) + "</p></div>";
}

function viewModes() {
  const on = isHaunt(cls), gob = isGobble(cls), jin = isJingle(cls), fro = isFrost(cls), hrt = isHeart(cls);
  const md = d => new Date(d + "T12:00:00").toLocaleDateString(undefined, { month: "long", day: "numeric" });
  return '<div class="card"><div class="card-head"><h2>\u2728 Special modes</h2><span class="fact">' + (on ? "<b>Haunt-O-Ween is on</b>" : gob ? "<b>Gobble-Palooza is on</b>" : jin ? "<b>Jingle Jam is on</b>" : fro ? "<b>Frostbite Festival is on</b>" : hrt ? "<b>Sweetheart Showdown is on</b>" : "none on") + "</span></div>" +
    '<label class="modebox"><input type="checkbox" id="hauntBox"' + (on ? " checked" : "") + (busy.hauntAsk ? " disabled" : "") + '><span><b>\u{1F383} Haunt-O-Ween Mode</b>' +
    '<small>Adds candy baskets, the Candy Shop, the Trick or Treat Wheel, Ms. Ariana\u2019s bucket and the \u2694\uFE0F Battle Area with the Ghost-olotl. All the normal rules keep working. ' +
    "Turn it off and all of that is hidden from you and your students.</small></span></label>" +
    (busy.hauntAsk ? '<div class="banner warn" style="margin-top:12px;">Students still have candy from last time. Keep adding to it, or start everyone at 0?' +
      '<div class="row" style="margin-top:8px;"><button class="btn small" data-act="hauntKeep">Keep their candy</button><button class="btn small danger" data-act="hauntFresh">Start fresh at 0</button>' +
      '<button class="btn ghost small" data-act="hauntCancel">Cancel</button></div></div>' : "") +
    (on ? ghostSettings() : "") +
    '<label class="modebox" style="margin-top:12px;"><input type="checkbox" id="gobbleBox"' + (gob ? " checked" : "") + '><span><b>\u{1F983} Gobble-Palooza</b>' +
    "<small>Corn cornucopias, the Gobble Shop, the Pie Wheel, Ms. Ariana\u2019s Cornucopia and the \u2694\uFE0F Battle Area with the Turducken. " +
    "It turns itself on the first time you open this console on or after " + new Date(GOBBLE_FROM + "T12:00:00").toLocaleDateString(undefined, { month: "long", day: "numeric" }) +
    " and off after " + new Date(GOBBLE_TO + "T12:00:00").toLocaleDateString(undefined, { month: "long", day: "numeric" }) + ". Turning it on turns Haunt-O-Ween off and starts everyone\u2019s corn at 0 " +
    "(spins, extra attacks and brews they already have carry over).</small></span></label>" +
    (gob ? ghostSettings() : "") +
    '<label class="modebox" style="margin-top:12px;"><input type="checkbox" id="jingleBox"' + (jin ? " checked" : "") + '><span><b>\u{1F384} Jingle Jam</b>' +
    "<small>Presents under a mini tree, the Jingle Shop, the Present Wheel, the Grinch\u2019s Sack and the \u2694\uFE0F Battle Area with the Grinch-a-Duck. " +
    "It turns itself on the first time you open this console on or after " + md(JINGLE_FROM) + " and off after " + md(JINGLE_TO) +
    ". Turning it on turns the other modes off and starts everyone\u2019s presents at 0 (spins, extra attacks and cocoas/pies/brews they already have carry over).</small></span></label>" +
    (jin ? ghostSettings() : "") +
    '<label class="modebox" style="margin-top:12px;"><input type="checkbox" id="frostBox"' + (fro ? " checked" : "") + '><span><b>\u2744\uFE0F Frostbite Festival</b>' +
    "<small>Snowflakes in a snow globe, the Snow Shop, the Blizzard Wheel, Frozen Doors and the \u2694\uFE0F Battle Area with the Abominable Snowlotl. " +
    "Each 120 XP day packs a snowball; every student who misses adds a snow block to the Snowlotl\u2019s wall. You turn it on and off yourself (it isn\u2019t automatic). " +
    "Turning it on turns the other modes off and starts everyone\u2019s snowflakes at 0.</small></span></label>" +
    (fro ? ghostSettings() : "") +
    '<label class="modebox" style="margin-top:12px;"><input type="checkbox" id="heartBox"' + (hrt ? " checked" : "") + '><span><b>\u{1F498} Sweetheart Showdown</b>' +
    "<small>Candy hearts in a candy jar, the Sweet Shop, the Sweetheart Spinner, Mailbox Doors, Ms. Ariana\u2019s Candy Jar and the \u2694\uFE0F Battle Area with the Heartbreaker-otl. " +
    "Every XP over 120 is a candy heart; every student who misses adds 50 hearts to your jar, which you can spend to heal the Heartbreaker-otl. You turn it on and off yourself (it isn\u2019t automatic). " +
    "Turning it on turns the other modes off and starts everyone\u2019s hearts at 0.</small></span></label>" +
    (hrt ? ghostSettings() : "") + "</div>";
}
function viewClassSettings() {
  return '<div class="card"><div class="card-head"><h2>Class settings</h2></div><div class="row">' +
    '<div class="field" style="flex:1;min-width:180px;"><label for="gClass">Class name</label><input id="gClass" type="text" maxlength="48" value="' + esc(cls.className || "") + '"></div>' +
    '<div class="field" style="flex:1;min-width:150px;"><label for="gWeek">Week label</label><input id="gWeek" type="text" maxlength="32" value="' + esc(cls.weekLabel || "") + '"></div>' +
    '<div class="field" style="width:130px;"><label for="gGoal">Daily XP goal</label><input id="gGoal" type="number" min="10" max="2000" step="10" value="' + goalXP(cls) + '"></div>' +
    '<div class="field" style="width:150px;"><label for="gLunch">Lunch cutoff (AZ)</label><input id="gLunch" type="time" value="' + esc(lunchCutoff()) + '"></div>' +
    '<button class="btn ghost" data-act="saveClass">Save</button></div>' +
    '<p class="muted small" style="margin-top:6px;">Lunch data for today can only be used before the lunch cutoff, so students who reach ' + goalXP(cls) + " after lunch don\u2019t become Lunch Heroes.</p>" +
    '<div class="row" style="margin-top:18px;border-top:1px solid var(--line-2);padding-top:16px;"><button class="btn danger" data-act="newWeek">' +
    (busy.confirmNewWeek ? "Yes — clear the whole week" : "Start a new week") + '</button><span class="lede" style="font-size:13px;">' +
    (busy.confirmNewWeek ? "Clears every day, lunch mark, gear and cape for all " + students.length + " students." + (eventMode(cls) ? " " + SEASON.Cur + " carries over." : "") : "Students keep their companions and names.") + "</span></div></div>" +
    rosterCard();
}

/* ================= class roster ================= */
function rosterCard() {
  const draft = busy.rosterDraft != null ? busy.rosterDraft : students.map(s => s.fullName).join("\n");
  const names = draft.split("\n").map(x => x.trim()).filter(Boolean);
  const shown = displayNames(names.map((n, i) => ({ id: i, name: n })));
  return '<div class="card"><div class="card-head"><h2>\u{1F465} Class roster</h2><span class="fact">' + students.length + " student" + (students.length === 1 ? "" : "s") + "</span></div>" +
    '<p class="lede" style="margin-bottom:10px;">Type each student\u2019s <b>full name</b>, one per line, spelled the way it appears in your spreadsheets. Uploads are matched to these names. ' +
    "Everywhere a name is shown, only the first name is used, and the last initial is added when two students share a first name.</p>" +
    '<div class="field"><label for="rosterBox">One student per line (First Last, or Last, First)</label><textarea id="rosterBox" rows="10">' + esc(draft) + "</textarea></div>" +
    '<div class="row" style="margin-top:9px;align-items:center;"><button class="btn" data-act="saveRoster">Save roster</button>' +
    '<label class="btn ghost" style="cursor:pointer;">\u{1F4C4} Add names from a spreadsheet<input id="rosterFile" type="file" accept=".csv,.xlsx,.xls" hidden></label>' +
    '<span class="lede" style="font-size:13px;">Removing a name deletes that student\u2019s companion and progress.</span></div>' +
    (names.length ? '<div class="rosterprev"><span class="muted small">Shown to students as:</span> ' + names.map((n, i) => '<span class="chip">' + esc(shown[i]) + "</span>").join("") + "</div>" : "") +
    "</div>";
}

/* ================= spreadsheet upload ================= */
const normKey = k => String(k || "").trim().toLowerCase().replace(/[\s_]+/g, " ");
const NAME_KEYS = ["name", "student", "student name", "full name", "learner"];
const XP_KEYS = ["completed", "xp", "total xp", "xp earned", "daily xp"];
const pickKey = (keys, wanted) => wanted.find(w => keys.includes(w)) || null;

function parseCSV(text) {
  const rows = []; let row = [], cur = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
    else if (ch === '"') q = true;
    else if (ch === ",") { row.push(cur); cur = ""; }
    else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; row.push(cur); rows.push(row); row = []; cur = ""; }
    else cur += ch;
  }
  if (cur !== "" || row.length) { row.push(cur); rows.push(row); }
  const clean = rows.filter(r => r.some(c => String(c).trim() !== ""));
  if (!clean.length) return [];
  const head = clean[0].map(normKey);
  return clean.slice(1).map(r => { const o = {}; head.forEach((k, i) => { o[k] = r[i] == null ? "" : r[i]; }); return o; });
}
async function readRows(file) {
  if (/\.csv$/i.test(file.name)) return parseCSV(await file.text());
  if (!window.XLSX) throw new Error("The spreadsheet reader didn’t load. Try saving the file as CSV.");
  const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
  for (const name of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: "" }).map(r => { const o = {}; Object.keys(r).forEach(k => { o[normKey(k)] = r[k]; }); return o; });
    if (rows.length) { const keys = Object.keys(rows[0]); if (pickKey(keys, NAME_KEYS) && pickKey(keys, XP_KEYS)) return rows; }
  }
  return [];
}
// Matches a spreadsheet name to the roster. Tries, in order: the exact full name; the same first and last name
// (middle names ignored, "Last, First" allowed); a roster "First L" initial; a first name that is unique on the roster.
const normName = x => firstLast(x).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 '\-]/g, "").replace(/\s+/g, " ").trim();
function matchStudent(fileName) {
  const f = normName(fileName), ft = f.split(" "), fFirst = ft[0], fLast = ft.length > 1 ? ft[ft.length - 1] : "";
  if (!f) return null;
  const R = students.map(s => { const n = normName(s.fullName || s.name), t = n.split(" "); return { s, n, first: t[0], last: t.length > 1 ? t[t.length - 1] : "" }; });
  const tiers = [
    r => r.n === f,
    r => fLast && r.last && r.first === fFirst && r.last === fLast,
    r => fLast && r.last.length === 1 && r.first === fFirst && fLast[0] === r.last,
    r => !r.last && r.first === fFirst && R.filter(x => x.first === fFirst).length === 1,
  ];
  for (const test of tiers) { const m = R.filter(test); if (m.length === 1) return m[0].s; if (m.length > 1) return null; }
  return null;
}

// Pull student names out of any spreadsheet (a name column, or first name + last name columns) into the roster box.
async function addRosterFromFile(file) {
  let rows = [];
  try {
    if (/\.csv$/i.test(file.name)) rows = parseCSV(await file.text());
    else {
      if (!window.XLSX) throw new Error("The spreadsheet reader didn\u2019t load. Try saving the file as CSV.");
      const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
      for (const nm of wb.SheetNames) {
        const r = XLSX.utils.sheet_to_json(wb.Sheets[nm], { defval: "" }).map(x => { const o = {}; Object.keys(x).forEach(k => { o[normKey(k)] = x[k]; }); return o; });
        if (r.length) { rows = r; break; }
      }
    }
  } catch (e) { flash("Couldn\u2019t read that file \u2014 " + e.message); return; }
  if (!rows.length) { flash("That file looks empty."); return; }
  const keys = Object.keys(rows[0]), nk = pickKey(keys, NAME_KEYS), fk = pickKey(keys, ["first name", "first", "firstname", "given name"]), lk = pickKey(keys, ["last name", "last", "lastname", "surname", "family name"]);
  if (!nk && !fk) { flash("Couldn\u2019t find a name column (or first name and last name columns) in that file."); return; }
  let list = rows.map(r => ({ name: (fk ? (String(r[fk] || "").trim() + " " + (lk ? String(r[lk] || "").trim() : "")).trim() : String(r[nk] || "").trim()), guide: keys.includes("guide") ? String(r.guide || "").trim() : "" })).filter(x => x.name);
  // mixed-class files: keep only the guide most of your current students belong to
  if (keys.includes("guide") && students.length) {
    const tally = {}; list.forEach(x => { if (matchStudent(x.name)) tally[x.guide] = (tally[x.guide] || 0) + 1; });
    const top = Object.keys(tally).sort((a, b) => tally[b] - tally[a])[0]; if (top != null) list = list.filter(x => x.guide === top);
  }
  const box = document.getElementById("rosterBox"), cur = (box ? box.value : students.map(s => s.fullName).join("\n")).split("\n").map(x => x.trim()).filter(Boolean);
  const have = new Set(cur.map(normName)); let added = 0;
  list.forEach(x => { const k = normName(x.name); if (!have.has(k)) { have.add(k); cur.push(x.name); added++; } });
  busy.rosterDraft = cur.join("\n"); render();
  flash(added ? "Added " + added + " name" + (added === 1 ? "" : "s") + " to the roster box. Check them, then click Save roster." : "Everyone in that file is already on your roster.", true);
}

/* ---------- copy & paste ----------
   Paste straight from the XP page. For each student, the name is the line just before a "291 / 120" number,
   and only the number before the slash is used. Header text stuck to the first name ("Social StudiesJenesis") is removed. */
const PASTE_HEADERS = ["Social Studies", "Science", "Vocabulary", "Language", "Writing", "Reading", "FastMath", "Math", "Total", "Student"];
const SUB_ORDER = ["m", "f", "r", "w", "l", "v", "sc", "ss"];
const SUB_HEAD = { "math": "m", "fastmath": "f", "fast math": "f", "reading": "r", "writing": "w", "language": "l", "vocabulary": "v", "science": "sc", "social studies": "ss" };
export function parsePasted(text) {
  const lines = String(text || "").replace(/\r/g, "").split(/[\n\t]/).map(x => x.replace(/\u00a0/g, " ").replace(/[\u2195\u21C5\u2191\u2193\u25B2\u25BC\u2303\u2304]/g, "").trim());
  const out = [];
  const totals = []; lines.forEach((ln, i) => { if (/^(\d[\d,]*)\s*\/\s*\d/.test(ln)) totals.push(i); });
  // column order from the header row (Math, FastMath, Reading, ...), if it was copied too
  const head = []; for (let i = 0; i < (totals[0] || 0); i++) { const k = SUB_HEAD[lines[i].toLowerCase()]; if (k && !head.includes(k)) head.push(k); }
  const order = head.length >= 3 ? head : SUB_ORDER;
  lines.forEach((ln, i) => {
    const m = ln.match(/^(\d[\d,]*)\s*\/\s*\d/);          // "291 / 120101" -> 291
    if (!m) return;
    // subject numbers: the cells after the total, up to the next student's total ("—" = blank; notes like "6d ago" are skipped)
    const end = totals[totals.indexOf(i) + 1] ?? lines.length, vals = [];
    for (let k = i + 1; k < end && vals.length < order.length; k++) { const c = lines[k]; if (/^\d[\d,]*$/.test(c)) vals.push(Number(c.replace(/,/g, ""))); else if (/^[\u2014\u2013-]$/.test(c)) vals.push(0); }
    const sub = vals.length >= 3 ? Object.fromEntries(order.map((k, n) => [k, vals[n] || 0])) : null;
    let j = i - 1; while (j >= 0 && !/[A-Za-z]/.test(lines[j])) j--;   // the nearest line above with letters
    if (j < 0) return;
    let name = lines[j];
    PASTE_HEADERS.forEach(hd => { const k = name.lastIndexOf(hd); if (k >= 0 && /^[A-Z]/.test(name.slice(k + hd.length))) name = name.slice(k + hd.length); });
    name = name.replace(/\s+/g, " ").trim();
    if (name && !/^\d/.test(name)) out.push(Object.assign({ name, completed: Number(m[1].replace(/,/g, "")) }, sub ? { sub } : {}));
  });
  return out;
}
function pasteBox() {
  if (!busy.paste) return "";
  const rows = parsePasted(busy.pasteText || ""), matched = rows.filter(r => matchStudent(r.name));
  return '<div class="pastebox"><div class="row" style="justify-content:space-between;align-items:center;"><b>\u{1F4CB} Paste ' + DAYS[day] + '\u2019s XP</b><button class="btn ghost small" data-act="pasteClose">Close</button></div>' +
    '<p class="muted small" style="margin:4px 0 8px;">Select the whole table on the XP page, copy it, and paste it here. Only the first number before the slash (like <b>291</b> in \u201c291 / 120\u201d) is used for each student.</p>' +
    '<textarea id="pasteBox" rows="8" placeholder="Paste here\u2026">' + esc(busy.pasteText || "") + "</textarea>" +
    (rows.length ? '<div class="pasteprev"><span class="muted small">Found ' + rows.length + " student" + (rows.length === 1 ? "" : "s") + " \u00b7 " + matched.length + " on your roster:</span> " +
      rows.map(r => '<span class="chip' + (matchStudent(r.name) ? "" : " off") + '">' + esc(r.name) + " <b>" + r.completed + "</b></span>").join("") + "</div>"
      : busy.pasteText ? '<p class="small" style="color:var(--bad);margin-top:6px;">Couldn\u2019t find any \u201cnumber / 120\u201d totals in that text.</p>' : "") +
    '<div class="row" style="margin-top:10px;"><button class="btn" style="background:var(--warn);color:#fff;" data-act="pasteLunch"' + (rows.length ? "" : " disabled") + ">\u2600\uFE0F Use as lunch data</button>" +
    '<button class="btn" data-act="pasteDay"' + (rows.length ? "" : " disabled") + ">Use as end-of-day data</button></div></div>";
}

// Lunch cutoff: lunch data for TODAY is only accepted before this time (Arizona). Default 12:30.
function lunchCutoff() { return (cls && cls.lunchCutoff) || "12:30"; }
function pastLunchCutoff(d) {
  if (dateOfDay(d) !== azToday()) return false;          // an earlier day's lunch file is fine (catching up)
  const t = azNow(), [h, m] = lunchCutoff().split(":").map(Number);
  return t.h * 60 + t.m >= h * 60 + (m || 0);
}
const fmtCut = () => { const [h, m] = lunchCutoff().split(":").map(Number); return ((h % 12) || 12) + ":" + String(m || 0).padStart(2, "0") + (h >= 12 ? " pm" : " am"); };
// Everything uploaded or pasted goes through here: late lunch data is stopped so it can't create Lunch Heroes.
async function sendUpload(up) {
  if (up.kind === "lunch" && pastLunchCutoff(up.day)) { busy.lunchLate = up; render(); scrollTo({ top: 0 }); return; }
  busy.lunchLate = null;
  await applyUpload(up);
}
function lunchLateBox() {
  const up = busy.lunchLate; if (!up) return "";
  return '<div class="banner warn" style="margin-bottom:12px;"><b>\u23F0 It\u2019s after the lunch cutoff (' + esc(fmtCut()) + ").</b> Today\u2019s lunch data has to come from before lunch, or students who hit " + goalXP(cls) +
    " later in the day would become Lunch Heroes. This data wasn\u2019t saved." +
    '<div class="row" style="margin-top:8px;"><button class="btn small" data-act="lateAsDay">Use it as end-of-day data instead</button>' +
    '<button class="btn ghost small" data-act="lateCancel">Cancel</button></div></div>';
}

async function applyUpload(up) {
  const goal = goalXP(cls), d = up.day;
  const best = {}, subs = {}; let unmatched = [];
  const subOf = r => { if (r.sub) return r.sub; const o = {}; let any = false;   // spreadsheet columns named Math, Reading, ...
    Object.keys(r).forEach(k => { const c = SUB_HEAD[String(k).toLowerCase()]; if (c) { o[c] = Number(String(r[k]).replace(/[^0-9.]/g, "")) || 0; any = true; } }); return any ? o : null; };
  up.rows.forEach(r => {
    const nm = String(r[up.nameKey] || "").trim(); if (!nm) return;
    const xp = Number(String(r[up.xpKey]).replace(/[^0-9.\-]/g, "")) || 0;
    const st = matchStudent(nm);
    if (st) { if (!best[st.id] || xp > best[st.id]) { best[st.id] = xp; const sb = subOf(r); if (sb) subs[st.id] = sb; } }
    else unmatched.push({ name: nm, guide: up.guideKey ? String(r[up.guideKey] || "").trim() : "" });
  });
  if (up.guideKey && unmatched.length) {   // mixed-class files: only offer this class's guide
    const tally = {};
    up.rows.forEach(r => { const nm = String(r[up.nameKey] || "").trim(); if (nm && matchStudent(nm)) { const g = String(r[up.guideKey] || "").trim(); tally[g] = (tally[g] || 0) + 1; } });
    const topG = Object.keys(tally).sort((a, b) => tally[b] - tally[a])[0];
    if (topG) unmatched = unmatched.filter(u => u.guide === topG);
  }
  const seenN = {}; unmatched = unmatched.filter(u => { const k = u.name.toLowerCase(); if (seenN[k]) return false; seenN[k] = 1; return true; });

  const batch = writeBatch(db); let hit = 0, matched = 0, autoN = 0, weekN = 0; const missing = [];
  // A re-upload fully replaces the earlier file of the same kind (lunch or end-of-day) for that day:
  // anyone not in the new file has that day's number cleared. The other kind is left alone.
  const date = dateOfDay(d), key = up.kind === "lunch" ? "l" : "d";
  students.forEach(s => {
    const has = s.id in best, xp = has ? best[s.id] : null, ok = has && xp >= goal;
    if (has) { matched++; if (ok) hit++; } else missing.push(s.name);
    const status = arr5(s.status, ""), early = arr5(s.early, false);
    const hist = Object.assign({}, s.xpHist || {}), day = Object.assign({}, hist[date] || {});
    if (has) day[key] = xp; else delete day[key];
    if (subs[s.id]) { const old = day.sub || {}, nw = {}; Object.keys(Object.assign({}, old, subs[s.id])).forEach(k => { nw[k] = Math.max(Number(old[k]) || 0, Number(subs[s.id][k]) || 0); }); day.sub = nw; }
    if (up.kind === "lunch") delete day.lh;   // a lunch upload replaces any hand-marked Lunch Hero for that day
    if (Object.keys(day).length) hist[date] = day; else delete hist[date];
    let data;
    if (up.kind === "lunch") {
      const lunchXp = arr5(s.lunchXp, null); lunchXp[d] = xp; early[d] = ok;
      if (status[d] !== "e" && arr5(s.xp, null)[d] == null) status[d] = ok ? "c" : "";
      data = { lunchXp, early, status, xpHist: hist };
    } else {
      const xps = arr5(s.xp, null); xps[d] = xp;
      if (status[d] !== "e") status[d] = has ? (ok ? "c" : "") : (early[d] ? "c" : "");
      data = { xp: xps, status, xpHist: hist };
    }
    // Daily Doors: approve every door the subject numbers show as done
    if (subs[s.id] && doorsLive(cls)) { const a = autoDoors(s, cls, date, day.sub, Math.max(Number(day.d) || 0, Number(day.l) || 0)); if (a) { data.doors = a.doors; autoN += a.n; } }
    Object.assign(s, data);
    // Weekly Door: unlock it once the week's XP reaches the goal
    const wk = weekKey(cls);
    if (s.companionId && weekTotal(s) >= weekGoal(cls) && !(s.weekDoor || {})[wk]) { s.weekDoor = Object.assign({}, s.weekDoor || {}, { [wk]: "ready" }); data.weekDoor = s.weekDoor; weekN++; }
    batch.update(studentRef(s.id), data);
  });
  if (up.kind === "day") { const rec = recordedDays(cls); if (!rec[d]) { rec[d] = true; batch.update(classRef, { recorded: rec }); } }
  // Team events (Potions, Feast Table): every team that now has the whole recipe/menu is done for the day
  const pots = Object.keys(subs).length ? EVENT_LIST.map(E => ({ E, r: brewRewards(E, cls, students, date) })).filter(x => x.r) : [];
  pots.forEach(({ r }) => { r.updates.forEach(u => batch.update(studentRef(u.st.id), u.data)); if (r.classData) batch.update(classRef, r.classData); });
  try { await batch.commit(); } catch (e) { flash("Upload didn’t save — " + (e.code || e.message)); }
  busy.upReport = { kind: up.kind, day: d, file: up.file, matched, hit, missing, unmatched, autoN };
  const weekMsg = weekN ? " \u{1F6AA} " + weekN + " student" + (weekN === 1 ? "" : "s") + " unlocked the Weekly Door!" : "";
  const potMsg = pots.filter(x => x.r.newTeams.length).map(x => " " + x.E.icon + " " + x.E.done + " " + x.r.newTeams.map(t => t.name).join(", ")).join("") + weekMsg;
  if (autoN || potMsg) flash((autoN ? "\u{1F6AA} Auto-approved " + autoN + " door" + (autoN === 1 ? "" : "s") + " from the subject XP." : "") + potMsg);
  render();
}

document.addEventListener("input", ev => {
  if (ev.target.id === "rosterBox") busy.rosterDraft = ev.target.value;
  if (ev.target.id === "pasteBox") { busy.pasteText = ev.target.value; clearTimeout(busy.pasteT); busy.pasteT = setTimeout(render, 250); }
});
document.addEventListener("change", async ev => {
  if (ev.target.dataset && ev.target.dataset.qstart) { await questTeacherChange(ev.target, { patch }); return; }
  if (ev.target.dataset && ev.target.dataset.ptmember) {
    const { E, rest } = tevOf(ev.target.dataset.ptmember); if (!E) return; busy["tevOpen" + E.key] = true;
    const sid = rest[0], to = ev.target.value;
    await saveTevTeams(E, tevTeams(E, cls).map(t => Object.assign({}, t, { members: (t.members || []).filter(id => id !== sid).concat(t.id === to ? [sid] : []) }))); return;
  }
  if (ev.target.dataset && ev.target.dataset.ptname) {
    const { E, rest } = tevOf(ev.target.dataset.ptname), nm = ev.target.value.trim().slice(0, 40); if (!E || !nm) return;
    await saveTevTeams(E, tevTeams(E, cls).map(t => t.id === rest[0] ? Object.assign({}, t, { name: nm }) : t), "Saved \u2014 team name."); return;
  }
  if (ev.target.dataset && ev.target.dataset.goalsub) { busy.goalOpen = true; await patch(ev.target.dataset.goalsub, { goalSubject: ev.target.value || null }); return; }
  if (ev.target.id === "goalAll" && ev.target.value) {
    const g = ev.target.value, todo = students.filter(x => x.companionId && !x.goalSubject); busy.goalOpen = true;
    if (!todo.length) { flash("Everyone already has a goal subject."); render(); return; }
    const batch = writeBatch(db); todo.forEach(x => batch.update(studentRef(x.id), { goalSubject: g }));
    try { await batch.commit(); flash("Set " + todo.length + " student" + (todo.length === 1 ? "" : "s") + " to " + g + "."); } catch (e) { flash("Couldn\u2019t save \u2014 " + e.code); }
    return;
  }
  if (ev.target.id === "doorDay") { busy.doorDay = ev.target.value || null; busy.doorEdit = true; render(); return; }
  const id = ev.target.id;
  if (id === "hauntBox") { await toggleHaunt(); return; }
  if (id === "gobbleBox") { await toggleGobble(); return; }
  if (id === "jingleBox") { await toggleJingle(); return; }
  if (id === "frostBox") { await toggleFrost(); return; }
  if (id === "heartBox") { await toggleHeart(); return; }
  if (ev.target.dataset && ev.target.dataset.trready) { if (cls) onTradeReady(ev.target, tctx()); return; }
  if (ev.target.dataset && ev.target.dataset.trsel) { if (cls) onTradeChange(ev.target, tctx()); return; }
  if (id === "lunchBonusBox") { const on = ev.target.checked; try { await updateDoc(classRef, { lunchBonus: on }); flash("Saved \u2014 Lunch Hero bonus egg " + (on ? "on" : "off") + "."); } catch (e) { flash("Couldn\u2019t save \u2014 " + e.code); } return; }
  if (id === "tradeBox") { const on = ev.target.checked; try { await updateDoc(classRef, { tradeOff: !on }); flash("Saved \u2014 trading " + (on ? "on" : "off") + "."); } catch (e) { flash("Couldn\u2019t save \u2014 " + e.code); } return; }
  if (id === "goalArenaBox") { const on = ev.target.checked; try { await updateDoc(classRef, { goalArena: on }); flash("Saved \u2014 120 XP battlers " + (on ? "can battle any time on weekdays" : "follow the normal schedule") + "."); } catch (e) { flash("Couldn\u2019t save \u2014 " + e.code); } return; }
  if (id === "lunchArenaBox") { const on = ev.target.checked; try { await updateDoc(classRef, { lunchArena: on }); flash("Saved \u2014 lunch arena " + (on ? "on" : "off") + "."); } catch (e) { flash("Couldn\u2019t save \u2014 " + e.code); } return; }
  if (id === "tradeOv") { const v = ev.target.value; try { await updateDoc(classRef, { tradeOverride: v === "auto" ? null : v, tradeOff: false }); flash("Saved \u2014 trading " + (v === "auto" ? "on its schedule" : v) + "."); } catch (e) { flash("Couldn\u2019t save \u2014 " + e.code); } return; }
  if (id === "lunchTradeBox") { const on = ev.target.checked; try { await updateDoc(classRef, { lunchTrade: on }); flash("Saved \u2014 lunch trading " + (on ? "on" : "off") + "."); } catch (e) { flash("Couldn\u2019t save \u2014 " + e.code); } return; }
  if (id === "goalTradeBox") { const on = ev.target.checked; try { await updateDoc(classRef, { goalTrade: on }); flash("Saved \u2014 120 XP traders " + (on ? "can trade any time on weekdays" : "follow the normal schedule") + "."); } catch (e) { flash("Couldn\u2019t save \u2014 " + e.code); } return; }
  if (id === "arenaOv") { const v = ev.target.value; try { await updateDoc(classRef, { arenaOverride: v === "auto" ? null : v }); flash("Saved \u2014 arena " + (v === "auto" ? "on its schedule" : v) + "."); } catch (e) { flash("Couldn\u2019t save \u2014 " + e.code); } return; }
  if (id === "lossRange") { busy.lossRange = ev.target.value; render(); return; }
  if (id === "lossFrom") { busy.lossFrom = ev.target.value; render(); return; }
  if (id === "lossTo") { busy.lossTo = ev.target.value; render(); return; }
  if (id === "rosterFile" && ev.target.files[0]) { await addRosterFromFile(ev.target.files[0]); ev.target.value = ""; return; }
  if ((id !== "upDay" && id !== "upLunch") || !ev.target.files[0]) return;
  const file = ev.target.files[0];
  try {
    const rows = await readRows(file);
    if (!rows.length) { flash("Couldn’t find a sheet with a name column and a completed (XP) column."); return; }
    const keys = Object.keys(rows[0]);
    const up = { kind: id === "upLunch" ? "lunch" : "day", day, file: file.name, rows,
      nameKey: pickKey(keys, NAME_KEYS), xpKey: pickKey(keys, XP_KEYS), guideKey: keys.includes("guide") ? "guide" : null };
    busy.lastUpload = up;
    await sendUpload(up);
  } catch (e) { flash(e.message || "Couldn’t read that file."); }
  ev.target.value = "";
});

// Older battles/trades were saved without ids:[a,b]. Students' pages only load their own (by ids), so add them once.
const idsDone = new Set();
// Battles nobody touched for 15+ minutes are closed for good, so the "going on now" list students load stays small.
const staleDone = new Set();
async function closeStale(list) {
  for (const b of list.filter(x => staleBattle(x) && !staleDone.has(x.id)).slice(0, 50)) {
    staleDone.add(b.id);
    try { await changeBattle(b.id, d => (staleBattle(d) ? Object.assign(d, { status: "ended", endedBy: "time", moves: { A: null, B: null }, ["seen_" + d.a.id]: true, ["seen_" + d.b.id]: true }) : null)); } catch (e) { console.error(e); }
  }
}
async function addIds(list, ref) {
  const todo = list.filter(d => !Array.isArray(d.ids) && d.a && d.b && !idsDone.has(d.id));
  for (let i = 0; i < todo.length; i += 400) {
    const batch = writeBatch(db);
    todo.slice(i, i + 400).forEach(d => { idsDone.add(d.id); batch.update(ref(d.id), { ids: [d.a.id, d.b.id] }); });
    try { await batch.commit(); } catch (e) { console.error(e); }
  }
}

/* ================= clicks ================= */
document.addEventListener("click", async ev => {
  let el;
  if ((el = ev.target.closest("[data-tr]"))) { if (cls) await onTradeClick(el, tctx()).catch(e => showErr(e)); return; }
  if ((el = ev.target.closest("[data-cc]"))) { if (cls) await collectorClick(el, tctx()).catch(e => showErr(e)); return; }
  if ((el = ev.target.closest("[data-day]"))) { day = Number(el.dataset.day); render(); return; }
  if ((el = ev.target.closest("[data-setstreak]"))) {
    const s = sOf(el.dataset.setstreak); if (!s) return;
    const cur = carryRun(s, cls), v = prompt("How many 120 XP days in a row did " + s.name + " have going into this week?", String(cur));
    if (v == null) return;
    const n = Math.max(0, Math.min(200, Math.floor(Number(v)) || 0));
    await patch(s.id, { streakCarry: n, streakWeek: weekCut(cls) }); flash("Saved \u2014 " + s.name + "\u2019s streak going into this week is " + n + ".");
    return;
  }
  if ((el = ev.target.closest("[data-ring]"))) {
    const s = sOf(el.dataset.ring), st = arr5(s.status, "");
    st[day] = st[day] === "" ? "c" : st[day] === "c" ? "e" : "";
    // remember hand-marked hits / excused days in the XP history too, so streaks carry over to next week
    const date = dateOfDay(day), hist = Object.assign({}, s.xpHist || {}), hd = Object.assign({}, hist[date] || {});
    if (st[day] === "c") hd.h = true; else delete hd.h;
    if (st[day] === "e") hd.e = true; else delete hd.e;
    if (Object.keys(hd).length) hist[date] = hd; else delete hist[date];
    return patch(s.id, { status: st, xpHist: hist });
  }
  if ((el = ev.target.closest("[data-lunch]"))) {
    const s = sOf(el.dataset.lunch), early = arr5(s.early, false), st = arr5(s.status, "");
    early[day] = !early[day];
    if (early[day] && st[day] !== "e") st[day] = "c";
    // remember a hand-marked Lunch Hero in the XP history too, so it earns the Lunch Hero bonus egg
    const date = dateOfDay(day), hist = Object.assign({}, s.xpHist || {}), h = Object.assign({}, hist[date] || {});
    if (early[day]) h.lh = true; else delete h.lh;
    if (Object.keys(h).length) hist[date] = h; else delete hist[date];
    return patch(s.id, { early, status: st, xpHist: hist });
  }
  if ((el = ev.target.closest("[data-excuse]"))) {
    const s = sOf(el.dataset.excuse), st = arr5(s.status, "");
    st[day] = st[day] === "e" ? "" : "e";
    // remember it in the XP history too, so longer streaks (badges, event Legendaries, Comfort Points) skip it
    const date = dateOfDay(day), hist = Object.assign({}, s.xpHist || {}), hd = Object.assign({}, hist[date] || {});
    if (st[day] === "e") hd.e = true; else delete hd.e;
    if (Object.keys(hd).length) hist[date] = hd; else delete hist[date];
    return patch(s.id, { status: st, xpHist: hist });
  }
  if ((el = ev.target.closest("[data-equip]"))) {
    const [sid, gid] = el.dataset.equip.split(":"); const s = sOf(sid);
    const worn = wornItem(s, simulate(s, cls));
    return patch(sid, { equipped: worn && worn.id === gid ? "" : gid });
  }
  if ((el = ev.target.closest("[data-givecape]"))) {
    const s = sOf(el.dataset.givecape);
    if (!simulate(s, cls).capeReady) return;
    return patch(s.id, { items: (s.items || []).concat([{ id: "cape", at: new Date().toISOString() }]), capesTotal: (Number(s.capesTotal) || 0) + 1 });
  }
  if ((el = ev.target.closest("[data-unaward]"))) {
    const [sid, idx] = el.dataset.unaward.split(":"); const s = sOf(sid);
    const items = (s.items || []).slice(), gone = items.splice(Number(idx), 1)[0];
    const data = { items }; if (gone && gone.id === "cape") data.capesTotal = Math.max(0, (Number(s.capesTotal) || 0) - 1);
    return patch(sid, data);
  }
  if ((el = ev.target.closest("[data-legend]"))) {
    const x = sOf(el.dataset.legend); await patch(x.id, { legendaryPulls: (Number(x.legendaryPulls) || 0) + 1 });
    flash("Saved \u2014 " + x.name + " has a legendary egg to hatch!"); return;
  }
  if ((el = ev.target.closest("[data-bonuspull]"))) {
    const x = sOf(el.dataset.bonuspull); await patch(x.id, { bonusPulls: (Number(x.bonusPulls) || 0) + 1 });
    flash("Saved \u2014 sent " + x.name + " a free egg!"); return;
  }
  if ((el = ev.target.closest("[data-pickle]"))) {
    const x = sOf(el.dataset.pickle); if (!x) return;
    try { await updateDoc(studentRef(x.id), { pickleEggs: (Number(x.pickleEggs) || 0) + 1 }); flash("Saved \u2014 sent " + x.name + " a Cluckledill egg! \u{1F952}"); } catch (e) { flash("Couldn\u2019t send it \u2014 " + e.code); }
    return;
  }
  if ((el = ev.target.closest("[data-unpickle]"))) {
    const x = sOf(el.dataset.unpickle); if (!x || !pickleLeft(x)) return;
    try { await updateDoc(studentRef(x.id), { pickleEggs: Math.max(0, (Number(x.pickleEggs) || 0) - 1) }); flash("Saved \u2014 took back an unhatched Cluckledill egg from " + x.name + "."); } catch (e) { flash("Couldn\u2019t save \u2014 " + e.code); }
    return;
  }
  if ((el = ev.target.closest("[data-bday]"))) {
    const x = sOf(el.dataset.bday); if (!x) return;
    const batch = writeBatch(db);
    batch.update(studentRef(x.id), { birthdayEggs: (Number(x.birthdayEggs) || 0) + 1 });
    if (!cls.wishInPool) batch.update(classRef, { wishInPool: true });   // from now on Wisholotl can come from legendary eggs too
    try { await batch.commit(); flash("Saved \u2014 sent " + x.name + " a birthday egg! \u{1F382}"); } catch (e) { flash("Couldn\u2019t send it \u2014 " + e.code); }
    return;
  }
  if ((el = ev.target.closest("[data-unbonus]"))) {
    const x = sOf(el.dataset.unbonus); if (!((Number(x.bonusPulls) || 0) > 0 && pullsLeft(x, cls) > 0)) return;
    await patch(x.id, { bonusPulls: (Number(x.bonusPulls) || 0) - 1 });
    flash("Saved \u2014 took back one free egg from " + x.name + "."); return;
  }
  if ((el = ev.target.closest("[data-rewardall]"))) {
    const i = Number(el.dataset.rewardall), log = (cls.rewardLog || []).map(r => Object.assign({}, r, { rewarded: (r.rewarded || []).slice() }));
    if (!log[i]) return; log[i].rewarded = log[i].students.map(x => x.id);
    try { await updateDoc(classRef, { rewardLog: log }); flash("Everyone is rewarded for today."); } catch (e) { flash("Couldn\u2019t save \u2014 " + e.code); }
    return;
  }
  if ((el = ev.target.closest("[data-rewarded]"))) {
    const [i, sid] = el.dataset.rewarded.split(":");
    const log = (cls.rewardLog || []).map(r => Object.assign({}, r, { rewarded: (r.rewarded || []).slice() }));
    const r = log[Number(i)]; if (!r) return;
    r.rewarded = r.rewarded.includes(sid) ? r.rewarded.filter(x => x !== sid) : r.rewarded.concat([sid]);
    try { await updateDoc(classRef, { rewardLog: log }); } catch (e) { flash("Couldn\u2019t save \u2014 " + e.code); }
    return;
  }
  if ((el = ev.target.closest("[data-copyreward]"))) {
    const r = (cls.rewardLog || [])[Number(el.dataset.copyreward)]; if (!r) return;
    const txt = r.students.slice().sort((a, b) => byAlpha(sOf(a.id) || a, sOf(b.id) || b)).map(x => x.name).join("\n");
    try { await navigator.clipboard.writeText(txt); el.textContent = "Copied!"; setTimeout(render, 1400); } catch (e) { prompt("Copy these names:", txt); }
    return;
  }
  if ((el = ev.target.closest("[data-doorok]"))) { const [sid, d, i] = el.dataset.doorok.split(":"); await setDoor(sid, d, i, "ok"); return; }
  if ((el = ev.target.closest("[data-doorno]"))) { const [sid, d, i] = el.dataset.doorno.split(":"); await setDoor(sid, d, i, "no"); return; }
  if ((el = ev.target.closest("[data-evtoggle]"))) {
    const key = el.dataset.evtoggle, nm = key === "jingle" ? "Jinglotl" : "Thanksolotl", f = key + "Off";
    try { await updateDoc(classRef, { [f]: !cls[f] }); flash("Saved \u2014 " + nm + " is " + (cls[f] ? "on" : "off") + "."); } catch (e) { flash("Couldn\u2019t change that \u2014 " + e.code); }
    return;
  }
  if ((el = ev.target.closest("[data-hitreset]"))) {
    const k = el.dataset.hitreset;
    if (!k || el.dataset.ask) { busy.hitReset = k || null; render(); return; }
    busy.hitReset = null;
    const snap = {}; students.forEach(st => { snap[st.id] = rawHits(st)[k]; });
    try { await updateDoc(classRef, { ["hitBase." + k]: snap, ["hitReset." + k]: new Date().toISOString() }); flash("Saved \u2014 the " + ({ haunt: "Haunt-O-Ween", gobble: "Gobble-Palooza", jingle: "Jingle Jam", frost: "Frostbite Festival", heart: "Sweetheart Showdown" }[k]) + " hit count starts over from 0."); }
    catch (e) { flash("Couldn\u2019t save \u2014 " + e.code); }
    return;
  }
  if ((el = ev.target.closest("[data-ptdel]"))) {
    const { E, rest } = tevOf(el.dataset.ptdel), t = E && tevTeams(E, cls).find(x => x.id === rest[0]); if (!t) return;
    if (!confirm("Delete " + t.name + "? Its students go back to no team (what they already finished stays).")) return;
    await saveTevTeams(E, tevTeams(E, cls).filter(x => x.id !== t.id), "Deleted " + t.name + "."); return;
  }
  if ((el = ev.target.closest("[data-ptrecipe]"))) {
    const { E, rest } = tevOf(el.dataset.ptrecipe); if (!E) return; const tid = rest[0], r = {}, date = azToday();
    E.ing.forEach(g => { const n = document.querySelector('[data-pneed="' + E.key + ":" + tid + ":" + g.k + '"]'); r[g.k] = Math.max(0, Math.floor(Number(n && n.value) || 0)); });
    try { await updateDoc(classRef, { [E.p + "Recipe." + date + "." + tid]: r }); flash("Saved today\u2019s " + E.recipe + "."); } catch (e) { flash("Couldn\u2019t save \u2014 " + (e.code || e.message)); }
    return;
  }
  if ((el = ev.target.closest("[data-ptreset]"))) {
    const { E, rest } = tevOf(el.dataset.ptreset); if (!E) return;
    const date = azToday(), day = Object.assign({}, (cls[E.p + "Recipe"] || {})[date] || {}); delete day[rest[0]];
    try { await updateDoc(classRef, { [E.p + "Recipe." + date]: day }); flash("Back to the game\u2019s " + E.recipe + "."); } catch (e) { flash("Couldn\u2019t save \u2014 " + (e.code || e.message)); }
    return;
  }
  if ((el = ev.target.closest("[data-hitsort]"))) { busy.hitSort = el.dataset.hitsort; render(); return; }
  if ((el = ev.target.closest("[data-endbattle]"))) { await endBattle(el.dataset.endbattle); flash("Saved \u2014 battle ended."); return; }
  if ((el = ev.target.closest("[data-ideaseen]"))) {
    const [sid, i] = el.dataset.ideaseen.split(":"), st = sOf(sid); if (!st) return;
    const ideas = (st.ideas || []).map(x => Object.assign({}, x)); if (!ideas[i]) return;
    ideas[i].seen = !ideas[i].seen; return patch(sid, { ideas });
  }
  if ((el = ev.target.closest("[data-qpass]"))) { await questTeacherClick(el, { students, patch, flash }); return; }
  if ((el = ev.target.closest("[data-doordone]"))) {
    const [sid, path] = el.dataset.doordone.split(":"); const [d, k] = path.split("/"); const s = sOf(sid);
    const cur = !!((((s.doors || {})[d] || {})[k]) || {}).ordered;
    if (!cur && !el.dataset.undo) prizeUndo.push(["doordone", el.dataset.doordone]);
    return patch(sid, { ["doors." + d + "." + k + ".ordered"]: !cur });
  }
  if ((el = ev.target.closest("[data-ordered]"))) {
    const [sid, idx] = el.dataset.ordered.split(":"); const s = sOf(sid);
    const log = (s.spinLog || []).map(x => Object.assign({}, x)); if (!log[idx]) return;
    log[idx].ordered = !log[idx].ordered;
    if (log[idx].ordered && !el.dataset.undo) prizeUndo.push(["ordered", el.dataset.ordered]);
    return patch(sid, { spinLog: log });
  }
  if ((el = ev.target.closest("[data-refund]"))) {
    const [sid, idx] = el.dataset.refund.split(":"); const s = sOf(sid);
    const purchases = (s.purchases || []).slice(); const [p] = purchases.splice(Number(idx), 1);
    if (!p) return;
    const data = { purchases, candySpent: Math.max(0, (Number(s.candySpent) || 0) - (p.cost || 0)) };
    const dec = k => Math.max(0, (Number(s[k]) || 0) - 1);
    if (p.id === "witchhat") { data.witchHat = false; if (s.equipped === "witch") data.equipped = null; }
    if (p.id === "pilgrimhat") { data.pilgrimHat = false; if (s.equipped === "pilgrim") data.equipped = null; }
    if (p.id === "antlers") { data.antlersHat = false; if (s.equipped === "antlers") data.equipped = null; }
    if (p.id === "earmuffs") { data.earmuffsHat = false; if (s.equipped === "earmuffs") data.equipped = null; }
    if (p.id === "cupidcrown") { data.crownHat = false; if (s.equipped === "cupidcrown") data.equipped = null; }
    if (p.id === "brew" || p.id === "pie" || p.id === "cocoa" || p.id === "strawberry") data.brews = dec("brews");
    if (p.id === "attack" || p.id === "snowball") data.extraAttacks = dec("extraAttacks");
    if (p.id === "spin") data.spins = dec("spins");
    return patch(sid, data);
  }
  if ((el = ev.target.closest("[data-assign]"))) { busy.assign = el.dataset.assign; render(); return; }
  if ((el = ev.target.closest("[data-ctab]"))) { ctab = el.dataset.ctab; try { localStorage.setItem("ck-ctab", ctab); } catch (e) {} render(); scrollTo({ top: 0 }); return; }
  if ((el = ev.target.closest("[data-viewas]"))) { const u = new URL(studentLink(el.dataset.viewas)); u.searchParams.set("preview", "1"); window.open(u.toString(), "_blank"); return; }
  if ((el = ev.target.closest("[data-copylink]"))) {
    const link = studentLink(el.dataset.copylink || null);
    try { await navigator.clipboard.writeText(link); el.textContent = "Copied!"; setTimeout(render, 1400); } catch (e) { prompt("Copy this link:", link); }
    return;
  }
  if (!(el = ev.target.closest("[data-act]"))) return;
  const act = el.dataset.act;

  if (act === "signIn") { try { await teacherSignIn(); } catch (e) { flash("Sign-in didn’t finish — " + (e.code || e.message)); } return; }
  if (act === "goPrizes") { ctab = "events"; try { localStorage.setItem("ck-ctab", ctab); } catch (e) {} render(); const c = document.getElementById("prizeCard"); if (c) c.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
  if (act === "endAllBattles") { const ids = (battles || []).filter(b => ["invite", "team", "lead", "fight"].includes(b.status)).map(b => b.id); for (const id of ids) await endBattle(id); flash("Saved \u2014 ended " + ids.length + " battles."); return; }
  if (act === "allIdeas") { busy.allIdeas = !busy.allIdeas; render(); return; }
  if (act === "goDoors") { ctab = "events"; try { localStorage.setItem("ck-ctab", ctab); } catch (e) {} render(); const c = document.getElementById("doorCard"); if (c) c.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
  if (act === "hideDoors") { doorHidden = waitingDoors(students, cls).length; render(); return; }
  if (act === "saveWeekGoal" || act === "resetWeekGoal") {
    const v = act === "resetWeekGoal" ? WEEK_DOOR_XP : Math.max(1, Math.round(Number(document.getElementById("weekGoalBox").value) || WEEK_DOOR_XP));
    try {
      await updateDoc(classRef, { weekGoal: v === WEEK_DOOR_XP ? null : { week: weekKey(cls), xp: v } });
      const n = await weekCheck(v);
      flash("Saved \u2014 the Weekly Door is " + v.toLocaleString() + " XP this week." + (n ? " " + n + " student" + (n === 1 ? "" : "s") + " unlocked it!" : ""));
    } catch (e) { flash("Couldn\u2019t save \u2014 " + (e.code || e.message)); }
    return;
  }
  if (act === "weekCheck") { try { const n = await weekCheck(); flash(n ? "\u{1F6AA} Unlocked the Weekly Door for " + n + " student" + (n === 1 ? "" : "s") + "!" : "Nobody new has reached the goal yet."); } catch (e) { flash("Couldn\u2019t save \u2014 " + (e.code || e.message)); } return; }
  if (act && act.startsWith("tev")) {
    const E = TEAM_EVENTS[el.dataset.ev]; if (!E) return;
    if (act === "tevToggle") { const on = !cls[E.p + "On"]; try { await updateDoc(classRef, { [E.p + "On"]: on }); flash("Saved \u2014 " + E.title + " " + (on ? "on" : "off") + "."); } catch (e) { flash("Couldn\u2019t change that \u2014 " + e.code); } return; }
    if (act === "tevAddTeam") { const list = tevTeams(E, cls); await saveTevTeams(E, list.concat([{ id: "t" + Date.now().toString(36), name: "Team " + (list.length + 1), members: [] }]), "Added a team \u2014 type its name and put students on it."); return; }
    if (act === "tevOpen") { busy["tevOpen" + E.key] = !busy["tevOpen" + E.key]; return; }
    if (act === "tevCheck") { await tevCheckNow(E); return; }
    if (act === "tevAward") {
      const top = topTeams(E, cls); if (!E.leg || !top.length || cls[topField(E)]) return;
      if (!confirm("Give the " + E.legName + " egg to everyone on " + top.map(t => t.name).join(" & ") + "?")) return;
      const ids = [...new Set(top.flatMap(t => t.members || []))], batch = writeBatch(db), f = legField(E);
      ids.forEach(id => { const st = students.find(x => x.id === id); if (st) batch.update(studentRef(id), { [f]: (Number(st[f]) || 0) + 1 }); });
      batch.update(classRef, { [topField(E)]: { at: new Date().toISOString(), teams: top.map(t => t.id) } });
      try { await batch.commit(); flash("\u{1F3C6} Gave the " + E.legName + " egg to " + ids.length + " students!"); } catch (e) { flash("Couldn\u2019t save \u2014 " + (e.code || e.message)); }
      return;
    }
    return;
  }
  if (act === "doorsToggle") { const on = !cls.doorsOn; try { await updateDoc(classRef, { doorsOn: on }); flash("Saved \u2014 " + (DOOR_NAMES[SEASON.key] || "Daily Doors") + " is " + (on ? "on" : "off") + "."); } catch (e) { flash("Couldn\u2019t change that \u2014 " + e.code); } return; }
  if (act === "doorApproveAll") {
    const w = waitingDoors(students, cls), batch = writeBatch(db), byS = {};
    w.forEach(r => { byS[r.s.id] = byS[r.s.id] || {}; byS[r.s.id]["doors." + r.date + "." + r.i + ".st"] = "ok"; });
    Object.keys(byS).forEach(id => batch.update(studentRef(id), byS[id]));
    try { await batch.commit(); flash("Saved \u2014 approved " + w.length + " door" + (w.length === 1 ? "" : "s") + "."); } catch (e) { flash("Couldn\u2019t save that \u2014 " + e.code); }
    return;
  }
  if (act === "saveDoorList" || act === "resetDoorList") {
    const lines = act === "resetDoorList" ? DOOR_DEFAULT.slice() : (document.getElementById("doorList").value || "").split("\n").map(x => x.trim()).filter(Boolean).slice(0, 30);
    if (!lines.length) { flash("Add at least one door."); return; }
    busy.doorEdit = true;
    try { await updateDoc(classRef, { doorList: lines }); flash("Saved \u2014 " + lines.length + " doors every day."); } catch (e) { flash("Couldn\u2019t save that \u2014 " + e.code); }
    return;
  }
  if (act === "saveDoorDay" || act === "clearDoorDay") {
    const d = busy.doorDay || azToday(); busy.doorEdit = true;
    const lines = (document.getElementById("doorDayList").value || "").split("\n").map(x => x.trim()).filter(Boolean).slice(0, 30);
    if (act === "saveDoorDay" && !lines.length) { flash("Add at least one door."); return; }
    try { await updateDoc(classRef, { ["doorDays." + d]: act === "clearDoorDay" ? null : lines }); flash("Saved \u2014 doors for " + d + "."); } catch (e) { flash("Couldn\u2019t save that \u2014 " + e.code); }
    return;
  }
  if (act === "hidePrizes") { prizeHidden = prizesOpen(); render(); return; }
  if (act === "signOut") { await signOut(auth); return; }
  if (act === "classView") { mode = "class"; render(); scrollTo({ top: 0 }); return; }
  if (act === "backConsole") { mode = "guide"; render(); return; }
  if (act === "testParty") { partyQueue.push({ text: "Ember unlocked the Crown!", sub: "5-day 120 XP streak", glyph: "\u{1F451}", pet: "\u{1F409}" }); if (!partyShowing) runParty(); return; }

  if (act === "saveSetup") {
    const name = document.getElementById("setClass").value.trim();
    if (!name) { flash("Give the class a name first."); return; }
    const goal = Math.max(10, Math.min(2000, Math.floor(Number(document.getElementById("setGoal").value) || 120)));
    try {
      await setDoc(classRef, { className: name, weekLabel: document.getElementById("setWeek").value.trim(), goal, recorded: five(false), createdAt: new Date().toISOString() });
      mode = "guide";
    } catch (e) { flash("Couldn’t create the class — " + (e.code || e.message) + ". Check that your email is in firestore.rules."); }
    return;
  }
  if (act === "toggleHaunt") { await toggleHaunt(); return; }
  if (act === "hauntKeep") { busy.hauntAsk = false; await hauntOn(false); return; }
  if (act === "hauntFresh") { busy.hauntAsk = false; await hauntOn(true); return; }
  if (act === "hauntCancel") { busy.hauntAsk = false; render(); return; }
  if (act === "battleView") { mode = "battle"; render(); scrollTo({ top: 0 }); return; }
  if (act === "saveBoss") {
    try {
      await updateDoc(classRef, { bossHP: Math.max(10, Math.floor(Number(document.getElementById("gBossHP").value) || BOSS_START_HP)),
        bossDmg: Math.max(1, Math.floor(Number(document.getElementById("gBossDmg").value) || 50)) });
      flash("Saved the " + SEASON.boss + ".");
    } catch (e) { flash("Couldn’t save — " + e.code); }
    return;
  }
  if (act === "newBoss") {
    if (!busy.confirmBoss) { busy.confirmBoss = true; render(); return; }
    busy.confirmBoss = false;
    const nb = bossState(cls, students), wl = nb.wall ? { wallMark: 0, wallAt: nb.wall.built, wallAbs: nb.wall.built - nb.wall.left } : {};   // a standing snow wall stays up
    try { await updateDoc(classRef, Object.assign({ bossHP: BOSS_START_HP, bossBase: nb.total, bossBaseHits: nb.totalHits, bossHealed: 0 }, wl)); flash("Saved — a new " + SEASON.boss + " appears!"); } catch (e) { flash("Couldn’t summon — " + e.code); }
    return;
  }
  if (act === "saveClass") {
    try {
      await updateDoc(classRef, { className: document.getElementById("gClass").value.trim(), weekLabel: document.getElementById("gWeek").value.trim(),
        goal: Math.max(10, Math.min(2000, Math.floor(Number(document.getElementById("gGoal").value) || 120))),
        lunchCutoff: document.getElementById("gLunch").value || "12:30" });
      flash("Saved.");
    } catch (e) { flash("Couldn’t save — " + e.code); }
    return;
  }
  if (act === "pasteOpen") { busy.paste = true; render(); const b = document.getElementById("pasteBox"); if (b) b.focus(); return; }
  if (act === "pasteClose") { busy.paste = false; render(); return; }
  if (act === "pasteLunch" || act === "pasteDay") {
    const rows = parsePasted(busy.pasteText || ""); if (!rows.length) return;
    const up = { kind: act === "pasteLunch" ? "lunch" : "day", day, file: "pasted data", rows, nameKey: "name", xpKey: "completed", guideKey: null };
    busy.lastUpload = up; busy.paste = false; busy.pasteText = "";
    await sendUpload(up); return;
  }
  if (act === "lateCancel") { busy.lunchLate = null; render(); return; }
  if (act === "lateAsDay") { const up = Object.assign({}, busy.lunchLate, { kind: "day" }); busy.lunchLate = null; busy.lastUpload = up; await applyUpload(up); return; }
  if (act === "tradeToggle") {
    const v = tradeOpen(cls) ? "closed" : "open";
    try { await updateDoc(classRef, { tradeOverride: v, tradeOff: false }); flash("Saved \u2014 trading " + (v === "open" ? "OPEN for everyone. Set the Trading menu back to \u201cOn schedule\u201d to follow the normal hours." : "closed.")); } catch (e) { flash("Couldn\u2019t save \u2014 " + e.code); }
    return;
  }
  if (act === "arenaToggle") {
    const v = arenaOpen(cls) ? "closed" : "open";
    try { await updateDoc(classRef, { arenaOverride: v }); flash("Saved \u2014 arena " + (v === "open" ? "OPEN for everyone. Set the menu back to \u201cOn schedule\u201d to follow the normal hours." : "closed.")); } catch (e) { flash("Couldn\u2019t save \u2014 " + e.code); }
    return;
  }
  if (act === "eggAllCancel") { busy.eggAll = false; render(); return; }
  if (act === "eggAll") {
    if (!busy.eggAll) { busy.eggAll = true; render(); return; }
    busy.eggAll = false;
    const batch = writeBatch(db), list = students.filter(x => x.companionId);
    list.forEach(x => batch.update(studentRef(x.id), { bonusPulls: (Number(x.bonusPulls) || 0) + 1 }));
    try { await batch.commit(); flash("Saved \u2014 sent a free egg to all " + list.length + " students!"); } catch (e) { flash("Couldn\u2019t send the eggs \u2014 " + e.code); }
    return;
  }
  if (act === "saveDuck") { try { await updateDoc(classRef, { duckStart: document.getElementById("duckStart").value || null }); flash("Saved the Duckarune event dates."); } catch (e) { flash("Couldn\u2019t save \u2014 " + e.code); } return; }
  if (act === "toggleDuck") { try { await updateDoc(classRef, { duckOff: !cls.duckOff }); flash("Saved \u2014 Duckarune event " + (cls.duckOff ? "on" : "off") + "."); } catch (e) { flash("Couldn\u2019t save \u2014 " + e.code); } return; }
  if (act === "saveRoomStart") { const v = document.getElementById("roomStart").value; if (!v) return; try { await updateDoc(classRef, { roomStart: v }); flash("Saved \u2014 Comfort Points count from " + v + "."); } catch (e) { flash("Couldn\u2019t save \u2014 " + e.code); } return; }
  if (act === "saveCollStart") { try { await updateDoc(classRef, { collectorStart: document.getElementById("collStart").value || null }); flash("Saved the collector start date."); } catch (e) { flash("Couldn\u2019t save \u2014 " + e.code); } return; }
  if (act === "rewardsFinished") { busy.rewardsFinished = !busy.rewardsFinished; render(); return; }
  if (act === "saveFastRing") { const v = Math.max(1, Math.floor(Number(document.getElementById("fastRing").value) || FAST_RING)); try { await updateDoc(classRef, { fastRing: v }); flash("Saved \u2014 the Fast Math Ring closes at " + v + " FastMath XP."); } catch (e) { flash("Couldn\u2019t save \u2014 " + e.code); } return; }
  if (act === "seenIdeas") { busy.seenIdeas = !busy.seenIdeas; return; }
  if (act === "goalOpen") { busy.goalOpen = !busy.goalOpen; return; }
  if (act === "shopAll") { busy.shopAll = !busy.shopAll; render(); return; }
  if (act === "prizeDone") { busy.prizeDone = !busy.prizeDone; render(); return; }
  if (act === "prizeUndo") {
    const last = prizeUndo.pop(); if (!last) { render(); return; }
    const [attr, val] = last, s2 = sOf(val.split(":")[0]); if (!s2) { render(); return; }
    if (attr === "ordered") { const idx = Number(val.split(":")[1]), log = (s2.spinLog || []).map(x => Object.assign({}, x)); if (!log[idx]) return; log[idx].ordered = false; return patch(s2.id, { spinLog: log }); }
    const [d, k] = val.split(":")[1].split("/"); return patch(s2.id, { ["doors." + d + "." + k + ".ordered"]: false });
  }
  if (act === "rewardsAll") { busy.rewardsAll = !busy.rewardsAll; render(); return; }
  if (act === "finalize") { busy.finalize = day; render(); return; }
  if (act === "finalizeCancel") { busy.finalize = null; busy.finalizeAnyway = null; render(); return; }
  if (act === "finalizeAnyway") { busy.finalizeAnyway = day; render(); return; }
  if (act === "finalizeOk") {
    const d = day, f = finalizePreview(cls, students, d);
    busy.finalize = null; busy.finalizeAnyway = null;
    if (arr5(cls.finalized, false)[d]) return flash(DAYS[d] + " is already finalized.");   // never add the bucket candy twice
    const rec = recordedDays(cls); rec[d] = true;
    const fin = arr5(cls.finalized, false); fin[d] = true;
    const amt = arr5(cls.finalAmt, 0); amt[d] = f.candy;
    const died = arr5(cls.finalDied, null).map(x => Array.isArray(x) ? x : String(x || "").split(",").filter(Boolean)); died[d] = f.died.map(x => x.id);
    const batch = writeBatch(db);
    const date = dateOfDay(d);
    const rewards = (cls.rewardLog || []).filter(r => !(r.date === date && r.day === d));
    rewards.unshift({ date, day: d, week: cls.weekLabel || "", students: f.full.map(x => ({ id: x.id, name: x.name })), rewarded: [] });
    // the teacher's collector: 1 egg per student at 120, banked XP per student who missed
    const tr = teacherReward(students, d), tprev = (cls.teacherLog || {})[date], tt = cls.teacher || {};
    const tEggs = Math.max(0, (Number(tt.eggsEarned) || 0) - (tprev ? tprev.eggs : 0) + tr.eggs), tXp = Math.max(0, (Number(tt.xpEarned) || 0) - (tprev ? tprev.xp : 0) + tr.xp);
    batch.update(classRef, { recorded: rec, finalized: fin, finalAmt: amt, finalDied: died.map(x => x.join(",")),
      bucketEarned: (Number(cls.bucketEarned) || 0) + f.candy, rewardLog: rewards.slice(0, 60),
      ...(isFrost(cls) ? wallMarks(cls, students, (Number(cls.bucketEarned) || 0) + f.candy) : {}),   // the new snow blocks go on top of what's standing
      "teacher.eggsEarned": tEggs, "teacher.xpEarned": tXp, ["teacherLog." + date]: { eggs: tr.eggs, xp: tr.xp } });
    f.died.forEach(x => batch.update(studentRef(x.id), { deaths: (x.deaths || []).concat([{ date, day: d, week: cls.weekLabel || "" }]) }));
    try { await batch.commit(); flash("Saved \u2014 " + DAYS[d] + " is finalized." + (f.candy ? (isFrost(cls) ? " The Snowlotl built +" + f.candy + " HP of snow wall!" : " +" + f.candy + " " + (isHeart(cls) ? "candy hearts" : SEASON.cur) + " for Ms. Ariana!") : "") + " You earned " + tr.eggs + " egg" + (tr.eggs === 1 ? "" : "s") + " and " + tr.xp + " XP for your creatures."); } catch (e) { flash("Couldn\u2019t finalize \u2014 " + e.code); }
    return;
  }
  if (act === "unfinalize") {
    const d = day;
    const fin = arr5(cls.finalized, false); fin[d] = false;
    const amt = arr5(cls.finalAmt, 0), back = Number(amt[d]) || 0; amt[d] = 0;
    const diedStr = arr5(cls.finalDied, ""), ids = String(diedStr[d] || "").split(",").filter(Boolean); diedStr[d] = "";
    const batch = writeBatch(db);
    const date = dateOfDay(d);
    const tlog = (cls.teacherLog || {})[date], tt = cls.teacher || {};
    batch.update(classRef, { finalized: fin, finalAmt: amt, finalDied: diedStr, bucketEarned: Math.max(0, (Number(cls.bucketEarned) || 0) - back),
      ...(isFrost(cls) ? wallMarks(cls, students, Math.max(0, (Number(cls.bucketEarned) || 0) - back)) : {}),
      rewardLog: (cls.rewardLog || []).filter(r => !(r.date === date && r.day === d)),
      ...(tlog ? { "teacher.eggsEarned": Math.max(0, (Number(tt.eggsEarned) || 0) - tlog.eggs), "teacher.xpEarned": Math.max(0, (Number(tt.xpEarned) || 0) - tlog.xp), ["teacherLog." + date]: null } : {}) });
    ids.forEach(id => { const x = sOf(id); if (x) batch.update(studentRef(id), { deaths: (x.deaths || []).filter(e => !(e.date === date && e.day === d)) }); });
    try { await batch.commit(); flash("Saved \u2014 " + DAYS[d] + " is open again."); } catch (e) { flash("Couldn\u2019t undo \u2014 " + e.code); }
    return;
  }
  if (act === "saveRate") {
    try { await updateDoc(classRef, { healRate: Math.max(1, Math.floor(Number(document.getElementById("healRate").value) || 1)) }); flash("Saved the heal rate."); } catch (e) { flash("Couldn\u2019t save \u2014 " + e.code); }
    return;
  }
  if (act === "heal") {
    const k = bucketState(cls, students), b = bossState(cls, students);
    let candy = Math.floor(Number(document.getElementById("healCandy").value) || 0);
    if (candy <= 0) { flash("Type how much " + SEASON.cur + " to spend."); return; }
    candy = Math.min(candy, k.left);
    const room = b.max - b.left;                      // health it can still regain
    const heal = Math.min(candy * k.rate, room);
    if (heal <= 0) { flash("The " + SEASON.boss + " is already at full health."); return; }
    const used = Math.ceil(heal / k.rate);
    try { await updateDoc(classRef, { bossHealed: (Number(cls.bossHealed) || 0) + heal, bucketSpent: (Number(cls.bucketSpent) || 0) + used }); flash("Saved \u2014 the " + SEASON.boss + " healed " + heal + "!"); }
    catch (e) { flash("Couldn\u2019t heal \u2014 " + e.code); }
    return;
  }
  if (act === "toggleRecorded") { const rec = recordedDays(cls); rec[day] = !rec[day]; try { await updateDoc(classRef, { recorded: rec }); } catch (e) { flash("Couldn’t change that — " + e.code); } return; }
  if (act === "clearDay") {
    const batch = writeBatch(db);
    const rec = recordedDays(cls); rec[day] = false; batch.update(classRef, { recorded: rec });
    students.forEach(s => {
      const status = arr5(s.status, ""), xp = arr5(s.xp, null), lunchXp = arr5(s.lunchXp, null), early = arr5(s.early, false);
      status[day] = ""; xp[day] = null; lunchXp[day] = null; early[day] = false;
      const hist = Object.assign({}, s.xpHist || {}); delete hist[dateOfDay(day)];
      batch.update(studentRef(s.id), { status, xp, lunchXp, early, xpHist: hist });
    });
    try { await batch.commit(); busy.upReport = null; } catch (e) { flash("Couldn’t clear — " + e.code); }
    return;
  }
  if (act === "addUnmatched") {
    const up = busy.upReport; if (!up || !up.unmatched.length) return;
    el.disabled = true;
    const batch = writeBatch(db); const base = students.length;
    up.unmatched.forEach((u, i) => { const ref = newStudentRef(); const s = blankStudent(u.name, base + i); batch.set(ref, s); students.push(Object.assign({ id: ref.id }, s)); });
    try { await batch.commit(); } catch (e) { flash("Couldn’t add them — " + e.code); return; }
    if (busy.lastUpload) await applyUpload(busy.lastUpload);
    return;
  }
  if (act === "saveRoster") {
    const lines = document.getElementById("rosterBox").value.split("\n").map(x => x.trim()).filter(Boolean);
    const byName = {}; students.forEach(s => { byName[(s.fullName || s.name).toLowerCase()] = s; });
    const keep = {}; const batch = writeBatch(db);
    lines.forEach((nm, i) => {
      const found = byName[nm.toLowerCase()];
      if (found) { keep[found.id] = 1; if (found.order !== i || (found.fullName || found.name) !== nm) batch.update(studentRef(found.id), { order: i, name: nm }); }
      else { const ref = newStudentRef(); batch.set(ref, blankStudent(nm, i)); keep[ref.id] = 1; }
    });
    students.forEach(s => { if (!keep[s.id]) batch.delete(studentRef(s.id)); });
    busy.rosterDraft = null;
    try { await batch.commit(); flash("Roster saved."); } catch (e) { flash("Roster didn’t save — " + e.code); }
    return;
  }
  if (act === "newWeek") {
    if (!busy.confirmNewWeek) { busy.confirmNewWeek = true; render(); return; }
    busy.confirmNewWeek = false; busy.upReport = null;
    const batch = writeBatch(db);
    // the Monday the new week starts (today if it's Monday; otherwise the coming Monday), so streaks carry over
    const t = new Date(azToday() + "T12:00:00Z"), wd = t.getUTCDay(); t.setUTCDate(t.getUTCDate() + (wd === 1 ? 0 : (8 - wd) % 7));
    batch.update(classRef, { recorded: five(false), finalized: five(false), finalAmt: five(0), finalDied: five(""), weekStart: t.toISOString().slice(0, 10) });
    const haunt = isHaunt(cls);
    const wk = t.toISOString().slice(0, 10);
    students.forEach(s => batch.update(studentRef(s.id), { streakCarry: simulate(s, cls).hitRun, streakWeek: wk,   // keep the streak going into next week
      status: five(""), xp: five(null), lunchXp: five(null), early: five(false), items: [], equipped: null,
      attacks: five(false), candyBank: (Number(s.candyBank) || 0) + (eventMode(cls) ? weekCandy(s) : 0) }));
    try { await batch.commit(); flash("New week started."); } catch (e) { flash("Couldn’t reset — " + e.code); }
    return;
  }
  if (act === "cancelAssign") { busy.assign = null; render(); return; }
  if (act === "doAssign") {
    const sid = busy.assign, comp = document.getElementById("assignComp").value || null;
    const nm = document.getElementById("assignName").value.trim();
    busy.assign = null;
    return patch(sid, { companionId: comp, petName: comp ? (nm || byId(ROSTER, comp).name) : "" });
  }
});

document.addEventListener("keydown", ev => {
  if (ev.key !== "Enter") return;
  if (["setClass", "setWeek", "setGoal"].includes(ev.target.id)) { ev.preventDefault(); document.querySelector('[data-act="saveSetup"]').click(); }
  if (ev.target.id === "assignName") { ev.preventDefault(); document.querySelector('[data-act="doAssign"]').click(); }
});

render();
