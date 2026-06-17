"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashHeader } from "@/components/dashboard/dash-header";
import { JournalLinesTable, type JournalLine } from "@/components/accounting/JournalLinesTable";
import { journalEntriesAPI, accountsAPI, JournalEntry, Account } from "@/lib/api/accounting";
import toast from "react-hot-toast";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
      {children}
    </div>
  );
}

export default function EditJournalEntryPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<{
    date: string;
    type: "Manual" | "Adjustment";
    reference: string;
    description: string;
  }>({
    date: "",
    type: "Manual",
    reference: "",
    description: ""
  });
  const [lines, setLines] = useState<JournalLine[]>([]);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [entryData, accountsData] = await Promise.all([
        journalEntriesAPI.get(id),
        accountsAPI.list()
      ]);
      
      setEntry(entryData);
      setAccounts(Array.isArray(accountsData) ? accountsData : []);
      
      setFormData({
        date: entryData.date,
        type: (entryData.type === "Manual" || entryData.type === "Adjustment") ? entryData.type : "Manual",
        reference: entryData.reference || "",
        description: entryData.description
      });
      
      setLines((entryData.lines ?? []).map((l) => ({
        id: l.id || String(Math.random()),
        accountId: l.account,
        accountName: l.account_name || '',
        description: l.description,
        debit: Number(l.debit),
        credit: Number(l.credit)
      })));
    } catch (error: any) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load journal entry');
      router.push('/dashboard/accounting/journal-entries');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!entry) return;
    
    if (!formData.description.trim()) {
      toast.error("Description is required");
      return;
    }

    const validLines = lines.filter(l => l.accountId && (l.debit > 0 || l.credit > 0));
    if (validLines.length < 2) {
      toast.error("At least 2 lines with accounts are required");
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        date: formData.date,
        type: formData.type,
        reference: formData.reference || undefined,
        description: formData.description,
        lines: validLines.map(l => ({
          account: l.accountId,
          description: l.description,
          debit: l.debit,
          credit: l.credit
        }))
      };

      await journalEntriesAPI.update(entry.id, payload);
      toast.success("Journal entry updated successfully");
      router.push(`/dashboard/accounting/journal-entries/${entry.id}`);
    } catch (error: any) {
      console.error('Failed to update entry:', error);
      const message = error.response?.data?.detail 
        || error.response?.data?.message
        || 'Failed to update journal entry';
      toast.error(message);
      
      if (error.response?.data) {
        Object.keys(error.response.data).forEach((field) => {
          if (field !== 'detail' && field !== 'message') {
            const fieldErrors = error.response.data[field];
            const errorMsg = Array.isArray(fieldErrors) ? fieldErrors[0] : fieldErrors;
            toast.error(`${field}: ${errorMsg}`);
          }
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handlePostEntry = async () => {
    if (!entry) return;
    
    if (!formData.description.trim()) {
      toast.error("Description is required");
      return;
    }

    const validLines = lines.filter(l => l.accountId && (l.debit > 0 || l.credit > 0));
    if (validLines.length < 2) {
      toast.error("At least 2 lines with accounts are required");
      return;
    }

    const totalDebit = validLines.reduce((s, l) => s + (l.debit || 0), 0);
    const totalCredit = validLines.reduce((s, l) => s + (l.credit || 0), 0);
    
    if (totalDebit !== totalCredit) {
      toast.error("Entry must be balanced (debits = credits)");
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        date: formData.date,
        type: formData.type,
        reference: formData.reference || undefined,
        description: formData.description,
        lines: validLines.map(l => ({
          account: l.accountId,
          description: l.description,
          debit: l.debit,
          credit: l.credit
        }))
      };

      await journalEntriesAPI.update(entry.id, payload);
      await journalEntriesAPI.post(entry.id);
      toast.success("Journal entry posted successfully");
      router.push(`/dashboard/accounting/journal-entries/${entry.id}`);
    } catch (error: any) {
      console.error('Failed to post entry:', error);
      const message = error.response?.data?.error 
        || error.response?.data?.detail 
        || 'Failed to post journal entry';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const totalDebit = lines.reduce((s, l) => s + (l.debit || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (l.credit || 0), 0);
  const balanced = totalDebit > 0 && totalDebit === totalCredit;

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Loading..." subtitle="Edit Journal Entry" />
        <div className="flex-1 p-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center max-w-5xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22C55E] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading journal entry...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Not Found" subtitle="Edit Journal Entry" />
        <div className="flex-1 p-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center max-w-5xl">
            <p className="text-gray-600">Journal entry not found</p>
          </div>
        </div>
      </div>
    );
  }

  if (entry.status !== "draft") {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Cannot Edit" subtitle="Edit Journal Entry" />
        <div className="flex-1 p-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center max-w-5xl">
            <p className="text-gray-600">Only draft entries can be edited</p>
            <Button className="mt-4 bg-[#22C55E] hover:bg-[#16A34A] text-white" onClick={() => router.push(`/dashboard/accounting/journal-entries/${entry.id}`)}>
              View Entry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title={`Edit ${entry.entry_number}`} subtitle="Update journal entry" />
      <div className="flex-1 p-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5 max-w-5xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Entry #">
              <Input className="h-9 text-sm bg-gray-50 text-gray-500" value={entry.entry_number} readOnly />
            </Field>
            <Field label="Date" required>
              <Input 
                type="date"
                className="h-9 text-sm border-gray-200" 
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </Field>
            <Field label="Type">
              <Select value={formData.type} onValueChange={(v) => setFormData(prev => ({ ...prev, type: (v as "Manual" | "Adjustment") || "Manual" }))}>
                <SelectTrigger className="h-9 text-sm border-gray-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Manual", "Adjustment"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Reference">
              <Input 
                className="h-9 text-sm border-gray-200" 
                value={formData.reference}
                onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
                placeholder="e.g. INV-0001, PINV-0001"
              />
            </Field>
            <Field label="Description" required>
              <Input 
                className="h-9 text-sm border-gray-200" 
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Journal entry description"
              />
            </Field>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Debit / Credit Lines</h3>
            <JournalLinesTable lines={lines} onChange={setLines} accounts={accounts} />
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
              className="border-gray-200 text-gray-700"
              onClick={handleSaveDraft}
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Save Draft"}
            </Button>
            <Button 
              disabled={!balanced || submitting} 
              className={`px-6 text-white ${balanced && !submitting ? "bg-[#22C55E] hover:bg-[#16A34A]" : "bg-gray-300 cursor-not-allowed"}`}
              onClick={handlePostEntry}
            >
              {submitting ? "Posting..." : "Post Entry"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
