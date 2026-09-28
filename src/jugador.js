// Vista "Jugar": uno o varios tableros en la pantalla del celular, abiertos desde un link.
// Se marca tocando las cartas, con la ficha elegida en el panel de fichas.
import { cartaPorId } from './cartas.js';
import * as almacen from './almacen.js';
import * as imagenes from './imagenes.js';
import { nombrePosicion } from './posiciones.js';
import { svgFicha } from './fichas.js';
import * as misFichas from './mis-fichas.js';
import { iniciarPanelFichas } from './panel-fichas.js';
import { canto } from './cantador.js';
import { cartasCantadas, cartaActual, terminada } from './partida.js';
import { MODOS, verificarTablero, normalizarModo } from './reglas.js';
import { t as tr } from './i18n.js';
import {
  leerParametros, tablerosDesdeParametros, claveTablero, claveTableroAnterior, firmaJuego, parametrosTablerosManuales, MAX_TABLEROS_JUGADOR,
} from './enlaces.js';

const $ = (sel) => document.querySelector(sel);
const escapar = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const numeroTablero = (n) => `Nº ${String(n).padStart(3, '0')}`;

let el;
let avisar = () => {};
let prefs;
// { datos, numeros: [n], tableros: Map n → tablero, marcas: Map n → Set<índice> }
let actual = null;
let activa = false; // la vista Jugar está en pantalla
let pagina = 0; // con varios tableros se muestran por páginas, sin desplazarse

function cargarMarcas(datos, numero) {
  const nuevas = almacen.cargarMarcas(claveTablero(datos, numero));
  return new Set(nuevas.length ? nuevas : almacen.cargarMarcas(claveTableroAnterior(datos, numero)));
}

function guardarMarcas(numero) {
  almacen.guardarMarcas(claveTablero(actual.datos, numero), [...actual.marcas.get(numero)].sort((a, b) => a - b));
}

// El link refleja los tableros en juego, así al recargar o compartir se conservan
function actualizarUrl() {
  const { datos, numeros } = actual;
  let p;
  if (datos.manual) {
    p = parametrosTablerosManuales(numeros.map((n) => actual.tableros.get(n)));
  } else {
    p = new URLSearchParams({ c: datos.semilla, n: datos.tamano, k: datos.cantidad, t: numeros.join(',') });
    if (datos.posicionDoble) p.set('d', datos.posicionDoble);
  }
  history.replaceState(null, '', `#/jugar?${p}`);
  recordarUltimoJugar(`#/jugar?${p}`);
}

// ── Pintado ──────────────────────────────────────────────────────────────────
function htmlCasilla(numero, id, i, marcada, ficha, cantada = false) {
  const c = cartaPorId(id);
  const url = imagenes.urlMiniatura(id);
  const carta = url ? `<img src="${url}" alt="">` : `<div class="carta-vacia"><b>${id}</b><span>${escapar(c.nombre)}</span></div>`;
  return `<button type="button" class="jugar-casilla${marcada ? ' marcada' : ''}${cantada ? ' cantada' : ''}" data-numero="${numero}" data-i="${i}"
    aria-pressed="${marcada}" aria-label="${id}. ${escapar(c.nombre)}${marcada ? tr(', marcada') : ''}">${carta}<span class="ficha-capa">${marcada ? svgFicha(ficha) : ''}</span></button>`;
}

function pintarDetalle() {
  const { datos, numeros, tableros, marcas } = actual;
  const total = [...marcas.values()].reduce((s, m) => s + m.size, 0);
  el.titulo.textContent = numeros.length === 1 ? tr('Tablero {n}', { n: numeroTablero(numeros[0]) }) : tr('Mis {n} tableros', { n: numeros.length });
  const doble = datos.manual
    ? ([...tableros.values()].some((t) => t.doble) ? tr('con carta doble') : null)
    : datos.posicionDoble
    ? tr('doble: {p}', { p: tr(nombrePosicion(datos.posicionDoble === 'aleatoria' ? 'aleatoria' : tableros.get(numeros[0])?.doble?.posicion ?? datos.posicionDoble)).toLowerCase() })
    : null;
  el.detalle.textContent = [`${datos.tamano}×${datos.tamano}`, doble, datos.manual ? tr('tableros favoritos') : tr('juego {c}', { c: datos.semilla }), tr('{n} marcadas', { n: total })].filter(Boolean).join(' · ');
  // Sin código de juego no se pueden pedir otros tableros por número
  el.agregar.hidden = !!datos.manual;
  el.agregarNumero.max = datos.cantidad;
  el.btnAgregar.disabled = numeros.length >= MAX_TABLEROS_JUGADOR;
}

