/* ---------- 🎨 Electives (Nov 4) ----------
   Every student has 3 electives (clubs). Each club has steps (Step 1, Step 2, …); finishing a step is a "submission".
   Ms. Ariana downloads the clubs-progress spreadsheet after each club day and uploads it on the console's Students tab
   (columns: student_name, club_name, step_name, status). Names are matched to the roster (anyone not on it is skipped),
   club names are matched to CLUBS (Lower / Upper Grades versions of a club count as the same club), and each step whose
   status is "done" is saved on the student (teacher-only): st.clubs = { key: { name, done: { "1": "Step 1: …" }, wip: "Step 2: …" } }.
   Steps only ever get added, never taken away by a later file.
   Rewards (given by the upload, so a student can't fake them): every new done step = a sticker + 1 egg (doorEggs);
   halfway through a club = a Rare+ egg (goalEggs "rare"); all steps = that club's own Ultra Legendary (CLUBS[key].ultra,
   once its art is in: added straight to the collection) + the club badge. Until the Ultra exists the finish is saved
   (clubUltra = { key: "waiting" }) and a later upload gives it.
   The student page shows each club's sticker book and the club egg that grows with every step; new stickers pop up
   once (clubSeen = { key: number of steps already celebrated }, the student's own field). */
import { esc } from "./game.js?v=20261109a";
import { family, creature } from "./collect.js?v=20261109a";

export const CLUB_STEPS = 6;   // 5 steps + the Final Challenge (Ms. Ariana, Nov 4); steps per club unless Ms. Ariana sets another number (cls.clubSteps[key])
export const CLUBS = {
  imagineers: { name: "Imagineers Club", icon: "\u{1F3A2}", color: "#E8456B", skill: "Critical Thinking, Creativity & Storytelling", goal: "Design an original theme park attraction",
    stickers: ["\u{1F3A2}", "\u{1F3A1}", "\u{1F3A0}", "\u{1F3F0}", "\u{1F386}", "\u{1F39F}️", "\u{1F5FA}️", "✨"], ultra: "L-66" },
  teamtrials: { name: "Team Trials", icon: "\u{1F9E9}", color: "#16A38A", skill: "Teamwork & Social Intelligence", goal: "Solve a Harvard CS50 puzzle challenge as a team",
    stickers: ["\u{1F9E9}", "\u{1F91D}", "\u{1F4A1}", "\u{1F50D}", "\u{1F9E0}", "\u{1F3C6}", "\u{1F5DD}️", "⭐"], ultra: "L-67" },
  popupshop: { name: "Pop-Up Shop", icon: "\u{1F3EA}", color: "#F08A24", skill: "Entrepreneurship", goal: "Make something strangers will pay for",
    stickers: ["\u{1F3EA}", "\u{1F4A1}", "\u{1F6E0}️", "\u{1F3F7}️", "\u{1F4E3}", "\u{1F6CD}️", "\u{1F4B0}", "\u{1F31F}"], ultra: "L-68" },
  impactmakers: { name: "Impact Makers", icon: "\u{1F30D}", color: "#2E9E4F", skill: "Teamwork & Social Intelligence", goal: "Make a real difference for your school, family or community",
    stickers: ["\u{1F30D}", "\u{1F91D}", "\u{1F49A}", "\u{1F331}", "\u{1F4CB}", "\u{1F64C}", "\u{1F3D8}️", "\u{1F31F}"], ultra: "L-69" },
  masterpiece: { name: "Masterpiece Club", icon: "\u{1F3A8}", color: "#8E44C9", skill: "Grit", goal: "Get your art on a wall that isn't yours",
    stickers: ["\u{1F3A8}", "\u{1F58C}️", "\u{1F58D}️", "\u{1F5BC}️", "✂️", "\u{1F308}", "\u{1F3DB}️", "✨"], ultra: "L-70" },
  eureka: { name: "Eureka Club", icon: "\u{1F9EA}", color: "#2F80ED", skill: "Critical Thinking", goal: "Learn something about the real world through an experiment",
    stickers: ["\u{1F9EA}", "\u{1F52C}", "\u{1F9EB}", "⚗️", "\u{1F4CA}", "\u{1F9F2}", "\u{1F4A1}", "\u{1F680}"], ultra: "L-71" },
  trainingcamp: { name: "Training Camp", icon: "⏱️", color: "#D64545", skill: "Grit", goal: "Set a physical goal and achieve it",
    stickers: ["⏱️", "\u{1F3CB}️", "\u{1F45F}", "\u{1F3C3}", "\u{1F4A7}", "\u{1F4AA}", "\u{1F947}", "\u{1F3C6}"], ultra: "L-72" },
  pixelstudio: { name: "Pixel Studio", icon: "\u{1F4BB}", color: "#3BAA3F", skill: "Coding & Digital Literacy", goal: "Build and launch a working game, app or website",
    stickers: ["\u{1F4BB}", "\u{1F3AE}", "\u{1F9F1}", "⌨️", "\u{1F41E}", "\u{1F5B1}️", "\u{1F680}", "\u{1F31F}"], ultra: "L-73" },
  english: { name: "Language Club", icon: "\u{1F5E3}️", color: "#C2185B", skill: "Ideas & Thinking", goal: "Pitch the one life skill every middle schooler should learn",
    stickers: ["\u{1F5E3}️", "\u{1F4DD}", "\u{1F4D6}", "\u{1F4A1}", "\u{1F3A4}", "\u{1F3AC}", "\u{1F44F}", "\u{1F31F}"], ultra: "L-74" }
};
// "Impact Makers - Lower Grades", "IMAGINEERS", "Eureka Club" → club key (or null)
export function clubKey(raw) {
  const s = String(raw || "").toLowerCase().replace(/\(.*?\)/g, " ").replace(/\b(lower|upper)\s*grades?\b/g, " ").replace(/\bclub\b/g, " ").replace(/[^a-z]/g, "");
  if (!s) return null;
  if (s.startsWith("imagineer")) return "imagineers";
  if (s.startsWith("teamtrial")) return "teamtrials";
  if (s.startsWith("popup")) return "popupshop";
  if (s.startsWith("impactmaker")) return "impactmakers";
  if (s.startsWith("masterpiece")) return "masterpiece";
  if (s.startsWith("eureka")) return "eureka";
  if (s.startsWith("trainingcamp")) return "trainingcamp";
  if (s.startsWith("pixel")) return "pixelstudio";
  if (s.startsWith("english") || s.startsWith("language")) return "english";
  return null;
}
export const CLUB_DEFAULT = { english: 30 };   // Language Club meets 3 times a week: 30 steps (Ms. Ariana, Nov 5)
export const clubSteps = (cls, k) => Math.max(1, Number(((cls && cls.clubSteps) || {})[k]) || CLUB_DEFAULT[k] || CLUB_STEPS);
/* Club picks (Nov 5): Ms. Ariana chooses each student's clubs on the console first (3 clubs, or Language Club only).
   Saved on the student as clubPick = ["imagineers", "eureka", "pixelstudio"] (teacher-only). The upload then only
   counts rows for a student's own clubs, and uses the picks to tell apart students with the same first name. */
