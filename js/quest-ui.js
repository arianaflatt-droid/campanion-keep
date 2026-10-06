// Grade Level Quest screens: the student's road + guardian battles, and the teacher's tracker.
import { esc } from "./game.js?v=20261006g";
import { owned, ownedFams, fighterFrom, formOf, resolveRound, hitDamage, alive, MOVES, RARITY_COLOR } from "./collect.js?v=20261006g";
import { SUBJECTS, GRADES, ROAD_SPOTS, roadArt, battleArt, QUEST_XP, QUEST_CP, WEAPON_KINDS, weapon, weaponId, qKey, startOf, passOf, doneOf,
  testState, currentGrade, doneCount, readyTests, weaponsOwned, heldWeapon } from "./quest.js?v=20261006g";

const SUBJ = Object.fromEntries(SUBJECTS.map(([k, n, i]) => [k, { n, i }]));
let qb = null;   // the guardian battle in progress (only on this page; nothing is saved until the student wins)
export const questBusy = () => !!qb;

/* ---------- student: the road ---------- */
export function questTab(s, petMarkup) {
  const cur = currentGrade(s), ready = readyTests(s), held = heldWeapon(s);
  let h = '<div class="qtell">\u{1F4E3} Go Tell Your Teacher You Have a Test!</div>' +
    '<div class="card questintro"><div class="card-head"><h2>\u{1F5FA}️ Grade Level Quest</h2><span class="fact">' +
    (cur >= 9 ? "\u{1F3C6} Road complete!" : "\u{1F4CD} " + esc(GRADES[cur].name)) + "</span></div>" +
    '<p class="lede" style="font-size:13.5px;">Pass a Math, Reading or Language test and Ms. Ariana unlocks a <b>guardian battle</b>. Win it for a <b>Legendary egg</b>, XP, Comfort Points and a new weapon! ' +
    "Finish all 3 tests at a grade to go through the portal to the next area.</p>";
  if (ready.length) h += '<div class="qready">' + ready.map(r => { const n = doneCount(s, r.g) + 1, fam = GRADES[r.g].guardians[n - 1], gc = formOf(fam, 1);
    return '<button class="qbattle" data-qfight="' + r.g + ":" + r.s + '"><img src="' + esc(gc.img) + '" alt=""><span><b>⚔️ Battle ' + esc(gc.name) + "!</b><small>" +
      esc(GRADES[r.g].short + " grade " + SUBJ[r.s].n) + " test passed</small></span></button>"; }).join("") + "</div>";
  else h += '<p class="muted small" style="margin-top:6px;">No battles waiting right now. Pass your next test to unlock one!</p>';
  h += "</div>";
  // weapons
  const ws = weaponsOwned(s);
  h += '<div class="card"><div class="card-head"><h2>⚔️ My weapons</h2><span class="fact">' + ws.length + " / 27</span></div>";
  h += ws.length ? '<div class="qweapons">' + ws.map(id => { const w = weapon(id); return '<button class="qw' + (held && held.id === id ? " on" : "") + '" data-qhold="' + id + '" title="' + esc(w.name) + '"><img src="' + esc(w.img) + '" alt=""><small>' + esc(w.name) + "</small></button>"; }).join("") + "</div>" +
    '<p class="muted small" style="margin-top:8px;text-align:center;">Tap a weapon for your companion to hold it (it works with any hat). Tap it again to put it away.</p>'
    : '<p class="lede">Win guardian battles to earn shields, staffs and swords!</p>';
  h += "</div>";
  // the road, current grade first, then the rest in order
  const order = cur < 9 ? [cur].concat([...Array(9).keys()].filter(g => g !== cur)) : [...Array(9).keys()];
  order.forEach(g => { h += roadCard(s, g, cur, petMarkup); });
  return h;
}
function roadCard(s, g, cur, petMarkup) {
  const G = GRADES[g], start = startOf(s);
  if (g < start) return '<div class="qroad small done"><b>✅ ' + esc(G.name) + "</b> · " + esc(G.area) + ' <span class="muted small">(finished before the quest — weapons unlocked!)</span></div>';
  const done = doneOf(s), byN = {};
  SUBJECTS.forEach(([k]) => { const d = done[qKey(g, k)]; if (d) byN[d.n] = k; });
  let h = '<div class="qroad' + (g === cur ? " here" : "") + (g > cur ? " later" : "") + '"><div class="qmap"><img class="qbg" src="' + roadArt(g) + '" alt="' + esc(G.name + " — " + G.area) + '" loading="lazy">';
  ROAD_SPOTS[g].forEach(([x, y], i) => {
    const k = byN[i + 1];
    h += '<span class="qspot' + (k ? " ok" : "") + '" style="left:' + x + "%;top:" + y + '%">' + (k ? SUBJ[k].i + "<i>✓</i>" : "") + "</span>";
  });
  if (g === cur && petMarkup) { const n = doneCount(s, g), [x, y] = ROAD_SPOTS[g][Math.min(2, n)]; h += '<span class="qme" style="left:' + x + "%;top:" + y + '%"><span class="qme-in">' + petMarkup + "</span></span>"; }
  if (g > cur) h += '<span class="qlock">\u{1F512} Finish ' + esc(GRADES[cur] ? GRADES[cur].name : "") + " first</span>";
  h += '</div><div class="qchips">' + SUBJECTS.map(([k, n, i]) => {
    const st = testState(s, g, k);
    return '<span class="qchip ' + (st || "todo") + '">' + i + " " + n + " " + (st === "done" ? "✅" : st === "battle" ? '<button class="btn small" data-qfight="' + g + ":" + k + '">⚔️ Battle!</button>' : st === "wait" ? "⏳ saved" : "⬜") + "</span>";
  }).join("") + "</div></div>";
  return h;
}

