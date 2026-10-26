/* ---------- 🐾 Bonding meter ----------
   Once a day (Arizona date) a student can pet their companion: +1 friendship heart.
   5 hearts = 1 friendship level. Each level unlocks a new trick (a button that makes the companion move).
   Saved on the student: bond = { n: total pets, last: "YYYY-MM-DD" }. Hearts stay if the companion changes.
   The companion also shows a mood (sleepy, wants a pet, happy, proud, missed you). No XP and no badges. */
import { esc, BOND_HEARTS, bondLevel, bondHearts } from "./game.js?v=20261020u";
import { azToday, azNow } from "./collect.js?v=20261020u";

// The trick each friendship level unlocks
export const BOND_UNLOCKS = [
  { lv: 1, kind: "trick", id: "wave", icon: "\u{1F44B}", name: "Wave" },
  { lv: 2, kind: "trick", id: "spin", icon: "\u{1F300}", name: "Spin" },
  { lv: 3, kind: "trick", id: "dance", icon: "\u{1F483}", name: "Dance" },
  { lv: 4, kind: "trick", id: "flip", icon: "\u{1F938}", name: "Backflip" },
  { lv: 5, kind: "trick", id: "sparkle", icon: "\u2728", name: "Sparkle Burst" }
];
export const BOND_MAX = BOND_UNLOCKS[BOND_UNLOCKS.length - 1].lv;
const daysBetween = (a, b) => Math.round((new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / 864e5);
export const pettedToday = s => ((s && s.bond) || {}).last === azToday();
export const tricksFor = s => BOND_UNLOCKS.filter(u => u.kind === "trick" && bondLevel(s) >= u.lv);

// Today's mood: missed you (3+ days without a pet) > proud (hit the goal today) > happy (petted) > sleepy (before 8am) > wants a pet
export function bondMood(s, goal, date) {
  const b = (s && s.bond) || {}, today = azToday(date), h = ((s && s.xpHist) || {})[today] || {};
  const xp = Math.max(Number(h.d) || 0, Number(h.l) || 0, Number(h.mo) || 0), t = azNow(date);
  if (b.last !== today && b.last && daysBetween(b.last, today) >= 3) return { key: "missed", face: "\u{1F97A}", text: "I missed you! Can I have a pet?" };
  if (xp >= goal) return { key: "proud", face: "\u{1F929}", text: "You hit " + goal + " XP today! I’m SO proud of you!" };
  if (b.last === today) return { key: "happy", face: "\u{1F970}", text: "That was the best! See you tomorrow!" };
  if (t.h < 8) return { key: "sleepy", face: "\u{1F634}", text: "Zzz… pet me to wake me up!" };
  return { key: "wants", face: "\u{1F642}", text: "Hi! Can I have a pet today?" };
}
export const moodBubble = (s, goal) => { const m = bondMood(s, goal); return '<div class="moodbub mood-' + m.key + '"><span>' + m.face + "</span> " + esc(m.text) + "</div>"; };

// The friendship part of the My Companion card: hearts, Pet button, tricks
export function bondHTML(s, name) {
  const lv = bondLevel(s), hearts = bondHearts(s), maxed = lv >= BOND_MAX, done = pettedToday(s);
  const next = BOND_UNLOCKS.find(u => u.lv > lv), tricks = tricksFor(s);
  return '<div class="bond">' +
    '<div style="font-weight:700;">\u{1F49E} Friendship level ' + lv + (maxed ? " · Best friends!" : "") + "</div>" +
    '<div class="bondhearts" title="Pet your companion once a day to fill a heart">' + Array.from({ length: BOND_HEARTS }, (_, i) => '<i class="' + (maxed || i < hearts ? "on" : "") + '">' + (maxed || i < hearts ? "❤️" : "\u{1F90D}") + "</i>").join("") + "</div>" +
    '<div class="muted small">' + (maxed ? "Every trick is unlocked! Keep petting " + esc(name) + " every day." : next ? (BOND_HEARTS - hearts) + " more pet" + (BOND_HEARTS - hearts === 1 ? "" : "s") + " to level " + next.lv + ": " + next.icon + " " + esc(next.name) + " (trick)" : "") + "</div>" +
    '<button class="btn bondpet" data-bondpet="1"' + (done ? " disabled" : "") + ">" + (done ? "✅ You pet " + esc(name) + " today" : "\u{1F43E} Pet " + esc(name)) + "</button>" +
    (tricks.length ? '<div class="bondtricks"><span class="small muted">Tricks:</span>' + tricks.map(u => '<button class="btn ghost small" data-trick="' + u.id + '">' + u.icon + " " + esc(u.name) + "</button>").join("") + "</div>" : "") +
    "</div>";
}

// Plays a trick on the companion on screen (nothing is saved)
export function playTrick(id) {
  const w = document.querySelector(".mypet .petwrap"); if (!w) return;
  w.classList.remove("tr-wave", "tr-spin", "tr-dance", "tr-flip", "tr-sparkle"); void w.offsetWidth;
  w.classList.add("tr-" + id);
  if (id === "sparkle") burst(w, ["✨", "⭐", "\u{1F31F}"]);
  setTimeout(() => w.classList.remove("tr-" + id), 1600);
}
// Little hearts/stars that float up from the companion
export function burst(w, icons) {
  w = w || document.querySelector(".mypet .petwrap"); if (!w) return;
  const r = w.getBoundingClientRect();   // on <body> so a re-render of the page doesn't remove them
  for (let i = 0; i < 8; i++) {
    const p = document.createElement("span"); p.className = "bondfly"; p.textContent = icons[i % icons.length];
    p.style.left = (r.left + r.width * (0.1 + Math.random() * 0.8)) + "px"; p.style.top = (r.top + r.height * 0.5) + "px"; p.style.animationDelay = (i * 0.08) + "s";
    document.body.appendChild(p); setTimeout(() => p.remove(), 2000);
  }
}
export const unlockAt = lv => BOND_UNLOCKS.find(u => u.lv === lv) || null;
