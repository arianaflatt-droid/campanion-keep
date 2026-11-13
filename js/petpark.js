/* ---------- 🌳 Nebbles Phase 2: the Pet Park (Nov 9) ----------
   A place on the Planet JP map. The student brings a Nebble they've adopted (their buddy, or any other one) and cares for it.
   Care is FREE and the Nebble is never sad or sick. Four things to do, once a day each (🪥 Brush time added Nov 10; what the Nebble
   eats, brushes with, plays with and bathes with comes from the Adoption Center shop: nebshop.js careUse):
   - ⚽ Fetch: throw the ball 3 times; the Nebble hops after it and brings it back.
   - 🍬 Feed: tap the bowl to toss 5 alien pellets.
   - 🛁 Bath: scrub the Nebble in the tub with the sponge until it's all bubbles, then rinse.
   Each one pays +5 ⭐ the first time today (was +3 until Nov 10), all four = +3 more (up to 23 a day). Doing all four on 5 school days
   in a row = +25 ⭐ (Pet Pro streak), then it starts over. (Ms. Ariana, Nov 9.)
   Each finished activity is ONE save (so at most 3 a day): planet.pets.care = { d: date, f, p, b: done today (1),
   st: full-care days in a row, last: last full-care date, cards: full streaks, n: full-care days } through planetSave.
   The 🐾 My Room pet corner (Phase 3) also lives here: the buddy sits on its bed in My Room (display only). */
import { esc } from "./game.js?v=20261113b";
import { azToday } from "./collect.js?v=20261113b";
import { schoolDayFor } from "./axolotl.js?v=20261113b";
import { addDays } from "./doors.js?v=20261113b";
import { freshSt, planetSave, planetNow, planetCtx } from "./safari.js?v=20261113b";
import { playOpen, playgroundHTML } from "./playground.js?v=20261113b";
import { bedOf, bedWithPet, careUse } from "./nebshop.js?v=20261113b";
import { NEB, PP, PERS, PERSONALITIES, ownedOf, petsOf, nebHTML, nebImg, nebHappy } from "./pets.js?v=20261113b";

export const CARE_EACH = 5, CARE_ALL = 3,   // Nov 10 (Ms. Ariana): +5 each, was +3
                   CARE_STREAK = 5, CARE_STREAK_BONUS = 25;
const FETCH_N = 3, FEED_N = 5, SCRUB_N = 100;
const ACTS = [
  { k: "f", key: "fetch", icon: "⚽", name: "Play fetch", how: "Throw the ball 3 times" },
  { k: "p", key: "feed", icon: "\u{1F36C}", name: "Feed time", how: "Toss 5 snacks" },
  { k: "b", key: "bath", icon: "\u{1F6C1}", name: "Bath time", how: "Scrub, then rinse" },
  { k: "r", key: "brush", icon: "\u{1FAA5}", name: "Brush time", how: "Brush until it sparkles" }];   // 🪥 Nov 10: the 4th activity
const ALL_N = ACTS.length;
const careOf = st => { const c = petsOf(st).care || {}; return c.d === azToday() ? c : Object.assign({}, c, { d: azToday(), f: 0, p: 0, b: 0, r: 0 }); };
export const careDone = st => { const c = careOf(st); return ACTS.every(a => c[a.k]); };
export const hasNebble = st => Object.keys(ownedOf(st)).some(k => NEB[k]);

let pick = null, act = null, n = 0, busy = false, msg = null;
const rer = () => { const c = planetCtx(); if (c && c.rerender) c.rerender(); };
const petKey = st => { const own = ownedOf(st); if (pick && own[pick]) return pick; const b = petsOf(st).buddy; return b && own[b] ? b : Object.keys(own).find(k => NEB[k]) || ""; };
const $ = id => document.getElementById(id);

