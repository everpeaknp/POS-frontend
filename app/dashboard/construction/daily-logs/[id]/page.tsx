"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useReactToPrint } from "react-to-print";
import {
  ArrowLeft,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Building2,
  Calendar,
  FileText,
  Package,
  Wallet,
  User,
  Clock,
  ClipboardCheck,
  Sun,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashHeader } from "@/components/dashboard/dash-header";
import { FormattedDate } from "@/components/shared/FormattedDate";
import { SkeletonTable } from "@/components/shared/Skeleton";
import { PrintableDailyLog } from "@/components/print/PrintableDailyLog";
import {
  constructionCardClass,
  constructionTableWrapClass,
} from "@/components/dashboard/ConstructionPageShell";
import { useDateSystem } from "@/lib/context/DateSystemContext";
import { useCompanyInfo } from "@/lib/hooks/useCompanyInfo";
import { constructionApi, type DailyLog, type MaterialConsumption } from "@/lib/api/construction";
import { formatNPR } from "@/lib/utils";
import toast from "react-hot-toast";

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
          <p className={`text-lg font-bold truncate ${valueClass}`}>{value}</p>
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

function SectionCard({
  title,
  icon: Icon,
  children,
  className = "",
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`${constructionCardClass} p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-5">
        <Icon className="h-5 w-5 text-[#22C55E]" />
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function TextBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-gray-50 border border-gray-100 p-4">
      <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{children}</p>
    </div>
  );
}

function ReviewStatusBadge({ reviewed }: { reviewed: boolean }) {
  return reviewed ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
      <CheckCircle className="h-3.5 w-3.5" />
      Reviewed
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
      <Clock className="h-3.5 w-3.5" />
      Pending Review
    </span>
  );
}

function EditabilityBadge({ log }: { log: DailyLog }) {
  if (!log.is_editable) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        <Clock className="h-3.5 w-3.5" />
        Locked
      </span>
    );
  }

  if (log.hours_until_immutable !== undefined && log.hours_until_immutable < 24) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
        <Clock className="h-3.5 w-3.5" />
        Editable for {log.hours_until_immutable.toFixed(1)}h
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
      <Edit className="h-3.5 w-3.5" />
      Editable
    </span>
  );
}

function sumMaterialCost(consumptions?: MaterialConsumption[]) {
  return (consumptions ?? []).reduce((sum, item) => sum + Number(item.total_cost || 0), 0);
}

export default function DailyLogDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { formatDateTime, formatDate } = useDateSystem();

  const [log, setLog] = useState<DailyLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const { companyInfo } = useCompanyInfo();

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `DailyLog_${log?.site_name || "Site"}_${log?.date || new Date().toISOString().split("T")[0]}`,
  });

  useEffect(() => {
    if (id) fetchLog();
  }, [id]);

  const fetchLog = async () => {
    try {
      setLoading(true);
      const data = await constructionApi.dailyLogs.get(id);
      setLog(data);
    } catch (error: unknown) {
      console.error("Failed to fetch daily log:", error);
      toast.error("Failed to load daily log");
      router.push("/dashboard/construction/daily-logs");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!log) return;

    const confirmDelete = () => {
      setDeleting(true);
      toast.promise(constructionApi.dailyLogs.delete(id), {
        loading: "Deleting daily log...",
        success: () => {
          router.push("/dashboard/construction/daily-logs");
          return `Daily log for ${log.site_name} deleted successfully`;
        },
        error: (err) =>
          err.response?.data?.detail || err.response?.data?.message || "Failed to delete daily log",
      }).finally(() => setDeleting(false));
    };

    toast(
      (t) => (
        <div className="flex flex-col gap-4 min-w-[320px] p-2">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-base">Delete this daily log?</p>
              <p className="text-sm text-gray-600 mt-1">
                This will permanently remove the log for {log.site_name}. This action cannot be undone.
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
        <DashHeader title="Loading..." subtitle="Daily Log" />
        <div className="flex-1 p-6">
          <SkeletonTable rows={6} />
        </div>
      </div>
    );
  }

  if (!log) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <DashHeader title="Not Found" subtitle="Daily Log" />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
          <p className="text-gray-500">Daily log not found</p>
          <Link href="/dashboard/construction/daily-logs">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Daily Logs
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const materialCost = sumMaterialCost(log.material_consumptions);
  const otherExpenses = Number(log.other_expenses) || 0;
  const totalSpend = materialCost + otherExpenses;
  const materialCount = log.material_consumptions?.length ?? 0;
  const isReviewed = Boolean(log.reviewed_by_name);
  const siteInitials = (log.site_name || "DL")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const quickLinks = [
    { href: "/dashboard/construction/daily-logs", label: "All Daily Logs", icon: FileText },
    { href: "/dashboard/construction/attendance", label: "Attendance", icon: ClipboardCheck },
    ...(log.site
      ? [{ href: `/dashboard/construction/sites/${log.site}`, label: "View Site", icon: Building2 }]
      : []),
  ];

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashHeader
        title={log.site_name || "Daily Log"}
        subtitle={`Daily Log · ${formatDate(log.date)}`}
      />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="w-full space-y-6">
          {/* Action bar */}
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/dashboard/construction/daily-logs">
              <Button variant="outline" size="sm" className="gap-1.5 h-8">
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </Button>
            </Link>
            <ReviewStatusBadge reviewed={isReviewed} />
            <EditabilityBadge log={log} />
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
            <Link href={`/dashboard/construction/daily-logs/${id}/edit`}>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-8"
                disabled={!log.is_editable}
              >
                <Edit className="h-3.5 w-3.5" /> Edit
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-8 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              onClick={handleDelete}
              disabled={deleting || !log.is_editable}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>

          {/* Hero */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 lg:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-[#22C55E] text-white text-lg font-bold flex items-center justify-center shrink-0">
                {siteInitials}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-900">{log.site_name}</h2>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  <FormattedDate value={log.date} />
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-600">
                  {log.weather && (
                    <span className="flex items-center gap-1">
                      <Sun className="h-3.5 w-3.5" />
                      {log.weather}
                    </span>
                  )}
                  {log.submitted_by_name && (
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      Submitted by {log.submitted_by_name}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-gray-500">Total Spend</p>
                <p className="text-2xl font-bold text-[#22C55E]">{formatNPR(totalSpend)}</p>
                <p className="text-xs text-gray-400 mt-0.5">materials + other</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Materials Used"
              value={materialCount}
              icon={Package}
              iconClass="bg-orange-50 text-orange-600"
            />
            <StatCard
              label="Material Cost"
              value={formatNPR(materialCost)}
              icon={Package}
              iconClass="bg-blue-50 text-blue-600"
            />
            <StatCard
              label="Other Expenses"
              value={formatNPR(otherExpenses)}
              icon={Wallet}
              iconClass="bg-purple-50 text-purple-600"
              valueClass={otherExpenses > 0 ? "text-gray-900" : "text-gray-400"}
            />
            <StatCard
              label="Review Status"
              value={isReviewed ? "Reviewed" : "Pending"}
              icon={isReviewed ? CheckCircle : Clock}
              iconClass={isReviewed ? "bg-green-50 text-green-600" : "bg-yellow-50 text-yellow-600"}
              valueClass={isReviewed ? "text-green-600" : "text-yellow-600"}
            />
          </div>

          {/* Main content */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              <SectionCard title="Work Description" icon={FileText}>
                <TextBlock>{log.work_description}</TextBlock>
              </SectionCard>

              {log.progress_notes && (
                <SectionCard title="Progress Notes" icon={ClipboardCheck}>
                  <TextBlock>{log.progress_notes}</TextBlock>
                </SectionCard>
              )}

              {log.material_consumptions && log.material_consumptions.length > 0 && (
                <div className={`${constructionCardClass} overflow-hidden`}>
                  <div className="flex flex-wrap items-center justify-between gap-3 p-6 pb-4">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-[#22C55E]" />
                      <h3 className="text-base font-semibold text-gray-900">Material Consumptions</h3>
                    </div>
                    <span className="text-sm font-semibold text-[#22C55E]">
                      Total: {formatNPR(materialCost)}
                    </span>
                  </div>
                  <div className={constructionTableWrapClass}>
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Product
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Quantity
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Unit Cost
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {log.material_consumptions.map((consumption) => (
                          <tr key={consumption.id} className="hover:bg-gray-50/50">
                            <td className="px-4 py-3 text-sm text-gray-900">
                              <p className="font-medium">{consumption.product_name}</p>
                              {consumption.product_sku && (
                                <p className="text-xs text-gray-500 mt-0.5">{consumption.product_sku}</p>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {Number(consumption.quantity).toFixed(2)}{" "}
                              <span className="text-gray-400">{consumption.product_unit}</span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 text-right">
                              {formatNPR(consumption.unit_cost)}
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                              {formatNPR(consumption.total_cost)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 border-t border-gray-200">
                        <tr>
                          <td colSpan={3} className="px-4 py-3 text-sm font-medium text-gray-600 text-right">
                            Material Total
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-[#22C55E] text-right">
                            {formatNPR(materialCost)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {log.progress_photos && log.progress_photos.length > 0 && (
                <SectionCard title="Progress Photos" icon={FileText}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {log.progress_photos.map((photo, index) => (
                      <a
                        key={index}
                        href={photo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block aspect-video rounded-lg overflow-hidden border border-gray-100 bg-gray-50 hover:opacity-90 transition-opacity"
                      >
                        <img
                          src={photo}
                          alt={`Progress photo ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </a>
                    ))}
                  </div>
                </SectionCard>
              )}
            </div>

            <div className="space-y-6">
              <SectionCard title="Log Details" icon={Building2}>
                <div className="space-y-4">
                  <DetailItem label="Site">
                    {log.site ? (
                      <Link
                        href={`/dashboard/construction/sites/${log.site}`}
                        className="text-[#22C55E] hover:text-[#16A34A] transition-colors"
                      >
                        {log.site_name}
                      </Link>
                    ) : (
                      log.site_name || "—"
                    )}
                  </DetailItem>
                  <DetailItem label="Date">
                    <FormattedDate value={log.date} />
                  </DetailItem>
                  <DetailItem label="Weather">{log.weather || "—"}</DetailItem>
                  <DetailItem label="Other Expenses">
                    {otherExpenses > 0 ? (
                      <span className="text-[#22C55E]">{formatNPR(otherExpenses)}</span>
                    ) : (
                      "—"
                    )}
                  </DetailItem>
                  <DetailItem label="Submitted By">{log.submitted_by_name || "—"}</DetailItem>
                </div>
              </SectionCard>

              {log.other_expenses_description && (
                <SectionCard title="Expense Notes" icon={Wallet}>
                  <TextBlock>{log.other_expenses_description}</TextBlock>
                </SectionCard>
              )}

              {log.manager_comments && (
                <div className={`${constructionCardClass} p-6 border-green-200 bg-green-50/40`}>
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h3 className="text-base font-semibold text-green-900">Manager Comments</h3>
                  </div>
                  <p className="text-sm text-green-900 whitespace-pre-wrap leading-relaxed">
                    {log.manager_comments}
                  </p>
                  {log.reviewed_by_name && (
                    <p className="text-xs text-green-700 mt-3 pt-3 border-t border-green-200">
                      Reviewed by {log.reviewed_by_name}
                      {log.reviewed_at && <> · {formatDateTime(log.reviewed_at)}</>}
                    </p>
                  )}
                </div>
              )}

              <SectionCard title="Activity" icon={Clock}>
                <div className="space-y-4">
                  <DetailItem label="Created">{formatDateTime(log.created_at)}</DetailItem>
                  <DetailItem label="Last Updated">{formatDateTime(log.updated_at)}</DetailItem>
                  {log.reviewed_by_name && (
                    <DetailItem label="Reviewed By">{log.reviewed_by_name}</DetailItem>
                  )}
                  {log.reviewed_at && (
                    <DetailItem label="Reviewed At">{formatDateTime(log.reviewed_at)}</DetailItem>
                  )}
                </div>
              </SectionCard>

              {!log.is_editable && (
                <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-900">This log is locked</p>
                    <p className="text-xs text-amber-700 mt-1">
                      Logs older than 24 hours cannot be edited or deleted.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick links */}
          <div className={`${constructionCardClass} p-5`}>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
              Quick Links
            </p>
            <div className="flex flex-wrap gap-2">
              {quickLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <Button variant="outline" size="sm" className="gap-1.5 h-8">
                    <link.icon className="h-3.5 w-3.5" />
                    {link.label}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {companyInfo && log && (
        <div className="hidden">
          <PrintableDailyLog ref={printRef} log={log} companyInfo={companyInfo} />
        </div>
      )}
    </div>
  );
}
