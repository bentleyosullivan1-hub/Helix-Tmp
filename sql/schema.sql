-- Helix chat schema.
-- Run this in the Supabase SQL editor (Project -> SQL Editor -> New query).
-- Matches exactly what lab.html reads/writes — table and column names
-- must stay in sync with the client code in lab.html.

-- ============================================================
-- CHANNELS
-- ============================================================
create table if not exists chat_channels (
  id         bigint generated always as identity primary key,
  name       text not null,
  icon       text not null default '💬',
  position   int  not null default 0
);

alter table chat_channels enable row level security;

drop policy if exists "channels are readable by anyone" on chat_channels;
create policy "channels are readable by anyone"
  on chat_channels for select
  using (true);

-- seed at least one channel — loadChannels() falls back to offline
-- mode entirely if this table is empty.
insert into chat_channels (name, icon, position)
select 'general', '💬', 0
where not exists (select 1 from chat_channels);

-- ============================================================
-- PROFILES (one row per auth user, including anonymous ones)
-- ============================================================
create table if not exists chat_profiles (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  username      text not null unique,
  avatar_seed   text not null,
  is_moderator  boolean not null default false,
  is_premium    boolean not null default false,
  created_at    timestamptz not null default now()
);

alter table chat_profiles enable row level security;

drop policy if exists "profiles are readable by anyone" on chat_profiles;
create policy "profiles are readable by anyone"
  on chat_profiles for select
  using (true);

drop policy if exists "users can create their own profile" on chat_profiles;
create policy "users can create their own profile"
  on chat_profiles for insert
  with check (auth.uid() = user_id);

-- users may edit their own row (e.g. username changes), but NOT the
-- is_premium / is_moderator flags — those are only ever written by
-- the admin API using the service-role key, which bypasses RLS.
drop policy if exists "users can update their own profile" on chat_profiles;
create policy "users can update their own profile"
  on chat_profiles for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and is_premium   = (select is_premium   from chat_profiles where user_id = auth.uid())
    and is_moderator = (select is_moderator from chat_profiles where user_id = auth.uid())
  );

-- ============================================================
-- MESSAGES
-- ============================================================
create table if not exists chat_messages (
  id           bigint generated always as identity primary key,
  channel_id   bigint not null references chat_channels(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  username     text not null,
  avatar_seed  text not null,
  message      text not null check (char_length(message) <= 500),
  created_at   timestamptz not null default now()
);

create index if not exists chat_messages_channel_created_idx
  on chat_messages (channel_id, created_at);

alter table chat_messages enable row level security;

drop policy if exists "messages are readable by anyone" on chat_messages;
create policy "messages are readable by anyone"
  on chat_messages for select
  using (true);

drop policy if exists "authenticated users can post as themselves" on chat_messages;
create policy "authenticated users can post as themselves"
  on chat_messages for insert
  with check (auth.uid() = user_id);

drop policy if exists "authors and moderators can delete messages" on chat_messages;
create policy "authors and moderators can delete messages"
  on chat_messages for delete
  using (
    auth.uid() = user_id
    or exists (
      select 1 from chat_profiles
      where chat_profiles.user_id = auth.uid()
        and chat_profiles.is_moderator = true
    )
  );

-- ============================================================
-- REALTIME
-- ============================================================
-- lab.html subscribes to postgres_changes on chat_messages (INSERT
-- and DELETE) plus presence/broadcast on a per-channel realtime
-- channel. The table has to be added to the supabase_realtime
-- publication or live messages simply won't appear without a reload.
alter publication supabase_realtime add table chat_messages;
