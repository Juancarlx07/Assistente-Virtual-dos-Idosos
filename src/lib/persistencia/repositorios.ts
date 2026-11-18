/**
 * Repositórios para o usuário autenticado. Todas as operações passam pelo RLS
 * do Supabase (o cliente carrega a sessão do usuário), então um usuário só
 * enxerga e altera o que é seu.
 */

import type { SupabaseClient, User } from '@supabase/supabase-js';
import type {
  CicloDeConsumo,
  DataImportante,
  Gesto,
  Lembrete,
  PessoaQuerida,
  Preferencia,
  Sugestao,
  Usuario,
} from '../dominio/tipos';
import {
  gerarSugestoes,
  type GestoHistorico,
} from '../sugestoes/motor';
import { semanaRefISO } from '../sugestoes/datas';
import {
  paraCiclo,
  paraDataImportante,
  paraLembrete,
  paraPessoa,
  paraPreferencia,
  paraSugestao,
  paraUsuario,
} from './mapeamento';

type Cliente = SupabaseClient;

function falhar(contexto: string, erro: { message: string } | null): never {
  throw new Error(`${contexto}: ${erro?.message ?? 'erro desconhecido'}`);
}

// ───────────────────────── Perfil ─────────────────────────

/** Garante que exista uma linha em `usuario` para o usuário autenticado. */
export async function garantirPerfil(c: Cliente, user: User): Promise<Usuario> {
  const nome =
    (user.user_metadata?.nome as string | undefined) ??
    user.email?.split('@')[0] ??
    'Você';
  const { data, error } = await c
    .from('usuario')
    .upsert(
      { id: user.id, nome, email: user.email ?? '' },
      { onConflict: 'id', ignoreDuplicates: false },
    )
    .select()
    .single();
  if (error) falhar('garantirPerfil', error);
  return paraUsuario(data);
}

// ───────────────────────── Pessoas ─────────────────────────

export interface PessoaComResumo extends PessoaQuerida {
  qtdPreferencias: number;
  qtdDatas: number;
}

export async function listarPessoas(c: Cliente): Promise<PessoaQuerida[]> {
  const { data, error } = await c
    .from('pessoa_querida')
    .select('*')
    .order('criado_em', { ascending: true });
  if (error) falhar('listarPessoas', error);
  return (data ?? []).map(paraPessoa);
}

export async function obterPessoa(
  c: Cliente,
  id: string,
): Promise<PessoaQuerida | null> {
  const { data, error } = await c
    .from('pessoa_querida')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) falhar('obterPessoa', error);
  return data ? paraPessoa(data) : null;
}

/** Cria a pessoa querida e já abre um consentimento pendente com token. */
export async function criarPessoa(
  c: Cliente,
  usuarioId: string,
  apelido: string,
  tipoRelacao: PessoaQuerida['tipoRelacao'],
): Promise<PessoaQuerida> {
  const { data, error } = await c
    .from('pessoa_querida')
    .insert({ usuario_id: usuarioId, apelido, tipo_relacao: tipoRelacao })
    .select()
    .single();
  if (error) falhar('criarPessoa', error);

  const { error: erroConsent } = await c
    .from('consentimento')
    .insert({ pessoa_id: data.id, status: 'pendente' });
  if (erroConsent) falhar('criarPessoa/consentimento', erroConsent);

  return paraPessoa(data);
}

export async function obterConsentimentoPorPessoa(c: Cliente, pessoaId: string) {
  const { data, error } = await c
    .from('consentimento')
    .select('*')
    .eq('pessoa_id', pessoaId)
    .maybeSingle();
  if (error) falhar('obterConsentimentoPorPessoa', error);
  return data;
}

// ─────────────────── Preferências / Datas / Ciclos ───────────────────

export async function listarPreferencias(
  c: Cliente,
  pessoaId: string,
): Promise<Preferencia[]> {
  const { data, error } = await c
    .from('preferencia')
    .select('*')
    .eq('pessoa_id', pessoaId);
  if (error) falhar('listarPreferencias', error);
  return (data ?? []).map(paraPreferencia);
}

export async function listarDatas(
  c: Cliente,
  pessoaId: string,
): Promise<DataImportante[]> {
  const { data, error } = await c
    .from('data_importante')
    .select('*')
    .eq('pessoa_id', pessoaId)
    .order('data', { ascending: true });
  if (error) falhar('listarDatas', error);
  return (data ?? []).map(paraDataImportante);
}

