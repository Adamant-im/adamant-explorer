import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

/**
 * Vite configuration for the ADAMANT Explorer frontend.
 *
 * The Vue application lives in `src/` and is built into `public/`,
 * which the Express backend serves as static files. Files in
 * `src/static/` (favicons, manifest, map marker icons) are copied
 * to `public/` verbatim.
 *
 * The dev server proxies API and Socket.IO traffic to a locally
 * running explorer backend, so `npm run dev` works against real data.
 */
export default defineConfig({
  root: 'src',
  publicDir: 'static',
  plugins: [vue()],
  build: {
    outDir: '../public',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:6040',
      '/socket.io': {
        target: 'http://localhost:6040',
        ws: true,
      },
    },
  },
});
