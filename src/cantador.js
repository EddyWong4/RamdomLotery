// Vista "Cantar": canta las cartas una por una y verifica si un tablero ganó.
import { CARTAS, cartaPorId } from './cartas.js';
import * as almacen from './almacen.js';
import * as imagenes from './imagenes.js';
import { MODOS, verificarTablero, normalizarModo } from './reglas.js';
import { t as tr } from './i18n.js';
import { svgFicha } from './fichas.js';
import { sonidoInicio, sonidoFin, despertarAudio, duracion, MELODIA_INICIO } from './sonidos.js';
import { fichaActiva } from './mis-fichas.js';
import { nuevaPartida, siguiente, anterior, cartasCantadas, cartaActual, terminada, esPartidaValida } from './partida.js';

const PREFS_INICIALES = { intervalo: 3, voz: false, sonidos: true, modo: 'llena' };
/** Segundos entre cartas en automático; el botón del modo simple da vuelta en este orden. */
export const INTERVALOS = [3, 5, 7, 10, 15, 20];
// Un tiempo guardado que ya no está en la lista (p. ej. 8 de versiones anteriores) pasa al más cercano
const intervaloValido = (s) => (INTERVALOS.includes(s) ? s : INTERVALOS.reduce((a, b) => (Math.abs(b - s) < Math.abs(a - s) ? b : a), INTERVALOS[0]));
export const siguienteIntervalo = (s) => INTERVALOS[(INTERVALOS.indexOf(intervaloValido(s)) + 1) % INTERVALOS.length];

const $ = (sel) => document.querySelector(sel);
let el;
let prefs;
let partida;
let temporizador = null;
let pendiente = null; // voz o sonido programados (se cancelan al retroceder o salir)
let activa = false;
const oyentes = new Set(); // otras vistas que cantan con esta misma partida (la vista Jugar)
const avisarOyentes = (avanzo = false) => oyentes.forEach((fn) => fn({ avanzo }));

const escapar = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const numeroTablero = (n) => `Nº ${String(n).padStart(3, '0')}`;

function cartaHtml(id, clase = '') {
  const c = cartaPorId(id);
  const url = imagenes.urlMiniatura(id);
  return url
    ? `<img class="${clase}" src="${url}" alt="${escapar(c.nombre)}" title="${id}. ${escapar(c.nombre)}" loading="lazy">`
    : `<div class="carta-vacia ${clase}" title="${id}. ${escapar(c.nombre)}"><b>${id}</b><span>${escapar(c.nombre)}</span></div>`;
}

// ── Guardado ─────────────────────────────────────────────────────────────────
function guardar() {
  almacen.guardarPartida(partida);
}

function guardarPrefs() {
  almacen.guardarPreferenciasCantador(prefs);
}

// ── Voz (API del navegador, sin servidor) ────────────────────────────────────
const hayVoz = () => 'speechSynthesis' in window;

/** Dice el texto si la voz está activa. `alTerminar` se llama al acabar de hablar (o enseguida si no hay voz). */
function decir(texto, alTerminar = null) {
  if (!prefs.voz || !hayVoz()) {
    alTerminar?.();
    return;
  }
  speechSynthesis.cancel();
  const frase = new SpeechSynthesisUtterance(texto);
  if (alTerminar) {
    let listo = false;
    const una = () => { if (!listo) { listo = true; alTerminar(); } };
    frase.onend = una;
    frase.onerror = una;
    // Por si el navegador nunca avisa que terminó de hablar
    pendiente = setTimeout(una, 4000);
  }
  const voces = speechSynthesis.getVoices();
  frase.voice = voces.find((v) => v.lang === 'es-MX') ?? voces.find((v) => v.lang.startsWith('es')) ?? null;
  frase.lang = frase.voice?.lang ?? 'es-MX';
  speechSynthesis.speak(frase);
}

