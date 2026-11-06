/* ---------- 🎮 Planet JP, Wave 2 (Nov 5): the 5 travel minigames ----------
   One game a day for the whole class (picked from the date), played on the way to Planet JP, between liftoff and landing.
   Each game takes about 30–60 seconds and returns { score, dust } — dust (0–20 ⭐ Stardust) is added to the 10 for launching.
   play(key, host, sfx) draws the game inside `host` and resolves when it ends (time's up, out of shields, or "End game").
   Pictures: assets/planet/ (Ms. Ariana's art). */
const A = "assets/planet/";
export const GAMES = [
  { key: "dodge", icon: "☄️", name: "Asteroid Dodge", how: "Drag (or use ↑ ↓) to steer the S.S. Duck. Dodge the asteroids and grab the gold stars! You have 3 shields.", unit: "stars" },
  { key: "pinball", icon: "\u{1F6F8}", name: "Space Pinball", how: "Slide the S.S. Duck left and right to bounce the comet ball. Hit the pink bumpers and the gold stars! You have 3 balls.", unit: "points" },
  { key: "rescue", icon: "\u{1F425}", name: "Space Duckling Rescue", how: "Fly the S.S. Duck to the lost ducklings. Your tractor beam pulls them in! Watch out for space junk.", unit: "ducklings" },
  { key: "stars", icon: "✨", name: "Constellation Copy", how: "Watch the stars light up, then tap them in the same order. Each round adds one more star!", unit: "rounds" },
  { key: "code", icon: "\u{1F47D}", name: "Alien Code", how: "Crack Zib’s secret 3-color code in 6 tries. Green = right spot, yellow = in the code but a different spot, gray = not in the code.", unit: "tries" },
];
export const gameByKey = k => GAMES.find(g => g.key === k) || GAMES[0];
export function gameOfDay(iso) { let h = 7; for (const c of String(iso)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return GAMES[h % GAMES.length]; }

const IMG = {};
const img = n => IMG[n] || (IMG[n] = Object.assign(new Image(), { src: A + n + ".webp" }));
export function preload() { ["ss-duck", "ss-duck-flame", "asteroid-1", "asteroid-2", "star-coin", "space-duckling", "space-junk", "pinball-planet", "alien-code", "stardust"].forEach(img); }
const rnd = (a, b) => a + Math.random() * (b - a);
const ok = im => im && im.complete && im.naturalWidth;
function drawImg(ctx, n, x, y, w, h, rot, alpha) {
  const im = img(n); if (!ok(im)) return;
  ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot); if (alpha != null) ctx.globalAlpha = alpha;
  ctx.drawImage(im, -w / 2, -h / 2, w, h); ctx.restore();
}
const fit = (n, w) => { const im = img(n); return ok(im) ? w * im.naturalHeight / im.naturalWidth : w; };

export function play(key, host, sfx) {
  return key === "code" ? codeGame(host, sfx) : canvasGame(key, host, sfx);
}

