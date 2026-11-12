/* ---------- 📸 Planet JP Creature Safari + Photo Album, Wave 3b (Nov 7) ----------
   In each unlocked zone a student can go on a safari: the zone scene fills the screen and creatures peek out and
   hide again. Tapping one before it hides takes its photo (1 film). 5 free film a day (was 3 until Nov 7); an extra roll (3 film) costs
   10 Stardust. A photo of a creature that isn't in the album yet is added; a repeat gives +2 Stardust instead.
   Nov 7 (v20261111k): each zone's page holds EVERY form of every creature of the zone's types (no Legendaries, Ultras or
   events: 387 in all) + 3 Planet JP–only aliens (21 in all). Every 10 new photos = +25 Stardust; a full page = +100 (once)
   and the zone badge; all 3 of a zone's aliens = its alien badge (badges.js works these out from the album).
   Saved on the student in planet: alb = { "c<id>" or alien key: photos }, saf = { d: day, u: film used, b: film bought },
   pg = [zone keys already paid], ms = milestones paid. One write per photo (≤3 a day unless they buy film). Preview saves nothing. */
import { CREATURES } from "./creatures.js?v=20261111k";
import { ALIEN_CREATURES, ALIEN_FAM } from "./aliens.js?v=20261111k";
import { esc } from "./game.js?v=20261111k";
import { azToday, azNow } from "./collect.js?v=20261111k";
// ✨ Sparkles (Nov 7): now and then a creature shows up in its Sparkle colors. A photo of one = +10 ⭐ (first time) and a ✨ on its album spot;
// catching one makes that creature Sparkle in the Collector for good (like a Sparkle hatch). Saved as planet.spk = { key: 1 }.
export const SAF_SPARKLE = 0.04, SPARKLE_DUST = 10;
const spkImg = e => e.img ? String(e.img).replace("assets/creatures/", "assets/creatures/sparkle/") : "";

const A = "assets/planet/";
export const PJ_CLOSE_M = 12 * 60 + 55;
/* 🚀 Launch window (Nov 9): normally 11:00–12:55 (Arizona). Ms. Ariana can open it early or keep it open later for the whole class
   (cls.pjWin = { d: today, from, to } in minutes; all: 1 = everyone can launch, even without full tanks), and a student she launches
   by hand (pjGo = today) can launch any time today and explore until 3:30 pm. */
export const PJ_LATE = 15 * 60 + 30;
/* 🏖️ Break-day launches (Nov 10, Ms. Ariana): on a weekday marked as a break on the calendar (cls.offDays), Planet JP is open
   all day until 10 pm (Arizona). Who can launch (planet.js fuel): if there were school days earlier that week, students who are
   caught up (the daily goal × those days for the week + core-subject rings closed so far); on a weeklong break, 120 XP that day.
   cls.pjBreakOff = true turns it off. */
export const PJ_BREAK_END = 22 * 60, PJ_BREAK_XP = 240;
export const pjBreakXP = cls => Number(cls && cls.pjBreakXP) || PJ_BREAK_XP;
export const pjBreakDay = (cls, iso) => { if (!cls || cls.pjBreakOff || !((cls.offDays || {})[iso])) return false;
  const [y, m, d] = String(iso).split("-").map(Number), w = new Date(y, m - 1, d).getDay(); return w >= 1 && w <= 5; };
/* 🌇 Afternoon launch (Nov 12, Ms. Ariana): on a school day, anyone who hits 120 XP that day can launch (or go back) after 2 pm,
   until 10 pm (Arizona). planet.js tells this file who hit 120 (setHitCheck). cls.pjAfterOff = true turns it off. */
export const PJ_AFTER = 14 * 60, PJ_AFTER_END = 22 * 60;
let hitCheck = null; export const setHitCheck = f => { hitCheck = f; };
export const afterOn = cls => !(cls && cls.pjAfterOff);
export const afterHit = (st, cls) => !!(afterOn(cls) && st && hitCheck && !pjBreakDay(cls, azToday()) && hitCheck(st, cls));
export function pjWindow(st, cls) {
  const W = pjWindow0(st, cls), m = minsNow();
  if (m >= W.c && afterHit(st, cls)) return m < PJ_AFTER ? { o: PJ_AFTER, c: PJ_AFTER_END, after: true } : { o: Math.min(W.o, PJ_AFTER), c: Math.max(W.c, PJ_AFTER_END), after: true };
  if (m >= PJ_AFTER && W.c < PJ_AFTER_END && afterHit(st, cls)) return { o: W.o, c: PJ_AFTER_END, after: true };
  return W;
}
function pjWindow0(st, cls) {
  const today = azToday(); let o = 11 * 60, c = PJ_CLOSE_M; const w = cls && cls.pjWin;
  if (pjBreakDay(cls, today)) { o = 0; c = PJ_BREAK_END; }
  if (w && w.d === today) { o = Math.min(o, Number(w.from) || 0); c = Math.max(c, Number(w.to) || c); }
  if (st && st.pjGo === today) { o = 0; c = Math.max(c, PJ_LATE); }
  return { o, c };
}
export const classOpenAll = cls => !!(cls && cls.pjWin && cls.pjWin.d === azToday() && cls.pjWin.all);
const nowD = () => (typeof window !== "undefined" && window.__pjNow ? new Date(window.__pjNow) : new Date());
const minsNow = () => { const t = azNow(nowD()); return t.h * 60 + t.m; };

