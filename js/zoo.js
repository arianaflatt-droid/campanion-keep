/* ---------- 🦒 Planet JP Space Zoo (Nov 9) ----------
   A place on the Planet JP map run by Zookeeper Duck. Every day up to 5 creatures the student has PHOTOGRAPHED on the Safari
   (their album, planet.alb) live in the zoo, each in the habitat of its own zone. The 5 are picked from a hash of the student id +
   the date (heavier odds for rarer photos), so nothing is saved to keep them steady all day.
   - Tap an animal to say hi (heart + check, nothing saved yet). Say hi to everyone (or press Finish my tour) = ONE save:
     first tour of the day pays 5 ⭐ + 1 ⭐ per animal, and gives a stamp. 5 stamps fill the Zoo Stamp Card = +25 ⭐ bonus, then it starts over.
   - Each animal has a name plaque. Tapping the plaque opens that creature's Lorebook page (data-cc="detail"), even if the
     student only photographed it and never caught it (Ms. Ariana, Nov 9). Back returns to the zoo.
   Saved in planet.zoo = { d: last tour date, m: [keys met that day], v: tour days, st: stamps on the card, cards: full cards, cd: date a card was completed,
   all5, fr (saw a Super Rare), fa (saw an alien), fs (saw a Sparkle) } through safari.js planetSave, so the other Planet JP saves aren't overwritten. */
import { esc } from "./game.js?v=20261110d";
import { azToday } from "./collect.js?v=20261110d";
import { ALIEN_CREATURES, ALIEN_FAM } from "./aliens.js?v=20261110d";
import { freshSt, album, PAGES, ALIENS, entryArt, planetSave, planetNow, planetCtx } from "./safari.js?v=20261110d";

const A = "assets/planet/", Z = A + "zoo/";
export const ZOO_PICKS = 5, ZOO_FIRST = 5, ZOO_EACH = 1, ZOO_CARD = 5, ZOO_CARD_BONUS = 25;
// the 5 windows of zoo-bg.webp (centers in % of the picture width)
const PEN_X = [15.4, 33.3, 50.1, 66.8, 84.2];

// every album entry by key, plus the zone it lives in
const ENTRY = {}, ZONE_OF = {};
Object.keys(PAGES).forEach(zk => PAGES[zk].forEach(e => { ENTRY[e.key] = e; ZONE_OF[e.key] = zk; }));
const WEIGHT = { Common: 1, Uncommon: 1.3, Rare: 1.7, "Super Rare": 2.2 }, ALW = { c: 1.8, r: 2.2, s: 2.6 };
const wOf = e => e.alien ? ALW[(ALIENS[e.alien] || e).tier] || 2 : WEIGHT[e.rarity] || 1;
function hash01(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } h ^= h >>> 15; h = Math.imul(h, 2246822507); h ^= h >>> 13; return ((h >>> 0) + 1) / 4294967297; }
const plOf = st => (st && st.planet) || {};

// the creature whose Lorebook page a plaque opens (the photographed form; aliens = their real creature)
export function loreId(key) {
  const e = ENTRY[key]; if (!e) return 0;
  if (e.alien) { const c = ALIEN_CREATURES.find(x => x.fam === ALIEN_FAM[e.alien]); return c ? c.id : 0; }
  return Number(String(key).slice(1)) || 0;
}
// today's animals: weighted shuffle (Efraimidis–Spirakis) of the album, same all day for the same student
export function zooPicks(st, date) {
  const keys = Object.keys(album(st)).filter(k => ENTRY[k] && loreId(k));
  return keys.map(k => ({ k, r: Math.pow(hash01(st.id + "|" + date + "|" + k), 1 / wOf(ENTRY[k])) })).sort((a, b) => b.r - a.r || (a.k < b.k ? -1 : 1)).slice(0, ZOO_PICKS).map(x => x.k);
}

let met = { d: "", s: new Set() };
const metToday = () => { const d = azToday(); if (met.d !== d) met = { d, s: new Set() }; return met.s; };

function finishTour() {
  const c = planetCtx(); if (!c || !c.st) return;
  const st = freshSt(c.st), d = azToday(), pl = planetNow(), z = Object.assign({}, pl.zoo || {});
  if (z.d === d) return;
  const picks = zooPicks(st, d), m = [...metToday()].filter(k => picks.includes(k)); if (!m.length) return;
  const sp = plOf(st).spk || {};
  z.d = d; z.m = m; z.v = (Number(z.v) || 0) + 1; z.st = (Number(z.st) || 0) + 1;
  if (m.length >= ZOO_PICKS) z.all5 = 1;
  m.forEach(k => { const e = ENTRY[k]; if (e.alien ? (ALIENS[e.alien] || e).tier === "s" : e.rarity === "Super Rare") z.fr = 1; if (e.alien) z.fa = 1; if (sp[k]) z.fs = 1; });
  let gain = ZOO_FIRST + ZOO_EACH * m.length;
  if (z.st >= ZOO_CARD) { z.st = 0; z.cards = (Number(z.cards) || 0) + 1; z.cd = d; gain += ZOO_CARD_BONUS; }
  pl.zoo = z; pl.dust = (Number(pl.dust) || 0) + gain;
  planetSave(pl); if (c.rerender) c.rerender();
}

