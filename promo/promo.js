// Kit de promoción: diapositivas verticales 1080 × 1920 (TikTok, Reels, Shorts) con ilustraciones originales.
// Se dibujan con canvas y se descargan como PNG para armar el video en CapCut o en el editor de TikTok.
import qrcode from 'qrcode-generator';
import { TEMAS } from '../src/temas.js';
import { ILUSTRACIONES, dibujarCarta } from './ilustraciones.js';

const URL_APP = 'https://eddywong4.github.io/RamdomLotery/';
const URL_CORTA = 'eddywong4.github.io/RamdomLotery';
const ANCHO = 1080;
const ALTO = 1920;
// Zona segura: TikTok tapa abajo (descripción) y a la derecha (botones)
const X0 = 90;
const X1 = 900;
const CENTRO = (X0 + X1) / 2;

// ── Colores de cada tema para las diapositivas ─────────────────────────────
function colores(tema) {
  const [fondo, acento, acento2, papel] = tema.muestra;
  return tema.claro
    ? { fondo, acento, acento2, papel, texto: '#1d1320', suave: '#5b4a55', linea: 'rgba(0,0,0,.08)' }
    : { fondo, acento, acento2, papel, texto: '#fff6e8', suave: 'rgba(255,246,232,.78)', linea: 'rgba(255,255,255,.07)' };
}

// ── Ayudas de dibujo ────────────────────────────────────────────────────────
function lineas(ctx, texto, anchoMax) {
  const palabras = texto.split(' ');
  const resultado = [];
  let actual = '';
  for (const p of palabras) {
    const prueba = actual ? `${actual} ${p}` : p;
    if (ctx.measureText(prueba).width > anchoMax && actual) { resultado.push(actual); actual = p; } else actual = prueba;
  }
  if (actual) resultado.push(actual);
  return resultado;
}

function textoCentrado(ctx, texto, y, { tam, peso = 900, familia = "'Playfair Display', serif", color, alto = 1.12, anchoMax = X1 - X0 }) {
  ctx.font = `${peso} ${tam}px ${familia}`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const ls = lineas(ctx, texto, anchoMax);
  ls.forEach((l, i) => ctx.fillText(l, CENTRO, y + i * tam * alto));
  return y + ls.length * tam * alto;
}