export const ZONES = [
  { key: "landing", name: "Landing Bay", icon: "\u{1F6F8}", at: 1, types: ["Normal", "Steel", "Electric"], line: "The busy spaceport where every captain lands." },
  { key: "jungle", name: "Glow Jungle", icon: "\u{1F33F}", at: 2, types: ["Nature", "Poison"], line: "Glowing mushrooms, curly plants and bubbling green pools." },
  { key: "caves", name: "Crystal Caves", icon: "\u{1F48E}", at: 4, types: ["Crystal", "Earth", "Rock"], line: "Giant glowing crystals deep under the ground." },
  { key: "ice", name: "Ice Moon", icon: "\u{1F9CA}", at: 6, types: ["Ice", "Water"], line: "Frozen lakes, ice spikes and snowy craters." },
  { key: "lava", name: "Lava Fields", icon: "\u{1F30B}", at: 9, types: ["Fire", "Dragon"], line: "Rivers of lava and friendly little volcanoes." },
  { key: "nebula", name: "Nebula Peaks", icon: "\u{1F30C}", at: 12, types: ["Light", "Arcane", "Air"], line: "Floating islands in a rainbow nebula." },
  { key: "shadow", name: "Shadow Crater", icon: "\u{1F311}", at: 15, types: ["Dark", "Ghost"], line: "A mysterious crater full of glowing lanterns." },
];

// The 21 Planet JP aliens: 3 per zone (a common one, a rare one, a super rare one), found only on the safari.
// Pictures: assets/planet/alien-<zone>-c.webp / alien-<zone>.webp / alien-<zone>-s.webp — flip ALIEN_ART[key] to true once uploaded.
const AL = (key, zone, tier, name, color, line) => ({ key, zone, tier, name, color, line, rarity: tier === "c" ? "Alien" : tier === "r" ? "Rare Alien" : "Super Rare Alien", alien: key });
export const ALIEN_LIST = [
  AL("A-landing-c", "landing", "c", "Blinkbot", "#9FD8FF", "A tiny round alien with a blinking light-bulb antenna. It zooms around on one hover wheel."),
  AL("A-landing", "landing", "r", "Zibbit", "#7FD3FF", "A tiny robot-eared alien that tinkers with spaceship bolts."),
  AL("A-landing-s", "landing", "s", "Quasarpup", "#FFD36B", "A puppy-like alien with rocket boots and a glowing star collar. It guards the spaceport."),
  AL("A-jungle-c", "jungle", "c", "Pollywiggle", "#9BF08A", "A tadpole alien that hops between the glowing green pools."),
  AL("A-jungle", "jungle", "r", "Glimmersprout", "#7BEA7B", "A leafy alien whose antenna glows like a firefly."),
  AL("A-jungle-s", "jungle", "s", "Orchidra", "#FF9FE0", "A graceful flower alien with petal wings and three sparkly eyes."),
  AL("A-caves-c", "caves", "c", "Clinkle", "#D8C2FF", "A tiny crystal-shard alien that goes clink, clink when it walks."),
  AL("A-caves", "caves", "r", "Geodorb", "#C69CFF", "A round crystal alien that rolls through the caves."),
  AL("A-caves-s", "caves", "s", "Prismoth", "#A0F0FF", "A crystal moth alien whose wings turn light into rainbows."),
  AL("A-ice-c", "ice", "c", "Snowbloop", "#E4F6FF", "A jelly snowball alien that bounces across the frozen lakes."),
  AL("A-ice", "ice", "r", "Frostnik", "#BDEBFF", "A fluffy snow alien that skates on frozen lakes."),
  AL("A-ice-s", "ice", "s", "Auroraquin", "#9CFFD9", "A penguin-like alien with aurora feathers that leave trails of light."),
  AL("A-lava-c", "lava", "c", "Sizzlit", "#FFC15C", "A tiny spark alien that hops from lava rock to lava rock."),
  AL("A-lava", "lava", "r", "Magmallow", "#FF9A57", "A squishy marshmallow alien that loves warm lava baths."),
  AL("A-lava-s", "lava", "s", "Volcanoodle", "#FF6A4A", "A long, wiggly noodle-dragon alien made of cooled lava with glowing cracks."),
  AL("A-nebula-c", "nebula", "c", "Starbloop", "#FFF0A0", "A small star-shaped alien with a big smile that floats between islands."),
  AL("A-nebula", "nebula", "r", "Nebuloo", "#FF8BD8", "A floaty cloud alien made of rainbow stardust."),
  AL("A-nebula-s", "nebula", "s", "Cometail", "#B8A4FF", "A sleek alien fox with a sparkling comet tail."),
  AL("A-shadow-c", "shadow", "c", "Gloomby", "#8E8CC9", "A fuzzy shadow puff with big round eyes. It loves to hide."),
  AL("A-shadow", "shadow", "r", "Lanternook", "#FFD36B", "A shy alien that carries a glowing lantern in the dark."),
  AL("A-shadow-s", "shadow", "s", "Eclipsa", "#C9D4FF", "A moon-cat alien with starry fur and a crescent moon on its forehead."),
];
export const ALIENS = {}; ALIEN_LIST.forEach(a => { ALIENS[a.key] = a; });
export const ALIEN_ART = {}; ALIEN_LIST.forEach(a => { ALIEN_ART[a.key] = true; });   // Nov 7: all 21 pictures are in
// her fun facts + the real creature each alien is (catchable with Safari Shop nets)
ALIEN_LIST.forEach(a => { a.fam = ALIEN_FAM[a.key]; const c = ALIEN_CREATURES.find(x => x.fam === a.fam); if (c) { const f = String(c.lore || "").split("Fun fact: ")[1]; if (f) a.line = f; a.types = c.types; } });
export const zoneAliens = zk => ALIEN_LIST.filter(a => a.zone === zk);

/* ---------- 🛒 Safari Shop (Nov 7): nets bought with Stardust. Switch from 📸 to a net on the safari, tap a creature to throw it.
   Caught = it joins the Creature Collector (new at Lv 1, or +1 level if they already have it) and goes in the album. Missed = it runs away.
   The net is used up either way. Better nets catch rarer creatures more often; evolved forms are a bit harder. Saved as planet.nets = { b, s, c }. */
