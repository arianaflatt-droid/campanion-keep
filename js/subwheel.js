/* ---------- 🎡 Subject Wheel (Oct 25) ----------
   Ms. Ariana spins a name wheel on the projector. Students get on the wheel with subject XP:
   - Day mode: 25 XP in the subject = 1 entry, +1 entry for every 5 XP past 25.
   - Week mode: 125 XP in the subject (Mon-Sun) = 1 entry, +1 entry for every 10 XP past 125.
   The subject can be chosen, or a 🎲 Mystery: a subject wheel spins first and students only see "Mystery subject!" until then.
   Winners come off the wheel for the next spin. Prizes: anything she types (goes on the 🎁 Prize winners list), candy,
   Comfort Points, an egg, a Rare-or-better egg and a ✨ Sparkle Charm (eggBoost.sparkle, same as the Campfire Kitchen charm).
   Class doc: cls.wheel = { on, mode, date, week, sub ("r" | "?"), pool:[subs], picked, prize:{ text, candy, cp, egg, rare, sparkle }, winners:[sid], log:[{ sid, name, sub, prize, at }] }
   Student doc: wheelWin = { at, prize, sub } (teacher writes it), wheelSeen = at (the student closes the 🎉 pop-up). */
import { esc, SEASON, weekKey, displayNames } from "./game.js?v=20261020z";
import { subFor, SUB_NAMES } from "./teams.js?v=20261020z";
import { addDays } from "./doors.js?v=20261020z";
import { azToday } from "./collect.js?v=20261020z";
import { classRef, studentRef, updateDoc } from "./db.js?v=20261020z";

export const WHEEL_SUBS = ["r", "m", "l", "f", "w", "v", "sc", "ss"];
const POOL_DEFAULT = ["r", "m", "l", "f", "w", "v"];
const RULE = { day: { base: 25, step: 5 }, week: { base: 125, step: 10 } };
const COLORS = ["#FF6B6B", "#FFB84C", "#FFE066", "#7BD389", "#4DC9F6", "#6C8CFF", "#B07CFF", "#FF7EB6", "#2EC4B6", "#F9A03F"];
const DAYN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const wheelOf = cls => Object.assign({ on: false, mode: "day", sub: "r", pool: POOL_DEFAULT, prize: {}, winners: [], log: [] }, (cls && cls.wheel) || {});
const subName = k => (k === "?" ? "Mystery subject" : SUB_NAMES[k] || k);
const dayLabel = iso => { const [y, m, d] = iso.split("-").map(Number); return DAYN[new Date(y, m - 1, d).getDay()] + " " + m + "/" + d; };
// The subject everyone is being counted on right now ("?" until the subject wheel lands)
export const curSub = w => (w.sub === "?" ? w.picked || "?" : w.sub);
// Is the wheel for today / this week? (students only see it then)
function current(w, cls) { return w.on && (w.mode === "week" ? (w.week || weekKey(cls)) === weekKey(cls) : (w.date || azToday()) === azToday()); }

export function subXP(st, cls, w, sub) {
  const hist = (st && st.xpHist) || {}, src = subFor(cls, st, sub);
  const one = d => Number((((hist[d] || {}).sub) || {})[src]) || 0;
  if (w.mode === "week") { const mon = w.week || weekKey(cls); let n = 0; for (let i = 0; i < 7; i++) n += one(addDays(mon, i)); return Math.round(n); }
  return Math.round(one(w.date || azToday()));
}
export function entriesFrom(xp, mode) { const r = RULE[mode] || RULE.day; return xp >= r.base ? 1 + Math.floor((xp - r.base) / r.step) : 0; }
export function wheelEntries(students, cls, w) {
  w = w || wheelOf(cls); const sub = curSub(w); if (sub === "?") return [];
  const names = displayNames(students), won = new Set(w.winners || []);
  return students.map(s => { const xp = subXP(s, cls, w, sub); return { s, id: s.id, name: names[s.id] || s.name || "?", xp, n: entriesFrom(xp, w.mode), won: won.has(s.id) }; })
    .filter(e => e.n > 0).sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
}
export function prizeText(p) {
  p = p || {}; const out = [];
  if (p.text) out.push(p.text);
  if (Number(p.candy) > 0) out.push(p.candy + " " + (SEASON.cur || "candy"));
  if (Number(p.cp) > 0) out.push(p.cp + " Comfort Points");
  if (p.egg) out.push("an egg");
  if (p.rare) out.push("a Rare-or-better egg");
  if (p.sparkle) out.push("a ✨ Sparkle Charm");
  return out.length ? out.join(" + ") : "a prize";
}
function ruleText(mode) { const r = RULE[mode] || RULE.day; return r.base + " XP" + (mode === "week" ? " this week" : " today") + " = on the wheel, +1 entry for every " + r.step + " XP more"; }

