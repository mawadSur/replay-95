# Replay '95 Phase 1 Content System

Last updated: 2026-04-23

## Content Principles

- curated over endless
- specific over generic
- reflective over performative
- tactile over gamified
- private over social-first

## 1. Onboarding Question Bank

The beta onboarding bank should stay short and map directly to the current `profiles` schema.

| Field | Prompt | Input | Beta options or format | Personalization use |
| --- | --- | --- | --- | --- |
| `display_name` | What should Replay '95 call you? | text | nickname or first name | profile card, notes, bedroom ownership |
| `hometown` | What town felt like your whole universe? | text | `City, State` | hometown-flavored prompt copy |
| `birth_year` | What year were you born? | numeric | `1980-1995` only | age-tuned episode framing |
| `console_choice` | Which console felt most like yours? | single select | SNES, Sega Genesis, Nintendo 64, PlayStation, Game Boy | episode tags and prompt variants |
| `mall_store` | Which store pulled you in first? | single select | Sam Goody, Claire's, Suncoast, KB Toys, Spencer's, Limited Too | episode tags and mall prompts |
| `channel_block` | Which TV block had appointment-viewing power over you? | single select | TGIF, SNICK, Toonami, Friday Night Videos, Nickelodeon afternoons | prompt variants and episode titles |
| `music_mood` | What music energy are you built around? | single select | Alternative rock, Bubblegum pop, R&B, Grunge, Hip-hop, Pop punk | soundtrack framing and prompt voice |
| `dream_concert` | Name the dream show you still would have begged to attend. | free text | open text | specific memory anchors and prompt callbacks |

### Copy Rules

- Each question should feel like a memory trigger, not demographic intake.
- Avoid corporate form language.
- Keep the entire bank completable in under 90 seconds.

## 2. Avatar Customization Options

The beta avatar system stays deliberately simple and school-photo themed. It maps to the existing `avatar_choices` schema.

### Outfit Options

- Denim jacket
- Windbreaker
- Plaid shirt
- Band tee
- Overalls
- Striped rugby shirt
- Corduroy overshirt
- Varsity jacket

### Trapper Keeper Pattern Options

- Galaxy checker
- Lisa Frank leopard
- Flame grid
- Cloud wash
- Neon squiggle
- Marble swirl
- Hologram stars
- Memphis confetti

### Slap Bracelet Color Options

- Slime green
- Bubblegum pink
- Atomic orange
- Clear glitter
- Cobalt blue
- Purple jelly
- Safety yellow
- Chrome silver

### Avatar Rules

- All launch avatar options are free.
- Quest and store rewards can later add profile flair around the avatar, but not block basic identity setup.
- The avatar preview should always show the chosen outfit, pattern, and bracelet together in one frame.

## 3. Memory Channel Template Structure

Every nightly episode template should define:

- `theme_slug`
- `title_frame`
- `subtitle_frame`
- `montage_tags`
- `prompt_1_memory`
- `prompt_2_specificity`
- `prompt_3_identity_callback`
- allowed media types: `image`, `audio`, or `copy_only` for beta

The first 30 launch templates:

