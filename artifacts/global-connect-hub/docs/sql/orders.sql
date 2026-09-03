-- Paypack Checkout — `orders` table
-- Run in: Lovable Cloud SQL editor (idempotent).
-- Already applied in this project via supabase/migrations.

create table if not exists public.orders (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid,
  email        text,
  item_name    text,
  amount       integer not null,
  status       text not null default 'pending'
               check (status in ('pending','completed','failed','cancelled')),
  paypack_ref  text,
  session_id   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

grant select on public.orders to authenticated;
grant all    on public.orders to service_role;

alter table public.orders enable row level security;

drop policy if exists "Users read their own orders" on public.orders;
create policy "Users read their own orders"
  on public.orders for select
  to authenticated
  using (user_id = auth.uid());

create index if not exists orders_session_id_idx  on public.orders(session_id);
create index if not exists orders_paypack_ref_idx on public.orders(paypack_ref);

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
  before update on public.orders
  for each row execute function public.update_updated_at_column();
