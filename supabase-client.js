// Supabase configuration — single source of truth for all pages.
// The anon key is intentionally public; it is scoped by Row Level Security.
// Never put a service_role key here.
const SUPABASE_URL = 'https://vgndpvkywvcnezvjuueq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnbmRwdmt5d3ZjbmV6dmp1dWVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MDk5OTEsImV4cCI6MjA5MDA4NTk5MX0.GGwx_-W7pu485h3d6dgkhqSwiqxT3Hx02Ck9HW8nyE0';
const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