/* ---------- student: the guardian battle (on this page only, vs the computer) ---------- */
function startFight(s, g, k) {
  if (testState(s, g, k) !== "battle") return false;
  const n = doneCount(s, g) + 1, fam = GRADES[g].guardians[n - 1];
  const mine = ownedFams(s).sort((a, b) => (owned(s)[b].lvl || 1) - (owned(s)[a].lvl || 1));
  qb = { g, k, n, fam, phase: "pick", picks: mine.slice(0, 3), mine, bt: null, lines: [] };
  return true;
}
// The Guardian's Blessing: the student's team is powered up so the battle is always won.
function makeBattle() {
  const s = qbStudent, team = qb.picks.map(f => fighterFrom(s, f)).filter(Boolean).map(f => Object.assign(f, { hp: f.hp * 3, cur: f.hp * 3, df: Math.round(f.df * 1.5), dmg: Math.round(f.dmg * 1.3) }));
  const lvl = 5 + qb.g * 10, gd = fighterFrom({ coll: { [qb.fam]: { lvl } } }, qb.fam);
  const lead = team[0], weakest = Math.min(...team.map(f => f.hp));
  gd.hp = gd.cur = 150 + qb.g * 75;                                               // a big, impressive guardian
  const boost = (gd.hp / 6) / Math.max(1, hitDamage(lead, gd, false).dmg);         // the blessing: about 6 good hits to win
  team.forEach(f => { f.dmg = Math.max(f.dmg, Math.round(f.dmg * boost)); });
  gd.dmg = Math.max(2, Math.round(weakest * 0.035 * (50 + Math.min(...team.map(f => f.df))) / 50));   // its hits only tickle (even super effective ones)
  gd.dodge = 0; gd.poison = 0; gd.daze = 0; gd.alt = null;
  qb.bt = { a: { id: "me", name: s.name }, b: { id: "g", name: gd.name }, team: { A: team, B: [gd] }, active: { A: 0, B: 0 }, moves: { A: null, B: null }, log: [], status: "fight", turn: "A", round: 0 };
  qb.phase = "fight"; qb.lines = ["✨ The Guardian’s Blessing powers up your team!", esc(gd.name) + " appears!"];
}
let qbStudent = null;
function aiMove() { const r = Math.random(); return r < 0.7 ? { m: "attack" } : r < 0.85 ? { m: "power" } : { m: "guard" }; }
function playRound(mv) {
  const bt = qb.bt, before = bt.log.length;
  bt.moves = { A: mv, B: aiMove() };
  resolveRound(bt);
  // the blessing never lets the student lose: bring out the next creature, or revive the team
  if (bt.active.A == null) {
    const next = bt.team.A.findIndex(f => f.cur > 0);
    if (next >= 0) { bt.active.A = next; bt.log.push({ k: "send", s: "A", n: bt.team.A[next].name }); }
    else { bt.team.A.forEach(f => { f.cur = f.hp; }); bt.active.A = 0; bt.log.push({ k: "revive" }); }
    if (bt.status === "lead") bt.status = "fight";
  }
  qb.lines = bt.log.slice(before).map(lineOf).filter(Boolean);
  if (bt.status === "done" && bt.winner === "A") qb.phase = "won";
}
function lineOf(e) {
  if (e.k === "hit") return "<b>" + esc(e.a) + "</b> used " + esc(e.atk) + "! " + (e.miss ? (e.dodged ? "Dodged!" : "It missed!") : (e.crit ? "\u{1F4A5} Critical! " : "") + (e.weak ? "Super effective! " : "") + e.dmg + " damage.");
  if (e.k === "guard") return "\u{1F6E1}️ <b>" + esc(e.n) + "</b> is guarding.";
  if (e.k === "heal") return "\u{1F49A} <b>" + esc(e.n) + "</b> healed " + e.amt + " HP!";
  if (e.k === "faint") return "<b>" + esc(e.n) + "</b> fainted!";
  if (e.k === "send") return "Go, <b>" + esc(e.n) + "</b>!";
  if (e.k === "revive") return "✨ The Guardian’s Blessing revives your team!";
  if (e.k === "poison") return "\u{1F922} <b>" + esc(e.d) + "</b> was poisoned!";
  if (e.k === "psn") return "\u{1F922} <b>" + esc(e.n) + "</b> is hurt by poison.";
  if (e.k === "daze") return "✨ <b>" + esc(e.d) + "</b> is dazzled!";
  if (e.k === "defdown") return "\u{1F4A7} <b>" + esc(e.d) + "</b>’s defense dropped!";
  if (e.k === "win") return "\u{1F3C6} You won!";
  return "";
}
const pic = f => '<img src="' + esc(f.img) + '" alt="">';
const bar = f => '<span class="qhp"><span style="width:' + Math.max(0, f.cur / f.hp * 100) + '%"></span></span><small>' + Math.max(0, f.cur) + " / " + f.hp + "</small>";
export function questOverlay(s) {
  if (!qb) return "";
  qbStudent = s;
  const G = GRADES[qb.g], gc = formOf(qb.fam, 1);
  let h = '<div class="qbover" style="background-image:url(' + battleArt(qb.g) + ')"><div class="qbtop"><b>' + esc(G.name) + " · " + esc(G.area) + "</b> — " + esc(SUBJ[qb.k].n) + " test" +
    (qb.phase !== "won" ? '<button class="btn ghost small" data-qact="quit">Leave</button>' : "") + "</div>";
  if (qb.phase === "pick") {
    h += '<div class="qbpanel"><h3>Pick up to 3 creatures to battle <span style="color:' + RARITY_COLOR.Legendary + '">' + esc(gc.name) + "</span></h3>" +
      '<div class="qbpick">' + qb.mine.map(f => { const c = formOf(f, owned(s)[f].lvl || 1), on = qb.picks.includes(f);
        return '<button class="tpick' + (on ? " on" : "") + '" data-qpick="' + f + '"><img src="' + esc(c.img) + '" alt=""><b>' + esc(owned(s)[f].nick || c.name) + "</b><small>Lv " + (owned(s)[f].lvl || 1) + "</small></button>"; }).join("") + "</div>" +
      '<button class="btn big" data-qact="go"' + (qb.picks.length ? "" : " disabled") + ">⚔️ Start the battle!</button></div></div>";
    return h;
  }
  const bt = qb.bt, me = bt.team.A[bt.active.A] || bt.team.A[0], gd = bt.team.B[0];
  h += '<div class="qbfield"><div class="qbside them">' + '<div class="qbbar"><b>' + esc(gd.name) + "</b> Lv " + gd.lvl + bar(gd) + "</div>" + pic(gd) + "</div>" +
    '<div class="qbside mine">' + pic(me) + '<div class="qbbar"><b>' + esc(me.name) + "</b> ✨ blessed" + bar(me) + "</div></div></div>" +
    '<div class="qbpanel small"><p>' + (qb.lines.join("<br>") || "&nbsp;") + "</p></div>";
  if (qb.phase === "won") {
    const n = qb.n, w = weapon(weaponId(qb.g, n - 1));
    h += '<div class="qbpanel win"><h3>\u{1F3C6} You beat ' + esc(gd.name) + "!</h3>" +
      '<div class="qrewards"><span>\u{1F95A}<b>Legendary egg</b></span><span>⭐<b>+' + QUEST_XP[n - 1] + " XP</b></span><span>\u{1F6CB}️<b>+" + QUEST_CP[n - 1] + ' Comfort Points</b></span><span><img src="' + esc(w.img) + '" alt=""><b>' + esc(w.name) + "</b></span></div>" +
      (qb.saved ? '<button class="btn big" data-qact="done">Yay! \u{1F389}</button>' : '<p class="muted">Saving your rewards…</p>') + "</div>";
  } else {
    const btn = (m, label, sub, ok) => '<button class="mvbtn mv-' + m + '" data-qmove="' + m + '"' + (ok ? "" : " disabled") + ">" + MOVES[m].icon + " <b>" + label + "</b><small>" + sub + "</small></button>";
    const d = hitDamage(me, gd, false).dmg;
    h += '<div class="qbpanel"><div class="mvgrid">' + btn("attack", esc(me.attack), "about " + d + " damage", true) +
      btn("power", "Power Move", "about " + Math.round(d * MOVES.power.mult) + " · 75% to hit", true) + btn("guard", "Guard", "take half damage", true) +
      btn("heal", "Heal", me.healed ? "already used" : "+" + Math.round(me.hp * MOVES.heal.pct) + " HP · once", !me.healed && me.cur < me.hp) +
      (me.alt ? btn("alt", esc(me.alt.name), "special attack", true) : "") + "</div></div>";
  }
  return h + "</div>";
}

