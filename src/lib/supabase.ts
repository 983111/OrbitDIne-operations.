import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const SUPABASE_URL = 'https://ilcajwggnghfjuezsidk.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsY2Fqd2dnbmdoZmp1ZXpzaWRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMzM1NjMsImV4cCI6MjA4NzYwOTU2M30.s73b5_i-H6RR68xZ6SXSwmD3T-7QYgtGbgK66YNIrMc';

// The edge function proxy URL - routes all Supabase API calls server-side
// to bypass any network restrictions in the hosting environment.
const PROXY_BASE = `${SUPABASE_URL}/functions/v1/supabase-proxy`;

const proxiedFetch = async (url: RequestInfo | URL, options?: RequestInit): Promise<Response> => {
  const original = url.toString();
  // Only rewrite calls going to our Supabase project
  const proxied = original.startsWith(SUPABASE_URL)
    ? original.replace(SUPABASE_URL, PROXY_BASE)
    : original;
  
  const headers = new Headers((options?.headers as HeadersInit) ?? {});
  if (!headers.get('apikey')) headers.set('apikey', SUPABASE_ANON_KEY);
  
  return fetch(proxied, { ...options, headers });
};

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { fetch: proxiedFetch },
  auth: {
    // Needed so auth state persists across page refreshes
    persistSession: true,
    detectSessionInUrl: true,
  },
});
