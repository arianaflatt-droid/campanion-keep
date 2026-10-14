/* ---------- ✨ Daily surprises ----------
   Mystery Visitor: every school day a Rare or Super Rare creature visits. Anyone at the goal by the lunch paste
     (morning or lunch data, or a Lunch Hero mark) can catch it. Student saves visitor = { date: fam }.
   Snack Drop: Ms. Ariana taps a button and every companion gets hungry. Students who gain SNACK_XP more XP (in a later
     paste that day) feed it and get 1 egg. Class: snack = { date, at, base: { id: xp } }. Student: snackGot = { date: true }.
   Secret Target: Ms. Ariana starts it and a hidden number (30–80) is picked. At her next paste she taps Reveal; everyone
     who gained at least that much XP since the start wins a Rare egg. Class: target = { date, n, base, shown, end }.
   Both have an End button: the XP at that moment is frozen in end = { id: xp }, and rewards are judged on it.
     Student: targetGot = { date: true }.
   Confetti: a burst the first time a student opens their page after crossing halfway and the goal. Student: confSeen = { date: [..] }.
   Shout-outs: a ticker on The Keep built from today's pastes. */
import { esc, goalXP } from "./game.js?v=20261014b";
import { musicBtn } from "./party.js?v=20261014b";
import { azToday, azNow, doPull, formOf, sparkleImg, FAMILIES, RARITY_COLOR } from "./collect.js?v=20261014b";

