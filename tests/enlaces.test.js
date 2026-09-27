import { describe, it, expect } from 'vitest';
import { generarTableros } from '../src/generador.js';
import { parametrosTablero, enlaceTablero, leerParametros, tableroDesdeParametros, claveTablero } from '../src/enlaces.js';

const juegoDe = (opciones) => {
  const { tableros } = generarTableros(opciones);
  return { semilla: opciones.semilla, tamano: opciones.tamano, posicionDoble: opciones.posicionDoble ?? null, tableros };
};

describe('links de tableros', () => {
  it.each([
    { cantidad: 20, tamano: 4, semilla: 'PMKW5A' },
    { cantidad: 60, tamano: 5, semilla: 'X9', posicionDoble: 'par-superior' },
    { cantidad: 7, tamano: 2, semilla: 'Ñ con espacio', posicionDoble: 'aleatoria' },
  ])('el link regenera exactamente el mismo tablero (%o)', (opciones) => {
    const juego = juegoDe(opciones);
    for (const numero of [1, Math.ceil(opciones.cantidad / 2), opciones.cantidad]) {
      const datos = leerParametros(parametrosTablero(juego, numero));
      expect(datos).not.toBeNull();
      expect(tableroDesdeParametros(datos)).toEqual(juego.tableros[numero - 1]);
    }
  });

  it('arma el link con la base de la app', () => {
    const juego = juegoDe({ cantidad: 3, tamano: 3, semilla: 'AB' });
    expect(enlaceTablero(juego, 2, 'https://x.github.io/app/')).toBe('https://x.github.io/app/#/jugar?c=AB&n=3&k=3&t=2');
  });

  it.each([
    'n=4&k=10&t=1',
    'c=A&n=6&k=10&t=1',
    'c=A&n=4&k=0&t=1',
    'c=A&n=4&k=10&t=11',
    'c=A&n=4&k=10&t=1.5',
    'c=A&n=4&k=10&t=1&d=inventada',
    'c=A&n=3&k=10&t=1&d=par-superior',
  ])('rechaza parámetros inválidos: %s', (consulta) => {
    expect(leerParametros(new URLSearchParams(consulta))).toBeNull();
  });

  it('la clave distingue tableros y juegos', () => {
    const a = leerParametros(new URLSearchParams('c=A&n=4&k=10&t=1'));
    const b = leerParametros(new URLSearchParams('c=A&n=4&k=10&t=2'));
    expect(claveTablero(a)).not.toBe(claveTablero(b));
  });
});
