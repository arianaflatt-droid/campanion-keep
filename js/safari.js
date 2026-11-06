/* ---------- 📸 Planet JP Creature Safari + Photo Album, Wave 3b (Nov 7) ----------
   In each unlocked zone a student can go on a safari: the zone scene fills the screen and creatures peek out and
   hide again. Tapping one before it hides takes its photo (1 film). 3 free film a day; an extra roll (3 film) costs
   10 Stardust. A photo of a creature that isn't in the album yet is added; a repeat gives +2 Stardust instead.
   Each zone's album page has 9 spots: 8 creatures of the zone's types (no Legendaries or Ultras) + 1 rare Planet JP
   alien. A full page = +100 Stardust (once) and a zone badge (worked out in badges.js from the album, nothing extra stored).
   Saved on the student in planet: alb = { famId: photos, "A-zone": photos }, saf = { d: day, u: film used, b: film bought },
   pg = [zone keys already paid]. One write per photo (≤3 a day unless they buy film). Preview saves nothing. */
import { CREATURES } from "./creatures.js?v=20261107d";
import { esc } from "./game.js?v=20261107d";
import { azToday, azNow } from "./collect.js?v=20261107d";

const A = "assets/planet/";
export const PJ_CLOSE_M = 12 * 60 + 55;
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

// The 7 Planet JP aliens: one rare one per zone. ART flips to true once its picture is in assets/planet/alien-<zone>.webp
export const ALIENS = {
  landing: { name: "Zibbit", color: "#7FD3FF", line: "A tiny robot-eared alien that tinkers with spaceship bolts." },
  jungle: { name: "Glimmersprout", color: "#7BEA7B", line: "A leafy alien whose antenna glows like a firefly." },
  caves: { name: "Geodorb", color: "#C69CFF", line: "A round crystal alien that rolls through the caves." },
  ice: { name: "Frostnik", color: "#BDEBFF", line: "A fluffy snow alien that skates on frozen lakes." },
  lava: { name: "Magmallow", color: "#FF9A57", line: "A squishy marshmallow alien that loves warm lava baths." },
  nebula: { name: "Nebuloo", color: "#FF8BD8", line: "A floaty cloud alien made of rainbow stardust." },
  shadow: { name: "Lanternook", color: "#FFD36B", line: "A shy alien that carries a glowing lantern in the dark." },
};
export const ALIEN_ART = { landing: false, jungle: false, caves: false, ice: false, lava: false, nebula: false, shadow: false };

export const FREE_FILM = 3, ROLL_FILM = 3, ROLL_COST = 10, DUPE_DUST = 2, PAGE_DUST = 100;
const PICK = [["Common", 3], ["Uncommon", 2], ["Rare", 2], ["Super Rare", 1]];
const hash = s => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
// each zone's 8 album creatures (first form of a family whose main type lives in that zone), picked the same way every time
const FIRSTS = (() => { const seen = {}; CREATURES.forEach(c => { if (c.event || c.rarity === "Legendary" || c.rarity === "Ultra" || seen[c.fam]) return; if ((c.stage || 1) === 1) seen[c.fam] = c; }); return Object.values(seen); })();
export const PAGES = {};
ZONES.forEach(z => {
  const pool = FIRSTS.filter(c => z.types.includes(c.types[0]));
  const out = [];
  PICK.forEach(([r, n]) => pool.filter(c => c.rarity === r).sort((a, b) => hash(z.key + a.fam) - hash(z.key + b.fam)).slice(0, n).forEach(c => out.push(c)));
  PAGES[z.key] = out.map(c => ({ key: c.fam, name: c.name, rarity: c.rarity, img: c.img, types: c.types }))
    .concat([{ key: "A-" + z.key, name: ALIENS[z.key].name, rarity: "Planet JP", alien: z.key }]);
});
export const PAGE_SIZE = 9;

const plOf = st => (st && st.planet) || {};
export const album = st => plOf(st).alb || {};
export const pageCount = (st, zk) => (PAGES[zk] || []).filter(e => album(st)[e.key]).length;
export function filmLeft(st) { const s = plOf(st).saf || {}; return s.d === azToday() ? Math.max(0, FREE_FILM + (Number(s.b) || 0) - (Number(s.u) || 0)) : FREE_FILM; }

