insert into public.unlockables (slug, name, category, pog_cost, metadata)
values
  (
    'basement-sleepover',
    'Basement Sleepover',
    'scene',
    0,
    jsonb_build_object(
      'accent', '#7AC7FF',
      'description', 'Tube TV glow, checker rug, soda on the floor.'
    )
  ),
  (
    'sticker-blast',
    'Sticker Blast',
    'scene',
    0,
    jsonb_build_object(
      'accent', '#F4A7FF',
      'description', 'Sticker bombed mirror, glitter binder, cereal-box posters.'
    )
  ),
  (
    'mall-glow',
    'Mall Glow',
    'scene',
    0,
    jsonb_build_object(
      'accent', '#FFCB69',
      'description', 'Food court neon leaks in through a fake palm-tree lamp.'
    )
  ),
  ('boombox-cassette-stack', 'Boombox Cassette Stack', 'room_decor', 60, '{}'::jsonb),
  ('vhs-tower-lamp', 'VHS Tower Lamp', 'room_decor', 75, '{}'::jsonb),
  ('lava-lamp-blue', 'Blue Lava Lamp', 'room_decor', 80, '{}'::jsonb),
  ('arcade-token-jar', 'Arcade Token Jar', 'room_decor', 55, '{}'::jsonb),
  ('mirror-ball-lights', 'Mirror-Ball Lights', 'room_decor', 65, '{}'::jsonb),
  ('smiley-nameplate', 'Smiley Nameplate', 'profile_flair', 25, '{}'::jsonb),
  ('glitter-sticker-frame', 'Glitter Sticker Frame', 'profile_flair', 40, '{}'::jsonb),
  ('lisa-frank-paper', 'Lisa Frank Paper', 'note_paper', 35, '{}'::jsonb),
  ('pogs-backing-paper', 'Pogs Backing Paper', 'note_paper', 40, '{}'::jsonb)
on conflict (slug)
do update set
  name = excluded.name,
  category = excluded.category,
  pog_cost = excluded.pog_cost,
  metadata = excluded.metadata,
  updated_at = timezone('utc', now());

insert into public.inventory_items (user_id, unlockable_id, source)
select profiles.user_id, unlockables.id, 'starter_scene'
from public.profiles
join public.unlockables on unlockables.slug = 'basement-sleepover'
on conflict (user_id, unlockable_id) do nothing;

do $$
declare
  v_episode_id uuid;
  v_quest_1 uuid;
  v_quest_2 uuid;
  v_quest_3 uuid;
begin
  insert into public.daily_episodes (
    theme_slug,
    title,
    subtitle,
    unlock_at,
    status,
    personalization_payload
  )
  select
    'blank-tape-warmup',
    'Friday Night Videos: The Blank Tape Warm-Up',
    'A first-night Memory Channel episode built around mall echoes, mix tapes, and school-bus-window daydreams.',
    '2026-04-01T23:30:00Z'::timestamptz,
    'published',
    jsonb_build_object(
      'montage_tags',
      jsonb_build_array('mall echoes', 'mix tapes', 'school bus window')
    )
  where not exists (
    select 1
    from public.daily_episodes
    where daily_episodes.theme_slug = 'blank-tape-warmup'
  );

  select daily_episodes.id
  into v_episode_id
  from public.daily_episodes
  where daily_episodes.theme_slug = 'blank-tape-warmup'
  order by daily_episodes.unlock_at desc
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
    jsonb_build_object('caption', 'Launch-night editorial placeholder')
  where v_episode_id is not null
    and not exists (
      select 1
      from public.episode_media_items
      where episode_media_items.episode_id = v_episode_id
    );

  insert into public.episode_prompts (episode_id, prompt_order, prompt_text, response_type)
  values
    (
      v_episode_id,
      1,
      'Where do you go first when you have two hours of freedom and no phone?',
      'text'
    ),
    (
      v_episode_id,
      2,
      'What song would you risk recording off the radio, even if the DJ talked over the intro?',
      'text'
    ),
    (
      v_episode_id,
      3,
      'Which friend always knew the TV schedule by heart?',
      'text'
    )
  on conflict (episode_id, prompt_order)
  do update set
    prompt_text = excluded.prompt_text,
    response_type = excluded.response_type;

  insert into public.quests (
    slug,
    title,
    weekend_label,
    reward_pogs,
    unlockable_name,
    active_from,
    active_to,
    is_published
  )
  values
    (
      'saturday-morning-cereal-run',
      'Saturday Morning Cereal Run',
      'Weekend 01',
      40,
      'Sticker Blast',
      '2026-04-01T00:00:00Z'::timestamptz,
      '2026-12-31T23:59:59Z'::timestamptz,
      true
    ),
    (
      'mall-bracelet-exchange',
      'Mall Bracelet Exchange',
      'Weekend 02',
      35,
      'Mall Glow',
      '2026-04-01T00:00:00Z'::timestamptz,
      '2026-12-31T23:59:59Z'::timestamptz,
      true
    ),
    (
      'radio-dub-challenge',
      'Radio Dub Challenge',
      'Weekend 03',
      45,
      'Boombox Cassette Stack',
      '2026-04-01T00:00:00Z'::timestamptz,
      '2026-12-31T23:59:59Z'::timestamptz,
      true
    )
  on conflict (slug)
  do update set
    title = excluded.title,
    weekend_label = excluded.weekend_label,
    reward_pogs = excluded.reward_pogs,
    unlockable_name = excluded.unlockable_name,
    active_from = excluded.active_from,
    active_to = excluded.active_to,
    is_published = excluded.is_published,
    updated_at = timezone('utc', now());

  select quests.id into v_quest_1 from public.quests where quests.slug = 'saturday-morning-cereal-run';
  select quests.id into v_quest_2 from public.quests where quests.slug = 'mall-bracelet-exchange';
  select quests.id into v_quest_3 from public.quests where quests.slug = 'radio-dub-challenge';

  insert into public.quest_steps (quest_id, step_order, prompt_text)
  values
    (v_quest_1, 1, 'Spot a cereal box in your kitchen.'),
    (v_quest_1, 2, 'Hum the fake jingle into your phone.'),
    (v_quest_1, 3, 'Choose the mascot that would absolutely sell you on sugar.'),
    (v_quest_2, 1, 'Make a friendship bracelet color pick.'),
    (v_quest_2, 2, 'Name the store kiosk where you would buy beads.'),
    (v_quest_2, 3, 'Snap the bracelet against your wrist in spirit.'),
    (v_quest_3, 1, 'Choose the song you would wait all evening to record.'),
    (v_quest_3, 2, 'Describe the DJ interruption that ruined the intro.'),
    (v_quest_3, 3, 'Name the mix-tape title written in gel pen.')
  on conflict (quest_id, step_order)
  do update set
    prompt_text = excluded.prompt_text;
end
$$;
