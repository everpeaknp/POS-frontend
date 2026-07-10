"use client";

import { useCallback, useState, type ReactNode } from "react";
import Link from "next/link";
import { Download, FileText } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DateInput } from "@/components/shared/DateInput";
import { AccountingPageShell } from "@/components/dashboard/AccountingPageShell";
import { StickyTable, StickyTableHead } from "@/components/accounting/StickyTable";
import { useDateSystem } from "@/lib/context/DateSystemContext";
import { useAuth } from "@/lib/context/AuthContext";
import {
  accountsAPI,
  type AgingReport,
  type JournalRegisterReport,
  type VatRegisterReport,
} from "@/lib/api/accounting";
import {
  exportTableAsCsv,
  exportTableAsPdf,
  tenantToExportOrg,
  type ExportRow,
  type ExportTableData,
} from "@/lib/utils/export";

const fmt = (n: number) => `Rs. ${n.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
const fmtPlain = (n: number) => n.toFixed(2);

type ReportTab = "receivable" | "payable" | "journal" | "vat_sales" | "vat_purchase";

export default function AccountingReportsPage() {
  const { formatDate } = useDateSystem();
  const { user } = useAuth();
  const [tab, setTab] = useState<ReportTab>("receivable");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [agingAR, setAgingAR] = useState<AgingReport | null>(null);
  const [agingAP, setAgingAP] = useState<AgingReport | null>(null);
  const [journalReg, setJournalReg] = useState<JournalRegisterReport | null>(null);
  const [vatSales, setVatSales] = useState<VatRegisterReport | null>(null);
  const [vatPurchase, setVatPurchase] = useState<VatRegisterReport | null>(null);

  const runReport = useCallback(async () => {
    const params = fromDate || toDate ? { from_date: fromDate || undefined, to_date: toDate || undefined } : undefined;
    try {
      setLoading(true);
      if (tab === "receivable") setAgingAR(await accountsAPI.receivableAging());
      else if (tab === "payable") setAgingAP(await accountsAPI.payableAging());
      else if (tab === "journal") setJournalReg(await accountsAPI.journalRegister(params));
      else if (tab === "vat_sales") setVatSales(await accountsAPI.vatSalesRegister(params));
      else if (tab === "vat_purchase") setVatPurchase(await accountsAPI.vatPurchaseRegister(params));
      toast.success("Report generated");
    } catch {
      toast.error("Failed to generate report");
    } finally {
      setLoading(false);
    }
  }, [tab, fromDate, toDate]);

  const tabs: { id: ReportTab; label: string }[] = [
    { id: "receivable", label: "Receivable Aging" },
    { id: "payable", label: "Payable Aging" },
    { id: "journal", label: "Journal Register" },
    { id: "vat_sales", label: "Sales VAT Register" },
    { id: "vat_purchase", label: "Purchase VAT Register" },
  ];

  const needsDates = tab === "journal" || tab === "vat_sales" || tab === "vat_purchase";

  const hasReportData =
    (tab === "receivable" && agingAR) ||
    (tab === "payable" && agingAP) ||
    (tab === "journal" && journalReg) ||
    (tab === "vat_sales" && vatSales) ||
    (tab === "vat_purchase" && vatPurchase);

  const dateSubtitle =
    fromDate || toDate
      ? [fromDate ? `From ${formatDate(fromDate)}` : null, toDate ? `To ${formatDate(toDate)}` : null]
          .filter(Boolean)
          .join(" · ")
      : undefined;

  const getExportData = useCallback((): ExportTableData | null => {
    const org = user?.tenant
      ? tenantToExportOrg({
          name: user.tenant.name,
          workspace_name: user.tenant.workspace_name,
          address: user.tenant.address,
          email: user.tenant.email,
        })
      : undefined;

    const base = (partial: Omit<ExportTableData, "org" | "template" | "reportType">): ExportTableData => ({
      ...partial,
      reportType: "Financial Report",
      template: "financial",
      org,
    });

    if (tab === "receivable" && agingAR) {
      const rows: ExportRow[] = [
        { cells: ["Current (0–30)", fmtPlain(agingAR.current)], style: "subtotal" },
        { cells: ["31–60 days", fmtPlain(agingAR.days_30_60)], style: "subtotal" },
        { cells: ["61–90 days", fmtPlain(agingAR.days_60_90)], style: "subtotal" },
        { cells: ["90+ days", fmtPlain(agingAR.days_90_plus)], style: "subtotal" },
        { cells: ["", ""], style: "section" },
        ...(agingAR.customers ?? []).map((c) => ({
          cells: [c.customer_name, fmtPlain(c.total)],
        })),
        { cells: ["Total Outstanding", fmtPlain(agingAR.total_outstanding)], style: "total" },
      ];

      return base({
        filename: `receivable-aging-${agingAR.as_of_date}`,
        title: "Receivable Aging",
        subtitle: `As of ${formatDate(agingAR.as_of_date)}`,
        headers: ["Customer / Bucket", "Outstanding"],
        rightAlignColumns: [1],
        rows,
      });
    }

    if (tab === "payable" && agingAP) {
      const rows: ExportRow[] = [
        { cells: ["Current (0–30)", fmtPlain(agingAP.current)], style: "subtotal" },
        { cells: ["31–60 days", fmtPlain(agingAP.days_30_60)], style: "subtotal" },
        { cells: ["61–90 days", fmtPlain(agingAP.days_60_90)], style: "subtotal" },
        { cells: ["90+ days", fmtPlain(agingAP.days_90_plus)], style: "subtotal" },
        { cells: ["", ""], style: "section" },
        ...(agingAP.suppliers ?? []).map((s) => ({
          cells: [s.supplier_name, fmtPlain(s.total)],
        })),
        { cells: ["Total Outstanding", fmtPlain(agingAP.total_outstanding)], style: "total" },
      ];

      return base({
        filename: `payable-aging-${agingAP.as_of_date}`,
        title: "Payable Aging",
        subtitle: `As of ${formatDate(agingAP.as_of_date)}`,
        headers: ["Supplier / Bucket", "Outstanding"],
        rightAlignColumns: [1],
        rows,
      });
    }

    if (tab === "journal" && journalReg) {
      return base({
        filename: `journal-register-${journalReg.from_date}-to-${journalReg.to_date}`,
        title: "Journal Register",
        subtitle: dateSubtitle ?? `${formatDate(journalReg.from_date)} to ${formatDate(journalReg.to_date)}`,
        headers: ["Date", "Entry #", "Account", "Debit", "Credit"],
        rightAlignColumns: [3, 4],
        rows: [
          ...journalReg.lines.map((line) => [
            formatDate(line.date),
            line.entry_number,
            `${line.account_code} ${line.account_name}`,
            line.debit > 0 ? fmtPlain(line.debit) : "",
            line.credit > 0 ? fmtPlain(line.credit) : "",
          ]),
          {
            cells: ["", "", `${journalReg.entry_count} entries`, "", ""],
            style: "total",
          },
        ],
      });
    }

    if (tab === "vat_sales" && vatSales) {
      return base({
        filename: `sales-vat-register-${vatSales.from_date}-to-${vatSales.to_date}`,
        title: "Sales VAT Register",
        subtitle: dateSubtitle ?? `${formatDate(vatSales.from_date)} to ${formatDate(vatSales.to_date)}`,
        headers: ["Date", "Reference", "Description", "Taxable (est.)", "VAT"],
        rightAlignColumns: [3, 4],
        rows: [
          ...vatSales.rows.map((row) => [
            formatDate(row.date),
            row.reference,
            row.description,
            fmtPlain(row.taxable_estimate),
            fmtPlain(row.vat_amount),
          ]),
          {
            cells: ["", "", "Total VAT", "", fmtPlain(vatSales.total_vat)],
            style: "total",
          },
        ],
      });
    }

    if (tab === "vat_purchase" && vatPurchase) {
      return base({
        filename: `purchase-vat-register-${vatPurchase.from_date}-to-${vatPurchase.to_date}`,
        title: "Purchase VAT Register",
        subtitle: dateSubtitle ?? `${formatDate(vatPurchase.from_date)} to ${formatDate(vatPurchase.to_date)}`,
        headers: ["Date", "Reference", "Description", "Taxable (est.)", "VAT"],
        rightAlignColumns: [3, 4],
        rows: [
          ...vatPurchase.rows.map((row) => [
            formatDate(row.date),
            row.reference,
            row.description,
            fmtPlain(row.taxable_estimate),
            fmtPlain(row.vat_amount),
          ]),
          {
            cells: ["", "", "Total VAT", "", fmtPlain(vatPurchase.total_vat)],
            style: "total",
          },
        ],
      });
    }

    return null;
  }, [
    tab,
    agingAR,
    agingAP,
    journalReg,
    vatSales,
    vatPurchase,
    formatDate,
    dateSubtitle,
    user?.tenant,
  ]);

  const handleExport = (format: "csv" | "pdf") => {
    const data = getExportData();
    if (!data) {
      toast.error("No data to export");
      return;
    }

    try {
      if (format === "csv") {
        exportTableAsCsv(data);
        toast.success("CSV exported");
      } else {
        exportTableAsPdf(data);
        toast.success("Print dialog opened — choose Save as PDF as the destination");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to export";
      toast.error(message);
    }
  };

  return (
    <AccountingPageShell title="Financial Reports" subtitle="Aging, registers, and IRD VAT summaries">
      <div className="flex flex-wrap gap-2 mb-4">
        {tabs.map((t) => (
          <Button
            key={t.id}
            variant={tab === t.id ? "default" : "outline"}
            size="sm"
            className={tab === t.id ? "bg-[#22C55E] hover:bg-[#16A34A]" : ""}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 flex-wrap">
            {needsDates && (
              <>
                <div className="w-full sm:w-auto sm:min-w-[150px]">
                  <Label className="text-xs mb-1.5 block">From</Label>
                  <DateInput value={fromDate} onChange={setFromDate} />
                </div>
                <div className="w-full sm:w-auto sm:min-w-[150px]">
                  <Label className="text-xs mb-1.5 block">To</Label>
                  <DateInput value={toDate} onChange={setToDate} />
                </div>
              </>
            )}
            <Button
              onClick={runReport}
              disabled={loading}
              className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white shrink-0"
            >
              <FileText className="h-4 w-4 mr-1" />
              {loading ? "Generating…" : "Generate"}
            </Button>
          </div>
          <div className="flex gap-2 shrink-0 sm:ml-auto">
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 text-gray-600 border-gray-200"
              disabled={!hasReportData}
              onClick={() => handleExport("csv")}
            >
              <Download className="h-3.5 w-3.5" /> CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 text-gray-600 border-gray-200"
              disabled={!hasReportData}
              onClick={() => handleExport("pdf")}
            >
              <FileText className="h-3.5 w-3.5" /> PDF
            </Button>
          </div>
        </div>
      </div>

      {tab === "receivable" && agingAR && (
        <ReportCard title={`Receivable aging · ${fmt(agingAR.total_outstanding)} total`}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-sm">
            {[
              ["Current (0–30)", agingAR.current],
              ["31–60 days", agingAR.days_30_60],
              ["61–90 days", agingAR.days_60_90],
              ["90+ days", agingAR.days_90_plus],
            ].map(([label, val]) => (
              <div key={String(label)} className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs">{label}</p>
                <p className="font-semibold">{fmt(Number(val))}</p>
              </div>
            ))}
          </div>
          <StickyTable>
            <StickyTableHead>
              <tr className="text-left text-gray-600">
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2 text-right">Outstanding</th>
              </tr>
            </StickyTableHead>
            <tbody>
              {(agingAR.customers ?? []).map((c) => (
                <tr key={c.customer_id} className="border-t border-gray-100">
                  <td className="px-3 py-2">
                    <Link href={`/dashboard/sales/customers/${c.customer_id}`} className="text-[#22C55E] hover:underline">
                      {c.customer_name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-right font-medium">{fmt(c.total)}</td>
                </tr>
              ))}
            </tbody>
          </StickyTable>
        </ReportCard>
      )}

      {tab === "payable" && agingAP && (
        <ReportCard title={`Payable aging · ${fmt(agingAP.total_outstanding)} total`}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-sm">
            {[
              ["Current (0–30)", agingAP.current],
              ["31–60 days", agingAP.days_30_60],
              ["61–90 days", agingAP.days_60_90],
              ["90+ days", agingAP.days_90_plus],
            ].map(([label, val]) => (
              <div key={String(label)} className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs">{label}</p>
                <p className="font-semibold">{fmt(Number(val))}</p>
              </div>
            ))}
          </div>
          <StickyTable>
            <StickyTableHead>
              <tr className="text-left text-gray-600">
                <th className="px-3 py-2">Supplier</th>
                <th className="px-3 py-2 text-right">Outstanding</th>
              </tr>
            </StickyTableHead>
            <tbody>
              {(agingAP.suppliers ?? []).map((s) => (
                <tr key={s.supplier_id} className="border-t border-gray-100">
                  <td className="px-3 py-2">
                    <Link href={`/dashboard/purchase/suppliers/${s.supplier_id}`} className="text-[#22C55E] hover:underline">
                      {s.supplier_name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-right font-medium">{fmt(s.total)}</td>
                </tr>
              ))}
            </tbody>
          </StickyTable>
        </ReportCard>
      )}

      {tab === "journal" && journalReg && (
        <ReportCard title={`Journal register · ${journalReg.entry_count} entries`}>
          <StickyTable maxHeight="max-h-[65vh]">
            <StickyTableHead>
              <tr className="text-left text-gray-600 text-xs">
                <th className="px-2 py-2">Date</th>
                <th className="px-2 py-2">Entry #</th>
                <th className="px-2 py-2">Account</th>
                <th className="px-2 py-2 text-right">Debit</th>
                <th className="px-2 py-2 text-right">Credit</th>
              </tr>
            </StickyTableHead>
            <tbody>
              {journalReg.lines.map((line, i) => (
                <tr key={i} className="border-t border-gray-50 text-xs">
                  <td className="px-2 py-1.5">{line.date}</td>
                  <td className="px-2 py-1.5">{line.entry_number}</td>
                  <td className="px-2 py-1.5">{line.account_code} {line.account_name}</td>
                  <td className="px-2 py-1.5 text-right">{line.debit ? fmt(line.debit) : "—"}</td>
                  <td className="px-2 py-1.5 text-right">{line.credit ? fmt(line.credit) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </StickyTable>
        </ReportCard>
      )}

      {(tab === "vat_sales" && vatSales) || (tab === "vat_purchase" && vatPurchase) ? (
        <ReportCard
          title={`${tab === "vat_sales" ? "Sales" : "Purchase"} VAT register · ${fmt((tab === "vat_sales" ? vatSales : vatPurchase)!.total_vat)}`}
        >
          <StickyTable>
            <StickyTableHead>
              <tr className="text-left text-gray-600 text-xs">
                <th className="px-2 py-2">Date</th>
                <th className="px-2 py-2">Reference</th>
                <th className="px-2 py-2">Description</th>
                <th className="px-2 py-2 text-right">Taxable (est.)</th>
                <th className="px-2 py-2 text-right">VAT</th>
              </tr>
            </StickyTableHead>
            <tbody>
              {(tab === "vat_sales" ? vatSales! : vatPurchase!).rows.map((row, i) => (
                <tr key={i} className="border-t border-gray-50 text-xs">
                  <td className="px-2 py-1.5">{row.date}</td>
                  <td className="px-2 py-1.5">{row.reference}</td>
                  <td className="px-2 py-1.5">{row.description}</td>
                  <td className="px-2 py-1.5 text-right">{fmt(row.taxable_estimate)}</td>
                  <td className="px-2 py-1.5 text-right">{fmt(row.vat_amount)}</td>
                </tr>
              ))}
            </tbody>
          </StickyTable>
        </ReportCard>
      ) : null}
    </AccountingPageShell>
  );
}

function ReportCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">{title}</h3>
      {children}
    </div>
  );
}
