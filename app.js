import { auth, db, storage } from "./firebase.js";

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";

import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  where,
  getDocs,
  limit,
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-storage.js";

/* ========= SETTINGS ========= */
const DEFAULT_WA = "0666771366"; // بدلها برقمك إلا بغيتي
const LISTINGS_COL = "listings";

/* ========= ELEMENTS ========= */
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

const productsGrid = document.getElementById("productsGrid");
const resultsCount = document.getElementById("resultsCount");
const emptyState = document.getElementById("emptyState");
const statusEl = document.getElementById("status");

const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const cityFilter = document.getElementById("cityFilter");
const sortSelect = document.getElementById("sortSelect");

const btnPublish = document.getElementById("btnPublish");
const btnLogin = document.getElementById("btnLogin");
const btnLogout = document.getElementById("btnLogout");

const authModal = document.getElementById("authModal");
const publishModal = document.getElementById("publishModal");

const closeAuth = document.getElementById("closeAuth");
const closePublish = document.getElementById("closePublish");

const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const doLogin = document.getElementById("doLogin");
const doRegister = document.getElementById("doRegister");

const form = document.getElementById("annonceForm");
const titre = document.getElementById("titre");
const prix = document.getElementById("prix");
const categorie = document.getElementById("categorie");
const ville = document.getElementById("ville");
const whatsapp = document.getElementById("whatsapp");
const description = document.getElementById("description");
const imageInput = document.getElementById("image");
const imagePreview = document.getElementById("imagePreview");

/* ========= STATE ========= */
let currentUser = null;
let allListings = []; // cached for filters

/* ========= HELPERS ========= */
function showStatus(msg, type = "info") {
  if (!statusEl) return;
  statusEl.classList.remove("hidden");
  statusEl.textContent = msg;
  statusEl.style.borderColor =
    type === "error" ? "#fecaca" : type === "success" ? "#bbf7d0" : "#e6e7ea";
}

function clearStatus() {
  if (!statusEl) return;
  statusEl.classList.add("hidden");
  statusEl.textContent = "";
}

function openModal(el) {
  el?.classList.remove("hidden");
}
function closeModal(el) {
  el?.classList.add("hidden");
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeWA(n) {
  let x = (n || DEFAULT_WA || "").toString().trim();
  x = x.replace(/[^\d+]/g, "");
  if (x.startsWith("0")) x = "212" + x.slice(1);
  if (x.startsWith("+")) x = x.slice(1);
  return x;
}

function formatPrice(p) {
  const n = Number(p);
  if (!Number.isFinite(n)) return "";
  return `${n} DH`;
}

function applyFilters() {
  const q = (searchInput?.value || "").trim().toLowerCase();
  const cat = (categoryFilter?.value || "").trim();
  const city = (cityFilter?.value || "").trim();
  const sort = (sortSelect?.value || "new").trim();

  let list = [...allListings];

  if (q) {
    list = list.filter((x) =>
      `${x.title} ${x.description} ${x.category} ${x.city}`.toLowerCase().includes(q)
    );
  }
  if (cat) list = list.filter((x) => x.category === cat);
  if (city) list = list.filter((x) => x.city === city);

  if (sort === "price_asc") list.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
  else if (sort === "price_desc") list.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
  else list.sort((a, b) => (b.createdAtMs ?? 0) - (a.createdAtMs ?? 0));

  render(list);
}

function render(list) {
  productsGrid.innerHTML = "";

  resultsCount.textContent = `${list.length} annonce(s)`;

  if (list.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }
  emptyState.classList.add("hidden");

  const frag = document.createDocumentFragment();

  list.forEach((x) => {
    const card = document.createElement("div");
    card.className = "card";

    const img = document.createElement("img");
    img.className = "cardImg";
    img.alt = x.title || "Annonce";
    img.src = x.imageUrl || "https://dummyimage.com/800x500/eaeaea/777.png&text=E-JOUTIA";
    card.appendChild(img);

    const body = document.createElement("div");
    body.className = "cardBody";

    body.innerHTML = `
      <h4 class="cardTitle">${escapeHtml(x.title)}</h4>
      <div class="cardMeta">
        <div>${escapeHtml(x.category || "")}${x.city ? " • " + escapeHtml(x.city) : ""}</div>
        <div class="price">${escapeHtml(formatPrice(x.price))}</div>
      </div>
      <div class="cardDesc">${escapeHtml((x.description || "").slice(0, 120))}${(x.description || "").length > 120 ? "…" : ""}</div>
      <div class="cardBtns">
        <a class="btn primary" target="_blank" rel="noopener" href="https://wa.me/${normalizeWA(x.whatsapp)}?text=${encodeURIComponent("سلام، بغيت هاد الإعلان: " + (x.title || "") + " | الثمن: " + formatPrice(x.price))}">
          WhatsApp
        </a>
        ${currentUser && x.userId === currentUser.uid ? `<button class="btn danger" data-del="${x.id}">Supprimer</button>` : ""}
      </div>
    `;

    card.appendChild(body);
    frag.appendChild(card);
  });

  productsGrid.appendChild(frag);

  // delete handlers
  document.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-del");
      if (!id) return;
      try {
        await deleteDoc(doc(db, LISTINGS_COL, id));
        showStatus("✅ Annonce supprimée", "success");
      } catch (e) {
        console.error(e);
        showStatus("❌ تعذر حذف الإعلان", "error");
      }
    });
  });
}

