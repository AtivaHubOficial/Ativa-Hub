-- Sprint 3.0.4 — autenticação e autorização administrativa.
-- Execute após supabase/schema.sql. Esta migration não cria usuários e não altera produtos.
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;
revoke all on table public.admin_users from anon, authenticated;
grant select on table public.admin_users to authenticated;
drop policy if exists "Users can read own admin membership" on public.admin_users;
create policy "Users can read own admin membership" on public.admin_users for select to authenticated using (user_id = (select auth.uid()));

create or replace function public.is_admin()
returns boolean language sql stable security definer
set search_path = pg_catalog, public
as $$ select exists (select 1 from public.admin_users where user_id = (select auth.uid())); $$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

revoke insert, update, delete on table public.products from anon;
grant select, insert, update, delete on table public.products to authenticated;
drop policy if exists "Authorized admins can read all products" on public.products;
create policy "Authorized admins can read all products" on public.products for select to authenticated using ((select public.is_admin()));
drop policy if exists "Authorized admins can insert products" on public.products;
create policy "Authorized admins can insert products" on public.products for insert to authenticated with check ((select public.is_admin()));
drop policy if exists "Authorized admins can update products" on public.products;
create policy "Authorized admins can update products" on public.products for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "Authorized admins can delete products" on public.products;
create policy "Authorized admins can delete products" on public.products for delete to authenticated using ((select public.is_admin()));

-- Cadastre o primeiro vínculo manualmente no SQL Editor usando o UUID de auth.users.

