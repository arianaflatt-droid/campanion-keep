/* ---------- 🧭 Planet JP mission log + map "!" marks (Nov 9) ----------
   Everything here is read from data the app already saves, so the marks and ticks add no database writes.
   Required missions (each is free to do):  ☕ cook a snack in the Space Café · 📸 take a safari photo · 🦒 finish the zoo tour (only once the student
   has photographed an animal, so there is something in the zoo).  Optional: 🛍️ a Swap Shop deal is waiting (never required: buying costs Stardust).
   All required done = a "Claim +5 ⭐" button (ONE save: planet.ml = { d: date claimed, n: days claimed }; it was planet.mb before Nov 12).
   The map shows a bouncing "!" on a place while it has something to do today (placeBang).  */
import { azToday } from "./collect.js?v=20261113g";
import { freshSt, planetSave, planetNow, planetCtx, filmLeft } from "./safari.js?v=20261113g";
import { zooPicks } from "./zoo.js?v=20261113g";
import { swapDeal } from "./spaceshop.js?v=20261113g";
import { careDone, hasNebble } from "./petpark.js?v=20261113g";
import { boardWaiting, boardLeft } from "./board.js?v=20261113g";

export const MISSION_BONUS = 5;
const plOf = st => (st && st.planet) || {};
const today = () => azToday();
export const cafeDone = st => (plOf(st).cf || {}).d === today();
export const safariDone = st => { const s = plOf(st).saf || {}; return s.d === today() && Number(s.u) > 0; };
export const zooHas = st => zooPicks(st, today()).length > 0;
export const zooDone = st => (plOf(st).zoo || {}).d === today();
// Nov 12: the claim moved from planet.mb to planet.ml (the Moon Base uses planet.mb). An old { d, n } claim from today still counts.
const logClaimed = st => { const p = plOf(st), o = p.mb || {}; return (p.ml || {}).d === today() || (o.d === today() && !o.own); };
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
  // 🛰️ Nov 9: a spacey "mission log" console panel (Planet JP mode puts it in the side space)
  st = freshSt(st); const list = missionList(st), left = list.filter(x => !x.done).length, claimed = logClaimed(st), done = list.length - left;
  const d = new Date(), stamp = "STARDATE " + d.getFullYear() + "." + String(Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5)).padStart(3, "0");
  let h = '<div class="mlog"><div class="mloghead"><span class="mlogdot"></span><b>MISSION LOG</b><span class="mlogstamp">' + stamp + "</span></div>" +
    '<div class="mlogbar">' + list.map(x => '<i class="' + (x.done ? "on" : "") + '"></i>').join("") + '</div><div class="mlogcount">' + (left ? done + " / " + list.length + " COMPLETE" : "ALL MISSIONS COMPLETE") + "</div>" +
    '<ul class="mloglist">' + list.map(x => '<li class="' + (x.done ? "done" : "") + '"><span class="mlogbox">' + (x.done ? "\u2713" : "") + '</span><span class="mlogtxt">' + x.icon + " " + x.text + "</span>" +
      (x.done || !open ? "" : '<button class="mloggo" data-pjzone="' + x.go + '">GO \u25B8</button>') + "</li>").join("");
  if (swapWaiting(st)) h += '<li class="opt"><span class="mlogbox opt">\u2726</span><span class="mlogtxt">\u{1F6CD}\uFE0F Swap Shop deal waiting <small>(optional)</small></span>' + (open ? '<button class="mloggo" data-pjzone="swap">LOOK \u25B8</button>' : "") + "</li>";
  h += "</ul>";
  // 📋 Nov 12: the Mission Board (3 daily missions, each pays its own Stardust)
  { const w = boardWaiting(st), l = boardLeft(st);
    h += '<button class="mlogboard" data-pjzone="board"><span>\u{1F4CB} <b>MISSION BOARD</b><small>' + (w ? w + " ready to claim!" : l ? l + " mission" + (l === 1 ? "" : "s") + " left today" : "All done today \u2713") + "</small></span>" + (w ? '<i class="mlogbang">!</i>' : "") + "<em>\u25B8</em></button>"; }
  if (!left) h += claimed ? '<p class="mlogdone">\u2605 REWARD RECEIVED: +' + MISSION_BONUS + " \u2B50</p>"
    : '<button class="mlogclaim" data-msclaim="1">\u25B6 CLAIM +' + MISSION_BONUS + " \u2B50 STARDUST</button>";
  else h += '<p class="mlognote">Finish all for <b>+' + MISSION_BONUS + ' \u2B50</b>. A red <b>!</b> on the map = still to do.</p>';
  return h + "</div>";
}

if (typeof document !== "undefined") document.addEventListener("click", ev => {
  const b = ev.target.closest && ev.target.closest("[data-msclaim]"); if (!b) return;
  const c = planetCtx(); if (!c || !c.st) return;
  const st = freshSt(c.st), pl = planetNow(), d = today();
  if (logClaimed(st) || missionList(st).some(x => !x.done)) return;
  pl.ml = { d, n: (Number((pl.ml || {}).n) || 0) + 1 }; pl.dust = (Number(pl.dust) || 0) + MISSION_BONUS;
  planetSave(pl); if (c.rerender) c.rerender();
});
