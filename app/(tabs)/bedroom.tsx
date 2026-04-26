import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "@/components/primary-button";
import { RetroScreen } from "@/components/retro-screen";
import { SurfaceCard } from "@/components/surface-card";
import {
  type ReplayBedroomState,
  type ReplayUnlockable,
  useBedroomState,
  useEquipUnlockable,
  usePurchaseUnlockable,
} from "@/features/bedroom/bedroom-service";
import { useReplayApp } from "@/state/replay-context";
import { tokens } from "@/theme/tokens";

function renderDecorShape(slug: string | undefined) {
  switch (slug) {
    case "boombox-cassette-stack":
      return (
        <>
          <View style={styles.decorBoombox} />
          <View style={styles.decorCassette} />
        </>
      );
    case "vhs-tower-lamp":
      return (
        <>
          <View style={styles.decorVhsLampBase} />
          <View style={styles.decorLampShade} />
        </>
      );
    case "lava-lamp-blue":
      return <View style={styles.decorLavaLamp} />;
    case "arcade-token-jar":
      return <View style={styles.decorJar} />;
    case "mirror-ball-lights":
      return (
        <>
          <View style={styles.decorLightsLine} />
          <View style={styles.decorLightsBall} />
        </>
      );
    default:
      // Generic silhouette so future seeded room-decor unlockables still render something.
      return slug ? <View style={styles.decorGenericArtifact} /> : null;
  }
}

const emptyBedroomState: ReplayBedroomState = {
  equipped: {},
  notePapers: [],
  profileFlairs: [],
  roomDecor: [],
  scenes: [],
};

function formatItemStatus(item: ReplayUnlockable) {
  if (item.equipped) {
    return "Equipped";
  }

  if (item.owned) {
    return "Owned";
  }

  if (item.isQuestReward) {
    return "Quest reward";
  }

  return `${item.pogCost} pogs`;
}

