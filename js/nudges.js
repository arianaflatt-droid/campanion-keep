// Nudge messages: short, friendly "you're close!" notes at the top of a student's page.
// Each rule returns a nudge or null; the most useful few are shown (lower pri = shown first).
import { seasonOf, dayXP, simulate, GEAR, goalXP, arr5, esc, isHaunt, battleOn, nextAttack, companionOf, bossState } from "./game.js?v=20260930j";
import { birthdayLeft, EVENTS, eventOpen, eventUnlocked, hasEvent, eventStreak, creature, family, azNow, pullsLeft, legendaryLeft, bankXP, LEVEL_XP, PULL_XP, hasStarter, owned, MAX_LEVEL } from "./collect.js?v=20260930j";
import { badgeState } from "./badges.js?v=20260930j";

const MAX_SHOWN = 3;
const WEEKDAY = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4 };
const plural = (n, w) => n.toLocaleString() + " " + w + (n === 1 ? "" : "s");

export function nudges(st, cls, battles, students) {
  const goal = goalXP(cls), sim = simulate(st, cls), c = companionOf(st), pet = esc(st.petName || (c && c.name) || "your companion");
  const d = WEEKDAY[azNow().day];                       // today as a school-day index (undefined on weekends)
  const hasToday = d != null && (arr5(st.xp, null)[d] != null || arr5(st.lunchXp, null)[d] != null);
  const today = hasToday ? dayXP(st, d) : null;
  const out = [];
  const add = (pri, icon, html, tab) => out.push({ pri, icon, html, tab });

  // ---- today's XP ----
  if (today != null && today < goal) {
    const left = goal - today, lunchOpen = !(cls && cls.lunchBonus === false) && azNow().h < 12;
    add(sim.atRisk ? 0 : 1, sim.atRisk ? "⚠️" : "\u{1F3AF}",
      "You’re <b>" + left.toLocaleString() + " XP" + "</b> from " + goal + " today" + (sim.atRisk ? " — hit it to heal " + pet + " back to full health!" : lunchOpen ? ". Hit it <b>before lunch</b> for a bonus egg! \u2600\uFE0F" : ". You’ve got this!"));
  } else if (today != null && today >= goal) {
    const nextEgg = PULL_XP - (today % PULL_XP);
    add(3, "\u{1F389}", "You hit " + goal + " today! Just <b>" + nextEgg.toLocaleString() + " more XP" + "</b> earns " + (today >= PULL_XP ? "another" : "an") + " egg.");
  } else if (sim.atRisk) {
    add(0, "⚠️", pet + " is at half health. Hit <b>" + goal + " XP</b> today to heal it!");
  } else if (!sim.alive && sim.capeReady) {
    add(0, "\u{1F9B8}", "You earned a Hero Cape! Ask your teacher to bring " + pet + " back.");
  } else if (!sim.alive) {
    add(0, "\u{1F4AA}", "Hit <b>" + goal + " XP</b> to earn a Hero Cape and bring " + pet + " back!");
  }

  // ---- streak gear ----
  const nextGear = GEAR.filter(g => !g.ghost && !g.turkey && !g.jingle && !sim.unlocked.includes(g.id)).sort((a, b) => a.streak - b.streak)[0];
  if (nextGear && sim.alive) {
    const need = Math.max(1, nextGear.streak - sim.hitRun);
    if (need <= 2) add(2, "\u{1F525}", "<b>" + plural(need, "more " + goal + " XP day") + "</b> in a row unlocks the <b>" + esc(nextGear.name) + "</b>!");
  }

  // ---- Creature Collector ----
  if (hasStarter(st)) {
    if (birthdayLeft(st)) add(0, "\u{1F382}", "<b>Happy birthday!</b> Ms. Ariana sent you a birthday egg. Go hatch it!", "collect");
    const eggs = pullsLeft(st, cls) + legendaryLeft(st);
    if (eggs) add(2, "\u{1F95A}", "You have <b>" + plural(eggs, "egg") + "</b> waiting to hatch!", "collect");
    const bank = bankXP(st, cls), canLevel = Object.values(owned(st)).some(e => (e.lvl || 1) < MAX_LEVEL);
    if (canLevel && bank >= LEVEL_XP) add(4, "⬆️", "You have enough banked XP to level up <b>" + plural(Math.floor(bank / LEVEL_XP), "time") + "</b>!", "collect");
  }

  // ---- limited events (Duckarune, Hexaduck) ----
  if (hasStarter(st)) EVENTS.forEach(ev => {
    if (!eventOpen(ev, cls) || hasEvent(ev, st)) return;
    const nm = esc(creature(family(ev.fam).forms[0]).name);
    if (eventUnlocked(ev, st, cls)) add(1, ev.icon, "<b>" + nm + " is unlocked!</b> Your next egg has a 95% chance to be it.", "collect");
    else if (ev.boss) add(2, ev.icon, "\u{1F512} Defeat the <b>" + esc(ev.bossName) + "</b> with your class to unlock the limited <b>" + nm + "</b>!", "haunt");
    else { const need = Math.max(1, ev.streak - eventStreak(ev, st, cls).current); add(1, ev.icon, "<b>" + plural(need, "more " + goal + " XP day") + "</b> in a row unlocks the limited <b>" + nm + "</b>!", "collect"); }
  });

  // ---- closest badge (kept a mystery: just the hint) ----
  const close = badgeState(st, battles, cls).filter(b => !b.have && b.n > 0 && b.goal - b.n > 0)
    .map(b => Object.assign(b, { pct: b.n / b.goal })).sort((a, b) => b.pct - a.pct)[0];
  if (close && close.pct >= 0.5) {
    add(3, "\u{1F3C5}", "You’re <b>" + (close.goal - close.n).toLocaleString() + " away</b> from a mystery badge! <span class=\"muted\">Hint: " + esc(close.desc) + "</span>", "badges");
  }

  // ---- Haunt-O-Ween / Gobble-Palooza ----
  if (battleOn(cls) && !bossState(cls, students).defeated) {
    const atk = nextAttack(st, cls).count;
    if (atk) add(1, "⚔️", "You have <b>" + plural(atk, "attack") + "</b> ready for the " + seasonOf(cls).boss + "!", "haunt");
  }

  return out.sort((a, b) => a.pri - b.pri).slice(0, MAX_SHOWN);
}

export function nudgeCard(st, cls, battles, students) {
  const list = nudges(st, cls, battles, students);
  if (!list.length) return "";
  return '<div class="nudges" aria-live="polite">' + list.map(n =>
    '<div class="nudge">' + '<span class="nudge-i" aria-hidden="true">' + n.icon + '</span><span class="nudge-t">' + n.html + "</span>" +
    (n.tab ? '<button class="btn small ghost" data-tab="' + n.tab + '">Go →</button>' : "") + "</div>").join("") + "</div>";
}