const alienSVG = (zk, cls) => { const c = (ALIENS[zk] || {}).color || "#9CF";
  return '<svg class="' + (cls || "") + '" viewBox="0 0 100 100" aria-hidden="true"><line x1="38" y1="22" x2="30" y2="6" stroke="#333" stroke-width="3"/><line x1="62" y1="22" x2="70" y2="6" stroke="#333" stroke-width="3"/>' +
    '<circle cx="30" cy="6" r="5" fill="' + c + '" stroke="#333" stroke-width="2"/><circle cx="70" cy="6" r="5" fill="' + c + '" stroke="#333" stroke-width="2"/>' +
    '<ellipse cx="50" cy="56" rx="34" ry="36" fill="' + c + '" stroke="#333" stroke-width="3"/><ellipse cx="38" cy="50" rx="8" ry="11" fill="#222"/><ellipse cx="62" cy="50" rx="8" ry="11" fill="#222"/>' +
    '<circle cx="35" cy="46" r="3" fill="#fff"/><circle cx="59" cy="46" r="3" fill="#fff"/><path d="M40 72 Q50 80 60 72" fill="none" stroke="#333" stroke-width="3" stroke-linecap="round"/></svg>'; };
export const entryArt = (e, cls) => e.alien ? (ALIEN_ART[e.alien] ? '<img class="' + (cls || "") + '" src="' + A + "alien-" + e.alien + '.webp" alt="">' : alienSVG(e.alien, cls)) : '<img class="' + (cls || "") + '" src="' + e.img + '" alt="">';

/* ---------- the album (drawn inside the Planet JP tab) ---------- */
export function albumHTML(st, n) {
  const alb = album(st), full = ZONES.filter(z => pageCount(st, z.key) === PAGE_SIZE).length;
  let h = '<div class="card safalbum"><div class="card-head"><h2>\u{1F4D6} Photo album</h2><span class="fact">' + full + " of " + ZONES.length + " pages full</span></div>" +
    '<p class="lede" style="font-size:13.5px;">Fill a page with all 9 photos for <b>+' + PAGE_DUST + " ⭐ Stardust</b> and that zone’s badge!</p>" +
    '<button class="btn ghost small" data-pjzone="">← Map</button>';
  ZONES.forEach(z => {
    const open = n >= z.at, c = pageCount(st, z.key);
    h += '<div class="safpage' + (open ? "" : " locked") + (c === PAGE_SIZE ? " full" : "") + '"><div class="safpagehead"><b>' + z.icon + " " + esc(z.name) + "</b><span>" +
      (open ? c + " / " + PAGE_SIZE + (c === PAGE_SIZE ? " ✅" : "") : "\u{1F512} " + z.at + " launches") + "</span></div>";
    if (open) h += '<div class="safgrid">' + PAGES[z.key].map(e => { const have = alb[e.key];
      return '<div class="safslot' + (have ? " have" : "") + (e.alien ? " alien" : "") + '"><div class="safpic">' + entryArt(e, "safimg") + "</div><small>" + (have ? esc(e.name) : "???") + "</small>" +
        (e.alien ? '<em class="safrare">\u{1F47D} rare</em>' : "") + "</div>"; }).join("") + "</div>";
    h += "</div>";
  });
  return h + "</div>";
}

/* ---------- the safari itself: a full-screen layer (page redraws don't stop it) ---------- */
let S = null, root = null, ctx = null, lastSaved = null;
// the student as the page has it, plus our last safari save if the page hasn't caught up with it yet
export function freshSt(st) {
  if (!st || !lastSaved || lastSaved.id !== st.id || used(lastSaved.pl) <= used(plOf(st))) return st;
  return Object.assign({}, st, { planet: Object.assign({}, plOf(st), lastSaved.pl) });
}
export function safariSync(c) { ctx = c; }
export const safariBusy = () => !!S;
const rootEl = () => {
  if (!root) { root = document.createElement("div"); root.id = "safroot"; document.body.appendChild(root);
    root.addEventListener("pointerdown", ev => { const t = ev.target.closest("[data-safsnap]"); if (t) { ev.preventDefault(); snap(t.dataset.safsnap); } });
    root.addEventListener("click", ev => { const b = ev.target.closest("[data-saf]"); if (b) safAct(b.dataset.saf); }); }
  return root;
};
if (typeof document !== "undefined") document.addEventListener("click", ev => { const b = ev.target.closest && ev.target.closest("[data-safari]"); if (b && !(root && root.contains(b))) startSafari(b.dataset.safari); });

