/* ---------- 🛒 Planet JP Space Shop + 🔧 Swap Shop (Nov 8) ----------
   In the Planet JP tab (open after the day's launch until 12:55). Everything costs ⭐ Stardust.
   • Space Shop (Bolt the robot): the season's collection (outfits + a room set), S.S. Duck paint, flames, trails, orbit buddies,
     café table extras, the Planet JP Egg (2,000 ⭐, hatches an alien) and the 🎁 Mystery Space Crate (75 ⭐).
   • Swap Shop (the duck in his trader outfit): ONE deal a day for each student: a themed room piece they don't own yet, cheap.
     About 1 day in 10 it's a ✨ Lucky Find: a holiday or event set piece.
   Every buy is one write (planet + the thing bought: outfits / roomOwned / coll), through safari.js planetSave so the safari, the café
   and the shop never overwrite each other. Teacher preview and the student demo save nothing to the class. Catalog: shop-data.js. */
import { esc } from "./game.js?v=20261108a";
import { azToday } from "./collect.js?v=20261108a";
import { planetNow, planetSave, planetCtx, freshSt } from "./safari.js?v=20261108a";
import { TYPE_THEMES, SEASON_THEMES, KINDS, itemName, itemArt, owned as roomOwnedList } from "./room.js?v=20261108a";
import { ALIEN_CREATURES, ALIEN_FAMILIES } from "./aliens.js?v=20261108a";
import { HANGAR_CATS, HANGAR_OPEN, SHOP_ITEMS, SHOP_BY, CATS, CRATE_COST, SHOP_ART, COLLECTIONS, shopOf, hasItem, wearing } from "./shop-data.js?v=20261108a";

const WEAR_CATS = ["duck", "flame", "trail", "orbit", "table"];
let msg = null, extra = null;   // the last message, and the last non-planet fields saved (so the page shows them before the save comes back)
const ctx = () => planetCtx();
const stNow = st => { st = freshSt(st); if (extra && st && extra.id === st.id) st = Object.assign({}, st, extra.data); return st; };
const dustOf = st => Number(((st && st.planet) || {}).dust) || 0;
const rerender = () => { const c = ctx(); if (c && c.rerender) c.rerender(); };

/* ---------- the Swap Shop's deal of the day (the same all day for one student) ---------- */
const EVENT_SETS = ["library", "leafy", "cabin", "aurora", "valpost", "kite"];
const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
export const SWAP_PRICE = 45, LUCKY_PRICE = 70;
export function swapDeal(st) {
  const day = azToday(), h = hash(String(st && st.id) + day), mine = roomOwnedList(st), sw = shopOf(st).sw || {};
  if (sw.d === day && sw.id) return { id: sw.id, lucky: !!sw.lk, cost: sw.lk ? LUCKY_PRICE : SWAP_PRICE, got: true };   // today's deal, already bought
  const lucky = h % 10 === 0;
  const themes = lucky ? Object.keys(SEASON_THEMES).concat(EVENT_SETS) : TYPE_THEMES;
  let pool = themes.flatMap(th => KINDS.map(k => k + "_" + th)).filter(id => !mine.includes(id));
  let lk = lucky;
  if (!pool.length) { pool = TYPE_THEMES.concat(Object.keys(SEASON_THEMES), EVENT_SETS).flatMap(th => KINDS.map(k => k + "_" + th)).filter(id => !mine.includes(id)); lk = false; }
  if (!pool.length) return null;
  const id = pool[(h >>> 4) % pool.length];
  return { id, lucky: lk, cost: lk ? LUCKY_PRICE : SWAP_PRICE, got: (shopOf(st).sw || {}).d === day };
}

