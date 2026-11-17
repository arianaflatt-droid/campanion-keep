/* ---------- ⚠️ XP went down (Nov 16, Ms. Ariana) ----------
   When Timeback lowers a student's XP for a day (for example, XP removed for cheating), the live feeder now lowers that day's
   total AND subject numbers. The console saves what the day USED to be (xpDrop[date] = { d, sub, at }) so Ms. Ariana sees a
   "⚠️ XP went down" card. Nothing is taken away by itself (a Timeback glitch can send low numbers for a few minutes):
   she presses "Take it back" for each student, after seeing exactly what will be removed.
   Taken back (only what that student would NOT have earned with the lower numbers):
     • that day's Daily Doors that the data no longer shows as done (and what was inside them if opened), and the Golden Present
     • that week's Treasure Vault if it no longer qualifies: its Sparkle Legendary egg, Ultra egg, Golden Present, Stardust and
       the real prize on the Prize winners list; the Kingdom treasure for that week
     • regular eggs: eggs come from XP, so the egg count drops by itself; eggs already hatched are taken back by removing the
       newest creatures hatched since that day (not their companion or starter)
   Things worked out from XP fix themselves: streaks, gear, companion health, 120-day spins, event tickets, Kingdom entry. */
import { esc } from "./game.js?v=20261117i";
import { pullsEarned, owned, formOf } from "./collect.js?v=20261117i";
import { doorsFor, dayDoors, doorMet, approved, addDays, mondayOf, vaultMet, vaultGift, subReq, ringDay, REWARD_XP, GOAL_CANDY, DOOR_OPEN_DUST, WEEK_DOOR_DUST, DOOR_DUST } from "./doors.js?v=20261117i";

const DROP_MIN = 3;   // ignore wobbles of 1–2 XP
const SUBN = { m: "Math", f: "Fast Math", r: "Reading", w: "Writing", l: "Language", v: "Vocabulary", sc: "Science", ss: "Social Studies" };
const dayTot = h => Math.round(Math.max(Number((h || {}).d) || 0, Number((h || {}).l) || 0));

// Called by the upload code (live data only) before a day's numbers are overwritten. Returns the new xpDrop map, or null.
export function noteDrop(st, date, oldDay, newDay) {
  if (!oldDay) return null;
  const was = dayTot(oldDay), now = dayTot(newDay), os = oldDay.sub || {}, ns = newDay.sub || {};
  const subDown = Object.keys(os).some(k => ns[k] != null && (Number(os[k]) || 0) - (Number(ns[k]) || 0) >= DROP_MIN);
  if (!(was - now >= DROP_MIN || subDown)) return null;
  const all = Object.assign({}, st.xpDrop || {}), prev = all[date];
  if (prev) return null;   // keep the FIRST (highest) numbers we saw for that day
  all[date] = { d: was, sub: Object.assign({}, os), at: new Date().toISOString() };
  return all;
}
// Drops that are still real (the number didn't come back up)
export function openDrops(st) {
  const out = [];
  Object.entries((st && st.xpDrop) || {}).forEach(([date, o]) => {
    const h = ((st.xpHist || {})[date]) || {}, now = dayTot(h), ns = h.sub || {};
    const subs = Object.keys(o.sub || {}).map(k => [k, Number(o.sub[k]) || 0, Number(ns[k]) || 0]).filter(([k, a, b]) => a - b >= DROP_MIN);
    if (o.d - now >= DROP_MIN) out.push({ date, was: o.d, now, subs });   // only when the TOTAL went down (Nov 16 fix)
  });
  return out.sort((a, b) => a.date < b.date ? -1 : 1);
}

