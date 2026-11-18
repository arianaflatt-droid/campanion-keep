/* ---------- 🫧 "Ava dove down to the Axolotl Kingdom!" on The Keep + Battle Area (Nov 16, Ms. Ariana) ----------
   Like the S.S. Duck rocket for Planet JP: the teacher's big screens (class view, Battle Area, the student screen tab)
   watch the class, and when a student finishes this week's submarine trip (kd.t goes 0 → 1 for this week) their duck
   submarine (with its paint, once Kingdom part 2 is on) splashes down across the screen. Several line up one after another.
   Nothing is saved; trips taken before the screen was opened don't play. */
import { esc, weekKey } from "./game.js?v=20261118d";
import { subImg, kd2On } from "./kingdom2.js?v=20261118d";

const seen = {}; let primed = false, q = [], busy = false, root = null;
const tripped = (s, w) => { const k = (s && s.kd) || {}; return k.w === w && k.t ? 1 : 0; };
export function kdDiveWatch(students, cls, active) {
  if (!cls || !students || !students.length) return;
  const w = weekKey(cls);
  students.forEach(s => {
    if (!s.companionId || s.isTeacher) return;
    const t = tripped(s, w);
    if (primed && seen[s.id] === 0 && t === 1 && active) q.push({ name: s.name || "A student", img: kd2On(cls) ? subImg(s) : "assets/kingdom/duck-sub.webp" });
    seen[s.id] = t;
  });
  primed = true;
  if (!active) q = [];
  if (!busy) next();
}
export function kdDiveTest(name, cls, st) { q.push({ name: name || "Test Student", img: cls && kd2On(cls) && st ? subImg(st) : "assets/kingdom/duck-sub.webp" }); if (!busy) next(); }

function blub() {
  try {
    const A = window.__ckAC || (window.__ckAC = new (window.AudioContext || window.webkitAudioContext)()), t0 = A.currentTime;
    [0, .18, .33, .5, .62].forEach((d, i) => { const o = A.createOscillator(), g = A.createGain(); o.type = "sine";
      o.frequency.setValueAtTime(380 + i * 90, t0 + d); o.frequency.exponentialRampToValueAtTime(900 + i * 120, t0 + d + .09);
      g.gain.setValueAtTime(.0001, t0 + d); g.gain.exponentialRampToValueAtTime(.12, t0 + d + .02); g.gain.exponentialRampToValueAtTime(.0001, t0 + d + .12);
      o.connect(g); g.connect(A.destination); o.start(t0 + d); o.stop(t0 + d + .14); });
  } catch (e) {}
}
function next() {
  const x = q.shift(); if (!x) { busy = false; return; }
  busy = true;
  if (!root) { root = document.createElement("div"); root.id = "kddive"; document.body.appendChild(root); }
  root.innerHTML = '<div class="kdv"><div class="kdvsea"><i></i><i></i></div><div class="kdvsplash"></div>' +
    '<div class="kdvbub">' + "<i></i>".repeat(10) + "</div>" +
    '<div class="kdvsub"><img src="' + esc(x.img) + '" alt="" onerror="this.src=\'assets/kingdom/duck-sub.webp\'"></div>' +
    '<div class="kdvmsg"><img class="kdvgate" src="assets/kingdom/kingdom-gate.webp" alt="" onerror="this.remove()"><span><b>' + esc(x.name) + "</b> dove down to the Axolotl Kingdom! \u{1FAE7}</span></div></div>";
  setTimeout(blub, 1500);
  setTimeout(() => { if (root) root.innerHTML = ""; setTimeout(next, 500); }, 5800);
}
