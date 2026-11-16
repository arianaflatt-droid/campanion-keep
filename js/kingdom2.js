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
import { esc } from "./game.js?v=20261116e";
import { startPaint } from "./hangar.js?v=20261116e";

const K = "assets/kingdom/";
export const KEEP2 = ["aq", "aqf", "cg", "sub", "seen", "sh", "rk", "rkp", "ship"];
export const kd2On = (cls, preview) => !!preview || !!(cls && cls.kd2On);

/* ----- ranks: weeks the student reached the Kingdom (= Treasures of the Week they have) ----- */
export const RANKS = [[1, "Guest", ""], [2, "Page", "page"], [3, "Squire", "squire"], [4, "Knight", "knight"], [6, "Captain", "captain"], [8, "Baron", "baron"],
  [10, "Duke", "duke"], [12, "Royal", "royal"], [15, "Grand Royal", "grandroyal"], [18, "Legend", "legend"]];
export const weeksIn = st => Object.keys(((st && st.kd) || {}).g || {}).length;
export function rankOf(st) { const n = Math.max(1, weeksIn(st)); let r = RANKS[0]; RANKS.forEach(x => { if (n >= x[0]) r = x; }); return { n, name: r[1], badge: r[2] }; }
export function rankChip(st) {
  const r = rankOf(st);
  return '<span class="kdrank">' + (r.badge ? '<img src="' + K + "rank-" + r.badge + '.webp" alt="">' : "\u{1F3F7}️") + "<b>" + r.name + "</b><small>week " + r.n + "</small></span>";
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
  garden: { duck: "", img: K + "captain-point.webp", name: "Captain Duck", hi: "Your corals look thirsty! Water each one once a week.",
    how: "This is the <b>Coral Garden</b>! Plant your 3 corals, then <b>water each one once a week</b> and it grows a little. After 3 waterings it’s in <b>full bloom</b>, and you get <b>+25 pearls</b>!" } };
const duckSrc = (g, pose) => g.img || K + "duck/" + g.duck + "-" + pose + ".webp";
export function guide(area, st, pose, line) {
  const g = GUIDE[area], seen = (((st && st.kd) || {}).seen || {})[area];
  const p = seen ? (pose || "welcome") : "explain";
  return '<div class="kq-guide' + (seen ? "" : " first") + '"><img class="kq-duck" src="' + duckSrc(g, p) + '" alt="' + esc(g.name) + '">' +
    '<div class="kq-bub"><b>' + esc(g.name) + ":</b> " + (line || (seen ? g.hi : g.how)) + (seen ? "" : ' <button class="btn gold" data-kd2="seen:' + area + '">Got it! \u{1F44D}</button>') + "</div></div>";
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
  ["town", "\u{1F3D8}️ Coral Town", 66, 88, 8], ["arena", "\u{1F30B} Undersea Arena", 88, 74, 10], ["ice", "❄️ Ice Cave", 13, 13, 12], ["city", "\u{1F3DB}️ Sunken City", 31, 73, 15]];
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
  else if (a === "shiptreasure") openTreasure();
  else if (a === "rankok") { if (!o) return; const nm = rankOf(o.st).name; if (o.k.rk === nm) return;
    const got = o.k.rkp || {}; if (RANK_PRIZE[nm] && !got[nm]) { o.k.p = (Number(o.k.p) || 0) + RANK_PRIZE[nm]; o.k.rkp = Object.assign({}, got, { [nm]: 1 }); }   // each rank's prize is paid only once
    o.k.rk = nm; A.save(o.k); A.rer(); }
});
export function resetViews() { aqTank = -1; dockSay = null; shPick = shName = null; feedOn = false; }

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

export const RANK_PRIZE = { Page: 50, Squire: 50 };   // Nov 15: Page = 50 pearls; Squire 50 (draft, others decided later)
export function rankUpHTML(st) {
  const o = cur(); if (!o) return ""; const k = o.k, r = rankOf(st);
  if (r.n < 2 || k.rk === r.name) return "";
  const need = (RANKS.find(x => x[1] === r.name) || [0])[0], opens = SPOTS.filter(s => s[4] === need);
  return '<div class="kq-rankup"><div class="kq-rankbox"><img class="kq-rankbadge" src="' + K + "rank-" + r.badge + '.webp" alt="">' +
    '<img class="kq-rankduck" src="' + K + 'captain-salute.webp" alt="Captain Duck">' +
    "<small>\u{1F389} You reached the Kingdom " + r.n + " weeks!</small><h2>You are now a <b>" + r.name + "</b>!</h2>" +
    (RANK_PRIZE[r.name] ? '<p class="kq-rankprize">\u{1F381} Your rank prize: <b>⚪ ' + RANK_PRIZE[r.name] + " pearls</b></p>" : "") +
    (opens.length ? '<p>A new place just opened on the map:</p><div class="kq-rankopens">' + opens.map(s => "<span>" + s[1] + "</span>").join("") + "</div>" : "") +
    '<button class="btn gold big" data-kd2="rankok:1">\u{1F30A} Let’s go!</button></div></div>';
}

