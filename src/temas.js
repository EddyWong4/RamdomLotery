// Temas de color de la app. Los colores están en src/temas.css; aquí la lista, aplicar y recordar el elegido.
import * as almacen from './almacen.js';

export const TEMAS = [
  { id: 'clasico', nombre: 'Clásico', descripcion: 'Café, dorado y rojo', claro: false, meta: '#2d1206', muestra: ['#2d1206', '#f9c74f', '#dc2f3f', '#fffaf0'] },
  { id: 'talavera', nombre: 'Talavera', descripcion: 'Blanco, azul cobalto y ocre', claro: true, meta: '#f3f6fb', muestra: ['#f3f6fb', '#1e40af', '#b45309', '#ffffff'] },
  { id: 'cempasuchil', nombre: 'Cempasúchil', descripcion: 'Morado noche, naranja y rosa mexicano', claro: false, meta: '#1c0f2e', muestra: ['#1c0f2e', '#ff9f1c', '#d81e84', '#fff8ef'] },
  { id: 'mesa', nombre: 'Mesa de juego', descripcion: 'Verde fieltro, dorado y rojo', claro: false, meta: '#0f2a1d', muestra: ['#0f2a1d', '#e9c46a', '#d62828', '#fdfbf4'] },
  { id: 'papel-picado', nombre: 'Papel picado', descripcion: 'Crema rosado, rosa mexicano y turquesa', claro: true, meta: '#fff4f7', muestra: ['#fff4f7', '#d6246e', '#0e7c86', '#ffffff'] },
];

export const TEMA_PREDETERMINADO = 'clasico';

export const temaPorId = (id) => TEMAS.find((t) => t.id === id) ?? TEMAS[0];

/** Pone el tema en la página (y el color de la barra del navegador / barra de estado del celular). */
export function aplicarTema(id, doc = document) {
  const tema = temaPorId(id);
  doc.documentElement.dataset.tema = tema.id;
  const meta = doc.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', tema.meta);
  return tema;
}

export const temaGuardado = () => temaPorId(almacen.cargarTema()).id;

/** Fondo decorativo del tema (dibujo de fondo): encendido por defecto; se puede apagar para un fondo liso. */
export function aplicarFondo(activo, doc = document) {
  if (activo) delete doc.documentElement.dataset.fondo;
  else doc.documentElement.dataset.fondo = 'no';
}

export const fondoGuardado = () => almacen.cargarFondoDecorativo() !== false;

export function elegirFondo(activo) {
  aplicarFondo(activo);
  almacen.guardarFondoDecorativo(activo);
}

export function elegirTema(id) {
  const tema = aplicarTema(id);
  almacen.guardarTema(tema.id);
  return tema;
}
