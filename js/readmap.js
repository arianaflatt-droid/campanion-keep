/* ---------- 🗺️ Reading Treasure Map (Oct 25) ----------
   A new map every week. Each 25 Reading XP this week (Mon–Sun, so weekend reading counts) sails the boat to the next
   of 10 islands; 250 Reading XP reaches Treasure Isle. Each island has a prize the student taps to claim:
   chests (XP, event currency or Comfort Points), Water creatures to catch, eggs, and a Rare-or-better egg at the end.
   Students with their own plan read from their swapped subject (cls.subSwap[id].r), same as the core subjects rule.
   Ms. Ariana turns it on/off in the console (cls.readMap). Saved on the student: rmap = { wk, got: [island indexes], log: { i: text } } */
import { esc, SEASON } from "./game.js?v=20261020u";
import { azToday, doPull, formOf } from "./collect.js?v=20261020u";
import { weekKey, addDays } from "./doors.js?v=20261020u";
import { subFor, SUB_NAMES } from "./teams.js?v=20261020u";

export const PER_ISLAND = 25;
export const ISLANDS = [
  { n: "Bookend Beach", k: "chest", x: 8, y: 78 },
  { n: "Comma Cove", k: "catch", rar: "Common", x: 22, y: 56 },
  { n: "Paragraph Peak", k: "chest", x: 14, y: 28 },
  { n: "Chapter Lagoon", k: "egg", x: 34, y: 16 },
  { n: "Plot Twist Point", k: "catch", rar: "Uncommon", x: 44, y: 44 },
  { n: "Library Lighthouse", k: "chest", x: 56, y: 72 },
  { n: "Riddle Reef", k: "catch", rar: "Rare", x: 68, y: 48 },
  { n: "Story Sea Caves", k: "egg", x: 64, y: 18 },
  { n: "Bookworm Bay", k: "chest", x: 82, y: 30 },
  { n: "Treasure Isle", k: "final", x: 90, y: 70 }
];
export const mapOn = cls => !!(cls && cls.readMap);
const readSub = (st, cls) => subFor(cls, st, "r");
// Reading XP this week (Mon–Sun)
export function weekReading(st, cls) {
  const wk = weekKey(cls), hist = (st && st.xpHist) || {}, k = readSub(st, cls); let n = 0;
  for (let i = 0; i < 7; i++) n += Number((((hist[addDays(wk, i)] || {}).sub) || {})[k]) || 0;
  return Math.round(n);
}
export function todayReading(st, cls) { return Math.round(Number(((((st && st.xpHist) || {})[azToday()] || {}).sub || {})[readSub(st, cls)]) || 0); }
const mapOf = (st, cls) => { const m = st && st.rmap; return m && m.wk === weekKey(cls) ? m : { wk: weekKey(cls), got: [], log: {} }; };
export function mapState(st, cls) {
  const r = weekReading(st, cls), reached = Math.min(ISLANDS.length, Math.floor(r / PER_ISLAND)), m = mapOf(st, cls);
  const got = m.got || [], ready = []; for (let i = 0; i < reached; i++) if (!got.includes(i)) ready.push(i);
  return { r, reached, got, ready, m, next: reached < ISLANDS.length ? ISLANDS[reached] : null, toNext: reached < ISLANDS.length ? (reached + 1) * PER_ISLAND - r : 0 };
}
export const mapReady = (st, cls) => (mapOn(cls) ? mapState(st, cls).ready.length : 0);

