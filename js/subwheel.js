/* ---------- 🎡 Subject Wheel (Oct 25) ----------
   Ms. Ariana spins a name wheel on the projector. Students get on the wheel with subject XP:
   - Day mode: 25 XP in the subject = 1 entry, +1 entry for every 5 XP past 25.
   - Week mode: 125 XP in the subject (Mon-Sun) = 1 entry, +1 entry for every 10 XP past 125.
   The subject can be chosen, or a 🎲 Mystery: a subject wheel spins first and students only see "Mystery subject!" until then.
   Winners come off the wheel for the next spin.
   Prizes: her own typed prizes (comma-separated; they go on the 🎁 Prize winners list), candy, Comfort Points, an egg,
   a Rare-or-better egg, a Legendary egg (legendaryPulls, same as the Weekly Door's) and a ✨ Sparkle Charm (eggBoost.sparkle).
   prize.pick "all" = the winner gets every prize checked; "random" = a prize wheel spins after the name wheel and lands on one.
   The wheels use the season's wheel frame and colours (same look as the student Prize Wheel), with slices sized by entries.
   Class doc: cls.wheel = { on, mode, date, week, sub ("r" | "?"), pool:[subs], picked, prize:{ pick, text, candy, cp, egg, rare, leg, sparkle }, winners:[sid], log:[{ sid, name, sub, prize, at }] }
   Student doc: wheelWin = { at, prize, sub } (teacher writes it), wheelSeen = at (the student closes the 🎉 pop-up). */
import { esc, SEASON, weekKey, displayNames } from "./game.js?v=20261020z";
import { subFor, SUB_NAMES } from "./teams.js?v=20261020z";
import { addDays } from "./doors.js?v=20261020z";
import { azToday } from "./collect.js?v=20261020z";
import { classRef, studentRef, updateDoc } from "./db.js?v=20261020z";

export const WHEEL_SUBS = ["r", "m", "l", "f", "w", "v", "sc", "ss"];
const SUB_ICON = { r: "\u{1F4D6}", m: "➕", l: "✏️", f: "⚡", w: "\u{1F4DD}", v: "\u{1F524}", sc: "\u{1F52C}", ss: "\u{1F30E}" };
const POOL_DEFAULT = ["r", "m", "l", "f", "w", "v"];
const RULE = { day: { base: 25, step: 5 }, week: { base: 125, step: 10 } };
const DAYN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FACE = { cx: 0.4960, cy: 0.4577, r: 0.3732 };   // same as game.js WHEEL_FACE

export const wheelOf = cls => Object.assign({ on: false, mode: "day", sub: "r", pool: POOL_DEFAULT, prize: {}, winners: [], log: [] }, (cls && cls.wheel) || {});
const subName = k => (k === "?" ? "Mystery subject" : SUB_NAMES[k] || k);
const dayLabel = iso => { const [y, m, d] = iso.split("-").map(Number); return DAYN[new Date(y, m - 1, d).getDay()] + " " + m + "/" + d; };
export const curSub = w => (w.sub === "?" ? w.picked || "?" : w.sub);
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

/* ---------- prizes ---------- */
export function prizeList(p) {
  p = p || {}; const out = [], cur = SEASON.cur || "candy";
  String(p.text || "").split(",").map(t => t.trim()).filter(Boolean).forEach(t => out.push({ k: "text", text: t, icon: "\u{1F381}", label: t, name: t }));
  if (Number(p.candy) > 0) out.push({ k: "candy", amt: Number(p.candy), icon: "\u{1F36C}", label: p.candy + " " + cur, name: p.candy + " " + cur });
  if (Number(p.cp) > 0) out.push({ k: "cp", amt: Number(p.cp), icon: "\u{1F496}", label: p.cp + " CP", name: p.cp + " Comfort Points" });
  if (p.egg) out.push({ k: "egg", icon: "\u{1F95A}", label: "Egg", name: "an egg" });
  if (p.rare) out.push({ k: "rare", icon: "\u{1F48E}", label: "Rare+ Egg", name: "a Rare-or-better egg", rare: true });
  if (p.leg) out.push({ k: "leg", icon: "\u{1F451}", label: "Legendary", name: "a Legendary egg", rare: true });
  if (p.sparkle) out.push({ k: "sparkle", icon: "✨", label: "Sparkle", name: "a ✨ Sparkle Charm", rare: true });
  return out;
}
export const isRandom = p => !!(p && p.pick === "random") && prizeList(p).length > 1;
export function prizeText(p) {
  const l = prizeList(p); if (!l.length) return "a prize";
  return isRandom(p) ? "\u{1F3B2} a Prize Wheel spin (" + l.map(x => x.name).join(", ") + ")" : l.map(x => x.name).join(" + ");
}
function ruleText(mode) { const r = RULE[mode] || RULE.day; return r.base + " XP" + (mode === "week" ? " this week" : " today") + " = on the wheel, +1 entry for every " + r.step + " XP more"; }

