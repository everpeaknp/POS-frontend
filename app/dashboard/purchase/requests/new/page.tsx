"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashHeader } from "@/components/dashboard/dash-header";
import { LineItemsTable, type PurchaseLineItem } from "@/components/purchase/LineItemsTable";
import { purchaseRequestsAPI, type PurchaseRequestLine } from "@/lib/api/purchase";
import { inventoryApi, type Product } from "@/lib/api/inventory";
import { getManagers } from "@/lib/api/hr";
import toast from "react-hot-toast";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
      {children}
    </div>
  );
}

const PRIORITIES = ["Low", "Medium", "High"];
const priorityColors: Record<string, string> = {
  Low: "border-gray-300 text-gray-600",
  Medium: "border-yellow-400 text-yellow-700 bg-yellow-50",
  High: "border-red-400 text-red-700 bg-red-50",
};

export default function NewPurchaseRequestPage() {
  const router = useRouter();
  const [items, setItems] = useState<PurchaseLineItem[]>([]);
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [products, setProducts] = useState<Product[]>([]);
  const [managers, setManagers] = useState<Array<{ id: string; name: string; designation: string; department: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    required_by: "",
    department: "Operations",
    priority: "Medium",
    notes: "",
    approver_notes: "",
    approver: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, managersRes] = await Promise.all([
          inventoryApi.products.list({ status: 'active' }),
          getManagers()
        ]);
        setProducts(productsRes.data?.results || []);
        setManagers(managersRes || []);
      } catch (error: any) {
        console.error("Failed to load data:", error);
        toast.error("Failed to load form data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const total = items.reduce((s, i) => s + i.amount, 0);

  const handleSubmit = async (status: 'Draft' | 'Pending Approval') => {
    if (!form.required_by) {
      toast.error("Please set required by date");
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
      const lines: PurchaseRequestLine[] = items.map(item => ({
        product: item.product, // This is already the product ID from LineItemsTable
        quantity: item.qty,
        estimated_unit_price: item.unitPrice,
      }));

      const requestData = {
        date: form.date,
        required_by: form.required_by,
        department: form.department,
        priority: priority,
        status: status,
        estimated_amount: total,
        notes: form.notes || undefined,
        lines: lines,
      };

      const response = await purchaseRequestsAPI.create(requestData);
      toast.success(`Purchase request created successfully`);
      router.push(`/dashboard/purchase/requests/${response.id}`);
    } catch (error: any) {
      console.error('Error creating purchase request:', error);
      const errorMessage = error.response?.data?.detail 
        || error.response?.data?.message 
        || (typeof error.response?.data === 'object' ? JSON.stringify(error.response?.data) : null)
        || "Failed to create purchase request";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Create Purchase Request" subtitle="Loading..." />
        <div className="flex-1 p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#22C55E]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Create Purchase Request" subtitle="New purchase requisition" />
      <div className="flex-1 p-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6 max-w-4xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Request Date" required>
              <Input 
                type="date" 
                value={form.date} 
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="h-9 text-sm border-gray-200" 
              />
            </Field>
            <Field label="Required By Date" required>
              <Input 
                type="date" 
                value={form.required_by} 
                onChange={(e) => setForm({ ...form, required_by: e.target.value })}
                className="h-9 text-sm border-gray-200" 
              />
            </Field>
            <Field label="Status">
              <Input 
                type="text" 
                value="Draft" 
                readOnly
                className="h-9 text-sm bg-gray-50 text-gray-500" 
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Department" required>
              <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v || "" })}>
                <SelectTrigger className="h-9 text-sm border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>{["Operations", "IT", "Admin", "Finance", "HR", "Sales"].map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>

          <div>
            <Label className="text-sm mb-2 block">Priority</Label>
            <div className="flex gap-2">
              {PRIORITIES.map((p) => (
                <button key={p} onClick={() => setPriority(p as 'Low' | 'Medium' | 'High')}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border-2 transition-colors ${priority === p ? priorityColors[p] : "border-gray-200 text-gray-500"}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm">Purpose / Notes</Label>
            <textarea 
              value={form.notes} 
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="mt-1.5 w-full h-20 text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-[#22C55E]"
              placeholder="Reason for purchase request..." 
            />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Line Items</h3>
            <LineItemsTable items={items} onChange={setItems} products={products} />
            {items.length > 0 && (
              <div className="flex justify-end mt-3">
                <div className="bg-gray-50 rounded-lg border border-gray-200 px-4 py-2">
                  <span className="text-sm text-gray-600">Estimated Total: </span>
                  <span className="font-bold text-gray-900">Rs. {total.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Approval</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Approver">
                <Select value={form.approver} onValueChange={(v) => setForm({ ...form, approver: v || "" })}>
                  <SelectTrigger className="h-9 text-sm border-gray-200">
                    <SelectValue placeholder="Select approver" />
                  </SelectTrigger>
                  <SelectContent>
                    {managers.length === 0 ? (
                      <SelectItem value="none" disabled>No managers available</SelectItem>
                    ) : (
                      managers.map((manager) => (
                        <SelectItem key={manager.id} value={manager.id}>
                          {manager.name} — {manager.designation}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Notes for Approver">
                <Input 
                  value={form.approver_notes} 
                  onChange={(e) => setForm({ ...form, approver_notes: e.target.value })}
                  className="h-9 text-sm border-gray-200" 
                  placeholder="Urgency, justification..." 
                />
              </Field>
            </div>
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
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Draft
            </Button>
            <Button 
              onClick={() => handleSubmit('Pending Approval')}
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white"
              disabled={submitting}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Submit for Approval
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
