/* ---------- 📽️ Class screen for the solo events (Nov 7): 🧪 the Class Cauldron (Haunt-O-Ween) and 🍽️ the Class Feast (Gobble-Palooza) ----------
   Ms. Ariana opens it from the console (top bar) and projects it, like the boss battle. It watches the class live
   from the student saves the console already has (no extra Firebase reads, nothing is saved):
     · an ingredient arriving (a paste gave a student more Eyeballs / Corn / ...) → it drops into the cauldron / onto the table: "Ava added 👁️ Eyeballs!"
     · a potion brewed / a dish cooked → a big moment on screen: "✨ Ben brewed a Glow Potion!" / "🥧 Mia cooked Pumpkin Pie!"
     · a leaderboard (most potions / dishes this event), today's count, a class total with milestones, and the latest news.
   The other solo events (gingerbread, snowmen, chocolate, traps) use the same screen with their own icons. */
import { esc } from "./game.js?v=20261119b";
import { azToday } from "./collect.js?v=20261119b";
import { soloCfg, soloOn, soloDay, soloTotal, soloOf, soloIngs } from "./solobrew.js?v=20261119q";
import { DISHES, effect } from "./teams.js?v=20261119b";

const MILE = 25;                      // a class milestone every 25 potions / dishes
let root = null, last = null, primed = "", snap = {}, feed = [], q = [], busy = false, open = false, cfgKey = "";
export const soloScreenOpen = () => open;
const kids = students => (students || []).filter(s => s.companionId && !s.isTeacher);
const first = s => esc(String((s && s.name) || "").split(" ")[0] || "Someone");

// Called on every console update. Keeps the "what changed" snapshot even while the screen is closed (so opening it doesn't replay old news).
export function soloScreenSync(students, cls) {
  last = { students, cls };
  if (!soloOn(cls)) { if (open) soloScreenClose(); return; }
  const k = soloCfg(cls), today = azToday(), list = kids(students);
  const key = k.key + ":" + today;
  if (primed !== key) { snap = {}; feed = []; }
  list.forEach(s => {
    const d = soloDay(s, cls, today), tot = soloTotal(s, k), was = snap[s.id];
    const now = { tot, have: Object.assign({}, d.have) };
    if (primed === key && was) {
      const got = soloIngs(k).map(g => ({ g, n: (now.have[g.k] || 0) - (was.have[g.k] || 0) })).filter(x => x.n > 0);
      if (got.length) news({ kind: "ing", s, got });   // one moment per student per XP check, with everything they got
      if (tot > was.tot) for (let i = 0; i < Math.min(3, tot - was.tot); i++) news({ kind: "made", s, n: was.tot + i + 1, fx: k.fx ? ((soloOf(s, k).fx || {})[today] || null) : null });
    }
    snap[s.id] = now;
  });
  primed = key;
  if (open) draw(false);
}
function news(e) {
  e.at = Date.now();
  feed.unshift(e); feed = feed.slice(0, 7);
  if (open) { q.push(e); if (!busy) nextMoment(); }
}

/* ---------- the screen ---------- */
export function soloScreenOpenNow() {
  if (!last || !soloOn(last.cls)) return;
  open = true; q = []; cfgKey = "";
  if (!root) { root = document.createElement("div"); root.id = "soloscr"; document.body.appendChild(root);
    root.addEventListener("click", ev => { if (ev.target.closest("[data-sscr=close]")) soloScreenClose(); }); }
  draw(true);
}
export function soloScreenClose() { open = false; q = []; busy = false; if (root) root.innerHTML = ""; }

