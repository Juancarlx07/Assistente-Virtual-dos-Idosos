'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { criarClienteServidor } from '@/src/lib/supabase/server';
import {
  adicionarCiclo,
  adicionarData,
  removerCiclo,
  removerData,
} from '@/src/lib/persistencia/repositorios';

async function cliente() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/entrar');
  return supabase;
}

export async function adicionarDataAction(formData: FormData) {
  const pessoaId = String(formData.get('pessoaId') ?? '');
  const tipo = String(formData.get('tipo') ?? '').trim();
  const data = String(formData.get('data') ?? '');
  const recorrencia = String(formData.get('recorrencia') ?? 'anual') as
    | 'anual'
    | 'unica';
  const descricao = String(formData.get('descricao') ?? '').trim() || undefined;
  if (!pessoaId || !tipo || !data) redirect(`/painel/pessoas/${pessoaId}`);

  const supabase = await cliente();
  await adicionarData(supabase, pessoaId, { tipo, data, recorrencia, descricao });
  revalidatePath(`/painel/pessoas/${pessoaId}`);
}

export async function removerDataAction(formData: FormData) {
  const pessoaId = String(formData.get('pessoaId') ?? '');
  const id = String(formData.get('id') ?? '');
  const supabase = await cliente();
  await removerData(supabase, id);
  revalidatePath(`/painel/pessoas/${pessoaId}`);
}

export async function adicionarCicloAction(formData: FormData) {
  const pessoaId = String(formData.get('pessoaId') ?? '');
  const produto = String(formData.get('produto') ?? '').trim();
  const ultimaReposicao = String(formData.get('ultimaReposicao') ?? '');
  const intervaloDias = Number(formData.get('intervaloDias') ?? 0);
  if (!pessoaId || !produto || !ultimaReposicao || intervaloDias <= 0) {
    redirect(`/painel/pessoas/${pessoaId}`);
  }

  const supabase = await cliente();
  await adicionarCiclo(supabase, pessoaId, {
    produto,
    ultimaReposicao,
    intervaloDias,
  });
  revalidatePath(`/painel/pessoas/${pessoaId}`);
}

export async function removerCicloAction(formData: FormData) {
  const pessoaId = String(formData.get('pessoaId') ?? '');
  const id = String(formData.get('id') ?? '');
  const supabase = await cliente();
  await removerCiclo(supabase, id);
  revalidatePath(`/painel/pessoas/${pessoaId}`);
}
