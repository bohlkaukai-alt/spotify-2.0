import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const hasSupabase = supabaseUrl.startsWith('http') && supabaseUrl.includes('.supabase.co') && supabaseAnonKey.startsWith('eyJ');

let _supabase;
if (hasSupabase) {
  try {
    _supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch {
    _supabase = null;
  }
}

const _stub = {
  auth: {
    getSession: () => Promise.resolve({ data: { session: null } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signUp: () => { throw new Error('Supabase nicht konfiguriert. Bitte VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY in Vercel setzen.'); },
    signInWithPassword: () => { throw new Error('Supabase nicht konfiguriert. Bitte VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY in Vercel setzen.'); },
    signOut: () => Promise.resolve(),
  },
  from: () => ({ delete: () => ({ eq: () => ({}) }), select: () => ({ eq: () => ({ data: [] }) }), insert: () => Promise.resolve() }),
};

export const supabase = _supabase || _stub;
export const isSupabaseConfigured = !!_supabase;
