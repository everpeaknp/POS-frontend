"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, MoreVertical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DashHeader } from "@/components/dashboard/dash-header";
import { PosStatusBadge } from "@/components/pos/PosStatusBadge";
import posApi, { type POSSession } from "@/lib/api/pos";
import toast from "react-hot-toast";

export default function PosSessionsPage() {
  const [sessions, setSessions] = useState<POSSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await posApi.getSessions();
      setSessions(response.results || []);
    } catch (error: any) {
      console.error("Error loading sessions:", error);
      toast.error(error.response?.data?.detail || "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const filtered = sessions.filter((session) => {
    const matchesSearch = session.session_number.toLowerCase().includes(search.toLowerCase()) || 
                         session.cashier_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = status === "All" || session.status === status;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="POS Sessions" subtitle="Loading..." />
        <div className="flex-1 p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#22C55E]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="POS Sessions" subtitle={`${filtered.length} sessions`} />
      <div className="flex-1 p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search sessions..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 w-52 text-sm border-gray-200 bg-white" />
            </div>
            <Select value={status} onValueChange={(v) => setStatus(v ?? "All")}>
              <SelectTrigger className="h-9 w-40 text-sm border-gray-200 bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["All", "open", "closed"].map((s) => <SelectItem key={s} value={s}>{s === "All" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Link href="/dashboard/pos/sessions/new">
            <Button size="sm" className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5">
              <Plus className="h-4 w-4" /> New Session
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Session ID", "Cashier", "Opened", "Closed", "Orders", "Sales", "Cash Sales", "Digital Sales", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((session) => (
                <tr key={session.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-mono text-xs text-[#22C55E] font-medium">
                    <Link href={`/dashboard/pos/sessions/${session.id}`} className="hover:underline">{session.session_number}</Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{session.cashier_name}</td>
                  <td className="px-4 py-3 text-gray-600">{new Date(session.opened_at).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-600">{session.closed_at ? new Date(session.closed_at).toLocaleString() : "-"}</td>
                  <td className="px-4 py-3 text-gray-800 font-medium">{session.total_transactions}</td>
                  <td className="px-4 py-3 text-gray-800 font-medium">Rs. {session.total_sales.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-600">Rs. {session.cash_sales.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-600">Rs. {(session.card_sales + session.upi_sales).toLocaleString()}</td>
                  <td className="px-4 py-3"><PosStatusBadge status={session.status} /></td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="p-1 rounded hover:bg-gray-100 focus:outline-none">
                        <MoreVertical className="h-4 w-4 text-gray-400" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onSelect={() => window.location.href = `/dashboard/pos/sessions/${session.id}`}>View</DropdownMenuItem>
                        {session.status === "open" && <DropdownMenuItem onSelect={() => window.location.href = `/dashboard/pos/sessions/${session.id}/close`}>Close Session</DropdownMenuItem>}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
