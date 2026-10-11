---
name: Träume des Blauen
version: 1.1.1
version_code: 9
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
  - WorkManager
  - Foreground Service (dataSync)
  - Material 3
input_formats: []
output_formats: []
restrictions: null
dedication: Para todos los que sueñan en azul.
github: https://github.com/luisenriquepupo16-rgb
---

## Description

Aplicación oficial del catálogo Träume des Blauen. Permite explorar, buscar y descargar todas las aplicaciones publicadas, con soporte offline, caché inteligente y actualización automática del contenido. Incluye además una sección Forja donde los usuarios pueden encargar aplicaciones Android personalizadas a través de un cuestionario guiado que se envía por WhatsApp.

## Uso

1. Abre la app.
2. En la sección Mostrador, explora el catálogo de aplicaciones disponibles.
3. Usa la búsqueda o los filtros por categoría para encontrar lo que necesitas.
4. Toca una tarjeta para ver los detalles de la app.
5. Pulsa "Descargar" para descargar la app. La descarga continúa en segundo plano aunque salgas de la aplicación.
6. Cuando termine, pulsa "Instalar" para instalarla.
7. En la sección Forja, consulta las condiciones y pulsa "Crear petición" para encargar tu propia aplicación.
8. Rellena el cuestionario y envíalo por WhatsApp.

## Características

- ✅ Catálogo completo con todas las apps publicadas
- ✅ Búsqueda por nombre, descripción o tecnologías
- ✅ Filtros por categoría
- ✅ Tabs "Todas" y "Nuevas"
- ✅ Modo offline con caché local
- ✅ Actualización automática del contenido
- ✅ Descarga e instalación de APKs integrada
- ✅ Descargas en segundo plano con notificación persistente
- ✅ Cancelación real de descargas desde el diálogo o la notificación
- ✅ Compartir apps por WhatsApp y Telegram
- ✅ Sección Forja con condiciones de encargo detalladas
- ✅ Cuestionario de petición con autoguardado y validación en vivo
- ✅ Envío de peticiones por WhatsApp
- ✅ Notificaciones agrupadas de actualizaciones y nuevas apps
- ✅ Modo claro, oscuro y automático
- ✅ Interfaz en español, diseño Material 3

## Notas técnicas

- La app lee el `catalog.json` publicado en GitHub Pages.
- El contenido se cachea localmente con DataStore.
- Los APKs se descargan con Ktor en un Foreground Service.
- La instalación usa FileProvider y el instalador del sistema.
- Las comprobaciones periódicas se hacen con WorkManager (cada 12 horas).
- El borrador del cuestionario se persiste en DataStore.
- La app tiene dos secciones principales: Mostrador (catálogo) y Forja (encargos).

## Novedades de la versión 1.1.0

- **Nueva sección Forja:** permite encargar aplicaciones personalizadas con información clara sobre el proceso, condiciones de pago, demo, garantía y propiedad intelectual.
- **Cuestionario de petición:** formulario completo con autoguardado, validación en vivo y envío por WhatsApp.
- **Descargas en segundo plano:** las descargas ahora continúan aunque salgas de la aplicación, con notificación persistente y cancelación real.
- **Notificaciones:** avisos agrupados de nuevas versiones de apps instaladas y de nuevas apps publicadas.
- **Nuevos ajustes:** modo de tema (Automático, Claro, Oscuro), pantallas de Información y Ayuda.
- **Navegación:** barra inferior con las dos secciones principales (Mostrador y Forja).
- **Mejoras internas:** corrección de bugs de estado de botones (Descargar / Instalar / Actualizar / Abrir), limpieza de código y strings externalizados.

## Contacto

- GitHub: [@luisenriquepupo16-rgb](https://github.com/luisenriquepupo16-rgb)
- WhatsApp: +53 54935996