export const NETS = [
  { k: "b", name: "Bubble Net", icon: "\u{1FAE7}", cost: 15, ch: { Common: 0.6, Uncommon: 0.4, Rare: 0.2, "Super Rare": 0.08, c: 0.15, r: 0.08, s: 0.03 } },
  { k: "s", name: "Star Net", icon: "\u2728", cost: 40, ch: { Common: 0.85, Uncommon: 0.65, Rare: 0.4, "Super Rare": 0.2, c: 0.35, r: 0.2, s: 0.1 } },
  { k: "c", name: "Cosmic Net", icon: "\u{1F308}", cost: 100, ch: { Common: 0.95, Uncommon: 0.85, Rare: 0.65, "Super Rare": 0.4, c: 0.6, r: 0.4, s: 0.25 } }];
const STAGE_CATCH = [1, 1, 0.85, 0.7];
// Nov 7: the net pictures are in (assets/planet/net-bubble / net-star / net-cosmic)
const NET_FILE = { b: "net-bubble", s: "net-star", c: "net-cosmic" };
export const netImg = (n, cls) => '<img class="' + (cls || "netimg") + '" src="' + A + NET_FILE[n.k] + '-360.webp" alt="">';
export const netsOf = st => ((st && st.planet) || {}).nets || {};
export const catchChance = (net, e) => e.alien ? net.ch[(ALIENS[e.alien] || {}).tier] || 0 : (net.ch[e.rarity] || 0) * (STAGE_CATCH[e.stage] || 0.7);
export function shopHTML(st) {
  const pl = (st && st.planet) || {}, dust = Number(pl.dust) || 0, nets = netsOf(st);
  return '<div class="card safshop"><div class="card-head"><h2>\u{1F6D2} Safari Shop</h2><span class="fact">⭐ ' + dust + " Stardust</span></div>" +
    '<img class="safbooth" src="' + A + 'safari-shop.webp" alt="The Safari Shop booth">' +
    '<p class="lede" style="font-size:13.5px;">Buy a net, then on the safari switch from \u{1F4F8} to the net and tap a creature to throw it. A catch joins your <b>Creature Collector</b>. It\u2019s never a sure thing: better nets catch rarer creatures more often, and a miss scares it away. The 👽 aliens can only be caught here!</p>' +
    '<div class="safnets">' + NETS.map(n => '<div class="safnet"><span class="safneti">' + netImg(n, "safnetimg") + "</span><b>" + esc(n.name) + '</b><small>Common ' + Math.round(n.ch.Common * 100) + "% · Rare " + Math.round(n.ch.Rare * 100) + "% · 👽 " + Math.round(n.ch.c * 100) + "–" + Math.round(n.ch.s * 100) + "%</small>" +
      '<span class="safhave">You have <b>' + (Number(nets[n.k]) || 0) + "</b></span>" + '<button class="btn small' + (dust >= n.cost ? " gold" : " ghost") + '" data-safbuy="' + n.k + '"' + (dust >= n.cost ? "" : " disabled") + ">Buy for " + n.cost + " ⭐</button></div>").join("") + "</div></div>";
}
export const FREE_FILM = 5, ROLL_FILM = 3, ROLL_COST = 10, DUPE_DUST = 2, PAGE_DUST = 100, MILE_EVERY = 10, MILE_DUST = 25;
// Every form of every creature (babies and evolved forms count separately) whose main type lives in the zone.
// No Legendaries, Ultras or event creatures. Key "c<id>". Evolved forms are harder to spot.
const RORDER = { Common: 0, Uncommon: 1, Rare: 2, "Super Rare": 3 };
const OK = CREATURES.filter(c => !c.event && RORDER[c.rarity] != null);
const FIRST_OF = {}; OK.forEach(c => { if ((c.stage || 1) === 1 && !FIRST_OF[c.fam]) FIRST_OF[c.fam] = "c" + c.id; });
export const PAGES = {};
ZONES.forEach(z => {
  const cs = OK.filter(c => z.types.includes(c.types[0])).sort((a, b) => RORDER[a.rarity] - RORDER[b.rarity] || String(a.fam).localeCompare(String(b.fam)) || (a.stage || 1) - (b.stage || 1));
  PAGES[z.key] = zoneAliens(z.key).concat(cs.map(c => ({ key: "c" + c.id, fam: c.fam, name: c.name, rarity: c.rarity, img: c.img, types: c.types, stage: c.stage || 1 })));
});
export const pageSize = zk => (PAGES[zk] || []).length;
export const TOTAL = ZONES.reduce((n, z) => n + pageSize(z.key), 0);

const plOf = st => (st && st.planet) || {};
// Nov 7 (v20261107d) albums used family ids ("C-06") for first forms: read those as the first form's key
const normAlb = alb => { const o = {}; Object.keys(alb || {}).forEach(k => { const nk = /^[CURS]-\d+$/.test(k) ? FIRST_OF[k] : k; if (nk) o[nk] = (o[nk] || 0) + (Number(alb[k]) || 0); }); return o; };
export const album = st => normAlb(plOf(st).alb);
export const pageCount = (st, zk) => { const a = album(st); return (PAGES[zk] || []).filter(e => a[e.key]).length; };
export const aliensFound = (st, zk) => { const a = album(st); return zoneAliens(zk).filter(x => a[x.key]).length; };
export const allAliensFound = st => { const a = album(st); return ALIEN_LIST.filter(x => a[x.key]).length; };
export const photosTotal = st => Object.keys(album(st)).length;
export function filmLeft(st) { const s = plOf(st).saf || {}; return s.d === azToday() ? Math.max(0, FREE_FILM + (Number(s.b) || 0) - (Number(s.u) || 0)) : FREE_FILM; }

