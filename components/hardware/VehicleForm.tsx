"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { vehicleAPI, type Vehicle } from "@/lib/api/hardware";
import toast from "react-hot-toast";

const inputClass = "h-9 text-sm border-gray-200 dark:border-border focus-visible:ring-0 focus-visible:border-gray-300";

interface VehicleFormProps {
  open: boolean;
  onClose: () => void;
  vehicle?: Vehicle | null;
  onSuccess: () => void;
}

export function VehicleForm({ open, onClose, vehicle, onSuccess }: VehicleFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_number: "",
    vehicle_type: "truck" as "truck" | "pickup" | "tempo" | "van" | "other",
    capacity_kg: "",
    status: "available" as "available" | "on_delivery" | "maintenance" | "inactive",
    is_owned: true,
    last_service_date: "",
    next_service_due: "",
    notes: "",
  });

  useEffect(() => {
    if (vehicle) {
      setFormData({
        vehicle_number: vehicle.vehicle_number || "",
        vehicle_type: vehicle.vehicle_type || "truck",
        capacity_kg: vehicle.capacity_kg?.toString() || "",
        status: vehicle.status || "available",
        is_owned: vehicle.is_owned ?? true,
        last_service_date: vehicle.last_service_date || "",
        next_service_due: vehicle.next_service_due || "",
        notes: vehicle.notes || "",
      });
    } else {
      // Reset form for new vehicle
      setFormData({
        vehicle_number: "",
        vehicle_type: "truck",
        capacity_kg: "",
        status: "available",
        is_owned: true,
        last_service_date: "",
        next_service_due: "",
        notes: "",
      });
    }
  }, [vehicle, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.vehicle_number.trim()) {
      toast.error("Vehicle number is required");
      return;
    }

    try {
      setLoading(true);

      const data = {
        vehicle_number: formData.vehicle_number.trim().toUpperCase(),
        vehicle_type: formData.vehicle_type,
        capacity_kg: formData.capacity_kg ? parseFloat(formData.capacity_kg) : undefined,
        status: formData.status,
        is_owned: formData.is_owned,
        last_service_date: formData.last_service_date || undefined,
        next_service_due: formData.next_service_due || undefined,
        notes: formData.notes || undefined,
      };

      if (vehicle) {
        await vehicleAPI.update(vehicle.id, data);
        toast.success("Vehicle updated successfully");
      } else {
        await vehicleAPI.create(data);
        toast.success("Vehicle added successfully");
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Failed to save vehicle:", error);
      const message = error?.response?.data?.error || error?.response?.data?.detail || "Failed to save vehicle";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{vehicle ? "Edit Vehicle" : "Add New Vehicle"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Vehicle Number */}
          <div>
            <Label htmlFor="vehicle_number" className="text-sm font-medium">
              Vehicle Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="vehicle_number"
              value={formData.vehicle_number}
              onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
              placeholder="e.g., BA 1 KHA 1234"
              className={inputClass}
              required
            />
          </div>

          {/* Vehicle Type & Capacity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vehicle_type" className="text-sm font-medium">
                Vehicle Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.vehicle_type}
                onValueChange={(value: any) => setFormData({ ...formData, vehicle_type: value })}
              >
                <SelectTrigger className={inputClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="truck">Truck</SelectItem>
                  <SelectItem value="pickup">Pickup</SelectItem>
                  <SelectItem value="tempo">Tempo</SelectItem>
                  <SelectItem value="van">Van</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="capacity_kg" className="text-sm font-medium">
                Capacity (kg)
              </Label>
              <Input
                id="capacity_kg"
                type="number"
                value={formData.capacity_kg}
                onChange={(e) => setFormData({ ...formData, capacity_kg: e.target.value })}
                placeholder="e.g., 5000"
                className={inputClass}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Status & Ownership */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status" className="text-sm font-medium">
                Status <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className={inputClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="on_delivery">On Delivery</SelectItem>
                  <SelectItem value="maintenance">Under Maintenance</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="is_owned" className="text-sm font-medium">
                Ownership <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.is_owned ? "owned" : "rented"}
                onValueChange={(value) => setFormData({ ...formData, is_owned: value === "owned" })}
              >
                <SelectTrigger className={inputClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owned">Owned</SelectItem>
                  <SelectItem value="rented">Rented</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Service Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="last_service_date" className="text-sm font-medium">
                Last Service Date
              </Label>
              <Input
                id="last_service_date"
                type="date"
                value={formData.last_service_date}
                onChange={(e) => setFormData({ ...formData, last_service_date: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <Label htmlFor="next_service_due" className="text-sm font-medium">
                Next Service Due
              </Label>
              <Input
                id="next_service_due"
                type="date"
                value={formData.next_service_due}
                onChange={(e) => setFormData({ ...formData, next_service_due: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="text-sm font-medium">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional notes about this vehicle..."
              className="text-sm border-gray-200 dark:border-border min-h-[80px]"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="h-9"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white"
            >
              {loading ? "Saving..." : vehicle ? "Update Vehicle" : "Add Vehicle"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