/* ---------- student page ---------- */
export function wheelBanner(cls, st) {
  const w = wheelOf(cls); if (!current(w, cls)) return "";
  const sub = curSub(w), mine = st && sub !== "?" ? entriesFrom(subXP(st, cls, w, sub), w.mode) : 0, xp = st && sub !== "?" ? subXP(st, cls, w, sub) : 0;
  const won = st && (w.winners || []).includes(st.id);
  return '<div class="wheelbar">\u{1F3A1} <b>Wheel spin ' + (w.mode === "week" ? "this week" : "today") + "!</b> Subject: <b>" + (sub === "?" ? "\u{1F3B2} Mystery!" : esc(subName(sub))) + "</b> · Prize: <b>" + esc(prizeText(w.prize)) + "</b>" +
    '<div class="small">' + esc(ruleText(w.mode)) + (sub === "?" ? ". Do ALL your subjects — any one could be picked!" : "") + "</div>" +
    (won ? '<div class="small"><b>\u{1F389} You already won!</b></div>' : sub !== "?" && st ? '<div class="small">You have <b>' + xp + " " + esc(subName(sub)) + " XP</b> → <b>" + mine + " entr" + (mine === 1 ? "y" : "ies") + "</b>" + (mine ? "" : " (get to " + RULE[w.mode === "week" ? "week" : "day"].base + "!)") + "</div>" : "") + "</div>";
}
export function wheelWinOverlay(st) {
  const ww = st && st.wheelWin; if (!ww || !ww.at || st.wheelSeen === ww.at) return "";
  return '<div class="prizeover wheelwin" role="dialog" aria-label="You won the wheel"><div class="prizebox">' +
    '<div style="font-size:64px;line-height:1;">\u{1F389}\u{1F3A1}</div><h2 style="margin:10px 0 6px;">You won the wheel spin!</h2>' +
    (ww.sub ? '<p class="lede">' + esc(subName(ww.sub)) + " XP got you on the wheel — great work!</p>" : "") +
    '<p style="font-size:20px;margin:10px 0;"><b>' + esc(ww.prize || "a prize") + "</b></p>" +
    '<button class="attackbtn" data-act="wheelSeen">Yay! \u{1F389}</button></div></div>';
}
export async function wheelSeen(st) { const at = st && st.wheelWin && st.wheelWin.at; if (!at) return; st.wheelSeen = at; await updateDoc(studentRef(st.id), { wheelSeen: at }); }

