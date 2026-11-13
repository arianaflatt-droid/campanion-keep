/* ---------- 🌊 The Axolotl Kingdom (built Nov 11, from the approved preview video) ----------
   A reward land under the sea. It opens when a student reaches their weekly XP AND closes all their rings
   (the same rule as the Treasure Vault: doors.js vaultMet) and stays open until Sunday 10 pm (Arizona). A new week starts locked.
   Ms. Ariana turns the tab on and off in the console (cls.kdOn).
   - 🦆 The Submarine Trip (first visit each week): Captain Duck at the dock, the dive, this week's minigame
     (Bubble Dash / Jelly Drift / Treasure Claw / Glow Cave, by which Monday of the month it is), then docking in the castle pool.
     The minigame pays up to 20 pearls, once a week. "Watch the trip again" replays it just for fun.
   - 👑 Throne Room: Queen Bubbles' Royal Clam holds the TREASURE OF THE WEEK (one for every week of the year, 52 in all).
   - 🧰 Treasure Grotto: 12 monthly shelves, one spot for every week. Missed weeks stay empty.
   - 🫧 Pearl Caves: Pearl Diving as your own Bubble's Baby (swim anywhere), 3 dives a week.
   - 🐚 Pearl Shop (the shipwreck): the Coral Palace room set and 4 undersea outfits, bought with pearls.
   Saved on the student as kd = { w: the week (Monday), c: clam opened this week, t: trip done this week, dv: dives this week,
     p: pearls, g: { "Monday date": 1 } treasures, best: best dive, n: clams opened, v: visits, sb: shop buys }.
   One save per clam, per dive, per trip and per buy (a buy also saves roomOwned or outfits). Games run in their own layer. */
import { esc, weekKey } from "./game.js?v=20261113g";
import { azToday, azNow } from "./collect.js?v=20261113g";
import { vaultMet, vaultGoal, subReq, addDays } from "./doors.js?v=20261113g";

const K = "assets/kingdom/";
export const KD_DIVES = 3, KD_CLOSE = 22 * 60, DIVE_SECS = 45, TRIP_SECS = 35, TRIP_MAX = 20;

/* ----- 52 treasures: 12 monthly shelves (4, or 5 in Mar/Jun/Sep/Dec). The first of each month is the royal treasure. ----- */
export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const SHELVES = [
  [["seaglass", "Rainbow Sea Glass"], ["snowflake", "Crystal Snowflake"], ["frostpearl", "Frost Pearl"], ["icecrown", "Ice Crown", "\u{1F451}"]],
  [["gem", "Ocean Heart Gem"], ["heartshell", "Heart Shell"], ["valentinekey", "Sweetheart Key"], ["cupidstar", "Cupid Starfish"]],
  [["seahorse", "Golden Seahorse"], ["cloverpearl", "Clover Pearl"], ["goldcoin", "Sunken Gold Coin"], ["rainbowscale", "Rainbow Scale"], ["springsprout", "Spring Sprout"]],
  [["egg", "Axolotl Egg"], ["seaflower", "Sea Anemone Flower"], ["bubblewand", "Coral Bubble Wand"], ["butterflyfish", "Golden Butterflyfish"]],
  [["pearlnecklace", "Pearl Necklace"], ["sunpearl", "Sun Pearl"], ["sandcastle", "Shell Sandcastle"], ["kite", "Ray Fin Kite"]],
  [["starfish", "Jeweled Starfish"], ["beachball", "Beach Ball"], ["sunglasses", "Shell Sunglasses"], ["surfboard", "Rainbow Surfboard"], ["coconut", "Coconut Cup"]],
  [["conch", "Spiral Conch"], ["fireworkshell", "Firework Shell"], ["starspangle", "Star-Spangled Starfish"], ["glowjelly", "Jelly in a Bubble"]],
  [["compass", "Ship Compass"], ["pencil", "Coral Pencil"], ["apple", "Sea Apple"], ["bookshell", "Seashell Book"]],
  [["coral", "Glowing Coral"], ["moonpearl", "Harvest Moon Pearl"], ["leafshell", "Leaf Shell"], ["acorn", "Golden Acorn"], ["owlshell", "Pearly Owl"]],
  [["trident", "Golden Trident"], ["pumpkinpearl", "Pumpkin Pearl"], ["ghostshell", "Friendly Ghost Shell"], ["witchhat", "Starry Witch Hat"]],
  [["crown", "Coral Crown"], ["pie", "Shell Pie"], ["cornucopia", "Shell Cornucopia"], ["maple", "Amber Maple Leaf"]],
  [["mirror", "Shell Mirror"], ["ornament", "Pearl Ornament"], ["present", "Kelp-Bow Present"], ["bell", "Jingle Bell Shell", "\u{1F514}"], ["startopper", "Golden Star Topper", "⭐"]]];
export const TREASURES = [].concat(...SHELVES.map((sh, m) => sh.map(([k, n, e], i) => ({ k, n, e: e || "", m, royal: i === 0 }))));   // index = week of the year (0–51)
const NO_ART = [];   // every treasure picture is in (Nov 12)
const trImg = (t, cls) => !t ? "" : '<span class="kdtr ' + (cls || "") + '">' + (NO_ART.includes(t.k) ? "" : '<img src="' + K + "tr-" + t.k + '.webp" alt="" onerror="this.remove()">') + "<i>" + (t.e || "\u{1F48E}") + "</i></span>";
const dayOfYear = iso => { const [y, m, d] = String(iso).split("-").map(Number); return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 1)) / 864e5) + 1; };
export const weekSpot = monday => Math.max(0, Math.min(51, Math.floor((dayOfYear(monday) - 1) / 7)));   // which of the 52 spots a week fills
export const treasureOf = monday => TREASURES[weekSpot(monday)];
const yearOf = iso => Number(String(iso).slice(0, 4));

