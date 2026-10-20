// Tests for the server actions (no Firebase needed): node --test actions.test.mjs  (run "npm run copy-game" first)
import { test } from "node:test";
import assert from "node:assert/strict";
import { OPS, CkError } from "./actions.js";

const cls = () => ({ collectorStart: "2026-01-01", weekStart: "2026-10-19", tradeOverride: "open" });
const amy = extra => Object.assign({ id: "amy", name: "Amy", starter: "C-01", coll: { "C-01": { lvl: 3, at: "t" }, "C-05": { lvl: 10, at: "t" } }, spares: [], pullsUsed: 0 }, extra || {});
const run = (op, st, input, more) => OPS[op](Object.assign({ sid: st.id, st, cls: cls() }, more || {}), input || {});
const refuses = (fn, re) => assert.throws(fn, e => e instanceof CkError && (!re || re.test(e.message)));

test("hatching needs an egg", () => {
  refuses(() => run("hatch", amy(), { kind: "normal" }), /egg/);
  refuses(() => run("hatch", amy(), { kind: "leg" }), /egg/);
  refuses(() => run("hatch", amy(), { kind: "nope" }));
});
test("a normal egg hatches one creature and uses one egg", () => {
  const out = run("hatch", amy({ bonusPulls: 2 }), { kind: "normal" });
  assert.equal(out.update.pullsUsed, 1);
  const before = Object.keys(amy().coll).length, after = Object.keys(out.update.coll).length;
  assert.ok(after === before + 1 || (out.result.dupe && after === before));
  assert.ok(out.result.fam && out.result.id && !("coll" in out.result));
});
test("egg boosts are used up", () => {
  const out = run("hatch", amy({ bonusPulls: 1, eggBoost: { rare: 1 } }), { kind: "normal" });
  assert.ok(["Rare", "Super Rare", "Legendary"].includes(out.result.rarity));
  assert.equal(out.update.eggBoost.rare, 0);
});
test("special eggs: legendary, birthday, vault sparkle, goal, theme, boss 2nd win", () => {
  assert.equal(run("hatch", amy({ legendaryPulls: 1 }), { kind: "leg" }).update.legendaryUsed, 1);
  const b = run("hatch", amy({ birthdayEggs: 1 }), { kind: "bday" }); assert.equal(b.update.birthdayUsed, 1); assert.equal(b.result.fam, "L-28");
  const v = run("hatch", amy({ vaultLegEggs: 1 }), { kind: "vault" }); assert.equal(v.update.vaultLegUsed, 1); assert.equal(v.result.sparkle, true);
  const g = run("hatch", amy({ goalEggs: ["rare"] }), { kind: "goal" }); assert.equal(g.update.goalUsed, 1); assert.ok(["Rare", "Super Rare"].includes(g.result.rarity));
  assert.equal(run("hatch", amy({ themeEggs: ["haunt"] }), { kind: "theme" }).update.themeUsed, 1);
  const h = run("hatch", amy({ ghostEggs: 1 }), { kind: "boss2", k: "haunt" }); assert.equal(h.update.ghostEggsUsed, 1); assert.equal(h.result.fam, "L-41");
  refuses(() => run("hatch", amy({ ghostEggs: 1, ghostEggsUsed: 1 }), { kind: "boss2", k: "haunt" }));
});
test("a duplicate can be kept as a spare instead (once)", () => {
  const st = amy({ birthdayEggs: 1, coll: { "C-01": { lvl: 3 }, "L-28": { lvl: 4 } } });
  const h = run("hatch", st, { kind: "bday" });
  assert.equal(h.result.dupe, true); assert.equal(h.update.coll["L-28"].lvl, 5);
  const st2 = Object.assign({}, st, h.update);
  const k = run("keepSpare", st2);
  assert.equal(k.update.coll["L-28"].lvl, 4); assert.equal(k.update.spares.length, 1);
  refuses(() => run("keepSpare", Object.assign({}, st2, k.update)));
});
test("starter: only once, only a real starter", () => {
  const fresh = { id: "new", coll: {} };
  assert.deepEqual(Object.keys(run("starter", fresh, { fam: "C-02" }).update.coll), ["C-02"]);
  refuses(() => run("starter", fresh, { fam: "L-12" }));
  refuses(() => run("starter", amy(), { fam: "C-02" }));
});
test("level up costs 120 banked XP", () => {
  refuses(() => run("levelUp", amy(), { fam: "C-05" }), /XP/);
  const out = run("levelUp", amy({ bonusXP: 130 }), { fam: "C-05" });
  assert.equal(out.update.coll["C-05"].lvl, 11); assert.equal(out.update.xpSpent, 120);
  refuses(() => run("levelUp", amy({ bonusXP: 500 }), { fam: "L-12" }));
});
test("spares: use one, mark for trade", () => {
  const st = amy({ spares: [{ id: "sp1", fam: "R-03", lvl: 7, traded: true }] });
  const u = run("useSpare", st, { sp: "sp1" });
  assert.equal(u.update.coll["R-03"].lvl, 7); assert.equal(u.update.coll["R-03"].traded, true); assert.equal(u.update.spares.length, 0);
  assert.equal(run("forTrade", st, { key: "s:sp1" }).update.spares[0].forTrade, true);
  assert.equal(run("forTrade", amy(), { key: "m:C-05" }).update.coll["C-05"].forTrade, true);
  refuses(() => run("useSpare", st, { sp: "nope" }));
});
test("release gives XP back, with the same limits as before", () => {
  const out = run("release", amy(), { key: "m:C-05" });
  assert.ok(!out.update.coll["C-05"]); assert.ok(out.update.xpReleased > 0); assert.ok(out.update.dex.length > 0);
  refuses(() => run("release", amy({ coll: { "C-01": { lvl: 3 } } }), { key: "m:C-01" }), /last/);
  refuses(() => run("release", amy(), { key: "m:C-05" }, { trades: [{ status: "offer", ids: ["amy", "ben"], a: { id: "amy" }, b: { id: "ben" }, give: { fam: "C-05" }, get: { fam: "C-02" } }] }), /trade/);
});

