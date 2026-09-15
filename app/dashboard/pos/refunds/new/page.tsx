"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Search, Plus, Minus, RotateCcw, Receipt, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashHeader } from "@/components/dashboard/dash-header";
import posApi, { type POSTransaction, type POSRefundLine } from "@/lib/api/pos";
import toast from "react-hot-toast";

interface RefundLine {
  id?: string;
  original_line: string;
  product: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  max_quantity: number;
  refund_amount: number;
}

export default function NewRefundPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [totalRefunds, setTotalRefunds] = useState(0);
  
  // Form state
  const [transactionNumber, setTransactionNumber] = useState("");
  const [transaction, setTransaction] = useState<POSTransaction | null>(null);
  const [refundLines, setRefundLines] = useState<RefundLine[]>([]);
  const [reason, setReason] = useState("");
  const [refundMethod, setRefundMethod] = useState("");
  const [notes, setNotes] = useState("");

  // Load stats
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const refunds = await posApi.getRefunds({ page_size: 1 });
      setTotalRefunds(refunds.count || 0);
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  // Load transaction from URL parameter
  useEffect(() => {
    const posNumber = searchParams?.get('pos');
    if (posNumber) {
      setTransactionNumber(posNumber);
      loadTransactionByNumber(posNumber);
    }
  }, [searchParams]);

  // Load transaction by transaction number
  const loadTransactionByNumber = async (number: string) => {
    setLoading(true);
    try {
      const txn = await posApi.getTransactionByNumber(number);
      setTransaction(txn);
      
      // Set refund method to match original payment method
      setRefundMethod(txn.payment_method || "");
      
      // Initialize refund lines from transaction
      setRefundLines(txn.lines.map((line: any) => ({
        original_line: line.id,
        product: line.product,
        product_name: line.product_name || "Unknown Product",
        quantity: 0,
        unit_price: line.unit_price,
        max_quantity: line.quantity,
        refund_amount: 0,
      })));
      
      toast.success("Transaction loaded");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Transaction not found");
      setTransaction(null);
      setRefundLines([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Search for transaction
  const handleSearchTransaction = async () => {
    if (!transactionNumber.trim()) {
      toast.error("Enter transaction number");
      return;
    }
    
    await loadTransactionByNumber(transactionNumber);
  };
  
  // Update refund line quantity
  const updateQuantity = (index: number, quantity: number) => {
    const updated = [...refundLines];
    const line = updated[index];
    
    // Validate quantity
    const newQty = Math.max(0, Math.min(quantity, line.max_quantity));
    line.quantity = newQty;
    line.refund_amount = newQty * line.unit_price;
    
    setRefundLines(updated);
  };
  
  // Calculate totals
  const totalRefundAmount = refundLines.reduce((sum, line) => sum + line.refund_amount, 0);
  const totalQuantity = refundLines.reduce((sum, line) => sum + line.quantity, 0);
  
  // Process refund
  const handleSubmit = async () => {
    if (!transaction || !transaction.id) {
      toast.error("Load a transaction first");
      return;
    }
    
    const linesToRefund = refundLines.filter(line => line.quantity > 0);
    if (linesToRefund.length === 0) {
      toast.error("Select at least one item to refund");
      return;
    }
    
    if (!reason.trim()) {
      toast.error("Enter refund reason");
      return;
    }
    
    setProcessing(true);
    try {
      await posApi.createRefund({
        original_transaction: transaction.id,
        reason: reason,
        refund_method: refundMethod || transaction.payment_method,
        lines: linesToRefund.map(line => ({
          original_line: line.original_line,
          quantity: line.quantity,
          refund_amount: line.refund_amount,
        })),
      });
      
      toast.success("Refund processed successfully");
      router.push("/dashboard/pos/refunds");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to process refund");
    } finally {
      setProcessing(false);
    }
  };
  
  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      <DashHeader 
        title="New Refund" 
        subtitle="Process product returns"
        actions={
          <Link href="/dashboard/pos/refunds">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Refunds
            </Button>
          </Link>
        }
      />
      
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Stats Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <RotateCcw className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-white/80">Total Refunds</p>
                  <p className="text-2xl font-bold">
                    {statsLoading ? "..." : totalRefunds}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Receipt className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-white/80">Current Transaction</p>
                  <p className="text-lg font-bold">
                    {transaction ? transaction.transaction_number : "None"}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-white/80">Refund Amount</p>
                  <p className="text-2xl font-bold">
                    Rs. {totalRefundAmount.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction Search */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold mb-4">1. Find Transaction</h3>
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  value={transactionNumber}
                  onChange={(e) => setTransactionNumber(e.target.value)}
                  placeholder="Enter transaction number (e.g., TXN-2024-0001)"
                  onKeyDown={(e) => e.key === "Enter" && handleSearchTransaction()}
                />
              </div>
              <Button 
                onClick={handleSearchTransaction}
                disabled={loading}
                className="bg-[#4A5D7A] hover:bg-[#2E3E52]"
              >
                <Search className="h-4 w-4 mr-2" />
                {loading ? "Searching..." : "Search"}
              </Button>
            </div>
            
            {transaction && (
              <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Transaction:</span>
                    <span className="ml-2 font-semibold">{transaction.transaction_number}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Date:</span>
                    <span className="ml-2 font-semibold">
                      {new Date(transaction.created_at || new Date()).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total:</span>
                    <span className="ml-2 font-semibold">Rs. {transaction.total.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="ml-2 font-semibold capitalize">{transaction.payment_method}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Refund Lines */}
          {transaction && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-semibold mb-4">2. Select Items to Refund</h3>
              
              {refundLines.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No items available for refund</p>
              ) : (
                <div className="space-y-3">
                  {refundLines.map((line, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{line.product_name}</div>
                        <div className="text-sm text-gray-600">
                          Rs. {line.unit_price.toLocaleString()} × {line.max_quantity} available
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(index, line.quantity - 1)}
                          disabled={line.quantity <= 0}
                          className="h-8 w-8 p-0"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        
                        <Input
                          type="number"
                          value={line.quantity}
                          onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 0)}
                          className="w-20 text-center"
                          min={0}
                          max={line.max_quantity}
                        />
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(index, line.quantity + 1)}
                          disabled={line.quantity >= line.max_quantity}
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <div className="text-right min-w-[100px]">
                        <div className="font-semibold">
                          Rs. {line.refund_amount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {totalQuantity > 0 && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Total Items:</span>
                    <span className="font-semibold text-blue-900">{totalQuantity}</span>
                  </div>
                  <div className="flex justify-between text-base mt-2">
                    <span className="font-semibold text-blue-700">Refund Amount:</span>
                    <span className="font-bold text-blue-900 text-lg">
                      Rs. {totalRefundAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Refund Details */}
          {transaction && totalQuantity > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-semibold mb-4">3. Refund Details</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="reason">Reason for Refund *</Label>
                    <Select value={reason} onValueChange={(value) => setReason(value || "")}>
                      <SelectTrigger id="reason" className="mt-1">
                        <SelectValue placeholder="Select reason" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="defective">Defective Product</SelectItem>
                        <SelectItem value="wrong_item">Wrong Item</SelectItem>
                        <SelectItem value="customer_request">Customer Request</SelectItem>
                        <SelectItem value="damaged">Damaged During Delivery</SelectItem>
                        <SelectItem value="expired">Expired Product</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="refundMethod">Refund Method *</Label>
                    <Select value={refundMethod} onValueChange={(value) => setRefundMethod(value || "")}>
                      <SelectTrigger id="refundMethod" className="mt-1">
                        <SelectValue placeholder="Select refund method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="esewa">eSewa</SelectItem>
                        <SelectItem value="khalti">Khalti</SelectItem>
                        <SelectItem value="fonepay">FonePay</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="credit">Credit Note</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      Original payment: {transaction.payment_method}
                    </p>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter any additional details about the refund..."
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Actions */}
          {transaction && totalQuantity > 0 && (
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/pos/refunds")}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={processing}
                className="bg-[#4A5D7A] hover:bg-[#2E3E52]"
              >
                {processing ? "Processing..." : `Process Refund (Rs. ${totalRefundAmount.toLocaleString()})`}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
