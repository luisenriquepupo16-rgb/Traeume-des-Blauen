/* ================================================================
   PORTAFOLIO — Dreamer · Träume des Blauen
   Lógica: carga catalog.json, carga el Gist de descargas, renderiza,
   y gestiona el chat flotante que se comunica con el Worker.
   ================================================================ */

// ================================================================
// 1. CONFIGURACIÓN
// ================================================================
const CATALOG_URL = "catalog.json";
const GIST_DOWNLOADS_URL = "https://gist.githubusercontent.com/luisenriquepupo16-rgb/40391b1420b19d763eff10e35d1aec63/raw/downloads.json";
const GIST_CHAT_URL = "https://gist.githubusercontent.com/luisenriquepupo16-rgb/40391b1420b19d763eff10e35d1aec63/raw/chat_history.json";
const WORKER_URL = "https://github-dispatch-bridge.blue-land.workers.dev";

// Configuración del chat
const CHAT_POLL_INTERVAL = 3000;      // 3 segundos
const CHAT_MAX_ATTEMPTS = 30;         // 30 intentos
const CHAT_TIMEOUT_MS = 90000;        // 90 segundos
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
    if (crypto && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback para navegadores antiguos
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
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
// 7. CHAT FLOTANTE
// ================================================================

const Chat = {
    // Estado
    conversationId: null,
    messages: [],       // [{role: 'user'|'bot', text: '...', timestamp: '...'}]
    isOpen: false,
    isWaiting: false,   // true mientras esperamos respuesta del Worker
    pollTimer: null,
    pollStartTime: null,
    knownMessageCount: 0,

    // Elementos del DOM
    els: {},

    /**
     * Inicializa el chat.
     */
    init() {
        // Cachear elementos
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

        // Recuperar o crear conversation_id
        let convId = localStorage.getItem(CHAT_CONV_ID_KEY);
        if (!convId) {
            convId = generateUUID();
            localStorage.setItem(CHAT_CONV_ID_KEY, convId);
        }
        this.conversationId = convId;

        // Recuperar historial local
        try {
            const saved = localStorage.getItem(CHAT_STORAGE_KEY);
            if (saved) {
                this.messages = JSON.parse(saved);
            }
        } catch (e) {
            this.messages = [];
        }

        // Mensaje de bienvenida si no hay historial
        if (this.messages.length === 0) {
            this.messages.push({
                role: "bot",
                text: "¡Hola! Soy el asistente de Träume des Blauen. Puedo contarte sobre las apps del catálogo. ¿Qué quieres saber?",
                timestamp: new Date().toISOString()
            });
            this.saveHistory();
        }

        // Renderizar historial
        this.renderMessages();

        // Bind eventos
        this.els.bubble.addEventListener("click", () => this.toggle());
        this.els.close.addEventListener("click", () => this.close());
        this.els.clear.addEventListener("click", () => this.clear());
        this.els.form.addEventListener("submit", (e) => {
            e.preventDefault();
            this.send();
        });
    },

    /**
     * Abre/cierra el panel.
     */
    toggle() {
        this.isOpen ? this.close() : this.open();
    },

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

    /**
     * Limpia el historial.
     */
    clear() {
        if (!confirm("¿Seguro que quieres borrar la conversación actual?")) return;

        this.messages = [{
            role: "bot",
            text: "Conversación reiniciada. ¿En qué puedo ayudarte?",
            timestamp: new Date().toISOString()
        }];

        // Nuevo conversation_id
        this.conversationId = generateUUID();
        localStorage.setItem(CHAT_CONV_ID_KEY, this.conversationId);

        this.saveHistory();
        this.renderMessages();
    },

    /**
     * Renderiza todos los mensajes.
     */
    renderMessages() {
        this.els.messages.innerHTML = this.messages.map(m => this.renderMessage(m)).join("");
        this.scrollToBottom();
    },

    /**
     * Renderiza un mensaje individual.
     */
    renderMessage(m) {
        const isBot = m.role === "bot";
        const avatar = isBot
            ? `<img src="assets/logo_header.png" alt="" class="chat-msg-avatar">`
            : "";
        const bubbleClass = isBot ? "chat-msg-bot" : "chat-msg-user";
        return `
            <div class="chat-msg ${bubbleClass}">
                ${avatar}
                <div class="chat-msg-text">${escapeHtml(m.text).replace(/\n/g, "<br>")}</div>
            </div>
        `;
    },

    /**
     * Añade un mensaje al historial y lo renderiza.
     */
    addMessage(role, text) {
        const m = { role, text, timestamp: new Date().toISOString() };
        this.messages.push(m);
        this.els.messages.insertAdjacentHTML("beforeend", this.renderMessage(m));
        this.scrollToBottom();
        this.saveHistory();
    },

    /**
     * Muestra el indicador de "escribiendo...".
     */
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

    /**
     * Scroll al final del panel.
     */
    scrollToBottom() {
        requestAnimationFrame(() => {
            this.els.messages.scrollTop = this.els.messages.scrollHeight;
        });
    },

    /**
     * Guarda el historial en localStorage.
     */
    saveHistory() {
        try {
            localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(this.messages));
        } catch (e) {
            console.warn("No se pudo guardar el historial del chat:", e);
        }
    },

    /**
     * Envía la pregunta al Worker.
     */
    async send() {
        const text = this.els.input.value.trim();
        if (!text) return;
        if (this.isWaiting) return;

        // Mostrar mensaje del usuario
        this.addMessage("user", text);
        this.els.input.value = "";

        // Estado de espera
        this.isWaiting = true;
        this.els.send.disabled = true;
        this.showTyping();

        // Guardar el número de mensajes conocidos ANTES de enviar
        this.knownMessageCount = this.messages.length - 1; // -1 porque el último es la pregunta

        // Enviar al Worker
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

            if (!response.ok) {
                throw new Error(`Worker respondió ${response.status}`);
            }

            // Empezar polling al Gist
            this.startPolling();

        } catch (err) {
            console.error("Error enviando al Worker:", err);
            this.hideTyping();
            this.addMessage("bot", "No pude enviar tu pregunta. ¿Está el asistente disponible? Intenta de nuevo en un momento.");
            this.finishWaiting();
        }
    },

    /**
     * Empieza a hacer polling al Gist para buscar la respuesta.
     */
    startPolling() {
        this.pollStartTime = Date.now();
        let attempts = 0;

        const poll = async () => {
            attempts++;

            // Timeout
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

                    // Si hay más mensajes que los que conocíamos, ha llegado la respuesta
                    if (totalMessages > this.knownMessageCount) {
                        const lastMessage = conv.messages[totalMessages - 1];

                        // Verificar que es la respuesta a nuestra pregunta (por seguridad)
                        if (lastMessage.question === this.lastQuestion()) {
                            this.stopPolling();
                            this.hideTyping();
                            this.addMessage("bot", lastMessage.answer || "Sin respuesta");
                            this.finishWaiting();
                            return;
                        }
                    }
                }

                // Si aún no ha llegado, seguir haciendo polling
                this.pollTimer = setTimeout(poll, CHAT_POLL_INTERVAL);

            } catch (err) {
                console.warn("Error en polling:", err);
                // Sigue intentando hasta el timeout
                this.pollTimer = setTimeout(poll, CHAT_POLL_INTERVAL);
            }
        };

        poll();
    },

    /**
     * Devuelve la última pregunta del usuario (la que acabamos de enviar).
     */
    lastQuestion() {
        for (let i = this.messages.length - 1; i >= 0; i--) {
            if (this.messages[i].role === "user") return this.messages[i].text;
        }
        return "";
    },

    /**
     * Detiene el polling.
     */
    stopPolling() {
        if (this.pollTimer) {
            clearTimeout(this.pollTimer);
            this.pollTimer = null;
        }
    },

    /**
     * Termina el estado de espera.
     */
    finishWaiting() {
        this.isWaiting = false;
        this.els.send.disabled = false;
        this.els.input.focus();
    }
};

// ================================================================
// 8. INICIALIZACIÓN
// ================================================================
async function init() {
    initTheme();

    document.getElementById("year").textContent = new Date().getFullYear();

    // Inicializar chat
    Chat.init();

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