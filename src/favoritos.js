// Tableros favoritos: hechos a mano o guardados desde un juego generado.
// Funciones puras: validar un tablero, completarlo al azar y armar un "juego" con varios favoritos
// para imprimirlos, simularlos, verificarlos en el cantador y compartirlos.
import { TOTAL_CARTAS } from './cartas.js';
import { TAMANOS, calcularEstadisticas } from './generador.js';

export const MAX_FAVORITOS = 200;
export const ETIQUETA_JUEGO_MANUAL = 'FAVORITOS';

export const nuevoIdFavorito = () => `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

/**
 * Revisa las cartas de un tablero de n × n (null = casilla vacía).
 * Regla: cada carta una vez; se permite UNA carta repetida exactamente dos veces (tablero doble).
 * Devuelve { ok, faltan, error, doble }.
 */
export function validarCartas(cartas, n) {
  if (!TAMANOS.includes(n) || !Array.isArray(cartas) || cartas.length !== n * n) {
    return { ok: false, faltan: 0, error: 'Tamaño de tablero inválido', doble: null };
  }
  const faltan = cartas.filter((c) => c == null).length;
  const veces = new Map();
  for (const c of cartas) {
    if (c == null) continue;
    if (!Number.isInteger(c) || c < 1 || c > TOTAL_CARTAS) return { ok: false, faltan, error: `Carta inválida: ${c}`, doble: null };
    veces.set(c, (veces.get(c) ?? 0) + 1);
  }
  const repetidas = [...veces].filter(([, v]) => v > 1);
  if (repetidas.some(([, v]) => v > 2)) {
    const [c] = repetidas.find(([, v]) => v > 2);
    return { ok: false, faltan, error: `La carta ${c} está más de 2 veces`, doble: null };
  }
  if (repetidas.length > 1) {
    return { ok: false, faltan, error: `Solo una carta puede repetirse (se repiten ${repetidas.map(([c]) => c).join(' y ')})`, doble: null };
  }
  const doble = repetidas.length ? { carta: repetidas[0][0] } : null;
  if (faltan) return { ok: false, faltan, error: `Faltan ${faltan} casilla${faltan > 1 ? 's' : ''}`, doble };
  return { ok: true, faltan: 0, error: null, doble };
}

/** Llena las casillas vacías con cartas al azar que no estén ya en el tablero. */
export function completarAlAzar(cartas, rng = Math.random) {
  const usadas = new Set(cartas.filter((c) => c != null));
  const libres = [];
  for (let id = 1; id <= TOTAL_CARTAS; id++) if (!usadas.has(id)) libres.push(id);
  for (let i = libres.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [libres[i], libres[j]] = [libres[j], libres[i]];
  }
  return cartas.map((c) => (c == null ? libres.pop() : c));
}

/** Normaliza un favorito (de almacenamiento o de un respaldo). Devuelve null si no es válido. */
export function normalizarFavorito(f) {
  if (!f || typeof f !== 'object') return null;
  const n = Number(f.tamano);
  const cartas = Array.isArray(f.cartas) ? f.cartas.map(Number) : null;
  const v = cartas && validarCartas(cartas, n);
  if (!v?.ok) return null;
  return {
    id: typeof f.id === 'string' && /^[\w-]{1,40}$/.test(f.id) ? f.id : nuevoIdFavorito(),
    nombre: String(f.nombre ?? '').trim().slice(0, 40) || 'Tablero sin nombre',
    tamano: n,
    cartas,
    doble: v.doble,
    origen: typeof f.origen === 'string' ? f.origen.slice(0, 80) : 'manual',
    creado: typeof f.creado === 'string' ? f.creado : new Date().toISOString(),
  };
}

/** Clave que identifica un tablero de un juego generado (para saber si ya es favorito). */
export const origenDeTablero = (juego, tablero) =>
  `${juego.semilla}|${juego.tamano}|${juego.posicionDoble ?? '-'}|${tablero.numero}`;

/** Favorito a partir de un tablero de un juego generado. */
export function favoritoDesdeTablero(juego, tablero) {
  const nombre = juego.manual
    ? `Tablero Nº ${String(tablero.numero).padStart(3, '0')}`
    : `Juego ${juego.semilla} · Nº ${String(tablero.numero).padStart(3, '0')}`;
  return normalizarFavorito({
    id: nuevoIdFavorito(),
    nombre,
    tamano: juego.tamano,
    cartas: tablero.cartas,
    origen: juego.manual ? 'manual' : origenDeTablero(juego, tablero),
  });
}

/**
 * Arma un juego con favoritos del mismo tamaño, para usar todo lo demás (PDF, simulador, cantador,
 * compartir). No tiene código de juego: `manual: true`, y sus tableros no se pueden regenerar.
 */
export function juegoDesdeFavoritos(favoritos) {
  if (!favoritos.length) throw new Error('Elige al menos un tablero favorito');
  const tamano = favoritos[0].tamano;
  if (favoritos.some((f) => f.tamano !== tamano)) throw new Error('Los tableros deben ser del mismo tamaño');
  const tableros = favoritos.map((f, i) => {
    const t = { numero: i + 1, cartas: [...f.cartas], favorito: f.id, nombre: f.nombre };
    if (f.doble) t.doble = { carta: f.doble.carta };
    return t;
  });
  return {
    id: `${Date.now()}`,
    manual: true,
    tamano,
    posicionDoble: null,
    semilla: ETIQUETA_JUEGO_MANUAL,
    generados: tableros.length,
    tableros,
    estadisticas: calcularEstadisticas(tableros),
    creado: new Date().toISOString(),
  };
}

/** Agrega favoritos de un respaldo sin duplicar (mismo id o mismas cartas) ni pasar del máximo. */
export function combinarFavoritos(actuales, importados) {
  const lista = [...actuales];
  const ids = new Set(lista.map((f) => f.id));
  const firmas = new Set(lista.map((f) => `${f.tamano}:${f.cartas.join('.')}`));
  let agregados = 0;
  for (const bruto of importados) {
    const f = normalizarFavorito(bruto);
    if (!f || lista.length >= MAX_FAVORITOS) continue;
    const firma = `${f.tamano}:${f.cartas.join('.')}`;
    if (firmas.has(firma)) continue;
    if (ids.has(f.id)) f.id = nuevoIdFavorito();
    lista.push(f);
    ids.add(f.id);
    firmas.add(firma);
    agregados++;
  }
  return { favoritos: lista, agregados };
}
