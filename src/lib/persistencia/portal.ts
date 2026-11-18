/**
 * Portal self-service da pessoa querida, acessado por um token (não por login).
 *
 * Opera com o cliente admin (service role), que ignora o RLS — por isso cada
 * função primeiro resolve o token para uma pessoa e só mexe nos dados DELA.
 * É aqui que se cumpre o direito de ver, editar e apagar tudo.
 */

import { criarClienteAdmin } from '../supabase/admin';
import type {
  CicloDeConsumo,
  Consentimento,
  DataImportante,
  PessoaQuerida,
  Preferencia,
} from '../dominio/tipos';
import {
  paraCiclo,
  paraConsentimento,
  paraDataImportante,
  paraPessoa,
  paraPreferencia,
} from './mapeamento';

export interface DadosPortal {
  pessoa: PessoaQuerida;
  consentimento: Consentimento;
  preferencias: Preferencia[];
  datas: DataImportante[];
  ciclos: CicloDeConsumo[];
}

/** Resolve o token para o consentimento + pessoa. Lança se o token é inválido. */
async function resolverToken(token: string) {
  const admin = criarClienteAdmin();
  const { data, error } = await admin
    .from('consentimento')
    .select('*, pessoa:pessoa_id ( * )')
    .eq('token_portal', token)
    .maybeSingle();
  if (error) throw new Error(`portal/resolverToken: ${error.message}`);
  if (!data) return null;
  return { admin, consentimento: data, pessoaRaw: data.pessoa };
}

export async function obterDadosPortal(token: string): Promise<DadosPortal | null> {
  const r = await resolverToken(token);
  if (!r) return null;
  const { admin, consentimento, pessoaRaw } = r;
  const pessoaId = pessoaRaw.id;

  const [prefs, datas, ciclos] = await Promise.all([
    admin.from('preferencia').select('*').eq('pessoa_id', pessoaId),
    admin.from('data_importante').select('*').eq('pessoa_id', pessoaId).order('data'),
    admin.from('ciclo_consumo').select('*').eq('pessoa_id', pessoaId),
  ]);

  return {
    pessoa: paraPessoa(pessoaRaw),
    consentimento: paraConsentimento(consentimento),
    preferencias: (prefs.data ?? []).map(paraPreferencia),
    datas: (datas.data ?? []).map(paraDataImportante),
    ciclos: (ciclos.data ?? []).map(paraCiclo),
  };
}

/** Define o status do consentimento e espelha em pessoa_querida. */
async function definirConsentimento(
  token: string,
  status: 'concedido' | 'revogado',
): Promise<boolean> {
  const r = await resolverToken(token);
  if (!r) return false;
  const { admin, consentimento, pessoaRaw } = r;

  const patch =
    status === 'concedido'
      ? { status, data_concessao: new Date().toISOString(), data_revogacao: null }
      : { status, data_revogacao: new Date().toISOString() };

  const { error: e1 } = await admin
    .from('consentimento')
    .update(patch)
    .eq('id', consentimento.id);
  if (e1) throw new Error(`portal/definirConsentimento: ${e1.message}`);

  const { error: e2 } = await admin
    .from('pessoa_querida')
    .update({ status_consentimento: status })
    .eq('id', pessoaRaw.id);
  if (e2) throw new Error(`portal/definirConsentimento(pessoa): ${e2.message}`);
  return true;
}

export const concederConsentimento = (token: string) =>
  definirConsentimento(token, 'concedido');
export const revogarConsentimento = (token: string) =>
  definirConsentimento(token, 'revogado');

export async function adicionarPreferenciaPortal(
  token: string,
  entrada: { categoria: string; valor: string; tipo: Preferencia['tipo'] },
): Promise<boolean> {
  const r = await resolverToken(token);
  if (!r) return false;
  const { admin, pessoaRaw } = r;
  const { error } = await admin.from('preferencia').insert({
    pessoa_id: pessoaRaw.id,
    categoria: entrada.categoria,
    valor: entrada.valor,
    tipo: entrada.tipo,
  });
  if (error) throw new Error(`portal/adicionarPreferencia: ${error.message}`);
  return true;
}

export async function removerPreferenciaPortal(
  token: string,
  preferenciaId: string,
): Promise<boolean> {
  const r = await resolverToken(token);
  if (!r) return false;
  const { admin, pessoaRaw } = r;
  // Garante que a preferência é desta pessoa antes de apagar.
  const { error } = await admin
    .from('preferencia')
    .delete()
    .eq('id', preferenciaId)
    .eq('pessoa_id', pessoaRaw.id);
  if (error) throw new Error(`portal/removerPreferencia: ${error.message}`);
  return true;
}

/** Apaga TODAS as informações registradas sobre a pessoa e revoga o consentimento. */
export async function apagarTudoPortal(token: string): Promise<boolean> {
  const r = await resolverToken(token);
  if (!r) return false;
  const { admin, pessoaRaw } = r;
  const pessoaId = pessoaRaw.id;

  for (const tabela of ['preferencia', 'data_importante', 'ciclo_consumo']) {
    const { error } = await admin.from(tabela).delete().eq('pessoa_id', pessoaId);
    if (error) throw new Error(`portal/apagarTudo(${tabela}): ${error.message}`);
  }
  await definirConsentimento(token, 'revogado');
  return true;
}
