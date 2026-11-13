/* ---------- 🫧 Bubble's Baby (Nov 4) ----------
   Every student raises their own baby axolotl in its own tab (Ms. Ariana turns the tab on and off: cls.axoOn,
   cls.axoFrom = the day she turned it on). The axolotl itself is its own page (axolotl/index.html, art in
   assets/axolotl/) shown in a frame that lives OUTSIDE #app, so the page redrawing never restarts its animations.
   Feeding: once a day, on a day the student hit the class goal (120 XP) AND 25 Math / Reading / Language
   (Ms. Ariana's subject swaps count; swaps that land on the same subject add up). Counted from the XP history,
   so pastes, the live feed, weekend work and late pastes all count, and a day can never feed twice (the save
   keeps how many feeds were used: axo.fed). 1 feed = 1 level; new stage every 10; fully grown at 30.
   Weekly make-up (Nov 4): a week (Mon–Sun) with 600 XP and the week's core subjects (125 each, less on breaks) counts
   EVERY school day of that week as a feed day, so missed days earlier in the week are made up (and don't make it sick).
   Sick: 1 missed school day = slow, 2 = sick. Weekends, school breaks (cls.offDays) and excused days don't count.
   The save is s.axo (private: not on the public card, so classmates' pages don't re-read anything). */
import { azToday } from "./collect.js?v=20261113e";
import { goalXP, arr5, dateOfDay } from "./game.js?v=20261113e";
import { subFor, SUB_NAMES } from "./teams.js?v=20261113e";
import { addDays } from "./doors.js?v=20261113e";
import { subRuleOn, SUB_DAY, SUB_REQ, ringDay, subReq, weekTotal, histWeekTotal, mondayOf, VAULT_MIN, vaultMinOf } from "./doors.js?v=20261113e";
import { weekKey } from "./game.js?v=20261113e";
import { APP_V } from "./game.js?v=20261113e";

export const axoOn = cls => !!(cls && cls.axoOn);
export const axoFrom = cls => (cls && cls.axoFrom) || azToday();
export const isBreak = (cls, iso) => !!((cls && cls.offDays) || {})[iso];
const wd = iso => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d).getDay(); };
export const schoolDayFor = (cls, iso) => { const w = wd(iso); return w >= 1 && w <= 5 && !isBreak(cls, iso); };

