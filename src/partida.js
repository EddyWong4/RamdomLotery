// Partida del cantador: la baraja de 54 cartas en orden aleatorio (con semilla) y cuántas se han cantado.
// Funciones puras: cada operación devuelve una partida nueva, así se guarda y se deshace fácil.
import { TOTAL_CARTAS } from './cartas.js';
import { crearRng, semillaAleatoria } from './generador.js';

export function nuevaPartida(semilla = semillaAleatoria()) {
  const rng = crearRng(`${semilla}|cantar`);
  const orden = Array.from({ length: TOTAL_CARTAS }, (_, i) => i + 1);
  for (let i = orden.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [orden[i], orden[j]] = [orden[j], orden[i]];
  }
  return { semilla, orden, cantadas: 0, inicio: new Date().toISOString() };
}

export const siguiente = (p) => (p.cantadas < p.orden.length ? { ...p, cantadas: p.cantadas + 1 } : p);
export const anterior = (p) => (p.cantadas > 0 ? { ...p, cantadas: p.cantadas - 1 } : p);

/** Cartas ya cantadas, en el orden en que salieron. */
export const cartasCantadas = (p) => p.orden.slice(0, p.cantadas);
/** Carta que se acaba de cantar (o null si no ha empezado). */
export const cartaActual = (p) => (p.cantadas ? p.orden[p.cantadas - 1] : null);
export const terminada = (p) => p.cantadas >= p.orden.length;

/** Comprueba que una partida guardada tiene la forma esperada (datos viejos o alterados se descartan). */
export function esPartidaValida(p) {
  return !!p && Array.isArray(p.orden) && p.orden.length === TOTAL_CARTAS &&
    new Set(p.orden).size === TOTAL_CARTAS && Number.isInteger(p.cantadas) &&
    p.cantadas >= 0 && p.cantadas <= TOTAL_CARTAS;
}
