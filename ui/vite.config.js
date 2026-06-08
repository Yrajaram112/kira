import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// Two entries: the main 400x600 window and the HUD overlay.
// Output goes to ui/dist/, which Electron loads in production.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        hud:   resolve(__dirname, 'hud.html'),
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