export async function adicionarData(
  c: Cliente,
  pessoaId: string,
  entrada: { tipo: string; data: string; recorrencia: 'anual' | 'unica'; descricao?: string },
): Promise<void> {
  const { error } = await c.from('data_importante').insert({
    pessoa_id: pessoaId,
    tipo: entrada.tipo,
    data: entrada.data,
    recorrencia: entrada.recorrencia,
    descricao: entrada.descricao ?? null,
  });
  if (error) falhar('adicionarData', error);
}

export async function removerData(c: Cliente, id: string): Promise<void> {
  const { error } = await c.from('data_importante').delete().eq('id', id);
  if (error) falhar('removerData', error);
}

export async function listarCiclos(
  c: Cliente,
  pessoaId: string,
): Promise<CicloDeConsumo[]> {
  const { data, error } = await c
    .from('ciclo_consumo')
    .select('*')
    .eq('pessoa_id', pessoaId);
  if (error) falhar('listarCiclos', error);
  return (data ?? []).map(paraCiclo);
}

export async function adicionarCiclo(
  c: Cliente,
  pessoaId: string,
  entrada: { produto: string; ultimaReposicao: string; intervaloDias: number },
): Promise<void> {
  const { error } = await c.from('ciclo_consumo').insert({
    pessoa_id: pessoaId,
    produto: entrada.produto,
    ultima_reposicao: entrada.ultimaReposicao,
    intervalo_dias: entrada.intervaloDias,
  });
  if (error) falhar('adicionarCiclo', error);
}

export async function removerCiclo(c: Cliente, id: string): Promise<void> {
  const { error } = await c.from('ciclo_consumo').delete().eq('id', id);
  if (error) falhar('removerCiclo', error);
}

// ───────────────────────── Histórico ─────────────────────────

async function carregarHistorico(
  c: Cliente,
  pessoaId: string,
): Promise<GestoHistorico[]> {
  // Gestos já enviados (com data), com o tipo herdado da sugestão de origem.
  const { data, error } = await c
    .from('gesto')
    .select('data_envio, sugestao:sugestao_id ( tipo, pessoa_id )')
    .not('data_envio', 'is', null);
  if (error) falhar('carregarHistorico', error);

  return (data ?? [])
    .filter((g: any) => g.sugestao?.pessoa_id === pessoaId && g.data_envio)
    .map((g: any) => ({
      tipo: g.sugestao.tipo,
      data: new Date(`${g.data_envio}T00:00:00Z`),
    }));
}

// ───────────────────────── Sugestões ─────────────────────────

/**
 * Gera (e persiste) as sugestões da semana de `hoje` para todas as pessoas do
 * usuário com consentimento concedido. Idempotente: não duplica sugestões já
 * existentes na mesma semana (desduplicadas por pessoa + título).
 */
export async function gerarSugestoesDaSemana(
  c: Cliente,
  usuario: Usuario,
  hoje: Date = new Date(),
): Promise<Sugestao[]> {
  const semanaRef = semanaRefISO(hoje);
  const pessoas = (await listarPessoas(c)).filter(
    (p) => p.statusConsentimento === 'concedido',
  );

  // Já existentes nesta semana (para não duplicar).
  const { data: existentesRaw, error: erroExist } = await c
    .from('sugestao')
    .select('*')
    .eq('semana_ref', semanaRef);
  if (erroExist) falhar('gerarSugestoesDaSemana/existentes', erroExist);
  const existentes = (existentesRaw ?? []).map(paraSugestao);
  const chaveExistente = new Set(
    existentes.map((s) => `${s.pessoaId}|${s.titulo}`),
  );

  const novasLinhas: any[] = [];
  for (const pessoa of pessoas) {
    const [preferencias, datas, ciclos, historico] = await Promise.all([
      listarPreferencias(c, pessoa.id),
      listarDatas(c, pessoa.id),
      listarCiclos(c, pessoa.id),
      carregarHistorico(c, pessoa.id),
    ]);

    const geradas = gerarSugestoes({
      hoje,
      pessoa,
      preferencias,
      datas,
      ciclos,
      historico,
    });

    for (const s of geradas) {
      const chave = `${s.pessoaId}|${s.titulo}`;
      if (chaveExistente.has(chave)) continue;
      chaveExistente.add(chave);
      novasLinhas.push({
        usuario_id: usuario.id,
        pessoa_id: s.pessoaId,
        tipo: s.tipo,
        titulo: s.titulo,
        justificativa: s.justificativa,
        gatilho: s.gatilho,
        semana_ref: s.semanaRef,
        status: 'nova',
      });
    }
  }

  let inseridas: Sugestao[] = [];
  if (novasLinhas.length > 0) {
    const { data, error } = await c.from('sugestao').insert(novasLinhas).select();
    if (error) falhar('gerarSugestoesDaSemana/insert', error);
    inseridas = (data ?? []).map(paraSugestao);
  }

  const todasDaSemana = [...existentes, ...inseridas];
  await registrarLembrete(c, usuario, semanaRef, todasDaSemana.map((s) => s.id));
  return todasDaSemana;
}

