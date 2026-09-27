import { describe, it, expect } from 'vitest';
import { POSICIONES_DOBLE, posicionesDisponibles, indicesDoble, nombrePosicion } from '../src/posiciones.js';

describe('posiciones de la carta doble', () => {
  it('hay 16 posiciones', () => expect(POSICIONES_DOBLE).toHaveLength(16));

  it('2×2 y 3×3 solo tienen esquinas y diagonales; 4×4 y 5×5 las 16', () => {
    expect(posicionesDisponibles(2)).toHaveLength(6);
    expect(posicionesDisponibles(3)).toHaveLength(6);
    expect(posicionesDisponibles(4)).toHaveLength(16);
    expect(posicionesDisponibles(5)).toHaveLength(16);
  });

  it.each([2, 3, 4, 5])('%i×%i: cada posición da 2 casillas distintas dentro del tablero', (n) => {
    for (const p of posicionesDisponibles(n)) {
      const [a, b] = indicesDoble(p.id, n);
      expect(a).not.toBe(b);
      [a, b].forEach((i) => expect(i >= 0 && i < n * n).toBe(true));
    }
  });

  // Casillas acordadas con el usuario (fila * n + columna)
  it.each([
    ['esquinas-superiores', 4, [0, 3]],
    ['esquinas-inferiores', 4, [12, 15]],
    ['esquinas-izquierda', 4, [0, 12]],
    ['esquinas-derecha', 4, [3, 15]],
    ['diagonal-izquierda', 4, [0, 15]],
    ['diagonal-derecha', 4, [3, 12]],
    ['centrales-superiores', 4, [5, 6]],
    ['centrales-inferiores', 4, [9, 10]],
    ['centrales-izquierda', 4, [5, 9]],
    ['centrales-derecha', 4, [6, 10]],
    ['diagonal-central-izquierda', 4, [5, 10]],
    ['diagonal-central-derecha', 4, [6, 9]],
    ['par-superior', 4, [1, 2]],
    ['par-inferior', 4, [13, 14]],
    ['par-izquierdo', 4, [4, 8]],
    ['par-derecho', 4, [7, 11]],
    ['par-superior', 5, [1, 3]],
    ['centrales-superiores', 5, [6, 8]],
    ['diagonal-derecha', 2, [1, 2]],
  ])('%s en %i×%i → casillas %o', (id, n, esperado) => {
    expect(indicesDoble(id, n)).toEqual(esperado);
  });

  it('nombres legibles', () => {
    expect(nombrePosicion('par-superior')).toBe('Par superior');
    expect(nombrePosicion('aleatoria')).toBe('Aleatoria');
  });
});
