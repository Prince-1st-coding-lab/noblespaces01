
-- 1) Roles
do $$ begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('admin','user');
  end if;
end $$;

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

alter table public.user_roles enable row level security;

drop policy if exists "users read their own roles" on public.user_roles;
create policy "users read their own roles"
  on public.user_roles for select
  to authenticated
  using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- 2) Service prices (admin-managed amount per service slug)
create table if not exists public.service_prices (
  slug text primary key,
  label text not null,
  amount integer not null check (amount > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select on public.service_prices to anon, authenticated;
grant all on public.service_prices to service_role, authenticated;

alter table public.service_prices enable row level security;

drop policy if exists "anyone can read active prices" on public.service_prices;
create policy "anyone can read active prices"
  on public.service_prices for select
  to anon, authenticated
  using (true);

drop policy if exists "admins manage prices insert" on public.service_prices;
create policy "admins manage prices insert"
  on public.service_prices for insert
  to authenticated
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "admins manage prices update" on public.service_prices;
create policy "admins manage prices update"
  on public.service_prices for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "admins manage prices delete" on public.service_prices;
create policy "admins manage prices delete"
  on public.service_prices for delete
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

drop trigger if exists trg_service_prices_updated_at on public.service_prices;
create trigger trg_service_prices_updated_at
  before update on public.service_prices
  for each row execute function public.update_updated_at_column();

-- 3) Bookings: extend orders with customer details and let admins read all
alter table public.orders add column if not exists customer_name text;
alter table public.orders add column if not exists phone text;
alter table public.orders add column if not exists notes text;
alter table public.orders add column if not exists service_slug text;

drop policy if exists "admins read all orders" on public.orders;
create policy "admins read all orders"
  on public.orders for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- allow public (anon) insert of pending orders is NOT needed because the edge
-- function uses service_role; no INSERT policy is granted to anon/authenticated.