/* ---------- buying ---------- */
function pay(cost, change, extraFields, text) {
  const c = ctx(); if (!c || !c.st) return false;
  const pl = planetNow(); if ((Number(pl.dust) || 0) < cost) { msg = { bad: 1, text: "Not enough Stardust yet." }; rerender(); return false; }
  pl.dust = (Number(pl.dust) || 0) - cost; pl.shop = JSON.parse(JSON.stringify(pl.shop || {})); pl.shop.o = pl.shop.o || {}; pl.shop.w = pl.shop.w || {};
  pl.shop.n = (Number(pl.shop.n) || 0) + 1;
  change(pl.shop, pl);
  if (extraFields) extra = { id: c.st.id, data: Object.assign({}, extra && extra.id === c.st.id ? extra.data : {}, extraFields) };
  planetSave(pl, extraFields);
  msg = { text: text + (c.preview ? " (Preview: nothing was saved.)" : "") }; try { chime(); } catch (e) {}
  rerender(); return true;
}
function give(st, it, shop) {   // what owning an item means; returns the extra fields to save
  if (it.cat === "outfit") return { outfits: Object.assign({}, st.outfits || {}, { [it.k]: true }) };
  if (it.cat === "room") return { roomOwned: (st.roomOwned || []).concat([it.k]) };
  shop.o[it.k] = 1;
  if (WEAR_CATS.includes(it.cat)) shop.w[it.cat] = it.k;   // new things go on right away
  return null;
}
const HOW = { outfit: "Wear it from Gear on My Companion!", room: "Decorate with it in My Room!", duck: "Your duck has its new paint!", flame: "Your rocket has its new flame!", trail: "Look behind your duck on the launch bar!", orbit: "It’s circling your companion now!", table: "It’s at your seat in the Space Café!" };
function buy(k) {
  const it = SHOP_BY[k], c = ctx(); if (!it || !c) return;
  const st = stNow(c.st); if (hasItem(st, k) && !it.again) return;
  if (it.cost >= 300 && typeof confirm === "function" && !confirm("Buy " + it.name + " for " + it.cost + " ⭐ Stardust?")) return;
  if (it.cat === "egg") return hatchEgg(st, it);
  const ex = it.cat === "outfit" || it.cat === "room" ? give(st, it, null) : null;   // outfits / room pieces live outside planet
  pay(it.cost, shop => { if (!ex) give(st, it, shop); }, ex, "\u{1F389} You got the " + it.name + "! " + (HOW[it.cat] || ""));
}
// 🥚 Planet JP Egg: an alien you don't have yet (Lv 1), or +5 levels on one you do. 10% Sparkle.
function hatchEgg(st, it) {
  const coll = Object.assign({}, st.coll || {}), fams = ALIEN_FAMILIES.map(f => f.id), missing = fams.filter(f => !coll[f]);
  const fam = (missing.length ? missing : fams)[Math.floor(Math.random() * (missing.length || fams.length))];
  const had = coll[fam], spk = Math.random() < 0.1;
  coll[fam] = had ? Object.assign({}, had, { lvl: Math.min(100, (Number(had.lvl) || 1) + 5) }) : { lvl: 1, at: new Date().toISOString(), caught: true };
  if (spk) coll[fam].sparkle = true;
  const fm = ALIEN_FAMILIES.find(f => f.id === fam), cr = ALIEN_CREATURES.find(x => x.id === (fm.forms || [])[0]) || {};
  if (!pay(it.cost, shop => { shop.egg = (Number(shop.egg) || 0) + 1; }, { coll, collTouch: [fam] }, "")) return;
  msg = { egg: cr.img, text: (spk ? "✨ SPARKLE! " : "\u{1F95A} It hatched! ") + "You got " + (cr.name || "a Planet JP alien") + (had ? " (+5 levels!)" : "! It joined your Creature Collector.") + (ctx().preview ? " (Preview: nothing was saved.)" : "") };
  rerender();
}
// 🎁 Mystery Space Crate: mostly small things, sometimes something big, sometimes Stardust back
function openCrate() {
  const c = ctx(); if (!c) return; const st = stNow(c.st);
  const r0 = Math.random(), r = !HANGAR_OPEN && r0 >= 0.97 ? 0.9 : r0, notMine = cats => SHOP_ITEMS.filter(i => cats.includes(i.cat) && (HANGAR_OPEN || !HANGAR_CATS.includes(i.cat)) && !i.goal && !hasItem(st, i.k));
  let pickFrom = r < 0.4 ? notMine(["table", "flame"]).concat(HANGAR_OPEN ? [] : notMine(["table"])) : r < 0.65 ? [] : r < 0.85 ? notMine(["trail", "orbit"]).concat(HANGAR_OPEN ? [] : notMine(["orbit"])) : r < 0.97 ? notMine(["outfit"]) : notMine(["duck"]);
  const it = pickFrom.length ? pickFrom[Math.floor(Math.random() * pickFrom.length)] : null;
  const back = it ? 0 : 30 + Math.floor(Math.random() * 8) * 10;   // 30–100 Stardust back
  const ex = it && (it.cat === "outfit" || it.cat === "room") ? give(st, it, null) : null;
  if (!pay(CRATE_COST, (shop, pl) => { shop.cr = (Number(shop.cr) || 0) + 1; if (it && !ex) give(st, it, shop); else if (!it) pl.dust += back; }, ex, "")) return;
  msg = { crate: it ? (it.img || "") : "", emo: it && !it.img ? it.emo : "", text: "\u{1F381} The crate popped open: " + (it ? "the <b>" + esc(it.name) + "</b>! " + (HOW[it.cat] || "") : "<b>" + back + " ⭐ Stardust</b>!") + (c.preview ? " (Preview: nothing was saved.)" : ""), html: 1 };
  rerender();
}
function buySwap() {
  const c = ctx(); if (!c) return; const st = stNow(c.st), d = swapDeal(st); if (!d || d.got) return;
  pay(d.cost, shop => { shop.sw = { d: azToday(), got: 1, id: d.id, lk: d.lucky ? 1 : 0 }; shop.swn = (Number(shop.swn) || 0) + 1; }, { roomOwned: (st.roomOwned || []).concat([d.id]) }, "\u{1F91D} Deal! The " + itemName(d.id) + " is yours. Decorate with it in My Room!");
}
function use(k) {   // put on / take off a duck paint, flame, trail, buddy or table extra
  const it = SHOP_BY[k], c = ctx(); if (!it || !c || !WEAR_CATS.includes(it.cat)) return;
  const pl = planetNow(); pl.shop = JSON.parse(JSON.stringify(pl.shop || {})); pl.shop.w = pl.shop.w || {};
  if (pl.shop.w[it.cat] === k) delete pl.shop.w[it.cat]; else pl.shop.w[it.cat] = k;
  planetSave(pl); msg = null; rerender();
}
if (typeof document !== "undefined") document.addEventListener("click", ev => {
  const t = ev.target.closest && ev.target.closest("[data-shbuy],[data-shuse],[data-shcrate],[data-shswap],[data-shok]"); if (!t) return;
  if (t.dataset.shbuy) buy(t.dataset.shbuy); else if (t.dataset.shuse) use(t.dataset.shuse); else if (t.dataset.shcrate) openCrate(); else if (t.dataset.shswap) buySwap(); else if (t.dataset.shok) { msg = null; rerender(); }
});

