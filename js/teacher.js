import {
  DAYS, SHORT, ROSTER, ITEMS, GEAR, BANNER, byId, esc, arr5, five, recordedDays, goalXP,
  simulate, wornItem, tier, boardDay, sidekickToday, keepHTML, itemArt
} from "./game.js";
import {
  configured, auth, classRef, studentRef, newStudentRef, isTeacherEmail, watchClass, watchStudents,
  teacherSignIn, onAuthStateChanged, signOut, setDoc, updateDoc, deleteDoc, writeBatch, db
} from "./db.js";

/* ================= state ================= */
let user = null, cls = null, clsLoaded = false, students = [], studentsLoaded = false;
let mode = "boot";           // boot | noconfig | signin | denied | setup | guide | class
let day = todayIndex();
const busy = {};
let flashMsg = null, flashTimer = null, flashOk = false;
let unsub = [];

function todayIndex() { const d = new Date().getDay(); return d >= 1 && d <= 5 ? d - 1 : 0; }
function blankStudent(name, order) {
  return { name, order, companionId: null, petName: "", equipped: null, sidekick: "axolotl",
    status: five(""), xp: five(null), lunchXp: five(null), early: five(false), items: [] };
}
function sOf(id) { return students.find(s => s.id === id); }
function flash(msg) { flashMsg = msg; flashOk = /^(Saved|Roster saved|New week)/.test(msg); render(); clearTimeout(flashTimer); flashTimer = setTimeout(() => { flashMsg = null; render(); }, 6000); }
async function patch(id, data) {
  const s = sOf(id); if (s) Object.assign(s, data);
  render();
  try { await updateDoc(studentRef(id), data); } catch (e) { flash("Couldn’t save — " + (e.code || e.message)); }
}
function studentLink(id) {
  const u = new URL("student.html", location.href);
  if (id) u.searchParams.set("s", id);
  return u.toString();
}

/* ================= boot ================= */
if (!configured) { mode = "noconfig"; render(); }
else onAuthStateChanged(auth, u => {
  user = u;
  unsub.forEach(f => f()); unsub = [];
  if (!u || u.isAnonymous) { mode = "signin"; render(); return; }
  if (!isTeacherEmail(u.email)) { mode = "denied"; render(); return; }
  mode = "boot"; render();
  unsub.push(watchClass(c => { cls = c; clsLoaded = true; if (!c) mode = "setup"; else if (mode === "boot" || mode === "setup") mode = "guide"; detectEvents(); render(); },
    e => flash("Couldn’t load the class — " + e.code)));
  unsub.push(watchStudents(list => { students = list; studentsLoaded = true; detectEvents(); render(); },
    e => flash("Couldn’t load students — " + e.code)));
});

