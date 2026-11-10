/* ---------- 🕵️ Secret Students (Nov 2026) ----------
   Every school day (Mon–Fri, not a cls.offDays day) 3 Secret Students are picked at random with fair rotation, each with
   their own secret mission:
     🎯 rings    = close all 3 rings: 25 Math + 25 Reading + 25 Language that day (swapped subjects count; swaps that land on the
                   same subject add up, like the core subjects rule). Checked from the pasted subject XP.
     📓 notebook = showed their notebook: their "notebook" Daily Door checked off that day counts (Nov 4), or Ms. Ariana taps ✅
     📷 camera   = camera on most of the day (Ms. Ariana taps ✅)
   Nobody sees who it is. When Ms. Ariana presses Reveal (that evening or later), each winner gets a mystery prize and a sealed-
   envelope pop-up; The Keep shouts out the winners. Students who didn't win are never revealed. An unrevealed day waits.
   Picks: teacher-only doc private/secret = { days: { date: { picks: [{ sid, m, ok }], note, revealed, winners } }, last: { sid: date } }.
   Class doc (no names): cls.secretOn, cls.secretDay = { date, n }, cls.secretShout = { date, names }.
   Winner's save (teacher writes): secretWin = { date, m, prize, note }, secretWins (count). Student writes secretSeen = date. */
import { esc } from "./game.js?v=20261110h";
import { azToday } from "./collect.js?v=20261110h";
import { subFor, SUB_NAMES } from "./teams.js?v=20261110h";
import { doorsFor, doorState, approved } from "./doors.js?v=20261110h";

export const MISSIONS = {
  rings: { icon: "\u{1F3AF}", name: "Close all 3 rings", short: "Rings", how: "25 Math, 25 Reading and 25 Language (or their own subjects)" },
  notebook: { icon: "\u{1F4D3}", name: "Show your notebook", short: "Notebook", how: "their notebook door is checked off (or you tap ✅)" },
  camera: { icon: "\u{1F4F7}", name: "Camera on most of the day", short: "Camera", how: "you tap ✅ if their camera was on" }
};
const ORDER = ["rings", "notebook", "camera"];
const PRIZES = [
  { k: "egg", w: 35, name: "an egg", icon: "\u{1F95A}" },
  { k: "corn", w: 35, name: "50 {cur}", icon: "\u{1F33D}" },
  { k: "rare", w: 20, name: "a Rare+ egg", icon: "\u{1F48E}" },
  { k: "sparkle", w: 10, name: "a ✨ Sparkle Charm (your next egg has a Sparkle chance!)", icon: "✨" }
];
export const secretOn = cls => !!(cls && cls.secretOn);
const wd = iso => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d).getDay(); };
export const schoolDay = (cls, iso) => { const w = wd(iso); return w >= 1 && w <= 5 && !((cls && cls.offDays) || {})[iso]; };
const dayLabel = iso => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }); };
const first = n => String(n || "").split(" ")[0];

// 🎯 rings on a date: [{ name, have, need }] for each core subject (merged when swaps land on the same subject)
export function rings(st, cls, date) {
  const sub = ((((st && st.xpHist) || {})[date]) || {}).sub || {}, need = {};
  ["m", "r", "l"].forEach(k => { const s = subFor(cls, st, k); need[s] = (need[s] || 0) + 25; });
  return Object.keys(need).map(s => ({ s, name: SUB_NAMES[s] || s, have: Math.round(Number(sub[s]) || 0), need: need[s] }));
}
const ringsDone = r => r.every(x => x.have >= x.need);
// 📓 the day's notebook door (any door that mentions a notebook) approved for this student
export function notebookDoor(st, cls, date) { return doorsFor(cls, date).some((t, i) => /notebook/i.test(String(t)) && approved(doorState(st, date, i))); }
export function missionMet(p, st, cls, date) { return p.m === "rings" ? ringsDone(rings(st, cls, date)) : p.m === "notebook" ? !!p.ok || notebookDoor(st, cls, date) : !!p.ok; }

