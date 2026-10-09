---
name: Magic World
version: 2.1.10
version_code: 8
package: com.mundomagico.bebe
category: Educativa
min_android: 8.0
min_sdk: 26
target_sdk: 34
technologies:
  - Kotlin
  - WebView
  - HTML5
  - CSS3
  - JavaScript
  - Canvas API
  - Web Speech API
  - Web Audio API
input_formats: []
output_formats: []
restrictions: null
dedication: Para el primito más enérgico que he conocido.
github: https://github.com/luisenriquepupo16-rgb
---

## Description

Aplicación educativa para bebés y niños pequeños. Enseña vocabulario básico (animales, números, abecedario, colores, figuras, frutas, partes del cuerpo, emociones, naturaleza, familia, vehículos y música) con sonidos, voz en español y minijuegos interactivos.*

## Uso

1. Abre la app.
2. Explora las categorías deslizando la barra superior: Animales, Números, ABC, Colores, Figuras, Frutas, Cuerpo, Emociones, Naturaleza, Familia, Vehículos y Música.
3. Toca cualquier tarjeta para escuchar su nombre y sonido.
4. Pulsa "🎮 Juegos" para acceder a los minijuegos.
5. Personaliza el perfil del niño tocando la barra de estrellas (nombre, edad, género y foto).
6. Usa el bloqueo infantil (🔒) para evitar que el niño salga de la app.

## Características

- ✅ 12 categorías educativas: animales, números, abecedario, colores, figuras, frutas, cuerpo, emociones, naturaleza, familia, vehículos y música.
- ✅ Más de 100 tarjetas interactivas con voz en español y sonidos.
- ✅ 10 minijuegos: ¿Dónde está?, Parejas Mágicas, Alimenta al Amigo, Cocina Divertida, Atrapa los Globos, Aprende a Contar, Piano Infantil, Dibujo Mágico, Adivina la Sombra y Explota Burbujas.
- ✅ Perfil personalizable: nombre, edad, género y foto del niño.
- ✅ Sistema de estrellas como recompensa.
- ✅ Amigo virtual (mascota) que interactúa con el niño.
- ✅ Música ambiente relajante.
- ✅ Modo bloqueo infantil para evitar salidas accidentales.
- ✅ Pantalla completa.
- ✅ 100% offline.

## Notas técnicas

- La UI es un WebView que carga un HTML local con todo el contenido.
- El audio y la voz usan Web Audio API y Web Speech API.
- El puente nativo `Android.speak()` se usa para el texto a voz cuando está disponible.
- El perfil del niño se guarda en `localStorage` del WebView.
- ProGuard activado (minify + shrinkResources).
- Firma con keystore personalizado.

## Contacto

- GitHub: [@luisenriquepupo16-rgb](https://github.com/luisenriquepupo16-rgb)