// ── Pintado ──────────────────────────────────────────────────────────────────
function pintarEscenario() {
  const id = cartaActual(partida);
  el.progreso.textContent = tr('Carta {n} de {t}', { n: partida.cantadas, t: partida.orden.length });
  el.codigo.textContent = tr('Partida {c}', { c: partida.semilla });
  el.anterior.disabled = partida.cantadas === 0;
  el.siguiente.disabled = terminada(partida);
  el.siguiente.textContent = partida.cantadas === 0 ? 'Empezar ▶' : terminada(partida) ? 'Se cantaron todas' : 'Siguiente carta ▶';

  if (!id) {
    el.cartaGrande.innerHTML = '<div class="carta-grande-inicio">¡Corre y se va!<small>Toca aquí o presiona “Empezar” para cantar la primera carta</small></div>';
    el.cartaNombre.textContent = '';
    el.cartaGrande.setAttribute('aria-label', 'Empezar la partida: cantar la primera carta');
    el.cartaGrande.classList.remove('terminada');
    return;
  }
  el.cartaGrande.classList.toggle('terminada', terminada(partida));
  el.cartaGrande.setAttribute('aria-label', terminada(partida) ? 'Se cantaron todas las cartas' : 'Sacar la siguiente carta');
  const c = cartaPorId(id);
  const url = imagenes.urlImagen(id);
  el.cartaGrande.innerHTML = url
    ? `<img src="${url}" alt="${escapar(c.nombre)}">`
    : `<div class="carta-vacia"><b>${id}</b><span>${escapar(c.nombre)}</span></div>`;
  el.cartaNombre.textContent = `${id}. ${c.nombre}`;
}

function pintarHistorial() {
  const orden = new Map(cartasCantadas(partida).map((id, i) => [id, i + 1]));
  const actual = cartaActual(partida);
  el.cuenta.textContent = `(${partida.cantadas})`;
  el.historial.innerHTML = CARTAS.map((c) => {
    const vez = orden.get(c.id);
    const clases = ['historial-carta', vez ? 'cantada' : '', c.id === actual ? 'actual' : ''].filter(Boolean).join(' ');
    return `<div class="${clases}">${cartaHtml(c.id)}${vez ? `<span class="orden">${vez}</span>` : ''}</div>`;
  }).join('');
}

function pintarAuto() {
  el.auto.textContent = temporizador ? '⏸ Pausar' : '▶ Automático';
  el.auto.classList.toggle('activo', !!temporizador);
  pintarSimple();
}

/** Nuevo tiempo entre cartas: se guarda y el automático sigue con el tiempo nuevo (sin cantar una carta extra). */
function cambiarIntervalo(segundos) {
  prefs.intervalo = intervaloValido(Number(segundos));
  guardarPrefs();
  el.intervalo.value = String(prefs.intervalo);
  if (temporizador) {
    clearInterval(temporizador);
    temporizador = setInterval(avanzar, prefs.intervalo * 1000);
  }
  pintarSimple();
  avisarOyentes();
}

// ── Modo simple: pantalla completa con la carta, las 3 anteriores y los controles ─
const modoSimple = () => !el.simple.hidden;

function pintarSimple() {
  if (!el?.simple || !modoSimple()) return;
  const id = cartaActual(partida);
  el.simpleProgreso.textContent = tr('Carta {n} de {t}', { n: partida.cantadas, t: partida.orden.length });
  if (!id) {
    el.simpleCarta.innerHTML = '<div class="carta-grande-inicio">¡Corre y se va!<small>Toca para cantar la primera carta</small></div>';
    el.simpleNombre.textContent = '';
  } else {
    const c = cartaPorId(id);
    const url = imagenes.urlImagen(id);
    el.simpleCarta.innerHTML = url
      ? `<img src="${url}" alt="${escapar(c.nombre)}">`
      : `<div class="carta-vacia"><b>${id}</b><span>${escapar(c.nombre)}</span></div>`;
    el.simpleNombre.textContent = `${id}. ${c.nombre}`;
  }
  el.simpleCarta.classList.toggle('terminada', terminada(partida));
  // Las 3 anteriores a la actual, de la más reciente a la más vieja
  const previas = cartasCantadas(partida).slice(0, -1).slice(-3).reverse();
  el.simpleRecientes.innerHTML = previas.map((x) => cartaHtml(x)).join('');
  el.simpleAnterior.disabled = partida.cantadas === 0;
  el.simpleSiguiente.disabled = terminada(partida);
  el.simpleSiguiente.querySelector('span').textContent = partida.cantadas === 0 ? 'Empezar' : terminada(partida) ? 'Se cantaron todas' : 'Siguiente';
  el.simpleAuto.setAttribute('aria-pressed', !!temporizador);
  el.simpleTiempoValor.textContent = `${prefs.intervalo} s`;
  el.simpleTiempo.setAttribute('aria-label', tr('Tiempo entre cartas: {s} segundos. Toca para cambiarlo', { s: prefs.intervalo }));
  el.simpleAuto.setAttribute('aria-label', temporizador ? 'Pausar el modo automático' : 'Cantar automáticamente');
}

