/* ---------- ☀️ Morning mode / 🌇 Afternoon mode (Nov 16, Ms. Ariana) ----------
   One Start button walks her through the console in order, with a ◀ Back / Next ▶ bar that stays at the top:
     ☀️ Morning:   ⬆️ Level-ups → 🕵️ Secret Students → 📣 Shoutouts → 📰 Announcements → 🎡 Spin wheel → 🦆 Duck Showdown → ⚔️ Battle (or the event screen) → 👑 120 XP VIP Party
     🌇 Afternoon: 📣 Shoutouts (+ 🚀 replay today's rockets) → 📰 Announcements → ⚔️ Boss attacks (or the event screen) → 🎈 60 XP Party
   📺 The Student screen: a second tab of the console (?screen=1) she shares/projects. It shows what students see and follows
   the step she is on (the Keep, the announcements, the Battle Area or event screen, the party). Her controls stay in this tab.
   The step lives on the class doc (cls.mm = { on, k, i, id }), one small write per step.
   📰 "Pop it open on every screen": cls.newsShow = { id, open } puts the announcements over every student's page until
   she closes it (students can tap "Got it" to close it on their own screen). */
import { esc, battleOn } from "./game.js?v=20261117m";
import { soloOn } from "./solobrew.js?v=20261117m";
import { azToday } from "./collect.js?v=20261117m";
import { newsPage, shownNews } from "./news.js?v=20261117m";
import { secretBanner } from "./secret.js?v=20261117m";
import { p120On, p60On } from "./party.js?v=20261117m";

export const MM_STEPS = {
  am: [
    { k: "lvl", ic: "⬆️", t: "Level-ups", tab: "daily", card: "lvCard", tip: "Show the level-up shoutout from the card below (it pops up on every screen)." },
    { k: "secret", ic: "\u{1F575}\uFE0F", t: "Secret Students", tab: "daily", card: "secretCard", tip: "Reveal the Secret Student winners (they get their prize and the Keep shouts them out)." },
    { k: "shout", ic: "\u{1F4E3}", t: "Shoutouts", tab: "daily", card: "shoutCard", tip: "Check the names, then tap “Show on every screen”." },
    { k: "news", ic: "\u{1F4F0}", t: "Announcements", tab: "daily", card: "newsCard", tip: "Pop the announcements open on every screen to read them together." },
    { k: "spin", ic: "\u{1F3A1}", t: "Spin wheel", tab: "daily", card: "spinCard", tip: "Pick the spin, then spin it on everyone’s screen." },
    { k: "sd", ic: "\u{1F986}", t: "Duck Showdown", tab: "daily", card: "sdCard", tip: "Turn on Show to students, then open the Duck Showdown." },
    { k: "battle", ic: "⚔️", t: "Battle", tab: "events", card: "", tip: "" },
    { k: "party", ic: "\u{1F451}", t: "120 XP Party", tab: "daily", card: "partyCard", party: "120", tip: "Start the VIP Party. The student screen opens the party when it starts." },
    { k: "check", ic: "\u2705", t: "Checklist", tab: "daily", card: "", pop: "check", tip: "Open everyone\u2019s Checklist on their own screen so they see what to do today." },
    { k: "vault", ic: "\u{1F510}", t: "Treasure Vault", tab: "daily", card: "vaultWeekCard", pop: "vault", tip: "Open everyone\u2019s Treasure Vault on their screen to check their progress for the week." }],
  pm: [
    { k: "shout", ic: "\u{1F4E3}", t: "Shoutouts", tab: "daily", card: "shoutCard", rockets: true, tip: "Show the shoutouts, then blast off today’s rockets." },
    { k: "news", ic: "\u{1F4F0}", t: "Announcements", tab: "daily", card: "newsCard", tip: "Pop the announcements open on every screen to read them together." },
    { k: "sd", ic: "\u{1F986}", t: "Duck Showdown", tab: "daily", card: "sdCard", tip: "Turn on Show to students, then open the Duck Showdown." },
    { k: "battle", ic: "⚔️", t: "Boss attacks", tab: "events", card: "", tip: "" },
    { k: "party", ic: "\u{1F388}", t: "60 XP Party", tab: "daily", card: "partyCard", party: "60", tip: "Start the 60 XP Party. The student screen opens the party when it starts." }]
};
export const MM_NAME = { am: "☀️ Morning mode", pm: "\u{1F307} Afternoon mode" };

