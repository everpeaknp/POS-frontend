"use client";

import { PageLoading } from "@/components/shared/PageLoading";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"
import { DateInput } from "@/components/shared/DateInput";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DashHeader } from "@/components/dashboard/dash-header";
import { LineItemsTable } from "@/components/sales/LineItemsTable";
import { SalesSummaryBox } from "@/components/sales/SalesSummaryBox";
import { quotationAPI, customerAPI, type QuotationLine, type Customer } from "@/lib/api/sales";
import { inventoryApi } from "@/lib/api/inventory";
import toast from "react-hot-toast";

type LineItem = {
  id: string;
  product: string;
  description: string;
  qty: number;
  unit: string;
  unitPrice: number;
  discount: number;
  tax: number;
  amount: number;
};

export default function NewQuotationPage() {
  const router = useRouter();
  const [items, setItems] = useState<LineItem[]>([]);
  const [form, setForm] = useState({ 
    customer: "", 
    date: new Date().toISOString().split('T')[0],
    validUntil: "", 
    status: "Draft", 
    notes: "" 
  });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    type: "Individual" as "Individual" | "Business",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersRes, productsRes] = await Promise.all([
          customerAPI.list(),
          inventoryApi.products.list()
        ]);
        setCustomers(customersRes.data.results || []);
        setProducts(productsRes.data.results || []);
      } catch (error: any) {
        console.error('Error fetching data:', error);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const subtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const totalDiscount = items.reduce((s, i) => s + (i.qty * i.unitPrice * i.discount) / 100, 0);
  const totalTax = items.reduce((s, i) => { 
    const base = i.qty * i.unitPrice - (i.qty * i.unitPrice * i.discount) / 100; 
    return s + (base * i.tax) / 100; 
  }, 0);
  const grandTotal = subtotal - totalDiscount + totalTax;

  const handleCreateCustomer = async () => {
    if (!newCustomer.name.trim()) {
      toast.error("Customer name is required");
      return;
    }
    if (!newCustomer.phone.trim()) {
      toast.error("Phone number is required");
      return;
    }

    setCreatingCustomer(true);
    try {
      const customerData = {
        name: newCustomer.name.trim(),
        phone: newCustomer.phone.trim(),
        email: newCustomer.email.trim() || undefined,
        address: newCustomer.address.trim() || undefined,
        type: newCustomer.type,
        status: "active" as const,
      };

      const response = await customerAPI.create(customerData);
      toast.success(`Customer ${response.data.name} created successfully`);
      
      // Add new customer to the list and select it
      setCustomers([...customers, response.data]);
      setForm({ ...form, customer: response.data.id.toString() });
      
      // Reset form and close dialog
      setNewCustomer({ name: "", phone: "", email: "", address: "", type: "Individual" });
      setCustomerDialogOpen(false);
    } catch (error: any) {
      if (error.response?.data) {
        const errors = error.response.data;
        if (typeof errors === 'object') {
          Object.entries(errors).forEach(([field, messages]) => {
            if (Array.isArray(messages)) {
              toast.error(`${field}: ${messages.join(', ')}`);
            }
          });
        } else {
          toast.error(error.response?.data?.message || "Failed to create customer");
        }
      } else {
        toast.error("Failed to create customer");
      }
    } finally {
      setCreatingCustomer(false);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!form.customer) {
      toast.error("Please select a customer");
      return;
    }
    if (!form.validUntil) {
      toast.error("Please set valid until date");
      return;
    }
    if (items.length === 0) {
      toast.error("Please add at least one line item");
      return;
    }
    if (items.some(item => !item.product || item.qty <= 0)) {
      toast.error("All line items must have a product and quantity");
      return;
    }

    setSubmitting(true);
    try {
      const quotationData = {
        customer: parseInt(form.customer),
        date: form.date,
        valid_until: form.validUntil,
        status: form.status as 'Draft' | 'Sent',
        notes: form.notes,
        subtotal,
        discount: totalDiscount,
        tax: totalTax,
        total: grandTotal,
        lines: items.map(item => ({
          product: parseInt(item.product),
          description: item.description,
          quantity: item.qty,
          unit_price: item.unitPrice,
          discount_percent: item.discount,
          tax_percent: item.tax,
        }))
      };

      const response = await quotationAPI.create(quotationData);
      toast.success(`Quotation ${response.data.quotation_number} created successfully`);
      router.push(`/dashboard/sales/quotations/${response.data.id}`);
    } catch (error: any) {
      console.error('Error creating quotation:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || "Failed to create quotation");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <DashHeader title="New Quotation" subtitle="Loading..." />
        <PageLoading message="Loading…" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashHeader title="New Quotation" subtitle="Create a new quotation" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 space-y-8 w-full min-h-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Date</Label>
              <DateInput 
                
                value={form.date} 
                onChange={(date) => setForm({ ...form, date: date})}
                className="h-9 text-sm border-gray-200" 
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Customer <span className="text-red-500">*</span></Label>
              <div className="flex gap-2">
                <Select value={form.customer} onValueChange={(v) => setForm({ ...form, customer: v ?? "" })}>
                  <SelectTrigger className="h-9 text-sm border-gray-200">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.name}{c.phone ? ` (${c.phone})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen}>
                  <button 
                    type="button"
                    onClick={() => setCustomerDialogOpen(true)}
                    className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-gray-200 hover:border-[#22C55E] hover:text-[#22C55E] hover:bg-gray-50 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add New Customer</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-sm">Name <span className="text-red-500">*</span></Label>
                        <Input 
                          value={newCustomer.name}
                          onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                          placeholder="Customer name"
                          className="h-9 text-sm border-gray-200"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-sm">Phone <span className="text-red-500">*</span></Label>
                        <Input 
                          value={newCustomer.phone}
                          onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                          placeholder="98XXXXXXXX"
                          className="h-9 text-sm border-gray-200"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-sm">Email</Label>
                        <Input 
                          type="email"
                          value={newCustomer.email}
                          onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                          placeholder="email@domain.com"
                          className="h-9 text-sm border-gray-200"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-sm">Address</Label>
                        <Input 
                          value={newCustomer.address}
                          onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                          placeholder="City, District"
                          className="h-9 text-sm border-gray-200"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-sm">Type</Label>
                        <Select 
                          value={newCustomer.type} 
                          onValueChange={(v) => setNewCustomer({ ...newCustomer, type: v as "Individual" | "Business" })}
                        >
                          <SelectTrigger className="h-9 text-sm border-gray-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Individual">Individual</SelectItem>
                            <SelectItem value="Business">Business</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t">
                      <Button 
                        type="button"
                        variant="outline" 
                        onClick={() => setCustomerDialogOpen(false)}
                        disabled={creatingCustomer}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="button"
                        onClick={handleCreateCustomer}
                        className="bg-[#22C55E] hover:bg-[#16A34A] text-white"
                        disabled={creatingCustomer}
                      >
                        {creatingCustomer ? "Creating..." : (
                          'Create Customer'
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Valid Until <span className="text-red-500">*</span></Label>
              <DateInput 
                
                value={form.validUntil} 
                onChange={(date) => setForm({ ...form, validUntil: date})}
                className="h-9 text-sm border-gray-200" 
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v ?? "Draft" })}>
                <SelectTrigger className="h-9 text-sm border-gray-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Sent">Sent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Line Items</h3>
            <LineItemsTable items={items} onChange={setItems} products={products} />
          </div>

          <div className="flex flex-col lg:flex-row gap-6 justify-between">
            <div className="flex-1 min-w-0">
              <Label className="text-sm mb-1.5 block">Notes</Label>
              <textarea 
                rows={3} 
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full text-sm border border-gray-200 rounded-lg p-3 resize-none focus:outline-none focus:border-[#22C55E]" 
              />
            </div>
            <SalesSummaryBox 
              subtotal={subtotal} 
              totalDiscount={totalDiscount} 
              totalTax={totalTax} 
              grandTotal={grandTotal} 
            />
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            <Button 
              variant="ghost" 
              onClick={() => router.back()} 
              className="gap-1.5 text-gray-500"
              disabled={submitting}
            >
              <ArrowLeft className="h-4 w-4" /> Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white"
            >
              {submitting ? "Creating..." : (
                'Create Quotation'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
