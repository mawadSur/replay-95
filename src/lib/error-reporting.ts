import * as Sentry from "@sentry/react-native";

import { env } from "@/config/env";

type ErrorContext = Record<string, unknown>;

let isInitialized = false;

export function initErrorReporting() {
  if (isInitialized) {
    return;
  }

  isInitialized = true;

  if (!env.sentryDsn) {
    return;
  }

  try {
    Sentry.init({
      dsn: env.sentryDsn,
      enableAutoSessionTracking: true,
      tracesSampleRate: 0.2,
      enableNative: true,
    });
  } catch (error) {
    console.error("Sentry init failed:", error);
  }
}

export function reportError(error: unknown, context?: ErrorContext) {
  if (env.sentryDsn) {
    Sentry.captureException(error, context ? { extra: context } : undefined);
  }

  if (context) {
    console.error("Replay '95 error:", error, context);
    return;
  }

  console.error("Replay '95 error:", error);
}
