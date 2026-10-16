/* ---------- 🏛️ Hall of Fame ----------
   Class records worked out from data the app already saves (nothing extra to store except hofSeen).
   Every record has an all-time plaque (changes only when someone beats it) and, where the data has dates, a "this month" plaque.
   XP records never show how much XP (Ms. Ariana's rule); streaks show how many days.
   Saved on the student: hofSeen = [record keys they've already celebrated]. Just for glory: no rewards. */
import { esc, goalXP } from "./game.js?v=20261016m";
import { azToday, owned, family, formOf } from "./collect.js?v=20261016m";
import { mondayOf } from "./doors.js?v=20261016m";

const inMonth = (date, key) => String(date || "").slice(0, 7) === key;
const isWeekend = date => { const d = new Date(date + "T12:00:00").getDay(); return d === 0 || d === 6; };
const dayVal = x => Math.max(Number(x && x.d) || 0, Number(x && x.l) || 0);
const azDateOf = iso => { try { return azToday(new Date(iso)); } catch (e) { return ""; } };

// School days that have XP saved for anyone (so a day nobody has data for, like a holiday, doesn't break a streak)
function schoolDays(students) {
  const s = new Set();
  students.forEach(st => Object.keys(st.xpHist || {}).forEach(d => { const x = st.xpHist[d] || {}; if (!isWeekend(d) && (x.d != null || x.l != null)) s.add(d); }));
  return [...s].sort();
}
function bestStreak(st, days, goal) {
  const h = st.xpHist || {}; let run = 0, best = 0;
  days.forEach(d => { const x = h[d]; if (x && x.e && dayVal(x) < goal) return; if (x && (x.lh || dayVal(x) >= goal)) { run++; best = Math.max(best, run); } else run = 0; });
  return best;
}
function bestDay(st, key) { let b = 0; Object.keys(st.xpHist || {}).forEach(d => { if (!key || inMonth(d, key)) b = Math.max(b, dayVal(st.xpHist[d])); }); return b; }
function bestWeek(st, key) {
  const wk = {}; Object.keys(st.xpHist || {}).forEach(d => { const m = mondayOf(d); wk[m] = (wk[m] || 0) + dayVal(st.xpHist[d]); });
  return Math.max(0, ...Object.keys(wk).filter(m => !key || inMonth(m, key)).map(m => wk[m]));
}
const sparkles = st => Object.values(owned(st)).filter(e => e && e.sparkle).length;
const famCount = (st, key) => Object.values(owned(st)).filter(e => e && (!key || inMonth(azDateOf(e.at), key))).length;
const kindSent = (st, key) => Object.keys(st.kind || {}).filter(d => !key || inMonth(d, key)).length;
const vaults = (st, key) => Object.keys(st.vault || {}).filter(w => st.vault[w] === "open" && (!key || inMonth(w, key))).length;
const boards = (st, key) => key ? Object.keys(st.mqDays || {}).filter(d => inMonth(d, key) && Number(st.mqDays[d]) >= 12).length : Number(st.mqFull) || 0;

/* The records. val(st, key, ctx) = the student's number (key = "YYYY-MM" for this month, null for all-time).
   month: false = all-time only (the data has no dates). hide: true = don't show the number (XP records). unit = how to show it. */
