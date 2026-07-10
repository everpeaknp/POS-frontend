"use client";

import { PageLoading } from "@/components/shared/PageLoading";

import { FormattedDate } from "@/components/shared/FormattedDate";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Edit, Printer, FileText, XCircle, CheckCircle, Clock, ArrowLeft, CreditCard } from "lucide-react";

import { useReactToPrint } from 'react-to-print';
import { Button } from "@/components/ui/button";
import { DashHeader } from "@/components/dashboard/dash-header";
import { StatusBadge } from "@/components/sales/StatusBadge";
import { LineItemsTable } from "@/components/sales/LineItemsTable";
import { SalesSummaryBox } from "@/components/sales/SalesSummaryBox";
import { PrintableInvoice } from "@/components/sales/PrintableInvoice";
import { salesOrderAPI, type SalesOrder } from "@/lib/api/sales";
import { useCompanyInfo } from "@/lib/hooks/useCompanyInfo";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<SalesOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const { companyInfo } = useCompanyInfo();

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await salesOrderAPI.get(id);
        setOrder(response.data);
      } catch (error: any) {
        console.error('Error fetching order:', error);
        toast.error("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrder();
    }
  }, [id]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!order) return;
    
    const confirmMessage = newStatus === 'Cancelled' 
      ? 'Cancel this order?' 
      : `Update status to ${newStatus}?`;
    
    const warningMessage = newStatus === 'Cancelled'
      ? 'This action cannot be undone.'
      : 'This will update the order status.';

    const isDestructive = newStatus === 'Cancelled';

    // Show confirmation toast with action buttons
    const performUpdate = async () => {
      setUpdating(true);
      try {
        await salesOrderAPI.updateStatus(order.id, newStatus);
        toast.success(`Order status updated to ${newStatus}`);
        
        // Refresh order data
        const response = await salesOrderAPI.get(id);
        setOrder(response.data);
      } catch (error: any) {
        console.error('Error updating status:', error);
        toast.error("Failed to update order status");
      } finally {
        setUpdating(false);
      }
    };

    // Show custom confirmation toast in center of screen
    toast((t) => (
      <div className="flex flex-col gap-4 min-w-[320px] p-2">
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            isDestructive ? 'bg-red-100' : 'bg-green-100'
          }`}>
            {isDestructive ? (
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-[#22C55E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-base">{confirmMessage}</p>
            <p className="text-sm text-gray-600 mt-1">{warningMessage}</p>
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
              performUpdate();
            }}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
              isDestructive 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-[#22C55E] hover:bg-[#16A34A]'
            }`}
          >
            Confirm
          </button>
        </div>
      </div>
    ), {
      duration: Infinity,
      position: 'top-center',
      style: {
        marginTop: '40vh',
        background: 'white',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        borderRadius: '12px',
        padding: '16px',
      },
    });
  };

  const handleFinalizeOnCredit = async () => {
    if (!order) return;

    toast((t) => (
      <div className="flex flex-col gap-4 min-w-[320px] p-2">
        <p className="font-semibold text-gray-900">Finalize on credit?</p>
        <p className="text-sm text-gray-600">
          This will post Rs. {Number(order.total).toLocaleString()} to the customer ledger and mark the order as delivered.
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={() => toast.dismiss(t.id)} className="px-4 py-2 text-sm border rounded-lg">Cancel</button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              setUpdating(true);
              try {
                await salesOrderAPI.finalizeOnCredit(String(order.id));
                toast.success("Order finalized on credit");
                const response = await salesOrderAPI.get(id);
                setOrder(response.data);
              } catch (error: unknown) {
                const err = error as { response?: { data?: { error?: string } } };
                toast.error(err.response?.data?.error || "Failed to finalize on credit");
              } finally {
                setUpdating(false);
              }
            }}
            className="px-4 py-2 text-sm text-white bg-[#22C55E] rounded-lg"
          >
            Confirm
          </button>
        </div>
      </div>
    ), { duration: Infinity, position: "top-center" });
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${order?.order_number || 'Order'}_${new Date().toISOString().split('T')[0]}`,
  });

  if (loading) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <DashHeader title="Loading..." subtitle="Sales Order" />
        <PageLoading message="Loading…" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <DashHeader title="Order Not Found" subtitle="Sales Order" />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="text-gray-500">The order you're looking for doesn't exist.</p>
          <Link href="/dashboard/sales/orders">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Orders
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Convert line items to the format expected by LineItemsTable
  const lineItems = order.lines?.map(line => ({
    id: line.id || '',
    product: line.product_name || line.product,
    description: line.description || '',
    qty: Number(line.quantity),
    unit: 'Pcs', // You might want to get this from product data
    unitPrice: Number(line.unit_price),
    discount: Number(line.discount_percent),
    tax: Number(line.tax_percent),
    amount: Number(line.amount),
  })) || [];

  const subtotal = Number(order.subtotal);
  const totalDiscount = Number(order.discount);
  const totalTax = Number(order.tax);
  const grandTotal = Number(order.total);

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashHeader 
        title={order.order_number} 
        subtitle={`Sales Order · ${order.date}`} 
      />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="w-full min-h-full space-y-6">
          {/* Action bar */}
          <div className="flex flex-wrap items-center gap-2 sticky top-0 z-10 bg-[#F3F4F6] py-2 -mx-1 px-1">
            <Link href="/dashboard/sales/orders">
              <Button variant="outline" size="sm" className="gap-1.5 h-8">
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </Button>
            </Link>
            <StatusBadge status={order.status} />
            <div className="flex-1" />
            
            {order.status === 'Draft' && (
              <>
                <Link href={`/dashboard/sales/orders/${order.id}/edit`}>
                  <Button variant="outline" size="sm" className="gap-1.5 h-8">
                    <Edit className="h-3.5 w-3.5" /> Edit
                  </Button>
                </Link>
                <Button 
                  size="sm" 
                  onClick={() => handleStatusUpdate('Confirmed')}
                  disabled={updating}
                  className="bg-blue-500 hover:bg-blue-600 text-white gap-1.5 h-8"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  Confirm Order
                </Button>
              </>
            )}
            
            {order.status === 'Confirmed' && order.payment_type !== 'credit' && (
              <Button 
                size="sm" 
                onClick={() => handleStatusUpdate('Delivered')}
                disabled={updating}
                className="bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5 h-8"
              >
                  <CheckCircle className="h-3.5 w-3.5" />
                Mark as Delivered
              </Button>
            )}

            {order.status === 'Confirmed' && order.payment_type === 'credit' && (
              <Button
                size="sm"
                onClick={handleFinalizeOnCredit}
                disabled={updating}
                className="bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5 h-8"
              >
                  <CreditCard className="h-3.5 w-3.5" />
                Deliver & Post to Credit
              </Button>
            )}
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePrint}
              className="gap-1.5 h-8"
            >
              <Printer className="h-3.5 w-3.5" /> Print / PDF
            </Button>
            
            {order.status !== 'Cancelled' && order.status !== 'Delivered' && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleStatusUpdate('Cancelled')}
                disabled={updating}
                className="gap-1.5 h-8 text-red-500 border-red-200 hover:bg-red-50"
              >
                  <XCircle className="h-3.5 w-3.5" />
                Cancel
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Left column — order & customer info */}
            <div className="xl:col-span-4 space-y-6">
              <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-3">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Order Info</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Order #</span>
                  <span className="font-medium text-gray-800">{order.order_number}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Date</span>
                  <span className="font-medium text-gray-800">
                    <FormattedDate value={order.date} />
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Reference</span>
                  <span className="font-medium text-gray-800">{order.reference || "—"}</span>
                </div>
                {order.payment_type && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Payment Type</span>
                    <span className="font-medium text-gray-800 capitalize">{order.payment_type}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm items-center">
                  <span className="text-gray-500">Status</span>
                  <StatusBadge status={order.status} />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Created By</span>
                  <span className="font-medium text-gray-800">{order.created_by_name || "—"}</span>
                </div>
              </div>
              
              <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-3">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Name</span>
                  <span className="font-medium text-gray-800">{order.customer_name || order.customer}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total Amount</span>
                  <span className="font-semibold text-[#22C55E]">{formatCurrency(order.total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Items</span>
                  <span className="font-medium text-gray-800">{order.items_count || lineItems.length}</span>
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Activity</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <FileText className="h-4 w-4 mt-0.5 shrink-0 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">Order Created</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" />
                        {new Date(order.created_at).toLocaleString('en-GB')}
                      </p>
                    </div>
                  </div>
                  
                  {order.status !== 'Draft' && (
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-800">Order Confirmed</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {new Date(order.updated_at).toLocaleString('en-GB')}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {order.status === 'Delivered' && (
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-green-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-800">Delivered</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {new Date(order.updated_at).toLocaleString('en-GB')}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {order.status === 'Cancelled' && (
                    <div className="flex items-start gap-3">
                      <XCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-800">Order Cancelled</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {new Date(order.updated_at).toLocaleString('en-GB')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right column — line items & notes */}
            <div className="xl:col-span-8 space-y-6">
              <div className="bg-white rounded-xl border border-gray-100 p-5 lg:p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Line Items</h3>
                <LineItemsTable items={lineItems} onChange={() => {}} readOnly />
                <div className="flex justify-end mt-6">
                  <SalesSummaryBox 
                    subtotal={subtotal} 
                    totalDiscount={totalDiscount} 
                    totalTax={totalTax} 
                    grandTotal={grandTotal} 
                  />
                </div>
              </div>

              {order.notes && (
                <div className="bg-white rounded-xl border border-gray-100 p-5 lg:p-6 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Notes</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{order.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Printable Invoice */}
      {companyInfo && order && (
        <div className="hidden">
          <PrintableInvoice ref={printRef} order={order} companyInfo={companyInfo} />
        </div>
      )}
    </div>
  );
}
