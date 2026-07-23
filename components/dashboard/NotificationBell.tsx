"use client";

import { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Check } from "lucide-react";

import { notificationsAPI, type AppNotification } from "@/lib/api/notifications";
import { useNotificationPreferences } from "@/lib/context/NotificationPreferencesContext";
import { showBrowserNotification } from "@/lib/notifications/browser";
import { getNotificationTypeLabel } from "@/lib/notifications/labels";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const levelColors: Record<string, string> = {
  critical: "border-l-red-500",
  warning: "border-l-yellow-500",
  success: "border-l-green-500",
  info: "border-l-blue-500",
};

type NotificationBellProps = {
  /** Dropdown anchor — left rail uses right-start */
  placement?: "bottom-end" | "right-start";
};

type PanelPos = { top: number; left: number };

export function NotificationBell({ placement = "bottom-end" }: NotificationBellProps) {
  const router = useRouter();
  const { preferences } = useNotificationPreferences();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [panelPos, setPanelPos] = useState<PanelPos | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const knownIdsRef = useRef<Set<number>>(new Set());
  const initializedRef = useRef(false);

  const unreadCount = items.filter((n) => !n.is_read).length;

  const maybePushDesktop = useCallback(
    (notifications: AppNotification[]) => {
      if (!preferences.push_desktop || typeof window === "undefined") return;

      const fresh = notifications.filter((n) => !knownIdsRef.current.has(n.id));
      fresh.forEach((notification) => {
        if (!notification.is_read) {
          showBrowserNotification(notification.title, {
            body: notification.message,
            tag: `khata-notification-${notification.id}`,
            playSound: preferences.push_sound,
            data: { url: notification.action_url || "" },
          });
        }
      });

      notifications.forEach((n) => knownIdsRef.current.add(n.id));
    },
    [preferences.push_desktop, preferences.push_sound]
  );

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await notificationsAPI.list();
      const latest = data.slice(0, 15);
      setItems(latest);

      if (!initializedRef.current) {
        latest.forEach((n) => knownIdsRef.current.add(n.id));
        initializedRef.current = true;
        return;
      }

      maybePushDesktop(latest);
    } catch {
      // silent — notifications are non-critical
    } finally {
      setLoading(false);
    }
  }, [maybePushDesktop]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, [load]);

  const updatePanelPos = useCallback(() => {
    const btn = buttonRef.current;
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const panelW = 320;
    const panelH = Math.min(384, window.innerHeight - 16);
    const gap = 8;

    let top: number;
    let left: number;

    if (placement === "right-start") {
      left = rect.right + gap;
      top = rect.top;
      // Keep panel on screen vertically
      if (top + panelH > window.innerHeight - 8) {
        top = Math.max(8, window.innerHeight - panelH - 8);
      }
      // If not enough room on the right, flip to the left of the button
      if (left + panelW > window.innerWidth - 8) {
        left = Math.max(8, rect.left - panelW - gap);
      }
    } else {
      top = rect.bottom + gap;
      left = rect.right - panelW;
      if (left < 8) left = 8;
      if (top + panelH > window.innerHeight - 8) {
        top = Math.max(8, rect.top - panelH - gap);
      }
    }

    setPanelPos({ top, left });
  }, [placement]);

  useLayoutEffect(() => {
    if (!open) {
      setPanelPos(null);
      return;
    }
    updatePanelPos();
    window.addEventListener("resize", updatePanelPos);
    window.addEventListener("scroll", updatePanelPos, true);
    return () => {
      window.removeEventListener("resize", updatePanelPos);
      window.removeEventListener("scroll", updatePanelPos, true);
    };
  }, [open, updatePanelPos]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ref.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleOpen = () => {
    setOpen((v) => !v);
    if (!open) load();
  };

  const markRead = async (n: AppNotification) => {
    if (!n.is_read) {
      try {
        await notificationsAPI.markRead(n.id);
        setItems((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x))
        );
      } catch {
        toast.error("Could not mark notification as read");
      }
    }
    setOpen(false);
    if (n.action_url) {
      router.push(n.action_url);
    }
  };

  const markAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setItems((prev) => prev.map((x) => ({ ...x, is_read: true })));
      toast.success("All notifications marked read");
    } catch {
      toast.error("Failed to mark all as read");
    }
  };

  const panel =
    open && mounted && panelPos
      ? createPortal(
          <div
            ref={panelRef}
            data-tour="notifications-panel"
            style={{ top: panelPos.top, left: panelPos.left }}
            className="fixed z-[100] w-80 max-h-96 overflow-hidden bg-popover rounded-lg shadow-lg border border-border flex flex-col"
          >
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Notifications</p>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-xs text-[#22C55E] hover:underline flex items-center gap-1"
                >
                  <Check className="w-3 h-3" /> Mark all read
                </button>
              )}
            </div>

            <div className="overflow-y-auto flex-1">
              {loading && items.length === 0 ? (
                <div className="p-6 flex justify-center" />
              ) : items.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground text-center">
                  No notifications yet
                </p>
              ) : (
                items.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => markRead(n)}
                    className={`w-full text-left px-4 py-3 border-b border-border hover:bg-accent border-l-4 ${
                      levelColors[n.level] || levelColors.info
                    } ${n.is_read ? "opacity-70" : ""}`}
                  >
                    <p className="text-sm font-medium text-foreground">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {n.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1 flex items-center gap-2">
                      <span className="inline-flex px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {getNotificationTypeLabel(n.notification_type)}
                      </span>
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </button>
                ))
              )}
            </div>

            <div className="px-4 py-2 border-t border-border text-center">
              <Link
                href="/settings/notifications"
                className="text-xs text-muted-foreground hover:text-[#22C55E]"
                onClick={() => setOpen(false)}
              >
                Notification settings
              </Link>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div className="relative" ref={ref}>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleOpen}
        className={cn(
          "relative grid h-9 w-9 place-items-center rounded-lg transition-all",
          open
            ? "bg-amber-500/15 text-amber-500"
            : "text-amber-500 hover:bg-amber-500/10 hover:text-amber-400"
        )}
        aria-label={
          unreadCount > 0
            ? `Notifications (${unreadCount} unread)`
            : "Notifications"
        }
        title="Notifications"
      >
        <Bell
          className="h-[18px] w-[18px]"
          strokeWidth={2.25}
          fill={unreadCount > 0 ? "currentColor" : "none"}
          fillOpacity={unreadCount > 0 ? 0.2 : 0}
        />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold leading-none text-white shadow-sm ring-2 ring-card">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {panel}
    </div>
  );
}
