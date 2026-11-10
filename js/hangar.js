/* ---------- 🔧 Planet JP Duck Hangar (Nov 9) ----------
   A place on the Planet JP map, run by Chef Duck in mechanic overalls. Students buy S.S. Duck paint jobs (40), rocket flames
   and trails with ⭐ Stardust. Buying a paint job (Ms. Ariana's choice "A": buy, then paint) starts the painting minigame:
     Step 1 · Mix the paint: tap the recipe's 3 paint cans in order (6 cans; a wrong can is a miss).
     Step 2 · Roll it on: drag the roller over the grey primer duck; the paint job shows wherever it rolls (10 s).
   The paint is already bought, so nobody can fail; 1–3 stars are just for fun. Owned paints can be switched for free (Use)
   or painted again for fun (🎨). Buying goes through spaceshop.js buy() (one save). The minigame saves nothing.
   Paint cans, bucket, roller and splats are her art with WHITE paint; the game tints the white with each color (CSS mask + multiply). */
import { esc } from "./game.js?v=20261110c";
import { freshSt } from "./safari.js?v=20261110c";
import { buy } from "./spaceshop.js?v=20261110c";
import { SHOP_ITEMS, SHOP_BY, PAINT_COLORS, COLOR_NAMES, hasItem, wearing, duckImgOf, paintsOwned } from "./shop-data.js?v=20261110c";

const H = "assets/planet/hangar/";
const cname = c => COLOR_NAMES[c] || c;
const tool = (n, col, cls, extra) => '<span class="hgtool ' + (cls || "") + '"' + (extra || "") + '><img src="' + H + "paint-" + n + '.webp" alt=""><span class="hgtint" style="background:' + col +
  ";-webkit-mask-image:url(" + H + "paint-" + n + "-mask.png);mask-image:url(" + H + "paint-" + n + '-mask.png)"></span></span>';

