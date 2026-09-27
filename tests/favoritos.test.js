import { describe, it, expect } from 'vitest';
import {
  validarCartas, completarAlAzar, normalizarFavorito, favoritoDesdeTablero, juegoDesdeFavoritos,
  combinarFavoritos, origenDeTablero, ETIQUETA_JUEGO_MANUAL,
} from '../src/favoritos.js';
import { generarTableros, crearRng } from '../src/generador.js';

const t2 = [1, 2, 3, 4];

describe('validar un tablero hecho a mano', () => {
  it('completo y sin repetidas', () => expect(validarCartas(t2, 2)).toMatchObject({ ok: true, doble: null }));
  it('cuenta las casillas vacías', () => expect(validarCartas([1, null, 3, null], 2)).toMatchObject({ ok: false, faltan: 2, error: 'Faltan 2 casillas' }));
  it('una carta dos veces = tablero doble', () => expect(validarCartas([7, 2, 3, 7], 2)).toMatchObject({ ok: true, doble: { carta: 7 } }));
  it('una carta tres veces no se permite', () => expect(validarCartas([7, 7, 7, 1], 2).error).toMatch(/más de 2 veces/));
  it('dos cartas repetidas no se permiten', () => expect(validarCartas([7, 7, 8, 8], 2).error).toMatch(/Solo una carta/));
  it('cartas fuera de rango o tamaño inválido', () => {
    expect(validarCartas([0, 2, 3, 4], 2).ok).toBe(false);
    expect(validarCartas([55, 2, 3, 4], 2).ok).toBe(false);
    expect(validarCartas(t2, 3).ok).toBe(false);
    expect(validarCartas(t2, 6).ok).toBe(false);
  });
});

describe('completar al azar', () => {
  it('llena solo las vacías, sin repetir cartas', () => {
    const r = completarAlAzar([5, null, null, null, 9, null, null, null, null], crearRng('x'));
    expect(r[0]).toBe(5);
    expect(r[4]).toBe(9);
    expect(r.every((c) => c >= 1 && c <= 54)).toBe(true);
    expect(new Set(r).size).toBe(9);
    expect(validarCartas(r, 3).ok).toBe(true);
  });
  it('respeta una carta doble puesta a mano', () => {
    const r = completarAlAzar([3, null, null, 3], crearRng('y'));
    expect(validarCartas(r, 2)).toMatchObject({ ok: true, doble: { carta: 3 } });
  });
});

describe('favoritos', () => {
  it('normaliza y descarta inválidos', () => {
    expect(normalizarFavorito({ tamano: 2, cartas: t2, nombre: 'Mío' })).toMatchObject({ tamano: 2, nombre: 'Mío', doble: null, origen: 'manual' });
    expect(normalizarFavorito({ tamano: 2, cartas: [1, 1, 1, 2] })).toBeNull();
    expect(normalizarFavorito(null)).toBeNull();
    expect(normalizarFavorito({ id: '"><x', tamano: 2, cartas: t2 }).id).toMatch(/^t/);
  });

  it('desde un tablero generado guarda sus cartas y su origen', () => {
    const { tableros } = generarTableros({ cantidad: 5, tamano: 4, semilla: 'FAV', posicionDoble: 'esquinas-superiores' });
    const juego = { semilla: 'FAV', tamano: 4, posicionDoble: 'esquinas-superiores', tableros };
    const f = favoritoDesdeTablero(juego, tableros[2]);
    expect(f.cartas).toEqual(tableros[2].cartas);
    expect(f.doble).toEqual({ carta: tableros[2].doble.carta });
    expect(f.nombre).toBe('Juego FAV · Nº 003');
    expect(f.origen).toBe(origenDeTablero(juego, tableros[2]));
  });

  it('arma un juego con favoritos del mismo tamaño', () => {
    const a = normalizarFavorito({ tamano: 2, cartas: t2, nombre: 'A' });
    const b = normalizarFavorito({ tamano: 2, cartas: [5, 6, 5, 8], nombre: 'B' });
    const juego = juegoDesdeFavoritos([a, b]);
    expect(juego).toMatchObject({ manual: true, tamano: 2, semilla: ETIQUETA_JUEGO_MANUAL, generados: 2 });
    expect(juego.tableros.map((t) => t.numero)).toEqual([1, 2]);
    expect(juego.tableros[1].doble).toEqual({ carta: 5 });
    expect(juego.estadisticas.usoMax).toBeGreaterThan(0);
  });

  it('no mezcla tamaños ni acepta una lista vacía', () => {
    const a = normalizarFavorito({ tamano: 2, cartas: t2 });
    const c = normalizarFavorito({ tamano: 3, cartas: [1, 2, 3, 4, 5, 6, 7, 8, 9] });
    expect(() => juegoDesdeFavoritos([a, c])).toThrow(/mismo tamaño/);
    expect(() => juegoDesdeFavoritos([])).toThrow();
  });

  it('combinar no duplica (mismo id o mismas cartas)', () => {
    const a = normalizarFavorito({ id: 'a', tamano: 2, cartas: t2 });
    const { favoritos, agregados } = combinarFavoritos([a], [
      { id: 'b', tamano: 2, cartas: t2 },            // mismas cartas
      { id: 'a', tamano: 2, cartas: [9, 8, 7, 6] },  // mismo id, otras cartas → id nuevo
      { tamano: 2, cartas: [1, 1, 1, 1] },           // inválido
    ]);
    expect(agregados).toBe(1);
    expect(favoritos).toHaveLength(2);
    expect(favoritos[1].id).not.toBe('a');
  });
});
