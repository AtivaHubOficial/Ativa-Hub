-- Sprint 3.2 — metadados de origem para sincronização idempotente da Logzz.
alter table public.products add column if not exists source text not null default 'manual';
alter table public.products add column if not exists external_product_id text;
alter table public.products add column if not exists external_offer_id text;
create unique index if not exists products_external_source_unique_idx
  on public.products(source,external_product_id,external_offer_id);
create index if not exists products_source_idx on public.products(source);
