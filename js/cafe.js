/* ---------- ☕ Space Café + 👩‍🍳 Cosmic Kitchen (Planet JP, Nov 7) ----------
   In the Planet JP tab (open after the day's launch until 12:55 AZ):
   • Cosmic Kitchen: Chef Duck teaches a snack in 3 quick steps (pour / time / tap fast / tap in order). Each step is
     Perfect, Good or Oops; the snack gets 1–3 ⭐. The FIRST cook of the day counts: +5 / +10 / +15 Stardust, the snack glow
     on the companion in The Keep for the rest of the day, and a seat in the café. After that, cooking is practice (nothing saved).
   • Collecting: a snack is KEPT after cooking it at 3 stars 3 times (CAFE_KEEP). Kept snacks live in the Snack Box and can be
     worn in the 3-day streak snack spot. The menu = 6 regulars + this month's 2 specials (specials only cook in their month).
   • The café: 6 tables × 6 seats. Everyone who cooked today sits with their snack, until 12:55.
   Saved in planet.cf (see cafe-data.js), one write per day. Saves go through safari.js planetSave so the safari and the
   café never overwrite each other. Teacher preview saves nothing. */
import { esc } from "./game.js?v=20261109e";
import { azToday } from "./collect.js?v=20261109e";
import { planetNow, planetSave, planetCtx, freshSt } from "./safari.js?v=20261109e";
import { tableImgOf } from "./shop-data.js?v=20261109e";
import { REGULARS, SPECIALS, SNACKS, SNACK_BY, MONTHS, CAFE_KEEP, cafeOf, perfectOf, snackKept, keptCount } from "./cafe-data.js?v=20261109e";
export { SNACKS, cafeOf, snackKept };

const P = "assets/planet/cafe/";
const im = f => P + f + ".webp";
export const STAR_DUST = [0, 5, 10, 15];
const monthNow = () => Number(azToday().slice(5, 7));
export const menuToday = () => REGULARS.concat(SPECIALS.filter(s => s.month === monthNow()));
export const cookedToday = st => cafeOf(st).d === azToday();

/* ---------- the 3 steps of each recipe ----------
   t (how you play): "hold" (press and hold, let go at the line) · "stop" (tap when the star is in the green) ·
      "mash" (tap fast) · "order" (tap the things in the right order)
   fx (what you SEE happen, Nov 7): pour (a stream fills the cup) · dip · blend · shake (salt falls) · stir (the spoon
      circles in the cup) · sprinkle · drop (berries fall in) · chop (the potato gets cut into star pieces) · wiggle (the pop
      slides out) · into (goes in the oven / freezer) · fry (bubbles) · layers (juice layers stack up) · add (things go in the bowl) */
// the inside of each container (% of its picture) where a drink / dough shows, plus its shape
const INSIDE = {
  "mug-empty": { l: 6, t: 18, w: 62, h: 64, clip: "inset(0 0 0 0 round 0 0 40% 40%)" },
  "glass-empty": { l: 29, t: 12, w: 52, h: 62, clip: "polygon(0 0,100% 0,72% 100%,28% 100%)" },
  "rocket-mold": { l: 33, t: 9, w: 34, h: 60, clip: "polygon(50% 0,80% 26%,86% 100%,14% 100%,20% 26%)" },
  "blender": { l: 33, t: 14, w: 38, h: 34, clip: "polygon(0 0,100% 0,86% 100%,14% 100%)" },
  "bowl": { l: 6, t: 13, w: 88, h: 38, clip: "ellipse(50% 50% at 50% 50%)", solid: 1 } };
const DRINK = { "clover-milk": "#BDF2C9", "honey-milk": "#F7C45A", "pumpkin-milk": "#F2A35A", "peppermint-cocoa": "#7A4A2E",
  "frosty-pop": "#86DBFF", "rainbow-pop": "linear-gradient(#FF5A5A,#FFB347,#FFE45C,#6FE07A,#5BB8FF,#B07BFF)", "lemon-pop": "#FFE45C", "watermelon-pop": "linear-gradient(#FF6F8A 75%,#6FD36F 75%)",
  "heart-smoothie": "linear-gradient(#FF8FB0,#E8335F)", "strawberry-smoothie": "#FF9EB8", "coconut-smoothie": "linear-gradient(#F4FFFB,#7FE3D2)", "slime-smoothie": "#8CF04A" };
