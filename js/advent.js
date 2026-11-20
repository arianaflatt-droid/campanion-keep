/* ---------- 🎄 December Advent Calendar (Nov 19, Ms. Ariana) ----------
   13 doors, one for each school day from Dec 1 to Dec 17 (winter break starts after the 17th). A door belongs to its day:
   when a student hits 120 XP AND closes all 3 rings (25 Math / Reading / Language, their own swaps) on that day, that
   day's door can be opened (any time in December, so XP that uploads the next morning still counts). Miss the day and
   that door stays frosted shut. The Daily Doors don't change.
   It counts the day from the XP history, so the console's ⭐ Full day and the single-ring buttons count too.
   Saved on the student: advent = { "2026-12-01": 1, ... } plus the prize fields (all student-writable, within the rules' limits).
   Shows on My Companion and as a Checklist step from Dec 1 to Dec 31. A teacher preview can try it early with ?advent=1. */
import { esc, goalXP } from "./game.js?v=20261119b";
import { azToday } from "./collect.js?v=20261119b";
import { ringDay, SUB_REQ } from "./doors.js?v=20261119w";
import { subFor } from "./teams.js?v=20261119b";
import { kdOf } from "./kingdom.js?v=20261120i";
import { planetNow } from "./safari.js?v=20261120i";

export const ADVENT_DAYS = ["2026-12-01", "2026-12-02", "2026-12-03", "2026-12-04", "2026-12-07", "2026-12-08", "2026-12-09", "2026-12-10", "2026-12-11",
  "2026-12-14", "2026-12-15", "2026-12-16", "2026-12-17"];
const A = "assets/advent/";
// what's behind each door (Ms. Ariana's list)
export const ADVENT_PRIZES = [
  { t: "25 presents", ic: "assets/xmas/ic-present.webp", give: { candy: 25 } },
  { t: "15 Stardust", ic: "⭐", give: { dust: 15 } },
  { t: "an egg", ic: "assets/egg-common.webp", give: { egg: 1 } },
  { t: "40 presents", ic: "assets/xmas/ic-present.webp", give: { candy: 40 } },
  { t: "80 Comfort Points", ic: "\u{1F6CF}️", give: { cp: 80 } },
  { t: "50 pearls", ic: "⚪", give: { pearl: 50 } },
  { t: "a Present Wheel spin", ic: "\u{1F3A1}", give: { spin: 1 } },
  { t: "50 presents + 25 XP", ic: "assets/xmas/ic-present.webp", give: { candy: 50, xp: 25 } },
  { t: "an egg", ic: "assets/egg-common.webp", give: { egg: 1 } },
  { t: "30 Stardust", ic: "⭐", give: { dust: 30 } },
  { t: "100 pearls", ic: "⚪", give: { pearl: 100 } },
  { t: "75 presents", ic: "assets/xmas/ic-present.webp", give: { candy: 75 } },
  { t: "a Legendary egg + the Advent Star badge", ic: "assets/egg-legendary.webp", give: { leg: 1 } }];

const preview = () => { try { return new URLSearchParams(location.search).get("advent") === "1"; } catch (e) { return false; } };
export const adventOn = () => { const d = azToday(); return (d >= "2026-12-01" && d <= "2026-12-31") || preview(); };
const opened = (st, date) => !!((st && st.advent) || {})[date];
// did this student earn that day's door? 120 XP (or a hand-marked hit) and all 3 rings closed
export function adventEarned(st, cls, date) {
  const h = ((st && st.xpHist) || {})[date]; if (!h) return false;
  const xp = Math.max(Number(h.d) || 0, Number(h.l) || 0);
  if (!(xp >= goalXP(cls) || h.h)) return false;
  const rd = ringDay(st, cls), sub = h.sub || {};
  return SUB_REQ.every(k => (Number(sub[subFor(cls, st, k)]) || 0) >= rd);
}
// "open" (done) | "ready" (earned, tap to open) | "today" (still to earn today) | "missed" | "soon"
export function adventState(st, cls, i) {
  const date = ADVENT_DAYS[i], today = azToday();
  if (opened(st, date)) return "open";
  if (adventEarned(st, cls, date)) return "ready";
  return date === today ? "today" : date < today ? "missed" : "soon";
}
export const adventReady = (st, cls) => adventOn() ? ADVENT_DAYS.filter((_, i) => adventState(st, cls, i) === "ready").length : 0;

