'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { criarClienteServidor } from '@/src/lib/supabase/server';
import {
  atualizarStatusSugestao,
  criarPessoa,
  garantirPerfil,
  gerarSugestoesDaSemana,
} from '@/src/lib/persistencia/repositorios';
import type { PessoaQuerida } from '@/src/lib/dominio/tipos';

async function usuarioAtual() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/entrar');
  const usuario = await garantirPerfil(supabase, user);
  return { supabase, usuario };
}

export async function gerarSugestoesAction() {
  const { supabase, usuario } = await usuarioAtual();
  await gerarSugestoesDaSemana(supabase, usuario);
  revalidatePath('/painel');
}

export async function criarPessoaAction(formData: FormData) {
  const apelido = String(formData.get('apelido') ?? '').trim();
  const tipoRelacao = String(
    formData.get('tipoRelacao') ?? 'outro',
  ) as PessoaQuerida['tipoRelacao'];
  if (!apelido) redirect('/painel');
  const { supabase, usuario } = await usuarioAtual();
  const pessoa = await criarPessoa(supabase, usuario.id, apelido, tipoRelacao);
  redirect(`/painel/pessoas/${pessoa.id}`);
}

export async function descartarSugestaoAction(formData: FormData) {
  const id = String(formData.get('sugestaoId') ?? '');
  const { supabase } = await usuarioAtual();
  await atualizarStatusSugestao(supabase, id, 'descartada');
  revalidatePath('/painel');
}