// stand-in drawing until an alien's picture is uploaded (super rare = a little crown of stars)
const alienSVG = (a, cls) => { const c = a.color || "#9CF";
  return '<svg class="' + (cls || "") + '" viewBox="0 0 100 100" aria-hidden="true"><line x1="38" y1="22" x2="30" y2="6" stroke="#333" stroke-width="3"/><line x1="62" y1="22" x2="70" y2="6" stroke="#333" stroke-width="3"/>' +
    '<circle cx="30" cy="6" r="5" fill="' + c + '" stroke="#333" stroke-width="2"/><circle cx="70" cy="6" r="5" fill="' + c + '" stroke="#333" stroke-width="2"/>' +
    '<ellipse cx="50" cy="56" rx="34" ry="36" fill="' + c + '" stroke="#333" stroke-width="3"/><ellipse cx="38" cy="50" rx="8" ry="11" fill="#222"/><ellipse cx="62" cy="50" rx="8" ry="11" fill="#222"/>' +
    '<circle cx="35" cy="46" r="3" fill="#fff"/><circle cx="59" cy="46" r="3" fill="#fff"/><path d="M40 72 Q50 80 60 72" fill="none" stroke="#333" stroke-width="3" stroke-linecap="round"/>' +
    (a.tier === "s" ? '<text x="50" y="30" font-size="16" text-anchor="middle">✨</text>' : a.tier === "r" ? '<text x="50" y="30" font-size="12" text-anchor="middle">⭐</text>' : "") + "</svg>"; };
const alienFile = a => A + "alien-" + a.zone + (a.tier === "c" ? "-c" : a.tier === "s" ? "-s" : "") + ".webp";
export const entryArt = (e, cls, spk) => { if (e.alien) { const a = ALIENS[e.alien] || e; return ALIEN_ART[a.key] ? '<img class="' + (cls || "") + (spk ? " sparkly" : "") + '" src="' + alienFile(a) + '" alt="">' : alienSVG(a, cls); }
  return '<img class="' + (cls || "") + (spk ? " sparkly" : "") + '" src="' + (spk ? spkImg(e) : e.img) + '" alt="" loading="lazy"' + (spk ? ' onerror="this.onerror=null;this.src=\'' + e.img + '\'"' : "") + ">"; };

/* ---------- the album (drawn inside the Planet JP tab): one page per zone, one page open at a time ---------- */
let openPage = null;
export function albumHTML(st, n) {
  const alb = album(st), full = ZONES.filter(z => pageCount(st, z.key) === pageSize(z.key)).length, tot = Object.keys(alb).length;
  const opens = ZONES.filter(z => n >= z.at);
  if (!openPage || (openPage !== "__none" && !opens.some(z => z.key === openPage))) { const f = opens.find(z => pageCount(st, z.key) < pageSize(z.key)) || opens[0]; openPage = f ? f.key : null; }
  const nextMile = (Math.floor(tot / MILE_EVERY) + 1) * MILE_EVERY;
  let h = '<div class="card safalbum"><div class="card-head"><h2>\u{1F4D6} Photo album</h2><span class="fact">' + tot + " of " + TOTAL + " photos</span></div>" +
    '<p class="lede" style="font-size:13.5px;">Every <b>' + MILE_EVERY + " new photos</b> = +" + MILE_DUST + " ⭐ (next at " + nextMile + "). A full zone page = <b>+" + PAGE_DUST + " ⭐</b> and that zone’s badge. Find all 3 aliens in a zone for its alien badge! (" + full + " of " + ZONES.length + " pages full)</p>" +
    '<button class="btn ghost small" data-pjzone="">← Map</button>';
  ZONES.forEach(z => {
    const open = n >= z.at, c = pageCount(st, z.key), size = pageSize(z.key), al = aliensFound(st, z.key), shown = open && openPage === z.key;
    h += '<div class="safpage' + (open ? "" : " locked") + (c === size ? " full" : "") + '"><button class="safpagehead"' + (open ? ' data-safpage="' + z.key + '"' : " disabled") + "><b>" + (open ? (shown ? "▾ " : "▸ ") : "") + z.icon + " " + esc(z.name) + "</b><span>" +
      (open ? "\u{1F47D} " + al + "/3 · " + c + " / " + size + (c === size ? " ✅" : "") : "\u{1F512} " + z.at + " launches") + "</span></button>" +
      (open ? '<div class="safbar"><i style="width:' + (100 * c / size).toFixed(1) + '%"></i></div>' : "");
    if (shown) h += '<div class="safgrid">' + PAGES[z.key].map(e => { const have = alb[e.key];
      const sk = have && ((plOf(st).spk || {})[e.key]);
      return '<div class="safslot' + (have ? " have" : "") + (sk ? " spk" : "") + (e.alien ? " alien t" + ALIENS[e.alien].tier : "") + '"><div class="safpic">' + entryArt(e, "safimg", !!sk) + "</div><small>" + (have ? esc(e.name) : "???") + "</small>" +
        (e.alien ? '<em class="safrare">\u{1F47D}' + (ALIENS[e.alien].tier === "s" ? " super rare" : ALIENS[e.alien].tier === "r" ? " rare" : "") + "</em>" : "") + "</div>"; }).join("") + "</div>";
    h += "</div>";
  });
  return h + "</div>";
}
if (typeof document !== "undefined") document.addEventListener("click", ev => { const b = ev.target.closest && ev.target.closest("[data-safpage]"); if (!b) return;
  openPage = openPage === b.dataset.safpage ? "__none" : b.dataset.safpage; if (ctx && ctx.rerender) ctx.rerender(); });

