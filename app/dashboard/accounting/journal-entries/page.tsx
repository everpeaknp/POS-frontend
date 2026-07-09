"use client";

import { PageLoading } from "@/components/shared/PageLoading";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateInput } from "@/components/shared/DateInput";
import { DashHeader } from "@/components/dashboard/dash-header";
import { EmptyState } from "@/components/shared/EmptyState";
import { JournalStatusBadge, JournalTypeBadge } from "@/components/accounting/JournalStatusBadge";
import { journalEntriesAPI, JournalEntry } from "@/lib/api/accounting";
import toast from "react-hot-toast";

const TYPES = ["All", "Manual", "Sales", "Purchase", "Payment", "Adjustment"];
const STATUSES = ["All", "Draft", "Posted", "Reversed"];
const fmt = (n: number) => `Rs. ${n.toLocaleString("en-IN")}`;

export default function JournalEntriesPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [reverseEntry, setReverseEntry] = useState<JournalEntry | null>(null);
  const [reversalDate, setReversalDate] = useState(new Date().toISOString().split("T")[0]);
  const [reversing, setReversing] = useState(false);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const data = await journalEntriesAPI.list();
      setEntries(data);
    } catch (error: any) {
      console.error('Failed to fetch journal entries:', error);
      toast.error('Failed to load journal entries');
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async (id: string) => {
    try {
      await journalEntriesAPI.post(id);
      toast.success("Journal entry posted successfully");
      fetchEntries();
    } catch (error: any) {
      console.error('Failed to post entry:', error);
      const message = error.response?.data?.error || error.response?.data?.detail || 'Failed to post entry';
      toast.error(message);
    }
  };

  const handleReverse = async () => {
    if (!reverseEntry) return;

    setReversing(true);
    try {
      await journalEntriesAPI.reverse(reverseEntry.id, reversalDate);
      toast.success("Journal entry reversed successfully");
      setReverseEntry(null);
      fetchEntries();
    } catch (error: any) {
      console.error('Failed to reverse entry:', error);
      const message = error.response?.data?.error || error.response?.data?.detail || 'Failed to reverse entry';
      toast.error(message);
    } finally {
      setReversing(false);
    }
  };

  const filtered = entries.filter((je) => {
    const ms = je.entry_number.toLowerCase().includes(search.toLowerCase()) || 
               je.description.toLowerCase().includes(search.toLowerCase()) ||
               (je.reference && je.reference.toLowerCase().includes(search.toLowerCase()));
    const typeMatch = typeFilter === "All" || je.type === typeFilter;
    const statusMatch = statusFilter === "All" || je.status.toLowerCase() === statusFilter.toLowerCase();
    return ms && typeMatch && statusMatch;
  });

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Journal Entries" subtitle="Loading..." />
        <PageLoading message="Loading journal entries…" />
      </div>
    );
  }

  if (entries.length === 0 && !search && typeFilter === "All" && statusFilter === "All") {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Journal Entries" subtitle="Manage accounting journal entries" />
        <div className="flex-1 p-6">
          <EmptyState
            icon={BookOpen}
            title="No journal entries yet"
            description="Create your first journal entry to record transactions"
            actionLabel="New Journal Entry"
            actionHref="/dashboard/accounting/journal-entries/new"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Journal Entries" subtitle={`${filtered.length} entries`} />
      <div className="flex-1 p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search entries..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 w-52 text-sm border-gray-200 bg-white" />
            </div>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-9 text-sm border border-gray-200 rounded-md px-3 bg-white focus:outline-none focus:border-[#22C55E]">
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 text-sm border border-gray-200 rounded-md px-3 bg-white focus:outline-none focus:border-[#22C55E]">
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <Link href="/dashboard/accounting/journal-entries/new">
            <Button size="sm" className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5">
              <Plus className="h-4 w-4" /> New Journal Entry
            </Button>
          </Link>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
            <p className="text-gray-500">No journal entries found matching your filters</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Entry #", "Date", "Reference", "Description", "Type", "Total Debit", "Total Credit", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((je) => (
                  <tr key={je.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/accounting/journal-entries/${je.id}`} className="font-mono text-xs text-[#22C55E] hover:underline font-medium">{je.entry_number}</Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{je.date}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{je.reference ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate">{je.description}</td>
                    <td className="px-4 py-3"><JournalTypeBadge type={je.type} /></td>
                    <td className="px-4 py-3 font-medium text-gray-800">{fmt(Number(je.total_debit))}</td>
                    <td className="px-4 py-3 text-gray-600">{fmt(Number(je.total_credit))}</td>
                    <td className="px-4 py-3"><JournalStatusBadge status={je.status.charAt(0).toUpperCase() + je.status.slice(1)} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-xs">
                        <Link href={`/dashboard/accounting/journal-entries/${je.id}`} className="text-[#22C55E] hover:underline">View</Link>
                        {je.status === "draft" && (
                          <>
                            <span className="text-gray-300">|</span>
                            <Link href={`/dashboard/accounting/journal-entries/${je.id}/edit`} className="text-gray-500 hover:text-gray-700">Edit</Link>
                            <span className="text-gray-300">|</span>
                            <button onClick={() => handlePost(je.id)} className="text-blue-500 hover:text-blue-700">Post</button>
                          </>
                        )}
                        {je.status === "posted" && (
                          <>
                            <span className="text-gray-300">|</span>
                            <button
                              onClick={() => {
                                setReversalDate(new Date().toISOString().split("T")[0]);
                                setReverseEntry(je);
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              Reverse
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {reverseEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Reverse Journal Entry</h2>
            <p className="text-sm text-gray-500">
              Are you sure you want to reverse <span className="font-mono font-medium text-gray-700">{reverseEntry.entry_number}</span>?
              This will create a new journal entry with swapped debits and credits.
            </p>
            <div>
              <Label className="text-sm">Reversal Date</Label>
              <DateInput
                className="mt-1.5"
                value={reversalDate}
                onChange={setReversalDate}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setReverseEntry(null)}
                className="flex-1 border-gray-200"
                disabled={reversing}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                onClick={handleReverse}
                disabled={reversing}
              >
                {reversing ? "Reversing..." : "Reverse Entry"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
