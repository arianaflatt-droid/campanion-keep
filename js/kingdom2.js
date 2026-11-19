/* ---------- 🌊 Axolotl Kingdom, part 2 (Nov 15): the Guest areas ----------
   Ms. Ariana turns it on in the console (cls.kd2On). A Preview (View as student) always shows it, so she can try it first.
   New places on the big Kingdom map:
   - 👑 Throne Room: Queen's Quests, 3 small quests a week (+15 pearls each). All 3 open the Royal Chest (shake, flash, open: +30–50).
   - 🐠 Royal Aquarium: 60 sea creatures in 6 tanks. Every Pearl Dive catches one (new ones first). The hall shows 3 tanks at a time
     with 2–3 of your creatures in each; tap a tank to see all of yours swim in it. A full tank pays +50 once.
     Sizes follow real life (6 size groups); crabs and other bottom dwellers stay on the sand; jellies bob.
   - 🌸 Coral Garden: plant 3 corals; water each one once a week and it grows a stage (4 stages). A full bloom pays +25.
   - 🎨 Sub Paint Dock: paint jobs for your submarine (24) and bubble trails, bought with pearls, then the paint minigame (the Duck Hangar's).
     Your sub shows on the Kingdom bar and on the trip.
   - Guide ducks: the first visit to a place shows how it works; after that the duck just says hi.
   Everything is saved inside the student's kd (one save per action). Lasting parts (kept from week to week):
     aq { creature: times caught }, aqf { tank: 1 } full-tank pearls paid, cg { s:[1-4,…], w:[week,…], b:[1,…] } garden,
     sub { own:{key:1}, use, trail, trails:{key:1} }, seen { area: 1 }.
   Weekly parts (a new week starts fresh): qd { quest: 1 } claimed quests, qx chest pearls, wb best dive this week,
     wn new creatures this week, vq { place: 1 } places visited this week, ws pearls spent this week. */
import { esc, companionOf, petWithHead, petHTML } from "./game.js?v=20261119b";
import { startPaint } from "./hangar.js?v=20261119b";
import { KD_ULTRA_FAM } from "./kd-ultra.js?v=20261119b";
import { owned as crOwned, ownedFams, formOf, fighterFrom, resolveRound, hitDamage, MOVES, moveOk, sparkleImg } from "./collect.js?v=20261119b";

const K = "assets/kingdom/";
export const KEEP2_NOTE = "ar = this week's arena { w, won, tries }, arb = boss badges { boss: 1 }";
export const KEEP2 = ["aq", "aqf", "cg", "sub", "seen", "sh", "rk", "rkp", "ship", "hx", "sc", "bk", "ar", "arb", "rke", "ct", "ws", "lg"];
export const kd2On = (cls, preview) => !!preview || !!(cls && cls.kd2On);

/* ----- ranks: weeks the student reached the Kingdom (= Treasures of the Week they have) ----- */
export const RANKS = [[1, "Guest", ""], [2, "Page", "page"], [3, "Squire", "squire"], [4, "Knight", "knight"], [6, "Captain", "captain"], [8, "Baron", "baron"],
  [10, "Duke", "duke"], [12, "Royal", "royal"], [15, "Grand Royal", "grandroyal"], [18, "Legend", "legend"]];
export const weeksIn = st => Object.keys(((st && st.kd) || {}).g || {}).length;
export function rankOf(st) { const n = Math.max(1, weeksIn(st)); let r = RANKS[0]; RANKS.forEach(x => { if (n >= x[0]) r = x; }); return { n, name: r[1], badge: r[2] }; }
export function rankChip(st) {
  const r = rankOf(st);
  return '<span class="kdrank' + (r.n >= 18 ? " legend" : "") + '">' + (r.badge ? '<img src="' + K + "rank-" + r.badge + '.webp" alt="">' : "\u{1F3F7}️") + "<b>" + r.name + "</b><small>week " + r.n + "</small></span>";
}

/* ----- the 60 aquarium creatures: tank (0–5), size group, floor = stays on the sand, bob = jelly bob ----- */
export const TANKS = [["coral-reef", "Coral Reef"], ["kelp-forest", "Kelp Forest"], ["open-ocean", "Open Ocean"], ["moonlit-lagoon", "Moonlit Lagoon"], ["deep-sea", "Deep Sea"], ["ice-cave", "Ice Cave"]];
export const AQSZ = { xs: 6, s: 9, m: 13, l: 18, xl: 24, xxl: 32 };
const SZ = { xs: 6, s: 9, m: 13, l: 18, xl: 24, xxl: 32 };
const C0 = [
  [0, "clownfish", "Clownfish", "s"], [0, "pufferfish", "Pufferfish", "s"], [0, "sea-turtle", "Sea Turtle", "l"], [0, "angelfish", "Angelfish", "s"], [0, "blue-tang", "Blue Tang", "s"],
  [0, "butterflyfish", "Butterflyfish", "s"], [0, "parrotfish", "Parrotfish", "m"], [0, "pygmy-seahorse", "Pygmy Seahorse", "xs"], [0, "starfish", "Starfish", "s", 1], [0, "hermit-crab", "Hermit Crab", "xs", 1],
  [1, "sea-otter", "Sea Otter", "l"], [1, "garibaldi", "Garibaldi", "s"], [1, "leopard-shark", "Leopard Shark", "l"], [1, "sea-urchin", "Purple Sea Urchin", "s", 1], [1, "kelp-crab", "Kelp Crab", "s", 1],
  [1, "sea-lion", "Sea Lion", "l"], [1, "rockfish", "Rockfish", "m"], [1, "bat-ray", "Bat Ray", "l"], [1, "sheephead", "Sheephead", "m"], [1, "abalone", "Abalone", "s", 1],
  [2, "manta-ray", "Manta Ray", "xl"], [2, "dolphin", "Dolphin", "l"], [2, "flying-fish", "Flying Fish", "m"], [2, "sailfish", "Sailfish", "l"], [2, "moon-jellyfish", "Moon Jellyfish", "m", 0, 1],
  [2, "whale-shark", "Whale Shark", "xxl"], [2, "ocean-sunfish", "Ocean Sunfish", "l"], [2, "humpback-whale", "Humpback Whale", "xxl"], [2, "nautilus", "Nautilus", "s"], [2, "swordfish", "Swordfish", "l"],
  [3, "octopus", "Octopus", "m"], [3, "sea-bunny", "Sea Bunny", "xs", 1], [3, "rainbow-eel", "Rainbow Eel", "m"], [3, "nudibranch", "Nudibranch", "xs", 1], [3, "mandarin-dragonet", "Mandarin Dragonet", "xs"],
  [3, "cuttlefish", "Cuttlefish", "m"], [3, "mantis-shrimp", "Mantis Shrimp", "s", 1], [3, "sea-pig", "Sea Pig", "s", 1], [3, "porcelain-crab", "Porcelain Crab", "xs", 1], [3, "comb-jelly", "Comb Jelly", "xs", 0, 1],
  [4, "lanternfish", "Lanternfish", "xs"], [4, "anglerfish", "Anglerfish", "m"], [4, "dumbo-octopus", "Dumbo Octopus", "m"], [4, "vampire-squid", "Vampire Squid", "m"], [4, "gulper-eel", "Gulper Eel", "m"],
  [4, "giant-isopod", "Giant Isopod", "m", 1], [4, "barreleye", "Barreleye", "s"], [4, "dragonfish", "Dragonfish", "m"], [4, "yeti-crab", "Yeti Crab", "s", 1], [4, "firefly-squid", "Firefly Squid", "xs"],
  [5, "beluga", "Beluga Whale", "xl"], [5, "narwhal", "Narwhal", "xl"], [5, "penguin", "Penguin", "m"], [5, "harp-seal", "Harp Seal", "l"], [5, "walrus", "Walrus", "xl"],
  [5, "ice-crab", "Ice Crab", "s", 1], [5, "sea-angel", "Sea Angel", "xs", 0, 1], [5, "icefish", "Icefish", "m"], [5, "orca", "Orca", "xl"], [5, "snow-octopus", "Snow Octopus", "m"]];
export const AQ = C0.map(([t, k, n, sz, fl, bob]) => ({ t, k, n, sz, fl: !!fl, bob: !!bob }));
const AQBY = {}; AQ.forEach(c => { AQBY[c.k] = c; });
export const aqImg = (c, big) => K + "aq/" + c.k + (big || SZ[c.sz] >= 18 ? "" : "-sm") + ".webp";
const owned = st => ((st && st.kd) || {}).aq || {};
const inTank = (st, t) => AQ.filter(c => c.t === t && owned(st)[c.k]);
const iceOpen = st => weeksIn(st) >= 12;

function hash01(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } h ^= h >>> 15; h = Math.imul(h, 2246822507); h ^= h >>> 13; return (h >>> 0) / 4294967296; }

/* every dive catches one creature: from the first 5 tanks (the Ice Cave dive, later, catches the Ice tank). New ones come first (75%). */
// Nov 15: the dive now SHOWS the creature (it swims past and the student swims into it), so picking and keeping are split
export function catchCreature(k, ice) { return keepCreature(k, pickCreature(k, ice)); }
export function pickCreature(k, ice) {
  const pool = AQ.filter(c => ice ? c.t === 5 : c.t < 5), have = k.aq || {}, fresh = pool.filter(c => !have[c.k]);
  const list = fresh.length && Math.random() < 0.75 ? fresh : pool;
  const weight = c => c.k === "narwhal" ? 0.25 : SZ[c.sz] >= 24 ? 0.6 : 1;   // the big ones (and the narwhal) are rarer
  let r = Math.random() * list.reduce((a, c) => a + weight(c), 0), pick = list[0];
  for (const c of list) { r -= weight(c); if (r <= 0) { pick = c; break; } }
  return pick;
}
export function keepCreature(k, pick) {
  const have = k.aq || {}, isNew = !have[pick.k];
  k.aq = Object.assign({}, have, { [pick.k]: (Number(have[pick.k]) || 0) + 1 });
  if (isNew) k.wn = (Number(k.wn) || 0) + 1; else k.p = (Number(k.p) || 0) + 3;   // a repeat = +3 pearls
  return { c: pick, isNew };
}
export function catchCard(res) {
  const c = res.c;
  return '<div class="kq-catch"><img src="' + aqImg(c, true) + '" alt=""></div><h2>' + (res.isNew ? "\u{1F31F} NEW! " : "") + "You caught a " + esc(c.n) + "!</h2>" +
    "<p>" + (res.isNew ? "It swims in your <b>" + TANKS[c.t][1] + "</b> tank in the Royal Aquarium." : "You already have one, so here are <b>+3 pearls</b> instead.") + "</p>";
}

/* ----- the bridge to kingdom.js (set by bind) ----- */
let A = null;   // { C(), save(k, extra), rer(), kdOf(st, cls), wk(cls), panel }
export function bind(api) { A = api; }
const cur = () => { const C = A && A.C(); return C && C.st ? { C, st: C.st, cls: C.cls, k: A.kdOf(C.st, C.cls) } : null; };

/* ----- guide ducks ----- */
const GUIDE = {
  city: { duck: "city", name: "Explorer Duck", hi: "Welcome back to the Sunken City, explorer!",
    how: "Welcome to the <b>Sunken City</b>! Long ago the Kingdom\u2019s <b>Lost Crown</b> broke into <b>5 relic pieces</b>, hidden in these ruins. Every week you reach the Kingdom you can <b>search the ruins for one piece</b>. Find all 5 to rebuild the Lost Crown and wear it! Then visit the <b>Whale Song Hall</b> next door." },
  whale: { duck: "whale", name: "Song Duck", hi: "The whale is ready to sing!",
    how: "Welcome to the <b>Whale Song Hall</b>! Our whale sings a song on the <b>4 shells</b>. <b>Listen</b>, then tap the shells in the <b>same order</b>. Every round the song gets one note longer. Each round you get right = <b>+5 pearls</b> (2 songs a week pay pearls)." },
  ice: { duck: "pearl", name: "Pearl Diver Duck", hi: "Brrr! Ready for another Ice Cave dive?",
    how: "Brrr! Welcome to the <b>Ice Cave</b>! The <b>rarest sea creatures</b> in the Kingdom live down here. You get <b>2 Ice Cave dives a week</b> (on top of your Pearl Dives). Grab the pearls, dodge the jellyfish, and swim into the creature that goes by to add it to your <b>Ice Cave tank</b>!" },
  arena: { duck: "volcano", name: "Arena Duck", hi: "Welcome back to the Undersea Arena!",
    how: "Welcome to the <b>Undersea Arena</b>! Every week a new <b>sea boss</b> comes to the Volcano Vents. Pick <b>3 of your creatures</b> and battle it! Hit it with the types it\u2019s <b>weak to</b> for double damage. Win for <b>100 pearls</b> and that boss\u2019s <b>badge</b>. You can try as many times as you like!" },
  town: { duck: "salon", name: "Salon Duck", hi: "Welcome to Coral Town!",
    how: "Welcome to <b>Coral Town</b>! Bake a sea treat at the <b>Bubble Bakery</b> once a week (up to 30 pearls), or visit my <b>Mermaid Salon</b> for fancy undersea outfits!" },
  bakery: { duck: "", img: K + "town/baker.webp", name: "Baker Crab", hi: "Welcome to the Bubble Bakery!",
    how: "Welcome to the <b>Bubble Bakery</b>! Every week there\u2019s a <b>new recipe</b>. Add the ingredients in order, stir fast, and take it out of the oven at just the right time. More stars = more pearls!" },
  salon: { duck: "salon", name: "Salon Duck", hi: "Welcome back, darling!",
    how: "Welcome to the <b>Mermaid Salon</b>! Tap <b>Try</b> to see an outfit on your companion in the mirror. Buy it with pearls and it\u2019s yours forever. Wear it any time from <b>Gear</b>!" },
  beach: { duck: "sand", name: "Sandcastle Duck", hi: "Welcome back to Seashell Beach!",
    how: "Welcome to <b>Seashell Beach</b>! Let\u2019s build a sandcastle! Every week you reach the Kingdom you <b>pick one new piece</b> and it pops right into its spot. There are 10 pieces. Want more? Extra pieces cost 100 pearls. You can see your classmates\u2019 castles too!" },
  lagoon: { duck: "hatchery", name: "Hatchery Duck", hi: "Welcome back to the Royal Hatchery!",
    how: "Welcome to the <b>Royal Hatchery</b>! Every week you reach the Kingdom you get a <b>free baby axolotl egg</b>. It rests in the nest and <b>hatches 2 minutes later</b>. Every egg is a <b>new color</b> (there are 20!), and babies grow up after 2 more Kingdom weeks. Want more? I sell extra eggs for 150 pearls." },
  ship: { duck: "ship", name: "Deckhand Duck", hi: "Ahoy! Welcome back to the Sunken Ship!",
    how: "Ahoy! This is the <b>Sunken Ship</b>. It has <b>8 dark rooms</b>, and <b>one new room opens every week</b> you reach the Kingdom. Explore it with a <b>flashlight</b> to find what’s hiding inside (+20 pearls). Find all 8 for the <b>Captain’s Treasure</b>!" },
  stable: { duck: "seahorse", name: "Stable Duck", hi: "Welcome back to the Seahorse Stable!",
    how: "Welcome to the <b>Seahorse Stable</b>! Pick a seahorse and give it a name. <b>Feed it once a week</b> and it gets faster. You get <b>2 races a week</b> on the reef against your classmates’ seahorses. Tap fast to win pearls!" },
  aquarium: { duck: "aquarium", name: "Keeper Duck", hi: "Welcome back to the Royal Aquarium! Tap a tank to see your creatures.",
    how: "Hi, I’m the <b>Aquarium Keeper</b>! Every <b>Pearl Dive</b> catches you a sea creature, and I bring it here. There are <b>60</b> to find in 6 tanks. Tap a tank to watch yours swim. Fill a whole tank for <b>+50 pearls</b>!" },
  dive: { duck: "pearl", name: "Pearl Diver Duck", hi: "Ready to dive? Watch for the sea creature that swims by!",
    how: "I’m the <b>Pearl Diver</b>! Swim anywhere and grab ⚪ pearls (\u{1F7E1} golden = 5). Jellyfish make you drop 3. You get <b>3 dives a week</b>. On every dive a <b>sea creature swims by</b> in a glowing bubble. Swim into it to catch it for the Royal Aquarium!" },
  dock: { duck: "paint", name: "Paint Duck", hi: "Back for a new look? Pick a paint job or a bubble trail!",
    how: "Welcome to the <b>Sub Paint Dock</b>! Buy a <b>paint job</b> with pearls, then mix the colors and roll it on your submarine. You can also buy a <b>bubble trail</b>. Your sub shows on your Kingdom bar and on every trip!" },
  statue: { duck: "", img: K + "captain-cheer.webp", name: "Captain Duck", hi: "Your statue is the shiniest one in the whole Kingdom!",
    how: "You are a <b>Kingdom Legend</b>! To celebrate, the Queen had a <b>golden statue of your companion</b> made for the castle garden. Everyone who visits can see it! Seaweed and sand get on it every week, so <b>polish it once a week</b> (rub the dirty spots) for <b>+20 pearls</b>." },
  garden: { duck: "", img: K + "captain-point.webp", name: "Captain Duck", hi: "Your corals look thirsty! Water each one once a week.",
    how: "This is the <b>Coral Garden</b>! Plant your 3 corals, then <b>water each one once a week</b> and it grows a little. After 3 waterings it’s in <b>full bloom</b>, and you get <b>+25 pearls</b>!" } };
const duckSrc = (g, pose) => g.img || K + "duck/" + g.duck + "-" + pose + ".webp";
export function guide(area, st, pose, line) {
  const g = GUIDE[area], seen = (((st && st.kd) || {}).seen || {})[area];
  const p = seen ? (pose || "welcome") : "explain";
  return '<div class="kq-guide' + (seen ? "" : " first") + '"><img class="kq-duck" src="' + duckSrc(g, p) + '" alt="' + esc(g.name) + '">' +
    '<div class="kq-bub"><b>' + esc(g.name) + ":</b> " + (seen ? (line || g.hi) : g.how) + (seen ? "" : ' <button class="btn gold" data-kd2="seen:' + area + '">Got it! \u{1F44D}</button>') + "</div></div>";
}
function visit(place) {   // remember a place was visited this week (for the quests); saves only the first time each week
  const o = cur(); if (!o || o.C.preview) return; const k = o.k; k.vq = k.vq || {}; if (k.vq[place]) return;
  k.vq = Object.assign({}, k.vq, { [place]: 1 }); A.save(k);
}

/* ===================== 👑 Queen's Quests ===================== */
const QUESTS = [
  { k: "dive1", t: "Go on a Pearl Dive", ok: k => (Number(k.dv) || 0) >= 1 },
  { k: "dive3", t: "Use all 3 Pearl Dives", ok: k => (Number(k.dv) || 0) >= 3 },
  { k: "dive25", t: "Grab 25 pearls in one dive", ok: k => (Number(k.wb) || 0) >= 25 },
  { k: "newfish", t: "Catch a NEW sea creature", ok: k => (Number(k.wn) || 0) >= 1 },
  { k: "water", t: "Water all 3 of your corals", ok: (k, wk) => !!(k.cg && [0, 1, 2].every(i => k.cg.w[i] === wk || k.cg.s[i] >= 4)) },
  { k: "aquarium", t: "Visit the Royal Aquarium", ok: k => !!(k.vq && k.vq.aquarium) },
  { k: "dock", t: "Visit the Sub Paint Dock", ok: k => !!(k.vq && k.vq.dock) },
  { k: "grotto", t: "Look at your Treasure Grotto", ok: k => !!(k.vq && k.vq.grotto) },
  { k: "spend", t: "Spend pearls in a shop", ok: k => (Number(k.ws) || 0) > 0 }];
const Q_PAY = 15;
export function questsFor(wk) { return QUESTS.map(q => ({ q, r: hash01("quest|" + wk + "|" + q.k) })).sort((a, b) => a.r - b.r).slice(0, 3).map(x => x.q); }
export function questsWaiting(k, wk) { const d = k.qd || {}; return questsFor(wk).filter(q => !d[q.k] && q.ok(k, wk)).length + (questsFor(wk).every(q => d[q.k]) && !k.qx ? 1 : 0); }
export function questsHTML(st, cls) {
  const o = cur(); if (!o) return ""; const k = o.k, wk = A.wk(cls), list = questsFor(wk), d = k.qd || {}, all = list.every(q => d[q.k]);
  return '<div class="kq-quests"><div class="kq-scroll" style="background-image:url(' + K + 'quest-scroll.webp)"><h3>\u{1F4DC} Queen’s Quests</h3><p class="kq-sub">3 new quests every week</p>' +
    list.map(q => { const got = d[q.k], ok = q.ok(k, wk);
      return '<div class="kq-q' + (got ? " got" : ok ? " ready" : "") + '"><span>' + (got ? "✅" : ok ? "\u{1F31F}" : "⬜") + "</span><b>" + esc(q.t) + "</b>" +
        (got ? "<em>+" + Q_PAY + " ⚪</em>" : ok ? '<button class="btn small gold" data-kd2="quest:' + q.k + '">Claim +' + Q_PAY + " ⚪</button>" : "<em>+" + Q_PAY + " ⚪</em>") + "</div>"; }).join("") +
    '<div class="kq-chestrow">' + (k.qx ? '<img src="' + K + 'quest-chest-open.webp" alt=""><b>Royal Chest opened: +' + k.qx + " pearls!</b>"
      : '<img src="' + K + 'quest-chest-closed.webp" alt="">' + (all ? '<button class="btn gold" data-kd2="chest">\u{1F381} Open the Royal Chest!</button>' : "<b>Finish all 3 to open the Royal Chest!</b>")) + "</div></div></div>";
}
function claimQuest(key) {
  const o = cur(); if (!o) return; const k = o.k, wk = A.wk(o.cls), q = questsFor(wk).find(x => x.k === key); if (!q || (k.qd || {})[key] || !q.ok(k, wk)) return;
  k.qd = Object.assign({}, k.qd || {}, { [key]: 1 }); k.p = (Number(k.p) || 0) + Q_PAY; A.save(k);
}
async function openChest() {
  const o = cur(); if (!o) return; const k = o.k, wk = A.wk(o.cls); if (k.qx || !questsFor(wk).every(q => (k.qd || {})[q.k])) return;
  const pay = 30 + Math.floor(hash01("chest|" + wk + "|" + (o.st.id || "")) * 5) * 5;   // 30–50
  const r = document.createElement("div"); r.className = "kq-chestover"; r.innerHTML = '<img class="kq-ch" src="' + K + 'quest-chest-closed.webp" alt=""><div class="kq-flash"></div>';
  document.body.appendChild(r); await new Promise(z => setTimeout(z, 2500));
  r.classList.add("flash"); await new Promise(z => setTimeout(z, 350));
  r.innerHTML = '<div class="kq-glow"></div><img class="kq-ch open" src="' + K + 'quest-chest-open.webp" alt="">' + Array.from({ length: 16 }, (_, i) => '<img class="kq-pearl" src="' + K + (i % 4 ? "pearl" : "pearl-gold") + '.webp" style="--a:' + (i * 22.5) + 'deg;--d:' + (i % 3) * 0.1 + 's" alt="">').join("") +
    '<div class="kq-chesttext"><h2>+' + pay + " pearls!</h2><p>Queen Bubbles is so proud of you!</p><button class=\"btn gold\" data-kq-done=\"1\">Yay! \u{1F389}</button></div>";
  k.qx = pay; k.p = (Number(k.p) || 0) + pay; A.save(k);
  r.addEventListener("click", ev => { if (ev.target.closest("[data-kq-done]")) { r.remove(); A.rer(); } });
}

