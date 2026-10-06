// Student side of the Creature Collector: the tab, egg hatching, the lorebook and arena battles.
import {
  CREATURES, FAMILIES, creature, family, xpTotal, pullsLeft, legendaryLeft, bankXP, xpToNextPull, owned, ownedFams, hasStarter,
  formIndex, formOf, statsOf, seenSet, rollRarity, doPull, arenaOpen, arenaOpenFor, lunchHour, hitGoalToday, LUNCH_ARENA, ARENA_HOURS, fighterFrom, teamSize, alive, resolve, resolveRound, moveOk, MOVES, hitDamage,
  birthdayLeft, pickleLeft, PICKLE_FAM, brewLegLeft, BREW_FAM, goalLeft, nextGoal, rollRareUp, themeLeft, nextTheme, THEME_TYPES, THEME_EGG, WISH_FAM, spares, spareId, releaseXP, releaseProblem, STARTERS, RARITY_COLOR, LEVEL_XP, MAX_LEVEL, PULL_XP, ODDS, isSparkle, sparkleImg, hasSparkleArt,
  EVENTS, eventOpen, eventWindow, eventStreak, hasEvent, eventUnlocked, azToday, rollTeacherRarity, TEACHER_ODDS, LIVE, staleBattle
} from "./collect.js?v=20261006h";
import { newBattleRef, changeBattle as changeBattleRaw, setDoc, liveBattlesNow } from "./db.js?v=20261006h";
// every change to a battle is stamped with the time (upd), so a battle nobody has touched in a while can be ended
let locking = null, leaving = null;   // battle id while "Lock in team" is saving
const changeBattle = (id, fn) => changeBattleRaw(id, bt => { const n = fn(bt); if (n) n.upd = new Date().toISOString(); return n; });

import { tradeCard } from "./trade-ui.js?v=20261006h";

const esc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const PER_PAGE = 20;

let ctx = null;                  // { cls, students, me, battles, patch, render, flash }
let hatch = null;                // { phase: shake|crack|reveal, res, legendary }
let book = null;                 // { open: bool, opening, page, detail, flip }
let battleOpen = null, picks = [], shown = {}, animated = {}, replayTimer = null, busyUntil = 0;
export function isBusy() { return Date.now() < busyUntil; }
function hold(ms) { busyUntil = Date.now() + ms; }
function later(ms, fn) { setTimeout(() => { fn(); ctx.render(true); }, ms); }

function img(c, cls, sp) {
  const src = sp && !String(c.img).includes("/sparkle/") ? sparkleImg(c) : c.img;
  const pic = '<img class="' + (cls || "") + (sp && !hasSparkleArt(c) && !String(c.img).includes("/sparkle/") ? " sptint" : "") + '" src="' + esc(src) + '" alt="' + esc((sp ? "Sparkle " : "") + c.name) + '" loading="lazy">';
  if (!sp) return pic;
  return '<span class="spk">' + pic + '<i></i><i></i><i></i><i></i><i></i><i></i><b class="spkb">\u2728 Sparkle</b></span>';
}
const spOf = fam => isSparkle(ctx.me, fam);
function rarityPill(r) { return '<span class="rpill" style="background:' + RARITY_COLOR[r] + '">' + esc(r) + "</span>"; }
function typePills(c) { return c.types.map(t => '<span class="tpill">' + esc(t) + "</span>").join(" "); }

