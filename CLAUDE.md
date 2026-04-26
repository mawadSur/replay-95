# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`Replay '95` (slug `replay-95`) — an Expo / React Native app: a daily nostalgia ritual for users born 1980–1995. Three docs anchor product behavior, in this order of authority:

- `docs/product-brief.md` — the authoritative product spec (Core Concept, Detailed Features A–E, Monetization, Positioning, Launch Strategy). The per-segment review agents compare code against this file. Update it before the agents if the spec changes.
- `steps.md` — the running build plan. **Phase 9 (Beta polish)** is active. Phase 2 still has open items (notifications wiring, analytics, test runner, CI). ESLint/Prettier configs and scripts now exist but their npm deps aren't installed yet (`npx expo install eslint eslint-config-expo prettier eslint-config-prettier`), so `npm run lint`/`format` will fail until that's done.
- `docs/phase-1/` — content/launch/privacy plans referenced by the brief.

Read the brief before changing product behavior; read `steps.md` before sequencing work.

This repo is **not** a git repository — `git log`/`git blame` won't work, so don't reach for them for historical context.

## Commands

```
npm run start        # expo start
npm run ios          # expo start --ios
npm run android      # expo start --android
npm run web          # expo start --web
npm run typecheck    # tsc --noEmit  (the working check)
npm run lint         # eslint .              — fails until deps installed (see Project)
npm run format       # prettier --write .    — fails until deps installed (see Project)
```

`tsc --noEmit` is the only check that runs today. There is no test runner yet.

## Environment

Required `EXPO_PUBLIC_*` vars live in `.env` (template in `.env.example`). `src/config/env.ts` throws at import time if `EXPO_PUBLIC_SUPABASE_URL` or `EXPO_PUBLIC_SUPABASE_ANON_KEY` are missing — so a missing env crashes the bundle on first import, not at first network call. Other vars (Sentry, PostHog, RevenueCat, default notification hour) are optional with safe defaults.

## Path alias

`@/*` → `src/*` (set in `tsconfig.json` and enabled via `expo.experiments.tsconfigPaths` in `app.json`). Use it for all intra-`src` imports.

## Architecture

### Routing (Expo Router, file-based, in `app/`)

Route groups gate access:

- `app/_layout.tsx` wraps everything in `SafeAreaProvider` → `QueryClientProvider` → `ReplayAppProvider`, and forwards notification taps to a route via `extractReplayNotificationRoute`.
- `app/index.tsx` is the splash gate: redirects to `/login` if no session, `/(onboarding)` if no profile row, `/(tabs)/today` otherwise.
- `app/(tabs)/_layout.tsx` re-checks the same gates so deep links into a tab can't bypass auth/onboarding.
- `app/(auth)/login.tsx`, `app/(onboarding)/*`, `app/(tabs)/{today,notes,quests,bedroom}.tsx`, plus secondary routes (camera, paywall, settings, safety report, dynamic note/quest detail, auth callback) at `app/`'s top level.

App scheme is `replay95`; auth callback path is `/callback` (`src/features/auth/auth-service.ts`).

### State

Two layers, intentionally separate:

1. **Server state — TanStack Query** (`src/lib/query-client.ts`). Each feature owns its query/mutation hooks (e.g. `useTonightEpisode`, `useEpisodeResponses`, `useEpisodeHistory`, `useSaveTextEpisodeResponse`, `useSaveVoiceEpisodeResponse` in `src/features/memory/episode-service.ts`). Query keys are colocated with the hooks.
2. **App-level UI/auth state — `ReplayAppProvider`** (`src/state/replay-context.tsx`). Owns the Supabase session, bootstraps it from `supabase.auth.getSession()`, subscribes to `onAuthStateChange`, hydrates magic-link callbacks via `Linking`, and exposes a `useReplayApp()` hook. It also keeps drafts that the onboarding flow mutates locally before the final `saveOnboardingProfile` write. The presence of a `profiles` row is what defines `hasCompletedOnboarding` — there is no separate flag.

Don't add a third store. New cross-screen UI state goes in `ReplayAppProvider`; new server state goes in a feature `*-service.ts` as a TanStack Query hook.

### Supabase client

`src/lib/supabase.ts` configures the JS client with `AsyncStorage` for session persistence, `detectSessionInUrl: false` (we do that ourselves in `auth-service.ts` to control the deep-link flow), and binds `startAutoRefresh`/`stopAutoRefresh` to `AppState` changes. Import the singleton `supabase` from this module — never call `createClient` directly elsewhere.

### Features

