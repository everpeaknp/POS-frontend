"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"
import { DateInput } from "@/components/shared/DateInput";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DashHeader } from "@/components/dashboard/dash-header";
import { LineItemsTable } from "@/components/sales/LineItemsTable";
import { SalesSummaryBox } from "@/components/sales/SalesSummaryBox";
import { Combobox } from "@/components/ui/combobox";
import { customerAPI, salesOrderAPI, type Customer, type SalesOrderLine } from "@/lib/api/sales";
import { inventoryApi, type Product } from "@/lib/api/inventory";
import toast from "react-hot-toast";
import type { LineItem } from "@/lib/types/sales";

export default function NewSalesOrderPage() {
  const router = useRouter();
  
  const [items, setItems] = useState<LineItem[]>([]);
  const [form, setForm] = useState({ 
    customer: "", 
    date: new Date().toISOString().split('T')[0],
    deliveryDate: "", 
    status: "Draft", 
    paymentType: "cash",
    reference: "", 
    notes: "" 
  });
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
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
          customerAPI.list({ status: 'active' }),
          inventoryApi.products.list({ status: 'active' })
        ]);
        setCustomers(customersRes.data.results);
        setProducts(productsRes.data.results);
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to load customers and products");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const subtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const totalDiscount = items.reduce((s, i) => s + (i.qty * i.unitPrice * i.discount) / 100, 0);
  const totalTax = items.reduce((s, i) => { const base = i.qty * i.unitPrice - (i.qty * i.unitPrice * i.discount) / 100; return s + (base * i.tax) / 100; }, 0);
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
      setForm({ ...form, customer: response.data.id });
      
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

  const handleSubmit = async (status: 'Draft' | 'Confirmed') => {
    if (!form.customer) {
      toast.error("Please select a customer");
      return;
    }

    if (items.length === 0) {
      toast.error("Please add at least one line item");
      return;
    }

    const invalidItems = items.filter(item => !item.product || item.qty <= 0);
    if (invalidItems.length > 0) {
      toast.error("Please ensure all line items have a product and quantity");
      return;
    }

    setSubmitting(true);
    try {
      const lines: SalesOrderLine[] = items.map(item => ({
        product: item.product,
        description: item.description || '',
        quantity: item.qty,
        unit_price: item.unitPrice,
        discount_percent: item.discount,
        tax_percent: item.tax,
        amount: item.amount,
      }));

      const orderData: any = {
        date: form.date,
        customer: form.customer,
        reference: form.reference || undefined,
        status: status,
        payment_type: form.paymentType,
        subtotal: subtotal,
        discount: totalDiscount,
        tax: totalTax,
        total: grandTotal,
        notes: form.notes || undefined,
        lines: lines,
      };

      const response = await salesOrderAPI.create(orderData);
      toast.success(`Sales order ${response.data.order_number} created successfully`);
      router.push(`/dashboard/sales/orders/${response.data.id}`);
    } catch (error: any) {
      // Handle validation errors from backend
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Handle field-specific errors
        if (typeof errorData === 'object' && !errorData.message && !errorData.detail) {
          // Extract all error messages from fields
          const errorMessages: string[] = [];
          Object.entries(errorData).forEach(([field, messages]) => {
            if (Array.isArray(messages)) {
              messages.forEach(msg => errorMessages.push(`${field}: ${msg}`));
            } else if (typeof messages === 'string') {
              errorMessages.push(`${field}: ${messages}`);
            }
          });
          
          if (errorMessages.length > 0) {
            errorMessages.forEach(msg => toast.error(msg));
            return;
          }
        }
        
        // Handle single error message
        const errorMsg = errorData.message || errorData.detail || errorData.error;
        if (errorMsg) {
          toast.error(errorMsg);
          return;
        }
      }
      
      // Fallback error message
      toast.error("Failed to create sales order. Please check your input and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <DashHeader title="New Sales Order" subtitle="Loading..." />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#22C55E]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashHeader title="New Sales Order" subtitle="Create a new sales order" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 space-y-8 w-full min-h-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Order Date <span className="text-red-500">*</span></Label>
              <DateInput 
                 
                value={form.date} 
                onChange={(date) => setForm({ ...form, date: date})}
                className="h-9 text-sm border-gray-200" 
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Customer <span className="text-red-500">*</span></Label>
              <div className="flex gap-2">
                <Select value={form.customer || ""} onValueChange={(v) => setForm({ ...form, customer: v as string })}>
                  <SelectTrigger className="h-9 text-sm border-gray-200">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
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
                        {creatingCustomer ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Creating...
                          </>
                        ) : (
                          'Create Customer'
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Payment Type</Label>
              <Select value={form.paymentType || ""} onValueChange={(v) => setForm({ ...form, paymentType: v as string })}>
                <SelectTrigger className="h-9 text-sm border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Status</Label>
              <Select value={form.status || ""} onValueChange={(v) => setForm({ ...form, status: v as string })}>
                <SelectTrigger className="h-9 text-sm border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Confirmed">Confirmed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Reference / PO Number</Label>
              <Input 
                value={form.reference} 
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
                placeholder="PO-XXX" 
                className="h-9 text-sm border-gray-200" 
              />
            </div>
          </div>

          {/* Product Selection */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Add Product</h3>
            <Combobox
              options={products
                .filter((p) => p.total_stock && p.total_stock > 0) // Only show products with stock
                .map((p) => ({
                  value: String(p.id),
                  label: `${p.name} (${p.sku})`,
                  subtitle: p.total_stock !== undefined ? `Stock: ${p.total_stock} | Price: Rs. ${p.selling_price}` : undefined,
                }))}
              value=""
              onValueChange={(productId) => {
                const product = products.find((p) => String(p.id) === productId);
                if (product) {
                  // Check stock availability
                  if (!product.total_stock || product.total_stock <= 0) {
                    toast.error(`${product.name} is out of stock`);
                    return;
                  }
                  
                  // Parse selling_price as it comes as string from API
                  const sellingPrice = typeof product.selling_price === 'string' 
                    ? parseFloat(product.selling_price) 
                    : (typeof product.selling_price === 'number' ? product.selling_price : 0);
                  
                  const newItem: LineItem = {
                    id: Date.now().toString(),
                    product: productId,
                    description: "",
                    qty: 1,
                    unit: product.unit_name,
                    unitPrice: sellingPrice,
                    discount: 0,
                    tax: 13,
                    amount: sellingPrice * 1.13,
                  };
                  setItems([...items, newItem]);
                }
              }}
              placeholder="Select product to add (only in-stock items shown)"
              searchPlaceholder="Search products..."
              emptyText="No in-stock products found."
              className="w-full"
            />
            {products.filter(p => !p.total_stock || p.total_stock <= 0).length > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                {products.filter(p => !p.total_stock || p.total_stock <= 0).length} out-of-stock product(s) hidden
              </p>
            )}
          </div>

          {/* Line Items */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Line Items</h3>
            <LineItemsTable items={items} onChange={setItems} products={products} />
          </div>

          <div className="flex flex-col lg:flex-row gap-6 justify-between">
            <div className="flex-1 min-w-0">
              <Label className="text-sm mb-1.5 block">Notes / Terms</Label>
              <textarea 
                value={form.notes} 
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={4} 
                placeholder="Payment terms, delivery notes..."
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
              variant="outline" 
              onClick={() => handleSubmit('Draft')}
              className="border-[#22C55E] text-[#22C55E] hover:bg-green-50"
              disabled={submitting}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save as Draft
            </Button>
            <Button 
              onClick={() => handleSubmit('Confirmed')}
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white"
              disabled={submitting}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm Order
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
