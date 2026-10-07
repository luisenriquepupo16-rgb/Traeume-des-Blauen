/* ================================================================
   TRÄUME DES BLAUEN — Lógica del catálogo web
   Lee docs/catalog.json y renderiza la interfaz.
   ================================================================ */

// ================================================================
// 1. ESTADO GLOBAL
// ================================================================
let catalog = null;           // El JSON completo
let appsData = [];            // Solo el array de apps
let siteInfo = {};            // Metadatos del sitio
let currentTab = "todas";     // Tab activa
let currentSearch = "";       // Búsqueda actual
let activeCategory = "todas"; // Categoría activa

// ================================================================
// 2. CARGA DEL CATÁLOGO
// ================================================================
async function loadCatalog() {
    try {
        const response = await fetch("catalog.json", { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        catalog = await response.json();
        appsData = catalog.apps || [];
        siteInfo = catalog.site || {};

        applySiteInfo();
        renderCategoryFilters();
        renderCards();
    } catch (err) {
        console.error("Error cargando catalog.json:", err);
        document.getElementById("cardsGrid").innerHTML = `
            <p style="grid-column:1/-1; text-align:center; color:var(--muted);">
                ⚠️ No se pudo cargar el catálogo. Intenta recargar la página.
            </p>`;
    }
}

// ================================================================
// 3. APLICAR METADATOS DEL SITIO
// ================================================================
function applySiteInfo() {
    if (siteInfo.title) {
        document.title = siteInfo.title;
        document.getElementById("siteTitle").textContent = `💙 ${siteInfo.title}`;
    }
    if (siteInfo.subtitle) {
        document.getElementById("siteSubtitle").textContent =
            `${siteInfo.subtitle} — aplicaciones hechas con claridad.`;
    }
    if (siteInfo.whatsapp) {
        document.getElementById("whatsappLink").href =
            `https://wa.me/${siteInfo.whatsapp}`;
    }
    if (siteInfo.github) {
        document.getElementById("githubLink").href =
            `https://github.com/${siteInfo.github}`;
    }
    document.getElementById("year").textContent = new Date().getFullYear();
}

// ================================================================
// 4. FILTROS DE CATEGORÍA (dinámicos desde el JSON)
// ================================================================
function renderCategoryFilters() {
    const container = document.getElementById("categoryFilters");
    container.innerHTML = "";

    // Recolectar categorías únicas
    const categories = new Set();
    appsData.forEach(app => {
        if (app.category) categories.add(app.category);
    });

    // Botón "Todas"
    const allBtn = document.createElement("button");
    allBtn.className = "tag-btn active";
    allBtn.dataset.category = "todas";
    allBtn.textContent = "Todas";
    allBtn.addEventListener("click", () => selectCategory("todas"));
    container.appendChild(allBtn);

    // Un botón por cada categoría
    Array.from(categories).sort().forEach(cat => {
        const btn = document.createElement("button");
        btn.className = "tag-btn";
        btn.dataset.category = cat;
        btn.textContent = cat;
        btn.addEventListener("click", () => selectCategory(cat));
        container.appendChild(btn);
    });
}

function selectCategory(cat) {
    activeCategory = cat;
    document.querySelectorAll("#categoryFilters .tag-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.category === cat);
    });
    renderCards();
}

// ================================================================
// 5. FILTRADO
// ================================================================
function filterApps() {
    let filtered = [...appsData];

    // Tab: populares / nuevas / todas
    // (por ahora, "populares" y "nuevas" se basan en heurísticas simples)
    if (currentTab === "populares") {
        filtered.sort((a, b) => getDownloadCount(b.id) - getDownloadCount(a.id));
    } else if (currentTab === "nuevas") {
        filtered.sort((a, b) => (b.updated_at || "").localeCompare(a.updated_at || ""));
    }

    // Búsqueda por nombre, descripción o tecnologías
    if (currentSearch.trim() !== "") {
        const q = currentSearch.toLowerCase().trim();
        filtered = filtered.filter(app => {
            const haystack = [
                app.name,
                app.description,
                app.category,
                ...(app.technologies || [])
            ].join(" ").toLowerCase();
            return haystack.includes(q);
        });
    }

    // Filtro por categoría
    if (activeCategory !== "todas") {
        filtered = filtered.filter(app => app.category === activeCategory);
    }

    return filtered;
}

// ================================================================
// 6. CONTADOR DE DESCARGAS (localStorage)
// ================================================================
function getDownloadCount(appId) {
    return parseInt(localStorage.getItem(`dl_${appId}`) || "0", 10);
}

function incrementDownload(appId) {
    const current = getDownloadCount(appId);
    localStorage.setItem(`dl_${appId}`, current + 1);
    return current + 1;
}

// ================================================================
// 7. RESEÑAS (localStorage)
// ================================================================
function getReviews(appId) {
    const data = localStorage.getItem(`rev_${appId}`);
    return data ? JSON.parse(data) : [];
}

function saveReview(appId, stars, comment) {
    const reviews = getReviews(appId);
    reviews.push({ stars, comment, date: new Date().toISOString() });
    localStorage.setItem(`rev_${appId}`, JSON.stringify(reviews));
    return reviews;
}

// ================================================================
// 8. UTILIDADES DE FORMATO
// ================================================================
function formatSize(bytes) {
    if (!bytes) return "—";
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(2)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ================================================================
// 9. RENDERIZADO DE TARJETAS
// ================================================================
function renderCards() {
    const apps = filterApps();
    const grid = document.getElementById("cardsGrid");
    grid.innerHTML = "";

    if (apps.length === 0) {
        grid.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:var(--muted);">No hay aplicaciones en esta sección.</p>`;
        return;
    }

    apps.forEach((app, index) => {
        const card = document.createElement("div");
        card.className = "card";
        card.setAttribute("role", "listitem");
        card.style.animationDelay = `${(index % 6) * 0.05}s`;

        // --- Icono: imagen o emoji fallback ---
        let iconHtml;
        if (app.icon) {
            iconHtml = `<img src="${escapeHtml(app.icon)}" alt="Icono de ${escapeHtml(app.name)}" onerror="this.parentElement.classList.add('emoji-fallback'); this.parentElement.textContent='📱';">`;
        } else {
            iconHtml = "📱";
            card.querySelector(".card-icon")?.classList.add("emoji-fallback");
        }

        // --- Chips de tecnologías (máx. 5 para no saturar) ---
        const techChips = (app.technologies || [])
            .slice(0, 5)
            .map(t => `<span class="tech-chip">${escapeHtml(t)}</span>`)
            .join("");

        // --- Reseñas ---
        const reviews = getReviews(app.id);
        const avgStars = reviews.length > 0
            ? (reviews.reduce((s, r) => s + r.stars, 0) / reviews.length).toFixed(1)
            : "—";

        // --- Contador de descargas ---
        const dlCount = getDownloadCount(app.id);

        // --- Dedicatoria ---
        const dedicationHtml = app.dedication
            ? `<div class="dedication">💙 ${escapeHtml(app.dedication)}</div>`
            : "";

        card.innerHTML = `
            ${app.category ? `<span class="category-chip">${escapeHtml(app.category)}</span>` : ""}
            <div class="card-icon">${iconHtml}</div>
            <h4>${escapeHtml(app.name)}</h4>
            <div class="card-description">
                ${escapeHtml(app.description).replace(/\n/g, "<br>")}
                <small>
                    Versión ${escapeHtml(app.version)} ·
                    📅 ${escapeHtml(app.updated_at)} ·
                    📦 ${formatSize(app.apk?.size_bytes)}
                </small>
                ${techChips ? `<div style="margin-top:8px;">${techChips}</div>` : ""}
            </div>
            ${dedicationHtml}
            <div class="card-meta">
                <span>⭐ ${avgStars} (${reviews.length})</span>
                <span>⬇️ ${dlCount} descargas</span>
            </div>
            <div class="card-actions">
                <button class="card-btn" data-appid="${escapeHtml(app.id)}">
                    📥 Descargar
                </button>
                <button class="share-btn" data-share="wa" data-app="${escapeHtml(app.name)}" data-url="${escapeHtml(app.apk?.url || '')}">💬</button>
                <button class="share-btn" data-share="tg" data-app="${escapeHtml(app.name)}" data-url="${escapeHtml(app.apk?.url || '')}">📲</button>
            </div>
            <div class="review-section">
                <div class="review-stars" data-appid="${escapeHtml(app.id)}" role="group" aria-label="Calificar con estrellas">
                    ${[1,2,3,4,5].map(s => `<span data-stars="${s}" role="button" tabindex="0" aria-label="${s} estrellas">★</span>`).join("")}
                </div>
                <div class="review-comment">
                    <input type="text" placeholder="Deja un comentario..." data-appid="${escapeHtml(app.id)}" class="review-input">
                    <button data-appid="${escapeHtml(app.id)}" class="review-submit">Enviar</button>
                </div>
                <div class="review-list" id="reviews-${escapeHtml(app.id)}">
                    ${reviews.slice(-3).reverse().map(r =>
                        `<div class="item">${"★".repeat(r.stars)} ${escapeHtml(r.comment || "Sin comentario")}</div>`
                    ).join("")}
                </div>
            </div>
        `;

        grid.appendChild(card);
    });

    attachCardEvents();
}

// ================================================================
// 10. EVENTOS DE LAS TARJETAS
// ================================================================
function attachCardEvents() {
    // Descargar
    document.querySelectorAll(".card-btn[data-appid]").forEach(btn => {
        btn.addEventListener("click", function () {
            const appId = this.dataset.appid;
            const app = appsData.find(a => a.id === appId);
            if (!app || !app.apk?.url) return;

            const overlay = document.getElementById("downloadOverlay");
            overlay.classList.add("show");

            incrementDownload(appId);
            window.open(app.apk.url, "_blank");

            setTimeout(() => overlay.classList.remove("show"), 1500);
            renderCards();
        });
    });

    // Compartir
    document.querySelectorAll(".share-btn").forEach(btn => {
        btn.addEventListener("click", function () {
            const appName = this.dataset.app;
            const url = this.dataset.url;
            const type = this.dataset.share;
            const text = encodeURIComponent(`📱 ${appName} — Descárgala desde Träume des Blauen`);
            let shareUrl = "";
            if (type === "wa") {
                shareUrl = `https://wa.me/?text=${text}%20${encodeURIComponent(url)}`;
            } else if (type === "tg") {
                shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${text}`;
            }
            if (shareUrl) window.open(shareUrl, "_blank");
        });
    });

    // Estrellas
    document.querySelectorAll(".review-stars").forEach(container => {
        const stars = container.querySelectorAll("span");
        stars.forEach(span => {
            span.addEventListener("click", function () {
                const val = parseInt(this.dataset.stars, 10);
                stars.forEach(s => {
                    s.classList.toggle("active", parseInt(s.dataset.stars, 10) <= val);
                });
            });
            span.addEventListener("keydown", e => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    span.click();
                }
            });
        });
    });

    // Enviar reseña
    document.querySelectorAll(".review-submit").forEach(btn => {
        btn.addEventListener("click", function () {
            const appId = this.dataset.appid;
            const section = this.closest(".review-section");
            const starsContainer = section.querySelector(".review-stars");
            const input = section.querySelector(".review-input");
            const comment = input.value.trim();
            const activeStars = starsContainer.querySelectorAll("span.active").length;

            if (activeStars === 0) {
                alert("Selecciona al menos una estrella.");
                return;
            }
            saveReview(appId, activeStars, comment);
            input.value = "";
            starsContainer.querySelectorAll("span").forEach(s => s.classList.remove("active"));
            renderCards();
        });
    });
}

// ================================================================
// 11. EVENTOS DE FILTROS (tabs, búsqueda)
// ================================================================
function attachFilterEvents() {
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", function () {
            document.querySelectorAll(".tab-btn").forEach(b => {
                b.classList.remove("active");
                b.setAttribute("aria-selected", "false");
            });
            this.classList.add("active");
            this.setAttribute("aria-selected", "true");
            currentTab = this.dataset.tab;
            renderCards();
        });
    });

    document.getElementById("searchInput").addEventListener("input", function (e) {
        currentSearch = e.target.value;
        renderCards();
    });
}

// ================================================================
// 12. TEMA OSCURO
// ================================================================
function initTheme() {
    const toggle = document.getElementById("themeToggle");
    const saved = localStorage.getItem("theme") || "light";

    if (saved === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
        toggle.innerHTML = "☀️ Modo claro";
    }

    toggle.addEventListener("click", function () {
        const isDark = document.documentElement.getAttribute("data-theme") === "dark";
        if (isDark) {
            document.documentElement.removeAttribute("data-theme");
            localStorage.setItem("theme", "light");
            this.innerHTML = "🌙 Modo oscuro";
        } else {
            document.documentElement.setAttribute("data-theme", "dark");
            localStorage.setItem("theme", "dark");
            this.innerHTML = "☀️ Modo claro";
        }
    });
}

// ================================================================
// 13. INICIO
// ================================================================
document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    attachFilterEvents();
    loadCatalog();
});