/* ---------- 🔥 Campfire Kitchen ----------
   Breakfast: earn 25 XP on the morning paste (before the 8:15 cutoff) and cook breakfast for your companion.
   Lunch: hit the goal by the lunch paste (Lunch Hero) and cook lunch. Either one can be cooked any time that day.
   Cooking is a short mini-game (a different one each meal: Catch, Recipe or Flip). Every meal gives one random boost;
   a great score lets the student pick between two.
   Boosts: battle ones last the rest of today (collect.js fighterFrom), egg ones wait for the next egg (eggBoost),
   Growth Snack gives +1 level now, Cozy Points add to the room wallet (cpBonus).
   Saved on the student: meals = { date: { b: { boost, score, game, at }, l: {...} } }, eggBoost = { sparkle, lucky }, cpBonus. */
import { esc, goalXP, companionOf } from "./game.js?v=20261029b";
import { azToday, owned, formOf, family, MAX_LEVEL } from "./collect.js?v=20261029b";

export const BREAKFAST_XP = 25;
export const BOOSTS = {
  power: { icon: "⚔️", name: "Power Up", desc: "+20% attack damage in battles today" },
  shield: { icon: "\u{1F6E1}️", name: "Shield", desc: "+25% Defense in battles today" },
  hearty: { icon: "❤️", name: "Hearty Meal", desc: "+20% health in battles today" },
  sparkle: { icon: "✨", name: "Sparkle Charm", desc: "Your next egg has a 5% Sparkle chance (normally almost zero!)" },
  lucky: { icon: "\u{1F340}", name: "Lucky Egg", desc: "Your next egg is at least Uncommon" },
  grow: { icon: "\u{1F4C8}", name: "Growth Snack", desc: "+1 level for your companion creature" },
  comfort: { icon: "⭐", name: "Cozy Points", desc: "+20 Comfort Points for your room" }
};
const IDS = Object.keys(BOOSTS);
// The boost token picture (assets/kitchen/boost-<id>.webp), with the emoji as a backup
const bimg = (id, c) => '<img class="' + (c || "kbimg") + '" src="assets/kitchen/boost-' + id + '.webp" alt="' + BOOSTS[id].name + '">';
const MEALS = {
  b: { name: "Breakfast", icon: "\u{1F373}", foods: ["\u{1F95E}", "\u{1F373}", "\u{1F953}", "\u{1F353}", "\u{1F950}", "\u{1F9C7}", "\u{1F34C}", "\u{1F95B}"] },
  l: { name: "Lunch", icon: "\u{1F96A}", foods: ["\u{1F96A}", "\u{1F34E}", "\u{1F9C0}", "\u{1F955}", "\u{1F355}", "\u{1F32E}", "\u{1F957}", "\u{1F36A}"] }
};
const YUCK = ["\u{1F9E6}", "\u{1FAA8}", "\u{1F45F}"];   // a stinky sock, a rock, an old shoe
const YUCK_IMG = { "\u{1F9E6}": "assets/kitchen/yuck-sock.webp", "\u{1FAA8}": "assets/kitchen/yuck-rock.webp", "\u{1F45F}": "assets/kitchen/yuck-shoe.webp" };
const ART = "assets/kitchen/";
// Food pictures (Ms. Ariana's art); a food without a picture shows its emoji
const FOOD_IMG = { "\u{1F95E}": "pancakes", "\u{1F373}": "egg", "\u{1F953}": "bacon", "\u{1F353}": "strawberry", "\u{1F950}": "croissant", "\u{1F9C7}": "waffle", "\u{1F34C}": "banana", "\u{1F95B}": "milk",
  "\u{1F96A}": "sandwich", "\u{1F34E}": "apple", "\u{1F9C0}": "cheese", "\u{1F955}": "carrot", "\u{1F355}": "pizza", "\u{1F32E}": "taco", "\u{1F957}": "salad", "\u{1F36A}": "cookie" };