export const RECORDS = [
  { key: "xpday", group: "xp", icon: "⚡", name: "Biggest XP Day", hide: true, val: (st, k) => bestDay(st, k) },
  { key: "xpweek", group: "xp", icon: "\u{1F680}", name: "Biggest XP Week", hide: true, val: (st, k) => bestWeek(st, k) },
  { key: "streak", group: "xp", icon: "\u{1F525}", name: "Longest 120 XP Streak", unit: n => n + " day" + (n === 1 ? "" : "s") + " in a row", val: (st, k, c) => bestStreak(st, k ? c.days.filter(d => inMonth(d, k)) : c.days, c.goal) },
  { key: "fams", group: "collect", icon: "\u{1F43E}", name: "Most Creatures", monthName: "Most New Creatures", unit: n => n + " creature" + (n === 1 ? "" : "s"), val: (st, k) => famCount(st, k) },
  { key: "sparkle", group: "collect", icon: "✨", name: "Most Sparkles", month: false, unit: n => n + " Sparkle" + (n === 1 ? "" : "s"), val: st => sparkles(st) },
  { key: "attack", group: "event", icon: "⚔️", name: "Top Boss Attacker", month: false, unit: n => n + " attack" + (n === 1 ? "" : "s"), val: st => Number(st.attackTotal) || 0 },
  { key: "vault", group: "event", icon: "\u{1F510}", name: "Most Treasure Vaults", unit: n => n + " vault" + (n === 1 ? "" : "s"), val: (st, k) => vaults(st, k) },
  { key: "kind", group: "kind", icon: "\u{1F48C}", name: "Most Shout-outs Sent", unit: n => n + " shout-out" + (n === 1 ? "" : "s"), val: (st, k) => kindSent(st, k) },
  { key: "pets", group: "kind", icon: "\u{1F49E}", name: "Best Friends (most pets)", month: false, unit: n => n + " pet" + (n === 1 ? "" : "s"), val: st => Number((st.bond || {}).n) || 0 },
  { key: "boards", group: "kind", icon: "\u{1F305}", name: "Most Morning Boards Finished", unit: n => n + " full board" + (n === 1 ? "" : "s"), val: (st, k) => boards(st, k) }
];
const GROUPS = [["xp", "⭐ XP Records"], ["collect", "\u{1F95A} Collector Records"], ["event", "\u{1F3C6} Event Champions"], ["kind", "\u{1F496} Kindness & Care"]];

// Who holds a record: the top value and everyone tied at it (nobody if the top is 0)
export function holders(students, R, key, ctx) {
  let top = 0, who = [];
  students.forEach(st => { const v = R.val(st, key, ctx) || 0; if (v > top) { top = v; who = [st]; } else if (v === top && v > 0) who.push(st); });
  return { top, who: top > 0 ? who : [] };
}
const ctxOf = (students, cls) => ({ days: schoolDays(students), goal: goalXP(cls) });
const kids = students => students.filter(s => s && !s.isTeacher && s.companionId);

// All-time records this student holds that are worth a party (a value, and 3 or fewer people tied)
export function heldRecords(st, students, cls) {
  const list = kids(students), ctx = ctxOf(list, cls);
  return RECORDS.filter(R => { const h = holders(list, R, null, ctx); return h.who.length && h.who.length <= 3 && h.who.some(x => x.id === st.id); }).map(R => R.key);
}
export const newRecords = (st, students, cls) => heldRecords(st, students, cls).filter(k => !(st.hofSeen || []).includes(k));

