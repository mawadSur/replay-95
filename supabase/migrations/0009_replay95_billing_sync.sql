-- 0009_replay95_billing_sync.sql
-- Client-callable sync for RevenueCat-driven Replay+ purchases.
-- Real receipt verification belongs in a future RevenueCat webhook → Edge
-- Function path. For beta soft launch, the client reads CustomerInfo from
-- the store SDK and forwards it here via this RPC. Trust boundary: the
-- client. Acceptable for a 5,000-user closed beta; revisit before open beta.

create or replace function public.sync_replay_plus_from_purchase(
  p_status text,
  p_plan_code text default null,
  p_expires_at timestamptz default null,
  p_provider text default 'revenuecat'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_status text;
begin
  if v_user_id is null then
    raise exception 'Authentication is required to sync Replay+ status.';
  end if;

  if p_status not in ('free', 'trialing', 'active', 'past_due', 'canceled') then
    raise exception 'Invalid Replay+ status: %', p_status;
  end if;

  v_status := p_status;

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
    coalesce(nullif(trim(p_provider), ''), 'revenuecat'),
    p_plan_code,
    v_status,
    p_expires_at,
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

grant execute on function public.sync_replay_plus_from_purchase(text, text, timestamptz, text) to authenticated;
