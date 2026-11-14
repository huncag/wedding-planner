-- ============================================================================
-- Teleki Castle Wedding Planner — Supabase / PostgreSQL schema
-- Run this in the Supabase SQL editor (or `supabase db push`).
--
-- Auth model: two real accounts created in Supabase Authentication (email +
-- password). Everything below is protected by RLS: only authenticated users
-- can read or write planner data, and anonymous guests may only INSERT an RSVP.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'rsvp_status') then
    create type public.rsvp_status as enum ('pending', 'attending', 'declined');
  end if;

  if not exists (select 1 from pg_type where typname = 'meal_preference') then
    create type public.meal_preference as enum ('meat', 'fish', 'vegetarian', 'vegan', 'kids');
  end if;

  if not exists (select 1 from pg_type where typname = 'vendor_status') then
    create type public.vendor_status as enum ('researching', 'contacted', 'booked', 'completed', 'cancelled');
  end if;

  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type public.payment_status as enum ('scheduled', 'paid', 'overdue', 'refunded');
  end if;

  if not exists (select 1 from pg_type where typname = 'invitation_status') then
    create type public.invitation_status as enum ('not_sent', 'sent', 'rsvp_received');
  end if;

  if not exists (select 1 from pg_type where typname = 'currency_code') then
    create type public.currency_code as enum ('RON', 'EUR');
  end if;
end
$$;

-- ----------------------------------------------------------------------------
-- seating_tables
-- ----------------------------------------------------------------------------
create table if not exists public.seating_tables (
  id           uuid primary key default gen_random_uuid(),
  table_number integer not null unique check (table_number > 0),
  capacity     integer not null default 8 check (capacity > 0),
  created_at   timestamptz not null default now()
);

comment on table public.seating_tables is 'Round tables / table plan for the reception.';

-- ----------------------------------------------------------------------------
-- vendors
-- ----------------------------------------------------------------------------
create table if not exists public.vendors (
  id           uuid primary key default gen_random_uuid(),
  category     text not null,
  name         text not null,
  contact_info text,
  total_cost   numeric(12, 2) not null default 0 check (total_cost >= 0),
  -- Every amount keeps the currency it was quoted in; display conversion is
  -- applied in the app using the latest ECB rate.
  currency     public.currency_code not null default 'RON',
  status       public.vendor_status not null default 'researching',
  created_at   timestamptz not null default now()
);

comment on column public.vendors.category is 'e.g. venue, catering, photography, florist, music, attire.';

create index if not exists vendors_status_idx on public.vendors (status);
create index if not exists vendors_category_idx on public.vendors (category);

-- ----------------------------------------------------------------------------
-- guests
-- ----------------------------------------------------------------------------
create table if not exists public.guests (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null,
  email                text,
  phone                text,
  rsvp_status          public.rsvp_status not null default 'pending',
  meal_preference      public.meal_preference,
  dietary_restrictions text,
  plus_one_name        text,
  seating_table_id     uuid references public.seating_tables (id) on delete set null,
  -- 0-based chair position around the table; null while unseated.
  seat_index           integer check (seat_index is null or seat_index >= 0),
  created_at           timestamptz not null default now()
);

comment on column public.guests.plus_one_name is 'Null unless the guest is bringing a plus-one.';
comment on column public.guests.seat_index is '0-based chair index around the assigned table.';

create index if not exists guests_seating_table_id_idx on public.guests (seating_table_id);
create index if not exists guests_rsvp_status_idx on public.guests (rsvp_status);

-- One guest per chair.
create unique index if not exists guests_seat_unique
  on public.guests (seating_table_id, seat_index)
  where seating_table_id is not null and seat_index is not null;

-- ----------------------------------------------------------------------------
-- budget
-- ----------------------------------------------------------------------------
create table if not exists public.budget (
  id                   uuid primary key default gen_random_uuid(),
  category             text not null,
  item                 text not null,
  estimated_cost       numeric(12, 2) not null default 0 check (estimated_cost >= 0),
  estimated_currency   public.currency_code not null default 'RON',
  actual_cost          numeric(12, 2) check (actual_cost >= 0),
  actual_currency      public.currency_code,
  vendor_id            uuid references public.vendors (id) on delete set null,
  paid                 boolean not null default false,
  created_at           timestamptz not null default now(),
  -- An actual amount is always accompanied by its currency.
  constraint budget_actual_currency_check check (
    (actual_cost is null and actual_currency is null)
    or (actual_cost is not null and actual_currency is not null)
  )
);

