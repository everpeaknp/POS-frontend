"use client";

import { useEffect, useRef, useState } from "react";

/** Native size the real dashboard is rendered at inside the hidden iframe, before scaling down to fit the card. */
const PREVIEW_WIDTH = 1440;
const PREVIEW_HEIGHT = 960;

/**
 * An actual live render of the real dashboard (`/dashboard`), scaled down to
 * card size and non-interactive — not a hand-built mockup. It shares this
 * tab's session (same-origin, same cookies/localStorage) so it shows real
 * data, and AppearanceContext's `storage` listener means picking a new
 * theme/accent color in the parent page updates it immediately, without
 * waiting for the save to round-trip or the iframe to reload.
 */
export function ThemePreview() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const updateScale = () => {
      const width = el.offsetWidth;
      if (width > 0) setScale(width / PREVIEW_WIDTH);
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="relative rounded-xl border overflow-hidden shadow-sm bg-muted/30 w-full"
      style={{ height: PREVIEW_HEIGHT * scale }}
      role="img"
      aria-label="Live preview of the dashboard with your current theme and accent color"
    >
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
          Loading preview…
        </div>
      )}
      <iframe
        src="/dashboard"
        title="Live theme preview"
        tabIndex={-1}
        aria-hidden="true"
        onLoad={() => setLoaded(true)}
        style={{
          width: PREVIEW_WIDTH,
          height: PREVIEW_HEIGHT,
          border: "none",
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          pointerEvents: "none",
          opacity: loaded ? 1 : 0,
          transition: "opacity 200ms",
        }}
      />
      <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 px-1.5 py-0.5 rounded text-[7px] sm:text-[8px] bg-background/80 backdrop-blur-sm border border-border text-muted-foreground pointer-events-none">
        Live Preview
      </div>
    </div>
  );
}
