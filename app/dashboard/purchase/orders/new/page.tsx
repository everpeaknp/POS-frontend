"use client";

import { PageLoading } from "@/components/shared/PageLoading";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"
import { DateInput } from "@/components/shared/DateInput";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DashHeader } from "@/components/dashboard/dash-header";
import { LineItemsTable, type PurchaseLineItem } from "@/components/purchase/LineItemsTable";
import { SummaryBox } from "@/components/purchase/SummaryBox";
import { Combobox } from "@/components/ui/combobox";
import { purchaseOrdersAPI, suppliersAPI, type Supplier, type PurchaseOrderLine } from "@/lib/api/purchase";
import { inventoryApi, type Product } from "@/lib/api/inventory";
import toast from "react-hot-toast";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
      {children}
    </div>
  );
}

function getPurchaseUnitPrice(product: Product): number {
  const costPrice = typeof product.cost_price === "string"
    ? parseFloat(product.cost_price)
    : (typeof product.cost_price === "number" ? product.cost_price : 0);
  const sellingPrice = typeof product.selling_price === "string"
    ? parseFloat(product.selling_price)
    : (typeof product.selling_price === "number" ? product.selling_price : 0);
  if (!isNaN(costPrice) && costPrice > 0) return costPrice;
  if (!isNaN(sellingPrice) && sellingPrice > 0) return sellingPrice;
  return 0;
}