create index if not exists budget_vendor_id_idx on public.budget (vendor_id);
create index if not exists budget_category_idx on public.budget (category);

-- ----------------------------------------------------------------------------
-- payments
-- ----------------------------------------------------------------------------
create table if not exists public.payments (
  id           uuid primary key default gen_random_uuid(),
  vendor_id    uuid not null references public.vendors (id) on delete cascade,
  amount_paid  numeric(12, 2) not null check (amount_paid > 0),
  currency     public.currency_code not null default 'RON',
  payment_date date,
  status       public.payment_status not null default 'scheduled',
  created_at   timestamptz not null default now()
);

comment on column public.payments.payment_date is 'Null for future/scheduled payments.';

create index if not exists payments_vendor_id_idx on public.payments (vendor_id);
create index if not exists payments_status_idx on public.payments (status);

-- ----------------------------------------------------------------------------
-- invitations
-- ----------------------------------------------------------------------------
create table if not exists public.invitations (
  id                 uuid primary key default gen_random_uuid(),
  guest_id           uuid not null unique references public.guests (id) on delete cascade,
  sent_status        public.invitation_status not null default 'not_sent',
  rsvp_received_date date,
  created_at         timestamptz not null default now()
);

comment on column public.invitations.guest_id is 'One invitation per guest.';

create index if not exists invitations_sent_status_idx on public.invitations (sent_status);

-- ----------------------------------------------------------------------------
-- rsvp_submissions — written by anonymous guests, read only by the couple
-- ----------------------------------------------------------------------------
create table if not exists public.rsvp_submissions (
  id                   uuid primary key default gen_random_uuid(),
  guest_id             uuid references public.guests (id) on delete set null,
  name                 text not null check (length(trim(name)) > 0),
  email                text,
  phone                text,
  attending            boolean not null,
  meal_preference      public.meal_preference,
  dietary_restrictions text,
  plus_one_name        text,
  message              text,
  handled              boolean not null default false,
  submitted_at         timestamptz not null default now()
);

comment on table public.rsvp_submissions is 'Raw RSVP replies from the public page; the planner merges them into guests.';

create index if not exists rsvp_submissions_submitted_at_idx
  on public.rsvp_submissions (submitted_at desc);

-- ----------------------------------------------------------------------------
-- fx_rates — daily RON/EUR snapshots so past totals stay explainable
-- ----------------------------------------------------------------------------
create table if not exists public.fx_rates (
  id         uuid primary key default gen_random_uuid(),
  base       public.currency_code not null default 'EUR',
  quote      public.currency_code not null default 'RON',
  rate       numeric(12, 6) not null check (rate > 0),
  rate_date  date not null,
  source     text not null default 'ecb-frankfurter',
  fetched_at timestamptz not null default now(),
  unique (base, quote, rate_date)
);

comment on column public.fx_rates.rate is 'Units of quote currency per 1 unit of base currency.';

-- ============================================================================
-- Row Level Security
-- ============================================================================
-- The anon key is public (it ships to the browser), so RLS is the real security
-- boundary. There is no anonymous read access to any planner table.

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'seating_tables',
    'vendors',
    'guests',
    'budget',
    'payments',
    'invitations',
    'fx_rates'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists "planner full access" on public.%I', table_name);
    execute format(
      'create policy "planner full access" on public.%I for all to authenticated using (true) with check (true)',
      table_name
    );
  end loop;
end
$$;

alter table public.rsvp_submissions enable row level security;

drop policy if exists "planner full access" on public.rsvp_submissions;
create policy "planner full access" on public.rsvp_submissions
  for all to authenticated using (true) with check (true);

drop policy if exists "guests can submit an rsvp" on public.rsvp_submissions;
create policy "guests can submit an rsvp" on public.rsvp_submissions
  for insert to anon with check (handled = false);

-- Supabase grants broad table privileges to anon by default; revoke them so the
-- only anonymous capability is the insert policy above.
revoke all on all tables in schema public from anon;
grant insert on public.rsvp_submissions to anon;

-- ============================================================================
-- Realtime — the planner subscribes to these tables for live updates
-- ============================================================================
do $$
begin
  alter publication supabase_realtime add table public.rsvp_submissions;
exception when duplicate_object then null;
end
$$;

do $$
begin
  alter publication supabase_realtime add table public.guests;
exception when duplicate_object then null;
end
$$;