/* ================= celebrations (class view) ================= */
let seen = null, partyQueue = [], partyShowing = false;
const popIds = {};
function detectEvents() {
  if (!clsLoaded || !studentsLoaded || !cls) return;
  const bd = boardDay(cls, students);
  const now = {};
  const fresh = [];
  students.forEach(s => {
    if (!s.companionId) return;
    const sim = simulate(s, cls);
    const side = sidekickToday(s, bd);
    const capes = (s.items || []).filter(i => i.id === "cape").length;
    now[s.id] = { unlocked: sim.unlocked.length, side: side ? bd : -1, capes };
    const was = seen && seen[s.id];
    if (!seen || !was) return;
    const c = byId(ROSTER, s.companionId), pet = s.petName || c.name;
    if (now[s.id].unlocked > was.unlocked) fresh.push({ id: s.id, text: pet + " unlocked the " + byId(ITEMS, sim.unlocked[sim.unlocked.length - 1]).name + "!", sub: sim.bestRun + "-day 120 XP streak", glyph: byId(ITEMS, sim.unlocked[sim.unlocked.length - 1]).glyph, pet: c.glyph });
    if (now[s.id].side >= 0 && was.side !== now[s.id].side) fresh.push({ id: s.id, text: pet + "’s " + (side === "duck" ? "duck" : "axolotl") + " came to lunch!", sub: "Hit 120 XP before lunch", glyph: "☀️", pet: c.glyph });
    if (capes > was.capes) fresh.push({ id: s.id, text: pet + " is back thanks to a Hero Cape!", sub: "Welcome back", glyph: "\u{1F9B8}", pet: c.glyph });
  });
  seen = now;
  if (!fresh.length) return;
  fresh.forEach(f => { popIds[f.id] = Date.now(); });
  if (fresh.length <= 3) partyQueue.push(...fresh);
  else partyQueue.push({ text: fresh.length + " companions have news!", sub: "Look for the glowing tiles", glyph: "\u{1F389}", pet: "\u{1F451}" });
  if (!partyShowing) runParty();
}
function runParty() {
  if (!partyQueue.length) { partyShowing = false; return; }
  partyShowing = true;
  const p = partyQueue.shift();
  if (mode !== "class") { partyQueue = []; partyShowing = false; return; }
  const el = document.createElement("div");
  el.className = "party"; el.setAttribute("role", "status");
  el.innerHTML = '<span class="pe" aria-hidden="true">' + p.glyph + '</span><span><span class="pt">' + esc(p.text) +
    '</span><span class="ps">' + esc(p.sub) + '</span></span><span class="pe" aria-hidden="true">' + p.pet + "</span>";
  document.body.appendChild(el);
  confetti();
  setTimeout(() => { el.remove(); setTimeout(runParty, 350); }, 4200);
}
const canvas = document.getElementById("fx"); let ctx = null, raf = null;
function confetti() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  canvas.hidden = false; canvas.width = innerWidth; canvas.height = innerHeight;
  ctx = ctx || canvas.getContext("2d");
  const colors = ["#377F48", "#146A73", "#A87A0C", "#AE3A2A", "#6B5CA5", "#F7B8CE", "#FFD84D"];
  const parts = Array.from({ length: 110 }, () => ({ x: canvas.width * (0.2 + Math.random() * 0.6), y: -20 - Math.random() * canvas.height * 0.3,
    vx: (Math.random() - 0.5) * 3.2, vy: 2 + Math.random() * 3.6, s: 5 + Math.random() * 7, r: Math.random() * 3, vr: (Math.random() - 0.5) * 0.24,
    c: colors[(Math.random() * colors.length) | 0] }));
  if (raf) cancelAnimationFrame(raf);
  let frames = 0;
  (function step() {
    frames++; ctx.clearRect(0, 0, canvas.width, canvas.height); let alive = 0;
    parts.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.045; p.r += p.vr;
      if (p.y < canvas.height + 40) { alive++; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.62); ctx.restore(); } });
    if (alive && frames < 420) raf = requestAnimationFrame(step); else { ctx.clearRect(0, 0, canvas.width, canvas.height); canvas.hidden = true; }
  })();
}

/* ================= render ================= */
const app = document.getElementById("app");
function render() {
  document.getElementById("wrap").className = mode === "class" ? "wrap wide" : "wrap";
  document.getElementById("pageTitle").textContent = mode === "class" ? "The Keep" : "Companion Keep Console";
  document.getElementById("eyebrow").textContent = mode === "class" ? ((cls && cls.weekLabel) || "This week")
    : (cls && cls.className ? cls.className + (cls.weekLabel ? "  ·  " + cls.weekLabel : "") : "Teacher console");
  document.getElementById("rulesCard").hidden = mode !== "guide";

  let top = "";
  if (mode === "guide") top = '<button class="btn small" data-act="classView">Class view</button><button class="btn ghost small" data-act="signOut">Sign out</button>';
  else if (mode === "class") top = '<button class="btn ghost small" data-act="testParty">Test celebration</button><button class="btn ghost small" data-act="backConsole">Back to console</button>';
  document.getElementById("topActions").innerHTML = top;

  let h = flashMsg ? '<div class="banner ' + (flashOk ? "info" : "bad") + '">' + esc(flashMsg) + "</div>" : "";
  if (mode === "boot") h += '<div class="card"><p class="lede">Connecting to your class…</p></div>';
  else if (mode === "noconfig") h += '<div class="card"><h2>Almost there</h2><p class="lede" style="margin-top:8px;">Paste your Firebase settings into <code>js/firebase-config.js</code> (see README.md), then reload.</p></div>';
  else if (mode === "signin") h += '<div class="card"><div class="card-head"><h2>Teacher sign-in</h2></div><p class="lede">Sign in with your school Google account.</p><div class="row" style="margin-top:14px;"><button class="btn" data-act="signIn">Sign in with Google</button></div><p class="lede" style="margin-top:12px;font-size:13.5px;">Students: use the student link your teacher sent.</p></div>';
  else if (mode === "denied") h += '<div class="card"><h2>This console is for the teacher</h2><p class="lede" style="margin-top:8px;">' + esc(user && user.email) + ' isn’t on the teacher list.</p><div class="row" style="margin-top:14px;"><button class="btn ghost" data-act="signOut">Use a different account</button></div></div>';
  else if (mode === "setup") h += viewSetup();
  else if (mode === "class") h += keepHTML(cls, students, popIds);
  else h += viewDaily() + viewStandings() + viewAssign() + viewLinks() + viewSettings();

  const active = document.activeElement, keep = active && active.id && active.matches("input, textarea") ? { id: active.id, v: active.value, pos: active.selectionStart } : null;
  app.innerHTML = h;
  if (keep) { const n = document.getElementById(keep.id); if (n) { n.value = keep.v; n.focus(); try { n.setSelectionRange(keep.pos, keep.pos); } catch (e) {} } }
  renderRules();
}

