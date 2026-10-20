/* ---------- 🔒 Personal links + ⏪ Rollback (teacher console, Oct 2026) ----------
   Personal links: each student gets student.html?s=ID&k=CODE. Codes live in private/keys (teacher only).
   The first device to open a link is "seated" as that student (seats/{uid}); the rules only let a device save its own student.
   Rollback: once a day the console saves a snapshot of every student (snaps/{stamp}__{id}, teacher only).
   You can put back a student's creatures, or their whole game save, from any snapshot. Your own records
   (XP, attendance, names, the eggs and bonuses you give) are never rolled back. */
import { esc } from "./game.js?v=20261020e";
import { azToday } from "./collect.js?v=20261020e";
import { cardOf, sameData } from "./card.js?v=20261020e";
import { cardRef } from "./db.js?v=20261020e";
import { setDoc, updateDoc, deleteDoc, writeBatch, db, classRef, studentRef, keysRef, getKeys, seatRef, snapRef, snapsFor, snapsAt, deleteField } from "./db.js?v=20261020e";

// Fields only the teacher writes (same list as the rules). A rollback never touches these.
export const TEACHER_FIELDS = ["name", "order", "goalSubject", "xp", "lunchXp", "status", "early", "xpHist", "deaths", "items",
  "streakCarry", "streakWeek", "candyBank", "bonusXP", "bonusPulls", "cpEarned", "questPass",
  "birthdayEggs", "pickleEggs", "ghostEggs", "ghost2", "turkeyEggs", "turkey2", "grinchEggs", "grinch2", "yetiEggs", "yeti2", "heartEggs", "heart2",
  "potionLegEggs", "feastLegEggs", "gingerLegEggs", "snowmanLegEggs", "candyboxLegEggs",
  "potionDays", "feastDays", "gingerDays", "snowmanDays", "candyboxDays", "isTeacher", "reward", "fullName", "pubName"];
export const CREATURE_FIELDS = ["coll", "starter", "petCreature", "spares", "dex"];

export const G = { cards: null, keys: null, seats: [], snaps: {}, pick: "", confirm: "", stamp: "", classSnaps: null, msg: "" };
const code = () => { const a = new Uint8Array(12); crypto.getRandomValues(a); return Array.from(a, b => "abcdefghjkmnpqrstuvwxyz23456789"[b % 31]).join(""); };
export function personalLink(id) {
  const u = new URL("student.html", location.href);
  u.searchParams.set("s", id); if (G.keys && G.keys[id]) u.searchParams.set("k", G.keys[id]);
  return u.toString();
}
const seated = id => G.seats.filter(x => x.sid === id).length;
// The saved version of a student (the console keeps a display name in .name and the roster name in .fullName)
const clean = s => { const o = Object.assign({}, s); delete o.id; if (o.fullName != null) o.name = o.fullName; delete o.fullName; return o; };
const summary = d => { const c = (d && d.coll) || {}, l = Object.values(c).map(e => Number(e.lvl) || 1); return Object.keys(c).length + " creatures" + (l.length ? " · best Lv " + Math.max(...l) : ""); };
const when = st => { const m = /^(\d{4})-(\d\d)-(\d\d)(?:T(\d\d)(\d\d))?/.exec(st) || []; const d = new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 7), +(m[5] || 0));
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) + (m[4] ? " " + d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) : " (start of day)"); };
const nowStamp = () => { const t = new Date(Date.now() - 7 * 3600e3).toISOString(); return t.slice(0, 10) + "T" + t.slice(11, 13) + t.slice(14, 16); };

/* ----- snapshots ----- */
let snapping = false;
// Once a day, the first time the console has everyone loaded. 1 write per student.
export async function autoSnap(cls, students) {
  if (snapping || !cls || !students.length || cls.snapDay === azToday()) return;
  snapping = true;
  try { await snapAll(students, azToday()); await updateDoc(classRef, { snapDay: azToday(), snapStamps: addStamp(cls, azToday()) }); } catch (e) { console.warn("snapshot", e); }
  snapping = false;
}
const addStamp = (cls, st) => Array.from(new Set([].concat(cls.snapStamps || [], [st]))).sort().slice(-60);
async function snapAll(students, stamp, tag) {
  for (let i = 0; i < students.length; i += 400) {
    const b = writeBatch(db);
    students.slice(i, i + 400).forEach(s => b.set(snapRef(stamp + "__" + s.id), { sid: s.id, stamp, name: s.fullName || s.name || "", tag: tag || "", json: JSON.stringify(clean(s)) }));
    await b.commit();
  }
}

