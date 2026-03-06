import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-storage.js";

import { firebaseConfig } from "./config.js";

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

/* =========================
   AUTH
========================= */

export async function registerUser(email, password) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function loginUser(email, password) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function logoutUser() {
  await signOut(auth);
}

export function observeAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

/* =========================
   STORAGE
========================= */

export async function uploadImage(file) {
  if (!file) return "";

  const fileName = `annonces/${Date.now()}-${file.name}`;
  const storageRef = ref(storage, fileName);

  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return url;
}

/* =========================
   FIRESTORE
========================= */

export async function createAnnonce(data) {
  const docRef = await addDoc(collection(db, "annonces"), {
    titre: data.titre || "",
    prix: Number(data.prix || 0),
    categorie: data.categorie || "",
    ville: data.ville || "",
    whatsapp: data.whatsapp || "",
    description: data.description || "",
    image: data.image || "",
    ownerEmail: data.ownerEmail || "",
    createdAt: serverTimestamp()
  });

  return docRef.id;
}

export async function getAnnonces() {
  const q = query(collection(db, "annonces"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate
        ? data.createdAt.toDate().toISOString()
        : new Date().toISOString()
    };
  });
}