---
name: Träume des Blauen
version: 1.0.2
version_code: 3
package: com.traeume.blauen
category: Catálogo
min_android: 8.0
min_sdk: 26
target_sdk: 34
technologies:
  - Kotlin
  - Jetpack Compose
  - Ktor
  - Kotlinx Serialization
  - DataStore
  - Coil
input_formats: []
output_formats: []
restrictions: null
dedication: Para todos los que sueñan en azul.
github: https://github.com/luisenriquepupo16-rgb
---

## Description

Aplicación oficial del catálogo Träume des Blauen. Permite explorar, buscar y descargar todas las aplicaciones publicadas, con soporte offline, caché inteligente y actualización automática del contenido.

## Uso

1. Abre la app.
2. Explora el catálogo de aplicaciones disponibles.
3. Usa la búsqueda o los filtros por categoría para encontrar lo que necesitas.
4. Toca una tarjeta para ver los detalles de la app.
5. Pulsa "Descargar" para instalar la app que te interese.
6. Desliza hacia abajo o pulsa el botón de recargar para actualizar el catálogo.

## Características

- ✅ Catálogo completo con todas las apps publicadas
- ✅ Búsqueda por nombre, descripción o tecnologías
- ✅ Filtros por categoría
- ✅ Tabs "Todas" y "Nuevas"
- ✅ Modo offline con caché local
- ✅ Actualización automática del contenido
- ✅ Descarga e instalación de APKs integrada
- ✅ Compartir apps por WhatsApp y Telegram
- ✅ Modo claro y oscuro automático
- ✅ Interfaz en español, diseño Material 3

## Notas técnicas

- La app lee el `catalog.json` publicado en GitHub Pages.
- El contenido se cachea localmente con DataStore.
- Los APKs se descargan en la carpeta privada de la app.
- La instalación usa el DownloadManager del sistema.