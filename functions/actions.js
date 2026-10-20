/* ---------- Companion Keep server actions (creatures) ----------
   Each action gets ctx = { sid, st (the student's save, with id), cls (the class doc), now, ...extra reads }
   and returns { update: fields to save on the student, writes: [other docs], result: what the page needs to show }.
   They use the SAME game code as the pages (functions/game is a copy of ../js made at deploy time), so the odds,
   levels and rules can't drift apart. Anything wrong throws a CkError the page shows as a message. */
import {
  doPull, owned, spares, spareId, formOf, formIndex, family, FAMILIES, MAX_LEVEL, LEVEL_XP, bankXP, releaseXP, releaseProblem,
  isStarterFam, hasStarter, STARTERS, rollRarity, rollRareUp, pullsLeft, legendaryLeft, birthdayLeft, pickleLeft, vaultLegLeft,
  boss2EggLeft, BOSS2_LIST, candyLegLeft, snowLegLeft, gingerLegLeft, feastLegLeft, brewLegLeft, goalLeft, nextGoal, themeLeft, nextTheme,
  THEME_TYPES, WISH_FAM, PICKLE_FAM, CANDY_FAM, SNOW_FAM, GINGER_FAM, HARVEST_FAM, BREW_FAM, LIVE, staleBattle, ownedFams, teacherPlayer, TEACHER_ID, tradeOpenFor
} from "./game/collect.js";
import { creditCompanion, simulate, setSeason } from "./game/game.js";

export class CkError extends Error {}
const no = msg => { throw new CkError(msg); };
const num = v => Number(v) || 0;
const iso = () => new Date().toISOString();
const isEvent = fam => { const f = family(fam); return !!(f && f.event); };
// what the page shows for a hatch (the new collection itself arrives with the save)
const shown = res => { const r = Object.assign({}, res); delete r.coll; return r; };

/* ----- hatching ----- every kind of egg: [how many are left, how it hatches, which counter it uses up] */
const LEG = (left, fam, used) => ({ left, used, pull: (s, cls) => doPull(s, "Legendary", cls, { force: fam }), legendary: true });
const EGGS = {
  pickle: LEG(pickleLeft, PICKLE_FAM, "pickleUsed"),
  candy: LEG(candyLegLeft, CANDY_FAM, "candyboxLegUsed"),
  snow: LEG(snowLegLeft, SNOW_FAM, "snowmanLegUsed"),
  ginger: LEG(gingerLegLeft, GINGER_FAM, "gingerLegUsed"),
  harvest: LEG(feastLegLeft, HARVEST_FAM, "feastLegUsed"),
  brew: LEG(brewLegLeft, BREW_FAM, "potionLegUsed"),
  bday: LEG(birthdayLeft, WISH_FAM, "birthdayUsed"),
  vault: { left: vaultLegLeft, used: "vaultLegUsed", legendary: true, pull: (s, cls) => doPull(s, "Legendary", cls, { sparkle: true, noEvent: true }) },
  goal: { left: goalLeft, used: "goalUsed", pull: (s, cls) => { const key = nextGoal(s); return key === "rare" ? doPull(s, rollRareUp(), cls) : doPull(s, "Legendary", cls, { force: key }); } },
  theme: { left: themeLeft, used: "themeUsed", pull: (s, cls) => doPull(s, rollRarity(), cls, { types: THEME_TYPES[nextTheme(s)] || [] }) },
  leg: { left: legendaryLeft, used: "legendaryUsed", legendary: true, pull: (s, cls) => doPull(s, "Legendary", cls, { legendaryEgg: true }) }
};
function hatch(ctx, input) {
  const s = ctx.st, cls = ctx.cls, kind = String(input.kind || "normal");
  let res, update = {};
  if (kind === "boss2") {
    const B = BOSS2_LIST.find(x => x.key === input.k);
    if (!B || !boss2EggLeft(s, B)) no("You don’t have that egg.");
    res = doPull(s, "Legendary", cls, { force: B.fam }); update[B.used] = num(s[B.used]) + 1;
  } else if (EGGS[kind]) {
    const E = EGGS[kind];
    if (!E.left(s, cls)) no("You don’t have that egg.");
    if (kind === "goal" && !nextGoal(s)) no("You don’t have that egg.");
    if (kind === "theme" && !nextTheme(s)) no("You don’t have that egg.");
    res = E.pull(s, cls); update[E.used] = num(s[E.used]) + 1;
  } else if (kind === "normal") {
    if (!pullsLeft(s, cls)) no("You don’t have an egg to hatch yet.");
    const eb = s.eggBoost || {};
    let r = rollRarity();
    if (eb.rare > 0 && (r === "Common" || r === "Uncommon")) r = "Rare";          // VIP Party Mystery Box Rare egg: at least Rare
    else if (eb.lucky > 0 && r === "Common") r = "Uncommon";                       // Campfire Kitchen Lucky Egg: at least Uncommon
    res = doPull(s, r, cls, { sparkleChance: eb.sparkle > 0 ? 0.05 : 0 });
    if (eb.lucky > 0 || eb.sparkle > 0 || eb.rare > 0) {                           // a meal/party egg boost is used up on this egg
      const nb = Object.assign({}, eb); if (nb.rare > 0) nb.rare--; else if (nb.lucky > 0) nb.lucky--; if (nb.sparkle > 0) nb.sparkle--; update.eggBoost = nb;
    }
    update.pullsUsed = num(s.pullsUsed) + 1;
  } else no("That isn’t an egg.");
  update.coll = res.coll;
  // remembered for a few minutes so "keep it as a spare instead" can undo the free level
  update.lastHatch = res.dupe ? { fam: res.fam, prev: res.prev, sparkle: !!res.sparkle, at: iso() } : null;
  return { update, result: shown(res) };
}

