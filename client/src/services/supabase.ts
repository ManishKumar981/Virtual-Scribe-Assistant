// ============================================
// AURA - Supabase Client
// ============================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hwyopnisockwxjubldea.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3eW9wbmlzb2Nrd3hqdWJsZGVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1ODE4OTQsImV4cCI6MjEwMzE1Nzg5NH0.tFB0yauMiF6lmyeqdboIZc8mNpXo0QCTooVcBfhHL90';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
