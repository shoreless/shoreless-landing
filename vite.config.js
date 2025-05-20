import { defineConfig } from 'vite';

export default defineConfig({
  base: '/shoreless-landing/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true
  }
}); 