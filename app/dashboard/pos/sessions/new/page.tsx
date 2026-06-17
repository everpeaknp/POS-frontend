"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashHeader } from "@/components/dashboard/dash-header";
import posApi from "@/lib/api/pos";
import { inventoryApi, type Warehouse } from "@/lib/api/inventory";
import toast from "react-hot-toast";

export default function NewPosSessionPage() {
  const router = useRouter();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    opening_cash: "",
    warehouse: "",
    notes: "",
  });

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const response = await inventoryApi.warehouses.list();
      setWarehouses(response.data.results || []);
    } catch (error) {
      console.error("Error loading warehouses:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data: any = {
        opening_cash: parseFloat(formData.opening_cash),
        notes: formData.notes,
      };
      
      if (formData.warehouse) {
        data.warehouse = formData.warehouse;
      }

      const session = await posApi.createSession(data);
      toast.success("Session opened successfully");
      router.push(`/dashboard/pos/sessions/${session.id}`);
    } catch (error: any) {
      console.error("Error creating session:", error);
      toast.error(error.response?.data?.detail || "Failed to open session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Open New POS Session" subtitle="Start a new point of sale session" />
      <div className="flex-1 p-6">
        <div className="max-w-2xl bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="opening_cash" className="text-sm font-medium text-gray-700">Opening Cash (Rs.) *</Label>
              <Input
                id="opening_cash"
                type="number"
                step="0.01"
                placeholder="Enter opening cash amount"
                value={formData.opening_cash}
                onChange={(e) => setFormData({ ...formData, opening_cash: e.target.value })}
                className="mt-1 h-9 border-gray-200"
                required
              />
            </div>

            <div>
              <Label htmlFor="warehouse" className="text-sm font-medium text-gray-700">Warehouse (Optional)</Label>
              <Select value={formData.warehouse} onValueChange={(value) => setFormData({ ...formData, warehouse: value || "" })}>
                <SelectTrigger className="mt-1 h-9 border-gray-200">
                  <SelectValue placeholder="Select warehouse" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Warehouse</SelectItem>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={w.id.toString()}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes" className="text-sm font-medium text-gray-700">Notes (Optional)</Label>
              <Input
                id="notes"
                type="text"
                placeholder="Enter any notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="mt-1 h-9 border-gray-200"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading} className="bg-[#22C55E] hover:bg-[#16A34A] text-white">
                {loading ? "Opening..." : "Open Session"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
