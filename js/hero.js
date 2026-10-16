/* ---------- ⚔️ Hero Quest (Embervale) ----------
   Students make a hero, train skills with minigames and play a weekly story quest.
   - Every 120 XP (the daily goal) since HERO_START = 1 training session (no daily limit).
   - Training only works on the skills the student's NEXT quest needs, so a normal week always gets them ready.
   - Hitting the weekly goal (the Weekly Door goal, 600 unless changed) = 1 quest. Double the goal in a week = 2 (catch-up).
   - A student who misses a week keeps their training and plays that quest later.
   Saved on the student (one write per action): hero = { name, path, look, color, sk: { skill: xp }, used, done: [quest ids],
   items: [ids], title, at }. Nothing saves while a minigame or story is being played; it saves when it finishes. */
import { esc, petHTML, companionOf, WEEK_DOOR_XP, weekKey, weekGoal } from "./game.js?v=20261016c";
import { dayXPs, azToday } from "./collect.js?v=20261016c";
import { weekTotal, histWeekTotal, mondayOf, addDays } from "./doors.js?v=20261016c";

export const HERO_START = "2026-10-19";
export const heroOn = cls => !(cls && cls.heroOff);
const startOf = cls => (cls && cls.heroStart) || HERO_START;

export const SKILLS = {
  combat: { n: "Combat", i: "\u{1F5E1}️", game: "bar", verb: "Strike!", what: "Hit the training dummy when the marker is in the gold zone." },
  agility: { n: "Agility", i: "\u{1F3C3}", game: "run", verb: "Jump!", what: "Jump over the hurdles on the castle obstacle course." },
  woodcut: { n: "Woodcutting", i: "\u{1FA93}", game: "bar", verb: "Chop!", what: "Chop when the marker is in the gold zone." },
  cooking: { n: "Cooking", i: "\u{1F373}", game: "seq", what: "Watch the recipe, then add the ingredients in the same order.", icons: ["\u{1F955}", "\u{1F9C5}", "\u{1F344}", "\u{1F9C0}", "\u{1F95A}", "\u{1F33F}"] },
  fishing: { n: "Fishing", i: "\u{1F3A3}", game: "bar", verb: "Reel!", what: "Reel in when the marker is in the gold zone." },
  crafting: { n: "Crafting", i: "\u{1F528}", game: "seq", what: "Watch the pattern, then build it in the same order.", icons: ["\u{1FAB5}", "\u{1FAA8}", "\u{1F529}", "\u{1F9F5}", "\u{1F48E}", "\u{1FA9D}"] },
  mining: { n: "Mining", i: "⛏️", game: "bar", verb: "Swing!", what: "Swing your pickaxe when the marker is in the gold zone." },
  magic: { n: "Magic", i: "\u{1F52E}", game: "seq", what: "Watch the runes light up, then cast them in the same order.", icons: ["☀️", "\u{1F319}", "⭐", "\u{1F525}", "\u{1F4A7}", "⚡"] }
};
export const SKILL_IDS = Object.keys(SKILLS);
// Level L -> L+1 costs 30 + 10*L skill XP. A session gives 30-60 XP (score based), so 5 sessions (150+) always reach a quest.
const cost = L => 30 + 10 * L;
export function levelOf(xp) { let L = 1, left = Math.max(0, Number(xp) || 0); while (L < 50 && left >= cost(L)) { left -= cost(L); L++; } return { lvl: L, into: left, need: L >= 50 ? 0 : cost(L) }; }
export const sessionXP = score => 30 + Math.round(30 * Math.max(0, Math.min(1, score)));

