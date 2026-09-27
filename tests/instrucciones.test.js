import { describe, it, expect } from 'vitest';
import { figuras } from '../src/instrucciones.js';
import { MODOS_VISIBLES, verificarTablero } from '../src/reglas.js';

const t4 = Array.from({ length: 16 }, (_, i) => i + 1);

describe('instrucciones: figuras de ejemplo', () => {
  it('cada forma visible tiene al menos una figura', () => {
    for (const modo of MODOS_VISIBLES) expect(figuras(modo).length, modo).toBeGreaterThan(0);
  });

  it('tradicional muestra sus 6 figuras', () => {
    expect(figuras('tradicional').map((f) => f.titulo)).toEqual(['Horizontal', 'Vertical', 'Diagonal', '4 esquinas', '4 al centro', 'Cuadro de 4']);
  });

  it('cada figura dibujada realmente gana con el verificador', () => {
    for (const modo of MODOS_VISIBLES) {
      for (const f of figuras(modo)) {
        const cantadas = f.celdas.map((i) => t4[i]);
        expect(verificarTablero(t4, cantadas, modo).gano, `${modo}: ${f.titulo}`).toBe(true);
      }
    }
  });
});
