import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "@/components/primary-button";
import { RetroScreen } from "@/components/retro-screen";
import { SurfaceCard } from "@/components/surface-card";
import { useActiveQuests } from "@/features/quests/quest-service";
import { useReplayApp } from "@/state/replay-context";
import { tokens } from "@/theme/tokens";

function formatProgressLabel(completed: number, total: number) {
  if (total <= 0) {
    return "No steps yet";
  }

  return `${completed}/${total} steps`;
}

export default function QuestsScreen() {
  const router = useRouter();
  const { pogs, session } = useReplayApp();
  const questsQuery = useActiveQuests(session?.user.id);
  const errorText =
    questsQuery.error instanceof Error ? questsQuery.error.message : "";
  const quests = questsQuery.data ?? [];

  return (
    <RetroScreen
      eyebrow="Weekend progression"
      title="Quests, rewards, and the little pog economy"
      subtitle="Step-by-step weekend prompts that pay out pogs and unlockables you can equip in your room."
    >
      <SurfaceCard style={styles.walletCard}>
        <View style={styles.walletHeader}>
          <View style={styles.walletCopy}>
            <Text style={styles.walletLabel}>Pog wallet</Text>
            <Text style={styles.walletValue}>{pogs}</Text>
          </View>
          <View style={styles.walletBadge}>
            <Text style={styles.walletBadgeText}>{quests.length} live quests</Text>
          </View>
        </View>
        <Text style={styles.walletBody}>
          Weekend quests pay out pogs and unlockables. Store items live in Bedroom so the reward loop stays visible.
        </Text>
      </SurfaceCard>

      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

      {quests.length ? (
        <View style={styles.questColumn}>
          {quests.map((quest) => (
            <Pressable
              key={quest.id}
              onPress={() =>
                router.push({
                  pathname: "/quests/[id]",
                  params: { id: quest.id },
                })
              }
              style={({ pressed }) => [
                styles.questPressable,
                pressed ? styles.questPressablePressed : null,
              ]}
            >
              <SurfaceCard style={styles.questCard}>
                <View style={styles.questHeader}>
                  <View style={styles.questTitleWrap}>
                    <Text style={styles.weekend}>{quest.weekend}</Text>
                    <Text style={styles.questTitle}>{quest.title}</Text>
                  </View>
                  <View style={styles.rewardPill}>
                    <Text style={styles.rewardText}>+{quest.rewardPogs} pogs</Text>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <View style={styles.metaPill}>
                    <Text style={styles.metaLabel}>
                      {formatProgressLabel(quest.completedSteps, quest.totalSteps)}
                    </Text>
                  </View>
                  <View style={styles.metaPill}>
                    <Text style={styles.metaLabel}>
                      {quest.rewardClaimed
                        ? "Reward claimed"
                        : quest.claimable
                          ? "Ready to claim"
                          : "In progress"}
                    </Text>
                  </View>
                </View>

                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${
                          quest.totalSteps > 0
                            ? Math.max(
                                8,
                                Math.round((quest.completedSteps / quest.totalSteps) * 100),
                              )
                            : 0
                        }%`,
                      },
                    ]}
                  />
                </View>

                <View style={styles.previewColumn}>
                  {quest.steps.map((step) => (
                    <View key={step.id} style={styles.stepPreviewRow}>
                      <Text
                        accessibilityLabel={step.completed ? "Completed" : "Not started"}
                        style={[
                          styles.stepPreviewIcon,
                          step.completed
                            ? styles.stepPreviewIconDone
                            : styles.stepPreviewIconPending,
                        ]}
                      >
                        {step.completed ? "✓" : "○"}
                      </Text>
                      <Text style={styles.stepPreview}>{step.promptText}</Text>
                    </View>
                  ))}
                </View>

                <Text style={styles.unlockable}>Unlocks: {quest.unlockableName}</Text>
                <PrimaryButton
                  label={quest.rewardClaimed ? "Open quest" : "Continue quest"}
                  onPress={() =>
                    router.push({
                      pathname: "/quests/[id]",
                      params: { id: quest.id },
                    })
                  }
                  variant={quest.rewardClaimed ? "secondary" : "primary"}
                />
              </SurfaceCard>
            </Pressable>
          ))}
        </View>
      ) : (
        <SurfaceCard style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No live quest weekend</Text>
          <Text style={styles.emptyCopy}>
            No quests are live this weekend. New ones drop here as soon as the window opens.
          </Text>
        </SurfaceCard>
      )}
    </RetroScreen>
  );
}

const styles = StyleSheet.create({
  walletCard: {
    gap: tokens.spacing.md,
  },
  walletHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: tokens.spacing.md,
  },
  walletCopy: {
    gap: tokens.spacing.xs,
  },
  walletLabel: {
    color: tokens.colors.accentGold,
    fontFamily: tokens.typography.label,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  walletValue: {
    color: tokens.colors.text,
    fontFamily: tokens.typography.display,
    fontSize: 42,
  },
  walletBadge: {
    alignSelf: "flex-start",
    borderRadius: tokens.radii.pill,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    backgroundColor: "rgba(122, 199, 255, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(122, 199, 255, 0.28)",
  },
  walletBadgeText: {
    color: tokens.colors.accentSky,
    fontFamily: tokens.typography.label,
    fontSize: 12,
  },
  walletBody: {
    color: tokens.colors.textMuted,
    fontFamily: tokens.typography.body,
    fontSize: 15,
    lineHeight: 22,
  },
  errorText: {
    color: tokens.colors.accentCoral,
    fontFamily: tokens.typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
  questColumn: {
    gap: tokens.spacing.md,
  },
  questPressable: {
    borderRadius: tokens.radii.lg,
  },
  questPressablePressed: {
    opacity: 0.96,
  },
  questCard: {
    gap: tokens.spacing.md,
  },
  questHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: tokens.spacing.md,
  },
  questTitleWrap: {
    flex: 1,
    gap: tokens.spacing.xs,
  },
  weekend: {
    color: tokens.colors.accentSky,
    fontFamily: tokens.typography.label,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  questTitle: {
    color: tokens.colors.text,
    fontFamily: tokens.typography.display,
    fontSize: 25,
  },
  rewardPill: {
    borderRadius: tokens.radii.pill,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    backgroundColor: "rgba(155,255,174,0.12)",
    borderWidth: 1,
    borderColor: "rgba(155,255,174,0.28)",
  },
  rewardText: {
    color: tokens.colors.accentMint,
    fontFamily: tokens.typography.label,
    fontSize: 13,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: tokens.spacing.sm,
  },
  metaPill: {
    borderRadius: tokens.radii.pill,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: tokens.colors.lineStrong,
  },
  metaLabel: {
    color: tokens.colors.textMuted,
    fontFamily: tokens.typography.label,
    fontSize: 12,
  },
  progressTrack: {
    height: 10,
    borderRadius: tokens.radii.pill,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  progressFill: {
    height: "100%",
    borderRadius: tokens.radii.pill,
    backgroundColor: tokens.colors.accentMint,
  },
  previewColumn: {
    gap: tokens.spacing.sm,
  },
  stepPreviewRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: tokens.spacing.sm,
  },
  stepPreviewIcon: {
    fontFamily: tokens.typography.label,
    fontSize: 15,
    lineHeight: 21,
    minWidth: 16,
  },
  stepPreviewIconDone: {
    color: tokens.colors.accentMint,
  },
  stepPreviewIconPending: {
    color: tokens.colors.textFaint,
  },
  stepPreview: {
    flex: 1,
    color: tokens.colors.textMuted,
    fontFamily: tokens.typography.body,
    fontSize: 15,
    lineHeight: 21,
  },
  unlockable: {
    color: tokens.colors.text,
    fontFamily: tokens.typography.label,
    fontSize: 13,
  },
  emptyCard: {
    gap: tokens.spacing.sm,
  },
  emptyTitle: {
    color: tokens.colors.text,
    fontFamily: tokens.typography.display,
    fontSize: 24,
  },
  emptyCopy: {
    color: tokens.colors.textMuted,
    fontFamily: tokens.typography.body,
    fontSize: 15,
    lineHeight: 22,
  },
});
