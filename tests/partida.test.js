import { describe, it, expect } from 'vitest';
import { nuevaPartida, siguiente, anterior, cartasCantadas, cartaActual, terminada, esPartidaValida } from '../src/partida.js';

describe('partida del cantador', () => {
  it('baraja las 54 cartas sin repetir', () => {
    const p = nuevaPartida('A');
    expect([...p.orden].sort((a, b) => a - b)).toEqual(Array.from({ length: 54 }, (_, i) => i + 1));
    expect(p.cantadas).toBe(0);
    expect(cartaActual(p)).toBeNull();
  });

  it('misma semilla ⇒ mismo orden; distinta ⇒ distinto', () => {
    expect(nuevaPartida('A').orden).toEqual(nuevaPartida('A').orden);
    expect(nuevaPartida('A').orden).not.toEqual(nuevaPartida('B').orden);
  });

  it('avanza, retrocede y no se sale de los límites', () => {
    let p = nuevaPartida('C');
    p = siguiente(siguiente(p));
    expect(cartasCantadas(p)).toEqual(p.orden.slice(0, 2));
    expect(cartaActual(p)).toBe(p.orden[1]);
    p = anterior(anterior(anterior(p)));
    expect(p.cantadas).toBe(0);
    for (let i = 0; i < 60; i++) p = siguiente(p);
    expect(p.cantadas).toBe(54);
    expect(terminada(p)).toBe(true);
  });

  it('no modifica la partida original', () => {
    const p = nuevaPartida('D');
    siguiente(p);
    expect(p.cantadas).toBe(0);
  });

  it('valida partidas guardadas', () => {
    expect(esPartidaValida(nuevaPartida('E'))).toBe(true);
    expect(esPartidaValida(null)).toBe(false);
    expect(esPartidaValida({ orden: [1, 2], cantadas: 0 })).toBe(false);
    expect(esPartidaValida({ ...nuevaPartida('E'), cantadas: 99 })).toBe(false);
  });
});
