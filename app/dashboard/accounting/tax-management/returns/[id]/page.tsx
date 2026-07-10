"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { FileText, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  AccountingPageShell,
  accountingCardClass,
  accountingStatCardClass,
} from "@/components/dashboard/AccountingPageShell";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { vatReturnsAPI, type VATReturn } from "@/lib/api/accounting";
import { useDateSystem } from "@/lib/context/DateSystemContext";

const fmt = (n: number) =>
  `Rs. ${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  filed: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
};

export default function VatReturnDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { formatDate } = useDateSystem();
  const [loading, setLoading] = useState(true);
  const [vatReturn, setVatReturn] = useState<VATReturn | null>(null);
  const [confirmAction, setConfirmAction] = useState<"file" | "mark-paid" | null>(null);
  const [confirming, setConfirming] = useState(false);

  const fetchVATReturn = useCallback(async () => {
    try {
      setLoading(true);
      const data = await vatReturnsAPI.get(id);
      setVatReturn(data);
    } catch (error: unknown) {
      console.error("Failed to load VAT return:", error);
      toast.error("Failed to load VAT return");
      setVatReturn(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchVATReturn();
  }, [fetchVATReturn]);

  const handleFileReturn = async () => {
    if (!vatReturn) return;

    setConfirming(true);
    try {
      await vatReturnsAPI.file(id);
      toast.success("VAT return filed successfully");
      setConfirmAction(null);
      fetchVATReturn();
    } catch (error: unknown) {
      console.error("Failed to file VAT return:", error);
      toast.error("Failed to file VAT return");
    } finally {
      setConfirming(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!vatReturn) return;

    setConfirming(true);
    try {
      await vatReturnsAPI.markPaid(id);
      toast.success("VAT return marked as paid");
      setConfirmAction(null);
      fetchVATReturn();
    } catch (error: unknown) {
      console.error("Failed to mark VAT return as paid:", error);
      toast.error("Failed to mark VAT return as paid");
    } finally {
      setConfirming(false);
    }
  };

  const headerActions =
    vatReturn?.status === "draft" ? (
      <Button
        size="sm"
        onClick={() => setConfirmAction("file")}
        className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white"
      >
        File Return
      </Button>
    ) : vatReturn?.status === "filed" ? (
      <Button
        size="sm"
        onClick={() => setConfirmAction("mark-paid")}
        className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white"
      >
        Mark as Paid
      </Button>
    ) : undefined;

  if (!loading && !vatReturn) {
    return (
      <AccountingPageShell
        title="VAT Return"
        subtitle="Not found"
        variant="fullscreen"
      >
        <div className={`${accountingCardClass} p-12 text-center w-full`}>
          <p className="text-gray-500">VAT return not found</p>
        </div>
      </AccountingPageShell>
    );
  }

  return (
    <AccountingPageShell
      title={vatReturn?.return_number ?? "VAT Return"}
      subtitle={
        vatReturn
          ? `VAT Return · ${vatReturn.period}`
          : "Loading…"
      }
      variant="fullscreen"
      loading={loading}
      loadingMessage="Loading VAT return…"
      action={headerActions}
    >
      {vatReturn && (
        <div className={`${accountingCardClass} p-6 lg:p-8 w-full min-h-full space-y-6`}>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                STATUS_STYLES[vatReturn.status] ?? "bg-gray-100 text-gray-600"
              }`}
            >
              {vatReturn.status.charAt(0).toUpperCase() + vatReturn.status.slice(1)}
            </span>
            {vatReturn.paid_date && (
              <span className="text-xs text-gray-500">
                Paid on {formatDate(vatReturn.paid_date)}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Period", value: vatReturn.period },
              { label: "From Date", value: formatDate(vatReturn.from_date) },
              { label: "To Date", value: formatDate(vatReturn.to_date) },
              { label: "Net VAT Payable", value: fmt(vatReturn.net_payable) },
            ].map((s) => (
              <div key={s.label} className={accountingStatCardClass}>
                <p className="text-xs text-gray-500 uppercase tracking-wide">{s.label}</p>
                <p className="text-sm font-semibold text-gray-800 mt-1">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Output Tax (Collected)", value: fmt(vatReturn.output_tax), color: "text-gray-800" },
              { label: "Input Tax (Paid)", value: fmt(vatReturn.input_tax), color: "text-gray-600" },
              {
                label: "Net Payable to IRD",
                value: fmt(vatReturn.net_payable),
                color: vatReturn.net_payable >= 0 ? "text-[#22C55E]" : "text-red-600",
                bold: true,
              },
            ].map((s) => (
              <div key={s.label} className={accountingStatCardClass}>
                <p className="text-xs text-gray-500 uppercase tracking-wide">{s.label}</p>
                <p className={`text-xl mt-1 ${s.bold ? "font-bold" : ""} ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {(vatReturn.filed_date || vatReturn.notes) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {vatReturn.filed_date && (
                <div className="bg-gray-50/50 rounded-xl border border-gray-100 p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filed Date</p>
                  <p className="text-sm font-medium text-gray-800 mt-2">
                    {formatDate(vatReturn.filed_date)}
                  </p>
                </div>
              )}
              {vatReturn.notes && (
                <div className="bg-gray-50/50 rounded-xl border border-gray-100 p-4 lg:col-span-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Notes</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{vatReturn.notes}</p>
                </div>
              )}
            </div>
          )}

          <div className="rounded-xl border border-amber-100 bg-amber-50/80 p-4 text-sm text-gray-600">
            Invoice-level sales and purchase VAT breakdown is not yet linked from POS/purchasing.
            Totals above reflect the amounts entered when this return was created.
          </div>
        </div>
      )}
      <ConfirmDialog
        open={confirmAction === "file"}
        title="File this VAT return?"
        description="This marks it as submitted to IRD."
        confirmLabel="File Return"
        icon={<FileText className="h-5 w-5" />}
        confirming={confirming}
        onCancel={() => setConfirmAction(null)}
        onConfirm={handleFileReturn}
      />
      <ConfirmDialog
        open={confirmAction === "mark-paid"}
        title="Mark this return as paid?"
        description="This confirms the payment has been completed."
        confirmLabel="Mark as Paid"
        icon={<CheckCircle2 className="h-5 w-5" />}
        confirming={confirming}
        onCancel={() => setConfirmAction(null)}
        onConfirm={handleMarkPaid}
      />
    </AccountingPageShell>
  );
}
