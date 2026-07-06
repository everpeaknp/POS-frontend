export type BrowserNotificationPermission = NotificationPermission | "unsupported";

export function getBrowserNotificationSupport(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getBrowserNotificationPermission(): BrowserNotificationPermission {
  if (!getBrowserNotificationSupport()) return "unsupported";
  return Notification.permission;
}

export async function requestBrowserNotificationPermission(): Promise<BrowserNotificationPermission> {
  if (!getBrowserNotificationSupport()) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

export function showBrowserNotification(
  title: string,
  options?: NotificationOptions & { playSound?: boolean }
): void {
  if (!getBrowserNotificationSupport() || Notification.permission !== "granted") {
    return;
  }

  try {
    const notification = new Notification(title, {
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      ...options,
    });
    notification.onclick = () => {
      window.focus();
      if (options?.data && typeof options.data === "object" && "url" in options.data) {
        const url = String((options.data as { url?: string }).url || "");
        if (url) window.location.href = url;
      }
      notification.close();
    };
  } catch {
    // Ignore browsers that block notifications without a service worker.
  }

  if (options?.playSound) {
    try {
      const audio = new Audio("/notification.mp3");
      audio.volume = 0.35;
      void audio.play();
    } catch {
      // Optional sound asset may be missing.
    }
  }
}
