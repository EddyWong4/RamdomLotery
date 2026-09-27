// Fichas (marcadores) para jugar en pantalla: tipos, dibujo en SVG, validación y archivo de exportación.
// Todo lo que viene de un archivo importado se valida antes de usarse (colores, tipos, imágenes).

export const TIPOS = {
  circulo: { nombre: 'Círculo', usaColor: true },
  frijol: { nombre: 'Frijol', usaColor: true },
  corcholata: { nombre: 'Corcholata', usaColor: true },
  moneda: { nombre: 'Moneda', usaColor: true },
  tache: { nombre: 'Tache (X)', usaColor: true },
  palomita: { nombre: 'Palomita (✓)', usaColor: true },
  estrella: { nombre: 'Estrella', usaColor: true },
  emoji: { nombre: 'Emoji', usaColor: false },
  imagen: { nombre: 'Imagen propia', usaColor: false },
};

export const COLORES = ['#e63946', '#f77f00', '#f9c74f', '#2a9d8f', '#457b9d', '#6a4c93', '#7a4a1f', '#111111', '#ffffff'];

export const ID_PREDETERMINADA = 'predeterminada';
export const FICHAS_INICIALES = [
  { id: ID_PREDETERMINADA, nombre: 'Círculo', tipo: 'circulo', color: '#e63946', tamano: 60, opacidad: 0.85 },
  { id: 'frijol', nombre: 'Frijol', tipo: 'frijol', color: '#7a4a1f', tamano: 58, opacidad: 1 },
  { id: 'corcholata', nombre: 'Corcholata', tipo: 'corcholata', color: '#c9ccd1', tamano: 62, opacidad: 1 },
  { id: 'moneda', nombre: 'Moneda', tipo: 'moneda', color: '#d4a017', tamano: 60, opacidad: 1 },
  { id: 'tache', nombre: 'Tache', tipo: 'tache', color: '#111111', tamano: 80, opacidad: 0.9 },
];

export const FORMATO_ARCHIVO = 'loteria-fichas';
const MAX_FICHAS = 40;
const MAX_IMAGEN = 200 * 1024; // caracteres del dataURL

const HEX = /^#[0-9a-f]{6}$/i;
const IMAGEN = /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/;

const escapar = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const limitar = (x, min, max, def) => (Number.isFinite(Number(x)) ? Math.min(max, Math.max(min, Number(x))) : def);

