import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const SUPABASE_URL = 'https://ilcajwggnghfjuezsidk.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsY2Fqd2dnbmdoZmp1ZXpzaWRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMzM1NjMsImV4cCI6MjA4NzYwOTU2M30.s73b5_i-H6RR68xZ6SXSwmD3T-7QYgtGbgK66YNIrMc';

// All Supabase requests route through /api/supabase (same-origin proxy).
// - In AI Studio / Cloud Run: handled by server.js (Express)
// - In local dev: handled by vite.config.ts proxy setting
// Both forward server-side to Supabase, bypassing browser network restrictions.
const PROXY_BASE = '/api/supabase';

const proxiedFetch = async (url: RequestInfo | URL, options?: RequestInit): Promise<Response> => {
  const original = url.toString();
  const proxied = original.startsWith(SUPABASE_URL)
    ? PROXY_BASE + original.slice(SUPABASE_URL.length)
    : original;

  const headers = new Headers((options?.headers as HeadersInit) ?? {});
  if (!headers.get('apikey')) headers.set('apikey', SUPABASE_ANON_KEY);

  return fetch(proxied, { ...options, headers });
};

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { fetch: proxiedFetch },
  auth: { persistSession: true, detectSessionInUrl: true },
});
