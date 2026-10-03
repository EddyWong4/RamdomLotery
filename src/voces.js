// Voces grabadas de las cartas: cada persona graba su voz (el nombre o el verso de cada carta).
// Se guardan solo en este navegador (IndexedDB, base propia) y nunca se suben a internet.
// El cantador las usa en lugar de la voz del navegador; si falta una carta, esa la dice el navegador.
import { CARTAS, TOTAL_CARTAS, cartaPorId } from './cartas.js';
import { crearZip } from './zip.js';
import { wav } from './sonidos.js';

const DB = 'loteria-voces';
const ALMACEN = 'voces';
/** Segundos máximos por grabación (una carta se canta en 1 a 3 segundos). */
export const DURACION_MAXIMA = 6;

const voces = new Map(); // id -> { blob, url }

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

function registrar(id, blob) {
  const anterior = voces.get(id);
  if (anterior) URL.revokeObjectURL(anterior.url);
  voces.set(id, { blob, url: URL.createObjectURL(blob) });
}

/** Carga las grabaciones guardadas en este navegador. */
export async function iniciarVoces() {
  if (typeof indexedDB === 'undefined') return;
  try {
    const db = await abrirDb();
    await new Promise((resolver, rechazar) => {
      const tx = db.transaction(ALMACEN, 'readonly');
      const cursor = tx.objectStore(ALMACEN).openCursor();
      cursor.onsuccess = () => {
        const c = cursor.result;
        if (!c) return;
        if (c.value instanceof Blob) registrar(Number(c.key), c.value);
        c.continue();
      };
      tx.oncomplete = resolver;
      tx.onerror = () => rechazar(tx.error);
    });
    db.close();
  } catch (err) {
    console.error('No se pudieron leer las voces grabadas', err);
  }
}

export const tieneVoz = (id) => voces.has(id);
export const vocesGrabadas = () => voces.size;
export const urlVoz = (id) => voces.get(id)?.url ?? null;

export async function guardarVoz(id, blob) {
  await transaccion('readwrite', (almacen) => almacen.put(blob, id));
  registrar(id, blob);
}

export async function borrarVoz(id) {
  await transaccion('readwrite', (almacen) => almacen.delete(id));
  const v = voces.get(id);
  if (v) URL.revokeObjectURL(v.url);
  voces.delete(id);
}

export async function borrarTodas() {
  await transaccion('readwrite', (almacen) => almacen.clear());
  voces.forEach((v) => URL.revokeObjectURL(v.url));
  voces.clear();
}

// ── Reproducción ─────────────────────────────────────────────────────────────
// Un solo reproductor: el celular solo deja sonar audio sin un toque si ese reproductor ya sonó tras un toque
let reproductor = null;
let desbloqueado = false;
const elemento = () => (reproductor ??= new window.Audio());

/** Se llama en un toque del usuario para que después las voces suenen solas (modo automático). */
export function despertarVoz() {
  if (desbloqueado || typeof window === 'undefined' || typeof window.Audio !== 'function') return;
  desbloqueado = true;
  const audio = elemento();
  if (!audio.src) {
    const silencio = URL.createObjectURL(new Blob([wav(new Float32Array(400))], { type: 'audio/wav' }));
    audio.src = silencio;
  }
  audio.muted = true;
  audio.play()?.then(() => { audio.pause(); audio.muted = false; }).catch(() => { audio.muted = false; });
}

/** Reproduce la grabación de la carta. Devuelve false si no hay. `alTerminar` se llama al acabar (o si falla). */
export function reproducirVoz(id, alTerminar = null) {
  const url = urlVoz(id);
  if (!url) return false;
  const audio = elemento();
  audio.onended = () => alTerminar?.();
  audio.onerror = () => alTerminar?.();
  audio.muted = false;
  audio.src = url;
  audio.play()?.catch(() => alTerminar?.());
  return true;
}

export function detenerVoz() {
  if (!reproductor) return;
  reproductor.onended = null;
  reproductor.onerror = null;
  reproductor.pause();
}

