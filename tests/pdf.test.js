// @vitest-environment jsdom
// Sin imágenes cargadas: el PDF usa cartas provisionales (número y nombre), igual que la página publicada.
import { describe, it, expect } from 'vitest';
import { crearPdfTableros, crearPdfBaraja, FORMATOS, PAPELES } from '../src/pdf.js';
import { generarTableros } from '../src/generador.js';

const { tableros } = generarTableros({ cantidad: 5, tamano: 4, semilla: 'PDF' });
const opciones = (formato) => ({ papel: 'carta', formato, lineasCorte: true, mostrarPie: true, semilla: 'PDF' });

// Texto de cada página tal como jsPDF lo escribe: [{ texto, puntos }]
function textos(doc, pagina) {
  return doc.internal.pages[pagina]
    .filter((b) => b.includes(') Tj'))
    .map((b) => ({ texto: b.match(/\((.*)\) Tj/)[1], puntos: Number(b.match(/\/F\d+ ([\d.]+) Tf/)[1]) }));
}

describe('PDF de tableros', () => {
  it.each([
    ['grande', 5, 'vertical'],
    ['s', 3, 'horizontal'],
    ['xs', 2, 'vertical'],
  ])('%s: %i hojas en orientación %s', async (formato, hojas, orientacion) => {
    const doc = await crearPdfTableros(tableros, opciones(formato));
    expect(doc.getNumberOfPages()).toBe(hojas);
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();
    expect(orientacion === 'vertical' ? w < h : w > h).toBe(true);
    expect(FORMATOS[formato].orientacion).toBe(orientacion);
  });

  it('cada tablero lleva su número pequeño y el pie con el código; no aparece "LOTERÍA"', async () => {
    const doc = await crearPdfTableros(tableros.slice(0, 1), opciones('grande'));
    const t = textos(doc, 1);
    const numero = t.find((x) => x.texto.startsWith('Nº'));
    expect(numero.texto).toBe('Nº 001');
    expect(numero.puntos).toBeLessThanOrEqual(11);
    expect(t.some((x) => x.texto.includes('Juego PDF'))).toBe(true);
    expect(t.some((x) => /LOTER/i.test(x.texto))).toBe(false);
  });

  it('sin pie cuando se desactiva', async () => {
    const doc = await crearPdfTableros(tableros.slice(0, 1), { ...opciones('grande'), mostrarPie: false });
    expect(textos(doc, 1).some((x) => x.texto.includes('Juego'))).toBe(false);
  });

  it.each(Object.keys(PAPELES))('papel %s', async (papel) => {
    const doc = await crearPdfTableros(tableros.slice(0, 1), { ...opciones('grande'), papel });
    expect(doc.internal.pageSize.getWidth()).toBeCloseTo(PAPELES[papel].w, 0);
  });

  it('cartas sin imagen salen como provisionales con número y nombre', async () => {
    const doc = await crearPdfTableros(tableros.slice(0, 1), opciones('grande'));
    const t = textos(doc, 1).map((x) => x.texto);
    tableros[0].cartas.forEach((id) => expect(t).toContain(String(id)));
  });
});

describe('PDF de la baraja', () => {
  it('54 cartas en 6 hojas de 9', async () => {
    const doc = await crearPdfBaraja('carta');
    expect(doc.getNumberOfPages()).toBe(6);
  });
});
