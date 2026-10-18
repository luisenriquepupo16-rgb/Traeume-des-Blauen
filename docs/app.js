/* ================================================================
   PORTAFOLIO — Dreamer · Träume des Blauen
   Lógica: carga catálogo, Gist, contenido JSON y gestiona el chat.
   ================================================================ */

// ================================================================
// 1. CONFIGURACIÓN
// ================================================================
const CATALOG_URL = "catalog.json";
const GIST_DOWNLOADS_URL = "https://gist.githubusercontent.com/luisenriquepupo16-rgb/40391b1420b19d763eff10e35d1aec63/raw/downloads.json";
const GIST_CHAT_URL = "https://gist.githubusercontent.com/luisenriquepupo16-rgb/40391b1420b19d763eff10e35d1aec63/raw/chat_history.json";
const WORKER_URL = "https://github-dispatch-bridge.blue-land.workers.dev";

const CONTENT_CHALLENGES = "content/challenges.json";
const CONTENT_OPENSOURCE = "content/opensource.json";
const CONTENT_BLOG = "content/blog.json";
const CONTENT_PROJECTS = "content/projects.json";
const CONTENT_LEARNING = "content/learning.json";

const PREVIEW_COUNT_CHALLENGES = 3;
const PREVIEW_COUNT_BLOG = 3;
const PREVIEW_COUNT_PROJECTS = 3;
const PREVIEW_COUNT_LEARNING = 2;

const CHAT_POLL_INTERVAL = 3000;
const CHAT_TIMEOUT_MS = 90000;
const CHAT_STORAGE_KEY = "chat_history_local";
const CHAT_CONV_ID_KEY = "chat_conversation_id";

// ================================================================
// 2. UTILIDADES
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

function formatNumber(n) {
    if (n === null || n === undefined) return "0";
    return n.toLocaleString("es-ES");
}

