import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { trackBetaEvent } from "@/features/analytics/analytics-service";
import { supabase } from "@/lib/supabase";

export type ReplayQuestStep = {
  completed: boolean;
  completedAt: string | null;
  id: string;
  order: number;
  promptText: string;
  responseText: string;
};

export type ReplayQuest = {
  claimable: boolean;
  completedSteps: number;
  id: string;
  isComplete: boolean;
  rewardClaimed: boolean;
  rewardClaimedAt: string | null;
  rewardPogs: number;
  slug: string;
  steps: ReplayQuestStep[];
  title: string;
  totalSteps: number;
  unlockableId: string | null;
  unlockableName: string;
  unlockableSlug: string;
  weekend: string;
};

type QuestRow = {
  id: string;
  reward_pogs: number;
  slug: string;
  title: string;
  unlockable_id: string | null;
  unlockable_name: string;
  weekend_label: string;
};

type QuestStepRow = {
  id: string;
  prompt_text: string;
  quest_id: string;
  step_order: number;
};

type QuestCompletionRow = {
  completed_at: string;
  quest_id: string;
  reward_claimed_at: string | null;
};

type QuestStepResponseRow = {
  completed_at: string;
  quest_id: string;
  quest_step_id: string;
  response_text: string;
};

type UnlockableRow = {
  id: string;
  name: string;
  slug: string;
};

export type ClaimQuestRewardResult = {
  unlockableId: string | null;
  unlockableName: string | null;
  [key: string]: unknown;
};

const activeQuestsKey = (userId: string | undefined) => ["active-quests", userId];

function buildQuestState(
  quest: QuestRow,
  questSteps: QuestStepRow[],
  responses: QuestStepResponseRow[],
  completion: QuestCompletionRow | undefined,
  unlockableSlug: string,
): ReplayQuest {
  const steps = questSteps
    .filter((step) => step.quest_id === quest.id)
    .map((step) => {
      const response = responses.find((item) => item.quest_step_id === step.id);

      return {
        completed: Boolean(response),
        completedAt: response?.completed_at ?? null,
        id: step.id,
        order: step.step_order,
        promptText: step.prompt_text,
        responseText: response?.response_text ?? "",
      };
    });

  const completedSteps = steps.filter((step) => step.completed).length;
  const totalSteps = steps.length;
  const isComplete = completedSteps >= totalSteps && totalSteps > 0;
  const rewardClaimed = Boolean(completion?.reward_claimed_at);

  return {
    claimable: isComplete && !rewardClaimed,
    completedSteps,
    id: quest.id,
    isComplete,
    rewardClaimed,
    rewardClaimedAt: completion?.reward_claimed_at ?? null,
    rewardPogs: quest.reward_pogs,
    slug: quest.slug,
    steps,
    title: quest.title,
    totalSteps,
    unlockableId: quest.unlockable_id ?? null,
    unlockableName: quest.unlockable_name,
    unlockableSlug,
    weekend: quest.weekend_label,
  };
}

export function useActiveQuests(userId: string | undefined) {
  return useQuery({
    queryKey: activeQuestsKey(userId),
    enabled: Boolean(userId),
    queryFn: async (): Promise<ReplayQuest[]> => {
      const now = new Date().toISOString();
      const { data: quests, error: questError } = await supabase
        .from("quests")
        .select("id, slug, title, weekend_label, reward_pogs, unlockable_id, unlockable_name")
        .eq("is_published", true)
        .lte("active_from", now)
        .gte("active_to", now)
        .order("active_from", { ascending: true });

      if (questError) {
        throw questError;
      }

      const questRows = (quests ?? []) as QuestRow[];
      if (questRows.length === 0) {
        return [];
      }

      const questIds = questRows.map((quest) => quest.id);
      const unlockableNames = questRows.map((quest) => quest.unlockable_name);

      const [stepsResult, completionResult, responseResult, unlockablesResult] =
        await Promise.all([
          supabase
            .from("quest_steps")
            .select("id, quest_id, prompt_text, step_order")
            .in("quest_id", questIds)
            .order("step_order", { ascending: true }),
          supabase
            .from("quest_completions")
            .select("quest_id, completed_at, reward_claimed_at")
            .eq("user_id", userId!)
            .in("quest_id", questIds),
          supabase
            .from("quest_step_responses")
            .select("quest_id, quest_step_id, response_text, completed_at")
            .eq("user_id", userId!)
            .in("quest_id", questIds),
          supabase.from("unlockables").select("id, name, slug").in("name", unlockableNames),
        ]);

      if (stepsResult.error) {
        throw stepsResult.error;
      }
      if (completionResult.error) {
        throw completionResult.error;
      }
      if (responseResult.error) {
        throw responseResult.error;
      }
      if (unlockablesResult.error) {
        throw unlockablesResult.error;
      }

      const questSteps = (stepsResult.data ?? []) as QuestStepRow[];
      const completions = (completionResult.data ?? []) as QuestCompletionRow[];
      const responses = (responseResult.data ?? []) as QuestStepResponseRow[];
      const unlockables = (unlockablesResult.data ?? []) as UnlockableRow[];
      const completionMap = new Map(completions.map((item) => [item.quest_id, item]));
      const unlockableByIdMap = new Map(unlockables.map((item) => [item.id, item.slug]));
      const unlockableByNameMap = new Map(unlockables.map((item) => [item.name, item.slug]));

      return questRows.map((quest) => {
        const slugFromId = quest.unlockable_id
          ? unlockableByIdMap.get(quest.unlockable_id)
          : undefined;
        const slugFromName = unlockableByNameMap.get(quest.unlockable_name);
        const unlockableSlug =
          slugFromId ??
          slugFromName ??
          quest.unlockable_name.toLowerCase().replace(/\s+/g, "-");

        return buildQuestState(
          quest,
          questSteps,
          responses.filter((response) => response.quest_id === quest.id),
          completionMap.get(quest.id),
          unlockableSlug,
        );
      });
    },
  });
}

export function useSaveQuestStepResponse(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      questId,
      questStepId,
      responseText,
    }: {
      questId: string;
      questStepId: string;
      responseText: string;
    }) => {
      if (!userId) {
        throw new Error("You need to sign in before saving quest progress.");
      }

      const { data, error } = await supabase.rpc("save_quest_step_response", {
        p_quest_id: questId,
        p_quest_step_id: questStepId,
        p_response_text: responseText,
      });

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: activeQuestsKey(userId) });
    },
  });
}

export function useClaimQuestReward(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (questId: string) => {
      if (!userId) {
        throw new Error("You need to sign in before claiming a quest.");
      }

      const { data, error } = await supabase.rpc("claim_quest_reward", {
        p_quest_id: questId,
      });

      if (error) {
        throw error;
      }

      return data as ClaimQuestRewardResult | null;
    },
    onSuccess: async (_result, questId) => {
      await trackBetaEvent({
        eventName: "quest_reward_claimed",
        dedupeKey: questId,
        metadata: {
          questId,
        },
      }).catch(() => undefined);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: activeQuestsKey(userId) }),
        queryClient.invalidateQueries({ queryKey: ["viewer"] }),
        queryClient.invalidateQueries({ queryKey: ["unlockables-state", userId] }),
        queryClient.invalidateQueries({ queryKey: ["beta-dashboard", userId] }),
      ]);
    },
  });
}
