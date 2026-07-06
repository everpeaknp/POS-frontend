"use client";

import { PageLoading } from "@/components/shared/PageLoading";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { DashHeader } from "@/components/dashboard/dash-header";
import { vatReturnsAPI, type VATReturn } from "@/lib/api/accounting";
import { useDateSystem } from "@/lib/context/DateSystemContext";

const fmt = (n: number) => `Rs. ${n.toLocaleString("en-IN")}`;
const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  filed: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
};

export default function VatReturnDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { formatDate } = useDateSystem();
  const [loading, setLoading] = useState(true);
  const [vatReturn, setVatReturn] = useState<VATReturn | null>(null);

  useEffect(() => {
    fetchVATReturn();
  }, [id]);

  const fetchVATReturn = async () => {
    try {
      setLoading(true);
      const data = await vatReturnsAPI.get(id);
      setVatReturn(data);
    } catch (error: unknown) {
      console.error("Failed to load VAT return:", error);
      toast.error("Failed to load VAT return");
    } finally {
      setLoading(false);
    }
  };

  const handleFileReturn = async () => {
    if (!vatReturn) return;
    if (!confirm("File this VAT return? This marks it as submitted to IRD.")) return;

    try {
      await vatReturnsAPI.file(id);
      toast.success("VAT return filed successfully");
      fetchVATReturn();
    } catch (error: unknown) {
      console.error("Failed to file VAT return:", error);
      toast.error("Failed to file VAT return");
    }
  };

  const handleMarkPaid = async () => {
    if (!vatReturn) return;
    if (!confirm("Mark this return as paid?")) return;

    try {
      await vatReturnsAPI.markPaid(id);
      toast.success("VAT return marked as paid");
      fetchVATReturn();
    } catch (error: unknown) {
      console.error("Failed to mark VAT return as paid:", error);
      toast.error("Failed to mark VAT return as paid");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="VAT Return" subtitle="Loading..." />
        <PageLoading message="Loading…" />
      </div>
    );
  }

  if (!vatReturn) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="VAT Return" subtitle="Not found" />
        <div className="flex-1 p-6">
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <p className="text-gray-500">VAT return not found</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push("/dashboard/accounting/tax-management")}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Tax Management
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title={vatReturn.return_number} subtitle={`VAT Return · ${vatReturn.period}`} />
      <div className="flex-1 p-6 space-y-4 max-w-4xl">

        <div className="flex items-center justify-between">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[vatReturn.status] ?? "bg-gray-100 text-gray-600"}`}>
            {vatReturn.status.charAt(0).toUpperCase() + vatReturn.status.slice(1)}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/accounting/tax-management")} className="gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            {vatReturn.status === "draft" && (
              <Button size="sm" onClick={handleFileReturn} className="bg-blue-600 hover:bg-blue-700 text-white">
                File Return
              </Button>
            )}
            {vatReturn.status === "filed" && (
              <Button size="sm" onClick={handleMarkPaid} className="bg-[#22C55E] hover:bg-[#16A34A] text-white">
                Mark as Paid
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Period", value: vatReturn.period },
            { label: "From Date", value: formatDate(vatReturn.from_date) },
            { label: "To Date", value: formatDate(vatReturn.to_date) },
            { label: "Net VAT Payable", value: fmt(vatReturn.net_payable) },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-sm font-semibold text-gray-800 mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Output Tax (Collected)", value: fmt(vatReturn.output_tax), color: "text-gray-800" },
            { label: "Input Tax (Paid)", value: fmt(vatReturn.input_tax), color: "text-gray-600" },
            { label: "Net Payable to IRD", value: fmt(vatReturn.net_payable), color: "text-[#22C55E] font-bold" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`text-xl mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {vatReturn.filed_date && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-gray-500">Filed Date</p>
            <p className="text-sm font-medium text-gray-800 mt-1">
              {formatDate(vatReturn.filed_date)}
            </p>
          </div>
        )}

        {vatReturn.notes && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-gray-500 mb-2">Notes</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{vatReturn.notes}</p>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-gray-600">
          Invoice-level sales and purchase VAT breakdown is not yet linked from POS/purchasing. Totals above reflect the amounts entered when this return was created.
        </div>
      </div>
    </div>
  );
}
