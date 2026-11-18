-- Schema inicial do produto de "gestos de carinho".
--
-- Privacidade por desenho:
--  - Cada linha pertence a um usuário (auth.uid()) e o RLS garante que
--    ninguém veja dados de outra conta.
--  - Dados da pessoa querida só existem com consentimento, e há um token de
--    portal para que a própria pessoa veja/edite/apague o que foi registrado.
--  - Nada de localização, redes sociais ou conversas é armazenado.

-- ───────────────────────── Tipos ─────────────────────────
create type canal_lembrete       as enum ('email', 'push');
create type tipo_relacao         as enum ('parceiro', 'familia', 'amizade', 'outro');
create type status_consentimento as enum ('pendente', 'concedido', 'revogado');
create type tipo_preferencia     as enum ('gosta', 'evitar', 'alergia');
create type recorrencia_data     as enum ('anual', 'unica');
create type tipo_gesto           as enum ('carta', 'flor', 'presente', 'experiencia');
create type gatilho_sugestao     as enum ('data', 'ciclo', 'constancia');
create type status_sugestao      as enum ('nova', 'vista', 'descartada', 'em_preparo', 'pronta');
create type status_gesto         as enum ('planejado', 'pronto', 'enviado');
create type status_lembrete      as enum ('agendado', 'enviado');

-- ───────────────────────── Usuário ─────────────────────────
-- Perfil do usuário, atrelado ao auth do Supabase.
create table usuario (
  id              uuid primary key references auth.users (id) on delete cascade,
  nome            text not null,
  email           text not null,
  canal_preferido canal_lembrete not null default 'email',
  dia_do_lembrete smallint not null default 1 check (dia_do_lembrete between 0 and 6),
  criado_em       timestamptz not null default now()
);

-- ───────────────────────── Pessoa querida ─────────────────────────
create table pessoa_querida (
  id                   uuid primary key default gen_random_uuid(),
  usuario_id           uuid not null references usuario (id) on delete cascade,
  apelido              text not null,
  tipo_relacao         tipo_relacao not null default 'outro',
  status_consentimento status_consentimento not null default 'pendente',
  criado_em            timestamptz not null default now()
);
create index on pessoa_querida (usuario_id);

-- ───────────────────────── Consentimento ─────────────────────────
-- Registro auditável. O token_portal dá acesso self-service à pessoa querida.
create table consentimento (
  id              uuid primary key default gen_random_uuid(),
  pessoa_id       uuid not null references pessoa_querida (id) on delete cascade,
  status          status_consentimento not null default 'pendente',
  escopo          text not null default '',
  token_portal    text not null unique default encode(gen_random_bytes(24), 'hex'),
  data_concessao  timestamptz,
  data_revogacao  timestamptz
);
create index on consentimento (pessoa_id);

-- ───────────────────────── Preferências ─────────────────────────
-- Preenchidas pela própria pessoa querida.
create table preferencia (
  id        uuid primary key default gen_random_uuid(),
  pessoa_id uuid not null references pessoa_querida (id) on delete cascade,
  categoria text not null,
  valor     text not null,
  tipo      tipo_preferencia not null
);
create index on preferencia (pessoa_id);

-- ───────────────────────── Datas importantes ─────────────────────────
create table data_importante (
  id          uuid primary key default gen_random_uuid(),
  pessoa_id   uuid not null references pessoa_querida (id) on delete cascade,
  tipo        text not null,
  data        date not null,
  recorrencia recorrencia_data not null default 'anual',
  descricao   text
);
create index on data_importante (pessoa_id);

-- ───────────────────────── Ciclos de consumo ─────────────────────────
create table ciclo_consumo (
  id               uuid primary key default gen_random_uuid(),
  pessoa_id        uuid not null references pessoa_querida (id) on delete cascade,
  produto          text not null,
  ultima_reposicao date not null,
  intervalo_dias   integer not null check (intervalo_dias > 0)
);
create index on ciclo_consumo (pessoa_id);

