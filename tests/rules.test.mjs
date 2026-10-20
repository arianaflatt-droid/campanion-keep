// Companion Keep: Firestore rules tests (made-up data only). Run with: npm test   (see README.md)
import { test, before, after, beforeEach } from "node:test";
import { readFileSync } from "node:fs";
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { doc, getDoc, getDocs, collection, setDoc, updateDoc, deleteDoc, deleteField } from "firebase/firestore";

const C = "classes/my-class";
const KEY_A = "codeforamy1234", KEY_B = "codeforben5678";
let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-companion-keep",
    firestore: { rules: readFileSync(new URL("../firestore.rules", import.meta.url), "utf8"), host: "127.0.0.1", port: 8080 }
  });
});
after(async () => { await env.cleanup(); });

const amy = () => ({ name: "Amy Test", companionId: "fox", petName: "Foxy", starter: "C-01", coll: { "C-01": { lvl: 3, at: "2026-10-01" }, "C-05": { lvl: 10, at: "2026-10-02" } }, spares: [], pullsUsed: 2, candyBonus: 0 });
const ben = () => ({ name: "Ben Test", companionId: "otter", petName: "Ott", starter: "C-02", coll: { "C-02": { lvl: 4, at: "2026-10-01" } }, spares: [] });

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async ctx => {
    const db = ctx.firestore();
    await setDoc(doc(db, C), { className: "Test class", goal: 120 });
    await setDoc(doc(db, C + "/students/amy"), amy());
    await setDoc(doc(db, C + "/students/ben"), ben());
    await setDoc(doc(db, C + "/private/keys"), { amy: KEY_A, ben: KEY_B });
    await setDoc(doc(db, C + "/seats/amyDevice"), { sid: "amy", k: KEY_A, at: "x" });
    await setDoc(doc(db, C + "/seats/benDevice"), { sid: "ben", k: KEY_B, at: "x" });
    await setDoc(doc(db, C + "/snaps/2026-10-20__amy"), { sid: "amy", stamp: "2026-10-20", json: "{}" });
  });
});

const as = uid => env.authenticatedContext(uid, { firebase: { sign_in_provider: "anonymous" } }).firestore();
const teacher = () => env.authenticatedContext("teacherUid", { email: "ariana.flatt@unbound.school", email_verified: true }).firestore();
const stu = (db, id) => doc(db, C + "/students/" + id);

/* ---------- 1. who can change a student ---------- */
test("a stranger (signed in, not linked) cannot change any student", async () => {
  await assertFails(updateDoc(stu(as("stranger"), "ben"), { petName: "hacked" }));
});
test("a linked student cannot change another student", async () => {
  await assertFails(updateDoc(stu(as("amyDevice"), "ben"), { petName: "hacked" }));
  await assertFails(updateDoc(stu(as("amyDevice"), "ben"), { coll: {} }));
});
test("a linked student can save their own game", async () => {
  await assertSucceeds(updateDoc(stu(as("amyDevice"), "amy"), { petName: "Sir Foxy" }));
});
test("a student cannot change what the teacher gives (XP, names, bonus eggs)", async () => {
  const db = as("amyDevice");
  await assertFails(updateDoc(stu(db, "amy"), { xp: [500, 500, 500, 500, 500] }));
  await assertFails(updateDoc(stu(db, "amy"), { name: "New Name" }));
  await assertFails(updateDoc(stu(db, "amy"), { bonusPulls: 99 }));
});
test("the teacher can change anyone, any amount", async () => {
  const all = {}; for (let i = 1; i <= 40; i++) all["C-" + String(i).padStart(2, "0")] = { lvl: 100 };
  await assertSucceeds(updateDoc(stu(teacher(), "ben"), { coll: all, name: "Ben T." }));
});
test("students can't create or delete students", async () => {
  await assertFails(setDoc(stu(as("amyDevice"), "newkid"), { name: "x" }));
  await assertFails(deleteDoc(stu(as("amyDevice"), "amy")));
});

