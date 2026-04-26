# Replay '95 Build Plan

Last updated: 2026-04-23
Status: Implementation started

## Product Goal

Build `Replay '95` as a daily nostalgia ritual for people born 1980-1995.

The app should feel like:

- curated, not algorithmic
- intimate, not performative
- playful, but not over-gamified
- personalized around the user's real 90s memories

The core retention loop is not endless content. It is:

1. evening push notification
2. short themed "episode"
3. reflective response
4. light social follow-up
5. weekly quest and collectible progress

## Recommended Build Strategy

We should build this in two layers:

### Layer 1: Beta / MVP

Ship the emotional core first:

- onboarding + 90s profile
- daily Memory Channel
- push notifications
- text + voice responses
- delayed Classroom Notes between approved friends
- weekly quests
- pog currency + unlockables
- simple bedroom/profile customization
- Replay+ subscription skeleton

### Layer 2: Post-beta / expansion

Defer the high-risk features until the daily loop is proven:

- full AR VHS Viewer with real object anchoring
- pen pal matching
- licensed media library expansion
- IRL nostalgia classifieds marketplace
- retro mini-games
- short video responses if moderation and storage cost allow

## Why This Order

- The daily Memory Channel is the product.
- AR is attractive, but it is not the first thing that proves retention.
- Licensed media creates legal and cost complexity; it should not block the first launch.
- Marketplace and pen-pal features create trust-and-safety overhead and should come after the core experience is stable.

## Recommended Technical Stack

### Client

- Expo
- React Native
- TypeScript
- Expo Router
- TanStack Query
- Zustand only for small shared client state

### Backend

- Supabase Auth
- Supabase Postgres
- Supabase Storage
- Supabase Edge Functions for scheduling, note delivery, and quest logic

### Core integrations

- Expo Notifications
- RevenueCat for subscriptions
- Sentry for crash/error reporting
- PostHog for product analytics

### Media / content

- editorial content stored in Postgres + Storage
- short owned/licensed clips only for beta
- user response uploads stored in Storage with moderation hooks

### AR approach

For beta, do not commit to full native AR yet.

Recommended approach:

- start with a camera mode plus period filters and 2D/anchored overlays
- make it shareable as stills and short loops
- evaluate bare React Native + native ARKit/ARCore only after beta if true world-anchored AR is still a top retention lever

## MVP Scope Decision

### In scope for beta

- account creation and profile setup
- nostalgic questionnaire
- 90s avatar / school-photo style profile
- daily evening episode
- content montage card or lightweight media experience
- 3 personalized prompts per episode
- response types: text and voice
- delayed friend notes
- weekly quests
- pog wallet
- unlockable profile cosmetics / bedroom items
- basic paywall and free-tier limits

### Explicitly out of scope for beta

- advanced spatial AR object placement
- open pen-pal matching
- community comments
- full IRL marketplace
- licensed brand sticker drops
- mini-games
- long-form user video

## Product Risks We Need To Handle Early

### 1. Content licensing

"Real 90s media snippets" is risky if we do not have rights.

Plan:

- beta uses owned, partner-cleared, public-domain, or fully licensed media only
- design the content engine so media items are data-driven and replaceable
- keep fallback text/audio/image variants for every episode

### 2. Moderation and trust

Even with low-pressure notes, abuse is possible.

Plan:

- friends-only notes first
- report/block tools from day one
- no public feed
- pen-pal system only after moderation tools are proven

### 3. AR complexity

True AR is expensive and can derail the schedule.

Plan:

- beta uses "camera magic" rather than promising perfect world tracking
- validate whether users actually care about shareable VHS moments before investing in native AR

### 4. Content operations

Daily episodes require real editorial throughput.

Plan:

- build a reusable episode template system
- author content in weekly batches
- generate personalization from profile traits, not from fully custom content per user

## Core Screens

- splash / auth
- onboarding questionnaire
- avatar builder
- home / Tonight screen
- episode player
- response composer
- notes inbox
- note composer
- quests hub
- pog wallet / unlockables
- 90s bedroom profile
- settings / notification time / subscription

## Data Model We Expect To Need

- users
- nostalgia_profiles
- avatar_choices
- friendships
- daily_episodes
- episode_media_items
- episode_prompts
- episode_responses
- notes
- note_delivery_queue
- quests
- quest_steps
- quest_completions
- pog_wallets
- unlockables
- inventory_items
- subscription_status
- notification_preferences

## Delivery Phases

### Phase 0: Product and architecture lock

- [x] Create `steps.md`
- [x] Confirm beta scope
- [x] Confirm whether beta includes voice only or voice + video replies
- [x] Confirm content licensing strategy
- [x] Confirm AR beta approach: filters + overlays, not full world AR
- [x] Confirm monetization for beta: free tier + Replay+
- [x] Define launch market and age gating / privacy requirements

Exit criteria:

- no major product ambiguity blocks implementation

### Phase 1: UX and content system planning

- [x] Define complete information architecture
- [x] Write user flows for onboarding, nightly episode, notes, quests, and unlockables
- [x] Create 90s visual direction and design tokens
- [x] Define onboarding question bank
- [x] Define avatar customization options
- [x] Define 30 days of Memory Channel templates
- [x] Define first 12 weekly quests
- [x] Define initial pog economy and unlockables

Exit criteria:

- we know exactly what v1 should look like and what content the app needs for beta

Reference docs:

- `docs/phase-1/README.md`
- `docs/phase-1/launch-market-and-privacy.md`
- `docs/phase-1/information-architecture.md`
- `docs/phase-1/user-flows.md`
- `docs/phase-1/content-system.md`

### Phase 2: Project scaffold and infrastructure

- [x] Create Expo app with TypeScript
- [x] Set up routing
- [x] Set up Supabase project and env management
- [x] Set up auth
- [x] Set up TanStack Query and state providers
- [ ] Set up notifications
- [ ] Set up analytics
- [ ] Set up error reporting
- [ ] Set up linting, formatting, testing, and CI

Exit criteria:

- app boots cleanly and talks to backend environments

### Phase 3: Core data model and backend services

- [x] Build Postgres schema
- [x] Build storage buckets and upload rules
- [x] Build profile creation flow on backend
- [x] Build episode scheduling and retrieval logic
- [x] Build delayed note delivery logic
- [x] Build quest completion logic
- [x] Build pog and unlockable services
- [x] Build subscription status sync

Exit criteria:

- backend supports all beta feature flows without mocks

### Phase 4: Onboarding and profile

- [x] Build onboarding questionnaire UI
- [x] Build nostalgic answer capture and persistence
- [x] Build 90s avatar editor
- [x] Build school-photo style profile preview
- [x] Build hometown / birth-year / preference personalization hooks

Exit criteria:

- a new user can fully create a nostalgia profile and avatar

### Phase 5: Daily Memory Channel

- [x] Build Tonight screen
- [x] Build push-notification entry flow
- [x] Build episode player shell
- [x] Build prompt cards and response UI
- [x] Build text reply flow
- [x] Build voice memo flow
- [x] Build episode completion state and streak / history logic

Exit criteria:

- a user can receive, open, complete, and save a daily episode

### Phase 6: Classroom Notes social layer

- [x] Build friend connection model
- [x] Build note composer with paper themes
- [x] Build delayed delivery queue and note arrival UX
- [x] Build inbox and read / reply flow
- [x] Build block / report / mute tools
- [x] Enforce free-tier note limits

Exit criteria:

- users can safely exchange delayed notes with approved friends

### Phase 7: Weekly quests and rewards

- [x] Build quest hub
- [x] Build multi-step quest progress tracking
- [x] Build completion rewards
- [x] Build pog wallet UI
- [x] Build unlockables inventory
- [x] Build bedroom/profile customization

Exit criteria:

- users can complete quests and spend pogs on visible unlockables

### Phase 8: Monetization and account systems

- [x] Add Replay+ paywall
- [x] Gate free-tier usage correctly
- [x] Build subscription restore flow
- [x] Build settings screen
- [x] Build notification time preferences

Exit criteria:

- free and paid entitlements are working correctly

### Phase 9: Beta polish

- [ ] Add period-accurate visual filters
- [ ] Add shareable still export
- [ ] Add lightweight loop export for camera mode
- [ ] Polish empty, loading, and error states
- [ ] Tune copy and nostalgic voice
- [ ] Add analytics dashboards for onboarding, daily open rate, and quest completion
- [ ] Seed first 90 days content: Summer of '94

Exit criteria:

- beta feels coherent, stable, and content-complete enough for first users

### Phase 10: Launch prep

- [ ] Build waitlist flow
- [ ] Build invite / referral mechanic
- [ ] Prepare App Store and Play Store assets
- [ ] Prepare soft-launch support workflow
- [ ] Prepare feedback capture inside the app
- [ ] Prepare rollout plan for Facebook groups and Reddit communities

Exit criteria:

- app is ready for soft launch with 5,000 beta users

## Success Metrics For Beta

- onboarding completion rate
- daily episode open rate
- daily episode completion rate
- D7 retention
- weekly quest completion rate
- number of notes sent and opened
- Replay+ conversion rate

## Open Questions We Need To Answer Before Implementation Goes Too Far

- ~~Should beta include user video replies, or should we stay with text + voice only?~~ **Resolved 2026-04-26: text + voice only for beta. Video stays post-beta.**
- Are friends added by phone contacts, username, invite code, or private link?
- Do we want UGC note attachments in beta, or text only?
- How much of the "media montage" is real licensed media versus original editorial packaging?
- Is the bedroom profile a simple static scene in beta, or a fully interactive room?

## Immediate Next Step

Once this plan is approved, we should start with:

1. lock beta scope
2. create the app scaffold
3. define the database schema
4. design the onboarding and Tonight flow before building the rest

## Code Reviews (per segment)

These sections are populated by the per-segment review agents in `.claude/agents/`. Each agent owns the block between its `<!-- BEGIN Review: X -->` and `<!-- END Review: X -->` markers and rewrites it idempotently. Don't hand-edit between the markers — re-run the agent instead.

To run a review, use the Agent tool with the matching `subagent_type`. Each agent reads `docs/product-brief.md` plus its assigned files, then surfaces gaps and concrete fixes against the brief.

### Review — onboarding
<!-- BEGIN Review: onboarding -->

_Last reviewed: 2026-04-25 by replay-review-onboarding._

**Brief mismatches**

- **No Walkman/CD/cassette prompt** — Brief §2.A explicitly lists "What was your first Walkman / CD / cassette?" as a foundational onboarding question, but the question bank ships only console/mall/block/mood/dream-concert. Fix: add a `first_tape` (or `first_album`) single-select question between taste and dream-concert with a small curated option list. (`src/features/profile/profile-options.ts:4`, `app/(onboarding)/taste.tsx:28`)
- **No first-concert option separate from dream-concert** — Brief §2.A reads "First concert or dream concert" — the code only captures `dreamConcert`. A user whose memory anchor is a real first show has to re-purpose the dream-concert field. Fix: add a toggle on `dream-concert.tsx` to flag whether the answer is "first" or "dream," persist it on the profile row. (`app/(onboarding)/dream-concert.tsx:25`, `src/features/profile/profile-service.ts:165`)
- **5–7 minute timing claim conflicts with content-system spec** — Brief §2.A promises 5–7 min, but `docs/phase-1/content-system.md:32` says "under 90 seconds" and the actual flow (3 text fields + 4 single-select chip rows + 3 avatar chip rows + a switch screen) is realistically <2 min. Fix: pick one — either expand the question bank to hit 5–7 min, or update the brief copy and welcome subtitle. (`app/(onboarding)/welcome.tsx:46`, `docs/phase-1/content-system.md:32`)
- **Welcome age & cohort gates are self-toggles, not enforced** — `welcome.tsx` only asks the user to flip two switches confirming "I am 18+" and "I understand cohort is 1980-1995"; no DOB/birth-date is collected here. The cohort gate gets enforced later via `isBirthYearInRange` on the profile screen, but the age gate is never re-checked. Fix: either (a) drop the welcome toggles and rely on the birth-year input, or (b) collect DOB and validate calendar age >= 18. (`app/(onboarding)/welcome.tsx:55`, `src/features/profile/profile-personalization.ts:18`)
- **Draft profile seeded with realistic sample data** — `initialDraftProfile` at `src/state/replay-context.tsx:48` pre-fills `name: "Alex"`, `hometown: "Philadelphia, PA"`, `birthYear: 1988`, `dreamConcert: "No Doubt at a county fair"`, plus all four taste anchors. A new user can hit Continue on every screen without typing a thing, and the saved profile will be a stock answer rather than personal data — directly undermining the brief's "your actual historical data" promise. Fix: blank the seed values (empty strings, `birthYear: NaN` or null) so chip rows and inputs require explicit selection before Continue enables. (`src/state/replay-context.tsx:48`)
- **Avatar preview is abstract silhouette, not "school photo from 1995"** — Brief §2.A frames the avatar as a school photo. `SchoolPhotoCard` renders a brown circle head (`#6C4A36` hardcoded) with no face, hair, glasses, or skin-tone choice. The Trapper Keeper, outfit, and slap bracelet are visible together (good), but the "school photo" framing breaks the moment the user looks at it. Fix: either add minimal face/hair/skin customization options, or commit to a clearly stylized photo-frame illustration that reads as deliberate (e.g., flash glare, neutral name plate). (`src/components/school-photo-card.tsx:222`)
- **Nightly delivery time locked to 3 chips** — Brief calls out "7 PM (or user-chosen time)" implying flexible choice. `nightlyDeliveryTimeOptions` only offers 17:30 / 19:00 / 20:30. Fix: replace the chip row with a time picker (or expand the chip list to 30-min increments across 17:00–22:00). (`src/features/profile/profile-options.ts:71`, `app/(onboarding)/notifications.tsx:62`)

