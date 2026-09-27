import { describe, it, expect } from 'vitest';
import { contadorActivo, debeContar, urlRegistro, urlTotal, leerTotal } from '../src/visitas.js';

describe('contador de visitas', () => {
  it('solo se activa con un código válido', () => {
    expect(contadorActivo('')).toBe(false);
    expect(contadorActivo('loteria-eddy')).toBe(true);
    expect(contadorActivo('mal código')).toBe(false);
    expect(contadorActivo('evil.com/x')).toBe(false);
  });

  it.each([
    ['localhost', false], ['127.0.0.1', false], ['app.localhost', false], ['mi.test', false],
    ['eddywong4.github.io', true],
  ])('%s → contar: %s', (host, esperado) => expect(debeContar(host)).toBe(esperado));

  it('arma la URL del registro con la ruta y datos no personales', () => {
    const u = new URL(urlRegistro('loteria-eddy', { ruta: '/RamdomLotery/', titulo: 'Tableros de Lotería', pantalla: '390,844,3' }));
    expect(u.origin).toBe('https://loteria-eddy.goatcounter.com');
    expect(u.pathname).toBe('/count');
    expect(u.searchParams.get('p')).toBe('/RamdomLotery/');
    expect(u.searchParams.get('t')).toBe('Tableros de Lotería');
    expect(u.searchParams.get('s')).toBe('390,844,3');
  });

  it('arma la URL del total', () => {
    expect(urlTotal('loteria-eddy', '/RamdomLotery/')).toBe('https://loteria-eddy.goatcounter.com/counter/%2FRamdomLotery%2F.json');
  });

  it.each([
    [{ count: '1,234' }, 1234],
    [{ count: '1 234' }, 1234],
    [{ count: '7' }, 7],
    [{ count: '' }, null],
    [{}, null],
    [null, null],
  ])('lee el total %o → %s', (json, esperado) => expect(leerTotal(json)).toBe(esperado));
});
