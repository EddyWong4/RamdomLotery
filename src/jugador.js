// Vista "Jugar": un tablero en la pantalla del celular, abierto desde un link. Se marca tocando las cartas.
import { cartaPorId } from './cartas.js';
import * as almacen from './almacen.js';
import * as imagenes from './imagenes.js';
import { nombrePosicion } from './posiciones.js';
import { leerParametros, tableroDesdeParametros, claveTablero } from './enlaces.js';

const $ = (sel) => document.querySelector(sel);
const escapar = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

let el;
let actual = null; // { datos, tablero, clave, marcas: Set<índice> }

function pintar() {
  if (!actual) return;
  const { datos, tablero, marcas } = actual;
  const n = datos.tamano;
  el.titulo.textContent = `Tablero Nº ${String(datos.numero).padStart(3, '0')}`;
  el.detalle.textContent = [
    `${n}×${n}`,
    datos.posicionDoble ? `doble: ${nombrePosicion(tablero.doble?.posicion ?? datos.posicionDoble).toLowerCase()}` : null,
    `juego ${datos.semilla}`,
    `${marcas.size} marcadas`,
  ].filter(Boolean).join(' · ');

  el.tablero.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
  el.tablero.innerHTML = tablero.cartas.map((id, i) => {
    const c = cartaPorId(id);
    const url = imagenes.urlMiniatura(id);
    const contenido = url
      ? `<img src="${url}" alt="">`
      : `<div class="carta-vacia"><b>${id}</b><span>${escapar(c.nombre)}</span></div>`;
    const marcada = marcas.has(i);
    return `<button type="button" class="jugar-casilla${marcada ? ' marcada' : ''}" data-i="${i}"
      aria-pressed="${marcada}" aria-label="${id}. ${escapar(c.nombre)}${marcada ? ', marcada' : ''}">${contenido}</button>`;
  }).join('');

  const sinImagenes = imagenes.cartasSinImagen().length === 54;
  el.ayuda.textContent = 'Toca una carta cuando la canten para ponerle un frijolito. Tócala otra vez para quitarlo.' +
    (sinImagenes ? ' Las cartas se ven como número y nombre; para verlas con imagen, cárgalas en la sección Tableros de este navegador.' : '');
}

function alternar(indice) {
  const id = actual.tablero.cartas[indice];
  const marcar = !actual.marcas.has(indice);
  // Con carta doble, al cantarla se marcan sus dos casillas
  actual.tablero.cartas.forEach((otra, i) => {
    if (otra !== id) return;
    if (marcar) actual.marcas.add(i);
    else actual.marcas.delete(i);
  });
  almacen.guardarMarcas(actual.clave, [...actual.marcas].sort((a, b) => a - b));
  // Solo se actualizan las casillas (sin redibujar las imágenes)
  el.tablero.querySelectorAll('[data-i]').forEach((b) => {
    const marcada = actual.marcas.has(Number(b.dataset.i));
    b.classList.toggle('marcada', marcada);
    b.setAttribute('aria-pressed', marcada);
  });
  el.detalle.textContent = el.detalle.textContent.replace(/\d+ marcadas$/, `${actual.marcas.size} marcadas`);
}

export function iniciarJugador() {
  el = {
    error: $('#jugar-error'),
    contenido: $('#jugar-contenido'),
    titulo: $('#jugar-titulo'),
    detalle: $('#jugar-detalle'),
    tablero: $('#jugar-tablero'),
    ayuda: $('#jugar-ayuda'),
    limpiar: $('#btn-limpiar-marcas'),
  };
  el.tablero.addEventListener('click', (e) => {
    const b = e.target.closest('[data-i]');
    if (b && actual) alternar(Number(b.dataset.i));
  });
  el.limpiar.addEventListener('click', () => {
    if (!actual?.marcas.size || !window.confirm('¿Quitar todas las marcas de este tablero?')) return;
    actual.marcas.clear();
    almacen.guardarMarcas(actual.clave, []);
    pintar();
  });
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
    const clave = claveTablero(datos);
    if (actual?.clave !== clave) {
      actual = { datos, clave, tablero: tableroDesdeParametros(datos), marcas: new Set(almacen.cargarMarcas(clave)) };
    }
    pintar();
  },
};

export function refrescarJugador() {
  pintar();
}
