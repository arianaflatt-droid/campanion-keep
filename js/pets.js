/* ---------- 🐾 Nebbles: Planet JP pets (Phase 1, Nov 9) ----------
   Little round fuzzy alien pets (NOT creatures) that students adopt and collect, like Puffles. 50 Nebbles, 10 in each of
   5 groups (Common, Uncommon, Rare, Super Rare, Seasonal). They don't battle, level up or trade.
   - 🏠 Adoption Center (a place on the Planet JP map), run by Alien Duck (his job #5). Every day 5 Nebbles wait in the 5 cubbies:
     one Common, one Uncommon, one Rare, one Super Rare, and this month's Seasonal Nebble (a Common when the month has none).
     The 5 come from a hash of the student id + the date (ones they don't own yet first), so nothing is saved to keep them steady.
   - Adopting costs Stardust (planet.dust) and is ONE save. The student names it, and it gets a random personality.
   - One of each Nebble. Don't like the personality? Release it (it goes back to the Adoption Center), then adopt it again
     for a new personality (Ms. Ariana, Nov 9). Releasing gives no Stardust back.
   - My Nebbles: the collection (all 50, silhouettes for the ones still to find). Tap one to rename it, put on a hat or outfit
     the student already owns (st.outfits), make it their buddy, or release it.
   - 👀 The buddy pops up around the student's Keep (random spots, a few seconds, then hides; tap it for a happy reaction)
     when they launched to Planet JP today, OR can launch today (full tanks), OR launched on the last school day (planet.js nebbleOut).
     On a Lunch Hero day they can pick a different Nebble as that day's sidekick. Pop-ups can be switched off. All of this is
     page-only (localStorage), no database writes.
   Saved in planet.pets = { o: { key: { n: name, p: personality, h: outfit id or "", at: date adopted } }, buddy: key, rel: releases }
   through safari.js planetSave, so the other Planet JP saves aren't overwritten. */
import { esc, OUTFITS } from "./game.js?v=20261109j";
import { azToday } from "./collect.js?v=20261109j";
import { freshSt, planetSave, planetNow, planetCtx } from "./safari.js?v=20261109j";

export const PA = "assets/pets/", PP = PA + "place/";
export const TIERS = [
  { k: "c", name: "Common", cost: 150, color: "#1F6FB2" },
  { k: "u", name: "Uncommon", cost: 300, color: "#1C7A43" },
  { k: "r", name: "Rare", cost: 600, color: "#7A33C2" },
  { k: "s", name: "Super Rare", cost: 1200, color: "#9A6500" },
  { k: "e", name: "Seasonal", cost: 500, color: "#B8236A" }];
export const TIER = {}; TIERS.forEach(t => { TIER[t.k] = t; });
const N = (k, name, t, m) => ({ k, name, t, m });
export const NEBBLES = [
  N("sky", "Sky", "c"), N("lime", "Lime", "c"), N("amethyst", "Amethyst", "c"), N("frost", "Frost", "c"), N("ember", "Ember", "c"),
  N("blossom", "Blossom", "c"), N("midnight", "Midnight", "c"), N("sunny", "Sunny", "c"), N("mint", "Mint", "c"), N("cherry", "Cherry", "c"),
  N("sprinkle", "Sprinkle", "u"), N("tiger", "Tiger", "u"), N("zig", "Zig", "u"), N("cloudy", "Cloudy", "u"), N("duo", "Duo", "u"),
  N("freckle", "Freckle", "u"), N("sunset", "Sunset", "u"), N("ocean", "Ocean", "u"), N("checker", "Checker", "u"), N("starry", "Starry Cheeks", "u"),
  N("glittergold", "Glitter Gold", "r"), N("galaxy", "Galaxy", "r"), N("silver", "Silver", "r"), N("crystal", "Crystal", "r"), N("magma", "Magma", "r"),
  N("frostbite", "Frostbite", "r"), N("neon", "Neon", "r"), N("starrynight", "Starry Night", "r"), N("gummy", "Gummy", "r"), N("opal", "Opal", "r"),
  N("rainbow", "Rainbow", "s"), N("aurora", "Aurora", "s"), N("cosmic", "Cosmic", "s"), N("radiant", "Radiant", "s"), N("diamond", "Diamond", "s"),
  N("phoenix", "Phoenix", "s"), N("moonbeam", "Moonbeam", "s"), N("prism", "Prism", "s"), N("thunder", "Thunder", "s"), N("unicorn", "Unicorn", "s"),
  // Seasonal: only in the cubbies during their month(s) (Arizona time). They come back the same month next year.
  N("pumpkin", "Pumpkin", "e", [10]), N("pie", "Pie", "e", [11]), N("candycane", "Candy Cane", "e", [12]), N("snowball", "Snowball", "e", [1]),
  N("sweetheart", "Sweetheart", "e", [2]), N("clover", "Clover", "e", [3]), N("egg", "Egg", "e", [4]), N("springflower", "Blossom Spring", "e", [5]),
  N("sunbeam", "Sunbeam", "e", [6, 7]), N("pencil", "Pencil", "e", [8, 9])];
