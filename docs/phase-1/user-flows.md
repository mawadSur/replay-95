# Replay '95 Core User Flows

Last updated: 2026-04-23

## 1. Onboarding Flow

### Goal

Create a usable nostalgia profile in under three minutes and land the user in Tonight with enough data to personalize the first episode.

### Flow

1. User opens the app for the first time.
2. App shows welcome screen with beta cohort framing and `18+` confirmation.
3. User signs in or signs up.
4. User enters profile basics: display name, hometown, birth year.
5. User selects taste anchors: console, mall store, TV block, music mood.
6. User answers the dream concert prompt.
7. User builds the yearbook avatar.
8. User chooses notification timing and grants push permission if willing.
9. App creates `profiles`, `avatar_choices`, `pog_wallets`, and `notification_preferences`.
10. User lands in `Tonight`.

### Empty And Error States

- If push permission is denied, onboarding still completes.
- If the birth year is outside `1980-1995`, show beta mismatch messaging and stop entry.
- If profile save fails, keep the user on the current step with local state preserved.

### Success State

- onboarding marked complete
- first episode ready to view
- starting pog balance granted

## 2. Nightly Episode Flow

### Goal

Make one nightly visit feel curated, fast, and reflective.

### Trigger

- push notification at the user's preferred local time
- manual open through the `Tonight` tab

### Flow

1. User opens `Tonight`.
2. Hero card shows the current episode title, subtitle, note allowance, and pog balance.
3. User scans the montage tags and episode framing.
4. User reads three prompt cards.
5. User writes a text response or records a voice response once enabled.
6. User saves the response.
7. App marks the episode as completed for the day.
8. User optionally continues to Notes or Quests.

### Empty And Error States

- Before unlock time: show countdown and teaser copy.
- No network: show the last cached published episode.
- Save failure: keep the draft locally and retry.
- Voice upload failure: keep the local recording until retry or discard.

### Success State

- response saved
- journal/history state updated
- daily reward, if any, granted once

## 3. Notes Flow

### Goal

Let approved friends exchange low-pressure messages without creating an always-on chat loop.

### Preconditions

- at least one accepted friendship
- user still has free-tier or paid note allowance

### Flow

1. User opens `Notes`.
2. Inbox shows delivered and in-transit notes.
3. User taps `Compose`.
4. User selects an approved friend.
5. User picks a paper style.
6. User writes up to 140 characters.
7. User picks a delivery window preset.
8. App creates a queued note.
9. Recipient sees the note arrive after the scheduled delay.
10. Recipient can read, reply, block, or report.

### Empty And Error States

- No friends yet: show invite-code CTA instead of composer.
- No note allowance left: show paywall or reset timing.
- Recipient blocked: prevent send and explain why.

### Success State

- note enters queued state
- sender sees delivery estimate
- recipient gets a delayed arrival state, not instant chat

## 4. Quests Flow

### Goal

Create a weekend progression loop that gives the user a reason to come back without replacing the nightly ritual.

### Flow

1. User opens `Quests`.
2. App shows current wallet balance and active quest cards.
3. User opens a quest or expands it inline.
4. User completes the three lightweight steps.
5. User taps `Claim reward`.
6. App writes `quest_completions`, awards pogs, and grants any quest-locked item.
7. User sees the related bedroom/profile item become available.

### Empty And Error States

- No active quest weekend: show teaser for the next quest drop.
- Reward already claimed: show claimed state and keep the quest readable.
- Grant failure: keep the quest in completed-but-unclaimed state until retry succeeds.

### Success State

- quest completion saved
- pog wallet updated
- unlockable added to inventory when relevant

## 5. Unlockables Flow

### Goal

Make rewards feel tactile and personal by turning pogs and quest prizes into visible room or profile changes.

### Flow

1. User earns pogs from a nightly action or quest.
2. User opens `Bedroom` or an unlockable detail screen from `Quests`.
3. User sees locked, owned, and equipped states.
4. User buys a store unlockable with pogs or claims a quest-exclusive item.
5. App writes `inventory_items` and updates wallet balance if a purchase occurred.
6. User equips the item or scene.
7. Bedroom screen updates immediately.

### Empty And Error States

- insufficient pogs
- quest-exclusive item not yet earned
- inventory write failure

### Success State

- item appears in inventory
- equipment state persists across sessions
- bedroom/profile reflects the change immediately

## Flow Priorities For Build Order

1. Onboarding
2. Nightly episode
3. Quests and unlockables
4. Notes

This order matches the core retention loop and the existing prototype emphasis.