/* trades */
const ben = () => ({ id: "ben", name: "Ben", starter: "C-02", coll: { "C-02": { lvl: 4 }, "U-07": { lvl: 6 } }, spares: [] });
const offer = () => ({ id: "t1", a: { id: "amy", name: "Amy" }, b: { id: "ben", name: "Ben" }, ids: ["amy", "ben"], give: { fam: "C-05", lvl: 10 }, get: { fam: "U-07", lvl: 6 }, status: "offer" });
test("accepting a trade moves both sides at once, with their real levels", () => {
  const A = amy(), B = ben();
  const out = OPS.acceptTrade({ sid: "ben", st: B, cls: cls(), trade: Object.assign(offer(), { give: { fam: "C-05", lvl: 99 } }), parties: { amy: A, ben: B }, battles: [] }, {});
  assert.equal(out.tradeUp.status, "accepted"); assert.equal(out.tradeUp.applied_amy, true); assert.equal(out.tradeUp.applied_ben, true);
  const wa = out.writes.find(w => w.party === "amy").data, wb = out.writes.find(w => w.party === "ben").data;
  assert.ok(!wa.coll["C-05"]); assert.equal(wa.coll["U-07"].lvl, 6); assert.equal(wa.coll["U-07"].traded, true);
  assert.ok(!wb.coll["U-07"]); assert.equal(wb.coll["C-05"].lvl, 10);   // the real level, not the 99 in the offer
});
test("only b can accept, and problems decline the offer", () => {
  refuses(() => OPS.acceptTrade({ sid: "amy", st: amy(), cls: cls(), trade: offer(), parties: { amy: amy(), ben: ben() }, battles: [] }, {}), /Only/);
  const gone = OPS.acceptTrade({ sid: "ben", st: ben(), cls: cls(), trade: offer(), parties: { amy: amy({ coll: { "C-01": { lvl: 3 } } }), ben: ben() }, battles: [] }, {});
  assert.equal(gone.tradeUp.status, "declined");
  const fav = OPS.acceptTrade({ sid: "ben", st: ben(), cls: cls(), trade: offer(), parties: { amy: amy({ coll: { "C-01": { lvl: 3 }, "C-05": { lvl: 10, fav: true } } }), ben: ben() }, battles: [] }, {});
  assert.equal(fav.tradeUp.status, "declined");
});
test("settling an old accepted trade only moves the side that hasn't moved", () => {
  const t = Object.assign(offer(), { status: "accepted", applied_amy: true });
  const out = OPS.settleTrade({ sid: "ben", st: ben(), cls: cls(), trade: t, parties: { amy: amy(), ben: ben() } }, {});
  assert.deepEqual(out.writes.map(w => w.party), ["ben"]); assert.equal(out.tradeUp.applied_ben, true);
});
test("companion credit runs (and can be empty)", () => {
  const out = run("credit", amy({ compStart: "2026-10-01", compThru: "2026-10-30" }));
  assert.ok(out.result && typeof out.result.ups === "number");
});