function pintar() {
  if (!actual) return;
  // La distribución (con o sin cantador) debe estar lista antes de medir cuántos tableros caben
  document.querySelector('.jugar').classList.toggle('con-canto', cantoVisible());
  const { datos, numeros, tableros, marcas } = actual;
  const ficha = misFichas.fichaActiva();
  const salieron = cartasSalidas();
  const cuantos = porPagina();
  const paginas = Math.ceil(numeros.length / cuantos);
  pagina = Math.min(Math.max(0, pagina), paginas - 1);
  const enPagina = numeros.slice(pagina * cuantos, (pagina + 1) * cuantos);
  el.tableros.dataset.cantidad = enPagina.length;
  el.tableros.dataset.porPagina = cuantos;
  el.tableros.toggleAttribute('data-paginado', paginas > 1);
  el.tableros.innerHTML = htmlPaginas(paginas, cuantos) + enPagina.map((numero) => {
    const t = tableros.get(numero);
    const m = marcas.get(numero);
    return `
      <section class="jugar-tablero-caja" data-caja="${numero}">
        <header>
          <b>${numeroTablero(numero)}</b>
          <span class="ayuda" data-cuenta="${numero}">${tr('{n} marcadas', { n: m.size })}</span>
          <span class="loteria-aviso" data-loteria hidden>🎉 ¡Lotería!</span>
          ${numeros.length > 1 ? `<button type="button" class="btn-chico" data-quitar="${numero}" aria-label="${tr('Dejar de jugar el tablero {n}', { n: numeroTablero(numero) })}">✕</button>` : ''}
        </header>
        <div class="jugar-tablero" style="grid-template-columns:repeat(${datos.tamano},1fr)">
          ${t.cartas.map((id, i) => htmlCasilla(numero, id, i, m.has(i), ficha, salieron.has(id))).join('')}
        </div>
      </section>`;
  }).join('');
  pintarDetalle();
  pintarCanto();
  revisarGanadores();
  ultimoPorPagina = cuantos;

  const sinImagenes = imagenes.cartasSinImagen().length === 54;
  el.ayuda.textContent = tr('Toca una carta cuando la canten para ponerle tu ficha. Tócala otra vez para quitarla.') +
    (sinImagenes ? ' ' + tr('Las cartas se ven como número y nombre; para verlas con imagen, cárgalas en la sección Tableros de este navegador.') : '');
}

// Solo actualiza las fichas (sin volver a pintar las imágenes)
function pintarMarcas(numeros = actual.numeros) {
  const ficha = svgFicha(misFichas.fichaActiva());
  for (const numero of numeros) {
    const m = actual.marcas.get(numero);
    el.tableros.querySelectorAll(`.jugar-casilla[data-numero="${numero}"]`).forEach((b) => {
      const marcada = m.has(Number(b.dataset.i));
      b.classList.toggle('marcada', marcada);
      b.setAttribute('aria-pressed', marcada);
      b.querySelector('.ficha-capa').innerHTML = marcada ? ficha : '';
    });
    const cuenta = el.tableros.querySelector(`[data-cuenta="${numero}"]`);
    if (cuenta) cuenta.textContent = tr('{n} marcadas', { n: m.size });
  }
  pintarDetalle();
  revisarGanadores();
}

// ── Cantar desde la vista Jugar ──────────────────────────────────────────────
// Usa la misma partida que la vista Cantar: se puede empezar en una y seguir en la otra.
const cantoVisible = () => !!prefs.cantarAqui;
const cartasSalidas = () => (cantoVisible() ? new Set(cartasCantadas(canto.partida())) : new Set());