// glazed donuts before the toppings go on (made from her art: the plain donut + each glaze); the pink and vanilla glaze bowls are the galaxy bowl tinted
const GLAZED = { "snowball-donut": "donut-glazed-snowball", "blossom-donut": "donut-glazed-blossom", "pumpkinpie-donut": "donut-glazed-pumpkinpie", "lovebug-donut": "donut-glazed-lovebug", "crayon-donut": "donut-glazed-crayon" };
const GLAZE_BOWL = { "lovebug-donut": "glaze-bowl-pink", "crayon-donut": "glaze-bowl-vanilla" };
// single berries cut from her berry pictures, so the ones that drop in match the pile (Nov 7)
const BSET = (k, n) => Array.from({ length: n }, (_, i) => im("berry-" + k + "-" + i));
const BERRY = { "heart-smoothie": BSET("heart", 3), "strawberry-smoothie": BSET("straw", 2), "coconut-smoothie": BSET("coconut", 1), "slime-smoothie": BSET("slime", 3) };
const NEBULA = "linear-gradient(#FF9BD5,#B07BFF,#5FD6E8)";
function steps(s) {
  const ing = s.ing, sp = !s.reg, col = DRINK[s.k];
  const blendFull = im(s.blend ? "blender-full-" + s.blend : "blender-full"), smoothie = col || NEBULA;
  switch (s.kind) {
    case "milk": return [
      { t: "hold", fx: "pour", say: "Hold to pour the milk into the mug. Let go at the line!", it: im("milk-bottle"), on: "mug-empty", col: col || "linear-gradient(#B9D2FF 0 6%,#9DBDFF 6%,#5F86E8)" },
      { t: "stop", fx: "sprinkle", say: "Add the " + (sp ? s.ingName : "moon sugar") + " when the star is in the green!", it: sp ? ing : im("moon-sugar"), on: "mug-empty", bits: sp ? ["#fff", "#FFD1E8", "#BDF2C9"] : ["#fff", "#E6E9FF", "#FFF4B0"] },
      { t: "mash", fx: "stir", say: "Stir, stir, stir! Tap as fast as you can!", it: im("spoon"), on: "mug-empty", n: 12, out: s.img }];
    case "cookies": return [
      { t: "order", fx: "add", say: sp ? "Egg, then flour, then the " + s.ingName + "!" : "Crack the egg, then add the flour!", list: [[im("egg"), "egg", "#FFC93C"], [im("flour"), "flour", "#FFF6E4"]].concat(sp ? [[ing, s.ingName, "#E9A15A"]] : []), on: "bowl" },
      { t: "mash", fx: "stir", say: "Stir the dough! Tap fast!", it: im("spoon"), on: "bowl", n: 12, dough: im("bowl-mix") },
      { t: "stop", fx: "into", say: "Into the oven! Stop when the light is in the green.", it: im(s.tray ? "cookie-tray-" + s.tray : "cookie-tray"), on: "oven", out: s.img }];
    case "donut": return [
      { t: "stop", fx: "fry", say: "Fry the donut! Stop when it’s golden (in the green).", it: im("donut-plain"), on: "fryer" },
      { t: "hold", fx: "dip", say: "Hold to dip it in the " + (s.glaze ? s.ingName : s.k === "lovebug-donut" ? "pink glaze" : s.k === "crayon-donut" ? "vanilla glaze" : "galaxy glaze") + ". Let go at the line!", it: im("donut-plain"), on: s.glaze ? ing : im(GLAZE_BOWL[s.k] || "glaze-bowl"), glazed: im(GLAZED[s.k] || "donut-glazed") },
      { t: "mash", fx: "sprinkle", say: "Shake on the " + (s.top ? s.ingName : "star sprinkles") + "! Tap fast!", it: s.top ? ing : im("star-sprinkles"), glazed: im(GLAZED[s.k] || "donut-glazed"), base: s.img, n: 10, out: s.img, bits: s.top ? ["#FF6FA8", "#FF2E63", "#fff"] : ["#FFE066", "#7FD3FF", "#FF8FD8", "#9BF08A"] }];
    case "smoothie": return [
      { t: "mash", fx: "drop", say: "Drop the " + (sp ? s.ingName : "space berries") + " in the blender! Tap fast!", it: sp ? ing : im("space-berries"), on: "blender", n: 10, dots: BERRY[s.k] || BSET("space", 3) },
      { t: "hold", fx: "blend", say: "Hold the button to blend. Let go at the line!", it: im("blender"), full: blendFull },
      { t: "stop", fx: "pour", say: "Pour it in! Stop when the glass is full (the green).", it: blendFull, on: "glass-empty", col: smoothie, out: s.img }];
    case "fries": return [
      { t: "mash", fx: "chop", say: "Chop the " + (s.potato ? "sweet potato" : "star potato") + " into stars! Tap fast!", it: s.potato ? ing : im("star-potato"), board: im(s.potato ? "knife-board-sweetpotato" : "knife-board"), n: 12 },
      { t: "stop", fx: "fry", say: "Fry them! Stop when they’re crispy (in the green).", it: null, on: "fryer" },
      { t: "hold", fx: "shake", say: "Shake on the " + (s.salt ? s.ingName : "stardust salt") + ". Not too much! Let go at the line.", it: s.salt ? ing : im("stardust-salt"), base: s.img, bits: s.salt ? ["#FF5AA8", "#FFE066", "#5BD1FF", "#9BF08A"] : ["#fff", "#FFF4B0", "#E6E9FF"], out: s.img }];
    case "pop": return [
      sp ? { t: "hold", fx: "pour", say: "Hold to pour the " + s.ingName + " into the rocket mold. Let go at the line!", it: ing, on: "rocket-mold", col: col }
        : { t: "order", fx: "layers", say: "Pour red, then white, then blue!", list: [[im("juice-red"), "red", "#F2435A"], [im("juice-white"), "white", "#FFFFFF"], [im("juice-blue"), "blue", "#3E7BF0"]], on: "rocket-mold" },
      { t: "stop", fx: "into", say: "Into the freezer! Stop when it’s frozen (in the green).", it: "mold", on: "freezer" },
      { t: "mash", fx: "wiggle", say: "Wiggle it out of the mold! Tap fast!", it: "mold", n: 10, out: s.img }];
  }
  return [];
}
const starsOf = sc => { const a = sc.reduce((x, y) => x + y, 0) / (sc.length || 1); return a >= 0.86 ? 3 : a >= 0.55 ? 2 : 1; };
const GRADE = v => (v >= 1 ? "Perfect!" : v >= 0.6 ? "Good!" : "Oops!");

/* ---------- the kitchen (a full-screen layer, like the safari) ---------- */
let K = null, root = null;
export const kitchenBusy = () => !!K;
const rootEl = () => {
  if (!root) { root = document.createElement("div"); root.id = "cafroot"; document.body.appendChild(root);
    root.addEventListener("click", ev => { const b = ev.target.closest("[data-caf]"); if (b) kAct(b.dataset.caf, b); });
    root.addEventListener("pointerdown", ev => { const b = ev.target.closest("[data-cafhold]"); if (b) { ev.preventDefault(); holdStart(); } const m = ev.target.closest("[data-cafmash]"); if (m) { ev.preventDefault(); mashTap(); } });
    root.addEventListener("pointerup", () => holdEnd()); root.addEventListener("pointercancel", () => holdEnd()); root.addEventListener("pointerleave", () => holdEnd()); }
  return root;
};
if (typeof document !== "undefined") document.addEventListener("click", ev => {
  const b = ev.target.closest && ev.target.closest("[data-cook]"); if (b && !(root && root.contains(b))) startCook(b.dataset.cook, b.dataset.practice === "1");
});
const chef = pose => '<img class="cafchef" src="' + im(pose === "wave" ? "chef-duck" : "chef-duck-" + pose) + '" alt="Chef Duck">';
const tmr = [];
const later = (ms, f) => tmr.push(setTimeout(f, ms));
const clearT = () => { while (tmr.length) clearTimeout(tmr.pop()); if (K && K.raf) cancelAnimationFrame(K.raf); };