// pay for one finished activity (k = f | p | b)
function finish(k) {
  const c = planetCtx(); if (!c || !c.st) return;
  const st = freshSt(c.st), d = azToday(), pl = planetNow();
  const pets = JSON.parse(JSON.stringify(pl.pets || {})), care = careOf({ planet: { pets } });
  if (care[k]) return;
  care[k] = 1; let gain = CARE_EACH, extra = [];
  if (ACTS.every(a => care[a.k])) {
    gain += CARE_ALL; extra.push("+" + CARE_ALL + " for doing all four");
    let prev = addDays(d, -1), i = 0; while (!schoolDayFor(c.cls, prev) && i++ < 20) prev = addDays(prev, -1);
    care.st = care.last === prev ? (Number(care.st) || 0) + 1 : 1; care.last = d; care.n = (Number(care.n) || 0) + 1;
    if (care.st >= CARE_STREAK) { care.st = 0; care.cards = (Number(care.cards) || 0) + 1; gain += CARE_STREAK_BONUS; extra.push("+" + CARE_STREAK_BONUS + " Pet Pro streak bonus! \u{1F3C6}"); }
  }
  pets.care = care; pl.pets = pets; pl.dust = (Number(pl.dust) || 0) + gain;
  planetSave(pl);
  const own = ownedOf(st)[petKey(st)] || {}, a = ACTS.find(x => x.k === k);
  msg = { text: a.icon + " " + esc(own.n || "Your Nebble") + " loved that! <b>+" + gain + " ⭐</b>" + (extra.length ? " (" + extra.join(", ") + ")" : "") };
}

