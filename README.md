# Replay '95

Your 90s life. Reloaded.

A daily nostalgia ritual for users born 1980–1995 — onboarding personalizes a 90s profile, an evening "Memory Channel" episode prompts text and voice replies, delayed Classroom Notes pass between friends, and weekly Saturday Morning quests reward pogs you spend on bedroom unlockables.

Built with Expo, React Native, TypeScript, Supabase, and TanStack Query.

## Quick start

```bash
npm install
cp .env.example .env   # fill in at minimum the two Supabase vars
npm run ios            # or: android, web, start
```

The bundle throws at import time if `EXPO_PUBLIC_SUPABASE_URL` or `EXPO_PUBLIC_SUPABASE_ANON_KEY` are missing — so a missing env is a hard, fast failure rather than a silent network error.

## Environment variables

| Var | Required | Purpose |
| --- | --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | yes | Supabase anon key |
| `EXPO_PUBLIC_SENTRY_DSN` | optional | Crash + error reporting |
| `EXPO_PUBLIC_POSTHOG_KEY` / `_HOST` | optional | Product analytics |
| `EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY` | optional | iOS subscriptions |
| `EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY` | optional | Android subscriptions |
| `EXPO_PUBLIC_DEFAULT_NOTIFICATION_HOUR` | optional | Default nightly delivery hour (default: 19) |

Without RevenueCat keys the paywall falls back to a beta-preview trial path. Without Sentry/PostHog the app runs but crashes/events are console-only.

## Backend setup

The backend is Supabase Postgres + Storage. Apply the migrations in order:

```bash
# from a Supabase SQL editor or psql, run each file in supabase/migrations/ in numeric order:
0001_replay95_schema.sql
0002_replay95_rls.sql
...
0009_replay95_billing_sync.sql
```

These create the data model (profiles, episodes, notes, quests, pog wallet, subscription status), RLS policies, the `voice-replies` storage bucket, and the `get_tonight_episode` / `sync_replay_plus_from_purchase` RPCs.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run start` | Start Expo dev server |
| `npm run ios` / `android` / `web` | Start on a specific platform |
| `npm run typecheck` | `tsc --noEmit` — the working check today |
| `npm run lint` | ESLint (requires `npx expo install eslint eslint-config-expo prettier eslint-config-prettier` first) |
| `npm run format` | Prettier (same install caveat) |

There is no test runner yet.

## Native modules

RevenueCat (`react-native-purchases`) and Sentry (`@sentry/react-native`) are native modules — Expo Go can't load them. Use a dev client:

```bash
npx expo prebuild
npx expo run:ios     # or run:android
# or, with EAS:
eas build --profile development --platform ios
```

## Project layout

```
app/                   # Expo Router screens (file-based routing)
  (auth)/login.tsx
  (onboarding)/...
  (tabs)/{today,notes,quests,bedroom}.tsx
  callback.tsx, paywall.tsx, settings.tsx, ...
src/
  components/          # UI primitives
  features/<domain>/   # Data layer per product surface
  state/replay-context.tsx   # Session + onboarding-draft state
  lib/                 # supabase, query-client, error-reporting
  theme/tokens.ts      # Colors, gradients, spacing, typography
  types/replay.ts      # Domain types
supabase/migrations/   # Sequenced, additive SQL migrations
docs/product-brief.md  # Authoritative product spec
steps.md               # Build plan + per-segment review blocks
CLAUDE.md              # Architecture notes for AI-assisted edits
```

Path alias `@/*` → `src/*`.

## Architecture cheat sheet

- **Server state** lives in TanStack Query hooks colocated with each feature (`src/features/<domain>/*-service.ts`). Query keys are colocated with the hooks.
- **Session + onboarding-draft state** lives in `ReplayAppProvider` (`src/state/replay-context.tsx`). It owns the Supabase session, magic-link callback hydration, the onboarding draft, the notification draft, and the pog balance mirror. Nothing else.
- **Routing gates** live in `app/index.tsx` and `app/(tabs)/_layout.tsx`: no session → `/login`, no profile row → `/(onboarding)`, otherwise `/(tabs)/today`. The presence of a `profiles` row defines `hasCompletedOnboarding` — there is no separate flag.
- **Notifications** are local-only via `expo-notifications`; the `nightly-memory` Android channel is configured in `src/features/memory/memory-notification-service.ts`. Web is a no-op.

For a deeper architectural tour, read `CLAUDE.md`. For product intent, read `docs/product-brief.md`. For build sequencing and open work, read `steps.md`.

## Beta scope

Locked: text + voice responses (no video), owned/licensed media only, no full AR (camera-with-filters only), free tier + Replay+ subscription. The Layer-2 deferred list — pen-pal matching, classifieds marketplace, mini-games, world-anchored AR — lives in `steps.md`.
