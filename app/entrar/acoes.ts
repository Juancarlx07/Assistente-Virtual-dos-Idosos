'use server';

import { redirect } from 'next/navigation';
import { criarClienteServidor } from '@/src/lib/supabase/server';

export async function entrar(formData: FormData) {
  const email = String(formData.get('email') ?? '');
  const senha = String(formData.get('senha') ?? '');
  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });
  if (error) {
    redirect(`/entrar?erro=${encodeURIComponent(error.message)}`);
  }
  redirect('/painel');
}

export async function cadastrar(formData: FormData) {
  const nome = String(formData.get('nome') ?? '');
  const email = String(formData.get('email') ?? '');
  const senha = String(formData.get('senha') ?? '');
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: { data: { nome } },
  });
  if (error) {
    redirect(`/entrar?erro=${encodeURIComponent(error.message)}`);
  }
  // Se o projeto exige confirmação de e-mail, não há sessão ainda.
  if (!data.session) {
    redirect('/entrar?msg=confirme');
  }
  redirect('/painel');
}

export async function sair() {
  const supabase = await criarClienteServidor();
  await supabase.auth.signOut();
  redirect('/entrar');
}
