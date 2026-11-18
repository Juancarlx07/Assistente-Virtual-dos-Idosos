import { obterDadosPortal } from '@/src/lib/persistencia/portal';
import {
  adicionarPreferenciaAction,
  apagarTudoAction,
  concederAction,
  removerPreferenciaAction,
  revogarAction,
} from './acoes';

export const dynamic = 'force-dynamic';

const fmt = (d: Date) =>
  d.toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' });

export default async function PortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  let dados: Awaited<ReturnType<typeof obterDadosPortal>> = null;
  try {
    dados = await obterDadosPortal(token);
  } catch (e) {
    // Falha ao carregar (ex.: backend indisponível). Não derruba a página.
    console.error('portal/obterDadosPortal', e);
  }

  if (!dados) {
    return (
      <>
        <header className="topbar">
          <span className="brand">Gestos de Carinho</span>
        </header>
        <main className="container" style={{ maxWidth: 560 }}>
          <div className="aviso erro">
            Este link não é válido ou está indisponível no momento. Se você o
            recebeu de alguém, peça um novo.
          </div>
        </main>
      </>
    );
  }

  const { pessoa, consentimento, preferencias, datas, ciclos } = dados;
  const concedido = consentimento.status === 'concedido';

  return (
    <>
      <header className="topbar">
        <span className="brand">Gestos de Carinho</span>
      </header>
      <main className="container" style={{ maxWidth: 620 }}>
        <h1>Olá, {pessoa.apelido} 💛</h1>
        <p className="muted">
          Alguém que gosta de você usa o <strong>Gestos de Carinho</strong> para
          lembrar de demonstrar carinho com constância — e quer fazer isso{' '}
          <strong>com o seu consentimento</strong>. Aqui você decide o que
          compartilhar, vê tudo o que está guardado e pode apagar quando quiser.
        </p>

        <div className="card">
          <h3>Transparência</h3>
          <ul className="muted small">
            <li>
              O que é guardado: as preferências que <strong>você</strong>{' '}
              preencher aqui, e datas/ciclos que a pessoa cadastrou (abaixo).
            </li>
            <li>
              Para quê: apenas para sugerir gestos de carinho — nunca para
              rastrear você, sua localização, redes sociais ou conversas.
            </li>
            <li>
              Controle: você pode revogar o consentimento e apagar tudo a
              qualquer momento, nesta página.
            </li>
          </ul>
        </div>

        <div className="card">
          <h3>Consentimento</h3>
          <p>
            Status atual:{' '}
            {concedido ? (
              <span className="badge ok">concedido</span>
            ) : consentimento.status === 'revogado' ? (
              <span className="badge rev">revogado</span>
            ) : (
              <span className="badge pend">pendente</span>
            )}
          </p>
          {concedido ? (
            <form action={revogarAction}>
              <input type="hidden" name="token" value={token} />
              <button className="btn perigo" type="submit">
                Revogar consentimento
              </button>
            </form>
          ) : (
            <form action={concederAction}>
              <input type="hidden" name="token" value={token} />
              <button className="btn" type="submit">
                Dar consentimento
              </button>
            </form>
          )}
          <p className="small muted" style={{ marginTop: 10 }}>
            Sem consentimento, nenhuma sugestão é gerada a partir dos seus dados.
          </p>
        </div>

        <div className="card">
          <h3>Suas preferências</h3>
          <p className="small muted" style={{ marginTop: 0 }}>
            Conte o que você gosta, o que prefere evitar e alergias. Só você
            edita isto.
          </p>
          <ul className="lista">
            {preferencias.map((p) => (
              <li key={p.id}>
                <span>
                  <strong>{p.categoria}</strong>: {p.valor}{' '}
                  <span className="badge">{p.tipo}</span>
                </span>
                <form action={removerPreferenciaAction}>
                  <input type="hidden" name="token" value={token} />
                  <input type="hidden" name="id" value={p.id} />
                  <button className="btn secundario pequeno" type="submit">
                    Remover
                  </button>
                </form>
              </li>
            ))}
            {preferencias.length === 0 && (
              <li className="muted small">Nenhuma preferência ainda.</li>
            )}
          </ul>

          <form action={adicionarPreferenciaAction} style={{ marginTop: 14 }}>
            <input type="hidden" name="token" value={token} />
            <div className="row">
              <div>
                <label htmlFor="categoria">Categoria</label>
                <input
                  id="categoria"
                  name="categoria"
                  type="text"
                  placeholder="flores, comida, hobby…"
                  required
                />
              </div>
              <div>
                <label htmlFor="valor">O quê</label>
                <input
                  id="valor"
                  name="valor"
                  type="text"
                  placeholder="girassol, chocolate amargo…"
                  required
                />
              </div>
              <div style={{ flex: '0 0 130px' }}>
                <label htmlFor="tipo">Tipo</label>
                <select id="tipo" name="tipo" defaultValue="gosta">
                  <option value="gosta">Gosto</option>
                  <option value="evitar">Evitar</option>
                  <option value="alergia">Alergia</option>
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
          <h3>O que já está guardado sobre datas e ciclos</h3>
          <p className="small muted" style={{ marginTop: 0 }}>
            Cadastrado por quem te convidou. Se algo não deveria estar aqui, use
            "Apagar tudo" abaixo.
          </p>
          <ul className="lista">
            {datas.map((d) => (
              <li key={d.id}>
                <span>
                  📅 <strong>{d.tipo}</strong> — {fmt(d.data)}
                </span>
              </li>
            ))}
            {ciclos.map((c) => (
              <li key={c.id}>
                <span>
                  🔁 <strong>{c.produto}</strong> — a cada {c.intervaloDias} dias
                </span>
              </li>
            ))}
            {datas.length === 0 && ciclos.length === 0 && (
              <li className="muted small">Nada guardado.</li>
            )}
          </ul>
        </div>

        <div className="card">
          <h3>Apagar tudo</h3>
          <p className="small muted" style={{ marginTop: 0 }}>
            Remove todas as suas preferências, datas e ciclos e revoga o
            consentimento. Não pode ser desfeito.
          </p>
          <form action={apagarTudoAction}>
            <input type="hidden" name="token" value={token} />
            <button className="btn perigo" type="submit">
              Apagar tudo e revogar
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
