/**
 * server.js — runs alongside Vite in AI Studio (Cloud Run).
 * Proxies /api/supabase/* → Supabase, bypassing browser network restrictions.
 * In local dev, Vite's proxy config handles this instead.
 */
import express from 'express';
import { createServer as createViteServer } from 'vite';
import fetch from 'node-fetch';

const SUPABASE_URL = 'https://ilcajwggnghfjuezsidk.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsY2Fqd2dnbmdoZmp1ZXpzaWRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMzM1NjMsImV4cCI6MjA4NzYwOTU2M30.s73b5_i-H6RR68xZ6SXSwmD3T-7QYgtGbgK66YNIrMc';

const PORT = parseInt(process.env.PORT || '3000', 10);

async function main() {
  const app = express();

  // Raw body for all /api/supabase routes
  app.use('/api/supabase', express.raw({ type: '*/*', limit: '10mb' }));

  app.all('/api/supabase/*', async (req, res) => {
    try {
      // Strip /api/supabase prefix, forward to Supabase
      const supabasePath = req.path.replace(/^\/api\/supabase/, '');
      const targetUrl = `${SUPABASE_URL}${supabasePath}${req.url.includes('?') ? '?' + req.url.split('?')[1] : ''}`;

      const headers = {};
      // Forward relevant headers
      for (const [key, value] of Object.entries(req.headers)) {
        const lower = key.toLowerCase();
        if (['host', 'connection', 'content-length'].includes(lower)) continue;
        headers[key] = value;
      }
      if (!headers['apikey']) headers['apikey'] = SUPABASE_ANON_KEY;

      const body = req.method !== 'GET' && req.method !== 'HEAD' && Buffer.isBuffer(req.body) && req.body.length > 0
        ? req.body
        : undefined;

      const upstream = await fetch(targetUrl, {
        method: req.method,
        headers,
        body,
      });

      // Copy response headers
      upstream.headers.forEach((value, key) => {
        if (key.toLowerCase() === 'content-encoding') return;
        res.setHeader(key, value);
      });
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.status(upstream.status);

      const buffer = await upstream.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (err) {
      console.error('Proxy error:', err);
      res.status(502).json({ error: 'Proxy error', detail: String(err) });
    }
  });

  // Handle CORS preflight
  app.options('/api/supabase/*', (_req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'authorization,x-client-info,apikey,content-type,x-supabase-api-version,prefer');
    res.sendStatus(204);
  });

  // Start Vite dev server and use it as middleware
  const vite = await createViteServer({
    server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`OrbitDine server running on http://0.0.0.0:${PORT}`);
    console.log(`Supabase proxy active at /api/supabase/*`);
  });
}

main().catch(console.error);
