import { Redirect } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { LoadingScreen } from "@/components/loading-screen";
import { PrimaryButton } from "@/components/primary-button";
import { RetroScreen } from "@/components/retro-screen";
import { SurfaceCard } from "@/components/surface-card";
import { useReplayApp } from "@/state/replay-context";
import { tokens } from "@/theme/tokens";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "We couldn't send the sign-in link right now.";
}

export default function LoginScreen() {
  const { isBootstrapping, requestMagicLink, session } = useReplayApp();
  const [email, setEmail] = useState("");
  const [errorText, setErrorText] = useState("");
  const [hasSentLink, setHasSentLink] = useState(false);
  const [isSending, setIsSending] = useState(false);

  if (isBootstrapping) {
    return (
      <LoadingScreen
        title="Loading auth"
        subtitle="Checking for an existing Replay '95 session."
      />
    );
  }

  if (session) {
    return <Redirect href="/" />;
  }

  const handleSendLink = async () => {
    setErrorText("");

    const trimmedEmail = email.trim();
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setErrorText("Enter a valid email address (like you@example.com).");
      return;
    }

    setIsSending(true);

    try {
      await requestMagicLink(trimmedEmail);
      setHasSentLink(true);
    } catch (error) {
      setErrorText(getErrorMessage(error));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <RetroScreen
      eyebrow="Sign in"
      title="Open the yearbook"
      subtitle="One-tap email link, no password. Open it on this device and you're in."
    >
      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>Email sign-in</Text>
        <Text style={styles.copy}>
          Use the same email you want tied to your Replay '95 account. Open the link on this device to continue.
        </Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Email address</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={tokens.colors.textFaint}
            style={styles.input}
            value={email}
          />
        </View>

        {hasSentLink ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeLabel}>Link sent</Text>
            <Text style={styles.noticeCopy}>
              Check your inbox, open the magic link on this device, and Replay '95 will finish the session bootstrap.
            </Text>
          </View>
        ) : null}

        {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

        <PrimaryButton
          label={isSending ? "Sending..." : "Send sign-in link"}
          onPress={() => {
            void handleSendLink();
          }}
          disabled={!email.trim() || isSending}
        />
      </SurfaceCard>
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
  fieldGroup: {
    gap: tokens.spacing.xs,
  },
  label: {
    color: tokens.colors.textMuted,
    fontFamily: tokens.typography.label,
    fontSize: 13,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  input: {
    minHeight: 52,
    borderRadius: tokens.radii.md,
    borderWidth: 1,
    borderColor: tokens.colors.lineStrong,
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: tokens.spacing.md,
    color: tokens.colors.text,
    fontFamily: tokens.typography.body,
    fontSize: 16,
  },
  noticeCard: {
    borderRadius: tokens.radii.md,
    borderWidth: 1,
    borderColor: "rgba(122, 199, 255, 0.35)",
    backgroundColor: "rgba(122, 199, 255, 0.08)",
    gap: tokens.spacing.xs,
    padding: tokens.spacing.md,
  },
  noticeLabel: {
    color: tokens.colors.accentSky,
    fontFamily: tokens.typography.label,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  noticeCopy: {
    color: tokens.colors.text,
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
