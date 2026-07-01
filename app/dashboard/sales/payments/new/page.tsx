"use client";

import { DateInput } from "@/components/shared/DateInput";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashHeader } from "@/components/dashboard/dash-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { customerAPI, invoiceAPI, paymentReceivedAPI } from "@/lib/api/sales";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";

export default function NewPaymentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  const [formData, setFormData] = useState({
    customer: "",
    date: new Date().toISOString().split('T')[0],
    amount: "",
    payment_method: "cash",
    invoice: "",
    reference_number: "",
    bank_name: "",
    notes: "",
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (formData.customer) {
      fetchInvoices(formData.customer);
    } else {
      setInvoices([]);
    }
  }, [formData.customer]);

  const fetchCustomers = async () => {
    try {
      setLoadingCustomers(true);
      const response = await customerAPI.list();
      setCustomers(response.data.results || []);
    } catch (error) {
      toast.error("Failed to load customers");
    } finally {
      setLoadingCustomers(false);
    }
  };

  const fetchInvoices = async (customerId: string) => {
    try {
      setLoadingInvoices(true);
      const response = await invoiceAPI.list({ customer: customerId, status: 'Sent,Partially Paid,Overdue' });
      setInvoices(response.data.results || []);
    } catch (error) {
      console.error("Failed to load invoices:", error);
      setInvoices([]);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customer) {
      toast.error("Please select a customer");
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      setLoading(true);
      toast.loading("Recording payment...");

      const payload: any = {
        customer: formData.customer,
        date: formData.date,
        amount: parseFloat(formData.amount),
        payment_method: formData.payment_method,
        notes: formData.notes,
      };

      if (formData.invoice) payload.invoice = formData.invoice;
      if (formData.reference_number) payload.reference_number = formData.reference_number;
      if (formData.bank_name) payload.bank_name = formData.bank_name;

      await paymentReceivedAPI.create(payload);

      toast.dismiss();
      toast.success("Payment recorded successfully");
      router.push("/dashboard/sales/payments");
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.response?.data?.detail || "Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  const selectedCustomer = customers.find(c => c.id === formData.customer);

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashHeader title="Record Payment" subtitle="Record payment from customer" />
      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 space-y-6 w-full">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Payment Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Customer <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.customer}
                  onValueChange={(value) => setFormData({ ...formData, customer: value || "", invoice: "" })}
                  disabled={loadingCustomers}
                >
                  <SelectTrigger className="h-10 border-gray-200">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} - {customer.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCustomer && (
                  <p className="text-xs text-gray-500 mt-1">
                    Outstanding: {formatCurrency(selectedCustomer.current_balance || 0)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Date <span className="text-red-500">*</span>
                </label>
                <DateInput value={formData.date} onChange={(date) => setFormData({ ...formData, date })} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full h-10 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Payment Method <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.payment_method}
                  onValueChange={(value) => setFormData({ ...formData, payment_method: value || "" })}
                >
                  <SelectTrigger className="h-10 border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="esewa">eSewa</SelectItem>
                    <SelectItem value="khalti">Khalti</SelectItem>
                    <SelectItem value="fonepay">FonePay</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Invoice (Optional)
                </label>
                <Select
                  value={formData.invoice}
                  onValueChange={(value) => setFormData({ ...formData, invoice: value || "" })}
                  disabled={!formData.customer || loadingInvoices}
                >
                  <SelectTrigger className="h-10 border-gray-200">
                    <SelectValue placeholder="Select invoice" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No specific invoice</SelectItem>
                    {invoices.map((invoice) => (
                      <SelectItem key={invoice.id} value={invoice.id}>
                        {invoice.invoice_number} - {formatCurrency(invoice.balance)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {loadingInvoices && (
                  <p className="text-xs text-gray-500 mt-1">Loading invoices...</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Reference Number
                </label>
                <input
                  type="text"
                  value={formData.reference_number}
                  onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                  className="w-full h-10 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent"
                  placeholder="Transaction ID, Cheque #, etc."
                />
              </div>

              {(formData.payment_method === "bank" || formData.payment_method === "cheque") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    className="w-full h-10 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent"
                    placeholder="Bank name"
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Notes</h3>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent resize-none"
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              className="gap-1.5 text-gray-500"
              disabled={loading}
            >
              <ArrowLeft className="h-4 w-4" /> Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5"
            >
              <Save className="h-4 w-4" /> Record Payment
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
