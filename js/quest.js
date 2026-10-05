/* ---------- Grade Level Quest ----------
   A road of 9 checkpoints (K–8th). Each grade has 3 tests: Math, Reading, Science.
   Saved on the student:
     questStart: number of grades already finished before the quest (0 = starts at K). Those grades give weapons only.
     questPass:  { "3-m": "2026-10-03", ... }  tests the teacher marked passed (grade index 0–8, subject m/r/s)
     questDone:  { "3-m": { n: 1, at }, ... }  tests the student battled + claimed (n = 1st/2nd/3rd test done at that grade)
     questXP:    XP earned from the quest (goes into the collector XP bank)
     held:       the weapon the companion is holding (id like "3-sword")
   A passed test can be battled once every grade below it is finished (all 3 tests claimed, or below questStart).
   Passed tests above that are "saved and waiting". */
export const SUBJECTS = [["m", "Math", "\u{1F522}"], ["r", "Reading", "\u{1F4D6}"], ["s", "Science", "\u{1F52C}"]];
export const GRADES = [
  { key: "k", name: "Kindergarten", short: "K", area: "Sprout Meadow", guardians: ["L-24", "L-19", "L-10"] },
  { key: "1", name: "1st Grade", short: "1st", area: "Mushroom Woods", guardians: ["L-13", "L-04", "L-09"] },
  { key: "2", name: "2nd Grade", short: "2nd", area: "Coral Cove", guardians: ["L-23", "L-03", "L-17"] },
  { key: "3", name: "3rd Grade", short: "3rd", area: "Sunstone Desert", guardians: ["L-01", "L-20", "L-18"] },
  { key: "4", name: "4th Grade", short: "4th", area: "Frostpeak Mountains", guardians: ["L-06", "L-11", "L-30"] },
  { key: "5", name: "5th Grade", short: "5th", area: "Ember Volcano", guardians: ["L-07", "L-22", "L-27"] },
  { key: "6", name: "6th Grade", short: "6th", area: "Storm Skies", guardians: ["L-05", "L-21", "L-12"] },
  { key: "7", name: "7th Grade", short: "7th", area: "Starlight Ruins", guardians: ["L-14", "L-15", "L-02"] },
  { key: "8", name: "8th Grade", short: "8th", area: "The Crystal Citadel", guardians: ["L-16", "L-08", "L-25"] }
];
// The three stone circles in each road picture (% of the picture), 1st / 2nd / 3rd test.
export const ROAD_SPOTS = [
  [[21, 81], [47, 69], [70, 50]], [[23, 80], [49, 68], [70, 50]], [[27, 80], [50, 67], [70, 52]],
  [[29, 81], [52, 69], [71, 60]], [[29, 81], [52, 69], [71, 60]], [[28, 75], [58, 61], [83, 43]],
  [[28, 75], [56, 59], [77, 45]], [[27, 75], [55, 58], [75, 45]], [[24, 77], [58, 65], [77, 50]]
];
export const roadArt = g => "assets/quest/road-" + GRADES[g].key + ".webp";
export const battleArt = g => "assets/quest/battle-" + GRADES[g].key + ".webp";
// Rewards for the 1st / 2nd / 3rd test claimed at a grade (each also gives a Legendary egg and that grade's weapon).
export const QUEST_XP = [100, 150, 250], QUEST_CP = [15, 25, 40];
export const WEAPON_KINDS = ["shield", "staff", "sword"];
export const WEAPON_NAMES = [
  ["Leaf Shield", "Sprout Staff", "Twig Sword"], ["Toadstool Shield", "Glowcap Staff", "Mossblade"],
  ["Seashell Shield", "Coral Staff", "Trident Blade"], ["Sunstone Buckler", "Scarab Staff", "Desert Scimitar"],
  ["Frost Shield", "Icicle Staff", "Glacier Blade"], ["Magma Shield", "Ember Staff", "Flame Sword"],
  ["Thunder Shield", "Lightning Staff", "Storm Blade"], ["Moon Shield", "Starfall Staff", "Comet Sword"],
  ["Prism Aegis", "Starcrystal Staff", "Citadel Greatsword"]
];
export const weaponId = (g, n) => GRADES[g].key + "-" + WEAPON_KINDS[n];
export function weapon(id) {
  const [k, kind] = String(id || "").split("-"), g = GRADES.findIndex(x => x.key === k), n = WEAPON_KINDS.indexOf(kind);
  if (g < 0 || n < 0) return null;
  return { id, g, n, name: WEAPON_NAMES[g][n], img: "assets/quest/gear/" + id + ".webp" };
}

export const qKey = (g, s) => g + "-" + s;
export const startOf = st => Math.max(0, Math.min(9, Number(st && st.questStart) || 0));
export const passOf = st => (st && st.questPass) || {};
export const doneOf = st => (st && st.questDone) || {};
// Is this test finished (claimed, or below the starting grade)?
export function testDone(st, g, s) { return g < startOf(st) || !!doneOf(st)[qKey(g, s)]; }
export function gradeDone(st, g) { return SUBJECTS.every(([s]) => testDone(st, g, s)); }
// The grade the student is working on (9 = the whole road is done).
export function currentGrade(st) { let g = startOf(st); while (g < 9 && gradeDone(st, g)) g++; return g; }
export const gradeOpen = (st, g) => g <= currentGrade(st);
// How many tests are claimed at this grade (counts the ones from questDone only).
export function doneCount(st, g) { return SUBJECTS.filter(([s]) => doneOf(st)[qKey(g, s)]).length; }
// "done" | "battle" (passed, ready to battle) | "wait" (passed, lower grades not finished) | "" (not passed yet)
export function testState(st, g, s) {
  if (testDone(st, g, s)) return "done";
  if (!passOf(st)[qKey(g, s)]) return "";
  return gradeOpen(st, g) ? "battle" : "wait";
}
export function readyTests(st) {
  const out = []; for (let g = 0; g < 9; g++) SUBJECTS.forEach(([s]) => { if (testState(st, g, s) === "battle") out.push({ g, s }); }); return out;
}
// Weapons the student has: all 3 for each starting grade, plus one per claimed test (shield, staff, sword in claim order).
export function weaponsOwned(st) {
  const out = [];
  for (let g = 0; g < 9; g++) {
    if (g < startOf(st)) { WEAPON_KINDS.forEach((_, n) => out.push(weaponId(g, n))); continue; }
    SUBJECTS.forEach(([s]) => { const d = doneOf(st)[qKey(g, s)]; if (d && d.n >= 1 && d.n <= 3) out.push(weaponId(g, d.n - 1)); });
  }
  return [...new Set(out)];
}
export function heldWeapon(st) { const id = st && st.held; return id && weaponsOwned(st).includes(id) ? weapon(id) : null; }
// Comfort Points from the quest (added to the room's Comfort Points by the teacher console).
export function questCP(st) { return Object.values(doneOf(st)).reduce((n, d) => n + (QUEST_CP[(d && d.n) - 1] || 0), 0); }
