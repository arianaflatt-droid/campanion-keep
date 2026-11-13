/* ---------- 🛏️ Nebble Bed Shop (Nov 10) — in the 🐾 Adoption Center on Planet JP ----------
   Beds cost ⭐ Stardust (Ms. Ariana: simple 100, mid 150, big 250, fancy 400; holiday beds only in their season).
   The buddy Nebble sleeps on the bed that's in use, in the 🐾 My Room pet corner (petpark.js nebbleCorner).
   Everyone has the Classic bed for free. Saved in planet.pets: beds = { key: 1 } owned, bed = the one in use.
   Buying = ONE save (it's put in use right away); switching beds = ONE save. Food, brushes, tub toys and fetch toys
   come later (art not in yet) and will be more tabs here. */
import { esc } from "./game.js?v=20261113e";
import { azToday } from "./collect.js?v=20261113e";
import { freshSt, planetSave, planetNow, planetCtx } from "./safari.js?v=20261113e";

const PP = "assets/pets/place/";
// [key, name, price, months it's sold in (null = all year), where the Nebble sits: [bottom %, width %, left %]]
const B = (k, name, cost, m, sit) => ({ k, name, cost, m: m || null, sit: sit || [34, 60, 20] });
export const BEDS = [
  B("classic", "Classic Bed", 0),
  B("cloud", "Fluffy Cloud Bed", 100, null, [30, 58, 21]), B("moon", "Sweet Dreams Moon Bed", 100, null, [30, 58, 21]),
  B("donut", "Sprinkle Donut Bed", 100, null, [30, 56, 22]), B("sock", "Cozy Sock Bed", 100, null, [52, 50, 18]),
  B("marshmallow", "Marshmallow Bed", 100, null, [40, 56, 22]), B("pillowfort", "Pillow Fort", 100, null, [22, 50, 25]),
  B("nest", "Feather Nest", 100, null, [32, 58, 21]),
  B("flower", "Blossom Bed", 150, null, [30, 56, 22]), B("shell", "Pearl Shell Bed", 150, null, [30, 56, 22]),
  B("basket", "Picnic Basket", 150, null, [30, 56, 22]), B("teacup", "Teacup Bed", 150, null, [46, 50, 18]),
  B("mushroom", "Mushroom Bed", 150, null, [36, 56, 22]),
  B("cupcake", "Cupcake Bed", 150, null, [36, 56, 22]), B("watermelon", "Watermelon Bed", 150, null, [34, 58, 21]), B("lilypad", "Lily Pad Bed", 150, null, [32, 56, 20]),
  B("bubble", "Rainbow Bubble Bed", 150, null, [26, 52, 24]), B("hammock", "Beach Hammock", 150, null, [28, 40, 30]),
  B("ufo", "UFO Bed", 250, null, [34, 52, 24]), B("boat", "Sailboat Bed", 250, null, [22, 50, 20]), B("treasure", "Treasure Chest Bed", 250, null, [28, 52, 24]),
  B("bathtub", "Bubble Bath Tub", 250, null, [40, 44, 28]), B("comet", "Shooting Star Bed", 250, null, [30, 50, 14]), B("rocket", "Rocket Pod Bed", 250, null, [34, 50, 25]), B("crystal", "Crystal Geode Bed", 250, null, [26, 52, 24]), B("planet", "Planet Bed", 250, null, [40, 52, 24]),
  B("alien", "Alien Pod Bed", 250, null, [30, 52, 24]), B("dragonegg", "Dragon Egg Bed", 250, null, [30, 52, 24]), B("jellyfish", "Jellyfish Bed", 250, null, [40, 50, 25]),
  B("crown", "Royal Velvet Bed", 400, null, [34, 56, 22]), B("rainbowcloud", "Rainbow Cloud Bed", 400, null, [30, 52, 24]),
  B("pumpkin", "Pumpkin Bed", 150, [10, 11], [24, 52, 24]), B("snowglobe", "Snow Globe Bed", 150, [12, 1], [22, 50, 25]),
  B("stocking", "Holiday Stocking Bed", 150, [12], [30, 40, 12]), B("heart", "Sweetheart Bed", 150, [2], [24, 52, 24]), B("beachball", "Beach Ball Bed", 150, [5, 6, 7, 8], [34, 52, 22])];