/* ----- what one present gave, undone (the opposite of student.js presentReward) ----- */
function undoPresent(st, r, d, say) {
  if (!r || !r.id) return;
  const num = k => (d[k] != null ? Number(d[k]) : Number(st[k])) || 0, take = (k, n) => { d[k] = Math.max(0, num(k) - n); };
  if (REWARD_XP[r.id]) { take("doorXP", REWARD_XP[r.id]); say.push("+" + REWARD_XP[r.id] + " XP from a present"); }
  if (r.id === "cur20") { take("candyBonus", 20); say.push("20 event candy/corn from a present"); }
  if (GOAL_CANDY[r.id]) { take("candyBonus", GOAL_CANDY[r.id]); say.push(GOAL_CANDY[r.id] + " event candy/corn from a present"); }
  if (r.id === "dust25") { d.__dust = (d.__dust || 0) + DOOR_DUST; say.push(DOOR_DUST + " Stardust from a present"); }
  if (r.id === "brew" || r.id === "g2") { take("brews", 1); say.push("a brew from a present"); }
  if (r.id === "attack") { take("extraAttacks", 1); say.push("an extra attack from a present"); }
  if (r.id === "egg" || r.id === "g3i") { take("doorEggs", 1); say.push("an egg from a present"); }
  if (r.id === "g3") { take("extraAttacks", 1); take("doorEggs", 1); say.push("an extra attack + an egg from a present"); }
  if (r.id === "tegg") { const a = (d.themeEggs || st.themeEggs || []).slice(); if (a.length) { a.pop(); d.themeEggs = a; say.push("a theme egg from a present"); } }
  if (r.id === "g4") { const a = (d.goalEggs || st.goalEggs || []).slice(); if (a.length) { a.pop(); d.goalEggs = a; say.push("a Goal egg from a present"); } }
  if (r.id === "prize") say.push("a Prize Wheel prize from a present");   // its spinLog entry is removed below by date
}