/* ===================== 🐠 Royal Aquarium ===================== */
let aqSide = 0, aqTank = -1;
const HALL_X = [26, 50, 74];
export function aquariumHTML(st, cls) {
  visit("aquarium"); setTimeout(aqKick, 30);
  if (aqTank >= 0) return tankHTML(st, cls, aqTank);
  const today = A.wk(cls) + (new Date().getDate()), have = owned(st), tot = Object.keys(have).filter(x => AQBY[x]).length;
  let h = '<div class="kdscene kq-hall" style="background-image:url(' + K + 'hall/aquarium-hall.webp)">';
  [0, 1, 2].forEach(i => {
    const t = aqSide * 3 + i, mine = inTank(st, t), locked = t === 5 && !iceOpen(st);
    const show = mine.map(c => ({ c, r: hash01("hall|" + today + "|" + c.k) })).sort((a, b) => a.r - b.r).slice(0, 3).map(x => x.c);
    h += '<button class="kq-halltank" style="left:' + HALL_X[i] + '%" data-kd2="tank:' + t + '"' + (locked ? " disabled" : "") + ">" +
      '<div class="kq-aqbox hall">' + show.map(c => swimEl(c, 20, true)).join("") + "</div>" +
      "<span>" + (locked ? "\u{1F512} " : "") + TANKS[t][1] + " <b>" + mine.length + "/10</b></span></button>";
  });
  h += '<button class="kq-arrow l" data-kd2="side">◀</button><button class="kq-arrow r" data-kd2="side">▶</button>' + guide("aquarium", st) + "</div>" +
    '<div class="row" style="margin-top:8px;gap:10px;align-items:center;flex-wrap:wrap;"><b>\u{1F420} ' + tot + " / 60 sea creatures</b><span class=\"small muted\">Tanks " + (aqSide ? "4–6" : "1–3") + " of 6 · ◀ ▶ for the others · every Pearl Dive catches one</span></div>";
  return h;
}
/* ----- swimming (Nov 15, her ask: "less robotic"): each creature wanders to new spots at its own speed, speeds up and
   slows down, tilts up and down, turns around smoothly, and sometimes rests. Bottom dwellers creep along the sand and stop;
   jellies pulse up and sink back down; the two whales glide slowly and can leave the edges. Drawn with requestAnimationFrame. */
function swimEl(c, w, small) {
  return '<div class="kq-swim" data-k="' + c.k + '" data-sz="' + c.sz + '" data-m="' + (c.fl ? "floor" : c.bob ? "jelly" : c.sz === "xxl" ? "big" : "swim") + '" style="width:' + (small ? Math.max(14, w * 1.9) : w) +
    '%;left:-40%;top:50%"><img src="' + aqImg(c, !small) + '" alt="' + esc(c.n) + '" title="' + esc(c.n) + '"></div>';
}
let aqRAF = 0, aqLast = 0;
const aqS = new WeakMap();
const rnd = (a, b) => a + Math.random() * (b - a);
/* Nov 15, round 3 (her note: "should stay still or move around each other to play and try not to block each other"):
   • every creature has its own depth lane and starts in its own spot, so they spread out through the tank
   • most of the time they rest or hover in place (tiny drifts, fins moving, sometimes looking the other way)
   • sometimes they cruise to a new spot, and sometimes two of them play: one swims loops around a buddy
   • they keep their space: when two get close they ease apart, so nobody sits on top of anybody */
function aqInit(box, els) {
  const hall = box.classList.contains("hall"), sw = els.filter(e => e.dataset.m === "swim" || e.dataset.m === "big"), n = sw.length;
  els.forEach(e => {
    const m = e.dataset.m, sz = e.dataset.sz, w = parseFloat(e.style.width) || 10;
    const sp = ({ xs: 10, s: 9, m: 7.5, l: 5.5, xl: 4.2, xxl: 3 }[sz] || 7) * (hall ? 1.3 : 1);
    let lane, yr;
    if (m === "floor") { yr = hall ? [80, 83] : [85, 90]; lane = rnd(yr[0], yr[1]); }
    else if (m === "jelly") { yr = [20, 60]; lane = rnd(26, 50); }
    else { yr = [14, hall ? 70 : 76]; const i = sw.indexOf(e); lane = yr[0] + 4 + (yr[1] - yr[0] - 8) * ((i + 0.5) / Math.max(1, n)) + rnd(-3, 3); }
    const i = els.indexOf(e), x0 = 8 + 84 * ((i * 0.618034) % 1);   // spread out across the tank from the start
    aqS.set(e, { m, sp, w, yr, lane, x: x0, y: m === "floor" ? lane : lane + rnd(-4, 4), vx: 0, vy: 0, face: Math.random() < 0.5 ? 1 : -1, sx: 1, tilt: 0,
      ph: Math.random() * 6, mode: "rest", tt: rnd(0.5, 4), tx: x0, ty: lane, buddy: null, ang: 0 });
    const s = aqS.get(e); s.sx = s.face;
  });
}
function aqDecide(s, mates) {
  const r = Math.random();
  if (s.m === "big") { s.mode = "go"; s.tx = s.x < 50 ? rnd(100, 125) : rnd(-25, 0); s.ty = rnd(s.yr[0] + 4, s.yr[1] - 10); s.tt = 30; return; }
  if (s.m === "floor") {
    if (r < 0.7) { s.mode = "rest"; s.tt = rnd(3, 8); }
    else { s.mode = "go"; s.tx = Math.max(6, Math.min(94, s.x + rnd(-22, 22))); s.ty = s.lane; s.tt = rnd(4, 8); }
    return;
  }
  const pals = mates.filter(o => o !== s && o.m === "swim");
  if (r < 0.45) { s.mode = "rest"; s.tt = rnd(2.5, 7); s.tx = s.x; s.ty = s.y; }                         // hover in place
  else if (r < 0.62 && pals.length) { s.mode = "play"; s.buddy = pals[Math.floor(Math.random() * pals.length)]; s.ang = Math.random() * 6.28; s.tt = rnd(4, 7); }  // swim loops around a buddy
  else { s.mode = "go"; s.tx = rnd(6, 94); if (Math.abs(s.tx - s.x) < 14) s.tx = s.x > 50 ? s.x - rnd(14, 30) : s.x + rnd(14, 30);
    s.ty = Math.max(s.yr[0], Math.min(s.yr[1], s.lane + rnd(-9, 9))); s.tt = rnd(4, 9); s.boost = Math.random() < 0.2 ? 1.8 : 1; }
}
function aqStep(e, s, dt, mates) {
  s.ph += dt; s.tt -= dt;
  const img = e.firstChild;
  if (s.m === "jelly") {   // pulse up, then sink slowly, drifting a little sideways (and away from others)
    const cyc = (s.ph % 3.6) / 3.6, push = cyc < 0.25 ? Math.sin(cyc / 0.25 * Math.PI) : 0;
    s.y += (-push * 8 + (cyc >= 0.25 ? 1.4 : 0)) * dt; s.x += (Math.sin(s.ph * 0.2) * 1 + s.vx) * dt; s.vx *= 0.95;
    s.y = Math.max(s.yr[0], Math.min(s.yr[1], s.y)); s.x = Math.max(6, Math.min(94, s.x));
    const sq = cyc < 0.25 ? 1 - 0.16 * push : 1 + 0.05 * Math.sin((cyc - 0.25) / 0.75 * Math.PI);
    e.style.left = s.x + "%"; e.style.top = s.y + "%"; img.style.transform = "scale(" + (2 - sq).toFixed(3) + "," + sq.toFixed(3) + ")"; return;
  }
  if (s.tt <= 0) aqDecide(s, mates);
  let wx = 0, wy = 0, want = 0;
  if (s.mode === "play" && s.buddy) {           // circle the buddy at a polite distance
    s.ang += dt * 0.9; const rr = (s.w + s.buddy.w) * 0.55;
    s.tx = s.buddy.x + Math.cos(s.ang) * rr; s.ty = Math.max(s.yr[0], Math.min(s.yr[1], s.buddy.y + Math.sin(s.ang) * rr * 0.9));
  }
  if (s.mode === "rest") { s.tx += Math.sin(s.ph * 0.5) * 0.4 * dt; s.ty += Math.cos(s.ph * 0.4) * 0.3 * dt;   // tiny hovering drift
    if (Math.random() < dt * 0.08 && s.m !== "floor") s.face = -s.face; }                                       // look around now and then
  const dx = s.tx - s.x, dy = s.ty - s.y, d = Math.hypot(dx, dy * 1.4);
  want = s.mode === "rest" ? Math.min(1.2, d * 0.8) : s.sp * (s.boost || 1) * Math.min(1, 0.35 + d / 18);
  if (d > 0.2) { wx = dx / d * want; wy = s.m === "floor" ? 0 : dy / d * want * 0.75; }
  if (s.boost > 1) s.boost = Math.max(1, s.boost - dt * 0.5);
  // keep your space: ease away from anyone too close (big whales push, they don't get pushed)
  mates.forEach(o => {   // whales only make room for each other
    if (o === s || (s.m === "big" && o.m !== "big")) return;
    const ox = s.x - o.x, oy = (s.y - o.y) * 0.62, dd = Math.hypot(ox, oy) || 0.01, need = (s.w + o.w) * 0.5;
    if (dd < need) { const f = (need - dd) / need * (o.m === "big" ? 10 : 6); wx += ox / dd * f * 2; if (s.m !== "floor") wy += oy / dd * f * 1.4;
      if (s.mode === "rest") { s.tx = s.x + ox / dd * 4; s.ty = Math.max(s.yr[0], Math.min(s.yr[1], s.y + (s.m === "floor" ? 0 : oy / dd * 3))); } }
  });
  const k = s.m === "big" ? 0.4 : 1.4; s.vx += (wx - s.vx) * Math.min(1, k * dt); s.vy += (wy - s.vy) * Math.min(1, k * dt);
  s.x += s.vx * dt; s.y += s.vy * dt;
  if (s.m === "big") { if (s.x > 128 || s.x < -28) { s.x = Math.max(-28, Math.min(128, s.x)); aqDecide(s, mates); } }
  else s.x = Math.max(4, Math.min(96, s.x));
  s.y = Math.max(s.yr[0] - 2, Math.min(s.yr[1] + 1, s.y));
  if (Math.abs(s.vx) > 1.2) s.face = s.vx > 0 ? 1 : -1;
  s.sx += (s.face - s.sx) * Math.min(1, dt * (s.m === "big" ? 1.2 : 3.5));          // a smooth turn, not a flip
  const sx = Math.abs(s.sx) < 0.12 ? 0.12 * (s.sx < 0 ? -1 : 1) : s.sx;
  const tiltTo = s.m === "floor" ? 0 : Math.max(-18, Math.min(18, Math.atan2(s.vy, Math.abs(s.vx) + 2.5) * 57)) * (s.face);
  s.tilt += (tiltTo - s.tilt) * Math.min(1, dt * 2.5);
  const sp = Math.hypot(s.vx, s.vy), wig = s.m === "floor" ? (sp > 0.4 ? Math.sin(s.ph * 8) * 1.2 : 0) : Math.sin(s.ph * (3 + sp * 0.5)) * (0.8 + sp * 0.18);
  const bob = s.m === "floor" ? 0 : Math.sin(s.ph * 1.1) * 0.5;
  e.style.left = s.x + "%"; e.style.top = (s.y + bob) + "%"; e.style.zIndex = Math.round(s.y);
  img.style.transform = "scaleX(" + sx.toFixed(3) + ") rotate(" + (s.tilt + wig).toFixed(2) + "deg)";
}
function aqLoop(t) {
  const boxes = document.querySelectorAll(".kq-aqbox"); if (!boxes.length) { aqRAF = 0; return; }
  const dt = Math.min(0.05, aqLast ? (t - aqLast) / 1000 : 0.016); aqLast = t;
  boxes.forEach(box => {
    const els = [...box.querySelectorAll(".kq-swim")]; if (!els.length) return;
    if (!aqS.get(els[0])) aqInit(box, els);
    const mates = els.map(e => aqS.get(e));
    els.forEach((e, i) => aqStep(e, mates[i], dt, mates));
  });
  aqRAF = requestAnimationFrame(aqLoop);
}
export function aqKick() { if (typeof requestAnimationFrame === "undefined" || aqRAF) return; aqLast = 0; aqRAF = requestAnimationFrame(aqLoop); }
function tankHTML(st, cls, t) {
  const k = cur() ? cur().k : {}, all = AQ.filter(c => c.t === t), mine = all.filter(c => owned(st)[c.k]), full = mine.length === all.length, paid = (k.aqf || {})[t];
  let h = '<div class="kdscene kq-tank" style="background-image:url(' + K + "tank/tank-" + TANKS[t][0] + '.webp)">';
  h += '<div class="kq-aqbox">' + mine.map(c => swimEl(c, SZ[c.sz], false)).join("") + "</div>";
  if (!mine.length) h += '<div class="kq-empty">No ' + TANKS[t][1] + " creatures yet. Go on a <b>Pearl Dive</b> to catch one!</div>";
  h += '<button class="btn small kq-back" data-kd2="hall">← Back to the hall</button><b class="kq-tankname">' + TANKS[t][1] + " · " + mine.length + "/10</b></div>";
  h += '<div class="kq-strip">' + all.map(c => owned(st)[c.k] ? '<div class="kq-slot got"><img src="' + aqImg(c) + '" alt=""><small>' + esc(c.n) + "</small></div>"
    : '<div class="kq-slot"><img src="' + aqImg(c) + '" alt="" class="sil"><small>???</small></div>').join("") + "</div>";
  h += '<div class="row" style="margin-top:8px;gap:8px;align-items:center;">' + (full ? (paid ? '<span class="small">\u{1F3C6} Full tank! You got the +50 pearls.</span>' : '<button class="btn gold" data-kd2="full:' + t + '">\u{1F3C6} Full tank! Get +50 pearls</button>')
    : '<span class="small muted">Find all 10 for +50 pearls. ' + (t === 5 ? "Ice Cave creatures come from the Ice Cave dive (Royal rank)." : "They come from Pearl Dives.") + "</span>") + "</div>";
  return h;
}
function claimFull(t) {
  const o = cur(); if (!o) return; const k = o.k, all = AQ.filter(c => c.t === t);
  if ((k.aqf || {})[t] || !all.every(c => (k.aq || {})[c.k])) return;
  k.aqf = Object.assign({}, k.aqf || {}, { [t]: 1 }); k.p = (Number(k.p) || 0) + 50; A.save(k);
}

/* ===================== 🌸 Coral Garden ===================== */
const CORALS = [["pink", "Pink Coral"], ["blue", "Blue Coral"], ["gold", "Gold Coral"]], BED_X = [23, 50, 77];
/* Nov 15 (her note): the corals now sit IN the three sand plots, and watering is hands-on: tap "Water", a watering can
   appears, the student moves it over the coral and it tips and sprinkles water until the coral grows. */
let canFor = -1, canAt = null, pour = 0, pourLast = 0;
export function gardenHTML(st, cls) {
  visit("garden");
  const o = cur(), k = o ? o.k : {}, wk = A.wk(cls), cg = k.cg;
  let h = '<div class="kdscene kq-garden' + (cg && canFor >= 0 ? " watering" : "") + '" style="background-image:url(' + K + 'garden/garden-bg.webp)">';
  if (rankOf(st).n >= 18) h += '<button class="kq-gstatue" data-kd="go:statue" title="Your Legend statue">' + statueFig(st, (k.lg || {}).u ? "" : " covered") + "</button>";
  if (!cg) h += '<button class="btn gold big kq-plant" data-kd2="plant">\u{1F331} Plant my 3 corals!</button>';
  else CORALS.forEach(([c, n], i) => {
    const s = cg.s[i], did = cg.w[i] === wk;
    h += '<div class="kq-bed' + (canFor === i ? " target" : "") + '" data-bed="' + i + '" style="left:' + BED_X[i] + '%"><img class="kq-coral cs' + s + (o && o.C.justWatered === i ? " grow" : "") + '" src="' + K + "garden/coral-" + c + "-" + s + '.webp" alt="' + n + '"></div>' +
      '<div class="kq-bedui" style="left:' + BED_X[i] + '%">' + (s >= 4 ? '<span class="kq-tag bloom">\u{1F338} Full bloom!</span>' : did ? '<span class="kq-tag">✅ Watered this week</span>' : canFor === i ? '<span class="kq-tag">\u{1F4A7} Watering…</span>' : '<button class="btn small gold kq-water" data-kd2="water:' + i + '">\u{1F4A7} Water</button>') + "</div>";
  });
  if (cg && canFor >= 0) h += '<div class="kq-canhint"><span>Move the watering can over the <b>' + CORALS[canFor][1] + '</b>!</span><button class="btn small ghost" data-kd2="cancan:1">Stop</button></div>' +
    '<div class="kq-can" id="kqcan" style="left:' + (canAt ? canAt[0] : BED_X[canFor] + (canFor === 2 ? -14 : 14)) + "%;top:" + (canAt ? canAt[1] : 72) + '%"><div class="kq-canbody"><img src="' + K + 'garden/watering-can.webp" alt="Watering can"><i class="kq-tip"></i></div><div class="kq-pourbar"><i></i></div></div>';
  const gl = !cg ? "" : cg.s.every(x => x >= 4) ? "Your whole garden is in full bloom! Beautiful work!" : [0, 1, 2].every(i => cg.w[i] === wk || cg.s[i] >= 4) ? "All watered! Come back next week to water them again." : "";
  h += guide("garden", st, null, gl || null) + "</div>";
  if (cg) h += '<div class="row kq-gnote" style="margin-top:8px;gap:10px;flex-wrap:wrap;"><span class="small">' + CORALS.map(([c, n], i) => n + ": stage " + cg.s[i] + "/4").join(" · ") + '</span><span class="small muted">Each watering grows one stage. Full bloom = +25 pearls.</span></div>';
  if (o) o.C.justWatered = null;
  return h;
}
function plant() { const o = cur(); if (!o || o.k.cg) return; o.k.cg = { s: [1, 1, 1], w: ["", "", ""], b: [0, 0, 0] }; A.save(o.k); }
// the watering can follows the finger / mouse; over the right coral it tips and sprinkles until the bar fills
if (typeof document !== "undefined") document.addEventListener("pointermove", ev => {
  const can = document.getElementById("kqcan"); if (!can || canFor < 0) return;
  const sc = can.closest(".kq-garden"), r = sc.getBoundingClientRect();
  const px = Math.max(4, Math.min(96, (ev.clientX - r.left) / r.width * 100)), py = Math.max(10, Math.min(92, (ev.clientY - r.top) / r.height * 100));
  // the can is held by its spout: move it so the spout sits right under the finger / mouse
  const t0 = can.querySelector(".kq-tip").getBoundingClientRect(), cx = parseFloat(can.style.left) || px, cy = parseFloat(can.style.top) || py;
  const offx = (t0.left - r.left) / r.width * 100 - cx, offy = (t0.top - r.top) / r.height * 100 - cy;
  canAt = [px - offx, py - offy]; can.style.left = canAt[0] + "%"; can.style.top = canAt[1] + "%";
  const cor = sc.querySelector('.kq-bed[data-bed="' + canFor + '"] .kq-coral'), b = cor.getBoundingClientRect(), tip = can.querySelector(".kq-tip").getBoundingClientRect();
  const over = tip.left > b.left - b.width * 0.2 && tip.left < b.right + b.width * 0.2 && tip.top < b.bottom - b.height * 0.2 && tip.top > b.top - r.height * 0.18;   // the spout has to be just above the coral
  can.classList.toggle("pour", over);
  if (!over) { pourLast = 0; return; }
  const now = performance.now(); if (pourLast) pour += Math.min(0.1, (now - pourLast) / 1000); pourLast = now;
  can.querySelector(".kq-pourbar i").style.width = Math.min(100, pour / 1.8 * 100) + "%";
  if (Math.random() < 0.7) for (let n = 0; n < 2; n++) {   // sprinkle
    const d = document.createElement("i"); d.className = "kq-drop";
    d.style.left = ((tip.left - r.left) / r.width * 100 + (Math.random() - 0.5) * 2.5) + "%"; d.style.top = ((tip.top - r.top) / r.height * 100) + "%";
    d.style.setProperty("--dx", ((Math.random() - 0.5) * 30).toFixed(0) + "px"); sc.appendChild(d); setTimeout(() => d.remove(), 700);
  }
  if (pour >= 1.8) { const i = canFor; canFor = -1; canAt = null; pour = 0; pourLast = 0; water(i); }
}, { passive: true });
function water(i) {
  const o = cur(); if (!o || !o.k.cg) return; const k = o.k, wk = A.wk(o.cls), cg = { s: k.cg.s.slice(), w: k.cg.w.slice(), b: (k.cg.b || [0, 0, 0]).slice() };
  if (cg.w[i] === wk || cg.s[i] >= 4) return;
  cg.s[i]++; cg.w[i] = wk; if (cg.s[i] >= 4 && !cg.b[i]) { cg.b[i] = 1; k.p = (Number(k.p) || 0) + 25; }
  k.cg = cg; o.C.justWatered = i; A.save(k);
}

/* ===================== 🎨 Sub Paint Dock ===================== */
// [key, name, price, the 3 mixing colors]
export const SUBS = [
  ["coral-pink", "Coral Pink", 0, ["pink", "hotpink", "gold"]], ["deep-blue", "Deep Ocean Blue", 100, ["blue", "navy", "white"]], ["seafoam", "Seafoam Green", 100, ["teal", "lime", "gold"]],
  ["sunset", "Sunset Orange", 100, ["orange", "hotpink", "yellow"]], ["lavender", "Lavender Dream", 100, ["lavender", "purple", "orange"]], ["midnight", "Midnight Navy", 100, ["navy", "teal", "yellow"]],
  ["ruby", "Ruby Red", 100, ["red", "gold", "yellow"]], ["chrome", "Chrome Silver", 100, ["gray", "white", "orange"]],
  ["bubble-dots", "Bubble Dots", 150, ["white", "pink", "sky"]], ["wavy", "Wavy Stripes", 150, ["blue", "white", "yellow"]], ["fish-scales", "Fish Scales", 150, ["teal", "sky", "gold"]],
  ["seashells", "Seashell Pattern", 150, ["white", "pink", "orange"]], ["starfish", "Starfish Spots", 150, ["sky", "orange", "yellow"]], ["coral-camo", "Coral Reef Camo", 150, ["hotpink", "purple", "orange"]],
  ["axolotl", "Axolotl", 200, ["pink", "hotpink", "white"]], ["clownfish", "Clownfish", 200, ["orange", "white", "black"]], ["shark", "Shark", 200, ["gray", "white", "red"]],
  ["pufferfish", "Pufferfish", 200, ["yellow", "brown", "gold"]], ["jellyfish", "Jellyfish", 200, ["purple", "pink", "lavender"]], ["orca", "Orca", 200, ["black", "white", "gold"]],
  ["deep-glow", "Glowing Deep Sea", 300, ["navy", "sky", "lime"]], ["mermaid", "Mermaid Scales", 300, ["pink", "teal", "purple"]], ["ice", "Frozen Ice Cave", 300, ["sky", "white", "lavender"]],
  ["golden", "Golden Royal Sub", 600, ["gold", "yellow", "white"]]].map(([k, n, c, cols]) => ({ k, n, c, cols }));
