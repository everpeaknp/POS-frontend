"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { authApi, type GoogleOAuthConfig } from "@/lib/api/auth";
import { useAuth } from "@/lib/context/AuthContext";
import { useIsElectron } from "@/lib/desktop/use-is-electron";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: string;
              theme?: string;
              size?: string;
              text?: string;
              width?: number;
              shape?: string;
            }
          ) => void;
        };
        oauth2: {
          initCodeClient: (config: {
            client_id: string;
            scope: string;
            ux_mode?: "popup" | "redirect";
            callback: (response: {
              code?: string;
              error?: string;
              error_description?: string;
            }) => void;
            error_callback?: (error: { type?: string; message?: string }) => void;
          }) => { requestCode: () => void };
        };
      };
    };
  }
}

const GIS_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
/** Matches Sign In / Create Account: h-11 (44px) and rounded-lg */
const BTN_HEIGHT = 44;
const GOOGLE_LARGE_HEIGHT = 40;
const BTN_SCALE = BTN_HEIGHT / GOOGLE_LARGE_HEIGHT;

function loadGoogleScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Window is not available"));
  }
  if (window.google?.accounts?.id && window.google?.accounts?.oauth2) {
    return Promise.resolve();
  }
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SCRIPT_SRC}"]`);
  if (existing) {
    return new Promise((resolve, reject) => {
      if (window.google?.accounts?.oauth2 || window.google?.accounts?.id) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Google script")));
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GIS_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google script"));
    document.head.appendChild(script);
  });
}

async function fetchGoogleConfig(retries = 8): Promise<GoogleOAuthConfig | null> {
  let lastError: unknown;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const oauthConfig = await authApi.getGoogleConfig();
      if (oauthConfig.enabled && oauthConfig.client_id) {
        return oauthConfig;
      }
      return null;
    } catch (error) {
      lastError = error;
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    }
  }
  if (lastError) {
    console.warn("[GoogleSignIn] config unavailable:", lastError);
  }
  return null;
}

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

interface GoogleSignInButtonProps {
  label?: "signin_with" | "signup_with" | "continue_with";
  redirectTo?: string;
}

const LABEL_TEXT: Record<NonNullable<GoogleSignInButtonProps["label"]>, string> = {
  signin_with: "Sign in with Google",
  signup_with: "Sign up with Google",
  continue_with: "Continue with Google",
};

