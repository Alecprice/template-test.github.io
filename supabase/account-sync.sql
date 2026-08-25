-- TV Phone Remote account sync schema
-- Email/password auth is provided by Supabase Auth. This schema stores only app-owned data.

create table if not exists public.user_sync_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  streaming_services jsonb not null default '[]'::jsonb,
  favorite_app_ids jsonb not null default '[]'::jsonb,
  activities jsonb not null default '[]'::jsonb,
  tv_devices jsonb not null default '[]'::jsonb,
  ui_preferences jsonb not null default '{}'::jsonb,
  app_preferences jsonb not null default '{}'::jsonb,
  version bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_sync_state enable row level security;

revoke all on table public.user_sync_state from anon;
grant select, insert, update, delete on table public.user_sync_state to authenticated;

create policy "users can read own sync state"
on public.user_sync_state
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "users can insert own sync state"
on public.user_sync_state
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "users can update own sync state"
on public.user_sync_state
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "users can delete own sync state"
on public.user_sync_state
for delete
to authenticated
using ((select auth.uid()) = user_id);

comment on table public.user_sync_state is
'Account-owned TV Phone Remote state. LAN-only connection/session details should remain in local device storage and must not be written here.';
