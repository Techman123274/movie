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
  progress_seconds integer default 0,
  duration_seconds integer,
  playback_provider text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default public.requesting_user_id(),
  created_by text,
  actor_email text,
  actor_name text,
  actor_avatar_url text,
  profile_id text,
  profile_name text,
  tmdb_id integer not null,
  media_type text not null,
  title text not null,
  poster_path text,
  backdrop_path text,
  vote_average numeric,
  release_date text,
  genre_ids jsonb default '[]'::jsonb,
  rating_value integer not null check (rating_value between 1 and 5),
  review_text text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default public.requesting_user_id(),
  created_by text,
  friend_email text not null,
  friend_name text,
  status text not null default 'accepted',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.social_activity (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default public.requesting_user_id(),
  created_by text,
  actor_email text not null default public.requesting_user_email(),
  actor_name text,
  actor_avatar_url text,
  profile_id text,
  profile_name text,
  activity_type text not null,
  tmdb_id integer not null,
  media_type text not null,
  title text not null,
  poster_path text,
  backdrop_path text,
  vote_average numeric,
  release_date text,
  overview text,
  genre_ids jsonb default '[]'::jsonb,
  is_adult boolean not null default false,
  rating_value integer,
  activity_message text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default public.requesting_user_id(),
  created_by text,
  actor_email text not null default public.requesting_user_email(),
  actor_name text,
  actor_avatar_url text,
  profile_id text,
  profile_name text,
  tmdb_id integer not null,
  media_type text not null,
  title text not null,
  poster_path text,
  backdrop_path text,
  vote_average numeric,
  release_date text,
  overview text,
  genre_ids jsonb default '[]'::jsonb,
  is_adult boolean not null default false,
  comment_text text not null,
  parent_comment_id uuid references public.comments(id) on delete cascade,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles
  add column if not exists is_kids boolean not null default false,
  add column if not exists maturity_rating text not null default 'all';

alter table public.watch_history
  add column if not exists genre_ids jsonb default '[]'::jsonb,
  add column if not exists progress_seconds integer default 0,
  add column if not exists duration_seconds integer,
  add column if not exists playback_provider text;

alter table public.ratings
  add column if not exists actor_email text,
  add column if not exists actor_name text,
  add column if not exists actor_avatar_url text,
  add column if not exists is_adult boolean not null default false;

alter table public.social_activity
  add column if not exists actor_avatar_url text;

alter table public.comments
  add column if not exists actor_avatar_url text,
  add column if not exists metadata jsonb default '{}'::jsonb;

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

create index if not exists ratings_title_lookup_idx on public.ratings (tmdb_id, media_type, updated_at desc);
create index if not exists comments_title_lookup_idx on public.comments (tmdb_id, media_type, updated_at desc);
create index if not exists social_activity_title_lookup_idx on public.social_activity (tmdb_id, media_type, updated_at desc);

alter table public.profiles enable row level security;
alter table public.watchlist enable row level security;
alter table public.watch_history enable row level security;
alter table public.ratings enable row level security;
alter table public.friendships enable row level security;
alter table public.social_activity enable row level security;
alter table public.comments enable row level security;
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

drop policy if exists "ratings_select_own" on public.ratings;
create policy "ratings_select_own"
on public.ratings
for select
using (user_id = public.requesting_user_id());

drop policy if exists "ratings_select_admin" on public.ratings;
create policy "ratings_select_admin"
on public.ratings
for select
using (public.is_subflix_admin());

drop policy if exists "ratings_select_authenticated" on public.ratings;
create policy "ratings_select_authenticated"
on public.ratings
for select
using (public.requesting_user_id() is not null);

drop policy if exists "ratings_insert_own" on public.ratings;
create policy "ratings_insert_own"
on public.ratings
for insert
with check (user_id = public.requesting_user_id());

drop policy if exists "ratings_update_own" on public.ratings;
create policy "ratings_update_own"
on public.ratings
for update
using (user_id = public.requesting_user_id())
with check (user_id = public.requesting_user_id());

drop policy if exists "ratings_delete_own" on public.ratings;
create policy "ratings_delete_own"
on public.ratings
for delete
using (user_id = public.requesting_user_id());

drop policy if exists "friendships_select_own" on public.friendships;
create policy "friendships_select_own"
on public.friendships
for select
using (user_id = public.requesting_user_id());

drop policy if exists "friendships_select_admin" on public.friendships;
create policy "friendships_select_admin"
on public.friendships
for select
using (public.is_subflix_admin());

drop policy if exists "friendships_insert_own" on public.friendships;
create policy "friendships_insert_own"
on public.friendships
for insert
with check (user_id = public.requesting_user_id());

drop policy if exists "friendships_update_own" on public.friendships;
create policy "friendships_update_own"
on public.friendships
for update
using (user_id = public.requesting_user_id())
with check (user_id = public.requesting_user_id());

drop policy if exists "friendships_delete_own" on public.friendships;
create policy "friendships_delete_own"
on public.friendships
for delete
using (user_id = public.requesting_user_id());

drop policy if exists "social_activity_select_network" on public.social_activity;
create policy "social_activity_select_network"
on public.social_activity
for select
using (
  user_id = public.requesting_user_id()
  or public.is_subflix_admin()
  or exists (
    select 1
    from public.friendships
    where friendships.user_id = public.requesting_user_id()
      and lower(friendships.friend_email) = lower(social_activity.actor_email)
      and coalesce(friendships.status, 'accepted') = 'accepted'
  )
);

drop policy if exists "social_activity_select_authenticated" on public.social_activity;
create policy "social_activity_select_authenticated"
on public.social_activity
for select
using (public.requesting_user_id() is not null);

drop policy if exists "social_activity_insert_own" on public.social_activity;
create policy "social_activity_insert_own"
on public.social_activity
for insert
with check (user_id = public.requesting_user_id());

drop policy if exists "social_activity_update_own" on public.social_activity;
create policy "social_activity_update_own"
on public.social_activity
for update
using (user_id = public.requesting_user_id())
with check (user_id = public.requesting_user_id());

drop policy if exists "social_activity_delete_own" on public.social_activity;
create policy "social_activity_delete_own"
on public.social_activity
for delete
using (user_id = public.requesting_user_id());

drop policy if exists "comments_select_authenticated" on public.comments;
create policy "comments_select_authenticated"
on public.comments
for select
using (public.requesting_user_id() is not null);

drop policy if exists "comments_select_admin" on public.comments;
create policy "comments_select_admin"
on public.comments
for select
using (public.is_subflix_admin());

drop policy if exists "comments_insert_own" on public.comments;
create policy "comments_insert_own"
on public.comments
for insert
with check (user_id = public.requesting_user_id());

drop policy if exists "comments_update_own" on public.comments;
create policy "comments_update_own"
on public.comments
for update
using (user_id = public.requesting_user_id())
with check (user_id = public.requesting_user_id());

drop policy if exists "comments_delete_own" on public.comments;
create policy "comments_delete_own"
on public.comments
for delete
using (user_id = public.requesting_user_id() or public.is_subflix_admin());

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