// ── Grabación ────────────────────────────────────────────────────────────────
/** El micrófono solo funciona en https (o localhost) y con MediaRecorder. */
export const puedeGrabar = () =>
  typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof window.MediaRecorder === 'function';

/** Formato que el navegador sabe grabar: webm/opus en Chrome y Firefox, mp4/aac en Safari. */
export function tipoGrabacion() {
  const opciones = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus'];
  return opciones.find((t) => window.MediaRecorder.isTypeSupported?.(t)) ?? '';
}

/**
 * Abre el micrófono (el navegador pide permiso la primera vez) y devuelve una grabadora:
 * grabar() empieza y resuelve con el Blob al detener(); cerrar() apaga el micrófono.
 */
export async function abrirMicrofono() {
  const flujo = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
  let grabadora = null;
  return {
    grabar() {
      return new Promise((resolver, rechazar) => {
        const tipo = tipoGrabacion();
        grabadora = new window.MediaRecorder(flujo, tipo ? { mimeType: tipo } : undefined);
        const partes = [];
        grabadora.ondataavailable = (e) => e.data.size && partes.push(e.data);
        grabadora.onstop = () => resolver(new Blob(partes, { type: grabadora.mimeType || tipo || 'audio/webm' }));
        grabadora.onerror = (e) => rechazar(e.error ?? new Error('No se pudo grabar'));
        grabadora.start();
      });
    },
    detener() {
      if (grabadora?.state === 'recording') grabadora.stop();
    },
    grabando: () => grabadora?.state === 'recording',
    cerrar() {
      this.detener();
      flujo.getTracks().forEach((t) => t.stop());
    },
  };
}

// ── Archivos ─────────────────────────────────────────────────────────────────
const TIPOS_POR_EXTENSION = { webm: 'audio/webm', ogg: 'audio/ogg', m4a: 'audio/mp4', mp4: 'audio/mp4', aac: 'audio/aac', mp3: 'audio/mpeg', wav: 'audio/wav' };

export function extensionDe(tipo = '') {
  if (/mp4|aac|m4a/.test(tipo)) return 'm4a';
  if (/ogg/.test(tipo)) return 'ogg';
  if (/wav/.test(tipo)) return 'wav';
  if (/mpeg|mp3/.test(tipo)) return 'mp3';
  return 'webm';
}

/** El número de carta va al inicio del nombre: "1 el gallo.m4a", "06-la-sirena.webm", "54.mp3" */
export function numeroDeArchivo(nombre) {
  const m = String(nombre).match(/^\s*0*(\d{1,2})(?!\d)/);
  const id = m ? Number(m[1]) : NaN;
  return id >= 1 && id <= TOTAL_CARTAS ? id : null;
}

const sinAcentos = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
export const nombreArchivoVoz = (id, tipo) => `${String(id).padStart(2, '0')} ${sinAcentos(cartaPorId(id).nombre)}.${extensionDe(tipo)}`;

/** ZIP con todas las grabaciones, cada una con el número de la carta al inicio (se puede volver a importar). */
export async function exportarZip() {
  const archivos = [];
  for (const c of CARTAS) {
    const v = voces.get(c.id);
    if (v) archivos.push({ nombre: nombreArchivoVoz(c.id, v.blob.type), bytes: new Uint8Array(await v.blob.arrayBuffer()) });
  }
  return new Blob([crearZip(archivos)], { type: 'application/zip' });
}

/** Guarda audios elegidos por la persona (el número de carta al inicio del nombre). Devuelve { cargadas, ignorados }. */
export async function importarArchivos(archivos) {
  let cargadas = 0;
  let ignorados = 0;
  for (const archivo of archivos) {
    const id = numeroDeArchivo(archivo.name);
    const extension = archivo.name.split('.').pop().toLowerCase();
    const tipo = archivo.type || TIPOS_POR_EXTENSION[extension] || '';
    if (!id || !tipo.startsWith('audio/')) { ignorados++; continue; }
    await guardarVoz(id, archivo.type ? archivo : new Blob([archivo], { type: tipo }));
    cargadas++;
  }
  return { cargadas, ignorados };
}
