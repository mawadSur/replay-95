create extension if not exists pgcrypto;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  hometown text not null,
  birth_year integer not null check (birth_year between 1980 and 1995),
  console_choice text not null,
  mall_store text not null,
  channel_block text not null,
  dream_concert text not null,
  music_mood text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.avatar_choices (
  user_id uuid primary key references public.profiles (user_id) on delete cascade,
  outfit text not null,
  trapper_pattern text not null,
  bracelet_color text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  friend_id uuid not null references public.profiles (user_id) on delete cascade,
  status text not null check (status in ('pending', 'accepted', 'blocked')),
  source text not null default 'invite_code',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, friend_id),
  check (user_id <> friend_id)
);

create table if not exists public.daily_episodes (
  id uuid primary key default gen_random_uuid(),
  theme_slug text not null,
  title text not null,
  subtitle text not null,
  unlock_at timestamptz not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'retired')),
  personalization_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.episode_media_items (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.daily_episodes (id) on delete cascade,
  media_type text not null check (media_type in ('image', 'audio', 'video', 'copy_only')),
  storage_path text,
  duration_seconds integer,
  rights_status text not null default 'owned' check (rights_status in ('owned', 'licensed', 'partner_cleared', 'public_domain')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.episode_prompts (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.daily_episodes (id) on delete cascade,
  prompt_order integer not null,
  prompt_text text not null,
  response_type text not null check (response_type in ('text', 'voice')),
  created_at timestamptz not null default timezone('utc', now()),
  unique (episode_id, prompt_order)
);

create table if not exists public.episode_responses (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.daily_episodes (id) on delete cascade,
  prompt_id uuid references public.episode_prompts (id) on delete set null,
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  response_type text not null check (response_type in ('text', 'voice')),
  text_body text,
  media_path text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (
    (response_type = 'text' and text_body is not null)
    or (response_type = 'voice' and media_path is not null)
  )
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (user_id) on delete cascade,
  recipient_id uuid not null references public.profiles (user_id) on delete cascade,
  paper_style text not null,
  body text not null check (char_length(body) <= 140),
  scheduled_for timestamptz not null,
  delivered_at timestamptz,
  status text not null default 'queued' check (status in ('queued', 'delivered', 'blocked')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (sender_id <> recipient_id)
);

create table if not exists public.quests (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  weekend_label text not null,
  reward_pogs integer not null check (reward_pogs >= 0),
  unlockable_name text not null,
  active_from timestamptz not null,
  active_to timestamptz not null,
  is_published boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.quest_steps (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid not null references public.quests (id) on delete cascade,
  step_order integer not null,
  prompt_text text not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (quest_id, step_order)
);

create table if not exists public.quest_completions (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid not null references public.quests (id) on delete cascade,
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  completed_at timestamptz not null default timezone('utc', now()),
  reward_claimed_at timestamptz,
  unique (quest_id, user_id)
);

create table if not exists public.pog_wallets (
  user_id uuid primary key references public.profiles (user_id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.unlockables (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null,
  pog_cost integer not null default 0 check (pog_cost >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  unlockable_id uuid not null references public.unlockables (id) on delete cascade,
  source text not null,
  acquired_at timestamptz not null default timezone('utc', now()),
  unique (user_id, unlockable_id)
);

create table if not exists public.subscription_status (
  user_id uuid primary key references public.profiles (user_id) on delete cascade,
  provider text not null default 'revenuecat',
  plan_code text,
  status text not null default 'free' check (status in ('free', 'trialing', 'active', 'past_due', 'canceled')),
  expires_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.notification_preferences (
  user_id uuid primary key references public.profiles (user_id) on delete cascade,
  timezone text not null default 'America/New_York',
  nightly_delivery_time time not null default '19:00',
  daily_enabled boolean not null default true,
  weekend_quest_enabled boolean not null default true,
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists daily_episodes_unlock_at_idx on public.daily_episodes (unlock_at desc);
create index if not exists episode_prompts_episode_id_idx on public.episode_prompts (episode_id, prompt_order);
create index if not exists episode_responses_user_id_idx on public.episode_responses (user_id, created_at desc);
create index if not exists notes_delivery_idx on public.notes (status, scheduled_for);
create index if not exists friendships_user_idx on public.friendships (user_id, status);
create index if not exists quest_completions_user_idx on public.quest_completions (user_id, completed_at desc);

create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute procedure public.touch_updated_at();

create trigger avatar_choices_touch_updated_at
before update on public.avatar_choices
for each row execute procedure public.touch_updated_at();

create trigger friendships_touch_updated_at
before update on public.friendships
for each row execute procedure public.touch_updated_at();

create trigger daily_episodes_touch_updated_at
before update on public.daily_episodes
for each row execute procedure public.touch_updated_at();

create trigger episode_responses_touch_updated_at
before update on public.episode_responses
for each row execute procedure public.touch_updated_at();

create trigger notes_touch_updated_at
before update on public.notes
for each row execute procedure public.touch_updated_at();

create trigger quests_touch_updated_at
before update on public.quests
for each row execute procedure public.touch_updated_at();

create trigger pog_wallets_touch_updated_at
before update on public.pog_wallets
for each row execute procedure public.touch_updated_at();

create trigger unlockables_touch_updated_at
before update on public.unlockables
for each row execute procedure public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.avatar_choices enable row level security;
alter table public.friendships enable row level security;
alter table public.daily_episodes enable row level security;
alter table public.episode_media_items enable row level security;
alter table public.episode_prompts enable row level security;
alter table public.episode_responses enable row level security;
alter table public.notes enable row level security;
alter table public.quests enable row level security;
alter table public.quest_steps enable row level security;
alter table public.quest_completions enable row level security;
alter table public.pog_wallets enable row level security;
alter table public.unlockables enable row level security;
alter table public.inventory_items enable row level security;
alter table public.subscription_status enable row level security;
alter table public.notification_preferences enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = user_id);

create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = user_id);

create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "avatar_choices_manage_own"
on public.avatar_choices
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "friendships_select_related"
on public.friendships
for select
using (auth.uid() = user_id or auth.uid() = friend_id);

create policy "friendships_insert_sender"
on public.friendships
for insert
with check (auth.uid() = user_id);

create policy "friendships_update_related"
on public.friendships
for update
using (auth.uid() = user_id or auth.uid() = friend_id)
with check (auth.uid() = user_id or auth.uid() = friend_id);

create policy "daily_episodes_read_published"
on public.daily_episodes
for select
using (status = 'published');

create policy "episode_media_items_read_published_episode"
on public.episode_media_items
for select
using (
  exists (
    select 1
    from public.daily_episodes
    where daily_episodes.id = episode_media_items.episode_id
      and daily_episodes.status = 'published'
  )
);

create policy "episode_prompts_read_published_episode"
on public.episode_prompts
for select
using (
  exists (
    select 1
    from public.daily_episodes
    where daily_episodes.id = episode_prompts.episode_id
      and daily_episodes.status = 'published'
  )
);

create policy "episode_responses_manage_own"
on public.episode_responses
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "notes_select_related"
on public.notes
for select
using (auth.uid() = sender_id or auth.uid() = recipient_id);

create policy "notes_insert_sender"
on public.notes
for insert
with check (auth.uid() = sender_id);

create policy "notes_update_related"
on public.notes
for update
using (auth.uid() = sender_id or auth.uid() = recipient_id)
with check (auth.uid() = sender_id or auth.uid() = recipient_id);

create policy "quests_read_published"
on public.quests
for select
using (is_published = true);

create policy "quest_steps_read_published"
on public.quest_steps
for select
using (
  exists (
    select 1
    from public.quests
    where quests.id = quest_steps.quest_id
      and quests.is_published = true
  )
);

create policy "quest_completions_manage_own"
on public.quest_completions
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "pog_wallets_manage_own"
on public.pog_wallets
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "unlockables_read_all"
on public.unlockables
for select
using (true);

create policy "inventory_items_manage_own"
on public.inventory_items
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "subscription_status_manage_own"
on public.subscription_status
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "notification_preferences_manage_own"
on public.notification_preferences
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
