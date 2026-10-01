import {
  checkVersion, applyDisplayNames, companionOf, petCreatures, pinnedBadgeHTML, DAYS, SHORT, ROSTER, GEAR, SIDEKICKS, BANNER, bannerFor, isHaunt, battleOn, candyOf, basketHTML, CANDY_FULL, bossState, attacksReady, bossBarHTML, GHOST_IMG, ghostUnlocked, turkeyUnlocked, grinchUnlocked, isJingle, eventMode, isGobble, setSeason, SEASON, seasonOf, STORE, candyLeft, candySpent, ownedCount, ownsItem, storeArt, nextAttack, dmgOf, HAT_BONUS, BREW_BONUS, teamHTML, WHEEL, pickSlice, wheelHTML, spinTo, PRIZES, prizeSlices, bucketState, bucketHTML, baseDamage, EAT_PER_DAY, dayEaten, dayXP, byId, esc, arr5, recordedDays, goalXP,
  simulate, wornItem, tier, boardDay, sidekickToday, sidekickSVG, petHTML, itemArt
} from "./game.js?v=20261001g";
import { PREVIEW, configured, auth, studentRef, watchClass, watchStudents, watchBattles, watchTrades, anonSignIn, onAuthStateChanged, updateDoc } from "./db.js?v=20261001g";
import { nudgeCard } from "./nudges.js?v=20261001g";
import { badgesTab, newlyEarned, badgeParty, unseenBadges } from "./badges.js?v=20261001g";
import { teacherPlayer, hasStarter } from "./collect.js?v=20261001g";
import { onTradeClick, onTradeChange, onTradeReady, settleTrades } from "./trade-ui.js?v=20261001g";
import { doorsLive, doorsFor, dayDoors, doorState, doorLocked, gateOpen, allDone, goldenReady, rollPresent, rewardText, REWARD_XP, DOOR_GATE, DOOR_ART, doorName, isFree, doorText, gateLabel, hasLocked } from "./doors.js?v=20261001g";
import { azToday } from "./collect.js?v=20261001g";
import { roomHTML, FIT_SLOTS, slotKind, KIND_NAMES, KIND_ICON, EVERYDAY_PRICE, THEMED_PRICE, TROPHY_PRICE, TYPE_THEMES, SEASON_THEMES, THEME_NAMES, TROPHIES,
  itemArt as roomArt, itemName, parseItem, owned as roomOwned, bought as roomBought, STARTERS as ROOM_STARTERS, fitOf, cpLeft, cpEarned, everydayItems, setItems, setPrice, liveSeason, trophyUnlocked, itemId } from "./room.js?v=20261001g";
import { collectorTab, overlays as collectorOverlays, onClick as collectorClick, isBusy as collectorBusy } from "./collector-ui.js?v=20261001g";

let cls = null, students = [], battles = [], trades = [], loaded = { c: false, s: false };
let tab = (() => { try { return localStorage.getItem("ck-tab") || "pet"; } catch (e) { return "pet"; } })();
let me = new URLSearchParams(location.search).get("s") || load();
let attackFx = null, fxTimer = null;
const busy = {};
let wheelRot = 0, wheelBusy = false, wheelResult = null;
let prizeWheel = null;   // { idx, rot, done } while the Prize Wheel pop-up is open
let present = null;      // { date, k, r, phase: "shake" | "open", golden, prize } while a present is being opened
let flashOk = false, picking = null, draftName = "", flashMsg = null, flashTimer = null, error = null;

function load() { try { return localStorage.getItem("ck-student"); } catch (e) { return null; } }
function save(id) { if (PREVIEW) return; try { id ? localStorage.setItem("ck-student", id) : localStorage.removeItem("ck-student"); } catch (e) {} }
// Any error while clicking in the Collector (battles, trades) shows on screen instead of failing silently.
function showErr(e) { console.error(e); flash("Something went wrong \u2014 " + ((e && (e.code || e.message)) || e) + ". Tell Ms. Ariana!"); }
function flash(m, ok) { flashMsg = m; flashOk = !!ok; render(); clearTimeout(flashTimer); flashTimer = setTimeout(() => { flashMsg = null; render(); }, 4000); }
const app = document.getElementById("app");

if (!configured) { error = "This page isn’t connected yet. Ask your teacher."; render(); }
else {
  onAuthStateChanged(auth, u => {
    if (!u) { anonSignIn().catch(e => { error = "Couldn’t connect (" + e.code + "). Try reloading."; render(); }); return; }
    watchClass(c => { cls = c; setSeason(c); loaded.c = true; if (!PREVIEW && checkVersion(c, false)) return; render(); }, e => { error = "Couldn’t load your class (" + e.code + ")."; render(); });
    watchStudents(l => { students = applyDisplayNames(l); loaded.s = true; nameBattles(); const s = students.find(x => x.id === me); if (s && !PREVIEW && trades.length) settleTrades(collectorCtx(s)); render(); }, e => { error = "Couldn’t load your class (" + e.code + ")."; render(); });
    watchBattles(l => { battles = l; nameBattles(); render(); }, () => {});
    watchTrades(l => { trades = l; const s = students.find(x => x.id === me); if (s && !PREVIEW) settleTrades(collectorCtx(s)); render(); }, () => {});
    setInterval(() => render(), 60000);   // arena opens/closes on the clock
  });
}

// Show battle players by their display name (first name, plus last initial if two share it).
function nameBattles() { battles.forEach(b => [b.a, b.b].forEach(x => { const s = x && students.find(y => y.id === x.id); if (s) x.name = s.name; })); }

async function patch(data, quiet) {
  const s = students.find(x => x.id === me); if (s) Object.assign(s, data);
  if (!quiet) render(true);
  try { await updateDoc(studentRef(me), data); } catch (e) { flash("That didn’t save — ask your teacher. (" + (e.code || e.message) + ")"); }
}

// Badges are saved the moment they're earned and never taken away (the teacher console saves them too).
let badgeWriting = false, partyKey = "";
function lockBadges(s) {
  if (badgeWriting || PREVIEW) return;
  const ids = newlyEarned(s, battles, cls); if (!ids.length) return;
  const at = new Date().toISOString(), data = {};
  ids.forEach(id => { data["badges." + id] = at; });
  s.badges = Object.assign({}, s.badges || {}); ids.forEach(id => { s.badges[id] = at; });
  badgeWriting = true;
  updateDoc(studentRef(s.id), data).catch(() => {}).finally(() => { badgeWriting = false; });
}
// 🎂 Birthday pop-up: shows once each time the teacher sends a birthday egg (bdaySeen counts the ones already shown).
let bdayChimed = false;
function birthdayParty(s) {
  if (!((Number(s.birthdayEggs) || 0) > (Number(s.bdaySeen) || 0))) return "";
  const cols = ["#FF7AC6", "#FFB84D", "#7AD7FF", "#B28CFF", "#7BE0A0", "#FFE066"];
  let conf = "";
  for (let i = 0; i < 70; i++) conf += '<i style="left:' + ((i * 37) % 100) + "%;background:" + cols[i % cols.length] + ";animation-delay:" + ((i * 0.13) % 3).toFixed(2) + "s;animation-duration:" + (2.6 + (i % 5) * 0.4).toFixed(1) + "s;" + (i % 3 ? "" : "border-radius:50%;") + '"></i>';
  return '<div class="bdayover" role="dialog" aria-label="Happy birthday"><div class="confetti" aria-hidden="true">' + conf + "</div>" +
    '<div class="bdaybox"><div class="bdaycake">\u{1F382}</div><h2>Happy Birthday, ' + esc(s.name) + "!</h2>" +
    '<img src="assets/creatures/l28-1.webp" alt="" class="bdaywish">' +
    "<p>Ms. Ariana sent you a <b>birthday egg</b>! Something magical is waiting inside\u2026 \u2728</p>" +
    '<div class="row" style="justify-content:center;gap:10px;margin-top:12px;"><button class="btn big bday" data-bdayok="hatch">\u{1F95A} Open my birthday egg!</button>' +
    '<button class="btn ghost" data-bdayok="later">Later</button></div></div></div>';
}
function birthdayTune() {
  try { if (localStorage.getItem("ck-mute") === "1") return; } catch (e) {}
  try {   // "Happy Birthday" first line
    const ac = new (window.AudioContext || window.webkitAudioContext)(), t = ac.currentTime;
    [[392, .3], [392, .15], [440, .45], [392, .45], [523, .45], [494, .9]].reduce((at, [f, d]) => {
      const o = ac.createOscillator(), g = ac.createGain(); o.type = "triangle"; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t + at); g.gain.exponentialRampToValueAtTime(0.16, t + at + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + at + d);
      o.connect(g).connect(ac.destination); o.start(t + at); o.stop(t + at + d + 0.05); return at + d;
    }, 0);
  } catch (e) {}
}
function badgeChime() {
  try { if (localStorage.getItem("ck-mute") === "1") return; } catch (e) {}
  try {
    const ac = new (window.AudioContext || window.webkitAudioContext)(), t = ac.currentTime;
    [523, 659, 784, 1047].forEach((f, i) => {
      const o = ac.createOscillator(), g = ac.createGain(); o.type = "triangle"; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t + i * 0.12); g.gain.exponentialRampToValueAtTime(0.18, t + i * 0.12 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.12 + 0.5);
      o.connect(g).connect(ac.destination); o.start(t + i * 0.12); o.stop(t + i * 0.12 + 0.55);
    });
  } catch (e) {}
}

