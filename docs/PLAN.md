# Plan de mejoras

Objetivo: agregar el modo de juego completo **sin perder nada de lo que ya funciona**.

## Reglas para todas las fases

1. **Primero la red de seguridad.** Antes de tocar funciones, se crean pruebas automáticas que fijan el
   comportamiento actual (incluido que un mismo código de juego siga generando los mismos tableros).
2. **Las pruebas corren en GitHub Actions antes de publicar.** Si alguna falla, la página no se actualiza.
3. **Lo nuevo va en módulos nuevos.** `main.js` (vista de tableros) solo recibe los ganchos mínimos
   (botones, enlaces). La lógica compartida se extrae a módulos con pruebas.
4. **Cada fase termina igual:** pruebas en verde → revisión manual (lista de abajo) → subir versión →
   commit → publicar → comprobar en la página en vivo.

### Lista de revisión manual (funcionalidad actual)

- [ ] Generar tableros 2×2, 3×3, 4×4 y 5×5; mismo código ⇒ mismos tableros
- [ ] Tableros dobles: 16 posiciones + aleatoria; doble distinta en cada tablero (≤ 54)
- [ ] PDF Grande / S / XS, un solo tablero, seleccionados, baraja de 54 cartas
- [ ] Simulador: 100 / 1,000 / 10,000 partidas, llena / línea / esquinas
- [ ] Juegos guardados: guardar, abrir, borrar
- [ ] Imágenes: incluidas (local) y cargadas en el navegador (página publicada); cartas provisionales
- [ ] Etiqueta de versión

## Fases

| Fase | Versión | Qué | Estado |
|---|---|---|---|
| 0 | 1.1.1 | Pruebas automáticas (Vitest) + pruebas en CI | ✅ |
| 1 | 1.2.0 | Modo **Cantador** + **Verificador de ganador** | ✅ |
| 2 | 1.3.0 | **Tableros en el celular** (link / QR, marcar cartas tocando) | ⏳ |
| 3 | 1.4.0 | **Respaldo**: exportar / importar juegos, preferencias e imágenes | ⏳ |
| 4 | 1.5.0 | **Sin internet (PWA)**: funciona offline e instalable | ⏳ |
| 5 | 1.5.1 | **Rendimiento**: vista previa por páginas con muchos tableros | ⏳ |

### Fase 0 — Red de seguridad
- Vitest (MIT). Pruebas de `generador`, `posiciones`, `simulador`, `almacen`, `pdf` (humo: hojas por formato, textos).
- **Huella de reproducibilidad:** se guardan los tableros de varios códigos conocidos; si un cambio los altera, la prueba falla.
- `npm test` en el flujo de publicación, antes de compilar.

### Fase 1 — Cantador y verificador
- `src/reglas.js`: condiciones de victoria (llena, línea, esquinas) compartidas por simulador y verificador.
- `src/partida.js`: baraja con semilla, cartas cantadas, deshacer; se guarda en el navegador.
- Vista **Cantar** (`#/cantar`): carta grande, siguiente / anterior, avance automático (3–15 s), voz opcional
  del navegador (`speechSynthesis`, apagada por defecto), historial de las 54 cartas.
- **Verificador**: número de tablero + forma de ganar → confirma y resalta las casillas.

### Fase 2 — Tableros en el celular
- Link reproducible: `#/jugar?c=CÓDIGO&n=TAMAÑO&k=CANTIDAD&d=DOBLE&t=TABLERO` regenera el tablero sin servidor.
- Vista **Jugar**: tablero a pantalla completa, tocar para marcar; marcas guardadas por juego y tablero.
- Botón **Compartir** por tablero: copiar link y código QR (librería libre).

### Fase 3 — Respaldo
- Un archivo `.json` con preferencias, juego actual, juegos guardados y, opcionalmente, las imágenes cargadas.
- Restaurar combina con lo existente sin borrar nada sin confirmación.

### Fase 4 — PWA
- `vite-plugin-pwa` (MIT): manifiesto, íconos propios, *service worker* que guarda la app para uso offline.
- Aviso “Hay una nueva versión” para no quedarse con una versión vieja.
- Las imágenes incluidas localmente (`public/cartas`) no se precargan.

### Fase 5 — Rendimiento
- Vista previa de tableros de 48 en 48 (“Mostrar más”); selección, simulación y “Ver tablero” siguen funcionando.