export const LANG = "english";
// Eggs per finished step: 1, except Language Club (30 steps) = 1 egg for every 2 steps (Ms. Ariana, Nov 6)
export const EGG_EVERY = { english: 2 };
export const eggsFor = (k, n) => Math.floor((Number(n) || 0) / (EGG_EVERY[k] || 1));
export const clubPicks = st => [...new Set(((st && st.clubPick) || []).filter(k => CLUBS[k]))].slice(0, 3);
export const clubInfo = (st, k) => (((st && st.clubs) || {})[k]) || null;
export const doneCount = c => Object.keys((c && c.done) || {}).length;
const stepNo = name => { const m = /step\s*(\d+)/i.exec(String(name || "")); return m ? m[1] : null; };
const ultraOf = k => { const f = CLUBS[k] && CLUBS[k].ultra; return f && family(f) ? f : null; };

/* ---------- the upload (teacher console) ---------- */
const nk = k => String(k || "").trim().toLowerCase().replace(/[\s_]+/g, " ");
// rows: [{ "student name", "club name", "step name", "status" }] (keys already lowercased with spaces)
// match(name) → student or null. Returns { ups: [[sid, data, summary]], skipped: [names], unknownClubs: [names], rows }
export function clubUpload(rows, students, cls, match) {
  const per = {}, skipped = new Set(), unknown = new Set(), noPicks = new Set(), notMine = new Set();
  rows.forEach(r0 => {
    const r = {}; Object.keys(r0).forEach(k => { r[nk(k)] = r0[k]; });
    const name = String(r["student name"] || r.name || r.student || "").trim(), club = r["club name"] || r.club, step = String(r["step name"] || r.step || "").trim(), status = String(r.status || "").trim().toLowerCase();
    if (!name) return;
    const k = clubKey(club); if (!k) { if (club) unknown.add(String(club)); return; }
    const st = match(name, k); if (!st || !st.companionId) { skipped.add(name); return; }
    const picks = clubPicks(st);
    if (!picks.length) { noPicks.add(st.name); return; }
    if (!picks.includes(k)) { notMine.add(st.name + " (" + CLUBS[k].name + ")"); return; }
    const p = per[st.id] = per[st.id] || { st, clubs: {} }, c = p.clubs[k] = p.clubs[k] || { name: String(club).trim(), done: {}, wip: "" };
    const n = stepNo(step) || step.slice(0, 40);
    if (status === "done" || status === "complete" || status === "completed") c.done[n] = step.slice(0, 80);
    else if (step) c.wip = step.slice(0, 80);
  });
  const ups = [];
  Object.values(per).forEach(({ st, clubs }) => {
    const old = st.clubs || {}, data = {}, news = []; let eggs = 0, rare = 0, ultras = [], badges = {};
    const next = JSON.parse(JSON.stringify(old));
    Object.keys(clubs).forEach(k => {
      const o = next[k] || { name: clubs[k].name, done: {}, wip: "" }, before = doneCount(o), total = clubSteps(cls, k);
      Object.assign(o.done, clubs[k].done); o.wip = clubs[k].done[stepNo(clubs[k].wip) || ""] ? "" : clubs[k].wip || o.wip; o.name = o.name || clubs[k].name;
      const after = doneCount(o); next[k] = o;
      if (after > before) { eggs += eggsFor(k, after) - eggsFor(k, before); news.push(CLUBS[k].icon + " " + CLUBS[k].name + " +" + (after - before)); }
      if (before < Math.ceil(total / 2) && after >= Math.ceil(total / 2)) rare++;
      if (after >= total && !((st.clubUltra || {})[k])) ultras.push(k);
    });
    if (JSON.stringify(next) === JSON.stringify(old)) return;
    data.clubs = next;
    if (eggs) data.doorEggs = (Number(st.doorEggs) || 0) + eggs;
    if (rare) data.goalEggs = (st.goalEggs || []).concat(Array(rare).fill("rare"));
    if (ultras.length) {
      const cu = Object.assign({}, st.clubUltra || {}), coll = Object.assign({}, st.coll || {}); let gave = false;
      ultras.forEach(k => { const f = ultraOf(k); if (f && !coll[f]) { coll[f] = { lvl: 1, at: new Date().toISOString() }; cu[k] = "given"; gave = true; } else cu[k] = f ? "given" : "waiting"; badges["club-" + k] = new Date().toISOString(); });
      data.clubUltra = cu; if (gave) data.coll = coll;
    }
    ups.push([st.id, data, news.join(" · ")]);
  });
  return { ups, skipped: [...skipped], unknownClubs: [...unknown], noPicks: [...noPicks], notMine: [...notMine], rows: rows.length };
}
// After an Ultra's art is added: give every finished club its Ultra (clubUltra "waiting" → "given")
export function clubUltraCatchUp(students) {
  const ups = [];
  students.forEach(st => { const cu = st.clubUltra || {}; const coll = Object.assign({}, st.coll || {}), next = Object.assign({}, cu); let ch = false;
    Object.keys(cu).forEach(k => { if (cu[k] !== "waiting") return; const f = ultraOf(k); if (!f) return; if (!coll[f]) coll[f] = { lvl: 1, at: new Date().toISOString() }; next[k] = "given"; ch = true; });
    if (ch) ups.push([st.id, { clubUltra: next, coll }]); });
  return ups;
}

