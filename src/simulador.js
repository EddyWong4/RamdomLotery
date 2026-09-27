import { TOTAL_CARTAS } from './cartas.js';
import { crearRng } from './generador.js';
import { MODOS, gruposGanadores, casillasMinimas } from './reglas.js';

export { MODOS };
export const JUGADAS = [100, 1000, 10000];

// ── Prueba de chi-cuadrada: ¿las diferencias entre tableros son normales del azar? ─
function normalAcumulada(z) {
  // Aproximación de Abramowitz-Stegun para la función de error
  const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2);
  const erf = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(z * z) / 2);
  return z >= 0 ? (1 + erf) / 2 : (1 - erf) / 2;
}

// Valor p de chi-cuadrada con la aproximación de Wilson-Hilferty (suficiente para gl ≥ 1)
function valorPChi2(chi2, gl) {
  const z = (Math.cbrt(chi2 / gl) - (1 - 2 / (9 * gl))) / Math.sqrt(2 / (9 * gl));
  return 1 - normalAcumulada(z);
}

const esperarFrame = () => new Promise((r) => setTimeout(r, 0));

/**
 * Simula partidas cantando las 54 cartas en orden aleatorio.
 * Gana el primer tablero que completa su condición; si varios la completan con la misma carta es empate.
 * Con la misma semilla el resultado es el mismo.
 */
export async function simular(tableros, { jugadas, modo, semilla, alProgresar }) {
  const rng = crearRng(`${semilla}|simulacion|${modo}|${jugadas}`);
  const B = tableros.length;

  // Todo en arreglos planos: el tablero b usa los grupos [inicioTablero[b], inicioTablero[b+1])
  // y el grupo g usa las cartas [inicioGrupo[g], inicioGrupo[g+1])
  // Siete loco no tiene grupos fijos: gana quien marca k casillas cualesquiera (una carta doble marca 2)
  const minimo = B ? casillasMinimas(Math.round(Math.sqrt(tableros[0].cartas.length)), modo) : null;
  const listas = tableros.map((t) => (minimo !== null ? [t.cartas] : gruposGanadores(t.cartas, modo)));
  const menores = new Int16Array(minimo ?? 1);
  const inicioTablero = new Int32Array(B + 1);
  const inicioGrupo = [0];
  const cartas = [];
  listas.forEach((grupos, b) => {
    grupos.forEach((g) => { cartas.push(...g); inicioGrupo.push(cartas.length); });
    inicioTablero[b + 1] = inicioGrupo.length - 1;
  });
  const cartasPlano = Int8Array.from(cartas);
  const inicioGrupoPlano = Int32Array.from(inicioGrupo);

  const mazo = Int8Array.from({ length: TOTAL_CARTAS }, (_, i) => i + 1);
  const turno = new Int16Array(TOTAL_CARTAS + 1); // en qué turno sale cada carta
  const victorias = new Array(B).fill(0);
  const empates = new Array(B).fill(0);
  const ganadores = new Int32Array(B);
  let partidasEmpatadas = 0;
  let sumaCartas = 0;

  // Cede el control al navegador cada ~60 ms para que la página no se congele
  let ultimaPausa = performance.now();

  for (let p = 0; p < jugadas; p++) {
    for (let i = mazo.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const x = mazo[i]; mazo[i] = mazo[j]; mazo[j] = x;
    }
    for (let i = 0; i < mazo.length; i++) turno[mazo[i]] = i;

    let mejor = 99; // mayor que cualquier turno posible (0–53)
    let cuantos = 0;
    for (let b = 0; b < B; b++) {
      // El tablero gana en el turno en que completa su primer grupo
      // (se deja de revisar un grupo en cuanto ya no puede mejorar ni empatar al mejor)
      let fin = 99;
      if (minimo !== null) {
        // Turno en que se marca la k-ésima casilla: los k turnos más chicos, con inserción
        let llenos = 0;
        const g = inicioTablero[b];
        for (let k = inicioGrupoPlano[g], kFin = inicioGrupoPlano[g + 1]; k < kFin; k++) {
          const t = turno[cartasPlano[k]];
          if (llenos === minimo && t >= menores[minimo - 1]) continue;
          let i = llenos < minimo ? llenos++ : minimo - 1;
          while (i > 0 && menores[i - 1] > t) { menores[i] = menores[i - 1]; i--; }
          menores[i] = t;
        }
        fin = menores[minimo - 1];
      } else for (let g = inicioTablero[b], gFin = inicioTablero[b + 1]; g < gFin; g++) {
        const tope = fin - 1 < mejor ? fin - 1 : mejor;
        let ultimo = 0;
        for (let k = inicioGrupoPlano[g], kFin = inicioGrupoPlano[g + 1]; k < kFin; k++) {
          const t = turno[cartasPlano[k]];
          if (t > ultimo) { ultimo = t; if (ultimo > tope) break; }
        }
        if (ultimo <= tope) fin = ultimo;
      }
      if (fin < mejor) { mejor = fin; cuantos = 0; }
      if (fin === mejor) ganadores[cuantos++] = b;
    }

    sumaCartas += mejor + 1;
    for (let i = 0; i < cuantos; i++) victorias[ganadores[i]]++;
    if (cuantos > 1) {
      partidasEmpatadas++;
      for (let i = 0; i < cuantos; i++) empates[ganadores[i]]++;
    }

    if ((p & 63) === 63 && performance.now() - ultimaPausa > 60) {
      alProgresar?.((p + 1) / jugadas);
      await esperarFrame();
      ultimaPausa = performance.now();
    }
  }

  const totalVictorias = victorias.reduce((a, b) => a + b, 0);
  const esperado = totalVictorias / B;
  const chi2 = B > 1 && esperado > 0 ? victorias.reduce((s, v) => s + (v - esperado) ** 2 / esperado, 0) : 0;

  return {
    jugadas,
    modo,
    tableros: tableros.map((t) => t.numero),
    victorias,
    empates,
    partidasEmpatadas,
    promedioCartas: sumaCartas / jugadas,
    esperado,
    valorP: B > 1 ? valorPChi2(chi2, B - 1) : 1,
    // Con menos de ~20 victorias esperadas por tablero la prueba no es confiable
    muestraSuficiente: esperado >= 20,
  };
}