if (typeof document !== "undefined") document.addEventListener("click", ev => {
  const p = ev.target.closest && ev.target.closest("[data-zoomeet]");
  if (p) { const c = planetCtx(); if (!c || !c.st) return; const s = metToday(), k = p.dataset.zoomeet;
    if (!s.has(k)) { s.add(k); const picks = zooPicks(freshSt(c.st), azToday()), done = plOf(freshSt(c.st)).zoo || {};
      if (done.d !== azToday() && picks.length && picks.every(x => s.has(x))) { finishTour(); return; }
      if (c.rerender) c.rerender(); }
    return; }
  if (ev.target.closest && ev.target.closest("[data-zoofin]")) finishTour();
});

function pen(st, key, i, visited) {
  const e = ENTRY[key], sk = !!((plOf(st).spk || {})[key]), zk = ZONE_OF[key], said = metToday().has(key) || (visited && ((plOf(st).zoo || {}).m || []).includes(key));
  const left = PEN_X[i] - 7.6, name = esc(e.name);
  return '<button class="zpen' + (said ? " said" : "") + '" style="left:' + left + '%;background-image:url(' + A + "zone-" + zk + '.webp)" data-zoomeet="' + key + '" aria-label="Say hi to ' + name + '">' +
    '<span class="zcrit">' + entryArt(e, "zimg", sk) + "</span>" + (said ? '<span class="zhi">\u{1F496}</span>' : "") + "</button>" +
    '<button class="zplq" style="left:' + (PEN_X[i] - 7.4) + '%" data-cc="detail" data-id="' + loreId(key) + '" data-from="zoo" title="Read ' + name + '\u2019s Lorebook page"><img src="' + Z + 'plaque.webp" alt=""><b>' + name + "</b></button>";
}
const empty = i => '<span class="zpen zempty" style="left:' + (PEN_X[i] - 7.6) + '%"><img src="' + Z + 'pen-empty-sign.webp" alt="An empty habitat"></span>';

function stampCard(z, d) {
  const filled = z.cd === d ? ZOO_CARD : Math.min(ZOO_CARD, Number(z.st) || 0), xs = [14.3, 31.7, 49.3, 67.6, 85.3];
  return '<div class="zcard card"><div class="zcardpic"><img src="' + Z + 'stamp-card.webp" alt="Zoo Stamp Card">' +
    xs.map((x, i) => i < filled ? '<img class="zstamp" style="left:' + x + '%" src="' + Z + 'stamp-paw.webp" alt="stamp">' : "").join("") + "</div>" +
    '<div class="zcardinfo"><b>\u{1F43E} Zoo Stamp Card</b><span>' + filled + " / " + ZOO_CARD + " stamps \u00b7 a full card = +" + ZOO_CARD_BONUS + " \u2B50</span>" +
    ((Number(z.cards) || 0) ? "<small>Full cards so far: " + z.cards + "</small>" : "") + "</div></div>";
}

export function zooHTML(st, cls, open) {
  st = freshSt(st); const d = azToday(), z = plOf(st).zoo || {}, visited = z.d === d, picks = zooPicks(st, d), s = metToday();
  const saidN = picks.filter(k => s.has(k) || (visited && (z.m || []).includes(k))).length;
  const duck = visited ? "zk-cheer" : picks.length ? "zk-point" : "zk-wave";
  let say;
  if (!picks.length) say = "Welcome to the <b>Space Zoo</b>, Captain! The pens are empty. Photograph creatures on the <b>Safari</b> and I\u2019ll move them in!";
  else if (visited) say = "What a great tour! You earned <b>" + (ZOO_FIRST + ZOO_EACH * (z.m || []).length) + " \u2B50</b> today. Come back tomorrow, new animals will move in!";
  else if (!saidN) say = "Welcome to the <b>Space Zoo</b>! Tap each animal to say hi, then tap its <b>plaque</b> to read its Lorebook page.";
  else say = "You\u2019ve said hi to <b>" + saidN + " of " + picks.length + "</b>! " + (saidN < picks.length ? "Keep going!" : "");
  let h = '<div class="card zoocard"><div class="card-head"><h2>\u{1F992} Space Zoo</h2><span class="fact">' + picks.length + " of " + ZOO_PICKS + " pens full today</span></div>" +
    '<p class="lede" style="margin:0 0 8px;font-size:14px;">Animals you\u2019ve photographed on the Safari live here, and a new set moves in every day.</p>' +
    '<div class="zscene" style="background-image:url(' + Z + 'zoo-bg.webp)">';
  for (let i = 0; i < ZOO_PICKS; i++) h += picks[i] ? pen(st, picks[i], i, visited) : empty(i);
  h += '<img class="zkeeper" src="' + Z + duck + '.webp" alt="Zookeeper Duck"><div class="zsay">' + say + "</div></div>";
  if (picks.length && !visited && open !== false) h += '<div class="row" style="justify-content:center;margin-top:10px;"><button class="btn gold" data-zoofin="1"' + (saidN ? "" : " disabled") + ">\u2705 Finish my tour" + (saidN ? " (+" + (ZOO_FIRST + ZOO_EACH * saidN) + " \u2B50)" : "") + "</button></div>";
  return h + "</div>" + stampCard(z, d);
}