/* ----- the card (Students tab) ----- */
export function guardCard(students, cls) {
  const linked = students.filter(s => seated(s.id)).length;
  let h = '<div class="card" id="guardCard"><div class="card-head"><h2>\u{1F512} Personal links</h2><span class="fact">' + linked + " / " + students.length + " linked</span></div>";
  if (!G.keys) h += '<p class="lede">Each student gets their own link with a secret code. The first computer that opens it becomes that student’s computer, and it can only change that student’s save.</p>' +
    '<div class="row" style="margin-top:10px;"><button class="btn" data-g="loadKeys">\u{1F511} Show personal links</button></div>';
  else {
    const missing = students.filter(s => !G.keys[s.id]).length;
    h += '<p class="lede" style="margin-bottom:10px;">Send each student <b>their own</b> link (a Google Classroom private comment works well). They open it once on their Chromebook and it remembers them. ' +
      "A ✅ means that student’s computer is linked.</p>" +
      (missing ? '<div class="row" style="margin-bottom:10px;"><button class="btn" data-g="makeKeys">✨ Make links for ' + missing + " student" + (missing === 1 ? "" : "s") + "</button></div>" : "") +
      '<div class="row" style="gap:8px;margin-bottom:10px;"><button class="btn ghost small" data-g="copyAll">\u{1F4CB} Copy all links (name + link)</button></div>' +
      '<table class="tbl"><tbody>' + students.map(s => '<tr><td><b>' + esc(s.name) + "</b></td><td>" + (seated(s.id) ? "✅ linked" + (seated(s.id) > 1 ? " (" + seated(s.id) + " computers)" : "") : '<span class="muted">not yet</span>') + "</td><td>" +
        (G.keys[s.id] ? '<button class="btn ghost small" data-g="copy" data-id="' + s.id + '">Copy link</button> <button class="btn ghost small" data-g="reKey" data-id="' + s.id + '">' + (G.confirm === "re:" + s.id ? "Yes, new link" : "New link") + "</button>" : "") + "</td></tr>").join("") + "</tbody></table>" +
      '<p class="small muted" style="margin-top:6px;">New link = the old link stops working and that student’s linked computers are unlinked (use it if a link got shared).</p>' +
      '<label class="row" style="gap:8px;margin-top:12px;align-items:flex-start;"><input type="checkbox" data-g="require"' + (cls.linksRequired ? " checked" : "") + '><span><b>Require personal links</b><br><small>Hides the “Who are you?” name list. Turn this on once everyone is linked, then publish the new rules.</small></span></label>';
  }
  return h + "</div>" + rollbackCard(students, cls);
}

