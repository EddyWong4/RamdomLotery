// Agregar y eliminar tableros de un juego sin romper la reproducibilidad.
//
// Un juego se define por su código, tamaño, posición de la doble y `generados` (cuántos tableros se han
// generado con ese código). El generador es estable por prefijo: generar N+1 tableros da los mismos N
// de antes y uno nuevo al final. Por eso:
//  - agregar = generar el tablero Nº generados+1 (cumple todas las reglas: único, reparto, dobles)
//  - eliminar = quitarlo de la lista sin renumerar; los números de los demás no cambian, así los
//    tableros ya impresos y los links compartidos siguen coincidiendo.
import { generarTableros, calcularEstadisticas, MAX_TABLEROS } from './generador.js';

/** Cuántos tableros se han generado con el código (incluye los eliminados). Juegos viejos no lo guardaban. */
export const tablerosGenerados = (juego) =>
  juego.generados ?? Math.max(juego.tableros.length, ...juego.tableros.map((t) => t.numero));

// Un juego de favoritos (manual) no tiene código: no se pueden generar más tableros con él
export const puedeAgregar = (juego) => !juego.manual && tablerosGenerados(juego) < MAX_TABLEROS;

export function agregarTablero(juego) {
  const generados = tablerosGenerados(juego);
  if (juego.manual) throw new Error('Un juego de favoritos no tiene código para generar más tableros');
  if (generados >= MAX_TABLEROS) throw new Error(`Se llegó al máximo de ${MAX_TABLEROS} tableros por juego`);
  const { tableros } = generarTableros({
    cantidad: generados + 1,
    tamano: juego.tamano,
    semilla: juego.semilla,
    posicionDoble: juego.posicionDoble ?? null,
  });
  const nuevo = tableros[generados];
  const lista = [...juego.tableros, nuevo];
  return { ...juego, generados: generados + 1, tableros: lista, estadisticas: calcularEstadisticas(lista), simulacion: null };
}

export function eliminarTablero(juego, numero) {
  const lista = juego.tableros.filter((t) => t.numero !== numero);
  if (lista.length === juego.tableros.length) return juego;
  return {
    ...juego,
    generados: tablerosGenerados(juego),
    tableros: lista,
    estadisticas: calcularEstadisticas(lista),
    simulacion: null,
    seleccion: (juego.seleccion ?? []).filter((n) => n !== numero),
  };
}

/** Cuántos tableros se han eliminado del juego. */
export const tablerosEliminados = (juego) => tablerosGenerados(juego) - juego.tableros.length;
