================================================================
TRAEUME DES BLAUEN — PORTAFOLIO Y CATÁLOGO
================================================================

Sueños de lo Azul

Portafolio personal y catálogo de aplicaciones Android desarrolladas
por Dreamer (Luisi). Publicado en:
https://luisenriquepupo16-rgb.github.io/Traeume-des-Blauen/

----------------------------------------------------------------
¿QUÉ ES ESTO?
----------------------------------------------------------------

Este repositorio cumple tres funciones a la vez:

1. Almacén de aplicaciones (apps/): cada app tiene su APK, su icono,
   y su info.md con metadatos en YAML.

2. Portafolio web (docs/): publicado en GitHub Pages, con catálogo,
   blog, retos, open source, proyectos en progreso, aprendizaje,
   servicios y contacto.

3. Fuente de datos compartida (docs/catalog.json): generado
   automáticamente por scripts/Generate-Catalog.ps1, alimenta tanto
   la web como la app Android del catálogo.

Todo el contenido se genera automáticamente a partir de la estructura
de carpetas.

----------------------------------------------------------------
ESTRUCTURA DEL REPOSITORIO
----------------------------------------------------------------

Traeume-des-Blauen/
├── apps/                    # Una carpeta por aplicación
│   └── converty/
│       ├── converty_v1.2.0.apk
│       ├── icon.png
│       └── info.md          # Metadatos + descripción (frontmatter YAML)
│
├── scripts/
│   ├── Generate-Catalog.ps1 # Genera docs/catalog.json
│   ├── generate_cv.py       # Genera los CVs (español, cubano)
│   ├── gemini_chat.py       # Chatbot con Gemini
│   └── ...
│
├── docs/                    # Sitio web (GitHub Pages)
│   ├── index.html
│   ├── app.js
│   ├── style.css
│   ├── shared.css
│   ├── shared.js
│   ├── catalog.json         # Generado automáticamente
│   ├── content/             # JSON de contenido (blog, proyectos, etc.)
│   ├── blog/
│   ├── retos/
│   ├── proyectos/
│   ├── open-source/
│   └── aprendizaje/
│
├── cv/                      # Currículums (generados automáticamente)
│   ├── cv.es.pdf
│   ├── cv-cuba.pdf
│   └── perfil.jpg
│
├── .github/
│   └── workflows/           # GitHub Actions (15 workflows)
│
└── README.txt

----------------------------------------------------------------
CÓMO AÑADIR UNA APLICACIÓN NUEVA
----------------------------------------------------------------

1. Crea una carpeta dentro de apps/ con el nombre de la app
   (minúsculas, sin espacios). Ejemplo: apps/mi-app-nueva/.

2. Dentro coloca:
   - El APK, con nombre <app-id>_v<version>.apk
     (ej. mi_app_nueva_v1.0.0.apk).
   - icon.png (cuadrado, mínimo 256×256, ideal < 200 KB).
   - info.md con el frontmatter YAML (ver plantilla abajo).

3. Haz git push. El workflow release-catalog hace el resto
   automáticamente: crea el release, regenera catalog.json, y
   actualiza la web.

----------------------------------------------------------------
PLANTILLA DE info.md
----------------------------------------------------------------

IMPORTANTE: los encabezados del cuerpo deben ser ## Description
y ## Uso (en inglés el primero, sin tildes ninguno de los dos).
PowerShell 5.1 puede corromper las tildes al leer el archivo, y
el parser dejaría de encontrarlos.

---
name: Nombre de la App
version: 1.0.0
version_code: 1
package: com.ejemplo.app
category: Utilidades
min_android: 8.0
min_sdk: 26
target_sdk: 34
technologies:
  - Kotlin
  - Jetpack Compose
input_formats: []
output_formats: []
restrictions: null
dedication: null
github: https://github.com/luisenriquepupo16-rgb
---

## Description

Texto libre describiendo la app (en inglés, sin tildes).

## Uso

1. Paso uno
2. Paso dos

## Características

- Punto 1
- Punto 2

----------------------------------------------------------------
CÓMO FUNCIONA LA AUTOMATIZACIÓN
----------------------------------------------------------------

1. Haces git push con cambios en apps/**.
2. GitHub Actions ejecuta el workflow release-catalog.
3. Fase 1 — Releases: detecta las apps que han cambiado, lee su
   info.md, calcula el tag <app-id>_v<version>, y crea (o recrea)
   un release de GitHub con el APK y el icon.png como assets.
4. Fase 2 — Catálogo: ejecuta scripts/Generate-Catalog.ps1, que
   recorre cada app, lee su info.md, calcula el SHA-256 del APK, y
   arma docs/catalog.json con las URLs apuntando a los releases.
5. El workflow hace commit del catalog.json actualizado con
   [skip ci].
6. GitHub Pages sirve el sitio actualizado automáticamente.

----------------------------------------------------------------
WORKFLOWS
----------------------------------------------------------------

El repo tiene 15 workflows de GitHub Actions. Los más importantes:

- release-catalog: crea releases y regenera el catálogo.
- diary-daily: resumen diario de actividad (commits, releases,
  issues), con racha tipo Duolingo.
- diary-weekly: resumen semanal de repos con actividad.
- diary-thermometer: termómetro semanal de actividad.
- chat-gemini: chatbot con Gemini, disparado desde la web.
- chat-narrative: diario narrativo con Gemini.
- chat-test: tests del chatbot.
- jobs-remotive: monitor de ofertas de empleo en Remotive.
- notify-downloads: notificador de descargas nuevas.
- notify-failures: aviso de workflows fallidos.
- notify-health: salud de los workflows.
- repo-issue-responder: etiqueta y responde issues nuevos.
- repo-version-checker: verifica que las versiones de info.md
  coincidan con los releases.
- cv-rebuild: regenera los CVs (español, cubano) automáticamente.

----------------------------------------------------------------
CVS
----------------------------------------------------------------

Los CVs se generan automáticamente a partir de:

- cv/cv-data.json: datos fijos (nombre, educación, idiomas, etc.).
- docs/catalog.json: proyectos (apps publicadas).
- docs/content/opensource.json: contribuciones open source.
- Secrets de GitHub: datos personales (nombre legal, edad,
  dirección, etc.).

Se generan dos versiones:
- cv.es.pdf: CV en español, público. Se publica en un release
  con el tag cv-es.
- cv-cuba.pdf: CV cubano, formal, con datos personales. No se
  sube al repo, se manda a Discord.

El CV en inglés no se genera todavía, porque no existe
cv/cv-data.en.json con los datos en inglés.

----------------------------------------------------------------
STACK TÉCNICO
----------------------------------------------------------------

- Web: HTML, CSS, JavaScript. Sin frameworks. Publicado en
  GitHub Pages.
- Automatización: GitHub Actions, PowerShell, Python, Bash.
- Chatbot: Cloudflare Workers + Gemini API.
- Datos: JSON estáticos, generados automáticamente.
- CVs: Python + fpdf2 + DejaVu Sans.

----------------------------------------------------------------
LICENCIA
----------------------------------------------------------------

Las aplicaciones son de libre descarga y distribución. El código
fuente no se comparte a menos que se acuerde explícitamente.

----------------------------------------------------------------
Desarrollado por Dreamer (Luisi) · Cuba · 2026
================================================================