export function mmState(cls) {
  const m = cls && cls.mm; if (!m || !m.on || !MM_STEPS[m.k]) return null;
  const steps = MM_STEPS[m.k], i = Math.max(0, Math.min(steps.length - 1, Number(m.i) || 0));
  return { k: m.k, i, id: m.id || "", steps, step: steps[i], last: i === steps.length - 1 };
}
// what the battle step shows today: an event screen (pie table / feast / cauldron …), the Battle Area, or nothing
export const battleKind = cls => { const s = soloOn(cls), b = battleOn(cls); if (s && b) return cls.mm && cls.mm.v === "battle" ? "battle" : "solo"; return s ? "solo" : b ? "battle" : "none"; };
export const launchedToday = students => (students || []).filter(s => s.companionId && !s.isTeacher && s.planet && s.planet.last === azToday());

/* ---------- console: the Start card (top of the Daily tab) ---------- */
export function mmStartCard(cls) {
  if (!cls || mmState(cls)) return "";
  const pm = new Date().getHours() >= 12;
  return '<div class="card mmstart"><div class="card-head"><h2>\u{1F9ED} Guided modes</h2><span class="fact">Back / Next through the day</span></div>' +
    '<div class="row" style="gap:8px;flex-wrap:wrap;">' +
    '<button class="btn' + (pm ? " ghost" : " gold") + '" data-act="mmStart" data-k="am">☀️ Start Morning</button>' +
    '<button class="btn' + (pm ? " gold" : " ghost") + '" data-act="mmStart" data-k="pm">\u{1F307} Start Afternoon</button>' +
    '<button class="btn ghost" data-act="mmScreen">\u{1F4FA} Open the student screen</button>' +
    '<button class="btn ghost small" data-act="mmDiveTest" title="Only on this screen. Nothing is saved.">\u{1FAE7} Test the sub dive</button></div>' +
    '<p class="small muted" style="margin:8px 0 0;">The <b>student screen</b> opens in a new tab: drag it to your projector or share that tab. It follows the step you are on while your controls stay here.</p></div>';
}

/* ---------- console: the Back / Next bar ---------- */
export function mmBar(cls, students) {
  const S = mmState(cls); if (!S) return "";
  const st = S.step, bits = [];
  if (st.k === "news") {
    const n = shownNews(cls).length, open = !!(cls.newsShow && cls.newsShow.open);
    bits.push(open ? '<span class="small">\u{1F4FA} Open on every screen.</span><button class="btn small danger" data-act="mmNewsClose">✖ Close it on every screen</button>'
      : '<button class="btn small gold" data-act="mmNewsOpen"' + (n ? "" : " disabled") + ">\u{1F4FA} Pop " + (n === 1 ? "it" : "them") + " open on every screen</button>" + '<span class="small muted">' + n + " showing</span>");
  }
  if (st.pop) { const P = cls.popShow, done = P && P.page === st.pop && Date.now() - (Number(P.t) || 0) < 15 * 60000;
    bits.push('<button class="btn small gold" data-act="mmPop" data-v="' + st.pop + '">\u{1F4FA} Open ' + (st.pop === "check" ? "the Checklist" : "the Treasure Vault") + " on every screen</button>" + (done ? '<span class="small">\u2705 Opened</span>' : "")); }
  if (st.rockets) {
    const l = launchedToday(students);
    bits.push('<button class="btn small gold" data-act="mmRockets"' + (l.length ? "" : " disabled") + ">\u{1F680} Blast off today’s rockets (" + l.length + ")</button>");
  }
  let tip = st.tip;
  if (st.k === "battle") {
    const bk = battleKind(cls);
    if (soloOn(cls) && battleOn(cls)) bits.push(bk === "solo" ? '<button class="btn small" data-act="mmView" data-v="battle">\u2694\uFE0F Show the Battle Area instead</button>' : '<button class="btn small" data-act="mmView" data-v="solo">\u{1F4FA} Show the event screen instead</button>');
    tip = bk === "solo" ? "The event screen is on the student screen. Watch the class add to it!" : bk === "battle" ? "The Battle Area is on the student screen for " + (S.k === "am" ? "morning attacks." : "boss attacks.") : "No battle or event is on right now. Tap Next.";
  }
  if (st.party) {
    const on = st.party === "120" ? p120On(cls) : p60On(cls);
    if (on) tip = "\u{1F389} The party is on! The student screen shows the party floor.";
  }
  return '<div class="mmbar" role="region" aria-label="' + esc(MM_NAME[S.k]) + '"><div class="mmtop"><b>' + MM_NAME[S.k] + "</b>" +
    '<div class="mmsteps">' + S.steps.map((x, i) => '<button class="mmpill' + (i === S.i ? " on" : i < S.i ? " done" : "") + '" data-act="mmGo" data-i="' + i + '" title="' + esc(x.t) + '">' + x.ic + "<span>" + esc(x.t) + "</span></button>").join("") + "</div>" +
    '<button class="btn ghost small" data-act="mmScreen" title="Open the student screen in a new tab">\u{1F4FA}</button><button class="btn ghost small" data-act="mmEnd">✖ End</button></div>' +
    '<div class="mmrow"><button class="btn ghost mmnav" data-act="mmBack"' + (S.i ? "" : " disabled") + ">◀ Back</button>" +
    '<div class="mmnow"><small>Step ' + (S.i + 1) + " of " + S.steps.length + "</small><b>" + st.ic + " " + esc(st.t) + "</b>" + (tip ? "<span>" + esc(tip) + "</span>" : "") + (bits.length ? '<div class="row mmbits">' + bits.join("") + "</div>" : "") + "</div>" +
    '<button class="btn gold mmnav" data-act="mmNext">' + (S.last ? "✅ Finish" : "Next ▶") + "</button></div></div>";
}