function renderRules() {
  const tb = document.querySelector("#itemTable tbody");
  if (tb && !tb.innerHTML) tb.innerHTML = ITEMS.map(it => "<tr><td>" + itemArt(it, "gimg") + " " + esc(it.name) + '</td><td class="eff">' +
    (it.streak ? it.streak + "-day 120 XP streak" : "You award it after a pet disappears and the student hits 120 again") + "</td></tr>").join("");
}

function viewSetup() {
  return '<div class="card"><div class="card-head"><h2>Set up your class</h2></div><div class="row">' +
    '<div class="field" style="flex:1;min-width:210px;"><label for="setClass">Class name</label><input id="setClass" type="text" maxlength="48" placeholder="Ms. Ariana’s Class"></div>' +
    '<div class="field" style="flex:1;min-width:160px;"><label for="setWeek">Week label</label><input id="setWeek" type="text" maxlength="32" placeholder="Week of Sept 28"></div>' +
    '<div class="field" style="width:130px;"><label for="setGoal">Daily XP goal</label><input id="setGoal" type="number" min="10" max="2000" step="10" value="120"></div>' +
    '<button class="btn" data-act="saveSetup">Create the class</button></div></div>';
}

/* ---------- daily XP ---------- */
function viewDaily() {
  const rec = recordedDays(cls), goal = goalXP(cls);
  let h = '<div class="card"><div class="card-head"><h2>Daily XP</h2><span class="fact">Goal: <b>' + goal + " XP</b> a day</span></div>";
  h += '<div class="daynav">' + DAYS.map((d, i) => '<button class="daytab" data-day="' + i + '" aria-pressed="' + (i === day) + '">' + d +
    '<span class="dot' + (rec[i] ? " on" : "") + '"></span></button>').join("") + "</div>";

  h += '<div class="row" style="margin-bottom:10px;align-items:center;">' +
    '<label class="btn" style="background:var(--warn);color:#fff;" for="upLunch">☀️ Upload lunch spreadsheet</label><input id="upLunch" type="file" accept=".csv,.xlsx,.xls" hidden>' +
    '<label class="btn" for="upDay">Upload end-of-day spreadsheet</label><input id="upDay" type="file" accept=".csv,.xlsx,.xls" hidden>' +
    '<button class="btn ghost" data-act="toggleRecorded">' + (rec[day] ? "✓ " + DAYS[day] + " is counting" : "Count " + DAYS[day] + " toward health") + "</button>" +
    '<button class="btn ghost" data-act="clearDay">Clear ' + SHORT[day] + "</button></div>" +
    '<p class="lede" style="font-size:13px;margin-bottom:12px;">CSV or XLSX with <b>name</b> and <b>completed</b> columns. The <b>lunch</b> file marks who already hit ' + goal +
    ' (their sidekick joins them today). The <b>end-of-day</b> file decides health and turns the day on.</p>';

  const up = busy.upReport;
  if (up && up.day === day) {
    h += '<div class="banner ' + (up.unmatched.length || up.missing.length ? "warn" : "info") + '"><b>' + (up.kind === "lunch" ? "Lunch" : "End of day") + " · " + esc(up.file) + ":</b> matched " +
      up.matched + " students · " + up.hit + " at " + goal + "+ XP.";
    if (up.missing.length) h += "<br>Not in the file (left as they were): " + up.missing.map(esc).join(", ");
    if (up.unmatched.length) h += "<br>In the file but not on your roster: " + up.unmatched.map(u => esc(u.name)).join(", ") +
      '<div style="margin-top:8px;"><button class="btn small" data-act="addUnmatched">Add ' + up.unmatched.length + " to roster</button></div>";
    h += "</div>";
  }
  if (!students.length) return h + '<p class="lede">Add your roster in Class settings below.</p></div>';

  h += '<div class="scroll-x"><table class="checkin"><thead><tr><th>Student</th><th>By lunch</th><th>XP</th><th class="heavy">' + goal + " XP</th><th>Tech issue</th></tr></thead><tbody>";
  students.forEach(s => {
    const c = byId(ROSTER, s.companionId);
    const v = arr5(s.status, "")[day], early = arr5(s.early, false)[day];
    const xp = arr5(s.xp, null)[day], lx = arr5(s.lunchXp, null)[day];
    const cls2 = v === "c" ? "c" : v === "e" ? "e" : rec[day] ? "m" : "";
    const sym = v === "c" ? "✓" : v === "e" ? "–" : rec[day] ? "✕" : "·";
    h += '<tr><td class="nm">' + esc(s.name) + "<small>" + (c ? c.glyph + " " + esc(s.petName || c.name) : "no companion yet") + "</small></td>" +
      '<td><button class="lunchbtn' + (early ? " on" : "") + '" data-lunch="' + s.id + '" aria-label="' + esc(s.name) + " hit goal by lunch: " + (early ? "yes" : "no") + '">' + (early ? "☀️" : "·") + "</button>" +
        (lx != null ? '<small class="muted" style="display:block;">' + lx + "</small>" : "") + "</td>" +
      '<td style="font-family:var(--mono);">' + (xp == null ? '<span class="muted">—</span>' : xp) + "</td>" +
      '<td class="heavy"><button class="ring ' + cls2 + '" data-ring="' + s.id + '" aria-label="' + esc(s.name) + " " + (v === "c" ? "hit" : v === "e" ? "excused" : "missed") + '">' + sym + "</button></td>" +
      '<td><button class="btn ghost small" data-excuse="' + s.id + '">Excuse day</button></td></tr>';
  });
  return h + "</tbody></table></div></div>";
}

