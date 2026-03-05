// app.js (Firestore + Auth) — بدون Storage

import { db, auth } from "./firebase.js";

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";

import {
  collection, addDoc, deleteDoc, doc,
  onSnapshot, orderBy, query, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

// ===== Settings =====
const WA_NUMBER = "212666771366";

// ===== Elements =====
const productsGrid = document.getElementById("productsGrid");
const resultsCount = document.getElementById("resultsCount");
const emptyState = document.getElementById("emptyState");

const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const cityFilter = document.getElementById("cityFilter");
const sortSelect = document.getElementById("sortSelect");

const form = document.getElementById("annonceForm");
const clearListingsBtn = document.getElementById("clearListings");

const modal = document.getElementById("modal");
const modalBody = document.getElementById("modalBody");
const closeModalBtn = document.getElementById("closeModal");

const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ===== Helpers =====
function escapeHtml(str){
  return (str || "").toString()
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");
}

function normalize(s){ return (s||"").toString().toLowerCase().trim(); }

function formatPrice(n){ return `${(Number(n)||0).toLocaleString("fr-FR")} DH`; }

function placeholderImg(seed){
  const safe = encodeURIComponent((seed || "item").toString().slice(0, 30));
  return `https://picsum.photos/seed/ejoutia-${safe}/900/600`;
}

function whatsappLink(listing){
  const lines = [
    `Salam, bghit ncommander had l-produit:`,
    `- ${listing.title}`,
    `- Prix: ${formatPrice(listing.price)}`,
    `- Catégorie: ${listing.category}`,
    listing.city ? `- Ville: ${listing.city}` : null,
    `Merci.`
  ].filter(Boolean);
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
}

function getFilters(){
  return {
    q: normalize(searchInput?.value),
    cat: categoryFilter?.value || "all",
    city: cityFilter?.value || "all",
    sort: sortSelect?.value || "new"
  };
}

// ===== Auth (Prompt بسيط) =====
async function loginFlow(){
  const email = prompt("Email:");
  if(!email) return;
  const pass = prompt("Mot de passe (min 6):");
  if(!pass) return;

  try{
    await signInWithEmailAndPassword(auth, email, pass);
  }catch(e){
    // إذا ما لقاوش user => نسجلوه
    if (String(e?.code).includes("auth/user-not-found") || String(e?.code).includes("auth/invalid-credential")) {
      try{
        await createUserWithEmailAndPassword(auth, email, pass);
      }catch(e2){
        alert("Erreur inscription: " + (e2?.message || e2));
      }
    } else {
      alert("Erreur login: " + (e?.message || e));
    }
  }
}

function ensureLoggedIn(){
  if (auth.currentUser) return true;
  alert("خاصك دير Login باش تنشر/تحذف.");
  return false;
}

// ✅ إلى ما عندكش أزرار Login/Logout فـ HTML، غادي نستعمل shortcuts:
document.addEventListener("keydown", (e)=>{
  if (e.ctrlKey && e.key.toLowerCase() === "l") loginFlow();     // Ctrl+L
  if (e.ctrlKey && e.key.toLowerCase() === "o") signOut(auth);  // Ctrl+O
});

onAuthStateChanged(auth, (user)=>{
  // نقدر نخلي submit disabled إلا ما كانش user
  const btn = form?.querySelector('button[type="annoncer"]');
  if (btn) btn.disabled = !user;
});

// ===== Firestore realtime =====
let ALL = [];

const qListings = query(collection(db, "listings"), orderBy("createdAt", "desc"));
onSnapshot(qListings, (snap)=>{
  ALL = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  render();
});

// ===== Modal =====
function openModal(l){
  if(!modal || !modalBody) return;
  modalBody.innerHTML = `
    <div class="modalGrid">
      <div class="modalImg">
        <img src="${escapeHtml(l.imgUrl || placeholderImg(l.title))}" alt="${escapeHtml(l.title)}">
      </div>
      <div class="modalInfo">
        <h3>${escapeHtml(l.title)}</h3>
        <div class="modalMeta">
          <span class="tag">${escapeHtml(l.category)}</span>
          <span class="tag">${escapeHtml(l.city || "—")}</span>
        </div>
        <div class="modalPrice">${escapeHtml(formatPrice(l.price))}</div>
        <p class="smallNote">${escapeHtml(l.desc || "")}</p>
        <div class="modalBtns">
          <a class="btnBuyLink" href="${whatsappLink(l)}" target="_blank" rel="noopener">Commander WhatsApp</a>
          <button class="btnClose" type="button" id="modalClose2">Fermer</button>
        </div>
      </div>
    </div>
  `;
  modal.classList.remove("hidden");
  document.getElementById("modalClose2")?.addEventListener("click", closeModal);
}
function closeModal(){ modal?.classList.add("hidden"); }
closeModalBtn?.addEventListener("click", closeModal);
modal?.addEventListener("click", (e)=>{ if(e.target===modal) closeModal(); });

// ===== Render =====
function applyFilters(arr){
  const { q, cat, city, sort } = getFilters();

  let out = arr.filter(l=>{
    const okCat = (cat==="all") ? true : l.category === cat;
    const okCity = (city==="all") ? true : (l.city||"—") === city;
    const hay = normalize(`${l.title} ${l.desc} ${l.category} ${l.city}`);
    const okQ = q ? hay.includes(q) : true;
    return okCat && okCity && okQ;
  });

  if(sort==="cheap") out.sort((a,b)=>(Number(a.price)||0)-(Number(b.price)||0));
  else if(sort==="exp") out.sort((a,b)=>(Number(b.price)||0)-(Number(a.price)||0));
  // "new" already by firestore order
  return out;
}

function createCard(l){
  const card = document.createElement("article");
  card.className = "product";

  const img = l.imgUrl || placeholderImg(l.title);

  card.innerHTML = `
    <img src="${escapeHtml(img)}" alt="${escapeHtml(l.title)}" loading="lazy">
    <div class="productBody">
      <h3 class="productTitle">${escapeHtml(l.title)}</h3>
      <div class="productMeta">
        <span class="tag">${escapeHtml(l.category)}</span>
        <span class="tag">${escapeHtml(l.city || "—")}</span>
      </div>
      <p class="smallNote">${escapeHtml(l.desc || "")}</p>
      <div class="priceRow">
        <span class="price">${escapeHtml(formatPrice(l.price))}</span>
        <div class="rowBtns">
          <button class="btnDetails" type="button">Détails</button>
          <button class="btnBuy" type="button">Commander</button>
          <button class="btnDel" type="button" title="Supprimer">🗑️</button>
        </div>
      </div>
    </div>
  `;

  card.querySelector(".btnBuy").addEventListener("click", ()=>window.open(whatsappLink(l), "_blank", "noopener"));
  card.querySelector(".btnDetails").addEventListener("click", ()=>openModal(l));

  card.querySelector(".btnDel").addEventListener("click", async ()=>{
    const user = auth.currentUser;
    if(!user) return alert("Login: Ctrl+L");
    if(l.ownerUid && l.ownerUid !== user.uid) return alert("مايمكنش تحذف annonce ديال شي حد آخر.");
    if(confirm("Supprimer had l'annonce?")){
      await deleteDoc(doc(db, "listings", l.id));
    }
  });

  return card;
}

function render(){
  // refresh city options dynamically
  if(cityFilter){
    const current = cityFilter.value || "all";
    const cities = Array.from(new Set(ALL.map(x => x.city || "—"))).filter(Boolean);
    cityFilter.innerHTML = `<option value="all">Toutes villes</option>` + cities.map(c=>`<option>${escapeHtml(c)}</option>`).join("");
    cityFilter.value = cities.includes(current) ? current : "all";
  }

  const filtered = applyFilters([...ALL]);

  productsGrid.innerHTML = "";
  filtered.forEach(l => productsGrid.appendChild(createCard(l)));

  if(resultsCount) resultsCount.textContent = String(filtered.length);
  if(emptyState) emptyState.hidden = filtered.length !== 0;
}

["searchInput","categoryFilter","cityFilter","sortSelect"].forEach(id=>{
  document.getElementById(id)?.addEventListener("input", render);
  document.getElementById(id)?.addEventListener("change", render);
});

// ===== Create listing =====
form?.addEventListener("submit", async (e)=>{
  e.preventDefault();
  if(!ensureLoggedIn()) return;

  const user = auth.currentUser;

  const title = document.getElementById("titre").value.trim().slice(0,60);
  const price = Number(document.getElementById("prix").value);
  const category = document.getElementById("categorie").value;
  const city = (document.getElementById("ville").value || "").trim().slice(0,40) || "—";
  const desc = (document.getElementById("description").value || "").trim().slice(0,500) || "—";

  if(!title || !Number.isFinite(price) || price < 0 || price > 100000000 || !category){
    alert("Chouf l titre / catégorie / prix.");
    return;
  }

  await addDoc(collection(db, "listings"), {
    title,
    price,
    category,
    city,
    desc,
    imgUrl: "",               // بلا Storage دابا
    ownerUid: user.uid,
    createdAt: serverTimestamp()
  });

  form.reset();
  location.hash = "#produits";
});

// Clear button: ماشي clear كامل حيت DB مشتركة
clearListingsBtn?.addEventListener("click", ()=>{
  alert("Firestore مشتركة: مايمكنش نمسحو كلشي هنا. نقدر نضيفو Admin من بعد.");
});
document.getElementById("addForm").addEventListener("submit", (e) => {
  e.preventDefault(); // مهم
  // حفظ الإعلان...
});