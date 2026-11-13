/* ---------- 📋 Planet JP Mission Board (Nov 12) ----------
   3 missions a day on the board in Mission Control (open it from the Mission Log). Each one pays its own Stardust.
   Missions are picked from the date (a new set every day). The ones a student can't do yet are skipped
   (the zoo tour needs a photographed animal, the Pet Park needs a Nebble).
   Every check reads data the app already saves, so the board adds NO reads. Claiming a finished mission = ONE save:
   planet.ms = { d: today, c: { missionKey: 1 } }, plus the Stardust (through safari.js planetSave). */
import { esc } from "./game.js?v=20261113h";
import { azToday } from "./collect.js?v=20261113h";
import { freshSt, planetSave, planetNow, planetCtx } from "./safari.js?v=20261113h";
import { cafeDone, safariDone, zooHas, zooDone } from "./missions.js?v=20261113h";
import { careDone, hasNebble } from "./petpark.js?v=20261113h";

const B = "assets/planet/board/";
const plOf = st => (st && st.planet) || {};
const today = () => azToday();
export const BOARD_N = 3;
export const BOARD = [
  { k: "launch", icon: "\u{1F680}", text: "Launch your rocket to Planet JP", pay: 10, go: "", done: st => plOf(st).last === today() },
  { k: "cafe", icon: "☕", text: "Cook a snack in the Space Café", pay: 5, go: "cafe", done: st => cafeDone(st) },
  { k: "safari", icon: "\u{1F4F8}", text: "Take a photo on a Creature Safari", pay: 5, go: "landing", done: st => safariDone(st) },
  { k: "zoo", icon: "\u{1F992}", text: "Finish a Space Zoo tour", pay: 5, go: "zoo", done: st => zooDone(st), can: st => zooHas(st) },
  { k: "park", icon: "\u{1F333}", text: "Take care of your Nebble at the Pet Park", pay: 5, go: "park", done: st => careDone(st), can: st => hasNebble(st) },
  { k: "moon", icon: "\u{1F319}", text: "Do an activity inside your Moon Base", pay: 6, go: "moon", done: st => Object.values((plOf(st).mb || {}).in || {}).includes(today()) },
  { k: "ariana", icon: "\u{1F47D}", text: "Find Alien Ms. Ariana hiding on Planet JP", pay: 8, go: "", done: st => plOf(st).af === today() }];
const BY = {}; BOARD.forEach(m => { BY[m.k] = m; });

function hash01(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } h ^= h >>> 15; h = Math.imul(h, 2246822507); h ^= h >>> 13; return (h >>> 0) / 4294967296; }
// today's 3 missions for this student (the order is mixed by the date; missions they can't do yet are left out)
export function boardToday(st, d) {
  st = freshSt(st); d = d || today();
  return BOARD.filter(m => !m.can || m.can(st)).map(m => ({ m, r: hash01("board|" + d + "|" + m.k) })).sort((a, b) => a.r - b.r).slice(0, BOARD_N).map(x => x.m);
}
const claimedOf = st => { const s = plOf(st).ms || {}; return s.d === today() ? s.c || {} : {}; };
// how many of today's missions are finished but not claimed yet (for the "!" on the Mission Log button)
export function boardWaiting(st) { st = freshSt(st); const c = claimedOf(st); return boardToday(st).filter(m => !c[m.k] && m.done(st)).length; }
export function boardLeft(st) { st = freshSt(st); const c = claimedOf(st); return boardToday(st).filter(m => !c[m.k]).length; }

let pop = null;   // the "Mission complete!" card after a claim
const rer = () => { const c = planetCtx(); if (c && c.rerender) c.rerender(); };
function claim(k) {
  const c = planetCtx(); if (!c || !c.st) return;
  const st = freshSt(c.st), m = BY[k]; if (!m || !boardToday(st).includes(m) || claimedOf(st)[k] || !m.done(st)) return;
  const p = planetNow(), old = p.ms && p.ms.d === today() ? p.ms.c || {} : {};
  p.ms = { d: today(), c: Object.assign({}, old, { [k]: 1 }) }; p.dust = (Number(p.dust) || 0) + m.pay;
  planetSave(p); pop = { m, preview: !!c.preview }; rer();
}
if (typeof document !== "undefined") document.addEventListener("click", ev => {
  const t = ev.target.closest && ev.target.closest("[data-mbclaim],[data-mbok]"); if (!t) return;
  if (t.dataset.mbclaim) claim(t.dataset.mbclaim); else { pop = null; rer(); }
});

export function boardHTML(st, open) {
  st = freshSt(st); const list = boardToday(st), c = claimedOf(st), got = list.filter(m => c[m.k]).length;
  const earned = list.filter(m => c[m.k]).reduce((a, m) => a + m.pay, 0), total = list.reduce((a, m) => a + m.pay, 0);
  let h = '<div class="card mbcard"><div class="card-head"><h2>\u{1F4CB} Mission Board</h2><span class="fact">' + got + " / " + list.length + " done · ⭐ " + earned + " / " + total + "</span></div>" +
    '<p class="lede" style="font-size:14px;margin:0 0 8px;">Commander JP posts <b>3 new missions every day</b>. Finish one, then tap <b>Claim</b> for its Stardust!</p>' +
    '<div class="mboard" style="background-image:url(' + B + 'mission-board.webp)">';
  list.forEach((m, i) => {
    const claimed = !!c[m.k], done = claimed || m.done(st);
    h += '<div class="mbslot s' + i + (claimed ? " got" : done ? " ready" : "") + '"><span class="mbicon">' + m.icon + '</span><b class="mbtext">' + esc(m.text) + '</b><span class="mbpay">+' + m.pay + " ⭐</span>" +
      (claimed ? '<img class="mbstamp" src="' + B + 'stamp-360.webp" alt="Mission complete">'
        : done ? (open ? '<button class="btn gold small mbbtn" data-mbclaim="' + m.k + '">⭐ Claim</button>' : '<span class="mbnote">Done! Claim it while Planet JP is open.</span>')
        : m.k === "ariana" ? '<span class="mbnote">Look on every page! She peeks in from the side.</span>'
        : m.k === "launch" ? '<span class="mbnote">Earn your XP and fill your tanks, then launch!</span>'
        : open ? '<button class="btn small mbbtn" data-pjzone="' + m.go + '">GO ▸</button>' : "") + "</div>";
  });
  h += "</div>" + (got === list.length && list.length ? '<p class="mblall">\u{1F31F} <b>Every mission done today!</b> New missions tomorrow, Captain.</p>' : "") + "</div>";
  if (pop) h += '<div class="mbpop" data-mbok="1"><div class="mbpopcard" style="background-image:url(' + B + 'mission-card.webp)"><img class="mbpopstamp" src="' + B + 'stamp.webp" alt="">' +
    "<p>" + pop.m.icon + " " + esc(pop.m.text) + '</p><b class="mbpopdust">+' + pop.m.pay + " ⭐ Stardust!</b>" + (pop.preview ? '<small>Preview: nothing was saved.</small>' : "") + '<button class="btn gold">Yay! \u{1F389}</button></div></div>';
  return h;
}
