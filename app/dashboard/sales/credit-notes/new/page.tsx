"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/shared/DateInput";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  SalesPageShell,
  salesCardClass,
  salesSectionTitleClass,
} from "@/components/dashboard/SalesPageShell";
import { creditNoteAPI, customerAPI, invoiceAPI, Customer, Invoice } from "@/lib/api/sales";
import toast from "react-hot-toast";
import { format } from "date-fns";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className={salesSectionTitleClass}>{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm text-gray-700 dark:text-foreground">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
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
    if (form.invoice) {
      const invoice = invoices.find((inv) => inv.id === form.invoice);
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
      const response = await invoiceAPI.list({ customer: customerId });
      const customerInvoices = (response.data.results || []).filter(
        (inv) => inv.status !== "Draft" && Number(inv.balance) > 0
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
      toast.error(
        `Amount cannot exceed invoice balance of Rs. ${Number(selectedInvoice.balance).toLocaleString()}`
      );
      return;
    }
    if (!form.reason.trim()) {
      toast.error("Reason is required");
      return;
    }

    setSubmitting(true);
    try {
      const creditNoteData = {
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
    } catch (error: unknown) {
      console.error("Error creating credit note:", error);
      const err = error as { response?: { data?: Record<string, string[] | string> & { message?: string } } };
      if (err.response?.data) {
        const errors = err.response.data;
        if (typeof errors === "object") {
          Object.entries(errors).forEach(([field, messages]) => {
            if (Array.isArray(messages)) {
              toast.error(`${field}: ${messages.join(", ")}`);
            }
          });
        } else {
          toast.error(err.response?.data?.message || "Failed to create credit note");
        }
      } else {
        toast.error("Failed to create credit note");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SalesPageShell
      title="New Credit Note"
      subtitle="Create a new credit note"
      variant="fullscreen"
      loading={loadingCustomers}
    >
      {!loadingCustomers && (
        <div className={`${salesCardClass} p-6 lg:p-8 w-full min-h-full`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-foreground">Credit Note</h2>
              <p className="text-sm text-gray-500 dark:text-muted-foreground">
                Issue a credit against an existing invoice
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <Section title="Customer & Invoice">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Field label="Customer" required>
                  <Select
                    value={form.customer || ""}
                    onValueChange={(v) => setForm({ ...form, customer: v as string, invoice: "" })}
                  >
                    <SelectTrigger className="h-9 text-sm border-gray-200 dark:border-border">
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
                    <SelectTrigger className="h-9 text-sm border-gray-200 dark:border-border">
                      <SelectValue placeholder={loadingInvoices ? "Loading..." : "Select invoice"} />
                    </SelectTrigger>
                    <SelectContent>
                      {invoices.length === 0 && !loadingInvoices ? (
                        <div className="px-2 py-1.5 text-sm text-gray-500">No unpaid invoices</div>
                      ) : (
                        invoices.map((invoice) => (
                          <SelectItem key={invoice.id} value={invoice.id}>
                            {invoice.invoice_number} - Balance: Rs.{" "}
                            {Number(invoice.balance).toLocaleString()}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              {selectedInvoice && (
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-lg p-4 space-y-2">
                  <div className="text-sm font-medium text-blue-900 dark:text-blue-200">
                    Selected Invoice Details
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-blue-700 dark:text-blue-300">Invoice Amount:</span>
                      <span className="ml-2 font-medium text-blue-900 dark:text-blue-100">
                        Rs. {Number(selectedInvoice.amount).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700 dark:text-blue-300">Paid Amount:</span>
                      <span className="ml-2 font-medium text-blue-900 dark:text-blue-100">
                        Rs. {Number(selectedInvoice.paid_amount).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700 dark:text-blue-300">Balance:</span>
                      <span className="ml-2 font-medium text-blue-900 dark:text-blue-100">
                        Rs. {Number(selectedInvoice.balance).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700 dark:text-blue-300">Status:</span>
                      <span className="ml-2 font-medium text-blue-900 dark:text-blue-100">
                        {selectedInvoice.status}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </Section>

            <Section title="Credit Note Details">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Field label="Date" required>
                  <DateInput
                    className="h-9 text-sm border-gray-200 dark:border-border"
                    value={form.date}
                    onChange={(date) => setForm({ ...form, date })}
                    required
                  />
                </Field>
                <Field label="Amount (Rs.)" required>
                  <Input
                    type="number"
                    className="h-9 text-sm border-gray-200 dark:border-border"
                    placeholder="1000"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    min="0.01"
                    step="0.01"
                    max={selectedInvoice ? Number(selectedInvoice.balance) : undefined}
                    required
                  />
                  {selectedInvoice && (
                    <div className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
                      Max: Rs. {Number(selectedInvoice.balance).toLocaleString()}
                    </div>
                  )}
                </Field>
                <Field label="Status">
                  <Select
                    value={form.status}
                    onValueChange={(v) => setForm({ ...form, status: v as typeof form.status })}
                  >
                    <SelectTrigger className="h-9 text-sm border-gray-200 dark:border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Issued">Issued</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </Section>

            <Section title="Reason">
              <Field label="Reason for Credit Note" required>
                <textarea
                  className="w-full text-sm border border-gray-200 dark:border-border rounded-lg p-3 resize-none bg-white dark:bg-card focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent"
                  rows={4}
                  placeholder="Describe the reason for issuing this credit note (e.g., damaged goods, pricing error, return, etc.)"
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  required
                />
              </Field>
            </Section>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={submitting}
              >
                Cancel
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
      )}
    </SalesPageShell>
  );
}
