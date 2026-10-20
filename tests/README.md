# Firestore rules tests

Runs `../firestore.rules` in the Firebase emulator against made-up students (no real data, no internet writes).

In Google Cloud Shell (or any computer with Node 18+ and Java 11+):

```
cd tests
npm install
npm test
```

Every line should say `ok`. A `not ok` line means a rule change broke something: don't publish those rules.