/* ---------- the safari itself: a full-screen layer (page redraws don't stop it) ---------- */
let S = null, root = null, ctx = null, lastSaved = null;
// the student as the page has it, plus our last safari save if the page hasn't caught up with it yet
export function freshSt(st) {
  if (!st || !lastSaved || lastSaved.id !== st.id || used(lastSaved.pl) <= used(plOf(st))) return st;
  return Object.assign({}, st, { planet: Object.assign({}, plOf(st), lastSaved.pl) });
}
export function safariSync(c) { ctx = c; }
// ☕ Space Café (Nov 7) saves in planet too: these keep both features from overwriting each other's saves
export const planetNow = () => JSON.parse(JSON.stringify(plOf(freshSt(ctx && ctx.st))));
export const planetCtx = () => ctx;
export function planetSave(pl, extra) {   // extra: other fields saved in the same write (Space Shop: outfits, roomOwned, coll…)
  if (!ctx || !ctx.st) return;
  pl.sv = (Number(pl.sv) || 0) + 1; lastSaved = { id: ctx.st.id, pl: JSON.parse(JSON.stringify(pl)) };
  if (!ctx.preview && ctx.patch) ctx.patch(Object.assign({ planet: pl }, extra || {}));
}
export const safariBusy = () => !!S;
const rootEl = () => {
  if (!root) { root = document.createElement("div"); root.id = "safroot"; document.body.appendChild(root);
    root.addEventListener("pointerdown", ev => { const t = ev.target.closest("[data-safsnap]"); if (t) { ev.preventDefault(); snap(t.dataset.safsnap); } });
    root.addEventListener("click", ev => { const b = ev.target.closest("[data-saf]"); if (b) safAct(b.dataset.saf); }); }
  return root;
};
if (typeof document !== "undefined") document.addEventListener("click", ev => { const b = ev.target.closest && ev.target.closest("[data-safari]"); if (b && !(root && root.contains(b))) startSafari(b.dataset.safari);
  const sb = ev.target.closest && ev.target.closest("[data-safbuy]"); if (sb && ctx && ctx.st) buyNet(sb.dataset.safbuy, !!(root && root.contains(sb))); });
function buyNet(k, inSafari) {
  const net = NETS.find(n => n.k === k); if (!net) return;
  const pl = JSON.parse(JSON.stringify(inSafari && S ? S.pl : plOf(freshSt(ctx.st)))); if ((Number(pl.dust) || 0) < net.cost) return;
  pl.sv = (Number(pl.sv) || 0) + 1; pl.dust = (Number(pl.dust) || 0) - net.cost; pl.nets = Object.assign({}, pl.nets || {}, { [k]: (Number((pl.nets || {})[k]) || 0) + 1 });
  lastSaved = { id: ctx.st.id, pl: JSON.parse(JSON.stringify(pl)) };
  if (S) S.pl = pl;
  if (!ctx.preview && ctx.patch) ctx.patch({ planet: pl });
  if (S) { drawTools(); upd(); } else if (ctx.rerender) ctx.rerender();
}

