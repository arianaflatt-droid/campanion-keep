# Companion Keep server (Cloud Functions)

One callable function, `ck`. Hatching, levelling, spares, releasing, companion level-ups and trades run here,
using the same game code as the pages (`npm run copy-game` copies `../js` into `game/`).

Test (no Firebase needed): `npm install && npm test`
Deploy (from the folder above this one, in Google Cloud Shell): `npx firebase-tools@13 deploy --only functions --project companion-keep`