export const PATHS = {
  knight: { n: "Knight", i: "\u{1F6E1}️", d: "Brave and strong.", sk: ["combat", "mining"] },
  mage: { n: "Mage", i: "\u{1FA84}", d: "Clever with spells.", sk: ["magic", "crafting"] },
  ranger: { n: "Ranger", i: "\u{1F3F9}", d: "At home in the wild.", sk: ["fishing", "woodcut"] },
  rogue: { n: "Rogue", i: "\u{1F5DD}️", d: "Quick and sneaky.", sk: ["agility", "cooking"] }
};
const PATH_BONUS = 40;   // +1 level in each path skill to start
export const LOOKS = ["\u{1F9D1}", "\u{1F466}", "\u{1F467}", "\u{1F9D1}‍\u{1F9B1}", "\u{1F469}‍\u{1F9B0}", "\u{1F468}‍\u{1F9B1}", "\u{1F9D5}", "\u{1F9D1}‍\u{1F9B3}"];   // placeholders until portrait art
export const COLORS = ["#C0392B", "#2E6FD8", "#2E9E5B", "#8E44AD", "#E67E22", "#1ABC9C", "#D4AC0D", "#34495E"];

/* ---------- Book 1: The Shattered Crown of Embervale ----------
   wk = the Monday the quest opens. req = skill levels needed to start. Quests without a story yet show "coming". */
export const BOOK1 = { n: "The Shattered Crown of Embervale", icon: "\u{1F451}" };
export const QUESTS = [
  { id: "b1q1", wk: "2026-10-19", n: "Squire's Oath", sk: ["combat", "agility"], req: { combat: 2, agility: 2 }, art: "\u{1F3F0}" },
  { id: "b1q2", wk: "2026-10-26", n: "The Whispering Woods", sk: ["woodcut", "cooking"], req: { woodcut: 2, cooking: 2 }, art: "\u{1F332}" },
  { id: "b1q3", wk: "2026-11-02", n: "The Flooded Mill", sk: ["fishing", "crafting"], req: { fishing: 2, crafting: 2 }, art: "\u{1F30A}" },
  { id: "b1q4", wk: "2026-11-09", n: "The Iron Mines of Grimhold", sk: ["mining", "combat"], req: { mining: 3, combat: 3 }, art: "⛏️" },
  { id: "b1q5", wk: "2026-11-16", n: "The Wizard's Tower", sk: ["magic", "agility"], req: { magic: 3, agility: 3 }, art: "\u{1F9D9}" },
  { id: "b1q6", wk: "2026-11-30", n: "The Harvest Festival Feast", sk: ["cooking", "crafting"], req: { cooking: 3, crafting: 3 }, art: "\u{1F967}" },
  { id: "b1q7", wk: "2026-12-07", n: "The Dragon's Pass", sk: ["agility", "magic", "fishing"], req: { agility: 4, magic: 3, fishing: 3 }, art: "\u{1F3D4}️" },
  { id: "b1q8", wk: "2026-12-14", n: "The Duskwarden's Keep", sk: ["combat", "magic", "mining"], req: { combat: 4, magic: 4, mining: 3 }, art: "\u{1F311}" }
];
// The stories. {P} = companion name, {H} = hero name. A choice with sk+lv needs that level; bonus choices give an extra reward.
export const STORIES = {
  b1q1: [
    { t: "The bells of <b>Keepstone Castle</b> ring across the hills of Embervale. Today is your Squire Trial! Old <b>Captain Rowan</b> taps his staff in the training yard. “So you want to protect the kingdom, {H}? Show me.” {P} bounces at your heels, ready to help.",
      c: [{ x: "Step into the training yard", go: 1 }] },
    { t: "<b>The Trial of the Blade.</b> A straw knight stands in the center of the yard, wobbling on its post. “Knock it down,” says the Captain, “but fight with your head, not just your arms.”",
      c: [{ x: "Strike the straw knight", sk: "combat", lv: 2, r: "THWACK! The straw knight spins and topples over. The Captain nods. “Not bad.”", go: 2 },
        { x: "Disarm it with a perfect parry", sk: "combat", lv: 4, bonus: "parry", r: "You catch its wooden sword, twist, and send it flying into a hay bale. The Captain’s eyebrows shoot up. “Where did you learn THAT?”", go: 2 }] },
    { t: "<b>The Trial of the Wall.</b> Next is the obstacle course: wobbly beams, rope swings and the castle’s muddy moat. A crowd of squires is watching.",
      c: [{ x: "Race across the wobbly beams", sk: "agility", lv: 2, r: "You wobble once, steady yourself, and leap off the last beam. {P} cheers!", go: 3 },
        { x: "Clear the whole moat in one jump", sk: "agility", lv: 4, bonus: "leap", r: "You take a running start and FLY over the moat. The crowd gasps. Not one drop of mud on your boots!", go: 3 }] },
    { t: "Suddenly a <b>black raven</b> with glowing violet eyes swoops out of the sky! It snatches the Captain’s silver ring right off his finger and flaps toward the castle roof.",
      c: [{ x: "Chase it across the rooftops", sk: "agility", lv: 2, r: "You scramble up the stairs and across the roof tiles, closer… closer…", go: 4 },
        { x: "Throw your practice shield at it", sk: "combat", lv: 2, r: "Your shield spins through the air and clips its wing. The raven squawks…", go: 4 }] },
    { t: "The raven drops the ring — and a rolled-up scroll. As it flies away it bursts into purple smoke. The scroll says, in spiky writing: <i>“The Crown of Embervale is broken. Every shard will be mine. — The Duskwarden.”</i> The Captain goes pale. “So it’s true… last night the royal crown shattered into seven pieces. We need someone brave to find them.” He looks right at you.",
      c: [{ x: "Kneel and take the Squire's Oath", go: "end" }] }
  ]
};
const REWARD = { cp: 40, eggs: 1, bonusCp: 20 };
const QUEST_TITLE = { b1q1: "Squire" };

