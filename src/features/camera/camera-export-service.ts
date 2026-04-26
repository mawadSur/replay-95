import type { RefObject } from "react";
import { Platform, View } from "react-native";
import * as Sharing from "expo-sharing";
import { captureRef } from "react-native-view-shot";

export async function ensureReplaySharingAvailable() {
  if (Platform.OS === "web") {
    throw new Error("Replay exports require a native iOS or Android build.");
  }

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error("Sharing is not available on this device.");
  }
}

export async function captureReplayStill(viewRef: RefObject<View | null>) {
  await ensureReplaySharingAvailable();

  const uri = await captureRef(viewRef, {
    fileName: `replay95-still-${Date.now()}`,
    format: "png",
    quality: 1,
    result: "tmpfile",
  });

  await Sharing.shareAsync(uri, {
    mimeType: "image/png",
  });

  return uri;
}

export async function shareReplayLoop(uri: string) {
  if (!uri) {
    throw new Error("Record a loop before sharing it.");
  }

  await ensureReplaySharingAvailable();
  await Sharing.shareAsync(uri, {
    mimeType: "video/mp4",
  });

  return uri;
}
