import { useEffect, useMemo, useState } from "react";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { PrimaryButton } from "@/components/primary-button";
import { RetroScreen } from "@/components/retro-screen";
import { SurfaceCard } from "@/components/surface-card";
import {
  useActiveQuests,
  useClaimQuestReward,
  useSaveQuestStepResponse,
} from "@/features/quests/quest-service";
import { useReplayApp } from "@/state/replay-context";
import { tokens } from "@/theme/tokens";

export default function QuestDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const { session } = useReplayApp();
  const questsQuery = useActiveQuests(session?.user.id);
  const saveStepMutation = useSaveQuestStepResponse(session?.user.id);
  const claimQuestMutation = useClaimQuestReward(session?.user.id);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [errorText, setErrorText] = useState("");

  const quest = useMemo(
    () => questsQuery.data?.find((item) => item.id === params.id) ?? null,
    [params.id, questsQuery.data],
  );

  useEffect(() => {
    if (!quest) {
      return;
    }

    setDrafts((prev) => {
      const next = { ...prev };
      for (const step of quest.steps) {
        if (!(step.id in next)) {
          next[step.id] = step.responseText ?? "";
        }
      }
      return next;
    });
  }, [quest]);

  if (!session) {
    return <Redirect href="/login" />;
  }

  const handleSaveStep = async (questStepId: string) => {
    if (!quest) {
      return;
    }

    setErrorText("");

    try {
      await saveStepMutation.mutateAsync({
        questId: quest.id,
        questStepId,
        responseText: drafts[questStepId] ?? "",
      });
    } catch (error) {
      setErrorText(
        error instanceof Error ? error.message : "Replay '95 couldn't save that quest step yet.",
      );
    }
  };

  const handleClaimReward = async () => {
    if (!quest) {
      return;
    }

    setErrorText("");

    try {
      await claimQuestMutation.mutateAsync(quest.id);
    } catch (error) {
      setErrorText(
        error instanceof Error ? error.message : "Replay '95 couldn't claim that reward yet.",
      );
    }
  };

  if (!quest) {
    return (
      <RetroScreen
        eyebrow="Weekend progression"
        title="That quest isn't here"
        subtitle="It may not be live for this account, or the hub hasn't refreshed yet."
      >
        <SurfaceCard style={styles.card}>
          <PrimaryButton label="Back to Quests" onPress={() => router.replace("/(tabs)/quests")} />
        </SurfaceCard>
      </RetroScreen>
    );
  }

  return (
    <RetroScreen
      eyebrow={quest.weekend}
      title={quest.title}
      subtitle="Each step saves its own response. Once all three are complete, the claim action awards pogs and unlocks the related collectible."
    >
      <SurfaceCard style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={styles.rewardPill}>
            <Text style={styles.rewardText}>+{quest.rewardPogs} pogs</Text>
          </View>
          <View style={styles.rewardPillSecondary}>
            <Text style={styles.rewardSecondaryText}>{quest.unlockableName}</Text>
          </View>
        </View>
        <Text style={styles.progressLabel}>
          Progress: {quest.completedSteps}/{quest.totalSteps} steps
        </Text>
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
      </SurfaceCard>

      <View style={styles.stepColumn}>
        {quest.steps.map((step) => {
          const draft = drafts[step.id] ?? "";

          return (
            <SurfaceCard key={step.id} style={styles.stepCard}>
              <View style={styles.stepHeader}>
                <Text style={styles.stepEyebrow}>Step {step.order}</Text>
                <Text style={styles.stepStatus}>
                  {step.completed ? "Saved" : "Not saved yet"}
                </Text>
              </View>
              <Text style={styles.stepPrompt}>{step.promptText}</Text>
              <TextInput
                maxLength={180}
                multiline
                onChangeText={(value) =>
                  setDrafts((current) => ({
                    ...current,
                    [step.id]: value,
                  }))
                }
                placeholder="Write the small memory that gets this step over the line."
                placeholderTextColor={tokens.colors.textFaint}
                style={styles.textArea}
                textAlignVertical="top"
                value={draft}
              />
              <View style={styles.stepFooter}>
                <Text style={styles.counter}>{180 - draft.length} chars left</Text>
                <PrimaryButton
                  label={
                    saveStepMutation.isPending ? "Saving..." : step.completed ? "Update step" : "Save step"
                  }
                  onPress={() => {
                    void handleSaveStep(step.id);
                  }}
                  disabled={!draft.trim() || saveStepMutation.isPending}
                  variant={step.completed ? "secondary" : "primary"}
                />
              </View>
            </SurfaceCard>
          );
        })}
      </View>

      <SurfaceCard style={styles.claimCard}>
        <Text style={styles.claimTitle}>Reward state</Text>
        <Text style={styles.claimCopy}>
          {quest.rewardClaimed
            ? "Reward already claimed. The pogs are in your wallet and the unlockable is now in Bedroom."
            : quest.claimable
              ? "All three steps are complete. Claiming will grant the pogs and add the unlockable to inventory."
              : "Finish each step first. Claim stays locked until the full set is saved."}
        </Text>
        <PrimaryButton
          label={
            quest.rewardClaimed
              ? "Reward claimed"
              : claimQuestMutation.isPending
                ? "Claiming..."
                : "Claim reward"
          }
          onPress={() => {
            void handleClaimReward();
          }}
          disabled={!quest.claimable || quest.rewardClaimed || claimQuestMutation.isPending}
          variant={quest.rewardClaimed ? "secondary" : "primary"}
        />
        <PrimaryButton
          label="Back to Quests"
          onPress={() => router.back()}
          variant="secondary"
        />
      </SurfaceCard>

      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
    </RetroScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: tokens.spacing.md,
  },
  heroCard: {
    gap: tokens.spacing.md,
  },
  heroHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: tokens.spacing.sm,
  },
  rewardPill: {
    borderRadius: tokens.radii.pill,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    backgroundColor: "rgba(155,255,174,0.12)",
    borderWidth: 1,
    borderColor: "rgba(155,255,174,0.28)",
  },
  rewardPillSecondary: {
    borderRadius: tokens.radii.pill,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    backgroundColor: "rgba(122, 199, 255, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(122, 199, 255, 0.24)",
  },
  rewardText: {
    color: tokens.colors.accentMint,
    fontFamily: tokens.typography.label,
    fontSize: 13,
  },
  rewardSecondaryText: {
    color: tokens.colors.accentSky,
    fontFamily: tokens.typography.label,
    fontSize: 13,
  },
  progressLabel: {
    color: tokens.colors.text,
    fontFamily: tokens.typography.label,
    fontSize: 13,
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
  stepColumn: {
    gap: tokens.spacing.md,
  },
  stepCard: {
    gap: tokens.spacing.md,
  },
  stepHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: tokens.spacing.md,
  },
  stepEyebrow: {
    color: tokens.colors.accentGold,
    fontFamily: tokens.typography.label,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  stepStatus: {
    color: tokens.colors.textFaint,
    fontFamily: tokens.typography.label,
    fontSize: 12,
  },
  stepPrompt: {
    color: tokens.colors.text,
    fontFamily: tokens.typography.display,
    fontSize: 24,
    lineHeight: 28,
  },
  textArea: {
    minHeight: 120,
    borderRadius: tokens.radii.md,
    borderWidth: 1,
    borderColor: tokens.colors.lineStrong,
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.md,
    color: tokens.colors.text,
    fontFamily: tokens.typography.body,
    fontSize: 16,
  },
  stepFooter: {
    gap: tokens.spacing.sm,
  },
  counter: {
    color: tokens.colors.textFaint,
    fontFamily: tokens.typography.label,
    fontSize: 12,
  },
  claimCard: {
    gap: tokens.spacing.md,
  },
  claimTitle: {
    color: tokens.colors.text,
    fontFamily: tokens.typography.display,
    fontSize: 24,
  },
  claimCopy: {
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
});
