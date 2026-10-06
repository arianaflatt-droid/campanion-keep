# Companion Room — Handoff Spec

For the chat with repo/file access. This covers a new feature — a decoratable
companion room — designed in a separate brainstorming thread so it wouldn't
clutter the main Companion Keep design chat. Everything below is locked and
ready to wire into `game.js` / `db.js` / `student.html`, except where marked
**OPEN**.

---

## 1. Currency — Comfort Points (CP)

Rides the existing daily finalize flow, same trigger as the 120 XP full-health
reward.

| Trigger | CP |
|---|---|
| Full-health day | +10 |
| Lunch Hero bonus (same day) | +5 |
| 5-day streak (same day) | +5 |
| Missed / half-health day | 0 |

Best possible day (full health + Lunch Hero + 5-day streak) = **20 CP**.
Plain full-health day = **10 CP**.

Flat bonuses, not multipliers — kept simple to test.

---

## 2. Room slots (11 total)

Mirrors the existing `ROSTER[].fit` pattern (`hat, cap, eyes, snack`), applied
to a background scene instead of the companion sprite.

| Slot | Location in room | Notes |
|---|---|---|
| `wallpaper` | Full back wall | Tileable swatch, code-repeated |
| `flooring` | Floor | Tileable swatch, code-repeated |
| `rug` | Floor overlay | Layers on top of flooring |
| `ceiling` | Ceiling light | String lights, lanterns, chandeliers |
| `window` | Back wall, right-of-center | **Gap — see §7** |
| `bed` | Left floor | Companion sprite is anchored here (§4) |
| `chair` | Right floor | |
| `plant` | Small floor filler, right of chair | |
| `wall_art` | Right wall only, near/above chair | Single pool, not left/right split |
| `shelf_upper` | Left wall, top shelf | Shared pool with shelf_lower |
| `shelf_lower` | Left wall, bottom shelf | Shared pool with shelf_upper |

`shelf_upper`/`shelf_lower` draw from one shared item pool (trophies +
general decor) — a student can put a trophy on top and a plant figurine on
the bottom, two trophies, two decor pieces, any combination.

```js
// per-student save, alongside existing fields like health, streak, xp
comfort: {
  points: 0,        // current spendable CP
  spent: 0,         // lifetime CP spent
  earnedTotal: 0,   // lifetime CP earned
  roomFit: {
    wallpaper: null,
    flooring: null,
    rug: null,
    ceiling: null,
    window: null,
    bed: "bed_basic",   // default starter
    chair: null,
    plant: null,
    wall_art: null,
    shelf_upper: null,
    shelf_lower: null
  },
  owned: []   // item ids ever purchased — owned forever, swap freely
}

// global, not per-student
shopCursors: {
  // tracks daily rotation position per slot
}
```

Items are **owned forever** once purchased and freely swappable — same
logic as gear.

---

## 3. Comfort Shop

Two tabs, mirroring the Candy Shop / Gobble Shop pattern.

### Everyday tab
Rotates 2 un-owned items per slot per day, shared cursor (`shopCursors`),
filtered per-student by what they already own.

| Item | Price (CP) |
|---|---|
| Wallpaper / Flooring / Wall Art (each) | 50–60 |
| Bed / Chair (each design — no tiers) | 60 |
| Toy / Plant / Rug (each) | 40 |

(No upgraded bed tiers — bed is a style choice like wallpaper, not a
progression ladder.)

### Themed tab (always available)
Full 9-piece sets, purchasable by anyone regardless of which companion they
own.

| Item | Price (CP) |
|---|---|
| Themed piece (each, flat) | 75 |
| Full themed set bundle (9 pieces) | 600 (discount off 675) |

### Boss-gated trophies
Shown locked with a hint ("Defeat the Ghost-olotl to unlock") until the flag
flips — same pattern as Witch Hat/Pilgrim Hat. **Not bundled** with the
9-piece seasonal set; purchased separately once unlocked.

