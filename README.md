# Companion Keep

A classroom pet-survival game. Each student looks after a companion, and its health depends on hitting 120 XP a day.

**Keep Your Pet Alive Through Friday and Earn 2,500 XP**

| Page | Who | What it does |
|---|---|---|
| `index.html` | Teacher (Google sign-in) | Upload the lunch and end-of-day spreadsheets, fix days by hand, award Hero Capes, manage the roster, and open **The Keep** (the class board for projecting). |
| `student.html` | Students (one link for everyone) | Tap your name, choose and name a companion, pick your gear and your lunch sidekick. |

## Rules

- **Hit 120 XP** = full health (120). **Miss once** = half health (60). **Miss two days in a row** = the pet disappears.
- **Hero Cape:** after a pet disappears, it unlocks when the student hits 120 again. You award it from the console, and it brings the pet back.
- **Streak gear** (just for looks, stays unlocked all week, one worn at a time): 1 day 🧢 Ball Cap, 2 days 🕶️ Cool Shades, 3 days 🍪 Snack Pack, 4 days 🎩 Cozy Hat, 5 days 👑 Crown.
- **Lunch sidekick:** a student who hits 120 by lunch gets their axolotl or duck next to their pet, for that day only.
- **Excused days** are skipped. They don't help or hurt.

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
2. In **Class settings**, paste your roster (first names are safest) → **Save roster**.
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
