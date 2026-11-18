import { createClient } from '@supabase/supabase-js';

/**
 * Cliente Supabase com service role — IGNORA o RLS.
 *
 * Uso exclusivo do servidor e restrito ao portal self-service da pessoa
 * querida, que se autentica por um token de portal (não por auth.uid()).
 * Nunca exponha a service role key ao navegador.
 */
export function criarClienteAdmin() {
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!chave) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada.');
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, chave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
