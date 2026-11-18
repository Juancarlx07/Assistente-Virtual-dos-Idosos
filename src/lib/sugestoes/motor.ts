/**
 * Motor de sugestões — lógica pura e determinística.
 *
 * Dado um instante de referência, a pessoa querida, suas preferências,
 * datas importantes, ciclos de consumo e o histórico de gestos, gera até
 * três sugestões para a semana, cada uma com uma justificativa curta.
 *
 * Regras (em ordem de prioridade):
 *   1. DATA       — data importante dentro da janela → sugestão temática.
 *   2. CICLO      — produto prestes a acabar → gesto útil.
 *   3. CONSTÂNCIA — faz tempo desde o último gesto → gesto leve "sem data".
 *
 * Em todos os casos: respeita o consentimento, filtra o que a pessoa marcou
 * como "evitar"/"alergia", e evita repetir o tipo de gesto usado há pouco.
 */

import type {
  CicloDeConsumo,
  DataImportante,
  GatilhoSugestao,
  PessoaQuerida,
  Preferencia,
  TipoGesto,
} from '../dominio/tipos';
import {
  diasEntre,
  proximaOcorrenciaAnual,
  semanaRefISO,
  somarDias,
} from './datas';

/** Parâmetros ajustáveis do motor. */
export interface ConfigMotor {
  /** Antecedência, em dias, para avisar de uma data importante. */
  janelaDataDias: number;
  /** Antecedência, em dias, para avisar de um ciclo de consumo. */
  janelaCicloDias: number;
  /** Dias sem nenhum gesto a partir dos quais sugerimos constância. */
  diasConstancia: number;
  /** Quantidade máxima de sugestões por semana. */
  maxSugestoes: number;
  /** Quantos tipos recentes consideramos para evitar repetição. */
  janelaVariedade: number;
}

export const CONFIG_PADRAO: ConfigMotor = {
  janelaDataDias: 14,
  janelaCicloDias: 7,
  diasConstancia: 21,
  maxSugestoes: 3,
  janelaVariedade: 3,
};

/** Um item do histórico de gestos já realizados (ou planejados). */
export interface GestoHistorico {
  tipo: TipoGesto;
  data: Date;
}

export interface EntradaSugestoes {
  hoje: Date;
  pessoa: PessoaQuerida;
  preferencias: Preferencia[];
  datas: DataImportante[];
  ciclos: CicloDeConsumo[];
  /** Histórico de gestos, do mais antigo ao mais recente (ordem não exigida). */
  historico: GestoHistorico[];
}

/**
 * Sugestão pronta para ser persistida. O id, o status e o criadoEm são
 * atribuídos pela camada de persistência, não pelo motor.
 */
export interface SugestaoGerada {
  usuarioId: string;
  pessoaId: string;
  tipo: TipoGesto;
  titulo: string;
  justificativa: string;
  gatilho: GatilhoSugestao;
  semanaRef: string;
}

/** Candidato interno antes da filtragem/ordenação. */
interface Candidato extends SugestaoGerada {
  prioridade: number; // 1 = mais importante
  urgencia: number; // menor = mais urgente (desempate)
  tags: string[]; // palavras-chave para casar com preferências
}

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

const TAGS_POR_TIPO: Record<TipoGesto, string[]> = {
  carta: ['carta', 'mensagem', 'bilhete'],
  flor: ['flor', 'flores', 'buque'],
  presente: ['presente', 'mimo'],
  experiencia: ['experiencia', 'passeio', 'programa'],
};

/** Conjunto de palavras bloqueadas por preferências "evitar"/"alergia". */
function palavrasBloqueadas(preferencias: Preferencia[]): Set<string> {
  const bloqueadas = new Set<string>();
  for (const p of preferencias) {
    if (p.tipo === 'evitar' || p.tipo === 'alergia') {
      bloqueadas.add(normalizar(p.valor));
      bloqueadas.add(normalizar(p.categoria));
    }
  }
  return bloqueadas;
}

/** A pessoa "gosta" de flores? Usado para escolher o tipo de um gesto leve. */
function gostaDeFlores(preferencias: Preferencia[]): boolean {
  return preferencias.some(
    (p) =>
      p.tipo === 'gosta' &&
      (normalizar(p.categoria).includes('flor') ||
        normalizar(p.valor).includes('flor')),
  );
}

function candidatosDeDatas(
  e: EntradaSugestoes,
  cfg: ConfigMotor,
  semanaRef: string,
): Candidato[] {
  const out: Candidato[] = [];
  for (const d of e.datas) {
    const proxima =
      d.recorrencia === 'anual'
        ? proximaOcorrenciaAnual(d.data, e.hoje)
        : d.data;
    const dias = diasEntre(e.hoje, proxima);
    if (dias < 0 || dias > cfg.janelaDataDias) continue;

    const quando =
      dias === 0 ? 'hoje' : dias === 1 ? 'amanhã' : `em ${dias} dias`;
    out.push({
      usuarioId: e.pessoa.usuarioId,
      pessoaId: e.pessoa.id,
      tipo: 'presente',
      titulo: `Marcar ${d.tipo} de ${e.pessoa.apelido}`,
      justificativa: `${capitalizar(d.tipo)} de ${e.pessoa.apelido} ${quando}.`,
      gatilho: 'data',
      semanaRef,
      prioridade: 1,
      urgencia: dias,
      tags: [...TAGS_POR_TIPO.presente, ...TAGS_POR_TIPO.experiencia],
    });
  }
  return out;
}

