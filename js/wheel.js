/* ---------- 🎡 Spin to Pick (Nov 13, from Ms. Ariana's name_picker_wheel.html) ----------
   Ms. Ariana spins from the console; the wheel pops up on EVERY student's screen (a full-screen layer) until she closes it.
   Who is on the wheel comes from the XP the Keep already has:
     🎁 120 XP spin: everyone who reached the daily goal (120) AND closed their required rings on that day
        (the school day before by default, or today). Challenge Mode: 1 slice + 1 more for every full 10 XP over 120.
     🏆 Weekly spin: everyone who reached the weekly goal (600 unless she changes it; a personal weekly goal counts)
        AND closed their weekly rings, for last week (she usually spins on Monday) or this week.
     🦆 "Dress the duck": same wheels, but no prize, the winner just gets to dress the duck.
   The student it lands on picks a prize from that wheel's list (spinPrizes, kept by the teacher). The pick is saved on the
   winner's own doc as a spinLog entry { id: "prize", src: "wheel", wp, prizeName, link, kind, ws, at } and wsPick = the spin id,
   so it shows on the console's Prize winners list to order.
   Saved on the class (teacher only): wspin = { id, kind, duck, label, names: [{ i, n }], slices: [name index], win, extra, at, open }
   and wsGoal (the weekly number). The wheel draws in its own layer (#wsroot), so page redraws never interrupt the spin. */
import { esc, weekKey } from "./game.js?v=20261113k";
import { addDays, histWeekTotal, subReq, subRuleOn, ringPass, mondayOf, ringDay, SUB_REQ } from "./doors.js?v=20261113k";
import { getSpinPrizes } from "./db.js?v=20261113k";

const COLORS = ["#F2545B", "#F4B942", "#2EC4B6", "#7B61FF", "#06D6A0", "#3A86FF"];
export const WS_DAILY = 120, WS_WEEKLY = 600, SPIN_MS = 4200;

/* ----- who is on the wheel ----- */
const dayTotal = (st, date) => { const h = (((st && st.xpHist) || {})[date]) || {}; return Math.round(Math.max(Number(h.d) || 0, Number(h.l) || 0)); };
function dayRingsOk(st, cls, date) {
  if (!subRuleOn(cls) || ringPass(st, cls, mondayOf(date))) return true;
  const h = (((st && st.xpHist) || {})[date]) || {}, rd = ringDay(st, cls);
  return subReq(st, cls, mondayOf(date)).rows.every(r => (Number((h.sub || {})[r.src]) || 0) >= r.ks.length * rd);
}
export function dailyPool(students, cls, date) {
  const goal = (cls && Number(cls.goal)) || WS_DAILY;
  return students.filter(x => x && !x.isTeacher && x.companionId).map(x => ({ x, xp: dayTotal(x, date) })).filter(r => r.xp >= goal && dayRingsOk(r.x, cls, date));
}
export function weeklyPool(students, cls, wk, goal) {
  goal = Number(goal) || WS_WEEKLY;
  return students.filter(x => x && !x.isTeacher && x.companionId).map(x => ({ x, xp: Math.round(histWeekTotal(x, wk)) }))
    .filter(r => r.xp >= (Number(r.x.wkGoal) > 0 ? Number(r.x.wkGoal) : goal) && (!subRuleOn(cls) || ringPass(r.x, cls, wk) || subReq(r.x, cls, wk).ok));
}
// The slices: one each, or Challenge Mode (daily only): 1 + one per full 10 XP over 120
export function makeSpin(pool, opts) {
  const names = pool.map(r => ({ i: r.x.id, n: String(r.x.name || "?").slice(0, 24) })), slices = [];
  pool.forEach((r, k) => { const c = opts.challenge && opts.kind === "daily" ? 1 + Math.max(0, Math.floor((r.xp - WS_DAILY) / 10)) : 1; for (let j = 0; j < c; j++) slices.push(k); });
  return { id: "w" + Date.now().toString(36), kind: opts.kind, duck: !!opts.duck, label: opts.label || "", names, slices,
    win: Math.floor(Math.random() * slices.length), extra: 5 + Math.floor(Math.random() * 3), at: new Date().toISOString(), open: true };
}
export const winnerOf = w => (w && w.names && w.slices ? w.names[w.slices[w.win]] : null) || null;

