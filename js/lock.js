/* ---------- 🔒 Lock a student's Keep (Nov 1) ----------
   Ms. Ariana picks students on the console (Students tab) and types a message. Their student page shows ONLY that message,
   in giant letters, until she unlocks them. Saved on the class doc (teacher-only): cls.locks = { studentId: { msg, at } }.
   No extra reads: every student page already listens to the class doc. */
import { esc } from "./game.js?v=20261103b";

export const DEFAULT_MSG = "Please come see Ms. Ariana \u{1F49B}";
const picked = new Set();
let draft = DEFAULT_MSG;
export const lockOf = (cls, sid) => (sid && cls && cls.locks && cls.locks[sid]) || null;

// keep what she types (the console redraws often)
document.addEventListener("input", ev => { if (ev.target && ev.target.id === "lockMsg") draft = ev.target.value; });

/* ---------- student page: the giant message ---------- */
export function lockScreen(lk, name) {
  return '<div class="lockscreen" role="alert"><div class="lockbox"><div class="lockicon">\u{1F512}</div>' +
    '<h1 class="lockmsg">' + esc(lk.msg || DEFAULT_MSG).replace(/\n/g, "<br>") + "</h1>" +
    (name ? '<p class="lockname">' + esc(name) + "</p>" : "") + "</div></div>";
}

/* ---------- console card ---------- */
export function lockCard(students, cls) {
  const kids = students.filter(s => !s.isTeacher).slice().sort((a, b) => String(a.name).localeCompare(String(b.name)));
  const locks = (cls && cls.locks) || {}, lockedIds = Object.keys(locks).filter(id => kids.some(s => s.id === id));
  let h = '<div class="card lockcard"><div class="card-head"><h2>\u{1F512} Lock a student’s Keep</h2><span class="fact">' + (lockedIds.length ? lockedIds.length + " locked" : "none locked") + "</span></div>" +
    '<p class="lede" style="font-size:13.5px;">Pick students and type a message. Their page shows only your message, in giant letters, until you unlock them.</p>';
  if (lockedIds.length) h += '<div class="locklist">' + lockedIds.map(id => { const s = kids.find(x => x.id === id), lk = locks[id];
    return '<div class="lockrow"><b>\u{1F512} ' + esc(s.name) + '</b><span class="muted small">“' + esc(lk.msg || DEFAULT_MSG) + '”</span><button class="btn ghost small" data-lock="unlock" data-id="' + esc(id) + '">Unlock</button></div>'; }).join("") +
    (lockedIds.length > 1 ? '<button class="btn ghost small" data-lock="unlockAll" style="margin-top:6px;">Unlock everyone</button>' : "") + "</div>";
  h += '<div class="field" style="margin-top:10px;"><label for="lockMsg">Message on their screen</label><textarea id="lockMsg" rows="2" maxlength="140" style="width:100%;">' + esc(draft) + "</textarea></div>" +
    '<div class="row" style="gap:6px;flex-wrap:wrap;margin:6px 0;"><span class="muted small">Quick picks:</span>' +
    ["Please come see Ms. Ariana \u{1F49B}", "Eyes on your work! \u{1F4DA}", "Finish your core subjects first ✏️", "Take a break and reset \u{1F33F}"].map(m => '<button class="btn ghost small" data-lock="msg" data-m="' + esc(m) + '">' + esc(m) + "</button>").join("") + "</div>" +
    '<div class="lockpicks">' + kids.map(s => '<label class="lockpick' + (picked.has(s.id) ? " on" : "") + (locks[s.id] ? " is" : "") + '"><input type="checkbox" data-lock="pick" data-id="' + esc(s.id) + '"' + (picked.has(s.id) ? " checked" : "") + "> " + esc(s.name) + (locks[s.id] ? " \u{1F512}" : "") + "</label>").join("") + "</div>" +
    '<div class="row" style="gap:8px;margin-top:8px;"><button class="btn" data-lock="lock"' + (picked.size ? "" : " disabled") + ">\u{1F512} Lock " + (picked.size || "") + " student" + (picked.size === 1 ? "" : "s") + "</button>" +
    (picked.size ? '<button class="btn ghost small" data-lock="clear">Clear picks</button>' : "") + "</div></div>";
  return h;
}

// c = { cls, update(fields), flash, render }
export async function lockClick(el, c) {
  const a = el.dataset.lock, locks = Object.assign({}, (c.cls && c.cls.locks) || {});
  if (a === "pick") { const id = el.dataset.id; if (el.checked) picked.add(id); else picked.delete(id); return c.render(); }
  if (a === "clear") { picked.clear(); return c.render(); }
  if (a === "msg") { draft = el.dataset.m; return c.render(); }
  if (a === "lock") {
    const msg = String(draft || "").trim() || DEFAULT_MSG, n = picked.size; if (!n) return;
    picked.forEach(id => { locks[id] = { msg, at: new Date().toISOString() }; });
    await c.update({ locks }); picked.clear(); c.flash("\u{1F512} Locked " + n + " student" + (n === 1 ? "" : "s") + ".", true); return c.render();
  }
  if (a === "unlock") { delete locks[el.dataset.id]; await c.update({ locks }); c.flash("\u{1F513} Unlocked.", true); return c.render(); }
  if (a === "unlockAll") { await c.update({ locks: {} }); c.flash("\u{1F513} Everyone is unlocked.", true); return c.render(); }
}
