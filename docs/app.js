/* ================================================================
   PORTAFOLIO — Dreamer · Träume des Blauen
   Lógica: carga catalog.json, carga el Gist de descargas, renderiza.
   ================================================================ */

// ================================================================
// 1. CONFIGURACIÓN
// ================================================================
const CATALOG_URL = "catalog.json";
const GIST_DOWNLOADS_URL = "https://gist.githubusercontent.com/luisenriquepupo16-rgb/40391b1420b19d763eff10e35d1aec63/raw/downloads.json";

// ================================================================
// 2. UTILIDADES
// ================================================================

/**
 * Formatea bytes a MB o KB.
 */
function formatSize(bytes) {
    if (!bytes) return "—";
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(2)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

/**
 * Escapa HTML para prevenir XSS.
 */
function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Formatea un número con separador de miles.
 */
function formatNumber(n) {
    if (n === null || n === undefined) return "0";
    return n.toLocaleString("es-ES");
}

// ================================================================
// 3. TEMA CLARO / OSCURO
// ================================================================
function initTheme() {
    const toggle = document.getElementById("themeToggle");
    const icon = toggle.querySelector(".theme-icon");
    const label = toggle.querySelector(".theme-label");
    const saved = localStorage.getItem("theme") || "light";

    function applyTheme(theme) {
        if (theme === "dark") {
            document.documentElement.setAttribute("data-theme", "dark");
            icon.textContent = "☀️";
            label.textContent = "Modo claro";
        } else {
            document.documentElement.removeAttribute("data-theme");
            icon.textContent = "🌙";
            label.textContent = "Modo oscuro";
        }
    }

    applyTheme(saved);

    toggle.addEventListener("click", () => {
        const isDark = document.documentElement.getAttribute("data-theme") === "dark";
        const newTheme = isDark ? "light" : "dark";
        localStorage.setItem("theme", newTheme);
        applyTheme(newTheme);
    });
}

// ================================================================
// 4. CARGA DEL CATÁLOGO
// ================================================================
async function loadCatalog() {
    try {
        const response = await fetch(CATALOG_URL, { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (err) {
        console.error("Error cargando catalog.json:", err);
        return null;
    }
}

// ================================================================
// 5. CARGA DEL GIST DE DESCARGAS
// ================================================================
async function loadDownloads() {
    try {
        const response = await fetch(GIST_DOWNLOADS_URL, { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        return data.current || {};
    } catch (err) {
        console.warn("No se pudieron cargar las descargas:", err);
        return {};
    }
}

// ================================================================
// 6. RENDERIZADO DE PROYECTOS
// ================================================================
function renderProjects(apps, downloads) {
    const grid = document.getElementById("projectsGrid");

    if (!apps || apps.length === 0) {
        grid.innerHTML = `<p class="error-message">No hay proyectos publicados todavía.</p>`;
        return;
    }

    // Ordenar por fecha descendente
    const sorted = [...apps].sort((a, b) => {
        return (b.updated_at || "").localeCompare(a.updated_at || "");
    });

    grid.innerHTML = sorted.map(app => {
        const downloadsCount = downloads[app.id] || 0;
        const hasDownloads = downloadsCount > 0;

        const categoryHtml = app.category
            ? `<span class="category-tag">${escapeHtml(app.category)}</span>`
            : "";

        const dedicationHtml = app.dedication
            ? `<div class="dedication">💙 ${escapeHtml(app.dedication)}</div>`
            : "";

        const downloadsHtml = hasDownloads
            ? `<span class="downloads-badge">📥 ${formatNumber(downloadsCount)}</span>`
            : "";

        return `
            <article class="project-card" role="listitem">
                ${categoryHtml}
                <h3>${escapeHtml(app.name)}</h3>
                <p class="description">${escapeHtml(app.description)}</p>
                ${dedicationHtml}
                <div class="meta">
                    <span>📦 ${formatSize(app.apk?.size_bytes)}</span>
                    <span>📅 ${escapeHtml(app.updated_at)}</span>
                    ${downloadsHtml}
                </div>
                <a href="${escapeHtml(app.apk?.url || '#')}" 
                   target="_blank" 
                   rel="noopener" 
                   class="btn-primary"
                   style="text-align:center; padding:10px; font-size:0.9rem; margin-top:8px;">
                    📥 Descargar
                </a>
            </article>
        `;
    }).join("");
}

// ================================================================
// 7. INICIALIZACIÓN
// ================================================================
async function init() {
    initTheme();

    document.getElementById("year").textContent = new Date().getFullYear();

    // Cargar catálogo y descargas en paralelo
    const [catalog, downloads] = await Promise.all([
        loadCatalog(),
        loadDownloads()
    ]);

    if (!catalog) {
        document.getElementById("projectsGrid").innerHTML =
            `<p class="error-message">⚠️ No se pudieron cargar los proyectos. Intenta recargar la página.</p>`;
        return;
    }

    renderProjects(catalog.apps || [], downloads);
}

document.addEventListener("DOMContentLoaded", init);