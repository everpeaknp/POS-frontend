"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DashHeader } from "@/components/dashboard/dash-header";
import { StatusBadge } from "@/components/sales/StatusBadge";
import { SkeletonTable } from "@/components/shared/Skeleton";
import { useApi } from "@/lib/hooks/useApi";
import { customerAPI } from "@/lib/api/sales";
import toast from "react-hot-toast";

export default function CustomersPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");

  const { data: customersData, loading, refetch } = useApi(
    () => customerAPI.list({ 
      search: search || undefined,
      status: status === "All" ? undefined : status 
    }),
    { immediate: true, deps: [search, status] }
  );

  const handleView = (id: string) => {
    router.push(`/dashboard/sales/customers/${id}`);
  };

  const handleEdit = (id: string) => {
    router.push(`/dashboard/sales/customers/${id}/edit`);
  };

  const handleDelete = async (id: string, customerName: string) => {
    const confirmDelete = () => {
      toast.promise(
        customerAPI.delete(id),
        {
          loading: 'Deleting customer...',
          success: () => {
            refetch();
            return 'Customer deleted successfully';
          },
          error: (err) => err.response?.data?.message || 'Failed to delete customer'
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
            <p className="font-semibold text-gray-900 text-base">Delete {customerName}?</p>
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

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Customers" subtitle="Loading..." />
        <div className="flex-1 p-6">
          <SkeletonTable rows={10} />
        </div>
      </div>
    );
  }

  const customers = customersData?.data?.results || [];
  const filtered = customers.filter((c: any) => {
    const matchesSearch = search === "" || 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      c.phone.includes(search) || 
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()));
    return matchesSearch && (status === "All" || c.status === status);
  });

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Customers" subtitle={`${filtered.length} customers`} />
      <div className="flex-1 p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search customers..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                className="pl-9 h-9 w-52 text-sm border-gray-200 bg-white" 
              />
            </div>
            <Select value={status} onValueChange={(v) => setStatus(v ?? "All")}>
              <SelectTrigger className="h-9 w-32 text-sm border-gray-200 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["All", "active", "inactive"].map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Link href="/dashboard/sales/customers/new">
            <Button size="sm" className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5">
              <Plus className="h-4 w-4" /> Add Customer
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Customer", "Phone", "Email", "Address", "Orders", "Total Spent", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((c: any) => (
                <tr key={c.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#22C55E] text-white text-xs font-semibold flex items-center justify-center shrink-0">
                        {c.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <Link 
                        href={`/dashboard/sales/customers/${c.id}`} 
                        className="font-medium text-gray-800 hover:text-[#22C55E] hover:underline"
                      >
                        {c.name}
                      </Link>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.phone}</td>
                  <td className="px-4 py-3 text-gray-600">{c.email || '-'}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-[140px] truncate">{c.address || '-'}</td>
                  <td className="px-4 py-3 text-gray-700">{c.total_orders || 0}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">
                    Rs. {(c.total_spent || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="p-1 rounded hover:bg-gray-100 focus:outline-none">
                        <MoreVertical className="h-4 w-4 text-gray-400" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem 
                          onClick={() => handleView(c.id)}
                          className="cursor-pointer"
                        >
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleEdit(c.id)}
                          className="cursor-pointer"
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600 focus:text-red-600 cursor-pointer"
                          onClick={() => handleDelete(c.id, c.name)}
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
      </div>
    </div>
  );
}
