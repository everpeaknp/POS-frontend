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
import {
  accountsAPI,
  type AgingReport,
  type JournalRegisterReport,
  type VatRegisterReport,
} from "@/lib/api/accounting";

const fmt = (n: number) => `Rs. ${n.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

type ReportTab = "receivable" | "payable" | "journal" | "vat_sales" | "vat_purchase";

export default function AccountingReportsPage() {
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

  const exportCsv = (rows: string[][], filename: string) => {
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
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

      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 shadow-sm flex flex-wrap gap-4 items-end">
        {needsDates && (
          <>
            <div>
              <Label className="text-xs">From</Label>
              <DateInput value={fromDate} onChange={setFromDate} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">To</Label>
              <DateInput value={toDate} onChange={setToDate} className="mt-1" />
            </div>
          </>
        )}
        <Button onClick={runReport} disabled={loading} className="bg-[#22C55E] hover:bg-[#16A34A]">
          <FileText className="h-4 w-4 mr-1" />
          {loading ? "Generating…" : "Generate"}
        </Button>
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
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() =>
              exportCsv(
                [["Customer", "Outstanding"], ...(agingAR.customers ?? []).map((c) => [c.customer_name, String(c.total)])],
                "receivable-aging.csv",
              )
            }
          >
            <Download className="h-4 w-4 mr-1" /> Export CSV
          </Button>
        </ReportCard>
      )}

      {tab === "payable" && agingAP && (
        <ReportCard title={`Payable aging · ${fmt(agingAP.total_outstanding)} total`}>
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
