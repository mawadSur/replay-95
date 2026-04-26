import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

export type ReplayUnlockableCategory =
  | "note_paper"
  | "profile_flair"
  | "room_decor"
  | "scene";

export type ReplayUnlockable = {
  accent: string;
  acquiredAt: string | null;
  category: ReplayUnlockableCategory;
  description: string;
  equipped: boolean;
  id: string;
  isQuestReward: boolean;
  name: string;
  owned: boolean;
  pogCost: number;
  slug: string;
  source: string | null;
};

export type ReplayBedroomState = {
  equipped: Partial<Record<ReplayUnlockableCategory, ReplayUnlockable>>;
  notePapers: ReplayUnlockable[];
  profileFlairs: ReplayUnlockable[];
  roomDecor: ReplayUnlockable[];
  scenes: ReplayUnlockable[];
};

type UnlockableRow = {
  category: ReplayUnlockableCategory;
  id: string;
  metadata: {
    accent?: string;
    description?: string;
  } | null;
  name: string;
  pog_cost: number;
  slug: string;
};

type InventoryRow = {
  acquired_at: string;
  source: string;
  unlockable_id: string;
};

type EquippedRow = {
  category: ReplayUnlockableCategory;
  unlockable_id: string;
};

type QuestRewardRow = {
  unlockable_name: string;
};

const unlockablesStateKey = (userId: string | undefined) => ["unlockables-state", userId];

const unlockableFallbacks: Record<
  string,
  {
    accent: string;
    description: string;
  }
> = {
  "arcade-token-jar": {
    accent: "#FFD36B",
    description: "A little trophy jar for the last cabinet you were irrationally loyal to.",
  },
  "basement-sleepover": {
    accent: "#7AC7FF",
    description: "Tube TV glow, checker rug, soda on the floor.",
  },
  "boombox-cassette-stack": {
    accent: "#9BFFAE",
    description: "A stacked cassette shrine for songs you almost taped clean off the radio.",
  },
  "glitter-sticker-frame": {
    accent: "#F4A7FF",
    description: "A louder profile frame with sticker-sheet energy and zero restraint.",
  },
  "lava-lamp-blue": {
    accent: "#7AC7FF",
    description: "A blue lava lamp that makes the whole room feel like cable after midnight.",
  },
  "lisa-frank-paper": {
    accent: "#FF6FD8",
    description: "Ultra-saturated note paper for people who never believed subtlety was a virtue.",
  },
  "mall-glow": {
    accent: "#FFCB69",
    description: "Food court neon leaks in through a fake palm-tree lamp.",
  },
  "mirror-ball-lights": {
    accent: "#C2B8FF",
    description: "Small string lights for the kind of bedroom that wanted to be a roller rink.",
  },
  "pogs-backing-paper": {
    accent: "#FFCB69",
    description: "Notes printed like the cardboard backs of your best slammer stack.",
  },
  "smiley-nameplate": {
    accent: "#FFD36B",
    description: "A cheerful profile flourish that feels one sticker sheet away from chaos.",
  },
  "sticker-blast": {
    accent: "#F4A7FF",
    description: "Sticker bombed mirror, glitter binder, cereal-box posters.",
  },
  "vhs-tower-lamp": {
    accent: "#FF8B7F",
    description: "A VHS stack repurposed into decor by somebody with questionable but admirable taste.",
  },
};

function mapUnlockable(
  unlockable: UnlockableRow,
  inventoryRow: InventoryRow | undefined,
  equippedIds: Set<string>,
  questRewardNames: Set<string>,
): ReplayUnlockable {
  const fallback = unlockableFallbacks[unlockable.slug];

  return {
    accent: unlockable.metadata?.accent ?? fallback?.accent ?? "#7AC7FF",
    acquiredAt: inventoryRow?.acquired_at ?? null,
    category: unlockable.category,
    description:
      unlockable.metadata?.description ?? fallback?.description ?? "Collectible Replay '95 item.",
    equipped: equippedIds.has(unlockable.id),
    id: unlockable.id,
    isQuestReward: questRewardNames.has(unlockable.name),
    name: unlockable.name,
    owned: Boolean(inventoryRow),
    pogCost: unlockable.pog_cost,
    slug: unlockable.slug,
    source: inventoryRow?.source ?? null,
  };
}

function sortUnlockables(items: ReplayUnlockable[]) {
  return [...items].sort((left, right) => {
    if (left.owned !== right.owned) {
      return left.owned ? -1 : 1;
    }

    if (left.pogCost !== right.pogCost) {
      return left.pogCost - right.pogCost;
    }

    return left.name.localeCompare(right.name);
  });
}