const pic = (ic, cls) => /\.webp$|\.png$/.test(ic) ? '<img class="' + cls + '" src="' + ic + '" alt="">' : '<span class="' + cls + ' advemo">' + ic + "</span>";
const dayNum = d => Number(d.slice(8));
export function adventCard(st, cls) {
  if (!adventOn() || !st) return "";
  const n = ADVENT_DAYS.filter(d => opened(st, d)).length, ready = adventReady(st, cls);
  let h = '<div class="card adventcard"><div class="advboard"><h2 class="advtitle"><span>\u{1F384} Advent Calendar</span></h2>' +
    '<p class="advsub">Hit <b>' + goalXP(cls) + " XP</b> and close all <b>3 rings</b> to open that day’s door! · <b>" + n + " / " + ADVENT_DAYS.length + "</b> opened" + (ready ? " · \u{1F381} <b>" + ready + " ready!</b>" : "") + "</p>" +
    '<div class="advgrid">';
  ADVENT_DAYS.forEach((date, i) => {
    const s = adventState(st, cls, i), big = i === ADVENT_DAYS.length - 1, P = ADVENT_PRIZES[i];
    const img = s === "open" ? (big ? "door-star.webp" : "door-open.webp") : s === "missed" ? (big ? "door-star.webp" : "door-missed.webp") : big ? "door-star.webp" : "door-closed.webp";
    const tip = s === "open" ? "You got " + P.t + "!" : s === "ready" ? "Tap to open!" : s === "today" ? "Today’s door: hit " + goalXP(cls) + " XP and close your 3 rings" : s === "missed" ? "This day’s door stayed shut" : "Opens on Dec " + dayNum(date);
    h += '<button class="advdoor a-' + s + (big ? " big" : "") + '"' + (s === "ready" ? ' data-advent="' + date + '"' : " disabled") + ' title="' + esc(tip) + '" aria-label="Dec ' + dayNum(date) + ": " + esc(tip) + '">' +
      '<img class="advimg" src="' + A + img + '" alt="">' +
      (s === "open" ? pic(P.ic, "advprize") : '<span class="advnum">' + dayNum(date) + "</span>") +
      (s === "ready" ? '<span class="advgo">Open!</span>' : s === "today" ? '<span class="advtoday">Today</span>' : "") + "</button>";
  });
  return h + "</div></div></div>";
}

/* ---------- opening a door ---------- */
let C = null, busy = false;
export function adventSync(o) { C = o; if (!adventSync.on) { adventSync.on = true; document.addEventListener("click", onClick); } }
async function onClick(ev) {
  const b = ev.target.closest && ev.target.closest("[data-advent]"); if (!b || busy || !C || !C.st) return;
  const date = b.dataset.advent, i = ADVENT_DAYS.indexOf(date), st = C.st, cls = C.cls;
  if (i < 0 || adventState(st, cls, i) !== "ready") return;
  const P = ADVENT_PRIZES[i], g = P.give, data = { advent: Object.assign({}, st.advent || {}, { [date]: 1 }) };
  if (g.candy) data.candyBonus = (Number(st.candyBonus) || 0) + g.candy;
  if (g.egg) data.doorEggs = (Number(st.doorEggs) || 0) + g.egg;
  if (g.leg) data.legendaryPulls = (Number(st.legendaryPulls) || 0) + g.leg;
  if (g.cp) data.cpBonus = (Number(st.cpBonus) || 0) + g.cp;
  if (g.spin) data.spins = (Number(st.spins) || 0) + g.spin;
  if (g.xp) data.doorXP = (Number(st.doorXP) || 0) + g.xp;
  if (g.pearl) { const k = kdOf(st, cls); k.p = (Number(k.p) || 0) + g.pearl; data.kd = k; }
  if (g.dust) { let pl; try { pl = planetNow(); } catch (e) { pl = null; } if (!pl || !Object.keys(pl).length) pl = JSON.parse(JSON.stringify(st.planet || {}));
    pl.dust = (Number(pl.dust) || 0) + g.dust; pl.sv = (Number(pl.sv) || 0) + 1; data.planet = pl; }
  busy = true; b.classList.add("opening");
  try { if (!C.preview && C.patch) await C.patch(data); Object.assign(st, data); show(i); }
  catch (e) { alert("That door didn’t open — ask Ms. Ariana. (" + (e.code || e.message) + ")"); }
  busy = false; if (C.render) C.render();
}
function show(i) {
  const P = ADVENT_PRIZES[i], d = ADVENT_DAYS[i], big = i === ADVENT_DAYS.length - 1, o = document.createElement("div");
  o.className = "prizeover advpop"; o.setAttribute("role", "dialog");
  o.innerHTML = '<div class="prizebox advbox' + (big ? " big" : "") + '"><h2>' + (big ? "\u{1F31F} The big door! \u{1F31F}" : "\u{1F384} Door " + (i + 1) + " · Dec " + dayNum(d)) + "</h2>" +
    '<div class="advreveal"><img class="advrdoor" src="' + A + (big ? "door-star.webp" : "door-open.webp") + '" alt="">' + pic(P.ic, "advrprize") + "</div>" +
    "<p class=\"advwon\">You got <b>" + esc(P.t) + "</b>!</p>" + '<button class="attackbtn" data-advclose="1">Yay! \u{1F389}</button></div>';
  o.addEventListener("click", e => { if (e.target.closest("[data-advclose]") || e.target === o) o.remove(); });
  document.body.appendChild(o);
}
