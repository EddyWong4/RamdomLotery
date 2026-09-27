import { cartaPorId } from './cartas.js';
import { generarTableros, semillaAleatoria, MAX_TABLEROS } from './generador.js';
import { crearPdfTableros, crearPdfBaraja, FORMATOS, PAPELES } from './pdf.js';
import { simular, MODOS, JUGADAS } from './simulador.js';
import * as imagenes from './imagenes.js';
import { POSICION_ALEATORIA, posicionesDisponibles, indicesDoble, nombrePosicion } from './posiciones.js';
import * as almacen from './almacen.js';
import { registrarVista, iniciarRutas } from './rutas.js';
import { iniciarJugador, vistaJugar, refrescarJugador } from './jugador.js';
import { iniciarCompartir, abrirCompartir } from './compartir.js';
import { MAX_TABLEROS_JUGADOR } from './enlaces.js';
import { crearRespaldo, validarRespaldo, combinarDatos, traeDatosActuales } from './respaldo.js';
import { iniciarPwa } from './pwa.js';
import { agregarTablero, eliminarTablero, puedeAgregar, tablerosGenerados, tablerosEliminados } from './juego.js';
import { iniciarCantador, vistaCantar, refrescarCantador } from './cantador.js';

const PREFERENCIAS_INICIALES = {
  tamano: 4,
  cantidad: 10,
  semilla: '',
  alcance: 'todos',
  formato: 'grande',
  dobles: false,
  posicionDoble: 'esquinas-superiores',
  jugadas: 1000,
  modo: 'llena',
  papel: 'carta',
  lineasCorte: true,
  mostrarPie: true,
};

const ANCHO_VISTA = { 2: '190px', 3: '220px', 4: '250px', 5: '280px' };
const POR_PAGINA = 48; // tableros por página en la vista previa

const $ = (sel) => document.querySelector(sel);
const el = {
  tamano: $('#tamano'),
  cantidad: $('#cantidad'),
  semilla: $('#semilla'),
  btnSemilla: $('#btn-semilla'),
  btnGenerar: $('#btn-generar'),
  alcance: $('#alcance'),
  respaldoImagenes: $('#respaldo-imagenes'),
  respaldoImagenesNota: $('#respaldo-imagenes-nota'),
  btnDescargarRespaldo: $('#btn-descargar-respaldo'),
  inputRespaldo: $('#input-respaldo'),
  panelImagenes: $('#panel-imagenes'),
  estadoImagenes: $('#estado-imagenes'),
  inputCarpeta: $('#input-carpeta'),
  inputArchivos: $('#input-archivos'),
  btnBorrarImagenes: $('#btn-borrar-imagenes'),
  formato: $('#formato'),
  jugadas: $('#jugadas'),
  modo: $('#modo'),
  ayudaSimulacion: $('#ayuda-simulacion'),
  btnSimular: $('#btn-simular'),
  simulacion: $('#simulacion'),
  dobles: $('#dobles'),
  opcionDoble: $('#opcion-doble'),
  posicionDoble: $('#posicion-doble'),
  diagramaDoble: $('#diagrama-doble'),
  papel: $('#papel'),
  miniaturaHoja: $('#miniatura-hoja'),
  lineasCorte: $('#lineas-corte'),
  mostrarPie: $('#mostrar-pie'),
  btnVerPdf: $('#btn-ver-pdf'),
  btnDescargarPdf: $('#btn-descargar-pdf'),
  btnBaraja: $('#btn-baraja'),
  cuentaTodos: $('#cuenta-todos'),
  cuentaSeleccion: $('#cuenta-seleccion'),
  listaJuegos: $('#lista-juegos'),
  barra: $('#barra-resultados'),
  estadisticas: $('#estadisticas'),
  btnSelTodos: $('#btn-sel-todos'),
  btnSelNinguno: $('#btn-sel-ninguno'),
  btnGuardar: $('#btn-guardar'),
  btnCompartirSeleccion: $('#btn-compartir-seleccion'),
  vacio: $('#vacio'),
  tableros: $('#tableros'),
  masTableros: $('#mas-tableros'),
  aviso: $('#aviso'),
};

const estado = {
  prefs: almacen.cargarPreferencias(PREFERENCIAS_INICIALES),
  juego: almacen.cargarJuegoActual(), // { id, tamano, semilla, tableros, estadisticas, creado }
  seleccion: new Set(),
  ocupado: false,
  verTodaLaSimulacion: false,
  visibles: POR_PAGINA, // tableros mostrados en la vista previa
};
if (estado.juego?.seleccion) estado.seleccion = new Set(estado.juego.seleccion);

// ── Utilidades ───────────────────────────────────────────────────────────────
const escapar = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

let temporizadorAviso;
function avisar(mensaje, ms = 2600) {
  el.aviso.textContent = mensaje;
  el.aviso.classList.add('visible');
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => el.aviso.classList.remove('visible'), ms);
}

function guardarPrefs() {
  almacen.guardarPreferencias(estado.prefs);
}

function guardarJuegoActual() {
  if (estado.juego) almacen.guardarJuegoActual({ ...estado.juego, seleccion: [...estado.seleccion] });
}

function marcarSegmentado(contenedor, valor) {
  contenedor.querySelectorAll('button').forEach((b) => {
    const activo = b.dataset.valor === String(valor);
    b.classList.toggle('activo', activo);
    b.setAttribute('aria-pressed', activo);
  });
}

function alElegir(contenedor, fn) {
  contenedor.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-valor]');
    if (b && !b.disabled) fn(b.dataset.valor);
  });
}

