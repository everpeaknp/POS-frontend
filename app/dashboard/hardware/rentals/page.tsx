"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, Wrench, Settings } from "@/lib/icons/lucide-react-shim";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DashHeader } from "@/components/dashboard/dash-header";
import { FormattedDate } from "@/components/shared/FormattedDate";
import { rentalAPI, type Rental, type RentalStats } from "@/lib/api/hardware";
import { formatNPR } from "@/lib/utils";
import toast from "react-hot-toast";
import { RentalForm } from "@/components/hardware/RentalForm";
import { RentalEquipmentManager } from "@/components/hardware/RentalEquipmentManager";

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  returned: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  damaged: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  lost: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const overdueColor = "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";

export default function RentalsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [stats, setStats] = useState<RentalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [editingRental, setEditingRental] = useState<Rental | null>(null);
  const [showEquipmentManager, setShowEquipmentManager] = useState(false);
  const [returningId, setReturningId] = useState<number | null>(null);
  const [returnConfirm, setReturnConfirm] = useState<Rental | null>(null);

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  useEffect(() => {
    if (searchParams.get("new") !== "1") return;
    setEditingRental(null);
    setShowForm(true);
    router.replace("/dashboard/hardware/rentals", { scroll: false });
  }, [searchParams, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rentalsRes, statsRes] = await Promise.all([
        rentalAPI.list({ status: statusFilter || undefined }),
        rentalAPI.stats(),
      ]);
      setRentals(rentalsRes.data?.results || []);
      setStats(statsRes.data);
    } catch (error) {
      console.error("Failed to load rentals:", error);
      toast.error("Failed to load rentals");
      setRentals([]);
    } finally {
      setLoading(false);
    }
  };

  const confirmMarkReturned = async () => {
    if (!returnConfirm) return;
    const rental = returnConfirm;
    try {
      setReturningId(rental.id);
      await rentalAPI.markReturned(rental.id);
      toast.success("Marked as returned");
      loadData();
    } catch (error) {
      console.error("Failed to mark returned:", error);
      toast.error("Failed to update rental");
    } finally {
      setReturningId(null);
      setReturnConfirm(null);
    }
  };

  const filteredRentals = rentals.filter((r) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      r.equipment_name?.toLowerCase().includes(q) ||
      r.customer_name?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Rentals" subtitle="Loading..." />
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
        title="Tool & Equipment Rentals"
        subtitle="Track what's rented out, to whom, and when it's due back"
      />

      <div className="flex-1 p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-card rounded-lg border border-gray-100 dark:border-border p-4">
            <div className="text-xs text-gray-500 dark:text-muted-foreground mb-1">Rented Out</div>
            <div className="text-2xl font-semibold text-green-600 dark:text-green-400">
              {stats?.active ?? 0}
            </div>
          </div>
          <div className="bg-white dark:bg-card rounded-lg border border-gray-100 dark:border-border p-4">
            <div className="text-xs text-gray-500 dark:text-muted-foreground mb-1">Overdue</div>
            <div className="text-2xl font-semibold text-red-600 dark:text-red-400">
              {stats?.overdue ?? 0}
            </div>
          </div>
          <div className="bg-white dark:bg-card rounded-lg border border-gray-100 dark:border-border p-4">
            <div className="text-xs text-gray-500 dark:text-muted-foreground mb-1">Returned This Month</div>
            <div className="text-2xl font-semibold text-gray-900 dark:text-foreground">
              {stats?.returned_this_month ?? 0}
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by equipment or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 border-gray-200 dark:border-border"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] h-10 border-gray-200 dark:border-border">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="active">Rented Out</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
                <SelectItem value="damaged">Damaged</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowEquipmentManager(true)}
              className="gap-2 border-gray-200 dark:border-border"
            >
              <Settings className="h-4 w-4" />
              Equipment
            </Button>
            <Button
              onClick={() => {
                setEditingRental(null);
                setShowForm(true);
              }}
              className="bg-[var(--color-accent-custom,#22C55E)] hover:bg-[#16A34A] text-white gap-2"
            >
              <Plus className="h-4 w-4" />
              Rent Out Equipment
            </Button>
          </div>
        </div>

        {/* Rentals List */}
        {filteredRentals.length === 0 ? (
          <div className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border p-12 text-center">
            <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-muted-foreground">
              {searchTerm || statusFilter ? "No rentals found matching your filters" : "No rentals yet"}
            </p>
            {!searchTerm && !statusFilter && (
              <Button
                onClick={() => {
                  setEditingRental(null);
                  setShowForm(true);
                }}
                className="mt-4 bg-[var(--color-accent-custom,#22C55E)] hover:bg-[#16A34A] text-white"
              >
                Rent Out Your First Item
              </Button>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-muted/50 border-b border-gray-100 dark:border-border">
                <tr>
                  {["Equipment", "Customer", "Qty", "Checked Out", "Due Back", "Status", "Charge", "Actions"].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-muted-foreground uppercase whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-border">
                {filteredRentals.map((rental) => (
                  <tr
                    key={rental.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => {
                      setEditingRental(rental);
                      setShowForm(true);
                    }}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-foreground whitespace-nowrap">
                      {rental.equipment_name}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground whitespace-nowrap">
                      {rental.customer_name}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground">{rental.quantity}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground whitespace-nowrap">
                      <FormattedDate value={rental.checkout_date} />
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground whitespace-nowrap">
                      <FormattedDate value={rental.due_date} />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                          rental.is_overdue ? overdueColor : statusColors[rental.status] || statusColors.returned
                        }`}
                      >
                        {rental.is_overdue ? "Overdue" : rental.status_display}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-foreground font-medium whitespace-nowrap">
                      {formatNPR(rental.total_charge)}
                    </td>
                    <td className="px-4 py-3">
                      {rental.status === "active" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={returningId === rental.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setReturnConfirm(rental);
                          }}
                          className="h-7 text-xs whitespace-nowrap"
                        >
                          {returningId === rental.id ? "Saving..." : "Mark Returned"}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <RentalForm
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingRental(null);
        }}
        rental={editingRental}
        onSuccess={loadData}
      />

      <RentalEquipmentManager
        open={showEquipmentManager}
        onClose={() => setShowEquipmentManager(false)}
        onChanged={loadData}
      />

      <Dialog open={!!returnConfirm} onOpenChange={(open) => !open && setReturnConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark as Returned?</DialogTitle>
            <DialogDescription>
              {returnConfirm && (
                <>
                  "{returnConfirm.equipment_name}" will be marked as returned by{" "}
                  {returnConfirm.customer_name}, and the unit will be available to rent out again.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnConfirm(null)}>
              Cancel
            </Button>
            <Button
              onClick={confirmMarkReturned}
              disabled={returningId !== null}
              className="bg-[var(--color-accent-custom,#22C55E)] hover:bg-[#16A34A] text-white"
            >
              {returningId !== null ? "Saving..." : "Mark Returned"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
