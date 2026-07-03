"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, FileText, Calendar, DollarSign, User, Loader2, Trash2, Printer } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { DashHeader } from "@/components/dashboard/dash-header";
import { PrintableSalesInvoice } from "@/components/print/PrintableSalesInvoice";
import { invoiceAPI, salesOrderAPI, Invoice, SalesOrder } from "@/lib/api/sales";
import { useCompanyInfo } from "@/lib/hooks/useCompanyInfo";
import toast from "react-hot-toast";
import { format } from "date-fns";

const statusColors = {
  Draft: "bg-gray-100 text-gray-700",
  Sent: "bg-blue-100 text-blue-700",
  "Partially Paid": "bg-yellow-100 text-yellow-700",
  Paid: "bg-green-100 text-green-700",
  Overdue: "bg-red-100 text-red-700",
};

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const invoiceId = params.id as string;
  const printRef = useRef<HTMLDivElement>(null);
  const { companyInfo } = useCompanyInfo();
  
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [salesOrder, setSalesOrder] = useState<SalesOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${invoice?.invoice_number || "Invoice"}_${new Date().toISOString().split("T")[0]}`,
  });

  useEffect(() => {
    if (invoiceId) {
      loadInvoice();
    }
  }, [invoiceId]);

  const loadInvoice = async () => {
    try {
      const response = await invoiceAPI.get(invoiceId);
      setInvoice(response.data);

      if (response.data.sales_order) {
        try {
          const orderResponse = await salesOrderAPI.get(response.data.sales_order);
          setSalesOrder(orderResponse.data);
        } catch {
          setSalesOrder(null);
        }
      }
    } catch (error) {
      console.error("Error loading invoice:", error);
      toast.error("Failed to load invoice");
      router.push("/dashboard/sales/invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchParams.get("print") === "1" && invoice && companyInfo && !loading) {
      const timer = setTimeout(() => handlePrint(), 300);
      return () => clearTimeout(timer);
    }
  }, [searchParams, invoice, companyInfo, loading, handlePrint]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this invoice?")) {
      return;
    }

    setDeleting(true);
    try {
      await invoiceAPI.delete(invoiceId);
      toast.success("Invoice deleted successfully");
      router.push("/dashboard/sales/invoices");
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast.error("Failed to delete invoice");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Invoice Details" subtitle="Loading..." />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Invoice Not Found" subtitle="The invoice could not be found" />
        <div className="flex-1 flex items-center justify-center">
          <Button onClick={() => router.push("/dashboard/sales/invoices")}>
            Back to Invoices
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader 
        title={`Invoice ${invoice.invoice_number}`} 
        subtitle={`Customer: ${invoice.customer_name}`}
      />
      
      <div className="flex-1 p-6 space-y-6">
        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/sales/invoices")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Invoices
          </Button>
          <div className="flex-1" />
          <Button
            variant="outline"
            onClick={() => handlePrint()}
            disabled={!companyInfo}
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button
            variant="outline"
            onClick={handleDelete}
            disabled={deleting}
            className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
          >
            {deleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete
              </>
            )}
          </Button>
        </div>

        {/* Invoice Details */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#22C55E] to-[#16A34A] p-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">{invoice.invoice_number}</h2>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                      statusColors[invoice.status as keyof typeof statusColors]
                    }`}
                  >
                    {invoice.status}
                  </span>
                  <span className="text-sm opacity-90">
                    {invoice.payment_type === "credit" ? "Credit Sale" : "Cash Sale"}
                  </span>
                </div>
              </div>
              <FileText className="h-12 w-12 opacity-80" />
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Customer & Dates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-gray-500 mb-1">Customer</div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="font-medium text-gray-900">{invoice.customer_name}</span>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Invoice Date</div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">
                    {format(new Date(invoice.date), "MMM dd, yyyy")}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Due Date</div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">
                    {format(new Date(invoice.due_date), "MMM dd, yyyy")}
                  </span>
                </div>
              </div>
            </div>

            {/* Sales Order Link */}
            {invoice.sales_order && (
              <div className="border-t border-gray-100 pt-4">
                <div className="text-sm text-gray-500 mb-1">Linked Sales Order</div>
                <Button
                  variant="link"
                  onClick={() => router.push(`/dashboard/sales/orders/${invoice.sales_order}`)}
                  className="p-0 h-auto text-[#22C55E] hover:text-[#16A34A]"
                >
                  View Sales Order
                </Button>
              </div>
            )}

            {/* Financial Summary */}
            <div className="border-t border-gray-100 pt-6">
              <div className="bg-gray-50 rounded-lg p-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Invoice Amount</span>
                  <span className="text-xl font-semibold text-gray-900">
                    Rs. {Number(invoice.amount).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Paid Amount</span>
                  <span className="text-lg font-medium text-green-600">
                    Rs. {Number(invoice.paid_amount).toLocaleString()}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                  <span className="text-gray-900 font-medium">Balance Due</span>
                  <span className={`text-2xl font-bold ${
                    invoice.balance > 0 ? "text-red-600" : "text-green-600"
                  }`}>
                    Rs. {Number(invoice.balance).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="border-t border-gray-100 pt-4">
                <div className="text-sm text-gray-500 mb-2">Notes</div>
                <p className="text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
              </div>
            )}

            {/* Metadata */}
            <div className="border-t border-gray-100 pt-4 text-xs text-gray-500 space-y-1">
              <div>Created by: {invoice.created_by_name || "System"}</div>
              <div>Created: {format(new Date(invoice.created_at), "MMM dd, yyyy 'at' hh:mm a")}</div>
              <div>Last updated: {format(new Date(invoice.updated_at), "MMM dd, yyyy 'at' hh:mm a")}</div>
            </div>
          </div>
        </div>
      </div>

      {companyInfo && (
        <div className="hidden">
          <PrintableSalesInvoice
            ref={printRef}
            invoice={invoice}
            salesOrder={salesOrder}
            companyInfo={companyInfo}
          />
        </div>
      )}
    </div>
  );
}
