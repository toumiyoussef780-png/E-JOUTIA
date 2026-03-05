import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyANy2nOXrmpQ745j67dyrA4uHIKfOH62LA",
  authDomain: "e-joutia.firebaseapp.com",
  projectId: "e-joutia",
  storageBucket: "e-joutia.appspot.com",
  messagingSenderId: "206508757533",
  appId: "1:206508757533:web:b1033c0aefd0d2c4aaacf4"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);