/* ================= the tab ================= */
export function collectorTab(c) {
  ctx = c;
  const s = c.me;
  if (!hasStarter(s)) return starterView();
  const pulls = pullsLeft(s, c.cls), leg = legendaryLeft(s), bank = bankXP(s, c.cls), seen = seenSet(s);
  let h = '<div class="card collhead"><div class="collstats">' +
    stat("\u{1F95A}", pulls, "egg" + (pulls === 1 ? "" : "s") + " to hatch") +
    (leg ? stat("\u{1F31F}", leg, "legendary egg" + (leg === 1 ? "" : "s")) : "") +
    (birthdayLeft(s) ? stat("\u{1F382}", birthdayLeft(s), "birthday egg" + (birthdayLeft(s) === 1 ? "" : "s")) : "") +
    (pickleLeft(s) ? stat("\u{1F952}", pickleLeft(s), "Cluckledill egg" + (pickleLeft(s) === 1 ? "" : "s")) : "") +
    (brewLegLeft(s) ? stat("\u{1F9EA}", brewLegLeft(s), "Brewraith egg" + (brewLegLeft(s) === 1 ? "" : "s")) : "") +
    (themeLeft(s) ? stat("\u2728", themeLeft(s), "event egg" + (themeLeft(s) === 1 ? "" : "s")) : "") +
    (goalLeft(s) ? stat("\u{1F3AF}", goalLeft(s), "Goal egg" + (goalLeft(s) === 1 ? "" : "s") + " (Rare+)") : "") +
    stat("⭐", bank.toLocaleString(), "XP in your bank") +
    stat("\u{1F4D6}", seen.size + " / " + CREATURES.length, "in your lorebook") + "</div>" +
    (s.isTeacher
      ? '<p class="muted" style="margin:10px 0 12px;">Each day you finalize gives you <b>1 egg for every student who hit 120 XP</b> and <b>' + LEVEL_XP + " banked XP (1 level) for every student who didn\u2019t</b>. If everyone hits 120, you still get " + LEVEL_XP + " XP. Excused days don\u2019t count.</p>"
      : '<p class="muted" style="margin:10px 0 12px;">Reach ' + PULL_XP + " XP in a day for an egg, and every " + PULL_XP + " more that day earns another." + (c.cls && c.cls.lunchBonus === false ? "" : " \u2600\uFE0F Hit " + PULL_XP + " <b>before lunch</b> for a bonus egg!") + " Next egg today in <b>" + xpToNextPull(s, c.cls) + " XP</b>. All your XP also goes into your bank to level up creatures (" + LEVEL_XP + " XP = 1 level).</p>") +
    '<div class="row"><button class="btn big" data-cc="hatch"' + (pulls ? "" : " disabled") + ">\u{1F95A} Hatch an egg</button>" +
    (leg ? '<button class="btn big gold" data-cc="hatchLeg">\u{1F31F} Hatch a legendary egg</button>' : "") +
    (birthdayLeft(s) ? '<button class="btn big bday" data-cc="hatchBday">\u{1F382} Hatch your birthday egg!</button>' : "") +
    (pickleLeft(s) ? '<button class="btn big gold" data-cc="hatchPickle">\u{1F952} Hatch your special event egg!</button>' : "") +
    (brewLegLeft(s) ? '<button class="btn big gold" data-cc="hatchBrew">\u{1F9EA} Hatch your Top Brewers egg!</button>' : "") +
    (goalLeft(s) ? '<button class="btn big gold" data-cc="hatchGoal">\u{1F3AF} Hatch a Goal egg' + (goalLeft(s) > 1 ? " (" + goalLeft(s) + ")" : "") + "</button>" : "") +
    (themeLeft(s) ? '<button class="btn big gold" data-cc="hatchTheme"><img src="assets/egg-' + nextTheme(s) + '.webp" alt="" style="height:1.5em;vertical-align:middle;margin:-4px 4px -4px 0;">Hatch your ' + THEME_EGG[nextTheme(s)] + "!</button>" : "") +
    '<button class="btn ghost big" data-cc="book">\u{1F4D6} Open lorebook</button></div>' +
    '<p class="muted" style="margin-top:8px;">Egg odds: ' + (s.isTeacher ? TEACHER_ODDS : ODDS).map(([r, p]) => r + " " + (p < 0.01 ? (p * 100).toFixed(2) : Number.isInteger(Math.round(p * 1000) / 10) ? Math.round(p * 100) : (p * 100).toFixed(1)) + "%").join(" · ") + "</p></div>";
  if (!s.isTeacher) h += eventCards(s, c.cls) + ideaCard(s, c.cls);
  h += myCreatures(s, bank);
  h += arenaCard(s);
  h += tradeCard(c);
  return h;
}
// Limited event cards (Duckarune, Hexaduck): shown only while each event is running
function eventCards(s, cls) { return EVENTS.map(ev => eventCard(ev, s, cls)).join(""); }
function eventCard(ev, s, cls) {
  if (!eventOpen(ev, cls)) return "";
  const w = eventWindow(ev, cls), dc = creature(family(ev.fam).forms[0]), st = eventStreak(ev, s, cls), got = hasEvent(ev, s), on = eventUnlocked(ev, s, cls);
  const nice = d => new Date(d + "T12:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  let when;
  if (ev.haunt) when = "Haunt-O-Ween only";
  else { const left = w.days.filter(d => d >= azToday()).length; when = nice(w.start) + " \u2013 " + nice(w.end) + " \u00b7 " + left + " school day" + (left === 1 ? "" : "s") + " left"; }
  const msg = got ? "You caught " + esc(dc.name) + "! Each egg still has a 1% chance to be another one (a free level up)."
    : on ? "<b>Unlocked!</b> Every egg you hatch has a <b>95% chance</b> to be " + esc(dc.name) + " until you catch it."
    : ev.boss ? "\u{1F512} <b>Defeat the " + esc(ev.bossName) + "</b> with your class to unlock " + esc(dc.name) + "! Then every egg you hatch has a <b>95% chance</b> to be it."
    : "Hit " + goal120(cls) + " XP <b>" + ev.streak + " school days in a row</b>" + (ev.haunt ? " during Haunt-O-Ween" : ev.label ? " during " + ev.label : "") + " to unlock it. Your streak: <b>" + Math.min(st.current, ev.streak) + " / " + ev.streak + "</b>.";
  return '<div class="card duckcard ev-' + ev.key + (on && !got ? " on" : "") + (got ? " got" : "") + '">' + img(dc, "duckimg", got && isSparkle(s, ev.fam)) +
    '<div class="duckt"><span class="duckk">' + ev.icon + " Limited event \u00b7 " + when + "</span>" +
    "<h3>" + esc(dc.name) + " <small>" + esc(dc.title || "") + "</small></h3><p>" + msg + "</p>" +
    (on && !got && pullsLeft(s, cls) ? '<button class="btn gold" data-cc="hatch">\u{1F95A} Hatch an egg</button>' : "") + "</div></div>";
}
const goal120 = cls => (cls && Number(cls.goal)) || 120;
function stat(icon, big, label) { return '<div class="cstat"><span class="ci">' + icon + '</span><b>' + big + "</b><small>" + esc(label) + "</small></div>"; }

function starterView() {
  return '<div class="card"><div class="card-head"><h2>\u{1F95A} Choose your first creature</h2></div>' +
    '<p class="lede" style="margin-bottom:12px;">Pick one to start your collection. You’ll hatch more with the XP you earn!</p><div class="startgrid">' +
    STARTERS.map(f => { const c = creature(family(f).forms[0]);
      return '<button class="starter" data-cc="starter" data-fam="' + f + '">' + img(c) + "<b>" + esc(c.name) + "</b>" + typePills(c) + "</button>"; }).join("") +
    "</div></div>";
}

// Nicknames: saved on the creature's family (coll[fam].nick), so they stay through evolutions.
let naming = null;
let releasing = null;   // "m:FAM" or "s:ID" waiting for "Yes, release"
let releaseMsg = null;  // { key, why }: shown right on the card when a release can't happen
function releaseRow(key, fam, name) {
  const xp = releaseXP(fam);
  if (releaseMsg && releaseMsg.key === key) return '<small class="relwhy">\u26A0\uFE0F ' + esc(releaseMsg.why) + "</small>";
  if (releasing === key) return '<div class="relask"><small>Release ' + esc(name) + " for <b>" + xp + ' XP</b>? It\u2019s gone for good.</small>' +
    '<div class="row" style="gap:4px;justify-content:center;"><button class="btn small danger" data-cc="releaseOk" data-key="' + esc(key) + '">Yes, release</button><button class="btn ghost small" data-cc="releaseCancel">Keep it</button></div></div>';
  return '<button class="relbtn" data-cc="release" data-key="' + esc(key) + '" title="Release it for ' + xp + ' XP">\u{1F54A}\uFE0F Release \u00b7 ' + xp + " XP</button>";
}
const NICK_MAX = 16;
function nameRow(f, e, c) {
  if (naming === f) return '<div class="nickedit"><input id="nickIn" type="text" maxlength="' + NICK_MAX + '" value="' + esc(e.nick || "") + '" placeholder="' + esc(c.name) + '">' +
    '<div class="row" style="gap:4px;justify-content:center;"><button class="btn small" data-cc="nickSave" data-fam="' + f + '">Save</button><button class="btn ghost small" data-cc="nickCancel">Cancel</button></div></div>';
  return (e.nick ? "<b>" + esc(e.nick) + '</b><small class="muted">' + esc(c.name) + "</small>" : "<b>" + esc(c.name) + "</b>") +
    '<button class="nickbtn" data-cc="nick" data-fam="' + f + '" title="Give it a name">\u270F\uFE0F ' + (e.nick ? "Rename" : "Name it") + "</button>";
}
// Favorites (coll[fam].fav) come first, then the rest in lorebook order.
function sortedFams(s) {
  const o = owned(s);
  return ownedFams(s).sort((a, b) => (o[b].fav ? 1 : 0) - (o[a].fav ? 1 : 0) || formOf(a, 1).id - formOf(b, 1).id);
}
const favBtn = (f, e) => '<button class="favbtn' + (e.fav ? " on" : "") + '" data-cc="fav" data-fam="' + f + '" title="' + (e.fav ? "Remove from favorites" : "Add to favorites") + '" aria-label="Favorite">' + (e.fav ? "\u2B50" : "\u2606") + "</button>";
const tradeBtn = (key, on) => '<button class="tradebtn' + (on ? " on" : "") + '" data-cc="forTrade" data-key="' + key + '" title="' + (on ? "Take it off the trade list" : "Put it up for trade") + '">\u{1F504} ' + (on ? "Up for trade" : "Trade?") + "</button>";
function myCreatures(s, bank) {
  const fams = sortedFams(s), nFav = fams.filter(f => owned(s)[f].fav).length;
  let h = '<div class="card"><div class="card-head"><h2>My creatures</h2><span class="fact">' + fams.length + " families" + (nFav ? " \u00b7 \u2B50 " + nFav : "") + "</span></div>" + '<p class="muted small" style="margin:-4px 0 10px;">Tap \u2606 to favorite a creature. Favorites show first here and when you pick a battle team.</p>' + '<div class="mygrid">';
  fams.forEach(f => {
    const e = owned(s)[f], lvl = e.lvl || 1, c = formOf(f, lvl), st = statsOf(c, lvl), maxed = lvl >= MAX_LEVEL;
    const next = family(f).forms[formIndex(f, lvl) + 1], evoAt = c.evolvesAt;
    h += '<div class="mycard' + (e.fav ? " fav" : "") + '" style="--rc:' + RARITY_COLOR[c.rarity] + '">' + favBtn(f, e) + '<button class="mypic" data-cc="detail" data-id="' + c.id + '">' + img(c, "", spOf(f)) + "</button>" +
      nameRow(f, e, c) + '<span class="lv">Lv ' + lvl + "</span>" +
      '<small class="muted">❤ ' + st.hp + " · \u{1F6E1} " + st.df + " · ⚔ " + st.dmg + "</small>" +
      (next && evoAt ? '<small class="evo">Evolves at Lv ' + evoAt + "</small>" : "") +
      '<button class="btn small" data-cc="lvl" data-fam="' + f + '"' + (bank >= LEVEL_XP && !maxed ? "" : " disabled") + ">" + (maxed ? "Max level" : "⬆ Level up · " + LEVEL_XP + " XP") + "</button>" +
      (fams.length > 1 && !family(f).event ? (e.fav ? '<small class="muted" style="margin-top:4px;">\u2B50 Favorites can\u2019t be traded</small>' : tradeBtn("m:" + f, e.forTrade)) : "") +
      (fams.length > 1 && !family(f).event && s.starter !== f && s.petCreature !== f ? releaseRow("m:" + f, f, e.nick || c.name) : "") + "</div>";
  });
  h += "</div>";
  const sp = spares(s);
  if (sp.length) {
    h += '<h3 class="bdg-group" style="margin-top:16px;">\u{1F504} Spares for trading <span class="muted small">(' + sp.length + ")</span></h3><div class=\"mygrid spares\">";
    sp.forEach(x => {
      const c = formOf(x.fam, x.lvl || 1), mine = owned(s)[x.fam];
      h += '<div class="mycard spare" style="--rc:' + RARITY_COLOR[c.rarity] + '"><div class="mypic">' + img(c, "", !!x.sparkle) + "</div>" +
        "<b>" + (x.sparkle ? "\u2728 " : "") + esc(c.name) + '</b><span class="lv">Lv ' + (x.lvl || 1) + " \u00b7 spare</span>" +
        '<button class="btn small ghost" data-cc="useSpare" data-sp="' + x.id + '">' + (mine ? "\u2B06 Use for +1 level" : "Add to my collection") + "</button>" +
        (family(x.fam).event ? "" : tradeBtn("s:" + x.id, x.forTrade) + releaseRow("s:" + x.id, x.fam, c.name)) + "</div>";
    });
    h += "</div>";
  }
  return h + "</div>";
}

/* ================= creature ideas ================= */
// Hit 120 XP in a day and you can send Ms. Ariana one idea for a new creature that day.
const IDEA_TYPES = ["Air", "Arcane", "Crystal", "Dark", "Dragon", "Earth", "Electric", "Fire", "Ghost", "Ice", "Light", "Nature", "Normal", "Poison", "Rock", "Steel", "Water"];
let ideaOpen = false, ideaTypes = [], ideaKind = "creature", ideaSlot = "hat";
const IDEA_SLOTS = { hat: "\u{1F3A9} On the head", eyes: "\u{1F576}\uFE0F On the eyes", snack: "\u{1F36A} A snack / held item", other: "\u2728 Something else" };
const ROOM_SLOTS = { wallpaper: "\u{1F9F1} Wallpaper", flooring: "\u{1FAB5} Floor", rug: "\u{1F7EB} Rug", ceiling: "\u{1F4A1} Ceiling light", window: "\u{1FA9F} Window",
  bed: "\u{1F6CF}\uFE0F Bed", chair: "\u{1FA91} Chair", plant: "\u{1FAB4} Plant", wall_art: "\u{1F5BC}\uFE0F Wall art", shelf: "\u{1F3C6} Shelf decor", other: "\u2728 Something else" };
let roomSlot = "bed";
const ideaKeep = ["ideaName", "ideaAnimal", "ideaLore"];
function keepIdeaFields(fn) {
  const keep = ideaKeep.map(id => { const n = document.getElementById(id); return n ? n.value : null; });
  fn(); ideaKeep.forEach((id, i) => { const n = document.getElementById(id); if (n && keep[i] != null) n.value = keep[i]; });
}
function ideaCard(s, cls) {
  const today = azToday(), sent = (s.ideas || []).filter(x => x.date === today).length, ok = hitGoalToday(s, cls);
  let h = '<div class="card ideacard"><div class="card-head"><h2>\u{1F4A1} Invent something!</h2><span class="fact">' + (s.ideas || []).length + " sent</span></div>";
  if (!ok) return h + '<p class="lede">Hit <b>' + ((cls && cls.goal) || 120) + " XP</b> today and you can send Ms. Ariana an idea for a brand-new creature, accessory or room decoration!</p></div>";
  if (sent) return h + '<p class="lede">\u2705 Your idea for today is sent! Hit ' + ((cls && cls.goal) || 120) + " XP another day to send another one.</p>" + ideaList(s) + "</div>";
  if (!ideaOpen) return h + '<p class="lede">You hit ' + ((cls && cls.goal) || 120) + " XP today, so you can send one idea! Ms. Ariana might add it to the game.</p>" +
    '<div class="row"><button class="btn" data-cc="ideaStart" data-k="creature">\u{1F43E} Invent a creature</button><button class="btn" data-cc="ideaStart" data-k="gear">\u{1F3A9} Invent an accessory</button><button class="btn" data-cc="ideaStart" data-k="room">\u{1F6CF}\uFE0F Invent room decor</button></div>' + ideaList(s) + "</div>";
  const tabs = '<div class="row" style="margin-bottom:10px;gap:6px;">' + [["creature", "\u{1F43E} Creature"], ["gear", "\u{1F3A9} Accessory"], ["room", "\u{1F6CF}\uFE0F Room decor"]].map(([k, l]) =>
    '<button class="tpill2' + (ideaKind === k ? " on" : "") + '" data-cc="ideaKind" data-k="' + k + '">' + l + "</button>").join("") + "</div>";
  if (ideaKind === "room") return h + tabs +
    '<div class="field"><label for="ideaName">Decoration name</label><input id="ideaName" type="text" maxlength="30" placeholder="e.g. Cloud Hammock"></div>' +
    '<p class="muted small" style="margin:10px 0 6px;">Where does it go in your companion\u2019s room?</p><div class="typepick">' +
    Object.keys(ROOM_SLOTS).map(k => '<button class="tpill2' + (roomSlot === k ? " on" : "") + '" data-cc="roomSlot" data-k="' + k + '">' + ROOM_SLOTS[k] + "</button>").join("") + "</div>" +
    '<div class="field" style="margin-top:10px;"><label for="ideaLore">What does it look like? (optional)</label><textarea id="ideaLore" rows="3" maxlength="600" placeholder="e.g. A fluffy cloud bed that floats a little off the floor"></textarea></div>' +
    '<div class="row" style="margin-top:10px;"><button class="btn" data-cc="ideaSend">Send my idea</button><button class="btn ghost" data-cc="ideaCancel">Cancel</button></div></div>';
  if (ideaKind === "gear") return h + tabs +
    '<div class="field"><label for="ideaName">Accessory name</label><input id="ideaName" type="text" maxlength="30" placeholder="e.g. Rainbow Scarf"></div>' +
    '<p class="muted small" style="margin:10px 0 6px;">Where does your companion wear it?</p><div class="typepick">' +
    Object.keys(IDEA_SLOTS).map(k => '<button class="tpill2' + (ideaSlot === k ? " on" : "") + '" data-cc="ideaSlot" data-k="' + k + '">' + IDEA_SLOTS[k] + "</button>").join("") + "</div>" +
    '<div class="field" style="margin-top:10px;"><label for="ideaLore">What does it look like? What does it do? (optional)</label><textarea id="ideaLore" rows="3" maxlength="600" placeholder="e.g. A fuzzy striped scarf that makes your companion +5 cozy"></textarea></div>' +
    '<div class="row" style="margin-top:10px;"><button class="btn" data-cc="ideaSend">Send my idea</button><button class="btn ghost" data-cc="ideaCancel">Cancel</button></div></div>';
  h += tabs;
  return h + '<div class="field"><label for="ideaName">Creature name</label><input id="ideaName" type="text" maxlength="30" placeholder="e.g. Blazewhisker"></div>' +
    '<p class="muted small" style="margin:10px 0 6px;">Type (pick 1 or 2)</p><div class="typepick">' +
    IDEA_TYPES.map(t => '<button class="tpill2' + (ideaTypes.includes(t) ? " on" : "") + '" data-cc="ideaType" data-t="' + t + '">' + (TYPE_FX[t] || "") + " " + t + "</button>").join("") + "</div>" +
    '<div class="field" style="margin-top:10px;"><label for="ideaAnimal">What animal is it based on? (optional)</label><input id="ideaAnimal" type="text" maxlength="40" placeholder="e.g. a fox, a jellyfish"></div>' +
    '<div class="field" style="margin-top:10px;"><label for="ideaLore">Lorebook story (optional)</label><textarea id="ideaLore" rows="3" maxlength="600" placeholder="Where does it live? What is it like?"></textarea></div>' +
    '<div class="row" style="margin-top:10px;"><button class="btn" data-cc="ideaSend">Send my idea</button><button class="btn ghost" data-cc="ideaCancel">Cancel</button></div></div>';
}
function ideaList(s) {
  const l = (s.ideas || []).slice().reverse().slice(0, 5); if (!l.length) return "";
  return '<p class="muted small" style="margin:12px 0 4px;">Your ideas</p><div class="inv">' + l.map(x => "<span>" + (x.kind === "gear" ? "\u{1F3A9}" : x.kind === "room" ? "\u{1F6CF}\uFE0F" : "\u{1F43E}") + " <b>" + esc(x.name) + "</b>" + (x.kind === "gear" || x.kind === "room" ? "" : " \u00b7 " + esc((x.types || []).join("/"))) + "</span>").join("") + "</div>";
}

/* ================= arena ================= */
function myBattle(s) {
  return (ctx.battles || []).filter(b => (b.a.id === s.id || b.b.id === s.id) &&
    ((LIVE.includes(b.status) && !staleBattle(b)) || (["done", "ended"].includes(b.status) && !b["seen_" + s.id])))
    .sort((x, y) => String(y.created).localeCompare(String(x.created)))[0] || null;
}
function busyIds() {
  const ids = new Set();
  (ctx.battles || []).forEach(b => { if (LIVE.includes(b.status) && !staleBattle(b)) { ids.add(b.a.id); ids.add(b.b.id); } });
  return ids;
}
function arenaCard(s) {
  const open = arenaOpenFor(s, ctx.cls), lunchOnly = open && !arenaOpen(ctx.cls);
  let h = '<div class="card arenacard" style="background-image:linear-gradient(rgba(20,12,40,.72),rgba(20,12,40,.82)),url(assets/arena-bg.jpg)">' +
    '<div class="card-head"><h2>⚔️ Battle Arena</h2><span class="fact ' + (open ? "open" : "") + '">' + (open ? "OPEN" : "closed") + "</span></div>";
  const mine = myBattle(s);
  if (mine) {
    const me = mine.a.id === s.id ? "A" : "B", them = me === "A" ? mine.b : mine.a;
    if (mine.status === "invite" && me === "B") return h + '<p class="lede"><b>' + esc(them.name) + "</b> challenged you to a battle!</p>" +
      '<div class="row" style="margin-top:10px;"><button class="btn" data-cc="accept" data-b="' + mine.id + '">Accept</button><button class="btn ghost" data-cc="decline" data-b="' + mine.id + '">Decline</button></div></div>';
    if (mine.status === "invite") return h + '<p class="lede">Waiting for <b>' + esc(them.name) + "</b> to accept your challenge…</p>" +
      '<div class="row" style="margin-top:10px;"><button class="btn ghost" data-cc="decline" data-b="' + mine.id + '">Cancel challenge</button></div></div>';
    return h + '<p class="lede">' + (mine.status === "ended" ? "Your battle with <b>" + esc(them.name) + "</b> ended." : mine.status === "done" ? "Your battle with <b>" + esc(them.name) + "</b> is over!" : "You’re in a battle with <b>" + esc(them.name) + "</b>!") + '</p><div class="row" style="margin-top:10px;"><button class="btn big" data-cc="enter" data-b="' + mine.id + '">⚔️ ' + (mine.status === "done" ? "See the result" : mine.status === "ended" ? "See what happened" : "Go to battle") + "</button></div></div>";
  }
  // a battle already started can always be finished; new ones only while the arena is open
  if (!open) return h + '<p class="lede">The arena opens ' + esc(ARENA_HOURS) + ".</p>" +
    (ctx.cls && ctx.cls.lunchArena === false ? "" : '<p class="lede" style="margin-top:6px;">\u2600\uFE0F <b>Lunch arena:</b> ' + esc(LUNCH_ARENA) + "." +
      (lunchHour() && !hitGoalToday(s, ctx.cls) ? " Hit 120 XP to join right now!" : "") + "</p>") +
    (ctx.cls && ctx.cls.goalArena && !hitGoalToday(s, ctx.cls) ? '<p class="lede" style="margin-top:6px;">\u2B50 Hit 120 XP today and you can battle right away!</p>' : "") + "</div>";
  if (lunchOnly) h += '<p class="lede" style="margin-bottom:10px;">' + (ctx.cls && ctx.cls.goalArena ? "\u2B50 <b>120 XP battlers</b> \u2014 you hit 120 XP today, so you can battle other players who did too!" : "\u2600\uFE0F <b>Lunch arena</b> until 1 pm \u2014 you hit 120 XP today, so you can battle other players who did too!") + "</p>";
  const ready = !!s.arenaReady, busy = busyIds();
  h += '<label class="modebox" style="margin-bottom:12px;"><input type="checkbox" data-cc="ready"' + (ready ? " checked" : "") + "><span><b>I’m ready to battle</b><small>Other ready players can challenge you, and you can challenge them.</small></span></label>";
  const others = ctx.students.filter(x => x.id !== s.id && x.arenaReady && hasStarter(x) && arenaOpenFor(x, ctx.cls));   // during the lunch arena, only other 120 XP players
  if (!ready) return h + "</div>";
  if (!others.length) return h + '<p class="lede">Nobody else is ready yet. Hang tight!</p></div>';
  h += '<div class="readylist">' + others.map(o => {
    const n = teamSize(s, o), b = busy.has(o.id);
    return '<div class="readyrow"><b>' + esc(o.name) + '</b><span class="muted">' + ownedFams(o).length + " creatures · " + n + " v " + n + "</span>" +
      '<button class="btn small" data-cc="challenge" data-o="' + o.id + '"' + (b || !n ? " disabled" : "") + ">" + (b ? "In a battle" : "Challenge") + "</button></div>";
  }).join("") + "</div>";
  return h + "</div>";
}

/* ================= overlays ================= */
export function overlays(c) {
  ctx = c;
  let bo = "";
  try { bo = battleOverlay(); } catch (e) { console.error(e); bo = '<div class="battleover"><div class="bpanel"><h3>Oops!</h3><p>The battle screen hit a problem: ' + esc(String(e && e.message || e)) + '</p><button class="btn" data-cc="leaveBattle">Close</button></div></div>'; }
  return hatchOverlay() + bookOverlay() + bo;
}

function hatchOverlay() {
  if (!hatch) return "";
  const r = hatch.res, c = r && creature(r.id);
  let h = '<div class="hatchover" style="background-image:url(assets/hatch-bg.jpg)"><div class="hatchstage">';
  if (hatch.phase !== "reveal") {
    // the egg's colour shows its rarity: Common silver, Uncommon green, Rare blue, Super Rare purple, Legendary gold
    const ek = c ? { "Common": "common", "Uncommon": "uncommon", "Rare": "rare", "Super Rare": "superrare", "Legendary": "legendary" }[c.rarity] : null;
    // during Haunt-O-Ween, Ghost-type creatures (and Hexaduck, the Haunt-O-Ween event Legendary) hatch from the spooky egg
    const th = hatch.theme;   // an event egg from a Golden Present always shows that event's egg
    const spooky = th ? th === "haunt" : c && ctx.cls && ctx.cls.haunt && !ctx.cls.gobble && !ctx.cls.jingle && (c.types.includes("Ghost") || c.event === "hex");
    // during Gobble-Palooza, Nature-type creatures (and Thanksolotl) hatch from the harvest egg
    const harvest = th ? th === "gobble" : !spooky && c && ctx.cls && ctx.cls.gobble && !ctx.cls.jingle && (c.types.includes("Nature") || c.event === "thanks");
    // during Jingle Jam, Ice- and Light-type creatures (and Jinglotl) hatch from the Jingle egg
    const jingly = th ? th === "jingle" : !spooky && !harvest && c && ctx.cls && ctx.cls.jingle && (c.types.includes("Ice") || c.types.includes("Light") || c.event === "jingle");
    const egg = spooky ? "assets/egg-haunt.webp" : harvest ? "assets/egg-gobble.webp" : jingly ? "assets/egg-jingle.webp" : ek ? "assets/egg-" + ek + ".webp" : "assets/egg.png";
    h += '<div class="eggwrap ' + hatch.phase + (hatch.legendary || (c && c.rarity === "Legendary") ? " leg" : "") + (spooky ? " haunt" : harvest ? " harvest" : jingly ? " jingly" : "") + '" style="--rc:' + (spooky ? "#B45CFF" : harvest ? "#F2A541" : jingly ? "#9EE3FF" : c ? RARITY_COLOR[c.rarity] : "#FFE6AA") + '"><img class="egg whole" src="' + egg + '" alt="">' +
      '<img class="egg top" src="' + egg + '" alt=""><img class="egg bot" src="' + egg + '" alt=""><span class="flash"></span></div>' +
      '<p class="hatchtxt">' + (hatch.phase === "shake" ? "Something is moving…" : "") + "</p>";
  } else {
    h += '<div class="reveal" style="--rc:' + RARITY_COLOR[c.rarity] + '"><span class="rays"></span>' + img(c, "revimg", r.sparkle) + "</div>" +
      '<div class="revtxt">' + rarityPill(c.rarity) + (r.sparkle ? ' <span class="rpill" style="background:linear-gradient(90deg,#ff7ad9,#ffd84d,#7ae7ff)">\u2728 SPARKLE</span>' : "") + "<h2>" + (r.sparkle ? "\u2728 " : "") + esc(c.name) + "</h2>" +
      (r.event === "bday" ? '<p class="eventmsg ev-bday">\u{1F382} HAPPY BIRTHDAY! ' + (r.dupe ? "Another Wisholotl came to celebrate!" : "<b>Wisholotl, " + esc(c.title || "") + "</b>, came to make your wish come true!") + "</p>" : "") +
      (r.event && r.event !== "bday" ? '<p class="eventmsg ev-' + r.event + '">' + (r.event === "hex" ? "\u{1F383}" : r.event === "thanks" ? "\u{1F983}" : r.event === "jingle" ? "\u{1F384}" : r.event === "pickle" ? "\u{1F952}" : r.event === "brew" ? "\u{1F9EA}" : "\u{1F986}") + (r.event === "pickle" || r.event === "brew" ? " EXCLUSIVE EVENT LEGENDARY! " : " LIMITED EVENT LEGENDARY! ") + (r.dupe ? "Another " + esc(c.name) + "!" : "You caught <b>" + esc(c.name) + ", " + esc(c.title || "") + "</b>! It\u2019s yours forever.") + "</p>" : "") +
      (r.newSparkle ? '<p class="sparkmsg">WOW! A 1-in-2,000 Sparkle! Your ' + esc(c.name) + " family is now Sparkle forever.</p>" : "") +
      (r.dupe && r.kept ? "<p>\u{1F504} Kept as a <b>spare for trading</b>. Find it under My creatures.</p>"
        : r.dupe ? '<p>You already had this family — <b>free level up! Now Lv ' + r.lvl + "</b>" + (r.evolved ? " and it <b>evolved!</b>" : "") + "</p>" +
          (ctx.cls && ctx.cls.tradeOff ? "" : '<p><button class="btn small ghost" data-cc="keepSpare">\u{1F504} Keep it as a spare for trading instead</button></p>')
        : "<p><b>NEW!</b> Added to your lorebook.</p>") +
      '<div class="row" style="justify-content:center;margin-top:10px;">' +
      (pullsLeft(ctx.me, ctx.cls) && !hatch.legendary ? '<button class="btn big" data-cc="hatch">\u{1F95A} Hatch another</button>' : "") +
      '<button class="btn ghost big" data-cc="hatchDone">Done</button></div></div>';
  }
  return h + "</div></div>";
}

function lorePageIds(page) { return CREATURES.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE); }
const PAGES = Math.ceil(CREATURES.length / PER_PAGE);
function bookOverlay() {
  if (!book) return "";
  const seen = seenSet(ctx.me);
  let h = '<div class="bookover"><button class="bookx" data-cc="bookClose" aria-label="Close lorebook">✕</button>';
  if (!book.open) {
    return h + '<div class="book"><button class="cover' + (book.opening ? " opening" : "") + '" data-cc="bookOpen" style="background-image:url(assets/lore-cover.jpg)" aria-label="Open the lorebook"></button>' +
      '<p class="booktip">Tap the book to open it</p></div></div>';
  }
  h += '<div class="book"><div class="lpage ' + (book.flip || "") + '" style="background-image:url(assets/lore-page.jpg)">';
  if (book.detail) h += detailPage(creature(book.detail), seen);
  else {
    h += '<h3 class="lptitle">Lorebook <span>' + seen.size + " / " + CREATURES.length + " discovered</span></h3><div class=\"lgrid\">";
    lorePageIds(book.page).forEach(c => {
      const got = seen.has(c.id);
      h += got ? '<button class="lentry" data-cc="detail" data-id="' + c.id + '"><span class="num">#' + c.id + "</span>" + img(c) + "<b>" + esc(c.name) + (spOf(c.fam) ? ' <span title="You have the Sparkle form">\u2728</span>' : "") + "</b></button>"
        : '<div class="lentry unk"><span class="num">#' + c.id + '</span><span class="q">?</span><b>???</b></div>';
    });
    h += '</div><div class="lnav"><button class="btn small" data-cc="prev"' + (book.page ? "" : " disabled") + '>◀ Prev</button><span>Page ' + (book.page + 1) + " / " + PAGES + '</span><button class="btn small" data-cc="next"' + (book.page < PAGES - 1 ? "" : " disabled") + ">Next ▶</button></div>";
  }
  return h + "</div></div></div>";
}
function detailPage(c, seen) {
  const e = owned(ctx.me)[c.fam], lvl = e ? e.lvl || 1 : 1, cur = e && formOf(c.fam, lvl).id === c.id, st = statsOf(c, cur ? lvl : 1);
  const fam = family(c.fam), bank = bankXP(ctx.me, ctx.cls);
  let h = '<div class="dtop"><button class="btn small ghost" data-cc="back">◀ Back to lorebook</button><span class="num">#' + c.id + "</span></div>" +
    '<div class="dhead">' + img(c, "dimg") + "<div><h2>" + esc(c.name) + "</h2>" + (e && e.nick && cur ? '<p class="dline">Your <b>' + esc(e.nick) + "</b></p>" : "") + rarityPill(c.rarity) + " " + typePills(c) +
    '<p class="dline"><b>Weak to:</b> ' + esc(c.weak.join(", ")) + " (takes double damage)</p>" +
    (c.title ? '<p class="dline"><i>' + esc(c.title) + "</i>" + (c.event ? ' <span class="rpill" style="background:#2B6FD6">\u{1F986} Limited event</span>' : "") + "</p>" : "") +
    '<p class="dline"><b>' + (c.move ? "Signature move" : "Attack") + ":</b> " + esc(c.attack) + "</p>" + (c.move ? '<p class="dline muted">' + esc(c.move) + "</p>" : "") +
    (c.dodge ? '<p class="dline"><b>\u{1F4A8} Speedy:</b> dodges ' + Math.round(c.dodge * 100) + "% of attacks in battle</p>" : "") +
    (c.daze ? '<p class="dline"><b>\u2728 Dazzle:</b> ' + Math.round(c.daze * 100) + "% chance to make the opponent\u2019s next attack " + Math.round((c.dazePct || 0) * 100) + "% weaker</p>" : "") +
    (c.atkHeal ? '<p class="dline"><b>\u{1F49A} Recovery:</b> heals ' + Math.round(c.atkHeal * 100) + "% of its HP after every " + esc(c.attack) + "</p>" : "") +
    (c.atkDefDown ? '<p class="dline"><b>\u{1F311} Gravity:</b> ' + Math.round(c.atkDefDown * 100) + "% chance its " + esc(c.attack) + " lowers the opponent\u2019s Defense by " + Math.round((c.atkDefPct || 0.15) * 100) + "% for a turn</p>" : "") +
    (c.alt && c.alt.evade ? '<p class="dline"><b>\u{1F300} Portal:</b> ' + Math.round(c.alt.evade * 100) + "% chance " + esc(c.alt.name) + " lets it dodge the opponent\u2019s next attack</p>" : "") +
    (c.brewFx ? '<p class="dline"><b>\u{1F9EA} Witch\u2019s Brew:</b> every hit does one surprise thing \u2014 poisons the opponent, lowers its Defense for a round, or heals Brewraith a little</p>' : "") +
    (c.poison ? '<p class="dline"><b>\u{1F922} Poison:</b> ' + Math.round(c.poison * 100) + "% chance its attack poisons the opponent (loses a little HP for 3 rounds)</p>" : "") +
    (c.alt ? '<p class="dline"><b>Second attack:</b> ' + esc(c.alt.name) + (c.alt.type ? " (" + esc(c.alt.type) + ")" : "") + " \u2014 a bit less damage" + (c.alt.heal ? ", and heals " + Math.round(c.alt.heal * 100) + "% of its HP" : "") + (c.alt.defDown ? ", " + Math.round(c.alt.defDown * 100) + "% chance to lower the opponent\u2019s defense" + (c.alt.defTemp ? " for its next turn" : "") : "") + "</p>" + (c.alt.desc ? '<p class="dline muted">' + esc(c.alt.desc) + "</p>" : "") : "") + "</div></div>" +
    '<div class="dstats"><span>❤ HP <b>' + st.hp + "</b></span><span>\u{1F6E1} Defense <b>" + st.df + "</b></span><span>⚔ Damage <b>" + st.dmg + "</b></span><span>Lv <b>" + (cur ? lvl : 1) + "</b></span></div>" +
    '<p class="muted" style="text-align:center;margin:2px 0 8px;">' + (cur ? "Your creature’s stats at level " + lvl : "Stats at level 1") + " · grows +" + c.ghp + " HP, +" + c.gdf + " DEF, +" + c.gdmg + " DMG per level</p>";
  if (fam.forms.length > 1) h += '<div class="dchain">' + fam.forms.map((id, i) => { const f = creature(id), got = seen.has(id);
    return (i ? '<span class="arr">→' + (creature(fam.forms[i - 1]).evolvesAt ? "<small>Lv " + creature(fam.forms[i - 1]).evolvesAt + "</small>" : "") + "</span>" : "") +
      '<span class="cf">' + (got ? img(f) + "<small>" + esc(f.name) + "</small>" : '<span class="q">?</span><small>???</small>') + "</span>"; }).join("") + "</div>";
  if (e && e.sparkle) h += '<div class="dalt"><span class="dalt-k">\u2728 Your Sparkle form</span>' + img(c, "dalt-img", true) + "</div>";
  h += '<p class="dlore">' + esc(c.lore) + "</p>";
  if (cur) h += '<div class="row" style="justify-content:center;"><button class="btn" data-cc="lvl" data-fam="' + c.fam + '"' + (bank >= LEVEL_XP && lvl < MAX_LEVEL ? "" : " disabled") + ">⬆ Level up · " + LEVEL_XP + " XP</button><span class=\"muted\">Bank: " + bank + " XP</span></div>";
  return h + '<div class="row" style="justify-content:center;margin-top:10px;"><button class="btn ghost small" data-cc="bookClose">Close lorebook</button></div>';
}