function rollbackCard(students, cls) {
  const stamps = (cls.snapStamps || []).slice().reverse();
  let h = '<div class="card" id="rollCard"><div class="card-head"><h2>⏪ Rollback</h2><span class="fact">' + (cls.snapDay ? "last snapshot " + when(stamps[0] || cls.snapDay) : "no snapshots yet") + "</span></div>" +
    '<p class="lede" style="margin-bottom:10px;">The console saves everyone’s game each morning when you open it. If something goes wrong, put a student back the way they were. Your XP records, attendance and the eggs you give are never rolled back. Before any rollback, the console saves the current version first, so a rollback can be undone too.</p>' +
    (G.msg ? '<div class="banner info" style="margin-bottom:10px;">' + esc(G.msg) + "</div>" : "") +
    '<div class="row" style="gap:8px;align-items:center;flex-wrap:wrap;"><select id="gPick"><option value="">Pick a student…</option>' + students.map(s => '<option value="' + s.id + '"' + (G.pick === s.id ? " selected" : "") + ">" + esc(s.name) + "</option>").join("") + "</select>" +
    '<button class="btn ghost small" data-g="find">Show their snapshots</button><button class="btn ghost small" data-g="snapNow">\u{1F4F8} Save a snapshot of everyone now</button></div>';
  const list = G.pick && G.snaps[G.pick], s = students.find(x => x.id === G.pick);
  if (list && s) {
    h += '<p class="small" style="margin:10px 0 4px;"><b>' + esc(s.name) + "</b> now: " + summary(s) + "</p>";
    h += list.length ? '<table class="tbl"><tbody>' + list.map(x => { const d = JSON.parse(x.json || "{}");
      return "<tr><td>" + esc(when(x.stamp)) + (x.tag ? ' <span class="muted small">(' + esc(x.tag) + ")</span>" : "") + '</td><td class="small">' + summary(d) + "</td><td>" +
        '<button class="btn ghost small" data-g="undoC" data-sn="' + x.id + '">' + (G.confirm === "c:" + x.id ? "Yes, put back creatures" : "Creatures only") + "</button> " +
        '<button class="btn ghost small" data-g="undoA" data-sn="' + x.id + '">' + (G.confirm === "a:" + x.id ? "Yes, put back the game save" : "Whole game save") + "</button></td></tr>"; }).join("") + "</tbody></table>"
      : '<p class="muted small">No snapshots for this student yet.</p>';
  }
  if (stamps.length) {
    h += '<div style="margin-top:14px;border-top:1px solid var(--line-2);padding-top:12px;"><h3>Whole class: creatures</h3><p class="small muted" style="margin:4px 0 8px;">Puts back creatures only for students whose creature count or levels changed since that snapshot. You’ll see the list before anything changes.</p>' +
      '<div class="row" style="gap:8px;align-items:center;"><select id="gStamp">' + stamps.map(st => '<option value="' + st + '"' + (G.stamp === st ? " selected" : "") + ">" + esc(when(st)) + "</option>").join("") + "</select>" +
      '<button class="btn ghost small" data-g="classFind">Check who changed</button></div>';
    if (G.classSnaps) {
      const ch = classChanges(students);
      h += ch.length ? '<table class="tbl" style="margin-top:8px;"><tbody>' + ch.map(c => "<tr><td>" + (odd(c) ? "\u{1F6A9} " : "") + "<b>" + esc(c.s.name) + '</b></td><td class="small">now ' + summary(c.s) + " → back to " + summary(c.d) + (odd(c) ? " · <b>unusual jump</b>" : "") + "</td></tr>").join("") + "</tbody></table>" +
        '<div class="row" style="margin-top:8px;"><button class="btn" data-g="classUndo">' + (G.confirm === "class" ? "Yes, put back creatures for these " + ch.length : "Put back creatures for these " + ch.length) + "</button></div>"
        : '<p class="small" style="margin-top:8px;">✅ Nobody’s creatures changed since then.</p>';
      const rj = rewardJumps(students);
      h += rj.length ? '<div class="banner warn" style="margin-top:10px;"><b>\u{1F6A9} Unusually big reward jumps since then:</b><br>' + rj.map(r => "<b>" + esc(r.s.name) + "</b>: " + r.big.join(", ")).join("<br>") +
        '<br><small>To undo, pick that student above, Show their snapshots, then Whole game save.</small></div>' : "";
    }
    h += "</div>";
  }
  return h + "</div>";
}
// More than a day's worth of change: 4+ new creature families, or a creature 10+ levels higher than in the snapshot.
const lv = (d, f) => Number((((d && d.coll) || {})[f] || {}).lvl) || 0;
function odd(c) {
  const now = Object.keys(c.s.coll || {}), was = c.d.coll || {};
  return now.filter(f => !was[f]).length >= 4 || now.some(f => was[f] && lv(c.s, f) - lv(c.d, f) >= 10);
}
// Rewards that grew more than a normal day allows since the snapshot (the rules cap each save; this catches many saves in a row).
const JUMPS = [["legendaryPulls", 3, "Legendary eggs"], ["doorEggs", 10, "eggs"], ["doorXP", 2000, "bonus XP"], ["candyBonus", 1000, "candy"], ["cpBonus", 500, "Comfort Points"], ["spins", 10, "spins"], ["extraAttacks", 10, "extra attacks"]];
function rewardJumps(students) {
  return (G.classSnaps || []).map(x => { const d = JSON.parse(x.json || "{}"), s = students.find(y => y.id === x.sid); if (!s) return null;
    const big = JUMPS.map(([k, most, label]) => [(Number(s[k]) || 0) - (Number(d[k]) || 0), most, label]).filter(([n, most]) => n > most).map(([n, , label]) => "+" + n.toLocaleString() + " " + label);
    return big.length ? { s, big } : null; }).filter(Boolean);
}
function classChanges(students) {
  return (G.classSnaps || []).map(x => ({ x, d: JSON.parse(x.json || "{}"), s: students.find(s => s.id === x.sid) })).filter(c => c.s && JSON.stringify(c.s.coll || {}) !== JSON.stringify(c.d.coll || {}) && summary(c.s) !== summary(c.d));
}

