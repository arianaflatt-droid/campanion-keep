/* ---------- 🎟️ Season Pass ----------
   A new pass every month (Arizona dates), themed to that month's event. One track for everyone.
   Pass points are worked out from data the app already saves (nothing extra to cheat):
     120 XP day +10 · Morning Quest finished +2 · door opened +2 · Treasure Vault opened +15 · new badge +5
   20 tiers, 25 points each by default (500 to finish; cls.passStep changes it). Rewards: eggs (better toward the top), pass-only room decor at tiers 5/10/15,
   and at tier 20 a Legendary egg + the pass badge + a title on The Keep.
   Saved on the student: pass = { "YYYY-MM": [claimed tiers] }, passTitle (the newest title), mqDays { date: quests finished }.
   Ms. Ariana can switch it off (cls.passOff). */
import { esc, goalXP } from "./game.js?v=20261013a";
import { azToday, doPull, formOf, sparkleImg } from "./collect.js?v=20261013a";
import { PASS_DECOR, itemArt as roomArt } from "./room.js?v=20261013a";

export const PASS_START = "2026-10";          // the first pass
export const PASS_TIERS = 20, PASS_STEP = 25;   // points per tier (Ms. Ariana can change it: cls.passStep)
export const stepOf = cls => Number(cls && cls.passStep) || PASS_STEP;
export const PASS_PTS = { goal: 10, mq: 2, door: 2, vault: 15, badge: 5 };
const MONTH_THEME = { 1: "frost", 2: "heart", 3: "lucky", 4: "spring", 5: "spring", 6: "summer", 7: "summer", 8: "school", 9: "school", 10: "haunt", 11: "gobble", 12: "jingle" };
export const PASS_THEMES = {
  haunt: { name: "Haunt-O-Ween Pass", icon: "\u{1F383}", title: "\u{1F383} Haunt Pass Champion" },
  gobble: { name: "Gobble-Palooza Pass", icon: "\u{1F983}", title: "\u{1F983} Gobble Pass Champion" },
  jingle: { name: "Jingle Jam Pass", icon: "\u{1F384}", title: "\u{1F384} Jingle Pass Champion" },
  frost: { name: "Frostbite Festival Pass", icon: "❄️", title: "❄️ Frostbite Pass Champion" },
  heart: { name: "Sweetheart Pass", icon: "\u{1F498}", title: "\u{1F498} Sweetheart Pass Champion" },
  lucky: { name: "Lucky Pass", icon: "☘️", title: "☘️ Lucky Pass Champion" },
  spring: { name: "Spring Pass", icon: "\u{1F337}", title: "\u{1F337} Spring Pass Champion" },
  summer: { name: "Summer Pass", icon: "☀️", title: "☀️ Summer Pass Champion" },
  school: { name: "Back-to-School Pass", icon: "\u{1F4DA}", title: "\u{1F4DA} School Pass Champion" }
};
// What each tier gives: an egg rarity, a decor piece (0-2 = the month's 3 pieces), or the final prize
const TRACK = ["Common", "Common", "Uncommon", "Uncommon", 0, "Uncommon", "Rare", "Uncommon", "Rare", 1, "Rare", "Rare", "Super Rare", "Rare", 2,
  "Super Rare", "Rare", "Super Rare", "Super Rare", "final"];
const EGG_IMG = { Common: "assets/egg-common.webp", Uncommon: "assets/egg-uncommon.webp", Rare: "assets/egg-rare.webp", "Super Rare": "assets/egg-superrare.webp" };
const EGG_ICON = { Common: "\u{1F95A}", Uncommon: "\u{1F95A}", Rare: "\u{1F48E}", "Super Rare": "\u{1F31F}" };

