create table if not exists public.quest_step_responses (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid not null references public.quests (id) on delete cascade,
  quest_step_id uuid not null references public.quest_steps (id) on delete cascade,
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  response_text text not null,
  completed_at timestamptz not null default timezone('utc', now()),
  unique (quest_step_id, user_id)
);

create table if not exists public.equipped_unlockables (
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  category text not null,
  unlockable_id uuid not null references public.unlockables (id) on delete cascade,
  equipped_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, category),
  unique (user_id, unlockable_id)
);

create index if not exists quest_step_responses_user_idx
on public.quest_step_responses (user_id, completed_at desc);

create index if not exists equipped_unlockables_unlockable_idx
on public.equipped_unlockables (unlockable_id);

alter table public.quest_step_responses enable row level security;
alter table public.equipped_unlockables enable row level security;

create policy "quest_step_responses_manage_own"
on public.quest_step_responses
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "equipped_unlockables_manage_own"
on public.equipped_unlockables
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

insert into public.equipped_unlockables (user_id, category, unlockable_id)
select
  inventory_items.user_id,
  unlockables.category,
  unlockables.id
from public.inventory_items
join public.unlockables on unlockables.id = inventory_items.unlockable_id
where unlockables.slug = 'basement-sleepover'
on conflict (user_id, category) do nothing;

