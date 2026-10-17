import { defineConfig } from 'vite';

// `base: './'` makes the build work from any sub-path, so the same output
// deploys to GitHub Pages (username.github.io/repo), Vercel, or Netlify.
export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 800,
  },
});
