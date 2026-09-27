// Origen de las imágenes de las cartas:
//  - 'incluidas': vienen con la app en public/cartas (solo en la copia local; no se suben a git)
//  - 'navegador': el usuario las cargó desde su equipo y se guardan en IndexedDB
//  - 'ninguna':   no hay imágenes; se dibujan cartas provisionales con número y nombre
import { CARTAS, TOTAL_CARTAS, PROPORCION_CARTA, cartaPorId } from './cartas.js';

const DB = 'loteria-tableros';
const ALMACEN = 'cartas';
const ANCHO_IMPRESION = 800;
const ANCHO_MINIATURA = 220;

let fuente = 'ninguna';
const guardadas = new Map(); // id -> { imagen: Blob, miniatura: Blob }
const urlsMiniatura = new Map(); // id -> object URL
const cacheBytes = new Map(); // id -> Promise<Uint8Array>

// ── IndexedDB ────────────────────────────────────────────────────────────────
function abrirDb() {
  return new Promise((resolver, rechazar) => {
    const solicitud = indexedDB.open(DB, 1);
    solicitud.onupgradeneeded = () => solicitud.result.createObjectStore(ALMACEN);
    solicitud.onsuccess = () => resolver(solicitud.result);
    solicitud.onerror = () => rechazar(solicitud.error);
  });
}

async function transaccion(modo, trabajo) {
  const db = await abrirDb();
  try {
    return await new Promise((resolver, rechazar) => {
      const tx = db.transaction(ALMACEN, modo);
      const resultado = trabajo(tx.objectStore(ALMACEN));
      tx.oncomplete = () => resolver(resultado?.result ?? resultado);
      tx.onerror = () => rechazar(tx.error);
      tx.onabort = () => rechazar(tx.error);
    });
  } finally {
    db.close();
  }
}

function registrar(id, datos) {
  const anterior = guardadas.get(id);
  if (anterior?.urlGrande) URL.revokeObjectURL(anterior.urlGrande);
  guardadas.set(id, datos);
  if (urlsMiniatura.has(id)) URL.revokeObjectURL(urlsMiniatura.get(id));
  urlsMiniatura.set(id, URL.createObjectURL(datos.miniatura));
  cacheBytes.delete(id);
}

// ── Inicio ───────────────────────────────────────────────────────────────────
async function hayImagenesIncluidas() {
  try {
    const r = await fetch(CARTAS[0].imagen, { method: 'HEAD', cache: 'no-store' });
    // Algunos servidores responden index.html en lugar de 404: se comprueba que sea una imagen
    return r.ok && (r.headers.get('content-type') || '').startsWith('image/');
  } catch {
    return false;
  }
}

export async function iniciarImagenes() {
  if (await hayImagenesIncluidas()) {
    fuente = 'incluidas';
    return fuente;
  }
  try {
    let claves = [];
    let valores = [];
    await transaccion('readonly', (almacen) => {
      const k = almacen.getAllKeys();
      const v = almacen.getAll();
      k.onsuccess = () => (claves = k.result);
      v.onsuccess = () => (valores = v.result);
    });
    claves.forEach((id, i) => registrar(id, valores[i]));
  } catch (err) {
    console.warn('No se pudieron leer las imágenes guardadas', err);
  }
  fuente = guardadas.size ? 'navegador' : 'ninguna';
  return fuente;
}

// ── Consulta ─────────────────────────────────────────────────────────────────
export const fuenteImagenes = () => fuente;

export function cartasSinImagen() {
  if (fuente === 'incluidas') return [];
  return CARTAS.filter((c) => !guardadas.has(c.id)).map((c) => c.id);
}

/** URL de la miniatura para la vista previa, o null si la carta no tiene imagen. */
export function urlMiniatura(id) {
  if (fuente === 'incluidas') return cartaPorId(id).miniatura;
  return urlsMiniatura.get(id) ?? null;
}

/** URL de la imagen grande (para el cantador), o null si la carta no tiene imagen. */
export function urlImagen(id) {
  if (fuente === 'incluidas') return cartaPorId(id).imagen;
  const datos = guardadas.get(id);
  if (!datos) return null;
  if (!datos.urlGrande) datos.urlGrande = URL.createObjectURL(datos.imagen);
  return datos.urlGrande;
}

/** Bytes JPEG para el PDF, o null si la carta no tiene imagen. */
export function bytesImagen(id) {
  if (!cacheBytes.has(id)) {
    let promesa;
    if (fuente === 'incluidas') {
      promesa = fetch(cartaPorId(id).imagen).then((r) => {
        if (!r.ok) throw new Error(`No se pudo cargar la carta ${id}`);
        return r.arrayBuffer();
      });
    } else if (guardadas.has(id)) {
      promesa = guardadas.get(id).imagen.arrayBuffer();
    } else {
      return Promise.resolve(null);
    }
    promesa = promesa.then((b) => new Uint8Array(b));
    cacheBytes.set(id, promesa);
    promesa.catch(() => cacheBytes.delete(id));
  }
  return cacheBytes.get(id);
}

