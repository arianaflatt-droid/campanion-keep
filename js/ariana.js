/* ---------- 👽 Hidden Alien Ms. Ariana (Nov 12) ----------
   Once a day she hides on ONE random Planet JP page (the same page for the whole class that day, picked from the date).
   She peeks in from the side of the screen. Tap her: she jumps out, "You found me!", +10 Stardust, once a day.
   Only while Planet JP is open for the student. Saved: planet.af = the date she was found (one write, through planetSave). */
import { azToday } from "./collect.js?v=20261113h";
import { planetNow, planetSave, planetCtx } from "./safari.js?v=20261113h";

export const ARIANA_DUST = 10;
// pages every student can reach (zones that unlock later are left out so it's fair)
export const ARIANA_PAGES = [["", "the Planet JP map"], ["album", "the Photo Album"], ["landing", "Landing Bay"], ["cafe", "the Space Café"], ["safari", "the Safari Shop"],
  ["shop", "the Space Shop"], ["swap", "the Swap Shop"], ["zoo", "the Space Zoo"], ["adopt", "the Adoption Center"], ["park", "the Pet Park"], ["hangar", "the Duck Hangar"], ["station", "the Space Station"], ["moon", "the Moon Base"]];
function hash01(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } h ^= h >>> 15; h = Math.imul(h, 2246822507); h ^= h >>> 13; return (h >>> 0) / 4294967296; }
export function arianaToday(d) {
  d = d || azToday(); const i = Math.floor(hash01("ariana|" + d) * ARIANA_PAGES.length), r = hash01("spot|" + d);
  return { page: ARIANA_PAGES[i][0], name: ARIANA_PAGES[i][1], side: r < 0.5 ? "left" : "right", top: 22 + Math.round(hash01("top|" + d) * 50) };
}
export const foundToday = st => !!(st && st.planet && st.planet.af === azToday());

let pop = false;
const rer = () => { const c = planetCtx(); if (c && c.rerender) c.rerender(); };
function found() {
  const c = planetCtx(); if (!c || !c.st || foundToday(c.st)) return;
  const p = planetNow(); p.af = azToday(); p.dust = (Number(p.dust) || 0) + ARIANA_DUST; planetSave(p);
  pop = true; rer();
}
if (typeof document !== "undefined") document.addEventListener("click", ev => {
  const t = ev.target.closest && ev.target.closest("[data-ariana]"); if (!t) return;
  if (t.dataset.ariana === "find") found(); else { pop = false; rer(); }
});

// called at the end of every Planet JP page; zone = the page that's open ("" = the map)
export function arianaHTML(st, zone, open, preview) {
  if (pop) return '<div class="arpop" data-ariana="ok"><div class="arbox"><img src="assets/planet/alien-ariana-found.webp" alt="Alien Ms. Ariana"><h2>\u{1F47D} You found me!</h2><p><b>+' + ARIANA_DUST + " ⭐ Stardust!</b> I hide somewhere new on Planet JP every day. See you tomorrow!" + (preview ? " (Preview: nothing was saved.)" : "") + '</p><button class="btn gold">Yay! \u{1F389}</button></div></div>';
  const a = arianaToday();
  if ((zone || "") !== a.page || !(open || preview) || foundToday(st)) return "";
  return '<button class="arpeek ' + a.side + '" data-ariana="find" style="top:' + a.top + '%" title="Who is that?" aria-label="Someone is hiding here!"><img src="assets/planet/alien-ariana-peek.webp" alt=""></button>';
}
