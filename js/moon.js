/* ---------- 🌙 Moon Base (built Nov 12; plan: claude/moon-base-and-hidden-ariana-plan.md) ----------
   Every student builds their OWN base on the moon (tap the moon in the Planet JP sky).
   - 8 build pads + 6 decoration spots on moon-base-bg. Buy buildings and decorations from Alien Duck, the Moon Builder,
     with Stardust (bought once, kept forever), place them on any empty spot, move them or put them away.
     The Moon Hut is free. The Moon Palace (1,500) is the big save-up goal.
   - Every building can be entered. Each room has one small daily thing to do (+1 to +5 Stardust, once a day; replays are for fun).
   - Visit a classmate's base (read only, from the public cards the page already has).
   Saved in planet.mb (through safari.js planetSave, one write per buy / move / activity):
     { own: { key: 1 }, pads: [8 keys or ""], dec: { key: 1 }, ds: [6 keys or ""], n: buys,
       in: { room: date paid }, gd: { s: waterings, f: flower }, fl: { flower: 1 }, rc: { recipe: 1 }, cs: { constellation: 1 },
       hs: { game: best }, pl: { d, n } (playhouse taps today), cr: palace crown date, gy: gym glow date } */
import { esc } from "./game.js?v=20261113j";
import { azToday } from "./collect.js?v=20261113j";
import { planetNow, planetSave, planetCtx, freshSt } from "./safari.js?v=20261113j";
import { ownedOf, nebImg, nebHappy, NEB } from "./pets.js?v=20261113j";
import { GAMES, gameByKey, play } from "./spacegames.js?v=20261113j";

const M = "assets/planet/moon/";
export const BUILDINGS = [
  { k: "hut", n: "Moon Hut", c: 0, room: "Cozy Hut" },
  { k: "garage", n: "Rover Garage", c: 300, room: "Rover Rally" },
  { k: "garden", n: "Garden Dome", c: 300, room: "Moon Garden" },
  { k: "pool", n: "Crater Pool", c: 350, room: "Crater Splash" },
  { k: "dish", n: "Dish Tower", c: 350, room: "Space Radio" },
  { k: "lab", n: "Crystal Lab", c: 400, room: "Crystal Mixing" },
  { k: "observatory", n: "Star Observatory", c: 400, room: "Stargazing" },
  { k: "gym", n: "Astro Gym", c: 450, room: "Moon Bounce" },
  { k: "arcade", n: "Moon Arcade", c: 500, room: "Arcade" },
  { k: "playhouse", n: "Nebble Playhouse", c: 500, room: "Nebble Playroom" },
  { k: "palace", n: "Moon Palace", c: 1500, room: "Throne Hall", big: 1 }];
export const DECOS = [["flag", "Star Flag", 30], ["lamp", "Moon Lamp", 40], ["rover", "Toy Rover", 50], ["rocks", "Glowing Rocks", 25], ["bench", "Moon Bench", 35], ["sat", "Mini Satellite", 60]]
  .map(([k, n, c]) => ({ k, n, c }));
const B = {}; BUILDINGS.forEach(b => { B[b.k] = b; }); const D = {}; DECOS.forEach(d => { D[d.k] = d; });
// where things sit on moon-base-bg (% of the scene; y = where the building touches the ground)
const PADS = [[17, 57], [39, 55], [61, 55], [83, 57], [13, 90], [37, 88], [63, 88], [87, 90]];
const DSPOTS = [[6, 70], [28, 70], [50, 68], [72, 70], [94, 70], [50, 97]];
const TALL = ["dish", "observatory"];   // tall pieces stand in the back row so they don't hide the spot behind them
// a tall building on a front spot swaps with a back-row piece (or takes an empty back spot)
function backTall(mb) {
  for (let i = 4; i < 8; i++) { const k = mb.pads[i]; if (!TALL.includes(k)) continue;
    let j = [0, 1, 2, 3].find(x => !mb.pads[x]); if (j == null) j = [0, 1, 2, 3].find(x => !TALL.includes(mb.pads[x]));
    if (j != null) { mb.pads[i] = mb.pads[j]; mb.pads[j] = k; } }
  return mb;
}
const PAY = { hut: 3, garage: 5, garden: 3, pool: 5, dish: 3, lab: 3, observatory: 3, gym: 3, playhouse: 5, palace: 5 };

/* ----- the save ----- */
const today = () => azToday();
export function mbOf(st) {
  const m0 = ((st && st.planet) || {}).mb || {}, m = m0.own || !m0.d ? m0 : {};   // an old Mission Log claim { d, n } (before Nov 12) isn't a Moon Base
  const pads = Array.isArray(m.pads) && m.pads.length === 8 ? m.pads.slice() : ["hut", "", "", "", "", "", "", ""];
  const ds = Array.isArray(m.ds) && m.ds.length === 6 ? m.ds.slice() : ["", "", "", "", "", ""];
  backTall({ pads });
  return { own: Object.assign({ hut: 1 }, m.own || {}), pads, dec: Object.assign({}, m.dec || {}), ds, n: Number(m.n) || 0, in: Object.assign({}, m.in || {}),
    gd: Object.assign({ s: 0, f: "" }, m.gd || {}), fl: Object.assign({}, m.fl || {}), rc: Object.assign({}, m.rc || {}), cs: Object.assign({}, m.cs || {}),
    hs: Object.assign({}, m.hs || {}), pl: Object.assign({}, m.pl || {}), cr: m.cr || "", gy: m.gy || "", ct: m.ct || null };
}
export const builtCount = st => { const o = mbOf(st).own; return BUILDINGS.filter(b => !b.big && b.k !== "hut" && o[b.k]).length; };   // buildings bought (not the free hut, not the palace)
export const hasPalace = st => !!mbOf(st).own.palace;
export const crownToday = st => mbOf(st).cr === today();
export const strongToday = st => mbOf(st).gy === today();
const paidToday = (mb, room) => mb.in[room] === today();

/* ----- page state (nothing here is saved) ----- */
let view = "base", sel = -1, moving = "", dsel = -1, msg = null, visit = "", duck = "wave", ROOMSTATE = {};
let lastStudents = [], lastPet = null, lastOpen = false;
const rer = () => { const c = planetCtx(); if (c && c.rerender) c.rerender(); };
const say = (text, mood) => { msg = { text, mood: mood || "" }; };
function save(mb, gain, text, mood) {
  const c = planetCtx(); if (!c || !c.st) return;
  const p = planetNow(); p.mb = mb; if (gain) p.dust = (Number(p.dust) || 0) + gain;
  planetSave(p); if (text) say(text + (c.preview ? " (Preview: nothing was saved.)" : ""), mood); rer();
}
const curMb = () => mbOf(freshSt((planetCtx() || {}).st));
const dustNow = () => Number(planetNow().dust) || 0;

