"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/shared/DateInput";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DashHeader } from "@/components/dashboard/dash-header";
import { LineItemsTable } from "@/components/sales/LineItemsTable";
import { SalesSummaryBox } from "@/components/sales/SalesSummaryBox";
import { customerAPI, salesOrderAPI, invoiceAPI, Customer, SalesOrder } from "@/lib/api/sales";
import { inventoryApi, Product } from "@/lib/api/inventory";
import toast from "react-hot-toast";
import type { LineItem } from "@/lib/types/sales";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
      {children}
    </div>
  );
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingSalesOrders, setLoadingSalesOrders] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState<LineItem[]>([]);
  
  // Customer creation dialog state
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    type: "Individual" as "Individual" | "Business",
  });
  
  const [form, setForm] = useState({
    customer: "",
    sales_order: "",
    payment_terms: "Net 30",
    payment_type: "cash" as "cash" | "credit",
    reference: "",
    date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: "",
  });

  useEffect(() => {
    loadCustomers();
    loadProducts();
  }, []);

  useEffect(() => {
    if (form.customer) {
      loadSalesOrders(form.customer);
    } else {
      setSalesOrders([]);
      setForm(prev => ({ ...prev, sales_order: "" }));
    }
  }, [form.customer]);

  useEffect(() => {
    // When a sales order is selected, load its details
    if (form.sales_order) {
      loadSalesOrderDetails(form.sales_order);
    }
  }, [form.sales_order]);

  const loadSalesOrderDetails = async (orderId: string) => {
    try {
      const response = await salesOrderAPI.get(orderId);
      const order = response.data;
      
      // Populate line items from the sales order
      if (order.lines && order.lines.length > 0) {
        const lineItems: LineItem[] = order.lines.map((line) => ({
          id: line.id || Math.random().toString(),
          product: line.product,
          productName: line.product_name || "",
          description: line.description || "",
          qty: line.quantity,
          unit: "pcs", // Default unit
          unitPrice: line.unit_price,
          discount: line.discount_percent,
          tax: line.tax_percent,
          amount: line.amount,
        }));
        setItems(lineItems);
      }
      
      toast.success("Sales order loaded successfully");
    } catch (error) {
      console.error("Error loading sales order:", error);
      toast.error("Failed to load sales order details");
    }
  };

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

  const handleCreateCustomer = async () => {
    // Validation
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
      const response = await customerAPI.create({
        name: newCustomer.name,
        phone: newCustomer.phone,
        email: newCustomer.email || undefined,
        address: newCustomer.address || undefined,
        type: newCustomer.type,
        credit_limit: 0,
        payment_terms: "Net 30",
        status: "active",
      });

      toast.success("Customer created successfully!");
      
      // Add to customers list and select it
      setCustomers(prev => [response.data, ...prev]);
      setForm(prev => ({ ...prev, customer: response.data.id }));
      
      // Reset form and close dialog
      setNewCustomer({
        name: "",
        phone: "",
        email: "",
        address: "",
        type: "Individual",
      });
      setCustomerDialogOpen(false);
    } catch (error: any) {
      console.error("Error creating customer:", error);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          "Failed to create customer";
      toast.error(errorMessage);
    } finally {
      setCreatingCustomer(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await inventoryApi.products.list();
      setProducts(response.data.results || []);
    } catch (error) {
      console.error("Error loading products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadSalesOrders = async (customerId: string) => {
    setLoadingSalesOrders(true);
    try {
      const response = await salesOrderAPI.list({ 
        customer: customerId, 
        status: "Confirmed,Delivered" 
      });
      setSalesOrders(response.data.results || []);
    } catch (error) {
      console.error("Error loading sales orders:", error);
    } finally {
      setLoadingSalesOrders(false);
    }
  };

  // Calculate totals
  const subtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const totalDiscount = items.reduce((s, i) => s + (i.qty * i.unitPrice * i.discount) / 100, 0);
  const totalTax = items.reduce((s, i) => {
    const base = i.qty * i.unitPrice - (i.qty * i.unitPrice * i.discount) / 100;
    return s + (base * i.tax) / 100;
  }, 0);
  const grandTotal = subtotal - totalDiscount + totalTax;

  const handleSubmit = async (status: "Draft" | "Sent" = "Draft", recordPayment: boolean = false) => {
    // Validation
    if (!form.customer) {
      toast.error("Please select a customer");
      return;
    }

    if (!form.date) {
      toast.error("Please select invoice date");
      return;
    }

    if (!form.due_date) {
      toast.error("Please select due date");
      return;
    }

    if (items.length === 0) {
      toast.error("Please add at least one line item");
      return;
    }

    setSubmitting(true);

    try {
      const invoiceData: any = {
        customer: form.customer,
        sales_order: form.sales_order || undefined,
        date: form.date,
        due_date: form.due_date,
        amount: grandTotal,
        payment_type: form.payment_type,
        status: status,
        notes: form.notes || undefined,
      };

      // If recording payment immediately, set paid_amount and status to Paid
      if (recordPayment) {
        invoiceData.paid_amount = grandTotal;
        invoiceData.status = "Paid";
      }

      const response = await invoiceAPI.create(invoiceData);
      
      if (recordPayment) {
        toast.success("Invoice created and payment recorded!");
      } else {
        toast.success(`Invoice ${status === "Draft" ? "saved as draft" : "created"} successfully!`);
      }

      router.push("/dashboard/sales/invoices");
    } catch (error: any) {
      console.error("Error creating invoice:", error);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          "Failed to create invoice";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingCustomers || loadingProducts) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <DashHeader title="Create Invoice" subtitle="New tax invoice" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#22C55E]" />
        </div>
      </div>
    );
  }

  // Show message if no customers exist
  if (!loadingCustomers && customers.length === 0) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <DashHeader title="Create Invoice" subtitle="New tax invoice" />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Customers Found</h3>
            <p className="text-gray-600 mb-6">
              You need to create at least one customer before you can create an invoice.
            </p>
            <Button 
              onClick={() => router.push("/dashboard/sales/customers/new")}
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white"
            >
              Create Your First Customer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashHeader title="Create Invoice" subtitle="New tax invoice" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 space-y-8 w-full min-h-full">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Field label="Invoice #">
              <Input className="h-9 text-sm bg-gray-50 text-gray-500" value="Auto-generated" readOnly />
            </Field>
            <Field label="Invoice Date" required>
              <DateInput 
                className="h-9 text-sm border-gray-200" 
                value={form.date}
                onChange={(date) => setForm({ ...form, date: date})}
              />
            </Field>
            <Field label="Due Date" required>
              <DateInput 
                className="h-9 text-sm border-gray-200" 
                value={form.due_date}
                onChange={(date) => setForm({ ...form, due_date: date})}
              />
            </Field>
            <Field label="Customer" required>
              <div className="flex gap-2">
                <Select 
                  value={form.customer || ""} 
                  onValueChange={(v) => setForm({ ...form, customer: v || "", sales_order: "" })}
                >
                  <SelectTrigger className="h-9 text-sm border-gray-200 flex-1">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 border-[#22C55E] text-[#22C55E] hover:bg-green-50 shrink-0"
                  onClick={() => setCustomerDialogOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </Field>
            <Field label="Payment Terms">
              <Select 
                value={form.payment_terms} 
                onValueChange={(v) => setForm({ ...form, payment_terms: v || "Net 30" })}
              >
                <SelectTrigger className="h-9 text-sm border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Immediate", "Net 15", "Net 30", "Net 60"].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Convert from Order">
              <Select 
                value={form.sales_order || ""} 
                onValueChange={(v) => setForm({ ...form, sales_order: v || "" })}
                disabled={!form.customer || loadingSalesOrders}
              >
                <SelectTrigger className="h-9 text-sm border-gray-200">
                  <SelectValue placeholder={loadingSalesOrders ? "Loading..." : "— None —"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">— None —</SelectItem>
                  {salesOrders
                    .filter((o) => o.status === "Confirmed" || o.status === "Delivered")
                    .map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.order_number} — {o.customer_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Payment Type" required>
              <Select 
                value={form.payment_type} 
                onValueChange={(v) => {
                  if (v === "cash" || v === "credit") {
                    setForm({ ...form, payment_type: v });
                  }
                }}
              >
                <SelectTrigger className="h-9 text-sm border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Reference / PO Number">
              <Input 
                className="h-9 text-sm border-gray-200" 
                placeholder="PO-XXX"
                value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
              />
            </Field>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Line Items</h3>
            <LineItemsTable items={items} onChange={setItems} products={products} />
          </div>

          <div className="flex justify-end">
            <SalesSummaryBox 
              subtotal={subtotal} 
              totalDiscount={totalDiscount} 
              totalTax={totalTax} 
              grandTotal={grandTotal} 
            />
          </div>

          <div>
            <Label className="text-sm">Notes / Terms</Label>
            <textarea 
              className="mt-1.5 w-full h-20 text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-[#22C55E]"
              placeholder="Payment terms, bank details, thank you note..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100">
            <Button 
              variant="ghost" 
              onClick={() => router.push("/dashboard/sales/invoices")} 
              className="gap-1.5 text-gray-500"
              disabled={submitting}
            >
              <ArrowLeft className="h-4 w-4" /> Cancel
            </Button>
            <div className="flex-1" />
            <Button 
              variant="outline" 
              className="border-gray-200 text-gray-700"
              onClick={() => handleSubmit("Draft")}
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Save Draft"}
            </Button>
            <Button 
              variant="outline" 
              className="border-[#22C55E] text-[#22C55E] hover:bg-green-50"
              onClick={() => handleSubmit("Sent")}
              disabled={submitting}
            >
              {submitting ? "Sending..." : "Send Invoice"}
            </Button>
            <Button 
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white px-6"
              onClick={() => handleSubmit("Sent", true)}
              disabled={submitting}
            >
              {submitting ? "Processing..." : "Record Payment"}
            </Button>
          </div>
        </div>
      </div>

      {/* Add Customer Dialog */}
      <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="customer-name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="customer-name"
                placeholder="Customer name"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-phone">
                Phone <span className="text-red-500">*</span>
              </Label>
              <Input
                id="customer-phone"
                placeholder="Phone number"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-email">Email</Label>
              <Input
                id="customer-email"
                type="email"
                placeholder="email@example.com"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-address">Address</Label>
              <Input
                id="customer-address"
                placeholder="Customer address"
                value={newCustomer.address}
                onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-type">Type</Label>
              <Select
                value={newCustomer.type}
                onValueChange={(v) => setNewCustomer({ ...newCustomer, type: v as "Individual" | "Business" })}
              >
                <SelectTrigger id="customer-type" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Individual">Individual</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
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
              disabled={creatingCustomer}
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white"
            >
              {creatingCustomer ? "Creating..." : "Create Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
