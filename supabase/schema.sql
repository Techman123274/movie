create table if not exists public.users (
  id text primary key,
  email text unique,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id text primary key,
  user_id text not null references public.users(id) on delete cascade,
  name text not null,
  avatar text not null,
  accent text not null,
  maturity_rating text not null default 'TV-14',
  provider_region text not null default 'US',
  created_at timestamptz not null default now()
);

create table if not exists public.watchlists (
  id bigint generated always as identity primary key,
  profile_id text not null references public.profiles(id) on delete cascade,
  media_id bigint not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  added_at timestamptz not null default now()
);

create table if not exists public.watch_progress (
  id bigint generated always as identity primary key,
  profile_id text not null references public.profiles(id) on delete cascade,
  media_id bigint not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  season_number integer,
  episode_number integer,
  progress_seconds integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.watch_history (
  id bigint generated always as identity primary key,
  profile_id text not null references public.profiles(id) on delete cascade,
  media_id bigint not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  season_number integer,
  episode_number integer,
  watched_at timestamptz not null default now()
);
