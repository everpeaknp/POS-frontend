"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useReactToPrint } from "react-to-print";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Users,
  ClipboardCheck,
  Package,
  FileText,
  MapPin,
  Building2,
  Calendar,
  Wallet,
  AlertTriangle,
  BarChart3,
  HardHat,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashHeader } from "@/components/dashboard/dash-header";
import { FormattedDate } from "@/components/shared/FormattedDate";
import { SkeletonTable } from "@/components/shared/Skeleton";
import { PrintableConstructionSite } from "@/components/print/PrintableConstructionSite";
import { constructionCardClass } from "@/components/dashboard/ConstructionPageShell";
import { useCompanyInfo } from "@/lib/hooks/useCompanyInfo";
import { constructionApi, type Site } from "@/lib/api/construction";
import { formatNPR } from "@/lib/utils";
import toast from "react-hot-toast";

type SiteDashboard = {
  workers?: { total_active?: number };
  attendance?: { present?: number; absent?: number; half_day?: number; overtime?: number };
  material_consumption?: { last_30_days?: number };
  daily_logs?: { total?: number };
};

function getBudgetHealthColor(percentage: number) {
  if (percentage < 80) return "text-green-700 bg-green-50 border-green-200";
  if (percentage < 100) return "text-yellow-700 bg-yellow-50 border-yellow-200";
  return "text-red-700 bg-red-50 border-red-200";
}

function getBudgetHealthLabel(percentage: number) {
  if (percentage < 80) return "Healthy";
  if (percentage < 100) return "Warning";
  return "Over Budget";
}

