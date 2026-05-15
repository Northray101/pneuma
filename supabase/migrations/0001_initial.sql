-- Pneuma initial schema

create extension if not exists "pgcrypto";

-- ─── USER PROFILES ───────────────────────────────────────────────────────────
create table public.user_profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  timezone     text not null default 'UTC',
  preferences  jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.user_profiles enable row level security;
create policy "owner only" on public.user_profiles for all using (auth.uid() = id);

-- ─── DEVICES ─────────────────────────────────────────────────────────────────
create table public.devices (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  platform     text not null check (platform in ('mac', 'windows', 'cli')),
  fingerprint  text not null,
  last_seen_at timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  unique(user_id, fingerprint)
);

alter table public.devices enable row level security;
create policy "owner only" on public.devices for all using (auth.uid() = user_id);

-- ─── CONVERSATIONS ───────────────────────────────────────────────────────────
create table public.conversations (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references auth.users(id) on delete cascade,
  device_id uuid references public.devices(id) on delete set null,
  title     text,
  archived  boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.conversations enable row level security;
create policy "owner only" on public.conversations for all using (auth.uid() = user_id);

-- ─── MESSAGES ────────────────────────────────────────────────────────────────
create type public.message_role as enum ('user', 'assistant');

create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  role            public.message_role not null,
  content         text not null,
  tokens_used     int,
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

alter table public.messages enable row level security;
create policy "owner only" on public.messages for all using (auth.uid() = user_id);

create index messages_conversation_created on public.messages(conversation_id, created_at);
create index messages_user_created on public.messages(user_id, created_at);

-- ─── MEMORIES ────────────────────────────────────────────────────────────────
create type public.memory_kind as enum ('fact', 'preference', 'habit', 'instruction', 'context');

create table public.memories (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  kind          public.memory_kind not null,
  content       text not null,
  source_msg_id uuid references public.messages(id) on delete set null,
  importance    int not null default 5 check (importance between 1 and 10),
  last_used_at  timestamptz,
  expires_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.memories enable row level security;
create policy "owner only" on public.memories for all using (auth.uid() = user_id);

create index memories_user_importance on public.memories(user_id, importance desc);
create index memories_user_kind on public.memories(user_id, kind);

-- ─── SYNC CURSORS ────────────────────────────────────────────────────────────
create table public.sync_cursors (
  device_id       uuid primary key references public.devices(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  last_message_at timestamptz not null default to_timestamp(0),
  last_memory_at  timestamptz not null default to_timestamp(0),
  updated_at      timestamptz not null default now()
);

alter table public.sync_cursors enable row level security;
create policy "owner only" on public.sync_cursors for all using (auth.uid() = user_id);

-- ─── REALTIME ────────────────────────────────────────────────────────────────
-- Enable realtime on tables that need live sync across devices.
-- Run in Supabase dashboard: Realtime > Tables > enable for messages, memories.
-- Or via SQL:
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.memories;
