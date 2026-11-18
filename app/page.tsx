import Link from 'next/link';

export default function Home() {
  return (
    <>
      <header className="topbar">
        <span className="brand">Gestos de Carinho</span>
        <Link className="btn secundario" href="/entrar">
          Entrar
        </Link>
      </header>
      <main className="container">
        <section className="hero">
          <h1>Carinho constante, sem perder o toque pessoal.</h1>
          <p className="muted" style={{ fontSize: '1.1rem', maxWidth: 560 }}>
            A gente lembra e sugere; você decide e personaliza. Pequenos gestos
            genuínos, no momento certo — sem transformar carinho em algo
            automático ou invasivo.
          </p>
          <div className="pills">
            <span className="badge">O sistema sugere, você personaliza</span>
            <span className="badge">Consentimento explícito</span>
            <span className="badge">Sem vigilância</span>
          </div>
          <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
            <Link className="btn" href="/entrar">
              Começar
            </Link>
          </div>
        </section>

        <div className="card" style={{ marginTop: 32 }}>
          <h3>Como funciona</h3>
          <ol className="muted">
            <li>
              Você cadastra uma pessoa querida e envia a ela um link para dar
              consentimento e preencher as próprias preferências.
            </li>
            <li>
              A cada semana, geramos até três sugestões (carta, flor, presente,
              experiência) com uma justificativa curta de por que foram sugeridas.
            </li>
            <li>
              Antes de marcar um gesto como pronto, você adiciona algo seu — uma
              frase, uma lembrança.
            </li>
          </ol>
        </div>
      </main>
    </>
  );
}
