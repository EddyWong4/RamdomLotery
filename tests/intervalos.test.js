// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { INTERVALOS, siguienteIntervalo } from '../src/cantador.js';

describe('tiempo entre cartas', () => {
  it('el botón da vuelta 3 → 5 → 7 → 10 → 15 → 20 → 3', () => {
    expect(INTERVALOS).toEqual([3, 5, 7, 10, 15, 20]);
    const vistos = [3];
    for (let i = 0; i < 6; i++) vistos.push(siguienteIntervalo(vistos.at(-1)));
    expect(vistos).toEqual([3, 5, 7, 10, 15, 20, 3]);
  });

  it('un tiempo guardado de versiones anteriores sigue desde el más cercano', () => {
    expect(siguienteIntervalo(8)).toBe(10); // 8 → 7 → siguiente 10
    expect(siguienteIntervalo(1)).toBe(5); // 1 → 3 → siguiente 5
  });
});