// The teacher can battle too: she's added to the arena list as "Ms. Ariana" once she has a starter creature.
function collectorCtx(s) {
  const t = cls && cls.teacher ? teacherPlayer(cls) : null;
  return { cls, students: t && hasStarter(t) ? students.concat([t]) : students, battles, trades, me: s, patch, render, flash };
}
function render(force) {
  if (wheelBusy) return;          // don't redraw mid-spin; the spin calls render() when it stops
  if (!force && collectorBusy()) return;   // egg hatch / page flip animations call render(true) themselves
  const active = document.activeElement, keep = active && active.id && active.matches("input") ? { id: active.id, pos: active.selectionStart } : null;
  let h = cls ? bannerFor(cls) : BANNER;
  if (flashMsg) h += '<div class="banner ' + (flashOk ? "info" : "bad") + '">' + esc(flashMsg) + "</div>";
  if (error) h += '<div class="card"><p class="lede">' + esc(error) + "</p></div>";
  else if (!loaded.c || !loaded.s) h += '<div class="card"><p class="lede">Loading your class…</p></div>';
  else if (!cls) h += '<div class="card"><p class="lede">Your teacher hasn’t opened the Keep yet. Check back soon!</p></div>';
  else {
    const s = students.find(x => x.id === me);
    if (me && !s) { me = null; save(null); }
    h += s ? (s.companionId ? viewMine(s) : viewChoose(s)) : viewNames();
  }
  const cur = students.find(x => x.id === me);
  if (cur && cur.companionId && cls) lockBadges(cur);
  const bday = !PREVIEW && cur && cur.companionId && cls && !prizeWheel && !present && !collectorBusy() ? birthdayParty(cur) : "";
  const party = !bday && !PREVIEW && cur && cur.companionId && cls && !prizeWheel && !present && !collectorBusy() ? badgeParty(cur) : "";
  app.innerHTML = h + presentOverlay() + prizeOverlay() + (cur && cur.companionId && cls ? collectorOverlays(collectorCtx(cur)) : "") + party + bday;
  if (bday && !bdayChimed) { bdayChimed = true; birthdayTune(); }
  if (party) { const key = unseenBadges(cur).join(","); if (key !== partyKey) { partyKey = key; badgeChime(); } }
  if (keep) { const n = document.getElementById(keep.id); if (n) { if (keep.id === "nickIn") n.value = keep.v; n.focus(); try { n.setSelectionRange(keep.pos, keep.pos); } catch (e) {} } }
}

function viewNames() {
  return '<div class="card"><div class="card-head"><h2>Who are you?</h2>' + (cls.className ? '<span class="fact">' + esc(cls.className) + "</span>" : "") + "</div>" +
    '<div class="namegrid">' + students.map(s => '<button class="namebtn" data-me="' + s.id + '">' + esc(s.name) + "</button>").join("") + "</div></div>";
}

function notYou(s) {
  if (PREVIEW) return '<div class="previewbar"><span>\u{1F440} <b>Teacher preview:</b> you\u2019re seeing ' + esc(s.name) + '\u2019s page. Nothing you click here is saved.</span>' +
    '<label>View as <select id="previewPick">' + students.map(x => '<option value="' + x.id + '"' + (x.id === s.id ? " selected" : "") + ">" + esc(x.name) + "</option>").join("") + "</select></label></div>";
  return '<div class="row" style="justify-content:space-between;align-items:center;margin-bottom:12px;"><span class="lede">Hi, <b>' + esc(s.name) +
    '</b>!</span><button class="btn ghost small" data-act="notMe">Not you?</button></div>';
}

function viewChoose(s) {
  const pick = picking && byId(ROSTER, picking);
  let h = notYou(s) + '<div class="card"><div class="card-head"><h2>Choose your companion</h2></div>' +
    '<p class="lede" style="margin-bottom:12px;">Pick carefully — it stays with you all year. Only your teacher can switch it later.</p>' +
    '<div class="pickgrid">' + ROSTER.map(c => '<button class="pick' + (picking === c.id ? " on" : "") + '" data-pick="' + c.id + '"><span class="g">' + c.glyph +
      '</span><span class="n">' + esc(c.name) + "</span></button>").join("") + "</div>";
  if (pick) {
    h += '<div class="row" style="margin-top:16px;"><div class="field" style="flex:1;min-width:200px;"><label for="petName">Name your ' + esc(pick.name) + '</label>' +
      '<input id="petName" type="text" maxlength="22" placeholder="' + esc(pick.name) + '" value="' + esc(draftName) + '"></div>' +
      '<button class="btn" data-act="choose">Choose ' + pick.glyph + "</button></div>";
  }
  return h + "</div>";
}