export function useBedroomState(userId: string | undefined) {
  return useQuery({
    queryKey: unlockablesStateKey(userId),
    enabled: Boolean(userId),
    queryFn: async (): Promise<ReplayBedroomState> => {
      const [unlockablesResult, inventoryResult, equippedResult, questRewardsResult] =
        await Promise.all([
          supabase
            .from("unlockables")
            .select("id, slug, name, category, pog_cost, metadata")
            .order("created_at", { ascending: true }),
          supabase
            .from("inventory_items")
            .select("unlockable_id, source, acquired_at")
            .eq("user_id", userId!),
          supabase
            .from("equipped_unlockables")
            .select("category, unlockable_id")
            .eq("user_id", userId!),
          supabase.from("quests").select("unlockable_name").eq("is_published", true),
        ]);

      if (unlockablesResult.error) {
        throw unlockablesResult.error;
      }
      if (inventoryResult.error) {
        throw inventoryResult.error;
      }
      if (equippedResult.error) {
        throw equippedResult.error;
      }
      if (questRewardsResult.error) {
        throw questRewardsResult.error;
      }

      const unlockables = (unlockablesResult.data ?? []) as UnlockableRow[];
      const inventory = (inventoryResult.data ?? []) as InventoryRow[];
      const equipped = (equippedResult.data ?? []) as EquippedRow[];
      const questRewards = (questRewardsResult.data ?? []) as QuestRewardRow[];
      const inventoryMap = new Map(inventory.map((item) => [item.unlockable_id, item]));
      const equippedIds = new Set(equipped.map((item) => item.unlockable_id));
      const questRewardNames = new Set(questRewards.map((item) => item.unlockable_name));
      const allItems = unlockables.map((unlockable) =>
        mapUnlockable(
          unlockable,
          inventoryMap.get(unlockable.id),
          equippedIds,
          questRewardNames,
        ),
      );

      const equippedByCategory = equipped.reduce<
        Partial<Record<ReplayUnlockableCategory, ReplayUnlockable>>
      >((current, item) => {
        const match = allItems.find((unlockable) => unlockable.id === item.unlockable_id);
        if (match) {
          current[item.category] = match;
        }
        return current;
      }, {});

      return {
        equipped: equippedByCategory,
        notePapers: sortUnlockables(
          allItems.filter((item) => item.category === "note_paper"),
        ),
        profileFlairs: sortUnlockables(
          allItems.filter((item) => item.category === "profile_flair"),
        ),
        roomDecor: sortUnlockables(
          allItems.filter((item) => item.category === "room_decor"),
        ),
        scenes: sortUnlockables(allItems.filter((item) => item.category === "scene")),
      };
    },
    initialData: {
      equipped: {},
      notePapers: [],
      profileFlairs: [],
      roomDecor: [],
      scenes: [],
    } satisfies ReplayBedroomState,
  });
}

type UnlockableMutationResult = {
  walletBalance?: number;
} | null;

function applyWalletBalanceToViewer(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string | undefined,
  data: UnlockableMutationResult,
) {
  if (!userId || !data || typeof data.walletBalance !== "number") {
    return;
  }

  queryClient.setQueryData(["viewer", userId], (old: unknown) => {
    if (!old || typeof old !== "object") {
      return old;
    }
    return { ...(old as Record<string, unknown>), walletBalance: data.walletBalance };
  });
}

export function usePurchaseUnlockable(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (unlockableId: string) => {
      if (!userId) {
        throw new Error("You need to sign in before purchasing an unlockable.");
      }

      const { data, error } = await supabase.rpc("purchase_unlockable", {
        p_unlockable_id: unlockableId,
      });

      if (error) {
        throw error;
      }

      return data as UnlockableMutationResult;
    },
    onSuccess: async (data) => {
      // Push walletBalance from the RPC into the viewer cache so the pog count updates instantly.
      applyWalletBalanceToViewer(queryClient, userId, data);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: unlockablesStateKey(userId) }),
        queryClient.invalidateQueries({ queryKey: ["viewer", userId] }),
      ]);
    },
  });
}

export function useEquipUnlockable(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (unlockableId: string) => {
      if (!userId) {
        throw new Error("You need to sign in before equipping an unlockable.");
      }

      const { data, error } = await supabase.rpc("equip_unlockable", {
        p_unlockable_id: unlockableId,
      });

      if (error) {
        throw error;
      }

      return data as UnlockableMutationResult;
    },
    onMutate: async (unlockableId: string) => {
      // Optimistically flip equipped.<category> locally; snapshot for rollback in onError.
      await queryClient.cancelQueries({ queryKey: unlockablesStateKey(userId) });
      const previous = queryClient.getQueryData<ReplayBedroomState>(
        unlockablesStateKey(userId),
      );

      if (previous) {
        const allItems = [
          ...previous.scenes,
          ...previous.roomDecor,
          ...previous.profileFlairs,
          ...previous.notePapers,
        ];
        const target = allItems.find((item) => item.id === unlockableId);

        if (target && target.owned) {
          const flipCategory = (items: ReplayUnlockable[]) =>
            items.map((item) => {
              if (item.category !== target.category) {
                return item;
              }
              return { ...item, equipped: item.id === unlockableId };
            });

          const next: ReplayBedroomState = {
            equipped: {
              ...previous.equipped,
              [target.category]: { ...target, equipped: true },
            },
            notePapers: flipCategory(previous.notePapers),
            profileFlairs: flipCategory(previous.profileFlairs),
            roomDecor: flipCategory(previous.roomDecor),
            scenes: flipCategory(previous.scenes),
          };

          queryClient.setQueryData(unlockablesStateKey(userId), next);
        }
      }

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(unlockablesStateKey(userId), context.previous);
      }
    },
    onSuccess: async (data) => {
      applyWalletBalanceToViewer(queryClient, userId, data);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: unlockablesStateKey(userId) });
    },
  });
}
