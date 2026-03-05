/* ============================
   E-JOUTIA - app.js (GitHub Pages friendly)
   - Publish annonce -> localStorage
   - Image preview + save (base64)
   - Render annonces list
   - Basic search filter
   ============================ */

(() => {
  "use strict";

  /* ========= 1) CONFIG: selectors (بدّلهم إلا احتجتي) ========= */
  const SELECTORS = {
    // Form (اخترت بزاف ديال الاحتمالات)
    form:
      "#addForm, #add-annonce-form, #annonceForm, #form-annonce, form[data-annonce-form]",

    // Inputs (حاولت ندير fallback names)
    title:
      "#titre, #title, input[name='titre'], input[name='title'], input[data-field='title']",
    price:
      "#prix, #price, input[name='prix'], input[name='price'], input[data-field='price']",
    category:
      "#categorie, #category, select[name='categorie'], select[name='category'], select[data-field='category']",
    city:
      "#ville, #city, input[name='ville'], input[name='city'], input[data-field='city']",
    description:
      "#description, #desc, textarea[name='description'], textarea[name='desc'], textarea[data-field='description']",
    phone:
      "#telephone, #phone, input[name='telephone'], input[name='phone'], input[data-field='phone']",
    whatsapp:
      "#whatsapp, input[name='whatsapp'], input[data-field='whatsapp']",

    // Image input
    image:
      "#image, #photo, #images, input[type='file'][name='image'], input[type='file'][data-field='image'], input[type='file']",

    // Where to render annonces
    list:
      "#annoncesList, #annonces, #productsList, #produitsList, [data-annonces-list], .annonces-list",

    // Optional: search input
    search:
      "#search, #searchInput, input[name='search'], input[type='search'], [data-search]",

    // Optional status element
    status: "#status, #message, .status, [data-status]",
  };

  /* ========= 2) STORAGE ========= */
  const STORAGE_KEY = "ejoutia_annonces_v1";

  function loadAnnonces() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveAnnonces(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  /* ========= 3) HELPERS ========= */
  function $(sel) {
    return document.querySelector(sel);
  }

  function $all(sel) {
    return Array.from(document.querySelectorAll(sel));
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function toNumber(val) {
    const n = Number(String(val ?? "").replace(",", ".").trim());
    return Number.isFinite(n) ? n : null;
  }

  function formatPrice(price) {
    if (price == null) return "";
    return `${price} DH`;
  }

  function showStatus(msg, type = "info") {
    const el = $(SELECTORS.status);
    if (!el) {
      // fallback بسيط
      if (type === "error") console.error(msg);
      else console.log(msg);
      return;
    }
    el.textContent = msg;
    el.style.display = "block";
    el.style.padding = "10px";
    el.style.margin = "10px 0";
    el.style.borderRadius = "10px";
    el.style.fontWeight = "600";
    el.style.background =
      type === "error"
        ? "#ffe5e5"
        : type === "success"
        ? "#e7ffe8"
        : "#e8f0ff";
    el.style.color = "#111";
  }

  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = () => reject(new Error("File read error"));
      fr.readAsDataURL(file);
    });
  }

  function normalizeWhatsapp(phone, whatsapp) {
    // إذا عطاك whatsapp استعملو، وإلا استعمل phone
    let n = (whatsapp || phone || "").toString().trim();
    n = n.replace(/[^\d+]/g, "");
    // المغرب: إذا بدا بـ 0 => بدلو لـ 212
    if (n.startsWith("0")) n = "212" + n.slice(1);
    if (n.startsWith("+")) n = n.slice(1);
    return n;
  }

  /* ========= 4) RENDER ========= */
  function renderAnnonces(list, filterText = "") {
    const container = $(SELECTORS.list);
    if (!container) return;

    const q = filterText.trim().toLowerCase();
    const filtered = !q
      ? list
      : list.filter((a) => {
          const hay = `${a.title} ${a.description} ${a.category} ${a.city}`.toLowerCase();
          return hay.includes(q);
        });

    if (filtered.length === 0) {
      container.innerHTML =
        `<div style="padding:12px;border:1px solid #ddd;border-radius:12px;">
          <b>مكاين حتى إعلان دابا</b><br/>
          جرّب ضيف أول annonce من الفورم.
        </div>`;
      return;
    }

    container.innerHTML = filtered
      .map((a) => {
        const title = escapeHtml(a.title);
        const desc = escapeHtml(a.description || "");
        const cat = escapeHtml(a.category || "");
        const city = escapeHtml(a.city || "");
        const price = a.price != null ? escapeHtml(formatPrice(a.price)) : "";
        const img = a.imageDataUrl
          ? `<img src="${a.imageDataUrl}" alt="${title}" style="width:100%;max-height:220px;object-fit:cover;border-radius:12px;margin-bottom:10px;">`
          : "";

        const wa = normalizeWhatsapp(a.phone, a.whatsapp);
        const waText = encodeURIComponent(
          `سلام، بغيت هاد الإعلان: ${a.title}\nالثمن: ${formatPrice(a.price)}\nالمدينة: ${a.city || ""}`
        );
        const waLink = wa
          ? `https://wa.me/${wa}?text=${waText}`
          : "";

        return `
        <div class="annonce-card" style="border:1px solid #e6e6e6;border-radius:14px;padding:12px;margin:10px 0;background:#fff;">
          ${img}
          <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;">
            <div style="flex:1;">
              <div style="font-size:18px;font-weight:800;">${title}</div>
              <div style="opacity:.75;margin-top:4px;">${cat}${cat && city ? " • " : ""}${city}</div>
            </div>
            <div style="font-size:16px;font-weight:900;white-space:nowrap;">${price}</div>
          </div>

          ${desc ? `<div style="margin-top:10px;line-height:1.4;">${desc}</div>` : ""}

          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px;">
            ${
              waLink
                ? `<a href="${waLink}" target="_blank" rel="noopener" style="text-decoration:none;padding:10px 12px;border-radius:12px;background:#25D366;color:#fff;font-weight:800;">Order WhatsApp</a>`
                : ""
            }
            <button data-del="${a.id}" style="padding:10px 12px;border-radius:12px;border:1px solid #ddd;background:#f7f7f7;font-weight:700;cursor:pointer;">
              Supprimer
            </button>
          </div>
        </div>`;
      })
      .join("");

    // delete handlers
    $all("[data-del]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-del");
        const next = loadAnnonces().filter((x) => String(x.id) !== String(id));
        saveAnnonces(next);
        renderAnnonces(next, ($(SELECTORS.search)?.value || "").trim());
        showStatus("✅ تم حذف الإعلان", "success");
      });
    });
  }

  /* ========= 5) INIT ========= */
  document.addEventListener("DOMContentLoaded", () => {
    const form = $(SELECTORS.form);
    const inputTitle = $(SELECTORS.title);
    const inputPrice = $(SELECTORS.price);
    const inputCategory = $(SELECTORS.category);
    const inputCity = $(SELECTORS.city);
    const inputDesc = $(SELECTORS.description);
    const inputPhone = $(SELECTORS.phone);
    const inputWhatsapp = $(SELECTORS.whatsapp);
    const inputImage = $(SELECTORS.image);
    const searchInput = $(SELECTORS.search);

    // render existing annonces
    renderAnnonces(loadAnnonces());

    // search
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        renderAnnonces(loadAnnonces(), searchInput.value || "");
      });
    }

    // if no form found => show hint
    if (!form) {
      showStatus(
        "⚠️ ما لقيتش فورم ديال نشر الإعلان. خاص الفورم يكون عندو id بحال addForm أو form-annonce (ولا صيفط ليا IDs باش نضبطهم).",
        "error"
      );
      return;
    }

    // image preview (optional)
    let previewEl = document.getElementById("imagePreview");
    if (!previewEl && inputImage) {
      previewEl = document.createElement("img");
      previewEl.id = "imagePreview";
      previewEl.style.cssText =
        "display:none;width:100%;max-height:220px;object-fit:cover;border-radius:12px;margin-top:10px;border:1px solid #eee;";
      inputImage.insertAdjacentElement("afterend", previewEl);

      inputImage.addEventListener("change", async () => {
        const file = inputImage.files?.[0];
        if (!file) {
          previewEl.style.display = "none";
          previewEl.src = "";
          return;
        }
        // limit size ~ 1.5MB
        if (file.size > 1.5 * 1024 * 1024) {
          showStatus("⚠️ الصورة كبيرة بزاف. حاول صورة أقل من 1.5MB.", "error");
          inputImage.value = "";
          previewEl.style.display = "none";
          return;
        }
        const url = await readFileAsDataURL(file);
        previewEl.src = url;
        previewEl.style.display = "block";
      });
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const title = (inputTitle?.value || "").trim();
      const price = toNumber(inputPrice?.value);
      const category = (inputCategory?.value || "").trim();
      const city = (inputCity?.value || "").trim();
      const description = (inputDesc?.value || "").trim();
      const phone = (inputPhone?.value || "").trim();
      const whatsapp = (inputWhatsapp?.value || "").trim();

      if (!title) {
        showStatus("⚠️ دخل العنوان (Titre) ديال الإعلان.", "error");
        inputTitle?.focus();
        return;
      }
      if (price == null) {
        showStatus("⚠️ دخل الثمن (Prix) بشكل صحيح.", "error");
        inputPrice?.focus();
        return;
      }

      // read image (optional)
      let imageDataUrl = "";
      const file = inputImage?.files?.[0];
      if (file) {
        if (file.size > 1.5 * 1024 * 1024) {
          showStatus("⚠️ الصورة كبيرة بزاف. حاول صورة أقل من 1.5MB.", "error");
          return;
        }
        try {
          imageDataUrl = await readFileAsDataURL(file);
        } catch {
          showStatus("⚠️ وقع مشكل فقراءة الصورة.", "error");
          return;
        }
      }

      const annonce = {
        id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
        title,
        price,
        category,
        city,
        description,
        phone,
        whatsapp,
        imageDataUrl,
        createdAt: new Date().toISOString(),
      };

      const list = loadAnnonces();
      list.unshift(annonce);
      saveAnnonces(list);

      // reset
      form.reset();
      const preview = document.getElementById("imagePreview");
      if (preview) {
        preview.src = "";
        preview.style.display = "none";
      }

      renderAnnonces(list, (searchInput?.value || "").trim());
      showStatus("✅ Annonce publiée بنجاح!", "success");
    });
  });
})();