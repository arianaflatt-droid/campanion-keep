/* ---------- 🧭 Planet JP mission log + map "!" marks (Nov 9) ----------
   Everything here is read from data the app already saves, so the marks and ticks add no database writes.
   Required missions (each is free to do):  ☕ cook a snack in the Space Café · 📸 take a safari photo · 🦒 finish the zoo tour (only once the student
   has photographed an animal, so there is something in the zoo).  Optional: 🛍️ a Swap Shop deal is waiting (never required: buying costs Stardust).
   All required done = a "Claim +5 ⭐" button (ONE save: planet.mb = { d: date claimed, n: days claimed }).
   The map shows a bouncing "!" on a place while it has something to do today (placeBang).  */
import { azToday } from "./collect.js?v=20261109h";
import { freshSt, planetSave, planetNow, planetCtx, filmLeft } from "./safari.js?v=20261109h";
import { zooPicks } from "./zoo.js?v=20261109h";
import { swapDeal } from "./spaceshop.js?v=20261109h";
import { careDone, hasNebble } from "./petpark.js?v=20261109h";

export const MISSION_BONUS = 5;
const plOf = st => (st && st.planet) || {};
const today = () => azToday();
const cafeDone = st => (plOf(st).cf || {}).d === today();
const safariDone = st => { const s = plOf(st).saf || {}; return s.d === today() && Number(s.u) > 0; };
const zooHas = st => zooPicks(st, today()).length > 0;
const zooDone = st => (plOf(st).zoo || {}).d === today();
const swapWaiting = st => { try { const d = swapDeal(st); return !!d && !d.got; } catch (e) { return false; } };

// which places show a "!" right now
export function placeBang(st, k) {
  st = freshSt(st); if (!st) return false;
  if (k === "cafe") return !cafeDone(st);
  if (k === "safari") return !safariDone(st) && filmLeft(st) > 0;
  if (k === "zoo") return zooHas(st) && !zooDone(st);
  if (k === "swap") return swapWaiting(st);
  if (k === "park") return hasNebble(st) && !careDone(st);
  return false;
}

export function missionList(st) {
  st = freshSt(st);
  const m = [
    { k: "cafe", icon: "\u2615", text: "Cook a snack in the Space Caf\u00e9", done: cafeDone(st), go: "cafe" },
    { k: "safari", icon: "\u{1F4F8}", text: "Take a photo on the Safari", done: safariDone(st), go: "landing" }];
  if (zooHas(st)) m.push({ k: "zoo", icon: "\u{1F992}", text: "Finish your Space Zoo tour", done: zooDone(st), go: "zoo" });
  if (hasNebble(st)) m.push({ k: "park", icon: "\u{1F333}", text: "Care for your Nebble at the Pet Park", done: careDone(st), go: "park" });
  return m;
}

export function missionsHTML(st, open) {
  st = freshSt(st); const list = missionList(st), left = list.filter(x => !x.done).length, claimed = (plOf(st).mb || {}).d === today();
  let h = '<div class="card pjmissions"><div class="card-head"><h2>\u{1F9ED} Today\u2019s missions</h2><span class="fact">' + (left ? list.length - left + " of " + list.length + " done" : "all done! \u{1F389}") + "</span></div>" +
    '<ul class="pjmlist">' + list.map(x => '<li class="' + (x.done ? "done" : "") + '"><span class="pjmtick">' + (x.done ? "\u2705" : "\u2B1C") + "</span><span>" + x.icon + " " + x.text + "</span>" +
      (x.done || !open ? "" : '<button class="btn small ghost" data-pjzone="' + x.go + '">Go \u279C</button>') + "</li>").join("");
  if (swapWaiting(st)) h += '<li class="opt"><span class="pjmtick">\u2728</span><span>\u{1F6CD}\uFE0F A Swap Shop deal is waiting <small class="muted">(optional)</small></span>' + (open ? '<button class="btn small ghost" data-pjzone="swap">Look \u279C</button>' : "") + "</li>";
  h += "</ul>";
  if (!left) h += claimed ? '<p class="pjmdone">\u{1F31F} Mission complete! You got <b>+' + MISSION_BONUS + " \u2B50</b> today.</p>"
    : '<div class="row" style="justify-content:center;margin-top:6px;"><button class="btn gold" data-msclaim="1">\u{1F389} Mission complete! Claim +' + MISSION_BONUS + " \u2B50</button></div>";
  else h += '<p class="small muted" style="margin:6px 0 0;">Finish them all for <b>+' + MISSION_BONUS + " \u2B50</b>. Places with a red <b>!</b> on the map still need a visit.</p>";
  return h + "</div>";
}

if (typeof document !== "undefined") document.addEventListener("click", ev => {
  const b = ev.target.closest && ev.target.closest("[data-msclaim]"); if (!b) return;
  const c = planetCtx(); if (!c || !c.st) return;
  const st = freshSt(c.st), pl = planetNow(), d = today();
  if ((pl.mb || {}).d === d || missionList(st).some(x => !x.done)) return;
  pl.mb = { d, n: (Number((pl.mb || {}).n) || 0) + 1 }; pl.dust = (Number(pl.dust) || 0) + MISSION_BONUS;
  planetSave(pl); if (c.rerender) c.rerender();
});
