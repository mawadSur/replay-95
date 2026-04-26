import { useMemo, useState } from "react";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { OptionChip } from "@/components/option-chip";
import { PrimaryButton } from "@/components/primary-button";
import { RetroScreen } from "@/components/retro-screen";
import { SurfaceCard } from "@/components/surface-card";
import {
  type NoteReportReason,
  noteReportReasons,
} from "@/features/notes/note-constants";
import { useReportNote } from "@/features/notes/note-service";
import { useReplayApp } from "@/state/replay-context";
import { tokens } from "@/theme/tokens";

export default function SafetyReportScreen() {
  const params = useLocalSearchParams<{ noteId?: string; partnerName?: string }>();
  const { session } = useReplayApp();
  const reportNoteMutation = useReportNote(session?.user.id);
  const [selectedReason, setSelectedReason] = useState<NoteReportReason>(
    noteReportReasons[0],
  );
  const [details, setDetails] = useState("");
  const [errorText, setErrorText] = useState("");

  const finalReason = useMemo(() => {
    const trimmedDetails = details.trim();
    return trimmedDetails ? `${selectedReason}: ${trimmedDetails}` : selectedReason;
  }, [details, selectedReason]);

  if (!session) {
    return <Redirect href="/login" />;
  }

  const hasNoteId = Boolean(params.noteId);

  const handleSubmit = async () => {
    if (!params.noteId) {
      return;
    }

    setErrorText("");

    try {
      await reportNoteMutation.mutateAsync({
        noteId: params.noteId,
        reason: finalReason,
      });
      router.replace("/(tabs)/notes");
    } catch (error) {
      setErrorText(
        error instanceof Error ? error.message : "Replay '95 couldn't file that report yet.",
      );
    }
  };

  if (!hasNoteId) {
    return (
      <RetroScreen
        eyebrow="Safety"
        title="Report"
        subtitle="Reports store a moderation snapshot of the note body and paper style, even if the thread changes later."
      >
        <SurfaceCard style={styles.card}>
          <Text style={styles.sectionTitle}>No note selected to report.</Text>
          <Text style={styles.copy}>
            Open a delivered note from your inbox first, then tap "Report note" to file a moderation snapshot.
          </Text>
          <PrimaryButton
            label="Back to Notes"
            onPress={() => router.replace("/(tabs)/notes")}
            variant="secondary"
          />
        </SurfaceCard>
      </RetroScreen>
    );
  }

  return (
    <RetroScreen
      eyebrow="Safety"
      title={`Report ${params.partnerName ?? "this note"}`}
      subtitle="Reports store a moderation snapshot of the note body and paper style, even if the thread changes later."
    >
      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>Reason</Text>
        <View style={styles.chipRow}>
          {noteReportReasons.map((reason) => (
            <OptionChip
              key={reason}
              label={reason}
              onPress={() => setSelectedReason(reason)}
              selected={selectedReason === reason}
            />
          ))}
        </View>
        <TextInput
          multiline
          onChangeText={setDetails}
          placeholder="Optional extra detail for the moderation snapshot."
          placeholderTextColor={tokens.colors.textFaint}
          style={styles.textArea}
          textAlignVertical="top"
          value={details}
        />
        <PrimaryButton
          label={reportNoteMutation.isPending ? "Reporting..." : "Submit report"}
          onPress={() => {
            void handleSubmit();
          }}
          disabled={!hasNoteId || reportNoteMutation.isPending}
        />
        <PrimaryButton
          label="Back"
          onPress={() => router.back()}
          variant="secondary"
          disabled={reportNoteMutation.isPending}
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
  sectionTitle: {
    color: tokens.colors.text,
    fontFamily: tokens.typography.display,
    fontSize: 24,
  },
  copy: {
    color: tokens.colors.textMuted,
    fontFamily: tokens.typography.body,
    fontSize: 15,
    lineHeight: 22,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: tokens.spacing.sm,
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
  errorText: {
    color: tokens.colors.accentCoral,
    fontFamily: tokens.typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
});
