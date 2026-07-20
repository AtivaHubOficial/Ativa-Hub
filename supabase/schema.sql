-- ATIVA HUB v2.0 — banco de dados inicial
create extension if not exists "uuid-ossp";

create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  brand text,
  category text not null,
  subcategory text,
  price numeric(12,2) not null,
  old_price numeric(12,2),
  rating numeric(2,1) default 0,
  review_count integer default 0,
  sold_count integer default 0,
  full_shipping boolean default false,
  free_shipping boolean default false,
  installment_text text,
  image_url text not null,
  gallery jsonb default '[]'::jsonb,
  description text,
  features jsonb default '[]'::jsonb,
  tags jsonb default '[]'::jsonb,
  affiliate_url text not null,
  status text default 'active' check (status in ('active','draft','paused')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.daily_missions (
  id uuid primary key default uuid_generate_v4(),
  mission_date date not null unique,
  products_target integer default 10,
  products_done integer default 0,
  posts_target integer default 10,
  posts_done integer default 0,
  published_target integer default 10,
  published_done integer default 0,
  created_at timestamptz default now()
);

alter table public.products enable row level security;
alter table public.daily_missions enable row level security;

-- Política pública de leitura da vitrine
create policy "Public can read active products"
on public.products for select
using (status = 'active');

-- As políticas de escrita devem ser vinculadas ao usuário administrador
-- depois da criação do login no Supabase Auth.