function getProductUnit(product: Product): string {
  if (product.unit_name) return product.unit_name;
  if (typeof product.unit === "string") return product.unit;
  if (product.unit && typeof product.unit === "object" && "abbreviation" in product.unit) {
    return (product.unit as { abbreviation: string }).abbreviation;
  }
  return "Pcs";
}

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const [items, setItems] = useState<PurchaseLineItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Supplier dialog state
  const [showSupplierDialog, setShowSupplierDialog] = useState(false);
  const [creatingSupplier, setCreatingSupplier] = useState(false);
  const [supplierForm, setSupplierForm] = useState({
    name: "",
    phone: "",
    email: "",
    website: "",
    type: "Company",
  });

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    supplier: "",
    expected_delivery_date: "",
    reference: "",
    payment_terms: "Net 30",
    status: "Draft",
    notes: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [suppliersRes, productsRes] = await Promise.all([
          suppliersAPI.list({ status: 'active' }),
          inventoryApi.products.list({ status: 'active' })
        ]);
        // Handle both array and paginated responses for suppliers
        const suppliersList = Array.isArray(suppliersRes) 
          ? suppliersRes 
          : ((suppliersRes as any)?.results || []);
        setSuppliers(suppliersList);
        setProducts(productsRes.data?.results || []);
      } catch (error: any) {
        console.error("Failed to load data:", error);
        toast.error("Failed to load suppliers and products");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const subtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const totalDiscount = items.reduce((s, i) => s + (i.qty * i.unitPrice * i.discount) / 100, 0);
  const totalTax = items.reduce((s, i) => { const b = i.qty * i.unitPrice - (i.qty * i.unitPrice * i.discount) / 100; return s + (b * i.tax) / 100; }, 0);
  const grandTotal = subtotal - totalDiscount + totalTax;

  const handleCreateSupplier = async () => {
    if (!supplierForm.name || !supplierForm.phone) {
      toast.error("Name and phone are required");
      return;
    }

    setCreatingSupplier(true);
    try {
      const newSupplier = await suppliersAPI.create({
        name: supplierForm.name,
        phone: supplierForm.phone,
        email: supplierForm.email || undefined,
        website: supplierForm.website || undefined,
        type: supplierForm.type,
        status: "active",
      });

      toast.success("Supplier created successfully");
      setSuppliers([...suppliers, newSupplier]);
      setForm({ ...form, supplier: newSupplier.id });
      setShowSupplierDialog(false);
      setSupplierForm({ name: "", phone: "", email: "", website: "", type: "Company" });
    } catch (error: any) {
      console.error("Failed to create supplier:", error);
      toast.error(error.response?.data?.message || "Failed to create supplier");
    } finally {
      setCreatingSupplier(false);
    }
  };

  const handleSubmit = async (status: 'Draft' | 'Sent') => {
    if (!form.supplier) {
      toast.error("Please select a supplier");
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
    
    const lines: PurchaseOrderLine[] = items.map(item => ({
      product: item.product,
      quantity: item.qty,
      unit_price: item.unitPrice,
      tax_percent: item.tax,
    }));

    // Default expected_delivery_date to 7 days from now if not set
    const deliveryDate = form.expected_delivery_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const orderData: any = {
      date: form.date,
      supplier: form.supplier,
      expected_delivery_date: deliveryDate,
      payment_terms: form.payment_terms,
      status: status,
      lines: lines,
    };

    // Only add optional fields if they have values
    if (form.reference) orderData.reference = form.reference;
    if (form.notes) orderData.notes = form.notes;

    console.log('[PO Submit] Sending order data:', JSON.stringify(orderData, null, 2));

    try {
      const response = await purchaseOrdersAPI.create(orderData);
      toast.success(`Purchase order created successfully`);
      router.push(`/dashboard/purchase/orders/${response.id}`);
    } catch (error: any) {
      console.error('[PO Error] Full error object:', error);
      console.error('[PO Error] Response status:', error.response?.status);
      console.error('[PO Error] Response data:', JSON.stringify(error.response?.data, null, 2));
      console.error('[PO Error] Order data sent:', JSON.stringify(orderData, null, 2));
      
      // Display detailed error message
      let errorMsg = "Failed to create purchase order";
      
      if (error.response?.data) {
        const data = error.response.data;
        
        // Handle different error formats
        if (data.detail) {
          errorMsg = data.detail;
        } else if (data.message) {
          errorMsg = data.message;
        } else if (data.lines) {
          // Handle line-level validation errors
          errorMsg = `Line items error: ${JSON.stringify(data.lines)}`;
        } else if (typeof data === 'object') {
          // Format object errors nicely
          const errors = Object.entries(data).map(([key, value]) => {
            if (Array.isArray(value)) {
              return `${key}: ${value.join(', ')}`;
            }
            return `${key}: ${value}`;
          }).join('; ');
          errorMsg = errors || JSON.stringify(data);
        } else {
          errorMsg = String(data);
        }
      }
      
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <DashHeader title="Create Purchase Order" subtitle="Loading..." />
        <PageLoading message="Loading…" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashHeader title="Create Purchase Order" subtitle="New purchase order" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 space-y-8 w-full min-h-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <Field label="PO Date" required>
              <DateInput 
                 
                value={form.date} 
                onChange={(date) => setForm({ ...form, date: date})}
                className="h-9 text-sm border-gray-200" 
              />
            </Field>
            <Field label="Expected Delivery Date">
              <DateInput 
                 
                value={form.expected_delivery_date} 
                onChange={(date) => setForm({ ...form, expected_delivery_date: date})}
                className="h-9 text-sm border-gray-200" 
              />
            </Field>
            <Field label="Status">
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as 'Draft' | 'Sent' })}>
                <SelectTrigger className="h-9 text-sm border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Sent">Sent</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Supplier" required>
              <div className="flex gap-2">
                <Select value={form.supplier} onValueChange={(v) => setForm({ ...form, supplier: v || "" })}>
                  <SelectTrigger className="h-9 text-sm border-gray-200">
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button
                  type="button"
                  onClick={() => setShowSupplierDialog(true)}
                  className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-gray-200 hover:border-[#22C55E] hover:text-[#22C55E] hover:bg-gray-50 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </Field>
            <Field label="Reference Number">
              <Input 
                value={form.reference} 
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
                placeholder="REF-XXX" 
                className="h-9 text-sm border-gray-200" 
              />
            </Field>
            <Field label="Payment Terms">
              <Select value={form.payment_terms} onValueChange={(v) => setForm({ ...form, payment_terms: v || "" })}>
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
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Add Product</h3>
            <Combobox
              options={products.map((p) => ({
                value: String(p.id),
                label: `${p.name} (${p.sku})`,
                subtitle: `Cost: Rs. ${getPurchaseUnitPrice(p)}`,
              }))}
              value=""
              onValueChange={(productId) => {
                const product = products.find((p) => String(p.id) === productId);
                if (!product) return;

                const unitPrice = getPurchaseUnitPrice(product);
                const newItem: PurchaseLineItem = {
                  id: `item-${Date.now()}`,
                  product: productId,
                  description: "",
                  qty: 1,
                  unit: getProductUnit(product),
                  unitPrice,
                  discount: 0,
                  tax: 13,
                  amount: unitPrice * 1.13,
                };
                setItems([...items, newItem]);
              }}
              placeholder="Select product to add"
              searchPlaceholder="Search products..."
              emptyText="No products found."
              className="w-full"
            />
          </div>

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
                placeholder="Delivery instructions, special terms..."
                className="w-full text-sm border border-gray-200 rounded-lg p-3 resize-none focus:outline-none focus:border-[#22C55E]" 
              />
            </div>
            <SummaryBox subtotal={subtotal} totalDiscount={totalDiscount} totalTax={totalTax} grandTotal={grandTotal} />
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100">
            <Button 
              variant="ghost" 
              onClick={() => router.back()} 
              className="gap-1.5 text-gray-500"
              disabled={submitting}
            >
              <ArrowLeft className="h-4 w-4" /> Cancel
            </Button>
            <div className="flex-1" />
            <Button 
              variant="outline" 
              onClick={() => handleSubmit('Draft')}
              className="border-[#22C55E] text-[#22C55E] hover:bg-green-50"
              disabled={submitting}
            >
              Save as Draft
            </Button>
            <Button 
              onClick={() => handleSubmit('Sent')}
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white"
              disabled={submitting}
            >
              Send to Supplier
            </Button>
          </div>
        </div>
      </div>

      {/* Supplier Creation Dialog */}
      <Dialog open={showSupplierDialog} onOpenChange={setShowSupplierDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Add New Supplier</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Supplier Name <span className="text-red-500">*</span></Label>
              <Input
                value={supplierForm.name}
                onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                placeholder="ABC Suppliers Pvt. Ltd."
                className="h-9 text-sm border-gray-200"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Phone <span className="text-red-500">*</span></Label>
              <Input
                value={supplierForm.phone}
                onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                placeholder="98XXXXXXXX"
                className="h-9 text-sm border-gray-200"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Email</Label>
              <Input
                type="email"
                value={supplierForm.email}
                onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                placeholder="supplier@email.com"
                className="h-9 text-sm border-gray-200"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Website</Label>
              <Input
                value={supplierForm.website}
                onChange={(e) => setSupplierForm({ ...supplierForm, website: e.target.value })}
                placeholder="https://..."
                className="h-9 text-sm border-gray-200"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Supplier Type</Label>
              <Select
                value={supplierForm.type}
                onValueChange={(v) => setSupplierForm({ ...supplierForm, type: v || "Company" })}
              >
                <SelectTrigger className="h-9 text-sm border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Individual">Personal</SelectItem>
                  <SelectItem value="Company">Company</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowSupplierDialog(false);
                setSupplierForm({ name: "", phone: "", email: "", website: "", type: "Company" });
              }}
              disabled={creatingSupplier}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateSupplier}
              disabled={creatingSupplier}
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white"
            >
              {creatingSupplier ? "Creating..." : (
                "Create Supplier"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