/* ---------- the activities (drawn straight into the scene, no page redraw until they finish) ---------- */
const scene = () => $("pkscene"), petEl = () => $("pkpet");
function say(t) { const b = $("pksay"); if (b) b.innerHTML = t; }
function happy(on) { const p = petEl(), img = p && p.querySelector(".nbimg"); if (!img) return; const k = p.dataset.k; img.src = on ? nebHappy(k) : nebImg(k); }
function hearts(x, y) { const s = scene(); if (!s) return; const h = document.createElement("span"); h.className = "pkheart"; h.textContent = ["\u{1F496}", "✨", "\u{1F495}"][Math.floor(Math.random() * 3)]; h.style.left = x + "%"; h.style.top = y + "%"; s.appendChild(h); setTimeout(() => h.remove(), 1200); }
const lineOf = () => { const st = freshSt((planetCtx() || {}).st), o = ownedOf(st)[petKey(st)] || {}, p = PERS[o.p] || PERSONALITIES[0]; return "<b>" + esc(o.n || "") + ":</b> " + esc(p.say[Math.floor(Math.random() * p.say.length)]); };
function done(k, text) {
  busy = true; happy(true); hearts(50, 40); hearts(44, 46); hearts(56, 44); say(text);
  setTimeout(() => { busy = false; act = null; finish(k); rer(); }, 1500);
}
function throwBall() {
  if (busy) return; const p = petEl(), b = $("pkball"); if (!p || !b) return; busy = true;
  const x = 14 + Math.random() * 68, y = 56 + Math.random() * 22;
  b.style.transition = "left .7s ease-out, top .7s cubic-bezier(.2,-0.6,.6,1)"; b.style.left = x + "%"; b.style.top = y + "%";
  setTimeout(() => { p.classList.add("hopping"); p.style.left = (x - 7) + "%"; p.style.top = (y - 16) + "%"; }, 450);
  setTimeout(() => { b.style.transition = "none"; b.classList.add("held"); happy(true); hearts(x, y - 14); }, 1300);
  setTimeout(() => { p.style.left = ""; p.style.top = ""; b.style.transition = "left .8s, top .8s"; b.style.left = ""; b.style.top = ""; }, 1700);
  setTimeout(() => { p.classList.remove("hopping"); b.classList.remove("held"); happy(false); busy = false; n++;
    const c = $("pkcount"); if (c) c.textContent = n + " / " + FETCH_N;
    if (n >= FETCH_N) done("f", "⚽ What a good catch! " + lineOf()); else say(n === 1 ? "It brought the ball back! Throw it again!" : "One more throw!"); }, 2600);
}
function tossPellet() {
  if (busy) return; const s = scene(); if (!s) return; busy = true;
  const fd = careUse(freshSt((planetCtx() || {}).st), "food"), pcs = fd.pcs || [PP + "pellet.webp"];
  const pe = document.createElement("img"); pe.src = pcs[Math.floor(Math.random() * pcs.length)]; pe.className = "pkpellet"; pe.alt = ""; s.appendChild(pe);   // a random color for each piece
  requestAnimationFrame(() => requestAnimationFrame(() => pe.classList.add("go")));
  setTimeout(() => { pe.remove(); happy(true); const p = petEl(); if (p) p.classList.add("chomp"); hearts(50, 42); n++;
    const c = $("pkcount"); if (c) c.textContent = n + " / " + FEED_N; }, 650);
  setTimeout(() => { const p = petEl(); if (p) p.classList.remove("chomp"); happy(false); busy = false;
    if (n >= FEED_N) done("p", "\u{1F36C} Yum! All full of " + esc(fd.name) + "! " + lineOf()); else say(["Nom nom!", "Crunch crunch!", "More please!", "Yummy!"][n % 4]); }, 1250);
}
let scrubLast = null;
const bubColors = () => (careUse(freshSt((planetCtx() || {}).st), "bub").c) || ["#bfe6ff", "#ffbef0"];
const brushSp = () => (careUse(freshSt((planetCtx() || {}).st), "brush").sp) || ["✨"];
function scrubMove(ev) {
  if ((act !== "bath" && act !== "brush") || busy || n >= SCRUB_N) return;
  const brush = act === "brush", s = scene(), sp = $(brush ? "pkbrush" : "pksponge"), p = petEl(); if (!s || !sp || !p) return;
  const r = s.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width * 100, y = (ev.clientY - r.top) / r.height * 100;
  sp.style.left = x + "%"; sp.style.top = y + "%";
  const pr = p.getBoundingClientRect(); if (ev.clientX < pr.left || ev.clientX > pr.right || ev.clientY < pr.top || ev.clientY > pr.bottom) { scrubLast = null; return; }
  if (scrubLast) { const d = Math.hypot(ev.clientX - scrubLast[0], ev.clientY - scrubLast[1]) / r.width * 100; n = Math.min(SCRUB_N, n + d * 1.6); }
  scrubLast = [ev.clientX, ev.clientY];
  if (brush) { if (Math.random() < 0.18) { const e = brushSp(), sk = document.createElement("span"); sk.className = "pkspark"; sk.textContent = e[Math.floor(Math.random() * e.length)];
      sk.style.left = (x - 3 + Math.random() * 6) + "%"; sk.style.top = (y - 3 + Math.random() * 6) + "%"; s.appendChild(sk); setTimeout(() => sk.remove(), 1100); } }
  else if (Math.random() < 0.25) { const cs = bubColors(), bu = document.createElement("span"); bu.className = "pkbub"; const sz = 1.2 + Math.random() * 2.4;
    bu.style.cssText = "left:" + (x - 2 + Math.random() * 4) + "%;top:" + (y - 2 + Math.random() * 4) + "%;width:" + sz + "%;background:radial-gradient(circle at 30% 30%,#fff 0 18%," + cs[Math.floor(Math.random() * cs.length)] + "99 45%," + cs[Math.floor(Math.random() * cs.length)] + "66 75%,rgba(255,255,255,.2));"; s.appendChild(bu); }
  const bar = $("pkbar"); if (bar) bar.style.width = Math.round(n) + "%";
  if (n >= SCRUB_N && brush) { n = SCRUB_N; done("r", "\u{1FAA5} So soft and shiny! " + lineOf()); return; }
  if (n >= SCRUB_N) { say("So bubbly! Now tap <b>Rinse</b> \u{1F6BF}"); const rb = $("pkrinse"); if (rb) rb.disabled = false; happy(true); }
}
function rinse() {
  if (busy || n < SCRUB_N) return; const s = scene(); if (!s) return;
  s.classList.add("rinsing"); s.querySelectorAll(".pkbub").forEach((b, i) => setTimeout(() => b.classList.add("pop"), i * 15));
  setTimeout(() => { s.classList.remove("rinsing"); s.querySelectorAll(".pkbub").forEach(b => b.remove()); done("b", "✨ Squeaky clean and sparkly! " + lineOf()); }, 1300);
}
if (typeof document !== "undefined") {
  document.addEventListener("click", ev => {
    const t = ev.target.closest && ev.target.closest("[data-pk]"); if (!t) return;
    const [a, k] = t.dataset.pk.split(":");
    if (a === "pick") { if (busy) return; pick = k; act = null; msg = null; return rer(); }
    if (a === "start") { if (busy) return; act = k; n = 0; msg = null; scrubLast = null; return rer(); }
    if (a === "stop") { if (busy) return; act = null; return rer(); }
    if (a === "throw") return throwBall();
    if (a === "bowl") return tossPellet();
    if (a === "rinse") return rinse();
    if (a === "pet") { if (busy) return; happy(true); hearts(50, 40); say(lineOf()); setTimeout(() => happy(false), 1200); }
  });
  document.addEventListener("pointermove", scrubMove);
  document.addEventListener("pointerdown", ev => { if ((act === "bath" || act === "brush") && ev.target.closest && ev.target.closest("#pkscene")) { scrubLast = null; scrubMove(ev); } });
}

