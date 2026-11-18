/**
 * Conversão entre as linhas do banco (snake_case) e as entidades de domínio
 * (camelCase). Mantém o resto do código desacoplado do formato do Supabase.
 */

import type {
  CicloDeConsumo,
  Consentimento,
  DataImportante,
  Gesto,
  Lembrete,
  PessoaQuerida,
  Preferencia,
  Sugestao,
  Usuario,
} from '../dominio/tipos';

// Uma coluna `date` do Postgres chega como 'YYYY-MM-DD'; interpretamos em UTC.
const dataDe = (s: string): Date => new Date(`${s}T00:00:00Z`);
const tsDe = (s: string): Date => new Date(s);

export const paraUsuario = (r: any): Usuario => ({
  id: r.id,
  nome: r.nome,
  email: r.email,
  canalPreferido: r.canal_preferido,
  diaDoLembrete: r.dia_do_lembrete,
  criadoEm: tsDe(r.criado_em),
});

export const paraPessoa = (r: any): PessoaQuerida => ({
  id: r.id,
  usuarioId: r.usuario_id,
  apelido: r.apelido,
  tipoRelacao: r.tipo_relacao,
  statusConsentimento: r.status_consentimento,
  criadoEm: tsDe(r.criado_em),
});

export const paraConsentimento = (r: any): Consentimento => ({
  id: r.id,
  pessoaId: r.pessoa_id,
  status: r.status,
  escopo: r.escopo,
  tokenPortal: r.token_portal,
  dataConcessao: r.data_concessao ? tsDe(r.data_concessao) : undefined,
  dataRevogacao: r.data_revogacao ? tsDe(r.data_revogacao) : undefined,
});

export const paraPreferencia = (r: any): Preferencia => ({
  id: r.id,
  pessoaId: r.pessoa_id,
  categoria: r.categoria,
  valor: r.valor,
  tipo: r.tipo,
});

export const paraDataImportante = (r: any): DataImportante => ({
  id: r.id,
  pessoaId: r.pessoa_id,
  tipo: r.tipo,
  data: dataDe(r.data),
  recorrencia: r.recorrencia,
  descricao: r.descricao ?? undefined,
});

export const paraCiclo = (r: any): CicloDeConsumo => ({
  id: r.id,
  pessoaId: r.pessoa_id,
  produto: r.produto,
  ultimaReposicao: dataDe(r.ultima_reposicao),
  intervaloDias: r.intervalo_dias,
});

export const paraSugestao = (r: any): Sugestao => ({
  id: r.id,
  usuarioId: r.usuario_id,
  pessoaId: r.pessoa_id,
  tipo: r.tipo,
  titulo: r.titulo,
  justificativa: r.justificativa,
  gatilho: r.gatilho,
  semanaRef: r.semana_ref,
  status: r.status,
  criadoEm: tsDe(r.criado_em),
});

export const paraGesto = (r: any): Gesto => ({
  id: r.id,
  sugestaoId: r.sugestao_id,
  elementoPessoal: r.elemento_pessoal,
  dataPlanejada: r.data_planejada ? dataDe(r.data_planejada) : undefined,
  dataEnvio: r.data_envio ? dataDe(r.data_envio) : undefined,
  status: r.status,
});

export const paraLembrete = (r: any): Lembrete => ({
  id: r.id,
  usuarioId: r.usuario_id,
  semanaRef: r.semana_ref,
  canal: r.canal,
  status: r.status,
  sugestaoIds: r.sugestao_ids ?? [],
});
