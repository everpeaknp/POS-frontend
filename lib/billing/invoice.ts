import { printHtmlDocument } from "@/lib/print/html-print";

/** Open invoice HTML in print preview (desktop supports Download PDF). */
export function openInvoiceForPdfDownload(html: string, filename = "invoice") {
  printHtmlDocument(html, { filename });
}