/* ---------- battle overlay ---------- */
function sideOf(bt) { return bt.a.id === ctx.me.id ? "A" : "B"; }
// Rebuild what the screen should show after the first k log events.
function viewState(bt, k) {
  const st = { A: { i: null, hp: {} }, B: { i: null, hp: {} }, line: "" };
  ["A", "B"].forEach(x => (bt.team && bt.team[x] || []).forEach((f, i) => { st[x].hp[i] = f.hp; }));
  (bt.log || []).slice(0, k).forEach(e => {
    if (e.k === "coin") st.line = "\u{1FA99} Coin flip: " + esc(e.s === "A" ? bt.a.name : bt.b.name) + " goes first!";
    if (e.k === "send") { st[e.s].i = e.i; st.line = esc(e.who) + " sends out <b>" + esc(e.n) + "</b>!"; }
    if (e.k === "hit") { const o = e.s === "A" ? "B" : "A"; st[o].hp[e.di] = e.left; st[e.s].i = e.ai; st[o].i = e.di; st.last = e;
      st.line = "<b>" + esc(e.a) + "</b> used " + esc(e.atk) + "! " + (e.dodged && e.portal ? "\u{1F300} " + esc(e.d) + " vanished through a portal!" : e.dodged ? "\u{1F4A8} " + esc(e.d) + " zoomed out of the way!" : e.miss ? "It missed!" : (e.crit ? "\u{1F4A5} Critical hit! " : "") + (e.weak ? "It’s super effective! " : "") + (e.guarded ? "\u{1F6E1}\uFE0F Guarded! " : "") + (e.dazedHit ? "(Still dazzled \u2014 weaker!) " : "") + e.dmg + " damage."); }
    if (e.k === "swap") { st[e.s].i = e.i; st.line = "\u{1F504} " + esc(e.who) + " swaps " + esc(e.from) + " for <b>" + esc(e.n) + "</b>!"; }
    if (e.k === "heal") { st[e.s].hp[e.i] = e.left; st[e.s].i = e.i; st.line = "\u{1F49A} <b>" + esc(e.n) + "</b> healed " + e.amt + " HP!"; }
    if (e.k === "guard") { st[e.s].i = e.i; st.line = "\u{1F6E1}\uFE0F <b>" + esc(e.n) + "</b> is guarding!"; }
    if (e.k === "poison") st.line = "\u{1F952} <b>" + esc(e.d) + "</b> was poisoned!";
    if (e.k === "evade") st.line = "\u{1F300} <b>" + esc(e.n) + "</b> slipped into a tiny portal \u2014 it will dodge the next attack!";
    if (e.k === "defdown" && e.src === "void") st.line = "\u{1F311} Gravity crushes <b>" + esc(e.d) + "</b>! Its defense dropped " + e.pct + "% for a turn.";
    else if (e.k === "defdown" && e.src === "brew") st.line = "\u{1F9EA} Witch\u2019s Brew splashes <b>" + esc(e.d) + "</b>! Its defense dropped " + e.pct + "% for a turn.";
    else if (e.k === "defdown") st.line = (e.temp ? "\u{1F338} Blossoms swirl around <b>" + esc(e.d) + "</b>! Its defense dropped " + e.pct + "% for a turn." : "\u{1F4A7} Brine soaked <b>" + esc(e.d) + "</b>! Its defense dropped " + e.pct + "%.");
    if (e.k === "psn") { st[e.s].hp[e.i] = e.left; st[e.s].i = e.i; st.line = "\u{1F922} <b>" + esc(e.n) + "</b> is hurt by poison (-" + e.amt + ")."; }
    if (e.k === "daze") st.line = "\u2728 <b>" + esc(e.d) + "</b> is dazzled! Its next attack does " + e.pct + "% less damage.";
    if (e.k === "faint") st.line = "<b>" + esc(e.n) + "</b> fainted!";
    if (e.k === "forfeit") st.line = "\u{1F3F3}\uFE0F " + esc(e.who) + " gave up.";
    if (e.k === "win") st.line = "\u{1F3C6} <b>" + esc(e.s === "A" ? bt.a.name : bt.b.name) + "</b> wins the battle!";
  });
  return st;
}
/* ---------- battle effects + sound ---------- */
const TYPE_FX = { Fire: "\u{1F525}", Water: "\u{1F4A7}", Nature: "\u{1F343}", Rock: "\u{1FAA8}", Earth: "⛰️", Air: "\u{1F32A}️", Electric: "⚡",
  Ice: "❄️", Light: "✨", Dark: "\u{1F311}", Ghost: "\u{1F47B}", Poison: "\u{1F9EA}", Steel: "⚙️", Normal: "\u{1F4AB}", Arcane: "\u{1F52E}", Crystal: "\u{1F48E}", Dragon: "\u{1F409}" };
