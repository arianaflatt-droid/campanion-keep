/* ---------- Companion Room ----------
   A decoratable bedroom for each companion, paid for with Comfort Points (CP).
   CP (computed from the saved XP history, from cls.roomStart on; the teacher console saves the total as st.cpEarned):
     +80 every full-health day (hit the goal) · +20 if Lunch Hero that day · +20 if that day is part of a 5-day streak.
   Saved on the student: cpEarned (teacher writes), cpSpent, roomOwned [item ids], roomFit { slot: id }, roomBuys [{ id, cost, at }].
   Item ids are "{kind}_{theme}" (e.g. bed_dragon); art is assets/room/{id}.webp. Trophies are trophy_{season}.
   The room picture is 1536x1024; everything below is placed in % of that. */
import { azToday } from "./collect.js?v=20261016f";
import { questCP } from "./quest.js?v=20261016f";
import { esc } from "./game.js?v=20261016f";

// Themes that have art so far. Add a theme name here once its 9 pieces are in assets/room/.
export const TYPE_THEMES = ["fire", "water", "nature", "rock", "sky", "electric", "ice", "light", "dark", "ghost", "poison", "steel", "arcane", "crystal", "dragon"];
export const SEASON_THEMES = { haunt: "Haunt-O-Ween", gobble: "Gobble-Palooza", jingle: "Jingle Jam", frost: "Frostbite Festival", heart: "Sweetheart Showdown" };
export const THEME_NAMES = { arcane: "Arcane", crystal: "Crystal", dark: "Dark", dragon: "Dragon", ghost: "Ghost", light: "Light", poison: "Poison", steel: "Steel",
  bath: "Bubble Bath", kitchen: "Cherry Kitchen", play: "Rainbow Playroom", lucky: "Lucky",
  fire: "Fire", water: "Water", nature: "Nature", rock: "Rock", sky: "Sky", electric: "Electric", ice: "Ice", haunt: "Haunt-O-Ween", gobble: "Gobble-Palooza", jingle: "Jingle Jam", frost: "Frostbite Festival", heart: "Sweetheart Showdown" };
// The 9 kinds of item in a set, and what they cost on the Everyday tab.
export const KINDS = ["wallpaper", "flooring", "rug", "ceiling", "bed", "chair", "plant", "wall_art", "shelf"];
export const KIND_NAMES = { bed_bath: "Tub", chair_bath: "Sink", plant_bath: "Duck Tower", bed_kitchen: "Stove", chair_kitchen: "Fridge", plant_kitchen: "Herb Planter",
  bed_play: "Play Tent", chair_play: "Beanbag", plant_play: "Toy Chest", activity: "Rug activity", wallpaper: "Wallpaper", flooring: "Floor", rug: "Rug", ceiling: "Ceiling light", bed: "Bed", chair: "Chair", plant: "Plant", wall_art: "Wall art", shelf: "Shelf decor", trophy: "Trophy" };
export const KIND_ICON = { wallpaper: "\u{1F9F1}", flooring: "\u{1FAB5}", rug: "\u{1F7EB}", ceiling: "\u{1F4A1}", bed: "\u{1F6CF}️", chair: "\u{1FA91}", plant: "\u{1FAB4}", wall_art: "\u{1F5BC}️", shelf: "\u{1F3FA}", trophy: "\u{1F3C6}", activity: "\u{1F9E9}" };
export const EVERYDAY_PRICE = { wallpaper: 50, flooring: 50, rug: 40, ceiling: 50, bed: 60, chair: 60, plant: 40, wall_art: 60, shelf: 40 };
export const THEMED_PRICE = 75, SET_PRICE = 600, TROPHY_PRICE = 200;
// The 10 places in the room you decorate (the window is built in). Both shelves take shelf decor or trophies.
export const FIT_SLOTS = ["wallpaper", "flooring", "rug", "ceiling", "bed", "chair", "plant", "wall_art", "shelf_upper", "shelf_lower"];
export const slotKind = slot => (slot === "shelf_upper" || slot === "shelf_lower" ? "shelf" : slot);
export const TROPHIES = { haunt: { flag: "ghostDefeated", boss: "Ghost-olotl", icon: "\u{1F47B}" }, gobble: { flag: "turkeyDefeated", boss: "Turducken", icon: "\u{1F983}" }, jingle: { flag: "grinchDefeated", boss: "Grinch-a-Duck", icon: "\u{1F986}" }, frost: { flag: "yetiDefeated", boss: "Abominable Snowlotl", icon: "\u26C4" }, heart: { flag: "heartDefeated", boss: "Heartbreaker-otl", icon: "\u{1F498}" } };

