// Shared rules + drawing for the teacher console and the student page.

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
export const SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri"];
export const MAX_HP = 120, HALF_HP = 60;
export const BANNER = '<div class="hero"><h2>Keep Your Pet Alive Through Friday and Earn <b>2,500 XP</b></h2></div>';

// fit: where gear sits on each companion, in em of the companion's size (Chromebook/Google emoji).
//   hat  = [x, y, size, tilt]  bottom-centre of a hat/cap/crown sits on this point
//   eyes = [x, y, size, tilt]  centre of the sunglasses
//   snack = [x, y]             snack pack beside the pet
export const ROSTER = [
  { id: "otter",   name: "River Otter",      glyph: "\u{1F9A6}", fit: { hat: [0.29, 0.22, 0.38, -18], eyes: [0.28, 0.33, 0.26, -14], snack: [1.02, 0.86] } },
  { id: "raccoon", name: "Raccoon",          glyph: "\u{1F99D}", fit: { hat: [0.62, 0.27, 0.52, 0],   eyes: [0.63, 0.53, 0.46, 0],   snack: [1.1, 0.86] } },
  { id: "fox",     name: "Arctic Fox",       glyph: "\u{1F98A}", fit: { hat: [0.6, 0.27, 0.5, 0],     eyes: [0.6, 0.56, 0.5, 0],     snack: [1.1, 0.88] } },
  { id: "sloth",   name: "Sloth",            glyph: "\u{1F9A5}", fit: { hat: [0.31, 0.27, 0.3, -6],   eyes: [0.31, 0.39, 0.3, 0],    snack: [1.02, 0.86] } },
  { id: "badger",  name: "Honey Badger",     glyph: "\u{1F9A1}", fit: { hat: [0.24, 0.48, 0.3, -12],  eyes: [0.19, 0.57, 0.24, -6],  snack: [1.1, 0.86] } },
  { id: "octopus", name: "Octopus",          glyph: "\u{1F419}", fit: { hat: [0.74, 0.26, 0.42, 8],   eyes: [0.72, 0.42, 0.34, 0],   snack: [1.12, 0.86] } },
  { id: "dragon",  name: "Dragon Hatchling", glyph: "\u{1F409}", fit: { hat: [0.38, 0.12, 0.3, -8],   eyes: [0.44, 0.15, 0.24, 0],   snack: [1.08, 0.86] } },
  { id: "unicorn", name: "Unicorn Foal",     glyph: "\u{1F984}", fit: { hat: [0.47, 0.2, 0.36, -10],  eyes: [0.5, 0.45, 0.28, -6],   snack: [1.08, 0.86] } },
  { id: "griffin", name: "Griffin Cub",      glyph: "\u{1F985}", fit: { hat: [0.31, 0.31, 0.26, -10], eyes: [0.33, 0.37, 0.2, -6],   snack: [1.1, 0.86] } },
  { id: "sprite",  name: "Pixel Sprite",     glyph: "\u{1F47E}", fit: { hat: [0.61, 0.2, 0.44, 0],   eyes: [0.6, 0.42, 0.62, 0],    snack: [1.12, 0.86] } },
  { id: "pixie",   name: "Pixie",            glyph: "\u{1F9DA}", fit: { hat: [0.6, 0.03, 0.26, 0],    eyes: [0.6, 0.11, 0.16, 0],    snack: [1.08, 0.86] } },
  { id: "golem",   name: "Stone Golem",      glyph: "\u{1F5FF}", fit: { hat: [0.6, 0.09, 0.56, 0],    eyes: [0.61, 0.35, 0.56, 0],   snack: [1.1, 0.86] } }
];

