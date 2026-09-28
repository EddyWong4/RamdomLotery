// Editor para crear o cambiar un tablero a mano: se toca una casilla y después la carta que va en ella.
import { t as tr } from './i18n.js';
import { CARTAS, cartaPorId } from './cartas.js';
import * as imagenes from './imagenes.js';
import { validarCartas, completarAlAzar, normalizarFavorito, nuevoIdFavorito } from './favoritos.js';

const $ = (sel) => document.querySelector(sel);
const escapar = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
// Sin acentos ni mayúsculas, para buscar "arbol" y encontrar "El Árbol"
const simple = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

let el;
let estado = null; // { id, nombre, n, cartas: (id|null)[], sel: índice, alGuardar }

function miniatura(id) {
  const url = imagenes.urlMiniatura(id);
  const c = cartaPorId(id);
  return url
    ? `<img src="${url}" alt="" loading="lazy">`
    : `<span class="carta-vacia"><b>${id}</b><span>${escapar(c.nombre)}</span></span>`;
}

function siguienteVacia(desde) {
  const { cartas } = estado;
  for (let k = 1; k <= cartas.length; k++) {
    const i = (desde + k) % cartas.length;
    if (cartas[i] == null) return i;
  }
  return desde;
}

function pintarTablero() {
  const { n, cartas, sel } = estado;
  const v = validarCartas(cartas, n);
  el.tablero.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
  el.tablero.innerHTML = cartas.map((id, i) => {
    const clases = ['editor-casilla', i === sel ? 'seleccionada' : '', id == null ? 'vacia' : '', id != null && id === v.doble?.carta ? 'doble' : ''].filter(Boolean).join(' ');
    const etiqueta = id == null ? tr('Casilla {n}, vacía', { n: i + 1 }) : tr('Casilla {n}: {c}', { n: i + 1, c: cartaPorId(id).nombre });
    return `<button type="button" class="${clases}" data-i="${i}" aria-label="${escapar(etiqueta)}" aria-pressed="${i === sel}">${id == null ? '<span class="mas">+</span>' : miniatura(id)}</button>`;
  }).join('');

  el.estado.classList.toggle('ok', v.ok);
  el.estado.textContent = v.ok
    ? tr('Listo para guardar') + (v.doble ? tr(' · tablero doble ({c})', { c: cartaPorId(v.doble.carta).nombre }) : '')
    : tr(v.error);
  el.guardar.disabled = !v.ok;
  el.quitar.disabled = cartas[sel] == null;
}

function pintarCartas() {
  const filtro = simple(el.buscar.value.trim());
  const veces = new Map();
  estado.cartas.forEach((c) => c != null && veces.set(c, (veces.get(c) ?? 0) + 1));
  el.cartas.innerHTML = CARTAS
    .filter((c) => !filtro || String(c.id) === filtro || simple(c.nombre).includes(filtro))
    .map((c) => {
      const usada = veces.get(c.id) ?? 0;
      return `<button type="button" class="editor-carta${usada ? ' usada' : ''}" data-carta="${c.id}" ${usada >= 2 ? 'disabled' : ''}
        title="${c.id}. ${escapar(c.nombre)}${usada ? tr(usada === 1 ? ' (ya está una vez)' : ' (ya está dos veces)') : ''}">
        ${miniatura(c.id)}${usada ? `<span class="veces">${usada}</span>` : ''}</button>`;
    }).join('') || '<p class="ayuda">Ninguna carta coincide.</p>';
}

// En pantalla grande: elige cuántas columnas dejan las 54 cartas lo más grandes posible sin salirse del espacio
// (ancho y alto disponibles), para que se vean todas sin desplazarse y sin desperdiciar espacio.
const PROPORCION = 1292 / 2048;
const ESPACIO = 8;
export function mejoresColumnas(ancho, alto, cantidad = CARTAS.length, minimo = 6, maximo = 16) {
  let mejor = { columnas: maximo, ancho: 0 };
  for (let c = minimo; c <= maximo; c++) {
    const w = (ancho - (c - 1) * ESPACIO) / c;
    const filas = Math.ceil(cantidad / c);
    const altoTotal = filas * (w / PROPORCION) + (filas - 1) * ESPACIO;
    if (altoTotal <= alto && w > mejor.ancho) mejor = { columnas: c, ancho: w };
  }
  return mejor.ancho ? mejor.columnas : maximo;
}

function ajustarColumnas() {
  if (!el.dialogo.open || !window.matchMedia('(min-width: 761px)').matches) {
    el.cartas.style.gridTemplateColumns = '';
    return;
  }
  const alto = parseFloat(getComputedStyle(el.cartas).maxHeight) || el.cartas.clientHeight;
  const ancho = el.cartas.clientWidth - 8; // relleno interior
  el.cartas.style.gridTemplateColumns = `repeat(${mejoresColumnas(ancho, alto - 4)}, minmax(0, 1fr))`;
}