export function parkHTML(st, cls, open, students) {
  st = freshSt(st);
  if (playOpen() && hasNebble(st)) return playgroundHTML(st, cls, students);   // 🛝 Phase 4
  let h = '<div class="card pkcard"><div class="card-head"><h2>\u{1F333} Pet Park</h2><span class="fact">⭐ ' + (Number(((st && st.planet) || {}).dust) || 0).toLocaleString() + " Stardust</span></div>";
  if (!hasNebble(st)) return h + '<div class="pkempty"><img src="' + PP + 'park-building.webp" alt=""><p class="lede">The Pet Park is for Nebbles! Adopt one at the <b>Adoption Center</b> first, then bring it here to play.</p>' +
    '<button class="btn gold" data-pjzone="adopt">\u{1F43E} Go to the Adoption Center</button></div></div>';
  const own = ownedOf(st), k = petKey(st), o = own[k] || {}, care = careOf(st), keys = Object.keys(own).filter(x => NEB[x]);
  const left = ACTS.filter(a => !care[a.k]).length;
  if (act && care[ACTS.find(a => a.key === act).k]) act = null;
  // the scene
  h += '<div class="pkscene' + (act ? " act-" + act : "") + '" id="pkscene" style="background-image:url(' + PP + 'park-bg.webp)">';
  if (act === "bath") h += '<img class="pktub back" src="' + PP + 'tub.webp" alt="">';
  h += '<button class="pkpet" id="pkpet" data-k="' + k + '" data-pk="pet" aria-label="Pet ' + esc(o.n) + '">' + nebHTML(k, { hat: act === "bath" ? "" : o.h, cls: act ? "" : "nbbob" }) + "</button>";
  const tt = careUse(st, "tub");
  if (act === "bath") h += '<img class="pktub front" src="' + PP + 'tub.webp" alt="">' + (tt.img ? '<img class="pktubtoy" src="' + tt.img + '" alt="">' : "") + '<img class="pksponge" id="pksponge" src="' + PP + 'sponge.webp" alt="">';
  if (act === "brush") h += '<img class="pkbrush" id="pkbrush" src="' + careUse(st, "brush").img + '" alt="">';
  if (act === "fetch") h += '<img class="pkball" id="pkball" src="' + careUse(st, "toy").img + '" alt="">';
  if (act === "feed") h += '<button class="pkbowl" data-pk="bowl" aria-label="Toss a snack"><img src="' + careUse(st, "food").bowl + '" alt=""></button>';
  const sayTxt = msg ? msg.text : act === "fetch" ? "Tap <b>Throw!</b> and watch " + esc(o.n) + " go get it!" : act === "feed" ? "Tap the <b>bowl</b> to toss a snack!" : act === "brush" ? "Brush " + esc(o.n) + " with the <b>" + esc(careUse(st, "brush").name) + "</b> until it sparkles!" :
    act === "bath" ? "Rub the <b>sponge</b> all over " + esc(o.n) + " to make bubbles!" : !left ? "All done for today! " + esc(o.n) + " is so happy. Tap it for a cuddle!" :
    "Hi! It’s " + esc(o.n) + "! Pick something to do together below.";
  h += '<div class="pksay" id="pksay">' + sayTxt + "</div></div>";
  // controls
  if (act) {
    const total = act === "fetch" ? FETCH_N : act === "feed" ? FEED_N : 0;
    h += '<div class="row pkctl">' + (act === "fetch" ? '<button class="btn gold" data-pk="throw">⚽ Throw!</button>' : act === "bath" ? '<div class="pkmeter"><i id="pkbar"></i></div><button class="btn gold" id="pkrinse" data-pk="rinse" disabled>\u{1F6BF} Rinse</button>' : act === "brush" ? '<div class="pkmeter"><i id="pkbar"></i></div>' : "") +
      (total ? '<span class="pkcount" id="pkcount">0 / ' + total + "</span>" : "") + '<button class="btn ghost small" data-pk="stop">Stop</button></div>';
  } else if (open) {
    h += '<div class="pkacts">' + ACTS.map(a => '<button class="pkact' + (care[a.k] ? " done" : "") + '" data-pk="start:' + a.key + '"' + (care[a.k] ? " disabled" : "") + '><span class="pkic">' + (care[a.k] ? "✅" : a.icon) + "</span><b>" + a.name + "</b><small>" + (care[a.k] ? "Done today!" : a.how + " · +" + CARE_EACH + " ⭐") + "</small></button>").join("") + "</div>";
  } else h += '<p class="small muted" style="margin:8px 0 0;">The Pet Park is open while Planet JP is open.</p>';
  if (!act) h += '<button class="pgopenbtn" data-pg="open"><img src="' + PP + 'playground-bg.webp" alt=""><span>\u{1F6DD} <b>Pet Playground</b><small>Play with your classmates\u2019 Nebbles!</small></span></button>';
  h += '<p class="small" style="margin:8px 0 0;">' + (left ? "Do all four for <b>+" + CARE_ALL + " ⭐</b> more (up to " + (CARE_EACH * ALL_N + CARE_ALL) + " a day)." : "\u{1F31F} All four done today!") +
    " · \u{1F3C6} Pet Pro streak: <b>" + (() => { const c = petsOf(st).care || {}; return c.last === azToday() && !Number(c.st) && c.cards ? CARE_STREAK : Math.min(CARE_STREAK, Number(c.st) || 0); })() + " / " + CARE_STREAK + "</b> days (" + CARE_STREAK + " days in a row = +" + CARE_STREAK_BONUS + " ⭐)</p>";
  if (keys.length > 1 && !act) h += '<p class="small" style="margin:10px 0 4px;"><b>Who’s playing?</b></p><div class="nbsidepick">' + keys.map(x => '<button class="nbslot have' + (x === k ? " on" : "") + '" data-pk="pick:' + x + '" title="' + esc(own[x].n) + '">' + nebHTML(x, { hat: own[x].h }) + "<small>" + esc(own[x].n) + "</small></button>").join("") + "</div>";
  return h + "</div>";
}

// 🐾 My Room pet corner (Phase 3): the buddy sleeps on its bed (display only)
export function nebbleCorner(st) {
  st = freshSt(st); const own = ownedOf(st), b = petsOf(st).buddy; if (!b || !own[b] || !NEB[b]) return "";
  // 🛏️ Nov 10: on the bed picked in the Bed Shop (the Classic bed until then)
  return '<div class="rneb" title="' + esc(own[b].n) + '">' + bedWithPet(bedOf(st).k, nebHTML(b, { hat: own[b].h, cls: "nbbob" })) + "</div>";
}
