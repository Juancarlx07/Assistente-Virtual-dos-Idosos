import Link from 'next/link';
import { criarClienteServidor } from '@/src/lib/supabase/server';
import {
  listarPessoas,
  listarSugestoesDaSemana,
  obterLembreteDaSemana,
} from '@/src/lib/persistencia/repositorios';
import { semanaRefISO } from '@/src/lib/sugestoes/datas';
import {
  criarPessoaAction,
  descartarSugestaoAction,
  gerarSugestoesAction,
} from './acoes';
import type { GatilhoSugestao } from '@/src/lib/dominio/tipos';

export const dynamic = 'force-dynamic';

const ROTULO_GATILHO: Record<GatilhoSugestao, string> = {
  data: 'Data importante',
  ciclo: 'Ciclo de consumo',
  constancia: 'Constância',
};

const ROTULO_RELACAO: Record<string, string> = {
  parceiro: 'Parceiro(a)',
  familia: 'Família',
  amizade: 'Amizade',
  outro: 'Outro',
};

function badgeConsentimento(status: string) {
  if (status === 'concedido') return <span className="badge ok">consentido</span>;
  if (status === 'revogado') return <span className="badge rev">revogado</span>;
  return <span className="badge pend">pendente</span>;
}

export default async function PainelPage() {
  const supabase = await criarClienteServidor();
  const [pessoas, sugestoes, lembrete] = await Promise.all([
    listarPessoas(supabase),
    listarSugestoesDaSemana(supabase),
    obterLembreteDaSemana(supabase),
  ]);

  const temConsentida = pessoas.some((p) => p.statusConsentimento === 'concedido');
  const semana = semanaRefISO(new Date());

  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <h1 style={{ marginBottom: 4 }}>Sua semana</h1>
        <span className="small muted">semana de {semana}</span>
      </div>

      <div className="card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <strong>Sugestões da semana</strong>
            <div className="small muted">
              {lembrete
                ? `Lembrete ${lembrete.status === 'enviado' ? 'enviado' : 'agendado'} • ${lembrete.sugestaoIds.length} sugestão(ões)`
                : 'Nenhum lembrete gerado ainda esta semana.'}
            </div>
          </div>
          <form action={gerarSugestoesAction}>
            <button className="btn" type="submit" disabled={!temConsentida}>
              {sugestoes.length > 0 ? 'Atualizar sugestões' : 'Gerar sugestões'}
            </button>
          </form>
        </div>

        {!temConsentida && (
          <div className="aviso" style={{ marginTop: 14 }}>
            As sugestões só são geradas para pessoas que <strong>deram
            consentimento</strong>. Cadastre uma pessoa e envie o link do portal.
          </div>
        )}

        {sugestoes.length > 0 && (
          <div className="grid-gatilho" style={{ marginTop: 16 }}>
            {sugestoes.map((s) => (
              <div
                key={s.id}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: 14,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <div>
                    <span className="badge">{ROTULO_GATILHO[s.gatilho]}</span>{' '}
                    <span className="badge">{s.tipo}</span>
                    <h3 style={{ margin: '8px 0 2px' }}>{s.titulo}</h3>
                    <p className="justificativa" style={{ margin: 0 }}>
                      {s.justificativa}
                    </p>
                    <p className="small muted" style={{ margin: '4px 0 0' }}>
                      para {s.pessoaApelido}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <Link
                    className="btn pequeno"
                    href={`/painel/preparar/${s.id}`}
                  >
                    {s.status === 'pronta' ? 'Ver gesto' : 'Preparar'}
                  </Link>
                  {s.status !== 'pronta' && (
                    <form action={descartarSugestaoAction}>
                      <input type="hidden" name="sugestaoId" value={s.id} />
                      <button className="btn secundario pequeno" type="submit">
                        Descartar
                      </button>
                    </form>
                  )}
                  {s.status === 'pronta' && (
                    <span className="badge ok">pronto</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3>Pessoas queridas</h3>
        {pessoas.length === 0 && (
          <p className="muted">
            Nenhuma pessoa cadastrada ainda. Adicione a primeira abaixo.
          </p>
        )}
        <ul className="lista">
          {pessoas.map((p) => (
            <li key={p.id}>
              <span>
                <Link href={`/painel/pessoas/${p.id}`}>
                  <strong>{p.apelido}</strong>
                </Link>{' '}
                <span className="small muted">
                  {ROTULO_RELACAO[p.tipoRelacao] ?? p.tipoRelacao}
                </span>
              </span>
              {badgeConsentimento(p.statusConsentimento)}
            </li>
          ))}
        </ul>

        <form action={criarPessoaAction} style={{ marginTop: 16 }}>
          <div className="row">
            <div>
              <label htmlFor="apelido">Apelido / nome</label>
              <input id="apelido" name="apelido" type="text" required />
            </div>
            <div>
              <label htmlFor="tipoRelacao">Relação</label>
              <select id="tipoRelacao" name="tipoRelacao" defaultValue="parceiro">
                <option value="parceiro">Parceiro(a)</option>
                <option value="familia">Família</option>
                <option value="amizade">Amizade</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            <div className="acao">
              <label>&nbsp;</label>
              <button className="btn" type="submit">
                Adicionar
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