/* ---------- personal links (seats) ---------- */
test("a device can link itself with the right code only", async () => {
  await assertFails(setDoc(doc(as("newDevice"), C + "/seats/newDevice"), { sid: "ben", k: "wrongcode123", at: "x" }));
  await assertFails(setDoc(doc(as("newDevice"), C + "/seats/newDevice"), { sid: "ben", k: KEY_A, at: "x" }));            // Amy's code for Ben
  await assertFails(setDoc(doc(as("newDevice"), C + "/seats/otherDevice"), { sid: "ben", k: KEY_B, at: "x" }));          // someone else's seat
  await assertFails(setDoc(doc(as("newDevice"), C + "/seats/newDevice"), { sid: "ben", k: KEY_B, at: "x", extra: 1 }));   // extra fields
  await assertFails(setDoc(doc(as("newDevice"), C + "/seats/newDevice"), { sid: "ghost", k: KEY_B, at: "x" }));          // no such student
  await assertSucceeds(setDoc(doc(as("newDevice"), C + "/seats/newDevice"), { sid: "ben", k: KEY_B, at: "x" }));
});
test("a linked device can't switch itself to another student without that student's code", async () => {
  await assertFails(setDoc(doc(as("amyDevice"), C + "/seats/amyDevice"), { sid: "ben", k: KEY_A, at: "x" }));
});
test("nobody but the teacher can read the codes, other seats or snapshots", async () => {
  await assertFails(getDoc(doc(as("amyDevice"), C + "/private/keys")));
  await assertFails(getDoc(doc(as("amyDevice"), C + "/seats/benDevice")));
  await assertSucceeds(getDoc(doc(as("amyDevice"), C + "/seats/amyDevice")));
  await assertFails(getDoc(doc(as("amyDevice"), C + "/snaps/2026-10-20__amy")));
  await assertFails(setDoc(doc(as("amyDevice"), C + "/snaps/fake__amy"), { sid: "amy", json: "{}" }));
  await assertSucceeds(getDoc(doc(teacher(), C + "/private/keys")));
  await assertSucceeds(getDoc(doc(teacher(), C + "/snaps/2026-10-20__amy")));
});

/* ---------- 6. reading ---------- */
test("a full save is private: only that student and the teacher can read it", async () => {
  await assertFails(getDoc(stu(as("stranger"), "amy")));
  await assertFails(getDoc(stu(as("benDevice"), "amy")));
  await assertFails(getDocs(collection(as("amyDevice"), C + "/students")));
  await assertSucceeds(getDoc(stu(as("amyDevice"), "amy")));
  await assertSucceeds(getDocs(collection(teacher(), C + "/students")));
  await assertSucceeds(getDoc(doc(as("stranger"), C)));   // the class settings stay readable (the page needs them)
});

/* ---------- public cards ---------- */
const card = () => { const c = Object.assign({}, amy()); delete c.name; c.name = "Amy"; c.pubName = "Amy"; return c; };
async function withPub() { await env.withSecurityRulesDisabled(async ctx => { await updateDoc(stu(ctx.firestore(), "amy"), { pubName: "Amy", questPass: { "3-m": "x" }, goalSubject: "Math", reward: { name: "Slime Day" } }); }); }
test("classmates can read cards (not strangers)", async () => {
  await env.withSecurityRulesDisabled(async ctx => { await setDoc(doc(ctx.firestore(), C + "/cards/ben"), { name: "Ben", petName: "Ott" }); });
  await assertSucceeds(getDocs(collection(as("amyDevice"), C + "/cards")));
  await assertFails(getDocs(collection(as("stranger"), C + "/cards")));
});
test("a student can write their own card when it matches their save (without the private parts)", async () => {
  await withPub();
  await assertSucceeds(setDoc(doc(as("amyDevice"), C + "/cards/amy"), card()));
});
test("fake cards are refused: other student, fake creatures, private parts, wrong name", async () => {
  await withPub();
  await assertFails(setDoc(doc(as("benDevice"), C + "/cards/amy"), card()));
  await assertFails(setDoc(doc(as("amyDevice"), C + "/cards/amy"), Object.assign(card(), { coll: { "L-12": { lvl: 100 } } })));
  await assertFails(setDoc(doc(as("amyDevice"), C + "/cards/amy"), Object.assign(card(), { questPass: { "3-m": "x" } })));
  await assertFails(setDoc(doc(as("amyDevice"), C + "/cards/amy"), Object.assign(card(), { name: "Amy Test" })));
  await assertFails(setDoc(doc(as("amyDevice"), C + "/cards/amy"), Object.assign(card(), { badges: { "fake": "t" } })));
  await assertSucceeds(setDoc(doc(teacher(), C + "/cards/amy"), card()));
});
test("a student can't change their own display name", async () => {
  await assertFails(updateDoc(stu(as("amyDevice"), "amy"), { pubName: "Queen Amy" }));
});
test("reward pictures: each student sees only their own", async () => {
  await env.withSecurityRulesDisabled(async ctx => { await setDoc(doc(ctx.firestore(), C + "/rewards/ben"), { img: "x" }); });
  await assertFails(getDoc(doc(as("amyDevice"), C + "/rewards/ben")));
  await assertSucceeds(getDoc(doc(as("benDevice"), C + "/rewards/ben")));
});