export const NEB = {}; NEBBLES.forEach(n => { NEB[n.k] = n; });
// the "happy" (eyes closed) pictures that are in so far; the others use their normal picture with a bounce
const HAPPY = new Set(("amethyst aurora blossom candycane checker cherry cloudy cosmic diamond duo ember freckle frost frostbite galaxy glittergold gummy lime magma midnight " +
  "mint moonbeam crystal radiant prism pie clover egg pencil snowball sunbeam sweetheart neon ocean opal phoenix pumpkin rainbow silver sky springflower sprinkle starry starrynight sunny sunset thunder tiger unicorn zig").split(" "));
export const PERSONALITIES = [
  { k: "bouncy", name: "Bouncy", e: "\u{1F938}", say: ["Boing boing!", "Wheee!", "Let’s hop!"] },
  { k: "sleepy", name: "Sleepy", e: "\u{1F634}", say: ["*yawn* Hi…", "Five more minutes…", "Zzz… oh, hi!"] },
  { k: "silly", name: "Silly", e: "\u{1F92A}", say: ["Hee hee!", "Boop!", "I’m a fuzzy potato!"] },
  { k: "shy", name: "Shy", e: "\u{1F648}", say: ["Oh! Um… hi.", "*peeks*", "You found me!"] },
  { k: "curious", name: "Curious", e: "\u{1F9D0}", say: ["What’s that?", "Ooh, a button!", "What are you working on?"] },
  { k: "giggly", name: "Giggly", e: "\u{1F606}", say: ["Tee hee hee!", "That tickles!", "*giggle*"] },
  { k: "brave", name: "Brave", e: "\u{1F9B8}", say: ["I’ll protect you!", "Onward, Captain!", "You’ve got this!"] },
  { k: "dreamy", name: "Dreamy", e: "\u{1F4AB}", say: ["I dreamed of stars…", "So sparkly…", "La la la…"] }];
export const PERS = {}; PERSONALITIES.forEach(p => { PERS[p.k] = p; });
// the 5 cubbies of adopt-bg.webp (centers in % of the picture width)
const CUB_X = [20.6, 35.9, 50.9, 65.9, 81.1];
const NAME_MAX = 14;

const plOf = st => (st && st.planet) || {};
export const petsOf = st => plOf(st).pets || {};
export const ownedOf = st => petsOf(st).o || {};
export const ownedCount = st => Object.keys(ownedOf(st)).filter(k => NEB[k]).length;
export const nebImg = k => PA + k + ".webp";
export const nebHappy = k => PA + k + (HAPPY.has(k) ? "-happy" : "") + ".webp";
function hash01(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } h ^= h >>> 15; h = Math.imul(h, 2246822507); h ^= h >>> 13; return ((h >>> 0) + 1) / 4294967297; }
const monthOf = d => Number(String(d).slice(5, 7)) || 0;
export const seasonalNow = d => NEBBLES.find(n => n.t === "e" && (n.m || []).includes(monthOf(d))) || null;
export const canAdoptNow = (k, d) => { const n = NEB[k]; return !!n && (n.t !== "e" || (n.m || []).includes(monthOf(d))); };

// today's 5 cubbies (same all day for the same student). Ones the student doesn't own yet come first.
export function cubbies(st, date) {
  const own = ownedOf(st), seas = seasonalNow(date), out = [];
  const pick = (t, skip) => { const list = NEBBLES.filter(n => n.t === t && !skip.includes(n.k)); if (!list.length) return null;
    const fresh = list.filter(n => !own[n.k]), pool = fresh.length ? fresh : list;
    return pool.map(n => ({ k: n.k, r: hash01((st && st.id) + "|" + date + "|" + n.k) })).sort((a, b) => b.r - a.r)[0].k; };
  ["c", "u", "r", "s"].forEach(t => out.push(pick(t, out)));
  out.push(seas ? seas.k : pick("c", out));
  return out;
}