export const kdOn = cls => !!(cls && cls.kdOn);
const wk = cls => weekKey(cls);
// the week's save (a new week starts fresh, but pearls, treasures and buys stay)
export function kdOf(st, cls) {
  const k = (st && st.kd) || {}, w = wk(cls), keep = { p: Number(k.p) || 0, g: Object.assign({}, k.g || {}), best: Number(k.best) || 0, n: Number(k.n) || 0, v: Number(k.v) || 0, sb: Number(k.sb) || 0 };
  return k.w === w ? Object.assign({}, k, keep) : Object.assign({ w, c: 0, t: 0, dv: 0 }, keep);
}
export const treasureCount = st => Object.keys(((st && st.kd) || {}).g || {}).length;
// open until Sunday 10 pm of this week (Arizona)
export function kdTimeOk(cls) {
  const sun = addDays(wk(cls), 6), d = azToday(), t = azNow(); if (d > sun) return false;
  return !(d === sun && t.h * 60 + t.m >= KD_CLOSE);
}
export const kdUnlocked = (st, cls) => kdOn(cls) && !!st && vaultMet(st, cls) && kdTimeOk(cls);
export const kdTodo = (st, cls) => { if (!kdUnlocked(st, cls)) return false; const k = kdOf(st, cls); return !k.t || !k.c || (Number(k.dv) || 0) < KD_DIVES; };
// which minigame this week: the 1st–4th Monday of the month (a 5th Monday plays week 1 again)
export const tripGame = cls => (typeof window !== "undefined" && window.__kdGame != null) ? window.__kdGame : (Math.ceil(Number(String(wk(cls)).slice(8, 10)) / 7) - 1) % 4;
const GAMES = [
  { k: "bubble", name: "Bubble Dash", icon: "\u{1FAE7}", say: "Week 1: <b>Pearl bubbles ahead!</b> Swim into them (or tap them) and steer around the grumpy urchins!", how: "Move up and down with your finger, mouse or ⬆️ ⬇️." },
  { k: "jelly", name: "Jelly Drift", icon: "\u{1FABC}", say: "Week 2: <b>Jellyfish!</b> Steer carefully and catch the glowing shells!", how: "Move left and right with your finger, mouse or ⬅️ ➡️." },
  { k: "claw", name: "Treasure Claw", icon: "\u{1F980}", say: "Week 3: <b>Claw ready!</b> Grab the treasure chests, not the old boots!", how: "Tap (or press Space) to drop the claw." },
  { k: "cave", name: "Glow Cave", icon: "\u{1F526}", say: "Week 4: <b>It's dark! Headlight on!</b> Find the glowing fish and steer around the rocks!", how: "Move up and down with your finger, mouse or ⬆️ ⬇️." }];

/* ----- the Pearl Shop ----- */
export const PEARL_SHOP = {
  room: { name: "\u{1FAB8} Coral Palace Room", items: [["bed_coral", "Scallop Shell Bed", 200], ["chair_coral", "Coral Chair", 120], ["wallpaper_coral", "Pearly Water Wallpaper", 100],
    ["flooring_coral", "Sandy Shell Floor", 100], ["ceiling_coral", "Jellyfish Lamp", 150], ["rug_coral", "Sand Dollar Rug", 80], ["wall_art_coral", "Axolotl Porthole", 120],
    ["plant_coral", "Glowing Sea Plants", 60], ["shelf_coral", "Driftwood Shell Shelf", 90]].map(([k, n, c]) => ({ k, n, c, img: "assets/room/" + k + ".webp", cat: "room" })) },
  outfit: { name: "\u{1F451} Undersea Outfits", items: [["sea-crown", "Coral Pearl Crown", 120, "crown"], ["sea-necklace", "Shell Pearl Necklace", 80, "necklace"],
    ["sea-cape", "Sea-Blue Fin Cape", 90, "cape"], ["sea-goggles", "Diving Goggles", 60, "goggles"]].map(([k, n, c, f]) => ({ k, n, c, img: K + "outfit-" + f + ".webp", cat: "outfit" })) } };
const SHOP_CATS = ["room", "outfit"];
const ownsItem = (st, it) => it.cat === "room" ? ((st && st.roomOwned) || []).includes(it.k) : !!((st && st.outfits) || {})[it.k];

let C = null, view = "map", opened = null, shopCat = "room", shopSay = null, grotYear = null, grotMonth = null;
export function kdSync(c) { C = c; }
const rer = () => { if (C && C.render) C.render(); };
// one save: the kd record plus any other fields (room pieces, outfits)
function save(k, extra) {
  if (C && C.patch && !C.preview) C.patch(Object.assign({ kd: k }, extra || {}));
  else if (C && C.st) { C.st.kd = k; Object.assign(C.st, extra || {}); rer(); }
}

/* ----- the Bubble's Baby (the diver's color) ----- */
const PAL = ["none", "brightness(0.28) saturate(2.0) hue-rotate(270deg) contrast(1.5)", "hue-rotate(-120deg) saturate(1.3)", "hue-rotate(55deg) saturate(1.8) brightness(1.15) contrast(1.05)",
  "hue-rotate(150deg) saturate(1.8) brightness(1.15)", "hue-rotate(-55deg) saturate(1.5) brightness(1.05)"];
const diverFx = st => PAL[Number(((st && st.axo) || {}).paletteIndex) || 0] || "none";
const diverName = st => ((st && st.axo && st.axo.name) || "").trim() || "your axolotl";

/* ----- the locked gate: weekly XP + rings, with the duck sub riding the bar ----- */
function gateHTML(st, cls) {
  const v = vaultGoal(st, cls), q = subReq(st, cls), timeOk = kdTimeOk(cls), pct = Math.max(0, Math.min(100, v.xp ? v.n / v.xp * 100 : 0));
  const rows = ['<span class="kdreq' + (v.n >= v.xp ? " ok" : "") + '">⭐ ' + Math.min(v.n, v.xp).toLocaleString() + " / " + v.xp.toLocaleString() + (v.sub && v.sub !== "all" ? " goal-subject XP" : " XP") + (v.n >= v.xp ? " ✅" : "") + "</span>"]
    .concat(v.tot < v.min && v.xp < v.min ? ['<span class="kdreq">⭐ ' + v.tot + " / " + v.min + " XP total</span>"] : [])
    .concat((q.rows || []).map(r => '<span class="kdreq' + (r.have >= r.need ? " ok" : "") + '">' + esc(r.name) + " " + Math.min(r.have, r.need) + " / " + r.need + (r.have >= r.need ? " ✅" : "") + "</span>"));
  return '<div class="kdscene kdgate" style="background-image:url(' + K + 'kingdom-gate.webp)"><div class="kdgatebox">' +
    "<h2>\u{1F512} The Kingdom gate is closed</h2>" +
    (timeOk ? "<p>Reach your <b>weekly XP</b> and close <b>all your rings</b> this week, and the gate opens until Sunday night!</p>" : "<p>The Kingdom closed for this week. A new week starts Monday!</p>") +
    '<div class="kdbar"><i style="width:' + pct.toFixed(1) + '%"></i><img src="' + K + 'duck-sub.webp" alt="" style="left:' + pct.toFixed(1) + '%"></div>' +
    '<div class="kdreqs">' + rows.join("") + "</div></div></div>";
}

