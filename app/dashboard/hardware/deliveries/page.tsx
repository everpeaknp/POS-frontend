"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashHeader } from "@/components/dashboard/dash-header";
import { DeliveryFormDialog } from "@/components/hardware/DeliveryFormDialog";
import { deliveryAPI, type Delivery, type DeliveryStats } from "@/lib/api/hardware";
import { formatNPR } from "@/lib/utils";
import toast from "react-hot-toast";
import { format } from "date-fns";

const statusColors = {
  pending: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  loaded: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  in_transit: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  delivered: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  partial: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  failed: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  cancelled: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

const statusLabels = {
  pending: "Pending",
  scheduled: "Scheduled",
  loaded: "Loaded",
  in_transit: "In Transit",
  delivered: "Delivered",
  partial: "Partial",
  failed: "Failed",
  cancelled: "Cancelled",
};

export default function DeliveriesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [stats, setStats] = useState<DeliveryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  useEffect(() => {
    if (searchParams.get("new") !== "1") return;
    setShowForm(true);
    router.replace("/dashboard/hardware/deliveries", { scroll: false });
  }, [searchParams, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [deliveriesRes, statsRes] = await Promise.all([
        deliveryAPI.list({ status: statusFilter || undefined }),
        deliveryAPI.getStats(),
      ]);
      setDeliveries(deliveriesRes.data.results || []);
      setStats(statsRes.data);
    } catch (error) {
      console.error("Failed to load deliveries:", error);
      toast.error("Failed to load deliveries");
    } finally {
      setLoading(false);
    }
  };

  const filteredDeliveries = deliveries.filter((delivery) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      delivery.delivery_number?.toLowerCase().includes(q) ||
      delivery.challan_number?.toLowerCase().includes(q) ||
      delivery.customer_name?.toLowerCase().includes(q) ||
      delivery.invoice_number?.toLowerCase().includes(q) ||
      delivery.driver_name?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Deliveries" subtitle="Loading..." />
        <div className="flex-1 p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader 
        title="Deliveries" 
        subtitle="Track material deliveries to customer sites"
      />

      <div className="flex-1 p-6 space-y-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
            <div className="bg-white dark:bg-card rounded-lg border border-gray-100 dark:border-border p-4">
              <div className="text-xs text-gray-500 dark:text-muted-foreground mb-1">Total</div>
              <div className="text-2xl font-semibold text-gray-900 dark:text-foreground">{stats.total}</div>
            </div>
            <div className="bg-white dark:bg-card rounded-lg border border-gray-100 dark:border-border p-4">
              <div className="text-xs text-gray-500 dark:text-muted-foreground mb-1">Today</div>
              <div className="text-2xl font-semibold text-blue-600 dark:text-blue-400">{stats.today}</div>
            </div>
            <div className="bg-white dark:bg-card rounded-lg border border-gray-100 dark:border-border p-4">
              <div className="text-xs text-gray-500 dark:text-muted-foreground mb-1">Pending</div>
              <div className="text-2xl font-semibold text-gray-600 dark:text-gray-400">{stats.pending}</div>
            </div>
            <div className="bg-white dark:bg-card rounded-lg border border-gray-100 dark:border-border p-4">
              <div className="text-xs text-gray-500 dark:text-muted-foreground mb-1">In Transit</div>
              <div className="text-2xl font-semibold text-yellow-600 dark:text-yellow-400">{stats.in_transit}</div>
            </div>
            <div className="bg-white dark:bg-card rounded-lg border border-gray-100 dark:border-border p-4">
              <div className="text-xs text-gray-500 dark:text-muted-foreground mb-1">Delivered</div>
              <div className="text-2xl font-semibold text-green-600 dark:text-green-400">{stats.delivered}</div>
            </div>
            <div className="bg-white dark:bg-card rounded-lg border border-gray-100 dark:border-border p-4">
              <div className="text-xs text-gray-500 dark:text-muted-foreground mb-1">Failed</div>
              <div className="text-2xl font-semibold text-red-600 dark:text-red-400">{stats.failed}</div>
            </div>
            <div className="bg-white dark:bg-card rounded-lg border border-gray-100 dark:border-border p-4">
              <div className="text-xs text-gray-500 dark:text-muted-foreground mb-1">Today Pending</div>
              <div className="text-2xl font-semibold text-orange-600 dark:text-orange-400">{stats.today_pending}</div>
            </div>
          </div>
        )}

        {/* Actions Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search deliveries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 border-gray-200 dark:border-border"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] h-10 border-gray-200 dark:border-border">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="loaded">Loaded</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-[var(--color-accent-custom,#22C55E)] hover:bg-[var(--color-accent-custom-600,#16A34A)] text-white gap-2"
          >
            <Plus className="h-4 w-4" />
            New Delivery
          </Button>
        </div>

        {/* Deliveries List */}
        {filteredDeliveries.length === 0 ? (
          <div className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border p-12 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-muted-foreground">
              {searchTerm || statusFilter ? "No deliveries found matching your filters" : "No deliveries yet"}
            </p>
            {!searchTerm && !statusFilter && (
              <Button
                onClick={() => setShowForm(true)}
                className="mt-4 bg-[var(--color-accent-custom,#22C55E)] hover:bg-[var(--color-accent-custom-600,#16A34A)] text-white"
              >
                Create First Delivery
              </Button>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-muted/50 border-b border-gray-100 dark:border-border">
                <tr>
                  {["Delivery #", "Customer", "Invoice", "Scheduled", "Vehicle", "Driver", "Items", "Charges", "Status"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-muted-foreground uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-border">
                {filteredDeliveries.map((delivery) => (
                  <tr
                    key={delivery.id}
                    onClick={() => router.push(`/dashboard/hardware/deliveries/${delivery.id}`)}
                    className="hover:bg-gray-50/50 dark:hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-[var(--color-accent-custom,#22C55E)]">{delivery.delivery_number}</span>
                      </div>
                      {delivery.challan_number && (
                        <div className="text-xs text-gray-500 dark:text-muted-foreground mt-0.5">
                          Challan: {delivery.challan_number}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-foreground font-medium">
                      {delivery.customer_name}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground text-xs">
                      {delivery.invoice_number}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground text-xs">
                      {format(new Date(delivery.scheduled_date), "MMM dd, yyyy")}
                      {delivery.scheduled_time && (
                        <div className="text-xs text-gray-500">{delivery.scheduled_time}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground text-xs">
                      {delivery.vehicle_number || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground text-xs">
                      {delivery.driver_name || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground text-center">
                      {delivery.items_count || 0}
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-foreground font-medium tabular-nums">
                      {formatNPR(delivery.total_charges)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                          statusColors[delivery.status as keyof typeof statusColors]
                        }`}
                      >
                        {statusLabels[delivery.status as keyof typeof statusLabels]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DeliveryFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        onSuccess={() => loadData()}
      />
    </div>
  );
}