// ── Carga desde el equipo del usuario ────────────────────────────────────────
// El número de carta se toma del inicio del nombre: "1 el gallo.jpg", "06-la-sirena.png", "54.jpg"
function numeroDeArchivo(nombre) {
  const m = nombre.match(/^\s*0*(\d{1,2})(?!\d)/);
  const id = m ? Number(m[1]) : NaN;
  return id >= 1 && id <= TOTAL_CARTAS ? id : null;
}

// Recorta al centro con la proporción de las cartas y reduce al ancho indicado
async function reducir(bitmap, ancho) {
  let sw = bitmap.width;
  let sh = bitmap.height;
  if (sw / sh > PROPORCION_CARTA) sw = Math.round(sh * PROPORCION_CARTA);
  else sh = Math.round(sw / PROPORCION_CARTA);
  const sx = Math.round((bitmap.width - sw) / 2);
  const sy = Math.round((bitmap.height - sh) / 2);

  const w = Math.min(ancho, sw);
  const h = Math.round(w / PROPORCION_CARTA);
  const lienzo = document.createElement('canvas');
  lienzo.width = w;
  lienzo.height = h;
  const ctx = lienzo.getContext('2d');
  ctx.fillStyle = '#fff'; // fondo blanco para PNG con transparencia
  ctx.fillRect(0, 0, w, h);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, w, h);
  return new Promise((resolver, rechazar) =>
    lienzo.toBlob((b) => (b ? resolver(b) : rechazar(new Error('No se pudo procesar la imagen'))), 'image/jpeg', 0.85));
}

/**
 * Procesa los archivos elegidos, los guarda en IndexedDB y devuelve
 * { cargadas, ignorados, errores, bajaResolucion: [ids] }.
 */
export async function cargarArchivos(archivos, alProgresar) {
  const porId = new Map();
  let ignorados = 0;
  for (const archivo of archivos) {
    const esImagen = archivo.type.startsWith('image/') || /\.(jpe?g|png|webp)$/i.test(archivo.name);
    const id = esImagen ? numeroDeArchivo(archivo.name) : null;
    if (id) porId.set(id, archivo);
    else ignorados++;
  }

  let cargadas = 0;
  const errores = [];
  const bajaResolucion = [];
  let i = 0;
  for (const [id, archivo] of porId) {
    try {
      const bitmap = await createImageBitmap(archivo);
      if (bitmap.width < 500) bajaResolucion.push(id);
      const datos = {
        imagen: await reducir(bitmap, ANCHO_IMPRESION),
        miniatura: await reducir(bitmap, ANCHO_MINIATURA),
        nombreOriginal: archivo.name,
      };
      bitmap.close();
      await transaccion('readwrite', (almacen) => almacen.put(datos, id));
      registrar(id, datos);
      cargadas++;
    } catch (err) {
      console.error(err);
      errores.push(archivo.name);
    }
    alProgresar?.(++i / porId.size);
  }

  if (fuente !== 'incluidas' && guardadas.size) fuente = 'navegador';
  return { cargadas, ignorados, errores, bajaResolucion: bajaResolucion.sort((a, b) => a - b) };
}

// ── Respaldo ─────────────────────────────────────────────────────────────────
/** Número de cartas con imagen guardada en este navegador (las incluidas con la app no cuentan). */
export const imagenesGuardadas = () => guardadas.size;

const aDataUrl = (blob) => new Promise((resolver, rechazar) => {
  const lector = new FileReader();
  lector.onload = () => resolver(lector.result);
  lector.onerror = () => rechazar(lector.error);
  lector.readAsDataURL(blob);
});

/** { id: { imagen: dataURL, miniatura: dataURL } } de las imágenes guardadas en el navegador. */
export async function exportarImagenes() {
  const salida = {};
  for (const [id, d] of guardadas) {
    salida[id] = { imagen: await aDataUrl(d.imagen), miniatura: await aDataUrl(d.miniatura) };
  }
  return salida;
}

/** Guarda en IndexedDB las imágenes de un respaldo (ya validado). Devuelve cuántas se importaron. */
export async function importarImagenes(mapa) {
  let cuantas = 0;
  for (const [clave, img] of Object.entries(mapa)) {
    const id = Number(clave);
    const datos = {
      imagen: await (await fetch(img.imagen)).blob(),
      miniatura: await (await fetch(img.miniatura)).blob(),
      nombreOriginal: `respaldo-${id}`,
    };
    await transaccion('readwrite', (almacen) => almacen.put(datos, id));
    registrar(id, datos);
    cuantas++;
  }
  if (fuente !== 'incluidas' && guardadas.size) fuente = 'navegador';
  return cuantas;
}

export async function borrarImagenes() {
  await transaccion('readwrite', (almacen) => almacen.clear());
  urlsMiniatura.forEach((url) => URL.revokeObjectURL(url));
  urlsMiniatura.clear();
  guardadas.forEach((d) => d.urlGrande && URL.revokeObjectURL(d.urlGrande));
  guardadas.clear();
  cacheBytes.clear();
  if (fuente !== 'incluidas') fuente = 'ninguna';
}