/* ---------- the canvas games (dodge, pinball, rescue, stars) ---------- */
function canvasGame(key, host, sfx) {
  return new Promise(resolve => {
    const g = gameByKey(key);
    host.innerHTML = '<div class="pjover pjgame"><canvas id="pjcv"></canvas><div class="pjhud"><b>' + g.icon + " " + g.name + '</b><span id="pjsc"></span><span id="pjlife"></span><span id="pjtime"></span></div>' +
      '<button class="btn ghost small pjskip" data-pjg="end">End game</button></div>';
    const cv = host.querySelector("#pjcv"), ctx = cv.getContext("2d");
    let W = 0, H = 0, S = 1;
    const size = () => { const d = Math.min(2, window.devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * d; cv.height = H * d; cv.style.width = W + "px"; cv.style.height = H + "px"; ctx.setTransform(d, 0, 0, d, 0, 0); S = Math.min(W, H) / 700; };
    size(); addEventListener("resize", size);
    const P = { x: null, y: null, down: false }, keys = {};
    const pos = e => { const r = cv.getBoundingClientRect(); P.x = e.clientX - r.left; P.y = e.clientY - r.top; };
    cv.addEventListener("pointermove", pos); cv.addEventListener("pointerdown", e => { pos(e); P.down = true; tap && tap(P.x, P.y); });
    cv.addEventListener("pointerup", () => { P.down = false; });
    const kd = e => { keys[e.key] = true; if (/^Arrow/.test(e.key)) e.preventDefault(); }, ku = e => { keys[e.key] = false; };
    addEventListener("keydown", kd); addEventListener("keyup", ku);
    let tap = null, done = false, last = performance.now(), t = 0, score = 0, lives = 3, limit = 30, pops = [];
    const bg = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), z: rnd(0.2, 1) }));
    const hud = () => {
      const sc = host.querySelector("#pjsc"), lf = host.querySelector("#pjlife"), tm = host.querySelector("#pjtime");
      if (sc) sc.textContent = (key === "dodge" ? "⭐ " : key === "pinball" ? "\u{1F3AF} " : key === "rescue" ? "\u{1F425} " : "✨ Round ") + score;
      if (lf) lf.textContent = key === "rescue" ? "" : (key === "pinball" ? "☄️" : key === "stars" ? "❤️" : "\u{1F6E1}️").repeat(Math.max(0, lives));
      if (tm) tm.textContent = limit ? "⏱️ " + Math.max(0, Math.ceil(limit - t)) : "";
    };
    const pop = (x, y, txt, col) => pops.push({ x, y, txt, col: col || "#FFE38A", t: 0 });
    const finish = () => { if (done) return; done = true; removeEventListener("resize", size); removeEventListener("keydown", kd); removeEventListener("keyup", ku); resolve(result(key, score)); };
    host.querySelector("[data-pjg=end]").onclick = finish;
    const G = GAME[key]({ W: () => W, H: () => H, S: () => S, P, keys, ctx, sfx, pop, get t() { return t; },
      add: n => { score += n; }, hurt: () => { lives--; sfx.thud(); if (lives <= 0) setTimeout(finish, 700); }, lives: () => lives, setLimit: v => { limit = v; }, setTap: f => { tap = f; }, end: finish });
    function frame(now) {
      if (done) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
      ctx.clearRect(0, 0, W, H);
      bg.forEach(s => { if (key !== "stars") { s.x -= dt * 0.06 * s.z; if (s.x < 0) s.x += 1; } ctx.fillStyle = "rgba(255,255,255," + (0.35 + s.z * 0.5) + ")"; ctx.fillRect(s.x * W, s.y * H, 2 * s.z + 0.5, 2 * s.z + 0.5); });
      G.step(dt); G.draw();
      pops = pops.filter(p => (p.t += dt) < 0.9);
      pops.forEach(p => { ctx.save(); ctx.globalAlpha = 1 - p.t / 0.9; ctx.fillStyle = p.col; ctx.font = "900 " + Math.round(28 * S + 8) + "px system-ui,sans-serif"; ctx.textAlign = "center"; ctx.strokeStyle = "rgba(30,10,70,.8)"; ctx.lineWidth = 5; ctx.strokeText(p.txt, p.x, p.y - p.t * 50); ctx.fillText(p.txt, p.x, p.y - p.t * 50); ctx.restore(); });
      hud();
      if (limit && t >= limit) return finish();
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });
}
export function result(key, score) {
  const dust = key === "dodge" ? Math.min(20, score) : key === "pinball" ? Math.min(20, Math.round(score / 2)) : key === "rescue" ? Math.min(20, score * 2)
    : key === "stars" ? Math.min(20, score * 3) : score > 0 ? [20, 18, 15, 12, 10, 8][score - 1] || 8 : 5;
  return { key, score, dust };
}
const circleHit = (ax, ay, ar, bx, by, br) => (ax - bx) ** 2 + (ay - by) ** 2 < (ar + br) ** 2;
function duck(c, x, y, w, rot, flick) {
  const h = fit("ss-duck", w);
  if (flick !== false) drawImg(c.ctx, "ss-duck-flame", x - w * 0.62, y + h * 0.12, w * 0.5 * (0.9 + Math.random() * 0.2), fit("ss-duck-flame", w * 0.5), 0);
  drawImg(c.ctx, "ss-duck", x, y, w, h, rot || 0);
  return h;
}

