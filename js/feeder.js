/* ---------- 📡 Companion Keep feeder (a Chrome bookmark that runs on Timeback) ----------
   One click on Learning Metrics → My Class (Nov 11: it runs right there now, as a card on top; it used to move to robots.txt)
   (a quiet page, so Timeback's app can't reload over it). Click 2, on that page: starts the feeder.
   Every 5 minutes on school days (6:00 AM to 4:30 PM Arizona), every 30 minutes otherwise, it:
     · reads each student's XP per subject for the last 8 days (getActivityMetrics, Arizona days), read-only
     · reads each student's name once (fetchUser) and keeps only first name + last initial ("Jamie R.")
     · writes ONE small doc to Companion Keep: classes/{class}/live/xp = { json, at, key }, only when a number changed
       (plus a heartbeat every 30 minutes during school hours)
     · 🎯 (Nov 10) about once an hour, reads each student's courses (getUserEnrollmentsUnfiltered) and, for each subject, the XP left
       in the course they're working in now (Lalilo is skipped: the class doesn't use it). Sent as tx = { name: { subject: [left, total, course, date] } }.
       The console keeps only each student's Goal Subject (testXp).
   It signs in to Companion Keep anonymously; the rules only let it write that one doc, and only with the class's feeder key.
   The teacher console turns live/xp into morning, lunch and end-of-day numbers (teacher.js, autoLive). */
