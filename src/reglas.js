// Formas de ganar y verificación de tableros. Las usan el simulador y el verificador del cantador.

export const MODOS = {
  llena: { nombre: 'Tabla llena', corto: 'Llena', ayuda: 'todas las casillas' },
  tradicional: { nombre: 'Tradicional', corto: 'Tradicional', ayuda: 'línea, esquinas, centro o cuadro' },
  cruz: { nombre: 'En cruz', corto: 'Cruz', ayuda: 'las 2 diagonales' },
  siete: { nombre: 'Siete loco', corto: 'Siete loco', ayuda: '7 casillas cualesquiera' },
  // Formas anteriores: siguen funcionando (pruebas, datos viejos), pero ya no se ofrecen; las cubre "tradicional"
  linea: { nombre: 'Línea (fila, columna o diagonal)', corto: 'Línea', ayuda: 'fila, col. o diag.' },
  esquinas: { nombre: 'Cuatro esquinas', corto: 'Esquinas', ayuda: 'las 4' },
};

/** Formas que se muestran en la app, en orden. */
export const MODOS_VISIBLES = ['llena', 'tradicional', 'cruz', 'siete'];

/** Preferencia guardada → forma visible (las anteriores pasan a "tradicional", que las incluye). */
export const normalizarModo = (modo) => (MODOS_VISIBLES.includes(modo) ? modo : modo in MODOS ? 'tradicional' : 'llena');

const tamanoDe = (cartas) => Math.round(Math.sqrt(cartas.length));

/** Siete loco: cuántas casillas cualesquiera hay que marcar (en 2×2 no caben 7: es tabla llena). null en las demás. */
export const casillasMinimas = (n, modo) => (modo === 'siete' ? Math.min(7, n * n) : null);

function lineas(n) {
  const rango = [...Array(n).keys()];
  const grupos = [];
  rango.forEach((i) => {
    grupos.push(rango.map((j) => i * n + j)); // fila
    grupos.push(rango.map((j) => j * n + i)); // columna
  });
  grupos.push(rango.map((i) => i * n + i));
  grupos.push(rango.map((i) => i * n + (n - 1 - i)));
  return grupos;
}

const esquinas = (n) => [...new Set([0, n - 1, n * (n - 1), n * n - 1])];

// Cuadro de 2 × 2 casillas juntas cuya esquina superior izquierda está en (f, c)
const cuadro = (n, f, c) => [f * n + c, f * n + c + 1, (f + 1) * n + c, (f + 1) * n + c + 1];

/** Todos los cuadros de 2 × 2 casillas juntas que caben en el tablero. */
function cuadros(n) {
  const grupos = [];
  for (let f = 0; f < n - 1; f++) for (let c = 0; c < n - 1; c++) grupos.push(cuadro(n, f, c));
  return grupos;
}

/** Grupos de casillas (índices fila * n + columna) que hay que completar; basta con uno. */
export function gruposCeldas(n, modo) {
  switch (modo) {
    case 'llena': return [[...Array(n * n).keys()]];
    case 'esquinas': return [esquinas(n)];
    case 'linea': return lineas(n);
    case 'cruz': {
      const [d1, d2] = lineas(n).slice(-2);
      return [[...new Set([...d1, ...d2])].sort((a, b) => a - b)];
    }
    case 'tradicional': {
      // Línea (horizontal, vertical o diagonal), 4 esquinas o cualquier cuadro de 2 × 2 casillas juntas.
      // "4 al centro" es uno de esos cuadros (el del centro en tableros pares). En 2 × 2 todo coincide y se quitan repetidos.
      const grupos = [...lineas(n), esquinas(n), ...cuadros(n)];
      const vistos = new Set();
      return grupos.filter((g) => {
        const clave = [...g].sort((a, b) => a - b).join(',');
        if (vistos.has(clave)) return false;
        vistos.add(clave);
        return true;
      });
    }
    case 'siete': throw new Error('Siete loco no usa grupos fijos: usa casillasMinimas');
    default: throw new Error(`Forma de ganar desconocida: ${modo}`);
  }
}

/**
 * Grupos como conjuntos de cartas (sin repetir): con carta doble, cantarla marca sus dos casillas.
 */
export function gruposGanadores(cartas, modo) {
  return gruposCeldas(tamanoDe(cartas), modo).map((g) => [...new Set(g.map((i) => cartas[i]))]);
}

/**
 * Revisa un tablero contra las cartas cantadas.
 * Devuelve { gano, marcadas, ganadoras, faltan, casillasFaltantes } donde:
 *  - marcadas: índices de casillas cuya carta ya salió
 *  - ganadoras: índices del grupo completado (o null)
 *  - faltan: ids de cartas que le faltan al grupo más cercano a completarse
 *  - casillasFaltantes: en siete loco, cuántas casillas (cualesquiera) faltan; null en las demás formas
 */
export function verificarTablero(cartas, cantadas, modo) {
  const salio = cantadas instanceof Set ? cantadas : new Set(cantadas);
  const marcadas = cartas.map((id, i) => (salio.has(id) ? i : -1)).filter((i) => i >= 0);

  const minimo = casillasMinimas(tamanoDe(cartas), modo);
  if (minimo !== null) {
    const gano = marcadas.length >= minimo;
    return {
      gano,
      marcadas,
      ganadoras: gano ? marcadas : null,
      faltan: gano ? [] : [...new Set(cartas.filter((id) => !salio.has(id)))],
      casillasFaltantes: Math.max(0, minimo - marcadas.length),
    };
  }

  let mejor = null;
  for (const grupo of gruposCeldas(tamanoDe(cartas), modo)) {
    const faltan = [...new Set(grupo.map((i) => cartas[i]).filter((id) => !salio.has(id)))];
    if (!mejor || faltan.length < mejor.faltan.length) mejor = { grupo, faltan };
    if (faltan.length === 0) break;
  }
  const gano = mejor.faltan.length === 0;
  return { gano, marcadas, ganadoras: gano ? mejor.grupo : null, faltan: mejor.faltan, casillasFaltantes: null };
}