// a Nebble picture, wearing its hat/outfit if it has one (hat = outfit id)
const outfit = id => OUTFITS.find(o => o.id === id) || null;
export function nebHTML(k, opt) {
  opt = opt || {}; const o = opt.hat ? outfit(opt.hat) : null;
  return '<span class="neb' + (opt.cls ? " " + opt.cls : "") + '"><img class="nbimg" src="' + (opt.happy ? nebHappy(k) : nebImg(k)) + '" alt="' + esc((NEB[k] || {}).name || "") + '" draggable="false">' +
    (o ? '<img class="nbhat' + (o.neck ? " neck" : "") + '" src="' + o.img + '" alt="">' : "") + "</span>";
}
const wearable = st => OUTFITS.filter(o => ((st && st.outfits) || {})[o.id]);

/* ---------- state for the Adoption Center screen (nothing here is saved) ---------- */
let sel = null, open1 = null, papers = null, msg = null;
const rer = () => { const c = planetCtx(); if (c && c.rerender) c.rerender(); };
const say = (text, bad) => { msg = { text, bad: !!bad }; };
const cleanName = (v, k) => { const s = String(v || "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, NAME_MAX); return s || (NEB[k] || {}).name || "Nebble"; };

function adopt(k) {
  const c = planetCtx(); if (!c || !c.st) return;
  const st = freshSt(c.st), d = azToday(), n = NEB[k], t = n && TIER[n.t]; if (!n) return;
  if (ownedOf(st)[k]) { say("You already have " + n.name + "! (One of each.)", true); return rer(); }
  if (!canAdoptNow(k, d)) { say(n.name + " is only here in its season.", true); return rer(); }
  if (!cubbies(st, d).includes(k)) { say(n.name + " isn’t in a cubby today. Check back tomorrow!", true); return rer(); }
  const pl = planetNow();
  if ((Number(pl.dust) || 0) < t.cost) { say("Not enough Stardust yet. " + n.name + " costs " + t.cost.toLocaleString() + " ⭐.", true); return rer(); }
  const inp = document.getElementById("nbname"), name = cleanName(inp && inp.value, k);
  const pets = JSON.parse(JSON.stringify(pl.pets || {})); pets.o = pets.o || {};
  const p = PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)].k;
  pets.o[k] = { n: name, p, h: "", at: d };
  if (!pets.buddy || !pets.o[pets.buddy]) pets.buddy = k;
  pl.pets = pets; pl.dust = (Number(pl.dust) || 0) - t.cost;
  planetSave(pl);
  sel = null; papers = k; msg = null; rer();
}
function savePets(fn) {
  const c = planetCtx(); if (!c || !c.st) return;
  const pl = planetNow(), pets = JSON.parse(JSON.stringify(pl.pets || {})); pets.o = pets.o || {};
  if (fn(pets) === false) return;
  pl.pets = pets; planetSave(pl); rer();
}
function release(k) {
  const n = NEB[k], own = ownedOf(freshSt((planetCtx() || {}).st))[k]; if (!n || !own) return;
  if (typeof confirm === "function" && !confirm("Release " + own.n + " back to the Adoption Center?\n\nAlien Duck will find it a new home. You won’t get Stardust back, but you can adopt " + n.name + " again (with a new personality) when it’s in a cubby.")) return;
  savePets(pets => { delete pets.o[k]; pets.rel = (Number(pets.rel) || 0) + 1;
    if (pets.buddy === k) pets.buddy = Object.keys(pets.o).find(x => NEB[x]) || ""; });
  open1 = null; say(own.n + " went back to the Adoption Center. Bye bye! \u{1F44B}");
}