/* ---------- student page ---------- */
export function wheelBanner(cls, st) {
  const w = wheelOf(cls); if (!current(w, cls)) return "";
  const sub = curSub(w), xp = st && sub !== "?" ? subXP(st, cls, w, sub) : 0, mine = entriesFrom(xp, w.mode);
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
  const rad = (v, l) => '<label class="small whchk"><input type="radio" name="wh-pick" value="' + v + '"' + ((p.pick || "all") === v ? " checked" : "") + "> " + l + "</label>";
  let h = '<div class="card wheeladmin"><div class="card-head"><h2>\u{1F3A1} Subject Wheel</h2><span class="fact">' + (current(w, cls) ? "showing on student pages" : "not showing") + "</span></div>" +
    '<p class="lede" style="font-size:13.5px;">Day: <b>25 XP</b> in the subject puts a name on the wheel once, +1 entry for every <b>5 XP</b> more. Week: <b>125 XP</b>, +1 for every <b>10 XP</b> more. Winners come off the wheel for the next spin.</p>' +
    '<div class="whgrid">' +
    '<label class="small"><b>Mode</b>' + sel("wh-mode", [["day", "One day (25 / +5)"], ["week", "Whole week (125 / +10)"]], w.mode) + "</label>" +
    '<label class="small"><b>Day</b> <span class="muted">(day mode)</span>' + sel("wh-date", dates.map(d => [d, (d === today ? "Today, " : "") + dayLabel(d)]), w.date || today) + "</label>" +
    '<label class="small"><b>Week</b> <span class="muted">(week mode)</span>' + sel("wh-week", weeks, w.week || wk) + "</label>" +
    '<label class="small"><b>Subject</b>' + sel("wh-sub", [["?", "\u{1F3B2} Surprise (spin a subject wheel first)"]].concat(WHEEL_SUBS.map(k => [k, SUB_NAMES[k]])), w.sub) + "</label></div>" +
    '<div class="small" style="margin-top:8px;"><b>Surprise subjects can land on:</b> ' + WHEEL_SUBS.map(k => chk("wh-pool-" + k, (w.pool || POOL_DEFAULT).includes(k), esc(SUB_NAMES[k]))).join(" ") + "</div>" +
    '<h3 style="margin:12px 0 4px;">Prize</h3>' +
    '<div class="small">' + rad("all", "<b>Give everything checked</b>") + " " + rad("random", "<b>\u{1F3B2} Random:</b> spin a Prize Wheel of everything checked") + "</div>" +
    '<div class="whgrid">' +
    '<label class="small"><b>Your own prizes</b> <span class="muted">(you give them; separate with commas)</span><input id="wh-text" type="text" maxlength="140" placeholder="e.g. Lunch with Ms. Ariana, Pick a sticker" value="' + esc(p.text || "") + '"></label>' +
    '<label class="small"><b>' + esc(SEASON.cur || "Candy") + '</b><input id="wh-candy" type="number" min="0" max="200" value="' + (Number(p.candy) || 0) + '"></label>' +
    '<label class="small"><b>Comfort Points</b><input id="wh-cp" type="number" min="0" max="200" value="' + (Number(p.cp) || 0) + '"></label></div>' +
    '<div class="small" style="margin-top:6px;">' + chk("wh-egg", p.egg, "\u{1F95A} Egg") + " " + chk("wh-rare", p.rare, "\u{1F48E} Rare-or-better egg") + " " + chk("wh-leg", p.leg, "\u{1F451} Legendary egg") + " " +
      chk("wh-sparkle", p.sparkle, "✨ Sparkle Charm <span class=\"muted\">(next egg has a 5% Sparkle chance)</span>") + "</div>" +
    '<div class="small" style="margin-top:8px;">' + chk("wh-on", w.on, "<b>Show the wheel on student pages</b> (only on that day / week)") + "</div>" +
    '<div class="row" style="gap:8px;margin-top:10px;"><button class="btn small" data-wh="save">Save</button>' +
    '<button class="btn small gold" data-wh="open">\u{1F3A1} Open the wheel (projector)</button>' +
    ((w.winners || []).length || w.picked ? '<button class="btn ghost small" data-wh="reset">Start fresh (put winners back' + (w.sub === "?" ? ", new mystery subject" : "") + ")</button>" : "") + "</div>" +
    '<p class="muted small" style="margin-top:6px;">Prize now: <b>' + esc(prizeText(p)) + "</b>. It’s given the moment the wheel lands, and the winner gets a \u{1F389} pop-up on their page.</p>";
  if (current(w, cls)) h += '<div style="margin-top:10px;"><p class="muted small">Students see:</p>' + wheelBanner(cls, null) + "</div>";
  h += "</div>";
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
  const pk = document.querySelector('input[name="wh-pick"]:checked');
  const prize = { pick: pk && pk.value === "random" ? "random" : "all", text: v("wh-text").trim().slice(0, 140), candy: n("wh-candy"), cp: n("wh-cp"), egg: c("wh-egg"), rare: c("wh-rare"), leg: c("wh-leg"), sparkle: c("wh-sparkle") };
  const out = Object.assign({}, w, { on: c("wh-on"), mode: v("wh-mode") === "week" ? "week" : "day", date: v("wh-date") || azToday(), week: v("wh-week"), sub: v("wh-sub") || "r", pool: pool.length ? pool : POOL_DEFAULT, prize });
  if (out.mode !== w.mode || out.date !== w.date || out.week !== w.week || out.sub !== w.sub) { out.winners = []; out.picked = null; }
  return out;
}

