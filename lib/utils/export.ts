import { downloadCsv } from "@/lib/utils/csv";
import { getMediaUrl } from "@/lib/utils";

export type ExportOrgInfo = {
  name: string;
  workspaceName?: string;
  address?: string;
  phone?: string;
  email?: string;
  panVat?: string;
  logoUrl?: string | null;
};

export type ExportRowStyle = "normal" | "section" | "subtotal" | "total";

export type ExportRow = {
  cells: string[];
  style?: ExportRowStyle;
};

export type ExportTableData = {
  filename: string;
  title: string;
  subtitle?: string;
  reportType?: string;
  headers: string[];
  rows: (string[] | ExportRow)[];
  org?: ExportOrgInfo;
  template?: "standard" | "financial";
  /** Column indices to right-align (defaults to last column for financial template) */
  rightAlignColumns?: number[];
};

function escapeHtml(value: string) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizeRows(rows: ExportTableData["rows"]): ExportRow[] {
  return rows.map((row) =>
    Array.isArray(row) ? { cells: row, style: "normal" } : row
  );
}

function inferRowStyle(cells: string[], template: ExportTableData["template"]): ExportRowStyle {
  if (template !== "financial") return "normal";
  const joined = cells.join(" ").toUpperCase();
  if (joined.includes("TOTAL") || joined.includes("NET PROFIT") || joined.includes("NET LOSS")) {
    return "total";
  }
  if (cells[0] && ["REVENUE", "EXPENSES", "ASSET", "LIABILITY", "EQUITY", "NET", "OPERATING", "INVESTING", "FINANCING"].includes(cells[0].toUpperCase()) && cells.length <= 3) {
    if (cells[1]?.toUpperCase() === "TOTAL") return "subtotal";
    return "section";
  }
  return "normal";
}

function buildOrgHeader(org: ExportOrgInfo) {
  const displayName = org.workspaceName || org.name || "Organization";
  const metaLines = [
    org.address,
    [org.phone, org.email].filter(Boolean).join(" · "),
    org.panVat ? `PAN / VAT: ${org.panVat}` : "",
  ].filter((line): line is string => Boolean(line));

  const logoBlock = org.logoUrl
    ? `<img src="${escapeHtml(org.logoUrl)}" alt="" class="org-logo" />`
    : `<div class="org-logo-fallback">${escapeHtml(displayName.charAt(0).toUpperCase())}</div>`;

  return `
    <header class="report-header">
      <div class="report-header-accent"></div>
      <div class="report-header-body">
        <div class="org-block">
          ${logoBlock}
          <div class="org-text">
            <h1 class="org-name">${escapeHtml(displayName)}</h1>
            ${org.workspaceName && org.workspaceName !== org.name ? `<p class="org-legal">${escapeHtml(org.name ?? "")}</p>` : ""}
            ${metaLines.map((line) => `<p class="org-meta">${escapeHtml(line)}</p>`).join("")}
          </div>
        </div>
      </div>
    </header>`;
}

