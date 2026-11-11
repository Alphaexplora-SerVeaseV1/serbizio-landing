import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: true,
      // Mirrors the production rewrite in vercel.json during local development.
      proxy: env.VITE_API_PROXY_TARGET
        ? {
            '/api': {
              target: env.VITE_API_PROXY_TARGET,
              changeOrigin: true,
              rewrite: (requestPath: string) => requestPath.replace(/^\/api/, ''),
            },
          }
        : undefined,
    },
  };
});
