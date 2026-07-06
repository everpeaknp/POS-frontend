"use client";

import { PageLoading } from "@/components/shared/PageLoading";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Users, Package, ArrowRight, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TiggLogo } from "@/components/tigg-logo";
import { setVisitedWorkspace, setSkipWorkspace } from "@/lib/utils/workspace";

const B = "#22C55E";
const BD = "#16A34A";

// Module icons mapping
const moduleIcons: Record<string, any> = {
  inventory: Package,
  sales: Building2,
  purchase: Package,
  accounting: Building2,
  construction: Building2,
  hardware: Package,
  reports: Building2 };

// Module display names
const moduleNames: Record<string, string> = {
  inventory: "Inventory Management",
  sales: "Sales & Orders",
  purchase: "Purchase & Suppliers",
  accounting: "Accounting & Finance",
  construction: "Construction Projects",
  hardware: "Hardware Business",
  reports: "Reports & Analytics" };

// Module descriptions
const moduleDescriptions: Record<string, string> = {
  inventory: "Manage products, stock levels, and warehouses",
  sales: "Handle sales orders, invoices, and customers",
  purchase: "Manage suppliers and purchase orders",
  accounting: "Track finances, ledgers, and reports",
  construction: "Manage sites, labor, and equipment",
  hardware: "Stock management and credit sales",
  reports: "Business insights and analytics" };

export default function WorkspacePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('[Workspace] useEffect - user:', user ? 'exists' : 'null');
    if (!user) {
      console.log('[Workspace] No user, redirecting to login');
      router.push("/auth/login");
    } else {
      setIsLoading(false);
      
      // Check if user has skip preference
      const skipWorkspace = document.cookie.includes('skip_workspace=true');
      console.log('[Workspace] Skip workspace cookie:', skipWorkspace);
      if (skipWorkspace) {
        console.log('[Workspace] Auto-redirecting to dashboard');
        // Auto-redirect if user has skip preference
        router.push("/dashboard");
      } else {
        console.log('[Workspace] Showing workspace page');
      }
    }
  }, [user, router]);

  const handleEnterWorkspace = () => {
    setVisitedWorkspace();
    router.push("/dashboard");
  };

  const handleSkipWorkspace = () => {
    setSkipWorkspace();
    router.push("/dashboard");
  };

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
  };

  if (isLoading || !user) {
    return (
      <PageLoading fullScreen message="Loading workspace…" />
    );
  }

  const tenant = user.tenant;
  const activeModules = tenant?.active_modules || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <TiggLogo size="md" />
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {user.first_name} {user.last_name}
              </p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Welcome back, {user.first_name}!
          </h1>
          <p className="text-lg text-gray-600">
            Select your workspace to get started
          </p>
        </div>

        {/* Workspace Card */}
        <div className="max-w-4xl mx-auto">
          <Card className="border-2 border-gray-200 shadow-xl hover:shadow-2xl transition-shadow">
            <CardContent className="p-8">
              {/* Workspace Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl font-bold"
                    style={{ backgroundColor: B }}
                  >
                    {tenant?.name?.charAt(0).toUpperCase() || "W"}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {tenant?.name || "Your Workspace"}
                    </h2>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-gray-500 capitalize">
                        {tenant?.business_type || "Business"}
                      </span>
                      <span className="text-gray-300">•</span>
                      <span className="text-sm font-medium text-green-600 capitalize">
                        {tenant?.plan_type || "Free"} Plan
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => router.push("/dashboard/settings/org")}
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-8 p-4 bg-slate-50 rounded-lg">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Package className="h-4 w-4 text-gray-500" />
                    <p className="text-2xl font-bold text-gray-900">
                      {activeModules.length}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500">Active Modules</p>
                </div>
                <div className="text-center border-l border-r border-gray-200">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Users className="h-4 w-4 text-gray-500" />
                    <p className="text-2xl font-bold text-gray-900">
                      {tenant?.id ? "1+" : "1"}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500">Team Members</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    <p className="text-2xl font-bold text-gray-900">
                      {tenant?.is_active ? "Active" : "Inactive"}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500">Status</p>
                </div>
              </div>

              {/* Active Modules */}
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
                  Your Active Modules
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {activeModules.map((module) => {
                    const Icon = moduleIcons[module] || Package;
                    return (
                      <div
                        key={module}
                        className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-green-300 hover:shadow-sm transition-all"
                      >
                        <div className="p-2 bg-green-50 rounded-lg">
                          <Icon className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {moduleNames[module] || module}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {moduleDescriptions[module] || "Module"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Enter Workspace Button */}
              <Button
                onClick={handleEnterWorkspace}
                className="w-full h-14 text-lg font-semibold text-white group"
                style={{ backgroundColor: B }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = BD)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = B)
                }
              >
                Enter Workspace
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>

              {/* Skip Option */}
              <div className="text-center mt-4">
                <button
                  onClick={handleSkipWorkspace}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Skip and don't show this again
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Multi-Tenant Info */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Your data is isolated and secure. No other organization can access
              your workspace.
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Workspace ID: {tenant?.slug || "N/A"} • Tenant ID: {tenant?.id || "N/A"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