/* ---------- 2. creatures ---------- */
const coll = extra => Object.assign(amy().coll, extra);
// what the game sends: the new creatures plus collTouch = the families it added or changed
const withTouch = (c, base = amy().coll) => ({ coll: c, collTouch: Object.keys(c).filter(f => JSON.stringify(c[f]) !== JSON.stringify(base[f])) });
test("normal creature saves work: hatch new (Lv 1), hatch a copy (+1), level up, train (+5), release, favorite", async () => {
  const db = as("amyDevice");
  await assertSucceeds(updateDoc(stu(db, "amy"), Object.assign(withTouch(coll({ "U-07": { lvl: 1, at: "t" } })), { pullsUsed: 3 })));
  await assertSucceeds(updateDoc(stu(db, "amy"), withTouch(coll({ "U-07": { lvl: 2, at: "t" } }), coll({ "U-07": { lvl: 1, at: "t" } }))));
  await assertSucceeds(updateDoc(stu(db, "amy"), withTouch(coll({ "U-07": { lvl: 7, at: "t" } }), coll({ "U-07": { lvl: 2, at: "t" } }))));
  await assertSucceeds(updateDoc(stu(db, "amy"), withTouch(coll({ "U-07": { lvl: 7, at: "t", fav: true, nick: "Bub" } }), coll({ "U-07": { lvl: 7, at: "t" } }))));
  await assertSucceeds(updateDoc(stu(db, "amy"), { coll: { "C-01": amy().coll["C-01"] } }));   // released C-05 and U-07
  await assertSucceeds(updateDoc(stu(db, "amy"), { petName: "Still fine" }));                   // a later save that doesn't touch creatures
});
test("mass unlock is refused", async () => {
  const all = {}; for (let i = 1; i <= 207; i++) all["C-" + i] = { lvl: 100 };
  await assertFails(updateDoc(stu(as("amyDevice"), "amy"), { coll: all }));
  await assertFails(updateDoc(stu(as("amyDevice"), "amy"), withTouch(all)));
});
test("creature forgery is refused: Lv 100 new creature, +20 levels, Lv 101, fake ids, 2 new at once", async () => {
  const db = as("amyDevice");
  await assertFails(updateDoc(stu(db, "amy"), withTouch(coll({ "L-12": { lvl: 100 } }))));
  await assertFails(updateDoc(stu(db, "amy"), withTouch(coll({ "C-05": { lvl: 30 } }))));
  await assertFails(updateDoc(stu(db, "amy"), withTouch(coll({ "C-05": { lvl: 101 } }))));
  await assertFails(updateDoc(stu(db, "amy"), withTouch(coll({ "X-99": { lvl: 1 } }))));
  await assertFails(updateDoc(stu(db, "amy"), withTouch(coll({ "C-40": { lvl: 1 }, "C-41": { lvl: 1 } }))));
  await assertFails(updateDoc(stu(db, "amy"), { coll: "lots" }));
  // lying about which creatures changed doesn't help
  await assertFails(updateDoc(stu(db, "amy"), { coll: coll({ "L-12": { lvl: 100 }, "C-05": { lvl: 11 } }), collTouch: ["C-05"] }));
  await assertFails(updateDoc(stu(db, "amy"), { coll: coll({ "L-12": { lvl: 100 } }) }));
});
test("a creature arriving by trade keeps its level", async () => {
  await assertSucceeds(updateDoc(stu(as("amyDevice"), "amy"), withTouch(coll({ "R-03": { lvl: 25, traded: true, at: "t" } }))));
});

