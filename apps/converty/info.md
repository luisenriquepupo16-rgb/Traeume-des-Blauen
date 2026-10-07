---
name: Converty
version: 1.2.0
version_code: 5
package: com.converty.neki
category: Utilidades
min_android: 8.0
min_sdk: 26
target_sdk: 34
technologies:
  - Kotlin
  - Apache POI
  - iText7
  - OpenCSV
  - Kotlin Coroutines
  - Foreground Service (dataSync)
  - Storage Access Framework (SAF)
  - Material Components 3
  - View Binding
input_formats:
  - PPTX
  - DOCX
  - XLSX
  - PDF
  - CSV
  - TXT
  - MD
  - JSON
  - XML
  - HTML
output_formats:
  - TXT
  - PDF
  - DOC
  - DOCX
restrictions: null
dedication: *Para mi amiga, que ya no tendrá que pelearse con panfletos de conferencias.
github: https://github.com/luisenriquepupo16-rgb
---

## Description

Aplicación Android que convierte documentos y presentaciones a formatos de texto, extrayendo el contenido de archivos como PPTX, DOCX, XLSX y PDF para generar una copia en TXT, PDF, DOC o DOCX.

## Uso

1. Abre la app.
2. Selecciona uno o varios archivos para convertir.
3. Elige el formato de salida (TXT, PDF, DOC o DOCX).
4. Espera a que termine la conversión.
5. Encuentra los archivos generados en `Documentos/Converty/` o en el explorador interno.

## Características

- ✅ Conversión individual y en masa (varios archivos o carpeta completa)
- ✅ Extracción de texto y tablas desde PPTX, DOCX, XLSX, PDF, CSV, TXT y más
- ✅ Doble guardado: copia interna + copia visible en `Documentos/Converty/`
- ✅ Explorador de archivos generados con navegación por subcarpetas
- ✅ Selección múltiple para copiar o eliminar en masa
- ✅ Notificaciones ricas con acciones: Compartir, Abrir, Eliminar
- ✅ Conversión en segundo plano con notificación de progreso
- ✅ Sistema de códigos de error (E-1XX a E-8XX) para diagnóstico

## Formatos soportados

**Entrada:** PPTX, DOCX, XLSX, PDF, CSV, TXT, MD, JSON, XML, HTML  
**Salida:** TXT, PDF, DOC, DOCX

## Mejoras recientes (v1.2.0)

- **Notificaciones ricas** con acciones directas: Compartir, Abrir, Eliminar.
- **Notificación final de lote** con "Ver en Converty" y "Copiar resumen".
- **Sistema de códigos de error** E-1XX a E-8XX para diagnóstico remoto.
- **Cancelación de lotes** desde la notificación.
- **Doble guardado** (copia interna + copia en Documentos).

## Notas técnicas

- ProGuard/R8 desactivado a propósito: POI + XMLBeans usan reflexión intensiva y el ofuscado rompía el procesamiento de PPTX/DOCX/XLSX.
- App personal, no distribuida por Play Store.

## Contacto

Para soporte o reportes de bugs:  
🐙 GitHub: [@luisenriquepupo16-rgb](https://github.com/luisenriquepupo16-rgb)