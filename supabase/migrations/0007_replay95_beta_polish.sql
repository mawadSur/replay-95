create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  event_name text not null,
  event_day date not null default timezone('utc', now())::date,
  dedupe_key text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists analytics_events_name_day_idx
on public.analytics_events (event_name, event_day desc);

create unique index if not exists analytics_events_dedupe_idx
on public.analytics_events (user_id, event_name, event_day, dedupe_key)
where dedupe_key is not null;

alter table public.analytics_events enable row level security;

create policy "analytics_events_insert_own"
on public.analytics_events
for insert
with check (auth.uid() = user_id);

create policy "analytics_events_select_own"
on public.analytics_events
for select
using (auth.uid() = user_id);

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
begin
  if v_user_id is null then
    raise exception 'Authentication is required to track analytics events.';
  end if;

  if p_event_name is null or char_length(trim(p_event_name)) = 0 then
    raise exception 'Event name is required.';
  end if;

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
    nullif(trim(p_dedupe_key), ''),
    coalesce(p_metadata, '{}'::jsonb)
  )
  on conflict (user_id, event_name, event_day, dedupe_key)
  where dedupe_key is not null
  do update set
    metadata = excluded.metadata
  returning *
  into v_row;

  if v_row.id is null then
    select *
    into v_row
    from public.analytics_events
    where analytics_events.user_id = v_user_id
      and analytics_events.event_name = trim(p_event_name)
      and analytics_events.event_day = timezone('utc', now())::date
      and analytics_events.dedupe_key is not distinct from nullif(trim(p_dedupe_key), '')
    order by analytics_events.created_at desc
    limit 1;
  end if;

  return jsonb_build_object(
    'id', v_row.id,
    'eventName', v_row.event_name,
    'eventDay', v_row.event_day,
    'dedupeKey', v_row.dedupe_key
  );
end;
$$;

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
    ) as day_bucket(day_value)
    left join public.analytics_events
      on analytics_events.event_name = 'today_open'
      and analytics_events.event_day = day_bucket.day_value
    group by day_bucket.day_value
  ) open_rows;

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
    ) as day_bucket(day_value)
    left join public.quest_completions
      on quest_completions.reward_claimed_at::date = day_bucket.day_value
    group by day_bucket.day_value
  ) quest_rows;

  return jsonb_build_object(
    'totalProfiles', v_total_profiles,
    'onboardedToday', v_onboarded_today,
    'dailyOpenRate7d', v_open_rate,
    'questCompletionRate', v_quest_rate,
    'questUsers', v_quest_users,
    'exports7d', v_exports_7d,
    'openTrend', v_open_trend,
    'questTrend', v_quest_trend
  );
end;
$$;

do $$
declare
  v_template record;
  v_day integer;
  v_episode_id uuid;
  v_unlock_at timestamptz;
  v_cycle integer;
  v_theme_slug text;
