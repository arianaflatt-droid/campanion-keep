import {
  applyDisplayNames, companionOf, petCreatures, pinnedBadgeHTML, DAYS, SHORT, ROSTER, GEAR, SIDEKICKS, BANNER, bannerFor, isHaunt, battleOn, candyOf, basketHTML, CANDY_FULL, bossState, attacksReady, bossBarHTML, GHOST_IMG, ghostUnlocked, STORE, candyLeft, candySpent, ownedCount, ownsItem, storeArt, nextAttack, dmgOf, HAT_BONUS, BREW_BONUS, teamHTML, WHEEL, pickSlice, wheelHTML, spinTo, PRIZES, prizeSlices, bucketState, bucketHTML, baseDamage, EAT_PER_DAY, dayEaten, dayXP, byId, esc, arr5, recordedDays, goalXP,
  simulate, wornItem, tier, boardDay, sidekickToday, sidekickSVG, petHTML, itemArt
} from "./game.js";
import { PREVIEW, configured, auth, studentRef, watchClass, watchStudents, watchBattles, watchTrades, anonSignIn, onAuthStateChanged, updateDoc } from "./db.js";
import { nudgeCard } from "./nudges.js";
import { badgesTab, newlyEarned, badgeParty, unseenBadges } from "./badges.js";
import { teacherPlayer, hasStarter } from "./collect.js";
import { onTradeClick, onTradeChange, settleTrades } from "./trade-ui.js";
import { collectorTab, overlays as collectorOverlays, onClick as collectorClick, isBusy as collectorBusy } from "./collector-ui.js";

let cls = null, students = [], battles = [], trades = [], loaded = { c: false, s: false };
let tab = (() => { try { return localStorage.getItem("ck-tab") || "pet"; } catch (e) { return "pet"; } })();
let me = new URLSearchParams(location.search).get("s") || load();
let attackFx = null, fxTimer = null;
const busy = {};
let wheelRot = 0, wheelBusy = false, wheelResult = null;
let prizeWheel = null;   // { idx, rot, done } while the Prize Wheel pop-up is open
let flashOk = false, picking = null, draftName = "", flashMsg = null, flashTimer = null, error = null;

function load() { try { return localStorage.getItem("ck-student"); } catch (e) { return null; } }
function save(id) { if (PREVIEW) return; try { id ? localStorage.setItem("ck-student", id) : localStorage.removeItem("ck-student"); } catch (e) {} }
function flash(m, ok) { flashMsg = m; flashOk = !!ok; render(); clearTimeout(flashTimer); flashTimer = setTimeout(() => { flashMsg = null; render(); }, 4000); }
const app = document.getElementById("app");

