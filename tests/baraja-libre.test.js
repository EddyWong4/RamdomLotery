import { describe, it, expect, beforeAll } from 'vitest';
import { DIBUJOS, TOTAL_DIBUJOS, ilustracion } from '../src/baraja-libre.js';
import { CARTAS } from '../src/cartas.js';
import { crc32, crearZip } from '../src/zip.js';

// jsdom no trae canvas: un contexto falso que acepta cualquier llamada basta para ejecutar cada dibujo
function contextoFalso() {
  const llamadas = [];
  const ctx = new Proxy({}, {
    get: (obj, prop) => (prop in obj ? obj[prop] : (...args) => { llamadas.push(prop); return { width: 10 }; }),
    set: (obj, prop, valor) => { obj[prop] = valor; return true; },
  });
  return { ctx, llamadas };
}

beforeAll(() => {
  globalThis.Path2D ??= class { constructor(d) { this.d = d; } moveTo() {} lineTo() {} closePath() {} };
});

describe('baraja libre', () => {
  it('tiene un dibujo para cada una de las 54 cartas', () => {
    expect(TOTAL_DIBUJOS).toBe(54);
    for (const carta of CARTAS) expect(DIBUJOS[carta.id], `carta ${carta.id}`).toBeDefined();
  });

  it('usa los nombres de la app y fondos de color válidos', () => {
    for (const carta of CARTAS) {
      const il = ilustracion(carta.id);
      expect(il.nombre).toBe(carta.nombre);
      expect(il.fondo).toMatch(/^#[0-9a-f]{6}$/i);
      expect(typeof il.dibujar).toBe('function');
    }
  });

  it('cada dibujo se ejecuta sin errores y pinta algo', () => {
    for (const carta of CARTAS) {
      const { ctx, llamadas } = contextoFalso();
      expect(() => ilustracion(carta.id).dibujar(ctx), carta.nombre).not.toThrow();
      expect(llamadas.some((l) => l === 'fill' || l === 'stroke' || l === 'fillText'), carta.nombre).toBe(true);
    }
  });
});

describe('zip', () => {
  it('calcula el CRC-32 estándar', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
  });

  it('arma un ZIP con encabezados y directorio central correctos', () => {
    const a = new TextEncoder().encode('hola');
    const zip = crearZip([{ nombre: '01 el gallo.png', bytes: a }, { nombre: 'LICENCIA.txt', bytes: a }]);
    const v = new DataView(zip.buffer);
    expect(v.getUint32(0, true)).toBe(0x04034b50);
    const fin = zip.length - 22;
    expect(v.getUint32(fin, true)).toBe(0x06054b50);
    expect(v.getUint16(fin + 10, true)).toBe(2);
    const inicioCentral = v.getUint32(fin + 16, true);
    expect(v.getUint32(inicioCentral, true)).toBe(0x02014b50);
  });
});