if (typeof document !== "undefined") document.addEventListener("click", ev => {
  const t = ev.target.closest && ev.target.closest("[data-nb]"); if (!t) return;
  const [a, k, x] = t.dataset.nb.split(":");
  if (a === "cub") { sel = sel === k ? null : k; papers = null; msg = null; return rer(); }
  if (a === "close") { sel = null; papers = null; open1 = null; msg = null; return rer(); }
  if (a === "adopt") return adopt(k);
  if (a === "open") { open1 = open1 === k ? null : k; msg = null; return rer(); }
  if (a === "buddy") return savePets(p => { if (!p.o[k]) return false; p.buddy = k; });
  if (a === "hat") return savePets(p => { if (!p.o[k]) return false; p.o[k].h = x || ""; });
  if (a === "ren") { const inp = document.getElementById("nbren"); return savePets(p => { if (!p.o[k]) return false; const nm = cleanName(inp && inp.value, k); if (nm === p.o[k].n) return false; p.o[k].n = nm; }); }
  if (a === "rel") return release(k);
  // My Companion tab: page-only settings (no database writes)
  if (a === "pop") { setOff(!popOff()); return side.rerender && side.rerender(); }
  if (a === "side") { setSide(k); hideNow(); return side.rerender && side.rerender(); }
});

