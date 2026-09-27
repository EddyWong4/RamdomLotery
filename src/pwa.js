// Registro del service worker (uso sin internet). Si hay una versión nueva publicada,
// se muestra un aviso para actualizar en vez de cambiar la app a media partida.
import { registerSW } from 'virtual:pwa-register';

export function iniciarPwa(avisar) {
  const aviso = document.getElementById('aviso-actualizacion');
  const actualizarSW = registerSW({
    onNeedRefresh() {
      aviso.hidden = false;
    },
    onOfflineReady() {
      avisar('Listo: la app ya funciona sin internet en este dispositivo', 4000);
    },
  });
  document.getElementById('btn-actualizar').addEventListener('click', () => actualizarSW(true));
  document.getElementById('btn-actualizar-despues').addEventListener('click', () => (aviso.hidden = true));
}
