"use client";

import { FormattedDate } from "@/components/shared/FormattedDate";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Search, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  HardwarePageShell,
  hardwareCardClass,
  hardwareInputClass,
  hardwareTableWrapClass,
} from "@/components/dashboard/HardwarePageShell";
import { EmptyState } from "@/components/shared/EmptyState";
import { salesOrderAPI, type SalesOrder } from "@/lib/api/sales";
import { HARDWARE_LIST_PARAMS, unwrapList } from "@/lib/api/hardware-helpers";
import { formatNPR } from "@/lib/utils";
import toast from "react-hot-toast";

const STATUS_STYLES: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-700 dark:bg-muted dark:text-muted-foreground",
  Confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  Delivered: "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400",
  Cancelled: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
};

const STATUS_FILTERS = ["all", "Draft", "Confirmed", "Delivered", "Cancelled"] as const;

export default function HardwareOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (statusFilter !== "all") params.status = statusFilter;
      const response = await salesOrderAPI.list({ ...HARDWARE_LIST_PARAMS, ...params });
      setOrders(unwrapList(response.data));
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      toast.error("Failed to load hardware orders");
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(
    (order) =>
      order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!loading && orders.length === 0 && !searchTerm && statusFilter === "all") {
    return (
      <HardwarePageShell
        title="Hardware Orders"
        subtitle="Sales orders with credit support and bulk pricing"
      >
        <EmptyState
            icon={ShoppingCart}
            title="No orders yet"
            description="Create your first hardware order to start selling with credit and bulk pricing"
            actionLabel="New Order"
            actionHref="/dashboard/hardware/orders/new"
          />
      </HardwarePageShell>
    );
  }

  return (
    <HardwarePageShell
      title="Hardware Orders"
      subtitle="Sales orders with credit support and bulk pricing"
      loading={loading}
      toolbar={
        <>
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order number or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={hardwareInputClass}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {STATUS_FILTERS.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === status
                    ? "bg-[#22C55E] text-white"
                    : "bg-gray-100 dark:bg-muted text-gray-700 dark:text-muted-foreground hover:bg-gray-200 dark:hover:bg-muted/80"
                }`}
              >
                {status === "all" ? "All" : status}
              </button>
            ))}
          </div>
        </>
      }
      action={
        <Link href="/dashboard/hardware/orders/new">
          <Button size="sm" className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5">
            <Plus className="h-4 w-4" />
            New Order
          </Button>
        </Link>
      }
    >
      {filteredOrders.length === 0 ? (
        <div className={`${hardwareCardClass} p-12 text-center`}>
          <p className="text-gray-500 dark:text-muted-foreground">No orders found matching your filters</p>
        </div>
      ) : (
      <div className={hardwareTableWrapClass}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-muted/50 border-b border-gray-100 dark:border-border">
              <tr>
                {["Order #", "Customer", "Date", "Total", "Status", ""].map((h) => (
                  <th
                    key={h || "actions"}
                    className={`px-4 py-3 text-xs font-medium text-gray-500 dark:text-muted-foreground uppercase ${
                      h === "" ? "text-right" : "text-left"
                    }`}
                  >
                    {h === "" ? "Actions" : h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-border">
              {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => router.push(`/dashboard/hardware/orders/${order.id}`)}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-foreground">
                      {order.order_number}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground">
                      {order.customer_name}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-muted-foreground">
                      <FormattedDate value={order.date} />
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-foreground tabular-nums">
                      {formatNPR(order.total)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          STATUS_STYLES[order.status] || STATUS_STYLES.Draft
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/hardware/orders/${order.id}`);
                        }}
                        className="text-sm text-[#22C55E] hover:text-[#16A34A] font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </HardwarePageShell>
  );
}
