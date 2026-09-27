// Links para jugar tableros en el celular. No hace falta servidor: el link lleva el código del juego
// y los parámetros con los que se generó, y el celular vuelve a generar exactamente los mismos tableros.
// Un link puede llevar uno o varios tableros: t=7 o t=3,7,12.
import { generarTableros, TAMANOS, MAX_TABLEROS } from './generador.js';
import { POSICIONES_DOBLE, POSICION_ALEATORIA, indicesDoble } from './posiciones.js';
import { tablerosGenerados } from './juego.js';

const POSICIONES_VALIDAS = new Set([...POSICIONES_DOBLE.map((p) => p.id), POSICION_ALEATORIA]);

/** Máximo de tableros que una persona puede jugar a la vez. */
export const MAX_TABLEROS_JUGADOR = 12;

const lista = (numeros) => (Array.isArray(numeros) ? numeros : [numeros]);

/** Parámetros del link para uno o varios tableros de un juego. */
export function parametrosTablero(juego, numeros) {
  // k = tableros generados con el código (incluye eliminados), así el número del tablero siempre coincide
  const p = new URLSearchParams({ c: juego.semilla, n: juego.tamano, k: tablerosGenerados(juego), t: lista(numeros).join(',') });
  if (juego.posicionDoble) p.set('d', juego.posicionDoble);
  return p;
}

/** Link completo: base es la dirección de la app (sin #). */
export function enlaceTablero(juego, numeros, base) {
  return `${base}#/jugar?${parametrosTablero(juego, numeros)}`;
}

/** Lee y valida los parámetros de un link. Devuelve null si no son válidos. */
export function leerParametros(parametros) {
  const semilla = (parametros.get('c') || '').trim();
  const tamano = Number(parametros.get('n'));
  const cantidad = Number(parametros.get('k'));
  const texto = (parametros.get('t') || '').split(',').filter(Boolean);
  const numeros = [...new Set(texto.map(Number))];
  const posicionDoble = parametros.get('d') || null;

  if (!semilla || semilla.length > 40) return null;
  if (!TAMANOS.includes(tamano)) return null;
  if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > MAX_TABLEROS) return null;
  if (!numeros.length || numeros.length > MAX_TABLEROS_JUGADOR) return null;
  if (numeros.some((n) => !Number.isInteger(n) || n < 1 || n > cantidad)) return null;
  if (posicionDoble && (!POSICIONES_VALIDAS.has(posicionDoble) ||
    (posicionDoble !== POSICION_ALEATORIA && !indicesDoble(posicionDoble, tamano)))) return null;

  return { semilla, tamano, cantidad, numeros, numero: numeros[0], posicionDoble };
}

/** Vuelve a generar el juego del link. Devuelve un Map número → tablero con los tableros pedidos. */
export function tablerosDesdeParametros(datos, numeros = datos.numeros ?? [datos.numero]) {
  const { tableros } = generarTableros({
    cantidad: Math.max(datos.cantidad, ...numeros),
    tamano: datos.tamano,
    semilla: datos.semilla,
    posicionDoble: datos.posicionDoble,
  });
  return new Map(numeros.map((n) => [n, tableros[n - 1]]));
}

/** Un solo tablero (el primero del link). */
export const tableroDesdeParametros = (datos) => tablerosDesdeParametros(datos, [datos.numero]).get(datos.numero);

/**
 * Clave de un tablero compartido (para guardar las marcas del jugador). No incluye la cantidad:
 * el generador es estable por prefijo, así que el tablero Nº n es el mismo aunque el juego crezca.
 */
export const claveTablero = (d, numero = d.numero) => [d.semilla, d.tamano, d.posicionDoble ?? '-', numero].join('|');

/** Clave que usaba la versión 1.3–1.6 (incluía la cantidad); se usa para no perder marcas guardadas. */
export const claveTableroAnterior = (d, numero = d.numero) => [d.semilla, d.tamano, d.cantidad, d.posicionDoble ?? '-', numero].join('|');
