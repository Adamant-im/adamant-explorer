import { createLogger, defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

const logger = createLogger();
const logError = logger.error.bind(logger);
let lastSocketDisconnectLog = 0;

logger.error = (message, options) => {
  const errorCode = options?.error?.code ?? options?.error?.errors?.[0]?.code;
  const isSocketProxyError =
    message.includes('ws proxy') &&
    (errorCode === 'EPIPE' || errorCode === 'ECONNRESET' || errorCode === 'ECONNREFUSED');

  if (!isSocketProxyError) {
    logError(message, options);
    return;
  }

  if (Date.now() - lastSocketDisconnectLog > 30000) {
    lastSocketDisconnectLog = Date.now();
    const status =
      errorCode === 'ECONNREFUSED'
        ? 'Backend unavailable'
        : 'Connection closed during backend restart';
    logger.warn(`[dev] Socket.IO proxy: ${status}; the client will retry automatically`, {
      timestamp: true,
    });
  }
};

/**
 * Vite configuration for the ADAMANT Explorer frontend.
 *
 * The Vue application lives in `src/` and is built into `public/`,
 * which the Express backend serves as static files. Files in
 * `src/static/` (favicons, manifest, map marker icons) are copied
 * to `public/` verbatim.
 *
 * The dev server proxies API and Socket.IO traffic to the explorer
 * backend that `npm run dev` starts on localhost:6040.
 */
export default defineConfig({
  root: 'src',
  publicDir: 'static',
  plugins: [vue()],
  customLogger: logger,
  build: {
    outDir: '../public',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:6040',
      '/osm-tiles': 'http://localhost:6040',
      '/socket.io': {
        target: 'http://localhost:6040',
        ws: true,
      },
    },
  },
});
