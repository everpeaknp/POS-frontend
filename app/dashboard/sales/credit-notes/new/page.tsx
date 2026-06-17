"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashHeader } from "@/components/dashboard/dash-header";
import { creditNoteAPI, customerAPI, invoiceAPI, Customer, Invoice } from "@/lib/api/sales";
import toast from "react-hot-toast";
import { format } from "date-fns";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
      {children}
    </div>
  );
}

export default function NewCreditNotePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  
  const [form, setForm] = useState({
    customer: "",
    invoice: "",
    date: format(new Date(), "yyyy-MM-dd"),
    amount: "",
    reason: "",
    status: "Draft" as "Draft" | "Issued" | "Applied",
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (form.customer) {
      loadInvoices(form.customer);
    } else {
      setInvoices([]);
      setSelectedInvoice(null);
    }
  }, [form.customer]);

  useEffect(() => {
    // Update selected invoice details
    if (form.invoice) {
      const invoice = invoices.find(inv => inv.id === form.invoice);
      setSelectedInvoice(invoice || null);
    } else {
      setSelectedInvoice(null);
    }
  }, [form.invoice, invoices]);

  const loadCustomers = async () => {
    try {
      const response = await customerAPI.list();
      setCustomers(response.data.results || []);
    } catch (error) {
      console.error("Error loading customers:", error);
      toast.error("Failed to load customers");
    } finally {
      setLoadingCustomers(false);
    }
  };

  const loadInvoices = async (customerId: string) => {
    setLoadingInvoices(true);
    try {
      // Load invoices for the customer (excluding fully paid ones)
      const response = await invoiceAPI.list({ customer: customerId });
      const customerInvoices = (response.data.results || []).filter(
        inv => inv.status !== 'Draft' && Number(inv.balance) > 0
      );
      setInvoices(customerInvoices);
    } catch (error) {
      console.error("Error loading invoices:", error);
      toast.error("Failed to load invoices");
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!form.customer) {
      toast.error("Please select a customer");
      return;
    }
    if (!form.invoice) {
      toast.error("Please select an invoice");
      return;
    }
    if (!form.date) {
      toast.error("Date is required");
      return;
    }
    if (!form.amount || parseFloat(form.amount) <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }
    if (selectedInvoice && parseFloat(form.amount) > Number(selectedInvoice.balance)) {
      toast.error(`Amount cannot exceed invoice balance of Rs. ${Number(selectedInvoice.balance).toLocaleString()}`);
      return;
    }
    if (!form.reason.trim()) {
      toast.error("Reason is required");
      return;
    }

    setSubmitting(true);
    try {
      const creditNoteData: any = {
        customer: form.customer,
        invoice: form.invoice,
        date: form.date,
        amount: parseFloat(form.amount),
        reason: form.reason.trim(),
        status: form.status,
      };

      const response = await creditNoteAPI.create(creditNoteData);
      toast.success(`Credit Note ${response.data.credit_note_number} created successfully`);
      router.push(`/dashboard/sales/credit-notes/${response.data.id}`);
    } catch (error: any) {
      console.error("Error creating credit note:", error);
      console.error("Error response:", error.response?.data);
      
      if (error.response?.data) {
        const errors = error.response.data;
        if (typeof errors === "object") {
          Object.entries(errors).forEach(([field, messages]) => {
            if (Array.isArray(messages)) {
              toast.error(`${field}: ${messages.join(", ")}`);
            }
          });
        } else {
          toast.error(error.response?.data?.message || "Failed to create credit note");
        }
      } else {
        toast.error("Failed to create credit note");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingCustomers) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="New Credit Note" subtitle="Create a new credit note" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="New Credit Note" subtitle="Create a new credit note" />
      <div className="flex-1 p-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-8 max-w-3xl">

          <Section title="Customer & Invoice">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Customer" required>
                <Select 
                  value={form.customer || ""} 
                  onValueChange={(v) => setForm({ ...form, customer: v as string, invoice: "" })}
                >
                  <SelectTrigger className="h-9 text-sm border-gray-200">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Invoice" required>
                <Select 
                  value={form.invoice || ""} 
                  onValueChange={(v) => setForm({ ...form, invoice: v as string })}
                  disabled={!form.customer || loadingInvoices}
                >
                  <SelectTrigger className="h-9 text-sm border-gray-200">
                    <SelectValue placeholder={loadingInvoices ? "Loading..." : "Select invoice"} />
                  </SelectTrigger>
                  <SelectContent>
                    {invoices.length === 0 && !loadingInvoices ? (
                      <div className="px-2 py-1.5 text-sm text-gray-500">No unpaid invoices</div>
                    ) : (
                      invoices.map((invoice) => (
                        <SelectItem key={invoice.id} value={invoice.id}>
                          {invoice.invoice_number} - Balance: Rs. {Number(invoice.balance).toLocaleString()}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {/* Invoice Details */}
            {selectedInvoice && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-2">
                <div className="text-sm font-medium text-blue-900">Selected Invoice Details</div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-blue-700">Invoice Amount:</span>
                    <span className="ml-2 font-medium text-blue-900">
                      Rs. {Number(selectedInvoice.amount).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700">Paid Amount:</span>
                    <span className="ml-2 font-medium text-blue-900">
                      Rs. {Number(selectedInvoice.paid_amount).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700">Balance:</span>
                    <span className="ml-2 font-medium text-blue-900">
                      Rs. {Number(selectedInvoice.balance).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700">Status:</span>
                    <span className="ml-2 font-medium text-blue-900">{selectedInvoice.status}</span>
                  </div>
                </div>
              </div>
            )}
          </Section>

          <Section title="Credit Note Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Date" required>
                <Input
                  type="date"
                  className="h-9 text-sm border-gray-200"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </Field>
              <Field label="Amount (Rs.)" required>
                <Input
                  type="number"
                  className="h-9 text-sm border-gray-200"
                  placeholder="1000"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  min="0.01"
                  step="0.01"
                  max={selectedInvoice ? Number(selectedInvoice.balance) : undefined}
                  required
                />
                {selectedInvoice && (
                  <div className="text-xs text-gray-500 mt-1">
                    Max: Rs. {Number(selectedInvoice.balance).toLocaleString()}
                  </div>
                )}
              </Field>
              <Field label="Status">
                <Select 
                  value={form.status} 
                  onValueChange={(v) => setForm({ ...form, status: v as any })}
                >
                  <SelectTrigger className="h-9 text-sm border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Issued">Issued</SelectItem>
                    <SelectItem value="Applied">Applied</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </Section>

          <Section title="Reason">
            <Field label="Reason for Credit Note" required>
              <textarea
                className="w-full text-sm border border-gray-200 rounded-lg p-3 resize-none focus:outline-none focus:border-[#22C55E]"
                rows={4}
                placeholder="Describe the reason for issuing this credit note (e.g., damaged goods, pricing error, return, etc.)"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                required
              />
            </Field>
          </Section>

          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            <Button 
              type="button"
              variant="ghost" 
              onClick={() => router.back()} 
              className="gap-1.5 text-gray-500"
              disabled={submitting}
            >
              <ArrowLeft className="h-4 w-4" /> Cancel
            </Button>
            <Button 
              type="submit"
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white px-6"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                "Create Credit Note"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
