// Ventana para grabar las voces de las cartas, una por una: grabar, escuchar, borrar y pasar a la siguiente.
import { CARTAS, cartaPorId, TOTAL_CARTAS } from './cartas.js';
import * as imagenes from './imagenes.js';
import * as voces from './voces.js';
import { t as tr } from './i18n.js';

const $ = (sel) => document.querySelector(sel);
const escapar = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

let el;
let actual = 1; // carta que se está grabando
let microfono = null;
let reloj = null;
let limite = null;
let inicio = 0;
let alCambiar = () => {};

function aviso(texto) {
  el.aviso.textContent = texto;
  el.aviso.hidden = !texto;
}

function pintarCarta() {
  const c = cartaPorId(actual);
  const url = imagenes.urlMiniatura(actual);
  el.imagen.innerHTML = url
    ? `<img src="${url}" alt="${escapar(c.nombre)}">`
    : `<div class="carta-vacia"><b>${actual}</b><span>${escapar(c.nombre)}</span></div>`;
  el.nombre.textContent = `${actual}. ${c.nombre}`;
  el.anterior.disabled = actual === 1;
  el.siguiente.disabled = actual === TOTAL_CARTAS;
}

function pintar() {
  if (!el) return;
  const grabando = microfono?.grabando();
  const tiene = voces.tieneVoz(actual);
  pintarCarta();
  el.cuenta.textContent = tr('{n} de 54 grabadas', { n: voces.vocesGrabadas() });
  el.estadoCarta.textContent = grabando ? '' : tr(tiene ? '✅ Esta carta ya tiene tu voz' : 'Esta carta todavía no tiene voz');
  el.grabar.classList.toggle('grabando', !!grabando);
  el.grabarTexto.textContent = grabando
    ? tr('Detener ({s} s)', { s: Math.max(0, voces.DURACION_MAXIMA - Math.floor((Date.now() - inicio) / 1000)) })
    : tr(tiene ? 'Grabar de nuevo' : 'Grabar');
  el.grabar.disabled = !voces.puedeGrabar();
  el.escuchar.disabled = !tiene || grabando;
  el.borrar.disabled = !tiene || grabando;
  [el.anterior, el.siguiente].forEach((b) => b.disabled ||= grabando);
  el.exportar.disabled = voces.vocesGrabadas() === 0;
  el.borrarTodas.hidden = voces.vocesGrabadas() === 0;
  el.rejilla.querySelectorAll('[data-id]').forEach((b) => {
    const id = Number(b.dataset.id);
    b.classList.toggle('grabada', voces.tieneVoz(id));
    b.classList.toggle('actual', id === actual);
    b.setAttribute('aria-current', id === actual ? 'true' : 'false');
  });
}

function ir(id) {
  if (microfono?.grabando()) return;
  actual = Math.min(TOTAL_CARTAS, Math.max(1, id));
  voces.detenerVoz();
  aviso('');
  pintar();
}

async function alternarGrabacion() {
  if (microfono?.grabando()) {
    microfono.detener();
    return;
  }
  aviso('');
  try {
    microfono ??= await voces.abrirMicrofono();
  } catch (err) {
    console.error(err);
    aviso(tr(err?.name === 'NotAllowedError'
      ? 'No hay permiso para usar el micrófono. Actívalo en los permisos del sitio y vuelve a intentar.'
      : 'No se encontró un micrófono o el navegador no lo deja usar.'));
    return;
  }
  voces.detenerVoz();
  const id = actual;
  const grabacion = microfono.grabar();
  inicio = Date.now();
  reloj = setInterval(pintar, 250);
  limite = setTimeout(() => microfono?.detener(), voces.DURACION_MAXIMA * 1000);
  pintar();
  try {
    const blob = await grabacion;
    if (blob.size < 800) {
      aviso(tr('La grabación salió vacía; inténtalo de nuevo.'));
      return;
    }
    await voces.guardarVoz(id, blob);
    alCambiar(id);
    if (el.avanzar.checked && id < TOTAL_CARTAS) actual = id + 1;
    else voces.reproducirVoz(id);
  } catch (err) {
    console.error(err);
    aviso(tr('No se pudo guardar la grabación.'));
  } finally {
    clearInterval(reloj);
    clearTimeout(limite);
    pintar();
  }
}

