"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, ChevronDownIcon, Plus } from "@/lib/icons/lucide-react-shim";
import { inventoryApi, type Category, type UnitOfMeasure, type Product } from "@/lib/api/inventory";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface POSQuickAddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouseId: string;
  /** Called with the newly-created product so the caller can drop it into the product grid and cart. */
  onProductCreated: (product: Product) => void;
}

const emptyForm = {
  name: "",
  sku: "",
  category: "",
  unit: "",
  selling_price: "",
  opening_stock: "",
};

const dropdownButtonClass =
  "flex w-full items-center justify-between h-10 px-3 text-sm border rounded-md bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100";
const dropdownPanelClass =
  "absolute top-full left-0 right-0 mt-1 z-50 max-h-56 overflow-auto rounded-lg bg-white dark:bg-gray-900 shadow-lg border border-gray-200 dark:border-gray-700";

export function POSQuickAddProductDialog({
  open,
  onOpenChange,
  warehouseId,
  onProductCreated,
}: POSQuickAddProductDialogProps) {
  const [form, setForm] = useState(emptyForm);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<UnitOfMeasure[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [saving, setSaving] = useState(false);

  // Searchable unit/category dropdowns — same pattern as the full product form.
  const [unitOpen, setUnitOpen] = useState(false);
  const [unitSearch, setUnitSearch] = useState("");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");

  // "+ Add new" sub-dialogs
  const [showUnitDialog, setShowUnitDialog] = useState(false);
  const [creatingUnit, setCreatingUnit] = useState(false);
  const [unitForm, setUnitForm] = useState({ name: "", abbreviation: "", type: "count" as UnitOfMeasure["type"] });

  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: "", parent: "" });

  const filteredUnits = units.filter(
    (u) =>
      u.name.toLowerCase().includes(unitSearch.toLowerCase()) ||
      u.abbreviation.toLowerCase().includes(unitSearch.toLowerCase())
  );
  const filteredCategories = categories.filter((c) => c.name.toLowerCase().includes(categorySearch.toLowerCase()));

  const selectedUnit = units.find((u) => String(u.id) === form.unit);
  const selectedCategory = categories.find((c) => String(c.id) === form.category);

  useEffect(() => {
    if (!open) return;
    setForm(emptyForm);
    loadOptions();
  }, [open]);

  // Close dropdowns when clicking outside — same pattern as the full product form.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-dropdown]")) {
        setUnitOpen(false);
        setCategoryOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadOptions = () => {
    setLoadingOptions(true);
    Promise.all([
      inventoryApi.categories.list({ limit: 200 }),
      inventoryApi.units.list({ limit: 200 }),
    ])
      .then(([categoriesRes, unitsRes]) => {
        const categoryList = categoriesRes.data?.results || [];
        const unitList = unitsRes.data?.results || [];
        setCategories(categoryList);
        setUnits(unitList);
        // Default to the only unit when there's just one, so the common case needs no extra click.
        if (unitList.length === 1) {
          setForm((prev) => ({ ...prev, unit: String(unitList[0].id) }));
        }
      })
      .catch(() => toast.error("Failed to load categories/units"))
      .finally(() => setLoadingOptions(false));
  };

  const handleCreateUnit = async () => {
    if (!unitForm.name.trim() || !unitForm.abbreviation.trim()) {
      toast.error("Unit name and abbreviation are required");
      return;
    }
    setCreatingUnit(true);
    try {
      const created = await inventoryApi.units.create({
        ...unitForm,
        name: unitForm.name.trim(),
        abbreviation: unitForm.abbreviation.trim(),
      });
      toast.success("Unit created");
      setUnits((prev) => [...prev, created.data]);
      setForm((prev) => ({ ...prev, unit: String(created.data.id) }));
      setShowUnitDialog(false);
      setUnitForm({ name: "", abbreviation: "", type: "count" });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create unit");
    } finally {
      setCreatingUnit(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast.error("Category name is required");
      return;
    }
    setCreatingCategory(true);
    try {
      const submitData: any = { name: categoryForm.name.trim() };
      if (categoryForm.parent) submitData.parent = parseInt(categoryForm.parent);

      const created = await inventoryApi.categories.create(submitData);
      toast.success("Category created");
      setCategories((prev) => [...prev, created.data]);
      setForm((prev) => ({ ...prev, category: String(created.data.id) }));
      setShowCategoryDialog(false);
      setCategoryForm({ name: "", parent: "" });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create category");
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleSave = async () => {
    const name = form.name.trim();
    if (!name) {
      toast.error("Product name is required");
      return;
    }
    if (!form.unit) {
      toast.error("Select a unit of measure");
      return;
    }
    const sellingPrice = form.selling_price.trim();
    if (!sellingPrice || Number.isNaN(Number(sellingPrice)) || Number(sellingPrice) < 0) {
      toast.error("Enter a valid selling price");
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name,
        unit: form.unit,
        selling_price: sellingPrice,
        status: "active",
      };
      if (form.sku.trim()) payload.sku = form.sku.trim();
      if (form.category) payload.category = form.category;
      if (form.opening_stock.trim() && Number(form.opening_stock) > 0) {
        payload.opening_stock = form.opening_stock.trim();
        if (warehouseId) payload.warehouse = warehouseId;
      }

      const response = await inventoryApi.products.create(payload as Partial<Product>);
      toast.success(`${name} added`);
      onProductCreated(response.data);
      onOpenChange(false);
    } catch (error: any) {
      const data = error.response?.data;
      const message =
        data?.detail ||
        data?.name?.[0] ||
        data?.sku?.[0] ||
        data?.unit?.[0] ||
        data?.selling_price?.[0] ||
        "Failed to add product";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-[var(--color-accent-custom,#22C55E)]" />
              Quick Add Product
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="qa-name">Product Name *</Label>
              <Input
                id="qa-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Coca Cola 500ml"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="qa-price">Selling Price *</Label>
                <Input
                  id="qa-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.selling_price}
                  onChange={(e) => setForm({ ...form, selling_price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qa-stock">Opening Stock</Label>
                <Input
                  id="qa-stock"
                  type="number"
                  min="0"
                  value={form.opening_stock}
                  onChange={(e) => setForm({ ...form, opening_stock: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="qa-sku">SKU (optional)</Label>
              <Input
                id="qa-sku"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                placeholder="Leave blank to auto-generate"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Unit — searchable dropdown + quick "add new" */}
              <div className="space-y-2">
                <Label>Unit *</Label>
                <div className="flex gap-1.5">
                  <div className="flex-1 relative" data-dropdown>
                    <button
                      type="button"
                      onClick={() => setUnitOpen(!unitOpen)}
                      disabled={loadingOptions}
                      className={cn(dropdownButtonClass, !form.unit && "text-gray-500")}
                    >
                      <span className="truncate">
                        {loadingOptions
                          ? "Loading..."
                          : selectedUnit
                            ? `${selectedUnit.name} (${selectedUnit.abbreviation})`
                            : "Select unit"}
                      </span>
                      <ChevronDownIcon className="h-4 w-4 opacity-50 shrink-0" />
                    </button>
                    {unitOpen && (
                      <div className={dropdownPanelClass}>
                        <div className="px-2 py-1.5 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900">
                          <Input
                            placeholder="Search units..."
                            value={unitSearch}
                            onChange={(e) => setUnitSearch(e.target.value)}
                            className="h-8 text-sm"
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                          />
                        </div>
                        <div className="p-1">
                          {filteredUnits.length === 0 ? (
                            <div className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">No unit found</div>
                          ) : (
                            filteredUnits.map((unit) => (
                              <div
                                key={unit.id}
                                onClick={() => {
                                  setForm((prev) => ({ ...prev, unit: String(unit.id) }));
                                  setUnitOpen(false);
                                  setUnitSearch("");
                                }}
                                className={cn(
                                  "px-2 py-1.5 text-sm rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800",
                                  form.unit === String(unit.id) && "bg-gray-100 dark:bg-gray-800 font-medium"
                                )}
                              >
                                {unit.name} ({unit.abbreviation})
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 shrink-0 border-gray-200 dark:border-gray-700 hover:border-[var(--color-accent-custom,#22C55E)] hover:text-[var(--color-accent-custom,#22C55E)]"
                    onClick={() => setShowUnitDialog(true)}
                    title="Add new unit"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Category — searchable dropdown + quick "add new" */}
              <div className="space-y-2">
                <Label>Category</Label>
                <div className="flex gap-1.5">
                  <div className="flex-1 relative" data-dropdown>
                    <button
                      type="button"
                      onClick={() => setCategoryOpen(!categoryOpen)}
                      disabled={loadingOptions}
                      className={cn(dropdownButtonClass, !form.category && "text-gray-500")}
                    >
                      <span className="truncate">
                        {loadingOptions ? "Loading..." : selectedCategory ? selectedCategory.name : "None"}
                      </span>
                      <ChevronDownIcon className="h-4 w-4 opacity-50 shrink-0" />
                    </button>
                    {categoryOpen && (
                      <div className={dropdownPanelClass}>
                        <div className="px-2 py-1.5 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900">
                          <Input
                            placeholder="Search categories..."
                            value={categorySearch}
                            onChange={(e) => setCategorySearch(e.target.value)}
                            className="h-8 text-sm"
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                          />
                        </div>
                        <div className="p-1">
                          {form.category && (
                            <div
                              onClick={() => {
                                setForm((prev) => ({ ...prev, category: "" }));
                                setCategoryOpen(false);
                                setCategorySearch("");
                              }}
                              className="px-2 py-1.5 text-sm rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
                            >
                              None
                            </div>
                          )}
                          {filteredCategories.length === 0 ? (
                            <div className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">No category found</div>
                          ) : (
                            filteredCategories.map((category) => (
                              <div
                                key={category.id}
                                onClick={() => {
                                  setForm((prev) => ({ ...prev, category: String(category.id) }));
                                  setCategoryOpen(false);
                                  setCategorySearch("");
                                }}
                                className={cn(
                                  "px-2 py-1.5 text-sm rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800",
                                  form.category === String(category.id) && "bg-gray-100 dark:bg-gray-800 font-medium"
                                )}
                              >
                                {category.name}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 shrink-0 border-gray-200 dark:border-gray-700 hover:border-[var(--color-accent-custom,#22C55E)] hover:text-[var(--color-accent-custom,#22C55E)]"
                    onClick={() => setShowCategoryDialog(true)}
                    title="Add new category"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Need more fields like tax, description, or an image? Use the full product form from Inventory instead.
            </p>
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
              loadingText="Adding..."
              className="bg-[var(--color-accent-custom,#22C55E)] hover:bg-[var(--color-accent-custom-600,#16A34A)] gap-2"
            >
              Add & Add to Cart
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add New Unit */}
      <Dialog open={showUnitDialog} onOpenChange={setShowUnitDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add New Unit of Measure</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={unitForm.name}
                onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })}
                placeholder="e.g. Kilogram"
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                Abbreviation <span className="text-red-500">*</span>
              </Label>
              <Input
                value={unitForm.abbreviation}
                onChange={(e) => setUnitForm({ ...unitForm, abbreviation: e.target.value })}
                placeholder="e.g. Kg"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={unitForm.type} onValueChange={(v) => setUnitForm({ ...unitForm, type: v as any })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="count">Count</SelectItem>
                  <SelectItem value="weight">Weight</SelectItem>
                  <SelectItem value="length">Length</SelectItem>
                  <SelectItem value="volume">Volume</SelectItem>
                  <SelectItem value="area">Area</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowUnitDialog(false)} disabled={creatingUnit}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateUnit}
              disabled={creatingUnit}
              className="bg-[var(--color-accent-custom,#22C55E)] hover:bg-[var(--color-accent-custom-600,#16A34A)] text-white"
            >
              {creatingUnit ? "Creating..." : "Create Unit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add New Category */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>
                Category Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="e.g. Beverages"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Parent Category</Label>
              <Select
                value={categoryForm.parent || "none"}
                onValueChange={(v) => setCategoryForm({ ...categoryForm, parent: v && v !== "none" ? v : "" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Root Category)</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.parent_name ? `${cat.parent_name} > ${cat.name}` : cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowCategoryDialog(false)} disabled={creatingCategory}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateCategory}
              disabled={creatingCategory}
              className="bg-[var(--color-accent-custom,#22C55E)] hover:bg-[var(--color-accent-custom-600,#16A34A)] text-white"
            >
              {creatingCategory ? "Creating..." : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