function pintarCanto() {
  el.canto.hidden = !cantoVisible();
  el.btnCantar.setAttribute('aria-pressed', cantoVisible());
  el.btnCantar.classList.toggle('activo', cantoVisible());
  document.querySelector('.jugar').classList.toggle('con-canto', cantoVisible());
  if (!cantoVisible()) return;

  const p = canto.partida();
  const id = cartaActual(p);
  const c = id ? cartaPorId(id) : null;
  el.cantoProgreso.textContent = tr('Carta {n} de {t}', { n: p.cantadas, t: p.orden.length });
  if (!c) {
    el.cantoCarta.innerHTML = '<div class="canto-inicio">¡Corre y se va!<small>Toca para cantar la primera carta</small></div>';
  } else {
    const url = imagenes.urlImagen(id);
    el.cantoCarta.innerHTML = url
      ? `<img src="${url}" alt="${escapar(c.nombre)}">`
      : `<div class="carta-vacia"><b>${id}</b><span>${escapar(c.nombre)}</span></div>`;
  }
  el.cantoCarta.classList.toggle('terminada', terminada(p));
  el.cantoNombre.textContent = c ? `${id}. ${c.nombre}` : '';
  el.cantoAnterior.disabled = p.cantadas === 0;
  el.cantoSiguiente.disabled = terminada(p);
  el.cantoSiguiente.querySelector('span').textContent = p.cantadas === 0 ? 'Empezar' : terminada(p) ? 'Se cantaron todas' : 'Siguiente';
  const auto = canto.automatico();
  el.cantoAuto.setAttribute('aria-pressed', auto);
  el.cantoAuto.title = auto ? 'Pausar' : 'Automático';
  el.cantoAuto.setAttribute('aria-label', auto ? 'Pausar el modo automático' : 'Cantar automáticamente');
  const pc = canto.prefs();
  el.cantoVoz.setAttribute('aria-pressed', !!pc.voz);
  el.cantoVoz.disabled = !('speechSynthesis' in window);
  el.cantoSonidos.setAttribute('aria-pressed', !!pc.sonidos);
  el.cantoMarcar.setAttribute('aria-pressed', !!prefs.marcarSolas);
  el.cantoIntervalo.value = String(pc.intervalo);
  const modo = normalizarModo(pc.modo);
  el.cantoModo.querySelectorAll('button').forEach((b) => b.classList.toggle('activo', b.dataset.valor === modo));

  // Todas las cartas que ya pasaron, en orden; la tira se desplaza para mostrar la más reciente
  const pasadas = cartasCantadas(p);
  el.cantoCuenta.textContent = pasadas.length ? `(${pasadas.length})` : '';
  el.cantoRecientes.innerHTML = pasadas.map((x, i) => {
    const u = imagenes.urlMiniatura(x);
    const n = escapar(cartaPorId(x).nombre);
    const clase = i === pasadas.length - 1 ? ' class="actual"' : '';
    return u
      ? `<img${clase} src="${u}" alt="${n}" title="${i + 1}. ${n}">`
      : `<span${clase} title="${i + 1}. ${n}"><b>${x}</b></span>`;
  }).join('');
  el.cantoRecientes.scrollLeft = el.cantoRecientes.scrollWidth;
}

// ── ¡Lotería! ────────────────────────────────────────────────────────────────
// Con el cantador abierto, cada tablero se revisa con la forma de ganar elegida.
// Solo cuentan las fichas puestas en cartas que ya salieron.
let ganadoresPrevios = new Set();

