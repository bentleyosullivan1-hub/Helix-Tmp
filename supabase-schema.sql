-- ============================================================
-- HELIX — schema for chat profiles, channels, messages, premium
-- Safe to run multiple times (uses IF NOT EXISTS / OR REPLACE).
-- Run this in Supabase → SQL Editor.
-- ============================================================

-- PROFILES ---------------------------------------------------
create table if not exists chat_profiles (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  username      text not null,
  avatar_seed   text,
  is_moderator  boolean not null default false,
  is_premium    boolean not null default false,
  premium_since timestamptz,
  created_at    timestamptz not null default now()
);

-- add columns if this table already existed without them
alter table chat_profiles add column if not exists is_premium boolean not null default false;
alter table chat_profiles add column if not exists premium_since timestamptz;

-- CHANNELS -----------------------------------------------------
-- NOTE: "icon" is used by lab.html when rendering the channel list
-- (channel.icon) — keep it even though it's cosmetic.
create table if not exists chat_channels (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  name          text not null,
  topic         text,
  icon          text default '#',
  position      int not null default 0,
  premium_only  boolean not null default false,
  created_at    timestamptz not null default now()
);

alter table chat_channels add column if not exists premium_only boolean not null default false;
alter table chat_channels add column if not exists icon text default '#';

insert into chat_channels (slug, name, topic, icon, position, premium_only)
values
  ('general', 'general', 'Welcome to Helix Global Chat', '#', 0, false),
  ('vip-lounge', 'vip-lounge', 'Premium members only', '✦', 1, true)
on conflict (slug) do nothing;

-- MESSAGES -----------------------------------------------------
-- NOTE: column names (message, avatar_seed) match what lab.html
-- already inserts/selects — don't rename these.
create table if not exists chat_messages (
  id           uuid primary key default gen_random_uuid(),
  channel_id   uuid not null references chat_channels(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  username     text not null,
  avatar_seed  text,
  message      text not null check (char_length(message) between 1 and 2000),
  created_at   timestamptz not null default now()
);

create index if not exists chat_messages_channel_idx on chat_messages (channel_id, created_at);

-- ROW LEVEL SECURITY --------------------------------------------
alter table chat_profiles enable row level security;
alter table chat_channels enable row level security;
alter table chat_messages enable row level security;

-- profiles: anyone can read; a user can only insert/update their own row.
-- NOTE: is_premium is NOT editable by users — it's only ever changed
-- server-side by /api/admin/set-premium.js using the service-role key,
-- which bypasses RLS entirely. There is intentionally no "update own
-- profile" policy that includes is_premium.
drop policy if exists "profiles are readable" on chat_profiles;
create policy "profiles are readable" on chat_profiles for select using (true);

drop policy if exists "users insert own profile" on chat_profiles;
create policy "users insert own profile" on chat_profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "users update own username" on chat_profiles;
create policy "users update own username" on chat_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- channels: everyone can read the channel list (client hides/locks
-- premium_only ones in the UI; real enforcement is the messages policy below).
drop policy if exists "channels are readable" on chat_channels;
create policy "channels are readable" on chat_channels for select using (true);

-- messages: anyone can read general messages; only premium users can
-- read/write in a premium_only channel. This is enforced in the database,
-- not just the UI.
drop policy if exists "messages readable if allowed" on chat_messages;
create policy "messages readable if allowed" on chat_messages for select
  using (
    channel_id in (
      select id from chat_channels
      where premium_only = false
         or exists (
           select 1 from chat_profiles
           where chat_profiles.user_id = auth.uid()
             and chat_profiles.is_premium = true
         )
    )
  );

drop policy if exists "messages insertable if allowed" on chat_messages;
create policy "messages insertable if allowed" on chat_messages for insert
  with check (
    auth.uid() = user_id
    and channel_id in (
      select id from chat_channels
      where premium_only = false
         or exists (
           select 1 from chat_profiles
           where chat_profiles.user_id = auth.uid()
             and chat_profiles.is_premium = true
         )
    )
  );

-- REALTIME -------------------------------------------------------
-- Enable realtime on chat_messages (Supabase dashboard → Database →
-- Replication → also works via this, if the publication exists):
alter publication supabase_realtime add table chat_messages;