const food = (e, c) => FOOD_IMG[e] ? '<img class="' + (c || "kfimg") + '" src="' + ART + "food-" + FOOD_IMG[e] + '.webp" alt="">' : e;
const GAMES = ["catch", "recipe", "flip"];
const GAME_NAMES = { catch: "Catch the Ingredients", recipe: "Follow the Recipe", flip: "Perfect Flip" };

const today = () => azToday();
const mealsOf = (st, d) => (((st && st.meals) || {})[d || today()]) || {};
export function canCook(st, cls, k) {
  const d = today(), h = ((st && st.xpHist) || {})[d] || {};
  if (mealsOf(st, d)[k]) return false;
  if (k === "b") return Number(h.mo) >= BREAKFAST_XP;
  return !!h.lh || Math.max(Number(h.l) || 0, Number(h.mo) || 0) >= goalXP(cls);
}
export const mealsReady = (st, cls) => ["b", "l"].filter(k => canCook(st, cls, k)).length;
const gameFor = (st, k) => GAMES[(Number(String(today()).replace(/-/g, "")) + (k === "l" ? 1 : 0) + String((st && st.id) || "").length) % GAMES.length];
const pick2 = () => { const a = IDS.slice().sort(() => Math.random() - 0.5); return a.slice(0, 2); };

/* ---------- the card on My Companion ---------- */
export function kitchenCard(st, cls, petName) {
  const d = today(), m = mealsOf(st, d), goal = goalXP(cls), h = ((st.xpHist || {})[d]) || {};
  const row = k => {
    const M = MEALS[k], done = m[k], ready = canCook(st, cls, k);
    const need = k === "b" ? "Earn " + BREAKFAST_XP + " XP before 8:15" : "Hit " + goal + " XP by lunch";
    return '<div class="kmeal' + (done ? " done" : ready ? " ready" : "") + '"><span class="kmic">' + M.icon + "</span><div><b>" + M.name + "</b>" +
      (done ? '<div class="small">' + bimg(done.boost, "kbsm") + " <b>" + BOOSTS[done.boost].name + "</b>: " + esc(BOOSTS[done.boost].desc) + "</div>"
        : ready ? '<div class="small">Ready to cook! Today’s game: <b>' + GAME_NAMES[gameFor(st, k)] + "</b></div>"
        : '<div class="small muted">' + need + " to cook " + M.name.toLowerCase() + ".</div>") + "</div>" +
      (ready ? '<button class="btn gold" data-kc="' + k + '">\u{1F525} Cook ' + M.name.toLowerCase() + "!</button>" : done ? '<span class="kdone">✅</span>' : "") + "</div>";
  };
  // Only shows while a meal is ready to cook, and disappears once it's cooked (Oct 16: My Companion was too crowded)
  const open = ["b", "l"].filter(k => !m[k] && canCook(st, cls, k));
  if (!open.length) return "";
  const eb = st.eggBoost || {}, saved = (eb.sparkle > 0 ? '<span class="kchip">✨ Sparkle Charm ×' + eb.sparkle + "</span>" : "") + (eb.lucky > 0 ? '<span class="kchip">\u{1F340} Lucky Egg ×' + eb.lucky + "</span>" : "") + (eb.rare > 0 ? '<span class="kchip">\u{1F48E} Rare Egg ×' + eb.rare + "</span>" : "");
  return '<div class="card kitchen"><div class="card-head"><h2><img class="kcfire" src="assets/kitchen/kitchen-campfire.webp" alt=""> Campfire Kitchen</h2><span class="fact">cook for ' + esc(petName) + "</span></div>" +
    '<p class="lede" style="font-size:14px;">' + (open[0] === "b" ? "You earned breakfast! " : "You earned lunch! ") + "Cook it for " + esc(petName) + " to get a surprise boost.</p>" +
    open.map(row).join("") + (saved ? '<div class="small" style="margin-top:6px;">Saved for your next egg: ' + saved + "</div>" : "") + "</div>";
}