/* ----- the Kingdom map ----- */
function mapHTML(st, cls) {
  const k = kdOf(st, cls), dl = Math.max(0, KD_DIVES - (Number(k.dv) || 0)), t = treasureOf(wk(cls));
  return '<div class="kdscene" style="background-image:url(' + K + 'kingdom-map.webp)">' +
    '<button class="kdspot kdcastle" data-kd="go:throne"><span>\u{1F451} Throne Room' + (!k.c ? ' <i class="kdbang">1</i>' : "") + "</span></button>" +
    '<button class="kdspot kdship" data-kd="go:shop"><span>\u{1F41A} Pearl Shop</span></button>' +
    '<button class="kdspot kdcave" data-kd="go:dive"><span>\u{1FAE7} Pearl Caves' + (dl ? ' <i class="kdbang">' + dl + "</i>" : "") + "</span></button>" +
    '<button class="kdspot kdgrot" data-kd="go:grotto"><span>\u{1F9F0} Treasure Grotto <b>' + treasureCount(st) + "</b></span></button></div>" +
    '<div class="row" style="margin-top:8px;gap:8px;align-items:center;flex-wrap:wrap;"><span class="small">' +
    (k.c ? "✅ You got this week’s treasure, the <b>" + esc(t.n) + "</b>." : "\u{1F451} This week’s treasure is waiting in the Throne Room!") +
    " · \u{1FAE7} " + dl + " of " + KD_DIVES + " dives left · ⚪ " + (Number(k.p) || 0) + " pearls</span>" +
    '<button class="btn ghost small" data-kd="trip">\u{1F986} Watch the trip again</button></div>';
}

/* ----- Throne Room: this week's treasure ----- */
function throneHTML(st, cls) {
  const k = kdOf(st, cls), t = treasureOf(wk(cls));
  const pose = opened ? "queen-cheer" : !k.c ? "queen-gift" : "queen-wave";
  const say = opened ? "Ooh, the <b>" + esc(t.n) + "</b>! It’s this week’s Treasure of the Week, and now it’s yours forever. I put it in your <b>Treasure Grotto</b>!"
    : !k.c ? "Welcome to my Kingdom, " + esc((st && st.name || "").split(" ")[0] || "explorer") + "! Here is this week’s <b>Royal Clam</b>. Tap it to open it!"
    : "You already got this week’s treasure, the <b>" + esc(t.n) + "</b>. Come back next week for a new one!";
  return '<div class="kdscene" style="background-image:url(' + K + 'throne-room.webp)">' +
    '<img class="kdqueen" src="' + K + pose + '.webp" alt="Queen Bubbles">' +
    (opened ? '<div class="kdprize"><img class="kdclam" src="' + K + 'clam-open.webp" alt="">' + trImg(t, "big") + "</div>"
      : !k.c ? '<button class="kdclambtn" data-kd="clam"><img class="kdclam" src="' + K + 'clam-closed.webp" alt="Royal Clam"><span>Tap to open!</span></button>'
      : '<div class="kdprize small">' + trImg(t, "big") + "</div>") +
    '<div class="kdsay"><b>Queen Bubbles:</b> ' + say + "</div></div>" +
    (opened ? '<div class="row" style="margin-top:8px;gap:8px;"><button class="btn gold" data-kd="go:grotto">\u{1F9F0} See it in my Grotto</button><button class="btn ghost" data-kd="go:map">Back to the map</button></div>' : "");
}
function openClam() {
  if (!C || !C.st) return; const k = kdOf(C.st, C.cls); if (k.c) return;
  k.c = 1; k.g = Object.assign({}, k.g || {}, { [k.w]: 1 }); k.n = (Number(k.n) || 0) + 1; k.v = Math.max(1, Number(k.v) || 0);
  opened = true; save(k);
}

/* ----- Treasure Grotto: a big shelf for each month (one spot for every week), ◀ ▶ between months ----- */
function grottoHTML(st, cls) {
  const g = ((st && st.kd) || {}).g || {}, now = wk(cls), years = [...new Set(Object.keys(g).map(yearOf).concat([yearOf(now)]))].sort();
  const Y = years.includes(grotYear) ? grotYear : yearOf(now), have = {};
  Object.keys(g).forEach(d => { if (yearOf(d) === Y) have[weekSpot(d)] = 1; });
  const cur = yearOf(now) === Y ? weekSpot(now) : (Y < yearOf(now) ? 99 : -1);
  const M = grotMonth == null ? (cur >= 0 && cur < 52 ? TREASURES[cur].m : 0) : grotMonth;
  const first = TREASURES.findIndex(x => x.m === M), sh = SHELVES[M];
  const perMonth = SHELVES.map((s, m) => { const f = TREASURES.findIndex(x => x.m === m); return s.filter((_, j) => have[f + j]).length; });
  const spots = sh.map((_, j) => {
    const i = first + j, t = TREASURES[i], got = have[i], me = i === cur, past = i < cur;
    return '<div class="kdspot2' + (got ? " got" : me ? " now" : past ? " miss" : " later") + '">' +
      '<div class="kdped">' + (got ? trImg(t) : me ? "<i>\u{1F451}</i>" : past ? "" : "<i>?</i>") + "</div>" +
      "<b>" + (got ? esc(t.n) : me ? "This week!" : past ? "Missed" : "Week " + (j + 1)) + "</b>" +
      (me && !got ? '<span class="small">Waiting in the Throne Room</span>' : "") + "</div>";
  }).join("");
  const nav = years.length > 1 ? '<span class="row" style="gap:6px;">' + years.map(y => '<button class="btn small' + (y === Y ? " gold" : " ghost") + '" data-kd="year:' + y + '">' + y + "</button>").join("") + "</span>" : "";
  return '<div class="kdscene kdgrotto" style="background-image:url(' + K + 'grotto-bg.webp)">' +
    '<div class="kdmonthbar"><button class="kdarrow" data-kd="mon:' + ((M + 11) % 12) + '">◀</button><b>' + MONTHS[M] + " shelf</b>" +
    '<span class="kdmcount">' + perMonth[M] + " / " + sh.length + '</span><button class="kdarrow" data-kd="mon:' + ((M + 1) % 12) + '">▶</button></div>' +
    '<div class="kdbigshelf n' + sh.length + '">' + spots + '<div class="kdplank"></div></div>' +
    '<div class="kdmdots">' + MONTHS.map((n, m) => '<button class="kdmdot' + (m === M ? " on" : "") + (perMonth[m] ? " has" : "") + '" data-kd="mon:' + m + '" title="' + n + '">' + n.slice(0, 1) + "</button>").join("") + "</div></div>" +
    '<div class="row" style="margin-top:8px;gap:10px;align-items:center;flex-wrap:wrap;"><b>\u{1F9F0} ' + Object.keys(have).length + " / 52 treasures in " + Y + "</b>" + nav +
    '<span class="small muted">Every week you get into the Kingdom, Queen Bubbles gives you that week’s treasure. Missed weeks stay empty.</span></div>';
}

