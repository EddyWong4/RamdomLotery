// Baraja libre: 54 ilustraciones ORIGINALES dibujadas para este proyecto (sin relación con barajas comerciales).
// Licencia CC0 (dominio público): cualquiera puede usarlas, modificarlas e imprimirlas, incluso para vender.
// Cada dibujo ocupa un cuadro de 100 × 100 y se pinta con el canvas 2D; la numeración es la de la app (src/cartas.js).
// Tres cartas se interpretan de forma respetuosa: 12 El Valiente = máscara de luchador, 26 El Negrito = gatito negro,
// 38 El Apache = arco con flecha y plumas.
import { cartaPorId, PROPORCION_CARTA } from './cartas.js';

// ── Ayudas de dibujo ────────────────────────────────────────────────────────
const P = (d) => new Path2D(d);
function relleno(ctx, color, forma) { ctx.fillStyle = color; ctx.fill(typeof forma === 'string' ? P(forma) : forma); }
function circulo(ctx, x, y, r, color) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill(); }
function elipse(ctx, x, y, rx, ry, giro, color) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, giro, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill(); }
function rect(ctx, x, y, w, h, r, color) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fillStyle = color; ctx.fill(); }
function trazo(ctx, d, color, ancho, tapa = 'round') {
  ctx.strokeStyle = color; ctx.lineWidth = ancho; ctx.lineCap = tapa; ctx.lineJoin = 'round';
  ctx.stroke(typeof d === 'string' ? P(d) : d);
}
function estrella(puntas, rExt, rInt, cx = 50, cy = 50, giro = -90) {
  const p = new Path2D();
  for (let i = 0; i < puntas * 2; i++) {
    const r = i % 2 ? rInt : rExt;
    const a = ((giro + (i * 180) / puntas) * Math.PI) / 180;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    if (i === 0) p.moveTo(x, y); else p.lineTo(x, y);
  }
  p.closePath();
  return p;
}
const ojo = (ctx, x, y, r = 2.2) => circulo(ctx, x, y, r, '#1b1b1b');
const brillo = (ctx, x, y, r = 1.2) => circulo(ctx, x, y, r, '#ffffff');
const piel = '#f1c9a5';
const tierra = (ctx, color = 'rgba(0,0,0,.12)') => elipse(ctx, 50, 94, 34, 4, 0, color);