/* ---------- the Hangar page (in the Planet JP tab) ---------- */
function card(st, it, open, dust) {
  const have = hasItem(st, it.k), on = wearing(st, it.cat) && wearing(st, it.cat).k === it.k, isDuck = it.cat === "duck";
  const art = isDuck ? '<img src="' + it.sm + '" alt="">' : '<span class="shemo">' + (it.emo || "✨") + "</span>";
  let btn;
  if (have) btn = '<button class="btn small' + (on ? " gold" : " ghost") + '" data-shuse="' + it.k + '">' + (on ? "✅ Using" : "Use") + "</button>" +
    (isDuck && open ? '<button class="btn small ghost hgagain" data-hgpaint="' + it.k + '" title="Paint it again for fun">\u{1F3A8}</button>' : "");
  else btn = open ? '<button class="btn small' + (dust >= it.cost ? " gold" : " ghost") + '" data-hgbuy="' + it.k + '"' + (dust >= it.cost ? "" : " disabled") + ">" + it.cost.toLocaleString() + " ⭐</button>"
    : '<span class="muted small">' + it.cost.toLocaleString() + " ⭐</span>";
  return '<div class="shitem' + (have ? " own" : "") + (it.goal ? " goal" : "") + (isDuck ? " hgduck" : "") + '">' + art + "<b>" + esc(it.name) + '</b><span class="hgbtns">' + btn + "</span></div>";
}
export function hangarHTML(st, cls, open) {
  st = freshSt(st); const dust = Number(((st && st.planet) || {}).dust) || 0, ducks = SHOP_ITEMS.filter(i => i.cat === "duck");
  const tiers = [["\u{1F3A8} Solid colors", 200], ["\u{1F300} Patterns", 350], ["\u{1F996} Creatures & fun", 500], ["✨ Magical", 800], ["\u{1F451} The big one", 2500]];
  let h = '<div class="card hghead" style="background-image:url(' + H + 'hangar-bg.webp)"><img class="hgmech" src="' + H + 'mechanic-duck.webp" alt="">' +
    '<div class="hgsay"><b>\u{1F527} The Duck Hangar</b><br>“Hey, Captain! Pick a new paint job and we’ll mix it and roll it on together!”</div>' +
    '<img class="hgmine" src="' + duckImgOf(st) + '" alt="Your S.S. Duck"><span class="fact hgdust">⭐ ' + dust.toLocaleString() + " Stardust</span></div>";
  h += '<div class="card"><div class="card-head"><h2>\u{1F680} S.S. Duck paint jobs</h2><span class="fact">' + paintsOwned(st) + " of " + ducks.length + " owned</span></div>" +
    '<p class="lede" style="font-size:13.5px;">Buy a paint job, then <b>mix it and roll it on</b> in the paint game. Your duck shows it on the launch bar, in liftoff and when The Keep sees you launch. Switch any time for free.</p>' +
    '<div class="shgrid hggrid"><div class="shitem hgduck' + (wearing(st, "duck") ? "" : " own") + '"><img src="assets/planet/ss-duck.webp" alt=""><b>Classic Yellow</b><span class="hgbtns">' +
    (wearing(st, "duck") ? '<button class="btn small ghost" data-shuse="' + wearing(st, "duck").k + '">Use</button>' : '<button class="btn small gold" disabled>✅ Using</button>') + "</span></div></div>";
  tiers.forEach(([title, price], i) => { const list = ducks.filter(d => (i === 4 ? d.cost >= 2500 : d.cost === price));
    h += '<h3 class="shcat">' + title + "</h3><div class=\"shgrid hggrid\">" + list.map(d => card(st, d, open, dust)).join("") + "</div>"; });
  h += "</div>";
  [["flame", "\u{1F525} Rocket flames", "The fire behind your duck."], ["trail", "✨ Trails", "Behind your duck on the launch bar."]].forEach(([cat, title, sub]) => {
    h += '<div class="card"><div class="card-head"><h2>' + title + '</h2></div><p class="small muted" style="margin:0 0 8px;">' + sub + '</p><div class="shgrid">' + SHOP_ITEMS.filter(i => i.cat === cat).map(i => card(st, i, open, dust)).join("") + "</div></div>"; });
  return h + (open ? "" : '<p class="small muted">The Hangar opens after today’s launch, until 12:55.</p>');
}
if (typeof document !== "undefined") document.addEventListener("click", ev => {
  const b = ev.target.closest && ev.target.closest("[data-hgbuy]");
  if (b) { const it = SHOP_BY[b.dataset.hgbuy]; if (!it) return; buy(it.k, it.cat === "duck" ? () => startPaint(it.k) : null); return; }
  const a = ev.target.closest && ev.target.closest("[data-hgpaint]"); if (a) startPaint(a.dataset.hgpaint);
});

/* ---------- 🎨 the painting minigame (a full-screen layer) ---------- */
let G = null, root = null;
const $ = id => document.getElementById(id);
const DECOYS = ["red", "orange", "yellow", "lime", "green", "teal", "sky", "blue", "navy", "purple", "lavender", "pink", "hotpink", "white", "black", "gray", "brown", "gold"];
function rootEl() { if (!root) { root = document.createElement("div"); root.id = "hgroot"; document.body.appendChild(root);
  root.addEventListener("click", ev => { const c = ev.target.closest("[data-hgcan]"); if (c) pick(c); const q = ev.target.closest("[data-hgq]"); if (q) quit(); }); } return root; }