/* ---------- counting ---------- */
export const heroOf = st => (st && st.hero) || null;
export function sessionsEarned(st, cls) {
  const goal = (cls && Number(cls.goal)) || 120;
  return dayXPs(st, { collectorStart: startOf(cls), goal }).reduce((n, d) => n + Math.floor(d.xp / goal), 0);
}
// Morning work counts too: a morning with 4+ Morning Quests finished gives 1 bonus session, a full board (12) gives 2.
export function morningSessions(st, cls) {
  const start = startOf(cls); return Object.entries((st && st.mqDays) || {}).reduce((n, [d, v]) => n + (d < start ? 0 : Number(v) >= 12 ? 2 : Number(v) >= 4 ? 1 : 0), 0);
}
export const sessionsLeft = (st, cls) => Math.max(0, sessionsEarned(st, cls) + morningSessions(st, cls) - ((heroOf(st) || {}).used || 0));
// One quest for every week at the goal since the start (two for a week at double the goal).
export function questCredits(st, cls) {
  const cur = weekKey(cls); let mon = mondayOf(startOf(cls)), n = 0, guard = 0;
  while (mon <= cur && guard++ < 60) {
    const now = mon === cur, tot = now ? weekTotal(st, cls) : histWeekTotal(st, mon);
    const goal = now ? weekGoal(cls) : Number(((cls && cls.weekGoals) || {})[mon]) || WEEK_DOOR_XP;
    const door = !!((st && st.weekDoor) || {})[mon];
    n += tot >= goal * 2 ? 2 : tot >= goal || door ? 1 : 0;
    mon = addDays(mon, 7);
  }
  return n;
}
const skXP = (h, k) => Number(((h && h.sk) || {})[k]) || 0;
export const skLvl = (h, k) => levelOf(skXP(h, k)).lvl;
export const nextQuest = h => QUESTS[((h && h.done) || []).length] || null;
export function questState(st, cls) {
  const h = heroOf(st), q = nextQuest(h); if (!q) return { st: "all" };
  const today = azToday(), credits = questCredits(st, cls), done = ((h && h.done) || []).length;
  const missing = Object.entries(q.req).filter(([k, v]) => skLvl(h, k) < v);
  if (today < q.wk) return { st: "soon", q, missing };
  if (!STORIES[q.id]) return { st: "coming", q, missing };
  if (missing.length) return { st: "train", q, missing };
  if (credits <= done) return { st: "goal", q, missing };
  return { st: "ready", q, missing };
}
export function heroReady(st, cls) { if (!heroOn(cls) || !heroOf(st)) return 0; return (questState(st, cls).st === "ready" ? 1 : 0) + (sessionsLeft(st, cls) > 0 && trainable(heroOf(st)).length ? 1 : 0); }
const trainable = h => { const q = nextQuest(h); return q ? q.sk : SKILL_IDS; };

