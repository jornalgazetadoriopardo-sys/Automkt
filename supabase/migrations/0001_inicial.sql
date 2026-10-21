-- Estrutura inicial do Automkt.
-- Rode no SQL Editor do Supabase (ou com `supabase db push`).

create table if not exists clientes (
  id uuid primary key,
  nome text not null,
  segmento text not null default '',
  regiao text not null default '',
  instagram text not null default '',
  guia_voz text not null default '',
  pilares text[] not null default '{}',
  cores jsonb not null,
  fontes jsonb not null,
  logo_url text,
  criado_em timestamptz not null default now()
);

create table if not exists pautas (
  id uuid primary key,
  cliente_id uuid not null references clientes(id) on delete cascade,
  titulo text not null,
  angulo text not null default '',
  pilar text not null default '',
  formato_sugerido text not null default '',
  por_que_agora text not null default '',
  fontes jsonb not null default '[]',
  status text not null default 'sugerida'
    check (status in ('sugerida', 'aprovada', 'descartada')),
  criada_em timestamptz not null default now()
);
create index if not exists pautas_cliente_idx on pautas (cliente_id, criada_em desc);

create table if not exists posts (
  id uuid primary key,
  cliente_id uuid not null references clientes(id) on delete cascade,
  pauta_id uuid references pautas(id) on delete set null,
  tema text not null default '',
  legenda text not null default '',
  hashtags text[] not null default '{}',
  arte jsonb not null,
  modelo text not null,
  formato text not null,
  status text not null default 'rascunho'
    check (status in ('rascunho', 'aprovado')),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists posts_cliente_idx on posts (cliente_id, atualizado_em desc);

-- O app acessa o banco só pelo servidor, com a service role key.
-- RLS ligado sem políticas = ninguém de fora lê ou grava pela chave pública.
alter table clientes enable row level security;
alter table pautas enable row level security;
alter table posts enable row level security;

-- Bucket público para logos e fotos usadas nas artes.
insert into storage.buckets (id, name, public)
values ('arquivos', 'arquivos', true)
on conflict (id) do nothing;
