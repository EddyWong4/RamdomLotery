// Ventana "Compartir tablero": link y código QR para abrir el tablero en el celular.
import { t as tr } from './i18n.js';
import qrcode from 'qrcode-generator';
import { enlaceTablero } from './enlaces.js';

const $ = (sel) => document.querySelector(sel);
let el;

/**
 * Dirección de la app sin el # ni parámetros (funciona igual en localhost y en GitHub Pages).
 * Sin parámetros: un "?plataforma=…" de prueba no debe viajar en el link al celular de otro.
 */
const baseApp = () => `${location.origin}${location.pathname}`;

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

/** Comparte uno o varios tableros en un solo link / QR. */
export function abrirCompartir(juego, numeros) {
  const lista = Array.isArray(numeros) ? numeros : [numeros];
  const url = enlaceTablero(juego, lista, baseApp());
  const nombres = lista.map((n) => `Nº ${String(n).padStart(3, '0')}`);
  el.titulo.textContent = lista.length === 1
    ? tr('Compartir tablero {n}', { n: nombres[0] })
    : tr('Compartir {c} tableros ({n})', { c: lista.length, n: nombres.length > 4 ? `${nombres.slice(0, 4).join(', ')}…` : nombres.join(', ') });
  el.enlace.value = url;
  el.abrir.href = url;
  el.qr.innerHTML = codigoQr(url);
  el.dialogo.showModal();
}