/* ---------- console: choose each student's clubs ---------- */
function pickerHTML(kids, busy) {
  const opts = sel => '<option value="">—</option>' + Object.keys(CLUBS).map(k => '<option value="' + k + '"' + (sel === k ? " selected" : "") + ">" + CLUBS[k].icon + " " + esc(CLUBS[k].name) + "</option>").join("");
  const set = kids.filter(s => { const p = clubPicks(s); return p[0] === LANG || p.length === 3; }).length;
  return '<details style="margin-top:12px;"' + (busy.clubPick ? " open" : "") + '><summary data-act="clubPickOpen"><b>\u{1F465} Choose each student’s clubs</b> <span class="muted small">(' + set + " of " + kids.length + " set)</span></summary>" +
    '<p class="small muted" style="margin:6px 0;">Pick 3 clubs per student. Choosing <b>Language Club</b> makes it their only club. Do this before uploading: the upload only counts each student’s own clubs.</p>' +
    '<div class="clubpicks">' + kids.map(s => { const p = clubPicks(s), lang = p[0] === LANG, ok = lang || p.length === 3;
      return '<div class="clubpickrow"><b>' + (ok ? "" : "⚠️ ") + esc(s.name) + "</b>" + (lang ? '<select data-clubpick="' + s.id + ':0">' + opts(LANG) + '</select><span class="muted small">Language Club only</span>'
        : [0, 1, 2].map(i => '<select data-clubpick="' + s.id + ":" + i + '">' + opts(p[i]) + "</select>").join("")) + "</div>"; }).join("") + "</div></details>";
}
// The new clubPick list after a dropdown change (slot i set to v)
export function pickChange(st, i, v) {
  const old = clubPicks(st); if (v === LANG) return [LANG];
  const p = old[0] === LANG ? ["", "", ""] : [0, 1, 2].map(j => old[j] || "");
  for (let j = 0; j < 3; j++) if (v && p[j] === v) p[j] = "";
  p[i] = v || "";
  return [...new Set(p.filter(Boolean))];
}

