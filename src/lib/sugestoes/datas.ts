/** Utilitários de data, puros e sem fuso: operam sobre ano/mês/dia em UTC. */

/** Normaliza para meia-noite UTC, descartando a hora. */
export function soData(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Diferença em dias inteiros (b - a), ignorando horas. Pode ser negativa. */
export function diasEntre(a: Date, b: Date): number {
  const ms = soData(b).getTime() - soData(a).getTime();
  return Math.round(ms / 86_400_000);
}

/** Soma `dias` a uma data (em UTC). */
export function somarDias(d: Date, dias: number): Date {
  const base = soData(d);
  base.setUTCDate(base.getUTCDate() + dias);
  return base;
}

/**
 * Próxima ocorrência de uma data anual (mesmo mês/dia) a partir de `hoje`,
 * inclusive hoje. Para 29/02 em ano não bissexto, cai em 28/02.
 */
export function proximaOcorrenciaAnual(evento: Date, hoje: Date): Date {
  const h = soData(hoje);
  const mes = evento.getUTCMonth();
  const dia = evento.getUTCDate();

  for (let ano = h.getUTCFullYear(); ano <= h.getUTCFullYear() + 1; ano++) {
    let candidato = new Date(Date.UTC(ano, mes, dia));
    // Ajuste de 29/02 em ano não bissexto (JS rola para 01/03).
    if (candidato.getUTCMonth() !== mes) {
      candidato = new Date(Date.UTC(ano, mes + 1, 0)); // último dia do mês
    }
    if (diasEntre(h, candidato) >= 0) return candidato;
  }
  // Teórico: não deve ocorrer.
  return new Date(Date.UTC(h.getUTCFullYear() + 1, mes, dia));
}

/** Segunda-feira da semana de `d`, em formato YYYY-MM-DD (UTC). */
export function semanaRefISO(d: Date): string {
  const base = soData(d);
  const diaSemana = base.getUTCDay(); // 0 domingo ... 6 sábado
  const recuo = (diaSemana + 6) % 7; // dias desde a segunda
  const segunda = somarDias(base, -recuo);
  return segunda.toISOString().slice(0, 10);
}
