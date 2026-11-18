import Link from 'next/link';
import { notFound } from 'next/navigation';
import { criarClienteServidor } from '@/src/lib/supabase/server';
import {
  obterGestoPorSugestao,
  obterSugestao,
} from '@/src/lib/persistencia/repositorios';
import { salvarGestoAction } from './acoes';

export const dynamic = 'force-dynamic';

export default async function PrepararPage({
  params,
  searchParams,
}: {
  params: Promise<{ sugestaoId: string }>;
  searchParams: Promise<{ erro?: string; msg?: string }>;
}) {
  const { sugestaoId } = await params;
  const { erro, msg } = await searchParams;
  const supabase = await criarClienteServidor();

  const sugestao = await obterSugestao(supabase, sugestaoId);
  if (!sugestao) notFound();
  const gesto = await obterGestoPorSugestao(supabase, sugestaoId);

  const jaPronto = gesto?.status === 'pronto';

  return (
    <>
      <p className="small">
        <Link href="/painel">← voltar</Link>
      </p>
      <h1 style={{ marginBottom: 2 }}>Preparar gesto</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        <span className="badge">{sugestao.tipo}</span>{' '}
        <strong>{sugestao.titulo}</strong>
      </p>

      <div className="card">
        <p className="justificativa">{sugestao.justificativa}</p>

        {erro === 'personalizacao' && (
          <div className="aviso erro">
            Para marcar como pronto, adicione algo seu — uma frase, uma
            lembrança. É isso que mantém o gesto genuíno.
          </div>
        )}
        {msg === 'salvo' && (
          <div className="aviso ok">Rascunho salvo.</div>
        )}
        {jaPronto && (
          <div className="aviso ok">
            Este gesto está pronto. Você ainda pode ajustar o texto abaixo.
          </div>
        )}

        <form action={salvarGestoAction}>
          <input type="hidden" name="sugestaoId" value={sugestaoId} />

          <label htmlFor="elemento">
            Seu toque pessoal (obrigatório para marcar como pronto)
          </label>
          <textarea
            id="elemento"
            name="elementoPessoal"
            placeholder="Escreva uma frase, uma lembrança, algo que só vocês dois sabem…"
            defaultValue={gesto?.elementoPessoal ?? ''}
          />

          <label htmlFor="dataPlanejada">Quando pretende fazer (opcional)</label>
          <input
            id="dataPlanejada"
            name="dataPlanejada"
            type="date"
            defaultValue={
              gesto?.dataPlanejada
                ? gesto.dataPlanejada.toISOString().slice(0, 10)
                : ''
            }
          />

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button
              className="btn secundario"
              type="submit"
              name="marcarPronto"
              value="0"
            >
              Salvar rascunho
            </button>
            <button
              className="btn"
              type="submit"
              name="marcarPronto"
              value="1"
            >
              Marcar como pronto
            </button>
          </div>
        </form>
      </div>

      <p className="small muted">
        Lembrete: o sistema só sugere. O conteúdo e a decisão de fazer (ou não)
        são sempre seus.
      </p>
    </>
  );
}
