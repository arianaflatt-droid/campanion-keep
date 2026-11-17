/* ---------- 📝 Teacher checklist (Nov 16, Ms. Ariana) ----------
   Only Ms. Ariana sees this (saved in classes/{class}/private/talk, which the rules let only teachers read or write).
   • Students to talk to: pick a student (tap a name or type it) + a reason from her reason bank + an optional note.
     The checklist groups them by reason, most important reason first. She ranks reasons with ▲ ▼.
   • Tests: pick a student + a subject + "New test" or "Testing loop" (how many times). Its own checklist.
   Everything checks off; "Clear checked" removes the done ones. One small save per change. */
import { esc } from "./game.js?v=20261117e";

export const TALK_SUBJECTS = ["Math", "Reading", "Language", "Writing", "Vocabulary", "Science", "Social Studies", "Fast Math"];
let ctx = {}, pick = { sid: "", rid: "", tsid: "", sub: "", kind: "new", n: 2 }, draft = { name: "", note: "", reason: "", tname: "" };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const T = () => { const d = ctx.doc || {}; return { reasons: (d.reasons || []).slice(), items: (d.items || []).slice(), tests: (d.tests || []).slice() }; };
const nameOf = s => s.fullName || s.name || "";
const findKid = txt => { const t = String(txt || "").trim().toLowerCase(); if (!t) return null; const L = ctx.students || [];
  return L.find(s => nameOf(s).toLowerCase() === t) || L.find(s => String(s.name || "").toLowerCase() === t) || L.filter(s => nameOf(s).toLowerCase().startsWith(t)).length === 1 && L.find(s => nameOf(s).toLowerCase().startsWith(t)) || null; };