function fondo(ctx, c) {
  ctx.fillStyle = c.fondo;
  ctx.fillRect(0, 0, ANCHO, ALTO);
  const brillo = ctx.createRadialGradient(ANCHO / 2, 380, 40, ANCHO / 2, 380, 1100);
  brillo.addColorStop(0, `${c.acento}40`);
  brillo.addColorStop(1, `${c.acento}00`);
  ctx.fillStyle = brillo;
  ctx.fillRect(0, 0, ANCHO, ALTO);
  // Patrón tenue de cartitas y puntos (posiciones fijas: la imagen sale igual cada vez)
  ctx.strokeStyle = c.linea;
  ctx.lineWidth = 4;
  const cartitas = [[60, 120, -12], [880, 260, 14], [120, 1500, 10], [900, 1320, -16], [480, 1780, 6], [760, 820, -8], [40, 820, 12]];
  for (const [x, y, g] of cartitas) {
    ctx.save(); ctx.translate(x, y); ctx.rotate((g * Math.PI) / 180);
    ctx.beginPath(); ctx.roundRect(0, 0, 90, 142, 10); ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = c.linea;
  for (const [x, y] of [[300, 90], [700, 160], [980, 700], [200, 1100], [600, 1650], [1000, 1800], [40, 400]]) {
    ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill();
  }
}

function marca(ctx, c) {
  ctx.font = "900 46px 'Playfair Display', serif";
  ctx.fillStyle = c.acento2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Lotería', CENTRO, 150);
  ctx.font = '800 24px Nunito, sans-serif';
  ctx.fillStyle = c.suave;
  ctx.fillText('G E N E R A D O R   D E   T A B L E R O S', CENTRO, 206);
}

function encabezado(ctx, c, titulo, subtitulo, y = 300) {
  marca(ctx, c);
  let fin = textoCentrado(ctx, titulo, y, { tam: 104, color: c.texto });
  fin = textoCentrado(ctx, subtitulo, fin + 26, { tam: 46, peso: 800, familia: 'Nunito, sans-serif', color: c.suave, alto: 1.3 });
  return fin;
}

// Tablero de papel con cartas (ilustraciones en orden) y, opcionalmente, frijolitos o casillas vacías
function tablero(ctx, c, x, y, w, n, { frijoles = [], vacias = [], inicio = 0 } = {}) {
  const pad = w * 0.04;
  const gap = w * 0.02;
  const cw = (w - 2 * pad - (n - 1) * gap) / n;
  const ch = cw / 0.63;
  const h = 2 * pad + n * ch + (n - 1) * gap;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 14;
  ctx.fillStyle = c.papel === '#ffffff' ? '#fffaf0' : c.papel;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 24); ctx.fill();
  ctx.restore();
  for (let i = 0; i < n * n; i++) {
    const cx = x + pad + (i % n) * (cw + gap);
    const cy = y + pad + Math.floor(i / n) * (ch + gap);
    if (vacias.includes(i)) {
      ctx.save(); ctx.setLineDash([12, 10]); ctx.strokeStyle = '#b89c7a'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.roundRect(cx + 3, cy + 3, cw - 6, ch - 6, 10); ctx.stroke(); ctx.restore();
      ctx.fillStyle = '#b89c7a'; ctx.font = `300 ${cw * 0.5}px Nunito, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('+', cx + cw / 2, cy + ch / 2);
      continue;
    }
    const il = ILUSTRACIONES[(inicio + i) % ILUSTRACIONES.length];
    dibujarCarta(ctx, il, ((inicio + i) * 7) % 54 + 1, cx, cy, cw, { sombra: false });
    if (frijoles.includes(i)) {
      const g = ctx.createRadialGradient(cx + cw * 0.42, cy + ch * 0.45, 2, cx + cw / 2, cy + ch / 2, cw * 0.26);
      g.addColorStop(0, '#c98a4b'); g.addColorStop(1, '#6e3f16');
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(cx + cw / 2, cy + ch / 2, cw * 0.26, cw * 0.2, -0.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }
  return h;
}

function pastilla(ctx, c, texto, y) {
  ctx.font = '900 40px Nunito, sans-serif';
  const w = ctx.measureText(texto).width + 80;
  ctx.fillStyle = c.acento2;
  ctx.beginPath(); ctx.roundRect(CENTRO - w / 2, y, w, 84, 42); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(texto, CENTRO, y + 44);
}

// ── Diapositivas ────────────────────────────────────────────────────────────
export const DIAPOSITIVAS = [
  {
    id: 'gancho', nombre: '1 · Gancho',
    dibujar(ctx, c) {
      encabezado(ctx, c, '¿Vas a organizar una lotería?', 'Haz tus tableros gratis en 1 minuto', 330);
      // Abanico de cartas: giran alrededor de un punto bajo la pantalla, como en la mano
      const w = 310;
      const orden = [2, 0, 3, 1, 6];
      orden.forEach((k, i) => {
        const giro = (i - 2) * 9;
        ctx.save();
        ctx.translate(CENTRO, 1760);
        ctx.rotate((giro * Math.PI) / 180);
        dibujarCarta(ctx, ILUSTRACIONES[k], [27, 46, 35, 23, 28][i], -w / 2, -800, w);
        ctx.restore();
      });
    },
  },
  {
    id: 'tableros', nombre: '2 · Sin repetidos',
    dibujar(ctx, c) {
      const fin = encabezado(ctx, c, 'Sin tableros repetidos', 'De 2×2 a 5×5 · las cartas se reparten parejo');
      tablero(ctx, c, CENTRO - 330, fin + 70, 660, 3);
    },
  },
  {
    id: 'pdf', nombre: '3 · PDF',
    dibujar(ctx, c) {
      const fin = encabezado(ctx, c, 'Imprímelos en PDF', '1, 2 o 4 tableros por hoja, listos para recortar');
      // Tres hojas con los tamaños reales: S (horizontal, 2 tableros) atrás; Grande (1) y XS (4) al frente.
      // Un tablero 2×2 mide de alto 1.53 veces su ancho.
      const hoja = (cx, cy, ancho, alto, giro, dibujarTableros) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate((giro * Math.PI) / 180);
        ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 34; ctx.shadowOffsetY = 14;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.roundRect(-ancho / 2, -alto / 2, ancho, alto, 10); ctx.fill();
        ctx.shadowColor = 'transparent';
        dibujarTableros();
        ctx.restore();
      };
      const base = fin + 330;
      hoja(CENTRO, base - 40, 470, 340, 0, () => {
        tablero(ctx, c, -205, -130, 170, 2, { inicio: 4 });
        tablero(ctx, c, 35, -130, 170, 2, { inicio: 6 });
      });
      hoja(CENTRO - 200, base + 250, 300, 400, -7, () => tablero(ctx, c, -117, -180, 234, 2, { inicio: 0 }));
      hoja(CENTRO + 200, base + 250, 300, 400, 7, () => {
        for (let f = 0; f < 2; f++) for (let k = 0; k < 2; k++) tablero(ctx, c, -128 + k * 138, -186 + f * 188, 118, 2, { inicio: f * 4 + k * 2 + 1 });
      });
      pastilla(ctx, c, 'Grande · S · XS', base + 520);
    },
  },
  {
    id: 'cantar', nombre: '4 · Cantar',
    dibujar(ctx, c) {
      const fin = encabezado(ctx, c, 'Canta las cartas', 'Con voz, sonidos y verificador de ganador');
      const w = 380;
      dibujarCarta(ctx, ILUSTRACIONES[0], 46, CENTRO - w / 2, fin + 80, w);
      ctx.strokeStyle = c.acento; ctx.lineWidth = 12; ctx.lineCap = 'round';
      for (const [r, a] of [[70, 1], [120, 0.7], [170, 0.4]]) {
        ctx.globalAlpha = a;
        ctx.beginPath(); ctx.arc(CENTRO + w / 2 + 10, fin + 80 + 300, r, -0.6, 0.6); ctx.stroke();
        ctx.beginPath(); ctx.arc(CENTRO - w / 2 - 10, fin + 80 + 300, r, Math.PI - 0.6, Math.PI + 0.6); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      pastilla(ctx, c, '¡Corre y se va!', fin + 80 + w / 0.63 + 50);
    },
  },
  {
    id: 'celular', nombre: '5 · Celular',
    dibujar(ctx, c) {
      const fin = encabezado(ctx, c, 'Juega en el celular', 'Escanea el QR y marca con frijolitos');
      const x = CENTRO - 230;
      const y = fin + 60;
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 20;
      ctx.fillStyle = '#15110f';
      ctx.beginPath(); ctx.roundRect(x, y, 460, 900, 64); ctx.fill();
      ctx.restore();
      ctx.fillStyle = c.fondo;
      ctx.beginPath(); ctx.roundRect(x + 18, y + 18, 424, 864, 48); ctx.fill();
      ctx.fillStyle = '#15110f';
      ctx.beginPath(); ctx.roundRect(CENTRO - 60, y + 34, 120, 30, 15); ctx.fill();
      ctx.font = "900 44px 'Playfair Display', serif"; ctx.fillStyle = c.acento; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText('Nº 007', CENTRO, y + 100);
      tablero(ctx, c, x + 40, y + 180, 380, 3, { frijoles: [0, 4, 5, 8], inicio: 1 });
    },
  },
  {
    id: 'mano', nombre: '6 · A mano',
    dibujar(ctx, c) {
      const fin = encabezado(ctx, c, 'Arma tus propios tableros', 'Elige cada carta y guárdalos en favoritos');
      tablero(ctx, c, CENTRO - 260, fin + 80, 520, 2, { vacias: [1, 2], inicio: 5 });
      ctx.fillStyle = c.acento;
      ctx.save(); ctx.translate(CENTRO + 250, fin + 90); ctx.rotate(0.2);
      const s = new Path2D();
      for (let i = 0; i < 10; i++) { const r = i % 2 ? 26 : 62; const a = (-90 + i * 36) * Math.PI / 180; if (i) s.lineTo(r * Math.cos(a), r * Math.sin(a)); else s.moveTo(r * Math.cos(a), r * Math.sin(a)); }
      s.closePath(); ctx.fill(s); ctx.restore();
    },
  },
  {
    id: 'temas', nombre: '7 · Temas',
    dibujar(ctx, c) {
      const fin = encabezado(ctx, c, '5 temas mexicanos', 'Clásico · Talavera · Cempasúchil · Mesa de juego · Papel picado');
      TEMAS.forEach((t, i) => {
        const y = fin + 70 + i * 170;
        ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 8;
        ctx.fillStyle = t.muestra[0];
        ctx.beginPath(); ctx.roundRect(X0 + 40, y, X1 - X0 - 80, 140, 28); ctx.fill();
        ctx.restore();
        t.muestra.slice(1).forEach((col, k) => {
          ctx.fillStyle = col; ctx.beginPath(); ctx.arc(X0 + 120 + k * 70, y + 70, 26, 0, Math.PI * 2); ctx.fill();
        });
        ctx.font = "900 50px 'Playfair Display', serif";
        ctx.fillStyle = t.claro ? '#1d1320' : '#fff6e8';
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(t.nombre, X0 + 340, y + 72);
      });
    },
  },
  {
    id: 'cta', nombre: '8 · ¡Pruébala!',
    dibujar(ctx, c) {
      const fin = encabezado(ctx, c, '¡Pruébala gratis!', 'Sin registro · se instala en tu celular · funciona sin internet');
      const lado = 480;
      const x = CENTRO - lado / 2;
      const y = fin + 70;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.roundRect(x - 30, y - 30, lado + 60, lado + 60, 36); ctx.fill();
      const qr = qrcode(0, 'M');
      qr.addData(URL_APP);
      qr.make();
      const n = qr.getModuleCount();
      const m = lado / n;
      ctx.fillStyle = '#15110f';
      for (let f = 0; f < n; f++) for (let k = 0; k < n; k++) if (qr.isDark(f, k)) ctx.fillRect(x + k * m, y + f * m, Math.ceil(m), Math.ceil(m));
      textoCentrado(ctx, URL_CORTA, y + lado + 80, { tam: 40, peso: 800, familia: 'Nunito, sans-serif', color: c.texto });
      pastilla(ctx, c, 'Link en mi perfil', y + lado + 160);
    },
  },
];

// ── Fotos de perfil (1080 × 1080; TikTok las recorta en círculo) ───────────
const LADO = 1080;
const MEDIO = LADO / 2;
const carta = (id) => ILUSTRACIONES.find((il) => il.id === id);

function frijol(ctx, x, y, r) {
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 2, x, y, r);
  g.addColorStop(0, '#c98a4b'); g.addColorStop(1, '#6e3f16');
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6;
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.77, -0.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// Carta girada alrededor de su centro
function cartaGirada(ctx, il, cx, cy, w, grados) {
  const h = w / 0.631;
  ctx.save();
  ctx.translate(cx, cy); ctx.rotate((grados * Math.PI) / 180);
  dibujarCarta(ctx, il, il.id, -w / 2, -h / 2, w);
  ctx.restore();
}

export const FOTOS = [
  {
    id: 'abanico', nombre: 'Abanico de cartas',
    dibujar(ctx) {
      cartaGirada(ctx, carta(27), MEDIO - 210, MEDIO + 40, 300, -16);
      cartaGirada(ctx, carta(35), MEDIO + 210, MEDIO + 40, 300, 16);
      cartaGirada(ctx, carta(46), MEDIO, MEDIO - 10, 330, 0);
    },
  },
  {
    id: 'carta', nombre: 'Carta con frijolito',
    dibujar(ctx) {
      cartaGirada(ctx, carta(46), MEDIO, MEDIO, 430, -6);
      frijol(ctx, MEDIO + 120, MEDIO + 170, 62);
    },
  },
  {
    id: 'tablero', nombre: 'Tablero marcado',
    dibujar(ctx, c) {
      // Mismas medidas que tablero(): así queda centrado a lo alto
      const w = 470;
      const pad = w * 0.04;
      const gap = w * 0.02;
      const h = 2 * pad + 2 * ((w - 2 * pad - gap) / 2 / 0.63) + gap;
      tablero(ctx, c, MEDIO - w / 2, MEDIO - h / 2, w, 2, { frijoles: [0, 3] });
    },
  },
];

function fondoFoto(ctx, c) {
  ctx.fillStyle = c.fondo;
  ctx.fillRect(0, 0, LADO, LADO);
  const brillo = ctx.createRadialGradient(MEDIO, MEDIO, 60, MEDIO, MEDIO, 620);
  brillo.addColorStop(0, `${c.acento}66`);
  brillo.addColorStop(1, `${c.acento}00`);
  ctx.fillStyle = brillo;
  ctx.fillRect(0, 0, LADO, LADO);
  // Confeti tenue alrededor (queda dentro del círculo que muestra TikTok)
  const confeti = [[230, 250, c.acento], [850, 300, c.acento2], [190, 760, c.acento2], [880, 800, c.acento], [540, 110, c.acento2], [540, 975, c.acento], [120, 520, c.acento], [960, 540, c.acento2]];
  for (const [x, y, color] of confeti) {
    ctx.fillStyle = color; ctx.globalAlpha = 0.55;
    ctx.beginPath(); ctx.arc(x, y, 16, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** Dibuja una foto de perfil (1080 × 1080) con un anillo del color de acento en el borde del círculo. */
export function dibujarFoto(canvas, foto, tema) {
  canvas.width = LADO;
  canvas.height = LADO;
  const ctx = canvas.getContext('2d');
  const c = colores(tema);
  fondoFoto(ctx, c);
  foto.dibujar(ctx, c);
  ctx.strokeStyle = c.acento;
  ctx.lineWidth = 22;
  ctx.beginPath(); ctx.arc(MEDIO, MEDIO, MEDIO - 26, 0, Math.PI * 2); ctx.stroke();
}

/** Dibuja una diapositiva completa en el canvas (1080 × 1920). */
export function dibujarDiapositiva(canvas, diapositiva, tema) {
  canvas.width = ANCHO;
  canvas.height = ALTO;
  const ctx = canvas.getContext('2d');
  const c = colores(tema);
  fondo(ctx, c);
  diapositiva.dibujar(ctx, c);
}

// ── Página ──────────────────────────────────────────────────────────────────
let temaActual = TEMAS[0];

function descargar(canvas, nombre) {
  return new Promise((resolver) => canvas.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = nombre;
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); resolver(); }, 400);
  }, 'image/png'));
}

function pintar() {
  document.querySelectorAll('[data-tema]').forEach((b) => b.classList.toggle('activo', b.dataset.tema === temaActual.id));
  document.querySelectorAll('canvas[data-diapositiva]').forEach((cv) => {
    const d = DIAPOSITIVAS.find((x) => x.id === cv.dataset.diapositiva);
    dibujarDiapositiva(cv, d, temaActual);
  });
  document.querySelectorAll('canvas[data-foto]').forEach((cv) => {
    dibujarFoto(cv, FOTOS.find((x) => x.id === cv.dataset.foto), temaActual);
  });
}

async function iniciar() {
  await Promise.all([
    document.fonts.load("900 100px 'Playfair Display'"),
    document.fonts.load('800 40px Nunito'),
    document.fonts.load('900 40px Nunito'),
    document.fonts.load('300 40px Nunito'),
  ]);
  document.getElementById('temas').innerHTML = TEMAS.map((t) =>
    `<button type="button" data-tema="${t.id}" style="--m0:${t.muestra[0]};--m1:${t.muestra[1]};--m2:${t.muestra[2]}">${t.nombre}</button>`).join('');
  document.getElementById('diapositivas').innerHTML = DIAPOSITIVAS.map((d) => `
    <figure>
      <canvas data-diapositiva="${d.id}" aria-label="${d.nombre}"></canvas>
      <figcaption><span>${d.nombre}</span><button type="button" data-descargar="${d.id}">Descargar PNG</button></figcaption>
    </figure>`).join('');

  document.getElementById('fotos').innerHTML = FOTOS.map((f) => `
    <figure>
      <canvas data-foto="${f.id}" aria-label="${f.nombre}"></canvas>
      <figcaption><span>${f.nombre}</span><button type="button" data-descargar-foto="${f.id}">Descargar PNG</button></figcaption>
    </figure>`).join('');
  document.getElementById('fotos').addEventListener('click', (e) => {
    const b = e.target.closest('[data-descargar-foto]');
    if (!b) return;
    descargar(document.querySelector(`canvas[data-foto="${b.dataset.descargarFoto}"]`), `loteria-perfil-${temaActual.id}-${b.dataset.descargarFoto}.png`);
  });

  document.getElementById('temas').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tema]');
    if (!b) return;
    temaActual = TEMAS.find((t) => t.id === b.dataset.tema);
    pintar();
  });
  document.getElementById('diapositivas').addEventListener('click', (e) => {
    const b = e.target.closest('[data-descargar]');
    if (!b) return;
    const i = DIAPOSITIVAS.findIndex((d) => d.id === b.dataset.descargar);
    descargar(document.querySelector(`canvas[data-diapositiva="${b.dataset.descargar}"]`), `loteria-${temaActual.id}-${String(i + 1).padStart(2, '0')}-${DIAPOSITIVAS[i].id}.png`);
  });
  document.getElementById('descargar-todas').addEventListener('click', async () => {
    for (const [i, d] of DIAPOSITIVAS.entries()) {
      await descargar(document.querySelector(`canvas[data-diapositiva="${d.id}"]`), `loteria-${temaActual.id}-${String(i + 1).padStart(2, '0')}-${d.id}.png`);
    }
  });
  pintar();
}

if (typeof document !== 'undefined' && document.getElementById('diapositivas')) iniciar();
