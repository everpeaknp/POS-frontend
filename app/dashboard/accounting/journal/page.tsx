"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DashHeader } from "@/components/dashboard/dash-header";
import { mockJournalEntries, mockChartOfAccounts } from "@/lib/mock-data/accounting";

export default function JournalEntriesPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = mockJournalEntries.filter((j) =>
    j.description.toLowerCase().includes(search.toLowerCase()) || j.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Journal Entries" subtitle="Double-entry bookkeeping records" />
      <div className="flex-1 p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm border-gray-200" placeholder="Search entries..." />
          </div>
          <div className="flex-1" />
          <Button size="sm" className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> New Entry
          </Button>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{["Entry #", "Date", "Description", "Debit Account", "Credit Account", "Amount", "Ref"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((j) => (
                <tr key={j.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-[#22C55E]">{j.id}</td>
                  <td className="px-4 py-3 text-gray-600">{j.date}</td>
                  <td className="px-4 py-3 text-gray-700">{j.description}</td>
                  <td className="px-4 py-3 text-blue-600 text-xs">{j.type}</td>
                  <td className="px-4 py-3 text-orange-600 text-xs">{j.reference || '-'}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">Rs. {j.debit.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{j.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>New Journal Entry</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">Date</Label>
                  <Input className="h-9 text-sm border-gray-200" defaultValue="2082-01-15" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">Reference</Label>
                  <Input className="h-9 text-sm border-gray-200" placeholder="Optional" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Description</Label>
                <Input className="h-9 text-sm border-gray-200" placeholder="Entry description" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">Debit Account</Label>
                  <select className="h-9 text-sm border border-gray-200 rounded-md px-3 bg-white focus:outline-none focus:border-[#22C55E]">
                    {mockChartOfAccounts.map((a) => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">Credit Account</Label>
                  <select className="h-9 text-sm border border-gray-200 rounded-md px-3 bg-white focus:outline-none focus:border-[#22C55E]">
                    {mockChartOfAccounts.map((a) => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Amount (Rs.)</Label>
                <Input type="number" className="h-9 text-sm border-gray-200" placeholder="0" />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white" onClick={() => setOpen(false)}>Post Entry</Button>
                <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
