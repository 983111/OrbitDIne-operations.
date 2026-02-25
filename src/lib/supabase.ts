import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Works in AI Studio (process.env injected by vite define),
// local dev (VITE_ prefix), and falls back to hardcoded values.
const supabaseUrl =
  (typeof process !== 'undefined' && (process.env as any)?.SUPABASE_URL) ||
  import.meta.env?.VITE_SUPABASE_URL ||
  'https://ilcajwggnghfjuezsidk.supabase.co';

const supabaseAnonKey =
  (typeof process !== 'undefined' && (process.env as any)?.SUPABASE_ANON_KEY) ||
  import.meta.env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsY2Fqd2dnbmdoZmp1ZXpzaWRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMzM1NjMsImV4cCI6MjA4NzYwOTU2M30.s73b5_i-H6RR68xZ6SXSwmD3T-7QYgtGbgK66YNIrMc';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
