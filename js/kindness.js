/* ---------- 💌 Kindness Board ----------
   Once a day a student builds a shout-out for a classmate from a sentence starter + an ending + a sticker (no free typing),
   and it is personalized with the classmate's name and companion. Saved on the SENDER:
   kind = { "YYYY-MM-DD": { to: studentId, s: starter, f: ending, e: sticker, at } }  (older ones may have m = a preset message).
   The receiver can send back a 💖 (kindThanks = { "senderId:date": true }); the sender sees "Maya loved it!".
   No XP and no badges: it's just for kindness. Ms. Ariana can hide one (cls.kindHide) or turn the board off (cls.kindOff). */
import { esc, companionOf } from "./game.js?v=20261016q";
import { azToday } from "./collect.js?v=20261016q";

export const KIND_DAYS = 1;   // shout-outs show for today and yesterday, then disappear
// Sentence starters, each with its own endings. {name} = the classmate, {pet} = their companion's name.
export const KIND_STARTERS = [
  { t: "I'm proud of you for", pet: "{pet} must be so proud of you too!",
    f: ["finishing your math", "working hard on your reading", "hitting 120 XP today", "not giving up", "keeping your streak going", "trying your best"] },
  { t: "You're really good at", pet: "{pet} is lucky to have you!",
    f: ["math", "reading", "writing", "making people laugh", "helping others", "battling"] },
  { t: "Thank you for", pet: "Tell {pet} I said hi!",
    f: ["helping me", "being kind to me", "cheering me on", "being my friend", "making class fun", "trading with me"] },
  { t: "I think you're", pet: "{pet} thinks so too!",
    f: ["super smart", "really kind", "so funny", "really brave", "a great teammate", "awesome"] },
  { t: "You can do it! I know you'll", pet: "{pet} is cheering for you!",
    f: ["hit 120 XP today", "reach your weekly goal", "get a Legendary egg", "open the Treasure Vault", "level up your companion", "beat the boss"] },
  { t: "I had fun", pet: "Give {pet} a high five from me!",
    f: ["battling with you", "trading with you", "being on your team", "seeing your room", "seeing your new creature", "in class with you today"] }
];
export const KIND_STICKERS = ["\u{1F31F}", "\u{1F496}", "\u{1F4AA}", "\u{1F308}", "\u{1F525}", "\u{1F3C6}", "\u{1F984}", "\u{1F680}", "\u{1F60A}", "\u{1F44F}"];
const OLD_MSGS = ["You did awesome today!", "You never give up!", "You make class fun!", "You're super smart!", "Thanks for being a great friend!", "Your streak is on fire!",
  "You're a champion!", "You brighten my day!", "You're going to the moon!", "You're really kind!", "Great job hitting your goal!", "You're one of a kind!"];

