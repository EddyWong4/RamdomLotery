// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { mejoresColumnas } from '../src/editor-tablero.js';

const PROPORCION = 1292 / 2048;
const cabe = (ancho, alto, c) => {
  const w = (ancho - (c - 1) * 8) / c;
  const filas = Math.ceil(54 / c);
  return filas * (w / PROPORCION) + (filas - 1) * 8 <= alto;
};

describe('columnas del selector de cartas', () => {
  it.each([
    [798, 618],   // computadora 1280 × 860
    [1000, 800],  // pantalla grande
    [600, 500],   // ventana chica
  ])('%i × %i: las 54 cartas caben y ninguna otra cantidad de columnas las haría más grandes', (ancho, alto) => {
    const c = mejoresColumnas(ancho, alto);
    expect(cabe(ancho, alto, c)).toBe(true);
    const ancho1 = (ancho - (c - 1) * 8) / c;
    for (let otra = 6; otra <= 16; otra++) {
      if (otra !== c && cabe(ancho, alto, otra)) expect((ancho - (otra - 1) * 8) / otra).toBeLessThanOrEqual(ancho1);
    }
  });

  it('en 1280 × 860 usa 11 columnas (cartas de ~65 px)', () => {
    expect(mejoresColumnas(798, 618)).toBe(11);
  });

  it('si no caben ni con el máximo, usa el máximo (se desplaza)', () => {
    expect(mejoresColumnas(300, 100)).toBe(16);
  });
});