function revisarGanadores() {
  const ganadores = new Set();
  const visible = cantoVisible();
  const modo = normalizarModo(canto.prefs().modo);
  const salieron = cartasSalidas();
  for (const numero of actual.numeros) {
    const caja = el.tableros.querySelector(`[data-caja="${numero}"]`);
    let r = null;
    if (visible) {
      const t = actual.tableros.get(numero);
      const fichas = [...actual.marcas.get(numero)].map((i) => t.cartas[i]).filter((id) => salieron.has(id));
      r = verificarTablero(t.cartas, fichas, modo);
    }
    const gano = !!r?.gano;
    if (gano) ganadores.add(numero);
    el.tableros.querySelector(`[data-ir="${numero}"]`)?.classList.toggle('gano', gano);
    if (!caja) continue; // está en otra página: solo se marca su botón
    caja.classList.toggle('gano', gano);
    const ganadoras = new Set(gano ? r.ganadoras : []);
    caja.querySelectorAll('.jugar-casilla').forEach((b) => b.classList.toggle('ganadora', ganadoras.has(Number(b.dataset.i))));
    const aviso = caja.querySelector('[data-loteria]');
    if (aviso) aviso.hidden = !gano;
  }
  const nuevos = [...ganadores].filter((n) => !ganadoresPrevios.has(n));
  if (nuevos.length) {
    avisar(`🎉 ${tr('¡Lotería!')} ${nuevos.map(numeroTablero).join(', ')} · ${tr(MODOS[modo].nombre).toLowerCase()}`, 5000);
    if (canto.automatico()) canto.detener();
  }
  ganadoresPrevios = ganadores;
}

// Resalta en los tableros las cartas que ya salieron (sin volver a pintar las imágenes)
function pintarCantadas() {
  const salieron = cartasSalidas();
  el.tableros.querySelectorAll('.jugar-casilla').forEach((b) => {
    const id = actual.tableros.get(Number(b.dataset.numero)).cartas[Number(b.dataset.i)];
    b.classList.toggle('cantada', salieron.has(id));
  });
}

// Con "Marcar solas", la carta cantada se marca en todos los tableros donde aparece
function marcarCartaCantada(id) {
  const afectados = [];
  for (const n of actual.numeros) {
    const m = actual.marcas.get(n);
    let cambio = false;
    actual.tableros.get(n).cartas.forEach((otra, i) => {
      if (otra === id && !m.has(i)) { m.add(i); cambio = true; }
    });
    if (cambio) { guardarMarcas(n); afectados.push(n); }
  }
  if (afectados.length) pintarMarcas(afectados);
}

function alCambiarCanto({ avanzo }) {
  if (!activa || !actual || !cantoVisible()) return;
  pintarCanto();
  pintarCantadas();
  revisarGanadores();
  if (avanzo && prefs.marcarSolas) marcarCartaCantada(cartaActual(canto.partida()));
}

// En computadora, la mesa de juego (cantador + tableros) ocupa la pantalla: se lleva a la vista
function enfocarMesa() {
  if (cantoVisible() && window.matchMedia('(min-width: 861px)').matches) {
    // Después de que la ruta regrese la página arriba
    setTimeout(() => document.querySelector('.jugar-mesa')?.scrollIntoView({ block: 'start' }), 0);
  }
}

function alternarCanto(visible = !cantoVisible()) {
  prefs.cantarAqui = visible;
  almacen.guardarPreferenciasJugador(prefs);
  if (!visible) canto.detener();
  // Cambia el espacio para los tableros: se vuelve a calcular cuántos caben por página
  const primero = actual.numeros[pagina * (ultimoPorPagina || 1)];
  document.querySelector('.jugar').classList.toggle('con-canto', visible);
  if (primero !== undefined) pagina = paginaDe(primero);
  pintar();
  enfocarMesa();
}

function nuevaPartidaCanto() {
  if (!canto.nuevaPartida()) return;
  const total = [...actual.marcas.values()].reduce((s, m) => s + m.size, 0);
  if (total && window.confirm('Partida nueva. ¿Quitar también las fichas de tus tableros?')) {
    for (const n of actual.numeros) { actual.marcas.get(n).clear(); guardarMarcas(n); }
    pintarMarcas();
  }
}

function alPresionarTecla(e) {
  if (!activa || !cantoVisible() || e.altKey || e.ctrlKey || e.metaKey) return;
  if (e.target.closest('input, select, textarea, button, summary')) return;
  if (e.key === ' ' || e.key === 'ArrowRight') { e.preventDefault(); canto.avanzar(); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); canto.retroceder(); }
}

