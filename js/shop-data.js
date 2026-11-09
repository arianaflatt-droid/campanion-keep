/* ---------- 🛒 Planet JP Space Shop (Nov 8): the catalog only (no imports), shared by spaceshop.js, game.js, planet.js, cafe.js, badges.js ----------
   Everything costs ⭐ Stardust. Saved on the student in planet.shop = {
     o: { itemId: 1 }  things bought (outfits also go in st.outfits, room pieces in st.roomOwned, the egg in st.coll),
     w: { duck, flame, trail, orbit, table }  what's in use,
     n: purchases, sw: { d: day, got: 1 } today's Swap Shop deal, swn: Swap Shop deals bought, cr: crates opened }.
   Collections: a new space collection each season (Starship Cadet now). Each stays in the shop after. */
const P = "assets/planet/shop/";
export const SHOP_ART = P;
const I = (k, cat, name, cost, x) => Object.assign({ k, cat, name, cost }, x || {});
export const COLLECTIONS = [{ key: "starship", name: "\u{1F680} Starship Cadet", room: "starship" }];
export const SHOP_ITEMS = [
  // 👩‍🚀 outfits (worn from Gear like event outfits; game.js OUTFITS ids space-*)
  I("space-spacehelmet", "outfit", "Astronaut Bubble Helmet", 300, { img: P + "outfit-spacehelmet.webp", col: "starship" }),
  I("space-captainhat", "outfit", "Star Captain Hat", 250, { img: P + "outfit-captainhat.webp", col: "starship" }),
  I("space-cometscarf", "outfit", "Comet Scarf", 200, { img: P + "outfit-cometscarf.webp", col: "starship" }),
  I("space-antennae", "outfit", "Alien Antennae", 150, { img: P + "outfit-antennae.webp", col: "starship" }),
  // 🛋️ Starship Cabin room set (room ids kind_starship, art assets/room/)
  ...[["bed", "Rocket Bed", 500], ["chair", "Floating Moon Chair", 350], ["wallpaper", "Rockets & Planets Wallpaper", 300], ["flooring", "Starship Deck Floor", 300],
    ["ceiling", "Planet Mobile Light", 300], ["rug", "Ringed Planet Rug", 250], ["wall_art", "Nebula Porthole", 250], ["plant", "Glowing Alien Plant", 200], ["shelf", "Rocket & Astronaut Shelf", 200]]
    .map(([kind, name, cost]) => I(kind + "_starship", "room", name, cost, { img: "assets/room/" + kind + "_starship.webp", col: "starship" })),
  // 🚀 S.S. Duck paint jobs (launch bar, liftoff, The Keep's launch news)
  I("duck-candy", "duck", "Candy Stripe Paint", 400, { img: P + "ss-duck-candy.webp" }),
  I("duck-rainbow", "duck", "Rainbow Paint", 400, { img: P + "ss-duck-rainbow.webp" }),
  I("duck-galaxy", "duck", "Galaxy Paint", 500, { img: P + "ss-duck-galaxy.webp" }),
  I("duck-gold", "duck", "Golden S.S. Duck", 2500, { img: P + "ss-duck-gold.webp", goal: 1 }),
  // 🔥 flame colors + ✨ trails (drawn with code)
  I("flame-blue", "flame", "Blue Flame", 100, { emo: "\u{1F535}", fx: "hue-rotate(190deg) saturate(1.4)" }),
  I("flame-pink", "flame", "Pink Flame", 100, { emo: "\u{1FA77}", fx: "hue-rotate(290deg) saturate(1.3)" }),
  I("flame-rainbow", "flame", "Rainbow Flame", 200, { emo: "\u{1F308}", fx: "rainbow" }),
  I("trail-sparkle", "trail", "Sparkle Trail", 150, { emo: "✨" }),
  I("trail-comet", "trail", "Comet Trail", 200, { emo: "☄️" }),
  I("trail-rainbow", "trail", "Rainbow Trail", 250, { emo: "\u{1F308}" }),
  // 🌙 orbit buddies (circle the companion everywhere it's shown)
  I("orbit-moon", "orbit", "Moon Buddy", 200, { img: P + "orbit-moon.webp" }),
  I("orbit-star", "orbit", "Star Buddy", 200, { img: P + "orbit-star.webp" }),
  I("orbit-planet", "orbit", "Planet Buddy", 200, { img: P + "orbit-planet.webp" }),
  I("orbit-ufo", "orbit", "UFO Buddy", 300, { img: P + "orbit-ufo.webp" }),
  // ☕ café table extras (at your seat in the Space Café)
  I("table-flag", "table", "Space Flag", 25, { img: P + "table-flag.webp" }),
  I("table-flowers", "table", "Glowing Flowers", 40, { img: P + "table-flowers.webp" }),
  I("table-lamp", "table", "Star Lamp", 40, { img: P + "table-lamp.webp" }),
  I("table-balloon", "table", "Planet Balloon", 50, { img: P + "table-balloon.webp" }),
  I("table-rocket", "table", "Toy Rocket", 60, { img: P + "table-rocket.webp" }),
  // 🥚 the big one: hatches a Planet JP alien
  I("egg-planetjp", "egg", "Planet JP Egg", 2000, { img: P + "egg-planetjp.webp", goal: 1, again: 1 })];