-- ───────────────────────── Sugestões ─────────────────────────
create table sugestao (
  id            uuid primary key default gen_random_uuid(),
  usuario_id    uuid not null references usuario (id) on delete cascade,
  pessoa_id     uuid not null references pessoa_querida (id) on delete cascade,
  tipo          tipo_gesto not null,
  titulo        text not null,
  justificativa text not null,
  gatilho       gatilho_sugestao not null,
  semana_ref    date not null,
  status        status_sugestao not null default 'nova',
  criado_em     timestamptz not null default now()
);
create index on sugestao (usuario_id, semana_ref);

-- ───────────────────────── Gestos ─────────────────────────
-- Personalização obrigatória é garantida na aplicação (motor/domínio) e
-- reforçada aqui: um gesto "pronto" ou "enviado" precisa de elemento pessoal.
create table gesto (
  id               uuid primary key default gen_random_uuid(),
  sugestao_id      uuid not null unique references sugestao (id) on delete cascade,
  elemento_pessoal text not null default '',
  data_planejada   date,
  data_envio       date,
  status           status_gesto not null default 'planejado',
  constraint elemento_pessoal_obrigatorio
    check (status = 'planejado' or length(btrim(elemento_pessoal)) >= 3)
);

-- ───────────────────────── Lembretes ─────────────────────────
create table lembrete (
  id           uuid primary key default gen_random_uuid(),
  usuario_id   uuid not null references usuario (id) on delete cascade,
  semana_ref   date not null,
  canal        canal_lembrete not null,
  status       status_lembrete not null default 'agendado',
  sugestao_ids uuid[] not null default '{}',
  unique (usuario_id, semana_ref)
);

-- ═════════════════════════ RLS ═════════════════════════
-- Tudo bloqueado por padrão; o dono (auth.uid()) só acessa o que é seu.
alter table usuario         enable row level security;
alter table pessoa_querida  enable row level security;
alter table consentimento   enable row level security;
alter table preferencia     enable row level security;
alter table data_importante enable row level security;
alter table ciclo_consumo   enable row level security;
alter table sugestao        enable row level security;
alter table gesto           enable row level security;
alter table lembrete        enable row level security;

-- Usuário: só o próprio registro.
create policy usuario_proprio on usuario
  for all using (id = auth.uid()) with check (id = auth.uid());

-- Pessoa querida e lembrete: pertencem diretamente ao usuário.
create policy pessoa_do_usuario on pessoa_querida
  for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
create policy lembrete_do_usuario on lembrete
  for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

-- Sugestão: pertence ao usuário.
create policy sugestao_do_usuario on sugestao
  for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

-- Função auxiliar: a pessoa querida pertence ao usuário atual?
create or replace function pessoa_pertence_ao_usuario(p uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from pessoa_querida where id = p and usuario_id = auth.uid()
  );
$$;

-- Tabelas ligadas via pessoa_id: acesso quando a pessoa é do usuário.
create policy consentimento_via_pessoa on consentimento
  for all using (pessoa_pertence_ao_usuario(pessoa_id))
  with check (pessoa_pertence_ao_usuario(pessoa_id));
create policy preferencia_via_pessoa on preferencia
  for all using (pessoa_pertence_ao_usuario(pessoa_id))
  with check (pessoa_pertence_ao_usuario(pessoa_id));
create policy data_via_pessoa on data_importante
  for all using (pessoa_pertence_ao_usuario(pessoa_id))
  with check (pessoa_pertence_ao_usuario(pessoa_id));
create policy ciclo_via_pessoa on ciclo_consumo
  for all using (pessoa_pertence_ao_usuario(pessoa_id))
  with check (pessoa_pertence_ao_usuario(pessoa_id));

-- Gesto: acesso quando a sugestão-mãe é do usuário.
create policy gesto_via_sugestao on gesto
  for all using (
    exists (select 1 from sugestao s where s.id = sugestao_id and s.usuario_id = auth.uid())
  )
  with check (
    exists (select 1 from sugestao s where s.id = sugestao_id and s.usuario_id = auth.uid())
  );

-- NOTA: o acesso self-service da pessoa querida (via token_portal) não usa
-- auth.uid(); será feito por uma função/endpoint do servidor que valida o
-- token e opera com service role, registrando no consentimento. Fica para a
-- Etapa 3, junto do portal de preferências.