function generateUUID() {
    if (crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
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
// 3. TEMA
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
// 4. RELOJ DE LA HABANA
// ================================================================
function initClock() {
    const el = document.getElementById("havana-clock");
    if (!el) return;

    function update() {
        try {
            const now = new Date();
            const formatter = new Intl.DateTimeFormat('es-ES', {
                timeZone: 'America/Havana',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
            el.textContent = `🇨🇺 ${formatter.format(now)} (Cuba)`;
        } catch (e) {
            el.textContent = "🇨🇺 Hora no disponible";
        }
    }

    update();
    setInterval(update, 1000);
}

// ================================================================
// 5. MODAL DEL CAFÉ
// ================================================================
function initCoffee() {
    const btn = document.getElementById("coffeeBubble");
    const modal = document.getElementById("coffeeModal");
    const close = document.getElementById("coffeeClose");

    if (!btn || !modal || !close) return;

    btn.addEventListener("click", () => {
        modal.classList.add("coffee-modal-open");
    });

    close.addEventListener("click", () => {
        modal.classList.remove("coffee-modal-open");
    });

    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.classList.remove("coffee-modal-open");
        }
    });
}

// ================================================================
// 6. CARGA DEL CATÁLOGO Y DESCARGAS
// ================================================================
async function loadCatalog() {
    return loadJson(CATALOG_URL);
}

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
// 7. RENDERIZADO DE PROYECTOS PUBLICADOS
// ================================================================
function renderProjects(apps, downloads) {
    const grid = document.getElementById("projectsGrid");

    if (!apps || apps.length === 0) {
        grid.innerHTML = `<p class="error-message">No hay proyectos publicados todavía.</p>`;
        return;
    }

    const sorted = [...apps].sort((a, b) =>
        (b.updated_at || "").localeCompare(a.updated_at || "")
    );

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
// 8. RENDERIZADO DE RETOS TÉCNICOS (vitrina)
// ================================================================
function renderChallengesPreview(data) {
    if (!data) return;

    const grid = document.getElementById("challengesPreview");

    if (!data.items || data.items.length === 0) {
        grid.innerHTML = `<p class="error-message">No hay retos publicados todavía.</p>`;
        return;
    }

    const items = data.items.slice(0, PREVIEW_COUNT_CHALLENGES);

    grid.innerHTML = items.map(item => `
        <article class="challenge-card">
            <h3>${escapeHtml(item.title)}</h3>
            <p class="challenge-context">${escapeHtml(item.context)}</p>
            <p class="challenge-solution"><strong>Solución:</strong> ${escapeHtml(item.solution)}</p>
            <p class="challenge-lesson"><strong>Aprendizaje:</strong> ${escapeHtml(item.lesson)}</p>
        </article>
    `).join("");
}

// ================================================================
// 9. RENDERIZADO DE OPEN SOURCE (vitrina completa)
// ================================================================
function renderOpensourcePreview(data) {
    if (!data) return;

    const grid = document.getElementById("opensourcePreview");

    if (!data.items || data.items.length === 0) {
        grid.innerHTML = `<p class="error-message">No hay contribuciones publicadas todavía.</p>`;
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
// 10. RENDERIZADO DEL BLOG (vitrina)
// ================================================================
function renderBlogPreview(data) {
    if (!data) return;

    const grid = document.getElementById("blogPreview");

    if (!data.posts || data.posts.length === 0) {
        grid.innerHTML = `<p class="error-message">No hay entradas publicadas todavía.</p>`;
        return;
    }

    const featured = data.posts
        .filter(p => p.featured)
        .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
        .slice(0, PREVIEW_COUNT_BLOG);

    grid.innerHTML = featured.map(item => `
        <article class="blog-card">
            <h3><a href="${escapeHtml(item.url)}">${escapeHtml(item.title)}</a></h3>
            <p class="blog-date">${escapeHtml(item.date_label || item.date)}</p>
            <p class="blog-excerpt">${escapeHtml(item.excerpt)}</p>
        </article>
    `).join("");
}

// ================================================================
// 11. RENDERIZADO DE PROYECTOS EN PROGRESO (vitrina)
// ================================================================
function renderInProgressPreview(data) {
    if (!data) return;

    const grid = document.getElementById("inProgressPreview");

    if (!data.items || data.items.length === 0) {
        grid.innerHTML = `<p class="error-message">No hay proyectos en progreso todavía.</p>`;
        return;
    }

    const items = data.items.slice(0, PREVIEW_COUNT_PROJECTS);

    grid.innerHTML = items.map(item => {
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
// 12. RENDERIZADO DE APRENDIZAJE (vitrina)
// ================================================================
function renderLearningPreview(data) {
    if (!data) return;

    const grid = document.getElementById("learningPreview");

    if (!data.blocks || data.blocks.length === 0) {
        grid.innerHTML = `<p class="placeholder-box">🚧 Próximamente.</p>`;
        return;
    }

    const blocks = data.blocks.slice(0, PREVIEW_COUNT_LEARNING);

    grid.innerHTML = blocks.map(block => {
        let body = "";

        if (block.type === "list") {
            body = `<ul class="learning-list">${(block.items || [])
                .map(i => `<li>${escapeHtml(i)}</li>`)
                .join("")}</ul>`;
        } else if (block.type === "text") {
            const items = (block.items || []).slice(0, 2).map(item => `
                <div class="learning-item">
                    <strong>${escapeHtml(item.name)}:</strong>
                    <span>${escapeHtml(item.reason)}</span>
                </div>
            `).join("");
            body = `${block.content ? `<p>${escapeHtml(block.content)}</p>` : ""}${items}`;
        }

        return `
            <div class="learning-block">
                <h3>${escapeHtml(block.title)}</h3>
                ${body}
            </div>
        `;
    }).join("");
}

// ================================================================
// 13. CHAT FLOTANTE
// ================================================================

const Chat = {
    conversationId: null,
    messages: [],
    isOpen: false,
    isWaiting: false,
    pollTimer: null,
    pollStartTime: null,
    knownMessageCount: 0,
    els: {},

    init() {
        this.els = {
            bubble: document.getElementById("chatBubble"),
            panel: document.getElementById("chatPanel"),
            messages: document.getElementById("chatMessages"),
            form: document.getElementById("chatForm"),
            input: document.getElementById("chatInput"),
            send: document.getElementById("chatSend"),
            clear: document.getElementById("chatClear"),
            close: document.getElementById("chatClose")
        };

        let convId = localStorage.getItem(CHAT_CONV_ID_KEY);
        if (!convId) {
            convId = generateUUID();
            localStorage.setItem(CHAT_CONV_ID_KEY, convId);
        }
        this.conversationId = convId;

        try {
            const saved = localStorage.getItem(CHAT_STORAGE_KEY);
            if (saved) this.messages = JSON.parse(saved);
        } catch (e) {
            this.messages = [];
        }

        if (this.messages.length === 0) {
            this.messages.push({
                role: "bot",
                text: "¡Hola! Soy el asistente de Träume des Blauen. Puedo contarte sobre las apps del catálogo. ¿Qué quieres saber?",
                timestamp: new Date().toISOString()
            });
            this.saveHistory();
        }

        this.renderMessages();

        this.els.bubble.addEventListener("click", () => this.toggle());
        this.els.close.addEventListener("click", () => this.close());
        this.els.clear.addEventListener("click", () => this.clear());
        this.els.form.addEventListener("submit", (e) => {
            e.preventDefault();
            this.send();
        });
    },

    toggle() { this.isOpen ? this.close() : this.open(); },

    open() {
        this.isOpen = true;
        this.els.panel.classList.add("chat-open");
        this.els.panel.setAttribute("aria-hidden", "false");
        this.els.bubble.classList.add("chat-bubble-hidden");
        setTimeout(() => this.els.input.focus(), 100);
        this.scrollToBottom();
    },

    close() {
        this.isOpen = false;
        this.els.panel.classList.remove("chat-open");
        this.els.panel.setAttribute("aria-hidden", "true");
        this.els.bubble.classList.remove("chat-bubble-hidden");
    },

    clear() {
        if (!confirm("¿Seguro que quieres borrar la conversación actual?")) return;
        this.messages = [{
            role: "bot",
            text: "Conversación reiniciada. ¿En qué puedo ayudarte?",
            timestamp: new Date().toISOString()
        }];
        this.conversationId = generateUUID();
        localStorage.setItem(CHAT_CONV_ID_KEY, this.conversationId);
        this.saveHistory();
        this.renderMessages();
    },

    renderMessages() {
        this.els.messages.innerHTML = this.messages.map(m => this.renderMessage(m)).join("");
        this.scrollToBottom();
    },

    renderMessage(m) {
        const isBot = m.role === "bot";
        const avatar = isBot ? `<img src="assets/logo_header.png" alt="" class="chat-msg-avatar">` : "";
        const bubbleClass = isBot ? "chat-msg-bot" : "chat-msg-user";
        return `
            <div class="chat-msg ${bubbleClass}">
                ${avatar}
                <div class="chat-msg-text">${escapeHtml(m.text).replace(/\n/g, "<br>")}</div>
            </div>
        `;
    },

    addMessage(role, text) {
        const m = { role, text, timestamp: new Date().toISOString() };
        this.messages.push(m);
        this.els.messages.insertAdjacentHTML("beforeend", this.renderMessage(m));
        this.scrollToBottom();
        this.saveHistory();
    },

    showTyping() {
        const typing = `
            <div class="chat-msg chat-msg-bot chat-msg-typing" id="chatTyping">
                <img src="assets/logo_header.png" alt="" class="chat-msg-avatar">
                <div class="chat-msg-text">
                    <span class="dot"></span><span class="dot"></span><span class="dot"></span>
                </div>
            </div>
        `;
        this.els.messages.insertAdjacentHTML("beforeend", typing);
        this.scrollToBottom();
    },

    hideTyping() {
        const el = document.getElementById("chatTyping");
        if (el) el.remove();
    },

    scrollToBottom() {
        requestAnimationFrame(() => {
            this.els.messages.scrollTop = this.els.messages.scrollHeight;
        });
    },

    saveHistory() {
        try {
            localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(this.messages));
        } catch (e) {
            console.warn("No se pudo guardar el historial:", e);
        }
    },

    async send() {
        const text = this.els.input.value.trim();
        if (!text) return;
        if (this.isWaiting) return;

        this.addMessage("user", text);
        this.els.input.value = "";

        this.isWaiting = true;
        this.els.send.disabled = true;
        this.showTyping();

        this.knownMessageCount = this.messages.length - 1;

        try {
            const response = await fetch(WORKER_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question: text,
                    source: "web",
                    response_target: "gist",
                    conversation_id: this.conversationId
                })
            });

            if (!response.ok) throw new Error(`Worker respondió ${response.status}`);
            this.startPolling();

        } catch (err) {
            console.error("Error enviando al Worker:", err);
            this.hideTyping();
            this.addMessage("bot", "No pude enviar tu pregunta. Puede que tu red bloquee la conexión al asistente. Intenta de nuevo en un momento.");
            this.finishWaiting();
        }
    },

    startPolling() {
        this.pollStartTime = Date.now();

        const poll = async () => {
            if (Date.now() - this.pollStartTime > CHAT_TIMEOUT_MS) {
                this.stopPolling();
                this.hideTyping();
                this.addMessage("bot", "El asistente está tardando más de lo esperado. Intenta de nuevo en unos minutos.");
                this.finishWaiting();
                return;
            }

            try {
                const response = await fetch(GIST_CHAT_URL + "?t=" + Date.now(), { cache: "no-store" });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);

                const data = await response.json();
                const conv = data.conversations && data.conversations[this.conversationId];

                if (conv && Array.isArray(conv.messages)) {
                    const totalMessages = conv.messages.length;
                    if (totalMessages > this.knownMessageCount) {
                        const lastMessage = conv.messages[totalMessages - 1];
                        if (lastMessage.question === this.lastQuestion()) {
                            this.stopPolling();
                            this.hideTyping();
                            this.addMessage("bot", lastMessage.answer || "Sin respuesta");
                            this.finishWaiting();
                            return;
                        }
                    }
                }

                this.pollTimer = setTimeout(poll, CHAT_POLL_INTERVAL);

            } catch (err) {
                console.warn("Error en polling:", err);
                this.pollTimer = setTimeout(poll, CHAT_POLL_INTERVAL);
            }
        };

        poll();
    },

    lastQuestion() {
        for (let i = this.messages.length - 1; i >= 0; i--) {
            if (this.messages[i].role === "user") return this.messages[i].text;
        }
        return "";
    },

    stopPolling() {
        if (this.pollTimer) {
            clearTimeout(this.pollTimer);
            this.pollTimer = null;
        }
    },

    finishWaiting() {
        this.isWaiting = false;
        this.els.send.disabled = false;
        this.els.input.focus();
    }
};

// ================================================================
// 14. INICIALIZACIÓN
// ================================================================
async function init() {
    initTheme();
    initClock();
    initCoffee();
    document.getElementById("year").textContent = new Date().getFullYear();
    Chat.init();

    const [
        catalog,
        downloads,
        challenges,
        opensource,
        blog,
        inProgress,
        learning
    ] = await Promise.all([
        loadCatalog(),
        loadDownloads(),
        loadJson(CONTENT_CHALLENGES),
        loadJson(CONTENT_OPENSOURCE),
        loadJson(CONTENT_BLOG),
        loadJson(CONTENT_PROJECTS),
        loadJson(CONTENT_LEARNING)
    ]);

    if (!catalog) {
        document.getElementById("projectsGrid").innerHTML =
            `<p class="error-message">⚠️ No se pudieron cargar los proyectos. Intenta recargar la página.</p>`;
    } else {
        renderProjects(catalog.apps || [], downloads);
    }

    renderChallengesPreview(challenges);
    renderOpensourcePreview(opensource);
    renderBlogPreview(blog);
    renderInProgressPreview(inProgress);
    renderLearningPreview(learning);
}

document.addEventListener("DOMContentLoaded", init);