# Replay '95 Phase 1 Closeout

Last updated: 2026-04-23
Status: Complete

## What Phase 1 Locked

Phase 1 is complete once the app's UX shape, core flows, and content system are specific enough that implementation can proceed without major product ambiguity.

The following decisions are now locked:

- beta launch market, age gate, and privacy posture
- complete information architecture for onboarding, tabs, and secondary routes
- user flows for onboarding, nightly episode, notes, quests, and unlockables
- onboarding question bank and avatar option set
- first 30 Memory Channel templates
- first 12 weekly quests
- initial pog economy and unlockables catalog

## Deliverables

- `launch-market-and-privacy.md`
- `information-architecture.md`
- `user-flows.md`
- `content-system.md`

## Product Decisions Now Considered Stable

- Beta launch stays US-only and English-only.
- Beta access is `18+` and limited to the `1980-1995` birth-year cohort.
- Social stays private-by-default and invite-only.
- The app keeps the current four-tab shell: `Tonight`, `Notes`, `Quests`, and `Bedroom`.
- Replay+ remains an entitlement layer, not the main progression system.
- The nightly Memory Channel remains the primary retention loop.

## What This Means For Implementation

The current prototype no longer needs more phase 1 planning. Work should now shift to turning the mocked flow into a persisted vertical slice.

Recommended next slice:

1. Supabase env wiring and client bootstrap
2. auth and session bootstrap
3. onboarding persistence into `profiles`, `avatar_choices`, `notification_preferences`, and `pog_wallets`
4. Tonight screen backed by saved user profile data instead of local mock state

## Exit Check

Phase 1 exit criteria from `steps.md` are satisfied:

- we know what v1 should look like
- we know what content the beta needs
- we know the next implementation slice