// The everyday catalog (plain and patterned walls and floors, not part of a themed set).
export const EVERYDAY_CATALOG = ["flooring_carpet-blush-pink", "flooring_carpet-cream", "flooring_carpet-ivory", "flooring_carpet-lavender", "flooring_carpet-olive", "flooring_carpet-sand", "flooring_carpet-seafoam", "flooring_carpet-taupe", "flooring_wood-auburn", "flooring_wood-dark-walnut", "flooring_wood-espresso", "flooring_wood-honey-oak", "flooring_wood-light-oak", "flooring_wood-medium-walnut", "flooring_wood-pale-ash", "flooring_wood-sage-green", "wallpaper_pattern-blue-swirl", "wallpaper_pattern-coral-swirl", "wallpaper_pattern-gold-swirl", "wallpaper_pattern-indigo-swirl", "wallpaper_pattern-lavender-swirl", "wallpaper_pattern-mint-swirl", "wallpaper_plain-amber-orange", "wallpaper_plain-coral-orange", "wallpaper_plain-deep-navy", "wallpaper_plain-navy-blue", "wallpaper_plain-seafoam-teal", "wallpaper_plain-warm-cream"];
// Free starter pieces everyone owns (the "Cozy" set). The bed starts in the room.
export const STARTERS = ["bed_base", "chair_base", "rug_base", "ceiling_base", "plant_base", "wall_art_base"];
/* Season Pass decor (pass.js): 3 pass-only pieces each month, ids "{kind}_pass{theme}" (e.g. plant_passhaunt), art assets/room/{id}.webp.
   Not sold in the shops; students get them from Season Pass tiers 5, 10 and 15. */
export const PASS_DECOR = {
  haunt: [["wall_art", "Haunted Portrait"], ["shelf", "Jack-o\u2019-Lantern Trio"], ["plant", "Spooky Pumpkin Vine"]],
  gobble: [["wall_art", "Harvest Wreath"], ["shelf", "Pie Stack"], ["plant", "Autumn Leaf Tree"]],
  jingle: [["wall_art", "Holiday Wreath"], ["shelf", "Snow Globe"], ["plant", "Mini Christmas Tree"]],
  frost: [["wall_art", "Northern Lights Painting"], ["shelf", "Ice Crystal Lamp"], ["plant", "Frosted Pine"]],
  heart: [["wall_art", "Heart Garland"], ["shelf", "Candy Heart Jar"], ["plant", "Rose Bouquet"]],
  lucky: [["wall_art", "Leprechaun Treasure Map"], ["shelf", "Gold Coin Piggy Bank"], ["plant", "Rainbow Toadstool Garden"]],
  spring: [["wall_art", "Butterfly Frame"], ["shelf", "Bird Nest"], ["plant", "Tulip Pot"]],
  summer: [["wall_art", "Beach Sunset Painting"], ["shelf", "Seashell Jar"], ["plant", "Mini Palm Tree"]],
  school: [["wall_art", "Gold Star Chart"], ["shelf", "Apple Stack"], ["plant", "Pencil Cup Cactus"]]
};
export const PASS_DECOR_NAMES = {};
Object.entries(PASS_DECOR).forEach(([th, list]) => list.forEach(([k, n]) => { PASS_DECOR_NAMES[k + "_pass" + th] = n; }));
/* ---------- extra rooms ----------
   Bathroom, Kitchen and Playroom: each costs ROOM_PRICE Comfort Points and comes with its 9 basic pieces.
   Saved on the student: rooms { bath: true, ... }, roomFits { bath: { slot: id }, ... } (the bedroom keeps using roomFit).
   Each room has its own big pieces for the bed and chair spots ({kind}_{room}_{theme}, e.g. bed_bath_fire = Fire Tub).
   The other pieces (walls, floors, rugs, lights, art, shelves, plants) work in every room. */
