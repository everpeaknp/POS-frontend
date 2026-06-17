"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashHeader } from "@/components/dashboard/dash-header";
import { suppliersAPI, type Supplier } from "@/lib/api/purchase";
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

export default function NewSupplierPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "Company",
    phone: "",
    email: "",
    website: "",
    province: "",
    district: "",
    city: "",
    street: "",
    pan: "",
    bank_name: "",
    bank_account: "",
    bank_branch: "",
    credit_limit: "",
    payment_terms: "Net 30",
    currency: "NPR",
    lead_time_days: "",
    status: "active",
  });

  const handleSubmit = async () => {
    if (!form.name) {
      toast.error("Supplier name is required");
      return;
    }

    if (!form.phone) {
      toast.error("Phone number is required");
      return;
    }

    setSubmitting(true);
    try {
      const supplierData: Partial<Supplier> = {
        name: form.name,
        type: form.type,
        phone: form.phone,
        email: form.email || undefined,
        address: form.street || undefined,
        pan: form.pan || undefined,
        bank_name: form.bank_name || undefined,
        bank_account: form.bank_account || undefined,
        credit_limit: form.credit_limit ? Number(form.credit_limit) : undefined,
        payment_terms: form.payment_terms,
        lead_time_days: form.lead_time_days ? Number(form.lead_time_days) : undefined,
        status: form.status as 'active' | 'inactive',
      };

      // Remove undefined values
      const cleanData = Object.fromEntries(
        Object.entries(supplierData).filter(([_, v]) => v !== undefined)
      );

      console.log('Submitting supplier data:', cleanData);
      const response = await suppliersAPI.create(cleanData);
      toast.success("Supplier created successfully");
      router.push(`/dashboard/purchase/suppliers/${response.id}`);
    } catch (error: any) {
      console.error('Error creating supplier:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || error.response?.data?.detail || "Failed to create supplier");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Add Supplier" subtitle="New supplier record" />
      <div className="flex-1 p-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-8 max-w-3xl">

          <Section title="Basic Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Supplier Name" required>
                <Input 
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="h-9 text-sm border-gray-200" 
                  placeholder="ABC Suppliers Pvt. Ltd." 
                />
              </Field>
              <Field label="Supplier Type">
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v || "" })}>
                  <SelectTrigger className="h-9 text-sm border-gray-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Individual">Individual</SelectItem>
                    <SelectItem value="Company">Company</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Phone" required>
                <Input 
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="h-9 text-sm border-gray-200" 
                  placeholder="98XXXXXXXX" 
                />
              </Field>
              <Field label="Email">
                <Input 
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="h-9 text-sm border-gray-200" 
                  placeholder="supplier@email.com" 
                />
              </Field>
              <Field label="Website">
                <Input 
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  className="h-9 text-sm border-gray-200" 
                  placeholder="https://..." 
                />
              </Field>
              <Field label="Status">
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v || "" })}>
                  <SelectTrigger className="h-9 text-sm border-gray-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </Section>

          <Section title="Address">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Province">
                <Input 
                  value={form.province}
                  onChange={(e) => setForm({ ...form, province: e.target.value })}
                  className="h-9 text-sm border-gray-200" 
                  placeholder="Bagmati" 
                />
              </Field>
              <Field label="District">
                <Input 
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })}
                  className="h-9 text-sm border-gray-200" 
                  placeholder="Kathmandu" 
                />
              </Field>
              <Field label="City">
                <Input 
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="h-9 text-sm border-gray-200" 
                  placeholder="Kathmandu" 
                />
              </Field>
              <Field label="Street">
                <Input 
                  value={form.street}
                  onChange={(e) => setForm({ ...form, street: e.target.value })}
                  className="h-9 text-sm border-gray-200" 
                  placeholder="New Road" 
                />
              </Field>
            </div>
          </Section>

          <Section title="Business Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="PAN / VAT Number">
                <Input 
                  value={form.pan}
                  onChange={(e) => setForm({ ...form, pan: e.target.value })}
                  className="h-9 text-sm border-gray-200" 
                  placeholder="301234567" 
                />
              </Field>
              <Field label="Bank Name">
                <Input 
                  value={form.bank_name}
                  onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                  className="h-9 text-sm border-gray-200" 
                  placeholder="Nepal Bank Ltd" 
                />
              </Field>
              <Field label="Bank Account Number">
                <Input 
                  value={form.bank_account}
                  onChange={(e) => setForm({ ...form, bank_account: e.target.value })}
                  className="h-9 text-sm border-gray-200" 
                  placeholder="0123456789" 
                />
              </Field>
              <Field label="Bank Branch">
                <Input 
                  value={form.bank_branch}
                  onChange={(e) => setForm({ ...form, bank_branch: e.target.value })}
                  className="h-9 text-sm border-gray-200" 
                  placeholder="Thamel Branch" 
                />
              </Field>
            </div>
          </Section>

          <Section title="Purchase Settings">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Credit Limit (Rs.)">
                <Input 
                  type="number"
                  value={form.credit_limit}
                  onChange={(e) => setForm({ ...form, credit_limit: e.target.value })}
                  className="h-9 text-sm border-gray-200" 
                  placeholder="500000" 
                />
              </Field>
              <Field label="Payment Terms">
                <Select value={form.payment_terms} onValueChange={(v) => setForm({ ...form, payment_terms: v || "" })}>
                  <SelectTrigger className="h-9 text-sm border-gray-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Immediate", "Net 15", "Net 30", "Net 60"].map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Currency">
                <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v || "" })}>
                  <SelectTrigger className="h-9 text-sm border-gray-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NPR">NPR — Nepali Rupee</SelectItem>
                    <SelectItem value="USD">USD — US Dollar</SelectItem>
                    <SelectItem value="INR">INR — Indian Rupee</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Lead Time (days)">
                <Input 
                  type="number"
                  value={form.lead_time_days}
                  onChange={(e) => setForm({ ...form, lead_time_days: e.target.value })}
                  className="h-9 text-sm border-gray-200" 
                  placeholder="7" 
                />
              </Field>
            </div>
          </Section>

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
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white px-6"
              disabled={submitting}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Supplier
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