export const passKey = date => (date || azToday()).slice(0, 7);
export const themeOf = key => MONTH_THEME[Number(String(key).slice(5, 7))] || "school";
export const passOf = key => Object.assign({ key, theme: themeOf(key) }, PASS_THEMES[themeOf(key)]);
export const decorId = (theme, i) => PASS_DECOR[theme][i][0] + "_pass" + theme;
export function tierReward(key, tier) {
  const r = TRACK[tier - 1], th = themeOf(key);
  if (r === "final") return { kind: "final", icon: "\u{1F451}", label: "Legendary egg + badge + title", img: "assets/egg-legendary.webp" };
  if (typeof r === "number") return { kind: "decor", id: decorId(th, r), icon: "\u{1F6CB}️", label: PASS_DECOR[th][r][1], img: roomArt(decorId(th, r)) };
  return { kind: "egg", rarity: r, icon: EGG_ICON[r], label: r + " egg", img: EGG_IMG[r] };
}
const inMonth = (date, key) => String(date).slice(0, 7) === key;
const azDateOf = iso => { try { return azToday(new Date(iso)); } catch (e) { return ""; } };

// How many points a student has on one month's pass, and where they came from
export function passPoints(st, cls, key) {
  key = key || passKey();
  const goal = goalXP(cls), h = (st && st.xpHist) || {}, n = { goal: 0, mq: 0, door: 0, vault: 0, badge: 0 };
  Object.keys(h).forEach(date => { if (!inMonth(date, key)) return; const x = h[date] || {};
    if (x.lh || Math.max(Number(x.d) || 0, Number(x.l) || 0) >= goal) n.goal++; });
  const mqd = Object.assign({}, (st && st.mqDays) || {}), m = st && st.mq;
  if (m && m.date) mqd[m.date] = Math.max(mqd[m.date] || 0, Object.keys(m.done || {}).length);
  Object.keys(mqd).forEach(date => { if (inMonth(date, key)) n.mq += Number(mqd[date]) || 0; });
  Object.keys((st && st.doors) || {}).forEach(date => { if (!inMonth(date, key)) return;
    Object.keys(st.doors[date] || {}).forEach(i => { if (i !== "g" && (st.doors[date][i] || {}).st === "open") n.door++; }); });
  Object.keys((st && st.vault) || {}).forEach(wk => { if (inMonth(wk, key) && st.vault[wk] === "open") n.vault++; });
  Object.keys((st && st.badges) || {}).forEach(id => { if (!id.startsWith("pass-") && inMonth(azDateOf(st.badges[id]), key)) n.badge++; });
  const total = Object.keys(n).reduce((t, k) => t + n[k] * PASS_PTS[k], 0);
  return { n, total, tier: Math.min(PASS_TIERS, Math.floor(total / stepOf(cls))) };
}
export const claimed = (st, key) => ((st && st.pass) || {})[key] || [];
const lastMonth = () => { const d = new Date(azToday() + "T12:00:00"); d.setDate(1); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 7); };
// Tiers earned but not claimed yet (this month, plus last month's leftovers)
export function readyTiers(st, cls, key) {
  if (key < PASS_START) return [];
  const p = passPoints(st, cls, key), have = claimed(st, key), out = [];
  for (let t = 1; t <= p.tier; t++) if (!have.includes(t)) out.push(t);
  return out;
}
export function passReady(st, cls) {
  if (!st || (cls && cls.passOff)) return 0;
  return readyTiers(st, cls, passKey()).length + readyTiers(st, cls, lastMonth()).length;
}
// The pass badge: finished a pass of that theme (any year)
export const passDone = (st, theme) => Object.keys((st && st.pass) || {}).some(k => themeOf(k) === theme && claimed(st, k).includes(PASS_TIERS)) ? 1 : 0;