/* ---------- console tab ---------- */
export function wheelTab(students, cls) {
  const w = wheelOf(cls), today = azToday(), sub = curSub(w), p = w.prize || {};
  const dates = []; for (let i = 0; i < 10 && dates.length < 6; i++) { const d = addDays(today, -i), [y, m, dd] = d.split("-").map(Number), wd = new Date(y, m - 1, dd).getDay(); if (wd && wd < 6) dates.push(d); }
  const wk = weekKey(cls), weeks = [[wk, "This week (" + dayLabel(wk) + ")"], [addDays(wk, -7), "Last week (" + dayLabel(addDays(wk, -7)) + ")"]];
  const sel = (id, opts, v) => '<select id="' + id + '">' + opts.map(([k, l]) => '<option value="' + k + '"' + (String(v) === String(k) ? " selected" : "") + ">" + esc(l) + "</option>").join("") + "</select>";
  const chk = (id, on, l) => '<label class="small whchk"><input type="checkbox" id="' + id + '"' + (on ? " checked" : "") + "> " + l + "</label>";
  let h = '<div class="card wheeladmin"><div class="card-head"><h2>\u{1F3A1} Subject Wheel</h2><span class="fact">' + (current(w, cls) ? "showing on student pages" : "not showing") + "</span></div>" +
    '<p class="lede" style="font-size:13.5px;">Day: <b>25 XP</b> in the subject puts a name on the wheel once, +1 entry for every <b>5 XP</b> more. Week: <b>125 XP</b>, +1 for every <b>10 XP</b> more. Winners come off the wheel for the next spin.</p>' +
    '<div class="whgrid">' +
    '<label class="small"><b>Mode</b>' + sel("wh-mode", [["day", "One day (25 / +5)"], ["week", "Whole week (125 / +10)"]], w.mode) + "</label>" +
    '<label class="small"><b>Day</b> <span class="muted">(day mode)</span>' + sel("wh-date", dates.map(d => [d, (d === today ? "Today, " : "") + dayLabel(d)]), w.date || today) + "</label>" +
    '<label class="small"><b>Week</b> <span class="muted">(week mode)</span>' + sel("wh-week", weeks, w.week || wk) + "</label>" +
    '<label class="small"><b>Subject</b>' + sel("wh-sub", [["?", "\u{1F3B2} Surprise (spin a subject wheel first)"]].concat(WHEEL_SUBS.map(k => [k, SUB_NAMES[k]])), w.sub) + "</label></div>" +
    '<div class="small" style="margin-top:8px;"><b>Surprise subjects can land on:</b> ' + WHEEL_SUBS.map(k => chk("wh-pool-" + k, (w.pool || POOL_DEFAULT).includes(k), esc(SUB_NAMES[k]))).join(" ") + "</div>" +
    '<h3 style="margin:12px 0 4px;">Prize</h3><div class="whgrid">' +
    '<label class="small"><b>Your own prize</b> <span class="muted">(you give it)</span><input id="wh-text" type="text" maxlength="60" placeholder="e.g. Lunch with Ms. Ariana" value="' + esc(p.text || "") + '"></label>' +
    '<label class="small"><b>' + esc(SEASON.cur || "Candy") + '</b><input id="wh-candy" type="number" min="0" max="200" value="' + (Number(p.candy) || 0) + '"></label>' +
    '<label class="small"><b>Comfort Points</b><input id="wh-cp" type="number" min="0" max="200" value="' + (Number(p.cp) || 0) + '"></label></div>' +
    '<div class="small" style="margin-top:6px;">' + chk("wh-egg", p.egg, "\u{1F95A} Egg") + " " + chk("wh-rare", p.rare, "\u{1F48E} Rare-or-better egg") + " " + chk("wh-sparkle", p.sparkle, "✨ Sparkle Charm <span class=\"muted\">(next egg has a 5% Sparkle chance)</span>") + "</div>" +
    '<div class="small" style="margin-top:8px;">' + chk("wh-on", w.on, "<b>Show the wheel on student pages</b> (only on that day / week)") + "</div>" +
    '<div class="row" style="gap:8px;margin-top:10px;"><button class="btn small" data-wh="save">Save</button>' +
    '<button class="btn small gold" data-wh="open">\u{1F3A1} Open the wheel (projector)</button>' +
    ((w.winners || []).length || w.picked ? '<button class="btn ghost small" data-wh="reset">Start fresh (put winners back' + (w.sub === "?" ? ", new mystery subject" : "") + ")</button>" : "") + "</div>" +
    '<p class="muted small" style="margin-top:6px;">Prize now: <b>' + esc(prizeText(p)) + "</b>. It’s given the moment the wheel lands, and the winner gets a \u{1F389} pop-up on their page.</p>";
  if (current(w, cls)) h += '<div style="margin-top:10px;"><p class="muted small">Students see:</p>' + wheelBanner(cls, null) + "</div>";
  h += "</div>";
  // Who's on the wheel
  const ents = wheelEntries(students, cls, w), on = ents.filter(e => !e.won), tot = on.reduce((n, e) => n + e.n, 0);
  h += '<div class="card"><div class="card-head"><h2>On the wheel</h2><span class="fact">' + (sub === "?" ? "\u{1F3B2} mystery subject" : esc(subName(sub)) + " · " + (w.mode === "week" ? "week of " + dayLabel(w.week || wk) : dayLabel(w.date || today))) + "</span></div>";
  if (sub === "?") h += '<p class="lede" style="font-size:13.5px;">The subject is a secret until you spin the subject wheel. Then the names fill in.</p>';
  else if (!ents.length) h += '<p class="lede" style="font-size:13.5px;">Nobody has ' + RULE[w.mode === "week" ? "week" : "day"].base + " " + esc(subName(sub)) + " XP yet.</p>";
  else h += '<p class="small muted">' + on.length + " student" + (on.length === 1 ? "" : "s") + ", " + tot + " entries</p>" +
    '<div class="whlist">' + ents.map(e => '<div class="whrow' + (e.won ? " won" : "") + '"><span>' + esc(e.name) + '</span><span class="muted small">' + e.xp + " XP</span><b>" + (e.won ? "\u{1F3C6} won" : "×" + e.n) + "</b></div>").join("") + "</div>";
  h += "</div>";
  if ((w.log || []).length) h += '<div class="card"><div class="card-head"><h2>\u{1F3C6} Wheel winners</h2></div>' +
    (w.log || []).slice().reverse().slice(0, 15).map(l => '<div class="whrow"><span><b>' + esc(l.name) + "</b></span><span class=\"small\">" + esc(subName(l.sub)) + " · " + esc(l.prize) + '</span><span class="muted small">' + esc(new Date(l.at).toLocaleString("en-US", { timeZone: "America/Phoenix", month: "numeric", day: "numeric", hour: "numeric", minute: "2-digit" })) + "</span></div>").join("") + "</div>";
  return h;
}