if (!configured) { error = "This page isn’t connected yet. Ask your teacher."; render(); }
else {
  onAuthStateChanged(auth, u => {
    if (!u) { anonSignIn().catch(e => { error = "Couldn’t connect (" + e.code + "). Try reloading."; render(); }); return; }
    watchClass(c => { cls = c; loaded.c = true; render(); }, e => { error = "Couldn’t load your class (" + e.code + ")."; render(); });
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
  const party = !PREVIEW && cur && cur.companionId && cls && !prizeWheel && !collectorBusy() ? badgeParty(cur) : "";
  app.innerHTML = h + prizeOverlay() + (cur && cur.companionId && cls ? collectorOverlays(collectorCtx(cur)) : "") + party;
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

  const haunt = isHaunt(cls), candy = haunt ? candyLeft(s) : 0;
  if (tab === "haunt" && !haunt) tab = "pet";
  let h = notYou(s) + '<div class="tabs" role="tablist">' +
    [["pet", "\u{1F43E} My Companion"], ["collect", "\u{1F95A} Creature Collector"], ["badges", "\u{1F3C5} Badges"]].concat(haunt ? [["haunt", "\u{1F383} Haunt-O-Ween"]] : [])
      .map(([k, t]) => '<button role="tab" class="tab' + (tab === k ? " on" : "") + '" data-tab="' + k + '" aria-selected="' + (tab === k) + '">' + t + "</button>").join("") + "</div>";
  if (tab === "collect") return h + collectorTab(collectorCtx(s));
  if (tab === "badges") return h + badgesTab(s, battles, cls);
  if (tab === "haunt") return h + (battleOn(cls) ? battleCard(s, c) : "") + wheelCard(s) + shopCard(s);
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
    (haunt ? '<p style="margin-top:8px;color:#E8740C;font-weight:700;">\u{1F383} ' + candy.toLocaleString() + " piece" + (candy === 1 ? "" : "s") + " of candy to spend" +
      (candy >= CANDY_FULL ? " \u2014 your basket is FULL!" : " \u00b7 " + (CANDY_FULL - candy).toLocaleString() + " more to fill your basket") + "</p>" : "") +
    '<p class="muted" style="margin-top:8px;">Streak: ' + sim.hitRun + " day" + (sim.hitRun === 1 ? "" : "s") + " · best this week: " + sim.bestRun + "</p></div></div>";

  h += '<div class="card"><div class="card-head"><h2>Gear</h2><span class="fact">one at a time</span></div><div class="gearpick">';
  GEAR.forEach(g => {
    const ok = sim.unlocked.includes(g.id);
    h += "<div><button class=\"eq" + (worn && worn.id === g.id ? " on" : "") + '" data-equip="' + g.id + '"' + (ok ? "" : " disabled") + ' aria-label="' + esc(g.name) + (ok ? "" : " locked") + '">' +
      itemArt(g, "gimg") + '</button><span class="lbl">' + (ok ? esc(g.name) : g.ghost && !ghostUnlocked(cls) ? "Defeat the Ghost-olotl" : g.streak + "-day streak") + "</span></div>";
  });
  h += '</div><p class="lede" style="margin-top:12px;font-size:13.5px;text-align:center;">Hit ' + goal + " XP days in a row to unlock more. Tap what you’re wearing to take it off.</p></div>";

  const legends = petCreatures(s);
  if (legends.length) {
    const base = byId(ROSTER, s.companionId), curId = s.petCreature && legends.some(x => x.fam === s.petCreature) ? s.petCreature : "";
    h += '<div class="card"><div class="card-head"><h2>\u{1F31F} Level 100 companions</h2><span class="fact">unlocked</span></div>' +
      '<p class="lede" style="margin-bottom:12px;">You got a creature to level 100, so it can be your companion! Your gear, name and health stay the same.</p>' +
      '<div class="pickgrid">' +
      '<button class="pick' + (curId ? "" : " on") + '" data-petcr=""><span class="g">' + base.glyph + '</span><span class="n">' + esc(base.name) + "</span></button>" +
      legends.map(x => '<button class="pick' + (curId === x.fam ? " on" : "") + '" data-petcr="' + x.fam + '"><span class="g crg">' + x.glyph + '</span><span class="n">' + (x.sparkle ? "\u2728 " : "") + esc(x.name) + "</span></button>").join("") +
      "</div></div>";
  }

  h += '<div class="card"><div class="card-head"><h2>Lunch sidekick</h2></div>' +
    '<p class="lede" style="margin-bottom:12px;">Hit ' + goal + " XP before lunch and your sidekick joins you for the day. Who do you want?</p>" +
    '<div class="pickgrid" style="grid-template-columns:repeat(3,minmax(0,150px));justify-content:center;">' +
    Object.keys(SIDEKICKS).map(k => {
      const locked = k === "ghost" && !ghostUnlocked(cls);
      return '<button class="pick' + ((s.sidekick || "axolotl") === k ? " on" : "") + '" data-side="' + k + '"' + (locked ? ' disabled style="opacity:.45;filter:grayscale(.7);"' : "") +
        '><span style="display:flex;justify-content:center;height:70px;align-items:flex-end;">' +
        sidekickSVG(k, true).replace('class="side', 'style="animation:none;height:' + (k === "duck" ? 68 : k === "ghost" ? 66 : 56) + 'px" class="side') +
        '</span><span class="n">' + SIDEKICKS[k] + "</span>" + (locked ? '<span class="lbl" style="display:block;font-family:var(--mono);font-size:10px;color:var(--ink-3);">\u{1F512} Defeat the Ghost-olotl</span>' : "") + "</button>";
    }).join("") + "</div></div>";

  h += '<div class="card"><div class="card-head"><h2>Rename</h2></div><div class="row"><div class="field" style="flex:1;min-width:200px;"><label for="rename">Companion name</label>' +
    '<input id="rename" type="text" maxlength="22" value="' + esc(s.petName || "") + '"></div><button class="btn ghost" data-act="rename">Save name</button></div></div>';
  return h;
}

function openPrizeWheel(idx) {
  prizeWheel = { idx, rot: 0, done: false };
  render();
  wheelBusy = true;                                   // hold redraws while it spins
  setTimeout(() => {
    prizeWheel.rot = spinTo(idx, PRIZES.length, 0);
    const el = document.querySelector(".prizewheel .wheelspin");
    if (el) el.style.transform = "translate(-50%,-50%) rotate(" + prizeWheel.rot + "deg)";
  }, 500);
  setTimeout(() => { prizeWheel.done = true; wheelBusy = false; wheelResult = "\u{1F381} You won: " + esc(PRIZES[idx].name) + "!<small>Ms. Ariana has been told.</small>"; render(); }, 5800);
}
function prizeOverlay() {
  if (!prizeWheel) return "";
  const p = PRIZES[prizeWheel.idx];
  return '<div class="prizeover" role="dialog" aria-label="Prize Wheel"><div class="prizebox"><h2>\u{1F381} PRIZE WHEEL \u{1F381}</h2>' +
    wheelHTML(prizeSlices(), prizeWheel.rot, "prizewheel") +
    (prizeWheel.done
      ? '<div class="prizewon">' + (p.img ? '<img src="' + esc(p.img) + '" alt="">' : '<span style="font-size:64px;line-height:1;">' + p.icon + "</span>") +
        "<b>You won: " + esc(p.name) + '!</b><span class="arena-foot">Ms. Ariana has been told \u2014 she\u2019ll get it for you!</span>' +
        '<button class="attackbtn" data-act="closePrize">Yay! \u{1F389}</button></div>'
      : '<p class="arena-foot" style="font-size:14px;">Spinning for your prize\u2026</p>') + "</div></div>";
}

// Today's power-up: the companion eats the first 120 candy of the day to power its attack.
function powerMeter(s) {
  const bd = boardDay(cls, students); if (bd < 0) return "";
  const eaten = dayEaten(s, bd), full = eaten >= EAT_PER_DAY, extra = Math.max(0, Math.round(dayXP(s, bd)) - EAT_PER_DAY);
  return '<div class="power"><div class="power-k">\u26A1 ' + SHORT[bd] + " power-up: <b>" + eaten + " / " + EAT_PER_DAY + "</b> candy eaten" +
    (full ? " \u2014 attack powered!" : "") + '</div><span class="powertrack"><span style="width:' + (eaten / EAT_PER_DAY * 100) + '%"></span></span>' +
    (extra ? '<div class="power-s">+' + extra + " extra candy went into your basket</div>" : '<div class="power-s">Candy over ' + EAT_PER_DAY + " goes into your basket</div>") + "</div>";
}

function wheelCard(s) {
  const spins = Number(s.spins) || 0;
  let h = '<div class="arena" style="margin-bottom:16px;"><p class="arena-title">\u{1F3A1} Trick or Treat Wheel</p>' +
    '<p class="arena-foot" style="margin:0 0 10px;">Spins: <b>' + spins + "</b>" + (spins ? "" : " \u00b7 buy a spin in the Candy Shop") + "</p>" +
    '<div id="wheelbox">' + wheelHTML(WHEEL, wheelRot) + "</div>" +
    '<button class="attackbtn" data-act="spin"' + (spins && !wheelBusy ? "" : " disabled") + ">" + (wheelBusy ? "Spinning\u2026" : "\u{1F3A1} Spin!") + "</button>" +
    '<div class="wheelres">' + (wheelResult && !wheelBusy ? wheelResult : "") + "</div>" +
    '<p class="arena-foot">\u{1F7E0} Orange = treats \u00b7 \u{1F7E3} purple = tricks \u00b7 \u2728 rare slices</p></div>';
  return h;
}

function shopCard(s) {
  const left = candyLeft(s);
  let h = '<div class="card"><div class="card-head"><h2>\u{1F36C} Candy Shop</h2><span class="wallet">\u{1F36C} ' + left.toLocaleString() + " to spend</span></div>" +
    '<div class="shop">' + STORE.map(it => {
      const n = ownedCount(s, it.id), done = it.once && ownsItem(s, it.id), can = left >= it.cost && !done;
      return '<div class="shopitem"><div class="art">' + storeArt(it) + '</div><div class="n">' + esc(it.name) + '</div><div class="d">' + esc(it.desc) + "</div>" +
        '<span class="price">\u{1F36C} ' + it.cost.toLocaleString() + "</span>" +
        (busy.confirmBuy === it.id
          ? '<div class="row" style="justify-content:center;"><button class="buybtn" data-buyok="' + it.id + '">Yes, buy it</button><button class="btn ghost small" data-act="cancelBuy">No</button></div>'
          : '<button class="buybtn" data-buy="' + it.id + '"' + (can ? "" : " disabled") + ">" + (done ? "\u2713 Yours!" : can ? "Buy" : "Need " + (it.cost - left).toLocaleString() + " more") + "</button>") +
        (done ? '<span class="owned">Your companion is wearing it \u00b7 +5 damage</span>' : n ? '<span class="owned">\u2713 Bought ' + n + "</span>" : "") + "</div>";
    }).join("") + "</div>";
  const inv = [];
  if (s.witchHat) inv.push(storeArt(byId(STORE, "witchhat")) + " Witch\u2019s Hat (+5 damage)");
  if (Number(s.brews) > 0) inv.push(storeArt(byId(STORE, "brew")) + " " + s.brews + " Witch\u2019s Brew" + (s.brews == 1 ? "" : "s"));
  if (Number(s.extraAttacks) > 0) inv.push("\u2694\uFE0F " + s.extraAttacks + " extra attack" + (s.extraAttacks == 1 ? "" : "s"));
  if (Number(s.spins) > 0) inv.push("\u{1F3A1} " + s.spins + " wheel spin" + (s.spins == 1 ? "" : "s") + " saved");
  if (inv.length) h += '<p class="muted" style="margin:14px 0 6px;">Your stuff</p><div class="inv">' + inv.map(x => "<span>" + x + "</span>").join("") + "</div>";
  return h + "</div>";
}

function battleCard(s, c) {
  const b = bossState(cls, students), nx = nextAttack(s, cls), goal = goalXP(cls);
  let h = '<div class="arena" style="margin-bottom:16px;"><p class="arena-title">⚔️ Battle the Ghost-olotl</p>' + bossBarHTML(b) +
    '<div class="ghostwrap' + (attackFx ? " hit" : "") + '"><img class="ghostimg" src="' + GHOST_IMG + '" alt="The Ghost-olotl">' +
    (attackFx ? '<span class="dmg">-' + attackFx + "</span>" : "") + "</div>" + teamHTML(cls, students, !!attackFx);
  h += powerMeter(s);
  if (b.defeated) h += '<p class="arena-win">\u{1F389} Your class defeated the Ghost-olotl!</p>';
  else if (nx.count) {
    const parts = [b.dmg + " attack"];
    if (nx.hat) parts.push("+" + HAT_BONUS + " \u{1F9D9} hat");
    if (nx.brew) parts.push("+" + BREW_BONUS + " \u{1F9EA} brew");
    h += '<button class="attackbtn" data-act="attack">⚔️ Attack for ' + nx.damage + "!</button>" +
      '<p class="arena-foot">' + parts.join(" ") + " = <b>" + nx.damage + "</b> damage · you have <b>" + nx.count + "</b> attack" + (nx.count === 1 ? "" : "s") + " ready</p>";
  } else h += '<p class="arena-foot" style="font-size:13px;">Hit ' + goal + " XP today to earn an attack, or buy one in the Candy Shop!</p>";
  h += bucketHTML(cls, students);
  const brews = Number(s.brews) || 0;
  if (brews) h += '<p class="arena-foot">\u{1F9EA} ' + brews + " Witch’s Brew" + (brews === 1 ? "" : "s") + " ready (one is used on each attack)</p>";
  const mine = Number(s.attackTotal) || 0;
  if (mine) h += '<p class="arena-foot">' + esc(s.petName || c.name) + " has attacked " + mine + " time" + (mine === 1 ? "" : "s") + " for " + dmgOf(s, cls).toLocaleString() + " damage.</p>";
  return h + "</div>";
}

document.addEventListener("change", ev => {
  if (ev.target.dataset && ev.target.dataset.trsel) { const s = students.find(x => x.id === me); if (s) onTradeChange(ev.target, collectorCtx(s)); return; }
  if (ev.target.id === "previewPick") { me = ev.target.value; history.replaceState(null, "", "?s=" + encodeURIComponent(me) + "&preview=1"); picking = null; render(true); scrollTo({ top: 0 }); }
});
document.addEventListener("input", ev => { if (ev.target.id === "petName") draftName = ev.target.value; });
document.addEventListener("click", async ev => {
  let el;
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
  if ((el = ev.target.closest("[data-tr]"))) { const s = students.find(x => x.id === me); if (s && !PREVIEW) await onTradeClick(el, collectorCtx(s)); return; }
  if ((el = ev.target.closest("[data-cc]"))) { const s = students.find(x => x.id === me); if (s) await collectorClick(el, collectorCtx(s)); return; }
  if ((el = ev.target.closest("[data-me]"))) { me = el.dataset.me; save(me); picking = null; draftName = ""; render(); scrollTo({ top: 0 }); return; }
  if ((el = ev.target.closest("[data-pick]"))) { picking = el.dataset.pick; render(); return; }
  if ((el = ev.target.closest("[data-buy]"))) { busy.confirmBuy = el.dataset.buy; render(); return; }
  if ((el = ev.target.closest("[data-buyok]"))) {
    const s = students.find(x => x.id === me), it = byId(STORE, el.dataset.buyok);
    busy.confirmBuy = null;
    if (!it || candyLeft(s) < it.cost) { flash("Not enough candy yet!"); return; }
    if (it.once && ownsItem(s, it.id)) { flash("You already have the " + it.name + "!"); return; }
    const data = { purchases: (s.purchases || []).concat([{ id: it.id, cost: it.cost, at: new Date().toISOString() }]), candySpent: candySpent(s) + it.cost };
    if (it.id === "witchhat") { data.witchHat = true; data.equipped = "witch"; }
    if (it.id === "brew") data.brews = (Number(s.brews) || 0) + 1;
    if (it.id === "attack") data.extraAttacks = (Number(s.extraAttacks) || 0) + 1;
    if (it.id === "spin") data.spins = (Number(s.spins) || 0) + 1;
    await patch(data);
    flash("You bought the " + it.name + "!", true);
    return;
  }
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
    const i = pickSlice(WHEEL), slice = WHEEL[i];
    const entry = { id: slice.id, at: new Date().toISOString() };
    const data = { spinLog: (s.spinLog || []).concat([entry]), spins: (Number(s.spins) || 0) - (slice.id === "reroll" ? 0 : 1) };
    let msg = slice.icon + " " + slice.label;
    if (slice.id === "candy75") { data.candyBonus = (Number(s.candyBonus) || 0) + 75; msg += "!<small>Treat! +75 candy in your basket.</small>"; }
    if (slice.id === "steal") {
      const avail = bucketState(cls, students).left, amt = Math.min(avail, 25 + Math.floor(Math.random() * 26));
      entry.amt = amt; data.stolen = (Number(s.stolen) || 0) + amt;
      msg += "<small>" + (amt ? "You snuck " + amt + " candy out of Ms. Ariana\u2019s bucket!" : "Ms. Ariana\u2019s bucket is empty \u2014 nothing to steal!") + "</small>";
    }
    if (slice.id === "nothing") msg += "<small>" + slice.note + "</small>";
    if (slice.id === "reroll") msg += "<small>Your spin comes back \u2014 spin again!</small>";
    if (slice.id === "prize") {
      entry.prize = pickSlice(prizeSlices());   // decided now (rare prizes 5%), shown on the Prize Wheel
      entry.prizeName = PRIZES[entry.prize].name;
      msg += "<small>\u2728 RARE! Spinning the Prize Wheel\u2026</small>";
    }
    if (slice.id === "attack") {
      const b = bossState(cls, students);
      if (b.defeated) msg += "<small>The Ghost-olotl is already defeated!</small>";
      else {
        const dmg = baseDamage(cls) + (s.witchHat ? HAT_BONUS : 0);
        data.attackTotal = (Number(s.attackTotal) || 0) + 1; data.dmgTotal = dmgOf(s, cls) + dmg;
        msg += "<small>\u2728 RARE! A free attack hits the Ghost-olotl for " + dmg + "!</small>";
      }
    }
    wheelBusy = true; wheelResult = msg;
    wheelRot = spinTo(i, WHEEL.length, wheelRot);
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
  if (act === "cancelBuy") { busy.confirmBuy = null; render(); return; }
  if (act === "attack") {
    const s = students.find(x => x.id === me);
    const nx = nextAttack(s, cls);
    if (!nx.count || bossState(cls, students).defeated) return;
    const data = { attackTotal: (Number(s.attackTotal) || 0) + 1, dmgTotal: dmgOf(s, cls) + nx.damage };
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
