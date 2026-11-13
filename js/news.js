/* ---------- 📣 Announcements (Nov 9) ----------
   Ms. Ariana posts as many announcements as she likes (console → 📅 Daily → 📣 Announcements). Each one has a title,
   a message, an optional picture, a Show switch and an optional last day (it hides itself after that day).
   Saved on the class doc: cls.newsList = [ { id, title, text, on, end: "YYYY-MM-DD" | "", at, pic: picture doc id | "" } ].
   Pictures are in classes/<class>/news/<id> { img } (everyone signed in can read them, only teachers write; no rules change).
   The old single announcement (cls.news + news/pic) still shows until the first save in the new editor turns it into a list item.
   Students see them newest first on Checklist → 📣 Announcements and can react ONCE to each with a kind emote:
   saved on the student as nlike = { announcementId: emote } (one save per reaction; counts come from classmates' public cards). */
import { esc } from "./game.js?v=20261113e";
import { azToday } from "./collect.js?v=20261113e";

export const NEWS_EMOTES = [["heart", "❤️"], ["up", "\u{1F44D}"], ["party", "\u{1F389}"], ["smile", "\u{1F604}"], ["star", "\u{1F31F}"], ["clap", "\u{1F44F}"]];
const EMO = {}; NEWS_EMOTES.forEach(([k, e]) => { EMO[k] = e; });
export const isNewsEmote = k => !!EMO[k];

// every announcement (teacher view), newest first; the old single one comes in as id "legacy"
export function allNews(cls) {
  let l = Array.isArray(cls && cls.newsList) ? cls.newsList.slice() : null;
  if (!l) { const n = cls && cls.news; l = n && (n.title || n.text || n.pic) ? [{ id: "legacy", title: n.title || "", text: n.text || "", on: !!n.on, end: "", at: n.at || "", pic: n.pic ? "pic" : "" }] : []; }
  return l.sort((a, b) => String(b.at || "").localeCompare(String(a.at || "")));
}
const live = (n, d) => n && n.on && (n.title || n.text || n.pic) && (!n.end || n.end >= d);
export const shownNews = cls => { const d = azToday(); return allNews(cls).filter(n => live(n, d)).sort((a, b) => (b.pin ? 1 : 0) - (a.pin ? 1 : 0)); };
// ⭐ the starred one stays at the top of every page of the Keep (Nov 9)
export const pinnedNews = cls => shownNews(cls).find(n => n.pin) || null;
// a key that changes when anything students can see changes (the checklist's "read the announcements" step)
export function newsKeyOf(cls) {
  const l = shownNews(cls); if (!l.length) return "";
  let h = 7; for (const ch of l.map(n => n.id + "|" + (n.at || "") + "|" + n.title + "|" + n.text).join("#")) h = (h * 31 + ch.charCodeAt(0)) % 999983;
  return "news" + h;
}

