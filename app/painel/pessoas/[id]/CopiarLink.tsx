'use client';

import { useState } from 'react';

export default function CopiarLink({ url }: { url: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sem permissão de clipboard: o usuário pode copiar manualmente do campo.
    }
  }

  return (
    <div className="row" style={{ marginTop: 8 }}>
      <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} />
      <div className="acao">
        <button type="button" className="btn secundario" onClick={copiar}>
          {copiado ? 'Copiado!' : 'Copiar'}
        </button>
      </div>
    </div>
  );
}
