import { defineConfig } from 'vite';

export default defineConfig({
  base: '/oshinobi-portfolio/',
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 800,
  },
});
