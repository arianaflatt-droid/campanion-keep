/* ---------- 🎪 Mini events (2–3 day takeovers inside a season) ----------
   Ms. Ariana turns one on and off in the console (cls.mini = { key, id, on }).
   🎃 tot  = Trick-or-Treat Night (Haunt-O-Ween): knock on the 3 doors of a spooky street; Ghost & Dark creatures answer.
   🍂 fest = Fall Festival (Gobble-Palooza): Corn Maze, Pumpkin Patch, Ferris Wheel; Nature & Earth creatures.
   🎄 xmas = Holiday Express (Jingle Jam): train stops with a gift-guessing game, and Find the Hidden Elf; Ice creatures.
   📚 lib  = Library After Dark (any season, Oct 25): lanterns come from READING XP only (1 per 10 Reading XP today). Open glowing
             books in a spooky library: Ghost/Dark/Arcane creatures pop out with a silly riddle (right answer = double), or
             treasure, or a golden book (egg). 10 library-card stamps = an egg. Pays the current season's currency. No outfits.
   Tickets: 1 for every 10 XP today (best of morning / lunch / end-of-day numbers). Rewards are the season currency
   (candyBonus) and sometimes an egg (doorEggs). Each event has a "this time only" outfit shop (60 each, kept forever).
   While an event is on, every companion wears a random costume from it, and The Keep gets the event's colors.
   Saved on the student: mini = { id, used: { date: n }, cos, maze, stop, stamps, elf: { d, found, peek: [] }, got }
   plus outfits / outfitOn (game.js). */
import { esc, HEAD_FNS, OUTFITS, candyLeft, companionOf } from "./game.js?v=20261027a";
import { azToday, creature, FAMILIES } from "./collect.js?v=20261027a";
import { CREATURES } from "./creatures.js?v=20261027a";
import { xpOn } from "./surprise.js?v=20261027a";
import { SEASON, boostExtra } from "./game.js?v=20261027a";
import { todayReading, todayReadingBoosted } from "./readmap.js?v=20261027a";

export const PER_TICKET = 10, OUTFIT_COST = 60;
const typesOf = fam => { const f = FAMILIES.find(x => x.id === fam); const c = f && CREATURES.find(x => x.id === f.forms[0]); return (c && c.types) || []; };
const pool = (types, extra, skip) => FAMILIES.filter(f => !skip.includes(f.id) && (extra.includes(f.id) || (!f.event && typesOf(f.id).some(t => types.includes(t))))).map(f => f.id);

export const MINI = {
  tot: { key: "tot", name: "Trick-or-Treat Night", icon: "\u{1F383}", cur: "candy", coin: "\u{1F36C}", bg: "assets/tot/tot-street.webp", theme: "Haunt-O-Ween",
    fams: () => pool(["Ghost", "Dark"], ["L-27", "L-33", "L-41"], ["L-43", "L-45"]) },
  fest: { key: "fest", name: "Fall Festival", icon: "\u{1F342}", cur: "corn", coin: "\u{1F33D}", bg: "assets/fest/fest-fairground.webp", theme: "Gobble-Palooza",
    fams: () => pool(["Nature", "Earth"], ["L-29", "L-35", "L-42"], []).filter(f => !f.startsWith("L-") || ["L-29", "L-35", "L-42"].includes(f)) },
  xmas: { key: "xmas", name: "Holiday Express", icon: "\u{1F384}", cur: "presents", coin: "\u{1F381}", bg: "assets/xmas/xmas-station.webp", theme: "Jingle Jam",
    fams: () => pool(["Ice"], ["L-30", "L-36", "L-43"], []).filter(f => !f.startsWith("L-") || ["L-30", "L-36", "L-43"].includes(f)) },
  lib: { key: "lib", name: "Library After Dark", icon: "\u{1F4DA}", bg: "assets/lib/lib-library.webp", theme: "any season · Reading XP", reading: true, tix: "lantern", tixs: "lanterns",
    get cur() { return SEASON.cur || "candy"; }, get coin() { return SEASON.coin || "\u{1F36C}"; },
    fams: () => pool(["Ghost", "Dark", "Arcane"], [], []).filter(f => !f.startsWith("L-")) }
};
let FAMS = {};
const famsOf = k => (FAMS[k] = FAMS[k] || MINI[k].fams());

/* ---------- state helpers ---------- */
export const miniOn = cls => (cls && cls.mini && cls.mini.on && MINI[cls.mini.key] ? MINI[cls.mini.key] : null);
const mine = (st, cls) => { const m = st && st.mini; return m && cls && cls.mini && m.id === cls.mini.id ? m : { id: cls && cls.mini && cls.mini.id, used: {} }; };
// Reading counts double (Oct 25): on for Trick-or-Treat Night unless Ms. Ariana turns it off (cls.mini.readX2), off for the others unless she turns it on.
export const readX2 = cls => { const E = miniOn(cls); return !!E && !E.reading && (cls.mini.readX2 != null ? !!cls.mini.readX2 : E.key === "tot"); };
export function ticketsLeft(st, cls) { const d = azToday(), E = miniOn(cls), xp = E && E.reading ? todayReadingBoosted(st, cls) : xpOn(st, d) + (readX2(cls) ? todayReading(st, cls) : 0) + boostExtra(st, cls, d);   // ⚡ + the Subject Boost bonus
  return Math.max(0, Math.floor(xp / PER_TICKET) - (Number((mine(st, cls).used || {})[d]) || 0)); }