/* ---------- the mini-games ---------- */
let G = null, timer = null;
const stop = () => { clearInterval(timer); timer = null; };
function start(st, k, c) {
  const game = gameFor(st, k), M = MEALS[k];
  G = { k, game, phase: "intro", score: 0, max: 0, c };
  if (game === "catch") Object.assign(G, { pan: 50, items: [], t: 20, spawn: 0, max: 10 });
  if (game === "recipe") { const r = M.foods.slice().sort(() => Math.random() - 0.5).slice(0, 4); Object.assign(G, { recipe: r, step: 0, miss: 0, t: 25, grid: M.foods.slice().sort(() => Math.random() - 0.5), max: 4 }); }
  if (game === "flip") Object.assign(G, { flips: 0, hits: 0, pos: 0, dir: 1, speed: 2.2, zone: 40 + Math.random() * 30, max: 3, msg: "" });
}
function tick() {
  if (!G || G.phase !== "play") return stop();
  if (G.game === "catch") {
    G.t -= 0.05;
    G.spawn -= 0.05; if (G.spawn <= 0) { const bad = Math.random() < 0.28, M = MEALS[G.k]; G.items.push({ x: 8 + Math.random() * 84, y: -8, bad, e: bad ? YUCK[Math.floor(Math.random() * YUCK.length)] : M.foods[Math.floor(Math.random() * M.foods.length)], v: 1.1 + Math.random() * 0.9 }); G.spawn = 0.7; }
    G.items.forEach(it => { it.y += it.v; if (!it.gone && it.y > 82 && it.y < 92 && Math.abs(it.x - G.pan) < 11) { it.gone = true; if (it.bad) G.score = Math.max(0, G.score - 1); else G.score++; G.pop = it.bad ? "\u{1F922}" : "+1"; G.popT = 8; } });
    G.items = G.items.filter(it => !it.gone && it.y < 105); if (G.popT) G.popT--;
    if (G.t <= 0) return finishGame();
    return draw();
  }
  if (G.game === "recipe") { G.t -= 0.05; if (G.t <= 0) return finishGame(); return draw(); }
  if (G.game === "flip") { G.pos += G.dir * G.speed; if (G.pos >= 100 || G.pos <= 0) { G.dir *= -1; G.pos = Math.max(0, Math.min(100, G.pos)); } return draw(); }
}
// moves the live pieces without rebuilding the overlay
function draw() {
  const el = document.querySelector(".kgame"); if (!el) return;
  if (G.game === "catch") {
    const pan = el.querySelector(".kpan"); if (pan) pan.style.left = G.pan + "%";
    const box = el.querySelector(".kitems"); if (box) box.innerHTML = G.items.map(it => '<span style="left:' + it.x + "%;top:" + it.y + '%">' + (it.bad && YUCK_IMG[it.e] ? '<img src="' + YUCK_IMG[it.e] + '" alt="">' : food(it.e)) + "</span>").join("") + (G.popT ? '<b class="kpop" style="left:' + G.pan + '%">' + G.pop + "</b>" : "");
  }
  if (G.game === "flip") { const n = el.querySelector(".kneedle"); if (n) n.style.left = G.pos + "%"; }
  const t = el.querySelector(".ktime"); if (t && G.t != null) t.textContent = Math.max(0, Math.ceil(G.t)) + "s";
  const s = el.querySelector(".kscore"); if (s) s.textContent = G.score;
}
function great() { return G.game === "catch" ? G.score >= 8 : G.game === "recipe" ? G.step >= 4 && G.miss <= 1 : G.hits >= 3; }
function finishGame() {
  stop(); if (!G) return;
  if (G.game === "recipe") G.score = G.step;
  if (G.game === "flip") G.score = G.hits;
  G.great = great(); G.phase = "pick"; G.choices = G.great ? pick2() : [IDS[Math.floor(Math.random() * IDS.length)]];
  G.c.render(true);
}
export const kitchenBusy = () => !!G;