const isPotion = k => k.key === "haunt", isFeast = k => k.key === "gobble";
function sceneHTML(k) {
  if (isPotion(k)) return '<div class="sscaul"><div class="sscbubbles"><i></i><i></i><i></i><i></i><i></i></div><img class="sscart" src="assets/potion/cauldron.webp" alt=""><div class="sscglow"></div></div>';
  if (isFeast(k)) return '<div class="ssfeast round">' + FGUESTS + '<img class="ssftable" src="assets/feast/table-round.webp" alt=""><div class="ssfdishes" id="ssfdishes"></div></div>';
  return '<div class="ssgeneric"><span>' + k.icon + "</span></div>";
}
// the feast: one dish per dish cooked by the class, a fresh table every 10
// [left %, row (0 = back, 1 = front), width %] — Nov 19: spread out so no dish hides behind another; the turkey (10th) is the big one in front
// 🦃👻 Nov 19: guests at the feast — the Turducken and the Ghost-olotl sit at the back of the table with their plates
export const FGUESTS = '<img class="fguest g1" src="assets/gobble/turducken-sidekick.webp" alt=""><img class="fguest g2" src="assets/ghost-pet.png" alt="">' +
  '<img class="fplate p1" src="assets/feast/plate.webp" alt="" onerror="this.src=\'assets/feast/mashed.webp\';this.onerror=null"><img class="fplate p2" src="assets/feast/plate.webp" alt="" onerror="this.src=\'assets/feast/pie.webp\';this.onerror=null">';