/* ----- Pearl Shop ----- */
function shopHTML(st, cls) {
  const k = kdOf(st, cls), cat = PEARL_SHOP[shopCat], i = SHOP_CATS.indexOf(shopCat);
  const pose = shopSay && shopSay.mood === "happy" ? "shopduck-happy" : shopSay && shopSay.mood === "short" ? "shopduck-pearl" : "shopduck-wave";
  const say = shopSay ? shopSay.text : "Welcome to the <b>Sunken Shell Shop!</b> Everything here costs pearls.";
  return '<div class="kdscene kdshop" style="background-image:url(' + K + 'pearl-shop-bg.webp)">' +
    '<img class="kdshopduck" src="' + K + pose + '.webp" alt="The Shopkeeper"><div class="kdsay kdshopsay">' + say + "</div>" +
    '<div class="kdshoppanel"><div class="kdshoptop"><b>\u{1F41A} Sunken Shell Shop</b><span>⚪ ' + (Number(k.p) || 0) + " pearls</span></div>" +
    '<div class="kdshopcats"><button class="kdarrow" data-kd="cat:' + SHOP_CATS[(i + SHOP_CATS.length - 1) % SHOP_CATS.length] + '">◀</button><b>' + cat.name + '</b><button class="kdarrow" data-kd="cat:' + SHOP_CATS[(i + 1) % SHOP_CATS.length] + '">▶</button></div>' +
    '<div class="kdshopgrid">' + cat.items.map(it => {
      const own = ownsItem(st, it), can = (Number(k.p) || 0) >= it.c;
      return '<div class="kdshopitem' + (own ? " own" : "") + '"><img src="' + it.img + '" alt=""><b>' + esc(it.n) + "</b>" +
        (own ? '<span class="kdown">✅ ' + (it.cat === "room" ? "In My Room" : "In Gear") + "</span>" : '<button class="btn small' + (can ? " gold" : " ghost") + '" data-kd="buy:' + it.k + '">⚪ ' + it.c + "</button>") + "</div>";
    }).join("") + "</div></div></div>";
}
function buyItem(key) {
  if (!C || !C.st) return; const st = C.st, it = PEARL_SHOP.room.items.concat(PEARL_SHOP.outfit.items).find(x => x.k === key); if (!it || ownsItem(st, it)) return;
  const k = kdOf(st, C.cls), p = Number(k.p) || 0;
  if (p < it.c) { shopSay = { mood: "short", text: "You need <b>" + (it.c - p) + " more pearls</b> for the " + esc(it.n) + ". Try a Pearl Dive! \u{1FAE7}" }; rer(); return; }
  if (typeof confirm === "function" && !confirm("Buy the " + it.n + " for " + it.c + " pearls?")) return;
  k.p = p - it.c; k.sb = (Number(k.sb) || 0) + 1;
  const extra = it.cat === "room" ? { roomOwned: (st.roomOwned || []).concat([it.k]) } : { outfits: Object.assign({}, st.outfits || {}, { [it.k]: true }) };
  shopSay = { mood: "happy", text: "Ooh, splendid choice! The <b>" + esc(it.n) + "</b> is yours forever. " + (it.cat === "room" ? "Find it in <b>My Room</b>!" : "Wear it from <b>Gear</b>!") + " \u{1F49C}" + (C.preview ? " (Preview: nothing was saved.)" : "") };
  save(k, extra);
}

/* ========== the game layer (trip, minigames, Pearl Diving): its own overlay, so page redraws don't stop it ========== */
let L = null;   // the open layer
function openLayer(bg) {
  closeLayer();
  const root = document.createElement("div"); root.className = "kdgame"; root.id = "kdgame";
  root.innerHTML = '<div class="kdstage"><div class="kdbg"></div><div class="kdlayer"></div><div class="kdui"></div></div>';
  document.body.appendChild(root);
  const stage = root.querySelector(".kdstage");
  L = { root, stage, bg: root.querySelector(".kdbg"), lay: root.querySelector(".kdlayer"), ui: root.querySelector(".kdui"), px: 50, py: 50, down: false, keys: {}, tap: 0, raf: 0, dead: false };
  setBg(bg);
  const pt = e => { const r = stage.getBoundingClientRect(); L.px = (e.clientX - r.left) / r.width * 100; L.py = (e.clientY - r.top) / r.height * 100; L.moved = performance.now(); };
  stage.addEventListener("pointermove", pt); stage.addEventListener("pointerdown", e => { pt(e); L.tap++; L.tapAt = [L.px, L.py]; });
  L.kd = e => { if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(e.key)) { if (e.type === "keydown" && e.key === " " && !L.keys[" "]) L.tap++; L.keys[e.key] = e.type === "keydown"; e.preventDefault(); } };
  addEventListener("keydown", L.kd); addEventListener("keyup", L.kd);
  return L;
}
function closeLayer() { if (!L) return; L.dead = true; cancelAnimationFrame(L.raf); removeEventListener("keydown", L.kd); removeEventListener("keyup", L.kd); L.root.remove(); L = null; }
const setBg = (bg, extra) => { if (L) L.bg.style.cssText = "background-image:url(" + K + bg + ".webp);" + (extra || ""); };
const sprite = (src, cls, w) => { const e = document.createElement("img"); e.src = K + src + ".webp"; e.alt = ""; e.className = "kdsp " + (cls || ""); if (w) e.style.width = w + "%"; L.lay.appendChild(e); return e; };
const place = (e, x, y, extra) => { e.style.left = x + "%"; e.style.top = y + "%"; e.style.transform = "translate(-50%,-50%)" + (extra || ""); };
function pop(x, y, t, bad) { const s = document.createElement("span"); s.className = "kdpop" + (bad ? " bad" : ""); s.innerHTML = t; s.style.left = Math.max(12, Math.min(88, x)) + "%"; s.style.top = Math.max(10, Math.min(90, y)) + "%"; L.lay.appendChild(s); setTimeout(() => s.remove(), 900); }
const wait = ms => new Promise(r => setTimeout(r, ms));
// a speech bubble + buttons; resolves with the button's value
function panel(html, buttons, cls) {
  return new Promise(res => {
    if (!L) return res(null);
    L.ui.innerHTML = '<div class="kdbox ' + (cls || "") + '">' + html + '<div class="row" style="gap:8px;justify-content:center;margin-top:10px;">' +
      buttons.map(([v, label, c]) => '<button class="btn ' + (c || "gold") + '" data-kdv="' + v + '">' + label + "</button>").join("") + "</div></div>";
    L.ui.onclick = e => { const b = e.target.closest("[data-kdv]"); if (!b) return; e.stopPropagation(); L.ui.onclick = null; L.ui.innerHTML = ""; res(b.dataset.kdv); };
  });
}
function hud(items) { if (!L) return; let h = L.ui.querySelector(".kdhud"); if (!h) { h = document.createElement("div"); h.className = "kdhud"; L.ui.appendChild(h); } h.innerHTML = items.map(x => "<span>" + x + "</span>").join(""); }
function loop(fn) {   // fn(dt, t) returns false to stop
  return new Promise(res => {
    const t0 = performance.now(); let last = t0;
    const step = now => { if (!L || L.dead) return res(); const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (fn(dt, (now - t0) / 1000) === false) return res(); L.raf = requestAnimationFrame(step); };
    L.raf = requestAnimationFrame(step);
  });
}
const near = (ax, ay, bx, by, r) => Math.hypot(ax - bx, (ay - by) * 0.5625) < r;
// steering: pointer / finger, or the arrow keys
function steer(cur, axis, dt, lo, hi) {
  const keyDir = axis === "x" ? (L.keys.ArrowRight ? 1 : 0) - (L.keys.ArrowLeft ? 1 : 0) : (L.keys.ArrowDown ? 1 : 0) - (L.keys.ArrowUp ? 1 : 0);
  if (keyDir) { L.useKeys = true; return Math.max(lo, Math.min(hi, cur + keyDir * 60 * dt)); }
  if (L.moved && L.moved > (L.keyAt || 0)) L.useKeys = false;
  if (L.useKeys) return cur;
  const target = Math.max(lo, Math.min(hi, axis === "x" ? L.px : L.py));
  return cur + (target - cur) * Math.min(1, dt * 7);
}

