# Träume des Blauen

> *Sueños de lo Azul*

Catálogo personal de aplicaciones móviles desarrolladas por **Dreamer** (Yozora).  
Aplicaciones funcionales, probadas y útiles, disponibles para descarga directa.

---

## 📱 ¿Qué es esto?

Un repositorio que cumple tres funciones a la vez:

1. **Almacén** de las aplicaciones (APK) y su información.
2. **Catálogo web** publicado en GitHub Pages.
3. **Fuente de datos** (`catalog.json`) que alimenta tanto la web como una futura app Android.

Todo el contenido se genera automáticamente a partir de la estructura de carpetas.

---

## 🗂️ Estructura del repositorio
Traeume-des-Blauen/
├── apps/ # Una carpeta por aplicación
│ └── converty/
│ ├── converty_v1.2.0.apk
│ ├── icon.png
│ └── info.md # Metadatos + descripción (frontmatter YAML)
│
├── scripts/
│ └── Generate-Catalog.ps1 # Genera docs/catalog.json
│
├── docs/ # Sitio web (GitHub Pages)
│ ├── index.html
│ ├── style.css
│ ├── app.js
│ └── catalog.json # Generado automáticamente
│
├── .github/
│ └── workflows/
│ └── build-catalog.yml # CI/CD: regenera catalog.json en cada push
│
├── .gitignore
└── README.md

---

## ➕ Cómo agregar una aplicación nueva

1. Crea una carpeta dentro de `apps/` con el nombre de la app (minúsculas, sin espacios).  
   Ejemplo: `apps/mi-app-nueva/`

2. Dentro coloca:
   - El APK, con nombre `<nombre>_v<version>.apk` (ej. `mi_app_nueva_v1.0.0.apk`)
   - `icon.png` (cuadrado, mínimo 256×256, ideal < 200 KB)
   - `info.md` con el frontmatter YAML (ver plantilla abajo)

3. Haz `git push`. El workflow regenerará `catalog.json` automáticamente.

---

## 📄 Plantilla de `info.md`

```markdown
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

## Descripción

Texto libre describiendo la app.

## Características

- Punto 1
- Punto 2

## Notas

Lo que quieras añadir.
 
⚙️ Cómo funciona la automatización
1. 
Haces push a main con cambios en apps/**.
2. 
GitHub Actions ejecuta scripts/Generate-Catalog.ps1.
3. 
El script recorre cada app, lee su info.md, calcula el hash SHA-256 del APK y arma docs/catalog.json.
4. 
El workflow hace commit del catalog.json actualizado.
5. 
GitHub Pages sirve el sitio actualizado automáticamente.
 
🌐 Sitio web
Publicado en: https://luisenriquepupo16-rgb.github.io/Traeume-des-Blauen/
 
📜 Licencia y condiciones
• 
Las aplicaciones son de libre descarga y distribución.
• 
No se alienta ninguna forma de monetización o mal uso.
• 
El código fuente no se comparte a menos que se acuerde explícitamente.
 
Desarrollado por Dreamer· Cuba · 2026