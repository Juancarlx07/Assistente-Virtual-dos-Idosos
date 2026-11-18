'use server';

import { revalidatePath } from 'next/cache';
import {
  adicionarPreferenciaPortal,
  apagarTudoPortal,
  concederConsentimento,
  removerPreferenciaPortal,
  revogarConsentimento,
} from '@/src/lib/persistencia/portal';
import type { Preferencia } from '@/src/lib/dominio/tipos';

function revalidar(token: string) {
  revalidatePath(`/portal/${token}`);
}

export async function concederAction(formData: FormData) {
  const token = String(formData.get('token') ?? '');
  await concederConsentimento(token);
  revalidar(token);
}

export async function revogarAction(formData: FormData) {
  const token = String(formData.get('token') ?? '');
  await revogarConsentimento(token);
  revalidar(token);
}

export async function adicionarPreferenciaAction(formData: FormData) {
  const token = String(formData.get('token') ?? '');
  const categoria = String(formData.get('categoria') ?? '').trim();
  const valor = String(formData.get('valor') ?? '').trim();
  const tipo = String(formData.get('tipo') ?? 'gosta') as Preferencia['tipo'];
  if (!categoria || !valor) {
    revalidar(token);
    return;
  }
  await adicionarPreferenciaPortal(token, { categoria, valor, tipo });
  revalidar(token);
}

export async function removerPreferenciaAction(formData: FormData) {
  const token = String(formData.get('token') ?? '');
  const id = String(formData.get('id') ?? '');
  await removerPreferenciaPortal(token, id);
  revalidar(token);
}

export async function apagarTudoAction(formData: FormData) {
  const token = String(formData.get('token') ?? '');
  await apagarTudoPortal(token);
  revalidar(token);
}
