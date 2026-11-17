/* ---------- 💡 Level-up shoutout (Nov 15, Ms. Ariana) ----------
   She types who leveled up the day before (name + subject), presses "Show on every screen", and every student's screen
   is taken over by the thinking duck congratulating them, until she closes it.
   Saved on the class doc, which every screen already watches (no new reads):
     cls.lvlup = { id, at, open: true|false, list: [{ n: name, s: subject }] } */
import { esc } from "./game.js?v=20261117m";

export const LV_SUBJECTS = ["Math", "Reading", "Language", "Vocabulary", "Science", "Social Studies", "Writing", "Fast Math"];
const DUCK = "assets/lvlup/duck.webp";
let root = null, shownId = "", ctx = {};
let draft = null;   // the teacher's rows while typing: [{ n, s }]

const same = (a, b) => String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();
const isMe = (row, me) => !!me && (same(row.n, me.name) || same(row.n, me.fullName) || same(String(row.n).split(" ")[0], String(me.name || "").split(" ")[0]) && String(row.n).trim().split(" ").length === 1);

function confetti(box) {
  const C = ["#FFC93C", "#FF6FA8", "#5BC8FF", "#7BE07A", "#B07BFF", "#FF8A3D"];
  let h = ""; for (let i = 0; i < 70; i++) h += '<i style="left:' + (Math.random() * 100).toFixed(1) + "%;background:" + C[i % C.length] + ";animation-delay:" + (Math.random() * 2.5).toFixed(2) + "s;animation-duration:" + (2.6 + Math.random() * 2).toFixed(2) + 's"></i>';
  box.innerHTML = h;
}
function build(L) {
  if (!root) { root = document.createElement("div"); root.id = "lvroot"; document.body.appendChild(root); }
  const me = ctx.me, n = L.list.length;
  // Nov 15 (her video): names roll up through the panel like movie credits, one after another, then start again
  const entry = r => '<div class="lventry' + (isMe(r, me) ? " me" : "") + '"><small>' + (isMe(r, me) ? "\u{1F31F} That\u2019s YOU! Congratulations" : "Congratulations") + "</small>" +
    "<b>" + esc(String(r.n).toUpperCase()) + "!</b>" + (r.s ? '<span class="lvpill">LEVELED UP IN ' + esc(String(r.s).toUpperCase()) + "!</span>" : '<span class="lvpill">LEVELED UP!</span>') +
    "<i>You\u2019re one smart quacker!</i></div>";
  root.innerHTML = '<div class="lvconf"></div><div class="lvbox">' +
    '<div class="lvduckwrap"><span class="lvglow"></span><img class="lvduck" src="' + DUCK + '" alt="A white duck with a light bulb"><span class="lvshadow"></span></div>' +
    '<div class="lvright"><div class="lvpanel"><div class="lvroll" style="animation-duration:' + Math.max(9, n * 5) + 's">' + L.list.map(entry).join("") + "</div></div>" +
    (ctx.teacher ? '<button class="btn lvclose" data-lvclose="1">\u2716 Close it on everyone\u2019s screen</button>' : "") + "</div></div>";
  confetti(root.querySelector(".lvconf"));
  document.body.classList.add("lvon");
}
function close() { if (root) root.remove(); root = null; shownId = ""; document.body.classList.remove("lvon"); }

// called from every redraw (teacher.js and student.js). o = { cls, me, teacher, close() }
export function lvlSync(o) {
  ctx = o || {};
  const L = ctx.cls && ctx.cls.lvlup;
  if (!L || !L.open || !L.list || !L.list.length) { close(); return; }
  const who = (ctx.me && ctx.me.id) || "";
  if (!root || shownId !== L.id + "|" + who) { shownId = L.id + "|" + who; build(L); }   // rebuilt once the student is known, so "That\u2019s YOU" shows
}