const HOLI = { pumpkin: "\u{1F383}", snowglobe: "\u2744\uFE0F", stocking: "\u{1F384}", heart: "\u{1F496}", beachball: "\u{1F3D6}\uFE0F" };
const span = m => MONTH[m[0]] + (m.length > 1 ? "\u2013" + MONTH[m[m.length - 1]] : "");
export const BED = {}; BEDS.forEach(b => { BED[b.k] = b; });
const MONTH = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const FULL = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const bedImg = k => k && k !== "classic" && BED[k] ? PP + "beds/pet-bed-" + k + ".webp" : PP + "pet-bed.webp";
const petsOf = st => (((st && st.planet) || {}).pets) || {};
export const bedsOwned = st => Object.assign({ classic: 1 }, petsOf(st).beds || {});
export const bedOf = st => { const k = petsOf(st).bed; return k && BED[k] && bedsOwned(st)[k] ? BED[k] : BED.classic; };
const inSeason = (b, d) => !b.m || b.m.includes(Number(String(d).slice(5, 7)));

// the buddy Nebble on a bed (used here and in My Room)
export function bedWithPet(bk, petHtml, cls) {
  const b = BED[bk] || BED.classic, [y, w, x] = b.sit;
  return '<div class="nbbed ' + (cls || "") + '"><img class="nbbedimg" src="' + bedImg(b.k) + '" alt="">' +
    (petHtml ? '<span class="nbbedpet" style="bottom:' + y + "%;width:" + w + "%;left:" + x + '%">' + petHtml + "</span>" : "") + "</div>";
}

let tab = "adopt", cat = "beds", msg = null, peek = null;   // Nov 10: two tabs (Adopt, Shop); inside the Shop, arrows go through the item types
export const shopTab = () => tab === "adopt" ? "adopt" : cat;
const rer = () => { const c = planetCtx(); if (c && c.rerender) c.rerender(); };

function buy(k) {
  const c = planetCtx(); if (!c || !c.st) return;
  const b = BED[k], st = freshSt(c.st), d = azToday(); if (!b || !b.cost) return;
  if (bedsOwned(st)[k]) { msg = { t: "You already have the " + b.name + "!", bad: 1 }; return rer(); }
  if (!inSeason(b, d)) { msg = { t: "The " + b.name + " is only sold in " + b.m.map(m => FULL[m]).join(" and ") + ".", bad: 1 }; return rer(); }
  const pl = planetNow();
  if ((Number(pl.dust) || 0) < b.cost) { msg = { t: "Not enough Stardust yet. The " + b.name + " costs " + b.cost + " ⭐.", bad: 1 }; return rer(); }
  const pets = JSON.parse(JSON.stringify(pl.pets || {}));
  pets.beds = Object.assign({}, pets.beds || {}, { [k]: 1 }); pets.bed = k; pets.bn = (Number(pets.bn) || 0) + 1;
  pl.pets = pets; pl.dust = (Number(pl.dust) || 0) - b.cost; planetSave(pl);
  peek = k; msg = { t: "\u{1F389} You got the " + b.name + "! Your Nebble sleeps on it in \u{1F3E0} My Room." }; rer();
}
function use(k) {
  const c = planetCtx(); if (!c || !c.st) return;
  const st = freshSt(c.st); if (!bedsOwned(st)[k] || bedOf(st).k === k) return;
  const pl = planetNow(), pets = JSON.parse(JSON.stringify(pl.pets || {}));
  pets.bed = k; pl.pets = pets; planetSave(pl);
  peek = k; msg = { t: "\u{1F6CF}️ Your Nebble is using the " + BED[k].name + " now." }; rer();
}
if (typeof document !== "undefined") document.addEventListener("click", ev => {
  const t = ev.target.closest && ev.target.closest("[data-nbshop]"); if (!t) return;
  const [a, k] = t.dataset.nbshop.split(":");
  if (a === "tab") { tab = k === "shop" ? "shop" : "adopt"; msg = null; cpeek = null; rer(); }
  else if (a === "cat") { const i = CATS.findIndex(x => x[0] === cat), n = CATS.length; cat = k === "next" ? CATS[(i + 1) % n][0] : k === "prev" ? CATS[(i + n - 1) % n][0] : CATS.some(x => x[0] === k) ? k : cat; msg = null; cpeek = null; peek = null; rer(); }
  else if (a === "peek") { peek = k; msg = null; rer(); }
  else if (a === "buy") buy(k);
  else if (a === "use") use(k);
  else if (a === "cpeek") { cpeek = k; msg = null; rer(); }
  else if (a === "cbuy") cbuy(k);
  else if (a === "cuse") cuse(k);
});

