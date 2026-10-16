/* ---------- 🎨 Paint Studio ----------
   Recolor your companion with the event currency (candy, corn, presents, snowflakes, hearts...), only while an event is on.
   ✨ Sparkle Paint: a sparkly glow for the rest of today (SPARKLE_COST). 🌈 Magic Color Paint: buy a color once (COLOR_COST),
   then switch between your colors (or no paint) for free, any time.
   Saved on the student: paints = { id: true }, paint = id or "", sparkleDay = date. Spending uses candySpent like the shop.
   Just for looks: no battle changes. */
import { esc, PAINTS, eventMode, seasonOf, candyLeft, companionOf, petHTML } from "./game.js?v=20261015c";
import { azToday } from "./collect.js?v=20261015c";

export const SPARKLE_COST = 40, COLOR_COST = 150;
const sw = c => (c.startsWith("linear") ? "background:" + c : "background:" + c);

export function paintCard(st, cls) {
  if (!eventMode(cls)) return "";
  const S = seasonOf(cls), have = candyLeft(st), own = st.paints || {}, today = azToday(), sparkle = st.sparkleDay === today;
  const c = companionOf(st), name = st.petName || (c && c.name) || "your companion";
  const prev = id => petHTML(c).replace('class="petwrap"', 'class="petwrap pt-' + id + '" style="font-size:46px;margin:10px 0 2px;"');
  let h = '<div class="card paintcard"><div class="card-head"><h2>\u{1F3A8} Paint Studio</h2><span class="fact">' + have.toLocaleString() + " " + S.coin + " to spend</span></div>" +
    '<p class="lede">Give ' + esc(name) + " a new look! Paint is just for fun and doesn’t change battles.</p>" +
    '<div class="paintrow"><div class="paintsp' + (sparkle ? " on" : "") + '"><span class="pswatch sparkle">✨</span><b>Sparkle Paint</b><small>Sparkly glow for the rest of today</small>' +
    (sparkle ? '<span class="pown">✨ On today!</span>' : '<button class="btn small gold" data-paint="sparkle"' + (have < SPARKLE_COST ? " disabled" : "") + ">" + SPARKLE_COST + " " + S.coin + "</button>") + "</div></div>" +
    '<h3 class="small" style="margin:12px 0 6px;">\u{1F308} Magic Color Paint <span class="muted">· ' + COLOR_COST + " " + S.coin + " each, then switch for free</span></h3>" +
    '<div class="paintgrid">' + PAINTS.map(([id, nm, col]) => {
      const mine = own[id], on = st.paint === id && mine;
      return '<div class="pcolor' + (on ? " on" : "") + '">' + (c ? prev(id) : '<span class="pswatch" style="' + sw(col) + '"></span>') + "<b>" + esc(nm) + "</b>" +
        (on ? '<span class="pown">✅ Wearing</span>' : mine ? '<button class="btn small" data-paint="use" data-c="' + id + '">Use it</button>'
          : '<button class="btn small" data-paint="buy" data-c="' + id + '"' + (have < COLOR_COST ? " disabled" : "") + ">" + COLOR_COST + " " + S.coin + "</button>") + "</div>";
    }).join("") + "</div>" +
    (st.paint ? '<p style="text-align:center;margin-top:10px;"><button class="btn ghost small" data-paint="off">\u{1F9FD} Wash the paint off</button></p>' : "");
  return h + "</div>";
}

export async function paintClick(el, c) {
  const s = c.me, cls = c.cls, a = el.dataset.paint; if (!s || !eventMode(cls)) return;
  const spend = n => ({ candySpent: (Number(s.candySpent) || 0) + n });
  if (a === "sparkle") {
    if (s.sparkleDay === azToday() || candyLeft(s) < SPARKLE_COST) return;
    await c.patch(Object.assign(spend(SPARKLE_COST), { sparkleDay: azToday() })); c.flash("✨ Sparkle Paint on! Your companion sparkles all day.", true); return;
  }
  if (a === "buy") {
    const id = el.dataset.c; if (!PAINTS.some(p => p[0] === id) || (s.paints || {})[id] || candyLeft(s) < COLOR_COST) return;
    await c.patch(Object.assign(spend(COLOR_COST), { paints: Object.assign({}, s.paints || {}, { [id]: true }), paint: id }));
    c.flash("\u{1F3A8} New color! Switch between your colors for free any time.", true); return;
  }
  if (a === "use") { const id = el.dataset.c; if (!(s.paints || {})[id]) return; return c.patch({ paint: id }); }
  if (a === "off") return c.patch({ paint: "" });
}
