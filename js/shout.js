/* ---------- 📣 Shoutouts (Nov 16, Ms. Ariana) ----------
   A card on the console (Daily tab) that fills itself from the Keep's own data, plus names she adds by hand:
     🌅 Morning: did at least 1 Morning Quest this morning · hit 120 XP + closed their rings (the last school day)
     🌇 Afternoon: hit 120 XP + closed their rings today · ready for or visiting Planet JP today
     Both: opened their Treasure Vault (this week, and last week on a Monday) · on a 120 XP streak of 5+ school days
           · 2+ full weeks in a row of 120 every school day · her own names (with a reason)
   She can untick anyone, then "Show on every screen": a big, slow, read-aloud scrolling list takes over every student's
   screen until she closes it. Saved on the class doc (cls.shout = { id, open, title, groups: [{ ic, t, names: [{ n, w }] }] }),
   which every screen already watches: no new reads. Names shown are display names only (first name + last initial). */
import { esc, simulate, weekKey } from "./game.js?v=20261118h";
import { azToday } from "./collect.js?v=20261118h";
import { addDays, mondayOf } from "./doors.js?v=20261118h";
import { dailyPool } from "./wheel.js?v=20261118h";
import { phase } from "./planet.js?v=20261118h";

const DUCK = "assets/lvlup/duck.webp";
let ctx = {}, root = null, shownId = "", mode = null, off = {}, mDraft = { n: "", w: "" };
const dn = s => String(s.name || s.fullName || "?");
const isSchool = (cls, d) => { const wd = new Date(d + "T12:00:00").getDay(); return wd !== 0 && wd !== 6 && !((cls && cls.offDays) || {})[d]; };
function lastSchoolDay(cls) { let d = azToday(); for (let i = 0; i < 10; i++) { d = addDays(d, -1); if (isSchool(cls, d)) return d; } return d; }
const dayTot = (st, d) => { const h = ((st.xpHist || {})[d]) || {}; return Math.max(Number(h.d) || 0, Number(h.l) || 0); };
// full weeks in a row (counting back from the last finished week) where every school day reached the goal
function fullWeeks(st, cls) {
  const goal = (cls && Number(cls.goal)) || 120; let wk = addDays(weekKey(cls), -7), n = 0;
  for (let i = 0; i < 40; i++, wk = addDays(wk, -7)) {
    const days = [0, 1, 2, 3, 4].map(k => addDays(wk, k)).filter(d => isSchool(cls, d)); if (!days.length) continue;
    if (days.every(d => dayTot(st, d) >= goal)) n++; else break;
  }
  return n;
}
export function shoutGroups(students, cls, when) {
  const kids = (students || []).filter(s => !s.isTeacher && s.companionId), today = azToday(), G = [];
  const add = (key, ic, t, L) => { if (L.length) G.push({ key, ic, t, names: L }); };
  if (when === "am") {
    // Nov 17 (Ms. Ariana): anyone whose morning XP opened Morning Quests counts, even if they haven't played them yet
    add("mq", "\u{1F305}", "Morning Quest heroes", kids.map(s => { const done = Number((s.mqDays || {})[today]) || 0, mo = Number((((s.xpHist || {})[today]) || {}).mo) || 0, open = Math.min(12, Math.floor(mo / 10)); return { s, done, open }; })
      .filter(o => o.done >= 1 || o.open >= 1).map(({ s, done, open }) => ({ id: s.id, n: dn(s), w: done >= 12 ? "finished the whole board!" : open >= 12 ? "unlocked the whole board!" : done >= open ? done + " quest" + (done === 1 ? "" : "s") + " this morning" : "unlocked " + open + " quest" + (open === 1 ? "" : "s") + " this morning" })));
    const d = lastSchoolDay(cls);
    add("120", "\u{1F4AF}", "120 XP + all rings closed (" + new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "long" }) + ")", dailyPool(kids, cls, d).map(r => ({ id: r.x.id, n: dn(r.x), w: r.xp + " XP" })));
  } else {
    // Nov 17 (Ms. Ariana): the afternoon shoutout is only who's heading to Planet JP (no 120 XP list)
    add("pj", "\u{1F680}", "Ready for Planet JP or exploring it now", kids.map(s => { let p = "off"; try { p = phase(s, cls); } catch (e) {} return [s, p]; })
      .filter(([s, p]) => p === "landed" || p === "ready" || p === "go").map(([s, p]) => ({ id: s.id, n: dn(s), w: p === "landed" ? "on Planet JP!" : "tanks full, ready for liftoff!" })));
  }
  const wk = weekKey(cls), lw = addDays(wk, -7), mon = new Date(today + "T12:00:00").getDay() === 1;
  add("vault", "\u{1F48E}", "Opened their Treasure Vault", kids.filter(s => (s.vault || {})[wk] === "open" || (mon && (s.vault || {})[lw] === "open")).map(s => ({ id: s.id, n: dn(s), w: (s.vault || {})[wk] === "open" ? "this week" : "last week" })));
  add("streak", "\u{1F525}", "120 XP streaks (5+ days in a row)", kids.map(s => { let r = 0; try { r = simulate(s, cls).hitRun; } catch (e) {} return [s, r]; }).filter(([s, r]) => r >= 5)
    .sort((a, b) => b[1] - a[1]).map(([s, r]) => ({ id: s.id, n: dn(s), w: r + " days in a row!" })));
  add("weeks", "\u{1F3C6}", "Full weeks in a row (120 every day)", kids.map(s => [s, fullWeeks(s, cls)]).filter(([s, n]) => n >= 2).sort((a, b) => b[1] - a[1]).map(([s, n]) => ({ id: s.id, n: dn(s), w: n + " weeks in a row!" })));
  return G;
}

