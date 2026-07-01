"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"
import { DateInput } from "@/components/shared/DateInput";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashHeader } from "@/components/dashboard/dash-header";
import { LineItemsTable } from "@/components/sales/LineItemsTable";
import { SalesSummaryBox } from "@/components/sales/SalesSummaryBox";
import { quotationAPI, customerAPI } from "@/lib/api/sales";
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

export default function EditQuotationPage() {
  const router = useRouter();
  const params = useParams();
  const quotationId = params.id as string;
  
  const [items, setItems] = useState<LineItem[]>([]);
  const [form, setForm] = useState({ 
    customer: "", 
    date: "",
    validUntil: "", 
    status: "Draft", 
    notes: "" 
  });
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [quotationRes, customersRes, productsRes] = await Promise.all([
          quotationAPI.get(quotationId),
          customerAPI.list(),
          inventoryApi.products.list()
        ]);
        
        const quotation = quotationRes.data;
        
        // Set form data
        setForm({
          customer: quotation.customer.toString(),
          date: quotation.date,
          validUntil: quotation.valid_until,
          status: quotation.status,
          notes: quotation.notes || ""
        });
        
        // Set line items
        if (quotation.lines && quotation.lines.length > 0) {
          setItems(quotation.lines.map((line: any) => ({
            id: line.id || Math.random().toString(),
            product: line.product.toString(),
            description: line.description || "",
            qty: line.quantity,
            unit: "pcs",
            unitPrice: parseFloat(line.unit_price),
            discount: parseFloat(line.discount_percent),
            tax: parseFloat(line.tax_percent),
            amount: parseFloat(line.amount)
          })));
        }
        
        setCustomers(customersRes.data.results || []);
        setProducts(productsRes.data.results || []);
      } catch (error: any) {
        console.error('Error fetching data:', error);
        toast.error("Failed to load quotation");
        router.push('/dashboard/sales/quotations');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [quotationId, router]);

  const subtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const totalDiscount = items.reduce((s, i) => s + (i.qty * i.unitPrice * i.discount) / 100, 0);
  const totalTax = items.reduce((s, i) => { 
    const base = i.qty * i.unitPrice - (i.qty * i.unitPrice * i.discount) / 100; 
    return s + (base * i.tax) / 100; 
  }, 0);
  const grandTotal = subtotal - totalDiscount + totalTax;

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
        status: form.status as 'Draft' | 'Sent' | 'Accepted' | 'Expired',
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

      const response = await quotationAPI.update(quotationId, quotationData);
      toast.success(`Quotation ${response.data.quotation_number} updated successfully`);
      router.push(`/dashboard/sales/quotations/${quotationId}`);
    } catch (error: any) {
      console.error('Error updating quotation:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || "Failed to update quotation");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Edit Quotation" subtitle="Loading..." />
        <div className="flex-1 p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#22C55E]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Edit Quotation" subtitle="Update quotation details" />
      <div className="flex-1 p-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6 max-w-5xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              <Select value={form.customer} onValueChange={(v) => setForm({ ...form, customer: v ?? "" })}>
                <SelectTrigger className="h-9 text-sm border-gray-200">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  <SelectItem value="Accepted">Accepted</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Line Items</h3>
            <LineItemsTable items={items} onChange={setItems} products={products} />
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-between">
            <div className="flex-1">
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
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                'Update Quotation'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