function nombreArchivo(sufijo) {
  return `loteria-${sufijo}.pdf`;
}

// ── Formulario ──────────────────────────────────────────────────────────────
function pintarFormulario() {
  const p = estado.prefs;
  el.cantidad.value = p.cantidad;
  el.semilla.value = p.semilla;
  marcarSegmentado(el.tamano, p.tamano);
  marcarSegmentado(el.formato, p.formato);
  marcarSegmentado(el.jugadas, p.jugadas);
  marcarSegmentado(el.modo, p.modo);
  el.dobles.checked = p.dobles;
  pintarOpcionDoble();
  el.papel.value = p.papel;
  el.lineasCorte.checked = p.lineasCorte;
  el.mostrarPie.checked = p.mostrarPie;
  pintarPanelPdf();
}

function tablerosAImprimir() {
  if (!estado.juego) return [];
  if (estado.prefs.alcance === 'seleccion') {
    return estado.juego.tableros.filter((t) => estado.seleccion.has(t.numero));
  }
  return estado.juego.tableros;
}

function pintarPanelPdf() {
  const total = estado.juego?.tableros.length ?? 0;
  const seleccionados = estado.seleccion.size;
  el.cuentaTodos.textContent = total;
  el.cuentaSeleccion.textContent = seleccionados;

  // Si no hay selección, se usa "todos"
  const botonSeleccion = el.alcance.querySelector('[data-valor="seleccion"]');
  botonSeleccion.disabled = seleccionados === 0;
  const alcance = seleccionados === 0 ? 'todos' : estado.prefs.alcance;
  marcarSegmentado(el.alcance, alcance);

  el.lineasCorte.disabled = estado.prefs.formato === 'grande';

  const hayTableros = tablerosAImprimir().length > 0;
  el.btnVerPdf.disabled = !hayTableros || estado.ocupado;
  el.btnCompartirSeleccion.disabled = seleccionados === 0 || seleccionados > MAX_TABLEROS_JUGADOR;
  el.btnCompartirSeleccion.title = seleccionados > MAX_TABLEROS_JUGADOR
    ? `Se pueden compartir hasta ${MAX_TABLEROS_JUGADOR} tableros juntos`
    : 'Un solo link / QR para jugar los tableros seleccionados en el celular';
  el.btnDescargarPdf.disabled = !hayTableros || estado.ocupado;
  el.btnBaraja.disabled = estado.ocupado;

  pintarMiniaturaHoja();
  pintarAyudaSimulacion();
}

function pintarMiniaturaHoja() {
  const { cols, filas, orientacion } = FORMATOS[estado.prefs.formato];
  const papel = PAPELES[estado.prefs.papel];
  const [w, h] = orientacion === 'horizontal' ? [papel.h, papel.w] : [papel.w, papel.h];
  const escala = 64 / Math.max(w, h);
  Object.assign(el.miniaturaHoja.style, {
    width: `${w * escala}px`,
    height: `${h * escala}px`,
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gridTemplateRows: `repeat(${filas}, 1fr)`,
  });
  el.miniaturaHoja.innerHTML = '<i></i>'.repeat(cols * filas);
}

// Llena las posiciones válidas para el tamaño elegido y dibuja el diagrama
function pintarOpcionDoble() {
  const p = estado.prefs;
  const n = p.tamano;
  const disponibles = posicionesDisponibles(n);
  if (p.posicionDoble !== POSICION_ALEATORIA && !disponibles.some((x) => x.id === p.posicionDoble)) {
    p.posicionDoble = disponibles[0].id;
  }

  el.opcionDoble.hidden = !p.dobles;
  el.posicionDoble.innerHTML = disponibles
    .map((x, i) => `<option value="${x.id}">${i + 1}. ${x.nombre}</option>`)
    .concat(`<option value="${POSICION_ALEATORIA}">Aleatoria (cambia en cada tablero)</option>`)
    .join('');
  el.posicionDoble.value = p.posicionDoble;

  const marcadas = new Set(indicesDoble(p.posicionDoble, n) ?? []);
  el.diagramaDoble.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
  el.diagramaDoble.innerHTML = Array.from({ length: n * n }, (_, i) => `<i${marcadas.has(i) ? ' class="doble"' : ''}></i>`).join('');
}

// Cuántas veces es doble cada carta (hasta 54 tableros ninguna se repite como doble)
function resumenDobles(tableros) {
  const veces = new Map();
  tableros.forEach((t) => t.doble && veces.set(t.doble.carta, (veces.get(t.doble.carta) ?? 0) + 1));
  const max = Math.max(...veces.values());
  if (max <= 1) return 'Carta doble distinta en cada tablero';
  const min = veces.size < 54 ? 0 : Math.min(...veces.values());
  return min === max ? `Cada carta es doble ${max} veces` : `Cada carta es doble ${min}–${max} veces`;
}