/* ----- the console card ----- */
export function shoutCard(students, cls, manual) {
  if (!cls) return "";
  const when = mode || (new Date().getHours() < 12 ? "am" : "pm"), G = shoutGroups(students, cls, when), M = manual || [];
  const open = !!(cls.shout && cls.shout.open), names = (students || []).filter(s => !s.isTeacher).map(dn).sort();
  let n = 0; G.forEach(g => g.names.forEach(x => { if (!off[g.key + x.id]) n++; })); n += M.length;
  let h = '<div class="card" id="shoutCard"><div class="card-head"><h2>\u{1F4E3} Shoutouts</h2><span class="fact">' + n + " names" + (open ? " · \u{1F4FA} on every screen" : "") + "</span></div>" +
    '<div class="row" style="gap:6px;margin-bottom:8px;"><button class="btn small' + (when === "am" ? " gold" : " ghost") + '" data-sh="mode:am">\u{1F305} Morning</button><button class="btn small' + (when === "pm" ? " gold" : " ghost") + '" data-sh="mode:pm">\u{1F307} Afternoon</button></div>' +
    '<p class="small muted" style="margin:0 0 6px;">These fill in by themselves. Tap a name to leave it out.</p>';
  h += G.length ? G.map(g => '<div class="sh-g"><b>' + g.ic + " " + esc(g.t) + '</b><div class="tk-chips">' + g.names.map(x => '<button class="tk-chip' + (off[g.key + x.id] ? " offn" : " on") + '" data-sh="tog:' + g.key + x.id + '" title="' + esc(x.w) + '">' + esc(x.n) + "</button>").join("") + "</div></div>").join("")
    : '<p class="small muted">Nobody yet for this one.</p>';
  h += '<div class="sh-g"><b>⭐ Your own shoutouts</b><datalist id="shNames">' + names.map(x => '<option value="' + esc(x) + '">').join("") + "</datalist>" +
    '<div class="row" style="gap:6px;flex-wrap:wrap;margin:6px 0;"><input id="shN" list="shNames" type="text" maxlength="40" placeholder="Name" value="' + esc(mDraft.n) + '" style="flex:1;min-width:140px">' +
    '<input id="shW" type="text" maxlength="80" placeholder="What for? (like “Helped a friend”)" value="' + esc(mDraft.w) + '" style="flex:2;min-width:180px"><button class="btn small" data-sh="madd">+ Add</button></div>' +
    (M.length ? '<div class="tk-chips">' + M.map((x, i) => '<span class="tk-chip on">' + esc(x.n) + (x.w ? " — " + esc(x.w) : "") + ' <button class="tk-x" data-sh="mdel:' + i + '">×</button></span>').join("") + '<button class="btn ghost small" data-sh="mclear">Clear these</button></div>' : "") + "</div>";
  h += '<div class="row" style="gap:8px;margin-top:10px;">' + (open ? '<button class="btn small" data-sh="close">✖ Close it on every screen</button>' : "") +
    '<button class="btn gold" data-sh="show"' + (n ? "" : " disabled") + ">\u{1F4E3} Show on every screen</button></div></div>";
  return h;
}

