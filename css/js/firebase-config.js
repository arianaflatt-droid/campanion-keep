// Firebase web app config for the companion-keep project.
export const firebaseConfig = {
  apiKey: "AIzaSyAMP92MutXvJk9pmVBPWYftPbDRoa21SzA",
  authDomain: "companion-keep.firebaseapp.com",
  projectId: "companion-keep",
  storageBucket: "companion-keep.firebasestorage.app",
  messagingSenderId: "234995731622",
  appId: "1:234995731622:web:3d804cccbd0ce99665b867"
};

// The Google account(s) allowed into the teacher console. Must match firestore.rules.
export const TEACHER_EMAILS = ["ariana.flatt@unbound.school"];

// One id per class. Change it if you run a second class from the same Firebase project.
export const CLASS_ID = "my-class";