const curPl = () => (S && S.pl) || plOf(ctx && ctx.st);
const today = () => azToday();
function startSafari(zk) {
  if (!ctx || !ctx.st || !PAGES[zk]) return;
  const pl = JSON.parse(JSON.stringify(plOf(freshSt(ctx.st))));
  S = { zk, pl, t: [], spawn: null, shot: null };
  draw(); later(700, next);
}
const later = (ms, fn) => S && S.t.push(setTimeout(fn, ms));
function stop() { if (!S) return; S.t.forEach(clearTimeout); S = null; if (root) root.innerHTML = ""; if (ctx && ctx.rerender) ctx.rerender(); }
const fakeSt = () => ({ planet: S.pl });
const used = pl => { const f = (pl && pl.saf) || {}; return f.d === today() ? (Number(f.u) || 0) + (Number(f.b) || 0) * 0.01 + 0.001 : 0; };
function save(pl) {
  S.pl = pl; lastSaved = { id: ctx && ctx.st && ctx.st.id, pl: JSON.parse(JSON.stringify(pl)) };
  if (ctx && !ctx.preview && ctx.patch) ctx.patch({ planet: pl });
}
function draw() {
  const z = ZONES.find(x => x.key === S.zk), f = filmLeft(fakeSt());
  rootEl().innerHTML = '<div class="safover"><div class="safscene" id="safscene" style="background-image:url(' + A + "zone-" + S.zk + '.webp)">' +
    '<div class="saffinder" aria-hidden="true"><i></i><i></i><i></i><i></i></div><div id="safspot"></div><div class="safflash" id="safflash"></div><div id="safcard"></div></div>' +
    '<div class="saftop"><b>\u{1F4F8} ' + z.icon + " " + esc(z.name) + ' Safari</b><span class="saffilm">\u{1F39E}️ <b id="saffilm">' + f + "</b> film</span>" +
    '<span class="saffilm">\u{1F4D6} <b id="safpg">' + pageCount(fakeSt(), S.zk) + "</b>/" + PAGE_SIZE + '</span><span class="saffilm">⭐ <b id="safdust">' + (Number(S.pl.dust) || 0) + "</b></span>" +
    (ctx && ctx.preview ? '<span class="saffilm">\u{1F440} preview</span>' : "") + '<button class="btn ghost small" data-saf="done">Done</button></div>' +
    '<p class="safhint" id="safhint">' + (f ? "Creatures peek out and hide again. Tap one to take its photo!" : "Out of film for today.") + "</p></div>";
  if (!f) noFilm();
}
const upd = () => { const f = filmLeft(fakeSt()); [["saffilm", f], ["safpg", pageCount(fakeSt(), S.zk)], ["safdust", Number(S.pl.dust) || 0]].forEach(([id, v]) => { const e = document.getElementById(id); if (e) e.textContent = v; }); };
const SHOW = { Common: 2300, Uncommon: 1900, Rare: 1450, "Super Rare": 1150, "Planet JP": 900 };
const WEIGHT = { Common: 10, Uncommon: 7, Rare: 4, "Super Rare": 2.5, "Planet JP": 1.6 };
function next() {
  if (!S || S.shot) return;
  if (minsNow() >= PJ_CLOSE_M && !(ctx && ctx.preview)) { hint("Planet JP is closing for today. See you tomorrow!"); later(1800, stop); return; }
  if (!filmLeft(fakeSt())) return noFilm();
  const page = PAGES[S.zk], alb = S.pl.alb || {};
  let e = (typeof window !== "undefined" && window.__safPick) ? page.find(x => x.key === window.__safPick) : null;
  if (!e) { const ws = page.map(x => WEIGHT[x.rarity] * (alb[x.key] ? 1 : 2)), tot = ws.reduce((a, b) => a + b, 0); let r = Math.random() * tot; e = page[page.length - 1];
    for (let i = 0; i < page.length; i++) { r -= ws[i]; if (r <= 0) { e = page[i]; break; } } }
  const x = 8 + Math.random() * 72, y = 30 + Math.random() * 42, flip = Math.random() < 0.5, ms = (typeof window !== "undefined" && window.__safSlow) ? 60000 : SHOW[e.rarity];
  S.spawn = e.key;
  const sp = document.getElementById("safspot"); if (!sp) return;
  sp.innerHTML = '<button class="safcrit' + (e.alien ? " alien" : "") + '" data-safsnap="' + e.key + '" style="left:' + x.toFixed(1) + "%;top:" + y.toFixed(1) + "%;--d:" + ms + 'ms" aria-label="Take a photo">' +
    '<span class="safbush"></span><span class="safbody' + (flip ? " flip" : "") + '">' + entryArt(e, "safcimg") + "</span></button>";
  later(ms, () => { if (!S || S.shot) return; S.spawn = null; sp.innerHTML = ""; later(350 + Math.random() * 700, next); });
}
const hint = t => { const e = document.getElementById("safhint"); if (e) e.textContent = t; };
function snap(key) {
  if (!S || S.shot || S.spawn !== key || !filmLeft(fakeSt())) return;
  const e = PAGES[S.zk].find(x => x.key === key); if (!e) return;
  S.t.forEach(clearTimeout); S.t = []; S.shot = key; S.spawn = null;
  setTimeout(() => { const sp = document.getElementById("safspot"); if (sp) sp.innerHTML = ""; }, 120);
  const pl = JSON.parse(JSON.stringify(S.pl)), d = today(), sf = pl.saf && pl.saf.d === d ? pl.saf : { d, u: 0, b: 0 };
  sf.u = (Number(sf.u) || 0) + 1; pl.saf = sf;
  const alb = Object.assign({}, pl.alb || {}), isNew = !alb[key];
  alb[key] = (Number(alb[key]) || 0) + 1; pl.alb = alb;
  let gain = isNew ? 0 : DUPE_DUST, pageDone = false;
  const pg = (pl.pg || []).slice();
  if (isNew && PAGES[S.zk].every(x => alb[x.key]) && !pg.includes(S.zk)) { pg.push(S.zk); pl.pg = pg; gain += PAGE_DUST; pageDone = true; }
  if (gain) pl.dust = (Number(pl.dust) || 0) + gain;
  save(pl); shutter();
  const fl = document.getElementById("safflash"); if (fl) { fl.classList.remove("on"); void fl.offsetWidth; fl.classList.add("on"); }
  const z = ZONES.find(x => x.key === S.zk), left = filmLeft(fakeSt());
  const card = document.getElementById("safcard");
  if (card) card.innerHTML = '<div class="safpola' + (e.alien ? " alien" : "") + '"><div class="safpolapic" style="background-image:url(' + A + "zone-" + S.zk + '.webp)">' + entryArt(e, "safpimg") + "</div>" +
    "<b>" + esc(e.name) + '</b><small class="safr">' + (e.alien ? "\u{1F47D} Rare Planet JP alien!" : esc(e.rarity)) + "</small>" +
    (isNew ? '<p class="safnew">\u{1F195} Added to your album!</p>' : '<p class="safdupe">Already in your album · +' + DUPE_DUST + " ⭐</p>") +
    (e.alien && isNew ? '<p class="small">' + esc(ALIENS[e.alien].line) + "</p>" : "") +
    (pageDone ? '<p class="safdone">\u{1F3C6} ' + esc(z.name) + " page complete! +" + PAGE_DUST + " ⭐ Stardust and a new badge!</p>" : "") +
    '<div class="row" style="justify-content:center;gap:8px;margin-top:8px;">' +
    (left ? '<button class="btn gold small" data-saf="again">\u{1F4F8} Keep going (' + left + " film)</button>" : "") +
    '<button class="btn ghost small" data-saf="done">' + (left ? "Done" : "Done for today") + "</button></div></div>";
  upd();
  if (pageDone) setTimeout(() => { try { [1318, 1568, 1976, 2637, 3136].forEach((f, i) => setTimeout(() => beep(f, 0.14), i * 110)); } catch (x) {} }, 400);
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
