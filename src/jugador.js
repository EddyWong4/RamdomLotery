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
    aria-pressed="${marcada}" aria-label="${id}. ${escapar(c.nombre)}${marcada ? ', marcada' : ''}">${carta}<span class="ficha-capa">${marcada ? svgFicha(ficha) : ''}</span></button>`;
}

function pintarDetalle() {
  const { datos, numeros, tableros, marcas } = actual;
  const total = [...marcas.values()].reduce((s, m) => s + m.size, 0);
  el.titulo.textContent = numeros.length === 1 ? `Tablero ${numeroTablero(numeros[0])}` : `Mis ${numeros.length} tableros`;
  const doble = datos.manual
    ? ([...tableros.values()].some((t) => t.doble) ? 'con carta doble' : null)
    : datos.posicionDoble
    ? `doble: ${nombrePosicion(datos.posicionDoble === 'aleatoria' ? 'aleatoria' : tableros.get(numeros[0])?.doble?.posicion ?? datos.posicionDoble).toLowerCase()}`
    : null;
  el.detalle.textContent = [`${datos.tamano}×${datos.tamano}`, doble, datos.manual ? 'tableros favoritos' : `juego ${datos.semilla}`, `${total} marcadas`].filter(Boolean).join(' · ');
  // Sin código de juego no se pueden pedir otros tableros por número
  el.agregar.hidden = !!datos.manual;
  el.agregarNumero.max = datos.cantidad;
  el.btnAgregar.disabled = numeros.length >= MAX_TABLEROS_JUGADOR;
}

function pintar() {
  if (!actual) return;
  const { datos, numeros, tableros, marcas } = actual;
  const ficha = misFichas.fichaActiva();
  const salieron = cartasSalidas();
  el.tableros.dataset.cantidad = Math.min(numeros.length, 3);
  el.tableros.innerHTML = numeros.map((numero) => {
    const t = tableros.get(numero);
    const m = marcas.get(numero);
    return `
      <section class="jugar-tablero-caja" data-caja="${numero}">
        <header>
          <b>${numeroTablero(numero)}</b>
          <span class="ayuda" data-cuenta="${numero}">${m.size} marcadas</span>
          ${numeros.length > 1 ? `<button type="button" class="btn-chico" data-quitar="${numero}" aria-label="Dejar de jugar el tablero ${numeroTablero(numero)}">✕</button>` : ''}
        </header>
        <div class="jugar-tablero" style="grid-template-columns:repeat(${datos.tamano},1fr)">
          ${t.cartas.map((id, i) => htmlCasilla(numero, id, i, m.has(i), ficha, salieron.has(id))).join('')}
        </div>
      </section>`;
  }).join('');
  pintarDetalle();
  pintarCanto();

  const sinImagenes = imagenes.cartasSinImagen().length === 54;
  el.ayuda.textContent = 'Toca una carta cuando la canten para ponerle tu ficha. Tócala otra vez para quitarla.' +
    (sinImagenes ? ' Las cartas se ven como número y nombre; para verlas con imagen, cárgalas en la sección Tableros de este navegador.' : '');
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
    if (cuenta) cuenta.textContent = `${m.size} marcadas`;
  }
  pintarDetalle();
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
  el.cantoProgreso.textContent = `Carta ${p.cantadas} de ${p.orden.length}`;
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
  el.cantoSiguiente.textContent = p.cantadas === 0 ? 'Empezar ▶' : terminada(p) ? 'Se cantaron todas' : 'Siguiente ▶';
  el.cantoAuto.textContent = canto.automatico() ? '⏸ Pausar' : '▶ Automático';
  el.cantoAuto.classList.toggle('activo', canto.automatico());
  const pc = canto.prefs();
  el.cantoVoz.checked = pc.voz;
  el.cantoVoz.disabled = !('speechSynthesis' in window);
  el.cantoSonidos.checked = pc.sonidos;
  el.cantoMarcar.checked = !!prefs.marcarSolas;
  // Las 5 anteriores a la actual, de la más reciente a la más vieja
  const previas = cartasCantadas(p).slice(0, -1).slice(-5).reverse();
  el.cantoRecientes.innerHTML = previas.map((x) => {
    const u = imagenes.urlMiniatura(x);
    const n = escapar(cartaPorId(x).nombre);
    return u ? `<img src="${u}" alt="${n}" title="${x}. ${n}">` : `<span class="carta-vacia" title="${x}. ${n}"><b>${x}</b></span>`;
  }).join('');
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
  if (avanzo && prefs.marcarSolas) marcarCartaCantada(cartaActual(canto.partida()));
}

function alternarCanto(visible = !cantoVisible()) {
  prefs.cantarAqui = visible;
  almacen.guardarPreferenciasJugador(prefs);
  if (!visible) canto.detener();
  pintarCanto();
  pintarCantadas();
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
    avisar(`Escribe un número de tablero entre 1 y ${datos.cantidad}`);
    return;
  }
  if (numeros.includes(numero)) {
    avisar(`Ya estás jugando el tablero ${numeroTablero(numero)}`);
    return;
  }
  if (numeros.length >= MAX_TABLEROS_JUGADOR) return;
  actual.tableros.set(numero, tablerosDesdeParametros(datos, [numero]).get(numero));
  actual.marcas.set(numero, cargarMarcas(datos, numero));
  actual.numeros = [...numeros, numero];
  el.agregarNumero.value = '';
  actualizarUrl();
  pintar();
  el.tableros.querySelector(`[data-caja="${numero}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function quitarTablero(numero) {
  if (actual.numeros.length <= 1) return;
  if (actual.marcas.get(numero).size && !window.confirm(`¿Dejar de jugar el tablero ${numeroTablero(numero)}? Sus marcas se conservan si lo vuelves a agregar.`)) return;
  actual.numeros = actual.numeros.filter((n) => n !== numero);
  actual.tableros.delete(numero);
  actual.marcas.delete(numero);
  actualizarUrl();
  pintar();
}

function limpiar() {
  const total = [...actual.marcas.values()].reduce((s, m) => s + m.size, 0);
  const texto = actual.numeros.length > 1 ? 'de todos tus tableros' : 'de este tablero';
  if (!total || !window.confirm(`¿Quitar todas las marcas ${texto}?`)) return;
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
    cantoRecientes: $('#canto-recientes'),
  };
  prefs = { marcarEnTodos: true, cantarAqui: false, marcarSolas: false, ...almacen.cargarPreferenciasJugador({}) };
  el.marcarTodos.checked = prefs.marcarEnTodos;

  el.tableros.addEventListener('click', (e) => {
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
  el.cantoVoz.addEventListener('change', () => canto.cambiarPreferencia('voz', el.cantoVoz.checked));
  el.cantoSonidos.addEventListener('change', () => canto.cambiarPreferencia('sonidos', el.cantoSonidos.checked));
  el.cantoMarcar.addEventListener('change', () => {
    prefs.marcarSolas = el.cantoMarcar.checked;
    almacen.guardarPreferenciasJugador(prefs);
  });
  // Safari solo permite el audio después de un toque: cualquier clic en el cantador lo desbloquea (fase de captura)
  el.canto.addEventListener('click', () => canto.despertarAudio(), true);
  canto.alCambiar(alCambiarCanto);
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
