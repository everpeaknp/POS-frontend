"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Wrench } from "@/lib/icons/lucide-react-shim";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { rentalEquipmentAPI, type RentalEquipment } from "@/lib/api/hardware";
import { formatNPR } from "@/lib/utils";
import toast from "react-hot-toast";

const inputClass = "h-9 text-sm border-gray-200 dark:border-border focus-visible:ring-0 focus-visible:border-gray-300";

const categoryOptions: { value: RentalEquipment["category"]; label: string }[] = [
  { value: "power_tool", label: "Power Tool" },
  { value: "machinery", label: "Machinery" },
  { value: "scaffolding", label: "Scaffolding" },
  { value: "measuring", label: "Measuring Equipment" },
  { value: "other", label: "Other" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
}

export function RentalEquipmentManager({ open, onClose, onChanged }: Props) {
  const [equipment, setEquipment] = useState<RentalEquipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "other" as RentalEquipment["category"],
    total_units: "1",
    daily_rate: "",
    deposit_amount: "",
  });

  useEffect(() => {
    if (open) loadEquipment();
  }, [open]);

  const loadEquipment = async () => {
    try {
      setLoading(true);
      const response = await rentalEquipmentAPI.list();
      setEquipment(response.data?.results || []);
    } catch (error) {
      console.error("Failed to load equipment:", error);
      toast.error("Failed to load equipment");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: "", category: "other", total_units: "1", daily_rate: "", deposit_amount: "" });
    setShowAddForm(false);
  };

  const handleAdd = async () => {
    if (!formData.name.trim()) {
      toast.error("Please enter an equipment name");
      return;
    }
    if (!formData.daily_rate || parseFloat(formData.daily_rate) < 0) {
      toast.error("Please enter a daily rental rate");
      return;
    }

    try {
      setSaving(true);
      await rentalEquipmentAPI.create({
        name: formData.name.trim(),
        category: formData.category,
        total_units: parseInt(formData.total_units, 10) || 1,
        daily_rate: formData.daily_rate,
        deposit_amount: formData.deposit_amount || "0",
      });
      toast.success("Equipment added");
      resetForm();
      await loadEquipment();
      onChanged();
    } catch (error) {
      console.error("Failed to add equipment:", error);
      toast.error("Failed to add equipment");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (item: RentalEquipment) => {
    if (item.units_out > 0) {
      toast.error("Can't remove equipment that's currently rented out");
      return;
    }
    setDeleteConfirmId(item.id);
  };

  const confirmDelete = async (item: RentalEquipment) => {
    try {
      await rentalEquipmentAPI.delete(item.id);
      toast.success("Equipment removed");
      await loadEquipment();
      onChanged();
    } catch (error: any) {
      console.error("Failed to delete equipment:", error);
      toast.error(error?.response?.data?.detail || "Failed to remove equipment");
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const toggleActive = async (item: RentalEquipment) => {
    try {
      await rentalEquipmentAPI.setActive(item.id, !item.is_active);
      toast.success(item.is_active ? "Equipment deactivated" : "Equipment activated");
      await loadEquipment();
      onChanged();
    } catch (error) {
      console.error("Failed to update equipment:", error);
      toast.error("Failed to update equipment");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rental Equipment</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-gray-500 dark:text-muted-foreground -mt-2">
          The tools and machines your shop rents out to customers.
        </p>

        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : equipment.length === 0 && !showAddForm ? (
          <div className="text-center py-8">
            <Wrench className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-muted-foreground mb-4">
              No rental equipment yet — add your first item to start renting it out.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {equipment.map((item) =>
              deleteConfirmId === item.id ? (
                <div
                  key={item.id}
                  className="p-3 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 space-y-2"
                >
                  <p className="text-sm text-red-800 dark:text-red-300">
                    Remove "{item.name}" from your rental catalogue?
                  </p>
                  <div className="flex items-center justify-end gap-2">
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setDeleteConfirmId(null)}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 text-xs bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => confirmDelete(item)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    item.is_active
                      ? "border-gray-100 dark:border-border"
                      : "border-gray-100 dark:border-border bg-gray-50 dark:bg-muted/30"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-foreground">{item.name}</p>
                      {!item.is_active && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-muted-foreground">
                      {item.category_display} · {formatNPR(Number(item.daily_rate))}/day ·{" "}
                      {item.units_available} of {item.total_units} available
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggleActive(item)}
                      className="px-2 py-1 text-xs text-gray-500 hover:text-gray-900 dark:hover:text-foreground rounded-lg hover:bg-gray-100 dark:hover:bg-muted whitespace-nowrap"
                      title={item.is_active ? "Hide from new rentals" : "Make available for new rentals"}
                    >
                      {item.is_active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => handleDeleteClick(item)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0"
                      title="Remove equipment"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {showAddForm ? (
          <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-border">
            <div>
              <Label className="text-sm font-medium">
                Equipment Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Cement Mixer"
                className={inputClass}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: any) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className={inputClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">How Many You Own</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.total_units}
                  onChange={(e) => setFormData({ ...formData, total_units: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium">
                  Rate per Day <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.daily_rate}
                  onChange={(e) => setFormData({ ...formData, daily_rate: e.target.value })}
                  placeholder="e.g., 500"
                  className={inputClass}
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Security Deposit</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.deposit_amount}
                  onChange={(e) => setFormData({ ...formData, deposit_amount: e.target.value })}
                  placeholder="e.g., 2000"
                  className={inputClass}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={resetForm} disabled={saving} className="h-9">
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleAdd}
                disabled={saving}
                className="h-9 bg-[var(--color-accent-custom,#22C55E)] hover:bg-[#16A34A] text-white"
              >
                {saving ? "Adding..." : "Add Equipment"}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowAddForm(true)}
            className="gap-2 w-full"
          >
            <Plus className="h-4 w-4" />
            Add Equipment
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