// ── Tableros ────────────────────────────────────────────────────────────────
function pintarTableros() {
  const juego = estado.juego;
  const hay = !!juego?.tableros.length;
  el.vacio.hidden = hay;
  el.barra.hidden = !hay;
  if (!hay) {
    el.tableros.innerHTML = '';
    pintarSimulacion();
    pintarPanelPdf();
    return;
  }

  const sim = simulacionVigente();
  const victoriasPorTablero = new Map(sim ? sim.tableros.map((num, i) => [num, sim.victorias[i]]) : []);
  const maxVictorias = sim ? Math.max(...sim.victorias) : -1;

  const n = juego.tamano;
  const e = juego.estadisticas;
  el.estadisticas.innerHTML = [
    `${juego.tableros.length} tableros ${n}×${n}` + (tablerosEliminados(juego) ? ` (${tablerosEliminados(juego)} eliminados)` : ''),
    `Código: ${escapar(juego.semilla)}`,
    juego.posicionDoble ? `Dobles: ${nombrePosicion(juego.posicionDoble)}` : null,
    juego.posicionDoble ? resumenDobles(juego.tableros) : null,
    e.usoMin === e.usoMax ? `Cada carta sale ${e.usoMin} veces` : `Cada carta sale ${e.usoMin}–${e.usoMax} veces`,
    juego.tableros.length > 1 ? `Máx. ${e.maxComun} cartas en común entre tableros` : null,
  ].filter(Boolean).map((t) => `<span>${t}</span>`).join('');

  el.tableros.style.setProperty('--ancho-tablero', ANCHO_VISTA[n]);
  const contexto = { n, victoriasPorTablero, maxVictorias };
  el.tableros.innerHTML = juego.tableros.slice(0, estado.visibles).map((t) => htmlTablero(t, contexto)).join('');
  pintarMasTableros();

  pintarSimulacion();
  pintarPanelPdf();
}

// Con muchos tableros la vista previa se muestra por partes para no crear miles de imágenes a la vez
function pintarMasTableros() {
  const total = estado.juego?.tableros.length ?? 0;
  const faltan = total - Math.min(estado.visibles, total);
  const agregar = estado.juego && puedeAgregar(estado.juego);

  // La tarjeta "+" va al final de la rejilla, solo cuando ya se ven todos los tableros
  el.tableros.querySelector('.tablero-agregar')?.remove();
  if (faltan <= 0 && agregar) {
    el.tableros.insertAdjacentHTML('beforeend', `
      <button type="button" class="tablero-agregar" data-agregar title="Generar el tablero Nº ${String(tablerosGenerados(estado.juego) + 1).padStart(3, '0')} con el mismo código">
        <span class="mas" aria-hidden="true">+</span>
        <span>Agregar tablero</span>
      </button>`);
  }

  el.masTableros.hidden = faltan <= 0;
  if (faltan <= 0) return;
  el.masTableros.innerHTML = `
    <span>Mostrando ${formatoNumero(estado.visibles)} de ${formatoNumero(total)} tableros</span>
    <button type="button" class="btn-chico destacado" data-mas="pagina">Mostrar ${Math.min(POR_PAGINA, faltan)} más</button>
    <button type="button" class="btn-chico" data-mas="todos">Mostrar todos</button>
    ${agregar ? '<button type="button" class="btn-chico" data-agregar>+ Agregar tablero</button>' : ''}`;
}

function agregarUnTablero() {
  if (!estado.juego || !puedeAgregar(estado.juego)) return;
  const todosVisibles = estado.visibles >= estado.juego.tableros.length;
  estado.juego = agregarTablero(estado.juego);
  const nuevo = estado.juego.tableros[estado.juego.tableros.length - 1];
  if (todosVisibles) estado.visibles = estado.juego.tableros.length;
  guardarJuegoActual();
  pintarTableros();
  if (todosVisibles) irATablero(nuevo.numero);
  avisar(`Tablero Nº ${String(nuevo.numero).padStart(3, '0')} agregado`);
}

function eliminarUnTablero(numero) {
  const etiqueta = `Nº ${String(numero).padStart(3, '0')}`;
  if (!window.confirm(`¿Eliminar el tablero ${etiqueta}?\n\nLos demás conservan su número.`)) return;
  estado.juego = eliminarTablero(estado.juego, numero);
  estado.seleccion.delete(numero);
  guardarJuegoActual();
  pintarTableros();
  avisar(`Tablero ${etiqueta} eliminado`);
}

function mostrarMasTableros(cuantos) {
  const juego = estado.juego;
  const desde = estado.visibles;
  estado.visibles = Math.min(juego.tableros.length, desde + cuantos);
  const sim = simulacionVigente();
  const contexto = {
    n: juego.tamano,
    victoriasPorTablero: new Map(sim ? sim.tableros.map((num, i) => [num, sim.victorias[i]]) : []),
    maxVictorias: sim ? Math.max(...sim.victorias) : -1,
  };
  // Se agregan solo los nuevos, sin volver a pintar los que ya están
  el.tableros.insertAdjacentHTML('beforeend', juego.tableros.slice(desde, estado.visibles).map((t) => htmlTablero(t, contexto)).join(''));
  pintarMasTableros();
}

function htmlTablero(t, { n, victoriasPorTablero, maxVictorias }) {
  const sel = estado.seleccion.has(t.numero);
  const numero = String(t.numero).padStart(3, '0');
  const cartas = t.cartas.map((id) => {
    const c = cartaPorId(id);
    const doble = id === t.doble?.carta;
    const titulo = `${id}. ${escapar(c.nombre)}${doble ? ' (doble)' : ''}`;
    const url = imagenes.urlMiniatura(id);
    if (!url) return `<div class="carta-vacia${doble ? ' doble' : ''}" title="${titulo}"><b>${id}</b><span>${escapar(c.nombre)}</span></div>`;
    return `<img src="${url}"${doble ? ' class="doble"' : ''} alt="${escapar(c.nombre)}" title="${titulo}" loading="lazy" decoding="async">`;
  }).join('');
  const victorias = victoriasPorTablero.get(t.numero);
  const campeon = victorias !== undefined && victorias === maxVictorias;
  return `
    <article class="tablero${sel ? ' seleccionado' : ''}${campeon ? ' campeon' : ''}" data-numero="${t.numero}">
      <div class="tablero-cabecera">
        <label><input type="checkbox" ${sel ? 'checked' : ''} aria-label="Seleccionar tablero ${numero}"> Nº ${numero}</label>
        ${victorias !== undefined ? `<span class="victorias" title="Victorias en la simulación">${campeon ? '🏆 ' : ''}${formatoNumero(victorias)}</span>` : ''}
        <button type="button" data-compartir="${t.numero}" class="secundario" title="Jugar este tablero en el celular (link y QR)" aria-label="Compartir tablero ${numero}">📱</button>
        <button type="button" data-pdf="${t.numero}" title="PDF solo con este tablero">PDF</button>
        <button type="button" data-eliminar="${t.numero}" class="secundario" title="Eliminar este tablero" aria-label="Eliminar tablero ${numero}">🗑</button>
      </div>
      <div class="tablero-cartas" style="grid-template-columns:repeat(${n},1fr)">${cartas}</div>
    </article>`;
}

