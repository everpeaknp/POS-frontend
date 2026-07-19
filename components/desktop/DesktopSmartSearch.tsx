"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Loader2, Building2, Package, Users, FileText } from "lucide-react";
import { useDesktopWorkspace } from "@/lib/context/DesktopWorkspaceContext";
import { smartSearch, type SmartHit } from "@/lib/desktop/ai/smart-search";

const KIND_ICON = {
  page: FileText,
  customer: Building2,
  product: Package,
  employee: Users,
} as const;

/**
 * Universal smart search — Ctrl+Shift+K (desktop).
 * Reuses existing list APIs; navigates existing detail routes.
 */
export function DesktopSmartSearch() {
  const { smartSearchOpen, setSmartSearchOpen, openTab } = useDesktopWorkspace();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SmartHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!smartSearchOpen) return;
    const pref = sessionStorage.getItem("khata_smart_search_q") || "";
    sessionStorage.removeItem("khata_smart_search_q");
    setQuery(pref);
    try {
      setHistory(JSON.parse(localStorage.getItem("khata_smart_search_hist") || "[]"));
    } catch {
      setHistory([]);
    }
    const t = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(t);
  }, [smartSearchOpen]);

  useEffect(() => {
    if (!smartSearchOpen) return;
    if (!query.trim()) {
      setHits([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const t = window.setTimeout(() => {
      void smartSearch(query).then((res) => {
        if (!cancelled) {
          setHits(res);
          setIndex(0);
          setLoading(false);
        }
      });
    }, 220);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [query, smartSearchOpen]);

  useEffect(() => {
    if (!smartSearchOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setSmartSearchOpen(false);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setIndex((i) => Math.min(hits.length - 1, i + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setIndex((i) => Math.max(0, i - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const hit = hits[index];
        if (hit) select(hit);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [smartSearchOpen, hits, index]);

  const select = (hit: SmartHit) => {
    const nextHist = [query, ...history.filter((h) => h !== query)].slice(0, 12);
    localStorage.setItem("khata_smart_search_hist", JSON.stringify(nextHist));
    openTab(hit.href, hit.title);
    setSmartSearchOpen(false);
  };

  const emptyHint = useMemo(() => history.slice(0, 6), [history]);

  if (!smartSearchOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[210] flex items-start justify-center pt-[14vh] px-4 bg-black/45 backdrop-blur-[2px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setSmartSearchOpen(false);
      }}
    >
      <div
        role="dialog"
        aria-label="Smart search"
        className="w-full max-w-xl rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-[#0f172a] text-white"
      >
        <div className="flex items-center gap-2 px-3 border-b border-white/10">
          <Search className="h-4 w-4 text-white/50" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customers, products, employees, pages…"
            className="flex-1 h-12 bg-transparent outline-none text-sm placeholder:text-white/40"
          />
          {loading ? <Loader2 className="h-4 w-4 animate-spin text-white/40" /> : null}
          <kbd className="text-[10px] text-white/40 border border-white/15 rounded px-1.5 py-0.5">
            Esc
          </kbd>
        </div>

        <ul className="max-h-[50vh] overflow-y-auto py-1">
          {!query && emptyHint.length > 0 && (
            <li className="px-3 py-2 text-[11px] uppercase tracking-wide text-white/35">
              Recent searches
            </li>
          )}
          {!query &&
            emptyHint.map((h) => (
              <li key={h}>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm text-white/70 hover:bg-white/5"
                  onClick={() => setQuery(h)}
                >
                  {h}
                </button>
              </li>
            ))}

          {query && hits.length === 0 && !loading && (
            <li className="px-4 py-8 text-center text-sm text-white/45">No results</li>
          )}

          {hits.map((hit, i) => {
            const Icon = KIND_ICON[hit.kind];
            return (
              <li key={hit.id}>
                <button
                  type="button"
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm ${
                    i === index ? "bg-[#22C55E]/20" : "hover:bg-white/5"
                  }`}
                  onMouseEnter={() => setIndex(i)}
                  onClick={() => select(hit)}
                >
                  <Icon className="h-4 w-4 text-white/50 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{hit.title}</span>
                    <span className="block text-[11px] text-white/40 truncate">
                      {hit.kind} · {hit.subtitle}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
