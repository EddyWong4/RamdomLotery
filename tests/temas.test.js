// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { TEMAS, TEMA_PREDETERMINADO, aplicarTema, elegirTema, temaGuardado, temaPorId } from '../src/temas.js';

const css = readFileSync('src/temas.css', 'utf8'); // se corre desde la raíz del proyecto
const VARIABLES = [
  '--fondo', '--fondo-2', '--fondo-luz', '--tarjeta', '--borde', '--hundido', '--oro', '--sobre-oro', '--rojo', '--rojo-2',
  '--texto', '--texto-suave', '--tinta', '--papel', '--papel-2', '--tinta-carta', '--tinta-carta-suave', '--tinta-papel',
  '--aviso-fondo', '--aviso-texto', '--peligro', '--aviso-error', '--exito',
];

// Luminancia relativa (WCAG) para revisar el contraste del texto
function luz(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contraste = (a, b) => { const [x, y] = [luz(a), luz(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const valor = (bloque, v) => bloque.match(new RegExp(`${v}:\\s*(#[0-9a-f]{6})`, 'i'))?.[1];

describe('temas de color', () => {
  beforeEach(() => {
    localStorage.clear();
    document.head.innerHTML = '<meta name="theme-color" content="#000000">';
  });

  it('hay 5 temas (el clásico y 4 nuevos), con ids únicos', () => {
    expect(TEMAS).toHaveLength(5);
    expect(new Set(TEMAS.map((t) => t.id)).size).toBe(5);
    expect(TEMA_PREDETERMINADO).toBe('clasico');
  });

  it.each(TEMAS.map((t) => [t.id]))('el tema %s define todas las variables en temas.css', (id) => {
    const bloque = css.match(new RegExp(`html\\[data-tema='${id}'\\]\\s*\\{([^}]*)\\}`))?.[1];
    expect(bloque).toBeTruthy();
    VARIABLES.forEach((v) => expect(bloque).toContain(`${v}:`));
  });

  it.each(TEMAS.map((t) => [t.id]))('el tema %s tiene texto legible (contraste WCAG AA ≥ 4.5)', (id) => {
    const bloque = css.match(new RegExp(`html\\[data-tema='${id}'\\]\\s*\\{([^}]*)\\}`))[1];
    const fondo = valor(bloque, '--fondo');
    expect(contraste(valor(bloque, '--texto'), fondo)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(valor(bloque, '--texto-suave'), fondo)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(valor(bloque, '--oro'), fondo)).toBeGreaterThanOrEqual(4.5);          // títulos y activos
    expect(contraste(valor(bloque, '--sobre-oro'), valor(bloque, '--oro'))).toBeGreaterThanOrEqual(4.5);
    expect(contraste('#ffffff', valor(bloque, '--rojo'))).toBeGreaterThanOrEqual(4.5);      // texto del botón principal
    expect(contraste(valor(bloque, '--aviso-texto'), valor(bloque, '--aviso-fondo'))).toBeGreaterThanOrEqual(4.5);
    expect(contraste(valor(bloque, '--tinta-carta'), valor(bloque, '--papel'))).toBeGreaterThanOrEqual(4.5);
  });

  it('aplica el tema en <html> y en el color de la barra del navegador', () => {
    aplicarTema('talavera');
    expect(document.documentElement.dataset.tema).toBe('talavera');
    expect(document.querySelector('meta[name="theme-color"]').getAttribute('content')).toBe(temaPorId('talavera').meta);
  });

  it('el fondo decorativo está encendido por defecto y se puede apagar', async () => {
    const { fondoGuardado, elegirFondo } = await import('../src/temas.js');
    expect(fondoGuardado()).toBe(true);
    elegirFondo(false);
    expect(document.documentElement.dataset.fondo).toBe('no');
    expect(fondoGuardado()).toBe(false);
    elegirFondo(true);
    expect(document.documentElement.dataset.fondo).toBeUndefined();
  });

  it.each(['clasico', 'talavera', 'cempasuchil', 'mesa', 'papel-picado'])('el tema %s tiene su fondo decorativo', (id) => {
    const nombre = id === 'papel-picado' ? 'papel-picado-tira' : id;
    expect(readFileSync(`src/fondos/${nombre}.svg`, 'utf8')).toMatch(/^<svg /);
    expect(css).toContain(`./fondos/${nombre}.svg`);
  });

  it('recuerda el tema elegido; uno desconocido vuelve al clásico', () => {
    expect(temaGuardado()).toBe('clasico');
    elegirTema('mesa');
    expect(temaGuardado()).toBe('mesa');
    localStorage.setItem('loteria-tableros:tema', '"inventado"');
    expect(temaGuardado()).toBe('clasico');
  });
});
