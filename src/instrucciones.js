// Vista "Cómo jugar": instrucciones de la lotería y de cada forma de ganar.
// Los diagramas salen de reglas.js (gruposCeldas), así siempre coinciden con lo que revisa el verificador.
import { MODOS, MODOS_VISIBLES, gruposCeldas } from './reglas.js';

const N = 4; // los ejemplos se dibujan en un tablero de 4 × 4, el más común

// Ejemplos de figuras (índices de casilla en 4 × 4)
const FILA = [4, 5, 6, 7];
const COLUMNA = [2, 6, 10, 14];
const DIAGONAL = [0, 5, 10, 15];
const SIETE = [0, 3, 6, 9, 11, 12, 14];

function buscarGrupo(modo, ejemplo) {
  const clave = [...ejemplo].sort((a, b) => a - b).join();
  const g = gruposCeldas(N, modo).find((x) => [...x].sort((a, b) => a - b).join() === clave);
  if (!g) throw new Error(`La figura ${clave} no está en ${modo}`);
  return g;
}

/** Figuras que se dibujan para cada forma: [{ titulo, celdas }] */
export function figuras(modo) {
  switch (modo) {
    case 'llena': return [{ titulo: 'Todas las casillas', celdas: gruposCeldas(N, 'llena')[0] }];
    case 'tradicional': return [
      { titulo: 'Horizontal', celdas: buscarGrupo('tradicional', FILA) },
      { titulo: 'Vertical', celdas: buscarGrupo('tradicional', COLUMNA) },
      { titulo: 'Diagonal', celdas: buscarGrupo('tradicional', DIAGONAL) },
      { titulo: '4 esquinas', celdas: buscarGrupo('tradicional', [0, 3, 12, 15]) },
      { titulo: '4 al centro', celdas: buscarGrupo('tradicional', [5, 6, 9, 10]) },
      { titulo: 'Cuadro de 4', celdas: buscarGrupo('tradicional', [2, 3, 6, 7]) },
    ];
    case 'cruz': return [{ titulo: 'Las 2 diagonales', celdas: gruposCeldas(N, 'cruz')[0] }];
    case 'siete': return [{ titulo: 'Ejemplo: 7 cualesquiera', celdas: SIETE }];
    default: return [];
  }
}

const EXPLICACION = {
  llena: {
    icono: '🟩',
    texto: 'Gana quien marque <b>todas las casillas</b> de su tablero. Es la partida más larga y emocionante: casi siempre se canta la mayoría de la baraja.',
    notas: ['Ideal como “partida final” o para el premio mayor.'],
  },
  tradicional: {
    icono: '⭐',
    texto: 'Gana quien complete <b>cualquiera</b> de estas figuras. Es la forma clásica de las ferias y kermeses: partidas rápidas.',
    notas: [
      '<b>Horizontal, vertical o diagonal:</b> una fila, una columna o una diagonal completa (4 casillas en 4 × 4; en 5 × 5 son 5).',
      '<b>4 esquinas:</b> las cuatro casillas de las esquinas del tablero.',
      '<b>4 al centro:</b> el cuadro de 2 × 2 del centro (en tableros de 4 × 4).',
      '<b>Cuadro de 4:</b> cualquier grupo de 2 × 2 casillas juntas, en cualquier parte del tablero (en 4 × 4 hay 9 posibles; el del centro es “4 al centro”).',
    ],
  },
  cruz: {
    icono: '✖️',
    texto: 'Gana quien llene <b>las 2 diagonales</b>, formando una X de esquina a esquina.',
    notas: ['En tableros impares (3 × 3, 5 × 5) las diagonales comparten la casilla del centro.'],
  },
  siete: {
    icono: '7️⃣',
    texto: 'Gana quien marque <b>7 casillas en cualquier orden</b>, sin importar dónde estén. No hay figura: solo cuentan las casillas.',
    notas: ['En tableros de 2 × 2 solo hay 4 casillas, así que se juega como tabla llena.'],
  },
};

function tableroMini(celdas) {
  const activas = new Set(celdas);
  return `<div class="mini-tablero" aria-hidden="true">${Array.from({ length: N * N }, (_, i) =>
    `<span${activas.has(i) ? ' class="activa"' : ''}></span>`).join('')}</div>`;
}

function pintarFormas(contenedor) {
  contenedor.innerHTML = MODOS_VISIBLES.map((modo) => {
    const e = EXPLICACION[modo];
    return `
      <article class="tarjeta forma-ganar" id="forma-${modo}">
        <h3><span aria-hidden="true">${e.icono}</span> ${MODOS[modo].nombre}</h3>
        <p>${e.texto}</p>
        <div class="figuras">${figuras(modo).map((f) => `
          <figure>${tableroMini(f.celdas)}<figcaption>${f.titulo}</figcaption></figure>`).join('')}
        </div>
        <ul>${e.notas.map((n) => `<li>${n}</li>`).join('')}</ul>
      </article>`;
  }).join('');
}

export function iniciarInstrucciones() {
  const contenedor = document.getElementById('formas-ganar');
  if (contenedor) pintarFormas(contenedor);
  // El índice no cambia el hash (lo usan las rutas): solo desplaza hasta la sección
  document.querySelector('.instrucciones .indice')?.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-ancla]');
    if (!a) return;
    e.preventDefault();
    document.querySelector(a.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

export const vistaInstrucciones = { titulo: 'Cómo jugar' };
