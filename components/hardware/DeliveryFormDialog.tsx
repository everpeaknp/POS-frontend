"use client";

import { useEffect, useState } from "react";
import { ChevronDownIcon, Package } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { invoiceAPI, type Invoice } from "@/lib/api/sales";
import { vehicleAPI, deliveryAPI, type Vehicle, type Delivery } from "@/lib/api/hardware";
import { formatNPR, cn } from "@/lib/utils";
import toast from "react-hot-toast";

const todayISO = () => new Date().toISOString().split("T")[0];

interface DeliveryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (delivery: Delivery) => void;
}

export function DeliveryFormDialog({ open, onOpenChange, onSuccess }: DeliveryFormDialogProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);

  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");

  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [scheduledDate, setScheduledDate] = useState(todayISO());
  const [scheduledTime, setScheduledTime] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [transportCharge, setTransportCharge] = useState("");
  const [loadingCharge, setLoadingCharge] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    // Reset to a clean form every time the dialog opens
    setInvoiceOpen(false);
    setInvoiceSearch("");
    setSelectedInvoiceId("");
    setDeliveryAddress("");
    setContactName("");
    setContactPhone("");
    setScheduledDate(todayISO());
    setScheduledTime("");
    setVehicleId("");
    setDriverName("");
    setDriverPhone("");
    setTransportCharge("");
    setLoadingCharge("");
    setNotes("");

    setLoadingOptions(true);
    Promise.all([
      invoiceAPI.list({ limit: 200, ordering: "-date" }),
      vehicleAPI.getAvailable(),
    ])
      .then(([invoiceRes, vehicleRes]) => {
        setInvoices(invoiceRes.data?.results || []);
        setVehicles(Array.isArray(vehicleRes.data) ? vehicleRes.data : []);
      })
      .catch(() => toast.error("Failed to load invoices/vehicles"))
      .finally(() => setLoadingOptions(false));
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-dropdown]")) setInvoiceOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.invoice_number.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      (inv.customer_name || "").toLowerCase().includes(invoiceSearch.toLowerCase())
  );
  const selectedInvoice = invoices.find((inv) => String(inv.id) === selectedInvoiceId);

  const handleSave = async () => {
    if (!selectedInvoiceId) {
      toast.error("Select an invoice to deliver");
      return;
    }
    if (!deliveryAddress.trim()) {
      toast.error("Enter a delivery address");
      return;
    }
    if (!scheduledDate) {
      toast.error("Pick a scheduled date");
      return;
    }

    setSaving(true);
    try {
      const response = await deliveryAPI.create({
        invoice: Number(selectedInvoiceId),
        delivery_address: deliveryAddress.trim(),
        customer_contact_name: contactName.trim() || undefined,
        customer_contact_phone: contactPhone.trim() || undefined,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime || undefined,
        vehicle: vehicleId ? Number(vehicleId) : undefined,
        driver_name: driverName.trim() || undefined,
        driver_phone: driverPhone.trim() || undefined,
        transport_charge: transportCharge ? Number(transportCharge) : undefined,
        loading_charge: loadingCharge ? Number(loadingCharge) : undefined,
        delivery_notes: notes.trim() || undefined,
      });
      toast.success(`Delivery ${response.data.delivery_number} created`);
      onOpenChange(false);
      onSuccess(response.data);
    } catch (error: any) {
      const data = error.response?.data;
      const message =
        data?.detail ||
        data?.invoice?.[0] ||
        data?.delivery_address?.[0] ||
        data?.scheduled_date?.[0] ||
        "Failed to create delivery";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Delivery</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Invoice picker */}
          <div className="space-y-2">
            <Label>Invoice *</Label>
            <div className="relative" data-dropdown>
              <button
                type="button"
                onClick={() => setInvoiceOpen(!invoiceOpen)}
                disabled={loadingOptions}
                className={cn(
                  "flex w-full items-center justify-between h-10 px-3 text-sm border rounded-md bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100",
                  !selectedInvoiceId && "text-gray-500"
                )}
              >
                <span className="truncate">
                  {loadingOptions
                    ? "Loading..."
                    : selectedInvoice
                      ? `${selectedInvoice.invoice_number} — ${selectedInvoice.customer_name || "Unknown customer"} (${formatNPR(selectedInvoice.balance)} due)`
                      : "Select invoice to deliver"}
                </span>
                <ChevronDownIcon className="h-4 w-4 opacity-50 shrink-0" />
              </button>
              {invoiceOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 z-50 max-h-64 overflow-auto rounded-lg bg-white dark:bg-gray-900 shadow-lg border border-gray-200 dark:border-gray-700">
                  <div className="px-2 py-1.5 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900">
                    <Input
                      placeholder="Search invoice # or customer..."
                      value={invoiceSearch}
                      onChange={(e) => setInvoiceSearch(e.target.value)}
                      className="h-8 text-sm"
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                  </div>
                  <div className="p-1">
                    {filteredInvoices.length === 0 ? (
                      <div className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">No invoice found</div>
                    ) : (
                      filteredInvoices.map((inv) => (
                        <div
                          key={inv.id}
                          onClick={() => {
                            setSelectedInvoiceId(String(inv.id));
                            setInvoiceOpen(false);
                            setInvoiceSearch("");
                          }}
                          className={cn(
                            "px-2 py-1.5 text-sm rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800",
                            selectedInvoiceId === String(inv.id) && "bg-gray-100 dark:bg-gray-800 font-medium"
                          )}
                        >
                          <span className="font-medium">{inv.invoice_number}</span>
                          <span className="text-gray-400"> · {inv.customer_name || "Unknown"} · {formatNPR(inv.balance)} due</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Delivery items are pulled automatically from this invoice's line items.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="delivery-address">Delivery Address *</Label>
            <Input
              id="delivery-address"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="Site address for delivery"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact-name">Contact Name</Label>
              <Input id="contact-name" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Site contact" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-phone">Contact Phone</Label>
              <PhoneInput id="contact-phone" value={contactPhone} onChange={setContactPhone} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduled-date">Scheduled Date *</Label>
              <Input id="scheduled-date" type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduled-time">Scheduled Time</Label>
              <Input id="scheduled-time" type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Vehicle</Label>
              <Select value={vehicleId || "none"} onValueChange={(v) => setVehicleId(v && v !== "none" ? v : "")} disabled={loadingOptions}>
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={String(v.id)}>
                      {v.vehicle_number} ({v.vehicle_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {vehicles.length === 0 && !loadingOptions && (
                <p className="text-xs text-gray-500 dark:text-gray-400">No available vehicles — add one under Hardware → Vehicles.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="driver-name">Driver Name</Label>
              <Input id="driver-name" value={driverName} onChange={(e) => setDriverName(e.target.value)} placeholder="Optional" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="driver-phone">Driver Phone</Label>
              <PhoneInput id="driver-phone" value={driverPhone} onChange={setDriverPhone} placeholder="Optional" />
            </div>
            <div />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transport-charge">Transport Charge (Rs.)</Label>
              <Input
                id="transport-charge"
                type="number"
                min="0"
                step="0.01"
                value={transportCharge}
                onChange={(e) => setTransportCharge(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="loading-charge">Loading Charge (Rs.)</Label>
              <Input
                id="loading-charge"
                type="number"
                min="0"
                step="0.01"
                value={loadingCharge}
                onChange={(e) => setLoadingCharge(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="delivery-notes">Delivery Notes</Label>
            <Input id="delivery-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={loadingOptions}
            loading={saving}
            loadingText="Creating..."
            className="bg-[var(--color-accent-custom,#22C55E)] hover:bg-[var(--color-accent-custom-600,#16A34A)] gap-2"
          >
            <Package className="h-4 w-4" />
            Create Delivery
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
