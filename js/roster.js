/* ---------- 🔑 School Google sign-in, Step A (Nov 6) ----------
   Students can sign in with their school Google account (@unbound.school) instead of a personal link.
   Ms. Ariana uploads (or types) each student's school email. That saves roster/{email} = { classId, sid, name }
   (teacher-only; a student can read only their own). When a student signs in with Google, the page reads their
   roster doc and sits that device down as that student (seats/{uid} = { sid, email, at }, checked by the rules
   against the roster), so they open their own existing save — no progress moves anywhere.
   Personal links keep working exactly as before. One roster doc per student; reads only when the card is opened. */
import { esc } from "./game.js?v=20261109a";
import { SCHOOL_DOMAIN } from "./db.js?v=20261109a";

export const okEmail = e => new RegExp("^[^@\\s]+@" + SCHOOL_DOMAIN.replace(/\./g, "\\.") + "$", "i").test(String(e || "").trim());
const EMAIL_KEYS = ["email", "student email", "school email", "e-mail", "email address", "google email"];
const NAME_KEYS = ["student name", "name", "student", "full name", "learner"];

// rows (keys already lowercased) → { pairs: [[sid, email, name]], unmatched: [names], bad: [emails], dupes: [names] }
export function rosterPreview(rows, students, match) {
  const keys = rows.length ? Object.keys(rows[0]) : [];
  const ek = EMAIL_KEYS.find(k => keys.includes(k)) || keys.find(k => k.includes("email"));
  let nk = NAME_KEYS.find(k => keys.includes(k));
  const first = keys.find(k => /first/.test(k)), last = keys.find(k => /last/.test(k));
  if (!ek) return { err: "I couldn’t find an email column. The file needs a column called “email” and one with the student’s name." };
  if (!nk && !first) return { err: "I couldn’t find a name column (like “student name”, or “first name” + “last name”)." };
  const pairs = [], unmatched = [], bad = [], dupes = [], seen = {}, news = [], seenNew = {};
  rows.forEach(r => {
    const email = String(r[ek] || "").trim().toLowerCase(), name = nk ? String(r[nk] || "").trim() : (String(r[first] || "") + " " + String(r[last] || "")).trim();
    if (!email && !name) return;
    if (!okEmail(email)) { bad.push((name ? name + ": " : "") + (email || "(no email)")); return; }
    const st = match(name) || students.find(s => String(s.fullName || s.name || "").trim().toLowerCase() === name.toLowerCase());
    if (!st || st.isTeacher) { unmatched.push(name || email); if (name && !seenNew[email]) { seenNew[email] = true; news.push([name, email]); } return; }
    if (seen[st.id]) { dupes.push(st.name); return; }
    seen[st.id] = true; pairs.push([st.id, email, st.name]);
  });
  return { pairs, unmatched, bad, dupes, news, addNew: !students.some(s => !s.isTeacher) };   // a brand-new class: add everyone by default
}

export function rosterAdmin(students, busy) {
  const kids = students.filter(s => !s.isTeacher), R = busy.roster, P = busy.rosterPreview;
  const bySid = {}; (R ? R.list : []).forEach(x => { bySid[x.sid] = x; });
  const signed = {}; (R ? R.seats : []).forEach(x => { if (x.email) signed[x.sid] = true; });
  let h = '<div class="card" id="rosterCard"><div class="card-head"><h2>\u{1F511} School Google sign-in</h2><span class="fact">' +
    (R ? Object.keys(bySid).length + " of " + kids.length + " emails set" : "new") + "</span></div>" +
    '<p class="lede" style="font-size:13.5px;">Students can sign in with their <b>@' + esc(SCHOOL_DOMAIN) + "</b> Google account instead of a personal link. " +
    "Add each student’s school email once (upload a spreadsheet with a <b>name</b> and an <b>email</b> column, or type them below). " +
    "Signing in opens their <b>same save</b>, so nobody loses progress. <b>Personal links are turned off</b>: students sign in with Google only.</p>" +
    '<div class="row" style="gap:8px;margin:8px 0;"><label class="btn" style="cursor:pointer;">\u{1F4C4} Upload student emails<input id="rosterEmailFile" type="file" accept=".csv,.xlsx,.xls" hidden></label>' +
    '<button class="btn ghost" data-act="rosLoad">' + (R ? "↻ Refresh" : "\u{1F465} Show emails") + "</button>" +
    '<button class="btn ghost" data-act="rosKick"' + (busy.rosKickSure ? ' style="background:#B23B3B;color:#fff;"' : "") + ">" + (busy.rosKickSure ? "Yes, sign out all personal links" : "\u{1F6AA} Sign out all personal links") + "</button></div>";
  if (busy.rosterMsg) h += '<div class="banner ' + (busy.rosterMsg.bad ? "bad" : "info") + '" style="display:block;margin:8px 0;">' + esc(busy.rosterMsg.text) + "</div>";
  if (P) {
    if (P.err) h += '<div class="banner bad" style="display:block;">' + esc(P.err) + "</div>";
    else h += '<div class="banner info" style="display:block;margin-top:8px;"><b>' + P.pairs.length + "</b> student" + (P.pairs.length === 1 ? "" : "s") + " matched." +
      (P.pairs.length ? '<ul class="small" style="margin:6px 0 0 18px;columns:2;">' + P.pairs.map(([, e, n]) => "<li><b>" + esc(n) + "</b>: " + esc(e) + "</li>").join("") + "</ul>" : "") +
      (P.unmatched.length ? '<p class="small" style="margin:6px 0 0;">' + (P.addNew ? "➕ <b>New students</b> (will be added to your class): " : "⚠️ Not on your roster: ") + P.unmatched.map(esc).join(", ") + "</p>" +
        (P.news.length ? '<label class="small" style="display:block;margin:4px 0 0;"><input type="checkbox" id="rosAddNew"' + (P.addNew ? " checked" : "") + "> Add " + (P.news.length === 1 ? "them" : "these " + P.news.length) + " as new students</label>" : "") : "") +
      (P.bad.length ? '<p class="small" style="margin:6px 0 0;">⚠️ Not an @' + esc(SCHOOL_DOMAIN) + " email (skipped): " + P.bad.map(esc).join(", ") + "</p>" : "") +
      (P.dupes.length ? '<p class="small muted" style="margin:6px 0 0;">Listed twice (kept the first): ' + P.dupes.map(esc).join(", ") + "</p>" : "") +
      '<div class="row" style="margin-top:8px;">' + (P.pairs.length || (P.addNew && P.news.length) ? '<button class="btn small" data-act="rosSave"' + (busy.rosterSaving ? " disabled" : "") + ">" + (busy.rosterSaving ? "Saving…" : "✅ Save " + (P.pairs.length + (P.addNew ? P.news.length : 0))) + "</button>" : "") + '<button class="btn ghost small" data-act="rosCancel">Cancel</button></div></div>';
  }
  if (R) h += '<div class="rostlist">' + kids.map(s => { const x = bySid[s.id];
    return '<div class="rostrow"><b>' + esc(s.name) + '</b><input type="email" placeholder="name@' + esc(SCHOOL_DOMAIN) + '" value="' + esc(x ? x.email : "") + '" data-rosemail="' + s.id + '">' +
      '<span class="small ' + (signed[s.id] ? "" : "muted") + '">' + (signed[s.id] ? "✅ signed in" : x ? "not signed in yet" : "") + "</span></div>"; }).join("") + "</div>" +
    '<p class="small muted" style="margin:8px 0 0;">Type or change an email and press Enter (or click away) to save it. Clear the box to remove it.</p>';
  return h + "</div>";
}