/* ----- building, moving, decorating ----- */
function buy(k, deco) {
  const it = deco ? D[k] : B[k], mb = curMb(); if (!it || (deco ? mb.dec[k] : mb.own[k])) return;
  if (!lastOpen) return;
  if (dustNow() < it.c) { duck = "wave"; say("You need <b>" + (it.c - dustNow()) + " more ⭐</b> for the " + esc(it.n) + ". Keep launching!"); return rer(); }
  if (it.c >= 300 && typeof confirm === "function" && !confirm("Build the " + it.n + " for " + it.c + " ⭐ Stardust?")) return;
  const p = planetNow(); p.dust = (Number(p.dust) || 0) - it.c; mb.n++;
  if (deco) { mb.dec[k] = 1; const i = dsel >= 0 && !mb.ds[dsel] ? dsel : mb.ds.indexOf(""); if (i >= 0) mb.ds[i] = k; }
  let stored = false;
  if (!deco) { mb.own[k] = 1; const i = sel >= 0 && !mb.pads[sel] ? sel : mb.pads.indexOf(""); if (i >= 0) mb.pads[i] = k; else stored = true; }
  backTall(mb); p.mb = mb; planetSave(p); duck = "cheer"; sel = -1; dsel = -1;
  say("\u{1F528} Built! Your <b>" + esc(it.n) + "</b> is " + (deco ? "on your base" : stored ? "in storage (all 8 spots are full)" : "ready") + "!" + (!deco && !stored ? " Tap it to go inside." : "") + ((planetCtx() || {}).preview ? " (Preview: nothing was saved.)" : ""), "cheer"); rer();
}
function placeOn(i) {
  const mb = curMb(); if (!lastOpen || mb.pads[i]) return;
  if (moving) { const from = mb.pads.indexOf(moving); if (from >= 0) mb.pads[from] = ""; mb.pads[i] = moving; moving = ""; sel = -1; backTall(mb); return save(mb, 0, "Moved! \u{1F69A}", "build"); }
  sel = i; dsel = -1; msg = null; rer();
}
function store(k) { const mb = curMb(); const i = mb.pads.indexOf(k); if (i < 0 || !lastOpen) return; mb.pads[i] = ""; sel = -1; save(mb, 0, "\u{1F4E6} The " + esc(B[k].n) + " is in storage. Tap an empty spot to put it back."); }
function placeStored(k, i) { const mb = curMb(); if (!lastOpen || !mb.own[k] || mb.pads.includes(k)) return; const j = i >= 0 && !mb.pads[i] ? i : mb.pads.indexOf(""); if (j < 0) { say("All 8 spots are full. Put a building away first."); return rer(); } mb.pads[j] = k; sel = -1; backTall(mb); save(mb, 0, "Placed! \u{1F3D7}️", "build"); }
function decoOn(i, k) {   // place an owned deco on spot i (or clear it)
  const mb = curMb(); if (!lastOpen) return;
  if (k === "-") { mb.ds[i] = ""; } else { if (!mb.dec[k]) return; const was = mb.ds.indexOf(k); if (was >= 0) mb.ds[was] = ""; mb.ds[i] = k; }
  dsel = -1; save(mb, 0, "");
}

/* ----- the base scene ----- */
function sceneHTML(st, mine) {
  const mb = mbOf(st), crown = crownToday(st);
  let h = '<div class="mbscene' + (mine ? "" : " visit") + '" style="background-image:url(' + M + 'moon-base-bg.webp)">';
  DSPOTS.forEach(([x, y], i) => { const k = mb.ds[i];
    if (k) h += '<button class="mbdeco' + (dsel === i ? " on" : "") + '" style="left:' + x + "%;top:" + y + '%"' + (mine ? ' data-mb="dspot:' + i + '"' : " disabled") + '><img src="' + M + "mbd-" + k + '.webp" alt=""></button>';
    else if (mine) h += '<button class="mbdspot' + (dsel === i ? " on" : "") + '" style="left:' + x + "%;top:" + y + '%" data-mb="dspot:' + i + '" title="Decoration spot">✨</button>'; });
  PADS.forEach(([x, y], i) => { const k = mb.pads[i], b = B[k], back = y < 70;
    if (b) h += '<button class="mbbld' + (b.big ? " big" : "") + (back ? " back" : "") + (sel === i ? " on" : "") + '" style="left:' + x + "%;top:" + y + '%"' + (mine ? ' data-mb="pad:' + i + '"' : ' data-mb="peek:' + k + '"') + '><img src="' + M + "mb-" + k + '.webp" alt="' + esc(b.n) + '"><span>' + esc(b.n) + "</span></button>";
    else if (mine) h += '<button class="mbpad' + (sel === i ? " on" : "") + (moving ? " target" : "") + '" style="left:' + x + "%;top:" + y + '%" data-mb="pad:' + i + '">' + (moving ? "⬇️" : "+") + "</button>"; });
  if (crown) h += '<div class="mbbanner">\u{1F451} Royal Ruler of the Moon today!</div>';
  return h + "</div>";
}
function builderHTML(st, open) {
  const mb = mbOf(st), dust = Number(((st && st.planet) || {}).dust) || 0;
  const pad = sel >= 0 ? mb.pads[sel] : "";
  let h = '<div class="mbbuilder"><img class="mbduck" src="' + M + "mb-duck-" + (msg && msg.mood === "cheer" ? "cheer" : msg && msg.mood === "build" ? "build" : duck) + '.webp" alt="The Moon Builder">' +
    '<div class="kdsay mbsay"><b>Alien Duck, Moon Builder:</b> ' + (msg ? msg.text : moving ? "Tap an empty spot to move the <b>" + esc(B[moving].n) + "</b> there." : dsel >= 0 ? "Pick a decoration for this spot!" : sel >= 0 && !pad ? "What should I build here?" : "Welcome to your Moon Base! Tap a <b>+</b> spot to build, or tap a building to go inside.") + "</div></div>";
  if (!open) h += '<p class="small muted" style="margin:6px 0 0;">You can build and play while Planet JP is open.</p>';
  // building menu
  if (sel >= 0 && pad) {
    h += '<div class="mbmenu"><b>' + esc(B[pad].n) + '</b><button class="btn gold small" data-mb="enter:' + pad + '">\u{1F6AA} Go inside</button>' +
      (open ? '<button class="btn ghost small" data-mb="move:' + pad + '">↔️ Move</button>' + (pad !== "hut" ? '<button class="btn ghost small" data-mb="store:' + pad + '">\u{1F4E6} Put away</button>' : "") : "") + '<button class="btn ghost small" data-mb="cancel">Close</button></div>';
    return h;
  }
  // decoration picker
  if (dsel >= 0) {
    h += '<div class="mbshop"><h3>✨ Decorations</h3><div class="mbgrid">' + DECOS.map(d => { const own = mb.dec[d.k];
      return '<div class="mbitem' + (own ? " own" : "") + '"><img src="' + M + "mbd-" + d.k + '.webp" alt=""><b>' + esc(d.n) + "</b>" +
        (own ? '<button class="btn small gold" data-mb="deco:' + dsel + ":" + d.k + '"' + (open ? "" : " disabled") + ">Put here</button>" : '<button class="btn small' + (dust >= d.c ? " gold" : " ghost") + '" data-mb="buyd:' + d.k + '"' + (open ? "" : " disabled") + ">⭐ " + d.c + "</button>") + "</div>"; }).join("") + "</div>" +
      '<div class="row" style="gap:6px;margin-top:6px;">' + (mb.ds[dsel] ? '<button class="btn ghost small" data-mb="deco:' + dsel + ':-">Clear this spot</button>' : "") + '<button class="btn ghost small" data-mb="cancel">Close</button></div></div>';
    return h;
  }
  // the build shop (+ storage)
  const stored = BUILDINGS.filter(b => mb.own[b.k] && !mb.pads.includes(b.k));
  if (stored.length) h += '<div class="mbshop"><h3>\u{1F4E6} In storage</h3><div class="mbgrid">' + stored.map(b => '<div class="mbitem own"><img src="' + M + "mb-" + b.k + '.webp" alt=""><b>' + esc(b.n) + '</b><button class="btn small gold" data-mb="place:' + b.k + '"' + (open ? "" : " disabled") + ">Place</button></div>").join("") + "</div></div>";
  h += '<div class="mbshop"><h3>\u{1F3D7}️ Build</h3><div class="mbgrid">' + BUILDINGS.filter(b => b.k !== "hut").map(b => { const own = mb.own[b.k];
    return '<div class="mbitem' + (own ? " own" : "") + (b.big ? " big" : "") + '"><img src="' + M + "mb-" + b.k + '.webp" alt=""><b>' + esc(b.n) + '</b><span class="small">' + esc(b.room) + "</span>" +
      (own ? '<span class="mbown">✅ Built</span>' : '<button class="btn small' + (dust >= b.c ? " gold" : " ghost") + '" data-mb="buy:' + b.k + '"' + (open ? "" : " disabled") + ">⭐ " + b.c.toLocaleString() + "</button>") + "</div>"; }).join("") + "</div></div>";
  return h;
}
function visitHTML(students, me) {
  const others = (students || []).filter(s => s && s.companionId && s.id !== (me && me.id) && s.planet && s.planet.mb);
  const v = others.find(s => s.id === visit);
  let h = '<div class="mbvisit"><b>\u{1F440} Visit a classmate’s base:</b> ' + (others.length ? others.map(s => '<button class="btn small' + (s.id === visit ? " gold" : " ghost") + '" data-mb="visit:' + s.id + '">' + esc(s.name || "") + "</button>").join("") : '<span class="muted small">No classmates have a Moon Base yet.</span>') + "</div>";
  if (v) h += '<div class="mbvisithead"><b>' + esc(v.name || "") + "’s Moon Base</b> · \u{1F3D7}️ " + builtCount(v) + " buildings" + (hasPalace(v) ? " · \u{1F451} Moon Palace" : "") + ' <button class="btn ghost small" data-mb="visit:">Back to mine</button></div>' + sceneHTML(v, false);
  return h;
}

