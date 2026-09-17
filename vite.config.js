import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/* Relative base so the build can be dropped on any static host — a subpath on
   GitHub Pages, the root of a Vercel project — without rewriting asset URLs. */
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: { target: 'es2022' }
});
