"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft, Calendar, Edit2, Trash2, FileText, Wallet, Printer, TrendingUp, TrendingDown } from "@/lib/icons/lucide-react-shim";
import { DashHeader } from "@/components/dashboard/dash-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormattedDate } from "@/components/shared/FormattedDate";
import { useDateSystemStore } from "@/lib/stores/dateSystemStore";
import { useAuth } from "@/lib/context/AuthContext";
import { formatCurrency } from "@/lib/utils";
import { financeTransactionAPI, type FinanceTransaction } from "@/lib/api/personal-finance";
import toast from "react-hot-toast";

export default function TransactionDetailPage() {
  const { user } = useAuth();
  const dateSystem = useDateSystemStore((state) => state.dateSystem);
  const router = useRouter();
  const params = useParams();
  const transactionNumber = params.id as string;

  const [transaction, setTransaction] = useState<FinanceTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const workspaceName = user?.tenant?.workspace_name || user?.tenant?.name || "Workspace";

  useEffect(() => {
    const loadTransaction = async () => {
      try {
        setLoading(true);
        const all = await financeTransactionAPI.list();
        const txn = all.find((t) => t.transaction_number === transactionNumber);
        if (txn) {
          setTransaction(txn);
        } else {
          toast.error("Transaction not found");
          router.push("/dashboard/finance/transactions");
        }
      } catch (error) {
        console.error("Failed to load transaction:", error);
        toast.error("Failed to load transaction details");
        router.push("/dashboard/finance/transactions");
      } finally {
        setLoading(false);
      }
    };

    if (transactionNumber) loadTransaction();
  }, [transactionNumber, router]);

  const handlePrint = () => window.print();

  const handleEdit = () => {
    if (!transaction) return;
    router.push(`/dashboard/finance/transactions?edit=${transaction.transaction_number}`);
  };

  const handleDelete = async () => {
    if (!transaction) return;
    try {
      setDeleting(true);
      await financeTransactionAPI.delete(transaction.id);
      toast.success("Transaction deleted successfully");
      router.push("/dashboard/finance/transactions");
    } catch (error) {
      console.error("Failed to delete transaction:", error);
      toast.error("Failed to delete transaction");
    } finally {
      setDeleting(false);
    }
  };

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString("en-NP", { hour: "2-digit", minute: "2-digit" });

  if (loading) {
    return (
      <div className="flex flex-col min-h-full bg-gray-50">
        <DashHeader title="Transaction Details" subtitle={`${workspaceName} · Loading...`} />
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-accent-custom,#22C55E)] mx-auto mb-4"></div>
            <p className="text-gray-500">Loading transaction details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return null;
  }

  const isIncome = transaction.type === "income";

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-receipt-card,
          .print-receipt-card * {
            visibility: visible;
          }
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
          .no-print {
            display: none !important;
            visibility: hidden !important;
          }
          @page {
            margin: 0.5in;
            size: auto;
          }
        }
      `}</style>

      <div className="print:hidden">
        <DashHeader
          title="Transaction Details"
          subtitle={`${workspaceName} · ${isIncome ? "Income" : "Expense"} Transaction`}
        />
      </div>

      <div className="flex-1 p-6 space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/finance/transactions")}
          className="gap-1.5 no-print w-fit"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Transactions
        </Button>

        <div className="bg-white rounded-lg shadow-md overflow-hidden max-w-2xl mx-auto print-receipt-card">
          <div className={`p-6 ${isIncome ? "bg-gradient-to-br from-emerald-500 to-emerald-600" : "bg-gradient-to-br from-red-500 to-red-600"}`}>
            <div className="flex items-center justify-between mb-4">
              <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
                {isIncome ? (
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
                {isIncome ? "+" : "-"}{formatCurrency(parseFloat(transaction.amount))}
              </p>
            </div>
          </div>

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
                  <span className="text-sm">{formatTime(transaction.created_at)}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                  Transaction ID
                </label>
                <p className="text-gray-900 font-mono text-sm">{transaction.transaction_number}</p>
              </div>

              {transaction.category_name && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                    Category
                  </label>
                  <div className="flex items-center gap-2 text-gray-900">
                    <FileText className="h-4 w-4 text-gray-400" />
                    {transaction.category_name}
                  </div>
                </div>
              )}

              {transaction.account_name && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                    Account
                  </label>
                  <div className="flex items-center gap-2 text-gray-900">
                    <Wallet className="h-4 w-4 text-gray-400" />
                    {transaction.account_name}
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

            <div className="flex gap-3 pt-4 border-t no-print">
              <Button onClick={handlePrint} variant="outline" className="flex-1 gap-2">
                <Printer className="h-4 w-4" />
                Print
              </Button>
            </div>

            <div className="flex gap-3 no-print">
              <Button
                onClick={handleEdit}
                className="flex-1 bg-[var(--color-accent-custom,#22C55E)] hover:bg-[var(--color-accent-custom,#22C55E)]/90 gap-2"
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
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