export function startCook(k, practice) {
  const s = SNACK_BY[k], c = planetCtx(); if (!s || !c || !c.st) return;
  if (!menuToday().includes(s) && !c.preview) return;
  const real = !practice && !cookedToday(freshSt(c.st)) && !c.preview;
  K = { s, steps: steps(s), i: -1, sc: [], real, practice: !real, preview: !!c.preview, liq: {} };
  draw('<div class="cafintro"><img class="cafsnackbig" src="' + s.img + '" alt=""><h1>' + esc(s.name) + "</h1>" +
    "<p>" + (real ? "Your cook for today! 3 ⭐ = <b>+15 Stardust</b>" + (s.reg ? "" : ", and it’s a <b>" + MONTHS[s.month] + " special</b>") + "." : K.preview ? "\u{1F440} Teacher preview: nothing is saved." : "Practice round: just for fun, nothing is saved.") + "</p>" +
    '<p class="small">⭐⭐⭐ perfect cooks: <b>' + Math.min(perfectOf(freshSt(c.st), s.k), CAFE_KEEP) + " / " + CAFE_KEEP + "</b> to keep it in your Snack Box.</p>" +
    '<button class="btn gold" data-caf="go">Let’s cook! \u{1F373}</button></div>', "point", "Hi, Chef! Today we’re making " + s.name + "!");
}
function draw(inner, pose, say) {
  const s = K.s;
  rootEl().innerHTML = '<div class="cafover" style="background-image:url(' + im("kitchen-bg") + ')">' +
    '<div class="caftop"><b>\u{1F469}‍\u{1F373} Cosmic Kitchen · ' + esc(s.name) + "</b><span>" + (K.i >= 0 ? "Step " + Math.min(K.i + 1, 3) + " of 3 " : "") + K.sc.map(v => (v >= 1 ? "⭐" : v >= 0.6 ? "✨" : "\u{1F4A8}")).join("") + '</span><button class="btn ghost small" data-caf="quit">✕</button></div>' +
    '<div class="cafchefbox">' + chef(pose || "point") + (say ? '<div class="cafsay">' + esc(say) + "</div>" : "") + "</div>" +
    '<div class="cafwork">' + inner + "</div></div>";
}
function kAct(a) {
  if (a === "quit") { clearT(); K = null; if (root) root.innerHTML = ""; const c = planetCtx(); if (c && c.rerender) c.rerender(); return; }
  if (a === "go" || a === "next") return nextStep();
  if (a === "stop") return stopTap();
  if (a.startsWith("ord:")) return orderTap(Number(a.slice(4)));
  if (a === "again") { const k = K.s.k; clearT(); K = null; startCook(k, true); }
}
/* ---------- each step's little scene (Nov 7: you SEE the milk pour, the spoon stir, the potato get chopped…) ----------
   The stage is a square; everything is placed in % of it. Drinks / dough stay in their cup from step to step (K.liq). */
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const VES = { x: 27, y: 4, w: 46 };   // the main cup / bowl: bottom centre
function cup(name, id, pos, extra) {
  const p = pos || VES, inn = INSIDE[name], L = (K.liq[name] = K.liq[name] || { lv: 0, bg: "", layers: [] });
  let h = '<div class="cafv" id="' + id + '" style="left:' + p.x + "%;bottom:" + p.y + "%;width:" + p.w + '%">';
  if (inn) h += '<div class="cafin' + (inn.solid ? " solid" : "") + '" id="' + id + 'in" style="left:' + inn.l + "%;top:" + inn.t + "%;width:" + inn.w + "%;height:" + inn.h + "%;clip-path:" + inn.clip + '"><div class="cafliq" id="' + id + 'liq">' + liqOf(name, L) + "</div>" + (extra || "") + "</div>";
  return h + '<img src="' + (name.includes("/") ? name : im(name)) + '" alt=""></div>';
}
// the bowl: what's inside is a round blob that grows in the middle of the bowl (not a flat cut-off line)
const bowlHTML = L => L.lv ? '<div class="cafbowlfill" style="transform:translate(-50%,-50%) scale(' + Math.min(1, 0.7 + L.lv / 230) + ");background:" + L.bg + '"></div>' : "";
const liqOf = (name, L) => name === "bowl" ? bowlHTML(L) : liqHTML(L);
const liqHTML = L => L.layers.length ? L.layers.map(x => '<div style="height:' + x.h + "%;background:" + x.c + '"></div>').reverse().join("") : '<div style="height:' + L.lv + "%;background:" + (L.bg || "transparent") + '"></div>';
function setLiq(name, id) { const e = $(id + "liq"); if (e) e.innerHTML = liqOf(name, K.liq[name]); }
// where a cup's inside is, in stage %
function insideBox(name, p) { p = p || VES; const n = INSIDE[name]; return { cx: p.x + p.w * (n.l + n.w / 2) / 100, top: 100 - p.y - p.w + p.w * n.t / 100, bot: 100 - p.y - p.w + p.w * (n.t + n.h) / 100, w: p.w * n.w / 100 }; }
const img = (src, cls, style, id) => '<img class="' + cls + '"' + (id ? ' id="' + id + '"' : "") + ' src="' + src + '" style="' + style + '" alt="">';
// little bits (sugar, sprinkles, salt) that fall from (x, y) to (x2, y2) and stay there
function bits(n, x, y, colors, land) { const st = $("cafst"); if (!st) return;
  for (let i = 0; i < n; i++) { const b = document.createElement("i"), [lx, ly] = land(i); b.className = "cafbit"; b.style.cssText = "left:" + (x + (Math.random() - 0.5) * 4) + "%;top:" + y + "%;background:" + colors[i % colors.length];
    st.appendChild(b); setTimeout(() => { b.style.left = lx + "%"; b.style.top = ly + "%"; }, 20 + i * 25); } }
