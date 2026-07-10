"use client";

import { useEffect, useState } from "react";
import { DateInput } from "@/components/shared/DateInput";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { customerAPI, paymentReceivedAPI, type Customer } from "@/lib/api/sales";
import { HARDWARE_LIST_PARAMS, unwrapList } from "@/lib/api/hardware-helpers";
import { getErrorMessage } from "@/lib/utils/form-errors";
import { formatNPR } from "@/lib/utils";
import { Save } from "lucide-react";

import toast from "react-hot-toast";

const fieldClass =
  "w-full h-10 px-3 text-sm border border-gray-200 dark:border-border rounded-lg bg-white dark:bg-card focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent";

const emptyForm = {
  customer: "",
  amount: "",
  date: new Date().toISOString().split("T")[0],
  payment_method: "cash",
  reference_number: "",
  notes: "",
};

interface RecordPaymentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RecordPaymentModal({ open, onClose, onSuccess }: RecordPaymentModalProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    if (!open) return;
    setFormData({ ...emptyForm, date: new Date().toISOString().split("T")[0] });
    fetchCustomers();
  }, [open]);

  const fetchCustomers = async () => {
    try {
      setLoadingCustomers(true);
      const response = await customerAPI.list(HARDWARE_LIST_PARAMS);
      setCustomers(unwrapList(response.data));
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      toast.error("Failed to load customers");
    } finally {
      setLoadingCustomers(false);
    }
  };

  const selectedCustomer = customers.find((c) => String(c.id) === formData.customer);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer || !formData.amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    const amount = parseFloat(formData.amount);
    if (selectedCustomer && amount > (selectedCustomer.current_balance || 0)) {
      toast.error(
        `Amount exceeds outstanding balance of ${formatNPR(selectedCustomer.current_balance || 0)}`
      );
      return;
    }

    try {
      setLoading(true);
      await paymentReceivedAPI.create({
        customer: formData.customer,
        amount: parseFloat(formData.amount),
        date: formData.date,
        payment_method: formData.payment_method as
          | "cash"
          | "bank"
          | "esewa"
          | "khalti"
          | "fonepay"
          | "cheque"
          | "other",
        reference_number: formData.reference_number || undefined,
        notes: formData.notes || undefined,
      });
      toast.success("Payment recorded successfully");
      onClose();
      onSuccess?.();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1.5">
              Customer <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.customer}
              onValueChange={(value) => setFormData({ ...formData, customer: value || "" })}
              disabled={loadingCustomers}
            >
              <SelectTrigger className="h-10 border-gray-200 dark:border-border w-full">
                <SelectValue placeholder={loadingCustomers ? "Loading..." : "Select a customer"} />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={String(customer.id)}>
                    {customer.name} — Balance {formatNPR(customer.current_balance || 0)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCustomer && (
              <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
                Outstanding: {formatNPR(selectedCustomer.current_balance || 0)}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1.5">
                Date <span className="text-red-500">*</span>
              </label>
              <DateInput
                value={formData.date}
                onChange={(date) => setFormData({ ...formData, date })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1.5">
                Amount (NPR) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className={fieldClass}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1.5">
                Payment Method <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) =>
                  setFormData({ ...formData, payment_method: value || "cash" })
                }
              >
                <SelectTrigger className="h-10 border-gray-200 dark:border-border w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="esewa">eSewa</SelectItem>
                  <SelectItem value="khalti">Khalti</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1.5">
                Reference Number
              </label>
              <input
                type="text"
                value={formData.reference_number}
                onChange={(e) =>
                  setFormData({ ...formData, reference_number: e.target.value })
                }
                className={fieldClass}
                placeholder="Cheque or transaction #"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1.5">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className={`${fieldClass} h-auto py-2 resize-none`}
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5"
            >
              {!loading && <Save className="h-4 w-4" />}
              {loading ? "Recording..." : "Record Payment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