begin
  for v_day in 0..89 loop
    select *
    into v_template
    from (
      values
        (1, 'blank-tape-warmup', 'Friday Night Videos: The Blank Tape Warm-Up', 'Radio hiss, impatient fingers, and the exact song you waited all evening to catch clean.', 'radio dub', 'late cable', 'mixtape static', 'What song felt worth waiting by the stereo for?', 'What always ruined the perfect radio recording?', 'Who would have borrowed the finished tape first?'),
        (2, 'mall-run-countdown', 'The After-School Run', 'The mall is bright, time is short, and everybody swears their first stop makes the most sense.', 'mall glow', 'food court echo', 'two-hour freedom', 'You only get two free hours. Where do you go first?', 'What store had the strongest pull on your mood immediately?', 'Who shaped the pace of the whole mall run?'),
        (3, 'bus-window-soundtrack', 'The Bus Ride Home Soundtrack', 'Glass fog, seat vinyl, and the private feeling that the ride home could soundtrack your whole personality.', 'bus window', 'headphones fantasy', 'after-school drift', 'What song or music mood owned the ride home?', 'What detail outside the window made the whole trip feel cinematic?', 'What version of yourself showed up on that ride?'),
        (4, 'school-photo-day', 'Picture Day Nerves, 1995 Edition', 'Every choice in the outfit suddenly felt like it would live forever in a laminated rectangle.', 'picture day', 'flash haze', 'outfit panic', 'What did you wear because it felt right for the camera?', 'What small detail mattered way more than it should have?', 'What did that outfit say about who you wanted to be?'),
        (5, 'sleepover-floor-sprawl', 'Basement Sleepover Transmission', 'Blankets everywhere, a TV glow nobody turned off, and the strange politics of who actually stayed awake.', 'sleepover floor', 'late TV block', 'midnight whisper', 'Who made it the longest before falling asleep?', 'What was playing when the room finally quieted down?', 'Why did that sleepover feel like its own little era?'),
        (6, 'saturday-cereal-lab', 'Saturday Morning Cereal Science', 'Too much sugar, cartoons on too loud, and a full commitment to the fake logic of mascot marketing.', 'cereal mascot', 'cartoon block', 'sugar rush', 'Which cereal box had the most impossible hold on you?', 'What cartoon had to be on at exactly the right time?', 'What part of that morning routine felt completely sacred?'),
        (7, 'mall-food-court-debate', 'Food Court Summit Meeting', 'Everybody says there is a correct order for the mall and everybody is definitely wrong but loud about it.', 'food court tray', 'neon tables', 'mall map', 'What was the correct order of mall stops after eating?', 'What food court smell still hits the memory button?', 'Who in your group always tried to run the route?'),
        (8, 'roller-rink-neon', 'Roller Rink Slow-Song Damage', 'Skates, mirror lights, and one song that could make the whole room feel bigger than it was.', 'roller rink', 'mirror ball', 'slow song', 'What song made the rink feel suddenly cinematic?', 'Where did you hide when the room got emotionally inconvenient?', 'What version of confidence were you pretending to have?'),
        (9, 'arcade-last-token', 'Last Token At The Arcade', 'A pocket with one coin left and a completely irrational certainty that this next play could redeem the whole night.', 'arcade carpet', 'token panic', 'cabinet glow', 'Which cabinet got the final token?', 'Was the last play skill, luck, or full panic?', 'Who noticed the win or loss before you did?'),
        (10, 'video-store-friday', 'Friday Night Rental Aisle', 'Plastic clamshells, too many opinions, and one backup pick waiting in case somebody else grabbed the good movie.', 'video store', 'rental aisle', 'vhs tower', 'What was the first rental you reached for?', 'What was the backup pick when the obvious choice was gone?', 'Who turned the rental decision into a whole family argument?'),
        (11, 'pager-code-crush', 'Pager Code Confidential', 'A tiny device, zero subtlety, and the kind of communication that felt enormous because it had to stay brief.', 'pager code', 'numeric crush', 'public secrecy', 'What message felt impossible to send directly?', 'What number code or shortcut meant more than it should have?', 'Why did the secrecy make it feel bigger?'),
        (12, 'trapper-chaos', 'Backpack Zip Pocket Archaeology', 'Receipts, pens, wrappers, and the exact objects that accidentally became your personal museum.', 'zip pocket', 'trapper keeper', 'bag clutter', 'What always lived in the bag no matter what?', 'What object had no reason to matter but somehow did?', 'What did the pocket inventory say about your daily life?'),
        (13, 'poster-wall', 'Bedroom Poster Wall Audit', 'Tape corners, band loyalties, and the exact patch of wall that explained your taste before you ever said a word.', 'poster wall', 'bedroom shrine', 'taste signal', 'Which wall item did the most personality work?', 'What had to be centered because it mattered most?', 'Who immediately understood you from that room?'),
        (14, 'summer-pool-break', 'Public Pool Radio Static', 'Wet concrete, radio distortion, and the smell of summer like it was a whole weather system with a soundtrack.', 'pool concrete', 'chlorine radio', 'summer heat', 'What sound or song owned the pool memory?', 'What summer smell is attached to that exact place?', 'Why did that day feel bigger than it should have?'),
        (15, 'county-fair-night', 'County Fair Lights After Dark', 'Parking lot gravel, bright rides, and the specific feeling of trying to look cooler than the heat allowed.', 'fair lights', 'parking lot fit', 'ride glow', 'What did you wear because the night felt important?', 'What moment on the walk back to the car stuck hardest?', 'Why did that fair night feel like a whole movie ending?'),
        (16, 'classroom-note-panic', 'Folded Note During Third Period', 'A tiny sheet of paper somehow carrying the full emotional risk profile of the day.', 'folded note', 'third period', 'desk panic', 'What made the note worth the risk?', 'How did it move across the room without getting caught?', 'Why do you still remember the feeling more than the words?'),
        (17, 'toy-aisle-tunnel', 'The Toy Aisle Time Warp', 'A fluorescent aisle that could rearrange your priorities in under ten seconds.', 'toy aisle', 'fluorescent shelf', 'focus collapse', 'Which shelf could wreck your self-control immediately?', 'What toy felt impossible to leave behind?', 'Who knew how to stretch that aisle visit into a negotiation?'),
        (18, 'family-road-trip', 'Backseat Road Trip Radio Wars', 'Snack wrappers, changing stations, and the ongoing dispute over whose taste actually counted in the car.', 'road trip', 'backseat tape', 'radio wars', 'Who controlled the tape deck or station more than they should have?', 'What moment made the car suddenly feel too small?', 'What song or argument defined the whole trip?'),
        (19, 'rainy-sick-day-tv', 'Sick Day On The Couch', 'Blankets, muted daylight, and the low-stakes comfort of daytime television that somehow fixed the whole mood.', 'sick day', 'daytime couch', 'rainy tv', 'What show or channel made a sick day easier?', 'What snack or drink belongs in that memory automatically?', 'Why did the quiet of the house feel special?'),
        (20, 'school-dance-parking-lot', 'School Dance Parking Lot Debrief', 'The event is over, the parking lot is honest, and suddenly the outfit and the soundtrack tell the real story.', 'school dance', 'parking lot talk', 'awkward shoes', 'What part of the outfit felt most important before you left home?', 'What moment rewrote the whole dance in hindsight?', 'Who got the parking-lot recap version first?'),
        (21, 'birthday-sleepover', 'Birthday Sleepover Rules Committee', 'A pile of snacks, too many opinions, and a temporary government built entirely around vibes.', 'birthday floor', 'snack pile', 'friend politics', 'What snack or movie was non-negotiable?', 'Who actually set the tone of the whole night?', 'Why did that birthday feel like a world with its own rules?'),
        (22, 'yearbook-signing', 'Yearbook Signature Season', 'The hallway gets sentimental, pen colors suddenly matter, and one short note becomes impossible to forget.', 'yearbook ink', 'hallway signatures', 'last-week energy', 'What note still sticks in your head?', 'What pen color or handwriting made it feel more permanent?', 'Whose message mattered more than you admitted?'),
        (23, 'garage-sale-gold', 'Garage Sale Treasure Hunt', 'Card tables, weird pricing, and the small thrill of finding something nobody else clocked yet.', 'garage sale', 'card table gold', 'neighborhood heat', 'What object felt completely priceless for no objective reason?', 'What made the find feel like it had chosen you?', 'Who recognized the value immediately and who absolutely did not?'),
        (24, 'halloween-costume-box', 'Costume Bin Chaos', 'A cardboard box, impossible ambition, and the confidence to call improvised fabric a finished concept.', 'costume bin', 'october scissors', 'improv outfit', 'What improvised costume detail actually worked?', 'What almost failed but somehow got rebranded as intentional?', 'Why did that costume feel more memorable than the polished ones?'),
        (25, 'snow-day-cable', 'Snow Day Cable Marathon', 'Window glare, snack decisions, and the private schedule you built around whatever the weather gave you.', 'snow day', 'cable marathon', 'blanket nest', 'What channel owned the day?', 'What snack was absolutely part of the weather ritual?', 'Did the day feel endless or too short, and why?'),
        (26, 'first-cd-obsession', 'The CD You Wore Out', 'One album becomes identity, every track order feels sacred, and the case itself starts to look exhausted.', 'first cd', 'disc player', 'album identity', 'What CD turned into a personality declaration?', 'Which track skip still feels like muscle memory?', 'Who understood that obsession without explanation?'),
        (27, 'food-court-fashion', 'Mall Look Reconstruction', 'An outfit assembled with complete sincerity and exactly the right amount of overconfidence.', 'mall fit', 'store mirror', 'fashion certainty', 'What fit made you feel briefly untouchable?', 'What store or item was carrying way too much of the confidence?', 'What did that look say about your version of cool?'),
        (28, 'weekend-blockbuster', 'The Movie Everyone Quoted Monday', 'A weekend movie becomes shared language by first period, whether the adults wanted that or not.', 'quoted movie', 'monday hallway', 'shared scene', 'What line or scene survived into Monday conversation?', 'Where did you first hear somebody repeat it badly?', 'Why did that movie feel like common property overnight?'),
        (29, 'holiday-commercials', 'Holiday Break Commercial Brain', 'Catalog pages, ads on loop, and the seasonal feeling that anticipation could become a whole hobby.', 'holiday ads', 'toy catalog', 'break countdown', 'Which ad or catalog page lived in your head the longest?', 'What product felt life-changing for no serious reason?', 'Why did the anticipation almost beat the actual gift?'),
        (30, 'summer-of-94-finale', 'The Summer Of ''94 Memory Channel', 'The season where everything felt louder, brighter, and maybe big enough to carry your whole identity for a while.', 'summer of 94', 'big memory', 'endless daylight', 'What memory from that summer still feels oversized in the best way?', 'What sound or place tells your brain it is back there instantly?', 'Who belongs in the final frame of that season?')
    ) as templates(
      idx,
      base_slug,
      title,
      subtitle,
      tag_1,
      tag_2,
      tag_3,
      prompt_1,
      prompt_2,
      prompt_3
    )
    where templates.idx = ((v_day % 30) + 1);

    v_cycle := floor(v_day / 30.0)::integer + 1;
    v_unlock_at := '2026-04-01T23:30:00Z'::timestamptz + make_interval(days => v_day);
    v_theme_slug := format('%s-day-%s', v_template.base_slug, lpad((v_day + 1)::text, 3, '0'));

    insert into public.daily_episodes (
      theme_slug,
      title,
      subtitle,
      unlock_at,
      status,
      personalization_payload
    )
    select
      v_theme_slug,
      v_template.title,
      v_template.subtitle,
      v_unlock_at,
      'published',
      jsonb_build_object(
        'season', 'Summer of ''94',
        'cycle', v_cycle,
        'sequence', v_day + 1,
        'montage_tags', jsonb_build_array(v_template.tag_1, v_template.tag_2, v_template.tag_3)
      )
    where not exists (
      select 1
      from public.daily_episodes
      where daily_episodes.theme_slug = v_theme_slug
        and daily_episodes.unlock_at = v_unlock_at
    );

    select daily_episodes.id
    into v_episode_id
    from public.daily_episodes
    where daily_episodes.theme_slug = v_theme_slug
      and daily_episodes.unlock_at = v_unlock_at
    order by daily_episodes.created_at desc
    limit 1;

    insert into public.episode_media_items (
      episode_id,
      media_type,
      rights_status,
      metadata
    )
    select
      v_episode_id,
      'copy_only',
      'owned',
      jsonb_build_object(
        'caption',
        format('Summer of ''94 editorial card %s of 90.', v_day + 1)
      )
    where v_episode_id is not null
      and not exists (
        select 1
        from public.episode_media_items
        where episode_media_items.episode_id = v_episode_id
      );

    insert into public.episode_prompts (
      episode_id,
      prompt_order,
      prompt_text,
      response_type
    )
    values
      (v_episode_id, 1, v_template.prompt_1, 'text'),
      (v_episode_id, 2, v_template.prompt_2, 'text'),
      (v_episode_id, 3, v_template.prompt_3, 'text')
    on conflict (episode_id, prompt_order)
    do update set
      prompt_text = excluded.prompt_text,
      response_type = excluded.response_type;
  end loop;
end
$$;