/* ----- the collection ----- */
function starter(ctx, input) {
  const s = ctx.st, fam = String(input.fam || "");
  if (hasStarter(s)) no("You already have your starter.");
  if (!STARTERS.includes(fam)) no("Pick one of the three starters.");
  return { update: { coll: { [fam]: { lvl: 1, at: iso() } }, starter: fam }, result: { fam } };
}
function levelUp(ctx, input) {
  const s = ctx.st, f = String(input.fam || ""), e = owned(s)[f];
  if (!e) no("That creature isn’t here anymore.");
  if ((e.lvl || 1) >= MAX_LEVEL) no("That creature is already at the top level.");
  if (bankXP(s, ctx.cls) < LEVEL_XP) no("You need " + LEVEL_XP + " XP in your bank.");
  const before = formOf(f, e.lvl || 1), after = formOf(f, (e.lvl || 1) + 1);
  return { update: { coll: Object.assign({}, owned(s), { [f]: Object.assign({}, e, { lvl: (e.lvl || 1) + 1 }) }), xpSpent: num(s.xpSpent) + LEVEL_XP },
    result: { fam: f, lvl: (e.lvl || 1) + 1, before: before.id, after: after.id, beforeName: before.name, afterName: after.name } };
}
function keepSpare(ctx) {
  const s = ctx.st, h = s.lastHatch;
  if (!h || !h.fam || h.kept || Date.now() - new Date(h.at || 0).getTime() > 15 * 60e3) no("That hatch can’t be changed anymore.");
  const coll = Object.assign({}, owned(s)); if (!coll[h.fam]) no("That creature isn’t here anymore.");
  coll[h.fam] = Object.assign({}, h.prev);
  const list = spares(s).concat([Object.assign({ id: spareId(), fam: h.fam, lvl: 1, at: iso() }, h.sparkle ? { sparkle: true } : {})]);
  return { update: { coll, spares: list, lastHatch: Object.assign({}, h, { kept: true }) }, result: { fam: h.fam, id: formOf(h.fam, 1).id } };
}
function useSpare(ctx, input) {
  const s = ctx.st, sp = spares(s).find(x => x.id === input.sp);
  if (!sp) no("That spare isn’t here anymore.");
  const coll = Object.assign({}, owned(s)), had = coll[sp.fam];
  coll[sp.fam] = had ? Object.assign({}, had, { lvl: Math.min(MAX_LEVEL, (had.lvl || 1) + 1) })
    : Object.assign({ lvl: sp.lvl || 1, at: iso() }, sp.sparkle ? { sparkle: true } : {}, sp.traded ? { traded: true } : {});
  return { update: { coll, spares: spares(s).filter(x => x.id !== sp.id) }, result: { had: !!had } };
}
function release(ctx, input) {
  const s = ctx.st, key = String(input.key || "");
  const why = releaseProblem(s, key, ctx.battles || [], ctx.trades || []); if (why) no(why);
  let fam, name, update;
  if (key.startsWith("s:")) {
    const sp = spares(s).find(x => x.id === key.slice(2)); fam = sp.fam; name = formOf(fam, sp.lvl || 1).name;
    const dex = new Set(s.dex || []), top = formIndex(fam, sp.lvl || 1); family(fam).forms.forEach((id, i) => { if (i <= top) dex.add(id); });
    update = { spares: spares(s).filter(x => x.id !== sp.id), dex: [...dex] };
  } else {
    fam = key.slice(2); const e = owned(s)[fam], top = formIndex(fam, e.lvl || 1); name = e.nick || formOf(fam, e.lvl || 1).name;
    const coll = Object.assign({}, owned(s)); delete coll[fam];
    const dex = new Set(s.dex || []); family(fam).forms.forEach((id, i) => { if (i <= top) dex.add(id); });   // the lorebook keeps it
    update = { coll, dex: [...dex] };
    // releasing the starter: the current companion becomes the new starter and its companion level bar starts over
    if (isStarterFam(s, fam)) { update.starter = s.petCreature; const bar = Object.assign({}, s.compBar || {}); delete bar.starter; delete bar[s.petCreature]; update.compBar = bar; }
  }
  const xp = releaseXP(fam); update.xpReleased = num(s.xpReleased) + xp;
  return { update, result: { name, xp } };
}
function forTrade(ctx, input) {
  const s = ctx.st, k = String(input.key || "");
  if (k.startsWith("s:")) {
    if (!spares(s).some(x => x.id === k.slice(2))) no("That spare isn’t here anymore.");
    return { update: { spares: spares(s).map(x => (x.id === k.slice(2) ? Object.assign({}, x, { forTrade: !x.forTrade }) : x)) }, result: {} };
  }
  const f = k.slice(2), e = owned(s)[f]; if (!e) no("That creature isn’t here anymore.");
  const coll = Object.assign({}, owned(s)); coll[f] = Object.assign({}, e); if (e.forTrade) delete coll[f].forTrade; else coll[f].forTrade = true;
  return { update: { coll }, result: {} };
}
// The companion level bar: new goal days count toward the current companion (may level it up).
function credit(ctx) {
  setSeason(ctx.cls);
  const s = ctx.st, d = creditCompanion(s, ctx.cls, simulate(s, ctx.cls));
  if (!d) return { update: null, result: { ups: 0 } };
  const ups = d.compUps || 0; delete d.compUps;
  return { update: d, result: { ups } };
}

