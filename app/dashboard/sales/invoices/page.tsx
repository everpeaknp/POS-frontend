"use client";

import { FormattedDate } from "@/components/shared/FormattedDate";
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
import { RecordPaymentModal } from "@/components/sales/RecordPaymentModal";
import { SkeletonTable } from "@/components/shared/Skeleton";
import { useApi } from "@/lib/hooks/useApi";
import { invoiceAPI } from "@/lib/api/sales";
import toast from "react-hot-toast";

export default function InvoicesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [paymentModal, setPaymentModal] = useState<{ open: boolean; id: string; balance: number }>({ 
    open: false, 
    id: "", 
    balance: 0 
  });

  const { data: invoicesData, loading, refetch } = useApi(
    () => invoiceAPI.list({ 
      search: search || undefined,
      status: status === "All" ? undefined : status 
    }),
    { immediate: true, deps: [search, status] }
  );

  const handleView = (id: string) => {
    router.push(`/dashboard/sales/invoices/${id}`);
  };

  const handleEdit = (id: string) => {
    router.push(`/dashboard/sales/invoices/${id}/edit`);
  };

  const handleRecordPayment = (id: string, balance: number) => {
    setPaymentModal({ open: true, id, balance });
  };

  const handleDelete = async (id: string, invoiceNumber: string) => {
    const confirmDelete = () => {
      toast.promise(
        invoiceAPI.delete(id),
        {
          loading: 'Deleting invoice...',
          success: () => {
            refetch();
            return 'Invoice deleted successfully';
          },
          error: (err) => err.response?.data?.message || 'Failed to delete invoice'
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
            <p className="font-semibold text-gray-900 text-base">Delete invoice {invoiceNumber}?</p>
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
        <DashHeader title="Sales Invoices" subtitle="Loading..." />
        <div className="flex-1 p-6">
          <SkeletonTable rows={10} />
        </div>
      </div>
    );
  }

  const invoices = invoicesData?.data?.results || [];
  const filtered = invoices.filter((inv: any) => {
    const matchesSearch = search === "" || 
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) || 
      (inv.customer_name && inv.customer_name.toLowerCase().includes(search.toLowerCase()));
    return matchesSearch && (status === "All" || inv.status === status);
  });

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Sales Invoices" subtitle={`${filtered.length} invoices`} />
      <div className="flex-1 p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search invoices..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                className="pl-9 h-9 w-52 text-sm border-gray-200 bg-white" 
              />
            </div>
            <Select value={status} onValueChange={(v) => setStatus(v ?? "All")}>
              <SelectTrigger className="h-9 w-40 text-sm border-gray-200 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["All", "Draft", "Sent", "Partially Paid", "Paid", "Overdue"].map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Link href="/dashboard/sales/invoices/new">
            <Button size="sm" className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5">
              <Plus className="h-4 w-4" /> New Invoice
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Invoice #", "Date", "Due Date", "Customer", "Amount", "Paid", "Balance", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((inv: any) => (
                <tr 
                  key={inv.id} 
                  className={`hover:bg-gray-50/50 transition-colors ${
                    inv.status === "Overdue" ? "border-l-2 border-l-red-400" : ""
                  }`}
                >
                  <td className="px-4 py-3 font-mono text-xs text-[#22C55E] font-medium">
                    <Link href={`/dashboard/sales/invoices/${inv.id}`} className="hover:underline">
                      {inv.invoice_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <FormattedDate value={inv.date} />
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <FormattedDate value={inv.due_date} />
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{inv.customer_name || inv.customer}</td>
                  <td className="px-4 py-3 text-gray-800">Rs. {inv.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-green-600">Rs. {inv.paid_amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-red-500 font-medium">Rs. {inv.balance.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="p-1 rounded hover:bg-gray-100 focus:outline-none">
                        <MoreVertical className="h-4 w-4 text-gray-400" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem 
                          onClick={() => handleView(inv.id)}
                          className="cursor-pointer"
                        >
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleRecordPayment(inv.id, inv.balance)}
                          className="cursor-pointer"
                        >
                          Record Payment
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleEdit(inv.id)}
                          className="cursor-pointer"
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600 focus:text-red-600 cursor-pointer"
                          onClick={() => handleDelete(inv.id, inv.invoice_number)}
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

      <RecordPaymentModal 
        open={paymentModal.open} 
        onClose={() => setPaymentModal({ open: false, id: "", balance: 0 })}
        invoiceId={paymentModal.id} 
        balance={paymentModal.balance}
        onSuccess={refetch}
      />
    </div>
  );
}
