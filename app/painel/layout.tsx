import Link from 'next/link';
import { redirect } from 'next/navigation';
import { criarClienteServidor } from '@/src/lib/supabase/server';
import { garantirPerfil } from '@/src/lib/persistencia/repositorios';
import { sair } from '../entrar/acoes';

export const dynamic = 'force-dynamic';

export default async function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/entrar');

  await garantirPerfil(supabase, user);

  return (
    <>
      <header className="topbar">
        <Link className="brand" href="/painel">
          Gestos de Carinho
        </Link>
        <nav style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link className="small muted" href="/painel">
            Semana
          </Link>
          <form action={sair}>
            <button className="btn secundario pequeno" type="submit">
              Sair
            </button>
          </form>
        </nav>
      </header>
      <main className="container">{children}</main>
    </>
  );
}