// The whole message for a shout-out, written to `to` (a student)
export function kindText(k, to) {
  const name = to ? to.name : "Friend", c = to && companionOf(to), pet = (to && to.petName) || (c && c.name) || "your companion";
  if (k.m != null && k.s == null) return { sticker: "\u{1F48C}", main: OLD_MSGS[k.m] || "", pet: "" };
  const S = KIND_STARTERS[k.s] || KIND_STARTERS[0], end = S.f[k.f] || S.f[0];
  const petLine = S.pet.replace("{pet}", pet);
  return { sticker: KIND_STICKERS[k.e] || "\u{1F48C}", main: name + ", " + (/^I\b/.test(S.t) ? S.t : S.t.charAt(0).toLowerCase() + S.t.slice(1)) + " " + end + "!", pet: petLine };
}
const daysAgo = n => { const d = new Date(); d.setDate(d.getDate() - n); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
// Every shout-out sent in the last week (newest first): { from, to, date, k, key }
export function recentKind(students, cls) {
  const since = daysAgo(KIND_DAYS), hide = (cls && cls.kindHide) || {}, out = [];
  students.forEach(s => Object.keys(s.kind || {}).forEach(date => {
    const k = s.kind[date]; if (!k || date < since || !k.to) return;
    const key = s.id + ":" + date; if (hide[key]) return;
    out.push({ from: s, to: k.to, date, k, key, at: k.at || date });
  }));
  return out.sort((a, b) => String(b.at).localeCompare(String(a.at)));
}
// Each student can get 1 shout-out a day: the ids of everyone who already got one today
export function gotKindToday(students, today) { const o = {}; students.forEach(s => { const k = (s.kind || {})[today]; if (k && k.to) o[k.to] = true; }); return o; }
export const inboxFor = (s, students, cls) => recentKind(students, cls).filter(k => k.to === s.id);
export const unthanked = (s, students, cls) => inboxFor(s, students, cls).filter(k => !(s.kindThanks || {})[k.key]);
const note = (t, extra) => '<span class="kindic">' + t.sticker + '</span><div>“' + esc(t.main) + "”" + (t.pet ? ' <span class="kindpet">' + esc(t.pet) + "</span>" : "") + (extra || "") + "</div>";

export function kindCard(s, students, cls, ui) {
  if (cls && cls.kindOff) return "";
  const today = azToday(), mine = (s.kind || {})[today], mates = students.filter(x => x.id !== s.id && x.companionId).sort((a, b) => String(a.name).localeCompare(String(b.name)));
  const gotToday = gotKindToday(students, today);
  const inbox = inboxFor(s, students, cls), byId = id => students.find(y => y.id === id);
  let h = '<div class="card kindcard"><div class="card-head"><h2>\u{1F48C} Kindness Board</h2><span class="fact">1 shout-out a day</span></div>';
  if (inbox.length) h += '<div class="kindinbox">' + inbox.map(k => { const done = (s.kindThanks || {})[k.key];
    return '<div class="kindnote' + (done ? " seen" : " new") + '">' + note(kindText(k.k, s), "<small>from <b>" + esc(k.from.name) + "</b> · " + (k.date === today ? "today" : k.date.slice(5).replace("-", "/")) + "</small>") +
      (done ? '<span class="kindok" title="You sent a heart back">\u{1F496}</span>' : '<button class="btn small" data-kthanks="' + esc(k.key) + '">\u{1F496} Send a heart back</button>') + "</div>"; }).join("") + "</div>";
  else h += '<p class="small muted">No shout-outs in the last 2 days — send one and spread the kindness!</p>';
  if (mine) {
    const to = byId(mine.to), loved = to && (to.kindThanks || {})[s.id + ":" + today];
    h += '<div class="kindsent">✅ You sent <b>' + esc(to ? to.name : "a classmate") + "</b>: " + '<div class="kindnote">' + note(kindText(mine, to)) + "</div>" +
      (loved ? '<p class="small">\u{1F496} <b>' + esc(to.name) + " loved it!</b></p>" : '<p class="small muted">Come back tomorrow to send another!</p>') + "</div>";
  } else if (mates.length) {
    const to = byId(ui.to), S = ui.s != null ? KIND_STARTERS[ui.s] : null, ready = to && ui.s != null && ui.f != null && ui.e != null;
    h += '<h3 style="margin-top:12px;">Write a shout-out</h3>' +
      '<p class="small"><b>1.</b> Who is it for? <select id="kindTo"><option value="">Pick a classmate…</option>' +
      mates.map(x => '<option value="' + x.id + '"' + (ui.to === x.id ? " selected" : "") + (gotToday[x.id] ? " disabled" : "") + ">" + esc(x.name) + (gotToday[x.id] ? " (already got one today)" : "") + "</option>").join("") + "</select></p>" +
      '<p class="small" style="margin-top:8px;"><b>2.</b> Start your message:</p><div class="kindmsgs">' + KIND_STARTERS.map((x, i) => '<button class="kindmsg' + (ui.s === i ? " on" : "") + '" data-kstart="' + i + '">' + esc(x.t) + "…</button>").join("") + "</div>" +
      (S ? '<p class="small"><b>3.</b> Finish it:</p><div class="kindmsgs">' + S.f.map((x, i) => '<button class="kindmsg' + (ui.f === i ? " on" : "") + '" data-kend="' + i + '">…' + esc(x) + "</button>").join("") + "</div>" : "") +
      (S && ui.f != null ? '<p class="small"><b>4.</b> Pick a sticker:</p><div class="kindmsgs">' + KIND_STICKERS.map((x, i) => '<button class="kindmsg kindstk' + (ui.e === i ? " on" : "") + '" data-kstk="' + i + '">' + x + "</button>").join("") + "</div>" : "") +
      (ready ? '<p class="small" style="margin-top:8px;"><b>Preview:</b></p><div class="kindnote new">' + note(kindText({ s: ui.s, f: ui.f, e: ui.e }, to)) + "</div>" : "") +
      '<button class="btn" data-ksend="1" style="margin-top:10px;"' + (ready ? "" : " disabled") + ">\u{1F48C} Send it!</button>";
  }
  return h + "</div>";
}

// Teacher: the last 2 days of shout-outs, with a Hide button
export function kindAdmin(students, cls) {
  const list = recentKind(students, cls), byId = id => students.find(y => y.id === id);
  return '<div class="card"><div class="card-head"><h2>\u{1F48C} Kindness Board</h2><span class="fact">' + list.length + " in the last 2 days</span></div>" +
    '<p class="lede" style="font-size:13px;">Once a day students build a shout-out from sentence pieces (no typing), personalized with the classmate’s name and companion. Just for kindness — no XP or badges.</p>' +
    '<div class="row" style="margin:6px 0;"><button class="btn ghost small" data-act="kindToggle">' + (cls.kindOff ? "▶️ Turn the Kindness Board on" : "⏸️ Turn the Kindness Board off") + "</button></div>" +
    (list.length ? '<div class="kindadmin">' + list.map(k => { const to = byId(k.to);
      return '<div class="kindnote">' + note(kindText(k.k, to), "<small><b>" + esc(k.from.name) + "</b> → <b>" + esc(to ? to.name : "?") + "</b> · " + k.date.slice(5).replace("-", "/") + "</small>") +
        '<button class="btn ghost small" data-khide="' + esc(k.key) + '">Hide</button></div>'; }).join("") + "</div>" : '<p class="small muted">No shout-outs in the last 2 days.</p>') + "</div>";
}
