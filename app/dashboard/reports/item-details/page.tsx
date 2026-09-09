"use client";

import { useState, useEffect, useCallback } from "react";
import { ReportsPageShell, reportsCardClass, reportsTableWrapClass } from "@/components/reports/ReportsPageShell";
import { SummaryCards } from "@/components/reports/SummaryCards";
import { ExportButtons } from "@/components/reports/ExportButtons";
import { formatNPR } from "@/lib/utils";
import apiClient from "@/lib/api/client";
import toast from "react-hot-toast";
import type { ExportTableData } from "@/lib/utils/export";
import { PrintableReport } from "@/components/reports/PrintableReport";

interface Product {
  id: number;
  name: string;
  sku: string;
  unit_name: string;
  total_stock: number;
  reorder_level: number;
  cost_price: number;
  selling_price: number;
  status: string;
  category_name?: string;
}

interface ProductsResponse {
  count: number;
  results: Product[];
}

export default function ItemDetailsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    category: "all",
  });
  const [categories, setCategories] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<ProductsResponse>("/api/inventory/reports/valuation/");
      const allProducts = response.data.results || [];
      setProducts(allProducts);

      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set(allProducts.map((p) => p.category_name).filter(Boolean))
      ) as string[];
      setCategories(uniqueCategories);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { detail?: string } } };
      console.error("Failed to fetch items:", err);
      setError("Unable to load items - feature currently unavailable");
      toast.error("Unable to load items");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      product.sku.toLowerCase().includes(filters.search.toLowerCase());
    const matchesStatus = filters.status === "all" || product.status === filters.status;
    const matchesCategory =
      filters.category === "all" || product.category_name === filters.category;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const stats = [
    {
      label: "Total Items",
      value: String(filteredProducts.length),
    },
    {
      label: "Total Stock Value",
      value: formatNPR(
        filteredProducts.reduce((sum, p) => sum + p.total_stock * p.cost_price, 0)
      ),
    },
    {
      label: "Low Stock Items",
      value: String(
        filteredProducts.filter((p) => p.total_stock <= p.reorder_level).length
      ),
    },
    {
      label: "Avg Stock Level",
      value: filteredProducts.length > 0
        ? String(
            Math.round(
              filteredProducts.reduce((sum, p) => sum + p.total_stock, 0) /
                filteredProducts.length
            )
          )
        : "0",
    },
  ];

  const getExportData = useCallback((): ExportTableData | null => {
    if (!filteredProducts.length) return null;
    return {
      filename: "item-details",
      title: "Item Details Report",
      headers: ["SKU", "Name", "Category", "Unit", "Stock", "Reorder Lvl", "Cost", "Selling Price", "Stock Value"],
      rows: filteredProducts.map((product) => [
        product.sku,
        product.name,
        product.category_name || "-",
        product.unit_name,
        String(product.total_stock),
        String(product.reorder_level),
        formatNPR(product.cost_price),
        formatNPR(product.selling_price),
        formatNPR(product.total_stock * product.cost_price),
      ]),
    };
  }, [filteredProducts]);

  return (
    <ReportsPageShell
      title="Item Details"
      subtitle="Stock levels and product information"
      loading={loading && !products.length}
      error={error}
      onRetry={() => void fetchData()}
      toolbar={
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
          {categories.length > 0 && (
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      }
      action={<ExportButtons getExportData={getExportData} disabled={loading} />}
    >
      {!products.length ? (
        <div className={`${reportsCardClass} p-12 text-center text-gray-500`}>
          No items found
        </div>
      ) : (
        <>
          <SummaryCards cards={stats} />

          <div className={reportsTableWrapClass}>
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">
                Items ({filteredProducts.length})
              </h3>
            </div>
            {filteredProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {["SKU", "Name", "Category", "Unit", "Stock", "Reorder Lvl", "Status", "Unit Cost", "Selling Price", "Stock Value"].map(
                        (h) => (
                          <th
                            key={h}
                            className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredProducts.map((product) => {
                      const isLowStock = product.total_stock <= product.reorder_level;
                      return (
                        <tr key={product.id} className="hover:bg-gray-50/50">
                          <td className="px-6 py-3 font-medium text-blue-600">{product.sku}</td>
                          <td className="px-6 py-3 font-medium text-gray-900">{product.name}</td>
                          <td className="px-6 py-3 text-gray-600 text-xs">
                            {product.category_name || "-"}
                          </td>
                          <td className="px-6 py-3 text-gray-600">{product.unit_name}</td>
                          <td
                            className={`px-6 py-3 font-medium ${
                              isLowStock ? "text-red-600" : "text-gray-900"
                            }`}
                          >
                            {product.total_stock}
                          </td>
                          <td className="px-6 py-3 text-gray-600">{product.reorder_level}</td>
                          <td className="px-6 py-3">
                            <span
                              className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                isLowStock
                                  ? "bg-red-50 text-red-700"
                                  : product.status === "active"
                                    ? "bg-slate-50 text-slate-700"
                                    : "bg-gray-50 text-gray-700"
                              }`}
                            >
                              {isLowStock ? "Low Stock" : product.status}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-gray-600">
                            {formatNPR(product.cost_price)}
                          </td>
                          <td className="px-6 py-3 text-gray-600">
                            {formatNPR(product.selling_price)}
                          </td>
                          <td className="px-6 py-3 font-medium">
                            {formatNPR(product.total_stock * product.cost_price)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-12 text-center text-gray-500">No items match your filters</div>
            )}
          </div>

          <PrintableReport reportTitle="Item Details Report">
            <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "12px", color: "#000" }}>
              Summary
            </h3>
            <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #d1d5db", marginBottom: "20px" }}>
              <tbody>
                <tr style={{ borderBottom: "1px solid #d1d5db" }}>
                  <td style={{ padding: "8px", fontWeight: "600", color: "#000" }}>Total Items</td>
                  <td style={{ padding: "8px", textAlign: "right", color: "#000" }}>{filteredProducts.length}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #d1d5db" }}>
                  <td style={{ padding: "8px", fontWeight: "600", color: "#000" }}>Total Stock Value</td>
                  <td style={{ padding: "8px", textAlign: "right", color: "#000" }}>
                    {formatNPR(
                      filteredProducts.reduce((sum, p) => sum + p.total_stock * p.cost_price, 0)
                    )}
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid #d1d5db" }}>
                  <td style={{ padding: "8px", fontWeight: "600", color: "#000" }}>Low Stock Items</td>
                  <td style={{ padding: "8px", textAlign: "right", color: "#000" }}>
                    {filteredProducts.filter((p) => p.total_stock <= p.reorder_level).length}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "8px", fontWeight: "600", color: "#000" }}>Avg Stock Level</td>
                  <td style={{ padding: "8px", textAlign: "right", color: "#000" }}>
                    {filteredProducts.length > 0
                      ? Math.round(
                          filteredProducts.reduce((sum, p) => sum + p.total_stock, 0) /
                            filteredProducts.length
                        )
                      : 0}
                  </td>
                </tr>
              </tbody>
            </table>

            <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "12px", color: "#000" }}>
              Items
            </h3>
            <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #d1d5db" }}>
              <thead style={{ backgroundColor: "#f3f4f6" }}>
                <tr>
                  {["SKU", "Name", "Category", "Unit", "Stock", "Reorder Lvl", "Status", "Unit Cost", "Selling Price", "Stock Value"].map(
                    (h) => (
                      <th
                        key={h}
                        style={{ padding: "8px", textAlign: "left", fontWeight: "600", borderBottom: "1px solid #d1d5db", color: "#000" }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} style={{ borderBottom: "1px solid #d1d5db" }}>
                    <td style={{ padding: "8px", color: "#000" }}>{product.sku}</td>
                    <td style={{ padding: "8px", color: "#000" }}>{product.name}</td>
                    <td style={{ padding: "8px", color: "#000" }}>{product.category_name || "-"}</td>
                    <td style={{ padding: "8px", color: "#000" }}>{product.unit_name}</td>
                    <td style={{ padding: "8px", textAlign: "right", color: "#000" }}>{product.total_stock}</td>
                    <td style={{ padding: "8px", textAlign: "right", color: "#000" }}>{product.reorder_level}</td>
                    <td style={{ padding: "8px", color: "#000" }}>
                      {product.total_stock <= product.reorder_level ? "Low Stock" : product.status}
                    </td>
                    <td style={{ padding: "8px", textAlign: "right", color: "#000" }}>
                      {formatNPR(product.cost_price)}
                    </td>
                    <td style={{ padding: "8px", textAlign: "right", color: "#000" }}>
                      {formatNPR(product.selling_price)}
                    </td>
                    <td style={{ padding: "8px", textAlign: "right", color: "#000" }}>
                      {formatNPR(product.total_stock * product.cost_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </PrintableReport>
        </>
      )}
    </ReportsPageShell>
  );
}
