begin;
create schema recovery;
revoke all on schema recovery from public, anon, authenticated;
create table recovery.business_categories(name text primary key check(length(trim(name)) > 0));
create table recovery.business_pools(
  id text primary key, name text not null, quantity bigint not null check(quantity >= 0), created_at timestamptz not null
);
-- One sellable variant per existing product ID. Preserve full original records
-- in restricted ledger tables for subsequent reconciliation and recovery.
create table recovery.business_products(
  id text primary key, pool_id text not null references recovery.business_pools,
  name text not null, price_centavos bigint not null check(price_centavos > 0),
  category text references recovery.business_categories, family text, scent text, size text,
  variant_type text check(variant_type in ('Solo','Set')), original jsonb not null
);
create table recovery.business_sales(
  id text primary key, request_key text unique not null, recorded_by text,
  payment_method text not null check(payment_method in ('cash','gcash','coop')),
  total_centavos bigint not null check(total_centavos > 0), confirmed_at timestamptz not null
);
create table recovery.business_sale_items(
  id bigint primary key check(id>0), sale_id text not null references recovery.business_sales,
  product_id text not null references recovery.business_products, pool_id text not null references recovery.business_pools,
  quantity bigint not null check(quantity > 0), original jsonb not null, unique(sale_id,product_id)
);
create table recovery.business_movements(
  id bigint primary key check(id>0), sale_id text references recovery.business_sales,
  product_id text not null references recovery.business_products, pool_id text not null references recovery.business_pools,
  delta bigint not null check(delta <> 0), original jsonb not null
);
create table recovery.business_events(
  id bigint primary key check(id>0), sale_id text references recovery.business_sales, original jsonb not null
);


-- Append-only observations. A retry of identical content creates no extra row.
create table recovery.catalog_observations(
  source_id text not null, name text not null, quantity bigint not null check(quantity >= 0),
  price_centavos bigint not null check(price_centavos>0), observed_at timestamptz not null default now(),
  primary key(source_id,name,quantity,price_centavos)
);
create function public.observe_business_stock(source_id text, name text, quantity bigint, price_centavos bigint)
returns void language sql security definer set search_path='' as $$
  insert into recovery.catalog_observations(source_id,name,quantity,price_centavos)
  values ($1,$2,$3,$4) on conflict do nothing
$$;
revoke all on function public.observe_business_stock(text,text,bigint,bigint) from public,anon,authenticated;
grant execute on function public.observe_business_stock(text,text,bigint,bigint) to service_role;
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname='recovery' loop
    execute format('alter table recovery.%I enable row level security',t);
    execute format('revoke all on recovery.%I from public,anon,authenticated',t);
  end loop;
end $$;
commit;
