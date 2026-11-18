import { describe, expect, it } from 'vitest';
import type {
  CicloDeConsumo,
  DataImportante,
  PessoaQuerida,
  Preferencia,
} from '../src/lib/dominio/tipos';
import {
  CONFIG_PADRAO,
  gerarSugestoes,
  type EntradaSugestoes,
  type GestoHistorico,
} from '../src/lib/sugestoes/motor';

const d = (iso: string) => new Date(`${iso}T00:00:00Z`);
const HOJE = d('2026-11-18'); // quarta-feira

function pessoa(over: Partial<PessoaQuerida> = {}): PessoaQuerida {
  return {
    id: 'p1',
    usuarioId: 'u1',
    apelido: 'Ana',
    tipoRelacao: 'parceiro',
    statusConsentimento: 'concedido',
    criadoEm: d('2026-01-01'),
    ...over,
  };
}

function entrada(over: Partial<EntradaSugestoes> = {}): EntradaSugestoes {
  return {
    hoje: HOJE,
    pessoa: pessoa(),
    preferencias: [],
    datas: [],
    ciclos: [],
    historico: [],
    ...over,
  };
}

const aniversario: DataImportante = {
  id: 'dt1',
  pessoaId: 'p1',
  tipo: 'aniversário',
  data: d('1990-11-25'),
  recorrencia: 'anual',
};

const cicloCafe: CicloDeConsumo = {
  id: 'c1',
  pessoaId: 'p1',
  produto: 'café',
  ultimaReposicao: d('2026-11-01'),
  intervaloDias: 20, // próxima reposição 2026-11-21 → 3 dias
};

// Histórico com um gesto recente: silencia o gatilho de constância,
// permitindo isolar os gatilhos de data e de ciclo nos testes.
const historicoRecente: GestoHistorico[] = [
  { tipo: 'carta', data: d('2026-11-15') },
];

describe('gerarSugestoes — consentimento', () => {
  it('não gera nada sem consentimento concedido', () => {
    const r = gerarSugestoes(
      entrada({
        pessoa: pessoa({ statusConsentimento: 'pendente' }),
        datas: [aniversario],
      }),
    );
    expect(r).toEqual([]);
  });

  it('também não gera nada quando o consentimento foi revogado', () => {
    const r = gerarSugestoes(
      entrada({
        pessoa: pessoa({ statusConsentimento: 'revogado' }),
        datas: [aniversario],
      }),
    );
    expect(r).toEqual([]);
  });
});

describe('gerarSugestoes — gatilho de data', () => {
  it('sugere quando a data está dentro da janela e informa os dias', () => {
    const r = gerarSugestoes(
      entrada({ datas: [aniversario], historico: historicoRecente }),
    );
    expect(r).toHaveLength(1);
    expect(r[0].gatilho).toBe('data');
    expect(r[0].justificativa).toContain('em 7 dias');
    expect(r[0].semanaRef).toBe('2026-11-16');
  });

  it('ignora datas fora da janela', () => {
    const r = gerarSugestoes(
      entrada({
        datas: [{ ...aniversario, data: d('1990-06-01') }],
        historico: historicoRecente,
      }),
    );
    expect(r).toHaveLength(0);
  });
});

describe('gerarSugestoes — gatilho de ciclo', () => {
  it('sugere repor um produto prestes a acabar', () => {
    const r = gerarSugestoes(
      entrada({ ciclos: [cicloCafe], historico: historicoRecente }),
    );
    expect(r).toHaveLength(1);
    expect(r[0].gatilho).toBe('ciclo');
    expect(r[0].justificativa).toContain('3 dias');
  });
});

describe('gerarSugestoes — gatilho de constância', () => {
  it('sugere um gesto leve quando faz tempo (ou nunca houve)', () => {
    const r = gerarSugestoes(entrada());
    expect(r).toHaveLength(1);
    expect(r[0].gatilho).toBe('constancia');
    expect(r[0].tipo).toBe('carta'); // padrão sem preferência de flores
  });

  it('não sugere constância se houve gesto recente', () => {
    const historico: GestoHistorico[] = [
      { tipo: 'carta', data: d('2026-11-10') }, // 8 dias < 21
    ];
    const r = gerarSugestoes(entrada({ historico }));
    expect(r).toHaveLength(0);
  });

  it('vira "flor" quando a pessoa gosta de flores', () => {
    const preferencias: Preferencia[] = [
      { id: 'pr1', pessoaId: 'p1', categoria: 'flores', valor: 'girassol', tipo: 'gosta' },
    ];
    const r = gerarSugestoes(entrada({ preferencias }));
    expect(r[0].tipo).toBe('flor');
  });
});

describe('gerarSugestoes — filtros de preferência', () => {
  it('bloqueia sugestão que casa com uma alergia', () => {
    const preferencias: Preferencia[] = [
      { id: 'pr1', pessoaId: 'p1', categoria: 'alimento', valor: 'café', tipo: 'alergia' },
    ];
    const r = gerarSugestoes(entrada({ ciclos: [cicloCafe], preferencias }));
    // O único candidato (repor café) é bloqueado pela alergia.
    expect(r.some((s) => s.gatilho === 'ciclo')).toBe(false);
  });

  it('bloqueia flor quando a pessoa pede para evitar flores', () => {
    const preferencias: Preferencia[] = [
      { id: 'pr1', pessoaId: 'p1', categoria: 'flores', valor: 'flores', tipo: 'evitar' },
      { id: 'pr2', pessoaId: 'p1', categoria: 'flores', valor: 'rosa', tipo: 'gosta' },
    ];
    // A preferência "gosta de flores" tornaria a constância uma flor,
    // mas "evitar flores" deve bloquear.
    const r = gerarSugestoes(entrada({ preferencias }));
    expect(r.some((s) => s.tipo === 'flor')).toBe(false);
  });
});

describe('gerarSugestoes — limite, variedade e determinismo', () => {
  it('respeita o máximo de sugestões por semana', () => {
    const datas: DataImportante[] = [
      aniversario,
      { ...aniversario, id: 'dt2', tipo: 'aniversário de namoro', data: d('2000-11-20') },
      { ...aniversario, id: 'dt3', tipo: 'formatura', data: d('2010-11-22') },
      { ...aniversario, id: 'dt4', tipo: 'dia especial', data: d('2015-11-24') },
    ];
    const r = gerarSugestoes(entrada({ datas, ciclos: [cicloCafe] }));
    expect(r.length).toBeLessThanOrEqual(CONFIG_PADRAO.maxSugestoes);
  });

  it('combina os três gatilhos e ordena por prioridade', () => {
    const historico: GestoHistorico[] = [
      { tipo: 'experiencia', data: d('2026-09-01') }, // antigo → dispara constância
    ];
    const r = gerarSugestoes(
      entrada({ datas: [aniversario], ciclos: [cicloCafe], historico }),
    );
    expect(r).toHaveLength(3);
    expect(r.map((s) => s.gatilho)).toEqual(['data', 'ciclo', 'constancia']);
  });

  it('é determinística: mesma entrada, mesma saída', () => {
    const e = entrada({ datas: [aniversario], ciclos: [cicloCafe] });
    expect(gerarSugestoes(e)).toEqual(gerarSugestoes(e));
  });
});
