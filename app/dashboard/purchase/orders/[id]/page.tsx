"use client";

import { PageLoading } from "@/components/shared/PageLoading";

import { FormattedDate } from "@/components/shared/FormattedDate";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Edit, Package, XCircle, CheckCircle, Clock, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashHeader } from "@/components/dashboard/dash-header";
import { StatusBadge } from "@/components/purchase/StatusBadge";
import { LineItemsTable } from "@/components/purchase/LineItemsTable";
import { SalesSummaryBox } from "@/components/sales/SalesSummaryBox";
import { ReceiveItemsModal } from "@/components/purchase/ReceiveItemsModal";
import { purchaseOrdersAPI, type PurchaseOrder } from "@/lib/api/purchase";
import { inventoryApi, type ProductActivity, type Warehouse } from "@/lib/api/inventory";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";

export default function PurchaseOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  useEffect(() => {
    inventoryApi.warehouses.list({ is_active: true }).then((res) => {
      setWarehouses(res.data.results || []);
    }).catch(() => {});
  }, []);

  const refreshOrder = async () => {
    if (!id) return;
    const data = await purchaseOrdersAPI.get(id);
    setOrder(data);
  };

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await purchaseOrdersAPI.get(id);
        setOrder(data);
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

  useEffect(() => {
    if (searchParams.get("receive") === "1" && order && !loading) {
      setShowReceiveModal(true);
    }
  }, [searchParams, order, loading]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!order) return;
    
    const confirmMessage = newStatus === 'Cancelled' 
      ? 'Cancel this purchase order?' 
      : `Update status to ${newStatus}?`;
    
    const warningMessage = newStatus === 'Cancelled'
      ? 'This action cannot be undone.'
      : 'This will update the order status.';

    const isDestructive = newStatus === 'Cancelled';

    const performUpdate = async () => {
      setUpdating(true);
      try {
        await purchaseOrdersAPI.updateStatus(order.id, newStatus);
        toast.success(`Order status updated to ${newStatus}`);
        
        // Refresh order data
        const data = await purchaseOrdersAPI.get(id);
        setOrder(data);
      } catch (error: any) {
        console.error('Error updating status:', error);
        toast.error("Failed to update order status");
      } finally {
        setUpdating(false);
      }
    };

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

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Loading..." subtitle="Purchase Order" />
        <PageLoading message="Loading…" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Order Not Found" subtitle="Purchase Order" />
        <div className="flex-1 p-6 flex flex-col items-center justify-center">
          <p className="text-gray-500 mb-4">The order you're looking for doesn't exist.</p>
          <Link href="/dashboard/purchase/orders">
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
    unit: 'Pcs',
    unitPrice: Number(line.unit_price),
    discount: 0,
    tax: Number(line.tax_percent),
    amount: Number(line.amount),
  })) || [];

  const subtotal = Number(order.subtotal);
  const totalDiscount = 0;
  const totalTax = Number(order.tax);
  const grandTotal = Number(order.total);

  const canReceiveItems = order.status === 'Sent' || order.status === 'Partially Received';

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader 
        title={order.po_number} 
        subtitle={`Purchase Order · ${order.date}`}
      />
      <div className="flex-1 p-6 space-y-4 max-w-5xl">
        {/* Action bar */}
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={order.status} />
          <div className="flex-1" />
          
          {order.status === 'Draft' && (
            <>
              <Link href={`/dashboard/purchase/orders/${order.id}/edit`}>
                <Button variant="outline" size="sm" className="gap-1.5 h-8">
                  <Edit className="h-3.5 w-3.5" /> Edit
                </Button>
              </Link>
              <Button 
                size="sm" 
                onClick={() => handleStatusUpdate('Sent')}
                disabled={updating}
                className="bg-blue-500 hover:bg-blue-600 text-white gap-1.5 h-8"
              >
                {updating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                Send Order
              </Button>
            </>
          )}
          
          {canReceiveItems && (
            <Button 
              size="sm" 
              onClick={() => setShowReceiveModal(true)}
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5 h-8"
            >
              <Package className="h-3.5 w-3.5" />
              Receive Items
            </Button>
          )}
          
          {order.status !== 'Cancelled' && order.status !== 'Received' && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleStatusUpdate('Cancelled')}
              disabled={updating}
              className="gap-1.5 h-8 text-red-500 border-red-200 hover:bg-red-50"
            >
              {updating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
              Cancel
            </Button>
          )}
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Order Info</h3>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">PO #</span>
              <span className="font-medium text-gray-800">{order.po_number}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Date</span>
              <span className="font-medium text-gray-800">
                <FormattedDate value={order.date} />
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Expected Delivery</span>
              <span className="font-medium text-gray-800">
                <FormattedDate value={order.expected_delivery_date} />
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Payment Terms</span>
              <span className="font-medium text-gray-800">{order.payment_terms}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Status</span>
              <StatusBadge status={order.status} />
            </div>
            {order.created_by_name && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Created By</span>
                <span className="font-medium text-gray-800">{order.created_by_name}</span>
              </div>
            )}
          </div>
          
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Supplier</h3>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Name</span>
              <span className="font-medium text-gray-800">{order.supplier_name || order.supplier}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Amount</span>
              <span className="font-medium text-gray-800">{formatCurrency(order.total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Items</span>
              <span className="font-medium text-gray-800">{order.items_count || lineItems.length}</span>
            </div>
          </div>
        </div>

        {/* Line items */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Line Items</h3>
          <LineItemsTable items={lineItems} onChange={() => {}} readOnly />
          
          {/* Show received quantities */}
          {order.lines && order.lines.some(line => Number(line.received_quantity || 0) > 0) && (
            <div className="mt-4 border-t pt-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Receiving Status</h4>
              <div className="space-y-2">
                {order.lines.map(line => {
                  const received = Number(line.received_quantity || 0);
                  const ordered = Number(line.quantity);
                  if (received === 0) return null;
                  
                  return (
                    <div key={line.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">{line.product_name}</span>
                      <span className="font-medium text-gray-800">
                        {received} / {ordered} received
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          <div className="flex justify-end mt-4">
            <SalesSummaryBox 
              subtotal={subtotal} 
              totalDiscount={totalDiscount} 
              totalTax={totalTax} 
              grandTotal={grandTotal} 
            />
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Notes</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{order.notes}</p>
          </div>
        )}

        {/* Activity Timeline */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Activity</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Package className="h-4 w-4 mt-0.5 shrink-0 text-gray-400" />
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
                  <p className="text-sm font-medium text-gray-800">Order Sent</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <Clock className="h-3 w-3" />
                    {new Date(order.updated_at).toLocaleString('en-GB')}
                  </p>
                </div>
              </div>
            )}
            
            {order.status === 'Received' && (
              <div className="flex items-start gap-3">
                <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-gray-800">Fully Received</p>
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

        {/* Back button */}
        <div className="flex justify-start">
          <Link href="/dashboard/purchase/orders">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Orders
            </Button>
          </Link>
        </div>
      </div>

      {order && (
        <ReceiveItemsModal
          open={showReceiveModal}
          onClose={() => setShowReceiveModal(false)}
          order={order}
          warehouses={warehouses}
          onSuccess={refreshOrder}
        />
      )}
    </div>
  );
}
