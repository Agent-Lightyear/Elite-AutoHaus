// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

// 🔑 Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAMR69VGl2IFav9-P-rwpzaLvZh7WpwFcE",
  authDomain: "elite-autohaus-018s.firebaseapp.com",
  projectId: "elite-autohaus-018s",
  storageBucket: "elite-autohaus-018s.appspot.com",
  messagingSenderId: "374828356950",
  appId: "1:374828356950:web:04abb8bcced3f3ea02f2f7"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
