// Formas de ganar y verificación de tableros. Las usan el simulador y el verificador del cantador.

export const MODOS = {
  llena: { nombre: 'Tabla llena', corto: 'Llena' },
  linea: { nombre: 'Línea (fila, columna o diagonal)', corto: 'Línea' },
  esquinas: { nombre: 'Cuatro esquinas', corto: 'Esquinas' },
};

const tamanoDe = (cartas) => Math.round(Math.sqrt(cartas.length));

/** Grupos de casillas (índices fila * n + columna) que hay que completar; basta con uno. */
export function gruposCeldas(n, modo) {
  const rango = [...Array(n).keys()];
  if (modo === 'llena') return [[...Array(n * n).keys()]];
  if (modo === 'esquinas') return [[...new Set([0, n - 1, n * (n - 1), n * n - 1])]];
  if (modo !== 'linea') throw new Error(`Forma de ganar desconocida: ${modo}`);

  const grupos = [];
  rango.forEach((i) => {
    grupos.push(rango.map((j) => i * n + j)); // fila
    grupos.push(rango.map((j) => j * n + i)); // columna
  });
  grupos.push(rango.map((i) => i * n + i));
  grupos.push(rango.map((i) => i * n + (n - 1 - i)));
  return grupos;
}

/**
 * Grupos como conjuntos de cartas (sin repetir): con carta doble, cantarla marca sus dos casillas.
 */
export function gruposGanadores(cartas, modo) {
  return gruposCeldas(tamanoDe(cartas), modo).map((g) => [...new Set(g.map((i) => cartas[i]))]);
}

/**
 * Revisa un tablero contra las cartas cantadas.
 * Devuelve { gano, marcadas, ganadoras, faltan } donde:
 *  - marcadas: índices de casillas cuya carta ya salió
 *  - ganadoras: índices del grupo completado (o null)
 *  - faltan: ids de cartas que le faltan al grupo más cercano a completarse
 */
export function verificarTablero(cartas, cantadas, modo) {
  const salio = cantadas instanceof Set ? cantadas : new Set(cantadas);
  const marcadas = cartas.map((id, i) => (salio.has(id) ? i : -1)).filter((i) => i >= 0);

  let mejor = null;
  for (const grupo of gruposCeldas(tamanoDe(cartas), modo)) {
    const faltan = [...new Set(grupo.map((i) => cartas[i]).filter((id) => !salio.has(id)))];
    if (!mejor || faltan.length < mejor.faltan.length) mejor = { grupo, faltan };
    if (faltan.length === 0) break;
  }
  const gano = mejor.faltan.length === 0;
  return { gano, marcadas, ganadoras: gano ? mejor.grupo : null, faltan: mejor.faltan };
}