/* ----- the Submarine Trip ----- */
async function runTrip(replay) {
  if (!C || !C.st) return;
  const st = C.st, cls = C.cls, gi = tripGame(cls), G = GAMES[gi];
  openLayer("sub-surface");
  const skip = document.createElement("button"); skip.className = "btn ghost small kdskip"; skip.textContent = "✖ Close"; skip.onclick = () => { closeLayer(); rer(); }; L.stage.appendChild(skip);
  // 1. the dock
  const sub = sprite("duck-sub", "kdsub", 26); place(sub, 64, 40);
  const cap = sprite("captain-wave", "kdcap", 19); place(cap, 22, 60);
  let bob = true; loop((dt, t) => { if (!bob) return false; place(sub, 64, 40 + Math.sin(t * 2.2) * 1.2); });
  if (await panel("<b>Captain Duck:</b> Ahoy, explorer! You earned your trip to the <b>Axolotl Kingdom!</b>" + (replay ? "<br><span class='small'>(This is a replay, just for fun.)</span>" : ""), [["go", "Next ▶"]], "kdboxr") === null) return;
  cap.src = K + "captain-salute.webp";
  if (await panel("<b>Captain Duck:</b> Hatch closed… periscope down… ready to dive?", [["go", "Dive! \u{1FAE7}"]], "kdboxr") === null) return;
  bob = false; cap.remove();
  // 2. diving down: the surface scrolls away into the deep sea, with a depth meter
  const deep = document.createElement("div"); deep.className = "kdbg kdbg2"; deep.style.backgroundImage = "url(" + K + "sub-deep.webp)"; L.stage.insertBefore(deep, L.lay);
  await loop((dt, t) => { const u = Math.min(1, t / 4), e = u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
    L.bg.style.transform = "translateY(" + (-e * 100) + "%)"; deep.style.transform = "translateY(" + (100 - e * 100) + "%)";
    place(sub, 64 - e * 14, 40 + e * 12, " rotate(" + (8 * Math.sin(t * 1.4)) + "deg)"); hud(["⬇️ " + Math.round(e * 100) + " m"]);
    return t < 4.2; });
  setBg("sub-deep"); L.bg.style.transform = ""; deep.remove(); L.ui.innerHTML = "";
  // 3. the Captain points to this week's minigame
  const cap2 = sprite("captain-point", "kdcap", 19); place(cap2, 20, 60);
  if (await panel("<b>Captain Duck:</b> " + G.say + "<br><span class='small'>" + G.how + " " + TRIP_SECS + " seconds.</span>", [["go", "Start! ▶"]], "kdboxr") === null) return;
  cap2.remove(); sub.remove();
  // 4. the game
  const got = await [bubbleDash, jellyDrift, treasureClaw, glowCave][gi]();
  if (!L) return;
  L.lay.innerHTML = ""; L.ui.innerHTML = ""; setBg("sub-deep");
  const earn = replay ? 0 : Math.min(TRIP_MAX, got);
  if (!replay) { const k = kdOf(C.st, cls); if (!k.t) { k.t = 1; k.p = (Number(k.p) || 0) + earn; k.v = (Number(k.v) || 0) + 1; save(k); } }
  if (await panel("<h2>" + G.icon + " " + G.name + " done!</h2>" + (replay ? "<p>You scored <b>" + got + "</b>! (Replays are just for fun, no pearls.)</p>" : "<p><b>+" + earn + " pearls</b> \u{1FAE7} for the Pearl Shop!</p>"), [["go", "Keep going ▶"]]) === null) return;
  // 5. docking: the sub pops up in the castle's pool
  setBg("sub-dock"); const s2 = sprite("duck-sub", "kdsub", 24); const ring = document.createElement("div"); ring.className = "kdring"; L.lay.appendChild(ring);
  const cap3 = sprite("captain-cheer", "kdcap", 18); place(cap3, 17, 200);
  await loop((dt, t) => { const u = Math.min(1, t / 1.8), e = 1 - Math.pow(1 - u, 3);
    place(s2, 40, 100 - e * 32 + (u >= 1 ? Math.sin(t * 2.4) * 1 : 0)); s2.style.opacity = Math.min(1, u * 2);
    ring.style.opacity = u > 0.6 ? Math.max(0, 1 - (t - 1.1) / 1.4) : 0; place(cap3, 17, t > 1.6 ? 62 : 200); return t < 2.4; });
  if (await panel("<b>Captain Duck:</b> Coral Castle dock… surfacing… <b>we’ve landed!</b> Have fun in the Kingdom!", [["go", "\u{1F30A} Swim into the Kingdom"]], "kdboxr") === null) return;
  L.stage.classList.add("kdzoom"); await wait(700);
  closeLayer(); view = "map"; rer(); scrollTo({ top: 0 });
}