`src/features/<domain>/` contains the data layer for each product surface. The pattern is: a `*-service.ts` exporting plain async functions and/or TanStack Query hooks that call `supabase` (table queries via `.from(...)` or RPCs via `.rpc(...)`), plus optional helpers (`profile-options.ts`, `note-constants.ts`, `camera-filters.ts`, `build-tonight-episode.ts`). Screens in `app/` consume these hooks; UI primitives live in `src/components/` and theme tokens in `src/theme/tokens.ts`. Domain types are in `src/types/replay.ts`.

The Tonight loop expects a Supabase RPC `get_tonight_episode`; voice replies upload to the `voice-replies` storage bucket; signed URLs are minted via `getSignedVoiceReplyUrl`. If the RPC returns nothing, `episode-service.ts` falls back to a locally-built editorial card so the screen still renders.

### Database / backend

`supabase/migrations/000{1..7}_replay95_*.sql` are sequenced and additive — apply in order. They cover the full beta data model (profiles, avatars, friendships, episodes/media/prompts/responses, notes + delivery queue, quests, pog wallet, unlockables, inventory, subscription status, notification preferences) plus the `voice-replies` storage bucket and the `get_tonight_episode` RPC. There is no separate backend repo — Supabase Postgres + Edge Functions is the backend.

### What `ReplayAppProvider` owns vs. feature services

Worth knowing the split — it's narrower than it looks.

`ReplayAppProvider` only owns: the Supabase session, the onboarding `draftProfile` + `updateDraftProfile`/`updateAvatar`, the `notificationDraft` + `updateNotificationDraft`, the `pogs` balance mirrored from the viewer query, `requestMagicLink` / `signOut`, and `completeOnboarding`. That's it.

Everything else — Tonight episode + responses, Notes inbox + composer + invites + safety, Quests + step responses + reward claims, Bedroom inventory + purchases + equip — is server-backed via TanStack Query hooks in `src/features/<domain>/*-service.ts`. New per-screen state goes in those services, not in `ReplayAppProvider`.

### Notifications

`src/features/memory/memory-notification-service.ts` configures the `nightly-memory` Android channel, schedules a daily local notification from the user's `notification_preferences`, and tags payloads with `{ entry, route }` so `app/_layout.tsx` can deep-link into the right tab on tap. Web is a no-op throughout.

### Error reporting

`src/lib/error-reporting.ts` exports `initErrorReporting()` (called once from `app/_layout.tsx`) and `reportError(error, context?)`. Today it's a console-backed stub that reads `env.sentryDsn`; the file has an inline comment showing how to swap in `@sentry/react-native` when the SDK is installed. Call `reportError` from catch blocks instead of bare `console.error` so the swap is one-file.

### Native config

`app.json` declares Expo config plugins for `expo-audio`, `expo-camera`, and `expo-notifications` with their permission strings (microphone, camera, default `nightly-memory` channel). Adding a native dep, changing a permission string, or shipping a new dev client requires editing `app.json` and rebuilding — JS-only changes don't.

## Per-segment review agents

Eight subagents in `.claude/agents/replay-review-*.md` audit one slice each (onboarding, memory-channel, classroom-notes, quests, bedroom-ar, monetization, schema-content, launch-analytics) against `docs/product-brief.md`. Each agent rewrites its own block in `steps.md` between `<!-- BEGIN Review: <segment> -->` and `<!-- END Review: <segment> -->` markers — idempotent, so re-running is safe.

Dispatch via the Agent tool with `subagent_type: replay-review-<segment>`. They share no state, so you can run them in parallel.

**`steps.md` has two kinds of content** that should not be confused: the manual build plan (edit by hand) and the agent-owned review blocks bracketed by `<!-- BEGIN Review: X -->` / `<!-- END Review: X -->`. Don't hand-edit content inside those markers — re-run the owning agent instead, or your changes will be overwritten on the next review pass.

## Conventions

- File names are kebab-case, including TSX components (`school-photo-card.tsx`, `retro-screen.tsx`).
- Database columns are `snake_case`; TypeScript fields are `camelCase`. The mapping happens in feature services (see `mapProfile` in `profile-service.ts`) — keep that boundary clean rather than leaking snake_case into screens.
- The `tokens` object in `src/theme/tokens.ts` is the source of truth for colors, gradients, spacing, radii, and typography. Don't hardcode hex values in components.
- Beta scope is locked (text + voice responses, no video; owned/licensed media only; no full AR; free + Replay+ tiers). See `steps.md` "MVP Scope Decision" before adding features.