| Trophy | Unlocks after | Price (CP) |
|---|---|---|
| Ghost-olotl Trophy | Defeating the Ghost-olotl (Haunt-O-Ween) | 200 |
| Turducken Trophy | Defeating the Turducken (Gobble-Palooza) | 200 |
| Grinch-a-duck Trophy | Defeating Grinch-a-duck (Jingle Jam) | 200 |

Price ladder: everyday (40–60) → themed (75, or 600 bundled) → boss
trophies (200).

### Seasonal shop visibility rule
A seasonal 9-piece set (and its gated trophy) stays visible and purchasable
in the shop for the **full duration of its event window**, not just one day.
It's removed from the purchasable shop once the event ends. Once a student
buys it, they keep it and can use it forever regardless of season —
ownership isn't season-gated, only the shop listing is (same logic already
governing candy/corn spending).

---

## 4. Companion sprite anchor

The companion sprite always sits on the bed at a **fixed anchor point and
scale**, regardless of companion size (otter vs. stone golem use the same
spot). Per-companion scale/offset adjustments were discussed and
**explicitly deferred — not needed right now.**

---

## 5. Validated placement values (1536×1024 room canvas)

All positions measured and composite-tested across multiple full sets.

| Element | Size | Position |
|---|---|---|
| Bed | 40% width | x=107, bottom-grounded y=1010 |
| Chair | 16% width | x=1013 (66% from left), bottom-grounded y≈1020 |
| Rug | 95% of bed–chair floor gap | y=900 |
| Shelves (upper/lower) | 16% width | x=460 (30% from left); upper y=220, lower y=420 |
| Wall art | 14% width | x≈1220–1230, y≈280–300 |
| Ceiling light | 260px height | Horizontally centered over rug: x = 866 − (half light width), y=5 |
| Plant | 10% width | Just right of chair, bottom-grounded y≈1015 |

Floor/wall split: floor band = bottom 30% of canvas height; wallpaper tiles
the remaining 70% above it.

---

## 6. Art pipeline — production notes

- **Canvas:** 1536×1024, flat frontal "theater backdrop" view (no 3-wall
  perspective), strict straight-on symmetry for furniture (no 3/4-angle).
