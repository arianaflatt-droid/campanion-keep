/* ---------- Companion Room ----------
   A decoratable bedroom for each companion, paid for with Comfort Points (CP).
   CP (computed from the saved XP history, from cls.roomStart on; the teacher console saves the total as st.cpEarned):
     +10 every full-health day (hit the goal) · +5 if Lunch Hero that day · +5 if that day is part of a 5-day streak.
   Saved on the student: cpEarned (teacher writes), cpSpent, roomOwned [item ids], roomFit { slot: id }, roomBuys [{ id, cost, at }].
   Item ids are "{kind}_{theme}" (e.g. bed_dragon); art is assets/room/{id}.webp. Trophies are trophy_{season}.
   The room picture is 1536x1024; everything below is placed in % of that. */
import { azToday } from "./collect.js?v=20261001a";
import { esc } from "./game.js?v=20261001a";

// Themes that have art so far. Add a theme name here once its 9 pieces are in assets/room/.
export const TYPE_THEMES = ["fire", "water", "nature", "rock", "sky", "electric", "ice", "light", "dark", "ghost", "poison", "steel", "arcane", "crystal", "dragon"];
export const SEASON_THEMES = { haunt: "Haunt-O-Ween", gobble: "Gobble-Palooza", jingle: "Jingle Jam" };
export const THEME_NAMES = { arcane: "Arcane", crystal: "Crystal", dark: "Dark", dragon: "Dragon", ghost: "Ghost", light: "Light", poison: "Poison", steel: "Steel",
  fire: "Fire", water: "Water", nature: "Nature", rock: "Rock", sky: "Sky", electric: "Electric", ice: "Ice", haunt: "Haunt-O-Ween", gobble: "Gobble-Palooza", jingle: "Jingle Jam" };
// The 9 kinds of item in a set, and what they cost on the Everyday tab.
export const KINDS = ["wallpaper", "flooring", "rug", "ceiling", "bed", "chair", "plant", "wall_art", "shelf"];
export const KIND_NAMES = { wallpaper: "Wallpaper", flooring: "Floor", rug: "Rug", ceiling: "Ceiling light", bed: "Bed", chair: "Chair", plant: "Plant", wall_art: "Wall art", shelf: "Shelf decor", trophy: "Trophy" };
export const KIND_ICON = { wallpaper: "\u{1F9F1}", flooring: "\u{1FAB5}", rug: "\u{1F7EB}", ceiling: "\u{1F4A1}", bed: "\u{1F6CF}️", chair: "\u{1FA91}", plant: "\u{1FAB4}", wall_art: "\u{1F5BC}️", shelf: "\u{1F3FA}", trophy: "\u{1F3C6}" };
export const EVERYDAY_PRICE = { wallpaper: 50, flooring: 50, rug: 40, ceiling: 50, bed: 60, chair: 60, plant: 40, wall_art: 60, shelf: 40 };
export const THEMED_PRICE = 75, SET_PRICE = 600, TROPHY_PRICE = 200;
// The 10 places in the room you decorate (the window is built in). Both shelves take shelf decor or trophies.
export const FIT_SLOTS = ["wallpaper", "flooring", "rug", "ceiling", "bed", "chair", "plant", "wall_art", "shelf_upper", "shelf_lower"];
export const slotKind = slot => (slot === "shelf_upper" || slot === "shelf_lower" ? "shelf" : slot);
export const TROPHIES = { haunt: { flag: "ghostDefeated", boss: "Ghost-olotl", icon: "\u{1F47B}" }, gobble: { flag: "turkeyDefeated", boss: "Turducken", icon: "\u{1F983}" }, jingle: { flag: "grinchDefeated", boss: "Grinch-a-Duck", icon: "\u{1F986}" } };

// The everyday catalog (plain and patterned walls and floors, not part of a themed set).
export const EVERYDAY_CATALOG = ["flooring_carpet-blush-pink", "flooring_carpet-cream", "flooring_carpet-ivory", "flooring_carpet-lavender", "flooring_carpet-olive", "flooring_carpet-sand", "flooring_carpet-seafoam", "flooring_carpet-taupe", "flooring_wood-auburn", "flooring_wood-dark-walnut", "flooring_wood-espresso", "flooring_wood-honey-oak", "flooring_wood-light-oak", "flooring_wood-medium-walnut", "flooring_wood-pale-ash", "flooring_wood-sage-green", "wallpaper_pattern-blue-swirl", "wallpaper_pattern-coral-swirl", "wallpaper_pattern-gold-swirl", "wallpaper_pattern-indigo-swirl", "wallpaper_pattern-lavender-swirl", "wallpaper_pattern-mint-swirl", "wallpaper_plain-amber-orange", "wallpaper_plain-coral-orange", "wallpaper_plain-deep-navy", "wallpaper_plain-navy-blue", "wallpaper_plain-seafoam-teal", "wallpaper_plain-warm-cream"];
// Free starter pieces everyone owns (the "Cozy" set). The bed starts in the room.
export const STARTERS = ["bed_base", "chair_base", "rug_base", "ceiling_base", "plant_base", "wall_art_base"];
export const itemId = (kind, theme) => kind + "_" + theme;
export function parseItem(id) { const i = String(id).lastIndexOf("_"); return { kind: String(id).slice(0, i), theme: String(id).slice(i + 1) }; }
export const itemArt = id => "assets/room/" + id + ".webp";
const title = t => t.split("-").filter(w => !["plain", "pattern", "wood", "carpet"].includes(w)).map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
export const itemName = id => { const p = parseItem(id); if (p.kind === "trophy") return (SEASON_THEMES[p.theme] || "") + " Trophy";
  const th = p.theme === "base" ? "Cozy" : THEME_NAMES[p.theme] || title(p.theme), extra = p.theme.startsWith("carpet") ? " Carpet" : p.theme.startsWith("wood") ? " Wood Floor" : "";
  return extra ? th + extra : th + " " + (KIND_NAMES[p.kind] || p.kind); };