// The full plan for one drop: { say: [what will be taken back], data: the save }
export function takeBackPlan(st, cls, date) {
  const say = [], d = {};
  const doors = JSON.parse(JSON.stringify(st.doors || {})), day = doors[date] || {}, list = doorsFor(cls, date), h = ((st.xpHist || {})[date]) || {};
  let doorsChanged = false, dust = 0;
  // 1) Daily Doors the data no longer shows as done (doors Ms. Ariana approved by hand stay)
  list.forEach((t, i) => {
    const x = day[String(i)]; if (!x || !approved(x.st) || !x.auto) return;
    if (doorMet(t, st, h.sub || {}, dayTot(h), cls) !== false) return;
    say.push("Door " + (i + 1) + (x.st === "open" ? " (opened)" : " (not opened yet)"));
    if (x.st === "open") { undoPresent(st, x.r, d, say); dust += DOOR_OPEN_DUST; }
    delete day[String(i)]; doorsChanged = true;
  });
  if (doorsChanged && day.g) { say.push("the Golden Present for that day"); if (day.g.r) undoPresent(st, day.g.r, d, say); delete day.g; }
  if (doorsChanged) { doors[date] = day; d.doors = doors; }
  // 2) that week's Treasure Vault, if it no longer qualifies
  const wk = mondayOf(date), v = (st.vault || {})[wk];
  if (v === "open" && !vaultGift(st, cls, wk) && !vaultMet(st, cls, wk)) {
    say.push("the Treasure Vault for the week of " + wk);
    d.vault = Object.assign({}, st.vault || {}, { [wk]: "taken" });
    d.vaultLegEggs = Math.max(0, (Number(st.vaultLegEggs) || 0) - 1); say.push("its Sparkle Legendary egg");
    const ul = (st.ultraLog || []).filter(x => x.why === "vault" && String(x.at || "") >= wk);
    if (ul.length) { d.ultraEggs = Math.max(0, (Number(st.ultraEggs) || 0) - 1); say.push("its Ultra egg"); }
    dust += WEEK_DOOR_DUST; say.push(WEEK_DOOR_DUST + " Stardust");
    // eggs from the vault that were already hatched: take back the creature that came out of it
    const coll = Object.assign({}, d.coll || owned(st)), isUltra = f => { const n = Number(String(f).replace("L-", "")); return /^L-/.test(f) && n >= 46 && n <= 62; };
    const newest = test => Object.keys(coll).filter(f => coll[f] && String(coll[f].at || "") >= wk && test(f)).sort((a, b) => String(coll[b].at).localeCompare(String(coll[a].at)))[0];
    if ((Number(st.vaultLegUsed) || 0) > d.vaultLegEggs) { const f = newest(f => /^L-/.test(f) && !isUltra(f)); if (f) { say.push("the Legendary it hatched: " + ((formOf(f, coll[f].lvl || 1) || {}).name || f)); delete coll[f]; d.coll = coll; d.vaultLegUsed = Math.max(0, (Number(st.vaultLegUsed) || 0) - 1); } }
    if (d.ultraEggs != null && (Number(st.ultraUsed) || 0) > d.ultraEggs) { const f = newest(isUltra); if (f) { say.push("the Ultra it hatched: " + ((formOf(f, coll[f].lvl || 1) || {}).name || f)); delete coll[f]; d.coll = coll; d.ultraUsed = Math.max(0, (Number(st.ultraUsed) || 0) - 1); } }
    if (st.weekPresent && st.weekPresent.week === wk) { say.push("its Golden Present"); undoPresent(st, st.weekPresent.r, d, say); d.weekPresent = null; }
    if ((st.weekDoor || {})[wk]) { const w = Object.assign({}, st.weekDoor); delete w[wk]; d.weekDoor = w; }
    if (st.kd && st.kd.g && st.kd.g[wk]) { const kd = JSON.parse(JSON.stringify(st.kd)); delete kd.g[wk]; d.kd = kd; say.push("that week’s Kingdom treasure (and 1 week off their Kingdom rank)"); }
  }
  // the real prizes on the Prize winners list from that day's doors / that week's vault
  const log = st.spinLog || [], keep = log.filter(e => {
    const day0 = String(e.at || "").slice(0, 10);
    if (e.src === "door" && doorsChanged && day0 === date) return false;
    if (e.src === "reward" && d.vault && day0 >= wk && day0 <= addDays(wk, 13)) return false;
    return true; });
  if (keep.length !== log.length) { d.spinLog = keep; say.push((log.length - keep.length) + " prize" + (log.length - keep.length === 1 ? "" : "s") + " from the Prize winners list"); }
  // 🚀 Planet JP: a launch that day needed 120 XP + the core rings. If the lower numbers don't reach that, the launch comes
  // off: the launch count, the day streak (back down by one) and that launch's Stardust bonus. A launch she gave by hand stays.
  let pl = st.planet ? JSON.parse(JSON.stringify(st.planet)) : null, plChanged = false;
  const goal = (cls && Number(cls.goal)) || 120, rd = ringDay(st, cls), q = subReq(st, cls, wk);
  const tanksOk = dayTot(h) >= goal && q.rows.every(r => (Number((h.sub || {})[r.src]) || 0) >= r.ks.length * rd);
  if (pl && (pl.last === date || pl.ls === date) && !tanksOk && st.pjGo !== date) {
    pl.n = Math.max(0, (Number(pl.n) || 0) - 1); pl.streak = Math.max(0, (Number(pl.streak) || 0) - 1);
    if (pl.last === date) pl.last = null; if (pl.ls === date) pl.ls = null;
    const lb = pl.lb && pl.lb.d === date ? pl.lb : null;
    if (lb) { const n = ["s", "x", "w", "dbl"].reduce((a, k) => a + (Number(lb[k]) || 0), 0); dust += n; pl.lb = null; }
    say.push("the Planet JP launch that day (and 1 day off the launch streak)"); plChanged = true;
  }
  // Stardust
  dust += d.__dust || 0; delete d.__dust;
  if (dust && pl) { pl.dust = Math.max(0, (Number(pl.dust) || 0) - dust); plChanged = true; }
  if (plChanged) { pl.sv = (Number(pl.sv) || 0) + 1; d.planet = pl; }
  // 3) regular eggs: earned again from the lower numbers (+ the door eggs taken back above)
  // only what THIS drop took away: eggs earned with the old numbers minus eggs earned with the new ones
  const sim = Object.assign({}, st, d), earned = pullsEarned(sim, cls), used = Number(st.pullsUsed) || 0;
  const old = (st.xpDrop || {})[date], before = old ? pullsEarned(Object.assign({}, st, { xpHist: Object.assign({}, st.xpHist || {}, { [date]: Object.assign({}, h, { d: old.d, l: old.d, sub: Object.assign({}, h.sub || {}, old.sub || {}) }) }) }), cls) : earned;
  let owe = Math.min(used - earned, Math.max(0, before - earned));
  if (owe > 0) {
    const coll = Object.assign({}, d.coll || owned(st)), coll0 = owned(st), from = date + "T00:00";
    const fresh = Object.keys(coll).filter(f => coll[f] && String(coll[f].at || "") >= from && f !== st.petCreature && f !== st.starter && !/^L-/.test(f))
      .sort((a, b) => String(coll[b].at).localeCompare(String(coll[a].at)));
    const gone = fresh.slice(0, owe);
    gone.forEach(f => delete coll[f]);
    if (gone.length) { d.coll = coll; d.pullsUsed = used - gone.length; say.push(gone.length + " hatched creature" + (gone.length === 1 ? "" : "s") + ": " + gone.map(f => (formOf(f, (coll0[f] || {}).lvl || 1) || {}).name || f).join(", ")); }
    owe -= gone.length;
    if (owe > 0) say.push(owe + " egg" + (owe === 1 ? "" : "s") + " owed (their next eggs pay it back)");
  }
  return { say, data: d };
}

