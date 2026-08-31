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
          <div id="receipt-container" className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden print:shadow-none print:border print:border-gray-400 print:rounded-none">
            {/* Company Header - Professional */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b-2 border-gray-300 print:bg-white">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">{companyName}</h1>
                  <p className="text-sm text-gray-600">Personal Finance Management</p>
                </div>
                <div className="text-right">
                  <Badge className={`${
                    transaction.direction === 'in' 
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                      : 'bg-red-100 text-red-800 border-red-300'
                  } px-3 py-1 text-xs font-semibold uppercase tracking-wide`}>
                    {transaction.direction === 'in' ? 'Payment Received' : 'Payment Made'}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-2">Receipt #{generateShortId(transaction.id)}</p>
                </div>
              </div>
            </div>

            {/* Receipt Title Bar */}
            <div className={`px-8 py-4 ${
              transaction.direction === 'in' 
                ? 'bg-emerald-50 border-b border-emerald-200' 
                : 'bg-red-50 border-b border-red-200'
            } print:bg-gray-50 print:border-gray-300`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    transaction.direction === 'in' 
                      ? 'bg-emerald-100' 
                      : 'bg-red-100'
                  }`}>
                    {transaction.direction === 'in' ? (
                      <ArrowDownLeft className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <ArrowUpRight className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {transaction.direction === 'in' ? 'Received From' : 'Paid To'}
                    </h2>
                    <p className="text-xl font-bold text-gray-900">{transaction.party_name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Amount</p>
                  <p className={`text-3xl font-bold ${
                    transaction.direction === 'in' ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    Rs. {transaction.amount.toLocaleString('en-NP', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            {/* Receipt Body */}
            <div className="px-8 py-6 space-y-6">
              {/* Transaction Information Grid */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Calendar className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                      Transaction Date
                    </label>
                    <p className="text-sm font-medium text-gray-900">
                      <FormattedDate value={transaction.date} /> ({dateSystem})
                    </p>
                    <p className="text-xs text-gray-500">{formatTime(transaction.date)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <CreditCard className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                      Payment Method
                    </label>
                    <p className="text-sm font-medium text-gray-900 capitalize">
                      {transaction.payment_method || 'Not specified'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Receipt className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                      Reference ID
                    </label>
                    <p className="text-sm font-mono font-medium text-gray-900">
                      TXN-{generateShortId(transaction.id)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                      Status
                    </label>
                    <Badge className="bg-green-100 text-green-800 border-green-300 text-xs">
                      Completed
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Amount Breakdown */}
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-900">Rs. {transaction.amount.toLocaleString('en-NP', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium text-gray-900">Rs. 0.00</span>
                </div>
                <div className="border-t-2 border-gray-300 pt-3 flex items-center justify-between">
                  <span className="text-base font-semibold text-gray-900">Total Amount</span>
                  <span className={`text-2xl font-bold ${
                    transaction.direction === 'in' ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    Rs. {transaction.amount.toLocaleString('en-NP', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Notes */}
              {transaction.note && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                  <label className="text-xs font-semibold text-blue-800 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                    <span className="inline-block w-1 h-1 bg-blue-600 rounded-full"></span>
                    Notes / Description
                  </label>
                  <p className="text-sm text-blue-900 leading-relaxed">
                    {transaction.note}
                  </p>
                </div>
              )}

              {/* Receipt Attachment */}
              {transaction.receipt_url && (
                <div className="border-t border-gray-200 pt-6">
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide block mb-3">
                    Attached Receipt Document
                  </label>
                  
                  {transaction.receipt_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <div className="space-y-3">
                      <div className="relative group">
                        <img 
                          src={transaction.receipt_url} 
                          alt="Receipt" 
                          className="w-full max-h-80 object-contain rounded-lg border-2 border-gray-200 cursor-pointer hover:border-gray-400 transition"
                          onClick={() => window.open(transaction.receipt_url, '_blank')}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <span className="bg-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg">
                            Click to view full size
                          </span>
                        </div>
                      </div>
                      <Button
                        onClick={() => window.open(transaction.receipt_url, '_blank')}
                        size="sm"
                        variant="outline"
                        className="w-full gap-2 print:hidden"
                      >
                        <Download className="h-4 w-4" />
                        Download Receipt
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="p-3 bg-white rounded-lg border border-gray-300">
                        <Receipt className="h-6 w-6 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Receipt Document</p>
                        <p className="text-xs text-gray-500 mt-0.5">PDF or other document format</p>
                      </div>
                      <Button
                        onClick={() => window.open(transaction.receipt_url, '_blank')}
                        size="sm"
                        className="gap-2 print:hidden"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Receipt Footer */}
            <div className="bg-gray-50 px-8 py-5 border-t-2 border-gray-200">
              <div className="text-center space-y-2">
                <p className="text-xs text-gray-500">
                  Receipt generated on <FormattedDate value={transaction.created_at} /> at {formatTime(transaction.created_at)}
                </p>
                <p className="text-xs text-gray-400 italic">
                  This is a computer-generated receipt and does not require a physical signature.
                </p>
                <div className="pt-2 border-t border-gray-200 mt-3">
                  <p className="text-xs font-medium text-gray-600">{companyName}</p>
                  <p className="text-xs text-gray-500">Personal Finance Management System</p>
                </div>
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
