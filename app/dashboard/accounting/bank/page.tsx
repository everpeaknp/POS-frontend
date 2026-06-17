"use client";

import { useState } from "react";
import { Plus, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DashHeader } from "@/components/dashboard/dash-header";
import { mockBankAccounts } from "@/lib/mock-data/accounting";

export default function BankAccountsPage() {
  const [open, setOpen] = useState(false);
  const total = mockBankAccounts.reduce((s, b) => s + b.balance, 0);

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Bank Accounts" subtitle="Manage your bank and digital accounts" />
      <div className="flex-1 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-gray-500">Total Balance</p>
            <p className="text-2xl font-bold text-[#22C55E] mt-1">Rs. {total.toLocaleString()}</p>
          </div>
          <Button size="sm" className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Add Account
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockBankAccounts.map((b) => (
            <div key={b.id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-green-50">
                  <CreditCard className="h-5 w-5 text-[#22C55E]" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{b.bankName}</p>
                  <p className="text-xs text-gray-500">{b.type} Account</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">Account Number</p>
              <p className="font-mono text-sm text-gray-700 mt-0.5">{b.accountNumber}</p>
              <p className="text-xs text-gray-500 mt-2">Branch: {b.branch}</p>
              <div className="mt-4 pt-4 border-t border-gray-50">
                <p className="text-xs text-gray-500">Current Balance</p>
                <p className="text-xl font-bold text-[#22C55E] mt-0.5">Rs. {b.balance.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Add Bank Account</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Bank Name</Label>
                <Input className="h-9 text-sm border-gray-200" placeholder="e.g. Everest Bank" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Account Number</Label>
                <Input className="h-9 text-sm border-gray-200" placeholder="Account number" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">Branch</Label>
                  <Input className="h-9 text-sm border-gray-200" placeholder="Branch name" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">Account Type</Label>
                  <select className="h-9 text-sm border border-gray-200 rounded-md px-3 bg-white focus:outline-none focus:border-[#22C55E]">
                    {["Current", "Savings", "Digital"].map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Opening Balance (Rs.)</Label>
                <Input type="number" className="h-9 text-sm border-gray-200" placeholder="0" />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white" onClick={() => setOpen(false)}>Save</Button>
                <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