/* ----- the console card ----- */
export function dropCard(students, cls) {
  const rows = []; (students || []).filter(s => !s.isTeacher).forEach(s => openDrops(s).forEach(x => rows.push({ s, x })));
  if (!rows.length) return "";
  return '<div class="card" id="dropCard" style="border:2px solid #F2A93B;"><div class="card-head"><h2>⚠️ XP went down</h2><span class="fact">' + rows.length + "</span></div>" +
    '<p class="small muted" style="margin:0 0 8px;">Timeback lowered these numbers (for example, XP taken away). The new numbers are already in. Nothing they earned has been taken back yet: check each one, then press <b>Take it back</b> (or <b>Ignore</b> if it was a mistake).</p>' +
    rows.map(({ s, x }) => {
      const p = takeBackPlan(s, cls, x.date);
      return '<div style="border-top:1px solid var(--line-2);padding:8px 0;"><b>' + esc(s.name) + "</b> · " + new Date(x.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) +
        ' · <span class="bad">' + x.was + " → " + x.now + " XP</span>" + (x.subs.length ? ' <span class="small">(' + x.subs.map(([k, a, b]) => esc(SUBN[k] || k) + " " + a + "→" + b).join(", ") + ")</span>" : "") +
        '<div class="small" style="margin:4px 0;">' + (p.say.length ? "Will take back: " + p.say.map(esc).join(" · ") : "Nothing to take back: they still earned everything with the new numbers.") + "</div>" +
        '<div class="row" style="gap:6px;"><button class="btn small' + (p.say.length ? " gold" : "") + '" data-act="dropTake" data-sid="' + esc(s.id) + '" data-date="' + x.date + '">' + (p.say.length ? "↩️ Take it back" : "✅ OK") + "</button>" +
        '<button class="btn ghost small" data-act="dropIgnore" data-sid="' + esc(s.id) + '" data-date="' + x.date + '">Ignore</button></div></div>';
    }).join("") + "</div>";
}
