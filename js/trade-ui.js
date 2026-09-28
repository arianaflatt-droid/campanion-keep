// Creature trading between players (students and the teacher).
// A trade doc: { a:{id,name}, b:{id,name}, give:{fam,lvl,sparkle}, get:{fam,lvl,sparkle},
//   status: "offer" | "accepted" | "declined" | "cancelled", created, applied_<id>: true }
// "a" offers their `give` creature for b's `get` creature. When b accepts, each player's page moves
// the creatures on its own save (you give yours away and receive theirs), then marks the trade applied.
// Players can offer a creature from their collection OR a spare (a duplicate kept for trading).
// Receiving a family you already have turns it into a spare. You can't trade away your last creature
// (spares don't count), limited event creatures (Duckarune, Hexaduck) can't be traded, and not during a battle.
import { esc } from "./game.js";
import { owned, ownedFams, family, formOf, creature, RARITY_COLOR, hasStarter, spares, spareId } from "./collect.js";
import { newTradeRef, changeTrade, setDoc } from "./db.js";

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
function offerable(st) {   // everything this player could give
  const mains = ownedFams(st).filter(f => !isEvent(f)).map(f => "m:" + f);
  return (ownedFams(st).length > 1 ? mains : []).concat(spares(st).filter(x => !isEvent(x.fam)).map(x => "s:" + x.id));
}
function label(t) { const c = formOf(t.fam, t.lvl); return c ? (t.sparkle ? "✨ " : "") + c.name + " (Lv " + t.lvl + ")" : "?"; }
function pic(t) {
  const c = formOf(t.fam, t.lvl); if (!c) return "";
  const src = t.sparkle ? c.img.replace("assets/creatures/", "assets/creatures/sparkle/") : c.img;
  return '<img class="trimg" src="' + src + '" alt="" style="--rc:' + RARITY_COLOR[c.rarity] + '">';
}
function inBattle(ctx, id) { return (ctx.battles || []).some(b => ["invite", "team", "lead"].includes(b.status) && (b.a.id === id || b.b.id === id)); }

const open = t => t.status === "offer";
const mineOf = (ctx, s) => (ctx.trades || []).filter(t => t.a && t.b && (t.a.id === s.id || t.b.id === s.id));

export function tradeCard(ctx) {
  const s = ctx.me;
  if (ctx.cls && ctx.cls.tradeOff) return "";
  if (!hasStarter(s)) return "";
  const list = mineOf(ctx, s);
  const incoming = list.filter(t => open(t) && t.b.id === s.id);
  const outgoing = list.filter(t => open(t) && t.a.id === s.id);
  const recent = list.filter(t => t.status === "accepted").sort((x, y) => String(y.created).localeCompare(String(x.created))).slice(0, 3);
  let h = '<div class="card tradecard"><div class="card-head"><h2>\u{1F504} Trading</h2><span class="fact">swap creatures</span></div>';

  incoming.forEach(t => {
    h += '<div class="trrow in"><div class="trside">' + pic(t.give) + "<small><b>" + esc(t.a.name) + "</b> gives<br>" + esc(label(t.give)) + "</small></div>" +
      '<span class="trarrow">⇄</span><div class="trside">' + pic(t.get) + "<small>for your<br>" + esc(label(t.get)) + "</small></div>" +
      '<div class="trbtns"><button class="btn small" data-tr="accept" data-t="' + t.id + '">Accept</button><button class="btn ghost small" data-tr="decline" data-t="' + t.id + '">No thanks</button></div></div>';
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

  // make an offer
  const others = ctx.students.filter(x => x.id !== s.id && hasStarter(x));
  const who = others.find(x => x.id === pick.who) || null;
  const mineOk = offerable(s);
  const theirsOk = who ? offerable(who) : [];
  if (pick.mine && !mineOk.includes(pick.mine)) pick.mine = "";
  if (pick.theirs && !theirsOk.includes(pick.theirs)) pick.theirs = "";
  const opt = (v, t, on) => '<option value="' + esc(v) + '"' + (on ? " selected" : "") + ">" + esc(t) + "</option>";
  h += '<div class="trmake"><b>Make an offer</b><div class="row" style="margin-top:6px;gap:8px;">' +
    '<div class="field"><label for="trWho">Trade with</label><select id="trWho" data-trsel="who">' + opt("", "Choose a player") +
      others.map(x => opt(x.id, x.name, x.id === pick.who)).join("") + "</select></div>" +
    '<div class="field"><label for="trTheirs">You want</label><select id="trTheirs" data-trsel="theirs"' + (who ? "" : " disabled") + ">" + opt("", who ? (theirsOk.length ? "Choose their creature" : "Nothing you don’t already have") : "Choose a player first") +
      theirsOk.map(f => opt(f, label(snap(who, f)), f === pick.theirs)).join("") + "</select></div>" +
    '<div class="field"><label for="trMine">You give</label><select id="trMine" data-trsel="mine">' + opt("", mineOk.length ? "Choose your creature" : "Nothing they don’t already have") +
      mineOk.map(f => opt(f, label(snap(s, f)), f === pick.mine)).join("") + "</select></div>" +
    '<button class="btn" data-tr="offer"' + (who && pick.theirs && pick.mine ? "" : " disabled") + ">\u{1F504} Send offer</button></div>" +
    '<p class="muted small" style="margin-top:6px;">You both have to agree. You can’t trade your last creature or limited event Legendaries, and you can’t get a creature family you already have.</p></div>';
  return h + "</div>";
}

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
    if (mineOf(ctx, s).some(t => open(t) && t.a.id === s.id && t.b.id === o.id)) return ctx.flash("You already have an offer waiting for " + o.name + ".");
    await setDoc(newTradeRef(), { a: { id: s.id, name: s.name }, b: { id: o.id, name: o.name }, give: g, get: w, status: "offer", created: new Date().toISOString() });
    pick = { who: "", theirs: "", mine: "" };
    ctx.flash("Offer sent to " + o.name + "!", true); return;
  }
  const id = el.dataset.t, t = (ctx.trades || []).find(x => x.id === id); if (!t) return;
  if (a === "cancel" || a === "decline") {
    await changeTrade(id, d => (d.status === "offer" ? Object.assign(d, { status: a === "cancel" ? "cancelled" : "declined" }) : null));
    return ctx.render(true);
  }
  if (a === "accept") {
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
