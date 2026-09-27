// Ventana "Compartir tablero": link y código QR para abrir el tablero en el celular.
import qrcode from 'qrcode-generator';
import { enlaceTablero } from './enlaces.js';

const $ = (sel) => document.querySelector(sel);
let el;

/** Dirección de la app sin el # (funciona igual en localhost y en GitHub Pages). */
const baseApp = () => location.href.split('#')[0];

function codigoQr(texto) {
  const qr = qrcode(0, 'M');
  qr.addData(texto, 'Byte');
  qr.make();
  return qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
}

async function copiar() {
  const texto = el.enlace.value;
  try {
    await navigator.clipboard.writeText(texto);
  } catch {
    el.enlace.select();
    document.execCommand('copy');
  }
  el.copiar.textContent = '¡Copiado!';
  setTimeout(() => (el.copiar.textContent = 'Copiar link'), 1500);
}

export function iniciarCompartir() {
  el = {
    dialogo: $('#dialogo-compartir'),
    titulo: $('#compartir-titulo'),
    qr: $('#compartir-qr'),
    enlace: $('#compartir-enlace'),
    copiar: $('#btn-copiar-enlace'),
    abrir: $('#btn-abrir-enlace'),
  };
  el.copiar.addEventListener('click', copiar);
  el.enlace.addEventListener('focus', () => el.enlace.select());
  // Cerrar al tocar fuera del contenido
  el.dialogo.addEventListener('click', (e) => { if (e.target === el.dialogo) el.dialogo.close(); });
}

export function abrirCompartir(juego, numero) {
  const url = enlaceTablero(juego, numero, baseApp());
  el.titulo.textContent = `Compartir tablero Nº ${String(numero).padStart(3, '0')}`;
  el.enlace.value = url;
  el.abrir.href = url;
  el.qr.innerHTML = codigoQr(url);
  el.dialogo.showModal();
}
