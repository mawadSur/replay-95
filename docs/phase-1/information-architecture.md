# Replay '95 Information Architecture

Last updated: 2026-04-23

## Navigation Model

The beta app should use a simple three-layer structure:

1. Session bootstrap
2. Onboarding stack
3. Main tab shell with a small set of secondary screens

This keeps the product focused on the nightly loop instead of turning it into a maze of destinations.

## App Map

### Root

- `/`
  - Decides whether the user goes to onboarding or the main app.
  - Matches the current redirect behavior in `app/index.tsx`.

### Auth And Session

- `/(auth)/welcome`
  - Branding, cohort framing, and sign-in/sign-up entry.
- `/(auth)/sign-in`
  - Email magic link or OTP.
- `/(auth)/verify`
  - Return state after auth handoff.

Note: auth screens are not scaffolded yet, but they are part of the intended IA because phase 2 still has auth setup outstanding.

### Onboarding Stack

- `/(onboarding)/welcome`
  - 18+ gate and beta cohort framing.
- `/(onboarding)/profile`
  - Name, hometown, birth year.
- `/(onboarding)/taste`
  - Console, mall store, TV block, music mood.
- `/(onboarding)/dream-concert`
  - Open text memory anchor.
- `/(onboarding)/avatar`
  - School-photo style look builder.
- `/(onboarding)/notifications`
  - Nightly delivery time and push opt-in.
- `/(onboarding)/done`
  - First-night setup confirmation and CTA into Tonight.

Note: the current prototype compresses the profile, taste, and dream concert steps into `app/(onboarding)/index.tsx`. The final IA keeps the same inputs but splits them into cleaner steps.

### Main Tabs

- `/(tabs)/today`
  - Primary destination.
  - Tonight's episode, prompts, response booth, and entry point to Replay+.
- `/(tabs)/notes`
  - Quiet friend-to-friend messaging with delayed delivery.
- `/(tabs)/quests`
  - Weekend progression, pog wallet, and reward claiming.
- `/(tabs)/bedroom`
  - Equipped unlockables and room-scene personalization.

These four tabs match the current shell and should stay the beta primary navigation.

### Secondary Screens And Modals

- `/episode/[id]`
  - Full episode player once montage media becomes richer than the current single-page prototype.
- `/response/voice`
  - Voice memo capture and playback confirmation.
- `/notes/compose`
  - Recipient picker plus note composer if the tab screen becomes inbox-first.
- `/notes/[id]`
  - Read note, reply, report, or block.
- `/quests/[id]`
  - Full quest details and completion state.
- `/unlockables/[id]`
  - Unlockable detail and equip/purchase state.
- `/settings`
  - Notification preferences, subscription restore, account actions.
- `/paywall`
  - Replay+ details and upgrade flow.
- `/safety/report`
  - Reporting flow for notes or users.

## Screen Responsibilities

### Tonight

- Show the nightly episode first.
- Show only one episode at a time.
- Handle prompt completion, text reply, and later voice reply.
- Surface lightweight progress, not a content feed.

### Notes

- Stay inbox-first once friendships exist.
- Keep message composition short and frictionful enough to discourage spam.
- Emphasize delivery windows over instant chat behavior.

### Quests

- Make weekend progression understandable in one glance.
- Show pog rewards and unlockable outcomes clearly.
- Avoid a battle-pass feel.

### Bedroom

- Act as the owner's collectible scrapbook scene.
- Make equipped unlockables easy to preview and switch.
- Avoid turning into a simulation game.

## Explicitly Excluded From Beta IA

- public feed
- public comments
- pen-pal matching
- marketplace
- advanced AR navigation
- mini-game hub

## Routing Notes For Implementation

- Keep the current four-tab structure.
- Treat onboarding as a dedicated stack outside the tab shell.
- Add secondary screens only when the core nightly flow needs them.
- Do not add a fifth tab for unlockables; keep unlockables attached to Quests and Bedroom.
