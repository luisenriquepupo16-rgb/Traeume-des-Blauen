/* ================================================================
   SHARED — Lógica compartida para páginas internas
   Carga el tema y el contenido JSON correspondiente.
   ================================================================ */

// ================================================================
// 1. UTILIDADES
// ================================================================

function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

async function loadJson(url) {
    try {
        const response = await fetch(url + "?t=" + Date.now(), { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (err) {
        console.warn(`No se pudo cargar ${url}:`, err);
        return null;
    }
}

// ================================================================
// 2. TEMA
// ================================================================
function initTheme() {
    const toggle = document.getElementById("themeToggle");
    if (!toggle) return;
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
// 3. RENDERIZADO — RETOS
// ================================================================
function renderChallengesFull(data, containerId) {
    const grid = document.getElementById(containerId);
    if (!grid) return;

    if (!data || !data.items || data.items.length === 0) {
        grid.innerHTML = `<p class="empty-message">No hay retos publicados todavía.</p>`;
        return;
    }

    grid.innerHTML = data.items.map(item => `
        <article class="challenge-card">
            <h3>${escapeHtml(item.title)}</h3>
            <p class="challenge-context">${escapeHtml(item.context)}</p>
            <p class="challenge-solution"><strong>Solución:</strong> ${escapeHtml(item.solution)}</p>
            <p class="challenge-lesson"><strong>Aprendizaje:</strong> ${escapeHtml(item.lesson)}</p>
        </article>
    `).join("");
}

// ================================================================
// 4. RENDERIZADO — OPEN SOURCE
// ================================================================
function renderOpensourceFull(data, containerId) {
    const grid = document.getElementById(containerId);
    if (!grid) return;

    if (!data || !data.items || data.items.length === 0) {
        grid.innerHTML = `<p class="empty-message">No hay contribuciones publicadas todavía.</p>`;
        return;
    }

    grid.innerHTML = data.items.map(item => `
        <article class="opensource-card">
            <h3>${escapeHtml(item.project)}</h3>
            <p class="opensource-detail">${escapeHtml(item.detail)}</p>
            <p class="opensource-description">${escapeHtml(item.description)}</p>
        </article>
    `).join("");
}

// ================================================================
// 5. RENDERIZADO — PROYECTOS EN PROGRESO
// ================================================================
function renderInProgressFull(data, containerId) {
    const grid = document.getElementById(containerId);
    if (!grid) return;

    if (!data || !data.items || data.items.length === 0) {
        grid.innerHTML = `<p class="empty-message">No hay proyectos en progreso todavía.</p>`;
        return;
    }

    grid.innerHTML = data.items.map(item => {
        const techHtml = (item.technologies || [])
            .map(t => `<span class="tech-chip">${escapeHtml(t)}</span>`)
            .join("");

        return `
            <article class="project-card" role="listitem">
                <span class="category-tag">${escapeHtml(item.status)}</span>
                <h3>${escapeHtml(item.title)}</h3>
                <p class="description">${escapeHtml(item.description)}</p>
                ${techHtml ? `<div class="meta">${techHtml}</div>` : ""}
            </article>
        `;
    }).join("");
}

// ================================================================
// 6. RENDERIZADO — APRENDIZAJE
// ================================================================
function renderLearningFull(data, containerId) {
    const grid = document.getElementById(containerId);
    if (!grid) return;

    if (!data || !data.blocks || data.blocks.length === 0) {
        grid.innerHTML = `<p class="empty-message">No hay contenido todavía.</p>`;
        return;
    }

    grid.innerHTML = data.blocks.map(block => {
        let body = "";

        if (block.type === "list") {
            body = `<ul class="learning-list">${(block.items || [])
                .map(i => `<li>${escapeHtml(i)}</li>`)
                .join("")}</ul>`;
        } else if (block.type === "text") {
            const items = (block.items || []).map(item => `
                <div class="learning-item">
                    <strong>${escapeHtml(item.name)}</strong>
                    <span>${escapeHtml(item.reason)}</span>
                </div>
            `).join("");
            body = `${block.content ? `<p>${escapeHtml(block.content)}</p>` : ""}${items}`;
        }

        return `
            <div class="learning-block">
                <h2>${escapeHtml(block.title)}</h2>
                ${body}
            </div>
        `;
    }).join("");
}

// ================================================================
// 7. RENDERIZADO — LISTADO DEL BLOG
// ================================================================
function renderBlogList(data, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!data || !data.posts || data.posts.length === 0) {
        container.innerHTML = `<p class="empty-message">No hay entradas publicadas todavía.</p>`;
        return;
    }

    const sorted = [...data.posts].sort((a, b) =>
        (b.date || "").localeCompare(a.date || "")
    );

    container.innerHTML = sorted.map(post => `
        <article class="blog-list-item">
            <p class="blog-date">${escapeHtml(post.date_label || post.date)}</p>
            <h3><a href="${escapeHtml(post.url.replace(/^blog\//, ""))}">${escapeHtml(post.title)}</a></h3>
            <p class="blog-excerpt">${escapeHtml(post.excerpt)}</p>
            <a href="${escapeHtml(post.url.replace(/^blog\//, ""))}" class="read-more">Leer entrada →</a>
        </article>
    `).join("");
}

// ================================================================
// 8. INICIALIZACIÓN
// ================================================================
document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();
});