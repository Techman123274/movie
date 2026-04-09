create extension if not exists pgcrypto;

create or replace function public.requesting_user_id()
returns text
language sql
stable
as $$
  select nullif(auth.jwt() ->> 'sub', '');
$$;

create or replace function public.requesting_user_email()
returns text
language sql
stable
as $$
  select lower(nullif(auth.jwt() ->> 'email', ''));
$$;

create or replace function public.is_subflix_admin()
returns boolean
language sql
stable
as $$
  -- Replace the placeholder email list below so it mirrors VITE_ADMIN_EMAILS / NEXT_PUBLIC_ADMIN_EMAILS.
  select coalesce(public.requesting_user_email(), '') = any (
    array[
      'admin@example.com',
      'backwood.tayz@gmail.com'
    ]
  );
$$;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default public.requesting_user_id(),
  created_by text,
  name text not null,
  avatar_color text,
  avatar_index integer default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default public.requesting_user_id(),
  created_by text,
  tmdb_id integer not null,
  media_type text not null,
  title text not null,
  poster_path text,
  backdrop_path text,
  vote_average numeric,
  overview text,
  release_date text,
  genre_ids jsonb default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.watch_history (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default public.requesting_user_id(),
  created_by text,
  tmdb_id integer not null,
  media_type text not null,
  title text not null,
  poster_path text,
  backdrop_path text,
  vote_average numeric,
  release_date text,
  season_number integer,
  episode_number integer,
  progress_percent integer default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles
  add column if not exists is_kids boolean not null default false,
  add column if not exists maturity_rating text not null default 'all';

alter table public.watch_history
  add column if not exists genre_ids jsonb default '[]'::jsonb;

create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  created_by text,
  title text not null,
  body text not null,
  notification_type text not null default 'update',
  audience text not null default 'global',
  publish_at timestamptz not null default timezone('utc', now()),
  ends_at timestamptz,
  media_type text,
  tmdb_id integer,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.admin_featured_entries (
  id uuid primary key default gen_random_uuid(),
  created_by text,
  title text not null,
  tmdb_id integer not null,
  media_type text not null,
  poster_path text,
  backdrop_path text,
  overview text,
  release_date text,
  vote_average numeric,
  genre_ids jsonb default '[]'::jsonb,
  entry_type text not null default 'hero',
  group_name text,
  badge_text text,
  audience text not null default 'global',
  sort_order integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.admin_site_settings (
  id uuid primary key default gen_random_uuid(),
  created_by text,
  setting_key text not null unique,
  setting_value text,
  label text,
  is_public boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles enable row level security;
alter table public.watchlist enable row level security;
alter table public.watch_history enable row level security;
alter table public.admin_notifications enable row level security;
alter table public.admin_featured_entries enable row level security;
alter table public.admin_site_settings enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
using (user_id = public.requesting_user_id());

drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin"
on public.profiles
for select
using (public.is_subflix_admin());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
with check (user_id = public.requesting_user_id());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
using (user_id = public.requesting_user_id())
with check (user_id = public.requesting_user_id());

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own"
on public.profiles
for delete
using (user_id = public.requesting_user_id());

drop policy if exists "watchlist_select_own" on public.watchlist;
create policy "watchlist_select_own"
on public.watchlist
for select
using (user_id = public.requesting_user_id());

drop policy if exists "watchlist_select_admin" on public.watchlist;
create policy "watchlist_select_admin"
on public.watchlist
for select
using (public.is_subflix_admin());

drop policy if exists "watchlist_insert_own" on public.watchlist;
create policy "watchlist_insert_own"
on public.watchlist
for insert
with check (user_id = public.requesting_user_id());

drop policy if exists "watchlist_update_own" on public.watchlist;
create policy "watchlist_update_own"
on public.watchlist
for update
using (user_id = public.requesting_user_id())
with check (user_id = public.requesting_user_id());

drop policy if exists "watchlist_delete_own" on public.watchlist;
create policy "watchlist_delete_own"
on public.watchlist
for delete
using (user_id = public.requesting_user_id());

drop policy if exists "watch_history_select_own" on public.watch_history;
create policy "watch_history_select_own"
on public.watch_history
for select
using (user_id = public.requesting_user_id());

drop policy if exists "watch_history_select_admin" on public.watch_history;
create policy "watch_history_select_admin"
on public.watch_history
for select
using (public.is_subflix_admin());

drop policy if exists "watch_history_insert_own" on public.watch_history;
create policy "watch_history_insert_own"
on public.watch_history
for insert
with check (user_id = public.requesting_user_id());

drop policy if exists "watch_history_update_own" on public.watch_history;
create policy "watch_history_update_own"
on public.watch_history
for update
using (user_id = public.requesting_user_id())
with check (user_id = public.requesting_user_id());

drop policy if exists "watch_history_delete_own" on public.watch_history;
create policy "watch_history_delete_own"
on public.watch_history
for delete
using (user_id = public.requesting_user_id());

drop policy if exists "admin_notifications_select_public" on public.admin_notifications;
create policy "admin_notifications_select_public"
on public.admin_notifications
for select
using (
  is_active = true
  and publish_at <= timezone('utc', now())
  and (ends_at is null or ends_at >= timezone('utc', now()))
);

drop policy if exists "admin_notifications_select_admin" on public.admin_notifications;
create policy "admin_notifications_select_admin"
on public.admin_notifications
for select
using (public.is_subflix_admin());

drop policy if exists "admin_notifications_insert_admin" on public.admin_notifications;
create policy "admin_notifications_insert_admin"
on public.admin_notifications
for insert
with check (public.is_subflix_admin());

drop policy if exists "admin_notifications_update_admin" on public.admin_notifications;
create policy "admin_notifications_update_admin"
on public.admin_notifications
for update
using (public.is_subflix_admin())
with check (public.is_subflix_admin());

drop policy if exists "admin_notifications_delete_admin" on public.admin_notifications;
create policy "admin_notifications_delete_admin"
on public.admin_notifications
for delete
using (public.is_subflix_admin());

drop policy if exists "admin_featured_entries_select_public" on public.admin_featured_entries;
create policy "admin_featured_entries_select_public"
on public.admin_featured_entries
for select
using (
  is_active = true
  and (starts_at is null or starts_at <= timezone('utc', now()))
  and (ends_at is null or ends_at >= timezone('utc', now()))
);

drop policy if exists "admin_featured_entries_select_admin" on public.admin_featured_entries;
create policy "admin_featured_entries_select_admin"
on public.admin_featured_entries
for select
using (public.is_subflix_admin());

drop policy if exists "admin_featured_entries_insert_admin" on public.admin_featured_entries;
create policy "admin_featured_entries_insert_admin"
on public.admin_featured_entries
for insert
with check (public.is_subflix_admin());

drop policy if exists "admin_featured_entries_update_admin" on public.admin_featured_entries;
create policy "admin_featured_entries_update_admin"
on public.admin_featured_entries
for update
using (public.is_subflix_admin())
with check (public.is_subflix_admin());

drop policy if exists "admin_featured_entries_delete_admin" on public.admin_featured_entries;
create policy "admin_featured_entries_delete_admin"
on public.admin_featured_entries
for delete
using (public.is_subflix_admin());

drop policy if exists "admin_site_settings_select_public" on public.admin_site_settings;
create policy "admin_site_settings_select_public"
on public.admin_site_settings
for select
using (is_public = true);

drop policy if exists "admin_site_settings_select_admin" on public.admin_site_settings;
create policy "admin_site_settings_select_admin"
on public.admin_site_settings
for select
using (public.is_subflix_admin());

drop policy if exists "admin_site_settings_insert_admin" on public.admin_site_settings;
create policy "admin_site_settings_insert_admin"
on public.admin_site_settings
for insert
with check (public.is_subflix_admin());

drop policy if exists "admin_site_settings_update_admin" on public.admin_site_settings;
create policy "admin_site_settings_update_admin"
on public.admin_site_settings
for update
using (public.is_subflix_admin())
with check (public.is_subflix_admin());

drop policy if exists "admin_site_settings_delete_admin" on public.admin_site_settings;
create policy "admin_site_settings_delete_admin"
on public.admin_site_settings
for delete
using (public.is_subflix_admin());
