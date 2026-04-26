alter table public.profiles
add column if not exists invite_code text;

create or replace function public.generate_invite_code()
returns text
language plpgsql
set search_path = public
as $$
declare
  v_candidate text;
begin
  loop
    v_candidate := substring(upper(replace(gen_random_uuid()::text, '-', '')) from 1 for 8);

    exit when not exists (
      select 1
      from public.profiles
      where profiles.invite_code = v_candidate
    );
  end loop;

  return v_candidate;
end;
$$;

update public.profiles
set invite_code = public.generate_invite_code()
where invite_code is null;

alter table public.profiles
alter column invite_code set default public.generate_invite_code();

create unique index if not exists profiles_invite_code_idx
on public.profiles (invite_code);

alter table public.notes
add column if not exists read_at timestamptz;

create table if not exists public.note_reports (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.notes (id) on delete cascade,
  reporter_id uuid not null references public.profiles (user_id) on delete cascade,
  reported_user_id uuid not null references public.profiles (user_id) on delete cascade,
  reason text not null,
  snapshot_body text not null,
  snapshot_paper_style text not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (note_id, reporter_id)
);

create table if not exists public.note_mutes (
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  muted_user_id uuid not null references public.profiles (user_id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, muted_user_id),
  check (user_id <> muted_user_id)
);

create index if not exists notes_recipient_status_read_idx
on public.notes (recipient_id, status, read_at);

create index if not exists note_reports_reported_user_idx
on public.note_reports (reported_user_id, created_at desc);

alter table public.note_reports enable row level security;
alter table public.note_mutes enable row level security;

create policy "note_reports_insert_own"
on public.note_reports
for insert
with check (auth.uid() = reporter_id);

create policy "note_reports_select_own"
on public.note_reports
for select
using (auth.uid() = reporter_id);

create policy "note_mutes_manage_own"
on public.note_mutes
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

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

  select coalesce(subscription_status.status, 'free')
  into v_subscription_status
  from public.subscription_status
  where subscription_status.user_id = v_user_id;

  if v_subscription_status in ('active', 'trialing') then
    v_weekly_limit := 12;
  end if;

  select count(*)
  into v_sent_this_week
  from public.notes
  where notes.sender_id = v_user_id
    and notes.created_at >= v_week_start;

  return jsonb_build_object(
    'subscriptionStatus', v_subscription_status,
    'weeklyLimit', v_weekly_limit,
    'sentThisWeek', v_sent_this_week,
    'remainingNotes', greatest(v_weekly_limit - v_sent_this_week, 0),
    'resetAt', v_reset_at
  );
end;
$$;

create or replace function public.accept_friend_invite(p_invite_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_target public.profiles%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication is required to connect with a friend.';
  end if;

  if p_invite_code is null or char_length(trim(p_invite_code)) = 0 then
    raise exception 'Invite code is required.';
  end if;

  select *
  into v_target
  from public.profiles
  where profiles.invite_code = upper(trim(p_invite_code));

  if not found then
    raise exception 'Invite code not found.';
  end if;

  if v_target.user_id = v_user_id then
    raise exception 'You cannot add yourself.';
  end if;

  if exists (
    select 1
    from public.friendships
    where friendships.status = 'blocked'
      and (
        (friendships.user_id = v_user_id and friendships.friend_id = v_target.user_id)
        or
        (friendships.user_id = v_target.user_id and friendships.friend_id = v_user_id)
      )
  ) then
    raise exception 'This friendship is blocked.';
  end if;

  delete from public.friendships
  where
    (friendships.user_id = v_user_id and friendships.friend_id = v_target.user_id)
    or
    (friendships.user_id = v_target.user_id and friendships.friend_id = v_user_id);

  insert into public.friendships (
    user_id,
    friend_id,
    status,
    source
  )
  values (
    v_target.user_id,
    v_user_id,
    'accepted',
    'invite_code'
  );

  return jsonb_build_object(
    'friendId', v_target.user_id,
    'friendName', v_target.display_name,
    'inviteCode', v_target.invite_code,
    'status', 'accepted'
  );
end;
$$;

create or replace function public.block_friend(p_target_user_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication is required to block a friend.';
  end if;

  if p_target_user_id is null or p_target_user_id = v_user_id then
    raise exception 'A valid target is required.';
  end if;

  delete from public.friendships
  where
    (friendships.user_id = v_user_id and friendships.friend_id = p_target_user_id)
    or
    (friendships.user_id = p_target_user_id and friendships.friend_id = v_user_id);

  insert into public.friendships (
    user_id,
    friend_id,
    status,
    source
  )
  values (
    v_user_id,
    p_target_user_id,
    'blocked',
    'invite_code'
  )
  on conflict (user_id, friend_id)
  do update set
    status = excluded.status,
    source = excluded.source;

  update public.notes
  set status = 'blocked'
  where notes.status = 'queued'
    and (
      (notes.sender_id = v_user_id and notes.recipient_id = p_target_user_id)
      or
      (notes.sender_id = p_target_user_id and notes.recipient_id = v_user_id)
    );

  return jsonb_build_object(
    'targetUserId', p_target_user_id,
    'status', 'blocked'
  );
end;
$$;

create or replace function public.mute_friend(
  p_target_user_id uuid,
  p_is_muted boolean default true
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication is required to mute a friend.';
  end if;

  if p_target_user_id is null or p_target_user_id = v_user_id then
    raise exception 'A valid target is required.';
  end if;

  if coalesce(p_is_muted, true) then
    insert into public.note_mutes (
      user_id,
      muted_user_id
    )
    values (
      v_user_id,
      p_target_user_id
    )
    on conflict (user_id, muted_user_id) do nothing;
  else
    delete from public.note_mutes
    where note_mutes.user_id = v_user_id
      and note_mutes.muted_user_id = p_target_user_id;
  end if;

  return jsonb_build_object(
    'targetUserId', p_target_user_id,
    'isMuted', coalesce(p_is_muted, true)
  );
end;
$$;

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
    reason = excluded.reason,
    snapshot_body = excluded.snapshot_body,
    snapshot_paper_style = excluded.snapshot_paper_style,
    created_at = timezone('utc', now());

  return jsonb_build_object(
    'noteId', v_note.id,
    'reportedUserId', v_reported_user_id,
    'reason', trim(p_reason)
  );
end;
$$;

create or replace function public.mark_note_read(p_note_id uuid)
returns public.notes
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_note public.notes%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication is required to read a note.';
  end if;

  update public.notes
  set read_at = coalesce(read_at, timezone('utc', now()))
  where notes.id = p_note_id
    and notes.recipient_id = v_user_id
    and notes.status = 'delivered'
  returning *
  into v_note;

  return v_note;
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
  v_has_block boolean;
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

  select coalesce(subscription_status.status, 'free')
  into v_subscription_status
  from public.subscription_status
  where subscription_status.user_id = v_user_id;

  if v_subscription_status in ('active', 'trialing') then
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
    p_paper_style,
    trim(p_body),
    timezone('utc', now()) + make_interval(mins => greatest(coalesce(p_delay_minutes, 120), 15))
  )
  returning *
  into v_note;

  return jsonb_build_object(
    'id', v_note.id,
    'status', v_note.status,
    'scheduledFor', v_note.scheduled_for,
    'paperStyle', v_note.paper_style,
    'body', v_note.body
  );
end;
$$;
