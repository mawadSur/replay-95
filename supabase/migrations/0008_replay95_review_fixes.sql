-- 0008_replay95_review_fixes.sql
-- Schema and RPC fixes surfaced by the per-segment review agents.
-- Idempotent: safe to re-run.

-- =====================================================================
-- 1. episode_media_items.position + ordering tie-break
-- =====================================================================

alter table public.episode_media_items
  add column if not exists position integer;

update public.episode_media_items target
set position = ranked.row_number
from (
  select id, row_number() over (
    partition by episode_id
    order by created_at, id
  ) - 1 as row_number
  from public.episode_media_items
) ranked
where target.id = ranked.id
  and target.position is null;

alter table public.episode_media_items
  alter column position set default 0,
  alter column position set not null;

create unique index if not exists episode_media_items_episode_position_idx
  on public.episode_media_items (episode_id, position);

-- =====================================================================
-- 2. Stagger 0007 day-1 unlock to avoid colliding with 0003 first-night row
-- =====================================================================

update public.daily_episodes
set unlock_at = unlock_at + interval '1 hour'
where theme_slug = 'blank-tape-warmup-day-001'
  and unlock_at = (
    select unlock_at
    from public.daily_episodes
    where theme_slug = 'blank-tape-warmup'
    limit 1
  );

-- =====================================================================
-- 3. quests.unlockable_id FK (lookup by id, not by name)
-- =====================================================================

alter table public.quests
  add column if not exists unlockable_id uuid references public.unlockables (id) on delete set null;

update public.quests q
set unlockable_id = u.id
from public.unlockables u
where q.unlockable_id is null
  and u.name = q.unlockable_name;

create index if not exists quests_unlockable_id_idx
  on public.quests (unlockable_id);

-- =====================================================================
-- 4. friendships.source check constraint (extends to pen_pal_match)
-- =====================================================================

alter table public.friendships
  drop constraint if exists friendships_source_check;
alter table public.friendships
  add constraint friendships_source_check
  check (source in ('invite_code', 'pen_pal_match'));

-- =====================================================================
-- 5. note_reports retention: snapshot survives note/profile deletes
-- =====================================================================

alter table public.note_reports
  drop constraint if exists note_reports_note_id_fkey,
  drop constraint if exists note_reports_reporter_id_fkey,
  drop constraint if exists note_reports_reported_user_id_fkey;

alter table public.note_reports
  alter column note_id drop not null,
  alter column reporter_id drop not null,
  alter column reported_user_id drop not null;

alter table public.note_reports
  add constraint note_reports_note_id_fkey
    foreign key (note_id) references public.notes (id) on delete set null,
  add constraint note_reports_reporter_id_fkey
    foreign key (reporter_id) references public.profiles (user_id) on delete set null,
  add constraint note_reports_reported_user_id_fkey
    foreign key (reported_user_id) references public.profiles (user_id) on delete set null;

-- =====================================================================
-- 6. beta_admins table (admin gate for dashboard / analytics route)
-- =====================================================================