function bubbles(on) { const st = $("cafst"); if (!st || !K.cur || K.cur.done) return;
  const b = document.createElement("i"); b.className = "cafbub"; b.style.left = (40 + Math.random() * 22) + "%"; b.style.top = "60%"; st.appendChild(b); setTimeout(() => b.remove(), 900);
  later(140, () => bubbles(on)); }

function sceneOf(st) {
  const f = st.fx;
  if (f === "pour") { const box = insideBox(st.on);
    return '<div class="cafstream" id="cafstream" style="left:' + (box.cx - 1.6) + "%;top:24%;height:" + (box.bot - 24) + "%;background:" + st.col + '"></div>' +
      cup(st.on, "cafv", null, '<div class="cafline80"></div>') + img(st.it, "caftool pourer", "left:" + (box.cx - 31) + "%;top:0;width:30%", "caftool"); }
  if (f === "sprinkle" && st.on) return cup(st.on, "cafv") + img(st.it, "caftool shaker", "left:40%;top:0;width:24%", "caftool");
  if (f === "sprinkle") return img(st.glazed, "cafbase", "left:22%;bottom:6%;width:56%") + img(st.base, "cafbase", "left:22%;bottom:6%;width:56%;opacity:0", "cafglz") + img(st.it, "caftool shaker", "left:60%;top:0;width:24%", "caftool");
  if (f === "stir") { const dough = st.dough ? img(st.dough, "cafbase", "left:" + VES.x + "%;bottom:" + VES.y + "%;width:" + VES.w + "%;opacity:0;z-index:2", "cafdough") : "";
    return cup(st.on, "cafv", null, '<div class="cafswirl" id="cafswirl"></div>') + dough + img(st.it, "caftool spoon", "left:42%;top:20%;width:34%", "caftool"); }
  if (f === "drop") return cup(st.on, "cafv", { x: 24, y: 2, w: 52 }) + img(st.it, "caftool", "left:66%;top:4%;width:30%", "caftool");
  if (f === "blend") return cup("blender", "cafv", { x: 24, y: 2, w: 52 }, '<div id="cafberries">' + (K.berries || "") + "</div>").replace('class="cafv"', 'class="cafv shakebox"').replace(/<\/div>$/, '<img id="cafglz" src="' + st.full + '" style="position:absolute;inset:0;width:100%;opacity:0;z-index:3" alt=""></div>');   // the berries from step 1 are still in the jar
  if (f === "shake") return img(st.base, "cafbase", "left:22%;bottom:4%;width:56%") + img(st.it, "caftool shaker", "left:44%;top:0;width:20%", "caftool");
  if (f === "dip") return img(st.it, "caftool", "left:30%;top:4%;width:40%;z-index:1", "caftool") + img(st.glazed, "caftool", "left:30%;top:4%;width:40%;opacity:0;z-index:1", "cafglz") + img(st.on, "cafbase", "left:18%;bottom:0;width:64%;z-index:2");
  if (f === "fry") return img(im("fryer"), "cafbase", "left:18%;bottom:2%;width:64%") + (st.it ? img(st.it, "caftool", "left:37%;top:34%;width:26%;transform:rotate(-8deg)", "caftool") : "");
  if (f === "into") { const tool = st.it === "mold" ? cup("rocket-mold", "caftool", { x: 2, y: 10, w: 40 }) : img(st.it, "caftool", "left:0;top:40%;width:44%", "caftool");
    return img(im(st.on), "cafbase", "left:44%;bottom:2%;width:56%", "cafoven") + tool; }
  if (f === "wiggle") return img(K.s.img, "caftool", "left:27%;bottom:6%;width:46%;opacity:0;z-index:3", "cafpop") + cup("rocket-mold", "cafv");
  if (f === "chop") return img(st.board, "cafbase", "left:6%;bottom:2%;width:88%") + img(st.it, "caftool", "left:30%;top:22%;width:40%", "caftool") + '<div class="cafslash" id="cafslash"></div>';
  if (f === "layers" || f === "add") return cup(st.on, "cafv");
  return "";
}