function actualizarSeleccionVisual() {
  el.tableros.querySelectorAll('.tablero').forEach((art) => {
    const sel = estado.seleccion.has(Number(art.dataset.numero));
    art.classList.toggle('seleccionado', sel);
    art.querySelector('input').checked = sel;
  });
  guardarJuegoActual();
  pintarPanelPdf();
}

function generar() {
  const cantidad = Math.floor(Number(el.cantidad.value));
  if (!Number.isFinite(cantidad) || cantidad < 1 || cantidad > MAX_TABLEROS) {
    avisar(`La cantidad debe estar entre 1 y ${MAX_TABLEROS}`);
    el.cantidad.focus();
    return;
  }
  const p = estado.prefs;
  p.cantidad = cantidad;
  p.semilla = el.semilla.value.trim();
  guardarPrefs();

  const semilla = (p.semilla || semillaAleatoria()).toUpperCase();
  const posicionDoble = p.dobles ? p.posicionDoble : null;
  const { tableros, estadisticas } = generarTableros({ cantidad, tamano: p.tamano, semilla, posicionDoble });

  estado.juego = {
    id: `${Date.now()}`,
    tamano: p.tamano,
    posicionDoble,
    generados: cantidad,
    semilla,
    tableros,
    estadisticas,
    creado: new Date().toISOString(),
  };
  estado.seleccion = new Set();
  estado.visibles = POR_PAGINA;
  guardarJuegoActual();
  pintarTableros();
  avisar(`${cantidad} tableros ${p.tamano}×${p.tamano} generados`);
}

// ── PDF ─────────────────────────────────────────────────────────────────────
// Devuelve true si el trabajo terminó bien
async function conOcupado(etiqueta, fn, mensajeError = 'Error al crear el PDF') {
  if (estado.ocupado) return false;
  estado.ocupado = true;
  pintarPanelPdf();
  avisar(etiqueta, 60000);
  try {
    await fn();
    el.aviso.classList.remove('visible');
    return true;
  } catch (err) {
    console.error(err);
    avisar(`${mensajeError}: ${err.message}`, 5000);
    return false;
  } finally {
    estado.ocupado = false;
    pintarPanelPdf();
  }
}

function opcionesPdf(extra = {}) {
  const p = estado.prefs;
  return {
    papel: p.papel,
    formato: p.formato,
    lineasCorte: p.lineasCorte,
    mostrarPie: p.mostrarPie,
    semilla: estado.juego.semilla,
    alProgresar: (x) => avisar(`Creando PDF… ${Math.round(x * 100)}%`, 60000),
    ...extra,
  };
}

// Abre el PDF en una pestaña nueva; la ventana se abre antes del trabajo asíncrono
// para que el navegador no la bloquee como ventana emergente.
async function abrirPdf(crear) {
  if (estado.ocupado) return;
  const ventana = window.open('', '_blank');
  const ok = await conOcupado('Creando PDF…', async () => {
    const doc = await crear();
    const url = doc.output('bloburl');
    if (ventana) ventana.location.href = url;
    else window.open(url, '_blank');
  });
  if (!ok) ventana?.close();
}

function pdfSeleccion(accion) {
  const tableros = tablerosAImprimir();
  if (!tableros.length) return;
  const crear = () => crearPdfTableros(tableros, opcionesPdf());
  if (accion === 'ver') return abrirPdf(crear);
  const { tamano, posicionDoble } = estado.juego;
  const partes = [`${tableros.length}-tableros-${tamano}x${tamano}`, posicionDoble && 'dobles', estado.prefs.formato];
  conOcupado('Creando PDF…', async () => {
    const doc = await crear();
    doc.save(nombreArchivo(partes.filter(Boolean).join('-')));
  });
}

function pdfUnTablero(numero) {
  const tablero = estado.juego.tableros.find((t) => t.numero === numero);
  if (!tablero) return;
  abrirPdf(() => crearPdfTableros([tablero], opcionesPdf({ formato: 'grande', alProgresar: null })));
}