/* ---------- console card ---------- */
export function clubsAdmin(students, cls, busy) {
  const kids = students.filter(s => s.companionId), inClub = kids.filter(s => s.clubs && Object.keys(s.clubs).length);
  let h = '<div class="card" id="clubCard"><div class="card-head"><h2>\u{1F3A8} Clubs</h2><span class="fact">' + (inClub.length ? inClub.length + " students in clubs" : "no uploads yet") + "</span></div>" +
    '<p class="lede" style="font-size:13.5px;">After each club day, upload the <b>clubs progress</b> spreadsheet (CSV or XLSX). It reads <b>student_name</b>, <b>club_name</b>, <b>step_name</b> and <b>status</b>. ' +
    "Students not on your roster are skipped. Every step marked <b>done</b> gives that student a club sticker + an egg (Language Club: an egg every 2 steps); halfway through a club = a Rare+ egg; finishing a club = that club’s own \u{1F308} Ultra Legendary. Steps are only ever added, so uploading the same file twice is safe.</p>" +
    '<label class="btn" style="cursor:pointer;">\u{1F4C4} Upload club progress<input id="clubFile" type="file" accept=".csv,.xlsx,.xls" hidden></label>';
  const P = busy.clubPreview;
  if (P) {
    h += '<div class="banner info" style="margin-top:10px;display:block;"><b>' + P.ups.length + "</b> student" + (P.ups.length === 1 ? "" : "s") + " get new steps from " + P.rows + " rows." +
      (P.ups.length ? '<ul class="small" style="margin:6px 0 0 18px;">' + P.ups.slice(0, 30).map(([id, d, sum]) => "<li><b>" + esc((students.find(s => s.id === id) || {}).name || id) + "</b>: " + esc(sum || "updated") + (d.goalEggs ? " · \u{1F48E} Rare+ egg" : "") + (d.clubUltra ? " · \u{1F308} club finished!" : "") + "</li>").join("") + (P.ups.length > 30 ? "<li>…</li>" : "") + "</ul>" : "") +
      (P.skipped.length ? '<p class="small muted" style="margin:6px 0 0;">Skipped (not on your roster, or 2 students share that name in that club): ' + P.skipped.map(esc).join(", ") + "</p>" : "") +
      (P.noPicks && P.noPicks.length ? '<p class="small" style="margin:6px 0 0;">⚠️ No clubs chosen yet, so their rows were skipped (choose their clubs below, then upload again): ' + P.noPicks.map(esc).join(", ") + "</p>" : "") +
      (P.notMine && P.notMine.length ? '<p class="small muted" style="margin:6px 0 0;">Skipped, not one of their clubs: ' + P.notMine.map(esc).join(", ") + "</p>" : "") +
      (P.unknownClubs.length ? '<p class="small" style="margin:6px 0 0;">⚠️ Clubs I don’t know yet: ' + P.unknownClubs.map(esc).join(", ") + "</p>" : "") +
      '<div class="row" style="margin-top:8px;">' + (P.ups.length ? '<button class="btn small" data-act="clubSave">✅ Save ' + P.ups.length + "</button>" : "") + '<button class="btn ghost small" data-act="clubCancel">Cancel</button></div></div>';
  }
  h += pickerHTML(kids, busy);
  // per-club overview + steps per club
  const by = {}; inClub.forEach(s => Object.keys(s.clubs).forEach(k => { (by[k] = by[k] || []).push(s); }));
  const keys = Object.keys(CLUBS).filter(k => by[k]);
  if (keys.length) h += '<details style="margin-top:12px;"' + (busy.clubList ? " open" : "") + '><summary data-act="clubList"><b>Clubs</b> <span class="muted small">(' + keys.length + ")</span></summary>" +
    keys.map(k => { const C = CLUBS[k], tot = clubSteps(cls, k), list = by[k].slice().sort((a, b) => doneCount(b.clubs[k]) - doneCount(a.clubs[k]));
      return '<div style="margin:10px 0;"><b>' + C.icon + " " + esc(C.name) + '</b> <span class="muted small">' + list.length + ' students · steps: </span><input type="number" min="1" max="40" value="' + tot + '" data-clubsteps="' + k + '" style="width:60px;"> ' +
        '<span class="muted small">' + (ultraOf(k) ? "\u{1F308} Ultra ready" : "\u{1F308} Ultra art not in yet (finishers get it later)") + "</span>" +
        '<div class="small" style="margin-top:4px;">' + list.map(s => esc(s.name) + " " + doneCount(s.clubs[k]) + "/" + tot).join(" · ") + "</div></div>"; }).join("") + "</details>";
  return h + "</div>";
}

