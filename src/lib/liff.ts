"use client";

import { useEffect, useState } from "react";

export interface LiffUserProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

export interface LiffState {
  isReady: boolean;
  isLoggedIn: boolean;
  isInClient: boolean;
  profile: LiffUserProfile | null;
  error: string | null;
  isMock: boolean;
}

const DEFAULT_MOCK_PROFILE: LiffUserProfile = {
  userId: "U_MOCK_NURSE_001",
  displayName: "พยาบาลเมย์",
  pictureUrl: "https://images.unsplash.com/photo-1594824813511-4860000ebf28?w=150&auto=format&fit=crop&q=80",
  statusMessage: "อยู่เวรบ่าย-ดึก 💉",
};

export function useLiff() {
  const [liffState, setLiffState] = useState<LiffState>({
    isReady: false,
    isLoggedIn: true,
    isInClient: false,
    profile: DEFAULT_MOCK_PROFILE,
    error: null,
    isMock: true,
  });

  useEffect(() => {
    let isMounted = true;
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;

    async function initLiff() {
      if (!liffId) {
        // Run in Mock / Local mode
        if (isMounted) {
          setLiffState({
            isReady: true,
            isLoggedIn: true,
            isInClient: false,
            profile: DEFAULT_MOCK_PROFILE,
            error: null,
            isMock: true,
          });
        }
        return;
      }

      try {
        const liffModule = (await import("@line/liff")).default;
        await liffModule.init({ liffId });

        if (!liffModule.isLoggedIn()) {
          liffModule.login();
          return;
        }

        const profile = await liffModule.getProfile();
        if (isMounted) {
          setLiffState({
            isReady: true,
            isLoggedIn: true,
            isInClient: liffModule.isInClient(),
            profile: {
              userId: profile.userId,
              displayName: profile.displayName,
              pictureUrl: profile.pictureUrl,
              statusMessage: profile.statusMessage,
            },
            error: null,
            isMock: false,
          });
        }
      } catch (err: unknown) {
        console.warn("LIFF init error, falling back to mock mode:", err);
        if (isMounted) {
          setLiffState({
            isReady: true,
            isLoggedIn: true,
            isInClient: false,
            profile: DEFAULT_MOCK_PROFILE,
            error: err instanceof Error ? err.message : "Failed to initialize LIFF",
            isMock: true,
          });
        }
      }
    }

    initLiff();

    return () => {
      isMounted = false;
    };
  }, []);

  return liffState;
}

/**
 * Safely open a URL in external browser (Safari / Chrome) when inside LINE
 */
export async function openExternalUrl(url: string): Promise<void> {
  try {
    const liffModule = (await import("@line/liff")).default;
    if (liffModule && liffModule.isInClient()) {
      liffModule.openWindow({ url, external: true });
      return;
    }
  } catch {
    // ignore
  }

  window.open(url, "_blank");
}
