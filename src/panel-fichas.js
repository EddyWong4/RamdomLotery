// Panel "Ficha" de la vista Jugar: elegir, personalizar, exportar e importar fichas.
import { t as tr } from './i18n.js';
import { TIPOS, COLORES, ID_PREDETERMINADA, svgFicha, crearArchivoFichas, leerArchivoFichas } from './fichas.js';
import * as misFichas from './mis-fichas.js';

const $ = (sel) => document.querySelector(sel);
const escapar = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

let el;
let avisar = () => {};

// Imagen propia: se recorta a cuadrado y se reduce a 128 px (PNG, conserva la transparencia)
function imagenAFicha(archivo) {
  return new Promise((resolver, rechazar) => {
    const url = URL.createObjectURL(archivo);
    const img = new Image();
    img.onload = () => {
      const lado = Math.min(img.width, img.height);
      const c = document.createElement('canvas');
      c.width = c.height = 128;
      c.getContext('2d').drawImage(img, (img.width - lado) / 2, (img.height - lado) / 2, lado, lado, 0, 0, 128, 128);
      URL.revokeObjectURL(url);
      resolver(c.toDataURL('image/png'));
    };
    img.onerror = () => { URL.revokeObjectURL(url); rechazar(new Error('No se pudo leer la imagen')); };
    img.src = url;
  });
}

function pintar() {
  const activa = misFichas.fichaActiva();
  el.muestra.innerHTML = svgFicha(activa, { vista: true });
  el.nombreActual.textContent = activa.nombre;

  el.lista.innerHTML = misFichas.listaFichas().map((f) => `
    <button type="button" class="ficha-opcion${f.id === activa.id ? ' activa' : ''}" data-ficha="${escapar(f.id)}"
      role="radio" aria-checked="${f.id === activa.id}" title="${escapar(f.nombre)}">
      <span class="ficha-muestra">${svgFicha(f, { vista: true })}</span>
      <span class="ficha-opcion-nombre">${escapar(f.nombre)}</span>
    </button>`).join('');

  el.nombre.value = activa.nombre;
  el.tipo.value = activa.tipo;
  const usaColor = TIPOS[activa.tipo].usaColor;
  el.campoColor.hidden = !usaColor;
  el.campoEmoji.hidden = activa.tipo !== 'emoji';
  el.campoImagen.hidden = activa.tipo !== 'imagen';
  if (usaColor) {
    el.color.value = activa.color;
    el.colores.querySelectorAll('button').forEach((b) => b.classList.toggle('activo', b.dataset.color === activa.color));
  }
  el.emoji.value = activa.emoji ?? '';
  el.tamano.value = activa.tamano;
  el.tamanoValor.textContent = `${activa.tamano}%`;
  el.opacidad.value = Math.round(activa.opacidad * 100);
  el.opacidadValor.textContent = `${Math.round(activa.opacidad * 100)}%`;
  el.eliminar.disabled = activa.id === ID_PREDETERMINADA;
}

function cambiarTipo(tipo) {
  const activa = misFichas.fichaActiva();
  if (tipo === 'imagen' && !activa.imagen) {
    // Primero se elige la imagen; el tipo cambia cuando ya hay una
    el.campoImagen.hidden = false;
    el.campoColor.hidden = true;
    el.campoEmoji.hidden = true;
    el.imagen.click();
    return;
  }
  misFichas.actualizarActiva({
    tipo,
    color: activa.color ?? '#e63946',
    emoji: activa.emoji ?? '🌽',
    // Si el nombre era el automático ("Círculo 2"), se cambia al del nuevo tipo; uno escrito por el usuario se respeta
    nombre: misFichas.nombreAutomatico(activa) ? misFichas.nombreDisponible(tipo, activa.id) : activa.nombre,
  });
}

function exportar() {
  const archivo = crearArchivoFichas(misFichas.listaFichas());
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(archivo, null, 2)], { type: 'application/json' }));
  a.download = 'loteria-fichas.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  avisar(tr('{n} fichas exportadas', { n: archivo.fichas.length }));
}

