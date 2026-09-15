"use client";

import { useState, useEffect } from "react";
import { Calendar, Upload, X } from "lucide-react";
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
import { type Customer } from "@/lib/api/sales";
import { type PaymentMethod, type BankAccount } from "@/lib/api/accounting";

interface ConfirmSaleModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: SaleConfirmationData) => Promise<void>;
  onSaveAndPrint: (data: SaleConfirmationData) => Promise<void>;
  totalAmount: number;
  customers: Customer[];
  paymentMethods: PaymentMethod[];
  bankAccounts: BankAccount[];
}

export interface SaleConfirmationData {
  invoiceNumber: string;
  isManualInvoice: boolean;
  invoiceDate: string;
  customerId: string | null;
  receivedAmount: number | null;
  paymentMethodId: string | null;
  bankAccountId: string | null;
  notes: string;
  attachments: File[];
}

export function ConfirmSaleModal({
  open,
  onClose,
  onSave,
  onSaveAndPrint,
  totalAmount,
  customers,
  paymentMethods,
  bankAccounts,
}: ConfirmSaleModalProps) {
  // Form state
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [isManualInvoice, setIsManualInvoice] = useState(false);
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [enableReceivedAmount, setEnableReceivedAmount] = useState(false);
  const [receivedAmount, setReceivedAmount] = useState("");
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>("");
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  // Customer search
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(customerSearchQuery.toLowerCase())
  );

  // Check if selected payment method requires bank account
  const selectedPaymentMethod = paymentMethods.find(
    (pm) => pm.id === selectedPaymentMethodId
  );
  const requiresBankAccount = selectedPaymentMethod?.method_type !== 'cash';

  // Auto-generate invoice number on open
  useEffect(() => {
    if (open && !isManualInvoice) {
      // Generate simple invoice number: INV-YYYYMMDD-NNNN
      const today = new Date();
      const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");
      const random = Math.floor(Math.random() * 9999)
        .toString()
        .padStart(4, "0");
      setInvoiceNumber(`INV-${dateStr}-${random}`);
    }
  }, [open, isManualInvoice]);

  // Reset form when closed
  useEffect(() => {
    if (!open) {
      setInvoiceNumber("");
      setIsManualInvoice(false);
      setInvoiceDate(new Date().toISOString().split("T")[0]);
      setSelectedCustomerId("");
      setCustomerSearchQuery("");
      setEnableReceivedAmount(false);
      setReceivedAmount("");
      setSelectedPaymentMethodId("");
      setSelectedBankAccountId("");
      setNotes("");
      setAttachments([]);
      setLoading(false);
    }
  }, [open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const buildFormData = (): SaleConfirmationData => {
    return {
      invoiceNumber: invoiceNumber.trim(),
      isManualInvoice,
      invoiceDate,
      customerId: selectedCustomerId || null,
      receivedAmount: enableReceivedAmount && receivedAmount
        ? parseFloat(receivedAmount)
        : null,
      paymentMethodId: selectedPaymentMethodId || null,
      bankAccountId: requiresBankAccount && selectedBankAccountId ? selectedBankAccountId : null,
      notes: notes.trim(),
      attachments,
    };
  };

  const handleSave = async () => {
    if (!invoiceNumber.trim()) {
      return;
    }
    setLoading(true);
    try {
      await onSave(buildFormData());
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndPrint = async () => {
    if (!invoiceNumber.trim()) {
      return;
    }
    setLoading(true);
    try {
      await onSaveAndPrint(buildFormData());
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Confirm Sale
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Invoice Number */}
          <div className="space-y-2">
            <Label htmlFor="invoice-number">
              Invoice No <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="invoice-number"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="INV-20240101-0001"
                disabled={!isManualInvoice}
                className="flex-1"
              />
              <div className="flex items-center gap-2">
                <Checkbox
                  id="manual-invoice"
                  checked={isManualInvoice}
                  onCheckedChange={(checked) =>
                    setIsManualInvoice(checked === true)
                  }
                />
                <Label
                  htmlFor="manual-invoice"
                  className="text-sm font-normal cursor-pointer"
                >
                  Manual
                </Label>
              </div>
            </div>
          </div>

          {/* Invoice Date */}
          <div className="space-y-2">
            <Label htmlFor="invoice-date">Invoice Date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="invoice-date"
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Bill To (Customer) */}
          <div className="space-y-2">
            <Label htmlFor="customer">Bill To</Label>
            <Select
              value={selectedCustomerId}
              onValueChange={setSelectedCustomerId}
            >
              <SelectTrigger id="customer">
                <SelectValue placeholder="Select a customer (optional)" />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2">
                  <Input
                    placeholder="Search customers..."
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                    className="h-8"
                  />
                </div>
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-gray-500 text-center">
                    No customers found
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Total Amount (Read-only) */}
          <div className="space-y-2">
            <Label htmlFor="total-amount">Total Amount</Label>
            <Input
              id="total-amount"
              value={`Rs. ${totalAmount.toFixed(2)}`}
              readOnly
              disabled
              className="bg-gray-50 font-semibold"
            />
          </div>

          {/* Received Amount */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="enable-received"
                checked={enableReceivedAmount}
                onCheckedChange={(checked) =>
                  setEnableReceivedAmount(checked === true)
                }
              />
              <Label
                htmlFor="enable-received"
                className="font-medium cursor-pointer"
              >
                Received Amount
              </Label>
            </div>
            {enableReceivedAmount && (
              <Input
                type="number"
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="text-right"
              />
            )}
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="payment-method">Payment Method</Label>
            <Select
              value={selectedPaymentMethodId}
              onValueChange={(value) => {
                setSelectedPaymentMethodId(value);
                setSelectedBankAccountId(""); // Reset bank account when payment method changes
              }}
            >
              <SelectTrigger id="payment-method">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.length > 0 ? (
                  paymentMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      {method.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="cash">Cash</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Bank Account (shown only for non-cash payments) */}
          {requiresBankAccount && (
            <div className="space-y-2">
              <Label htmlFor="bank-account">
                Select Bank Account <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedBankAccountId}
                onValueChange={setSelectedBankAccountId}
              >
                <SelectTrigger id="bank-account">
                  <SelectValue placeholder="Select bank account" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.length > 0 ? (
                    bankAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.bank_name} - {account.account_name} ({account.account_number})
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-gray-500 text-center">
                      No bank accounts available
                    </div>
                  )}
                </SelectContent>
              </Select>
              {bankAccounts.length === 0 && (
                <p className="text-xs text-amber-600">
                  No bank accounts found. Create one in Accounting → Bank Accounts first.
                </p>
              )}
            </div>
          )}

          {/* Notes/Remarks */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes or Remarks</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes..."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Attach Images */}
          <div className="space-y-2">
            <Label htmlFor="attachments">Attach Images (optional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="attachments"
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  document.getElementById("attachments")?.click()
                }
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Images
              </Button>
            </div>
            {attachments.length > 0 && (
              <div className="space-y-1 mt-2">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                  >
                    <span className="truncate flex-1">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="text-red-600 hover:text-red-700 ml-2"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
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
            variant="outline"
            onClick={handleSave}
            disabled={loading || !invoiceNumber.trim()}
            className="border-[#22C55E] text-[#22C55E] hover:bg-[#22C55E]/10"
          >
            {loading ? "Saving..." : "Save Only"}
          </Button>
          <Button
            type="button"
            onClick={handleSaveAndPrint}
            disabled={loading || !invoiceNumber.trim()}
            className="bg-[#22C55E] hover:bg-[#16A34A] text-white"
          >
            {loading ? "Saving..." : "Save & Print"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