// Mientras se canta en modo simple la pantalla no se apaga (si el navegador lo permite)
let bloqueoPantalla = null;
async function mantenerPantalla(encendida) {
  try {
    if (encendida && 'wakeLock' in navigator && !bloqueoPantalla) {
      bloqueoPantalla = await navigator.wakeLock.request('screen');
      bloqueoPantalla.addEventListener('release', () => (bloqueoPantalla = null));
    } else if (!encendida && bloqueoPantalla) {
      await bloqueoPantalla.release();
      bloqueoPantalla = null;
    }
  } catch {
    // sin permiso o sin soporte: la pantalla se comporta como siempre
  }
}

function entrarModoSimple() {
  el.simple.hidden = false;
  document.documentElement.classList.add('con-modo-simple');
  pintarSimple();
  mantenerPantalla(true);
  // Pantalla completa real donde se puede (Android, escritorio, iPad); en iPhone queda la capa a pantalla completa
  const pedir = el.simple.requestFullscreen ?? el.simple.webkitRequestFullscreen;
  if (pedir && !document.fullscreenElement) Promise.resolve(pedir.call(el.simple)).catch(() => {});
  el.simpleSiguiente.focus();
}

function salirModoSimple() {
  if (!modoSimple()) return;
  el.simple.hidden = true;
  document.documentElement.classList.remove('con-modo-simple');
  mantenerPantalla(false);
  const fuera = document.exitFullscreen ?? document.webkitExitFullscreen;
  if ((document.fullscreenElement || document.webkitFullscreenElement) && fuera) Promise.resolve(fuera.call(document)).catch(() => {});
}

function pintarAyudaVerificar() {
  const juego = almacen.cargarJuegoActual();
  el.numero.max = juego?.tableros.length ?? '';
  el.verificarAyuda.textContent = juego?.tableros.length
    ? tr('Juego actual: {c} tableros {n}×{n}{d} {o}.', { c: juego.tableros.length, n: juego.tamano, d: juego.posicionDoble ? tr(' dobles') : '', o: juego.manual ? tr('(tableros favoritos)') : tr('(código {c})', { c: juego.semilla }) })
    : 'Primero genera tableros en la sección Tableros.';
  el.btnVerificar.disabled = !juego?.tableros.length;
  el.btnRevisar.disabled = !juego?.tableros.length;
}

function pintarTodo() {
  pintarEscenario();
  pintarHistorial();
  pintarAuto();
  pintarAyudaVerificar();
  el.intervalo.value = String(prefs.intervalo);
  el.voz.checked = prefs.voz;
  el.voz.disabled = !hayVoz();
  el.sonidos.checked = prefs.sonidos;
  el.modo.querySelectorAll('button').forEach((b) => b.classList.toggle('activo', b.dataset.valor === prefs.modo));
}

// ── Acciones ─────────────────────────────────────────────────────────────────
function cancelarPendiente() {
  clearTimeout(pendiente);
  pendiente = null;
}

function cambiar(nueva) {
  if (nueva === partida) return;
  const avanzo = nueva.cantadas > partida.cantadas;
  partida = nueva;
  guardar();
  pintarEscenario();
  pintarHistorial();
  pintarSimple();
  el.resultado.innerHTML = '';
  el.revisar.innerHTML = '';
  cancelarPendiente();
  avisarOyentes(avanzo);
  if (!avanzo) return;

  const nombre = cartaPorId(cartaActual(partida)).nombre;
  if (partida.cantadas === 1 && prefs.sonidos) {
    // Arranca la partida: sonido de inicio y después la voz dice la primera carta
    sonidoInicio();
    pendiente = setTimeout(() => decir(nombre), duracion(MELODIA_INICIO) * 1000);
  } else if (terminada(partida)) {
    // Última carta: primero se dice y después suena el cierre
    decir(nombre, () => prefs.sonidos && (pendiente = setTimeout(sonidoFin, 250)));
  } else {
    decir(nombre);
  }
  if (terminada(partida)) detenerAuto();
}