/* ---------- student tab ---------- */
const eggStage = (n, tot) => (n >= tot ? 4 : Math.min(3, Math.floor(n / tot * 4)));
const EGG_LINES = ["Your club egg is waiting…", "It wiggled! \u{1F95A}", "A crack! Something's inside…", "It's about to hatch!!", "HATCHED!"];
// The stamp book (assets/clubs/stamp-book.webp): 5 round spots + the star (Final Challenge), [left %, top %] of each spot's middle.
// A stamp picture assets/clubs/stamp-KEY-N.webp is used once it's in STAMP_ART; until then the club's emoji sticker is stamped.
const BOOK_SPOTS = [[23.2, 31.5], [49.8, 31.8], [76, 31.5], [23.3, 69.1], [49.2, 69.2], [75.6, 69.5]];
export const STAMP_ART = { imagineers: true, teamtrials: true, impactmakers: true, popupshop: true, masterpiece: true, eureka: true, pixelstudio: true, english: true, trainingcamp: true };   // clubs whose stamp-KEY-1…6.webp are uploaded
const PER = BOOK_SPOTS.length, PAGE = {};   // a club with more than 6 steps gets a stamp book with pages of 6 (each page ends on the star)
export const clubPageSet = (k, p) => { PAGE[k] = p; };
function bookHTML(k, C, c, tot, n, nums, seenN) {
  const pages = Math.ceil(tot / PER), def = Math.floor(Math.min(tot - 1, Math.max(0, n > seenN ? seenN : n - 1)) / PER);
  const pg = Math.max(0, Math.min(pages - 1, PAGE[k] == null ? def : PAGE[k])), start = pg * PER, end = Math.min(tot, start + PER);
  const stamp = (i, slot) => STAMP_ART[k] ? '<img src="assets/clubs/stamp-' + k + "-" + (slot + 1) + '.webp" alt="">' : '<b>' + (i === tot - 1 ? "\u{1F3C6}" : C.stickers[i % C.stickers.length]) + "</b>";
  const title = i => esc((i < n ? c.done[nums[i]] : "") || (i === tot - 1 ? "Final Challenge" : "Step " + (i + 1)));
  let spots = "";
  for (let i = start; i < end; i++) {
    const slot = end - start === PER || i < end - 1 ? i - start : PER - 1, [x, y] = BOOK_SPOTS[slot];
    spots += '<span class="sbspot' + (slot === PER - 1 ? " star" : "") + (i < n ? " on" + (i >= seenN ? " pop" : "") : "") + '" style="left:' + x + "%;top:" + y + '%" title="' + title(i) + '">' + (i < n ? stamp(i, slot) : "") + "</span>";
  }
  const nav = pages > 1 ? '<div class="sbnav"><button class="btn ghost small" data-clubpg="' + k + ":" + (pg - 1) + '"' + (pg ? "" : " disabled") + '>◀</button><span>Page ' + (pg + 1) + " of " + pages + '</span><button class="btn ghost small" data-clubpg="' + k + ":" + (pg + 1) + '"' + (pg < pages - 1 ? "" : " disabled") + ">▶</button></div>" : "";
  return '<div class="sbwrap"><div class="clubstampbook"><img class="sbook" src="assets/clubs/stamp-book.webp" alt="">' + spots + "</div>" + nav + "</div>";
}
// crack lines drawn over the club egg as it gets closer to hatching
const CRACK = stg => '<svg class="eggcrack" viewBox="0 0 100 120" aria-hidden="true"><path d="M30 38 L40 46 L34 54 L46 60' + (stg >= 3 ? ' L40 70 L52 78 M60 30 L56 42 L66 48 L60 58 M46 60 L58 64' : "") + '" fill="none" stroke="#3a2a1a" stroke-width="' + (stg >= 3 ? 2.6 : 2) + '" stroke-linecap="round" stroke-linejoin="round" opacity=".75"/></svg>';
export function clubsTab(st, cls) {
  const ks = [...new Set(clubPicks(st).concat(Object.keys((st && st.clubs) || {})))].filter(k => CLUBS[k]);
  let h = '<div class="card"><div class="card-head"><h2>\u{1F3A8} My Clubs</h2></div><p class="lede">Every step you finish in a club earns that club’s <b>sticker</b> and an <b>egg</b>' + (clubPicks(st).includes(LANG) ? " (Language Club: an egg every 2 steps)" : "") + '. Halfway through = a \u{1F48E} Rare+ egg. Finish every step and your club egg hatches the club’s own <b>\u{1F308} Ultra Legendary</b> — only club members can get it!</p></div>';
  if (!ks.length) return h + '<div class="card"><p class="lede">Your clubs show up here once Ms. Ariana sets them. Keep working on your clubs!</p></div>';
  const seen = (st && st.clubSeen) || {};
  ks.forEach(k => {
    const C = CLUBS[k], c = (st.clubs && st.clubs[k]) || { done: {}, wip: "" }, tot = clubSteps(cls, k), n = doneCount(c), stg = eggStage(n, tot), f = ultraOf(k), fam = f && family(f);
    const nums = Object.keys(c.done || {}).sort((a, b) => Number(a) - Number(b) || String(a).localeCompare(String(b)));
    const fresh = n > (Number(seen[k]) || 0);
    h += '<div class="card clubcard' + (fresh ? " fresh" : "") + '" style="--cc:' + C.color + '"><div class="clubhead"><span class="clubic">' + C.icon + '</span><div><h3>' + esc(C.name) + '</h3><small>' + esc(C.goal) + " · " + esc(C.skill) + "</small></div><b class=\"clubn\">" + n + " / " + tot + "</b></div>" +
      '<div class="clubbody">' + bookHTML(k, C, c, tot, n, nums, fresh ? (Number(seen[k]) || 0) : n) +
      '<div class="clubegg st' + stg + '"><span class="clubeggimg">' + (stg === 4 && fam ? '<img src="' + esc(creature(fam.forms[0]).img) + '" alt="">' : stg === 4 ? "\u{1F308}" :
        '<img src="assets/clubs/egg-' + k + '.webp" alt="" onerror="this.replaceWith(\'\u{1F95A}\')">' + (stg >= 2 ? CRACK(stg) : "")) + "</span><small>" + (stg === 4 ? (f ? "Your " + C.name + " Ultra is in your collection!" : "You finished! Your club Ultra is on its way \u{1F308}") : EGG_LINES[stg]) + "</small></div></div>" +
      (c.wip ? '<p class="small muted" style="margin:6px 0 0;">\u{1F6E0}️ Working on: ' + esc(c.wip) + "</p>" : "") +
      (fresh ? '<div class="row" style="margin-top:8px;"><span class="clubnew">\u{1F389} New sticker' + (n - (Number(seen[k]) || 0) === 1 ? "" : "s") + "!" + (eggsFor(k, n) - eggsFor(k, seen[k]) ? " +" + (eggsFor(k, n) - eggsFor(k, seen[k])) + " egg" + (eggsFor(k, n) - eggsFor(k, seen[k]) === 1 ? "" : "s") + " added to your Collector." : " One more step for your next egg!") + '</span><button class="btn small" data-clubseen="' + k + '">Yay!</button></div>' : "") + "</div>";
  });
  return h;
}
export const clubsNew = st => Object.keys((st && st.clubs) || {}).filter(k => CLUBS[k] && doneCount(st.clubs[k]) > (Number(((st.clubSeen) || {})[k]) || 0)).length;
