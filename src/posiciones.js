// Posiciones para la carta doble. Cada una devuelve las dos casillas [fila, columna] (base 0)
// para un tablero de n × n, o null si no existe en ese tamaño.

// Casillas centrales de un lado: en tamaño par son las 2 del centro;
// en impar el centro es una sola casilla y se toman las 2 que la rodean.
function parCentral(n) {
  if (n < 4) return null; // en 2×2 y 3×3 coincidirían con las esquinas
  return n % 2 === 0 ? [n / 2 - 1, n / 2] : [(n - 1) / 2 - 1, (n - 1) / 2 + 1];
}

// Esquinas del cuadro interior (una casilla hacia adentro de cada esquina)
const interior = (n) => (n >= 4 ? [1, n - 2] : null);

export const POSICIONES_DOBLE = [
  { id: 'esquinas-superiores', nombre: 'Esquinas superiores', celdas: (n) => [[0, 0], [0, n - 1]] },
  { id: 'esquinas-inferiores', nombre: 'Esquinas inferiores', celdas: (n) => [[n - 1, 0], [n - 1, n - 1]] },
  { id: 'esquinas-izquierda', nombre: 'Esquinas izquierda', celdas: (n) => [[0, 0], [n - 1, 0]] },
  { id: 'esquinas-derecha', nombre: 'Esquinas derecha', celdas: (n) => [[0, n - 1], [n - 1, n - 1]] },
  { id: 'diagonal-izquierda', nombre: 'Diagonal izquierda', celdas: (n) => [[0, 0], [n - 1, n - 1]] },
  { id: 'diagonal-derecha', nombre: 'Diagonal derecha', celdas: (n) => [[0, n - 1], [n - 1, 0]] },
  { id: 'centrales-superiores', nombre: 'Esquinas centrales superiores', celdas: (n) => interior(n) && [[1, 1], [1, n - 2]] },
  { id: 'centrales-inferiores', nombre: 'Esquinas centrales inferiores', celdas: (n) => interior(n) && [[n - 2, 1], [n - 2, n - 2]] },
  { id: 'centrales-izquierda', nombre: 'Esquinas centrales izquierda', celdas: (n) => interior(n) && [[1, 1], [n - 2, 1]] },
  { id: 'centrales-derecha', nombre: 'Esquinas centrales derecha', celdas: (n) => interior(n) && [[1, n - 2], [n - 2, n - 2]] },
  { id: 'diagonal-central-izquierda', nombre: 'Diagonal central izquierda', celdas: (n) => interior(n) && [[1, 1], [n - 2, n - 2]] },
  { id: 'diagonal-central-derecha', nombre: 'Diagonal central derecha', celdas: (n) => interior(n) && [[1, n - 2], [n - 2, 1]] },
  { id: 'par-superior', nombre: 'Par superior', celdas: (n) => { const p = parCentral(n); return p && [[0, p[0]], [0, p[1]]]; } },
  { id: 'par-inferior', nombre: 'Par inferior', celdas: (n) => { const p = parCentral(n); return p && [[n - 1, p[0]], [n - 1, p[1]]]; } },
  { id: 'par-izquierdo', nombre: 'Par izquierdo', celdas: (n) => { const p = parCentral(n); return p && [[p[0], 0], [p[1], 0]]; } },
  { id: 'par-derecho', nombre: 'Par derecho', celdas: (n) => { const p = parCentral(n); return p && [[p[0], n - 1], [p[1], n - 1]]; } },
];

export const POSICION_ALEATORIA = 'aleatoria';

export const posicionesDisponibles = (n) => POSICIONES_DOBLE.filter((p) => p.celdas(n));

export const nombrePosicion = (id) =>
  id === POSICION_ALEATORIA ? 'Aleatoria' : POSICIONES_DOBLE.find((p) => p.id === id)?.nombre ?? id;

/** Índices (fila * n + columna) de las dos casillas de la carta doble. */
export function indicesDoble(id, n) {
  const celdas = POSICIONES_DOBLE.find((p) => p.id === id)?.celdas(n);
  return celdas ? celdas.map(([f, c]) => f * n + c) : null;
}
