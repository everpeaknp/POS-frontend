"use client";

import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package, TrendingUp } from "lucide-react";
import { DashHeader } from "@/components/dashboard/dash-header";
import { Button } from "@/components/ui/button";
import ProductForm from "@/components/inventory/ProductForm";
import { useApi } from "@/lib/hooks/useApi";
import { inventoryApi } from "@/lib/api/inventory";
import { Skeleton } from "@/components/shared/Skeleton";
import { FormattedDate } from "@/components/shared/FormattedDate";

function movementLabel(type: string) {
  switch (type) {
    case "in": return "Stock In";
    case "out": return "Stock Out";
    case "transfer": return "Transfer";
    case "adjustment": return "Adjustment";
    default: return type;
  }
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = Number(params.id);

  const { data: product, loading, error } = useApi(
    () => inventoryApi.products.get(productId).then(res => res.data),
    { immediate: true, deps: [productId] }
  );

  const { data: activity, loading: activityLoading } = useApi(
    () => inventoryApi.products.activity(productId).then(res => res.data),
    { immediate: true }
  );

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader 
          title="Edit Product" 
          subtitle="Update product information"
        />
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-10 w-32 mb-6" />
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <div className="space-y-6">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!loading && (error || !product)) {
    const isNotFound = (error as { message?: string })?.message?.toLowerCase().includes('not found');
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader 
          title="Edit Product" 
          subtitle="Update product information"
        />
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm text-center">
              <p className="text-gray-600">
                {isNotFound ? "Product not found" : "Failed to load product"}
              </p>
              <button
                onClick={() => router.push("/dashboard/inventory/products")}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Back to Products
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader 
        title="Edit Product" 
        subtitle={`Update ${product.name}`}
      />

      <div className="flex-1 p-6">
        <div className="mx-auto w-full">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/dashboard/inventory/products")}
            className="mb-6 -ml-2 gap-1.5 text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Button>

          {/* Stock & activity overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Total stock</p>
              <p className="text-2xl font-semibold text-gray-900">{product.total_stock ?? 0}</p>
              {product.stock_by_warehouse && product.stock_by_warehouse.length > 0 && (
                <div className="mt-3 space-y-1">
                  {product.stock_by_warehouse.map((row) => (
                    <div key={row.warehouse_id} className="flex justify-between text-sm text-gray-600">
                      <span>{row.warehouse_name}</span>
                      <span className="font-medium">{row.quantity}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm lg:col-span-2">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent stock movements</h3>
              {activityLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : activity?.movements?.length ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {activity.movements.slice(0, 8).map((mov) => (
                    <div key={mov.id} className="flex items-center justify-between text-sm border-b border-gray-50 pb-2">
                      <div>
                        <span className="font-medium text-gray-800">{movementLabel(mov.movement_type)}</span>
                        <span className="text-gray-500 ml-2">{mov.warehouse_name}</span>
                        {mov.reference_type && (
                          <span className="text-gray-400 ml-2">{mov.reference_type}</span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-medium">{mov.quantity}</span>
                        <p className="text-xs text-gray-400">
                          <FormattedDate value={mov.created_at} />
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No stock movements yet.</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Package className="h-4 w-4 text-[#22C55E]" />
                <h3 className="text-sm font-semibold text-gray-900">Purchase orders</h3>
              </div>
              {activityLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : activity?.purchase_orders?.length ? (
                <div className="space-y-2">
                  {activity.purchase_orders.map((po) => (
                    <Link
                      key={po.id}
                      href={`/dashboard/purchase/orders/${po.id}`}
                      className="flex items-center justify-between text-sm rounded-lg px-2 py-2 hover:bg-gray-50"
                    >
                      <div>
                        <p className="font-medium text-gray-800">{po.po_number}</p>
                        <p className="text-xs text-gray-500"><FormattedDate value={po.date} /></p>
                      </div>
                      <div className="text-right text-xs text-gray-600">
                        <p>{po.received_quantity} / {po.quantity} received</p>
                        <p className="text-gray-400">{po.status}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No linked purchase orders.</p>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-900">Sales orders</h3>
              </div>
              {activityLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : activity?.sales_orders?.length ? (
                <div className="space-y-2">
                  {activity.sales_orders.map((so) => (
                    <Link
                      key={so.id}
                      href={`/dashboard/sales/orders/${so.id}`}
                      className="flex items-center justify-between text-sm rounded-lg px-2 py-2 hover:bg-gray-50"
                    >
                      <div>
                        <p className="font-medium text-gray-800">{so.order_number}</p>
                        <p className="text-xs text-gray-500"><FormattedDate value={so.date} /></p>
                      </div>
                      <div className="text-right text-xs text-gray-600">
                        <p>Qty {so.quantity}</p>
                        <p className="text-gray-400">{so.status}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No linked sales orders.</p>
              )}
            </div>
          </div>

          {/* Product Form Card */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 lg:p-8 shadow-sm">
            <ProductForm
              productId={productId.toString()}
              initialData={{
                name: product.name,
                sku: product.sku,
                description: product.description || '',
                category: product.category?.toString() || '',
                unit: product.unit.toString(),
                cost_price: product.cost_price.toString(),
                selling_price: product.selling_price.toString(),
                reorder_level: product.reorder_level.toString(),
                expiry_date: product.expiry_date || '',
                status: product.status,
                total_stock: product.total_stock || 0,
              }}
              onSuccess={() => {
                router.push("/dashboard/inventory/products");
              }}
              onCancel={() => {
                router.push("/dashboard/inventory/products");
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