/* Bubble Dash: move up and down; swim into pearl bubbles (or tap them), steer around urchins */
async function bubbleDash() {
  setBg("sub-deep"); let score = 0, y = 50, spawn = 0, hurt = 0; const sub = sprite("duck-sub", "kdsub", 15), things = [];
  await loop((dt, t) => {
    y = steer(y, "y", dt, 12, 88); place(sub, 15, y, hurt > 0 && Math.floor(t * 12) % 2 ? " scale(.95)" : ""); sub.style.opacity = hurt > 0 && Math.floor(t * 12) % 2 ? .5 : 1; hurt -= dt;
    spawn -= dt; if (spawn <= 0) { const bad = Math.random() < 0.3; things.push({ e: sprite(bad ? "mg-urchin" : "mg-bubble", "", bad ? 7.5 : 7), bad, x: 108, y: 12 + Math.random() * 76, v: bad ? 24 : 20 }); spawn = 0.75 + Math.random() * 0.4; }
    const tapped = L.tap && L.tapAt ? L.tapAt : null; L.tap = 0;
    for (let i = things.length - 1; i >= 0; i--) { const o = things[i]; o.x -= o.v * dt; place(o.e, o.x, o.y + Math.sin(t * 3 + i) * 1.5, o.bad ? " rotate(" + (t * 60) + "deg)" : "");
      let hit = near(o.x, o.y, 15, y, 7); if (!o.bad && tapped && near(o.x, o.y, tapped[0], tapped[1], 6)) hit = true;
      if (hit) { if (o.bad) { if (hurt <= 0) { score = Math.max(0, score - 1); pop(o.x, o.y, "-1", true); hurt = 1; } } else { score++; pop(o.x, o.y, "+1 \u{1FAE7}"); } o.e.remove(); things.splice(i, 1); }
      else if (o.x < -8) { o.e.remove(); things.splice(i, 1); } }
    hud(["\u{1FAE7} " + score, "⏱️ " + Math.max(0, Math.ceil(TRIP_SECS - t))]); return t < TRIP_SECS;
  });
  return score;
}
/* Jelly Drift: move left and right; shells sink from the top, jellyfish rise from the bottom */
async function jellyDrift() {
  setBg("sub-deep"); let score = 0, x = 50, s1 = 0.5, s2 = 1.2, hurt = 0; const sub = sprite("duck-sub", "kdsub", 15), things = []; let face = 1;
  await loop((dt, t) => {
    const nx = steer(x, "x", dt, 8, 92); if (Math.abs(nx - x) > 0.05) face = nx > x ? 1 : -1; x = nx;
    place(sub, x, 55, " scaleX(" + face + ")"); sub.style.opacity = hurt > 0 && Math.floor(t * 12) % 2 ? .5 : 1; hurt -= dt;
    s1 -= dt; if (s1 <= 0) { things.push({ e: sprite("mg-shell", "kdglow", 6), bad: 0, x: 8 + Math.random() * 84, y: -8, v: 15 + Math.random() * 6 }); s1 = 1.1 + Math.random() * 0.4; }
    s2 -= dt; if (s2 <= 0) { things.push({ e: sprite("dive-jelly", "", 8), bad: 1, x: 8 + Math.random() * 84, y: 110, v: -(12 + Math.random() * 6) }); s2 = 1.4 + Math.random() * 0.6; }
    for (let i = things.length - 1; i >= 0; i--) { const o = things[i]; o.y += o.v * dt; const ox = o.x + Math.sin(t * 1.5 + i) * (o.bad ? 3 : 1);
      place(o.e, ox, o.y, o.bad ? " rotate(" + Math.sin(t * 2 + i) * 8 + "deg)" : "");
      if (near(ox, o.y, x, 55, 7)) { if (o.bad) { if (hurt <= 0) { score = Math.max(0, score - 1); pop(ox, o.y, "-1", true); hurt = 1; } } else { score++; pop(ox, o.y, "+1 \u{1F41A}"); } o.e.remove(); things.splice(i, 1); }
      else if (o.y < -12 || o.y > 112) { o.e.remove(); things.splice(i, 1); } }
    hud(["\u{1F41A} " + score, "⏱️ " + Math.max(0, Math.ceil(TRIP_SECS - t))]); return t < TRIP_SECS;
  });
  return score;
}
/* Treasure Claw: the sub glides back and forth; tap to drop the claw; chests +3, boots 0 */
async function treasureClaw() {
  setBg("mg-floor-bg"); let score = 0, x = 20, dir = 1, claw = null; const SLOTS = [14, 32, 50, 68, 86], floor = [];
  const sub = sprite("duck-sub", "kdsub", 14), cable = document.createElement("div"); cable.className = "kdcable"; L.lay.appendChild(cable); const cl = sprite("mg-claw", "", 7);
  const fill = i => { const chest = Math.random() < 0.6; floor[i] = { chest, e: sprite(chest ? "mg-chest" : "mg-boot", "", chest ? 9 : 8) }; place(floor[i].e, SLOTS[i], 84); };
  SLOTS.forEach((_, i) => fill(i)); L.tap = 0;
  await loop((dt, t) => {
    if (!claw) { x += dir * 18 * dt; if (x > 88) { x = 88; dir = -1; } if (x < 12) { x = 12; dir = 1; }
      if (L.tap) { L.tap = 0; if (t < TRIP_SECS - 1) claw = { t: 0, x, got: null }; } }
    else { claw.t += dt; const down = claw.t < 0.9 ? claw.t / 0.9 : claw.t < 1.1 ? 1 : Math.max(0, 1 - (claw.t - 1.1) / 0.9);
      if (claw.t >= 0.9 && !claw.checked) { claw.checked = true; let best = -1, bd = 7; SLOTS.forEach((sx, i) => { if (floor[i] && Math.abs(sx - claw.x) < bd) { bd = Math.abs(sx - claw.x); best = i; } });
        if (best >= 0) { claw.got = floor[best]; floor[best] = null; claw.slot = best; } }
      const cy = 24 + down * 52; place(cl, claw.x, cy); if (claw.got) place(claw.got.e, claw.x, cy + 8);
      cable.style.left = claw.x + "%"; cable.style.height = (cy - 18) + "%";
      if (claw.t > 2) { if (claw.got) { if (claw.got.chest) { score += 3; pop(claw.x, 40, "+3 Treasure chest!"); } else pop(claw.x, 40, "Oops! An old boot \u{1F97E}", true); claw.got.e.remove(); const s = claw.slot; setTimeout(() => { if (L && !floor[s]) fill(s); }, 700); }
        else pop(claw.x, 40, "Missed!", true); claw = null; } }
    place(sub, x, 14); if (!claw) { place(cl, x, 24); cable.style.left = x + "%"; cable.style.height = "6%"; }
    hud(["\u{1FAE7} " + score, "⏱️ " + Math.max(0, Math.ceil(TRIP_SECS - t))]); return t < TRIP_SECS || !!claw;
  });
  return score;
}
/* Glow Cave: dark cave; the headlight finds glowing fish; steer around the rocks */
async function glowCave() {
  setBg("mg-cave-bg"); let score = 0, y = 50, sf = 0.6, sr = 1.4, hurt = 0; const X = 20;
  const dark = document.createElement("div"); dark.className = "kddark"; L.lay.appendChild(dark);
  const sub = sprite("duck-sub", "kdsub", 14), things = [];
  await loop((dt, t) => {
    y = steer(y, "y", dt, 12, 88); place(sub, X, y); sub.style.opacity = hurt > 0 && Math.floor(t * 12) % 2 ? .5 : 1; hurt -= dt;
    dark.style.background = "radial-gradient(ellipse 24% 32% at " + (X + 14) + "% " + y + "%, rgba(0,0,20,0) 0, rgba(0,0,20,.25) 55%, rgba(0,0,25,.86) 100%)";
    sf -= dt; if (sf <= 0) { things.push({ e: sprite("mg-glowfish", "kdglowfish", 6), fish: 1, x: 108, y: 14 + Math.random() * 72, v: 20 }); sf = 0.9 + Math.random() * 0.5; }
    sr -= dt; if (sr <= 0) { const top = Math.random() < 0.5, h = 26 + Math.random() * 12, e = document.createElement("div"); e.className = "kdrock " + (top ? "top" : "bot"); e.style.height = h + "%"; L.lay.appendChild(e);
      things.push({ e, rock: 1, top, h, x: 108, v: 20 }); sr = 1.6 + Math.random() * 0.6; }
    for (let i = things.length - 1; i >= 0; i--) { const o = things[i]; o.x -= o.v * dt;
      if (o.rock) { o.e.style.left = o.x + "%"; const inX = Math.abs(o.x - X) < 6, inY = o.top ? y - 5 < o.h : y + 5 > 100 - o.h;
        if (inX && inY && hurt <= 0) { score = Math.max(0, score - 1); pop(X, y, "Bonk! -1", true); hurt = 1; } }
      else { place(o.e, o.x, o.y + Math.sin(t * 3 + i) * 2, " scaleX(-1)"); if (near(o.x, o.y, X, y, 7)) { score++; pop(o.x, o.y, "+1 ✨"); o.e.remove(); things.splice(i, 1); continue; } }
      if (o.x < -10) { o.e.remove(); things.splice(i, 1); } }
    hud(["✨ " + score, "⏱️ " + Math.max(0, Math.ceil(TRIP_SECS - t))]); return t < TRIP_SECS;
  });
  dark.remove(); return score;
}

