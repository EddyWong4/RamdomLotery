import { describe, it, expect } from 'vitest';
import { gruposCeldas, gruposGanadores, verificarTablero } from '../src/reglas.js';

// Tablero 3×3 de ejemplo:
//  1  2  3
//  4  5  6
//  7  8  9
const t3 = [1, 2, 3, 4, 5, 6, 7, 8, 9];

describe('grupos de casillas', () => {
  it('llena: todas las casillas', () => expect(gruposCeldas(3, 'llena')).toEqual([[0, 1, 2, 3, 4, 5, 6, 7, 8]]));
  it('esquinas: las 4 esquinas', () => expect(gruposCeldas(3, 'esquinas')).toEqual([[0, 2, 6, 8]]));
  it('esquinas en 2×2 son las 4 casillas', () => expect(gruposCeldas(2, 'esquinas')).toEqual([[0, 1, 2, 3]]));
  it('línea: n filas + n columnas + 2 diagonales', () => {
    const g = gruposCeldas(4, 'linea');
    expect(g).toHaveLength(10);
    expect(g).toContainEqual([0, 5, 10, 15]);
    expect(g).toContainEqual([3, 6, 9, 12]);
    expect(g).toContainEqual([1, 5, 9, 13]);
  });
  it('rechaza formas desconocidas', () => expect(() => gruposCeldas(3, 'x')).toThrow());
  it('con carta doble, el grupo de cartas no la repite', () => {
    expect(gruposGanadores([7, 2, 3, 7], 'llena')).toEqual([[7, 2, 3]]);
  });
});

describe('verificarTablero', () => {
  it('línea completa por la diagonal', () => {
    const r = verificarTablero(t3, [1, 5, 9, 2], 'linea');
    expect(r.gano).toBe(true);
    expect(r.ganadoras).toEqual([0, 4, 8]);
    expect(r.marcadas).toEqual([0, 1, 4, 8]);
  });

  it('aún no gana: indica lo que falta al grupo más cercano', () => {
    const r = verificarTablero(t3, [1, 2], 'linea');
    expect(r.gano).toBe(false);
    expect(r.ganadoras).toBeNull();
    expect(r.faltan).toEqual([3]);
  });

  it('tabla llena', () => {
    expect(verificarTablero(t3, t3.slice(0, 8), 'llena').gano).toBe(false);
    expect(verificarTablero(t3, t3, 'llena').gano).toBe(true);
  });

  it('esquinas', () => {
    expect(verificarTablero(t3, [1, 3, 7, 9], 'esquinas').gano).toBe(true);
    expect(verificarTablero(t3, [1, 3, 7], 'esquinas').faltan).toEqual([9]);
  });

  it('la carta doble marca sus dos casillas', () => {
    const doble = [7, 2, 3, 7]; // 2×2 con el 7 doble en la diagonal izquierda
    const r = verificarTablero(doble, [7], 'linea');
    expect(r.marcadas).toEqual([0, 3]);
    expect(r.gano).toBe(true); // diagonal 0-3 completa con una sola carta
  });

  it('acepta cantadas como Set o arreglo', () => {
    expect(verificarTablero(t3, new Set([1, 5, 9]), 'linea').gano).toBe(true);
  });
});
