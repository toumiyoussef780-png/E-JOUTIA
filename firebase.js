// firebase.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyANy2n0XrmpQ745j67dyrA4uHIKfOH62LA",
  authDomain: "e-joutia.firebaseapp.com",
  projectId: "e-joutia",
  storageBucket: "e-joutia.firebasestorage.app",
  messagingSenderId: "206508757533",
  appId: "1:206508757533:web:b1033c0aefd0d2c4aaacf4",
  measurementId: "G-B98EKSSR5L"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
