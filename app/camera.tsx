import { useMemo, useRef, useState } from "react";
import { Redirect, router } from "expo-router";
import { Linking, Platform, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { CameraView, useCameraPermissions } from "expo-camera";

import { OptionChip } from "@/components/option-chip";
import { PrimaryButton } from "@/components/primary-button";
import { RetroScreen } from "@/components/retro-screen";
import { SurfaceCard } from "@/components/surface-card";
import { useTrackBetaEvent } from "@/features/analytics/analytics-service";
import {
  replayCameraFilters,
  buildCameraOverlayLines,
  formatCameraStamp,
} from "@/features/camera/camera-filters";
import {
  captureReplayStill,
  shareReplayLoop,
} from "@/features/camera/camera-export-service";
import { useTonightEpisode } from "@/features/memory/episode-service";
import { useReplayApp } from "@/state/replay-context";
import { tokens } from "@/theme/tokens";

type CameraFacing = "back" | "front";

const scanlineRows = Array.from({ length: 20 }, (_, index) => index);

export default function CameraScreen() {
  const captureSurfaceRef = useRef<View | null>(null);
  const cameraRef = useRef<CameraView | null>(null);
  const { profile, session } = useReplayApp();
  const trackBetaEventMutation = useTrackBetaEvent(session?.user.id);
  const episodeQuery = useTonightEpisode(session?.user.id, profile);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [selectedFilterId, setSelectedFilterId] = useState(replayCameraFilters[0].id);
  const [facing, setFacing] = useState<CameraFacing>("front");
  const [isRecording, setIsRecording] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [statusText, setStatusText] = useState("Frame a moment and push it through a filter.");

  const selectedFilter =
    replayCameraFilters.find((filter) => filter.id === selectedFilterId) ??
    replayCameraFilters[0];
  const overlayLines = useMemo(
    () => buildCameraOverlayLines(profile, episodeQuery.data),
    [episodeQuery.data, profile],
  );

  if (!session) {
    return <Redirect href="/login" />;
  }

  if (Platform.OS === "web") {
    return (
      <RetroScreen
        eyebrow="Memory Booth"
        title="Native build only"
        subtitle="Memory Booth runs in the iOS/Android build."
      >
        <SurfaceCard style={styles.card}>
          <Text style={styles.copy}>
            Camera filters, overlays, and exports require the native dev client. Open Replay '95 on
            your phone to use the booth.
          </Text>
          <PrimaryButton
            label="Back to Tonight"
            onPress={() => router.back()}
            variant="secondary"
          />
        </SurfaceCard>
      </RetroScreen>
    );
  }

  const handleStillExport = async () => {
    if (!captureSurfaceRef.current) {
      return;
    }

    setErrorText("");
    setStatusText("Rendering still export...");

    try {
      await captureReplayStill(captureSurfaceRef);
      setStatusText("Still export shared.");
      await trackBetaEventMutation.mutateAsync({
        eventName: "camera_still_exported",
        metadata: {
          filter: selectedFilter.id,
          themeSlug: episodeQuery.data?.themeSlug ?? "fallback-memory-channel",
        },
      });
    } catch (error) {
      setErrorText(
        error instanceof Error ? error.message : "Replay '95 couldn't export the still.",
      );
      setStatusText("Still export stalled.");
    }
  };

  const handleLoopExport = async () => {
    if (!cameraPermission?.granted || !cameraRef.current) {
      setErrorText("Enable camera access before recording a loop export.");
      return;
    }

    setErrorText("");
    setStatusText("Recording a 15-second loop...");
    setIsRecording(true);

    try {
      // CameraView is mounted in video mode at all times so recordAsync starts without a mode swap warm-up.
      const result = await cameraRef.current.recordAsync({ maxDuration: 15 });

      if (!result?.uri) {
        throw new Error("Camera recording finished without a usable file.");
      }

      await shareReplayLoop(result.uri);
      setStatusText("Loop export shared.");
      await trackBetaEventMutation.mutateAsync({
        eventName: "camera_loop_exported",
        metadata: {
          filter: selectedFilter.id,
          themeSlug: episodeQuery.data?.themeSlug ?? "fallback-memory-channel",
        },
      });
    } catch (error) {
      setErrorText(
        error instanceof Error ? error.message : "Replay '95 couldn't export the loop.",
      );
      setStatusText("Loop export stalled.");
    } finally {
      setIsRecording(false);
    }
  };

  const handleRequestPermission = async () => {
    setErrorText("");

    try {
      const permission = await requestCameraPermission();
      if (!permission.granted) {
        setStatusText("Camera access is still off.");
        return;
      }

      setStatusText("Camera ready.");
    } catch (error) {
      setErrorText(
        error instanceof Error ? error.message : "Replay '95 couldn't request camera access.",
      );
    }
  };

  return (
    <RetroScreen
      eyebrow="Memory Booth"
      title="Camera filters, overlays, and exports"
      subtitle="Drop a moment through a period filter, then share a still or a 15-second loop. · Scene-aware AR coming after beta"
    >
      <SurfaceCard style={styles.card}>
        <View ref={captureSurfaceRef} collapsable={false} style={styles.captureSurface}>
          {cameraPermission?.granted ? (
            <CameraView
              ref={cameraRef}
              animateShutter={false}
              facing={facing}
              mode="video"
              mirror={facing === "front"}
              mute
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View style={styles.permissionFallback}>
              <Text style={styles.fallbackTitle}>Camera access is off</Text>
              <Text style={styles.fallbackCopy}>
                The booth still renders overlays and filters, but the live camera layer needs permission.
              </Text>
            </View>
          )}

          <LinearGradient
            colors={selectedFilter.vignetteColors}
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
          />
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              styles.colorWash,
              {
                backgroundColor: selectedFilter.washColor,
                opacity: selectedFilter.washOpacity,
              },
            ]}
          />

          <View pointerEvents="none" style={styles.scanlineWrap}>
            {scanlineRows.map((row) => (
              <View
                key={row}
                style={[
                  styles.scanline,
                  { opacity: selectedFilter.scanlineOpacity },
                ]}
              />
            ))}
          </View>

          <View pointerEvents="none" style={[styles.grainOverlay, { opacity: selectedFilter.grainOpacity }]} />

          <View pointerEvents="none" style={styles.overlayTopRow}>
            <Text style={styles.overlayLabel}>{selectedFilter.overlayText}</Text>
            <Text style={styles.overlayStamp}>{formatCameraStamp()}</Text>
          </View>

          <View pointerEvents="none" style={styles.overlayBottomCard}>
            <Text style={styles.overlayHeadline}>{overlayLines.headline}</Text>
            <Text style={styles.overlaySubline}>{overlayLines.subline}</Text>
            <Text style={styles.overlayFooter}>{overlayLines.footer}</Text>
          </View>
        </View>

        <Text style={styles.helperText}>{statusText}</Text>
      </SurfaceCard>

      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>Period filters</Text>
        <View style={styles.chipRow}>
          {replayCameraFilters.map((filter) => (
            <OptionChip
              key={filter.id}
              label={filter.label}
              onPress={() => setSelectedFilterId(filter.id)}
              selected={selectedFilter.id === filter.id}
            />
          ))}
        </View>
      </SurfaceCard>

      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>Booth controls</Text>
        <View style={styles.buttonColumn}>
          {!cameraPermission?.granted ? (
            cameraPermission?.canAskAgain === false ? (
              <PrimaryButton
                label="Open Settings"
                onPress={() => {
                  void Linking.openSettings();
                }}
              />
            ) : (
              <PrimaryButton
                label="Enable camera access"
                onPress={() => {
                  void handleRequestPermission();
                }}
              />
            )
          ) : null}
          <PrimaryButton
            label={facing === "front" ? "Switch to back camera" : "Switch to front camera"}
            onPress={() => setFacing((current) => (current === "front" ? "back" : "front"))}
            variant="secondary"
          />
          <PrimaryButton
            label="Share still export"
            onPress={() => {
              void handleStillExport();
            }}
          />
          <PrimaryButton
            label={isRecording ? "Recording loop..." : "Record 15-second loop"}
            onPress={() => {
              void handleLoopExport();
            }}
            disabled={isRecording}
            variant="secondary"
          />
        </View>
      </SurfaceCard>

      <SurfaceCard style={styles.card}>
        <PrimaryButton
          label="Back to Tonight"
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
  captureSurface: {
    minHeight: 420,
    borderRadius: tokens.radii.lg,
    overflow: "hidden",
    backgroundColor: "#0F0A18",
    borderWidth: 1,
    borderColor: tokens.colors.lineStrong,
  },
  permissionFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.xl,
    backgroundColor: "#20173A",
  },
  fallbackTitle: {
    color: tokens.colors.text,
    fontFamily: tokens.typography.display,
    fontSize: 26,
    textAlign: "center",
  },
  fallbackCopy: {
    color: tokens.colors.textMuted,
    fontFamily: tokens.typography.body,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  colorWash: {
    // Beta filter look is intentionally simple: color wash plus scanlines and vignette.
  },
  scanlineWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
  },
  scanline: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  grainOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  overlayTopRow: {
    position: "absolute",
    top: tokens.spacing.md,
    left: tokens.spacing.md,
    right: tokens.spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  overlayLabel: {
    color: "#FF7D7D",
    fontFamily: tokens.typography.label,
    fontSize: 12,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  overlayStamp: {
    color: tokens.colors.text,
    fontFamily: tokens.typography.label,
    fontSize: 12,
  },
  overlayBottomCard: {
    position: "absolute",
    left: tokens.spacing.md,
    right: tokens.spacing.md,
    bottom: tokens.spacing.md,
    gap: tokens.spacing.xs,
    padding: tokens.spacing.md,
    borderRadius: tokens.radii.md,
    backgroundColor: "rgba(14, 10, 22, 0.66)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  overlayHeadline: {
    color: tokens.colors.text,
    fontFamily: tokens.typography.display,
    fontSize: 26,
    lineHeight: 30,
  },
  overlaySubline: {
    color: tokens.colors.accentGold,
    fontFamily: tokens.typography.label,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  overlayFooter: {
    color: tokens.colors.textMuted,
    fontFamily: tokens.typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
  helperText: {
    color: tokens.colors.textFaint,
    fontFamily: tokens.typography.body,
    fontSize: 13,
    lineHeight: 18,
  },
  sectionTitle: {
    color: tokens.colors.text,
    fontFamily: tokens.typography.display,
    fontSize: 24,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: tokens.spacing.sm,
  },
  buttonColumn: {
    gap: tokens.spacing.sm,
  },
  copy: {
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
