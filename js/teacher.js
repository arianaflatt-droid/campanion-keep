import { newlyEarned, badgeById } from "./badges.js";
import {
  applyDisplayNames, displayNames, firstLast, companionOf, DAYS, SHORT, ROSTER, ITEMS, GEAR, BANNER, byId, esc, arr5, five, recordedDays, goalXP,
  simulate, wornItem, tier, boardDay, sidekickToday, keepHTML, itemArt, isHaunt, battleOn, candyOf, CANDY_FULL, weekCandy, battleHTML, bossState, ghostUnlocked, STORE, candyLeft, storeArt, dmgOf, baseDamage,
  bucketState, bucketHTML, finalizePreview, dateOfDay, BUCKET_PER_MISS, WHEEL, PRIZES
} from "./game.js";
import { duckWindow, duckOpen, azToday, xpTotal, pullsLeft, legendaryLeft, bankXP, ownedFams, seenSet, arenaOpen, ARENA_HOURS, CREATURES, family, creature, formOf } from "./collect.js";
import { watchBattles,
  configured, auth, classRef, studentRef, newStudentRef, isTeacherEmail, watchClass, watchStudents,
  teacherSignIn, onAuthStateChanged, signOut, setDoc, updateDoc, deleteDoc, writeBatch, db
} from "./db.js";

/* ================= state ================= */
let user = null, cls = null, clsLoaded = false, students = [], studentsLoaded = false;
let mode = "boot";           // boot | noconfig | signin | denied | setup | guide | class | battle
let day = todayIndex();
const busy = {};
let flashMsg = null, flashTimer = null, flashOk = false;
let ctab = (() => { try { return localStorage.getItem("ck-ctab") || "daily"; } catch (e) { return "daily"; } })();
let unsub = [], battles = [], badgeWriting = false;