/* ---------- 🏠 the Adoption Center (Planet JP tab) ---------- */
function cubbyHTML(st, k, i, d) {
  const n = NEB[k], t = TIER[n.t], own = ownedOf(st)[k];
  return '<button class="nbcub' + (sel === k ? " on" : "") + (own ? " own" : "") + '" style="left:' + CUB_X[i] + '%" data-nb="cub:' + k + '" aria-label="' + esc(n.name) + '">' + nebHTML(k, { cls: "nbbob" }) + "</button>" +
    '<span class="nbtag" style="left:' + CUB_X[i] + "%;border-color:" + t.color + '"><b style="color:' + t.color + '">' + t.name + "</b>" + (own ? "✅ Adopted" : t.cost.toLocaleString() + " ⭐") + "</span>";
}
function adoptPanel(st, k, open) {
  const n = NEB[k], t = TIER[n.t], own = ownedOf(st)[k], dust = Number(plOf(st).dust) || 0, can = dust >= t.cost;
  let h = '<div class="nbpanel card"><div class="nbpanelpic">' + nebHTML(k, { cls: "nbbig nbbob" }) + '</div><div class="nbpanelinfo">' +
    '<h3>' + esc(n.name) + ' <span class="nbtier" style="background:' + t.color + '">' + t.name + "</span></h3>";
  if (own) h += '<p>You already adopted ' + esc(n.name) + ' (named <b>' + esc(own.n) + "</b>). It’s one of each, so look in <b>My Nebbles</b> below!</p>";
  else if (!open) h += "<p>Adopting is open while Planet JP is open.</p>";
  else h += '<p>Price: <b>' + t.cost.toLocaleString() + " ⭐</b> · you have <b>" + dust.toLocaleString() + " ⭐</b>" + (n.t === "e" ? " · \u{1F389} only here this season!" : "") + "</p>" +
    '<label class="nblabel">Give it a name: <input id="nbname" maxlength="' + NAME_MAX + '" value="' + esc(n.name) + '" autocomplete="off"></label>' +
    '<div class="row" style="gap:8px;margin-top:8px;"><button class="btn gold" data-nb="adopt:' + k + '"' + (can ? "" : " disabled") + ">\u{1F43E} Adopt for " + t.cost.toLocaleString() + " ⭐</button>" +
    '<button class="btn ghost" data-nb="close">Not now</button></div>' + (can ? "" : '<p class="small muted" style="margin:6px 0 0;">You need ' + (t.cost - dust).toLocaleString() + " more Stardust. Launch, play and do your missions to earn more!</p>");
  return h + "</div></div>";
}
function papersHTML(st, k) {
  const n = NEB[k], own = ownedOf(st)[k]; if (!own) return "";
  const p = PERS[own.p] || PERSONALITIES[0], t = TIER[n.t];
  return '<div class="nbpapers card"><div class="nbpaper"><img class="nbpaperbg" src="' + PP + 'adopt-papers.webp" alt="Adoption papers">' +
    '<span class="nbpaperpet">' + nebHTML(k, { happy: true, cls: "nbbob" }) + "</span>" +
    '<b class="nbpn">' + esc(own.n) + '</b><span class="nbpk" style="color:' + t.color + '">' + esc(n.name) + " · " + t.name + '</span><span class="nbpp">' + p.e + " Personality: <b>" + p.name + "</b></span></div>" +
    '<div class="nbpapersay"><img src="' + PP + 'ad-cheer.webp" alt="Alien Duck"><div><h3>\u{1F389} It’s official!</h3><p><b>' + esc(own.n) + "</b> is your Nebble now. " +
    (petsOf(st).buddy === k ? "It’s your <b>buddy</b>, so it will pop up around your Keep on days you launch!" : "Make it your <b>buddy</b> in My Nebbles to take it with you!") + "</p>" +
    '<button class="btn gold" data-nb="close">Yay! \u{1F496}</button></div></div></div>';
}
function petPanel(st, k, open) {
  const n = NEB[k], own = ownedOf(st)[k], t = TIER[n.t], p = PERS[own.p] || PERSONALITIES[0], isBuddy = petsOf(st).buddy === k, hats = wearable(st);
  let h = '<div class="nbpanel card"><div class="nbpanelpic">' + nebHTML(k, { hat: own.h, cls: "nbbig nbbob" }) + '</div><div class="nbpanelinfo">' +
    '<h3>' + esc(own.n) + ' <span class="nbtier" style="background:' + t.color + '">' + esc(n.name) + " · " + t.name + "</span></h3>" +
    "<p>" + p.e + " Personality: <b>" + p.name + "</b> · adopted " + esc(own.at || "") + (isBuddy ? " · ⭐ <b>your buddy</b>" : "") + "</p>";
  if (!open) return h + '<p class="small muted">Come back while Planet JP is open to rename it, change its hat or pick your buddy.</p></div></div>';
  h += '<div class="row" style="gap:8px;flex-wrap:wrap;"><input id="nbren" maxlength="' + NAME_MAX + '" value="' + esc(own.n) + '" autocomplete="off" aria-label="Name"><button class="btn small" data-nb="ren:' + k + '">✏️ Rename</button>' +
    (isBuddy ? "" : '<button class="btn small gold" data-nb="buddy:' + k + '">⭐ Make my buddy</button>') + "</div>" +
    '<p class="small" style="margin:10px 0 4px;"><b>\u{1F3A9} Hats and outfits</b> (any you own)</p><div class="nbhats">' +
    '<button class="nbhatbtn' + (own.h ? "" : " on") + '" data-nb="hat:' + k + ':">\u{1F6AB}<small>None</small></button>' +
    hats.map(o => '<button class="nbhatbtn' + (own.h === o.id ? " on" : "") + '" data-nb="hat:' + k + ":" + o.id + '" title="' + esc(o.name) + '"><img src="' + o.img + '" alt=""><small>' + esc(o.name) + "</small></button>").join("") + "</div>" +
    (hats.length ? "" : '<p class="small muted" style="margin:4px 0 0;">You don’t own any hats or outfits yet. Get them in the Space Shop and event shops!</p>') +
    '<div class="row" style="gap:8px;margin-top:12px;"><button class="btn ghost small" data-nb="close">Done</button><button class="btn ghost small nbrelbtn" data-nb="rel:' + k + '">\u{1F44B} Release</button></div>' +
    '<p class="small muted" style="margin:6px 0 0;">Not the right personality? Release it back to the Adoption Center, then adopt it again from a cubby for a new one.</p>';
  return h + "</div></div>";
}
function collectionHTML(st) {
  const own = ownedOf(st), buddy = petsOf(st).buddy;
  let h = '<div class="card nbcoll"><div class="card-head"><h2>\u{1F43E} My Nebbles</h2><span class="fact">' + ownedCount(st) + " / " + NEBBLES.length + "</span></div>" +
    '<p class="lede" style="margin:0 0 8px;font-size:14px;">One of each to find! Tap a Nebble you’ve adopted to rename it, give it a hat or make it your buddy.</p>';
  TIERS.forEach(t => {
    h += '<div class="nbrow"><div class="nbrowname" style="color:' + t.color + '">' + t.name + " <small>" + t.cost.toLocaleString() + " ⭐</small></div><div class=\"nbslots\">";
    NEBBLES.filter(n => n.t === t.k).forEach(n => { const o = own[n.k];
      h += o ? '<button class="nbslot have' + (open1 === n.k ? " on" : "") + '" data-nb="open:' + n.k + '" title="' + esc(o.n) + '">' + nebHTML(n.k, { hat: o.h }) + "<small>" + esc(o.n) + "</small>" + (buddy === n.k ? '<i class="nbstar">⭐</i>' : "") + "</button>"
        : '<span class="nbslot" title="' + (n.t === "e" ? esc(n.name) + " (seasonal)" : "???") + '">' + nebHTML(n.k) + "<small>" + (n.t === "e" ? esc(n.name) : "???") + "</small></span>"; });
    h += "</div></div>"; });
  return h + "</div>";
}
export function adoptHTML(st, cls, open) {
  st = freshSt(st); const d = azToday(), cubs = cubbies(st, d), dust = Number(plOf(st).dust) || 0, n = ownedCount(st);
  if (papers && !ownedOf(st)[papers]) papers = null;
  if (open1 && !ownedOf(st)[open1]) open1 = null;
  const duck = papers ? "ad-cheer" : sel ? "ad-hold" : "ad-wave";
  let line;
  if (sel) { const s = NEB[sel]; line = ownedOf(st)[sel] ? "That’s your " + esc(s.name) + "! Pick a different cubby to meet someone new." : "This is <b>" + esc(s.name) + "</b>! Isn’t it cute? Give it a name and adopt it below!"; }
  else if (!n) line = "Welcome to the <b>Adoption Center</b>, Captain! These Nebbles need a home. Tap a cubby to meet one!";
  else line = "Welcome back! New Nebbles move into the cubbies <b>every day</b>. Tap one to say hi!";
  let h = '<div class="card nbcard"><div class="card-head"><h2>\u{1F43E} Adoption Center</h2><span class="fact">⭐ ' + dust.toLocaleString() + " Stardust</span></div>" +
    '<div class="nbscene" style="background-image:url(' + PP + 'adopt-bg.webp)">' + cubs.map((k, i) => cubbyHTML(st, k, i, d)).join("") +
    '<img class="nbduck" src="' + PP + duck + '.webp" alt="Alien Duck"><div class="nbsay">' + line + '</div></div><p class="nbsaym">\u{1F986} ' + line + "</p>";
  if (msg) h += '<div class="banner ' + (msg.bad ? "bad" : "info") + '" style="margin-top:10px;">' + esc(msg.text) + "</div>";
  h += "</div>";
  if (papers) h += papersHTML(st, papers);
  else if (sel) h += adoptPanel(st, sel, open);
  if (open1) h += petPanel(st, open1, open);
  return h + collectionHTML(st);
}

