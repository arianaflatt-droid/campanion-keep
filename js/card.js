/* ---------- Public cards ----------
   What classmates can see of a student: the whole save EXCEPT these private fields, and name = the display name
   (first name, plus last initial when two share it) that the teacher console saves as pubName.
   Keep PRIVATE in step with cardOk() in firestore.rules. */
export const PRIVATE = ["name", "fullName", "questPass", "questDone", "questXP", "reward", "goalSubject",
  "birthdayEggs", "birthdayUsed", "bdaySeen", "ideas", "spinLog"];
export function cardOf(st) {
  const c = {};
  Object.keys(st || {}).forEach(k => { if (k !== "id" && !PRIVATE.includes(k)) c[k] = st[k]; });
  c.name = (st && st.pubName) || "";
  return c;
}
// Same content regardless of key order (Firestore doesn't keep map order).
export function sameData(a, b) { return stable(a) === stable(b); }
function stable(v) {
  if (Array.isArray(v)) return "[" + v.map(stable).join(",") + "]";
  if (v && typeof v === "object") return "{" + Object.keys(v).filter(k => v[k] !== undefined).sort().map(k => JSON.stringify(k) + ":" + stable(v[k])).join(",") + "}";
  return JSON.stringify(v === undefined ? null : v);
}
