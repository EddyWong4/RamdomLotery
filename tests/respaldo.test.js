// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { crearRespaldo, validarRespaldo, combinarDatos, traeDatosActuales, FORMATO } from '../src/respaldo.js';
import * as almacen from '../src/almacen.js';

const imagen = 'data:image/jpeg;base64,AAAA';

describe('respaldo', () => {
  it('crea y valida un respaldo', () => {
    const r = crearRespaldo({ juegos: [] }, { 1: { imagen, miniatura: imagen } }, '1.4.0');
    expect(r.formato).toBe(FORMATO);
    expect(validarRespaldo(JSON.parse(JSON.stringify(r)))).toBeTruthy();
  });

  it('sin imágenes no agrega la sección', () => {
    expect(crearRespaldo({}, {}).imagenes).toBeUndefined();
  });

  it.each([
    [null, 'no es un respaldo'],
    [{ formato: 'otro' }, 'no es un respaldo'],
    [{ formato: FORMATO, version: 99, datos: {} }, 'más nueva'],
    [{ formato: FORMATO, version: 1 }, 'incompleto'],
    [{ formato: FORMATO, version: 1, datos: {}, imagenes: { 60: { imagen, miniatura: imagen } } }, 'dañada'],
    [{ formato: FORMATO, version: 1, datos: {}, imagenes: { 3: { imagen: 'javascript:x', miniatura: imagen } } }, 'dañada'],
  ])('rechaza archivos inválidos (%#)', (r, mensaje) => {
    expect(() => validarRespaldo(r)).toThrow(mensaje);
  });

  describe('combinar', () => {
    const actuales = {
      juegos: [{ id: 'a', nombre: 'A' }, { id: 'b', nombre: 'B' }],
      marcas: { x: [1] },
      preferencias: { tamano: 4 },
      'juego-actual': { id: 'mio' },
    };
    const respaldo = {
      juegos: [{ id: 'b', nombre: 'B nuevo' }, { id: 'c', nombre: 'C' }],
      marcas: { y: [2] },
      preferencias: { tamano: 5 },
      'juego-actual': { id: 'suyo' },
    };

    it('agrega juegos sin perder los existentes', () => {
      const { datos, resumen } = combinarDatos(actuales, respaldo);
      expect(datos.juegos.map((j) => j.nombre)).toEqual(['B nuevo', 'C', 'A']);
      expect(resumen).toMatchObject({ juegosNuevos: 1, juegosActualizados: 1, tablerosConMarcas: 1, reemplazados: [] });
      expect(datos.marcas).toEqual({ x: [1], y: [2] });
    });

    it('no toca preferencias ni juego actual si no se pide', () => {
      const { datos } = combinarDatos(actuales, respaldo);
      expect(datos.preferencias).toBeUndefined();
      expect(datos['juego-actual']).toBeUndefined();
    });

    it('los reemplaza si se pide', () => {
      const { datos, resumen } = combinarDatos(actuales, respaldo, { reemplazarActual: true });
      expect(datos['juego-actual']).toEqual({ id: 'suyo' });
      expect(resumen.reemplazados).toEqual(['preferencias', 'juego-actual']);
    });

    it('agrega las fichas del respaldo sin perder las propias', () => {
      const mia = { id: 'mia', nombre: 'Mía', tipo: 'estrella', color: '#123456', tamano: 60, opacidad: 1 };
      const suya = { id: 'suya', nombre: 'Suya', tipo: 'emoji', emoji: '🌽', tamano: 70, opacidad: 1 };
      const { datos, resumen } = combinarDatos({ fichas: [mia] }, { fichas: [suya, { tipo: 'invalida' }] });
      expect(datos.fichas.map((f) => f.id)).toEqual(['predeterminada', 'mia', 'suya']);
      expect(resumen.fichasNuevas).toBe(1);
    });

    it('agrega los tableros favoritos del respaldo sin duplicar', () => {
      const mio = { id: 'm1', nombre: 'Mío', tamano: 2, cartas: [1, 2, 3, 4] };
      const { datos, resumen } = combinarDatos({ favoritos: [mio] }, {
        favoritos: [{ id: 'x', tamano: 2, cartas: [1, 2, 3, 4] }, { id: 'y', nombre: 'Suyo', tamano: 2, cartas: [5, 6, 7, 8] }],
      });
      expect(datos.favoritos.map((f) => f.nombre)).toEqual(['Mío', 'Suyo']);
      expect(resumen.favoritosNuevos).toBe(1);
    });

    it('detecta si el respaldo trae datos actuales', () => {
      expect(traeDatosActuales(respaldo)).toBe(true);
      expect(traeDatosActuales({ juegos: [] })).toBe(false);
    });
  });

  describe('con el almacenamiento real', () => {
    beforeEach(() => localStorage.clear());

    it('leerTodo / escribirTodo ida y vuelta', () => {
      almacen.guardarJuego({ id: 'z', nombre: 'Z' });
      almacen.guardarPreferencias({ tamano: 3 });
      localStorage.setItem('otra-app', 'no se incluye');
      const todo = almacen.leerTodo();
      expect(Object.keys(todo).sort()).toEqual(['juegos', 'preferencias']);
      localStorage.clear();
      expect(almacen.escribirTodo(todo)).toBe(true);
      expect(almacen.listarJuegos()).toEqual([{ id: 'z', nombre: 'Z' }]);
    });
  });
});
