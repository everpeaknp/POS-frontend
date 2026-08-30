"use client";

import { FormattedDate } from "@/components/shared/FormattedDate";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, MoreVertical, Printer, Receipt, Download, Eye } from "lucide-react";
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
import posApi from "@/lib/api/pos";
import toast from "react-hot-toast";
import {
  mergeSalesRecords,
  getSalesRecordNumber,
  getSalesRecordCustomer,
  getSalesRecordAmount,
  getSalesRecordStatus,
  filterByType,
  searchSalesRecords,
  filterByStatus,
  getAllStatuses,
  type SalesRecord,
} from "@/lib/utils/sales-records-merger";
import { downloadReceiptPDF, preparePrint } from "@/lib/utils/receipt-generator";

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

interface POSTransaction {
  id: string;
  transaction_number: string;
  date: string;
  customer?: string;
  customer_name?: string;
  total: number;
  status: string;
  payment_method: string;
  lines?: any[];
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  amount_paid: number;
  change_given: number;
  cashier_name?: string;
  created_at: string;
}

function SalesRecordTypeBadge({ type }: { type: "invoice" | "receipt" }) {
  return (
    <Badge
      variant="outline"
      className={
        type === "invoice"
          ? "bg-blue-50 text-blue-700 border-blue-200"
          : "bg-green-50 text-green-700 border-green-200"
      }
    >
      {type === "invoice" ? "Invoice" : "Receipt"}
    </Badge>
  );
}