/* ========== the rooms ========== */
const pet = st => (lastPet ? lastPet(st) : "");
const roomWrap = (k, inner, extra) => '<div class="mbroom" style="background-image:url(' + M + "in-" + k + '.webp)">' + inner + "</div>" + (extra || "");
const payLine = (mb, k) => paidToday(mb, k) ? '<span class="mbpaid">✅ Done today (+' + PAY[k] + " ⭐). Play again just for fun!</span>" : '<span class="mbpay">Today: <b>+' + PAY[k] + " ⭐</b></span>";

// 🏠 Cozy Hut: wake your companion
const HUT_LINES = ["Good morning! I dreamed we found a giant space cookie!", "*yawn* Is it Planet JP time already?", "I love our little moon house!", "Five more minutes… just kidding! Let's go!", "I was dreaming about you finishing your XP!", "The stars were so pretty last night!", "Did you bring snacks? Moon snacks?"];
function hutRoom(st, mb, open) {
  const awake = paidToday(mb, "hut");
  return roomWrap("hut", '<div class="mbpet hut' + (awake ? "" : " sleep") + '">' + pet(st) + (awake ? "" : '<span class="mbzzz">Z<i>z</i><b>z</b></span>') + "</div>" +
    (awake ? '<div class="kdsay mbroomsay">' + esc(HUT_LINES[(mb.n + new Date().getDate()) % HUT_LINES.length]) + "</div>" : ""),
    '<div class="mbroombar">' + (awake ? payLine(mb, "hut") : '<button class="btn gold" data-mb="act:hut"' + (open ? "" : " disabled") + ">☀️ Wake up!</button> " + payLine(mb, "hut")) + "</div>");
}
// 🌱 Moon Garden: plant, water 3 days, bloom
const FLOWERS = [["f1", "Pink Star Flower"], ["f2", "Crescent Moon Flower"], ["f3", "Golden Sunburst"], ["f4", "Galaxy Swirl"], ["f5", "Rainbow Tulip"], ["f6", "Crystal Lily"], ["f7", "Comet Flower"], ["f8", "Bubble Flower"]];
const POTS = [23.4, 31, 38.7, 46.5, 54.1, 61.7, 69.5, 77.2];
function gardenRoom(st, mb, open) {
  const got = FLOWERS.filter(([k]) => mb.fl[k]), stage = ["gd-seed", "gd-sprout", "gd-bud"][Math.min(2, mb.gd.s)], all = got.length >= 8;
  let inner = "";
  POTS.forEach((x, i) => { const f = got[i]; if (f) inner += '<img class="mbpot" src="' + M + "gd-" + f[0] + '.webp" alt="" style="left:' + x + '%">'; else if (i === got.length && !all) inner += '<img class="mbpot grow" src="' + M + stage + '.webp" alt="" style="left:' + x + '%">'; });
  if (ROOMSTATE.water) inner += '<img class="mbcan" src="' + M + 'gd-can.webp" alt="" style="left:' + (POTS[Math.min(7, got.length)] + 5) + '%">';
  const done = paidToday(mb, "garden"), left = 3 - mb.gd.s;
  return roomWrap("garden", inner, '<div class="mbroombar">' + (done ? payLine(mb, "garden") : '<button class="btn gold" data-mb="act:garden"' + (open ? "" : " disabled") + ">\u{1F4A7} Water</button> " + payLine(mb, "garden")) +
    '<span class="small">' + (all ? "\u{1F338} Your garden is full! You grew all 8 moon flowers." : "\u{1F331} " + left + " more watering" + (left === 1 ? "" : "s") + " (one a day) until it blooms · " + got.length + " / 8 flowers") + "</span></div>");
}
// 📡 Space Radio
const RADIO = ["\u{1F4E1} Commander JP: Great job today, Captain! Every XP gets you closer to the stars.", "\u{1F47D} Alien Ms. Ariana: Psst… I’m hiding somewhere on Planet JP today. Can you find me?",
  "\u{1F31E} Space fact: The Sun is so big that about a million Earths could fit inside it!", "\u{1F319} Space fact: The Moon has moonquakes, like small earthquakes!", "\u{1FA90} Space fact: Saturn is so light it could float in a giant bathtub!",
  "⭐ Space fact: When you look at a star, you see light that left it a long, long time ago.", "\u{1F680} Commander JP: Remember to close your rings today. The S.S. Duck needs all 4 tanks!",
  "\u{1F311} Space fact: Footprints on the Moon can last millions of years because there’s no wind.", "\u{1F534} Space fact: Mars looks red because its dirt is rusty!", "☁️ Space fact: Jupiter’s Great Red Spot is a storm bigger than Earth.",
  "\u{1F47D} Alien Ms. Ariana: I’m so proud of how hard you’re working!", "\u{1F320} Space fact: A shooting star is really a tiny space rock burning up in the sky.", "\u{1F9CA} Space fact: Some of Saturn’s rings are made of ice chunks as big as houses!",
  "\u{1F4E1} Commander JP: Mission Control says your Moon Base is looking amazing!", "\u{1F30C} Space fact: Our galaxy, the Milky Way, has more than 100 billion stars!", "\u{1F986} Commander JP: The S.S. Duck says quack! (That means ‘you’ve got this!’)"];