// the tab row at the top of the Adoption Center
const TABS = [["adopt", "\u{1F43E} Adopt"], ["shop", "\u{1F6CD}\uFE0F Nebble Shop"]];
const CATS = [["beds", "\u{1F6CF}\uFE0F", "Beds"], ["food", "\u{1F37D}\uFE0F", "Food"], ["brush", "\u{1FAA5}", "Brushes"], ["bath", "\u{1F6C1}", "Bath"], ["toy", "\u26BD", "Toys"]];
export function shopTabs() {
  let h = '<div class="nbtabs">' + TABS.map(([k, n]) => '<button class="nbtab' + (tab === k ? " on" : "") + '" data-nbshop="tab:' + k + '">' + n + "</button>").join("") + "</div>";
  if (tab !== "shop") return h;
  const i = CATS.findIndex(x => x[0] === cat), c = CATS[i];
  return h + '<div class="nbcatbar"><button class="nbarrow" data-nbshop="cat:prev" aria-label="Previous">\u25C0</button>' +
    '<div class="nbcatmid"><b>' + c[1] + " " + c[2] + '</b><span class="nbdots">' + CATS.map(([k, e, n]) => '<button class="nbdot' + (k === cat ? " on" : "") + '" data-nbshop="cat:' + k + '" title="' + n + '">' + e + "</button>").join("") + "</span></div>" +
    '<button class="nbarrow" data-nbshop="cat:next" aria-label="Next">\u25B6</button></div>';
}
// petOf(k) → the buddy's picture (passed in by pets.js)
export function bedShopHTML(st, buddyHtml) {
  st = freshSt(st); const d = azToday(), own = bedsOwned(st), cur = bedOf(st), dust = Number(((st && st.planet) || {}).dust) || 0;
  if (peek && !BED[peek]) peek = null;
  const show = BED[peek] || cur, owned = !!own[show.k];
  const n = Object.keys(own).filter(k => BED[k]).length;
  let h = '<div class="card nbshop"><div class="card-head"><h2>\u{1F6CF}️ Nebble Bed Shop</h2><span class="fact">⭐ ' + dust.toLocaleString() + " Stardust</span></div>";
  h += '<div class="nbshoptop"><div class="nbshowcase">' + bedWithPet(show.k, buddyHtml, "big") + "</div><div class=\"nbshowinfo\"><h3>" + esc(show.name) + "</h3>" +
    (show.m ? '<p class="nbseason">' + (HOLI[show.k] || "\u{1F381}") + " Holiday bed: sold in " + show.m.map(m => FULL[m]).join(" and ") + "</p>" : "") +
    (show.k === cur.k ? '<p class="nbusing">✅ Your Nebble sleeps here</p>'
      : owned ? '<button class="btn gold" data-nbshop="use:' + show.k + '">\u{1F6CF}️ Use this bed</button>'
      : !inSeason(show, d) ? '<p class="muted">Back in ' + FULL[show.m[0]] + "!</p>"
      : '<button class="btn gold" data-nbshop="buy:' + show.k + '"' + (dust >= show.cost ? "" : " disabled") + ">Buy for " + show.cost + " ⭐</button>" +
        (dust >= show.cost ? "" : '<p class="small muted">' + (show.cost - dust) + " more ⭐ to go!</p>")) +
    (buddyHtml ? "" : '<p class="small muted">Adopt a Nebble to see it sleep here!</p>') +
    '<p class="small muted">You have ' + n + " of " + BEDS.length + " beds.</p></div></div>";
  if (msg) h += '<div class="banner ' + (msg.bad ? "bad" : "info") + '" style="margin:10px 0;">' + esc(msg.t) + "</div>";
  h += '<div class="nbbeds">' + BEDS.map(b => {
    const have = !!own[b.k], on = b.k === cur.k, gone = !have && !inSeason(b, d);
    return '<button class="nbbedcard' + (on ? " using" : "") + (have ? " have" : "") + (gone ? " gone" : "") + (show.k === b.k ? " peek" : "") + '" data-nbshop="peek:' + b.k + '">' +
      '<img src="' + bedImg(b.k) + '" alt="" loading="lazy"><b>' + esc(b.name) + "</b>" +
      "<small>" + (on ? "✅ Using" : have ? "Yours" : gone ? "\u{1F512} " + span(b.m) : "⭐ " + b.cost) + "</small>" +
      (b.m && !gone && !have ? '<i class="nbhol">' + (HOLI[b.k] || "\u{1F381}") + "</i>" : "") + "</button>";
  }).join("") + "</div>";
  h += '<p class="small muted" style="margin-top:8px;">Tap a bed to see your Nebble on it. Tap the \u25B6 arrows for food, brushes, bath toys and fetch toys!</p></div>';
  return h;
}

