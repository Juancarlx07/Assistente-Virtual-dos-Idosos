'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { criarClienteServidor } from '@/src/lib/supabase/server';
import { salvarGesto } from '@/src/lib/persistencia/repositorios';
import { temElementoPessoal } from '@/src/lib/dominio/gesto';

export async function salvarGestoAction(formData: FormData) {
  const sugestaoId = String(formData.get('sugestaoId') ?? '');
  const elementoPessoal = String(formData.get('elementoPessoal') ?? '');
  const dataPlanejada = String(formData.get('dataPlanejada') ?? '') || undefined;
  const marcarPronto = formData.get('marcarPronto') === '1';

  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/entrar');

  // Regra de personalização obrigatória: só fica "pronto" com elemento pessoal.
  if (marcarPronto && !temElementoPessoal({ elementoPessoal })) {
    redirect(`/painel/preparar/${sugestaoId}?erro=personalizacao`);
  }

  await salvarGesto(
    supabase,
    sugestaoId,
    elementoPessoal,
    marcarPronto,
    dataPlanejada,
  );

  revalidatePath('/painel');
  if (marcarPronto) redirect('/painel');
  redirect(`/painel/preparar/${sugestaoId}?msg=salvo`);
}