// Nov 19: Ms. Ariana's big round table — back row along the far edge, front row along the near edge, the turkey big in the middle
// Nov 19 (later): scattered all over the round table: [left %, bottom %, width %]; lower = nearer the front
const SPOTS = [[32, 77, 11], [64, 79, 11], [47, 70, 11], [22, 64, 12], [76, 67, 12], [33, 57, 12], [68, 57, 12], [16, 72, 10], [84, 73, 9], [51, 56, 18]];
const SPOTS_OLD = [[30, 0, 15], [70, 0, 15], [50, 0, 15], [12, 0, 14], [88, 0, 14], [21, 1, 16], [79, 1, 16], [36, 1, 15], [64, 1, 15], [50, 1, 22]];
let shownDishes = -1;
function dishes(total, animate) {
  const el = document.getElementById("ssfdishes"); if (!el) return;
  const n = total ? ((total - 1) % 10) + 1 : 0;
  if (n === shownDishes && !animate) return;
  const was = shownDishes < 0 || n < shownDishes ? (animate ? n - 1 : n) : shownDishes;
  shownDishes = n;
  el.innerHTML = DISHES.slice(0, n).map((d, i) => ({ d, i, s: SPOTS[i] })).sort((a, b) => b.s[1] - a.s[1])
    .map(({ d, i, s }) => '<img class="ssdish sc' + (i >= was ? " new" : "") + '" src="assets/feast/' + d.k + '.webp" alt="" style="left:' + s[0] + "%;bottom:" + s[1] + "%;width:" + s[2] + "%;z-index:" + (100 - s[1]) + ';">').join("");
}
function draw(full) {
  if (!root || !last) return;
  const { students, cls } = last, k = soloCfg(cls), today = azToday(), list = kids(students);
  const rows = list.map(s => ({ s, tot: soloTotal(s, k), day: soloDay(s, cls, today).made })).sort((a, b) => b.tot - a.tot || b.day - a.day || String(a.s.name).localeCompare(String(b.s.name)));
  const total = rows.reduce((n, r) => n + r.tot, 0), todayN = rows.reduce((n, r) => n + r.day, 0), next = (Math.floor(total / MILE) + 1) * MILE;
  const title = isPotion(k) ? "\u{1F9EA} The Class Cauldron" : isFeast(k) ? dishIc(k, "ttl") + '<span class="ssttl">The Class Feast</span>' : k.icon + " Class " + esc(k.name);
  if (full || cfgKey !== k.key || !root.querySelector(".sscr")) {
    cfgKey = k.key; shownDishes = -1;
    root.innerHTML = '<div class="sscr ss-' + k.key + '"><div class="ssstars"></div><div class="sstop"><h1>' + title + '</h1><span class="sssub">' + esc(k.tabName || "") + '</span><button class="btn ghost small" data-sscr="close">✕ Close</button></div>' +
      '<div class="ssmain"><div class="ssscene" id="ssscene">' + sceneHTML(k) + '<div class="sstoast" id="sstoast"></div></div>' +
      '<div class="ssside"><div class="sstotal" id="sstotal"></div><div class="ssboard"><h2>' + hic(k, "ic-trophy", "\u{1F3C6}") + " " + (isPotion(k) ? "Top Brewers" : isFeast(k) ? "Top Chefs" : "Top Builders") + '</h2><ol id="ssboard"></ol></div>' +
      '<div class="ssfeed"><h2>' + hic(k, "ic-horn", "\u{1F4E3}") + ' Just now</h2><ul id="ssfeed"></ul></div></div></div>' +
      '<div class="sshow">' + soloIngs(k).map(g => "<span>" + ic(g, k) + " " + esc(g.name) + (g.goal ? "" : " = " + esc(g.subject || "")) + "</span>").join("") + "<span>= 1 " + dishIc(k) + " " + esc(k.one) + "</span></div></div>";
  }
  const set = (id, h) => { const e = document.getElementById(id); if (e && e.innerHTML !== h) e.innerHTML = h; };
  const pct = ((total % MILE) / MILE * 100).toFixed(1);
  set("sstotal", isFeast(k)
    // 🍽️ Nov 19: the feast's count box: big number, a glass tube that fills toward the next class goal, and three little stat chips on one line
    ? '<div class="ssbig"><b>' + total + "</b> " + esc(total === 1 ? k.one : k.many) + ' cooked</div>' +
      '<div class="sstube"><span class="sstfill" style="width:' + pct + '%"></span><span class="sstlab">' + (total % MILE) + " / " + MILE + '</span><img class="sstgoal" src="assets/feast/ic-dish.webp" alt=""></div>' +
      '<div class="sschips"><span>\u{1F3AF} Next goal <b>' + next + "</b></span><span>Today <b>" + todayN + "</b></span><span>Table <b>" + (Math.floor(Math.max(0, total - 1) / 10) + 1) + "</b></span></div>"
    : '<div class="ssbig"><b>' + total + "</b> " + esc(total === 1 ? k.one : k.many) + ' this event</div><div class="ssmeter"><span style="width:' + pct + '%"></span></div>' +
    '<div class="sssmall">\u{1F3AF} Next class milestone: <b>' + next + "</b> · Today: <b>" + todayN + "</b></div>");
  set("ssboard", rows.slice(0, isFeast(k) ? 6 : 8).map((r, i) => '<li class="' + (i < 3 ? "top" + (i + 1) : "") + '"><span class="ssrank">' + (i < 3 ? medal(i, k) : i + 1) + '</span><b>' + esc(r.s.name) + "</b><span>" + r.tot + " " + dishIc(k) + (r.day ? ' <small>+' + r.day + " today</small>" : "") + "</span></li>").join("") || '<li class="muted">Nobody yet. Be the first!</li>');
  set("ssfeed", feed.map(e => "<li>" + line(e, k) + "</li>").join("") || '<li class="muted">Waiting for the next XP check…</li>');
  if (isFeast(k)) dishes(total, false);
  if (isPotion(k)) { const c = root.querySelector(".sscaul"); if (c) c.style.setProperty("--lvl", ((total % MILE) / MILE).toFixed(3)); }
}
// 🖼️ Nov 19: Ms. Ariana's pictures for the feast ingredients + the dish icon (other events keep their emoji)
const FEAST_PIC = { e: "ing-corn", b: "ing-potato", s: "ing-bread", g: "ing-spice" };
const ic = (g, k, cls) => isFeast(k) && FEAST_PIC[g.k] ? '<img class="ssic' + (cls ? " " + cls : "") + '" src="assets/feast/' + FEAST_PIC[g.k] + '.webp" alt="">' : g.icon;
const dishIc = (k, cls) => isFeast(k) ? '<img class="ssic' + (cls ? " " + cls : "") + '" src="assets/feast/ic-dish.webp" alt="">' : k.icon;
// 🏅 Nov 19: gold / silver / bronze medal pictures for the top 3 chefs (assets/feast/medal-1..3.webp; the emoji shows until they're uploaded)
// 🏆 📯 the board headings' pictures (assets/feast/ic-trophy.webp, ic-horn.webp), emoji until uploaded
const hic = (k, f, emo) => isFeast(k) ? '<img class="sshic" src="assets/feast/' + f + '.webp" alt="" onerror="this.replaceWith(document.createTextNode(\'' + emo + '\'))">' : emo;
const MEDAL = ["\u{1F947}", "\u{1F948}", "\u{1F949}"];
const medal = (i, k) => isFeast(k) ? '<img class="ssmedal" src="assets/feast/medal-' + (i + 1) + '.webp" alt="' + (i + 1) + '" onerror="this.replaceWith(document.createTextNode(\'' + MEDAL[i] + '\'))">' : MEDAL[i];
function line(e, k) {
  if (e.kind === "ing") return "<b>" + first(e.s) + "</b> added " + e.got.map(x => ic(x.g, k) + " " + esc(x.g.name) + (x.n > 1 ? " ×" + x.n : "")).join(", ");
  if (isPotion(k)) return "✨ <b>" + first(e.s) + "</b> brewed " + (e.fx ? "a " + effect(e.fx).icon + " " + esc(effect(e.fx).name) : "a potion") + "!";
  if (isFeast(k)) { const d = DISHES[(e.n - 1) % DISHES.length]; return dishIc(k) + " <b>" + first(e.s) + "</b> cooked " + esc(d.name) + "!"; }
  return k.icon + " <b>" + first(e.s) + "</b> " + esc(k.done) + " a " + esc(k.one) + "!";
}

