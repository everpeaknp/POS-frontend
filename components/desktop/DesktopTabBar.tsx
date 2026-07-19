"use client";

import { useRef } from "react";
import { X, Pin } from "lucide-react";
import { useDesktopWorkspace } from "@/lib/context/DesktopWorkspaceContext";
import { cn } from "@/lib/utils";

export function DesktopTabBar() {
  const { tabs, activeHref, openTab, closeTab, pinTab } = useDesktopWorkspace();
  const scroller = useRef<HTMLDivElement>(null);

  if (tabs.length === 0) return null;

  const ordered = [...tabs].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned));

  return (
    <div className="desktop-tabbar h-9 shrink-0 flex items-end border-b border-white/10 select-none">
      <div
        ref={scroller}
        className="flex-1 flex items-end gap-0.5 overflow-x-auto px-1 scrollbar-none"
      >
        {ordered.map((tab) => {
          const active = tab.href === activeHref;
          return (
            <div
              key={tab.id}
              role="tab"
              aria-selected={active}
              onClick={() => openTab(tab.href, tab.title)}
              onContextMenu={(e) => {
                e.preventDefault();
                pinTab(tab.id);
              }}
              className={cn(
                "group relative flex items-center gap-1.5 max-w-[180px] min-w-[96px] h-8 px-2.5 rounded-t-md text-[11px] cursor-default transition-colors",
                active
                  ? "bg-[#F3F4F6] dark:bg-background text-gray-900 dark:text-foreground"
                  : "bg-transparent text-white/65 hover:bg-white/10 hover:text-white"
              )}
            >
              {tab.pinned && <Pin className="h-2.5 w-2.5 shrink-0 opacity-70" />}
              <span className="truncate flex-1">{tab.title}</span>
              <button
                type="button"
                aria-label={`Close ${tab.title}`}
                className={cn(
                  "opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10",
                  active && "opacity-60"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
