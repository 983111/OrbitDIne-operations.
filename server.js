/**
 * server.js — serves the Vite SPA in AI Studio (Cloud Run).
 * The old /api/supabase proxy is removed because the Supabase JS client
 * now calls supabase.co directly — no proxy needed.
 */
import express from 'express';
import { createServer as createViteServer } from 'vite';

const PORT = parseInt(process.env.PORT || '3000', 10);

async function main() {
  const app = express();

  const vite = await createViteServer({
    server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`OrbitDine server running on http://0.0.0.0:${PORT}`);
  });
}

main().catch(console.error);