// ── Los 54 dibujos (número de carta → fondo + dibujo) ───────────────────────
export const DIBUJOS = {
  1: { fondo: '#f6d8a8', dibujar(ctx) { // El Gallo
    relleno(ctx, '#2f8f3a', 'M58 50 C66 20 92 18 92 42 C86 34 76 34 70 46 Z');
    relleno(ctx, '#2b59c3', 'M60 56 C76 36 98 44 90 64 C86 56 76 54 66 62 Z');
    relleno(ctx, '#f9c74f', 'M62 60 C74 52 90 60 86 74 C82 68 74 66 66 68 Z');
    elipse(ctx, 46, 60, 24, 19, 0, '#c1440e');
    elipse(ctx, 50, 62, 12, 8, -0.3, '#8a2f0a');
    circulo(ctx, 30, 36, 11, '#e0762b');
    relleno(ctx, '#d62839', 'M22 27 Q24 16 29 23 Q32 13 36 23 Q41 16 41 29 Z');
    elipse(ctx, 26, 47, 3, 5, 0, '#d62839');
    relleno(ctx, '#f9c74f', 'M20 35 L10 38 L20 41 Z');
    ojo(ctx, 28, 33); brillo(ctx, 27.4, 32.4, 0.7);
    trazo(ctx, 'M42 77 L40 91 M52 77 L54 91 M34 91 H46 M48 91 H60', '#f4a300', 3);
  } },
  2: { fondo: '#ffd166', dibujar(ctx) { // El Diablito
    relleno(ctx, '#c1121f', 'M34 66 Q50 60 66 66 L70 94 H30 Z');
    trazo(ctx, 'M34 86 Q16 88 20 72', '#c1121f', 4);
    relleno(ctx, '#c1121f', 'M16 70 L22 64 L26 72 Z');
    relleno(ctx, '#7a1010', 'M31 32 L24 12 L40 26 Z');
    relleno(ctx, '#7a1010', 'M69 32 L76 12 L60 26 Z');
    circulo(ctx, 50, 44, 22, '#e63946');
    elipse(ctx, 42, 42, 5, 6, 0, '#ffffff'); elipse(ctx, 58, 42, 5, 6, 0, '#ffffff');
    ojo(ctx, 43, 43, 2.6); ojo(ctx, 57, 43, 2.6);
    trazo(ctx, 'M36 34 L46 37 M64 34 L54 37', '#7a1010', 2.5);
    trazo(ctx, 'M40 53 Q50 61 60 53', '#7a1010', 2.5);
    relleno(ctx, '#ffffff', 'M44 55 L46 59 L48 56 Z');
    trazo(ctx, 'M82 48 V94', '#3b2a1a', 3);
    trazo(ctx, 'M74 48 V38 M82 48 V34 M90 48 V38 M74 48 H90', '#3b2a1a', 3);
  } },
  3: { fondo: '#e9c2d6', dibujar(ctx) { // La Dama
    relleno(ctx, '#6a4c93', 'M28 98 Q32 64 50 60 Q68 64 72 98 Z');
    relleno(ctx, '#f4f1de', 'M40 62 Q50 72 60 62 Q56 60 50 62 Q44 60 40 62 Z');
    rect(ctx, 46, 50, 8, 12, 2, piel);
    circulo(ctx, 50, 34, 16, '#3b2a1a');
    circulo(ctx, 50, 17, 8, '#3b2a1a');
    circulo(ctx, 50, 40, 13, piel);
    relleno(ctx, '#3b2a1a', 'M37 38 Q40 26 50 26 Q60 26 63 38 Q56 30 50 30 Q44 30 37 38 Z');
    ojo(ctx, 45, 40, 1.8); ojo(ctx, 55, 40, 1.8);
    elipse(ctx, 50, 47, 3.5, 2, 0, '#d62839');
    circulo(ctx, 37, 44, 1.8, '#f9c74f'); circulo(ctx, 63, 44, 1.8, '#f9c74f');
    for (const [x, y] of [[38, 22], [42, 18], [36, 18]]) circulo(ctx, x, y, 3.2, '#e0218a');
    circulo(ctx, 39, 19.5, 2, '#f9c74f');
  } },
  4: { fondo: '#b8d8e8', dibujar(ctx) { // El Catrín
    relleno(ctx, '#1d1d2b', 'M28 98 Q30 64 50 60 Q70 64 72 98 Z');
    relleno(ctx, '#ffffff', 'M44 62 L50 82 L56 62 Z');
    relleno(ctx, '#d62839', 'M44 63 L50 67 L56 63 L56 70 L50 67 L44 70 Z');
    circulo(ctx, 50, 43, 12, piel);
    relleno(ctx, '#3b2a1a', 'M41 48 Q46 44 50 48 Q54 44 59 48 Q54 52 50 49 Q46 52 41 48 Z');
    ojo(ctx, 45, 41, 1.8); ojo(ctx, 55, 41, 1.8);
    trazo(ctx, P('M55 41 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0'), '#f4a300', 1.5);
    rect(ctx, 33, 28, 34, 5, 2, '#1d1d2b');
    rect(ctx, 38, 6, 24, 24, 2, '#1d1d2b');
    rect(ctx, 38, 23, 24, 4, 0, '#d62839');
    trazo(ctx, 'M76 62 L84 98', '#f4a300', 3);
    circulo(ctx, 76, 61, 3.5, '#f4a300');
  } },
  5: { fondo: '#c9c3f2', dibujar(ctx) { // El Paraguas
    relleno(ctx, '#6a4c93', 'M8 50 A42 38 0 0 1 92 50 Q85 44 78 50 Q71 44 64 50 Q57 44 50 50 Q43 44 36 50 Q29 44 22 50 Q15 44 8 50 Z');
    relleno(ctx, '#f9c74f', 'M50 12 A14 38 0 0 1 64 50 Q57 44 50 50 Q43 44 36 50 A14 38 0 0 1 50 12 Z');
    trazo(ctx, 'M50 48 L50 82 A8 8 0 0 1 34 82', '#3b2a1a', 4);
    circulo(ctx, 50, 11, 3, '#3b2a1a');
  } },
  6: { fondo: '#5fb3d9', dibujar(ctx) { // La Sirena
    trazo(ctx, 'M4 88 Q12 84 20 88 T36 88 T52 88 T68 88 T84 88 T100 88', 'rgba(255,255,255,.7)', 2.5);
    relleno(ctx, '#2a9d8f', 'M42 56 Q38 76 52 84 Q64 90 60 96 L74 92 Q70 80 62 74 Q54 68 58 56 Z');
    relleno(ctx, '#2a9d8f', 'M58 92 L48 99 L68 99 L76 90 Z');
    trazo(ctx, 'M46 64 Q52 66 56 62 M48 72 Q54 74 60 70', 'rgba(255,255,255,.35)', 2);
    relleno(ctx, piel, 'M42 38 Q50 34 58 38 L58 58 L42 58 Z');
    circulo(ctx, 46, 46, 3.4, '#e0218a'); circulo(ctx, 54, 46, 3.4, '#e0218a');
    relleno(ctx, '#b5412a', 'M38 30 Q38 13 50 15 Q63 13 62 30 Q68 46 60 52 Q61 38 57 28 Q50 22 43 28 Q41 42 34 54 Q32 40 38 30 Z');
    circulo(ctx, 50, 28, 9, piel);
    ojo(ctx, 47, 28, 1.5); ojo(ctx, 53, 28, 1.5);
    trazo(ctx, 'M47 32 Q50 34 53 32', '#b5412a', 1.5);
    circulo(ctx, 44, 20, 2.6, '#f9c74f');
  } },
  7: { fondo: '#ffe8a3', dibujar(ctx) { // La Escalera
    tierra(ctx);
    for (let y = 16; y <= 86; y += 14) rect(ctx, 34, y, 32, 5, 1.5, '#b5793a');
    rect(ctx, 28, 6, 7, 88, 2, '#8a5a2b');
    rect(ctx, 65, 6, 7, 88, 2, '#8a5a2b');
  } },
  8: { fondo: '#c7e9f1', dibujar(ctx) { // La Botella
    tierra(ctx);
    relleno(ctx, '#2f8f5a', 'M38 38 Q38 28 45 24 V12 H55 V24 Q62 28 62 38 V88 Q62 94 56 94 H44 Q38 94 38 88 Z');
    rect(ctx, 44, 6, 12, 7, 2, '#d62839');
    rect(ctx, 38, 52, 24, 24, 2, '#fff3c4');
    trazo(ctx, 'M43 60 H57 M43 66 H53', '#d62839', 2.2);
    rect(ctx, 42, 32, 4, 14, 2, 'rgba(255,255,255,.4)');
  } },
  9: { fondo: '#f3d6b0', dibujar(ctx) { // El Barril
    tierra(ctx);
    relleno(ctx, '#a0612f', 'M28 20 Q22 52 28 84 Q50 94 72 84 Q78 52 72 20 Q50 12 28 20 Z');
    trazo(ctx, 'M40 16 Q36 52 40 90 M60 16 Q64 52 60 90 M50 14 V92', 'rgba(0,0,0,.18)', 1.6);
    trazo(ctx, 'M26 34 Q50 42 74 34 M26 72 Q50 80 74 72', '#4a4a4a', 3.5);
    elipse(ctx, 50, 20, 22, 6, 0, '#c47a3f');
    elipse(ctx, 50, 20, 16, 3.5, 0, '#a0612f');
  } },
  10: { fondo: '#bfe3f5', dibujar(ctx) { // El Árbol
    tierra(ctx, 'rgba(63,143,58,.35)');
    relleno(ctx, '#8a5a2b', 'M44 94 L46 58 L38 48 L44 50 L48 40 L52 50 L60 44 L54 58 L56 94 Z');
    for (const [x, y, r] of [[50, 32, 24], [28, 44, 16], [72, 44, 16], [50, 16, 15], [36, 26, 13], [64, 26, 13]]) circulo(ctx, x, y, r, '#3f8f3a');
    for (const [x, y, r] of [[42, 24, 6], [62, 36, 5], [30, 40, 4]]) circulo(ctx, x, y, r, '#5cb85c');
  } },
  11: { fondo: '#fde2c8', dibujar(ctx) { // El Melón
    tierra(ctx);
    circulo(ctx, 36, 56, 26, '#9acd50');
    trazo(ctx, 'M16 46 Q38 38 60 48 M14 60 Q38 52 62 62 M22 76 Q38 68 56 78 M28 32 Q30 56 26 82 M42 28 Q48 56 42 84', '#6e9e2f', 1.6);
    relleno(ctx, '#3f8f3a', 'M56 70 A20 20 0 0 0 96 70 Z');
    relleno(ctx, '#f8a15b', 'M59 70 A17 17 0 0 0 93 70 Z');
    for (const x of [69, 76, 83]) elipse(ctx, x, 76, 1.6, 2.8, 0, '#fff3c4');
  } },
  12: { fondo: '#f4c542', dibujar(ctx) { // El Valiente (máscara de luchador)
    elipse(ctx, 50, 52, 30, 38, 0, '#d62839');
    relleno(ctx, '#ffffff', 'M26 40 Q34 30 46 40 Q40 52 28 50 Z');
    relleno(ctx, '#ffffff', 'M74 40 Q66 30 54 40 Q60 52 72 50 Z');
    ojo(ctx, 37, 43, 3); ojo(ctx, 63, 43, 3);
    relleno(ctx, '#f9c74f', 'M22 38 Q30 22 46 34 Q34 30 22 38 Z');
    relleno(ctx, '#f9c74f', 'M78 38 Q70 22 54 34 Q66 30 78 38 Z');
    relleno(ctx, '#f9c74f', 'M50 16 L56 30 L50 36 L44 30 Z');
    elipse(ctx, 50, 70, 10, 6, 0, '#ffffff');
    elipse(ctx, 50, 71, 6, 3, 0, '#7a1010');
    trazo(ctx, 'M40 82 Q50 88 60 82', '#f9c74f', 2.5);
    ctx.fillStyle = '#ffffff'; ctx.fill(estrella(5, 5, 2, 16, 16)); ctx.fill(estrella(5, 4, 1.6, 86, 84));
  } },
  13: { fondo: '#c8e6f5', dibujar(ctx) { // El Gorrito
    relleno(ctx, '#e63946', 'M20 70 Q20 30 50 28 Q80 30 80 70 Z');
    trazo(ctx, 'M24 52 Q50 44 76 52 M22 62 Q50 55 78 62', '#ffffff', 4);
    rect(ctx, 16, 66, 68, 16, 5, '#f4f1de');
    trazo(ctx, 'M24 69 V79 M32 69 V79 M40 69 V79 M48 69 V79 M56 69 V79 M64 69 V79 M72 69 V79', 'rgba(0,0,0,.12)', 2);
    circulo(ctx, 50, 24, 10, '#f9c74f');
    circulo(ctx, 47, 21, 3, '#fde38a');
  } },
  14: { fondo: '#2b2d42', dibujar(ctx) { // La Muerte
    trazo(ctx, 'M80 18 L86 98', '#8a5a2b', 3.5);
    relleno(ctx, '#cfd6dc', 'M80 18 Q98 20 99 40 Q90 28 80 27 Z');
    relleno(ctx, '#111111', 'M50 10 Q24 12 24 44 L16 98 H80 L76 44 Q76 12 50 10 Z');
    elipse(ctx, 50, 38, 13, 16, 0, '#e9e3d5');
    circulo(ctx, 45, 35, 3.6, '#111111'); circulo(ctx, 55, 35, 3.6, '#111111');
    relleno(ctx, '#111111', 'M50 40 L47.5 45 H52.5 Z');
    trazo(ctx, 'M43 48 H57 M46 46 V51 M50 46 V51 M54 46 V51', '#111111', 1.3);
  } },
  15: { fondo: '#fff1d0', dibujar(ctx) { // La Pera
    tierra(ctx);
    relleno(ctx, '#b5c84a', 'M50 22 Q40 22 42 40 Q26 56 30 76 Q36 94 50 94 Q64 94 70 76 Q74 56 58 40 Q60 22 50 22 Z');
    trazo(ctx, 'M50 22 Q52 14 56 10', '#6b3f1d', 3);
    relleno(ctx, '#3f8f3a', 'M54 14 Q66 6 72 14 Q62 20 54 14 Z');
    elipse(ctx, 40, 66, 5, 10, 0.2, 'rgba(255,255,255,.35)');
  } },
  16: { fondo: '#dfe9f3', dibujar(ctx) { // La Bandera
    trazo(ctx, 'M22 8 V96', '#6b4a06', 3);
    circulo(ctx, 22, 8, 3, '#f4a300');
    relleno(ctx, '#1e7d3c', 'M24 16 Q34 11 44 15 V57 Q34 53 24 58 Z');
    relleno(ctx, '#f7f7f7', 'M44 15 Q54 19 64 16 V58 Q54 61 44 57 Z');
    relleno(ctx, '#ce1126', 'M64 16 Q74 12 84 16 V58 Q74 54 64 58 Z');
    circulo(ctx, 54, 37, 5, '#a0703a');
  } },
  17: { fondo: '#f6e0c4', dibujar(ctx) { // El Bandolón
    rect(ctx, 46, 8, 8, 40, 2, '#6b3f1d');
    rect(ctx, 43, 3, 14, 9, 3, '#4a2a12');
    elipse(ctx, 50, 66, 24, 28, 0, '#b5652a');
    elipse(ctx, 50, 66, 20, 24, 0, '#c97a3a');
    circulo(ctx, 50, 60, 7, '#3b2a1a');
    rect(ctx, 42, 80, 16, 3, 1, '#4a2a12');
    trazo(ctx, 'M48 8 V82 M50 8 V82 M52 8 V82', 'rgba(255,255,255,.7)', 0.7);
  } },
  18: { fondo: '#e8d7f0', dibujar(ctx) { // El Violoncello
    trazo(ctx, 'M18 84 L84 22', '#3b2a1a', 2.5);
    rect(ctx, 47, 4, 6, 34, 2, '#4a2a12');
    relleno(ctx, '#9c4a1c', 'M50 26 C36 26 34 40 38 48 C30 54 30 88 50 90 C70 88 70 54 62 48 C66 40 64 26 50 26 Z');
    trazo(ctx, 'M42 56 Q40 62 42 68 M58 56 Q60 62 58 68', '#2a1206', 1.8);
    rect(ctx, 45, 72, 10, 2.5, 1, '#2a1206');
    trazo(ctx, 'M48.5 6 V72 M51.5 6 V72', 'rgba(255,255,255,.7)', 0.7);
    trazo(ctx, 'M50 90 V98', '#6b6b6b', 2);
  } },
  19: { fondo: '#bfe6f0', dibujar(ctx) { // La Garza
    trazo(ctx, 'M6 88 Q16 84 26 88 T46 88 T66 88 T86 88', '#5aa9c9', 2.5);
    trazo(ctx, 'M52 60 L50 90 M58 60 L60 90', '#e0a800', 2);
    elipse(ctx, 56, 52, 20, 11, -0.35, '#f7f7f7');
    relleno(ctx, '#dfe6ea', 'M66 46 Q84 48 90 60 Q78 56 68 56 Z');
    trazo(ctx, 'M42 46 Q30 38 38 28 Q44 20 40 14', '#f7f7f7', 6);
    circulo(ctx, 40, 13, 5, '#f7f7f7');
    relleno(ctx, '#e0a800', 'M36 12 L22 15 L36 16 Z');
    ojo(ctx, 41, 12, 1.2);
    trazo(ctx, 'M42 9 Q48 6 52 10', '#1b1b1b', 1.4);
  } },
  20: { fondo: '#fdecc8', dibujar(ctx) { // El Pájaro
    trazo(ctx, 'M8 76 Q50 70 94 80', '#6b3f1d', 4);
    relleno(ctx, '#3f8f3a', 'M70 76 Q78 66 86 72 Q78 78 70 76 Z');
    relleno(ctx, '#1b3a8a', 'M28 54 L10 46 L14 62 Z');
    elipse(ctx, 46, 54, 20, 15, 0, '#2b59c3');
    elipse(ctx, 50, 60, 13, 8, 0, '#f9c74f');
    relleno(ctx, '#1b3a8a', 'M34 50 Q46 40 56 52 Q44 56 34 50 Z');
    circulo(ctx, 64, 40, 10, '#2b59c3');
    relleno(ctx, '#f77f00', 'M72 38 L82 41 L72 44 Z');
    ojo(ctx, 66, 38, 2); brillo(ctx, 65.4, 37.4, 0.6);
    trazo(ctx, 'M44 68 L42 76 M52 68 L54 76', '#f77f00', 2);
  } },
  21: { fondo: '#ffd6c4', dibujar(ctx) { // La Mano
    rect(ctx, 34, 84, 34, 14, 3, '#2b59c3');
    relleno(ctx, piel, 'M36 86 L34 58 Q28 46 32 42 Q37 39 41 50 V22 Q41 16 46 16 Q51 16 51 22 V46 V14 Q51 9 56 9 Q61 9 61 14 V46 V19 Q61 14 66 14 Q71 14 71 19 V50 V32 Q71 26 75 26 Q79 26 79 32 V62 Q79 80 68 86 Z');
    trazo(ctx, 'M46 26 V40 M56 20 V38 M66 26 V42', 'rgba(150,90,60,.35)', 1.4);
    trazo(ctx, 'M44 70 Q56 74 66 68', 'rgba(150,90,60,.35)', 1.4);
  } },
  22: { fondo: '#f3e2b3', dibujar(ctx) { // La Bota
    tierra(ctx);
    relleno(ctx, '#6b3f1d', 'M36 8 H62 V62 Q88 64 90 82 V90 H36 Z');
    rect(ctx, 34, 88, 58, 6, 2, '#2a1206');
    rect(ctx, 36, 84, 12, 10, 1, '#2a1206');
    rect(ctx, 34, 6, 30, 8, 2, '#8a5a2b');
    ctx.setLineDash([2.5, 2.5]); trazo(ctx, 'M40 20 V60 Q64 64 84 76', '#f4d58d', 1.3); ctx.setLineDash([]);
    ctx.fillStyle = '#f9c74f'; ctx.fill(estrella(5, 5, 2, 50, 36));
  } },
  23: { fondo: '#1f3b73', dibujar(ctx) { // La Luna
    relleno(ctx, '#f7e7a6', 'M62 14 A38 38 0 1 0 62 86 A30 30 0 1 1 62 14 Z');
    ctx.fillStyle = '#ffffff';
    ctx.fill(estrella(4, 6, 2, 76, 28, 0)); ctx.fill(estrella(4, 4, 1.4, 84, 60, 0)); ctx.fill(estrella(4, 3, 1, 70, 78, 0));
    circulo(ctx, 31, 40, 2.5, 'rgba(160,120,40,.35)');
    circulo(ctx, 29, 58, 3.2, 'rgba(160,120,40,.35)');
  } },
  24: { fondo: '#fff0c2', dibujar(ctx) { // El Cotorro
    trazo(ctx, 'M10 84 H90', '#6b3f1d', 4);
    relleno(ctx, '#d62839', 'M46 76 L40 98 L50 92 Z');
    relleno(ctx, '#2b59c3', 'M52 76 L56 98 L60 90 Z');
    elipse(ctx, 50, 58, 17, 25, 0, '#3fae49');
    elipse(ctx, 56, 60, 9, 16, -0.2, '#2e8b3a');
    circulo(ctx, 48, 30, 14, '#3fae49');
    circulo(ctx, 44, 30, 6, '#ffffff'); ojo(ctx, 44, 30, 2.4);
    relleno(ctx, '#f9c74f', 'M34 30 Q28 34 32 42 Q36 38 38 36 Z');
    relleno(ctx, '#d62839', 'M52 18 Q58 12 62 20 Q56 22 52 18 Z');
    trazo(ctx, 'M42 82 V86 M56 82 V86', '#6b6b6b', 2.5);
  } },
  25: { fondo: '#e6d3a3', dibujar(ctx) { // El Borracho
    relleno(ctx, '#a0703a', 'M22 34 Q50 10 78 34 Q64 30 50 30 Q36 30 22 34 Z');
    elipse(ctx, 50, 33, 34, 5, 0, '#c9964f');
    circulo(ctx, 50, 56, 24, piel);
    circulo(ctx, 50, 60, 6, '#e05a5a');
    circulo(ctx, 36, 62, 5, 'rgba(230,90,90,.35)'); circulo(ctx, 64, 62, 5, 'rgba(230,90,90,.35)');
    trazo(ctx, 'M38 50 Q42 47 46 50 M54 50 Q58 47 62 50', '#3b2a1a', 2.2);
    trazo(ctx, 'M42 70 Q50 76 58 70', '#3b2a1a', 2.2);
    for (const [x, y, r] of [[80, 50, 4], [86, 40, 3], [90, 30, 2]]) trazo(ctx, P(`M${x + r} ${y} A${r} ${r} 0 1 0 ${x - r} ${y} A${r} ${r} 0 1 0 ${x + r} ${y}`), '#ffffff', 1.4);
    ctx.fillStyle = '#6b3f1d'; ctx.font = '900 9px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('¡hic!', 80, 20);
  } },
  26: { fondo: '#f4a261', dibujar(ctx) { // El Negrito (gatito negro)
    tierra(ctx);
    trazo(ctx, 'M66 80 Q88 78 84 56 Q82 48 88 44', '#1d1d1d', 6);
    elipse(ctx, 50, 72, 22, 18, 0, '#1d1d1d');
    relleno(ctx, '#1d1d1d', 'M32 34 L34 14 L46 28 Z');
    relleno(ctx, '#1d1d1d', 'M68 34 L66 14 L54 28 Z');
    circulo(ctx, 50, 40, 18, '#1d1d1d');
    relleno(ctx, '#e0218a', 'M35 30 L36 20 L42 28 Z');
    relleno(ctx, '#e0218a', 'M65 30 L64 20 L58 28 Z');
    elipse(ctx, 43, 38, 5, 6, 0, '#f9c74f'); elipse(ctx, 57, 38, 5, 6, 0, '#f9c74f');
    elipse(ctx, 43, 38, 1.5, 5, 0, '#1b1b1b'); elipse(ctx, 57, 38, 1.5, 5, 0, '#1b1b1b');
    relleno(ctx, '#e0218a', 'M48 46 H52 L50 49 Z');
    trazo(ctx, 'M38 48 L26 46 M38 51 L26 53 M62 48 L74 46 M62 51 L74 53', 'rgba(255,255,255,.7)', 1);
  } },
  27: { fondo: '#ffd6e4', dibujar(ctx) { // El Corazón
    relleno(ctx, '#d62839', 'M50 86 C20 64 8 44 20 28 C31 14 46 20 50 34 C54 20 69 14 80 28 C92 44 80 64 50 86 Z');
    relleno(ctx, 'rgba(255,255,255,.4)', 'M28 34 C30 26 38 24 42 30 C36 30 32 34 30 40 Z');
  } },
  28: { fondo: '#fff3c4', dibujar(ctx) { // La Sandía
    relleno(ctx, '#2f8f3a', 'M8 40 A42 42 0 0 0 92 40 Z');
    relleno(ctx, '#f4f7e8', 'M13 40 A37 37 0 0 0 87 40 Z');
    relleno(ctx, '#e63946', 'M17 40 A33 33 0 0 0 83 40 Z');
    for (const [x, y] of [[30, 48], [42, 56], [55, 56], [68, 48], [50, 46], [36, 62], [62, 62]]) elipse(ctx, x, y, 2, 3.4, 0, '#1b1b1b');
  } },
  29: { fondo: '#f5d6a0', dibujar(ctx) { // El Tambor
    tierra(ctx);
    rect(ctx, 22, 40, 56, 44, 4, '#d62839');
    trazo(ctx, 'M22 44 L34 80 L46 44 L58 80 L70 44 L78 70', '#fff3e0', 2);
    elipse(ctx, 50, 84, 28, 7, 0, '#b0101c');
    rect(ctx, 20, 38, 60, 6, 3, '#f9c74f');
    elipse(ctx, 50, 40, 28, 8, 0, '#fff3e0');
    trazo(ctx, 'M18 14 L46 36 M82 14 L54 36', '#8a5a2b', 3.5);
    circulo(ctx, 18, 14, 4, '#f4f1de'); circulo(ctx, 82, 14, 4, '#f4f1de');
  } },
  30: { fondo: '#b9e3ea', dibujar(ctx) { // El Camarón
    trazo(ctx, 'M30 30 Q10 20 8 6 M34 28 Q24 14 26 4', '#e76f51', 1.6);
    const segs = [[34, 34, 12], [48, 32, 12], [62, 38, 11.5], [70, 50, 10.5], [70, 63, 9.5], [63, 73, 8.5], [53, 78, 7.5]];
    for (const [x, y, r] of segs) circulo(ctx, x, y, r, '#f28c6b');
    for (const [x, y, r] of segs) trazo(ctx, P(`M${x - r * 0.7} ${y - r * 0.7} Q${x} ${y - r * 1.1} ${x + r * 0.7} ${y - r * 0.7}`), '#e76f51', 1.4);
    relleno(ctx, '#e76f51', 'M48 78 L36 70 L38 86 Z');
    relleno(ctx, '#e76f51', 'M48 80 L34 88 L46 92 Z');
    trazo(ctx, 'M40 44 L36 54 M50 44 L48 54 M60 48 L58 58', '#e76f51', 1.4);
    ojo(ctx, 28, 32, 2.4); brillo(ctx, 27.4, 31.4, 0.7);
  } },
  31: { fondo: '#f6e7c1', dibujar(ctx) { // Las Jaras
    trazo(ctx, 'M20 86 L80 14 M80 86 L20 14', '#8a5a2b', 3.5);
    relleno(ctx, '#7d8791', 'M80 14 L70 16 L78 24 Z'); relleno(ctx, '#7d8791', 'M20 14 L22 24 L30 16 Z');
    relleno(ctx, '#d62839', 'M20 86 L14 80 L24 78 Z'); relleno(ctx, '#d62839', 'M24 82 L18 76 L28 74 Z');
    relleno(ctx, '#2b59c3', 'M80 86 L86 80 L76 78 Z'); relleno(ctx, '#2b59c3', 'M76 82 L82 76 L72 74 Z');
    relleno(ctx, '#f9c74f', 'M44 50 Q50 42 56 50 Q50 58 44 50 Z');
    trazo(ctx, 'M48 52 L40 64 M52 52 L60 64', '#f9c74f', 2.5);
  } },
  32: { fondo: '#fde2e4', dibujar(ctx) { // El Músico (guitarra y notas)
    rect(ctx, 46, 6, 8, 38, 2, '#6b3f1d');
    rect(ctx, 43, 2, 14, 8, 3, '#4a2a12');
    circulo(ctx, 50, 70, 21, '#e09f3e');
    circulo(ctx, 50, 48, 15, '#e09f3e');
    circulo(ctx, 50, 60, 6.5, '#3b2a1a');
    rect(ctx, 42, 78, 16, 3, 1, '#4a2a12');
    trazo(ctx, 'M48 6 V79 M50 6 V79 M52 6 V79', 'rgba(255,255,255,.7)', 0.7);
    circulo(ctx, 74, 28, 4, '#1b1b1b'); trazo(ctx, 'M78 28 V12 L86 10', '#1b1b1b', 2);
    circulo(ctx, 20, 40, 3.4, '#1b1b1b'); circulo(ctx, 30, 36, 3.4, '#1b1b1b'); trazo(ctx, 'M23.4 40 V26 L33.4 22 V36', '#1b1b1b', 2);
  } },
  33: { fondo: '#dcd6f7', dibujar(ctx) { // La Araña
    for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4; trazo(ctx, P(`M50 50 L${50 + 50 * Math.cos(a)} ${50 + 50 * Math.sin(a)}`), 'rgba(80,80,110,.35)', 0.8); }
    for (const r of [12, 24, 36, 48]) {
      const p = new Path2D();
      for (let i = 0; i <= 8; i++) { const a = (i * Math.PI) / 4; const x = 50 + r * Math.cos(a); const y = 50 + r * Math.sin(a); if (i) p.lineTo(x, y); else p.moveTo(x, y); }
      trazo(ctx, p, 'rgba(80,80,110,.35)', 0.8);
    }
    trazo(ctx, 'M50 0 V36', '#1b1b1b', 1);
    for (const s of [-1, 1]) trazo(ctx, P(`M50 52 L${50 + s * 16} 42 L${50 + s * 22} 34 M50 54 L${50 + s * 20} 52 L${50 + s * 28} 46 M50 58 L${50 + s * 20} 64 L${50 + s * 26} 72 M50 60 L${50 + s * 14} 70 L${50 + s * 18} 80`), '#1b1b1b', 2.4);
    circulo(ctx, 50, 60, 10, '#1b1b1b');
    circulo(ctx, 50, 45, 7, '#1b1b1b');
    circulo(ctx, 47.5, 44, 1.6, '#d62839'); circulo(ctx, 52.5, 44, 1.6, '#d62839');
  } },
  34: { fondo: '#cfe8d8', dibujar(ctx) { // El Soldado (de juguete)
    tierra(ctx);
    rect(ctx, 41, 72, 8, 20, 2, '#1d3557'); rect(ctx, 51, 72, 8, 20, 2, '#1d3557');
    rect(ctx, 39, 88, 10, 6, 2, '#1b1b1b'); rect(ctx, 51, 88, 10, 6, 2, '#1b1b1b');
    rect(ctx, 37, 44, 26, 30, 4, '#d62839');
    trazo(ctx, 'M38 46 L62 72 M62 46 L38 72', '#f4f1de', 2.5);
    for (const y of [52, 60, 68]) circulo(ctx, 50, y, 1.6, '#f9c74f');
    rect(ctx, 31, 46, 7, 22, 3, '#d62839'); rect(ctx, 62, 46, 7, 22, 3, '#d62839');
    circulo(ctx, 50, 36, 8, piel);
    circulo(ctx, 45, 38, 2, 'rgba(230,90,90,.5)'); circulo(ctx, 55, 38, 2, 'rgba(230,90,90,.5)');
    ojo(ctx, 47, 35, 1.2); ojo(ctx, 53, 35, 1.2);
    rect(ctx, 41, 8, 18, 24, 5, '#1b1b1b');
    rect(ctx, 41, 26, 18, 3, 0, '#f9c74f');
    circulo(ctx, 50, 12, 2.5, '#d62839');
  } },
  35: { fondo: '#26215c', dibujar(ctx) { // La Estrella
    ctx.fillStyle = '#f9c74f'; ctx.fill(estrella(5, 42, 18));
    ctx.fillStyle = '#ffe9a8'; ctx.fill(estrella(5, 22, 9));
    circulo(ctx, 16, 18, 2.5, '#ffffff'); circulo(ctx, 86, 82, 2, '#ffffff'); circulo(ctx, 84, 16, 1.6, '#ffffff');
  } },
  36: { fondo: '#f3d9c0', dibujar(ctx) { // El Cazo
    trazo(ctx, 'M40 30 Q36 22 40 16 M50 28 Q46 20 50 12 M60 30 Q56 22 60 16', 'rgba(255,255,255,.8)', 2);
    tierra(ctx);
    relleno(ctx, '#c86b3a', 'M18 42 H82 Q80 84 50 86 Q20 84 18 42 Z');
    trazo(ctx, 'M24 60 Q50 66 76 60', 'rgba(0,0,0,.12)', 2);
    elipse(ctx, 50, 42, 33, 7, 0, '#e08850');
    elipse(ctx, 50, 42, 28, 4.5, 0, '#8a3f1a');
    trazo(ctx, 'M16 44 Q4 44 6 34 M84 44 Q96 44 94 34', '#8a3f1a', 3.5);
    elipse(ctx, 34, 64, 3, 10, 0.3, 'rgba(255,255,255,.3)');
  } },
  37: { fondo: '#1d3557', dibujar(ctx) { // El Mundo
    rect(ctx, 34, 90, 32, 6, 2, '#f4a300');
    trazo(ctx, 'M50 84 V90', '#f4a300', 3);
    trazo(ctx, P('M50 50 m-40 0 a40 40 0 0 0 80 0'), '#f4a300', 3);
    circulo(ctx, 50, 48, 34, '#4fb3d9');
    relleno(ctx, '#57a773', 'M30 30 Q40 22 50 28 Q46 36 38 38 Q32 44 26 40 Q24 34 30 30 Z');
    relleno(ctx, '#57a773', 'M56 40 Q70 34 76 46 Q72 60 62 58 Q58 66 50 62 Q52 50 56 40 Z');
    relleno(ctx, '#57a773', 'M30 58 Q38 56 40 64 Q34 72 28 66 Z');
    trazo(ctx, P('M50 14 Q30 48 50 82 M50 14 Q70 48 50 82 M16 48 H84'), 'rgba(255,255,255,.4)', 1.2);
  } },
  38: { fondo: '#f1d8b0', dibujar(ctx) { // El Apache (arco, flecha y plumas)
    trazo(ctx, 'M28 10 Q76 50 28 90', '#8a5a2b', 5);
    trazo(ctx, 'M28 10 L28 90', '#f4f1de', 1.2);
    trazo(ctx, 'M12 50 H88', '#6b3f1d', 2.5);
    relleno(ctx, '#7d8791', 'M92 50 L82 44 L82 56 Z');
    relleno(ctx, '#d62839', 'M12 50 L6 42 L16 46 Z'); relleno(ctx, '#2a9d8f', 'M12 50 L6 58 L16 54 Z');
    trazo(ctx, 'M40 62 V76 M46 58 V70', '#6b3f1d', 1.2);
    relleno(ctx, '#f77f00', 'M40 76 Q36 86 40 94 Q44 86 40 76 Z');
    relleno(ctx, '#2a9d8f', 'M46 70 Q42 80 46 88 Q50 80 46 70 Z');
    circulo(ctx, 40, 72, 2, '#d62839'); circulo(ctx, 46, 66, 2, '#f9c74f');
  } },
  39: { fondo: '#f6e3b4', dibujar(ctx) { // El Nopal
    ctx.fillStyle = '#3f8f3a';
    for (const [x, y, rx, ry, g] of [[50, 66, 17, 24, 0], [33, 38, 12, 17, -30], [67, 36, 12, 17, 30]]) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, (g * Math.PI) / 180, 0, Math.PI * 2); ctx.fill(); }
    for (const [x, y] of [[46, 58], [55, 70], [48, 78], [33, 36], [36, 44], [66, 34], [70, 42], [56, 60]]) circulo(ctx, x, y, 1.6, '#e8f5c8');
    circulo(ctx, 27, 21, 5, '#d62839'); circulo(ctx, 73, 19, 5, '#d62839');
    relleno(ctx, '#b5652a', 'M30 92 H70 L66 100 H34 Z');
  } },
  40: { fondo: '#f5e6a8', dibujar(ctx) { // El Alacrán
    trazo(ctx, 'M34 62 L20 72 M34 58 L18 60 M66 62 L80 72 M66 58 L82 60 M36 68 L26 80 M64 68 L74 80', '#6b3f1d', 2.2);
    trazo(ctx, 'M42 44 Q30 36 26 26 M58 44 Q70 36 74 26', '#8c5a2b', 3.5);
    elipse(ctx, 24, 22, 6, 8, -0.4, '#8c5a2b'); elipse(ctx, 76, 22, 6, 8, 0.4, '#8c5a2b');
    relleno(ctx, '#f5e6a8', 'M22 16 L24 24 L28 18 Z'); relleno(ctx, '#f5e6a8', 'M78 16 L76 24 L72 18 Z');
    for (const [y, r] of [[48, 9], [58, 11], [69, 10]]) elipse(ctx, 50, y, r, 6, 0, '#8c5a2b');
    for (const [x, y, r] of [[50, 78, 5], [54, 86, 4.5], [62, 91, 4], [70, 90, 3.8], [76, 84, 3.6]]) circulo(ctx, x, y, r, '#a06a36');
    relleno(ctx, '#3b2a1a', 'M78 80 L86 74 L80 84 Z');
    ojo(ctx, 47, 46, 1.2); ojo(ctx, 53, 46, 1.2);
  } },
  41: { fondo: '#dff2d8', dibujar(ctx) { // La Rosa
    trazo(ctx, 'M50 48 Q46 72 52 96', '#2d6a4f', 3.5);
    elipse(ctx, 38, 70, 10, 5, -0.6, '#3f8f3a'); elipse(ctx, 62, 80, 10, 5, 0.6, '#3f8f3a');
    trazo(ctx, 'M47 60 L44 58 M51 76 L54 74', '#2d6a4f', 1.5);
    circulo(ctx, 50, 34, 22, '#d62839');
    circulo(ctx, 40, 44, 11, '#c1121f'); circulo(ctx, 60, 44, 11, '#c1121f');
    circulo(ctx, 50, 32, 13, '#e63946');
    trazo(ctx, 'M50 32 m-6 0 a6 6 0 1 1 6 6 a9 9 0 1 1 9 -9', '#a4161a', 2);
  } },
  42: { fondo: '#6a4c93', dibujar(ctx) { // La Calavera (calaverita de azúcar)
    circulo(ctx, 50, 42, 30, '#f7f3ea');
    rect(ctx, 34, 60, 32, 24, 8, '#f7f3ea');
    const flor = (x, y, c) => { for (let i = 0; i < 6; i++) { const a = (i * Math.PI) / 3; circulo(ctx, x + 6 * Math.cos(a), y + 6 * Math.sin(a), 4, c); } circulo(ctx, x, y, 4.5, '#1b1b1b'); };
    flor(38, 44, '#e0218a'); flor(62, 44, '#2a9d8f');
    relleno(ctx, '#1b1b1b', 'M50 52 Q45 58 50 62 Q55 58 50 52 Z');
    trazo(ctx, 'M38 72 H62 M42 67 V77 M46 67 V77 M50 67 V77 M54 67 V77 M58 67 V77', '#1b1b1b', 1.5);
    for (const [x, c] of [[40, '#f9c74f'], [50, '#e63946'], [60, '#2b59c3']]) circulo(ctx, x, 24, 3.5, c);
    trazo(ctx, 'M30 38 Q34 30 40 30 M70 38 Q66 30 60 30', '#e0218a', 1.6);
  } },
  43: { fondo: '#f3c9a0', dibujar(ctx) { // La Campana
    relleno(ctx, '#b8860b', 'M50 14 C32 14 28 34 28 50 C28 62 22 70 16 76 H84 C78 70 72 62 72 50 C72 34 68 14 50 14 Z');
    relleno(ctx, '#f9c74f', 'M50 18 C38 18 35 34 35 50 C35 60 31 67 27 72 H50 Z');
    rect(ctx, 14, 76, 72, 6, 0, '#8a6208');
    circulo(ctx, 50, 88, 6, '#6b4a06');
    rect(ctx, 46, 6, 8, 9, 0, '#6b4a06');
    trazo(ctx, 'M8 40 L16 44 M92 40 L84 44', 'rgba(0,0,0,.25)', 2.5);
  } },
  44: { fondo: '#f6d4b7', dibujar(ctx) { // El Cantarito
    tierra(ctx);
    trazo(ctx, 'M68 40 Q86 44 76 66', '#a44f2c', 5);
    circulo(ctx, 50, 62, 26, '#c1623a');
    rect(ctx, 40, 22, 20, 18, 4, '#c1623a');
    elipse(ctx, 50, 22, 13, 4, 0, '#a44f2c');
    trazo(ctx, 'M26 58 Q50 66 74 58', '#f4f1de', 2.5);
    for (const x of [32, 41, 50, 59, 68]) circulo(ctx, x, 70, 2.2, '#f4f1de');
    trazo(ctx, 'M30 76 Q50 84 70 76', '#f4f1de', 2);
    elipse(ctx, 38, 52, 4, 9, 0.4, 'rgba(255,255,255,.25)');
  } },
  45: { fondo: '#e8f0d0', dibujar(ctx) { // El Venado
    trazo(ctx, 'M40 32 L34 18 L26 14 M34 18 L32 8 M60 32 L66 18 L74 14 M66 18 L68 8 M36 24 L28 24 M64 24 L72 24', '#8a5a2b', 3);
    elipse(ctx, 32, 40, 9, 5, -0.5, '#a06a36'); elipse(ctx, 68, 40, 9, 5, 0.5, '#a06a36');
    relleno(ctx, '#b07a45', 'M50 28 Q64 30 62 50 Q60 66 54 80 Q50 86 46 80 Q40 66 38 50 Q36 30 50 28 Z');
    elipse(ctx, 50, 76, 7, 6, 0, '#f4ead8');
    circulo(ctx, 50, 80, 3.4, '#1b1b1b');
    ojo(ctx, 44, 46, 2.4); ojo(ctx, 56, 46, 2.4);
    brillo(ctx, 43.4, 45.4, 0.7); brillo(ctx, 55.4, 45.4, 0.7);
    for (const [x, y] of [[46, 58], [54, 60], [50, 52]]) circulo(ctx, x, y, 1.3, '#f4ead8');
  } },
  46: { fondo: '#7cc6f2', dibujar(ctx) { // El Sol
    ctx.fillStyle = '#f77f00'; ctx.fill(estrella(12, 44, 27));
    circulo(ctx, 50, 50, 27, '#f9c74f');
    circulo(ctx, 41, 46, 3.2, '#5a2d0c'); circulo(ctx, 59, 46, 3.2, '#5a2d0c');
    trazo(ctx, P('M40 54 A10 10 0 0 0 60 54'), '#5a2d0c', 3);
    circulo(ctx, 36, 56, 4, 'rgba(230,57,70,.35)'); circulo(ctx, 64, 56, 4, 'rgba(230,57,70,.35)');
  } },
  47: { fondo: '#8e2c48', dibujar(ctx) { // La Corona
    relleno(ctx, '#f4c20d', 'M18 72 L22 32 L37 52 L50 24 L63 52 L78 32 L82 72 Z');
    rect(ctx, 18, 70, 64, 14, 3, '#e0a800');
    for (const [x, y] of [[22, 30], [50, 22], [78, 30]]) circulo(ctx, x, y, 4, '#f9e79f');
    circulo(ctx, 50, 77, 4, '#d62839'); circulo(ctx, 34, 77, 3, '#2b59c3'); circulo(ctx, 66, 77, 3, '#2b59c3');
    circulo(ctx, 50, 54, 4, '#2a9d8f');
    trazo(ctx, 'M24 60 L30 44', 'rgba(255,255,255,.4)', 2);
  } },
  48: { fondo: '#9ad7e0', dibujar(ctx) { // La Chalupa
    trazo(ctx, 'M4 84 Q14 80 24 84 T44 84 T64 84 T84 84 T104 84', '#3a86a8', 2.5);
    for (const [x, y, c] of [[30, 48, '#e0218a'], [40, 42, '#f9c74f'], [50, 46, '#e63946'], [60, 41, '#f77f00'], [70, 47, '#e0218a'], [45, 52, '#2a9d8f'], [58, 52, '#6a4c93']]) {
      for (let i = 0; i < 5; i++) { const a = (i * 2 * Math.PI) / 5; circulo(ctx, x + 3.2 * Math.cos(a), y + 3.2 * Math.sin(a), 2.8, c); }
      circulo(ctx, x, y, 1.8, '#fff3c4');
    }
    relleno(ctx, '#8a5a2b', 'M8 58 H92 Q86 80 50 80 Q14 80 8 58 Z');
    rect(ctx, 8, 57, 84, 5, 2, '#e63946');
    trazo(ctx, 'M20 66 H80', '#f9c74f', 2);
  } },
  49: { fondo: '#dbeefa', dibujar(ctx) { // El Pino
    tierra(ctx, 'rgba(45,106,79,.3)');
    rect(ctx, 45, 78, 10, 16, 1, '#8a5a2b');
    relleno(ctx, '#2d6a4f', 'M50 40 L80 80 H20 Z');
    relleno(ctx, '#40916c', 'M50 24 L74 58 H26 Z');
    relleno(ctx, '#52b788', 'M50 8 L68 38 H32 Z');
  } },
  50: { fondo: '#9ad7e0', dibujar(ctx) { // El Pescado
    relleno(ctx, '#f77f00', 'M78 50 L96 34 L96 66 Z');
    elipse(ctx, 46, 50, 34, 20, 0, '#f77f00');
    relleno(ctx, '#ffb347', 'M36 32 Q48 18 60 32 Z');
    for (const x of [44, 54, 64]) trazo(ctx, P(`M${x + 9 * Math.cos(-0.9)} ${50 + 9 * Math.sin(-0.9)} A9 9 0 0 1 ${x + 9 * Math.cos(0.9)} ${50 + 9 * Math.sin(0.9)}`), 'rgba(120,50,0,.35)', 2);
    circulo(ctx, 24, 46, 5, '#ffffff'); circulo(ctx, 23, 46, 2.6, '#1b1b1b');
    circulo(ctx, 90, 22, 3, 'rgba(255,255,255,.8)'); circulo(ctx, 84, 12, 2, 'rgba(255,255,255,.8)');
  } },
  51: { fondo: '#fde8b0', dibujar(ctx) { // La Palma
    circulo(ctx, 82, 16, 9, '#f9c74f');
    elipse(ctx, 50, 94, 36, 7, 0, '#e9c46a');
    trazo(ctx, 'M50 92 Q46 64 56 34', '#a0703a', 6, 'butt');
    trazo(ctx, 'M49 84 H53 M48 74 H52 M49 64 H53 M51 54 H55 M53 44 H57', '#7a5024', 1.2);
    for (const d of ['M56 32 Q36 18 14 30 Q36 26 56 36 Z', 'M56 32 Q76 16 94 30 Q74 26 56 36 Z', 'M56 32 Q40 36 26 56 Q42 42 56 36 Z', 'M56 32 Q74 38 84 58 Q70 42 56 36 Z', 'M56 32 Q54 14 64 6 Q60 20 58 34 Z']) relleno(ctx, '#3f8f3a', d);
    circulo(ctx, 52, 38, 3.4, '#6b3f1d'); circulo(ctx, 58, 39, 3.4, '#6b3f1d');
  } },
  52: { fondo: '#d8f0c8', dibujar(ctx) { // La Maceta
    trazo(ctx, 'M50 60 L50 30 M50 50 L34 32 M50 48 L68 30', '#3f8f3a', 3);
    const flor = (x, y, c) => { for (let i = 0; i < 6; i++) { const a = (i * Math.PI) / 3; circulo(ctx, x + 6 * Math.cos(a), y + 6 * Math.sin(a), 5, c); } circulo(ctx, x, y, 4, '#f9c74f'); };
    flor(50, 24, '#e63946'); flor(32, 28, '#d6246e'); flor(68, 26, '#f77f00');
    relleno(ctx, '#c1623a', 'M26 60 H74 L68 94 H32 Z');
    rect(ctx, 22, 58, 56, 8, 1, '#a44f2c');
    relleno(ctx, 'rgba(255,255,255,.25)', 'M34 70 H42 L40 88 H36 Z');
  } },
  53: { fondo: '#f1e0f7', dibujar(ctx) { // El Arpa
    for (let i = 0; i < 9; i++) { const x = 30 + i * 5; trazo(ctx, P(`M${x} ${20 + i * 3.4} V86`), '#f4f1de', 1); }
    trazo(ctx, 'M26 88 V14 Q48 8 60 24 Q72 40 82 44', '#b8860b', 5);
    trazo(ctx, 'M26 88 L82 44', '#b8860b', 5);
    rect(ctx, 20, 86, 18, 8, 2, '#8a6208');
    circulo(ctx, 26, 14, 4, '#f4c20d');
  } },
  54: { fondo: '#c8ecd0', dibujar(ctx) { // La Rana
    elipse(ctx, 50, 84, 40, 11, 0, '#2d6a4f');
    relleno(ctx, '#c8ecd0', 'M50 84 L86 76 L90 84 Z');
    elipse(ctx, 26, 76, 12, 6, 0.3, '#4caf50'); elipse(ctx, 74, 76, 12, 6, -0.3, '#4caf50');
    elipse(ctx, 50, 62, 26, 20, 0, '#4caf50');
    elipse(ctx, 50, 68, 16, 11, 0, '#a5d6a7');
    circulo(ctx, 36, 42, 9, '#4caf50'); circulo(ctx, 64, 42, 9, '#4caf50');
    circulo(ctx, 36, 41, 5.5, '#ffffff'); circulo(ctx, 64, 41, 5.5, '#ffffff');
    ojo(ctx, 37, 42, 2.8); ojo(ctx, 63, 42, 2.8);
    trazo(ctx, P('M38 56 A12 8 0 0 0 62 56'), '#1b5e20', 2.2);
    for (const [x, y] of [[40, 64], [60, 62], [50, 72]]) circulo(ctx, x, y, 2, '#388e3c');
    circulo(ctx, 42, 58, 3, 'rgba(230,90,90,.3)'); circulo(ctx, 58, 58, 3, 'rgba(230,90,90,.3)');
  } },
};

