// Persistencia local en el navegador (localStorage). Sin base de datos ni servidor.
// Todo va envuelto en try/catch: en modo privado o con el almacenamiento bloqueado la app sigue funcionando.

const PREFIJO = 'loteria-tableros:';
const MAX_JUEGOS = 30;

function leer(clave, porDefecto) {
  try {
    const valor = localStorage.getItem(PREFIJO + clave);
    return valor ? JSON.parse(valor) : porDefecto;
  } catch {
    return porDefecto;
  }
}

function escribir(clave, valor) {
  try {
    localStorage.setItem(PREFIJO + clave, JSON.stringify(valor));
    return true;
  } catch {
    return false;
  }
}

export const cargarPreferencias = (porDefecto) => ({ ...porDefecto, ...leer('preferencias', {}) });
export const guardarPreferencias = (prefs) => escribir('preferencias', prefs);

export const cargarJuegoActual = () => leer('juego-actual', null);
export const guardarJuegoActual = (juego) => escribir('juego-actual', juego);

export const listarJuegos = () => leer('juegos', []);

export const cargarPartida = () => leer('partida', null);
export const guardarPartida = (partida) => escribir('partida', partida);

export const cargarPreferenciasCantador = (porDefecto) => ({ ...porDefecto, ...leer('cantador', {}) });
export const guardarPreferenciasCantador = (prefs) => escribir('cantador', prefs);

export function guardarJuego(juego) {
  const juegos = listarJuegos().filter((j) => j.id !== juego.id);
  juegos.unshift(juego);
  return escribir('juegos', juegos.slice(0, MAX_JUEGOS));
}

export function eliminarJuego(id) {
  return escribir('juegos', listarJuegos().filter((j) => j.id !== id));
}