const hash = s => { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100003; return h; };
function dishRoom(st, mb, open) {
  const target = 20 + hash("f" + today()) % 61, f = ROOMSTATE.freq == null ? 50 : ROOMSTATE.freq, near = Math.abs(f - target) <= 2, found = paidToday(mb, "dish") || ROOMSTATE.tuned;
  const msgTxt = RADIO[hash(today()) % RADIO.length];
  return roomWrap("dish", '<div class="mbdial"><div class="mbneedle" style="transform:translateX(-50%) rotate(' + ((f - 50) * 1.6) + 'deg)"></div><b>' + f + ' MHz</b></div>' +
    '<div class="kdsay mbroomsay radio">' + (found ? esc(msgTxt) : near ? "\u{1F4FB} …the signal is coming in! Tap <b>Listen</b>!" : "\u{1F4FB} *kshhhhh*… turn the dial to find today’s signal (" + target + " MHz).") + "</div>",
    '<div class="mbroombar"><button class="btn ghost" data-mb="dial:-5">⏪</button><button class="btn ghost" data-mb="dial:-1">◀</button><button class="btn ghost" data-mb="dial:1">▶</button><button class="btn ghost" data-mb="dial:5">⏩</button>' +
    (near && !paidToday(mb, "dish") ? '<button class="btn gold" data-mb="act:dish"' + (open ? "" : " disabled") + ">\u{1F3A7} Listen</button>" : "") + payLine(mb, "dish") + "</div>");
}
// 🧪 Crystal Mixing
const CRY = { r: ["red", "#ff4d6d"], b: ["blue", "#3fa9ff"], y: ["yellow", "#ffd43b"], w: ["white", "#f4f1ff"] };
const RECIPES = { rr: ["Dragon Fire", "#ff3355"], bb: ["Ocean Dream", "#2f8cff"], yy: ["Sunshine Sip", "#ffd21f"], ww: ["Moonlight Milk", "#eef0ff"], br: ["Galaxy Grape", "#9b5cff"], ry: ["Comet Fizz", "#ff9a2e"],
  rw: ["Bubblegum Nova", "#ff8cc6"], by: ["Alien Slime", "#4fe36b"], bw: ["Frost Mist", "#a8ddff"], wy: ["Star Cream", "#fff1b0"] };
function labRoom(st, mb, open) {
  const pick = ROOMSTATE.pick || [], res = ROOMSTATE.res;
  let inner = '<div class="mbcrys">' + Object.keys(CRY).map(c => '<button class="mbcry' + (pick.includes(c) ? " on" : "") + '" data-mb="cry:' + c + '"><img src="' + M + "lab-c-" + CRY[c][0] + '.webp" alt="' + CRY[c][0] + '"></button>').join("") + "</div>";
  inner += '<div class="mbbottle"><i style="background:' + (res ? RECIPES[res][1] : "transparent") + ';height:' + (res ? 62 : 0) + '%"></i><img src="' + M + 'lab-bottle.webp" alt=""></div>';
  if (res) inner += '<div class="kdsay mbroomsay">\u{1F9EA} You made <b>' + RECIPES[res][0] + "</b>!" + (ROOMSTATE.isNew ? " <b>NEW recipe!</b> \u{1F389}" : "") + "</div>";
  const book = Object.keys(RECIPES).map(k => '<span class="mbrec' + (mb.rc[k] ? " got" : "") + '" style="--c:' + RECIPES[k][1] + '">' + (mb.rc[k] ? RECIPES[k][0] : "???") + "</span>").join("");
  return roomWrap("lab", inner, '<div class="mbroombar"><span class="small">Pick 2 crystals (the same one twice is OK):</span>' +
    '<button class="btn gold" data-mb="act:lab"' + (pick.length === 2 && open ? "" : " disabled") + ">\u{1F9EA} Mix!</button>" + payLine(mb, "lab") + "</div>" +
    '<div class="mbbook"><b>\u{1F4D6} Recipe book ' + Object.keys(mb.rc).length + " / 10</b>" + book + "</div>");
}
// 🔭 Stargazing: tap the stars in order
const CONST = [
  ["dipper", "Big Dipper", [[10, 30], [25, 28], [38, 34], [50, 40], [54, 62], [72, 66], [76, 44]], [0, 1, 2, 3, 4, 5, 6, 3]],
  ["cassiopeia", "Cassiopeia", [[10, 40], [28, 66], [46, 36], [64, 62], [82, 30]], [0, 1, 2, 3, 4]],
  ["orion", "Orion the Hunter", [[30, 14], [70, 18], [42, 50], [50, 47], [58, 44], [30, 84], [72, 82]], [0, 2, 3, 4, 1, null, 2, 5, null, 4, 6]],
  ["cross", "Southern Cross", [[50, 10], [50, 86], [25, 44], [75, 50]], [0, 1, null, 2, 3]],
  ["swan", "Cygnus the Swan", [[50, 10], [50, 42], [50, 84], [18, 34], [82, 46]], [0, 1, 2, null, 3, 1, 4]],
  ["leo", "Leo the Lion", [[20, 62], [32, 40], [48, 28], [64, 34], [80, 56], [62, 66], [40, 66]], [0, 1, 2, 3, 4, 5, 6, 0]],
  ["little", "Little Dipper", [[15, 22], [28, 28], [40, 36], [52, 46], [68, 42], [74, 60], [58, 64]], [0, 1, 2, 3, 4, 5, 6, 3]],
  ["gemini", "Gemini the Twins", [[28, 14], [40, 14], [24, 50], [42, 50], [20, 86], [44, 86]], [4, 2, 0, 1, 3, 5]],
  ["lyra", "Lyra the Harp", [[50, 10], [38, 36], [62, 40], [34, 72], [58, 76]], [0, 1, 2, 4, 3, 1]],
  ["taurus", "Taurus the Bull", [[14, 18], [34, 40], [50, 56], [66, 40], [86, 18], [50, 80]], [0, 1, 2, 3, 4, null, 2, 5]],
  ["scorpius", "Scorpius", [[82, 14], [72, 24], [62, 34], [56, 50], [50, 66], [40, 78], [26, 80], [18, 66]], [0, 1, 2, 3, 4, 5, 6, 7]],
  ["pegasus", "Pegasus Square", [[24, 28], [72, 26], [74, 72], [26, 74]], [0, 1, 2, 3, 0]]];