const when = iso => { if (!iso) return ""; const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/Phoenix" }); };
// one announcement card. likes = { emote: count }, mine = this student's emote (or ""), canReact = show buttons
export function newsCard(n, pics, likes, mine, canReact) {
  const img = n.pic && pics ? pics[n.pic] : "";
  // a picture announcement: the picture already has the words, so it shows big, across the whole card (Nov 9)
  let h = '<div class="card newscard newsitem' + (img ? " haspic" : "") + '">' + (img ? '<img class="newsbig" src="' + esc(img) + '" alt="' + esc(n.title || "Announcement") + '">' : "") + '<div class="newstxt">' +
    (n.title ? "<h2>" + (n.pin ? "⭐ " : "") + esc(n.title) + "</h2>" : "") + (n.at ? '<span class="newsdate">' + esc(when(n.at)) + "</span>" : "") +
    (n.text ? "<p>" + esc(n.text).replace(/\n/g, "<br>") + "</p>" : "") +
    '<div class="newsemos">' + NEWS_EMOTES.map(([k, e]) => { const c = (likes || {})[k] || 0;
      return '<button class="newsemo' + (mine === k ? " mine" : "") + '"' + (canReact && !mine ? ' data-nemo="' + esc(n.id) + ":" + k + '"' : " disabled") + ' title="' + (mine === k ? "Your reaction" : "") + '">' + e + (c ? "<b>" + c + "</b>" : "") + "</button>"; }).join("") +
    (mine ? '<span class="newsmine">You reacted ' + EMO[mine] + "</span>" : canReact ? '<span class="newsmine">Tap one to react (you get one!)</span>' : "") + "</div></div></div>";
  return h;
}
export function likesFor(students, id) {
  const c = {}; (students || []).forEach(s => { const k = s && s.nlike && s.nlike[id]; if (EMO[k]) c[k] = (c[k] || 0) + 1; }); return c;
}
// the student's Announcements page
export function newsPage(st, cls, students, pics, preview, extra) {   // extra: other news (the Secret Students bar)
  const l = shownNews(cls);
  if (!l.length) return (extra || "") + '<div class="card"><h2>\u{1F4E3} Announcements</h2><p class="lede">No announcements right now. When the teacher posts one, it shows up here (and on your Checklist).</p></div>';
  return (extra || "") + l.map(n => newsCard(n, pics, likesFor(students, n.id), ((st && st.nlike) || {})[n.id] || "", !preview && !!st)).join("");
}
// the save for a reaction (only announcements still in the list are kept, so the field stays small)
export function reactSave(st, cls, id, k) {
  if (!EMO[k] || !st) return null; const mine = Object.assign({}, st.nlike || {}); if (mine[id]) return null;
  const ids = new Set(allNews(cls).map(n => n.id)); Object.keys(mine).forEach(x => { if (!ids.has(x)) delete mine[x]; });
  mine[id] = k; return { nlike: mine };
}

/* ---------- console editor ---------- */
export function newsAdminHTML(cls, students, pics, editing) {
  const l = allNews(cls), d = azToday(), shown = l.filter(n => live(n, d)).length;
  let h = '<div class="card newsadmin"><div class="card-head"><h2>\u{1F4E3} Announcements</h2><span class="fact">' + shown + " showing</span></div>" +
    '<p class="lede" style="font-size:13.5px;">Post as many as you like. Students see them on <b>Checklist → \u{1F4E3} Announcements</b> (newest first), get a "Read the announcements" step on their checklist, and can react once to each with a kind emote. Set a last day and it hides itself after that day. <b>⭐ Star one</b> to keep it at the top of every page of the Keep.</p>' +
    '<div class="row" style="margin:8px 0;"><button class="btn" data-act="newsAdd">➕ New announcement</button></div>';
  l.forEach(n => { const likes = likesFor(students, n.id), tot = Object.values(likes).reduce((a, b) => a + b, 0), img = n.pic && pics ? pics[n.pic] : "", ed = editing === n.id;
    h += '<div class="newsrow' + (live(n, d) ? " on" : "") + '"><div class="newsrowhead"><b>' + esc(n.title || "(no title)") + "</b>" +
      '<span class="small muted">' + (live(n, d) ? "✅ showing" : n.on && n.end && n.end < d ? "⏰ ended " + esc(n.end) : "hidden") + (n.at ? " · " + esc(when(n.at)) : "") +
      " · " + (tot ? NEWS_EMOTES.filter(([k]) => likes[k]).map(([k, e]) => e + " " + likes[k]).join("  ") : "no reactions yet") + "</span>" +
      '<button class="btn ghost small' + (n.pin ? " pinon" : "") + '" data-act="newsPin" data-nid="' + esc(n.id) + '" title="Starred = stays at the top of every student page">' + (n.pin ? "⭐ On top" : "☆ Star it") + "</button>" +
      '<button class="btn ghost small" data-nedit="' + esc(n.id) + '">' + (ed ? "Close" : "✏️ Edit") + "</button></div>";
    if (ed) h += '<div class="newsedit"><label class="modebox" style="margin:6px 0;"><input type="checkbox" id="nOn"' + (n.on ? " checked" : "") + "><span><b>Show it to students</b></span></label>" +
      '<div class="field"><label for="nTitle">Title</label><input id="nTitle" maxlength="80" value="' + esc(n.title || "") + '" placeholder="\u{1F986} Weekly Duck Race"></div>' +
      '<div class="field"><label for="nText">Message</label><textarea id="nText" rows="3" maxlength="600" placeholder="Ms. Ariana’s class is in the lead! Keep earning XP!">' + esc(n.text || "") + "</textarea></div>" +
      '<div class="field"><label for="nEnd">Last day to show it (optional)</label><input id="nEnd" type="date" value="' + esc(n.end || "") + '"></div>' +
      '<div class="row" style="gap:8px;align-items:center;flex-wrap:wrap;margin-top:6px;">' + (img ? '<img src="' + esc(img) + '" alt="" style="height:56px;border-radius:8px;">' : "") +
      '<label class="btn ghost small">\u{1F4F7} ' + (img ? "Change picture" : "Add a picture") + '<input type="file" id="nPicFile" data-nid="' + esc(n.id) + '" accept="image/*" style="display:none;"></label>' +
      (img ? '<button class="btn ghost small" data-act="newsPicDel" data-nid="' + esc(n.id) + '">Remove picture</button>' : "") +
      '<button class="btn small" data-act="newsItemSave" data-nid="' + esc(n.id) + '">Save</button>' +
      '<button class="btn ghost small" data-act="newsItemDel" data-nid="' + esc(n.id) + '" style="margin-left:auto;">\u{1F5D1}️ Delete</button></div></div>';
    h += "</div>"; });
  if (!l.length) h += '<p class="muted small">No announcements yet.</p>';
  if (shown) h += '<details class="newsprev"><summary>\u{1F440} How it looks on a student’s page</summary><div class="newsprevin">' + newsPage(null, cls, students, pics, true) + "</div></details>";
  return h + "</div>";
}
