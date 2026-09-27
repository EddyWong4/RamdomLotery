import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { generarTableros, crearRng, TAMANOS, MAX_TABLEROS } from '../src/generador.js';
import { posicionesDisponibles, indicesDoble, POSICION_ALEATORIA } from '../src/posiciones.js';

const huella = (x) => createHash('sha256').update(JSON.stringify(x)).digest('hex').slice(0, 16);
const conjunto = (t) => [...new Set(t.cartas)].sort((a, b) => a - b).join('-');

describe('reproducibilidad: un código ya usado sigue dando los mismos tableros', () => {
  // Huellas tomadas de la versión 1.1.0. Si esta prueba falla, los códigos de juego
  // que la gente ya imprimió generarían tableros distintos.
  const casos = [
    [{ cantidad: 10, tamano: 2, semilla: 'ABC123' }, '3770145700db3999'],
    [{ cantidad: 25, tamano: 3, semilla: 'FIESTA' }, '54c7533b808f53e8'],
    [{ cantidad: 54, tamano: 4, semilla: 'W6VT78' }, '464bc37202fdcac5'],
    [{ cantidad: 30, tamano: 5, semilla: 'X' }, 'bee0d31519bba135'],
    [{ cantidad: 60, tamano: 4, semilla: 'FRVY83', posicionDoble: 'esquinas-superiores' }, 'ee7466a4c72f96d7'],
    [{ cantidad: 20, tamano: 5, semilla: 'Q', posicionDoble: 'par-superior' }, '3679c5b25a700f95'],
    [{ cantidad: 15, tamano: 3, semilla: 'Z9', posicionDoble: 'aleatoria' }, '30a68e9829ee5086'],
  ];
  it.each(casos)('%o', (opciones, esperado) => {
    expect(huella(generarTableros(opciones).tableros)).toBe(esperado);
  });

  it('el generador aleatorio con semilla es determinista', () => {
    const a = crearRng('HOLA');
    const b = crearRng('HOLA');
    for (let i = 0; i < 100; i++) expect(a()).toBe(b());
  });
});

describe('tableros sin dobles', () => {
  it.each(TAMANOS)('%i×%i: tamaño correcto, cartas válidas y sin repetir dentro del tablero', (n) => {
    const { tableros } = generarTableros({ cantidad: 40, tamano: n, semilla: 'T' });
    expect(tableros).toHaveLength(40);
    tableros.forEach((t, i) => {
      expect(t.numero).toBe(i + 1);
      expect(t.cartas).toHaveLength(n * n);
      expect(new Set(t.cartas).size).toBe(n * n);
      t.cartas.forEach((id) => expect(id).toBeGreaterThanOrEqual(1) && expect(id).toBeLessThanOrEqual(54));
      expect(t.doble).toBeUndefined();
    });
  });

  it.each(TAMANOS)('%i×%i: nunca hay dos tableros con las mismas cartas', (n) => {
    const { tableros } = generarTableros({ cantidad: 200, tamano: n, semilla: 'U' });
    expect(new Set(tableros.map(conjunto)).size).toBe(200);
  });

  it('reparto equilibrado: cada carta aparece un número parecido de veces', () => {
    const { estadisticas } = generarTableros({ cantidad: 54, tamano: 4, semilla: 'E' });
    expect(estadisticas.usoMax - estadisticas.usoMin).toBeLessThanOrEqual(2);
  });

  it('limita la cantidad entre 1 y el máximo', () => {
    expect(generarTableros({ cantidad: 0, tamano: 2, semilla: 'L' }).tableros).toHaveLength(1);
    expect(generarTableros({ cantidad: 9999, tamano: 2, semilla: 'L' }).tableros).toHaveLength(MAX_TABLEROS);
  });

  it('rechaza tamaños inválidos', () => {
    expect(() => generarTableros({ cantidad: 1, tamano: 6, semilla: 'L' })).toThrow();
  });
});

describe('tableros dobles', () => {
  const combinaciones = TAMANOS.flatMap((n) =>
    [...posicionesDisponibles(n).map((p) => p.id), POSICION_ALEATORIA].map((p) => [n, p]));

  it.each(combinaciones)('%i×%i en "%s": la doble sale exactamente 2 veces en sus casillas', (n, posicion) => {
    const { tableros } = generarTableros({ cantidad: 30, tamano: n, semilla: 'D', posicionDoble: posicion });
    for (const t of tableros) {
      expect(t.cartas).toHaveLength(n * n);
      const veces = {};
      t.cartas.forEach((id) => (veces[id] = (veces[id] ?? 0) + 1));
      const repetidas = Object.entries(veces).filter(([, v]) => v > 1);
      expect(repetidas).toEqual([[String(t.doble.carta), 2]]);
      if (posicion !== POSICION_ALEATORIA) expect(t.doble.posicion).toBe(posicion);
      indicesDoble(t.doble.posicion, n).forEach((i) => expect(t.cartas[i]).toBe(t.doble.carta));
    }
  });

  it.each([1, 20, 54, 55, 108, 200])('con %i tableros: doble distinta en cada bloque de 54 y reparto parejo', (cantidad) => {
    const { tableros } = generarTableros({ cantidad, tamano: 4, semilla: 'B', posicionDoble: 'diagonal-izquierda' });
    for (let i = 0; i < tableros.length; i += 54) {
      const bloque = tableros.slice(i, i + 54).map((t) => t.doble.carta);
      expect(new Set(bloque).size).toBe(bloque.length);
    }
    if (cantidad >= 54) {
      const veces = new Array(55).fill(0);
      tableros.forEach((t) => veces[t.doble.carta]++);
      const usos = veces.slice(1);
      expect(Math.max(...usos) - Math.min(...usos)).toBeLessThanOrEqual(1);
    }
  });

  it('nunca hay dos tableros dobles idénticos', () => {
    const { tableros } = generarTableros({ cantidad: 300, tamano: 2, semilla: 'I', posicionDoble: POSICION_ALEATORIA });
    const firmas = tableros.map((t) => `${conjunto(t)}:${t.doble.carta}:${t.doble.posicion}`);
    expect(new Set(firmas).size).toBe(300);
  });

  it('rechaza una posición que no existe en ese tamaño', () => {
    expect(() => generarTableros({ cantidad: 1, tamano: 3, semilla: 'P', posicionDoble: 'par-superior' })).toThrow();
  });
});