/* ----- trades ----- ctx.trade = the trade doc (with id); ctx.parties = { id: save } for both players (the teacher's comes from the class doc);
   ctx.battles = live battles of either player. Accepting checks everything and moves both sides' creatures at once. */
const tsnap = (st, t) => {
  if (t.spare) { const x = spares(st).find(y => y.id === t.spare); return x ? { fam: x.fam, lvl: x.lvl || 1, sparkle: !!x.sparkle, spare: x.id } : null; }
  const e = owned(st)[t.fam]; return e ? { fam: t.fam, lvl: e.lvl || 1, sparkle: !!e.sparkle } : null;
};
function tradeProblem(ctx, giver, g, taker, w) {
  if (!g) return (giver.name || "They") + " doesn’t have that creature anymore.";
  if (!w) return (taker.name || "They") + " doesn’t have that creature anymore.";
  if (isEvent(g.fam) || isEvent(w.fam)) return "Limited event Legendaries can’t be traded.";
  if ((!g.spare && (owned(giver)[g.fam] || {}).fav) || (!w.spare && (owned(taker)[w.fam] || {}).fav)) return "Favorite creatures can’t be traded. Take the ⭐ off first.";
  if ((!g.spare && ownedFams(giver).length < 2) || (!w.spare && ownedFams(taker).length < 2)) return "You can’t trade away your last creature.";
  const busy = id => (ctx.battles || []).some(b => LIVE.includes(b.status) && !staleBattle(b) && b.a && b.b && (b.a.id === id || b.b.id === id));
  if (busy(giver.id) || busy(taker.id)) return "Finish your battle first!";
  return null;
}
// One side of a trade: give away `out`, receive `inn` (same as the old settleTrades on the page).
function moveSide(st, out, inn) {
  const coll = Object.assign({}, owned(st)), dex = new Set(st.dex || []);
  let sp = spares(st).slice();
  if (out.spare) sp = sp.filter(x => x.id !== out.spare);
  else if (coll[out.fam]) {
    const gone = coll[out.fam], f = family(out.fam), top = f ? f.forms.findIndex(x => x === formOf(out.fam, gone.lvl || 1).id) : -1;
    if (f) f.forms.forEach((x, i) => { if (i <= top) dex.add(x); });
    delete coll[out.fam];
  }
  const got = Object.assign({ lvl: inn.lvl || 1, at: iso(), traded: true }, inn.sparkle ? { sparkle: true } : {});
  if (coll[inn.fam]) sp.push(Object.assign({ id: spareId(), fam: inn.fam }, got)); else coll[inn.fam] = got;
  return { coll, dex: [...dex], spares: sp };
}
function applyTrade(ctx, t, g, w) {
  const A = ctx.parties[t.a.id], B = ctx.parties[t.b.id], writes = [], tradeUp = {};
  [[t.a.id, A, g, w], [t.b.id, B, w, g]].forEach(([id, st, out, inn]) => {
    if (t["applied_" + id]) return;
    writes.push({ party: id, data: moveSide(st, out, inn) }); tradeUp["applied_" + id] = true;
  });
  return { writes, tradeUp };
}
function acceptTrade(ctx) {
  const t = ctx.trade;
  if (!t || t.status !== "offer") no("That offer isn’t waiting anymore.");
  if (t.b.id !== ctx.sid) no("Only " + t.b.name + " can accept this offer.");
  if (!tradeOpenFor(ctx.st, ctx.cls)) no("Trading is closed right now \u2014 you can accept when it opens.");
  const A = ctx.parties[t.a.id], B = ctx.parties[t.b.id]; if (!A || !B) no("That player isn’t here anymore.");
  const g = tsnap(A, t.give), w = tsnap(B, t.get), why = tradeProblem(ctx, A, g, B, w);
  if (why) return { tradeUp: { status: "declined", why }, result: { declined: why } };
  const { writes, tradeUp } = applyTrade(ctx, t, g, w);
  return { writes, tradeUp: Object.assign({ status: "accepted", give: g, get: w, at: iso() }, tradeUp), result: { give: g, get: w } };
}
// An accepted trade one side hasn't moved yet (from before trades moved to the server): finish it.
function settleTrade(ctx) {
  const t = ctx.trade;
  if (!t || t.status !== "accepted") no("That trade isn’t accepted.");
  if (!(t.ids || []).includes(ctx.sid)) no("That isn’t your trade.");
  const { writes, tradeUp } = applyTrade(ctx, t, t.give, t.get);
  return { writes, tradeUp, result: {} };
}

export const OPS = { hatch, starter, levelUp, keepSpare, useSpare, release, forTrade, credit, acceptTrade, settleTrade };
// extra reads each action needs (done inside the same transaction)
export const NEEDS = { release: ["battles", "trades"], acceptTrade: ["trade", "battles"], settleTrade: ["trade"] };
export { teacherPlayer, TEACHER_ID };
