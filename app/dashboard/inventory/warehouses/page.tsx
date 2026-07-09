"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashHeader } from "@/components/dashboard/dash-header";
import { EmptyState } from "@/components/shared/EmptyState";
import { SkeletonTable } from "@/components/shared/Skeleton";
import { Pagination } from "@/components/shared/Pagination";
import { useApi } from "@/lib/hooks/useApi";
import { inventoryApi } from "@/lib/api/inventory";
import { getEmployees } from "@/lib/api/hr";
import toast from "react-hot-toast";

const ITEMS_PER_PAGE = 20;

export default function WarehousesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: "", location: "", manager: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedWarehouses, setSelectedWarehouses] = useState<Set<number>>(new Set());
  const [employees, setEmployees] = useState<any[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  const { data: warehousesData, loading, refetch } = useApi(
    () => inventoryApi.warehouses.list(),
    { immediate: true }
  );

  const warehouses = warehousesData?.data?.results || [];

  // Fetch employees when dialog opens
  useEffect(() => {
    if (open) {
      fetchEmployees();
    }
  }, [open]);

  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const response = await getEmployees();
      // Filter only employees who have a linked user account
      const allEmployees = response.results || [];
      const employeesWithUsers = allEmployees.filter((emp: any) => emp.user);
      setEmployees(employeesWithUsers);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
      toast.error("Failed to load employees");
    } finally {
      setLoadingEmployees(false);
    }
  };

  // Filter and paginate
  const filteredWarehouses = useMemo(() => {
    return warehouses.filter((w: any) =>
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.manager_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [warehouses, searchQuery]);

  const totalPages = Math.ceil(filteredWarehouses.length / ITEMS_PER_PAGE);
  const paginatedWarehouses = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredWarehouses.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredWarehouses, currentPage]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedWarehouses(new Set(paginatedWarehouses.map((w: any) => w.id)));
    } else {
      setSelectedWarehouses(new Set());
    }
  };

  const handleSelectWarehouse = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedWarehouses);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedWarehouses(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedWarehouses.size === 0) {
      toast.error("No warehouses selected");
      return;
    }

    toast((t) => (
      <div className="flex flex-col gap-4 min-w-[320px] p-2">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-base">Delete {selectedWarehouses.size} warehouses?</p>
            <p className="text-sm text-gray-600 mt-1">This action cannot be undone.</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              let deleted = 0;
              for (const id of selectedWarehouses) {
                try {
                  await inventoryApi.warehouses.delete(id);
                  deleted++;
                } catch (error) {
                  console.error(`Failed to delete warehouse ${id}:`, error);
                }
              }
              toast.success(`Deleted ${deleted} warehouse(s)`);
              setSelectedWarehouses(new Set());
              refetch();
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    ), {
      duration: Infinity,
      position: 'top-center',
      style: {
        marginTop: '40vh',
        background: 'white',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        borderRadius: '12px',
        padding: '16px',
      },
    });
  };

  const calculateTotalValue = (warehouse: any) => {
    if (warehouse.total_value != null) {
      return Number(warehouse.total_value);
    }
    return warehouse.stocks?.reduce((total: number, stock: any) => {
      return total + (stock.quantity * (stock.product?.cost_price || 0));
    }, 0) || 0;
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ name: "", location: "", manager: "" });
    setOpen(true);
  };

  useEffect(() => {
    if (searchParams.get("new") !== "1") return;
    setEditingId(null);
    setFormData({ name: "", location: "", manager: "" });
    setOpen(true);
    router.replace("/dashboard/inventory/warehouses", { scroll: false });
  }, [searchParams, router]);

  const handleOpenEdit = (warehouse: any) => {
    setEditingId(warehouse.id);
    setFormData({
      name: warehouse.name,
      location: warehouse.location,
      manager: warehouse.manager ? String(warehouse.manager) : "",
    });
    setOpen(true);
  };

  const handleDelete = async (id: number, warehouseName: string) => {
    // Show custom confirmation toast in center of screen
    const confirmDelete = () => {
      toast.promise(
        inventoryApi.warehouses.delete(id),
        {
          loading: 'Deleting warehouse...',
          success: () => {
            refetch();
            return 'Warehouse deleted successfully';
          },
          error: (err) => err.response?.data?.message || 'Failed to delete warehouse'
        }
      );
    };

    // Show custom confirmation toast in center of screen
    toast((t) => (
      <div className="flex flex-col gap-4 min-w-[320px] p-2">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-base">Delete this warehouse?</p>
            <p className="text-sm text-gray-600 mt-1">"{warehouseName}" will be permanently deleted. This action cannot be undone.</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              confirmDelete();
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    ), {
      duration: Infinity,
      position: 'top-center',
      style: {
        marginTop: '40vh',
        background: 'white',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        borderRadius: '12px',
        padding: '16px',
      },
    });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.location.trim()) {
      toast.error("Name and location are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const data = {
        name: formData.name,
        location: formData.location,
        manager: formData.manager && formData.manager !== "" ? parseInt(formData.manager) : null,
      };

      if (editingId) {
        await inventoryApi.warehouses.update(editingId, data);
        toast.success("Warehouse updated successfully");
      } else {
        await inventoryApi.warehouses.create(data);
        toast.success("Warehouse created successfully");
      }

      setFormData({ name: "", location: "", manager: "" });
      setEditingId(null);
      setOpen(false);
      refetch();
    } catch (error: any) {
      console.error("Warehouse save error:", error);
      toast.error(error.response?.data?.message || "Failed to save warehouse");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setEditingId(null);
    setFormData({ name: "", location: "", manager: "" });
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Warehouses" subtitle="Manage storage locations" />
        <div className="flex-1 p-6">
          <SkeletonTable rows={5} />
        </div>
      </div>
    );
  }

  if (filteredWarehouses.length === 0 && !searchQuery) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Warehouses" subtitle="Manage storage locations" />
        <div className="flex-1 p-6">
          <EmptyState
            icon={Plus}
            title="No warehouses yet"
            description="Create your first warehouse to manage storage locations"
            actionLabel="Add Warehouse"
            onAction={handleOpenCreate}
          />
        </div>
        <Dialog open={open} onOpenChange={handleClose}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Warehouse" : "Add Warehouse"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Warehouse Name</Label>
                <Input
                  className="h-9 text-sm border-gray-200"
                  placeholder="e.g. South Branch"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Location</Label>
                <Input
                  className="h-9 text-sm border-gray-200"
                  placeholder="City, Province"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Manager (Optional)</Label>
                <Select
                  value={formData.manager || ""}
                  onValueChange={(value) => setFormData({ ...formData, manager: value || "" })}
                  disabled={loadingEmployees}
                >
                  <SelectTrigger className="h-9 text-sm border-gray-200">
                    <SelectValue placeholder={loadingEmployees ? "Loading employees..." : "Select manager"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.user ? String(emp.user) : ""}>
                        {emp.name} - {emp.designation}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save"}
                </Button>
                <Button variant="outline" className="flex-1" onClick={handleClose} disabled={isSubmitting}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Warehouses" subtitle={`${filteredWarehouses.length} warehouses`} />
      <div className="flex-1 p-6 space-y-4">
        <div className="flex gap-3 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search warehouses..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 h-9 text-sm border-gray-200"
            />
          </div>
          <div className="flex gap-2">
            {selectedWarehouses.size > 0 && (
              <Button 
                size="sm" 
                variant="destructive"
                className="h-9 gap-1.5" 
                onClick={handleBulkDelete}
              >
                <Trash2 className="h-4 w-4" /> Delete ({selectedWarehouses.size})
              </Button>
            )}
            <Button size="sm" className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5" onClick={handleOpenCreate}>
              <Plus className="h-4 w-4" /> Add Warehouse
            </Button>
          </div>
        </div>

        {filteredWarehouses.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
            <Plus className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No warehouses found matching "{searchQuery}"</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left w-12">
                    <input
                      type="checkbox"
                      checked={selectedWarehouses.size === paginatedWarehouses.length && paginatedWarehouses.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                  </th>
                  {["Warehouse Name", "Location", "Products", "Total Value", "Manager", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedWarehouses.map((w: any) => (
                  <tr key={w.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedWarehouses.has(w.id)}
                        onChange={(e) => handleSelectWarehouse(w.id, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{w.name}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{w.location}</td>
                    <td className="px-4 py-3 text-gray-600">{w.total_products || 0}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">Rs. {Math.round(calculateTotalValue(w)).toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{w.manager_name || "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button 
                          onClick={() => handleOpenEdit(w)}
                          className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(w.id, w.name)}
                          className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredWarehouses.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

        <Dialog open={open} onOpenChange={handleClose}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Warehouse" : "Add Warehouse"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Warehouse Name</Label>
                <Input
                  className="h-9 text-sm border-gray-200"
                  placeholder="e.g. South Branch"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Location</Label>
                <Input
                  className="h-9 text-sm border-gray-200"
                  placeholder="City, Province"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Manager (Optional)</Label>
                <Select
                  value={formData.manager || ""}
                  onValueChange={(value) => setFormData({ ...formData, manager: value || "" })}
                  disabled={loadingEmployees}
                >
                  <SelectTrigger className="h-9 text-sm border-gray-200">
                    <SelectValue placeholder={loadingEmployees ? "Loading employees..." : "Select manager"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.user ? String(emp.user) : ""}>
                        {emp.name} - {emp.designation}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save"}
                </Button>
                <Button variant="outline" className="flex-1" onClick={handleClose} disabled={isSubmitting}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}




