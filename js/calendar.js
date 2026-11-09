/* ---------- 📅 School calendar (Nov 4) ----------
   Ms. Ariana marks school breaks on a month calendar (Settings tab). They're saved in cls.offDays
   ({ "2026-11-25": "Thanksgiving Break" }), the same days-off list the core subjects rule, Secret Students, Ultra goals
   and Bubble's Baby already read, so break days work like weekends everywhere.
   Auto-excuse: when a break day is in the current week, every student who didn't hit the goal that day is marked
   excused (status "e" + xpHist[date].e, so companion health, streaks and the daily count skip it). Those are marked
   xpHist[date].eo ("excused by the calendar"), so un-marking the break puts them back. One write per student, only
   when something changes. */
import { esc, arr5, dateOfDay, hitOn } from "./game.js?v=20261109h";
import { azToday } from "./collect.js?v=20261109h";
import { addDays } from "./doors.js?v=20261109h";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const wd = iso => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d).getDay(); };
const md = iso => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: "short", day: "numeric" }); };
const labelOf = v => (typeof v === "string" && v.trim() ? v : "Day off");

// Breaks as runs of school days with the same name (weekends in between don't split a run)
export function breakRuns(cls) {
  const off = (cls && cls.offDays) || {}, days = Object.keys(off).filter(k => off[k]).sort(), runs = [];
  days.forEach(iso => {
    const r = runs[runs.length - 1];
    if (r && r.label === labelOf(off[iso])) {
      let gap = addDays(r.end, 1), ok = true;
      while (gap < iso) { if (wd(gap) !== 0 && wd(gap) !== 6) { ok = false; break; } gap = addDays(gap, 1); }
      if (ok) { r.end = iso; r.days.push(iso); return; }
    }
    runs.push({ label: labelOf(off[iso]), start: iso, end: iso, days: [iso] });
  });
  return runs;
}

export function calendarCard(cls, busy) {
  const today = azToday(), off = (cls && cls.offDays) || {};
  const m = busy.calMonth || today.slice(0, 7), [y, mo] = m.split("-").map(Number);
  const first = new Date(y, mo - 1, 1), n = new Date(y, mo, 0).getDate();
  const iso = d => y + "-" + String(mo).padStart(2, "0") + "-" + String(d).padStart(2, "0");
  let cells = "";
  for (let i = 0; i < first.getDay(); i++) cells += '<div class="calc blank"></div>';
  let nOff = 0;
  for (let d = 1; d <= n; d++) {
    const k = iso(d), w = wd(k), we = w === 0 || w === 6, isOff = !we && !!off[k]; if (isOff) nOff++;
    cells += we ? '<div class="calc we"><b>' + d + "</b></div>"
      : '<button class="calc' + (isOff ? " off" : "") + (k === today ? " today" : "") + '" data-calday="' + k + '" title="' + (isOff ? "Break: " + esc(labelOf(off[k])) + " (tap to make it a school day)" : "Tap to mark as a break") + '"><b>' + d + "</b>" + (isOff ? "<small>" + esc(labelOf(off[k])) + "</small>" : "") + "</button>";
  }
  const prev = mo === 1 ? (y - 1) + "-12" : y + "-" + String(mo - 1).padStart(2, "0"), next = mo === 12 ? (y + 1) + "-01" : y + "-" + String(mo + 1).padStart(2, "0");
  const runs = breakRuns(cls).filter(r => r.end >= addDays(today, -30));
  return '<div class="card" id="calCard"><div class="card-head"><h2>\u{1F4C5} School calendar</h2><span class="fact">' + (nOff ? nOff + " break day" + (nOff === 1 ? "" : "s") + " in " + MONTHS[mo - 1] : "no breaks in " + MONTHS[mo - 1]) + "</span></div>" +
    '<p class="lede" style="font-size:13.5px;">Tap a school day to mark it as a <b>break</b> (tap again to undo), or add a whole break below. Break days work like weekends for everyone: ' +
    "students who don’t hit " + "the goal are <b>excused automatically</b>, so companions, streaks, the core subjects, Secret Students, Ultra goals and Bubble’s Baby all skip them.</p>" +
    '<div class="calnav"><button class="btn ghost small" data-calmonth="' + prev + '">◀</button><b>' + MONTHS[mo - 1] + " " + y + '</b><button class="btn ghost small" data-calmonth="' + next + '">▶</button>' +
    (m !== today.slice(0, 7) ? '<button class="btn ghost small" data-calmonth="' + today.slice(0, 7) + '">This month</button>' : "") + "</div>" +
    '<div class="calgrid">' + ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(x => '<div class="calh">' + x + "</div>").join("") + cells + "</div>" +
    '<div class="row" style="gap:8px;align-items:flex-end;margin-top:12px;flex-wrap:wrap;"><div class="field"><label for="calName">Break name</label><input id="calName" type="text" maxlength="30" placeholder="Winter Break"></div>' +
    '<div class="field"><label for="calFrom">First day</label><input id="calFrom" type="date"></div><div class="field"><label for="calTo">Last day</label><input id="calTo" type="date"></div>' +
    '<button class="btn" data-act="calAdd">➕ Add break</button></div>' +
    (runs.length ? '<div class="calruns">' + runs.map(r => '<div class="calrun"><span><b>' + esc(r.label) + "</b> · " + md(r.start) + (r.end !== r.start ? " – " + md(r.end) : "") + ' <span class="muted small">(' + r.days.length + " school day" + (r.days.length === 1 ? "" : "s") + ")</span></span>" +
      '<button class="btn ghost small" data-calrm="' + r.start + ":" + r.end + '">Remove</button></div>').join("") + "</div>" : "") + "</div>";
}

