// Creature trading between players (students and the teacher).
// A trade doc: { a:{id,name}, b:{id,name}, give:{fam,lvl,sparkle}, get:{fam,lvl,sparkle},
//   status: "offer" | "accepted" | "declined" | "cancelled", created, applied_<id>: true }
// "a" offers their `give` creature for b's `get` creature. When b accepts, each player's page moves
// the creatures on its own save (you give yours away and receive theirs), then marks the trade applied.
// Players can offer a creature from their collection OR a spare (a duplicate kept for trading).
// Receiving a family you already have turns it into a spare. You can't trade away your last creature
// (spares don't count), limited event creatures (Duckarune, Hexaduck) can't be traded, and not during a battle.
// Trading follows the same schedule as the arena (its own switches in the teacher console), and a player has to
// tick "I'm ready to trade" (tradeReady) before anyone can send them an offer.
import { esc } from "./game.js?v=20260930j";
import { owned, ownedFams, family, formOf, creature, RARITY_COLOR, hasStarter, spares, spareId, tradeOpen, tradeOpenFor, lunchHour, hitGoalToday, ARENA_HOURS, LUNCH_ARENA, LIVE, staleBattle } from "./collect.js?v=20260930j";
import { newTradeRef, changeTrade, setDoc } from "./db.js?v=20260930j";

let pick = { who: "", theirs: "", mine: "" };
let settling = {};

const isEvent = fam => { const f = family(fam); return !!(f && f.event); };
const entry = (st, fam) => owned(st)[fam];
// a trade key is "m:FAM" (from the collection) or "s:ID" (a spare)
function snap(st, key) {
  if (String(key).startsWith("s:")) { const x = spares(st).find(y => y.id === key.slice(2)) || {}; return { fam: x.fam, lvl: x.lvl || 1, sparkle: !!x.sparkle, spare: x.id || "" }; }
  const fam = String(key).replace(/^m:/, ""), e = entry(st, fam) || {}; return { fam, lvl: e.lvl || 1, sparkle: !!e.sparkle };
}
const has = (st, t) => (t.spare ? spares(st).some(y => y.id === t.spare) : !!entry(st, t.fam));
// Marked "up for trade" (coll[fam].forTrade or a spare's forTrade)
export function forTrade(st, key) {
  if (String(key).startsWith("s:")) return !!(spares(st).find(y => y.id === key.slice(2)) || {}).forTrade;
  return !!(entry(st, String(key).replace(/^m:/, "")) || {}).forTrade;
}
function offerable(st) {   // everything this player could give (the ones up for trade first)
  const mains = ownedFams(st).filter(f => !isEvent(f) && !(entry(st, f) || {}).fav).map(f => "m:" + f);   // favorites can't be traded
  const all = (ownedFams(st).length > 1 ? mains : []).concat(spares(st).filter(x => !isEvent(x.fam)).map(x => "s:" + x.id));
  return all.filter(k => forTrade(st, k)).concat(all.filter(k => !forTrade(st, k)));
}
function label(t) { const c = formOf(t.fam, t.lvl); return c ? (t.sparkle ? "✨ " : "") + c.name + " (Lv " + t.lvl + ")" : "?"; }
function pic(t) {
  const c = formOf(t.fam, t.lvl); if (!c) return "";
  const src = t.sparkle ? c.img.replace("assets/creatures/", "assets/creatures/sparkle/") : c.img;
  return '<img class="trimg" src="' + src + '" alt="" style="--rc:' + RARITY_COLOR[c.rarity] + '">';
}
function inBattle(ctx, id) { return (ctx.battles || []).some(b => LIVE.includes(b.status) && !staleBattle(b) && (b.a.id === id || b.b.id === id)); }

const open = t => t.status === "offer";
const mineOf = (ctx, s) => (ctx.trades || []).filter(t => t.a && t.b && (t.a.id === s.id || t.b.id === s.id));

