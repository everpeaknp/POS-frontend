"use client";

import { FormattedDate } from "@/components/shared/FormattedDate";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, MoreVertical, Download, ShoppingCart, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DashHeader } from "@/components/dashboard/dash-header";
import { StatusBadge } from "@/components/sales/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { SkeletonTable } from "@/components/shared/Skeleton";
import { useApi } from "@/lib/hooks/useApi";
import { salesOrderAPI } from "@/lib/api/sales";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";

const PAGE_SIZE = 10;

export default function SalesOrdersPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("-date");

  const { data: ordersData, loading, refetch } = useApi(
    () => salesOrderAPI.list({ 
      search, 
      status: status === "All" ? undefined : status,
      page,
      page_size: PAGE_SIZE,
      ordering: sortBy
    }),
    { immediate: true }
  );

  // Refetch when search, status, or sortBy changes
  useEffect(() => {
    setPage(1); // Reset to first page
    refetch();
  }, [search, status, sortBy]);

  // Refetch when page changes
  useEffect(() => {
    refetch();
  }, [page]);

  const handleDelete = async (id: string) => {
    // Show confirmation toast with action buttons
    const confirmDelete = () => {
      toast.promise(
        salesOrderAPI.delete(id),
        {
          loading: 'Deleting order...',
          success: () => {
            refetch();
            return 'Order deleted successfully';
          },
          error: (err) => err.response?.data?.message || 'Failed to delete order'
        }
      );
    };

    // Show custom confirmation toast in center of screen
    toast((t) => (
      <div className="flex flex-col gap-4 min-w-[320px] p-2">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-base">Delete this order?</p>
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

  const handleExport = () => {
    try {
      // Get current orders data
      const orders = ordersData?.data?.results || [];
      
      if (orders.length === 0) {
        toast.error("No orders to export");
        return;
      }

      // Create CSV content
      const headers = ["Order Number", "Date", "Customer", "Items", "Total Amount", "Status"];
      const csvRows = [
        headers.join(","),
        ...orders.map((o: any) => [
          o.order_number,
          new Date(o.date).toLocaleDateString('en-GB'),
          `"${o.customer_name || o.customer}"`,
          o.items_count || 0,
          o.total,
          o.status
        ].join(","))
      ];
      
      const csvContent = csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      
      link.setAttribute("href", url);
      link.setAttribute("download", `sales-orders-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Orders exported successfully");
    } catch (error) {
      toast.error("Failed to export orders");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Sales Orders" subtitle="Loading..." />
        <div className="flex-1 p-6">
          <SkeletonTable rows={10} />
        </div>
      </div>
    );
  }

  const orders = ordersData?.data?.results || [];
  const totalCount = ordersData?.data?.count || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  if (orders.length === 0 && !search && status === "All" && page === 1) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Sales Orders" subtitle="Manage your orders" />
        <div className="flex-1 p-6">
          <EmptyState
            icon={ShoppingCart}
            title="No orders yet"
            description="Create your first sales order to start tracking sales"
            actionLabel="New Order"
            actionHref="/dashboard/sales/orders/new"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Sales Orders" subtitle={`${totalCount} orders`} />
      <div className="flex-1 p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search orders..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 w-52 border-gray-200 bg-white text-sm" 
              />
            </div>
            <Select value={status} onValueChange={(v) => setStatus(v ?? "All")}>
              <SelectTrigger className="h-9 w-36 text-sm border-gray-200 bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["All", "Draft", "Confirmed", "Delivered", "Cancelled"].map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as string)}>
              <SelectTrigger className="h-9 w-40 text-sm border-gray-200 bg-white">
                <ArrowUpDown className="h-3.5 w-3.5 mr-1.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="-date">Newest First</SelectItem>
                <SelectItem value="date">Oldest First</SelectItem>
                <SelectItem value="-total">Highest Amount</SelectItem>
                <SelectItem value="total">Lowest Amount</SelectItem>
                <SelectItem value="order_number">Order Number</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9 gap-1.5 border-gray-200"
              onClick={handleExport}
            >
              <Download className="h-4 w-4" /> Export
            </Button>
            <Link href="/dashboard/sales/orders/new">
              <Button size="sm" className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5">
                <Plus className="h-4 w-4" /> New Order
              </Button>
            </Link>
          </div>
        </div>

        {/* Table */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <p className="text-gray-500">No orders found matching your filters</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Order Number", "Date", "Customer", "Items", "Total Amount", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((o: any) => (
                  <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-[#22C55E] font-medium">
                      <Link href={`/dashboard/sales/orders/${o.id}`} className="hover:underline">
                        {o.order_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <FormattedDate value={o.date} />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{o.customer_name || o.customer}</td>
                    <td className="px-4 py-3 text-gray-600">{o.items_count || 0}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{formatCurrency(o.total)}</td>
                    <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="p-1 rounded hover:bg-gray-100 focus:outline-none">
                          <MoreVertical className="h-4 w-4 text-gray-400" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/sales/orders/${o.id}`)}>
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/sales/orders/${o.id}/edit`)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600 focus:text-red-600"
                            onClick={() => handleDelete(o.id)}
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

        {/* Pagination */}
        {totalCount > 0 && (
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>
              Showing {Math.min((page - 1) * PAGE_SIZE + 1, totalCount)}–{Math.min(page * PAGE_SIZE, totalCount)} of {totalCount}
            </span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page === 1} 
                onClick={() => setPage(p => p - 1)} 
                className="h-8"
              >
                Prev
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page === totalPages} 
                onClick={() => setPage(p => p + 1)} 
                className="h-8"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
