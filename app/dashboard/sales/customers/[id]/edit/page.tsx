"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashHeader } from "@/components/dashboard/dash-header";
import { SkeletonTable } from "@/components/shared/Skeleton";
import { useApi } from "@/lib/hooks/useApi";
import { customerAPI } from "@/lib/api/sales";
import toast from "react-hot-toast";

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

export default function EditCustomerPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [submitting, setSubmitting] = useState(false);
  const [sameAsBilling, setSameAsBilling] = useState(true);
  
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    website: "",
    type: "Individual" as "Individual" | "Business",
    pan: "",
    credit_limit: "100000",
    payment_terms: "Net 30" as "Immediate" | "Net 15" | "Net 30" | "Net 60",
    customer_group: "General",
    billing_province: "",
    billing_district: "",
    billing_city: "",
    billing_street: "",
    shipping_province: "",
    shipping_district: "",
    shipping_city: "",
    shipping_street: "",
    opening_balance: "0",
    opening_balance_date: "",
    status: "active" as "active" | "inactive",
  });

  const { data: customerData, loading } = useApi(
    () => customerAPI.get(id),
    { immediate: true, deps: [id] }
  );

  // Populate form when customer data loads
  useEffect(() => {
    if (customerData?.data) {
      const customer = customerData.data;
      
      // Parse address into components (basic parsing)
      const addressParts = (customer.address || "").split(",").map(s => s.trim());
      
      setForm({
        name: customer.name || "",
        phone: customer.phone || "",
        email: customer.email || "",
        website: "",
        type: customer.type || "Individual",
        pan: customer.pan || "",
        credit_limit: String(customer.credit_limit || 100000),
        payment_terms: customer.payment_terms || "Net 30",
        customer_group: "General",
        billing_province: addressParts[3] || "",
        billing_district: addressParts[2] || "",
        billing_city: addressParts[1] || "",
        billing_street: addressParts[0] || "",
        shipping_province: "",
        shipping_district: "",
        shipping_city: "",
        shipping_street: "",
        opening_balance: "0",
        opening_balance_date: "",
        status: customer.status || "active",
      });
    }
  }, [customerData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Customer name is required");
      return;
    }
    if (!form.phone.trim()) {
      toast.error("Phone number is required");
      return;
    }

    setSubmitting(true);
    try {
      // Build address string
      const billingAddress = [
        form.billing_street,
        form.billing_city,
        form.billing_district,
        form.billing_province
      ].filter(Boolean).join(", ");

      const customerData = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        pan: form.pan.trim() || undefined,
        address: billingAddress || undefined,
        type: form.type,
        credit_limit: parseFloat(form.credit_limit) || 0,
        payment_terms: form.payment_terms,
        status: form.status,
      };

      const response = await customerAPI.update(id, customerData);
      toast.success(`Customer ${response.data.name} updated successfully`);
      router.push(`/dashboard/sales/customers/${id}`);
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
          toast.error(error.response?.data?.message || "Failed to update customer");
        }
      } else {
        toast.error("Failed to update customer");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <DashHeader title="Edit Customer" subtitle="Loading..." />
        <div className="flex-1 p-6">
          <SkeletonTable rows={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashHeader title="Edit Customer" subtitle={form.name || "Update customer record"} />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="w-full min-h-full space-y-6">
          <div className="flex flex-wrap items-center gap-2 sticky top-0 z-10 bg-[#F3F4F6] py-2 -mx-1 px-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 h-8"
              onClick={() => router.push(`/dashboard/sales/customers/${id}`)}
              disabled={submitting}
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </Button>
          </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 space-y-8 w-full min-h-full">
          
          <Section title="Basic Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <Field label="Full Name" required>
                <Input 
                  className="h-9 text-sm border-gray-200" 
                  placeholder="Ram Sharma"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </Field>
              <Field label="Customer Type">
                <Select 
                  value={form.type} 
                  onValueChange={(v) => setForm({ ...form, type: v as any })}
                >
                  <SelectTrigger className="h-9 text-sm border-gray-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Individual">Individual</SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Phone" required>
                <Input 
                  className="h-9 text-sm border-gray-200" 
                  placeholder="98XXXXXXXX"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </Field>
              <Field label="Email">
                <Input 
                  type="email" 
                  className="h-9 text-sm border-gray-200" 
                  placeholder="email@domain.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </Field>
              <Field label="Website">
                <Input 
                  className="h-9 text-sm border-gray-200" 
                  placeholder="https://..."
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                />
              </Field>
              <Field label="Status">
                <Select 
                  value={form.status} 
                  onValueChange={(v) => setForm({ ...form, status: v as any })}
                >
                  <SelectTrigger className="h-9 text-sm border-gray-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </Section>

          <Section title="Billing Address">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Field label="Province">
                <Input 
                  className="h-9 text-sm border-gray-200" 
                  placeholder="Bagmati"
                  value={form.billing_province}
                  onChange={(e) => setForm({ ...form, billing_province: e.target.value })}
                />
              </Field>
              <Field label="District">
                <Input 
                  className="h-9 text-sm border-gray-200" 
                  placeholder="Kathmandu"
                  value={form.billing_district}
                  onChange={(e) => setForm({ ...form, billing_district: e.target.value })}
                />
              </Field>
              <Field label="City">
                <Input 
                  className="h-9 text-sm border-gray-200" 
                  placeholder="Kathmandu"
                  value={form.billing_city}
                  onChange={(e) => setForm({ ...form, billing_city: e.target.value })}
                />
              </Field>
              <Field label="Street">
                <Input 
                  className="h-9 text-sm border-gray-200" 
                  placeholder="Thamel"
                  value={form.billing_street}
                  onChange={(e) => setForm({ ...form, billing_street: e.target.value })}
                />
              </Field>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Checkbox 
                id="same" 
                checked={sameAsBilling} 
                onCheckedChange={(v) => setSameAsBilling(v === true)}
                className="data-[state=checked]:bg-[#22C55E] data-[state=checked]:border-[#22C55E]"
              />
              <Label htmlFor="same" className="text-sm text-gray-600 cursor-pointer">
                Shipping address same as billing
              </Label>
            </div>
          </Section>

          {!sameAsBilling && (
            <Section title="Shipping Address">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Field label="Province">
                  <Input 
                    className="h-9 text-sm border-gray-200"
                    value={form.shipping_province}
                    onChange={(e) => setForm({ ...form, shipping_province: e.target.value })}
                  />
                </Field>
                <Field label="District">
                  <Input 
                    className="h-9 text-sm border-gray-200"
                    value={form.shipping_district}
                    onChange={(e) => setForm({ ...form, shipping_district: e.target.value })}
                  />
                </Field>
                <Field label="City">
                  <Input 
                    className="h-9 text-sm border-gray-200"
                    value={form.shipping_city}
                    onChange={(e) => setForm({ ...form, shipping_city: e.target.value })}
                  />
                </Field>
                <Field label="Street">
                  <Input 
                    className="h-9 text-sm border-gray-200"
                    value={form.shipping_street}
                    onChange={(e) => setForm({ ...form, shipping_street: e.target.value })}
                  />
                </Field>
              </div>
            </Section>
          )}

          <Section title="Business Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Field label="PAN / VAT Number">
                <Input 
                  className="h-9 text-sm border-gray-200" 
                  placeholder="123456789"
                  value={form.pan}
                  onChange={(e) => setForm({ ...form, pan: e.target.value })}
                />
              </Field>
              <Field label="Credit Limit (Rs.)">
                <Input 
                  type="number" 
                  className="h-9 text-sm border-gray-200" 
                  placeholder="100000"
                  value={form.credit_limit}
                  onChange={(e) => setForm({ ...form, credit_limit: e.target.value })}
                />
              </Field>
              <Field label="Payment Terms">
                <Select 
                  value={form.payment_terms} 
                  onValueChange={(v) => setForm({ ...form, payment_terms: v as any })}
                >
                  <SelectTrigger className="h-9 text-sm border-gray-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Immediate", "Net 15", "Net 30", "Net 60"].map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Customer Group">
                <Select 
                  value={form.customer_group || ""} 
                  onValueChange={(v) => setForm({ ...form, customer_group: v as string })}
                >
                  <SelectTrigger className="h-9 text-sm border-gray-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["General", "Wholesale", "Retail", "VIP"].map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </Section>

          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            <Button 
              type="button"
              variant="ghost" 
              onClick={() => router.push(`/dashboard/sales/customers/${id}`)} 
              className="gap-1.5 text-gray-500"
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
                  Updating...
                </>
              ) : (
                'Update Customer'
              )}
            </Button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
