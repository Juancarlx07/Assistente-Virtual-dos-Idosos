/**
 * Modelo de domínio do produto de "gestos de carinho".
 *
 * Princípios refletidos aqui:
 * - Carinho genuíno: o sistema apenas SUGERE; o usuário decide e personaliza.
 * - Consentimento explícito: dados de outra pessoa só existem com consentimento,
 *   que pode ser visto, editado e revogado por ela.
 * - Sem vigilância: nada de localização, redes sociais ou conversas. Só o que a
 *   própria pessoa querida preenche.
 */

/** Canal preferido para receber os lembretes semanais. */
export type CanalLembrete = 'email' | 'push';

/** Quem usa o produto para demonstrar carinho. */
export interface Usuario {
  id: string;
  nome: string;
  email: string;
  canalPreferido: CanalLembrete;
  /** Dia da semana em que o lembrete é gerado (0 = domingo ... 6 = sábado). */
  diaDoLembrete: number;
  criadoEm: Date;
}

/** Tipo de relação com a pessoa querida (escopo amplo: amor, família, amizade). */
export type TipoRelacao =
  | 'parceiro'
  | 'familia'
  | 'amizade'
  | 'outro';

export type StatusConsentimento = 'pendente' | 'concedido' | 'revogado';

/**
 * A pessoa para quem o carinho é direcionado.
 * Guardamos o mínimo: um apelido e o tipo de relação. Nada sensível sem consentimento.
 */
export interface PessoaQuerida {
  id: string;
  usuarioId: string;
  apelido: string;
  tipoRelacao: TipoRelacao;
  statusConsentimento: StatusConsentimento;
  criadoEm: Date;
}

/**
 * Registro de consentimento, separado para auditoria e transparência.
 * É este registro que garante o direito de ver, editar e revogar.
 */
export interface Consentimento {
  id: string;
  pessoaId: string;
  status: StatusConsentimento;
  /** O que a pessoa autorizou a ser lembrado (texto legível por ela). */
  escopo: string;
  /** Token do portal self-service onde a pessoa gerencia os próprios dados. */
  tokenPortal: string;
  dataConcessao?: Date;
  dataRevogacao?: Date;
}

/** Como uma preferência deve influenciar as sugestões. */
export type TipoPreferencia = 'gosta' | 'evitar' | 'alergia';

/**
 * Preferência preenchida PELA PRÓPRIA pessoa querida (nunca inferida).
 * Ex.: categoria "flores" / valor "girassol" / tipo "gosta".
 *      categoria "alimento" / valor "amendoim" / tipo "alergia".
 */
export interface Preferencia {
  id: string;
  pessoaId: string;
  categoria: string;
  valor: string;
  tipo: TipoPreferencia;
}

export type RecorrenciaData = 'anual' | 'unica';

/** Data importante (aniversário, data especial etc.). */
export interface DataImportante {
  id: string;
  pessoaId: string;
  tipo: string;
  /** Data de referência. Para recorrência "anual", só mês/dia importam. */
  data: Date;
  recorrencia: RecorrenciaData;
  descricao?: string;
}

/**
 * Ciclo de consumo: um produto que acaba periodicamente e cuja reposição
 * pode ser uma boa oportunidade de gesto útil.
 */
export interface CicloDeConsumo {
  id: string;
  pessoaId: string;
  produto: string;
  ultimaReposicao: Date;
  /** Intervalo típico de reposição, em dias. */
  intervaloDias: number;
}

export type TipoGesto = 'carta' | 'flor' | 'presente' | 'experiencia';

/** O gatilho que originou a sugestão (usado na justificativa e nos testes). */
export type GatilhoSugestao = 'data' | 'ciclo' | 'constancia';

export type StatusSugestao =
  | 'nova'
  | 'vista'
  | 'descartada'
  | 'em_preparo'
  | 'pronta';

/**
 * Sugestão gerada pelo sistema. Sempre acompanha uma justificativa curta
 * ("por que isto foi sugerido") para manter a transparência.
 */
export interface Sugestao {
  id: string;
  usuarioId: string;
  pessoaId: string;
  tipo: TipoGesto;
  titulo: string;
  justificativa: string;
  gatilho: GatilhoSugestao;
  /** Segunda-feira (ISO) da semana de referência, em formato YYYY-MM-DD. */
  semanaRef: string;
  status: StatusSugestao;
  criadoEm: Date;
}

export type StatusGesto = 'planejado' | 'pronto' | 'enviado';

/**
 * Gesto: nasce de uma sugestão aceita. Só pode virar "pronto" depois que a
 * pessoa adiciona um elemento pessoal (regra de personalização obrigatória).
 */
export interface Gesto {
  id: string;
  sugestaoId: string;
  /** Texto escrito ou escolhido pelo usuário. Obrigatório para ficar "pronto". */
  elementoPessoal: string;
  dataPlanejada?: Date;
  dataEnvio?: Date;
  status: StatusGesto;
}

export type StatusLembrete = 'agendado' | 'enviado';

/**
 * Lembrete semanal com até três sugestões.
 * Na fase de validação, o envio é manual (status fica "agendado" e um humano dispara).
 */
export interface Lembrete {
  id: string;
  usuarioId: string;
  semanaRef: string;
  canal: CanalLembrete;
  status: StatusLembrete;
  sugestaoIds: string[];
}