/* ----- the layer ----- */
let S = null, root = null, lastH = "", prizes = null, prizesFor = null, pickBusy = false, choose = null;
const titleOf = w => w.duck ? "\u{1F986} Who gets to dress the duck?" : w.kind === "weekly" ? "\u{1F3C6} Weekly Prize Spin!" : "\u{1F381} 120 XP Prize Spin!";
function drawWheel(cv, w, rot) {
  const ctx = cv.getContext("2d"), cx = cv.width / 2, cy = cv.height / 2, R = cv.width / 2 - 6, n = w.slices.length, arc = Math.PI * 2 / n;
  ctx.clearRect(0, 0, cv.width, cv.height); ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
  for (let i = 0; i < n; i++) {
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R, i * arc, i * arc + arc); ctx.closePath(); ctx.fillStyle = COLORS[i % COLORS.length]; ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = 2; ctx.stroke();
    ctx.save(); ctx.rotate(i * arc + arc / 2); ctx.textAlign = "right"; ctx.fillStyle = "#fff";
    const fs = n > 24 ? 14 : n > 16 ? 17 : n > 10 ? 21 : 26; ctx.font = "600 " + fs + "px Fredoka, Nunito, sans-serif";
    let label = w.names[w.slices[i]].n; const mx = n > 16 ? 10 : 14; if (label.length > mx) label = label.slice(0, mx - 1) + "…";
    ctx.fillText(label, R - 20, fs / 3); ctx.restore();
  }
  ctx.restore();
}
function finalRot(w) {
  const n = w.slices.length, arc = Math.PI * 2 / n, c = w.win * arc + arc / 2;
  let t = (-Math.PI / 2 - c) % (Math.PI * 2); if (t < 0) t += Math.PI * 2;
  return t + w.extra * Math.PI * 2;
}
const easeOut = t => 1 - Math.pow(1 - t, 5);
function build(w) {
  if (!root) { root = document.createElement("div"); root.id = "wsroot"; document.body.appendChild(root); }
  lastH = "";
  root.innerHTML = '<div class="wsbox"><h2 class="wstitle">' + esc(titleOf(w)) + "</h2>" + (w.label ? '<p class="wslabel">' + esc(w.label) + "</p>" : "") +
    '<div class="wswrap"><div class="wspointer"></div><canvas width="640" height="640"></canvas><div class="wshub"></div></div><div class="wsbottom"></div></div>';
  const cv = root.querySelector("canvas"), end = finalRot(w), late = Date.now() - Date.parse(w.at) > 20000;
  if (late || w.slices.length < 2) { drawWheel(cv, w, end); landed(); return; }
  const t0 = performance.now();
  const step = now => { if (!S || S.w.id !== w.id) return; const t = Math.min(1, (now - t0) / SPIN_MS); drawWheel(cv, w, end * easeOut(t)); if (t < 1) requestAnimationFrame(step); else landed(); };
  requestAnimationFrame(step); paintBottom();
}
function landed() { if (!S) return; S.done = true; paintBottom(); if (S.isWinner && !S.w.duck) loadPrizes(); }
async function loadPrizes() {
  if (prizesFor === S.w.id) return; prizesFor = S.w.id;
  try { prizes = await getSpinPrizes(); } catch (e) { prizes = []; }
  paintBottom();
}
function paintBottom() {
  if (!S || !root) return; const b = root.querySelector(".wsbottom"); if (!b) return;
  const w = S.w, win = winnerOf(w), name = win ? win.n : "?";
  let h = "";
  if (!S.done) h = '<p class="wswait">\u{1F3B6} Spinning…</p>';
  else {
    h = '<div class="wswinner"><span>' + (S.isWinner ? "\u{1F389} It’s YOU!" : "\u{1F389} It landed on") + "</span><b>" + esc(name) + "</b></div>";
    if (w.duck) h += '<p class="wsmsg">\u{1F986} ' + (S.isWinner ? "You get to dress the duck!" : esc(name) + " gets to dress the duck!") + "</p>";
    else if (S.isWinner) {
      const set = w.kind === "weekly" ? "weekly" : "daily", picked = S.picked || (S.me && S.me.wsPick === w.id);
      if (picked) h += '<p class="wsmsg">✅ You picked <b>' + esc(S.pickedName || "your prize") + "</b>! Ms. Ariana will order it for you.</p>";
      else if (S.preview) h += '<p class="wsmsg">(Preview: the winner picks a prize here.)</p>';
      else if (!prizes) h += '<p class="wsmsg">Loading the prizes…</p>';
      else {
        const list = prizes.filter(p => (p.set || "daily") === set);
        if (!list.length) h += '<p class="wsmsg">Ms. Ariana will help you pick your prize!</p>';
        else if (choose) { const p = list.find(x => x.id === choose);
          h += '<div class="wsconfirm">' + (p && p.img ? '<img src="' + esc(p.img) + '" alt="">' : "") + "<p>Pick <b>" + esc((p && p.name) || "this prize") + "</b>?</p>" +
            '<div class="row" style="gap:10px;justify-content:center;"><button class="btn gold" data-wsyes="1"' + (pickBusy ? " disabled" : "") + '>✅ Yes, I want this one!</button><button class="btn ghost" data-wsno="1">Go back</button></div></div>'; }
        else h += '<p class="wsmsg">Pick your prize! Tap the one you want.</p><div class="wsprizes">' + list.map(p => '<button class="wsprize" data-wspick="' + esc(p.id) + '">' +
          (p.img ? '<img src="' + esc(p.img) + '" alt="">' : '<span class="wsnoimg">\u{1F381}</span>') + (p.name ? "<b>" + esc(p.name) + "</b>" : "") + "</button>").join("") + "</div>";
      }
    } else if (S.teacher) {
      const st = (S.students || []).find(x => x.id === (win && win.i)), e = st && (st.spinLog || []).slice().reverse().find(x => x.src === "wheel" && x.ws === w.id);
      h += '<p class="wsmsg">' + (e ? "✅ " + esc(name) + " picked <b>" + esc(e.prizeName || "a prize") + "</b>. It’s on your Prize winners list." : "\u{1F381} " + esc(name) + " is picking a prize…") + "</p>";
    } else h += '<p class="wsmsg">\u{1F381} ' + esc(name) + " gets to pick a prize!</p>";
  }
  if (S.teacher) h += '<button class="btn wsclose" data-wsclose="1">✖ Close it on everyone’s screen</button>';
  if (h !== lastH || !b.innerHTML) { b.innerHTML = h; lastH = h; }
}
if (typeof document !== "undefined") document.addEventListener("click", async ev => {
  const t = ev.target.closest && ev.target.closest("[data-wspick],[data-wsyes],[data-wsno],[data-wsclose]"); if (!t || !S) return;
  if (t.dataset.wsclose) { if (S.close) S.close(); return; }
  if (t.dataset.wspick) { choose = t.dataset.wspick; paintBottom(); return; }
  if (t.dataset.wsno) { choose = null; paintBottom(); return; }
  if (t.dataset.wsyes && !pickBusy && S.save && S.me) {
    const p = (prizes || []).find(x => x.id === choose); if (!p) return;
    pickBusy = true; paintBottom();
    const e = { id: "prize", src: "wheel", wp: p.id, prizeName: "\u{1F3A1} " + String(p.name || "Wheel prize").slice(0, 60), link: String(p.link || "").slice(0, 500), kind: S.w.kind, ws: S.w.id, at: new Date().toISOString() };
    try { await S.save({ spinLog: (S.me.spinLog || []).concat([e]), wsPick: S.w.id }); S.picked = true; S.pickedName = p.name || "your prize"; choose = null; }
    catch (err) { alert("That didn’t save. Try again, or tell Ms. Ariana."); }
    pickBusy = false; paintBottom();
  }
});

// Called on every redraw of the student page and the console. o = { cls, me (the student, or null), teacher, students, preview, save(data), close() }
export function wheelSync(o) {
  const w = o.cls && o.cls.wspin;
  if (!w || !w.open || !w.slices || !w.slices.length) { if (root) { root.remove(); root = null; } S = null; choose = null; return; }
  const win = winnerOf(w), isWinner = !!(o.me && win && o.me.id === win.i && !o.teacher);
  if (!S || S.w.id !== w.id) { S = { w, done: false, isWinner, me: o.me, teacher: !!o.teacher, students: o.students, preview: !!o.preview, save: o.save, close: o.close }; choose = null; build(w); return; }
  Object.assign(S, { me: o.me, students: o.students, save: o.save, close: o.close, isWinner });
  if (S.done) paintBottom();
}
export const wheelOpen = () => !!S;