/* ---------- the tab ---------- */
let view = "all";   // "all" or "month"
const names = (who, me) => { const n = who.slice(0, 3).map(s => (s.id === me ? "<b>⭐ " + esc(s.name) + "</b>" : esc(s.name))).join(", "); return n + (who.length > 3 ? " +" + (who.length - 3) + " more" : ""); };
function plaque(R, h, me, label) {
  const mine = h.who.some(s => s.id === me);
  return '<div class="hofplaque' + (mine ? " mine" : "") + (h.who.length ? "" : " empty") + '"><span class="hofic">' + R.icon + "</span>" +
    '<span class="hofname">' + esc(label || R.name) + "</span>" +
    (h.who.length ? '<span class="hofwho">' + names(h.who, me) + "</span>" + (R.hide ? "" : '<span class="hofval">' + esc(R.unit(h.top)) + "</span>") : '<span class="hofwho muted">Nobody yet — it could be you!</span>') + "</div>";
}
export function hofTab(st, students, cls) {
  const list = kids(students), ctx = ctxOf(list, cls), key = azToday().slice(0, 7), month = view === "month";
  const monthName = new Date(key + "-15T12:00:00").toLocaleString("en-US", { month: "long" });
  let h = '<div class="card hofcard"><div class="card-head"><h2>\u{1F3DB}️ Hall of Fame</h2><span class="fact">class records</span></div>' +
    '<p class="lede">The best of the best in our class! Beat a record and your name goes on the plaque.</p>' +
    '<div class="tabs" style="margin:8px 0;">' + [["all", "\u{1F3C6} All-time"], ["month", "\u{1F4C5} " + monthName]].map(([k, l]) => '<button class="tab' + (view === k ? " on" : "") + '" data-hofview="' + k + '">' + l + "</button>").join("") + "</div>";
  GROUPS.forEach(([g, title]) => {
    const rs = RECORDS.filter(R => R.group === g && (!month || R.month !== false)); if (!rs.length) return;
    h += "<h3 class=\"hofgroup\">" + title + '</h3><div class="hofgrid">' + rs.map(R => plaque(R, holders(list, R, month ? key : null, ctx), st.id, month && R.monthName ? R.monthName : null)).join("") + "</div>";
  });
  // Season Pass champions (everyone who finished a pass) and Legendary discoverers (first to catch each Legendary)
  if (!month) {
    const passes = {}; list.forEach(s => Object.keys(s.pass || {}).forEach(k => { if ((s.pass[k] || []).includes(20)) (passes[k] = passes[k] || []).push(s); }));
    const pk = Object.keys(passes).sort().reverse();
    if (pk.length) h += '<h3 class="hofgroup">\u{1F39F}️ Season Pass Champions</h3><div class="hofgrid">' + pk.map(k => '<div class="hofplaque"><span class="hofic">\u{1F451}</span><span class="hofname">' +
      esc(new Date(k + "-15T12:00:00").toLocaleString("en-US", { month: "long", year: "numeric" })) + '</span><span class="hofwho">' + names(passes[k], st.id) + "</span></div>").join("") + "</div>";
    const first = {}; list.forEach(s => Object.entries(owned(s)).forEach(([fam, e]) => { const f = family(fam); if (!f || f.rarity !== "Legendary" || !e || !e.at) return;
      if (!first[fam] || String(e.at) < String(first[fam].at)) first[fam] = { at: e.at, s }; }));
    const fk = Object.keys(first).sort((a, b) => String(first[a].at).localeCompare(String(first[b].at)));
    if (fk.length) h += '<h3 class="hofgroup">\u{1F48E} Legendary Discoverers <span class="small muted">(first in class to catch each Legendary)</span></h3><div class="hofleg">' + fk.map(fam => { const c = formOf(fam, 1) || {};
      return '<div class="hoflegc' + (first[fam].s.id === st.id ? " mine" : "") + '"><img src="' + esc(c.img || "") + '" alt=""><b>' + esc(c.name || fam) + "</b><small>" + esc(first[fam].s.name) + "</small></div>"; }).join("") + "</div>";
  }
  return h + "</div>";
}

// The "NEW RECORD!" party (shown once per record)
export function hofParty(st, students, cls) {
  const ks = newRecords(st, students, cls); if (!ks.length) return "";
  const rs = RECORDS.filter(R => ks.includes(R.key));
  return '<div class="bparty hofparty" role="dialog" aria-label="New record"><div class="bparty-box"><div class="bparty-rays" aria-hidden="true"></div><div class="hofbig">\u{1F3DB}\uFE0F</div><h2>\u{1F389} NEW RECORD! \u{1F389}</h2><p>You made the <b>Hall of Fame</b> for:</p>' +
    rs.map(R => '<p class="hofnew">' + R.icon + " <b>" + esc(R.name) + "</b></p>").join("") +
    '<button class="btn big" data-hofok="' + esc(ks.join(",")) + '">\u{1F389} Awesome!</button></div></div>';
}
export function hofClick(el) { if (el.dataset.hofview) { view = el.dataset.hofview; return true; } return false; }