/* ---------- 🍽️🪥🛁⚽ Care shop (Nov 10): things the Nebble USES in the Pet Park ----------
   Bought once, kept forever (Ms. Ariana). Saved in planet.pets: own = { itemKey: 1 } and use = { cat: itemKey } (what's in use).
   Each category has a free starter (pellets, the wood brush, white bubbles, the red ball; no tub toy).
   Buying = ONE save (put in use right away); switching = ONE save. */
const C = "assets/pets/place/care/", F = "assets/pets/place/food/";
const I = (k, cat, name, cost, x) => Object.assign({ k, cat, name, cost }, x || {});
export const CARE = [
  // food: bowl + piece(s); several pieces = a random color for each tossed piece
  I("food-pellets", "food", "Alien Pellets", 0, { bowl: PP + "pellet-bowl.webp", pcs: [PP + "pellet.webp"] }),
  I("food-starcookie", "food", "Star Cookies", 40, { bowl: F + "food-starcookie-bowl.webp", pcs: [F + "food-starcookie.webp"] }),
  I("food-moonjelly", "food", "Moon Jelly", 40, { bowl: F + "food-moonjelly-bowl.webp", pcs: [F + "food-moonjelly.webp"] }),
  I("food-berries", "food", "Rainbow Berries", 50, { bowl: F + "food-berries-bowl.webp", pcs: ["red", "yellow", "green", "blue", "purple"].map(c => F + "food-berries-" + c + ".webp") }),
  I("food-comet", "food", "Comet Crunch", 50, { bowl: F + "food-comet-bowl.webp", pcs: [F + "food-comet.webp"] }),
  I("food-fish", "food", "Pink Fishies", 60, { bowl: F + "food-fish-bowl.webp", pcs: [F + "food-fish.webp"] }),
  I("food-cupcake", "food", "Mini Cupcakes", 75, { bowl: F + "food-cupcake-bowl.webp", pcs: ["pink", "green", "blue", "yellow", "purple"].map(c => F + "food-cupcake-" + c + ".webp") }),
  I("food-candy", "food", "Swirl Candies", 75, { bowl: F + "food-candy-bowl.webp", pcs: ["orange", "purple", "pink", "yellow", "green", "blue"].map(c => F + "food-candy-" + c + ".webp") }),
  I("food-stardust", "food", "Stardust Nuggets", 100, { bowl: F + "food-stardust-bowl.webp", pcs: [F + "food-stardust.webp"] }),
  // brushes (Brush time): sp = the sparkle color
  I("brush-basic", "brush", "Wood Brush", 0, { img: C + "brush-basic.webp", sp: ["✨"] }),
  I("brush-pink", "brush", "Heart Brush", 60, { img: C + "brush-pink.webp", sp: ["\u{1F496}", "\u{1F495}", "✨"] }),
  I("brush-star", "brush", "Star Brush", 75, { img: C + "brush-star.webp", sp: ["⭐", "\u{1F31F}", "✨"] }),
  I("brush-comb", "brush", "Space Comb", 100, { img: C + "brush-comb.webp", sp: ["\u{1FA90}", "✨", "⭐"] }),
  I("brush-glitter", "brush", "Glitter Brush", 100, { img: C + "brush-glitter.webp", sp: ["\u{1F308}", "✨", "\u{1F4AB}"] }),
  I("brush-crystal", "brush", "Crystal Brush", 150, { img: C + "brush-crystal.webp", sp: ["\u{1F48E}", "❄️", "✨"] }),
  I("brush-gold", "brush", "Royal Gold Brush", 200, { img: C + "brush-gold.webp", sp: ["\u{1F451}", "\u{1F31F}", "✨"] }),
  // bath: tub toys (float in the tub) and bubble colors (drawn with code)
  I("tub-none", "tub", "No tub toy", 0, { emo: "\u{1F6C1}" }),
  I("tubtoy-duck", "tub", "Astronaut Ducky", 60, { img: C + "tubtoy-duck.webp" }),
  I("tubtoy-boat", "tub", "Toy Sailboat", 75, { img: C + "tubtoy-boat.webp" }),
  I("tubtoy-octopus", "tub", "Squishy Octopus", 75, { img: C + "tubtoy-octopus.webp" }),
  I("tubtoy-whale", "tub", "Spouting Whale", 100, { img: C + "tubtoy-whale.webp" }),
  I("tubtoy-ufo", "tub", "Floating UFO", 150, { img: C + "tubtoy-ufo.webp" }),
  I("bub-white", "bub", "Classic Bubbles", 0, { c: ["#bfe6ff", "#ffbef0"] }),
  I("bub-pink", "bub", "Pink Bubbles", 40, { c: ["#ff9ec4", "#ff5da2"] }),
  I("bub-blue", "bub", "Ocean Bubbles", 40, { c: ["#7fd3ff", "#3fa9f5"] }),
  I("bub-mint", "bub", "Mint Bubbles", 50, { c: ["#9ff5c8", "#3fbf7f"] }),
  I("bub-gold", "bub", "Golden Bubbles", 60, { c: ["#ffe08a", "#f2b33d"] }),
  I("bub-rainbow", "bub", "Rainbow Bubbles", 80, { c: ["#ff5da2", "#ffd966", "#7fd3ff", "#9ff5c8", "#c9a7ff"] }),
  I("bub-galaxy", "bub", "Galaxy Bubbles", 100, { c: ["#8b7bff", "#ff5da2", "#3b2a8a"] }),
  // fetch toys
  I("toy-ball", "toy", "Red Ball", 0, { img: PP + "ball.webp" }),
  I("toy-starball", "toy", "Star Ball", 60, { img: C + "toy-starball.webp" }),
  I("toy-moonball", "toy", "Moon Ball", 60, { img: C + "toy-moonball.webp" }),
  I("toy-bone", "toy", "Comet Bone", 75, { img: C + "toy-bone.webp" }),
  I("toy-frisbee", "toy", "Light-Up Frisbee", 100, { img: C + "toy-frisbee.webp" }),
  I("toy-rocket", "toy", "Squeaky Rocket", 150, { img: C + "toy-rocket.webp" })];
