"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashHeader } from "@/components/dashboard/dash-header";
import { vehicleAPI, type Vehicle } from "@/lib/api/hardware";
import toast from "react-hot-toast";

const statusColors = {
  available: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  on_delivery: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  maintenance: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  inactive: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

const statusLabels = {
  available: "Available",
  on_delivery: "On Delivery",
  maintenance: "Maintenance",
  inactive: "Inactive",
};

const vehicleTypeLabels = {
  truck: "Truck",
  pickup: "Pickup",
  tempo: "Tempo",
  van: "Van",
  other: "Other",
};

import { VehicleForm } from "@/components/hardware/VehicleForm";

export default function VehiclesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    loadVehicles();
  }, [statusFilter]);

  useEffect(() => {
    if (searchParams.get("new") !== "1") return;
    setEditingVehicle(null);
    setShowForm(true);
    router.replace("/dashboard/hardware/vehicles", { scroll: false });
  }, [searchParams, router]);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const response = await vehicleAPI.list({ status: statusFilter || undefined });
      setVehicles(response.data?.results || []);
    } catch (error) {
      console.error("Failed to load vehicles:", error);
      toast.error("Failed to load vehicles");
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredVehicles = (vehicles || []).filter((vehicle) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      vehicle.vehicle_number?.toLowerCase().includes(q) ||
      vehicle.vehicle_type?.toLowerCase().includes(q)
    );
  });

  const stats = {
    total: (vehicles || []).length,
    available: (vehicles || []).filter((v) => v.status === "available").length,
    on_delivery: (vehicles || []).filter((v) => v.status === "on_delivery").length,
    maintenance: (vehicles || []).filter((v) => v.status === "maintenance").length,
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Vehicles" subtitle="Loading..." />
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
        title="Delivery Vehicles" 
        subtitle="Manage trucks, pickups, and delivery vehicles"
      />

      <div className="flex-1 p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-card rounded-lg border border-gray-100 dark:border-border p-4">
            <div className="text-xs text-gray-500 dark:text-muted-foreground mb-1">Total Vehicles</div>
            <div className="text-2xl font-semibold text-gray-900 dark:text-foreground">{stats.total}</div>
          </div>
          <div className="bg-white dark:bg-card rounded-lg border border-gray-100 dark:border-border p-4">
            <div className="text-xs text-gray-500 dark:text-muted-foreground mb-1">Available</div>
            <div className="text-2xl font-semibold text-green-600 dark:text-green-400">{stats.available}</div>
          </div>
          <div className="bg-white dark:bg-card rounded-lg border border-gray-100 dark:border-border p-4">
            <div className="text-xs text-gray-500 dark:text-muted-foreground mb-1">On Delivery</div>
            <div className="text-2xl font-semibold text-yellow-600 dark:text-yellow-400">{stats.on_delivery}</div>
          </div>
          <div className="bg-white dark:bg-card rounded-lg border border-gray-100 dark:border-border p-4">
            <div className="text-xs text-gray-500 dark:text-muted-foreground mb-1">Maintenance</div>
            <div className="text-2xl font-semibold text-red-600 dark:text-red-400">{stats.maintenance}</div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search vehicles..."
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
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="on_delivery">On Delivery</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-[var(--color-accent-custom,#22C55E)] hover:bg-[#16A34A] text-white gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Vehicle
          </Button>
        </div>

        {/* Vehicles List */}
        {filteredVehicles.length === 0 ? (
          <div className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border p-12 text-center">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-muted-foreground">
              {searchTerm || statusFilter ? "No vehicles found matching your filters" : "No vehicles yet"}
            </p>
            {!searchTerm && !statusFilter && (
              <Button
                onClick={() => setShowForm(true)}
                className="mt-4 bg-[var(--color-accent-custom,#22C55E)] hover:bg-[#16A34A] text-white"
              >
                Add First Vehicle
              </Button>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-muted/50 border-b border-gray-100 dark:border-border">
                <tr>
                  {["Vehicle Number", "Type", "Capacity (kg)", "Status", "Ownership", "Service Due"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-muted-foreground uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-border">
                {filteredVehicles.map((vehicle) => (
                  <tr
                    key={vehicle.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => {
                      setEditingVehicle(vehicle);
                      setShowForm(true);
                    }}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-foreground">
                      {vehicle.vehicle_number}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground capitalize">
                      {vehicleTypeLabels[vehicle.vehicle_type as keyof typeof vehicleTypeLabels]}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground">
                      {vehicle.capacity_kg ? vehicle.capacity_kg.toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                          statusColors[vehicle.status as keyof typeof statusColors]
                        }`}
                      >
                        {statusLabels[vehicle.status as keyof typeof statusLabels]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground">
                      {vehicle.is_owned ? "Owned" : "Rented"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground text-xs">
                      {vehicle.next_service_due || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* TODO: Add vehicle form dialog/modal here */}
      <VehicleForm
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingVehicle(null);
        }}
        vehicle={editingVehicle}
        onSuccess={loadVehicles}
      />
    </div>
  );
}
