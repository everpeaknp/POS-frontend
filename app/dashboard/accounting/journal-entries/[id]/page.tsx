"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useReactToPrint } from "react-to-print";
import { Printer, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/shared/DateInput";
import { useDateSystem } from "@/lib/context/DateSystemContext";
import { Label } from "@/components/ui/label";
import { DashHeader } from "@/components/dashboard/dash-header";
import { JournalStatusBadge, JournalTypeBadge } from "@/components/accounting/JournalStatusBadge";
import { JournalLinesTable } from "@/components/accounting/JournalLinesTable";
import { PrintableJournalEntry } from "@/components/print/PrintableJournalEntry";
import { journalEntriesAPI, JournalEntry } from "@/lib/api/accounting";
import { useCompanyInfo } from "@/lib/hooks/useCompanyInfo";
import toast from "react-hot-toast";

const fmt = (n: number) => `Rs. ${n.toLocaleString("en-IN")}`;

export default function JournalEntryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { formatDate } = useDateSystem();
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [reverseModal, setReverseModal] = useState(false);
  const [reversalDate, setReversalDate] = useState(new Date().toISOString().split('T')[0]);
  const [reversing, setReversing] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const { companyInfo } = useCompanyInfo();

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${entry?.entry_number || "JournalEntry"}_${new Date().toISOString().split("T")[0]}`,
  });

  useEffect(() => {
    if (id) {
      fetchEntry();
    }
  }, [id]);

  const fetchEntry = async () => {
    try {
      setLoading(true);
      const data = await journalEntriesAPI.get(id);
      setEntry(data);
    } catch (error: any) {
      console.error('Failed to fetch journal entry:', error);
      toast.error('Failed to load journal entry');
      router.push('/dashboard/accounting/journal-entries');
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async () => {
    if (!entry) return;
    
    try {
      await journalEntriesAPI.post(entry.id);
      toast.success("Journal entry posted successfully");
      fetchEntry();
    } catch (error: any) {
      console.error('Failed to post entry:', error);
      const message = error.response?.data?.error || error.response?.data?.detail || 'Failed to post entry';
      toast.error(message);
    }
  };

  const handleReverse = async () => {
    if (!entry) return;
    
    setReversing(true);
    try {
      await journalEntriesAPI.reverse(entry.id, reversalDate);
      toast.success("Journal entry reversed successfully");
      setReverseModal(false);
      router.push('/dashboard/accounting/journal-entries');
    } catch (error: any) {
      console.error('Failed to reverse entry:', error);
      const message = error.response?.data?.error || error.response?.data?.detail || 'Failed to reverse entry';
      toast.error(message);
    } finally {
      setReversing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <DashHeader title="Loading..." subtitle="Journal Entry" />
        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center w-full min-h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22C55E] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading journal entry...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <DashHeader title="Not Found" subtitle="Journal Entry" />
        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center w-full min-h-full">
            <p className="text-gray-600">Journal entry not found</p>
            <Link href="/dashboard/accounting/journal-entries">
              <Button className="mt-4 bg-[#22C55E] hover:bg-[#16A34A] text-white">Back to List</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const lines = (entry.lines ?? []).map((l) => ({
    id: l.id || String(Math.random()),
    accountId: l.account,
    accountName: l.account_name || '',
    description: l.description,
    debit: Number(l.debit),
    credit: Number(l.credit)
  }));

  const balanced = Number(entry.total_debit) === Number(entry.total_credit);
  const statusDisplay = entry.status.charAt(0).toUpperCase() + entry.status.slice(1);

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashHeader title={entry.entry_number} subtitle={`Journal Entry · ${formatDate(entry.date)}`} />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 w-full min-h-full space-y-6">

        <div className="flex flex-wrap items-center gap-2">
          <JournalStatusBadge status={statusDisplay} />
          <JournalTypeBadge type={entry.type} />
          <div className="flex-1" />
          {entry.status === "draft" && (
            <>
              <Link href={`/dashboard/accounting/journal-entries/${entry.id}/edit`}>
                <Button variant="outline" size="sm" className="h-8 border-gray-200 text-gray-600">Edit</Button>
              </Link>
              <Button size="sm" className="h-8 bg-[#22C55E] hover:bg-[#16A34A] text-white" onClick={handlePost}>Post Entry</Button>
            </>
          )}
          {entry.status === "posted" && (
            <>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 border-gray-200 text-gray-600" onClick={() => handlePrint()} disabled={!companyInfo}>
                <Printer className="h-3.5 w-3.5" /> Print
              </Button>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 border-red-200 text-red-600 hover:bg-red-50" onClick={() => setReverseModal(true)}>
                <RotateCcw className="h-3.5 w-3.5" /> Reverse Entry
              </Button>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-gray-50/50 rounded-xl border border-gray-100 p-4 space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Entry Info</h3>
            {[
              ["Entry #", entry.entry_number],
              ["Date", formatDate(entry.date)],
              ["Reference", entry.reference ?? "—"],
              ["Type", entry.type],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-gray-500">{k}</span>
                <span className="font-medium text-gray-800">{v}</span>
              </div>
            ))}
          </div>
          <div className="bg-gray-50/50 rounded-xl border border-gray-100 p-4 space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Posting Info</h3>
            {[
              ["Description", entry.description],
              ["Posted By", entry.posted_by_name ?? "—"],
              ["Posted Date", entry.posted_date ? formatDate(entry.posted_date) : "—"],
              ["Status", statusDisplay],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-gray-500">{k}</span>
                <span className="font-medium text-gray-800">{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Journal Lines</h3>
          <JournalLinesTable lines={lines} onChange={() => {}} readOnly />
        </div>

        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium ${balanced ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
          {balanced ? "✓ Entry is balanced" : "⚠ Entry is not balanced"}
          <span className="text-gray-500 font-normal ml-2">Total Debit: {fmt(Number(entry.total_debit))} | Total Credit: {fmt(Number(entry.total_credit))}</span>
        </div>
        </div>
      </div>

      {reverseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Reverse Journal Entry</h2>
            <p className="text-sm text-gray-500">This will create a new journal entry with swapped debits and credits.</p>
            <div className="space-y-3">
              <div>
                <Label className="text-sm">Reversal Date</Label>
                <DateInput
                  className="mt-1.5"
                  value={reversalDate}
                  onChange={setReversalDate}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setReverseModal(false)} className="flex-1 border-gray-200" disabled={reversing}>Cancel</Button>
              <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white" onClick={handleReverse} disabled={reversing}>
                {reversing ? "Reversing..." : "Reverse Entry"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {companyInfo && entry && (
        <div className="hidden">
          <PrintableJournalEntry ref={printRef} entry={entry} companyInfo={companyInfo} />
        </div>
      )}
    </div>
  );
}