function readForm(w) {
  const v = id => { const e = document.getElementById(id); return e ? e.value : ""; }, c = id => { const e = document.getElementById(id); return !!(e && e.checked); };
  const pool = WHEEL_SUBS.filter(k => c("wh-pool-" + k));
  const n = id => Math.max(0, Math.min(200, Math.floor(Number(v(id))) || 0));
  const prize = { text: v("wh-text").trim().slice(0, 60), candy: n("wh-candy"), cp: n("wh-cp"), egg: c("wh-egg"), rare: c("wh-rare"), sparkle: c("wh-sparkle") };
  const out = Object.assign({}, w, { on: c("wh-on"), mode: v("wh-mode") === "week" ? "week" : "day", date: v("wh-date") || azToday(), week: v("wh-week"), sub: v("wh-sub") || "r", pool: pool.length ? pool : POOL_DEFAULT, prize });
  // A different day, week, subject or mode is a new wheel: everyone goes back on
  if (out.mode !== w.mode || out.date !== w.date || out.week !== w.week || out.sub !== w.sub) { out.winners = []; out.picked = null; }
  return out;
}

/* ---------- the projected wheel (its own layer on <body>, so console re-renders don't stop a spin) ---------- */
let S = null;   // { stage: "subject"|"names", rot, spinning, result }
let CTX = null;
function layer() { let el = document.getElementById("wheelStage"); if (!el) { el = document.createElement("div"); el.id = "wheelStage"; document.body.appendChild(el); } return el; }
function close() { S = null; const el = document.getElementById("wheelStage"); if (el) el.remove(); }

