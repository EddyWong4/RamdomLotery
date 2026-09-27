// Navegación entre vistas con el hash de la URL (#/, #/cantar, #/jugar?...): funciona en GitHub Pages sin servidor.

const vistas = new Map(); // nombre -> { alEntrar, alSalir }
let actual = null;

/** Registra una vista: su <main data-vista="nombre"> se muestra cuando la ruta coincide. */
export function registrarVista(nombre, { alEntrar, alSalir } = {}) {
  vistas.set(nombre, { alEntrar, alSalir });
}

/** Ruta actual: { nombre, parametros: URLSearchParams } */
export function rutaActual() {
  const [camino, consulta = ''] = location.hash.replace(/^#\/?/, '').split('?');
  const nombre = camino && vistas.has(camino) ? camino : 'tableros';
  return { nombre, parametros: new URLSearchParams(consulta) };
}

function mostrar() {
  const { nombre, parametros } = rutaActual();
  if (actual && actual !== nombre) vistas.get(actual)?.alSalir?.();

  document.querySelectorAll('[data-vista]').forEach((el) => (el.hidden = el.dataset.vista !== nombre));
  document.querySelectorAll('[data-ruta]').forEach((a) => {
    const activa = a.dataset.ruta === nombre;
    a.classList.toggle('activa', activa);
    if (activa) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });

  const cambio = actual !== nombre;
  actual = nombre;
  vistas.get(nombre)?.alEntrar?.(parametros, cambio);
  if (cambio) window.scrollTo(0, 0);
}

export function iniciarRutas() {
  window.addEventListener('hashchange', mostrar);
  mostrar();
}