/* ---------- the projected wheel: the season's wheel frame + colours, slices sized by entries ----------
   It lives in its own layer on <body>, so console re-renders never stop a spin. */
let S = null;   // { stage: "subject" | "names" | "prize", rot, spinning, result, winner, gave }
let CTX = null;
function layer() { let el = document.getElementById("wheelStage"); if (!el) { el = document.createElement("div"); el.id = "wheelStage"; document.body.appendChild(el); } return el; }
function close() { S = null; const el = document.getElementById("wheelStage"); if (el) el.remove(); }

// Slice i is centred at the top when the wheel is at 0°, like the season wheel. Each slice's size follows its n.
function layout(slices) {
  const tot = slices.reduce((t, x) => t + x.n, 0) || 1; let a = -360 * slices[0].n / tot / 2;
  slices.forEach(x => { x.a0 = a; x.sw = 360 * x.n / tot; x.a1 = a + x.sw; x.mid = a + x.sw / 2; a = x.a1; });
}
function diskSVG(slices) {
  const pt = (deg, r) => { const t = (deg - 90) * Math.PI / 180; return [(r * Math.cos(t)).toFixed(2), (r * Math.sin(t)).toFixed(2)]; };
  const col = SEASON.colors || { treat: ["#F6A23C", "#C4560E"], trick: ["#9B5BD6", "#4B1E7A"] };
  let g = "";
  slices.forEach((s, i) => {
    const kind = slices.length > 1 && i % 2 ? "swp" : "swo";
    if (slices.length === 1) g += '<circle r="101" fill="url(#' + kind + ')" stroke="#1d1024" stroke-width="1.1"/>';
    else { const [x0, y0] = pt(s.a0, 101), [x1, y1] = pt(s.a1, 101);
      g += '<path d="M0 0 L' + x0 + " " + y0 + " A101 101 0 " + (s.sw > 180 ? 1 : 0) + " 1 " + x1 + " " + y1 + ' Z" fill="url(#' + kind + ')" stroke="#1d1024" stroke-width="1.1"/>'; }
    if (s.rare && s.sw > 6) {
      const [a, b] = pt(s.a0 + 1.5, 97), [c, d] = pt(s.a1 - 1.5, 97), [e, f] = pt(s.a1 - 1.5, 24), [gx, gy] = pt(s.a0 + 1.5, 24);
      g += '<path d="M' + gx + " " + gy + " L" + a + " " + b + " A97 97 0 " + (s.sw > 180 ? 1 : 0) + " 1 " + c + " " + d + " L" + e + " " + f + ' Z" fill="none" stroke="#FFD34D" stroke-width="2.2" stroke-linejoin="round" opacity=".95"/>';
    }
    // icon near the rim (subjects and prizes), name running from the centre outwards; thin slices get smaller text
    const ly = s.icon ? -44 : -58, lw = s.icon ? 40 : 68;
    const fs = Math.max(3.6, Math.min(s.icon ? 9 : 10, s.sw * 0.8, lw / (s.label.length * 0.58))), long = s.label.length * fs * 0.62 > lw;
    g += '<g transform="rotate(' + s.mid.toFixed(2) + ')">' +
      (s.icon ? '<text x="0" y="-84" text-anchor="middle" dominant-baseline="middle" font-size="' + Math.min(14, s.sw * 0.9).toFixed(1) + '">' + s.icon + "</text>" : "") +
      '<text transform="translate(0 ' + ly + ') rotate(-90)" x="0" y="0" text-anchor="middle" dominant-baseline="middle" class="wlabel" font-size="' + fs.toFixed(1) + '"' +
      (long ? ' textLength="' + lw + '" lengthAdjust="spacingAndGlyphs"' : "") + ">" + esc(s.label) + "</text></g>";
  });
  return '<svg class="wheeldisk" viewBox="-102 -102 204 204" aria-hidden="true"><defs>' +
    '<radialGradient id="swo" cx="0" cy="0" r="100" gradientUnits="userSpaceOnUse"><stop offset="0.2" stop-color="' + col.treat[0] + '"/><stop offset="1" stop-color="' + col.treat[1] + '"/></radialGradient>' +
    '<radialGradient id="swp" cx="0" cy="0" r="100" gradientUnits="userSpaceOnUse"><stop offset="0.2" stop-color="' + col.trick[0] + '"/><stop offset="1" stop-color="' + col.trick[1] + '"/></radialGradient>' +
    '<filter id="swgrain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.22 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>' +
    "</defs>" + g + '<circle r="101" fill="#000" filter="url(#swgrain)" opacity=".9" style="mix-blend-mode:multiply"/></svg>';
}
function framedWheel(slices, rot) {
  const f = SEASON.face || FACE;
  return '<div class="wheel whbig"><div class="wheelspin" style="left:' + (f.cx * 100) + "%;top:" + (f.cy * 100) + "%;width:" + (f.r * 200) + "%;height:" + (f.r * 200) +
    "%;transform:translate(-50%,-50%) rotate(" + (rot || 0) + 'deg);">' + diskSVG(slices) + "</div>" +
    (SEASON.frame ? '<img class="wheelframe" src="' + esc(SEASON.frame) + '" alt="">' : "") + "</div>";
}
function slicesNow() {
  const { cls, students } = CTX(), w = wheelOf(cls); let sl;
  if (S.stage === "subject") sl = (w.pool || POOL_DEFAULT).map(k => ({ id: k, label: SUB_NAMES[k] || k, icon: SUB_ICON[k], n: 1 }));
  else if (S.stage === "prize") sl = prizeList(w.prize).map((x, i) => Object.assign({ id: "p" + i, n: 1 }, x));
  else sl = wheelEntries(students, cls, w).filter(e => !e.won).map(e => ({ id: e.id, label: e.name, n: e.n, xp: e.xp, s: e.s }));
  if (sl.length) layout(sl);
  return sl;
}
function draw() {
  if (!S) return; const { cls } = CTX(), w = wheelOf(cls); if (!S.slices) S.slices = slicesNow(); const sl = S.slices;
  const sub = curSub(w), random = isRandom(w.prize);
  const title = S.stage === "subject" ? "\u{1F3B2} Mystery Subject Wheel" : S.stage === "prize" ? "\u{1F381} Prize Wheel for " + esc(S.winner.label) : "\u{1F3A1} " + esc(subName(sub)) + " Wheel";
  const subt = S.stage === "subject" ? "Which subject will it be?" : S.stage === "prize" ? "What will " + esc(S.winner.label) + " win?" : esc(ruleText(w.mode)) + " · " + sl.reduce((n, x) => n + x.n, 0) + " entries";
  let res = "";
  const gaveTxt = () => (S.gave === false ? '<p class="small" style="color:#b00;">Couldn’t save the prize — check your connection.</p>' : S.gave ? '<p class="small">✅ Prize given — it’s on their page.</p>' : "");
  const after = '<div class="row" style="justify-content:center;gap:10px;"><button class="btn" data-wh="again">Spin for another winner</button><button class="btn ghost" data-wh="close">Close</button></div>';
  if (S.result && S.stage === "subject") res = '<div class="whresult"><div class="whbig2">' + SUB_ICON[S.result.id] + " " + esc(SUB_NAMES[S.result.id] || S.result.id) + "!</div><p>Today’s mystery subject</p>" +
    '<button class="btn gold" data-wh="toNames">Spin for a winner →</button></div>';
  else if (S.result && S.stage === "names") res = '<div class="whresult"><div class="whconf">\u{1F389}\u{1F389}\u{1F389}</div><div class="whbig2">' + esc(S.result.label) + "!</div><p>" + S.result.xp + " " + esc(subName(sub)) + " XP" +
    (random ? "</p>" + '<button class="btn gold" data-wh="toPrize">\u{1F381} Spin for the prize →</button></div>' : " · wins <b>" + esc(prizeText(w.prize)) + "</b></p>" + gaveTxt() + after + "</div>");
  else if (S.result && S.stage === "prize") res = '<div class="whresult"><div class="whconf">' + S.result.icon + "\u{1F389}</div><div class=\"whbig2\">" + esc(S.winner.label) + "</div><p>wins <b>" + esc(S.result.name) + "</b>!</p>" + gaveTxt() + after + "</div>";
  const empty = S.stage === "names" ? "Nobody else has " + RULE[w.mode === "week" ? "week" : "day"].base + " " + esc(subName(sub)) + " XP yet." : S.stage === "prize" ? "Check some prizes first." : "";
  const body = !sl.length ? '<div class="whresult"><div class="whbig2" style="font-size:34px;">Nobody left on the wheel!</div><p>' + empty + "</p>" + '<button class="btn ghost" data-wh="close">Close</button></div>'
    : framedWheel(sl, S.rot) + (res || '<div class="row" style="justify-content:center;margin-top:10px;"><button class="attackbtn whspin" data-wh="spin"' + (S.spinning ? " disabled" : "") + ">" + (S.spinning ? "Spinning…" : "\u{1F3A1} SPIN!") + "</button></div>");
  layer().innerHTML = '<div class="whstage ' + esc(SEASON.key || "") + '" role="dialog" aria-modal="true" aria-label="Wheel"><button class="btn ghost small whx" data-wh="close">✕ Close</button>' +
    '<h1 class="whtitle">' + title + '</h1><p class="whsub">' + subt + "</p>" + body + "</div>";
}
function pick(sl) { const tot = sl.reduce((n, x) => n + x.n, 0); let r = Math.random() * tot; for (const x of sl) { r -= x.n; if (r < 0) return x; } return sl[sl.length - 1]; }
async function spin() {
  if (!S || S.spinning) return; const sl = S.slices; if (!sl || !sl.length) return;
  const win = pick(sl), pad = Math.min(0.3 * win.sw, 4), land = win.a0 + pad + Math.random() * (win.sw - 2 * pad);
  const target = Math.ceil((S.rot + 1) / 360) * 360 + 5 * 360 + ((360 - land) % 360 + 360) % 360;
  S.spinning = true; draw();
  await new Promise(r => setTimeout(r, 60));
  const el = document.querySelector("#wheelStage .wheelspin");
  if (el) el.style.transform = "translate(-50%,-50%) rotate(" + target + "deg)";
  await new Promise(r => setTimeout(r, el ? 5000 : 0));
  if (!S) return;
  S.rot = target; S.spinning = false; S.result = win;
  if (S.stage === "names" && !isRandom(wheelOf(CTX().cls).prize)) { draw(); S.gave = await give(win, prizeList(wheelOf(CTX().cls).prize)); }
  else if (S.stage === "prize") { draw(); S.gave = await give(S.winner, [win]); }
  draw();
  if (S.stage === "subject") await saveWheel({ picked: win.id });
}
async function saveWheel(patch) {
  const { cls } = CTX(), w = Object.assign(wheelOf(cls), patch);
  cls.wheel = w; await updateDoc(classRef, { wheel: w });
}
async function give(win, prizes) {
  const { cls } = CTX(), w = wheelOf(cls), s = win.s, at = new Date().toISOString(), sub = curSub(w);
  const text = prizes.length ? prizes.map(x => x.name).join(" + ") : "a prize";
  const d = { wheelWin: { at, prize: text, sub } }, texts = prizes.filter(x => x.k === "text");
  if (texts.length) d.spinLog = (s.spinLog || []).concat(texts.map(x => ({ id: "prize", src: "wheel", prizeName: "\u{1F3A1} " + x.text, at })));   // shows on 🎁 Prize winners
  prizes.forEach(x => {
    if (x.k === "candy") d.candyBonus = (Number(s.candyBonus) || 0) + x.amt;
    if (x.k === "cp") d.cpBonus = (Number(s.cpBonus) || 0) + x.amt;
    if (x.k === "egg") d.doorEggs = (Number(s.doorEggs) || 0) + 1;
    if (x.k === "rare") d.goalEggs = (s.goalEggs || []).concat(["rare"]);
    if (x.k === "leg") d.legendaryPulls = (Number(s.legendaryPulls) || 0) + 1;
    if (x.k === "sparkle") { const eb = Object.assign({}, s.eggBoost || {}); eb.sparkle = (Number(eb.sparkle) || 0) + 1; d.eggBoost = eb; }
  });
  try {
    await updateDoc(studentRef(s.id), d); Object.assign(s, d);
    await saveWheel({ winners: (w.winners || []).concat([s.id]), log: (w.log || []).concat([{ sid: s.id, name: win.label, sub, prize: text, at }]).slice(-40) });
    return true;
  } catch (e) { console.error(e); return false; }
}

