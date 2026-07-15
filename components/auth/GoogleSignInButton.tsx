"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { authApi, type GoogleOAuthConfig } from "@/lib/api/auth";
import { useAuth } from "@/lib/context/AuthContext";

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
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SCRIPT_SRC}"]`);
  if (existing) {
    return new Promise((resolve, reject) => {
      if (window.google?.accounts?.id) {
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

interface GoogleSignInButtonProps {
  label?: "signin_with" | "signup_with" | "continue_with";
  redirectTo?: string;
}

export function GoogleSignInButton({
  label = "continue_with",
  redirectTo,
}: GoogleSignInButtonProps) {
  const { loginWithGoogle } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const [config, setConfig] = useState<GoogleOAuthConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [buttonReady, setButtonReady] = useState(false);
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

  useEffect(() => {
    let cancelled = false;

    authApi
      .getGoogleConfig()
      .then((oauthConfig) => {
        if (!cancelled && oauthConfig.enabled && oauthConfig.client_id) {
          setConfig(oauthConfig);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setConfig(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Keep Google button width in sync with the Sign In / Create Account button
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
  }, [config]);

  useEffect(() => {
    if (!config?.client_id || btnWidth < 1) {
      return;
    }

    let cancelled = false;

    const mountButton = async () => {
      try {
        await loadGoogleScript();
        if (cancelled || !buttonRef.current || !window.google?.accounts?.id) {
          return;
        }

        window.google.accounts.id.initialize({
          client_id: config.client_id,
          callback: handleCredential,
        });

        buttonRef.current.innerHTML = "";
        // Render slightly narrower so uniform scale fills the full form width at h-11
        const renderWidth = Math.max(1, Math.floor(btnWidth / BTN_SCALE));
        window.google.accounts.id.renderButton(buttonRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: label,
          width: renderWidth,
          shape: "rectangular",
        });

        if (!cancelled) {
          setButtonReady(true);
        }
      } catch {
        if (!cancelled) {
          setButtonReady(false);
        }
      }
    };

    mountButton();

    return () => {
      cancelled = true;
    };
  }, [config, handleCredential, label, btnWidth]);

  if (loading || !config) {
    return null;
  }

  return (
    <div ref={containerRef} className="mt-5 flex w-full flex-col items-stretch gap-5">
      {buttonReady && (
        <div className="relative w-full">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-400">Or</span>
          </div>
        </div>
      )}
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
    </div>
  );
}