/* ----- Pearl Diving: swim anywhere as your own Bubble's Baby ----- */
function diveHTML(st, cls) {
  const k = kdOf(st, cls), dl = Math.max(0, KD_DIVES - (Number(k.dv) || 0));
  return '<div class="kdscene" style="background-image:url(' + K + 'dive-bg.webp)"><div class="kdgatebox">' +
    "<h2>\u{1FAE7} Pearl Diving</h2><p>Swim with <b>" + esc(diverName(st)) + "</b> and grab the pearls! ⚪ = 1 pearl, \u{1F7E1} golden = 5. Watch out for jellyfish, they make you drop 3!</p>" +
    "<p>Swim anywhere with your finger or mouse (or the arrow keys). " + DIVE_SECS + " seconds.</p>" +
    (dl ? '<button class="btn gold big" data-kd="dive">\u{1F30A} Dive! (' + dl + " of " + KD_DIVES + " left this week)</button>" : "<p><b>No dives left this week.</b> Come back next week!</p>") +
    (k.best ? '<p class="small">\u{1F3C6} Your best dive: ' + k.best + " pearls</p>" : "") + "</div></div>";
}
async function runDive() {
  if (!C || !C.st) return; const k0 = kdOf(C.st, C.cls); if ((Number(k0.dv) || 0) >= KD_DIVES) return;
  openLayer("dive-bg"); const fx = diverFx(C.st);
  const dv = document.createElement("img"); dv.className = "kdsp kddiver"; dv.alt = ""; dv.style.filter = fx; L.lay.appendChild(dv);
  const FR = [1, 2, 3, 4, 5, 6, 7, 8].map(n => "assets/axolotl/frame-" + n + ".webp"), TURN = ["assets/axolotl/frame-17.webp", "assets/axolotl/frame-18.webp"];
  FR.concat(TURN).forEach(s => { const i = new Image(); i.src = s; });
  let x = 50, y = 55, face = 1, turnT = -1, score = 0, spawn = 0.3, jspawn = 2.5, hurt = 0, src = "";
  const items = [];
  const show = s => { if (s !== src) { dv.src = s; src = s; } };
  if (await panel("<h2>\u{1FAE7} Ready to dive?</h2><p>Swim <b>anywhere</b>: up, down, left and right. Grab ⚪ pearls and \u{1F7E1} golden pearls, and dodge the jellyfish!</p>", [["go", "\u{1F30A} Go!"]]) === null) return;
  await loop((dt, t) => {
    const ox = x, oy = y; x = steer(x, "x", dt, 6, 94); y = steer(y, "y", dt, 14, 90);
    const vx = (x - ox) / Math.max(dt, 1e-3), vy = (y - oy) / Math.max(dt, 1e-3);
    if (Math.abs(vx) > 6 && Math.sign(vx) !== face && turnT < 0) { turnT = 0; face = Math.sign(vx); }
    let flip = face < 0, rot = 0;
    if (turnT >= 0) { turnT += dt; show(TURN[turnT < 0.18 ? 0 : 1]); flip = turnT < 0.18 ? !flip : flip; if (turnT > 0.36) turnT = -1; }
    else { show(FR[Math.floor(t * 12) % 8]); rot = Math.max(-35, Math.min(35, Math.atan2(vy * 0.5625, Math.abs(vx) + 4) * 57.3)) * (flip ? -1 : 1); }
    place(dv, x, y + Math.sin(t * 4) * 0.6, " scaleX(" + (flip ? -1 : 1) + ") rotate(" + rot.toFixed(1) + "deg)");
    dv.style.filter = fx + (hurt > 0 && Math.floor(t * 12) % 2 ? " brightness(2)" : ""); hurt -= dt;
    spawn -= dt; if (spawn <= 0) { const gold = Math.random() < 0.14; items.push({ e: sprite(gold ? "pearl-gold" : "pearl", gold ? "kdgold" : "", gold ? 5 : 4.2), kind: gold ? "gold" : "pearl", x: 6 + Math.random() * 88, y: -6, vx: 0, vy: 13 + Math.random() * 9, w: Math.random() * 6.28 }); spawn = 0.45 + Math.random() * 0.35; }
    jspawn -= dt; if (jspawn <= 0) { const left = Math.random() < 0.5; items.push({ e: sprite("dive-jelly", "", 7), kind: "jelly", x: left ? -6 : 106, y: 20 + Math.random() * 65, vx: (left ? 1 : -1) * (12 + Math.random() * 6), vy: 0, w: Math.random() * 6.28 }); jspawn = 2 + Math.random() * 1.2; }
    for (let i = items.length - 1; i >= 0; i--) { const o = items[i]; o.x += o.vx * dt; o.y += o.vy * dt; o.w += dt * 2;
      const ix = o.x + (o.kind === "jelly" ? 0 : Math.sin(o.w) * 1.5), iy = o.y + (o.kind === "jelly" ? Math.sin(o.w) * 3 : 0);
      place(o.e, ix, iy, o.kind === "jelly" ? " rotate(" + Math.sin(o.w) * 8 + "deg)" : "");
      if (near(ix, iy, x, y, 6.5)) {
        if (o.kind === "jelly") { if (hurt <= 0) { const lost = Math.min(3, score); score -= lost; pop(ix, iy, lost ? "-" + lost + " (jellyfish!)" : "Oops!", true); hurt = 1; } }
        else { const g = o.kind === "gold" ? 5 : 1; score += g; pop(ix, iy, "+" + g + (g > 1 ? " ✨" : "")); }
        o.e.remove(); items.splice(i, 1); continue; }
      if (o.y > 108 || o.x < -10 || o.x > 110) { o.e.remove(); items.splice(i, 1); } }
    hud(["⚪ " + score, "⏱️ " + Math.max(0, Math.ceil(DIVE_SECS - t))]); return t < DIVE_SECS;
  });
  if (!L) return;
  L.lay.innerHTML = ""; L.ui.innerHTML = "";
  const k = kdOf(C.st, C.cls); k.dv = (Number(k.dv) || 0) + 1; k.p = (Number(k.p) || 0) + score; k.best = Math.max(Number(k.best) || 0, score); save(k);
  await panel('<img src="' + K + 'queen-cheer.webp" alt="" class="kdboximg"><h2>\u{1F389} +' + score + " pearls!</h2><p>You have ⚪ <b>" + k.p + "</b> pearls. " + Math.max(0, KD_DIVES - k.dv) + " dives left this week.</p><p class='small'>Spend pearls in the \u{1F41A} Pearl Shop (the shipwreck)!</p>", [["go", "Back to the Kingdom"]]);
  closeLayer(); view = "map"; rer();
}

