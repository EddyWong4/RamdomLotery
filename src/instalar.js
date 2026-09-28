import { t as tr } from './i18n.js';
// Botón "Instalar app": usa la instalación nativa del navegador cuando existe (Chrome, Edge, Samsung…)
// y, donde no la hay (iPhone/iPad, Safari en Mac), muestra una guía con los pasos.

/**
 * Qué hacer al tocar "Instalar app":
 *  - 'instalada'  ya está instalada (se abrió desde el ícono): no se muestra el botón
 *  - 'nativa'     el navegador ofrece su ventana de instalación (evento beforeinstallprompt)
 *  - 'ios'        iPhone/iPad: guía Compartir → Agregar a pantalla de inicio
 *  - 'android'    Android sin ventana nativa (algunos navegadores): guía del menú ⋮
 *  - 'mac-safari' Safari en Mac: guía Archivo → Agregar al Dock
 *  - null         el navegador no permite instalar (p. ej. Firefox en computadora): no se muestra
 */
export function modoInstalacion({ plataforma, instalada, hayPromptNativo, userAgent = '', maxTouchPoints = 0 }) {
  if (instalada) return 'instalada';
  if (hayPromptNativo) return 'nativa';
  if (plataforma === 'ios') return 'ios';
  if (plataforma === 'android') return 'android';
  const esSafari = /safari/i.test(userAgent) && !/chrome|chromium|crios|edg|firefox|fxios|opr/i.test(userAgent);
  if (/macintosh/i.test(userAgent) && maxTouchPoints === 0 && esSafari) return 'mac-safari';
  return null;
}

// Íconos de las guías (van aparte del texto para poder traducirlo)
const ICONOS = {
  compartir: '<span class="icono-guia" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7.5 7.5 12 3l4.5 4.5"/><path d="M8 10H6a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1h-2"/></svg></span>',
  agregar: '<span class="icono-guia" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8v8M8 12h8"/></svg></span>',
};

const GUIAS = {
  ios: {
    titulo: 'Instalar en iPhone o iPad',
    pasos: [
      'Abre esta página en <b>Safari</b>.',
      'Toca el botón <b>Compartir</b> {compartir} (abajo en iPhone, arriba en iPad).',
      'Desliza y elige <b>Agregar a pantalla de inicio</b> {agregar}.',
      'Toca <b>Agregar</b>. El ícono de Lotería aparece en tu pantalla de inicio.',
    ],
  },
  android: {
    titulo: 'Instalar en Android',
    pasos: [
      'Abre el menú del navegador <b>⋮</b> (arriba a la derecha).',
      'Elige <b>Instalar app</b> o <b>Agregar a la pantalla principal</b>.',
      'Confirma con <b>Instalar</b>. El ícono de Lotería aparece con tus apps.',
    ],
  },
  'mac-safari': {
    titulo: 'Instalar en Mac (Safari)',
    pasos: [
      'En la barra de menús, abre <b>Archivo</b>.',
      'Elige <b>Agregar al Dock…</b>',
      'Confirma con <b>Agregar</b>. La app aparece en el Dock y en Launchpad.',
    ],
  },
};

export const guiaInstalacion = (modo) => GUIAS[modo] ?? null;

// ── Página ──────────────────────────────────────────────────────────────────
let promptNativo = null;
let avisar = () => {};

function estaInstalada() {
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function modoActual() {
  return modoInstalacion({
    plataforma: document.documentElement.dataset.plataforma,
    instalada: estaInstalada(),
    hayPromptNativo: !!promptNativo,
    userAgent: navigator.userAgent,
    maxTouchPoints: navigator.maxTouchPoints ?? 0,
  });
}

function pintarBotones() {
  const modo = modoActual();
  document.querySelectorAll('[data-instalar]').forEach((b) => (b.hidden = !modo || modo === 'instalada'));
}

function mostrarGuia(modo) {
  const guia = guiaInstalacion(modo);
  if (!guia) return;
  const dialogo = document.getElementById('dialogo-instalar');
  dialogo.querySelector('#instalar-titulo').textContent = tr(guia.titulo);
  dialogo.querySelector('#instalar-pasos').innerHTML = guia.pasos.map((p) => `<li>${tr(p, ICONOS)}</li>`).join('');
  dialogo.showModal();
}

async function instalar() {
  const modo = modoActual();
  if (modo === 'nativa') {
    const prompt = promptNativo;
    promptNativo = null; // cada evento solo se puede usar una vez
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome !== 'accepted') avisar('Puedes instalarla cuando quieras con el botón "Instalar app"');
    pintarBotones();
    return;
  }
  mostrarGuia(modo);
}

export function iniciarInstalacion(funcionAvisar) {
  avisar = funcionAvisar;
  // Chrome, Edge, Samsung…: el navegador avisa que la app se puede instalar; se guarda para usarlo con el botón
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    promptNativo = e;
    pintarBotones();
  });
  window.addEventListener('appinstalled', () => {
    promptNativo = null;
    document.querySelectorAll('[data-instalar]').forEach((b) => (b.hidden = true));
    avisar('¡Listo! La app quedó instalada en tu dispositivo', 4000);
  });
  document.querySelectorAll('[data-instalar]').forEach((b) => b.addEventListener('click', instalar));
  const dialogo = document.getElementById('dialogo-instalar');
  dialogo.addEventListener('click', (e) => { if (e.target === dialogo) dialogo.close(); });
  pintarBotones();
}
