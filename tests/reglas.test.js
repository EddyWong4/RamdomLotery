import { describe, it, expect } from 'vitest';
import { gruposCeldas, gruposGanadores, verificarTablero, casillasMinimas, normalizarModo } from '../src/reglas.js';

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

describe('formas nuevas', () => {
  // Tablero 4×4:
  //  1  2  3  4
  //  5  6  7  8
  //  9 10 11 12
  // 13 14 15 16
  const t4 = Array.from({ length: 16 }, (_, i) => i + 1);

  it('tradicional en 4×4: 10 líneas + esquinas + 9 cuadros', () => {
    const g = gruposCeldas(4, 'tradicional');
    expect(g).toHaveLength(20);
    expect(g).toContainEqual([0, 3, 12, 15]); // esquinas
    expect(g).toContainEqual([5, 6, 9, 10]); // 4 al centro
    expect(g).toContainEqual([0, 1, 4, 5]); // cuadro de arriba a la izquierda
  });

  it('tradicional gana con cualquiera de sus figuras', () => {
    expect(verificarTablero(t4, [1, 2, 3, 4], 'tradicional').gano).toBe(true); // horizontal
    expect(verificarTablero(t4, [2, 6, 10, 14], 'tradicional').gano).toBe(true); // vertical
    expect(verificarTablero(t4, [4, 7, 10, 13], 'tradicional').gano).toBe(true); // diagonal
    expect(verificarTablero(t4, [1, 4, 13, 16], 'tradicional').gano).toBe(true); // esquinas
    expect(verificarTablero(t4, [6, 7, 10, 11], 'tradicional').gano).toBe(true); // centro
    expect(verificarTablero(t4, [11, 12, 15, 16], 'tradicional').gano).toBe(true); // cuadro
    expect(verificarTablero(t4, [1, 2, 3, 6], 'tradicional').gano).toBe(false);
  });

  it('en 2×2 tradicional no repite grupos', () => {
    const claves = gruposCeldas(2, 'tradicional').map((g) => [...g].sort().join());
    expect(new Set(claves).size).toBe(claves.length);
  });

  it('cruz: las dos diagonales (7 casillas en 3×3 comparten el centro)', () => {
    expect(gruposCeldas(4, 'cruz')).toEqual([[0, 3, 5, 6, 9, 10, 12, 15]]);
    expect(gruposCeldas(3, 'cruz')).toEqual([[0, 2, 4, 6, 8]]);
    expect(verificarTablero(t4, [1, 6, 11, 16], 'cruz').gano).toBe(false);
    expect(verificarTablero(t4, [1, 6, 11, 16, 4, 7, 10, 13], 'cruz').gano).toBe(true);
  });

  it('siete loco: 7 casillas cualesquiera', () => {
    expect(casillasMinimas(4, 'siete')).toBe(7);
    expect(casillasMinimas(2, 'siete')).toBe(4);
    const seis = verificarTablero(t4, [1, 5, 9, 16, 3, 12], 'siete');
    expect(seis.gano).toBe(false);
    expect(seis.casillasFaltantes).toBe(1);
    const siete = verificarTablero(t4, [1, 5, 9, 16, 3, 12, 8], 'siete');
    expect(siete.gano).toBe(true);
    expect(siete.ganadoras).toHaveLength(7);
  });

  it('siete loco: una carta doble cuenta sus 2 casillas', () => {
    const doble = [7, 2, 3, 4, 5, 6, 7, 8, 9]; // 3×3 con el 7 dos veces
    expect(verificarTablero(doble, [7, 2, 3, 4, 5, 6], 'siete').gano).toBe(true);
  });

  it('las formas anteriores pasan a tradicional', () => {
    expect(normalizarModo('linea')).toBe('tradicional');
    expect(normalizarModo('esquinas')).toBe('tradicional');
    expect(normalizarModo('siete')).toBe('siete');
    expect(normalizarModo(undefined)).toBe('llena');
  });
});
