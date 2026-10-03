// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { numeroDeArchivo, extensionDe, nombreArchivoVoz, DURACION_MAXIMA } from '../src/voces.js';

describe('voces grabadas: archivos', () => {
  it('toma el número de carta del inicio del nombre', () => {
    expect(numeroDeArchivo('01 el gallo.m4a')).toBe(1);
    expect(numeroDeArchivo('6-la-sirena.webm')).toBe(6);
    expect(numeroDeArchivo('54.mp3')).toBe(54);
    expect(numeroDeArchivo('55 extra.mp3')).toBeNull();
    expect(numeroDeArchivo('gallo.m4a')).toBeNull();
    expect(numeroDeArchivo('123.mp3')).toBeNull();
  });

  it('elige la extensión según el formato grabado', () => {
    expect(extensionDe('audio/webm;codecs=opus')).toBe('webm');
    expect(extensionDe('audio/mp4')).toBe('m4a');
    expect(extensionDe('audio/ogg;codecs=opus')).toBe('ogg');
    expect(extensionDe('audio/mpeg')).toBe('mp3');
    expect(extensionDe('')).toBe('webm');
  });

  it('los nombres exportados se pueden volver a importar', () => {
    const nombre = nombreArchivoVoz(10, 'audio/mp4');
    expect(nombre).toBe('10 el arbol.m4a');
    expect(numeroDeArchivo(nombre)).toBe(10);
  });

  it('cada grabación dura poco (las cartas se cantan rápido)', () => {
    expect(DURACION_MAXIMA).toBeLessThanOrEqual(8);
  });
});