function viewMine(s) {
  const c = companionOf(s), sim = simulate(s, cls), t = tier(sim), worn = wornItem(s, sim);
  const bd = boardDay(cls, students), side = sidekickToday(s, bd), rec = recordedDays(cls), goal = goalXP(cls);
  const status = arr5(s.status, ""), early = arr5(s.early, false);
  let msg;
  if (!sim.started) msg = "Hit " + goal + " XP every day to keep " + esc(s.petName || c.name) + " healthy!";
  else if (!sim.alive) msg = sim.capeReady ? "Your teacher can give you a Hero Cape to bring " + esc(s.petName || c.name) + " back!" : esc(s.petName || c.name) + " disappeared. Hit " + goal + " XP to earn a Hero Cape.";
  else if (sim.atRisk) msg = "Half health! Hit " + goal + " XP tomorrow or " + esc(s.petName || c.name) + " disappears.";
  else msg = esc(s.petName || c.name) + " is at full health. Keep it up!";

  const haunt = eventMode(cls), candy = haunt ? candyLeft(s) : 0, S = seasonOf(cls);
  if (tab === "haunt" && !haunt) tab = "pet";
  const doorsOn = doorsLive(cls);
  if (tab === "doors" && !doorsOn) tab = "pet";
  let h = notYou(s) + '<div class="tabs" role="tablist">' +
    [["pet", "\u{1F43E} My Companion"], ["collect", "\u{1F95A} Creature Collector"], ["badges", "\u{1F3C5} Badges"]].concat(haunt ? [["haunt", S.icon + " " + S.name]] : []).concat(doorsOn ? [["doors", "\u{1F6AA} " + doorName() + doorBadge(s)]] : []).concat([["room", "\u{1F6CF}\uFE0F My Room"]])
      .map(([k, t]) => '<button role="tab" class="tab' + (tab === k ? " on" : "") + '" data-tab="' + k + '" aria-selected="' + (tab === k) + '">' + t + "</button>").join("") + "</div>";
  if (tab === "collect") return h + collectorTab(collectorCtx(s));
  if (tab === "badges") return h + badgesTab(s, battles, cls);
  if (tab === "haunt") return h + (battleOn(cls) ? battleCard(s, c) : "") + wheelCard(s) + shopCard(s);
  if (tab === "doors") return h + doorsCard(s);
  if (tab === "room") return h + roomTab(s, c, worn);
  h += nudgeCard(s, cls, battles, students);
  h += '<div class="card"><div class="mypet t-' + t.key + '">' + pinnedBadgeHTML(s, "mine") +
    (haunt ? basketHTML(candy, "big") : "") +
    '<div class="stage" aria-hidden="true">' + petHTML(c, worn) + (side ? sidekickSVG(side, true) : "") + "</div>" +
    '<div class="bigname">' + esc(s.petName || c.name) + "</div>" +
    '<div class="tspec" style="font-family:var(--mono);font-size:11px;letter-spacing:.09em;text-transform:uppercase;color:var(--ink-3);">' + esc(c.name) + "</div>" +
    '<span class="tbar"><span style="width:' + Math.max(0, Math.min(100, sim.health / sim.max * 100)) + '%"></span></span>' +
    '<div style="font-family:var(--mono);font-size:13px;margin-top:6px;">' + (sim.alive ? sim.health + " / " + sim.max + " health" : "disappeared") + "</div>" +
    '<p class="lede" style="margin-top:10px;">' + msg + "</p>" +
    (side ? '<p style="margin-top:6px;color:var(--warn);font-weight:700;">☀️ You hit ' + goal + " by lunch — your " + SIDEKICKS[side].toLowerCase() + " came to hang out!</p>" : "") +
    '<div class="weekdots">' + DAYS.map((d, i) => {
      const v = status[i], k = v === "c" ? "c" : v === "e" ? "e" : rec[i] ? "m" : "";
      return "<span><i class=\"" + k + '">' + (v === "c" ? "✓" : v === "e" ? "–" : rec[i] ? "✕" : "") + "</i>" + SHORT[i] + (early[i] ? " ☀️" : "") + "</span>";
    }).join("") + "</div>" +
    (haunt ? '<p style="margin-top:8px;color:#E8740C;font-weight:700;">' + S.icon + " " + candy.toLocaleString() + (S.key === "jingle" ? " present" + (candy === 1 ? "" : "s") : " piece" + (candy === 1 ? "" : "s") + " of " + S.cur) + " to spend" +
      (candy >= CANDY_FULL ? " \u2014 your " + S.basket + " is FULL!" : " \u00b7 " + (CANDY_FULL - candy).toLocaleString() + " more to fill your " + S.basket) + "</p>" : "") +
    '<p class="muted" style="margin-top:8px;">Streak: ' + sim.hitRun + " day" + (sim.hitRun === 1 ? "" : "s") + " · best this week: " + sim.bestRun + "</p></div></div>";

  h += '<div class="card"><div class="card-head"><h2>Gear</h2><span class="fact">one at a time</span></div><div class="gearpick">';
  GEAR.forEach(g => {
    const ok = sim.unlocked.includes(g.id);
    h += "<div><button class=\"eq" + (worn && worn.id === g.id ? " on" : "") + '" data-equip="' + g.id + '"' + (ok ? "" : " disabled") + ' aria-label="' + esc(g.name) + (ok ? "" : " locked") + '">' +
      itemArt(g, "gimg") + '</button><span class="lbl">' + (ok ? esc(g.name) : g.ghost && !ghostUnlocked(cls) ? "Defeat the Ghost-olotl" : g.turkey && !turkeyUnlocked(cls) ? "Defeat the Turducken" : g.jingle && !grinchUnlocked(cls) ? "Defeat the Grinch-a-Duck" : g.streak + "-day streak") + "</span></div>";
  });
  h += '</div><p class="lede" style="margin-top:12px;font-size:13.5px;text-align:center;">Hit ' + goal + " XP days in a row to unlock more. Tap what you’re wearing to take it off.</p></div>";

  const legends = petCreatures(s);
  if (legends.length) {
    const base = byId(ROSTER, s.companionId), curId = s.petCreature && legends.some(x => x.fam === s.petCreature) ? s.petCreature : "";
    h += '<div class="card"><div class="card-head"><h2>\u{1F31F} Creature companions</h2><span class="fact">unlocked</span></div>' +
      '<p class="lede" style="margin-bottom:12px;">Event Legendaries and creatures you got to level 100 can be your companion! Your gear, name and health stay the same.</p>' +
      '<div class="pickgrid">' +
      '<button class="pick' + (curId ? "" : " on") + '" data-petcr=""><span class="g">' + base.glyph + '</span><span class="n">' + esc(base.name) + "</span></button>" +
      legends.map(x => '<button class="pick' + (curId === x.fam ? " on" : "") + '" data-petcr="' + x.fam + '"><span class="g crg">' + x.glyph + '</span><span class="n">' + (x.sparkle ? "\u2728 " : "") + esc(x.name) + "</span></button>").join("") +
      "</div></div>";
  }

  h += '<div class="card"><div class="card-head"><h2>Lunch sidekick</h2></div>' +
    '<p class="lede" style="margin-bottom:12px;">Hit ' + goal + " XP before lunch and your sidekick joins you for the day. Who do you want?</p>" +
    '<div class="pickgrid" style="grid-template-columns:repeat(auto-fit,minmax(0,140px));justify-content:center;">' +
    Object.keys(SIDEKICKS).map(k => {
      const locked = (k === "ghost" && !ghostUnlocked(cls)) || (k === "turkey" && !turkeyUnlocked(cls)) || (k === "grinch" && !grinchUnlocked(cls));
      return '<button class="pick' + ((s.sidekick || "axolotl") === k ? " on" : "") + '" data-side="' + k + '"' + (locked ? ' disabled style="opacity:.45;filter:grayscale(.7);"' : "") +
        '><span style="display:flex;justify-content:center;height:70px;align-items:flex-end;">' +
        sidekickSVG(k, true).replace('class="side', 'style="animation:none;height:' + (k === "duck" ? 68 : k === "ghost" ? 66 : k === "turkey" ? 64 : k === "grinch" ? 64 : 56) + 'px" class="side') +
        '</span><span class="n">' + SIDEKICKS[k] + "</span>" + (locked ? '<span class="lbl" style="display:block;font-family:var(--mono);font-size:10px;color:var(--ink-3);">\u{1F512} Defeat the ' + (k === "turkey" ? "Turducken" : k === "grinch" ? "Grinch-a-Duck" : "Ghost-olotl") + "</span>" : "") + "</button>";
    }).join("") + "</div></div>";

  h += '<div class="card"><div class="card-head"><h2>Rename</h2></div><div class="row"><div class="field" style="flex:1;min-width:200px;"><label for="rename">Companion name</label>' +
    '<input id="rename" type="text" maxlength="22" value="' + esc(s.petName || "") + '"></div><button class="btn ghost" data-act="rename">Save name</button></div></div>';
  return h;
}

