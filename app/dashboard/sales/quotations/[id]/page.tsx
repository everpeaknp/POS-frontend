"use client";

import { FormattedDate } from "@/components/shared/FormattedDate";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Edit, Printer, FileText, XCircle, CheckCircle, Clock, Loader2, ArrowLeft, ShoppingCart } from "lucide-react";
import { useReactToPrint } from 'react-to-print';
import { Button } from "@/components/ui/button";
import { DashHeader } from "@/components/dashboard/dash-header";
import { StatusBadge } from "@/components/sales/StatusBadge";
import { LineItemsTable } from "@/components/sales/LineItemsTable";
import { SalesSummaryBox } from "@/components/sales/SalesSummaryBox";
import { PrintableQuotation } from "@/components/sales/PrintableQuotation";
import { quotationAPI, type Quotation } from "@/lib/api/sales";
import { useCompanyInfo } from "@/lib/hooks/useCompanyInfo";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";

export default function QuotationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const { companyInfo } = useCompanyInfo();

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${quotation?.quotation_number || 'Quotation'}_${new Date().toISOString().split('T')[0]}`,
  });

  useEffect(() => {
    const fetchQuotation = async () => {
      try {
        const response = await quotationAPI.get(id);
        setQuotation(response.data);
      } catch (error: any) {
        console.error('Error fetching quotation:', error);
        toast.error("Failed to load quotation details");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchQuotation();
    }
  }, [id]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!quotation) return;
    
    const confirmUpdate = async () => {
      setUpdating(true);
      try {
        const response = await quotationAPI.update(quotation.id, { status: newStatus as any });
        toast.success(`Quotation status updated to ${newStatus}`);
        setQuotation(response.data);
      } catch (error: any) {
        console.error('Error updating status:', error);
        toast.error(error.response?.data?.message || "Failed to update quotation status");
      } finally {
        setUpdating(false);
      }
    };

    toast((t) => (
      <div className="flex flex-col gap-4 min-w-[320px] p-2">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-base">Update Status?</p>
            <p className="text-sm text-gray-600 mt-1">Change quotation status to {newStatus}.</p>
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
              confirmUpdate();
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Update
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

  const handleConvertToOrder = async () => {
    if (!quotation) return;
    
    const confirmConvert = async () => {
      setUpdating(true);
      try {
        const response = await quotationAPI.convertToOrder(quotation.id);
        toast.success(`Quotation converted to order ${response.data.order_number}`);
        
        // Redirect to the new order
        setTimeout(() => {
          window.location.href = `/dashboard/sales/orders/${response.data.id}`;
        }, 1000);
      } catch (error: any) {
        console.error('Error converting to order:', error);
        toast.error(error.response?.data?.error || "Failed to convert quotation");
        setUpdating(false);
      }
    };

    toast((t) => (
      <div className="flex flex-col gap-4 min-w-[320px] p-2">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-base">Convert to Order?</p>
            <p className="text-sm text-gray-600 mt-1">This will create a new sales order from this quotation.</p>
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
              confirmConvert();
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-[#22C55E] rounded-lg hover:bg-[#16A34A] transition-colors"
          >
            Convert
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
      <div className="flex flex-col h-full min-h-0">
        <DashHeader title="Loading..." subtitle="Quotation" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#22C55E]" />
        </div>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <DashHeader title="Quotation Not Found" subtitle="Quotation" />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="text-gray-500">The quotation you're looking for doesn't exist.</p>
          <Link href="/dashboard/sales/quotations">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Quotations
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Convert line items to the format expected by LineItemsTable
  const lineItems = quotation.lines?.map(line => ({
    id: line.id || '',
    product: line.product_name || line.product,
    description: line.description || '',
    qty: Number(line.quantity),
    unit: 'Pcs',
    unitPrice: Number(line.unit_price),
    discount: Number(line.discount_percent),
    tax: Number(line.tax_percent),
    amount: Number(line.amount),
  })) || [];

  const subtotal = Number(quotation.subtotal);
  const totalDiscount = Number(quotation.discount);
  const totalTax = Number(quotation.tax);
  const grandTotal = Number(quotation.total);

  // Check if quotation is expired
  const isExpired = new Date(quotation.valid_until) < new Date() && quotation.status !== 'Accepted';

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashHeader 
        title={quotation.quotation_number} 
        subtitle={`Quotation · ${quotation.date}`} 
      />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="w-full min-h-full space-y-6">
          {/* Action bar */}
          <div className="flex flex-wrap items-center gap-2 sticky top-0 z-10 bg-[#F3F4F6] py-2 -mx-1 px-1">
            <Link href="/dashboard/sales/quotations">
              <Button variant="outline" size="sm" className="gap-1.5 h-8">
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </Button>
            </Link>
            <StatusBadge status={quotation.status} />
            {isExpired && quotation.status !== 'Expired' && (
              <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded">
                Expired
              </span>
            )}
            <div className="flex-1" />
            
            {quotation.status === 'Draft' && (
              <>
                <Link href={`/dashboard/sales/quotations/${quotation.id}/edit`}>
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
                  Mark as Sent
                </Button>
              </>
            )}
            
            {(quotation.status === 'Sent' || quotation.status === 'Draft') && !isExpired && (
              <Button 
                size="sm" 
                onClick={handleConvertToOrder}
                disabled={updating}
                className="bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5 h-8"
              >
                {updating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShoppingCart className="h-3.5 w-3.5" />}
                Convert to Order
              </Button>
            )}
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePrint}
              disabled={!companyInfo}
              className="gap-1.5 h-8"
            >
              <Printer className="h-3.5 w-3.5" /> Print / PDF
            </Button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Left column — quotation info & activity */}
            <div className="xl:col-span-4 space-y-6">
              <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-3">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Quotation Info</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Quote #</span>
                  <span className="font-medium text-gray-800">{quotation.quotation_number}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Date</span>
                  <span className="font-medium text-gray-800">
                    <FormattedDate value={quotation.date} />
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Valid Until</span>
                  <span className={`font-medium ${isExpired ? 'text-red-600' : 'text-gray-800'}`}>
                    <FormattedDate value={quotation.valid_until} />
                  </span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-gray-500">Status</span>
                  <StatusBadge status={quotation.status} />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Created By</span>
                  <span className="font-medium text-gray-800">{quotation.created_by_name || "—"}</span>
                </div>
              </div>
              
              <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-3">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Name</span>
                  <span className="font-medium text-gray-800">{quotation.customer_name || quotation.customer}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total Amount</span>
                  <span className="font-semibold text-[#22C55E]">{formatCurrency(quotation.total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Items</span>
                  <span className="font-medium text-gray-800">{quotation.items_count || lineItems.length}</span>
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Activity</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <FileText className="h-4 w-4 mt-0.5 shrink-0 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">Quotation Created</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" />
                        {new Date(quotation.created_at).toLocaleString('en-GB')}
                      </p>
                    </div>
                  </div>
                  
                  {quotation.status === 'Sent' && (
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-800">Sent to Customer</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {new Date(quotation.updated_at).toLocaleString('en-GB')}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {quotation.status === 'Accepted' && (
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-green-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-800">Accepted & Converted to Order</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {new Date(quotation.updated_at).toLocaleString('en-GB')}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {quotation.status === 'Expired' && (
                    <div className="flex items-start gap-3">
                      <XCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-800">Quotation Expired</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {new Date(quotation.valid_until).toLocaleString('en-GB')}
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
                <LineItemsTable items={lineItems as any} onChange={() => {}} readOnly />
                <div className="flex justify-end mt-6">
                  <SalesSummaryBox 
                    subtotal={subtotal} 
                    totalDiscount={totalDiscount} 
                    totalTax={totalTax} 
                    grandTotal={grandTotal} 
                  />
                </div>
              </div>

              {quotation.notes && (
                <div className="bg-white rounded-xl border border-gray-100 p-5 lg:p-6 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Notes</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{quotation.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {companyInfo && quotation && (
        <div className="hidden">
          <PrintableQuotation ref={printRef} quotation={quotation} companyInfo={companyInfo} />
        </div>
      )}
    </div>
  );
}