export function kitchenOverlay(st) {
  if (!G) return "";
  const M = MEALS[G.k], title = '<div class="qbtop"><b>\u{1F525} Campfire Kitchen · ' + M.icon + " " + M.name + " · " + GAME_NAMES[G.game] + "</b>" + (G.phase === "intro" ? '<button class="btn ghost small" data-kc="quit">Leave</button>' : "") + "</div>";
  let h = '<div class="qbover kover">' + title + '<div class="qbpanel kgame">';
  if (G.phase === "intro") {
    h += '<img class="kfireimg" src="' + ART + 'kitchen-campfire.webp" alt=""><h3>' + GAME_NAMES[G.game] + "</h3><p>" +
      (G.game === "catch" ? "Move the basket to catch the food! Dodge the stinky socks, rocks and old shoes. Catch <b>8</b> for a great meal."
        : G.game === "recipe" ? "Tap the ingredients in the same order as the recipe card. Get them all with 1 mistake or less for a great meal."
        : "Tap <b>Flip!</b> when the needle is in the golden zone. Get all <b>3</b> flips perfect for a great meal.") +
      '</p><button class="btn big" data-kc="go">Start cooking!</button>';
  } else if (G.phase === "play" && G.game === "catch") {
    h += '<div class="krow"><span>⏱️ <b class="ktime">' + Math.ceil(G.t) + 's</b></span><span>\u{1F37D}️ <b class="kscore">' + G.score + "</b> / 8</span></div>" +
      '<div class="kfield" data-kfield="1"><div class="kitems"></div><div class="kpan" style="left:' + G.pan + '%"><img src="' + ART + 'kitchen-basket.webp" alt="basket"></div><div class="kflames">\u{1F525}\u{1F525}\u{1F525}\u{1F525}\u{1F525}</div></div>' +
      '<div class="krow"><button class="btn big" data-kc="left">⬅️</button><span class="small muted">or slide your finger / mouse</span><button class="btn big" data-kc="right">➡️</button></div>';
  } else if (G.phase === "play" && G.game === "recipe") {
    h += '<div class="krow"><span>⏱️ <b class="ktime">' + Math.ceil(G.t) + 's</b></span><span>Mistakes: <b>' + G.miss + "</b></span></div>" +
      '<div class="krecipe"><small>Recipe</small>' + G.recipe.map((f, i) => '<span class="' + (i < G.step ? "got" : i === G.step ? "now" : "") + '">' + food(f) + "</span>").join("→") + "</div>" +
      '<div class="kgrid">' + G.grid.map((f, i) => '<button class="kfood" data-kc="food" data-i="' + i + '">' + food(f) + "</button>").join("") + "</div>" + (G.msg ? '<p class="small">' + G.msg + "</p>" : "");
  } else if (G.phase === "play" && G.game === "flip") {
    h += '<div class="krow"><span>Flip <b>' + Math.min(3, G.flips + 1) + "</b> of 3</span><span>Perfect: <b>" + G.hits + "</b></span></div>" +
      '<div class="kpanflip' + (G.flipAnim ? " flipping" : "") + '"><img src="' + ART + 'kitchen-pan.webp" alt="pan"></div>' +
      '<div class="kmeter"><span class="kzone" style="left:' + G.zone + '%"></span><span class="kneedle" style="left:' + G.pos + '%"></span></div>' +
      (G.msg ? '<p class="small">' + G.msg + "</p>" : "") + '<button class="btn big" data-kc="flip">\u{1F373} Flip!</button>';
  } else if (G.phase === "pick") {
    h += '<div class="kfire">' + (G.great ? "\u{1F31F}" : "\u{1F60B}") + "</div><h3>" + (G.great ? "A GREAT meal! Pick your boost:" : "Yum! Your companion loved it!") + "</h3>" +
      '<div class="kpick">' + G.choices.map(id => '<button class="kboost" data-kc="boost" data-b="' + id + '">' + bimg(id) + "<b>" + BOOSTS[id].name + "</b><small>" + esc(BOOSTS[id].desc) + "</small></button>").join("") + "</div>" +
      (G.great ? "" : '<p class="small muted">Tap your surprise boost to collect it. (Get a great score next time to choose between two!)</p>');
  } else if (G.phase === "done") {
    const B = BOOSTS[G.boost];
    h += bimg(G.boost, "kbbig") + "<h3>" + B.name + "!</h3><p>" + esc(B.desc) + (G.note ? "<br>" + G.note : "") + "</p>" +
      (G.saved ? '<button class="btn big" data-kc="ok">Yay! \u{1F389}</button>' : '<p class="muted">Saving…</p>');
  }
  return h + "</div></div>";
}