const avanzar = () => cambiar(siguiente(partida));
const retroceder = () => cambiar(anterior(partida));

function detenerAuto() {
  clearInterval(temporizador);
  temporizador = null;
  pintarAuto();
  avisarOyentes();
}

function alternarAuto() {
  if (temporizador) return detenerAuto();
  if (terminada(partida)) return;
  avanzar();
  temporizador = setInterval(avanzar, prefs.intervalo * 1000);
  pintarAuto();
  avisarOyentes();
}

function empezarNuevaPartida() {
  cancelarPendiente();
  if (partida.cantadas > 0 && !terminada(partida) &&
    !window.confirm(tr('Van {n} cartas cantadas. ¿Empezar una partida nueva?', { n: partida.cantadas }))) return false;
  detenerAuto();
  partida = nuevaPartida();
  guardar();
  el.resultado.innerHTML = '';
  el.revisar.innerHTML = '';
  pintarEscenario();
  pintarHistorial();
  pintarSimple();
  avisarOyentes();
  return true;
}

// ── Verificador ──────────────────────────────────────────────────────────────
function verificar(numero = Number(el.numero.value)) {
  const juego = almacen.cargarJuegoActual();
  const tablero = juego?.tableros.find((t) => t.numero === numero);
  if (!tablero) {
    el.resultado.innerHTML = `<p class="verificar-estado no">${tr('No existe el tablero {n} en el juego actual.', { n: Number.isFinite(numero) && numero ? numeroTablero(numero) : '' })}</p>`;
    return;
  }
  el.numero.value = numero;
  const n = juego.tamano;
  const r = verificarTablero(tablero.cartas, cartasCantadas(partida), prefs.modo);
  const marcadas = new Set(r.marcadas);
  const ganadoras = new Set(r.ganadoras ?? []);

  const estado = r.gano
    ? `<p class="verificar-estado si">${tr('🎉 ¡Lotería! El tablero <b>{n}</b> ganó con <b>{m}</b>.', { n: numeroTablero(numero), m: tr(MODOS[prefs.modo].nombre).toLowerCase() })}</p>`
    : `<p class="verificar-estado no">${tr('Todavía no gana ({m}).', { m: tr(MODOS[prefs.modo].nombre).toLowerCase() })} ` +
      (r.casillasFaltantes !== null
        ? (r.casillasFaltantes > 1 ? tr('Le faltan <b>{n}</b> casillas (cualquiera).', { n: r.casillasFaltantes }) : tr('Le falta <b>1</b> casilla (cualquiera).'))
        : r.faltan.length <= 6
        ? tr(r.faltan.length > 1 ? 'Le faltan: <b>{c}</b>.' : 'Le falta: <b>{c}</b>.', { c: r.faltan.map((id) => escapar(cartaPorId(id).nombre)).join(', ') })
        : tr('Le faltan <b>{n}</b> cartas.', { n: r.faltan.length })) +
      '</p>';

  const ficha = svgFicha(fichaActiva());
  const casillas = tablero.cartas.map((id, i) => {
    const clase = ['verificar-casilla', marcadas.has(i) ? 'marcada' : '', ganadoras.has(i) ? 'ganadora' : ''].filter(Boolean).join(' ');
    return `<div class="${clase}">${cartaHtml(id)}${marcadas.has(i) ? `<span class="ficha-capa">${ficha}</span>` : ''}</div>`;
  }).join('');

  el.resultado.innerHTML = `${estado}<div class="verificar-tablero" style="grid-template-columns:repeat(${n},1fr)">${casillas}</div>`;
}