export const ROOM_PRICE = 300;
export const ROOMS = { bedroom: { name: "Bedroom", icon: "\u{1F6CF}\uFE0F" }, bath: { name: "Bathroom", icon: "\u{1F6C1}" }, kitchen: { name: "Kitchen", icon: "\u{1F373}" }, play: { name: "Playroom", icon: "\u{1F9F8}" } };
export const EXTRA_ROOMS = ["bath", "kitchen", "play"];
export const hasRoom = (st, r) => r === "bedroom" || !!(st && st.rooms && st.rooms[r]);
export const roomStarters = r => ["wallpaper_" + r, "flooring_" + r, "rug_" + r, "ceiling_" + r, "bed_" + r + "_base", "chair_" + r + "_base", "plant_" + r + "_base", "wall_art_" + r, "shelf_" + r];
export function roomDefaultFit(r) { const [wallpaper, flooring, rug, ceiling, bed, chair, plant, wall_art, shelf_upper] = roomStarters(r); return { wallpaper, flooring, rug, ceiling, bed, chair, plant, wall_art, shelf_upper }; }
export const fitIn = (st, r) => (r === "bedroom" || !r ? fitOf(st) : Object.assign(roomDefaultFit(r), ((st && st.roomFits) || {})[r] || {}));
// which owned pieces can go in a spot: bed and chair spots take that room's own big pieces; plants of any kind work anywhere
export function slotTakes(slot, room, kind) {
  const k = slotKind(slot);
  if (k === "shelf") return kind === "shelf" || kind === "trophy";
  if (k === "plant") return kind === "plant" || kind.startsWith("plant_");
  if (k === "bed" || k === "chair") return kind === (room && room !== "bedroom" ? k + "_" + room : k);
  return kind === k;
}
// themed big pieces for the extra rooms the student has, for one theme
export const roomExtras = (st, theme) => EXTRA_ROOMS.filter(r => hasRoom(st, r)).flatMap(r => ["bed_" + r + "_" + theme, "chair_" + r + "_" + theme]);
/* ---------- where the companion sits, and rug activities ----------
   petSpot { room: "bed" | "chair" | "rug" | "floor" } (one save each time it changes). Rug activities are bought in the
   Everyday shop (ACTIVITY_PRICE each, ids activity_{name}) and sit on the rug; fit.activity in each room. */
export const PET_SPOT_KEYS = ["bed", "chair", "rug", "floor"];
const SPOT_LABEL = { bedroom: { bed: "On the bed", chair: "On the chair" }, bath: { bed: "In the tub", chair: "By the sink" }, kitchen: { bed: "By the stove", chair: "By the fridge" }, play: { bed: "In the tent", chair: "On the beanbag" } };
export const petSpotLabel = (room, k) => (SPOT_LABEL[room || "bedroom"] || {})[k] || (k === "rug" ? "On the rug" : "On the floor");
const SPOT_AT = {
  bedroom: { bed: [23, 19], chair: [64, 24], rug: [64, 4], floor: [89, 2] },
  bath: { bed: [22, 14], chair: [65, 3], rug: [64, 4], floor: [89, 2] },
  kitchen: { bed: [22, 2], chair: [67, 2], rug: [64, 4], floor: [89, 2] },
  play: { bed: [17, 6], chair: [64, 14], rug: [64, 4], floor: [89, 2] } };
const SPOT_DEFAULT = { bedroom: "bed", bath: "bed", kitchen: "rug", play: "rug" };
export const petSpotOf = (st, room) => { const r = room || "bedroom", k = ((st && st.petSpot) || {})[r]; return PET_SPOT_KEYS.includes(k) ? k : SPOT_DEFAULT[r]; };
export const ACTIVITIES = { book: "Storybook", boardgame: "Board Game", puzzle: "Puzzle", blocks: "Building Blocks", easel: "Art Easel" };
export const ACTIVITY_IDS = Object.keys(ACTIVITIES).map(k => "activity_" + k);
export const ACTIVITY_PRICE = 50;
const ACT_W = { easel: 10, book: 12, blocks: 11, boardgame: 13, puzzle: 13 };
export const itemId = (kind, theme) => kind + "_" + theme;
export function parseItem(id) { const i = String(id).lastIndexOf("_"); return { kind: String(id).slice(0, i), theme: String(id).slice(i + 1) }; }
export const itemArt = id => "assets/room/" + id + ".webp";
const title = t => t.split("-").filter(w => !["plain", "pattern", "wood", "carpet"].includes(w)).map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
export const itemName = id => { if (PASS_DECOR_NAMES[id]) return PASS_DECOR_NAMES[id]; const p = parseItem(id); if (p.kind === "activity") return ACTIVITIES[p.theme] || "Rug Activity"; if (p.kind === "trophy") return (SEASON_THEMES[p.theme] || "") + " Trophy";
  const th = p.theme === "base" ? "Cozy" : THEME_NAMES[p.theme] || title(p.theme), extra = p.theme.startsWith("carpet") ? " Carpet" : p.theme.startsWith("wood") ? " Wood Floor" : "";
  return extra ? th + extra : th + " " + (KIND_NAMES[p.kind] || p.kind); };