export const CARE_BY = {}; CARE.forEach(i => { CARE_BY[i.k] = i; });
const FREE = { food: "food-pellets", brush: "brush-basic", tub: "tub-none", bub: "bub-white", toy: "toy-ball" };
const careOwn = st => petsOf(st).own || {};
export const hasCare = (st, k) => !!CARE_BY[k] && (!CARE_BY[k].cost || !!careOwn(st)[k]);
export const careUse = (st, cat) => { const k = (petsOf(st).use || {})[cat]; return CARE_BY[k] && CARE_BY[k].cat === cat && hasCare(st, k) ? CARE_BY[k] : CARE_BY[FREE[cat]]; };
export const careOwned = st => CARE.filter(i => i.cost && careOwn(st)[i.k]).length;
export const careThumb = (i, cls) => i.img ? '<img class="' + (cls || "") + '" src="' + i.img + '" alt="" loading="lazy">' : i.bowl ? '<img class="' + (cls || "") + '" src="' + i.bowl + '" alt="" loading="lazy">'
  : i.c ? '<span class="nbbubsw ' + (cls || "") + '" style="background:' + (i.c.length > 2 ? "conic-gradient(" + i.c.concat(i.c[0]).join(",") + ")" : "radial-gradient(circle at 30% 30%,#fff 0 18%," + i.c[0] + " 45%," + i.c[1] + ")") + '"></span>'
  : '<span class="nbemo ' + (cls || "") + '">' + (i.emo || "") + "</span>";