// ── Páginas de tableros ──────────────────────────────────────────────────────
// Cuántos tableros caben lado a lado sin desplazarse: cada uno mide lo que permite el alto disponible
function porPagina() {
  if (!window.matchMedia('(min-width: 700px)').matches) return 1;
  const conMesa = cantoVisible() && window.matchMedia('(min-width: 861px)').matches;
  const ancho = el.tableros.clientWidth || window.innerWidth - 64;
  const alto = conMesa && el.tableros.clientHeight ? el.tableros.clientHeight : window.innerHeight - 60;
  const tablero = Math.min(640, (alto - 110) * 0.62);
  return Math.max(1, Math.min(3, Math.floor((ancho + 16) / (tablero + 16))));
}

function htmlPaginas(paginas, cuantos) {
  if (paginas <= 1) return '';
  const { numeros } = actual;
  const flecha = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
  const botones = numeros.map((n, i) => {
    const aqui = Math.floor(i / cuantos) === pagina;
    return `<button type="button" class="pagina-tablero${aqui ? ' actual' : ''}${ganadoresPrevios.has(n) ? ' gano' : ''}" data-ir="${n}"
      ${aqui ? 'aria-current="true"' : ''} title="${tr('Ir al tablero {n}', { n: numeroTablero(n) })}">${String(n).padStart(3, '0')}</button>`;
  }).join('');
  return `<nav class="jugar-paginas" aria-label="Páginas de tableros">
      <button type="button" class="btn-icono" data-pagina="-1" aria-label="Tableros anteriores" ${pagina === 0 ? 'disabled' : ''}>${flecha('M15 5 8 12l7 7')}</button>
      <div class="jugar-paginas-lista">${botones}</div>
      <span class="jugar-paginas-cuenta">${pagina + 1} / ${paginas}</span>
      <button type="button" class="btn-icono" data-pagina="1" aria-label="Tableros siguientes" ${pagina === paginas - 1 ? 'disabled' : ''}>${flecha('M9 5l7 7-7 7')}</button>
    </nav>`;
}

function irAPagina(nueva) {
  const paginas = Math.ceil(actual.numeros.length / porPagina());
  const destino = Math.min(Math.max(0, nueva), paginas - 1);
  if (destino === pagina) return;
  pagina = destino;
  pintar();
}

const paginaDe = (numero) => Math.floor(actual.numeros.indexOf(numero) / porPagina());

// Si cambia el tamaño de la ventana, cambia cuántos tableros caben: la página actual conserva su primer tablero
let ultimoPorPagina = 0;
function alCambiarTamano() {
  if (!activa || !actual) return;
  const cuantos = porPagina();
  if (cuantos === ultimoPorPagina) return;
  const primero = actual.numeros[pagina * ultimoPorPagina];
  ultimoPorPagina = cuantos;
  if (primero !== undefined) pagina = paginaDe(primero);
  pintar();
}

// ── Acciones ─────────────────────────────────────────────────────────────────
function alternar(numero, indice) {
  const id = actual.tableros.get(numero).cartas[indice];
  const marcar = !actual.marcas.get(numero).has(indice);
  // Con "marcar en todos", la carta se marca en cada tablero donde aparece; la carta doble marca sus dos casillas
  const afectados = prefs.marcarEnTodos ? actual.numeros : [numero];
  for (const n of afectados) {
    const m = actual.marcas.get(n);
    actual.tableros.get(n).cartas.forEach((otra, i) => {
      if (otra !== id) return;
      if (marcar) m.add(i);
      else m.delete(i);
    });
    guardarMarcas(n);
  }
  pintarMarcas(afectados);
}

function agregarTablero() {
  const numero = Number(el.agregarNumero.value);
  const { datos, numeros } = actual;
  if (!Number.isInteger(numero) || numero < 1 || numero > datos.cantidad) {
    avisar(tr('Escribe un número de tablero entre 1 y {n}', { n: datos.cantidad }));
    return;
  }
  if (numeros.includes(numero)) {
    avisar(tr('Ya estás jugando el tablero {n}', { n: numeroTablero(numero) }));
    return;
  }
  if (numeros.length >= MAX_TABLEROS_JUGADOR) return;
  actual.tableros.set(numero, tablerosDesdeParametros(datos, [numero]).get(numero));
  actual.marcas.set(numero, cargarMarcas(datos, numero));
  actual.numeros = [...numeros, numero];
  el.agregarNumero.value = '';
  actualizarUrl();
  pagina = paginaDe(numero);
  pintar();
}