function wheelSVG(slices, rot) {
  const tot = slices.reduce((n, x) => n + x.n, 0) || 1, R = 250, C = 260; let a = 0, h = "";
  const pt = deg => { const r = (deg - 90) * Math.PI / 180; return [C + R * Math.cos(r), C + R * Math.sin(r)]; };
  const fs = Math.max(11, Math.min(26, 520 / Math.max(slices.length, 1) + 6));
  slices.forEach((x, i) => {
    const sw = 360 * x.n / tot, a0 = a, a1 = a + sw; a = a1; x.a0 = a0; x.a1 = a1;
    const [x0, y0] = pt(a0), [x1, y1] = pt(a1), col = x.color || COLORS[i % COLORS.length];
    h += slices.length === 1 ? '<circle cx="' + C + '" cy="' + C + '" r="' + R + '" fill="' + col + '"/>'
      : '<path d="M' + C + "," + C + " L" + x0.toFixed(1) + "," + y0.toFixed(1) + " A" + R + "," + R + " 0 " + (sw > 180 ? 1 : 0) + " 1 " + x1.toFixed(1) + "," + y1.toFixed(1) + ' Z" fill="' + col + '" stroke="#fff" stroke-width="2"/>';
    const mid = (a0 + a1) / 2, lab = x.label.length > 14 ? x.label.slice(0, 13) + "…" : x.label;
    h += '<text x="' + (C + R - 18) + '" y="' + C + '" transform="rotate(' + (mid - 90).toFixed(2) + " " + C + " " + C + ')" text-anchor="end" dominant-baseline="middle" font-size="' + (sw < 9 ? Math.min(fs, 13) : fs).toFixed(0) + '" font-weight="700" fill="#1d1d1d">' + esc(lab) + "</text>";
  });
  return '<div class="whwrap"><div class="whpointer">▼</div><svg class="whsvg" viewBox="0 0 520 520" style="transform:rotate(' + rot + 'deg)">' + h +
    '<circle cx="' + C + '" cy="' + C + '" r="34" fill="#fff" stroke="#333" stroke-width="3"/><text x="' + C + '" y="' + C + '" text-anchor="middle" dominant-baseline="middle" font-size="30">\u{1F3A1}</text></svg></div>';
}
function slicesNow() {
  const { cls, students } = CTX(), w = wheelOf(cls);
  if (S.stage === "subject") return (w.pool || POOL_DEFAULT).map(k => ({ id: k, label: SUB_NAMES[k] || k, n: 1 }));
  return wheelEntries(students, cls, w).filter(e => !e.won).map(e => ({ id: e.id, label: e.name, n: e.n, xp: e.xp, s: e.s }));
}
function draw() {
  if (!S) return; const { cls } = CTX(), w = wheelOf(cls), sl = S.slices || slicesNow(); S.slices = sl;
  const sub = curSub(w), title = S.stage === "subject" ? "\u{1F3B2} Mystery subject wheel" : "\u{1F3A1} " + (sub === "?" ? "" : esc(subName(sub))) + " Wheel";
  let res = "";
  if (S.result && S.stage === "subject") res = '<div class="whresult"><div class="whbig">' + esc(SUB_NAMES[S.result.id] || S.result.id) + "!</div><p>Today’s mystery subject</p>" +
    '<button class="btn gold" data-wh="toNames">Spin for a winner →</button></div>';
  else if (S.result) res = '<div class="whresult"><div class="whconf">\u{1F389}\u{1F389}\u{1F389}</div><div class="whbig">' + esc(S.result.label) + "!</div><p>" + S.result.xp + " " + esc(subName(sub)) + " XP · wins <b>" + esc(prizeText(w.prize)) + "</b></p>" +
    (S.gave === false ? '<p class="small" style="color:#b00;">Couldn’t save the prize — check your connection.</p>' : S.gave ? '<p class="small">✅ Prize given — it’s on their page.</p>' : "") +
    '<div class="row" style="justify-content:center;gap:10px;"><button class="btn" data-wh="again">Spin again</button><button class="btn ghost" data-wh="close">Close</button></div></div>';
  const body = !sl.length ? '<div class="whresult"><div class="whbig" style="font-size:34px;">Nobody left on the wheel!</div><p>Nobody ' + (S.stage === "names" ? "else has " + RULE[w.mode === "week" ? "week" : "day"].base + " " + esc(subName(sub)) + " XP yet." : "") + "</p></div>"
    : wheelSVG(sl, S.rot) + (res || '<div class="row" style="justify-content:center;margin-top:14px;"><button class="btn gold whspin" data-wh="spin"' + (S.spinning ? " disabled" : "") + ">" + (S.spinning ? "Spinning…" : "SPIN!") + "</button></div>");
  layer().innerHTML = '<div class="whstage" role="dialog" aria-modal="true" aria-label="Wheel"><button class="btn ghost small whx" data-wh="close">✕ Close</button>' +
    '<h1 class="whtitle">' + title + "</h1>" + (S.stage === "names" ? '<p class="whsub">' + esc(ruleText(w.mode)) + " · " + sl.reduce((n, x) => n + x.n, 0) + " entries</p>" : '<p class="whsub">Which subject will it be?</p>') + body + "</div>";
}
function pick(sl) { const tot = sl.reduce((n, x) => n + x.n, 0); let r = Math.random() * tot; for (const x of sl) { r -= x.n; if (r < 0) return x; } return sl[sl.length - 1]; }
async function spin() {
  if (!S || S.spinning) return; const sl = S.slices; if (!sl || !sl.length) return;
  const win = pick(sl), pad = Math.min(0.35 * (win.a1 - win.a0), 4), land = win.a0 + pad + Math.random() * (win.a1 - win.a0 - 2 * pad);
  const target = S.rot + 360 * 6 + ((360 - land) - (S.rot % 360) + 720) % 360;
  S.spinning = true; draw();
  const svg = document.querySelector("#wheelStage .whsvg");
  requestAnimationFrame(() => { if (svg) { svg.style.transition = "transform 5.2s cubic-bezier(.12,.6,.12,1)"; svg.style.transform = "rotate(" + target + "deg)"; } });
  await new Promise(r => setTimeout(r, svg ? 5400 : 0));
  if (!S) return;
  S.rot = target; S.spinning = false; S.result = win; draw();
  if (S.stage === "subject") await saveWheel({ picked: win.id });
  else { S.gave = await give(win); draw(); }
}
async function saveWheel(patch) {
  const { cls } = CTX(), w = Object.assign(wheelOf(cls), patch);
  cls.wheel = w; await updateDoc(classRef, { wheel: w });
}
async function give(win) {
  const { cls } = CTX(), w = wheelOf(cls), s = win.s, p = w.prize || {}, at = new Date().toISOString(), sub = curSub(w), text = prizeText(p);
  const d = { wheelWin: { at, prize: text, sub } };
  if (p.text) d.spinLog = (s.spinLog || []).concat([{ id: "prize", src: "wheel", prizeName: "\u{1F3A1} " + p.text, at }]);   // shows on 🎁 Prize winners
  if (Number(p.candy) > 0) d.candyBonus = (Number(s.candyBonus) || 0) + Number(p.candy);
  if (Number(p.cp) > 0) d.cpBonus = (Number(s.cpBonus) || 0) + Number(p.cp);
  if (p.egg) d.doorEggs = (Number(s.doorEggs) || 0) + 1;
  if (p.rare) d.goalEggs = (s.goalEggs || []).concat(["rare"]);
  if (p.sparkle) { const eb = Object.assign({}, s.eggBoost || {}); eb.sparkle = (Number(eb.sparkle) || 0) + 1; d.eggBoost = eb; }
  try {
    await updateDoc(studentRef(s.id), d); Object.assign(s, d);
    await saveWheel({ winners: (w.winners || []).concat([s.id]), log: (w.log || []).concat([{ sid: s.id, name: win.label, sub, prize: text, at }]).slice(-40) });
    return true;
  } catch (e) { console.error(e); return false; }
}

export async function wheelClick(el, ctx) {
  CTX = ctx.get; const { cls, students } = ctx.get(), a = el.dataset.wh;
  if (a === "save") { const w = readForm(wheelOf(cls)); cls.wheel = w; await updateDoc(classRef, { wheel: w }); ctx.flash("Saved — wheel " + (w.on ? "is showing on student pages." : "is set up (not showing on student pages).")); return; }
  if (a === "reset") { await saveWheel({ winners: [], picked: null }); ctx.flash("Saved — everyone is back on the wheel."); return; }
  if (a === "open") { const w = readForm(wheelOf(cls)); cls.wheel = w; await updateDoc(classRef, { wheel: w }); S = { stage: curSub(w) === "?" ? "subject" : "names", rot: 0 }; draw(); ctx.render(); return; }
  if (!S) return;
  if (a === "close") { close(); ctx.render(); return; }
  if (a === "spin") { await spin(); return; }
  if (a === "toNames") { S = { stage: "names", rot: 0 }; draw(); return; }
  if (a === "again") { S = { stage: "names", rot: S.rot % 360 }; draw(); return; }
}
export const wheelOpen = () => !!S;
