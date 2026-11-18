/**
 * Regras de domínio do Gesto, com foco na personalização obrigatória:
 * um gesto só pode ser marcado como "pronto" depois que a pessoa adiciona
 * pelo menos um elemento próprio (uma frase, uma lembrança).
 */

import type { Gesto } from './tipos';

/** Tamanho mínimo, após aparar espaços, para considerar um texto como pessoal. */
export const MIN_ELEMENTO_PESSOAL = 3;

export function temElementoPessoal(gesto: Pick<Gesto, 'elementoPessoal'>): boolean {
  return gesto.elementoPessoal.trim().length >= MIN_ELEMENTO_PESSOAL;
}

export class PersonalizacaoObrigatoriaError extends Error {
  constructor() {
    super(
      'Adicione algo seu (uma frase, uma lembrança) antes de marcar o gesto como pronto.',
    );
    this.name = 'PersonalizacaoObrigatoriaError';
  }
}

/**
 * Marca o gesto como "pronto". Lança se não houver elemento pessoal.
 * Retorna um NOVO gesto (imutável), sem alterar o original.
 */
export function marcarComoPronto(gesto: Gesto): Gesto {
  if (!temElementoPessoal(gesto)) {
    throw new PersonalizacaoObrigatoriaError();
  }
  return { ...gesto, status: 'pronto' };
}