function revisarTodos() {
  const juego = almacen.cargarJuegoActual();
  if (!juego?.tableros.length) return;
  const cantadas = new Set(cartasCantadas(partida));
  const ganadores = juego.tableros.filter((t) => verificarTablero(t.cartas, cantadas, prefs.modo).gano);
  el.revisar.innerHTML = ganadores.length
    ? `${tr('Ya ganaron ({m}):', { m: tr(MODOS[prefs.modo].corto).toLowerCase() })} ` +
      ganadores.map((t) => `<button type="button" class="btn-enlace en-linea" data-verificar="${t.numero}">${numeroTablero(t.numero)}</button>`).join(', ')
    : tr('Ningún tablero ha ganado todavía ({m}).', { m: tr(MODOS[prefs.modo].corto).toLowerCase() });
}

// ── Teclado ──────────────────────────────────────────────────────────────────
function alPresionarTecla(e) {
  if (!activa || e.altKey || e.ctrlKey || e.metaKey) return;
  const enCampo = e.target.closest('input, select, textarea, button');
  if ((e.key === ' ' || e.key === 'ArrowRight') && !enCampo) {
    e.preventDefault();
    despertarAudio();
    avanzar();
  } else if (e.key === 'ArrowLeft' && !enCampo) {
    e.preventDefault();
    retroceder();
  } else if (e.key === 'Escape' && modoSimple()) {
    salirModoSimple();
  }
}

// ── Inicio ───────────────────────────────────────────────────────────────────
export function iniciarCantador() {
  el = {
    progreso: $('#cantador-progreso'),
    codigo: $('#cantador-codigo'),
    cartaGrande: $('#carta-grande'),
    cartaNombre: $('#carta-grande-nombre'),
    anterior: $('#btn-anterior'),
    siguiente: $('#btn-siguiente'),
    auto: $('#btn-automatico'),
    intervalo: $('#intervalo'),
    voz: $('#voz'),
    sonidos: $('#sonidos'),
    nueva: $('#btn-nueva-partida'),
    verificarAyuda: $('#verificar-ayuda'),
    numero: $('#verificar-numero'),
    btnVerificar: $('#btn-verificar'),
    modo: $('#verificar-modo'),
    resultado: $('#verificar-resultado'),
    btnRevisar: $('#btn-revisar-todos'),
    revisar: $('#revisar-resultado'),
    cuenta: $('#cantadas-cuenta'),
    historial: $('#historial'),
    simple: $('#cantar-simple'),
    simpleProgreso: $('#simple-progreso'),
    simpleCarta: $('#simple-carta'),
    simpleNombre: $('#simple-nombre'),
    simpleRecientes: $('#simple-recientes'),
    simpleAnterior: $('#simple-anterior'),
    simpleAuto: $('#simple-auto'),
    simpleSiguiente: $('#simple-siguiente'),
    simpleTiempo: $('#simple-tiempo'),
    simpleTiempoValor: $('#simple-tiempo-valor'),
  };
  prefs = almacen.cargarPreferenciasCantador(PREFS_INICIALES);
  prefs.modo = normalizarModo(prefs.modo);
  prefs.intervalo = intervaloValido(Number(prefs.intervalo));
  const guardada = almacen.cargarPartida();
  partida = esPartidaValida(guardada) ? guardada : nuevaPartida();

  el.siguiente.addEventListener('click', avanzar);
  // Modo simple
  $('#btn-modo-simple').addEventListener('click', () => { despertarAudio(); entrarModoSimple(); });
  $('#simple-salir').addEventListener('click', salirModoSimple);
  el.simple.addEventListener('click', despertarAudio, true);
  el.simpleCarta.addEventListener('click', () => { if (!terminada(partida)) avanzar(); });
  el.simpleCarta.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); el.simpleCarta.click(); } });
  el.simpleAnterior.addEventListener('click', retroceder);
  el.simpleAuto.addEventListener('click', alternarAuto);
  el.simpleSiguiente.addEventListener('click', avanzar);
  // Si la persona sale de la pantalla completa (atrás, Esc), también sale del modo simple
  const alCambiarPantalla = () => { if (!document.fullscreenElement && !document.webkitFullscreenElement) salirModoSimple(); };
  document.addEventListener('fullscreenchange', alCambiarPantalla);
  document.addEventListener('webkitfullscreenchange', alCambiarPantalla);
  // El bloqueo de pantalla se suelta al cambiar de app: se vuelve a pedir al regresar
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && modoSimple()) mantenerPantalla(true); });
  el.anterior.addEventListener('click', retroceder);
  el.auto.addEventListener('click', alternarAuto);
  el.nueva.addEventListener('click', empezarNuevaPartida);
  el.intervalo.addEventListener('change', () => cambiarIntervalo(Number(el.intervalo.value)));
  $('#simple-tiempo').addEventListener('click', () => cambiarIntervalo(siguienteIntervalo(prefs.intervalo)));
  $('#simple-nueva').addEventListener('click', empezarNuevaPartida);
  // La carta es la baraja: tocarla saca la siguiente
  el.cartaGrande.addEventListener('click', () => {
    despertarAudio();
    if (!terminada(partida)) avanzar();
  });
  el.cartaGrande.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      el.cartaGrande.click();
    }
  });
  // Cualquier toque en la vista Cantar desbloquea el audio (Safari solo lo permite en clic / toque, no en pointerdown).
  // En fase de captura: se ejecuta antes que el botón que canta la carta.
  document.querySelector('[data-vista="cantar"]').addEventListener('click', despertarAudio, true);
  el.sonidos.addEventListener('change', () => {
    prefs.sonidos = el.sonidos.checked;
    guardarPrefs();
    if (prefs.sonidos) {
      despertarAudio();
      sonidoInicio();
    }
  });
  el.voz.addEventListener('change', () => {
    prefs.voz = el.voz.checked;
    guardarPrefs();
    if (prefs.voz && cartaActual(partida)) decir(cartaPorId(cartaActual(partida)).nombre);
  });
  el.modo.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-valor]');
    if (!b) return;
    prefs.modo = b.dataset.valor;
    guardarPrefs();
    el.modo.querySelectorAll('button').forEach((x) => x.classList.toggle('activo', x === b));
    if (el.resultado.innerHTML) verificar();
    if (el.revisar.innerHTML) revisarTodos();
  });
  el.btnVerificar.addEventListener('click', () => verificar());
  el.numero.addEventListener('keydown', (e) => { if (e.key === 'Enter') verificar(); });
  el.btnRevisar.addEventListener('click', revisarTodos);
  el.revisar.addEventListener('click', (e) => {
    const b = e.target.closest('[data-verificar]');
    if (b) verificar(Number(b.dataset.verificar));
  });
  document.addEventListener('keydown', alPresionarTecla);
  if (hayVoz()) speechSynthesis.getVoices(); // algunos navegadores cargan las voces al primer uso
}