export const SNACK_XP = 25, TARGET_MIN = 30, TARGET_MAX = 80, VISIT_SPARKLE = 0.05;
const rng = s => { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const isWeekend = date => { const d = new Date(date + "T12:00:00").getDay(); return d === 0 || d === 6; };
// The best XP saved for a student on a day (morning, lunch or end of day)
export const xpOn = (st, date) => { const h = ((st && st.xpHist) || {})[date || azToday()] || {}; return Math.max(Number(h.d) || 0, Number(h.l) || 0, Number(h.mo) || 0); };
const lunchHit = (st, date, goal) => { const h = ((st && st.xpHist) || {})[date] || {}; return !!h.lh || Math.max(Number(h.l) || 0, Number(h.mo) || 0) >= goal; };

/* ---------- Mystery Visitor ---------- */
export function visitorOf(date, cls) {
  date = date || azToday(); if (isWeekend(date) || (cls && cls.visitorOff)) return null;
  const r = rng("visit:" + date), rar = r() < 0.7 ? "Rare" : "Super Rare", pool = FAMILIES.filter(f => !f.event && f.rarity === rar);
  const fam = pool.length ? pool[Math.floor(r() * pool.length)] : null; if (!fam) return null;
  const c = formOf(fam.id, 1); return { fam: fam.id, rarity: fam.rarity, name: c.name, img: c.img };
}
export const visitorCaught = (st, date) => (((st && st.visitor) || {})[date || azToday()]) || null;
export const canCatch = (st, cls, date) => { date = date || azToday(); return !!visitorOf(date, cls) && !visitorCaught(st, date) && lunchHit(st, date, goalXP(cls)); };

/* ---------- Snack Drop ---------- */
export const snackOn = cls => !!(cls && cls.snack && cls.snack.date === azToday());
// Once Ms. Ariana taps End, the XP at that moment is frozen (snack.end / target.end), so later pastes don't count.
const nowXP = (st, ev) => ev && ev.end ? Number(ev.end[st.id]) || 0 : xpOn(st);
export const snackEnded = cls => snackOn(cls) && !!cls.snack.end;
export const snackGain = (st, cls) => snackOn(cls) ? Math.max(0, nowXP(st, cls.snack) - (Number((cls.snack.base || {})[st.id]) || 0)) : 0;
export const snackFed = st => !!(((st && st.snackGot) || {})[azToday()]);
// How much XP feeds the companion: set when Ms. Ariana drops the snack (default 25)
export const snackXP = cls => Number(snackOn(cls) ? cls.snack.xp : cls && cls.snackXP) || SNACK_XP;
export const snackReady = (st, cls) => snackOn(cls) && !snackFed(st) && snackGain(st, cls) >= snackXP(cls);

/* ---------- Secret Target ---------- */
export const targetOn = cls => !!(cls && cls.target && cls.target.date === azToday());
export const targetGain = (st, cls) => targetOn(cls) ? Math.max(0, nowXP(st, cls.target) - (Number((cls.target.base || {})[st.id]) || 0)) : 0;
export const targetWon = (st, cls) => targetOn(cls) && cls.target.shown && targetGain(st, cls) >= cls.target.n;
export const targetReady = (st, cls) => targetWon(st, cls) && !(((st && st.targetGot) || {})[azToday()]);

export const surpriseReady = (st, cls) => (canCatch(st, cls) ? 1 : 0) + (snackReady(st, cls) ? 1 : 0) + (targetReady(st, cls) ? 1 : 0);

/* ---------- student cards ---------- */
let fx = null, confShown = "";
export function surpriseCards(st, cls, petName) {
  const today = azToday(), goal = goalXP(cls), V = visitorOf(today, cls), lunch = azNow().h < 12;
  let h = "";
  if (V) {
    const got = visitorCaught(st, today), can = canCatch(st, cls, today);
    h += '<div class="card spcard sp-visit"><img class="spimg' + (got || can ? "" : " shadow") + '" src="' + esc(V.img) + '" alt="">' +
      '<div class="sptxt"><h3>\u{1F984} Mystery Visitor: ' + (got || can ? esc(V.name) : "???") + ' <span class="sprar" style="color:' + RARITY_COLOR[V.rarity] + '">' + V.rarity + "</span></h3>" +
      (got ? '<p>✅ You caught ' + esc(V.name) + "! A new visitor comes tomorrow.</p>"
        : can ? '<p>You hit ' + goal + ' before lunch, so you can catch it!</p><button class="btn gold" data-sp="visit">\u{1F3AF} Catch ' + esc(V.name) + "!</button>"
        : lunch ? "<p>A rare creature is visiting! Hit <b>" + goal + " XP before lunch</b> to catch it.</p>"
        : "<p>The visitor left at lunch. Hit " + goal + " before lunch tomorrow to catch the next one!</p>") + "</div></div>";
  }
  if (snackOn(cls)) {
    const fed = snackFed(st), g = Math.min(snackXP(cls), snackGain(st, cls)), ready = snackReady(st, cls);
    h += '<div class="card spcard sp-snack"><div class="spemoji">' + (fed ? "\u{1F60B}" : "\u{1F36A}") + '</div><div class="sptxt"><h3>\u{1F36A} Snack Drop!</h3>' +
      (fed ? "<p>" + esc(petName) + " is full and happy! You got an egg.</p>"
        : snackEnded(cls) && !ready ? "<p>Snack time is over! You earned " + g + " of " + snackXP(cls) + " XP. Watch for the next Snack Drop!</p>"
        : ready ? "<p>" + esc(petName) + " smells the snack!</p><button class=\"btn gold\" data-sp=\"snack\">\u{1F36A} Feed " + esc(petName) + "!</button>"
        : "<p><b>" + esc(petName) + " is hungry!</b> Earn " + snackXP(cls) + " more XP before snack time ends to feed it!</p>" +
          '<div class="spbar"><span style="width:' + (g / snackXP(cls) * 100) + '%"></span><b>' + g + " / " + snackXP(cls) + " XP</b></div>") + "</div></div>";
  }
  if (targetOn(cls)) {
    const T = cls.target, got = ((st.targetGot || {})[today]), won = targetWon(st, cls), gain = targetGain(st, cls);
    h += '<div class="card spcard sp-target"><div class="spemoji">\u{1F3AF}</div><div class="sptxt"><h3>\u{1F3AF} Secret Target</h3>' +
      (!T.shown ? "<p>Ms. Ariana picked a <b>secret XP number</b> between " + TARGET_MIN + " and " + TARGET_MAX + ". Earn at least that much before Ms. Ariana ends it to win a prize! You’ve gained <b>" + gain + " XP</b> so far.</p>"
        : got ? "<p>The secret number was <b>" + T.n + "</b>. ✅ You won!</p>"
        : won ? "<p>The secret number was <b>" + T.n + "</b> and you gained <b>" + gain + "</b>! \u{1F389}</p><button class=\"btn gold\" data-sp=\"target\">\u{1F381} Claim your prize!</button>"
        : "<p>The secret number was <b>" + T.n + "</b>. You gained " + gain + ". So close! There’s always next time.</p>") + "</div></div>";
  }
  return h;
}
export function surpriseOverlay(st, cls) {
  if (fx) return '<div class="qbover passover"><div class="qbpanel win mqresult">' + (fx.img ? '<img class="mqresimg' + (fx.sparkle ? " sparkle" : "") + '" src="' + esc(fx.img) + '" alt="">' : '<div class="mqemoji big">' + fx.icon + "</div>") +
    "<h3>" + fx.title + "</h3>" + (fx.sparkle ? '<p class="mqsparkle">✨ SPARKLE! ✨</p>' : "") + (fx.sub ? "<p>" + fx.sub + "</p>" : "") +
    (fx.saved ? '<button class="btn big" data-sp="ok">Yay! \u{1F389}</button>' : '<p class="muted">Saving…</p>') + "</div></div>";
  return confettiHTML(st, cls);
}
export const surpriseBusy = () => !!fx;

/* ---------- confetti ---------- */
function milestones(st, cls) { const v = xpOn(st), g = goalXP(cls), out = []; if (v >= g / 2) out.push("half"); if (v >= g) out.push("goal"); if (v >= g * 2) out.push("double"); return out; }
export function confettiDue(st, cls) { const seen = ((st.confSeen || {})[azToday()]) || []; return milestones(st, cls).filter(m => !seen.includes(m)); }
function confettiHTML(st, cls) {
  const due = confettiDue(st, cls); if (!due.length) return "";
  const top = due[due.length - 1], g = goalXP(cls);
  const msg = { half: ["\u{1F388} You hit " + g / 2 + " XP! Party time!", "Your companion is throwing you a party. You\u2019re halfway to " + g + "!"], goal: ["\u{1F38A} You hit " + g + " XP! Party time!", "Your companion is throwing you a BIG party. You did it!"], double: ["\u{1F680} Double goal!", "You reached " + g * 2 + " XP today. Amazing!"] }[top];
  let c = ""; const cols = ["#FFD166", "#06D6A0", "#EF476F", "#118AB2", "#FFFFFF", "#F77F00"];
  for (let i = 0; i < 80; i++) c += '<i style="left:' + ((i * 37) % 100) + "%;background:" + cols[i % cols.length] + ";animation-delay:" + ((i * 0.11) % 2.4).toFixed(2) + "s;animation-duration:" + (2.4 + (i % 5) * 0.35).toFixed(2) + 's"></i>';
  return '<div class="confparty" role="dialog" aria-label="Celebration"><div class="confbits" aria-hidden="true">' + c + '</div><div class="confbox"><h2>' + msg[0] + "</h2><p>" + msg[1] + '</p><div class="confdance" aria-hidden="true">\u{1F483}\u{1F388}\u{1F57A}\u{1F389}\u{1F483}</div><p>' + musicBtn() + '</p><button class="btn big" data-sp="conf" data-k="' + due.join(",") + '">Woohoo! \u{1F389}</button></div></div>';
}

/* ---------- student clicks (c = { me, cls, patch, render, flash }) ---------- */
export async function surpriseClick(el, c) {
  const k = el.dataset.sp, s = c.me, cls = c.cls, today = azToday();
  if (k === "ok") { fx = null; return c.render(true); }
  if (k === "conf") { const seen = Object.assign({}, s.confSeen || {}); seen[today] = [...new Set((seen[today] || []).concat(String(el.dataset.k || "").split(",")))];
    Object.keys(seen).forEach(d => { if (d < today) delete seen[d]; }); s.confSeen = seen; return c.patch({ confSeen: seen }); }
  if (fx) return;
  let data = {};
  if (k === "visit") {
    if (!canCatch(s, cls, today)) return;
    const V = visitorOf(today, cls), sp = Math.random() < VISIT_SPARKLE, res = doPull(s, V.rarity, cls, { force: V.fam, sparkle: sp }), cr = formOf(res.fam, res.lvl);
    data = { coll: res.coll, visitor: Object.assign({}, s.visitor || {}, { [today]: V.fam }) };
    fx = { img: res.sparkle ? sparkleImg(cr) : cr.img, sparkle: res.sparkle, title: "You caught <b>" + esc(cr.name) + "</b>!", sub: V.rarity + (res.dupe ? " · you already had one, so it went up a level" : " · it’s in your Creature Collector") };
  } else if (k === "snack") {
    if (!snackReady(s, cls)) return;
    data = { snackGot: Object.assign({}, s.snackGot || {}, { [today]: true }), doorEggs: (Number(s.doorEggs) || 0) + 1 };
    fx = { icon: "\u{1F60B}", title: "Yum! Your companion loved the snack!", sub: "\u{1F95A} You got an egg! Hatch it in the Creature Collector." };
  } else if (k === "target") {
    if (!targetReady(s, cls)) return;
    const res = doPull(s, "Rare", cls, { noEvent: true }), cr = formOf(res.fam, res.lvl);
    data = { coll: res.coll, targetGot: Object.assign({}, s.targetGot || {}, { [today]: true }) };
    fx = { img: res.sparkle ? sparkleImg(cr) : cr.img, sparkle: res.sparkle, title: "\u{1F3AF} You hit the Secret Target!", sub: "Your prize: a Rare egg, and it hatched <b>" + esc(cr.name) + "</b>!" };
  } else return;
  c.render(true);
  try { await c.patch(data, true); Object.assign(s, data); fx.saved = true; } catch (e) { fx = null; c.flash("That didn’t save — tell Ms. Ariana! (" + (e.code || e.message) + ")"); }
  c.render(true);
}

/* ---------- The Keep: shout-out ticker ---------- */
export function shoutTicker(students, cls) {
  if (!(cls && cls.tickerOn)) return "";   // off until Ms. Ariana turns it on
  const today = azToday(), goal = goalXP(cls), V = visitorOf(today, cls), out = [];
  students.filter(s => s.companionId && !s.isTeacher).forEach(s => {
    const h = ((s.xpHist || {})[today]) || {}, best = xpOn(s, today), n = esc(s.name);
    if (Number(h.mo) >= goal) out.push("\u{1F305} " + n + " hit " + goal + " XP before school!");
    else if (h.lh || Number(h.l) >= goal) out.push("\u{1F3C6} " + n + " hit " + goal + " XP before lunch!");
    else if (best >= goal * 2) out.push("\u{1F525} " + n + " hit " + goal * 2 + " XP!");
    else if (best >= goal) out.push("\u{1F3C6} " + n + " hit " + goal + " XP!");
    else if (best >= goal / 2) out.push("⭐ " + n + " is halfway there!");
    if (V && (s.visitor || {})[today]) out.push("\u{1F984} " + n + " caught the Mystery Visitor!");
    if ((s.snackGot || {})[today]) out.push("\u{1F36A} " + n + " fed their hungry companion!");
    if ((s.targetGot || {})[today]) out.push("\u{1F3AF} " + n + " hit the Secret Target!");
  });
  if (snackOn(cls) && !snackEnded(cls)) out.unshift("\u{1F36A} SNACK DROP! Every companion is hungry. Earn " + snackXP(cls) + " more XP to feed yours!");
  if (targetOn(cls) && !cls.target.shown) out.unshift("\u{1F3AF} A Secret Target is on! Keep earning XP until Ms. Ariana ends it!");
  if (V && azNow().h < 12) out.unshift("\u{1F984} A Mystery Visitor is here! Hit " + goal + " before lunch to catch it!");
  if (!out.length) return "";
  const line = out.map(t => "<span>" + t + "</span>").join("");
  const dur = Math.max(20, out.length * 6);
  return '<div class="ticker" aria-label="Shout-outs"><div class="tickin" style="animation-duration:' + dur + 's">' + line + line + "</div></div>";
}

/* ---------- teacher card ---------- */
export function surpriseAdmin(students, cls) {
  const today = azToday(), V = visitorOf(today, cls), kids = students.filter(s => s.companionId && !s.isTeacher);
  let h = '<div class="card"><div class="card-head"><h2>✨ Daily surprises</h2><span class="fact">one reward each, no doubling</span></div>';
  h += '<p class="small"><b>\u{1F984} Mystery Visitor:</b> ' + (V ? esc(V.name) + " (" + V.rarity + ") · " + kids.filter(s => (s.visitor || {})[today]).length + " caught, " + kids.filter(s => canCatch(s, cls, today)).length + " can still catch. Anyone at the goal by the lunch paste can catch it." : (cls.visitorOff ? "off" : "no visitor on weekends")) +
    ' <button class="btn ghost small" data-act="visitorToggle">' + (cls.visitorOff ? "Turn on" : "Turn off") + "</button></p>" +
    '<p class="small"><b>\u{1F4E3} Shout-out ticker on The Keep:</b> ' + (cls.tickerOn ? "on" : "off") + ' <button class="btn ghost small" data-act="tickerToggle">' + (cls.tickerOn ? "Turn off" : "Turn on") + "</button></p>";
  h += '<div class="row" style="gap:8px;flex-wrap:wrap;margin:8px 0;align-items:center;"><b>\u{1F36A} Snack Drop</b>' + (snackOn(cls)
    ? (snackEnded(cls)
      ? '<span class="small">Ended \u00b7 ' + kids.filter(s => snackFed(s) || snackGain(s, cls) >= snackXP(cls)).length + " reached " + snackXP(cls) + " XP (" + kids.filter(snackFed).length + " fed so far)</span><button class=\"btn ghost small\" data-act=\"snackStop\">Clear it</button>"
      : '<span class="small">On since ' + new Date(cls.snack.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) + " \u00b7 needs " + snackXP(cls) + " XP \u00b7 " + kids.filter(s => snackFed(s) || snackReady(s, cls)).length + " reached it so far. Paste XP right before you end it.</span><button class=\"btn small\" data-act=\"snackEnd\">\u23F9\uFE0F End snack time</button>")
    : '<span class="small muted">Every companion gets hungry. Students who earn this much more XP before you tap End feed it and get 1 egg.</span>' +
      '<label class="small" for="snackXP">XP to feed:</label><input id="snackXP" type="number" min="5" max="200" step="5" style="width:70px;" value="' + snackXP(cls) + '"><button class="btn small" data-act="snackStart">\u{1F36A} Drop a snack!</button>') + "</div>";
  h += '<div class="row" style="gap:8px;flex-wrap:wrap;margin:8px 0;align-items:center;"><b>\u{1F3AF} Secret Target</b>';
  if (targetOn(cls) && cls.target.shown) h += '<span class="small">The number was <b>' + cls.target.n + "</b> · " + kids.filter(s => targetWon(s, cls)).length + " winner(s)</span><button class=\"btn ghost small\" data-act=\"targetStart\">Start a new one</button>";
  else if (targetOn(cls)) h += '<span class="small">Running since ' + new Date(cls.target.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) + '. The number is hidden from you too! Paste XP right before you end it.</span><button class="btn small" data-act="targetReveal">\u23F9\uFE0F End &amp; reveal</button><button class="btn ghost small" data-act="targetStop">Cancel</button>';
  else h += '<span class="small muted">A hidden number from ' + TARGET_MIN + " to " + TARGET_MAX + " is picked. When you tap End, everyone who gained that much XP since the start wins a Rare egg.</span><button class=\"btn small\" data-act=\"targetStart\">\u{1F3AF} Start</button>";
  return h + "</div></div>";
}
// Teacher actions: returns the class update to save, or null
export function surpriseAction(act, students, cls) {
  const today = azToday(), base = {}; students.forEach(s => { base[s.id] = xpOn(s, today); });
  if (act === "snackStart") { const el = typeof document !== "undefined" && document.getElementById("snackXP"), xp = Math.max(5, Math.round(Number(el && el.value) || SNACK_XP)); return { snack: { date: today, at: new Date().toISOString(), base, xp }, snackXP: xp }; }
  if (act === "snackStop") return { snack: null };
  if (act === "targetStart") return { target: { date: today, at: new Date().toISOString(), base, n: TARGET_MIN + Math.floor(Math.random() * (TARGET_MAX - TARGET_MIN + 1)), shown: false } };
  if (act === "targetReveal") return cls.target ? { "target.shown": true, "target.end": base, "target.endAt": new Date().toISOString() } : null;
  if (act === "snackEnd") return cls.snack ? { "snack.end": base, "snack.endAt": new Date().toISOString() } : null;
  if (act === "targetStop") return { target: null };
  if (act === "visitorToggle") return { visitorOff: !cls.visitorOff };
  if (act === "tickerToggle") return { tickerOn: !cls.tickerOn };
  return null;
}
