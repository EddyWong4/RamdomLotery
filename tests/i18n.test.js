// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { EN } from '../src/i18n-en.js';
import { MODOS } from '../src/reglas.js';
import { POSICIONES_DOBLE } from '../src/posiciones.js';
import { TEMAS } from '../src/temas.js';
import { TIPOS } from '../src/fichas.js';
import { PAPELES } from '../src/pdf.js';

const normalizar = (s) => s.replace(/\s+/g, ' ').trim();
const marcadores = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

async function i18nEn() {
  vi.resetModules();
  localStorage.setItem('loteria-tableros:idioma', JSON.stringify('en'));
  return import('../src/i18n.js');
}

describe('diccionario inglés', () => {
  it('las claves ya vienen normalizadas (sin espacios dobles ni en las orillas)', () => {
    for (const clave of Object.keys(EN)) expect(clave, clave).toBe(normalizar(clave));
  });

  it('cada traducción usa los mismos datos {x} que el español', () => {
    for (const [es, en] of Object.entries(EN)) expect(marcadores(en), es).toEqual(marcadores(es));
  });

  it('cubre todos los textos fijos de la página', () => {
    const d = new JSDOM(readFileSync('index.html', 'utf8')).window.document;
    const EN_LINEA = new Set(['B', 'I', 'STRONG', 'EM', 'SMALL', 'BR', 'A', 'CODE', 'KBD']);
    const soloEnLinea = (e) => [...e.children].every((h) => EN_LINEA.has(h.tagName) && !h.id && soloEnLinea(h));
    const faltan = [];
    const revisar = (texto) => {
      const t = normalizar(texto);
      if (/[a-záéíóúñ]{2}/i.test(t) && !(t in EN)) faltan.push(t);
    };
    // Igual que la app: una frase con formato se traduce completa si está en el diccionario; si no, pieza por pieza
    const recorrer = (e) => {
      if (e.closest('script, style, svg, [data-idioma]')) return;
      if (e.firstElementChild && soloEnLinea(e) && normalizar(e.innerHTML) in EN) return;
      for (const h of e.childNodes) {
        if (h.nodeType === 3) revisar(h.textContent);
        else if (h.nodeType === 1) recorrer(h);
      }
    };
    recorrer(d.body);
    d.querySelectorAll('[title],[aria-label],[placeholder],[alt]').forEach((e) => {
      for (const a of ['title', 'aria-label', 'placeholder', 'alt']) if (e.getAttribute(a)) revisar(e.getAttribute(a));
    });
    revisar(d.title);
    expect(faltan).toEqual([]);
  });

  it('cubre las listas de datos que se muestran (formas de ganar, posiciones, temas, fichas, papel)', () => {
    const textos = [
      ...Object.values(MODOS).flatMap((m) => [m.nombre, m.corto, m.ayuda]),
      ...POSICIONES_DOBLE.map((p) => p.nombre), 'Aleatoria',
      ...TEMAS.flatMap((t) => [t.nombre, t.descripcion]),
      ...Object.values(TIPOS).map((t) => t.nombre),
      ...Object.values(PAPELES).map((p) => p.nombre),
    ];
    expect(textos.filter((t) => !(normalizar(t) in EN))).toEqual([]);
  });
});

describe('t()', () => {
  beforeEach(() => localStorage.clear());

  it('en español (predeterminado) devuelve el texto original con sus datos', async () => {
    vi.resetModules();
    const { t, idioma } = await import('../src/i18n.js');
    expect(idioma()).toBe('es');
    expect(t('Tablero Nº {n} agregado', { n: '007' })).toBe('Tablero Nº 007 agregado');
  });

  it('en inglés traduce, llena los datos y conserva los espacios de las orillas', async () => {
    const { t, idioma, LOCALE } = await i18nEn();
    expect(idioma()).toBe('en');
    expect(LOCALE).toBe('en-US');
    expect(t('Tablero Nº {n} agregado', { n: '007' })).toBe('Board Nº 007 added');
    expect(t(' dobles')).toBe(' double');
    expect(t('Texto que no está en el diccionario')).toBe('Texto que no está en el diccionario');
  });

  it('un idioma guardado inválido vuelve al español', async () => {
    vi.resetModules();
    localStorage.setItem('loteria-tableros:idioma', JSON.stringify('fr'));
    const { idioma } = await import('../src/i18n.js');
    expect(idioma()).toBe('es');
  });

  it('traduce la página: textos, frases con formato y atributos', async () => {
    const { traducirArbol } = await i18nEn();
    document.body.innerHTML = `
      <button title="Tema de color">Generar tableros</button>
      <p id="x">Elige el tamaño y la cantidad, y presiona <b>Generar tableros</b>.</p>
      <span>El Gallo</span>`;
    traducirArbol(document.body);
    expect(document.querySelector('button').textContent).toBe('Generate boards');
    expect(document.querySelector('button').title).toBe('Color theme');
    expect(document.querySelector('#x').innerHTML).toBe('Choose the size and quantity, and press <b>Generate boards</b>.');
    expect(document.querySelector('span').textContent).toBe('El Gallo'); // las cartas conservan su nombre
  });
});
