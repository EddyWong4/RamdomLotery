import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

// Commit actual (en GitHub Actions viene en GITHUB_SHA); si no hay git, queda vacío
function commitActual() {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA.slice(0, 7);
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return '';
  }
}

// base relativa: el build funciona en cualquier subcarpeta o hosting estático gratuito
export default defineConfig({
  base: './',
  server: { port: 5173 },
  // Dos páginas: la app y el kit de promoción (imágenes para TikTok)
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        promo: fileURLToPath(new URL('./promo/index.html', import.meta.url)),
        baraja: fileURLToPath(new URL('./promo/baraja.html', import.meta.url)),
      },
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __APP_COMMIT__: JSON.stringify(commitActual()),
    __APP_FECHA__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    // App instalable y usable sin internet. 'prompt': la app avisa cuando hay versión nueva en lugar de cambiar sola.
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icono.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Tableros de Lotería',
        short_name: 'Lotería',
        description: 'Genera tableros de lotería, imprímelos en PDF, canta las cartas y juega en el celular.',
        lang: 'es-MX',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#2d1206',
        theme_color: '#2d1206',
        icons: [
          { src: 'icono-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icono-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icono-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Las imágenes de cartas incluidas localmente no se precargan (pesan ~12 MB y no se publican)
        globIgnores: ['cartas/**'],
        // El kit de promoción es otra página: no se reemplaza por la app al navegar
        navigateFallbackDenylist: [new RegExp("/promo/")],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: { cacheName: 'fuentes', expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
        ],
      },
    }),
  ],
});