| Day | Slug | Title frame | Personalization hooks | Prompt angle |
| --- | --- | --- | --- | --- |
| 1 | `blank-tape-warmup` | Friday Night Videos: The Blank Tape Warm-Up | `channel_block`, `music_mood` | recording songs off the radio |
| 2 | `mall-run-countdown` | The `{mall_store}` After-School Run | `mall_store`, `hometown` | first stop when you only have two hours |
| 3 | `bus-window-soundtrack` | The Bus Ride Home Soundtrack | `music_mood`, `birth_year` | what music or mood owned the ride home |
| 4 | `school-photo-day` | Picture Day Nerves, 1995 Edition | `avatar.outfit`, `birth_year` | what you wore and why it mattered |
| 5 | `sleepover-floor-sprawl` | Basement Sleepover Transmission | `channel_block`, `dream_concert` | who stayed awake longest and what played on TV |
| 6 | `saturday-cereal-lab` | Saturday Morning Cereal Science | `birth_year` | cartoons, sugar, and fake jingles |
| 7 | `mall-food-court-debate` | Food Court Summit Meeting | `mall_store`, `hometown` | the correct order of mall stops |
| 8 | `roller-rink-neon` | Roller Rink Slow-Song Damage | `music_mood` | the song that made the night feel cinematic |
| 9 | `arcade-last-token` | Last Token At The Arcade | `console_choice` | what game got the final quarter |
| 10 | `video-store-friday` | Friday Night Rental Aisle | `channel_block`, `birth_year` | VHS picks and aisle rituals |
| 11 | `pager-code-crush` | Pager Code Confidential | `birth_year`, `music_mood` | low-stakes crush communication |
| 12 | `trapper-chaos` | Backpack Zip Pocket Archaeology | `avatar.trapperPattern` | what always lived in the bag |
| 13 | `poster-wall` | Bedroom Poster Wall Audit | `dream_concert`, `music_mood` | the wall item that defined your taste |
| 14 | `summer-pool-break` | Public Pool Radio Static | `hometown`, `birth_year` | summer smell and soundtrack memory |
| 15 | `county-fair-night` | County Fair Lights After Dark | `dream_concert`, `avatar.outfit` | parking-lot outfit and post-show feeling |
| 16 | `classroom-note-panic` | Folded Note During Third Period | `hometown` | passing notes without getting caught |
| 17 | `toy-aisle-tunnel` | The Toy Aisle Time Warp | `birth_year` | the shelf that could ruin your focus |
| 18 | `family-road-trip` | Backseat Road Trip Radio Wars | `music_mood`, `hometown` | who controlled the tape deck |
| 19 | `rainy-sick-day-tv` | Sick Day On The Couch | `channel_block` | daytime TV comfort memory |
| 20 | `school-dance-parking-lot` | School Dance Parking Lot Debrief | `avatar.outfit`, `music_mood` | awkwardness, outfits, and post-dance energy |
| 21 | `birthday-sleepover` | Birthday Sleepover Rules Committee | `birth_year` | snacks, movies, and who picked the vibe |
| 22 | `yearbook-signing` | Yearbook Signature Season | `hometown`, `birth_year` | the note you still remember reading |
| 23 | `garage-sale-gold` | Garage Sale Treasure Hunt | `hometown` | unexpected object that felt priceless |
| 24 | `halloween-costume-box` | Costume Bin Chaos | `avatar.outfit` | the most improvised costume win |
| 25 | `snow-day-cable` | Snow Day Cable Marathon | `channel_block`, `hometown` | weather, TV, and snack memory |
| 26 | `first-cd-obsession` | The CD You Wore Out | `music_mood`, `dream_concert` | album as personality declaration |
| 27 | `food-court-fashion` | Mall Look Reconstruction | `avatar.outfit`, `mall_store` | the fit you thought was untouchable |
| 28 | `weekend-blockbuster` | The Movie Everyone Quoted Monday | `birth_year`, `hometown` | shared quote memory and school Monday aftermath |
| 29 | `holiday-commercials` | Holiday Break Commercial Brain | `birth_year` | ads, toy catalogs, and seasonal anticipation |
| 30 | `summer-of-94-finale` | The Summer Of '94 Memory Channel | `hometown`, `music_mood`, `dream_concert` | biggest "this felt like my whole life" memory |

## 4. Weekly Quest Set

Each beta quest should have:

- one theme
- three lightweight steps
- one pog reward
- one unlockable outcome

The first 12 quests:

| Weekend | Slug | Title | Reward | Unlockable | Steps |
| --- | --- | --- | --- | --- | --- |
| 01 | `saturday-morning-cereal-run` | Saturday Morning Cereal Run | 40 pogs | Sticker wall collage scene | Spot a cereal mascot. Hum a fake jingle. Pick the box art that would have fooled you. |
| 02 | `mall-bracelet-exchange` | Mall Bracelet Exchange | 35 pogs | Bean bag + pager dock | Pick bracelet colors. Name the kiosk. Describe the friend you would trade with. |
| 03 | `radio-dub-challenge` | Radio Dub Challenge | 45 pogs | Boombox cassette stack | Choose the song. Describe the DJ interruption. Name the tape title. |
| 04 | `video-store-browse` | Friday Rental Panic | 40 pogs | VHS tower lamp | Pick one rental. Pick one backup. Explain the family argument. |
| 05 | `school-photo-signature` | Yearbook Signature Sprint | 35 pogs | Hallway yearbook frame | Write the one-line signature. Name the pen color. Pick whose message mattered most. |
| 06 | `sleepover-checklist` | Sleepover Floor Rules | 45 pogs | Inflatable chair | Pick snacks. Pick the TV block. Decide who got no sleep. |
| 07 | `food-court-combo` | Food Court Combo Draft | 35 pogs | Neon palm-tree lamp | Pick the meal. Pick the drink. Pick the wandering order after eating. |
| 08 | `arcade-last-token` | Last Token Championship | 50 pogs | Arcade token jar | Pick the cabinet. Describe the crowd. Decide whether the last token was skill or panic. |
| 09 | `roller-rink-slow-song` | Roller Rink Redemption | 40 pogs | Mirror-ball string lights | Pick the song. Pick the skates. Describe where you hid during the slow dance. |
| 10 | `desk-doodle-club` | Gel Pen Doodle Club | 35 pogs | Gel pen desk set | Pick the pen color. Doodle a fake slogan. Decide what belonged on the binder cover. |
| 11 | `county-fair-encore` | County Fair Encore | 45 pogs | Parking-lot poster pack | Pick the concert shirt. Name the food stand. Describe the walk back to the car. |
| 12 | `snow-day-cable-marathon` | Snow Day Cable Marathon | 40 pogs | Fuzzy TV blanket | Pick the channel. Pick the snack. Decide whether snow days felt longer or faster. |

## 5. Pog Economy

### Starting Balance

- Grant `125` pogs when onboarding completes.

This matches the current prototype and gives the user enough early agency without trivializing quest rewards.

### Earning Rules

- nightly episode completed: `15` pogs
- first voice reply of the day once voice ships: `+5` pog bonus
- first note sent each week: `10` pogs
- accepted first friend connection: `25` pogs one time
- weekly quest completion: `35-50` pogs based on quest weight

### Spending Rules

- No loot boxes.
- No pog loss mechanic.
- Quest-exclusive unlockables are not purchasable.
- Store items should mostly live in the `25-90` pog range.
- Premium subscription may widen access to the catalog, but it should not replace pog earning.

## 6. Initial Unlockables Catalog

Use these `unlockables.category` values in beta:

- `scene`
- `room_decor`
- `profile_flair`
- `note_paper`

Initial catalog:

| Slug | Name | Category | Cost | Source |
| --- | --- | --- | --- | --- |
| `basement-sleepover` | Basement Sleepover | scene | 0 | starter |
| `sticker-blast` | Sticker Blast | scene | 0 | quest reward |
| `mall-glow` | Mall Glow | scene | 0 | quest reward |
| `boombox-cassette-stack` | Boombox Cassette Stack | room_decor | 60 | store |
| `vhs-tower-lamp` | VHS Tower Lamp | room_decor | 75 | quest reward |
| `lava-lamp-blue` | Blue Lava Lamp | room_decor | 80 | store |
| `arcade-token-jar` | Arcade Token Jar | room_decor | 55 | quest reward |
| `mirror-ball-lights` | Mirror-Ball Lights | room_decor | 65 | quest reward |
| `smiley-nameplate` | Smiley Nameplate | profile_flair | 25 | store |
| `glitter-sticker-frame` | Glitter Sticker Frame | profile_flair | 40 | store |
| `lisa-frank-paper` | Lisa Frank Paper | note_paper | 35 | store |
| `pogs-backing-paper` | Pogs Backing Paper | note_paper | 40 | store |

## 7. Implementation Notes

- The current schema already supports the phase 1 content plan.
- The only content fields that need editorial tools immediately are episodes, prompts, quests, quest steps, and unlockables.
- We do not need a CMS before the first internal build; seeded data is enough for beta rehearsal.
