"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, Send, Loader2, X, Copy, Check } from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { useDesktopWorkspace } from "@/lib/context/DesktopWorkspaceContext";
import { parseAiIntent, AI_QUICK_PROMPTS, type AiAction } from "@/lib/desktop/ai/intent-router";
import { isCloudAiConfigured, runDraft } from "@/lib/desktop/ai/llm";
import { getDesktopApi } from "@/lib/desktop";
import { desktop } from "@/lib/desktop";

type ChatRow = { role: "user" | "assistant"; content: string };

/**
 * Global AI Command Center — Electron desktop only.
 * Navigates existing routes / calls existing APIs / drafts text.
 */
export function AICommandCenter() {
  const { aiOpen, setAiOpen, openTab, setSmartSearchOpen } = useDesktopWorkspace();
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rows, setRows] = useState<ChatRow[]>([
    {
      role: "assistant",
      content:
        "Khata Assistant ready. Try “Open Sales”, “Create Invoice”, “Search customer Ram”, or ask me to draft an email.",
    },
  ]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aiOpen) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(t);
  }, [aiOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [rows, busy]);

  useEffect(() => {
    if (!aiOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setAiOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [aiOpen, setAiOpen]);

  if (!aiOpen) return null;

  const runActions = async (actions: AiAction[]) => {
    const notes: string[] = [];
    for (const action of actions) {
      if (action.type === "navigate") {
        openTab(action.href, action.label);
        notes.push(`Opened **${action.label}**.`);
      } else if (action.type === "sync") {
        await getDesktopApi()?.offline?.syncNow();
        notes.push("Sync started.");
      } else if (action.type === "print") {
        await desktop.printSilent();
        notes.push("Print triggered for the current view.");
      } else if (action.type === "search") {
        setSmartSearchOpen(true);
        // Prefill via session for smart search panel
        sessionStorage.setItem("khata_smart_search_q", action.query);
        if (action.scope) sessionStorage.setItem("khata_smart_search_scope", action.scope);
        notes.push(`Searching for “${action.query}”…`);
      } else if (action.type === "message") {
        notes.push(action.text);
      } else if (action.type === "draft") {
        const text = await runDraft(
          action.kind,
          action.prompt,
          user?.tenant?.name
        );
        notes.push(text);
      } else if (action.type === "open_ai") {
        // already open
      }
    }
    return notes.join("\n\n");
  };

  const submit = async () => {
    const q = input.trim();
    if (!q || busy) return;
    setInput("");
    setRows((r) => [...r, { role: "user", content: q }]);
    setBusy(true);
    try {
      const actions = parseAiIntent(q);
      // If only a free-form draft/summary, enhance with cloud when available
      const reply = await runActions(actions);
      setRows((r) => [...r, { role: "assistant", content: reply }]);
    } catch (e) {
      setRows((r) => [
        ...r,
        {
          role: "assistant",
          content: e instanceof Error ? e.message : "Something went wrong.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const lastAssistant = [...rows].reverse().find((r) => r.role === "assistant")?.content || "";

  return (
    <div
      className="fixed inset-0 z-[220] flex items-stretch justify-end bg-black/40 backdrop-blur-[2px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setAiOpen(false);
      }}
    >
      <aside
        role="dialog"
        aria-label="Khata AI Command Center"
        className="w-full max-w-md h-full bg-[#0b1220] text-white shadow-2xl border-l border-white/10 flex flex-col animate-in slide-in-from-right duration-200"
      >
        <header className="h-12 shrink-0 flex items-center gap-2 px-4 border-b border-white/10">
          <Sparkles className="h-4 w-4 text-[#22C55E]" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">AI Command Center</p>
            <p className="text-[10px] text-white/45 truncate">
              {isCloudAiConfigured() ? "Cloud drafting enabled" : "Local commands · optional cloud AI"}
            </p>
          </div>
          <button
            type="button"
            className="p-1.5 rounded-md hover:bg-white/10"
            aria-label="Close"
            onClick={() => setAiOpen(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {rows.map((row, i) => (
            <div
              key={i}
              className={`text-sm leading-relaxed whitespace-pre-wrap rounded-xl px-3 py-2.5 ${
                row.role === "user"
                  ? "bg-[#22C55E]/20 ml-8"
                  : "bg-white/5 mr-4 text-white/90"
              }`}
            >
              {row.content}
            </div>
          ))}
          {busy && (
            <div className="flex items-center gap-2 text-white/50 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="px-3 pb-2 flex flex-wrap gap-1.5">
          {AI_QUICK_PROMPTS.slice(0, 5).map((p) => (
            <button
              key={p}
              type="button"
              className="text-[11px] px-2 py-1 rounded-full bg-white/5 hover:bg-white/10 text-white/70"
              onClick={() => setInput(p)}
            >
              {p.length > 28 ? `${p.slice(0, 28)}…` : p}
            </button>
          ))}
        </div>

        <div className="p-3 border-t border-white/10 space-y-2">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={2}
              placeholder="Ask or command… (Ctrl+Enter to send)"
              className="flex-1 resize-none rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-[#22C55E]/50 placeholder:text-white/35"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  void submit();
                }
              }}
            />
            <button
              type="button"
              disabled={busy || !input.trim()}
              onClick={() => void submit()}
              className="h-auto px-3 rounded-xl bg-gradient-to-b from-[#16A34A] to-[#22C55E] disabled:opacity-40"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center justify-between text-[10px] text-white/40">
            <span>Ctrl+Shift+Space · Esc to close</span>
            <button
              type="button"
              className="inline-flex items-center gap-1 hover:text-white/70"
              onClick={async () => {
                await navigator.clipboard.writeText(lastAssistant);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1200);
              }}
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              Copy last reply
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
