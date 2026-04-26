create or replace function public.ensure_profile_defaults()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.pog_wallets (user_id, balance)
  values (new.user_id, 125)
  on conflict (user_id) do nothing;

  insert into public.notification_preferences (user_id, timezone, nightly_delivery_time)
  values (new.user_id, 'America/New_York', '19:00')
  on conflict (user_id) do nothing;

  insert into public.subscription_status (user_id, provider, status)
  values (new.user_id, 'revenuecat', 'free')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists profiles_seed_defaults_after_insert on public.profiles;
create trigger profiles_seed_defaults_after_insert
after insert on public.profiles
for each row execute procedure public.ensure_profile_defaults();

insert into public.pog_wallets (user_id, balance)
select profiles.user_id, 125
from public.profiles
on conflict (user_id) do nothing;

insert into public.notification_preferences (user_id, timezone, nightly_delivery_time)
select profiles.user_id, 'America/New_York', '19:00'
from public.profiles
on conflict (user_id) do nothing;

insert into public.subscription_status (user_id, provider, status)
select profiles.user_id, 'revenuecat', 'free'
from public.profiles
on conflict (user_id) do nothing;

create policy "profiles_select_related_friends"
on public.profiles
for select
using (
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
);

insert into storage.buckets (id, name, public)
values
  ('episode-media', 'episode-media', true),
  ('voice-replies', 'voice-replies', false)
on conflict (id) do nothing;

drop policy if exists "episode_media_public_read" on storage.objects;
create policy "episode_media_public_read"
on storage.objects
for select
to public
using (bucket_id = 'episode-media');

drop policy if exists "voice_replies_select_own" on storage.objects;
create policy "voice_replies_select_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'voice-replies'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "voice_replies_insert_own" on storage.objects;
create policy "voice_replies_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'voice-replies'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "voice_replies_update_own" on storage.objects;
create policy "voice_replies_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'voice-replies'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'voice-replies'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "voice_replies_delete_own" on storage.objects;
create policy "voice_replies_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'voice-replies'
  and (storage.foldername(name))[1] = auth.uid()::text
);

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
  order by unlock_at desc
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
        order by episode_media_items.created_at
      )
      from public.episode_media_items
      where episode_media_items.episode_id = v_episode.id
    ), '[]'::jsonb)
  );
end;
$$;

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
  v_wallet_balance integer;
  v_was_inserted boolean := false;
begin
  if v_user_id is null then
    raise exception 'Authentication is required to claim a quest reward.';
  end if;

  select *
  into v_quest
  from public.quests
  where id = p_quest_id
    and is_published = true
    and active_from <= timezone('utc', now())
    and active_to >= timezone('utc', now());

  if not found then
    raise exception 'Quest is not currently available.';
  end if;

  insert into public.quest_completions (
    quest_id,
    user_id,
    completed_at,
    reward_claimed_at
  )
  values (
    v_quest.id,
    v_user_id,
    timezone('utc', now()),
    timezone('utc', now())
  )
  on conflict (quest_id, user_id) do nothing
  returning *
  into v_completion;

  v_was_inserted := v_completion.id is not null;

  if v_was_inserted then
    insert into public.pog_wallets (user_id, balance)
    values (v_user_id, v_quest.reward_pogs)
    on conflict (user_id)
    do update set balance = public.pog_wallets.balance + v_quest.reward_pogs
    returning balance into v_wallet_balance;

    select unlockables.id
    into v_unlockable_id
    from public.unlockables
    where unlockables.name = v_quest.unlockable_name
    limit 1;

    if v_unlockable_id is not null then
      insert into public.inventory_items (user_id, unlockable_id, source)
      values (v_user_id, v_unlockable_id, 'quest_reward')
      on conflict (user_id, unlockable_id) do nothing;
    end if;
  else
    select balance
    into v_wallet_balance
    from public.pog_wallets
    where user_id = v_user_id;
  end if;

  return jsonb_build_object(
    'questId', v_quest.id,
    'alreadyClaimed', not v_was_inserted,
    'walletBalance', coalesce(v_wallet_balance, 0),
    'unlockableName', v_quest.unlockable_name
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

create or replace function public.sync_subscription_status(
  p_user_id uuid,
  p_status text,
  p_plan_code text default null,
  p_expires_at timestamptz default null,
  p_provider text default 'revenuecat'
)
returns public.subscription_status
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.subscription_status%rowtype;
begin
  if p_user_id is null then
    raise exception 'User id is required for subscription sync.';
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
    p_user_id,
    coalesce(p_provider, 'revenuecat'),
    p_plan_code,
    p_status,
    p_expires_at,
    timezone('utc', now())
  )
  on conflict (user_id)
  do update set
    provider = excluded.provider,
    plan_code = excluded.plan_code,
    status = excluded.status,
    expires_at = excluded.expires_at,
    updated_at = timezone('utc', now())
  returning *
  into v_row;

  return v_row;
end;
$$;

revoke all on function public.deliver_due_notes(integer) from public, anon, authenticated;
grant execute on function public.deliver_due_notes(integer) to service_role;

revoke all on function public.sync_subscription_status(uuid, text, text, timestamptz, text) from public, anon, authenticated;
grant execute on function public.sync_subscription_status(uuid, text, text, timestamptz, text) to service_role;
