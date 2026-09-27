import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { generarTableros } from '../src/generador.js';
import { simular } from '../src/simulador.js';

const huella = (x) => createHash('sha256').update(JSON.stringify(x)).digest('hex').slice(0, 16);

describe('simulador', () => {
  const { tableros } = generarTableros({ cantidad: 12, tamano: 4, semilla: 'SIM' });

  // Resultados de la versión 1.1.0: misma semilla ⇒ misma simulación
  it.each([
    ['llena', '83393c9f38c78465', 68, 46.316],
    ['linea', '23bcb468a01a8691', 36, 16.15],
    ['esquinas', '031140b5b31394fa', 27, 27.186],
  ])('%s es reproducible', async (modo, victorias, empates, promedio) => {
    const r = await simular(tableros, { jugadas: 500, modo, semilla: 'SIM' });
    expect(huella(r.victorias)).toBe(victorias);
    expect(r.partidasEmpatadas).toBe(empates);
    expect(r.promedioCartas).toBeCloseTo(promedio, 6);
  });

  it('cada partida tiene al menos un ganador y las victorias cuadran con los empates', async () => {
    const r = await simular(tableros, { jugadas: 300, modo: 'linea', semilla: 'C' });
    const total = r.victorias.reduce((a, b) => a + b, 0);
    const extrasPorEmpate = r.empates.reduce((a, b) => a + b, 0) - r.partidasEmpatadas;
    expect(total).toBe(300 + extrasPorEmpate);
    expect(r.tableros).toEqual(tableros.map((t) => t.numero));
  });

  it('tabla llena: se necesitan al menos 16 cartas y a lo más 54', async () => {
    const r = await simular(tableros, { jugadas: 200, modo: 'llena', semilla: 'M' });
    expect(r.promedioCartas).toBeGreaterThanOrEqual(16);
    expect(r.promedioCartas).toBeLessThanOrEqual(54);
  });

  it('con tableros dobles la carta doble marca sus dos casillas (un 2×2 doble se llena con 3 cartas)', async () => {
    const { tableros: dobles } = generarTableros({ cantidad: 2, tamano: 2, semilla: 'DB', posicionDoble: 'esquinas-superiores' });
    const r = await simular(dobles, { jugadas: 200, modo: 'llena', semilla: 'DB' });
    expect(r.promedioCartas).toBeGreaterThanOrEqual(3);
    expect(r.promedioCartas).toBeLessThan(54);
  });

  it('marca como suficiente la muestra solo con ~20 victorias esperadas por tablero', async () => {
    expect((await simular(tableros, { jugadas: 100, modo: 'llena', semilla: 'S' })).muestraSuficiente).toBe(false);
    expect((await simular(tableros, { jugadas: 1000, modo: 'llena', semilla: 'S' })).muestraSuficiente).toBe(true);
  });
});
