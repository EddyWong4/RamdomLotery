// Fichas del usuario: la lista guardada en el navegador y cuál está activa.
import * as almacen from './almacen.js';
import { TIPOS, fichasConPredeterminada, normalizarFicha, nuevoId, ID_PREDETERMINADA, combinarFichas } from './fichas.js';

let fichas = null;
const oyentes = new Set();

function asegurar() {
  if (!fichas) fichas = fichasConPredeterminada(almacen.cargarFichas());
  return fichas;
}

function guardar() {
  almacen.guardarFichas(fichas);
  oyentes.forEach((fn) => fn());
}

/** Avisa cuando cambian las fichas o la activa (para repintar las marcas). */
export const alCambiar = (fn) => oyentes.add(fn);

export const listaFichas = () => asegurar();

export function fichaActiva() {
  const id = almacen.cargarFichaActiva();
  return asegurar().find((f) => f.id === id) ?? asegurar().find((f) => f.id === ID_PREDETERMINADA) ?? asegurar()[0];
}

export function activar(id) {
  if (!asegurar().some((f) => f.id === id)) return;
  almacen.guardarFichaActiva(id);
  oyentes.forEach((fn) => fn());
}

/** Actualiza la ficha activa con los cambios dados; si el resultado no es válido no cambia nada. */
export function actualizarActiva(cambios) {
  const actual = fichaActiva();
  const nueva = normalizarFicha({ ...actual, ...cambios, id: actual.id });
  if (!nueva) return false;
  fichas = asegurar().map((f) => (f.id === actual.id ? nueva : f));
  guardar();
  return true;
}

/** Nombre libre para una ficha de ese tipo: "Estrella", "Estrella 2", "Estrella 3"… */
export function nombreDisponible(tipo, excluirId = null) {
  const base = TIPOS[tipo].nombre;
  const usados = new Set(asegurar().filter((f) => f.id !== excluirId).map((f) => f.nombre));
  if (!usados.has(base)) return base;
  let i = 2;
  while (usados.has(`${base} ${i}`)) i++;
  return `${base} ${i}`;
}

/** ¿El nombre es el automático de su tipo (y se puede cambiar solo al cambiar de tipo)? */
export const nombreAutomatico = (ficha) => new RegExp(`^${TIPOS[ficha.tipo].nombre.replace(/[()✓]/g, '\\$&')}( \\d+)?$`).test(ficha.nombre);

export function crearFicha() {
  const base = fichaActiva();
  const ficha = normalizarFicha({ ...base, id: nuevoId(), nombre: nombreDisponible(base.tipo) });
  fichas = [...asegurar(), ficha];
  almacen.guardarFichaActiva(ficha.id);
  guardar();
  return ficha;
}

/** La predeterminada no se puede eliminar (sí se puede cambiar su color). */
export function eliminarActiva() {
  const actual = fichaActiva();
  if (actual.id === ID_PREDETERMINADA) return false;
  fichas = asegurar().filter((f) => f.id !== actual.id);
  almacen.guardarFichaActiva(ID_PREDETERMINADA);
  guardar();
  return true;
}

export function importar(importadas) {
  const { fichas: todas, agregadas } = combinarFichas(asegurar(), importadas);
  fichas = todas;
  guardar();
  return agregadas;
}