let cpeek = null;
function cbuy(k) {
  const c = planetCtx(); if (!c || !c.st) return;
  const it = CARE_BY[k], st = freshSt(c.st); if (!it || !it.cost) return;
  if (hasCare(st, k)) { msg = { t: "You already have " + it.name + "!", bad: 1 }; return rer(); }
  const pl = planetNow();
  if ((Number(pl.dust) || 0) < it.cost) { msg = { t: "Not enough Stardust yet. " + it.name + " costs " + it.cost + " ⭐.", bad: 1 }; return rer(); }
  const pets = JSON.parse(JSON.stringify(pl.pets || {}));
  pets.own = Object.assign({}, pets.own || {}, { [k]: 1 }); pets.use = Object.assign({}, pets.use || {}, { [it.cat]: k }); pets.cn = (Number(pets.cn) || 0) + 1;
  pl.pets = pets; pl.dust = (Number(pl.dust) || 0) - it.cost; planetSave(pl);
  cpeek = k; msg = { t: "\u{1F389} You got " + it.name + "! Your Nebble will use it in the \u{1F333} Pet Park." }; rer();
}
function cuse(k) {
  const c = planetCtx(); if (!c || !c.st) return;
  const it = CARE_BY[k], st = freshSt(c.st); if (!it || !hasCare(st, k) || careUse(st, it.cat).k === k) return;
  const pl = planetNow(), pets = JSON.parse(JSON.stringify(pl.pets || {}));
  pets.use = Object.assign({}, pets.use || {}, { [it.cat]: k }); pl.pets = pets; planetSave(pl);
  cpeek = k; msg = { t: "✅ Your Nebble is using " + it.name + " now." }; rer();
}
const HEAD = { food: ["\u{1F37D}️ Nebble Snacks", "Your Nebble eats these in Feed time."], brush: ["\u{1FAA5} Brushes", "Use them in Brush time. Each one makes different sparkles!"],
  bath: ["\u{1F6C1} Bath Shop", "Tub toys float in the bath, and bubble colors change your bubbles."], toy: ["⚽ Fetch Toys", "Throw them in Play fetch."] };
