/* ---------- 🎁 Weekly Reward (one per student per week) ----------
   Ms. Ariana gives each student their OWN reward: a name, a subject, an XP amount and a picture.
   Saved on the student (teacher-only field): reward = { week: "YYYY-MM-DD" (Monday), sub: "m", xp: 200, name: "Slime Day", given: false }
   Each student's picture is its own small doc, classes/{class}/rewards/{studentId} = { img: "data:image/webp;base64,..." },
   so a student's page reads only its own picture (and the class roster stays small).
   Progress = that subject's XP this week (Mon-Sun, from xpHist[date].sub). The reward only counts in its own week. */
import { esc, weekKey } from "./game.js?v=20261026c";
import { SUB_NAMES } from "./teams.js?v=20261026c";
import { addDays, weekTotal, histWeekTotal, rewardFor } from "./doors.js?v=20261026c";

// "all" = every subject added up (the week's total XP), for students whose goal is total XP (like 600)
const NAMES = Object.assign({ all: "Total" }, SUB_NAMES);
export const RG_SUBS = NAMES;
export function rgOf(st, cls) {
  const g = st && st.reward;
  return rewardFor(st, cls) && NAMES[g.sub] ? g : null;
}
export function rgProgress(st, cls) {
  const g = rgOf(st, cls); return g ? subWeek(st, weekKey(cls), g.sub, cls) : 0;
}
export const rgDone = (st, cls) => { const g = rgOf(st, cls); return !!g && rgProgress(st, cls) >= Number(g.xp); };
export const rgWaiting = (students, cls) => students.filter(s => rgDone(s, cls) && !s.reward.given);
const pic = (img, g, cls) => img ? '<img class="' + cls + '" src="' + img + '" alt="' + esc((g && g.name) || "Reward") + '">' : '<span class="' + cls + ' rgemo">\u{1F381}</span>';
const bar = (n, goal, small) => '<div class="rgbar' + (small ? " sm" : "") + (n >= goal ? " full" : "") + '"><span style="width:' + Math.min(100, goal ? n / goal * 100 : 0) + '%"></span></div>';

// Student tab
export function rewardTab(st, cls, img) {
  const g = rgOf(st, cls);
  if (!g) return '<div class="card"><div class="card-head"><h2>\u{1F381} Weekly Reward</h2></div><p class="lede">No reward this week yet. Check back soon!</p></div>';
  const n = rgProgress(st, cls), goal = Number(g.xp), pct = Math.min(100, n / goal * 100), done = n >= goal, sub = NAMES[g.sub];
  return '<div class="card rgcard' + (done ? " done" : "") + '"><div class="card-head"><h2>\u{1F381} This week’s reward</h2><span class="fact">' + esc(sub) + "</span></div>" +
    '<div class="rgmain">' + pic(img, g, "rgpic") + '<div class="rgtext"><h3 class="rgname">' + esc(g.name || "Your reward") + "</h3>" +
    '<p class="lede">Earn <b>' + goal + " " + esc(sub) + " XP</b> this week to earn it!</p>" +
    '<p class="rgweek">Your ' + esc(sub) + ' XP this week</p>' + bar(n, goal) + '<p class="rgnum"><b>' + n + "</b> / " + goal + " " + esc(sub) + " XP" + (done ? " \u00b7 goal reached!" : " \u00b7 " + (goal - n) + " to go") + "</p>" +
    (g.given ? '<p class="rgmsg">✅ You got your reward. Great work!</p>' : done ? '<p class="rgmsg">\u{1F389} You earned it! Ms. Ariana will give you your reward.</p>' : "") +
    "</div></div></div>";
}
export const rewardBadge = (st, cls) => rgOf(st, cls) ? (rgDone(st, cls) && !st.reward.given ? ' <span class="tbadge">✓</span>' : "") : null;   // null = no tab this week