/* ---------- student clicks ---------- */
export async function questClick(el, c) {
  const s = c.me;
  if (el.dataset.qfight) { const [g, k] = el.dataset.qfight.split(":"); if (!startFight(s, Number(g), k)) c.flash("That battle isn’t ready yet."); return c.render(true); }
  if (el.dataset.qhold) { const id = el.dataset.qhold; return c.patch({ held: s.held === id ? null : id }); }
  if (!qb) return;
  if (el.dataset.qpick) { const f = el.dataset.qpick; qb.picks = qb.picks.includes(f) ? qb.picks.filter(x => x !== f) : qb.picks.length < 3 ? qb.picks.concat([f]) : qb.picks; return c.render(true); }
  if (el.dataset.qmove) { if (qb.phase !== "fight") return; playRound({ m: el.dataset.qmove }); c.render(true); if (qb.phase === "won") await claim(c); return; }
  const a = el.dataset.qact;
  if (a === "go") { qbStudent = s; makeBattle(); return c.render(true); }
  if (a === "quit") { qb = null; return c.render(true); }
  if (a === "done") { qb = null; return c.render(true); }
}
async function claim(c) {
  const s = c.me, key = qKey(qb.g, qb.k);
  if (doneOf(s)[key]) { qb.saved = true; return c.render(true); }
  const n = qb.n, questDone = Object.assign({}, doneOf(s), { [key]: { n, at: new Date().toISOString() } });
  const data = { questDone, questXP: (Number(s.questXP) || 0) + QUEST_XP[n - 1], legendaryPulls: (Number(s.legendaryPulls) || 0) + 1 };
  if (!s.held) data.held = weaponId(qb.g, n - 1);   // first weapon goes straight into their companion's paws
  try { await c.patch(data, true); qb.saved = true; }
  catch (e) { c.flash("Your rewards didn’t save — tell Ms. Ariana! (" + (e.code || e.message) + ")"); qb = null; }
  c.render(true);
}

