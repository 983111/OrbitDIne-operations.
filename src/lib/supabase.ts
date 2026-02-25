import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const SUPABASE_URL = 'https://ilcajwggnghfjuezsidk.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsY2Fqd2dnbmdoZmp1ZXpzaWRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMzM1NjMsImV4cCI6MjA4NzYwOTU2M30.s73b5_i-H6RR68xZ6SXSwmD3T-7QYgtGbgK66YNIrMc';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, detectSessionInUrl: true },
});