/* ---------- 👀 the buddy / sidekick popping up around the Keep (page only: no database writes) ---------- */
const LS_OFF = "ck-neb-off", LS_SIDE = "ck-neb-side";
const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const lsSet = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} };
let side = { st: null, out: false, rerender: null, busy: false, preview: false };
const popOff = () => lsGet(LS_OFF + ":" + ((side.st && side.st.id) || "")) === "1";
const setOff = v => lsSet(LS_OFF + ":" + ((side.st && side.st.id) || ""), v ? "1" : null);
export function lunchHeroToday(st, cls) {
  const h = ((st && st.xpHist) || {})[azToday()] || {}, goal = (cls && Number(cls.goal)) || 120;
  return !!h.lh || (h.l != null && Number(h.l) >= goal);
}
function sidePick(st) { try { const v = JSON.parse(lsGet(LS_SIDE) || "null"); return v && v.id === (st && st.id) && v.d === azToday() ? v.k : ""; } catch (e) { return ""; } }
const setSide = k => lsSet(LS_SIDE, JSON.stringify({ id: side.st && side.st.id, d: azToday(), k }));
// who pops up today: the Lunch Hero sidekick they picked, else their buddy
export function sidekickOf(st, cls) {
  const own = ownedOf(st), p = lunchHeroToday(st, cls) ? sidePick(st) : "";
  if (p && own[p]) return p;
  const b = petsOf(st).buddy; return b && own[b] ? b : "";
}

