# Companion Keep

A classroom pet-survival game. Each student looks after a companion, and its health depends on hitting 120 XP a day.

**Keep Your Companion at Full Health Today and Earn 500 XP!**

| Page | Who | What it does |
|---|---|---|
| `index.html` | Teacher (Google sign-in) | Upload the lunch and end-of-day spreadsheets, fix days by hand, award Hero Capes, manage the roster, and open **The Keep** (the class board for projecting). |
| `student.html` | Students (one link for everyone) | Tap your name, choose and name a companion, pick your gear and your lunch sidekick. |

## The teacher console tabs
- **📅 Daily:** pick the day, upload the lunch and end-of-day sheets, finalize, and see the Full-health reward list.
- **🐾 Students:** Full standings (with Copy link and 👀 View as), companion assignments, Companion losses, and the student link.
- **🥚 Collector:** Creature Collector settings and each student's collection.
- **✨ Events:** turn Haunt-O-Ween Mode on or off (plus the Ghost-olotl, bucket, prizes and shop while it's on), and control the limited event Legendaries.
- **⚙️ Settings:** class name, week label, daily goal, Start a new week, the Class roster, and the rules reference.

## Rules

- **Hit 120 XP** = full health (120). **Miss once** = half health (60). **Miss two days in a row** = the pet disappears.
- **Hero Cape:** after a pet disappears, it unlocks when the student hits 120 again. You award it from the console, and it brings the pet back.
- **Streak gear** (just for looks, stays unlocked all week, one worn at a time): 1 day 🧢 Ball Cap, 2 days 🕶️ Cool Shades, 3 days 🍪 Snack Pack, 4 days 🎩 Cozy Hat, 5 days 👑 Crown.
- **Lunch sidekick:** a student who hits 120 by lunch gets their axolotl or duck next to their pet, for that day only. Today's lunch data is only accepted before the **lunch cutoff** (12:30 pm by default, change it in ⚙️ Settings). After that, the console offers to use the data as end-of-day data instead. You can still tap the ☀️ next to a student to fix a Lunch Hero by hand.
- **Excused days** are skipped. They don't help or hurt.

### 🎃 Haunt-O-Ween Mode
Turn it on or off with the **🎃 Haunt-O-Ween Mode** checkbox in the **✨ Special modes** card of the teacher console. The Battle Area only exists while a special mode is on. All the rules above stay the same. While it's on:
- Every XP a student earns is a piece of **candy** (the end-of-day XP, or the lunch XP if that day's end-of-day file isn't in yet). **Each day the companion eats the first 120 candy to power up its attack**, and only candy above 120 reaches the basket. Earning 200 means 80 in the basket, and earning 90 means 0.
- Every companion has a **pumpkin basket** in the corner of its tile and its student page, with the candy count above it. Candy fills the basket until it's full at **120**.
- The Keep gets a spooky banner and a **Candy collected** total, and Full standings gets a **Candy** column.
- Candy **keeps stacking week after week** until you turn Haunt-O-Ween Mode off. When you turn it back on, you choose whether to keep everyone's candy or start fresh at 0.
- **⚔️ Battle Area:** each day a student hits 120 XP earns one attack on the **Ghost-olotl** (health 6,500, and each attack does 50 damage; both can be changed). Students attack from their page. Open **⚔️ Battle Area** in the console to project it. It shakes on every hit and celebrates when the Ghost-olotl is defeated. **Summon a new Ghost-olotl** starts a fresh one at full health.
- **First Ghost-olotl defeat = permanent unlocks.** The first time your class defeats a Ghost-olotl, two things unlock for good, even after Haunt-O-Ween Mode is off:
  - 🧙 **Witch Hat**, a second choice at a 5-day 120 XP streak (next to the Crown). Art: `assets/gear/witch-hat.png`.
  - 👻 **Ghost-olotl lunch sidekick**, a third pick beside the axolotl and duck. Art: `assets/ghost-pet.png`.
  - The teacher console saves this unlock, so keep the console or Battle Area open while the final attacks land (or open it afterwards and it catches up).
- **🍬 Candy Shop** (on each student's page while Haunt-O-Ween Mode is on). Buying takes candy out of the basket, and the console lists every purchase with a **Refund** button. Refunding also undoes what the item did.
  | Item | Candy | What it does |
  |---|---|---|
  | 🎡 Trick or Treat Wheel | 60 | One spin. Spins are saved until the wheel is built. |
  | 🧙 Witch's Hat | 600 | Bought once. The companion wears it automatically, and every attack does **+5** damage. |
  | 🧪 Witch's Brew | 60 | The next attack does **+10** damage, then it's used up. Students can stack several. |
  | ⚔️ Attack the Ghost-olotl | 120 | One extra attack, any day. 120 XP day attacks are used first. |
  Items live in `STORE` in `js/game.js`. Prices must also match `price()` in `firestore.rules`.
- The basket art is `assets/pumpkin-back.png` (the whole basket) and `assets/pumpkin-front.png` (just the front rim, drawn over the candy).

### ✅ Finalizing a day (every mode)
Click **✅ Finalize [day]** in Daily XP once a day's numbers are final. It turns the day on so it counts toward health, adds a 🔒 to that day's tab, records any companions that disappear, and in Haunt-O-Ween Mode fills Ms. Ariana's bucket. **Undo** reverses all of it.

### ⭐ Full health — reward list (every mode)
Each time you finalize a day, the students whose companions are still at **full health** are saved to the **Full health — reward list** card, right under Daily XP. Tick each student as you reward them, or use **Copy names** to paste the list elsewhere. The last 3 days show by default, with a button to see all of them. Undoing a finalize removes that day's list.

### 💀 Companion losses (every mode)
The **Companion losses** card counts how many times each student's companion disappeared: this week, the last 30 days, all time, or between two dates you pick. A loss is recorded when you finalize the day it happened. A Hero Cape brings the companion back, but the loss still counts.

### 🎃 Ms. Ariana's Candy Bucket (Haunt-O-Ween)
Starts at 0. Each finalized day adds **50 candy per student who missed 120 XP** (excused days don't count). It's shown giant in the Battle Area and on students' battle cards. Spend it from the console or the Battle Area to **heal the Ghost-olotl**: set *health per candy*, type the candy to spend, and click **Heal**. Students can steal from it on the wheel.

### 🎡 Trick or Treat Wheel (Haunt-O-Ween)
Students buy spins in the Candy Shop (60 candy). Orange slices are treats and purple slices are tricks. The two ✨ rare slices each land **5%** of the time, and the other six **15%** each.
| Slice | Type | What happens |
|---|---|---|
| 75 Candy (×2) | Treat | +75 candy |
| Reroll | Treat | The spin isn't used up, so spin again |
| ✨ Prize! | Treat, rare | Opens the **Prize Wheel** (8 prizes, equal chance). The win goes to **Prize winners** in the console, with the student, the prize, its order link and an **Ordered** checkbox. |
| Steal Candy | Trick | Takes a random 25–50 from Ms. Ariana's bucket (as much as is left) |
| Nothing (×2) | Trick | Nothing happens |
| ✨ Free Attack | Trick, rare | Attacks the Ghost-olotl right away (base damage, +5 with the Witch's Hat) |
Prizes live in `PRIZES` in `js/game.js`: `name`, `img` (put pictures in `assets/prizes/`) and `link`.

### 👀 View as a student
Click **👀 View as** next to any student in Full standings. Their page opens in a new tab, exactly as they see it, with a purple **Teacher preview** bar at the top and a **View as** menu to switch students. Preview is read-only, so hatching, buying, spinning or battling there never saves anything. Badge pop-ups are skipped so they're still waiting for the student.

### 💬 Nudge messages
The top of each student's My Companion tab shows up to 3 friendly nudges, picked from what's most useful right now:
- how much XP is left to reach 120 today (or a heal-your-companion warning at half health), and how close the next egg is once they've hit it
- how many more 120 days unlock the next streak gear
- eggs waiting to hatch, and banked XP ready for a level-up
- the badge they're closest to (at least halfway), shown only as a hint so it stays a mystery
- in Haunt-O-Ween, attacks ready for the Ghost-olotl
Nudges with a **Go →** button jump to the right tab. The rules live in `js/nudges.js`.

### 👥 Roster and names
- The **👥 Class roster** card holds each student's full name. "First Last" and "Last, First" both work.
- **Add names from a spreadsheet** reads a name column, or first-name and last-name columns, from any CSV/XLSX. It skips names already on the roster, and in mixed-class files it keeps only your class's guide. Check the names, then click **Save roster**.
- **Uploads are matched** to the roster by exact full name first, then by first + last name (middle names and capitals ignored), then by a "First L" initial, then by a first name that only one student has.
- **Names on screen** show the first name only. When two students share a first name, the last initial is added ("Maya J." and "Maya L.").

### 🧑‍🏫 The teacher's collection
The **🥚 Collector** tab starts with your own collection. Pick a starter, hatch eggs, level up, name creatures and use the lorebook, just like students do.
- **Eggs:** every day you **finalize** gives you 1 egg for each student who hit 120 XP.
- **XP:** you get 120 banked XP (1 level) for each student who didn't hit 120. Excused days don't count, and **Undo** on a finalized day takes the reward back.
- **Odds:** your eggs can hatch Legendaries, at a 0.05% chance: Common 69.95% · Uncommon 20% · Rare 8% · Super Rare 2% · Legendary 0.05%.
- **Battling:** tick **I'm ready to battle** and students see you in their arena as **Ms. Ariana**. You can challenge them, or they can challenge you. The arena is always open for you unless it's set to Closed, while students still follow their normal hours. To battle, keep the Collector tab open.
- Your collection is saved on the class, not as a student, so it never shows up on The Keep, in standings or in badges.

### 🔄 Trading
Students and the teacher can swap creatures from the **🔄 Trading** card at the bottom of the Creature Collector.
- Pick a player, the creature you want from them, and the creature you'll give, then **Send offer**. The other player sees it and taps **Accept** or **No thanks**. You can cancel an offer that's still waiting.
- Creatures keep their level and Sparkle, but nicknames don't carry over. The lorebook remembers creatures you traded away.
- **Spares:** when an egg hatches a family you already have, it's a free level by default. Tap **🔄 Keep it as a spare for trading instead** to keep the duplicate. Spares show under **My creatures → Spares for trading**, and you can trade them, use one for **+1 level**, or add it to your collection if you don't have that family.
- If a trade gives you a family you already have, it becomes a spare.
- You can't trade your last creature (spares don't count), you can't trade while in a battle, and limited event Legendaries (Duckarune, Hexaduck) can't be traded.
- Turn trading on or off with the **🔄 Trading** checkbox on the console's **🥚 Collector** tab.
- Trades are stored in `classes/{class}/trades`, so publish the updated `firestore.rules`.

### ☀️ Lunch arena
On weekdays from 12–1 pm (Arizona time), the Battle Arena opens only for students who have already hit 120 XP that day, from the lunch or end-of-day upload or paste. They can only see and challenge other students who also hit 120. A battle that's already started can be finished after 1 pm. Turn it off with the **☀️ Lunch arena** checkbox on the console's **🥚 Collector** tab. "Closed" in the arena menu also closes it.
- **⭐ 120 XP battlers** (checkbox on the same tab, off by default): while it's on, any student who has hit 120 XP today can battle other 120 XP students at any time on a weekday, not just at lunch. Everyone else follows the normal schedule.

### 🦆 Limited event: Duckarune
- A standalone Legendary (Water / Arcane, "The Runebound Duck"). It runs for **10 school days** from Mon Sep 28 (ends Fri Oct 9). Change the start date or turn it off in the console's **Creature Collector** card.
- A student unlocks it by hitting 120 XP **5 school days in a row**. After that, every egg they hatch has a **95%** chance to be Duckarune until they catch it, then **1%** for another one (a free level).
- After the event, students who never caught it can't get it anymore. Students who did keep theirs forever, and each egg keeps a 1% chance to be another one. It doesn't count toward the Lorebook badges, so students who miss it aren't held back.
- Art: `assets/creatures/l26-1.webp`, Sparkle: `assets/creatures/sparkle/l26-1.webp`.

### 🎃 Limited event: Hexaduck
- A standalone Legendary (Ghost / Fire, "The Hallowflame Duck"). It's available whenever **Haunt-O-Ween Mode** is on.
- A student unlocks it by hitting 120 XP **5 school days in a row during Haunt-O-Ween**. Only days since the mode was turned on count. After that, every egg has a **95%** chance to be Hexaduck until they catch it.
- Once caught, each egg keeps a **1%** chance to be another one (a free level), even after Haunt-O-Ween ends.
- Art: `assets/creatures/l27-1.webp`, Sparkle: `assets/creatures/sparkle/l27-1.webp`. Like Duckarune, it doesn't count toward the Lorebook badges.

### 🏅 Badges
- Students have a **🏅 Badges** tab with 61 badges. Unearned badges are empty "?" spaces with a hint and a progress bar. Badges and their rules live in `js/badges.js`, and the art is in `assets/badges/`.
- **Earned badges are locked in forever.** They're saved on the student (`badges`) the moment the student page or your console notices them, and the security rules only let badges be added, never removed.
- **Celebration:** the next time a student opens their page, a pop-up with a chime shows every badge they've earned since their last visit. Newly earned badges also carry a **NEW** ribbon for 3 days.
- **Shout-out on The Keep:** a new badge pops up on The Keep, and the latest one stays in a gold banner above the tiles until someone earns a newer one.
- **Pin a badge:** students can pin one earned badge. It shows in the top-right corner of their tile on The Keep and on their own companion.
- **Level 100 companions:** when a creature reaches level 100, the student can pick it as their companion on the My Companion tab (`petCreature`). The name, gear and health stay the same, and they can switch back anytime.

## Setup (about 15 minutes, one time)

### 1. Create the Firebase project
1. Go to <https://console.firebase.google.com>, click **Add project**, and name it (for example `companion-keep`). Google Analytics isn't needed.
2. **Build → Firestore Database → Create database** → pick a location → start in **production mode**.
3. **Build → Authentication → Get started**, then turn on two sign-in methods:
   - **Google** (this is how you sign in as the teacher)
   - **Anonymous** (this lets students use the page without accounts)
4. **Project settings (gear icon) → Your apps → Web (`</>`)** → register the app → copy the `firebaseConfig` block.

### 2. Put in your settings
- `js/firebase-config.js`: paste the config, and replace `TEACHER_EMAIL@school.org` with your school Google email.
- `firestore.rules`: replace `TEACHER_EMAIL@school.org` with the **same** email.

### 3. Publish the security rules
In the Firebase console, go to **Firestore Database → Rules**, paste the whole contents of `firestore.rules`, and click **Publish**.
(Or, if you use the Firebase CLI: `firebase deploy --only firestore:rules`.)

### 4. Put it on GitHub and turn on hosting
1. Create a new repo (for example `arianaflatt-droid/companion-keep`) and upload every file in this folder, keeping the `css`, `js` and `assets` folders.
2. **Either** use GitHub Pages: **Settings → Pages → Deploy from a branch → `main` / root**. Your site will be at `https://arianaflatt-droid.github.io/companion-keep/`.
   - Then, in Firebase **Authentication → Settings → Authorized domains**, add `arianaflatt-droid.github.io`. Without this, Google sign-in won't work.
3. **Or** use Firebase Hosting (like Character Showdown): `firebase init hosting` (public directory `.`, not a single-page app), then `firebase deploy`.

### 5. First run
1. Open the site (`index.html`) → **Sign in with Google** → **Create the class**.
2. In **👥 Class roster**, type each student's full name (one per line, spelled like your spreadsheets), or click **Add names from a spreadsheet** → **Save roster**.
3. Copy the **Student link** and send it to your class.

## Each day
1. Around lunch: pick the day → **☀️ Upload lunch spreadsheet**, or tap the sun next to a student.
2. End of day: **Upload end-of-day spreadsheet**. This decides health and turns the day on.
3. Friday afternoon or Monday morning: **Start a new week**. Companions and names are kept.

Spreadsheets can be CSV or XLSX with a **name** column and a **completed** column (the Unbound export works as-is). If a file mixes several classes, only students from your class are offered for adding to the roster.

## Changing the art
- The sidekicks are `assets/axolotl.png` and `assets/duck.png`. Replace them with any transparent PNGs, keeping the same file names.
- The gear and companions are emoji. To use a picture instead, drop a PNG into `assets/gear/` and set `img` on that item in `js/game.js`, for example `{ id: "cap", ..., img: "assets/gear/cap.png" }`.

## Privacy note
Students don't log in, so anyone with the student link can see the class list and change what a pet looks like. They can't change XP, health or the roster; the security rules block that. Use first names or first name + initial on the roster.