/* ---------- picking (teacher console) ---------- */
function pickFor(students, sec, date, n, avoid) {
  const last = (sec && sec.last) || {}, kids = students.filter(s => s.companionId && !s.isTeacher && !(avoid || []).includes(s.id));
  const shuffled = kids.map(s => ({ s, r: Math.random() })).sort((a, b) => String(last[a.s.id] || "").localeCompare(String(last[b.s.id] || "")) || a.r - b.r);
  return shuffled.slice(0, n).map(x => x.s.id);
}
// The console calls this when it loads: today's picks if it's a school day and none yet. Returns { sec, cls } updates or null.
export function autoPick(students, cls, sec) {
  const today = azToday();
  if (!secretOn(cls) || !schoolDay(cls, today) || !students.some(s => s.companionId)) return null;
  if (sec && sec.days && sec.days[today]) return (cls.secretDay || {}).date === today ? null : { cls: { secretDay: { date: today, n: sec.days[today].picks.length } } };
  const ids = pickFor(students, sec, today, 3);
  if (!ids.length) return null;
  const picks = ids.map((sid, i) => ({ sid, m: ORDER[i % 3] }));
  const last = Object.assign({}, (sec && sec.last) || {}); ids.forEach(id => { last[id] = today; });
  return { sec: { [`days.${today}`]: { picks, note: "", revealed: false }, last }, cls: { secretDay: { date: today, n: picks.length } } };
}
const pending = (sec, today) => Object.keys((sec && sec.days) || {}).filter(d => d <= today && !sec.days[d].revealed).sort();

/* ---------- console card ---------- */
let viewDay = null;
export function secretAdmin(students, cls, sec) {
  const today = azToday(), on = secretOn(cls), byId = id => students.find(s => s.id === id) || { name: "(gone)" };
  let h = '<div class="card secretcard"><div class="card-head"><h2>\u{1F575}️ Secret Students</h2><span class="fact">' + (on ? "on" : "off") + "</span></div>";
  h += '<p class="lede" style="font-size:13.5px;">Every school day, 3 students are secretly picked, each with a mission: \u{1F3AF} close all 3 rings, \u{1F4D3} show their notebook, \u{1F4F7} camera on most of the day. ' +
    "Nobody knows who it is. Press <b>Reveal</b> when you’re ready: winners get a mystery prize (an egg, a Rare+ egg, corn or a Sparkle Charm) and a shout-out on The Keep. Anyone who didn’t make it stays secret.</p>" +
    '<button class="btn' + (on ? " ghost" : "") + ' small" data-sec="toggle">' + (on ? "Turn off" : "\u{1F575}️ Turn on") + "</button>";
  if (!on) return h + "</div>";
  const wait = pending(sec, today), days = Object.keys((sec && sec.days) || {}).sort();
  const d = viewDay && sec && sec.days && sec.days[viewDay] ? viewDay : wait[wait.length - 1] || (sec && sec.days && sec.days[today] ? today : null);
  if (wait.length > 1 || (wait.length && wait[0] !== d)) h += '<p class="small" style="margin:8px 0 0;">⏳ Waiting to be revealed: ' + wait.map(x => '<button class="btn ghost small" data-sec="view" data-d="' + x + '">' + esc(dayLabel(x)) + "</button>").join(" ") + "</p>";
  if (!d) return h + '<p class="small" style="margin-top:10px;">' + (schoolDay(cls, today) ? "Picking today’s Secret Students…" : "No school today — new Secret Students are picked on the next school day.") + "</p></div>";
  const day = sec.days[d], rev = !!day.revealed;
  h += '<h3 style="margin:12px 0 6px;">' + esc(dayLabel(d)) + (rev ? " · ✅ revealed" : "") + '</h3><div class="secrows">';
  day.picks.forEach((p, i) => { const s = byId(p.sid), M = MISSIONS[p.m], met = missionMet(p, s, cls, d);
    let status = "";
    if (p.m === "rings") status = rings(s, cls, d).map(r => '<span class="' + (r.have >= r.need ? "good" : "bad") + '">' + esc(r.name) + " " + r.have + "/" + r.need + "</span>").join(" · ");
    else if (p.m === "notebook" && notebookDoor(s, cls, d)) status = "✅ notebook door checked off";
    else status = rev ? (p.ok ? "✅" : "—") : '<button class="btn small' + (p.ok ? "" : " ghost") + '" data-sec="ok" data-i="' + i + '">' + (p.ok ? "✅ Yes!" : "Tap if they did it") + "</button>";
    h += '<div class="secrow' + (met ? " met" : "") + '"><span class="secm">' + M.icon + " <b>" + M.short + "</b></span><b class=\"secname\">" + esc(s.name) + "</b><span class=\"secst\">" + status + (p.m === "rings" ? (met ? " ✅" : "") : "") + "</span>" +
      (rev ? (day.winners || []).includes(p.sid) ? '<span class="secwon">\u{1F389} won ' + esc(((day.prizes || {})[p.sid]) || "") + "</span>" : "" :
        '<select class="small" data-sec="swap" data-i="' + i + '"><option value="">↻ Re-pick…</option><option value="?">\u{1F3B2} Someone random</option>' +
        students.filter(x => x.companionId && !x.isTeacher && !day.picks.some(q => q.sid === x.id)).map(x => '<option value="' + esc(x.id) + '">' + esc(x.name) + "</option>").join("") + "</select>") + "</div>"; });
  h += "</div>";
  if (!rev) h += '<div class="field" style="margin-top:8px;"><label for="secNote">Note for the winners (optional)</label><input id="secNote" type="text" maxlength="120" placeholder="Great job, Secret Agent!" value="' + esc(day.note || "") + '"></div>' +
    '<button class="btn gold" data-sec="reveal" data-d="' + d + '">\u{1F389} Reveal ' + esc(d === today ? "today’s" : dayLabel(d) + "’s") + " winners</button>" +
    (d === today ? ' <span class="muted small">Rings update as you paste XP. You can reveal tonight or tomorrow morning.</span>' : "");
  const hist = days.filter(x => sec.days[x].revealed).slice(-6).reverse();
  if (hist.length) h += '<details style="margin-top:10px;"><summary class="small"><b>Past winners</b></summary>' + hist.map(x => '<p class="small" style="margin:4px 0;">' + esc(dayLabel(x)) + ": " +
    (((sec.days[x].winners) || []).length ? sec.days[x].winners.map(id => esc(byId(id).name)).join(", ") : "nobody this time") + "</p>").join("") + "</details>";
  return h + "</div>";
}