function nextStep() {
  clearT(); K.i++;
  if (K.i >= K.steps.length) return finish();
  const st = K.steps[K.i]; K.cur = { st, done: false };
  let ctl = "";
  if (st.t === "hold") { K.cur.v = 0;
    ctl = '<div class="cafmeter"><div class="cafzone" style="bottom:72%;height:16%"></div><div class="cafline" style="bottom:80%"></div><div class="caffill" id="caffill"></div></div><button class="btn gold cafbig" data-cafhold="1">✋ Hold</button>'; }
  else if (st.t === "stop") { K.cur.x = 0; K.cur.dir = 1; K.cur.sp = 0.9 + Math.random() * 0.25;
    ctl = '<div class="cafbar"><div class="cafgood"></div><div class="cafperf"></div><div class="cafmark" id="cafmark">⭐</div></div><button class="btn gold cafbig" data-caf="stop">✋ Stop!</button>'; }
  else if (st.t === "mash") { K.cur.n = 0; K.cur.t0 = 0;
    ctl = '<div class="cafprog"><div id="cafprog"></div></div><button class="btn gold cafbig" data-cafmash="1">\u{1F446} Tap! Tap! Tap!</button><p class="cafhint">Tap ' + st.n + " times! The clock starts on your first tap.</p>"; }
  else if (st.t === "order") { K.cur.next = 0; K.cur.miss = 0;
    const idx = st.list.map((x, i) => i).sort(() => Math.random() - 0.5);
    ctl = '<div class="caforder">' + idx.map(i => '<button class="caford" data-caf="ord:' + i + '" id="cafo' + i + '"><img src="' + st.list[i][0] + '" alt=""><small>' + esc(st.list[i][1]) + "</small></button>").join("") + "</div>"; }
  draw('<div class="cafst" id="cafst">' + sceneOf(st) + '</div><div class="cafctl" id="cafctl">' + ctl + "</div>", "point", st.say);
  if (st.t === "stop") {
    if (st.fx === "fry") bubbles();
    let last = performance.now();
    const step = t => { if (!K || !K.cur || K.cur.done) return; const dt = (t - last) / 1000; last = t;
      K.cur.x += K.cur.dir * K.cur.sp * dt; if (K.cur.x > 1) { K.cur.x = 1; K.cur.dir = -1; } if (K.cur.x < 0) { K.cur.x = 0; K.cur.dir = 1; }
      const m = $("cafmark"); if (m) m.style.left = (K.cur.x * 100) + "%";
      if (st.fx === "fry" && st.it) { const d = $("caftool"); if (d) d.style.filter = "brightness(" + (1.25 - K.cur.x * 0.55) + ") saturate(" + (0.7 + K.cur.x * 0.6) + ")"; }   // golden → too dark
      K.raf = requestAnimationFrame(step); };
    K.raf = requestAnimationFrame(step);
  }
}
// hold: the meter rises while held (about 2.2 s to the top), let go in the band
function holdStart() { const c = K && K.cur; if (!c || c.done || c.st.t !== "hold" || c.holding) return; c.holding = true; c.v = 0; let last = performance.now(), sh = 0;
  const st = c.st, tool = $("caftool");
  if (tool) tool.classList.add("go");
  if (st.fx === "pour") { const s = $("cafstream"); if (s) s.classList.add("on"); K.liq[st.on].bg = st.col; }
  if (st.fx === "blend") { const b = $("cafv"); if (b) b.classList.add("shaking"); }
  const step = t => { if (!c.holding || c.done) return; c.v += (t - last) / 2200; last = t; const f = $("caffill"); if (f) f.style.height = Math.min(100, c.v * 100) + "%";
    if (st.fx === "pour") { K.liq[st.on].lv = clamp(c.v * 100, 0, 100); setLiq(st.on, "cafv"); }
    if (st.fx === "dip") { const y = 4 + clamp(c.v, 0, 1) * 40; [$("caftool"), $("cafglz")].forEach(e => { if (e) e.style.top = y + "%"; }); const g = $("cafglz"); if (g) g.style.opacity = clamp(c.v * 1.25, 0, 1); }
    if (st.fx === "blend") { const g = $("cafglz"); if (g) g.style.opacity = clamp(c.v * 1.25, 0, 1); const bz = $("cafberries"); if (bz) bz.style.opacity = clamp(1 - c.v * 1.3, 0, 1); }
    if (st.fx === "shake" && t - sh > 90) { sh = t; bits(3, 52, 22, st.bits, () => [30 + Math.random() * 40, 50 + Math.random() * 16]); }
    if (c.v >= 1.05) return holdEnd(); K.raf = requestAnimationFrame(step); };
  K.raf = requestAnimationFrame(step); }
function holdEnd() { const c = K && K.cur; if (!c || !c.holding || c.done) return; c.holding = false; const v = c.v, st = c.st;
  const tool = $("caftool"); if (tool) tool.classList.remove("go");
  const s = $("cafstream"); if (s) s.classList.remove("on");
  const b = $("cafv"); if (b) b.classList.remove("shaking");
  if (st.fx === "dip") [$("caftool"), $("cafglz")].forEach(e => { if (e) { e.style.transition = "top .5s"; e.style.top = "4%"; } });
  grade(v >= 0.75 && v <= 0.85 ? 1 : v >= 0.68 && v <= 0.92 ? 0.6 : 0.3, st.fx === "dip" ? 500 : 250); }
