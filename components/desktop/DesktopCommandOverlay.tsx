"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, CornerDownLeft } from "lucide-react";
import {
  DESKTOP_COMMANDS,
  DESKTOP_NAV_CATALOG,
  type NavCatalogItem,
} from "@/lib/desktop/navigation-catalog";
import { useDesktopWorkspace } from "@/lib/context/DesktopWorkspaceContext";

type Mode = "palette" | "search";

function filterItems(q: string, items: NavCatalogItem[]) {
  const s = q.trim().toLowerCase();
  if (!s) return items;
  return items.filter((i) => {
    const hay = `${i.label} ${i.group} ${(i.keywords || []).join(" ")} ${i.href}`.toLowerCase();
    return hay.includes(s);
  });
}

export function DesktopCommandOverlay({ mode }: { mode: Mode }) {
  const {
    paletteOpen,
    searchOpen,
    setPaletteOpen,
    setSearchOpen,
    openTab,
    recent,
  } = useDesktopWorkspace();

  const open = mode === "palette" ? paletteOpen : searchOpen;
  const close = () => (mode === "palette" ? setPaletteOpen(false) : setSearchOpen(false));

  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = useMemo(() => {
    const base =
      mode === "palette"
        ? [...DESKTOP_COMMANDS, ...DESKTOP_NAV_CATALOG]
        : [
            ...recent.map(
              (r) =>
                ({
                  id: `recent-${r.id}`,
                  label: r.title,
                  href: r.href,
                  group: "Recent",
                }) satisfies NavCatalogItem
            ),
            ...DESKTOP_NAV_CATALOG,
          ];
    return filterItems(query, base).slice(0, 40);
  }, [query, mode, recent]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setIndex(0);
      return;
    }
    const t = window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    setIndex(0);
  }, [query, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setIndex((i) => Math.min(items.length - 1, i + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setIndex((i) => Math.max(0, i - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = items[index];
        if (item) runItem(item);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, items, index]);

  const runItem = (item: NavCatalogItem) => {
    if (item.href === "#command-palette") {
      setSearchOpen(false);
      setPaletteOpen(true);
      return;
    }
    if (item.href === "#global-search") {
      setPaletteOpen(false);
      setSearchOpen(true);
      return;
    }
    if (item.href === "#sync") {
      void import("@/lib/desktop").then(({ getDesktopApi }) =>
        getDesktopApi()?.offline?.syncNow()
      );
      close();
      return;
    }
    if (item.href === "#reload") {
      window.location.reload();
      return;
    }
    if (item.href === "#fullscreen") {
      if (!document.fullscreenElement) void document.documentElement.requestFullscreen();
      else void document.exitFullscreen();
      close();
      return;
    }
    openTab(item.href, item.label);
    close();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[12vh] px-4 bg-black/45 backdrop-blur-[2px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        role="dialog"
        aria-label={mode === "palette" ? "Command palette" : "Quick search"}
        className="w-full max-w-xl rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-[#0f172a] text-white animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-center gap-2 px-3 border-b border-white/10">
          <Search className="h-4 w-4 text-white/50 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              mode === "palette"
                ? "Type a command or go to…"
                : "Search pages, modules, settings…"
            }
            className="flex-1 h-12 bg-transparent outline-none text-sm placeholder:text-white/40"
          />
          <kbd className="text-[10px] text-white/40 border border-white/15 rounded px-1.5 py-0.5">
            Esc
          </kbd>
        </div>

        <ul className="max-h-[50vh] overflow-y-auto py-1">
          {items.length === 0 && (
            <li className="px-4 py-6 text-sm text-white/50 text-center">No results</li>
          )}
          {items.map((item, i) => (
            <li key={`${item.id}-${i}`}>
              <button
                type="button"
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors ${
                  i === index ? "bg-[#22C55E]/20 text-white" : "hover:bg-white/5 text-white/85"
                }`}
                onMouseEnter={() => setIndex(i)}
                onClick={() => runItem(item)}
              >
                <span className="flex-1 min-w-0">
                  <span className="block truncate font-medium">{item.label}</span>
                  <span className="block text-[11px] text-white/45 truncate">
                    {item.group} · {item.href}
                  </span>
                </span>
                {i === index && <CornerDownLeft className="h-3.5 w-3.5 opacity-60 shrink-0" />}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
