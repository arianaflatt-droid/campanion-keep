/* ---------- 📡 Companion Keep feeder (a Chrome bookmark that runs on Timeback) ----------
   Click 1, on Learning Metrics → My Class: remembers the class list (?studentIds=...) and opens alpha.timeback.com/robots.txt
   (a quiet page, so Timeback's app can't reload over it). Click 2, on that page: starts the feeder.
   Every 5 minutes on school days (6:00 AM to 4:30 PM Arizona), every 30 minutes otherwise, it:
     · reads each student's XP per subject for the last 8 days (getActivityMetrics, Arizona days), read-only
     · reads each student's name once (fetchUser) and keeps only first name + last initial ("Jamie R.")
     · writes ONE small doc to Companion Keep: classes/{class}/live/xp = { json, at, key }, only when a number changed
       (plus a heartbeat every 30 minutes during school hours)
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
  if (!/robots\.txt$/.test(location.pathname)) {
    if (!(LS.get("ids") || []).length) { alert("Companion Keep feeder: open Learning Metrics, choose My Class, then click this bookmark."); return; }
    location.href = location.origin + "/robots.txt";
    return;
  }
  const ids = LS.get("ids") || [];
  const FN = {
    metrics: "src_features_learning-metrics_actions_getActivityMetrics_ts--getActivityMetrics_createServerFn_handler",
    user: "src_features_learning-metrics_components_fast-student-search_actions_client_ts--fetchUser_createServerFn_handler"
  };
  const HEAD = ["Student", "Total XP", "Goal", "Math", "FastMath", "Reading", "Writing", "Language", "Vocabulary", "Science", "Social Studies"];
  const SUBKEY = HEAD.slice(3).map(h => h.toLowerCase().replace(/\s+/g, ""));
  const S = { state: "Starting…", n: ids.length, names: 0, lastCheck: 0, lastSend: 0, problem: "none", busy: false, next: 0, today: 0 };
  const cache = LS.get("cache") || {};      // id -> { days: { date: { subj: xp } } }
  const names = LS.get("names") || {};      // id -> "Jamie R."

  // ----- page -----
  document.title = "\u{1F4E1} Companion Keep feeder";
  document.documentElement.innerHTML = "<head><meta charset='utf-8'><title>\u{1F4E1} Companion Keep feeder</title></head><body></body>";
  const card = document.createElement("div");
  card.style.cssText = "max-width:460px;margin:40px auto;background:#1f1b2e;color:#fff;font:15px/1.5 system-ui,sans-serif;padding:20px 24px;border-radius:16px;box-shadow:0 10px 40px rgba(0,0,0,.3)";
  document.body.style.cssText = "margin:0;background:#efeaf9;min-height:100vh";
  document.body.appendChild(card);
  const ago = t => !t ? "not yet" : Math.round((Date.now() - t) / 60000) < 1 ? "just now" : Math.round((Date.now() - t) / 60000) + " min ago";
  const draw = () => {
    const ok = S.problem === "none";
    card.innerHTML = "<div style='font-size:20px;font-weight:800;margin-bottom:6px'>\u{1F4E1} " + S.state + "</div>" +
      "<div>Students: <b>" + S.n + "</b> (" + S.names + " names)</div>" +
      "<div>Today’s XP so far: <b>" + S.today + "</b> total for the class</div>" +
      "<div>Last check of Timeback: <b>" + ago(S.lastCheck) + "</b></div>" +
      "<div>Last sent to Companion Keep: <b>" + ago(S.lastSend) + "</b></div>" +
      "<div>Next check: <b>" + (S.busy ? "checking now…" : S.next ? Math.max(0, Math.round((S.next - Date.now()) / 60000)) + " min" : "—") + "</b></div>" +
      "<div style='margin-top:8px;color:" + (ok ? "#b8f5c4" : "#ffd27a") + "'>Last problem: " + S.problem + "</div>" +
      "<div style='margin-top:12px;font-size:13px;color:#bdb6d6'>Leave this tab open all day. It only reads from Timeback. If the laptop sleeps, click the feeder bookmark again.</div>";
  };
  setInterval(draw, 1000); draw();
  try { navigator.locks && navigator.locks.request("ck-feeder", () => new Promise(() => {})); } catch (e) {}   // keeps Chrome from freezing this tab
  W.__ckFeeder = { show: () => { card.style.display = "block"; } };
  if (!ids.length) { S.state = "No class list"; S.problem = "Open Learning Metrics → My Class, then click the bookmark twice."; return; }

  // ----- Timeback (read-only) -----
  async function tb(fn, data) {
    const r = await fetch("/_serverFn/" + fn + "?createServerFn", { method: "POST", credentials: "include",
      headers: { accept: "application/json", "content-type": "application/json", "x-tsr-redirect": "manual" }, body: JSON.stringify({ data, context: {} }) });
    const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch (e) {}
    if (r.status === 401 || r.status === 403 || (j && (j.isRedirect || j.redirect || j.href) && j.result === undefined) || (!j && /login|sign in/i.test(t))) throw new Error("signedout");
    if (!r.ok || !j || j.result === undefined) throw new Error("busy");
    return j.result;
  }
  const azDate = off => new Date(Date.now() - 7 * 3600e3 + off * 864e5).toISOString().slice(0, 10);
  async function readStudent(id) {
    if (!names[id]) {
      const u = await tb(FN.user, { id });
      const first = String(u.givenName || u.preferredFirstName || "").trim().split(/\s+/)[0], last = String(u.familyName || "").trim();
      if (first) { names[id] = first + (last ? " " + last[0].toUpperCase() + "." : ""); LS.set("names", names); }
    }
    const res = await tb(FN.metrics, { startDate: azDate(-7) + "T07:00:00.000Z", endDate: azDate(1) + "T06:59:59.999Z", studentId: id,
      timezone: "America/Phoenix", activeCourseWindows: { $undefined: 0 }, scopeMode: { $undefined: 0 } });
    if (!res || res.success === false || !res.data) throw new Error("busy");
    const days = {};
    Object.entries(res.data.facts || {}).forEach(([d, subs]) => {
      days[d] = {};
      Object.entries(subs || {}).forEach(([sub, m]) => { days[d][sub.toLowerCase().replace(/\s+/g, "")] = Number(m && m.activityMetrics && m.activityMetrics.xpEarned) || 0; });
    });
    cache[id] = { days };
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
    let failed = 0, signedOut = false;
    try {
      const queue = ids.slice();
      const worker = async () => { while (queue.length) { const id = queue.shift(); try { await readStudent(id); } catch (e) { if (e.message === "signedout") signedOut = true; failed++; } } };
      await Promise.all([worker(), worker(), worker()]);
      S.lastCheck = Date.now(); S.names = Object.keys(names).filter(i => ids.includes(i)).length;
      if (signedOut) { S.state = "Signed out of Timeback"; S.problem = "Sign in to Timeback in another tab, then click the feeder bookmark again."; return; }
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
      LS.set("cache", cache);
      const json = JSON.stringify({ h: HEAD, days, v: 1 });
      const beat = schoolHours() && Date.now() - S.lastSend > 30 * 60000;
      if (json !== LS.get("lastJson") || beat) { await ckSend(json); LS.set("lastJson", json); S.lastSend = Date.now(); }
      S.state = "Feeder running";
      S.problem = failed ? "Timeback was busy for " + failed + " student" + (failed === 1 ? "" : "s") + " (they update next check)." : "none";
    } catch (e) {
      S.state = "Feeder running (with a problem)";
      S.problem = e.message === "ckkey" ? "Companion Keep didn’t accept this feeder. Make a new feeder button in your teacher console." :
        e.message === "cksignin" || e.message === "cksave" ? "Couldn’t reach Companion Keep. It will try again next check." : "Something went wrong (" + e.message + "). It will try again.";
    } finally {
      S.busy = false; S.next = Date.now() + (schoolHours() ? 5 : 30) * 60000;
      setTimeout(cycle, S.next - Date.now());
    }
  }
  cycle();
}

// The bookmark's link, with this class's settings and feeder key baked in.
export function feederLink(cfg) {
  return "javascript:" + encodeURIComponent("(" + feederMain.toString() + ")(" + JSON.stringify(cfg) + ")");
}