/* ---------- clicks (c = { me, cls, patch, render, flash }) ---------- */
export async function kitchenClick(el, c) {
  const a = el.dataset.kc, s = c.me;
  if (a === "b" || a === "l") { if (!canCook(s, c.cls, a) || G) return; start(s, a, c); return c.render(true); }
  if (!G) return;
  G.c = c;
  if (a === "quit") { stop(); G = null; return c.render(true); }
  if (a === "ok") { G = null; return c.render(true); }
  if (a === "go") { G.phase = "play"; c.render(true); stop(); timer = setInterval(tick, 50); return; }
  if (a === "left" || a === "right") { G.pan = Math.max(6, Math.min(94, G.pan + (a === "left" ? -12 : 12))); return draw(); }
  if (a === "food" && G.game === "recipe") {
    const f = G.grid[Number(el.dataset.i)];
    if (f === G.recipe[G.step]) { G.step++; G.msg = "✅ Yes!"; } else { G.miss++; G.msg = "❌ Oops, not that one!"; }
    if (G.step >= G.recipe.length) return finishGame();
    return c.render(true);
  }
  if (a === "flip" && G.game === "flip") {
    const hit = Math.abs(G.pos - (G.zone + 8)) <= 9; G.flips++; if (hit) G.hits++;
    G.msg = hit ? "\u{1F31F} Perfect flip!" : "\u{1F605} A little off!"; G.flipAnim = true; setTimeout(() => { if (G) { G.flipAnim = false; } }, 600); G.zone = 15 + Math.random() * 65; G.speed += 0.5;
    if (G.flips >= 3) return finishGame();
    return c.render(true);
  }
  if (a === "boost") {
    const id = el.dataset.b; if (!G.choices.includes(id) || G.phase !== "pick") return;
    const d = today(), meals = Object.assign({}, s.meals || {}); Object.keys(meals).forEach(x => { if (x < d) delete meals[x]; });
    meals[d] = Object.assign({}, meals[d] || {}, { [G.k]: { boost: id, score: G.score, game: G.game, at: new Date().toISOString() } });
    const data = { meals };
    if (id === "sparkle" || id === "lucky") { const eb = Object.assign({}, s.eggBoost || {}); eb[id] = (Number(eb[id]) || 0) + 1; data.eggBoost = eb; }
    if (id === "comfort") data.cpBonus = (Number(s.cpBonus) || 0) + 20;
    if (id === "grow") {
      const cp = companionOf(s), fams = Object.keys(owned(s)), fam = cp && cp.creature && owned(s)[cp.fam] ? cp.fam : fams.sort((x, y) => (owned(s)[y].lvl || 1) - (owned(s)[x].lvl || 1))[0];
      if (fam) { const e = owned(s)[fam], to = Math.min(MAX_LEVEL, (e.lvl || 1) + 1); data.coll = Object.assign({}, owned(s), { [fam]: Object.assign({}, e, { lvl: to }) });
        G.note = "<b>" + esc(e.nick || formOf(fam, to).name) + "</b> grew to level " + to + "!"; }
    }
    G.boost = id; G.phase = "done"; G.saved = false; c.render(true);
    try { await c.patch(data, true); Object.assign(s, data); G.saved = true; } catch (e) { G = null; c.flash("That meal didn’t save — tell Ms. Ariana! (" + (e.code || e.message) + ")"); }
    return c.render(true);
  }
}
// slide-to-move the basket in the catch game
export function kitchenPointer(ev) {
  if (!G || G.game !== "catch" || G.phase !== "play") return;
  const f = ev.target.closest && ev.target.closest("[data-kfield]"); if (!f) return;
  const r = f.getBoundingClientRect(), x = (ev.touches ? ev.touches[0].clientX : ev.clientX) - r.left;
  G.pan = Math.max(6, Math.min(94, x / r.width * 100)); draw();
}
