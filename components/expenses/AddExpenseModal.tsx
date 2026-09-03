"use client";

import { useState, useEffect } from "react";
import { Calendar, Upload, X, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { paymentMethodsAPI, type PaymentMethod } from "@/lib/api/accounting";
import toast from "react-hot-toast";

interface AddExpenseModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: ExpenseData) => Promise<void>;
}

interface ExpenseItem {
  description: string;
  amount: string;
}

export interface ExpenseData {
  expense_number: string;
  is_manual_number: boolean;
  date: string;
  category: string;
  items: ExpenseItem[];
  total_amount: number;
  payment_method_id: string | null;
  payment_method_name?: string;
  remarks: string;
  receipt: File | null;
}

// Common expense categories
const EXPENSE_CATEGORIES = [
  "Office Supplies",
  "Rent",
  "Utilities",
  "Salaries & Wages",
  "Transportation",
  "Marketing & Advertising",
  "Insurance",
  "Maintenance & Repairs",
  "Professional Fees",
  "Taxes",
  "Miscellaneous",
];

export function AddExpenseModal({
  open,
  onClose,
  onSave,
}: AddExpenseModalProps) {
  // Form state
  const [expenseNumber, setExpenseNumber] = useState("");
  const [isManualNumber, setIsManualNumber] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [items, setItems] = useState<ExpenseItem[]>([{ description: "", amount: "" }]);
  const [totalAmount, setTotalAmount] = useState("");
  const [isManualTotal, setIsManualTotal] = useState(false);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>("");
  const [remarks, setRemarks] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);

  // Category search
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const filteredCategories = EXPENSE_CATEGORIES.filter((cat) =>
    cat.toLowerCase().includes(categorySearchQuery.toLowerCase())
  );

  // Auto-generate expense number on open
  useEffect(() => {
    if (open && !isManualNumber) {
      const today = new Date();
      const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");
      const random = Math.floor(Math.random() * 9999)
        .toString()
        .padStart(4, "0");
      setExpenseNumber(`EXP-${dateStr}-${random}`);
    }
  }, [open, isManualNumber]);

  // Load payment methods when modal opens
  useEffect(() => {
    if (open) {
      loadPaymentMethods();
    }
  }, [open]);

  const loadPaymentMethods = async () => {
    setLoadingPaymentMethods(true);
    try {
      const methods = await paymentMethodsAPI.list();
      setPaymentMethods(methods);
    } catch (error) {
      console.error("Failed to load payment methods:", error);
      toast.error("Failed to load payment methods");
    } finally {
      setLoadingPaymentMethods(false);
    }
  };

  // Auto-calculate total from items
  useEffect(() => {
    if (!isManualTotal) {
      const sum = items.reduce((acc, item) => {
        const amount = parseFloat(item.amount) || 0;
        return acc + amount;
      }, 0);
      setTotalAmount(sum.toString());
    }
  }, [items, isManualTotal]);

  // Reset form when closed
  useEffect(() => {
    if (!open) {
      setExpenseNumber("");
      setIsManualNumber(false);
      setDate(new Date().toISOString().split("T")[0]);
      setCategory("");
      setCustomCategory("");
      setCategorySearchQuery("");
      setItems([{ description: "", amount: "" }]);
      setTotalAmount("");
      setIsManualTotal(false);
      setSelectedPaymentMethodId("");
      setRemarks("");
      setReceipt(null);
      setLoading(false);
    }
  }, [open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceipt(e.target.files[0]);
    }
  };

  const removeReceipt = () => {
    setReceipt(null);
  };

  const addItem = () => {
    setItems([...items, { description: "", amount: "" }]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) {
      toast.error("At least one item is required");
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof ExpenseItem, value: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleSave = async () => {
    // Validation
    if (!expenseNumber.trim()) {
      toast.error("Expense number is required");
      return;
    }
    if (!date) {
      toast.error("Date is required");
      return;
    }
    const finalCategory = category === "custom" ? customCategory : category;
    if (!finalCategory) {
      toast.error("Category is required");
      return;
    }
    const total = parseFloat(totalAmount) || 0;
    if (total <= 0) {
      toast.error("Total amount must be greater than 0");
      return;
    }

    const validItems = items.filter(
      (item) => item.description.trim() && parseFloat(item.amount) > 0
    );

    setLoading(true);
    try {
      const selectedMethod = paymentMethods.find((m) => m.id === selectedPaymentMethodId);
      
      await onSave({
        expense_number: expenseNumber.trim(),
        is_manual_number: isManualNumber,
        date,
        category: finalCategory,
        items: validItems,
        total_amount: total,
        payment_method_id: selectedPaymentMethodId || null,
        payment_method_name: selectedMethod?.name,
        remarks: remarks.trim(),
        receipt,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Add Expense
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Expense Number */}
          <div className="space-y-2">
            <Label htmlFor="expense-number">
              Expense No <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="expense-number"
                value={expenseNumber}
                onChange={(e) => setExpenseNumber(e.target.value)}
                placeholder="EXP-20260819-0001"
                disabled={!isManualNumber}
                className="flex-1"
              />
              <div className="flex items-center gap-2">
                <Checkbox
                  id="manual-number"
                  checked={isManualNumber}
                  onCheckedChange={(checked) =>
                    setIsManualNumber(checked === true)
                  }
                />
                <Label
                  htmlFor="manual-number"
                  className="text-sm font-normal cursor-pointer"
                >
                  Manual
                </Label>
              </div>
            </div>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="expense-date">
              Date <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="expense-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Expense Category */}
          <div className="space-y-2">
            <Label htmlFor="category">
              Expense Category <span className="text-red-500">*</span>
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2">
                  <Input
                    placeholder="Search categories..."
                    value={categorySearchQuery}
                    onChange={(e) => setCategorySearchQuery(e.target.value)}
                    className="h-8"
                  />
                </div>
                {filteredCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
                <SelectItem value="custom">+ Add Custom Category</SelectItem>
              </SelectContent>
            </Select>
            {category === "custom" && (
              <Input
                placeholder="Enter custom category name"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="mt-2"
              />
            )}
          </div>

          {/* Expense Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Expense Items</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
                className="text-[#22C55E] border-[#22C55E] hover:bg-[#22C55E]/10"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Item
              </Button>
            </div>
            <div className="space-y-2 border border-gray-200 rounded-lg p-3">
              {items.map((item, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <Input
                    placeholder="Item description"
                    value={item.description}
                    onChange={(e) =>
                      updateItem(index, "description", e.target.value)
                    }
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={item.amount}
                    onChange={(e) => updateItem(index, "amount", e.target.value)}
                    className="w-32 text-right"
                    step="0.01"
                    min="0"
                  />
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Total Amount */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="total-amount">
                Total Amount <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="manual-total"
                  checked={isManualTotal}
                  onCheckedChange={(checked) =>
                    setIsManualTotal(checked === true)
                  }
                />
                <Label
                  htmlFor="manual-total"
                  className="text-sm font-normal cursor-pointer"
                >
                  Manual
                </Label>
              </div>
            </div>
            <Input
              id="total-amount"
              type="number"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="text-right text-lg font-semibold"
              disabled={!isManualTotal}
            />
            {!isManualTotal && (
              <p className="text-xs text-gray-500">
                Auto-calculated from items above
              </p>
            )}
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="payment-method">Payment Method</Label>
            <Select
              value={selectedPaymentMethodId}
              onValueChange={setSelectedPaymentMethodId}
              disabled={loadingPaymentMethods}
            >
              <SelectTrigger id="payment-method">
                <SelectValue
                  placeholder={
                    loadingPaymentMethods
                      ? "Loading payment methods..."
                      : "Select payment method"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.length > 0 ? (
                  paymentMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      {method.name}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-gray-500 text-center">
                    No payment methods available
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Remarks */}
          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add any additional notes..."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Attach Receipt */}
          <div className="space-y-2">
            <Label htmlFor="receipt">Attach Receipt (optional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="receipt"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("receipt")?.click()}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Receipt Image
              </Button>
            </div>
            {receipt && (
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                <span className="truncate flex-1">{receipt.name}</span>
                <button
                  type="button"
                  onClick={removeReceipt}
                  className="text-red-600 hover:text-red-700 ml-2"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="bg-[#22C55E] hover:bg-[#16A34A] text-white"
          >
            {loading ? "Saving..." : "Save Expense"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
