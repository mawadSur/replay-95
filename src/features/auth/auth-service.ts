import * as Linking from "expo-linking";

import { supabase } from "@/lib/supabase";

const CALLBACK_PATH = "/callback";
const APP_SCHEME = "replay95";

function extractAuthParams(url: string) {
  const hashIndex = url.indexOf("#");
  const queryIndex = url.indexOf("?");
  const rawParams =
    hashIndex >= 0
      ? url.slice(hashIndex + 1)
      : queryIndex >= 0
        ? url.slice(queryIndex + 1)
        : "";

  return new URLSearchParams(rawParams);
}

export function getAuthRedirectUrl() {
  return Linking.createURL(CALLBACK_PATH, { scheme: APP_SCHEME });
}

export async function requestMagicLink(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: getAuthRedirectUrl(),
      shouldCreateUser: true,
    },
  });

  if (error) {
    throw error;
  }
}

export async function hydrateSessionFromUrl(url: string) {
  const params = extractAuthParams(url);
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  const code = params.get("code");

  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      throw error;
    }

    return true;
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      throw error;
    }

    return true;
  }

  return false;
}
