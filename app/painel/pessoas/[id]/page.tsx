import Link from 'next/link';
import { notFound } from 'next/navigation';
import { criarClienteServidor } from '@/src/lib/supabase/server';
import {
  listarCiclos,
  listarDatas,
  listarPreferencias,
  obterConsentimentoPorPessoa,
  obterPessoa,
} from '@/src/lib/persistencia/repositorios';
import CopiarLink from './CopiarLink';
import {
  adicionarCicloAction,
  adicionarDataAction,
  removerCicloAction,
  removerDataAction,
} from './acoes';

export const dynamic = 'force-dynamic';

const fmt = (d: Date) =>
  d.toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' });

const ROTULO_PREF: Record<string, string> = {
  gosta: 'gosta',
  evitar: 'evitar',
  alergia: 'alergia',
};

export default async function PessoaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await criarClienteServidor();

  const pessoa = await obterPessoa(supabase, id);
  if (!pessoa) notFound();

  const [consentimento, preferencias, datas, ciclos] = await Promise.all([
    obterConsentimentoPorPessoa(supabase, id),
    listarPreferencias(supabase, id),
    listarDatas(supabase, id),
    listarCiclos(supabase, id),
  ]);

  const base = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const linkPortal = consentimento
    ? `${base}/portal/${consentimento.token_portal}`
    : '';

  return (
    <>
      <p className="small">
        <Link href="/painel">← voltar</Link>
      </p>
      <h1 style={{ marginBottom: 2 }}>{pessoa.apelido}</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        Consentimento:{' '}
        <strong>{pessoa.statusConsentimento}</strong>
      </p>

      <div className="card">
        <h3>Portal da pessoa querida</h3>
        <p className="small muted">
          Envie este link para {pessoa.apelido}. É por ele que a pessoa{' '}
          <strong>dá o consentimento</strong>, preenche as próprias preferências
          e pode, a qualquer momento, ver, editar ou apagar tudo. Nada é usado
          sem essa permissão.
        </p>
        {linkPortal ? (
          <CopiarLink url={linkPortal} />
        ) : (
          <div className="aviso erro">Consentimento não encontrado.</div>
        )}
        {!base && (
          <p className="small muted" style={{ marginTop: 6 }}>
            Dica: defina <code>NEXT_PUBLIC_APP_URL</code> no ambiente para o link
            sair completo.
          </p>
        )}
      </div>

      <div className="card">
        <h3>Preferências (preenchidas por {pessoa.apelido})</h3>
        {preferencias.length === 0 ? (
          <p className="muted small">
            Ainda sem preferências. Elas aparecem aqui quando {pessoa.apelido}{' '}
            preenche o questionário no portal. Você não edita isto — é só da
            pessoa.
          </p>
        ) : (
          <ul className="lista">
            {preferencias.map((p) => (
              <li key={p.id}>
                <span>
                  <strong>{p.categoria}</strong>: {p.valor}
                </span>
                <span className="badge">{ROTULO_PREF[p.tipo] ?? p.tipo}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card">
        <h3>Datas importantes</h3>
        <ul className="lista">
          {datas.map((d) => (
            <li key={d.id}>
              <span>
                <strong>{d.tipo}</strong> — {fmt(d.data)}{' '}
                <span className="small muted">
                  ({d.recorrencia === 'anual' ? 'todo ano' : 'única'})
                </span>
              </span>
              <form action={removerDataAction}>
                <input type="hidden" name="pessoaId" value={id} />
                <input type="hidden" name="id" value={d.id} />
                <button className="btn secundario pequeno" type="submit">
                  Remover
                </button>
              </form>
            </li>
          ))}
          {datas.length === 0 && (
            <li className="muted small">Nenhuma data cadastrada.</li>
          )}
        </ul>

        <form action={adicionarDataAction} style={{ marginTop: 14 }}>
          <input type="hidden" name="pessoaId" value={id} />
          <div className="row">
            <div>
              <label htmlFor="tipo-data">Tipo (ex.: aniversário)</label>
              <input id="tipo-data" name="tipo" type="text" required />
            </div>
            <div>
              <label htmlFor="data-data">Data</label>
              <input id="data-data" name="data" type="date" required />
            </div>
            <div style={{ flex: '0 0 130px' }}>
              <label htmlFor="rec-data">Recorrência</label>
              <select id="rec-data" name="recorrencia" defaultValue="anual">
                <option value="anual">Todo ano</option>
                <option value="unica">Única</option>
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

      <div className="card">
        <h3>Ciclos de consumo</h3>
        <p className="small muted" style={{ marginTop: 0 }}>
          Produtos que acabam de tempos em tempos — uma oportunidade de gesto
          útil quando estão prestes a acabar.
        </p>
        <ul className="lista">
          {ciclos.map((c) => (
            <li key={c.id}>
              <span>
                <strong>{c.produto}</strong> — a cada {c.intervaloDias} dias
                (última reposição em {fmt(c.ultimaReposicao)})
              </span>
              <form action={removerCicloAction}>
                <input type="hidden" name="pessoaId" value={id} />
                <input type="hidden" name="id" value={c.id} />
                <button className="btn secundario pequeno" type="submit">
                  Remover
                </button>
              </form>
            </li>
          ))}
          {ciclos.length === 0 && (
            <li className="muted small">Nenhum ciclo cadastrado.</li>
          )}
        </ul>

        <form action={adicionarCicloAction} style={{ marginTop: 14 }}>
          <input type="hidden" name="pessoaId" value={id} />
          <div className="row">
            <div>
              <label htmlFor="produto">Produto</label>
              <input id="produto" name="produto" type="text" required />
            </div>
            <div>
              <label htmlFor="ultima">Última reposição</label>
              <input id="ultima" name="ultimaReposicao" type="date" required />
            </div>
            <div style={{ flex: '0 0 130px' }}>
              <label htmlFor="intervalo">Intervalo (dias)</label>
              <input
                id="intervalo"
                name="intervaloDias"
                type="number"
                min={1}
                required
              />
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
