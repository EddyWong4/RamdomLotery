// Las ilustraciones del kit salen de la baraja libre (src/baraja-libre.js): una sola fuente para la app, el kit y la descarga.
import { ilustracion, dibujarCarta } from '../src/baraja-libre.js';

// Cartas que protagonizan las diapositivas, en el orden que usa promo.js
const DESTACADAS = [46, 23, 27, 35, 39, 50, 28, 5, 43, 52];

export const ILUSTRACIONES = DESTACADAS.map(ilustracion);
export { dibujarCarta };
