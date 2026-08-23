"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft, Calendar, DollarSign, TrendingUp, TrendingDown, Edit2, Trash2, ExternalLink, FileText, Wallet, Printer, Share2, ChevronUp } from "@/lib/icons/lucide-react-shim";
import { DashHeader } from "@/components/dashboard/dash-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateInput } from "@/components/shared/DateInput";
import { FormattedDate } from "@/components/shared/FormattedDate";
import { useDateSystemStore } from "@/lib/stores/dateSystemStore";
import { useAuth } from "@/lib/context/AuthContext";
import { formatCurrency } from "@/lib/utils";
import {
  getCategories,
  getAccounts,
  getTransactions,
  setCategoriesForScope,
  setAccountsForScope,
  setTransactionsForScope,
  useSyncedList,
  type PFCategory,
  type PFAccount,
  type PFTransaction,
} from "@/lib/personal-finance/store";
import toast from "react-hot-toast";

type Transaction = PFTransaction;
type Category = PFCategory;
type Account = PFAccount;

export default function TransactionDetailPage() {
  const { user } = useAuth();
  const dateSystem = useDateSystemStore((state) => state.dateSystem);
  const router = useRouter();
  const params = useParams();
  const transactionId = params.id as string;
  const scope = user?.tenant?.slug ?? null;
  
  const [categories] = useSyncedList<Category>(scope, getCategories, setCategoriesForScope);
  const [accounts] = useSyncedList<Account>(scope, getAccounts, setAccountsForScope);
  const [transactions, setTransactions] = useSyncedList<Transaction>(scope, getTransactions, setTransactionsForScope);
  
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  
  const [editFormData, setEditFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: 0,
    date: '',
    categoryId: '',
    accountId: '',
    description: '',
  });

  const workspaceName = user?.tenant?.workspace_name || user?.tenant?.name || "Workspace";

  // Generate a consistent random-looking 6-character ID from transaction ID
  const generateDisplayId = (id: string): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash) + id.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    
    let result = '';
    let num = Math.abs(hash);
    for (let i = 0; i < 6; i++) {
      result += chars[num % chars.length];
      num = Math.floor(num / chars.length);
    }
    
    return result;
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-NP', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Try to find transaction by the display ID from URL
    const txn = transactions.find(t => generateDisplayId(t.id) === transactionId.toUpperCase());
    if (txn) {
      setTransaction(txn);
    } else {
      // Fallback: try to find by actual ID (for backwards compatibility)
      const txnById = transactions.find(t => t.id === transactionId);
      if (txnById) {
        setTransaction(txnById);
        // Update URL to use display ID
        router.replace(`/dashboard/personal-finance/transactions/${generateDisplayId(txnById.id)}`);
      } else {
        toast.error("Transaction not found");
        router.push("/dashboard/personal-finance/transactions");
      }
    }
    setLoading(false);
  }, [transactionId, transactions, router]);

  const category = transaction ? categories.find((c) => c.id === transaction.categoryId) : null;
  const account = transaction ? accounts.find((a) => a.id === transaction.accountId) : null;

  const handleEdit = () => {
    if (!transaction) return;
    setEditFormData({
      type: transaction.type,
      amount: transaction.amount,
      date: transaction.date,
      categoryId: transaction.categoryId,
      accountId: transaction.accountId,
      description: transaction.description,
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!transaction) return;
    
    if (editFormData.amount <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    setTransactions((prev) =>
      prev.map((t) =>
        t.id === transaction.id
          ? { ...t, ...editFormData }
          : t
      )
    );
    
    toast.success("Transaction updated successfully");
    setEditDialogOpen(false);
  };

  const handleDelete = () => {
    if (!transaction) return;
    
    setTransactions((prev) => prev.filter((t) => t.id !== transaction.id));
    toast.success("Transaction deleted successfully");
    router.push("/dashboard/personal-finance/transactions");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (!transaction) return;
    
    // Generate a unique shareable token
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const shareToken = btoa(`${transaction.id}_${timestamp}_${randomStr}`)
      .replace(/[/+=]/g, '')
      .slice(0, 16);
    
    // Store the share token mapping in localStorage (in production, this would be in backend)
    const shareTokensKey = `pf_share_tokens_${user?.tenant?.slug || 'default'}`;
    const existingTokens = JSON.parse(localStorage.getItem(shareTokensKey) || '{}');
    existingTokens[shareToken] = {
      transactionId: transaction.id,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    };
    localStorage.setItem(shareTokensKey, JSON.stringify(existingTokens));
    
    // Create shareable URL
    const shareUrl = `${window.location.origin}/share/transaction/${shareToken}`;
    
    // Use Web Share API if available, otherwise copy to clipboard
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Transaction #${generateDisplayId(transaction.id)}`,
          text: `View transaction details - ${transaction.type === 'income' ? 'Income' : 'Expense'} of ${formatCurrency(transaction.amount)}`,
          url: shareUrl,
        });
        toast.success("Shared successfully!");
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          copyToClipboard(shareUrl);
        }
      }
    } else {
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Link copied to clipboard!");
    }).catch(() => {
      toast.error("Failed to copy link");
    });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter categories based on selected type
  const availableCategories = categories.filter((cat) => cat.type === editFormData.type);

  if (loading) {
    return (
      <div className="flex flex-col min-h-full bg-gray-50">
        <DashHeader title="Transaction Details" subtitle={`${workspaceName} · Loading...`} />
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22C55E] mx-auto mb-4"></div>
            <p className="text-gray-500">Loading transaction details...</p>
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
      <style jsx global>{`
        @media print {
          /* Hide everything except the receipt card */
          body * {
            visibility: hidden;
          }
          
          /* Show only the receipt card and its children */
          .print-receipt-card,
          .print-receipt-card * {
            visibility: visible;
          }
          
          /* Position the receipt card at top of page */
          .print-receipt-card {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-width: 100% !important;
            background: white !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          
          /* Remove gradient backgrounds for print */
          .print-receipt-card > div:first-child {
            background: white !important;
            color: black !important;
            border-bottom: 2px solid #e5e7eb !important;
            padding: 1.5rem !important;
          }
          
          .print-receipt-card > div:first-child * {
            color: black !important;
          }
          
          .print-receipt-card > div:first-child .bg-white\\/20,
          .print-receipt-card > div:first-child .text-white\\/90,
          .print-receipt-card > div:first-child .text-white\\/80 {
            background: #f3f4f6 !important;
            color: #374151 !important;
          }
          
          /* Hide buttons and interactive elements when printing */
          .no-print {
            display: none !important;
            visibility: hidden !important;
          }
          
          /* Optimize receipt image for print */
          .print-receipt-card img {
            max-height: 400px !important;
            page-break-inside: avoid;
          }
          
          /* Clean up margins */
          @page {
            margin: 0.5in;
            size: auto;
          }
          
          /* Ensure proper text rendering */
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          /* Page breaks */
          .print-receipt-card {
            page-break-inside: avoid;
          }
        }
      `}</style>
      
      <DashHeader 
        title="Transaction Details" 
        subtitle={`${workspaceName} · ${transaction.type === 'income' ? 'Income' : 'Expense'} Transaction`}
      />

      <div className="flex-1 p-6 space-y-4">
        {/* Receipt-Style Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden max-w-2xl mx-auto print-receipt-card">
          {/* Header with gradient */}
          <div className={`p-6 ${
            transaction.type === 'income' 
              ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' 
              : 'bg-gradient-to-br from-red-500 to-red-600'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
                {transaction.type === 'income' ? (
                  <><TrendingUp className="h-3 w-3 mr-1" />Income</>
                ) : (
                  <><TrendingDown className="h-3 w-3 mr-1" />Expense</>
                )}
              </Badge>
              <span className="text-xs text-white/90 bg-white/10 px-2 py-1 rounded backdrop-blur-sm">
                {dateSystem}
              </span>
            </div>
            
            <div className="text-center">
              <p className="text-white/90 text-sm mb-2">Amount</p>
              <p className="text-4xl font-bold text-white">
                {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
              </p>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                  Date ({dateSystem})
                </label>
                <div className="flex items-center gap-2 text-gray-900">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <FormattedDate value={transaction.date} />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                  Time
                </label>
                <div className="flex items-center gap-2 text-gray-900">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{formatTime(transaction.createdAt)}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                  Transaction ID
                </label>
                <p className="text-gray-900 font-mono text-sm">#{generateDisplayId(transaction.id)}</p>
              </div>

              {category && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                    Category
                  </label>
                  <div className="flex items-center gap-2 text-gray-900">
                    <FileText className="h-4 w-4 text-gray-400" />
                    {category.name}
                  </div>
                </div>
              )}

              {account && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                    Account
                  </label>
                  <div className="flex items-center gap-2 text-gray-900">
                    <Wallet className="h-4 w-4 text-gray-400" />
                    {account.name}
                  </div>
                </div>
              )}
            </div>

            {transaction.description && (
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                  Description
                </label>
                <p className="text-gray-900 text-sm">{transaction.description}</p>
              </div>
            )}

            {/* Receipt Preview - Always show section */}
            <div className="pt-4 border-t border-gray-200">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-3">
                Receipt
              </label>
              {transaction.receiptUrl ? (
                <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                  {transaction.receiptUrl.startsWith('data:application/pdf') || transaction.receiptUrl.endsWith('.pdf') ? (
                    // PDF preview
                    <div className="p-6 text-center">
                      <FileText className="h-16 w-16 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm font-medium text-gray-900 mb-1">PDF Receipt</p>
                      <p className="text-xs text-gray-500 mb-4">Click to view or download</p>
                      <Button
                        onClick={() => window.open(transaction.receiptUrl, '_blank')}
                        size="sm"
                        variant="outline"
                        className="gap-2"
                      >
                        View PDF
                      </Button>
                    </div>
                  ) : (
                    // Image preview
                    <img 
                      src={transaction.receiptUrl} 
                      alt="Receipt" 
                      className="w-full max-h-96 object-contain cursor-pointer hover:opacity-90 transition"
                      onClick={() => window.open(transaction.receiptUrl, '_blank')}
                    />
                  )}
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 p-8 text-center">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Not uploaded</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t no-print">
              <Button
                onClick={handleShare}
                variant="outline"
                className="flex-1 gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              <Button
                onClick={handlePrint}
                variant="outline"
                className="flex-1 gap-2"
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
            </div>

            <div className="flex gap-3 no-print">
              <Button
                onClick={handleEdit}
                className="flex-1 bg-[#22C55E] hover:bg-[#22C55E]/90 gap-2"
              >
                <Edit2 className="h-4 w-4" />
                Edit Transaction
              </Button>
              <Button
                onClick={() => setDeleteConfirmOpen(true)}
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50 gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 p-3 bg-[#22C55E] text-white rounded-full shadow-lg hover:bg-[#22C55E]/90 transition-all z-50 no-print"
          aria-label="Back to top"
        >
          <ChevronUp className="h-5 w-5" />
        </button>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-[#22C55E]" />
              Edit Transaction
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>
                Type <span className="text-red-500">*</span>
              </Label>
              <div className="mt-1 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setEditFormData({ ...editFormData, type: "expense", categoryId: "" })}
                  className={`flex items-center justify-center gap-2 h-10 rounded-lg border font-medium text-sm transition-all ${
                    editFormData.type === "expense"
                      ? "border-red-300 bg-red-50 text-red-700"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <TrendingDown className="h-4 w-4" />
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setEditFormData({ ...editFormData, type: "income", categoryId: "" })}
                  className={`flex items-center justify-center gap-2 h-10 rounded-lg border font-medium text-sm transition-all ${
                    editFormData.type === "income"
                      ? "border-[#22C55E] bg-green-50 text-[#16A34A]"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <TrendingUp className="h-4 w-4" />
                  Income
                </button>
              </div>
            </div>

            <div>
              <Label>
                Amount <span className="text-red-500">*</span>
              </Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                  Rs.
                </span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editFormData.amount || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Select value={editFormData.categoryId} onValueChange={(value) => setEditFormData({ ...editFormData, categoryId: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Account</Label>
                <Select value={editFormData.accountId} onValueChange={(value) => setEditFormData({ ...editFormData, accountId: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Date</Label>
              <DateInput
                value={editFormData.date}
                onChange={(date) => setEditFormData({ ...editFormData, date })}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Input
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                placeholder="Optional note"
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} className="bg-[#22C55E] hover:bg-[#22C55E]/90">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Transaction</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-4">
            Are you sure you want to delete this transaction? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
