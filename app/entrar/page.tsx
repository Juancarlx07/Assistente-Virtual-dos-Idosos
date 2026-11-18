import Link from 'next/link';
import { entrar, cadastrar } from './acoes';

export const dynamic = 'force-dynamic';

export default async function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; msg?: string }>;
}) {
  const { erro, msg } = await searchParams;

  return (
    <>
      <header className="topbar">
        <Link className="brand" href="/">
          Gestos de Carinho
        </Link>
      </header>
      <main className="container" style={{ maxWidth: 440 }}>
        <h1>Entrar</h1>

        {erro && <div className="aviso erro">{erro}</div>}
        {msg === 'confirme' && (
          <div className="aviso ok">
            Conta criada! Confirme seu e-mail (se exigido pelo projeto) e entre
            em seguida.
          </div>
        )}

        <div className="card">
          <form action={entrar}>
            <label htmlFor="email-login">E-mail</label>
            <input id="email-login" name="email" type="email" required />
            <label htmlFor="senha-login">Senha</label>
            <input id="senha-login" name="senha" type="password" required />
            <div style={{ marginTop: 16 }}>
              <button className="btn" type="submit">
                Entrar
              </button>
            </div>
          </form>
        </div>

        <div className="card">
          <h3>Criar conta</h3>
          <form action={cadastrar}>
            <label htmlFor="nome-cad">Seu nome</label>
            <input id="nome-cad" name="nome" type="text" required />
            <label htmlFor="email-cad">E-mail</label>
            <input id="email-cad" name="email" type="email" required />
            <label htmlFor="senha-cad">Senha (mín. 6 caracteres)</label>
            <input
              id="senha-cad"
              name="senha"
              type="password"
              minLength={6}
              required
            />
            <div style={{ marginTop: 16 }}>
              <button className="btn secundario" type="submit">
                Criar conta
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
