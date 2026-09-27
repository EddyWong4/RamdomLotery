import { defineConfig } from 'vite';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

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
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __APP_COMMIT__: JSON.stringify(commitActual()),
    __APP_FECHA__: JSON.stringify(new Date().toISOString()),
  },
});
