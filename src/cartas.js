// Baraja de 54 cartas. Para cambiar de baraja, reemplaza las imágenes en public/cartas
// (01.jpg ... 54.jpg) y ajusta los nombres aquí.
const NOMBRES = [
  'El Gallo', 'El Diablito', 'La Dama', 'El Catrín', 'El Paraguas', 'La Sirena',
  'La Escalera', 'La Botella', 'El Barril', 'El Árbol', 'El Melón', 'El Valiente',
  'El Gorrito', 'La Muerte', 'La Pera', 'La Bandera', 'El Bandolón', 'El Violoncello',
  'La Garza', 'El Pájaro', 'La Mano', 'La Bota', 'La Luna', 'El Cotorro',
  'El Borracho', 'El Negrito', 'El Corazón', 'La Sandía', 'El Tambor', 'El Camarón',
  'Las Jaras', 'El Músico', 'La Araña', 'El Soldado', 'La Estrella', 'El Cazo',
  'El Mundo', 'El Apache', 'El Nopal', 'El Alacrán', 'La Rosa', 'La Calavera',
  'La Campana', 'El Cantarito', 'El Venado', 'El Sol', 'La Corona', 'La Chalupa',
  'El Pino', 'El Pescado', 'La Palma', 'La Maceta', 'El Arpa', 'La Rana',
];

export const TOTAL_CARTAS = NOMBRES.length;

// Proporción ancho/alto de las imágenes (1292 x 2048)
export const PROPORCION_CARTA = 1292 / 2048;

const base = import.meta.env?.BASE_URL ?? './';
const archivo = (id) => String(id).padStart(2, '0') + '.jpg';

export const CARTAS = NOMBRES.map((nombre, i) => ({
  id: i + 1,
  nombre,
  imagen: `${base}cartas/${archivo(i + 1)}`,
  miniatura: `${base}cartas/min/${archivo(i + 1)}`,
}));

export const cartaPorId = (id) => CARTAS[id - 1];
