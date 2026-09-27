// Contador de visitas con GoatCounter, sin cargar su script: la visita se registra con su "píxel"
// (una petición a /count) y el total se lee de /counter/<ruta>.json. Sin cookies y sin datos personales.
// Se cuenta una vez por cada vez que se abre la app (no por cada cambio de sección).
import { GOATCOUNTER } from './config.js';

const CODIGO_VALIDO = /^[a-z0-9-]{1,50}$/;
const LOCALES = /^(localhost|127\.0\.0\.1|\[::1\]|.*\.localhost|.*\.test)$/;

export const contadorActivo = (codigo = GOATCOUNTER) => CODIGO_VALIDO.test(codigo);

/** No se cuentan las pruebas en la computadora de desarrollo. */
export const debeContar = (hostname) => !LOCALES.test(hostname);

/** URL del píxel que registra una visita. */
export function urlRegistro(codigo, { ruta, titulo = '', referencia = '', pantalla = '' }) {
  const p = new URLSearchParams({ p: ruta, t: titulo, r: referencia, s: pantalla, rnd: Math.random().toString(36).slice(2, 8) });
  return `https://${codigo}.goatcounter.com/count?${p}`;
}

/** URL con el total de visitas de una ruta (JSON). */
export const urlTotal = (codigo, ruta) => `https://${codigo}.goatcounter.com/counter/${encodeURIComponent(ruta)}.json`;

/** GoatCounter devuelve el número como texto con separadores ("1,234" o "1 234"); se vuelve número. */
export function leerTotal(json) {
  const n = Number(String(json?.count ?? '').replace(/[^\d]/g, ''));
  return Number.isFinite(n) && String(json?.count ?? '').match(/\d/) ? n : null;
}

/**
 * Registra la visita y muestra el total en `elemento`. Si no hay código, estás en localhost,
 * sin internet o el servicio no responde, no pasa nada (el contador simplemente no aparece).
 */
export async function iniciarVisitas(elemento, win = window, codigo = GOATCOUNTER) {
  if (!contadorActivo(codigo)) return;
  const ruta = win.location.pathname || '/';
  if (debeContar(win.location.hostname)) {
    const url = urlRegistro(codigo, {
      ruta,
      titulo: win.document.title,
      referencia: win.document.referrer,
      pantalla: `${win.screen?.width ?? 0},${win.screen?.height ?? 0},${win.devicePixelRatio ?? 1}`,
    });
    // sendBeacon no bloquea la página; si no existe, una imagen invisible hace lo mismo
    if (!win.navigator.sendBeacon?.(url)) new win.Image().src = url;
  }
  try {
    const r = await fetch(urlTotal(codigo, ruta), { cache: 'no-store' });
    if (!r.ok) return;
    const total = leerTotal(await r.json());
    if (total == null || !elemento) return;
    elemento.textContent = `👁 ${total.toLocaleString('es-MX')} ${total === 1 ? 'visita' : 'visitas'}`;
    elemento.title = 'Visitas a la página (contadas sin cookies con GoatCounter)';
    elemento.hidden = false;
  } catch {
    // sin internet o contador no permitido: no se muestra
  }
}
