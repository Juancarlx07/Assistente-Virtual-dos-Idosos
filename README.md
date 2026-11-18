# Gestos de Carinho (nome provisório)

Produto (MVP) que ajuda pessoas a manter **gestos de carinho constantes** no dia
a dia — sem perder o toque pessoal e sem virar algo automático ou invasivo.

O sistema **sugere**; a pessoa **decide e personaliza**. Nada sobre a outra
pessoa é usado sem o consentimento explícito dela.

## Princípios inegociáveis

- **Carinho genuíno:** o sistema só sugere; o usuário personaliza antes de
  qualquer envio. Um gesto só fica "pronto" com um elemento pessoal.
- **Consentimento e privacidade:** dados da pessoa querida só com permissão
  explícita, que ela pode ver, editar e apagar — pelo portal self-service.
- **Sem vigilância:** nada de localização, redes sociais ou conversas.
- **Transparência:** fica claro o que é lembrado, por quê e como remover.

## Stack

- **Next.js 15** (App Router, Server Actions) + **Supabase** (Postgres, Auth, RLS).
- **TypeScript** em todo o código; **Vitest** para os testes da lógica.
- Por quê: o RLS do Postgres encaixa nos princípios de privacidade/consentimento
  (isolamento por linha), o Auth vem pronto e o deploy é simples — tudo num
  repositório só.

> Lembretes, nesta fase, são **manuais** (validação primeiro — ver
> `docs/validacao.md`). O app gera e guarda as sugestões da semana e registra um
> lembrete com status "agendado"; o envio é feito por você, à mão, enquanto a
> proposta de valor é validada.

## Estrutura

```
app/                       # Next.js App Router (UI + Server Actions)
  entrar/                  # login e cadastro
  painel/                  # área logada: semana, pessoas, preparar gesto
  portal/[token]/          # self-service da pessoa querida (consentimento/preferências)
src/lib/dominio/           # Entidades (tipos) e regras (ex.: personalização)
src/lib/sugestoes/         # Motor de sugestões (lógica pura) + utilitários de data
src/lib/persistencia/      # Mapeamento e repositórios (Supabase); portal (service role)
src/lib/supabase/          # Clientes de servidor/admin e middleware de sessão
tests/                     # Testes da lógica (Vitest)
supabase/migrations/       # Schema SQL com RLS
docs/                      # validacao.md e modelo-negocio.md
```

## Como rodar

Pré-requisitos: **Node 20+** e um projeto **Supabase** (cloud ou local via CLI).

### 1. Dependências e variáveis de ambiente

```bash
npm install
cp .env.example .env.local   # preencha com os valores do seu projeto Supabase
```

Variáveis (ver `.env.example`):

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — públicas.
- `SUPABASE_SERVICE_ROLE_KEY` — privada; usada **apenas** pelo portal por token.
- `NEXT_PUBLIC_APP_URL` — base para montar o link do portal (ex.:
  `http://localhost:3000`).

### 2. Banco de dados

O schema está em `supabase/migrations/0001_schema_inicial.sql` (tabelas + RLS).

- **Supabase Cloud:** abra o SQL Editor e rode o conteúdo da migration.
- **Supabase CLI (local):**
  ```bash
  supabase init
  supabase start
  supabase db reset   # aplica as migrations de supabase/migrations
  ```

Para testar o fluxo rápido, desative a confirmação de e-mail em
Authentication → Providers → Email (ou use o link de confirmação).

### 3. Rodar

```bash
npm run dev        # aplicação em http://localhost:3000
npm run build      # build de produção
npm test           # testes da lógica (Vitest)
npm run typecheck  # checagem de tipos
```

## Fluxo de uso

1. **Cadastre-se** em `/entrar` e adicione uma **pessoa querida** no painel.
2. Abra a pessoa e **copie o link do portal**; envie para ela.
3. No portal, a pessoa **dá o consentimento**, preenche as **preferências** e
   pode ver/apagar tudo quando quiser.
4. No painel, cadastre **datas importantes** e **ciclos de consumo**.
5. Clique em **Gerar sugestões**: o motor produz até 3 sugestões da semana, cada
   uma com justificativa, e registra o lembrete (envio manual nesta fase).
6. Em **Preparar**, você escreve o **elemento pessoal** — obrigatório para marcar
   o gesto como pronto.

## O motor de sugestões

Função pura e determinística em `src/lib/sugestoes/motor.ts`: dados o dia de
referência, a pessoa, suas preferências, datas, ciclos e o histórico de gestos,
gera **até 3 sugestões por semana** por prioridade:

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
