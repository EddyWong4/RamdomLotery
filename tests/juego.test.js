import { describe, it, expect } from 'vitest';
import { generarTableros, MAX_TABLEROS } from '../src/generador.js';
import { agregarTablero, eliminarTablero, tablerosGenerados, tablerosEliminados, puedeAgregar } from '../src/juego.js';
import { parametrosTablero, leerParametros, tableroDesdeParametros } from '../src/enlaces.js';

function nuevoJuego(opciones) {
  const { tableros, estadisticas } = generarTableros(opciones);
  return { id: 'j', semilla: opciones.semilla, tamano: opciones.tamano, posicionDoble: opciones.posicionDoble ?? null, tableros, estadisticas, generados: opciones.cantidad };
}
const conjunto = (t) => [...new Set(t.cartas)].sort((a, b) => a - b).join('-');

describe('agregar tablero', () => {
  it('agrega el siguiente tablero del código sin cambiar los existentes', () => {
    const juego = nuevoJuego({ cantidad: 20, tamano: 4, semilla: 'QN7A7X', posicionDoble: 'centrales-superiores' });
    const mas = agregarTablero(juego);
    expect(mas.tableros.slice(0, 20)).toEqual(juego.tableros);
    expect(mas.tableros[20].numero).toBe(21);
    expect(mas.generados).toBe(21);
    // Es exactamente el que daría generar 21 con el mismo código
    const directo = generarTableros({ cantidad: 21, tamano: 4, semilla: 'QN7A7X', posicionDoble: 'centrales-superiores' }).tableros[20];
    expect(mas.tableros[20]).toEqual(directo);
  });

  it('el nuevo cumple las reglas: único y con doble distinta en los primeros 54', () => {
    let juego = nuevoJuego({ cantidad: 50, tamano: 3, semilla: 'R', posicionDoble: 'diagonal-derecha' });
    for (let i = 0; i < 4; i++) juego = agregarTablero(juego);
    expect(new Set(juego.tableros.map(conjunto)).size).toBe(54);
    expect(new Set(juego.tableros.map((t) => t.doble.carta)).size).toBe(54);
  });

  it('no pasa del máximo', () => {
    const juego = { ...nuevoJuego({ cantidad: 2, tamano: 2, semilla: 'M' }), generados: MAX_TABLEROS };
    expect(puedeAgregar(juego)).toBe(false);
    expect(() => agregarTablero(juego)).toThrow();
  });

  it('borra la simulación (ya no corresponde a los tableros)', () => {
    const juego = { ...nuevoJuego({ cantidad: 3, tamano: 2, semilla: 'S' }), simulacion: { tableros: [1, 2, 3] } };
    expect(agregarTablero(juego).simulacion).toBeNull();
  });
});

describe('eliminar tablero', () => {
  const juego = { ...nuevoJuego({ cantidad: 10, tamano: 4, semilla: 'E' }), seleccion: [3, 5] };

  it('lo quita sin renumerar a los demás', () => {
    const menos = eliminarTablero(juego, 5);
    expect(menos.tableros.map((t) => t.numero)).toEqual([1, 2, 3, 4, 6, 7, 8, 9, 10]);
    expect(menos.tableros.find((t) => t.numero === 6)).toEqual(juego.tableros[5]);
    expect(menos.seleccion).toEqual([3]);
    expect(tablerosEliminados(menos)).toBe(1);
    expect(menos.estadisticas.usoMax).toBeGreaterThan(0);
  });

  it('un número que no existe no cambia nada', () => {
    expect(eliminarTablero(juego, 99)).toBe(juego);
  });

  it('agregar después de eliminar da el Nº siguiente al último generado (no reusa números)', () => {
    const r = agregarTablero(eliminarTablero(eliminarTablero(juego, 10), 2));
    expect(r.tableros.map((t) => t.numero)).toEqual([1, 3, 4, 5, 6, 7, 8, 9, 11]);
    expect(tablerosGenerados(r)).toBe(11);
  });

  it('los links siguen dando el mismo tablero después de eliminar y agregar', () => {
    const r = agregarTablero(eliminarTablero(juego, 4));
    for (const t of r.tableros) {
      expect(tableroDesdeParametros(leerParametros(parametrosTablero(r, t.numero)))).toEqual(t);
    }
  });
});

describe('juegos guardados antes de esta versión (sin "generados")', () => {
  it('se deduce de los tableros', () => {
    const { generados, ...viejo } = nuevoJuego({ cantidad: 8, tamano: 3, semilla: 'V' });
    expect(tablerosGenerados(viejo)).toBe(8);
    expect(agregarTablero(viejo).tableros[8].numero).toBe(9);
  });
});