function pintar() {
  el.nombre.value = estado.nombre;
  el.tamano.querySelectorAll('button').forEach((b) => b.classList.toggle('activo', Number(b.dataset.valor) === estado.n));
  pintarTablero();
  pintarCartas();
}

function ponerCarta(id) {
  estado.cartas[estado.sel] = id;
  estado.sel = siguienteVacia(estado.sel);
  pintarTablero();
  pintarCartas();
}

function cambiarTamano(n) {
  if (n === estado.n) return;
  const puestas = estado.cartas.filter((c) => c != null);
  if (puestas.length > n * n && !window.confirm(tr('El tablero {n}×{n} tiene {c} casillas: se quitarán {q} cartas. ¿Continuar?', { n, c: n * n, q: puestas.length - n * n }))) return;
  estado.n = n;
  estado.cartas = Array.from({ length: n * n }, (_, i) => puestas[i] ?? null);
  estado.sel = estado.cartas.indexOf(null) === -1 ? 0 : estado.cartas.indexOf(null);
  pintar();
}

function guardar() {
  const nombre = el.nombre.value.trim();
  const favorito = normalizarFavorito({
    id: estado.id,
    nombre: nombre || 'Tablero a mano',
    tamano: estado.n,
    cartas: estado.cartas,
    origen: 'manual',
    creado: estado.creado,
  });
  if (!favorito) return;
  el.dialogo.close();
  estado.alGuardar(favorito);
}

export function iniciarEditor() {
  el = {
    dialogo: $('#dialogo-editor'),
    titulo: $('#editor-titulo'),
    nombre: $('#editor-nombre'),
    tamano: $('#editor-tamano'),
    tablero: $('#editor-tablero'),
    estado: $('#editor-estado'),
    azar: $('#editor-azar'),
    quitar: $('#editor-quitar'),
    vaciar: $('#editor-vaciar'),
    buscar: $('#editor-buscar'),
    cartas: $('#editor-cartas'),
    cancelar: $('#editor-cancelar'),
    guardar: $('#editor-guardar'),
  };
  el.tablero.addEventListener('click', (e) => {
    const b = e.target.closest('[data-i]');
    if (!b) return;
    estado.sel = Number(b.dataset.i);
    pintarTablero();
  });
  el.cartas.addEventListener('click', (e) => {
    const b = e.target.closest('[data-carta]');
    if (b && !b.disabled) ponerCarta(Number(b.dataset.carta));
  });
  el.tamano.addEventListener('click', (e) => {
    const b = e.target.closest('[data-valor]');
    if (b) cambiarTamano(Number(b.dataset.valor));
  });
  el.buscar.addEventListener('input', pintarCartas);
  el.buscar.addEventListener('keydown', (e) => {
    // Enter pone la primera carta de la búsqueda
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const primera = el.cartas.querySelector('[data-carta]:not([disabled])');
    if (primera) {
      ponerCarta(Number(primera.dataset.carta));
      el.buscar.select();
    }
  });
  el.nombre.addEventListener('input', () => (estado.nombre = el.nombre.value));
  el.azar.addEventListener('click', () => {
    estado.cartas = completarAlAzar(estado.cartas);
    pintarTablero();
    pintarCartas();
  });
  el.quitar.addEventListener('click', () => {
    estado.cartas[estado.sel] = null;
    pintarTablero();
    pintarCartas();
  });
  el.vaciar.addEventListener('click', () => {
    if (estado.cartas.some((c) => c != null) && !window.confirm('¿Quitar todas las cartas del tablero?')) return;
    estado.cartas = estado.cartas.map(() => null);
    estado.sel = 0;
    pintarTablero();
    pintarCartas();
  });
  el.cancelar.addEventListener('click', () => el.dialogo.close());
  window.addEventListener('resize', ajustarColumnas);
  el.guardar.addEventListener('click', guardar);
}

/**
 * Abre el editor. Con `favorito` lo edita (conserva su id); sin él crea uno nuevo.
 * `alGuardar(favorito)` recibe el tablero ya validado.
 */
export function abrirEditor({ favorito = null, tamano = 4, nombreSugerido = '', alGuardar }) {
  const n = favorito?.tamano ?? tamano;
  estado = {
    id: favorito?.id ?? nuevoIdFavorito(),
    creado: favorito?.creado,
    nombre: favorito?.nombre ?? nombreSugerido,
    n,
    cartas: favorito ? [...favorito.cartas] : Array(n * n).fill(null),
    sel: 0,
    alGuardar,
  };
  el.titulo.textContent = favorito ? 'Editar tablero' : 'Crear tablero a mano';
  el.guardar.textContent = favorito ? 'Guardar cambios' : 'Guardar en favoritos';
  el.buscar.value = '';
  pintar();
  el.dialogo.showModal();
  ajustarColumnas();
}