const ICON = { chest: "\u{1F9F0}", catch: "\u{1F41F}", egg: "\u{1F95A}", final: "\u{1F451}" };
const WHAT = { chest: "Treasure chest", catch: "A creature to catch", egg: "An egg", final: "The big treasure: a Rare-or-better egg!" };
let pop = null;
const CHEST = "assets/readmap/map-chest.webp";   // last claimed prize: { i, title, sub, img }
export function mapTab(st, cls) {
  const S = mapState(st, cls), subName = SUB_NAMES[readSub(st, cls)] || "Reading";
  let h = '<div class="card rmapcard"><div class="card-head"><h2>\u{1F5FA}️ Reading Treasure Map</h2><span class="fact">' + S.reached + " / " + ISLANDS.length + " islands</span></div>" +
    '<p class="lede">Every <b>' + PER_ISLAND + " " + esc(subName) + " XP</b> this week sails your boat to the next island. Reading on the weekend counts too! A new map starts every Monday.</p>";
  if (pop) h += '<div class="rmpop">' + (pop.img ? '<img src="' + esc(pop.img) + '" alt="">' : '<span class="rmpopic">' + pop.icon + "</span>") + "<div><b>" + pop.title + "</b><br><small>" + esc(pop.sub) + '</small></div><button class="btn small" data-rmap="ok">Yay!</button></div>';
  // phones get the same map turned on its side (x <-> y), kept away from the edges
  const cl = (v, a, b) => Math.max(a, Math.min(b, v)), px = p => cl(p.y, 18, 82), py = p => cl(p.x, 11, 90), pos = p => "--x:" + p.x + "%;--y:" + p.y + "%;--px:" + px(p) + "%;--py:" + py(p) + "%";
  const B = S.reached ? ISLANDS[S.reached - 1] : { x: 2, y: 92 }, boat = { x: S.reached ? B.x - 8.5 : 4, y: S.reached ? B.y - 6 : 90 };
  h += '<div class="rmap"><svg class="rmpath land" viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points="' + ISLANDS.map(p => p.x + "," + p.y).join(" ") + '" /></svg>' +
    '<svg class="rmpath port" viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points="' + ISLANDS.map(p => px(p) + "," + py(p)).join(" ") + '" /></svg>' +
    ISLANDS.map((p, i) => { const got = S.got.includes(i), ready = S.ready.includes(i), locked = i >= S.reached;
      return '<div class="rmisle' + (got ? " got" : ready ? " ready" : locked ? " locked" : "") + (p.k === "final" ? " final" : "") + '" style="' + pos(p) + '">' +
        '<span class="rmland"><img src="assets/readmap/' + (p.k === "final" ? "map-island-final" : "map-island") + '.webp" alt=""><i>' + (got ? "✅" : locked ? "\u{1F512}" : ICON[p.k]) + "</i></span><b>" + esc(p.n) + "</b>" +
        (ready ? '<button class="btn small gold" data-rmap="claim" data-i="' + i + '">' + ICON[p.k] + " Claim!</button>" : got ? '<small>' + esc((S.m.log || {})[i] || "Claimed") + "</small>" : '<small>' + (i + 1) * PER_ISLAND + " XP</small>") + "</div>"; }).join("") +
    '<span class="rmboat" style="--x:' + boat.x + "%;--y:" + boat.y + "%;--px:" + (S.reached ? px(B) + 18 : 10) + "%;--py:" + (S.reached ? py(B) - 3 : 4) + '%"><img src="assets/readmap/map-boat.webp" alt="Your boat"></span></div>' +
    '<span class="pbar rmbar"><span style="width:' + Math.min(100, S.r / (PER_ISLAND * ISLANDS.length) * 100) + '%"></span></span>' +
    '<p class="small" style="margin-top:6px;"><b>' + S.r + " / " + PER_ISLAND * ISLANDS.length + "</b> " + esc(subName) + " XP this week · " +
    (S.next ? "<b>" + S.toNext + " more</b> to sail to <b>" + esc(S.next.n) + "</b> (" + WHAT[S.next.k].toLowerCase() + ")" : "\u{1F451} You reached Treasure Isle! A new map starts Monday.") + "</p></div>";
  return h;
}