function feederMain(CFG) {
  const W = window;
  if (W.__ckFeeder) { W.__ckFeeder.show(); return; }
  const LS = {
    get: k => { try { return JSON.parse(localStorage.getItem("ckf_" + k)); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem("ckf_" + k, JSON.stringify(v)); } catch (e) {} }
  };
  const ids0 = (new URLSearchParams(location.search).get("studentIds") || "").split(",").map(s => s.trim()).filter(Boolean);
  if (ids0.length) LS.set("ids", ids0);
  const idsFrom = ids0.length ? "this page" : "saved earlier";   // Nov 11 check: where the class list came from
  // Nov 11: Timeback now turns away calls from the quiet robots.txt page (a "serialized redirect"), so the feeder runs
  // right on the Learning Metrics page, as a card on top of it (ONE click). The robots.txt page still works if Timeback allows it.
  const onRobots = /robots\.txt$/.test(location.pathname);
  if (!onRobots && !(LS.get("ids") || []).length) { alert("Companion Keep feeder: open Learning Metrics, choose My Class, then click this bookmark."); return; }
  const ids = LS.get("ids") || [];
  const FN = {
    metrics: "src_features_learning-metrics_actions_getActivityMetrics_ts--getActivityMetrics_createServerFn_handler",
    user: "src_features_learning-metrics_components_fast-student-search_actions_client_ts--fetchUser_createServerFn_handler",
    enroll: "src_features_learning-metrics_actions_getUserEnrollmentsUnfiltered_ts--getUserEnrollmentsUnfiltered_createServerFn_handler"
  };
  const SKIP_COURSE = /lalilo/i;   // an old course still stuck on some students (Ms. Ariana, Nov 10)
  const ENROLL_EVERY = 60 * 60000;
  const HEAD = ["Student", "Total XP", "Goal", "Math", "FastMath", "Reading", "Writing", "Language", "Vocabulary", "Science", "Social Studies"];
  const SUBKEY = HEAD.slice(3).map(h => h.toLowerCase().replace(/\s+/g, ""));
  const S = { state: "Starting…", n: ids.length, names: 0, goals: 0, crsErr: "", lastCheck: 0, lastSend: 0, problem: "none", busy: false, next: 0, today: 0 };
  const cache = LS.get("cache") || {};      // id -> { days: { date: { subj: xp } } }
  const names = LS.get("names") || {};      // id -> "Jamie R."

  // ----- page -----
  document.title = "\u{1F4E1} Companion Keep feeder";
  const card = document.createElement("div");
  if (onRobots) {
    document.documentElement.innerHTML = "<head><meta charset='utf-8'><title>\u{1F4E1} Companion Keep feeder</title></head><body></body>";
    card.style.cssText = "max-width:460px;margin:40px auto;background:#1f1b2e;color:#fff;font:15px/1.5 system-ui,sans-serif;padding:20px 24px;border-radius:16px;box-shadow:0 10px 40px rgba(0,0,0,.3)";
    document.body.style.cssText = "margin:0;background:#efeaf9;min-height:100vh";
  } else card.style.cssText = "position:fixed;right:16px;bottom:16px;z-index:2147483647;width:420px;max-width:calc(100vw - 32px);background:#1f1b2e;color:#fff;font:14px/1.45 system-ui,sans-serif;padding:16px 20px;border-radius:16px;box-shadow:0 10px 40px rgba(0,0,0,.35)";
  document.body.appendChild(card);
  // if Timeback's page redraws itself, put the card back
  if (!onRobots) setInterval(() => { if (!document.body.contains(card)) document.body.appendChild(card); document.title = "\u{1F4E1} Companion Keep feeder"; }, 3000);
  const esc = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const ago = t => !t ? "not yet" : Math.round((Date.now() - t) / 60000) < 1 ? "just now" : Math.round((Date.now() - t) / 60000) + " min ago";
  const draw = () => {
    const ok = S.problem === "none";
    card.innerHTML = "<div style='font-size:20px;font-weight:800;margin-bottom:6px'>\u{1F4E1} " + S.state + "</div>" +
      "<div>Students: <b>" + S.n + "</b> (" + S.names + " names)</div>" +
      "<div>🎯 XP left in courses: <b>" + S.goals + "</b> students" + (S.crsErr ? " <span style='color:#ffd27a'>(" + S.crsErr + ")</span>" : "") + "</div>" +
      "<div>Today’s XP so far: <b>" + S.today + "</b> total for the class</div>" +
      "<div>Last check of Timeback: <b>" + ago(S.lastCheck) + "</b></div>" +
      "<div>Last sent to Companion Keep: <b>" + ago(S.lastSend) + "</b></div>" +
      "<div>Next check: <b>" + (S.busy ? "checking now…" : S.next ? Math.max(0, Math.round((S.next - Date.now()) / 60000)) + " min" : "—") + "</b></div>" +
      "<div style='margin-top:8px;color:" + (ok ? "#b8f5c4" : "#ffd27a") + "'>Last problem: " + S.problem + "</div>" +
      "<div style='margin-top:12px;font-size:13px;color:#bdb6d6'>Feeder version: Nov 11e (new Timeback calls) \u00B7 class list from " + idsFrom + " \u00B7 page: " + esc(location.pathname + (location.search ? "?" + location.search.slice(1, 30) + "\u2026" : "")) + "."+" Leave this tab open all day (don\u2019t click to other Timeback pages in it). It only reads from Timeback. If the laptop sleeps, click the feeder bookmark again.</div>";
  };
  setInterval(draw, 1000); draw();
  try { navigator.locks && navigator.locks.request("ck-feeder", () => new Promise(() => {})); } catch (e) {}   // keeps Chrome from freezing this tab
  W.__ckFeeder = { show: () => { card.style.display = "block"; } };
  if (!ids.length) { S.state = "No class list"; S.problem = "Open Learning Metrics → My Class, then click the bookmark."; return; }

  // ----- Timeback (read-only) -----
  /* Nov 11: on Nov 10 Timeback moved to a newer TanStack Start. Server functions are now called with
     POST /_serverFn/<name> (nothing after it), header x-tsr-serverfn: true, and a "seroval"-packed body
     { t: <packed { data }>, f: 127, m: [] }; the answer comes back packed the same way. Some functions are GET-only
     (?payload=<packed body>). Adapted from a fellow Novatio teacher's working bookmark (Kyle Coleman). */
  const SV = (() => {
    const B = String.fromCharCode(92), L = String.fromCharCode(0x2028), P = String.fromCharCode(0x2029);
    const OUT = {}, IN = { n: "\n", r: "\r", b: "\b", t: "\t", f: "\f", x3C: "<", u2028: L, u2029: P };
    OUT[B] = B + B; OUT['"'] = B + '"'; OUT["\n"] = B + "n"; OUT["\r"] = B + "r"; OUT["\b"] = B + "b"; OUT["\t"] = B + "t"; OUT["\f"] = B + "f"; OUT["<"] = B + "x3C";
    OUT[L] = B + "u2028"; OUT[P] = B + "u2029"; IN[B] = B; IN['"'] = '"';
    const OUT_RE = new RegExp("[" + B + B + '"' + B + "n" + B + "r" + B + "b" + B + "t" + B + "f<" + B + "u2028" + B + "u2029]", "g");
    const IN_RE = new RegExp(B + B + "(" + B + B + '|"|n|r|b|t|f|x3C|u2028|u2029)', "g");
    const str = s => String(s).replace(OUT_RE, c => OUT[c]), unstr = s => String(s).replace(IN_RE, (m, c) => IN[c]);
    function pack(value) {
      let next = 0;
      const one = v => {
        if (v === null) return { t: 2, s: 0 }; if (v === undefined) return { t: 2, s: 1 }; if (v === true) return { t: 2, s: 2 }; if (v === false) return { t: 2, s: 3 };
        if (typeof v === "number") { if (v !== v) return { t: 2, s: 7 }; if (v === Infinity) return { t: 2, s: 5 }; if (v === -Infinity) return { t: 2, s: 6 }; if (v === 0 && 1 / v < 0) return { t: 2, s: 4 }; return { t: 0, s: v }; }
        if (typeof v === "string") return { t: 1, s: str(v) };
        if (v instanceof Date) return { t: 5, i: next++, s: v.toISOString() };
        if (Array.isArray(v)) { const ai = next++; return { t: 9, i: ai, a: v.map(one), o: 0 }; }
        const oi = next++, keys = Object.keys(v).filter(k => v[k] !== undefined);
        return { t: 10, i: oi, p: { k: keys.map(str), v: keys.map(k => one(v[k])) }, o: 0 };
      };
      return { t: one(value), f: 127, m: [] };
    }
    function unpack(node) {
      const seen = {};
      const one = n => {
        if (n === null || n === undefined) return undefined;
        switch (n.t) {
          case 0: return n.s; case 1: return unstr(n.s); case 2: return [null, undefined, true, false, -0, Infinity, -Infinity, NaN][n.s]; case 3: return Number(n.s);
          case 4: return seen[n.i]; case 5: return (seen[n.i] = n.s);
          case 7: { const set = seen[n.i] = []; (n.a || []).forEach(x => set.push(one(x))); return set; }
          case 8: { const map = seen[n.i] = {}, e = n.e || { k: [], v: [] }; e.k.forEach((k, j) => { map[String(one(k))] = one(e.v[j]); }); return map; }
          case 9: { const arr = seen[n.i] = []; (n.a || []).forEach((x, j) => { arr[j] = x === null ? undefined : one(x); }); return arr; }
          case 10: case 11: { const obj = seen[n.i] = {}, p = n.p || { k: [], v: [] }; p.k.forEach((k, j) => { obj[unstr(k)] = one(p.v[j]); }); return obj; }
          default: return (seen[n.i] = { unknownSerovalType: n.t });
        }
      };
      return one(node);
    }
    return { pack, unpack };
  })();
  const getOnly = {};   // functions that answered 405 "expected GET"
  const short = fn => fn.split("--").pop().replace("_createServerFn_handler", "");
  async function tbCall(fn, data, useGet) {
    useGet = useGet || !!getOnly[fn];
    const body = JSON.stringify(SV.pack({ data })), ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 30000);
    const init = { method: useGet ? "GET" : "POST", credentials: "same-origin", signal: ctl.signal, headers: { accept: "application/json", "x-tsr-serverfn": "true" } };
    if (!useGet) { init.headers["content-type"] = "application/json"; init.body = body; }
    let r, txt;
    try { r = await fetch("/_serverFn/" + fn + (useGet ? "?payload=" + encodeURIComponent(body) : ""), init); txt = await r.text(); }
    catch (e) { S.why = short(fn) + (e && e.name === "AbortError" ? " no answer in 30 s" : " " + (e.message || e)); throw new Error("busy"); }
    finally { clearTimeout(timer); }
    if (r.status === 405 && !useGet && /GET/.test(txt)) { getOnly[fn] = true; return tbCall(fn, data, true); }
    let j = null; try { j = JSON.parse(txt); } catch (e) {}
    if (j && j.t && typeof j.t === "object" && "f" in j) j = SV.unpack(j.t);   // packed { t, f, m }
    else if (j && typeof j.t === "number") j = SV.unpack(j);              // a bare packed value
    const why = short(fn) + " " + r.status + " " + String(txt).replace(/\s+/g, " ").slice(0, 160);
    if (r.status === 401 || r.status === 403 || (j && j.isSerializedRedirect && /login|sign/i.test(String(j.href)))) { S.why = why; throw new Error("signedout"); }
    if (j && j.isSerializedRedirect) { S.why = "Timeback sent a redirect instead of numbers (it may have changed again): " + why; throw new Error("busy"); }
    if (!r.ok || !j || j.result === undefined) { S.why = why; throw new Error("busy"); }
    return j.result;
  }
  const tb = (fn, data) => tbCall(fn, data);
  async function tbCourses(id) {
    try { return await tbCall(FN.enroll, { onerosterUserId: id }); } catch (e) { throw new Error("crs " + (S.why || e.message)); }
  }
  const azDate = off => new Date(Date.now() - 7 * 3600e3 + off * 864e5).toISOString().slice(0, 10);
  async function readStudent(id) {
    if (!names[id]) {
      const u = await tb(FN.user, { id });
      const first = String(u.givenName || u.preferredFirstName || "").trim().split(/\s+/)[0], last = String(u.familyName || "").trim();
      if (first) { names[id] = first + (last ? " " + last[0].toUpperCase() + "." : ""); LS.set("names", names); }
    }
    // Nov 11: if Timeback turns away the 8-day ask, try just today (what Timeback's own page asks for), and remember what works
    const ask = days => tb(FN.metrics, { startDate: azDate(-days) + "T07:00:00.000Z", endDate: azDate(1) + "T06:59:59.999Z", studentId: id,
      timezone: "America/Phoenix", splitIseeByApp: true });
    let res;
    if (S.oneDay) res = await ask(0);
    else { try { res = await ask(7); } catch (e) { if (e.message !== "signedout") throw e; res = await ask(0); S.oneDay = true; } }
    if (!res || res.success === false || !res.data) throw new Error("busy");
    const days = {};
    Object.entries(res.data.facts || {}).forEach(([d, subs]) => {
      days[d] = {};
      Object.entries(subs || {}).forEach(([sub, m]) => { days[d][sub.toLowerCase().replace(/\s+/g, "")] = Number(m && m.activityMetrics && m.activityMetrics.xpEarned) || 0; });
    });
    // XP per course over these days (to tell which course a student is working in now)
    const byCourse = {};
    Object.values(res.data.allFactsByCourse || {}).forEach(cs => Object.entries(cs || {}).forEach(([cid, subs]) => Object.values(subs || {}).forEach(apps => Object.values(apps || {}).forEach(m => {
      byCourse[cid] = (byCourse[cid] || 0) + (Number(m && m.activityMetrics && m.activityMetrics.xpEarned) || 0); }))));
    const old = cache[id] || {};
    cache[id] = { days, byCourse, crs: old.crs, crsAt: old.crsAt };
    if (!old.crsAt || Date.now() - old.crsAt > ENROLL_EVERY) { try { await readCourses(id); S.crsErr = ""; } catch (e) { S.crsErr = String(e.message || e).slice(0, 90); cache[id].crsAt = Date.now() - ENROLL_EVERY + 15 * 60000; } }   // try again in 15 min
  }
  // 🎯 XP left in the course a student is on now, for each subject
  const subKeyOf = s => String(s || "").toLowerCase().replace(/\s+/g, "");
  const azDay = iso => { const t = Date.parse(iso || ""); return isNaN(t) ? "" : new Date(t - 7 * 3600e3).toISOString().slice(0, 10); };
  async function readCourses(id) {
    const res = await tbCourses(id);
    const list = Array.isArray(res && res.data) ? res.data : Array.isArray(res) ? res : null; if (!list) throw new Error("busy");
    const used = (cache[id] || {}).byCourse || {}, best = {};
    list.forEach(e => {
      if (!e || e.endDate || SKIP_COURSE.test(String(e.courseTitle || "")) || SKIP_COURSE.test(String(e.primaryApp || ""))) return;
      const md = e.metadata || {}, ix = md.inceptXp || (e.courseMetadata || {}).inceptXp;
      let tot = 0, done = null, at = "";
      if (ix && Number(ix.courseTotalXp) > 0) { tot = Number(ix.courseTotalXp); done = Number(ix.courseEarnedXp) || 0; at = azDay(ix.computedAt); }
      else { tot = Number((md.metrics || {}).totalXp) || 0; if (typeof md.pctCompleteApp === "number") { done = tot * md.pctCompleteApp / 100; at = azDay(md.pctCompleteAppUpdatedAt); } }
      if (!(tot > 0) || done == null) return;
      const left = Math.max(0, Math.round(tot - done)), xp = Number(used[e.courseId]) || 0, begin = String(e.beginDate || "");
      (e.courseSubjects || []).forEach(s => { const k = subKeyOf(s); if (!SUBKEY.includes(k)) return;
        const b = best[k], c = { left, tot: Math.round(tot), t: String(e.courseTitle || "").slice(0, 60), at, xp, begin };
        // the course with the most XP these last days wins; then the one started most recently
        if (!b || xp > b.xp || (xp === b.xp && begin > b.begin)) best[k] = c; });
    });
    const crs = {}; Object.entries(best).forEach(([k, c]) => { crs[k] = [c.left, c.tot, c.t, c.at]; });
    cache[id].crs = crs; cache[id].crsAt = Date.now();
  }

  // ----- Companion Keep -----
  async function ckToken(fresh) {
    let a = LS.get("auth");
    if (!fresh && a && a.exp > Date.now() + 60000) return a.id;
    if (a && a.refresh) {
      const r = await fetch("https://securetoken.googleapis.com/v1/token?key=" + CFG.apiKey, { method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" }, body: "grant_type=refresh_token&refresh_token=" + encodeURIComponent(a.refresh) });
      if (r.ok) { const j = await r.json(); a = { id: j.id_token, refresh: j.refresh_token, exp: Date.now() + Number(j.expires_in) * 1000 }; LS.set("auth", a); return a.id; }
    }
    const r = await fetch("https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=" + CFG.apiKey, { method: "POST",
      headers: { "content-type": "application/json" }, body: JSON.stringify({ returnSecureToken: true }) });
    const j = await r.json(); if (!j.idToken) throw new Error("cksignin");
    a = { id: j.idToken, refresh: j.refreshToken, exp: Date.now() + Number(j.expiresIn) * 1000 }; LS.set("auth", a); return a.id;
  }
  async function ckSend(json) {
    const url = "https://firestore.googleapis.com/v1/projects/" + CFG.project + "/databases/(default)/documents/classes/" + CFG.cls + "/live/xp";
    const body = JSON.stringify({ fields: { json: { stringValue: json }, at: { timestampValue: new Date().toISOString() }, key: { stringValue: CFG.key } } });
    const go = async fresh => fetch(url, { method: "PATCH", headers: { "content-type": "application/json", authorization: "Bearer " + await ckToken(fresh) }, body });
    let r = await go(false);
    if (r.status === 401) r = await go(true);
    if (r.status === 403) throw new Error("ckkey");
    if (!r.ok) throw new Error("cksave");
  }

  // ----- one check -----
  const schoolHours = () => { const t = new Date(Date.now() - 7 * 3600e3), wd = t.getUTCDay(), h = t.getUTCHours() + t.getUTCMinutes() / 60; return wd >= 1 && wd <= 5 && h >= 6 && h < 16.5; };
  async function cycle() {
    if (S.busy) return; S.busy = true; S.state = "Checking Timeback…";
    let failed = 0, signedOut = 0;
    try {
      const queue = ids.slice();
      const worker = async () => { while (queue.length) { const id = queue.shift(); try { await readStudent(id); } catch (e) { if (e.message === "signedout") signedOut++; failed++; } } };
      await Promise.all([worker(), worker(), worker()]);
      S.lastCheck = Date.now(); S.names = Object.keys(names).filter(i => ids.includes(i)).length;
      // Nov 11: only "signed out" when EVERY student failed that way; otherwise send the students that worked
      if (signedOut && signedOut >= ids.length) { S.state = "Signed out of Timeback"; S.problem = "Sign in to Timeback in another tab, then click the feeder bookmark again. (Timeback said: " + esc((S.why || "?").slice(0, 160)) + ")"; return; }
      // rows for every school day that has XP (and always today)
      const today = azDate(0), dates = new Set([today]);
      ids.forEach(id => Object.entries((cache[id] || {}).days || {}).forEach(([d, s]) => { if (Object.values(s).some(v => v > 0)) dates.add(d); }));
      const days = {}; let todayTot = 0;
      [...dates].sort().forEach(d => {
        days[d] = ids.filter(id => names[id]).map(id => {
          const s = ((cache[id] || {}).days || {})[d] || {}, subs = SUBKEY.map(k => Math.round((s[k] || 0) * 10) / 10);
          const tot = Math.round(Object.values(s).reduce((a, b) => a + (Number(b) || 0), 0));
          if (d === today) todayTot += tot;
          return [names[id], tot, 120].concat(subs);
        });
      });
      S.today = todayTot;
      const tx = {}; ids.forEach(id => { const c = (cache[id] || {}).crs; if (names[id] && c && Object.keys(c).length) tx[names[id]] = c; });
      S.goals = Object.keys(tx).length;
      LS.set("cache", cache);
      const json = JSON.stringify({ h: HEAD, days, tx, v: 2 });
      const beat = schoolHours() && Date.now() - S.lastSend > 30 * 60000;
      if (json !== LS.get("lastJson") || beat) { await ckSend(json); LS.set("lastJson", json); S.lastSend = Date.now(); }
      S.state = "Feeder running";
      S.problem = failed ? "Timeback was busy for " + failed + " student" + (failed === 1 ? "" : "s") + " (they update next check). (" + esc(S.why || "") + ")" : "none";
    } catch (e) {
      S.state = "Feeder running (with a problem)";
      S.problem = e.message === "ckkey" ? "Companion Keep didn’t accept this feeder. Make a new feeder button in your teacher console." :
        e.message === "cksignin" || e.message === "cksave" ? "Couldn’t reach Companion Keep. It will try again next check." : "Something went wrong (" + e.message + "). It will try again.";
    } finally {
      S.busy = false; S.next = Date.now() + (S.retry || (schoolHours() ? 5 : 30) * 60000); S.retry = 0;
      setTimeout(cycle, S.next - Date.now());
    }
  }
  cycle();
}

// The bookmark's link, with this class's settings and feeder key baked in.
export function feederLink(cfg) {
  return "javascript:" + encodeURIComponent("(" + feederMain.toString() + ")(" + JSON.stringify(cfg) + ")");
}
