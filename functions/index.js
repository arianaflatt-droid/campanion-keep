/* ---------- Companion Keep server (Cloud Functions) ----------
   One callable function, "ck": the page sends { op, ...input }. The server finds which student this device is
   linked to (seats/{uid}), reads that student's save and the class inside one transaction, runs the action from
   actions.js (the same game code the pages use), and saves the result. Students can't pick their own results. */
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { OPS, NEEDS, CkError, teacherPlayer, TEACHER_ID } from "./actions.js";

initializeApp();
const db = getFirestore();
const C = "classes/my-class";
const withId = d => Object.assign({ id: d.id }, d.data());

export const ck = onCall({ region: "us-central1", maxInstances: 10, timeoutSeconds: 30 }, async req => {
  const uid = req.auth && req.auth.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Open Companion Keep from your personal link first.");
  const input = req.data || {}, name = String(input.op || ""), op = OPS[name];
  if (!op) throw new HttpsError("invalid-argument", "Unknown action.");
  const seat = await db.doc(C + "/seats/" + uid).get();
  if (!seat.exists || !seat.data().sid) throw new HttpsError("permission-denied", "Open Companion Keep from your personal link first.");
  const sid = seat.data().sid, need = NEEDS[name] || [];
  try {
    return await db.runTransaction(async tx => {
      const clsRef = db.doc(C), stRef = db.doc(C + "/students/" + sid);
      const [clsSnap, stSnap] = await Promise.all([tx.get(clsRef), tx.get(stRef)]);
      if (!stSnap.exists) throw new CkError("Your save isn’t here.");
      const cls = clsSnap.data() || {};
      const ctx = { sid, cls, st: withId(stSnap) };
      let tradeRef = null;
      if (need.includes("trade")) {
        tradeRef = db.doc(C + "/trades/" + String(input.tradeId || "x"));
        const t = await tx.get(tradeRef);
        if (!t.exists) throw new CkError("That trade isn’t here anymore.");
        ctx.trade = withId(t);
        ctx.parties = {};
        for (const p of [ctx.trade.a, ctx.trade.b]) {
          if (!p || !p.id) continue;
          if (p.id === sid) ctx.parties[p.id] = ctx.st;
          else if (p.id === TEACHER_ID) ctx.parties[p.id] = teacherPlayer(cls);
          else { const o = await tx.get(db.doc(C + "/students/" + p.id)); if (o.exists) ctx.parties[p.id] = withId(o); }
        }
      }
      if (need.includes("battles")) {
        const ids = ctx.trade ? ctx.trade.ids || [sid] : [sid], all = {};
        for (const id of ids) (await tx.get(db.collection(C + "/battles").where("ids", "array-contains", id))).docs.forEach(d => { all[d.id] = withId(d); });
        ctx.battles = Object.values(all);
      }
      if (need.includes("trades")) ctx.trades = (await tx.get(db.collection(C + "/trades").where("ids", "array-contains", sid))).docs.map(withId);

      const out = op(ctx, input) || {};
      if (out.update) tx.update(stRef, out.update);
      (out.writes || []).forEach(w => {
        if (w.party === TEACHER_ID) tx.update(clsRef, { "teacher.coll": w.data.coll, "teacher.spares": w.data.spares, "teacher.dex": w.data.dex });
        else if (w.party === sid) tx.update(stRef, w.data);
        else tx.update(db.doc(C + "/students/" + w.party), w.data);
      });
      if (tradeRef && out.tradeUp) tx.update(tradeRef, out.tradeUp);
      return out.result || {};
    });
  } catch (e) {
    if (e instanceof CkError) throw new HttpsError("failed-precondition", e.message);
    console.error(name, sid, e);
    throw new HttpsError("internal", "Something went wrong on the server. Try again.");
  }
});