if (typeof document !== "undefined") document.addEventListener("click", ev => {
  const t = ev.target.closest && ev.target.closest("[data-kd]"); if (!t) return;
  const [a, k] = t.dataset.kd.split(":");
  if (a === "go") { view = k; opened = null; shopSay = null; grotMonth = null; rer(); scrollTo({ top: 0 }); }
  else if (a === "clam") openClam();
  else if (a === "dive") runDive();
  else if (a === "trip") runTrip(true);
  else if (a === "board") runTrip(false);
  else if (a === "cat") { shopCat = k; shopSay = null; rer(); }
  else if (a === "buy") buyItem(k);
  else if (a === "year") { grotYear = Number(k); rer(); }
  else if (a === "mon") { grotMonth = Number(k); rer(); }
});

// the tab
export function kingdomTab(st, cls) {
  if (!kdUnlocked(st, cls)) return gateHTML(st, cls);
  const k = kdOf(st, cls);
  if (!k.t) return '<div class="kdscene kdgate open" style="background-image:url(' + K + 'kingdom-gate.webp)"><div class="kdbubbles">' + Array.from({ length: 14 }, (_, i) => '<i style="left:' + (8 + i * 6.5) + "%;animation-delay:" + (i % 5) * 0.3 + 's"></i>').join("") + "</div>" +
    '<div class="kdgatebox"><h2>\u{1F389} The gate is open!</h2><p>You reached your weekly XP and closed all your rings. Captain Duck’s submarine is ready to take you down to the <b>Axolotl Kingdom</b>!</p><p class="small">This week’s game: <b>' + GAMES[tripGame(cls)].icon + " " + GAMES[tripGame(cls)].name + "</b> (up to " + TRIP_MAX + " pearls). The Kingdom is open until Sunday at 10 pm.</p>" +
    '<button class="btn gold big" data-kd="board">\u{1F986} Board the submarine!</button></div></div>';
  const back = view !== "map" ? '<div class="row" style="margin:0 0 10px;"><button class="btn ghost small" data-kd="go:map">← Kingdom map</button></div>' : "";
  const head = '<div class="kdhead"><h2>\u{1F30A} The Axolotl Kingdom</h2><span class="fact">⚪ ' + (Number(k.p) || 0) + " pearls · \u{1F9F0} " + treasureCount(st) + " treasures</span></div>";
  if (view === "throne") return head + back + throneHTML(st, cls);
  if (view === "dive") return head + back + diveHTML(st, cls);
  if (view === "grotto") return head + back + grottoHTML(st, cls);
  if (view === "shop") return head + back + shopHTML(st, cls);
  return head + mapHTML(st, cls);
}

/* ----- console card ----- */
export function kdAdmin(students, cls) {
  const on = kdOn(cls), kids = students.filter(s => s.companionId), inn = on ? kids.filter(s => kdUnlocked(s, cls)) : [], t = treasureOf(wk(cls)), g = GAMES[tripGame(cls)];
  let h = '<div class="card" id="kdCard"><div class="card-head"><h2>\u{1F30A} Axolotl Kingdom</h2><span class="fact">' + (on ? "<b>ON</b> · " + inn.length + " in this week" : "off") + "</span></div>" +
    '<p class="lede" style="font-size:13.5px;">An undersea reward land. A student gets in when they reach their <b>weekly XP</b> and close <b>all their rings</b> (the same as opening the Treasure Vault). It stays open until Sunday 10 pm. ' +
    "Inside: Captain Duck’s submarine trip with a minigame (up to " + TRIP_MAX + " pearls), Queen Bubbles’ Treasure of the Week for the Treasure Grotto (52 a year), Pearl Diving (3 a week) and the Pearl Shop.</p>" +
    '<p class="small" style="display:flex;align-items:center;gap:8px;">' + trImg(t, "mini") + " This week: <b>" + esc(t.n) + "</b> · trip game: " + g.icon + " " + g.name + "</p>" +
    '<div class="row" style="margin:10px 0;"><button class="btn' + (on ? " ghost" : "") + '" data-act="kdToggle">' + (on ? "Turn the Kingdom off" : "\u{1F30A} Turn the Kingdom on") + "</button></div>";
  if (on && inn.length) h += '<p class="small"><b>In the Kingdom this week:</b> ' + inn.map(s => esc(s.name) + " (\u{1F9F0} " + treasureCount(s) + ")").join(", ") + "</p>";
  return h + "</div>";
}
