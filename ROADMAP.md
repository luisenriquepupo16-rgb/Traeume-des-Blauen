# ROADMAP — Web (Traeume des Blauen)

> Estado: pausada hasta que la app Android v1.2.4 se estabilice.
> Prioridad: retomar cuando se retome la web.

---

## 1. Accesibilidad web

- **1.13 — Foco del chat.** Al abrir el panel, `aria-hidden` cambia pero no se anuncia. Gestionar foco al abrir/cerrar, anunciar cambio de contexto. ~15 min.
- **1.14 — Botón de tema sin estado.** Siempre dice "Cambiar tema". Añadir `aria-label` dinámico o `aria-pressed`. ~5 min.
- **1.15 — Emojis informativos sin `aria-label`.** 🌙, ☀️, 💙, 📱, 📥 se leen como "luna", "corazón azul", etc. Envolver con `role="img"` + `aria-label`, o `aria-hidden="true"` si son decorativos. ~20 min.
- **1.16 — Contraste de colores.** Dorado `#C9A961` sobre fondo `#F5EDE0` da ~2.2:1. Incumple WCAG AA. Se usa en `.subtitle`, `.footer-tagline`, `.dedication`, `.opensource-detail`. Acción: oscurecer el dorado para texto, o reservarlo solo para elementos decorativos. ~15 min. **Requiere decisión de diseño.**
- **1.17 — Falta skip-link.** ~5 min.
- **1.18 — `aria-current` en navegación.** Los enlaces del `main-nav` no marcan la sección activa. ~10 min.
- **1.19 — `pre/code` con scroll sin `tabindex="0"`.** No se puede hacer scroll por teclado. ~5 min.

**Total estimado**: ~75 minutos.

---

## 2. Traducción del portafolio al inglés

- **2.1 — Traducir el `catalog.json`.** Nombres, descripciones, dedicatorias de las apps. Actualmente todo en español.
- **2.2 — Traducir los JSON de contenido.** `blog.json`, `projects.json`, `learning.json`, `challenges.json`, `opensource.json`.
- **2.3 — Traducir los textos estáticos de los HTML.** `index.html`, `blog/index.html`, `retos/index.html`, etc.
- **2.4 — Selector de idioma.** Añadir un selector en la cabecera, y un sistema que cargue los JSON en el idioma elegido. Requiere duplicar los JSON (`catalog.es.json`, `catalog.en.json`, etc.) o tener un campo `lang` en cada uno.
- **2.5 — Traducir el `cv-data.json` al inglés.** Ahora mismo, el script del CV traduce los idiomas con un mapeo. Lo ideal es tener un `cv-data.en.json` con los datos en inglés.

**Esfuerzo**: alto. **Bloqueante**: no, pero es lo que más valor añade para el portafolio.

---

## 3. Funcionalidades pendientes

- **3.1 — Sección de demos (Muestra/Vestíbulo).** Nueva sección para mostrar demos de apps entregadas cuando la IP quede bajo control. Requiere `demos.json` en el repo web, `DemosScreen` en la app, sistema de descarga reutilizable, botón de contacto. Esfuerzo alto. **Depende de: tener clientes reales.**
- **3.2 — Sistema de bloqueo de demo.** Bloqueo automático al expirar los 10 días, detección de manipulación de fecha, bloqueo persistente. Mecanismo: `SharedPreferences` + archivo sello en `filesDir`. Esfuerzo medio. **Depende de: tener el primer cliente real.**
- **3.3 — Cachear `AppStatusChecker` si el catálogo crece.** Actualmente llama a `DownloadedApkInspector.inspect()` para cada app en cada recálculo. Con 100+ apps habría que cachear. Esfuerzo bajo. **Bloqueante**: no.

---

## 4. Deuda técnica

- **4.1 — `DetailScreen` limpia `\r\n` manualmente.** Debería hacerse en el parser o en `Generate-Catalog.ps1`. Esfuerzo bajo.
- **4.2 — `DownloadManagerSingleton` como `object` global mutable.** Acopla la UI al singleton. Aceptable para app personal, pero no escala. Esfuerzo alto, no urgente.
- **4.3 — Falta de tests.** Cero unitarios, cero de instrumentación. Esfuerzo alto. **Bloqueante**: no.