/* ----- the big scrolling list (every screen) ----- */
function confetti(box) {
  const C = ["#FFC93C", "#FF6FA8", "#5BC8FF", "#7BE07A", "#B07BFF", "#FF8A3D"];
  let h = ""; for (let i = 0; i < 80; i++) h += '<i style="left:' + (Math.random() * 100).toFixed(1) + "%;background:" + C[i % C.length] + ";animation-delay:" + (Math.random() * 3).toFixed(2) + "s;animation-duration:" + (3 + Math.random() * 2.5).toFixed(2) + 's"></i>';
  box.innerHTML = h;
}
function build(S) {
  if (!root) { root = document.createElement("div"); root.id = "shroot"; document.body.appendChild(root); }
  const me = ctx.me, isMe = x => me && (x.id === me.id);
  const rows = []; (S.groups || []).forEach((g, gi) => { rows.push('<div class="sh-head c' + (gi % 6) + '"><span>' + g.ic + "</span>" + esc(g.t) + "</div>");
    g.names.forEach(x => rows.push('<div class="sh-row c' + (gi % 6) + (isMe(x) ? " me" : "") + '"><b>' + esc(String(x.n).toUpperCase()) + "</b>" + (x.w && !/^\d+\s*XP$/i.test(String(x.w)) ? "<i>" + esc(x.w) + "</i>" : "") + (isMe(x) ? "<small>\u{1F31F} That’s YOU!</small>" : "") + "</div>")); });
  const secs = Math.max(14, rows.length * 3.2);   // slow enough to read every name out loud
  root.innerHTML = '<div class="lvconf"></div><div class="sh-top"><img src="' + DUCK + '" alt=""><h1>\u{1F4E3} SHOUTOUTS! \u{1F389}</h1></div>' +
    '<div class="sh-win"><div class="sh-roll" style="animation-duration:' + secs.toFixed(0) + 's">' + rows.join("") + '<div class="sh-end">\u{1F44F} Great job, everyone! \u{1F44F}</div></div></div>' +
    (ctx.teacher ? '<button class="btn sh-close" data-sh="close">✖ Close it on everyone’s screen</button>' : "");
  confetti(root.querySelector(".lvconf"));
  document.body.classList.add("shon");
}
export function setShoutMode(m) { mode = m; off = {}; }   // ☀️/🌇 the guided modes pick morning or afternoon
function close() { if (root) root.remove(); root = null; shownId = ""; document.body.classList.remove("shon"); }
// o = { cls, me, teacher, students, manual, show(payload), close(), saveManual(list), flash, rerender }
export function shoutSync(o) {
  ctx = o || {};
  const S = ctx.cls && ctx.cls.shout;
  if (!S || !S.open || !S.groups || !S.groups.length) { close(); return; }
  const key = S.id + "|" + ((ctx.me && ctx.me.id) || "");
  if (!root || shownId !== key) { shownId = key; build(S); }
}
if (typeof document !== "undefined") {
  document.addEventListener("input", ev => { const t = ev.target; if (!t) return; if (t.id === "shN") mDraft.n = t.value; if (t.id === "shW") mDraft.w = t.value; });
  document.addEventListener("click", async ev => {
    const b = ev.target.closest && ev.target.closest("[data-sh]"); if (!b) return;
    const [a, x] = b.dataset.sh.split(/:(.*)/), M = (ctx.manual || []).slice();
    if (a === "close") { if (ctx.close) ctx.close(); return; }
    if (a === "mode") { mode = x; off = {}; if (ctx.rerender) ctx.rerender(); return; }
    if (a === "tog") { off[x] = !off[x]; if (ctx.rerender) ctx.rerender(); return; }
    if (a === "madd") { const n = String(mDraft.n || "").trim().slice(0, 40); if (!n) { ctx.flash && ctx.flash("Type a name first."); return; }
      M.push({ n, w: String(mDraft.w || "").trim().slice(0, 80) }); mDraft = { n: "", w: "" }; ["shN", "shW"].forEach(i => { const e = document.getElementById(i); if (e) { e.value = ""; e.defaultValue = ""; } }); ctx.saveManual && ctx.saveManual(M); return; }
    if (a === "mdel") { M.splice(Number(x), 1); ctx.saveManual && ctx.saveManual(M); return; }
    if (a === "mclear") { ctx.saveManual && ctx.saveManual([]); return; }
    if (a === "show") {
      const when = mode || (new Date().getHours() < 12 ? "am" : "pm");
      const groups = shoutGroups(ctx.students, ctx.cls, when).map(g => ({ ic: g.ic, t: g.t, names: g.names.filter(y => !off[g.key + y.id]).map(y => ({ id: y.id, n: y.n, w: g.key === "120" ? "" : y.w })) })).filter(g => g.names.length);   // Nov 17: no XP totals on students' screens
      if (M.length) groups.push({ ic: "⭐", t: "Special shoutouts", names: M.map(y => ({ n: y.n, w: y.w })) });
      if (!groups.length) return;
      ctx.show && ctx.show({ id: "sh" + Date.now().toString(36), open: true, at: new Date().toISOString(), groups });
    }
  });
}
