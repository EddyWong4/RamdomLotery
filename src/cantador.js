// Vista "Cantar": canta las cartas una por una y verifica si un tablero ganó.
import { CARTAS, cartaPorId } from './cartas.js';
import * as almacen from './almacen.js';
import * as imagenes from './imagenes.js';
import { MODOS, verificarTablero } from './reglas.js';
import { nuevaPartida, siguiente, anterior, cartasCantadas, cartaActual, terminada, esPartidaValida } from './partida.js';

const PREFS_INICIALES = { intervalo: 5, voz: false, modo: 'llena' };

const $ = (sel) => document.querySelector(sel);
let el;
let prefs;
let partida;
let temporizador = null;
let activa = false;

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

function decir(texto) {
  if (!prefs.voz || !hayVoz()) return;
  speechSynthesis.cancel();
  const frase = new SpeechSynthesisUtterance(texto);
  const voces = speechSynthesis.getVoices();
  frase.voice = voces.find((v) => v.lang === 'es-MX') ?? voces.find((v) => v.lang.startsWith('es')) ?? null;
  frase.lang = frase.voice?.lang ?? 'es-MX';
  speechSynthesis.speak(frase);
}

// ── Pintado ──────────────────────────────────────────────────────────────────
function pintarEscenario() {
  const id = cartaActual(partida);
  el.progreso.textContent = `Carta ${partida.cantadas} de ${partida.orden.length}`;
  el.codigo.textContent = `Partida ${partida.semilla}`;
  el.anterior.disabled = partida.cantadas === 0;
  el.siguiente.disabled = terminada(partida);
  el.siguiente.textContent = partida.cantadas === 0 ? 'Empezar ▶' : terminada(partida) ? 'Se cantaron todas' : 'Siguiente carta ▶';

  if (!id) {
    el.cartaGrande.innerHTML = '<div class="carta-grande-inicio">¡Corre y se va!<small>Presiona “Empezar” para cantar la primera carta</small></div>';
    el.cartaNombre.textContent = '';
    return;
  }
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
}

function pintarAyudaVerificar() {
  const juego = almacen.cargarJuegoActual();
  el.numero.max = juego?.tableros.length ?? '';
  el.verificarAyuda.textContent = juego?.tableros.length
    ? `Juego actual: ${juego.tableros.length} tableros ${juego.tamano}×${juego.tamano}${juego.posicionDoble ? ' dobles' : ''} (código ${juego.semilla}).`
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
  el.modo.querySelectorAll('button').forEach((b) => b.classList.toggle('activo', b.dataset.valor === prefs.modo));
}

// ── Acciones ─────────────────────────────────────────────────────────────────
function cambiar(nueva) {
  if (nueva === partida) return;
  const avanzo = nueva.cantadas > partida.cantadas;
  partida = nueva;
  guardar();
  pintarEscenario();
  pintarHistorial();
  el.resultado.innerHTML = '';
  el.revisar.innerHTML = '';
  if (avanzo) decir(cartaPorId(cartaActual(partida)).nombre);
  if (terminada(partida)) detenerAuto();
}

const avanzar = () => cambiar(siguiente(partida));
const retroceder = () => cambiar(anterior(partida));

function detenerAuto() {
  clearInterval(temporizador);
  temporizador = null;
  pintarAuto();
}

function alternarAuto() {
  if (temporizador) return detenerAuto();
  if (terminada(partida)) return;
  avanzar();
  temporizador = setInterval(avanzar, prefs.intervalo * 1000);
  pintarAuto();
}

function empezarNuevaPartida() {
  if (partida.cantadas > 0 && !terminada(partida) &&
    !window.confirm(`Van ${partida.cantadas} cartas cantadas. ¿Empezar una partida nueva?`)) return;
  detenerAuto();
  partida = nuevaPartida();
  guardar();
  el.resultado.innerHTML = '';
  el.revisar.innerHTML = '';
  pintarEscenario();
  pintarHistorial();
}

