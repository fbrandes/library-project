import react from '@astrojs/react';
import svelte from '@astrojs/svelte';
import vue from '@astrojs/vue';
import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';

const workspaceRoot = fileURLToPath(new URL('..', import.meta.url));

export default defineConfig({
  integrations: [react(), svelte(), vue()],
  vite: {
    resolve: {
      dedupe: ['@emotion/react', '@emotion/styled', '@mui/icons-material', '@mui/material', 'react', 'react-dom', 'zustand'],
    },
    server: {
      fs: {
        allow: [workspaceRoot],
      },
      proxy: {
        '/api/bookinfo': {
          target: 'http://localhost:8081',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/bookinfo/, ''),
        },
        '/api/renting': {
          target: 'http://localhost:8082',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/renting/, ''),
        },
        '/api/user-management': {
          target: 'http://localhost:8083',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/user-management/, ''),
        },
      },
    },
  },
});
