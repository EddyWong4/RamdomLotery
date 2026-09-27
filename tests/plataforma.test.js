// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { detectarPlataforma, aplicarPlataforma, estaInstalada } from '../src/plataforma.js';

const UA = {
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  ipadViejo: 'Mozilla/5.0 (iPad; CPU OS 12_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
  ipadModerno: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  android: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Mobile Safari/537.36',
  windows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36',
};

describe('plataforma', () => {
  it.each([
    [UA.iphone, 0, 'ios'],
    [UA.ipadViejo, 5, 'ios'],
    [UA.ipadModerno, 5, 'ios'],   // iPadOS se presenta como Mac pero es táctil
    [UA.ipadModerno, 0, 'escritorio'], // una Mac de verdad
    [UA.android, 5, 'android'],
    [UA.windows, 0, 'escritorio'],
    ['', 0, 'escritorio'],
  ])('%s (%i toques) → %s', (userAgent, maxTouchPoints, esperado) => {
    expect(detectarPlataforma({ userAgent, maxTouchPoints })).toBe(esperado);
  });

  it('marca el <html> y permite forzar el estilo con ?plataforma=', () => {
    const win = {
      location: { search: '?plataforma=android' },
      navigator: { userAgent: UA.iphone, maxTouchPoints: 5 },
      document,
      matchMedia: () => ({ matches: true }),
    };
    expect(aplicarPlataforma(win)).toBe('android');
    expect(document.documentElement.dataset.plataforma).toBe('android');
    expect(document.documentElement.dataset.instalada).toBe('si');
  });

  it('un valor inválido en ?plataforma= se ignora', () => {
    const win = { location: { search: '?plataforma=windows95' }, navigator: { userAgent: UA.iphone, maxTouchPoints: 5 }, document, matchMedia: () => ({ matches: false }) };
    expect(aplicarPlataforma(win)).toBe('ios');
  });

  it('detecta la app instalada en iPhone (navigator.standalone)', () => {
    expect(estaInstalada({ matchMedia: () => ({ matches: false }), navigator: { standalone: true } })).toBe(true);
    expect(estaInstalada({ matchMedia: () => ({ matches: false }), navigator: {} })).toBe(false);
  });
});
