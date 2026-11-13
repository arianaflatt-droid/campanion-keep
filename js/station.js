/* ---------- 🛰️ The Class Space Station (built Nov 11, plan: claude/space-station-plan.md) ----------
   A place on the Planet JP map. The whole class builds ONE station a semester by donating Stardust.
   - A new station every semester: "2026-fall" (Aug–Dec) and "2027-spring" (Jan–Jul). The fall station closes on the first
     day of winter break on the class calendar (or Dec 19 if none is marked). After that: reached stages stay, rewards for
     them can still be claimed, donating stops.
   - Goal G = per-student goal × students (fall 450, spring 750). 5 stages at 1/15, 1/5, 2/5, 2/3 and all of G.
   - Crew = 250+ donated this semester. Only crew claim stage rewards (anyone who reaches 250 later can still claim stages
     already reached). Ranks: Cadet 250, Engineer 500, Captain 1,000. The crew list shows names + rank only, no amounts.
   - Rewards: 1 a free Mystery Space Crate · 2 a creature egg (doorEggs +1) · 3 Double Stardust (next launch: launch + game ×2)
     · 4 a Rare egg (goalEggs "rare") · 5 Astro (a station-only Nebble) + Station Complete badge.
   - The finished station: the student's own painted S.S. Duck sits on the docking pad and their Nebbles float around it.
   Saved on each student: planet.stn = { s: station id, g: given, got: { stage: 1 }, dd: 1 (Double Stardust waiting) or the date used }
   through safari.js planetSave: one write per donation, one per claim. The class total = the sum of classmates' public cards
   (already read for the page), so no new reads and no class-document writes. */
import { esc } from "./game.js?v=20261113e";
import { azToday } from "./collect.js?v=20261113e";
import { planetNow, planetSave, planetCtx, freshSt } from "./safari.js?v=20261113e";
import { breakRuns } from "./calendar.js?v=20261113e";
import { duckImgOf } from "./shop-data.js?v=20261113e";
import { ownedOf, nebHTML, NEB, PERSONALITIES } from "./pets.js?v=20261113e";
import { openCrateFree } from "./spaceshop.js?v=20261113e";

const S = "assets/planet/station/";
export const STN_FALL = 450, STN_SPRING = 750, STN_CREW = 250;
export const RANKS = [[1000, "\u{1F468}‍✈️", "Captain"], [500, "\u{1F527}", "Engineer"], [250, "\u{1F9D1}‍\u{1F680}", "Cadet"]];
export const STAGES = [
  { f: 1 / 15, name: "Core Module", rw: "\u{1F381} a free Mystery Space Crate" },
  { f: 1 / 5, name: "Solar Wings", rw: "\u{1F95A} a creature egg" },
  { f: 2 / 5, name: "Greenhouse Dome", rw: "⭐ Double Stardust on your next launch" },
  { f: 2 / 3, name: "Observatory", rw: "\u{1F95A} a Rare egg" },
  { f: 1, name: "Docking Bay", rw: "\u{1F43E} Astro, the station Nebble" }];
const DOCK = { x: 64.5, y: 62, w: 11 };   // the empty docking pad on station-5.webp (% of the picture)

/* ----- which station, when it closes ----- */
export function stationId(d) { const y = Number(String(d).slice(0, 4)), m = Number(String(d).slice(5, 7)); return m >= 8 ? y + "-fall" : y + "-spring"; }
export function fallClose(cls, y) {
  const run = breakRuns(cls).find(r => r.start >= y + "-12-01" && r.start <= y + "-12-31" && (r.days.length >= 3 || /winter|christmas|holiday/i.test(r.label)));
  return run ? run.start : y + "-12-19";
}
export function stationOpen(cls, d) { d = d || azToday(); const id = stationId(d); return id.endsWith("-spring") || d < fallClose(cls, id.slice(0, 4)); }
const perStudent = id => id.endsWith("-fall") ? STN_FALL : STN_SPRING;
const r50 = n => Math.max(50, Math.round(n / 50) * 50);
export function goalOf(cls, count, id) { const G = perStudent(id) * Math.max(1, count); return STAGES.map(s => r50(G * s.f)); }