**Code-quality findings**

- **Back buttons use `router.replace` instead of `router.back`** — Every onboarding screen wires Back to `router.replace("/(onboarding)/<previous>")`, which rewrites the history stack. Fast double-tapping back can desync the stack vs. the visual flow, and any deep-link entry won't unwind cleanly. Fix: switch to `router.back()` (with a fallback `router.replace` only when `canGoBack` is false). (`app/(onboarding)/profile.tsx:103`, `app/(onboarding)/taste.tsx:84`, `app/(onboarding)/dream-concert.tsx:46`, `app/(onboarding)/avatar.tsx:76`, `app/(onboarding)/notifications.tsx:128`, `app/(onboarding)/done.tsx:78`)
- **Birth-year input pre-filled with `1988` for every new user** — `birthYearInput` initializes from `String(draftProfile.birthYear)` and the draft seed is `1988`, so the field shows "1988" for first-time users who never typed anything. Combined with the seed name/hometown above, the entire profile screen looks pre-filled. Fix: initialize `birthYearInput` to "" when the draft is the seed default; require explicit input. (`app/(onboarding)/profile.tsx:17`, `src/state/replay-context.tsx:51`)
- **`callback.tsx` has no error UI** — If `hydrateSessionFromUrl` throws (caught silently in `replay-context.tsx:162`), the callback screen stays on `LoadingScreen` forever; user can't retry without backgrounding the app. Fix: surface a "couldn't open the link, request a new one" CTA after a timeout, or thread the hydrate error into `ReplayContext` so callback can render it. (`app/callback.tsx:6`, `src/state/replay-context.tsx:160`)
- **Magic-link form does no email-format validation** — `LoginScreen` only gates on `email.trim()` length, then forwards to Supabase. Bad inputs surface as raw Supabase errors. Fix: add a regex/format check and a friendly inline error before calling `requestMagicLink`. (`app/(auth)/login.tsx:40`, `app/(auth)/login.tsx:96`)
- **Drafts reset on every session.user.id change** — `useEffect` at `replay-context.tsx:180` resets `draftProfile` and `notificationDraft` to seeds whenever `session?.user.id` changes. A token refresh mid-onboarding (which can re-emit `onAuthStateChange`) can wipe entered values. Fix: only reset when transitioning from a valid id to a different valid id, not on every emit; or persist the draft to AsyncStorage. (`src/state/replay-context.tsx:180`)
- **Redundant redirect race in `done.tsx`** — After `completeOnboarding()` succeeds, `(onboarding)/_layout.tsx:22` redirects to `/(tabs)/today` because `hasCompletedOnboarding` flips, _and_ `done.tsx:32` calls `router.replace("/(tabs)/today")`. Two routers fighting for the same destination. Fix: drop the manual replace in `done.tsx` and let the layout gate handle it. (`app/(onboarding)/done.tsx:32`, `app/(onboarding)/_layout.tsx:22`)
- **Notification permission errors swallowed silently** — `notifications.tsx:90` fires `mutateAsync` with `void` and no `try/catch`; if the mutation rejects (denied permission, scheduling failure), the user sees no message and the button just re-enables. Fix: add an `errorText` state and surface mutation errors. (`app/(onboarding)/notifications.tsx:90`)
- **No sign-out / change-email escape from welcome** — A user who signed in with the wrong email reaches `welcome.tsx` with no way to go back to `/login`; `(onboarding)/_layout.tsx` only redirects when `!session`. Fix: add a small "Use a different email" link in `welcome.tsx` that calls `signOut()`. (`app/(onboarding)/welcome.tsx:48`, `src/state/replay-context.tsx:260`)
- **`totalSteps={7}` hardcoded in every onboarding screen** — Each screen passes its own step+totalSteps literal; adding/removing a screen requires touching all of them. Fix: hoist a shared `ONBOARDING_STEPS` constant or compute step count from the route segment list. (`app/(onboarding)/welcome.tsx:43`, `app/(onboarding)/profile.tsx:55`, `app/(onboarding)/taste.tsx:23`, `app/(onboarding)/dream-concert.tsx:19`, `app/(onboarding)/avatar.tsx:21`, `app/(onboarding)/notifications.tsx:51`, `app/(onboarding)/done.tsx:44`)
- **`onboarding_completed` analytics event misses dream-concert and music-mood** — `replay-context.tsx:242` only forwards `birthYear`, `channelBlock`, `consoleChoice`, `mallStore` to analytics. Music mood and dream-concert presence are also useful cohort signals. Fix: include `musicMood` and a boolean `hasDreamConcert` in the metadata payload. (`src/state/replay-context.tsx:242`)
- **`pog_wallets` upsert with `ignoreDuplicates: true` is correct but `setPogs` fallback hides it** — When viewer wallet row is missing on first fetch, `replay-context.tsx:189` falls back to `STARTING_POG_BALANCE` even before the upsert lands; UI may briefly show 125 even if backend has a different balance. Low risk for new users but flagged for awareness. Fix: gate `setPogs` on `viewer.walletBalance != null`. (`src/state/replay-context.tsx:189`, `src/features/profile/profile-service.ts:146`)
- **Cross-segment**: notification scheduling sync logic in `replay-context.tsx:198-219` — covered by `replay-review-memory-channel`.
- **Cross-segment**: starting pog balance and content-system pog rules — covered by `replay-review-monetization` / `replay-review-schema-content`.

**Open questions for product**

- Is the brief's "5–7 min" still the target, or has content-system.md's "under 90 seconds" superseded it? The flow needs to be rebalanced around whichever is canonical.
- Should the welcome age gate collect a real DOB and validate `age >= 18`, or is the self-confirmation toggle acceptable for the closed beta?
- Do we want to add the Walkman/CD/cassette prompt and split first-concert vs dream-concert, given the brief calls them out explicitly?
- Should the school-photo avatar render an actual face (skin tone, hair, glasses) for the beta, or are we committing to an abstract silhouette as the deliberate stylistic choice?
- Should nightly delivery time be a free time picker rather than three fixed chips? If we keep chips, are 5:30 / 7:00 / 8:30 the right anchor times?
- For users who want to redo their email mid-onboarding, do we expose a "use a different email" path on the welcome screen, or rely on settings after they finish?

<!-- END Review: onboarding -->

### Review — memory-channel
<!-- BEGIN Review: memory-channel -->

_Last reviewed: 2026-04-25 by replay-review-memory-channel._

**Brief mismatches**

- **No video reply path** — Brief §2.B explicitly lists "voice memo, text, **or short video**" as reply types, but the schema constraint only allows `text`/`voice`, the today screen has no video capture/upload UI, and the response mapping in `episode-service.ts` only types `text`/`voice`. Fix: add `'video'` to the `episode_responses.response_type` check (and to `episode_prompts.response_type`), wire a video reply flow on the today screen, or formally descope video for beta in `steps.md` "MVP Scope Decision". (`supabase/migrations/0001_replay95_beta.sql:86`, `app/(tabs)/today.tsx:540`, `src/features/memory/episode-service.ts:29`)
- **Period-accurate filters not wired into reply capture** — Brief calls for VHS tracking / tube-TV / pan-and-scan filters during reply recording; in this build the today screen records raw audio with no filter pipeline, and `camera-filters.ts` lives in the booth slice (covered by `replay-review-bedroom-ar`). Fix: either pull a filter selector + post-process step into the voice/video reply flow, or descope filters for beta in `steps.md`. (`app/(tabs)/today.tsx:198`, `src/features/memory/episode-service.ts:496`)
- **Notification copy is not TV-Guide-styled** — Brief's exemplar push reads "Tonight at 7:30 — 'Friday Night Videos: 1994 Alternative Rock Special.' Complete the challenge…", but `syncNightlyMemoryNotifications` schedules a generic title `"Tonight's Memory Channel is ready"` with no episode name and no listing-style framing. The schedule also fires before the episode title is known on-device. Fix: query the next published `daily_episodes` row at schedule time and bake the title + delivery hour into the notification body, or introduce a server-side scheduler that personalizes copy per user. (`src/features/memory/memory-notification-service.ts:153`)
- **Prompts are static, not profile-driven** — Brief shows "You're 13. Your mom drops you and a friend at the mall…" — i.e., prompts grounded in birth year + hometown + mall store. The seed inserts three fixed prompts with no template tokens, the `episode_prompts` table has no slot for personalization variables, and `get_tonight_episode` returns `prompt_text` verbatim with no substitution. Personalization only happens in the local `buildTonightEpisode` fallback. Fix: introduce a `personalization_tokens` jsonb column (or template syntax) on `episode_prompts` and a substitution step in the RPC or client that injects `{birth_year}`, `{mall_store}`, etc. before render. (`supabase/migrations/0001_replay95_beta.sql:71`, `supabase/migrations/0003_replay95_seed_beta_content.sql:112`, `supabase/migrations/0002_replay95_backend_services.sql:148`)
- **Montage is a single copy-only placeholder, not a 60–90s clip reel** — Brief specifies a 60–90 second clip montage; the schema has `duration_seconds` on `episode_media_items` but no logic enforces or sums montage length, the seed inserts one `copy_only` row with caption "Launch-night editorial placeholder", and the today UI just lists media items as "Scene N" cards. Fix: schedule real `image`/`audio` (or `video`, once licensed) media with `duration_seconds` populated, render a sequenced playback rail in `today.tsx`, and validate total duration sits in 60–90s before publishing an episode. (`supabase/migrations/0003_replay95_seed_beta_content.sql:94`, `app/(tabs)/today.tsx:456`)
- **History surface leans engagement-vanity, not ritual cadence** — Brief frames the loop as "check in once or twice a day" and "feels curated like a zine, not a firehose"; the completion card surfaces `Total saves` and `Response days` as headline numbers, which encourage save-stuffing rather than a single nightly check-in. Fix: drop `Total saves`, replace with "Last drop" / "Tonight" framing; keep streak but cap visible history at days, not raw response counts. (`app/(tabs)/today.tsx:617`)
- **Fallback episode is barely distinguishable from a real one** — When `get_tonight_episode` returns null, `buildFallbackEpisode` renders the hero card with a real-looking title (a mall-store-tuned variant when a profile exists) and the streak/pogs stats. The only signal is one line of helper text in the player rail; the hero, prompt cards, and completion state all read identical to a published night. Fix: prefix the hero eyebrow with "Preview" / "Sample episode" when `episode.isFallback`, suppress streak increments on fallback days, and gray-out the save buttons (saves currently fail with the "Apply the new Supabase seed migrations" error anyway). (`src/features/memory/episode-service.ts:213`, `app/(tabs)/today.tsx:350`, `app/(tabs)/today.tsx:472`)
- **`get_tonight_episode` has no per-day rotation or timezone awareness** — The RPC selects the published episode with the latest `unlock_at <= now()` ordered desc, so once a second episode publishes the previous night's content is permanently unreachable, and there's no "today's" filter — a user opening at 6:55 PM local time gets yesterday's episode if the new drop is keyed to 7:30 PM UTC. Brief expects nightly cadence at the user's chosen hour. Fix: include `notification_preferences.timezone` and a `published_for` date column, or filter by `date_trunc('day', unlock_at) = current_date_in_user_tz`. (`supabase/migrations/0002_replay95_backend_services.sql:129`)

**Code-quality findings**

