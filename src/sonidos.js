// Sonidos del cantador (inicio y fin de partida).
//
// Se sintetizan en memoria como WAV y se reproducen con <audio> (HTMLAudioElement), no con Web Audio:
// en iPhone, Web Audio se silencia con el interruptor de silencio y a veces no se activa, mientras que
// <audio> se comporta como la voz o un video y suena en iPhone y Android. Sin archivos: sin derechos
// de autor y funciona sin internet.
//
// Los navegadores móviles solo dejan reproducir sonido después de un toque del usuario. `despertarAudio`
// se llama en cada toque: "desbloquea" los reproductores para que el sonido de fin también pueda sonar
// después, cuando llega por el modo automático o al terminar la voz.

const FRECUENCIA = 22050; // muestras por segundo (suficiente para estos tonos y ligero)

// Notas (frecuencia en Hz)
const N = { C5: 523.25, E5: 659.25, G5: 783.99, C6: 1046.5, G4: 392.0, C4: 261.63 };

// Inicio: fanfarria ascendente y brillante (do-mi-sol-do)
export const MELODIA_INICIO = [
  { nota: N.C5, t: 0, dur: 0.14 },
  { nota: N.E5, t: 0.12, dur: 0.14 },
  { nota: N.G5, t: 0.24, dur: 0.14 },
  { nota: N.C6, t: 0.36, dur: 0.5 },
];

// Fin: descendente y con campana al final (sol-mi-do + do grave largo), claramente distinta del inicio
export const MELODIA_FIN = [
  { nota: N.G5, t: 0, dur: 0.22 },
  { nota: N.E5, t: 0.22, dur: 0.22 },
  { nota: N.C5, t: 0.44, dur: 0.22 },
  { nota: N.G4, t: 0.7, dur: 0.18 },
  { nota: N.C4, t: 0.9, dur: 1.2, campana: true },
  { nota: N.C5, t: 0.9, dur: 1.2, campana: true },
];

/** Duración total de una melodía en segundos. */
export const duracion = (melodia) => Math.max(...melodia.map((n) => n.t + n.dur));

// ── Síntesis (funciones puras) ───────────────────────────────────────────────
/** Muestras (-1…1) de la melodía: onda triangular ("de feria") y senoidal para la campana, con caída exponencial. */
export function sintetizar(melodia, volumen = 0.32, frecuencia = FRECUENCIA) {
  const total = Math.ceil((duracion(melodia) + 0.08) * frecuencia);
  const datos = new Float32Array(total);
  const caidaFinal = Math.log(0.0001);
  for (const { nota, t, dur, campana } of melodia) {
    const inicio = Math.floor(t * frecuencia);
    const largo = Math.floor(dur * frecuencia);
    for (let i = 0; i < largo && inicio + i < total; i++) {
      const s = i / frecuencia;
      const fase = nota * s;
      const onda = campana ? Math.sin(2 * Math.PI * fase) : 1 - 4 * Math.abs(fase - Math.floor(fase + 0.5));
      const ataque = Math.min(1, s / 0.015);
      const caida = Math.exp((caidaFinal * s) / dur);
      datos[inicio + i] += onda * volumen * ataque * caida;
    }
  }
  for (let i = 0; i < total; i++) datos[i] = Math.max(-1, Math.min(1, datos[i]));
  return datos;
}

/** Archivo WAV (PCM de 16 bits, mono) con las muestras dadas. */
export function wav(datos, frecuencia = FRECUENCIA) {
  const bytes = new Uint8Array(44 + datos.length * 2);
  const v = new DataView(bytes.buffer);
  const texto = (pos, s) => [...s].forEach((c, i) => v.setUint8(pos + i, c.charCodeAt(0)));
  texto(0, 'RIFF');
  v.setUint32(4, 36 + datos.length * 2, true);
  texto(8, 'WAVE');
  texto(12, 'fmt ');
  v.setUint32(16, 16, true); // tamaño del bloque fmt
  v.setUint16(20, 1, true); // PCM
  v.setUint16(22, 1, true); // mono
  v.setUint32(24, frecuencia, true);
  v.setUint32(28, frecuencia * 2, true); // bytes por segundo
  v.setUint16(32, 2, true); // bytes por muestra
  v.setUint16(34, 16, true); // bits por muestra
  texto(36, 'data');
  v.setUint32(40, datos.length * 2, true);
  datos.forEach((m, i) => v.setInt16(44 + i * 2, Math.round(m * 32767), true));
  return bytes;
}

// ── Reproducción ─────────────────────────────────────────────────────────────
const MELODIAS = { inicio: MELODIA_INICIO, fin: MELODIA_FIN };
const reproductores = {};
const pedidos = new Set(); // sonidos que el usuario quiere oír (el desbloqueo no debe pausarlos)
let desbloqueado = false;

const hayAudio = () => typeof window !== 'undefined' && typeof window.Audio === 'function' && typeof URL.createObjectURL === 'function';

function reproductor(nombre) {
  if (!reproductores[nombre]) {
    const url = URL.createObjectURL(new Blob([wav(sintetizar(MELODIAS[nombre]))], { type: 'audio/wav' }));
    const audio = new window.Audio(url);
    audio.preload = 'auto';
    audio.addEventListener('ended', () => pedidos.delete(nombre));
    reproductores[nombre] = audio;
  }
  return reproductores[nombre];
}

function tocar(nombre) {
  if (!hayAudio()) return false;
  const audio = reproductor(nombre);
  pedidos.add(nombre);
  audio.muted = false;
  try {
    audio.currentTime = 0;
  } catch {
    // algunos navegadores no dejan mover el tiempo antes de cargar; empieza desde 0 de todos modos
  }
  const promesa = audio.play();
  promesa?.catch?.(() => pedidos.delete(nombre));
  return true;
}

/**
 * Se llama en un toque del usuario. Prepara los reproductores y los reproduce en silencio una vez
 * para que después se puedan tocar sin un toque (modo automático, al terminar la voz).
 */
export function despertarAudio() {
  if (!hayAudio() || desbloqueado) return;
  desbloqueado = true;
  // Safari 17+: que la página use el canal de reproducción (suena aunque el celular esté en silencio)
  try {
    if (navigator.audioSession) navigator.audioSession.type = 'playback';
  } catch {
    // no disponible en este navegador
  }
  for (const nombre of Object.keys(MELODIAS)) {
    const audio = reproductor(nombre);
    if (pedidos.has(nombre)) continue;
    audio.muted = true;
    const promesa = audio.play();
    const terminar = () => {
      if (!pedidos.has(nombre)) {
        audio.pause();
        try { audio.currentTime = 0; } catch { /* sin efecto */ }
      }
      audio.muted = false;
    };
    if (promesa?.then) promesa.then(terminar, () => { audio.muted = false; desbloqueado = false; });
    else terminar();
  }
}

export const sonidoInicio = () => tocar('inicio');
export const sonidoFin = () => tocar('fin');
