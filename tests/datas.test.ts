import { describe, expect, it } from 'vitest';
import {
  diasEntre,
  proximaOcorrenciaAnual,
  semanaRefISO,
  somarDias,
} from '../src/lib/sugestoes/datas';

const d = (iso: string) => new Date(`${iso}T00:00:00Z`);

describe('diasEntre', () => {
  it('conta dias inteiros ignorando horas', () => {
    expect(diasEntre(d('2026-01-01'), d('2026-01-11'))).toBe(10);
  });

  it('pode ser negativo', () => {
    expect(diasEntre(d('2026-01-11'), d('2026-01-01'))).toBe(-10);
  });

  it('ignora a parte de horário', () => {
    const a = new Date('2026-01-01T23:00:00Z');
    const b = new Date('2026-01-02T01:00:00Z');
    expect(diasEntre(a, b)).toBe(1);
  });
});

describe('somarDias', () => {
  it('soma e atravessa a virada de mês', () => {
    expect(somarDias(d('2026-01-30'), 3)).toEqual(d('2026-02-02'));
  });
});

describe('proximaOcorrenciaAnual', () => {
  it('retorna a data ainda neste ano quando futura', () => {
    expect(proximaOcorrenciaAnual(d('1990-12-25'), d('2026-11-18'))).toEqual(
      d('2026-12-25'),
    );
  });

  it('pula para o ano seguinte quando já passou', () => {
    expect(proximaOcorrenciaAnual(d('1990-03-10'), d('2026-11-18'))).toEqual(
      d('2027-03-10'),
    );
  });

  it('inclui o próprio dia de hoje', () => {
    expect(proximaOcorrenciaAnual(d('1990-11-18'), d('2026-11-18'))).toEqual(
      d('2026-11-18'),
    );
  });

  it('trata 29/02 em ano não bissexto caindo em 28/02', () => {
    expect(proximaOcorrenciaAnual(d('2000-02-29'), d('2027-01-01'))).toEqual(
      d('2027-02-28'),
    );
  });
});

describe('semanaRefISO', () => {
  it('retorna a segunda-feira da semana', () => {
    // 2026-11-18 é uma quarta-feira → segunda = 2026-11-16
    expect(semanaRefISO(d('2026-11-18'))).toBe('2026-11-16');
  });

  it('para domingo retorna a segunda anterior', () => {
    // 2026-11-22 é domingo → segunda = 2026-11-16
    expect(semanaRefISO(d('2026-11-22'))).toBe('2026-11-16');
  });

  it('para segunda retorna o próprio dia', () => {
    expect(semanaRefISO(d('2026-11-16'))).toBe('2026-11-16');
  });
});