// Teacher: earned list + one row per student (name, subject, XP, picture, this week's bar)
export function rewardAdmin(students, cls, pics, busy) {
  const wk = weekKey(cls), kids = students.slice().sort((a, b) => String(a.fullName || a.name).localeCompare(String(b.fullName || b.name)));
  const subOpts = sel => '<option value="">Subject…</option><option value="all"' + (sel === "all" ? " selected" : "") + ">All subjects (total XP)</option>" + Object.entries(SUB_NAMES).map(([k, n]) => '<option value="' + k + '"' + (sel === k ? " selected" : "") + ">" + n + "</option>").join("");
  let h = "";
  h += '<div class="card"><div class="card-head"><h2>\u{1F48E} Treasure Vault rewards</h2><span class="fact">week of ' + esc(wk) + "</span></div>" +
    '<p class="lede" style="margin-bottom:10px;">Give each student their own reward: a name, a subject, an XP amount and a picture. Their subject XP from Monday to Sunday fills the bar. You’ll see a banner when someone earns it.</p>' +
    '<div class="row rgfill" style="gap:8px;align-items:center;margin-bottom:12px;"><b class="small">Fill everyone:</b><input id="rgFillName" type="text" maxlength="40" placeholder="Reward name" style="width:170px"><select id="rgFillSub">' + subOpts("") + '</select><input id="rgFillXp" type="number" min="1" step="10" placeholder="XP" style="width:90px"><button class="btn ghost small" data-act="rgFill">Fill all rows</button></div>' +
    ('<div id="rgUnsaved" class="banner warn" style="margin-bottom:10px;' + (Object.keys(busy.rgDraft || {}).length ? "" : "display:none;") + '">\u26A0\uFE0F <b>You have changes that aren\u2019t saved yet.</b> Students won\u2019t see them until you click <b>Save this week\u2019s rewards</b>.</div>') +
    '<div class="rgtable">' + kids.map(s => {
      const g = rewardFor(s, cls), d = Object.assign({ name: g ? g.name : "", sub: g ? g.sub : "", xp: g ? g.xp : "" }, (busy.rgDraft || {})[s.id] || {});
      const goal = Number(d.xp) || 0, n = d.sub ? subWeek(s, wk, d.sub, cls) : 0;
      return '<div class="rgtr"><label class="rgpicbtn" title="Pick a picture">' + pic(pics[s.id], g, "rgthumb") + '<input type="file" accept="image/*" hidden data-rgpic="' + s.id + '"></label>' +
        '<div class="rgcol"><div class="row" style="gap:8px;align-items:center;"><span class="rgn">' + esc(s.name) + '</span><input id="rgName-' + s.id + '" data-rgf="name" type="text" maxlength="40" placeholder="Reward name" value="' + esc(String(d.name || "")) + '" style="flex:1;min-width:150px">' +
        '<select id="rgSub-' + s.id + '" data-rgf="sub">' + subOpts(d.sub) + '</select><input id="rgXp-' + s.id + '" data-rgf="xp" type="number" min="1" step="10" placeholder="XP" value="' + esc(String(d.xp)) + '" style="width:90px"></div>' +
        (d.sub && goal ? '<div class="row" style="gap:10px;align-items:center;margin-top:4px;">' + bar(n, goal, true) + '<span class="small muted rgnn">' + n + " / " + goal + " " + NAMES[d.sub] + " XP" + (g && n >= goal ? (((s.vault || {})[wk]) === "open" ? " \u00b7 \u{1F48E} vault opened" : " \u00b7 \u{1F389} goal reached!") : "") + "</span></div>" : "") + "</div></div>";
    }).join("") + "</div>" +
    '<div class="row" style="margin-top:12px;"><button class="btn" data-act="rgSave">\u{1F4BE} Save this week’s rewards</button><span class="muted small">Tap the \u{1F381} square to add a picture. Leave XP empty to give a student the normal 1,000 XP vault this week. The reward name is optional.</span></div></div>';
  return h;
}
function subWeek(st, wk, sub, cls) {
  if (sub === "all") return wk === weekKey(cls) ? weekTotal(st, cls) : histWeekTotal(st, wk);
  let n = 0; for (let i = 0; i < 7; i++) { const h = ((st.xpHist || {})[addDays(wk, i)]) || {}; n += Number((h.sub || {})[sub]) || 0; } return Math.round(n);
}

// Shrinks a picture to at most 280px so each student's picture doc stays small (kept small to save space and reads).
export function shrinkImage(file, max) {
  return new Promise((ok, bad) => {
    const r = new FileReader();
    r.onerror = () => bad(new Error("Couldn’t read that picture."));
    r.onload = () => { const im = new Image(); im.onerror = () => bad(new Error("That file isn’t a picture.")); im.onload = () => {
      const s = Math.min(1, (max || 280) / Math.max(im.width, im.height)), c = document.createElement("canvas"); c.width = Math.round(im.width * s); c.height = Math.round(im.height * s);
      c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
      let url = c.toDataURL("image/webp", 0.8); if (!/^data:image\/webp/.test(url)) url = c.toDataURL("image/jpeg", 0.8);
      ok(url); }; im.src = r.result; };
    r.readAsDataURL(file);
  });
}
