// Respaldo: un archivo .json con lo que la app guarda en el navegador, para no perderlo
// o para pasarlo a otro dispositivo. Opcionalmente incluye las imágenes cargadas.
import { combinarFichas, fichasConPredeterminada, normalizarFicha } from './fichas.js';

export const FORMATO = 'loteria-tableros-respaldo';
export const VERSION_FORMATO = 1;

// Datos que se "combinan" (no se pierde nada de lo que ya hay) y los que se reemplazan solo si el usuario lo pide
const COMBINABLES = ['juegos', 'marcas', 'fichas'];
const REEMPLAZABLES = ['preferencias', 'juego-actual', 'partida', 'cantador', 'ficha-activa', 'jugador'];

export function crearRespaldo(datos, imagenes = null, versionApp = '') {
  const respaldo = { formato: FORMATO, version: VERSION_FORMATO, app: versionApp, fecha: new Date().toISOString(), datos };
  if (imagenes && Object.keys(imagenes).length) respaldo.imagenes = imagenes;
  return respaldo;
}

/** Comprueba que un objeto leído de un archivo es un respaldo de esta app. Lanza un error legible si no. */
export function validarRespaldo(r) {
  if (!r || typeof r !== 'object' || r.formato !== FORMATO) throw new Error('El archivo no es un respaldo de esta app.');
  if (r.version > VERSION_FORMATO) throw new Error('El respaldo es de una versión más nueva de la app; actualiza la página.');
  if (!r.datos || typeof r.datos !== 'object') throw new Error('El respaldo está incompleto.');
  if (r.imagenes) {
    for (const [id, img] of Object.entries(r.imagenes)) {
      const n = Number(id);
      if (!Number.isInteger(n) || n < 1 || n > 54 || !/^data:image\//.test(img?.imagen ?? '') || !/^data:image\//.test(img?.miniatura ?? '')) {
        throw new Error(`La imagen de la carta ${id} del respaldo está dañada.`);
      }
    }
  }
  return r;
}

/**
 * Combina los datos actuales con los del respaldo.
 * - juegos guardados: se agregan los del respaldo; si ya existe uno con el mismo id, gana el del respaldo
 * - marcas de tableros: se agregan (por tablero)
 * - preferencias, juego actual, partida del cantador: solo se reemplazan si reemplazarActual es true
 * Devuelve { datos, resumen }.
 */
export function combinarDatos(actuales, delRespaldo, { reemplazarActual = false } = {}) {
  const datos = {};
  const juegosRespaldo = Array.isArray(delRespaldo.juegos) ? delRespaldo.juegos : [];
  const juegosActuales = Array.isArray(actuales.juegos) ? actuales.juegos : [];
  const ids = new Set(juegosRespaldo.map((j) => j.id));
  if (juegosRespaldo.length) datos.juegos = [...juegosRespaldo, ...juegosActuales.filter((j) => !ids.has(j.id))];

  if (delRespaldo.marcas && typeof delRespaldo.marcas === 'object') {
    datos.marcas = { ...(actuales.marcas ?? {}), ...delRespaldo.marcas };
  }

  // Fichas: se agregan las del respaldo sin duplicar ni sobrescribir las propias
  let fichasNuevas = 0;
  if (Array.isArray(delRespaldo.fichas)) {
    const propias = fichasConPredeterminada(actuales.fichas);
    const { fichas, agregadas } = combinarFichas(propias, delRespaldo.fichas.map(normalizarFicha).filter(Boolean));
    if (agregadas) datos.fichas = fichas;
    fichasNuevas = agregadas;
  }

  const reemplazados = [];
  if (reemplazarActual) {
    for (const clave of REEMPLAZABLES) {
      if (delRespaldo[clave] != null) {
        datos[clave] = delRespaldo[clave];
        reemplazados.push(clave);
      }
    }
  }

  return {
    datos,
    resumen: {
      juegosNuevos: juegosRespaldo.filter((j) => !juegosActuales.some((a) => a.id === j.id)).length,
      juegosActualizados: juegosRespaldo.filter((j) => juegosActuales.some((a) => a.id === j.id)).length,
      tablerosConMarcas: Object.keys(delRespaldo.marcas ?? {}).length,
      fichasNuevas,
      reemplazados,
    },
  };
}

/** ¿El respaldo trae algo que se pueda reemplazar (juego actual, preferencias, partida)? */
export const traeDatosActuales = (delRespaldo) => REEMPLAZABLES.some((c) => delRespaldo[c] != null);

export { COMBINABLES, REEMPLAZABLES };
