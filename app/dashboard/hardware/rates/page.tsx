"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  Copy,
  Trash2,
  ChevronDownIcon,
  Loader2,
} from "lucide-react";
import { DashHeader } from "@/components/dashboard/dash-header";
import { SkeletonCard } from "@/components/shared/Skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { materialRateAPI, type MaterialRate } from "@/lib/api/hardware";
import { inventoryApi, type Product } from "@/lib/api/inventory";
import { formatNPR } from "@/lib/utils";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const todayISO = () => new Date().toISOString().split("T")[0];

function RateChangeBadge({ change }: { change: MaterialRate["change"] }) {
  const value = change === null || change === undefined ? null : Number(change);
  if (value === null || Number.isNaN(value) || value === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-400 dark:text-muted-foreground">
        <Minus className="h-3 w-3" /> No change
      </span>
    );
  }
  const up = value > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium",
        up ? "text-red-600 dark:text-red-400" : "text-[var(--color-accent-custom,#22C55E)]"
      )}
    >
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {up ? "+" : ""}
      {formatNPR(Math.abs(value))}
    </span>
  );
}

export default function HardwareRateBoardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [rates, setRates] = useState<MaterialRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [prefillProduct, setPrefillProduct] = useState<MaterialRate | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    rate: MaterialRate | null;
  }>({
    isOpen: false,
    rate: null,
  });

  useEffect(() => {
    loadRates();
  }, []);

  useEffect(() => {
    if (searchParams.get("new") !== "1") return;
    setPrefillProduct(null);
    setShowDialog(true);
    router.replace("/dashboard/hardware/rates", { scroll: false });
  }, [searchParams, router]);

  const loadRates = async () => {
    try {
      setLoading(true);
      const res = await materialRateAPI.current();
      setRates(res.data);
    } catch (error) {
      console.error("Failed to load rate board:", error);
      toast.error("Failed to load rate board");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (rate: MaterialRate) => {
    setDeleteDialog({
      isOpen: true,
      rate,
    });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.rate) return;

    try {
      await materialRateAPI.delete(deleteDialog.rate.id);
      toast.success("Rate entry removed");
      loadRates();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to remove rate entry");
    } finally {
      setDeleteDialog({ isOpen: false, rate: null });
    }
  };

  const handleCopyAsText = async () => {
    if (rates.length === 0) {
      toast.error("No rates on the board yet");
      return;
    }
    const lines = [
      `📋 Today's Rates — ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
      "",
      ...rates.map((r) => `${r.product_name}: ${formatNPR(Number(r.rate))} ${r.unit_display ? `/${r.unit_display}` : ""}`),
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      toast.success("Rate list copied — paste it into WhatsApp");
    } catch {
      toast.error("Couldn't copy to clipboard");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Daily Rate Board" subtitle="Today's prices for rod, cement, and other volatile materials" />
        <div className="flex-1 p-6 space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader
        title="Daily Rate Board"
        subtitle="Today's prices for rod, cement, and other volatile materials"
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleCopyAsText} className="gap-2">
              <Copy className="h-4 w-4" />
              Copy as text
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setPrefillProduct(null);
                setShowDialog(true);
              }}
              className="bg-[var(--color-accent-custom,#22C55E)] hover:bg-[#16A34A] gap-2"
            >
              <Plus className="h-4 w-4" />
              Update Rate
            </Button>
          </div>
        }
      />

      <div className="flex-1 p-6">
        {rates.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title="No rates on the board yet"
            description="Add materials whose prices change day to day — rod, cement, sand — and quote today's rate to contractors in one place."
            actionLabel="Update Rate"
            onAction={() => {
              setPrefillProduct(null);
              setShowDialog(true);
            }}
          />
        ) : (
          <div className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-muted/30 text-left text-xs text-gray-500 dark:text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Material</th>
                  <th className="px-5 py-3 font-medium">Today's Rate</th>
                  <th className="px-5 py-3 font-medium">Change</th>
                  <th className="px-5 py-3 font-medium">As of</th>
                  <th className="px-5 py-3 font-medium">Notes</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-border">
                {rates.map((rate) => (
                  <tr key={rate.id} className="hover:bg-gray-50/50 dark:hover:bg-muted/20">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900 dark:text-foreground">{rate.product_name}</p>
                      {rate.product_sku && (
                        <p className="text-xs text-gray-400 dark:text-muted-foreground">{rate.product_sku}</p>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-semibold text-gray-900 dark:text-foreground tabular-nums">
                        {formatNPR(Number(rate.rate))}
                      </span>
                      {rate.unit_display && (
                        <span className="text-xs text-gray-400 dark:text-muted-foreground"> /{rate.unit_display}</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <RateChangeBadge change={rate.change} />
                    </td>
                    <td className="px-5 py-3 text-gray-500 dark:text-muted-foreground">
                      {new Date(rate.effective_date).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-gray-500 dark:text-muted-foreground max-w-[200px] truncate">
                      {rate.notes || "—"}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setPrefillProduct(rate);
                            setShowDialog(true);
                          }}
                        >
                          Update
                        </Button>
                        <button
                          type="button"
                          onClick={() => handleDelete(rate)}
                          className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950 text-gray-400 hover:text-red-600 transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <UpdateRateDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        prefillProduct={prefillProduct}
        onSaved={loadRates}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.isOpen} onOpenChange={(open) => !open && setDeleteDialog({ isOpen: false, rate: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Rate Entry</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600 dark:text-muted-foreground">
              Are you sure you want to remove today's rate entry for{" "}
              <span className="font-semibold text-gray-900 dark:text-foreground">
                {deleteDialog.rate?.product_name}
              </span>
              ? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ isOpen: false, rate: null })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UpdateRateDialog({
  open,
  onOpenChange,
  prefillProduct,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefillProduct: MaterialRate | null;
  onSaved: () => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [rate, setRate] = useState("");
  const [unitLabel, setUnitLabel] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(todayISO());
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelectedProductId(prefillProduct ? String(prefillProduct.product) : "");
    setRate("");
    setUnitLabel(prefillProduct?.unit_label || "");
    setEffectiveDate(todayISO());
    setNotes("");
    setProductSearch("");

    setLoadingProducts(true);
    inventoryApi.products
      .list({ limit: 500, status: "active" })
      .then((res) => setProducts(res.data?.results || []))
      .catch(() => toast.error("Failed to load products"))
      .finally(() => setLoadingProducts(false));
  }, [open, prefillProduct]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-dropdown]")) setProductOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.sku || "").toLowerCase().includes(productSearch.toLowerCase())
  );
  const selectedProduct = products.find((p) => String(p.id) === selectedProductId);

  const handleSave = async () => {
    if (!selectedProductId) {
      toast.error("Select a material");
      return;
    }
    const rateValue = rate.trim();
    if (!rateValue || Number.isNaN(Number(rateValue)) || Number(rateValue) <= 0) {
      toast.error("Enter a valid rate");
      return;
    }

    setSaving(true);
    try {
      await materialRateAPI.create({
        product: Number(selectedProductId),
        rate: rateValue,
        unit_label: unitLabel.trim() || undefined,
        effective_date: effectiveDate,
        notes: notes.trim() || undefined,
      });
      toast.success("Rate updated");
      onOpenChange(false);
      onSaved();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || error.response?.data?.rate?.[0] || "Failed to save rate");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Today's Rate</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Material *</Label>
            <div className="relative" data-dropdown>
              <button
                type="button"
                onClick={() => setProductOpen(!productOpen)}
                disabled={loadingProducts || !!prefillProduct}
                className={cn(
                  "flex w-full items-center justify-between h-10 px-3 text-sm border rounded-md bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100",
                  !selectedProductId && "text-gray-500",
                  !!prefillProduct && "opacity-70 cursor-not-allowed"
                )}
              >
                <span className="truncate">
                  {loadingProducts ? "Loading..." : selectedProduct ? selectedProduct.name : "Select material"}
                </span>
                <ChevronDownIcon className="h-4 w-4 opacity-50 shrink-0" />
              </button>
              {productOpen && !prefillProduct && (
                <div className="absolute top-full left-0 right-0 mt-1 z-50 max-h-56 overflow-auto rounded-lg bg-white dark:bg-gray-900 shadow-lg border border-gray-200 dark:border-gray-700">
                  <div className="px-2 py-1.5 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900">
                    <Input
                      placeholder="Search products..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="h-8 text-sm"
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                  </div>
                  <div className="p-1">
                    {filteredProducts.length === 0 ? (
                      <div className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">No product found</div>
                    ) : (
                      filteredProducts.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedProductId(String(p.id));
                            setProductOpen(false);
                            setProductSearch("");
                          }}
                          className={cn(
                            "px-2 py-1.5 text-sm rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800",
                            selectedProductId === String(p.id) && "bg-gray-100 dark:bg-gray-800 font-medium"
                          )}
                        >
                          {p.name}
                          {p.sku && <span className="text-gray-400"> · {p.sku}</span>}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="rate-value">Rate (Rs.) *</Label>
              <Input
                id="rate-value"
                type="number"
                min="0"
                step="0.01"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="0.00"
                autoFocus={!!prefillProduct}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate-unit">Unit label</Label>
              <Input
                id="rate-unit"
                value={unitLabel}
                onChange={(e) => setUnitLabel(e.target.value)}
                placeholder={selectedProduct?.unit_name || "e.g. per kg"}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rate-date">Effective date</Label>
            <Input
              id="rate-date"
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rate-notes">Notes (optional)</Label>
            <Input
              id="rate-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Morning rate, subject to change"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-[var(--color-accent-custom,#22C55E)] hover:bg-[#16A34A] gap-2"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Saving..." : "Save Rate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
