create or replace function public.normalize_subscription_status(
  p_status text,
  p_expires_at timestamptz default null
)
returns text
language plpgsql
stable
set search_path = public
as $$
begin
  if p_status is null or char_length(trim(p_status)) = 0 then
    return 'free';
  end if;

  if p_status in ('active', 'trialing')
    and p_expires_at is not null
    and p_expires_at <= timezone('utc', now()) then
    return 'canceled';
  end if;

  return p_status;
end;
$$;

create or replace function public.get_replay_plus_state()
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_row public.subscription_status%rowtype;
  v_status text := 'free';
begin
  if v_user_id is null then
    raise exception 'Authentication is required to check Replay+ status.';
  end if;

  select *
  into v_row
  from public.subscription_status
  where subscription_status.user_id = v_user_id;

  v_status := public.normalize_subscription_status(v_row.status, v_row.expires_at);

  if v_row.user_id is not null and v_status <> v_row.status then
    update public.subscription_status
    set status = v_status,
        updated_at = timezone('utc', now())
    where subscription_status.user_id = v_user_id
    returning *
    into v_row;
  end if;

  return jsonb_build_object(
    'status', coalesce(v_status, 'free'),
    'provider', v_row.provider,
    'planCode', v_row.plan_code,
    'expiresAt', v_row.expires_at,
    'isPaid', coalesce(v_status, 'free') in ('active', 'trialing')
  );
end;
$$;

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

  insert into public.subscription_status (
    user_id,
    provider,
    status,
    updated_at
  )
  values (
    v_user_id,
    'revenuecat',
    'free',
    timezone('utc', now())
  )
  on conflict (user_id)
  do update set
    updated_at = timezone('utc', now());

  return public.get_replay_plus_state();
end;
$$;

create or replace function public.save_notification_preferences(
  p_timezone text,
  p_nightly_delivery_time text,
  p_daily_enabled boolean default true,
  p_weekend_quest_enabled boolean default true
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_timezone text := coalesce(nullif(trim(p_timezone), ''), 'America/New_York');
  v_time_text text := coalesce(nullif(trim(p_nightly_delivery_time), ''), '19:00');
  v_row public.notification_preferences%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication is required to update notification preferences.';
  end if;

  insert into public.notification_preferences (
    user_id,
    timezone,
    nightly_delivery_time,
    daily_enabled,
    weekend_quest_enabled,
    updated_at
  )
  values (
    v_user_id,
    v_timezone,
    v_time_text::time,
    coalesce(p_daily_enabled, true),
    coalesce(p_weekend_quest_enabled, true),
    timezone('utc', now())
  )
  on conflict (user_id)
  do update set
    timezone = excluded.timezone,
    nightly_delivery_time = excluded.nightly_delivery_time,
    daily_enabled = excluded.daily_enabled,
    weekend_quest_enabled = excluded.weekend_quest_enabled,
    updated_at = timezone('utc', now())
  returning *
  into v_row;

  return jsonb_build_object(
    'timezone', v_row.timezone,
    'nightlyDeliveryTime', to_char(v_row.nightly_delivery_time, 'HH24:MI'),
    'dailyEnabled', v_row.daily_enabled,
    'weekendQuestEnabled', v_row.weekend_quest_enabled
  );
end;
$$;

create or replace function public.get_note_compose_state()
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_subscription_status text := 'free';
  v_weekly_limit integer := 3;
  v_sent_this_week integer := 0;
  v_week_start timestamptz := date_trunc('week', timezone('utc', now()));
  v_reset_at timestamptz := date_trunc('week', timezone('utc', now())) + interval '7 days';
begin
  if v_user_id is null then
    raise exception 'Authentication is required to check note allowance.';
  end if;

  select public.normalize_subscription_status(subscription_status.status, subscription_status.expires_at)
  into v_subscription_status
  from public.subscription_status
  where subscription_status.user_id = v_user_id;

  if coalesce(v_subscription_status, 'free') in ('active', 'trialing') then
    v_weekly_limit := 12;
  end if;

  select count(*)
  into v_sent_this_week
  from public.notes
  where notes.sender_id = v_user_id
    and notes.created_at >= v_week_start;

  return jsonb_build_object(
    'subscriptionStatus', coalesce(v_subscription_status, 'free'),
    'weeklyLimit', v_weekly_limit,
    'sentThisWeek', v_sent_this_week,
    'remainingNotes', greatest(v_weekly_limit - v_sent_this_week, 0),
    'resetAt', v_reset_at
  );
end;
$$;

create or replace function public.queue_note(
  p_recipient_id uuid,
  p_paper_style text,
  p_body text,
  p_delay_minutes integer default 120
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_note public.notes%rowtype;
  v_has_friendship boolean;
  v_has_block boolean := false;
  v_subscription_status text := 'free';
  v_weekly_limit integer := 3;
  v_sent_this_week integer := 0;
  v_week_start timestamptz := date_trunc('week', timezone('utc', now()));
begin
  if v_user_id is null then
    raise exception 'Authentication is required to send a note.';
  end if;

  if p_recipient_id is null or p_recipient_id = v_user_id then
    raise exception 'A valid recipient is required.';
  end if;

  if p_body is null or char_length(trim(p_body)) = 0 then
    raise exception 'Note body cannot be empty.';
  end if;

  select exists (
    select 1
    from public.friendships
    where friendships.status = 'blocked'
      and (
        (friendships.user_id = v_user_id and friendships.friend_id = p_recipient_id)
        or
        (friendships.user_id = p_recipient_id and friendships.friend_id = v_user_id)
      )
  )
  into v_has_block;

  if v_has_block then
    raise exception 'Notes are unavailable for this friendship.';
  end if;

  select exists (
    select 1
    from public.friendships
    where friendships.status = 'accepted'
      and (
        (friendships.user_id = v_user_id and friendships.friend_id = p_recipient_id)
        or
        (friendships.friend_id = v_user_id and friendships.user_id = p_recipient_id)
      )
  )
  into v_has_friendship;

  if not v_has_friendship then
    raise exception 'You can only send notes to accepted friends.';
  end if;

  select public.normalize_subscription_status(subscription_status.status, subscription_status.expires_at)
  into v_subscription_status
  from public.subscription_status
  where subscription_status.user_id = v_user_id;

  if coalesce(v_subscription_status, 'free') in ('active', 'trialing') then
    v_weekly_limit := 12;
  end if;

  select count(*)
  into v_sent_this_week
  from public.notes
  where notes.sender_id = v_user_id
    and notes.created_at >= v_week_start;

  if v_sent_this_week >= v_weekly_limit then
    raise exception 'Weekly note limit reached. Try again after reset or upgrade Replay+.';
  end if;

  insert into public.notes (
    sender_id,
    recipient_id,
    paper_style,
    body,
    scheduled_for
  )
  values (
    v_user_id,
    p_recipient_id,
    coalesce(nullif(trim(p_paper_style), ''), 'Ripped notebook'),
    trim(p_body),
    timezone('utc', now()) + make_interval(mins => greatest(coalesce(p_delay_minutes, 120), 5))
  )
  returning *
  into v_note;

  return jsonb_build_object(
    'id', v_note.id,
    'status', v_note.status,
    'scheduledFor', v_note.scheduled_for,
    'remainingNotes', greatest(v_weekly_limit - v_sent_this_week - 1, 0),
    'subscriptionStatus', coalesce(v_subscription_status, 'free')
  );
end;
$$;