function candidatosDeCiclos(
  e: EntradaSugestoes,
  cfg: ConfigMotor,
  semanaRef: string,
): Candidato[] {
  const out: Candidato[] = [];
  for (const c of e.ciclos) {
    const proximaReposicao = somarDias(c.ultimaReposicao, c.intervaloDias);
    const dias = diasEntre(e.hoje, proximaReposicao);
    // Avisa quando falta pouco, e também se já passou (produto acabou).
    if (dias > cfg.janelaCicloDias) continue;

    const quando =
      dias < 0
        ? 'já deve ter acabado'
        : dias === 0
          ? 'deve acabar hoje'
          : `deve acabar em ${dias} dias`;
    out.push({
      usuarioId: e.pessoa.usuarioId,
      pessoaId: e.pessoa.id,
      tipo: 'presente',
      titulo: `Repor ${c.produto} para ${e.pessoa.apelido}`,
      justificativa: `${capitalizar(c.produto)} ${quando}.`,
      gatilho: 'ciclo',
      semanaRef,
      prioridade: 2,
      urgencia: Math.max(dias, 0),
      tags: [...TAGS_POR_TIPO.presente, normalizar(c.produto)],
    });
  }
  return out;
}

function candidatoConstancia(
  e: EntradaSugestoes,
  cfg: ConfigMotor,
  semanaRef: string,
): Candidato | null {
  const ultima = e.historico.reduce<Date | null>((acc, g) => {
    if (!acc || g.data > acc) return g.data;
    return acc;
  }, null);

  const diasDesde = ultima === null ? Infinity : diasEntre(ultima, e.hoje);
  if (diasDesde < cfg.diasConstancia) return null;

  const tipo: TipoGesto = gostaDeFlores(e.preferencias) ? 'flor' : 'carta';
  const justificativa =
    ultima === null
      ? `Um gesto simples para ${e.pessoa.apelido} — sem motivo além do carinho.`
      : `Já faz ${diasDesde} dias desde seu último gesto para ${e.pessoa.apelido}.`;

  return {
    usuarioId: e.pessoa.usuarioId,
    pessoaId: e.pessoa.id,
    tipo,
    titulo:
      tipo === 'flor'
        ? `Uma flor para ${e.pessoa.apelido}`
        : `Escrever algo para ${e.pessoa.apelido}`,
    justificativa,
    gatilho: 'constancia',
    semanaRef,
    prioridade: 3,
    urgencia: 0,
    tags: TAGS_POR_TIPO[tipo],
  };
}

function capitalizar(s: string): string {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}

/**
 * Gera até `cfg.maxSugestoes` sugestões para a semana de `entrada.hoje`.
 * Função pura: mesma entrada → mesma saída.
 */
export function gerarSugestoes(
  entrada: EntradaSugestoes,
  cfg: ConfigMotor = CONFIG_PADRAO,
): SugestaoGerada[] {
  // Princípio de consentimento: sem consentimento concedido, nada é gerado.
  if (entrada.pessoa.statusConsentimento !== 'concedido') return [];

  const semanaRef = semanaRefISO(entrada.hoje);

  let candidatos: Candidato[] = [
    ...candidatosDeDatas(entrada, cfg, semanaRef),
    ...candidatosDeCiclos(entrada, cfg, semanaRef),
  ];
  const constancia = candidatoConstancia(entrada, cfg, semanaRef);
  if (constancia) candidatos.push(constancia);

  // Filtra o que a pessoa pediu para evitar (inclui alergias).
  const bloqueadas = palavrasBloqueadas(entrada.preferencias);
  candidatos = candidatos.filter((c) => {
    const alvos = [normalizar(c.tipo), ...c.tags.map(normalizar)];
    return !alvos.some((t) => bloqueadas.has(t));
  });

  // Ordena por prioridade e urgência.
  candidatos.sort((a, b) =>
    a.prioridade !== b.prioridade
      ? a.prioridade - b.prioridade
      : a.urgencia - b.urgencia,
  );

  // Tipos usados recentemente, para evitar repetição.
  const recentes = [...entrada.historico]
    .sort((a, b) => b.data.getTime() - a.data.getTime())
    .slice(0, cfg.janelaVariedade)
    .map((g) => g.tipo);

  // Seleção gulosa: evita repetir tipo dentro da semana e tipos recentes,
  // mas sem descartar algo importante só por causa da variedade.
  const escolhidas: Candidato[] = [];
  const tiposEscolhidos = new Set<TipoGesto>();

  const prefereNovo = (c: Candidato) =>
    !tiposEscolhidos.has(c.tipo) && !recentes.includes(c.tipo);

  for (const c of candidatos) {
    if (escolhidas.length >= cfg.maxSugestoes) break;
    if (prefereNovo(c)) {
      escolhidas.push(c);
      tiposEscolhidos.add(c.tipo);
    }
  }
  // Completa as vagas restantes com os demais candidatos, por prioridade,
  // mesmo que repitam um tipo: é melhor sugerir algo relevante do que deixar
  // a vaga vazia por causa da variedade.
  for (const c of candidatos) {
    if (escolhidas.length >= cfg.maxSugestoes) break;
    if (!escolhidas.includes(c)) escolhidas.push(c);
  }

  // Apresenta o resultado final em ordem de prioridade/urgência.
  escolhidas.sort((a, b) =>
    a.prioridade !== b.prioridade
      ? a.prioridade - b.prioridade
      : a.urgencia - b.urgencia,
  );

  return escolhidas.map(
    ({ prioridade: _p, urgencia: _u, tags: _t, ...s }) => s,
  );
}