export const owned = st => STARTERS.concat(((st && st.roomOwned) || []).filter(id => !STARTERS.includes(id)));
export const bought = st => (st && st.roomOwned) || [];
export const fitOf = st => Object.assign({ bed: "bed_base", chair: "chair_base", rug: "rug_base", ceiling: "ceiling_base", plant: "plant_base", wall_art: "wall_art_base" }, (st && st.roomFit) || {});

/* ---------- Comfort Points ---------- */
export function cpStart(cls) { return (cls && (cls.roomStart || cls.collectorStart)) || azToday(); }
export function cpEarnedCalc(st, cls) {
  const goal = (cls && Number(cls.goal)) || 120, start = cpStart(cls), h = (st && st.xpHist) || {};
  let cp = 0, run = 0;
  Object.keys(h).sort().forEach(date => {
    const x = h[date] || {}, v = Number(x.d != null ? x.d : x.l) || 0, hit = v >= goal;
    run = hit ? run + 1 : 0;
    if (date < start || !hit) return;
    cp += 10;
    if (x.lh || (x.l != null && Number(x.l) >= goal)) cp += 5;
    if (run >= 5) cp += 5;
  });
  return cp;
}
export const cpEarned = (st, cls) => Math.max(Number(st && st.cpEarned) || 0, 0);
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
export function liveSeason(cls) { return cls && cls.jingle ? "jingle" : cls && cls.gobble ? "gobble" : cls && cls.haunt ? "haunt" : null; }
export const trophyUnlocked = (cls, season) => !!(cls && cls[TROPHIES[season].flag]);

/* ---------- drawing the room ---------- */
const P = (x, y) => "left:" + (x / 15.36).toFixed(2) + "%;top:" + (y / 10.24).toFixed(2) + "%;";
function img(id, cls, style) { return '<img class="ri ' + cls + '" src="' + itemArt(id) + '" alt="" style="' + style + '">'; }
function trophyHTML(id, style) {
  const s = parseItem(id).theme, t = TROPHIES[s] || {};
  return '<div class="ri trophy" style="' + style + '"><img src="' + itemArt(id) + '" alt="" onerror="this.remove()"><span>\u{1F3C6}<small>' + (t.icon || "") + "</small></span></div>";
}
// petHTML is passed in (it lives in game.js) so the companion wears its gear on the bed too.
export function roomHTML(st, petMarkup, opts) {
  const f = fitOf(st), o = opts || {};
  // everyday tiles are mirrored 2x2 (so they repeat without seams) and drawn a bit bigger
  const tile = (id, big) => 'background-image:url(' + itemArt(id) + ");" + (parseItem(id).theme.includes("-") ? "background-size:" + big + "cqw auto;" : "");
  const wp = f.wallpaper ? tile(f.wallpaper, 40) : "", fl = f.flooring ? tile(f.flooring, 32) : "";
  // base room (ceiling, plain walls, wood floor, window); wallpaper and flooring cover the wall and floor, then the trim and window go on top
  let h = '<div class="room' + (o.small ? " small" : "") + '"><img class="rbase" src="assets/room/_room_base.webp" alt="">' +
    (wp ? '<div class="rwall" style="' + wp + '"></div>' : "") + (fl ? '<div class="rfloor" style="' + fl + '"></div>' : "") +
    '<img class="rtrim crown" src="assets/room/_room_crown.webp" alt=""><img class="rtrim base" src="assets/room/_room_baseboard.webp" alt="">' +
    '<img class="rwin" src="assets/room/_room_window.webp" alt="" style="' + P(778, 195) + 'width:36.6%;">';
  // two shelves on the left wall
  h += '<img class="rplank" src="assets/room/_shelf_plank.webp" alt="" style="' + P(480, 328) + 'width:18%;"><img class="rplank" src="assets/room/_shelf_plank.webp" alt="" style="' + P(480, 558) + 'width:18%;">';
  const shelf = (slot, y) => { const id = f[slot]; if (!id) return ""; const st2 = "left:" + (533 / 15.36).toFixed(2) + "%;bottom:" + ((1024 - y) / 10.24).toFixed(2) + "%;width:11%;max-height:19%;object-fit:contain;object-position:bottom;";
    return parseItem(id).kind === "trophy" ? trophyHTML(id, st2) : img(id, "rshelf", st2); };
  h += shelf("shelf_upper", 336) + shelf("shelf_lower", 566);
  if (f.wall_art) h += img(f.wall_art, "rart", P(1352, 230) + "width:10.5%;");
  if (f.ceiling) h += img(f.ceiling, "rceil", "left:34%;top:0;height:25.4%;transform:translateX(-50%);");
  if (f.rug) h += img(f.rug, "rrug", "left:56.4%;top:89%;width:28%;height:15%;transform:translate(-50%,-50%);");
  if (f.bed) h += img(f.bed, "rbed", "left:3%;bottom:1.4%;width:40%;");
  if (f.chair) h += img(f.chair, "rchair", "left:65.95%;bottom:0.4%;width:16%;");
  if (f.plant) h += img(f.plant, "rplant", "left:82.5%;bottom:0.9%;width:10%;");
  h += '<div class="rpet">' + (petMarkup || "") + "</div>";
  // Lunch Hero sidekick: on a day the student hit the goal by lunch, it runs (or floats, for the Ghost-olotl) around the room
  if (o.side) h += '<div class="rside k-' + esc(o.side.kind) + '"><div class="rside-in">' + o.side.html + "</div></div>";
  return h + "</div>";
}
export { esc };