function quitarTablero(numero) {
  if (actual.numeros.length <= 1) return;
  if (actual.marcas.get(numero).size && !window.confirm(tr('¿Dejar de jugar el tablero {n}? Sus marcas se conservan si lo vuelves a agregar.', { n: numeroTablero(numero) }))) return;
  actual.numeros = actual.numeros.filter((n) => n !== numero);
  actual.tableros.delete(numero);
  actual.marcas.delete(numero);
  actualizarUrl();
  pintar();
}

function limpiar() {
  const total = [...actual.marcas.values()].reduce((s, m) => s + m.size, 0);
  if (!total || !window.confirm(tr(actual.numeros.length > 1 ? '¿Quitar todas las marcas de todos tus tableros?' : '¿Quitar todas las marcas de este tablero?'))) return;
  for (const n of actual.numeros) {
    actual.marcas.get(n).clear();
    guardarMarcas(n);
  }
  pintarMarcas();
}

// ── Inicio ───────────────────────────────────────────────────────────────────
// La pestaña "Jugar" (celular) aparece cuando ya se abrió un link de tableros y lleva al último
function recordarUltimoJugar(hash) {
  almacen.guardarUltimoJugar(hash);
  pintarPestanaJugar(hash);
}

function pintarPestanaJugar(hash = almacen.cargarUltimoJugar()) {
  const pestana = document.getElementById('pestana-jugar');
  if (!pestana) return;
  pestana.hidden = !hash;
  if (hash) pestana.href = hash;
}