export const owned = st => STARTERS.concat(((st && st.roomOwned) || []).filter(id => !STARTERS.includes(id)));
export const bought = st => (st && st.roomOwned) || [];
export const fitOf = st => Object.assign({ bed: "bed_base", chair: "chair_base", rug: "rug_base", ceiling: "ceiling_base", plant: "plant_base", wall_art: "wall_art_base" }, (st && st.roomFit) || {});

/* ---------- Comfort Points ---------- */
// Per full-health day (hit the daily goal), plus Lunch Hero days and 5-day streak days. Counts every day since roomStart.
export const CP_DAY = 80, CP_LUNCH = 20, CP_STREAK = 20;
export function cpStart(cls) { return (cls && (cls.roomStart || cls.collectorStart)) || azToday(); }
export function cpEarnedCalc(st, cls) {
  const goal = (cls && Number(cls.goal)) || 120, start = cpStart(cls), h = (st && st.xpHist) || {};
  let cp = 0, run = 0;
  Object.keys(h).sort().forEach(date => {
    const x = h[date] || {}, v = Number(x.d != null ? x.d : x.l) || 0, hit = v >= goal;
    if (x.e && !hit) return;   // excused day: no Comfort Points, but the streak isn't broken
    run = hit ? run + 1 : 0;
    if (date < start || !hit) return;
    cp += CP_DAY;
    if (x.lh || (x.l != null && Number(x.l) >= goal)) cp += CP_LUNCH;
    if (run >= 5) cp += CP_STREAK;
  });
  cp += questCP(st);   // Grade Level Quest battles
  // Comfort Points from Goal Presents (Daily Doors)
  const GOAL = { g1: 20, g2: 20, g3: 20, g4: 40 };
  Object.values((st && st.doors) || {}).forEach(day => Object.values(day || {}).forEach(e => { if (e && e.st === "open" && e.r && GOAL[e.r.id]) cp += GOAL[e.r.id]; }));
  return cp;
}
export const cpEarned = (st, cls) => Math.max(Number(st && st.cpEarned) || 0, 0) + (Number(st && st.cpBonus) || 0);   // cpBonus: Campfire Kitchen Cozy Points
export const cpLeft = (st, cls) => Math.max(0, cpEarned(st, cls) - (Number(st && st.cpSpent) || 0));

/* ---------- the shop ---------- */
// Everyday tab: 2 items a day for each kind, from the type sets, skipping what you own. Everyone sees the same rotation.
export function dayNumber(date) { return Math.floor(new Date((date || azToday()) + "T12:00:00Z").getTime() / 86400000); }
export function everydayItems(st, date) {
  const n = dayNumber(date), have = new Set(owned(st)), out = [];
  KINDS.forEach((kind, k) => {
    const cat = EVERYDAY_CATALOG.filter(id => parseItem(id).kind === kind);
    const pool = (cat.length ? cat : TYPE_THEMES.map(t => itemId(kind, t))).filter(id => !have.has(id));
    if (!pool.length) return;
    const start = (n * 2 + k * 3) % pool.length;
    [0, 1].forEach(j => { const id = pool[(start + j) % pool.length]; if (!out.includes(id)) out.push(id); });
  });
  return out;
}
export const setItems = theme => KINDS.map(k => itemId(k, theme));
export function setPrice(st, theme) { const left = setItems(theme).filter(id => !owned(st).includes(id)).length; return Math.min(SET_PRICE, left * THEMED_PRICE); }
// Seasonal sets (and their trophy) are only for sale while that event is on.
export function liveSeason(cls) { return cls && cls.heart ? "heart" : cls && cls.frost ? "frost" : cls && cls.jingle ? "jingle" : cls && cls.gobble ? "gobble" : cls && cls.haunt ? "haunt" : null; }
export const trophyUnlocked = (cls, season) => !!(cls && cls[TROPHIES[season].flag]);

/* ---------- drawing the room ---------- */
const P = (x, y) => "left:" + (x / 15.36).toFixed(2) + "%;top:" + (y / 10.24).toFixed(2) + "%;";
function img(id, cls, style) { return '<img class="ri ' + cls + '" src="' + itemArt(id) + '" alt="" style="' + style + '">'; }
function trophyHTML(id, style) {
  const s = parseItem(id).theme, t = TROPHIES[s] || {};
  return '<div class="ri trophy" style="' + style + '"><img src="' + itemArt(id) + '" alt="" onerror="this.remove()"><span>\u{1F3C6}<small>' + (t.icon || "") + "</small></span></div>";
}
// petHTML is passed in (it lives in game.js) so the companion wears its gear on the bed too.
// sizes for the extra rooms' big pieces (the art has different shapes from beds and chairs)
const FITB = "object-fit:contain;object-position:bottom;";
const BIG = { bed_bath: "left:3%;bottom:2%;width:38%;max-height:50%;" + FITB, bed_kitchen: "left:1.5%;bottom:3%;width:44%;max-height:52%;" + FITB, bed_play: "left:3%;bottom:2%;width:37%;max-height:64%;" + FITB,
  chair_bath: "left:57%;bottom:15.5%;width:16%;max-height:40%;" + FITB, chair_kitchen: "left:59%;bottom:15.5%;width:12.5%;max-height:50%;" + FITB, chair_play: "left:55%;bottom:14%;width:19%;max-height:36%;" + FITB };