const tixWord = (E, n) => E.tix ? (n === 1 ? E.tix : E.tixs) : (n === 1 ? "ticket" : "tickets");
const hasShop = E => OUTFITS.some(o => o.ev === E.key);
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const hash = s => { let h = 7; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
const RW = [["Common", 45], ["Uncommon", 28], ["Rare", 15], ["Super Rare", 8], ["Legendary", 4]];
function visitor(k) {
  const all = famsOf(k).map(id => FAMILIES.find(f => f.id === id)).filter(Boolean);
  let r = Math.random() * 100, rar = "Common"; for (const [n, w] of RW) { if ((r -= w) < 0) { rar = n; break; } }
  let list = all.filter(f => f.rarity === rar); if (!list.length) list = all;
  const f = list[Math.floor(Math.random() * list.length)], c = creature(f.forms[Math.floor(Math.random() * f.forms.length)]);
  return { fam: f.id, rarity: f.rarity, name: c.name, img: c.img, n: amount(f.rarity) };
}
const amount = rar => (rar === "Legendary" ? rnd(15, 25) : rar === "Rare" || rar === "Super Rare" ? rnd(5, 8) : rnd(2, 4));

/* ---------- 🎭 the event costume on every companion ---------- */
let CLS = null;
HEAD_FNS.push(st => {
  const E = miniOn(CLS); if (!E || !st || st.isTeacher) return "";
  const list = OUTFITS.filter(o => o.ev === E.key), m = mine(st, CLS); if (!list.length) return "";
  return list[(m.cos != null ? m.cos : hash(st.id + CLS.mini.id)) % list.length].img;
});
// Call on every render (both pages): remembers the class for the costume and sets The Keep's event colors.
export function miniSync(cls) {
  CLS = cls; const E = miniOn(cls);
  ["tot", "fest", "xmas", "lib"].forEach(k => document.body.classList.toggle("mini-" + k, !!E && E.key === k));
}

/* ---------- lines ---------- */
const TOT_LINES = {
  "C-24": "Squeak squeak! That means trick or treat in bat!", "C-26": "Boo! Did I scare you? No? Okay, have candy anyway!",
  "C-41": "I nibbled the corners off a few. Shh!", "C-44": "I spun you a web… out of candy wrappers!",
  "U-11": "Woof! I'm dressed as a… scary puppy. Grrr! Candy?", "U-22": "Blub blub! I found these at the bottom of the swamp!",
  "U-31": "Whoo-whoo's there? A trick-or-treater! Here you go!", "U-36": "Happy Haunt-O-Ween! I carved my own face this year!",
  "U-40": "Psst… I'm invisible. You can't see me giving you candy.", "U-42": "Rawr! The moon told me you were coming!",
  "U-47": "I'm not scary, I'm just big-boned! Have a treat!", "R-03": "From the deep dark sea, a treat for thee!",
  "R-06": "I purr-fectly saved the best candy for you.", "R-10": "I dug these up in the pumpkin patch! Still good!",
  "R-14": "The night is young and so is this candy!", "R-18": "I fluttered all the way to the candy store for this!",
  "R-20": "Mushroom candy? No? Okay, regular candy!", "R-25": "Into the void… just kidding! It's for you!",
  "S-02": "Under the moonlight, every treat tastes sweeter!", "S-07": "My horns are scary but my heart is sweet!",
  "S-12": "I swooped down just to say Happy Haunt-O-Ween!", "S-19": "Gloom? Never! It's candy night!",
  "S-24": "I wrapped each piece in spider silk, extra fancy!", "S-29": "My mane is on fire with Haunt-O-Ween spirit!",
  "S-32": "Zoom! I glided through the shadows for you!", "L-02": "The stars spelled your name. Here's a star-sized treat!",
  "L-09": "You found my shadowy house! That deserves a BIG treat!", "L-15": "I saw you coming in a dream. Big handful for you!",
  "L-17": "From the bottom of the abyss… the biggest candy pile!", "L-20": "Rumble rumble! The graveyard gave up its treasure!",
  "L-22": "A potion of pure sweetness, just for you!", "L-27": "Quack-a-boo! My hex says you get extra candy!",
  "L-33": "I brewed this candy in my cauldron. Bubble bubble!", "L-34": "Meow from the void! Take it all!",
  "L-41": "Wooooo! I'm not haunting tonight, I'm sharing!"
};
const FEST_LINES = ["Happy harvest! Here's some corn for your basket!", "I was hiding in the hay. You found me!", "Want some apple cider? Here's corn instead!",
  "The leaves told me you were coming!", "I've been guarding this corn all day. It's yours!", "Crunch crunch! Fall is the best season!",
  "I picked this corn myself. Well, mostly!", "Hooray for the Fall Festival!", "Watch out for the scarecrow. He tickles!", "I love the smell of pumpkin pie!"];
const FEST_LEG = { "L-29": "Gobble gobble, friend! A harvest feast for you!", "L-35": "The harvest moon is full and so is this basket!", "L-42": "Turducken here! I share my corn with the brave!" };

/* ---------- 🎁 Holiday Express gifts ---------- */
const GIFTS = [
  { k: "mittens", name: "Mittens", img: "assets/xmas/gift-mittens.webp", ok: "cocoa",
    hints: ["I built a snow fort all day and now I can't feel my paws…", "My claws are chilly and my snowballs keep slipping!", "Something warm for the ends of my arms, please!"],
    perfect: "Mittens! Now I can build snow forts ALL day!", silly: "Mittens? But… I'll put them on my ears!" },
  { k: "cocoa", name: "Hot Cocoa", img: "assets/xmas/gift-cocoa.webp", ok: "cookies",
    hints: ["Brrr! I want something warm… with tiny clouds floating on top!", "My tummy is shivering. Something cozy and chocolatey?", "Something steamy in a mug would melt my frozen frown!"],
    perfect: "Hot cocoa with marshmallows! My tummy is toasty!", silly: "Hot cocoa? Ooh it's so hot it melted my ice cube!" },
  { k: "cookies", name: "Cookie Plate", img: "assets/xmas/gift-cookies.webp", ok: "cocoa",
    hints: ["I left a plate out for Santa but I ate them all. Oops!", "Something sweet shaped like stars and snowflakes, please!", "My nose smells sugar and sprinkles from far away…"],
    perfect: "Cookies! Star ones are my favorite! Crunch crunch!", silly: "Cookies? I can't eat them, I'm made of snow! …Okay one bite." },
  { k: "drum", name: "Toy Drum", img: "assets/xmas/gift-drum.webp", ok: "teddy",
    hints: ["Rum-pa-pum-pum! I want to march in the parade!", "I need something that goes BOOM BOOM BOOM… but in a nice way!", "I want to keep the beat for the holiday band!"],
    perfect: "A drum! RUM-PA-PUM-PUM! Best gift ever!", silly: "A drum? My paws are too cold to drum!" },
  { k: "teddy", name: "Teddy Bear", img: "assets/xmas/gift-teddy.webp", ok: "book",
    hints: ["The nights are long and I need a fluffy friend to hug…", "I want a buddy who's soft, brown and never lets go!", "Something cuddly for my cave, please!"],
    perfect: "A teddy bear! I'll hug it every night!", silly: "A teddy? It's bigger than me! …Okay, I'll ride it." },
  { k: "book", name: "Storybook", img: "assets/xmas/gift-book.webp", ok: "globe",
    hints: ["I love adventures… that I can hold in my claws and turn the pages!", "Once upon a time… I wanted to know what happens next!", "Something with lots of pages and a happy ending?"],
    perfect: "A storybook! I'll read it by the fire tonight!", silly: "A book? I can only read upside down! …Still nice!" },
  { k: "paint", name: "Paint Set", img: "assets/xmas/gift-paint.webp", ok: "book",
    hints: ["Everything here is white! I want to add some rainbow!", "I want to make a picture of the northern lights!", "Swish swish with a brush, that's my dream!"],
    perfect: "A paint set! I'll paint the snow every color!", silly: "Paint? I just painted myself green by accident!" },
  { k: "globe", name: "Snow Globe", img: "assets/xmas/gift-globe.webp", ok: "paint",
    hints: ["I want a tiny little world that snows when I shake it!", "Something round and sparkly with a teeny cottage inside?", "I miss home. If only I could hold a snowy village in my paw…"],
    perfect: "A snow globe! Shake shake, it's snowing inside!", silly: "A snow globe? I live IN a snow globe! …Wait, do I?" }
];
const favOf = fam => GIFTS[hash(fam) % GIFTS.length];
const STOPS = ["Snowy Forest", "Candy Cane Forest", "Gingerbread Town", "Frozen Lake", "Village Square", "Toy Factory", "Northern Lights", "North Pole"];
const ELF_SPOTS = [["Stockings", 24, 33], ["Fireplace", 25, 46], ["Bookshelf", 45, 25], ["Christmas Tree", 61, 38], ["Gifts under the tree", 58, 60], ["Window", 76, 25],
  ["Rocking Chair", 82, 58], ["Couch", 8, 70], ["Coffee Table", 37, 74], ["Toy Train", 70, 88], ["Poinsettia", 92, 84], ["Gift Pile", 12, 90]];

/* ---------- student card (My Companion) ---------- */
export function miniCard(st, cls) {
  const E = miniOn(cls); if (!E) return "";
  const t = ticketsLeft(st, cls);
  return '<div class="card minicard mc-' + E.key + '"><div class="mctxt"><h3>' + E.icon + " " + E.name + '!</h3><p><b>' + t + "</b> " + tixWord(E, t) +
    " · 1 " + tixWord(E, 1) + " for every " + PER_TICKET + (E.reading ? " <b>Reading</b>" : "") + " XP today." + (readX2(cls) ? " \u{1F4DA} <b>Reading XP counts double!</b>" : "") + " You have <b>" + candyLeft(st).toLocaleString() + " " + E.coin + "</b>.</p>" +
    '<button class="btn gold" data-mini="open">' + (E.key === "tot" ? "\u{1F6AA} Go trick-or-treating!" : E.key === "fest" ? "\u{1F3A1} Go to the festival!" : E.key === "lib" ? "\u{1F56F}️ Sneak into the library!" : "\u{1F682} Go to the station!") + "</button> " +
    (hasShop(E) ? '<button class="btn ghost" data-mini="shop">\u{1F6CD}️ Outfit shop</button>' : "") + "</div></div>";
}

/* ---------- the event screen (overlay) ---------- */
let G = null;
export const miniBusy = () => !!G;
const top = (E, st, cls, back) => '<div class="qbtop"><b>' + E.icon + " " + E.name + " · " + (E.reading ? '<img class="lantic" src="assets/lib/lib-lantern.webp" alt="lanterns"> ' : "\u{1F39F}️ ") + ticketsLeft(st, cls) + " · " + candyLeft(st).toLocaleString() + " " + E.coin + "</b><span>" +
  (back ? '<button class="btn ghost small" data-mini="' + back + '">⬅️ Back</button> ' : "") + (hasShop(E) ? '<button class="btn ghost small" data-mini="shop">\u{1F6CD}️ Shop</button> ' : "") + '<button class="btn ghost small" data-mini="close">✕</button></span></div>';
let noTix = "";
const noTixFor = E => '<p class="mnotix">No ' + tixWord(E, 2) + " left! Read " + PER_TICKET + " more" + (E.reading ? " <b>Reading</b>" : "") + " XP for another one.</p>";
const visHTML = (v, line) => '<div class="mvisit r-' + v.rarity.replace(" ", "") + '"><img src="' + esc(v.img) + '" alt=""><div class="mbubble"><b>' + esc(v.name) + "</b> <small>" + esc(v.rarity) + "</small><br>" + esc(line) + "</div></div>";
const gotHTML = (E, n, egg) => '<div class="mgot">+' + n + " " + E.coin + (egg ? " · \u{1F95A} an egg!" : "") + "</div>";

export function miniOverlay(st, cls) {
  const E = miniOn(cls); if (!G || !E || !st) { if (G && !E) G = null; return ""; }
  const m = mine(st, cls), t = ticketsLeft(st, cls); noTix = noTixFor(E);
  const bgs = 'style="background-image:url(' + esc(G.bg || E.bg) + ')"';
  let h = '<div class="qbover mover mo-' + E.key + '">';
  if (G.view === "shop") {
    const list = OUTFITS.filter(o => o.ev === E.key), own = st.outfits || {};
    h += top(E, st, cls, "hub") + '<div class="qbpanel mshop"><h3>\u{1F6CD}️ ' + esc(E.name) + ' Outfit Shop</h3><p class="small">This time only! ' + OUTFIT_COST + " " + E.coin + " each. Keep it forever and wear it any time from your Gear.</p>" +
      (E.key === "lib" ? '<h4 class="mshoph">\u{1F45B} Outfits</h4>' : "") + '<div class="mshopgrid">' + list.map(o => '<div class="mitem' + (own[o.id] ? " own" : "") + '"><img src="' + o.img + '" alt=""><b>' + esc(o.name) + "</b>" +
        (own[o.id] ? "<small>✅ Yours!</small>" : '<button class="btn small" data-mini="buy" data-o="' + o.id + '"' + (candyLeft(st) < OUTFIT_COST ? " disabled" : "") + ">" + OUTFIT_COST + " " + E.coin + "</button>") + "</div>").join("") + "</div>" + (E.key === "lib" ? furnHTML(st, E) : "") + "</div>";
    return h + "</div>";
  }
  if (E.key === "tot") {
    h += top(E, st, cls) + '<div class="mstage" ' + bgs + '>';
    if (!G.res) h += [["purple", 21.5, 51], ["teal", 48, 51], ["red", 82.5, 52]].map(([c, x, y], i) => '<button class="mdoor' + (G.knock === i ? " knock" : "") + '" style="left:' + x + "%;top:" + y + '%" data-mini="knock" data-i="' + i + '"' + (t ? "" : " disabled") + ' aria-label="Knock on the ' + c + ' door">✊</button>').join("") +
      '<div class="mhint">' + (t ? "Tap a door to knock!" : noTix) + "</div>";
    else h += '<div class="mpop"><div class="mdoorbox"><img class="mdoorimg" src="assets/tot/tot-door-open-' + G.res.door + '.webp" alt=""><img class="mdoorpet" src="' + esc(G.res.v.img) + '" alt=""></div>' +
      '<div class="mbubble big"><b>' + esc(G.res.v.name) + "</b> <small>" + esc(G.res.v.rarity) + "</small><br>" + esc(G.res.line) + "</div>" + gotHTML(E, G.res.v.n) +
      '<button class="btn big" data-mini="next">' + (t ? "\u{1F6AA} Next door!" : "Done") + "</button></div>";
    return h + "</div></div>";
  }
  if (E.key === "fest") {
    if (G.view === "hub") {
      h += top(E, st, cls) + '<div class="mstage" ' + bgs + '>' + [["maze", "\u{1F33D} Corn Maze", 10, 42], ["patch", "\u{1F383} Pumpkin Patch", 50, 58], ["ferris", "\u{1F3A1} Ferris Wheel", 88, 34]]
        .map(([k, l, x, y]) => '<button class="mspot" style="left:' + x + "%;top:" + y + '%" data-mini="go" data-v="' + k + '">' + l + "</button>").join("") +
        '<div class="mhint">' + (t ? "Pick where to spend your tickets!" : noTix) + "</div></div>";
    } else if (G.view === "maze") {
      const step = Number(m.maze) || 0;
      h += top(E, st, cls, "hub") + '<div class="mstage" ' + bgs + '>' + (G.res ? '<div class="mpop">' + (G.res.center ? '<h2>\u{1F31F} You reached the center of the maze!</h2>' : "") +
          (G.res.v ? visHTML(G.res.v, G.res.line) : '<p class="mfound">' + esc(G.res.line) + "</p>") + gotHTML(E, G.res.n, G.res.egg) + '<button class="btn big" data-mini="ok">Keep going!</button></div>'
        : '<div class="mmaze"><div class="mstep">Turn ' + (step + 1) + " of 10</div><div class=\"mbar\"><span style=\"width:" + step * 10 + '%"></span></div>' +
          (t ? '<button class="btn big" data-mini="turn">⬅️ Left</button><button class="btn big" data-mini="turn">Right ➡️</button>' : noTix) + "</div>") + "</div>";
    } else if (G.view === "patch") {
      h += top(E, st, cls, "hub") + '<div class="mstage" ' + bgs + '>' + (G.res ? '<div class="mpop">' + (G.res.gold ? '<img class="mbigimg" src="assets/fest/fest-pumpkin-gold.webp" alt=""><h2>A giant golden pumpkin!</h2>' : "") +
          (G.res.v ? visHTML(G.res.v, G.res.line) : !G.res.gold ? '<p class="mfound">' + esc(G.res.line) + "</p>" : "") + gotHTML(E, G.res.n) + '<button class="btn big" data-mini="ok">Pick another!</button></div>'
        : '<div class="mpatch">' + Array.from({ length: 9 }, (_, i) => '<button class="mpump" data-mini="pick"' + (t ? "" : " disabled") + ' style="--d:' + (i * 0.13) + 's"><img src="assets/fest/fest-pumpkin.webp" alt="Pumpkin"></button>').join("") + "</div>" + (t ? '<div class="mhint">Tap a pumpkin!</div>' : '<div class="mhint">' + noTix + "</div>")) + "</div>";
    } else {
      h += top(E, st, cls, "hub") + '<div class="mstage" ' + bgs + '>' + (G.res ? '<div class="mpop sky">' + (G.res.kind === "balloon" ? '<img class="mbigimg float" src="assets/fest/fest-balloon.webp" alt="">' : G.res.kind === "leaves" ? '<div class="mleaves">\u{1F341}\u{1F342}\u{1F343}\u{1F341}\u{1F342}</div>' : "") +
          (G.res.v ? visHTML(G.res.v, G.res.line) : '<p class="mfound">' + esc(G.res.line) + "</p>") + gotHTML(E, G.res.n) + '<button class="btn big" data-mini="ok">Ride again!</button></div>'
        : '<div class="mhint">' + (t ? '<button class="btn big gold" data-mini="ride">\u{1F3A1} Ride to the top!</button>' : noTix) + "</div>") + "</div>";
    }
    return h + "</div>";
  }
  if (E.key === "lib") {
    const stamps = Number(m.books) || 0;
    h += top(E, st, cls) + '<div class="mstage libstage" ' + bgs + '>';
    if (G.res) {
      const r = G.res;
      h += '<div class="mpop libpop">' + (r.gold ? '<img class="mbigimg pop" src="assets/lib/lib-book-gold.webp" alt=""><h2>A golden book!</h2>' : "") + (r.v ? visHTML(r.v, r.line) : '<p class="mfound">' + esc(r.line) + "</p>") +
        (r.q && r.ans == null ? '<p class="libq">\u{1F914} ' + esc(r.q.q) + '</p><div class="libans">' + r.q.opts.map((o, i) => '<button class="btn" data-mini="answer" data-i="' + i + '">' + esc(o) + "</button>").join("") + "</div>"
          : (r.q ? '<p class="libq ' + (r.right ? "ok" : "no") + '">' + (r.right ? "\u{1F389} You got it! Double " + E.cur + "!" : "\u{1F605} Nice try! The answer was <b>" + esc(r.q.opts[r.q.a]) + "</b>.") + "</p>" : "") +
            gotHTML(E, r.n, r.egg) + (r.stampEgg ? "<p>\u{1F4DA} Your library card is full: a bonus egg! A new card starts.</p>" : "") + '<button class="btn big" data-mini="ok">Open another book</button>') + "</div>";
    } else {
      // 12 books standing on the three middle shelves of the big empty bookcase (shelf tops at 29.4%, 40.9%, 52% of the picture)
      h += [29.4, 40.9, 52].map((y, row) => [36.2, 44.6, 54.6, 63].map((x, col) => { const i = row * 4 + col, tilt = [-4, 3, -2, 5, 2, -5, 4, -3, -6, 2, 5, -2][i];
          return '<button class="libbook" data-mini="book" data-i="' + i + '"' + (t ? "" : " disabled") + ' aria-label="Open a glowing book" style="left:' + x + "%;top:" + y + "%;--t:" + tilt + "deg;--d:" + (i * 0.17) + 's"><img src="assets/lib/lib-book-' + (((i + row) % 4) + 1) + '.webp" alt=""></button>'; }).join("")).join("") +
        '<div class="libcard">\u{1F4C7} Library card: ' + Array.from({ length: 10 }, (_, i) => '<span class="' + (i < stamps % 10 ? "on" : "") + '">' + (i < stamps % 10 ? "\u{1F56F}️" : "·") + "</span>").join("") + "</div>" +
        '<div class="mhint">' + (t ? "Tap a glowing book to open it… if you dare!" : noTix) + "</div>";
    }
    return h + "</div></div>";
  }
  // 🎄 xmas
  if (G.view === "hub") {
    const stamps = Number(m.stamps) || 0, stop = Number(m.stop) || 0;
    h += top(E, st, cls) + '<div class="mstage" ' + bgs + '><div class="mxhub"><button class="mspot big" data-mini="go" data-v="train">\u{1F682} Board the Holiday Express<small>Next stop: ' + STOPS[stop] + "</small></button>" +
      '<button class="mspot big" data-mini="go" data-v="elf">\u{1F9DD} Find the Hidden Elf<small>' + (((m.elf || {}).d === azToday() && m.elf.found) ? "✅ Found today!" : "He hid somewhere new today!") + "</small></button></div>" +
      '<div class="mstamps">' + STOPS.map((s, i) => '<span class="' + (i < stop ? "on" : "") + '" title="' + s + '">' + (i < stop ? "⭐" : i + 1) + "</span>").join("") + "<small>" + stamps + " stamps collected</small></div>" +
      '<div class="mhint">' + (t ? "" : noTix) + "</div></div>";
  } else if (G.view === "train") {
    const stop = Number(m.stop) || 0;
    if (!G.ride) h += top(E, st, cls, "hub") + '<div class="mstage" ' + bgs + '><div class="mhint">' + (t ? '<button class="btn big gold" data-mini="ride">\u{1F682} Ride to the ' + STOPS[stop] + "!</button>" : noTix) + "</div></div>";
    else if (!G.res) {
      const v = G.ride.v;
      h += top(E, st, cls) + '<div class="mstage" ' + bgs + '><div class="mpop">' + visHTML(v, "\u{1F50D} " + G.ride.hint) + '<p class="small">Which gift fits best?</p><div class="mgifts">' +
        G.ride.choices.map(g => '<button class="mgift" data-mini="give" data-g="' + g.k + '"><img src="' + g.img + '" alt=""><b>' + g.name + "</b></button>").join("") + "</div></div></div>";
    } else {
      const r = G.res;
      h += top(E, st, cls, "hub") + '<div class="mstage" ' + bgs + '><div class="mpop ' + r.match + '">' + '<div class="mreact">' + (r.match === "perfect" ? "\u{1F60D} PERFECT MATCH!" : r.match === "ok" ? "\u{1F60A} Nice gift!" : "\u{1F92A} Silly gift!") + "</div>" +
        visHTML(G.ride.v, r.line) + gotHTML(E, r.n, r.egg) + (r.egg ? "<p>\u{1F385} You made it to the North Pole! The train heads back to the start.</p>" : "<p>⭐ Stamp collected: " + STOPS[r.at] + "</p>") +
        '<button class="btn big" data-mini="hub">Back to the station</button></div></div>';
    }
  } else {
    const d = azToday(), e = (m.elf && m.elf.d === d) ? m.elf : { d, peek: [] };
    h += top(E, st, cls, "hub") + '<div class="mstage" ' + bgs + '>' + (G.res ? '<div class="mpop">' + (G.res.elf ? '<img class="mbigimg pop" src="assets/xmas/xmas-elf.webp" alt="The elf"><h2>You found the elf!</h2>' : "") +
        (G.res.v ? visHTML(G.res.v, G.res.line) : !G.res.elf ? '<p class="mfound">' + esc(G.res.line) + "</p>" : "") + gotHTML(E, G.res.n, G.res.egg) + '<button class="btn big" data-mini="ok">Keep looking</button></div>'
      : ELF_SPOTS.map(([n, x, y], i) => '<button class="mpeek' + ((e.peek || []).includes(i) ? " done" : "") + '" style="left:' + x + "%;top:" + y + '%" data-mini="peek" data-i="' + i + '"' + (t && !(e.peek || []).includes(i) ? "" : " disabled") + ' aria-label="Peek behind the ' + n + '">✨</button>').join("") +
        '<div class="mhint">' + (e.found ? "✅ You found the elf today! Peek around for more " + E.cur + "." : t ? "Tap a ✨ to peek behind it. Where's the elf hiding?" : noTix) + "</div>") + "</div>";
  }
  return h + "</div>";
}

/* ---------- clicks ---------- */
export async function miniClick(el, c) {
  const a = el.dataset.mini, s = c.me, cls = c.cls, E = miniOn(cls); if (!E || !s) return;
  const m = Object.assign({}, mine(s, cls)), d = azToday(), t = ticketsLeft(s, cls);
  if (a === "open") { G = { view: "hub", bg: E.bg }; return c.render(true); }
  if (a === "close") { G = null; return c.render(true); }
  if (a === "shop") { G = Object.assign({}, G || {}, { view: "shop", res: null, bg: E.bg }); return c.render(true); }
  if (a === "hub") { G = { view: "hub", bg: E.bg }; return c.render(true); }
  if (a === "buyFurn" && E.key === "lib") {
    const f = LIB_FURN.find(x => x[0] === el.dataset.k); if (!f) return;
    const id = f[0] + "_library", have = s.roomOwned || [];
    if (have.includes(id) || candyLeft(s) < f[2]) return;
    await c.patch({ roomOwned: have.concat([id]), candySpent: (Number(s.candySpent) || 0) + f[2], roomBuys: (s.roomBuys || []).concat([{ id, cost: f[2], cur: E.cur, at: new Date().toISOString() }]) }, true);
    c.flash("\u{1F6CB}️ " + f[1] + " is yours! Put it in your room from My Room.", true); return c.render(true);
  }
  if (a === "buy") {
    const o = OUTFITS.find(x => x.id === el.dataset.o); if (!o || (s.outfits || {})[o.id] || candyLeft(s) < OUTFIT_COST) return;
    await c.patch({ outfits: Object.assign({}, s.outfits || {}, { [o.id]: true }), candySpent: (Number(s.candySpent) || 0) + OUTFIT_COST }, true);
    c.flash("\u{1F3AD} " + o.name + " is yours! Wear it from the Gear card.", true); return c.render(true);
  }
  if (a === "go") { const v = el.dataset.v; G = { view: v, bg: { maze: "assets/fest/fest-maze.webp", patch: "assets/fest/fest-patch.webp", ferris: "assets/fest/fest-ferris-top.webp", train: "assets/xmas/xmas-station.webp", elf: "assets/xmas/xmas-livingroom.webp" }[v] }; return c.render(true); }
  if (a === "ok" || a === "next") { G.res = null; if (E.key === "fest" && G.view === "maze") G.bg = "assets/fest/fest-maze.webp"; return c.render(true); }
  if (a === "answer" && E.key === "lib" && G && G.res && G.res.q && G.res.ans == null) {
    const r = G.res, i = Number(el.dataset.i); r.ans = i; r.right = i === r.q.a;
    if (r.right) { r.n *= 2; chime(3); } else chime(1);
    G.busy = true; try { const mm = Object.assign({}, mine(s, cls)); mm.got = (Number(mm.got) || 0) + r.n; const data = { mini: mm, candyBonus: (Number(s.candyBonus) || 0) + r.n }; if (r.egg) data.doorEggs = (Number(s.doorEggs) || 0) + 1; await c.patch(data, true); } finally { G.busy = false; }
    return c.render(true);
  }
  if (!t) return;
  if (G && G.busy) return;
  const use = () => { m.used = Object.assign({}, m.used || {}); m.used[d] = (Number(m.used[d]) || 0) + 1; if (m.cos == null) m.cos = hash(s.id + cls.mini.id) % 8; };
  const pay = (n, egg) => { m.got = (Number(m.got) || 0) + n; const data = { mini: m, candyBonus: (Number(s.candyBonus) || 0) + n }; if (egg) data.doorEggs = (Number(s.doorEggs) || 0) + 1; return data; };
  if (a === "knock") {
    const i = Number(el.dataset.i); G.knock = i; G.busy = true; knockSound(); c.render(true);
    await new Promise(r => setTimeout(r, 900));
    const v = visitor("tot"); use(); G.busy = false; G.knock = null;
    G.res = { door: ["purple", "teal", "red"][i], v, line: TOT_LINES[v.fam] || "Happy Haunt-O-Ween!" };
    chime(); await c.patch(pay(v.n), true); return c.render(true);
  }
  if (a === "turn") {
    use(); const step = (Number(m.maze) || 0) + 1, center = step >= 10; m.maze = center ? 0 : step;
    let n, v = null, line;
    if (Math.random() < 0.35) { v = visitor("fest"); n = v.n; line = FEST_LEG[v.fam] || FEST_LINES[Math.floor(Math.random() * FEST_LINES.length)]; }
    else { n = rnd(2, 4); line = ["You found corn tucked in the stalks!", "A little pile of corn around the corner!", "Corn fell out of a scarecrow's pocket!"][rnd(0, 2)]; }
    G.res = { v, n, line, center, egg: center }; if (center) G.bg = "assets/fest/fest-maze-center.webp";
    chime(); await c.patch(pay(n, center), true); return c.render(true);
  }
  if (a === "pick") {
    use(); const r = Math.random(); let res;
    if (r < 0.05) res = { gold: true, n: 30, line: "" };
    else if (r < 0.35) { const v = visitor("fest"); res = { v, n: v.n, line: FEST_LEG[v.fam] || "I was napping in this pumpkin! " + FEST_LINES[rnd(0, FEST_LINES.length - 1)] }; }
    else res = { n: rnd(2, 4), line: "This pumpkin was full of corn!" };
    G.res = res; chime(); await c.patch(pay(res.n), true); return c.render(true);
  }
  if (a === "ride" && E.key === "fest") {
    use(); const r = Math.random(); let res;
    if (r < 0.4) { const v = visitor("fest"); res = { kind: "fly", v, n: v.n, line: FEST_LEG[v.fam] || "Whoosh! I flew right past your seat! " + FEST_LINES[rnd(0, FEST_LINES.length - 1)] }; }
    else if (r < 0.7) res = { kind: "balloon", n: rnd(5, 10), line: "A hot-air balloon floated by and dropped corn into your seat!" };
    else res = { kind: "leaves", n: rnd(2, 4), line: "A swirl of leaves blew by… with a little corn inside!" };
    G.res = res; chime(); await c.patch(pay(res.n), true); return c.render(true);
  }
  if (a === "ride" && E.key === "xmas") {
    const stop = Number(m.stop) || 0, v = visitor("xmas"), fav = favOf(v.fam), ok = GIFTS.find(g => g.k === fav.ok);
    const others = GIFTS.filter(g => g.k !== fav.k && g.k !== ok.k).sort(() => Math.random() - 0.5);
    const choices = [fav, Math.random() < 0.6 ? ok : others[1], others[0]].sort(() => Math.random() - 0.5);
    G.ride = { v, hint: fav.hints[rnd(0, 2)], choices, at: stop }; G.res = null; G.bg = "assets/xmas/xmas-stop-" + (stop + 1) + ".webp"; trainSound(); return c.render(true);
  }
  if (a === "give" && G.ride && !G.res) {
    const g = GIFTS.find(x => x.k === el.dataset.g), v = G.ride.v, fav = favOf(v.fam);
    const match = g.k === fav.k ? "perfect" : g.k === fav.ok ? "ok" : "silly";
    const n = match === "perfect" ? v.n * 2 : match === "ok" ? v.n : 1;
    use(); const at = Number(m.stop) || 0, egg = at === 7; m.stop = egg ? 0 : at + 1; m.stamps = (Number(m.stamps) || 0) + 1;
    G.res = { match, n, egg, at, line: match === "perfect" ? fav.perfect : match === "ok" ? "Ooh, a " + g.name.toLowerCase() + "! Not my favorite, but I love it!" : g.silly };
    chime(match === "perfect" ? 3 : 1); await c.patch(pay(n, egg), true); return c.render(true);
  }
  if (a === "book" && E.key === "lib") {
    use(); m.books = (Number(m.books) || 0) + 1; const stampEgg = m.books % 10 === 0, r = Math.random(); let res;
    if (r < 0.05) res = { gold: true, n: 15, egg: true, line: "The pages glow gold… there\u2019s an egg tucked inside!" };
    else if (r < 0.55) { const v = visitor("lib"), q = RIDDLES[rnd(0, RIDDLES.length - 1)]; res = { v, n: v.n, line: LIB_LINES[rnd(0, LIB_LINES.length - 1)], q }; }
    else if (r < 0.85) res = { n: rnd(3, 6), line: ["A pile of " + E.cur + " was pressed between the pages like a flower!", "The book was hollow inside… and full of " + E.cur + "!", "A bookmark made of " + E.cur + "! Yum."][rnd(0, 2)] };
    else res = { n: rnd(2, 4), line: STORY_PAGES[rnd(0, STORY_PAGES.length - 1)] };
    res.stampEgg = stampEgg; if (stampEgg) res.egg = true;
    G.res = res; chime(res.gold ? 3 : 1);
    if (!res.q) await c.patch(pay(res.n, res.egg), true);
    else await c.patch({ mini: m }, true);   // the ticket is used now; the currency comes with the answer
    return c.render(true);
  }
  if (a === "peek") {
    const i = Number(el.dataset.i), e = (m.elf && m.elf.d === d) ? Object.assign({}, m.elf) : { d, peek: [], found: false };
    if ((e.peek || []).includes(i)) return;
    e.peek = (e.peek || []).concat([i]); use();
    const spot = hash(s.id + d + cls.mini.id) % ELF_SPOTS.length; let res;
    if (i === spot && !e.found) { e.found = true; res = { elf: true, n: 25, egg: true }; }
    else if (Math.random() < 0.4) { const v = visitor("xmas"); res = { v, n: v.n, line: "Hee hee! I was hiding behind the " + ELF_SPOTS[i][0].toLowerCase() + " too! Merry Jingle Jam!" }; }
    else res = { n: rnd(2, 4), line: "No elf here… but you found " + E.cur + " behind the " + ELF_SPOTS[i][0].toLowerCase() + "!" };
    m.elf = e; G.res = res; chime(res.elf ? 3 : 1); await c.patch(pay(res.n, res.egg), true); return c.render(true);
  }
}

/* ---------- 📚 Library After Dark: the Midnight Library room set (room.js item ids kind_library) ---------- */
const LIB_FURN = [["bed", "Midnight Library Bed", 120], ["chair", "Reading Armchair", 80], ["wallpaper", "Bookshelf Wallpaper", 80], ["flooring", "Starry Wood Floor", 80],
  ["ceiling", "Book Chandelier", 80], ["rug", "Moon & Stars Rug", 60], ["wall_art", "Moonlit Tower Painting", 60], ["plant", "Ivy & Books", 60], ["shelf", "Hourglass & Cat", 60]];
function furnHTML(st, E) {
  const have = st.roomOwned || [], left = candyLeft(st);
  return '<h4 class="mshoph">\u{1F6CB}️ Midnight Library room set <small>(it goes in My Room)</small></h4><div class="mshopgrid">' + LIB_FURN.map(([k, n, p]) => { const own = have.includes(k + "_library");
    return '<div class="mitem furn' + (own ? " own" : "") + '"><img src="assets/room/' + k + '_library.webp" alt=""><b>' + esc(n) + "</b>" +
      (own ? "<small>✅ Yours!</small>" : '<button class="btn small" data-mini="buyFurn" data-k="' + k + '"' + (left < p ? " disabled" : "") + ">" + p + " " + E.coin + "</button>") + "</div>"; }).join("") + "</div>";
}
/* ---------- 📚 Library After Dark: lines, story pages and silly riddles ---------- */
const LIB_LINES = ["Shhh! This is a library! …Okay, I'll whisper: BOO!", "I live between the pages. Thanks for opening my book!", "I've read this book 1,000 times. The ending is spooky!",
  "You found my reading nook! Want to hear a riddle?", "The librarian is asleep. Quick, a riddle!", "I'm the ghost of an overdue book. Riddle me this!",
  "Bookmarks are my favorite snack. Here's a riddle!", "I glow when someone reads nearby. That's YOU!"];
const STORY_PAGES = ["You read a page: \u201cThe dragon was afraid of… the dark? So it carried a flashlight.\u201d Some " + "treats fall out!",
  "You read a page: \u201cOnce upon a time, a duck became the queen of the moon.\u201d A few treats fall out!",
  "You read a page: \u201cThe haunted sock drawer whispered: match me!\u201d A few treats fall out!",
  "You read a page: \u201cThe end… OR IS IT?\u201d A few treats fall out!", "You read a page about a pirate who only said \u201cArrr-ticulate!\u201d A few treats fall out!"];
const RIDDLES = [
  { q: "What has pages but isn't a tree?", opts: ["A book", "A leaf", "A rock"], a: 0 },
  { q: "What has keys but can't open locks?", opts: ["A door", "A piano", "A car"], a: 1 },
  { q: "What gets wetter the more it dries?", opts: ["A towel", "A fish", "A cloud"], a: 0 },
  { q: "What has hands but can't clap?", opts: ["A glove", "A clock", "A robot"], a: 1 },
  { q: "What has a spine but no bones?", opts: ["A snake", "A book", "A cactus"], a: 1 },
  { q: "What goes up but never comes down?", opts: ["Your age", "A balloon", "A kite"], a: 0 },
  { q: "What has one eye but can't see?", opts: ["A pirate", "A needle", "A potato"], a: 1 },
  { q: "What can you catch but not throw?", opts: ["A ball", "A cold", "A fish"], a: 1 },
  { q: "What has a neck but no head?", opts: ["A bottle", "A giraffe", "A sweater"], a: 0 },
  { q: "What runs but never walks?", opts: ["A cheetah", "Water", "A clock"], a: 1 },
  { q: "What has words but never speaks?", opts: ["A book", "A parrot", "A radio"], a: 0 },
  { q: "What has teeth but can't bite?", opts: ["A shark", "A comb", "A baby"], a: 1 },
  { q: "What do you call a sleeping dinosaur?", opts: ["A dino-snore", "A T-rest", "Both are funny!"], a: 2 },
  { q: "Why did the ghost go into the library?", opts: ["To find a BOO-k", "To get a snack", "To take a nap"], a: 0 },
  { q: "What is full of holes but still holds water?", opts: ["A sponge", "A bucket", "A net"], a: 0 },
  { q: "What has a bottom at the top?", opts: ["Your legs", "A hat", "A tree"], a: 0 },
  { q: "What building has the most stories?", opts: ["A castle", "A library", "A skyscraper"], a: 1 },
  { q: "What can fill a room but takes up no space?", opts: ["Light", "Water", "A couch"], a: 0 },
  { q: "What has four wheels and flies?", opts: ["A plane", "A garbage truck", "A bird"], a: 1 },
  { q: "What kind of room has no doors or windows?", opts: ["A mushroom", "A closet", "A cave"], a: 0 },
  { q: "Why did the book join the police?", opts: ["To go under COVER", "To get a badge", "To catch bookworms"], a: 0 },
  { q: "What did one page say to the other?", opts: ["I'm board", "Turn around!", "Paper or plastic?"], a: 1 },
  { q: "What does a vampire read at night?", opts: ["Bite-time stories", "The news", "Comic books"], a: 0 },
  { q: "What has a head and a tail but no body?", opts: ["A coin", "A snake", "A comet"], a: 0 },
  { q: "The more you take, the more you leave behind. What are they?", opts: ["Footsteps", "Cookies", "Pictures"], a: 0 },
  { q: "What is always in front of you but can't be seen?", opts: ["The future", "Your nose", "The air"], a: 0 },
  { q: "What word is spelled wrong in every dictionary?", opts: ["Wrong", "Dictionary", "Spelling"], a: 0 },
  { q: "What kind of tree fits in your hand?", opts: ["A palm tree", "A pine tree", "A tiny tree"], a: 0 },
  { q: "What is an owl's favorite subject?", opts: ["Owl-gebra", "Science", "Hoo-story"], a: 0 },
  { q: "Where do books sleep?", opts: ["Under their covers", "On the shelf", "In a bookbed"], a: 0 }
];

/* ---------- The Keep banner + teacher controls ---------- */
export function miniBanner(students, cls) {
  const E = miniOn(cls); if (!E) return "";
  const kids = students.filter(s => s.companionId && !s.isTeacher), d = azToday();
  const used = kids.reduce((n, s) => n + (Number(((mine(s, cls).used) || {})[d]) || 0), 0);
  return '<div class="minibanner mb-' + E.key + '"><b>' + E.icon + " " + E.name.toUpperCase() + "!</b> " + used + " " + tixWord(E, used) + " used today · earn 1 " + tixWord(E, 1) + " every " + PER_TICKET + (E.reading ? " Reading" : "") + " XP" + (readX2(cls) ? " · \u{1F4DA} Reading XP counts DOUBLE!" : "") + "</div>";
}
export function miniAdmin(students, cls) {
  const E = miniOn(cls), kids = students.filter(s => s.companionId && !s.isTeacher), d = azToday();
  let h = '<div class="card"><div class="card-head"><h2>\u{1F3AA} Mini events</h2><span class="fact">2–3 day takeovers</span></div>';
  if (E) {
    const used = kids.reduce((n, s) => n + (Number(((mine(s, cls).used) || {})[d]) || 0), 0), got = kids.reduce((n, s) => n + (Number(mine(s, cls).got) || 0), 0);
    const outs = kids.reduce((n, s) => n + OUTFITS.filter(o => o.ev === E.key && (s.outfits || {})[o.id]).length, 0);
    h += '<p><b>' + E.icon + " " + E.name + "</b> is on. Today: " + used + " " + tixWord(E, used) + " used · so far " + got.toLocaleString() + " " + E.coin + " given" + (hasShop(E) ? " · " + outs + " outfits bought." : ".") + (E.reading ? " Lanterns come from Reading XP only (1 per " + PER_TICKET + ")." : "") + "</p>" +
      (E.reading ? "" : '<label class="modebox" style="margin:6px 0;"><input type="checkbox" data-act="miniReadX2"' + (readX2(cls) ? " checked" : "") + '><span><b>\u{1F4DA} Reading XP counts double</b><small>Every 10 Reading XP gives 2 ' + tixWord(E, 2) + " instead of 1.</small></span></label>") +
      '<button class="btn ghost small" data-act="miniEnd">End ' + esc(E.name) + "</button>";
  } else h += '<p class="small muted">Students get 1 ticket for every ' + PER_TICKET + " XP and spend them for " + "their event currency, creatures and eggs. Every companion wears a costume and The Keep changes colors while it's on.</p>" +
    '<div class="row" style="gap:8px;flex-wrap:wrap;">' + Object.values(MINI).map(M => '<button class="btn small" data-act="miniStart" data-k="' + M.key + '">' + M.icon + " Start " + esc(M.name) + " <small>(" + esc(M.theme) + ")</small></button>").join("") + "</div>";
  return h + "</div>";
}
export function miniAction(act, el, cls) {
  if (act === "miniStart") { const k = el && el.dataset.k; return MINI[k] ? { mini: { key: k, id: k + "-" + Date.now(), on: true } } : null; }
  if (act === "miniEnd") return cls.mini ? { "mini.on": false } : null;
  if (act === "miniReadX2") return cls.mini ? { "mini.readX2": !readX2(cls) } : null;
  return null;
}

/* ---------- sounds (Web Audio, no files) ---------- */
let AC = null;
const ac = () => { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === "suspended") AC.resume(); return AC; } catch (e) { return null; } };
function thud(t) { const o = AC.createOscillator(), g = AC.createGain(); o.type = "sine"; o.frequency.setValueAtTime(180, t); o.frequency.exponentialRampToValueAtTime(60, t + 0.12); g.gain.setValueAtTime(0.6, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.15); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + 0.18); }
function knockSound() { if (!ac()) return; const t = AC.currentTime; thud(t); thud(t + 0.22); thud(t + 0.44); }
function chime(n) { if (!ac()) return; const t = AC.currentTime; [784, 988, 1175, 1568].slice(0, (n || 1) + 1).forEach((f, i) => { const o = AC.createOscillator(), g = AC.createGain(); o.type = "triangle"; o.frequency.value = f; g.gain.setValueAtTime(0.15, t + i * 0.09); g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.09 + 0.35); o.connect(g); g.connect(AC.destination); o.start(t + i * 0.09); o.stop(t + i * 0.09 + 0.4); }); }
function trainSound() { if (!ac()) return; const t = AC.currentTime; [0, 0.25].forEach(d => { const o = AC.createOscillator(), g = AC.createGain(); o.type = "square"; o.frequency.value = 520; g.gain.setValueAtTime(0.08, t + d); g.gain.exponentialRampToValueAtTime(0.001, t + d + 0.22); o.connect(g); g.connect(AC.destination); o.start(t + d); o.stop(t + d + 0.25); }); }