export const TOTAL_DIBUJOS = Object.keys(DIBUJOS).length;

/** Ilustración de la carta n: { id, nombre, fondo, dibujar(ctx) } con el nombre de la app. */
export const ilustracion = (n) => ({ id: n, nombre: cartaPorId(n).nombre, ...DIBUJOS[n] });

/**
 * Dibuja una carta completa (papel, recuadro de color, ilustración, número y nombre) en (x, y) con ancho w.
 * La proporción es la de las cartas de la app. Devuelve el alto.
 */
export function dibujarCarta(ctx, ilust, numero, x, y, w, { sombra = true, tinta = '#7a1f1f' } = {}) {
  const h = w / PROPORCION_CARTA;
  const r = w * 0.06;
  ctx.save();
  if (sombra) { ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = w * 0.12; ctx.shadowOffsetY = w * 0.04; }
  ctx.fillStyle = '#fffaf0';
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
  ctx.restore();

  const m = w * 0.07;
  const artW = w - 2 * m;
  const artH = h * 0.72;
  ctx.save();
  ctx.beginPath(); ctx.roundRect(x + m, y + m, artW, artH, r * 0.6); ctx.clip();
  ctx.fillStyle = ilust.fondo;
  ctx.fillRect(x + m, y + m, artW, artH);
  const lado = Math.min(artW, artH) * 0.92;
  ctx.translate(x + m + (artW - lado) / 2, y + m + (artH - lado) / 2 + (artH - lado) * 0.1);
  ctx.scale(lado / 100, lado / 100);
  ilust.dibujar(ctx);
  ctx.restore();

  // Número sobre una pastilla de papel: se lee igual en fondos claros y oscuros
  ctx.save();
  ctx.font = `800 ${w * 0.1}px Nunito, sans-serif`;
  const anchoNumero = ctx.measureText(String(numero)).width;
  ctx.fillStyle = 'rgba(255,250,240,.88)';
  ctx.beginPath(); ctx.roundRect(x + m * 1.4 - w * 0.025, y + m * 1.2 - w * 0.012, anchoNumero + w * 0.05, w * 0.12, w * 0.035); ctx.fill();
  ctx.fillStyle = tinta;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(String(numero), x + m * 1.4, y + m * 1.2);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let tam = w * 0.115;
  const nombre = ilust.nombre.toUpperCase();
  ctx.font = `900 ${tam}px 'Playfair Display', serif`;
  while (ctx.measureText(nombre).width > artW && tam > 6) { tam -= 1; ctx.font = `900 ${tam}px 'Playfair Display', serif`; }
  ctx.fillText(nombre, x + w / 2, y + m + artH + (h - m - artH) / 2);
  ctx.restore();
  return h;
}

/** Espera a que estén cargadas las tipografías de las cartas (el canvas no las pide solo). */
export async function cargarTipografias() {
  if (typeof document === 'undefined' || !document.fonts) return;
  await Promise.all([
    document.fonts.load("900 40px 'Playfair Display'"),
    document.fonts.load('800 40px Nunito'),
    document.fonts.load('900 10px Nunito'),
  ]).catch(() => {});
}

/** Imagen de una carta como Blob (JPEG), del ancho pedido. La carta ocupa toda la imagen. */
export function imagenCarta(n, ancho = 800, tipo = 'image/jpeg', calidad = 0.9) {
  const alto = Math.round(ancho / PROPORCION_CARTA);
  const lienzo = document.createElement('canvas');
  lienzo.width = ancho;
  lienzo.height = alto;
  const ctx = lienzo.getContext('2d');
  ctx.fillStyle = '#fffaf0';
  ctx.fillRect(0, 0, ancho, alto);
  dibujarCarta(ctx, ilustracion(n), n, 0, 0, ancho, { sombra: false });
  return new Promise((resolver, rechazar) =>
    lienzo.toBlob((b) => (b ? resolver(b) : rechazar(new Error(`No se pudo dibujar la carta ${n}`))), tipo, calidad));
}
