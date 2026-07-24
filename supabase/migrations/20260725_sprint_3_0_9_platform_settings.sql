-- Sprint 3.0.9 — registro único de configurações públicas da plataforma.
create table if not exists public.platform_settings (
  id text primary key check (id = 'public'),
  platform_name text not null,
  short_description text not null,
  hero_title text not null,
  hero_subtitle text not null,
  contact_email text,
  whatsapp text,
  instagram_url text,
  facebook_url text,
  partner_notice text not null,
  primary_button_text text not null,
  products_per_page integer not null check (products_per_page between 4 and 60),
  default_category text not null,
  show_empty_ratings boolean not null default false,
  show_products_without_image boolean not null default true,
  show_inactive_products boolean not null default false,
  seo_title text not null,
  seo_description text not null,
  logo_url text,
  cover_image_url text,
  favicon_url text,
  primary_color text not null default '#0f172a',
  accent_color text not null default '#facc15',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.platform_settings (
  id, platform_name, short_description, hero_title, hero_subtitle,
  partner_notice, primary_button_text, products_per_page, default_category,
  seo_title, seo_description
) values (
  'public', 'Ativa Hub', 'Vitrine independente de produtos e ofertas selecionadas.',
  'Ofertas úteis para quem vive o campo e a cidade.',
  'Produtos selecionados com foco em agro, ferramentas, tecnologia e rotina profissional.',
  'A compra é finalizada no site parceiro. Preço e disponibilidade são confirmados no destino.',
  'Ver ofertas', 24, 'Todos', 'Ativa Hub — Ofertas selecionadas',
  'Vitrine independente de produtos e ofertas selecionadas.'
) on conflict (id) do nothing;

alter table public.platform_settings enable row level security;
grant select on public.platform_settings to anon, authenticated;
grant insert, update on public.platform_settings to authenticated;

drop policy if exists "Public can read platform settings" on public.platform_settings;
create policy "Public can read platform settings"
on public.platform_settings for select
using (id = 'public');

drop policy if exists "Admins can insert platform settings" on public.platform_settings;
create policy "Admins can insert platform settings"
on public.platform_settings for insert to authenticated
with check ((select public.is_admin()) and id = 'public');

drop policy if exists "Admins can update platform settings" on public.platform_settings;
create policy "Admins can update platform settings"
on public.platform_settings for update to authenticated
using ((select public.is_admin()) and id = 'public')
with check ((select public.is_admin()) and id = 'public');
