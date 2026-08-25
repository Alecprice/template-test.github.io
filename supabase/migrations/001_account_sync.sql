begin;

create table if not exists public.user_sync_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb check (jsonb_typeof(state) = 'object'),
  version bigint not null default 1,
  updated_by_device_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.bump_user_sync_state_version()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.version := old.version + 1;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists user_sync_state_bump_version on public.user_sync_state;
create trigger user_sync_state_bump_version
before update on public.user_sync_state
for each row
execute function public.bump_user_sync_state_version();

alter table public.user_sync_state enable row level security;
revoke all on table public.user_sync_state from anon;
grant select, insert, update, delete on table public.user_sync_state to authenticated;

drop policy if exists "Users can read own sync state" on public.user_sync_state;
create policy "Users can read own sync state"
on public.user_sync_state
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own sync state" on public.user_sync_state;
create policy "Users can insert own sync state"
on public.user_sync_state
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own sync state" on public.user_sync_state;
create policy "Users can update own sync state"
on public.user_sync_state
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own sync state" on public.user_sync_state;
create policy "Users can delete own sync state"
on public.user_sync_state
for delete
to authenticated
using ((select auth.uid()) = user_id);

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1
       from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'user_sync_state'
     ) then
    execute 'alter publication supabase_realtime add table public.user_sync_state';
  end if;
end;
$$;

comment on table public.user_sync_state is
'Account-owned TV Phone Remote state. Samsung/Fire TV pairing credentials and bridge bearer tokens remain on the local device.';

commit;
