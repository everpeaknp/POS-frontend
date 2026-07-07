/** Open invoice HTML in a new window for print / Save as PDF. */
export function openInvoiceForPdfDownload(html: string, filename = "invoice") {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, "_blank");

  const cleanup = () => URL.revokeObjectURL(url);

  if (!printWindow) {
    cleanup();
    throw new Error("Pop-up blocked. Allow pop-ups to download the invoice.");
  }

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
      throw new Error("Could not open invoice for printing");
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
}