function stopTap() { const c = K && K.cur; if (!c || c.done || c.st.t !== "stop") return; const d = Math.abs(c.x - 0.5), st = c.st;
  const v = d <= 0.06 ? 1 : d <= 0.16 ? 0.6 : 0.3; c.done = true; if (K.raf) cancelAnimationFrame(K.raf);
  const tool = $("caftool");
  if (st.fx === "sprinkle") { if (tool) tool.classList.add("go"); const box = insideBox(st.on); bits(26, box.cx + 4, 22, st.bits, () => [box.cx - box.w / 3 + Math.random() * box.w / 1.5, box.top + 2 + Math.random() * 6]); }
  if (st.fx === "pour") { if (tool) tool.classList.add("go"); const s = $("cafstream"); if (s) s.classList.add("on"); const L = K.liq[st.on], to = v >= 1 ? 80 : c.x < 0.5 ? (v >= 0.6 ? 62 : 40) : (v >= 0.6 ? 95 : 100);
    L.bg = st.col; const t0 = performance.now(); const fill = t => { const u = clamp((t - t0) / 900, 0, 1); L.lv = to * u; setLiq(st.on, "cafv"); if (u < 1) requestAnimationFrame(fill); else if (s) s.classList.remove("on"); }; requestAnimationFrame(fill); }
  if (st.fx === "into") { if (tool) tool.classList.add("inside"); const o = $("cafoven"); if (o) later(500, () => o.classList.add(st.on === "oven" ? "baking" : "freezing")); }
  if (st.fx === "fry" && tool) { tool.style.transition = "top .6s"; tool.style.top = "4%"; }
  K.cur.done = false; grade(v, st.fx === "fry" ? 650 : 1000);
}
function mashTap() { const c = K && K.cur; if (!c || c.done || c.st.t !== "mash") return; const st = c.st;
  if (!c.n) { c.t0 = performance.now(); later(5000, () => { if (K && K.cur === c && !c.done) grade(0.3); }); }
  c.n++; const u = c.n / st.n, p = $("cafprog"); if (p) p.style.width = Math.min(100, u * 100) + "%";
  const tool = $("caftool");
  try { tick(600 + c.n * 30); } catch (e) {}
  if (st.fx === "stir") { const a = c.n * 0.9, box = insideBox(st.on), r = box.w * 0.28;
    if (tool) { tool.style.left = (box.cx - 17 + Math.cos(a) * r) + "%"; tool.style.top = (box.top - 22 + Math.sin(a) * r * 0.35) + "%"; tool.style.transform = "rotate(" + (-40 + Math.cos(a) * 12) + "deg)"; }
    const sw = $("cafswirl"); if (sw) { sw.style.opacity = 0.9; sw.style.transform = "rotate(" + c.n * 50 + "deg)"; }
    const d = $("cafdough"); if (d) d.style.opacity = clamp(u, 0, 1); }
  if (st.fx === "sprinkle") { if (tool) { tool.classList.remove("shakeit"); void tool.offsetWidth; tool.classList.add("shakeit"); }
    bits(6, 66, 18, st.bits, () => { const a = Math.random() * 6.28, r = 12 + Math.random() * 9; return [50 + Math.cos(a) * r, 66 + Math.sin(a) * r]; });
    const g = $("cafglz"); if (g) g.style.opacity = clamp(u, 0, 1); }
  if (st.fx === "drop") {   // a berry falls into the jar and lands at the bottom (they pile up inside the blender, clipped to the jar)
    const pos = { x: 24, y: 2, w: 52 }, box = insideBox(st.on, pos), col = st.dots[c.n % st.dots.length], f = document.createElement("img");
    f.className = "cafdot"; f.src = col; f.style.cssText = "left:70%;top:14%;width:" + (box.w / 3.6) + "%"; $("cafst").appendChild(f);
    setTimeout(() => { f.style.left = (box.cx - box.w / 8 + (Math.random() - 0.5) * box.w / 3) + "%"; f.style.top = (box.top - 2) + "%"; }, 20);
    const k = c.n - 1; later(420, () => { f.remove(); const jar = $("cafvin"); if (!jar) return; const d = document.createElement("img"), row = Math.floor(k / 4), colN = k % 4;
      d.className = "cafdot in"; d.src = col; d.style.cssText = "left:" + (2 + colN * 23 + (row % 2) * 10) + "%;bottom:" + (row * 20) + "%;width:30%;transform:rotate(" + ((k * 47) % 60 - 30) + "deg)"; jar.appendChild(d); K.berries = [...jar.querySelectorAll(".cafdot")].map(x => x.outerHTML).join(""); }); }
  if (st.fx === "chop") { if (tool) tool.style.transform = "scale(" + (1 - 0.8 * u) + ") rotate(" + (c.n % 2 ? 6 : -6) + "deg)";
    const sl = $("cafslash"); if (sl) { sl.classList.remove("on"); void sl.offsetWidth; sl.classList.add("on"); }
    const pc = document.createElement("img"); pc.src = st.it; pc.className = "cafpiece"; pc.style.left = "46%"; pc.style.top = "38%"; $("cafst").appendChild(pc);
    setTimeout(() => { pc.style.left = (14 + Math.random() * 66) + "%"; pc.style.top = (52 + Math.random() * 22) + "%"; pc.style.transform = "rotate(" + Math.random() * 90 + "deg)"; }, 20); }
  if (st.fx === "wiggle") { const m = $("cafv"); if (m) { m.style.transform = "rotate(" + (c.n % 2 ? 8 : -8) + "deg)"; } const pop = $("cafpop"), liq = $("cafvliq");
    if (pop) { pop.style.opacity = clamp(u * 1.3, 0, 1); pop.style.transform = "translateY(" + (-u * 46) + "%)"; } if (liq) liq.style.opacity = 1 - u; }
  if (c.n >= st.n) { const s = (performance.now() - c.t0) / 1000; const m = $("cafv"); if (st.fx === "wiggle" && m) m.style.transform = ""; grade(s <= 3 ? 1 : s <= 4.2 ? 0.6 : 0.3, 300); } }
function orderTap(i) { const c = K && K.cur; if (!c || c.done || c.st.t !== "order") return; const st = c.st;
  const b = $("cafo" + i);
  if (i === c.next) { c.next++; if (b) { b.classList.add("used"); b.disabled = true; } try { tick(700 + c.next * 120); } catch (e) {}
    // the thing flies into the bowl / mold, and what's inside grows
    const fly = document.createElement("img"), box = insideBox(st.on); fly.src = st.list[i][0]; fly.className = "cafflyin"; fly.style.left = (box.cx - 11) + "%"; fly.style.top = "0%"; $("cafst").appendChild(fly);
    setTimeout(() => { fly.style.top = (box.top - 6) + "%"; fly.style.transform = "rotate(" + (st.fx === "layers" ? 120 : 70) + "deg) scale(.7)"; }, 30);   // flies all the way down to the cup / bowl
    later(480, () => { fly.style.opacity = "0"; fly.style.transform += " scale(.5)"; });
    const L = K.liq[st.on], col = st.list[i][2];
    later(450, () => { if (st.fx === "layers") L.layers.push({ c: col, h: 27 }); else { L.lv = Math.min(80, L.lv + 70 / st.list.length); L.cols = (L.cols || []).concat(col);   // egg yolk, then flour on top, then the special ingredient
      L.bg = L.cols.length === 1 ? "radial-gradient(circle at 48% 46%,#FFB300 0 17%,#FFD45C 21%,#FFFDF4 27%)"   // a cracked egg: yolk + white
        : L.cols.length === 2 ? "radial-gradient(circle at 48% 46%,#FFE29A 0 18%,#FFF3DA 45%,#FFF8EC 70%)"   // flour on top
        : "radial-gradient(circle at 48% 46%," + L.cols[2] + " 0 22%,#FFF0D2 50%)"; } setLiq(st.on, "cafv"); });
    later(900, () => fly.remove());
    if (c.next >= st.list.length) grade(c.miss === 0 ? 1 : c.miss === 1 ? 0.6 : 0.3, 800); }
  else { c.miss++; if (b) { b.classList.remove("nope"); void b.offsetWidth; b.classList.add("nope"); } } }
