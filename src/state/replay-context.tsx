import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import {
  configurePurchases,
  logOutPurchases,
} from "@/features/account/revenuecat-service";
import {
  hydrateSessionFromUrl,
  requestMagicLink as requestMagicLinkWithSupabase,
} from "@/features/auth/auth-service";
import {
  STARTING_POG_BALANCE,
  fetchViewerState,
  saveOnboardingProfile,
} from "@/features/profile/profile-service";
import {
  buildDefaultNotificationTime,
  resolveDeviceTimezone,
} from "@/features/profile/profile-personalization";
import {
  clearNightlyMemoryNotifications,
  syncNightlyMemoryNotifications,
} from "@/features/memory/memory-notification-service";
import { trackBetaEvent } from "@/features/analytics/analytics-service";
import { supabase } from "@/lib/supabase";
import type {
  AvatarChoice,
  NotificationPreferences,
  ReplayProfile,
} from "@/types/replay";

type ReplayContextValue = {
  isBootstrapping: boolean;
  session: Session | null;
  hasCompletedOnboarding: boolean;
  draftProfile: ReplayProfile;
  notificationDraft: NotificationPreferences;
  profile: ReplayProfile | null;
  pogs: number;
  isSavingOnboarding: boolean;
  authCallbackError: string | null;
  updateDraftProfile: (patch: Partial<ReplayProfile>) => void;
  updateAvatar: (patch: Partial<AvatarChoice>) => void;
  updateNotificationDraft: (patch: Partial<NotificationPreferences>) => void;
  completeOnboarding: () => Promise<void>;
  requestMagicLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearAuthCallbackError: () => void;
};

export const initialDraftProfile: ReplayProfile = {
  name: "",
  hometown: "",
  birthYear: Number.NaN,
  consoleChoice: "",
  mallStore: "",
  channelBlock: "",
  dreamConcert: "",
  musicMood: "",
  avatar: {
    outfit: "",
    trapperPattern: "",
    braceletColor: "",
  },
};

export function isDraftProfileBlank(draft: ReplayProfile) {
  return (
    draft.name === "" &&
    draft.hometown === "" &&
    Number.isNaN(draft.birthYear) &&
    draft.consoleChoice === "" &&
    draft.mallStore === "" &&
    draft.channelBlock === "" &&
    draft.dreamConcert === "" &&
    draft.musicMood === "" &&
    draft.avatar.outfit === "" &&
    draft.avatar.trapperPattern === "" &&
    draft.avatar.braceletColor === ""
  );
}

const initialNotificationDraft: NotificationPreferences = {
  timezone: resolveDeviceTimezone(),
  nightlyDeliveryTime: buildDefaultNotificationTime(),
  dailyEnabled: true,
  weekendQuestEnabled: true,
};

const ReplayContext = createContext<ReplayContextValue | null>(null);

