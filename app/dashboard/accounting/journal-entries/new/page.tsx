"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashHeader } from "@/components/dashboard/dash-header";
import { JournalLinesTable, type JournalLine } from "@/components/accounting/JournalLinesTable";
import { DateInput } from "@/components/shared/DateInput";
import { todayIsoDate } from "@/lib/dates";
import { accountsAPI, journalEntriesAPI, type Account } from "@/lib/api/accounting";
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
    date: todayIsoDate(),
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

  const buildLinesPayload = (validLines: JournalLine[]) =>
    validLines.map((l) => ({
      account: Number(l.accountId) || l.accountId,
      description: l.description || "",
      debit: l.debit || 0,
      credit: l.credit || 0,
    }));

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const data = await accountsAPI.list({ status: "active" });
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
        lines: buildLinesPayload(validLines),
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
        lines: buildLinesPayload(validLines),
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
      <div className="flex flex-col h-full min-h-0">
        <DashHeader title="New Journal Entry" subtitle="Loading..." />
        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center w-full min-h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22C55E] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading form...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashHeader title="New Journal Entry" subtitle="Create a manual journal entry" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 w-full min-h-full space-y-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Entry Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <Field label="Entry #">
                <Input className="h-9 text-sm bg-gray-50 text-gray-500" value="Auto-generated" readOnly />
              </Field>
              <Field label="Date" required>
                <DateInput
                  value={formData.date}
                  onChange={(date) => setFormData((prev) => ({ ...prev, date }))}
                  disabled={submitting}
                  required
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
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Debit / Credit Lines</h3>
            {accounts.length === 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                No active accounts found. Create accounts in{" "}
                <button
                  type="button"
                  className="font-medium underline"
                  onClick={() => router.push("/dashboard/accounting/chart-of-accounts/new")}
                >
                  Chart of Accounts
                </button>{" "}
                before adding journal lines.
              </div>
            ) : (
              <JournalLinesTable lines={lines} onChange={setLines} accounts={accounts} />
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => router.back()} 
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button 
              variant="outline" 
              className="border-gray-200 text-gray-700"
              onClick={handleSaveDraft}
              disabled={submitting || accounts.length === 0}
            >
              {submitting ? "Saving..." : "Save Draft"}
            </Button>
            <Button 
              disabled={!balanced || submitting || accounts.length === 0} 
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