/* ---------- 4. trades ---------- */
const trade = (db, id) => doc(db, C + "/trades/" + id);
const offer = () => ({ a: { id: "amy", name: "Amy" }, b: { id: "ben", name: "Ben" }, ids: ["amy", "ben"], give: { fam: "C-05", lvl: 10 }, get: { fam: "C-02", lvl: 4 }, status: "offer", created: "t" });
async function seedTrade(data) { await env.withSecurityRulesDisabled(async ctx => { await setDoc(trade(ctx.firestore(), "t1"), data); }); }
test("only player a can make an offer, and only for themselves", async () => {
  await assertSucceeds(setDoc(trade(as("amyDevice"), "t1"), offer()));
  await assertFails(setDoc(trade(as("benDevice"), "t2"), offer()));                                      // Ben pretending to be Amy
  await assertFails(setDoc(trade(as("stranger"), "t3"), offer()));
  await assertFails(setDoc(trade(as("amyDevice"), "t4"), Object.assign(offer(), { status: "accepted" })));  // pre-accepted
});
test("only player b can accept; a can't accept for them; strangers can't touch it", async () => {
  await seedTrade(offer());
  const acc = Object.assign(offer(), { status: "accepted", at: "t" });
  await assertFails(setDoc(trade(as("amyDevice"), "t1"), acc));
  await assertFails(setDoc(trade(as("stranger"), "t1"), acc));
  await assertSucceeds(setDoc(trade(as("benDevice"), "t1"), acc));
});
test("accepting can't swap in different creatures or players", async () => {
  await seedTrade(offer());
  await assertFails(setDoc(trade(as("benDevice"), "t1"), Object.assign(offer(), { status: "accepted", give: { fam: "L-12", lvl: 100 } })));
  await assertFails(setDoc(trade(as("benDevice"), "t1"), Object.assign(offer(), { status: "accepted", a: { id: "zed", name: "Z" } })));
});
test("a cancels, b declines (not the other way round)", async () => {
  await seedTrade(offer());
  await assertFails(setDoc(trade(as("benDevice"), "t1"), Object.assign(offer(), { status: "cancelled" })));
  await assertFails(setDoc(trade(as("amyDevice"), "t1"), Object.assign(offer(), { status: "declined" })));
  await assertSucceeds(setDoc(trade(as("benDevice"), "t1"), Object.assign(offer(), { status: "declined", why: "no" })));
  await seedTrade(offer());
  await assertSucceeds(setDoc(trade(as("amyDevice"), "t1"), Object.assign(offer(), { status: "cancelled" })));
});
test("after accepting, each player can only mark their own side done, once", async () => {
  const acc = Object.assign(offer(), { status: "accepted", at: "t" });
  await seedTrade(acc);
  await assertFails(setDoc(trade(as("amyDevice"), "t1"), Object.assign({}, acc, { applied_ben: true })));   // Amy marking Ben's side
  await assertSucceeds(setDoc(trade(as("amyDevice"), "t1"), Object.assign({}, acc, { applied_amy: true })));
  await assertFails(setDoc(trade(as("amyDevice"), "t1"), acc));                                              // un-marking it
  await assertFails(setDoc(trade(as("amyDevice"), "t1"), Object.assign({}, acc, { applied_amy: true, status: "offer" })));
});

/* ---------- battles ---------- */
const battle = (db, id) => doc(db, C + "/battles/" + id);
const invite = () => ({ a: { id: "amy", name: "Amy" }, b: { id: "ben", name: "Ben" }, ids: ["amy", "ben"], status: "invite", created: "t", log: [] });
test("only the players can start or change a battle", async () => {
  await assertSucceeds(setDoc(battle(as("amyDevice"), "b1"), invite()));
  await assertFails(setDoc(battle(as("benDevice"), "b2"), invite()));      // Ben starting one as Amy
  await assertFails(setDoc(battle(as("stranger"), "b3"), invite()));
  await assertSucceeds(updateDoc(battle(as("benDevice"), "b1"), { status: "team" }));
  await assertFails(updateDoc(battle(as("stranger"), "b1"), { status: "fight" }));
  await assertFails(updateDoc(battle(as("benDevice"), "b1"), { ids: ["ben", "zed"] }));
});

