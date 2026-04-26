function requirePublicEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function readNumberEnv(name: string, value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Environment variable ${name} must be a number.`);
  }

  return parsed;
}

export const env = {
  supabaseUrl: requirePublicEnv(
    "EXPO_PUBLIC_SUPABASE_URL",
    process.env.EXPO_PUBLIC_SUPABASE_URL,
  ),
  supabaseAnonKey: requirePublicEnv(
    "EXPO_PUBLIC_SUPABASE_ANON_KEY",
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  ),
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? "",
  posthogKey: process.env.EXPO_PUBLIC_POSTHOG_KEY ?? "",
  posthogHost: process.env.EXPO_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com",
  revenueCatAppleApiKey: process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY ?? "",
  revenueCatGoogleApiKey: process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY ?? "",
  defaultNotificationHour: readNumberEnv(
    "EXPO_PUBLIC_DEFAULT_NOTIFICATION_HOUR",
    process.env.EXPO_PUBLIC_DEFAULT_NOTIFICATION_HOUR,
    19,
  ),
} as const;
