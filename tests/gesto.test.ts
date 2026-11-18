import { describe, expect, it } from 'vitest';
import type { Gesto } from '../src/lib/dominio/tipos';
import {
  PersonalizacaoObrigatoriaError,
  marcarComoPronto,
  temElementoPessoal,
} from '../src/lib/dominio/gesto';

function gesto(elementoPessoal: string): Gesto {
  return {
    id: 'g1',
    sugestaoId: 's1',
    elementoPessoal,
    status: 'planejado',
  };
}

describe('personalização obrigatória', () => {
  it('reconhece um elemento pessoal válido', () => {
    expect(temElementoPessoal(gesto('te amo'))).toBe(true);
  });

  it('não aceita texto vazio ou só espaços', () => {
    expect(temElementoPessoal(gesto('   '))).toBe(false);
    expect(temElementoPessoal(gesto(''))).toBe(false);
  });

  it('marca como pronto quando há elemento pessoal', () => {
    const pronto = marcarComoPronto(gesto('lembra daquele dia na praia?'));
    expect(pronto.status).toBe('pronto');
  });

  it('não altera o gesto original (imutável)', () => {
    const original = gesto('uma frase minha');
    marcarComoPronto(original);
    expect(original.status).toBe('planejado');
  });

  it('impede marcar como pronto sem personalização', () => {
    expect(() => marcarComoPronto(gesto(''))).toThrow(
      PersonalizacaoObrigatoriaError,
    );
  });
});