function cerrarMicrofono() {
  microfono?.cerrar();
  microfono = null;
  clearInterval(reloj);
  clearTimeout(limite);
  voces.detenerVoz();
}

async function exportar() {
  const blob = await voces.exportarZip();
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'loteria-voces.zip' });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

async function importar() {
  const archivos = [...el.importar.files];
  el.importar.value = '';
  if (!archivos.length) return;
  const r = await voces.importarArchivos(archivos);
  aviso(tr('{n} voces importadas', { n: r.cargadas }) + (r.ignorados ? tr(' · {n} archivos ignorados (deben ser audios que empiecen con el número de la carta)', { n: r.ignorados }) : ''));
  alCambiar(null);
  pintar();
}

async function borrarTodas() {
  if (!window.confirm(tr('¿Borrar todas tus grabaciones de este navegador?'))) return;
  await voces.borrarTodas();
  alCambiar(null);
  pintar();
}

/** Abre la ventana en la carta indicada (o en la primera que falta). */
export function abrirGrabador(id = null) {
  if (!el) return;
  actual = id ?? (CARTAS.find((c) => !voces.tieneVoz(c.id))?.id ?? 1);
  aviso(voces.puedeGrabar() ? '' : tr('Este navegador no puede grabar audio. Usa Chrome, Safari o Firefox actualizados; también puedes importar audios.'));
  pintar();
  el.dialogo.showModal();
}

export function iniciarGrabador({ alCambiar: fn } = {}) {
  el = {
    dialogo: $('#dialogo-voces'),
    cuenta: $('#voces-cuenta'),
    aviso: $('#voces-aviso'),
    imagen: $('#voces-imagen'),
    nombre: $('#voces-nombre'),
    estadoCarta: $('#voces-estado-carta'),
    anterior: $('#voces-anterior'),
    siguiente: $('#voces-siguiente'),
    grabar: $('#voces-grabar'),
    grabarTexto: $('#voces-grabar-texto'),
    escuchar: $('#voces-escuchar'),
    borrar: $('#voces-borrar'),
    avanzar: $('#voces-avanzar'),
    rejilla: $('#voces-rejilla'),
    exportar: $('#voces-exportar'),
    importar: $('#voces-importar'),
    borrarTodas: $('#voces-borrar-todas'),
  };
  if (!el.dialogo) return;
  if (fn) alCambiar = fn;
  el.rejilla.innerHTML = CARTAS.map((c) =>
    `<button type="button" class="voz-celda" data-id="${c.id}" title="${c.id}. ${escapar(c.nombre)}">${c.id}</button>`).join('');
  el.rejilla.addEventListener('click', (e) => {
    const b = e.target.closest('[data-id]');
    if (b) ir(Number(b.dataset.id));
  });
  el.anterior.addEventListener('click', () => ir(actual - 1));
  el.siguiente.addEventListener('click', () => ir(actual + 1));
  el.grabar.addEventListener('click', alternarGrabacion);
  el.escuchar.addEventListener('click', () => voces.reproducirVoz(actual));
  el.borrar.addEventListener('click', async () => {
    await voces.borrarVoz(actual);
    alCambiar(actual);
    pintar();
  });
  el.exportar.addEventListener('click', exportar);
  el.importar.addEventListener('change', importar);
  el.borrarTodas.addEventListener('click', borrarTodas);
  // Al cerrar se apaga el micrófono (el navegador deja de mostrar que está en uso)
  el.dialogo.addEventListener('close', cerrarMicrofono);
  // Atajos dentro de la ventana: R graba / detiene, ← → cambian de carta
  el.dialogo.addEventListener('keydown', (e) => {
    if (e.target.closest('input')) return;
    if (e.key === 'r' || e.key === 'R') { e.preventDefault(); alternarGrabacion(); }
    else if (e.key === 'ArrowRight') ir(actual + 1);
    else if (e.key === 'ArrowLeft') ir(actual - 1);
  });
}