/* ---------- the tab ---------- */
let fx = null;   // the reward being shown { icon, img, title, sub }
const daysLeft = () => { const t = azToday(), d = new Date(t + "T12:00:00"), end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 12); return Math.round((end - d) / 864e5) + 1; };
function trackHTML(st, cls, key, past) {
  const p = passPoints(st, cls, key), have = claimed(st, key), P = passOf(key);
  let h = '<div class="passtrack">';
  for (let t = 1; t <= PASS_TIERS; t++) {
    const r = tierReward(key, t), got = have.includes(t), ready = !got && t <= p.tier;
    if (past && !ready) continue;
    h += '<div class="ptier' + (got ? " got" : ready ? " ready" : "") + (r.kind === "final" ? " final" : r.kind === "decor" ? " decor" : "") + '"><span class="ptnum">' + t + "</span>" +
      (r.img ? '<img class="ptimg" src="' + esc(r.img) + '" alt="">' : '<span class="ptic">' + (r.kind === "final" ? P.icon : r.icon) + "</span>") +
      '<span class="ptlbl">' + esc(r.label) + "</span>" +
      (got ? '<span class="ptdone">✅</span>' : ready ? '<button class="btn small" data-passclaim="' + key + ":" + t + '">Claim!</button>' : '<span class="ptpts">' + t * stepOf(cls) + " pts</span>") + "</div>";
  }
  return h + "</div>";
}
export function passTab(st, cls) {
  if (cls && cls.passOff) return '<div class="card"><p class="lede">The Season Pass is taking a break right now.</p></div>';
  const key = passKey(), P = passOf(key), p = passPoints(st, cls, key), pts = p.total, next = Math.min(PASS_TIERS, p.tier + 1);
  const pct = Math.min(100, pts / (PASS_TIERS * stepOf(cls)) * 100), dl = daysLeft();
  let h = '<div class="card passcard pass-' + P.theme + '"><div class="card-head"><h2>' + P.icon + " " + esc(P.name) + '</h2><span class="fact">' + dl + " day" + (dl === 1 ? "" : "s") + " left</span></div>" +
    '<p class="lede">Earn pass points all month to climb 20 tiers of rewards! Finish the pass for a <b>Legendary egg</b>, the <b>' + esc(P.name) + "</b> badge and the title <b>" + esc(P.title) + "</b>.</p>" +
    '<div class="passbar"><span style="width:' + pct.toFixed(1) + '%"></span><b>' + pts + " / " + PASS_TIERS * stepOf(cls) + " pts</b></div>" +
    '<p class="small" style="margin-top:4px;">' + (p.tier >= PASS_TIERS ? "\u{1F3C6} You finished the pass!" : "Tier <b>" + p.tier + "</b> of 20 · <b>" + (next * stepOf(cls) - pts) + "</b> more points to tier " + next) + "</p>" +
    '<div class="passways">' + [["goal", "⭐", "120 XP day"], ["mq", "\u{1F305}", "Morning Quest"], ["door", "\u{1F6AA}", "Door opened"], ["vault", "\u{1F510}", "Treasure Vault"], ["badge", "\u{1F3C5}", "New badge"]]
      .map(([k, i, l]) => '<span class="pway">' + i + " " + l + " <b>+" + PASS_PTS[k] + "</b><small>" + p.n[k] + " this month</small></span>").join("") + "</div>" +
    trackHTML(st, cls, key) + "</div>";
  const lm = lastMonth();
  if (readyTiers(st, cls, lm).length) h += '<div class="card"><div class="card-head"><h2>' + passOf(lm).icon + " Leftover rewards from the " + esc(passOf(lm).name) + '</h2><span class="fact">claim them before they’re gone</span></div>' + trackHTML(st, cls, lm, true) + "</div>";
  return h;
}
export function passOverlay() {
  if (!fx) return "";
  return '<div class="qbover passover"><div class="qbpanel win mqresult">' + (fx.img ? '<img class="mqresimg' + (fx.sparkle ? " sparkle" : "") + '" src="' + esc(fx.img) + '" alt="">' : '<div class="mqemoji big">' + fx.icon + "</div>") +
    "<h3>" + fx.title + "</h3>" + (fx.sparkle ? '<p class="mqsparkle">✨ SPARKLE! ✨</p>' : "") + (fx.sub ? "<p>" + fx.sub + "</p>" : "") +
    (fx.saved ? '<button class="btn big" data-passok="1">Yay! \u{1F389}</button>' : '<p class="muted">Saving…</p>') + "</div></div>";
}
export const passBusy = () => !!fx;