async function importar(archivo) {
  if (!archivo) return;
  try {
    const { fichas, descartadas } = leerArchivoFichas(JSON.parse(await archivo.text()));
    const agregadas = misFichas.importar(fichas);
    avisar(
      tr('{n} fichas nuevas importadas', { n: agregadas }) +
      (fichas.length - agregadas ? tr(' · {n} ya existían', { n: fichas.length - agregadas }) : '') +
      (descartadas ? tr(' · {n} dañadas se ignoraron', { n: descartadas }) : ''), 5000);
  } catch (err) {
    avisar(err instanceof SyntaxError ? 'El archivo no es un archivo de fichas válido.' : tr(err.message), 5000);
  }
}

export function iniciarPanelFichas(funcionAvisar) {
  avisar = funcionAvisar;
  el = {
    muestra: $('#ficha-actual-muestra'),
    nombreActual: $('#ficha-actual-nombre'),
    lista: $('#fichas-lista'),
    nombre: $('#ficha-nombre'),
    tipo: $('#ficha-tipo'),
    campoColor: $('#ficha-campo-color'),
    colores: $('#ficha-colores'),
    color: $('#ficha-color'),
    campoEmoji: $('#ficha-campo-emoji'),
    emoji: $('#ficha-emoji'),
    campoImagen: $('#ficha-campo-imagen'),
    imagen: $('#ficha-imagen'),
    tamano: $('#ficha-tamano'),
    tamanoValor: $('#ficha-tamano-valor'),
    opacidad: $('#ficha-opacidad'),
    opacidadValor: $('#ficha-opacidad-valor'),
    nueva: $('#btn-ficha-nueva'),
    eliminar: $('#btn-ficha-eliminar'),
    exportar: $('#btn-fichas-exportar'),
    importar: $('#input-fichas'),
  };

  el.tipo.innerHTML = Object.entries(TIPOS).map(([id, x]) => `<option value="${id}">${tr(x.nombre)}</option>`).join('');
  el.colores.innerHTML = COLORES.map((c) => `<button type="button" data-color="${c}" style="background:${c}" aria-label="Color ${c}" title="${c}"></button>`).join('');

  el.lista.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ficha]');
    if (b) misFichas.activar(b.dataset.ficha);
  });
  el.nombre.addEventListener('change', () => misFichas.actualizarActiva({ nombre: el.nombre.value }));
  el.tipo.addEventListener('change', () => cambiarTipo(el.tipo.value));
  el.colores.addEventListener('click', (e) => {
    const b = e.target.closest('[data-color]');
    if (b) misFichas.actualizarActiva({ color: b.dataset.color });
  });
  el.color.addEventListener('input', () => misFichas.actualizarActiva({ color: el.color.value }));
  el.emoji.addEventListener('change', () => {
    if (!misFichas.actualizarActiva({ emoji: el.emoji.value })) el.emoji.value = misFichas.fichaActiva().emoji ?? '';
  });
  el.imagen.addEventListener('change', async () => {
    const archivo = el.imagen.files[0];
    el.imagen.value = '';
    if (!archivo) return pintar();
    try {
      const imagen = await imagenAFicha(archivo);
      const activa = misFichas.fichaActiva();
      const nombre = misFichas.nombreAutomatico(activa) && activa.tipo !== 'imagen' ? misFichas.nombreDisponible('imagen', activa.id) : activa.nombre;
      if (!misFichas.actualizarActiva({ tipo: 'imagen', imagen, nombre })) avisar('La imagen es demasiado grande o no es válida', 4000);
    } catch (err) {
      avisar(err.message, 4000);
    }
  });
  el.tamano.addEventListener('input', () => misFichas.actualizarActiva({ tamano: Number(el.tamano.value) }));
  el.opacidad.addEventListener('input', () => misFichas.actualizarActiva({ opacidad: Number(el.opacidad.value) / 100 }));
  el.nueva.addEventListener('click', () => {
    misFichas.crearFicha();
    el.nombre.focus();
    el.nombre.select();
  });
  el.eliminar.addEventListener('click', () => {
    if (window.confirm(tr('¿Eliminar la ficha "{n}"?', { n: misFichas.fichaActiva().nombre }))) misFichas.eliminarActiva();
  });
  el.exportar.addEventListener('click', exportar);
  el.importar.addEventListener('change', () => {
    const archivo = el.importar.files[0];
    el.importar.value = '';
    importar(archivo);
  });

  misFichas.alCambiar(pintar);
  pintar();
}
