// Firebase web app config for the companion-keep project.
export const firebaseConfig = {
  apiKey: "AIzaSyAMP92MutXvJk9pmVBPWYftPbDRoa21SzA",
  authDomain: "companion-keep.firebaseapp.com",
  projectId: "companion-keep",
  storageBucket: "companion-keep.firebasestorage.app",
  messagingSenderId: "234995731622",
  appId: "1:234995731622:web:3d804cccbd0ce99665b867"
};

// School admins built in (they can add classes, teachers and more admins from the console). Must match firestore.rules.
export const TEACHER_EMAILS = ["ariana.flatt@unbound.school"];
export const ADMIN_EMAILS = TEACHER_EMAILS;

// Which class this page is showing (Nov 6: one Firebase project, many classes). Students land in their class from the
// roster when they sign in with Google; teachers pick it in the console. Saved on this computer as "ck-class".
// Ms. Ariana's original class is "my-class".
export const DEFAULT_CLASS = "my-class";
export const CLASS_ID = (() => {
  try {
    const q = new URLSearchParams(location.search).get("c"), v = q || localStorage.getItem("ck-class") || DEFAULT_CLASS;
    return /^[a-z0-9-]{1,40}$/.test(v) ? v : DEFAULT_CLASS;
  } catch (e) { return DEFAULT_CLASS; }
})();
export function switchClass(id) { try { localStorage.setItem("ck-class", id); } catch (e) {} location.replace(location.pathname); }