create or replace function public.save_quest_step_response(
  p_quest_id uuid,
  p_quest_step_id uuid,
  p_response_text text
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_step public.quest_steps%rowtype;
  v_total_steps integer := 0;
  v_completed_steps integer := 0;
begin
  if v_user_id is null then
    raise exception 'Authentication is required to update quest progress.';
  end if;

  if p_quest_id is null or p_quest_step_id is null then
    raise exception 'Quest and step are required.';
  end if;

  if p_response_text is null or char_length(trim(p_response_text)) = 0 then
    raise exception 'Step response cannot be empty.';
  end if;

  if char_length(trim(p_response_text)) > 180 then
    raise exception 'Keep quest answers under 180 characters.';
  end if;

  select *
  into v_step
  from public.quest_steps
  where quest_steps.id = p_quest_step_id
    and quest_steps.quest_id = p_quest_id;

  if not found then
    raise exception 'Quest step not found.';
  end if;

  if not exists (
    select 1
    from public.quests
    where quests.id = p_quest_id
      and quests.is_published = true
      and quests.active_from <= timezone('utc', now())
      and quests.active_to >= timezone('utc', now())
  ) then
    raise exception 'Quest is not currently available.';
  end if;

  insert into public.quest_step_responses (
    quest_id,
    quest_step_id,
    user_id,
    response_text,
    completed_at
  )
  values (
    p_quest_id,
    p_quest_step_id,
    v_user_id,
    trim(p_response_text),
    timezone('utc', now())
  )
  on conflict (quest_step_id, user_id)
  do update set
    response_text = excluded.response_text,
    completed_at = timezone('utc', now());

  select count(*)
  into v_total_steps
  from public.quest_steps
  where quest_steps.quest_id = p_quest_id;

  select count(*)
  into v_completed_steps
  from public.quest_step_responses
  where quest_step_responses.quest_id = p_quest_id
    and quest_step_responses.user_id = v_user_id;

  if v_completed_steps >= v_total_steps and v_total_steps > 0 then
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
    on conflict (quest_id, user_id)
    do update set
      completed_at = excluded.completed_at;
  end if;

  return jsonb_build_object(
    'questId', p_quest_id,
    'questStepId', p_quest_step_id,
    'completedSteps', v_completed_steps,
    'totalSteps', v_total_steps,
    'isQuestComplete', v_completed_steps >= v_total_steps and v_total_steps > 0
  );
end;
$$;

create or replace function public.purchase_unlockable(p_unlockable_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_unlockable public.unlockables%rowtype;
  v_wallet_balance integer := 0;
  v_already_owned boolean := false;
  v_is_quest_reward boolean := false;
begin
  if v_user_id is null then
    raise exception 'Authentication is required to purchase an unlockable.';
  end if;

  select *
  into v_unlockable
  from public.unlockables
  where unlockables.id = p_unlockable_id;

  if not found then
    raise exception 'Unlockable not found.';
  end if;

  select exists (
    select 1
    from public.inventory_items
    where inventory_items.user_id = v_user_id
      and inventory_items.unlockable_id = v_unlockable.id
  )
  into v_already_owned;

  if v_already_owned then
    select balance
    into v_wallet_balance
    from public.pog_wallets
    where pog_wallets.user_id = v_user_id;

    return jsonb_build_object(
      'unlockableId', v_unlockable.id,
      'alreadyOwned', true,
      'walletBalance', coalesce(v_wallet_balance, 0)
    );
  end if;

  select exists (
    select 1
    from public.quests
    where quests.unlockable_name = v_unlockable.name
  )
  into v_is_quest_reward;

  if v_unlockable.pog_cost <= 0 or v_is_quest_reward then
    raise exception 'This unlockable is earned through progression, not purchase.';
  end if;

  insert into public.pog_wallets (user_id, balance)
  values (v_user_id, 0)
  on conflict (user_id) do nothing;

  select balance
  into v_wallet_balance
  from public.pog_wallets
  where pog_wallets.user_id = v_user_id
  for update;

  if coalesce(v_wallet_balance, 0) < v_unlockable.pog_cost then
    raise exception 'Not enough pogs for this unlockable.';
  end if;

  update public.pog_wallets
  set balance = balance - v_unlockable.pog_cost
  where pog_wallets.user_id = v_user_id
  returning balance into v_wallet_balance;

  insert into public.inventory_items (
    user_id,
    unlockable_id,
    source
  )
  values (
    v_user_id,
    v_unlockable.id,
    'store_purchase'
  )
  on conflict (user_id, unlockable_id) do nothing;

  return jsonb_build_object(
    'unlockableId', v_unlockable.id,
    'alreadyOwned', false,
    'walletBalance', coalesce(v_wallet_balance, 0)
  );
end;
$$;

create or replace function public.equip_unlockable(p_unlockable_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_unlockable public.unlockables%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication is required to equip an unlockable.';
  end if;

  select *
  into v_unlockable
  from public.unlockables
  where unlockables.id = p_unlockable_id;

  if not found then
    raise exception 'Unlockable not found.';
  end if;

  if not exists (
    select 1
    from public.inventory_items
    where inventory_items.user_id = v_user_id
      and inventory_items.unlockable_id = v_unlockable.id
  ) then
    raise exception 'You need to own this unlockable before equipping it.';
  end if;

  insert into public.equipped_unlockables (
    user_id,
    category,
    unlockable_id,
    equipped_at
  )
  values (
    v_user_id,
    v_unlockable.category,
    v_unlockable.id,
    timezone('utc', now())
  )
  on conflict (user_id, category)
  do update set
    unlockable_id = excluded.unlockable_id,
    equipped_at = excluded.equipped_at;

  return jsonb_build_object(
    'unlockableId', v_unlockable.id,
    'category', v_unlockable.category,
    'equipped', true
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

  if v_completion.reward_claimed_at is not null then
    select balance
    into v_wallet_balance
    from public.pog_wallets
    where pog_wallets.user_id = v_user_id;

    return jsonb_build_object(
      'questId', v_quest.id,
      'alreadyClaimed', true,
      'walletBalance', coalesce(v_wallet_balance, 0),
      'unlockableName', v_quest.unlockable_name
    );
  end if;

  update public.quest_completions
  set reward_claimed_at = timezone('utc', now())
  where quest_completions.id = v_completion.id;

  insert into public.pog_wallets (user_id, balance)
  values (v_user_id, v_quest.reward_pogs)
  on conflict (user_id)
  do update set
    balance = public.pog_wallets.balance + v_quest.reward_pogs
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

  return jsonb_build_object(
    'questId', v_quest.id,
    'alreadyClaimed', false,
    'walletBalance', coalesce(v_wallet_balance, 0),
    'unlockableName', v_quest.unlockable_name
  );
end;
$$;