const conToday = mb => { if (mb.ct && mb.ct.d === today()) { const c = CONST.find(x => x[0] === mb.ct.k); if (c) return c; } const left = CONST.filter(c => !mb.cs[c[0]]); return left.length ? left[0] : CONST[hash(today()) % CONST.length]; };
function obsRoom(st, mb, open) {
  const c = conToday(mb), [key, name, pts, path] = c, step = ROOMSTATE.step || 0, done = step >= path.length;
  let next = step; while (next < path.length && path[next] === null) next++;
  let svg = '<svg class="mbsky" viewBox="0 0 100 100" preserveAspectRatio="none">';
  for (let i = 1; i < Math.min(step, path.length); i++) if (path[i] !== null && path[i - 1] !== null) { const a = pts[path[i - 1]], b = pts[path[i]]; svg += '<line x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '"/>'; }
  svg += "</svg>";
  let stars = pts.map((p, i) => '<button class="mbstar' + (!done && path[next] === i ? " next" : "") + (path.slice(0, step).includes(i) ? " lit" : "") + '" style="left:' + p[0] + "%;top:" + p[1] + '%" data-mb="star:' + i + '"' + (open ? "" : " disabled") + "></button>").join("");
  const map = CONST.map(x => '<span class="mbrec' + (mb.cs[x[0]] ? " got" : "") + '" style="--c:#b9a3ff">' + (mb.cs[x[0]] ? "✨ " + x[1] : "???") + "</span>").join("");
  return roomWrap("observatory", '<div class="mbskybox">' + svg + stars + "</div>" + (done ? '<div class="kdsay mbroomsay">\u{1F320} You found <b>' + name + "</b>!</div>" : '<div class="kdsay mbroomsay">\u{1F52D} Tonight’s stars: <b>' + name + "</b>. Tap the glowing star to connect the lines!</div>"),
    '<div class="mbroombar">' + payLine(mb, "observatory") + (done ? '<button class="btn ghost small" data-mb="restart">Again!</button>' : "") + "</div>" +
    '<div class="mbbook"><b>\u{1F5FA}️ Star map ' + Object.keys(mb.cs).length + " / 12</b>" + map + "</div>");
}
// 🐾 Nebble Playroom
function playRoom(st, mb, open) {
  const nebs = Object.keys(ownedOf(st)).filter(k => NEB[k]).slice(0, 8), pl = mb.pl.d === today() ? Number(mb.pl.n) || 0 : 0, happy = ROOMSTATE.happy || {};
  const inner = nebs.length ? nebs.map((k, i) => '<button class="mbplayneb" data-mb="neb:' + k + '" style="left:' + (14 + (i % 4) * 22) + "%;top:" + (i < 4 ? 66 : 84) + "%;animation-delay:-" + (i * 0.6) + 's"' + (open ? "" : " disabled") + '><img src="' + (happy[k] ? nebHappy(k) : nebImg(k)) + '" alt="">' + (happy[k] ? "<i>" + happy[k] + "</i>" : "") + "</button>").join("")
    : '<div class="kdsay mbroomsay">\u{1F43E} Adopt a Nebble at the Adoption Center and it will play here!</div>';
  return roomWrap("playhouse", inner, '<div class="mbroombar"><span class="small">Tap a Nebble to play! <b>+1 ⭐</b> each (' + pl + " / 5 today)</span></div>");
}
// 👑 Throne Hall
function palaceRoom(st, mb, open) {
  const on = mb.cr === today();
  return roomWrap("palace", '<div class="mbpet throne">' + pet(st) + "" + "</div>" +
    (on ? '<div class="kdsay mbroomsay">\u{1F451} All hail the Royal Ruler of the Moon! Your companion wears the moon crown today.</div>' : ""),
    '<div class="mbroombar">' + (on ? payLine(mb, "palace") : '<button class="btn gold" data-mb="act:palace"' + (open ? "" : " disabled") + ">\u{1F451} Sit on the throne</button> " + payLine(mb, "palace")) + "</div>");
}
// 🕹️ Arcade (just for fun) + class high scores
function arcadeRoom(st, mb, open) {
  const best = (k, s) => { const v = Number((mbOf(s).hs || {})[k]) || 0; return v; }, better = (k, a, b) => k === "code" ? (a && (!b || a < b)) : a > b;
  const board = g => { const rows = (lastStudents || []).concat([st]).filter((s, i, a) => s && a.findIndex(x => x && x.id === s.id) === i).map(s => ({ n: s.id === st.id ? "You" : s.name || "", v: best(g.key, s.id === st.id ? st : s) })).filter(r => r.v > 0)
      .sort((a, b) => g.key === "code" ? a.v - b.v : b.v - a.v).slice(0, 3);
    return rows.length ? rows.map((r, i) => ["\u{1F947}", "\u{1F948}", "\u{1F949}"][i] + " " + esc(r.n) + " " + r.v).join(" · ") : "No scores yet"; };
  return roomWrap("arcade", '<div class="mbarcade">' + GAMES.map(g => '<div class="mbarc"><b>' + g.icon + " " + esc(g.name) + '</b><span class="small">' + board(g) + '</span><button class="btn small gold" data-mb="arc:' + g.key + '"' + (open ? "" : " disabled") + ">▶ Play</button></div>").join("") + "</div>",
    '<div class="mbroombar"><span class="small">\u{1F579}️ Play the space games any time, just for fun. Beat the class high scores!</span></div>');
}
// 🏎️ 🤿 🏋️ games run in a full-screen layer
function gameRoom(k, st, mb, open) {
  const label = { garage: "\u{1F3CE}️ Start Rover Rally", pool: "\u{1F93F} Dive!", gym: "\u{1F3CB}️ Start Moon Bounce" }[k];
  const how = { garage: "Tap (or press Space) to jump! Hop over the red-glowing rocks and grab the gold star coins (some are up high). 20 seconds!", pool: "Tap when the meter is in the green for the biggest splash!", gym: "Tap each time the ring hits the trampoline. Get a Strong glow for the day!" }[k];
  const inner = k === "garage" ? '<img class="mbroomrover" src="' + M + 'rally-rover.webp" alt="">' : '<div class="mbpet ' + k + (k === "gym" && strongToday(st) ? " strong" : "") + '">' + pet(st) + "</div>";
  return roomWrap(k, inner, '<div class="mbroombar"><button class="btn gold" data-mb="game:' + k + '"' + (open ? "" : " disabled") + ">" + label + '</button><span class="small">' + how + "</span>" + payLine(mb, k) + "</div>");
}
function roomHTML(k, st, open) {
  const mb = mbOf(st), b = B[k];
  const head = '<div class="mbroomhead"><button class="btn ghost small" data-mb="out">← Back outside</button><b>' + esc(b.n) + " · " + esc(b.room) + "</b></div>";
  const fn = { hut: hutRoom, garden: gardenRoom, dish: dishRoom, lab: labRoom, observatory: obsRoom, playhouse: playRoom, palace: palaceRoom, arcade: arcadeRoom }[k];
  return head + (fn ? fn(st, mb, open) : gameRoom(k, st, mb, open)) + (msg && view !== "base" ? '<p class="good" style="margin:6px 0 0;">' + msg.text + "</p>" : "");
}

/* ----- doing things in a room ----- */
function act(k, extra) {
  const c = planetCtx(); if (!c || !c.st || !lastOpen) return; const st = freshSt(c.st), mb = mbOf(st), first = !paidToday(mb, k);
  const pay = (gain, text) => { if (first) mb.in[k] = today(); save(mb, first ? gain : 0, text + (first ? " <b>+" + gain + " ⭐</b>" : "")); };
  if (k === "hut") return first ? pay(PAY.hut, "☀️ Your companion woke up happy!") : null;
  if (k === "garden") {
    if (!first) return; if (Object.keys(mb.fl).length >= 8) return pay(PAY.garden, "\u{1F4A7} The flowers love the water!");
    mb.gd.s = (Number(mb.gd.s) || 0) + 1; ROOMSTATE.water = 1; setTimeout(() => { ROOMSTATE.water = 0; rer(); }, 1400);
    if (mb.gd.s >= 3) { const f = FLOWERS.find(([x]) => !mb.fl[x]); mb.fl[f[0]] = 1; mb.gd = { s: 0, f: "" }; return pay(PAY.garden, "\u{1F338} It bloomed! You grew a <b>" + f[1] + "</b>!"); }
    return pay(PAY.garden, "\u{1F4A7} Watered! " + (mb.gd.s === 1 ? "A little sprout popped up!" : "A bud is growing!"));
  }
  if (k === "dish") { ROOMSTATE.tuned = 1; return pay(PAY.dish, "\u{1F4FB} You caught today’s signal!"); }
  if (k === "lab") {
    const pick = (ROOMSTATE.pick || []).slice().sort(); if (pick.length !== 2) return; const key = pick.join("");
    ROOMSTATE.res = key; ROOMSTATE.isNew = !mb.rc[key]; mb.rc[key] = 1; ROOMSTATE.pick = [];
    if (first) return pay(PAY.lab, "\u{1F9EA} Bubble bubble!"); if (ROOMSTATE.isNew) return save(mb, 0, "\u{1F4D6} New recipe saved!"); return rer();
  }
  if (k === "observatory") { const con = conToday(mb); mb.cs[con[0]] = 1; mb.ct = { d: today(), k: con[0] }; return first ? pay(PAY.observatory, "\u{1F320} Constellation found!") : save(mb, 0, "\u{1F320} Constellation found!"); }
  if (k === "palace") { mb.cr = today(); return pay(PAY.palace, "\u{1F451} You sat on the Moon Throne!"); }
  if (k === "gym") { mb.gy = today(); return pay(PAY.gym, "\u{1F4AA} Your companion has a <b>Strong</b> glow today!"); }
  if (k === "garage" || k === "pool") { const gain = Math.max(1, Math.min(PAY[k], extra || 1)); return pay(gain, k === "pool" ? "\u{1F30A} SPLASH!" : "\u{1F3C1} Finish line!"); }
}
function nebTap(k) {
  const c = planetCtx(); if (!c || !c.st || !lastOpen) return; const mb = curMb(), pl = mb.pl.d === today() ? Number(mb.pl.n) || 0 : 0;
  ROOMSTATE.happy = Object.assign({}, ROOMSTATE.happy, { [k]: ["⚽", "\u{1FAE7}", "\u{1F496}", "\u{1F3BE}", "✨"][Math.floor(Math.random() * 5)] }); setTimeout(() => { if (ROOMSTATE.happy) { delete ROOMSTATE.happy[k]; rer(); } }, 1500);
  if (pl >= 5) return rer();
  mb.pl = { d: today(), n: pl + 1 }; if (pl + 1 >= 5) mb.in.playhouse = today(); save(mb, 1, "\u{1F43E} " + esc((NEB[k] || {}).name || "Your Nebble") + " loved playing! <b>+1 ⭐</b>");
}

/* ----- the full-screen games ----- */
let G = null;
function layer(bg) {
  const root = document.createElement("div"); root.className = "kdgame mbgame";
  root.innerHTML = '<div class="kdstage"><div class="kdbg" style="background-image:url(' + M + bg + '.webp)"></div><div class="kdlayer"></div><div class="kdui"><div class="kdhud"></div></div></div>';
  document.body.appendChild(root); const stage = root.querySelector(".kdstage");
  G = { root, stage, lay: root.querySelector(".kdlayer"), hud: root.querySelector(".kdhud"), ui: root.querySelector(".kdui"), tap: 0, dead: false };
  stage.addEventListener("pointerdown", () => { G && G.tap++; }); G.kd = e => { if (e.key === " " && !e.repeat) { G.tap++; e.preventDefault(); } }; addEventListener("keydown", G.kd);
  return G;
}
function closeLayer() { if (!G) return; G.dead = true; removeEventListener("keydown", G.kd); G.root.remove(); G = null; }
const tick = fn => new Promise(res => { const t0 = performance.now(); let last = t0; const st = now => { if (!G || G.dead) return res(); const dt = Math.min(.05, (now - last) / 1000); last = now; if (fn(dt, (now - t0) / 1000) === false) return res(); requestAnimationFrame(st); }; requestAnimationFrame(st); });
const img = (src, cls, w) => { const e = document.createElement("img"); e.src = src; e.className = "kdsp " + (cls || ""); e.style.width = w + "%"; G.lay.appendChild(e); return e; };
const at = (e, x, y, t) => { e.style.left = x + "%"; e.style.top = y + "%"; e.style.transform = "translate(-50%,-50%)" + (t || ""); };
function pop(x, y, t, bad) { const s = document.createElement("span"); s.className = "kdpop" + (bad ? " bad" : ""); s.innerHTML = t; s.style.left = x + "%"; s.style.top = y + "%"; G.lay.appendChild(s); setTimeout(() => s.remove(), 900); }
const endBox = html => new Promise(res => { const b = document.createElement("div"); b.className = "kdbox"; b.innerHTML = html + '<div style="margin-top:10px"><button class="btn gold">OK</button></div>'; G.ui.appendChild(b); b.querySelector("button").onclick = e => { e.stopPropagation(); res(); }; });

// 🏎️ Rover Rally (v3, Nov 12): the painted sky and hills scroll slowly behind; the rover drives on its own flat moon road
// (drawn with code so the rover, rocks and coins always sit right on it). Rocks glow red, coins glow gold.
const RALLY_SECS = 20, ROAD_TOP = 73;
async function rally() {
  layer("rally-bg"); const bg = G.root.querySelector(".kdbg");
  bg.style.cssText += ";background-size:auto 116%;background-position:0 100%;background-repeat:no-repeat;background-color:#2a1766";
  const roadEl = document.createElement("div"); roadEl.className = "rrroad"; roadEl.style.top = ROAD_TOP + "%"; roadEl.innerHTML = '<i class="rrdash"></i><i class="rrdirt"></i>'; G.lay.appendChild(roadEl);
  const dash = roadEl.querySelector(".rrdash"), dirt = roadEl.querySelector(".rrdirt");
  const shadow = document.createElement("div"); shadow.className = "rrshadow"; shadow.style.top = (ROAD_TOP + 1) + "%"; G.lay.appendChild(shadow);
  const RX = 20, HALF = 7.4, rv = img(M + "rally-rover.webp", "rrrover", 14);
  const GROUND = ROAD_TOP - HALF + 1.2, SPEED = 32;   // % of the screen width per second
  let y = GROUND, vy = 0, coins = 0, sp = 1.4, hurt = 0, bgx = 0, rx = 0; const things = [];
  const go = document.createElement("div"); go.className = "rrgo"; G.ui.appendChild(go);
  await tick((dt, t) => { go.textContent = t < 0.7 ? "3" : t < 1.4 ? "2" : t < 2.1 ? "1" : "GO!"; if (t > 2.6) return false; at(rv, RX, y); return true; });
  go.remove(); G.tap = 0;
  await tick((dt, t) => {
    const W = G.stage.getBoundingClientRect().width || 1000;
    bgx += 0.9 * dt; rx += SPEED * dt; bg.style.backgroundPosition = (-Math.min(bgx, 20) * W / 100).toFixed(1) + "px 100%"; dash.style.backgroundPosition = (-rx * W / 100).toFixed(1) + "px 0"; dirt.style.backgroundPosition = (-rx * W / 100).toFixed(1) + "px 0";
    const onGround = y >= GROUND - 0.3;
    if (typeof window !== "undefined" && window.__mbBot && onGround && things.some(o => o.x > RX + 4 && o.x < RX + 13 && (o.rock || o.high))) G.tap = 1;   // video recording only
    if (G.tap) { G.tap = 0; if (onGround) vy = -88; }
    vy += 230 * dt; y += vy * dt; if (y >= GROUND) { y = GROUND; vy = 0; }
    const air = GROUND - y;
    at(rv, RX, y, " rotate(" + (air > 1 ? (vy < 0 ? -10 : 6) : Math.sin(t * 22) * 0.8).toFixed(1) + "deg)");
    rv.style.opacity = hurt > 0 && Math.floor(t * 12) % 2 ? .45 : 1; hurt -= dt;
    shadow.style.left = RX + "%"; shadow.style.transform = "translate(-50%,-50%) scale(" + Math.max(.4, 1 - air / 40).toFixed(2) + ")";
    sp -= dt;
    if (sp <= 0 && t < RALLY_SECS - 1.5) {
      const r = Math.random(), kind = r < 0.38 ? "rock" : r < 0.7 ? "low" : "high";
      const e = kind === "rock" ? img(M + "mbd-rocks.webp", "rrrock", 8) : img("assets/planet/star-coin.webp", "rrcoin", 5);
      things.push({ e, rock: kind === "rock", high: kind === "high", x: 108, y: kind === "rock" ? ROAD_TOP - 3.2 : kind === "high" ? ROAD_TOP - 20 : ROAD_TOP - 8 });
      if (kind !== "rock" && Math.random() < 0.4) things.push({ e: img("assets/planet/star-coin.webp", "rrcoin", 5), x: 116, y: kind === "high" ? ROAD_TOP - 20 : ROAD_TOP - 8, high: kind === "high" });
      sp = 0.9 + Math.random() * 0.55;
    }
    for (let i = things.length - 1; i >= 0; i--) { const o = things[i]; o.x -= SPEED * dt; at(o.e, o.x, o.y + (o.rock ? 0 : Math.sin(t * 5 + i) * 0.8));
      if (Math.abs(o.x - RX) < (o.rock ? 6 : 6.5) && Math.abs(o.y - y) < (o.rock ? 6 : 8.5)) {
        if (o.rock) { if (hurt <= 0) { coins = Math.max(0, coins - 1); pop(RX, y - 16, "Bump! -1", true); hurt = 1; } }
        else { coins++; pop(o.x, o.y - 8, "+1 ⭐"); o.e.remove(); things.splice(i, 1); continue; } }
      if (o.x < -10) { o.e.remove(); things.splice(i, 1); } }
    G.hud.innerHTML = "<span>⭐ " + coins + "</span><span>⏱️ " + Math.max(0, Math.ceil(RALLY_SECS - t)) + "</span>"; return t < RALLY_SECS;
  });
  if (!G) return; const gain = Math.min(5, Math.ceil(coins / 2)); await endBox("<h2>\u{1F3C1} Finish!</h2><p>You grabbed <b>" + coins + "</b> star coins!</p>"); closeLayer(); act("garage", gain);
}
async function splash() {
  layer("in-pool"); const c = planetCtx(); const p = document.createElement("div"); p.className = "kdsp mbdiver"; p.innerHTML = pet(freshSt(c && c.st)); G.lay.appendChild(p); at(p, 17, 30);
  const meter = document.createElement("div"); meter.className = "mbmeter"; meter.innerHTML = "<i></i><b></b>"; G.ui.appendChild(meter); const nd = meter.querySelector("b");
  let v = 0; G.tap = 0;
  await tick((dt, t) => { v = (Math.sin(t * 3.2) + 1) / 2; nd.style.left = (v * 100) + "%"; return !G.tap; });
  if (!G) return; const d = Math.abs(v - 0.5), stars = d < 0.08 ? 3 : d < 0.2 ? 2 : 1; meter.remove();
  await tick((dt, t) => { const u = Math.min(1, t / 1.1); at(p, 17 + u * 33, 30 + Math.sin(u * Math.PI) * -14 + u * 18, " rotate(" + (u * 300) + "deg) scale(" + (1 - u * .3) + ")"); return t < 1.1; });
  p.remove(); for (let i = 0; i < 14; i++) { const s = document.createElement("span"); s.className = "mbdrop"; s.style.left = (50 + (Math.random() - .5) * 20) + "%"; s.style.top = "48%"; s.style.setProperty("--dx", ((Math.random() - .5) * 30) + "vw"); s.style.setProperty("--dy", (-10 - Math.random() * 25) + "vh"); G.lay.appendChild(s); }
  await new Promise(r => setTimeout(r, 900));
  await endBox("<h2>\u{1F30A} SPLASH!</h2><p style='font-size:30px;margin:4px 0'>" + "⭐".repeat(stars) + "☆".repeat(3 - stars) + "</p>"); closeLayer(); act("pool", [0, 3, 4, 5][stars]);
}
async function bounce() {
  layer("in-gym"); const c = planetCtx(); const p = document.createElement("div"); p.className = "kdsp mbbouncer"; p.innerHTML = pet(freshSt(c && c.st)); G.lay.appendChild(p);
  const ring = document.createElement("div"); ring.className = "mbring"; G.lay.appendChild(ring);
  const BEAT = 0.95, N = 8; let hits = 0, judged = -1; G.tap = 0;
  await tick((dt, t) => { const k = Math.floor(t / BEAT), ph = (t % BEAT) / BEAT;
    at(p, 50, 50 - Math.sin(ph * Math.PI) * 22); ring.style.transform = "translate(-50%,-50%) scale(" + (2.4 - ph * 1.4) + ")"; ring.style.opacity = 0.3 + ph * .7;
    if (G.tap) { G.tap = 0; if (judged !== k) { judged = k; const off = Math.min(ph, 1 - ph); if (off < 0.18) { hits++; pop(50, 30, off < 0.08 ? "Perfect!" : "Good!"); } else pop(50, 30, "Miss", true); } }
    G.hud.innerHTML = "<span>\u{1F4AA} " + hits + " / " + N + "</span>"; return k < N; });
  if (!G) return; await endBox("<h2>\u{1F4AA} Moon Bounce done!</h2><p><b>" + hits + " / " + N + "</b> on the beat!</p>"); closeLayer(); act("gym");
}
function arcadePlay(key) {
  const host = document.createElement("div"); host.className = "mbarchost"; document.body.appendChild(host);
  const quiet = new Proxy({}, { get: () => () => {} });
  play(key, host, quiet).then(res => {
    host.remove(); const c = planetCtx(); if (!c || !c.st) return; const mb = curMb(), old = Number(mb.hs[key]) || 0, s = Number(res && res.score) || 0;
    const better = key === "code" ? s > 0 && (!old || s < old) : s > old;
    if (better) { mb.hs[key] = s; save(mb, 0, "\u{1F3C6} New best in " + esc(gameByKey(key).name) + ": <b>" + s + "</b>!"); } else { say("\u{1F579}️ You scored <b>" + s + "</b> in " + esc(gameByKey(key).name) + "."); rer(); }
  });
}

if (typeof document !== "undefined") document.addEventListener("click", ev => {
  const t = ev.target.closest && ev.target.closest("[data-mb]"); if (!t) return;
  const [a, v, w] = t.dataset.mb.split(":"), mb = curMb();
  if (a === "pad") { const i = Number(v); if (mb.pads[i]) { if (moving) return; sel = sel === i ? -1 : i; dsel = -1; msg = null; return rer(); } return placeOn(i); }
  if (a === "dspot") { dsel = dsel === Number(v) ? -1 : Number(v); sel = -1; msg = null; return rer(); }
  if (a === "cancel") { sel = -1; dsel = -1; moving = ""; msg = null; return rer(); }
  if (a === "buy") return buy(v, false);
  if (a === "buyd") return buy(v, true);
  if (a === "deco") return decoOn(Number(v), w);
  if (a === "move") { moving = v; msg = null; return rer(); }
  if (a === "store") return store(v);
  if (a === "place") return placeStored(v, sel);
  if (a === "enter") { view = v; sel = -1; msg = null; ROOMSTATE = {}; rer(); return scrollTo({ top: 0 }); }
  if (a === "peek") return;
  if (a === "out") { view = "base"; msg = null; ROOMSTATE = {}; return rer(); }
  if (a === "visit") { visit = v || ""; return rer(); }
  if (a === "act") return act(v);
  if (a === "dial") { ROOMSTATE.freq = Math.max(0, Math.min(100, (ROOMSTATE.freq == null ? 50 : ROOMSTATE.freq) + Number(v))); return rer(); }
  if (a === "cry") { const p = (ROOMSTATE.pick || []).slice(); if (p.length >= 2) p.length = 0; p.push(v); ROOMSTATE.pick = p; ROOMSTATE.res = null; return rer(); }
  if (a === "star") { const c = conToday(mb), path = c[3]; let s = ROOMSTATE.step || 0; while (s < path.length && path[s] === null) s++; if (path[s] === Number(v)) { s++; while (s < path.length && path[s] === null) s++; ROOMSTATE.step = s; if (s >= path.length) return act("observatory"); } return rer(); }
  if (a === "restart") { ROOMSTATE = {}; return rer(); }
  if (a === "neb") return nebTap(v);
  if (a === "game") { if (!lastOpen || G) return; return v === "garage" ? rally() : v === "pool" ? splash() : bounce(); }
  if (a === "arc") { if (!lastOpen) return; return arcadePlay(v); }
});

/* ----- the page (planet.js zone "moon") ----- */
export function moonHTML(st, cls, students, petOf, open) {
  st = freshSt(st); lastStudents = students || []; lastPet = petOf || null; lastOpen = !!open;
  const mb = mbOf(st);
  if (view !== "base" && (!B[view] || !mb.own[view] || !mb.pads.includes(view))) view = "base";
  let h = '<div class="card mbcard"><div class="card-head"><h2>\u{1F319} My Moon Base</h2><span class="fact">\u{1F3D7}️ ' + (builtCount(st) + 1) + " buildings · ⭐ " + (Number(((st && st.planet) || {}).dust) || 0).toLocaleString() + "</span></div>";
  if (view !== "base") return h + roomHTML(view, st, open) + "</div>";
  if (visit) return h + visitHTML(students, st) + "</div>";
  return h + sceneHTML(st, true) + builderHTML(st, open) + visitHTML(students, st) + "</div>";
}
export const moonView = () => view;