function getStatusColor(status: string) {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800";
    case "planned":
      return "bg-blue-100 text-blue-800";
    case "on_hold":
      return "bg-yellow-100 text-yellow-800";
    case "completed":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function formatStatusLabel(status: string) {
  return status.replace("_", " ");
}

function StatCard({
  label,
  value,
  icon: Icon,
  iconClass,
  valueClass = "text-gray-900",
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  valueClass?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
          <p className="text-xs text-gray-500 mt-0.5">{label}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg shrink-0 flex items-center justify-center ${iconClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <div className="mt-1 text-sm font-medium text-gray-900">{children}</div>
    </div>
  );
}

export default function SiteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const siteId = params.id as string;

  const [site, setSite] = useState<Site | null>(null);
  const [siteDashboard, setSiteDashboard] = useState<SiteDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);
  const { companyInfo } = useCompanyInfo();

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Site_${site?.name || siteId}_${new Date().toISOString().split("T")[0]}`,
  });

  useEffect(() => {
    if (siteId) fetchSite();
  }, [siteId]);

  const fetchSite = async () => {
    try {
      setLoading(true);
      const [siteData, dashboardData] = await Promise.all([
        constructionApi.sites.get(siteId),
        constructionApi.sites.dashboard(siteId),
      ]);
      setSite(siteData);
      setSiteDashboard(dashboardData);
    } catch (error: unknown) {
      console.error("Failed to fetch site:", error);
      toast.error("Failed to load site details");
      router.push("/dashboard/construction/sites");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!site) return;

    const confirmDelete = () => {
      toast.promise(constructionApi.sites.delete(siteId), {
        loading: "Deleting site...",
        success: () => {
          router.push("/dashboard/construction/sites");
          return `Site "${site.name}" deleted successfully`;
        },
        error: (err) =>
          err.response?.data?.detail || err.response?.data?.message || "Failed to delete site",
      });
    };

    toast(
      (t) => (
        <div className="flex flex-col gap-4 min-w-[320px] p-2">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-base">Delete {site.name}?</p>
              <p className="text-sm text-gray-600 mt-1">
                This will permanently remove the site and all associated data.
              </p>
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
      ),
      {
        duration: Infinity,
        position: "top-center",
        style: {
          marginTop: "40vh",
          background: "white",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          borderRadius: "12px",
          padding: "16px",
        },
      }
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <DashHeader title="Loading..." subtitle="Construction Site" />
        <div className="flex-1 p-6">
          <SkeletonTable rows={6} />
        </div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <DashHeader title="Not Found" subtitle="Construction Site" />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
          <p className="text-gray-500">Site not found</p>
          <Link href="/dashboard/construction/sites">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Sites
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const budgetPct = site.budget_percentage ?? 0;
  const progressColor =
    budgetPct < 80 ? "bg-green-500" : budgetPct < 100 ? "bg-yellow-500" : "bg-red-500";

  const costItems = [
    { label: "Material", value: site.material_cost ?? 0 },
    { label: "Labor", value: site.labor_cost ?? 0 },
    { label: "Equipment", value: site.equipment_cost ?? 0 },
    { label: "Other", value: site.other_expenses ?? 0 },
  ];

  const quickLinks = [
    { href: "/dashboard/construction/attendance", label: "Attendance", icon: ClipboardCheck },
    { href: "/dashboard/construction/daily-logs", label: "Daily Logs", icon: FileText },
    { href: "/dashboard/construction/workers", label: "Workers", icon: HardHat },
    { href: "/dashboard/construction/reports", label: "Reports", icon: BarChart3 },
  ];

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashHeader title={site.name} subtitle="Construction Site" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="w-full space-y-6">
          {/* Action bar */}
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/dashboard/construction/sites">
              <Button variant="outline" size="sm" className="gap-1.5 h-8">
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </Button>
            </Link>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(site.status)}`}
            >
              {formatStatusLabel(site.status)}
            </span>
            <div className="flex-1" />
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-8"
              onClick={() => handlePrint()}
              disabled={!companyInfo}
            >
              <Printer className="h-3.5 w-3.5" /> Export PDF
            </Button>
            <Link href={`/dashboard/construction/sites/${siteId}/edit`}>
              <Button variant="outline" size="sm" className="gap-1.5 h-8">
                <Edit className="h-3.5 w-3.5" /> Edit
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-8 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              onClick={handleDelete}
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
          </div>

          {/* Hero */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 lg:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-[#22C55E] text-white text-lg font-bold flex items-center justify-center shrink-0">
                {site.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-900">{site.name}</h2>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {site.location}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-600">
                  {site.client_name && <span>Client: {site.client_name}</span>}
                  {site.manager_name && <span>Manager: {site.manager_name}</span>}
                  {site.warehouse_name && <span>Warehouse: {site.warehouse_name}</span>}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-gray-500">Allocated Budget</p>
                <p className="text-2xl font-bold text-gray-900">{formatNPR(site.allocated_budget)}</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          {siteDashboard && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Active Workers"
                value={siteDashboard.workers?.total_active ?? 0}
                icon={Users}
                iconClass="bg-blue-50 text-blue-600"
              />
              <StatCard
                label="Present (7 days)"
                value={siteDashboard.attendance?.present ?? 0}
                icon={ClipboardCheck}
                iconClass="bg-green-50 text-green-600"
                valueClass="text-green-600"
              />
              <StatCard
                label="Material Logs (30d)"
                value={siteDashboard.material_consumption?.last_30_days ?? 0}
                icon={Package}
                iconClass="bg-orange-50 text-orange-600"
              />
              <StatCard
                label="Daily Logs"
                value={siteDashboard.daily_logs?.total ?? 0}
                icon={FileText}
                iconClass="bg-purple-50 text-purple-600"
              />
            </div>
          )}

          {/* Main content */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Budget */}
            <div className={`${constructionCardClass} p-6 xl:col-span-2`}>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-[#22C55E]" />
                  <h3 className="text-base font-semibold text-gray-900">Budget Overview</h3>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${getBudgetHealthColor(budgetPct)}`}
                >
                  {getBudgetHealthLabel(budgetPct)}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-6">
                <div>
                  <p className="text-4xl font-bold text-gray-900">{budgetPct.toFixed(1)}%</p>
                  <p className="text-sm text-gray-500 mt-1">of budget used</p>
                </div>
                <div className="flex-1">
                  <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                      style={{ width: `${Math.min(budgetPct, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Allocated", value: formatNPR(site.allocated_budget) },
                  { label: "Actual Spend", value: formatNPR(site.actual_spend ?? 0) },
                  {
                    label: "Remaining",
                    value: formatNPR(site.remaining_budget ?? 0),
                    className:
                      (site.remaining_budget ?? 0) >= 0 ? "text-green-600" : "text-red-600",
                  },
                  { label: "Budget Used", value: `${budgetPct.toFixed(1)}%` },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg bg-gray-50 border border-gray-100 p-3">
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <p className={`text-lg font-bold mt-0.5 ${item.className ?? "text-gray-900"}`}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              {budgetPct > 80 && (
                <div className="mt-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                  <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-red-800">
                    {budgetPct > 100
                      ? `Over budget by ${formatNPR((site.actual_spend ?? 0) - site.allocated_budget)}`
                      : "Approaching budget limit — review spending"}
                  </p>
                </div>
              )}
            </div>

            {/* Site info + timeline */}
            <div className="space-y-6">
              <div className={`${constructionCardClass} p-6`}>
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="h-5 w-5 text-[#22C55E]" />
                  <h3 className="text-base font-semibold text-gray-900">Site Details</h3>
                </div>
                <div className="space-y-4">
                  <DetailItem label="Manager">{site.manager_name || "—"}</DetailItem>
                  <DetailItem label="Warehouse">{site.warehouse_name || "—"}</DetailItem>
                  <DetailItem label="Client">{site.client_name || "—"}</DetailItem>
                  <DetailItem label="Status">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(site.status)}`}
                    >
                      {formatStatusLabel(site.status)}
                    </span>
                  </DetailItem>
                </div>
              </div>

              <div className={`${constructionCardClass} p-6`}>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="h-5 w-5 text-[#22C55E]" />
                  <h3 className="text-base font-semibold text-gray-900">Timeline</h3>
                </div>
                <div className="space-y-4">
                  <DetailItem label="Start Date">
                    <FormattedDate value={site.start_date} />
                  </DetailItem>
                  {site.estimated_end_date && (
                    <DetailItem label="Estimated End">
                      <FormattedDate value={site.estimated_end_date} />
                    </DetailItem>
                  )}
                  {site.actual_end_date && (
                    <DetailItem label="Actual End">
                      <FormattedDate value={site.actual_end_date} />
                    </DetailItem>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Cost breakdown */}
          <div className={`${constructionCardClass} p-6`}>
            <div className="flex items-center gap-2 mb-5">
              <BarChart3 className="h-5 w-5 text-[#22C55E]" />
              <h3 className="text-base font-semibold text-gray-900">Cost Breakdown</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {costItems.map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-center"
                >
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">{formatNPR(item.value)}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3">
              <span className="text-sm font-medium text-gray-700">Total Actual Spend</span>
              <span className="text-lg font-bold text-gray-900">
                {formatNPR(site.actual_spend ?? 0)}
              </span>
            </div>
          </div>

          {/* Quick links */}
          <div className={`${constructionCardClass} p-6`}>
            <h3 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {quickLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex flex-col items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm font-medium text-gray-700 hover:border-[#22C55E]/30 hover:bg-green-50/50 hover:text-[#22C55E] transition-colors"
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {site.description && (
            <div className={`${constructionCardClass} p-6`}>
              <h3 className="text-base font-semibold text-gray-900 mb-3">Description</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {site.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {companyInfo && site && (
        <div className="hidden">
          <PrintableConstructionSite
            ref={printRef}
            site={site}
            dashboard={siteDashboard}
            companyInfo={companyInfo}
          />
        </div>
      )}
    </div>
  );
}
