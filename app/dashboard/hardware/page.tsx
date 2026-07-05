"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  Users,
  DollarSign,
  AlertTriangle,
  BarChart3,
  ShoppingCart,
  CreditCard,
  ChevronRight,
  Wrench,
  Layers,
} from "lucide-react";
import { DashHeader } from "@/components/dashboard/dash-header";
import { SkeletonCard } from "@/components/shared/Skeleton";
import { useAuth } from "@/lib/context/AuthContext";
import { customerAPI, type Customer } from "@/lib/api/sales";
import { inventoryApi, type Product } from "@/lib/api/inventory";
import { formatNPR } from "@/lib/utils";
import toast from "react-hot-toast";

interface DashboardStats {
  totalProducts: number;
  lowStockCount: number;
  totalCustomers: number;
  customersWithCredit: number;
  totalOutstanding: number;
  totalCreditLimit: number;
  bulkPricingRules: number;
}

const quickActions = [
  {
    href: "/dashboard/hardware/orders/new",
    label: "New Order",
    sub: "Create hardware sale",
    icon: ShoppingCart,
    color: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  },
  {
    href: "/dashboard/hardware/payments/new",
    label: "Record Payment",
    sub: "Receive from customer",
    icon: DollarSign,
    color: "bg-green-50 text-[#22C55E] dark:bg-green-500/10 dark:text-green-400",
  },
  {
    href: "/dashboard/hardware/products/new",
    label: "Add Product",
    sub: "New SKU",
    icon: Package,
    color: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
  },
  {
    href: "/dashboard/hardware/bulk-pricing/new",
    label: "Bulk Pricing",
    sub: "Volume tiers",
    icon: Layers,
    color: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  },
];

const moduleLinks = [
  {
    href: "/dashboard/hardware/products",
    label: "Products",
    sub: "Hardware catalog",
    icon: Package,
    color: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  },
  {
    href: "/dashboard/hardware/customers",
    label: "Customers",
    sub: "Credit & contacts",
    icon: Users,
    color: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
  },
  {
    href: "/dashboard/hardware/orders",
    label: "Orders",
    sub: "Sales history",
    icon: ShoppingCart,
    color: "bg-green-50 text-[#22C55E] dark:bg-green-500/10 dark:text-green-400",
  },
  {
    href: "/dashboard/hardware/reports",
    label: "Reports",
    sub: "Analytics & exports",
    icon: BarChart3,
    color: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  },
];

