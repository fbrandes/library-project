import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '/bookinfo/',
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  test: {
    css: true,
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
});
