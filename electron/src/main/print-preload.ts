/**
 * Minimal preload for print-preview windows.
 * Exposes PDF download only — not the full Khata desktop bridge.
 */
import { contextBridge, ipcRenderer } from "electron";

const PRINT_TO_PDF = "desktop:print:toPdf";

contextBridge.exposeInMainWorld("khataPrint", {
  downloadPdf: (filename?: string) =>
    ipcRenderer.invoke(PRINT_TO_PDF, { filename }) as Promise<{
      canceled: boolean;
      filePath?: string;
    }>,
});