const GAME = {
  /* ☄️ Asteroid Dodge */
  dodge(c) {
    const ship = { x: 0, y: c.H() / 2 }, rocks = [], stars = []; let spawnR = 0, spawnS = 0.5, inv = 0;
    return {
      step(dt) {
        const W = c.W(), H = c.H(), S = c.S(); ship.x = W * 0.16;
        let ty = c.P.y != null ? c.P.y : ship.y; if (c.keys.ArrowUp) ty = ship.y - 600 * dt; if (c.keys.ArrowDown) ty = ship.y + 600 * dt;
        ship.y += (Math.max(60 * S, Math.min(H - 60 * S, ty)) - ship.y) * Math.min(1, dt * 10);
        const hard = Math.min(1, c.t / 30);
        if ((spawnR -= dt) <= 0) { spawnR = 0.75 - hard * 0.4; const r = rnd(32, 62) * S; rocks.push({ x: W + r, y: rnd(r, H - r), r, vx: -rnd(240, 380) * S * (1 + hard * 0.6), rot: rnd(0, 6), vr: rnd(-2, 2), n: Math.random() < 0.5 ? "asteroid-1" : "asteroid-2" }); }
        if ((spawnS -= dt) <= 0) { spawnS = rnd(0.7, 1.2); stars.push({ x: W + 30, y: rnd(60 * S, H - 60 * S), vx: -rnd(200, 300) * S, a: 0 }); }
        inv -= dt;
        const sr = 34 * S;
        rocks.forEach(r => { r.x += r.vx * dt; r.rot += r.vr * dt; if (inv <= 0 && circleHit(ship.x, ship.y, sr, r.x, r.y, r.r * 0.72)) { inv = 1.3; r.hit = true; c.hurt(); c.pop(ship.x, ship.y - 40 * S, "Bonk!", "#FF8A8A"); } });
        stars.forEach(s => { s.x += s.vx * dt; s.a += dt * 3; if (!s.got && circleHit(ship.x + 20 * S, ship.y, sr + 6 * S, s.x, s.y, 24 * S)) { s.got = true; c.add(1); c.sfx.beep(1320, 0.1); c.pop(s.x, s.y, "+1 ⭐"); } });
        for (let i = rocks.length - 1; i >= 0; i--) if (rocks[i].x < -100 || rocks[i].hit) rocks.splice(i, 1);
        for (let i = stars.length - 1; i >= 0; i--) if (stars[i].x < -60 || stars[i].got) stars.splice(i, 1);
      },
      draw() {
        const S = c.S();
        stars.forEach(s => drawImg(c.ctx, "star-coin", s.x, s.y, 48 * S, 46 * S, Math.sin(s.a) * 0.3));
        rocks.forEach(r => drawImg(c.ctx, r.n, r.x, r.y, r.r * 2.2, fit(r.n, r.r * 2.2), r.rot));
        if (inv > 0 && Math.floor(inv * 10) % 2) return;
        duck(c, ship.x, ship.y, 130 * S);
        if (inv > 0) { c.ctx.strokeStyle = "rgba(120,220,255,.7)"; c.ctx.lineWidth = 4; c.ctx.beginPath(); c.ctx.arc(ship.x, ship.y, 70 * S, 0, 7); c.ctx.stroke(); }
      },
    };
  },
  /* 🛸 Space Pinball (the S.S. Duck is the paddle) */
  pinball(c) {
    c.setLimit(35);
    let ball = null, wait = 0.6, stars = [], starT = 1.5, bumpers = null, px = c.W() / 2;
    const newBall = () => { const S = c.S(); ball = { x: px, y: c.H() - 130 * S, vx: rnd(-180, 180) * S, vy: -480 * S, r: 16 * S }; };
    const layout = () => { const W = c.W(), H = c.H(), S = c.S();
      bumpers = [[0.25, 0.25], [0.5, 0.18], [0.75, 0.25], [0.37, 0.43], [0.63, 0.43]].map(([x, y]) => ({ x: x * W, y: y * H + 40 * S, r: 46 * S, f: 0 })); };
    layout();
    return {
      step(dt) {
        const W = c.W(), H = c.H(), S = c.S();
        if (!bumpers || Math.abs(bumpers[1].x - 0.5 * W) > 2) layout();
        let tx = c.P.x != null ? c.P.x : px; if (c.keys.ArrowLeft) tx = px - 700 * dt; if (c.keys.ArrowRight) tx = px + 700 * dt;
        px += (Math.max(80 * S, Math.min(W - 80 * S, tx)) - px) * Math.min(1, dt * 14);
        const py = H - 70 * S, pw = 170 * S;
        if (!ball) { if ((wait -= dt) <= 0 && c.lives() > 0) newBall(); }
        else {
          const sp = Math.hypot(ball.vx, ball.vy), want = (480 + Math.min(260, c.t * 7)) * S;
          ball.vx *= want / sp; ball.vy *= want / sp;
          ball.x += ball.vx * dt; ball.y += ball.vy * dt;
          if (ball.x < ball.r) { ball.x = ball.r; ball.vx = Math.abs(ball.vx); }
          if (ball.x > W - ball.r) { ball.x = W - ball.r; ball.vx = -Math.abs(ball.vx); }
          if (ball.y < ball.r + 50) { ball.y = ball.r + 50; ball.vy = Math.abs(ball.vy); }
          if (ball.vy > 0 && ball.y + ball.r > py - 18 * S && ball.y < py + 20 * S && Math.abs(ball.x - px) < pw / 2 + ball.r) {
            const off = (ball.x - px) / (pw / 2); ball.vx = off * 420 * S; ball.vy = -Math.abs(ball.vy); ball.y = py - 18 * S - ball.r; c.sfx.beep(440, 0.06);
          }
          bumpers.forEach(b => { const dx = ball.x - b.x, dy = ball.y - b.y, d = Math.hypot(dx, dy);
            if (d < b.r + ball.r) { const nx = dx / d, ny = dy / d, dot = ball.vx * nx + ball.vy * ny; ball.vx -= 2 * dot * nx; ball.vy -= 2 * dot * ny; ball.x = b.x + nx * (b.r + ball.r + 1); ball.y = b.y + ny * (b.r + ball.r + 1); b.f = 0.25; c.add(1); c.sfx.beep(880 + Math.random() * 300, 0.08); c.pop(b.x, b.y - b.r, "+1"); } });
          stars.forEach(s => { if (!s.got && circleHit(ball.x, ball.y, ball.r, s.x, s.y, 24 * S)) { s.got = true; c.add(3); c.sfx.beep(1568, 0.12); c.pop(s.x, s.y, "+3 ⭐"); } });
          if (ball.y > H + 40) { ball = null; wait = 1; c.hurt(); }
        }
        bumpers.forEach(b => { b.f = Math.max(0, b.f - dt); });
        if ((starT -= dt) <= 0 && stars.filter(s => !s.got).length < 2) { starT = rnd(2, 3.5); stars.push({ x: rnd(60 * S, W - 60 * S), y: rnd(H * 0.15, H * 0.62), a: 0 }); }
        stars.forEach(s => { s.a += dt * 3; }); stars = stars.filter(s => !s.got);
        this.px = px; this.py = py; this.pw = pw;
      },
      draw() {
        const S = c.S(), ctx = c.ctx;
        bumpers.forEach(b => drawImg(ctx, "pinball-planet", b.x, b.y, b.r * 2.2 * (1 + b.f), fit("pinball-planet", b.r * 2.2) * (1 + b.f)));
        stars.forEach(s => drawImg(ctx, "star-coin", s.x, s.y, 46 * S, 44 * S, Math.sin(s.a) * 0.3));
        if (ball) { const g = ctx.createRadialGradient(ball.x, ball.y, 1, ball.x, ball.y, ball.r * 2.4); g.addColorStop(0, "#FFFFFF"); g.addColorStop(0.35, "#9FF3FF"); g.addColorStop(1, "rgba(120,200,255,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r * 2.4, 0, 7); ctx.fill(); }
        duck(c, this.px || c.W() / 2, (this.py || c.H() - 70 * S) + 10 * S, this.pw || 170 * S, 0, false);
      },
    };
  },
  /* 🐥 Space Duckling Rescue */
  rescue(c) {
    const ship = { x: c.W() * 0.3, y: c.H() / 2 }, ducks = [], junk = []; let dT = 0, jT = 1.5, stun = 0;
    const edge = (S, sp) => { const W = c.W(), H = c.H(), side = Math.floor(Math.random() * 4), x = side === 0 ? -40 : side === 1 ? W + 40 : rnd(0, W), y = side === 2 ? -40 : side === 3 ? H + 40 : rnd(0, H);
      const ang = Math.atan2(rnd(H * 0.3, H * 0.7) - y, rnd(W * 0.3, W * 0.7) - x); return { x, y, vx: Math.cos(ang) * sp * S, vy: Math.sin(ang) * sp * S, a: rnd(0, 6) }; };
    return {
      step(dt) {
        const W = c.W(), H = c.H(), S = c.S();
        let tx = c.P.x != null ? c.P.x : ship.x, ty = c.P.y != null ? c.P.y : ship.y;
        if (c.keys.ArrowLeft) tx = ship.x - 500 * dt; if (c.keys.ArrowRight) tx = ship.x + 500 * dt; if (c.keys.ArrowUp) ty = ship.y - 500 * dt; if (c.keys.ArrowDown) ty = ship.y + 500 * dt;
        if (stun <= 0) { ship.x += (tx - ship.x) * Math.min(1, dt * 5); ship.y += (ty - ship.y) * Math.min(1, dt * 5); }
        ship.x = Math.max(40, Math.min(W - 40, ship.x)); ship.y = Math.max(60, Math.min(H - 40, ship.y)); stun -= dt;
        if ((dT -= dt) <= 0 && ducks.length < 5) { dT = rnd(0.6, 1.2); ducks.push(edge(S, rnd(50, 90))); }
        if ((jT -= dt) <= 0) { jT = rnd(1.4, 2.4) - Math.min(0.8, c.t / 40); const j = edge(S, rnd(150, 230)); j.vr = rnd(-2, 2); junk.push(j); }
        const beam = 160 * S;
        ducks.forEach(d => { d.a += dt * 2;
          const dx = ship.x - d.x, dy = ship.y - d.y, dist = Math.hypot(dx, dy);
          if (stun <= 0 && dist < beam) { d.beam = true; d.x += dx / dist * 340 * S * dt; d.y += dy / dist * 340 * S * dt; } else { d.beam = false; d.x += d.vx * dt; d.y += d.vy * dt + Math.sin(d.a) * 0.3; }
          if (stun <= 0 && dist < 55 * S) { d.got = true; c.add(1); c.sfx.beep(1175, 0.1); c.pop(d.x, d.y, "Saved! \u{1F425}"); }
          if (d.x < -90 || d.x > W + 90 || d.y < -90 || d.y > H + 90) d.gone = true; });
        junk.forEach(j => { j.x += j.vx * dt; j.y += j.vy * dt; j.a += (j.vr || 1) * dt;
          if (stun <= 0 && circleHit(ship.x, ship.y, 34 * S, j.x, j.y, 34 * S)) { stun = 1.2; j.hit = true; c.sfx.thud(); c.pop(ship.x, ship.y - 40 * S, "Zap! ⚡", "#FF8A8A"); }
          if (j.x < -120 || j.x > W + 120 || j.y < -120 || j.y > H + 120) j.gone = true; });
        for (let i = ducks.length - 1; i >= 0; i--) if (ducks[i].got || ducks[i].gone) ducks.splice(i, 1);
        for (let i = junk.length - 1; i >= 0; i--) if (junk[i].gone || junk[i].hit) junk.splice(i, 1);
      },
      draw() {
        const S = c.S(), ctx = c.ctx;
        ducks.forEach(d => { if (d.beam) { ctx.strokeStyle = "rgba(150,255,200,.55)"; ctx.lineWidth = 10 * S; ctx.beginPath(); ctx.moveTo(ship.x, ship.y); ctx.lineTo(d.x, d.y); ctx.stroke(); }
          drawImg(ctx, "space-duckling", d.x, d.y, 70 * S, fit("space-duckling", 70 * S), Math.sin(d.a) * 0.25); });
        junk.forEach(j => drawImg(ctx, "space-junk", j.x, j.y, 90 * S, fit("space-junk", 90 * S), j.a));
        ctx.strokeStyle = stun > 0 ? "rgba(255,120,120,.5)" : "rgba(150,255,200,.25)"; ctx.lineWidth = 3; ctx.setLineDash([8, 8]); ctx.beginPath(); ctx.arc(ship.x, ship.y, 160 * S, 0, 7); ctx.stroke(); ctx.setLineDash([]);
        duck(c, ship.x + (stun > 0 ? Math.sin(c.t * 60) * 4 : 0), ship.y, 120 * S);
      },
    };
  },
  /* ✨ Constellation Copy (Simon-style memory) */
  stars(c) {
    c.setLimit(0); const sx = c.sfx;
    const SHAPE = [[0.18, 0.62], [0.3, 0.38], [0.45, 0.55], [0.52, 0.25], [0.66, 0.47], [0.8, 0.3], [0.84, 0.66]];
    const NOTES = [523, 587, 659, 784, 880, 988, 1175];
    let seq = [], step = 0, mode = "show", tm = 0.9, showI = -1, lit = -1, litT = 0, round = 0, played = [];
    const nextRound = () => { seq.push(Math.floor(Math.random() * SHAPE.length)); if (seq.length < 2) seq.push(Math.floor(Math.random() * SHAPE.length)); mode = "show"; showI = -1; tm = 0.8; step = 0; played = []; };
    nextRound();
    const pos = i => [SHAPE[i][0] * c.W(), (0.12 + SHAPE[i][1] * 0.8) * c.H()];
    c.setTap((x, y) => {
      if (mode !== "input") return;
      const S = c.S(); let hit = -1; SHAPE.forEach((_, i) => { const [px, py] = pos(i); if (circleHit(x, y, 4, px, py, 58 * S)) hit = i; });
      if (hit < 0) return;
      lit = hit; litT = 0.3;
      if (hit === seq[step]) { sx.beep(NOTES[hit], 0.25); played.push(hit); step++;
        if (step >= seq.length) { round++; c.add(1); c.pop(c.W() / 2, c.H() * 0.12 + 40, "Round " + round + " ✨"); mode = "wait"; tm = 0.9;
          if (round >= 8) setTimeout(c.end, 900); } }
      else { sx.beep(180, 0.4); c.pop(x, y, "Oops!", "#FF8A8A"); c.hurt(); mode = c.lives() > 0 ? "retry" : "over"; tm = 1.1; }
    });
    return {
      step(dt) {
        litT -= dt; if (litT <= 0) lit = -1;
        if (mode === "show") { tm -= dt; if (tm <= 0) { showI++; if (showI >= seq.length) { mode = "input"; return; } lit = seq[showI]; litT = 0.5; sx.beep(NOTES[lit], 0.35); tm = 0.75; } }
        else if (mode === "wait") { tm -= dt; if (tm <= 0) nextRound(); }
        else if (mode === "retry") { tm -= dt; if (tm <= 0) { mode = "show"; showI = -1; tm = 0.6; step = 0; played = []; } }
      },
      draw() {
        const S = c.S(), ctx = c.ctx;
        ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.lineWidth = 2; ctx.beginPath(); SHAPE.forEach((_, i) => { const [x, y] = pos(i); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
        if (played.length > 1) { ctx.strokeStyle = "rgba(255,227,138,.85)"; ctx.lineWidth = 5 * S; ctx.beginPath(); played.forEach((k, i) => { const [x, y] = pos(k); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke(); }
        SHAPE.forEach((_, i) => { const [x, y] = pos(i), on = lit === i, w = (on ? 110 : 74) * S;
          if (on) { const g = ctx.createRadialGradient(x, y, 2, x, y, 110 * S); g.addColorStop(0, "rgba(255,240,170,.9)"); g.addColorStop(1, "rgba(255,240,170,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 110 * S, 0, 7); ctx.fill(); }
          drawImg(ctx, "star-coin", x, y, w, w * 0.95, 0, on ? 1 : 0.75); });
        ctx.fillStyle = "#fff"; ctx.font = "800 " + Math.round(22 * S + 8) + "px system-ui,sans-serif"; ctx.textAlign = "center";
        ctx.fillText(mode === "show" ? "Watch the stars…" : mode === "input" ? "Your turn! Tap " + seq.length + " stars" : mode === "retry" ? "Watch again…" : mode === "wait" ? "Great job!" : "", c.W() / 2, c.H() - 40 * S);
      },
    };
  },
};

/* ---------- 👽 Alien Code (DOM, Wordle-style colors) ---------- */
const COLORS = [["p", "#FF4FB8"], ["y", "#FFD23F"], ["b", "#35C8FF"], ["v", "#A855F7"]];
function codeGame(host, sfx) {
  return new Promise(resolve => {
    const pool = COLORS.map(c => c[0]).sort(() => Math.random() - 0.5), code = pool.slice(0, 3), rows = []; let cur = [], done = false;
    const col = k => (COLORS.find(c => c[0] === k) || [0, "#555"])[1];
    const mark = g => g.map((k, i) => (k === code[i] ? "g" : code.includes(k) ? "y" : "x"));
    const draw = (say) => {
      const won = rows.length && rows[rows.length - 1].m.every(x => x === "g");
      host.innerHTML = '<div class="pjover pjgame pjcode"><div class="pjhud"><b>\u{1F47D} Alien Code</b><span>Try ' + Math.min(6, rows.length + (done ? 0 : 1)) + " of 6</span></div>" +
        '<div class="pjcodewrap"><div class="pjzib"><img src="' + A + 'alien-code.webp" alt="Zib the alien"><span class="pjsay">' + say + "</span></div>" +
        '<div class="pjboard">' + Array.from({ length: 6 }, (_, r) => { const row = rows[r], g = row ? row.g : r === rows.length ? cur : [];
          return '<div class="pjrowc">' + [0, 1, 2].map(i => '<span class="pjslot ' + (row ? row.m[i] : "") + '" style="' + (g[i] ? "background:" + col(g[i]) : "") + '">' + (row ? (row.m[i] === "g" ? "✓" : row.m[i] === "y" ? "↔" : "✗") : "") + "</span>").join("") + "</div>"; }).join("") + "</div>" +
        (done ? '<div class="pjcodeend">' + (won ? "\u{1F389} You cracked it!" : "The code was:") + ' <span class="pjrowc">' + code.map(k => '<span class="pjslot g" style="background:' + col(k) + '"></span>').join("") + "</span></div>"
          : '<div class="pjpalette">' + COLORS.map(([k, c]) => '<button class="pjcol" data-cc="' + k + '" style="background:' + c + '"' + (cur.includes(k) || cur.length >= 3 ? " disabled" : "") + "></button>").join("") +
            '<button class="btn ghost small" data-cc="undo"' + (cur.length ? "" : " disabled") + '>↩ Undo</button><button class="btn gold" data-cc="go"' + (cur.length === 3 ? "" : " disabled") + ">Check!</button></div>") +
        "</div></div>";
    };
    draw("Beep boop! Can you guess my 3-color code? Each color is used only once.");
    host.onclick = ev => {
      const b = ev.target.closest("[data-cc]"); if (!b || done) return; const v = b.dataset.cc;
      if (v === "undo") cur.pop(); else if (v === "go" && cur.length === 3) {
        const m = mark(cur); rows.push({ g: cur, m }); cur = [];
        const won = m.every(x => x === "g");
        if (won || rows.length >= 6) { done = true; won ? (sfx.sparkle(), draw("WOW! You cracked my code in " + rows.length + " tr" + (rows.length === 1 ? "y" : "ies") + "!")) : (sfx.beep(220, 0.3), draw("So close! Here’s my secret code."));
          setTimeout(() => { host.onclick = null; resolve(result("code", won ? rows.length : 0)); }, 2600); return; }
        const g = m.filter(x => x === "g").length; sfx.beep(g ? 660 + g * 120 : 300, 0.15);
        draw(g === 2 ? "Ooh, so close! Two are right!" : g === 1 ? "One is in the right spot!" : m.includes("y") ? "Those colors are in my code… somewhere else!" : "Hmm, try other colors!"); return;
      } else if (cur.length < 3 && !cur.includes(v)) { cur.push(v); sfx.beep(520 + cur.length * 90, 0.06); }
      draw(cur.length === 3 ? "Press Check!" : "Pick " + (3 - cur.length) + " more…");
    };
  });
}
