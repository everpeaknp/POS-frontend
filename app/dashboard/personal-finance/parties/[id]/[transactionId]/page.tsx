"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft, Calendar, CreditCard, Receipt, ArrowUpRight, ArrowDownLeft, Download, Printer, CheckCircle } from "@/lib/icons/lucide-react-shim";
import { DashHeader } from "@/components/dashboard/dash-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormattedDate } from "@/components/shared/FormattedDate";
import { useDateSystem } from "@/lib/context/DateSystemContext";
import { useAuth } from "@/lib/context/AuthContext";
import toast from "react-hot-toast";
import { partyTransactionAPI } from "@/lib/api/personal-finance";

interface Transaction {
  id: number;
  party: number;
  party_name: string;
  direction: 'in' | 'out';
  amount: number;
  payment_method: string | null;
  receipt: string | null;
  receipt_url?: string;
  note: string;
  date: string;
  created_at: string;
}

export default function TransactionDetailPage() {
  const { user } = useAuth();
  const { dateSystem } = useDateSystem();
  const router = useRouter();
  const params = useParams();
  
  // Extract party ID from slug (format: "party-name-123")
  const extractIdFromSlug = (slug: string): number => {
    const parts = slug.split('-');
    const lastPart = parts[parts.length - 1];
    const id = parseInt(lastPart, 10);
    return isNaN(id) ? parseInt(slug, 10) : id;
  };
  
  // Extract transaction ID from display ID (reverse the short ID generation)
  const findTransactionByDisplayId = (displayId: string, transactions: any[]): any | null => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    // Try to find transaction by generated short ID
    for (const txn of transactions) {
      let result = '';
      let num = txn.id;
      while (result.length < 6) {
        result = chars[num % chars.length] + result;
        num = Math.floor(num / chars.length);
        if (num === 0 && result.length < 6) {
          result = chars[0] + result;
        }
      }
      if (result.slice(-6) === displayId.toUpperCase()) {
        return txn;
      }
    }
    return null;
  };
  
  const partyId = extractIdFromSlug(params.id as string);
  const transactionDisplayId = (params.transactionId as string).toUpperCase();
  
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);

  const workspaceName = user?.tenant?.workspace_name || user?.tenant?.name || "Workspace";
  const companyName = user?.tenant?.name || "Company Name";

  // Generate short alphanumeric ID from number
  const generateShortId = (id: number): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    let num = id;
    
    while (result.length < 6) {
      result = chars[num % chars.length] + result;
      num = Math.floor(num / chars.length);
      if (num === 0 && result.length < 6) {
        result = chars[0] + result;
      }
    }
    
    return result.slice(-6);
  };

  useEffect(() => {
    // Add print styles
    const style = document.createElement('style');
    style.textContent = `
      @media print {
        body * {
          visibility: hidden;
        }
        #receipt-container, #receipt-container * {
          visibility: visible;
        }
        #receipt-container {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const loadTransaction = async () => {
    try {
      setLoading(true);
      // First load all transactions for this party
      const allTransactions = await partyTransactionAPI.list();
      const partyTransactions = allTransactions.filter(t => t.party === partyId);
      
      // Try to find by display ID first
      const txn = findTransactionByDisplayId(transactionDisplayId, partyTransactions);
      if (txn) {
        setTransaction(txn);
      } else {
        // Fallback: try numeric ID (for backwards compatibility)
        const numericId = parseInt(transactionDisplayId, 10);
        if (!isNaN(numericId)) {
          const txnById = await partyTransactionAPI.get(numericId);
          setTransaction(txnById);
        } else {
          throw new Error("Transaction not found");
        }
      }
    } catch (error) {
      console.error("Failed to load transaction:", error);
      toast.error("Failed to load transaction details");
      router.push(`/dashboard/personal-finance/parties/${partyId}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (partyId && transactionDisplayId) {
      loadTransaction();
    }
  }, [partyId, transactionDisplayId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-NP', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-full bg-gray-50">
        <DashHeader title="Transaction Receipt" subtitle={`${workspaceName} · Loading...`} />
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22C55E] mx-auto mb-4"></div>
            <p className="text-gray-500">Loading receipt...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      <div className="print:hidden">
        <DashHeader 
          title="Transaction Receipt" 
          subtitle={`${workspaceName} · ${transaction.party_name}`} 
        />
      </div>

      <div className="flex-1 p-6 print:p-0 bg-gray-50">
        <div className="max-w-3xl mx-auto space-y-4 print:max-w-full print:space-y-0">
          {/* Action Buttons */}
          <div className="flex items-center justify-between print:hidden">
            <Button
              onClick={() => router.push(`/dashboard/personal-finance/parties/${partyId}`)}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Ledger
            </Button>
            
            <div className="flex gap-2">
              <Button
                onClick={handlePrint}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button
                onClick={() => router.push(`/dashboard/personal-finance/parties/${partyId}?edit-transaction=${transactionId}`)}
                size="sm"
                className="bg-[#22C55E] hover:bg-[#22C55E]/90"
              >
                Edit
              </Button>
            </div>
          </div>

          {/* Receipt Card */}
          <div id="receipt-container" className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden print:shadow-none print:border-0 print:rounded-none">
            {/* Receipt Header */}
            <div className={`p-6 text-white ${
              transaction.direction === 'in' 
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' 
                : 'bg-gradient-to-r from-red-500 to-red-600'
            } print:bg-none print:text-gray-900 print:border-b-2 print:border-gray-300`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {transaction.direction === 'in' ? (
                      <ArrowDownLeft className="h-6 w-6 print:text-emerald-600" />
                    ) : (
                      <ArrowUpRight className="h-6 w-6 print:text-red-600" />
                    )}
                    <h2 className="text-xl font-bold">Payment Receipt</h2>
                  </div>
                  <p className="text-white/90 text-sm print:text-gray-600">{companyName}</p>
                </div>
                <div className="text-right">
                  <Badge className="bg-white/20 text-white border-0 mb-2 print:bg-gray-100 print:text-gray-900 print:border print:border-gray-300">
                    {transaction.direction === 'in' ? 'RECEIVED' : 'PAID'}
                  </Badge>
                  <p className="text-xs text-white/80 print:text-gray-600">Receipt #{transaction.id}</p>
                </div>
              </div>
            </div>

            {/* Receipt Body */}
            <div className="p-8 space-y-6">
              {/* Amount Section */}
              <div className="text-center py-6 border-b-2 border-dashed border-gray-200">
                <p className="text-sm text-gray-500 uppercase tracking-wide mb-2">Amount</p>
                <p className={`text-5xl font-bold ${
                  transaction.direction === 'in' ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  Rs. {transaction.amount.toLocaleString('en-NP')}
                </p>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <p className="text-sm text-gray-600">
                    {transaction.direction === 'in' ? 'Payment Received' : 'Payment Made'}
                  </p>
                </div>
              </div>

              {/* Transaction Details */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                    {transaction.direction === 'in' ? 'Received From' : 'Paid To'}
                  </label>
                  <p className="text-base font-medium text-gray-900">{transaction.party_name}</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                    Transaction Type
                  </label>
                  <Badge className={`${
                    transaction.direction === 'in' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    {transaction.direction === 'in' ? 'Money In' : 'Money Out'}
                  </Badge>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                    Date ({dateSystem})
                  </label>
                  <p className="text-base text-gray-900"><FormattedDate value={transaction.date} /></p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                    Time
                  </label>
                  <p className="text-base text-gray-900">{formatTime(transaction.date)}</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                    Payment Method
                  </label>
                  <p className="text-base text-gray-900">
                    {transaction.payment_method ? (
                      <span className="inline-flex items-center gap-1.5">
                        <CreditCard className="h-4 w-4 text-gray-500" />
                        {transaction.payment_method}
                      </span>
                    ) : (
                      <span className="text-gray-400">Not specified</span>
                    )}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                    Transaction ID
                  </label>
                  <p className="text-base font-mono text-gray-900">#{generateShortId(transaction.id)}</p>
                </div>
              </div>

              {/* Notes */}
              {transaction.note && (
                <div className="pt-4 border-t border-gray-200">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                    Notes
                  </label>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md leading-relaxed">
                    {transaction.note}
                  </p>
                </div>
              )}

              {/* Receipt Attachment */}
              <div className="pt-4 border-t border-gray-200">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-3 text-center">
                  Attached Receipt
                </label>
                
                {transaction.receipt_url ? (
                  <>
                    {/* Receipt Preview */}
                    {transaction.receipt_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <div className="mb-3 flex justify-center">
                        <img 
                          src={transaction.receipt_url} 
                          alt="Receipt" 
                          className="max-w-full max-h-96 h-auto rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition"
                          onClick={() => window.open(transaction.receipt_url, '_blank')}
                        />
                      </div>
                    ) : null}
                    
                    <div className="flex items-center justify-center gap-3 bg-gray-50 p-4 rounded-md border border-gray-200">
                      <Receipt className="h-8 w-8 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Receipt Document</p>
                        <p className="text-xs text-gray-500">Click to view or download</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => window.open(transaction.receipt_url, '_blank')}
                          size="sm"
                          variant="outline"
                          className="gap-2"
                        >
                          View
                        </Button>
                        <Button
                          onClick={() => window.open(transaction.receipt_url, '_blank')}
                          size="sm"
                          variant="outline"
                          className="gap-2"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-md border border-gray-200">
                    <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Not uploaded</p>
                  </div>
                )}
              </div>
            </div>

            {/* Receipt Footer */}
            <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <p>Generated on <FormattedDate value={transaction.created_at} /> at {formatTime(transaction.created_at)}</p>
                <p className="font-mono">#{transaction.id}</p>
              </div>
            </div>
          </div>

          {/* Print Footer */}
          <div className="hidden print:block text-center text-xs text-gray-500 mt-8 bg-gray-50 p-4 rounded-lg">
            <p>This is a computer-generated receipt and does not require a signature.</p>
            <p className="mt-1">{companyName} - Personal Finance Management</p>
          </div>
        </div>
      </div>
    </div>
  );
}
