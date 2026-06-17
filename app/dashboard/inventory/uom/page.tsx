"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, Ruler, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DashHeader } from "@/components/dashboard/dash-header";
import { EmptyState } from "@/components/shared/EmptyState";
import { SkeletonTable } from "@/components/shared/Skeleton";
import { useApi } from "@/lib/hooks/useApi";
import { inventoryApi } from "@/lib/api/inventory";
import toast from "react-hot-toast";

export default function UOMPage() {
  const [open, setOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<any>(null);
  const [formData, setFormData] = useState({ 
    name: "", 
    abbreviation: "", 
    type: "count" as "count" | "weight" | "length" | "volume" | "area"
  });
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [selectedUnits, setSelectedUnits] = useState<Set<number>>(new Set());

  const { data: units, loading, refetch } = useApi(
    () => inventoryApi.units.list({
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
      search: searchTerm || undefined,
    }),
    { 
      immediate: true,
      deps: [currentPage, searchTerm, pageSize]
    }
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUnits(new Set(unitList.map((u: any) => u.id)));
    } else {
      setSelectedUnits(new Set());
    }
  };

  const handleSelectUnit = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedUnits);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedUnits(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedUnits.size === 0) {
      toast.error("No units selected");
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
            <p className="font-semibold text-gray-900 text-base">Delete {selectedUnits.size} units?</p>
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
              for (const id of selectedUnits) {
                try {
                  await inventoryApi.units.delete(id);
                  deleted++;
                } catch (error) {
                  console.error(`Failed to delete unit ${id}:`, error);
                }
              }
              toast.success(`Deleted ${deleted} unit(s)`);
              setSelectedUnits(new Set());
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.abbreviation.trim()) {
      toast.error("Name and abbreviation are required");
      return;
    }

    setSubmitting(true);
    try {
      if (editingUnit) {
        await inventoryApi.units.update(editingUnit.id, formData);
        toast.success("Unit updated successfully");
      } else {
        await inventoryApi.units.create(formData);
        toast.success("Unit created successfully");
      }
      setOpen(false);
      setFormData({ name: "", abbreviation: "", type: "count" });
      setEditingUnit(null);
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save unit");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (unit: any) => {
    setEditingUnit(unit);
    setFormData({ 
      name: unit.name, 
      abbreviation: unit.abbreviation,
      type: unit.type 
    });
    setOpen(true);
  };

  const handleDelete = async (id: number, unitName: string) => {
    // Show custom confirmation toast in center of screen
    const confirmDelete = () => {
      toast.promise(
        inventoryApi.units.delete(id),
        {
          loading: 'Deleting unit...',
          success: () => {
            refetch();
            return 'Unit deleted successfully';
          },
          error: (err) => err.response?.data?.message || 'Failed to delete unit'
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
            <p className="font-semibold text-gray-900 text-base">Delete this unit?</p>
            <p className="text-sm text-gray-600 mt-1">"{unitName}" will be permanently deleted. This action cannot be undone.</p>
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

  const handleClose = () => {
    setOpen(false);
    setEditingUnit(null);
    setFormData({ name: "", abbreviation: "", type: "count" });
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Units of Measure" subtitle="Define measurement units for products" />
        <div className="flex-1 p-6">
          <SkeletonTable rows={5} />
        </div>
      </div>
    );
  }

  const unitList = units?.data?.results || [];
  const totalCount = units?.data?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  if (unitList.length === 0 && !searchTerm) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Units of Measure" subtitle="Define measurement units for products" />
        <div className="flex-1 p-6">
          <EmptyState
            icon={Ruler}
            title="No units yet"
            description="Create your first unit of measure to define how products are measured"
            actionLabel="Add Unit"
            onAction={() => setOpen(true)}
          />
        </div>
        <Dialog open={open} onOpenChange={handleClose}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Add Unit of Measure</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Name</Label>
                <Input 
                  className="h-9 text-sm border-gray-200" 
                  placeholder="e.g. Kilogram" 
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Abbreviation</Label>
                <Input 
                  className="h-9 text-sm border-gray-200" 
                  placeholder="e.g. Kg" 
                  value={formData.abbreviation}
                  onChange={(e) => setFormData(prev => ({ ...prev, abbreviation: e.target.value }))}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, type: v as any }))}
                >
                  <SelectTrigger className="h-9 text-sm border-gray-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="count">Count</SelectItem>
                    <SelectItem value="weight">Weight</SelectItem>
                    <SelectItem value="length">Length</SelectItem>
                    <SelectItem value="volume">Volume</SelectItem>
                    <SelectItem value="area">Area</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white"
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : "Save"}
                </Button>
                <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>Cancel</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Units of Measure" subtitle={`${totalCount} units`} />
      <div className="flex-1 p-6 space-y-4">
        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search units..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {selectedUnits.size > 0 && (
              <Button 
                size="sm" 
                variant="destructive"
                className="h-9 gap-1.5" 
                onClick={handleBulkDelete}
              >
                <Trash2 className="h-4 w-4" /> Delete ({selectedUnits.size})
              </Button>
            )}
            <Button size="sm" className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> Add Unit
            </Button>
          </div>
        </div>

        {/* Units Table */}
        {unitList.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12">
            <EmptyState
              icon={Ruler}
              title={searchTerm ? "No units found" : "No units yet"}
              description={searchTerm ? "Try adjusting your search" : "Create your first unit of measure"}
            />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left w-12">
                      <input
                        type="checkbox"
                        checked={selectedUnits.size === unitList.length && unitList.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                    </th>
                    {["Name", "Abbreviation", "Type", "Actions"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {unitList.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedUnits.has(u.id)}
                          onChange={(e) => handleSelectUnit(u.id, e.target.checked)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">{u.name}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-mono text-gray-600">
                          {u.abbreviation}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 capitalize">{u.type}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button 
                            onClick={() => handleEdit(u)}
                            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(u.id, u.name)}
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
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
                <div className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} units
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === page
                            ? "bg-[#22C55E] text-white"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <Dialog open={open} onOpenChange={handleClose}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{editingUnit ? "Edit Unit of Measure" : "Add Unit of Measure"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Name</Label>
                <Input 
                  className="h-9 text-sm border-gray-200" 
                  placeholder="e.g. Kilogram" 
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Abbreviation</Label>
                <Input 
                  className="h-9 text-sm border-gray-200" 
                  placeholder="e.g. Kg" 
                  value={formData.abbreviation}
                  onChange={(e) => setFormData(prev => ({ ...prev, abbreviation: e.target.value }))}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, type: v as any }))}
                >
                  <SelectTrigger className="h-9 text-sm border-gray-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="count">Count</SelectItem>
                    <SelectItem value="weight">Weight</SelectItem>
                    <SelectItem value="length">Length</SelectItem>
                    <SelectItem value="volume">Volume</SelectItem>
                    <SelectItem value="area">Area</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white"
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : "Save"}
                </Button>
                <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>Cancel</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
