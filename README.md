# Gestos de Carinho (nome provisório)

Base (MVP) de um produto que ajuda pessoas a manter **gestos de carinho
constantes** no dia a dia — sem perder o toque pessoal e sem virar algo
automático ou invasivo.

O sistema **sugere**; a pessoa **decide e personaliza**. Nada sobre a outra
pessoa é usado sem o consentimento explícito dela.

## Princípios inegociáveis

- **Carinho genuíno:** o sistema só sugere; o usuário personaliza antes de
  qualquer envio. Um gesto só fica "pronto" com um elemento pessoal.
- **Consentimento e privacidade:** dados da pessoa querida só com permissão
  explícita, que ela pode ver, editar e apagar.
- **Sem vigilância:** nada de localização, redes sociais ou conversas.
- **Transparência:** fica claro o que é lembrado, por quê e como remover.

## Stack

- **Next.js** (app web) + **Supabase** (Postgres, Auth e RLS).
- **TypeScript** em todo o código; **Vitest** para os testes da lógica.
- Escolha justificada: o RLS do Postgres encaixa nos princípios de
  privacidade/consentimento (isolamento por linha), o Auth vem pronto e o deploy
  é simples — tudo num repositório só.

> Estado atual: o núcleo de domínio, o **motor de sugestões** (com testes) e o
> **schema do banco** estão prontos. A UI web (questionário, painel) entra nas
> próximas etapas. Lembretes, nesta fase, são **manuais** (validação primeiro).

## Estrutura

```
src/lib/dominio/      # Entidades (tipos) e regras de domínio (ex.: personalização)
src/lib/sugestoes/    # Motor de sugestões (lógica pura) e utilitários de data
tests/                # Testes da lógica (Vitest)
supabase/migrations/  # Schema SQL com RLS
docs/                 # validacao.md e modelo-negocio.md
```

## Como rodar

Pré-requisitos: **Node 20+**.

```bash
npm install        # instala dependências de desenvolvimento
npm test           # roda os testes da lógica (Vitest)
npm run test:watch # testes em modo observação
npm run typecheck  # checagem de tipos (sem emitir)
```

### Banco (Supabase)

O schema está em `supabase/migrations/0001_schema_inicial.sql`.

- **Opção A — Supabase Cloud:** crie um projeto, abra o SQL Editor e rode o
  conteúdo da migration. As políticas de RLS já vêm incluídas.
- **Opção B — Supabase CLI (local):**
  ```bash
  supabase init
  supabase start
  supabase db reset   # aplica as migrations de supabase/migrations
  ```

> A UI ainda não está neste repositório; por isso não há `npm run dev` por
> enquanto. Ele chega junto do questionário e do painel (Etapas 3 e 4).

## O motor de sugestões

Função pura e determinística em `src/lib/sugestoes/motor.ts`:
dados o dia de referência, a pessoa, suas preferências, datas importantes,
ciclos de consumo e o histórico de gestos, gera **até 3 sugestões por semana**,
cada uma com uma justificativa curta.

Regras, por prioridade:

1. **Data importante** dentro da janela → sugestão temática.
2. **Ciclo de consumo** prestes a acabar → gesto útil.
3. **Constância** — faz tempo desde o último gesto → gesto leve "sem data".

Em todos os casos: exige consentimento concedido, filtra o que a pessoa marcou
como "evitar"/"alergia" e evita repetir o tipo de gesto usado há pouco.

## Documentos

- [`docs/validacao.md`](docs/validacao.md) — roteiro de entrevistas, protótipo
  manual e como medir autenticidade.
- [`docs/modelo-negocio.md`](docs/modelo-negocio.md) — prós e contras de
  assinatura, comissão e gesto avulso.