/* ---------- the student screen tab: a small label in the corner ---------- */
export function mmScreenChip(cls) {
  const S = mmState(cls);
  return '<div class="mmchip">\u{1F4FA} ' + (S ? esc(MM_NAME[S.k]) + " · " + S.step.ic + " " + esc(S.step.t) : "Student screen") + "</div>";
}
export function mmNewsScreen(cls, students, pics) {
  return '<div class="mmnews"><h1>\u{1F4F0} Announcements</h1>' + newsPage(null, cls, students, pics, true, secretBanner(cls)) + "</div>";   // 🕵️ Secret Students winners at the top
}

/* ---------- 📰 announcements popped open on every screen ---------- */
let nRoot = null, nShown = "", nHtml = "";
const nDone = {};
// o = { cls, st, students, pics, teacher, skip, close(), seen() }
export function newsPopSync(o) {
  const N = o && o.cls && o.cls.newsShow;
  if (!N || !N.open || !N.id || nDone[N.id] || o.skip) { if (nRoot) { nRoot.remove(); nRoot = null; nShown = ""; nHtml = ""; } return; }
  newsCtx = o;
  if (!nRoot) { nRoot = document.createElement("div"); nRoot.id = "nwroot"; document.body.appendChild(nRoot); }
  const html = '<div class="nwbox"><div class="nwhead"><h1>\u{1F4E3} Announcements</h1>' +
    (o.teacher ? '<button class="btn danger" data-nwpop="close">✖ Close it on every screen</button>' : '<button class="btn gold" data-nwpop="ok">✔ Got it</button>') + "</div>" +
    '<div class="nwlist">' + newsPage(o.st || null, o.cls, o.students, o.pics, !!o.teacher || !o.st, secretBanner(o.cls)) + "</div></div>";
  if (html !== nHtml) { const l = nRoot.querySelector(".nwlist"), top = l ? l.scrollTop : 0; nRoot.innerHTML = html; nHtml = html; const l2 = nRoot.querySelector(".nwlist"); if (l2) l2.scrollTop = top; }
  if (nShown !== N.id) { nShown = N.id; if (o.seen) try { o.seen(); } catch (e) {} }
}
let newsCtx = null;
if (typeof document !== "undefined") document.addEventListener("click", ev => {
  const b = ev.target.closest && ev.target.closest("[data-nwpop]"); if (!b) return;
  const N = newsCtx && newsCtx.cls && newsCtx.cls.newsShow;
  if (b.dataset.nwpop === "ok") { if (N) nDone[N.id] = 1; if (nRoot) { nRoot.remove(); nRoot = null; nShown = ""; nHtml = ""; } return; }
  if (b.dataset.nwpop === "close" && newsCtx && newsCtx.close) newsCtx.close();
});