// ---------- the teacher's card (console > Daily) ----------
export function lvlCard(cls, students, busy) {
  if (!cls) return "";
  const L = cls.lvlup, on = !!(L && L.open);
  if (!draft) draft = [{ n: "", s: "" }];
  const names = (students || []).filter(x => !x.isTeacher).map(x => x.fullName || x.name);
  const opts = sel => '<option value="">Subject…</option>' + LV_SUBJECTS.map(s => "<option" + (s === sel ? " selected" : "") + ">" + s + "</option>").join("");
  let h = '<div class="card" id="lvCard"><div class="card-head"><h2>\u{1F4A1} Level-up shoutout</h2>' + (on ? '<span class="fact">\u{1F4FA} on every screen now</span>' : L && L.list ? '<span class="fact">last: ' + L.list.length + " student" + (L.list.length === 1 ? "" : "s") + "</span>" : "") + "</div>" +
    '<p class="small muted" style="margin:0 0 8px;">Type who leveled up yesterday and in which subject, then show it. The thinking duck takes over every student’s screen until you close it.</p>' +
    '<datalist id="lvNames">' + names.map(n => '<option value="' + esc(n) + '">').join("") + "</datalist>";
  draft.forEach((r, i) => {
    h += '<div class="row" style="gap:6px;align-items:center;margin-bottom:6px;"><input id="lvN' + i + '" data-lvn="' + i + '" list="lvNames" type="text" maxlength="40" placeholder="Student name" value="' + esc(r.n) + '" style="flex:1;min-width:160px">' +
      '<select id="lvS' + i + '" data-lvs="' + i + '">' + opts(r.s) + "</select>" +
      (draft.length > 1 ? '<button class="wsx" data-lvdel="' + i + '" title="Remove this row">×</button>' : "") + "</div>";
  });
  h += '<div class="row" style="gap:8px;flex-wrap:wrap;margin-top:4px;"><button class="btn ghost small" data-lvadd="1">+ Add a student</button>' +
    (on ? '<button class="btn small" data-lvclose="1">✖ Close it</button>' : "") +
    '<button class="btn gold" data-lvgo="1">\u{1F4A1} Show on every screen</button></div>';
  return h + "</div>";
}

if (typeof document !== "undefined") {
  document.addEventListener("input", ev => {
    const t = ev.target; if (!draft || !t || !t.dataset) return;
    if (t.dataset.lvn != null && draft[+t.dataset.lvn]) draft[+t.dataset.lvn].n = t.value;
  });
  document.addEventListener("change", ev => {
    const t = ev.target; if (!draft || !t || !t.dataset) return;
    if (t.dataset.lvs != null && draft[+t.dataset.lvs]) draft[+t.dataset.lvs].s = t.value;
  });
  document.addEventListener("click", async ev => {
    const t = ev.target.closest && ev.target.closest("[data-lvadd],[data-lvdel],[data-lvgo],[data-lvclose]"); if (!t) return;
    if (t.dataset.lvclose) { if (ctx.close) ctx.close(); return; }
    if (!draft) return;
    if (t.dataset.lvadd) { draft.push({ n: "", s: draft[draft.length - 1].s || "" }); if (ctx.rerender) ctx.rerender(); setTimeout(() => { const x = document.getElementById("lvN" + (draft.length - 1)); if (x) x.focus(); }, 30); return; }
    if (t.dataset.lvdel) { draft.splice(+t.dataset.lvdel, 1); if (ctx.rerender) ctx.rerender(); return; }
    if (t.dataset.lvgo) {
      const list = draft.map(r => ({ n: String(r.n || "").trim().slice(0, 40), s: String(r.s || "").slice(0, 30) })).filter(r => r.n).slice(0, 40);
      if (!list.length) { if (ctx.flash) ctx.flash("Type at least one name first."); return; }
      if (ctx.show) { await ctx.show({ id: "lv" + Date.now().toString(36), at: new Date().toISOString(), open: true, list }); draft = [{ n: "", s: "" }]; if (ctx.rerender) ctx.rerender(); }
    }
  });
}