/* ----- saves ----- */
const pl = st => (st && st.planet) || {};
export function stnOf(st, id) { const s = pl(st).stn || {}; return s.s === id ? { s: id, g: Number(s.g) || 0, got: Object.assign({}, s.got || {}), dd: s.dd || 0 } : { s: id, g: 0, got: {}, dd: s.dd || 0 }; }
export const rankOf = g => RANKS.find(r => g >= r[0]) || null;
const kidsOf = students => (students || []).filter(s => s && s.companionId);
export function classTotal(students, id, me) {
  return kidsOf(students).reduce((a, s) => a + (me && s.id === me.id ? stnOf(me, id).g : stnOf(s, id).g), 0);
}
export const stageReached = (total, goals) => goals.filter(g => total >= g).length;
// Double Stardust: planet.js asks this at launch (dd 1 = waiting → set to the launch date) and at the game results
export const doubleWaiting = planet => !!(planet && planet.stn && planet.stn.dd === 1);

/* ----- the page state (nothing here is saved) ----- */
let msg = null, done = null, custom = "", lastStudents = [];
const rer = () => { const c = planetCtx(); if (c && c.rerender) c.rerender(); };

function donate(n) {
  const c = planetCtx(); if (!c || !c.st) return;
  const d = azToday(), id = stationId(d); if (!stationOpen(c.cls, d)) return;
  const p = planetNow(), dust = Number(p.dust) || 0; n = Math.floor(Number(n) || 0);
  if (n < 1) { msg = { bad: 1, text: "Pick how much Stardust to give." }; return rer(); }
  if (n > dust) { msg = { bad: 1, text: "You only have " + dust + " ⭐ Stardust." }; return rer(); }
  if (n >= 100 && typeof confirm === "function" && !confirm("Give " + n + " ⭐ Stardust to the class Space Station?")) return;
  const students = lastStudents, goals = goalOf(c.cls, kidsOf(students).length, id), before = classTotal(students, id, c.st);
  const s = stnOf(c.st, id); s.g += n; p.dust = dust - n; p.stn = s;
  planetSave(p);
  const after = before + n, st0 = stageReached(before, goals), st1 = stageReached(after, goals);
  const wasCrew = s.g - n >= STN_CREW;
  msg = { text: "\u{1F680} Thank you! You gave <b>" + n + " ⭐</b> to the station." + (!wasCrew && s.g >= STN_CREW ? " \u{1F389} You joined the <b>Station Crew</b>!" : "") + (c.preview ? " (Preview: nothing was saved.)" : "") };
  if (st1 > st0) done = st1;
  custom = ""; rer();
}
function claim(i) {
  const c = planetCtx(); if (!c || !c.st) return;
  const d = azToday(), id = stationId(d), st = freshSt(c.st), s = stnOf(st, id), students = lastStudents;
  const goals = goalOf(c.cls, kidsOf(students).length, id), reached = stageReached(classTotal(students, id, st), goals);
  if (s.g < STN_CREW || i > reached || s.got[i]) return;
  if (i === 1) { const m = openCrateFree(p => { p.stn = Object.assign(stnOf({ planet: p }, id), { got: Object.assign({}, s.got, { 1: 1 }) }); });
    msg = m ? { text: (m.crate ? '<img class="stnpop" src="' + m.crate + '" alt=""> ' : "") + m.text } : null; rer(); return; }
  const p = planetNow(); s.got[i] = 1; p.stn = s; let extra = null, text = "";
  if (i === 2) { extra = { doorEggs: (Number(st.doorEggs) || 0) + 1 }; text = "\u{1F95A} A creature egg is waiting for you in the <b>Creature Collector</b>!"; }
  if (i === 3) { s.dd = 1; text = "⭐ <b>Double Stardust</b> is ready! Your next launch pays double (launch bonus + game)."; }
  if (i === 4) { extra = { goalEggs: (st.goalEggs || []).concat(["rare"]) }; text = "\u{1F48E} A <b>Rare-or-better egg</b> is waiting in the Creature Collector!"; }
  if (i === 5) { const pets = Object.assign({}, p.pets || {}), o = Object.assign({}, pets.o || {});
    if (!o.astro) o.astro = { n: "Astro", p: PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)].k, h: "", at: d };
    pets.o = o; p.pets = pets; text = "\u{1F43E} <b>Astro</b> joined your Nebbles! Find Astro in the Special row of My Nebbles."; }
  planetSave(p, extra); msg = { text: text + (c.preview ? " (Preview: nothing was saved.)" : "") }; rer();
}