// ── Imágenes de las cartas ──────────────────────────────────────────────────
function pintarPanelImagenes() {
  pintarRespaldo();
  const fuente = imagenes.fuenteImagenes();
  el.panelImagenes.hidden = fuente === 'incluidas';
  if (fuente === 'incluidas') return;

  const faltan = imagenes.cartasSinImagen();
  const tiene = 54 - faltan.length;
  el.panelImagenes.classList.toggle('atencion', faltan.length > 0);
  el.btnBorrarImagenes.hidden = tiene === 0;

  if (tiene === 0) {
    el.estadoImagenes.innerHTML =
      'Esta página no incluye imágenes. Elige la carpeta con tus <b>54 cartas</b>; cada archivo debe empezar con el número de la carta ' +
      '(<i>1 el gallo.jpg</i>, <i>2 el diablito.jpg</i>…). Se guardan solo en este navegador y no se suben a internet. ' +
      'Mientras tanto, los tableros usan cartas provisionales con número y nombre.';
  } else if (faltan.length) {
    el.estadoImagenes.innerHTML = `<b>${tiene} de 54</b> cartas cargadas. Faltan: ${faltan.join(', ')}. Puedes agregar solo las que faltan.`;
  } else {
    el.estadoImagenes.innerHTML = '✅ <b>54 de 54</b> cartas cargadas en este navegador. Puedes reemplazar cualquiera eligiéndola de nuevo.';
  }
}

async function cargarImagenesDesde(input) {
  const archivos = [...input.files];
  input.value = '';
  if (!archivos.length || estado.ocupado) return;
  estado.ocupado = true;
  pintarPanelPdf();
  try {
    const r = await imagenes.cargarArchivos(archivos, (x) => avisar(`Procesando imágenes… ${Math.round(x * 100)}%`, 60000));
    pintarPanelImagenes();
    pintarTableros();
    const partes = [`${r.cargadas} cartas cargadas`];
    if (r.ignorados) partes.push(`${r.ignorados} archivos ignorados (su nombre no empieza con un número del 1 al 54)`);
    if (r.errores.length) partes.push(`no se pudieron leer: ${r.errores.join(', ')}`);
    if (r.bajaResolucion.length) partes.push(`baja resolución: ${r.bajaResolucion.join(', ')}`);
    avisar(partes.join(' · '), 6000);
  } catch (err) {
    console.error(err);
    avisar(`Error al cargar las imágenes: ${err.message}`, 5000);
  } finally {
    estado.ocupado = false;
    pintarPanelPdf();
  }
}

// ── Simulador ───────────────────────────────────────────────────────────────
const formatoNumero = (x, decimales = 0) =>
  x.toLocaleString('es-MX', { minimumFractionDigits: decimales, maximumFractionDigits: decimales });
const numeroTablero = (n) => `Nº ${String(n).padStart(3, '0')}`;

// Partidas mínimas para que cada tablero gane ~20 veces en promedio (lo que pide la prueba estadística)
const partidasRecomendadas = (tableros) => JUGADAS.find((j) => j / tableros >= 20);

function pintarAyudaSimulacion() {
  const B = estado.juego?.tableros.length ?? 0;
  el.btnSimular.disabled = B < 2 || estado.ocupado;
  if (B < 2) {
    el.ayudaSimulacion.textContent = B ? 'Se necesitan al menos 2 tableros para simular.' : 'Primero genera los tableros.';
    return;
  }
  const recomendado = partidasRecomendadas(B);
  const base = `Se juegan ${formatoNumero(estado.prefs.jugadas)} partidas con los ${B} tableros; gana el primero que completa.`;
  el.ayudaSimulacion.textContent = recomendado
    ? `${base} Para ${B} tableros se recomiendan al menos ${formatoNumero(recomendado)} partidas.`
    : `${base} Con tantos tableros, incluso 10,000 partidas dan pocas victorias por tablero.`;
}

function simulacionVigente() {
  const sim = estado.juego?.simulacion;
  return sim && sim.tableros.length === estado.juego.tableros.length ? sim : null;
}

function veredicto(sim) {
  const recomendado = partidasRecomendadas(sim.tableros.length);
  if (!sim.muestraSuficiente) {
    return {
      icono: 'ℹ️',
      texto: `<b>Pocas partidas para sacar conclusiones.</b> Cada tablero ganó en promedio ${formatoNumero(sim.esperado, 1)} veces, así que las diferencias pueden ser puro azar.` +
        (recomendado ? ` Simula ${formatoNumero(recomendado)} partidas o más para comprobar si hay tableros con ventaja.` : ''),
    };
  }
  // Umbral estricto (1 %) para no alarmar por casualidad: con 5 % una de cada 20 simulaciones "fallaría" sola
  if (sim.valorP >= 0.01) {
    return {
      icono: '✅',
      texto: `<b>Los tableros están parejos.</b> La diferencia entre el que más gana y el que menos es la normal del azar (p = ${formatoNumero(sim.valorP, 2)}). Ningún tablero tiene ventaja real.`,
    };
  }
  return {
    icono: '⚠️',
    texto: `<b>Hay diferencias mayores a las del azar</b> (p = ${formatoNumero(sim.valorP, 3)}). Algunos tableros ganan más de lo esperado; puedes generar otro juego con un código distinto y volver a simular.`,
  };
}