function muted() { try { return localStorage.getItem("ck-mute") === "1"; } catch (e) { return false; } }
let actx = null;
function audio() { if (muted()) return null; try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === "suspended") actx.resume(); return actx; } catch (e) { return null; } }
function tone(freq, dur, type, vol, slideTo, at) {
  const a = audio(); if (!a) return; const t = a.currentTime + (at || 0);
  const o = a.createOscillator(), g = a.createGain(); o.type = type || "sine"; o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(vol || 0.15, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
}
function noise(dur, vol, at, hp) {
  const a = audio(); if (!a) return; const t = a.currentTime + (at || 0), n = Math.floor(a.sampleRate * dur), b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = a.createBufferSource(), g = a.createGain(), f = a.createBiquadFilter(); f.type = "highpass"; f.frequency.value = hp || 800;
  src.buffer = b; g.gain.value = vol || 0.12; src.connect(f); f.connect(g); g.connect(a.destination); src.start(t);
}
function playFor(e, me) {
  if (e.k === "hit") { noise(0.25, 0.1, 0, 1200); tone(e.crit ? 180 : 140, 0.22, "triangle", 0.25, 60, 0.35); if (e.crit) { tone(880, 0.12, "square", 0.08, null, 0.35); tone(1320, 0.18, "square", 0.08, null, 0.47); } else if (e.weak) tone(660, 0.15, "sawtooth", 0.06, 990, 0.38); }
  if (e.k === "send") { tone(330, 0.12, "square", 0.07); tone(495, 0.12, "square", 0.07, null, 0.1); tone(660, 0.18, "square", 0.07, null, 0.2); }
  if (e.k === "faint") tone(440, 0.6, "triangle", 0.15, 110);
  if (e.k === "heal") { tone(523, 0.15, "sine", 0.1); tone(784, 0.25, "sine", 0.1, null, 0.12); }
  if (e.k === "guard") tone(220, 0.25, "square", 0.06, 330);
  if (e.k === "swap") { tone(440, 0.1, "square", 0.06); tone(330, 0.12, "square", 0.06, null, 0.1); }
  if (e.k === "win") { const up = e.s === me; (up ? [523, 659, 784, 1047] : [392, 349, 330, 262]).forEach((f, i) => tone(f, 0.22, "square", 0.08, null, i * 0.15)); }
}

function battleOverlay() {
  if (!battleOpen) return "";
  const bt = (ctx.battles || []).find(b => b.id === battleOpen);
  if (!bt) { battleOpen = null; return ""; }
  const me = sideOf(bt), them = me === "A" ? "B" : "A", meN = me === "A" ? bt.a.name : bt.b.name, thN = them === "A" ? bt.a.name : bt.b.name;
  const logLen = (bt.log || []).length, k = Math.min(shown[bt.id] || 0, logLen);
  if (k < logLen && !replayTimer) replayTimer = setTimeout(() => { replayTimer = null; shown[bt.id] = (shown[bt.id] || 0) + 1; ctx.render(true); }, k === 0 ? 400 : 1100);
  const caught = k >= logLen, v = viewState(bt, k);
  let h = '<div class="battleover" style="background-image:url(assets/arena-bg.jpg)"><div class="bhead"><b>' + esc(meN) + "</b> vs <b>" + esc(thN) + '</b><button class="btn ghost small" data-cc="mute" aria-label="Sound">' + (muted() ? "\u{1F507}" : "\u{1F50A}") + '</button><button class="btn ghost small" data-cc="leaveBattle">' + (LIVE.includes(bt.status) ? (busyLeave ? "Yes, end the battle" : "Leave") : "Close") + "</button></div>";
  if (bt.status === "declined") return h + '<div class="bpanel"><p>The challenge was declined.</p></div></div>';
  if (bt.status === "ended") return h + '<div class="bpanel"><h3>Battle ended</h3><p>' + (bt.endedBy === "teacher" ? "Ms. Ariana ended this battle." : bt.endedBy === "time" ? "Nobody moved for a while, so the battle ended." : esc(bt.endedBy === ctx.me.id ? "You" : bt.endedName || thN) + " left the battle.") +
    ' It doesn\u2019t count for anyone.</p><button class="btn big" data-cc="closeBattle">Close</button></div></div>';
  if (leaving === bt.id) h += '<div class="bpanel small"><p>Ending the battle\u2026</p></div>';
  else if (busyLeave && LIVE.includes(bt.status)) h += '<div class="bpanel small"><p>Leave now? The battle ends for both of you and doesn\u2019t count for anyone.</p><div class="row" style="gap:8px;justify-content:center;"><button class="btn small danger" data-cc="leaveBattle">Yes, leave</button><button class="btn ghost small" data-cc="leaveCancel">Keep battling</button></div></div>';
  if (bt.status === "invite") return h + '<div class="bpanel"><p>Waiting for ' + esc(thN) + " to accept…</p></div></div>";
  if (bt.status === "team" && !(bt.team && bt.team[me])) {
    const fams = sortedFams(ctx.me);
    return h + '<div class="bpanel"><h3>Choose your team: pick ' + bt.n + "</h3><div class=\"teamgrid\">" + fams.map(f => { const c = formOf(f, owned(ctx.me)[f].lvl || 1), on = picks.includes(f);
      return '<button class="tpick' + (on ? " on" : "") + '" data-cc="pickTeam" data-fam="' + f + '">' + (owned(ctx.me)[f].fav ? '<span class="tfav">\u2B50</span>' : "") + img(c, "", spOf(f)) + "<b>" + esc(owned(ctx.me)[f].nick || c.name) + "</b><small>Lv " + (owned(ctx.me)[f].lvl || 1) + "</small></button>"; }).join("") +
      '</div><button class="btn big" data-cc="lockTeam"' + (picks.length === bt.n && locking !== bt.id ? "" : " disabled") + ">" + (locking === bt.id ? "Locking in\u2026" : "Lock in team (" + picks.length + "/" + bt.n + ")") + "</button></div></div>";
  }
  if (bt.status === "team") return h + '<div class="bpanel"><p>Team locked in! Waiting for ' + esc(thN) + " to choose…</p></div></div>";
  // field: animate only the event that was just revealed
  const lastEv = (bt.log || [])[k - 1], fresh = lastEv && animated[bt.id] !== k ? lastEv : null;
  animated[bt.id] = k;
  const anim = fresh && fresh.k === "hit" ? fresh : null;
  const healFx = fresh && fresh.k === "heal" ? fresh : null, guardFx = fresh && fresh.k === "guard" ? fresh : null;
  if (fresh) playFor(fresh, me);
  const winner = caught && bt.status === "done" ? bt.winner : null;
  const bob = "animation-delay:-" + (Date.now() % 2600) + "ms";
  h += '<div class="bfield' + (winner ? " won-" + (winner === me ? "me" : "them") : "") + '">' + ["B", "A"].map(x => { const side = x === me ? "mine" : "theirs", i = v[x].i, f = i != null && bt.team[x] ? bt.team[x][i] : null;
    const cls = (anim && anim.s === x ? " attacking" : anim ? " hurt" : "") + (fresh && fresh.k === "send" && fresh.s === x ? " enter" : "") +
      (winner ? (winner === x ? " cheer" : " bow") : "");
    return '<div class="fside ' + side + cls + '">' + (f ? '<div class="fbar"><b>' + esc(f.name) + "</b> Lv " + f.lvl +
      '<span class="hpt"><span style="width:' + Math.max(0, v[x].hp[i] / f.hp * 100) + '%"></span></span><small>' + v[x].hp[i] + " / " + f.hp + "</small></div>" +
      '<div class="mon" style="' + bob + '"><span class="flipper' + (((x === me) ? (f.face === "L") : (f.face !== "L")) ? " flip" : "") + '">' + img(f, "fimg" + (v[x].hp[i] <= 0 ? " ko" : ""), f.sparkle) + "</span></div>" : '<div class="fbar"><small>' + esc(x === me ? "Choose who goes first" : "Waiting…") + "</small></div>") +
      '<div class="balls">' + (bt.team[x] || []).map((t, j) => '<span class="' + (v[x].hp[j] <= 0 ? "ko" : "") + '"></span>').join("") + "</div></div>"; }).join("");
  if (anim) {
    const att = bt.team[anim.s][anim.ai], fromMine = anim.s === me, fx = TYPE_FX[att.type] || "\u{1F4AB}";
    h += '<div class="bfx ' + (fromMine ? "up" : "down") + (anim.crit ? " crit" : "") + '"><span class="proj">' + fx + "</span><span class=\"proj p2\">" + fx + "</span><span class=\"proj p3\">" + fx + "</span>" +
      '<span class="boom">' + fx + "</span>" +
      '<span class="dnum' + (anim.crit ? " crit" : anim.weak ? " weak" : "") + '">' + (anim.miss ? "MISS!" : (anim.crit ? "CRIT! " : "") + "-" + anim.dmg + (anim.weak && !anim.crit ? "<small>super effective!</small>" : anim.guarded ? "<small>guarded</small>" : "")) + "</span></div>";
  }
  if (healFx || guardFx) { const e = healFx || guardFx; h += '<div class="bfx2 ' + (e.s === me ? "mine" : "theirs") + '"><span>' + (healFx ? "\u{1F49A} +" + healFx.amt : "\u{1F6E1}\uFE0F") + "</span></div>"; }
  if (winner) h += '<div class="confetti">' + Array.from({ length: 36 }, (_, n) => '<i style="left:' + ((n * 37) % 100) + "%;animation-delay:" + ((n * 97) % 1400) + "ms;background:" + ["#FFD34D", "#FF7AD9", "#7AE7FF", "#8BF08B", "#B08CFF"][n % 5] + '"></i>').join("") + "</div>";
  h += "</div>";
  h += '<div class="bline">' + (v.line || "&nbsp;") + "</div>";
  if (caught && bt.status === "lead" && bt.active && bt.active[me] == null) {
    const opts = bt.team[me].map((f, i) => ({ f, i })).filter(o => o.f.cur > 0);
    h += '<div class="bpanel"><h3>' + ((bt.log || []).some(e => e.k === "send" && e.s === me) ? "Send out your next creature" : "Who goes first?") + '</h3><div class="teamgrid">' +
      opts.map(o => '<button class="tpick" data-cc="lead" data-i="' + o.i + '">' + img(o.f, "", o.f.sparkle) + "<b>" + esc(o.f.name) + "</b><small>❤ " + o.f.cur + "/" + o.f.hp + "</small></button>").join("") + "</div></div>";
  } else if (caught && bt.status === "lead") h += '<div class="bpanel small"><p>Waiting for ' + esc(thN) + " to choose…</p></div>";
  if (caught && bt.status === "fight") h += movePanel(bt, me, them, thN);
  if (caught && bt.status === "done") h += '<div class="bpanel"><h3>' + (bt.forfeit ? (bt.forfeit === me ? "You gave up this battle." : "\u{1F3F3}\uFE0F " + esc(thN) + " gave up.") + '</h3><p class="small" style="margin:-4px 0 10px;color:#CFC3E6;">Battles that end with Give up don\u2019t count toward badges.</p><h3 style="display:none">' : bt.winner === me ? "\u{1F3C6} You win!" : "Good battle!") + '</h3><button class="btn big" data-cc="closeBattle">Close</button></div>';
  return h + "</div>";
}

// Pick a move: attack, power move, guard, heal, or swap. Both players pick, then the round plays out.
function movePanel(bt, me, them, thN) {
  const mine = bt.moves && bt.moves[me], theirs = bt.moves && bt.moves[them];
  if (mine) return '<div class="bpanel small"><p>' + MOVES[mine.m].icon + " You picked <b>" + (mine.m === "swap" ? "Swap to " + esc(bt.team[me][mine.to].name) : mine.m === "alt" ? esc((bt.team[me][bt.active[me]].alt || {}).name || "Special") : MOVES[mine.m].name) + "</b>. Waiting for " + esc(thN) + "\u2026</p>" +
    '<button class="btn ghost small" data-cc="undoMove">Change my move</button></div>';
  const f = bt.team[me][bt.active[me]], o = bt.team[them][bt.active[them]];
  const dmg = hitDamage(f, o, false), back = hitDamage(o, f, false);
  let hint = "";
  if (dmg.weak) hint += '<span class="bhint good">\u2B50 Your ' + esc(f.type) + " attack is super effective!</span>";
  if (back.weak) hint += '<span class="bhint bad">\u26A0\uFE0F Their ' + esc(o.type) + " attack is super effective on " + esc(f.name) + "! Maybe swap?</span>";
  const btn = (m, label, sub, ok) => '<button class="mvbtn mv-' + m + '" data-cc="move" data-m="' + m + '"' + (ok ? "" : " disabled") + ">" + MOVES[m].icon + " <b>" + label + "</b><small>" + sub + "</small></button>";
  const bench = bt.team[me].map((x, i) => ({ x, i })).filter(r => r.i !== bt.active[me] && r.x.cur > 0);
  return '<div class="bpanel"><h3>What will ' + esc(f.name) + " do?</h3>" + (theirs ? '<p class="muted small" style="margin:-4px 0 8px;color:#CFC3E6;">' + esc(thN) + " has picked a move!</p>" : "") +
    (hint ? '<div class="bhints">' + hint + "</div>" : "") +
    '<div class="mvgrid">' +
      btn("attack", esc(f.attack), "about " + dmg.dmg + " damage" + (f.daze ? " \u00b7 " + Math.round(f.daze * 100) + "% chance to dazzle" : "") + (f.poison ? " \u00b7 " + Math.round(f.poison * 100) + "% chance to poison" : "") + (f.atkHeal ? " \u00b7 heals +" + Math.round(f.hp * f.atkHeal) + " HP" : "") + (f.brewFx ? " \u00b7 surprise: poison, Defense down or heal" : "") + (f.atkDefDown ? " \u00b7 " + Math.round(f.atkDefDown * 100) + "% chance to lower Defense" : ""), true) +
      (f.alt ? (() => { const ad = hitDamage(f.alt.type ? Object.assign({}, f, { type: f.alt.type }) : f, o, false);
        return btn("alt", esc(f.alt.name), "about " + Math.max(1, Math.round(ad.dmg * (f.alt.mult || 1))) + " damage" + (ad.weak ? " \u2B50" : "") + (f.alt.heal ? " \u00b7 heals +" + Math.round(f.hp * f.alt.heal) + " HP" : "") + (f.alt.defDown ? " \u00b7 " + Math.round(f.alt.defDown * 100) + "% chance to lower defense" : "") + (f.alt.evade ? " \u00b7 " + Math.round(f.alt.evade * 100) + "% chance to dodge the next attack" : ""), true); })() : "") +
      btn("power", "Power Move", "about " + Math.round(dmg.dmg * MOVES.power.mult) + " damage \u00b7 75% to hit", true) +
      btn("guard", "Guard", "take half damage this round", true) +
      btn("heal", "Heal", f.healed ? "already used" : f.cur >= f.hp ? "already full health" : "+" + Math.min(f.hp - f.cur, Math.round(f.hp * MOVES.heal.pct)) + " HP \u00b7 once", !f.healed && f.cur < f.hp) +
    "</div>" +
    (bench.length ? '<p class="muted small" style="margin:10px 0 6px;color:#CFC3E6;">\u{1F504} Or swap (uses your turn):</p><div class="teamgrid">' +
      bench.map(r => { const w = hitDamage(o, r.x, false).weak, g = hitDamage(r.x, o, false).weak;
        return '<button class="tpick" data-cc="move" data-m="swap" data-to="' + r.i + '">' + img(r.x, "", r.x.sparkle) + "<b>" + esc(r.x.name) + "</b><small>\u2764 " + r.x.cur + "/" + r.x.hp + "</small>" +
          (g ? '<small class="good">\u2B50 strong vs them</small>' : w ? '<small class="bad">\u26A0\uFE0F weak to them</small>' : "") + "</button>"; }).join("") + "</div>" : "") +
    "</div>";
}
let busyForfeit = false, busyLeave = false;

/* ================= clicks ================= */
export async function onClick(el, c) {
  ctx = c;
  const a = el.dataset.cc, s = c.me;
  if (a === "starter") { if (hasStarter(s)) return; return c.patch({ coll: { [el.dataset.fam]: { lvl: 1, at: new Date().toISOString() } }, starter: el.dataset.fam }); }
  if (a === "hatchPickle") {
    if (!pickleLeft(s)) return;
    const res = doPull(s, "Legendary", c.cls, { force: PICKLE_FAM });
    hatch = { phase: "shake", res, legendary: true };
    hold(3200); c.render(true);
    c.patch({ coll: res.coll, pickleUsed: (Number(s.pickleUsed) || 0) + 1 }, true);
    later(1900, () => { hatch.phase = "crack"; hold(1400); });
    later(2800, () => { hatch.phase = "reveal"; busyUntil = 0; });
    return;
  }
  if (a === "hatchBrew") {
    if (!brewLegLeft(s)) return;
    const res = doPull(s, "Legendary", c.cls, { force: BREW_FAM });
    hatch = { phase: "shake", res, legendary: true };
    hold(3200); c.render(true);
    c.patch({ coll: res.coll, potionLegUsed: (Number(s.potionLegUsed) || 0) + 1 }, true);
    later(1900, () => { hatch.phase = "crack"; hold(1400); });
    later(2800, () => { hatch.phase = "reveal"; busyUntil = 0; });
    return;
  }
  if (a === "hatchGoal") {
    const key = nextGoal(s); if (!goalLeft(s) || !key) return;
    const res = key === "rare" ? doPull(s, rollRareUp(), c.cls) : doPull(s, "Legendary", c.cls, { force: key });
    hatch = { phase: "shake", res, legendary: key !== "rare" };
    hold(3200); c.render(true);
    c.patch({ coll: res.coll, goalUsed: (Number(s.goalUsed) || 0) + 1 }, true);
    later(1900, () => { hatch.phase = "crack"; hold(1400); });
    later(2800, () => { hatch.phase = "reveal"; busyUntil = 0; });
    return;
  }
  if (a === "hatchTheme") {
    const key = nextTheme(s); if (!themeLeft(s) || !key) return;
    const res = doPull(s, rollRarity(), c.cls, { types: THEME_TYPES[key] || [] });
    hatch = { phase: "shake", res, theme: key };
    hold(3200); c.render(true);
    c.patch({ coll: res.coll, themeUsed: (Number(s.themeUsed) || 0) + 1 }, true);
    later(1900, () => { hatch.phase = "crack"; hold(1400); });
    later(2800, () => { hatch.phase = "reveal"; busyUntil = 0; });
    return;
  }
  if (a === "hatch" || a === "hatchLeg" || a === "hatchBday") {
    const leg = a === "hatchLeg", bday = a === "hatchBday";
    if (bday ? !birthdayLeft(s) : leg ? !legendaryLeft(s) : !pullsLeft(s, c.cls)) return;
    const res = bday ? doPull(s, "Legendary", c.cls, { force: WISH_FAM })
      : doPull(s, leg ? "Legendary" : s.isTeacher ? rollTeacherRarity() : rollRarity(), c.cls, { legendaryEgg: leg });
    hatch = { phase: "shake", res, legendary: leg || bday };
    const data = { coll: res.coll };
    if (bday) data.birthdayUsed = (Number(s.birthdayUsed) || 0) + 1;
    else if (leg) data.legendaryUsed = (Number(s.legendaryUsed) || 0) + 1; else data.pullsUsed = (Number(s.pullsUsed) || 0) + 1;
    hold(3200); c.render(true);
    c.patch(data, true);
    later(1900, () => { hatch.phase = "crack"; hold(1400); });
    later(2800, () => { hatch.phase = "reveal"; busyUntil = 0; });
    return;
  }
  if (a === "hatchDone") { hatch = null; return c.render(true); }
  if (a === "keepSpare") {   // undo the free level and keep the duplicate as a spare instead
    const r = hatch && hatch.res; if (!r || !r.dupe || r.kept || !r.prev) return;
    const coll = Object.assign({}, owned(s)); coll[r.fam] = Object.assign({}, r.prev);
    const list = spares(s).concat([{ id: spareId(), fam: r.fam, lvl: 1, at: new Date().toISOString(), ...(r.sparkle ? { sparkle: true } : {}) }]);
    r.kept = true; r.id = formOf(r.fam, 1).id;
    return c.patch({ coll, spares: list });
  }
  if (a === "useSpare") {   // turn a spare back into a free level (or make it the main one if you don't have that family)
    const sp = spares(s).find(x => x.id === el.dataset.sp); if (!sp) return;
    const coll = Object.assign({}, owned(s)), had = coll[sp.fam];
    coll[sp.fam] = had ? Object.assign({}, had, { lvl: Math.min(MAX_LEVEL, (had.lvl || 1) + 1) }) : { lvl: sp.lvl || 1, at: new Date().toISOString(), ...(sp.sparkle ? { sparkle: true } : {}) };
    c.flash(had ? "Used your spare: +1 level!" : "It\u2019s part of your collection now!", true);
    return c.patch({ coll, spares: spares(s).filter(x => x.id !== sp.id) });
  }
  if (a === "release") { releasing = el.dataset.key; releaseMsg = null; return c.render(true); }
  if (a === "releaseCancel") { releasing = null; return c.render(true); }
  if (a === "releaseOk") {   // release a creature (or spare) for banked XP
    const key = el.dataset.key; releasing = null;
    const why = releaseProblem(s, key, c.battles, c.trades);
    if (why) { releaseMsg = { key, why }; c.render(true); setTimeout(() => { if (releaseMsg && releaseMsg.key === key) { releaseMsg = null; c.render(true); } }, 5000); return; }
    let fam, name, data;
    if (key.startsWith("s:")) {
      const sp = spares(s).find(x => x.id === key.slice(2)); fam = sp.fam; name = formOf(fam, sp.lvl || 1).name;
      const dex = new Set(s.dex || []), top = formIndex(fam, sp.lvl || 1); family(fam).forms.forEach((id, i) => { if (i <= top) dex.add(id); });
      data = { spares: spares(s).filter(x => x.id !== sp.id), dex: [...dex] };
    } else {
      fam = key.slice(2); const e = owned(s)[fam], top = formIndex(fam, e.lvl || 1); name = e.nick || formOf(fam, e.lvl || 1).name;
      const coll = Object.assign({}, owned(s)); delete coll[fam];
      const dex = new Set(s.dex || []); family(fam).forms.forEach((id, i) => { if (i <= top) dex.add(id); });   // the lorebook keeps it
      data = { coll, dex: [...dex] };
    }
    const xp = releaseXP(fam); data.xpReleased = (Number(s.xpReleased) || 0) + xp;
    c.flash("Bye, " + name + "! +" + xp + " XP in your bank.", true);
    return c.patch(data);
  }
  if (a === "book") { book = { open: false, page: 0 }; return c.render(true); }
  if (a === "bookOpen") { book.opening = true; hold(900); c.render(true); later(850, () => { book.open = true; book.opening = false; book.flip = "turn-in"; busyUntil = 0; }); return; }
  if (a === "bookClose") { book = null; return c.render(true); }
  if (a === "next" || a === "prev") {
    const d = a === "next" ? 1 : -1; book.flip = d > 0 ? "out-next" : "out-prev"; hold(600); c.render(true);
    later(280, () => { book.page = Math.max(0, Math.min(PAGES - 1, book.page + d)); book.flip = d > 0 ? "in-next" : "in-prev"; });
    later(600, () => { book.flip = ""; busyUntil = 0; });
    return;
  }
  if (a === "nick") { naming = el.dataset.fam; c.render(true); const i = document.getElementById("nickIn"); if (i) { i.focus(); i.select(); } return; }
  if (a === "forTrade") {
    const k = el.dataset.key;
    if (k.startsWith("s:")) { const list = spares(s).map(x => (x.id === k.slice(2) ? Object.assign({}, x, { forTrade: !x.forTrade }) : x)); return c.patch({ spares: list }); }
    const f = k.slice(2), e = owned(s)[f]; if (!e) return;
    const coll = Object.assign({}, owned(s)); coll[f] = Object.assign({}, e); if (e.forTrade) delete coll[f].forTrade; else coll[f].forTrade = true;
    return c.patch({ coll });
  }
  if (a === "ideaStart") { ideaOpen = true; ideaTypes = []; ideaKind = el.dataset.k || "creature"; ideaSlot = "hat"; roomSlot = "bed"; return c.render(true); }
  if (a === "ideaKind") { return keepIdeaFields(() => { ideaKind = el.dataset.k; c.render(true); }); }
  if (a === "roomSlot") { return keepIdeaFields(() => { roomSlot = el.dataset.k; c.render(true); }); }
  if (a === "ideaSlot") { return keepIdeaFields(() => { ideaSlot = el.dataset.k; c.render(true); }); }
  if (a === "ideaCancel") { ideaOpen = false; return c.render(true); }
  if (a === "ideaType") {
    const t = el.dataset.t;
    return keepIdeaFields(() => { ideaTypes = ideaTypes.includes(t) ? ideaTypes.filter(x => x !== t) : ideaTypes.length < 2 ? ideaTypes.concat([t]) : [ideaTypes[1], t]; c.render(true); });
  }
  if (a === "ideaSend") {
    const v = id => ((document.getElementById(id) || {}).value || "").replace(/\s+/g, " ").trim();
    const name = v("ideaName").slice(0, 30), animal = v("ideaAnimal").slice(0, 40), lore = ((document.getElementById("ideaLore") || {}).value || "").trim().slice(0, 600);
    const gear = ideaKind === "gear", room = ideaKind === "room";
    if (!name) return c.flash(gear ? "Give your accessory a name!" : room ? "Give your decoration a name!" : "Give your creature a name!");
    if (!gear && !room && !ideaTypes.length) return c.flash("Pick at least one type!");
    const today = azToday();
    if (!hitGoalToday(s, c.cls) || (s.ideas || []).some(x => x.date === today)) return;
    const idea = room ? { date: today, kind: "room", name, slot: roomSlot, at: new Date().toISOString() } : gear ? { date: today, kind: "gear", name, slot: ideaSlot, at: new Date().toISOString() } : { date: today, kind: "creature", name, types: ideaTypes.slice(), at: new Date().toISOString() };
    if (lore) idea.lore = lore; if (animal && !gear && !room) idea.animal = animal;
    ideaOpen = false; ideaTypes = [];
    await c.patch({ ideas: (s.ideas || []).concat([idea]) });
    return c.flash("\u{1F4A1} Idea sent to Ms. Ariana!", true);
  }
  if (a === "fav") {
    const f = el.dataset.fam, e = owned(s)[f]; if (!e) return;
    const coll = Object.assign({}, owned(s)); coll[f] = Object.assign({}, e); if (e.fav) delete coll[f].fav; else { coll[f].fav = true; delete coll[f].forTrade; }
    return c.patch({ coll });
  }
  if (a === "nickCancel") { naming = null; return c.render(true); }
  if (a === "nickSave") {
    const f = el.dataset.fam, i = document.getElementById("nickIn"), e = owned(s)[f]; if (!e) return;
    const nick = (i ? i.value : "").replace(/\s+/g, " ").trim().slice(0, NICK_MAX);
    const coll = Object.assign({}, owned(s)); coll[f] = Object.assign({}, e); if (nick) coll[f].nick = nick; else delete coll[f].nick;
    naming = null; return c.patch({ coll });
  }
  if (a === "detail") {
    const id = Number(el.dataset.id);
    if (!book) book = { open: true, page: Math.floor((id - 1) / PER_PAGE) };
    book.open = true; book.detail = id; book.flip = "in-next"; return c.render(true);
  }
  if (a === "back") { book.detail = null; book.flip = "in-prev"; return c.render(true); }
  if (a === "lvl") {
    const f = el.dataset.fam, e = owned(s)[f]; if (!e || bankXP(s, c.cls) < LEVEL_XP || (e.lvl || 1) >= MAX_LEVEL) return;
    const before = formOf(f, e.lvl || 1), coll = Object.assign({}, owned(s), { [f]: Object.assign({}, e, { lvl: (e.lvl || 1) + 1 }) }), after = formOf(f, (e.lvl || 1) + 1);
    if (book && book.detail === before.id) book.detail = after.id;
    await c.patch({ coll, xpSpent: (Number(s.xpSpent) || 0) + LEVEL_XP });
    c.flash(after.id !== before.id ? "✨ " + before.name + " evolved into " + after.name + "!" : before.name + " is now Lv " + ((e.lvl || 1) + 1) + "!", true);
    return;
  }
  // arena
  if (a === "ready") return c.patch({ arenaReady: !s.arenaReady });
  if (a === "challenge") {
    const o = c.students.find(x => x.id === el.dataset.o); if (!o) return;
    if (busyIds().has(s.id)) return c.flash("Finish your battle first!");
    // Student pages don't follow other kids' battles (it saves a lot of Firebase reads), so check right now.
    let live = [];
    try { live = await liveBattlesNow(); } catch (e) { live = c.battles || []; }
    if (live.some(b => !staleBattle(b) && b.a && b.b && (b.a.id === o.id || b.b.id === o.id))) return c.flash(o.name + " is in a battle right now \u2014 try again in a bit!");
    if (live.some(b => !staleBattle(b) && b.a && b.b && (b.a.id === s.id || b.b.id === s.id))) return c.flash("Finish your battle first!");
    await setDoc(newBattleRef(), { a: { id: s.id, name: s.name }, b: { id: o.id, name: o.name }, ids: [s.id, o.id], status: "invite", created: new Date().toISOString(), log: [] });
    return c.flash("Challenge sent to " + o.name + "!", true);
  }
  if (a === "accept") {
    const id = el.dataset.b;
    await changeBattle(id, bt => {
      if (bt.status !== "invite") return null;
      const A = c.students.find(x => x.id === bt.a.id), B = c.students.find(x => x.id === bt.b.id);
      bt.n = teamSize(A, B); bt.status = "team"; bt.turn = Math.random() < 0.5 ? "A" : "B";
      bt.team = { A: null, B: null }; bt.active = { A: null, B: null }; bt.log = [{ k: "coin", s: bt.turn }];
      return bt;
    });
    battleOpen = id; picks = []; return c.render(true);
  }
  if (a === "decline") {
    const r = await changeBattle(el.dataset.b, bt => (bt.status === "invite" ? Object.assign(bt, { status: "declined", ["seen_" + s.id]: true }) : null));
    if (!r) c.flash("That challenge already started or was cancelled.");
    return c.render(true);
  }
  if (a === "enter") { battleOpen = el.dataset.b; picks = []; busyLeave = false; return c.render(true); }
  if (a === "mute") { try { localStorage.setItem("ck-mute", muted() ? "0" : "1"); } catch (e) {} if (!muted()) tone(660, 0.1, "square", 0.06); return c.render(true); }
  if (a === "leaveCancel") { busyLeave = false; return c.render(true); }
  if (a === "leaveBattle") {
    const bt = (c.battles || []).find(b => b.id === battleOpen);
    if (!bt || !LIVE.includes(bt.status)) { battleOpen = null; busyLeave = false; return c.render(true); }
    if (!busyLeave) { busyLeave = true; return c.render(true); }
    if (leaving) return;
    busyLeave = false; const id = battleOpen; leaving = id; c.render(true);
    try {
      await changeBattle(id, b => (LIVE.includes(b.status) ? Object.assign(b, { status: "ended", endedBy: s.id, endedName: s.name, ["seen_" + s.id]: true, moves: { A: null, B: null } }) : null));
      battleOpen = null;
    } catch (e) { c.flash("Couldn\u2019t end the battle \u2014 try again. (" + (e.code || e.message) + ")"); }
    finally { leaving = null; }
    return c.render(true);
  }
  if (a === "pickTeam") {
    const bt = c.battles.find(b => b.id === battleOpen), f = el.dataset.fam;
    picks = picks.includes(f) ? picks.filter(x => x !== f) : picks.length < bt.n ? picks.concat([f]) : picks;
    return c.render(true);
  }
  if (a === "lockTeam") {
    if (locking) return;
    const team = JSON.parse(JSON.stringify(picks.map(f => fighterFrom(s, f)).filter(Boolean)));
    const bt0 = (c.battles || []).find(b => b.id === battleOpen);
    if (!bt0 || team.length !== bt0.n) { picks = picks.filter(f => owned(s)[f]); c.flash("One of those creatures isn\u2019t on your team anymore \u2014 pick again."); return c.render(true); }
    locking = battleOpen; c.render(true);   // show "Locking in…" right away
    try {
      const r = await changeBattle(battleOpen, bt => {
        const me = sideOf(bt); if (bt.status !== "team" || bt.team[me]) return null;
        bt.team[me] = team; if (bt.team.A && bt.team.B) bt.status = "lead"; return bt;
      });
      if (!r) c.flash("That battle already moved on (or ended).");
    } finally { locking = null; c.render(true); }
    return;
  }
  if (a === "lead") {
    const i = Number(el.dataset.i);
    await changeBattle(battleOpen, bt => {
      const me = sideOf(bt); if (bt.status !== "lead" || bt.active[me] != null || !(bt.team[me][i].cur > 0)) return null;
      bt.active[me] = i; bt.log.push({ k: "send", s: me, i, n: bt.team[me][i].name, who: me === "A" ? bt.a.name : bt.b.name });
      if (bt.active.A != null && bt.active.B != null) { bt.status = "fight"; bt.moves = { A: null, B: null }; }
      return bt;
    });
    return;
  }
  if (a === "move") {
    const mv = { m: el.dataset.m }; if (mv.m === "swap") mv.to = Number(el.dataset.to);
    busyForfeit = false;
    await changeBattle(battleOpen, bt => {
      const me = sideOf(bt), them = me === "A" ? "B" : "A";
      if (bt.status !== "fight" || (bt.moves && bt.moves[me]) || !moveOk(bt, me, mv)) return null;
      bt.moves = Object.assign({ A: null, B: null }, bt.moves || {}); bt.moves[me] = mv;
      if (bt.moves[them]) resolveRound(bt);
      return bt;
    });
    return c.render(true);
  }
  if (a === "undoMove") {
    await changeBattle(battleOpen, bt => { const me = sideOf(bt); if (bt.status !== "fight" || !bt.moves || !bt.moves[me]) return null; bt.moves[me] = null; return bt; });
    return c.render(true);
  }
  if (a === "forfeit") {
    if (!busyForfeit) { busyForfeit = true; return c.render(true); }
    busyForfeit = false;
    await changeBattle(battleOpen, bt => { const me = sideOf(bt), them = me === "A" ? "B" : "A";
      if (!["lead", "fight"].includes(bt.status)) return null;
      bt.status = "done"; bt.winner = them; bt.forfeit = me; bt.moves = { A: null, B: null };
      bt.log.push({ k: "forfeit", s: me, who: me === "A" ? bt.a.name : bt.b.name }); bt.log.push({ k: "win", s: them }); return bt; });
    return c.render(true);
  }
  if (a === "closeBattle") {
    const id = battleOpen; battleOpen = null;
    await changeBattle(id, bt => Object.assign(bt, { ["seen_" + s.id]: true }));
    return c.render(true);
  }
}