create table if not exists public.beta_admins (
  user_id uuid primary key references public.profiles (user_id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.beta_admins enable row level security;

drop policy if exists "beta_admins_self_read" on public.beta_admins;
create policy "beta_admins_self_read"
on public.beta_admins
for select
to authenticated
using (user_id = auth.uid());

create or replace function public.is_beta_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.beta_admins
    where beta_admins.user_id = auth.uid()
  );
$$;

grant execute on function public.is_beta_admin() to authenticated;

-- =====================================================================
-- 7. profiles RLS: collapse to single select policy that excludes blocked pairs
-- =====================================================================

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_select_related_friends" on public.profiles;

create policy "profiles_select_self_or_accepted_friend"
on public.profiles
for select
to authenticated
using (
  user_id = auth.uid()
  or (
    exists (
      select 1
      from public.friendships
      where friendships.status = 'accepted'
        and (
          (friendships.user_id = auth.uid() and friendships.friend_id = profiles.user_id)
          or
          (friendships.friend_id = auth.uid() and friendships.user_id = profiles.user_id)
        )
    )
    and not exists (
      select 1
      from public.friendships blocked
      where blocked.status = 'blocked'
        and (
          (blocked.user_id = auth.uid() and blocked.friend_id = profiles.user_id)
          or
          (blocked.friend_id = auth.uid() and blocked.user_id = profiles.user_id)
        )
    )
  )
);

-- =====================================================================
-- 8. get_tonight_episode: tie-break by created_at desc, order media by position
-- =====================================================================

create or replace function public.get_tonight_episode(
  p_now timestamptz default timezone('utc', now())
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_episode public.daily_episodes%rowtype;
begin
  select *
  into v_episode
  from public.daily_episodes
  where status = 'published'
    and unlock_at <= coalesce(p_now, timezone('utc', now()))
  order by unlock_at desc, created_at desc
  limit 1;

  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'id', v_episode.id,
    'themeSlug', v_episode.theme_slug,
    'title', v_episode.title,
    'subtitle', v_episode.subtitle,
    'unlockAt', v_episode.unlock_at,
    'montageTags', coalesce(v_episode.personalization_payload -> 'montage_tags', '[]'::jsonb),
    'prompts', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', episode_prompts.id,
          'order', episode_prompts.prompt_order,
          'text', episode_prompts.prompt_text,
          'responseType', episode_prompts.response_type
        )
        order by episode_prompts.prompt_order
      )
      from public.episode_prompts
      where episode_prompts.episode_id = v_episode.id
    ), '[]'::jsonb),
    'savedTextResponse', (
      select episode_responses.text_body
      from public.episode_responses
      where episode_responses.episode_id = v_episode.id
        and episode_responses.user_id = v_user_id
        and episode_responses.response_type = 'text'
      order by episode_responses.updated_at desc nulls last, episode_responses.created_at desc
      limit 1
    ),
    'savedResponseId', (
      select episode_responses.id
      from public.episode_responses
      where episode_responses.episode_id = v_episode.id
        and episode_responses.user_id = v_user_id
        and episode_responses.response_type = 'text'
      order by episode_responses.updated_at desc nulls last, episode_responses.created_at desc
      limit 1
    ),
    'mediaItems', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', episode_media_items.id,
          'mediaType', episode_media_items.media_type,
          'storagePath', episode_media_items.storage_path,
          'durationSeconds', episode_media_items.duration_seconds,
          'metadata', episode_media_items.metadata
        )
        order by episode_media_items.position, episode_media_items.created_at
      )
      from public.episode_media_items
      where episode_media_items.episode_id = v_episode.id
    ), '[]'::jsonb)
  );
end;
$$;

-- =====================================================================
-- 9. claim_quest_reward: row-locked wallet upsert + unlockable_id lookup
-- =====================================================================