// ── Verificador ──────────────────────────────────────────────────────────────
function verificar(numero = Number(el.numero.value)) {
  const juego = almacen.cargarJuegoActual();
  const tablero = juego?.tableros.find((t) => t.numero === numero);
  if (!tablero) {
    el.resultado.innerHTML = `<p class="verificar-estado no">No existe el tablero ${Number.isFinite(numero) && numero ? numeroTablero(numero) : ''} en el juego actual.</p>`;
    return;
  }
  el.numero.value = numero;
  const n = juego.tamano;
  const r = verificarTablero(tablero.cartas, cartasCantadas(partida), prefs.modo);
  const marcadas = new Set(r.marcadas);
  const ganadoras = new Set(r.ganadoras ?? []);

  const estado = r.gano
    ? `<p class="verificar-estado si">🎉 ¡Lotería! El tablero <b>${numeroTablero(numero)}</b> ganó con <b>${MODOS[prefs.modo].nombre.toLowerCase()}</b>.</p>`
    : `<p class="verificar-estado no">Todavía no gana (${MODOS[prefs.modo].nombre.toLowerCase()}). ` +
      (r.faltan.length <= 6
        ? `Le falta${r.faltan.length > 1 ? 'n' : ''}: <b>${r.faltan.map((id) => escapar(cartaPorId(id).nombre)).join(', ')}</b>.`
        : `Le faltan <b>${r.faltan.length}</b> cartas.`) +
      '</p>';

  const casillas = tablero.cartas.map((id, i) => {
    const clase = ['verificar-casilla', marcadas.has(i) ? 'marcada' : '', ganadoras.has(i) ? 'ganadora' : ''].filter(Boolean).join(' ');
    return `<div class="${clase}">${cartaHtml(id)}</div>`;
  }).join('');

  el.resultado.innerHTML = `${estado}<div class="verificar-tablero" style="grid-template-columns:repeat(${n},1fr)">${casillas}</div>`;
}

function revisarTodos() {
  const juego = almacen.cargarJuegoActual();
  if (!juego?.tableros.length) return;
  const cantadas = new Set(cartasCantadas(partida));
  const ganadores = juego.tableros.filter((t) => verificarTablero(t.cartas, cantadas, prefs.modo).gano);
  el.revisar.innerHTML = ganadores.length
    ? `Ya ganaron (${MODOS[prefs.modo].corto.toLowerCase()}): ` +
      ganadores.map((t) => `<button type="button" class="btn-enlace en-linea" data-verificar="${t.numero}">${numeroTablero(t.numero)}</button>`).join(', ')
    : `Ningún tablero ha ganado todavía (${MODOS[prefs.modo].corto.toLowerCase()}).`;
}

// ── Teclado ──────────────────────────────────────────────────────────────────
function alPresionarTecla(e) {
  if (!activa || e.altKey || e.ctrlKey || e.metaKey) return;
  const enCampo = e.target.closest('input, select, textarea, button');
  if ((e.key === ' ' || e.key === 'ArrowRight') && !enCampo) {
    e.preventDefault();
    avanzar();
  } else if (e.key === 'ArrowLeft' && !enCampo) {
    e.preventDefault();
    retroceder();
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
  };
  prefs = almacen.cargarPreferenciasCantador(PREFS_INICIALES);
  const guardada = almacen.cargarPartida();
  partida = esPartidaValida(guardada) ? guardada : nuevaPartida();

  el.siguiente.addEventListener('click', avanzar);
  el.anterior.addEventListener('click', retroceder);
  el.auto.addEventListener('click', alternarAuto);
  el.nueva.addEventListener('click', empezarNuevaPartida);
  el.intervalo.addEventListener('change', () => {
    prefs.intervalo = Number(el.intervalo.value);
    guardarPrefs();
    if (temporizador) { detenerAuto(); alternarAuto(); }
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
  alEntrar() {
    activa = true;
    pintarTodo();
  },
  alSalir() {
    activa = false;
    detenerAuto();
    if (hayVoz()) speechSynthesis.cancel();
  },
};

/** Para que la vista se repinte si cambian las imágenes cargadas. */
export function refrescarCantador() {
  if (activa) pintarTodo();
}