- **Missing `prompt_save` analytics event** — The agent scope explicitly calls out tracking `today_open` and `prompt_save`. `today_open` fires from `today.tsx:155`, but neither `useSaveTextEpisodeResponse` nor `useSaveVoiceEpisodeResponse` calls `trackBetaEvent` on success. Fix: add a `trackBetaEvent({ eventName: "prompt_save", metadata: { episodeId, promptId, mode: "text" | "voice" } })` call in the `onSuccess` of both mutations. (`src/features/memory/episode-service.ts:486`, `src/features/memory/episode-service.ts:582`)
- **`useTonightEpisode` query key doesn't include profile** — Query key is `["tonight-episode", userId]` and `initialData` is computed from `profile`, but if the user updates their `mall_store`/`hometown` after the query first runs the cached fallback won't recompute. Fix: include a stable profile fingerprint (e.g. `profile?.updatedAt`) in the queryKey, or invalidate the query in `saveOnboardingProfile`/profile-edit flows. (`src/features/memory/episode-service.ts:282`)
- **Voice playback `replace` is not awaited before `play`** — `voicePlayer.replace({ uri: nextSource })` is followed immediately by `voicePlayer.play()`; the player can begin playback against the previous source on slow swaps. Fix: await `voicePlayer.replace(...)` (or chain on its returned promise) before calling `play()`. (`app/(tabs)/today.tsx:296`)
- **`historySummary.entries.slice(0, 5)` over a 60-row response cap miscounts heavy users** — `useEpisodeHistory` fetches the latest 60 `episode_responses` rows, then groups by `(dayKey, episodeId)`. A user who saves 30 text edits in one night burns half the window on one day, hiding earlier days from "Recent" history. Fix: query distinct `(date_trunc('day', updated_at), episode_id)` server-side via an RPC, or raise the row limit and group by day before slicing. (`src/features/memory/episode-service.ts:357`)
- **`extractReplayNotificationRoute` defaults to `/(tabs)/today` for any payload** — If `data.route` is missing or malformed it silently routes to today; today there's no other notification source so this is benign, but the moment a second notification class ships any payload missing `data.route` will hijack the today tab. Fix: return `null` when `data.route` isn't a recognized Replay route. (`src/features/memory/memory-notification-service.ts:204`)
- **Fallback save error is user-hostile** — When `episodeId` is null the save mutations throw `"Apply the new Supabase seed migrations before saving nightly memories."` — that's a developer message rendered as `errorText` to the user. Fix: render a user-facing message ("Tonight's episode hasn't dropped yet — check back at <hour>.") and disable the save button when `episode.isFallback` is true. (`src/features/memory/episode-service.ts:440`, `src/features/memory/episode-service.ts:516`, `app/(tabs)/today.tsx:531`)
- **Default notification hour drifts between client and server** — `notification_preferences` is auto-seeded server-side at `19:00 America/New_York` in the `ensure_profile_defaults` trigger, while the client's `notificationDraft` defaults from `env.defaultNotificationHour`. If `EXPO_PUBLIC_DEFAULT_NOTIFICATION_HOUR` is set to anything other than 19, the draft silently disagrees with the seeded row until the user saves. Fix: read the seeded value back from `notification_preferences` on bootstrap and feed `notificationDraft` from it. (`supabase/migrations/0002_replay95_backend_services.sql:13`, `src/features/profile/profile-personalization.ts:14`)
- **Active-prompt effect can clobber unsaved drafts on tab-switch** — `setDraft(activePrompt?.textResponse?.textBody ?? "")` runs whenever `activePrompt?.promptId` or `activePrompt?.textResponse?.id` changes, so if the user types into prompt 1, switches to prompt 2, then back to prompt 1, the in-flight unsaved draft is replaced by the saved value (or empty). Fix: persist per-prompt drafts in a `Record<string, string>`, keyed by promptId. (`app/(tabs)/today.tsx:133`)
- **`recorderState.url` may be stale immediately after stop** — On `handleStopRecording`, `recorder.getStatus().url ?? recorderState.url` is used; on iOS the `useAudioRecorderState` hook polls every 250 ms so `recorderState.url` can lag the `getStatus()` value. The fallback is fine, but the save button enable-check on line 604 (`!previewVoiceUri && !recorderState.url`) can briefly flicker. Fix: drive enablement off `previewVoiceUri` only after stop completes. (`app/(tabs)/today.tsx:232`, `app/(tabs)/today.tsx:601`)
- **`today_open` event name is unscoped and conflates fallback opens** — The naming convention used elsewhere (camera flow) is descriptive (`memory_booth_capture`); `today_open` lacks a `memory_channel_*` namespace and only distinguishes fallback opens via the `themeSlug` metadata. Fix: rename to `memory_channel_open` and add a top-level `isFallback` boolean in metadata. (`app/(tabs)/today.tsx:157`)
- **`Notifications.cancelAllScheduledNotificationsAsync` is too broad** — `syncNightlyMemoryNotifications` cancels *all* scheduled notifications before scheduling the nightly drop, which will erase any future per-feature notifications (notes delivery, weekend quests) once they're added. Fix: track and cancel by stored identifier with `cancelScheduledNotificationAsync`, or filter cancellations by the `nightly-memory` channel/data tag. (`src/features/memory/memory-notification-service.ts:151`)

**Open questions for product**

- Is short-video reply a beta scope item or descoped? The brief says yes; the locked "MVP Scope Decision" in `steps.md` says text + voice only — they disagree.
- Are period-accurate filters part of the reply capture flow, the camera/booth flow, or both? The brief implies replies; the build only has them in the booth.
- For the nightly notification, who owns the "TV Guide listing" copy authoring — editorial seeds the title and the client formats it, or the client composes copy from `daily_episodes.title` directly?
- What's the canonical "today's episode" key — calendar date in user's timezone, `unlock_at` of the most recent published row, or a `published_for` field we haven't added yet?
- Should the streak/history surface count fallback days, and should saves on a fallback episode be allowed at all?
- For prompt personalization, do we want runtime substitution of `{birth_year}` / `{mall_store}` tokens stored in `episode_prompts.prompt_text`, or pre-rendered per-user prompts written by an Edge Function at episode publish time?
- Does the brief's "60–90s montage" survive the licensed-media-only constraint? What owned/cleared media library are we drawing from for beta launch?

<!-- END Review: memory-channel -->

### Review — classroom-notes
<!-- BEGIN Review: classroom-notes -->

_Last reviewed: 2026-04-25 by replay-review-classroom-notes._

**Brief mismatches**

- **Delivery window doesn't match the 30 min – 6 hours band** — Brief §2.D names a 30-minute floor and a 6-hour ceiling. The presets are `15 min`, `2 hours`, and `Next morning` (720 min / 12 h). The first slips under the floor, the third blows past the ceiling, and 6 hours is missing entirely. Also `queue_note` only enforces `greatest(delay, 5)` (0006) / `greatest(delay, 15)` (0004) as the minimum, so any client could queue a 5-minute delivery without backend pushback. Fix: replace the preset list with brief-aligned options (e.g. `30 min` / `2 h` / `6 h`) and clamp `p_delay_minutes` to `[30, 360]` server-side. (`src/features/notes/note-constants.ts:11`, `supabase/migrations/0006_replay95_entitlements_settings.sql:348`)
- **Replay+ is capped at 12 notes/week, not unlimited** — Brief §3 promises "Unlimited notes" on Replay+, but both `queue_note` and `get_note_compose_state` set `v_weekly_limit := 12` for `active`/`trialing` and the composer copy reinforces it ("Replay+ widens this lane to 12 notes per week"). Fix: drop the cap for paid tiers (e.g. set `v_weekly_limit` to a sentinel and skip the `>=` guard) and update the composer/paywall copy to "unlimited". (`supabase/migrations/0006_replay95_entitlements_settings.sql:233`, `supabase/migrations/0006_replay95_entitlements_settings.sql:323`, `app/(tabs)/notes.tsx:166`, `app/(tabs)/notes.tsx:253`)
- **Paper-style entitlements ignored at the composer** — The unlockables seed treats `lisa-frank-paper` (35 pogs) and `pogs-backing-paper` (40 pogs) as paid `note_paper` items, but `notePaperThemes` exposes all five themes unconditionally and the composer/reply chips render them with no inventory check. So users can pick "Lisa Frank" / "Pogs backing" without ever buying or earning them. Fix: drive the chip list from a base list intersected with the user's `inventory_items` for `category = 'note_paper'`, while keeping "Ripped notebook" available as the default. (`src/features/notes/note-constants.ts:1`, `app/(tabs)/notes.tsx:186`, `app/notes/[id].tsx:151`, `supabase/migrations/0003_replay95_seed_beta_content.sql:40`)
- **Invite acceptance is unilateral, breaking the "high trust" framing** — Brief §2.D calls this "high trust, low pressure". `accept_friend_invite` inserts `friendships(status = 'accepted')` the instant the inviter types a code (one-sided), and the recipient never sees a request — they discover a new friend after the fact. Fix: insert `pending` first and require the code-owner to confirm via a request inbox (or at minimum surface a "<name> added you via your code" notification), so consent is two-sided. (`supabase/migrations/0004_replay95_notes_social.sql:177`)
- **Inbox doesn't dramatize the in-transit moment** — Brief frames delayed delivery as "mimicking passing notes between classes". The "In transit" surface in `notes.tsx` lists queued notes with a flat `Scheduled for <date>` line — no countdown, no period-bell metaphor, no anticipation cue. Fix: render a relative timer ("arrives in ~38 min · second period") and a folded-paper visual on queued cards, since this delay is the ritual the brief is selling. (`app/(tabs)/notes.tsx:306`, `src/features/notes/note-service.ts:80`)

**Code-quality findings**

- **`mark_note_read` effect can re-fire** — The effect at `app/notes/[id].tsx:45` lists the entire `markNoteReadMutation` object as a dependency. Until the invalidated `useInboxNotes` query repopulates with `read_at`, `note.isRead` is still `false` and any incidental re-render that produces a fresh mutation reference re-invokes `mark_note_read`. Fix: depend on `[note?.id, note?.isRead, note?.status]` only, or use a `useRef` to record the last marked id. (`app/notes/[id].tsx:45`)
- **`useReportNote` skips inbox/social-state invalidation** — Successful reports don't invalidate any queries, so the user sees no inbox change after submitting and a re-open of the same note still shows nothing about a prior report. Fix: add `onSuccess` to invalidate `notesKey(userId)` (and any future "my reports" key) in parity with `useBlockFriend`/`useMuteFriend`. (`src/features/notes/note-service.ts:450`)
- **Invite code shown but not shareable** — The user's own invite code is rendered as a static line of text with no copy-to-clipboard, no native share sheet, and no QR. For an invite-only social product, this is the primary handoff and adds friction. Fix: wrap the code in a `Pressable` that copies via `Clipboard.setStringAsync`, plus a "Share code" button that opens `Share.share`. (`app/(tabs)/notes.tsx:107`)
- **"Send to" friend list rendered twice on the screen** — The composer renders `acceptedFriends` as `OptionChip` rows once under "Approved friends" (with mute decoration) and again under "Send to". They're driven by the same source and both call `setSelectedFriendId`. Fix: collapse into a single picker, or make the upper list a passive "Approved friends" summary and keep "Send to" as the only interactive selector. (`app/(tabs)/notes.tsx:127`, `app/(tabs)/notes.tsx:172`)
- **`useInboxNotes` re-fetches social state inline on every load** — The `queryFn` calls `fetchNotesSocialState` directly (to compute `partnerMuted`) instead of reading from the already-cached `socialStateKey` query. That doubles round-trips on every inbox mount. Fix: read `queryClient.getQueryData(socialStateKey(userId))` (or take `mutedFriendIds` as a hook arg) and only fall through to the network when missing. (`src/features/notes/note-service.ts:240`)
- **No scheduler wired for `deliver_due_notes`** — The RPC exists and is `security definer` granted to `service_role`, but nothing in the repo (`supabase/`, `app.json`, Edge Functions) actually calls it on a cadence. Without that, queued notes never flip to `delivered` and the entire delayed-delivery experience is non-functional in practice. Fix: add a `pg_cron` job (or Supabase Scheduled Edge Function) that runs `select public.deliver_due_notes(500);` every minute, and document it in `steps.md`. (`supabase/migrations/0002_replay95_backend_services.sql:350`)
- **Blocked-by-safety section leaks the blocked partner's words** — Notes flipped to `status = 'blocked'` by `block_friend` stay visible in the recipient's "Blocked by safety" list with the blocker's display name and a partial body preview. That re-surfaces content from a user the recipient just chose to silence. Fix: filter `inboxSections.blocked` to outgoing-only (or hide incoming blocked items entirely), and surface only an aggregate "<n> blocked notes" counter. (`app/(tabs)/notes.tsx:60`, `app/(tabs)/notes.tsx:341`)
- **Report screen silently no-ops if `noteId` is missing** — `handleSubmit` early-returns when `params.noteId` is falsy with no UI feedback, leaving the user staring at an unresponsive button. Fix: render an explanatory empty state when `params.noteId` is missing and disable the form, instead of bouncing through a no-op submit. (`app/safety/report.tsx:36`)
- **RPC payload shape isn't validated on the client** — `useNoteComposeState` reads `data?.remainingNotes`, `data?.subscriptionStatus`, etc. directly from the RPC return, so a renamed key would silently fall back to `initialData` defaults (3 free notes, free tier) — exactly the path that lets users sneak past a paywall fix. Fix: add a Zod parser at the RPC boundary so a key rename fails loudly. (`src/features/notes/note-service.ts:217`)
- **Compose-state count uses RLS-coupled select** — `get_note_compose_state` and `queue_note` both run `select count(*) from public.notes where sender_id = v_user_id` under `security invoker`, so any future RLS tweak that hides the user's own sent notes (e.g. for blocked threads) would silently let users send extra. Fix: switch these to `security definer` so the limit isn't RLS-coupled. (`supabase/migrations/0006_replay95_entitlements_settings.sql:212`, `supabase/migrations/0006_replay95_entitlements_settings.sql:260`)

