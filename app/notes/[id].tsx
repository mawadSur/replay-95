import { useEffect, useMemo, useRef, useState } from "react";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { OptionChip } from "@/components/option-chip";
import { PrimaryButton } from "@/components/primary-button";
import { RetroScreen } from "@/components/retro-screen";
import { SurfaceCard } from "@/components/surface-card";
import { useBedroomState } from "@/features/bedroom/bedroom-service";
import {
  type NoteDelayMinutes,
  type NotePaperTheme,
  noteDelayPresets,
  notePaperThemes,
} from "@/features/notes/note-constants";
import {
  useBlockFriend,
  useInboxNotes,
  useMarkNoteRead,
  useMuteFriend,
  useSendNote,
} from "@/features/notes/note-service";
import { useReplayApp } from "@/state/replay-context";
import { tokens } from "@/theme/tokens";

const DEFAULT_PAPER_THEME: NotePaperTheme = "Ripped notebook";

export default function NoteDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const { session } = useReplayApp();
  const notesQuery = useInboxNotes(session?.user.id);
  const bedroomStateQuery = useBedroomState(session?.user.id);
  const markNoteReadMutation = useMarkNoteRead(session?.user.id);
  const sendNoteMutation = useSendNote(session?.user.id);
  const muteFriendMutation = useMuteFriend(session?.user.id);
  const blockFriendMutation = useBlockFriend(session?.user.id);
  const [paperStyle, setPaperStyle] = useState<NotePaperTheme>(DEFAULT_PAPER_THEME);
  const [delayMinutes, setDelayMinutes] = useState<NoteDelayMinutes>(
    noteDelayPresets[1].minutes,
  );
  const [draft, setDraft] = useState("");
  const [errorText, setErrorText] = useState("");
  const lastMarkedNoteIdRef = useRef<string | null>(null);

  const note = useMemo(
    () => notesQuery.data.find((item) => item.id === params.id) ?? null,
    [notesQuery.data, params.id],
  );

  const ownedPaperNames = useMemo(() => {
    const names = new Set<string>();
    for (const item of bedroomStateQuery.data.notePapers) {
      if (item.owned) {
        names.add(item.name);
      }
    }
    return names;
  }, [bedroomStateQuery.data.notePapers]);

  const availablePaperThemes = useMemo<NotePaperTheme[]>(() => {
    return notePaperThemes.filter(
      (theme) => theme === DEFAULT_PAPER_THEME || ownedPaperNames.has(theme),
    );
  }, [ownedPaperNames]);

  useEffect(() => {
    if (!availablePaperThemes.includes(paperStyle)) {
      setPaperStyle(DEFAULT_PAPER_THEME);
    }
  }, [availablePaperThemes, paperStyle]);

  useEffect(() => {
    if (!note || !note.isIncoming || note.isRead || note.status !== "delivered") {
      return;
    }

    if (lastMarkedNoteIdRef.current === note.id) {
      return;
    }

    lastMarkedNoteIdRef.current = note.id;

    void markNoteReadMutation.mutateAsync({ noteId: note.id }).catch(() => {
      // The inbox query will surface a real error state if this fails later.
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note?.id, note?.isRead, note?.status]);

  if (!session) {
    return <Redirect href="/login" />;
  }

  const handleReply = async () => {
    if (!note) {
      return;
    }

    setErrorText("");

    try {
      await sendNoteMutation.mutateAsync({
        recipientId: note.partnerId,
        paperStyle,
        body: draft,
        delayMinutes,
      });
      setDraft("");
    } catch (error) {
      setErrorText(
        error instanceof Error ? error.message : "Replay '95 couldn't queue the reply yet.",
      );
    }
  };

  const handleMuteToggle = async () => {
    if (!note) {
      return;
    }

    setErrorText("");

    try {
      await muteFriendMutation.mutateAsync({
        friendId: note.partnerId,
        isMuted: !note.partnerMuted,
      });
    } catch (error) {
      setErrorText(
        error instanceof Error ? error.message : "Replay '95 couldn't update mute status.",
      );
    }
  };

  const handleBlock = async () => {
    if (!note) {
      return;
    }

    setErrorText("");

    try {
      await blockFriendMutation.mutateAsync({ friendId: note.partnerId });
      router.replace("/(tabs)/notes");
    } catch (error) {
      setErrorText(
        error instanceof Error ? error.message : "Replay '95 couldn't block this friend.",
      );
    }
  };

  if (!note) {
    return (
      <RetroScreen
        eyebrow="Classroom notes"
        title="That note isn't here"
        subtitle="It may not belong to this account or the inbox hasn't refreshed yet."
      >
        <SurfaceCard style={styles.card}>
          <PrimaryButton label="Back to Notes" onPress={() => router.replace("/(tabs)/notes")} />
        </SurfaceCard>
      </RetroScreen>
    );
  }

  return (
    <RetroScreen
      eyebrow="Read note"
      title={`Unfolding ${note.partnerName}'s note`}
      subtitle="Reading a delivered note marks it as opened for the recipient. Replies still respect the delayed-delivery model."
    >
      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>Folded note</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>{note.paperStyle}</Text>
          <Text style={styles.metaLabel}>{note.deliveryWindow}</Text>
        </View>
        <Text style={styles.noteBody}>{note.body}</Text>
      </SurfaceCard>

      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>Reply</Text>
        <View style={styles.optionColumn}>
          <Text style={styles.label}>Paper theme</Text>
          <View style={styles.chipRow}>
            {availablePaperThemes.map((theme) => (
              <OptionChip
                key={theme}
                label={theme}
                onPress={() => setPaperStyle(theme)}
                selected={paperStyle === theme}
              />
            ))}
          </View>
        </View>
        <View style={styles.optionColumn}>
          <Text style={styles.label}>Delivery window</Text>
          <View style={styles.chipRow}>
            {noteDelayPresets.map((delay) => (
              <OptionChip
                key={delay.minutes}
                label={delay.label}
                onPress={() => setDelayMinutes(delay.minutes)}
                selected={delayMinutes === delay.minutes}
              />
            ))}
          </View>
        </View>
        <TextInput
          maxLength={140}
          multiline
          onChangeText={setDraft}
          placeholder={`Reply to ${note.partnerName} without turning this into a chat loop.`}
          placeholderTextColor={tokens.colors.textFaint}
          style={styles.textArea}
          textAlignVertical="top"
          value={draft}
        />
        <PrimaryButton
          label={sendNoteMutation.isPending ? "Queueing..." : "Queue reply"}
          onPress={() => {
            void handleReply();
          }}
          disabled={!draft.trim() || sendNoteMutation.isPending}
        />
      </SurfaceCard>

      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>Safety</Text>
        <Text style={styles.copy}>
          Mute keeps the connection but quiets the note relationship. Block stops future note delivery. Report stores a moderation snapshot of the note.
        </Text>
        <PrimaryButton
          label={note.partnerMuted ? "Unmute friend" : "Mute friend"}
          onPress={() => {
            void handleMuteToggle();
          }}
          disabled={muteFriendMutation.isPending}
          variant="secondary"
        />
        <PrimaryButton
          label={blockFriendMutation.isPending ? "Blocking..." : "Block friend"}
          onPress={() => {
            void handleBlock();
          }}
          disabled={blockFriendMutation.isPending}
          variant="secondary"
        />
        <PrimaryButton
          label="Report note"
          onPress={() =>
            router.push({
              pathname: "/safety/report",
              params: {
                noteId: note.id,
                partnerName: note.partnerName,
              },
            })
          }
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
  sectionTitle: {
    color: tokens.colors.text,
    fontFamily: tokens.typography.display,
    fontSize: 24,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: tokens.spacing.md,
  },
  metaLabel: {
    color: tokens.colors.accentBubble,
    fontFamily: tokens.typography.label,
    fontSize: 12,
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  noteBody: {
    color: tokens.colors.text,
    fontFamily: tokens.typography.body,
    fontSize: 17,
    lineHeight: 25,
  },
  optionColumn: {
    gap: tokens.spacing.xs,
  },
  label: {
    color: tokens.colors.textMuted,
    fontFamily: tokens.typography.label,
    fontSize: 13,
    letterSpacing: 0.4,
    textTransform: "uppercase",
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
