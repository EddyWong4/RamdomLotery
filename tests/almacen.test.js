// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import * as almacen from '../src/almacen.js';

describe('almacen (localStorage)', () => {
  beforeEach(() => localStorage.clear());

  it('las preferencias guardadas se combinan con las de por defecto', () => {
    almacen.guardarPreferencias({ tamano: 5 });
    expect(almacen.cargarPreferencias({ tamano: 4, cantidad: 10 })).toEqual({ tamano: 5, cantidad: 10 });
  });

  it('guarda, lista y borra juegos (el más reciente primero, sin duplicar por id)', () => {
    almacen.guardarJuego({ id: 'a', nombre: 'A' });
    almacen.guardarJuego({ id: 'b', nombre: 'B' });
    almacen.guardarJuego({ id: 'a', nombre: 'A2' });
    expect(almacen.listarJuegos().map((j) => j.nombre)).toEqual(['A2', 'B']);
    almacen.eliminarJuego('a');
    expect(almacen.listarJuegos().map((j) => j.id)).toEqual(['b']);
  });

  it('juego actual', () => {
    expect(almacen.cargarJuegoActual()).toBeNull();
    almacen.guardarJuegoActual({ id: 'x' });
    expect(almacen.cargarJuegoActual()).toEqual({ id: 'x' });
  });

  it('datos corruptos no rompen la app', () => {
    localStorage.setItem('loteria-tableros:juegos', '{no es json');
    expect(almacen.listarJuegos()).toEqual([]);
  });
});