export function GoogleSignInButton({
  label = "continue_with",
  redirectTo,
}: GoogleSignInButtonProps) {
  const { loginWithGoogle } = useAuth();
  const desktop = useIsElectron();
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const [config, setConfig] = useState<GoogleOAuthConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [buttonReady, setButtonReady] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const [busy, setBusy] = useState(false);
  const [btnWidth, setBtnWidth] = useState(0);

  const handleCredential = useCallback(
    async (response: { credential: string }) => {
      try {
        await loginWithGoogle(response.credential, redirectTo);
        toast.success("Signed in with Google");
      } catch (error: unknown) {
        const err = error as { response?: { data?: { detail?: string } } };
        toast.error(err.response?.data?.detail || "Google sign-in failed");
      }
    },
    [loginWithGoogle, redirectTo]
  );

  const handleAuthCode = useCallback(
    async (code: string) => {
      setBusy(true);
      try {
        await loginWithGoogle({ code }, redirectTo);
        toast.success("Signed in with Google");
      } catch (error: unknown) {
        const err = error as { response?: { data?: { detail?: string } } };
        toast.error(err.response?.data?.detail || "Google sign-in failed");
      } finally {
        setBusy(false);
      }
    },
    [loginWithGoogle, redirectTo]
  );

  const startCodeFlow = useCallback(async () => {
    if (busy) return;

    let clientId = config?.client_id;
    if (!clientId) {
      setBusy(true);
      const fresh = await fetchGoogleConfig(3);
      if (fresh?.client_id) {
        setConfig(fresh);
        clientId = fresh.client_id;
      } else {
        setBusy(false);
        toast.error("Cannot reach API for Google sign-in. Is the backend running on :8000?");
        return;
      }
    }

    setBusy(true);
    try {
      await loadGoogleScript();
      const oauth2 = window.google?.accounts?.oauth2;
      if (!oauth2?.initCodeClient) {
        throw new Error("Google sign-in is unavailable in this window");
      }

      const client = oauth2.initCodeClient({
        client_id: clientId,
        scope: "openid email profile",
        ux_mode: "popup",
        callback: (response) => {
          if (response.code) {
            void handleAuthCode(response.code);
            return;
          }
          setBusy(false);
          toast.error(response.error_description || response.error || "Google sign-in cancelled");
        },
        error_callback: (error) => {
          setBusy(false);
          if (error?.type === "popup_closed") return;
          toast.error(error?.message || "Google sign-in failed");
        },
      });
      client.requestCode();
    } catch (error: unknown) {
      setBusy(false);
      const message = error instanceof Error ? error.message : "Google sign-in failed";
      toast.error(message);
    }
  }, [busy, config?.client_id, handleAuthCode]);

  useEffect(() => {
    if (desktop) setUseFallback(true);
  }, [desktop]);

  useEffect(() => {
    let cancelled = false;

    fetchGoogleConfig()
      .then((oauthConfig) => {
        if (!cancelled && oauthConfig) {
          setConfig(oauthConfig);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    const onFocus = () => {
      if (cancelled) return;
      void fetchGoogleConfig(2).then((oauthConfig) => {
        if (!cancelled && oauthConfig) setConfig(oauthConfig);
      });
    };
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateWidth = () => {
      const w = Math.floor(el.getBoundingClientRect().width);
      if (w > 0) setBtnWidth(w);
    };

    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    ro.observe(el);
    return () => ro.disconnect();
  }, [config, useFallback, desktop]);

  useEffect(() => {
    if (!config?.client_id || btnWidth < 1 || useFallback || desktop) {
      return;
    }

    let cancelled = false;
    const failTimer = window.setTimeout(() => {
      if (!cancelled) {
        setUseFallback(true);
        setButtonReady(false);
      }
    }, 2500);

    const mountButton = async () => {
      try {
        await loadGoogleScript();
        if (cancelled || !buttonRef.current || !window.google?.accounts?.id) {
          if (!cancelled) setUseFallback(true);
          return;
        }

        window.google.accounts.id.initialize({
          client_id: config.client_id,
          callback: handleCredential,
        });

        buttonRef.current.innerHTML = "";
        const renderWidth = Math.max(1, Math.floor(btnWidth / BTN_SCALE));
        window.google.accounts.id.renderButton(buttonRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: label,
          width: renderWidth,
          shape: "rectangular",
        });

        window.setTimeout(() => {
          if (cancelled) return;
          const iframe = buttonRef.current?.querySelector("iframe");
          const hasVisibleButton =
            !!iframe &&
            (iframe.getBoundingClientRect().width > 0 ||
              (buttonRef.current?.childElementCount ?? 0) > 0);
          if (!hasVisibleButton) {
            setUseFallback(true);
            setButtonReady(false);
            return;
          }
          setButtonReady(true);
          window.clearTimeout(failTimer);
        }, 400);
      } catch {
        if (!cancelled) {
          setUseFallback(true);
          setButtonReady(false);
        }
      }
    };

    mountButton();

    return () => {
      cancelled = true;
      window.clearTimeout(failTimer);
    };
  }, [config, handleCredential, label, btnWidth, useFallback, desktop]);

  // Desktop: always show custom Google button after hydration.
  // Web: wait for config so we don't flash a dead control.
  if (!desktop && (loading || !config)) {
    return null;
  }

  const showCustom = useFallback || desktop;

  return (
    <div ref={containerRef} className="mt-5 flex w-full flex-col items-stretch gap-5">
      <div className="relative w-full">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-400">Or</span>
        </div>
      </div>

      {showCustom ? (
        <button
          type="button"
          onClick={() => void startCodeFlow()}
          disabled={busy}
          className="flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <GoogleMark className="h-5 w-5 shrink-0" />
          {busy ? "Connecting to Google..." : LABEL_TEXT[label]}
        </button>
      ) : (
        <div
          className={`w-full overflow-hidden rounded-lg ${buttonReady ? "" : "sr-only"}`}
          style={{ height: BTN_HEIGHT }}
          aria-hidden={!buttonReady}
        >
          <div
            ref={buttonRef}
            className="origin-top-left [&>div]:!rounded-lg"
            style={{
              width: Math.max(1, Math.floor(btnWidth / BTN_SCALE)),
              height: GOOGLE_LARGE_HEIGHT,
              transform: `scale(${BTN_SCALE})`,
            }}
          />
        </div>
      )}
    </div>
  );
}
