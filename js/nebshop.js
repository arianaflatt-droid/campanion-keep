/* ---------- 🛏️ Nebble Bed Shop (Nov 10) — in the 🐾 Adoption Center on Planet JP ----------
   Beds cost ⭐ Stardust (Ms. Ariana: simple 100, mid 150, big 250, fancy 400; holiday beds only in their season).
   The buddy Nebble sleeps on the bed that's in use, in the 🐾 My Room pet corner (petpark.js nebbleCorner).
   Everyone has the Classic bed for free. Saved in planet.pets: beds = { key: 1 } owned, bed = the one in use.
   Buying = ONE save (it's put in use right away); switching beds = ONE save. Food, brushes, tub toys and fetch toys
   come later (art not in yet) and will be more tabs here. */
import { esc } from "./game.js?v=20261110e";
import { azToday } from "./collect.js?v=20261110e";
import { freshSt, planetSave, planetNow, planetCtx } from "./safari.js?v=20261110e";

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

let tab = "adopt", msg = null, peek = null;
export const shopTab = () => tab;
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
  if (a === "tab") { tab = k === "beds" ? "beds" : "adopt"; msg = null; rer(); }
  else if (a === "peek") { peek = k; msg = null; rer(); }
  else if (a === "buy") buy(k);
  else if (a === "use") use(k);
});

// the tab row at the top of the Adoption Center
export function shopTabs() {
  return '<div class="nbtabs"><button class="nbtab' + (tab === "adopt" ? " on" : "") + '" data-nbshop="tab:adopt">\u{1F43E} Adopt</button>' +
    '<button class="nbtab' + (tab === "beds" ? " on" : "") + '" data-nbshop="tab:beds">\u{1F6CF}️ Bed Shop</button></div>';
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
  h += '<p class="small muted" style="margin-top:8px;">Tap a bed to see your Nebble on it. More shop items (food, brushes, bath toys) are coming soon!</p></div>';
  return h;
}