/* ---------- My Room (decorate with Comfort Points) ---------- */
let roomView = "decorate", roomSlot = "bed", roomBuy = null, roomSetPick = null;
const SLOT_NAMES = Object.assign({}, KIND_NAMES, { shelf_upper: "Top shelf", shelf_lower: "Bottom shelf" });
function rItemCard(id, opts) {
  const p = parseItem(id), o = opts || {}, tro = p.kind === "trophy";
  const pic = tro ? '<span class="tro">\u{1F3C6}</span>' : '<img class="' + (p.kind === "wallpaper" || p.kind === "flooring" ? "tile" : "") + '" src="' + roomArt(id) + '" alt="">';
  return '<button class="ritem' + (o.on ? " on" : "") + (o.locked ? " locked" : "") + '" ' + (o.attr || "") + (o.locked ? " disabled" : "") + ">" + pic +
    "<span>" + esc(tro ? (SEASON_THEMES[p.theme] || "") + " Trophy" : itemName(id)) + "</span>" + (o.price != null ? '<span class="pr">\u2B50 ' + o.price + " CP</span>" : "") + (o.note ? '<small class="muted">' + o.note + "</small>" : "") + "</button>";
}
function roomTab(s, c, worn) {
  const left = cpLeft(s, cls), have = roomOwned(s), fit = fitOf(s);
  let h = '<div class="card roomwrap"><div class="card-head"><h2>\u{1F6CF}\uFE0F ' + esc(s.petName || c.name) + "\u2019s Room</h2>" + '<span class="cpwallet">\u2B50 ' + left + " Comfort Points</span></div>" +
    roomHTML(s, petHTML(c, worn), { side: (() => { const k = sidekickToday(s, boardDay(cls, students)); return k ? { kind: k, html: sidekickSVG(k) } : null; })() }) +
    (sidekickToday(s, boardDay(cls, students)) ? '<p class="muted small" style="margin-top:6px;">\u2600\uFE0F You were Lunch Hero today, so your ' + esc(SIDEKICKS[sidekickToday(s, boardDay(cls, students))]) + " came to play!</p>" : "") +
    '<p class="muted small" style="margin-top:8px;">Earn Comfort Points: <b>+10</b> every day your companion stays at full health \u00b7 <b>+5</b> on Lunch Hero days \u00b7 <b>+5</b> on 5-day streak days.</p></div>';
  h += '<div class="tabs" style="margin-bottom:10px;">' + [["decorate", "\u{1F3A8} Decorate"], ["everyday", "\u{1F6CD}\uFE0F Everyday shop"], ["themed", "\u2728 Themed sets"]].map(([k, l]) =>
    '<button class="tab' + (roomView === k ? " on" : "") + '" data-roomview="' + k + '">' + l + "</button>").join("") + "</div>";
  if (roomView === "decorate") {
    h += '<div class="card"><div class="slotbar">' + FIT_SLOTS.map(sl => '<button class="tpill2' + (roomSlot === sl ? " on" : "") + '" data-roomslot="' + sl + '">' + KIND_ICON[slotKind(sl)] + " " + SLOT_NAMES[sl] + (fit[sl] ? " \u2713" : "") + "</button>").join("") + "</div>";
    const k = slotKind(roomSlot), mine = have.filter(id => { const p = parseItem(id); return p.kind === k || (k === "shelf" && p.kind === "trophy"); });
    h += mine.length ? '<div class="ownedgrid">' + rItemCard("none_x", {}).replace(/<img[^>]*>|<span class="tro">.*?<\/span>/, '<span class="tro">\u{1F6AB}</span>').replace(/<span>[^<]*<\/span>/, "<span>Nothing</span>").replace("<button", '<button data-place=""') +
        mine.map(id => rItemCard(id, { on: fit[roomSlot] === id, attr: 'data-place="' + id + '"' })).join("") + "</div>"
      : '<p class="lede">You don\u2019t have any ' + esc(SLOT_NAMES[roomSlot].toLowerCase()) + (k === "shelf" ? " decor" : "") + " yet. Check the shops!</p>";
    return h + "</div>";
  }
  if (roomView === "everyday") {
    const list = everydayItems(s);
    return h + '<div class="card"><div class="card-head"><h2>\u{1F6CD}\uFE0F Everyday shop</h2><span class="fact">new items every day</span></div><div class="ownedgrid">' +
      list.map(id => { const pr = EVERYDAY_PRICE[parseItem(id).kind];
        return roomBuy === id ? '<div class="ritem on">' + '<img src="' + roomArt(id) + '" alt=""><span>' + esc(itemName(id)) + '</span><button class="buybtn" data-roombuyok="' + id + '" data-cost="' + pr + '">Buy for ' + pr + '</button><button class="btn ghost small" data-roombuy="">No</button></div>'
          : rItemCard(id, { price: pr, attr: 'data-roombuy="' + id + '"', locked: left < pr }); }).join("") + "</div></div>";
  }
  // themed sets: every type set, plus the event's set (and trophy) while it's on
  const season = liveSeason(cls);
  const sets = (season ? [season] : []).concat(TYPE_THEMES);
  if (!sets.includes(roomSetPick)) roomSetPick = sets[0];
  h += '<div class="card"><div class="card-head"><h2>\u2728 Themed sets</h2><span class="fact">' + THEMED_PRICE + " CP each \u00b7 whole set 600</span></div>" +
    '<div class="slotbar">' + sets.map(th => '<button class="tpill2' + (roomSetPick === th ? " on" : "") + '" data-roomset="' + th + '">' + (SEASON_THEMES[th] ? "\u{1F31F} " : "") + esc(THEME_NAMES[th] || th) +
      (setItems(th).every(id => have.includes(id)) ? " \u2713" : "") + "</button>").join("") + '</div><div class="shopsets">';
  [roomSetPick].forEach(th => {
    const items = setItems(th), need = items.filter(id => !have.includes(id)), sp = setPrice(s, th);
    h += '<div class="shopset"><div class="sethead"><b>' + (SEASON_THEMES[th] ? "\u{1F31F} " : "") + esc(THEME_NAMES[th] || th) + " set</b>" + (SEASON_THEMES[th] ? ' <span class="fact">only during ' + esc(SEASON_THEMES[th]) + "</span>" : "") +
      (need.length ? (roomBuy === "set:" + th ? '<button class="buybtn" data-roombuyok="set:' + th + '" data-cost="' + sp + '">Buy all ' + need.length + " for " + sp + '</button><button class="btn ghost small" data-roombuy="">No</button>'
        : '<button class="btn small" data-roombuy="set:' + th + '"' + (left < sp ? " disabled" : "") + ">Buy the whole set \u00b7 " + sp + " CP</button>") : '<span class="fact">\u2705 you have it all</span>') + "</div>" +
      '<div class="ownedgrid">' + items.map(id => have.includes(id) ? rItemCard(id, { note: "\u2713 yours", locked: true })
        : roomBuy === id ? '<div class="ritem on"><img src="' + roomArt(id) + '" alt=""><span>' + esc(itemName(id)) + '</span><button class="buybtn" data-roombuyok="' + id + '" data-cost="' + THEMED_PRICE + '">Buy for ' + THEMED_PRICE + '</button><button class="btn ghost small" data-roombuy="">No</button></div>'
        : rItemCard(id, { price: THEMED_PRICE, attr: 'data-roombuy="' + id + '"', locked: left < THEMED_PRICE })).join("") + "</div>";
    if (SEASON_THEMES[th]) {
      const tid = itemId("trophy", th), t = TROPHIES[th];
      h += '<div class="ownedgrid" style="margin-top:8px;">' + (have.includes(tid) ? rItemCard(tid, { note: "\u2713 yours", locked: true })
        : !trophyUnlocked(cls, th) ? rItemCard(tid, { locked: true, note: "\u{1F512} Defeat the " + t.boss + " to unlock" })
        : roomBuy === tid ? '<div class="ritem on"><span class="tro">\u{1F3C6}</span><span>' + esc(SEASON_THEMES[th]) + ' Trophy</span><button class="buybtn" data-roombuyok="' + tid + '" data-cost="' + TROPHY_PRICE + '">Buy for ' + TROPHY_PRICE + '</button><button class="btn ghost small" data-roombuy="">No</button></div>'
        : rItemCard(tid, { price: TROPHY_PRICE, attr: 'data-roombuy="' + tid + '"', locked: left < TROPHY_PRICE, note: "Goes on a shelf" })) + "</div>";
    }
    h += "</div>";
  });
  return h + "</div></div>";
}
async function roomPurchase(key, cost) {
  const s = students.find(x => x.id === me); if (!s) return;
  const have = roomOwned(s), ids = key.startsWith("set:") ? setItems(key.slice(4)).filter(id => !have.includes(id)) : [key];
  if (!ids.length || cpLeft(s, cls) < cost) { flash("Not enough Comfort Points yet!"); return; }
  const data = { cpSpent: (Number(s.cpSpent) || 0) + cost, roomOwned: roomBought(s).concat(ids), roomBuys: (s.roomBuys || []).concat([{ id: key, cost, at: new Date().toISOString() }]) };
  // put a brand-new item straight into the room if that spot is empty
  const fit = Object.assign({}, fitOf(s));
  ids.forEach(id => { const k = parseItem(id).kind, slot = k === "trophy" || k === "shelf" ? (!fit.shelf_upper ? "shelf_upper" : !fit.shelf_lower ? "shelf_lower" : null) : k; if (slot && (!fit[slot] || ROOM_STARTERS.includes(fit[slot]))) fit[slot] = id; });
  data.roomFit = fit;
  roomBuy = null;
  await patch(data);
  flash("\u{1F389} It\u2019s yours! Check out your room.", true);
}

