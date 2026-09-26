import {
  DAYS, SHORT, ROSTER, GEAR, SIDEKICKS, BANNER, byId, esc, arr5, recordedDays, goalXP,
  simulate, wornItem, tier, boardDay, sidekickToday, sidekickSVG, petHTML, itemArt
} from "./game.js";
import { configured, auth, studentRef, watchClass, watchStudents, anonSignIn, onAuthStateChanged, updateDoc } from "./db.js";

let cls = null, students = [], loaded = { c: false, s: false };
let me = new URLSearchParams(location.search).get("s") || load();
let flashOk = false, picking = null, draftName = "", flashMsg = null, flashTimer = null, error = null;

function load() { try { return localStorage.getItem("ck-student"); } catch (e) { return null; } }
function save(id) { try { id ? localStorage.setItem("ck-student", id) : localStorage.removeItem("ck-student"); } catch (e) {} }
function flash(m, ok) { flashMsg = m; flashOk = !!ok; render(); clearTimeout(flashTimer); flashTimer = setTimeout(() => { flashMsg = null; render(); }, 4000); }
const app = document.getElementById("app");

if (!configured) { error = "This page isn’t connected yet. Ask your teacher."; render(); }
else {
  onAuthStateChanged(auth, u => {
    if (!u) { anonSignIn().catch(e => { error = "Couldn’t connect (" + e.code + "). Try reloading."; render(); }); return; }
    watchClass(c => { cls = c; loaded.c = true; render(); }, e => { error = "Couldn’t load your class (" + e.code + ")."; render(); });
    watchStudents(l => { students = l; loaded.s = true; render(); }, e => { error = "Couldn’t load your class (" + e.code + ")."; render(); });
  });
}

async function patch(data) {
  const s = students.find(x => x.id === me); if (s) Object.assign(s, data);
  render();
  try { await updateDoc(studentRef(me), data); } catch (e) { flash("That didn’t save — ask your teacher. (" + (e.code || e.message) + ")"); }
}

function render() {
  const active = document.activeElement, keep = active && active.id && active.matches("input") ? { id: active.id, pos: active.selectionStart } : null;
  let h = BANNER;
  if (flashMsg) h += '<div class="banner ' + (flashOk ? "info" : "bad") + '">' + esc(flashMsg) + "</div>";
  if (error) h += '<div class="card"><p class="lede">' + esc(error) + "</p></div>";
  else if (!loaded.c || !loaded.s) h += '<div class="card"><p class="lede">Loading your class…</p></div>';
  else if (!cls) h += '<div class="card"><p class="lede">Your teacher hasn’t opened the Keep yet. Check back soon!</p></div>';
  else {
    const s = students.find(x => x.id === me);
    if (me && !s) { me = null; save(null); }
    h += s ? (s.companionId ? viewMine(s) : viewChoose(s)) : viewNames();
  }
  app.innerHTML = h;
  if (keep) { const n = document.getElementById(keep.id); if (n) { n.focus(); try { n.setSelectionRange(keep.pos, keep.pos); } catch (e) {} } }
}

function viewNames() {
  return '<div class="card"><div class="card-head"><h2>Who are you?</h2>' + (cls.className ? '<span class="fact">' + esc(cls.className) + "</span>" : "") + "</div>" +
    '<div class="namegrid">' + students.map(s => '<button class="namebtn" data-me="' + s.id + '">' + esc(s.name) + "</button>").join("") + "</div></div>";
}