function generateReceiptHTML(transaction: POSTransaction): string {
  const lines = transaction.lines || [];
  const itemsHTML = lines
    .map(
      (line: any) =>
        `
    <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #ddd;">
      <div>
        <div style="font-weight: bold;">${line.product_name || "Product"}</div>
        <div style="font-size: 0.875rem; color: #666;">
          ${line.quantity} × Rs. ${Number(line.unit_price).toFixed(2)}
        </div>
      </div>
      <div style="font-weight: bold;">Rs. ${Number(line.line_total || line.quantity * line.unit_price).toFixed(2)}</div>
    </div>
  `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: 'Courier New', monospace;
            margin: 0;
            padding: 10mm;
            max-width: 80mm;
            background: white;
          }
          .receipt-container {
            width: 100%;
          }
          .receipt-header {
            text-align: center;
            border-bottom: 1px solid #000;
            padding-bottom: 8px;
            margin-bottom: 8px;
          }
          .receipt-footer {
            text-align: center;
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid #000;
          }
          .item-row {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
          }
          .total-row {
            font-weight: bold;
            border-top: 2px solid #000;
            border-bottom: 2px solid #000;
            padding: 4px 0;
            margin: 8px 0;
          }
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="receipt-header">
            <strong>RECEIPT</strong><br>
            <small>${new Date(transaction.date || new Date()).toLocaleString()}</small>
          </div>
          
          <div style="margin: 8px 0; font-size: 0.875rem;">
            <strong>Receipt #:</strong> ${transaction.transaction_number}<br>
            <strong>Customer:</strong> ${transaction.customer_name || "Walk-in"}<br>
            ${transaction.cashier_name ? `<strong>Cashier:</strong> ${transaction.cashier_name}<br>` : ""}
          </div>

          <div style="margin: 8px 0;">
            <strong style="text-decoration: underline;">Items</strong>
            ${itemsHTML}
          </div>

          <div style="margin: 8px 0;">
            <div class="item-row">
              <span>Subtotal:</span>
              <span>Rs. ${Number(transaction.subtotal).toFixed(2)}</span>
            </div>
            ${
              transaction.discount_amount > 0
                ? `
              <div class="item-row" style="color: red;">
                <span>Discount:</span>
                <span>-Rs. ${Number(transaction.discount_amount).toFixed(2)}</span>
              </div>
            `
                : ""
            }
            <div class="item-row">
              <span>Tax:</span>
              <span>Rs. ${Number(transaction.tax_amount).toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>TOTAL:</span>
              <span>Rs. ${Number(transaction.total).toFixed(2)}</span>
            </div>
          </div>

          <div style="margin: 8px 0; font-size: 0.875rem;">
            <strong>Payment:</strong> ${transaction.payment_method}<br>
            <strong>Amount Paid:</strong> Rs. ${Number(transaction.amount_paid).toFixed(2)}<br>
            ${
              transaction.change_given > 0
                ? `<strong style="color: green;">Change:</strong> Rs. ${Number(transaction.change_given).toFixed(2)}`
                : ""
            }
          </div>

          <div class="receipt-footer">
            <small>Thank you for your purchase!</small>
          </div>
        </div>
      </body>
    </html>
  `;
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

function ReceiptActions({
  record,
  onView,
  onPrint,
  onDownload,
}: {
  record: POSTransaction;
  onView: () => void;
  onPrint: () => void;
  onDownload: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="p-1 rounded hover:bg-gray-100 focus:outline-none">
        <MoreVertical className="h-4 w-4 text-gray-400" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={onView} className="cursor-pointer gap-2">
          <Eye className="h-4 w-4" />
          View Receipt
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onPrint} className="cursor-pointer gap-2">
          <Printer className="h-4 w-4" />
          Print
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDownload} className="cursor-pointer gap-2">
          <Download className="h-4 w-4" />
          Download PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function InvoicesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [recordType, setRecordType] = useState<"all" | "invoice" | "receipt">("all");
  const [paymentModal, setPaymentModal] = useState<{
    open: boolean;
    id: string;
    invoiceNumber: string;
    balance: number;
  }>({ open: false, id: "", invoiceNumber: "", balance: 0 });

  const [salesRecords, setSalesRecords] = useState<SalesRecord[]>([]);
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

  // Fetch both invoices and POS transactions
  useEffect(() => {
    const loadSalesRecords = async () => {
      try {
        setLoading(true);

        // Fetch invoices
        const invoices: Invoice[] = invoicesData?.data?.results || [];

        // Fetch POS transactions only if POS module is enabled
        let posTransactions: POSTransaction[] = [];
        try {
          const posRes = await posApi.getTransactions({ page_size: 1000 });
          posTransactions = posRes?.results || [];
        } catch (error: any) {
          // If 403, POS module is not enabled - silently ignore
          if (error?.response?.status !== 403) {
            console.warn("Failed to load POS transactions:", error);
          }
        }

        // Merge and sort
        const merged = mergeSalesRecords(invoices, posTransactions);

        // Get all available statuses
        const statuses = getAllStatuses(merged);
        setAllStatuses(["All", ...statuses]);

        setSalesRecords(merged);
      } catch (error) {
        console.error("Failed to load sales records:", error);
        toast.error("Failed to load sales records");
      } finally {
        setLoading(false);
      }
    };

    loadSalesRecords();
  }, [invoicesData]);

  // Apply filters
  const filteredRecords = filterByStatus(
    filterByType(searchSalesRecords(salesRecords, search), recordType),
    status
  );

  const handleView = (id: string) => {
    router.push(`/dashboard/sales/invoices/${id}`);
  };

  const handleEdit = (id: string) => {
    router.push(`/dashboard/sales/invoices/${id}/edit`);
  };

  const handleRecordPayment = (id: string, invoiceNumber: string, balance: number) => {
    setPaymentModal({ open: true, id, invoiceNumber, balance });
  };

  const handleViewReceipt = (record: SalesRecord) => {
    if (record.recordType === "receipt") {
      const posData = record as POSTransaction;
      sessionStorage.setItem("viewingPOSReceipt", JSON.stringify(posData));
      window.dispatchEvent(
        new CustomEvent("openPOSReceiptModal", { detail: posData })
      );
    }
  };

  const handlePrintReceipt = async (record: SalesRecord) => {
    if (record.recordType === "receipt") {
      const posData = record as POSTransaction;
      try {
        preparePrint();
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          const content = generateReceiptHTML(posData);
          printWindow.document.write(content);
          printWindow.document.close();
          printWindow.print();
        }
      } catch (error) {
        console.error("Print error:", error);
        toast.error("Failed to print receipt");
      }
    }
  };

  const handleDownloadReceipt = async (record: SalesRecord) => {
    if (record.recordType === "receipt") {
      const posData = record as POSTransaction;
      try {
        const tempDiv = document.createElement("div");
        tempDiv.id = `receipt-temp-${posData.id}`;
        tempDiv.style.display = "none";
        tempDiv.innerHTML = generateReceiptHTML(posData);
        document.body.appendChild(tempDiv);

        await downloadReceiptPDF(`receipt-temp-${posData.id}`, posData.transaction_number);

        document.body.removeChild(tempDiv);
        toast.success("Receipt downloaded successfully");
      } catch (error) {
        console.error("PDF generation error:", error);
        toast.error("Failed to download receipt");
      }
    }
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
        <DashHeader title="Sales & Receipts" subtitle="Loading..." />
        <div className="flex-1 p-6">
          <SkeletonTable rows={10} />
        </div>
      </div>
    );
  }

  if (
    filteredRecords.length === 0 &&
    !search &&
    status === "All" &&
    recordType === "all"
  ) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader
          title="Sales & Receipts"
          subtitle="View all invoices and POS receipts"
        />
        <div className="flex-1 p-6">
          <EmptyState
            icon={Receipt}
            title="No sales records yet"
            description="Create your first invoice or complete a POS sale to see it here"
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
        title="Sales & Receipts"
        subtitle={`${filteredRecords.length} records`}
      />
      <div className="flex-1 p-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search invoices or receipts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 w-52 text-sm border-gray-200 bg-white"
              />
            </div>

            {/* Record Type Filter */}
            <Select
              value={recordType}
              onValueChange={(v) =>
                setRecordType(v as "all" | "invoice" | "receipt")
              }
            >
              <SelectTrigger className="h-9 w-40 text-sm border-gray-200 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Records</SelectItem>
                <SelectItem value="invoice">Invoices Only</SelectItem>
                <SelectItem value="receipt">Receipts Only</SelectItem>
              </SelectContent>
            </Select>

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
              className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5"
            >
              <Plus className="h-4 w-4" /> New Invoice
            </Button>
          </Link>
        </div>

        {/* Records Table */}
        {filteredRecords.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <p className="text-gray-500">
              No sales records found matching your filters
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {[
                    "Type",
                    "Number",
                    "Date",
                    "Customer",
                    "Amount",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-medium text-gray-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredRecords.map((record: SalesRecord) => (
                  <tr
                    key={`${record.recordType}-${record.id}`}
                    className={`hover:bg-gray-50/50 transition-colors ${
                      record.status === "Overdue" ? "border-l-2 border-l-red-400" : ""
                    }`}
                  >
                    {/* Type Badge */}
                    <td className="px-4 py-3">
                      <SalesRecordTypeBadge type={record.recordType} />
                    </td>

                    {/* Number */}
                    <td className="px-4 py-3 font-mono text-xs text-[#22C55E] font-medium">
                      {record.recordType === "invoice" ? (
                        <Link
                          href={`/dashboard/sales/invoices/${record.id}`}
                          className="hover:underline"
                        >
                          {getSalesRecordNumber(record)}
                        </Link>
                      ) : (
                        <span>{getSalesRecordNumber(record)}</span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-gray-600">
                      <FormattedDate value={record.date} />
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {getSalesRecordCustomer(record)}
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3 text-gray-800">
                      Rs. {getSalesRecordAmount(record).toLocaleString()}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      {record.recordType === "invoice" ? (
                        <StatusBadge status={getSalesRecordStatus(record)} />
                      ) : (
                        <Badge
                          variant="outline"
                          className={
                            record.status === "completed"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-gray-50 text-gray-700 border-gray-200"
                          }
                        >
                          {record.status}
                        </Badge>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      {record.recordType === "invoice" ? (
                        <InvoiceActions
                          invoiceId={record.id}
                          invoiceNumber={getSalesRecordNumber(record)}
                          balance={(record as any).balance || 0}
                          status={record.status}
                          onView={() => handleView(record.id)}
                          onEdit={() => handleEdit(record.id)}
                          onRecordPayment={(id, num, bal) =>
                            handleRecordPayment(id, num, bal)
                          }
                          onDelete={() =>
                            handleDelete(
                              record.id,
                              getSalesRecordNumber(record)
                            )
                          }
                        />
                      ) : (
                        <ReceiptActions
                          record={record as POSTransaction}
                          onView={() => handleViewReceipt(record)}
                          onPrint={() => handlePrintReceipt(record)}
                          onDownload={() => handleDownloadReceipt(record)}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