/* ---------- live XP feeder ---------- */
test("the feeder can write live/xp only with the class key", async () => {
  await env.withSecurityRulesDisabled(async ctx => { await setDoc(doc(ctx.firestore(), C + "/private/feeder"), { key: "feedkey" }); });
  await assertFails(setDoc(doc(as("feeder"), C + "/live/xp"), { json: "{}", key: "nope" }));
  await assertSucceeds(setDoc(doc(as("feeder"), C + "/live/xp"), { json: "{}", key: "feedkey" }));
  await assertFails(getDoc(doc(as("feeder"), C + "/live/xp")));
});

/* ---------- 2b. reward counters ---------- */
test("normal rewards save: +1 legendary egg, +3 eggs (vault), +500 XP (golden present), +75 candy, +1 spin, hatch counters up", async () => {
  const db = as("amyDevice");
  await assertSucceeds(updateDoc(stu(db, "amy"), { legendaryPulls: 1 }));
  await assertSucceeds(updateDoc(stu(db, "amy"), { doorEggs: 3, doorXP: 500, vaultLegEggs: 1 }));
  await assertSucceeds(updateDoc(stu(db, "amy"), { candyBonus: 75, spins: 1 }));
  await assertSucceeds(updateDoc(stu(db, "amy"), { pullsUsed: 3, xpSpent: 120, themeEggs: ["haunt"] }));
  await assertSucceeds(updateDoc(stu(db, "amy"), { compStart: "2026-10-01", compThru: "" }));
  await assertSucceeds(updateDoc(stu(db, "amy"), { compThru: "2026-10-19" }));
});
test("giving yourself piles of rewards is refused", async () => {
  const db = as("amyDevice");
  await assertFails(updateDoc(stu(db, "amy"), { legendaryPulls: 50 }));
  await assertFails(updateDoc(stu(db, "amy"), { doorEggs: 4 }));
  await assertFails(updateDoc(stu(db, "amy"), { doorXP: 5000 }));
  await assertFails(updateDoc(stu(db, "amy"), { candyBonus: 5000 }));
  await assertFails(updateDoc(stu(db, "amy"), { spins: 10 }));
  await assertFails(updateDoc(stu(db, "amy"), { themeEggs: ["haunt", "haunt"] }));
  await assertFails(updateDoc(stu(db, "amy"), { candyBonus: "lots" }));
});
test("un-using eggs or un-spending XP/candy is refused", async () => {
  const db = as("amyDevice");
  await assertFails(updateDoc(stu(db, "amy"), { pullsUsed: 0 }));        // was 2
  await assertSucceeds(updateDoc(stu(db, "amy"), { xpSpent: 240, candySpent: 60 }));
  await assertFails(updateDoc(stu(db, "amy"), { xpSpent: 0 }));
  await assertFails(updateDoc(stu(db, "amy"), { candySpent: 0 }));
});
test("the companion level bar can't be rewound", async () => {
  const db = as("amyDevice");
  await assertSucceeds(updateDoc(stu(db, "amy"), { compStart: "2026-10-01", compThru: "2026-10-15" }));
  await assertFails(updateDoc(stu(db, "amy"), { compThru: "" }));
  await assertFails(updateDoc(stu(db, "amy"), { compStart: "2020-01-01" }));
});
test("an odd old value in a save doesn't block other saves", async () => {
  await env.withSecurityRulesDisabled(async ctx => { await updateDoc(stu(ctx.firestore(), "amy"), { candyBonus: "oops", doorEggs: null }); });
  await assertSucceeds(updateDoc(stu(as("amyDevice"), "amy"), { petName: "Still saves" }));
});
test("several rewards in one day still save, one at a time (3 quest tests passed, 3 spins bought and spun)", async () => {
  const db = as("amyDevice");
  for (let i = 1; i <= 3; i++) await assertSucceeds(updateDoc(stu(db, "amy"), { legendaryPulls: i, questXP: i * 250 }));
  for (let i = 1; i <= 3; i++) {
    await assertSucceeds(updateDoc(stu(db, "amy"), { spins: 1, candySpent: i * 60 }));               // buy a spin
    await assertSucceeds(updateDoc(stu(db, "amy"), { spins: 0, candyBonus: i * 75 }));               // spin it: +75 candy
  }
});