// Returns the new offDays map for a click, or null
export function calendarEdit(kind, el, cls) {
  const o = Object.assign({}, (cls && cls.offDays) || {});
  if (kind === "day") { const k = el.dataset.calday; if (o[k]) delete o[k]; else o[k] = "Day off"; return o; }
  if (kind === "rm") { const [a, b] = el.dataset.calrm.split(":"); breakRuns(cls).filter(r => r.start === a && r.end === b).forEach(r => r.days.forEach(d => delete o[d])); return o; }
  if (kind === "add") {
    const name = (document.getElementById("calName").value || "").trim().slice(0, 30) || "Break", a = document.getElementById("calFrom").value, b = document.getElementById("calTo").value || a;
    if (!a) return { err: "Pick the first day of the break." };
    if (b < a) return { err: "The last day has to be on or after the first day." };
    let d = a, n = 0; while (d <= b && n < 120) { if (wd(d) !== 0 && wd(d) !== 6) o[d] = name; d = addDays(d, 1); n++; }
    return o;
  }
  return null;
}

// Student updates for the current week's break days (see the top). [[id, data], ...]
export function autoExcuse(students, cls) {
  const off = (cls && cls.offDays) || {}, out = [];
  students.filter(s => s.companionId).forEach(s => {
    const st = arr5(s.status, ""), hist = s.xpHist || {}, up = {}; let ch = false;
    for (let d = 0; d < 5; d++) {
      const date = dateOfDay(d), h = hist[date] || {};
      if (off[date]) {
        if (st[d] === "" && !hitOn(s, d, cls)) { st[d] = "e"; ch = true; up["xpHist." + date + ".e"] = true; up["xpHist." + date + ".eo"] = true; }
      } else if (h.eo) {
        if (st[d] === "e") { st[d] = ""; ch = true; }
        up["xpHist." + date + ".e"] = null; up["xpHist." + date + ".eo"] = null;   // null = remove (deleteField in the caller)
      }
    }
    if (ch || Object.keys(up).length) { if (ch) up.status = st; out.push([s.id, up]); }
  });
  return out;
}