function talk(pose, say) { const ch = document.querySelector("#cafroot .cafchef"); if (ch) ch.src = im(pose === "wave" ? "chef-duck" : "chef-duck-" + pose); const s = document.querySelector("#cafroot .cafsay"); if (s) s.textContent = say; }
// the scene stays as it is (you see what you made); the controls turn into the grade + Next
function grade(v, delay) {
  const c = K.cur; if (c.graded) return; c.graded = true; c.done = true; c.holding = false; if (K.raf) cancelAnimationFrame(K.raf); K.sc.push(v);
  const last = K.i >= K.steps.length - 1, ctl = $("cafctl"); if (ctl) ctl.innerHTML = "";
  try { if (v >= 1) chime(); else if (v < 0.6) tick(220); } catch (e) {}
  const show = () => { if (!K || K.cur !== c) return;
    if (c.st.out && last) { const st = $("cafst"); if (st) { [...st.children].forEach(e => { e.style.transition = "opacity .35s"; e.style.opacity = "0"; }); st.insertAdjacentHTML("beforeend", '<img class="cafoutpop" src="' + c.st.out + '" alt="">'); } }
    const box = $("cafctl"); if (box) box.innerHTML = '<div class="cafgrade g' + (v >= 1 ? 3 : v >= 0.6 ? 2 : 1) + '">' + GRADE(v) + "</div>" + '<button class="btn gold" data-caf="next">' + (last ? "Serve it! \u{1F37D}️" : "Next step →") + "</button>";
    talk(v >= 1 ? "cheer" : v >= 0.6 ? "point" : "oops", v >= 1 ? "Perfect, Chef!" : v >= 0.6 ? "Nice job!" : "Oops! That’s okay, keep going!"); };
  if (delay) later(delay, show); else show();
}
function finish() {
  const s = K.s, stars = starsOf(K.sc), c = planetCtx();
  let gain = 0, kept = false, cnt = 0;
  if (K.real && c && c.st) {
    const pl = planetNow(), cf = Object.assign({ ck: {} }, pl.cf || {}); cf.ck = Object.assign({}, cf.ck || {});
    if (cf.d !== azToday()) {
      gain = STAR_DUST[stars]; cf.d = azToday(); cf.k = s.k; cf.s = stars; cf.n = (Number(cf.n) || 0) + 1;
      if (stars === 3) { const was = Number(cf.ck[s.k]) || 0; cf.ck[s.k] = Math.min(CAFE_KEEP, was + 1); cf.pf = (Number(cf.pf) || 0) + 1; kept = was + 1 === CAFE_KEEP; }
      cnt = Number(cf.ck[s.k]) || 0;
      pl.cf = cf; pl.dust = (Number(pl.dust) || 0) + gain; planetSave(pl);
    }
  } else if (c && c.st) cnt = perfectOf(freshSt(c.st), s.k);
  try { chime(); } catch (e) {}
  draw('<div class="cafdone"><div class="cafglowwrap"><img class="cafglow" src="' + im("snack-glow") + '" alt=""><img class="cafsnackbig" src="' + s.img + '" alt=""></div>' +
    '<h1>' + "⭐".repeat(stars) + '<span class="cafdim">' + "⭐".repeat(3 - stars) + "</span></h1><h2>" + esc(s.name) + "</h2>" +
    (K.real ? "<p>+<b>" + gain + "</b> Stardust ⭐ · your companion has the <b>snack glow</b> today ✨ · you have a seat in the ☕ Space Café!</p>" +
      (stars === 3 ? (kept ? '<p class="cafkept">\u{1F389} <b>You kept ' + esc(s.name) + "!</b> It’s in your Snack Box for good, and your companion can wear it at a 3-day streak.</p>" : "<p>⭐⭐⭐ perfect cooks: <b>" + cnt + " / " + CAFE_KEEP + "</b>. " + (CAFE_KEEP - cnt) + " more to keep it!</p>")
        : "<p>Only ⭐⭐⭐ cooks count toward keeping a snack (" + Math.min(cnt, CAFE_KEEP) + " / " + CAFE_KEEP + "). Try again tomorrow!</p>")
      : "<p>" + (K.preview ? "\u{1F440} Preview: nothing was saved." : "Practice round: nothing was saved. Your real cook today already counted.") + "</p>") +
    '<div class="row" style="justify-content:center;gap:8px;"><button class="btn ghost" data-caf="again">\u{1F501} Practice again</button><button class="btn gold" data-caf="quit">Done</button></div></div>',
    stars === 3 ? "cheer" : stars === 2 ? "wave" : "oops", stars === 3 ? "Three stars! You’re a real space chef!" : stars === 2 ? "Yum! Great cooking!" : "Every chef has oops days. Tomorrow you’ll nail it!");
  K.i = 99;
}
/* little sounds (off when ck-mute is set) */
let AC = null;
const ac = () => { try { if (localStorage.getItem("ck-mute") === "1") return null; } catch (e) {} try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); return AC; } catch (e) { return null; } };
function tick(f) { const a = ac(); if (!a) return; const t = a.currentTime, o = a.createOscillator(), g = a.createGain(); o.type = "triangle"; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.07, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12); o.connect(g).connect(a.destination); o.start(t); o.stop(t + 0.15); }
function chime() { [988, 1319, 1568].forEach((f, i) => setTimeout(() => tick(f), i * 90)); }