// Only these fields change: each goes back to the snapshot's value (or is removed if the snapshot didn't have it).
function restored(cur, snap, fields) {
  const out = {};
  fields.forEach(f => { if (snap[f] === undefined) { if (cur[f] !== undefined) out[f] = deleteField(); } else out[f] = snap[f]; });
  return out;
}
const gameFields = (cur, snap) => Array.from(new Set(Object.keys(clean(cur)).concat(Object.keys(snap)))).filter(f => !TEACHER_FIELDS.includes(f));

/* ----- clicks (returns true if handled) ----- */
export async function guardClick(el, ctx) {
  const a = el.dataset.g; if (!a) return false;
  const { students, cls, flash, render } = ctx;
  if (a === "require") { await updateDoc(classRef, { linksRequired: el.checked }); flash(el.checked ? "\u{1F512} Personal links required. The name list is hidden." : "The name list is back.", true); return true; }
  if (a === "loadKeys") { try { G.keys = await getKeys(); } catch (e) { flash("Couldn’t load links — " + (e.code || e.message)); } render(); return true; }
  if (a === "makeKeys") {
    const add = {}; students.forEach(s => { if (!G.keys[s.id]) add[s.id] = code(); });
    try { await setDoc(keysRef, add, { merge: true }); Object.assign(G.keys, add); flash("Made " + Object.keys(add).length + " personal links.", true); } catch (e) { flash("Couldn’t save — " + (e.code || e.message)); }
    render(); return true;
  }
  if (a === "copy" || a === "copyAll") {
    const txt = a === "copy" ? personalLink(el.dataset.id) : students.filter(s => G.keys[s.id]).map(s => (s.fullName || s.name) + "\t" + personalLink(s.id)).join("\n");
    try { await navigator.clipboard.writeText(txt); el.textContent = "Copied!"; setTimeout(render, 1400); } catch (e) { prompt("Copy this:", txt); }
    return true;
  }
  if (a === "reKey") {
    const id = el.dataset.id;
    if (G.confirm !== "re:" + id) { G.confirm = "re:" + id; render(); return true; }
    G.confirm = ""; const k = code();
    try {
      await setDoc(keysRef, { [id]: k }, { merge: true }); G.keys[id] = k;
      for (const x of G.seats.filter(x => x.sid === id)) await deleteDoc(seatRef(x.id));
      flash("New link made. The old one won’t work anymore — send them the new one.", true);
    } catch (e) { flash("Couldn’t change it — " + (e.code || e.message)); }
    render(); return true;
  }
  if (a === "find") { G.pick = (document.getElementById("gPick") || {}).value || ""; G.msg = ""; if (!G.pick) return true;
    try { G.snaps[G.pick] = (await snapsFor(G.pick)).sort((x, y) => String(y.stamp).localeCompare(String(x.stamp))); } catch (e) { flash("Couldn’t load snapshots — " + (e.code || e.message)); }
    render(); return true; }
  if (a === "snapNow") { const st = nowStamp();
    try { await snapAll(students, st, "saved by you"); await updateDoc(classRef, { snapStamps: addStamp(cls, st) }); flash("\u{1F4F8} Saved a snapshot of everyone.", true); } catch (e) { flash("Couldn’t save — " + (e.code || e.message)); }
    return true; }
  if (a === "undoC" || a === "undoA") {
    const key = (a === "undoC" ? "c:" : "a:") + el.dataset.sn;
    if (G.confirm !== key) { G.confirm = key; render(); return true; }
    G.confirm = "";
    const x = (G.snaps[G.pick] || []).find(y => y.id === el.dataset.sn), s = students.find(y => y.id === G.pick); if (!x || !s) return true;
    const snap = JSON.parse(x.json || "{}"), fields = a === "undoC" ? CREATURE_FIELDS : gameFields(s, snap), st = nowStamp();
    try {
      await setDoc(snapRef(st + "__" + s.id), { sid: s.id, stamp: st, name: s.fullName || s.name || "", tag: "before rollback", json: JSON.stringify(clean(s)) });
      const up = restored(s, snap, fields); if (Object.keys(up).length) await updateDoc(studentRef(s.id), up);
      G.msg = "⏪ " + s.name + (a === "undoC" ? "’s creatures are" : "’s game save is") + " back to " + when(x.stamp) + ". (Changed your mind? The version from just before is saved as “before rollback”.)";
      G.snaps[G.pick] = (await snapsFor(G.pick)).sort((p, q) => String(q.stamp).localeCompare(String(p.stamp)));
    } catch (e) { flash("Couldn’t roll back — " + (e.code || e.message)); }
    render(); return true;
  }
  if (a === "classFind") { G.stamp = (document.getElementById("gStamp") || {}).value || ""; G.confirm = "";
    try { G.classSnaps = await snapsAt(G.stamp); } catch (e) { flash("Couldn’t load — " + (e.code || e.message)); }
    render(); return true; }
  if (a === "classUndo") {
    if (G.confirm !== "class") { G.confirm = "class"; render(); return true; }
    G.confirm = ""; const ch = classChanges(students), st = nowStamp();
    try {
      await snapAll(ch.map(c => c.s), st, "before rollback");
      for (const c of ch) { const up = restored(c.s, c.d, CREATURE_FIELDS); if (Object.keys(up).length) await updateDoc(studentRef(c.s.id), up); }
      await updateDoc(classRef, { snapStamps: addStamp(cls, st) });
      G.msg = "⏪ Put back creatures for " + ch.length + " student" + (ch.length === 1 ? "" : "s") + " from " + when(G.stamp) + "."; G.classSnaps = null;
    } catch (e) { flash("Couldn’t roll back — " + (e.code || e.message)); }
    render(); return true;
  }
  return false;
}
export function guardInput(el) { if (el.id === "gPick") { G.pick = el.value; return true; } if (el.id === "gStamp") { G.stamp = el.value; G.classSnaps = null; return true; } return false; }

