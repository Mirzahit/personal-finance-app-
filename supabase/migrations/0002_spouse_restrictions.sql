-- ============================================================
-- Phase 1.5: Granular spouse permissions
-- ============================================================
-- Owner toggles "shared with spouse" per resource.
-- Spouse sees only resources where shared_with_spouse = true.
-- Spouse cannot insert/update/delete owner resources at all.
-- Spouse can only insert pending leila_requests as herself.
-- ============================================================

-- 1) Add per-resource toggles
alter table public.accounts add column if not exists shared_with_spouse boolean not null default false;
alter table public.envelopes add column if not exists shared_with_spouse boolean not null default false;
alter table public.goals add column if not exists shared_with_spouse boolean not null default false;
alter table public.debts add column if not exists shared_with_spouse boolean not null default false;

-- 2) Helper for current role
create or replace function private.current_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;
grant execute on function private.current_role() to authenticated;

-- 3) Replace RLS policies

-- accounts
drop policy if exists "accounts_select" on public.accounts;
drop policy if exists "accounts_insert" on public.accounts;
drop policy if exists "accounts_update" on public.accounts;
drop policy if exists "accounts_delete" on public.accounts;

create policy "accounts_select" on public.accounts for select to authenticated
  using (
    household_id = private.current_household_id()
    and (private.current_role() = 'owner' or shared_with_spouse = true)
  );
create policy "accounts_insert" on public.accounts for insert to authenticated
  with check (
    household_id = private.current_household_id()
    and private.current_role() = 'owner'
  );
create policy "accounts_update" on public.accounts for update to authenticated
  using (household_id = private.current_household_id() and private.current_role() = 'owner')
  with check (household_id = private.current_household_id() and private.current_role() = 'owner');
create policy "accounts_delete" on public.accounts for delete to authenticated
  using (household_id = private.current_household_id() and private.current_role() = 'owner');

-- envelopes
drop policy if exists "envelopes_select" on public.envelopes;
drop policy if exists "envelopes_insert" on public.envelopes;
drop policy if exists "envelopes_update" on public.envelopes;
drop policy if exists "envelopes_delete" on public.envelopes;

create policy "envelopes_select" on public.envelopes for select to authenticated
  using (
    household_id = private.current_household_id()
    and (private.current_role() = 'owner' or shared_with_spouse = true)
  );
create policy "envelopes_insert" on public.envelopes for insert to authenticated
  with check (household_id = private.current_household_id() and private.current_role() = 'owner');
create policy "envelopes_update" on public.envelopes for update to authenticated
  using (household_id = private.current_household_id() and private.current_role() = 'owner')
  with check (household_id = private.current_household_id() and private.current_role() = 'owner');
create policy "envelopes_delete" on public.envelopes for delete to authenticated
  using (household_id = private.current_household_id() and private.current_role() = 'owner');

-- goals
drop policy if exists "goals_select" on public.goals;
drop policy if exists "goals_insert" on public.goals;
drop policy if exists "goals_update" on public.goals;
drop policy if exists "goals_delete" on public.goals;

create policy "goals_select" on public.goals for select to authenticated
  using (
    household_id = private.current_household_id()
    and (private.current_role() = 'owner' or shared_with_spouse = true)
  );
create policy "goals_insert" on public.goals for insert to authenticated
  with check (household_id = private.current_household_id() and private.current_role() = 'owner');
create policy "goals_update" on public.goals for update to authenticated
  using (household_id = private.current_household_id() and private.current_role() = 'owner')
  with check (household_id = private.current_household_id() and private.current_role() = 'owner');
create policy "goals_delete" on public.goals for delete to authenticated
  using (household_id = private.current_household_id() and private.current_role() = 'owner');

-- debts
drop policy if exists "debts_select" on public.debts;
drop policy if exists "debts_insert" on public.debts;
drop policy if exists "debts_update" on public.debts;
drop policy if exists "debts_delete" on public.debts;

create policy "debts_select" on public.debts for select to authenticated
  using (
    household_id = private.current_household_id()
    and (private.current_role() = 'owner' or shared_with_spouse = true)
  );
create policy "debts_insert" on public.debts for insert to authenticated
  with check (household_id = private.current_household_id() and private.current_role() = 'owner');
create policy "debts_update" on public.debts for update to authenticated
  using (household_id = private.current_household_id() and private.current_role() = 'owner')
  with check (household_id = private.current_household_id() and private.current_role() = 'owner');
create policy "debts_delete" on public.debts for delete to authenticated
  using (household_id = private.current_household_id() and private.current_role() = 'owner');

-- transactions:
--   owner: sees all
--   spouse: sees tx where account_id IS visible to her (shared_with_spouse) OR tx is her own (from_leila + user_id = self)
drop policy if exists "transactions_select" on public.transactions;
drop policy if exists "transactions_insert" on public.transactions;
drop policy if exists "transactions_update" on public.transactions;
drop policy if exists "transactions_delete" on public.transactions;

create policy "transactions_select" on public.transactions for select to authenticated
  using (
    household_id = private.current_household_id()
    and (
      private.current_role() = 'owner'
      or (
        private.current_role() = 'spouse'
        and (
          (from_leila = true and user_id = auth.uid())
          or exists (
            select 1 from public.accounts a
            where a.id = transactions.account_id and a.shared_with_spouse = true
          )
        )
      )
    )
  );
create policy "transactions_insert" on public.transactions for insert to authenticated
  with check (household_id = private.current_household_id() and private.current_role() = 'owner');
create policy "transactions_update" on public.transactions for update to authenticated
  using (household_id = private.current_household_id() and private.current_role() = 'owner')
  with check (household_id = private.current_household_id() and private.current_role() = 'owner');
create policy "transactions_delete" on public.transactions for delete to authenticated
  using (household_id = private.current_household_id() and private.current_role() = 'owner');

-- leila_requests:
--   owner: sees and manages all
--   spouse: sees own, can insert own pending request
drop policy if exists "leila_requests_select" on public.leila_requests;
drop policy if exists "leila_requests_insert" on public.leila_requests;
drop policy if exists "leila_requests_update" on public.leila_requests;
drop policy if exists "leila_requests_delete" on public.leila_requests;

create policy "leila_requests_select" on public.leila_requests for select to authenticated
  using (
    household_id = private.current_household_id()
    and (
      private.current_role() = 'owner'
      or (private.current_role() = 'spouse' and requested_by = auth.uid())
    )
  );
create policy "leila_requests_insert" on public.leila_requests for insert to authenticated
  with check (
    household_id = private.current_household_id()
    and (
      private.current_role() = 'owner'
      or (
        private.current_role() = 'spouse'
        and requested_by = auth.uid()
        and status = 'pending'
      )
    )
  );
create policy "leila_requests_update" on public.leila_requests for update to authenticated
  using (household_id = private.current_household_id() and private.current_role() = 'owner')
  with check (household_id = private.current_household_id() and private.current_role() = 'owner');
create policy "leila_requests_delete" on public.leila_requests for delete to authenticated
  using (household_id = private.current_household_id() and private.current_role() = 'owner');