function shell(inner, say, step) {
  rootEl().innerHTML = '<div class="hgover" style="background-image:url(' + H + 'hangar-bg.webp)"><div class="hgtop"><b>\u{1F527} Duck Hangar · ' + esc(G.it.name) + "</b><span>" + (step || "") +
    '</span><button class="btn ghost small" data-hgq="1">✕</button></div><div class="hgchef"><img src="' + H + 'mechanic-duck.webp" alt=""><div class="hgbub" id="hgbub">' + say + "</div></div>" +
    '<div class="hgwork" id="hgwork">' + inner + "</div></div>";
}
function quit() { G = null; if (root) root.innerHTML = ""; }
export function startPaint(k) {
  const it = SHOP_BY[k]; if (!it || it.cat !== "duck") return;
  G = { it, got: 0, miss: 0, cols: it.cols };
  const dec = DECOYS.filter(c => !it.cols.includes(c)).sort(() => Math.random() - 0.5).slice(0, 3), all = it.cols.concat(dec).sort(() => Math.random() - 0.5);
  shell('<div class="hgrecipe">Paint recipe: ' + it.cols.map((c, i) => '<i id="hgg' + i + '" style="background:' + PAINT_COLORS[c] + '" title="' + cname(c) + '"></i>').join("") + "</div>" +
    tool("bucket", "#FFFFFF", "hgbucket", ' id="hgbk"') +
    '<div class="hgcans">' + all.map(c => '<button class="hgcan" data-hgcan="' + c + '" aria-label="' + cname(c) + ' paint">' + tool("can", PAINT_COLORS[c]) + "<small>" + cname(c) + "</small></button>").join("") + "</div>",
    "Step 1: mix the paint! Tap " + it.cols.map(cname).join(", then ") + ".", "Step 1 of 2");
}
function pick(b) {
  if (!G || G.got >= 3) return; const c = b.dataset.hgcan, want = G.cols[G.got];
  if (c === want) { b.classList.add("used"); b.disabled = true; const g = $("hgg" + G.got); if (g) g.classList.add("ok"); G.got++; tick(600 + G.got * 150);
    const t = $("hgbk") && $("hgbk").querySelector(".hgtint"), cs = G.cols.slice(0, G.got).map(x => PAINT_COLORS[x]);
    if (t) t.style.background = cs.length === 1 ? cs[0] : "conic-gradient(" + cs.join(",") + "," + cs[0] + ")";
    if (G.got === 3) { const s = $("hgbub"); if (s) s.textContent = "Perfect mix! Now let’s roll it on!"; setTimeout(roll, 1200); } }
  else { G.miss++; b.classList.remove("nope"); void b.offsetWidth; b.classList.add("nope"); tick(220); }
}
function roll() {
  if (!G) return; const it = G.it, grad = "linear-gradient(90deg," + G.cols.map(c => PAINT_COLORS[c]).join(",") + ")";
  shell('<div class="hgstage" id="hgst"><canvas id="hgprimer"></canvas><canvas id="hgcv"></canvas>' + tool("roller", grad, "hgroller", ' id="hgro"') + "</div>" +
    '<div class="hgbar"><div id="hgcov"></div></div><div class="hgtime" id="hgtm">10</div>',
    "Step 2: roll it on! Drag the roller over the whole duck before time runs out.", "Step 2 of 2");
  const img = new Image(); img.onload = () => setupRoll(img); img.src = it.img;
}
function setupRoll(img) {
  const W = 800, Hh = 512, cv = $("hgcv"), pr = $("hgprimer"), st = $("hgst"); if (!cv || !G) return;
  [cv, pr].forEach(c => { c.width = W; c.height = Hh; });
  const px = pr.getContext("2d"); px.filter = "grayscale(1) contrast(.5) brightness(1.15)"; px.drawImage(img, 0, 0, W, Hh); px.filter = "none";
  const x = cv.getContext("2d"), m = document.createElement("canvas"); m.width = W; m.height = Hh; const mx = m.getContext("2d");
  let A = null, tot = 1;
  try { const r = document.createElement("canvas"); r.width = W; r.height = Hh; const rx = r.getContext("2d"); rx.drawImage(img, 0, 0, W, Hh); A = rx.getImageData(0, 0, W, Hh).data; tot = 0; for (let i = 3; i < A.length; i += 4) if (A[i] > 40) tot++; } catch (e) { A = null; }
  let down = false, t0 = 0, done = false, last = 0, lx = null, ly = null;
  const brush = (cx, cy) => { mx.fillStyle = "#000"; mx.beginPath(); mx.ellipse(cx, cy, 78, 50, 0, 0, 7); mx.fill(); };
  const redraw = () => { x.clearRect(0, 0, W, Hh); x.drawImage(m, 0, 0); x.globalCompositeOperation = "source-in"; x.drawImage(img, 0, 0, W, Hh); x.globalCompositeOperation = "source-over"; };
  let strokes = 0;
  const cov = () => { if (!A) return Math.min(1, strokes / 60); const d = mx.getImageData(0, 0, W, Hh).data; let n = 0; for (let i = 3; i < d.length; i += 16) if (d[i] > 0 && A[i] > 40) n++; return Math.min(1, n * 4 / tot); };
  const pos = e => { const r = st.getBoundingClientRect(); return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * Hh / r.height, e.clientX - r.left, e.clientY - r.top]; };
  const move = e => { const [a, b, c, d] = pos(e), ro = $("hgro"); if (ro) { ro.style.left = c + "px"; ro.style.top = d + "px"; } if (!down || done) return;
    if (lx != null) { const n = Math.ceil(Math.hypot(a - lx, b - ly) / 25); for (let i = 1; i <= n; i++) brush(lx + (a - lx) * i / n, ly + (b - ly) * i / n); } else brush(a, b);
    lx = a; ly = b; strokes++; redraw();
    if (Math.random() < 0.12) splat(c, d);
    const t = performance.now(); if (t - last > 140) { last = t; const v = cov(); const bar = $("hgcov"); if (bar) bar.style.width = Math.min(100, v * 104) + "%"; if (v > 0.96) finish(v); } };
  st.addEventListener("pointerdown", e => { e.preventDefault(); down = true; lx = ly = null; try { st.setPointerCapture(e.pointerId); } catch (x2) {} if (!t0) { t0 = performance.now(); tickT(); } move(e); });
  st.addEventListener("pointermove", move);
  const up = () => { down = false; lx = ly = null; }; st.addEventListener("pointerup", up); st.addEventListener("pointercancel", up);
  const tickT = () => { if (done || !G) return; const l = Math.max(0, 10 - (performance.now() - t0) / 1000), e = $("hgtm"); if (e) e.textContent = Math.ceil(l); if (l <= 0) return finish(cov()); requestAnimationFrame(tickT); };
  function finish(v) { if (done || !G) return; done = true; const stars = v > 0.9 && G.miss === 0 ? 3 : v > 0.7 ? 2 : 1;
    x.clearRect(0, 0, W, Hh); x.drawImage(img, 0, 0, W, Hh); pr.style.opacity = 0; const ro = $("hgro"); if (ro) ro.style.display = "none"; chime();
    const b = $("hgbub"); if (b) b.textContent = stars === 3 ? "WOW! A perfect paint job, Captain!" : stars === 2 ? "Looking sharp, Captain!" : "Nice! A little touch-up and it’s shiny!";
    const tm = $("hgtm"); if (tm) tm.outerHTML = '<div class="hgdone"><div class="hgstars">' + "⭐".repeat(stars) + '<span class="cafdim">' + "⭐".repeat(3 - stars) + "</span></div><b>Your S.S. Duck is now " + esc(G.it.name) + "!</b>" +
      '<p>It shows on your launch bar and in liftoff.</p><button class="btn gold" data-hgq="1">Done</button></div>';
    const bar = $("hgcov"); if (bar) bar.parentNode.remove(); }
}
function splat(c, d) { const st = $("hgst"); if (!st || !G) return; const s = document.createElement("span"), col = PAINT_COLORS[G.cols[Math.floor(Math.random() * 3)]];
  s.className = "hgsplat"; s.style.left = c + "px"; s.style.top = d + "px"; s.innerHTML = tool("splat", col); st.appendChild(s); setTimeout(() => s.remove(), 700); }
let AC = null;
const ac = () => { try { if (localStorage.getItem("ck-mute") === "1") return null; } catch (e) {} try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); return AC; } catch (e) { return null; } };
function tick(f) { const a = ac(); if (!a) return; const t = a.currentTime, o = a.createOscillator(), g = a.createGain(); o.type = "triangle"; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.07, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12); o.connect(g).connect(a.destination); o.start(t); o.stop(t + 0.15); }
function chime() { [988, 1319, 1568, 1976].forEach((f, i) => setTimeout(() => tick(f), i * 90)); }
