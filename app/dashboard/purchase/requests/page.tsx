"use client";

import { PageLoading } from "@/components/shared/PageLoading";

import { FormattedDate } from "@/components/shared/FormattedDate";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, MoreHorizontal, Eye, Edit, CheckCircle, XCircle, FileText, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashHeader } from "@/components/dashboard/dash-header";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/purchase/StatusBadge";
import { purchaseRequestsAPI, type PurchaseRequest } from "@/lib/api/purchase";
import toast from "react-hot-toast";

const STATUSES = ["All", "Draft", "Pending Approval", "Approved", "Rejected", "Converted to PO"];

export default function PurchaseRequestsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [menu, setMenu] = useState<string | null>(null);
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await purchaseRequestsAPI.list();
      // Handle both array and paginated responses
      const data = Array.isArray(response) ? response : ((response as any)?.results || []);
      setRequests(data);
    } catch (error: any) {
      console.error("Failed to fetch purchase requests:", error);
      toast.error("Failed to load purchase requests");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await purchaseRequestsAPI.approve(id);
      toast.success("Purchase request approved");
      fetchRequests();
    } catch (error) {
      toast.error("Failed to approve purchase request");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await purchaseRequestsAPI.reject(id, "Rejected by user");
      toast.success("Purchase request rejected");
      fetchRequests();
    } catch (error) {
      toast.error("Failed to reject purchase request");
    }
  };

  const filtered = requests.filter((r) => {
    const matchSearch = r.request_number.toLowerCase().includes(search.toLowerCase()) || 
                       (r.requested_by_name && r.requested_by_name.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = status === "All" || r.status === status;
    return matchSearch && matchStatus;
  });

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Purchase Requests" subtitle="Loading..." />
        <div className="flex-1 p-6">
          <PageLoading message="Loading…" />
        </div>
      </div>
    );
  }

  if (requests.length === 0 && !search && status === "All") {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Purchase Requests" subtitle="Internal purchase requisitions" />
        <div className="flex-1 p-6">
          <EmptyState
            icon={ClipboardList}
            title="No purchase requests yet"
            description="Create your first purchase request to start internal requisitions"
            actionLabel="New Request"
            actionHref="/dashboard/purchase/requests/new"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Purchase Requests" subtitle="Internal purchase requisitions" />
      <div className="flex-1 p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm border-gray-200" placeholder="Search PR or requester..." />
          </div>
          <Select value={status} onValueChange={(v) => setStatus(v || "All")}>
            <SelectTrigger className="h-9 w-44 text-sm border-gray-200"><SelectValue /></SelectTrigger>
            <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <div className="flex-1" />
          <Button size="sm" className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5" onClick={() => router.push("/dashboard/purchase/requests/new")}>
            <Plus className="h-4 w-4" /> New Request
          </Button>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <p className="text-gray-500">No purchase requests found matching your filters</p>
          </div>
        ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{["PR #", "Date", "Requested By", "Total Amount", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-[#22C55E] cursor-pointer hover:underline" onClick={() => router.push(`/dashboard/purchase/requests/${r.id}`)}>{r.request_number}</td>
                      <td className="px-4 py-3 text-gray-600"><FormattedDate value={r.date} /></td>
                      <td className="px-4 py-3 font-medium text-gray-800">{r.requested_by_name || 'N/A'}</td>
                      <td className="px-4 py-3 font-semibold text-gray-800">Rs. {Number(r.estimated_amount || 0).toLocaleString()}</td>
                      <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                      <td className="px-4 py-3">
                        <div className="relative">
                          <button onClick={() => setMenu(menu === r.id ? null : r.id)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                          {menu === r.id && (
                            <div className="absolute right-0 top-8 z-10 bg-white border border-gray-100 rounded-lg shadow-lg py-1 min-w-[180px]">
                              {[
                                { icon: Eye, label: "View", action: () => router.push(`/dashboard/purchase/requests/${r.id}`), show: true },
                                { icon: CheckCircle, label: "Approve", action: () => handleApprove(r.id), show: r.status === 'Pending Approval' },
                                { icon: XCircle, label: "Reject", action: () => handleReject(r.id), show: r.status === 'Pending Approval' },
                                { icon: FileText, label: "Convert to PO", action: () => router.push("/dashboard/purchase/orders/new"), show: r.status === 'Approved' },
                                { icon: Edit, label: "Edit", action: () => router.push(`/dashboard/purchase/requests/${r.id}/edit`), show: r.status === 'Draft' },
                              ].filter(item => item.show).map(({ icon: Icon, label, action }) => (
                                <button key={label} onClick={() => { action(); setMenu(null); }}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                  <Icon className="h-3.5 w-3.5" /> {label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
