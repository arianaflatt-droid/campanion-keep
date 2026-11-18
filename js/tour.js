/* 🧭 New-student tour (Nov 18, Ms. Ariana): right after a new student picks their starter, a short step-by-step tour
   shows each part of the Keep. It lights up one thing at a time (it opens that tab too) with a note and Next / Back / Skip.
   It runs on its own layer (#tourroot), so page redraws don't stop it; it finds its target again every few moments.
   Who sees it: students with `joined` (set when they pick their starter) and no `tutDone`. Finishing or skipping saves tutDone: true
   (one write). A teacher preview can try it with ?tour=1 (nothing is saved). */
import { esc } from "./game.js?v=20261118e";

let T = null;   // { i, steps, done, poll }
const STEPS = (s, has) => {
  const nm = esc(s.petName || "your companion");
  return [
    { tab: ["pet"], sel: ".mypet", t: "\u{1F3F0} Welcome to the Keep!", b: "This is <b>" + nm + "</b>, your companion! Keep " + nm + " healthy by earning <b>120 XP</b> every school day. 120 XP and your rings (25 Math, 25 Reading, 25 Language) also fill " + nm + "’s level bar." },
    { tab: ["check"], sel: ".maintabs .tab.on", t: "✅ Your Checklist", b: "Start here every morning. It shows what to do today. Tap a step to go do it, and done steps disappear!" },
    { tab: ["pet"], sel: ".vaultcard", t: "\u{1F48E} The Treasure Vault", b: "Earn <b>600 XP in one week</b> and close your rings to open the Treasure Vault. You pick the prize inside!" },
    has.kd ? { tab: null, sel: '.maintabs [data-tab="kd"]', t: "\u{1F30A} The Axolotl Kingdom", b: "Reach your weekly goal and the Kingdom opens until Sunday night. Dive for pearls, rank up and explore!" } : null,
    { tab: ["morning", "quest"], sel: ".maintabs .tab.on", t: "\u{1F392} Adventures", b: "<b>Morning Quests</b> give bonus prizes for XP before 8:15, and your <b>Grade Level Quest</b> has battles when you pass tests." },
    { tab: ["collect"], sel: ".maintabs .tab.on", t: "\u{1F95A} Creature Collector", b: "Every <b>120 XP</b> day hatches an egg. Collect hundreds of creatures, level them up and battle with them!" },
    { tab: ["room"], sel: ".maintabs .tab.on", t: "\u{1F6CF}️ My Room", b: "Decorate " + nm + "’s room! Every full-health day earns <b>80 Comfort Points</b> to spend in the shops." },
    { tab: ["pass", "badges", "hof"], sel: ".maintabs .tab.on", t: "\u{1F3C6} Trophies", b: "Season Pass rewards, badges to collect and pin, and the class <b>Hall of Fame</b>." },
    { tab: ["check"], sel: null, t: "\u{1F389} You’re all set!", b: "This week you’re <b>excused</b> while you get set up and take your tests, so " + nm + " stays safe. Your teacher will send you to <b>Planet JP</b> and the <b>Kingdom</b> when it’s time. Have fun!" }
  ].filter(Boolean);
};

export function tourWanted(s, preview) {
  if (preview) { try { return new URLSearchParams(location.search).get("tour") === "1"; } catch (e) { return false; } }
  return !!(s && s.companionId && s.joined && !s.tutDone);
}
// called after every page draw: starts the tour once (it keeps itself up to date after that)
export function tourSync(s, opt) {
  if (T || !tourWanted(s, opt.preview) || document.body.classList.contains("kdmode") || document.body.classList.contains("pjmode")) return;
  T = { i: 0, steps: STEPS(s, { kd: !!document.querySelector('.maintabs [data-tab="kd"]') }), opt, preview: opt.preview };
  const root = document.createElement("div"); root.id = "tourroot"; root.innerHTML = '<div class="tourspot"></div><div class="tourbub"></div>'; document.body.appendChild(root); document.body.classList.add("touring");
  root.addEventListener("click", ev => { const b = ev.target.closest("[data-tour]"); if (!b) return; const a = b.dataset.tour;
    if (a === "next") go(T.i + 1); else if (a === "back") go(T.i - 1); else end(); });
  T.poll = setInterval(place, 300); addEventListener("resize", place); addEventListener("scroll", place, { passive: true });
  go(0);
}
function curTab() { const on = document.querySelector(".maintabs .tab.on"); return on ? on.dataset.tab : ""; }
function go(i) {
  if (!T) return; if (i >= T.steps.length) return end(); T.i = Math.max(0, i);
  const st = T.steps[T.i];
  if (st.tab && !st.tab.includes(curTab())) {   // open that tab (its button in the tab bar)
    const b = st.tab.map(k => document.querySelector('.maintabs [data-tab="' + k + '"]')).find(Boolean); if (b) b.click(); }
  const bub = document.querySelector("#tourroot .tourbub"), last = T.i === T.steps.length - 1;
  bub.innerHTML = '<small>' + (T.i + 1) + " of " + T.steps.length + "</small><h3>" + st.t + "</h3><p>" + st.b + '</p><div class="tourbtns">' +
    (T.i ? '<button class="btn ghost small" data-tour="back">← Back</button>' : '<button class="btn ghost small" data-tour="skip">Skip the tour</button>') +
    '<button class="btn gold" data-tour="next">' + (last ? "\u{1F680} Let’s go!" : "Next →") + "</button></div>";
  T.scrolled = false; setTimeout(place, 60); setTimeout(place, 400);
}
function place() {
  if (!T) return; const root = document.getElementById("tourroot"); if (!root) return;
  const st = T.steps[T.i], el = st.sel && document.querySelector(st.sel), spot = root.querySelector(".tourspot"), bub = root.querySelector(".tourbub");
  if (!el) { spot.style.cssText = "left:50%;top:40%;width:0;height:0;"; bub.style.cssText = "left:50%;top:50%;transform:translate(-50%,-50%);"; return; }
  if (!T.scrolled) { T.scrolled = true; el.scrollIntoView({ block: el.offsetHeight > innerHeight * 0.6 ? "start" : "center", behavior: "smooth" }); }
  const r = el.getBoundingClientRect(), pad = 8, h = Math.min(r.height, innerHeight * 0.62);
  spot.style.cssText = "left:" + (r.left - pad) + "px;top:" + (r.top - pad) + "px;width:" + (r.width + pad * 2) + "px;height:" + (h + pad * 2) + "px;";
  const bw = Math.min(380, innerWidth - 24), below = r.top + h + pad + 16, bh = bub.offsetHeight || 180;
  const top = below + bh < innerHeight - 8 ? below : Math.max(8, r.top - pad - 16 - bh);
  const left = Math.max(12, Math.min(innerWidth - bw - 12, r.left + r.width / 2 - bw / 2));
  bub.style.cssText = "left:" + left + "px;top:" + (top + bh > innerHeight ? Math.max(8, innerHeight - bh - 8) : top) + "px;width:" + bw + "px;";
}
function end() {
  if (!T) return; clearInterval(T.poll); removeEventListener("resize", place); removeEventListener("scroll", place);
  const r = document.getElementById("tourroot"); if (r) r.remove(); document.body.classList.remove("touring");
  const o = T.opt; T = { done: true };   // stays "done" for this page load
  if (!o.preview && o.patch) o.patch({ tutDone: true }).catch(() => {});
  const b = document.querySelector('.maintabs [data-tab="check"]'); if (b) b.click();
}
