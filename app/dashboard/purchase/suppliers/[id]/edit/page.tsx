"use client";

import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashHeader } from "@/components/dashboard/dash-header";
import { mockSuppliers } from "@/lib/mock-data/purchase";

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

export default function EditSupplierPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const supplier = mockSuppliers.find((s) => s.id === id) ?? mockSuppliers[0];

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title={`Edit ${supplier.name}`} subtitle="Update supplier details" />
      <div className="flex-1 p-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-8 max-w-3xl">

          <Section title="Basic Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Supplier Name" required><Input className="h-9 text-sm border-gray-200" defaultValue={supplier.name} /></Field>
              <Field label="Supplier Code"><Input className="h-9 text-sm bg-gray-50 text-gray-500" value={supplier.id} readOnly /></Field>
              <Field label="Supplier Type">
                <Select defaultValue={supplier.type}>
                  <SelectTrigger className="h-9 text-sm border-gray-200"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Individual">Individual</SelectItem><SelectItem value="Company">Company</SelectItem></SelectContent>
                </Select>
              </Field>
              <Field label="Phone" required><Input className="h-9 text-sm border-gray-200" defaultValue={supplier.phone} /></Field>
              <Field label="Email"><Input type="email" className="h-9 text-sm border-gray-200" defaultValue={supplier.email} /></Field>
              <Field label="Status">
                <Select defaultValue={supplier.status}>
                  <SelectTrigger className="h-9 text-sm border-gray-200"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
                </Select>
              </Field>
            </div>
          </Section>

          <Section title="Address">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Province"><Input className="h-9 text-sm border-gray-200" defaultValue={supplier.address.split(",")[1]?.trim() ?? ""} /></Field>
              <Field label="District"><Input className="h-9 text-sm border-gray-200" defaultValue={supplier.address.split(",")[0]?.trim() ?? ""} /></Field>
              <Field label="City"><Input className="h-9 text-sm border-gray-200" /></Field>
              <Field label="Street"><Input className="h-9 text-sm border-gray-200" /></Field>
            </div>
          </Section>

          <Section title="Business Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="PAN / VAT Number"><Input className="h-9 text-sm border-gray-200" defaultValue={supplier.pan} /></Field>
              <Field label="Bank Name"><Input className="h-9 text-sm border-gray-200" defaultValue={supplier.bankName} /></Field>
              <Field label="Bank Account Number"><Input className="h-9 text-sm border-gray-200" defaultValue={supplier.bankAccount} /></Field>
              <Field label="Lead Time (days)"><Input type="number" className="h-9 text-sm border-gray-200" defaultValue={supplier.leadTime} /></Field>
            </div>
          </Section>

          <Section title="Purchase Settings">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Credit Limit (Rs.)"><Input type="number" className="h-9 text-sm border-gray-200" defaultValue={supplier.creditLimit} /></Field>
              <Field label="Payment Terms">
                <Select defaultValue={supplier.paymentTerms}>
                  <SelectTrigger className="h-9 text-sm border-gray-200"><SelectValue /></SelectTrigger>
                  <SelectContent>{["Immediate", "Net 15", "Net 30", "Net 60"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>
          </Section>

          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            <Button variant="ghost" onClick={() => router.back()} className="gap-1.5 text-gray-500"><ArrowLeft className="h-4 w-4" /> Cancel</Button>
            <Button className="bg-[#22C55E] hover:bg-[#16A34A] text-white px-6">Save Changes</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