/* ---------- the tab ---------- */
let mk = null;    // hero creator draft { name, path, look, color }
let story = null; // { q, i, line, bonus: [] }
export const heroBusy = () => !!story || !!game;
const fmtDay = iso => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: "short", day: "numeric" }); };
export function portrait(h, big) {
  return '<span class="hportrait' + (big ? " big" : "") + '" style="--hc:' + esc((h && h.color) || COLORS[0]) + '"><span>' + (LOOKS[(h && h.look) || 0] || LOOKS[0]) + '</span><i>' + ((PATHS[h && h.path] || PATHS.knight).i) + "</i></span>";
}
export function heroTab(s, cls) {
  const h = heroOf(s), c = companionOf(s), pet = s.petName || (c && c.name) || "your companion";
  if (!h) return creatorHTML(s, pet);
  if (story) return storyHTML(s, h, pet);
  const qs = questState(s, cls), left = sessionsLeft(s, cls), tr = trainable(h);
  let o = '<div class="card herocard"><div class="hhead">' + portrait(h, true) + '<div><h2>' + esc(h.name) + "</h2><p class=\"muted\">" + (h.title ? "\u{1F396}️ " + esc(h.title) + " · " : "") + esc(PATHS[h.path].n) + " of Embervale · with " + esc(pet) + "</p></div></div>";
  // book map
  const done = (h.done || []).length;
  o += '<div class="hbook"><b>' + BOOK1.icon + " Book 1: " + esc(BOOK1.n) + '</b><div class="hmap">' + QUESTS.map((q, i) => '<span class="hnode' + (i < done ? " done" : i === done ? " now" : "") + '" title="' + esc(q.n) + '">' + (i < done ? "✅" : q.art) + "</span>").join('<i class="hpath"></i>') + "</div></div></div>";
  // this quest
  o += '<div class="card"><div class="card-head"><h2>\u{1F4DC} ' + (qs.q ? "Quest " + (QUESTS.indexOf(qs.q) + 1) + ": " + esc(qs.q.n) : "All quests done!") + "</h2>" + (qs.q ? '<span class="fact">opens ' + fmtDay(qs.q.wk) + "</span>" : "") + "</div>";
  if (qs.q) {
    o += '<div class="hreq">' + Object.entries(qs.q.req).map(([k, v]) => { const L = skLvl(h, k), ok = L >= v; return '<span class="' + (ok ? "ok" : "") + '">' + SKILLS[k].i + " " + SKILLS[k].n + " " + L + " / " + v + (ok ? " ✅" : "") + "</span>"; }).join("") + "</div>";
    const wt = weekTotal(s, cls), wg = weekGoal(cls);
    const msg = { soon: "This quest opens the week of " + fmtDay(qs.q.wk) + ". Train now to get ready!", coming: "The story for this quest is still being written. Keep training — it opens soon!",
      train: "Train the skills above to be ready for this quest.", goal: "You’re ready! Reach " + wg.toLocaleString() + " XP this week to start it. (" + wt.toLocaleString() + " / " + wg.toLocaleString() + ")", ready: "You’re ready and you earned it! Start the quest." }[qs.st];
    o += '<p class="lede" style="margin:8px 0;">' + msg + "</p>" + (qs.st === "ready" ? '<button class="btn gold big" data-hero="start">⚔️ Start the quest</button>' : "");
  } else o += '<p class="lede">You finished every quest in Book 1. Book 2 is coming in January!</p>';
  o += "</div>";
  // training
  o += '<div class="card"><div class="card-head"><h2>\u{1F3CB}️ Training</h2><span class="fact">' + left + " session" + (left === 1 ? "" : "s") + ' ready</span></div><p class="muted small" style="margin:0 0 8px;">Every 120 XP gives you a training session (240 gives 2, and so on). Morning Quests give bonus sessions too: 4 quests = 1, a full board = 2.' + (nextQuest(h) ? " Right now you can train the skills your next quest needs." : "") + "</p>" +
    '<div class="hskills">' + SKILL_IDS.map(k => { const lv = levelOf(skXP(h, k)), can = tr.includes(k);
      return '<div class="hsk' + (can ? " can" : "") + '"><span class="hi">' + SKILLS[k].i + "</span><b>" + SKILLS[k].n + "</b><small>Level " + lv.lvl + "</small>" +
        '<span class="hbar"><span style="width:' + (lv.need ? Math.round(lv.into / lv.need * 100) : 100) + '%"></span></span>' +
        (can ? '<button class="btn small' + (left ? " gold" : "") + '" data-hero="train" data-k="' + k + '"' + (left ? "" : " disabled") + ">Train</button>" : '<small class="muted">not this week</small>') + "</div>"; }).join("") + "</div>";
  return o + "</div>";
}
function creatorHTML(s, pet) {
  if (!mk) mk = { name: "", path: "knight", look: 0, color: COLORS[0] };
  return '<div class="card herocard"><div class="card-head"><h2>⚔️ Create your hero</h2></div><p class="lede">The kingdom of <b>Embervale</b> needs a new squire. Make your hero, and ' + esc(pet) + " will join you on every quest!</p>" +
    '<div class="hmk"><div class="hprev">' + portrait(mk, true) + "</div><div>" +
    '<div class="field"><label for="heroName">Hero name</label><input id="heroName" type="text" maxlength="18" value="' + esc(mk.name) + '" placeholder="Sir or Lady…"></div>' +
    '<h3 class="small">Pick your path</h3><div class="hpaths">' + Object.entries(PATHS).map(([k, p]) => '<button class="hpathbtn' + (mk.path === k ? " on" : "") + '" data-hero="path" data-k="' + k + '"><span>' + p.i + "</span><b>" + p.n + "</b><small>" + p.d + "<br>+1 " + SKILLS[p.sk[0]].n + ", +1 " + SKILLS[p.sk[1]].n + "</small></button>").join("") + "</div>" +
    '<h3 class="small">Look</h3><div class="hlooks">' + LOOKS.map((l, i) => '<button class="hlook' + (mk.look === i ? " on" : "") + '" data-hero="look" data-k="' + i + '">' + l + "</button>").join("") + "</div>" +
    '<h3 class="small">Cape color</h3><div class="hlooks">' + COLORS.map(c => '<button class="hcol' + (mk.color === c ? " on" : "") + '" data-hero="color" data-k="' + c + '" style="background:' + c + '"></button>').join("") + "</div>" +
    '<p style="margin-top:12px;"><button class="btn gold big" data-hero="make">\u{1F6E1}️ Begin my adventure</button></p></div></div></div>';
}
function storyHTML(s, h, pet) {
  const sc = STORIES[story.q.id][story.i], fill = t => t.replace(/\{P\}/g, esc(pet)).replace(/\{H\}/g, esc(h.name));
  let o = '<div class="card hstory"><div class="card-head"><h2>' + story.q.art + " " + esc(story.q.n) + '</h2><span class="fact">part ' + (story.i + 1) + " of " + STORIES[story.q.id].length + "</span></div>";
  if (story.line) o += '<p class="hres">' + fill(story.line) + "</p>";
  o += '<p class="lede">' + fill(sc.t) + '</p><div class="hchoices">' + sc.c.map((ch, j) => {
    const lock = ch.sk && skLvl(h, ch.sk) < ch.lv;
    return '<button class="hchoice' + (ch.bonus ? " bonus" : "") + '" data-hero="pick" data-k="' + j + '"' + (lock ? " disabled" : "") + ">" + esc(ch.x) +
      (ch.sk ? '<small>' + SKILLS[ch.sk].i + " " + SKILLS[ch.sk].n + " " + ch.lv + (lock ? " \u{1F512} you have " + skLvl(h, ch.sk) : " ✅") + (ch.bonus ? " · ⭐ bonus" : "") + "</small>" : "") + "</button>"; }).join("") + "</div></div>";
  return o;
}

