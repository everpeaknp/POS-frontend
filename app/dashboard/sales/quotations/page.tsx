"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, MoreVertical, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DashHeader } from "@/components/dashboard/dash-header";
import { StatusBadge } from "@/components/sales/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { SkeletonTable } from "@/components/shared/Skeleton";
import { useApi } from "@/lib/hooks/useApi";
import { quotationAPI } from "@/lib/api/sales";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";

export default function QuotationsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [ordering, setOrdering] = useState("-date");

  const { data: quotationsData, loading, refetch } = useApi(
    () => quotationAPI.list({ 
      search: search || undefined, 
      status: status === "All" ? undefined : status,
      ordering 
    }),
    { immediate: true, deps: [search, status, ordering] }
  );

  const handleView = (id: string) => {
    router.push(`/dashboard/sales/quotations/${id}`);
  };

  const handleEdit = (id: string) => {
    router.push(`/dashboard/sales/quotations/${id}/edit`);
  };

  const handleDelete = async (id: string, quotationNumber: string) => {
    const confirmDelete = () => {
      toast.promise(
        quotationAPI.delete(id),
        {
          loading: 'Deleting quotation...',
          success: () => {
            refetch();
            return 'Quotation deleted successfully';
          },
          error: (err) => err.response?.data?.message || 'Failed to delete quotation'
        }
      );
    };

    toast((t) => (
      <div className="flex flex-col gap-4 min-w-[320px] p-2">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-base">Delete {quotationNumber}?</p>
            <p className="text-sm text-gray-600 mt-1">This action cannot be undone.</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              confirmDelete();
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    ), {
      duration: Infinity,
      position: 'top-center',
      style: {
        marginTop: '40vh',
        background: 'white',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        borderRadius: '12px',
        padding: '16px',
      },
    });
  };

  const handleConvertToOrder = async (id: string, quotationNumber: string) => {
    const confirmConvert = () => {
      toast.promise(
        quotationAPI.convertToOrder(id),
        {
          loading: 'Converting to order...',
          success: (response) => {
            refetch();
            return `Converted to order ${response.data.order_number}`;
          },
          error: (err) => err.response?.data?.error || err.response?.data?.message || 'Failed to convert quotation'
        }
      );
    };

    toast((t) => (
      <div className="flex flex-col gap-4 min-w-[320px] p-2">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-base">Convert {quotationNumber}?</p>
            <p className="text-sm text-gray-600 mt-1">This will create a new sales order.</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              confirmConvert();
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-[#22C55E] rounded-lg hover:bg-[#16A34A] transition-colors"
          >
            Convert
          </button>
        </div>
      </div>
    ), {
      duration: Infinity,
      position: 'top-center',
      style: {
        marginTop: '40vh',
        background: 'white',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        borderRadius: '12px',
        padding: '16px',
      },
    });
  };

  const handleSort = (field: string) => {
    // Toggle sort direction if clicking same field
    if (ordering === field) {
      setOrdering(`-${field}`);
    } else if (ordering === `-${field}`) {
      setOrdering(field);
    } else {
      setOrdering(`-${field}`);
    }
  };

  const getSortIcon = (field: string) => {
    if (ordering === field) return " ↑";
    if (ordering === `-${field}`) return " ↓";
    return "";
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Quotations" subtitle="Loading..." />
        <div className="flex-1 p-6">
          <SkeletonTable rows={10} />
        </div>
      </div>
    );
  }

  const quotations = quotationsData?.data?.results || [];

  if (quotations.length === 0 && !search && status === "All") {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Quotations" subtitle="Manage your quotations" />
        <div className="flex-1 p-6">
          <EmptyState
            icon={FileText}
            title="No quotations yet"
            description="Create your first quotation to send price quotes to customers"
            actionLabel="New Quotation"
            actionHref="/dashboard/sales/quotations/new"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Quotations" subtitle={`${quotationsData?.data?.count || 0} quotations`} />
      <div className="flex-1 p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                className="pl-9 h-9 w-48 text-sm border-gray-200 bg-white" 
              />
            </div>
            <Select value={status} onValueChange={(v) => setStatus(v ?? "All")}>
              <SelectTrigger className="h-9 w-36 text-sm border-gray-200 bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["All", "Draft", "Sent", "Accepted", "Expired"].map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Link href="/dashboard/sales/quotations/new">
            <Button size="sm" className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5">
              <Plus className="h-4 w-4" /> New Quotation
            </Button>
          </Link>
        </div>

        {quotations.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <p className="text-gray-500">No quotations found matching your filters</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Quote #</th>
                  <th 
                    className="text-left px-4 py-3 text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-700"
                    onClick={() => handleSort('date')}
                  >
                    Date{getSortIcon('date')}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Customer</th>
                  <th 
                    className="text-left px-4 py-3 text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-700"
                    onClick={() => handleSort('valid_until')}
                  >
                    Valid Until{getSortIcon('valid_until')}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {quotations.map((q) => (
                  <tr key={q.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-[#22C55E] font-medium">
                      <Link href={`/dashboard/sales/quotations/${q.id}`} className="hover:underline">
                        {q.quotation_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(q.date).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{q.customer_name || q.customer}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(q.valid_until).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{formatCurrency(q.total)}</td>
                    <td className="px-4 py-3"><StatusBadge status={q.status} /></td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger 
                          className="p-1 rounded hover:bg-gray-100 focus:outline-none"
                        >
                          <MoreVertical className="h-4 w-4 text-gray-400" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem 
                            onClick={() => handleView(q.id)}
                            className="cursor-pointer"
                          >
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleConvertToOrder(q.id, q.quotation_number)}
                            className="cursor-pointer"
                          >
                            Convert to Order
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleEdit(q.id)}
                            className="cursor-pointer"
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600 focus:text-red-600 cursor-pointer"
                            onClick={() => handleDelete(q.id, q.quotation_number)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
