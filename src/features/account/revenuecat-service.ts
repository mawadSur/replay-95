import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Platform } from "react-native";
import Purchases, {
  type CustomerInfo,
  type PurchasesEntitlementInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from "react-native-purchases";

import { env } from "@/config/env";
import { reportError } from "@/lib/error-reporting";
import { supabase } from "@/lib/supabase";

import type { ReplayPlusState, ReplaySubscriptionStatus } from "./account-service";

// The entitlement identifier configured on the RevenueCat dashboard.
// Every Replay+ product (monthly + yearly) must grant this entitlement.
export const REPLAY_PLUS_ENTITLEMENT_ID = "replay_plus";

const offeringsKey = ["replay-plus", "offerings"] as const;

let isConfigured = false;
let configureFailed = false;

function pickApiKey(): string {
  return Platform.select({
    ios: env.revenueCatAppleApiKey,
    android: env.revenueCatGoogleApiKey,
    default: "",
  }) ?? "";
}

// Real RevenueCat keys begin with `appl_` (iOS) or `goog_` (Android).
// Anything else (empty, placeholder, malformed) disables purchases so a
// bad key can't crash the app at launch.
function isLikelyValidApiKey(key: string): boolean {
  if (Platform.OS === "ios") return key.startsWith("appl_");
  if (Platform.OS === "android") return key.startsWith("goog_");
  return false;
}

export function isPurchasesAvailable(): boolean {
  if (Platform.OS === "web") {
    return false;
  }
  if (configureFailed) {
    return false;
  }
  return isLikelyValidApiKey(pickApiKey());
}

export async function configurePurchases(appUserID?: string | null) {
  if (!isPurchasesAvailable()) {
    return;
  }

  const apiKey = pickApiKey();

  if (!isConfigured) {
    try {
      Purchases.configure({ apiKey, appUserID: appUserID ?? undefined });
      isConfigured = true;
    } catch (error) {
      configureFailed = true;
      reportError(error, { stage: "purchases.configure" });
    }
    return;
  }

  if (appUserID) {
    try {
      await Purchases.logIn(appUserID);
    } catch (error) {
      reportError(error, { stage: "purchases.logIn" });
    }
  }
}

export async function logOutPurchases() {
  if (!isPurchasesAvailable() || !isConfigured) {
    return;
  }
  try {
    await Purchases.logOut();
  } catch (error) {
    reportError(error, { stage: "purchases.logOut" });
  }
}

function entitlementToState(entitlement: PurchasesEntitlementInfo | undefined): {
  status: ReplaySubscriptionStatus;
  planCode: string | null;
  expiresAt: string | null;
} {
  if (!entitlement) {
    return { status: "free", planCode: null, expiresAt: null };
  }

  let status: ReplaySubscriptionStatus = "free";
  if (entitlement.isActive) {
    status = entitlement.periodType === "TRIAL" ? "trialing" : "active";
  } else if (entitlement.willRenew === false) {
    status = "canceled";
  }

  return {
    status,
    planCode: entitlement.productIdentifier ?? null,
    expiresAt: entitlement.expirationDate ?? null,
  };
}

export function readReplayPlusFromCustomerInfo(customerInfo: CustomerInfo) {
  const entitlement = customerInfo.entitlements.active[REPLAY_PLUS_ENTITLEMENT_ID]
    ?? customerInfo.entitlements.all[REPLAY_PLUS_ENTITLEMENT_ID];
  return entitlementToState(entitlement);
}

async function syncReplayPlusToSupabase(state: {
  status: ReplaySubscriptionStatus;
  planCode: string | null;
  expiresAt: string | null;
}): Promise<ReplayPlusState> {
  const { data, error } = await supabase.rpc("sync_replay_plus_from_purchase", {
    p_status: state.status,
    p_plan_code: state.planCode,
    p_expires_at: state.expiresAt,
    p_provider: "revenuecat",
  });

  if (error) {
    throw error;
  }

  return {
    expiresAt:
      typeof data?.expiresAt === "string" && data.expiresAt.length > 0 ? data.expiresAt : null,
    isPaid: Boolean(data?.isPaid),
    planCode: typeof data?.planCode === "string" ? data.planCode : null,
    provider: typeof data?.provider === "string" ? data.provider : null,
    status:
      data?.status === "trialing" ||
      data?.status === "active" ||
      data?.status === "past_due" ||
      data?.status === "canceled"
        ? data.status
        : "free",
  };
}

export type ReplayPlusOfferings = {
  monthly: PurchasesPackage | null;
  yearly: PurchasesPackage | null;
  current: PurchasesOffering | null;
};

async function fetchReplayPlusOfferings(): Promise<ReplayPlusOfferings> {
  if (!isPurchasesAvailable()) {
    return { monthly: null, yearly: null, current: null };
  }

  const offerings = await Purchases.getOfferings();
  const current = offerings.current ?? null;

  if (!current) {
    return { monthly: null, yearly: null, current: null };
  }

  return {
    monthly: current.monthly ?? null,
    yearly: current.annual ?? null,
    current,
  };
}

export function useReplayPlusOfferings() {
  return useQuery({
    queryKey: offeringsKey,
    queryFn: fetchReplayPlusOfferings,
    enabled: isPurchasesAvailable(),
    staleTime: 10 * 60 * 1000,
  });
}

export type ReplayPlusPlanType = "monthly" | "yearly";

export function usePurchaseReplayPlus(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation<ReplayPlusState, Error, ReplayPlusPlanType>({
    mutationFn: async (plan) => {
      if (!userId) {
        throw new Error("You need to sign in before subscribing.");
      }
      if (!isPurchasesAvailable()) {
        throw new Error("Purchases are only available on the iOS or Android build.");
      }

      const offerings = await fetchReplayPlusOfferings();
      const pkg = plan === "yearly" ? offerings.yearly : offerings.monthly;

      if (!pkg) {
        throw new Error(
          `RevenueCat hasn't published a ${plan} package yet. Try the other option, or restart the app.`,
        );
      }

      const result = await Purchases.purchasePackage(pkg);
      const next = readReplayPlusFromCustomerInfo(result.customerInfo);
      return syncReplayPlusToSupabase(next);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["replay-plus-state", userId] }),
        queryClient.invalidateQueries({ queryKey: ["viewer", userId] }),
        queryClient.invalidateQueries({ queryKey: ["note-compose-state", userId] }),
      ]);
    },
  });
}

export async function restoreReplayPlusFromStore(): Promise<ReplayPlusState | null> {
  if (!isPurchasesAvailable()) {
    return null;
  }

  const customerInfo = await Purchases.restorePurchases();
  const next = readReplayPlusFromCustomerInfo(customerInfo);
  return syncReplayPlusToSupabase(next);
}