export const vistaCantar = {
  titulo: 'Cantar',
  alEntrar() {
    activa = true;
    pintarTodo();
  },
  alSalir() {
    activa = false;
    salirModoSimple();
    detenerAuto();
    cancelarPendiente();
    if (hayVoz()) speechSynthesis.cancel();
  },
};

/**
 * Control del canto para otras vistas (Jugar): comparten la misma partida, preferencias, voz y sonidos.
 * alCambiar(fn) avisa con { avanzo } cada vez que cambia la partida o el modo automático.
 */
export const canto = {
  partida: () => partida,
  automatico: () => !!temporizador,
  prefs: () => ({ ...prefs }),
  avanzar() { despertarAudio(); if (!terminada(partida)) avanzar(); },
  retroceder,
  alternarAuto() { despertarAudio(); alternarAuto(); },
  detener() { detenerAuto(); cancelarPendiente(); if (hayVoz()) speechSynthesis.cancel(); },
  nuevaPartida: () => empezarNuevaPartida(),
  cambiarPreferencia(clave, valor) {
    prefs[clave] = valor;
    guardarPrefs();
    if (clave === 'sonidos' && valor) { despertarAudio(); sonidoInicio(); }
    // Nuevo tiempo entre cartas: el automático sigue corriendo con el intervalo nuevo (sin cantar una carta extra)
    if (clave === 'intervalo') cambiarIntervalo(valor);
  },
  despertarAudio,
  alCambiar(fn) { oyentes.add(fn); return () => oyentes.delete(fn); },
};

/** Para que la vista se repinte si cambian las imágenes cargadas. */
export function refrescarCantador() {
  if (activa) pintarTodo();
}
