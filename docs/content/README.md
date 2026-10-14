# Carpeta `content/`

Esta carpeta contiene los datos dinámicos del portafolio, separados del HTML.

## Propósito

Siguiendo la misma idea que `catalog.json`, el contenido de las secciones del
portafolio vive en archivos JSON independientes. Así:

- `index.html` se mantiene limpio y legible.
- El contenido se edita sin tocar HTML.
- Es coherente con cómo funciona el catálogo.

## Archivos

| Archivo | Sección del portafolio |
|---|---|
| `projects.json` | Proyectos en progreso |
| `learning.json` | Aprendizaje continuo |
| `challenges.json` | Retos técnicos |
| `opensource.json` | Contribuciones open source |
| `blog.json` | Vitrina del blog (entradas destacadas) |

## Cómo añadir contenido

1. Editar el archivo JSON correspondiente.
2. Hacer commit y push.
3. El portafolio se actualiza solo (no hay build, es estático).

## Formato

Cada archivo tiene:
- `version`: número de versión del esquema (empezamos por 1).
- `section`: identificador interno de la sección.
- `title` e `intro`: textos de cabecera.
- `items` o `blocks`: el contenido real.

## Notas

- No tocar `catalog.json` (está en `docs/`, no aquí).
- Los JSON deben guardarse en **UTF-8 sin BOM**.
- Los cambios en estos archivos se reflejan al recargar la página.