/* ---------- clicks ---------- */
export async function heroClick(el, c) {
  const s = c.me, a = el.dataset.hero, h = heroOf(s); if (!s) return;
  if (a === "path" || a === "look" || a === "color") { const box = document.getElementById("heroName"); if (box) mk.name = box.value; mk[a] = a === "look" ? Number(el.dataset.k) : el.dataset.k; return c.render(true); }
  if (a === "make") {
    if (h) return; const box = document.getElementById("heroName"), name = ((box && box.value) || mk.name || "").trim().slice(0, 18);
    if (!name) { c.flash("Give your hero a name first!"); return; }
    const sk = {}; PATHS[mk.path].sk.forEach(k => { sk[k] = PATH_BONUS; });
    const hero = { name, path: mk.path, look: mk.look, color: mk.color, sk, used: 0, done: [], items: [], title: "", at: azToday() };
    mk = null; await c.patch({ hero }); c.flash("⚔️ Welcome to Embervale, " + name + "!", true); return;
  }
  if (!h) return;
  if (a === "train") { const k = el.dataset.k; if (!trainable(h).includes(k) || sessionsLeft(s, c.cls) < 1) return; return startGame(k, c); }
  if (a === "start") { const qs = questState(s, c.cls); if (qs.st !== "ready") return; story = { q: qs.q, i: 0, line: "", bonus: [] }; return c.render(true); }
  if (a === "pick" && story) {
    const sc = STORIES[story.q.id][story.i], ch = sc.c[Number(el.dataset.k)]; if (!ch || (ch.sk && skLvl(h, ch.sk) < ch.lv)) return;
    if (ch.bonus) story.bonus.push(ch.bonus);
    if (ch.go === "end") return finishQuest(c);
    story.i = ch.go; story.line = ch.r || ""; return c.render(true);
  }
  if (a === "close") { story = null; return c.render(true); }
}
async function finishQuest(c) {
  const s = c.me, h = heroOf(s), q = story.q, b = story.bonus.length;
  const hero = Object.assign({}, h, { done: (h.done || []).concat([q.id]), items: (h.items || []).concat(story.bonus), title: QUEST_TITLE[q.id] || h.title || "" });
  story = null;
  await c.patch({ hero, doorEggs: (Number(s.doorEggs) || 0) + REWARD.eggs, cpBonus: (Number(s.cpBonus) || 0) + REWARD.cp + REWARD.bonusCp * b });
  c.flash("\u{1F389} Quest complete! +" + REWARD.eggs + " egg and +" + (REWARD.cp + REWARD.bonusCp * b) + " Comfort Points" + (QUEST_TITLE[q.id] ? ". You are now a " + QUEST_TITLE[q.id] + "!" : "!"), true);
}

