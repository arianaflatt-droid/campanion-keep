/* ---------- 🎪 Mini events (2–3 day takeovers inside a season) ----------
   Ms. Ariana turns one on and off in the console (cls.mini = { key, id, on }).
   🎃 tot  = Trick-or-Treat Night (Haunt-O-Ween): knock on the 3 doors of a spooky street; Ghost & Dark creatures answer.
   🍂 fest = Fall Festival (Gobble-Palooza): Corn Maze, Pumpkin Patch, Ferris Wheel; Nature & Earth creatures.
   🎄 xmas = Holiday Express (Jingle Jam): train stops with a gift-guessing game, and Find the Hidden Elf; Ice creatures.
   📚 lib  = Library After Dark (any season, Oct 25): lanterns come from READING XP only (1 per 10 Reading XP today). Open glowing
             books in a spooky library: Ghost/Dark/Arcane creatures pop out with a silly riddle (right answer = double), or
             treasure, or a golden book (egg). 10 library-card stamps = an egg. Pays the current season's currency. No outfits.
   🍂 leaf = Leaf Pile Jump (fall, Oct 29): jumps come from READING XP only (1 per 10 Reading XP today). Jump into leaf piles in a fall
             park: Nature/Earth/Air creatures pop out with a fall riddle (right answer = double), or treasure, or a golden leaf (egg).
             10 leaves on the leaf collection card = an egg. Pays the current season's currency. Art: assets/leaf/ (falls back if missing).
   🎄 orn  = Ornament Hunt (December, Nov 3): hunts come from READING XP only (1 per 10 Reading XP). Tap an ornament on a giant tree:
             Ice/Light/Crystal creatures pop out with a winter riddle (right answer = double), or treasure, or a golden ornament (egg).
             10 ornaments in the Ornament Box = an egg. Pays the current season's currency. Art: assets/orn/.
   🌌 aur  = Northern Lights Camp (January, Nov 3): peeks come from READING XP only (1 per 10 Reading XP). Tap a glowing tent or lantern
             on the snow under the northern lights: Ice/Light/Dark creatures pop out with a winter-night riddle (right answer = double),
             or treasure, or the golden lantern (egg). 10 stars in the Star Jar = an egg. Art: assets/aur/. Room set: Aurora Camp (kind_aurora).
   💌 val  = Valentine Mailroom (February, Nov 3): letters come from READING XP only (1 per 10 Reading XP). Open a valentine in the post
             office mail slots: Light/Nature/Fire creatures pop out with a sweet riddle (right answer = double), or treasure, or the
             golden envelope (egg). 10 stamps in the Stamp Book = an egg. Art: assets/val/. Room set: Sweetheart Post Office (kind_valpost).
   🪁 kite = Kite Festival (March, Nov 4): pulls come from READING XP only (1 per 10 Reading XP). 9 kites fly over a spring hill
             (KITE_SPOTS); pull one down and an Air / Electric / Normal creature with a riddle, coins, a silly find or the golden
             kite (egg). Every pull ties a bow on the Kite Tail; 10 bows = an egg. Art: assets/kite/.
   Tickets: 1 for every 10 XP today (best of morning / lunch / end-of-day numbers). Rewards are the season currency
   (candyBonus) and sometimes an egg (doorEggs). Each event has a "this time only" outfit shop (60 each, kept forever).
   While an event is on, every companion wears a random costume from it, and The Keep gets the event's colors.
   Saved on the student: mini = { id, used: { date: n }, cos, maze, stop, stamps, elf: { d, found, peek: [] }, got }
   plus outfits / outfitOn (game.js). */
import { esc, HEAD_FNS, OUTFITS, candyLeft, companionOf } from "./game.js?v=20261109h";
import { azToday, creature, FAMILIES } from "./collect.js?v=20261109h";
import { CREATURES } from "./creatures.js?v=20261109h";
import { xpOn } from "./surprise.js?v=20261109h";
import { SEASON, boostExtra } from "./game.js?v=20261109h";
import { readingOn, readingOnBoosted } from "./readmap.js?v=20261109h";

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
    fams: () => pool(["Ghost", "Dark", "Arcane"], [], []).filter(f => !f.startsWith("L-")) },
  leaf: { key: "leaf", name: "Leaf Pile Jump", icon: "\u{1F342}", bg: "assets/leaf/leaf-park.webp", theme: "fall · Reading XP", reading: true, tix: "jump", tixs: "jumps", tixImg: "assets/leaf/leaf-icon.webp",
    get cur() { return SEASON.cur || "candy"; }, get coin() { return SEASON.coin || "\u{1F36C}"; },
    fams: () => pool(["Nature", "Earth", "Air"], [], []).filter(f => !f.startsWith("L-")) },
  orn: { key: "orn", name: "Ornament Hunt", icon: "\u{1F384}", bg: "assets/orn/orn-room.webp", theme: "December · Reading XP", reading: true, tix: "hunt", tixs: "hunts", tixImg: "assets/orn/orn-icon.webp",
    get cur() { return SEASON.cur || "candy"; }, get coin() { return SEASON.coin || "\u{1F36C}"; },
    fams: () => pool(["Ice", "Light", "Crystal"], [], []).filter(f => !f.startsWith("L-")) },
  aur: { key: "aur", name: "Northern Lights Camp", icon: "\u{1F30C}", bg: "assets/aur/aur-camp.webp", theme: "January · Reading XP", reading: true, tix: "peek", tixs: "peeks", tixImg: "assets/aur/aur-icon.webp",
    get cur() { return SEASON.cur || "candy"; }, get coin() { return SEASON.coin || "\u{1F36C}"; },
    fams: () => pool(["Ice", "Light", "Dark"], [], []).filter(f => !f.startsWith("L-")) },
  val: { key: "val", name: "Valentine Mailroom", icon: "\u{1F48C}", bg: "assets/val/val-mailroom.webp", theme: "February · Reading XP", reading: true, tix: "letter", tixs: "letters", tixImg: "assets/val/val-icon.webp",
    get cur() { return SEASON.cur || "candy"; }, get coin() { return SEASON.coin || "\u{1F36C}"; },
    fams: () => pool(["Light", "Nature", "Fire"], [], []).filter(f => !f.startsWith("L-")) },
  kite: { key: "kite", name: "Kite Festival", icon: "\u{1FA81}", bg: "assets/kite/kite-hill.webp", theme: "March · Reading XP", reading: true, tix: "kite pull", tixs: "kite pulls", tixImg: "assets/kite/kite-icon.webp",
    get cur() { return SEASON.cur || "candy"; }, get coin() { return SEASON.coin || "\u{1F36C}"; },
    fams: () => pool(["Air", "Electric", "Normal"], [], []).filter(f => !f.startsWith("L-")) }
};
let FAMS = {};
const famsOf = k => (FAMS[k] = FAMS[k] || MINI[k].fams());

/* ---------- state helpers ---------- */
export const miniOn = cls => (cls && cls.mini && cls.mini.on && MINI[cls.mini.key] ? MINI[cls.mini.key] : null);
const mine = (st, cls) => { const m = st && st.mini; return m && cls && cls.mini && m.id === cls.mini.id ? m : { id: cls && cls.mini && cls.mini.id, used: {} }; };
// Reading counts double (Oct 25): on for Trick-or-Treat Night unless Ms. Ariana turns it off (cls.mini.readX2), off for the others unless she turns it on.
export const readX2 = cls => { const E = miniOn(cls); return !!E && !E.reading && (cls.mini.readX2 != null ? !!cls.mini.readX2 : E.key === "tot"); };
/* Nov 1 fix: tickets earned on an earlier day of the event stay usable (up to CARRY_DAYS days back, never before the event started).
   Before, only TODAY's XP made tickets, so XP pasted later (the next morning's end-of-day paste saves to the previous school day,
   or work done after the last paste) never became tickets. A used ticket is taken from the oldest day that still has one (used[date]). */
