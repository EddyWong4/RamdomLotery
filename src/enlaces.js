// Links para jugar un tablero en el celular. No hace falta servidor: el link lleva el código del juego
// y los parámetros con los que se generó, y el celular vuelve a generar exactamente el mismo tablero.
import { generarTableros, TAMANOS, MAX_TABLEROS } from './generador.js';
import { POSICIONES_DOBLE, POSICION_ALEATORIA, indicesDoble } from './posiciones.js';

const POSICIONES_VALIDAS = new Set([...POSICIONES_DOBLE.map((p) => p.id), POSICION_ALEATORIA]);

/** Parámetros del link para el tablero `numero` de un juego. */
export function parametrosTablero(juego, numero) {
  const p = new URLSearchParams({ c: juego.semilla, n: juego.tamano, k: juego.tableros.length, t: numero });
  if (juego.posicionDoble) p.set('d', juego.posicionDoble);
  return p;
}

/** Link completo: base es la dirección de la app (sin #). */
export function enlaceTablero(juego, numero, base) {
  return `${base}#/jugar?${parametrosTablero(juego, numero)}`;
}

/** Lee y valida los parámetros de un link. Devuelve null si no son válidos. */
export function leerParametros(parametros) {
  const semilla = (parametros.get('c') || '').trim();
  const tamano = Number(parametros.get('n'));
  const cantidad = Number(parametros.get('k'));
  const numero = Number(parametros.get('t'));
  const posicionDoble = parametros.get('d') || null;

  if (!semilla || semilla.length > 40) return null;
  if (!TAMANOS.includes(tamano)) return null;
  if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > MAX_TABLEROS) return null;
  if (!Number.isInteger(numero) || numero < 1 || numero > cantidad) return null;
  if (posicionDoble && (!POSICIONES_VALIDAS.has(posicionDoble) ||
    (posicionDoble !== POSICION_ALEATORIA && !indicesDoble(posicionDoble, tamano)))) return null;

  return { semilla, tamano, cantidad, numero, posicionDoble };
}

/** Vuelve a generar el juego del link y devuelve el tablero pedido. */
export function tableroDesdeParametros(datos) {
  const { tableros } = generarTableros({
    cantidad: datos.cantidad,
    tamano: datos.tamano,
    semilla: datos.semilla,
    posicionDoble: datos.posicionDoble,
  });
  return tableros[datos.numero - 1];
}

/** Clave única de un tablero compartido (para guardar las marcas del jugador). */
export const claveTablero = (d) => [d.semilla, d.tamano, d.cantidad, d.posicionDoble ?? '-', d.numero].join('|');
