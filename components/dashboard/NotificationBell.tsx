"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Check, Loader2 } from "lucide-react";
import { notificationsAPI, type AppNotification } from "@/lib/api/notifications";
import toast from "react-hot-toast";

const levelColors: Record<string, string> = {
  critical: "border-l-red-500",
  warning: "border-l-yellow-500",
  success: "border-l-green-500",
  info: "border-l-blue-500",
};

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = items.filter((n) => !n.is_read).length;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await notificationsAPI.list();
      setItems(data.slice(0, 15));
    } catch {
      // silent — notifications are non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={handleOpen}
        className="relative p-2 rounded-lg hover:bg-accent text-muted-foreground transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-hidden bg-popover rounded-lg shadow-lg border border-border z-50 flex flex-col">
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
              <div className="p-6 flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : items.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground text-center">No notifications yet</p>
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
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-1">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </button>
              ))
            )}
          </div>

          <div className="px-4 py-2 border-t border-border text-center">
            <Link
              href="/dashboard/construction"
              className="text-xs text-muted-foreground hover:text-[#22C55E]"
              onClick={() => setOpen(false)}
            >
              Budget alerts appear here from construction sites
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