const curPl = () => (S && S.pl) || plOf(ctx && ctx.st);
const today = () => azToday();
function startSafari(zk) {
  if (!ctx || !ctx.st || !PAGES[zk]) return;
  const pl = JSON.parse(JSON.stringify(plOf(freshSt(ctx.st))));
  S = { zk, pl, t: [], spawn: null, shot: null, tool: "cam" };
  draw(); later(700, next);
}
const later = (ms, fn) => S && S.t.push(setTimeout(fn, ms));
function stop() { if (!S) return; S.t.forEach(clearTimeout); S = null; if (root) root.innerHTML = ""; if (ctx && ctx.rerender) ctx.rerender(); }
const fakeSt = () => ({ planet: S.pl });
let saveN = 0;   // every safari save counts up, so the page's copy is known to be behind until it catches up
const used = pl => Number(pl && pl.sv) || 0;
function save(pl) {
  pl.sv = (Number(pl.sv) || 0) + 1;
  S.pl = pl; lastSaved = { id: ctx && ctx.st && ctx.st.id, pl: JSON.parse(JSON.stringify(pl)) };
  if (ctx && !ctx.preview && ctx.patch) ctx.patch({ planet: pl });
}
function draw() {
  const z = ZONES.find(x => x.key === S.zk), f = filmLeft(fakeSt());
  rootEl().innerHTML = '<div class="safover"><div class="safscene" id="safscene" style="background-image:url(' + A + "zone-" + S.zk + '.webp)">' +
    '<div class="saffinder" aria-hidden="true"><i></i><i></i><i></i><i></i></div><div id="safspot"></div><div class="safflash" id="safflash"></div><div id="safcard"></div></div>' +
    '<div class="saftop"><b>\u{1F4F8} ' + z.icon + " " + esc(z.name) + ' Safari</b><span class="saffilm">\u{1F39E}️ <b id="saffilm">' + f + "</b> film</span>" +
    '<span class="saffilm">\u{1F4D6} <b id="safpg">' + pageCount(fakeSt(), S.zk) + "</b>/" + pageSize(S.zk) + '</span><span class="saffilm">\u{1F47D} <b id="safal">' + aliensFound(fakeSt(), S.zk) + "</b>/3</span>" + '<span class="saffilm">⭐ <b id="safdust">' + (Number(S.pl.dust) || 0) + "</b></span>" +
    (ctx && ctx.preview ? '<span class="saffilm">\u{1F440} preview</span>' : "") + '<button class="btn ghost small" data-saf="done">Done</button></div><div class="saftools" id="saftools"></div>' +
    '<p class="safhint" id="safhint">' + (f ? "Creatures peek out and hide again. Tap one to take its photo!" : "Out of film for today.") + "</p></div>";
  drawTools();
  if (!f && S.tool === "cam" && !NETS.some(n => (Number(netsOf(fakeSt())[n.k]) || 0) > 0)) noFilm();
}
function drawTools() {
  const el = document.getElementById("saftools"); if (!el || !S) return;
  const nets = netsOf(fakeSt()), f = filmLeft(fakeSt());
  if (S.tool !== "cam" && !(Number(nets[S.tool]) > 0)) S.tool = "cam";
  el.innerHTML = '<button class="saftool' + (S.tool === "cam" ? " on" : "") + '" data-saf="tool:cam">\u{1F4F8} Camera <b>' + f + "</b></button>" +
    NETS.map(n => { const c = Number(nets[n.k]) || 0; return '<button class="saftool' + (S.tool === n.k ? " on" : "") + '" data-saf="tool:' + n.k + '"' + (c ? "" : " disabled") + ">" + netImg(n, "saftoolimg") + " " + esc(n.name) + " <b>" + c + "</b></button>"; }).join("");
  const sc = document.getElementById("safscene"); if (sc) sc.classList.toggle("netmode", S.tool !== "cam");
}
const upd = () => { drawTools(); const f = filmLeft(fakeSt()); [["saffilm", f], ["safpg", pageCount(fakeSt(), S.zk)], ["safal", aliensFound(fakeSt(), S.zk)], ["safdust", Number(S.pl.dust) || 0]].forEach(([id, v]) => { const e = document.getElementById(id); if (e) e.textContent = v; }); };
const SHOW = { Common: 2300, Uncommon: 1900, Rare: 1450, "Super Rare": 1150, Alien: 1400, "Rare Alien": 950, "Super Rare Alien": 750 };
const WEIGHT = { Common: 10, Uncommon: 7, Rare: 4, "Super Rare": 2.5 };
const STAGE_W = [1, 1, 0.6, 0.35];
// aliens scale with the page so they're just as findable on a big page: common ~1 in 15 spawns, rare ~1 in 35, super rare ~1 in 70
const AL_SHARE = { c: 0.065, r: 0.028, s: 0.014 };
function weights(page, alb) {
  const ws = page.map(x => x.alien ? 0 : WEIGHT[x.rarity] * (STAGE_W[x.stage] || 0.35) * (alb[x.key] ? 1 : 2)), base = ws.reduce((a, b) => a + b, 0);
  page.forEach((x, i) => { if (x.alien) { const t = ALIENS[x.alien].tier; ws[i] = base * AL_SHARE[t] * (alb[x.key] ? 0.6 : 1); } });
  return ws;
}
function next() {
  if (!S || S.shot) return;
  if (minsNow() >= pjWindow(ctx && ctx.st, ctx && ctx.cls).c && !(ctx && ctx.preview)) { hint("Planet JP is closing for today. See you tomorrow!"); later(1800, stop); return; }
  if (S.tool === "cam" && !filmLeft(fakeSt())) return noFilm();
  const page = PAGES[S.zk], alb = normAlb(S.pl.alb);
  let e = (typeof window !== "undefined" && window.__safPick) ? page.find(x => x.key === window.__safPick) : null;
  if (!e) { const ws = weights(page, alb), tot = ws.reduce((a, b) => a + b, 0); let r = Math.random() * tot; e = page[page.length - 1];
    for (let i = 0; i < page.length; i++) { r -= ws[i]; if (r <= 0) { e = page[i]; break; } } }
  const x = 8 + Math.random() * 72, y = 30 + Math.random() * 42, flip = Math.random() < 0.5, ms = (typeof window !== "undefined" && window.__safSlow) ? 60000 : SHOW[e.rarity];
  S.spawn = e.key; S.spk = (typeof window !== "undefined" && window.__safSparkle != null) ? !!window.__safSparkle : Math.random() < SAF_SPARKLE;
  const sp = document.getElementById("safspot"); if (!sp) return;
  sp.innerHTML = '<button class="safcrit' + (e.alien ? " alien" : "") + '" data-safsnap="' + e.key + '" style="left:' + x.toFixed(1) + "%;top:" + y.toFixed(1) + "%;--d:" + ms + 'ms" aria-label="Take a photo">' +
    '<span class="safbush"></span>' + (S.spk ? '<span class="safglitter"><i></i><i></i><i></i><i></i><i></i></span>' : "") + '<span class="safbody' + (flip ? " flip" : "") + '">' + entryArt(e, "safcimg", S.spk) + "</span></button>";
  later(ms, () => { if (!S || S.shot) return; S.spawn = null; sp.innerHTML = ""; later(350 + Math.random() * 700, next); });
}
const hint = t => { const e = document.getElementById("safhint"); if (e) e.textContent = t; };
function snap(key) {
  if (S && S.tool !== "cam") return throwNet(key);
  if (!S || S.shot || S.spawn !== key || !filmLeft(fakeSt())) return;
  const e = PAGES[S.zk].find(x => x.key === key); if (!e) return;
  S.t.forEach(clearTimeout); S.t = []; S.shot = key; S.spawn = null;
  setTimeout(() => { const sp = document.getElementById("safspot"); if (sp) sp.innerHTML = ""; }, 120);
  const pl = JSON.parse(JSON.stringify(S.pl)), d = today(), sf = pl.saf && pl.saf.d === d ? pl.saf : { d, u: 0, b: 0 };
  sf.u = (Number(sf.u) || 0) + 1; pl.saf = sf;
  const alb = normAlb(pl.alb), isNew = !alb[key];
  alb[key] = (Number(alb[key]) || 0) + 1; pl.alb = alb;
  let gain = isNew ? 0 : DUPE_DUST, pageDone = false, mile = 0, alDone = false;
  const pg = (pl.pg || []).slice();
  if (isNew && PAGES[S.zk].every(x => alb[x.key]) && !pg.includes(S.zk)) { pg.push(S.zk); pl.pg = pg; gain += PAGE_DUST; pageDone = true; }
  // every 10 new photos (whole album) = +25 Stardust
  const miles = Math.floor(Object.keys(alb).length / MILE_EVERY), paid = Number(pl.ms) || 0;
  if (isNew && miles > paid) { mile = (miles - paid) * MILE_DUST; gain += mile; pl.ms = miles; }
  if (isNew && e.alien && zoneAliens(S.zk).every(x => alb[x.key])) alDone = true;
  const spk = !!S.spk, spkNew = spk && !((pl.spk || {})[key]);
  if (spkNew) { pl.spk = Object.assign({}, pl.spk || {}, { [key]: 1 }); gain += SPARKLE_DUST; }
  if (gain) pl.dust = (Number(pl.dust) || 0) + gain;
  save(pl); shutter();
  const fl = document.getElementById("safflash"); if (fl) { fl.classList.remove("on"); void fl.offsetWidth; fl.classList.add("on"); }
  const z = ZONES.find(x => x.key === S.zk), left = filmLeft(fakeSt());
  const card = document.getElementById("safcard");
  if (card) card.innerHTML = '<div class="safpola' + (e.alien ? " alien" : "") + (spk ? " spk" : "") + '"><div class="safpolapic" style="background-image:url(' + A + "zone-" + S.zk + '.webp)">' + entryArt(e, "safpimg", spk) + "</div>" +
    (spk ? '<p class="safspk">✨ SPARKLE! ✨' + (spkNew ? " +" + SPARKLE_DUST + " ⭐" : "") + "</p>" : "") +
    "<b>" + esc(e.name) + '</b><small class="safr">' + (e.alien ? "\u{1F47D} " + esc(ALIENS[e.alien].rarity) + " \u00b7 only on Planet JP!" : esc(e.rarity) + (e.stage > 1 ? " \u00b7 evolved form" : "")) + "</small>" +
    (isNew ? '<p class="safnew">\u{1F195} Added to your album!</p>' : '<p class="safdupe">Already in your album · +' + DUPE_DUST + " ⭐</p>") +
    (e.alien && isNew ? '<p class="small">' + esc(ALIENS[e.alien].line) + "</p>" : "") +
    (mile ? '<p class="safdone">\u{1F389} ' + Object.keys(alb).length + " photos in your album! +" + mile + " ⭐</p>" : "") +
    (alDone ? '<p class="safdone">\u{1F47D} You found all 3 ' + esc(z.name) + " aliens! New badge!</p>" : "") +
    (pageDone ? '<p class="safdone">\u{1F3C6} ' + esc(z.name) + " page complete! +" + PAGE_DUST + " ⭐ Stardust and a new badge!</p>" : "") +
    '<div class="row" style="justify-content:center;gap:8px;margin-top:8px;">' +
    (left ? '<button class="btn gold small" data-saf="again">\u{1F4F8} Keep going (' + left + " film)</button>" : "") +
    '<button class="btn ghost small" data-saf="done">' + (left ? "Done" : "Done for today") + "</button></div></div>";
  upd();
  if (pageDone || alDone || mile) setTimeout(() => { try { [1318, 1568, 1976, 2637, 3136].forEach((f, i) => setTimeout(() => beep(f, 0.14), i * 110)); } catch (x) {} }, 400);
}
// 🫧 throw a net: used up either way; caught = Collector (new at Lv 1, or +1 level) + album
function throwNet(key) {
  if (!S || S.shot || S.spawn !== key) return;
  const net = NETS.find(n => n.k === S.tool), e = PAGES[S.zk].find(x => x.key === key); if (!net || !e) return;
  const nets = netsOf(fakeSt()); if (!(Number(nets[net.k]) > 0)) return;
  S.t.forEach(clearTimeout); S.t = []; S.shot = key; S.spawn = null;
  const ch = catchChance(net, e), forced = typeof window !== "undefined" && window.__safCatch, caught = forced != null ? !!forced : Math.random() < ch;
  const pl = JSON.parse(JSON.stringify(S.pl)); pl.nets = Object.assign({}, pl.nets || {}, { [net.k]: Number(nets[net.k]) - 1 });
  const fam = e.alien ? (ALIENS[e.alien] || {}).fam : e.fam, data = {};
  let lvlTxt = "", isNew = false, mile = 0, pageDone = false, gain = 0, spkCaught = false; const spk = !!S.spk;
  if (caught && fam) {
    const coll = Object.assign({}, S.coll || (ctx && ctx.st && ctx.st.coll) || {}), had = coll[fam];
    coll[fam] = had ? Object.assign({}, had, { lvl: Math.min(100, (Number(had.lvl) || 1) + 1) }) : { lvl: 1, at: new Date().toISOString(), caught: true };
    if (S.spk) { if (!(had && had.sparkle)) spkCaught = true; coll[fam].sparkle = true; pl.spk = Object.assign({}, pl.spk || {}, { [key]: 1 }); }
    lvlTxt = had ? "+1 level! It\u2019s now Lv " + coll[fam].lvl + "." : "It joined your Creature Collector!";
    data.coll = coll; data.collTouch = [fam]; S.coll = coll;   // the rules check exactly the family that changed
    const alb = normAlb(pl.alb); isNew = !alb[key]; alb[key] = (Number(alb[key]) || 0) + 1; pl.alb = alb;   // a catch counts as seeing it, too
    if (isNew) { const miles = Math.floor(Object.keys(alb).length / MILE_EVERY), paid = Number(pl.ms) || 0; if (miles > paid) { mile = (miles - paid) * MILE_DUST; gain += mile; pl.ms = miles; }
      const pg = (pl.pg || []).slice(); if (PAGES[S.zk].every(x => alb[x.key]) && !pg.includes(S.zk)) { pg.push(S.zk); pl.pg = pg; gain += PAGE_DUST; pageDone = true; } }
    if (gain) pl.dust = (Number(pl.dust) || 0) + gain;
  }
  pl.sv = (Number(pl.sv) || 0) + 1; S.pl = pl; lastSaved = { id: ctx && ctx.st && ctx.st.id, pl: JSON.parse(JSON.stringify(pl)) };
  if (ctx && !ctx.preview && ctx.patch) ctx.patch(Object.assign({ planet: pl }, data));
  const sp = document.getElementById("safspot"), crit = sp && sp.querySelector(".safcrit");
  if (crit) { const n = document.createElement("span"); n.className = "safthrow"; n.innerHTML = netImg(net, "safthrowimg"); crit.appendChild(n); crit.classList.add(caught ? "caught" : "escaped"); }
  beep(caught ? 880 : 300, 0.2);
  setTimeout(() => {
    if (sp) sp.innerHTML = "";
    const card = document.getElementById("safcard"), left = Number(pl.nets[net.k]) || 0;
    if (card) card.innerHTML = '<div class="safpola' + (e.alien ? " alien" : "") + (caught ? " caughtcard" : "") + (spk ? " spk" : "") + '"><div class="safpolapic" style="background-image:url(' + A + "zone-" + S.zk + '.webp)">' + entryArt(e, "safpimg" + (caught ? "" : " gone"), spk) + "</div>" +
      (spk ? '<p class="safspk">✨ SPARKLE! ✨' + (spkCaught ? " Your " + esc(e.name) + " is a Sparkle now!" : "") + "</p>" : "") +
      (caught ? "<b>\u{1F389} You caught " + esc(e.name) + "!</b><p class=\"safnew\">" + lvlTxt + "</p>" : "<b>" + esc(e.name) + " got away!</b><p class=\"safdupe\">The " + esc(net.name) + " missed. (" + Math.round(ch * 100) + "% chance)</p>") +
      (mile ? '<p class="safdone">\u{1F389} +' + mile + " ⭐ album milestone!</p>" : "") + (pageDone ? '<p class="safdone">\u{1F3C6} Page complete! +' + PAGE_DUST + " ⭐</p>" : "") +
      '<div class="row" style="justify-content:center;gap:8px;margin-top:8px;"><button class="btn gold small" data-saf="again">' + (left ? netImg(net, "saftoolimg") + " Keep going (" + left + " left)" : "\u{1F4F8} Keep going") + '</button><button class="btn ghost small" data-saf="done">Done</button></div></div>';
    drawTools(); upd();
    if (caught) { try { [1047, 1319, 1568, 2093].forEach((f, i) => setTimeout(() => beep(f, 0.14), i * 110)); } catch (x) {} }
  }, 1100);
}
function noFilm() {
  const card = document.getElementById("safcard"), dust = Number(S.pl.dust) || 0; S.shot = "film";
  if (card) card.innerHTML = '<div class="safpola"><h3>\u{1F39E}️ Out of film</h3><p class="small">You get ' + FREE_FILM + " free film every Planet JP day.</p>" +
    '<div class="row" style="justify-content:center;gap:8px;margin-top:8px;">' +
    (dust >= ROLL_COST ? '<button class="btn gold small" data-saf="buy">Buy a roll (' + ROLL_FILM + " film) for " + ROLL_COST + " ⭐</button>" : '<span class="small muted">A new roll costs ' + ROLL_COST + " ⭐ Stardust.</span>") +
    '<button class="btn ghost small" data-saf="done">Done</button></div></div>';
}
function safAct(a) {
  if (!S) return;
  if (a === "done") return stop();
  if (a.startsWith("tool:")) { const k = a.slice(5); if (k !== "cam" && !(Number(netsOf(fakeSt())[k]) > 0)) return; S.tool = k; drawTools();
    hint(k === "cam" ? "Tap a creature to take its photo!" : "Net ready! Tap a creature to throw your " + NETS.find(n => n.k === k).name + "."); if (S.shot === "film") { S.shot = null; const c = document.getElementById("safcard"); if (c) c.innerHTML = ""; later(300, next); } return; }
  if (a === "again") { S.shot = null; const c = document.getElementById("safcard"); if (c) c.innerHTML = ""; const sp = document.getElementById("safspot"); if (sp) sp.innerHTML = ""; S.spawn = null; later(400, next); return; }
  if (a === "buy") {
    const pl = JSON.parse(JSON.stringify(S.pl)); if ((Number(pl.dust) || 0) < ROLL_COST) return;
    const d = today(), sf = pl.saf && pl.saf.d === d ? pl.saf : { d, u: 0, b: 0 };
    sf.b = (Number(sf.b) || 0) + ROLL_FILM; pl.saf = sf; pl.dust = (Number(pl.dust) || 0) - ROLL_COST;
    save(pl); S.shot = null; const c = document.getElementById("safcard"); if (c) c.innerHTML = ""; upd(); hint("New roll loaded! Tap a creature to take its photo."); later(400, next);
  }
}
/* sounds (off when ck-mute is set) */
let AC = null;
const ac = () => { try { if (localStorage.getItem("ck-mute") === "1") return null; } catch (e) {} try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === "suspended") AC.resume(); return AC; } catch (e) { return null; } };
function beep(f, d) { const a = ac(); if (!a) return; const t = a.currentTime, o = a.createOscillator(), g = a.createGain(); o.type = "triangle"; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.08, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + (d || 0.18)); o.connect(g).connect(a.destination); o.start(t); o.stop(t + (d || 0.18) + 0.05); }
function shutter() { const a = ac(); if (!a) return; const n = Math.floor(a.sampleRate * 0.12), b = a.createBuffer(1, n, a.sampleRate), x = b.getChannelData(0); for (let i = 0; i < n; i++) x[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = a.createBufferSource(), g = a.createGain(); s.buffer = b; g.gain.value = 0.25; s.connect(g).connect(a.destination); s.start(); setTimeout(() => beep(1760, 0.08), 120); }
