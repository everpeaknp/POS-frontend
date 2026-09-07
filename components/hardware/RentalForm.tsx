"use client";

import { useState, useEffect, useMemo } from "react";
import { Settings } from "@/lib/icons/lucide-react-shim";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { rentalAPI, rentalEquipmentAPI, type Rental, type RentalEquipment } from "@/lib/api/hardware";
import { customerAPI, type Customer } from "@/lib/api/sales";
import { HARDWARE_LIST_PARAMS, unwrapList } from "@/lib/api/hardware-helpers";
import { formatNPR } from "@/lib/utils";
import toast from "react-hot-toast";
import { RentalEquipmentManager } from "./RentalEquipmentManager";

const inputClass = "h-9 text-sm border-gray-200 dark:border-border focus-visible:ring-0 focus-visible:border-gray-300";

function today() {
  return new Date().toISOString().split("T")[0];
}

interface RentalFormProps {
  open: boolean;
  onClose: () => void;
  rental?: Rental | null;
  onSuccess: () => void;
}

export function RentalForm({ open, onClose, rental, onSuccess }: RentalFormProps) {
  const [loading, setLoading] = useState(false);
  const [equipment, setEquipment] = useState<RentalEquipment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [showEquipmentManager, setShowEquipmentManager] = useState(false);

  const [formData, setFormData] = useState({
    equipment: "",
    customer: "",
    quantity: "1",
    checkout_date: today(),
    due_date: today(),
    daily_rate: "",
    deposit_collected: "",
    notes: "",
  });

  const loadLists = async () => {
    try {
      setLoadingLists(true);
      const [equipRes, custRes] = await Promise.all([
        rentalEquipmentAPI.list({ active_only: true }),
        customerAPI.list(HARDWARE_LIST_PARAMS),
      ]);
      setEquipment(equipRes.data?.results || []);
      setCustomers(unwrapList(custRes.data));
    } catch (error) {
      console.error("Failed to load rental form data:", error);
      toast.error("Failed to load equipment/customers");
    } finally {
      setLoadingLists(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    loadLists();
  }, [open]);

  useEffect(() => {
    if (rental) {
      setFormData({
        equipment: String(rental.equipment),
        customer: String(rental.customer),
        quantity: String(rental.quantity),
        checkout_date: rental.checkout_date,
        due_date: rental.due_date,
        daily_rate: String(rental.daily_rate),
        deposit_collected: String(rental.deposit_collected),
        notes: rental.notes || "",
      });
    } else {
      setFormData({
        equipment: "",
        customer: "",
        quantity: "1",
        checkout_date: today(),
        due_date: today(),
        daily_rate: "",
        deposit_collected: "",
        notes: "",
      });
    }
  }, [rental, open]);

  const selectedEquipment = equipment.find((e) => String(e.id) === formData.equipment);

  // Prefill rate/deposit from the chosen equipment's defaults — editable afterwards.
  useEffect(() => {
    if (!selectedEquipment || rental) return;
    setFormData((prev) => ({
      ...prev,
      daily_rate: prev.daily_rate || String(selectedEquipment.daily_rate),
      deposit_collected: prev.deposit_collected || String(selectedEquipment.deposit_amount),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEquipment]);

  const estimatedDays = useMemo(() => {
    const start = new Date(formData.checkout_date);
    const end = new Date(formData.due_date);
    const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, diff);
  }, [formData.checkout_date, formData.due_date]);

  const estimatedTotal = useMemo(() => {
    const rate = parseFloat(formData.daily_rate) || 0;
    const qty = parseInt(formData.quantity, 10) || 0;
    return rate * qty * estimatedDays;
  }, [formData.daily_rate, formData.quantity, estimatedDays]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.equipment) {
      toast.error("Please select equipment to rent out");
      return;
    }
    if (!formData.customer) {
      toast.error("Please select a customer");
      return;
    }
    const qty = parseInt(formData.quantity, 10);
    if (!qty || qty < 1) {
      toast.error("Quantity must be at least 1");
      return;
    }

    try {
      setLoading(true);
      const data = {
        equipment: parseInt(formData.equipment, 10),
        customer: parseInt(formData.customer, 10),
        quantity: qty,
        checkout_date: formData.checkout_date,
        due_date: formData.due_date,
        daily_rate: formData.daily_rate || undefined,
        deposit_collected: formData.deposit_collected || undefined,
        notes: formData.notes || undefined,
      };

      if (rental) {
        await rentalAPI.update(rental.id, data);
        toast.success("Rental updated");
      } else {
        await rentalAPI.create(data);
        toast.success("Equipment checked out");
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Failed to save rental:", error);
      const message =
        error?.response?.data?.quantity?.[0] ||
        error?.response?.data?.detail ||
        "Failed to save rental";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{rental ? "Edit Rental" : "Rent Out Equipment"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-sm font-medium">
                  Equipment <span className="text-red-500">*</span>
                </Label>
                <button
                  type="button"
                  onClick={() => setShowEquipmentManager(true)}
                  className="text-xs text-[var(--color-accent-custom,#22C55E)] hover:underline flex items-center gap-1"
                >
                  <Settings className="h-3 w-3" />
                  Manage equipment
                </button>
              </div>
              <Select
                value={formData.equipment}
                onValueChange={(value) => setFormData({ ...formData, equipment: value || "" })}
                disabled={!!rental || loadingLists}
              >
                <SelectTrigger className={inputClass}>
                  <SelectValue placeholder={loadingLists ? "Loading..." : "Select equipment to rent out"} />
                </SelectTrigger>
                <SelectContent>
                  {equipment.length === 0 && !loadingLists ? (
                    <div className="px-3 py-2 text-xs text-gray-500">
                      No equipment yet — add some first.
                    </div>
                  ) : (
                    equipment.map((item) => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        {item.name} — {item.units_available} available
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">
                Customer <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.customer}
                onValueChange={(value) => setFormData({ ...formData, customer: value || "" })}
                disabled={loadingLists}
              >
                <SelectTrigger className={inputClass}>
                  <SelectValue placeholder={loadingLists ? "Loading..." : "Select a customer"} />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                      {c.phone ? ` — ${c.phone}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">
                  Quantity <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Rate per Day</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.daily_rate}
                  onChange={(e) => setFormData({ ...formData, daily_rate: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">
                  Checkout Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={formData.checkout_date}
                  onChange={(e) => setFormData({ ...formData, checkout_date: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <Label className="text-sm font-medium">
                  Due Back <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Security Deposit Collected</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.deposit_collected}
                onChange={(e) => setFormData({ ...formData, deposit_collected: e.target.value })}
                className={inputClass}
              />
            </div>

            <div className="rounded-lg bg-gray-50 dark:bg-muted/50 p-3 flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-muted-foreground">
                {estimatedDays} day{estimatedDays !== 1 ? "s" : ""} rental
              </span>
              <span className="font-semibold text-gray-900 dark:text-foreground">
                Est. {formatNPR(estimatedTotal)}
              </span>
            </div>

            <div>
              <Label className="text-sm font-medium">Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional notes..."
                className="text-sm border-gray-200 dark:border-border min-h-[70px]"
                rows={2}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="h-9">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="h-9 bg-[var(--color-accent-custom,#22C55E)] hover:bg-[var(--color-accent-custom-600,#16A34A)] text-white"
              >
                {loading ? "Saving..." : rental ? "Update Rental" : "Check Out"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <RentalEquipmentManager
        open={showEquipmentManager}
        onClose={() => setShowEquipmentManager(false)}
        onChanged={loadLists}
      />
    </>
  );
}
