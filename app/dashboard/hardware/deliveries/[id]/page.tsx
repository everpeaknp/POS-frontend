"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Package,
  MapPin,
  Phone,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashHeader } from "@/components/dashboard/dash-header";
import { deliveryAPI, type Delivery } from "@/lib/api/hardware";
import { formatNPR } from "@/lib/utils";
import toast from "react-hot-toast";

const statusColors: Record<string, string> = {
  pending: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  loaded: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
  in_transit: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  delivered: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  partial: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  failed: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  cancelled: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500",
};

function InfoCard({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border p-5">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-foreground mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-gray-400" />
        {title}
      </h3>
      {children}
    </div>
  );
}

export default function DeliveryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadDelivery();
  }, [id]);

  const loadDelivery = async () => {
    try {
      setLoading(true);
      const res = await deliveryAPI.get(id);
      setDelivery(res.data);
    } catch (error) {
      console.error("Failed to load delivery:", error);
      toast.error("Failed to load delivery");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkDelivered = async () => {
    setUpdating(true);
    try {
      await deliveryAPI.markDelivered(id);
      toast.success("Delivery marked as delivered");
      loadDelivery();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to update delivery");
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Cancel this delivery?")) return;
    setUpdating(true);
    try {
      await deliveryAPI.cancel(id);
      toast.success("Delivery cancelled");
      loadDelivery();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to cancel delivery");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Delivery" subtitle="Loading..." />
        <div className="flex-1 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl" />
            <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Delivery not found" />
        <div className="flex-1 p-6 text-center">
          <Button onClick={() => router.push("/dashboard/hardware/deliveries")}>Back to Deliveries</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader
        title={delivery.delivery_number}
        subtitle={`Invoice ${delivery.invoice_number || "—"} · ${delivery.customer_name || "Unknown customer"}`}
        actions={
          <div className="flex items-center gap-2">
            {delivery.can_be_edited && delivery.status !== "delivered" && (
              <Button
                size="sm"
                onClick={handleMarkDelivered}
                disabled={updating}
                className="bg-[var(--color-accent-custom,#22C55E)] hover:bg-[#16A34A] gap-2"
              >
                {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Mark Delivered
              </Button>
            )}
            {delivery.can_be_cancelled && (
              <Button size="sm" variant="outline" onClick={handleCancel} disabled={updating} className="gap-2 text-red-600 hover:text-red-700">
                <XCircle className="h-4 w-4" />
                Cancel
              </Button>
            )}
          </div>
        }
      />

      <div className="flex-1 p-6 space-y-6">
        <Button variant="ghost" onClick={() => router.push("/dashboard/hardware/deliveries")} className="w-fit -mt-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Deliveries
        </Button>

        <div className="flex items-center gap-3">
          <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium capitalize ${statusColors[delivery.status] || statusColors.pending}`}>
            {delivery.status.replace("_", " ")}
          </span>
          {delivery.challan_number && (
            <span className="text-sm text-gray-500 dark:text-muted-foreground">Challan #{delivery.challan_number}</span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoCard title="Delivery Address" icon={MapPin}>
            <p className="text-sm text-gray-900 dark:text-foreground">{delivery.delivery_address}</p>
            {(delivery.customer_contact_name || delivery.customer_contact_phone) && (
              <p className="text-xs text-gray-500 dark:text-muted-foreground mt-2 flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {delivery.customer_contact_name} {delivery.customer_contact_phone && `· ${delivery.customer_contact_phone}`}
              </p>
            )}
          </InfoCard>

          <InfoCard title="Schedule" icon={Calendar}>
            <p className="text-sm text-gray-900 dark:text-foreground">
              {new Date(delivery.scheduled_date).toLocaleDateString()}
              {delivery.scheduled_time && ` at ${delivery.scheduled_time}`}
            </p>
            {delivery.delivery_completed_at && (
              <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
                Delivered: {new Date(delivery.delivery_completed_at).toLocaleString()}
              </p>
            )}
          </InfoCard>

          <InfoCard title="Vehicle & Driver" icon={User}>
            {delivery.vehicle_number ? (
              <p className="text-sm text-gray-900 dark:text-foreground">{delivery.vehicle_number}</p>
            ) : (
              <p className="text-sm text-gray-400 dark:text-muted-foreground">No vehicle assigned</p>
            )}
            {delivery.driver_name && (
              <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
                {delivery.driver_name} {delivery.driver_phone && `· ${delivery.driver_phone}`}
              </p>
            )}
          </InfoCard>

          <InfoCard title="Charges" icon={Package}>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-muted-foreground">Transport</span>
              <span className="text-gray-900 dark:text-foreground">{formatNPR(delivery.transport_charge)}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-500 dark:text-muted-foreground">Loading</span>
              <span className="text-gray-900 dark:text-foreground">{formatNPR(delivery.loading_charge)}</span>
            </div>
            <div className="flex justify-between text-sm mt-2 pt-2 border-t border-gray-100 dark:border-border font-semibold">
              <span className="text-gray-700 dark:text-foreground">Total</span>
              <span className="text-gray-900 dark:text-foreground">{formatNPR(delivery.total_charges)}</span>
            </div>
          </InfoCard>
        </div>

        {delivery.delivery_notes && (
          <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm text-amber-900 dark:text-amber-200">
            {delivery.delivery_notes}
          </div>
        )}

        {delivery.failure_reason && (
          <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg p-4 text-sm text-red-900 dark:text-red-200">
            <strong>Failure reason:</strong> {delivery.failure_reason}
          </div>
        )}

        {/* Items */}
        <div className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-border">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-foreground">Items ({delivery.items?.length || 0})</h3>
          </div>
          {!delivery.items || delivery.items.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500 dark:text-muted-foreground">
              No line items — the linked invoice has no sales order to pull items from.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-muted/30 text-left text-xs text-gray-500 dark:text-muted-foreground">
                <tr>
                  <th className="px-5 py-2 font-medium">Product</th>
                  <th className="px-5 py-2 font-medium">Ordered</th>
                  <th className="px-5 py-2 font-medium">Delivered</th>
                  <th className="px-5 py-2 font-medium">Damaged</th>
                  <th className="px-5 py-2 font-medium">Unit Price</th>
                  <th className="px-5 py-2 font-medium text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-border">
                {delivery.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900 dark:text-foreground">{item.product_name}</p>
                      {item.product_sku && <p className="text-xs text-gray-400">{item.product_sku}</p>}
                    </td>
                    <td className="px-5 py-3 text-gray-600 dark:text-muted-foreground">{item.ordered_quantity}</td>
                    <td className="px-5 py-3 text-gray-600 dark:text-muted-foreground">{item.delivered_quantity}</td>
                    <td className="px-5 py-3 text-gray-600 dark:text-muted-foreground">{item.damaged_quantity || 0}</td>
                    <td className="px-5 py-3 text-gray-600 dark:text-muted-foreground">{formatNPR(item.unit_price)}</td>
                    <td className="px-5 py-3 text-right font-medium text-gray-900 dark:text-foreground">{formatNPR(item.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
