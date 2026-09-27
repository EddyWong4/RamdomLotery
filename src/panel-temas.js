// Ventana "Tema de color": muestra los temas con sus colores y aplica el elegido al momento.
import { TEMAS, elegirTema } from './temas.js';

let el;

function pintar() {
  const actual = document.documentElement.dataset.tema;
  el.lista.innerHTML = TEMAS.map((t) => `
    <button type="button" class="tema-opcion${t.id === actual ? ' activo' : ''}" data-tema="${t.id}" role="radio" aria-checked="${t.id === actual}">
      <span class="tema-muestra" aria-hidden="true" style="background:${t.muestra[0]}">
        <i style="background:${t.muestra[3]}"></i><i style="background:${t.muestra[1]}"></i><i style="background:${t.muestra[2]}"></i>
      </span>
      <span class="tema-texto"><b>${t.nombre}</b><small>${t.descripcion} · ${t.claro ? 'claro' : 'oscuro'}</small></span>
      <span class="tema-marca" aria-hidden="true">${t.id === actual ? '✓' : ''}</span>
    </button>`).join('');
}

export function iniciarPanelTemas() {
  el = { dialogo: document.getElementById('dialogo-temas'), lista: document.getElementById('lista-temas') };
  document.querySelectorAll('[data-abrir-temas]').forEach((b) => b.addEventListener('click', () => {
    pintar();
    el.dialogo.showModal();
  }));
  el.lista.addEventListener('click', (e) => {
    const b = e.target.closest('[data-tema]');
    if (!b) return;
    elegirTema(b.dataset.tema);
    pintar();
  });
  el.dialogo.addEventListener('click', (e) => { if (e.target === el.dialogo) el.dialogo.close(); });
}