// One day's numbers: total XP (history, or this week's box) and the core subjects (merged when swaps share a subject)
export function axoDay(st, cls, iso) {
  const h = ((st && st.xpHist) || {})[iso] || {}, goal = goalXP(cls);
  let xp = Number(h.d != null ? h.d : h.l != null ? h.l : 0) || 0;
  for (let d = 0; d < 5; d++) if (dateOfDay(d) === iso) { const b = Number(arr5(st.xp, null)[d] != null ? arr5(st.xp, null)[d] : arr5(st.lunchXp, null)[d]) || 0; if (b > xp) xp = b; }
  const sub = h.sub || {}, by = {}, rows = [];
  if (subRuleOn(cls)) SUB_REQ.forEach(k => { const src = subFor(cls, st, k);
    const rd = ringDay(st, cls);
    if (by[src]) { by[src].need += rd; return; }
    rows.push(by[src] = { src, name: SUB_NAMES[src] || src, have: Math.round(Number(sub[src]) || 0), need: rd }); });
  const xpOk = xp >= goal || !!h.h || !!h.lh;   // h / lh = marked as a hit by hand
  return { date: iso, xp: Math.round(xp), goal, rows, good: xpOk && rows.every(r => r.have >= r.need), excused: !!h.e };
}
// The week's make-up: 600 XP (Mon–Sun, weekend included) + the week's core subjects
export function axoWeek(st, cls, mon) {
  const xp = Math.max(histWeekTotal(st, mon), mon === weekKey(cls) ? weekTotal(st, cls) : 0), q = subReq(st, cls, mon);
  const need = vaultMinOf(st, cls);
  return { mon, xp: Math.round(xp), need, rows: q.on ? q.rows.map(r => ({ name: r.name, have: r.have, need: r.need })) : [], met: xp >= need && q.ok };
}
function goodFn(st, cls) {
  const wk = {}, met = mon => (wk[mon] != null ? wk[mon] : (wk[mon] = axoWeek(st, cls, mon).met));
  return iso => axoDay(st, cls, iso).good || (schoolDayFor(cls, iso) && met(mondayOf(iso)));
}
// How many feed days since `from` (any day: weekend work counts too; a made-up week counts all its school days)
export function axoGood(st, cls, from) {
  const h = (st && st.xpHist) || {}, today = azToday(), days = new Set(Object.keys(h)), good = goodFn(st, cls);
  for (let d = 0; d < 5; d++) days.add(dateOfDay(d));
  // school days of weeks that might be made up (a week only gets made up if it has some history)
  Object.keys(h).forEach(iso => { const mon = mondayOf(iso); for (let i = 0; i < 5; i++) days.add(addDays(mon, i)); });
  let n = 0; days.forEach(iso => { if (iso >= from && iso <= today && good(iso)) n++; });
  return n;
}
// Missed school days in a row before today (since the last feed day); today only counts once it's a feed day
export function axoHealth(st, cls, from) {
  const today = azToday(), good = goodFn(st, cls); if (good(today)) return "ok";
  let missed = 0, iso = addDays(today, -1);
  for (let i = 0; i < 40 && iso >= from; i++, iso = addDays(iso, -1)) {
    if (!schoolDayFor(cls, iso)) continue;
    const x = axoDay(st, cls, iso);
    if (good(iso)) break;
    if (x.excused) continue;
    missed++; if (missed >= 2) break;
  }
  return missed >= 2 ? "sick" : missed === 1 ? "tired" : "ok";
}
export function axoInfo(st, cls) {
  const a = (st && st.axo) || null, from = (a && a.since) || axoFrom(cls), healthFrom = from > axoFrom(cls) ? from : axoFrom(cls);
  return { state: a, from: axoFrom(cls), good: axoGood(st, cls, from), health: a && a.name ? axoHealth(st, cls, healthFrom) : "ok",
    today: Object.assign(axoDay(st, cls, azToday()), { week: axoWeek(st, cls, mondayOf(azToday())) }), resetAt: Number(st && st.axoReset) || 0 };
}
export const AXO_STAGES = ["Newborn", "Hatchling", "Growing", "Radiant"];
export const axoLevel = a => Math.floor(((a && a.totalXP) || 0) / 3500);
export const axoStage = a => { const l = axoLevel(a); return AXO_STAGES[l >= 30 ? 3 : l >= 20 ? 2 : l >= 10 ? 1 : 0]; };

/* ----- the frame (student page) ----- */
let host = null, frame = null, ready = false, lastSent = "", saveTimer = null, pend = null, ctx = null;
function ensure() {
  if (host) return;
  host = document.createElement("div"); host.id = "axoHost"; host.style.display = "none";
  frame = document.createElement("iframe"); frame.title = "Bubble’s Baby"; frame.setAttribute("scrolling", "no");
  frame.style.cssText = "width:100%;height:640px;border:0;display:block;border-radius:18px;background:transparent;";
  host.appendChild(frame);
  const app = document.getElementById("app"); app.parentNode.insertBefore(host, app.nextSibling);
  window.addEventListener("message", ev => {
    if (!frame || ev.source !== frame.contentWindow || ev.origin !== location.origin) return;
    const d = ev.data || {};
    if (d.type === "ck-ready") { ready = true; lastSent = ""; send(); }
    else if (d.type === "ck-height") { const h = Math.max(300, Math.min(4000, Number(d.h) || 0)); frame.style.height = h + "px"; }
    else if (d.type === "ck-save" && d.state && typeof d.state === "object") {
      pend = d.state;
      if (ctx && ctx.st) ctx.st.axo = pend;   // local copy right away, so the next message has it
      clearTimeout(saveTimer); saveTimer = setTimeout(flush, 1200);   // a burst of saves (feed, toy, reward) = one write
    }
  });
  window.addEventListener("pagehide", flush);
}
function flush() { clearTimeout(saveTimer); if (!pend || !ctx || ctx.preview) { pend = null; return; } const v = pend; pend = null; ctx.save({ axo: v }); }
function send() {
  if (!ready || !frame || !ctx || !ctx.st) return;
  const i = axoInfo(ctx.st, ctx.cls), msg = { type: "ck-data", state: i.state, good: i.good, from: i.from, today: i.today, health: i.health, resetAt: i.resetAt };
  const key = JSON.stringify([i.good, i.from, i.today, i.health, i.resetAt]);
  if (key === lastSent) return; lastSent = key;
  frame.contentWindow.postMessage(msg, location.origin);
}
// Called after every student-page render. show = this tab is open.
export function axoSync(show, st, cls, save, preview) {
  if (!show && !host) return;
  ensure();
  if (st && ctx && ctx.st && ctx.st.id !== st.id) { ready = false; frame.removeAttribute("src"); }   // another student on this computer
  if (st && pend && ctx && ctx.st && ctx.st.id === st.id) st.axo = pend;
  ctx = { st, cls, save, preview };
  host.style.display = show && st ? "" : "none";
  if (show && st && !frame.getAttribute("src")) { ready = false; frame.setAttribute("src", "axolotl/index.html?v=" + APP_V); }
  if (show) send();
}