export function talkCard(students, doc, open) {
  const kids = (students || []).filter(s => !s.isTeacher && s.companionId).slice().sort((a, b) => nameOf(a).localeCompare(nameOf(b)));
  const t = { reasons: (doc && doc.reasons) || [], items: (doc && doc.items) || [], tests: (doc && doc.tests) || [] };
  const left = t.items.filter(x => !x.done).length + t.tests.filter(x => !x.done).length;
  const chips = (key, cur) => '<div class="tk-chips">' + kids.map(s => '<button class="tk-chip' + (cur === s.id ? " on" : "") + '" data-tk="' + key + ":" + esc(s.id) + '">' + esc(String(s.name || nameOf(s))) + "</button>").join("") + "</div>";
  const dl = '<datalist id="tkNames">' + kids.map(s => '<option value="' + esc(nameOf(s)) + '">').join("") + "</datalist>";
  const sel = pick.sid && kids.find(s => s.id === pick.sid), tsel = pick.tsid && kids.find(s => s.id === pick.tsid);
  const reasons = t.reasons.slice().sort((a, b) => (a.r || 0) - (b.r || 0));
  let h = '<div class="card" id="talkCard"><div class="card-head"><h2>\u{1F4DD} My checklist</h2><span class="fact">' + left + " to do</span></div>" +
    '<p class="small muted" style="margin:0 0 8px;">Only you can see this. Students to talk to, and tests to watch.</p>' + dl;
  // ---- talk to
  h += '<div class="tk-sec"><h3>\u{1F5E3}️ Talk to a student</h3>' +
    '<div class="row" style="gap:6px;flex-wrap:wrap;align-items:center;"><input id="tkName" list="tkNames" type="text" placeholder="Type a name, or tap one below" value="' + esc(sel ? nameOf(sel) : draft.name) + '" style="flex:1;min-width:180px">' +
    '<select id="tkReason"><option value="">Why? (pick a reason)…</option>' + reasons.map(r => '<option value="' + r.id + '"' + (pick.rid === r.id ? " selected" : "") + ">" + esc(r.t) + "</option>").join("") + "</select>" +
    '<input id="tkNote" type="text" maxlength="120" placeholder="Note (optional)" value="' + esc(draft.note) + '" style="flex:1;min-width:160px">' +
    '<button class="btn gold small" data-tk="add">+ Add to checklist</button></div>' +
    '<details class="tk-names"' + (open && open.names ? " open" : "") + '><summary class="small" data-tk="tog:names">Tap a name</summary>' + chips("pick", pick.sid) + "</details>";
  // reason bank
  h += '<details class="tk-bank"' + (open && open.bank ? " open" : "") + '><summary class="small" data-tk="tog:bank">\u{1F4DA} Reason bank (' + reasons.length + ") · most important at the top</summary>" +
    '<div class="row" style="gap:6px;margin:6px 0;"><input id="tkNewReason" type="text" maxlength="60" placeholder="Add a reason, like “Missed goal 2 days”" value="' + esc(draft.reason) + '" style="flex:1"><button class="btn small" data-tk="radd">+ Add reason</button></div>' +
    (reasons.length ? '<ol class="tk-rlist">' + reasons.map((r, i) => "<li><span>" + esc(r.t) + "</span>" +
      '<button class="tk-x" data-tk="rup:' + r.id + '"' + (i ? "" : " disabled") + ' title="More important">▲</button><button class="tk-x" data-tk="rdown:' + r.id + '"' + (i < reasons.length - 1 ? "" : " disabled") + ' title="Less important">▼</button>' +
      '<button class="tk-x" data-tk="rdel:' + r.id + '" title="Remove this reason">×</button></li>').join("") + "</ol>" : '<p class="small muted">No reasons yet. Add a few, like “Didn’t reach 120”, “Off task”, “Great job!”.</p>') + "</details>";
  // the checklist, grouped by reason (most important first), then anything with a removed reason
  const groups = reasons.map(r => [r, t.items.filter(x => x.rid === r.id)]).filter(g => g[1].length);
  const other = t.items.filter(x => !reasons.some(r => r.id === x.rid));
  if (other.length) groups.push([{ id: "", t: "Other" }, other]);
  h += groups.length ? groups.map(([r, L]) => '<div class="tk-group"><b>' + esc(r.t) + "</b> <span class=\"small muted\">" + L.filter(x => !x.done).length + " left</span>" +
    L.map(x => '<label class="tk-item' + (x.done ? " done" : "") + '"><input type="checkbox" data-tkc="i:' + x.id + '"' + (x.done ? " checked" : "") + "><span><b>" + esc(x.name) + "</b>" + (x.note ? " — " + esc(x.note) : "") + '</span><button class="tk-x" data-tk="idel:' + x.id + '" title="Remove">×</button></label>').join("") + "</div>").join("")
    : '<p class="small muted" style="margin:6px 0;">Nobody on the list yet.</p>';
  h += "</div>";
  // ---- tests
  const subs = (tsel && tsel.goalSubject && TALK_SUBJECTS.includes(tsel.goalSubject) ? [tsel.goalSubject] : []).concat(TALK_SUBJECTS.filter(x => !(tsel && x === tsel.goalSubject)));
  h += '<div class="tk-sec"><h3>\u{1F4CB} Tests</h3>' +
    '<div class="row" style="gap:6px;flex-wrap:wrap;align-items:center;"><input id="tkTName" list="tkNames" type="text" placeholder="Student" value="' + esc(tsel ? nameOf(tsel) : draft.tname) + '" style="flex:1;min-width:160px">' +
    '<select id="tkSub"><option value="">Subject…</option>' + subs.map(x => "<option" + (pick.sub === x ? " selected" : "") + ">" + esc(x) + "</option>").join("") + "</select>" +
    '<span class="tk-seg"><button class="btn small' + (pick.kind === "new" ? " gold" : " ghost") + '" data-tk="kind:new">\u{1F195} New test</button><button class="btn small' + (pick.kind === "loop" ? " gold" : " ghost") + '" data-tk="kind:loop">\u{1F501} Testing loop</button></span>' +
    (pick.kind === "loop" ? '<label class="small">times <input id="tkN" type="number" min="1" max="20" value="' + pick.n + '" style="width:60px"></label>' : "") +
    '<button class="btn gold small" data-tk="tadd">+ Add test</button></div>' +
    (tsel && tsel.testXp && tsel.testXp.t ? '<p class="small muted" style="margin:4px 0 0;">\u{1F3AF} Now working in: ' + esc(tsel.testXp.t) + (tsel.testXp.left != null ? " (" + tsel.testXp.left + " XP left)" : "") + "</p>" : "") +
    '<details class="tk-names"' + (open && open.tnames ? " open" : "") + '><summary class="small" data-tk="tog:tnames">Tap a name</summary>' + chips("tpick", pick.tsid) + "</details>";
  const tg = TALK_SUBJECTS.map(x => [x, t.tests.filter(y => y.sub === x)]).filter(g => g[1].length);
  h += tg.length ? tg.map(([x, L]) => '<div class="tk-group"><b>' + esc(x) + "</b> <span class=\"small muted\">" + L.filter(y => !y.done).length + " left</span>" +
    L.map(y => '<label class="tk-item' + (y.done ? " done" : "") + '"><input type="checkbox" data-tkc="t:' + y.id + '"' + (y.done ? " checked" : "") + "><span><b>" + esc(y.name) + "</b> — " +
      (y.kind === "loop" ? "\u{1F501} Testing loop ×" + (y.n || 1) : "\u{1F195} New test") + '</span><button class="tk-x" data-tk="tdel:' + y.id + '" title="Remove">×</button></label>').join("") + "</div>").join("")
    : '<p class="small muted" style="margin:6px 0;">No tests on the list yet.</p>';
  h += "</div>";
  if (t.items.some(x => x.done) || t.tests.some(x => x.done)) h += '<div class="row" style="margin-top:8px;"><button class="btn ghost small" data-tk="clear">\u{1F9F9} Clear checked</button></div>';
  return h + "</div>";
}