function buildExportHtml(data: ExportTableData) {
  const template = data.template ?? (data.org ? "financial" : "standard");
  const normalized = normalizeRows(data.rows).map((row) => ({
    ...row,
    style: row.style ?? inferRowStyle(row.cells, template),
  }));

  const rightAlign =
    data.rightAlignColumns ??
    (template === "financial" ? [data.headers.length - 1] : []);

  const headerCells = data.headers
    .map((h, i) => {
      const align = rightAlign.includes(i) ? ' class="num"' : "";
      return `<th${align}>${escapeHtml(h)}</th>`;
    })
    .join("");

  const bodyRows = normalized
    .map((row) => {
      const cells = row.cells
        .map((cell, i) => {
          const align = rightAlign.includes(i) ? ' class="num"' : "";
          return `<td${align}>${escapeHtml(cell)}</td>`;
        })
        .join("");
      return `<tr class="row-${row.style ?? "normal"}">${cells}</tr>`;
    })
    .join("");

  const generatedAt = new Date().toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const isFinancial = template === "financial";

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(data.title)} — ${escapeHtml(data.org?.name ?? "Report")}</title>
    <style>
      * { box-sizing: border-box; }
      body {
        font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
        color: #111827;
        margin: 0;
        padding: 0;
        font-size: 12px;
        line-height: 1.45;
      }
      .page { padding: 28px 32px 40px; max-width: 900px; margin: 0 auto; }

      .report-header { margin-bottom: 28px; }
      .report-header-accent {
        height: 4px;
        background: linear-gradient(90deg, #22c55e 0%, #16a34a 100%);
        border-radius: 2px;
        margin-bottom: 20px;
      }
      .org-block { display: flex; align-items: flex-start; gap: 16px; }
      .org-logo {
        width: 56px; height: 56px; object-fit: contain;
        border-radius: 10px; border: 1px solid #e5e7eb; padding: 4px; background: #fff;
      }
      .org-logo-fallback {
        width: 56px; height: 56px; border-radius: 10px;
        background: #ecfdf5; color: #16a34a; font-size: 22px; font-weight: 700;
        display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      }
      .org-name { font-size: 22px; font-weight: 700; margin: 0 0 2px; color: #111827; letter-spacing: -0.02em; }
      .org-legal { font-size: 12px; color: #6b7280; margin: 0 0 6px; }
      .org-meta { font-size: 11px; color: #6b7280; margin: 0 0 2px; }

      .report-title-block {
        border-bottom: 2px solid #e5e7eb;
        padding-bottom: 14px;
        margin-bottom: 20px;
      }
      .report-type {
        font-size: 10px; font-weight: 600; letter-spacing: 0.08em;
        text-transform: uppercase; color: #22c55e; margin: 0 0 4px;
      }
      .report-title { font-size: 18px; font-weight: 700; margin: 0 0 4px; color: #111827; }
      .report-subtitle { font-size: 12px; color: #6b7280; margin: 0; }

      table { width: 100%; border-collapse: collapse; }
      thead th {
        background: #f9fafb;
        border-bottom: 2px solid #e5e7eb;
        padding: 10px 12px;
        text-align: left;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: #6b7280;
      }
      tbody td {
        padding: 8px 12px;
        border-bottom: 1px solid #f3f4f6;
        vertical-align: top;
      }
      td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
      tr.row-section td {
        background: #f9fafb;
        font-weight: 700;
        color: #374151;
        padding-top: 12px;
        border-bottom-color: #e5e7eb;
      }
      tr.row-subtotal td { font-weight: 600; background: #fafafa; }
      tr.row-total td {
        font-weight: 700;
        background: #ecfdf5;
        border-top: 2px solid #22c55e;
        border-bottom: 2px solid #22c55e;
        color: #111827;
        padding-top: 10px;
        padding-bottom: 10px;
      }
      tr.row-normal td:first-child { color: #374151; }
      ${!isFinancial ? "tr:nth-child(even) td { background: #fafafa; }" : ""}

      .report-footer {
        margin-top: 32px;
        padding-top: 14px;
        border-top: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        gap: 16px;
        font-size: 10px;
        color: #9ca3af;
      }
      .confidential { font-style: italic; }

      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .page { padding: 16px 20px; max-width: none; }
        @page { margin: 10mm; size: A4; }
      }
    </style>
  </head>
  <body>
    <div class="page">
      ${data.org ? buildOrgHeader(data.org) : ""}
      <div class="report-title-block">
        ${data.reportType ? `<p class="report-type">${escapeHtml(data.reportType)}</p>` : ""}
        <h2 class="report-title">${escapeHtml(data.title)}</h2>
        ${data.subtitle ? `<p class="report-subtitle">${escapeHtml(data.subtitle)}</p>` : ""}
      </div>
      <table>
        <thead><tr>${headerCells}</tr></thead>
        <tbody>${bodyRows}</tbody>
      </table>
      <footer class="report-footer">
        <span>Generated ${escapeHtml(generatedAt)}</span>
        <span class="confidential">Confidential — for internal use only</span>
      </footer>
    </div>
  </body>
</html>`;
}

export function exportTableAsCsv(data: ExportTableData) {
  const filename = data.filename.endsWith(".csv") ? data.filename : `${data.filename}.csv`;
  const rows = normalizeRows(data.rows).map((r) => r.cells);
  downloadCsv(filename, data.headers, rows);
}

function triggerPrint(target: Window) {
  target.focus();
  target.print();
}

function printViaIframe(html: string) {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";

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
    if (iframe.parentNode) {
      document.body.removeChild(iframe);
    }
  };

  win.onafterprint = cleanup;

  window.setTimeout(() => {
    triggerPrint(win);
    window.setTimeout(cleanup, 2000);
  }, 250);
}

function printViaNewWindow(html: string) {
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
      triggerPrint(printWindow);
      window.setTimeout(cleanup, 120_000);
    } catch {
      cleanup();
      printViaIframe(html);
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
        window.setTimeout(attemptPrint, 100);
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

import { printHtmlDocument } from "@/lib/print/html-print";

export function exportTableAsPdf(data: ExportTableData) {
  const html = buildExportHtml(data);
  printHtmlDocument(html, { filename: data.filename || data.title || "report" });
}

export function tenantToExportOrg(tenant: {
  name: string;
  workspace_name?: string;
  address?: string;
  phone?: string;
  email?: string;
  pan_vat_number?: string;
  logo?: string | null;
}): ExportOrgInfo {
  return {
    name: tenant.name,
    workspaceName: tenant.workspace_name,
    address: tenant.address,
    phone: tenant.phone,
    email: tenant.email,
    panVat: tenant.pan_vat_number,
    logoUrl: getMediaUrl(tenant.logo),
  };
}
