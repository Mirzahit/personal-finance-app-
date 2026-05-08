-- ============================================================
-- Personal Finance App — initial schema
-- ============================================================
-- Все суммы храним в minor units (копейки/тийины) как bigint —
-- так избегаем погрешностей floating point.
-- Каждая запись принадлежит household; пользователь видит только
-- данные своей household.
-- ============================================================

-- Private schema для SECURITY DEFINER функций (не exposed через REST).
create schema if not exists private;

-- ============================================================
-- Tables
-- ============================================================

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Семья',
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete restrict,
  display_name text not null,
  role text not null default 'owner' check (role in ('owner','spouse')),
  avatar_letter text not null default 'У',
  created_at timestamptz not null default now()
);

create index profiles_household_idx on public.profiles(household_id);

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  bank text not null,
  currency text not null check (currency in ('KGS','KZT')),
  balance_minor bigint not null default 0,
  position int not null default 0,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create index accounts_household_idx on public.accounts(household_id);

create table public.envelopes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete set null,
  name text not null,
  icon_name text not null default 'shopping-bag',
  limit_minor bigint not null default 0,
  spent_minor bigint not null default 0,
  currency text not null check (currency in ('KGS','KZT')),
  position int not null default 0,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create index envelopes_household_idx on public.envelopes(household_id);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  envelope_id uuid references public.envelopes(id) on delete set null,
  user_id uuid references auth.users(id),
  title text not null,
  amount_minor bigint not null check (amount_minor > 0),
  currency text not null check (currency in ('KGS','KZT')),
  type text not null check (type in ('income','expense','transfer')),
  occurred_at timestamptz not null default now(),
  notes text,
  from_leila boolean not null default false,
  created_at timestamptz not null default now()
);

create index transactions_household_idx on public.transactions(household_id);
create index transactions_household_date_idx on public.transactions(household_id, occurred_at desc);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  target_minor bigint not null check (target_minor > 0),
  saved_minor bigint not null default 0,
  currency text not null check (currency in ('KGS','KZT')),
  due_date date,
  achieved boolean not null default false,
  created_at timestamptz not null default now()
);

create index goals_household_idx on public.goals(household_id);

create table public.debts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  creditor text not null,
  total_minor bigint not null check (total_minor > 0),
  paid_minor bigint not null default 0,
  currency text not null check (currency in ('KGS','KZT')),
  start_date date not null default current_date,
  end_date date,
  paid_off boolean not null default false,
  created_at timestamptz not null default now()
);

create index debts_household_idx on public.debts(household_id);

create table public.leila_requests (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  envelope_id uuid references public.envelopes(id) on delete set null,
  requested_by uuid not null references auth.users(id),
  approved_by uuid references auth.users(id),
  category text not null,
  estimated_minor bigint not null check (estimated_minor > 0),
  actual_minor bigint,
  currency text not null check (currency in ('KGS','KZT')),
  status text not null default 'pending'
    check (status in ('pending','approved','completed','rejected','cancelled','expired')),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  completed_at timestamptz
);

create index leila_requests_household_idx on public.leila_requests(household_id);
create index leila_requests_status_idx on public.leila_requests(household_id, status);

-- ============================================================
-- Helper function: текущий household_id (через SECURITY DEFINER,
-- чтобы избежать рекурсии RLS на profiles).
-- ============================================================

create or replace function private.current_household_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select household_id from public.profiles where id = auth.uid()
$$;

grant execute on function private.current_household_id() to authenticated;

-- ============================================================
-- Trigger: при регистрации создаётся household + profile (owner)
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_household_id uuid;
  display_name_val text;
begin
  display_name_val := coalesce(
    new.raw_user_meta_data->>'display_name',
    split_part(new.email, '@', 1)
  );

  insert into public.households (name)
  values (coalesce(new.raw_user_meta_data->>'household_name', 'Семья'))
  returning id into new_household_id;

  insert into public.profiles (id, household_id, display_name, avatar_letter, role)
  values (
    new.id,
    new_household_id,
    display_name_val,
    upper(left(display_name_val, 1)),
    'owner'
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.households       enable row level security;
alter table public.profiles         enable row level security;
alter table public.accounts         enable row level security;
alter table public.envelopes        enable row level security;
alter table public.transactions     enable row level security;
alter table public.goals            enable row level security;
alter table public.debts            enable row level security;
alter table public.leila_requests   enable row level security;

-- households: только своя
create policy "households_select" on public.households for select
  to authenticated using (id = private.current_household_id());

-- profiles
create policy "profiles_select_self_or_household" on public.profiles for select
  to authenticated using (
    id = auth.uid() or household_id = private.current_household_id()
  );

create policy "profiles_update_self" on public.profiles for update
  to authenticated using (id = auth.uid())
  with check (id = auth.uid());

-- accounts
create policy "accounts_select" on public.accounts for select to authenticated
  using (household_id = private.current_household_id());
create policy "accounts_insert" on public.accounts for insert to authenticated
  with check (household_id = private.current_household_id());
create policy "accounts_update" on public.accounts for update to authenticated
  using (household_id = private.current_household_id())
  with check (household_id = private.current_household_id());
create policy "accounts_delete" on public.accounts for delete to authenticated
  using (household_id = private.current_household_id());

-- envelopes
create policy "envelopes_select" on public.envelopes for select to authenticated
  using (household_id = private.current_household_id());
create policy "envelopes_insert" on public.envelopes for insert to authenticated
  with check (household_id = private.current_household_id());
create policy "envelopes_update" on public.envelopes for update to authenticated
  using (household_id = private.current_household_id())
  with check (household_id = private.current_household_id());
create policy "envelopes_delete" on public.envelopes for delete to authenticated
  using (household_id = private.current_household_id());

-- transactions
create policy "transactions_select" on public.transactions for select to authenticated
  using (household_id = private.current_household_id());
create policy "transactions_insert" on public.transactions for insert to authenticated
  with check (household_id = private.current_household_id());
create policy "transactions_update" on public.transactions for update to authenticated
  using (household_id = private.current_household_id())
  with check (household_id = private.current_household_id());
create policy "transactions_delete" on public.transactions for delete to authenticated
  using (household_id = private.current_household_id());

-- goals
create policy "goals_select" on public.goals for select to authenticated
  using (household_id = private.current_household_id());
create policy "goals_insert" on public.goals for insert to authenticated
  with check (household_id = private.current_household_id());
create policy "goals_update" on public.goals for update to authenticated
  using (household_id = private.current_household_id())
  with check (household_id = private.current_household_id());
create policy "goals_delete" on public.goals for delete to authenticated
  using (household_id = private.current_household_id());

-- debts
create policy "debts_select" on public.debts for select to authenticated
  using (household_id = private.current_household_id());
create policy "debts_insert" on public.debts for insert to authenticated
  with check (household_id = private.current_household_id());
create policy "debts_update" on public.debts for update to authenticated
  using (household_id = private.current_household_id())
  with check (household_id = private.current_household_id());
create policy "debts_delete" on public.debts for delete to authenticated
  using (household_id = private.current_household_id());

-- leila_requests
create policy "leila_requests_select" on public.leila_requests for select to authenticated
  using (household_id = private.current_household_id());
create policy "leila_requests_insert" on public.leila_requests for insert to authenticated
  with check (household_id = private.current_household_id());
create policy "leila_requests_update" on public.leila_requests for update to authenticated
  using (household_id = private.current_household_id())
  with check (household_id = private.current_household_id());
create policy "leila_requests_delete" on public.leila_requests for delete to authenticated
  using (household_id = private.current_household_id());