export const CARRY_DAYS = 7;
const shiftDay = (iso, n) => { const [y, m, d] = iso.split("-").map(Number), x = new Date(y, m - 1, d + n); return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0"); };
const startDay = cls => { const ts = Number(String((cls && cls.mini && cls.mini.id) || "").split("-").pop()); return ts > 1e12 ? azToday(new Date(ts)) : azToday(); };
function xpFor(st, cls, E, d) { return E.reading ? readingOnBoosted(st, cls, d) : xpOn(st, d) + (readX2(cls) ? readingOn(st, cls, d) : 0) + boostExtra(st, cls, d); }   // ⚡ + the Subject Boost bonus
export function ticketDays(st, cls) {
  const E = miniOn(cls); if (!E) return [];
  const today = azToday(), used = mine(st, cls).used || {}, s0 = startDay(cls), out = [];
  for (let i = CARRY_DAYS - 1; i >= 0; i--) { const d = shiftDay(today, -i); if (d < s0) continue;
    const n = Math.floor(xpFor(st, cls, E, d) / PER_TICKET) - (Number(used[d]) || 0); if (n > 0) out.push({ date: d, n }); }
  return out;   // oldest first
}
export function ticketsLeft(st, cls) { return ticketDays(st, cls).reduce((a, x) => a + x.n, 0); }
const usedAll = (st, cls) => Object.values(mine(st, cls).used || {}).reduce((a, b) => a + (Number(b) || 0), 0);
const tixWord = (E, n) => E.tix ? (n === 1 ? E.tix : E.tixs) : (n === 1 ? "ticket" : "tickets");
const hasShop = E => OUTFITS.some(o => o.ev === E.key);
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const hash = s => { let h = 7; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
// riddle answers come in a random order each time (Nov 3: the right answer used to always be first)
const mixQ = q => { const ord = [0, 1, 2].slice(0, q.opts.length).sort(() => Math.random() - 0.5); return { q: q.q, opts: ord.map(i => q.opts[i]), a: ord.indexOf(q.a) }; };
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
  ["tot", "fest", "xmas", "lib", "leaf", "orn", "aur", "val", "kite"].forEach(k => document.body.classList.toggle("mini-" + k, !!E && E.key === k));
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
    " · 1 " + tixWord(E, 1) + " for every " + PER_TICKET + (E.reading ? " <b>Reading</b>" : "") + " XP" + (ticketDays(st, cls).some(x => x.date !== azToday()) ? " (some are from earlier days)." : " today.") + (readX2(cls) ? " \u{1F4DA} <b>Reading XP counts double!</b>" : "") + " You have <b>" + candyLeft(st).toLocaleString() + " " + E.coin + "</b>.</p>" +
    '<button class="btn gold" data-mini="open">' + (E.key === "tot" ? "\u{1F6AA} Go trick-or-treating!" : E.key === "fest" ? "\u{1F3A1} Go to the festival!" : E.key === "lib" ? "\u{1F56F}️ Sneak into the library!" : E.key === "leaf" ? "\u{1F342} Jump in the leaves!" : E.key === "orn" ? "\u{1F384} Hunt for ornaments!" : E.key === "aur" ? "\u{1F3D5}\uFE0F Visit the camp!" : E.key === "val" ? "\u{1F48C} Open your mail!" : E.key === "kite" ? "\u{1FA81} Fly some kites!" : "\u{1F682} Go to the station!") + "</button> " +
    (hasShop(E) ? '<button class="btn ghost" data-mini="shop">\u{1F6CD}️ ' + (FURN[E.key] ? "Outfit & room shop" : "Outfit shop") + "</button>" : "") + "</div></div>";
}

/* ---------- the event screen (overlay) ---------- */
let G = null;
export const miniBusy = () => !!G;
const top = (E, st, cls, back) => '<div class="qbtop"><b>' + E.icon + " " + E.name + " · " + (E.tixImg ? '<img class="lantic" src="' + E.tixImg + '" alt="' + E.tixs + '"> ' : E.reading ? '<img class="lantic" src="assets/lib/lib-lantern.webp" alt="lanterns"> ' : "\u{1F39F}️ ") + ticketsLeft(st, cls) + " · " + candyLeft(st).toLocaleString() + " " + E.coin + "</b><span>" +
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
      (FURN[E.key] ? '<h4 class="mshoph">\u{1F45B} Outfits</h4>' : "") + '<div class="mshopgrid">' + list.map(o => '<div class="mitem' + (own[o.id] ? " own" : "") + '"><img src="' + o.img + '" alt=""><b>' + esc(o.name) + "</b>" +
        (own[o.id] ? "<small>✅ Yours!</small>" : '<button class="btn small" data-mini="buy" data-o="' + o.id + '"' + (candyLeft(st) < OUTFIT_COST ? " disabled" : "") + ">" + OUTFIT_COST + " " + E.coin + "</button>") + "</div>").join("") + "</div>" + furnHTML(st, E) + "</div>";
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
  if (E.key === "leaf") {
    const got = Number(m.leaves) || 0;
    h += top(E, st, cls) + '<div class="mstage leafstage" ' + bgs + '>';
    if (G.res) {
      const r = G.res;
      h += '<div class="mpop leafpop">' + (r.gold ? '<img class="mbigimg pop leafgold" src="assets/leaf/leaf-golden.webp" alt=""><h2>A golden leaf!</h2>' : "") + (r.v ? visHTML(r.v, r.line) : '<p class="mfound">' + esc(r.line) + "</p>") +
        (r.q && r.ans == null ? '<p class="libq">\u{1F914} ' + esc(r.q.q) + '</p><div class="libans">' + r.q.opts.map((o, i) => '<button class="btn" data-mini="answer" data-i="' + i + '">' + esc(o) + "</button>").join("") + "</div>"
          : (r.q ? '<p class="libq ' + (r.right ? "ok" : "no") + '">' + (r.right ? "\u{1F389} You got it! Double " + E.cur + "!" : "\u{1F605} Nice try! The answer was <b>" + esc(r.q.opts[r.q.a]) + "</b>.") + "</p>" : "") +
            gotHTML(E, r.n, r.egg) + (r.stampEgg ? "<p>\u{1F342} Your leaf collection is full: a bonus egg! A new one starts.</p>" : "") + '<button class="btn big" data-mini="ok">Jump in another pile</button>') + "</div>";
    } else {
      h += LEAF_PILES.map(([x, y, sz], i) => '<button class="leafpile' + (G.jump === i ? " jump" : "") + (t ? "" : " notix") + '" data-mini="leap" data-i="' + i + '"' + (t && G.jump == null ? "" : " disabled") + ' aria-label="Jump in a leaf pile" style="left:' + x + "%;top:" + y + "%;--s:" + sz + ";--d:" + (i * 0.23) + 's">' +
          '<img src="assets/leaf/leaf-pile-' + ((i % 3) + 1) + '.webp" alt="" onerror="this.parentNode.classList.add(\'noart\');this.remove()"><i class="lp">' + LP_HTML(i) + '</i>' +
          (G.jump === i ? '<span class="burst">' + "\u{1F342}\u{1F341}\u{1F342}\u{1F341}\u{1F342}\u{1F341}\u{1F342}\u{1F341}".match(/./gu).map((l, k) => '<em style="--k:' + k + '">' + l + "</em>").join("") + "</span>" : "") + "</button>").join("") +
        '<div class="libcard leafcard"><img class="lantic" src="assets/leaf/leaf-icon.webp" alt=""> Leaf collection: ' + Array.from({ length: 10 }, (_, i) => '<span class="' + (i < got % 10 ? "on" : "") + '">' + (i < got % 10 ? LEAF_TYPES[i] : "·") + "</span>").join("") + "</div>" +
        '<div class="mhint">' + (G.jump != null ? "Wheee! \u{1F342}" : t ? "Tap a leaf pile to jump in! What's hiding inside?" : noTix) + "</div>";
    }
    return h + "</div></div>";
  }
  if (E.key === "orn") {
    const got = Number(m.orns) || 0;
    h += top(E, st, cls) + '<div class="mstage ornstage" ' + bgs + '>';
    if (G.res) {
      const r = G.res;
      h += '<div class="mpop ornpop">' + (r.gold ? '<img class="mbigimg pop orngold" src="assets/orn/orn-golden.webp" alt=""><h2>A golden ornament!</h2>' : "") + (r.v ? visHTML(r.v, r.line) : '<p class="mfound">' + esc(r.line) + "</p>") +
        (r.q && r.ans == null ? '<p class="libq">\u{1F914} ' + esc(r.q.q) + '</p><div class="libans">' + r.q.opts.map((o, i) => '<button class="btn" data-mini="answer" data-i="' + i + '">' + esc(o) + "</button>").join("") + "</div>"
          : (r.q ? '<p class="libq ' + (r.right ? "ok" : "no") + '">' + (r.right ? "\u{1F389} You got it! Double " + E.cur + "!" : "\u{1F605} Nice try! The answer was <b>" + esc(r.q.opts[r.q.a]) + "</b>.") + "</p>" : "") +
            gotHTML(E, r.n, r.egg) + (r.stampEgg ? "<p>\u{1F384} Your Ornament Box is full: a bonus egg! A new box starts.</p>" : "") + '<button class="btn big" data-mini="ok">Hunt for another</button>') + "</div>";
    } else {
      h += ORN_SPOTS.map(([x, y, sz], i) => '<button class="ornball' + (G.jump === i ? " jingle" : "") + (t ? "" : " notix") + '" data-mini="hunt" data-i="' + i + '"' + (t && G.jump == null ? "" : " disabled") + ' aria-label="Tap an ornament" style="left:' + x + "%;top:" + y + "%;--s:" + sz + ";--d:" + (i * 0.29) + 's">' +
          '<img src="assets/orn/orn-ball-' + ((i % 3) + 1) + '.webp" alt="">' +
          (G.jump === i ? '<span class="burst">' + "✨❄️✨⭐✨❄️✨⭐".match(/./gu).filter(x => x.trim() && x !== "\uFE0F").map((l, k) => '<em style="--k:' + k + '">' + l + "</em>").join("") + "</span>" : "") + "</button>").join("") +
        '<div class="libcard orncard"><img class="ornboxic" src="assets/orn/orn-box.webp" alt=""> Ornament Box: ' + Array.from({ length: 10 }, (_, i) => '<span class="' + (i < got % 10 ? "on" : "") + '">' + (i < got % 10 ? ORN_TYPES[i] : "·") + "</span>").join("") + "</div>" +
        '<div class="mhint">' + (G.jump != null ? "Jingle jingle! \u{1F514}" : t ? "Tap an ornament on the tree! What's hiding behind it?" : noTix) + "</div>";
    }
    return h + "</div></div>";
  }
  if (E.key === "aur") {
    const got = Number(m.aurs) || 0;
    h += top(E, st, cls) + '<div class="mstage aurstage" ' + bgs + '>';
    if (G.res) {
      const r = G.res;
      h += '<div class="mpop aurpop">' + (r.gold ? '<img class="mbigimg pop aurgold" src="assets/aur/aur-golden.webp" alt=""><h2>The golden lantern!</h2>' : "") + (r.v ? visHTML(r.v, r.line) : '<p class="mfound">' + esc(r.line) + "</p>") +
        (r.q && r.ans == null ? '<p class="libq">\u{1F914} ' + esc(r.q.q) + '</p><div class="libans">' + r.q.opts.map((o, i) => '<button class="btn" data-mini="answer" data-i="' + i + '">' + esc(o) + "</button>").join("") + "</div>"
          : (r.q ? '<p class="libq ' + (r.right ? "ok" : "no") + '">' + (r.right ? "\u{1F389} You got it! Double " + E.cur + "!" : "\u{1F605} Nice try! The answer was <b>" + esc(r.q.opts[r.q.a]) + "</b>.") + "</p>" : "") +
            gotHTML(E, r.n, r.egg) + (r.stampEgg ? "<p>\u2B50 Your Star Jar is full: a bonus egg! A new jar starts.</p>" : "") + '<button class="btn big" data-mini="ok">Peek in another</button>') + "</div>";
    } else {
      h += AUR_SPOTS.map(([x, y, sz], i) => '<button class="aurtent' + (G.jump === i ? " glow" : "") + (t ? "" : " notix") + '" data-mini="camp" data-i="' + i + '"' + (t && G.jump == null ? "" : " disabled") + ' aria-label="Peek inside" style="left:' + x + "%;top:" + y + "%;--s:" + sz + ";--d:" + (i * 0.37) + 's">' +
          '<img src="assets/aur/' + AUR_ART[i % 3] + '.webp" alt="">' +
          (G.jump === i ? '<span class="burst">' + ["✨", "\u{1F31F}", "\u{1F49A}", "\u{1F49C}", "✨", "\u2744\uFE0F"].map((l, k) => '<em style="--k:' + k + '">' + l + "</em>").join("") + "</span>" : "") + "</button>").join("") +
        '<div class="libcard aurcard"><img class="aurjaric" src="assets/aur/aur-jar.webp" alt=""> Star Jar: ' + Array.from({ length: 10 }, (_, i) => '<span class="' + (i < got % 10 ? "on" : "") + '">' + (i < got % 10 ? "\u2B50" : "·") + "</span>").join("") + "</div>" +
        '<div class="mhint">' + (G.jump != null ? "Something is glowing inside\u2026 \u2728" : t ? "Tap a tent or lantern to peek inside! Who is camping tonight?" : noTix) + "</div>";
    }
    return h + "</div></div>";
  }
  if (E.key === "kite") {
    const got = Number(m.kites) || 0, n = got % 10;
    h += top(E, st, cls) + '<div class="mstage kitestage" ' + bgs + '>';
    if (G.res) {
      const r = G.res;
      h += '<div class="mpop kitepop">' + (r.gold ? '<img class="mbigimg pop kitegold" src="assets/kite/kite-golden.webp" alt=""><h2>The golden kite!</h2>' : "") + (r.v ? visHTML(r.v, r.line) : '<p class="mfound">' + esc(r.line) + "</p>") +
        (r.q && r.ans == null ? '<p class="libq">\u{1F914} ' + esc(r.q.q) + '</p><div class="libans">' + r.q.opts.map((o, i) => '<button class="btn" data-mini="answer" data-i="' + i + '">' + esc(o) + "</button>").join("") + "</div>"
          : (r.q ? '<p class="libq ' + (r.right ? "ok" : "no") + '">' + (r.right ? "\u{1F389} You got it! Double " + E.cur + "!" : "\u{1F605} Nice try! The answer was <b>" + esc(r.q.opts[r.q.a]) + "</b>.") + "</p>" : "") +
            gotHTML(E, r.n, r.egg) + (r.tailEgg ? "<p>\u{1F380} Your Kite Tail is full of bows: a bonus egg! A new tail starts.</p>" : "") + '<button class="btn big" data-mini="ok">Fly another kite</button>') + "</div>";
    } else {
      h += KITE_SPOTS.map(([x, y], i) => '<button class="kitefly' + (G.jump === i ? " pull" : "") + (t ? "" : " notix") + '" data-mini="pull" data-i="' + i + '"' + (t && G.jump == null ? "" : " disabled") + ' aria-label="Pull down a kite" style="left:' + x + "%;top:" + y + "%;--d:" + (i * 0.53) + 's">' +
          '<img src="assets/kite/kite-' + ((i % 3) + 1) + '.webp" alt="">' +
          (G.jump === i ? '<span class="burst">' + ["\u{1F4A8}", "\u2728", "\u{1F338}", "\u{1F380}", "\u{1F4A8}", "\u2601\uFE0F"].map((l, k) => '<em style="--k:' + k + '">' + l + "</em>").join("") + "</span>" : "") + "</button>").join("") +
        '<div class="libcard kitecard"><span class="kitetailwrap"><img class="kitetail" src="assets/kite/kite-tail.webp" alt="">' +
          KITE_KNOTS.map(([x, y], i) => i < n ? '<img class="kitebow" src="assets/kite/kite-bow.webp" alt="" style="left:' + x + "%;top:" + y + '%">' : "").join("") + "</span> <b>" + n + " / 10</b> bows</div>" +
        '<div class="mhint">' + (G.jump != null ? "Reeling it in\u2026 \u{1F4A8}" : t ? "Tap a kite to pull it down! Who is riding it?" : noTix) + "</div>";
    }
    return h + "</div></div>";
  }
  if (E.key === "val") {
    const got = Number(m.vals) || 0;
    h += top(E, st, cls) + '<div class="mstage valstage" ' + bgs + '>';
    if (G.res) {
      const r = G.res;
      h += '<div class="mpop valpop">' + (r.gold ? '<img class="mbigimg pop valgold" src="assets/val/val-golden.webp" alt=""><h2>The golden envelope!</h2>' : "") + (r.v ? visHTML(r.v, r.line) : '<p class="mfound">' + esc(r.line) + "</p>") +
        (r.q && r.ans == null ? '<p class="libq">\u{1F914} ' + esc(r.q.q) + '</p><div class="libans">' + r.q.opts.map((o, i) => '<button class="btn" data-mini="answer" data-i="' + i + '">' + esc(o) + "</button>").join("") + "</div>"
          : (r.q ? '<p class="libq ' + (r.right ? "ok" : "no") + '">' + (r.right ? "\u{1F389} You got it! Double " + E.cur + "!" : "\u{1F605} Nice try! The answer was <b>" + esc(r.q.opts[r.q.a]) + "</b>.") + "</p>" : "") +
            gotHTML(E, r.n, r.egg) + (r.stampEgg ? "<p>\u{1F48C} Your Stamp Book is full: a bonus egg! A new page starts.</p>" : "") + '<button class="btn big" data-mini="ok">Open another letter</button>') + "</div>";
    } else {
      h += VAL_SPOTS.map(([x, y], i) => '<button class="valenv' + (G.jump === i ? " open" : "") + (t ? "" : " notix") + '" data-mini="mail" data-i="' + i + '"' + (t && G.jump == null ? "" : " disabled") + ' aria-label="Open a letter" style="left:' + x + "%;top:" + y + "%;--d:" + (i * 0.41) + 's">' +
          '<img src="assets/val/val-env-' + ((i % 3) + 1) + '.webp" alt="">' +
          (G.jump === i ? '<span class="burst">' + ["\u2764\uFE0F", "\u{1F495}", "\u{1F496}", "\u2728", "\u{1F497}", "\u{1F48C}"].map((l, k) => '<em style="--k:' + k + '">' + l + "</em>").join("") + "</span>" : "") + "</button>").join("") +
        '<div class="libcard valcard"><img class="valbookic" src="assets/val/val-book.webp" alt=""> Stamp Book: ' + Array.from({ length: 10 }, (_, i) => '<span class="' + (i < got % 10 ? "on" : "") + '">' + (i < got % 10 ? VAL_STAMPS[i] : "·") + "</span>").join("") + "</div>" +
        '<div class="mhint">' + (G.jump != null ? "Tearing it open\u2026 \u{1F495}" : t ? "Tap a valentine in the mail slots! Who sent it?" : noTix) + "</div>";
    }
    return h + "</div></div>";
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
  if (a === "buyFurn" && FURN[E.key]) {
    const f = FURN[E.key].list().find(x => x[0] === el.dataset.k); if (!f) return;
    const id = f[0] + "_" + FURN[E.key].th, have = s.roomOwned || [];
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
  if (a === "answer" && (E.key === "lib" || E.key === "leaf" || E.key === "orn" || E.key === "aur" || E.key === "val" || E.key === "kite") && G && G.res && G.res.q && G.res.ans == null) {
    const r = G.res, i = Number(el.dataset.i); r.ans = i; r.right = i === r.q.a;
    if (r.right) { r.n *= 2; chime(3); } else chime(1);
    G.busy = true; try { const mm = Object.assign({}, mine(s, cls)); mm.got = (Number(mm.got) || 0) + r.n; const data = { mini: mm, candyBonus: (Number(s.candyBonus) || 0) + r.n }; if (r.egg) data.doorEggs = (Number(s.doorEggs) || 0) + 1; await c.patch(data, true); } finally { G.busy = false; }
    return c.render(true);
  }
  if (!t) return;
  if (G && G.busy) return;
  const use = () => { const td = (ticketDays(s, cls)[0] || {}).date || d;   // the oldest day that still has a ticket
    m.used = Object.assign({}, m.used || {}); m.used[td] = (Number(m.used[td]) || 0) + 1; if (m.cos == null) m.cos = hash(s.id + cls.mini.id) % 8; };
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
  if (a === "leap" && E.key === "leaf") {
    const i = Number(el.dataset.i); if (G.jump != null) return;
    use(); m.leaves = (Number(m.leaves) || 0) + 1; const stampEgg = m.leaves % 10 === 0, r = Math.random(); let res;
    if (r < 0.05) res = { gold: true, n: 15, egg: true, line: "A golden leaf floats down… with an egg tucked underneath!" };
    else if (r < 0.55) { const v = visitor("leaf"), q = mixQ(LEAF_RIDDLES[rnd(0, LEAF_RIDDLES.length - 1)]); res = { v, n: v.n, line: LEAF_LINES[rnd(0, LEAF_LINES.length - 1)], q }; }
    else if (r < 0.85) res = { n: rnd(3, 6), line: ["You landed on a hidden pile of " + E.cur + "!", "A squirrel was saving " + E.cur + " in here. It says you can have some!", "Crunch! There was " + E.cur + " at the bottom of the pile!"][rnd(0, 2)] };
    else res = { n: rnd(2, 4), line: LEAF_FINDS[rnd(0, LEAF_FINDS.length - 1)] };
    res.stampEgg = stampEgg; if (stampEgg) res.egg = true;
    G.jump = i; G.busy = true; leafSound(); c.render(true);
    try { if (!res.q) await c.patch(pay(res.n, res.egg), true); else await c.patch({ mini: m }, true); } finally { G.busy = false; }
    await new Promise(ok => setTimeout(ok, 900));
    if (!G) return; G.jump = null; G.res = res; chime(res.gold ? 3 : 1); return c.render(true);
  }
  if (a === "hunt" && E.key === "orn") {
    const i = Number(el.dataset.i); if (G.jump != null) return;
    use(); m.orns = (Number(m.orns) || 0) + 1; const stampEgg = m.orns % 10 === 0, r = Math.random(); let res;
    if (r < 0.05) res = { gold: true, n: 15, egg: true, line: "The ornament glows gold… and an egg rolls out of the branches!" };
    else if (r < 0.55) { const v = visitor("orn"), q = mixQ(ORN_RIDDLES[rnd(0, ORN_RIDDLES.length - 1)]); res = { v, n: v.n, line: ORN_LINES[rnd(0, ORN_LINES.length - 1)], q }; }
    else if (r < 0.85) res = { n: rnd(3, 6), line: ["A squirrel tucked some " + E.cur + " in the branches. You found them!", "Jingle! " + E.cur.charAt(0).toUpperCase() + E.cur.slice(1) + " tumbled out from behind the ornament!", "Someone hid " + E.cur + " deep in the pine needles!"][rnd(0, 2)] };
    else res = { n: rnd(2, 4), line: ORN_FINDS[rnd(0, ORN_FINDS.length - 1)] };
    res.stampEgg = stampEgg; if (stampEgg) res.egg = true;
    G.jump = i; G.busy = true; jingleSound(); c.render(true);
    try { if (!res.q) await c.patch(pay(res.n, res.egg), true); else await c.patch({ mini: m }, true); } finally { G.busy = false; }
    await new Promise(ok => setTimeout(ok, 900));
    if (!G) return; G.jump = null; G.res = res; chime(res.gold ? 3 : 1); return c.render(true);
  }
  if (a === "camp" && E.key === "aur") {
    const i = Number(el.dataset.i); if (G.jump != null) return;
    use(); m.aurs = (Number(m.aurs) || 0) + 1; const stampEgg = m.aurs % 10 === 0, r = Math.random(); let res;
    if (r < 0.05) res = { gold: true, n: 15, egg: true, line: "The lantern glows with northern lights… and an egg is tucked inside!" };
    else if (r < 0.55) { const v = visitor("aur"), q = mixQ(AUR_RIDDLES[rnd(0, AUR_RIDDLES.length - 1)]); res = { v, n: v.n, line: AUR_LINES[rnd(0, AUR_LINES.length - 1)], q }; }
    else if (r < 0.85) res = { n: rnd(3, 6), line: ["Someone left " + E.cur + " next to a mug of cocoa. Finders keepers!", "The northern lights flickered… and " + E.cur + " drifted down like snow!", "You found " + E.cur + " tucked in a sleeping bag!"][rnd(0, 2)] };
    else res = { n: rnd(2, 4), line: AUR_FINDS[rnd(0, AUR_FINDS.length - 1)] };
    res.stampEgg = stampEgg; if (stampEgg) res.egg = true;
    G.jump = i; G.busy = true; auroraSound(); c.render(true);
    try { if (!res.q) await c.patch(pay(res.n, res.egg), true); else await c.patch({ mini: m }, true); } finally { G.busy = false; }
    await new Promise(ok => setTimeout(ok, 900));
    if (!G) return; G.jump = null; G.res = res; chime(res.gold ? 3 : 1); return c.render(true);
  }
  if (a === "pull" && E.key === "kite") {
    const i = Number(el.dataset.i); if (G.jump != null) return;
    use(); m.kites = (Number(m.kites) || 0) + 1; const tailEgg = m.kites % 10 === 0, r = Math.random(); let res;
    if (r < 0.05) res = { gold: true, n: 15, egg: true, line: "The golden kite! It glows in the sunshine… and an egg is tied to its tail!" };
    else if (r < 0.55) { const v = visitor("kite"), q = mixQ(KITE_RIDDLES[rnd(0, KITE_RIDDLES.length - 1)]); res = { v, n: v.n, line: KITE_LINES[rnd(0, KITE_LINES.length - 1)], q }; }
    else if (r < 0.85) res = { n: rnd(3, 6), line: ["The wind blew " + E.cur + " right into your hands!", "A pouch of " + E.cur + " was tied to the kite string!", "The kite rained " + E.cur + " on you. Lucky!"][rnd(0, 2)] };
    else res = { n: rnd(2, 4), line: KITE_FINDS[rnd(0, KITE_FINDS.length - 1)] };
    res.tailEgg = tailEgg; if (tailEgg) res.egg = true;
    G.jump = i; G.busy = true; windSound(); c.render(true);
    try { if (!res.q) await c.patch(pay(res.n, res.egg), true); else await c.patch({ mini: m }, true); } finally { G.busy = false; }
    await new Promise(ok => setTimeout(ok, 900));
    if (!G) return; G.jump = null; G.res = res; chime(res.gold ? 3 : 1); return c.render(true);
  }
  if (a === "mail" && E.key === "val") {
    const i = Number(el.dataset.i); if (G.jump != null) return;
    use(); m.vals = (Number(m.vals) || 0) + 1; const stampEgg = m.vals % 10 === 0, r = Math.random(); let res;
    if (r < 0.05) res = { gold: true, n: 15, egg: true, line: "A golden envelope! Hearts float out… and an egg is tucked inside!" };
    else if (r < 0.55) { const v = visitor("val"), q = mixQ(VAL_RIDDLES[rnd(0, VAL_RIDDLES.length - 1)]); res = { v, n: v.n, line: VAL_LINES[rnd(0, VAL_LINES.length - 1)], q }; }
    else if (r < 0.85) res = { n: rnd(3, 6), line: ["Someone mailed you " + E.cur + "! The note says: Be mine!", "The envelope was stuffed with " + E.cur + " and glitter!", "A secret admirer sent you " + E.cur + "!"][rnd(0, 2)] };
    else res = { n: rnd(2, 4), line: VAL_FINDS[rnd(0, VAL_FINDS.length - 1)] };
    res.stampEgg = stampEgg; if (stampEgg) res.egg = true;
    G.jump = i; G.busy = true; letterSound(); c.render(true);
    try { if (!res.q) await c.patch(pay(res.n, res.egg), true); else await c.patch({ mini: m }, true); } finally { G.busy = false; }
    await new Promise(ok => setTimeout(ok, 900));
    if (!G) return; G.jump = null; G.res = res; chime(res.gold ? 3 : 1); return c.render(true);
  }
  if (a === "book" && E.key === "lib") {
    use(); m.books = (Number(m.books) || 0) + 1; const stampEgg = m.books % 10 === 0, r = Math.random(); let res;
    if (r < 0.05) res = { gold: true, n: 15, egg: true, line: "The pages glow gold… there\u2019s an egg tucked inside!" };
    else if (r < 0.55) { const v = visitor("lib"), q = mixQ(RIDDLES[rnd(0, RIDDLES.length - 1)]); res = { v, n: v.n, line: LIB_LINES[rnd(0, LIB_LINES.length - 1)], q }; }
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
// 🍂 Leaf Pile Jump: the Leafy Hideaway room set (item ids kind_leafy)
const LEAF_FURN = [["bed", "Leaf Pile Bed", 120], ["chair", "Tree Stump Armchair", 80], ["wallpaper", "Acorn & Leaf Wallpaper", 80], ["flooring", "Maple Wood Floor", 80],
  ["ceiling", "Acorn Lantern Light", 80], ["rug", "Braided Maple Rug", 60], ["wall_art", "Golden Forest Painting", 60], ["plant", "Little Maple Tree", 60], ["shelf", "Acorn Jar & Pumpkin", 60]];
// 🎄 Ornament Hunt: the Cozy Cabin room set (item ids kind_cabin)
const CABIN_FURN = [["bed", "Log Cabin Bed", 120], ["chair", "Plaid Armchair", 80], ["wallpaper", "Twinkle Log Wall", 80], ["flooring", "Snowy Plank Floor", 80],
  ["ceiling", "Wagon Wheel Chandelier", 80], ["rug", "Braided Plaid Rug", 60], ["wall_art", "Snowy Cabin Painting", 60], ["plant", "Little Christmas Tree", 60], ["shelf", "Lantern & Cocoa", 60]];
// 🌌 Northern Lights Camp: the Aurora Camp room set (item ids kind_aurora)
const AURORA_FURN = [["bed", "Camp Cot Bed", 120], ["chair", "Camp Chair & Blanket", 80], ["wallpaper", "Northern Lights Wallpaper", 80], ["flooring", "Snowy Camp Deck", 80],
  ["ceiling", "Lantern Beam", 80], ["rug", "Starry Night Rug", 60], ["wall_art", "Aurora Camp Painting", 60], ["plant", "Snowy Star Fir", 60], ["shelf", "Telescope & Cocoa", 60]];
// 💌 Valentine Mailroom: the Sweetheart Post Office room set (item ids kind_valpost)
const VALPOST_FURN = [["bed", "Sweetheart Quilt Bed", 120], ["chair", "Heart Velvet Armchair", 80], ["wallpaper", "Love Letter Wallpaper", 80], ["flooring", "Heart Confetti Floor", 80],
  ["ceiling", "Pink Heart Lamp", 80], ["rug", "Fluffy Heart Rug", 60], ["wall_art", "Mail Dove Stamp Painting", 60], ["plant", "Rose Bouquet", 60], ["shelf", "Mailbox & Candy Hearts", 60]];
// 🪁 Kite Festival: the Kite Shop Loft room set (item ids kind_kite)
const KITE_FURN = [["bed", "Kite Frame Bed", 120], ["chair", "Sunny Rainbow Armchair", 80], ["wallpaper", "Kites & Clouds Wallpaper", 80], ["flooring", "Ribbon Plank Floor", 80],
  ["ceiling", "Kite Cloud Mobile", 80], ["rug", "Rainbow Ring Rug", 60], ["wall_art", "Kite Hill Painting", 60], ["plant", "Spring Tulips", 60], ["shelf", "String Spools & Wind Chime", 60]];
const FURN = { lib: { list: () => LIB_FURN, th: "library", title: "Midnight Library" }, leaf: { list: () => LEAF_FURN, th: "leafy", title: "Leafy Hideaway" }, orn: { list: () => CABIN_FURN, th: "cabin", title: "Cozy Cabin" },
  aur: { list: () => AURORA_FURN, th: "aurora", title: "Aurora Camp" }, val: { list: () => VALPOST_FURN, th: "valpost", title: "Sweetheart Post Office" },
  kite: { list: () => KITE_FURN, th: "kite", title: "Kite Shop Loft" } };
function furnHTML(st, E) {
  const F = FURN[E.key]; if (!F) return "";
  const have = st.roomOwned || [], left = candyLeft(st);
  return '<h4 class="mshoph">\u{1F6CB}️ ' + F.title + ' room set <small>(it goes in My Room)</small></h4><div class="mshopgrid">' + F.list().map(([k, n, p]) => { const own = have.includes(k + "_" + F.th);
    return '<div class="mitem furn' + (own ? " own" : "") + '"><img src="assets/room/' + k + "_" + F.th + '.webp" alt=""><b>' + esc(n) + "</b>" +
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

/* ---------- 🍂 Leaf Pile Jump: piles, lines, finds and fall riddles ---------- */
// [left %, top %, size] of each pile on the park picture (the bottom of each pile sits at top %)
const LEAF_PILES = [[14, 66, 1], [33, 61, 0.9], [52, 64, 1.05], [71, 60, 0.9], [88, 66, 1], [23, 84, 1.15], [45, 86, 1.2], [66, 85, 1.15], [86, 88, 1.05]];
// drawn pile (used until the leaf-pile pictures are uploaded): leaves stacked in a mound
const LP_SPOTS = [[8, 78], [22, 82], [36, 84], [50, 85], [64, 84], [78, 82], [92, 78], [16, 62], [30, 64], [44, 66], [58, 66], [72, 64], [86, 62], [26, 46], [42, 48], [58, 48], [74, 46], [38, 30], [54, 30], [62, 32], [47, 16]];
const LP_HTML = i => LP_SPOTS.map(([x, y], k) => '<b style="left:' + x + "%;top:" + y + "%;--r:" + (((k * 67 + i * 31) % 120) - 60) + 'deg">' + ["\u{1F341}", "\u{1F342}", "\u{1F342}", "\u{1F341}"][(k + i) % 4] + "</b>").join("");
const LEAF_TYPES = ["\u{1F341}", "\u{1F342}", "\u{1F343}", "\u{1F341}", "\u{1F342}", "\u{1F343}", "\u{1F341}", "\u{1F342}", "\u{1F343}", "\u{1F341}"];
const LEAF_LINES = ["Crunch crunch! You found my leafy hideout!", "I was taking a nap in here. Okay, I'm awake! Riddle time!", "Wheee! Leaf piles are the BEST part of fall!",
  "Achoo! Sorry, a leaf tickled my nose. Want a riddle?", "You jumped right on my tail! It's okay, I'll trade you a riddle.", "I raked this pile all by myself. Answer my riddle!",
  "Shhh, I'm hiding from the squirrels. Here's a riddle!", "The wind blew me in here! Can you solve this?"];
const LEAF_FINDS = ["You found a lost mitten… and some treats inside it!", "A sleepy squirrel waved hello and gave you a snack!", "You found the crunchiest leaf in the whole park! Treats fell out of it!",
  "A pinecone rolled out with a few treats stuck to it!", "An acorn cap full of treats! Tiny, but yummy!"];
const LEAF_RIDDLES = [
  { q: "What falls in fall but never gets hurt?", opts: ["Leaves", "Rocks", "Apples"], a: 0 },
  { q: "What has a trunk but never goes on a trip?", opts: ["An elephant", "A tree", "A car"], a: 1 },
  { q: "What tree can you carry in your hand?", opts: ["A palm", "An oak", "A maple"], a: 0 },
  { q: "Why did the leaf go to the doctor?", opts: ["It was feeling green", "It fell down", "It had a cold"], a: 0 },
  { q: "What did the tree say when fall came?", opts: ["Leaf me alone!", "Hello!", "I'm cold"], a: 0 },
  { q: "What is a scarecrow's favorite fruit?", opts: ["Straw-berries", "Bananas", "Grapes"], a: 0 },
  { q: "What has ears but cannot hear?", opts: ["Corn", "A bunny", "A rock"], a: 0 },
  { q: "What did the acorn say when it grew up?", opts: ["Gee-ometry!", "I'm a tree!", "Hooray!"], a: 0 },
  { q: "What kind of key opens a pumpkin?", opts: ["A turkey", "A door key", "A mon-key"], a: 0 },
  { q: "Why are trees so good at math?", opts: ["They have lots of roots", "They're tall", "They read books"], a: 0 },
  { q: "What color are leaves in the fall?", opts: ["Red, orange and yellow", "Blue and purple", "Pink and white"], a: 0 },
  { q: "What do you call a pile of leaves that tells jokes?", opts: ["A crack-pile", "Leaf-ty the clown", "A funny pile"], a: 2 },
  { q: "Which animal hides acorns to eat in winter?", opts: ["A squirrel", "A fish", "A bird"], a: 0 },
  { q: "Why did the squirrel sit on the acorn?", opts: ["To keep it safe", "To hatch it", "It was tired"], a: 0 },
  { q: "What season comes after summer?", opts: ["Fall", "Spring", "Winter"], a: 0 },
  { q: "How do trees get on the internet?", opts: ["They log on", "With a phone", "They don't"], a: 0 },
  { q: "What did the wind say to the leaves?", opts: ["Let's blow this place!", "Stay put!", "Goodnight"], a: 0 },
  { q: "What's a tree's favorite drink?", opts: ["Root beer", "Milk", "Lemonade"], a: 0 },
  { q: "What is orange and sounds like a parrot?", opts: ["A carrot", "A pumpkin", "A leaf"], a: 0 },
  { q: "What has bark but no bite?", opts: ["A tree", "A puppy", "A shark"], a: 0 }
];

/* ---------- 🎄 Ornament Hunt: tree spots, lines, finds and winter riddles ---------- */
// [left %, top %, size] of each ornament on the tree picture (top % is where the hook hangs)
const ORN_SPOTS = [[42, 19, 0.85], [51, 21, 0.85], [35, 45, 1], [49, 46, 1], [62, 45, 1], [27, 59, 1.05], [41, 58, 1.05], [56, 60, 1.05], [48, 76, 1.1]];
const ORN_TYPES = ["\u{1F534}", "\u{1F535}", "\u{1F7E2}", "\u{1F7E1}", "\u{1F7E3}", "\u{1F534}", "\u{1F535}", "\u{1F7E2}", "\u{1F7E1}", "⭐"];
const ORN_LINES = ["Brrr! I was napping behind that ornament! Riddle time!", "Jingle jingle! You found my cozy branch!", "I love the twinkle lights. They're like tiny stars! Want a riddle?",
  "Achoo! Pine needles tickle my nose. Here's a riddle!", "I'm the tree's secret helper. Solve my riddle!", "Shhh, I'm hiding from the snowball fight. Riddle me this!",
  "I climbed all the way up here to see the star! Try my riddle!", "Ho ho ho! Just kidding, I'm not Santa. But I have a riddle!"];
const ORN_FINDS = ["You found a tangled string of lights… with treats stuck inside!", "A sleepy owl peeked out and handed you a snack!", "You found a lost mitten in the branches… with treats inside!",
  "A candy cane was hanging behind the ornament! Treats fell off it!", "A pinecone dropped down with a few treats stuck to it!"];
const ORN_RIDDLES = [
  { q: "What falls in winter but never gets hurt?", opts: ["Snow", "Rocks", "Apples"], a: 0 },
  { q: "What do snowmen eat for breakfast?", opts: ["Frosted Flakes", "Pancakes", "Toast"], a: 0 },
  { q: "What has a trunk and lights but never goes on a trip?", opts: ["A Christmas tree", "An elephant", "A car"], a: 0 },
  { q: "What do you call a snowman with a six-pack?", opts: ["An abdominal snowman", "Frosty", "A snow cone"], a: 0 },
  { q: "Where do snowmen keep their money?", opts: ["In a snow bank", "In a piggy bank", "Under the bed"], a: 0 },
  { q: "What is white and goes up?", opts: ["A confused snowflake", "A cloud", "A ghost"], a: 0 },
  { q: "What do you get when you cross a snowman and a vampire?", opts: ["Frostbite", "A snow cone", "A cold bat"], a: 0 },
  { q: "Which animal is always cold?", opts: ["A brrr-d", "A fish", "A lion"], a: 0 },
  { q: "What do you call a penguin in the desert?", opts: ["Lost", "Hot", "A sand-guin"], a: 0 },
  { q: "What did the tree say to the ornament?", opts: ["Quit hanging around!", "Hello!", "Go away"], a: 0 },
  { q: "What season comes after fall?", opts: ["Winter", "Spring", "Summer"], a: 0 },
  { q: "What has ears but can't hear and lives in the snow?", opts: ["Earmuffs", "A bunny", "A rock"], a: 0 },
  { q: "How does a snowman get to school?", opts: ["By icicle", "By bus", "He walks"], a: 0 },
  { q: "What do reindeer hang on their trees?", opts: ["Horn-aments", "Socks", "Carrots"], a: 0 },
  { q: "What kind of ball doesn't bounce?", opts: ["A snowball", "A beach ball", "A basketball"], a: 0 },
  { q: "What did one snowflake say to the other?", opts: ["You're one of a kind!", "It's hot!", "Bye!"], a: 0 },
  { q: "What do you call an elf who sings?", opts: ["A wrapper", "A drummer", "A snowman"], a: 0 },
  { q: "Why did the ornament go to school?", opts: ["To get brighter", "To eat lunch", "To see friends"], a: 0 },
  { q: "What is a polar bear's favorite cereal?", opts: ["Ice Krispies", "Oatmeal", "Corn flakes"], a: 0 },
  { q: "What goes ho ho swoosh?", opts: ["Santa in a revolving door", "A sled", "The wind"], a: 0 }
];

/* ---------- 🌌 Northern Lights Camp: tent spots, lines, finds and winter-night riddles ---------- */
// [left %, top %, size] of each tent / lantern on the snow (top % = its top edge)
const AUR_SPOTS = [[13, 50, 0.85], [33, 47, 0.8], [67, 47, 0.8], [87, 50, 0.85], [22, 63, 1], [50, 60, 0.95], [78, 63, 1], [36, 77, 1.1], [64, 77, 1.1]];
const AUR_ART = ["aur-tent-1", "aur-lantern", "aur-tent-2"];
const AUR_LINES = ["Shhh! I'm watching the northern lights! Want to hear a riddle?", "You found my cozy tent! Hot cocoa and a riddle for you!", "Brrr! It's cold out there. Come in and solve my riddle!",
  "I was counting the stars. I got to a million! Riddle time!", "The sky is dancing green and purple tonight! Here's a riddle.", "I'm camping for the first time! Do you know the answer to this?",
  "My sleeping bag is SO warm. Okay, one riddle and then a nap!", "I made a wish on a shooting star. It was for a riddle buddy!"];
const AUR_FINDS = ["You found a marshmallow stick… with treats on the end!", "A sleepy owl hooted hello and dropped a snack!", "You found a lost mitten full of treats!",
  "A compass pointed straight at a pile of treats!", "A warm mug of cocoa! A few treats were floating in it!"];
const AUR_RIDDLES = [
  { q: "What lights up the sky in green and purple in the far north?", opts: ["The northern lights", "Fireworks", "A rainbow"], a: 0 },
  { q: "What has a face and two hands but no arms or legs?", opts: ["A clock", "A snowman", "A tent"], a: 0 },
  { q: "What do you call a bear with no teeth?", opts: ["A gummy bear", "A polar bear", "A teddy"], a: 0 },
  { q: "What goes up when the rain comes down?", opts: ["An umbrella", "A tent", "A kite"], a: 0 },
  { q: "Why did the camper put a clock in the tent?", opts: ["To have a good time", "To wake up", "It was cold"], a: 0 },
  { q: "What do stars say when they meet?", opts: ["Glow-ha!", "Hello!", "Twinkle!"], a: 0 },
  { q: "What is the best day to go camping?", opts: ["Sun-day", "Monday", "Snow-day"], a: 0 },
  { q: "What do you call a sleeping bull?", opts: ["A bull-dozer", "A cow", "Sleepy"], a: 0 },
  { q: "Where do polar bears keep their money?", opts: ["In a snow bank", "In a cave", "In a tent"], a: 0 },
  { q: "What kind of tree fits in your hand?", opts: ["A palm tree", "A pine tree", "An oak tree"], a: 0 },
  { q: "What has one eye but can't see?", opts: ["A needle", "An owl", "A star"], a: 0 },
  { q: "What do you call a snowman in the summer?", opts: ["A puddle", "Frosty", "A snow cone"], a: 0 },
  { q: "Why did the moon skip dinner?", opts: ["It was full", "It was sleepy", "It was cold"], a: 0 },
  { q: "What runs but never walks?", opts: ["A river", "A dog", "A fox"], a: 0 },
  { q: "Which planet do we live on?", opts: ["Earth", "Mars", "The Moon"], a: 0 },
  { q: "What do owls say on a spooky night?", opts: ["Whooo's there?", "Moo!", "Quack!"], a: 0 },
  { q: "How do you keep warm at camp?", opts: ["Stand in the corner, it's 90 degrees!", "Eat ice", "Take off your hat"], a: 0 },
  { q: "What did the marshmallow say to the campfire?", opts: ["You're toast!", "Hi!", "Too hot!"], a: 0 },
  { q: "What sparkles in the night sky and helps sailors find their way?", opts: ["The North Star", "A lantern", "A cloud"], a: 0 },
  { q: "What has a bark but no bite?", opts: ["A tree", "A dog", "A wolf"], a: 0 }
];

/* ---------- 💌 Valentine Mailroom: mail slot spots, lines, finds and sweet riddles ---------- */
// [left %, top %] of the middle of each mail slot that holds a letter (the picture has 6 × 4 empty slots)
// 🪁 Kite Festival: kites in the sky [left %, top %], the bow knots on the Kite Tail [left %, top %], lines, finds and riddles
const KITE_SPOTS = [[10, 36], [25, 22], [39, 42], [53, 25], [67, 41], [81, 22], [92, 44], [24, 60], [60, 61]];
const KITE_KNOTS = [[10, 67.6], [18.9, 25.3], [27.8, 63.7], [36.7, 61], [45.6, 20.3], [54.4, 49.5], [63.3, 77.5], [72.2, 36.3], [81.1, 21.4], [90, 69.2]];
const KITE_LINES = ["Wheee! I rode the wind all the way up here! Riddle time!", "Hold on tight, it's breezy! Can you solve my riddle?", "I'm the captain of this kite! Answer my riddle to land it!",
  "The clouds told me a riddle. Want to hear it?", "Whoosh! That was the best ride ever! Here's a riddle!", "I flew higher than a bird today! Try my riddle!",
  "My ears are flapping in the wind! Quick, a riddle!", "Happy spring! I brought a riddle down from the sky!"];
const KITE_FINDS = ["A lost sock was tangled in the string… with treats inside it!", "A leaf hitched a ride! It left you a few treats.", "A very confused pigeon. It dropped some treats and flew away!",
  "A paper airplane with a note: \u201cKeep reading!\u201d Treats were folded inside!", "A giant soap bubble popped and treats fell out!"];
const KITE_RIDDLES = [
  { q: "What can you catch but never throw?", opts: ["A cold", "A ball", "A kite"], a: 0 },
  { q: "What goes up but never comes down?", opts: ["Your age", "A kite", "A ball"], a: 0 },
  { q: "What do you call a kite with no string?", opts: ["Gone with the wind!", "A bird", "A cloud"], a: 0 },
  { q: "What month comes right after February?", opts: ["March", "April", "June"], a: 0 },
  { q: "What season starts in March?", opts: ["Spring", "Winter", "Fall"], a: 0 },
  { q: "What did the cloud say to the kite?", opts: ["You blow me away!", "Rain!", "Go home"], a: 0 },
  { q: "What has no hands but can still push you over?", opts: ["The wind", "A chair", "A shoe"], a: 0 },
  { q: "What kind of bow can't be tied?", opts: ["A rainbow", "A ribbon", "A shoelace"], a: 0 },
  { q: "Why did the kite go to school?", opts: ["To get a little higher learning", "To eat lunch", "To nap"], a: 0 },
  { q: "What do you call a bear with no ears?", opts: ["A B", "A cub", "Fuzzy"], a: 0 },
  { q: "What falls in spring but never gets hurt?", opts: ["Rain", "A rock", "A kite"], a: 0 },
  { q: "What has a tail and flies but isn't a bird?", opts: ["A kite", "A cat", "A fish"], a: 0 },
  { q: "What did the tree say when spring came?", opts: ["What a re-leaf!", "Brrr", "Timber!"], a: 0 },
  { q: "What runs but never walks, and blows but has no mouth?", opts: ["The wind", "A dog", "A river"], a: 0 },
  { q: "What do you call a flower that runs on electricity?", opts: ["A power plant", "A rose", "A daisy"], a: 0 },
  { q: "Which way does the wind blow a kite when it comes from the north?", opts: ["South", "Up", "North"], a: 0 },
  { q: "What did the bee say to the flower?", opts: ["Hey, bud!", "Buzz off!", "Bye!"], a: 0 },
  { q: "What do you get when you plant a kite?", opts: ["Nothing, kites don't grow!", "A kite tree", "Flowers"], a: 0 },
  { q: "What is full of holes but still holds water?", opts: ["A sponge", "A kite", "A cup"], a: 0 },
  { q: "Why do birds fly south?", opts: ["It's too far to walk!", "They're cold", "To shop"], a: 0 }
];
const VAL_SPOTS = [[36.5, 26], [64, 26], [27.5, 40], [45.5, 40], [73, 40], [36.5, 54], [54.5, 54], [45.5, 69], [64, 69]];
const VAL_STAMPS = ["\u2764\uFE0F", "\u{1F380}", "\u{1F496}", "\u{1F43E}", "\u{1F498}", "\u{1F451}", "\u{1F49D}", "\u{1F36B}", "\u{1F308}", "\u{1F48E}"];
const VAL_LINES = ["Happy Valentine's Day! I wrote you a riddle!", "I mailed myself to you! Surprise! Want a riddle?", "Roses are red, violets are blue, here is a riddle just for you!",
  "I've been waiting in this envelope ALL day! Riddle time!", "You're my favorite reader! Try my riddle!", "Special delivery! One riddle, sealed with a heart!",
  "I licked the stamp myself. Yuck! Anyway, here's a riddle.", "Shhh, I'm your secret valentine! Can you solve this?"];
const VAL_FINDS = ["A paper heart that says \u201cYou're sweet!\u201d… with treats taped on!", "A tiny love note from a mouse: \u201cSqueak!\u201d Treats fell out!", "A valentine covered in glitter! Treats sprinkled out too!",
  "A drawing of you and your companion! A few treats were inside!", "A candy heart that says \u201cRead more!\u201d Good advice! Treats inside!"];
const VAL_RIDDLES = [
  { q: "What did one heart say to the other?", opts: ["We're a perfect match!", "Hello!", "Go away"], a: 0 },
  { q: "What do you call two birds in love?", opts: ["Tweethearts", "Pigeons", "Feathers"], a: 0 },
  { q: "What did the stamp say to the envelope?", opts: ["I'm stuck on you!", "Bye!", "You're heavy"], a: 0 },
  { q: "What has a heart but no other organs?", opts: ["A deck of cards", "A rock", "A cloud"], a: 0 },
  { q: "Why did the cookie go to the doctor?", opts: ["It felt crummy", "It was hot", "It was sleepy"], a: 0 },
  { q: "What color do you get when you mix red and white?", opts: ["Pink", "Green", "Blue"], a: 0 },
  { q: "What did the bee say to the flower?", opts: ["Hello, honey!", "Buzz off!", "Nice petals"], a: 0 },
  { q: "What do you write on a robot's valentine?", opts: ["I love you a watt!", "Beep", "Be mine"], a: 0 },
  { q: "Which month has Valentine's Day?", opts: ["February", "July", "October"], a: 0 },
  { q: "What did the pencil say to the paper?", opts: ["I dot my i's on you!", "Hi!", "Erase me"], a: 0 },
  { q: "What do you call a very small valentine?", opts: ["A valen-tiny", "A card", "A sticker"], a: 0 },
  { q: "What goes on a letter so it can be mailed?", opts: ["A stamp", "A button", "A sock"], a: 0 },
  { q: "What did the elephant say to its sweetheart?", opts: ["I love you a ton!", "Trumpet!", "Peanuts!"], a: 0 },
  { q: "What did the octopus say on Valentine's Day?", opts: ["Can I hold your hand, hand, hand…?", "Splash!", "Ink!"], a: 0 },
  { q: "What do squirrels give for Valentine's Day?", opts: ["Forget-me-nuts", "Roses", "Acorn hats"], a: 0 },
  { q: "What flower is red and often given on Valentine's Day?", opts: ["A rose", "A sunflower", "A daisy"], a: 0 },
  { q: "What did the boy owl say to the girl owl?", opts: ["Owl be yours!", "Hoot!", "Good night!"], a: 0 },
  { q: "What do you call a sheep covered in chocolate?", opts: ["A candy baa", "Wooly", "A lamb"], a: 0 },
  { q: "Why do skunks love Valentine's Day?", opts: ["They're very scent-imental", "They like roses", "They eat candy"], a: 0 },
  { q: "What did the frog say to his valentine?", opts: ["You're toad-ally awesome!", "Ribbit", "Jump!"], a: 0 }
];

/* ---------- The Keep banner + teacher controls ---------- */
export function miniBanner(students, cls) {
  const E = miniOn(cls); if (!E) return "";
  const kids = students.filter(s => s.companionId && !s.isTeacher), d = azToday();
  const used = kids.reduce((n, s) => n + usedAll(s, cls), 0);
  return '<div class="minibanner mb-' + E.key + '"><b>' + E.icon + " " + E.name.toUpperCase() + "!</b> " + used + " " + tixWord(E, used) + " used so far · earn 1 " + tixWord(E, 1) + " every " + PER_TICKET + (E.reading ? " Reading" : "") + " XP" + (readX2(cls) ? " · \u{1F4DA} Reading XP counts DOUBLE!" : "") + "</div>";
}
export function miniAdmin(students, cls) {
  const E = miniOn(cls), kids = students.filter(s => s.companionId && !s.isTeacher), d = azToday();
  let h = '<div class="card"><div class="card-head"><h2>\u{1F3AA} Mini events</h2><span class="fact">2–3 day takeovers</span></div>';
  if (E) {
    const used = kids.reduce((n, s) => n + usedAll(s, cls), 0), got = kids.reduce((n, s) => n + (Number(mine(s, cls).got) || 0), 0);
    const outs = kids.reduce((n, s) => n + OUTFITS.filter(o => o.ev === E.key && (s.outfits || {})[o.id]).length, 0);
    h += '<p><b>' + E.icon + " " + E.name + "</b> is on. " + used + " " + tixWord(E, used) + " used so far · " + got.toLocaleString() + " " + E.coin + " given" + (hasShop(E) ? " · " + outs + " outfits bought." : ".") + (E.reading ? " Lanterns come from Reading XP only (1 per " + PER_TICKET + ")." : "") + "</p>" +
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
function leafSound() { if (!ac()) return; const t = AC.currentTime, n = Math.floor(AC.sampleRate * 0.5), b = AC.createBuffer(1, n, AC.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2) * (Math.random() < 0.3 ? 1 : 0.3);   // crunchy leaves
  const s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain(); f.type = "bandpass"; f.frequency.value = 2600; f.Q.value = 0.7; g.gain.value = 0.5;
  s.buffer = b; s.connect(f); f.connect(g); g.connect(AC.destination); s.start(t); }
function jingleSound() { if (!ac()) return; const t = AC.currentTime;   // little sleigh bells
  for (let k = 0; k < 7; k++) { const at = t + k * 0.06 + Math.random() * 0.02; [2093, 2637, 3136].forEach((f, j) => { const o = AC.createOscillator(), g = AC.createGain(); o.type = "sine"; o.frequency.value = f * (1 + (k % 2) * 0.03);
    g.gain.setValueAtTime(0.05 / (j + 1), at); g.gain.exponentialRampToValueAtTime(0.0005, at + 0.25); o.connect(g); g.connect(AC.destination); o.start(at); o.stop(at + 0.27); }); } }
function auroraSound() { if (!ac()) return; const t = AC.currentTime;   // a soft shimmering chord
  [523, 659, 784, 1047, 1319].forEach((f, k) => { const o = AC.createOscillator(), g = AC.createGain(); o.type = "sine"; o.frequency.value = f; const at = t + k * 0.09;
    g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(0.06, at + 0.08); g.gain.exponentialRampToValueAtTime(0.0005, at + 0.9); o.connect(g); g.connect(AC.destination); o.start(at); o.stop(at + 0.95); }); }
function letterSound() { if (!ac()) return; const t = AC.currentTime, n = Math.floor(AC.sampleRate * 0.35), b = AC.createBuffer(1, n, AC.sampleRate), d = b.getChannelData(0);   // paper rip + a little chime
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 1.5) * 0.6;
  const s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain(); f.type = "highpass"; f.frequency.value = 1800; g.gain.value = 0.35; s.buffer = b; s.connect(f); f.connect(g); g.connect(AC.destination); s.start(t);
  [1047, 1319].forEach((fr, k) => { const o = AC.createOscillator(), gg = AC.createGain(), at = t + 0.3 + k * 0.1; o.type = "sine"; o.frequency.value = fr; gg.gain.setValueAtTime(0.06, at); gg.gain.exponentialRampToValueAtTime(0.0005, at + 0.5); o.connect(gg); gg.connect(AC.destination); o.start(at); o.stop(at + 0.55); }); }
function windSound() { if (!ac()) return; const t = AC.currentTime, n = Math.floor(AC.sampleRate * 0.8), b = AC.createBuffer(1, n, AC.sampleRate), d = b.getChannelData(0);   // a whoosh of wind + a little chime
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / n) * 0.7;
  const s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain(); f.type = "bandpass"; f.Q.value = 1.2; f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(1800, t + 0.6); g.gain.value = 0.5;
  s.buffer = b; s.connect(f); f.connect(g); g.connect(AC.destination); s.start(t);
  [880, 1175].forEach((fr, k) => { const o = AC.createOscillator(), gg = AC.createGain(), at = t + 0.55 + k * 0.1; o.type = "sine"; o.frequency.value = fr; gg.gain.setValueAtTime(0.05, at); gg.gain.exponentialRampToValueAtTime(0.0005, at + 0.5); o.connect(gg); gg.connect(AC.destination); o.start(at); o.stop(at + 0.55); }); }
function knockSound() { if (!ac()) return; const t = AC.currentTime; thud(t); thud(t + 0.22); thud(t + 0.44); }
function chime(n) { if (!ac()) return; const t = AC.currentTime; [784, 988, 1175, 1568].slice(0, (n || 1) + 1).forEach((f, i) => { const o = AC.createOscillator(), g = AC.createGain(); o.type = "triangle"; o.frequency.value = f; g.gain.setValueAtTime(0.15, t + i * 0.09); g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.09 + 0.35); o.connect(g); g.connect(AC.destination); o.start(t + i * 0.09); o.stop(t + i * 0.09 + 0.4); }); }
function trainSound() { if (!ac()) return; const t = AC.currentTime; [0, 0.25].forEach(d => { const o = AC.createOscillator(), g = AC.createGain(); o.type = "square"; o.frequency.value = 520; g.gain.setValueAtTime(0.08, t + d); g.gain.exponentialRampToValueAtTime(0.001, t + d + 0.22); o.connect(g); g.connect(AC.destination); o.start(t + d); o.stop(t + d + 0.25); }); }
