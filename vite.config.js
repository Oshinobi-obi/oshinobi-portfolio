
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/my-vite-app/',
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 800,
  },
});