/* ---------- standings ---------- */
function viewStandings() {
  const rec = recordedDays(cls);
  let h = '<div class="card"><div class="card-head"><h2>Full standings</h2><span class="fact"><b>two 120 XP misses in a row → disappears</b></span></div>';
  if (!students.length) return h + '<p class="lede">No students yet.</p></div>';
  const rows = students.map(s => ({ s, sim: s.companionId ? simulate(s, cls) : null }))
    .sort((a, b) => (b.sim ? b.sim.health : -1) - (a.sim ? a.sim.health : -1) || a.s.name.localeCompare(b.s.name));
  h += '<div class="scroll-x"><table class="grid"><thead><tr><th>Student</th><th>Companion</th><th>Mon–Fri</th><th>Days hit</th><th>Health</th><th>Standing</th><th>Gear</th></tr></thead><tbody>';
  rows.forEach(({ s, sim }) => {
    const c = byId(ROSTER, s.companionId);
    h += '<tr><td class="who">' + esc(s.name) + '<span class="pet"><button class="btn ghost small" data-copylink="' + s.id + '" style="margin-top:4px;padding:3px 8px;">Copy link</button></span></td>';
    h += "<td>" + (c ? c.glyph + " <b>" + esc(s.petName || c.name) + '</b><span class="pet">' + esc(c.name) + "</span>" : '<span class="muted">not chosen</span>') +
      ' <button class="btn ghost small" data-assign="' + s.id + '" style="margin-left:6px;">' + (c ? "Change" : "Set") + "</button></td>";
    if (!sim) { h += '<td colspan="5" class="muted">waiting for this student to choose</td></tr>'; return; }
    h += '<td><span class="dots">' + [0, 1, 2, 3, 4].map(d => {
      const v = arr5(s.status, "")[d], k = v === "c" ? "c" : v === "e" ? "e" : rec[d] ? "m" : "";
      return '<span class="dcol"><span class="dot3 ' + k + '" title="' + DAYS[d] + '"></span>' + (arr5(s.early, false)[d] ? '<span style="font-size:10px;line-height:1;">☀️</span>' : "") + "</span>";
    }).join("") + "</span></td>";
    h += '<td><span class="ovtag ' + (!sim.alive ? "bad" : sim.atRisk ? "warn" : "good") + '">' + sim.ovMet + " / " + sim.ovCounted + "</span>" +
      (sim.atRisk ? '<span class="pet">miss tomorrow = gone</span>' : "") + "</td>";
    const t = tier(sim);
    h += '<td><span class="hp t-' + t.key + '"><span class="track"><span class="bar" style="width:' + Math.max(0, Math.min(100, sim.health / sim.max * 100)) + '%"></span></span><span class="n">' + sim.health + "</span></span></td>";
    h += '<td style="color:' + (!sim.alive ? "var(--bad)" : "var(--ink-2)") + '">' + t.label + (sim.capeSaved ? '<span class="pet">saved by the cape</span>' : "") +
      (sim.capeReady ? ' <button class="btn small" data-givecape="' + s.id + '" style="margin-top:4px;">\u{1F9B8} Award Hero Cape</button>' : "") + "</td>";
    const worn = wornItem(s, sim);
    h += '<td><div class="eqrow">' + GEAR.map(g => {
      const ok = sim.unlocked.includes(g.id);
      return '<button class="eq' + (worn && worn.id === g.id ? " on" : "") + '" data-equip="' + s.id + ":" + g.id + '"' + (ok ? "" : " disabled") +
        ' title="' + esc(g.name) + (ok ? "" : " — unlocks at a " + g.streak + "-day streak") + '">' + itemArt(g, "gimg") + "</button>";
    }).join("") + '</div><span class="pet">streak ' + sim.hitRun + " · best " + sim.bestRun + "</span>";
    (s.items || []).forEach((it, idx) => { const d4 = byId(ITEMS, it.id); if (d4) h += '<button class="x" title="Remove ' + esc(d4.name) + '" data-unaward="' + s.id + ":" + idx + '">' + d4.glyph + "</button>"; });
    h += "</td></tr>";
  });
  return h + "</tbody></table></div></div>";
}

