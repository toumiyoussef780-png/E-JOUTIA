const STORAGE_KEY = "ejoutia_annonces_v2";
const USER_KEY = "ejoutia_user_v1";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80";

const state = {
  annonces: [],
  filtered: [],
  currentUser: null,
};

const els = {
  year: document.getElementById("year"),
  resultsCount: document.getElementById("resultsCount"),
  status: document.getElementById("status"),
  productsGrid: document.getElementById("productsGrid"),
  emptyState: document.getElementById("emptyState"),

  btnPublish: document.getElementById("btnPublish"),
  btnLogin: document.getElementById("btnLogin"),
  btnLogout: document.getElementById("btnLogout"),

  heroPublishBtn: document.getElementById("heroPublishBtn"),
  promoPublishBtn: document.getElementById("promoPublishBtn"),
  ctaPublishBtn: document.getElementById("ctaPublishBtn"),

  authModal: document.getElementById("authModal"),
  closeAuth: document.getElementById("closeAuth"),
  authEmail: document.getElementById("authEmail"),
  authPassword: document.getElementById("authPassword"),
  doLogin: document.getElementById("doLogin"),
  doRegister: document.getElementById("doRegister"),

  publishModal: document.getElementById("publishModal"),
  closePublish: document.getElementById("closePublish"),
  annonceForm: document.getElementById("annonceForm"),
  titre: document.getElementById("titre"),
  prix: document.getElementById("prix"),
  categorie: document.getElementById("categorie"),
  ville: document.getElementById("ville"),
  whatsapp: document.getElementById("whatsapp"),
  description: document.getElementById("description"),
  image: document.getElementById("image"),
  imagePreview: document.getElementById("imagePreview"),

  searchInput: document.getElementById("searchInput"),
  categoryFilter: document.getElementById("categoryFilter"),
  cityFilter: document.getElementById("cityFilter"),
  sortSelect: document.getElementById("sortSelect"),
};

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function nowIso() {
  return new Date().toISOString();
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatPrice(value) {
  const n = Number(value || 0);
  return `${n.toLocaleString("fr-FR")} DH`;
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function truncateText(text = "", max = 110) {
  const clean = String(text).trim();
  return clean.length > max ? clean.slice(0, max).trim() + "…" : clean;
}

function isValidWhatsapp(value = "") {
  const cleaned = value.replace(/\s+/g, "");
  return !cleaned || /^[0-9+]{8,15}$/.test(cleaned);
}

function sanitizeWhatsapp(value = "") {
  return value.replace(/[^\d+]/g, "");
}

function showStatus(message, type = "success") {
  if (!els.status) return;
  els.status.textContent = message;
  els.status.classList.remove("hidden", "success", "error");
  els.status.classList.add(type);

  window.clearTimeout(showStatus._timer);
  showStatus._timer = window.setTimeout(() => {
    els.status.classList.add("hidden");
    els.status.classList.remove("success", "error");
  }, 2600);
}

function openModal(modalEl) {
  if (modalEl) modalEl.classList.remove("hidden");
}

function closeModal(modalEl) {
  if (modalEl) modalEl.classList.add("hidden");
}

function saveUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function loadUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveAnnonces(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function seedAnnonces() {
  const demo = [
    {
      id: generateId(),
      titre: "iPhone 13 Pro • Très bon état",
      prix: 6900,
      categorie: "Electronique",
      ville: "Casablanca",
      whatsapp: "0666771366",
      description:
        "iPhone 13 Pro en très bon état, batterie correcte, face ID OK, vendu avec câble.",
      image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80",
      createdAt: nowIso(),
      ownerEmail: "demo@ejoutia.com",
    },
    {
      id: generateId(),
      titre: "Canapé moderne 3 places",
      prix: 2500,
      categorie: "Maison",
      ville: "Rabat",
      whatsapp: "0666771366",
      description:
        "Canapé confortable, design moderne, idéal pour salon chic. Très peu utilisé.",
      image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      ownerEmail: "demo@ejoutia.com",
    },
    {
      id: generateId(),
      titre: "Sneakers premium neuves",
      prix: 799,
      categorie: "Mode",
      ville: "Marrakech",
      whatsapp: "0666771366",
      description:
        "Chaussures premium neuves, style tendance, confort au quotidien, pointures disponibles.",
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80",
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      ownerEmail: "demo@ejoutia.com",
    },
    {
      id: generateId(),
      titre: "Service de réparation PC & Laptop",
      prix: 150,
      categorie: "Services",
      ville: "Tanger",
      whatsapp: "0666771366",
      description:
        "Diagnostic, nettoyage, optimisation et réparation de PC portable et bureau.",
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
      createdAt: new Date(Date.now() - 240000000).toISOString(),
      ownerEmail: "demo@ejoutia.com",
    },
    {
      id: generateId(),
      titre: "Accessoires auto premium",
      prix: 450,
      categorie: "Auto",
      ville: "Agadir",
      whatsapp: "0666771366",
      description:
        "Pack d’accessoires auto élégants et pratiques, parfait pour améliorer le confort.",
      image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80",
      createdAt: new Date(Date.now() - 320000000).toISOString(),
      ownerEmail: "demo@ejoutia.com",
    },
    {
      id: generateId(),
      titre: "Lampe décorative design",
      prix: 220,
      categorie: "Maison",
      ville: "Fès",
      whatsapp: "0666771366",
      description:
        "Lampe décorative minimaliste avec finition chic. Parfaite pour chambre ou salon.",
      image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
      createdAt: new Date(Date.now() - 420000000).toISOString(),
      ownerEmail: "demo@ejoutia.com",
    },
  ];

  saveAnnonces(demo);
  return demo;
}

function loadAnnonces() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return seedAnnonces();
  try {
    const items = JSON.parse(raw);
    return Array.isArray(items) ? items : seedAnnonces();
  } catch {
    return seedAnnonces();
  }
}

function updateAuthUI() {
  const loggedIn = Boolean(state.currentUser);

  els.btnLogin?.classList.toggle("hidden", loggedIn);
  els.btnLogout?.classList.toggle("hidden", !loggedIn);

  const publishText = loggedIn ? "Publier annonce" : "Connexion pour publier";
  [els.btnPublish, els.heroPublishBtn, els.promoPublishBtn, els.ctaPublishBtn].forEach((btn) => {
    if (btn) btn.textContent = publishText;
  });
}

function getFilters() {
  return {
    q: els.searchInput?.value.trim().toLowerCase() || "",
    category: els.categoryFilter?.value || "",
    city: els.cityFilter?.value || "",
    sort: els.sortSelect?.value || "new",
  };
}

function applyFilters() {
  const { q, category, city, sort } = getFilters();

  let list = [...state.annonces].filter((item) => {
    const matchesQuery =
      !q ||
      item.titre.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.categorie.toLowerCase().includes(q) ||
      item.ville.toLowerCase().includes(q);

    const matchesCategory = !category || item.categorie === category;
    const matchesCity = !city || item.ville === city;

    return matchesQuery && matchesCategory && matchesCity;
  });

  list.sort((a, b) => {
    if (sort === "price_asc") return Number(a.prix) - Number(b.prix);
    if (sort === "price_desc") return Number(b.prix) - Number(a.prix);
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  state.filtered = list;
  renderAnnonces();
}

function renderAnnonces() {
  if (!els.productsGrid || !els.emptyState || !els.resultsCount) return;

  els.productsGrid.innerHTML = "";

  els.resultsCount.textContent =
    state.filtered.length === 0
      ? "0 annonce trouvée"
      : `${state.filtered.length} annonce${state.filtered.length > 1 ? "s" : ""} trouvée${state.filtered.length > 1 ? "s" : ""}`;

  if (state.filtered.length === 0) {
    els.emptyState.classList.remove("hidden");
    return;
  }

  els.emptyState.classList.add("hidden");

  const cards = state.filtered.map((item) => {
    const whatsapp = sanitizeWhatsapp(item.whatsapp || "");
    const whatsappLink = whatsapp
      ? `https://wa.me/212${whatsapp.replace(/^0/, "")}?text=${encodeURIComponent(
          `Bonjour, je suis intéressé(e) par votre annonce: ${item.titre}`
        )}`
      : null;

    const card = document.createElement("article");
    card.className = "product-card";
    card.innerHTML = `
      <div class="product-media">
        <img src="${escapeHtml(item.image || DEFAULT_IMAGE)}" alt="${escapeHtml(item.titre)}" loading="lazy" />
        <div class="product-badge">${escapeHtml(item.categorie)}</div>
      </div>
      <div class="product-body">
        <h3 class="product-title">${escapeHtml(item.titre)}</h3>
        <div class="product-price">${formatPrice(item.prix)}</div>
        <div class="product-meta">
          <span>📍 ${escapeHtml(item.ville)}</span>
          <span>🕒 ${escapeHtml(formatDate(item.createdAt))}</span>
        </div>
        <div class="product-desc">${escapeHtml(truncateText(item.description || "Sans description.", 120))}</div>
        <div class="product-actions">
          ${
            whatsappLink
              ? `<a class="btn primary" href="${whatsappLink}" target="_blank" rel="noopener">WhatsApp</a>`
              : `<button class="btn" disabled>WhatsApp indisponible</button>`
          }
          <button class="btn" data-view-id="${escapeHtml(item.id)}">Voir plus</button>
        </div>
      </div>
    `;
    return card;
  });

  cards.forEach((card) => els.productsGrid.appendChild(card));

  els.productsGrid.querySelectorAll("[data-view-id]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = e.currentTarget.getAttribute("data-view-id");
      const item = state.annonces.find((x) => x.id === id);
      if (!item) return;

      const fullText =
        `${item.titre}\n\n` +
        `Prix: ${formatPrice(item.prix)}\n` +
        `Catégorie: ${item.categorie}\n` +
        `Ville: ${item.ville}\n` +
        `Date: ${formatDate(item.createdAt)}\n\n` +
        `${item.description || "Sans description."}`;

      alert(fullText);
    });
  });
}

function resetPublishForm() {
  els.annonceForm?.reset();
  if (els.imagePreview) {
    els.imagePreview.src = "";
    els.imagePreview.classList.add("hidden");
  }
}

function handleImagePreview(file) {
  if (!file || !els.imagePreview) return;
  const reader = new FileReader();
  reader.onload = () => {
    els.imagePreview.src = reader.result;
    els.imagePreview.classList.remove("hidden");
  };
  reader.readAsDataURL(file);
}

function openPublishFlow() {
  if (!state.currentUser) {
    openModal(els.authModal);
    showStatus("Connecte-toi d’abord pour publier.", "error");
    return;
  }
  openModal(els.publishModal);
}

function handleRegister() {
  const email = els.authEmail?.value.trim().toLowerCase();
  const password = els.authPassword?.value || "";

  if (!email || !password) {
    showStatus("Remplis email et mot de passe.", "error");
    return;
  }

  if (password.length < 6) {
    showStatus("Mot de passe trop court.", "error");
    return;
  }

  const user = { email };
  state.currentUser = user;
  saveUser(user);
  updateAuthUI();
  closeModal(els.authModal);
  showStatus("Inscription réussie.", "success");
}

function handleLogin() {
  const email = els.authEmail?.value.trim().toLowerCase();
  const password = els.authPassword?.value || "";

  if (!email || !password) {
    showStatus("Remplis email et mot de passe.", "error");
    return;
  }

  const user = { email };
  state.currentUser = user;
  saveUser(user);
  updateAuthUI();
  closeModal(els.authModal);
  showStatus("Connexion réussie.", "success");
}

function handleLogout() {
  state.currentUser = null;
  localStorage.removeItem(USER_KEY);
  updateAuthUI();
  showStatus("Déconnexion réussie.", "success");
}

function handlePublishSubmit(event) {
  event.preventDefault();

  if (!state.currentUser) {
    closeModal(els.publishModal);
    openModal(els.authModal);
    showStatus("Connecte-toi pour publier.", "error");
    return;
  }

  const titre = els.titre?.value.trim() || "";
  const prix = Number((els.prix?.value || "").replace(",", "."));
  const categorie = els.categorie?.value || "";
  const ville = els.ville?.value || "";
  const whatsapp = (els.whatsapp?.value || "").trim();
  const description = (els.description?.value || "").trim();
  const file = els.image?.files?.[0];

  if (!titre || !prix || !categorie || !ville) {
    showStatus("Complète les champs obligatoires.", "error");
    return;
  }

  if (prix <= 0 || Number.isNaN(prix)) {
    showStatus("Prix invalide.", "error");
    return;
  }

  if (!isValidWhatsapp(whatsapp)) {
    showStatus("Numéro WhatsApp invalide.", "error");
    return;
  }

  const createAnnonce = (imageData = DEFAULT_IMAGE) => {
    const annonce = {
      id: generateId(),
      titre,
      prix,
      categorie,
      ville,
      whatsapp,
      description,
      image: imageData || DEFAULT_IMAGE,
      createdAt: nowIso(),
      ownerEmail: state.currentUser.email,
    };

    state.annonces.unshift(annonce);
    saveAnnonces(state.annonces);
    applyFilters();
    closeModal(els.publishModal);
    resetPublishForm();
    showStatus("Annonce publiée avec succès.", "success");
  };

  if (file) {
    const reader = new FileReader();
    reader.onload = () => createAnnonce(reader.result);
    reader.onerror = () => {
      showStatus("Erreur lecture image. Annonce publiée sans image locale.", "error");
      createAnnonce(DEFAULT_IMAGE);
    };
    reader.readAsDataURL(file);
  } else {
    createAnnonce(DEFAULT_IMAGE);
  }
}

function bindEvents() {
  [els.btnPublish, els.heroPublishBtn, els.promoPublishBtn, els.ctaPublishBtn].forEach((btn) => {
    btn?.addEventListener("click", openPublishFlow);
  });

  els.btnLogin?.addEventListener("click", () => openModal(els.authModal));
  els.btnLogout?.addEventListener("click", handleLogout);

  els.closeAuth?.addEventListener("click", () => closeModal(els.authModal));
  els.closePublish?.addEventListener("click", () => closeModal(els.publishModal));

  els.doLogin?.addEventListener("click", handleLogin);
  els.doRegister?.addEventListener("click", handleRegister);

  els.annonceForm?.addEventListener("submit", handlePublishSubmit);

  els.image?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (file) handleImagePreview(file);
  });

  [els.searchInput, els.categoryFilter, els.cityFilter, els.sortSelect].forEach((el) => {
    el?.addEventListener("input", applyFilters);
    el?.addEventListener("change", applyFilters);
  });

  [els.authModal, els.publishModal].forEach((modal) => {
    modal?.addEventListener("click", (e) => {
      if (e.target === modal) closeModal(modal);
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal(els.authModal);
      closeModal(els.publishModal);
    }
  });
}

function init() {
  if (els.year) els.year.textContent = new Date().getFullYear();

  state.currentUser = loadUser();
  state.annonces = loadAnnonces();

  updateAuthUI();
  bindEvents();
  applyFilters();
}

document.addEventListener("DOMContentLoaded", init);