- **Style:** painterly/textured, matching the existing companion sprite
  style (confirmed via a stone golem test) — dimensional shading, visible
  material texture, soft **even ambient lighting** (not harsh directional —
  harsh lighting doesn't composite well across separately-generated pieces).
  Flat cel-shading was trialed and rejected as a mismatch.
- **Ceiling bands:** must be specified as "15–20% of image height" — relative
  terms like "taller" under-render.
- **Isolated objects:** must explicitly state "no vignette, no dark
  background, no glow around the edges," or generators default to moody
  spotlight backdrops.
- **Background keying:** pale/glowing objects need a **white** (not gray)
  background for clean extraction — gray caused a repeated "ghosting"
  artifact on translucent ceiling lights (hit twice: nature and rock sets).
- **Wallpaper/flooring delivery:** must be full individual images
  (~1254px), **not a contact-sheet grid** — grid-cropped tiles (~400px)
  cause excessive visible repeat seams when tiled across the 1536px room
  width.
- **Everyday (non-thematic) catalog:** if generated photorealistic instead
  of painterly-illustrated, explicitly state "Do NOT create a photograph"
  and reference "gouache or watercolor illustration" / "children's picture
  book" as style anchors.
- **In-game implementation:** wallpaper/flooring must be CSS/canvas-tiled
  repeating backgrounds in the real game, not flattened composite images —
  manual tiling for preview/testing shows seams that production tiling
  avoids.
- **Naming convention:** `{slot}_{theme}` (e.g. `bed_fire`,
  `wallpaper_dragon`).
- **Reusable `[THEME]` prompt template:** built for all 9 slots — fixed
  structural/style language, only the theme description swaps.

---

## 7. Asset manifest

### Main catalog — 15 complete sets, 9 pieces each (135 pieces)
fire, water, nature, rock, sky, electric, ice, light, dark, ghost, poison,
steel, arcane, crystal, dragon

Each set covers: wallpaper, flooring, rug, bed, chair, plant, wall_art,
ceiling light, shelf decor.

Mass production target: **18–28 full matching sets** (one per creature type
+ one per companion). 15 of that range are done.

### Seasonal exclusive sets — 3 complete, 9 pieces each (27 pieces)

**Haunt-O-Ween**
| Slot | Asset |
|---|---|
| wallpaper | — |
| flooring | — |
| rug | Jack-o-Lantern Rug |
| bed | — |
| chair | — |
| plant | — |
| wall_art | Cobweb Wall Art |
| ceiling | — |
| shelf decor | — |

**Gobble-Palooza**
| Slot | Asset |
|---|---|
| wallpaper | Harvest wallpaper |
| flooring | — |
| rug | — |
| bed | — |
| chair | — |
| plant | — |
| wall_art | — |
| ceiling | — |
| shelf decor | Pie-on-table prop |

**Jingle Jam** (the Christmas event)
| Slot | Asset |
|---|---|
| wallpaper | Striped green/cream with holly, bows & ornaments |
| flooring | Parquet wood with star & holly inlay diamonds |
| rug | Snowflake medallion, holly & star border |
| bed | Red velvet sleigh bed with pine & bow crest |
| chair | Ornament-shaped armchair with jingle bells |
| plant | Poinsettia & pine arrangement in holly urn |
| wall_art | Framed snowy church & Christmas tree scene |
| ceiling | Garland-draped lantern chandelier with bows |
| shelf decor | Reindeer carousel music box |

*(Haunt-O-Ween and Gobble-Palooza rows above are incomplete in what's
tracked — only the pieces specifically named in design chat are listed. The
full 9-for-9 asset names for those two sets should be confirmed against the
actual delivered art files before building the manifest JSON.)*

### Trophy art — complete (3 pieces)
Jingle Jam (Grinch-a-duck) trophy, Haunt-O-Ween (Ghost-olotl) trophy,
Gobble-Palooza (Turducken) trophy — gold cup design, holiday-specific
ornamentation, matches the existing trophy/badge visual language.

---

## 8. Home Sweet Keep badge group

New badge group, art complete (4 badges), fits the existing 70-badge
structure. Icon style matches existing badges: gold emblem frame, ribbon
banner, leaf/berry border.

| Badge | Requirement |
|---|---|
| **First Decoration** | Buy any single room item (any slot) |
| **Full Room** | Fill all 11 `roomFit` slots at once |
| **Seasonal Collector** | Own a complete 9-piece seasonal set (Haunt-O-Ween, Gobble-Palooza, or Jingle Jam) |
| **Trophy Case** | Own all 3 seasonal trophies — Ghost-olotl, Turducken, Grinch-a-duck — each only purchasable after its boss is beaten |

---

## 9. Jingle Jam boss

**Grinch-a-duck** — already coded in game logic (per Ms. Ariana). Stats/HP
not covered in this handoff; pull directly from existing code the same way
Ghost-olotl/Turducken stats are referenced.

---

## 10. Open items (not yet resolved)

- **`window` slot has no generated asset in any of the 18 sets so far.**
  Either intentional (window reuses a base/shared asset across all themes)
  or a genuine gap — needs a decision before the manifest can claim 100%
  slot coverage for any set.
- **Per-companion scale/offset adjustments** for the fixed bed anchor —
  deferred, not needed right now, but will eventually matter once very
  small (pixel sprite) or very large (stone golem) companions are tested
  against the fixed anchor.
- **Haunt-O-Ween / Gobble-Palooza full 9-piece asset names** — only
  partially itemized in design notes (see §7); confirm the remaining slot
  assets against delivered files before finalizing the manifest JSON.
- **Production art pipeline (not test compositing)** — everything validated
  so far used manual Python compositing for preview only. The real build
  needs: cutting/naming all pieces per the `{slot}_{theme}` convention,
  uploading to `assets/store/` (or equivalent), wiring `comfort` +
  `shopCursors` into Firestore via `db.js`, building the shop UI (daily
  rotation, Everyday/Themed tabs, seasonal visibility), and rendering the
  11-slot room itself in `student.html` with the companion sprite anchored
  on the bed.