/* ---------- the café page (in the Planet JP tab) ---------- */
const TABLES = 6, SEATS = 6;
// the 6 tables stand on the café floor (the bottom half of cafe-room): 3 further back (a bit smaller), 3 up front. [x center, y center, width] in % of the room
const TABLE_AT = [[20, 61, 21], [50, 60, 21], [80, 61, 21], [17, 82, 25], [50, 83, 25], [83, 82, 25]];
const SNACK_AT = [[38, 37], [62, 37], [31, 43], [69, 43], [44, 48], [56, 48]];   // spots on the glass table top (% of the table picture), one in front of each seat
const seatPos = [[26, 30, "back"], [74, 30, "back"], [12, 49, "side"], [88, 49, "side"], [29, 59, "front"], [71, 59, "front"]];   // stool tops (% of the table picture): 2 behind, 2 at the sides, 2 in front
export function cafeHTML(st, cls, students, petOf, open) {
  st = freshSt(st);
  const today = azToday(), me = cafeOf(st), done = me.d === today, menu = menuToday(), m = monthNow();
  const kids = (students || []).filter(s => s.companionId && !s.isTeacher && cafeOf(s).d === today && s.planet && s.planet.last === today);
  if (st && done && !kids.some(s => s.id === st.id)) kids.push(st);
  kids.sort((a, b) => String(a.name).localeCompare(String(b.name)));
  // the kitchen
  let h = '<div class="card cafkitchen"><div class="card-head"><h2>\u{1F469}‍\u{1F373} Cosmic Kitchen</h2><span class="fact">' + (done ? "✅ cooked today" : "1 cook a day") + "</span></div>" +
    '<div class="cafkhead"><img src="' + im("chef-duck") + '" alt="Chef Duck"><p class="lede" style="font-size:14px;">' +
    (done ? "You made <b>" + esc((SNACK_BY[me.k] || {}).name || "a snack") + "</b> today: " + "⭐".repeat(me.s || 1) + ". Come back tomorrow for your next cook! You can still practice any snack for fun."
      : "Pick a snack and cook it with <b>Chef Duck</b> in 3 quick steps. Your first cook each day earns <b>5 / 10 / 15 ⭐</b> Stardust (1 / 2 / 3 stars), the <b>snack glow</b> on your companion and a seat in the café.") +
    " Cook a snack at <b>⭐⭐⭐ three times</b> to keep it forever.</p></div>" +
    '<div class="cafmenu">' + menu.map(s => { const p = Math.min(perfectOf(st, s.k), CAFE_KEEP), kept = p >= CAFE_KEEP;
      return '<div class="cafitem' + (s.reg ? "" : " special") + (kept ? " kept" : "") + '"><img src="' + s.img.replace(".webp", "-360.webp") + '" alt="">' +
        "<b>" + esc(s.name) + "</b>" + (s.reg ? "" : '<span class="cafsp">\u{1F5D3}️ ' + MONTHS[s.month] + " special</span>") +
        '<small>' + (kept ? "✅ Kept!" : "⭐⭐⭐ " + p + " / " + CAFE_KEEP) + "</small>" +
        (open ? '<button class="btn small' + (done ? " ghost" : " gold") + '" data-cook="' + s.k + '"' + (done ? ' data-practice="1"' : "") + ">" + (done ? "Practice" : "Cook!") + "</button>" : "") + "</div>"; }).join("") + "</div></div>";
  // the café tables
  h += '<div class="card cafcafe"><div class="card-head"><h2>☕ Space Café</h2><span class="fact">' + kids.length + " here today · open until 12:55</span></div>" +
    '<div class="cafscroll"><div class="cafroom" style="background-image:url(' + im("cafe-room") + ')">';
  for (let t = 0; t < TABLES; t++) {
    const at = kids.slice(t * SEATS, t * SEATS + SEATS);
    const tp = TABLE_AT[t];
    h += '<div class="caftable ' + (t < 3 ? "far" : "near") + '" style="left:' + tp[0] + "%;top:" + tp[1] + "%;width:" + tp[2] + '%">' + at.map((s, i) => { const sn = SNACK_BY[cafeOf(s).k];
      return '<div class="cafseat ' + seatPos[i][2] + (st && s.id === st.id ? " me" : "") + '" style="left:' + seatPos[i][0] + "%;top:" + seatPos[i][1] + '%"><span class="cafpet">' + (petOf ? petOf(s) : "") + "</span><b>" + esc(s.name) + "</b>" +
        "</div>"; }).join("") +
      '<img class="caftableimg" src="' + im("cafe-table") + '" alt="">' +
      // each companion's snack sits on the glass table top, in front of its seat
      at.map((s, i) => { const tx = tableImgOf(s); return tx ? '<img class="caftx" style="left:' + (SNACK_AT[i][0] + (SNACK_AT[i][0] < 50 ? -7 : 7)) + "%;top:" + (SNACK_AT[i][1] - 1) + '%" src="' + tx + '" alt="">' : ""; }).join("") +   // 🛒 Space Shop table extras
      at.map((s, i) => { const sn = SNACK_BY[cafeOf(s).k]; return sn ? '<img class="cafsn" style="left:' + SNACK_AT[i][0] + "%;top:" + SNACK_AT[i][1] + '%" src="' + sn.img.replace(".webp", "-360.webp") + '" alt="' + esc(sn.name) + '" title="' + esc(s.name) + ": " + esc(sn.name) + '">' : ""; }).join("") + "</div>";
  }
  h += "</div></div>" + (kids.length > TABLES * SEATS ? '<p class="small">☕ ' + (kids.length - TABLES * SEATS) + " more chefs are at the counter.</p>" : "") +
    (kids.length ? "" : '<p class="lede">The tables are empty. Cook a snack to be the first one here!</p>') + "</div>";
  h += snackBoxHTML(st, m);
  return h;
}
// 🍱 Snack Box: every snack, kept or not
export function snackBoxHTML(st, m) {
  const one = s => { const p = Math.min(perfectOf(st, s.k), CAFE_KEEP), kept = p >= CAFE_KEEP, now = s.reg || s.month === m;
    return '<div class="cafbox' + (kept ? " kept" : p ? " started" : "") + (now ? "" : " later") + '" title="' + esc(s.name) + '"><img src="' + s.img.replace(".webp", "-360.webp") + '" alt="">' +
      "<b>" + esc(s.name) + "</b><small>" + (kept ? "✅ Kept" : "⭐⭐⭐ " + p + " / " + CAFE_KEEP) + (s.reg ? "" : " · " + MONTHS[s.month].slice(0, 3)) + "</small></div>"; };
  return '<div class="card cafsnackbox"><div class="card-head"><h2>\u{1F371} Snack Box</h2><span class="fact">' + keptCount(st) + " of " + SNACKS.length + " kept</span></div>" +
    '<p class="lede" style="font-size:13.5px;">Cook a snack at ⭐⭐⭐ <b>3 times</b> to keep it. Kept snacks can go in your companion’s snack spot at a <b>3-day streak</b> (pick it in Gear). Specials only cook in their month, so plan ahead: there are only so many school days!</p>' +
    "<h3>Every day</h3><div class=\"cafboxes\">" + REGULARS.map(one).join("") + "</div>" +
    "<h3>Specials of the month</h3><div class=\"cafboxes\">" + SPECIALS.slice().sort((a, b) => ((a.month - m + 12) % 12) - ((b.month - m + 12) % 12)).map(one).join("") + "</div></div>";
}
