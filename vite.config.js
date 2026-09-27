import { defineConfig } from 'vite';

// base relativa: el build funciona en cualquier subcarpeta o hosting estático gratuito
export default defineConfig({
  base: './',
  server: { port: 5173 },
});
