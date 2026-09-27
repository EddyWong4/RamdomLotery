import { describe, it, expect } from 'vitest';
import {
  TIPOS, FICHAS_INICIALES, ID_PREDETERMINADA, normalizarFicha, svgFicha,
  crearArchivoFichas, leerArchivoFichas, combinarFichas, fichasConPredeterminada, FORMATO_ARCHIVO,
} from '../src/fichas.js';

const PNG = 'data:image/png;base64,iVBORw0KGgo=';

describe('fichas', () => {
  it('la predeterminada es un círculo con color', () => {
    const f = FICHAS_INICIALES.find((x) => x.id === ID_PREDETERMINADA);
    expect(f.tipo).toBe('circulo');
    expect(f.color).toMatch(/^#[0-9a-f]{6}$/);
  });

  it.each(Object.keys(TIPOS))('dibuja el tipo %s', (tipo) => {
    const f = normalizarFicha({ tipo, color: '#123456', emoji: '🌽', imagen: PNG });
    expect(f).not.toBeNull();
    const svg = svgFicha(f);
    expect(svg).toMatch(/^<svg class="ficha"/);
    if (TIPOS[tipo].usaColor) expect(svg).toContain('#123456');
  });

  it('aplica tamaño y opacidad (dentro de rango) y los omite en la vista de muestra', () => {
    const f = normalizarFicha({ tipo: 'circulo', color: '#000000', tamano: 500, opacidad: 0 });
    expect(f.tamano).toBe(100);
    expect(f.opacidad).toBe(0.2);
    expect(svgFicha(f)).toContain('width:100%;opacity:0.2');
    expect(svgFicha(f, { vista: true })).not.toContain('style=');
  });

  describe('rechaza datos peligrosos o inválidos', () => {
    it.each([
      [{ tipo: 'bomba', color: '#000000' }],
      [{ tipo: 'circulo', color: 'red"/><script>' }],
      [{ tipo: 'circulo' }],
      [{ tipo: 'imagen', imagen: 'javascript:alert(1)' }],
      [{ tipo: 'imagen', imagen: 'data:image/svg+xml;base64,PHN2Zz4=' }],
      [{ tipo: 'imagen', imagen: `data:image/png;base64,${'A'.repeat(300000)}` }],
      [{ tipo: 'emoji', emoji: '   ' }],
    ])('%o', (f) => expect(normalizarFicha(f)).toBeNull());

    it('escapa el emoji y el nombre', () => {
      const f = normalizarFicha({ tipo: 'emoji', emoji: '<b>', nombre: 'x'.repeat(99) });
      expect(svgFicha(f)).toContain('&lt;b&gt;');
      expect(f.nombre).toHaveLength(30);
    });

    it('ids raros se reemplazan', () => {
      expect(normalizarFicha({ id: '"><img', tipo: 'tache', color: '#000000' }).id).toMatch(/^f/);
    });
  });

  describe('archivo de fichas', () => {
    it('exporta e importa ida y vuelta', () => {
      const archivo = JSON.parse(JSON.stringify(crearArchivoFichas(FICHAS_INICIALES)));
      expect(archivo.formato).toBe(FORMATO_ARCHIVO);
      const { fichas, descartadas } = leerArchivoFichas(archivo);
      expect(fichas).toEqual(FICHAS_INICIALES.map(normalizarFicha));
      expect(descartadas).toBe(0);
    });

    it('descarta fichas inválidas y avisa cuántas', () => {
      const { fichas, descartadas } = leerArchivoFichas({ formato: FORMATO_ARCHIVO, version: 1, fichas: [{ tipo: 'x' }, { tipo: 'estrella', color: '#ff0000' }] });
      expect(fichas).toHaveLength(1);
      expect(descartadas).toBe(1);
    });

    it.each([null, {}, { formato: 'otro', fichas: [] }, { formato: FORMATO_ARCHIVO, version: 9, fichas: [] }])('rechaza archivos que no son de fichas (%#)', (a) => {
      expect(() => leerArchivoFichas(a)).toThrow();
    });
  });

  describe('combinar', () => {
    it('no duplica fichas iguales ni sobrescribe las propias', () => {
      const propias = [{ id: 'a', nombre: 'Mía', tipo: 'circulo', color: '#000000', tamano: 60, opacidad: 1 }];
      const importadas = [
        { id: 'b', nombre: 'Otro nombre', tipo: 'circulo', color: '#000000', tamano: 60, opacidad: 1 }, // se ve igual
        { id: 'a', nombre: 'Otra', tipo: 'estrella', color: '#ff0000', tamano: 60, opacidad: 1 }, // mismo id, distinta
      ];
      const { fichas, agregadas } = combinarFichas(propias, importadas);
      expect(agregadas).toBe(1);
      expect(fichas[0]).toEqual(propias[0]);
      expect(fichas[1].nombre).toBe('Otra');
      expect(fichas[1].id).not.toBe('a');
    });
  });

  it('reconoce fichas iguales aunque sus datos vengan en otro orden (importar dos veces no duplica)', () => {
    const propias = fichasConPredeterminada(null);
    const archivo = JSON.parse(JSON.stringify(crearArchivoFichas(FICHAS_INICIALES)));
    const { fichas } = leerArchivoFichas(archivo);
    const desordenadas = fichas.map((f) => Object.fromEntries(Object.entries(f).reverse()));
    expect(combinarFichas(propias, desordenadas).agregadas).toBe(0);
    expect(combinarFichas(propias, fichas).agregadas).toBe(0);
  });

  it('numera los nombres repetidos al importar', () => {
    const propias = fichasConPredeterminada(null);
    const azul = { id: ID_PREDETERMINADA, nombre: 'Círculo', tipo: 'circulo', color: '#457b9d', tamano: 60, opacidad: 0.85 };
    const { fichas, agregadas } = combinarFichas(propias, [azul]);
    expect(agregadas).toBe(1);
    expect(fichas.at(-1)).toMatchObject({ nombre: 'Círculo 2', color: '#457b9d' });
    expect(fichas.at(-1).id).not.toBe(ID_PREDETERMINADA);
    // y volver a importarla no la duplica
    expect(combinarFichas(fichas, [azul]).agregadas).toBe(0);
  });

  it('siempre hay una ficha predeterminada', () => {
    expect(fichasConPredeterminada(null).map((f) => f.id)).toContain(ID_PREDETERMINADA);
    expect(fichasConPredeterminada([{ id: 'x', tipo: 'tache', color: '#000000' }])[0].id).toBe(ID_PREDETERMINADA);
  });
});
