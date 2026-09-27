// Página de la baraja libre: muestra las 54 cartas y permite descargarlas en PNG, ZIP o PDF.
import { jsPDF } from 'jspdf';
import { ilustracion, dibujarCarta, cargarTipografias, imagenCarta } from '../src/baraja-libre.js';
import { PROPORCION_CARTA } from '../src/cartas.js';
import { crearZip } from '../src/zip.js';

const ANCHO_DESCARGA = 1000; // px: nítido al imprimir una carta de ~6 cm
const $ = (s) => document.querySelector(s);
const estado = $('#estado');

const nombreArchivo = (n, ext) =>
  `${String(n).padStart(2, '0')} ${ilustracion(n).nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')}.${ext}`;

function descargar(blob, nombre) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: nombre });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

const LICENCIA = `Baraja libre de Loteria - 54 ilustraciones originales
https://eddywong4.github.io/RamdomLotery/promo/baraja.html

Licencia: CC0 1.0 Universal (dominio publico)
https://creativecommons.org/publicdomain/zero/1.0/deed.es

Puedes usar, copiar, modificar, imprimir y vender estas imagenes sin pedir permiso.
`;

async function ocupar(boton, trabajo) {
  const botones = document.querySelectorAll('button');
  botones.forEach((b) => (b.disabled = true));
  try {
    await trabajo();
  } catch (err) {
    console.error(err);
    estado.textContent = `Error: ${err.message}`;
  } finally {
    botones.forEach((b) => (b.disabled = false));
  }
}

async function descargarZip() {
  const archivos = [];
  for (let n = 1; n <= 54; n++) {
    estado.textContent = `Dibujando carta ${n} de 54…`;
    const blob = await imagenCarta(n, ANCHO_DESCARGA, 'image/png');
    archivos.push({ nombre: nombreArchivo(n, 'png'), bytes: new Uint8Array(await blob.arrayBuffer()) });
  }
  archivos.push({ nombre: 'LICENCIA.txt', bytes: new TextEncoder().encode(LICENCIA) });
  descargar(new Blob([crearZip(archivos)], { type: 'application/zip' }), 'baraja-libre-loteria.zip');
  estado.textContent = '✅ ZIP listo';
}

async function descargarPdf() {
  const pdf = new jsPDF({ unit: 'mm', format: 'letter' });
  // 3 × 3 cartas por hoja carta: el alto manda (3 filas + 12 mm de margen arriba y abajo)
  const alto = (279.4 - 24) / 3;
  const ancho = alto * PROPORCION_CARTA;
  const x0 = (215.9 - ancho * 3) / 2;
  const y0 = (279.4 - alto * 3) / 2;
  for (let n = 1; n <= 54; n++) {
    estado.textContent = `Armando el PDF… carta ${n} de 54`;
    const i = (n - 1) % 9;
    if (n > 1 && i === 0) pdf.addPage();
    const bytes = new Uint8Array(await (await imagenCarta(n, 700, 'image/jpeg', 0.92)).arrayBuffer());
    const x = x0 + (i % 3) * ancho;
    const y = y0 + Math.floor(i / 3) * alto;
    pdf.addImage(bytes, 'JPEG', x, y, ancho, alto, undefined, 'FAST');
    pdf.setDrawColor(190).setLineWidth(0.2).rect(x, y, ancho, alto);
  }
  pdf.save('baraja-libre-loteria.pdf');
  estado.textContent = '✅ PDF listo';
}

async function iniciar() {
  await cargarTipografias();
  const contenedor = $('#cartas');
  for (let n = 1; n <= 54; n++) {
    const il = ilustracion(n);
    const figura = document.createElement('figure');
    const lienzo = document.createElement('canvas');
    const w = 280;
    lienzo.width = w;
    lienzo.height = Math.round(w / PROPORCION_CARTA);
    lienzo.setAttribute('role', 'img');
    lienzo.setAttribute('aria-label', `${n}. ${il.nombre}`);
    dibujarCarta(lienzo.getContext('2d'), il, n, 0, 0, w, { sombra: false });
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.textContent = '⬇ PNG';
    boton.addEventListener('click', async () => descargar(await imagenCarta(n, ANCHO_DESCARGA, 'image/png'), nombreArchivo(n, 'png')));
    figura.append(lienzo, boton);
    contenedor.append(figura);
  }
  $('#zip').addEventListener('click', () => ocupar($('#zip'), descargarZip));
  $('#pdf').addEventListener('click', () => ocupar($('#pdf'), descargarPdf));
}

iniciar();