const SUBBY = {}; SUBS.forEach(s => { SUBBY[s.k] = s; });
export const TRAILS = [["bubbles", "Bubble Trail", 0], ["rainbow", "Rainbow Bubbles", 100], ["sparkle", "Sparkle Wake", 100], ["plankton", "Glowing Plankton", 150], ["hearts", "Heart Bubbles", 150]].map(([k, n, c]) => ({ k, n, c }));
const subOf = st => (((st && st.kd) || {}).sub) || {};
export const subKey = st => SUBBY[subOf(st).use] ? subOf(st).use : "coral-pink";
export const subSprite = st => "dock/" + subKey(st);                 // for kingdom.js sprite(): K + this + ".webp"
export const subImg = st => K + "dock/" + subKey(st) + ".webp";
export const trailKey = st => subOf(st).trail || "bubbles";
export function trailHTML(st) { const t = trailKey(st); return '<span class="kq-trail ' + t + '">' + "<i></i>".repeat(6) + "</span>"; }
let dockTab = "paint", dockSay = null;
export function dockHTML(st, cls) {
  visit("dock");
  const o = cur(), k = o ? o.k : {}, p = Number(k.p) || 0, s = subOf(st), own = s.own || {}, use = subKey(st), tOwn = s.trails || {};
  let h = '<div class="kdscene kq-dock" style="background-image:url(' + K + 'dock/dock-bg.webp)"><div class="kq-subshow">' + trailHTML(st) + '<img src="' + subImg(st) + '" alt="Your submarine"></div>' +
    guide("dock", st, dockSay && dockSay.mood === "happy" ? "cheer" : "welcome", dockSay ? dockSay.text : "") + "</div>";
  h += '<div class="kq-dockpanel"><div class="kdshoptop"><b>\u{1F3A8} Sub Paint Dock</b><span>⚪ ' + p + " pearls</span></div>" +
    '<div class="row" style="gap:6px;margin:6px 0;"><button class="btn small' + (dockTab === "paint" ? " gold" : " ghost") + '" data-kd2="dtab:paint">\u{1F3A8} Paint jobs</button><button class="btn small' + (dockTab === "trail" ? " gold" : " ghost") + '" data-kd2="dtab:trail">\u{1FAE7} Bubble trails</button></div>';
  if (dockTab === "paint") h += '<div class="kq-subgrid">' + SUBS.map(it => { const has = it.c === 0 || own[it.k], on = use === it.k;
    return '<div class="kq-subcard' + (on ? " on" : "") + '"><img src="' + K + "dock/" + it.k + '-sm.webp" alt=""><b>' + esc(it.n) + "</b>" +
      (on ? '<span class="kdown">✅ On your sub</span><button class="kq-mini" data-kd2="repaint:' + it.k + '" title="Paint it again for fun">\u{1F3A8}</button>'
        : has ? '<button class="btn small" data-kd2="use:' + it.k + '">Use</button>' : '<button class="btn small' + (p >= it.c ? " gold" : " ghost") + '" data-kd2="buy:' + it.k + '">⚪ ' + it.c + "</button>") + "</div>"; }).join("") + "</div>";
  else h += '<div class="kq-subgrid">' + TRAILS.map(it => { const has = it.c === 0 || tOwn[it.k], on = trailKey(st) === it.k;
    return '<div class="kq-subcard' + (on ? " on" : "") + '"><span class="kq-trailbox"><span class="kq-trail ' + it.k + '">' + "<i></i>".repeat(6) + "</span></span><b>" + esc(it.n) + "</b>" +
      (on ? '<span class="kdown">✅ On your sub</span>' : has ? '<button class="btn small" data-kd2="tuse:' + it.k + '">Use</button>' : '<button class="btn small' + (p >= it.c ? " gold" : " ghost") + '" data-kd2="tbuy:' + it.k + '">⚪ ' + it.c + "</button>") + "</div>"; }).join("") + "</div>";
  return h + "</div>";
}
function paintGame(it) {
  startPaint(null, { it: { name: it.n, img: K + "dock/" + it.k + ".webp", cols: it.cols }, bg: K + "dock/dock-bg.webp", chef: K + "duck/paint-painting.webp",
    title: "\u{1F3A8} Sub Paint Dock", thing: "submarine", done: "Your submarine is now", where: "It shows on your Kingdom bar and on every submarine trip.", cls: "kq-paintover" });
}
function buySub(key) {
  const o = cur(); if (!o) return; const it = SUBBY[key]; if (!it) return; const k = o.k, s = Object.assign({ own: {} }, k.sub || {}); if (s.own[key] || !it.c) return;
  const p = Number(k.p) || 0;
  if (p < it.c) { dockSay = { text: "You need <b>" + (it.c - p) + " more pearls</b> for " + esc(it.n) + ". Pearl Dives and Queen’s Quests help!" }; A.rer(); return; }
  if (typeof confirm === "function" && !confirm("Buy " + it.n + " for " + it.c + " pearls?")) return;
  s.own = Object.assign({}, s.own, { [key]: 1 }); s.use = key; k.sub = s; k.p = p - it.c; k.ws = (Number(k.ws) || 0) + it.c;
  dockSay = { mood: "happy", text: "Woohoo! Let’s paint your sub <b>" + esc(it.n) + "</b>!" + (o.C.preview ? " (Preview: nothing was saved.)" : "") }; A.save(k); paintGame(it);
}
function useSub(key) { const o = cur(); if (!o || !SUBBY[key]) return; const k = o.k, s = Object.assign({}, k.sub || {}); if (!(SUBBY[key].c === 0 || (s.own || {})[key])) return; s.use = key; k.sub = s; dockSay = { text: "Your sub is <b>" + esc(SUBBY[key].n) + "</b> again!" }; A.save(k); }
function buyTrail(key) {
  const o = cur(); if (!o) return; const it = TRAILS.find(x => x.k === key); if (!it) return; const k = o.k, s = Object.assign({}, k.sub || {}), tw = Object.assign({}, s.trails || {}); if (tw[key] || !it.c) return;
  const p = Number(k.p) || 0;
  if (p < it.c) { dockSay = { text: "You need <b>" + (it.c - p) + " more pearls</b> for the " + esc(it.n) + "." }; A.rer(); return; }
  if (typeof confirm === "function" && !confirm("Buy the " + it.n + " for " + it.c + " pearls?")) return;
  tw[key] = 1; s.trails = tw; s.trail = key; k.sub = s; k.p = p - it.c; k.ws = (Number(k.ws) || 0) + it.c; dockSay = { mood: "happy", text: "Ooh, the <b>" + esc(it.n) + "</b> looks amazing!" }; A.save(k);
}
function useTrail(key) { const o = cur(); if (!o) return; const it = TRAILS.find(x => x.k === key); if (!it) return; const k = o.k, s = Object.assign({}, k.sub || {}); if (!(it.c === 0 || (s.trails || {})[key])) return; s.trail = key; k.sub = s; A.save(k); }

/* ----- the new map (part 2): places open by rank ----- */
const SPOTS = [
  ["throne", "\u{1F451} Throne Room", 50, 15, 1], ["grotto", "\u{1F9F0} Treasure Grotto", 63, 33, 1], ["aquarium", "\u{1F420} Royal Aquarium", 37, 34, 1],
  ["garden", "\u{1F338} Coral Garden", 54, 50, 1], ["dive", "\u{1FAE7} Pearl Caves", 24, 58, 1], ["shop", "\u{1F41A} Pearl Shop", 74, 61, 1], ["dock", "\u{1F3A8} Sub Paint Dock", 44, 80, 1],
  ["stable", "\u{1F40E} Seahorse Stable", 9, 40, 2], ["ship", "⚓ Sunken Ship", 86, 44, 3], ["lagoon", "\u{1F319} Royal Hatchery", 84, 14, 4], ["beach", "\u{1F3D6}️ Seashell Beach", 18, 84, 6],
  ["town", "\u{1F3D8}️ Coral Town", 66, 88, 8], ["arena", "\u{1F30B} Undersea Arena", 88, 74, 10], ["ice", "❄️ Ice Cave", 13, 13, 12], ["city", "\u{1F3DB}️ Sunken City", 31, 73, 15], ["statue", "\u{1F5FF} Legend Statue", 50, 67, 18]];
export function map2HTML(st, cls, k, badges) {
  const n = rankOf(st).n;
  return '<div class="kdscene kq-map" style="background-image:url(' + K + 'kd-map-big.webp)">' + SPOTS.map(([v, label, x, y, need]) => {
    const open = n >= need, b = badges[v] || 0;
    return open ? '<button class="kq-spot" style="left:' + x + "%;top:" + y + '%" data-kd="go:' + v + '"><span>' + label + (b ? ' <i class="kdbang">' + b + "</i>" : "") + "</span></button>"
      : '<span class="kq-spot locked" style="left:' + x + "%;top:" + y + '%" title="Opens at week ' + need + '"><span>\u{1F512} ' + label.replace(/^\S+\s/, "") + " <small>week " + need + "</small></span></span>";
  }).join("") + "</div>";
}

/* ----- clicks ----- */
if (typeof document !== "undefined") document.addEventListener("click", ev => {
  const t = ev.target.closest && ev.target.closest("[data-kd2]"); if (!t || !A) return;
  const [a, x] = t.dataset.kd2.split(":");
  const o = cur();
  if (a === "seen") { if (!o) return; o.k.seen = Object.assign({}, o.k.seen || {}, { [x]: 1 }); A.save(o.k); }
  else if (a === "quest") claimQuest(x);
  else if (a === "chest") openChest();
  else if (a === "side") { aqSide = 1 - aqSide; A.rer(); }
  else if (a === "tank") { aqTank = Number(x); A.rer(); scrollTo({ top: 0 }); }
  else if (a === "hall") { aqTank = -1; A.rer(); }
  else if (a === "full") claimFull(Number(x));
  else if (a === "plant") plant();
  else if (a === "water") { canFor = Number(x); canAt = null; pour = 0; A.rer(); }
  else if (a === "cancan") { canFor = -1; A.rer(); }
  else if (a === "dtab") { dockTab = x; A.rer(); }
  else if (a === "buy") buySub(x);
  else if (a === "use") useSub(x);
  else if (a === "repaint") { const it = SUBBY[x]; if (it) paintGame(it); }
  else if (a === "tbuy") buyTrail(x);
  else if (a === "tuse") useTrail(x);
  else if (a === "shpick") { shPick = x; shName = null; A.rer(); }
  else if (a === "shname") { shName = x; A.rer(); }
  else if (a === "shback") { shPick = shName = null; A.rer(); }
  else if (a === "shadopt") adoptSh();
  else if (a === "shfeed") { feedOn = true; feedAte = 0; A.rer(); }
  else if (a === "shfeedx") { feedOn = false; A.rer(); }
  else if (a === "shrace") startRace();
  else if (a === "room") exploreRoom(Number(x));
  else if (a === "hxfree") layEgg(true);
  else if (a === "scpick") startPick(x);
  else if (a === "town") { townView = x || ""; salonTry = null; A.rer(); scrollTo({ top: 0 }); }
  else if (a === "bake") startBake();
  else if (a === "stry") { salonTry = salonTry === x ? null : x; A.rer(); }
  else if (a === "sbuy") salonBuy(x);
  else if (a === "swear") salonWear(x);
  else if (a === "scput") putPiece(x);
  else if (a === "hxbuy") layEgg(false);
  else if (a === "hxtap") tapEgg();
  else if (a === "shiptreasure") openTreasure();
  else if (a === "arpick") arPick(x);
  else if (a === "city") { cityView = x || ""; A.rer(); scrollTo({ top: 0 }); }
  else if (a === "dig") digPile(Number(x));
  else if (a === "crownok") crownDone();
  else if (a === "wsgo") startSong();
  else if (a === "unveil") unveil();
  else if (a === "argo") startArena();
  else if (a === "rankok") { if (!o) return; const nm = rankOf(o.st).name; if (o.k.rk === nm) return;
    const got = o.k.rkp || {}; if (RANK_PRIZE[nm] && !got[nm]) { o.k.p = (Number(o.k.p) || 0) + RANK_PRIZE[nm]; o.k.rkp = Object.assign({}, got, { [nm]: 1 }); }   // each rank's prize is paid only once
    o.k.rk = nm; const gear = RANK_GEAR[nm], st0 = o.st, extra = gear && !((st0.outfits || {})[gear[0]]) ? { outfits: Object.assign({}, st0.outfits || {}, { [gear[0]]: true }) } : {};
    let ultraNow = null;
    const rm = RANK_ROOM[nm]; if (rm && !(st0.roomOwned || []).includes(rm[0])) extra.roomOwned = (st0.roomOwned || []).concat([rm[0]]);   // Legend: the Golden Coral Throne
    if (RANK_EGG[nm] === "leg" && !(o.k.rke || {})[nm]) { o.k.rke = Object.assign({}, o.k.rke || {}, { [nm]: 1 }); extra.legendaryPulls = (Number(st0.legendaryPulls) || 0) + 1; }   // Grand Royal: a Legendary egg
    if (RANK_EGG[nm] === "rare" && !(o.k.rke || {})[nm]) { o.k.rke = Object.assign({}, o.k.rke || {}, { [nm]: 1 }); extra.doorEggs = (Number(st0.doorEggs) || 0) + 1; extra.eggBoost = Object.assign({}, st0.eggBoost || {}, { rare: (Number((st0.eggBoost || {}).rare) || 0) + 1 }); }   // Duke: a Rare egg
    if (RANK_EGG[nm] === "ultra" && !(o.k.rke || {})[nm]) {   // Royal: the Kingdom Ultra Egg hatches Axolumi right here (or +5 levels if they somehow have it)
      o.k.rke = Object.assign({}, o.k.rke || {}, { [nm]: 1 }); const coll = Object.assign({}, st0.coll || {}), had = coll[KD_ULTRA_FAM];
      coll[KD_ULTRA_FAM] = had ? Object.assign({}, had, { lvl: Math.min(100, (Number(had.lvl) || 1) + 5) }) : { lvl: 1, at: new Date().toISOString(), caught: true };
      extra.coll = coll; extra.collTouch = [KD_ULTRA_FAM]; ultraNow = !!had; }
    A.save(o.k, Object.keys(extra).length ? extra : null); A.rer(); if (ultraNow !== null) showUltraHatch(ultraNow); }
});
export function resetViews() { aqTank = -1; dockSay = null; shPick = shName = null; feedOn = false; townView = ""; salonTry = null; }

/* ===================== 🐎 Seahorse Stable (opens at Page, week 2) =====================
   Adopt one seahorse (4 colors, a name from a safe list), feed it once a week (it gets faster, up to 10),
   and race it twice a week on the reef against classmates' seahorses (read from the class cards the page
   already has, so no new reads). Prizes: 1st 25, 2nd 15, 3rd 10, 4th 5 pearls.
   Save: kd.sh = { c: color, n: name, sp: speed 1–10, fw: week fed, w: wins, r: races }, kd.rc = races this week. */
export const SH_COLORS = [["pink", "Pink"], ["blue", "Blue"], ["gold", "Gold"], ["mint", "Mint"]];
const SH_NAMES = ["Splash", "Coral", "Ripple", "Sunny", "Pearl", "Dash", "Kelpie", "Twinkle", "Finn", "Misty", "Sandy", "Bubbles", "Zippy", "Wave", "Comet", "Shelly"];
export const SH_RACES = 2;
const SH_PRIZE = [25, 15, 10, 5], PLACE = ["1st", "2nd", "3rd", "4th"];
const shImg = (c, sm) => K + "stable/seahorse-" + c + (sm ? "-sm" : "") + ".webp";
let shPick = null, shName = null, feedOn = false, feedAte = 0, feedLast = 0, shSay = null;
export function stableHTML(st, cls) {
  visit("stable");
  const o = cur(), k = o ? o.k : {}, wk = A.wk(cls), sh = k.sh;
  let h = '<div class="kdscene kq-stable' + (feedOn ? " feeding" : "") + '" style="background-image:url(' + K + 'stable/stable-bg.webp)">';
  if (!sh && !shPick) {
    h += '<div class="kq-shtitle">Pick your seahorse!</div><div class="kq-shpick">' + SH_COLORS.map(([c, n]) =>
      '<button class="kq-shcard" data-kd2="shpick:' + c + '"><img src="' + shImg(c) + '" alt="' + n + ' seahorse"><b>' + n + "</b></button>").join("") + "</div>";
  } else if (!sh) {
    h += '<img class="kq-shpet" src="' + shImg(shPick) + '" alt=""><div class="kq-shnames"><b>Pick a name:</b><div>' + SH_NAMES.map(n =>
      '<button class="kq-shname' + (shName === n ? " on" : "") + '" data-kd2="shname:' + n + '">' + n + "</button>").join("") + "</div>" +
      '<div class="row" style="justify-content:center;gap:8px;margin-top:8px;"><button class="btn small ghost" data-kd2="shback:1">← Other color</button>' +
      (shName ? '<button class="btn gold" data-kd2="shadopt:1">\u{1F49C} Adopt ' + esc(shName) + "!</button>" : "") + "</div></div>";
  } else {
    const fed = sh.fw === wk, left = Math.max(0, SH_RACES - (Number(k.rc) || 0));
    h += '<img class="kq-shpet' + (o && o.C.justFed ? " ate" : "") + '" id="kqshpet" src="' + shImg(sh.c) + '" alt="' + esc(sh.n) + '">' +
      '<div class="kq-shplate"><b>' + esc(sh.n) + '</b><span class="kq-speed" title="Speed">⚡ ' + Array.from({ length: 10 }, (_, i) => "<i" + (i < sh.sp ? ' class="on"' : "") + "></i>").join("") + "</span>" +
      '<small>\u{1F3C6} ' + (Number(sh.w) || 0) + " wins · " + (Number(sh.r) || 0) + " races</small></div>" +
      '<div class="kq-shbtns">' + (feedOn ? '<span class="kq-tag">\u{1F37D}️ Feeding…</span>' : fed ? '<span class="kq-tag">✅ Fed this week</span>' : '<button class="btn gold" data-kd2="shfeed:1">\u{1F37D}️ Feed ' + esc(sh.n) + "</button>") +
      (left ? '<button class="btn gold" data-kd2="shrace:1">\u{1F3C1} Race! (' + left + " of " + SH_RACES + " left)</button>" : '<span class="kq-tag">\u{1F3C1} No races left this week</span>') + "</div>";
    if (feedOn) h += '<div class="kq-canhint"><span>Bring the kelp cupcake to <b>' + esc(sh.n) + '</b>!</span><button class="btn small ghost" data-kd2="shfeedx:1">Stop</button></div>' +
      '<img class="kq-snack" id="kqsnack" src="' + K + 'stable/kelp-snack.webp" alt="A kelp cupcake" style="left:30%;top:70%">';
  }
  const line = shSay || (!sh ? (shPick ? "What a cutie! Now pick a name." : "") : feedOn ? "" : sh.fw !== wk ? sh.n + " is hungry! Feed them once a week and they get faster." : (Number(k.rc) || 0) < SH_RACES ? sh.n + " is ready to race!" : "");
  h += guide("stable", st, shSay ? "cheer" : null, line || null) + "</div>";
  if (sh) h += '<p class="small kq-gnote" style="margin-top:8px;">Feed once a week: +1 speed (up to 10). 2 races a week against your classmates’ seahorses. 1st = 25 pearls, 2nd = 15, 3rd = 10, 4th = 5.</p>';
  if (o) o.C.justFed = 0;
  shSay = null;
  return h;
}
// feeding: the snack follows the finger; bring it to the seahorse's face
if (typeof document !== "undefined") document.addEventListener("pointermove", ev => {
  const sn = document.getElementById("kqsnack"); if (!sn || !feedOn) return;
  const sc = sn.closest(".kq-stable"), r = sc.getBoundingClientRect();
  const px = Math.max(4, Math.min(96, (ev.clientX - r.left) / r.width * 100)), py = Math.max(8, Math.min(94, (ev.clientY - r.top) / r.height * 100));
  sn.style.left = px + "%"; sn.style.top = py + "%";
  const pet = document.getElementById("kqshpet"); if (!pet) return; const b = pet.getBoundingClientRect();
  const fx = b.left + b.width * 1.03, fy = b.top + b.height * 0.45;   // just in front of the snout (seahorses face right)
  const near = Math.hypot(ev.clientX - fx, ev.clientY - fy) < b.width * 0.2;
  if (near) { sn.style.left = ((fx - r.left) / r.width * 100) + "%"; sn.style.top = ((fy - r.top) / r.height * 100) + "%"; }   // snaps right up to its mouth
  pet.classList.toggle("munch", near);
  if (!near) { feedLast = 0; return; }
  const now = performance.now(); if (feedLast) feedAte += Math.min(0.1, (now - feedLast) / 1000); feedLast = now;
  sn.style.transform = "translate(-50%,-50%) scale(" + Math.max(0.3, 1 - feedAte / 1.6).toFixed(2) + ")";
  if (Math.random() < 0.25) { const hrt = document.createElement("i"); hrt.className = "kq-heart"; hrt.textContent = "\u{1F49C}"; hrt.style.left = ((fx - r.left) / r.width * 100) + "%"; hrt.style.top = ((fy - r.top) / r.height * 100) + "%"; sc.appendChild(hrt); setTimeout(() => hrt.remove(), 900); }
  if (feedAte >= 1.6) { feedOn = false; feedAte = 0; feedLast = 0; feedSh(); }
}, { passive: true });
function feedSh() {
  const o = cur(); if (!o || !o.k.sh) return; const k = o.k, wk = A.wk(o.cls); if (k.sh.fw === wk) return;
  const sp = Math.min(10, (Number(k.sh.sp) || 3) + 1);
  k.sh = Object.assign({}, k.sh, { fw: wk, sp }); o.C.justFed = 1;
  shSay = "Yum! " + esc(k.sh.n) + " loved it! Speed is now <b>" + sp + "</b>." + (sp >= 10 ? " That’s the top speed!" : ""); A.save(k);
}
function adoptSh() {
  const o = cur(); if (!o || o.k.sh || !shPick || !shName) return;
  o.k.sh = { c: shPick, n: shName, sp: 3, fw: "", w: 0, r: 0 }; shSay = "Welcome to the stable, " + esc(shName) + "! \u{1F49C}"; shPick = shName = null; A.save(o.k);
}

