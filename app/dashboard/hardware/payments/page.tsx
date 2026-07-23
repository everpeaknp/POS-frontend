"use client";

import { FormattedDate } from "@/components/shared/FormattedDate";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  HardwarePageShell,
  hardwareCardClass,
  hardwareTableWrapClass,
} from "@/components/dashboard/HardwarePageShell";
import { EmptyState } from "@/components/shared/EmptyState";
import { RecordPaymentModal } from "@/components/hardware/RecordPaymentModal";
import { paymentReceivedAPI, type PaymentReceived } from "@/lib/api/sales";
import { HARDWARE_LIST_PARAMS } from "@/lib/api/hardware-helpers";
import { formatNPR } from "@/lib/utils";
import toast from "react-hot-toast";

const METHOD_STYLES: Record<string, string> = {
  cash: "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400",
  bank_transfer: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  bank: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  cheque: "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
};

const METHOD_FILTERS = [
  { value: "all", label: "All Methods" },
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank Transfer" },
  { value: "cheque", label: "Cheque" },
  { value: "esewa", label: "eSewa" },
  { value: "khalti", label: "Khalti" },
  { value: "fonepay", label: "FonePay" },
  { value: "other", label: "Other" },
] as const;

export default function HardwarePaymentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [payments, setPayments] = useState<PaymentReceived[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);

  const openModal = useCallback(() => {
    setShowModal(true);
    router.replace("/dashboard/hardware/payments?new=1", { scroll: false });
  }, [router]);

  const closeModal = useCallback(() => {
    setShowModal(false);
    if (searchParams.get("new")) {
      router.replace("/dashboard/hardware/payments", { scroll: false });
    }
  }, [router, searchParams]);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setShowModal(true);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const data = await paymentReceivedAPI.list(HARDWARE_LIST_PARAMS);
      const paymentList = Array.isArray(data) ? data : (data as { results?: PaymentReceived[] }).results || [];
      setPayments(paymentList);
    } catch (error) {
      console.error("Failed to fetch payments:", error);
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter((payment) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      payment.payment_number?.toLowerCase().includes(q) ||
      payment.customer_name?.toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (methodFilter === "all") return true;

    const method = payment.payment_method || "";
    if (methodFilter === "bank") {
      return method === "bank" || method === "bank_transfer";
    }
    return method === methodFilter;
  });

  if (!loading && payments.length === 0 && !searchTerm && methodFilter === "all") {
    return (
      <>
        <HardwarePageShell
          title="Hardware Payments"
          subtitle="Track customer payments and credit settlements"
        >
          <EmptyState
            icon={CreditCard}
            title="No payments yet"
            description="Record your first payment to track customer credit settlements"
            actionLabel="Record Payment"
            onAction={openModal}
          />
        </HardwarePageShell>
        <RecordPaymentModal open={showModal} onClose={closeModal} onSuccess={fetchPayments} />
      </>
    );
  }

  return (
    <HardwarePageShell
      title="Hardware Payments"
      subtitle="Track customer payments and credit settlements"
      loading={loading}
    >
      <div className="flex gap-3 items-center justify-between">
        <div className="flex gap-3 items-center flex-1 min-w-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by payment number or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-sm border-gray-200"
            />
          </div>
          <Select value={methodFilter} onValueChange={(v) => setMethodFilter(v || "all")}>
            <SelectTrigger className="w-[160px] h-9 border-gray-200 shrink-0">
              <SelectValue placeholder="All Methods" />
            </SelectTrigger>
            <SelectContent>
              {METHOD_FILTERS.map((method) => (
                <SelectItem key={method.value} value={method.value}>
                  {method.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={openModal}
          className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5 shrink-0"
        >
          <Plus className="h-4 w-4" /> Record Payment
        </Button>
      </div>

      {filteredPayments.length === 0 ? (
        <div className={`${hardwareCardClass} p-12 text-center`}>
          <p className="text-gray-500 dark:text-muted-foreground">No payments found matching your search</p>
        </div>
      ) : (
      <div className={hardwareTableWrapClass}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-muted/50 border-b border-gray-100 dark:border-border">
              <tr>
                {["Payment #", "Customer", "Date", "Amount", "Method"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-muted-foreground uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-border">
              {filteredPayments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-foreground">
                      {payment.payment_number}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground">
                      {payment.customer_name}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-muted-foreground">
                      <FormattedDate value={payment.date} />
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-foreground tabular-nums font-medium">
                      {formatNPR(payment.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          METHOD_STYLES[payment.payment_method] ||
                          "bg-gray-100 text-gray-700 dark:bg-muted dark:text-muted-foreground"
                        }`}
                      >
                        {payment.payment_method.replace(/_/g, " ")}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      <RecordPaymentModal
        open={showModal}
        onClose={closeModal}
        onSuccess={fetchPayments}
      />
    </HardwarePageShell>
  );
}