export default function HardwareDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
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

  const workspaceName =
    user?.tenant?.workspace_name || user?.tenant?.name || "Workspace";
  const subtitle = `${workspaceName} · Hardware business overview`;

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const customersResponse = await customerAPI.list();
      const customers = Array.isArray(customersResponse.data.results)
        ? customersResponse.data.results
        : [];

      const customersWithCredit = customers.filter(
        (c: Customer) => (c.current_balance || 0) > 0
      );
      const totalOutstanding = customers.reduce(
        (sum: number, c: Customer) => sum + (c.current_balance || 0),
        0
      );
      const totalCreditLimit = customers.reduce(
        (sum: number, c: Customer) => sum + (c.credit_limit || 0),
        0
      );

      const productsResponse = await inventoryApi.products.list();
      const products = Array.isArray(productsResponse.data.results)
        ? productsResponse.data.results
        : [];

      const lowStockResponse = await inventoryApi.products.lowStock();
      const lowStock = Array.isArray(lowStockResponse.data) ? lowStockResponse.data : [];

      const bulkPricingResponse = await inventoryApi.bulkPricing.list();
      const bulkData = bulkPricingResponse.data;
      const bulkPricing = Array.isArray(bulkData) ? bulkData : bulkData.results || [];

      setStats({
        totalProducts: products.length,
        lowStockCount: lowStock.length,
        totalCustomers: customers.length,
        customersWithCredit: customersWithCredit.length,
        totalOutstanding,
        totalCreditLimit,
        bulkPricingRules: bulkPricing.length,
      });

      setRecentCustomers(customersWithCredit.slice(0, 5));
      setLowStockProducts(lowStock.slice(0, 5));
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Hardware" subtitle={subtitle} />
        <div className="flex-1 p-6 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Products",
      value: stats.totalProducts.toLocaleString(),
      sub: `${stats.bulkPricingRules} bulk pricing rules`,
      icon: Package,
      color: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
      href: "/dashboard/hardware/products",
    },
    {
      label: "Low Stock",
      value: stats.lowStockCount.toLocaleString(),
      sub: "Items below reorder level",
      icon: AlertTriangle,
      color: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
      href: "/dashboard/hardware/products",
    },
    {
      label: "Credit Customers",
      value: stats.customersWithCredit.toLocaleString(),
      sub: `of ${stats.totalCustomers} total customers`,
      icon: Users,
      color: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
      href: "/dashboard/hardware/credit",
    },
    {
      label: "Outstanding",
      value: formatNPR(stats.totalOutstanding),
      sub: `Limit ${formatNPR(stats.totalCreditLimit)}`,
      icon: DollarSign,
      color: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
      href: "/dashboard/hardware/aging",
    },
  ];

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Hardware" subtitle={subtitle} />

      <div className="flex-1 p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border p-4 shadow-sm hover:border-[#22C55E]/30 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-500 dark:text-muted-foreground">{card.label}</p>
                <div className={`p-2 rounded-lg ${card.color}`}>
                  <card.icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-xl font-medium text-gray-900 dark:text-foreground tabular-nums">
                {card.value}
              </p>
              <p className="text-xs text-gray-400 dark:text-muted-foreground mt-0.5">{card.sub}</p>
            </Link>
          ))}
        </div>

        <div>
          <h2 className="text-sm font-medium text-gray-700 dark:text-foreground mb-3">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border p-4 shadow-sm hover:border-[#22C55E]/30 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${action.color}`}>
                    <action.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-foreground text-sm">
                      {action.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-muted-foreground">{action.sub}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-border flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-700 dark:text-foreground">
                  Customers with Credit
                </h3>
                <Link
                  href="/dashboard/hardware/credit"
                  className="text-xs text-[#22C55E] hover:text-[#16A34A] font-medium inline-flex items-center gap-1"
                >
                  View all
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="p-5">
                {recentCustomers.length === 0 ? (
                  <p className="text-center text-sm text-gray-500 dark:text-muted-foreground py-8">
                    No outstanding customer balances
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recentCustomers.map((customer) => (
                      <button
                        key={customer.id}
                        type="button"
                        onClick={() =>
                          router.push(`/dashboard/hardware/customers/${customer.id}`)
                        }
                        className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-border hover:border-[#22C55E]/30 transition-colors text-left"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-foreground truncate">
                            {customer.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-muted-foreground">
                            Limit {formatNPR(customer.credit_limit || 0)}
                          </p>
                        </div>
                        <p className="text-sm font-medium text-red-600 dark:text-red-400 shrink-0 ml-3">
                          {formatNPR(customer.current_balance || 0)}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-border flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-700 dark:text-foreground">
                  Low Stock Alerts
                </h3>
                <Link
                  href="/dashboard/hardware/products"
                  className="text-xs text-[#22C55E] hover:text-[#16A34A] font-medium inline-flex items-center gap-1"
                >
                  View products
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="p-5">
                {lowStockProducts.length === 0 ? (
                  <p className="text-center text-sm text-gray-500 dark:text-muted-foreground py-8">
                    All products are above reorder levels
                  </p>
                ) : (
                  <div className="space-y-3">
                    {lowStockProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-amber-200/80 bg-amber-50/50 dark:border-amber-500/20 dark:bg-amber-500/5"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-foreground truncate">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-muted-foreground">
                            SKU {product.sku}
                          </p>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                            {product.total_stock || 0}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-muted-foreground">
                            Reorder {product.reorder_level}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border p-5 shadow-sm">
            <h3 className="text-sm font-medium text-gray-700 dark:text-foreground mb-4">
              Module Navigation
            </h3>
            <div className="space-y-2">
              {moduleLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-50 dark:border-border hover:bg-gray-50 dark:hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg shrink-0 ${link.color}`}>
                      <link.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-foreground">
                        {link.label}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-muted-foreground">{link.sub}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 shrink-0" />
                </Link>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-border space-y-2">
              {[
                { href: "/dashboard/hardware/payments", label: "Payments", icon: CreditCard },
                { href: "/dashboard/hardware/bulk-pricing", label: "Bulk Pricing", icon: Layers },
                { href: "/dashboard/hardware/aging", label: "Aging Report", icon: BarChart3 },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 text-sm text-gray-600 dark:text-muted-foreground hover:text-[#22C55E] transition-colors"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-green-50 text-[#22C55E] dark:bg-green-500/10">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-foreground">
                Hardware Business
              </h3>
              <p className="text-xs text-gray-500 dark:text-muted-foreground">
                Stock, credit sales (udhaar), bulk pricing, and aging reports
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Products", value: stats.totalProducts },
              { label: "Low stock", value: stats.lowStockCount },
              { label: "On credit", value: stats.customersWithCredit },
              { label: "Pricing rules", value: stats.bulkPricingRules },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-gray-100 dark:border-border bg-gray-50/50 dark:bg-muted/30 px-3 py-2.5"
              >
                <p className="text-lg font-medium text-gray-900 dark:text-foreground tabular-nums">
                  {item.value}
                </p>
                <p className="text-xs text-gray-500 dark:text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
