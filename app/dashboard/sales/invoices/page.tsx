"use client";

import { FormattedDate } from "@/components/shared/FormattedDate";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, MoreVertical, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DashHeader } from "@/components/dashboard/dash-header";
import { StatusBadge } from "@/components/sales/StatusBadge";
import { RecordPaymentModal } from "@/components/sales/RecordPaymentModal";
import { EmptyState } from "@/components/shared/EmptyState";
import { SkeletonTable } from "@/components/shared/Skeleton";
import { useApi } from "@/lib/hooks/useApi";
import { invoiceAPI } from "@/lib/api/sales";
import toast from "react-hot-toast";
import { Receipt } from "lucide-react";

interface Invoice {
  id: string;
  invoice_number: string;
  date: string;
  customer?: string;
  customer_name?: string;
  amount: number;
  paid_amount: number;
  balance: number;
  payment_type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

function InvoiceActions({
  invoiceId,
  invoiceNumber,
  balance,
  status,
  onView,
  onEdit,
  onRecordPayment,
  onDelete,
}: {
  invoiceId: string;
  invoiceNumber: string;
  balance: number;
  status: string;
  onView: () => void;
  onEdit: () => void;
  onRecordPayment: (id: string, num: string, bal: number) => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="p-1 rounded hover:bg-gray-100 focus:outline-none">
        <MoreVertical className="h-4 w-4 text-gray-400" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={onView} className="cursor-pointer">
          View
        </DropdownMenuItem>
        {balance > 0 && status !== "Paid" && status !== "Draft" && (
          <DropdownMenuItem
            onClick={() => onRecordPayment(invoiceId, invoiceNumber, balance)}
            className="cursor-pointer"
          >
            Record Payment
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            window.open(`/dashboard/sales/invoices/${invoiceId}?print=1`, "_blank");
          }}
          className="cursor-pointer gap-2"
        >
          <Printer className="h-4 w-4" />
          Print
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-red-600 focus:text-red-600 cursor-pointer"
          onClick={onDelete}
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function InvoicesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [paymentModal, setPaymentModal] = useState<{
    open: boolean;
    id: string;
    invoiceNumber: string;
    balance: number;
  }>({ open: false, id: "", invoiceNumber: "", balance: 0 });

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [allStatuses, setAllStatuses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const { data: invoicesData } = useApi(
    () =>
      invoiceAPI.list({
        search: search || undefined,
        status: status === "All" ? undefined : status,
      }),
    { immediate: true, deps: [search, status] }
  );

  // Fetch only invoices
  useEffect(() => {
    const loadInvoices = async () => {
      try {
        setLoading(true);

        // Fetch invoices only
        const invoiceList: Invoice[] = invoicesData?.data?.results || [];

        console.log("Loaded invoices:", invoiceList); // Debug log

        // Get all available statuses from invoices
        const statuses = Array.from(
          new Set(invoiceList.map((inv) => inv.status).filter(Boolean))
        );
        setAllStatuses(["All", ...statuses]);

        setInvoices(invoiceList);
      } catch (error) {
        console.error("Failed to load invoices:", error);
        toast.error("Failed to load invoices");
      } finally {
        setLoading(false);
      }
    };

    if (invoicesData) {
      loadInvoices();
    }
  }, [invoicesData]);

  // Apply filters
  const filteredInvoices = invoices.filter((invoice) => {
    // Status filter
    if (status !== "All" && invoice.status !== status) {
      return false;
    }
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        invoice.invoice_number?.toLowerCase().includes(searchLower) ||
        invoice.customer_name?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const handleView = (id: string) => {
    router.push(`/dashboard/sales/invoices/${id}`);
  };

  const handleEdit = (id: string) => {
    router.push(`/dashboard/sales/invoices/${id}/edit`);
  };

  const handleRecordPayment = (id: string, invoiceNumber: string, balance: number) => {
    setPaymentModal({ open: true, id, invoiceNumber, balance });
  };

  const handleDelete = async (id: string, invoiceNumber: string) => {
    const confirmDelete = () => {
      toast.promise(
        invoiceAPI.delete(id),
        {
          loading: "Deleting invoice...",
          success: () => {
            location.reload();
            return "Invoice deleted successfully";
          },
          error: (err) => err.response?.data?.message || "Failed to delete invoice",
        }
      );
    };

    toast((t) => (
      <div className="flex flex-col gap-4 min-w-[320px] p-2">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-base">
              Delete invoice {invoiceNumber}?
            </p>
            <p className="text-sm text-gray-600 mt-1">
              This action cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              confirmDelete();
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    ));
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Sales Invoices" subtitle="Loading..." />
        <div className="flex-1 p-6">
          <SkeletonTable rows={10} />
        </div>
      </div>
    );
  }

  if (
    invoices.length === 0 &&
    !search &&
    status === "All" &&
    !loading
  ) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader
          title="Sales Invoices"
          subtitle="Manage your sales invoices"
        />
        <div className="flex-1 p-6">
          <EmptyState
            icon={Receipt}
            title="No invoices yet"
            description="Create your first invoice to get started"
            actionLabel="New Invoice"
            actionHref="/dashboard/sales/invoices/new"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader
        title="Sales Invoices"
        subtitle={`${filteredInvoices.length} invoices`}
      />
      <div className="flex-1 p-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search invoices..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 w-52 text-sm border-gray-200 bg-white"
              />
            </div>

            {/* Status Filter */}
            <Select value={status} onValueChange={(v) => setStatus(v ?? "All")}>
              <SelectTrigger className="h-9 w-40 text-sm border-gray-200 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allStatuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* New Invoice Button */}
          <Link href="/dashboard/sales/invoices/new">
            <Button
              size="sm"
              className="h-9 bg-[var(--color-accent-custom,#22C55E)] hover:bg-[#16A34A] text-white gap-1.5"
            >
              <Plus className="h-4 w-4" /> New Invoice
            </Button>
          </Link>
        </div>

        {/* Invoices Table */}
        {filteredInvoices.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <p className="text-gray-500">
              No invoices found matching your filters
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Invoice Number
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Balance
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredInvoices.map((invoice: Invoice) => (
                    <tr
                      key={invoice.id}
                      onClick={() => handleView(invoice.id)}
                      className={`group cursor-pointer transition-all duration-150 hover:bg-gray-50 active:bg-gray-100 ${
                        invoice.status === "Overdue" ? "border-l-4 border-l-red-500" : ""
                      }`}
                    >
                      {/* Invoice Number */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold text-gray-900 group-hover:text-[var(--color-accent-custom,#22C55E)] transition-colors">
                            {invoice.invoice_number}
                          </span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          <FormattedDate value={invoice.date} />
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">
                          {invoice.customer_name || "Walk-in Customer"}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-semibold text-gray-900">
                          Rs. {invoice.amount.toLocaleString()}
                        </span>
                      </td>

                      {/* Balance */}
                      <td className="px-6 py-4 text-right">
                        <span className={`text-sm font-semibold ${
                          invoice.balance > 0 ? "text-red-600" : "text-green-600"
                        }`}>
                          Rs. {invoice.balance.toLocaleString()}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <StatusBadge status={invoice.status} />
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex"
                        >
                          <InvoiceActions
                            invoiceId={invoice.id}
                            invoiceNumber={invoice.invoice_number}
                            balance={invoice.balance}
                            status={invoice.status}
                            onView={() => handleView(invoice.id)}
                            onEdit={() => handleEdit(invoice.id)}
                            onRecordPayment={(id, num, bal) =>
                              handleRecordPayment(id, num, bal)
                            }
                            onDelete={() =>
                              handleDelete(invoice.id, invoice.invoice_number)
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      <RecordPaymentModal
        open={paymentModal.open}
        onClose={() =>
          setPaymentModal({ open: false, id: "", invoiceNumber: "", balance: 0 })
        }
        invoiceId={paymentModal.id}
        invoiceNumber={paymentModal.invoiceNumber}
        balance={paymentModal.balance}
        onSuccess={() => {
          location.reload();
        }}
      />
    </div>
  );
}
