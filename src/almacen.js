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

/** Todos los datos guardados por la app (para el respaldo): { clave: valor } */
export function leerTodo() {
  const datos = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const clave = localStorage.key(i);
      if (clave?.startsWith(PREFIJO)) datos[clave.slice(PREFIJO.length)] = leer(clave.slice(PREFIJO.length), null);
    }
  } catch {
    // almacenamiento bloqueado: respaldo vacío
  }
  return datos;
}

/** Escribe varias claves a la vez; devuelve false si alguna no se pudo guardar. */
export function escribirTodo(datos) {
  return Object.entries(datos).every(([clave, valor]) => escribir(clave, valor));
}

export const cargarPreferencias =(porDefecto) => ({ ...porDefecto, ...leer('preferencias', {}) });
export const guardarPreferencias = (prefs) => escribir('preferencias', prefs);

export const cargarJuegoActual = () => leer('juego-actual', null);
export const guardarJuegoActual = (juego) => escribir('juego-actual', juego);

export const listarJuegos = () => leer('juegos', []);

// Marcas del jugador en cada tablero compartido: { clave: [índices de casillas] }
export const cargarMarcas = (clave) => leer('marcas', {})[clave] ?? [];
export function guardarMarcas(clave, indices) {
  const todas = leer('marcas', {});
  if (indices.length) todas[clave] = indices;
  else delete todas[clave];
  return escribir('marcas', todas);
}

// Fichas (marcadores) del jugador y preferencias de la vista Jugar
export const cargarFichas = () => leer('fichas', null);
export const guardarFichas = (fichas) => escribir('fichas', fichas);
export const cargarFichaActiva = () => leer('ficha-activa', null);
export const guardarFichaActiva = (id) => escribir('ficha-activa', id);
export const cargarPreferenciasJugador = (porDefecto) => ({ ...porDefecto, ...leer('jugador', {}) });
export const guardarPreferenciasJugador = (prefs) => escribir('jugador', prefs);

// Tema de color elegido
export const cargarTema = () => leer('tema', null);
export const guardarTema = (id) => escribir('tema', id);
// Aviso de que la app pronto tendrá un pago mínimo: una vez cerrado ya no se muestra arriba
export const avisoPagoCerrado = () => leer('aviso-pago-cerrado', false);
export const cerrarAvisoPago = () => escribir('aviso-pago-cerrado', true);

export const cargarFondoDecorativo = () => leer('fondo-decorativo', true);
export const guardarFondoDecorativo = (activo) => escribir('fondo-decorativo', !!activo);

// Tableros favoritos (hechos a mano o guardados desde un juego)
export const cargarFavoritos = () => leer('favoritos', []);
export const guardarFavoritos = (favoritos) => escribir('favoritos', favoritos);

// Último link de tableros abierto en este dispositivo (para la pestaña "Jugar")
export const cargarUltimoJugar = () => leer('ultimo-jugar', null);
export const guardarUltimoJugar = (hash) => escribir('ultimo-jugar', hash);

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