export async function mapClick(el, c) {
  const a = el.dataset.rmap, s = c.me, cls = c.cls;
  if (a === "ok") { pop = null; return c.render(true); }
  if (a !== "claim" || !mapOn(cls)) return;
  const i = Number(el.dataset.i), S = mapState(s, cls), p = ISLANDS[i];
  if (!p || !S.ready.includes(i)) return;
  const data = {}, cur = SEASON.cur || "candy", coin = SEASON.coin || "\u{1F36C}";
  let res;
  if (p.k === "chest" || p.k === "final") {
    const roll = Math.floor(Math.random() * 3);
    if (p.k === "final" || roll === 0) { const n = p.k === "final" ? 50 : 30; data.doorXP = (Number(s.doorXP) || 0) + n; res = { img: CHEST, icon: "⭐", title: "+" + n + " XP", sub: "Use it to level up your creatures!" }; }
    else if (roll === 1) { data.candyBonus = (Number(s.candyBonus) || 0) + 20; res = { img: CHEST, icon: coin, title: "+20 " + cur, sub: "It’s in your " + (SEASON.basket || "basket") + "." }; }
    else { data.cpBonus = (Number(s.cpBonus) || 0) + 20; res = { img: CHEST, icon: "\u{1F6CB}️", title: "+20 Comfort Points", sub: "Spend them on your room!" }; }
    if (p.k === "final") { data.goalEggs = (s.goalEggs || []).concat(["rare"]); res = { img: "assets/readmap/map-island-final.webp", icon: "\u{1F451}", title: "Treasure Isle! A Rare-or-better egg + 50 XP", sub: "Hatch your egg in the Creature Collector!" }; }
  } else if (p.k === "egg") { data.doorEggs = (Number(s.doorEggs) || 0) + 1; res = { icon: "\u{1F95A}", title: "An egg!", sub: "Hatch it in the Creature Collector." }; }
  else {
    const r = doPull(s, p.rar, cls, { types: ["Water"] }), cr = formOf(r.fam, r.lvl);
    data.coll = r.coll; res = { img: cr.img, title: "You caught " + esc(cr.name) + "!", sub: p.rar + (r.dupe ? " · you already had one, so it went up a level" : " · it’s in your Creature Collector") };
  }
  const m = mapOf(s, cls);
  data.rmap = { wk: m.wk, got: (m.got || []).concat([i]), log: Object.assign({}, m.log || {}, { [i]: (res.icon || "\u{1F41F}") + " " + res.title.replace(/<[^>]+>/g, "") }) };
  data.rmapTotal = (Number(s.rmapTotal) || 0) + 1;
  pop = Object.assign({ i }, res);
  await c.patch(data, true);
  return c.render(true);
}

// Console: on/off + who's where this week
export function mapAdmin(students, cls) {
  const on = mapOn(cls), kids = students.filter(s => s.companionId && !s.isTeacher);
  let h = '<div class="card"><div class="card-head"><h2>\u{1F5FA}️ Reading Treasure Map</h2><span class="fact">' + (on ? "on" : "off") + "</span></div>" +
    '<p class="lede" style="font-size:13.5px;">A new map each week: every ' + PER_ISLAND + " Reading XP sails a student to the next of " + ISLANDS.length + " islands (chests, Water creatures, eggs, and a Rare-or-better egg at Treasure Isle for " + PER_ISLAND * ISLANDS.length + " Reading XP). Weekend reading counts.</p>" +
    '<label class="modebox" style="margin:6px 0;"><input type="checkbox" id="readMapBox"' + (on ? " checked" : "") + "><span><b>Show the Reading Map tab</b></span></label>";
  if (on) {
    const rows = kids.map(s => ({ s, S: mapState(s, cls) })).sort((a, b) => b.S.reached - a.S.reached || b.S.r - a.S.r);
    h += '<div class="inv" style="margin-top:8px;">' + rows.map(({ s, S }) => "<span>" + (S.reached >= ISLANDS.length ? "\u{1F451} " : "⛵ ") + esc(s.name) + " <b>" + S.reached + "</b>/" + ISLANDS.length + "</span>").join("") + "</div>";
  }
  return h + "</div>";
}