/* ---------- the page ---------- */
const pic = it => it.img ? '<img src="' + it.img + '" alt="">' : '<span class="shemo">' + (it.emo || "✨") + "</span>";
function itemCard(st, it, open, dust) {
  const have = hasItem(st, it.k) && !it.again, on = WEAR_CATS.includes(it.cat) && wearing(st, it.cat) && wearing(st, it.cat).k === it.k;
  let btn;
  if (have) btn = WEAR_CATS.includes(it.cat) ? '<button class="btn small' + (on ? " gold" : " ghost") + '" data-shuse="' + it.k + '">' + (on ? "✅ Using" : "Use") + "</button>"
    : '<span class="shown">✅ ' + (it.cat === "outfit" ? "In Gear" : "In My Room") + "</span>";
  else btn = open ? '<button class="btn small' + (dust >= it.cost ? " gold" : " ghost") + '" data-shbuy="' + it.k + '"' + (dust >= it.cost ? "" : " disabled") + ">" + it.cost.toLocaleString() + " ⭐</button>" : '<span class="muted small">' + it.cost.toLocaleString() + " ⭐</span>";
  return '<div class="shitem' + (have ? " own" : "") + (it.goal ? " goal" : "") + '">' + pic(it) + "<b>" + esc(it.name) + "</b>" + btn + "</div>";
}
export function shopPageHTML(st, cls, open, which) {
  st = stNow(st); const dust = dustOf(st), d = swapDeal(st);
  let h = msg ? '<div class="card shmsg' + (msg.bad ? " bad" : "") + '">' + (msg.egg ? '<img class="shpop" src="' + msg.egg + '" alt="">' : msg.crate ? '<img class="shpop" src="' + msg.crate + '" alt="">' : msg.emo ? '<span class="shpop shemo">' + msg.emo + "</span>" : "") +
    "<p>" + (msg.html ? msg.text : esc(msg.text)) + '</p><button class="btn small ghost" data-shok="1">OK</button></div>' : "";
  // 🔧 Swap Shop
  if (which !== "shop") h += '<div class="card shswap"><div class="shhead"><img class="shkeeper" src="' + SHOP_ART + 'swap-duck.webp" alt=""><div><h2>\u{1F527} The Swap Shop</h2>' +
    '<p class="lede" style="font-size:14px;">“Psst, Captain! One deal a day, just for you. Come back tomorrow for a new one!”</p></div><img class="shstall" src="' + SHOP_ART + 'swap-shop.webp" alt=""></div>' +
    (d ? '<div class="shdeal' + (d.lucky ? " lucky" : "") + '"><img src="' + itemArt(d.id) + '" alt=""><div><b>' + (d.lucky ? "✨ Lucky Find! " : "Today’s deal: ") + esc(itemName(d.id)) + '</b><small>A room piece for My Room' + (d.lucky ? " (a rare holiday or event piece!)" : "") + "</small></div>" +
      (d.got ? '<span class="shown">✅ Bought today</span>' : open ? '<button class="btn gold" data-shswap="1"' + (dust >= d.cost ? "" : " disabled") + ">" + d.cost + " ⭐</button>" : '<span class="muted">' + d.cost + " ⭐</span>") + "</div>"
      : '<p class="lede">You own every room piece the Swap Shop has. Wow!</p>') + "</div>";
  if (which === "swap") return h;
  // 🛒 Space Shop
  h += '<div class="card shshop"><div class="shhead"><img class="shkeeper" src="' + SHOP_ART + 'shopkeeper-bolt.webp" alt=""><div><h2>\u{1F6D2} Space Shop</h2><span class="fact">⭐ ' + dust.toLocaleString() + " Stardust</span>" +
    '<p class="lede" style="font-size:14px;">“Beep boop! Welcome, Captain! This season: <b>' + COLLECTIONS[COLLECTIONS.length - 1].name + "</b>.”</p></div><img class=\"shstall\" src=\"" + SHOP_ART + 'space-shop.webp" alt=""></div>' +
    '<div class="shcrate"><img src="' + SHOP_ART + 'mystery-crate.webp" alt=""><div><b>\u{1F381} Mystery Space Crate</b><small>A surprise from the shop (mostly small things, sometimes something big) or Stardust back!</small></div>' +
    (open ? '<button class="btn gold" data-shcrate="1"' + (dust >= CRATE_COST ? "" : " disabled") + ">" + CRATE_COST + " ⭐</button>" : "") + "</div>";
  CATS.forEach(([cat, title, sub]) => { if (!HANGAR_OPEN && HANGAR_CATS.includes(cat)) return; const list = SHOP_ITEMS.filter(i => i.cat === cat); if (!list.length) return;
    h += '<h3 class="shcat">' + title + ' <small class="muted">' + esc(sub) + "</small></h3><div class=\"shgrid\">" + list.map(i => itemCard(st, i, open, dust)).join("") + "</div>"; });
  return h + (open ? "" : '<p class="small muted">The shops open after today’s launch, until 12:55.</p>') + "</div>";
}
let AC = null;
function chime() { try { if (localStorage.getItem("ck-mute") === "1") return; } catch (e) {} AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const a = AC;
  [988, 1319, 1760].forEach((f, i) => { const t = a.currentTime + i * 0.09, o = a.createOscillator(), g = a.createGain(); o.type = "triangle"; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.07, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14); o.connect(g).connect(a.destination); o.start(t); o.stop(t + 0.16); }); }
