"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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
import { useLanguage } from "@/lib/context/LanguageContext";

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
  const { t } = useLanguage();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    if (!open) return;

    setFormData(emptyForm);

    const fetchWarehouses = async () => {
      try {
        const response = await inventoryApi.warehouses.list({ page_size: 500 });
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
      toast.success(t('pos.session_opened'));
      onOpenChange(false);
      onCreated?.();
      router.push(`/dashboard/pos/sessions/${session.id}`);
    } catch (error: unknown) {
      console.error("Error creating session:", error);
      const err = error as { response?: { data?: Record<string, unknown> } };
      const body = err.response?.data;
      let message = t('pos.failed_open_session');
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
          <DialogTitle>{t('pos.open_new_session')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div>
            <Label htmlFor="opening_cash" className="text-sm font-medium text-gray-700">
              {t('pos.opening_cash')} (Rs.) *
            </Label>
            <Input
              id="opening_cash"
              type="number"
              step="0.01"
              placeholder={t('pos.enter_opening_cash')}
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
              {t('pos.warehouse')} ({t('common.optional')})
            </Label>
            <Select
              value={formData.warehouse}
              onValueChange={(value) =>
                setFormData({ ...formData, warehouse: value || "" })
              }
            >
              <SelectTrigger className="mt-1 h-9 border-gray-200">
                <SelectValue placeholder={t('pos.select_warehouse')} />
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
              {t('pos.notes')} ({t('common.optional')})
            </Label>
            <Input
              id="notes"
              type="text"
              placeholder={t('pos.enter_notes')}
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
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#4A5D7A] hover:bg-[#2E3E52] text-white"
            >
              {loading ? t('pos.opening') : t('pos.open_session')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
