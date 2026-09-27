import { TOTAL_CARTAS } from './cartas.js';
import { POSICION_ALEATORIA, posicionesDisponibles, indicesDoble } from './posiciones.js';

export const TAMANOS = [2, 3, 4, 5];
export const MAX_TABLEROS = 500;

// Candidatos que se evalúan por cada tablero; se elige el que menos cartas comparte con los ya creados
const CANDIDATOS = 30;
// Aleatoriedad añadida al uso de cada carta: más alto = menos equilibrio, más variedad
const RUIDO = 1.5;

// ── Números aleatorios con semilla (misma semilla ⇒ mismos tableros) ─────────────
function hashTexto(texto) {
  let h = 1779033703 ^ texto.length;
  for (let i = 0; i < texto.length; i++) {
    h = Math.imul(h ^ texto.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

export function crearRng(semilla) {
  let a = hashTexto(String(semilla));
  return function mulberry32() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function semillaAleatoria() {
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (b) => letras[b % letras.length]).join('');
}

function barajar(lista, rng) {
  for (let i = lista.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [lista[i], lista[j]] = [lista[j], lista[i]];
  }
  return lista;
}

// ── Conjuntos de cartas como máscara de bits (54 bits en dos enteros de 32) ────
function mascara(cartas) {
  let lo = 0, hi = 0;
  for (const id of cartas) {
    if (id <= 32) lo |= 1 << (id - 1);
    else hi |= 1 << (id - 33);
  }
  return { lo: lo >>> 0, hi: hi >>> 0 };
}

function contarBits(x) {
  x -= (x >>> 1) & 0x55555555;
  x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
  return Math.imul((x + (x >>> 4)) & 0x0f0f0f0f, 0x01010101) >>> 24;
}

const enComun = (a, b) => contarBits(a.lo & b.lo) + contarBits(a.hi & b.hi);

// Elige k cartas prefiriendo las menos usadas, con algo de azar para que no sea predecible
function elegirCartas(k, uso, rng) {
  const ids = [];
  for (let id = 1; id <= TOTAL_CARTAS; id++) ids.push({ id, peso: uso[id] + rng() * RUIDO });
  ids.sort((x, y) => x.peso - y.peso);
  return ids.slice(0, k).map((c) => c.id);
}

// Acomoda las cartas en el tablero; con carta doble, ésta ocupa las dos casillas indicadas
function acomodar(cartas, n, doble, rng) {
  if (!doble) return barajar([...cartas], rng);
  const tablero = new Array(n * n);
  doble.indices.forEach((i) => (tablero[i] = doble.id));
  const resto = barajar(cartas.filter((id) => id !== doble.id), rng);
  for (let i = 0; i < tablero.length; i++) if (tablero[i] === undefined) tablero[i] = resto.pop();
  return tablero;
}

/**
 * Genera tableros únicos (ningún par con el mismo conjunto de cartas), con el uso de cartas
 * equilibrado y minimizando las cartas repetidas entre tableros.
 *
 * posicionDoble: null (sin carta doble), el id de una posición o 'aleatoria'.
 * Con carta doble cada tablero tiene n² - 1 cartas distintas y una de ellas aparece dos veces.
 */
export function generarTableros({ cantidad, tamano, semilla, posicionDoble = null }) {
  if (!TAMANOS.includes(tamano)) throw new Error(`Tamaño inválido: ${tamano}`);
  cantidad = Math.max(1, Math.min(MAX_TABLEROS, Math.floor(cantidad)));

  const posiciones = posicionDoble === POSICION_ALEATORIA
    ? posicionesDisponibles(tamano).map((p) => p.id)
    : posicionDoble ? [posicionDoble] : [];
  if (posicionDoble && !posiciones.every((id) => indicesDoble(id, tamano))) {
    throw new Error(`La posición "${posicionDoble}" no existe en tableros de ${tamano}×${tamano}`);
  }

  const k = tamano * tamano - (posicionDoble ? 1 : 0);
  const rng = crearRng(`${semilla}|${tamano}${posicionDoble ? `|${posicionDoble}` : ''}`);
  const uso = new Array(TOTAL_CARTAS + 1).fill(0);
  const firmas = new Set();
  const mascaras = [];
  const tableros = [];

  while (tableros.length < cantidad) {
    let mejor = null;

    for (let intento = 0; intento < CANDIDATOS; intento++) {
      const cartas = elegirCartas(k, uso, rng);
      const m = mascara(cartas);
      let doble = null;
      if (posiciones.length) {
        const posicion = posiciones[Math.floor(rng() * posiciones.length)];
        doble = { id: cartas[Math.floor(rng() * cartas.length)], posicion, indices: indicesDoble(posicion, tamano) };
      }
      const firma = `${m.hi}:${m.lo}${doble ? `:${doble.id}:${doble.posicion}` : ''}`;
      if (firmas.has(firma)) continue;

      let maximo = 0, suma = 0;
      for (const otra of mascaras) {
        const c = enComun(m, otra);
        suma += c;
        if (c > maximo) maximo = c;
      }
      if (!mejor || maximo < mejor.maximo || (maximo === mejor.maximo && suma < mejor.suma)) {
        mejor = { cartas, m, doble, firma, maximo, suma };
      }
    }

    // Prácticamente imposible (todos los candidatos duplicados): se reintenta
    if (!mejor) continue;

    firmas.add(mejor.firma);
    mascaras.push(mejor.m);
    mejor.cartas.forEach((id) => uso[id]++);
    const tablero = { numero: tableros.length + 1, cartas: acomodar(mejor.cartas, tamano, mejor.doble, rng) };
    if (mejor.doble) tablero.doble = { carta: mejor.doble.id, posicion: mejor.doble.posicion };
    tableros.push(tablero);
  }

  return { tableros, estadisticas: calcularEstadisticas(tableros) };
}

export function calcularEstadisticas(tableros) {
  const uso = new Array(TOTAL_CARTAS + 1).fill(0);
  tableros.forEach((t) => new Set(t.cartas).forEach((id) => uso[id]++));
  const usos = uso.slice(1);

  const mascaras = tableros.map((t) => mascara(t.cartas));
  let maxComun = 0, sumaComun = 0, pares = 0;
  for (let i = 0; i < mascaras.length; i++) {
    for (let j = i + 1; j < mascaras.length; j++) {
      const c = enComun(mascaras[i], mascaras[j]);
      if (c > maxComun) maxComun = c;
      sumaComun += c;
      pares++;
    }
  }

  return {
    usoMin: Math.min(...usos),
    usoMax: Math.max(...usos),
    maxComun,
    promedioComun: pares ? sumaComun / pares : 0,
  };
}