export const nuevoId = () => `f${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

/**
 * Normaliza una ficha: devuelve una ficha válida o null si no se puede usar.
 * Los valores fuera de rango se ajustan; tipos, colores o imágenes inválidos la descartan.
 */
export function normalizarFicha(f) {
  if (!f || typeof f !== 'object' || !TIPOS[f.tipo]) return null;
  const ficha = {
    id: typeof f.id === 'string' && /^[\w-]{1,40}$/.test(f.id) ? f.id : nuevoId(),
    nombre: String(f.nombre ?? TIPOS[f.tipo].nombre).trim().slice(0, 30) || TIPOS[f.tipo].nombre,
    tipo: f.tipo,
    tamano: limitar(f.tamano, 30, 100, 60),
    opacidad: limitar(f.opacidad, 0.2, 1, 1),
  };
  if (TIPOS[f.tipo].usaColor) {
    if (!HEX.test(f.color ?? '')) return null;
    ficha.color = f.color.toLowerCase();
  }
  if (f.tipo === 'emoji') {
    const emoji = [...String(f.emoji ?? '').trim()].slice(0, 4).join('');
    if (!emoji) return null;
    ficha.emoji = emoji;
  }
  if (f.tipo === 'imagen') {
    if (typeof f.imagen !== 'string' || f.imagen.length > MAX_IMAGEN || !IMAGEN.test(f.imagen)) return null;
    ficha.imagen = f.imagen;
  }
  return ficha;
}

// ── Dibujo ───────────────────────────────────────────────────────────────────
function estrella(puntas, rExt, rInt, giro = -90) {
  const pts = [];
  for (let i = 0; i < puntas * 2; i++) {
    const r = i % 2 ? rInt : rExt;
    const a = ((giro + (i * 180) / puntas) * Math.PI) / 180;
    pts.push(`${(50 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
}

const BRILLO = '<circle cx="36" cy="34" r="11" fill="#fff" opacity=".35"/>';

function cuerpo(f) {
  const c = f.color;
  switch (f.tipo) {
    case 'circulo':
      return `<circle cx="50" cy="50" r="46" fill="${c}"/><circle cx="50" cy="50" r="46" fill="none" stroke="#000" stroke-opacity=".2" stroke-width="3"/>${BRILLO}`;
    case 'frijol':
      return `<g transform="rotate(-28 50 50)"><path d="M10 50c0-20 18-30 40-30s40 8 40 26c0 12-10 12-18 10s-12 4-22 4C28 60 10 68 10 50z" fill="${c}"/>` +
        '<path d="M40 44c4-3 10-3 14 0" stroke="#000" stroke-opacity=".35" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        '<ellipse cx="32" cy="36" rx="10" ry="5" fill="#fff" opacity=".3"/></g>';
    case 'corcholata':
      return `<polygon points="${estrella(21, 48, 42)}" fill="${c}"/><circle cx="50" cy="50" r="36" fill="${c}"/>` +
        '<circle cx="50" cy="50" r="36" fill="#fff" opacity=".22"/><circle cx="50" cy="50" r="36" fill="none" stroke="#000" stroke-opacity=".25" stroke-width="2"/>';
    case 'moneda':
      return `<circle cx="50" cy="50" r="46" fill="${c}"/><circle cx="50" cy="50" r="37" fill="none" stroke="#000" stroke-opacity=".28" stroke-width="3"/>` +
        '<text x="50" y="52" font-size="44" font-weight="900" font-family="Georgia,serif" text-anchor="middle" dominant-baseline="middle" fill="#000" fill-opacity=".3">$</text>' + BRILLO;
    case 'tache':
      return `<path d="M18 18L82 82M82 18L18 82" stroke="${c}" stroke-width="16" stroke-linecap="round"/>`;
    case 'palomita':
      return `<path d="M14 54L40 78L86 22" stroke="${c}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
    case 'estrella':
      return `<polygon points="${estrella(5, 48, 20)}" fill="${c}" stroke="#000" stroke-opacity=".2" stroke-width="2" stroke-linejoin="round"/>`;
    case 'emoji':
      return `<text x="50" y="54" font-size="76" text-anchor="middle" dominant-baseline="middle">${escapar(f.emoji)}</text>`;
    case 'imagen':
      return `<image href="${f.imagen}" x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid meet"/>`;
    default:
      return '';
  }
}

/** SVG de la ficha. `vista` ignora tamaño y opacidad (para las muestras del selector). */
export function svgFicha(ficha, { vista = false } = {}) {
  const f = normalizarFicha(ficha) ?? FICHAS_INICIALES[0];
  const estilo = vista ? '' : ` style="width:${f.tamano}%;opacity:${f.opacidad}"`;
  return `<svg class="ficha" viewBox="0 0 100 100" aria-hidden="true"${estilo}>${cuerpo(f)}</svg>`;
}

// ── Archivo de fichas ────────────────────────────────────────────────────────
export function crearArchivoFichas(fichas) {
  return { formato: FORMATO_ARCHIVO, version: 1, fecha: new Date().toISOString(), fichas: fichas.map(normalizarFicha).filter(Boolean) };
}

/** Lee un archivo de fichas. Devuelve { fichas, descartadas }; lanza un error legible si no es un archivo válido. */
export function leerArchivoFichas(archivo) {
  if (!archivo || archivo.formato !== FORMATO_ARCHIVO || !Array.isArray(archivo.fichas)) {
    throw new Error('El archivo no es un archivo de fichas de esta app.');
  }
  if (archivo.version > 1) throw new Error('El archivo de fichas es de una versión más nueva de la app.');
  const fichas = archivo.fichas.slice(0, MAX_FICHAS).map(normalizarFicha).filter(Boolean);
  return { fichas, descartadas: archivo.fichas.length - fichas.length };
}

/**
 * Agrega fichas importadas a las existentes. Las que ya existen con el mismo contenido no se duplican;
 * si comparten id pero son distintas, la importada recibe un id nuevo (nunca se sobrescribe una ficha tuya).
 */
export function combinarFichas(actuales, importadas) {
  // Apariencia de la ficha (sin id ni nombre) y sin depender del orden de las propiedades:
  // dos fichas que se ven igual son la misma, aunque se llamen distinto
  const firma = ({ id, nombre, ...resto }) => JSON.stringify(Object.keys(resto).sort().map((k) => [k, resto[k]]));
  const firmas = new Set(actuales.map(firma));
  const ids = new Set(actuales.map((f) => f.id));
  const nombres = new Set(actuales.map((f) => f.nombre));
  const resultado = [...actuales];
  let agregadas = 0;
  for (const f of importadas) {
    if (firmas.has(firma(f)) || resultado.length >= MAX_FICHAS) continue;
    const ficha = { ...f, id: ids.has(f.id) ? nuevoId() : f.id };
    // Nombre repetido (p. ej. otro "Círculo" de distinto color): se numera para distinguirlas
    if (nombres.has(ficha.nombre)) {
      let i = 2;
      while (nombres.has(`${f.nombre.slice(0, 26)} ${i}`)) i++;
      ficha.nombre = `${f.nombre.slice(0, 26)} ${i}`;
    }
    resultado.push(ficha);
    ids.add(ficha.id);
    nombres.add(ficha.nombre);
    firmas.add(firma(f));
    agregadas++;
  }
  return { fichas: resultado, agregadas };
}

/** Lista de fichas guardadas, con la predeterminada siempre presente. */
export function fichasConPredeterminada(guardadas) {
  const validas = Array.isArray(guardadas) ? guardadas.map(normalizarFicha).filter(Boolean) : [];
  if (!validas.length) return FICHAS_INICIALES.map(normalizarFicha);
  if (!validas.some((f) => f.id === ID_PREDETERMINADA)) validas.unshift(normalizarFicha(FICHAS_INICIALES[0]));
  return validas;
}
