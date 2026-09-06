"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Mic, X } from "@/lib/icons/lucide-react-shim";
import { useRouter } from "next/navigation";
import { matchIntent } from "@/lib/search/intentRules";

interface SearchResult {
  type: "matched" | "ai_answer";
  answer?: string;
  answer_ne?: string;
  link?: string;
}

interface SmartSearchBarProps {
  language: "en" | "ne";
}

export function SmartSearchBar({ language }: SmartSearchBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const router = useRouter();

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = language === "en" ? "en-US" : "ne-NP";

        recognitionRef.current.onstart = () => setIsListening(true);
        recognitionRef.current.onend = () => setIsListening(false);
        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setQuery(transcript);
        };
        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setError("Microphone access denied or not supported");
          setIsListening(false);
        };
      }
    }
  }, [language]);

  // Handle keyboard shortcut (Cmd/Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        setQuery("");
        setResult(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleSearch = async (q: string) => {
    if (!q.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // 1. Try pattern matching first (free, fast)
      const matched = matchIntent(q, language);

      if (matched.type === "navigate" && matched.link) {
        setResult({
          type: "matched",
          answer: language === "en" ? `Opening ${matched.action}...` : "खोलिदै छ...",
          link: matched.link,
        });
        setTimeout(() => router.push(matched.link!), 500);
      } else if (matched.type === "nomatch") {
        // 2. Fall back to LLM (for now, placeholder response)
        const response = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: q,
            language,
          }),
        });

        if (!response.ok) {
          throw new Error("Search failed");
        }

        const aiResult = await response.json();
        setResult({
          type: "ai_answer",
          answer: language === "en" ? aiResult.answer : aiResult.answer_ne,
        });
      }
    } catch (err) {
      console.error("Search error:", err);
      setError(language === "en" ? "Search failed. Try again." : "खोज असफल भयो");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicClick = () => {
    if (recognitionRef.current) {
      if (isListening) {
        recognitionRef.current.stop();
      } else {
        try {
          recognitionRef.current.start();
        } catch (err) {
          setError("Microphone not available");
        }
      }
    } else {
      setError("Speech recognition not supported in your browser");
    }
  };

  return (
    <>
      {/* Search modal overlay */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Search panel */}
          <div className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-xl z-50">
            <div className="bg-white rounded-lg shadow-xl overflow-hidden">
              {/* Search input */}
              <div className="p-4 border-b border-gray-200 flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={
                    language === "en" ? "Ask me anything..." : "केही सोध्नुहोस्..."
                  }
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch(query);
                    }
                  }}
                  className="flex-1 outline-none text-sm"
                  autoFocus
                />

                {/* Mic button */}
                <button
                  onClick={handleMicClick}
                  disabled={isLoading}
                  className={`p-2 rounded-lg transition ${
                    isListening
                      ? "bg-[var(--color-accent-custom,#22C55E)] text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                  title={
                    recognitionRef.current
                      ? "Speak your query"
                      : "Speech recognition not supported"
                  }
                  aria-label="Voice search"
                >
                  <Mic className="h-4 w-4" />
                </button>

                {/* Close button */}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setQuery("");
                    setResult(null);
                  }}
                  className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
                  aria-label="Close search"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Loading state */}
              {isLoading && (
                <div className="p-4 flex items-center gap-2 text-sm text-gray-600">
                  <div className="h-4 w-4 border-2 border-gray-300 border-t-[var(--color-accent-custom,#22C55E)] rounded-full animate-spin" />
                  {language === "en" ? "Searching..." : "खोजिदै छ..."}
                </div>
              )}

              {/* Error state */}
              {error && (
                <div className="p-4 text-sm text-red-600 bg-red-50">
                  {error}
                </div>
              )}

              {/* Result display */}
              {result && !isLoading && (
                <div className="p-4 border-t border-gray-200">
                  <p className="text-sm text-gray-900 mb-3">
                    {language === "en" ? result.answer : result.answer_ne}
                  </p>
                  <button
                    onClick={() => {
                      setQuery("");
                      setResult(null);
                      inputRef.current?.focus();
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-900 hover:bg-gray-200 transition"
                  >
                    {language === "en" ? "Ask something else" : "अन्य कुरा सोध्नुहोस्"}
                  </button>
                </div>
              )}

              {/* Help text */}
              {!result && !isLoading && (
                <div className="p-4 border-t border-gray-200 text-xs text-gray-500">
                  {language === "en"
                    ? "Try: 'spending this month', 'pending bills', 'add expense', 'tax estimate'"
                    : "प्रयास गर्नुहोस्: 'यो महिना खर्च', 'अव्यवस्थित बिल', 'खर्च जोड्नुहोस्', 'कर अनुमान'"}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
