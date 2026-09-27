import { describe, it, expect } from 'vitest';
import { modoInstalacion, guiaInstalacion } from '../src/instalar.js';

const UA = {
  chromeWin: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36',
  firefoxWin: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0',
  safariMac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  chromeMac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36',
};

describe('instalar la app', () => {
  it.each([
    [{ plataforma: 'android', instalada: true, hayPromptNativo: true }, 'instalada'],
    [{ plataforma: 'android', instalada: false, hayPromptNativo: true }, 'nativa'],
    [{ plataforma: 'escritorio', instalada: false, hayPromptNativo: true, userAgent: UA.chromeWin }, 'nativa'],
    [{ plataforma: 'ios', instalada: false, hayPromptNativo: false }, 'ios'],
    [{ plataforma: 'android', instalada: false, hayPromptNativo: false }, 'android'],
    [{ plataforma: 'escritorio', instalada: false, hayPromptNativo: false, userAgent: UA.safariMac, maxTouchPoints: 0 }, 'mac-safari'],
    [{ plataforma: 'escritorio', instalada: false, hayPromptNativo: false, userAgent: UA.chromeMac, maxTouchPoints: 0 }, null],
    [{ plataforma: 'escritorio', instalada: false, hayPromptNativo: false, userAgent: UA.firefoxWin }, null],
  ])('%o → %s', (entrada, esperado) => expect(modoInstalacion(entrada)).toBe(esperado));

  it.each(['ios', 'android', 'mac-safari'])('hay guía con pasos para %s', (modo) => {
    const g = guiaInstalacion(modo);
    expect(g.titulo).toBeTruthy();
    expect(g.pasos.length).toBeGreaterThanOrEqual(3);
  });

  it('la guía de iPhone menciona Compartir y Agregar a pantalla de inicio', () => {
    const texto = guiaInstalacion('ios').pasos.join(' ');
    expect(texto).toContain('Compartir');
    expect(texto).toContain('Agregar a pantalla de inicio');
  });

  it('sin guía para modos que no la necesitan', () => {
    expect(guiaInstalacion('nativa')).toBeNull();
    expect(guiaInstalacion(null)).toBeNull();
  });
});