/* ---------- teacher: the tracker ---------- */
export function questTracker(students) {
  const team = students.filter(x => x.companionId);
  let h = '<div class="card"><div class="card-head"><h2>\u{1F5FA}️ Grade Level Quest</h2><span class="fact">K – 8th</span></div>' +
    '<p class="lede" style="font-size:13px;">Set where each student <b>starts</b> (grades below it are done — they get those weapons, no other rewards). ' +
    "Then click <b>M</b>, <b>R</b> or <b>L</b> when a student passes a test: they get a guardian battle on their page. " +
    "⚔️ = passed, waiting for them to battle · ✅ = won · ⏳ = passed early, saved until the grades below are finished.</p>" +
    '<div class="scroll-x"><table class="tbl qtrack"><thead><tr><th>Student</th><th>Starts at</th>' + GRADES.map(G => "<th>" + esc(G.short) + "</th>").join("") + "</tr></thead><tbody>";
  team.forEach(s => {
    const start = startOf(s), cur = currentGrade(s);
    h += "<tr><td><b>" + esc(s.name) + "</b></td><td><select data-qstart=\"" + s.id + '">' + GRADES.map((G, i) => '<option value="' + i + '"' + (i === start ? " selected" : "") + ">" + esc(G.short) + "</option>").join("") +
      '<option value="9"' + (start === 9 ? " selected" : "") + ">done</option></select></td>";
    GRADES.forEach((G, g) => {
      h += '<td class="' + (g === cur ? "qcur" : "") + '">' + (g < start ? '<span class="qall">✅</span>' : SUBJECTS.map(([k, n]) => {
        const st = testState(s, g, k), mark = st === "done" ? "✅" : st === "battle" ? "⚔️" : st === "wait" ? "⏳" : n[0];
        return '<button class="qb ' + (st || "todo") + '" data-qpass="' + s.id + ":" + g + ":" + k + '" title="' + esc(G.short + " " + n + (st === "done" ? " — won" : st ? " — passed" : " — click when passed")) + '">' + mark + "</button>";
      }).join("")) + "</td>";
    });
    h += "</tr>";
  });
  return h + "</tbody></table></div></div>";
}
export async function questTeacherClick(el, ctx) {
  const [sid, g, k] = el.dataset.qpass.split(":"), s = ctx.students.find(x => x.id === sid); if (!s) return;
  const key = qKey(Number(g), k);
  if (doneOf(s)[key]) return ctx.flash(s.name + " already won that battle.");
  const pass = Object.assign({}, passOf(s));
  if (pass[key]) delete pass[key]; else pass[key] = new Date().toISOString().slice(0, 10);
  return ctx.patch(sid, { questPass: pass });
}
export async function questTeacherChange(el, ctx) { return ctx.patch(el.dataset.qstart, { questStart: Number(el.value) || 0 }); }