/* ---------- clicks (c = { me, cls, patch, render, flash }) ---------- */
export async function passClick(el, c) {
  if (el.dataset.passok) { fx = null; return c.render(true); }
  const [key, tStr] = String(el.dataset.passclaim || "").split(":"), t = Number(tStr), s = c.me;
  if (!key || !t || fx || (c.cls && c.cls.passOff)) return;
  if (!readyTiers(s, c.cls, key).includes(t)) return;
  const r = tierReward(key, t), P = passOf(key), data = { pass: Object.assign({}, s.pass || {}, { [key]: claimed(s, key).concat([t]).sort((a, b) => a - b) }) };
  if (r.kind === "egg" || r.kind === "final") {
    const res = doPull(s, r.kind === "final" ? "Legendary" : r.rarity, c.cls, { noEvent: true }), cr = formOf(res.fam, res.lvl);
    data.coll = res.coll;
    fx = { img: res.sparkle ? sparkleImg(cr) : cr.img, sparkle: res.sparkle, title: (res.dupe ? "Another " : "You hatched a ") + "<b>" + esc(cr.name) + "</b>!",
      sub: (r.kind === "final" ? "Legendary" : r.rarity) + (res.dupe ? " · it went up a level" : " · it’s in your Creature Collector") };
    if (r.kind === "final") { data.passTitle = P.title; fx.sub += "<br><b>\u{1F3C6} You finished the " + esc(P.name) + "!</b> You earned the badge and the title <b>" + esc(P.title) + "</b>."; }
  } else {
    data.roomOwned = ((s.roomOwned || []).includes(r.id) ? s.roomOwned : (s.roomOwned || []).concat([r.id]));
    fx = { img: r.img, title: "New room decor: <b>" + esc(r.label) + "</b>!", sub: "Only from the " + esc(P.name) + ". Put it in your room: \u{1F6CF}️ My Room → Decorate." };
  }
  c.render(true);
  try { await c.patch(data, true); Object.assign(s, data); fx.saved = true; }
  catch (e) { fx = null; c.flash("That reward didn’t save — tell Ms. Ariana! (" + (e.code || e.message) + ")"); }
  c.render(true);
}

/* ---------- teacher ---------- */
export function passAdmin(students, cls) {
  const key = passKey(), P = passOf(key);
  const rows = students.filter(s => s.companionId).map(s => ({ s, p: passPoints(s, cls, key) })).sort((a, b) => b.p.total - a.p.total);
  return '<div class="card"><div class="card-head"><h2>\u{1F39F}️ ' + esc(P.name) + '</h2><span class="fact">' + rows.filter(r => r.p.tier >= PASS_TIERS).length + " finished</span></div>" +
    '<p class="lede" style="font-size:13px;">A new pass every month. Points: 120 XP day +10 · Morning Quest +2 · door +2 · Treasure Vault +15 · new badge +5. 20 tiers × ' + stepOf(cls) + ' points = ' + stepOf(cls) * 20 + ' to finish. Tiers already claimed stay claimed.</p>' +
    '<div class="row" style="margin:6px 0;gap:6px;flex-wrap:wrap;align-items:center;"><span class="small">Points per tier:</span>' + [15, 20, 25, 30, 35, 40].map(v => '<button class="btn small' + (stepOf(cls) === v ? "" : " ghost") + '" data-act="passStep" data-v="' + v + '">' + v + " (" + v * 20 + " total)</button>").join("") + "</div>" +
    '<div class="row" style="margin:6px 0;"><button class="btn ghost small" data-act="passToggle">' + (cls.passOff ? "▶️ Turn the Season Pass on" : "⏸️ Turn the Season Pass off") + "</button></div>" +
    '<div class="passadmin">' + rows.map(r => '<span class="pa"><b>' + esc(r.s.name) + "</b> tier " + r.p.tier + " <small>(" + r.p.total + " pts)</small></span>").join("") + "</div></div>";
}
