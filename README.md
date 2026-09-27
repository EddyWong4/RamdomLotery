# Generador de tableros de Lotería

Genera tableros de Lotería Mexicana (54 cartas) de **2×2, 3×3, 4×4 y 5×5** y los exporta a PDF para imprimir.

| Tamaño de impresión | Tableros por hoja | Hoja |
|---|---|---|
| Grande | 1 | vertical |
| S | 2 | horizontal |
| XS | 4 | vertical |

**Tableros dobles:** opcionalmente una carta de cada tablero aparece 2 veces, en la posición elegida
(esquinas, diagonales, esquinas centrales o pares centrales; ver `src/posiciones.js`) o en una posición aleatoria por tablero.
Las esquinas centrales y los pares solo existen en 4×4 y 5×5; en 5×5 el “par” son las 2 casillas que rodean la del centro.

- Sin base de datos ni servidor: todo corre en el navegador.
- Las preferencias, el juego actual y los juegos guardados se guardan en `localStorage` (solo en ese navegador).
- Software libre: [Vite](https://vitejs.dev), [jsPDF](https://github.com/parallax/jsPDF), [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) y [Vitest](https://vitest.dev) (todos MIT).

**Simulador de partidas** (`src/simulador.js`): juega 100, 1,000 o 10,000 partidas con los tableros generados
(forma de ganar: tabla llena, línea o cuatro esquinas), muestra el tablero que más veces ganó y las victorias de cada uno.
Una prueba de chi-cuadrada indica si las diferencias son normales del azar o si algún tablero tiene ventaja real.
Se recomiendan al menos ~20 victorias esperadas por tablero (p. ej. 1,000 partidas para 10–50 tableros).

**Cantador** (sección *Cantar*, `#/cantar`): canta las 54 cartas en orden aleatorio, una por una o en automático
(cada 3–15 s), con voz opcional del navegador. Muestra el historial de cartas cantadas y la partida se conserva al recargar.
El **verificador** revisa un tablero del juego actual (llena, línea o esquinas) contra las cartas cantadas, resalta las casillas
y puede revisar todos los tableros para saber quién ya ganó.

**Tableros en el celular:** el botón 📱 de cada tablero muestra un link y un código QR (`#/jugar?c=…&n=…&k=…&t=…`).
El celular vuelve a generar el mismo tablero a partir del código del juego (sin servidor) y el jugador marca las cartas tocándolas;
las marcas se guardan en su navegador. Con carta doble, tocarla marca sus dos casillas.

**Respaldo:** descarga un archivo `.json` con los juegos guardados, preferencias, partida del cantador, marcas de tableros
y, opcionalmente, las imágenes cargadas. Al restaurarlo se agregan los juegos sin borrar los existentes; el juego actual y las
preferencias solo se reemplazan si el usuario lo confirma.

## Uso

Requiere [Node.js](https://nodejs.org) 18 o superior.

```bash
npm install
npm run dev          # abre http://localhost:5173
npm run build        # genera la carpeta dist/ para publicar en cualquier hosting estático
npm test             # pruebas automáticas (Vitest)
```

## Imágenes de las cartas

Las imágenes **no se incluyen en el repositorio** (tienen derechos de autor). Hay dos formas de usarlas:

- **En la página publicada:** el panel *Imágenes de las cartas* pide elegir la carpeta o los archivos.
  Cada archivo debe empezar con el número de carta (`1 el gallo.jpg`, `06-la-sirena.png`, `54.jpg`).
  Se recortan a la proporción de carta, se reducen y se guardan en IndexedDB **solo en ese navegador** (`src/imagenes.js`).
  Las cartas sin imagen se dibujan como provisionales (número y nombre).
- **En tu copia local:** si existe `public/cartas/01.jpg … 54.jpg` (y `public/cartas/min/`), la app las usa directamente
  y oculta el panel. Esa carpeta está en `.gitignore`. Para generarla:

```bash
npm run imagenes -- -Origen "C:\ruta\a\las\cartas"
```

Los nombres de las cartas están en `src/cartas.js`.

## Versión

El pie de página muestra `v<versión> · <commit> · <fecha de compilación>`. La versión sale de `package.json`
y el commit y la fecha se agregan solos al compilar (`vite.config.js`). Para una nueva versión:

- `1.1.0 → 1.1.1` correcciones · `1.1.0 → 1.2.0` funciones nuevas · `1.x → 2.0.0` cambios grandes

## Publicar en GitHub Pages

El flujo `.github/workflows/deploy.yml` compila y publica la app en cada `push` a `main`.
Una sola vez: en GitHub, **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Cómo se generan los tableros

`src/generador.js`

- **Únicos:** nunca hay dos tableros con el mismo conjunto de cartas.
- **Equilibrados:** se eligen primero las cartas menos usadas, así cada carta aparece un número parecido de veces.
- **Poco parecidos:** por cada tablero se prueban 30 candidatos y se queda el que menos cartas comparte con los ya creados.
- **Reproducibles:** el *código del juego* es la semilla; mismo código + tamaño + cantidad = mismos tableros.

## Estructura

```
src/
  cartas.js      catálogo de las 54 cartas
  generador.js   algoritmo de tableros (aleatorio con semilla)
  posiciones.js  posiciones de la carta doble
  simulador.js   simulación de partidas y prueba de equidad
  reglas.js      formas de ganar y verificación de un tablero
  partida.js     baraja del cantador (con semilla)
  cantador.js    vista Cantar: cantador y verificador
  rutas.js       navegación entre vistas (#/, #/cantar, #/jugar)
  enlaces.js     links reproducibles de tableros
  jugador.js     vista Jugar: tablero en el celular
  compartir.js   ventana con link y código QR
  respaldo.js    formato, validación y combinación de respaldos
  pdf.js         dibujo de tableros y hojas con jsPDF
  almacen.js     persistencia en localStorage
  imagenes.js    imágenes de las cartas (incluidas o cargadas por el usuario en IndexedDB)
  main.js        interfaz
scripts/preparar-imagenes.ps1   renombra y redimensiona las imágenes
tests/                          pruebas automáticas
docs/PLAN.md                    plan de mejoras
```