function notYou(s) {
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
  const c = byId(ROSTER, s.companionId), sim = simulate(s, cls), t = tier(sim), worn = wornItem(s, sim);
  const bd = boardDay(cls, students), side = sidekickToday(s, bd), rec = recordedDays(cls), goal = goalXP(cls);
  const status = arr5(s.status, ""), early = arr5(s.early, false);
  let msg;
  if (!sim.started) msg = "Hit " + goal + " XP every day to keep " + esc(s.petName || c.name) + " healthy!";
  else if (!sim.alive) msg = sim.capeReady ? "Your teacher can give you a Hero Cape to bring " + esc(s.petName || c.name) + " back!" : esc(s.petName || c.name) + " disappeared. Hit " + goal + " XP to earn a Hero Cape.";
  else if (sim.atRisk) msg = "Half health! Hit " + goal + " XP tomorrow or " + esc(s.petName || c.name) + " disappears.";
  else msg = esc(s.petName || c.name) + " is at full health. Keep it up!";

  let h = notYou(s) + '<div class="card"><div class="mypet t-' + t.key + '">' +
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
    '<p class="muted" style="margin-top:8px;">Streak: ' + sim.hitRun + " day" + (sim.hitRun === 1 ? "" : "s") + " · best this week: " + sim.bestRun + "</p></div></div>";

  h += '<div class="card"><div class="card-head"><h2>Gear</h2><span class="fact">one at a time</span></div><div class="gearpick">';
  GEAR.forEach(g => {
    const ok = sim.unlocked.includes(g.id);
    h += "<div><button class=\"eq" + (worn && worn.id === g.id ? " on" : "") + '" data-equip="' + g.id + '"' + (ok ? "" : " disabled") + ' aria-label="' + esc(g.name) + (ok ? "" : " locked") + '">' +
      itemArt(g, "gimg") + '</button><span class="lbl">' + (ok ? esc(g.name) : g.streak + "-day streak") + "</span></div>";
  });
  h += '</div><p class="lede" style="margin-top:12px;font-size:13.5px;text-align:center;">Hit ' + goal + " XP days in a row to unlock more. Tap what you’re wearing to take it off.</p></div>";

  h += '<div class="card"><div class="card-head"><h2>Lunch sidekick</h2></div>' +
    '<p class="lede" style="margin-bottom:12px;">Hit ' + goal + " XP before lunch and your sidekick joins you for the day. Who do you want?</p>" +
    '<div class="pickgrid" style="grid-template-columns:repeat(2,minmax(0,160px));justify-content:center;">' +
    Object.keys(SIDEKICKS).map(k => '<button class="pick' + ((s.sidekick || "axolotl") === k ? " on" : "") + '" data-side="' + k + '"><span style="display:flex;justify-content:center;height:70px;align-items:flex-end;">' +
      sidekickSVG(k, true).replace('class="side', 'style="animation:none;height:' + (k === "duck" ? 68 : 56) + 'px" class="side') + '</span><span class="n">' + SIDEKICKS[k] + "</span></button>").join("") + "</div></div>";

  h += '<div class="card"><div class="card-head"><h2>Rename</h2></div><div class="row"><div class="field" style="flex:1;min-width:200px;"><label for="rename">Companion name</label>' +
    '<input id="rename" type="text" maxlength="22" value="' + esc(s.petName || "") + '"></div><button class="btn ghost" data-act="rename">Save name</button></div></div>';
  return h;
}

document.addEventListener("input", ev => { if (ev.target.id === "petName") draftName = ev.target.value; });
document.addEventListener("click", async ev => {
  let el;
  if ((el = ev.target.closest("[data-me]"))) { me = el.dataset.me; save(me); picking = null; draftName = ""; render(); scrollTo({ top: 0 }); return; }
  if ((el = ev.target.closest("[data-pick]"))) { picking = el.dataset.pick; render(); return; }
  if ((el = ev.target.closest("[data-side]"))) return patch({ sidekick: el.dataset.side });
  if ((el = ev.target.closest("[data-equip]"))) {
    const s = students.find(x => x.id === me), worn = wornItem(s, simulate(s, cls));
    return patch({ equipped: worn && worn.id === el.dataset.equip ? "" : el.dataset.equip });
  }
  if (!(el = ev.target.closest("[data-act]"))) return;
  const act = el.dataset.act;
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
});
render();