const PLANT = { plant_kitchen: "width:13%;left:77.5%;", plant_play: "width:14%;left:77%;" };
export function roomHTML(st, petMarkup, opts) {
  const o = opts || {}, f = o.room ? fitIn(st, o.room) : fitOf(st);
  // everyday tiles are mirrored 2x2 (so they repeat without seams) and drawn a bit bigger
  const tile = (id, big) => 'background-image:url(' + itemArt(id) + ");" + (parseItem(id).theme.includes("-") ? "background-size:" + big + "cqw auto;" : "");
  const wp = f.wallpaper ? tile(f.wallpaper, 40) : "", fl = f.flooring ? tile(f.flooring, 32) : "";
  // base room (ceiling, plain walls, wood floor, window); wallpaper and flooring cover the wall and floor, then the trim and window go on top
  let h = '<div class="room' + (o.small ? " small" : "") + '"><img class="rbase" src="assets/room/room-base.webp" alt="">' +
    (wp ? '<div class="rwall" style="' + wp + '"></div>' : "") + (fl ? '<div class="rfloor" style="' + fl + '"></div>' : "") +
    '<img class="rtrim crown" src="assets/room/room-crown.webp" alt=""><img class="rtrim base" src="assets/room/room-baseboard.webp" alt="">' +
    '<img class="rwin" src="assets/room/room-window.webp" alt="" style="' + P(778, 195) + 'width:36.6%;">';
  // two shelves on the left wall
  h += '<img class="rplank" src="assets/room/shelf-plank.webp" alt="" style="' + P(480, 328) + 'width:18%;"><img class="rplank" src="assets/room/shelf-plank.webp" alt="" style="' + P(480, 558) + 'width:18%;">';
  const shelf = (slot, y) => { const id = f[slot]; if (!id) return ""; const st2 = "left:" + (533 / 15.36).toFixed(2) + "%;bottom:" + ((1024 - y) / 10.24).toFixed(2) + "%;width:11%;max-height:19%;object-fit:contain;object-position:bottom;";
    return parseItem(id).kind === "trophy" ? trophyHTML(id, st2) : img(id, "rshelf", st2); };
  h += shelf("shelf_upper", 336) + shelf("shelf_lower", 566);
  if (f.wall_art) h += img(f.wall_art, "rart", P(1352, 230) + "width:10.5%;");
  if (f.ceiling) h += img(f.ceiling, "rceil", "left:34%;top:0;height:25.4%;transform:translateX(-50%);");
  if (f.rug) h += img(f.rug, "rrug", "left:56.4%;top:89%;width:28%;height:15%;transform:translate(-50%,-50%);");
  if (f.bed) h += img(f.bed, "rbed", BIG[parseItem(f.bed).kind] || "left:3%;bottom:1.4%;width:40%;");
  if (f.chair) h += img(f.chair, "rchair", BIG[parseItem(f.chair).kind] || "left:54%;bottom:15.5%;width:21%;");
  if (f.plant) h += img(f.plant, "rplant", "left:78.5%;bottom:17%;width:11%;" + (PLANT[parseItem(f.plant).kind] || ""));
  if (f.activity && /^activity_/.test(f.activity)) h += img(f.activity, "ract", "left:47%;bottom:2.5%;width:" + (ACT_W[parseItem(f.activity).theme] || 8) + "%;transform:translateX(-50%);");
  const rm = o.room || "bedroom", at = (SPOT_AT[rm] || SPOT_AT.bedroom)[petSpotOf(st, rm)];
  h += '<div class="rpet" style="left:' + at[0] + "%;bottom:" + at[1] + '%;">' + (petMarkup || "") + "</div>";
  // Lunch Hero sidekick: on a day the student hit the goal by lunch, it runs (or floats, for the Ghost-olotl) around the room
  if (o.side) h += '<div class="rside k-' + esc(o.side.kind) + '"><div class="rside-in">' + o.side.html + "</div></div>";
  return h + "</div>";
}
export { esc };