// o = { doc, students, save(newDoc), flash, rerender, open }
export function talkSync(o) { ctx = o || {}; }
// Nov 17 fix: the new list is kept right away (a second add before the page redraws used the old list and replaced the first),
// and anything empty is dropped so the save can't be refused.
const save = d => { const nd = JSON.parse(JSON.stringify(Object.assign({}, ctx.doc || {}, d))); ctx.doc = nd; if (ctx.save) ctx.save(nd); };
const blank = (...ids) => ids.forEach(i => { const e = document.getElementById(i); if (e) { e.value = ""; e.defaultValue = ""; } });
if (typeof document !== "undefined") {
  document.addEventListener("input", ev => { const t = ev.target; if (!t || !t.id) return;
    if (t.id === "tkName") { draft.name = t.value; const k = findKid(t.value); pick.sid = k ? k.id : ""; }
    if (t.id === "tkNote") draft.note = t.value;
    if (t.id === "tkNewReason") draft.reason = t.value;
    if (t.id === "tkTName") { draft.tname = t.value; const k = findKid(t.value); pick.tsid = k ? k.id : ""; }
    if (t.id === "tkN") pick.n = Math.max(1, Math.min(20, Math.round(Number(t.value) || 1))); });
  document.addEventListener("change", ev => { const t = ev.target; if (!t) return;
    if (t.id === "tkReason") pick.rid = t.value;
    if (t.id === "tkSub") pick.sub = t.value;
    if (t.id === "tkTName" && pick.tsid && ctx.rerender) ctx.rerender();   // shows that student's current course
    if (t.dataset && t.dataset.tkc) { const [k, id] = t.dataset.tkc.split(":"), d = T(), L = k === "i" ? d.items : d.tests, x = L.find(y => y.id === id);
      if (x) { const i = L.indexOf(x); L[i] = Object.assign({}, x, { done: t.checked }); save(k === "i" ? { items: L } : { tests: L }); } } });
  document.addEventListener("click", ev => {
    const b = ev.target.closest && ev.target.closest("[data-tk]"); if (!b) return;
    const [a, x] = b.dataset.tk.split(/:(.*)/), d = T();
    if (a === "tog") { ctx.open = ctx.open || {}; setTimeout(() => { const el = b.closest("details"); if (ctx.open) ctx.open[x] = !!(el && el.open); }, 0); return; }
    if (a === "pick") { pick.sid = pick.sid === x ? "" : x; draft.name = ""; if (ctx.rerender) ctx.rerender(); return; }
    if (a === "tpick") { pick.tsid = pick.tsid === x ? "" : x; draft.tname = ""; pick.sub = ""; if (ctx.rerender) ctx.rerender(); return; }
    if (a === "kind") { pick.kind = x; if (ctx.rerender) ctx.rerender(); return; }
    if (a === "add") {
      const k = (ctx.students || []).find(s => s.id === pick.sid) || findKid(draft.name);
      if (!k) { ctx.flash && ctx.flash("Pick a student first (type the name or tap it)."); return; }
      if (!pick.rid) { ctx.flash && ctx.flash("Pick a reason (add some in the Reason bank)."); return; }
      d.items.push({ id: uid(), sid: k.id, name: String(k.name || nameOf(k)), rid: pick.rid, note: String(draft.note || "").trim().slice(0, 120), done: false, at: new Date().toISOString() });
      pick.sid = ""; draft.name = ""; draft.note = ""; blank("tkName", "tkNote"); save({ items: d.items }); return; }
    if (a === "radd") { const txt = String(draft.reason || "").trim().slice(0, 60); if (!txt) return;
      const r = Math.max(0, ...d.reasons.map(y => y.r || 0)) + 1; d.reasons.push({ id: uid(), t: txt, r }); draft.reason = ""; blank("tkNewReason"); if (ctx.open) ctx.open.bank = true; save({ reasons: d.reasons }); return; }
    if (a === "rup" || a === "rdown") { const L = d.reasons.slice().sort((p, q) => (p.r || 0) - (q.r || 0)), i = L.findIndex(y => y.id === x), j = a === "rup" ? i - 1 : i + 1;
      if (i < 0 || j < 0 || j >= L.length) return; [L[i], L[j]] = [L[j], L[i]]; L.forEach((y, n) => { y.r = n + 1; }); if (ctx.open) ctx.open.bank = true; save({ reasons: L }); return; }
    if (a === "rdel") { if (typeof confirm === "function" && !confirm("Remove this reason from the bank? (Students already on the list stay, under “Other”.)")) return;
      if (ctx.open) ctx.open.bank = true; save({ reasons: d.reasons.filter(y => y.id !== x) }); return; }
    if (a === "idel") { save({ items: d.items.filter(y => y.id !== x) }); return; }
    if (a === "tdel") { save({ tests: d.tests.filter(y => y.id !== x) }); return; }
    if (a === "tadd") {
      const k = (ctx.students || []).find(s => s.id === pick.tsid) || findKid(draft.tname);
      if (!k) { ctx.flash && ctx.flash("Pick a student for the test."); return; }
      if (!pick.sub) { ctx.flash && ctx.flash("Pick the test’s subject."); return; }
      d.tests.push({ id: uid(), sid: k.id, name: String(k.name || nameOf(k)), sub: pick.sub, kind: pick.kind, n: pick.kind === "loop" ? pick.n : 0, done: false, at: new Date().toISOString() });
      pick.tsid = ""; draft.tname = ""; pick.sub = ""; blank("tkTName"); save({ tests: d.tests }); return; }
    if (a === "clear") { save({ items: d.items.filter(y => !y.done), tests: d.tests.filter(y => !y.done) }); return; }
  });
}
