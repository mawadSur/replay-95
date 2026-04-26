# Replay '95 Beta Launch Market, Age Gate, and Privacy

Last updated: 2026-04-23

## Decision Summary

- Launch market: United States only for beta.
- Language: English only for beta.
- Audience: adults born 1980-1995.
- Age gate: 18+ only.
- Social model: private by default, friends-only, no public discovery.
- Trust posture: block/report tools are required before open beta.

## Why This Is The Right Beta Scope

The product is written for a very specific nostalgia cohort. The existing schema already enforces `birth_year between 1980 and 1995`, and the note system is intentionally quiet and closed rather than public. A US-only beta keeps content, moderation, notification timing, and legal review constrained while the nightly loop is still being proven.

## Beta Launch Requirements

### Market

- Ship to the US only in beta.
- Default content voice, push timing, and support hours around US audiences.
- Keep `America/New_York` as the default notification timezone, but always save the device timezone at onboarding.

### Age Gate

- Require an `18+` self-attestation before account creation completes.
- Require a birth year during onboarding.
- Accept only users born `1980-1995` for the beta cohort.
- If a user is outside the cohort, show a holdout screen instead of letting them into the product.

## Privacy Rules For Beta

### Data We Intentionally Collect

- account identifier from Supabase Auth
- display name or nickname
- hometown as city/state text only
- birth year
- nostalgia preference answers used for personalization
- avatar selections
- note text and delivery metadata
- voice reply files once voice is enabled
- notification preferences
- subscription status

### Data We Do Not Collect In Beta

- phone contacts
- precise location
- public social graph
- public profile search
- ad-tech identifiers beyond core product analytics

### Social Visibility

- Notes are visible only to the sender and the approved recipient.
- Friendships are invite-only.
- There is no public feed, no comments, and no open profile browsing in beta.
- Bedroom/profile surfaces are viewable only by the account owner until direct friend-view is explicitly designed.

### Safety And Moderation

- Add `block`, `report`, and `mute` actions before public beta.
- Store reported note content for moderation review even if the reporting user deletes the thread.
- Start with text notes only between approved friends.
- When voice replies ship, keep them private to the author unless a later feature explicitly shares them.

### Analytics And Logging

- Track funnel events, counts, and status changes.
- Do not send raw note bodies or voice transcripts into analytics tools.
- Treat note content and voice media as product data, not analytics payloads.

### Retention And Deletion

- Users need an account deletion path before open beta.
- Deleting an account must remove profile, avatar, wallet, inventory, preferences, and user-authored responses unless a reported item must be retained for safety review.
- Keep note and response storage private by default.

## Product Implications

- The current `friendships.source default 'invite_code'` is the right launch path.
- `birth_year` validation already matches the target cohort.
- `notes`, `episode_responses`, and `notification_preferences` already fit the private-by-default beta posture.
- We should not add contact import or public discovery during phase 1 or phase 2.

## Pre-Launch Checklist

- Privacy policy drafted against the actual collected fields.
- Terms of use drafted.
- Community rules for notes drafted.
- Block/report UI and backend actions implemented.
- Account deletion implemented.