function pintarSimulacion() {
  const sim = simulacionVigente();
  el.simulacion.hidden = !sim || !!estado.juego.simulacionOculta;
  if (!sim) return;

  const orden = sim.tableros.map((numero, i) => ({ numero, victorias: sim.victorias[i], empates: sim.empates[i] }))
    .sort((a, b) => b.victorias - a.victorias || a.numero - b.numero);
  const primero = orden[0];
  const empatadosPrimero = orden.filter((x) => x.victorias === primero.victorias);
  const max = primero.victorias || 1;
  const pct = (v) => `${formatoNumero((v / sim.jugadas) * 100, 1)}%`;
  const visibles = estado.verTodaLaSimulacion ? orden : orden.slice(0, 10);
  const v = veredicto(sim);

  const nombresGanador = empatadosPrimero.length > 1
    ? `${empatadosPrimero.map((x) => numeroTablero(x.numero)).join(', ')}`
    : numeroTablero(primero.numero);

  el.simulacion.innerHTML = `
    <div class="sim-cabecera">
      <h2>Resultado de ${formatoNumero(sim.jugadas)} partidas · ${MODOS[sim.modo].nombre}</h2>
      <button type="button" class="sim-cerrar" data-sim="ocultar">Ocultar ✕</button>
    </div>

    <div class="sim-ganador">
      <div class="trofeo" aria-hidden="true">🏆</div>
      <div class="texto">
        <small>${empatadosPrimero.length > 1 ? 'Tableros más ganadores (empatados)' : 'Tablero más ganador'}</small>
        <b>${nombresGanador}</b>
        <span>ganó ${formatoNumero(primero.victorias)} de ${formatoNumero(sim.jugadas)} partidas (${pct(primero.victorias)})</span>
      </div>
      <button type="button" class="btn-chico destacado" data-ir="${primero.numero}">Ver tablero</button>
    </div>

    <div class="sim-cifras">
      <div><small>Victorias esperadas por tablero</small><b>${formatoNumero(sim.esperado, 1)}</b></div>
      <div><small>Menos ganador</small><b>${formatoNumero(orden[orden.length - 1].victorias)}</b></div>
      <div><small>Cartas cantadas por partida</small><b>${formatoNumero(sim.promedioCartas, 1)}</b></div>
      <div><small>Partidas con empate</small><b>${pct(sim.partidasEmpatadas)}</b></div>
    </div>

    <div class="sim-veredicto"><span class="icono-v" aria-hidden="true">${v.icono}</span><span>${v.texto}</span></div>

    <div class="sim-grafica">
      <div class="sim-grafica-titulo">
        <span>Victorias por tablero${orden.length > 10 ? (estado.verTodaLaSimulacion ? ' (todos)' : ' (los 10 que más ganaron)') : ''}</span>
        <span class="clave"><i></i> promedio esperado</span>
      </div>
      ${visibles.map((x, i) => `
        <button type="button" class="sim-fila${x.victorias === primero.victorias ? ' primero' : ''}" data-ir="${x.numero}"
          title="${numeroTablero(x.numero)}: ${formatoNumero(x.victorias)} victorias (${pct(x.victorias)}), ${formatoNumero(x.empates)} compartidas en empate">
          <span class="num">${numeroTablero(x.numero)}</span>
          <span class="sim-pista">
            <span class="sim-barra" style="width:${(x.victorias / max) * 100}%"></span>
            <span class="sim-esperado" style="left:${Math.min(100, (sim.esperado / max) * 100)}%"></span>
          </span>
          <span class="valor"><b>${formatoNumero(x.victorias)}</b> · ${pct(x.victorias)}</span>
        </button>`).join('')}
      ${orden.length > 10 ? `<button type="button" class="btn-chico sim-mas" data-sim="todos">${estado.verTodaLaSimulacion ? 'Ver solo los 10 primeros' : `Ver los ${orden.length} tableros`}</button>` : ''}
    </div>`;
}