/* ---------- Daily Doors ---------- */
// Presents ready to open (any day) show as a number on the tab.
function presentsReady(s) {
  let n = 0;
  Object.keys(s.doors || {}).forEach(d => Object.values(s.doors[d] || {}).forEach(e => { if (e && e.st === "ok") n++; }));
  return n + (goldenReady(s, cls, azToday()) ? 1 : 0);
}
function doorBadge(s) { const n = presentsReady(s); return n ? ' <span class="tbadge">' + n + "</span>" : ""; }
function doorsCard(s) {
  const date = azToday(), list = doorsFor(cls, date), S = SEASON, gate = gateOpen(s, cls, date), day = dayDoors(s, date);
  const art = DOOR_ART[S.key] || DOOR_ART.jingle;
  let h = '<div class="arena doors ' + S.key + '"><p class="arena-title">\u{1F6AA} ' + esc(doorName()) + "</p>" +
    '<p class="arena-foot" style="margin:0 0 12px;">Finish a door\u2019s task, then tap <b>I did it!</b> Ms. Ariana checks it, and a present appears for you to open. ' +
    (hasLocked(cls, date) ? "Finish " + gateLabel(cls, date) + " to open the rest. " : "") + "Open every door today for a \u2728 <b>Golden Present</b>! New doors every day.</p>";
  h += '<div class="doorgrid">' + list.map((task, i) => {
    const st = doorState(s, date, i), locked = doorLocked(s, cls, date, i), e = day[String(i)] || {};
    let body;
    if (locked) body = '<span class="dstate lock">\u{1F512} Finish ' + gateLabel(cls, date) + " first</span>";
    else if (st === "wait") body = '<span class="dstate wait">\u23F3 Waiting for Ms. Ariana</span>';
    else if (st === "ok") body = '<button class="presentbtn" data-open="' + date + ":" + i + '">\u{1F381} Open your present!</button>';
    else if (st === "open") { const t = rewardText(e.r, S); body = '<span class="dstate done">\u2705 ' + t.icon + " " + esc(t.big) + "</span>"; }
    else body = (st === "no" ? '<span class="dstate no">\u21A9\uFE0F Not yet \u2014 try again!</span>' : "") + '<button class="btn small" data-claim="' + i + '">\u2714\uFE0F I did it!</button>';
    return '<div class="door d-' + (locked ? "lock" : st || "new") + '"><div class="doorpic"><img src="' + art + '" alt=""><span class="dnum">' + (i + 1) + "</span>" +
      (st === "ok" ? '<span class="dgift">\u{1F381}</span>' : st === "open" ? '<span class="dgift">\u2728</span>' : "") + "</div>" +
      '<div class="dtask">' + (isFree(task) ? "\u{1F513} " : "") + esc(doorText(task)) + "</div>" + body + "</div>";
  }).join("") + "</div>";
  const g = day.g;
  if (goldenReady(s, cls, date)) h += '<div class="goldenwrap"><button class="presentbtn golden" data-open="' + date + ':g">\u2728\u{1F381} Open your GOLDEN PRESENT! \u{1F381}\u2728</button></div>';
  else if (g && g.st === "open") { const t = rewardText(g.r, S); h += '<p class="arena-win">\u2728 Golden Present opened: ' + t.icon + " " + esc(t.big) + "</p>"; }
  else h += '<p class="arena-foot">\u2728 Golden Present: ' + list.filter((_, i) => ["ok", "open"].includes(doorState(s, date, i))).length + " / " + list.length + " doors done today</p>";
  // presents from earlier days that were approved later
  const old = [];
  Object.keys(s.doors || {}).filter(d => d !== date).sort().forEach(d => Object.keys(s.doors[d] || {}).forEach(k => { if ((s.doors[d][k] || {}).st === "ok") old.push([d, k]); }));
  if (old.length) h += '<div class="goldenwrap">' + old.map(([d, k]) => '<button class="presentbtn" data-open="' + d + ":" + k + '">\u{1F381} Present from ' +
    new Date(d + "T12:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) + " (door " + (Number(k) + 1) + ")</button>").join("") + "</div>";
  return h + "</div>";
}
function presentOverlay() {
  if (!present) return "";
  const t = rewardText(present.r, SEASON);
  return '<div class="prizeover" role="dialog" aria-label="Present"><div class="prizebox presentbox' + (present.golden ? " golden" : "") + '">' +
    "<h2>" + (present.golden ? "\u2728 GOLDEN PRESENT \u2728" : "\u{1F381} A PRESENT! \u{1F381}") + "</h2>" +
    (present.phase === "shake"
      ? '<div class="giftbox shake">\u{1F381}</div><p class="arena-foot" style="font-size:14px;">Unwrapping\u2026</p>'
      : '<div class="prizewon"><span style="font-size:72px;line-height:1;">' + t.icon + "</span><b>" + esc(t.big) + '</b><span class="arena-foot">' + esc(t.sub) + "</span>" +
        (present.prize != null ? '<button class="attackbtn" data-act="presentSpin">\u{1F3C6} Spin the Prize Wheel!</button>' : '<button class="attackbtn" data-act="closePresent">Yay! \u{1F389}</button>') + "</div>") +
    "</div></div>";
}
async function claimDoor(i) {
  const s = students.find(x => x.id === me), date = azToday();
  if (!s || !doorsLive(cls) || i >= doorsFor(cls, date).length || doorLocked(s, cls, date, i)) return;
  const st = doorState(s, date, i); if (st && st !== "no") return;
  const doors = JSON.parse(JSON.stringify(s.doors || {}));
  doors[date] = doors[date] || {}; doors[date][String(i)] = { st: "wait", at: new Date().toISOString() };
  await patch({ doors, lastDoor: date + "/" + i });
  flash("Sent! Ms. Ariana will check door " + (i + 1) + ".", true);
}
async function openPresent(date, k) {
  const s = students.find(x => x.id === me), S = SEASON; if (!s || present) return;
  const golden = k === "g";
  if (golden ? !goldenReady(s, cls, date) : doorState(s, date, k) !== "ok") return;
  const r = rollPresent(golden);
  const doors = JSON.parse(JSON.stringify(s.doors || {}));
  doors[date] = doors[date] || {};
  doors[date][k] = Object.assign({}, doors[date][k] || {}, { st: "open", r, openedAt: new Date().toISOString() });
  const data = { doors, lastDoor: date + "/" + k };
  let prize = null;
  if (REWARD_XP[r.id]) data.doorXP = (Number(s.doorXP) || 0) + REWARD_XP[r.id];
  if (r.id === "cur20") data.candyBonus = (Number(s.candyBonus) || 0) + 20;
  if (r.id === "brew") data.brews = (Number(s.brews) || 0) + 1;
  if (r.id === "attack") data.extraAttacks = (Number(s.extraAttacks) || 0) + 1;
  if (r.id === "egg") data.doorEggs = (Number(s.doorEggs) || 0) + 1;
  if (r.id === "tegg") data.themeEggs = (s.themeEggs || []).concat([S.key]);
  if (r.id === "prize") {
    prize = pickSlice(prizeSlices());
    const entry = { id: "prize", src: "door", at: new Date().toISOString(), prize, prizeName: S.prizes[prize].name };
    if (S.key !== "haunt") entry.s = S.key;
    const pxp = Number(S.prizes[prize].xp) || 0;
    if (pxp) { entry.xp = pxp; data.xpPrize = (Number(s.xpPrize) || 0) + pxp; }
    data.spinLog = (s.spinLog || []).concat([entry]);
  }
  present = { date, k, r, phase: "shake", golden, prize };
  render(true);
  const saving = updateDoc(studentRef(me), data).then(() => Object.assign(s, data)).catch(e => { present = null; flash("That present didn\u2019t open \u2014 ask Ms. Ariana. (" + (e.code || e.message) + ")"); });
  setTimeout(async () => { await saving; if (present) { present.phase = "open"; render(true); } }, 1600);
}

function openPrizeWheel(idx) {
  prizeWheel = { idx, rot: 0, done: false };
  render();
  wheelBusy = true;                                   // hold redraws while it spins
  setTimeout(() => {
    prizeWheel.rot = spinTo(idx, SEASON.prizes.length, 0);
    const el = document.querySelector(".prizewheel .wheelspin");
    if (el) el.style.transform = "translate(-50%,-50%) rotate(" + prizeWheel.rot + "deg)";
  }, 500);
  setTimeout(() => { prizeWheel.done = true; wheelBusy = false; wheelResult = "\u{1F381} You won: " + esc(SEASON.prizes[idx].name) + "!<small>" + (SEASON.prizes[idx].xp ? "It\u2019s in your XP \u2014 use it to level up your creatures! Ms. Ariana has been told." : "Ms. Ariana has been told.") + "</small>"; render(); }, 5800);
}
function prizeOverlay() {
  if (!prizeWheel) return "";
  const p = SEASON.prizes[prizeWheel.idx];
  return '<div class="prizeover" role="dialog" aria-label="Prize Wheel"><div class="prizebox"><h2>\u{1F381} PRIZE WHEEL \u{1F381}</h2>' +
    wheelHTML(prizeSlices(), prizeWheel.rot, "prizewheel") +
    (prizeWheel.done
      ? '<div class="prizewon">' + (p.img ? '<img src="' + esc(p.img) + '" alt="">' : '<span style="font-size:64px;line-height:1;">' + p.icon + "</span>") +
        "<b>You won: " + esc(p.name) + '!</b><span class="arena-foot">' + (p.xp ? "It\u2019s already in your XP \u2014 use it to level up your creatures!" : "Ms. Ariana has been told \u2014 she\u2019ll get it for you!") + "</span>" +
        '<button class="attackbtn" data-act="closePrize">Yay! \u{1F389}</button></div>'
      : '<p class="arena-foot" style="font-size:14px;">Spinning for your prize\u2026</p>') + "</div></div>";
}

// Today's power-up: the companion eats the first 120 candy of the day to power its attack.
function powerMeter(s) {
  const bd = boardDay(cls, students); if (bd < 0) return "";
  const eaten = dayEaten(s, bd), full = eaten >= EAT_PER_DAY, extra = Math.max(0, Math.round(dayXP(s, bd)) - EAT_PER_DAY);
  return '<div class="power"><div class="power-k">\u26A1 ' + SHORT[bd] + " power-up: <b>" + eaten + " / " + EAT_PER_DAY + "</b> " + SEASON.cur + " eaten" +
    (full ? " \u2014 attack powered!" : "") + '</div><span class="powertrack"><span style="width:' + (eaten / EAT_PER_DAY * 100) + '%"></span></span>' +
    (extra ? '<div class="power-s">+' + extra + " extra " + SEASON.cur + " went into your " + SEASON.basket + "</div>" : '<div class="power-s">' + SEASON.Cur + " over " + EAT_PER_DAY + " goes into your " + SEASON.basket + "</div>") + "</div>";
}

function wheelCard(s) {
  const spins = Number(s.spins) || 0;
  const S = SEASON;
  let h = '<div class="arena ' + S.key + '" style="margin-bottom:16px;"><p class="arena-title">' + S.wheelIcon + " " + S.wheel + "</p>" +
    '<p class="arena-foot" style="margin:0 0 10px;">Spins: <b>' + spins + "</b>" + (spins ? "" : " \u00b7 buy a spin in the " + S.shop) + "</p>" +
    '<div id="wheelbox">' + wheelHTML(S.slices, wheelRot) + "</div>" +
    '<button class="attackbtn" data-act="spin"' + (spins && !wheelBusy ? "" : " disabled") + ">" + (wheelBusy ? "Spinning\u2026" : "\u{1F3A1} Spin!") + "</button>" +
    '<div class="wheelres">' + (wheelResult && !wheelBusy ? wheelResult : "") + "</div>" +
    '<p class="arena-foot">' + S.treat + " \u00b7 " + S.trick + " \u00b7 \u2728 rare slices</p></div>";
  return h;
}

function shopCard(s) {
  const left = candyLeft(s), S = SEASON;
  let h = '<div class="card"><div class="card-head"><h2>' + S.coin + " " + S.shop + '</h2><span class="wallet">' + S.coin + " " + left.toLocaleString() + " to spend</span></div>" +
    '<div class="shop">' + S.store.map(it => {
      const n = ownedCount(s, it.id), done = it.once && ownsItem(s, it.id), can = left >= it.cost && !done;
      return '<div class="shopitem"><div class="art">' + storeArt(it) + '</div><div class="n">' + esc(it.name) + '</div><div class="d">' + esc(it.desc) + "</div>" +
        '<span class="price">' + S.coin + " " + it.cost.toLocaleString() + "</span>" +
        (busy.confirmBuy === it.id
          ? '<div class="row" style="justify-content:center;"><button class="buybtn" data-buyok="' + it.id + '">Yes, buy it</button><button class="btn ghost small" data-act="cancelBuy">No</button></div>'
          : '<button class="buybtn" data-buy="' + it.id + '"' + (can ? "" : " disabled") + ">" + (done ? "\u2713 Yours!" : can ? "Buy" : "Need " + (it.cost - left).toLocaleString() + " more") + "</button>") +
        (done ? '<span class="owned">Your companion is wearing it \u00b7 +5 damage</span>' : n ? '<span class="owned">\u2713 Bought ' + n + "</span>" : "") + "</div>";
    }).join("") + "</div>";
  const inv = [];
  if (s[S.hatFlag]) inv.push(storeArt(byId(S.store, S.hatItem)) + " " + S.hatName + " (+5 damage)");
  if (Number(s.brews) > 0) inv.push(storeArt(byId(S.store, S.brewItem)) + " " + s.brews + " " + (s.brews == 1 ? S.brewName : S.brewNames));
  if (Number(s.extraAttacks) > 0) inv.push("\u2694\uFE0F " + s.extraAttacks + " extra attack" + (s.extraAttacks == 1 ? "" : "s"));
  if (Number(s.spins) > 0) inv.push("\u{1F3A1} " + s.spins + " wheel spin" + (s.spins == 1 ? "" : "s") + " saved");
  if (inv.length) h += '<p class="muted" style="margin:14px 0 6px;">Your stuff</p><div class="inv">' + inv.map(x => "<span>" + x + "</span>").join("") + "</div>";
  return h + "</div>";
}

function battleCard(s, c) {
  const b = bossState(cls, students), nx = nextAttack(s, cls), goal = goalXP(cls);
  const S = SEASON;
  let h = '<div class="arena fight ' + S.key + '" style="margin-bottom:16px;"><p class="arena-title">⚔️ Battle the ' + S.boss + "</p>" + bossBarHTML(b) +
    '<div class="ghostwrap' + (attackFx ? " hit" : "") + '"><img class="ghostimg" src="' + S.bossImg + '" alt="The ' + S.boss + '">' +
    (attackFx ? '<span class="dmg">-' + attackFx + "</span>" : "") + "</div>" + teamHTML(cls, students, !!attackFx);
  h += powerMeter(s);
  if (b.defeated) h += '<p class="arena-win">\u{1F389} Your class defeated the ' + S.boss + "!</p>";
  else if (nx.count) {
    const parts = [b.dmg + " attack"];
    if (nx.hat) parts.push("+" + HAT_BONUS + " " + S.hatIcon + " hat");
    if (nx.brew) parts.push("+" + BREW_BONUS + " " + S.brewIcon + " " + (S.key === "gobble" ? "pie" : S.key === "jingle" ? "cocoa" : "brew"));
    h += '<button class="attackbtn" data-act="attack">⚔️ Attack for ' + nx.damage + "!</button>" +
      '<p class="arena-foot">' + parts.join(" ") + " = <b>" + nx.damage + "</b> damage · you have <b>" + nx.count + "</b> attack" + (nx.count === 1 ? "" : "s") + " ready</p>";
  } else h += '<p class="arena-foot" style="font-size:13px;">Hit ' + goal + " XP today to earn an attack, or buy one in the " + S.shop + "!</p>";
  h += bucketHTML(cls, students);
  const brews = Number(s.brews) || 0;
  if (brews) h += '<p class="arena-foot">' + S.brewIcon + " " + brews + " " + (brews === 1 ? S.brewName : S.brewNames) + " ready (one is used on each attack)</p>";
  const mine = Number(s.attackTotal) || 0;
  if (mine) h += '<p class="arena-foot">' + esc(s.petName || c.name) + " has attacked " + mine + " time" + (mine === 1 ? "" : "s") + " for " + dmgOf(s, cls).toLocaleString() + " damage.</p>";
  return h + "</div>";
}

document.addEventListener("change", ev => {
  if (ev.target.dataset && ev.target.dataset.trready) { const s = students.find(x => x.id === me); if (s && !PREVIEW) onTradeReady(ev.target, collectorCtx(s)); return; }
  if (ev.target.dataset && ev.target.dataset.trsel) { const s = students.find(x => x.id === me); if (s) onTradeChange(ev.target, collectorCtx(s)); return; }
  if (ev.target.id === "previewPick") { me = ev.target.value; history.replaceState(null, "", "?s=" + encodeURIComponent(me) + "&preview=1"); picking = null; render(true); scrollTo({ top: 0 }); }
});
document.addEventListener("input", ev => { if (ev.target.id === "petName") draftName = ev.target.value; });
document.addEventListener("click", async ev => {
  let el;
  if ((el = ev.target.closest("[data-bdayok]"))) {
    const s = students.find(x => x.id === me); if (!s) return;
    const seen = Number(s.birthdayEggs) || 0; s.bdaySeen = seen; bdayChimed = false;
    if (el.dataset.bdayok === "hatch") { tab = "collect"; try { localStorage.setItem("ck-tab", tab); } catch (e) {} }
    render(true);
    try { await updateDoc(studentRef(me), { bdaySeen: seen }); } catch (e) {}
    if (el.dataset.bdayok === "hatch") { const b = document.querySelector('[data-cc="hatchBday"]'); if (b) b.click(); }
    return;
  }
  if ((el = ev.target.closest("[data-bparty]"))) {
    const s = students.find(x => x.id === me); if (!s) return;
    const v = el.dataset.bparty, data = {};
    unseenBadges(s).forEach(id => { data["badgesSeen." + id] = true; });
    s.badgesSeen = Object.assign({}, s.badgesSeen || {}); unseenBadges(s).forEach(id => { s.badgesSeen[id] = true; });
    if (v.startsWith("pin:")) { data.pinnedBadge = v.slice(4); s.pinnedBadge = data.pinnedBadge; flash("Pinned! It\u2019s on your companion in The Keep.", true); }
    else if (Object.keys(data).length > 1) { tab = "badges"; try { localStorage.setItem("ck-tab", tab); } catch (e) {} }
    render(true);
    try { await updateDoc(studentRef(me), data); } catch (e) {}
    return;
  }
  if ((el = ev.target.closest("[data-pinbadge]"))) { const id = el.dataset.pinbadge || null; await patch({ pinnedBadge: id }); if (id) flash("Pinned! It\u2019s on your companion in The Keep.", true); return; }
  if ((el = ev.target.closest("[data-petcr]"))) { await patch({ petCreature: el.dataset.petcr || null }); return; }
  if ((el = ev.target.closest("[data-tab]"))) { tab = el.dataset.tab; try { localStorage.setItem("ck-tab", tab); } catch (e) {} render(true); scrollTo({ top: 0 }); return; }
  if ((el = ev.target.closest("[data-tr]"))) { const s = students.find(x => x.id === me); if (s && !PREVIEW) await onTradeClick(el, collectorCtx(s)).catch(e => showErr(e)); return; }
  if ((el = ev.target.closest("[data-cc]"))) { const s = students.find(x => x.id === me); if (s) await collectorClick(el, collectorCtx(s)).catch(e => showErr(e)); return; }
  if ((el = ev.target.closest("[data-me]"))) { me = el.dataset.me; save(me); picking = null; draftName = ""; render(); scrollTo({ top: 0 }); return; }
  if ((el = ev.target.closest("[data-pick]"))) { picking = el.dataset.pick; render(); return; }
  if ((el = ev.target.closest("[data-buy]"))) { busy.confirmBuy = el.dataset.buy; render(); return; }
  if ((el = ev.target.closest("[data-buyok]"))) {
    const s = students.find(x => x.id === me), it = byId(SEASON.store, el.dataset.buyok);
    busy.confirmBuy = null;
    if (!it || candyLeft(s) < it.cost) { flash("Not enough " + SEASON.cur + " yet!"); return; }
    if (it.once && ownsItem(s, it.id)) { flash("You already have the " + it.name + "!"); return; }
    const data = { purchases: (s.purchases || []).concat([{ id: it.id, cost: it.cost, at: new Date().toISOString() }]), candySpent: candySpent(s) + it.cost };
    if (it.id === "witchhat") { data.witchHat = true; data.equipped = "witch"; }
    if (it.id === "pilgrimhat") { data.pilgrimHat = true; data.equipped = "pilgrim"; }
    if (it.id === "antlers") { data.antlersHat = true; data.equipped = "antlers"; }
    if (it.id === "brew" || it.id === "pie" || it.id === "cocoa") data.brews = (Number(s.brews) || 0) + 1;
    if (it.id === "attack") data.extraAttacks = (Number(s.extraAttacks) || 0) + 1;
    if (it.id === "spin") data.spins = (Number(s.spins) || 0) + 1;
    await patch(data);
    flash("You bought the " + it.name + "!", true);
    return;
  }
  if ((el = ev.target.closest("[data-roomview]"))) { roomView = el.dataset.roomview; roomBuy = null; render(); return; }
  if ((el = ev.target.closest("[data-roomset]"))) { roomSetPick = el.dataset.roomset; roomBuy = null; render(); return; }
  if ((el = ev.target.closest("[data-roomslot]"))) { roomSlot = el.dataset.roomslot; render(); return; }
  if ((el = ev.target.closest("[data-place]"))) { if (PREVIEW) return; const s = students.find(x => x.id === me), fit = Object.assign({}, fitOf(s)); const id = el.dataset.place || null;
    if (id && slotKind(roomSlot) === "shelf") { const other = roomSlot === "shelf_upper" ? "shelf_lower" : "shelf_upper"; if (fit[other] === id) fit[other] = null; }
    fit[roomSlot] = id; return patch({ roomFit: fit }); }
  if ((el = ev.target.closest("[data-roombuyok]"))) { if (!PREVIEW) await roomPurchase(el.dataset.roombuyok, Number(el.dataset.cost)); return; }
  if ((el = ev.target.closest("[data-roombuy]"))) { roomBuy = el.dataset.roombuy || null; render(); return; }
  if ((el = ev.target.closest("[data-claim]"))) { if (!PREVIEW) await claimDoor(Number(el.dataset.claim)); return; }
  if ((el = ev.target.closest("[data-open]"))) { if (!PREVIEW) { const [d, k] = el.dataset.open.split(":"); await openPresent(d, k); } return; }
  if ((el = ev.target.closest("[data-side]"))) return patch({ sidekick: el.dataset.side });
  if ((el = ev.target.closest("[data-equip]"))) {
    const s = students.find(x => x.id === me), worn = wornItem(s, simulate(s, cls));
    return patch({ equipped: worn && worn.id === el.dataset.equip ? "" : el.dataset.equip });
  }
  if (!(el = ev.target.closest("[data-act]"))) return;
  const act = el.dataset.act;
  if (act === "spin") {
    const s = students.find(x => x.id === me);
    if (wheelBusy || !(Number(s.spins) > 0)) return;
    const S = SEASON, i = pickSlice(S.slices), slice = S.slices[i];
    const entry = { id: slice.id, at: new Date().toISOString() };
    if (S.key !== "haunt") entry.s = S.key;   // keeps Gobble-Palooza / Jingle Jam spins apart from Haunt-O-Ween badges
    const data = { spinLog: (s.spinLog || []).concat([entry]), spins: (Number(s.spins) || 0) - (slice.id === "reroll" ? 0 : 1) };
    let msg = slice.icon + " " + slice.label;
    if (slice.id === "candy75") { data.candyBonus = (Number(s.candyBonus) || 0) + 75; msg += "!<small>Treat! +75 " + S.cur + " in your " + S.basket + ".</small>"; }
    if (slice.id === "steal") {
      const avail = bucketState(cls, students).left, amt = Math.min(avail, 25 + Math.floor(Math.random() * 26));
      entry.amt = amt; data.stolen = (Number(s.stolen) || 0) + amt;
      const bk = S.key === "jingle" ? "the Grinch\u2019s Sack" : "Ms. Ariana\u2019s " + (S.key === "gobble" ? "cornucopia" : "bucket");
      msg += "<small>" + (amt ? (S.key === "jingle" ? "You stole back " : "You snuck ") + amt + " " + S.cur + " out of " + bk + "!" : bk.charAt(0).toUpperCase() + bk.slice(1) + " is empty \u2014 nothing to steal!") + "</small>";
    }
    if (slice.id === "nothing") msg += "<small>" + slice.note + "</small>";
    if (slice.id === "reroll") msg += "<small>Your spin comes back \u2014 spin again!</small>";
    if (slice.id === "prize") {
      entry.prize = pickSlice(prizeSlices());   // decided now (rare prizes 5%), shown on the Prize Wheel
      entry.prizeName = S.prizes[entry.prize].name;
      const pxp = Number(S.prizes[entry.prize].xp) || 0;   // XP prizes go straight into their collector XP
      if (pxp) { entry.xp = pxp; data.xpPrize = (Number(s.xpPrize) || 0) + pxp; }
      msg += "<small>\u2728 RARE! Spinning the Prize Wheel\u2026</small>";
    }
    if (slice.id === "attack") {
      const b = bossState(cls, students);
      if (b.defeated) msg += "<small>The " + S.boss + " is already defeated!</small>";
      else {
        const dmg = baseDamage(cls) + (s[S.hatFlag] ? HAT_BONUS : 0);
        data.attackTotal = (Number(s.attackTotal) || 0) + 1; data.dmgTotal = dmgOf(s, cls) + dmg;
        if (S.key === "gobble") data.turkeyAtk = (Number(s.turkeyAtk) || 0) + 1;
        if (S.key === "jingle") data.grinchAtk = (Number(s.grinchAtk) || 0) + 1;
        msg += "<small>\u2728 RARE! A free attack hits the " + S.boss + " for " + dmg + "!</small>";
      }
    }
    wheelBusy = true; wheelResult = msg;
    wheelRot = spinTo(i, S.slices.length, wheelRot);
    const spinEl = document.querySelector(".wheelspin");
    if (spinEl) spinEl.style.transform = "translate(-50%,-50%) rotate(" + wheelRot + "deg)";
    const btn = document.querySelector('[data-act="spin"]'); if (btn) { btn.disabled = true; btn.textContent = "Spinning\u2026"; }
    const saving = updateDoc(studentRef(me), data).catch(e => { wheelResult = "That spin didn\u2019t save \u2014 ask Ms. Ariana. (" + (e.code || e.message) + ")"; });
    setTimeout(async () => {
      await saving; Object.assign(s, data); wheelBusy = false;
      if (slice.id === "prize") openPrizeWheel(entry.prize); else render();
    }, 5100);
    return;
  }
  if (act === "closePrize") { prizeWheel = null; render(); return; }
  if (act === "closePresent") { present = null; render(); return; }
  if (act === "presentSpin") { const idx = present && present.prize; present = null; if (idx != null) openPrizeWheel(idx); return; }
  if (act === "cancelBuy") { busy.confirmBuy = null; render(); return; }
  if (act === "attack") {
    const s = students.find(x => x.id === me);
    const nx = nextAttack(s, cls);
    if (!nx.count || bossState(cls, students).defeated) return;
    const data = { attackTotal: (Number(s.attackTotal) || 0) + 1, dmgTotal: dmgOf(s, cls) + nx.damage };
    if (isGobble(cls)) data.turkeyAtk = (Number(s.turkeyAtk) || 0) + 1;   // Turducken attacks, counted apart from Ghost-olotl ones
    if (isJingle(cls)) data.grinchAtk = (Number(s.grinchAtk) || 0) + 1;   // Grinch-a-Duck attacks
    if (nx.day !== null) { const attacks = arr5(s.attacks, false); attacks[nx.day] = true; data.attacks = attacks; }
    else data.extraAttacks = (Number(s.extraAttacks) || 0) - 1;
    if (nx.brew) data.brews = (Number(s.brews) || 0) - 1;
    attackFx = nx.damage; clearTimeout(fxTimer); fxTimer = setTimeout(() => { attackFx = null; render(); }, 1500);
    return patch(data);
  }
  if (act === "notMe") { me = null; save(null); history.replaceState(null, "", location.pathname); render(); return; }
  if (act === "choose") {
    const c = byId(ROSTER, picking); if (!c) return;
    const nm = (document.getElementById("petName").value || "").trim().slice(0, 22) || c.name;
    return patch({ companionId: c.id, petName: nm });
  }
  if (act === "rename") {
    const nm = document.getElementById("rename").value.trim().slice(0, 22);
    if (!nm) { flash("Give your companion a name first."); return; }
    await patch({ petName: nm }); flash("Saved!", true);
  }
});
document.addEventListener("keydown", ev => {
  if (ev.key !== "Enter") return;
  if (ev.target.id === "petName") document.querySelector('[data-act="choose"]').click();
  if (ev.target.id === "rename") document.querySelector('[data-act="rename"]').click();
  if (ev.target.id === "nickIn") { const b = document.querySelector('[data-cc="nickSave"]'); if (b) b.click(); }
});
render();