/* ----- console card (Students tab) ----- */
export function axoAdmin(students, cls, busy, esc) {
  const on = axoOn(cls), kids = students.filter(s => s.companionId);
  let h = '<div class="card" id="axoCard"><div class="card-head"><h2>\u{1FAE7} Bubble’s Baby</h2><span class="fact">' + (on ? "<b>ON</b> since " + esc(axoFrom(cls)) : "off") + "</span></div>" +
    '<p class="lede" style="font-size:13.5px;">Each student raises their own baby axolotl in a <b>\u{1FAE7} Bubble’s Baby</b> tab. It eats once a day when they hit ' + goalXP(cls) + " XP <b>and</b> 25 Math, Reading and Language (your subject swaps count). " +
    "Missed days are made up if they reach " + VAULT_MIN + " XP and their 125s by the end of the week. 1 feed = 1 level, a new growth stage every 10 feeds, fully grown at 30. Then they pick: keep it (a new decoration every 4 feeds) or start a new baby. " +
    "It gets slow after 1 missed school day and sick after 2 (weekends, breaks on the school calendar and excused days don’t count).</p>" +
    '<div class="row" style="margin:10px 0;"><button class="btn' + (on ? " ghost" : "") + '" data-act="axoToggle">' + (on ? "Turn Bubble’s Baby off" : "\u{1FAE7} Turn Bubble’s Baby on") + "</button>" +
    (on ? "" : '<span class="muted small">Feeds count from the day you turn it on.</span>') + "</div>";
  if (!on && !kids.some(s => s.axo && s.axo.name)) return h + "</div>";
  const rows = kids.map(s => { const a = s.axo && s.axo.name ? s.axo : null, i = axoInfo(s, cls), wait = a ? Math.max(0, i.good - (a.fed || 0)) : i.good;
    return "<tr><td><b>" + esc(s.name) + "</b></td><td>" + (a ? esc(a.name) : '<span class="muted">not named yet</span>') + "</td><td>" + (a ? axoStage(a) + " · Lv " + axoLevel(a) : "—") + "</td>" +
      '<td class="eff">' + (wait ? wait + " waiting" : "—") + "</td><td>" + (a ? (i.health === "sick" ? "\u{1F912} sick" : i.health === "tired" ? "\u{1F634} slow" : "\u{1F60A} ok") : "") + "</td><td>" + (((a && a.past) || (s.axo && s.axo.past) || []).length || "") + "</td><td>" +
      (busy.axoAsk === s.id ? '<button class="btn small danger" data-axoreset="' + s.id + '">Yes, start over</button> <button class="btn ghost small" data-axoreset="">No</button>' : '<button class="btn ghost small" data-axoask="' + s.id + '">↺ Start over</button>') + "</td></tr>"; }).join("");
  return h + '<details' + (busy.axoList ? " open" : "") + '><summary data-act="axoList"><b>Everyone’s axolotls</b></summary><div class="scroll-x"><table class="tbl"><thead><tr><th>Student</th><th>Axolotl</th><th>Stage</th><th>Feeds</th><th>Health</th><th>Grown</th><th></th></tr></thead><tbody>' + rows + "</tbody></table></div>" +
    '<p class="muted small">↺ Start over gives that student a brand-new baby (their grown-up axolotls stay in their album).</p></details></div>';
}