// 🚀 Duck paint, flames and trails wait for the Duck Hangar (Nov 8, Ms. Ariana): the Hangar will sell them and let students switch.
export const HANGAR_CATS = ["duck", "flame", "trail"];
export const HANGAR_OPEN = false;
export const SHOP_BY = {}; SHOP_ITEMS.forEach(i => { SHOP_BY[i.k] = i; });
export const CRATE_COST = 75;
export const CATS = [["outfit", "\u{1F469}‍\u{1F680} Outfits", "Wear them from Gear on My Companion."], ["room", "\u{1F6CB}️ Starship Cabin room set", "Decorate with them in My Room."],
  ["duck", "\u{1F680} S.S. Duck paint", "Your duck on the launch bar and in liftoff."], ["flame", "\u{1F525} Rocket flames", "The fire behind your duck."], ["trail", "✨ Trails", "Behind your duck on the launch bar."],
  ["orbit", "\u{1F319} Orbit buddies", "They circle your companion everywhere."], ["table", "☕ Café table extras", "At your seat in the Space Café."], ["egg", "\u{1F95A} Big saving goal", "Hatches a Planet JP alien!"]];
// what a student has / uses
export const shopOf = st => (((st && st.planet) || {}).shop) || {};
export const hasItem = (st, k) => { const it = SHOP_BY[k]; if (!it) return false;
  if (it.cat === "outfit") return !!((st && st.outfits) || {})[k];
  if (it.cat === "room") return ((st && st.roomOwned) || []).includes(k);
  return !!(shopOf(st).o || {})[k]; };
export const wearing = (st, cat) => { const k = (shopOf(st).w || {})[cat]; return k && SHOP_BY[k] && hasItem(st, k) ? SHOP_BY[k] : null; };
export const duckImgOf = st => { const d = wearing(st, "duck"); return d ? d.img : "assets/planet/ss-duck.webp"; };
export const flameFxOf = st => { const f = wearing(st, "flame"); return f ? f.fx : ""; };
export const trailOf = st => { const t = wearing(st, "trail"); return t ? t.k.slice(6) : ""; };
export const orbitImgOf = st => { const o = wearing(st, "orbit"); return o ? o.img : ""; };
export const tableImgOf = st => { const t = wearing(st, "table"); return t ? t.img : ""; };
export const shopBuys = st => Number(shopOf(st).n) || 0;
export const swapBuys = st => Number(shopOf(st).swn) || 0;
export const outfitsOwned = st => SHOP_ITEMS.filter(i => i.cat === "outfit" && hasItem(st, i.k)).length;
export const cabinOwned = st => SHOP_ITEMS.filter(i => i.cat === "room" && hasItem(st, i.k)).length;
