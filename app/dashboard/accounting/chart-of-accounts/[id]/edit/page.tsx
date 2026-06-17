"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashHeader } from "@/components/dashboard/dash-header";
import { mockChartOfAccounts } from "@/lib/mock-data/accounting";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
      {children}
    </div>
  );
}

export default function EditAccountPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const account = mockChartOfAccounts.find((a) => a.id === id) ?? mockChartOfAccounts[0];

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title={`Edit ${account.code}`} subtitle={account.name} />
      <div className="flex-1 p-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5 max-w-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Account Code" required>
              <Input className="h-9 text-sm border-gray-200" defaultValue={account.code} />
            </Field>
            <Field label="Account Name" required>
              <Input className="h-9 text-sm border-gray-200" defaultValue={account.name} />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Account Type" required>
              <Select defaultValue={account.type}>
                <SelectTrigger className="h-9 text-sm border-gray-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Assets", "Liabilities", "Equity", "Income", "Expense"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Sub Type">
              <Input className="h-9 text-sm border-gray-200" defaultValue={account.subType} />
            </Field>
          </div>
          <Field label="Description">
            <textarea className="w-full h-20 text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-[#22C55E]" placeholder="Account description..." />
          </Field>
          <Field label="Status">
            <Select defaultValue="Active">
              <SelectTrigger className="h-9 text-sm border-gray-200 w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            <Button variant="ghost" onClick={() => router.back()} className="gap-1.5 text-gray-500">
              <ArrowLeft className="h-4 w-4" /> Cancel
            </Button>
            <div className="flex-1" />
            <Button className="bg-[#22C55E] hover:bg-[#16A34A] text-white px-6">Update Account</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