export default function BedroomScreen() {
  const { pogs, profile, session } = useReplayApp();
  const bedroomStateQuery = useBedroomState(session?.user.id);
  const purchaseMutation = usePurchaseUnlockable(session?.user.id);
  const equipMutation = useEquipUnlockable(session?.user.id);
  const [errorText, setErrorText] = useState("");

  const bedroomState = bedroomStateQuery.data ?? emptyBedroomState;

  if (bedroomStateQuery.isError) {
    return (
      <RetroScreen
        eyebrow="Bedroom + inventory"
        title="Your collectible 90s room"
        subtitle="Your room couldn't load. Try again in a moment."
      >
        <SurfaceCard style={styles.collectionCard}>
          <Text style={styles.sectionTitle}>Room offline</Text>
          <Text style={styles.emptyCopy}>
            We couldn't reach the inventory service. Pull to retry once you're back online.
          </Text>
        </SurfaceCard>
      </RetroScreen>
    );
  }

  const scenes = bedroomState.scenes;
  const activeScene =
    bedroomState.equipped.scene ?? scenes.find((scene) => scene.owned) ?? scenes[0];
  const activeDecor = bedroomState.equipped.room_decor;
  const activeFlair = bedroomState.equipped.profile_flair;
  const activeNotePaper = bedroomState.equipped.note_paper;
  const displayName = profile?.name ?? "Alex";

  const handlePurchase = async (unlockableId: string) => {
    setErrorText("");

    try {
      await purchaseMutation.mutateAsync(unlockableId);
    } catch (error) {
      setErrorText(
        error instanceof Error ? error.message : "Replay '95 couldn't process that unlockable purchase.",
      );
    }
  };

  const handleEquip = async (unlockableId: string) => {
    setErrorText("");

    try {
      await equipMutation.mutateAsync(unlockableId);
    } catch (error) {
      setErrorText(
        error instanceof Error ? error.message : "Replay '95 couldn't equip that unlockable.",
      );
    }
  };

  const renderCollectionSection = (
    title: string,
    items: ReplayUnlockable[],
    emptyCopy: string,
  ) => (
    <SurfaceCard style={styles.collectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.length ? (
        <View style={styles.collectionColumn}>
          {items.map((item) => {
            const canBuy = !item.owned && !item.isQuestReward;
            const actionLabel = item.equipped
              ? "Equipped"
              : item.owned
                ? "Equip"
                : item.isQuestReward
                  ? "Quest reward"
                  : `Buy for ${item.pogCost}`;

            return (
              <View key={item.id} style={styles.collectionRow}>
                <View style={styles.collectionSwatchWrap}>
                  <View
                    style={[
                      styles.collectionSwatch,
                      { backgroundColor: item.accent },
                    ]}
                  />
                </View>
                <View style={styles.collectionMeta}>
                  <View style={styles.collectionHeader}>
                    <Text style={styles.collectionName}>{item.name}</Text>
                    <View style={styles.statusPill}>
                      <Text style={styles.statusPillText}>{formatItemStatus(item)}</Text>
                    </View>
                  </View>
                  <Text style={styles.collectionDescription}>{item.description}</Text>
                </View>
                <PrimaryButton
                  label={
                    purchaseMutation.isPending || equipMutation.isPending
                      ? "Working..."
                      : actionLabel
                  }
                  onPress={() => {
                    if (item.owned) {
                      void handleEquip(item.id);
                      return;
                    }

                    if (canBuy) {
                      void handlePurchase(item.id);
                    }
                  }}
                  disabled={
                    item.equipped ||
                    purchaseMutation.isPending ||
                    equipMutation.isPending ||
                    (!item.owned && !canBuy)
                  }
                  variant={item.owned ? "secondary" : "primary"}
                />
              </View>
            );
          })}
        </View>
      ) : (
        <Text style={styles.emptyCopy}>{emptyCopy}</Text>
      )}
    </SurfaceCard>
  );

  return (
    <RetroScreen
      eyebrow="Bedroom + inventory"
      title="Your collectible 90s room"
      subtitle="Equip what you've earned, spend pogs on the rest. Your room is the persistent profile card."
    >
      <SurfaceCard style={styles.walletCard}>
        <Text style={styles.walletLabel}>Pog wallet</Text>
        <Text style={styles.walletValue}>{pogs}</Text>
        <Text style={styles.walletCopy}>
          Earn pogs from quests, spend them on the store, equip what you own.
        </Text>
      </SurfaceCard>

      <SurfaceCard style={styles.roomCard}>
        <View
          style={[
            styles.roomBackdrop,
            { borderColor: activeScene?.accent ?? tokens.colors.accentSky },
          ]}
        >
          <View
            style={[
              styles.wall,
              { backgroundColor: activeScene?.accent ?? tokens.colors.dioramaWallTint },
            ]}
          />
          <View style={styles.floor} />
          <View
            style={[
              styles.poster,
              { backgroundColor: activeScene?.accent ?? tokens.colors.accentSky },
            ]}
          />
          <View style={styles.tv}>
            <View style={styles.tvScreen}>
              <Text style={styles.tvText}>Replay '95</Text>
            </View>
          </View>
          <View style={styles.beanBag} />
          {renderDecorShape(activeDecor?.slug)}
        </View>

        <View style={styles.roomHeader}>
          <View style={styles.roomTitleWrap}>
            <Text style={styles.roomTitle}>{activeScene?.name ?? "No scene equipped"}</Text>
            <Text style={styles.roomCopy}>
              {activeScene?.description ?? "Earn or buy something to start personalizing the room."}
            </Text>
          </View>
          <View
            style={[
              styles.ownerCard,
              activeFlair?.slug === "glitter-sticker-frame" ? styles.ownerCardGlitter : null,
              activeFlair?.slug === "smiley-nameplate" ? styles.ownerCardSmiley : null,
            ]}
          >
            <Text style={styles.ownerLabel}>{displayName}'s room card</Text>
            <Text style={styles.ownerMeta}>
              Decor: {activeDecor?.name ?? "None equipped"}
            </Text>
            <Text style={styles.ownerMeta}>
              Note paper: {activeNotePaper?.name ?? "Default paper"}
            </Text>
          </View>
        </View>
      </SurfaceCard>

      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

      {renderCollectionSection(
        "Scenes",
        scenes,
        "Scenes will appear here once the catalog loads.",
      )}
      {renderCollectionSection(
        "Room decor",
        bedroomState.roomDecor,
        "No room decor is available yet.",
      )}
      {renderCollectionSection(
        "Profile flair",
        bedroomState.profileFlairs,
        "No profile flair is available yet.",
      )}
      {renderCollectionSection(
        "Note paper",
        bedroomState.notePapers,
        "No note paper unlockables are available yet.",
      )}
    </RetroScreen>
  );
}