/* ----- the race: its own full-screen layer. Tap (or press space) to make your seahorse kick. ----- */
let R = null;
function rivalsFor(o) {
  const mates = ((o.C.mates || []).filter(s => s && s.id !== o.st.id && s.kd && s.kd.sh && s.kd.sh.c));
  const day = A.wk(o.cls) + "|" + (Number(o.k.rc) || 0);
  mates.sort((a, b) => hash01(day + a.id) - hash01(day + b.id));
  const out = mates.slice(0, 3).map(s => ({ n: s.kd.sh.n, c: s.kd.sh.c, sp: Number(s.kd.sh.sp) || 3, who: String(s.name || "").split(" ")[0] }));
  while (out.length < 3) { const c = SH_COLORS[out.length % 4][0]; out.push({ n: "Wild seahorse", c: SH_COLORS[(out.length + 2) % 4][0], sp: 3 + out.length, who: "" }); }
  return out;
}
async function startRace() {
  const o = cur(); if (!o || !o.k.sh || R) return; if ((Number(o.k.rc) || 0) >= SH_RACES) return;
  const me = { n: o.k.sh.n, c: o.k.sh.c, sp: Number(o.k.sh.sp) || 3, who: "You", me: true };
  const list = rivalsFor(o); list.splice(1, 0, me);
  const LANES = [25, 41, 57, 73], X0 = 13, X1 = 86;
  const root = document.createElement("div"); root.className = "kdgame"; root.id = "kqrace";
  root.innerHTML = '<div class="kdstage kq-racestage"><div class="kdbg" style="background-image:url(' + K + 'stable/race-bg.webp)"></div><div class="kdlayer"></div><div class="kdui"></div></div>';
  document.body.appendChild(root);
  const stage = root.querySelector(".kdstage"), lay = root.querySelector(".kdlayer"), ui = root.querySelector(".kdui");
  R = { root, dead: false };
  const rs = list.map((s, i) => {
    const e = document.createElement("div"); e.className = "kq-racer" + (s.me ? " me" : "");
    e.innerHTML = '<span class="kq-racetag">' + (s.me ? "⭐ " : "") + esc(s.n) + (s.who && !s.me ? " <small>(" + esc(s.who) + ")</small>" : "") + '</span><img src="' + shImg(s.c, true) + '" alt="">';
    lay.appendChild(e);
    return Object.assign({ e, x: X0, y: LANES[i], vb: 0, ph: Math.random() * 6, next: 0.3 + Math.random() * 0.4, done: 0 }, s);
  });
  const draw = () => rs.forEach(r => { r.e.style.left = r.x + "%"; r.e.style.top = (r.y + Math.sin(r.ph * 3) * 0.8) + "%"; r.e.lastChild.style.transform = "rotate(" + (Math.min(12, r.vb * 1.4) * -1 + Math.sin(r.ph * 6) * 3).toFixed(1) + "deg)"; });
  draw();
  const say = (html, big) => { ui.innerHTML = '<div class="kq-racesay' + (big ? " big" : "") + '"><img src="' + K + 'duck/seahorse-race.webp" alt=""><div>' + html + "</div></div>"; };
  say("Welcome to the <b>Reef Race</b>! Tap anywhere (or press space) to make <b>" + esc(me.n) + "</b> kick. The faster you tap, the faster it swims!");
  await new Promise(r => setTimeout(r, 3200));
  for (const n of ["3", "2", "1"]) { ui.innerHTML = '<div class="kq-count">' + n + "</div>"; await new Promise(r => setTimeout(r, 750)); }
  ui.innerHTML = '<div class="kq-count go">GO!</div><div class="kdhud"><span>\u{1F446} Tap tap tap!</span></div>'; setTimeout(() => { const g = ui.querySelector(".kq-count"); if (g) g.remove(); }, 700);
  let lastTap = 0, order = [];
  const meR = rs.find(r => r.me);
  const kick = () => { const t = performance.now(); if (t - lastTap < 130 || meR.done) return; lastTap = t; meR.vb += 2.3;
    const b = document.createElement("i"); b.className = "kq-kick"; b.style.left = (meR.x - 4) + "%"; b.style.top = meR.y + "%"; lay.appendChild(b); setTimeout(() => b.remove(), 600); };
  const onDown = e => { e.preventDefault(); kick(); }, onKey = e => { if (e.key === " " || e.key === "ArrowRight") { e.preventDefault(); if (!e.repeat) kick(); } };
  stage.addEventListener("pointerdown", onDown); addEventListener("keydown", onKey);
  await new Promise(res => {
    let last = performance.now(), t = 0;
    const step = now => {
      if (R.dead) return res(); const dt = Math.min(0.1, (now - last) / 1000); last = now; t += dt;
      rs.forEach(r => {
        r.ph += dt;
        if (!r.me && !r.done) { r.next -= dt; if (r.next <= 0) { r.vb += 2.3; r.next = 1 / (2.6 + r.sp * 0.12) * (0.7 + Math.random() * 0.6); } }   // classmates' seahorses kick on their own
        r.vb *= Math.exp(-2.4 * dt);
        const v = r.done ? 0 : 2.4 + r.sp * 0.25 + r.vb;
        r.x = Math.min(X1, r.x + v * dt);
        if (!r.done && r.x >= X1) { r.done = 1; order.push(r); }
      });
      draw();
      if (order.length >= rs.length || t > 40) return res();
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
  stage.removeEventListener("pointerdown", onDown); removeEventListener("keydown", onKey);
  rs.forEach(r => { if (!order.includes(r)) order.push(r); });
  const place = order.indexOf(meR), prize = SH_PRIZE[place];
  const k = A.kdOf(o.st, o.cls), sh = Object.assign({}, k.sh); sh.r = (Number(sh.r) || 0) + 1; if (place === 0) sh.w = (Number(sh.w) || 0) + 1;
  k.sh = sh; k.rc = (Number(k.rc) || 0) + 1; k.p = (Number(k.p) || 0) + prize; A.save(k);
  ui.innerHTML = '<div class="kdbox kq-raceend"><img src="' + K + "duck/seahorse-" + (place === 0 ? "cheer2" : "cheer") + '.webp" alt="" class="kdboximg">' +
    "<h2>" + (place === 0 ? "\u{1F3C6} " + esc(me.n) + " WON!" : "\u{1F389} " + esc(me.n) + " came " + PLACE[place] + "!") + "</h2>" +
    '<ol class="kq-podium">' + order.map((r, i) => '<li class="' + (r.me ? "me" : "") + '"><b>' + PLACE[i] + '</b><img src="' + shImg(r.c, true) + '" alt=""><span>' + esc(r.n) + (r.who ? " <small>(" + esc(r.who) + ")</small>" : "") + "</span><i>⚪ " + SH_PRIZE[i] + "</i></li>").join("") + "</ol>" +
    "<p><b>+" + prize + " pearls!</b> " + Math.max(0, SH_RACES - k.rc) + " race" + (SH_RACES - k.rc === 1 ? "" : "s") + " left this week." + (sh.sp < 10 && sh.fw !== A.wk(o.cls) ? " Feed " + esc(sh.n) + " to make it faster!" : "") + "</p>" +
    '<div class="row" style="justify-content:center;margin-top:8px;"><button class="btn gold" data-kqrace="done">Back to the Stable</button></div></div>';
  await new Promise(res => { ui.onclick = e => { if (e.target.closest("[data-kqrace]")) res(); }; });
  root.remove(); R = null; A.rer();
}

/* ----- rank-up moment: the first time a student comes in at a new rank, Captain Duck salutes and shows what opened ----- */

/* ===================== ⚓ Sunken Ship (opens at Squire, week 3) =====================
   A cut-open shipwreck with 8 dark rooms. One new room opens each week a student reaches the Kingdom (from week 3).
   Explore a room with a flashlight: move the light around the dark room until it shines on the hidden find.
   Each find = +20 pearls and goes on the Ship's Log. All 8 = the Captain's Treasure (+100 pearls).
   Save: kd.ship = { f: { roomIndex: 1 }, t: 1 when the treasure was opened }. */
// [key, room name, find key, find name, room box x0,y0,x1,y1 (% of the ship picture)]
export const ROOMS = [
  ["cabin", "Captain’s Cabin", "captain-hat", "Captain’s Hat", 16, 22, 39, 40],
  ["maproom", "Map Room", "map", "Treasure Map", 40, 22, 62, 40],
  ["galley", "Galley", "bottle-ship", "Ship in a Bottle", 63, 22, 89, 40],
  ["bunks", "Crew Bunks", "teddy", "Sailor’s Teddy Bear", 15, 42, 47, 60],
  ["cannon", "Cannon Deck", "bell", "Ship’s Bell", 48, 42, 90, 60],
  ["cargo", "Cargo Hold", "pearl-cannonball", "Pearl Cannonball", 17, 63, 51, 83],
  ["nest", "Crow’s Nest", "spyglass", "Brass Spyglass", 55, 2, 69, 17],
  ["vault", "Treasure Vault", "compass", "Golden Compass", 52, 63, 83, 83]];
const SHIP_FIND = 20, SHIP_TREASURE = 100;
const findImg = f => K + "ship/find-" + f + ".webp";
export const shipOpen = st => Math.max(0, Math.min(8, weeksIn(st) - 2));   // rooms open: week 3 = 1 room … week 10 = all 8
let shipSay = null;
export function shipHTML(st, cls) {
  visit("ship");
  const o = cur(), k = o ? o.k : {}, sh = k.ship || { f: {} }, open = shipOpen(st), found = Object.keys(sh.f || {}).length;
  let h = '<div class="kdscene kq-ship" style="background-image:url(' + K + 'ship/ship-bg.webp)">';
  ROOMS.forEach(([key, name, fk, fn, x0, y0, x1, y1], i) => {
    const st2 = sh.f[i] ? "got" : i < open ? "new" : "dark";
    h += '<button class="kq-room ' + st2 + '" style="left:' + x0 + "%;top:" + y0 + "%;width:" + (x1 - x0) + "%;height:" + (y1 - y0) + '%"' + (st2 === "dark" ? " disabled" : ' data-kd2="room:' + i + '"') + ">" +
      (st2 === "dark" ? "<span>\u{1F512} Week " + (i + 3) + "</span>" : st2 === "new" ? "<span>\u{1F526} Explore the " + name + "!</span>" : '<img src="' + findImg(fk) + '" alt=""><span>✅ ' + name + "</span>") + "</button>";
  });
  if (found >= 8 && !sh.t) h += '<button class="btn gold big kq-treasurebtn" data-kd2="shiptreasure:1">\u{1F9F0} Open the Captain’s Treasure!</button>';
  const line = shipSay || (found >= 8 ? (sh.t ? "You found everything on the ship! What an explorer!" : "You found all 8! Open the Captain’s Treasure!") : open > found ? "A new room is open! Grab your flashlight and explore it." : "Come back next week. Another room opens every week you reach the Kingdom!");
  h += guide("ship", st, shipSay ? "cheer" : null, line) + "</div>";
  h += '<div class="kq-log"><b>\u{1F4D6} Ship’s Log</b> <span class="small">' + found + " of 8 found</span><div>" + ROOMS.map(([key, name, fk, fn], i) =>
    '<span class="kq-logslot' + (sh.f[i] ? " got" : "") + '" title="' + (sh.f[i] ? fn : "???") + '"><img src="' + findImg(fk) + '" alt=""><small>' + (sh.f[i] ? fn : "???") + "</small></span>").join("") +
    '<span class="kq-logslot big' + (sh.t ? " got" : "") + '"><img src="' + findImg("captains-treasure") + '" alt=""><small>' + (sh.t ? "Captain’s Treasure" : "All 8 = ???") + "</small></span></div></div>";
  shipSay = null;
  return h;
}
// the flashlight search: its own full-screen layer
let SX = null;
const clamp01 = v => Math.max(0, Math.min(1, v));
function exploreRoom(i) {
  const o = cur(); if (!o || SX) return; const sh = o.k.ship || { f: {} }; if (sh.f[i] || i >= shipOpen(o.st)) return;
  const [key, name, fk, fn, x0, y0, x1, y1] = ROOMS[i], rw = x1 - x0, rh = y1 - y0;
  // zoom the ship picture so this room fills the screen (keeping its shape, centered)
  const z = Math.min(3.2, Math.min(100 / rw, 100 / rh) * 0.92), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const r = hash01(o.st.id + "|" + key), r2 = hash01(key + "|" + o.st.id);
  const fx = 50 + (r - 0.5) * 62, fy = 50 + (r2 - 0.5) * 44;   // where the find hides (in screen %)
  const root = document.createElement("div"); root.className = "kdgame"; root.id = "kqexplore";
  root.innerHTML = '<div class="kdstage kq-dark"><div class="kdbg" style="background-image:url(' + K + "ship/ship-bg.webp);background-size:" + (z * 100) + "% auto;background-position:" +
    clamp01((cx * z / 100 - 0.5) / (z - 1)) * 100 + "% " + clamp01((cy * z / 100 - 0.5) / (z - 1)) * 100 + '%"></div>' +
    '<img class="kq-find" src="' + findImg(fk) + '" alt="" style="left:' + fx + "%;top:" + fy + '%"><div class="kq-night"></div><i class="kq-twinkle" style="left:' + fx + "%;top:" + fy + '%">✨</i><div class="kdui"></div></div>';
  document.body.appendChild(root); SX = root;
  const stage = root.querySelector(".kdstage"), night = root.querySelector(".kq-night"), ui = root.querySelector(".kdui"), fimg = root.querySelector(".kq-find");
  ui.innerHTML = '<div class="kq-racesay"><img src="' + K + 'duck/ship-explain.webp" alt=""><div>It’s dark in the <b>' + name + "</b>! Move your finger or mouse to shine the flashlight. Something is hiding in here…</div></div>" +
    '<button class="btn small ghost kq-xclose" data-kqx="close">✖ Leave</button>';
  let lx = 50, ly = 50, seen = 0, last = 0, done = false;
  const paint = () => { night.style.background = "radial-gradient(circle at " + lx + "% " + ly + "%, rgba(255,240,190,.10) 0, rgba(255,240,190,.05) 7%, rgba(4,8,22,.96) 13%)"; };
  paint();
  const move = e => {
    if (done) return; const b = stage.getBoundingClientRect(); lx = (e.clientX - b.left) / b.width * 100; ly = (e.clientY - b.top) / b.height * 100; paint();
    const say = ui.querySelector(".kq-racesay"); if (say && performance.now() - t0 > 2500) say.remove();
    const d = Math.hypot((lx - fx) * 16 / 9, ly - fy), now = performance.now();
    if (d < 9) { if (last) seen += Math.min(0.1, (now - last) / 1000); last = now; fimg.classList.add("lit"); } else { last = 0; fimg.classList.remove("lit"); }
    if (seen > 0.7) { done = true; foundIt(); }
  };
  const t0 = performance.now();
  stage.addEventListener("pointermove", move); stage.addEventListener("pointerdown", move);
  ui.onclick = e => { const b = e.target.closest("[data-kqx]"); if (!b) return; if (b.dataset.kqx === "close" || b.dataset.kqx === "done") { root.remove(); SX = null; A.rer(); } };
  function foundIt() {
    night.classList.add("on"); fimg.classList.add("got");
    const k = A.kdOf(o.st, o.cls), s2 = { f: Object.assign({}, (k.ship || {}).f || {}, { [i]: 1 }), t: (k.ship || {}).t || 0 };
    k.ship = s2; k.p = (Number(k.p) || 0) + SHIP_FIND; A.save(k);
    const n = Object.keys(s2.f).length;
    setTimeout(() => {
      ui.innerHTML = '<div class="kdbox"><img src="' + K + 'duck/ship-cheer.webp" alt="" class="kdboximg"><div class="kq-catch"><img src="' + findImg(fk) + '" alt=""></div>' +
        "<h2>\u{1F31F} You found the " + fn + "!</h2><p>It’s in your <b>Ship’s Log</b> now. <b>+" + SHIP_FIND + " pearls!</b></p><p class='small'>" +
        (n >= 8 ? "That’s all 8! The <b>Captain’s Treasure</b> is waiting for you." : n + " of 8 found. " + (n < shipOpen(o.st) ? "Another room is open, go explore it!" : "A new room opens next week you reach the Kingdom.")) + "</p>" +
        '<div class="row" style="justify-content:center;margin-top:8px;"><button class="btn gold" data-kqx="done">Back to the ship</button></div></div>';
    }, 1100);
  }
}
function openTreasure() {
  const o = cur(); if (!o) return; const sh = o.k.ship || { f: {} }; if (sh.t || Object.keys(sh.f || {}).length < 8) return;
  o.k.ship = { f: sh.f, t: 1 }; o.k.p = (Number(o.k.p) || 0) + SHIP_TREASURE;
  shipSay = "\u{1F9F0} The Captain’s Treasure! <b>+" + SHIP_TREASURE + " pearls</b>! You explored the whole ship!"; A.save(o.k);
}


/* ===================== 🌙 Royal Hatchery (opens at Knight, week 4) =====================
   Like Nebbles: one FREE baby axolotl egg every Kingdom week, and extra eggs for 150 pearls from the Hatchery Duck.
   An egg rests in the nest and is ready to hatch the next day: tap it to crack it open. It's always a color the student
   doesn't have yet (20 colors). Babies grow up after 2 more Kingdom weeks. Everyone swims in the Moonlit Lagoon.
   After all 20 colors, eggs hatch a second one of a color: keep it, or release it to the wild (real axolotls are
   critically endangered in their only home, Lake Xochimilco in Mexico).
   Save: kd.hx = { l: [[color, weeksIn when hatched], …], e: { d: date laid } | null, fw: week of the free egg, rel: released }. */
export const AXO_COLORS = [["pink", "Pink"], ["gold", "Gold"], ["blue", "Blue"], ["mint", "Mint"], ["lavender", "Lavender"], ["galaxy", "Galaxy"],
  ["white", "Snowy White"], ["black", "Midnight"], ["copper", "Copper"], ["sunset", "Sunset"], ["opal", "Rainbow Opal"], ["glowgreen", "Glow Green"],
  ["cottoncandy", "Cotton Candy"], ["cherry", "Cherry"], ["lemon", "Lemon"], ["chocolate", "Chocolate"], ["oceanwave", "Ocean Wave"], ["leopard", "Leopard"],
  ["lilac", "Lilac Spots"], ["mermaidteal", "Mermaid Teal"]];
const AXO_NAME = Object.fromEntries(AXO_COLORS), EGG_PRICE = 150, GROW_WEEKS = 2;
// Nov 16 (Ms. Ariana): an egg hatches a short wait after it's laid (not the next day, since the Kingdom closes Sunday night)
export const HATCH_MS = 2 * 60 * 1000;
const eggLeft = e => !e ? 0 : e.t ? Math.max(0, Number(e.t) + HATCH_MS - Date.now()) : (e.d && e.d < today() ? 0 : 1);
let hxTimer = 0;
function hxTick() {   // the countdown on the egg; redraws once when it's ready
  clearInterval(hxTimer); hxTimer = setInterval(() => {
    const el = document.getElementById("kqeggleft"); if (!el) { clearInterval(hxTimer); return; }
    const o = cur(); const left = o ? eggLeft(hxOf(o.k).e) : 0;
    if (left <= 0) { clearInterval(hxTimer); A.rer(); return; }
    const sec = Math.ceil(left / 1000); el.textContent = Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0");
  }, 500);
}
const axoImg = (c, big) => K + "hatch/" + (big ? "adult-" : "baby-") + c + ".webp";
let hxSay = null, hxTaps = 0, hxNew = null;
const today = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
function hxOf(k) { const h = k.hx || {}; return { l: (h.l || []).slice(), e: h.e || null, fw: h.fw || "", rel: Number(h.rel) || 0 }; }
export function hatchHTML(st, cls) {
  visit("lagoon"); setTimeout(aqKick, 30);
  const o = cur(), k = o ? o.k : {}, wk = A.wk(cls), h = hxOf(k), n = weeksIn(st);
  const have = new Set(h.l.map(x => x[0])), grown = x => n - x[1] >= GROW_WEEKS;
  const left = eggLeft(h.e), ready = !!h.e && left <= 0, freeOk = h.fw !== wk;
  if (h.e && !ready) setTimeout(hxTick, 50);
  let s = '<div class="kdscene kq-lagoon" style="background-image:url(' + K + 'hatch/lagoon-bg.webp)">';
  s += '<div class="kq-aqbox">' + h.l.map(([c, w], i) => { const big = grown([c, w]);
    return '<div class="kq-swim" data-k="axo' + i + '" data-sz="' + (big ? "l" : "s") + '" data-m="swim" style="width:' + (big ? 15 : 10) + '%;left:-40%;top:50%"><img src="' + axoImg(c, big) + '" alt="' + esc(AXO_NAME[c] || c) + '"></div>'; }).join("") + "</div>";
  s += '<div class="kq-nest">' + (h.e ? '<button class="kq-egg' + (ready ? " ready" : "") + (hxTaps ? " t" + Math.min(4, hxTaps) : "") + '"' + (ready ? ' data-kd2="hxtap:1"' : " disabled") + '><img src="' + K + 'hatch/egg.webp" alt="A baby axolotl egg"></button>' +
    '<span class="kq-tag">' + (ready ? "\u{1F449} Tap the egg to hatch it!" : '\u{1F319} Hatching in <b id="kqeggleft">' + Math.floor(Math.ceil(left / 1000) / 60) + ":" + String(Math.ceil(left / 1000) % 60).padStart(2, "0") + "</b>") + "</span>" : "") + "</div>";
  s += '<div class="kq-shbtns">' + (h.e ? "" : freeOk ? '<button class="btn gold" data-kd2="hxfree:1">\u{1F95A} Get this week’s free egg</button>' :
    '<button class="btn ' + ((Number(k.p) || 0) >= EGG_PRICE ? "gold" : "ghost") + '" data-kd2="hxbuy:1">\u{1F95A} Buy an egg (⚪ ' + EGG_PRICE + ")</button>") + "</div>";
  const line = hxSay || (h.e ? (ready ? "Your egg is ready! Tap it to help it hatch." : "Shh, your egg is getting ready. It hatches in 2 minutes. Go explore and come back!") : freeOk ? "Your free egg for this week is waiting!" : h.l.length ? "Your axolotls love the lagoon! Want another egg?" : "");
  s += guide("lagoon", st, hxSay ? "cheer" : null, line || null) + "</div>";
  s += '<div class="kq-log"><b>\u{1F98E} My axolotls</b> <span class="small">' + have.size + " of " + AXO_COLORS.length + " colors" + (h.rel ? " · \u{1F33F} " + h.rel + " released to the wild" : "") + "</span><div>" +
    AXO_COLORS.map(([c, nm]) => { const mine = h.l.filter(x => x[0] === c), g = mine.some(grown);
      return '<span class="kq-logslot' + (mine.length ? " got" : "") + '" title="' + (mine.length ? nm : "???") + '"><img src="' + axoImg(c, g) + '" alt=""><small>' + (mine.length ? nm + (mine.length > 1 ? " ×" + mine.length : "") + "<br>" + (g ? "grown up" : "baby") : "???") + "</small></span>"; }).join("") + "</div>" +
    '<p class="small muted" style="margin:6px 0 0;">One free egg every week you reach the Kingdom. Babies grow up after ' + GROW_WEEKS + " more Kingdom weeks. Every egg is a new color until you have all " + AXO_COLORS.length + ".</p></div>";
  hxSay = null;
  return s;
}
function layEgg(free) {
  const o = cur(); if (!o) return; const k = o.k, h = hxOf(k), wk = A.wk(o.cls); if (h.e) return;
  if (free) { if (h.fw === wk) return; h.fw = wk; }
  else { const p = Number(k.p) || 0; if (p < EGG_PRICE) { hxSay = "You need <b>" + (EGG_PRICE - p) + " more pearls</b> for an egg. Try a Pearl Dive!"; A.rer(); return; }
    if (typeof confirm === "function" && !confirm("Buy a baby axolotl egg for " + EGG_PRICE + " pearls?")) return; k.p = p - EGG_PRICE; }
  h.e = { t: Date.now() }; k.hx = h; hxTaps = 0;
  hxSay = "Here\u2019s your egg! I\u2019ll tuck it in the nest. It hatches in <b>2 minutes</b>."; A.save(k);
}
function tapEgg() {
  const o = cur(); if (!o) return; const h = hxOf(o.k); if (!h.e || eggLeft(h.e) > 0) return;
  hxTaps++; if (hxTaps < 5) { A.rer(); return; }
  hxTaps = 0;
  const have = new Set(h.l.map(x => x[0])), fresh = AXO_COLORS.filter(([c]) => !have.has(c)), pool = fresh.length ? fresh : AXO_COLORS;
  const c = pool[Math.floor(Math.random() * pool.length)][0], dup = !fresh.length;
  h.e = null; h.l.push([c, weeksIn(o.st)]); o.k.hx = h; A.save(o.k);
  showHatch(c, dup);
}
function showHatch(c, dup) {
  const root = document.createElement("div"); root.className = "kq-rankup"; root.id = "kqhatch";
  root.innerHTML = '<div class="kq-rankbox kq-hatchbox"><div class="kq-crack"><img class="kq-eggfx" src="' + K + 'hatch/egg.webp" alt=""><img class="kq-baby" src="' + axoImg(c) + '" alt=""></div>' +
    "<small>\u{1F389} Your egg hatched!</small><h2>It’s a <b>" + esc(AXO_NAME[c]) + "</b> baby!</h2>" +
    "<p>" + (dup ? "You have every color now, so this is a second " + esc(AXO_NAME[c]) + ". You can keep it, or release it to the wild." : "It swims in your <b>Moonlit Lagoon</b> now, and grows up after " + GROW_WEEKS + " more Kingdom weeks.") + "</p>" +
    (dup ? '<div class="kq-fact">\u{1F30E} <b>Did you know?</b> Wild axolotls live in just one place: the canals of Lake Xochimilco in Mexico. There are very few left, so people work hard to protect them.</div>' +
      '<div class="row" style="justify-content:center;gap:8px;margin-top:10px;"><button class="btn" data-kqh="keep">\u{1F49C} Keep it</button><button class="btn gold" data-kqh="free">\u{1F33F} Release it to the wild</button></div>'
      : '<button class="btn gold big" data-kqh="ok">\u{1F49C} Yay!</button>') + "</div>";
  document.body.appendChild(root);
  root.onclick = e => { const b = e.target.closest("[data-kqh]"); if (!b) return;
    if (b.dataset.kqh === "free") { const o = cur(); if (o) { const h = hxOf(o.k), i = h.l.map(x => x[0]).lastIndexOf(c); if (i >= 0) h.l.splice(i, 1); h.rel++; o.k.hx = h;
      hxSay = "Thank you! Your axolotl swam off to help grow the wild axolotl family. \u{1F33F}"; A.save(o.k); } }
    root.remove(); A.rer(); };
}


/* ===================== 🏖️ Seashell Beach: Sandcastle Builder (opens at Captain, week 6) =====================
   Every week a student reaches the Kingdom (from week 6) they pick ONE new sandcastle piece, and it pops into its own
   spot on their sandcastle (pieces fit together like a puzzle, so every castle looks finished, never messy).
   Extra pieces: 100 pearls. All 10 = a finished castle. Classmates' castles show along the beach (from the class cards
   the page already has: no new reads). Save: kd.sc = { p: [piece keys], fw: week of the free piece }. */
// [key, name, x (% of the castle box), bottom (%), width (%), layer]
export const SAND = [
  ["moat", "Sparkly Moat", 50, 0, 98, 0], ["dome", "Starfish Dome", 50, 58, 30, 1], ["wall", "Castle Wall", 50, 30, 64, 2],
  ["tower-round", "Round Tower", 19, 26, 30, 3], ["tower-square", "Square Tower", 80, 26, 25, 3], ["window", "Shell Window", 19, 46, 11, 4],
  ["flag", "Seaweed Flag", 84, 70, 14, 2], ["door", "Seashell Door", 50, 30, 16.5, 4], ["bridge", "Sand Bridge", 50, -3, 30, 5], ["statue", "Axolotl Statue", 92, -2, 13, 5]];
const SAND_PRICE = 100, sandImg = k => K + "beach/" + k + ".webp";
let scPick = false, scNew = null, scSay = null;
export function castleHTML(pieces, cls2) {
  const has = new Set(pieces || []);
  return '<div class="kq-castle' + (cls2 ? " " + cls2 : "") + '"><img class="kq-cspot" src="' + sandImg("spot") + '" alt="">' + SAND.filter(([k]) => has.has(k)).map(pieceEl).join("") + "</div>";
}
const pieceEl = ([k, n, x, b, w, z]) => '<img class="kq-cp' + (k === scNew ? " pop" : "") + '" src="' + sandImg(k) + '" alt="' + esc(n) + '" style="left:' + x + "%;bottom:" + b + "%;width:" + w + "%;z-index:" + (z + 2) + '">';
export function beachHTML(st, cls) {
  visit("beach");
  const o = cur(), k = o ? o.k : {}, wk = A.wk(cls), sc = k.sc || { p: [] }, have = sc.p || [], left = SAND.filter(([key]) => !have.includes(key)), freeOk = sc.fw !== wk;
  let h = '<div class="kdscene kq-beach" style="background-image:url(' + K + 'beach/beach-bg.webp)">' + castleHTML(have) + (scNew ? '<div class="kq-sparkle"></div>' : "");
  if (scPick && left.length) h += '<div class="kq-sandpick"><b>Pick your new piece!</b><div>' + left.map(([key, n]) => '<button data-kd2="scput:' + key + '"><img src="' + sandImg(key) + '" alt=""><span>' + esc(n) + "</span></button>").join("") +
    '</div><button class="btn small ghost" data-kd2="scpick:0">Not now</button></div>';
  h += '<div class="kq-shbtns">' + (!left.length ? '<span class="kq-tag">\u{1F3F0} Your sandcastle is finished!</span>' : scPick ? "" : freeOk ? '<button class="btn gold" data-kd2="scpick:free">\u{1F381} Pick this week’s free piece</button>' :
    '<button class="btn ' + ((Number(k.p) || 0) >= SAND_PRICE ? "gold" : "ghost") + '" data-kd2="scpick:buy">\u{1F3D6}️ Buy a piece (⚪ ' + SAND_PRICE + ")</button>") + "</div>";
  const line = scSay || (!left.length ? "What a castle! It’s the best one on the beach!" : freeOk ? "A new piece is waiting for you this week!" : have.length ? "Looking good! Come back next week for another piece." : "");
  h += guide("beach", st, scSay ? "cheer" : null, line || null) + "</div>";
  // classmates' castles (from the cards already loaded)
  const mates = ((o && o.C.mates) || []).filter(s => s && s.id !== st.id && s.kd && s.kd.sc && (s.kd.sc.p || []).length).slice(0, 12);
  h += '<div class="kq-log"><b>\u{1F3D6}️ Classmates’ sandcastles</b> <span class="small">' + have.length + " of " + SAND.length + " pieces on yours</span>" +
    (mates.length ? '<div class="kq-mates">' + mates.map(s => '<div class="kq-mate">' + castleHTML(s.kd.sc.p, "mini") + "<small>" + esc(String(s.name || "").split(" ")[0]) + " · " + s.kd.sc.p.length + "/" + SAND.length + "</small></div>").join("") + "</div>"
      : '<p class="small muted" style="margin:6px 0 0;">No one else has built yet. You’re first!</p>') + "</div>";
  scSay = null; if (scNew) setTimeout(() => { scNew = null; }, 50);
  return h;
}
function startPick(how) {
  const o = cur(); if (!o) return; const k = o.k, wk = A.wk(o.cls), sc = k.sc || { p: [] };
  if (how === "0") { scPick = false; A.rer(); return; }
  if (how === "free" && sc.fw === wk) return;
  if (how === "buy" && (Number(k.p) || 0) < SAND_PRICE) { scSay = "You need <b>" + (SAND_PRICE - (Number(k.p) || 0)) + " more pearls</b> for a piece. Try a Pearl Dive!"; A.rer(); return; }
  scPick = how; A.rer();
}
function putPiece(key) {
  const o = cur(); if (!o || !scPick) return; const k = o.k, wk = A.wk(o.cls), sc = { p: ((k.sc || {}).p || []).slice(), fw: (k.sc || {}).fw || "" };
  if (sc.p.includes(key) || !SAND.some(s => s[0] === key)) return;
  if (scPick === "free") { if (sc.fw === wk) return; sc.fw = wk; } else { if ((Number(k.p) || 0) < SAND_PRICE) return; k.p = (Number(k.p) || 0) - SAND_PRICE; }
  sc.p.push(key); k.sc = sc; scPick = false; scNew = key;
  scSay = sc.p.length >= SAND.length ? "\u{1F3F0} You finished your sandcastle! Amazing!" : "Ooh, the <b>" + esc((SAND.find(s => s[0] === key) || [])[1]) + "</b>! It fits right in!";
  A.save(k);
}


/* ===================== 🏘️ Coral Town (opens at Baron, week 8): Bubble Bakery + Mermaid Salon =====================
   • Bubble Bakery: bake ONE sea treat a week with the Baker in 3 quick steps (add the ingredients in order, stir fast,
     take it out of the oven at the right moment). 1–3 stars = +10 / +20 / +30 pearls, and the treat goes in the Treat Box.
     Save: kd.bk = { w: week baked, t: { treat: times baked } }.
   • Mermaid Salon: undersea outfits bought with pearls, kept forever in Gear (outfits = { id: true }, outfitOn = id).
     The mirror shows the student's own companion trying each one on. */
// [key, name, the 3 steps] (Nov 16: her bakery art in assets/kingdom/town/bake/)
//   order = tap the things in the right order (they go into "into") · mash = tap fast · stop = tap when the marker is in the green
//   hold = press and hold, let go in the green
export const TREATS = [
  ["kelp-cupcake", "Kelp Cupcake", [{ t: "order", items: ["egg", "flour", "kelp-flakes"], into: "bowl", frames: ["bowl-fit", "bowl-1-egg", "bowl-2-flour", "bowl-3-kelp"], say: "Add the ingredients to the bowl" }, { t: "mash", fx: "stir", img: "bowl-dough", tool: "whisk", say: "Stir it up!" }, { t: "stop", fx: "into", item: "cupcake-tray", into: "oven", say: "Bake it in the clam oven" }]],
  // Nov 16 (her step art): frames = the picture for each step, swapped as the student goes
  ["bubble-tea", "Bubble Tea", [{ t: "order", items: ["boba-jar"], frames: ["boba-1-empty", "boba-2-pearls"], drop: "boba-pearl", say: "Drop the boba pearls in the cup" },
    { t: "hold", item: "tea-pitcher", base: "boba-2-pearls", fill: [["boba-3-half", 5, 50], ["boba-4-full", 50, 80]], col: "#FFB3D1", say: "Pour the pink sea tea" },
    { t: "mash", fx: "shake", frames: ["boba-4-full"], say: "Shake it up!" }]],
  ["starfish-cookie", "Starfish Cookie", [{ t: "order", items: ["egg", "flour", "sea-sugar"], into: "bowl", frames: ["bowl-fit", "bowl-1-egg", "bowl-2-flour", "bowl-3-sugar"], say: "Add the ingredients to the bowl" }, { t: "mash", fx: "stir", img: "bowl-dough", tool: "whisk", say: "Stir it up!" }, { t: "stop", fx: "into", item: "cookie-tray", into: "oven", say: "Bake it in the clam oven" }]],
  ["coral-candy", "Coral Candy", [{ t: "hold", item: "syrup-pot", base: "candy-mold-fit", fill: [["candy-1-syrup", 5, 78]], col: "#FF5FA2", say: "Pour the pink syrup into the coral mold" },
    { t: "stop", fx: "cool", item: "candy-1-syrup", after: "candy-2-set", into: "fridge", say: "Cool it in the cold clam" }, { t: "mash", fx: "wiggle", frames: ["candy-2-set", "candy-mold-fit"], pop: "coral-candy", say: "Wiggle it out of the mold!" }]],
  ["jellyfish-jelly", "Jellyfish Jelly", [{ t: "hold", item: "jelly-pitcher", base: "jelly-mold-fit", fill: [["jelly-1-fill", 5, 78]], col: "#5BC8FF", say: "Pour the jelly into the jellyfish mold" },
    { t: "stop", fx: "cool", item: "jelly-1-fill", after: "jelly-2-set", into: "fridge", say: "Cool it in the cold clam" }, { t: "mash", fx: "wiggle", frames: ["jelly-2-set", "jelly-mold-fit"], pop: "jellyfish-jelly", say: "Wiggle it out of the mold!" }]],
  ["pretzel", "Sea-Salt Pretzel", [{ t: "mash", fx: "knead", img: "dough-ball", say: "Knead the dough!" }, { t: "stop", fx: "sprinkle", item: "sea-salt", into: "pretzel-tray", say: "Sprinkle the sea salt" }, { t: "stop", fx: "into", item: "pretzel-tray", into: "oven", say: "Bake it in the clam oven" }]],
  ["sushi", "Seaweed Sushi Roll", [{ t: "order", items: ["seaweed", "rice", "fillings"], frames: ["sushi-1-mat", "sushi-2-nori", "sushi-3-rice", "sushi-4-fill"], say: "Put them on the mat" },
    { t: "mash", fx: "rollpic", frames: ["sushi-4-fill", "sushi-5-half", "sushi-6-rolled"], say: "Roll it up!" }, { t: "knife", say: "Chop the sushi!" }]],
  ["rainbow-cake", "Rainbow Shell Cake", [{ t: "order", items: ["batter-cups"], into: "cake-pan", frames: ["cake-pan-fit", "cake-pan-1-batter"], say: "Pour the rainbow batter in the pan" }, { t: "stop", fx: "into", item: "cake-pan-1-batter", after: "cake-pan-2-baked", into: "oven", say: "Bake it in the clam oven" }, { t: "mash", fx: "frost", frames: ["cake-pan-2-baked", "cake-pan-fit"], tool: "frosting", pop: "rainbow-cake", say: "Frost the cake!" }]]];
const BAKE_NAMES = { egg: "Pearl egg", flour: "Sea flour", "kelp-flakes": "Kelp flakes", "sea-sugar": "Sea sugar", "boba-jar": "Boba pearls", seaweed: "Seaweed", rice: "Rice", fillings: "Fillings", "batter-cups": "Rainbow batter" };
const bkImg = f => K + "town/bake/" + f + ".webp";
// the sushi mat drawn in code so it can start empty and fill up layer by layer
const MAT = (layers, log) => '<span class="kq-mat"><span class="kq-sheet">' + layers + "</span>" + (log || "") + "</span>";
const INBOWL = { egg: "egg", flour: "flour", "kelp-flakes": "kelp", "sea-sugar": "sugar", "sea-salt": "salt" };   // drawn in the bowl
const BAKE_PEARLS = [0, 10, 20, 30], treatImg = k => K + "town/treat-" + k + ".webp";
// [outfit id, picture name, name, price]
export const SALON = [["sea-starfish-clip", "starfish-clip", "Starfish Hair Clip", 100], ["sea-pearl-sunhat", "pearl-sunhat", "Pearl Sun Hat", 150],
  ["sea-jelly-hat", "jelly-hat", "Jellyfish Hat", 120], ["sea-bubble-wand", "bubble-wand", "Bubble Wand", 120]];
let townView = "", salonTry = null, salonSay = null, bakeSay = null, BK = null;
export function townHTML(st, cls) {
  visit("town");
  if (townView === "bakery") return bakeryHTML(st, cls);
  if (townView === "salon") return salonHTML(st, cls);
  return '<div class="kdscene kq-town" style="background-image:url(' + K + 'town/town-bg.webp)">' +
    '<button class="kq-spot" style="left:18%;top:52%" data-kd2="town:bakery"><span>\u{1F9C1} Bubble Bakery</span></button>' +
    '<button class="kq-spot" style="left:82%;top:52%" data-kd2="town:salon"><span>\u{1F484} Mermaid Salon</span></button>' +
    guide("town", st, null, "Pick a shop! Bake a treat or try on something fancy.") + "</div>";
}
const backTown = '<div class="row" style="margin:0 0 8px;"><button class="btn ghost small" data-kd2="town:">← Coral Town</button></div>';
function treatOfWeek(cls) { const f = typeof window !== "undefined" && window.__kqTreat && TREATS.find(t => t[0] === window.__kqTreat); return f || TREATS[Math.floor(hash01("bake|" + A.wk(cls)) * TREATS.length)]; }   // __kqTreat: preview videos only
function bakeryHTML(st, cls) {
  const o = cur(), k = o ? o.k : {}, wk = A.wk(cls), bk = k.bk || { t: {} }, done = bk.w === wk, T = treatOfWeek(cls);
  let h = backTown + '<div class="kdscene kq-bakery" style="background-image:url(' + K + 'town/bakery-bg.webp)">';
  h += '<div class="kq-recipe"><small>This week’s treat</small><img src="' + treatImg(T[0]) + '" alt=""><b>' + esc(T[1]) + '</b><div class="kq-ings">' + T[2].map((st2, i) => "<span>" + (i + 1) + ". " + esc(st2.say) + "</span>").join("") + "</div></div>";
  h += '<div class="kq-shbtns">' + (done ? '<span class="kq-tag">✅ You baked this week’s treat!</span>' : '<button class="btn gold big" data-kd2="bake:1">\u{1F9C1} Bake it!</button>') + "</div>";
  h += guide("bakery", st, bakeSay ? "cheer" : null, bakeSay || (done ? "Delicious! Come back next week for a new recipe." : "This week we’re baking the " + T[1] + "!")) + "</div>";
  h += '<div class="kq-log"><b>\u{1F9FA} My Treat Box</b> <span class="small">' + Object.keys(bk.t || {}).length + " of " + TREATS.length + " treats</span><div>" + TREATS.map(([key, n]) =>
    '<span class="kq-logslot' + ((bk.t || {})[key] ? " got" : "") + '"><img src="' + treatImg(key) + '" alt=""><small>' + ((bk.t || {})[key] ? esc(n) + ((bk.t[key] > 1) ? " ×" + bk.t[key] : "") : "???") + "</small></span>").join("") + "</div>" +
    '<p class="small muted" style="margin:6px 0 0;">A new recipe every week. 3 stars = +30 pearls.</p></div>';
  bakeSay = null; return h;
}
// the 3-step bake, in its own layer (each step: Perfect 3 / Good 2 / Oops 1, like the Space Café)
function startBake() {
  const o = cur(); if (!o || BK) return; const wk = A.wk(o.cls); if ((o.k.bk || {}).w === wk) return;
  const T = treatOfWeek(o.cls), score = [], V = {};
  const vOf = nm => V[nm] = V[nm] || { items: [], col: "", lv: 0, boba: false, rainbow: false };
  // a pan / cup / mold drawn with what's in it so far (added ingredients, poured liquid, boba, rainbow batter)
  const vessel = (nm, cls) => { const v = V[nm] || {}; return '<span class="kq-ves v-' + nm + '"><img class="' + cls + '" src="' + bkImg(nm) + '" alt="">' +
    (v.rainbow ? '<span class="kq-vliq rainbow" style="height:55%"></span>' : v.col ? '<span class="kq-vliq" style="height:' + v.lv + "%;background:" + v.col + '"></span>' : "") +
    (v.boba ? '<span class="kq-boba"></span>' : "") + ((v.items || []).length ? '<span class="kq-vin">' + v.items.map(x => INBOWL[x] ? '<i class="kq-in ' + INBOWL[x] + '"></i>' : '<img class="kq-inimg" src="' + bkImg(x) + '" alt="">').join("") + "</span>" : "") + "</span>"; };
  // 🥚 Nov 17 (Ms. Ariana): how each thing goes in. crack = the egg cracks above the bowl, scoop = one scoop of flour,
  // shake = the jar tips over the bowl and shakes flakes / sugar in
  const HOWIN = { egg: "crack", flour: "scoop", "kelp-flakes": "shake", "sea-sugar": "shake", "sea-salt": "shake" };
  const SHAKECOL = { "kelp-flakes": ["#3FAE4F", "#7BD36A", "#2E7D3A"], "sea-sugar": ["#FFC3E1", "#FFFFFF", "#FF8CC6"], "sea-salt": ["#FFFFFF", "#E6F4FF"] };
  // drops / flakes falling from (x, y) into the bowl, in page pixels
  const rain = (x, y, toY, cols, n, w0, kind) => { for (let q = 0; q < n; q++) { const d = document.createElement("i"); d.className = "kq-rain " + (kind || "");
      const sz = w0 * (0.6 + Math.random() * 0.8); d.style.cssText = "left:" + (x + (Math.random() - 0.5) * w0 * 4) + "px;top:" + y + "px;width:" + sz + "px;height:" + sz + "px;background:" + cols[q % cols.length] + ";--fall:" + Math.max(20, toY - y) + "px;animation-delay:" + (q * 0.035) + "s";
      document.body.appendChild(d); setTimeout(() => d.remove(), 1500); } };
  const addIn = (it, btnImg, tg) => new Promise(done => {
    const how = HOWIN[it], a1 = btnImg.getBoundingClientRect(), a2 = tg.getBoundingClientRect(), W = Math.min(a2.width * 0.8, 170), cx = a2.left + a2.width / 2;
    const fl = document.createElement("img"); fl.className = "kq-fly2"; fl.src = bkImg(how === "scoop" ? "flour-scoop" : it); fl.onerror = () => { fl.onerror = null; fl.src = bkImg(it); };
    fl.style.cssText = "left:" + a1.left + "px;top:" + a1.top + "px;width:" + a1.width + "px;height:" + a1.height + "px"; document.body.appendChild(fl);
    const above = a2.top - W * 0.72;
    requestAnimationFrame(() => { fl.style.left = (cx - W / 2) + "px"; fl.style.top = above + "px"; fl.style.width = W + "px"; fl.style.height = W + "px"; });
    const bowlY = a2.top + a2.height * 0.42;
    if (how === "crack") setTimeout(() => {   // the egg taps the rim, cracks in two and the egg drops in
      const r = fl.getBoundingClientRect(); fl.remove();
      ["top", "bot"].forEach(k => { const h = document.createElement("img"); h.className = "kq-half " + k; h.src = bkImg("egg"); h.style.cssText = "left:" + r.left + "px;top:" + r.top + "px;width:" + r.width + "px;height:" + r.height + "px"; document.body.appendChild(h); setTimeout(() => h.remove(), 900); });
      const y = document.createElement("i"); y.className = "kq-yolkdrop"; y.style.cssText = "left:" + (cx - W * 0.22) + "px;top:" + (r.top + r.height * 0.5) + "px;width:" + (W * 0.44) + "px;height:" + (W * 0.36) + "px;--fall:" + Math.max(10, bowlY - r.top - r.height * 0.5) + "px";
      document.body.appendChild(y); setTimeout(() => { y.remove(); done(); }, 650); }, 650);
    else if (how === "scoop") setTimeout(() => { fl.classList.add("tipit"); setTimeout(() => rain(cx, above + W * 0.6, bowlY, ["#FFFFFF", "#F6F1E7", "#FFF8EC"], 26, Math.max(5, W * 0.06), "powder"), 200);
      setTimeout(() => { fl.src = bkImg("flour-scoop-empty"); }, 750); setTimeout(() => { fl.style.opacity = "0"; }, 1050); setTimeout(() => { fl.remove(); done(); }, 1300); }, 650);
    // Nov 17: the jar tips around its middle, moved over so its LID (where the flakes come out) is right above the bowl
    // sea sugar: the shell lid pops off first, and the sugar pours from the open mouth (Nov 17)
    else if (how === "shake") setTimeout(() => { const op = it === "sea-sugar", mx = op ? 0.107 : 0.344, my = op ? 0.075 : 0.241, gap = op ? 0.12 : 0.05;
      if (op) { const r0 = fl.getBoundingClientRect(), lid = document.createElement("img"); lid.className = "kq-lidpop"; lid.src = bkImg("sea-sugar-lid");
        lid.style.cssText = "left:" + (r0.left + r0.width * 0.17) + "px;top:" + r0.top + "px;width:" + (r0.width * 0.66) + "px"; document.body.appendChild(lid); setTimeout(() => lid.remove(), 1100); fl.src = bkImg("sea-sugar-open"); }
      fl.style.left = (cx + W * mx - W / 2) + "px"; fl.style.top = (a2.top - W * (my + gap) - W / 2) + "px"; fl.classList.add("shakeit2"); setTimeout(() => rain(cx, a2.top - W * gap, bowlY, SHAKECOL[it] || ["#fff"], 30, Math.max(4, W * 0.05), it === "kelp-flakes" ? "flake" : "crystal"), 150);
      setTimeout(() => { fl.style.opacity = "0"; }, 1100); setTimeout(() => { fl.remove(); done(); }, 1350); }, 650);
    else { requestAnimationFrame(() => { fl.style.transform = "scale(.5) rotate(40deg)"; fl.style.opacity = "0"; }); setTimeout(() => { fl.remove(); done(); }, 700); }
  });
  // her step pictures stacked in one frame; only one (or a cross-fade) shows at a time
  const pic = (srcs, cls) => '<span class="kq-pic ' + (cls || "") + '">' + srcs.map((x, i) => '<img class="pf pf' + i + '" src="' + bkImg(x) + '" alt=""' + (i ? ' style="opacity:0"' : "") + ">").join("") + "</span>";
  const showFrame = (el, i) => { if (!el) return; el.querySelectorAll(".pf").forEach((im, j) => { im.style.opacity = j === i ? 1 : 0; }); el.classList.remove("plop"); void el.offsetWidth; el.classList.add("plop"); };
  const root = document.createElement("div"); root.className = "kdgame"; root.id = "kqbake";
  root.innerHTML = '<div class="kdstage kq-bakestage"><div class="kdbg" style="background-image:url(' + K + 'town/bakery-bg.webp)"></div><div class="kdui"></div></div>';
  document.body.appendChild(root); BK = root; const ui = root.querySelector(".kdui");
  const crab = pose => '<img class="kq-bakecrab" src="' + bkImg("baker-" + pose) + '" alt="">';
  const card = (n, sayTxt, body, pose) => crab(pose || "point") + '<div class="kdbox kq-bakebox"><small class="kq-stepn">Step ' + n + " of 3</small><h2>" + esc(sayTxt) + "</h2>" + body + "</div>";
  const result = (n, pts, nextFn, wait) => { score.push(pts); const w = pts === 3 ? "\u{1F31F} Perfect!" : pts === 2 ? "\u{1F44D} Good!" : "\u{1F605} Oops!";
    const b = ui.querySelector(".kq-bakebox"); if (b) b.insertAdjacentHTML("beforeend", '<p class="kq-stepres r' + pts + '">' + w + "</p>");
    const c = ui.querySelector(".kq-bakecrab"); if (c) c.src = bkImg(pts === 1 ? "baker-oops" : "baker-cheer");
    setTimeout(nextFn, wait || 1100); };
  const steps = T[2];
  const run = i => {
    if (i >= steps.length) return finish();
    const S = steps[i], n = i + 1, next = () => run(i + 1);
    ui.onclick = null; ui.onpointerdown = null; ui.onpointerup = null;
    if (S.t === "order") {
      const sh = S.items.map((x, j) => [x, j]).sort(() => Math.random() - 0.5); let nx = 0, miss = 0;
      ui.innerHTML = card(n, S.say, (S.items.length > 1 ? "<p>In order: " + S.items.map((x, j) => "<b>" + (j + 1) + ". " + esc(BAKE_NAMES[x] || x) + "</b>").join(" → ") + "</p>" : "<p>Tap it!</p>") +
        '<div class="kq-bakescene' + (S.items.some(x => HOWIN[x]) ? " roomtop" : "") + '">' + (S.frames ? pic(S.frames, "kq-bk-into") : S.into === "sushi-mat" ? MAT("") : vessel(S.into, "kq-bk-into")) + '</div><div class="kq-ingbtns">' +
        sh.map(([x, j]) => '<button data-ing="' + j + '"><img src="' + bkImg(x) + '" alt=""><small>' + esc(BAKE_NAMES[x] || x) + "</small></button>").join("") + "</div>");
      ui.onclick = ev => { const b = ev.target.closest("[data-ing]"); if (!b || b.disabled) return;
        if (Number(b.dataset.ing) === nx) { b.disabled = true; b.classList.add("in"); nx++;
          { const im = b.querySelector("img"), tg = ui.querySelector(".kq-bk-into"); if (im && tg && HOWIN[S.items[nx - 1]]) { const it1 = S.items[nx - 1], vv1 = vOf(S.into), k3 = nx; ui.classList.add("kq-busy");
              addIn(it1, im, tg).then(() => { ui.classList.remove("kq-busy"); if (S.frames) { showFrame(ui.querySelector(".kq-pic.kq-bk-into"), k3); return; } if (!vv1.items.includes(it1)) vv1.items.push(it1); const w = ui.querySelector(".kq-ves.v-" + S.into); if (w) w.outerHTML = vessel(S.into, "kq-bk-into plop");
                if (nx >= S.items.length && S.after) setTimeout(() => { const w2 = ui.querySelector(".kq-ves.v-" + S.into); if (w2) w2.outerHTML = vessel(S.after, "kq-bk-into plop"); }, 450); }); }
            else if (im && tg) { const a1 = im.getBoundingClientRect(), a2 = tg.getBoundingClientRect(), fl = im.cloneNode(); fl.className = "kq-fly";
            fl.style.cssText = "left:" + a1.left + "px;top:" + a1.top + "px;width:" + a1.width + "px;height:" + a1.height + "px"; document.body.appendChild(fl);
            requestAnimationFrame(() => { fl.style.left = (a2.left + a2.width / 2 - a1.width / 2) + "px"; fl.style.top = (a2.top + a2.height * 0.2) + "px"; fl.style.transform = "scale(.5) rotate(40deg)"; fl.style.opacity = "0"; }); setTimeout(() => fl.remove(), 700); } } const t = ui.querySelector(".kq-bk-into") || ui.querySelector(".kq-mat"); t.classList.remove("plop"); void t.offsetWidth; t.classList.add("plop");
          if (S.frames && HOWIN[S.items[nx - 1]]) { /* her picture changes when its animation ends (above) */ }
          else if (S.frames) { const fr = ui.querySelector(".kq-pic.kq-bk-into"), k2 = nx;
            if (S.drop && fr) { for (let q = 0; q < 9; q++) { const d = document.createElement("img"); d.className = "kq-drop"; d.src = bkImg(S.drop); d.style.left = (30 + Math.random() * 40) + "%"; d.style.animationDelay = (q * 0.06) + "s"; fr.appendChild(d); setTimeout(() => d.remove(), 1200); } }
            setTimeout(() => showFrame(fr, k2), S.drop ? 650 : 250); }
          else if (HOWIN[S.items[nx - 1]] && S.into !== "sushi-mat") { /* added when its animation ends (above) */ }
          else { const it0 = S.items[nx - 1], vv = vOf(S.into);
            if (it0 === "boba-jar") vv.boba = true; else if (it0 === "batter-cups") vv.rainbow = true; else if (S.into !== "sushi-mat") vv.items.push(it0);
            if (S.into !== "sushi-mat") { const w = ui.querySelector(".kq-ves.v-" + S.into); if (w) w.outerHTML = vessel(S.into, "kq-bk-into plop"); } }
          if (S.into === "sushi-mat") { const ly = ui.querySelector(".kq-sheet"); if (ly) ly.insertAdjacentHTML("beforeend", '<i class="ly ' + S.items[nx - 1] + '"></i>'); }
          if (nx >= S.items.length) { if (S.after && !HOWIN[S.items[nx - 1]]) { setTimeout(() => { const w = ui.querySelector(".kq-ves.v-" + S.into); if (w) w.outerHTML = vessel(S.after, "kq-bk-into plop"); }, 450); } ui.onclick = null; result(n, miss === 0 ? 3 : miss === 1 ? 2 : 1, next, HOWIN[S.items[nx - 1]] ? 2300 : 1100); } }
        else { miss++; b.classList.add("no"); setTimeout(() => b.classList.remove("no"), 400); } };
    } else if (S.t === "mash") {
      let c = 0, t0 = 0, over = false;
      const fxx = S.fx || "";
      const extra = fxx === "chop" ? '<span class="kq-fxlog"><i class="kq-log2"></i></span><span class="kq-fxknife">\u{1F52A}</span><span class="kq-fxpieces"></span>' :
        (fxx === "wiggle" || fxx === "frost") && S.pop ? '<img class="kq-fxpop" src="' + treatImg(S.pop) + '" alt="">' : "";
      ui.innerHTML = card(n, S.say, '<p>Tap it as fast as you can!</p><button class="kq-stir fx-' + fxx + '" data-stir="1">' + (S.frames ? pic(S.frames, "kq-mimg") : fxx === "roll" ? MAT('<i class="ly seaweed"></i><i class="ly rice"></i><i class="ly fillings"></i>', '<i class="kq-log2 rolling"></i>') : vessel(S.img, "kq-mimg")) + extra + (S.tool ? '<img class="kq-tool" src="' + bkImg(S.tool) + '" alt="">' : "") + '</button><div class="kq-meter"><i></i></div><p class="small" id="kqstirt">5 seconds</p>');
      { const tl0 = ui.querySelector(".kq-stir.fx-stir .kq-tool"); if (tl0) { tl0.style.left = "62%"; tl0.style.top = "34%"; } }
      const end = () => { if (over) return; over = true; ui.onclick = null; result(n, c >= 15 ? 3 : c >= 9 ? 2 : 1, next); };
      ui.onclick = ev => { if (!ev.target.closest("[data-stir]") || over) return;
        if (!t0) { t0 = performance.now(); const iv = setInterval(() => { const left = 5 - (performance.now() - t0) / 1000, e = document.getElementById("kqstirt"); if (e) e.textContent = Math.max(0, Math.ceil(left)) + " seconds"; if (left <= 0 || over) { clearInterval(iv); end(); } }, 100); }
        c++; const m = ui.querySelector(".kq-meter i"); if (m) m.style.width = Math.min(100, c / 15 * 100) + "%";
        const u = Math.min(1, c / 15), st = ui.querySelector(".kq-stir"), mi = ui.querySelector(".kq-mimg"), tl = ui.querySelector(".kq-tool");
        if (fxx === "rollpic" && mi) { const fi = c >= 15 ? S.frames.length - 1 : Math.min(S.frames.length - 1, Math.floor(u * S.frames.length)); if (mi.dataset.f !== String(fi)) { mi.dataset.f = fi; showFrame(mi, fi); } mi.style.transform = "scale(" + (c % 2 ? 1.03 : .97) + ",1)"; }
        else if (fxx === "shake" && mi) { mi.style.transform = "rotate(" + (c % 2 ? 12 : -12) + "deg) translateY(" + (c % 2 ? -6 : 0) + "px)"; }
        else if (fxx === "stir" && tl) { const ang = c * 0.9; tl.style.left = (50 + Math.cos(ang) * 12) + "%"; tl.style.top = (34 + Math.sin(ang) * 4) + "%"; tl.style.rotate = (Math.cos(ang) * 14) + "deg"; }
        else if (fxx === "knead" && mi) { mi.style.transform = c % 2 ? "scale(1.18,.82)" : "scale(.9,1.1)"; }
        else if (fxx === "roll") {   // the sheet rolls up from the bottom edge into a log that turns as it goes
          const sh = ui.querySelector(".kq-sheet"), lg = ui.querySelector(".kq-log2"); const left = 1 - u * 0.86;
          if (sh) sh.style.clipPath = "inset(0 0 " + ((1 - left) * 100) + "% 0)";
          if (lg) { const th = 12 + u * 22; lg.style.height = th + "%"; lg.style.top = "calc(" + (8 + left * 84) + "% - " + th / 2 + "%)"; lg.style.backgroundPosition = "0 " + (c * 14) + "px"; } }
        else if (fxx === "chop") { const kn = ui.querySelector(".kq-fxknife"); if (kn) { kn.classList.remove("cut"); void kn.offsetWidth; kn.classList.add("cut"); kn.style.left = (30 + (c % 5) * 10) + "%"; }
          if (c % 3 === 0) { const pc = ui.querySelector(".kq-fxpieces"); const lg = ui.querySelector(".kq-fxlog .kq-log2"); if (pc && pc.children.length < 5) { pc.insertAdjacentHTML("beforeend", '<img src="' + treatImg("sushi") + '" alt="">'); if (lg) lg.style.width = (100 - pc.children.length * 19) + "%"; } } }
        else if (fxx === "wiggle" && mi) { mi.style.transform = "rotate(" + (c % 2 ? 9 : -9) + "deg)"; const pp = ui.querySelector(".kq-fxpop"); if (pp) { pp.style.opacity = u > 0.6 ? (u - 0.6) / 0.4 : 0; pp.style.transform = "translate(-50%," + (-50 - u * 70) + "%) scale(" + (0.6 + 0.4 * u) + ")"; }
          if (S.frames && S.frames.length > 1) { const ims = mi.querySelectorAll(".pf"), e = Math.max(0, Math.min(1, (u - 0.55) / 0.35)); if (ims[0]) ims[0].style.opacity = 1 - e; if (ims[1]) ims[1].style.opacity = e; } }
        else if (fxx === "frost") { const pp = ui.querySelector(".kq-fxpop"); if (pp) { pp.style.opacity = Math.min(1, u * 1.4); pp.style.transform = "translate(-50%," + (-50 - Math.max(0, u - 0.6) / 0.4 * 38) + "%) scale(" + (0.5 + 0.5 * u) + ")"; }
          { const lq = ui.querySelector(".kq-stir .kq-vliq"); if (lq) lq.style.opacity = String(0.8 * (1 - Math.max(0, Math.min(1, (u - 0.6) / 0.35)))); }
          if (S.frames && S.frames.length > 1 && mi) { const ims = mi.querySelectorAll(".pf"), e = Math.max(0, Math.min(1, (u - 0.6) / 0.35)); if (ims[0]) ims[0].style.opacity = 1 - e; if (ims[1]) ims[1].style.opacity = e; } if (tl) { tl.style.left = (35 + (c % 4) * 10) + "%"; tl.style.rotate = (c % 2 ? -20 : 10) + "deg"; } }
        else { st.classList.remove("wig"); void st.offsetWidth; st.classList.add("wig"); if (tl) tl.style.rotate = (c % 2 ? 25 : -25) + "deg"; }
        if (c >= 15) end(); };
    } else if (S.t === "stop") {
      let x = 0, dir = 1, done = false, raf = 0, last = performance.now();
      ui.innerHTML = card(n, S.say, '<p>Tap <b>Now!</b> when the marker is in the <b style="color:#2a9d4b">green</b>.</p><div class="kq-bakescene' + (S.fx === "sprinkle" ? " roomtop" : "") + '"><span class="kq-bk-item">' + vessel(S.item, "") + '</span><span class="kq-arrow">➡️</span>' + vessel(S.into, "kq-bk-into") + '</div>' +
        '<div class="kq-heat"><span class="g"></span><i></i></div><button class="btn gold big" data-out="1">\u{1F44F} Now!</button>');
      const go = now => { if (done) return; const dt = (now - last) / 1000; last = now; x += dir * dt * 75; if (x > 100) { x = 100; dir = -1; } if (x < 0) { x = 0; dir = 1; } const m = ui.querySelector(".kq-heat i"); if (m) m.style.left = x + "%"; raf = requestAnimationFrame(go); };
      raf = requestAnimationFrame(go);
      ui.onclick = ev => { if (!ev.target.closest("[data-out]") || done) return; done = true; cancelAnimationFrame(raf); ui.onclick = null; const d = Math.abs(x - 50);
        const it = ui.querySelector(".kq-bk-item"), into = ui.querySelector(".kq-bk-into");
        const ar = ui.querySelector(".kq-bakescene .kq-arrow"); if (ar) ar.style.opacity = "0";
        const a = it && it.getBoundingClientRect(), b = into && into.getBoundingClientRect();
        if (S.fx === "sprinkle" && a && b) {   // the shaker goes above the pretzel and shakes the salt down onto it
          // Nov 17: the shaker's holes (the gold cap, about 30% across and 58% down its picture) go right above the pretzel
          const hx = a.left + a.width * 0.3, hy = a.top + a.height * 0.58, dx = b.left + b.width / 2 - hx, dy = b.top + b.height * 0.05 - hy;
          it.style.transition = "transform .55s ease-in-out"; it.style.transform = "translate(" + dx + "px," + dy + "px)"; it.style.zIndex = "3";
          setTimeout(() => { it.classList.add("shakeit"); rain(b.left + b.width / 2, b.top + b.height * 0.05, b.top + b.height * 0.45, ["#FFFFFF", "#EAF6FF"], 34, 6, "crystal"); }, 600);
          result(n, d <= 8 ? 3 : d <= 20 ? 2 : 1, next, 2200); }
        else if (a && b) {   // into the oven / the cold clam, for real
          const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height * 0.55 - (a.top + a.height / 2);
          it.style.transition = "transform .8s cubic-bezier(.5,0,.4,1), opacity .3s ease .6s"; it.style.transform = "translate(" + dx + "px," + dy + "px) scale(.42)"; it.style.zIndex = "3";
          setTimeout(() => { it.style.opacity = "0"; }, 650);
          setTimeout(() => into.classList.add(S.fx === "cool" ? "freezing" : "baking"), 800);
          if (S.after) setTimeout(() => { const sc = ui.querySelector(".kq-bakescene"); if (sc) sc.innerHTML = pic([S.after], "kq-bk-into plop kq-afterpic") + '<span class="kq-sparkle">✨</span>'; }, 1900);
          result(n, d <= 8 ? 3 : d <= 20 ? 2 : 1, next, S.after ? 3200 : 2300); }
        else result(n, d <= 8 ? 3 : d <= 20 ? 2 : 1, next); };
    } else if (S.t === "knife") {
      // 🔪 Nov 17 (Ms. Ariana): the knife is already in place above the sushi, held flat like a real kitchen knife. Tap to chop!
      let cuts = 0, busy = false, t0 = 0; const NEED = 5;
      ui.innerHTML = card(n, S.say, '<p><b>Tap</b> to chop the sushi into 5 pieces!</p>' +
        '<div class="kq-knifescene"><div class="kq-kboard" data-chop="1"><img class="kq-kbimg" src="' + bkImg("board-shell") + '" alt=""><span class="kq-klog"><img src="' + bkImg("sushi-7-log") + '" alt=""></span>' +
        '<img class="kq-kknife" src="' + bkImg("knife-side") + '" alt="Knife"></div></div>' +
        '<div class="kq-kpieces"></div><p class="small" id="kqkhint">\u{1F363} 0 of ' + NEED + " pieces</p>");
      const bd = ui.querySelector(".kq-kboard"), lg = ui.querySelector(".kq-klog"), kn = ui.querySelector(".kq-kknife"), hint = ui.querySelector("#kqkhint");
      // where the next cut goes (from the right end of the roll), as a share of the board
      const cutAt = k => { const L = 0.12, W = 0.76; return L + W * (1 - (k + 1) / (NEED + 1)); };
      const place = () => { kn.style.left = (cutAt(cuts) * 100 - 11.5) + "%"; };
      place();
      const chop = () => {
        if (busy || cuts >= NEED) return; busy = true; if (!t0) t0 = performance.now();
        { const kr = kn.getBoundingClientRect(), lr = lg.getBoundingClientRect(); kn.style.setProperty("--dy", Math.max(10, lr.top + lr.height * 0.55 - kr.bottom) + "px"); }
        kn.classList.remove("chop"); void kn.offsetWidth; kn.classList.add("chop");
        setTimeout(() => {
          cuts++; lg.style.clipPath = "inset(0 " + ((1 - (cutAt(cuts - 1) - 0.12) / 0.76) * 100) + "% 0 0)";
          ui.querySelector(".kq-kpieces").insertAdjacentHTML("beforeend", '<img src="' + bkImg("sushi-8-piece") + '" alt="">');
          hint.innerHTML = "\u{1F363} " + cuts + " of " + NEED + " pieces";
        }, 160);
        setTimeout(() => { busy = false; if (cuts >= NEED) { ui.onclick = null; const secs = (performance.now() - t0) / 1000; result(n, secs <= 5 ? 3 : secs <= 9 ? 2 : 1, next); } else place(); }, 380);
      };
      ui.onclick = ev => { if (ev.target.closest("[data-chop]")) chop(); };
    } else if (S.t === "hold") {
      let lvl = 0, holding = false, done = false, raf = 0, last = 0;
      ui.innerHTML = card(n, S.say, '<p>Press and <b>hold</b>, then let go when it’s in the <b style="color:#2a9d4b">green</b>.</p><div class="kq-bakescene"><img class="kq-bk-item pour" src="' + bkImg(S.item) + '" alt=""><span class="kq-stream" style="background:' + (S.col || "#FFB3D1") + '"></span><span class="kq-intowrap">' +
        (S.base ? pic([S.base].concat(S.fill.map(f => f[0])), "kq-bk-into kq-pourpic") : vessel(S.into, "kq-bk-into") + '<span class="kq-liq" style="background:' + (S.col || "#FFB3D1") + '"></span>') + '</span><div class="kq-fill"><i></i><span class="g"></span></div></div>' +
        '<button class="btn gold big kq-holdbtn" data-hold="1">\u{1FAD7} Hold to pour</button>');
      const go = now => { if (done || !holding) return; const dt = last ? (now - last) / 1000 : 0; last = now; lvl = Math.min(100, lvl + dt * 32); const f = ui.querySelector(".kq-fill i"); if (f) f.style.height = lvl + "%"; const lq = ui.querySelector(".kq-liq"); if (lq) lq.style.height = (lvl * 0.6) + "%";
        if (S.base) { const ims = ui.querySelectorAll(".kq-pourpic .pf"); ims[0].style.opacity = 1; S.fill.forEach((f, j) => { ims[j + 1].style.opacity = Math.max(0, Math.min(1, (lvl - f[1]) / (f[2] - f[1]))); }); } if (lvl >= 100) return stop(); raf = requestAnimationFrame(go); };
      const stop = () => { if (done) return; done = true; holding = false; potIn(false); cancelAnimationFrame(raf); const it = ui.querySelector(".kq-bk-item"); if (it) it.classList.remove("tip"); const sm = ui.querySelector(".kq-stream"); if (sm) sm.classList.remove("on"); const vv = vOf(S.into); vv.col = S.col || "#FFB3D1"; vv.lv = Math.round(lvl * 0.6); const d = Math.abs(lvl - 78); result(n, d <= 7 ? 3 : d <= 16 ? 2 : 1, next); };
      // 🫗 Nov 17 (Ms. Ariana): the pot moves over the mold and tips, and the stream falls from its spout into the mold
      const real = S.base && S.item !== "tea-pitcher";
      let sm = null;
      const potIn = on => { const it = ui.querySelector(".kq-bk-item"), mo = ui.querySelector(".kq-intowrap"); if (!real || !it || !mo) return;
        if (!sm) { sm = document.createElement("i"); sm.className = "kq-pourline"; document.body.appendChild(sm); }
        if (!on) { it.style.transform = ""; sm.remove(); return; }
        it.style.transform = ""; const a = it.getBoundingClientRect(), b = mo.getBoundingClientRect();
        const L = S.item === "jelly-pitcher" ? -1 : 1;   // the jelly pitcher's spout is on its left, so it tips the other way
        const cx = b.left + b.width * (L > 0 ? 0.3 : 0.7), cy = b.top - a.height * 0.2;   // where the pot's middle goes
        it.style.transition = "transform .35s ease-out"; it.style.transformOrigin = "50% 50%"; it.style.zIndex = "4";
        it.style.transform = "translate(" + (cx - (a.left + a.width / 2)) + "px," + (cy - (a.top + a.height / 2)) + "px) rotate(" + (55 * L) + "deg)";
        setTimeout(() => { if (!holding) return; const sx = cx + L * a.width * 0.5, sy = cy + a.height * 0.08, ey = b.top + b.height * 0.5;
          if (!sm.isConnected) return; sm.style.cssText = "display:block;position:fixed;left:" + (sx - 5) + "px;top:" + sy + "px;width:10px;height:" + Math.max(10, ey - sy) + "px;margin:0;background:" + (S.col || "#FFB3D1") + ";border-radius:5px;opacity:.9;z-index:9999;pointer-events:none"; }, 330); };
      if (real) { const sm0 = ui.querySelector(".kq-stream"); if (sm0) sm0.style.display = "none"; const sc0 = ui.querySelector(".kq-bakescene"); if (sc0) sc0.classList.add("roomtop"); }
      ui.onpointerdown = ev => { if (!ev.target.closest("[data-hold]") || done) return; ev.preventDefault(); holding = true; last = 0; const it = ui.querySelector(".kq-bk-item"); if (it) it.classList.add("tip"); const sm = ui.querySelector(".kq-stream"); if (sm) sm.classList.add("on"); potIn(true); raf = requestAnimationFrame(go); };
      ui.onpointerup = () => { if (holding && !done) stop(); };
    }
  };
  const finish = () => {
    const stars = Math.max(1, Math.round(score.reduce((a, b) => a + b, 0) / score.length)), pearls = BAKE_PEARLS[stars];
    const k = A.kdOf(o.st, o.cls), bk = { w: wk, t: Object.assign({}, (k.bk || {}).t || {}) }; bk.t[T[0]] = (Number(bk.t[T[0]]) || 0) + 1; k.bk = bk; k.p = (Number(k.p) || 0) + pearls; A.save(k);
    ui.innerHTML = crab("cheer") + '<div class="kdbox kq-bakebox"><h2>\u{1F389} You baked a ' + esc(T[1]) + '!</h2><img class="kq-bakeout" src="' + treatImg(T[0]) + '" alt=""><p class="kq-stars">' + "⭐".repeat(stars) + '<span style="opacity:.25">' + "⭐".repeat(3 - stars) + "</span></p><p><b>+" + pearls + " pearls!</b> It’s in your Treat Box.</p>" +
      '<button class="btn gold" data-bkdone="1">Back to the Bakery</button></div>';
    ui.onclick = ev => { if (!ev.target.closest("[data-bkdone]")) return; root.remove(); BK = null; bakeSay = stars === 3 ? "Perfect! Three stars! You’re a real sea baker!" : "Yum! Nice baking!"; A.rer(); };
  };
  ui.innerHTML = crab("point") + '<div class="kdbox kq-bakebox"><h2>\u{1F9C1} Let’s bake a ' + esc(T[1]) + "!</h2><p>3 quick steps. Each one can be <b>Perfect</b>, <b>Good</b> or <b>Oops</b>. More stars = more pearls!</p>" +
    '<img class="kq-bakeout" src="' + treatImg(T[0]) + '" alt=""><button class="btn gold big" data-bkgo="1">\u{1F44C} Start!</button></div>';
  ui.onclick = ev => { if (ev.target.closest("[data-bkgo]")) run(0); };
}
function salonHTML(st, cls) {
  const o = cur(), k = o ? o.k : {}, own = (st && st.outfits) || {}, on = st && st.outfitOn, c = companionOf(st);
  const tryId = salonTry || on, look = Object.assign({}, st, { outfits: Object.assign({}, own, tryId ? { [tryId]: true } : {}), outfitOn: tryId || "" });
  let h = backTown + '<div class="kdscene kq-salon" style="background-image:url(' + K + 'town/salon-bg.webp)">' +
    '<div class="kq-mirror">' + (c ? petWithHead(look, c, null, null) : "") + "<small>" + (salonTry ? "\u{1F440} Trying on: " + esc((SALON.concat([["sea-shell-tiara", "", "Shell Tiara"]]).find(x => x[0] === salonTry) || [])[2] || "") : "\u{1FA9E} The mirror") + "</small></div>" +
    '<div class="kq-salonshop">' + SALON.concat(own["sea-shell-tiara"] ? [["sea-shell-tiara", "shell-tiara", "Shell Tiara (Baron prize)", 0]] : []).map(([id, pic, n, price]) => {
      const mine = !!own[id], wearing = on === id;
      return '<div class="kq-salonitem' + (salonTry === id ? " try" : "") + '"><img src="' + K + "outfit-" + pic + '.webp" alt=""><b>' + esc(n) + "</b>" +
        '<div class="row" style="gap:4px;justify-content:center;flex-wrap:wrap;"><button class="btn small ghost" data-kd2="stry:' + id + '">\u{1F440} Try</button>' +
        (mine ? '<button class="btn small' + (wearing ? "" : " gold") + '" data-kd2="swear:' + id + '">' + (wearing ? "✅ Wearing" : "Wear it") + "</button>" : '<button class="btn small' + ((Number(k.p) || 0) >= price ? " gold" : " ghost") + '" data-kd2="sbuy:' + id + '">⚪ ' + price + "</button>") + "</div></div>"; }).join("") + "</div>" +
    guide("salon", st, salonSay ? "cheer" : null, salonSay || "Try anything on! Everything you buy is yours forever.") + "</div>";
  salonSay = null; return h;
}
function salonBuy(id) {
  const o = cur(); if (!o) return; const it = SALON.find(x => x[0] === id); if (!it) return; const st = o.st, k = o.k, own = st.outfits || {};
  if (own[id]) return; const p = Number(k.p) || 0;
  if (p < it[3]) { salonSay = "You need <b>" + (it[3] - p) + " more pearls</b> for the " + esc(it[2]) + "."; A.rer(); return; }
  if (typeof confirm === "function" && !confirm("Buy the " + it[2] + " for " + it[3] + " pearls?")) return;
  k.p = p - it[3]; salonTry = null; salonSay = "Gorgeous! The <b>" + esc(it[2]) + "</b> is yours! You’re wearing it now.";
  A.save(k, { outfits: Object.assign({}, own, { [id]: true }), outfitOn: id });
}
function salonWear(id) { const o = cur(); if (!o) return; const st = o.st; if (!(st.outfits || {})[id]) return; salonTry = null; A.save(o.k, { outfitOn: st.outfitOn === id ? "" : id }); }

export const RANK_PRIZE = { Page: 50, Squire: 50, Captain: 75, "Grand Royal": 300 };   // Baron: the Shell Tiara (Nov 16, the fins were removed)
// rank prizes that are gear: [outfit id, picture name, name]
export const RANK_EGG = { Duke: "rare", Royal: "ultra", "Grand Royal": "leg" };   // Royal (week 12): the Kingdom Ultra Egg (Axolumi)   // Nov 17: the Duke prize is a Rare egg (an egg in their Creature Collector, at least Rare)
export const RANK_ROOM = { Legend: ["chair_kdthrone", "Golden Coral Throne"] };   // Legend (week 18): a My Room piece (the chair spot)
export const RANK_GEAR = { Knight: ["sea-knight-helmet", "knight-helmet", "Knight Shell Helmet"], Baron: ["sea-shell-tiara", "shell-tiara", "Shell Tiara"] };   // Nov 15: Page = 50 pearls; Squire 50 (draft, others decided later)
export function rankUpHTML(st) {
  const o = cur(); if (!o) return ""; const k = o.k, r = rankOf(st);
  if (r.n < 2 || k.rk === r.name) return "";
  const need = (RANKS.find(x => x[1] === r.name) || [0])[0], opens = SPOTS.filter(s => s[4] === need);
  return '<div class="kq-rankup"><div class="kq-rankbox"><img class="kq-rankbadge" src="' + K + "rank-" + r.badge + '.webp" alt="">' +
    '<img class="kq-rankduck" src="' + K + 'captain-salute.webp" alt="Captain Duck">' +
    "<small>\u{1F389} You reached the Kingdom " + r.n + " weeks!</small><h2>You are now a <b>" + r.name + "</b>!</h2>" +
    (RANK_GEAR[r.name] ? '<div class="kq-rankgear"><img src="' + K + "outfit-" + RANK_GEAR[r.name][1] + '.webp" alt=""><span>\u{1F381} Your rank prize: the <b>' + RANK_GEAR[r.name][2] + "</b>! Wear it from <b>Gear</b>.</span></div>" : "") +
    (RANK_EGG[r.name] === "rare" ? '<p class="kq-rankprize">\u{1F95A} Your rank prize: <b>a Rare egg</b>! Hatch it in your <b>Creature Collector</b>.</p>' : "") +
    (RANK_EGG[r.name] === "leg" ? '<p class="kq-rankprize">\u{1F95A} Your rank prize: <b>a Legendary egg</b>! Hatch it in your <b>Creature Collector</b>.</p>' : "") +
    (RANK_EGG[r.name] === "ultra" ? '<div class="kq-rankgear"><img src="' + K + 'ultra/ultra-egg-360.webp" alt=""><span>\u{1F308} Your rank prize: the <b>Kingdom Ultra Egg</b>! It hatches when you tap Let\u2019s go.</span></div>' : "") +
    (RANK_ROOM[r.name] ? '<div class="kq-rankgear"><img src="' + K + 'throne-gold.webp" alt=""><span>\u{1F381} Your rank prize: the <b>' + RANK_ROOM[r.name][1] + "</b>! Put it in <b>My Room</b> (in the chair spot) and your companion can sit on it.</span></div>" +
      '<div class="kq-rankgear"><span class="kq-rgfig">' + statueFig(st, "") + "</span><span>\u{1F5FF} And a <b>golden statue of your companion</b> now stands in the castle garden for everyone to see!</span></div>" : "") +
    (RANK_PRIZE[r.name] ? '<p class="kq-rankprize">\u{1F381} Your rank prize: <b>⚪ ' + RANK_PRIZE[r.name] + " pearls</b></p>" : "") +
    (opens.length ? '<p>A new place just opened on the map:</p><div class="kq-rankopens">' + opens.map(s => "<span>" + s[1] + "</span>").join("") + "</div>" : "") +
    '<button class="btn gold big" data-kd2="rankok:1">\u{1F30A} Let’s go!</button></div></div>';
}



/* ===================== 🌋 Undersea Arena (opens at Duke, week 10) — Nov 17, Ms. Ariana =====================
   A new sea boss every Kingdom week (4 take turns). Students pick up to 3 of their own collector creatures and battle it
   with the moves they know (Attack, Power Move, Guard, Heal, their Special, Swap). Hitting its weak types does double.
   Tries are unlimited; the first win each week pays 100 pearls and that boss's badge (kept forever).
   Save: kd.ar = { w: week, won: 1, tries }, kd.arb = { kraken: 1, ... } (badges). Nothing else is saved. */
export const ARENA_BOSSES = [
  { k: "kraken", n: "The Kraken", type: "Water", weak: ["Electric", "Nature"], atk: "Tentacle Slam", line: "Who dares enter MY volcano vents? I’ll squish you with all eight arms!" },
  { k: "shark-king", n: "The Shark King", type: "Water", weak: ["Electric", "Nature"], atk: "Royal Chomp", line: "Bow before your king! Nobody beats my trident and my 300 teeth!" },
  { k: "ghost-crab", n: "The Ghost Pirate Crab", type: "Ghost", weak: ["Light", "Dark"], atk: "Phantom Pinch", line: "Arrr! Yer treasure belongs to ME now! Snip snip!" },
  { k: "anglerfish", n: "The Giant Anglerfish", type: "Dark", weak: ["Light", "Fire"], atk: "Lantern Lure", line: "Ooh, look at my pretty light… come closer… CHOMP!" }];
export const ARENA_PAY = 100;
const AR = K + "arena/";
const bossOf = wk => (typeof window !== "undefined" && window.__kqBoss && ARENA_BOSSES.find(b => b.k === window.__kqBoss)) || ARENA_BOSSES[Math.floor(hash01("arena|" + wk) * 1e6) % ARENA_BOSSES.length];   // __kqBoss: preview videos only
let arTeam = null, arSay = null, ARB = null;
function arFams(st) { return ownedFams(st).sort((a, b) => (crOwned(st)[b].lvl || 1) - (crOwned(st)[a].lvl || 1)); }
function arPick(f) { const o = cur(); if (!o) return; arTeam = arTeam || arFams(o.st).slice(0, 3); const i = arTeam.indexOf(f);
  if (i >= 0) arTeam.splice(i, 1); else if (arTeam.length < 3) arTeam.push(f); else { arSay = "You can bring <b>3 creatures</b>. Tap one to take it out first."; } A.rer(); }
const crImg = (st, f) => { const e = crOwned(st)[f], c = formOf(f, e.lvl || 1); return e.sparkle ? sparkleImg(c) : c.img; };
export function arenaHTML(st, cls) {
  visit("arena");
  const o = cur(), k = o ? o.k : {}, wk = A.wk(cls), B = bossOf(wk), ar = k.ar && k.ar.w === wk ? k.ar : {}, arb = k.arb || {}, fams = arFams(st);
  if (!arTeam) arTeam = fams.slice(0, 3); arTeam = arTeam.filter(f => crOwned(st)[f]);
  let h = '<div class="kdscene kq-arena" style="background-image:url(' + AR + 'arena-bg.webp)">' +
    '<div class="kq-arboss"><img class="kq-arbossimg" src="' + AR + "boss-" + B.k + '.webp" alt="' + esc(B.n) + '"><span class="kq-tag">' + (ar.won ? "✅ You beat " : "\u{1F525} This week: ") + "<b>" + esc(B.n) + "</b></span></div>" +
    '<div class="kq-arweak"><b>Weak to:</b> ' + B.weak.map(t => '<span class="kq-artype">' + t + "</span>").join(" ") + "</div>";
  h += guide("arena", st, arSay ? null : ar.won ? "cheer" : null, arSay || (ar.won ? "You beat " + esc(B.n) + " this week! A new boss comes next week. You can battle again just for fun." : "<b>" + esc(B.n) + ":</b> “" + esc(B.line) + "”")) + "</div>";
  h += '<div class="kq-log"><b>⚔️ Pick your team</b> <span class="small">' + arTeam.length + " of 3</span>" +
    (fams.length ? '<div class="kq-arpick">' + fams.map(f => { const e = crOwned(st)[f], c = formOf(f, e.lvl || 1), on = arTeam.includes(f), wk2 = B.weak.some(t => (c.types || []).includes(t) || c.atkType === t);
      return '<button class="kq-arcr' + (on ? " on" : "") + '" data-kd2="arpick:' + esc(f) + '"><img src="' + esc(crImg(st, f)) + '" alt=""><b>' + esc(e.nick || c.name) + "</b><small>Lv " + (e.lvl || 1) + (wk2 ? " · ⚡ strong!" : "") + "</small></button>"; }).join("") + "</div>" +
      '<div class="row" style="justify-content:center;margin-top:10px;"><button class="btn gold big" data-kd2="argo:1"' + (arTeam.length ? "" : " disabled") + ">⚔️ Battle " + esc(B.n) + "!</button></div>"
      : "<p>You need a creature first! Hatch one in your <b>Creature Collector</b>.</p>") + "</div>";
  h += '<div class="kq-log"><b>\u{1F3C5} Boss badges</b> <span class="small">' + ARENA_BOSSES.filter(b => arb[b.k]).length + " of " + ARENA_BOSSES.length + '</span><div class="kq-arbadges">' +
    ARENA_BOSSES.map(b => '<span class="kq-logslot' + (arb[b.k] ? " got" : "") + '"><img src="assets/badges/badge-boss-' + b.k + '.webp" alt=""><small>' + (arb[b.k] ? esc(b.n) : "???") + "</small></span>").join("") + "</div>" +
    '<p class="small muted" style="margin:6px 0 0;">A new boss every week you reach the Kingdom. First win each week: +' + ARENA_PAY + " pearls and the boss’s badge.</p></div>";
  arSay = null; return h;
}
function startArena() {
  const o = cur(); if (!o || ARB) return; const st = o.st, wk = A.wk(o.cls), B = bossOf(wk);
  const team = (arTeam || []).filter(f => crOwned(st)[f]).slice(0, 3).map(f => fighterFrom(st, f)).filter(Boolean); if (!team.length) return;
  // the boss is sized to this team: about 9 good hits to beat it, and it takes about 4 of its hits to knock out one creature
  const base = fighterFrom(st, team[0].fam), boss = Object.assign({}, base, { fam: "boss", id: "boss", name: B.n, species: B.n, img: AR + "boss-" + B.k + ".webp", sparkle: false, face: "L", type: B.type, types: [B.type], weak: B.weak.slice(), attack: B.atk,
    dodge: 0, poison: 0, daze: 0, alt: null, more: null, pierce: 0, sp: [], ux: null, boosts: null, candyFx: false, brewFx: false, atkHeal: 0, atkDefDown: 0 });
  boss.df = 40;
  const avgD = team.reduce((n, f) => n + hitDamage(f, Object.assign({}, boss, { weak: [] }), false).dmg, 0) / team.length;
  const avgHp = team.reduce((n, f) => n + f.hp, 0) / team.length, avgDf = team.reduce((n, f) => n + f.df, 0) / team.length;
  boss.hp = boss.cur = Math.max(30, Math.round(avgD * (team.length === 1 ? 6 : team.length === 2 ? 8 : 9)));
  boss.dmg = Math.max(1, Math.round(avgHp / 4 * (50 + avgDf) / 50));
  const bt = { a: { id: "me", name: st.name || "You" }, b: { id: "boss", name: B.n }, team: { A: team, B: [boss] }, active: { A: 0, B: 0 }, moves: { A: null, B: null }, log: [], status: "fight", turn: "A", round: 0 };
  const root = document.createElement("div"); root.className = "kdgame kq-argame"; root.id = "kqarena"; document.body.appendChild(root);
  ARB = { root, bt, B, lines: ["\u{1F30B} <b>" + esc(B.n) + "</b> rises from the volcano vents!"], phase: "fight", busy: false };
  const k0 = A.kdOf(st, o.cls), ar0 = k0.ar && k0.ar.w === wk ? Object.assign({}, k0.ar) : { w: wk }; ar0.tries = (Number(ar0.tries) || 0) + 1; ARB.won0 = !!ar0.won; ARB.ar = ar0;
  arDraw(); root.onclick = arClick;
}
const fmtLine = e => e.k === "hit" ? "<b>" + esc(e.a) + "</b> used " + esc(e.atk) + "! " + (e.miss ? "It missed!" : (e.weak ? "<b>Super effective!</b> " : "") + e.dmg + " damage.") : e.k === "faint" ? "\u{1F4AB} <b>" + esc(e.n) + "</b> fainted!" :
  e.k === "guard" ? "\u{1F6E1}️ <b>" + esc(e.n) + "</b> is guarding." : e.k === "heal" ? "\u{1F49A} <b>" + esc(e.n) + "</b> healed " + (e.amt || "") + " HP!" : e.k === "swap" ? "\u{1F504} Go, <b>" + esc(e.n) + "</b>!" : e.k === "ux" ? esc(e.t) : "";
function arDraw(fx) {
  const R = ARB; if (!R) return; const bt = R.bt, bo = bt.team.B[0];
  if (!bt.team.A[bt.active.A]) bt.active.A = Math.max(0, bt.team.A.findIndex(f => f.cur > 0));
  const me = bt.team.A[bt.active.A];
  const hp = f => '<span class="qhp"><span style="width:' + Math.max(0, f.cur / f.hp * 100) + '%"></span></span><small>' + Math.max(0, f.cur) + " / " + f.hp + "</small>";
  let h = '<div class="kdstage kq-arstage"><div class="kdbg" style="background-image:url(' + AR + 'arena-bg.webp)"></div>' +
    '<div class="kq-arfoe' + (fx === "hitB" ? " hit" : "") + '"><div class="qbbar"><b>' + esc(bo.name) + "</b>" + hp(bo) + '</div><img src="' + esc(bo.img) + '" alt=""></div>' +
    '<div class="kq-armine' + (fx === "hitA" ? " hit" : "") + '"><div class="qbbar"><b>' + esc(me.name) + "</b> <small>Lv " + me.lvl + "</small>" + hp(me) + '</div><img src="' + esc(me.img) + '" alt=""></div>' +
    '<div class="kq-arteam">' + bt.team.A.map((f, i) => '<button class="kq-armate' + (i === bt.active.A ? " on" : "") + (f.cur <= 0 ? " out" : "") + '" data-arswap="' + i + '"' + (i === bt.active.A || f.cur <= 0 || R.phase !== "fight" ? " disabled" : "") + ' title="Swap in"><img src="' + esc(f.img) + '" alt=""><i style="width:' + Math.max(0, f.cur / f.hp * 100) + '%"></i></button>').join("") + "</div>" +
    '<div class="kdbox kq-arbox' + (R.phase !== "fight" ? " end" : "") + '"><p class="kq-arlog">' + ((R.phase !== "fight" ? R.lines.slice(-2) : R.lines).join("<br>") || "&nbsp;") + "</p>";
  if (R.phase === "won") h += '<div class="kq-arend"><img class="kq-arduck" src="' + K + 'duck/volcano-victory.webp" alt=""><div><h2>\u{1F3C6} You beat ' + esc(R.B.n) + "!</h2>" +
    (R.paid ? '<p><b>+' + ARENA_PAY + " pearls</b> and the <b>" + esc(R.B.n) + "</b> badge!</p>" : "<p>You already won this week, so this one was just for fun!</p>") +
    (R.paid ? '<img class="kq-arbadge" src="assets/badges/badge-boss-' + R.B.k + '.webp" alt="">' : "") + '<button class="btn gold big" data-ar="done">\u{1F30A} Back to the Arena</button></div></div>';
  else if (R.phase === "lost") h += '<div class="kq-arend"><img class="kq-arduck" src="' + K + 'duck/volcano-tryagain.webp" alt=""><div><h2>\u{1F4A8} So close!</h2><p>Your team needs a rest. ' + esc(R.B.n) + " is weak to <b>" + R.B.weak.join(" and ") + "</b>, so try again with creatures of those types!</p>" +
    '<div class="row" style="gap:8px;justify-content:center;"><button class="btn gold big" data-ar="again">\u{1F501} Try again</button><button class="btn" data-ar="done">Leave</button></div></div></div>';
  else { const d = hitDamage(me, bo, false), b = (m, label, sub, ok) => '<button class="mvbtn mv-' + m + '" data-armove="' + m + '"' + (ok && !R.busy ? "" : " disabled") + ">" + MOVES[m].icon + " <b>" + label + "</b><small>" + sub + "</small></button>";
    h += '<div class="mvgrid">' + b("attack", esc(me.attack), "about " + d.dmg + " damage" + (d.weak ? " · super effective!" : ""), true) + b("power", "Power Move", "about " + Math.round(d.dmg * MOVES.power.mult) + " · 75% to hit", true) +
      (me.alt ? b("alt", esc(me.alt.name), "your special", moveOk(bt, "A", { m: "alt" })) : "") + b("guard", "Guard", "take half damage", true) + b("heal", "Heal", me.healed ? "already used" : "+35% HP (once)", moveOk(bt, "A", { m: "heal" })) + "</div>" +
      '<p class="small" style="margin:6px 0 0;">Tap a teammate at the bottom to swap them in (uses your turn).</p>'; }
  h += '</div><button class="btn ghost small kdskip" data-ar="quit">✖ Leave</button></div>';
  R.root.innerHTML = h;
}
function arRound(mv) {
  const R = ARB, bt = R.bt, before = bt.log.length, bo = bt.team.B[0], hpB = bo.cur, me0 = bt.team.A[bt.active.A], hpA = me0.cur;
  const r = Math.random(); bt.moves = { A: mv, B: r < 0.7 ? { m: "attack" } : r < 0.85 ? { m: "power" } : { m: "guard" } };
  resolveRound(bt);
  R.lines = bt.log.slice(before).map(fmtLine).filter(Boolean);
  const fx = bo.cur < hpB ? "hitB" : me0.cur < hpA ? "hitA" : "";
  if (bo.cur <= 0) return arWin(fx);
  if (bt.team.A.every(f => f.cur <= 0)) { R.phase = "lost"; R.lines.push("All your creatures are tired out!"); arSave(false); return arDraw(fx); }
  if (!bt.team.A[bt.active.A] || bt.team.A[bt.active.A].cur <= 0) { const n = bt.team.A.findIndex(f => f.cur > 0); bt.active.A = n; R.lines.push("\u{1F504} Go, <b>" + esc(bt.team.A[n].name) + "</b>!"); }
  arDraw(fx);
}
function arWin(fx) {
  const R = ARB; R.phase = "won"; R.lines.push("\u{1F389} <b>" + esc(R.B.n) + "</b> swims away! You WIN!"); R.paid = !R.won0; arSave(true); arDraw(fx);
  try { for (let i = 0; i < 26; i++) { const c = document.createElement("i"); c.className = "kq-arconf"; c.style.left = Math.random() * 100 + "%"; c.style.animationDelay = Math.random() * 0.8 + "s"; c.style.background = ["#FFD45C", "#FF6FB5", "#5BC8FF", "#7BE07A"][i % 4]; R.root.appendChild(c); } } catch (e) {}
}
function arSave(won) {
  const o = cur(); if (!o) return; const R = ARB, k = A.kdOf(o.st, o.cls), ar = Object.assign({}, R.ar);
  if (won && !R.won0) { ar.won = 1; k.p = (Number(k.p) || 0) + ARENA_PAY; k.arb = Object.assign({}, k.arb || {}, { [R.B.k]: 1 }); }
  k.ar = ar; A.save(k);
}
function arClick(ev) {
  const R = ARB; if (!R) return; const t = ev.target.closest("[data-armove],[data-arswap],[data-ar]"); if (!t) return;
  if (t.dataset.ar === "quit" || t.dataset.ar === "done") { R.root.remove(); ARB = null; A.rer(); return; }
  if (t.dataset.ar === "again") { R.root.remove(); ARB = null; startArena(); return; }
  if (R.phase !== "fight" || R.busy) return;
  if (t.dataset.armove) { const mv = { m: t.dataset.armove }; if (!moveOk(R.bt, "A", mv)) return; R.busy = true; arDraw(); setTimeout(() => { R.busy = false; arRound(mv); }, 250); return; }
  if (t.dataset.arswap != null) { const mv = { m: "swap", to: Number(t.dataset.arswap) }; if (!moveOk(R.bt, "A", mv)) return; arRound(mv); }
}

/* 🌈 Royal rank (week 12): the Kingdom Ultra Egg hatches Axolumi, the Royal Hatchling (Ms. Ariana's Ultra, 4 forms) */
function showUltraHatch(dupe) {
  const root = document.createElement("div"); root.className = "kq-rankup"; root.id = "kqultra";
  root.innerHTML = '<div class="kq-rankbox kq-ultrabox"><div class="kq-ucrack"><img class="kq-uegg" src="' + K + 'ultra/ultra-egg-360.webp" alt=""><img class="kq-ubaby" src="' + K + 'ultra/axolumi-360.webp" alt="Axolumi"><i class="kq-urays"></i></div>' +
    '<small>\u{1F308} ULTRA LEGENDARY!</small><h2>' + (dupe ? "Axolumi got <b>+5 levels</b>!" : "<b>Axolumi</b>, the Royal Hatchling!") + "</h2>" +
    '<p>The Kingdom’s most protected pearl cracked open just for you. Find Axolumi in your <b>\u{1F308} Ultra Legendaries</b>. It grows into <b>Corallume</b> at level 25, <b>Regolotl</b> at 50 and <b>Axolarch</b> at 75!</p>' +
    '<button class="btn gold big" data-kqu="ok">\u{1F49C} Welcome, Axolumi!</button></div>';
  document.body.appendChild(root);
  root.onclick = e => { if (e.target.closest("[data-kqu]")) root.remove(); };
}


/* ===================== 🏛️ Sunken City (opens at Grand Royal, week 15) — Nov 17, Ms. Ariana =====================
   🗝️ The Lost Crown: 5 relic pieces hidden in the ruins. Each Kingdom week (from week 15) the student searches 6 rubble piles
   for that week's piece (it's always under one of them). All 5 rebuild the Lost Crown, a wearable crown (outfit sea-lost-crown).
   🐋 Whale Song Hall: the whale sings a pattern on 4 shells; repeat it. The song grows one note each round.
   +5 pearls a round on the first 2 songs each week (more songs just for fun). Best song kept.
   Save: kd.ct = { p: [piece keys], fw: week found, dug: [piles dug this week] }, kd.ws = { w, n: paid songs, best }. */
export const RELICS = [["band", "Golden Crown Band"], ["shell", "Rainbow Shell"], ["pearl", "Moon Pearl"], ["coral", "Royal Coral"], ["gem", "Ocean Heart Gem"]];
const CT = K + "city/", PILES = [[16, 70], [34, 80], [50, 66], [66, 82], [82, 70], [42, 54]], SONG_PAY = 5, SONG_PAID = 2;
let cityView = "", citySay = null;
const ctOf = k => { const c = k.ct || {}; return { p: (c.p || []).slice(), fw: c.fw || "", dug: (c.dug || []).slice(), dw: c.dw || "" }; };
export function cityHTML(st, cls) {
  visit("city");
  if (cityView === "whale") return whaleHTML(st, cls);
  const o = cur(), k = o ? o.k : {}, wk = A.wk(cls), c = ctOf(k), done = c.p.length >= RELICS.length, found = c.fw === wk, next = RELICS[c.p.length];
  const dug = c.dw === wk ? c.dug : [];
  let h = '<div class="kdscene kq-city" style="background-image:url(' + CT + 'city-bg.webp)">';
  if (!done && !found) h += PILES.map(([x, y], i) => dug.includes(i) ? '<span class="kq-pile dug" style="left:' + x + "%;top:" + y + '%">\u{1F4A8}</span>'
    : '<button class="kq-pile" style="left:' + x + "%;top:" + y + '%" data-kd2="dig:' + i + '" title="Search here"><span>\u{1FAA8}</span></button>').join("");
  h += '<div class="kq-shbtns"><button class="btn" data-kd2="city:whale">\u{1F40B} Whale Song Hall</button></div>';
  h += guide("city", st, citySay ? "cheer" : null, citySay || (done ? "You rebuilt the <b>Lost Crown</b>! Wear it any time from <b>Gear</b>." : found ? "You found this week’s relic! Come back next week for the next piece." : "This week’s relic is the <b>" + next[1] + "</b>. Tap the rubble piles to search for it!")) + "</div>";
  h += '<div class="kq-log"><b>\u{1F451} The Lost Crown</b> <span class="small">' + c.p.length + " of " + RELICS.length + ' pieces</span><div class="kq-relics">' +
    RELICS.map(([key, n]) => '<span class="kq-logslot' + (c.p.includes(key) ? " got" : "") + '"><img src="' + CT + "relic-" + key + '.webp" alt=""><small>' + (c.p.includes(key) ? esc(n) : "???") + "</small></span>").join("") +
    '<span class="kq-logslot crown' + (done ? " got" : "") + '"><img src="' + CT + 'lost-crown.webp" alt=""><small>' + (done ? "The Lost Crown" : "5 pieces = the crown") + "</small></span></div>" +
    '<p class="small muted" style="margin:6px 0 0;">One relic piece every week you reach the Kingdom. All 5 rebuild the Lost Crown (wear it from Gear).</p></div>';
  citySay = null; return h;
}
function digPile(i) {
  const o = cur(); if (!o) return; const k = o.k, wk = A.wk(o.cls), c = ctOf(k); if (c.p.length >= RELICS.length || c.fw === wk) return;
  if (c.dw !== wk) { c.dw = wk; c.dug = []; } if (c.dug.includes(i)) return; c.dug.push(i);
  // the piece is under one pile, picked from the week + student, but never more than 4 digs (so it never feels unfair)
  const hide = Math.floor(hash01("relic|" + wk + "|" + (o.st.id || "")) * PILES.length), hit = i === hide || c.dug.length >= 4;
  if (hit) { const key = RELICS[c.p.length][0]; c.p.push(key); c.fw = wk; k.ct = c; k.p = (Number(k.p) || 0) + 20; A.save(k);
    if (c.p.length >= RELICS.length) { showCrown(); return; }
    showRelic(key); return; }
  k.ct = c; citySay = ["Just sand and old shells… keep looking!", "Nope, only a sleepy crab here! Try another pile.", "Hmm, not here. It must be close!"][c.dug.length % 3]; A.save(k);
}
function showRelic(key) {
  const R = RELICS.find(r => r[0] === key), root = document.createElement("div"); root.className = "kq-rankup"; root.id = "kqrelic";
  root.innerHTML = '<div class="kq-rankbox"><img class="kq-relicfound" src="' + CT + "relic-" + key + '.webp" alt=""><small>\u{1F5DD}️ You found a relic!</small><h2>The <b>' + esc(R[1]) + "</b></h2>" +
    "<p>One more piece of the Lost Crown! <b>+20 pearls</b>. Come back next week for the next piece.</p><button class=\"btn gold big\" data-kqr=\"ok\">\u{1F451} Yay!</button></div>";
  document.body.appendChild(root); root.onclick = e => { if (e.target.closest("[data-kqr]")) { root.remove(); A.rer(); } };
}
function showCrown() {
  const root = document.createElement("div"); root.className = "kq-rankup"; root.id = "kqcrown";
  root.innerHTML = '<div class="kq-rankbox kq-crownbox"><div class="kq-crownbuild">' + RELICS.map(([key], i) => '<img class="kq-cpiece p' + i + '" src="' + CT + "relic-" + key + '.webp" alt="">').join("") +
    '<img class="kq-cfull" src="' + CT + 'lost-crown.webp" alt="The Lost Crown"></div><small>\u{1F389} All 5 relics!</small><h2>You rebuilt <b>the Lost Crown</b>!</h2>' +
    "<p>It’s yours to wear! You’re wearing it now. Change it any time from <b>Gear</b>.</p><button class=\"btn gold big\" data-kd2=\"crownok:1\">\u{1F451} Wear it!</button></div>";
  document.body.appendChild(root);
}
function crownDone() {
  const r = document.getElementById("kqcrown"); if (r) r.remove();
  const o = cur(); if (!o) return; const st = o.st;
  citySay = "You did it! The <b>Lost Crown</b> shines again!"; A.save(o.k, { outfits: Object.assign({}, st.outfits || {}, { "sea-lost-crown": true }), outfitOn: "sea-lost-crown" });
}

/* ----- 🐋 Whale Song Hall ----- */
const SHELLS = ["pink", "blue", "gold", "green"], NOTE = [196, 233, 277, 330];   // low whale calls
let SONG = null;
const wsOf = (k, wk) => { const w = k.ws || {}; return { w: wk, n: w.w === wk ? Number(w.n) || 0 : 0, best: Number(w.best) || 0 }; };
function whaleHTML(st, cls) {
  visit("whale");
  const o = cur(), k = o ? o.k : {}, wk = A.wk(cls), ws = wsOf(k, wk), left = Math.max(0, SONG_PAID - ws.n);
  let h = '<div class="row" style="margin:0 0 8px;"><button class="btn ghost small" data-kd2="city:">← Sunken City</button></div>';
  h += '<div class="kdscene kq-whale" style="background-image:url(' + CT + 'whale-hall-bg.webp)"><img class="kq-whalesinger" src="' + CT + 'whale.webp" alt="The singing whale">' +
    '<div class="kq-shells">' + SHELLS.map(c => '<span class="kq-shell"><img src="' + CT + "shell-" + c + '.webp" alt=""></span>').join("") + "</div>" +
    '<div class="kq-shbtns"><button class="btn gold big" data-kd2="wsgo:1">\u{1F3B5} Listen to the song!</button></div>' +
    guide("whale", st, null, left ? "You have <b>" + left + " song" + (left === 1 ? "" : "s") + "</b> left this week that pay pearls (+5 a round)." : "No more pearl songs this week, but you can sing just for fun!") + "</div>";
  h += '<div class="kq-log"><b>\u{1F3B6} My best song</b> <span class="small">' + (ws.best ? ws.best + " notes long" : "no songs yet") + "</span>" +
    '<p class="small muted" style="margin:6px 0 0;">Each round the song gets one note longer. +' + SONG_PAY + " pearls a round on your first " + SONG_PAID + " songs each week.</p></div>";
  return h;
}
// 🐋 Nov 17 (Ms. Ariana: "deeper, like whale sounds"): a low whale call that swoops up and back down, with a slow wobble and an echo
function beepNote(i) { try { const a = window.__ckAC || (window.__ckAC = new (window.AudioContext || window.webkitAudioContext)()), t = a.currentTime, f = NOTE[i], D = 0.8;
  const out = a.createGain(); out.gain.value = 1; const lp = a.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1400; lp.connect(out); out.connect(a.destination);
  const dl = a.createDelay(); dl.delayTime.value = 0.28; const fb = a.createGain(); fb.gain.value = 0.35; dl.connect(fb); fb.connect(dl); dl.connect(lp);
  const lfo = a.createOscillator(), lg = a.createGain(); lfo.frequency.value = 5; lg.gain.value = f * 0.02; lfo.connect(lg); lfo.start(t); lfo.stop(t + D + 0.1);
  [[1, "sine", 0.32], [2, "sine", 0.1], [0.5, "triangle", 0.06]].forEach(([m, ty, v]) => { const o = a.createOscillator(), g = a.createGain(); o.type = ty;
    o.frequency.setValueAtTime(f * m * 0.8, t); o.frequency.linearRampToValueAtTime(f * m * 1.1, t + D * 0.4); o.frequency.linearRampToValueAtTime(f * m * 0.95, t + D);
    if (m === 1) lg.connect(o.frequency);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.12); g.gain.setValueAtTime(v, t + D * 0.55); g.gain.exponentialRampToValueAtTime(0.0001, t + D);
    o.connect(g); g.connect(lp); g.connect(dl); o.start(t); o.stop(t + D + 0.05); }); } catch (e) {} }
function startSong() {
  const o = cur(); if (!o || SONG) return; const wk = A.wk(o.cls), ws = wsOf(o.k, wk), paid = ws.n < SONG_PAID;
  const root = document.createElement("div"); root.className = "kdgame"; root.id = "kqsong"; document.body.appendChild(root);
  SONG = { root, seq: [], at: 0, round: 0, phase: "sing", paid, done: 0 };
  root.innerHTML = '<div class="kdstage kq-songstage"><div class="kdbg" style="background-image:url(' + CT + 'whale-hall-bg.webp)"></div><img class="kq-whalesinger big" src="' + CT + 'whale.webp" alt="">' +
    '<div class="kq-shells game">' + SHELLS.map((c, i) => '<button class="kq-shell" data-sh="' + i + '"><img src="' + CT + "shell-" + c + '.webp" alt=""></button>').join("") + "</div>" +
    '<div class="kq-songbar"><b id="kqsongmsg">\u{1F442} Listen…</b><span id="kqsongn"></span></div><button class="btn ghost small kdskip" data-sx="quit">✖ Leave</button></div>';
  root.onclick = songClick; setTimeout(nextRound, 700);
}
function nextRound() {
  const S = SONG; if (!S) return; S.round++; S.seq.push(Math.floor(Math.random() * 4)); S.at = 0; S.phase = "sing";
  const msg = S.root.querySelector("#kqsongmsg"), n = S.root.querySelector("#kqsongn"); msg.textContent = "\u{1F442} Listen…"; n.textContent = "Round " + S.round + " · " + S.seq.length + " notes";
  S.root.querySelector(".kq-whalesinger").classList.add("sing");
  const gap = Math.max(560, 850 - S.round * 30);   // room for each whale call
  S.seq.forEach((v, j) => setTimeout(() => { if (SONG !== S) return; flashShell(v); }, 500 + j * gap));
  setTimeout(() => { if (SONG !== S) return; S.phase = "you"; msg.textContent = "\u{1F449} Your turn! Tap the shells in the same order."; S.root.querySelector(".kq-whalesinger").classList.remove("sing"); }, 500 + S.seq.length * gap);
}
function flashShell(i) { const b = SONG && SONG.root.querySelectorAll(".kq-shell")[i]; if (!b) return; b.classList.remove("lit"); void b.offsetWidth; b.classList.add("lit"); beepNote(i); }
function songClick(ev) {
  const S = SONG; if (!S) return; const x = ev.target.closest("[data-sx]");
  if (x) { if (x.dataset.sx === "quit" || x.dataset.sx === "done") { if (x.dataset.sx === "quit" && S.phase !== "over") songEnd(true); S.root.remove(); SONG = null; A.rer(); } return; }
  const b = ev.target.closest("[data-sh]"); if (!b || S.phase !== "you") return; const v = Number(b.dataset.sh); flashShell(v);
  if (v !== S.seq[S.at]) { b.classList.add("wrong"); return songEnd(); }
  S.at++; if (S.at >= S.seq.length) { S.done = S.round; S.phase = "wait"; S.root.querySelector("#kqsongmsg").textContent = "\u{1F31F} Perfect! The song gets longer…"; setTimeout(nextRound, 1100); }
}
function songEnd(quiet) {
  const S = SONG; if (!S || S.phase === "over") return; S.phase = "over";
  const o = cur(), pearls = S.paid ? S.done * SONG_PAY : 0;
  if (o) { const k = o.k, wk = A.wk(o.cls), ws = wsOf(k, wk); if (S.paid) ws.n++; ws.best = Math.max(ws.best, S.done); k.ws = ws; k.p = (Number(k.p) || 0) + pearls; A.save(k); }
  if (quiet) return;
  { const m = S.root.querySelector(".kq-songbar"); if (m) m.remove(); }
  const box = document.createElement("div"); box.className = "kdbox kq-songend";
  box.innerHTML = '<img class="kdboximg" src="' + K + "duck/whale-" + (S.done >= 3 ? "cheer" : "listen") + '.webp" alt=""><h2>' + (S.done ? "\u{1F3B6} You sang " + S.done + " round" + (S.done === 1 ? "" : "s") + "!" : "Oops, wrong shell!") + "</h2>" +
    "<p>" + (S.paid ? "<b>+" + pearls + " pearls!</b>" : "This one was just for fun.") + " The song was " + S.seq.length + " notes long.</p>" +
    '<button class="btn gold" data-sx="done">Back to the Whale Song Hall</button>';
  S.root.querySelector(".kdstage").appendChild(box);
}


/* ===================== 🗿 Legend (week 18) — Nov 17, Ms. Ariana =====================
   The top rank. Prize: the Golden Coral Throne (a My Room piece for the chair spot). A golden statue of the student's
   own companion stands in the castle garden (always their companion right now, so nothing extra is saved for it).
   First visit: pull the cloth off (the unveiling). Then every week sand and seaweed get on it: rub the dirty spots
   to polish it, +20 pearls once a week. Classmates who are Legends too show in the Hall of Legends (from the cards already loaded).
   Save: kd.lg = { u: 1 unveiled, pw: week polished }. */
const LG_PAY = 20, SMUDGES = [[30, 22, 34], [62, 30, 30], [44, 52, 38], [24, 66, 30], [70, 64, 32], [50, 82, 34], [56, 14, 26]];
let lgSay = null;
export function statueFig(st, extra) {
  const c = companionOf(st);
  return '<span class="kq-statue' + (extra || "") + '"><img class="kq-ststand" src="' + K + 'garden/statue-stand.webp" alt="">' +
    '<span class="kq-stfig">' + (c ? petHTML(c, null, null) : "") + "</span>" + (String(extra || "").includes("covered") ? '<img class="kq-minicloth" src="' + K + 'garden/statue-cloth.webp" alt="">' : "") + "</span>";
}
const first = st => esc(String((st && st.name) || "").split(" ")[0]);
export function statueHTML(st, cls) {
  visit("statue");
  const o = cur(), k = o ? o.k : {}, wk = A.wk(cls), lg = k.lg || {}, c = companionOf(st), dirty = lg.u && lg.pw !== wk;
  let h = '<div class="kdscene kq-lgscene" style="background-image:url(' + K + 'garden/garden-bg.webp)"><div class="kq-lgglow"></div>';
  h += '<div class="kq-lgbig' + (lg.u && !dirty ? " shiny" : "") + (!lg.u ? " veiled" : "") + '">' + statueFig(st, "") +
    (dirty ? '<span class="kq-smudges">' + SMUDGES.map(([x, y, w], i) => { const v = smKeep(wk)[i]; return v != null && v <= 0.12 ? "" : '<i class="kq-smudge" data-sm="' + i + '" data-v="' + (v == null ? 1 : v) + '" style="left:' + x + "%;top:" + y + "%;width:" + w + "%;opacity:" + (v == null ? 1 : Math.max(0, v)) + '"></i>'; }).join("") + "</span>" : "") +
    (!lg.u ? '<span class="kq-cloth"><img class="kq-clothon" src="' + K + 'garden/statue-cloth.webp" alt="A cloth covering the statue"><img class="kq-clothfly" src="' + K + 'garden/statue-cloth-fly.webp" alt=""></span>' : "") +
    '<span class="kq-plate">\u{1F531} Legend ' + first(st) + (c ? "<small>and " + esc(c.nick || c.name || "") + "</small>" : "") + "</span></div>";
  h += '<div class="kq-shbtns">' + (!lg.u ? '<button class="btn gold big" data-kd2="unveil">\u{1F389} Pull off the cloth!</button>'
    : dirty ? '<span class="kq-tag">\u{1F9FD} Rub the dirty spots to polish your statue! <b id="kqsmleft">' + SMUDGES.filter((x, i) => !(smKeep(wk)[i] <= 0.12)).length + "</b> left</span>" : '<span class="kq-tag">✨ Polished this week!</span>') + "</div>";
  h += guide("statue", st, lgSay ? "cheer" : null, lgSay || (!lg.u ? "The Queen made something special for you. Pull off the cloth!" : dirty ? "Oh no, sand and seaweed got on your statue this week! Rub it clean for <b>+" + LG_PAY + " pearls</b>." : "Shining bright! Come back next week to polish it again.")) + "</div>";
  const mates = ((o && o.C.mates) || []).filter(s => s && s.id !== st.id && s.kd && s.kd.rk === "Legend").slice(0, 12);
  h += '<div class="kq-log"><b>\u{1F3DB}️ Hall of Legends</b> <span class="small">classmates who reached the Kingdom 18 weeks</span>' +
    (mates.length ? '<div class="kq-mates">' + mates.map(s => '<div class="kq-mate">' + statueFig(s, " mini") + "<small>\u{1F531} " + first(s) + "</small></div>").join("") + "</div>"
      : '<p class="small muted" style="margin:6px 0 0;">You’re the first Legend in your class!</p>') + "</div>";
  lgSay = null; setTimeout(bindSmudges, 30);
  return h;
}
function unveil() {
  const o = cur(); if (!o || (o.k.lg || {}).u) return;
  const big = document.querySelector(".kq-lgbig"); if (big) { big.classList.add("unveil"); const b = document.querySelector('[data-kd2="unveil"]'); if (b) b.disabled = true; }
  confetti(document.querySelector(".kq-lgscene"));
  setTimeout(() => { const q = cur(); if (!q) return; q.k.lg = Object.assign({}, q.k.lg || {}, { u: 1, pw: A.wk(q.cls) });   // brand new and shiny: the first polish is next week
    lgSay = "Ta-da! <b>Legend " + first(q.st) + "</b>! The whole Kingdom will see your golden statue!"; A.save(q.k); }, 2200);
}
function confetti(sc) {
  if (!sc) return; const box = document.createElement("div"); box.className = "kq-confetti";
  box.innerHTML = Array.from({ length: 36 }, (_, i) => '<i style="left:' + (4 + (i * 37) % 92) + "%;animation-delay:" + ((i % 9) * 0.12).toFixed(2) + "s;background:" + ["#FFD23F", "#FF5DA2", "#3EC1F3", "#8E5CF7", "#2ED47A"][i % 5] + '"></i>').join("");
  sc.appendChild(box); setTimeout(() => box.remove(), 4200);
}
let smLeft = 0, smDone = false, smV = { wk: "", v: {} };   // rubbing progress survives page redraws
const smKeep = wk => { if (smV.wk !== wk) smV = { wk, v: {} }; return smV.v; };
function bindSmudges() {
  const wrap = document.querySelector(".kq-lgbig .kq-smudges"); if (!wrap || wrap.dataset.on) return; wrap.dataset.on = "1";
  smLeft = wrap.querySelectorAll(".kq-smudge").length; smDone = false; if (!smLeft) { polished(); return; }
  const rub = (el, amt) => { if (!el || el.classList.contains("gone")) return; const v = (Number(el.dataset.v || 1)) - amt; el.dataset.v = v; smV.v[el.dataset.sm] = v; el.style.opacity = Math.max(0, v);
    if (v <= 0.12) { el.classList.add("gone"); smLeft--; sparkle(el); const n = document.getElementById("kqsmleft"); if (n) n.textContent = Math.max(0, smLeft); if (smLeft <= 0) polished(); } };
  const big = wrap.closest(".kq-lgbig");
  const under = e => document.elementsFromPoint(e.clientX, e.clientY).filter(t => t.classList && t.classList.contains("kq-smudge"));   // every spot under the finger gets rubbed
  big.addEventListener("pointerdown", e => under(e).forEach(t => rub(t, 0.34)));
  big.addEventListener("pointermove", e => under(e).forEach(t => rub(t, e.pointerType === "mouse" && !e.buttons ? 0.06 : 0.14)));
}
function sparkle(el) { const s = document.createElement("b"); s.className = "kq-smsp"; s.textContent = "✨"; s.style.left = el.style.left; s.style.top = el.style.top; el.parentNode.appendChild(s); setTimeout(() => s.remove(), 900); }
function polished() {
  if (smDone) return; smDone = true; const o = cur(); if (!o) return; const wk = A.wk(o.cls);
  const big = document.querySelector(".kq-lgbig"); if (big) big.classList.add("shiny");
  setTimeout(() => { const q = cur(); if (!q || (q.k.lg || {}).pw === wk) return; q.k.lg = Object.assign({}, q.k.lg || {}, { pw: wk }); q.k.p = (Number(q.k.p) || 0) + LG_PAY;
    lgSay = "Sparkling! Your statue shines again. <b>+" + LG_PAY + " pearls</b>!"; A.save(q.k); }, 1300);
}