**Open questions for product**

- Pen-pal matching is excluded from the beta IA (`docs/phase-1/information-architecture.md:119`) but called out as a core social path in the brief (§2.D). Trade-off: shipping beta without pen pals preserves the "high trust" framing at the cost of an empty social layer for users with zero IRL friends in the cohort. Should beta seed an opt-in waitlist for pen-pal matching, or stay silent until post-beta?
- Should "Lisa Frank" and "Pogs backing" paper styles be earnable via quests in addition to the pog shop? They're flagship paper styles in the brief, and gating them entirely behind currency may make the composer feel locked for a free-tier user with one friend.
- Where should the line sit on Replay+ note volume — truly unlimited (per brief §3) or a high soft-cap (e.g. 50/week) to keep the "quiet exchange" tone? The current 12/week ceiling is below the brief but above what feels like "passing notes between classes".
- Do reports need to notify the reported user, the reporter, or both? Today the report is silent on both sides — fine for a backend moderation pipeline, but a "we received your report" surface may be required by the launch privacy posture (`docs/phase-1/launch-market-and-privacy.md:64`).
- When a friendship moves to `blocked`, should historical delivered notes be hidden from the recipient's inbox, kept (current behavior), or scrubbed to a tombstone? The brief and the privacy doc are silent on post-block visibility.

<!-- END Review: classroom-notes -->

### Review — quests
<!-- BEGIN Review: quests -->

_Last reviewed: 2026-04-25 by replay-review-quests._

**Brief mismatches**

