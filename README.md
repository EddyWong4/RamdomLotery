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
- Software libre: [Vite](https://vitejs.dev), [jsPDF](https://github.com/parallax/jsPDF), [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) y [Vitest](https://vitest.dev) y [vite-plugin-pwa](https://vite-pwa-org.netlify.app) (todos MIT).

**Agregar y eliminar tableros:** el botón 🗑 quita un tablero y la tarjeta **+** agrega el siguiente del mismo código
(`src/juego.js`). Los tableros conservan su número (no se renumeran) y el nuevo cumple las mismas reglas (único, reparto parejo,
doble distinta), así los tableros impresos y los links compartidos siguen coincidiendo.

**Tableros a mano y favoritos** (`src/favoritos.js`, `src/editor-tablero.js`, `src/panel-favoritos.js`): el editor permite
elegir cada carta de cada casilla (buscar por nombre o número, completar al azar); una carta repetida dos veces lo vuelve tablero
doble. La ★ de cualquier tablero generado lo guarda en favoritos. **Usar como juego** convierte los favoritos elegidos (mismo
tamaño) en el juego actual para imprimirlos, simularlos, verificarlos y compartirlos; como no tienen código de juego, el link
lleva las cartas (`#/jugar?b=1.6.7.7…`). Los favoritos viajan en el respaldo.

**Simulador de partidas** (`src/simulador.js`): juega 100, 1,000 o 10,000 partidas con los tableros generados
(forma de ganar: tabla llena, línea o cuatro esquinas), muestra el tablero que más veces ganó y las victorias de cada uno.
Una prueba de chi-cuadrada indica si las diferencias son normales del azar o si algún tablero tiene ventaja real.
Se recomiendan al menos ~20 victorias esperadas por tablero (p. ej. 1,000 partidas para 10–50 tableros).

**Cantador** (sección *Cantar*, `#/cantar`): canta las 54 cartas en orden aleatorio, una por una o en automático
(cada 3–15 s), con voz opcional del navegador. Tocar la carta saca la siguiente (como una baraja). Al empezar suena una
fanfarria ascendente y al cantar la carta 54 un cierre descendente con campana. Se sintetizan como WAV en memoria y se
reproducen con <audio> (suenan en iPhone aunque esté en silencio, igual que la voz); sin archivos; se pueden apagar. Muestra el historial de cartas cantadas y la partida se conserva al recargar.
El **verificador** revisa un tablero del juego actual (llena, línea o esquinas) contra las cartas cantadas, resalta las casillas
y puede revisar todos los tableros para saber quién ya ganó.

**Tableros en el celular:** el botón 📱 de cada tablero (o *Compartir seleccionados*) muestra un link y un código QR
(`#/jugar?c=…&n=…&k=…&t=3,7,12`) con uno o varios tableros (hasta 12). El celular los vuelve a generar a partir del código del
juego (sin servidor). El jugador puede agregar o quitar tableros del mismo juego, marca las cartas tocándolas y, si quiere, la carta
se marca en todos sus tableros a la vez. Las marcas se guardan en su navegador.

**Fichas:** círculo (predeterminado), frijol, corcholata, moneda, tache, palomita, estrella, emoji o una imagen propia, con color,
tamaño y opacidad a elegir (`src/fichas.js`). Se pueden crear varias, **exportar e importar** en un archivo `.json`
(se validan al importar y no se duplican) y también viajan en el respaldo general.

**Respaldo:** descarga un archivo `.json` con los juegos guardados, preferencias, partida del cantador, marcas de tableros
y, opcionalmente, las imágenes cargadas. Al restaurarlo se agregan los juegos sin borrar los existentes; el juego actual y las
preferencias solo se reemplazan si el usuario lo confirma.

**Temas de color** (`src/temas.css`, `src/temas.js`): Clásico (predeterminado), Talavera (claro), Cempasúchil, Mesa de juego y
Papel picado (claro). Se eligen con el botón de la paleta y se recuerdan en el dispositivo. Todos los colores de la interfaz salen de
variables del tema; una prueba revisa el contraste de texto (WCAG AA ≥ 4.5:1) de cada tema. Los PDF no cambian con el tema.
Cada tema tiene un **fondo decorativo** propio (SVG dibujados para la app en `src/fondos/`): cartitas y soles (Clásico), azulejo
de talavera, flores de cempasúchil, fieltro con frijolitos (Mesa de juego) y tira de papel picado con confeti. Se puede apagar
con el interruptor "Fondo decorativo" de la ventana de temas.

**Aspecto de app nativa:** en el celular la app se adapta al dispositivo (`src/plataforma.js` + `src/nativo.css`): barra superior
fija, barra de pestañas abajo (Tableros, Cantar, Jugar), respeto del notch, interruptores y ventanas que suben desde abajo.
En iPhone/iPad usa el estilo iOS (San Francisco, barras translúcidas, control segmentado) y en Android el estilo Material 3
(Roboto, indicador en píldora, snackbar); en la computadora no cambia. Se conservan los colores de la lotería.
Para probar otro estilo: `?plataforma=ios`, `android` o `escritorio` en la dirección.

**Botón "Instalar app"** (`src/instalar.js`): en Chrome/Edge/Samsung (Android y computadora) abre la ventana nativa de
instalación; en iPhone/iPad y Safari de Mac muestra una guía con los pasos (Compartir → Agregar a pantalla de inicio / Archivo →
Agregar al Dock). Se oculta si la app ya está instalada o si el navegador no permite instalar.

**Sin internet (PWA):** después de la primera visita la app funciona sin conexión y se puede instalar en el celular o la
computadora ("Agregar a pantalla de inicio" / "Instalar"). Cuando se publica una versión nueva aparece un aviso para actualizar.

**Contador de visitas** (`src/visitas.js`): con [GoatCounter](https://www.goatcounter.com) (gratis, sin cookies, no guarda IP).
La visita se registra con su "píxel" (sin cargar scripts de terceros), una vez por cada apertura de la app, y el total se muestra
al pie de la página. No cuenta en localhost ni sin internet. Se activa poniendo el código del sitio en `src/config.js`
(`GOATCOUNTER`) y activando *Allow adding visitor counts on your website* en la configuración del sitio en GoatCounter.

## Uso

Requiere [Node.js](https://nodejs.org) **20 o superior** (la compilación de la PWA no funciona en Node 18).
`npm run dev` y `npm test` también funcionan en Node 18.

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
  sonidos.js     sonidos de inicio y fin de partida (WAV sintetizado + <audio>)
  rutas.js       navegación entre vistas (#/, #/cantar, #/jugar)
  enlaces.js     links reproducibles de tableros
  jugador.js     vista Jugar: uno o varios tableros en el celular
  compartir.js   ventana con link y código QR
  fichas.js      tipos de ficha, dibujo SVG, validación y archivo de fichas
  mis-fichas.js  fichas guardadas del usuario y ficha activa
  panel-fichas.js panel para elegir / personalizar / exportar / importar fichas
  juego.js       agregar / eliminar tableros de un juego
  favoritos.js   validación de tableros a mano, favoritos y juego de favoritos
  editor-tablero.js editor para crear / cambiar un tablero a mano
  panel-favoritos.js panel "Mis tableros favoritos"
  respaldo.js    formato, validación y combinación de respaldos
  pwa.js         service worker y aviso de nueva versión
  plataforma.js  detección de iOS / Android / escritorio
  visitas.js     contador de visitas (GoatCounter)
  instalar.js    botón "Instalar app" y guías por dispositivo
  config.js      configuración del sitio publicado (código de GoatCounter)
  nativo.css     estilos de app nativa en el celular
  temas.css      colores de los 5 temas
  temas.js       lista de temas, aplicar y recordar
  panel-temas.js ventana para elegir el tema
  pdf.js         dibujo de tableros y hojas con jsPDF
  almacen.js     persistencia en localStorage
  imagenes.js    imágenes de las cartas (incluidas o cargadas por el usuario en IndexedDB)
  main.js        interfaz
scripts/preparar-imagenes.ps1   renombra y redimensiona las imágenes
scripts/generar-iconos.ps1      íconos de la app (public/icono-*.png)
tests/                          pruebas automáticas
docs/PLAN.md                    plan de mejoras
```