function viewAssign() {
  if (!busy.assign) return "";
  const s = sOf(busy.assign); if (!s) return "";
  return '<div class="card"><div class="card-head"><h2>Companion for ' + esc(s.name) + '</h2></div><div class="row">' +
    '<div class="field" style="flex:1;min-width:260px;"><label for="assignComp">Companion</label><select id="assignComp"><option value="">— none (student chooses) —</option>' +
    ROSTER.map(c => '<option value="' + c.id + '"' + (s.companionId === c.id ? " selected" : "") + ">" + c.glyph + "  " + esc(c.name) + "</option>").join("") + "</select></div>" +
    '<div class="field" style="flex:1;min-width:180px;"><label for="assignName">Companion name</label><input id="assignName" type="text" maxlength="22" value="' + esc(s.petName || "") + '"></div>' +
    '<button class="btn" data-act="doAssign">Save</button><button class="btn ghost" data-act="cancelAssign">Cancel</button></div>' +
    '<p class="lede" style="margin-top:10px;font-size:13px;">Choosing “none” lets the student pick a new companion from their page.</p></div>';
}

function viewLinks() {
  return '<div class="card"><div class="card-head"><h2>Student link</h2></div>' +
    '<p class="lede">Send this one link to the whole class. Students tap their name, choose a companion, name it and pick their gear.</p>' +
    '<div class="row" style="margin-top:12px;"><input type="text" readonly value="' + esc(studentLink()) + '" style="flex:1;min-width:260px;font-family:var(--mono);font-size:13px;">' +
    '<button class="btn" data-copylink="">Copy link</button></div>' +
    '<p class="lede" style="margin-top:10px;font-size:13px;">Each student also has a personal link (Copy link in Full standings) that skips the name list.</p></div>';
}

function viewSettings() {
  return '<div class="card"><div class="card-head"><h2>Class settings</h2></div><div class="row">' +
    '<div class="field" style="flex:1;min-width:180px;"><label for="gClass">Class name</label><input id="gClass" type="text" maxlength="48" value="' + esc(cls.className || "") + '"></div>' +
    '<div class="field" style="flex:1;min-width:150px;"><label for="gWeek">Week label</label><input id="gWeek" type="text" maxlength="32" value="' + esc(cls.weekLabel || "") + '"></div>' +
    '<div class="field" style="width:130px;"><label for="gGoal">Daily XP goal</label><input id="gGoal" type="number" min="10" max="2000" step="10" value="' + goalXP(cls) + '"></div>' +
    '<button class="btn ghost" data-act="saveClass">Save</button></div>' +
    '<div class="field" style="margin-top:16px;"><label for="rosterBox">Roster — one student per line (first names or first name + initial)</label><textarea id="rosterBox" rows="7">' +
    esc(students.map(s => s.name).join("\n")) + "</textarea></div>" +
    '<div class="row" style="margin-top:9px;"><button class="btn" data-act="saveRoster">Save roster</button><span class="lede" style="font-size:13px;">Removing a name deletes that student’s companion and week.</span></div>' +
    '<div class="row" style="margin-top:18px;border-top:1px solid var(--line-2);padding-top:16px;"><button class="btn danger" data-act="newWeek">' +
    (busy.confirmNewWeek ? "Yes — clear the whole week" : "Start a new week") + '</button><span class="lede" style="font-size:13px;">' +
    (busy.confirmNewWeek ? "Clears every day, lunch mark, gear and cape for all " + students.length + " students." : "Students keep their companions and names.") + "</span></div></div>";
}