/* ---------- training minigames (in their own layer, so page redraws don't stop them) ---------- */
let game = null;
function layer(html) { let d = document.getElementById("heroGame"); if (!d) { d = document.createElement("div"); d.id = "heroGame"; document.body.appendChild(d); } d.innerHTML = '<div class="hgback"><div class="hgbox">' + html + "</div></div>"; return d; }
function closeLayer() { const d = document.getElementById("heroGame"); if (d) d.remove(); }
function startGame(k, c) {
  const S = SKILLS[k];
  game = { k, c, score: 0, done: false };
  layer('<h2>' + S.i + " " + S.n + ' training</h2><p class="lede">' + S.what + '</p><div id="hgPlay"></div><p class="muted small" id="hgInfo"></p>');
  ({ bar: barGame, run: runGame, seq: seqGame })[S.game](S);
}
async function endGame(score) {
  if (!game || game.done) return; game.done = true;
  const { k, c } = game, s = c.me, h = heroOf(s), xp = sessionXP(score), before = levelOf(skXP(h, k)).lvl, after = levelOf(skXP(h, k) + xp).lvl;
  layer('<h2>' + SKILLS[k].i + " Training done!</h2><p class=\"hgbig\">+" + xp + " " + SKILLS[k].n + " XP</p>" + (after > before ? '<p class="hgup">⬆️ ' + SKILLS[k].n + " level " + after + "!</p>" : "") +
    '<p><button class="btn gold" id="hgOk">Nice!</button></p>');
  const hero = Object.assign({}, h, { sk: Object.assign({}, h.sk || {}, { [k]: skXP(h, k) + xp }), used: (Number(h.used) || 0) + 1 });
  document.getElementById("hgOk").onclick = () => { closeLayer(); game = null; c.render(true); };
  await c.patch({ hero }, true);
}
// Timing bar: 6 tries; the gold zone gets smaller and the marker faster. Perfect (center) = 1, good = 0.6.
function barGame(S) {
  const p = document.getElementById("hgPlay"); let tries = 0, pts = 0, x = 0, dir = 1, speed = 0.9, zone = 0.22, at = 0.3 + Math.random() * 0.4, last = performance.now(), raf;
  p.innerHTML = '<div class="hgbar"><div class="hgzone"></div><div class="hgmark"></div></div><p><button class="btn big gold" id="hgHit">' + S.verb + "</button></p>";
  const zEl = p.querySelector(".hgzone"), mEl = p.querySelector(".hgmark"), info = document.getElementById("hgInfo");
  const place = () => { zEl.style.left = (at - zone / 2) * 100 + "%"; zEl.style.width = zone * 100 + "%"; info.textContent = "Try " + (tries + 1) + " of 6"; };
  place();
  const tick = t => { const dt = (t - last) / 1000; last = t; x += dir * speed * dt; if (x > 1) { x = 1; dir = -1; } if (x < 0) { x = 0; dir = 1; } mEl.style.left = x * 100 + "%"; if (!game || game.done) return; raf = requestAnimationFrame(tick); };
  raf = requestAnimationFrame(tick);
  const hit = () => {
    if (!game || game.done) return; const d = Math.abs(x - at);
    const r = d < zone * 0.2 ? 1 : d < zone / 2 ? 0.6 : 0; pts += r; tries++;
    p.querySelector(".hgbar").classList.remove("hgok", "hgbad"); void p.offsetWidth; p.querySelector(".hgbar").classList.add(r ? "hgok" : "hgbad");
    info.textContent = r === 1 ? "⭐ Perfect!" : r ? "Good!" : "Missed!";
    if (tries >= 6) { cancelAnimationFrame(raf); setTimeout(() => endGame(pts / 6), 600); return; }
    speed += 0.18; zone = Math.max(0.1, zone - 0.02); at = 0.15 + Math.random() * 0.7; setTimeout(place, 350);
  };
  document.getElementById("hgHit").onclick = hit;
  game.key = ev => { if (ev.code === "Space") { ev.preventDefault(); hit(); } };
}
// Runner: 10 hurdles come at you; tap Jump (or Space) to hop over them.
function runGame(S) {
  const p = document.getElementById("hgPlay"); let y = 0, vy = 0, obs = [], spawned = 0, cleared = 0, hits = 0, next = 0.9, last = performance.now(), raf, speed = 0.45;
  p.innerHTML = '<div class="hgrun"><div class="hghero">' + portraitMini() + '</div></div><p><button class="btn big gold" id="hgJump">' + S.verb + "</button></p>";
  const box = p.querySelector(".hgrun"), me = p.querySelector(".hghero"), info = document.getElementById("hgInfo");
  const jump = () => { if (y <= 0.001 && game && !game.done) vy = 1.55; };
  const tick = t => {
    const dt = Math.min(0.05, (t - last) / 1000); last = t;
    if (vy || y > 0) { y += vy * dt; vy -= 4.2 * dt; if (y <= 0) { y = 0; vy = 0; } }
    me.style.bottom = 8 + y * 55 + "%";
    next -= dt; if (next <= 0 && spawned < 10) { const el = document.createElement("div"); el.className = "hgob"; el.textContent = "\u{1FAB5}"; box.appendChild(el); obs.push({ x: 1.05, el, hit: false }); spawned++; next = 1.1 + Math.random() * 0.9 - spawned * 0.04; speed += 0.025; }
    obs.forEach(o => { o.x -= speed * dt; o.el.style.left = o.x * 100 + "%";
      if (!o.hit && o.x < 0.2 && o.x > 0.08 && y < 0.25) { o.hit = true; hits++; o.el.classList.add("bump"); }
      if (!o.done && o.x < 0.05) { o.done = true; if (!o.hit) cleared++; } });
    obs = obs.filter(o => { if (o.x < -0.1) { o.el.remove(); return false; } return true; });
    info.textContent = "Hurdles cleared: " + cleared + " / 10";
    if (spawned >= 10 && !obs.length) { setTimeout(() => endGame(cleared / 10), 400); return; }
    if (game && !game.done) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  document.getElementById("hgJump").onclick = jump;
  game.key = ev => { if (ev.code === "Space" || ev.code === "ArrowUp") { ev.preventDefault(); jump(); } };
}
const portraitMini = () => { const h = game && heroOf(game.c.me); return h ? (LOOKS[h.look] || LOOKS[0]) : "\u{1F9D1}"; };
// Memory sequence: 3 rounds (4, 5 and 6 steps) from 6 icons. Score = correct steps / all steps.
function seqGame(S) {
  const p = document.getElementById("hgPlay"), lens = [4, 5, 6], total = 15; let round = 0, got = 0, seq = [], pos = 0, showing = false;
  p.innerHTML = '<div class="hgshow" id="hgShow"></div><div class="hgpads">' + S.icons.map((ic, i) => '<button class="hgpad" data-i="' + i + '">' + ic + "</button>").join("") + "</div>";
  const show = document.getElementById("hgShow"), info = document.getElementById("hgInfo"), pads = [...p.querySelectorAll(".hgpad")];
  const play = () => {
    seq = Array.from({ length: lens[round] }, () => Math.floor(Math.random() * S.icons.length)); pos = 0; showing = true; info.textContent = "Round " + (round + 1) + " of 3 — watch!";
    seq.forEach((v, i) => setTimeout(() => { show.textContent = S.icons[v]; pads[v].classList.add("lit"); setTimeout(() => { pads[v].classList.remove("lit"); show.textContent = ""; }, 450); }, 700 * i + 400));
    setTimeout(() => { showing = false; info.textContent = "Round " + (round + 1) + " of 3 — your turn!"; }, 700 * seq.length + 450);
  };
  const nextRound = () => { round++; if (round >= 3) return setTimeout(() => endGame(got / total), 500); setTimeout(play, 700); };
  pads.forEach(b => b.onclick = () => {
    if (showing || !game || game.done) return; const i = Number(b.dataset.i);
    b.classList.add(i === seq[pos] ? "good" : "bad"); setTimeout(() => b.classList.remove("good", "bad"), 250);
    if (i === seq[pos]) { got++; pos++; if (pos >= seq.length) { info.textContent = "⭐ Got it!"; nextRound(); } }
    else { info.textContent = "Oops! On to the next round."; showing = true; nextRound(); }
  });
  play();
}
document.addEventListener("keydown", ev => { if (game && !game.done && game.key) game.key(ev); });

/* ---------- teacher view ---------- */
export function heroTeacherCard(students, cls) {
  const kids = students.filter(s => s.companionId);
  const rows = kids.map(s => { const h = heroOf(s); if (!h) return "<tr><td>" + esc(s.name) + '</td><td colspan="3" class="muted">no hero yet</td></tr>';
    const qs = questState(s, cls);
    return "<tr><td>" + esc(s.name) + "</td><td>" + esc(h.name) + " · " + esc(PATHS[h.path].n) + "</td><td>" + (h.done || []).length + " / " + QUESTS.length + " · " + ({ ready: "ready to quest", goal: "needs weekly goal", train: "training", soon: "waiting for the quest", coming: "waiting for the story", all: "all done" }[qs.st]) +
      "</td><td>" + SKILL_IDS.map(k => SKILLS[k].i + skLvl(h, k)).join(" ") + "</td></tr>"; }).join("");
  return '<div class="card"><div class="card-head"><h2>⚔️ Hero Quest</h2><button class="btn ghost small" data-act="heroToggle">' + (heroOn(cls) ? "Turn off" : "Turn on") + "</button></div>" +
    '<p class="muted small">Every 120 XP gives a training session. Reaching the weekly goal (' + weekGoal(cls) + " this week) opens the next quest. Book 1 started " + fmtDay(startOf(cls)) + ".</p>" +
    (heroOn(cls) ? '<div style="overflow:auto;"><table class="tbl"><tr><th>Student</th><th>Hero</th><th>Quests</th><th>Skills</th></tr>' + rows + "</table></div>" : "") + "</div>";
}
