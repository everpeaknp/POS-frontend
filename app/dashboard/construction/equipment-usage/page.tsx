"use client";

import { useState, useEffect } from "react";
import { Plus, Clock } from "lucide-react";
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
import { EmptyState } from "@/components/shared/EmptyState";
import {
  ConstructionPageShell,
  constructionCardClass,
  constructionTableWrapClass,
} from "@/components/dashboard/ConstructionPageShell";
import {
  constructionApi,
  type EquipmentUsageLog,
  type Equipment,
  type Site,
} from "@/lib/api/construction";
import { formatNPR } from "@/lib/utils";
import toast from "react-hot-toast";

export default function EquipmentUsagePage() {
  const [logs, setLogs] = useState<EquipmentUsageLog[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    equipment: "",
    site: "",
    date: new Date().toISOString().split("T")[0],
    hours_used: "",
    notes: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [logsRes, equipRes, sitesRes] = await Promise.all([
        constructionApi.equipmentUsage.list(),
        constructionApi.equipment.list(),
        constructionApi.sites.list(),
      ]);
      setLogs(logsRes);
      setEquipment(Array.isArray(equipRes) ? equipRes : []);
      setSites(Array.isArray(sitesRes) ? sitesRes : []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load equipment usage");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await constructionApi.equipmentUsage.create({
        equipment: form.equipment,
        site: form.site,
        date: form.date,
        hours_used: parseFloat(form.hours_used),
        notes: form.notes || undefined,
      });
      toast.success("Usage logged");
      setDialogOpen(false);
      setForm({
        equipment: "",
        site: "",
        date: new Date().toISOString().split("T")[0],
        hours_used: "",
        notes: "",
      });
      fetchData();
    } catch (error: unknown) {
      console.error(error);
      toast.error("Failed to log usage");
    } finally {
      setSubmitting(false);
    }
  };

  const dialog = (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log Equipment Usage</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div>
            <Label>Equipment *</Label>
            <Select
              value={form.equipment}
              onValueChange={(v) => setForm({ ...form, equipment: v ?? "" })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select equipment" />
              </SelectTrigger>
              <SelectContent>
                {equipment.map((e) => (
                  <SelectItem key={e.id} value={String(e.id)}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Site *</Label>
            <Select
              value={form.site}
              onValueChange={(v) => setForm({ ...form, site: v ?? "" })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select site" />
              </SelectTrigger>
              <SelectContent>
                {sites.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Date *</Label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label>Hours Used *</Label>
            <Input
              type="number"
              step="0.5"
              min="0"
              value={form.hours_used}
              onChange={(e) => setForm({ ...form, hours_used: e.target.value })}
              className="mt-1"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Cost is calculated automatically from equipment rental rates.
            </p>
          </div>
          <div>
            <Label>Notes</Label>
            <Input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="mt-1"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white"
            >
              {submitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );

  if (!loading && logs.length === 0) {
    return (
      <>
        <ConstructionPageShell
          title="Equipment Usage"
          subtitle="Track equipment hours and costs by site"
          loading={loading}
        >
          <EmptyState
              icon={Clock}
              title="No usage logs yet"
              description="Log equipment hours and costs to track usage across your sites"
              actionLabel="Log Usage"
              onAction={() => setDialogOpen(true)}
            />
        </ConstructionPageShell>
        {dialog}
      </>
    );
  }

  return (
    <ConstructionPageShell
      title="Equipment Usage"
      subtitle="Track equipment hours and costs by site"
      loading={loading}
      action={
        <Button
          className="bg-[#22C55E] hover:bg-[#16A34A] text-white gap-2"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="h-4 w-4" /> Log Usage
        </Button>
      }
    >
      <div className={constructionTableWrapClass}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-muted/50 border-b border-gray-100 dark:border-border">
              <tr>
                {["Date", "Equipment", "Site", "Hours", "Cost", "Notes"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-border">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-muted/30">
                  <td className="px-4 py-3">{log.date}</td>
                  <td className="px-4 py-3 font-medium">
                    {log.equipment_name || log.equipment}
                  </td>
                  <td className="px-4 py-3">{log.site_name || log.site}</td>
                  <td className="px-4 py-3">{log.hours_used}h</td>
                  <td className="px-4 py-3">{formatNPR(Number(log.cost))}</td>
                  <td className="px-4 py-3 text-gray-500 truncate max-w-[200px]">
                    {log.notes || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {dialog}
    </ConstructionPageShell>
  );
}