// the card on the My Companion tab (only once they own a Nebble)
export function nebbleCard(st, cls, out) {
  st = freshSt(st); const own = ownedOf(st), keys = Object.keys(own).filter(k => NEB[k]); if (!keys.length) return "";
  const k = sidekickOf(st, cls), o = own[k] || {}, lh = lunchHeroToday(st, cls), off = popOff();
  let h = '<div class="card nbbuddy"><div class="nbbuddypic">' + (k ? nebHTML(k, { hat: o.h, cls: "nbbob" }) : "") + '</div><div class="nbbuddyinfo">' +
    "<h2>\u{1F43E} " + (k ? esc(o.n) + (lh && sidePick(st) === k ? " · today’s sidekick" : " · your Nebble buddy") : "Your Nebbles") + "</h2>" +
    '<p class="small" style="margin:2px 0 6px;">' + (off ? "Pop-ups are <b>off</b>." : out ? "\u{1F680} You can go to Planet JP today, so <b>" + esc(o.n || "your buddy") + "</b> is popping up around your Keep. Tap it when you see it!" :
      "It pops up around your Keep on days you launch to Planet JP (or have full tanks).") + "</p>";
  if (lh && keys.length > 1) h += '<p class="small" style="margin:0 0 4px;"><b>☀️ You’re a Lunch Hero!</b> Pick today’s sidekick:</p><div class="nbsidepick">' +
    keys.map(x => '<button class="nbslot have' + (x === k ? " on" : "") + '" data-nb="side:' + x + '" title="' + esc(own[x].n) + '">' + nebHTML(x, { hat: own[x].h }) + "<small>" + esc(own[x].n) + "</small></button>").join("") + "</div>";
  h += '<button class="btn ghost small" data-nb="pop">' + (off ? "\u{1F440} Turn pop-ups on" : "\u{1F648} Turn pop-ups off") + "</button>";
  return h + "</div></div>";
}

let root = null, timer = null, hideT = null, showing = null;
const SPOTS = ["bl", "br", "l", "r", "b"];
function rootEl() {
  if (!root) { root = document.createElement("div"); root.id = "nebroot"; document.body.appendChild(root);
    root.addEventListener("click", ev => { const b = ev.target.closest(".nbpop"); if (b) tapped(b); }); }
  return root;
}
function hideNow() { clearTimeout(hideT); if (root) root.innerHTML = ""; showing = null; }
function schedule(ms) { clearTimeout(timer); timer = setTimeout(popUp, ms == null ? 8000 + Math.random() * 22000 : ms); }
function popUp() {
  schedule();
  const st = side.st; if (!st || !side.out || popOff() || side.busy || document.hidden) return;
  if (document.querySelector(".pjover, .pgover, #safroot:not(:empty), .bookover, .modal, .overlay")) return;   // stay out of the way of full-screen things
  const k = sidekickOf(st, side.cls); if (!k) return;
  const o = ownedOf(st)[k], p = PERS[o.p] || PERSONALITIES[0], spot = SPOTS[Math.floor(Math.random() * SPOTS.length)];
  const pos = spot === "l" || spot === "r" ? "top:" + Math.round(25 + Math.random() * 45) + "%" : spot === "b" ? "left:" + Math.round(20 + Math.random() * 55) + "%" : "";
  rootEl().innerHTML = '<button class="nbpop at-' + spot + " pp-" + p.k + '" style="' + pos + '" data-k="' + k + '" aria-label="' + esc(o.n) + '">' + nebHTML(k, { hat: o.h }) + "</button>";
  showing = k; clearTimeout(hideT); hideT = setTimeout(() => { const b = root && root.querySelector(".nbpop"); if (b && !b.classList.contains("tap")) { b.classList.add("bye"); hideT = setTimeout(hideNow, 600); } }, 5500);
}
function tapped(b) {
  const st = side.st, k = b.dataset.k, o = st && ownedOf(st)[k]; if (!o || b.classList.contains("tap")) return;
  const p = PERS[o.p] || PERSONALITIES[0], line = p.say[Math.floor(Math.random() * p.say.length)];
  b.classList.add("tap"); const img = b.querySelector(".nbimg"); if (img) img.src = nebHappy(k);
  b.insertAdjacentHTML("beforeend", '<span class="nbhearts">\u{1F496}<i>✨</i><i>\u{1F496}</i></span><span class="nbline"><b>' + esc(o.n) + ":</b> " + esc(line) + "</span>");
  clearTimeout(hideT); hideT = setTimeout(() => { b.classList.add("bye"); hideT = setTimeout(hideNow, 600); }, 2600);
}
// called on every student page render. c = { st, cls, out (planet.js nebbleOut), busy, rerender, preview }
export function nebbleSync(c) {
  const was = side.st && side.st.id; side = Object.assign({}, c, { st: c.st ? freshSt(c.st) : null });
  if (typeof document === "undefined") return;
  if (!side.st || !side.out || popOff() || !sidekickOf(side.st, side.cls)) { clearTimeout(timer); timer = null; hideNow(); return; }
  if (showing && showing !== sidekickOf(side.st, side.cls)) hideNow();
  if (!timer || was !== side.st.id) schedule(was === side.st.id ? null : 4000);
}
