-- Sprint 3.0.7 — evolução progressiva da gestão de categorias.
create extension if not exists unaccent;

alter table public.categories add column if not exists description text;
alter table public.categories add column if not exists display_order integer not null default 0;
alter table public.categories add column if not exists normalized_key text;

update public.categories
set normalized_key = trim(both '-' from lower(regexp_replace(
  unaccent(regexp_replace(name, '\s*&\s*', ' e ', 'g')),
  '[^a-zA-Z0-9]+', '-', 'g'
)))
where normalized_key is null or normalized_key = '';

-- Consolida categorias equivalentes antes de aplicar a unicidade.
with ranked as (
  select id, normalized_key,
    first_value(id) over (partition by normalized_key order by created_at, id) as keeper_id
  from public.categories
), duplicates as (
  select id, keeper_id from ranked where id <> keeper_id
)
update public.products p
set category = keeper.name
from duplicates d
join public.categories duplicate on duplicate.id = d.id
join public.categories keeper on keeper.id = d.keeper_id
where trim(both '-' from lower(regexp_replace(
  unaccent(regexp_replace(p.category, '\s*&\s*', ' e ', 'g')),
  '[^a-zA-Z0-9]+', '-', 'g'
))) = duplicate.normalized_key;

with ranked as (
  select id,
    first_value(id) over (partition by normalized_key order by created_at, id) as keeper_id
  from public.categories
)
delete from public.categories c
using ranked r
where c.id = r.id and r.id <> r.keeper_id;

alter table public.categories alter column normalized_key set not null;
create unique index if not exists categories_normalized_key_unique_idx
  on public.categories(normalized_key);
create index if not exists categories_display_order_idx
  on public.categories(status, display_order, name);

insert into public.categories(name, slug, normalized_key, description, status, display_order)
values ('Geral', 'geral', 'geral', 'Categoria padrão para produtos sem classificação.', 'active', 999)
on conflict (normalized_key) do nothing;

alter table public.products add column if not exists category_id uuid
  references public.categories(id) on delete restrict;

update public.products p
set category_id = c.id, category = c.name
from public.categories c
where p.category_id is null
  and trim(both '-' from lower(regexp_replace(
    unaccent(regexp_replace(p.category, '\s*&\s*', ' e ', 'g')),
    '[^a-zA-Z0-9]+', '-', 'g'
  ))) = c.normalized_key;

update public.products p
set category_id = c.id, category = c.name
from public.categories c
where c.normalized_key = 'geral'
  and p.category_id is null;

create index if not exists products_category_id_idx on public.products(category_id);
