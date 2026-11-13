/* ---------- 🦆 Weekly Duck Showdown (Nov 13, Ms. Ariana) ----------
   Her White Ducks vs. Teal Ducks board, built into the Keep. Her own page runs inside a frame (showdown/index.html),
   so her scoring, the bragging ducks and the gulp animation are exactly hers.
   Everything is saved on the class doc, which every screen already watches (so this adds NO reads):
     cls.duckSD = { state: {weekStart, days, showdown, pastWeeks}, show: true|false, playAt: time }
   • Students can open it any time (the 🦆 pill at the top of the page) to see where the classes are.
   • "Show to students" (show:true) takes over every student's screen until the teacher turns it off.
   • Running (or replaying) the showdown sets playAt, and every screen that has it open plays the animation. */
const V = "20261113h";
let root = null, frame = null, ready = false, mode = "", userOpen = false, ctx = {}, sent = "";

export function sdState(cls) { return (cls && cls.duckSD && cls.duckSD.state) || null; }
const DAYS = ["mon", "tue", "wed", "thu", "fri"];
const pct = o => (o && o.present > 0 ? (o.reached / o.present) * 100 : 0);
export function sdWins(st) {
  let a = 0, e = 0; const d = (st && st.days) || {};
  DAYS.forEach(k => { const x = d[k]; if (!x || !x.ariana || !x.erica) return; const pa = pct(x.ariana), pe = pct(x.erica); if (pa > pe) a++; else if (pe > pa) e++; });
  return { a, e };
}
// one line: "White Ducks lead 2–1"
export function sdLine(st) {
  if (!st) return "";
  const s = st.showdown || {};
  if (s.ran) return s.champion === "tie" ? "It’s a truce this week!" : (s.champion === "ariana" ? "White Ducks" : "Teal Ducks") + " won the showdown " + Math.max(s.arianaWins, s.ericaWins) + "–" + Math.min(s.arianaWins, s.ericaWins) + "!";
  const w = sdWins(st);
  return w.a === w.e ? "White Ducks and Teal Ducks are tied " + w.a + "–" + w.e : w.a > w.e ? "White Ducks lead " + w.a + "–" + w.e : "Teal Ducks lead " + w.e + "–" + w.a;
}
// the pill students tap to look any time (only once the teacher has started a board)
export function sdPill(cls) {
  const st = sdState(cls); if (!st) return "";
  return '<button class="sdpill" data-sdopen="1">\u{1F986} <b>Duck Showdown:</b> ' + sdLine(st) + " <span>Watch →</span></button>";
}

function send(force) {
  if (!frame || !ready || !frame.contentWindow) return;
  const d = (ctx.cls && ctx.cls.duckSD) || {}, msg = { ckSD: "state", state: d.state || {}, playAt: Number(d.playAt) || 0, show: !!d.show };
  const key = JSON.stringify(msg); if (!force && key === sent) return; sent = key;
  frame.contentWindow.postMessage(msg, location.origin);
}
function close() { if (root) root.remove(); root = null; frame = null; ready = false; mode = ""; sent = ""; document.body.classList.remove("sdon"); }
function open(m) {
  if (root && mode === m) return;
  close(); mode = m;
  root = document.createElement("div"); root.id = "sdroot";
  root.innerHTML = '<div class="sdbar"><b>\u{1F986} Weekly Duck Showdown</b><span class="sdtag"></span><button class="btn small sdclose" data-sdclose="1">✖ Close</button></div>' +
    '<iframe src="showdown/index.html?v=' + V + "&mode=" + m + '" title="Weekly Duck Showdown"></iframe>';
  frame = root.querySelector("iframe");
  document.body.appendChild(root); document.body.classList.add("sdon");
}
function paintBar() {
  if (!root) return;
  const forced = !ctx.teacher && !!(ctx.cls && ctx.cls.duckSD && ctx.cls.duckSD.show);
  root.querySelector(".sdclose").hidden = forced;
  root.querySelector(".sdtag").textContent = forced ? "\u{1F4FA} Your teacher is showing this to everyone" : ctx.teacher && ctx.cls && ctx.cls.duckSD && ctx.cls.duckSD.show ? "\u{1F4FA} On every student’s screen now" : "";
}
// called from every render (teacher.js and student.js)
export function showdownSync(o) {
  ctx = o || {};
  const d = (ctx.cls && ctx.cls.duckSD) || {};
  const want = ctx.teacher ? userOpen : (!!d.show || userOpen);
  if (!want) { close(); return; }
  open(ctx.teacher ? "teacher" : "student");
  paintBar(); send();
}
export function openShowdown() { userOpen = true; showdownSync(ctx); }
export const showdownOpen = () => !!root;

if (typeof window !== "undefined") {
  window.addEventListener("message", ev => {
    if (ev.origin !== location.origin || !frame || ev.source !== frame.contentWindow) return;
    const m = ev.data || {};
    if (m.ckSD === "ready") { ready = true; send(true); return; }
    if (!ctx.teacher) return;   // only the teacher's frame can change anything
    if (m.ckSD === "save" && ctx.save) ctx.save(m.state, Number(m.playAt) || 0);
    if (m.ckSD === "show" && ctx.setShow) ctx.setShow(!!m.on);
  });
  document.addEventListener("click", ev => {
    const t = ev.target.closest && ev.target.closest("[data-sdopen],[data-sdclose]"); if (!t) return;
    if (t.dataset.sdopen) openShowdown(); else { userOpen = false; showdownSync(ctx); }
  });
}