export async function wheelClick(el, ctx) {
  CTX = ctx.get; const { cls } = ctx.get(), a = el.dataset.wh;
  if (a === "save") { const w = readForm(wheelOf(cls)); cls.wheel = w; await updateDoc(classRef, { wheel: w }); ctx.flash("Saved — wheel " + (w.on ? "is showing on student pages." : "is set up (not showing on student pages).")); return; }
  if (a === "reset") { await saveWheel({ winners: [], picked: null }); ctx.flash("Saved — everyone is back on the wheel."); return; }
  if (a === "open") { const w = readForm(wheelOf(cls)); cls.wheel = w; await updateDoc(classRef, { wheel: w }); S = { stage: curSub(w) === "?" ? "subject" : "names", rot: 0 }; draw(); ctx.render(); return; }
  if (!S || S.spinning) { if (a === "close") { close(); ctx.render(); } return; }
  if (a === "close") { close(); ctx.render(); return; }
  if (a === "spin") { await spin(); return; }
  if (a === "toNames") { S = { stage: "names", rot: 0 }; draw(); return; }
  if (a === "toPrize") { S = { stage: "prize", rot: 0, winner: S.result }; draw(); return; }
  if (a === "again") { S = { stage: "names", rot: 0 }; draw(); return; }
}
export const wheelOpen = () => !!S;
