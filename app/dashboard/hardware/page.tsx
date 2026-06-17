'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, TrendingUp, Users, DollarSign, AlertTriangle, BarChart3 } from 'lucide-react';
import { customerAPI, Customer } from '@/lib/api/sales';
import { inventoryApi, Product } from '@/lib/api/inventory';
import { formatNPR } from '@/lib/utils';
import toast from 'react-hot-toast';

interface DashboardStats {
  totalProducts: number;
  totalStock: number;
  lowStockCount: number;
  totalCustomers: number;
  customersWithCredit: number;
  totalOutstanding: number;
  totalCreditLimit: number;
  bulkPricingRules: number;
}

export default function HardwareDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalStock: 0,
    lowStockCount: 0,
    totalCustomers: 0,
    customersWithCredit: 0,
    totalOutstanding: 0,
    totalCreditLimit: 0,
    bulkPricingRules: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentCustomers, setRecentCustomers] = useState<Customer[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch customers
      const customersResponse = await customerAPI.list();
      const customers = Array.isArray(customersResponse.data.results) 
        ? customersResponse.data.results 
        : [];
      
      const customersWithCredit = customers.filter((c: Customer) => (c.current_balance || 0) > 0);
      const totalOutstanding = customers.reduce((sum: number, c: Customer) => sum + (c.current_balance || 0), 0);
      const totalCreditLimit = customers.reduce((sum: number, c: Customer) => sum + (c.credit_limit || 0), 0);

      // Fetch products
      const productsResponse = await inventoryApi.products.list();
      const products = Array.isArray(productsResponse.data.results) 
        ? productsResponse.data.results 
        : [];

      // Fetch low stock products
      const lowStockResponse = await inventoryApi.products.lowStock();
      const lowStock = Array.isArray(lowStockResponse.data) 
        ? lowStockResponse.data 
        : [];

      // Fetch bulk pricing
      const bulkPricingResponse = await inventoryApi.bulkPricing.list();
      const bulkPricing = Array.isArray(bulkPricingResponse.data) 
        ? bulkPricingResponse.data 
        : [];

      setStats({
        totalProducts: products.length,
        totalStock: products.reduce((sum: number, p: any) => sum + (p.total_stock || 0), 0),
        lowStockCount: lowStock.length,
        totalCustomers: customers.length,
        customersWithCredit: customersWithCredit.length,
        totalOutstanding,
        totalCreditLimit,
        bulkPricingRules: bulkPricing.length,
      });

      setRecentCustomers(customersWithCredit.slice(0, 5));
      setLowStockProducts(lowStock.slice(0, 5));

    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22C55E]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hardware Business Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage stock, credit sales, and bulk pricing for your hardware business
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Products */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalProducts}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <Link href="/dashboard/inventory/products" className="text-sm text-[#22C55E] hover:text-[#16A34A] mt-2 inline-block">
            View Products →
          </Link>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Low Stock Items</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{stats.lowStockCount}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <Link href="/dashboard/inventory/products" className="text-sm text-[#22C55E] hover:text-[#16A34A] mt-2 inline-block">
            View Stock →
          </Link>
        </div>

        {/* Credit Customers */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Credit Customers</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.customersWithCredit}</p>
              <p className="text-xs text-gray-500 mt-1">of {stats.totalCustomers} total</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <Link href="/dashboard/sales/credit" className="text-sm text-[#22C55E] hover:text-[#16A34A] mt-2 inline-block">
            View Credit →
          </Link>
        </div>

        {/* Outstanding Balance */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Outstanding Balance</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{formatNPR(stats.totalOutstanding)}</p>
              <p className="text-xs text-gray-500 mt-1">of {formatNPR(stats.totalCreditLimit)} limit</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <Link href="/dashboard/sales/payments/new" className="text-sm text-[#22C55E] hover:text-[#16A34A] mt-2 inline-block">
            Record Payment →
          </Link>
        </div>
      </div>


      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/dashboard/sales/orders/new"
            className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-[#22C55E] hover:bg-green-50 transition-all"
          >
            <div className="p-2 bg-[#22C55E] rounded-lg">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="font-medium text-gray-900">New Sale</div>
              <div className="text-xs text-gray-500">Create sales order</div>
            </div>
          </Link>

          <Link
            href="/dashboard/purchase/orders/new"
            className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-[#22C55E] hover:bg-green-50 transition-all"
          >
            <div className="p-2 bg-blue-600 rounded-lg">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="font-medium text-gray-900">New Purchase</div>
              <div className="text-xs text-gray-500">Create PO</div>
            </div>
          </Link>

          <Link
            href="/dashboard/sales/payments/new"
            className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-[#22C55E] hover:bg-green-50 transition-all"
          >
            <div className="p-2 bg-green-600 rounded-lg">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Record Payment</div>
              <div className="text-xs text-gray-500">Receive payment</div>
            </div>
          </Link>

          <Link
            href="/dashboard/inventory/adjustment"
            className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-[#22C55E] hover:bg-green-50 transition-all"
          >
            <div className="p-2 bg-purple-600 rounded-lg">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Stock Adjustment</div>
              <div className="text-xs text-gray-500">Add/remove stock</div>
            </div>
          </Link>
        </div>
      </div>


      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customers with Credit */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Customers with Credit (Udhaar)</h2>
              <Link href="/dashboard/sales/credit" className="text-sm text-[#22C55E] hover:text-[#16A34A]">
                View All →
              </Link>
            </div>
          </div>
          <div className="p-6">
            {recentCustomers.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No customers with outstanding balance</p>
            ) : (
              <div className="space-y-4">
                {recentCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-[#22C55E] cursor-pointer transition-colors"
                    onClick={() => router.push(`/dashboard/sales/customers/${customer.id}`)}
                  >
                    <div>
                      <div className="font-medium text-gray-900">{customer.name}</div>
                      <div className="text-sm text-gray-500">
                        Limit: {formatNPR(customer.credit_limit || 0)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-red-600">{formatNPR(customer.current_balance || 0)}</div>
                      <div className="text-xs text-gray-500">Outstanding</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Products */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Low Stock Alert</h2>
              <Link href="/dashboard/inventory/products" className="text-sm text-[#22C55E] hover:text-[#16A34A]">
                View All →
              </Link>
            </div>
          </div>
          <div className="p-6">
            {lowStockProducts.length === 0 ? (
              <p className="text-center text-gray-500 py-8">All products are well stocked</p>
            ) : (
              <div className="space-y-4">
                {lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-4 border border-orange-200 bg-orange-50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-orange-600">{product.total_stock || 0}</div>
                      <div className="text-xs text-gray-500">Reorder: {product.reorder_level}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Stock Management */}
        <Link href="/dashboard/inventory/products" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Stock Management</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Track bulk inventory across multiple warehouses with reorder alerts
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Products:</span>
              <span className="font-medium">{stats.totalProducts}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Low Stock:</span>
              <span className="font-medium text-orange-600">{stats.lowStockCount}</span>
            </div>
          </div>
        </Link>

        {/* Credit System */}
        <Link href="/dashboard/sales/credit" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Credit System (Udhaar)</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Manage customer credit, track payments, and view aging reports
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Customers with Credit:</span>
              <span className="font-medium">{stats.customersWithCredit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Outstanding:</span>
              <span className="font-medium text-red-600">{formatNPR(stats.totalOutstanding)}</span>
            </div>
          </div>
        </Link>

        {/* Bulk Pricing */}
        <Link href="/dashboard/inventory/bulk-pricing" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-[#22C55E] bg-opacity-20 rounded-lg">
              <BarChart3 className="h-6 w-6 text-[#22C55E]" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Bulk Pricing</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Configure quantity-based pricing tiers for volume discounts
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Active Rules:</span>
              <span className="font-medium">{stats.bulkPricingRules}</span>
            </div>
          </div>
        </Link>
      </div>


      {/* Module Links */}
      <div className="bg-gradient-to-r from-[#22C55E] to-[#16A34A] rounded-lg shadow p-6 text-white">
        <h2 className="text-xl font-semibold mb-4">Hardware Business Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/dashboard/inventory/products" className="bg-white bg-opacity-20 rounded-lg p-4 hover:bg-opacity-30 transition-all">
            <div className="font-medium mb-1">Products & Stock</div>
            <div className="text-sm opacity-90">Manage inventory</div>
          </Link>
          <Link href="/dashboard/inventory/warehouses" className="bg-white bg-opacity-20 rounded-lg p-4 hover:bg-opacity-30 transition-all">
            <div className="font-medium mb-1">Warehouses</div>
            <div className="text-sm opacity-90">Storage locations</div>
          </Link>
          <Link href="/dashboard/sales/customers" className="bg-white bg-opacity-20 rounded-lg p-4 hover:bg-opacity-30 transition-all">
            <div className="font-medium mb-1">Customers</div>
            <div className="text-sm opacity-90">Manage customers</div>
          </Link>
          <Link href="/dashboard/purchase/suppliers" className="bg-white bg-opacity-20 rounded-lg p-4 hover:bg-opacity-30 transition-all">
            <div className="font-medium mb-1">Suppliers</div>
            <div className="text-sm opacity-90">Manage suppliers</div>
          </Link>
          <Link href="/dashboard/sales/orders" className="bg-white bg-opacity-20 rounded-lg p-4 hover:bg-opacity-30 transition-all">
            <div className="font-medium mb-1">Sales Orders</div>
            <div className="text-sm opacity-90">View all orders</div>
          </Link>
          <Link href="/dashboard/purchase/orders" className="bg-white bg-opacity-20 rounded-lg p-4 hover:bg-opacity-30 transition-all">
            <div className="font-medium mb-1">Purchase Orders</div>
            <div className="text-sm opacity-90">View all POs</div>
          </Link>
          <Link href="/dashboard/inventory/bulk-pricing" className="bg-white bg-opacity-20 rounded-lg p-4 hover:bg-opacity-30 transition-all">
            <div className="font-medium mb-1">Bulk Pricing</div>
            <div className="text-sm opacity-90">Pricing tiers</div>
          </Link>
          <Link href="/dashboard/sales/reports" className="bg-white bg-opacity-20 rounded-lg p-4 hover:bg-opacity-30 transition-all">
            <div className="font-medium mb-1">Reports</div>
            <div className="text-sm opacity-90">Analytics & insights</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