const roll = () => { let r = Math.random() * 100; for (const p of PRIZES) { if ((r -= p.w) < 0) return p; } return PRIZES[0]; };
// c = { cls, students, sec, updClass(up), updSecret(up), updStudent(id, up), flash, render }
export async function secretClick(el, c) {
  const a = el.dataset.sec, today = azToday(), sec = c.sec || {}, days = sec.days || {};
  const cur = viewDay && days[viewDay] ? viewDay : pending(sec, today).slice(-1)[0] || (days[today] ? today : null);
  if (a === "toggle") { await c.updClass({ secretOn: !secretOn(c.cls) }); c.flash("Saved — Secret Students are " + (secretOn(c.cls) ? "off." : "on!")); return; }
  if (a === "view") { viewDay = el.dataset.d; return c.render(); }
  if (!cur) return;
  const day = JSON.parse(JSON.stringify(days[cur]));
  if (a === "ok") { const i = Number(el.dataset.i); day.picks[i].ok = !day.picks[i].ok; await c.updSecret({ [`days.${cur}`]: day }); return; }
  if (a === "swap") {
    const i = Number(el.dataset.i), v = el.value; if (!v) return;
    const id = v === "?" ? pickFor(c.students, sec, cur, 1, day.picks.map(p => p.sid))[0] : v; if (!id) return;
    day.picks[i] = { sid: id, m: day.picks[i].m };
    const last = Object.assign({}, sec.last || {}, { [id]: cur });
    await c.updSecret({ [`days.${cur}`]: day, last }); return;
  }
  if (a === "reveal") {
    const note = ((document.getElementById("secNote") || {}).value || "").trim().slice(0, 120), cur2 = el.dataset.d || cur, d0 = JSON.parse(JSON.stringify(days[cur2]));
    const winners = [], prizes = {}, names = [];
    for (const p of d0.picks) {
      const s = c.students.find(x => x.id === p.sid); if (!s || !missionMet(p, s, c.cls, cur2)) continue;
      const pr = roll(), up = { secretWin: { date: cur2, m: p.m, prize: pr.name.replace("{cur}", c.cur || "corn"), icon: pr.icon, note }, secretWins: (Number(s.secretWins) || 0) + 1 };
      if (pr.k === "egg") up.doorEggs = (Number(s.doorEggs) || 0) + 1;
      if (pr.k === "corn") up.candyBonus = (Number(s.candyBonus) || 0) + 50;
      if (pr.k === "rare") up.goalEggs = (s.goalEggs || []).concat(["rare"]);
      if (pr.k === "sparkle") { const eb = Object.assign({}, s.eggBoost || {}); eb.sparkle = (Number(eb.sparkle) || 0) + 1; up.eggBoost = eb; }
      await c.updStudent(s.id, up);
      winners.push(s.id); prizes[s.id] = up.secretWin.prize; names.push(first(s.name));
    }
    d0.revealed = true; d0.winners = winners; d0.prizes = prizes; d0.note = note;
    await c.updSecret({ [`days.${cur2}`]: d0 });
    await c.updClass(Object.assign({ secretShout: { date: cur2, names } }, cur2 === today ? { secretDay: { date: today, n: 0, done: true } } : {}));
    viewDay = null;
    c.flash(winners.length ? "Saved — \u{1F389} " + names.join(", ") + (winners.length === 1 ? " was a Secret Student!" : " were Secret Students!") : "Saved — nobody made it this time. Their names stay secret.");
  }
}