create or replace function public.claim_quest_reward(p_quest_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_quest public.quests%rowtype;
  v_completion public.quest_completions%rowtype;
  v_unlockable_id uuid;
  v_unlockable_name text;
  v_wallet_balance integer := 0;
  v_total_steps integer := 0;
  v_completed_steps integer := 0;
begin
  if v_user_id is null then
    raise exception 'Authentication is required to claim a quest reward.';
  end if;

  select *
  into v_quest
  from public.quests
  where quests.id = p_quest_id
    and quests.is_published = true
    and quests.active_from <= timezone('utc', now())
    and quests.active_to >= timezone('utc', now());

  if not found then
    raise exception 'Quest is not currently available.';
  end if;

  select count(*)
  into v_total_steps
  from public.quest_steps
  where quest_steps.quest_id = p_quest_id;

  select count(*)
  into v_completed_steps
  from public.quest_step_responses
  where quest_step_responses.quest_id = p_quest_id
    and quest_step_responses.user_id = v_user_id;

  if v_total_steps = 0 or v_completed_steps < v_total_steps then
    raise exception 'Finish all quest steps before claiming the reward.';
  end if;

  insert into public.quest_completions (
    quest_id,
    user_id,
    completed_at,
    reward_claimed_at
  )
  values (
    p_quest_id,
    v_user_id,
    timezone('utc', now()),
    null
  )
  on conflict (quest_id, user_id) do nothing;

  select *
  into v_completion
  from public.quest_completions
  where quest_completions.quest_id = p_quest_id
    and quest_completions.user_id = v_user_id
  for update;

  v_unlockable_id := v_quest.unlockable_id;
  if v_unlockable_id is null and v_quest.unlockable_name is not null then
    select unlockables.id
    into v_unlockable_id
    from public.unlockables
    where unlockables.name = v_quest.unlockable_name
    limit 1;
  end if;

  select unlockables.name
  into v_unlockable_name
  from public.unlockables
  where unlockables.id = v_unlockable_id;

  if v_completion.reward_claimed_at is not null then
    select balance
    into v_wallet_balance
    from public.pog_wallets
    where pog_wallets.user_id = v_user_id;

    return jsonb_build_object(
      'questId', v_quest.id,
      'alreadyClaimed', true,
      'walletBalance', coalesce(v_wallet_balance, 0),
      'unlockableId', v_unlockable_id,
      'unlockableName', coalesce(v_unlockable_name, v_quest.unlockable_name)
    );
  end if;

  -- Row-lock the wallet before mutating it. Two simultaneous claims could
  -- otherwise read the same starting balance and only one increment would land.
  perform 1
  from public.pog_wallets
  where pog_wallets.user_id = v_user_id
  for update;

  insert into public.pog_wallets (user_id, balance)
  values (v_user_id, v_quest.reward_pogs)
  on conflict (user_id)
  do update set
    balance = public.pog_wallets.balance + v_quest.reward_pogs
  returning balance into v_wallet_balance;

  update public.quest_completions
  set reward_claimed_at = timezone('utc', now())
  where quest_completions.id = v_completion.id;

  if v_unlockable_id is not null then
    insert into public.inventory_items (user_id, unlockable_id, source)
    values (v_user_id, v_unlockable_id, 'quest_reward')
    on conflict (user_id, unlockable_id) do nothing;
  end if;

  return jsonb_build_object(
    'questId', v_quest.id,
    'alreadyClaimed', false,
    'walletBalance', coalesce(v_wallet_balance, 0),
    'unlockableId', v_unlockable_id,
    'unlockableName', coalesce(v_unlockable_name, v_quest.unlockable_name)
  );
end;
$$;

-- =====================================================================
-- 10. get_replay_plus_state: re-select after status writeback so plan/expiry stay fresh
-- =====================================================================

create or replace function public.get_replay_plus_state()
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_row public.subscription_status%rowtype;
  v_status text;
begin
  if v_user_id is null then
    raise exception 'Authentication is required to read Replay+ state.';
  end if;

  select *
  into v_row
  from public.subscription_status
  where subscription_status.user_id = v_user_id;

  if not found then
    return jsonb_build_object(
      'status', 'free',
      'provider', null,
      'planCode', null,
      'expiresAt', null,
      'isPaid', false
    );
  end if;

  v_status := public.normalize_subscription_status(v_row.status, v_row.expires_at);

  if v_status is distinct from v_row.status then
    update public.subscription_status
    set
      status = v_status,
      updated_at = timezone('utc', now())
    where subscription_status.user_id = v_user_id;

    select *
    into v_row
    from public.subscription_status
    where subscription_status.user_id = v_user_id;
  end if;

  return jsonb_build_object(
    'status', v_row.status,
    'provider', v_row.provider,
    'planCode', v_row.plan_code,
    'expiresAt', v_row.expires_at,
    'isPaid', coalesce(v_row.status, 'free') in ('active', 'trialing')
  );
end;
$$;

-- =====================================================================
-- 11. begin_beta_replay_plus_trial: also blocks canceled/past_due (no trial farming)
-- =====================================================================

create or replace function public.begin_beta_replay_plus_trial()
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_existing public.subscription_status%rowtype;
  v_status text := 'free';
begin
  if v_user_id is null then
    raise exception 'Authentication is required to start Replay+.';
  end if;

  select *
  into v_existing
  from public.subscription_status
  where subscription_status.user_id = v_user_id;

  v_status := public.normalize_subscription_status(v_existing.status, v_existing.expires_at);

  if v_status in ('active', 'trialing') then
    return public.get_replay_plus_state();
  end if;

  -- Block users who already consumed a trial. The status row still exists with
  -- 'canceled'/'past_due'/'free' (post-expiry); without this guard, those users
  -- can re-tap the CTA and farm fresh 7-day windows indefinitely.
  if v_existing.user_id is not null
     and v_existing.provider = 'beta_preview'
     and v_existing.expires_at is not null then
    raise exception 'Your Replay+ beta preview has already been used.';
  end if;

  insert into public.subscription_status (
    user_id,
    provider,
    plan_code,
    status,
    expires_at,
    updated_at
  )
  values (
    v_user_id,
    'beta_preview',
    'replay_plus_beta',
    'trialing',
    timezone('utc', now()) + interval '7 days',
    timezone('utc', now())
  )
  on conflict (user_id)
  do update set
    provider = excluded.provider,
    plan_code = excluded.plan_code,
    status = excluded.status,
    expires_at = excluded.expires_at,
    updated_at = timezone('utc', now());

  return public.get_replay_plus_state();
end;
$$;

-- =====================================================================
-- 12. restore_replay_plus_access: never write a phantom 'free' row
-- =====================================================================

create or replace function public.restore_replay_plus_access()
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication is required to restore Replay+.';
  end if;

  -- Only refresh updated_at when there is prior subscription history.
  -- Inserting a stub 'free' row on first tap would clobber plan_code/provider
  -- defaults and confuse downstream reads.
  update public.subscription_status
  set updated_at = timezone('utc', now())
  where subscription_status.user_id = v_user_id;

  return public.get_replay_plus_state();
end;
$$;

-- =====================================================================
-- 13. report_note: snapshot is captured at first report and never overwritten
-- =====================================================================

create or replace function public.report_note(
  p_note_id uuid,
  p_reason text
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_note public.notes%rowtype;
  v_reported_user_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication is required to report a note.';
  end if;

  if p_note_id is null then
    raise exception 'A valid note is required.';
  end if;

  if p_reason is null or char_length(trim(p_reason)) = 0 then
    raise exception 'A report reason is required.';
  end if;

  select *
  into v_note
  from public.notes
  where notes.id = p_note_id
    and (notes.sender_id = v_user_id or notes.recipient_id = v_user_id);

  if not found then
    raise exception 'Note not found.';
  end if;

  v_reported_user_id := case
    when v_note.sender_id = v_user_id then v_note.recipient_id
    else v_note.sender_id
  end;

  insert into public.note_reports (
    note_id,
    reporter_id,
    reported_user_id,
    reason,
    snapshot_body,
    snapshot_paper_style
  )
  values (
    v_note.id,
    v_user_id,
    v_reported_user_id,
    trim(p_reason),
    v_note.body,
    v_note.paper_style
  )
  on conflict (note_id, reporter_id)
  do update set
    reason = excluded.reason;
  -- Intentionally omitted from the conflict update: snapshot_body and
  -- snapshot_paper_style. The first report is the durable evidence; allowing
  -- re-reports to overwrite would let the recipient amend the note text and
  -- have the reporter accidentally erase the original capture.

  return jsonb_build_object(
    'noteId', v_note.id,
    'reportedUserId', v_reported_user_id,
    'reason', trim(p_reason)
  );
end;
$$;

-- =====================================================================
-- 14. deliver_due_notes: skip recipients who muted/blocked the sender after queueing
-- =====================================================================

create or replace function public.deliver_due_notes(p_limit integer default 100)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  with due_notes as (
    select notes.id
    from public.notes
    where notes.status = 'queued'
      and notes.scheduled_for <= timezone('utc', now())
      and not exists (
        select 1
        from public.note_mutes
        where note_mutes.user_id = notes.recipient_id
          and note_mutes.muted_user_id = notes.sender_id
      )
      and not exists (
        select 1
        from public.friendships
        where friendships.status = 'blocked'
          and (
            (friendships.user_id = notes.recipient_id and friendships.friend_id = notes.sender_id)
            or
            (friendships.friend_id = notes.recipient_id and friendships.user_id = notes.sender_id)
          )
      )
    order by notes.scheduled_for
    limit greatest(coalesce(p_limit, 100), 1)
  ),
  delivered as (
    update public.notes
    set
      status = 'delivered',
      delivered_at = timezone('utc', now())
    where notes.id in (select due_notes.id from due_notes)
    returning 1
  )
  select count(*)
  into v_count
  from delivered;

  return coalesce(v_count, 0);
end;
$$;

-- =====================================================================
-- 15. get_beta_dashboard: gate behind beta_admins membership
-- =====================================================================

create or replace function public.get_beta_dashboard()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_total_profiles integer := 0;
  v_onboarded_today integer := 0;
  v_open_users_7d integer := 0;
  v_quest_users integer := 0;
  v_exports_7d integer := 0;
  v_open_rate numeric := 0;
  v_quest_rate numeric := 0;
  v_open_trend jsonb := '[]'::jsonb;
  v_quest_trend jsonb := '[]'::jsonb;
begin
  if v_user_id is null then
    raise exception 'Authentication is required to read the beta dashboard.';
  end if;

  if not exists (
    select 1
    from public.beta_admins
    where beta_admins.user_id = v_user_id
  ) then
    raise exception 'Beta dashboard access requires admin role.'
      using errcode = '42501';
  end if;

  select count(*)
  into v_total_profiles
  from public.profiles;

  select count(*)
  into v_onboarded_today
  from public.analytics_events
  where analytics_events.event_name = 'onboarding_completed'
    and analytics_events.event_day = timezone('utc', now())::date;

  select count(distinct analytics_events.user_id)
  into v_open_users_7d
  from public.analytics_events
  where analytics_events.event_name = 'today_open'
    and analytics_events.event_day >= timezone('utc', now())::date - 6;

  select count(distinct quest_completions.user_id)
  into v_quest_users
  from public.quest_completions
  where quest_completions.reward_claimed_at is not null;

  select count(*)
  into v_exports_7d
  from public.analytics_events
  where analytics_events.event_name in ('camera_still_exported', 'camera_loop_exported')
    and analytics_events.event_day >= timezone('utc', now())::date - 6;

  if v_total_profiles > 0 then
    v_open_rate := round((v_open_users_7d::numeric / v_total_profiles::numeric) * 100, 1);
    v_quest_rate := round((v_quest_users::numeric / v_total_profiles::numeric) * 100, 1);
  end if;

  select coalesce(jsonb_agg(row_payload order by row_payload ->> 'day'), '[]'::jsonb)
  into v_open_trend
  from (
    select jsonb_build_object(
      'day', to_char(day_bucket.day_value, 'YYYY-MM-DD'),
      'label', to_char(day_bucket.day_value, 'Mon DD'),
      'opens', coalesce(count(analytics_events.id), 0),
      'uniqueUsers', coalesce(count(distinct analytics_events.user_id), 0)
    ) as row_payload
    from generate_series(
      timezone('utc', now())::date - 6,
      timezone('utc', now())::date,
      interval '1 day'
    ) day_bucket(day_value)
    left join public.analytics_events
      on analytics_events.event_name = 'today_open'
      and analytics_events.event_day = day_bucket.day_value::date
    group by day_bucket.day_value
  ) trend;

  select coalesce(jsonb_agg(row_payload order by row_payload ->> 'day'), '[]'::jsonb)
  into v_quest_trend
  from (
    select jsonb_build_object(
      'day', to_char(day_bucket.day_value, 'YYYY-MM-DD'),
      'label', to_char(day_bucket.day_value, 'Mon DD'),
      'claims', coalesce(count(quest_completions.id), 0),
      'uniqueUsers', coalesce(count(distinct quest_completions.user_id), 0)
    ) as row_payload
    from generate_series(
      timezone('utc', now())::date - 6,
      timezone('utc', now())::date,
      interval '1 day'
    ) day_bucket(day_value)
    left join public.quest_completions
      on quest_completions.reward_claimed_at::date = day_bucket.day_value::date
    group by day_bucket.day_value
  ) trend;

  return jsonb_build_object(
    'totalProfiles', v_total_profiles,
    'onboardedToday', v_onboarded_today,
    'openRate7d', v_open_rate,
    'questCompletionRate', v_quest_rate,
    'exports7d', v_exports_7d,
    'openTrend', v_open_trend,
    'questTrend', v_quest_trend
  );
end;
$$;

-- =====================================================================
-- 16. friendships canonical-pair index (prevents (A,B) + (B,A) from coexisting)
-- =====================================================================

create unique index if not exists friendships_canonical_pair_idx
on public.friendships (
  least(user_id, friend_id),
  greatest(user_id, friend_id)
);

-- =====================================================================
-- 17. analytics_events dedupe_key: backfill nulls + non-partial unique index
-- =====================================================================
-- Previously the column was nullable and the unique index was partial
-- (`where dedupe_key is not null`). That meant null-keyed events bypassed
-- conflict resolution entirely, so the same null-keyed event emitted twice
-- in one day created two rows. Backfill nulls to '' and make the index full.

update public.analytics_events
set dedupe_key = ''
where dedupe_key is null;

alter table public.analytics_events
  alter column dedupe_key set default '',
  alter column dedupe_key set not null;

drop index if exists public.analytics_events_dedupe_idx;
create unique index if not exists analytics_events_dedupe_idx
  on public.analytics_events (user_id, event_name, event_day, dedupe_key);

-- track_beta_event must coerce null/empty p_dedupe_key to '' so it satisfies
-- the new NOT NULL constraint and matches the now-full unique index.
create or replace function public.track_beta_event(
  p_event_name text,
  p_dedupe_key text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_row public.analytics_events%rowtype;
  v_dedupe text;
begin
  if v_user_id is null then
    raise exception 'Authentication is required to track analytics events.';
  end if;

  if p_event_name is null or char_length(trim(p_event_name)) = 0 then
    raise exception 'Event name is required.';
  end if;

  v_dedupe := coalesce(nullif(trim(p_dedupe_key), ''), '');

  insert into public.analytics_events (
    user_id,
    event_name,
    event_day,
    dedupe_key,
    metadata
  )
  values (
    v_user_id,
    trim(p_event_name),
    timezone('utc', now())::date,
    v_dedupe,
    coalesce(p_metadata, '{}'::jsonb)
  )
  on conflict (user_id, event_name, event_day, dedupe_key)
  do update set
    metadata = excluded.metadata
  returning *
  into v_row;

  return jsonb_build_object(
    'id', v_row.id,
    'eventName', v_row.event_name,
    'eventDay', v_row.event_day,
    'dedupeKey', v_row.dedupe_key
  );
end;
$$;