export function ReplayAppProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [draftProfile, setDraftProfile] = useState(initialDraftProfile);
  const [notificationDraft, setNotificationDraft] = useState(initialNotificationDraft);
  const [pogs, setPogs] = useState(STARTING_POG_BALANCE);
  const [authCallbackError, setAuthCallbackError] = useState<string | null>(null);
  const previousUserIdRef = useRef<string | null>(null);
  const hasObservedWalletRef = useRef(false);

  const viewerQuery = useQuery({
    queryKey: ["viewer", session?.user.id],
    enabled: Boolean(session?.user.id),
    queryFn: async () => fetchViewerState(session!.user.id),
  });

  const onboardingMutation = useMutation({
    mutationFn: async ({
      notificationDraft: nextNotificationDraft,
      profileDraft,
    }: {
      notificationDraft: NotificationPreferences;
      profileDraft: ReplayProfile;
    }) => {
      if (!session?.user.id) {
        throw new Error("You need to sign in before onboarding can be saved.");
      }

      return saveOnboardingProfile(session.user.id, profileDraft, nextNotificationDraft);
    },
    onSuccess: (viewer) => {
      if (!session?.user.id) {
        return;
      }

      queryClient.setQueryData(["viewer", session.user.id], viewer);
    },
  });

  useEffect(() => {
    let isMounted = true;

    const bootstrapSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!isMounted) {
        return;
      }

      if (error) {
        setSession(null);
        setIsSessionReady(true);
        return;
      }

      setSession(data.session ?? null);
      setIsSessionReady(true);
    };

    void bootstrapSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);

      if (nextSession?.user.id) {
        setAuthCallbackError(null);
        void queryClient.invalidateQueries({ queryKey: ["viewer", nextSession.user.id] });
        return;
      }

      queryClient.removeQueries({ queryKey: ["viewer"] });
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [queryClient]);

  useEffect(() => {
    let isMounted = true;

    const describeHydrateError = (error: unknown) => {
      if (error instanceof Error && error.message) {
        return error.message;
      }
      return "We couldn't open that sign-in link. Request a new one.";
    };

    const syncInitialUrl = async () => {
      const url = await Linking.getInitialURL();
      if (!isMounted || !url) {
        return;
      }

      try {
        await hydrateSessionFromUrl(url);
      } catch (error) {
        console.warn("Replay '95 auth callback failed to hydrate.", error);
        if (isMounted) {
          setAuthCallbackError(describeHydrateError(error));
        }
      }
    };

    void syncInitialUrl();

    const subscription = Linking.addEventListener("url", ({ url }) => {
      void hydrateSessionFromUrl(url).catch((error) => {
        console.warn("Replay '95 auth callback failed to hydrate.", error);
        setAuthCallbackError(describeHydrateError(error));
      });
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const nextUserId = session?.user.id ?? null;
    const previousUserId = previousUserIdRef.current;

    // Only reset drafts on a real account swap (both ids present and different).
    // Token refreshes re-emit `onAuthStateChange` with the same user id, and
    // initial sign-in goes from null -> id, neither of which should clobber drafts.
    if (previousUserId && nextUserId && previousUserId !== nextUserId) {
      setDraftProfile(initialDraftProfile);
      setNotificationDraft(initialNotificationDraft);
      hasObservedWalletRef.current = false;
    }

    if (!nextUserId) {
      hasObservedWalletRef.current = false;
      void logOutPurchases();
    } else if (previousUserId !== nextUserId) {
      void configurePurchases(nextUserId);
    }

    previousUserIdRef.current = nextUserId;
  }, [session?.user.id]);

  useEffect(() => {
    const viewer = viewerQuery.data;

    if (!viewer) {
      // Only seed the starting balance if we have never observed a real wallet
      // for this session, so we don't clobber a previously-fetched balance.
      if (!hasObservedWalletRef.current) {
        setPogs(STARTING_POG_BALANCE);
      }
      return;
    }

    setDraftProfile(viewer.profile);
    setNotificationDraft(viewer.notificationPreferences);

    if (viewer.walletBalance != null) {
      setPogs(viewer.walletBalance);
      hasObservedWalletRef.current = true;
    } else if (!hasObservedWalletRef.current) {
      setPogs(STARTING_POG_BALANCE);
    }
  }, [viewerQuery.data]);

  useEffect(() => {
    if (!session?.user.id) {
      void clearNightlyMemoryNotifications().catch((error) => {
        console.warn("Replay '95 could not clear nightly notifications.", error);
      });
      return;
    }

    if (!viewerQuery.data?.profile) {
      return;
    }

    void syncNightlyMemoryNotifications(notificationDraft).catch((error) => {
      console.warn("Replay '95 could not sync nightly notifications.", error);
    });
  }, [
    notificationDraft.dailyEnabled,
    notificationDraft.nightlyDeliveryTime,
    notificationDraft.timezone,
    session?.user.id,
    viewerQuery.data?.profile,
  ]);

  const updateDraftProfile = (patch: Partial<ReplayProfile>) => {
    setDraftProfile((current) => ({ ...current, ...patch }));
  };

  const updateAvatar = (patch: Partial<AvatarChoice>) => {
    setDraftProfile((current) => ({
      ...current,
      avatar: { ...current.avatar, ...patch },
    }));
  };

  const updateNotificationDraft = (patch: Partial<NotificationPreferences>) => {
    setNotificationDraft((current) => ({ ...current, ...patch }));
  };

  const completeOnboarding = async () => {
    await onboardingMutation.mutateAsync({
      notificationDraft,
      profileDraft: draftProfile,
    });

    void trackBetaEvent({
      eventName: "onboarding_completed",
      dedupeKey: session?.user.id ?? "onboarding",
      metadata: {
        birthYear: draftProfile.birthYear,
        channelBlock: draftProfile.channelBlock,
        consoleChoice: draftProfile.consoleChoice,
        mallStore: draftProfile.mallStore,
        musicMood: draftProfile.musicMood,
        hasDreamConcert: draftProfile.dreamConcert.trim().length > 0,
      },
    }).catch(() => {
      // Beta analytics should never block onboarding completion.
    });
  };

  const clearAuthCallbackError = () => {
    setAuthCallbackError(null);
  };

  const requestMagicLink = async (email: string) => {
    await requestMagicLinkWithSupabase(email);
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  };

  const profile = viewerQuery.data?.profile ?? null;
  const isBootstrapping = !isSessionReady || (Boolean(session) && viewerQuery.isPending);

  const value: ReplayContextValue = {
    isBootstrapping,
    session,
    hasCompletedOnboarding: profile !== null,
    draftProfile,
    notificationDraft,
    profile,
    pogs,
    isSavingOnboarding: onboardingMutation.isPending,
    authCallbackError,
    updateDraftProfile,
    updateAvatar,
    updateNotificationDraft,
    completeOnboarding,
    requestMagicLink,
    signOut,
    clearAuthCallbackError,
  };

  return <ReplayContext.Provider value={value}>{children}</ReplayContext.Provider>;
}

export function useReplayApp() {
  const value = useContext(ReplayContext);
  if (!value) {
    throw new Error("useReplayApp must be used inside ReplayAppProvider");
  }
  return value;
}