function cardsOf(st, list, show) {
  const dust = Number(((st && st.planet) || {}).dust) || 0;
  return '<div class="nbbeds">' + list.map(i => { const have = hasCare(st, i.k), on = careUse(st, i.cat).k === i.k;
    return '<button class="nbbedcard' + (on ? " using" : "") + (have ? " have" : "") + (show.k === i.k ? " peek" : "") + '" data-nbshop="cpeek:' + i.k + '">' + careThumb(i) + "<b>" + esc(i.name) + "</b>" +
      "<small>" + (on ? "✅ Using" : have ? (i.cost ? "Yours" : "Free") : "⭐ " + i.cost) + "</small></button>"; }).join("") + "</div>";
}
// the preview at the top: the buddy with the item
function careShow(i, buddyHtml) {
  const pet = buddyHtml ? '<span class="nbcpet">' + buddyHtml + "</span>" : "";
  if (i.cat === "food") return '<div class="nbcshow">' + pet + '<img class="nbcbowl" src="' + i.bowl + '" alt=""></div>';
  if (i.cat === "bub") return '<div class="nbcshow">' + pet + [[18, 30, 14], [70, 20, 11], [78, 55, 16], [12, 62, 10], [55, 8, 9]].map(([x, y, s], n) =>
    '<span class="nbcbub" style="left:' + x + "%;top:" + y + "%;width:" + s + "%;background:radial-gradient(circle at 30% 30%,#fff 0 18%," + i.c[n % i.c.length] + " 55%," + i.c[(n + 1) % i.c.length] + ')"></span>').join("") + "</div>";
  return '<div class="nbcshow">' + pet + (i.img ? '<img class="nbcitem ' + i.cat + '" src="' + i.img + '" alt="">' : '<span class="nbcitem nbemo">' + i.emo + "</span>") + "</div>";
}
export function careShopHTML(st, buddyHtml) {
  st = freshSt(st); const dust = Number(((st && st.planet) || {}).dust) || 0;
  const list = CARE.filter(i => cat === "bath" ? i.cat === "tub" || i.cat === "bub" : i.cat === cat);
  if (cpeek && !list.some(i => i.k === cpeek)) cpeek = null;
  const show = CARE_BY[cpeek] || careUse(st, cat === "bath" ? "tub" : cat), have = hasCare(st, show.k), on = careUse(st, show.cat).k === show.k;
  const [title, sub] = HEAD[cat];
  let h = '<div class="card nbshop"><div class="card-head"><h2>' + title + '</h2><span class="fact">⭐ ' + dust.toLocaleString() + " Stardust</span></div>" +
    '<div class="nbshoptop"><div class="nbshowcase">' + careShow(show, buddyHtml) + '</div><div class="nbshowinfo"><h3>' + esc(show.name) + "</h3>" +
    (on ? '<p class="nbusing">✅ Your Nebble is using this</p>' : have ? '<button class="btn gold" data-nbshop="cuse:' + show.k + '">✅ Use this</button>'
      : '<button class="btn gold" data-nbshop="cbuy:' + show.k + '"' + (dust >= show.cost ? "" : " disabled") + ">Buy for " + show.cost + " ⭐</button>" +
        (dust >= show.cost ? "" : '<p class="small muted">' + (show.cost - dust) + " more ⭐ to go!</p>")) +
    '<p class="small muted">' + esc(sub) + " Yours to keep forever.</p></div></div>";
  if (msg) h += '<div class="banner ' + (msg.bad ? "bad" : "info") + '" style="margin:10px 0;">' + esc(msg.t) + "</div>";
  if (cat === "bath") h += '<p class="small" style="margin:12px 0 0;"><b>\u{1F986} Tub toys</b></p>' + cardsOf(st, list.filter(i => i.cat === "tub"), show) +
    '<p class="small" style="margin:12px 0 0;"><b>\u{1FAE7} Bubble colors</b></p>' + cardsOf(st, list.filter(i => i.cat === "bub"), show);
  else h += cardsOf(st, list, show);
  return h + "</div>";
}
