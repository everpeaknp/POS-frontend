"use client";

import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashHeader } from "@/components/dashboard/dash-header";
import { mockTaxRules } from "@/lib/mock-data/accounting";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
      {children}
    </div>
  );
}

export default function EditTaxRulePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const tax = mockTaxRules.find((t) => t.id === id) ?? mockTaxRules[0];

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title={`Edit ${tax.name}`} subtitle="Update tax rule" />
      <div className="flex-1 p-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5 max-w-lg">
          <Field label="Tax Name" required>
            <Input className="h-9 text-sm border-gray-200" defaultValue={tax.name} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tax Type" required>
              <Select defaultValue={tax.type}>
                <SelectTrigger className="h-9 text-sm border-gray-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["VAT", "TDS", "Custom"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Rate (%)" required>
              <Input type="number" className="h-9 text-sm border-gray-200" defaultValue={tax.rate} />
            </Field>
          </div>
          <Field label="Applicable On" required>
            <Select defaultValue={tax.applicableOn}>
              <SelectTrigger className="h-9 text-sm border-gray-200"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Sales", "Purchase", "Both"].map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Linked Account" required>
            <Input className="h-9 text-sm border-gray-200" defaultValue={tax.account} />
          </Field>
          <Field label="Status">
            <Select defaultValue={tax.status}>
              <SelectTrigger className="h-9 text-sm border-gray-200 w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            <Button variant="ghost" onClick={() => router.back()} className="gap-1.5 text-gray-500">
              <ArrowLeft className="h-4 w-4" /> Cancel
            </Button>
            <div className="flex-1" />
            <Button className="bg-[#22C55E] hover:bg-[#16A34A] text-white px-6">Update Tax Rule</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