function todayIndex() { const d = new Date().getDay(); return d >= 1 && d <= 5 ? d - 1 : 0; }
function blankStudent(name, order) {
  return { name, order, companionId: null, petName: "", equipped: null, sidekick: "axolotl",
    status: five(""), xp: five(null), lunchXp: five(null), early: five(false), items: [],
    candyBank: 0, attacks: five(false), attackTotal: 0 };
}
function sOf(id) { return students.find(s => s.id === id); }
function flash(msg) { flashMsg = msg; flashOk = /^(Saved|Roster saved|New week|Haunt|Added|Everyone in that file)/.test(msg); render(); clearTimeout(flashTimer); flashTimer = setTimeout(() => { flashMsg = null; render(); }, 6000); }
async function patch(id, data) {
  const s = sOf(id); if (s) Object.assign(s, data);
  render();
  try { await updateDoc(studentRef(id), data); } catch (e) { flash("Couldn’t save — " + (e.code || e.message)); }
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
  batch.update(classRef, fresh ? { haunt: true, hauntSince: since, bucketEarned: 0, bucketSpent: 0 } : { haunt: true, hauntSince: since });
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
  unsub.push(watchClass(c => { cls = c; clsLoaded = true;
    if (c && c.haunt && !c.hauntSince) updateDoc(classRef, { hauntSince: azToday() }).catch(() => {});   // Hexaduck streaks start today if the mode was already on
    if (c && !c.collectorStart) updateDoc(classRef, { collectorStart: (() => { const t = new Date(); return t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0"); })() }).catch(() => {}); if (!c) mode = "setup"; else if (mode === "boot" || mode === "setup") mode = "guide"; detectEvents(); render(); },
    e => flash("Couldn’t load the class — " + e.code)));
  unsub.push(watchBattles(l => { battles = l; lockBadges(); }, () => {}));
  unsub.push(watchStudents(list => { students = applyDisplayNames(list); studentsLoaded = true; detectEvents(); lockBadges(); render(); },
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
async function lockBadges() {
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
  return '<div class="bshout"><img src="' + esc(b.img) + '" alt="">' +
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
    if (now[s.id].side >= 0 && was.side !== now[s.id].side) fresh.push({ id: s.id, text: pet + "’s " + (side === "duck" ? "duck" : side === "ghost" ? "Ghost-olotl" : "axolotl") + " came to lunch!", sub: "Hit 120 XP before lunch", glyph: "☀️", pet: c.glyph });
    if (now[s.id].atk > (was.atk || 0) && isHaunt(cls)) {
      const hitFor = Math.max(0, now[s.id].dmg - (was.dmg || 0)) || baseDamage(cls);
      fresh.push({ id: s.id, text: pet + " attacked the Ghost-olotl!", sub: "\u2212" + hitFor + " health", glyph: "\u2694\uFE0F", pet: c.glyph, battle: true });
      battleHit(hitFor);
    }
    const newB = now[s.id].badges.filter(id => !(was.badges || []).includes(id)).map(badgeById).filter(Boolean);
    if (newB.length) fresh.push({ id: s.id, text: pet + " earned " + (newB.length === 1 ? "the " + newB[0].name + " badge!" : newB.length + " new badges!"), sub: newB.length === 1 ? newB[0].desc : newB.map(b => b.name).slice(0, 3).join(" \u00b7 ") + (newB.length > 3 ? "\u2026" : ""), glyph: "\u{1F3C5}", pet: c.glyph });
    if (capes > was.capes) fresh.push({ id: s.id, text: pet + "\u2019s " + petN + " is back thanks to a Hero Cape!", sub: "Welcome back", glyph: "\u{1F9B8}", pet: c.glyph });
  });
  seen = now;
  if (isHaunt(cls)) {
    const healedNow = Number(cls.bossHealed) || 0;
    if (lastHealed !== null && healedNow > lastHealed) {
      const amt = healedNow - lastHealed;
      fresh.push({ text: "Ms. Ariana healed the Ghost-olotl!", sub: "+" + amt + " health", glyph: "\u{1F49A}", pet: "\u{1F47B}" });
      battleFx = { heal: amt }; clearTimeout(fxTimer); fxTimer = setTimeout(() => { battleFx = null; render(); }, 1600);
    }
    lastHealed = healedNow;
    students.forEach(st => {
      const n = (st.spinLog || []).filter(e => e.id === "prize").length, was2 = prizeSeen[st.id];
      if (was2 !== undefined && n > was2) { const c = companionOf(st); fresh.push({ id: st.id, text: (st.name || st.petName || (c && c.name)) + " won a PRIZE!", sub: "Trick or Treat Wheel", glyph: "\u{1F381}", pet: c ? c.glyph : "\u{1F383}" }); }
      prizeSeen[st.id] = n;
    });
    const b = bossState(cls, students);
    if (lastBossLeft !== null && lastBossLeft > 0 && b.defeated) fresh.push({ text: "The Ghost-olotl has been defeated!", sub: "Great teamwork, everyone", glyph: "\u{1F389}", pet: "\u{1F47B}" });
    // First defeat ever: unlock the Witch Hat and the Ghost-olotl pet for good.
    if (b.defeated && !ghostUnlocked(cls) && !unlockWriting) {
      unlockWriting = true;
      updateDoc(classRef, { ghostDefeated: true, ghostDefeatedAt: new Date().toISOString() })
        .then(() => { partyQueue.push({ text: "New unlocks: Witch Hat & Ghost-olotl pet!", sub: "Witch Hat at a 5-day streak \u00b7 Ghost-olotl lunch sidekick", glyph: "\u{1F9D9}", pet: "\u{1F47B}" }); if (!partyShowing) runParty(); })
        .catch(e => flash("Couldn’t save the Ghost-olotl unlock — " + e.code))
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
function render() {
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
  else if (mode === "battle") h += battleHTML(cls, students, battleFx) + healControls();
  else {
    const tabs = [["daily", "\u{1F4C5} Daily"], ["students", "\u{1F43E} Students"], ["collector", "\u{1F95A} Collector"], ["events", "\u2728 Events" + (isHaunt(cls) ? " \u{1F383}" : "")], ["settings", "\u2699\uFE0F Settings"]];
    if (!tabs.some(x => x[0] === ctab)) ctab = "daily";
    h += '<div class="tabs ctabs" role="tablist">' + tabs.map(([k, l]) => '<button role="tab" class="tab' + (ctab === k ? " on" : "") + '" data-ctab="' + k + '" aria-selected="' + (ctab === k) + '">' + l + "</button>").join("") + "</div>";
    if (ctab === "daily") h += viewDaily() + viewRewards();
    else if (ctab === "students") h += viewStandings() + viewAssign() + viewLosses() + viewLinks();
    else if (ctab === "collector") h += viewCollector();
    else if (ctab === "events") h += viewModes() + duckAdmin() + (isHaunt(cls) ? viewBucket() + viewPrizes() + viewShop() : "");
    else h += viewClassSettings();
  }

  const active = document.activeElement, keep = active && active.id && active.matches("input, textarea") ? { id: active.id, v: active.value, pos: active.selectionStart } : null;
  app.innerHTML = h;
  if (keep) { const n = document.getElementById(keep.id); if (n) { n.value = keep.v; n.focus(); try { n.setSelectionRange(keep.pos, keep.pos); } catch (e) {} } }
  renderRules();
}

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
  return '<div class="banner warn" style="margin-bottom:12px;"><b>Finalize ' + DAYS[day] + "?</b> This locks in the day and counts it toward health." +
    "<br>" + f.missed.length + " student" + (f.missed.length === 1 ? "" : "s") + " missed " + goalXP(cls) + " XP" + (f.missed.length ? ": " + f.missed.map(x => esc(x.name)).join(", ") : "") + "." +
    (isHaunt(cls) ? "<br>\u{1F36C} Ms. Ariana\u2019s bucket gets <b>+" + f.candy + "</b> candy." : "") +
    "<br>\u2B50 Full health: <b>" + f.full.length + "</b> student" + (f.full.length === 1 ? "" : "s") + " (they go on your reward list)." +
    (f.died.length ? "<br>\u{1F480} Disappears: " + f.died.map(x => esc(x.name)).join(", ") + " (added to the losses log)." : "") +
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
      : '<button class="btn" data-act="finalize" style="background:var(--good);">\u2705 Finalize ' + DAYS[day] + "</button>") + "</div>" + pasteBox() + finalizeBox() +
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
function viewStandings() {
  const rec = recordedDays(cls);
  let h = '<div class="card"><div class="card-head"><h2>Full standings</h2><span class="fact"><b>two 120 XP misses in a row → disappears</b></span></div>';
  if (!students.length) return h + '<p class="lede">No students yet.</p></div>';
  const rows = students.map(s => ({ s, sim: s.companionId ? simulate(s, cls) : null }))
    .sort((a, b) => (b.sim ? b.sim.health : -1) - (a.sim ? a.sim.health : -1) || a.s.name.localeCompare(b.s.name));
  h += '<div class="scroll-x"><table class="grid"><thead><tr><th>Student</th><th>Companion</th><th>Mon–Fri</th><th>Days hit</th><th>Health</th><th>Standing</th>' + (isHaunt(cls) ? "<th>\u{1F36C} Candy left</th>" : "") + '<th>Gear</th></tr></thead><tbody>';
  rows.forEach(({ s, sim }) => {
    const c = companionOf(s);
    h += '<tr><td class="who">' + esc(s.name) + '<span class="pet"><button class="btn ghost small" data-copylink="' + s.id + '" style="margin-top:4px;padding:3px 8px;">Copy link</button> <button class="btn ghost small" data-viewas="' + s.id + '" style="margin-top:4px;padding:3px 8px;" title="See this student\u2019s page (read-only)">\u{1F440} View as</button></span></td>';
    h += "<td>" + (c ? c.glyph + " <b>" + esc(s.petName || c.name) + '</b><span class="pet">' + esc(c.name) + "</span>" : '<span class="muted">not chosen</span>') +
      ' <button class="btn ghost small" data-assign="' + s.id + '" style="margin-left:6px;">' + (c ? "Change" : "Set") + "</button></td>";
    if (!sim) { h += '<td colspan="' + (isHaunt(cls) ? 6 : 5) + '" class="muted">waiting for this student to choose</td></tr>'; return; }
    h += '<td><span class="dots">' + [0, 1, 2, 3, 4].map(d => {
      const v = arr5(s.status, "")[d], k = v === "c" ? "c" : v === "e" ? "e" : rec[d] ? "m" : "";
      return '<span class="dcol"><span class="dot3 ' + k + '" title="' + DAYS[d] + '"></span>' + (arr5(s.early, false)[d] ? '<span style="font-size:10px;line-height:1;">☀️</span>' : "") + "</span>";
    }).join("") + "</span></td>";
    h += '<td><span class="ovtag ' + (!sim.alive ? "bad" : sim.atRisk ? "warn" : "good") + '">' + sim.ovMet + " / " + sim.ovCounted + "</span>" +
      (sim.atRisk ? '<span class="pet">miss tomorrow = gone</span>' : "") + "</td>";
    const t = tier(sim);
    h += '<td><span class="hp t-' + t.key + '"><span class="track"><span class="bar" style="width:' + Math.max(0, Math.min(100, sim.health / sim.max * 100)) + '%"></span></span><span class="n">' + sim.health + "</span></span></td>";
    h += '<td style="color:' + (!sim.alive ? "var(--bad)" : "var(--ink-2)") + '">' + t.label + (sim.capeSaved ? '<span class="pet">saved by the cape</span>' : "") +
      (sim.capeReady ? ' <button class="btn small" data-givecape="' + s.id + '" style="margin-top:4px;">\u{1F9B8} Award Hero Cape</button>' : "") + "</td>";
    if (isHaunt(cls)) { const cd = candyLeft(s), ce = candyOf(s); h += '<td style="font-family:var(--mono);color:#E8740C;">' + cd.toLocaleString() + '<span class="pet">earned ' + ce.toLocaleString() + "</span></td>"; }
    const worn = wornItem(s, sim);
    h += '<td><div class="eqrow">' + GEAR.map(g => {
      const ok = sim.unlocked.includes(g.id);
      return '<button class="eq' + (worn && worn.id === g.id ? " on" : "") + '" data-equip="' + s.id + ":" + g.id + '"' + (ok ? "" : " disabled") +
        ' title="' + esc(g.name) + (ok ? "" : " — unlocks at a " + g.streak + "-day streak") + '">' + itemArt(g, "gimg") + "</button>";
    }).join("") + '</div><span class="pet">streak ' + sim.hitRun + " · best " + sim.bestRun + "</span>";
    (s.items || []).forEach((it, idx) => { const d4 = byId(ITEMS, it.id); if (d4) h += '<button class="x" title="Remove ' + esc(d4.name) + '" data-unaward="' + s.id + ":" + idx + '">' + d4.glyph + "</button>"; });
    h += "</td></tr>";
  });
  return h + "</tbody></table></div></div>";
}

function healControls() {
  const k = bucketState(cls, students), b = bossState(cls, students);
  return '<div class="card" style="margin-top:14px;"><div class="card-head"><h2>\u{1F36C} Heal the Ghost-olotl</h2><span class="fact">Bucket: <b>' + k.left.toLocaleString() + "</b> candy</span></div>" +
    '<p class="lede" style="font-size:13.5px;">Each candy heals <b>' + k.rate + "</b> health. The Ghost-olotl can\u2019t heal past " + b.max.toLocaleString() + ".</p>" +
    '<div class="healrow" style="justify-content:flex-start;"><div class="field"><label for="healCandy">Candy to spend</label><input id="healCandy" type="number" min="1" step="1" placeholder="50"></div>' +
    '<button class="btn" data-act="heal" style="background:#2E9E5B;"' + (k.left && !b.defeated ? "" : " disabled") + ">\u{1F49A} Heal</button>" +
    '<div class="field"><label for="healRate">Health per candy</label><input id="healRate" type="number" min="1" step="1" value="' + k.rate + '"></div>' +
    '<button class="btn ghost" data-act="saveRate">Save rate</button></div></div>';
}
function viewBucket() {
  const k = bucketState(cls, students);
  return '<div class="card"><div class="card-head"><h2>\u{1F383} Ms. Ariana\u2019s Candy Bucket</h2><span class="fact"><b>' + k.left.toLocaleString() + "</b> candy</span></div>" +
    '<p class="lede" style="font-size:13.5px;">Finalizing a day adds ' + BUCKET_PER_MISS + " for every student who missed " + goalXP(cls) + " XP. Earned " + k.earned.toLocaleString() +
    " \u00b7 stolen on the wheel " + k.stolen.toLocaleString() + " \u00b7 spent healing " + k.spent.toLocaleString() + ".</p>" + healControls().replace('<div class="card" style="margin-top:14px;">', '<div style="margin-top:6px;">') + "</div>";
}
function viewPrizes() {
  const rows = [];
  students.forEach(s => (s.spinLog || []).forEach((e, idx) => { if (e.id === "prize") rows.push({ s, e, idx }); }));
  rows.sort((a, b) => (a.e.ordered ? 1 : 0) - (b.e.ordered ? 1 : 0) || String(b.e.at).localeCompare(String(a.e.at)));
  const open = rows.filter(r => !r.e.ordered).length;
  let h = '<div class="card"><div class="card-head"><h2>\u{1F381} Prize winners</h2><span class="fact">' + (open ? "<b>" + open + "</b> to order or give" : "all done") + "</span></div>";
  if (!rows.length) return h + '<p class="lede">Nobody has won a prize yet. Prize! is a 5% slice on the Trick or Treat Wheel, and it opens the Prize Wheel.</p></div>';
  h += '<div class="scroll-x"><table class="tbl"><thead><tr><th>Done</th><th>Student</th><th>Prize</th><th>Link</th><th>When</th></tr></thead><tbody>';
  rows.forEach(r => {
    const p = PRIZES[r.e.prize] || { name: r.e.prizeName || "Prize", icon: "\u{1F381}", img: "", link: "" };
    const art = p.img ? '<img src="' + esc(p.img) + '" alt="" style="height:28px;vertical-align:middle;border-radius:6px;">' : p.icon;
    h += "<tr" + (r.e.ordered ? ' style="opacity:.55"' : "") + '><td><input type="checkbox" data-ordered="' + r.s.id + ":" + r.idx + '"' + (r.e.ordered ? " checked" : "") +
      ' aria-label="Ordered" style="width:20px;height:20px;"></td><td><b>' + esc(r.s.name) + "</b></td><td>" + art + " " + esc(r.e.prizeName || p.name) + "</td><td>" +
      (p.link ? '<a href="' + esc(p.link) + '" target="_blank" rel="noopener">Open link</a>' : p.xp ? '<span class="muted">give ' + p.xp + " XP</span>" : '<span class="muted">\u2014</span>') + '</td><td class="eff">' +
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
    "A 5-day 120 XP streak during the event unlocks it: 95% per egg until caught, then 1% (even after Haunt-O-Ween ends). Turn it on with Haunt-O-Ween Mode above.</p></div></div>";
}
function viewCollector() {
  const open = arenaOpen(cls), ov = cls.arenaOverride || "auto";
  const opt = (v, t) => '<option value="' + v + '"' + (ov === v ? " selected" : "") + ">" + t + "</option>";
  let h = '<div class="card"><div class="card-head"><h2>\u{1F95A} Creature Collector</h2><span class="fact">arena <b>' + (open ? "OPEN" : "closed") + "</b></span></div>" +
    '<div class="row" style="margin-bottom:12px;"><div class="field"><label for="collStart">Counting XP since</label><input id="collStart" type="date" value="' + esc(cls.collectorStart || "") + '"></div>' +
    '<button class="btn ghost" data-act="saveCollStart">Save</button>' +
    '<div class="field"><label for="arenaOv">Battle arena</label><select id="arenaOv">' + opt("auto", "On schedule") + opt("open", "Open now") + opt("closed", "Closed") + "</select></div>" +
    '<label class="modebox" style="margin:0;padding:8px 12px;"><input type="checkbox" id="lunchArenaBox"' + (cls.lunchArena === false ? "" : " checked") + '><span><b>\u2600\uFE0F Lunch arena</b><small>Weekdays 12\u20131 pm for students who already hit 120 XP today</small></span></label></div>' +
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
      "</td><td>" + seenSet(x).size + " / " + CREATURES.length + "</td><td>" + pullsLeft(x, cls) + "</td><td>" + bankXP(x, cls).toLocaleString() + "</td><td>" + legendaryLeft(x) + ' waiting</td><td><div class="row" style="gap:6px;flex-wrap:nowrap;">' +
      '<button class="btn small" data-legend="' + x.id + '" style="background:#E9A91C;color:#3a2500;">\u{1F31F} Send legendary egg</button>' +
      '<button class="btn small" data-bonuspull="' + x.id + '">\u{1F95A} Send free egg</button>' +
      ((Number(x.bonusPulls) || 0) > 0 && pullsLeft(x, cls) > 0 ? '<button class="btn ghost small" data-unbonus="' + x.id + '" title="Take back a free egg that hasn\u2019t been hatched">\u21A9 Take one back</button>' : "") + "</div></td></tr>";
  });
  return h + "</tbody></table></div></div>";
}

function viewRewards() {
  const log = cls.rewardLog || [];
  let h = '<div class="card"><div class="card-head"><h2>\u2B50 Full health \u2014 reward list</h2><span class="fact">from finalized days</span></div>';
  if (!log.length) return h + '<p class="lede">When you finalize a day, everyone whose companion is still at full health shows up here so you can reward them.</p></div>';
  const show = busy.rewardsAll ? log : log.slice(0, 3);
  show.forEach((r, i) => {
    const done = r.rewarded || [], left = r.students.filter(x => !done.includes(x.id)).length;
    const when = new Date(r.date + "T12:00:00").toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
    h += '<div style="margin-top:' + (i ? 16 : 0) + 'px;"><div class="row" style="justify-content:space-between;align-items:center;margin-bottom:6px;">' +
      "<h3>" + esc(when) + ' <span class="muted">\u00b7 ' + r.students.length + " at full health" + (r.students.length ? " \u00b7 " + left + " to reward" : "") + "</span></h3>" +
      (r.students.length ? '<button class="btn ghost small" data-copyreward="' + i + '">Copy names</button>' : "") + "</div>";
    if (!r.students.length) h += '<p class="lede" style="font-size:13.5px;">Nobody was at full health this day.</p>';
    else h += '<div class="inv">' + r.students.map(x => {
      const on = done.includes(x.id), st = sOf(x.id), c = st && companionOf(st);
      return '<label style="display:inline-flex;align-items:center;gap:6px;background:var(--panel-2);border:1px solid var(--line);border-radius:10px;padding:5px 10px;cursor:pointer;' + (on ? "opacity:.55;" : "") + '">' +
        '<input type="checkbox" data-rewarded="' + i + ":" + x.id + '"' + (on ? " checked" : "") + ' style="width:18px;height:18px;">' +
        (c ? c.glyph + " " : "") + "<b>" + esc(x.name) + "</b>" + (on ? ' <small class="muted">rewarded \u2713</small>' : "") + "</label>";
    }).join("") + "</div>";
    h += "</div>";
  });
  if (log.length > 3) h += '<div class="row" style="margin-top:12px;"><button class="btn ghost small" data-act="rewardsAll">' + (busy.rewardsAll ? "Show fewer days" : "Show all " + log.length + " days") + "</button></div>";
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
    .filter(r => r.list.length).sort((a, b) => b.list.length - a.list.length || a.s.name.localeCompare(b.s.name));
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
  let h = '<div class="card"><div class="card-head"><h2>\u{1F36C} Candy Shop purchases</h2><span class="fact">' + rows.length + " total</span></div>" +
    '<p class="lede" style="font-size:13px;margin-bottom:10px;">In the shop now: ' + STORE.map(it => storeArt(it, "gimg") + " " + esc(it.name) + " (" + it.cost + ")").join(" \u00b7 ") + "</p>";
  if (!rows.length) return h + '<p class="lede">No purchases yet.</p></div>';
  h += '<div class="scroll-x"><table class="tbl"><thead><tr><th>When</th><th>Student</th><th>Item</th><th>Candy</th><th></th></tr></thead><tbody>';
  rows.slice(0, 60).forEach(r => {
    const it = byId(STORE, r.p.id);
    const when = r.p.at ? new Date(r.p.at).toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" }) : "";
    h += "<tr><td>" + esc(when) + "</td><td>" + esc(r.s.name) + "</td><td>" + (it ? storeArt(it, "gimg") + " " + esc(it.name) : esc(r.p.id)) + "</td><td>" + (r.p.cost || 0) +
      '</td><td><button class="btn ghost small" data-refund="' + r.s.id + ":" + r.idx + '">Refund</button></td></tr>';
  });
  return h + "</tbody></table></div></div>";
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
  const b = bossState(cls, students);
  return '<div style="margin-top:16px;border-top:1px solid var(--line-2);padding-top:14px;"><h3>\u{1F47B} Ghost-olotl</h3>' +
    '<p class="lede" style="font-size:13.5px;margin:4px 0 10px;">Each day a student hits ' + goalXP(cls) + ' XP earns one attack. Right now: <b>' + b.left.toLocaleString() + " / " + b.max.toLocaleString() +
    "</b> health, " + b.hits + " attack" + (b.hits === 1 ? "" : "s") + " landed.</p>" +
    '<div class="row"><div class="field" style="width:150px;"><label for="gBossHP">Ghost-olotl health</label><input id="gBossHP" type="number" min="10" max="100000" step="10" value="' + b.max + '"></div>' +
    '<div class="field" style="width:150px;"><label for="gBossDmg">Base attack damage</label><input id="gBossDmg" type="number" min="1" max="10000" step="1" value="' + b.dmg + '"></div>' +
    '<button class="btn ghost" data-act="saveBoss">Save</button>' +
    '<button class="btn ghost" data-act="newBoss">' + (busy.confirmBoss ? "Yes \u2014 summon a new one" : "Summon a new Ghost-olotl") + "</button></div>" +
    '<p class="lede" style="font-size:12.5px;margin-top:8px;">A new Ghost-olotl starts at full health. Past attacks don\u2019t count against it.</p>' +
    '<p class="lede" style="font-size:13px;margin-top:8px;">' + (ghostUnlocked(cls)
      ? "\u2705 <b>Unlocked for good:</b> the Witch Hat (5-day streak) and the Ghost-olotl lunch sidekick."
      : "\u{1F512} Defeat the first Ghost-olotl to unlock the <b>Witch Hat</b> (5-day streak) and the <b>Ghost-olotl</b> lunch sidekick. They stay unlocked after Haunt-O-Ween.") + "</p></div>";
}

function viewModes() {
  const on = isHaunt(cls);
  return '<div class="card"><div class="card-head"><h2>\u2728 Special modes</h2><span class="fact">' + (on ? "<b>Haunt-O-Ween is on</b>" : "none on") + "</span></div>" +
    '<label class="modebox"><input type="checkbox" id="hauntBox"' + (on ? " checked" : "") + (busy.hauntAsk ? " disabled" : "") + '><span><b>\u{1F383} Haunt-O-Ween Mode</b>' +
    '<small>Adds candy baskets, the Candy Shop, the Trick or Treat Wheel, Ms. Ariana\u2019s bucket and the \u2694\uFE0F Battle Area with the Ghost-olotl. All the normal rules keep working. ' +
    "Turn it off and all of that is hidden from you and your students.</small></span></label>" +
    (busy.hauntAsk ? '<div class="banner warn" style="margin-top:12px;">Students still have candy from last time. Keep adding to it, or start everyone at 0?' +
      '<div class="row" style="margin-top:8px;"><button class="btn small" data-act="hauntKeep">Keep their candy</button><button class="btn small danger" data-act="hauntFresh">Start fresh at 0</button>' +
      '<button class="btn ghost small" data-act="hauntCancel">Cancel</button></div></div>' : "") +
    (on ? ghostSettings() : "") + "</div>";
}
function viewClassSettings() {
  return '<div class="card"><div class="card-head"><h2>Class settings</h2></div><div class="row">' +
    '<div class="field" style="flex:1;min-width:180px;"><label for="gClass">Class name</label><input id="gClass" type="text" maxlength="48" value="' + esc(cls.className || "") + '"></div>' +
    '<div class="field" style="flex:1;min-width:150px;"><label for="gWeek">Week label</label><input id="gWeek" type="text" maxlength="32" value="' + esc(cls.weekLabel || "") + '"></div>' +
    '<div class="field" style="width:130px;"><label for="gGoal">Daily XP goal</label><input id="gGoal" type="number" min="10" max="2000" step="10" value="' + goalXP(cls) + '"></div>' +
    '<button class="btn ghost" data-act="saveClass">Save</button></div>' +
    '<div class="row" style="margin-top:18px;border-top:1px solid var(--line-2);padding-top:16px;"><button class="btn danger" data-act="newWeek">' +
    (busy.confirmNewWeek ? "Yes — clear the whole week" : "Start a new week") + '</button><span class="lede" style="font-size:13px;">' +
    (busy.confirmNewWeek ? "Clears every day, lunch mark, gear and cape for all " + students.length + " students." + (isHaunt(cls) ? " Candy carries over." : "") : "Students keep their companions and names.") + "</span></div></div>" +
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
export function parsePasted(text) {
  const lines = String(text || "").replace(/\r/g, "").split("\n").map(x => x.replace(/\u00a0/g, " ").trim());
  const out = [];
  lines.forEach((ln, i) => {
    const m = ln.match(/^(\d[\d,]*)\s*\/\s*\d/);          // "291 / 120101" -> 291
    if (!m) return;
    let j = i - 1; while (j >= 0 && !/[A-Za-z]/.test(lines[j])) j--;   // the nearest line above with letters
    if (j < 0) return;
    let name = lines[j];
    PASTE_HEADERS.forEach(hd => { const k = name.lastIndexOf(hd); if (k >= 0 && /^[A-Z]/.test(name.slice(k + hd.length))) name = name.slice(k + hd.length); });
    name = name.replace(/\s+/g, " ").trim();
    if (name && !/^\d/.test(name)) out.push({ name, completed: Number(m[1].replace(/,/g, "")) });
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

async function applyUpload(up) {
  const goal = goalXP(cls), d = up.day;
  const best = {}; let unmatched = [];
  up.rows.forEach(r => {
    const nm = String(r[up.nameKey] || "").trim(); if (!nm) return;
    const xp = Number(String(r[up.xpKey]).replace(/[^0-9.\-]/g, "")) || 0;
    const st = matchStudent(nm);
    if (st) { if (!best[st.id] || xp > best[st.id]) best[st.id] = xp; }
    else unmatched.push({ name: nm, guide: up.guideKey ? String(r[up.guideKey] || "").trim() : "" });
  });
  if (up.guideKey && unmatched.length) {   // mixed-class files: only offer this class's guide
    const tally = {};
    up.rows.forEach(r => { const nm = String(r[up.nameKey] || "").trim(); if (nm && matchStudent(nm)) { const g = String(r[up.guideKey] || "").trim(); tally[g] = (tally[g] || 0) + 1; } });
    const topG = Object.keys(tally).sort((a, b) => tally[b] - tally[a])[0];
    if (topG) unmatched = unmatched.filter(u => u.guide === topG);
  }
  const seenN = {}; unmatched = unmatched.filter(u => { const k = u.name.toLowerCase(); if (seenN[k]) return false; seenN[k] = 1; return true; });

  const batch = writeBatch(db); let hit = 0, matched = 0; const missing = [];
  // A re-upload fully replaces the earlier file of the same kind (lunch or end-of-day) for that day:
  // anyone not in the new file has that day's number cleared. The other kind is left alone.
  const date = dateOfDay(d), key = up.kind === "lunch" ? "l" : "d";
  students.forEach(s => {
    const has = s.id in best, xp = has ? best[s.id] : null, ok = has && xp >= goal;
    if (has) { matched++; if (ok) hit++; } else missing.push(s.name);
    const status = arr5(s.status, ""), early = arr5(s.early, false);
    const hist = Object.assign({}, s.xpHist || {}), day = Object.assign({}, hist[date] || {});
    if (has) day[key] = xp; else delete day[key];
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
    Object.assign(s, data);
    batch.update(studentRef(s.id), data);
  });
  if (up.kind === "day") { const rec = recordedDays(cls); if (!rec[d]) { rec[d] = true; batch.update(classRef, { recorded: rec }); } }
  try { await batch.commit(); } catch (e) { flash("Upload didn’t save — " + (e.code || e.message)); }
  busy.upReport = { kind: up.kind, day: d, file: up.file, matched, hit, missing, unmatched };
  render();
}

document.addEventListener("input", ev => {
  if (ev.target.id === "rosterBox") busy.rosterDraft = ev.target.value;
  if (ev.target.id === "pasteBox") { busy.pasteText = ev.target.value; clearTimeout(busy.pasteT); busy.pasteT = setTimeout(render, 250); }
});
document.addEventListener("change", async ev => {
  const id = ev.target.id;
  if (id === "hauntBox") { await toggleHaunt(); return; }
  if (id === "lunchArenaBox") { const on = ev.target.checked; try { await updateDoc(classRef, { lunchArena: on }); flash("Saved \u2014 lunch arena " + (on ? "on" : "off") + "."); } catch (e) { flash("Couldn\u2019t save \u2014 " + e.code); } return; }
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
    await applyUpload(up);
  } catch (e) { flash(e.message || "Couldn’t read that file."); }
  ev.target.value = "";
});

/* ================= clicks ================= */
document.addEventListener("click", async ev => {
  let el;
  if ((el = ev.target.closest("[data-day]"))) { day = Number(el.dataset.day); render(); return; }
  if ((el = ev.target.closest("[data-ring]"))) {
    const s = sOf(el.dataset.ring), st = arr5(s.status, "");
    st[day] = st[day] === "" ? "c" : st[day] === "c" ? "e" : "";
    return patch(s.id, { status: st });
  }
  if ((el = ev.target.closest("[data-lunch]"))) {
    const s = sOf(el.dataset.lunch), early = arr5(s.early, false), st = arr5(s.status, "");
    early[day] = !early[day];
    if (early[day] && st[day] !== "e") st[day] = "c";
    return patch(s.id, { early, status: st });
  }
  if ((el = ev.target.closest("[data-excuse]"))) {
    const s = sOf(el.dataset.excuse), st = arr5(s.status, "");
    st[day] = st[day] === "e" ? "" : "e";
    return patch(s.id, { status: st });
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
  if ((el = ev.target.closest("[data-unbonus]"))) {
    const x = sOf(el.dataset.unbonus); if (!((Number(x.bonusPulls) || 0) > 0 && pullsLeft(x, cls) > 0)) return;
    await patch(x.id, { bonusPulls: (Number(x.bonusPulls) || 0) - 1 });
    flash("Saved \u2014 took back one free egg from " + x.name + "."); return;
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
    const txt = r.students.map(x => x.name).join("\n");
    try { await navigator.clipboard.writeText(txt); el.textContent = "Copied!"; setTimeout(render, 1400); } catch (e) { prompt("Copy these names:", txt); }
    return;
  }
  if ((el = ev.target.closest("[data-ordered]"))) {
    const [sid, idx] = el.dataset.ordered.split(":"); const s = sOf(sid);
    const log = (s.spinLog || []).map(x => Object.assign({}, x)); if (!log[idx]) return;
    log[idx].ordered = !log[idx].ordered;
    return patch(sid, { spinLog: log });
  }
  if ((el = ev.target.closest("[data-refund]"))) {
    const [sid, idx] = el.dataset.refund.split(":"); const s = sOf(sid);
    const purchases = (s.purchases || []).slice(); const [p] = purchases.splice(Number(idx), 1);
    if (!p) return;
    const data = { purchases, candySpent: Math.max(0, (Number(s.candySpent) || 0) - (p.cost || 0)) };
    const dec = k => Math.max(0, (Number(s[k]) || 0) - 1);
    if (p.id === "witchhat") { data.witchHat = false; if (s.equipped === "witch") data.equipped = null; }
    if (p.id === "brew") data.brews = dec("brews");
    if (p.id === "attack") data.extraAttacks = dec("extraAttacks");
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
      await updateDoc(classRef, { bossHP: Math.max(10, Math.floor(Number(document.getElementById("gBossHP").value) || 6500)),
        bossDmg: Math.max(1, Math.floor(Number(document.getElementById("gBossDmg").value) || 50)) });
      flash("Saved the Ghost-olotl.");
    } catch (e) { flash("Couldn’t save — " + e.code); }
    return;
  }
  if (act === "newBoss") {
    if (!busy.confirmBoss) { busy.confirmBoss = true; render(); return; }
    busy.confirmBoss = false;
    try { await updateDoc(classRef, { bossBase: bossState(cls, students).total, bossBaseHits: bossState(cls, students).totalHits, bossHealed: 0 }); flash("Saved — a new Ghost-olotl appears!"); } catch (e) { flash("Couldn’t summon — " + e.code); }
    return;
  }
  if (act === "saveClass") {
    try {
      await updateDoc(classRef, { className: document.getElementById("gClass").value.trim(), weekLabel: document.getElementById("gWeek").value.trim(),
        goal: Math.max(10, Math.min(2000, Math.floor(Number(document.getElementById("gGoal").value) || 120))) });
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
    await applyUpload(up); return;
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
  if (act === "saveCollStart") { try { await updateDoc(classRef, { collectorStart: document.getElementById("collStart").value || null }); flash("Saved the collector start date."); } catch (e) { flash("Couldn\u2019t save \u2014 " + e.code); } return; }
  if (act === "rewardsAll") { busy.rewardsAll = !busy.rewardsAll; render(); return; }
  if (act === "finalize") { busy.finalize = day; render(); return; }
  if (act === "finalizeCancel") { busy.finalize = null; render(); return; }
  if (act === "finalizeOk") {
    const d = day, f = finalizePreview(cls, students, d);
    busy.finalize = null;
    const rec = recordedDays(cls); rec[d] = true;
    const fin = arr5(cls.finalized, false); fin[d] = true;
    const amt = arr5(cls.finalAmt, 0); amt[d] = f.candy;
    const died = arr5(cls.finalDied, null).map(x => x || []); died[d] = f.died.map(x => x.id);
    const batch = writeBatch(db);
    const date = dateOfDay(d);
    const rewards = (cls.rewardLog || []).filter(r => !(r.date === date && r.day === d));
    rewards.unshift({ date, day: d, week: cls.weekLabel || "", students: f.full.map(x => ({ id: x.id, name: x.name })), rewarded: [] });
    batch.update(classRef, { recorded: rec, finalized: fin, finalAmt: amt, finalDied: died.map(x => x.join(",")),
      bucketEarned: (Number(cls.bucketEarned) || 0) + f.candy, rewardLog: rewards.slice(0, 60) });
    f.died.forEach(x => batch.update(studentRef(x.id), { deaths: (x.deaths || []).concat([{ date, day: d, week: cls.weekLabel || "" }]) }));
    try { await batch.commit(); flash("Saved \u2014 " + DAYS[d] + " is finalized." + (f.candy ? " +" + f.candy + " candy for Ms. Ariana!" : "")); } catch (e) { flash("Couldn\u2019t finalize \u2014 " + e.code); }
    return;
  }
  if (act === "unfinalize") {
    const d = day;
    const fin = arr5(cls.finalized, false); fin[d] = false;
    const amt = arr5(cls.finalAmt, 0), back = Number(amt[d]) || 0; amt[d] = 0;
    const diedStr = arr5(cls.finalDied, ""), ids = String(diedStr[d] || "").split(",").filter(Boolean); diedStr[d] = "";
    const batch = writeBatch(db);
    const date = dateOfDay(d);
    batch.update(classRef, { finalized: fin, finalAmt: amt, finalDied: diedStr, bucketEarned: Math.max(0, (Number(cls.bucketEarned) || 0) - back),
      rewardLog: (cls.rewardLog || []).filter(r => !(r.date === date && r.day === d)) });
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
    if (candy <= 0) { flash("Type how much candy to spend."); return; }
    candy = Math.min(candy, k.left);
    const room = b.max - b.left;                      // health it can still regain
    const heal = Math.min(candy * k.rate, room);
    if (heal <= 0) { flash("The Ghost-olotl is already at full health."); return; }
    const used = Math.ceil(heal / k.rate);
    try { await updateDoc(classRef, { bossHealed: (Number(cls.bossHealed) || 0) + heal, bucketSpent: (Number(cls.bucketSpent) || 0) + used }); flash("Saved \u2014 the Ghost-olotl healed " + heal + "!"); }
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
    batch.update(classRef, { recorded: five(false), finalized: five(false), finalAmt: five(0), finalDied: five("") });
    const haunt = isHaunt(cls);
    students.forEach(s => batch.update(studentRef(s.id), { status: five(""), xp: five(null), lunchXp: five(null), early: five(false), items: [], equipped: null,
      attacks: five(false), candyBank: (Number(s.candyBank) || 0) + (haunt ? weekCandy(s) : 0) }));
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
