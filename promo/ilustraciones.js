// Ilustraciones ORIGINALES de cartas (dibujadas para este proyecto, sin relación con barajas comerciales).
// Libres para usar en videos, redes y la propia app. Cada una se dibuja en un cuadro de 100 × 100
// con el canvas 2D, así se ven nítidas en cualquier tamaño.

const P = (d) => new Path2D(d);

function circulo(ctx, x, y, r, color) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function estrella(puntas, rExt, rInt, cx = 50, cy = 50, giro = -90) {
  const p = new Path2D();
  for (let i = 0; i < puntas * 2; i++) {
    const r = i % 2 ? rInt : rExt;
    const a = ((giro + (i * 180) / puntas) * Math.PI) / 180;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    if (i === 0) p.moveTo(x, y);
    else p.lineTo(x, y);
  }
  p.closePath();
  return p;
}

export const ILUSTRACIONES = [
  {
    id: 'sol', nombre: 'El Sol', fondo: '#7cc6f2',
    dibujar(ctx) {
      ctx.fillStyle = '#f77f00';
      ctx.fill(estrella(12, 44, 27));
      circulo(ctx, 50, 50, 27, '#f9c74f');
      circulo(ctx, 41, 46, 3.2, '#5a2d0c');
      circulo(ctx, 59, 46, 3.2, '#5a2d0c');
      ctx.strokeStyle = '#5a2d0c'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(50, 54, 10, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
      circulo(ctx, 36, 56, 4, 'rgba(230,57,70,.35)');
      circulo(ctx, 64, 56, 4, 'rgba(230,57,70,.35)');
    },
  },
  {
    id: 'luna', nombre: 'La Luna', fondo: '#1f3b73',
    dibujar(ctx) {
      ctx.fillStyle = '#f7e7a6';
      ctx.fill(P('M62 14 A38 38 0 1 0 62 86 A30 30 0 1 1 62 14 Z'));
      ctx.fillStyle = '#ffffff';
      ctx.fill(estrella(4, 6, 2, 76, 28, 0));
      ctx.fill(estrella(4, 4, 1.4, 84, 60, 0));
      ctx.fill(estrella(4, 3, 1, 70, 78, 0));
      circulo(ctx, 38, 44, 3, 'rgba(160,120,40,.35)');
      circulo(ctx, 30, 62, 4.5, 'rgba(160,120,40,.35)');
    },
  },
  {
    id: 'corazon', nombre: 'El Corazón', fondo: '#ffd6e4',
    dibujar(ctx) {
      ctx.fillStyle = '#d62839';
      ctx.fill(P('M50 86 C20 64 8 44 20 28 C31 14 46 20 50 34 C54 20 69 14 80 28 C92 44 80 64 50 86 Z'));
      ctx.fillStyle = 'rgba(255,255,255,.4)';
      ctx.fill(P('M28 34 C30 26 38 24 42 30 C36 30 32 34 30 40 Z'));
    },
  },
  {
    id: 'estrella', nombre: 'La Estrella', fondo: '#26215c',
    dibujar(ctx) {
      ctx.fillStyle = '#f9c74f';
      ctx.fill(estrella(5, 42, 18));
      ctx.fillStyle = '#ffe9a8';
      ctx.fill(estrella(5, 22, 9));
      circulo(ctx, 16, 18, 2.5, '#ffffff');
      circulo(ctx, 86, 82, 2, '#ffffff');
      circulo(ctx, 84, 16, 1.6, '#ffffff');
    },
  },
  {
    id: 'nopal', nombre: 'El Nopal', fondo: '#f6e3b4',
    dibujar(ctx) {
      ctx.fillStyle = '#3f8f3a';
      const penca = (cx, cy, rx, ry, giro) => { ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, (giro * Math.PI) / 180, 0, Math.PI * 2); ctx.fill(); };
      penca(50, 66, 17, 24, 0);
      penca(33, 38, 12, 17, -30);
      penca(67, 36, 12, 17, 30);
      ctx.fillStyle = '#2d6b2a';
      for (const [x, y] of [[46, 58], [55, 70], [48, 78], [33, 36], [36, 44], [66, 34], [70, 42], [56, 60]]) circulo(ctx, x, y, 1.6, '#e8f5c8');
      circulo(ctx, 27, 21, 5, '#d62839');
      circulo(ctx, 73, 19, 5, '#d62839');
      ctx.fillStyle = '#b5652a';
      ctx.fill(P('M30 92 H70 L66 100 H34 Z'));
    },
  },
  {
    id: 'pescado', nombre: 'El Pescado', fondo: '#9ad7e0',
    dibujar(ctx) {
      ctx.fillStyle = '#f77f00';
      ctx.fill(P('M78 50 L96 34 L96 66 Z'));
      ctx.beginPath(); ctx.ellipse(46, 50, 34, 20, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffb347';
      ctx.fill(P('M36 32 Q48 18 60 32 Z'));
      ctx.strokeStyle = 'rgba(120,50,0,.35)'; ctx.lineWidth = 2;
      for (const x of [44, 54, 64]) { ctx.beginPath(); ctx.arc(x, 50, 9, -0.9, 0.9); ctx.stroke(); }
      circulo(ctx, 24, 46, 5, '#ffffff');
      circulo(ctx, 23, 46, 2.6, '#1b1b1b');
      circulo(ctx, 90, 22, 3, 'rgba(255,255,255,.8)');
      circulo(ctx, 84, 12, 2, 'rgba(255,255,255,.8)');
    },
  },
  {
    id: 'sandia', nombre: 'La Sandía', fondo: '#fff3c4',
    dibujar(ctx) {
      ctx.fillStyle = '#2f8f3a';
      ctx.fill(P('M8 40 A42 42 0 0 0 92 40 Z'));
      ctx.fillStyle = '#f4f7e8';
      ctx.fill(P('M13 40 A37 37 0 0 0 87 40 Z'));
      ctx.fillStyle = '#e63946';
      ctx.fill(P('M17 40 A33 33 0 0 0 83 40 Z'));
      ctx.fillStyle = '#1b1b1b';
      for (const [x, y] of [[30, 48], [42, 56], [55, 56], [68, 48], [50, 46], [36, 62], [62, 62]]) {
        ctx.beginPath(); ctx.ellipse(x, y, 2, 3.4, 0, 0, Math.PI * 2); ctx.fill();
      }
    },
  },
  {
    id: 'paraguas', nombre: 'El Paraguas', fondo: '#c9c3f2',
    dibujar(ctx) {
      ctx.fillStyle = '#6a4c93';
      ctx.fill(P('M8 50 A42 38 0 0 1 92 50 Q85 44 78 50 Q71 44 64 50 Q57 44 50 50 Q43 44 36 50 Q29 44 22 50 Q15 44 8 50 Z'));
      ctx.fillStyle = '#f9c74f';
      ctx.fill(P('M50 12 A14 38 0 0 1 64 50 Q57 44 50 50 Q43 44 36 50 A14 38 0 0 1 50 12 Z'));
      ctx.strokeStyle = '#3b2a1a'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(50, 48); ctx.lineTo(50, 82); ctx.arc(42, 82, 8, 0, Math.PI); ctx.stroke();
      circulo(ctx, 50, 11, 3, '#3b2a1a');
    },
  },
  {
    id: 'campana', nombre: 'La Campana', fondo: '#f3c9a0',
    dibujar(ctx) {
      ctx.fillStyle = '#b8860b';
      ctx.fill(P('M50 14 C32 14 28 34 28 50 C28 62 22 70 16 76 H84 C78 70 72 62 72 50 C72 34 68 14 50 14 Z'));
      ctx.fillStyle = '#f9c74f';
      ctx.fill(P('M50 18 C38 18 35 34 35 50 C35 60 31 67 27 72 H50 Z'));
      ctx.fillStyle = '#8a6208';
      ctx.fill(P('M14 76 H86 V82 H14 Z'));
      circulo(ctx, 50, 88, 6, '#6b4a06');
      ctx.fillStyle = '#6b4a06';
      ctx.fill(P('M46 6 H54 V15 H46 Z'));
      ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(8, 40); ctx.lineTo(16, 44); ctx.moveTo(92, 40); ctx.lineTo(84, 44); ctx.stroke();
    },
  },
  {
    id: 'maceta', nombre: 'La Maceta', fondo: '#d8f0c8',
    dibujar(ctx) {
      ctx.strokeStyle = '#3f8f3a'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(50, 60); ctx.lineTo(50, 30); ctx.moveTo(50, 50); ctx.lineTo(34, 32); ctx.moveTo(50, 48); ctx.lineTo(68, 30); ctx.stroke();
      const flor = (x, y, c) => {
        for (let i = 0; i < 6; i++) { const a = (i * Math.PI) / 3; circulo(ctx, x + 6 * Math.cos(a), y + 6 * Math.sin(a), 5, c); }
        circulo(ctx, x, y, 4, '#f9c74f');
      };
      flor(50, 24, '#e63946');
      flor(32, 28, '#d6246e');
      flor(68, 26, '#f77f00');
      ctx.fillStyle = '#c1623a';
      ctx.fill(P('M26 60 H74 L68 94 H32 Z'));
      ctx.fillStyle = '#a44f2c';
      ctx.fill(P('M22 58 H78 V66 H22 Z'));
      ctx.fillStyle = 'rgba(255,255,255,.25)';
      ctx.fill(P('M34 70 H42 L40 88 H36 Z'));
    },
  },
];

/**
 * Dibuja una carta completa (papel, recuadro de color, ilustración, número y nombre) en (x, y) con ancho w.
 * La proporción es la de una carta de lotería (≈ 0.63).
 */
export function dibujarCarta(ctx, ilustracion, numero, x, y, w, { sombra = true, tinta = '#7a1f1f' } = {}) {
  const h = w / 0.63;
  const r = w * 0.06;
  ctx.save();
  if (sombra) { ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = w * 0.12; ctx.shadowOffsetY = w * 0.04; }
  ctx.fillStyle = '#fffaf0';
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
  ctx.restore();

  const m = w * 0.07;
  const artW = w - 2 * m;
  const artH = h * 0.7;
  ctx.save();
  ctx.beginPath(); ctx.roundRect(x + m, y + m, artW, artH, r * 0.6); ctx.clip();
  ctx.fillStyle = ilustracion.fondo;
  ctx.fillRect(x + m, y + m, artW, artH);
  const lado = Math.min(artW, artH) * 0.92;
  ctx.translate(x + m + (artW - lado) / 2, y + m + (artH - lado) / 2);
  ctx.scale(lado / 100, lado / 100);
  ilustracion.dibujar(ctx);
  ctx.restore();

  ctx.fillStyle = tinta;
  ctx.font = `800 ${w * 0.1}px Nunito, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(String(numero), x + m * 1.4, y + m * 1.2);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let tam = w * 0.115;
  ctx.font = `900 ${tam}px 'Playfair Display', serif`;
  while (ctx.measureText(ilustracion.nombre.toUpperCase()).width > artW && tam > 6) {
    tam -= 1;
    ctx.font = `900 ${tam}px 'Playfair Display', serif`;
  }
  ctx.fillText(ilustracion.nombre.toUpperCase(), x + w / 2, y + m + artH + (h - m - artH) / 2);
  return h;
}