/* ========= AUTH UI ========= */
btnLogin?.addEventListener("click", () => openModal(authModal));
closeAuth?.addEventListener("click", () => closeModal(authModal));

btnPublish?.addEventListener("click", () => {
  if (!currentUser) {
    showStatus("⚠️ خاصك تسجّل الدخول باش تنشر", "error");
    openModal(authModal);
    return;
  }
  openModal(publishModal);
});

closePublish?.addEventListener("click", () => closeModal(publishModal));

doLogin?.addEventListener("click", async () => {
  clearStatus();
  try {
    await signInWithEmailAndPassword(auth, authEmail.value.trim(), authPassword.value);
    closeModal(authModal);
    showStatus("✅ مرحبا! تسجلت الدخول.", "success");
  } catch (e) {
    console.error(e);
    showStatus("❌ البريد أو كلمة المرور غير صحيحة", "error");
  }
});

doRegister?.addEventListener("click", async () => {
  clearStatus();
  try {
    await createUserWithEmailAndPassword(auth, authEmail.value.trim(), authPassword.value);
    closeModal(authModal);
    showStatus("✅ تم إنشاء الحساب بنجاح!", "success");
  } catch (e) {
    console.error(e);
    showStatus("❌ ما قدرناش نسجلو الحساب (جرّب ايميل صحيح وباسورد قوي)", "error");
  }
});

btnLogout?.addEventListener("click", async () => {
  await signOut(auth);
});

/* ========= IMAGE PREVIEW ========= */
imageInput?.addEventListener("change", async () => {
  const f = imageInput.files?.[0];
  if (!f) {
    imagePreview?.classList.add("hidden");
    imagePreview.src = "";
    return;
  }
  if (f.size > 2 * 1024 * 1024) {
    showStatus("⚠️ الصورة كبيرة بزاف (أقل من 2MB)", "error");
    imageInput.value = "";
    return;
  }
  const url = URL.createObjectURL(f);
  imagePreview.src = url;
  imagePreview.classList.remove("hidden");
});

/* ========= PUBLISH ========= */
form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearStatus();

  if (!currentUser) {
    showStatus("⚠️ خاصك تسجّل الدخول", "error");
    openModal(authModal);
    return;
  }

  const title = (titre.value || "").trim();
  const price = Number(String(prix.value || "").replace(",", "."));
  const category = (categorie.value || "").trim();
  const city = (ville.value || "").trim();
  const desc = (description.value || "").trim();
  const wa = (whatsapp.value || DEFAULT_WA || "").trim();

  if (!title || !Number.isFinite(price) || !category || !city) {
    showStatus("⚠️ عَمّر العنوان/الثمن/الصنف/المدينة", "error");
    return;
  }

  try {
    // upload image (optional)
    let imageUrl = "";
    const file = imageInput.files?.[0];
    if (file) {
      const path = `listingImages/${currentUser.uid}/${Date.now()}_${file.name}`.replaceAll(" ", "_");
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      imageUrl = await getDownloadURL(storageRef);
    }

    const payload = {
      title,
      price,
      category,
      city,
      description: desc,
      whatsapp: wa,
      imageUrl,
      userId: currentUser.uid,
      createdAtMs: Date.now(),
    };

    await addDoc(collection(db, LISTINGS_COL), payload);

    form.reset();
    imagePreview?.classList.add("hidden");
    imagePreview.src = "";
    closeModal(publishModal);
    showStatus("✅ Annonce publiée!", "success");
  } catch (err) {
    console.error(err);
    showStatus("❌ وقع مشكل فالنشر. شوف Console.", "error");
  }
});

/* ========= LIVE LISTEN ========= */
function listenListings() {
  const q = query(collection(db, LISTINGS_COL), orderBy("createdAtMs", "desc"), limit(200));
  return onSnapshot(
    q,
    (snap) => {
      allListings = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      applyFilters();
    },
    (err) => {
      console.error(err);
      showStatus("❌ Firestore ما خدامش. راجع Rules وتهيئة Firebase.", "error");
    }
  );
}

/* ========= FILTERS ========= */
[searchInput, categoryFilter, cityFilter, sortSelect].forEach((el) => {
  el?.addEventListener("input", applyFilters);
  el?.addEventListener("change", applyFilters);
});

/* ========= AUTH STATE ========= */
onAuthStateChanged(auth, (user) => {
  currentUser = user || null;

  if (currentUser) {
    btnLogin?.classList.add("hidden");
    btnLogout?.classList.remove("hidden");
  } else {
    btnLogin?.classList.remove("hidden");
    btnLogout?.classList.add("hidden");
  }
});

/* start */
listenListings();