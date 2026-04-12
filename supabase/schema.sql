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

create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  requester_user_id text not null default public.requesting_user_id(),
  requester_email text not null default public.requesting_user_email(),
  requester_name text,
  requester_avatar_url text,
  addressee_email text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'cancelled', 'blocked', 'removed')),
  pair_key text generated always as (
    least(lower(requester_email), lower(addressee_email)) || '::' ||
    greatest(lower(requester_email), lower(addressee_email))
  ) stored,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists friend_requests_active_pair_unique
on public.friend_requests (pair_key)
where status in ('pending', 'accepted');

create index if not exists friend_requests_addressee_email_idx
on public.friend_requests (lower(addressee_email));

create table if not exists public.user_presence (
  user_id text primary key default public.requesting_user_id(),
  user_email text unique not null default public.requesting_user_email(),
  active_profile_id text,
  active_profile_name text,
  avatar_url text,
  status text not null default 'online' check (status in ('online', 'away', 'offline')),
  last_seen_at timestamptz not null default timezone('utc', now()),
  watching_tmdb_id integer,
  watching_media_type text,
  watching_title text,
  watching_poster_path text,
  watching_started_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists user_presence_email_idx
on public.user_presence (lower(user_email));

create table if not exists public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  thread_type text not null default 'dm' check (thread_type in ('dm', 'group')),
  title text,
  created_by_email text not null default public.requesting_user_email(),
  dm_key text,
  last_message_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists chat_threads_dm_key_unique
on public.chat_threads (dm_key)
where dm_key is not null;

create table if not exists public.chat_thread_members (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  member_email text not null,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (thread_id, member_email)
);

create index if not exists chat_thread_members_member_email_idx
on public.chat_thread_members (lower(member_email));

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  sender_email text not null default public.requesting_user_email(),
  sender_name text,
  sender_avatar_url text,
  message_text text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists chat_messages_thread_id_created_at_idx
on public.chat_messages (thread_id, created_at desc);

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

create table if not exists public.user_preferences (
  user_id text primary key default public.requesting_user_id(),
  app_theme text not null default 'netflix' check (app_theme in ('netflix', 'hulu')),
  presence_visibility text not null default 'public',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_preferences_presence_visibility_check'
  ) then
    alter table public.user_preferences
      add constraint user_preferences_presence_visibility_check
      check (presence_visibility in ('public', 'friends', 'off'));
  end if;
end $$;

create table if not exists public.profile_avatar_assets (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  asset_kind text not null check (asset_kind in ('builtin', 'upload')),
  storage_path text not null,
  public_url text not null,
  label text,
  legacy_avatar_index integer,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles
  add column if not exists is_kids boolean not null default false,
  add column if not exists maturity_rating text not null default 'all',
  add column if not exists avatar_asset_id uuid references public.profile_avatar_assets(id) on delete set null,
  add column if not exists avatar_asset_url text,
  add column if not exists avatar_asset_label text;

alter table public.profile_avatar_assets
  add column if not exists legacy_avatar_index integer,
  add column if not exists is_active boolean not null default true;

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
create index if not exists profile_avatar_assets_user_lookup_idx on public.profile_avatar_assets (user_id, asset_kind, is_active);
create unique index if not exists profile_avatar_assets_storage_path_idx on public.profile_avatar_assets (storage_path);

alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.profile_avatar_assets enable row level security;
alter table public.watchlist enable row level security;
alter table public.watch_history enable row level security;
alter table public.ratings enable row level security;
alter table public.friendships enable row level security;
alter table public.friend_requests enable row level security;
alter table public.social_activity enable row level security;
alter table public.comments enable row level security;
alter table public.user_presence enable row level security;
alter table public.chat_threads enable row level security;
alter table public.chat_thread_members enable row level security;
alter table public.chat_messages enable row level security;
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

drop policy if exists "user_preferences_select_own" on public.user_preferences;
create policy "user_preferences_select_own"
on public.user_preferences
for select
using (user_id = public.requesting_user_id());

drop policy if exists "user_preferences_insert_own" on public.user_preferences;
create policy "user_preferences_insert_own"
on public.user_preferences
for insert
with check (user_id = public.requesting_user_id());

drop policy if exists "user_preferences_update_own" on public.user_preferences;
create policy "user_preferences_update_own"
on public.user_preferences
for update
using (user_id = public.requesting_user_id())
with check (user_id = public.requesting_user_id());

drop policy if exists "profile_avatar_assets_select_active" on public.profile_avatar_assets;
create policy "profile_avatar_assets_select_active"
on public.profile_avatar_assets
for select
using (
  is_active = true
  and (
    user_id is null
    or user_id = public.requesting_user_id()
    or public.requesting_user_id() is not null
  )
);

drop policy if exists "profile_avatar_assets_insert_own" on public.profile_avatar_assets;
create policy "profile_avatar_assets_insert_own"
on public.profile_avatar_assets
for insert
with check (
  (
    user_id = public.requesting_user_id()
    and asset_kind = 'upload'
  )
  or public.is_subflix_admin()
);

drop policy if exists "profile_avatar_assets_update_own" on public.profile_avatar_assets;
create policy "profile_avatar_assets_update_own"
on public.profile_avatar_assets
for update
using (
  (
    user_id = public.requesting_user_id()
    and asset_kind = 'upload'
  )
  or public.is_subflix_admin()
)
with check (
  (
    user_id = public.requesting_user_id()
    and asset_kind = 'upload'
  )
  or public.is_subflix_admin()
);

drop policy if exists "profile_avatar_assets_delete_own" on public.profile_avatar_assets;
create policy "profile_avatar_assets_delete_own"
on public.profile_avatar_assets
for delete
using (
  (
    user_id = public.requesting_user_id()
    and asset_kind = 'upload'
  )
  or public.is_subflix_admin()
);

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

drop policy if exists "friend_requests_select_involved" on public.friend_requests;
create policy "friend_requests_select_involved"
on public.friend_requests
for select
using (
  public.is_subflix_admin()
  or lower(requester_email) = public.requesting_user_email()
  or lower(addressee_email) = public.requesting_user_email()
);

drop policy if exists "friend_requests_insert_requester" on public.friend_requests;
create policy "friend_requests_insert_requester"
on public.friend_requests
for insert
with check (
  lower(requester_email) = public.requesting_user_email()
  and lower(addressee_email) <> public.requesting_user_email()
  and status = 'pending'
);

drop policy if exists "friend_requests_update_involved" on public.friend_requests;
create policy "friend_requests_update_involved"
on public.friend_requests
for update
using (
  public.is_subflix_admin()
  or lower(requester_email) = public.requesting_user_email()
  or lower(addressee_email) = public.requesting_user_email()
)
with check (
  public.is_subflix_admin()
  or lower(requester_email) = public.requesting_user_email()
  or lower(addressee_email) = public.requesting_user_email()
);

drop policy if exists "friend_requests_delete_involved" on public.friend_requests;
create policy "friend_requests_delete_involved"
on public.friend_requests
for delete
using (
  public.is_subflix_admin()
  or lower(requester_email) = public.requesting_user_email()
  or lower(addressee_email) = public.requesting_user_email()
);

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

drop policy if exists "user_presence_select_network" on public.user_presence;
create policy "user_presence_select_network"
on public.user_presence
for select
using (
  public.is_subflix_admin()
  or user_id = public.requesting_user_id()
  or (
    public.requesting_user_id() is not null
    and coalesce((
      select up.presence_visibility
      from public.user_preferences up
      where up.user_id = user_presence.user_id
    ), 'public') = 'public'
  )
  or (
    public.requesting_user_id() is not null
    and coalesce((
      select up.presence_visibility
      from public.user_preferences up
      where up.user_id = user_presence.user_id
    ), 'public') = 'friends'
    and exists (
      select 1
      from public.friend_requests fr
      where fr.status = 'accepted'
        and fr.pair_key = (
          least(public.requesting_user_email(), lower(user_presence.user_email)) || '::' ||
          greatest(public.requesting_user_email(), lower(user_presence.user_email))
        )
    )
  )
);

drop policy if exists "user_presence_insert_own" on public.user_presence;
create policy "user_presence_insert_own"
on public.user_presence
for insert
with check (user_id = public.requesting_user_id());

drop policy if exists "user_presence_update_own" on public.user_presence;
create policy "user_presence_update_own"
on public.user_presence
for update
using (user_id = public.requesting_user_id())
with check (user_id = public.requesting_user_id());

drop policy if exists "user_presence_delete_own" on public.user_presence;
create policy "user_presence_delete_own"
on public.user_presence
for delete
using (user_id = public.requesting_user_id());

drop policy if exists "chat_threads_select_member" on public.chat_threads;
create policy "chat_threads_select_member"
on public.chat_threads
for select
using (
  public.is_subflix_admin()
  or exists (
    select 1
    from public.chat_thread_members m
    where m.thread_id = chat_threads.id
      and lower(m.member_email) = public.requesting_user_email()
  )
);

drop policy if exists "chat_threads_insert_authenticated" on public.chat_threads;
create policy "chat_threads_insert_authenticated"
on public.chat_threads
for insert
with check (public.requesting_user_id() is not null);

drop policy if exists "chat_threads_update_owner_admin" on public.chat_threads;
create policy "chat_threads_update_owner_admin"
on public.chat_threads
for update
using (
  public.is_subflix_admin()
  or exists (
    select 1
    from public.chat_thread_members m
    where m.thread_id = chat_threads.id
      and lower(m.member_email) = public.requesting_user_email()
      and m.role in ('owner', 'admin')
  )
)
with check (
  public.is_subflix_admin()
  or exists (
    select 1
    from public.chat_thread_members m
    where m.thread_id = chat_threads.id
      and lower(m.member_email) = public.requesting_user_email()
      and m.role in ('owner', 'admin')
  )
);

drop policy if exists "chat_thread_members_select_member" on public.chat_thread_members;
create policy "chat_thread_members_select_member"
on public.chat_thread_members
for select
using (
  public.is_subflix_admin()
  or exists (
    select 1
    from public.chat_thread_members self_m
    where self_m.thread_id = chat_thread_members.thread_id
      and lower(self_m.member_email) = public.requesting_user_email()
  )
);

drop policy if exists "chat_thread_members_insert_owner_admin" on public.chat_thread_members;
create policy "chat_thread_members_insert_owner_admin"
on public.chat_thread_members
for insert
with check (
  public.is_subflix_admin()
  or (
    (
      exists (
        select 1
        from public.chat_thread_members self_m
        where self_m.thread_id = chat_thread_members.thread_id
          and lower(self_m.member_email) = public.requesting_user_email()
          and self_m.role in ('owner', 'admin')
      )
      or exists (
        select 1
        from public.chat_threads t
        where t.id = chat_thread_members.thread_id
          and lower(t.created_by_email) = public.requesting_user_email()
      )
    )
    and (
      lower(chat_thread_members.member_email) = public.requesting_user_email()
      or exists (
        select 1
        from public.friend_requests fr
        where fr.status = 'accepted'
          and fr.pair_key = (
            least(public.requesting_user_email(), lower(chat_thread_members.member_email)) || '::' ||
            greatest(public.requesting_user_email(), lower(chat_thread_members.member_email))
          )
      )
    )
  )
);

drop policy if exists "chat_thread_members_delete_self_or_owner_admin" on public.chat_thread_members;
create policy "chat_thread_members_delete_self_or_owner_admin"
on public.chat_thread_members
for delete
using (
  public.is_subflix_admin()
  or lower(chat_thread_members.member_email) = public.requesting_user_email()
  or exists (
    select 1
    from public.chat_thread_members self_m
    where self_m.thread_id = chat_thread_members.thread_id
      and lower(self_m.member_email) = public.requesting_user_email()
      and self_m.role in ('owner', 'admin')
  )
);

drop policy if exists "chat_messages_select_member" on public.chat_messages;
create policy "chat_messages_select_member"
on public.chat_messages
for select
using (
  public.is_subflix_admin()
  or exists (
    select 1
    from public.chat_thread_members m
    where m.thread_id = chat_messages.thread_id
      and lower(m.member_email) = public.requesting_user_email()
  )
);

drop policy if exists "chat_messages_insert_member" on public.chat_messages;
create policy "chat_messages_insert_member"
on public.chat_messages
for insert
with check (
  lower(sender_email) = public.requesting_user_email()
  and exists (
    select 1
    from public.chat_thread_members m
    where m.thread_id = chat_messages.thread_id
      and lower(m.member_email) = public.requesting_user_email()
  )
);

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

insert into storage.buckets (id, name, public)
values ('profile-avatars', 'profile-avatars', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "profile_avatars_public_read" on storage.objects;
create policy "profile_avatars_public_read"
on storage.objects
for select
using (bucket_id = 'profile-avatars');

drop policy if exists "profile_avatars_insert_own" on storage.objects;
create policy "profile_avatars_insert_own"
on storage.objects
for insert
with check (
  bucket_id = 'profile-avatars'
  and (
    public.is_subflix_admin()
    or name like 'users/' || public.requesting_user_id() || '/%'
    or name like 'system/%'
  )
);

drop policy if exists "profile_avatars_update_own" on storage.objects;
create policy "profile_avatars_update_own"
on storage.objects
for update
using (
  bucket_id = 'profile-avatars'
  and (
    public.is_subflix_admin()
    or name like 'users/' || public.requesting_user_id() || '/%'
    or name like 'system/%'
  )
)
with check (
  bucket_id = 'profile-avatars'
  and (
    public.is_subflix_admin()
    or name like 'users/' || public.requesting_user_id() || '/%'
    or name like 'system/%'
  )
);

drop policy if exists "profile_avatars_delete_own" on storage.objects;
create policy "profile_avatars_delete_own"
on storage.objects
for delete
using (
  bucket_id = 'profile-avatars'
  and (
    public.is_subflix_admin()
    or name like 'users/' || public.requesting_user_id() || '/%'
  )
);