- **Steps are text-only, no scan/media capture** — Brief §2.E names "scan a friendship bracelet" and "find a cereal box" as steps, implying camera/media-aware actions. The schema only stores `prompt_text` and the save RPC rejects empty-string responses, with the client offering a single `TextInput` per step. Even though `app/camera.tsx` exists, no quest step type can request a photo, scan, or audio capture. Fix: add a `response_type` column to `quest_steps` (text/photo/scan/audio), thread it through `useActiveQuests` mapping, branch the detail UI on it, and extend `save_quest_step_response` to accept media references. (`supabase/migrations/0001_replay95_beta.sql:125`, `supabase/migrations/0005_replay95_progression_shop.sql:75`, `app/quests/[id].tsx:144`)
- **No Saturday-morning cadence — quests are live Apr 1 -> Dec 31** — Brief §2.E says quests "unlock each weekend." All three seeded quests share `active_from = 2026-04-01` and `active_to = 2026-12-31`, so every account sees three "live" quests every day for nine months instead of one weekend window per slug. `useActiveQuests` only filters `active_from <= now <= active_to`, with no `weekend_label`-to-date binding and no day-of-week gating. Fix: tighten each seed window to a single Sat-Sun (and roll quests forward from a content cron / scheduled migration), or add a weekend predicate (`extract(dow from now) in (0, 6)`) plus a per-weekend index column. (`supabase/migrations/0003_replay95_seed_beta_content.sql:154`, `src/features/quests/quest-service.ts:208`)
- **Reward catalog is missing 90s fonts and AR decorations; mini-games absent** — Brief §2.E lists three reward families: 90s fonts, AR bedroom decorations, and retro mini-games (Sock 'em on SNICK, Mall Madness Dash, Trapper Keeper Tycoon). The seeded `unlockables` table has zero `font` or `ar_decor` categories — only `scene`, `room_decor`, `profile_flair`, and `note_paper`. There are no mini-game routes, components, or unlockables anywhere in the repo. Mini-games are post-beta per `steps.md`, but the brief lists them as core quest redemption options, so the gap should be tracked. Fix: add `font` and `ar_decor` categories to the unlockables seed, ship at least one of each as a quest reward, and stub a Mini-Games row in the redemption catalog with a "Coming after beta" state. (`docs/phase-1/content-system.md:177`, `supabase/migrations/0003_replay95_seed_beta_content.sql:1`)
- **Only 3 quests seeded; brief and content-system both expect 12** — `docs/phase-1/content-system.md` §4 enumerates 12 weekend quests for beta; `0003_replay95_seed_beta_content.sql` only inserts three (`saturday-morning-cereal-run`, `mall-bracelet-exchange`, `radio-dub-challenge`). Fix: seed the remaining nine quests + their steps from the §4 table before public beta. (`supabase/migrations/0003_replay95_seed_beta_content.sql:147`, `docs/phase-1/content-system.md:136`)
- **Weekend 02 unlockable mismatch with content plan** — `content-system.md` §4 row 02 lists `Bean bag + pager dock` as the Mall Bracelet Exchange unlockable; the seed grants `Mall Glow` (a `scene`) instead. Either the brief row or the seed is stale. Fix: pick one and reconcile, then update the other. (`supabase/migrations/0003_replay95_seed_beta_content.sql:163`, `docs/phase-1/content-system.md:139`)
- **Per-quest claim doesn't surface the unlockable as a font/AR option** — Brief implies users redeem pogs for choices (font, AR sticker pack, mini-game). Current flow auto-grants the single `unlockable_name` tied to the quest with no choice surface, and there is no separate "redeem pogs for X" path on the quest screen. Fix: split quest reward (auto-grant pogs only) from a redemption picker that lets the user spend pogs on font / AR / mini-game options, or expand `quest_completions` to record a chosen reward variant. (`supabase/migrations/0005_replay95_progression_shop.sql:408`, `app/quests/[id].tsx:177`)
- **Mini-games (Sock 'em on SNICK, Mall Madness Dash, Trapper Keeper Tycoon) not represented anywhere** — Named explicitly in brief §2.E as redemption options. No code, no unlockables row, no route. Post-beta scope per `steps.md`, but should still appear as locked teasers so the reward economy reads complete. Fix: add three `mini_game` unlockables in the seed with `pog_cost` set and metadata `{ "available": false, "release": "post-beta" }`, then render them as locked tiles in the quest reward / bedroom view. (`docs/product-brief.md:88`)

**Code-quality findings**

- **`fallbackQuests` uses non-UUID IDs that crash the save/claim RPCs** — `initialData` ships strings like `"quest-1"` / `"quest-1-step-1"` (`src/features/quests/quest-service.ts:70`). If a user lands on `/quests/quest-1` before the network query resolves and taps Save Step, `save_quest_step_response` rejects the args because `p_quest_id`/`p_quest_step_id` are typed `uuid`. Fix: either drop the `initialData` (let the screen show a skeleton until the live query resolves), or make the fallback IDs explicit `null`/disabled in the UI so save/claim are never called against placeholders. (`src/features/quests/quest-service.ts:66`, `src/features/quests/quest-service.ts:275`, `app/quests/[id].tsx:25`)
- **Local step drafts are wiped on every refetch** — `useEffect` at `app/quests/[id].tsx:30` resets `drafts` whenever the `quest` reference changes. TanStack Query's default `refetchOnWindowFocus`/invalidation will rebuild that reference and clobber whatever the user is currently typing. Fix: only seed `drafts` for steps that don't yet have a local entry (merge by ID without overwriting existing keys), or hold the merged draft in a ref that survives refetches. (`app/quests/[id].tsx:30`)
- **Unlockable lookup keyed by `name` string is fragile** — `useActiveQuests` and `claim_quest_reward` both join `quests.unlockable_name` to `unlockables.name`. Two unlockables sharing the same display string would collapse the slug map and silently grant the wrong inventory item. Fix: replace `quests.unlockable_name` with `quests.unlockable_id uuid references public.unlockables (id)` (or a `unlockable_slug` column with a unique index), and update both the RPC and the service layer to use it. (`src/features/quests/quest-service.ts:241`, `supabase/migrations/0001_replay95_beta.sql:117`, `supabase/migrations/0005_replay95_progression_shop.sql:411`)
- **Hand-rolled slug fallback in `unlockable_name` -> `unlockableSlug` mapping** — When a matching unlockable row isn't found, `quest-service.ts:271` does `quest.unlockable_name.toLowerCase().replace(/\s+/g, "-")`. That can disagree with the canonical slug (punctuation, accents) and silently route users to a non-existent bedroom item. Fix: make `unlockables` lookup the source of truth (covered by the schema fix above) and surface a hard error if a quest references an unknown unlockable. (`src/features/quests/quest-service.ts:270`)
- **Unused `errorText` state on the index screen** — `app/(tabs)/quests.tsx:24` declares `const [errorText] = useState("")` and never updates it. The error UI at line 48 is therefore dead code; quest-load failures from `useActiveQuests` are not surfaced anywhere. Fix: either render `questsQuery.error?.message` directly or wire the setter to a real error path. (`app/(tabs)/quests.tsx:24`, `app/(tabs)/quests.tsx:48`)
- **Step preview uses `"x"` / `"o"` text glyphs for completion status** — `app/(tabs)/quests.tsx:115` reads `{step.completed ? "x" : "o"}` which is hard to parse and unstyled. Fix: replace with proper checkbox iconography (tokenized check / circle from the design system) and add an a11y label. (`app/(tabs)/quests.tsx:115`)
- **`weekend_label` is a freeform string, not a calendar weekend** — `weekend_label text not null` is purely cosmetic ("Weekend 01"), with no relationship to the `active_from`/`active_to` window. Tooling can't validate that a quest tagged "Weekend 03" actually opens on the third weekend. Fix: replace with `weekend_index integer` (or `weekend_starts_on date`) and derive the human label client-side. (`supabase/migrations/0001_replay95_beta.sql:115`, `supabase/migrations/0003_replay95_seed_beta_content.sql:151`)
- **`claim_quest_reward` requires the quest to still be in its active window** — `0005_replay95_progression_shop.sql:339-341` rejects claim if `now() > active_to`. Once weekend windows tighten (per the cadence fix above), users who finish all three steps Sunday night and try to claim Monday will hit "Quest is not currently available." Fix: separate the "save progress" gate from the "claim reward" gate — once the steps are saved during the active window, claim should be allowed afterward (perhaps with a 7-day grace). (`supabase/migrations/0005_replay95_progression_shop.sql:339`)
- **Save-step rejects empty trimmed responses, which forecloses non-text step types** — `save_quest_step_response` raises if the response is empty (`0005:75-77`). Today both client and server agree, but as soon as the brief mismatch ("scan a bracelet") is fixed, photo/scan steps will need to skip the text guard. Track this as a follow-up when `response_type` lands. (`supabase/migrations/0005_replay95_progression_shop.sql:75`)
- **`onSuccess` analytics call uses `void promise.catch(...)` on a non-awaited path** — `quest-service.ts:333` reads `void trackBetaEvent(...).catch(noop)` then awaits the cache invalidations. The `void` + `.catch` is harmless but awkward — the comment "Dashboard tracking should not block reward claim UX." is misleading since `onSuccess` already runs after the mutation resolved. Minor: collapse to a single `await trackBetaEvent(...).catch(noop)` for readability. (`src/features/quests/quest-service.ts:333`)

**Open questions for product**

- Should weekend quests truly only be redeemable Sat-Sun, or should the window stay open through the following week so weekday-only users can still complete? Affects the active-window claim gate.
- When the brief says "90s fonts" as a redemption option, is that a per-user app-wide font selection (touching theme tokens) or only a font swap on the avatar nameplate / profile flair?
- What does "AR decorations" mean concretely for redeemable rewards — a sticker pack used inside `app/camera.tsx`, or 3D objects placed in the bedroom diorama? The current `unlockables.category` taxonomy doesn't have an AR slot.
- Mini-games are listed as flagship redemption options. Are Sock 'em on SNICK, Mall Madness Dash, and Trapper Keeper Tycoon in scope at all for the 5,000-user soft launch, or should they be removed from the brief until post-beta to avoid setting expectations?
- Should claiming a quest reward grant a single fixed unlockable (current behavior), or let the user pick from a small bouquet (font OR AR sticker OR mini-game token)? Today the design has zero choice at claim time.
- What is the expected cadence of new quests — exactly one per weekend (so 12 cover three months), or multiple weekend tracks running in parallel? `useActiveQuests` returning a list implies parallel; the brief copy implies one.
- Should the pog-balance non-negative check be soft (block spending) or hard (RPC throws)? Today both `purchase_unlockable` and the `pog_wallets.balance >= 0` constraint enforce hard, which is probably correct but worth confirming before promotional debits land.

<!-- END Review: quests -->

### Review — bedroom-ar
<!-- BEGIN Review: bedroom-ar -->

_Last reviewed: 2026-04-25 by replay-review-bedroom-ar._

**Brief mismatches**

- **Loop length capped at 3s, brief says 15s** — `recordAsync({ maxDuration: 3 })` in the loop handler, button label "Record 3-second loop", subtitle "share a still or a 3-second loop", and helper status "Recording a 3-second loop..." all hard-code the deferred 3-second figure. Brief §2.C explicitly calls out "shareable as still images or 15-second loops." Fix: bump the cap to 15, update the button label, status string, and `RetroScreen` subtitle in the same pass. (`app/camera.tsx:89`, `app/camera.tsx:95`, `app/camera.tsx:143`, `app/camera.tsx:249`)
- **No scene-aware AR overlays** — Memory Booth is a 2D color-wash + scanline + headline card pinned to the capture surface. Brief §2.C names three concrete scene anchors (couch → 90s kid watching TV; landline → "Mom calling…"; car seat → cassette adapter). There is no object detection, no per-target overlay pool, and the overlay headline/subline come from the Tonight episode + profile, not from what the camera sees. Fix: keep the current build as the deferred-AR placeholder (steps.md already moves full AR to post-beta) but rewrite the screen copy/eyebrow to advertise "filter booth," not AR — "Memory Booth" + the title "Camera filters, overlays, and exports" reads honestly today, but should explicitly note "scene-aware AR coming after beta" so reviewers don't expect §2.C behavior. (`app/camera.tsx:141`-`app/camera.tsx:144`, `app/camera.tsx:202`-`app/camera.tsx:206`)
- **Filter library doesn't match brief vocabulary** — Brief §2.B names "pan-and-scan, VHS tracking lines, tube-TV glare" as the period filter set; current `replayCameraFilters` ships Camcorder Dusk, Drugstore Flash, Mall Glow, Parking Lot Sodium. Scanlines exist universally as a wash but no individual filter labels itself "VHS Tracking Lines" or "Tube TV Glare," and there is no "Pan & Scan" letterbox treatment at all. Fix: rename or add filters that map 1:1 to the brief's vocabulary, and add a real letterboxed pan-and-scan layout option. (`src/features/camera/camera-filters.ts:15`-`src/features/camera/camera-filters.ts:56`)
- **No free vs. Replay+ gating on filters or AR** — Brief §3 says free is "limited AR" and Replay+ unlocks "full AR lens library." `app/camera.tsx` renders all four filters with no `useReplayApp().subscription`/RevenueCat check, and `camera-export-service.ts` has no tier guard on still or loop exports. Fix: thread the subscription state into camera and gate at least two of the four filters (or future AR overlay packs) behind Replay+, with a paywall handoff. (`app/camera.tsx:215`-`app/camera.tsx:222`, `src/features/camera/camera-export-service.ts:6`-`src/features/camera/camera-export-service.ts:45`)
- **No `ar_sticker` / `ar_overlay` unlockable category** — Brief §3 promises "Officially licensed 90s brand AR stickers (e.g., a working virtual Tamagotchi you keep in your 'backpack' in the app)" and §2.E names "Unlockable AR decorations for your 'bedroom'." The current `ReplayUnlockableCategory` enum is `note_paper | profile_flair | room_decor | scene` and `docs/phase-1/content-system.md` §6 locks the catalog to those four. There is no category to hold AR-only items — when AR ships, every license drop will need a schema migration. Fix: decide whether AR stickers ride on top of `room_decor` (and label them at metadata level) or get a fifth `ar_sticker` enum; document the choice in `docs/phase-1/content-system.md` §6. (`src/features/bedroom/bedroom-service.ts:5`-`src/features/bedroom/bedroom-service.ts:9`, `docs/phase-1/content-system.md:177`-`docs/phase-1/content-system.md:184`)
- **Equipped `profile_flair` only restyles the room-card border, never surrounds the avatar** — Brief framing is that flair "frames" identity expression. Today flair only flips two style branches on the bedroom Owner Card (`ownerCardGlitter`, `ownerCardSmiley`). The school-photo avatar drawn in onboarding/profile, the Tonight tab card, the Notes inbox sender chip, and the Bedroom diorama itself never read `equipped.profile_flair`. Fix: thread the equipped flair slug into at least the school-photo avatar render and the Notes sender chip so users see what they bought show up across the app, not just on one card on the Bedroom tab. (`app/(tabs)/bedroom.tsx:217`-`app/(tabs)/bedroom.tsx:222`, `app/(tabs)/bedroom.tsx:441`-`app/(tabs)/bedroom.tsx:450`)
- **Equipped `note_paper` is text-only on the Bedroom card and the Notes composer ignores it** — On the Bedroom screen, equipped note paper renders only as a `Text` line ("Note paper: …"), not a thumbnail or paper preview (`bedroom.tsx:228`). Cross-segment: the Notes composer at `app/(tabs)/notes.tsx:43` and the thread at `app/notes/[id].tsx:33` use a hard-coded `notePaperThemes` from `note-constants.ts` and never read `bedroomState.equipped.note_paper`. Defer the Notes composer wiring to **classroom-notes**, but flag here that the brief promises bought paper actually styles the note. (`app/(tabs)/bedroom.tsx:228`)
- **Bedroom diorama is largely static; only one of four equipped categories visibly redraws** — Brief §2.E calls for a "static but customizable" diorama. Today only `equipped.scene` (wall + poster accent color) and `equipped.room_decor` (one of five hand-drawn `View` shapes via `renderDecorShape`) actually change the diorama; flair only changes the Owner Card border, note paper changes nothing. The bean bag, TV, floor, and poster shape are hard-coded regardless of scene. Fix: at minimum, swap the bean bag silhouette and TV trim per scene, and render an inline note-paper swatch on the Owner Card so all four equipped categories produce a visible diorama change. (`app/(tabs)/bedroom.tsx:191`-`app/(tabs)/bedroom.tsx:207`, `app/(tabs)/bedroom.tsx:16`-`app/(tabs)/bedroom.tsx:46`)

**Code-quality findings**

- **`bedroomStateQuery.data` is dereferenced unconditionally** — `useBedroomState` provides `initialData`, so `data` is always defined in practice, but TypeScript has the result as `ReplayBedroomState | undefined` for `useQuery` consumers; the screen reads `bedroomState.scenes` etc. without a guard, which papers over the loading/error path. Fix: either destructure with a default (`const bedroomState = bedroomStateQuery.data ?? emptyState`) or render a skeleton when `bedroomStateQuery.isError`. (`app/(tabs)/bedroom.tsx:71`-`app/(tabs)/bedroom.tsx:77`)
- **Equip/purchase mutations swallow the wallet response** — `purchase_unlockable` returns `{ unlockableId, alreadyOwned, walletBalance }` and `equip_unlockable` returns `{ category, unlockableId, equipped }`, but `usePurchaseUnlockable`/`useEquipUnlockable` only `invalidateQueries` and discard the payload. The wallet refreshes via the viewer query invalidation, but the optimistic UI never gets to use `walletBalance` for an instant-update. Fix: write the returned wallet balance into the cache via `setQueryData` for `["viewer"]` so the pog count updates without a network round-trip. (`src/features/bedroom/bedroom-service.ts:244`-`src/features/bedroom/bedroom-service.ts:295`)
- **No camera-permission `denied` (vs. `undetermined`) handling** — `cameraPermission?.granted` is treated as the only meaningful state. When the user denies permission, `requestCameraPermission()` won't resurface the OS prompt — the screen just silently keeps the fallback layout. Fix: when `cameraPermission?.canAskAgain === false`, swap the "Enable camera access" button for an explicit "Open Settings" handoff via `Linking.openSettings()`. (`app/camera.tsx:121`-`app/camera.tsx:137`, `app/camera.tsx:228`-`app/camera.tsx:236`)
- **Loop record waits a magic 180ms before `recordAsync`** — `await new Promise((resolve) => setTimeout(resolve, 180))` is left as an undocumented warm-up to let `mode` switch from `picture` to `video`. This is fragile (an Android cold-start can take longer) and untestable. Fix: drive the wait off `CameraView`'s `onCameraReady` callback or initialize the camera in `mode="video"` when the screen mounts. (`app/camera.tsx:94`)
- **`captureReplayStill` types its `viewRef` as `RefObject<unknown>` but `react-native-view-shot` wants `View`** — works at runtime because RN refs are duck-typed, but the cast hides the contract. Fix: type the parameter as `RefObject<View>` and import the type from `react-native`. (`src/features/camera/camera-export-service.ts:17`-`src/features/camera/camera-export-service.ts:32`)
- **`Sharing.shareAsync` is the only export path; web is rejected at runtime, not at build** — `ensureReplaySharingAvailable()` throws on web, but the camera screen still mounts on web (the route isn't gated). Fix: add a `Platform.OS === "web"` guard at the screen level so users see a "Memory Booth runs in the iOS/Android build" surface instead of the native-only export error after they tap. (`app/camera.tsx:30`-`app/camera.tsx:54`, `src/features/camera/camera-export-service.ts:6`-`src/features/camera/camera-export-service.ts:15`)
- **Bedroom diorama uses raw hex literals instead of theme tokens** — `#3B2A5A`, `#A8774C`, `#2A2136`, `#8AE4FF`, `#FF7D7D`, `#FFD36B`, `#1B1525`, `#5D4A7A`, `#7AC7FF`, etc. are hard-coded in StyleSheet, contradicting the CLAUDE.md convention that `tokens` is the source of truth for color. Fix: extend `tokens.colors` (or a new `tokens.diorama` namespace) and reference it here. (`app/(tabs)/bedroom.tsx:289`-`app/(tabs)/bedroom.tsx:415`)
- **`renderDecorShape` only knows five slugs, silently no-ops for the rest** — Future room-decor unlockables seeded into the catalog will appear in the inventory list but produce no visual when equipped. Fix: either drive the decor render off `metadata` (icon position + colors) so new SQL rows ship without code changes, or fall back to a generic "small artifact" silhouette. (`app/(tabs)/bedroom.tsx:16`-`app/(tabs)/bedroom.tsx:46`)
- **Equip-mutex relies on PK alone; no client-side optimistic toggle** — `equipped_unlockables` has `primary key (user_id, category)`, so swapping decor is a clean upsert at the DB level. But the UI keeps the old equipped item highlighted until the query invalidation round-trips. Fix: add `onMutate` optimistic update to `useEquipUnlockable` that flips `equipped.<category>` locally. (`src/features/bedroom/bedroom-service.ts:272`-`src/features/bedroom/bedroom-service.ts:295`)
- **Beta `equipped_unlockables` backfill only seeds the `basement-sleepover` scene** — Migration 0005 backfills equipped scene only; it does not pre-equip any starter `room_decor`, `profile_flair`, or `note_paper`, so brand-new users see "None equipped" / "Default paper" until they buy something. Fix: either ship a free-tier starter for each of the four categories or stop showing "None equipped" copy as if it were an error. (`supabase/migrations/0005_replay95_progression_shop.sql:41`-`supabase/migrations/0005_replay95_progression_shop.sql:49`)
- **`isQuestReward` is computed by name match against `quests.unlockable_name`** — Both the client (`mapUnlockable` via `questRewardNames`) and the `purchase_unlockable` RPC (line 209-214) gate on `quests.unlockable_name = unlockables.name`. A typo on either side silently breaks the gating. Fix: replace the string match with a proper `quests.unlockable_id` foreign key in a future migration. (`src/features/bedroom/bedroom-service.ts:200`, `supabase/migrations/0005_replay95_progression_shop.sql:209`-`supabase/migrations/0005_replay95_progression_shop.sql:214`)
- **`captureReplayStill` shares before logging analytics; loop does the same** — If `Sharing.shareAsync` throws or the user cancels, no analytics event fires, but the still has already been written. Conversely, on success the `camera_still_exported` event records "exported" even if the user dismissed the share sheet. Fix: distinguish `attempted` vs `completed` events, or thread the share-result callback through. (`app/camera.tsx:64`-`app/camera.tsx:74`, `app/camera.tsx:103`-`app/camera.tsx:110`)
- **Catalog seed uses empty `metadata = '{}'` for nine of twelve unlockables, forcing client-side fallbacks** — `bedroom-service.ts` ships a 12-entry `unlockableFallbacks` map keyed by slug to fill in `accent` and `description` because the seed migration only stuffed metadata for the three scene rows. The seed is the canonical source per the file's name; fix: backfill `metadata` with `accent` + `description` for every unlockable in `0003_replay95_seed_beta_content.sql` and delete the duplicate fallback table from the client. (`supabase/migrations/0003_replay95_seed_beta_content.sql:33`-`supabase/migrations/0003_replay95_seed_beta_content.sql:41`, `src/features/bedroom/bedroom-service.ts:63`-`src/features/bedroom/bedroom-service.ts:118`)

**Open questions for product**

- Beta scope locks the booth to filters + 2D overlays. Is "Memory Booth" the final user-facing name, or is it placeholder copy until real AR ships? If final, the brief §2.C "AR VHS Viewer" language should be softened in the next product-brief revision so reviewers don't expect scene-aware overlays at GA.
- Does §3's "limited AR" on free actually mean "two of four filters, exports gated" or "all filters, no AR sticker packs, but the Tamagotchi-style drops require Replay+"? The implementation needs a concrete ruleset before paywall wiring.
- Should licensed AR sticker drops get their own `unlockables.category` (`ar_sticker`), or piggyback on `room_decor` with a `metadata.kind = 'ar'` flag? Implementation timing depends on this.
- The brief implies profile flair is identity-wide (avatar, notes, profile cards). Should equipped flair render on the school-photo avatar in onboarding output, on the Notes sender chip, and on the Tonight greeting card — or is "Bedroom Owner Card border treatment" the intended scope for beta?
- Equipped note paper today only displays as text on the Bedroom screen. Should the Notes composer's hard-coded `notePaperThemes` be replaced by the user's owned `note_paper` unlockables, or is the catalog of styles deliberately separate from inventory? (Defer the actual change to **classroom-notes**, but the policy decision blocks them.)
- Quest rewards include "VHS Tower Lamp," "Arcade Token Jar," "Mirror-Ball Lights" — content-system.md §6 lists those as quest-reward sources, but the seed migration only ships three quests (`saturday-morning-cereal-run`, `mall-bracelet-exchange`, `radio-dub-challenge`) whose rewards are `Sticker Blast`, `Mall Glow`, `Boombox Cassette Stack`. Is the discrepancy deliberate (the rest are Replay+ Vault content) or a missing seed pass?
- Brief §2.E lists "retro mini-games: Sock 'em on SNICK, Mall Madness Dash, Trapper Keeper Tycoon" as a pog redemption target. There is no entry for these in the unlockables catalog or the bedroom screen. Are mini-games out of beta scope entirely, or do they need a placeholder unlockable category now?

<!-- END Review: bedroom-ar -->

### Review — monetization
<!-- BEGIN Review: monetization -->

_Last reviewed: 2026-04-25 by replay-review-monetization._

**Brief mismatches**

- **No real billing integration** — Brief §3 expects paid Replay+ at $3.99/mo and $29.99/yr; `react-native-purchases` is absent from `package.json` (no entry between lines 16-35) and `app.json` plugins (lines 9-29) don't include it, even though `EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY` / `EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY` slots exist. The trial CTA calls `begin_beta_replay_plus_trial` which just inserts a 7-day `trialing` row server-side with `provider = 'beta_preview'`. Fix: install `react-native-purchases`, add the plugin to `app.json`, wire `Purchases.configure()` at boot, replace `useStartReplayPlusTrial` with a real purchase flow, and have the server verify receipts before flipping `subscription_status`. (`package.json:15`, `app.json:9`, `src/features/account/account-service.ts:72`, `supabase/migrations/0006_replay95_entitlements_settings.sql:66`)
- **Pricing copy missing entirely** — Brief specifies $3.99/mo and $29.99/yr as distinct SKUs; the paywall never renders either price or any monthly-vs-yearly choice — the only CTA is `"Start 7-day Replay+ beta preview"` and the value prop bullets are about notes/restore/pogs. Fix: surface both SKUs with prices once RevenueCat offerings are wired, and include the legally-required renewal/cancel disclosures next to each. (`app/paywall.tsx:51-55`, `app/paywall.tsx:101-111`)
- **Restore path doesn't consult a receipt** — `useRestoreReplayPlus` calls `restore_replay_plus_access`, which simply upserts a `subscription_status` row with `provider = 'revenuecat'` and `status = 'free'` and bumps `updated_at` — it never reads a real receipt, so a paid user who reinstalls will *lose* their entitlement on tap. Fix: replace the RPC body with a server-side receipt verification step (or call `Purchases.restorePurchases()` client-side and reconcile) before writing to `subscription_status`. (`src/features/account/account-service.ts:90`, `supabase/migrations/0006_replay95_entitlements_settings.sql:120`)
- **AR-limited claim is unenforced** — Brief §3 says free tier gets "limited AR" while Replay+ unlocks the "full AR lens library." `app/camera.tsx`, `src/features/camera/camera-filters.ts`, and `src/features/camera/camera-export-service.ts` contain no `subscriptionStatus` checks, no locked-filter UI, no Replay+-only export tier — every filter is available to every user. Fix: tag filters/exports with a `requiresReplayPlus` flag and gate them via `useReplayPlusState`, or update the brief if the AR limit is being scoped out. (`src/features/camera/camera-filters.ts`, `app/camera.tsx`)
- **Quest Vault (past quests) missing** — Brief §3 promises Replay+ unlocks "access to 'Saturday Morning Quest' Vault (past quests)." No vault UI exists in `app/(tabs)/quests.tsx`, no archival query lives in `src/features/quests/quest-service.ts`, and no migration exposes a vault RPC. Paywall bullet 3 even contradicts the brief by claiming "Same pogs, same quests, same unlockables — no paywalled content." Fix: either add the vault feature (archival query + Replay+-gated tab) or amend `docs/product-brief.md` to drop the vault from beta scope. (`app/paywall.tsx:54`, `app/(tabs)/quests.tsx`)
- **Classifieds section absent** — Brief §3 calls for a sponsored vintage-classifieds section with a 10% IRL marketplace fee. No table, RPC, screen, or fee policy exists anywhere in `supabase/migrations/000{1..7}_*.sql`, `app/`, or `src/features/`. Likely post-beta; flag as deferred. (no code)
- **Premium licensed drops absent** — Brief §3 calls for licensed brand AR stickers (e.g., a virtual Tamagotchi). No drop scheduling, licensed-asset table, or "backpack" inventory category exists; `inventory_items` (`supabase/migrations/0001_replay95_beta.sql:161`) doesn't distinguish premium drops from quest-earned unlockables. Likely post-beta; flag as deferred. (no code)

**Code-quality findings**

- **`normalize_subscription_status` only downgrades on read** — A row can sit at `status = 'active'` with an expired `expires_at` indefinitely; only a call to `get_replay_plus_state` notices the lapse and writes back. Anything that reads `subscription_status.status` directly (e.g. an admin query) gets stale data. Fix: add a scheduled job (pg_cron or Edge Function) that runs `update ... set status = normalize_subscription_status(...)` periodically, or migrate the writeback into a generated column / trigger. (`supabase/migrations/0006_replay95_entitlements_settings.sql:1-23`)
- **Restore RPC clobbers `provider` and `plan_code`** — `restore_replay_plus_access` upserts with `provider = 'revenuecat'` and no `plan_code` clause, so on conflict it leaves `plan_code` alone but on first insert wipes the columns to defaults. Combined with `status = 'free'` on insert, a brand-new user who taps "Restore" before ever subscribing creates a confusing row. Fix: skip the insert when no row exists; only refresh `updated_at` when there's prior subscription history. (`supabase/migrations/0006_replay95_entitlements_settings.sql:120-151`)
- **Trial reset reachable via canceled state** — `begin_beta_replay_plus_trial` only short-circuits when `status` is `'active'` or `'trialing'` (line 88), so a user whose trial expired (`canceled`) can re-tap "Start 7-day Replay+ beta preview" and get another 7 free days, repeatedly. Fix: also block when `v_existing.user_id is not null and v_status in ('canceled','past_due')`, or track `trial_consumed_at`. (`supabase/migrations/0006_replay95_entitlements_settings.sql:66-118`)
- **Optimistic UI missing on trial / restore** — Both `useStartReplayPlusTrial` and `useRestoreReplayPlus` only invalidate after success; the paywall's status pill (`formatReplayPlusStatus`) doesn't update until the network round-trip finishes, so the button just spins. Fix: add `onMutate` optimistic updates that flip `replayPlusStateKey` to `trialing` immediately, or render a transient "Activating..." state. (`src/features/account/account-service.ts:63-115`, `app/paywall.tsx:101-126`)
- **`initialData` masks loading and error states** — `useReplayPlusState` ships `initialReplayPlusState` (`status: 'free'`) as `initialData`, so the paywall and settings render the free state even while the real query is in flight or has errored. A paid user briefly sees "Free tier" + the trial CTA on cold starts. Fix: use `placeholderData` instead of `initialData`, or surface `replayPlusQuery.isLoading`/`isError` in the UI. (`src/features/account/account-service.ts:23-61`, `app/paywall.tsx:49-92`, `app/settings.tsx:55-148`)
- **`get_replay_plus_state` writeback drops new fields** — Inside the `update ... returning *` block, `provider`, `plan_code`, and `expires_at` are not touched, but the in-memory `v_row` returned to the caller can therefore reflect a row whose `status` was just rewritten while the rest of the columns are stale. Cosmetic today (caller only reads `status`/`isPaid`), but a footgun once subscriptions actually carry plan metadata. Fix: only update `status`/`updated_at`, then re-`select` the row, instead of `returning *`. (`supabase/migrations/0006_replay95_entitlements_settings.sql:46-54`)
- **Status-string formatter duplicated client-side** — `formatReplayPlusStatus` lives verbatim in both `app/paywall.tsx:16-29` and `app/settings.tsx:25-38`, and `account-service.ts:44-50` re-validates the same enum the SQL `check` constraint already enforces (`subscription_status.status in (...)`, `supabase/migrations/0001_replay95_beta.sql:174`). Fix: extract a shared `formatReplayPlusStatus` helper into `src/features/account/` and lean on the typed `ReplaySubscriptionStatus` union. (`app/paywall.tsx:16`, `app/settings.tsx:25`, `src/features/account/account-service.ts:44`)
- **Notes upgrade nudge always shown to Replay+ users too** — `app/(tabs)/notes.tsx:164-166` shows "Replay+ widens this lane to 12 notes per week." even to users who already have Replay+ (and therefore already see the 12-cap). Tone is fine, but the always-on copy reads as a pitch to existing subscribers. Fix: hide the helper text when `composeStateQuery.data.subscriptionStatus` is `'active'` or `'trialing'`. (`app/(tabs)/notes.tsx:164`)

**Open questions for product**

- Real billing in beta or post-beta? The RevenueCat env keys exist but no SDK is installed; clarify whether the soft-launch ships with paid Replay+ or stays on the server-only "beta preview" trial.
- If paid Replay+ ships in beta, is the 7-day trial post-RevenueCat (matching App Store/Play offerings) or does the in-app trial run alongside the platform trial?
- "Limited AR" on free tier — concrete definition? Number of filters? Watermarked exports? No-export? The brief is ambiguous and the code currently treats AR as fully free.
- Is the Quest Vault a beta deliverable or scoped to v1.1? Paywall copy currently contradicts the brief by promising "no paywalled content."
- Classifieds + 10% IRL fee — beta scope or post-beta? Needs schema, marketplace UX, payments rails (Stripe Connect?), and Apple/Google policy review before any code lands.
- Premium licensed drops (Tamagotchi etc.) — is licensing in motion? Any anchor brand confirmed for launch, or is this directional?
- Restore CTA labelling — "Restore Replay+ status" appears on both `paywall.tsx` and `settings.tsx` even for users who never paid; should it be hidden until the user has a paid history, or kept visible per Apple's review guidelines?
- Brief's "no ads for partner content" line — does this imply there *will* be partner-content surfaces (sponsored episodes? classifieds banners?) and Replay+ removes them? If so, where do those surfaces live in the IA?

<!-- END Review: monetization -->

### Review — schema-content
<!-- BEGIN Review: schema-content -->

_Last reviewed: 2026-04-25 by replay-review-schema-content._

**Brief mismatches**

- **Video replies missing from `episode_responses`** — Brief Section 2.B explicitly calls for "voice memo, text, **or short video** using period-accurate filters (pan-and-scan, VHS tracking lines, tube TV glare)." `episode_responses.response_type` check constraint only allows `text` and `voice`, and the row-level check forces `media_path` to be a voice file. Fix: add `'video'` to the response_type check, add a `video_path` column (or rename `media_path` to a generic `media_storage_path` plus `media_kind`), and create a `video-replies` storage bucket with per-user folder RLS mirroring the `voice-replies` pattern. (`supabase/migrations/0001_replay95_beta.sql:86`, `supabase/migrations/0001_replay95_beta.sql:91-94`, `supabase/migrations/0002_replay95_backend_services.sql:60-64`)
- **`episode_media_items` has no explicit ordering field** — Brief Section 2.B describes a "60-90 second clip montage" — the order of the image / audio / TV beats is editorial. Schema has no `position`/`sequence` column and `get_tonight_episode` orders only by `created_at`, so re-ingesting a clip rewrites montage order. Fix: add `position integer not null default 0` with `unique (episode_id, position)` and update the RPC's `order by` clause. (`supabase/migrations/0001_replay95_beta.sql:60-69`, `supabase/migrations/0002_replay95_backend_services.sql:188`)
- **No pen-pal matching schema** — Brief Section 2.D promises a "pen pal match based on shared 90s interests." Today there is no matching candidate table, no shared-interest scoring view, no `find_pen_pal_candidates` RPC; `friendships.source` only knows `'invite_code'` and the column is freeform text rather than a check-constrained set including `'pen_pal_match'`. Fix: add a `pen_pal_matches` table keyed on `(user_id, candidate_user_id)` with shared-interest score columns, plus an RPC that scores `console_choice` / `mall_store` / `channel_block` / `music_mood` overlap, and extend `friendships.source` with a check constraint that allows `'pen_pal_match'`. (`supabase/migrations/0001_replay95_beta.sql:36-46`)
- **Classifieds marketplace entirely absent** — Brief Section 3 defines a Classifieds section with sponsored slots and a 10% IRL marketplace fee. Zero schema today: no `classified_listings`, no `classified_transactions`, no fee bookkeeping, no sponsor slot table. Fix: out of beta scope per `steps.md` "MVP Scope Decision," but a placeholder migration `0008_classifieds_skeleton.sql` should at least define the listings/transactions tables behind RLS so phase 2 isn't a from-zero start. (no migration to cite — missing CREATEs)
- **Premium licensed drops not modeled in `unlockables`** — Brief Section 3 calls for "Premium limited drops: Officially licensed 90s brand AR stickers (e.g., a working virtual Tamagotchi)." `unlockables` has no `available_from`/`available_to`, no `license_partner`, no `drop_id`, and `category` is freeform text rather than constrained — so the same table cannot distinguish a base store item from a time-boxed licensed drop. Fix: add `available_from timestamptz`, `available_to timestamptz`, `license_partner text`, `drop_kind text check (drop_kind in ('standard','licensed_drop','partner_promo'))`, and gate `purchase_unlockable` on the time window. (`supabase/migrations/0001_replay95_beta.sql:150-159`, `supabase/migrations/0005_replay95_progression_shop.sql:162-257`)
- **Bedroom equip slot is one-per-category** — Brief Section 2.E describes a "static but customizable 90s bedroom diorama" with stacking decorations. `equipped_unlockables` has `primary key (user_id, category)`, so only one `room_decor` can be equipped at a time — equipping a second one silently overwrites the first. Fix: drop the per-category PK, switch to `(user_id, unlockable_id)` as the PK with optional `slot text` for category-singular surfaces (`profile_flair`, `note_paper`, `scene`), and let `room_decor` be additive. (`supabase/migrations/0005_replay95_progression_shop.sql:11-18`)
- **AR loop / video reply storage buckets not provisioned** — Brief Sections 2.B and 2.C call for short video replies and 15-second AR loop exports. `0002` creates `episode-media` and `voice-replies` buckets but no `video-replies` or `ar-loops` bucket, and no per-user folder RLS for them. Fix: add a `0008` migration creating `video-replies` (private, per-user folder RLS like voice) and `ar-loops` (private by default, with explicit "share to friend" path later). (`supabase/migrations/0002_replay95_backend_services.sql:60-115`)
- **Quest catalog only 25% seeded vs phase-1 plan** — `docs/phase-1/content-system.md` Section 4 lists 12 launch quests (`saturday-morning-cereal-run` through `snow-day-cable-marathon`); `0003` seeds only the first 3 (`saturday-morning-cereal-run`, `mall-bracelet-exchange`, `radio-dub-challenge`), and `0007` does not add any. Quests 4-12 are missing along with their step rows. Fix: extend `0003` (or add `0008_quest_catalog_seed.sql`) with the remaining 9 quests + 3 steps each, all idempotent on `slug`. (`supabase/migrations/0003_replay95_seed_beta_content.sql:137-208`)
- **Unlockables catalog missing several quest reward names** — `content-system.md` Section 4 lists rewards like `Hallway yearbook frame`, `Inflatable chair`, `Neon palm-tree lamp`, `Gel pen desk set`, `Fuzzy TV blanket`, `Parking-lot poster pack`, `Bean bag + pager dock` as quest unlockables. `0003` only seeds 12 unlockables and several of those quest reward names have no matching `unlockables.name` row, so `claim_quest_reward`'s name lookup will silently skip the inventory grant for those quests. Fix: seed every quest reward name as an `unlockables` row in the same migration that seeds the quest, and switch the lookup to a slug-based join (see code-quality finding below). (`supabase/migrations/0003_replay95_seed_beta_content.sql:1-48`, `supabase/migrations/0002_replay95_backend_services.sql:252-262`, `supabase/migrations/0005_replay95_progression_shop.sql:408-418`)
- **No account deletion path** — `docs/phase-1/launch-market-and-privacy.md` "Pre-Launch Checklist" requires account deletion before open beta and specifies what must be erased (profile, avatar, wallet, inventory, preferences, user-authored responses) and what must survive (reported items for safety review). No `delete_account` RPC exists; relying on `auth.users` cascade alone wipes `note_reports` too (see next finding) and leaves no audit trail. Fix: add a `delete_account()` SECURITY DEFINER RPC that scrubs PII rows, retains `note_reports` rows for the reported user, and writes a deletion audit row. (no migration to cite — missing CREATE)

**Code-quality findings**

- **`note_reports` rows cascade-delete with the reported note or either user** — Privacy doc requires moderation snapshots to survive even if the reporting user deletes the thread. `note_reports.note_id` is `references public.notes (id) on delete cascade`, and `note_reports.reporter_id` / `reported_user_id` are `on delete cascade` to `profiles`. So deleting the source note (or either user's profile via auth cascade) destroys the report and its `snapshot_body`. Fix: change the three FKs to `on delete set null` (or `restrict` for reported_user_id) and rely on the snapshot columns as the durable record; add a `retained_after_delete boolean` audit flag. (`supabase/migrations/0004_replay95_notes_social.sql:39-49`)
- **`report_note` lets the reporter overwrite their own snapshot via `do update`** — `report_note` does `on conflict (note_id, reporter_id) do update set reason = ..., snapshot_body = ..., snapshot_paper_style = ..., created_at = timezone('utc', now())`. The note body is captured at report time from `notes.body`, but the recipient could quietly amend the underlying note text and the reporter could re-run the report to overwrite the original snapshot. Fix: on conflict, only update `reason` and a separate `last_updated_at`; never re-set `snapshot_body` / `snapshot_paper_style` after the first report. (`supabase/migrations/0004_replay95_notes_social.sql:339-360`)
- **Quest reward / unlockable lookup is by `name`, not `slug`** — `claim_quest_reward` (both copies) looks up `unlockables.id` via `where unlockables.name = v_quest.unlockable_name`. `name` is freeform text and not unique-indexed; renaming an unlockable in `0003` (e.g., capitalizing `Mall Glow`) silently breaks reward grants. Fix: replace `quests.unlockable_name` with `quests.unlockable_slug` referencing `unlockables.slug` (which is `unique`), or join via a new `quests.unlockable_id uuid references public.unlockables(id)`. (`supabase/migrations/0002_replay95_backend_services.sql:252-262`, `supabase/migrations/0005_replay95_progression_shop.sql:408-418`, `supabase/migrations/0001_replay95_beta.sql:118`)
- **Two episodes share the same first-night `unlock_at` with non-deterministic tie-break** — `0003` seeds `blank-tape-warmup` at `2026-04-01T23:30:00Z`, and `0007`'s day-1 `blank-tape-warmup-day-001` is computed at the exact same `unlock_at`. `get_tonight_episode` orders only by `unlock_at desc` (no secondary key), so first-night users get an arbitrary one. Fix: either delete the legacy `0003` `blank-tape-warmup` row in `0007` (it's the same template) or stagger `0007`'s day-1 unlock by an hour, and add `, created_at desc` as a tie-break in the RPC. (`supabase/migrations/0003_replay95_seed_beta_content.sql:75`, `supabase/migrations/0007_replay95_beta_polish.sql:259`, `supabase/migrations/0002_replay95_backend_services.sql:135`)
- **`0007` Summer-of-'94 seed cannot rewrite media-item captions on re-run** — The episode insert is guarded by `not exists (theme_slug, unlock_at)`, but the `episode_media_items` insert is guarded by "no media for this episode" — once a row exists, re-running the migration cannot update its caption. Fix: add a `position` column with `unique (episode_id, position)` (per the brief-mismatch fix above) and switch to `on conflict (episode_id, position) do update set metadata = excluded.metadata`. (`supabase/migrations/0007_replay95_beta_polish.sql:297-316`)
- **`accept_friend_invite` deletes existing rows then inserts only one direction** — The RPC unconditionally `delete from public.friendships where ...` and re-inserts a single `(target.user_id, auth.uid())` row as `'accepted'`. There is no constraint preventing both `(A, B)` and `(B, A)` rows from coexisting later — only `unique (user_id, friend_id)`. Fix: add a generated canonical-pair column `least(user_id, friend_id) || ':' || greatest(user_id, friend_id)` with a unique index, or upsert into a single canonical-direction row. (`supabase/migrations/0001_replay95_beta.sql:36-46`, `supabase/migrations/0004_replay95_notes_social.sql:171-188`)
- **Two `for select` policies on `profiles` ORed without blocked-pair guard** — `profiles_select_own` (`0001:248-251`) and `profiles_select_related_friends` (`0002:44-58`) are both `for select`. Postgres ORs them, which is the intent — but the friends policy joins on `friendships.status = 'accepted'` without checking that no `'blocked'` row exists in either direction. If the same pair has both an accepted and a blocked row historically, the blocked party can still read the profile. Fix: collapse to a single `for select` policy that explicitly excludes pairs with any `status='blocked'` row. (`supabase/migrations/0002_replay95_backend_services.sql:44-58`)
- **`analytics_events` upsert misbehaves when `dedupe_key` is null** — `track_beta_event` uses `on conflict (user_id, event_name, event_day, dedupe_key) where dedupe_key is not null do update`. The matching index `analytics_events_dedupe_idx` is partial, so when `dedupe_key` is null the conflict target does not match and the insert silently bypasses the upsert; the function then falls through to a manual `select ... order by created_at desc limit 1` lookup. The same null-keyed event emitted twice in one day creates two rows. Fix: emit `dedupe_key = ''` for null cases or add a separate non-partial unique index for the null case. (`supabase/migrations/0007_replay95_beta_polish.sql:14-16`, `supabase/migrations/0007_replay95_beta_polish.sql:66-83`)
- **`notification_preferences.timezone` defaults to `America/New_York` instead of capturing the device timezone** — Privacy doc says "always save the device timezone at onboarding." The default at `0001:181` is `'America/New_York'` and `ensure_profile_defaults` at `0002:12-14` hard-codes the same default — so any onboarding flow that forgets to call `save_notification_preferences` with a real device tz silently buckets users into ET. Fix: leave the column nullable with a null default in the table, require an explicit timezone arg in onboarding, and have the notification scheduler treat null as "ask the device again." (`supabase/migrations/0001_replay95_beta.sql:181`, `supabase/migrations/0002_replay95_backend_services.sql:12-14`)
- **`get_beta_dashboard` is `security definer` but readable by every authenticated user** — Returns total profiles, daily open rates, and quest completion rates across the entire beta cohort. There is no admin-role gate, only `if v_user_id is null` — any authenticated beta user can read aggregate KPIs. Fix: add a `beta_admins` table (or a Postgres role check) and gate the function on membership before computing the aggregates. (`supabase/migrations/0007_replay95_beta_polish.sql:94-114`)
- **`deliver_due_notes` ignores blocked / muted recipients added between queue and delivery** — When notes hit their `scheduled_for`, the function flips status to `delivered` regardless of whether the recipient muted the sender or whether a `friendships.status='blocked'` row was added between queue and delivery. Fix: in the CTE, exclude rows where `exists (select 1 from public.note_mutes where user_id = notes.recipient_id and muted_user_id = notes.sender_id)` or any blocked friendship row covers the pair, and either leave them in `'queued'` or set them to `'blocked'`. (`supabase/migrations/0002_replay95_backend_services.sql:350-381`, `supabase/migrations/0004_replay95_notes_social.sql:51-57`)
- **`personalization_payload` has no schema validator** — `daily_episodes.personalization_payload jsonb default '{}'::jsonb` is the only place montage tags, season, cycle, and sequence live; nothing constrains its shape, and the RPC silently coalesces missing keys to `[]`. Editorial drift (e.g., misspelled `montage_tag`) won't fail at write time. Fix: add a JSON-schema check constraint or trigger that validates required keys (`season`, `cycle`, `sequence`, `montage_tags`) on insert/update. (`supabase/migrations/0001_replay95_beta.sql:55`, `supabase/migrations/0002_replay95_backend_services.sql:147`)
- **`pog_wallets` increment in `claim_quest_reward` is not row-locked before the upsert** — The first-time `insert into public.pog_wallets ... on conflict (user_id) do update set balance = public.pog_wallets.balance + v_quest.reward_pogs` runs without a `for update` lock on the wallet row first. Two simultaneous `claim_quest_reward` calls for two different quests can read the same starting balance and only one increment will land. Fix: take a row lock (`select balance from pog_wallets where user_id = v_user_id for update`) before the upsert and then update. (`supabase/migrations/0005_replay95_progression_shop.sql:401-406`)

**Open questions for product**

- Are video replies a beta requirement or post-beta? `steps.md` MVP scope says "text + voice responses, no video" but the brief contradicts that. Confirm which is authoritative before adding the schema column.
- Does the Bedroom diorama allow stacking multiple `room_decor` items, or is one-at-a-time the intended constraint? The schema's `unique (user_id, category)` reads as the latter, but the brief's "customizable diorama" language reads as the former.
- Pen-pal matching: Phase-2 feature or open-beta launch blocker? If Phase-2, the friendships table can stay as-is and the schema gap is a tracked TODO rather than launch work.
- For `note_reports` retention: how long should snapshots persist after a user deletes their account? Privacy doc says "must remove ... unless a reported item must be retained" but doesn't pick a retention window (90 days? 1 year? indefinite for unresolved cases?).
- Premium licensed drops: who owns the licensing pipeline? Without that, the `license_partner` column has no source of truth and the schema gap is theoretical.
- Should `equipped_unlockables` be wiped on account deletion, or kept long enough for a reactivation window?
- Is `get_beta_dashboard` intended to be self-serve for every beta user (current behavior), or admin-only? The current RLS posture leaks cohort-level KPIs.
- Should the `0003` legacy `blank-tape-warmup` episode be deleted now that `0007` seeds a full 90-day Summer-of-'94 catalog, or kept as a first-night editorial fallback?

<!-- END Review: schema-content -->

### Review — launch-analytics
<!-- BEGIN Review: launch-analytics -->

_Last reviewed: 2026-04-25 by replay-review-launch-analytics._

**Brief mismatches**

- **No waitlist flow exists.** Brief §5 specifies a waitlist mechanic with the copy "Remember waiting for your turn on the family computer? Same energy." The only entry point is plain magic-link sign-in — anyone with an email gets in immediately, with no waitlist screen, table, or copy anywhere. Fix: add a pre-auth waitlist screen ahead of `/login`, persist signups to a new `beta_waitlist` table, and gate magic-link issuance on an `invited_at` flag. (`app/(auth)/login.tsx:54`, `supabase/migrations/0007_replay95_beta_polish.sql:1`)
- **5,000-user beta cap is not enforced.** Brief §5 caps soft launch at 5,000 users; there is no count check, no "we're full" state, and no schema for invite waves. Fix: add `beta_signups` (or extend the new waitlist table) with a `count(*) <= 5000` gate inside a SECURITY DEFINER `claim_beta_seat` RPC, called before `signInWithOtp` succeeds. (`src/state/replay-context.tsx`, `supabase/migrations/0007_replay95_beta_polish.sql`)
- **Invite / referral mechanic is missing.** Phase 10 lists "Build invite / referral mechanic"; the brief implies invite waves from FB/Reddit. The only existing invite codes are `friendships.invite_code` for friend connections — a different concept. Fix: add a `referral_codes` table tied to waitlist promotions and a screen to share/claim them. (`src/features/notes/note-service.ts:56`, `app/(auth)/login.tsx`)
- **Summer of '94 cultural beats are absent.** Brief §5 names Woodstock '94, Forrest Gump, World Cup, Pulp Fiction teaser, and AOL 2.5 launch as anchor moments. Migration 0007 seeds 90 daily episodes from a 30-template cycle (mall runs, sleepovers, roller rinks, etc.) with `'season', 'Summer of \'94'`, but none of the named cultural beats appear in any title, subtitle, or tag. Fix: replace at least 5 of the 30 templates (or schedule them at sequence 1, 15, 30, 45, 60) with the named beats. (`supabase/migrations/0007_replay95_beta_polish.sql:213-243`)
- **In-app feedback capture is missing.** Phase 10 lists "Prepare feedback capture inside the app"; there is no feedback screen, no feedback table, no Slack/email handoff anywhere in `app/`. Fix: add `app/feedback.tsx` (or a settings card) writing to a new `beta_feedback` table, plus a "Send feedback" link in `app/settings.tsx`. (`app/settings.tsx:288`)
- **Soft-launch support workflow has no surface.** Phase 10 lists support workflow; `app/settings.tsx` exposes Replay+, notifications, analytics, and sign-out — no help screen, no contact email, no support link. Fix: add a "Get help" card in `app/settings.tsx` with a `mailto:` or in-app support form. (`app/settings.tsx:288`)
- **Crash reporting SDK is not installed.** `src/lib/error-reporting.ts:14-26` checks `env.sentryDsn` and logs a console notice that the SDK is not installed yet — no crash visibility for a 5,000-user soft launch. Fix: `npx expo install @sentry/react-native`, add the plugin to `app.json`, and replace the comment block with the `Sentry.init` call described inline. (`src/lib/error-reporting.ts:18-26`, `package.json:15`, `app.json:9-29`)
- **No App Store / Play Store assets in repo.** Phase 10 lists "Prepare App Store and Play Store assets"; `app.json:30-33` has only `supportsTablet: true` and an empty `android: {}` — no icons, splash, screenshots, or store metadata. Fix: add icon/splash/adaptive-icon paths to `app.json` and create a `store-assets/` directory tracked outside this review. (`app.json:30`)

**Code-quality findings**

- **`get_beta_dashboard` is `security definer` with no role gate.** Any authenticated user — every beta participant — can call the RPC and read full-fleet `totalProfiles`, `dailyOpenRate7d`, and trend rows. Fix: add an `is_admin` check (e.g. `auth.jwt() ->> 'role' = 'admin'` or a lookup against a new `beta_admins` table) at the top of the function and return `null`/raise for non-admins. (`supabase/migrations/0007_replay95_beta_polish.sql:97`, `supabase/migrations/0007_replay95_beta_polish.sql:111-114`)
- **`/analytics` has no admin gate either.** `app/analytics.tsx:20-22` only redirects unauthenticated users; any signed-in beta user can route to it from `app/settings.tsx:294-297` ("Open beta dashboard"). Fix: gate both the route and the settings entry on the same admin check used in the RPC. (`app/analytics.tsx:20`, `app/settings.tsx:294`)
- **Camera export events have no `dedupeKey`.** `app/camera.tsx:67-73` and `app/camera.tsx:103-109` insert a fresh `analytics_events` row every export. The dashboard reads `count(*) for camera_*_exported`, so this is intentional, but a stuck retry loop or an over-eager user can inflate the metric without bound. Fix: either accept that as the count semantics (and document it in the service header) or add a per-day dedupeKey to bound it. (`app/camera.tsx:67`, `app/camera.tsx:103`)
- **`useBetaDashboard` always seeds `initialData` even when the query has not run.** `src/features/analytics/analytics-service.ts:103` returns the zeroed `initialBetaDashboard` synchronously, so `app/analytics.tsx:32-95` renders zeros instead of a loading state on first paint. Fix: drop `initialData` (or use `placeholderData`) and add a loading branch to the screen. (`src/features/analytics/analytics-service.ts:103`, `app/analytics.tsx:18`)
- **No timezone parity between client `today_open` dedupe and server `event_day`.** `app/(tabs)/today.tsx:153` uses `toISOString().slice(0, 10)` (UTC), and `track_beta_event` stores `event_day` in UTC too — but the brief specifies `America/New_York` as the default notification timezone, so a 10pm ET open lands on the next UTC day and splits the bucket. Fix: switch the dedupe key and the SQL `event_day` default to `America/New_York` (or trust a client-supplied dedupe). (`app/(tabs)/today.tsx:153`, `supabase/migrations/0007_replay95_beta_polish.sql:6`)
- **No `replay_plus_purchased` or `note_sent` events emitted.** Brief success metrics include "Replay+ conversion rate" and "number of notes sent and opened", but the only `trackBetaEvent` call sites are `onboarding_completed`, `today_open`, `camera_still_exported`, `camera_loop_exported`, and `quest_reward_claimed`. The dashboard does not currently surface notes/Replay+ either, so this is a forward-looking gap. Fix: emit `note_sent`/`note_opened`/`replay_plus_started` from the relevant services and extend `get_beta_dashboard` to read them. (`src/features/notes/note-service.ts`, `src/features/account/account-service.ts`, `supabase/migrations/0007_replay95_beta_polish.sql:94`)

**Open questions for product**

- Is the waitlist a real queue (FIFO with invite waves) or a marketing list (everyone who signs up gets in once we open)? The schema/UX differ.
- Should the 5,000 cap be a hard server-side gate or a softer "we're full, join the waitlist" UX with a manual override per Reddit/FB cohort?
- Do we want copy variants for r/Xennials vs. Facebook 90s groups (UTM-tagged), or a single landing experience?
- For `get_beta_dashboard`, who counts as an admin — a hardcoded list of internal emails, a `profiles.role` column, or the existing Supabase service role only (i.e. operators read it from Supabase Studio, not the app)?
- Are the named Summer of '94 beats (Woodstock '94, Forrest Gump, etc.) intended as themed episodes on specific dates (e.g. Woodstock '94 = Aug 12), or just as content tags layered on the existing 90-day plan?
- Do we want PostHog (or another product analytics tool) on top of `analytics_events`, or is the Supabase-only stack the long-term plan? `package.json:15-36` ships neither PostHog nor Amplitude.
- Should account deletion (Phase-1 launch-market doc requires it before open beta) live under `app/settings.tsx` alongside the new feedback/support entries?

<!-- END Review: launch-analytics -->

## Current Implementation Slice

Active now:

- Expo Router scaffold with a mocked data layer
- onboarding questionnaire and avatar setup
- Tonight / Memory Channel home flow
- delayed notes prototype
- weekly quests prototype
- bedroom customization prototype

Decisions locked:

- beta uses `text + voice` responses; short-form video stays out of the first build
- beta media uses owned, partner-cleared, public-domain, or licensed assets only
- AR stays in the post-beta track except for future camera-filter work
- monetization for beta remains `free tier + Replay+`