export function tradeCard(ctx) {
  const s = ctx.me;
  if (!hasStarter(s)) return "";
  const cls = ctx.cls, isOpen = tradeOpenFor(s, cls), lunchOnly = isOpen && !tradeOpen(cls) && !s.isTeacher, ready = !!s.tradeReady;
  const list = mineOf(ctx, s);
  const incoming = list.filter(t => open(t) && t.b.id === s.id);
  const outgoing = list.filter(t => open(t) && t.a.id === s.id);
  const recent = list.filter(t => t.status === "accepted").sort((x, y) => String(y.created).localeCompare(String(x.created))).slice(0, 3);
  let h = '<div class="card tradecard"><div class="card-head"><h2>\u{1F504} Trading</h2><span class="fact ' + (isOpen ? "open" : "") + '">' + (isOpen ? "OPEN" : "closed") + "</span></div>";

  incoming.forEach(t => {
    h += '<div class="trrow in"><div class="trside">' + pic(t.give) + "<small><b>" + esc(t.a.name) + "</b> gives<br>" + esc(label(t.give)) + "</small></div>" +
      '<span class="trarrow">⇄</span><div class="trside">' + pic(t.get) + "<small>for your<br>" + esc(label(t.get)) + "</small></div>" +
      '<div class="trbtns">' + (isOpen ? '<button class="btn small" data-tr="accept" data-t="' + t.id + '">Accept</button>' : '<span class="muted small">Accept when trading opens</span>') + '<button class="btn ghost small" data-tr="decline" data-t="' + t.id + '">No thanks</button></div></div>';
  });
  outgoing.forEach(t => {
    h += '<div class="trrow out"><div class="trside">' + pic(t.give) + "<small>Your<br>" + esc(label(t.give)) + "</small></div>" +
      '<span class="trarrow">⇄</span><div class="trside">' + pic(t.get) + "<small><b>" + esc(t.b.name) + "’s</b><br>" + esc(label(t.get)) + "</small></div>" +
      '<div class="trbtns"><span class="muted small">Waiting for ' + esc(t.b.name) + "…</span>" +
      '<button class="btn ghost small" data-tr="cancel" data-t="' + t.id + '">Cancel</button></div></div>';
  });
  recent.forEach(t => {
    const iGave = t.a.id === s.id, got = iGave ? t.get : t.give, other = iGave ? t.b.name : t.a.name;
    h += '<p class="muted small" style="margin:6px 0;">✅ You traded with ' + esc(other) + " and got " + esc(label(got)) + ".</p>";
  });

  // trading closed: offers can still be declined or cancelled, but no new ones
  if (!isOpen) {
    const closed = cls && (cls.tradeOff || cls.tradeOverride === "closed");
    return h + '<p class="lede">' + (closed ? "Trading is closed right now." : "Trading opens " + esc(ARENA_HOURS) + ".") + "</p>" +
      (closed || (cls && cls.lunchTrade === false) ? "" : '<p class="lede" style="margin-top:6px;">\u2600\uFE0F <b>Lunch trading:</b> ' + esc(LUNCH_ARENA) + "." + (lunchHour() && !hitGoalToday(s, cls) ? " Hit 120 XP to join right now!" : "") + "</p>") +
      (!closed && cls && cls.goalTrade && !hitGoalToday(s, cls) ? '<p class="lede" style="margin-top:6px;">\u2B50 Hit 120 XP today and you can trade right away!</p>' : "") + "</div>";
  }
  if (lunchOnly) h += '<p class="lede" style="margin-bottom:10px;">' + (cls && cls.goalTrade ? "\u2B50 <b>120 XP traders</b> \u2014 you hit 120 XP today, so you can trade with other players who did too!" : "\u2600\uFE0F <b>Lunch trading</b> until 1 pm \u2014 you hit 120 XP today, so you can trade with other players who did too!") + "</p>";
  h += '<label class="modebox" style="margin-bottom:12px;"><input type="checkbox" data-trready="1"' + (ready ? " checked" : "") + "><span><b>I\u2019m ready to trade</b><small>Other ready players can send you offers, and you can send them offers.</small></span></label>";
  if (!ready) return h + "</div>";

  // make an offer (only to other ready players who can trade right now)
  const others = ctx.students.filter(x => x.id !== s.id && hasStarter(x) && x.tradeReady && tradeOpenFor(x, cls));
  if (!others.length) return h + '<p class="lede">Nobody else is ready to trade yet. Hang tight!</p></div>';
  const who = others.find(x => x.id === pick.who) || null;
  const mineOk = offerable(s);
  const theirsOk = who ? offerable(who) : [];
  if (pick.mine && !mineOk.includes(pick.mine)) pick.mine = "";
  if (pick.theirs && !theirsOk.includes(pick.theirs)) pick.theirs = "";
  // Up for trade: what other ready players marked, tap one to start an offer for it
  const board = others.map(x => ({ x, keys: offerable(x).filter(k => forTrade(x, k)) })).filter(r => r.keys.length);
  const mineMarked = offerable(s).filter(k => forTrade(s, k)).length;
  h += '<div class="trboard"><b>\u{1F504} Up for trade</b>' + (board.length
    ? board.map(r => '<div class="trbrow"><span class="trbwho">' + esc(r.x.name) + '</span><div class="trbitems">' +
        r.keys.map(k => { const t = snap(r.x, k); return '<button class="trbitem' + (pick.who === r.x.id && pick.theirs === k ? " on" : "") + '" data-tr="want" data-who="' + r.x.id + '" data-key="' + esc(k) + '">' + pic(t) + "<small>" + esc(label(t)) + "</small></button>"; }).join("") + "</div></div>").join("")
    : '<p class="muted small" style="margin:4px 0;">Nobody has marked anything up for trade yet.</p>') +
    '<p class="muted small" style="margin-top:4px;">' + (mineMarked ? "You have <b>" + mineMarked + "</b> up for trade." : "Tap \u{1F504} on a creature in My creatures to put it up for trade.") + "</p></div>";
  const opt = (v, t, on) => '<option value="' + esc(v) + '"' + (on ? " selected" : "") + ">" + esc(t) + "</option>";
  h += '<div class="trmake"><b>Make an offer</b><div class="row" style="margin-top:6px;gap:8px;">' +
    '<div class="field"><label for="trWho">Trade with</label><select id="trWho" data-trsel="who">' + opt("", "Choose a player") +
      others.map(x => opt(x.id, x.name, x.id === pick.who)).join("") + "</select></div>" +
    '<div class="field"><label for="trTheirs">You want</label><select id="trTheirs" data-trsel="theirs"' + (who ? "" : " disabled") + ">" + opt("", who ? (theirsOk.length ? "Choose their creature" : "Nothing you don’t already have") : "Choose a player first") +
      theirsOk.map(f => opt(f, (forTrade(who, f) ? "\u{1F504} " : "") + label(snap(who, f)), f === pick.theirs)).join("") + "</select></div>" +
    '<div class="field"><label for="trMine">You give</label><select id="trMine" data-trsel="mine">' + opt("", mineOk.length ? "Choose your creature" : "Nothing they don’t already have") +
      mineOk.map(f => opt(f, (forTrade(s, f) ? "\u{1F504} " : "") + label(snap(s, f)), f === pick.mine)).join("") + "</select></div>" +
    '<button class="btn" data-tr="offer"' + (who && pick.theirs && pick.mine ? "" : " disabled") + ">\u{1F504} Send offer</button></div>" +
    '<p class="muted small" style="margin-top:6px;">You both have to agree. You can’t trade your last creature, a \u2B50 favorite, or limited event Legendaries, and you can’t get a creature family you already have.</p></div>';
  return h + "</div>";
}

