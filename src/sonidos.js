// Sonidos del cantador, generados con Web Audio (sin archivos: sin derechos de autor y funcionan sin internet).
// Los navegadores solo permiten sonido después de que el usuario toca algo; el primer toque "despierta" el audio.

// Notas (frecuencia en Hz)
const N = { C5: 523.25, E5: 659.25, G5: 783.99, C6: 1046.5, G4: 392.0, E4: 329.63, C4: 261.63 };

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

let contexto = null;

function audio() {
  const Ctx = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
  if (!Ctx) return null;
  if (!contexto) contexto = new Ctx();
  if (contexto.state === 'suspended') contexto.resume();
  return contexto;
}

function tocar(melodia, volumen = 0.22) {
  const ctx = audio();
  if (!ctx) return false;
  const inicio = ctx.currentTime + 0.02;
  for (const { nota, t, dur, campana } of melodia) {
    const osc = ctx.createOscillator();
    const gan = ctx.createGain();
    // La campana usa onda senoidal con caída larga; las demás, triangular (tono de "feria")
    osc.type = campana ? 'sine' : 'triangle';
    osc.frequency.value = nota;
    const a = inicio + t;
    gan.gain.setValueAtTime(0.0001, a);
    gan.gain.exponentialRampToValueAtTime(volumen, a + 0.015);
    gan.gain.exponentialRampToValueAtTime(0.0001, a + dur);
    osc.connect(gan).connect(ctx.destination);
    osc.start(a);
    osc.stop(a + dur + 0.05);
  }
  return true;
}

/** Prepara el audio en un toque del usuario (necesario para que suene después en modo automático). */
export const despertarAudio = () => audio();

export const sonidoInicio = () => tocar(MELODIA_INICIO);
export const sonidoFin = () => tocar(MELODIA_FIN);