export const ITEMS = [
  { id: "cap",    name: "Ball Cap",    glyph: "\u{1F9E2}", streak: 1 },
  { id: "shades", name: "Cool Shades", glyph: "\u{1F576}️", streak: 2 },
  { id: "snack",  name: "Snack Pack",  glyph: "\u{1F36A}", streak: 3 },
  { id: "hat",    name: "Cozy Hat",    glyph: "\u{1F3A9}", streak: 4 },
  { id: "crown",  name: "Crown",       glyph: "\u{1F451}", streak: 5 },
  { id: "cape",   name: "Hero Cape",   glyph: "\u{1F9B8}", revive: true }
];
// To use a picture instead of an emoji, drop a transparent PNG in assets/gear/ and set img, e.g. img: "assets/gear/cap.png"
ITEMS.forEach(it => { if (!("img" in it)) it.img = null; });
export const GEAR = ITEMS.filter(it => it.streak);
export function itemArt(it, cls) {
  return it.img ? '<img class="' + (cls || "") + '" src="' + it.img + '" alt="">' : it.glyph;
}
export const SIDEKICKS = { axolotl: "Axolotl", duck: "Duck" };

export function byId(list, id) { return list.find(x => x.id === id) || null; }
export function esc(s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
export function five(v) { return [v, v, v, v, v]; }
export function arr5(a, fill) { const out = []; for (let i = 0; i < 5; i++) out.push(a && a[i] != null ? a[i] : fill); return out; }
export function recordedDays(cls) { return arr5(cls && cls.recorded, false).map(Boolean); }
export function goalXP(cls) { return (cls && Number(cls.goal)) || 120; }

/* ---------- survival engine ----------
   Hit 120 = full health. Miss = half health. Two misses in a row = disappears.
   Excused / not-yet-counted days are skipped. A Hero Cape brings it back on the next 120 day.
   Gear unlocks from the best run of 120 days this week and stays unlocked. */
export function simulate(st, cls) {
  const status = arr5(st.status, "");
  const items = st.items || [];
  const rec = recordedDays(cls);
  const capesOwned = items.filter(it => it.id === "cape").length;
  let capesUsed = 0;
  let health = MAX_HP, alive = true, missRun = 0, capeReady = false, capeSaved = false;
  let hitRun = 0, bestRun = 0, ovMet = 0, ovCounted = 0, daysCounted = 0;

  for (let d = 0; d < 5; d++) {
    if (!rec[d]) continue;
    daysCounted++;
    const v = status[d];
    if (v === "e") continue;
    ovCounted++;
    const hit = v === "c";
    if (hit) { ovMet++; hitRun++; bestRun = Math.max(bestRun, hitRun); } else hitRun = 0;

    if (!alive) {
      if (hit) {
        if (capesUsed < capesOwned) { capesUsed++; alive = true; health = MAX_HP; missRun = 0; capeSaved = true; capeReady = false; }
        else capeReady = true;
      }
      continue;
    }
    if (hit) { health = MAX_HP; missRun = 0; }
    else {
      missRun++;
      if (missRun >= 2) { alive = false; health = 0; capeReady = false; }
      else health = HALF_HP;
    }
  }
  const unlocked = GEAR.filter(g => bestRun >= g.streak).map(g => g.id);
  return {
    health, max: MAX_HP, alive, capeReady, capeSaved, hitRun, bestRun, unlocked,
    atRisk: alive && daysCounted > 0 && missRun === 1,
    ovMet, ovCounted, daysCounted, started: daysCounted > 0
  };
}

// null/undefined = wear newest unlock automatically, "" = nothing, otherwise the chosen item if unlocked
export function wornItem(st, sim) {
  if (st.equipped === "") return null;
  if (st.equipped && sim.unlocked.includes(st.equipped)) return byId(ITEMS, st.equipped);
  return sim.unlocked.length ? byId(ITEMS, sim.unlocked[sim.unlocked.length - 1]) : null;
}

export function tier(sim) {
  if (!sim.started) return { key: "waiting", label: "Week not started" };
  if (!sim.alive) return { key: "lost", label: sim.capeReady ? "Disappeared · Hero Cape ready" : "Disappeared" };
  if (sim.atRisk) return { key: "critical", label: "Half health" };
  return { key: "thriving", label: "Full health" };
}

// The day the board is "showing": the latest day with any counted or lunch data.
export function boardDay(cls, students) {
  const rec = recordedDays(cls);
  let day = -1;
  for (let d = 0; d < 5; d++) {
    if (rec[d] || students.some(s => arr5(s.early, false)[d])) day = d;
  }
  return day;
}

// Sidekick only appears on days the student hit 120 by lunch.
export function sidekickToday(st, day) {
  if (day < 0 || !arr5(st.early, false)[day]) return null;
  return st.sidekick === "duck" ? "duck" : "axolotl";
}

/* ---------- art ----------
   Sidekick pictures live in assets/. Swap the PNGs to change the art (keep the file names). */
export const SIDEKICK_ART = { axolotl: "assets/axolotl.png", duck: "assets/duck.png" };
export function sidekickSVG(kind, big) {
  const k = kind === "duck" ? "duck" : "axolotl";
  return '<img class="side ' + k + (big ? " big" : "") + '" src="' + SIDEKICK_ART[k] + '" alt="' + SIDEKICKS[k] + ' sidekick">';
}

// Hats sit on the head (anchored at their bottom-centre); shades centre on the eyes.
const HAT_SCALE = { cap: 1, hat: 1.05, crown: 0.95 };
const GLYPH_W = 1.25;   // emoji box is 1.25em wide x 1em tall
const pos = (x, y) => "left:" + (x / GLYPH_W * 100).toFixed(1) + "%;top:" + (y * 100).toFixed(1) + "%;";
export function gearStyle(c, worn) {
  const f = c.fit || {};
  if (worn.id === "shades") {
    const [x, y, sz, r] = f.eyes || [0.6, 0.45, 0.4, 0];
    return pos(x, y) + "font-size:" + sz + "em;transform:translate(-50%,-50%) rotate(" + r + "deg);";
  }
  if (worn.id === "snack") {
    const [x, y] = f.snack || [1.1, 0.86];
    return pos(x, y) + "font-size:0.34em;transform:translate(-50%,-50%) rotate(-8deg);";
  }
  const [x, y, sz, r] = f.hat || [0.6, 0.2, 0.45, 0];
  return pos(x, y) + "font-size:" + (sz * (HAT_SCALE[worn.id] || 1)).toFixed(3) + "em;transform:translate(-50%,-88%) rotate(" + r + "deg);transform-origin:50% 88%;";
}
export function petHTML(c, worn) {
  return '<span class="petwrap"><span class="tglyph">' + c.glyph + "</span>" +
    (worn ? '<span class="gear" style="' + gearStyle(c, worn) + '">' + itemArt(worn, "gimg") + "</span>" : "") + "</span>";
}

// One tile on The Keep (class board). Shows companion names only.
export function tileHTML(st, sim, rank, day, popped) {
  const c = byId(ROSTER, st.companionId);
  const t = tier(sim);
  const worn = wornItem(st, sim);
  const side = sidekickToday(st, day);
  const cape = (st.items || []).some(it => it.id === "cape") ? '<span title="Hero Cape">\u{1F9B8}</span>' : "";
  return '<div class="tile t-' + t.key + (side ? " early" : "") + (popped ? " pop" : "") + (sim.atRisk ? " risk" : "") + '">' +
    '<span class="rank">' + rank + "</span>" +
    (side ? '<span class="lunch">LUNCH HERO</span>' : "") +
    '<div class="stage" aria-hidden="true">' + petHTML(c, worn) + (side ? sidekickSVG(side) : "") + "</div>" +
    '<div class="tname2">' + esc(st.petName || c.name) + "</div>" +
    '<div class="tspec">' + esc(c.name) + "</div>" +
    '<span class="tbar"><span style="width:' + Math.max(0, Math.min(100, sim.health / sim.max * 100)) + '%"></span></span>' +
    '<div class="tstat"><span>' + (sim.alive ? sim.health + " hp" : "disappeared") + "</span><span>" + sim.ovMet + " / " + sim.ovCounted + " days</span></div>" +
    (sim.atRisk ? '<div class="riskline">Half health · hit 120 tomorrow!</div>' : "") +
    (sim.capeReady ? '<div class="saveline">Hero Cape unlocked!</div>' : "") +
    '<div class="twear">' + cape + "</div></div>";
}

export function statTile(pct, color, big, label, sub) {
  const r = 26, circ = 2 * Math.PI * r, dash = Math.max(0, Math.min(100, pct)) / 100 * circ;
  return '<div class="s4"><svg class="dn" viewBox="0 0 64 64" aria-hidden="true">' +
    '<circle cx="32" cy="32" r="' + r + '" fill="none" stroke="var(--line-2)" stroke-width="9"></circle>' +
    '<circle cx="32" cy="32" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="9" stroke-linecap="round" stroke-dasharray="' +
    dash.toFixed(1) + " " + circ.toFixed(1) + '" transform="rotate(-90 32 32)"></circle></svg>' +
    '<div class="s4b"><div class="s4v">' + big + '</div><div class="s4k">' + esc(label) + '</div><div class="s4s">' + esc(sub) + "</div></div></div>";
}

// The Keep: banner + four stats + tiles. Used by the teacher's class view.
export function keepHTML(cls, students, popIds) {
  const day = boardDay(cls, students);
  const rec = recordedDays(cls);
  const live = students.filter(s => s.companionId && byId(ROSTER, s.companionId))
    .map(s => ({ s, sim: simulate(s, cls) }))
    .sort((a, b) => (a.sim.alive !== b.sim.alive ? (a.sim.alive ? -1 : 1) : b.sim.health - a.sim.health || b.sim.ovMet - a.sim.ovMet));
  const alive = live.filter(r => r.sim.alive).length;
  const half = live.filter(r => r.sim.atRisk).length;
  const lunch = live.filter(r => sidekickToday(r.s, day)).length;
  let lastRec = -1; for (let d = 0; d < 5; d++) if (rec[d]) lastRec = d;
  let dayHit = 0, dayReq = 0;
  if (lastRec >= 0) live.forEach(r => { const v = arr5(r.s.status, "")[lastRec]; if (v === "e") return; dayReq++; if (v === "c") dayHit++; });
  const band = p => (p >= 80 ? "var(--good)" : p >= 50 ? "var(--warn)" : "var(--bad)");
  const pct = (a, b) => (b ? Math.round(a / b * 100) : 0);

  let h = BANNER + '<div class="tally4">' +
    statTile(pct(alive, live.length), band(pct(alive, live.length)), alive + " / " + live.length, "Companions alive", "still here this week") +
    statTile(pct(dayHit, dayReq), dayReq ? band(pct(dayHit, dayReq)) : "var(--ink-3)", dayReq ? pct(dayHit, dayReq) + "%" : "—",
      "Hit " + goalXP(cls) + " XP", lastRec >= 0 ? dayHit + " of " + dayReq + " on " + DAYS[lastRec] : "no day counting yet") +
    statTile(pct(lunch, live.length), "var(--warn)", String(lunch), "Lunch heroes", day >= 0 ? "hit " + goalXP(cls) + " by lunch " + DAYS[day] : "none yet") +
    statTile(pct(half, live.length), half ? "var(--warn)" : "var(--good)", String(half), "At half health", half ? "need " + goalXP(cls) + " XP next day" : "nobody in danger") +
    "</div>";
  if (!live.length) return h + '<div class="card"><p class="lede">No companions chosen yet.</p></div>';
  h += '<div class="board">';
  live.forEach((r, i) => { h += tileHTML(r.s, r.sim, i + 1, day, popIds && popIds[r.s.id] && Date.now() - popIds[r.s.id] < 6000); });
  return h + "</div>";
}
