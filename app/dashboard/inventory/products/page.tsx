"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Filter, Trash2, Edit2, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { DashHeader } from "@/components/dashboard/dash-header";
import { inventoryApi, Product } from "@/lib/api/inventory";
import { useApi } from "@/lib/hooks/useApi";
import { EmptyState } from "@/components/shared/EmptyState";
import { SkeletonTable } from "@/components/shared/Skeleton";
import toast from "react-hot-toast";

export default function ProductsListPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'single' | 'bulk';
    productId?: string;
    productName?: string;
  }>({
    isOpen: false,
    type: 'single',
  });

  // Fetch products
  const { data: productsData, loading: productsLoading, refetch } = useApi(
    () => inventoryApi.products.list({ 
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
      search: searchTerm || undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
    }),
    { immediate: true }
  );

  const products = productsData?.data?.results || [];
  const totalCount = productsData?.data?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(new Set(products.map((p: Product) => p.id)));
    } else {
      setSelectedProducts(new Set());
    }
  };

  const handleSelectProduct = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedProducts);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedProducts(newSelected);
  };

  const handleDeleteProduct = async (id: string, name?: string) => {
    setConfirmDialog({
      isOpen: true,
      type: 'single',
      productId: id,
      productName: name || 'this product',
    });
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) {
      toast.error("No products selected");
      return;
    }

    setConfirmDialog({
      isOpen: true,
      type: 'bulk',
    });
  };

  const confirmDelete = async () => {
    try {
      if (confirmDialog.type === 'single' && confirmDialog.productId) {
        await inventoryApi.products.delete(Number(confirmDialog.productId));
        toast.success("Product deleted successfully");
        refetch();
        setSelectedProducts(new Set());
      } else if (confirmDialog.type === 'bulk') {
        let deleted = 0;
        for (const id of selectedProducts) {
          try {
            await inventoryApi.products.delete(Number(id));
            deleted++;
          } catch (error) {
            console.error(`Failed to delete product ${id}:`, error);
          }
        }
        toast.success(`Deleted ${deleted} product(s)`);
        refetch();
        setSelectedProducts(new Set());
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      console.error('Error response:', error.response?.data);
      const errorMsg = error.response?.data?.detail || error.response?.data?.error || "Failed to delete product";
      toast.error(errorMsg);
    } finally {
      setConfirmDialog({ isOpen: false, type: 'single' });
    }
  };

  if (productsLoading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Products" subtitle="Manage your product inventory" />
        <div className="flex-1 p-6">
          <SkeletonTable rows={10} />
        </div>
      </div>
    );
  }

  if (products.length === 0 && !searchTerm && statusFilter === "all") {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Products" subtitle="Manage your product inventory" />
        <div className="flex-1 p-6">
          <EmptyState
            icon={Plus}
            title="No products yet"
            description="Get started by creating your first product."
            actionLabel="Create Product"
            actionHref="/dashboard/inventory/products/new"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Products" subtitle="Manage your product inventory" />
      <div className="flex-1 p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3 md:flex-row md:items-center flex-1">
            {/* Search */}
            <div className="relative flex-1 md:max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or SKU..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="discontinued">Discontinued</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {selectedProducts.size > 0 && (
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm"
              >
                <Trash2 className="h-4 w-4" />
                Delete ({selectedProducts.size})
              </button>
            )}
            <button
              onClick={() => router.push("/dashboard/inventory/products/new")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-green transition-colors flex items-center gap-2 text-sm"
            >
              <Plus className="h-4 w-4" />
              New Product
            </button>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedProducts.size === products.length && products.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Product Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Unit</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Cost Price</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Selling Price</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((product: Product) => {
                  const stock = product.total_stock ?? 0;
                  const isLowStock = stock > 0 && stock <= product.reorder_level;
                  const isOutOfStock = stock === 0;

                  return (
                    <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedProducts.has(product.id)}
                          onChange={(e) => handleSelectProduct(product.id, e.target.checked)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{product.sku}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
                      <td className="px-4 py-3 text-gray-600">{product.category_name || "-"}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{product.unit_name}</td>
                      <td className="px-4 py-3 text-right text-gray-600">₹{Number(product.cost_price).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-gray-600">₹{Number(product.selling_price).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-semibold ${
                          isOutOfStock ? "text-red-600" : 
                          isLowStock ? "text-orange-600" : 
                          "text-gray-900"
                        }`}>
                          {stock.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isOutOfStock ? "bg-red-100 text-red-700" :
                          isLowStock ? "bg-orange-100 text-orange-700" :
                          product.status === "active" ? "bg-green-100 text-green-700" :
                          product.status === "inactive" ? "bg-gray-100 text-gray-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {isOutOfStock ? "Out of Stock" : isLowStock ? "Low Stock" : product.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => router.push(`/dashboard/inventory/products/${product.id}`)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id, product.name)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} products
              </div>
              <div className="flex gap-2">
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
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        currentPage === page
                          ? "bg-blue-600 text-white"
                          : "border border-gray-300 hover:bg-gray-100"
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

        {/* Empty search result */}
        {products.length === 0 && (searchTerm || statusFilter !== "all") && (
          <div className="text-center py-12">
            <p className="text-gray-500">No products found matching your filters.</p>
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setCurrentPage(1);
              }}
              className="mt-4 text-blue-600 hover:underline text-sm"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Confirmation Dialog */}
        {confirmDialog.isOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {confirmDialog.type === 'single' ? 'Delete Product' : 'Delete Products'}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">
                    {confirmDialog.type === 'single'
                      ? `Are you sure you want to delete "${confirmDialog.productName}"? This action cannot be undone.`
                      : `Are you sure you want to delete ${selectedProducts.size} product(s)? This action cannot be undone.`}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex gap-3 justify-end">
                <button
                  onClick={() => setConfirmDialog({ isOpen: false, type: 'single' })}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