const styles = StyleSheet.create({
  walletCard: {
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
  walletCopy: {
    color: tokens.colors.textMuted,
    fontFamily: tokens.typography.body,
    fontSize: 15,
    lineHeight: 22,
  },
  roomCard: {
    gap: tokens.spacing.md,
  },
  roomBackdrop: {
    minHeight: 280,
    borderRadius: tokens.radii.lg,
    borderWidth: 2,
    overflow: "hidden",
    backgroundColor: tokens.colors.dioramaWall,
  },
  wall: {
    ...StyleSheet.absoluteFillObject,
    bottom: 74,
    opacity: 0.3,
  },
  floor: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 82,
    backgroundColor: tokens.colors.dioramaFloor,
  },
  poster: {
    position: "absolute",
    top: 24,
    right: 24,
    width: 76,
    height: 96,
    borderRadius: 12,
    opacity: 0.9,
  },
  tv: {
    position: "absolute",
    left: 26,
    bottom: 96,
    width: 138,
    height: 102,
    borderRadius: 18,
    backgroundColor: tokens.colors.dioramaTv,
    padding: 10,
  },
  tvScreen: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: tokens.colors.dioramaTvScreen,
    alignItems: "center",
    justifyContent: "center",
  },
  tvText: {
    color: tokens.colors.dioramaTvText,
    fontFamily: tokens.typography.label,
    fontSize: 14,
  },
  beanBag: {
    position: "absolute",
    right: 38,
    bottom: 48,
    width: 84,
    height: 54,
    borderRadius: 32,
    backgroundColor: tokens.colors.dioramaBeanBag,
  },
  decorBoombox: {
    position: "absolute",
    left: 176,
    bottom: 112,
    width: 76,
    height: 48,
    borderRadius: 12,
    backgroundColor: tokens.colors.dioramaShadow,
  },
  decorCassette: {
    position: "absolute",
    left: 192,
    bottom: 164,
    width: 42,
    height: 18,
    borderRadius: 6,
    backgroundColor: tokens.colors.dioramaTrim,
  },
  decorVhsLampBase: {
    position: "absolute",
    right: 148,
    bottom: 100,
    width: 38,
    height: 80,
    borderRadius: 10,
    backgroundColor: tokens.colors.dioramaTv,
  },
  decorLampShade: {
    position: "absolute",
    right: 134,
    bottom: 166,
    width: 66,
    height: 34,
    borderRadius: 14,
    backgroundColor: tokens.colors.dioramaLampShade,
  },
  decorLavaLamp: {
    position: "absolute",
    right: 152,
    bottom: 104,
    width: 28,
    height: 92,
    borderRadius: 14,
    backgroundColor: tokens.colors.dioramaLavaLamp,
  },
  decorJar: {
    position: "absolute",
    left: 184,
    bottom: 108,
    width: 40,
    height: 56,
    borderRadius: 14,
    backgroundColor: tokens.colors.dioramaJar,
  },
  decorLightsLine: {
    position: "absolute",
    top: 20,
    left: 126,
    right: 126,
    height: 3,
    backgroundColor: tokens.colors.dioramaLightsLine,
  },
  decorLightsBall: {
    position: "absolute",
    top: 18,
    left: 164,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: tokens.colors.dioramaLightsBall,
  },
  decorGenericArtifact: {
    position: "absolute",
    left: 200,
    bottom: 110,
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: tokens.colors.dioramaTrim,
  },
  roomHeader: {
    gap: tokens.spacing.md,
  },
  roomTitleWrap: {
    gap: tokens.spacing.xs,
  },
  roomTitle: {
    color: tokens.colors.text,
    fontFamily: tokens.typography.display,
    fontSize: 26,
  },
  roomCopy: {
    color: tokens.colors.textMuted,
    fontFamily: tokens.typography.body,
    fontSize: 15,
    lineHeight: 22,
  },
  ownerCard: {
    gap: tokens.spacing.xs,
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.md,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: tokens.colors.lineStrong,
  },
  ownerCardGlitter: {
    borderColor: tokens.colors.accentBubble,
    shadowColor: tokens.colors.accentBubble,
    shadowOpacity: 0.28,
    shadowRadius: 14,
  },
  ownerCardSmiley: {
    borderColor: tokens.colors.dioramaLampShade,
    backgroundColor: "rgba(255, 211, 107, 0.08)",
  },
  ownerLabel: {
    color: tokens.colors.accentGold,
    fontFamily: tokens.typography.label,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  ownerMeta: {
    color: tokens.colors.text,
    fontFamily: tokens.typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    color: tokens.colors.accentCoral,
    fontFamily: tokens.typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
  collectionCard: {
    gap: tokens.spacing.md,
  },
  sectionTitle: {
    color: tokens.colors.text,
    fontFamily: tokens.typography.display,
    fontSize: 24,
  },
  collectionColumn: {
    gap: tokens.spacing.md,
  },
  collectionRow: {
    gap: tokens.spacing.md,
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.md,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: tokens.colors.line,
  },
  collectionSwatchWrap: {
    flexDirection: "row",
  },
  collectionSwatch: {
    width: 44,
    height: 44,
    borderRadius: 14,
  },
  collectionMeta: {
    gap: tokens.spacing.xs,
  },
  collectionHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: tokens.spacing.sm,
  },
  collectionName: {
    color: tokens.colors.text,
    fontFamily: tokens.typography.label,
    fontSize: 16,
  },
  statusPill: {
    borderRadius: tokens.radii.pill,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: tokens.colors.lineStrong,
  },
  statusPillText: {
    color: tokens.colors.textFaint,
    fontFamily: tokens.typography.label,
    fontSize: 12,
  },
  collectionDescription: {
    color: tokens.colors.textMuted,
    fontFamily: tokens.typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
  emptyCopy: {
    color: tokens.colors.textMuted,
    fontFamily: tokens.typography.body,
    fontSize: 15,
    lineHeight: 22,
  },
});
