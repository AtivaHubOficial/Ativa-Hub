-- ATIVA HUB — Sprint 3.0.5. Migration incremental e compatível com 3.0.4.
create extension if not exists pgcrypto;
create extension if not exists unaccent;
alter table public.products add column if not exists slug text;
alter table public.products add column if not exists short_description text;
alter table public.products add column if not exists featured boolean not null default false;
alter table public.products add column if not exists specifications jsonb not null default '[]'::jsonb;
update public.products set slug = trim(both '-' from lower(regexp_replace(unaccent(title), '[^a-zA-Z0-9]+', '-', 'g'))) || '-' || left(id::text,8) where slug is null;
alter table public.products alter column slug set not null;
create unique index if not exists products_slug_unique_idx on public.products(slug);
create index if not exists products_status_featured_idx on public.products(status,featured);
create index if not exists products_category_idx on public.products(category);

create table if not exists public.categories(id uuid primary key default gen_random_uuid(),name text not null,slug text not null unique,status text not null default 'active' check(status in('active','inactive')),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
insert into public.categories(name,slug) select distinct category,trim(both '-' from lower(regexp_replace(unaccent(category),'[^a-zA-Z0-9]+','-','g'))) from public.products where category is not null and trim(category)<>'' on conflict(slug) do nothing;
alter table public.categories enable row level security;
grant select on public.categories to anon,authenticated;
grant insert,update,delete on public.categories to authenticated;
drop policy if exists "Public can read active categories" on public.categories;
create policy "Public can read active categories" on public.categories for select using(status='active' or (select public.is_admin()));
drop policy if exists "Admins can manage categories" on public.categories;
create policy "Admins can manage categories" on public.categories for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('product-images','product-images',true,5242880,array['image/jpeg','image/png','image/webp']) on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists "Public can read product images" on storage.objects;
create policy "Public can read product images" on storage.objects for select using(bucket_id='product-images');
drop policy if exists "Admins can upload product images" on storage.objects;
create policy "Admins can upload product images" on storage.objects for insert to authenticated with check(bucket_id='product-images' and (select public.is_admin()));
drop policy if exists "Admins can update product images" on storage.objects;
create policy "Admins can update product images" on storage.objects for update to authenticated using(bucket_id='product-images' and (select public.is_admin())) with check(bucket_id='product-images' and (select public.is_admin()));
drop policy if exists "Admins can delete product images" on storage.objects;
create policy "Admins can delete product images" on storage.objects for delete to authenticated using(bucket_id='product-images' and (select public.is_admin()));
