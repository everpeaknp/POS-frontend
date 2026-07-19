/**
 * Print / Save-as-PDF helpers.
 * Electron: open one preview window (Download PDF / Print / Close).
 * Browser: open content then print (Chromium has a real print preview).
 */

function isDesktopRuntime() {
  return typeof navigator !== "undefined" && /Electron/i.test(navigator.userAgent);
}

type KhataPrintBridge = {
  downloadPdf: (filename?: string) => Promise<{ canceled: boolean; filePath?: string }>;
};

function getKhataPrint(win: Window): KhataPrintBridge | null {
  const bridge = (win as Window & { khataPrint?: KhataPrintBridge }).khataPrint;
  return bridge && typeof bridge.downloadPdf === "function" ? bridge : null;
}

const PREVIEW_TOOLBAR_STYLES = `
#khata-print-toolbar {
  position: sticky;
  top: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px;
  background: #1E2A3B;
  color: #fff;
  font-family: system-ui, -apple-system, Segoe UI, sans-serif;
  box-shadow: 0 1px 0 rgba(0,0,0,.15);
}
#khata-print-toolbar .khata-print-label {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: .01em;
}
#khata-print-toolbar .khata-print-actions {
  display: flex;
  gap: 8px;
}
#khata-print-toolbar button {
  appearance: none;
  border: 0;
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
#khata-print-toolbar button.primary {
  background: #22C55E;
  color: #fff;
}
#khata-print-toolbar button.primary:hover { background: #16a34a; }
#khata-print-toolbar button.secondary {
  background: rgba(34, 197, 94, 0.18);
  color: #86efac;
  border: 1px solid rgba(34, 197, 94, 0.35);
}
#khata-print-toolbar button.secondary:hover {
  background: rgba(34, 197, 94, 0.28);
  color: #fff;
}
#khata-print-toolbar button.secondary:disabled {
  opacity: 0.6;
  cursor: wait;
}
#khata-print-toolbar button.ghost {
  background: rgba(255,255,255,.12);
  color: #fff;
}
#khata-print-toolbar button.ghost:hover { background: rgba(255,255,255,.2); }
@media print {
  #khata-print-toolbar { display: none !important; }
}
`;

function previewToolbarHtml(): string {
  return `
<div id="khata-print-toolbar">
  <span class="khata-print-label">Print preview</span>
  <div class="khata-print-actions">
    <button type="button" class="ghost" id="khata-print-close">Close</button>
    <button type="button" class="secondary" id="khata-print-pdf">Download PDF</button>
    <button type="button" class="primary" id="khata-print-go">Print</button>
  </div>
</div>
`;
}

function injectPreviewChrome(html: string): string {
  const toolbarBlock = `<style>${PREVIEW_TOOLBAR_STYLES}</style>${previewToolbarHtml()}`;

  if (/<body[^>]*>/i.test(html)) {
    return html.replace(/<body([^>]*)>/i, `<body$1>${toolbarBlock}`);
  }
  return `<!DOCTYPE html><html><head><meta charset="utf-8" /></head><body>${toolbarBlock}${html}</body></html>`;
}

function wirePreviewControls(win: Window, filename?: string) {
  const printBtn = win.document.getElementById("khata-print-go");
  const closeBtn = win.document.getElementById("khata-print-close");
  const pdfBtn = win.document.getElementById("khata-print-pdf") as HTMLButtonElement | null;

  printBtn?.addEventListener("click", () => {
    win.focus();
    win.print();
  });
  closeBtn?.addEventListener("click", () => {
    win.close();
  });

  pdfBtn?.addEventListener("click", () => {
    void (async () => {
      const bridge = getKhataPrint(win);
      const suggested =
        filename ||
        (win.document.title && win.document.title !== "Print preview"
          ? win.document.title
          : "document");

      if (!bridge) {
        // Fallback when print preload is unavailable
        win.focus();
        win.print();
        return;
      }

      const prev = pdfBtn.textContent;
      pdfBtn.disabled = true;
      pdfBtn.textContent = "Saving…";
      try {
        const result = await bridge.downloadPdf(suggested);
        if (!result.canceled) {
          pdfBtn.textContent = "Saved";
          window.setTimeout(() => {
            pdfBtn.textContent = prev || "Download PDF";
            pdfBtn.disabled = false;
          }, 1200);
          return;
        }
      } catch (err) {
        console.error("[print] PDF download failed:", err);
        win.alert("Could not save PDF. Try Print → Save as PDF instead.");
      }
      pdfBtn.textContent = prev || "Download PDF";
      pdfBtn.disabled = false;
    })();
  });
}

/** Desktop: one sized preview window — user prints / downloads when ready. */
function openDesktopPreview(html: string, filename?: string): boolean {
  const printWindow = window.open("about:blank", "_blank", "width=960,height=720");
  if (!printWindow) return false;

  const previewHtml = injectPreviewChrome(html);

  try {
    printWindow.document.open();
    printWindow.document.write(previewHtml);
    printWindow.document.close();
  } catch {
    printWindow.close();
    return false;
  }

  window.setTimeout(() => {
    if (printWindow.closed) return;
    try {
      if (filename) {
        printWindow.document.title = filename.replace(/\.pdf$/i, "");
      } else if (!printWindow.document.title) {
        printWindow.document.title = "Print preview";
      }
      wirePreviewControls(printWindow, filename);
      printWindow.focus();
    } catch {
      // ignore — window may have been closed
    }
  }, 50);

  return true;
}

function printViaSizedIframe(html: string) {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText =
    "position:fixed;left:0;top:0;width:1024px;height:768px;border:0;opacity:0;pointer-events:none;z-index:-1";

  document.body.appendChild(iframe);

  const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
  const win = iframe.contentWindow;

  if (!doc || !win) {
    document.body.removeChild(iframe);
    throw new Error("Could not open print view");
  }

  doc.open();
  doc.write(html);
  doc.close();

  const cleanup = () => {
    if (iframe.parentNode) document.body.removeChild(iframe);
  };

  win.onafterprint = cleanup;

  window.setTimeout(() => {
    win.focus();
    win.print();
    window.setTimeout(cleanup, 60_000);
  }, 300);
}

function printViaBlobWindow(html: string): boolean {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, "_blank");

  if (!printWindow) {
    URL.revokeObjectURL(url);
    return false;
  }

  const cleanup = () => URL.revokeObjectURL(url);

  const attemptPrint = () => {
    if (printWindow.closed) {
      cleanup();
      return;
    }
    try {
      printWindow.focus();
      printWindow.print();
      window.setTimeout(cleanup, 120_000);
    } catch {
      cleanup();
      printViaSizedIframe(html);
    }
  };

  let attempts = 0;
  const interval = window.setInterval(() => {
    attempts += 1;
    if (printWindow.closed) {
      window.clearInterval(interval);
      cleanup();
      return;
    }
    try {
      if (printWindow.document.readyState === "complete") {
        window.clearInterval(interval);
        window.setTimeout(attemptPrint, 150);
      } else if (attempts > 100) {
        window.clearInterval(interval);
        attemptPrint();
      }
    } catch {
      window.clearInterval(interval);
      attemptPrint();
    }
  }, 50);

  return true;
}

/**
 * Desktop → single in-app preview (Download PDF / Print / Close).
 * Browser → open content and show Chromium print dialog.
 */
export function printHtmlDocument(html: string, options?: { filename?: string }) {
  if (isDesktopRuntime()) {
    if (!openDesktopPreview(html, options?.filename)) {
      printViaSizedIframe(html);
    }
    return;
  }

  if (!printViaBlobWindow(html)) {
    printViaSizedIframe(html);
  }
}