/* ================= spreadsheet upload ================= */
const normKey = k => String(k || "").trim().toLowerCase().replace(/[\s_]+/g, " ");
const NAME_KEYS = ["name", "student", "student name", "full name", "learner"];
const XP_KEYS = ["completed", "xp", "total xp", "xp earned", "daily xp"];
const pickKey = (keys, wanted) => wanted.find(w => keys.includes(w)) || null;

function parseCSV(text) {
  const rows = []; let row = [], cur = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
    else if (ch === '"') q = true;
    else if (ch === ",") { row.push(cur); cur = ""; }
    else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; row.push(cur); rows.push(row); row = []; cur = ""; }
    else cur += ch;
  }
  if (cur !== "" || row.length) { row.push(cur); rows.push(row); }
  const clean = rows.filter(r => r.some(c => String(c).trim() !== ""));
  if (!clean.length) return [];
  const head = clean[0].map(normKey);
  return clean.slice(1).map(r => { const o = {}; head.forEach((k, i) => { o[k] = r[i] == null ? "" : r[i]; }); return o; });
}
async function readRows(file) {
  if (/\.csv$/i.test(file.name)) return parseCSV(await file.text());
  if (!window.XLSX) throw new Error("The spreadsheet reader didn’t load. Try saving the file as CSV.");
  const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
  for (const name of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: "" }).map(r => { const o = {}; Object.keys(r).forEach(k => { o[normKey(k)] = r[k]; }); return o; });
    if (rows.length) { const keys = Object.keys(rows[0]); if (pickKey(keys, NAME_KEYS) && pickKey(keys, XP_KEYS)) return rows; }
  }
  return [];
}
function matchStudent(fileName) {
  const f = fileName.toLowerCase().replace(/\s+/g, " ").trim();
  let m = students.filter(s => s.name.toLowerCase().trim() === f);
  if (!m.length) m = students.filter(s => { const r = s.name.toLowerCase().trim(); return f.startsWith(r + " ") || r.startsWith(f + " "); });
  return m.length === 1 ? m[0] : null;
}

async function applyUpload(up) {
  const goal = goalXP(cls), d = up.day;
  const best = {}; let unmatched = [];
  up.rows.forEach(r => {
    const nm = String(r[up.nameKey] || "").trim(); if (!nm) return;
    const xp = Number(String(r[up.xpKey]).replace(/[^0-9.\-]/g, "")) || 0;
    const st = matchStudent(nm);
    if (st) { if (!best[st.id] || xp > best[st.id]) best[st.id] = xp; }
    else unmatched.push({ name: nm, guide: up.guideKey ? String(r[up.guideKey] || "").trim() : "" });
  });
  if (up.guideKey && unmatched.length) {   // mixed-class files: only offer this class's guide
    const tally = {};
    up.rows.forEach(r => { const nm = String(r[up.nameKey] || "").trim(); if (nm && matchStudent(nm)) { const g = String(r[up.guideKey] || "").trim(); tally[g] = (tally[g] || 0) + 1; } });
    const topG = Object.keys(tally).sort((a, b) => tally[b] - tally[a])[0];
    if (topG) unmatched = unmatched.filter(u => u.guide === topG);
  }
  const seenN = {}; unmatched = unmatched.filter(u => { const k = u.name.toLowerCase(); if (seenN[k]) return false; seenN[k] = 1; return true; });

  const batch = writeBatch(db); let hit = 0, matched = 0; const missing = [];
  students.forEach(s => {
    if (!(s.id in best)) { missing.push(s.name); return; }
    matched++;
    const xp = best[s.id], ok = xp >= goal; if (ok) hit++;
    const status = arr5(s.status, ""), early = arr5(s.early, false);
    if (up.kind === "lunch") {
      const lunchXp = arr5(s.lunchXp, null); lunchXp[d] = xp; early[d] = ok;
      if (ok && status[d] !== "e") status[d] = "c";
      Object.assign(s, { lunchXp, early, status });
      batch.update(studentRef(s.id), { lunchXp, early, status });
    } else {
      const xps = arr5(s.xp, null); xps[d] = xp;
      status[d] = status[d] === "e" && !ok ? "e" : ok ? "c" : "";
      Object.assign(s, { xp: xps, status });
      batch.update(studentRef(s.id), { xp: xps, status });
    }
  });
  if (up.kind === "day") { const rec = recordedDays(cls); if (!rec[d]) { rec[d] = true; batch.update(classRef, { recorded: rec }); } }
  try { await batch.commit(); } catch (e) { flash("Upload didn’t save — " + (e.code || e.message)); }
  busy.upReport = { kind: up.kind, day: d, file: up.file, matched, hit, missing, unmatched };
  render();
}

