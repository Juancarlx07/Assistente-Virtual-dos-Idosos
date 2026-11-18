/**
 * Portal self-service da pessoa querida, acessado por um token (não por login).
 *
 * Em vez de uma service role, usa funções RPC `SECURITY DEFINER` no Postgres
 * (ver supabase/migrations) chamadas com a anon key. Cada função resolve o
 * token para uma pessoa e só mexe nos dados DELA. Assim o app não precisa
 * embarcar nenhuma chave secreta de servidor.
 */

import { criarClienteAnon } from '../supabase/anon';
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

export async function obterDadosPortal(token: string): Promise<DadosPortal | null> {
  const c = criarClienteAnon();
  const { data, error } = await c.rpc('portal_obter', { p_token: token });
  if (error) throw new Error(`portal/obter: ${error.message}`);
  if (!data) return null;

  return {
    pessoa: paraPessoa(data.pessoa),
    consentimento: paraConsentimento(data.consentimento),
    preferencias: (data.preferencias ?? []).map(paraPreferencia),
    datas: (data.datas ?? []).map(paraDataImportante),
    ciclos: (data.ciclos ?? []).map(paraCiclo),
  };
}

async function definirConsentimento(
  token: string,
  status: 'concedido' | 'revogado',
): Promise<boolean> {
  const c = criarClienteAnon();
  const { data, error } = await c.rpc('portal_definir_consentimento', {
    p_token: token,
    p_status: status,
  });
  if (error) throw new Error(`portal/definirConsentimento: ${error.message}`);
  return data === true;
}

export const concederConsentimento = (token: string) =>
  definirConsentimento(token, 'concedido');
export const revogarConsentimento = (token: string) =>
  definirConsentimento(token, 'revogado');

export async function adicionarPreferenciaPortal(
  token: string,
  entrada: { categoria: string; valor: string; tipo: Preferencia['tipo'] },
): Promise<boolean> {
  const c = criarClienteAnon();
  const { data, error } = await c.rpc('portal_adicionar_preferencia', {
    p_token: token,
    p_categoria: entrada.categoria,
    p_valor: entrada.valor,
    p_tipo: entrada.tipo,
  });
  if (error) throw new Error(`portal/adicionarPreferencia: ${error.message}`);
  return data === true;
}

export async function removerPreferenciaPortal(
  token: string,
  preferenciaId: string,
): Promise<boolean> {
  const c = criarClienteAnon();
  const { data, error } = await c.rpc('portal_remover_preferencia', {
    p_token: token,
    p_pref_id: preferenciaId,
  });
  if (error) throw new Error(`portal/removerPreferencia: ${error.message}`);
  return data === true;
}

/** Apaga TODAS as informações registradas sobre a pessoa e revoga o consentimento. */
export async function apagarTudoPortal(token: string): Promise<boolean> {
  const c = criarClienteAnon();
  const { data, error } = await c.rpc('portal_apagar_tudo', { p_token: token });
  if (error) throw new Error(`portal/apagarTudo: ${error.message}`);
  return data === true;
}
