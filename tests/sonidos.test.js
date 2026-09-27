// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';

describe('sonidos del cantador', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('el inicio y el fin son melodías distintas: el inicio sube y el fin baja', async () => {
    const { MELODIA_INICIO, MELODIA_FIN, duracion } = await import('../src/sonidos.js');
    expect(MELODIA_INICIO.at(-1).nota).toBeGreaterThan(MELODIA_INICIO[0].nota);
    expect(MELODIA_FIN.at(-1).nota).toBeLessThan(MELODIA_FIN[0].nota);
    expect(duracion(MELODIA_FIN)).toBeGreaterThan(duracion(MELODIA_INICIO));
  });

  it('sintetiza muestras audibles y dentro de rango', async () => {
    const { sintetizar, MELODIA_INICIO, duracion } = await import('../src/sonidos.js');
    const datos = sintetizar(MELODIA_INICIO, 0.32, 8000);
    expect(datos.length).toBe(Math.ceil((duracion(MELODIA_INICIO) + 0.08) * 8000));
    const max = datos.reduce((m, x) => Math.max(m, Math.abs(x)), 0);
    expect(max).toBeGreaterThan(0.1);
    expect(max).toBeLessThanOrEqual(1);
  });

  it('genera un WAV válido (PCM 16 bits mono)', async () => {
    const { wav } = await import('../src/sonidos.js');
    const bytes = wav(new Float32Array([0, 1, -1, 0.5]), 8000);
    const v = new DataView(bytes.buffer);
    const texto = (p, n) => String.fromCharCode(...bytes.slice(p, p + n));
    expect(texto(0, 4)).toBe('RIFF');
    expect(texto(8, 4)).toBe('WAVE');
    expect(texto(36, 4)).toBe('data');
    expect(v.getUint16(20, true)).toBe(1);
    expect(v.getUint32(24, true)).toBe(8000);
    expect(v.getUint32(40, true)).toBe(8);
    expect(v.getInt16(46, true)).toBe(32767);
    expect(v.getInt16(48, true)).toBe(-32767);
  });

  it('sin reproductor de audio no falla', async () => {
    vi.stubGlobal('Audio', undefined);
    const { sonidoInicio, sonidoFin, despertarAudio } = await import('../src/sonidos.js');
    expect(() => despertarAudio()).not.toThrow();
    expect(sonidoInicio()).toBe(false);
    expect(sonidoFin()).toBe(false);
  });

  it('desbloquea en el primer toque sin pausar el sonido que se pide enseguida', async () => {
    const creados = [];
    class AudioFalso {
      constructor(src) { this.src = src; this.muted = false; this.paused = true; this.reproducciones = 0; creados.push(this); }
      addEventListener() {}
      play() { this.paused = false; if (!this.muted) this.reproducciones++; return Promise.resolve(); }
      pause() { this.paused = true; }
    }
    vi.stubGlobal('Audio', AudioFalso);
    URL.createObjectURL = () => 'blob:x';
    const { despertarAudio, sonidoInicio } = await import('../src/sonidos.js');
    despertarAudio();        // toque: prepara inicio y fin en silencio
    sonidoInicio();          // mismo toque: la primera carta
    await Promise.resolve(); await Promise.resolve();
    const [inicio, fin] = creados;
    expect(creados).toHaveLength(2);
    expect(inicio.reproducciones).toBe(1);   // se oyó
    expect(inicio.paused).toBe(false);       // el desbloqueo no lo pausó
    expect(fin.paused).toBe(true);           // el de fin quedó listo y en pausa
    expect(fin.muted).toBe(false);
  });
});
