import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const SUPABASE_URL = 'https://ilcajwggnghfjuezsidk.supabase.co';

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY ?? ''),
    },
    resolve: {
      alias: { '@': path.resolve(__dirname, '.') },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR !== 'true',
      // Local dev proxy: /api/supabase/* → Supabase (server-side, no CORS issues)
      proxy: {
        '/api/supabase': {
          target: SUPABASE_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/supabase/, ''),
        },
      },
    },
  };
});
