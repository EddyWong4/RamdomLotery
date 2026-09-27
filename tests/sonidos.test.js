// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';

describe('sonidos del cantador', () => {
  afterEach(() => {
    delete window.AudioContext;
    vi.resetModules();
  });

  it('el inicio y el fin son melodías distintas: el inicio sube y el fin baja', async () => {
    const { MELODIA_INICIO, MELODIA_FIN, duracion } = await import('../src/sonidos.js');
    expect(MELODIA_INICIO.at(-1).nota).toBeGreaterThan(MELODIA_INICIO[0].nota);
    expect(MELODIA_FIN.at(-1).nota).toBeLessThan(MELODIA_FIN[0].nota);
    expect(duracion(MELODIA_FIN)).toBeGreaterThan(duracion(MELODIA_INICIO));
  });

  it('sin Web Audio no falla (navegadores viejos o sin sonido)', async () => {
    const { sonidoInicio, sonidoFin } = await import('../src/sonidos.js');
    expect(sonidoInicio()).toBe(false);
    expect(sonidoFin()).toBe(false);
  });

  it('con Web Audio programa una nota por cada una de la melodía', async () => {
    const osciladores = [];
    const nodo = () => ({ connect: (x) => x ?? nodo(), gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} } });
    window.AudioContext = class {
      state = 'running';
      currentTime = 0;
      destination = {};
      createOscillator() {
        const o = { ...nodo(), frequency: {}, start() {}, stop() {} };
        o.connect = () => nodo();
        osciladores.push(o);
        return o;
      }
      createGain() { return nodo(); }
      resume() {}
    };
    const { sonidoInicio, sonidoFin, MELODIA_INICIO, MELODIA_FIN } = await import('../src/sonidos.js');
    expect(sonidoInicio()).toBe(true);
    expect(osciladores).toHaveLength(MELODIA_INICIO.length);
    sonidoFin();
    expect(osciladores).toHaveLength(MELODIA_INICIO.length + MELODIA_FIN.length);
  });
});