export function iniciarJugador(funcionAvisar) {
  pintarPestanaJugar();
  avisar = funcionAvisar;
  el = {
    error: $('#jugar-error'),
    contenido: $('#jugar-contenido'),
    titulo: $('#jugar-titulo'),
    detalle: $('#jugar-detalle'),
    tableros: $('#jugar-tableros'),
    ayuda: $('#jugar-ayuda'),
    limpiar: $('#btn-limpiar-marcas'),
    agregarNumero: $('#jugar-agregar-numero'),
    agregar: $('.jugar-agregar'),
    btnAgregar: $('#btn-jugar-agregar'),
    marcarTodos: $('#marcar-todos'),
    btnCantar: $('#btn-cantar-aqui'),
    canto: $('#jugar-canto'),
    cantoProgreso: $('#canto-progreso'),
    cantoCarta: $('#canto-carta'),
    cantoNombre: $('#canto-nombre'),
    cantoAnterior: $('#canto-anterior'),
    cantoSiguiente: $('#canto-siguiente'),
    cantoAuto: $('#canto-auto'),
    cantoVoz: $('#canto-voz'),
    cantoSonidos: $('#canto-sonidos'),
    cantoMarcar: $('#canto-marcar'),
    cantoIntervalo: $('#canto-intervalo'),
    cantoRecientes: $('#canto-recientes'),
    cantoModo: $('#canto-modo'),
    cantoCuenta: $('#canto-cuenta'),
  };
  prefs = { marcarEnTodos: true, cantarAqui: false, marcarSolas: false, ...almacen.cargarPreferenciasJugador({}) };
  el.marcarTodos.checked = prefs.marcarEnTodos;

  el.tableros.addEventListener('click', (e) => {
    const flecha = e.target.closest('[data-pagina]');
    if (flecha) return irAPagina(pagina + Number(flecha.dataset.pagina));
    const ir = e.target.closest('[data-ir]');
    if (ir) return irAPagina(paginaDe(Number(ir.dataset.ir)));
    const q = e.target.closest('[data-quitar]');
    if (q) return quitarTablero(Number(q.dataset.quitar));
    const b = e.target.closest('.jugar-casilla');
    if (b && actual) alternar(Number(b.dataset.numero), Number(b.dataset.i));
  });
  el.limpiar.addEventListener('click', limpiar);
  el.btnAgregar.addEventListener('click', agregarTablero);
  el.agregarNumero.addEventListener('keydown', (e) => { if (e.key === 'Enter') agregarTablero(); });
  el.marcarTodos.addEventListener('change', () => {
    prefs.marcarEnTodos = el.marcarTodos.checked;
    almacen.guardarPreferenciasJugador(prefs);
  });

  el.btnCantar.addEventListener('click', () => alternarCanto());
  $('#canto-cerrar').addEventListener('click', () => alternarCanto(false));
  // En el celular las opciones se esconden para que el cantador fijo ocupe poco
  $('#canto-mas').addEventListener('click', (e) => {
    const abierto = el.canto.classList.toggle('con-opciones');
    e.currentTarget.setAttribute('aria-expanded', abierto);
  });
  el.cantoCarta.addEventListener('click', () => canto.avanzar());
  el.cantoCarta.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); canto.avanzar(); }
  });
  el.cantoSiguiente.addEventListener('click', () => canto.avanzar());
  el.cantoAnterior.addEventListener('click', () => canto.retroceder());
  el.cantoAuto.addEventListener('click', () => canto.alternarAuto());
  $('#canto-nueva').addEventListener('click', nuevaPartidaCanto);
  // Botones que se prenden y apagan (aria-pressed)
  const pulsado = (b) => b.getAttribute('aria-pressed') !== 'true';
  el.cantoVoz.addEventListener('click', () => { canto.cambiarPreferencia('voz', pulsado(el.cantoVoz)); pintarCanto(); });
  el.cantoSonidos.addEventListener('click', () => { canto.cambiarPreferencia('sonidos', pulsado(el.cantoSonidos)); pintarCanto(); });
  el.cantoMarcar.addEventListener('click', () => {
    prefs.marcarSolas = pulsado(el.cantoMarcar);
    almacen.guardarPreferenciasJugador(prefs);
    pintarCanto();
  });
  el.cantoIntervalo.addEventListener('change', () => canto.cambiarPreferencia('intervalo', Number(el.cantoIntervalo.value)));
  // Safari solo permite el audio después de un toque: cualquier clic en el cantador lo desbloquea (fase de captura)
  el.canto.addEventListener('click', () => canto.despertarAudio(), true);
  el.cantoModo.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-valor]');
    if (!b) return;
    ganadoresPrevios = new Set(); // con otra forma de ganar se vuelve a avisar
    canto.cambiarPreferencia('modo', b.dataset.valor);
    pintarCanto();
    revisarGanadores();
  });
  canto.alCambiar(alCambiarCanto);
  // Celular: deslizar a los lados cambia de página
  let toque = null;
  el.tableros.addEventListener('touchstart', (e) => { toque = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null; }, { passive: true });
  el.tableros.addEventListener('touchend', (e) => {
    if (!toque || !actual) return;
    const dx = e.changedTouches[0].clientX - toque.x;
    const dy = e.changedTouches[0].clientY - toque.y;
    toque = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) irAPagina(pagina + (dx < 0 ? 1 : -1));
  }, { passive: true });
  let esperaTamano = null;
  window.addEventListener('resize', () => { clearTimeout(esperaTamano); esperaTamano = setTimeout(alCambiarTamano, 150); });
  document.addEventListener('keydown', alPresionarTecla);

  iniciarPanelFichas(avisar);
  misFichas.alCambiar(() => actual && pintarMarcas());
}

export const vistaJugar = {
  alEntrar(parametros) {
    const datos = leerParametros(parametros);
    el.error.hidden = !!datos;
    el.contenido.hidden = !datos;
    if (!datos) {
      actual = null;
      return;
    }
    const mismoJuego = actual && firmaJuego(actual.datos) === firmaJuego(datos) &&
      actual.numeros.join(',') === datos.numeros.join(',');
    if (!mismoJuego) {
      const tableros = tablerosDesdeParametros(datos);
      actual = {
        datos,
        numeros: datos.numeros,
        tableros,
        marcas: new Map(datos.numeros.map((n) => [n, cargarMarcas(datos, n)])),
      };
    }
    recordarUltimoJugar(location.hash);
    activa = true;
    pintar();
    if (!mismoJuego) enfocarMesa();
  },
  alSalir() {
    activa = false;
    if (canto.automatico()) canto.detener();
  },
  titulo: 'Jugar',
};

export function refrescarJugador() {
  pintar();
}