/* ----- public cards ----- (the console keeps every student's card and display name up to date; teacher writes only) */
let carding = false, cardAgain = false;
export async function syncCards(students) {
  if (!G.cards || !students.length) return;
  if (carding) { cardAgain = true; return; }
  carding = true;
  try {
    const have = {}; G.cards.forEach(c => { const x = Object.assign({}, c); delete x.id; have[c.id] = x; });
    const ops = [];
    students.forEach(s => {
      const pub = s.name || "";   // the console's display name (first name, + last initial if two share it)
      if (s.pubName !== pub) ops.push(["u", studentRef(s.id), { pubName: pub }]);
      const want = cardOf(Object.assign({}, s, { pubName: pub }));
      if (!have[s.id] || !sameData(want, have[s.id])) ops.push(["s", cardRef(s.id), want]);
    });
    Object.keys(have).forEach(id => { if (!students.some(s => s.id === id)) ops.push(["d", cardRef(id)]); });
    for (let i = 0; i < ops.length; i += 400) {
      const b = writeBatch(db);
      ops.slice(i, i + 400).forEach(([t, r, v]) => (t === "u" ? b.update(r, v) : t === "s" ? b.set(r, v) : b.delete(r)));
      await b.commit();
    }
  } catch (e) { console.warn("cards", e); }
  carding = false;
  if (cardAgain) { cardAgain = false; setTimeout(() => syncCards(students), 2000); }
}
