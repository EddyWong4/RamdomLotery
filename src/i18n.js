// Idioma de la app: español (predeterminado) o inglés.
// El español es el texto original de la página y del código. En inglés:
//  - la página se traduce sola con el diccionario (textos fijos, avisos, atributos y lo que se dibuja después),
//  - los mensajes con datos (números, nombres) usan t('Tablero Nº {n} agregado', { n }),
//  - confirm / alert / prompt también se traducen.
// Los nombres de las cartas se quedan en español: son los nombres tradicionales del juego.
import { EN } from './i18n-en.js';

const CLAVE = 'loteria-tableros:idioma';
export const IDIOMAS = { es: 'Español', en: 'English' };

function leerIdioma() {
  try {
    const v = JSON.parse(localStorage.getItem(CLAVE));
    return v in IDIOMAS ? v : 'es';
  } catch {
    return 'es';
  }
}

const actual = leerIdioma();
export const idioma = () => actual;
export const enIngles = () => actual === 'en';
/** Formato de números y fechas del idioma actual */
export const LOCALE = actual === 'en' ? 'en-US' : 'es-MX';

/** Guarda el idioma y recarga: todo se vuelve a dibujar en el idioma nuevo (el estado vive en el navegador). */
export function cambiarIdioma(nuevo) {
  if (!(nuevo in IDIOMAS) || nuevo === actual) return;
  try {
    localStorage.setItem(CLAVE, JSON.stringify(nuevo));
  } catch {
    // sin almacenamiento el idioma no se puede recordar
  }
  location.reload();
}

export const normalizar = (s) => String(s).replace(/\s+/g, ' ').trim();

/** Traducción exacta de un texto en español (o null si no está en el diccionario). */
export function traduccion(texto) {
  const clave = normalizar(texto);
  return Object.prototype.hasOwnProperty.call(EN, clave) ? EN[clave] : null;
}

/**
 * Texto en el idioma actual. `clave` es el texto en español; {nombre} se reemplaza con `datos.nombre`.
 * Si falta la traducción se usa el español, así nunca se pierde un mensaje.
 */
export function t(clave, datos = {}) {
  let base = clave;
  if (actual === 'en') {
    const en = traduccion(clave);
    // Se conservan los espacios de las orillas: ' dobles', ' (todos)'…
    if (en !== null) base = clave.match(/^\s*/)[0] + en + clave.match(/\s*$/)[0];
  }
  return base.replace(/\{(\w+)\}/g, (m, k) => (k in datos ? String(datos[k]) : m));
}

// ── Traducción de la página ──────────────────────────────────────────────────
const ATRIBUTOS = ['title', 'aria-label', 'placeholder', 'alt'];
const EN_LINEA = new Set(['B', 'I', 'STRONG', 'EM', 'SMALL', 'BR', 'A', 'CODE', 'KBD']);
const OMITIR = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'svg', 'SVG', 'CODE']);

function traducirTexto(nodo) {
  const texto = nodo.data;
  if (!/[A-Za-zÁÉÍÓÚáéíóúñ¿¡]/.test(texto)) return;
  const en = traduccion(texto);
  if (en === null) return;
  const nuevo = texto.match(/^\s*/)[0] + en + texto.match(/\s*$/)[0];
  if (nuevo !== texto) nodo.data = nuevo;
}

function traducirAtributos(el) {
  for (const a of ATRIBUTOS) {
    const v = el.getAttribute(a);
    if (!v) continue;
    const en = traduccion(v);
    if (en !== null && en !== v) el.setAttribute(a, en);
  }
}

// Solo texto con formato (<b>, <a>, <small>…): se traduce la frase completa, así el orden de las palabras queda natural
function soloEnLinea(el) {
  for (const hijo of el.children) {
    if (!EN_LINEA.has(hijo.tagName) || hijo.id || !soloEnLinea(hijo)) return false;
  }
  return true;
}

function traducirFrase(el) {
  if (!el.firstElementChild || !soloEnLinea(el)) return false;
  const en = traduccion(el.innerHTML);
  if (en === null) return false;
  if (normalizar(el.innerHTML) !== en) el.innerHTML = en;
  return true;
}

export function traducirArbol(raiz) {
  if (actual !== 'en' || !raiz) return;
  if (raiz.nodeType === 3) return traducirTexto(raiz);
  if (raiz.nodeType !== 1 || OMITIR.has(raiz.tagName)) return;
  const pila = [raiz];
  while (pila.length) {
    const el = pila.pop();
    traducirAtributos(el);
    if (traducirFrase(el)) continue;
    for (const hijo of el.childNodes) {
      if (hijo.nodeType === 3) traducirTexto(hijo);
      else if (hijo.nodeType === 1 && !OMITIR.has(hijo.tagName)) pila.push(hijo);
    }
  }
}

const traducirMensaje = (m) => (m == null ? m : String(m).split('\n\n').map((p) => traduccion(p) ?? p).join('\n\n'));

/** Traduce la página y todo lo que se agregue después. Se llama una vez, antes de iniciar la app. */
export function iniciarIdioma() {
  document.documentElement.lang = actual === 'en' ? 'en' : 'es';
  if (actual === 'en') {
    traducirArbol(document.head.querySelector('title'));
    traducirArbol(document.body);
    new MutationObserver((cambios) => {
      for (const c of cambios) {
        if (c.type === 'childList') {
          if (c.target.nodeType === 1 && traducirFrase(c.target)) continue;
          c.addedNodes.forEach(traducirArbol);
        } else if (c.type === 'characterData') {
          traducirTexto(c.target);
        } else if (c.type === 'attributes') {
          traducirAtributos(c.target);
        }
      }
    }).observe(document.documentElement, {
      subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATRIBUTOS,
    });
    const confirmar = window.confirm.bind(window);
    const alertar = window.alert.bind(window);
    const preguntar = window.prompt.bind(window);
    window.confirm = (m) => confirmar(traducirMensaje(m));
    window.alert = (m) => alertar(traducirMensaje(m));
    window.prompt = (m, v) => preguntar(traducirMensaje(m), v);
  }

  // Botones para cambiar de idioma (escritorio y barra del celular)
  document.querySelectorAll('[data-idioma]').forEach((b) => {
    const otro = actual === 'en' ? 'es' : 'en';
    b.querySelector('[data-idioma-etiqueta]').textContent = actual.toUpperCase();
    b.title = actual === 'en' ? 'Cambiar a español' : 'Switch to English';
    b.setAttribute('aria-label', b.title);
    b.addEventListener('click', () => cambiarIdioma(otro));
  });
}