// The "I'm ready to trade" box
export function onTradeReady(el, ctx) { return ctx.patch({ tradeReady: !!el.checked }); }
// A select changed
export function onTradeChange(el, ctx) {
  const k = el.dataset.trsel; pick[k] = el.value;
  if (k === "who") { pick.theirs = ""; pick.mine = ""; }
  ctx.render(true);
}

function problem(ctx, giver, g, taker, w) {
  if (!g.fam || !has(giver, g)) return giver.name + " doesn\u2019t have that creature anymore.";
  if (!w.fam || !has(taker, w)) return taker.name + " doesn\u2019t have that creature anymore.";
  if (isEvent(g.fam) || isEvent(w.fam)) return "Limited event Legendaries can\u2019t be traded.";
  if ((!g.spare && (entry(giver, g.fam) || {}).fav) || (!w.spare && (entry(taker, w.fam) || {}).fav)) return "Favorite creatures can\u2019t be traded. Take the \u2B50 off first.";
  if ((!g.spare && ownedFams(giver).length < 2) || (!w.spare && ownedFams(taker).length < 2)) return "You can\u2019t trade away your last creature.";
  if (inBattle(ctx, giver.id) || inBattle(ctx, taker.id)) return "Finish your battle first!";
  return null;
}

export async function onTradeClick(el, ctx) {
  const a = el.dataset.tr, s = ctx.me;
  if (a === "offer") {
    const o = ctx.students.find(x => x.id === pick.who); if (!o || !pick.mine || !pick.theirs) return;
    const g = snap(s, pick.mine), w = snap(o, pick.theirs);
    const why = problem(ctx, s, g, o, w); if (why) return ctx.flash(why);
    if (!tradeOpenFor(s, ctx.cls) || !tradeOpenFor(o, ctx.cls)) return ctx.flash("Trading isn\u2019t open for both of you right now.");
    if (!o.tradeReady) return ctx.flash(o.name + " isn\u2019t ready to trade right now.");
    if (mineOf(ctx, s).some(t => open(t) && t.a.id === s.id && t.b.id === o.id)) return ctx.flash("You already have an offer waiting for " + o.name + ".");
    await setDoc(newTradeRef(), { a: { id: s.id, name: s.name }, b: { id: o.id, name: o.name }, give: g, get: w, status: "offer", created: new Date().toISOString() });
    pick = { who: "", theirs: "", mine: "" };
    ctx.flash("Offer sent to " + o.name + "!", true); return;
  }
  if (a === "want") { pick = { who: el.dataset.who, theirs: el.dataset.key, mine: "" }; return ctx.render(true); }
  const id = el.dataset.t, t = (ctx.trades || []).find(x => x.id === id); if (!t) return;
  if (a === "cancel" || a === "decline") {
    await changeTrade(id, d => (d.status === "offer" ? Object.assign(d, { status: a === "cancel" ? "cancelled" : "declined" }) : null));
    return ctx.render(true);
  }
  if (a === "accept") {
    if (!tradeOpenFor(s, ctx.cls)) return ctx.flash("Trading is closed right now \u2014 you can accept when it opens.");
    const giver = ctx.students.find(x => x.id === t.a.id); if (!giver) return ctx.flash("That player isn’t here anymore.");
    const g = t.give.spare ? snap(giver, "s:" + t.give.spare) : snap(giver, "m:" + t.give.fam), w = t.get.spare ? snap(s, "s:" + t.get.spare) : snap(s, "m:" + t.get.fam);
    const why = problem(ctx, giver, g, s, w);
    if (why) { await changeTrade(id, d => (d.status === "offer" ? Object.assign(d, { status: "declined", why }) : null)); return ctx.flash(why); }
    // lock in the creatures as they are right now
    const done = await changeTrade(id, d => (d.status === "offer" ? Object.assign(d, { status: "accepted", give: g, get: w, at: new Date().toISOString() }) : null));
    if (done) { await settleTrades(Object.assign({}, ctx, { trades: [Object.assign({ id }, done)] })); ctx.flash("Trade complete! Say hi to your new " + label(done.give).replace(/ \(Lv.*/, "") + "!", true); }
  }
}

// Move creatures for any accepted trade this player hasn't applied yet. Safe to run again.
export async function settleTrades(ctx) {
  const s = ctx.me; if (!s) return;
  const todo = (ctx.trades || []).filter(t => t.status === "accepted" && !t["applied_" + s.id] && !settling[t.id] && t.a && t.b && (t.a.id === s.id || t.b.id === s.id));
  for (const t of todo) {
    settling[t.id] = true;
    const iAmA = t.a.id === s.id, giveUp = iAmA ? t.give : t.get, receive = iAmA ? t.get : t.give;
    const coll = Object.assign({}, owned(s)), dex = new Set(s.dex || []);
    let sp = spares(s).slice();
    if (giveUp.spare) sp = sp.filter(x => x.id !== giveUp.spare);
    else if (coll[giveUp.fam]) {   // remember what they had discovered so the lorebook keeps it
      const gone = coll[giveUp.fam], f = family(giveUp.fam), top = f ? f.forms.findIndex(x => x === formOf(giveUp.fam, gone.lvl || 1).id) : -1;
      if (f) f.forms.forEach((x, i) => { if (i <= top) dex.add(x); });
      delete coll[giveUp.fam];
    }
    const got = { lvl: receive.lvl || 1, at: new Date().toISOString(), traded: true, ...(receive.sparkle ? { sparkle: true } : {}) };
    if (coll[receive.fam]) sp.push(Object.assign({ id: spareId(), fam: receive.fam }, got));   // already have it: it becomes a spare
    else coll[receive.fam] = got;
    try {
      await ctx.patch({ coll, dex: [...dex], spares: sp }, true);
      await changeTrade(t.id, d => Object.assign(d, { ["applied_" + s.id]: true }));
    } catch (e) {} finally { delete settling[t.id]; }
  }
}