---

## 5. Diseño de gremio (fases pendientes)

- **5.1 — Fase 3: Fuentes decorativas + texturas.** Requiere archivos `.ttf` en `res/font/`. `FontFamily` en `Type.kt`. Fuente decorativa para títulos (Cinzel o similar). Fuente legible para cuerpo. Texturas de madera/pergamino/hierro como fondo. Esfuerzo medio-alto. **Requiere assets**: sí.
- **5.2 — Fase 5: Sonidos.** Sonidos de clic, desenrollar pergamino, brasas, transiciones. Archivos `.mp3/.ogg` en `res/raw/`. Toggle en Ajustes (junto con el de animaciones). Esfuerzo medio. **Requiere assets**: sí.
- **5.3 — Fase 6: Transiciones avanzadas.** Círculo mágico entre secciones (Mostrador ↔ Forja). Esfuerzo alto. **Requiere assets**: no.

---

## 6. Web (portafolio)

- **6.1 — Verificar el chat desde fuera de Cuba.** La red local bloquea Cloudflare. Pedir a alguien fuera que lo pruebe. Esfuerzo bajo. **Bloqueante**: no.
- **6.2 — Capturas de pantalla de las apps.** Requiere instalar cada app y que alguien capture. Añade mucho valor al portafolio. Esfuerzo medio. **Depende de**: tener ayuda visual.
- **6.3 — Rellenar "Proyectos en progreso".** Actualmente 3 tarjetas. Esfuerzo bajo.
- **6.4 — Rellenar "Aprendizaje continuo".** Actualmente 3 bloques. Esfuerzo bajo.
- **6.5 — Añadir `<noscript>`.** Sin JS, el sitio queda vacío en secciones dinámicas. Esfuerzo: 15 min.
- **6.6 — `Promise.all` silencia errores de carga de JSON.** Si un JSON falla, el render se salta en silencio. Acción: avisar al usuario de sección no cargada. Esfuerzo: 15 min.

---

## 7. Arquitectura / Mejoras mayores

- **7.1 — Automatización entre repos.** El repo Android y el repo web son independientes. No hay automatización para mover el APK entre ellos. Esfuerzo medio. **Bloqueante**: no. **Dijiste**: no te interesa a corto plazo.
- **7.2 — Backend real para contadores globales.** Descartado por ahora. Esfuerzo alto.
- **7.3 — Auto-actualización del APK.** Que la app se actualice a sí misma. Esfuerzo alto.
- **7.4 — Notificaciones push cuando hay apps nuevas.** Requiere backend. Esfuerzo alto.
- **7.5 — Deep links para abrir apps específicas desde WhatsApp.** Esfuerzo bajo.
- **7.6 — Screenshots en el `DetailScreen`.** Esfuerzo medio. **Depende de**: tener capturas.
- **7.7 — Filtros por tecnología en el catálogo.** Esfuerzo bajo.

---

## 8. Ideas futuras (descartadas por ahora)

- Sistema de logros.
- Forja con seguimiento de encargos.
- Estadísticas de uso anónimas.

---

## 📊 Priorización sugerida

1. **Accesibilidad web** (1.13 a 1.19) — es lo primero del ROADMAP, y son ~75 min.
2. **Traducción del portafolio al inglés** (2.1 a 2.5) — es lo que más valor añade a medio plazo.
3. **Capturas de pantalla** (6.2) — añaden mucho valor al portafolio.
4. **Verificar el chat desde fuera de Cuba** (6.1) — pendiente pequeño, pero importante.
5. **Rellenar "Proyectos en progreso" y "Aprendizaje continuo"** (6.3 y 6.4) — pendientes pequeños.
6. **`<noscript>` y `Promise.all`** (6.5 y 6.6) — pendientes pequeños.
7. **Diseño de gremio** (5.1 a 5.3) — requiere assets, y es a más largo plazo.
8. **Arquitectura y mejoras mayores** (7.1 a 7.7) — a largo plazo, o descartadas.