async function simularPartidas() {
  const juego = estado.juego;
  if (!juego || juego.tableros.length < 2) return;
  const { jugadas, modo } = estado.prefs;
  const ok = await conOcupado('Simulando partidas…', async () => {
    const resultado = await simular(juego.tableros, {
      jugadas,
      modo,
      semilla: juego.semilla,
      alProgresar: (x) => avisar(`Simulando partidas… ${Math.round(x * 100)}%`, 60000),
    });
    juego.simulacion = resultado;
    juego.simulacionOculta = false;
  }, 'Error en la simulación');
  if (!ok) return;
  estado.verTodaLaSimulacion = false;
  guardarJuegoActual();
  pintarTableros();
  el.simulacion.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function irATablero(numero) {
  if (numero > estado.visibles) mostrarMasTableros(Math.ceil((numero - estado.visibles) / POR_PAGINA) * POR_PAGINA);
  const art = el.tableros.querySelector(`.tablero[data-numero="${numero}"]`);
  if (!art) return;
  art.scrollIntoView({ behavior: 'smooth', block: 'center' });
  art.classList.remove('resaltar');
  void art.offsetWidth; // reinicia la animación
  art.classList.add('resaltar');
}

// ── Respaldo ────────────────────────────────────────────────────────────────
function pintarRespaldo() {
  const cuantas = imagenes.imagenesGuardadas();
  const incluidas = imagenes.fuenteImagenes() === 'incluidas';
  el.respaldoImagenes.disabled = cuantas === 0;
  if (cuantas === 0) el.respaldoImagenes.checked = false;
  el.respaldoImagenesNota.textContent = incluidas
    ? '(esta copia usa las imágenes incluidas; no hace falta respaldarlas)'
    : cuantas ? `(${cuantas} cartas, aumenta el tamaño del archivo)` : '(no hay imágenes cargadas)';
}

async function descargarRespaldo() {
  if (estado.ocupado) return;
  await conOcupado('Preparando respaldo…', async () => {
    const conImagenes = el.respaldoImagenes.checked;
    const respaldo = crearRespaldo(almacen.leerTodo(), conImagenes ? await imagenes.exportarImagenes() : null, __APP_VERSION__);
    const blob = new Blob([JSON.stringify(respaldo)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `loteria-respaldo-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }, 'Error al crear el respaldo');
}

async function restaurarRespaldo(archivo) {
  if (!archivo || estado.ocupado) return;
  let respaldo;
  try {
    respaldo = validarRespaldo(JSON.parse(await archivo.text()));
  } catch (err) {
    avisar(err instanceof SyntaxError ? 'El archivo no es un respaldo válido.' : err.message, 5000);
    return;
  }

  const cuantasImagenes = Object.keys(respaldo.imagenes ?? {}).length;
  const juegos = respaldo.datos.juegos?.length ?? 0;
  const resumen = [`${juegos} juegos guardados`, cuantasImagenes ? `${cuantasImagenes} imágenes de cartas` : null].filter(Boolean).join(' y ');
  if (!window.confirm(`Respaldo del ${new Date(respaldo.fecha).toLocaleString('es-MX')} con ${resumen}.\n\nSe agregarán a lo que ya tienes, sin borrar nada. ¿Continuar?`)) return;
  const reemplazarActual = traeDatosActuales(respaldo.datos) &&
    window.confirm('¿Reemplazar también el juego actual, las preferencias y la partida del cantador por los del respaldo?\n\nAceptar = reemplazar · Cancelar = conservar los tuyos');

  await conOcupado('Restaurando respaldo…', async () => {
    const { datos } = combinarDatos(almacen.leerTodo(), respaldo.datos, { reemplazarActual });
    if (!almacen.escribirTodo(datos)) throw new Error('no hay espacio suficiente en el navegador');
    if (cuantasImagenes && imagenes.fuenteImagenes() !== 'incluidas') await imagenes.importarImagenes(respaldo.imagenes);
  }, 'Error al restaurar');
  // Se recarga para que todas las vistas lean los datos restaurados
  location.reload();
}

// ── Juegos guardados ────────────────────────────────────────────────────────
function pintarJuegosGuardados() {
  const juegos = almacen.listarJuegos();
  if (!juegos.length) {
    el.listaJuegos.innerHTML = '<li class="sin-juegos">Aún no hay juegos guardados.</li>';
    return;
  }
  el.listaJuegos.innerHTML = juegos.map((j) => {
    const fecha = new Date(j.creado).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
    return `
      <li data-id="${escapar(j.id)}">
        <div class="info">
          <b title="${escapar(j.nombre)}">${escapar(j.nombre)}</b>
          <small>${j.tableros.length} × ${j.tamano}×${j.tamano}${j.posicionDoble ? ' dobles' : ''} · ${escapar(j.semilla)} · ${fecha}</small>
        </div>
        <button type="button" data-accion="cargar">Abrir</button>
        <button type="button" data-accion="borrar" class="borrar" aria-label="Borrar">✕</button>
      </li>`;
  }).join('');
}

function guardarJuegoEnLista() {
  if (!estado.juego) return;
  const { tableros, tamano, posicionDoble } = estado.juego;
  const sugerido = estado.juego.nombre || `${tableros.length} tableros ${tamano}×${tamano}${posicionDoble ? ' dobles' : ''}`;
  const nombre = window.prompt('Nombre para este juego:', sugerido);
  if (nombre === null) return;
  estado.juego.nombre = nombre.trim() || sugerido;
  const ok = almacen.guardarJuego({ ...estado.juego, seleccion: [...estado.seleccion] });
  guardarJuegoActual();
  pintarJuegosGuardados();
  avisar(ok ? 'Juego guardado en este navegador' : 'No se pudo guardar (almacenamiento lleno o bloqueado)');
}

function cargarJuego(id) {
  const juego = almacen.listarJuegos().find((j) => j.id === id);
  if (!juego) return;
  estado.juego = juego;
  estado.seleccion = new Set(juego.seleccion || []);
  estado.visibles = POR_PAGINA;
  Object.assign(estado.prefs, { tamano: juego.tamano, cantidad: juego.tableros.length, semilla: juego.semilla, dobles: !!juego.posicionDoble });
  if (juego.posicionDoble) estado.prefs.posicionDoble = juego.posicionDoble;
  guardarPrefs();
  guardarJuegoActual();
  pintarFormulario();
  pintarTableros();
  avisar(`Juego "${juego.nombre}" abierto`);
}

// ── Eventos ─────────────────────────────────────────────────────────────────
function conectarEventos() {
  alElegir(el.tamano, (v) => { estado.prefs.tamano = Number(v); marcarSegmentado(el.tamano, v); pintarOpcionDoble(); guardarPrefs(); });
  alElegir(el.alcance, (v) => { estado.prefs.alcance = v; guardarPrefs(); pintarPanelPdf(); });
  el.btnDescargarRespaldo.addEventListener('click', descargarRespaldo);
  el.inputRespaldo.addEventListener('change', () => {
    const archivo = el.inputRespaldo.files[0];
    el.inputRespaldo.value = '';
    restaurarRespaldo(archivo);
  });
  el.inputCarpeta.addEventListener('change', () => cargarImagenesDesde(el.inputCarpeta));
  el.inputArchivos.addEventListener('change', () => cargarImagenesDesde(el.inputArchivos));
  el.btnBorrarImagenes.addEventListener('click', async () => {
    if (!window.confirm('¿Borrar las imágenes de las cartas guardadas en este navegador?')) return;
    await imagenes.borrarImagenes();
    pintarPanelImagenes();
    pintarTableros();
    avisar('Imágenes borradas de este navegador');
  });
  alElegir(el.jugadas, (v) => { estado.prefs.jugadas = Number(v); marcarSegmentado(el.jugadas, v); guardarPrefs(); pintarAyudaSimulacion(); });
  alElegir(el.modo, (v) => { estado.prefs.modo = v; marcarSegmentado(el.modo, v); guardarPrefs(); });
  el.btnSimular.addEventListener('click', simularPartidas);
  el.simulacion.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.ir) irATablero(Number(b.dataset.ir));
    else if (b.dataset.sim === 'todos') { estado.verTodaLaSimulacion = !estado.verTodaLaSimulacion; pintarSimulacion(); }
    else if (b.dataset.sim === 'ocultar') { estado.juego.simulacionOculta = true; guardarJuegoActual(); pintarSimulacion(); }
  });
  alElegir(el.formato, (v) => { estado.prefs.formato = v; marcarSegmentado(el.formato, v); guardarPrefs(); pintarPanelPdf(); });

  el.dobles.addEventListener('change', () => { estado.prefs.dobles = el.dobles.checked; pintarOpcionDoble(); guardarPrefs(); });
  el.posicionDoble.addEventListener('change', () => { estado.prefs.posicionDoble = el.posicionDoble.value; pintarOpcionDoble(); guardarPrefs(); });

  el.papel.addEventListener('change', () => { estado.prefs.papel = el.papel.value; guardarPrefs(); pintarPanelPdf(); });
  el.lineasCorte.addEventListener('change', () => { estado.prefs.lineasCorte = el.lineasCorte.checked; guardarPrefs(); });
  el.mostrarPie.addEventListener('change', () => { estado.prefs.mostrarPie = el.mostrarPie.checked; guardarPrefs(); });

  el.btnSemilla.addEventListener('click', () => { el.semilla.value = semillaAleatoria(); });
  el.btnGenerar.addEventListener('click', generar);
  [el.cantidad, el.semilla].forEach((input) =>
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') generar(); }));

  el.btnVerPdf.addEventListener('click', () => pdfSeleccion('ver'));
  el.btnDescargarPdf.addEventListener('click', () => pdfSeleccion('descargar'));
  el.btnBaraja.addEventListener('click', () =>
    conOcupado('Creando PDF de las 54 cartas…', async () => (await crearPdfBaraja(estado.prefs.papel)).save('loteria-54-cartas.pdf')));

  el.tableros.addEventListener('change', (e) => {
    if (e.target.type !== 'checkbox') return;
    const numero = Number(e.target.closest('.tablero').dataset.numero);
    if (e.target.checked) estado.seleccion.add(numero);
    else estado.seleccion.delete(numero);
    if (estado.seleccion.size === 1 && e.target.checked) estado.prefs.alcance = 'seleccion';
    actualizarSeleccionVisual();
  });
  el.tableros.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-pdf]');
    if (b) pdfUnTablero(Number(b.dataset.pdf));
    const x = e.target.closest('button[data-eliminar]');
    if (x) eliminarUnTablero(Number(x.dataset.eliminar));
    if (e.target.closest('button[data-agregar]')) agregarUnTablero();
    const c = e.target.closest('button[data-compartir]');
    if (c) abrirCompartir(estado.juego, Number(c.dataset.compartir));
  });

  el.masTableros.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-mas]');
    if (b) mostrarMasTableros(b.dataset.mas === 'todos' ? Infinity : POR_PAGINA);
    if (e.target.closest('button[data-agregar]')) agregarUnTablero();
  });
  el.btnSelTodos.addEventListener('click', () => {
    estado.seleccion = new Set(estado.juego.tableros.map((t) => t.numero));
    estado.prefs.alcance = 'seleccion';
    actualizarSeleccionVisual();
  });
  el.btnSelNinguno.addEventListener('click', () => { estado.seleccion.clear(); actualizarSeleccionVisual(); });
  el.btnGuardar.addEventListener('click', guardarJuegoEnLista);
  el.btnCompartirSeleccion.addEventListener('click', () => {
    const numeros = estado.juego.tableros.map((t) => t.numero).filter((n) => estado.seleccion.has(n));
    if (numeros.length) abrirCompartir(estado.juego, numeros);
  });

  el.listaJuegos.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-accion]');
    if (!b) return;
    const id = b.closest('li').dataset.id;
    if (b.dataset.accion === 'cargar') cargarJuego(id);
    else if (window.confirm('¿Borrar este juego guardado?')) {
      almacen.eliminarJuego(id);
      pintarJuegosGuardados();
    }
  });
}

// ── Versión (la inyecta vite.config.js al compilar) ─────────────────────────
function pintarVersion() {
  const fecha = new Date(__APP_FECHA__).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  const partes = [`<b>v${__APP_VERSION__}</b>`, __APP_COMMIT__, fecha].filter(Boolean);
  const version = document.getElementById('version');
  version.innerHTML = partes.join(' · ');
  version.title = `Versión ${__APP_VERSION__}${__APP_COMMIT__ ? `, commit ${__APP_COMMIT__}` : ''}, compilada el ${new Date(__APP_FECHA__).toLocaleString('es-MX')}`;
}

// ── Inicio ──────────────────────────────────────────────────────────────────
el.papel.innerHTML = Object.entries(PAPELES).map(([k, v]) => `<option value="${k}">${v.nombre}</option>`).join('');
el.cantidad.max = MAX_TABLEROS;
pintarVersion();
pintarFormulario();
pintarJuegosGuardados();
conectarEventos();
iniciarCantador();
iniciarJugador(avisar);
iniciarCompartir();
registrarVista('tableros');
registrarVista('cantar', vistaCantar);
registrarVista('jugar', vistaJugar);
iniciarRutas();
iniciarPwa(avisar);
// Los tableros se pintan cuando se sabe de dónde salen las imágenes (incluidas, guardadas o ninguna)
imagenes.iniciarImagenes().finally(() => {
  pintarPanelImagenes();
  pintarTableros();
  refrescarCantador();
  refrescarJugador();
});