export interface SugestaoComPessoa extends Sugestao {
  pessoaApelido: string;
}

export async function listarSugestoesDaSemana(
  c: Cliente,
  hoje: Date = new Date(),
): Promise<SugestaoComPessoa[]> {
  const semanaRef = semanaRefISO(hoje);
  const { data, error } = await c
    .from('sugestao')
    .select('*, pessoa:pessoa_id ( apelido )')
    .eq('semana_ref', semanaRef)
    .neq('status', 'descartada')
    .order('gatilho', { ascending: true });
  if (error) falhar('listarSugestoesDaSemana', error);
  return (data ?? []).map((r: any) => ({
    ...paraSugestao(r),
    pessoaApelido: r.pessoa?.apelido ?? '',
  }));
}

export async function obterSugestao(
  c: Cliente,
  id: string,
): Promise<Sugestao | null> {
  const { data, error } = await c
    .from('sugestao')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) falhar('obterSugestao', error);
  return data ? paraSugestao(data) : null;
}

export async function atualizarStatusSugestao(
  c: Cliente,
  id: string,
  status: Sugestao['status'],
): Promise<void> {
  const { error } = await c.from('sugestao').update({ status }).eq('id', id);
  if (error) falhar('atualizarStatusSugestao', error);
}

// ───────────────────────── Gestos ─────────────────────────

export async function obterGestoPorSugestao(
  c: Cliente,
  sugestaoId: string,
): Promise<Gesto | null> {
  const { data, error } = await c
    .from('gesto')
    .select('*')
    .eq('sugestao_id', sugestaoId)
    .maybeSingle();
  if (error) falhar('obterGestoPorSugestao', error);
  return data
    ? {
        id: data.id,
        sugestaoId: data.sugestao_id,
        elementoPessoal: data.elemento_pessoal,
        dataPlanejada: data.data_planejada
          ? new Date(`${data.data_planejada}T00:00:00Z`)
          : undefined,
        dataEnvio: data.data_envio
          ? new Date(`${data.data_envio}T00:00:00Z`)
          : undefined,
        status: data.status,
      }
    : null;
}

/**
 * Salva o elemento pessoal de um gesto e, se solicitado, marca como "pronto".
 * A regra de personalização obrigatória é validada antes de permitir "pronto".
 */
export async function salvarGesto(
  c: Cliente,
  sugestaoId: string,
  elementoPessoal: string,
  marcarPronto: boolean,
  dataPlanejada?: string,
): Promise<void> {
  const status = marcarPronto ? 'pronto' : 'planejado';
  const { error } = await c
    .from('gesto')
    .upsert(
      {
        sugestao_id: sugestaoId,
        elemento_pessoal: elementoPessoal,
        status,
        data_planejada: dataPlanejada ?? null,
      },
      { onConflict: 'sugestao_id' },
    );
  if (error) falhar('salvarGesto', error);

  // Reflete no status da sugestão.
  await atualizarStatusSugestao(c, sugestaoId, marcarPronto ? 'pronta' : 'em_preparo');
}

// ───────────────────────── Lembretes ─────────────────────────

async function registrarLembrete(
  c: Cliente,
  usuario: Usuario,
  semanaRef: string,
  sugestaoIds: string[],
): Promise<void> {
  const { error } = await c.from('lembrete').upsert(
    {
      usuario_id: usuario.id,
      semana_ref: semanaRef,
      canal: usuario.canalPreferido,
      status: 'agendado',
      sugestao_ids: sugestaoIds,
    },
    { onConflict: 'usuario_id,semana_ref' },
  );
  if (error) falhar('registrarLembrete', error);
}

export async function obterLembreteDaSemana(
  c: Cliente,
  hoje: Date = new Date(),
): Promise<Lembrete | null> {
  const semanaRef = semanaRefISO(hoje);
  const { data, error } = await c
    .from('lembrete')
    .select('*')
    .eq('semana_ref', semanaRef)
    .maybeSingle();
  if (error) falhar('obterLembreteDaSemana', error);
  return data ? paraLembrete(data) : null;
}
