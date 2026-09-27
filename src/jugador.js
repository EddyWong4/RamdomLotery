// Vista "Jugar": uno o varios tableros en la pantalla del celular, abiertos desde un link.
// Se marca tocando las cartas, con la ficha elegida en el panel de fichas.
import { cartaPorId } from './cartas.js';
import * as almacen from './almacen.js';
import * as imagenes from './imagenes.js';
import { nombrePosicion } from './posiciones.js';
import { svgFicha } from './fichas.js';
import * as misFichas from './mis-fichas.js';
import { iniciarPanelFichas } from './panel-fichas.js';
import {
  leerParametros, tablerosDesdeParametros, claveTablero, claveTableroAnterior, MAX_TABLEROS_JUGADOR,
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
  const p = new URLSearchParams({ c: datos.semilla, n: datos.tamano, k: datos.cantidad, t: numeros.join(',') });
  if (datos.posicionDoble) p.set('d', datos.posicionDoble);
  history.replaceState(null, '', `#/jugar?${p}`);
  recordarUltimoJugar(`#/jugar?${p}`);
}

// ── Pintado ──────────────────────────────────────────────────────────────────
function htmlCasilla(numero, id, i, marcada, ficha) {
  const c = cartaPorId(id);
  const url = imagenes.urlMiniatura(id);
  const carta = url ? `<img src="${url}" alt="">` : `<div class="carta-vacia"><b>${id}</b><span>${escapar(c.nombre)}</span></div>`;
  return `<button type="button" class="jugar-casilla${marcada ? ' marcada' : ''}" data-numero="${numero}" data-i="${i}"
    aria-pressed="${marcada}" aria-label="${id}. ${escapar(c.nombre)}${marcada ? ', marcada' : ''}">${carta}<span class="ficha-capa">${marcada ? svgFicha(ficha) : ''}</span></button>`;
}

function pintarDetalle() {
  const { datos, numeros, tableros, marcas } = actual;
  const total = [...marcas.values()].reduce((s, m) => s + m.size, 0);
  el.titulo.textContent = numeros.length === 1 ? `Tablero ${numeroTablero(numeros[0])}` : `Mis ${numeros.length} tableros`;
  const doble = datos.posicionDoble
    ? `doble: ${nombrePosicion(datos.posicionDoble === 'aleatoria' ? 'aleatoria' : tableros.get(numeros[0])?.doble?.posicion ?? datos.posicionDoble).toLowerCase()}`
    : null;
  el.detalle.textContent = [`${datos.tamano}×${datos.tamano}`, doble, `juego ${datos.semilla}`, `${total} marcadas`].filter(Boolean).join(' · ');
  el.agregarNumero.max = datos.cantidad;
  el.btnAgregar.disabled = numeros.length >= MAX_TABLEROS_JUGADOR;
}

function pintar() {
  if (!actual) return;
  const { datos, numeros, tableros, marcas } = actual;
  const ficha = misFichas.fichaActiva();
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
          ${t.cartas.map((id, i) => htmlCasilla(numero, id, i, m.has(i), ficha)).join('')}
        </div>
      </section>`;
  }).join('');
  pintarDetalle();

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
    btnAgregar: $('#btn-jugar-agregar'),
    marcarTodos: $('#marcar-todos'),
  };
  prefs = almacen.cargarPreferenciasJugador({ marcarEnTodos: true });
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
    const mismoJuego = actual && claveTablero(actual.datos, 0) === claveTablero(datos, 0) &&
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
    pintar();
  },
  titulo: 'Jugar',
};

export function refrescarJugador() {
  pintar();
}
