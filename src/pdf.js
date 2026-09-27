import { jsPDF } from 'jspdf';
import { cartaPorId, CARTAS, PROPORCION_CARTA as A } from './cartas.js';
import { bytesImagen } from './imagenes.js';

// Medidas en milímetros
export const PAPELES = {
  carta: { nombre: 'Carta (21.6 × 27.9 cm)', w: 215.9, h: 279.4 },
  oficio: { nombre: 'Oficio (21.6 × 34 cm)', w: 215.9, h: 340 },
  a4: { nombre: 'A4 (21 × 29.7 cm)', w: 210, h: 297 },
};

const MARGEN = 10;
const SEPARACION = 8; // espacio entre tableros; la línea de corte va al centro

const COLOR_MARCO = [139, 26, 26];
const COLOR_SUAVE = [140, 120, 110];

// ── Imágenes: se leen una vez y se reutilizan en todo el PDF ───────────────────
async function cargarImagenes(ids) {
  const unicos = [...new Set(ids)];
  const datos = await Promise.all(unicos.map(bytesImagen));
  return new Map(unicos.map((id, i) => [id, datos[i]]));
}

// Carta sin imagen: recuadro con número y nombre para que el tablero siga siendo jugable
function dibujarCartaProvisional(doc, id, x, y, w, h) {
  const mm2pt = 72 / 25.4;
  doc.setFillColor(250, 243, 230);
  doc.rect(x, y, w, h, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR_MARCO);
  doc.setFontSize(w * 0.32 * mm2pt);
  doc.text(String(id), x + w / 2, y + h * 0.45, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 40, 30);
  doc.setFontSize(Math.max(4, w * 0.1 * mm2pt));
  doc.text(doc.splitTextToSize(cartaPorId(id).nombre.toUpperCase(), w * 0.9), x + w / 2, y + h * 0.62, { align: 'center' });
}

// El alias hace que jsPDF incruste cada imagen una sola vez aunque aparezca en muchos tableros
function dibujarCarta(doc, imagenes, id, x, y, w, h) {
  const datos = imagenes.get(id);
  if (datos) doc.addImage(datos, 'JPEG', x, y, w, h, `carta-${id}`, 'NONE');
  else dibujarCartaProvisional(doc, id, x, y, w, h);
  doc.setDrawColor(40, 40, 40);
  doc.setLineWidth(0.2);
  doc.rect(x, y, w, h);
}

// ── Tablero ───────────────────────────────────────────────────────────────────
// Todas las medidas del tablero son proporcionales a su ancho, así se ve igual en cualquier tamaño.
const P = 0.03;    // relleno interior
const G = 0.012;   // espacio entre cartas
const ENC = 0.045; // alto del encabezado (solo lleva el número de tablero)
const NUM = 0.022; // tamaño de letra del número de tablero
const PIE = 0.035; // alto del pie

function medidasTablero(n) {
  const cartaW = (1 - 2 * P - (n - 1) * G) / n;
  const altoRel = 2 * P + ENC + PIE + (n - 1) * G + (n * cartaW) / A;
  return { cartaW, altoRel };
}

function textoAjustado(doc, texto, maxW, tamanoPt) {
  doc.setFontSize(tamanoPt);
  while (tamanoPt > 5 && doc.getTextWidth(texto) > maxW) {
    tamanoPt -= 0.5;
    doc.setFontSize(tamanoPt);
  }
}

function dibujarTablero(doc, imagenes, tablero, celda, opciones) {
  const n = Math.round(Math.sqrt(tablero.cartas.length));
  const { cartaW, altoRel } = medidasTablero(n);

  const bw = Math.min(celda.w, celda.h / altoRel);
  const bh = bw * altoRel;
  const bx = celda.x + (celda.w - bw) / 2;
  const by = celda.y + (celda.h - bh) / 2;
  const mm2pt = 72 / 25.4;

  // Marco
  doc.setDrawColor(...COLOR_MARCO);
  doc.setLineWidth(Math.max(0.4, bw * 0.006));
  doc.roundedRect(bx, by, bw, bh, bw * 0.02, bw * 0.02);

  // Encabezado: solo el número de tablero, pequeño y a la derecha
  const p = bw * P;
  const encH = bw * ENC;
  const numero = `Nº ${String(tablero.numero).padStart(3, '0')}`;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR_MARCO);
  doc.setFontSize(Math.max(6.5, bw * NUM * mm2pt));
  doc.text(numero, bx + bw - p, by + p + encH * 0.6, { align: 'right' });

  // Cartas
  const cw = bw * cartaW;
  const ch = cw / A;
  const g = bw * G;
  const x0 = bx + p;
  const y0 = by + p + encH;
  tablero.cartas.forEach((id, i) => {
    const fila = Math.floor(i / n);
    const col = i % n;
    dibujarCarta(doc, imagenes, id, x0 + col * (cw + g), y0 + fila * (ch + g), cw, ch);
  });

  // Pie
  if (opciones.mostrarPie) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLOR_SUAVE);
    const pie = `Tablero ${n}×${n}  ·  Juego ${opciones.semilla}`;
    textoAjustado(doc, pie, bw - 2 * p, bw * PIE * 0.55 * mm2pt);
    doc.text(pie, bx + bw / 2, by + bh - p * 0.9, { align: 'center' });
  }
}