/* ---------- the big moments, one at a time ---------- */
function nextMoment() {
  const e = q.shift(); if (!e || !open) { busy = false; return; }
  busy = true;
  const k = soloCfg(last.cls), scene = document.getElementById("ssscene"), toast = document.getElementById("sstoast");
  if (!scene) { busy = false; return; }
  const made = e.kind === "made";
  if (toast) { toast.className = "sstoast on" + (made ? " big" : ""); toast.innerHTML = line(e, k); }
  if (e.kind === "ing") {
    const icons = []; e.got.forEach(x => { for (let i = 0; i < Math.min(3, x.n); i++) icons.push(ic(x.g, k, "big")); });
    for (let i = 0; i < Math.min(6, icons.length); i++) { const d = document.createElement("span"); d.className = "ssdrop" + (isFeast(k) ? " feast" : ""); d.innerHTML = icons[i];
      d.style.left = (38 + Math.random() * 24) + "%"; d.style.animationDelay = (i * 0.25) + "s"; scene.appendChild(d); setTimeout(() => d.remove(), 2600); }
    sfx(false);
  } else {
    const p = document.createElement("div"); p.className = "sspuff" + (isFeast(k) ? " feast" : "");
    p.innerHTML = isPotion(k) ? "<span>" + (e.fx ? effect(e.fx).icon : "✨") + "</span>" : isFeast(k) ? '<img src="assets/feast/' + DISHES[(e.n - 1) % DISHES.length].k + '.webp" alt="">' : "<span>" + k.icon + "</span>";
    scene.appendChild(p); setTimeout(() => p.remove(), 3200);
    const c = root.querySelector(".sscaul"); if (c) { c.classList.remove("brew"); void c.offsetWidth; c.classList.add("brew"); }
    sfx(true);
  }
  const rush = q.length > 6;   // lots of news at once (a big XP check): move faster
  setTimeout(() => { if (toast) toast.className = "sstoast"; setTimeout(nextMoment, rush ? 150 : 350); }, made ? (rush ? 2200 : 3400) : (rush ? 1100 : 2200));
}
let AC = null;
function sfx(big) {
  try { if (localStorage.getItem("ck-mute") === "1") return; AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const notes = big ? [784, 988, 1175, 1568] : [523, 659];
    notes.forEach((f, i) => { const t = AC.currentTime + i * 0.11, o = AC.createOscillator(), g = AC.createGain(); o.type = "triangle"; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35); o.connect(g).connect(AC.destination); o.start(t); o.stop(t + 0.4); });
  } catch (e) {}
}
