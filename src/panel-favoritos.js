// Panel "Mis tableros favoritos": lista, crear a mano, editar, eliminar y usarlos como juego.
import { cartaPorId } from './cartas.js';
import * as almacen from './almacen.js';
import * as imagenes from './imagenes.js';
import {
  normalizarFavorito, favoritoDesdeTablero, juegoDesdeFavoritos, origenDeTablero, MAX_FAVORITOS,
} from './favoritos.js';
import { iniciarEditor, abrirEditor } from './editor-tablero.js';

const $ = (sel) => document.querySelector(sel);
const escapar = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

let el;
let favoritos = [];
const seleccion = new Set();
let ganchos = { avisar: () => {}, usarComoJuego: () => {}, alCambiar: () => {}, tamanoPreferido: () => 4 };

function guardar() {
  almacen.guardarFavoritos(favoritos);
  ganchos.alCambiar();
}

// ── Estrella en los tableros generados ─────────────────────────────────────
function buscar(juego, tablero) {
  if (tablero.favorito) return favoritos.find((f) => f.id === tablero.favorito);
  if (juego.manual) return null;
  const origen = origenDeTablero(juego, tablero);
  return favoritos.find((f) => f.origen === origen);
}

export const esFavorito = (juego, tablero) => !!buscar(juego, tablero);

/** Marca o desmarca un tablero como favorito. Devuelve true si quedó como favorito. */
export function alternarFavorito(juego, tablero) {
  const existente = buscar(juego, tablero);
  if (existente) {
    favoritos = favoritos.filter((f) => f !== existente);
    seleccion.delete(existente.id);
    guardar();
    pintarFavoritos();
    ganchos.avisar(`"${existente.nombre}" se quitó de favoritos`);
    return false;
  }
  if (favoritos.length >= MAX_FAVORITOS) {
    ganchos.avisar(`Se pueden guardar hasta ${MAX_FAVORITOS} favoritos`);
    return false;
  }
  const nuevo = favoritoDesdeTablero(juego, tablero);
  favoritos = [...favoritos, nuevo];
  guardar();
  pintarFavoritos();
  ganchos.avisar(`"${nuevo.nombre}" se agregó a favoritos`);
  return true;
}

// ── Lista ────────────────────────────────────────────────────────────────────
function miniTablero(f) {
  const celdas = f.cartas.map((id) => {
    const url = imagenes.urlMiniatura(id);
    return url ? `<img src="${url}" alt="" loading="lazy">` : `<i>${id}</i>`;
  }).join('');
  return `<span class="fav-mini" style="grid-template-columns:repeat(${f.tamano},1fr)" aria-hidden="true">${celdas}</span>`;
}

export function pintarFavoritos() {
  el.cuenta.textContent = favoritos.length ? `(${favoritos.length})` : '';
  el.acciones.hidden = favoritos.length === 0;
  if (!favoritos.length) {
    el.lista.innerHTML = '<li class="sin-favoritos">Todavía no tienes tableros favoritos.</li>';
    return;
  }
  el.lista.innerHTML = favoritos.map((f) => {
    const detalle = [`${f.tamano}×${f.tamano}`, f.doble ? `doble: ${cartaPorId(f.doble.carta).nombre}` : null, f.origen === 'manual' ? 'a mano' : 'de un juego']
      .filter(Boolean).join(' · ');
    return `
      <li data-fav="${escapar(f.id)}" class="${seleccion.has(f.id) ? 'seleccionado' : ''}">
        <label class="fav-elegir"><input type="checkbox" ${seleccion.has(f.id) ? 'checked' : ''} aria-label="Elegir ${escapar(f.nombre)}"></label>
        ${miniTablero(f)}
        <div class="info"><b title="${escapar(f.nombre)}">${escapar(f.nombre)}</b><small>${escapar(detalle)}</small></div>
        <button type="button" data-accion="editar" aria-label="Editar ${escapar(f.nombre)}" title="Editar">✎</button>
        <button type="button" data-accion="borrar" class="borrar" aria-label="Quitar ${escapar(f.nombre)} de favoritos" title="Quitar de favoritos">✕</button>
      </li>`;
  }).join('');
  const n = seleccion.size;
  el.usar.textContent = n ? `Usar ${n} como juego` : 'Usar como juego';
  el.usar.disabled = n === 0;
  el.seleccionar.textContent = n === favoritos.length ? 'Quitar selección' : 'Seleccionar todos';
}

function guardarDesdeEditor(favorito, esNuevo) {
  if (esNuevo) {
    if (favoritos.length >= MAX_FAVORITOS) return ganchos.avisar(`Se pueden guardar hasta ${MAX_FAVORITOS} favoritos`);
    favoritos = [...favoritos, favorito];
    seleccion.add(favorito.id);
  } else {
    // Si cambiaron las cartas de un tablero que venía de un juego, ya no es ese tablero: pasa a ser "a mano"
    favoritos = favoritos.map((f) => (f.id === favorito.id
      ? { ...favorito, origen: f.cartas.join('.') === favorito.cartas.join('.') ? f.origen : 'manual' }
      : f));
  }
  guardar();
  pintarFavoritos();
  ganchos.avisar(esNuevo ? `"${favorito.nombre}" se guardó en favoritos` : 'Cambios guardados');
}

function usarComoJuego() {
  const elegidos = favoritos.filter((f) => seleccion.has(f.id));
  try {
    ganchos.usarComoJuego(juegoDesdeFavoritos(elegidos));
  } catch (err) {
    ganchos.avisar(err.message, 4000);
  }
}

export function iniciarFavoritos(opciones) {
  ganchos = { ...ganchos, ...opciones };
  el = {
    cuenta: $('#favoritos-cuenta'),
    lista: $('#lista-favoritos'),
    acciones: $('#favoritos-acciones'),
    crear: $('#btn-crear-manual'),
    seleccionar: $('#btn-fav-seleccion'),
    usar: $('#btn-usar-favoritos'),
  };
  favoritos = (almacen.cargarFavoritos() || []).map(normalizarFavorito).filter(Boolean);
  iniciarEditor();

  el.crear.addEventListener('click', () => abrirEditor({
    tamano: ganchos.tamanoPreferido(),
    nombreSugerido: `Tablero a mano ${favoritos.filter((f) => f.origen === 'manual').length + 1}`,
    alGuardar: (f) => guardarDesdeEditor(f, true),
  }));
  el.lista.addEventListener('change', (e) => {
    const li = e.target.closest('[data-fav]');
    if (!li) return;
    if (e.target.checked) seleccion.add(li.dataset.fav);
    else seleccion.delete(li.dataset.fav);
    pintarFavoritos();
  });
  el.lista.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-accion]');
    if (!b) return;
    const f = favoritos.find((x) => x.id === b.closest('[data-fav]').dataset.fav);
    if (!f) return;
    if (b.dataset.accion === 'editar') {
      abrirEditor({ favorito: f, alGuardar: (nuevo) => guardarDesdeEditor(nuevo, false) });
    } else if (window.confirm(`¿Quitar "${f.nombre}" de favoritos?`)) {
      favoritos = favoritos.filter((x) => x !== f);
      seleccion.delete(f.id);
      guardar();
      pintarFavoritos();
    }
  });
  el.seleccionar.addEventListener('click', () => {
    if (seleccion.size === favoritos.length) seleccion.clear();
    else favoritos.forEach((f) => seleccion.add(f.id));
    pintarFavoritos();
  });
  el.usar.addEventListener('click', usarComoJuego);
  pintarFavoritos();
}
