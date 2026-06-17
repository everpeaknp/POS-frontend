"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashHeader } from "@/components/dashboard/dash-header";
import { JournalLinesTable, type JournalLine } from "@/components/accounting/JournalLinesTable";
import { journalEntriesAPI, accountsAPI, Account } from "@/lib/api/accounting";
import toast from "react-hot-toast";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
      {children}
    </div>
  );
}

export default function NewJournalEntryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [formData, setFormData] = useState<{
    date: string;
    type: "Manual" | "Adjustment";
    reference: string;
    description: string;
  }>({
    date: new Date().toISOString().split('T')[0],
    type: "Manual",
    reference: "",
    description: ""
  });
  const [lines, setLines] = useState<JournalLine[]>([
    { id: "1", accountId: "", accountName: "", description: "", debit: 0, credit: 0 },
    { id: "2", accountId: "", accountName: "", description: "", debit: 0, credit: 0 },
  ]);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const data = await accountsAPI.list();
      setAccounts(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Failed to fetch accounts:', error);
      toast.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const totalDebit = lines.reduce((s, l) => s + (l.debit || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (l.credit || 0), 0);
  const balanced = totalDebit > 0 && totalDebit === totalCredit;

  const handleSaveDraft = async () => {
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

      await journalEntriesAPI.create(payload);
      toast.success("Journal entry saved as draft");
      router.push("/dashboard/accounting/journal-entries");
    } catch (error: any) {
      console.error('Failed to save draft:', error);
      const message = error.response?.data?.detail 
        || error.response?.data?.message
        || 'Failed to save journal entry';
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
    if (!formData.description.trim()) {
      toast.error("Description is required");
      return;
    }

    if (!balanced) {
      toast.error("Entry must be balanced (debits = credits)");
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

      const entry = await journalEntriesAPI.create(payload);
      await journalEntriesAPI.post(entry.id);
      toast.success("Journal entry posted successfully");
      router.push("/dashboard/accounting/journal-entries");
    } catch (error: any) {
      console.error('Failed to post entry:', error);
      const message = error.response?.data?.detail 
        || error.response?.data?.message
        || 'Failed to post journal entry';
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

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="New Journal Entry" subtitle="Loading..." />
        <div className="flex-1 p-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center max-w-5xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22C55E] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading form...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="New Journal Entry" subtitle="Create manual journal entry" />
      <div className="flex-1 p-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5 max-w-5xl">

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Entry #">
              <Input className="h-9 text-sm bg-gray-50 text-gray-500" value="Auto-generated" readOnly />
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
                placeholder="e.g. INV-0001, PINV-0001"
                value={formData.reference}
                onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
              />
            </Field>
            <Field label="Description" required>
              <Input 
                className="h-9 text-sm border-gray-200" 
                placeholder="Journal entry description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
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