// ── Tamaños de impresión ──────────────────────────────────────────────────────
export const FORMATOS = {
  grande: { nombre: 'Grande', cols: 1, filas: 1, orientacion: 'vertical' },
  s: { nombre: 'S', cols: 2, filas: 1, orientacion: 'horizontal' },
  xs: { nombre: 'XS', cols: 2, filas: 2, orientacion: 'vertical' },
};

function crearDocumento(papel, orientacion) {
  const { w, h } = PAPELES[papel];
  return new jsPDF({
    unit: 'mm',
    format: [w, h],
    orientation: orientacion === 'horizontal' ? 'landscape' : 'portrait',
    compress: true,
  });
}

function dibujarLineasCorte(doc, cols, filas, pw, ph) {
  doc.setDrawColor(170, 170, 170);
  doc.setLineWidth(0.2);
  doc.setLineDashPattern([2, 2], 0);
  const cw = (pw - 2 * MARGEN - (cols - 1) * SEPARACION) / cols;
  const ch = (ph - 2 * MARGEN - (filas - 1) * SEPARACION) / filas;
  for (let c = 1; c < cols; c++) {
    const x = MARGEN + c * cw + (c - 0.5) * SEPARACION;
    doc.line(x, 4, x, ph - 4);
  }
  for (let f = 1; f < filas; f++) {
    const y = MARGEN + f * ch + (f - 0.5) * SEPARACION;
    doc.line(4, y, pw - 4, y);
  }
  doc.setLineDashPattern([], 0);
}

const esperarFrame = () => new Promise((r) => setTimeout(r, 0));

/**
 * Crea el PDF de tableros.
 * opciones: { papel, formato, semilla, lineasCorte, mostrarPie, alProgresar }
 */
export async function crearPdfTableros(tableros, opciones) {
  const imagenes = await cargarImagenes(tableros.flatMap((t) => t.cartas));
  const { cols, filas, orientacion } = FORMATOS[opciones.formato] ?? FORMATOS.grande;
  const doc = crearDocumento(opciones.papel, orientacion);
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const cw = (pw - 2 * MARGEN - (cols - 1) * SEPARACION) / cols;
  const ch = (ph - 2 * MARGEN - (filas - 1) * SEPARACION) / filas;
  const porHoja = cols * filas;

  for (let i = 0; i < tableros.length; i++) {
    const pos = i % porHoja;
    if (pos === 0) {
      if (i > 0) doc.addPage();
      if (opciones.lineasCorte && porHoja > 1) dibujarLineasCorte(doc, cols, filas, pw, ph);
    }
    const celda = {
      x: MARGEN + (pos % cols) * (cw + SEPARACION),
      y: MARGEN + Math.floor(pos / cols) * (ch + SEPARACION),
      w: cw,
      h: ch,
    };
    dibujarTablero(doc, imagenes, tableros[i], celda, opciones);

    if (i % 10 === 9) {
      opciones.alProgresar?.((i + 1) / tableros.length);
      await esperarFrame();
    }
  }
  return doc;
}

/** PDF con las 54 cartas (3 × 3 por hoja) para recortarlas y "cantarlas". */
export async function crearPdfBaraja(papel) {
  const ids = CARTAS.map((c) => c.id);
  const imagenes = await cargarImagenes(ids);
  const doc = crearDocumento(papel, 'vertical');
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const cols = 3, filas = 3, sep = 4;

  const ch = Math.min((ph - 2 * MARGEN - (filas - 1) * sep) / filas, ((pw - 2 * MARGEN - (cols - 1) * sep) / cols) / A);
  const cw = ch * A;
  const x0 = (pw - (cols * cw + (cols - 1) * sep)) / 2;
  const y0 = (ph - (filas * ch + (filas - 1) * sep)) / 2;

  ids.forEach((id, i) => {
    const pos = i % 9;
    if (pos === 0 && i > 0) doc.addPage();
    dibujarCarta(doc, imagenes, id, x0 + (pos % cols) * (cw + sep), y0 + Math.floor(pos / cols) * (ch + sep), cw, ch);
  });
  return doc;
}