document.addEventListener("change", async ev => {
  const id = ev.target.id;
  if ((id !== "upDay" && id !== "upLunch") || !ev.target.files[0]) return;
  const file = ev.target.files[0];
  try {
    const rows = await readRows(file);
    if (!rows.length) { flash("Couldn’t find a sheet with a name column and a completed (XP) column."); return; }
    const keys = Object.keys(rows[0]);
    const up = { kind: id === "upLunch" ? "lunch" : "day", day, file: file.name, rows,
      nameKey: pickKey(keys, NAME_KEYS), xpKey: pickKey(keys, XP_KEYS), guideKey: keys.includes("guide") ? "guide" : null };
    busy.lastUpload = up;
    await applyUpload(up);
  } catch (e) { flash(e.message || "Couldn’t read that file."); }
  ev.target.value = "";
});

/* ================= clicks ================= */
document.addEventListener("click", async ev => {
  let el;
  if ((el = ev.target.closest("[data-day]"))) { day = Number(el.dataset.day); render(); return; }
  if ((el = ev.target.closest("[data-ring]"))) {
    const s = sOf(el.dataset.ring), st = arr5(s.status, "");
    st[day] = st[day] === "" ? "c" : st[day] === "c" ? "e" : "";
    return patch(s.id, { status: st });
  }
  if ((el = ev.target.closest("[data-lunch]"))) {
    const s = sOf(el.dataset.lunch), early = arr5(s.early, false), st = arr5(s.status, "");
    early[day] = !early[day];
    if (early[day] && st[day] !== "e") st[day] = "c";
    return patch(s.id, { early, status: st });
  }
  if ((el = ev.target.closest("[data-excuse]"))) {
    const s = sOf(el.dataset.excuse), st = arr5(s.status, "");
    st[day] = st[day] === "e" ? "" : "e";
    return patch(s.id, { status: st });
  }
  if ((el = ev.target.closest("[data-equip]"))) {
    const [sid, gid] = el.dataset.equip.split(":"); const s = sOf(sid);
    const worn = wornItem(s, simulate(s, cls));
    return patch(sid, { equipped: worn && worn.id === gid ? "" : gid });
  }
  if ((el = ev.target.closest("[data-givecape]"))) {
    const s = sOf(el.dataset.givecape);
    if (!simulate(s, cls).capeReady) return;
    return patch(s.id, { items: (s.items || []).concat([{ id: "cape", at: new Date().toISOString() }]) });
  }
  if ((el = ev.target.closest("[data-unaward]"))) {
    const [sid, idx] = el.dataset.unaward.split(":"); const s = sOf(sid);
    const items = (s.items || []).slice(); items.splice(Number(idx), 1);
    return patch(sid, { items });
  }
  if ((el = ev.target.closest("[data-assign]"))) { busy.assign = el.dataset.assign; render(); return; }
  if ((el = ev.target.closest("[data-copylink]"))) {
    const link = studentLink(el.dataset.copylink || null);
    try { await navigator.clipboard.writeText(link); el.textContent = "Copied!"; setTimeout(render, 1400); } catch (e) { prompt("Copy this link:", link); }
    return;
  }
  if (!(el = ev.target.closest("[data-act]"))) return;
  const act = el.dataset.act;

  if (act === "signIn") { try { await teacherSignIn(); } catch (e) { flash("Sign-in didn’t finish — " + (e.code || e.message)); } return; }
  if (act === "signOut") { await signOut(auth); return; }
  if (act === "classView") { mode = "class"; render(); scrollTo({ top: 0 }); return; }
  if (act === "backConsole") { mode = "guide"; render(); return; }
  if (act === "testParty") { partyQueue.push({ text: "Ember unlocked the Crown!", sub: "5-day 120 XP streak", glyph: "\u{1F451}", pet: "\u{1F409}" }); if (!partyShowing) runParty(); return; }

  if (act === "saveSetup") {
    const name = document.getElementById("setClass").value.trim();
    if (!name) { flash("Give the class a name first."); return; }
    const goal = Math.max(10, Math.min(2000, Math.floor(Number(document.getElementById("setGoal").value) || 120)));
    try {
      await setDoc(classRef, { className: name, weekLabel: document.getElementById("setWeek").value.trim(), goal, recorded: five(false), createdAt: new Date().toISOString() });
      mode = "guide";
    } catch (e) { flash("Couldn’t create the class — " + (e.code || e.message) + ". Check that your email is in firestore.rules."); }
    return;
  }
  if (act === "saveClass") {
    try {
      await updateDoc(classRef, { className: document.getElementById("gClass").value.trim(), weekLabel: document.getElementById("gWeek").value.trim(),
        goal: Math.max(10, Math.min(2000, Math.floor(Number(document.getElementById("gGoal").value) || 120))) });
      flash("Saved.");
    } catch (e) { flash("Couldn’t save — " + e.code); }
    return;
  }
  if (act === "toggleRecorded") { const rec = recordedDays(cls); rec[day] = !rec[day]; try { await updateDoc(classRef, { recorded: rec }); } catch (e) { flash("Couldn’t change that — " + e.code); } return; }
  if (act === "clearDay") {
    const batch = writeBatch(db);
    const rec = recordedDays(cls); rec[day] = false; batch.update(classRef, { recorded: rec });
    students.forEach(s => {
      const status = arr5(s.status, ""), xp = arr5(s.xp, null), lunchXp = arr5(s.lunchXp, null), early = arr5(s.early, false);
      status[day] = ""; xp[day] = null; lunchXp[day] = null; early[day] = false;
      batch.update(studentRef(s.id), { status, xp, lunchXp, early });
    });
    try { await batch.commit(); busy.upReport = null; } catch (e) { flash("Couldn’t clear — " + e.code); }
    return;
  }
  if (act === "addUnmatched") {
    const up = busy.upReport; if (!up || !up.unmatched.length) return;
    el.disabled = true;
    const batch = writeBatch(db); const base = students.length;
    up.unmatched.forEach((u, i) => { const ref = newStudentRef(); const s = blankStudent(u.name, base + i); batch.set(ref, s); students.push(Object.assign({ id: ref.id }, s)); });
    try { await batch.commit(); } catch (e) { flash("Couldn’t add them — " + e.code); return; }
    if (busy.lastUpload) await applyUpload(busy.lastUpload);
    return;
  }
  if (act === "saveRoster") {
    const lines = document.getElementById("rosterBox").value.split("\n").map(x => x.trim()).filter(Boolean);
    const byName = {}; students.forEach(s => { byName[s.name.toLowerCase()] = s; });
    const keep = {}; const batch = writeBatch(db);
    lines.forEach((nm, i) => {
      const found = byName[nm.toLowerCase()];
      if (found) { keep[found.id] = 1; if (found.order !== i || found.name !== nm) batch.update(studentRef(found.id), { order: i, name: nm }); }
      else { const ref = newStudentRef(); batch.set(ref, blankStudent(nm, i)); keep[ref.id] = 1; }
    });
    students.forEach(s => { if (!keep[s.id]) batch.delete(studentRef(s.id)); });
    try { await batch.commit(); flash("Roster saved."); } catch (e) { flash("Roster didn’t save — " + e.code); }
    return;
  }
  if (act === "newWeek") {
    if (!busy.confirmNewWeek) { busy.confirmNewWeek = true; render(); return; }
    busy.confirmNewWeek = false; busy.upReport = null;
    const batch = writeBatch(db);
    batch.update(classRef, { recorded: five(false) });
    students.forEach(s => batch.update(studentRef(s.id), { status: five(""), xp: five(null), lunchXp: five(null), early: five(false), items: [], equipped: null }));
    try { await batch.commit(); flash("New week started."); } catch (e) { flash("Couldn’t reset — " + e.code); }
    return;
  }
  if (act === "cancelAssign") { busy.assign = null; render(); return; }
  if (act === "doAssign") {
    const sid = busy.assign, comp = document.getElementById("assignComp").value || null;
    const nm = document.getElementById("assignName").value.trim();
    busy.assign = null;
    return patch(sid, { companionId: comp, petName: comp ? (nm || byId(ROSTER, comp).name) : "" });
  }
});

document.addEventListener("keydown", ev => {
  if (ev.key !== "Enter") return;
  if (["setClass", "setWeek", "setGoal"].includes(ev.target.id)) { ev.preventDefault(); document.querySelector('[data-act="saveSetup"]').click(); }
  if (ev.target.id === "assignName") { ev.preventDefault(); document.querySelector('[data-act="doAssign"]').click(); }
});

render();
