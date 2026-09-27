// Detecta el dispositivo para que la app se vea como una app nativa de cada uno:
// iPhone/iPad → estilo iOS, Android → estilo Material, computadora → diseño de escritorio.
// El resultado se pone en <html data-plataforma="ios|android|escritorio" data-instalada="si|no">
// y el CSS hace el resto. Para probar otro estilo: ?plataforma=ios (o android / escritorio) en la dirección.

export const PLATAFORMAS = ['ios', 'android', 'escritorio'];

/** Plataforma a partir del userAgent y del número de puntos táctiles (el iPad moderno se presenta como Mac). */
export function detectarPlataforma({ userAgent = '', maxTouchPoints = 0 } = {}) {
  if (/android/i.test(userAgent)) return 'android';
  if (/iphone|ipad|ipod/i.test(userAgent)) return 'ios';
  if (/macintosh/i.test(userAgent) && maxTouchPoints > 1) return 'ios';
  return 'escritorio';
}

/** ¿La app está abierta como app instalada (desde el ícono) y no dentro del navegador? */
export function estaInstalada(win = window) {
  return !!(win.matchMedia?.('(display-mode: standalone)').matches || win.navigator?.standalone);
}

export function aplicarPlataforma(win = window) {
  const forzada = new URLSearchParams(win.location.search).get('plataforma');
  const plataforma = PLATAFORMAS.includes(forzada) ? forzada : detectarPlataforma(win.navigator);
  const raiz = win.document.documentElement;
  raiz.dataset.plataforma = plataforma;
  raiz.dataset.instalada = estaInstalada(win) ? 'si' : 'no';
  return plataforma;
}
