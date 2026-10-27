// Battle Ms. Ariana (Oct 20): a student earns one battle with the teacher each week they reach the Weekly Door goal.
// Unused battles carry over. The student asks (tbAsk = when they asked); Ms. Ariana starts it from her console,
// which makes a normal battle invite with tb = the week it uses. A finished battle is written to tbUsed by the
// console (students can't change tbUsed). A battle that's declined or ended by Ms. Ariana/timeout gives the battle back.
import { weekKey, weekDoorState, subReq } from "./doors.js?v=20261027d";
import { TEACHER_ID } from "./collect.js?v=20261027d";
import { esc } from "./game.js?v=20261027d";

export const TB_SINCE = "2026-10-19";   // weeks before this don't count (it started this week)
const LIVE = ["invite", "team", "lead", "fight"];
const vsT = b => b && b.tb && b.a && b.b && (b.a.id === TEACHER_ID || b.b.id === TEACHER_ID);
// "used" = finished, or the student walked out of it
export const tbUsedBy = (st, b) => b.status === "done" || (b.status === "ended" && b.endedBy === st.id);

// Weeks this student reached the Weekly Door goal (this week counts as soon as the door is ready)
export function tbEarned(st, cls) {
  const wd = (st && st.weekDoor) || {}, cur = weekKey(cls);
  const w = Object.keys(wd).filter(k => k >= TB_SINCE && k !== cur && (wd[k] === "open" || (wd[k] === "ready" && subReq(st, cls, k).ok)));
  if (cur >= TB_SINCE && weekDoorState(st, cls) !== "locked") w.push(cur);
  return w.sort();
}
// Weeks not used yet: not in tbUsed, not already in a live battle, not in a finished one the console hasn't saved yet
export function tbLeft(st, cls, battles) {
  const used = new Set((st && st.tbUsed) || []);
  (battles || []).filter(vsT).forEach(b => { if ((b.a.id === st.id || b.b.id === st.id) && (LIVE.includes(b.status) || tbUsedBy(st, b))) used.add(b.tb); });
  return tbEarned(st, cls).filter(w => !used.has(w));
}
export const tbLive = (st, battles) => (battles || []).find(b => vsT(b) && LIVE.includes(b.status) && (b.a.id === st.id || b.b.id === st.id)) || null;

// Student card (Creature Collector tab, above the arena)
export function tbCard(st, cls, battles, tName) {
  const left = tbLeft(st, cls, battles), live = tbLive(st, battles), T = esc(tName || "Ms. Ariana");
  let body;
  if (live) body = live.status === "invite" ? "<b>" + T + " started your battle!</b> Scroll down to the Battle Arena and tap <b>Accept</b>." : "Your battle with " + T + " is going on now. Go get ’em!";
  else if (!left.length) body = "Reach the <b>Weekly Door goal</b> to earn a battle with " + T + "!";
  else if (st.tbAsk) body = '✅ You asked! ' + T + ' will start your battle when she’s ready. <button class="btn ghost small" data-act="tbCancel">Never mind</button>';
  else body = "You earned " + (left.length === 1 ? "a battle" : left.length + " battles") + " with " + T + '! <button class="btn small" data-act="tbAsk">\u{1F34E} Ask for a battle!</button>';
  return '<div class="card tbcard"><div class="card-head"><h2>\u{1F34E} Battle ' + T + '</h2><span class="fact">' + (left.length ? left.length + " earned" : "weekly goal") + '</span></div><p class="lede" style="margin:0;">' + body + "</p></div>";
}

// Teacher console: who's asking, oldest ask first
export function tbRequests(students, cls, battles) {
  return students.filter(st => st.tbAsk && tbLeft(st, cls, battles).length && !tbLive(st, battles))
    .sort((a, b) => String(a.tbAsk).localeCompare(String(b.tbAsk)));
}
export function tbRequestsCard(students, cls, battles, teacherBusy) {
  const req = tbRequests(students, cls, battles), live = students.map(st => [st, tbLive(st, battles)]).filter(x => x[1]);
  const ago = t => { const m = Math.round((Date.now() - new Date(t).getTime()) / 60000); return m < 1 ? "just now" : m < 60 ? m + " min ago" : m < 1440 ? Math.round(m / 60) + " hr ago" : Math.round(m / 1440) + " days ago"; };
  const earned = students.filter(st => tbLeft(st, cls, battles).length && !st.tbAsk && !tbLive(st, battles)).length;
  let h = '<div class="card tbreq"><div class="card-head"><h2>\u{1F34E} Battle requests</h2><span class="fact">' + req.length + " waiting</span></div>" +
    '<p class="lede" style="font-size:13.5px;">Students earn one battle with you each week they reach the Weekly Door goal (unused ones carry over). When they ask, they show up here. Tap <b>Start</b> and they get the challenge on their page.' +
    (earned ? " " + earned + " more student" + (earned === 1 ? " has" : "s have") + " earned one but hasn’t asked yet." : "") + "</p>";
  if (live.length) h += live.map(([st, b]) => '<div class="dcheck"><span class="what">⚔️ <b>' + esc(st.name) + '</b> <span class="muted small">' + (b.status === "invite" ? "challenge sent, waiting for them to accept" : "battling now") + "</span></span></div>").join("");
  h += req.length ? req.map(st => { const n = tbLeft(st, cls, battles).length;
      return '<div class="dcheck"><span class="what"><b>' + esc(st.name) + '</b> <span class="muted small">asked ' + ago(st.tbAsk) + (n > 1 ? " · " + n + " battles earned" : "") + "</span></span>" +
        '<button class="btn small" data-tbstart="' + st.id + '"' + (teacherBusy ? ' disabled title="Finish your battle first"' : "") + ">⚔️ Start</button>" +
        '<button class="btn ghost small" data-tbskip="' + st.id + '">Not now</button></div>'; }).join("")
    : '<p class="muted small">No requests right now.</p>';
  return h + "</div>";
}
// The invite Ms. Ariana sends (battle doc)
export function tbInvite(t, st, cls, battles) {
  const wk = tbLeft(st, cls, battles)[0]; if (!wk) return null;
  return { a: { id: t.id, name: t.name }, b: { id: st.id, name: st.name }, ids: [t.id, st.id], status: "invite", created: new Date().toISOString(), log: [], tb: wk };
}
// Finished battles the console still needs to write into the student's tbUsed: [{ st, wk }]
export function tbToSettle(students, battles) {
  const out = [];
  (battles || []).filter(vsT).forEach(b => { const st = students.find(x => x.id === (b.a.id === TEACHER_ID ? b.b.id : b.a.id));
    if (st && tbUsedBy(st, b) && !(st.tbUsed || []).includes(b.tb)) out.push({ st, wk: b.tb }); });
  return out;
}
