"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import posApi from "@/lib/api/pos";
import { inventoryApi, type Warehouse } from "@/lib/api/inventory";
import toast from "react-hot-toast";

const emptyForm = {
  opening_cash: "",
  warehouse: "",
  notes: "",
};

interface NewPosSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export function NewPosSessionDialog({
  open,
  onOpenChange,
  onCreated,
}: NewPosSessionDialogProps) {
  const router = useRouter();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    if (!open) return;

    setFormData(emptyForm);

    const fetchWarehouses = async () => {
      try {
        const response = await inventoryApi.warehouses.list();
        setWarehouses(response.data.results || []);
      } catch (error) {
        console.error("Error loading warehouses:", error);
      }
    };

    fetchWarehouses();
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data: {
        opening_cash: number;
        warehouse?: number;
        notes?: string;
      } = {
        opening_cash: parseFloat(formData.opening_cash),
      };

      if (formData.notes.trim()) {
        data.notes = formData.notes.trim();
      }

      if (formData.warehouse) {
        data.warehouse = parseInt(formData.warehouse, 10);
      }

      const session = await posApi.createSession(data);
      toast.success("Session opened successfully");
      onOpenChange(false);
      onCreated?.();
      router.push(`/dashboard/pos/sessions/${session.id}`);
    } catch (error: unknown) {
      console.error("Error creating session:", error);
      const err = error as { response?: { data?: Record<string, unknown> } };
      const body = err.response?.data;
      let message = "Failed to open session";
      if (typeof body?.detail === "string") {
        message = body.detail;
      } else if (body && typeof body === "object") {
        const first = Object.entries(body).find(([, v]) => v);
        if (first) {
          const [field, val] = first;
          const text = Array.isArray(val) ? val[0] : String(val);
          message = `${field}: ${text}`;
        }
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Open New POS Session</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div>
            <Label htmlFor="opening_cash" className="text-sm font-medium text-gray-700">
              Opening Cash (Rs.) *
            </Label>
            <Input
              id="opening_cash"
              type="number"
              step="0.01"
              placeholder="Enter opening cash amount"
              value={formData.opening_cash}
              onChange={(e) =>
                setFormData({ ...formData, opening_cash: e.target.value })
              }
              className="mt-1 h-9 border-gray-200"
              required
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="warehouse" className="text-sm font-medium text-gray-700">
              Warehouse (Optional)
            </Label>
            <Select
              value={formData.warehouse}
              onValueChange={(value) =>
                setFormData({ ...formData, warehouse: value || "" })
              }
            >
              <SelectTrigger className="mt-1 h-9 border-gray-200">
                <SelectValue placeholder="Select warehouse" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={w.id.toString()}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
              Notes (Optional)
            </Label>
            <Input
              id="notes"
              type="text"
              placeholder="Enter any notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="mt-1 h-9 border-gray-200"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Opening...
                </>
              ) : (
                "Open Session"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
