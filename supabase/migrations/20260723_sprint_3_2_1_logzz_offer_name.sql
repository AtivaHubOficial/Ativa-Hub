-- Sprint 3.2.1 — identificação administrativa da oferta Logzz.
alter table public.products
  add column if not exists external_offer_name text;
