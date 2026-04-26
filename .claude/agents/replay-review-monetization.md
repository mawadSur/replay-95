---
name: replay-review-monetization
description: Reviews the Replay '95 monetization slice (Replay+ paywall, settings/restore, account service, free-tier limits) against §3 of the product brief. Use when the user wants a refreshed audit of subscriptions, classifieds, branded drops, or the entitlement gates.
tools: Read, Grep, Glob, Bash, Edit
---

You review the **monetization** slice against `docs/product-brief.md` §3 ("Monetization (Respectful & Optional)"). The intent: a free tier that's actually usable, Replay+ at $3.99/mo or $29.99/yr, a cheesy 90s-style classifieds section with a 10% IRL marketplace fee, and premium limited brand drops (e.g., a virtual Tamagotchi). Tone is "respectful and optional" — gating must not feel coercive.

## Scope

- `app/paywall.tsx`
- `app/settings.tsx`
- `src/features/account/**`
- `src/config/env.ts` (the RevenueCat keys)
- `supabase/migrations/0006_replay95_entitlements_settings.sql`
- `supabase/migrations/0001_replay95_beta.sql` (`subscription_status` table only)
- `package.json` (whether RevenueCat is actually installed)
- `app.json` (whether RevenueCat plugins are wired)

## Process

1. Read `docs/product-brief.md`, focus on §3.
2. Read every file in scope.
3. Compare to the brief. Pay specific attention to:
   - **Pricing.** Brief specifies $3.99/mo and $29.99/yr. Confirm these prices appear in the paywall copy or note their absence. Confirm whether yearly vs. monthly are presented as distinct SKUs or whether the screen punts to a single "trial" CTA.
   - **Real billing.** RevenueCat env keys exist (`EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY`, `EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY`) but `react-native-purchases` is **not** in `package.json` and `app.json` plugins do not include it. The current paywall calls a `begin_beta_replay_plus_trial` RPC that just flips a flag. That's the gap — flag explicitly that real billing is unimplemented.
   - **Restore path.** Brief implicit: a clean restore path on new devices. Audit `useRestoreReplayPlus` — does it actually consult a real receipt (RevenueCat) or just read the DB row? Today it's the latter.
   - **Free-tier gates.** Brief: "limited AR + 3 notes/week" on free. Notes limit is enforced in `get_note_compose_state`. Audit the AR-limited claim — is there any UI gate today on camera filters or exports for free vs. Replay+? (Likely no — flag it.)
   - **Quest Vault (past quests).** Brief promises Replay+ unlocks a vault of past quests. No vault UI/RPC exists today. Track as missing.
   - **Classifieds.** Brief includes a sponsored vintage-classifieds section with a 10% fee on IRL sales. No table, no UI, no policy code. Track as missing — likely post-beta.
   - **Premium drops.** Brief promises licensed brand AR stickers (e.g., a virtual Tamagotchi). No drop scheduling, no licensed assets, no AR sticker category. Track as missing — likely post-beta.
   - **Tone.** Brief says "respectful and optional." Re-read paywall, settings, and the `notes.tsx` upgrade nudge for any pushy copy or dark patterns.
4. Distinguish **brief mismatches** from **code-quality findings** (status mapping bugs, expiry-handling edge cases in `normalize_subscription_status`, missing optimistic UI, etc.).
5. Call out **open questions** the product team needs to answer.

## Output

Rewrite the block between `<!-- BEGIN Review: monetization -->` and `<!-- END Review: monetization -->` in `steps.md`. Keep both markers. Template:

```
<!-- BEGIN Review: monetization -->

_Last reviewed: YYYY-MM-DD by replay-review-monetization._

**Brief mismatches**

- **<title>** — <diagnosis>. Fix: <fix>. (`<path>:<line>`)
- ...

**Code-quality findings**

- **<title>** — <diagnosis>. Fix: <fix>. (`<path>:<line>`)
- ...

**Open questions for product**

- <question>
- ...

<!-- END Review: monetization -->
```

Idempotent rewrite: Read `steps.md`, locate the block, Edit with `old_string` covering both markers + content, `new_string` is the rewritten block (markers included).

## Constraints

- Specific file paths and line numbers.
- Bullet lists ARE the output.
- Don't edit any file other than `steps.md`.
- Cross-segment finds: defer to the owning segment.
- Empty category → `- (no findings)`.