/* ---------- student page ---------- */
export function secretBanner(cls) {
  if (!secretOn(cls)) return "";
  const today = azToday(), d = cls.secretDay || {}, sh = cls.secretShout || {};
  let h = "";
  if (d.date === today && d.n && !d.done) h += '<div class="secretbar">\u{1F575}️ <b>There are ' + d.n + " Secret Students today…</b> Ms. Ariana is watching! Close your 3 rings, show your notebook and keep your camera on — it could be YOU.</div>";
  const age = sh.date ? Math.round((new Date(today + "T12:00:00") - new Date(sh.date + "T12:00:00")) / 864e5) : 99;
  if (sh.date && age <= 3) h += '<div class="secretbar shout">\u{1F389} <b>' + (sh.date === today ? "Today’s" : dayLabel(sh.date).split(",")[0] + "’s") + " Secret Students:</b> " +
    (sh.names && sh.names.length ? esc(sh.names.join(", ")) + "! Great work, Secret Agents!" : "nobody this time… will it be you next?") + "</div>";
  return h;
}
let opened = false;
export function secretOverlay(st) {
  const w = st && st.secretWin; if (!w || !w.date || st.secretSeen === w.date) { opened = false; return ""; }
  const M = MISSIONS[w.m] || {};
  return '<div class="prizeover secretover" role="dialog" aria-label="You were a Secret Student"><div class="prizebox">' +
    (opened
      ? '<div class="secenv open">\u{1F48C}</div><h2>You were a SECRET STUDENT!</h2><p class="lede">Your secret mission: <b>' + (M.icon || "") + " " + esc(M.name || "") + "</b> — and you did it! \u{1F389}</p>" +
        '<p style="font-size:22px;margin:10px 0;">' + esc(w.icon || "\u{1F381}") + " You won <b>" + esc(w.prize || "a prize") + "</b>!</p><p style=\"font-size:18px;margin:0 0 10px;\">\u2B50 + <b>25 Stardust</b> for Planet JP!</p>" + (w.note ? '<p class="secnote">“' + esc(w.note) + "” — Ms. Ariana</p>" : "") +
        '<button class="attackbtn" data-act="secretSeen">Yay! \u{1F389}</button>'
      : '<div class="secenv">✉️</div><h2>\u{1F575}️ A secret envelope for you!</h2><p class="lede">It’s sealed with a star…</p><button class="attackbtn" data-act="secretOpen">Open it!</button>') +
    "</div></div>";
}
export function secretOpen() { opened = true; }