if (typeof document !== "undefined") {
  document.addEventListener("click", ev => {
    const t = ev.target.closest && ev.target.closest("[data-stn]"); if (!t) return;
    const [a, v] = t.dataset.stn.split(":");
    if (a === "give") { const n = v === "c" ? Number((document.getElementById("stncustom") || {}).value) : Number(v); donate(n); }
    else if (a === "claim") claim(Number(v));
    else if (a === "ok") { done = null; rer(); }
  });
  document.addEventListener("input", ev => { if (ev.target && ev.target.id === "stncustom") custom = ev.target.value; });
}

/* ----- the page ----- */
function scene(stage, st) {
  const n = Math.max(1, stage), img = n >= 5 ? "station-5" : "station-" + n;
  let h = '<div class="stnscene" style="background-image:url(' + S + img + '.webp)">';
  if (stage >= 5) {
    h += '<img class="stnduck" src="' + duckImgOf(st) + '" alt="Your S.S. Duck" style="left:' + DOCK.x + "%;top:" + DOCK.y + "%;width:" + DOCK.w + '%">';
    const mine = Object.keys(ownedOf(st)).filter(k => NEB[k]);
    mine.slice(0, 12).forEach((k, i) => { const a = (i + 0.5) / Math.min(12, mine.length) * Math.PI * 2 - Math.PI / 2;
      h += '<span class="stnneb" style="left:' + (50 + Math.cos(a) * 41).toFixed(1) + "%;top:" + (50 + Math.sin(a) * 39).toFixed(1) + "%;animation-delay:-" + (i * 0.7).toFixed(1) + 's">' + nebHTML(k, { hat: (ownedOf(st)[k] || {}).h }) + "</span>"; });
  }
  if (stage < 1) h += '<div class="stnempty">\u{1F6E0}️ Waiting for the first part…</div>';
  return h + "</div>";
}
export function stationHTML(st, cls, students, open) {
  st = freshSt(st); lastStudents = students || []; const d = azToday(), id = stationId(d), isOpen = stationOpen(cls, d);
  const kids = kidsOf(students), goals = goalOf(cls, kids.length, id), total = classTotal(students, id, st), stage = stageReached(total, goals);
  const me = stnOf(st, id), rank = rankOf(me.g), dust = Number(pl(st).dust) || 0, crew = me.g >= STN_CREW;
  const next = goals[stage], prevG = stage ? goals[stage - 1] : 0, pct = next ? Math.min(100, (total - prevG) / (next - prevG) * 100) : 100;
  const sem = id.endsWith("-fall") ? "Fall " + id.slice(0, 4) : "Spring " + id.slice(0, 4);
  const eng = done ? "se-cheer" : stage >= 5 ? "se-cheer" : "se-fix";
  const say = done ? "<b>STAGE " + done + " COMPLETE!</b> We built the <b>" + STAGES[done - 1].name + "</b>! " + (crew ? "Claim your reward below!" : "Give " + (STN_CREW - me.g) + " more Stardust to join the crew and claim it!")
    : !isOpen ? "The " + sem + " station is closed for winter break. Look what we built together! A new station starts in January."
    : stage >= 5 ? "We finished the whole station! Your duck is docked and your Nebbles came to visit!"
    : "Every Stardust you give helps the class build the next part: the <b>" + STAGES[stage].name + "</b>!";
  let h = '<div class="card stncard"><div class="card-head"><h2>\u{1F6F0}️ Class Space Station</h2><span class="fact">' + sem + " · Stage " + stage + " of 5</span></div>";
  if (done) h += '<div class="stnboom"><b>\u{1F389} STAGE ' + done + " COMPLETE! \u{1F389}</b><span>" + esc(STAGES[done - 1].name) + '</span><button class="btn gold small" data-stn="ok">Yay!</button></div>';
  h += '<div class="stntop">' + scene(stage, st) +
    '<div class="stnside"><div class="stntank"><img src="' + S + 'stardust-tank.webp" alt=""><i style="height:' + (pct * 0.66).toFixed(1) + '%"></i></div>' +
    '<div class="stnnums"><b>' + total.toLocaleString() + " ⭐</b><span>given by the class</span>" + (next ? "<span><b>" + (next - total).toLocaleString() + "</b> more to Stage " + (stage + 1) + "</span>" : "<span>Station complete! \u{1F389}</span>") + "</div></div></div>";
  h += '<div class="stnduckrow"><img class="stnse" src="' + S + eng + '.webp" alt="The Station Engineer"><div class="kdsay stnsay"><b>Alien Duck, Station Engineer:</b> ' + say + "</div></div>";
  // donate
  if (isOpen) h += '<div class="stngive"><b>Give Stardust</b> <span class="muted small">You have ⭐ ' + dust + "</span><div class=\"row\" style=\"gap:6px;flex-wrap:wrap;margin-top:6px;\">" +
    [25, 50, 100].map(n => '<button class="btn small' + (open && dust >= n ? " gold" : " ghost") + '" data-stn="give:' + n + '"' + (open && dust >= n ? "" : " disabled") + ">" + n + " ⭐</button>").join("") +
    '<input id="stncustom" type="number" min="1" max="' + dust + '" placeholder="Other" value="' + esc(custom) + '" style="width:90px;"' + (open ? "" : " disabled") + '><button class="btn small ghost" data-stn="give:c"' + (open ? "" : " disabled") + ">Give</button></div>" +
    (open ? "" : '<p class="small muted" style="margin:6px 0 0;">You can give Stardust while Planet JP is open.</p>') + "</div>";
  if (msg) h += '<p class="' + (msg.bad ? "bad" : "good") + '" style="margin:8px 0 0;">' + msg.text + "</p>";
  // me + rewards
  h += '<div class="stnme"><span>' + (rank ? rank[1] + " <b>Station " + rank[2] + "</b>" : "\u{1F9D1}‍\u{1F680} Not on the crew yet") + "</span><span class=\"muted small\">You gave " + me.g + " ⭐ this semester" +
    (crew ? "" : " · " + (STN_CREW - me.g) + " more to join the crew") + "</span></div>";
  h += '<div class="stnstages">' + STAGES.map((s, i) => { const n = i + 1, got = me.got[n], reached = n <= stage, can = reached && crew && !got;
    return '<div class="stnstage' + (reached ? " on" : "") + '"><b>' + n + ". " + esc(s.name) + '</b><span class="small">' + goals[i].toLocaleString() + " ⭐ · " + s.rw + "</span>" +
      (got ? '<span class="stngot">✅ Claimed</span>' : can ? '<button class="btn gold small" data-stn="claim:' + n + '">Claim!</button>' : reached ? '<span class="small muted">Crew only</span>' : '<span class="small muted">\u{1F512}</span>') + "</div>"; }).join("") + "</div>";
  // crew list: names + rank, no amounts
  const crewList = kids.map(s => ({ s, g: s.id === st.id ? me.g : stnOf(s, id).g })).filter(x => x.g >= STN_CREW).sort((a, b) => b.g - a.g);
  h += '<div class="stncrew"><b>\u{1F9D1}‍\u{1F680} The Crew (' + crewList.length + ")</b> " + (crewList.length ? crewList.map(x => { const r = rankOf(x.g); return '<span class="stncm">' + r[1] + " " + esc(x.s.name || "") + "</span>"; }).join("") : '<span class="muted small">Nobody yet. Give 250 ⭐ this semester to be first!</span>') + "</div>";
  return h + "</div>";
}

/* ----- console: a line on the Planet JP card ----- */
export function stationAdminLine(students, cls) {
  const d = azToday(), id = stationId(d), kids = kidsOf(students), goals = goalOf(cls, kids.length, id), total = classTotal(students, id), stage = stageReached(total, goals);
  const crew = kids.filter(s => stnOf(s, id).g >= STN_CREW).length, open = stationOpen(cls, d);
  const close = id.endsWith("-fall") ? fallClose(cls, id.slice(0, 4)) : null, days = close ? Math.max(0, Math.round((Date.parse(close) - Date.parse(d)) / 864e5)) : null;
  return '<p class="small" style="margin:6px 0 0;">\u{1F6F0}️ <b>Space Station</b> (' + (id.endsWith("-fall") ? "Fall" : "Spring") + "): " + total.toLocaleString() + " / " + goals[4].toLocaleString() + " ⭐ · Stage " + stage + " of 5 · " + crew + " crew" +
    (open ? (days != null ? " · closes in " + days + " days (first day of winter break, " + close + ")" : "") : " · closed for the semester") + "</p>";
}
