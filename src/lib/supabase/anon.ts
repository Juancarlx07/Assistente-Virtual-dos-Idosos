import { createClient } from '@supabase/supabase-js';

/**
 * Cliente Supabase anônimo, sem sessão. Usado pelo portal self-service para
 * chamar as funções RPC (SECURITY DEFINER) que operam por token — assim o app
 * não precisa embarcar a service role key.
 */
export function criarClienteAnon() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
