"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useReactToPrint } from "react-to-print";
import {
  ArrowLeft,
  Edit,
  Trash2,
  AlertTriangle,
  Building2,
  Calendar,
  FileText,
  Wallet,
  Clock,
  Wrench,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashHeader } from "@/components/dashboard/dash-header";
import { FormattedDate } from "@/components/shared/FormattedDate";
import { SkeletonTable } from "@/components/shared/Skeleton";
import { PrintableEquipment } from "@/components/print/PrintableEquipment";
import { constructionCardClass } from "@/components/dashboard/ConstructionPageShell";
import { useDateSystem } from "@/lib/context/DateSystemContext";
import { useCompanyInfo } from "@/lib/hooks/useCompanyInfo";
import { constructionApi, type Equipment } from "@/lib/api/construction";
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

function formatStatusLabel(status: string) {
  return status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function getOwnershipBadge(type: Equipment["ownership_type"]) {
  return type === "owned" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700";
}

function getStatusBadge(status: Equipment["status"]) {
  const colors: Record<Equipment["status"], string> = {
    available: "bg-green-100 text-green-700",
    in_use: "bg-yellow-100 text-yellow-700",
    maintenance: "bg-orange-100 text-orange-700",
    retired: "bg-gray-100 text-gray-500",
  };
  return colors[status] || "bg-gray-100 text-gray-600";
}

function getStatusIconClass(status: Equipment["status"]) {
  const colors: Record<Equipment["status"], string> = {
    available: "bg-green-50 text-green-600",
    in_use: "bg-yellow-50 text-yellow-600",
    maintenance: "bg-orange-50 text-orange-600",
    retired: "bg-gray-100 text-gray-500",
  };
  return colors[status] || "bg-gray-100 text-gray-600";
}

function getPrimaryCost(equipment: Equipment) {
  if (equipment.ownership_type === "rented" && equipment.rental_cost_per_day) {
    return { label: "Rental / Day", value: formatNPR(equipment.rental_cost_per_day) };
  }
  if (equipment.purchase_cost) {
    return { label: "Purchase Cost", value: formatNPR(equipment.purchase_cost) };
  }
  return { label: "Cost", value: "—" };
}

export default function EquipmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const equipmentId = params.id as string;
  const { formatDateTime } = useDateSystem();

  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const { companyInfo } = useCompanyInfo();

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Equipment_${equipment?.name || equipmentId}_${new Date().toISOString().split("T")[0]}`,
  });

  useEffect(() => {
    if (equipmentId) fetchEquipment();
  }, [equipmentId]);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const equipmentData = await constructionApi.equipment.get(equipmentId);
      setEquipment(equipmentData);
    } catch (error: unknown) {
      console.error("Failed to fetch equipment:", error);
      toast.error("Failed to load equipment details");
      router.push("/dashboard/construction/equipment");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!equipment) return;

    const confirmDelete = () => {
      setDeleting(true);
      toast
        .promise(constructionApi.equipment.delete(equipmentId), {
          loading: "Deleting equipment...",
          success: () => {
            router.push("/dashboard/construction/equipment");
            return `Equipment "${equipment.name}" deleted successfully`;
          },
          error: (err) =>
            err.response?.data?.detail || err.response?.data?.message || "Failed to delete equipment",
        })
        .finally(() => setDeleting(false));
    };

    toast(
      (t) => (
        <div className="flex flex-col gap-4 min-w-[320px] p-2">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-base">Delete {equipment.name}?</p>
              <p className="text-sm text-gray-600 mt-1">
                This will permanently remove the equipment and all associated data.
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
        <DashHeader title="Loading..." subtitle="Equipment" />
        <div className="flex-1 p-6">
          <SkeletonTable rows={6} />
        </div>
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <DashHeader title="Not Found" subtitle="Equipment" />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
          <p className="text-gray-500">Equipment not found</p>
          <Link href="/dashboard/construction/equipment">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Equipment
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const primaryCost = getPrimaryCost(equipment);
  const initials = equipment.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const quickLinks = [
    { href: "/dashboard/construction/equipment", label: "All Equipment", icon: Wrench },
    { href: "/dashboard/construction/daily-logs", label: "Daily Logs", icon: FileText },
    ...(equipment.assigned_site
      ? [
          {
            href: `/dashboard/construction/sites/${equipment.assigned_site}`,
            label: "Assigned Site",
            icon: Building2,
          },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashHeader title={equipment.name} subtitle={equipment.equipment_type} />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="w-full space-y-6">
          {/* Action bar */}
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/dashboard/construction/equipment">
              <Button variant="outline" size="sm" className="gap-1.5 h-8">
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </Button>
            </Link>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadge(equipment.status)}`}
            >
              {formatStatusLabel(equipment.status)}
            </span>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getOwnershipBadge(equipment.ownership_type)}`}
            >
              {equipment.ownership_type}
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
            <Link href={`/dashboard/construction/equipment/${equipmentId}/edit`}>
              <Button variant="outline" size="sm" className="gap-1.5 h-8">
                <Edit className="h-3.5 w-3.5" /> Edit
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-8 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>

          {/* Hero */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 lg:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-[#22C55E] text-white text-lg font-bold flex items-center justify-center shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-900">{equipment.name}</h2>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                  <Wrench className="h-3.5 w-3.5 shrink-0" />
                  {equipment.equipment_type}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-600">
                  {equipment.registration_number && (
                    <span>Reg: {equipment.registration_number}</span>
                  )}
                  {equipment.assigned_site_name && (
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5" />
                      {equipment.assigned_site_name}
                    </span>
                  )}
                  {equipment.purchase_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Purchased <FormattedDate value={equipment.purchase_date} />
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-gray-500">{primaryCost.label}</p>
                <p className="text-2xl font-bold text-[#22C55E]">{primaryCost.value}</p>
                {equipment.ownership_type === "rented" && (
                  <p className="text-xs text-gray-400 mt-0.5">per day</p>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Ownership"
              value={equipment.ownership_type.charAt(0).toUpperCase() + equipment.ownership_type.slice(1)}
              icon={Wallet}
              iconClass={
                equipment.ownership_type === "owned"
                  ? "bg-green-50 text-green-600"
                  : "bg-blue-50 text-blue-600"
              }
              valueClass={equipment.ownership_type === "owned" ? "text-green-600" : "text-blue-600"}
            />
            <StatCard
              label="Status"
              value={formatStatusLabel(equipment.status)}
              icon={Wrench}
              iconClass={getStatusIconClass(equipment.status)}
              valueClass={
                equipment.status === "available"
                  ? "text-green-600"
                  : equipment.status === "retired"
                    ? "text-gray-500"
                    : "text-gray-900"
              }
            />
            <StatCard
              label={equipment.ownership_type === "rented" ? "Daily Rental" : "Purchase Cost"}
              value={
                equipment.ownership_type === "rented"
                  ? equipment.rental_cost_per_day
                    ? formatNPR(equipment.rental_cost_per_day)
                    : "—"
                  : equipment.purchase_cost
                    ? formatNPR(equipment.purchase_cost)
                    : "—"
              }
              icon={Wallet}
              iconClass="bg-purple-50 text-purple-600"
              valueClass="text-[#22C55E]"
            />
            <StatCard
              label="Assigned Site"
              value={equipment.assigned_site_name || "Unassigned"}
              icon={Building2}
              iconClass="bg-orange-50 text-orange-600"
            />
          </div>

          {/* Main content */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              <SectionCard title="Equipment Details" icon={Wrench}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DetailItem label="Equipment Name">{equipment.name}</DetailItem>
                  <DetailItem label="Type">{equipment.equipment_type}</DetailItem>
                  <DetailItem label="Ownership">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getOwnershipBadge(equipment.ownership_type)}`}
                    >
                      {equipment.ownership_type}
                    </span>
                  </DetailItem>
                  <DetailItem label="Status">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusBadge(equipment.status)}`}
                    >
                      {formatStatusLabel(equipment.status)}
                    </span>
                  </DetailItem>
                  <DetailItem label="Registration Number">
                    {equipment.registration_number || "—"}
                  </DetailItem>
                  <DetailItem label="Purchase Date">
                    {equipment.purchase_date ? (
                      <FormattedDate value={equipment.purchase_date} />
                    ) : (
                      "—"
                    )}
                  </DetailItem>
                </div>
              </SectionCard>

              {equipment.notes && (
                <SectionCard title="Notes" icon={FileText}>
                  <TextBlock>{equipment.notes}</TextBlock>
                </SectionCard>
              )}

              {equipment.status === "maintenance" && (
                <div className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4">
                  <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-orange-900">Under maintenance</p>
                    <p className="text-xs text-orange-700 mt-1">
                      This equipment is currently unavailable for site assignment or usage.
                    </p>
                  </div>
                </div>
              )}

              {equipment.status === "retired" && (
                <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <AlertTriangle className="h-5 w-5 text-gray-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">Retired equipment</p>
                    <p className="text-xs text-gray-600 mt-1">
                      This equipment is no longer in active use.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <SectionCard title="Financial Information" icon={Wallet}>
                <div className="space-y-4">
                  {equipment.ownership_type === "owned" ? (
                    <DetailItem label="Purchase Cost">
                      {equipment.purchase_cost ? (
                        <span className="text-[#22C55E]">{formatNPR(equipment.purchase_cost)}</span>
                      ) : (
                        "—"
                      )}
                    </DetailItem>
                  ) : (
                    <DetailItem label="Rental Cost / Day">
                      {equipment.rental_cost_per_day ? (
                        <span className="text-[#22C55E]">
                          {formatNPR(equipment.rental_cost_per_day)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </DetailItem>
                  )}
                  {equipment.purchase_date && (
                    <DetailItem label="Purchase Date">
                      <FormattedDate value={equipment.purchase_date} />
                    </DetailItem>
                  )}
                </div>
              </SectionCard>

              <SectionCard title="Assignment" icon={Building2}>
                <div className="space-y-4">
                  <DetailItem label="Assigned Site">
                    {equipment.assigned_site && equipment.assigned_site_name ? (
                      <Link
                        href={`/dashboard/construction/sites/${equipment.assigned_site}`}
                        className="text-[#22C55E] hover:text-[#16A34A] transition-colors"
                      >
                        {equipment.assigned_site_name}
                      </Link>
                    ) : (
                      <span className="text-gray-500">Not assigned to any site</span>
                    )}
                  </DetailItem>
                  <DetailItem label="Current Status">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusBadge(equipment.status)}`}
                    >
                      {formatStatusLabel(equipment.status)}
                    </span>
                  </DetailItem>
                </div>
              </SectionCard>

              <SectionCard title="Activity" icon={Clock}>
                <div className="space-y-4">
                  <DetailItem label="Created">{formatDateTime(equipment.created_at)}</DetailItem>
                  <DetailItem label="Last Updated">{formatDateTime(equipment.updated_at)}</DetailItem>
                </div>
              </SectionCard>
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
              <Link href={`/dashboard/construction/equipment/${equipmentId}/edit`}>
                <Button variant="outline" size="sm" className="gap-1.5 h-8">
                  <Edit className="h-3.5 w-3.5" />
                  Edit Equipment
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {companyInfo && equipment && (
        <div className="hidden">
          <PrintableEquipment ref={printRef} equipment={equipment} companyInfo={companyInfo} />
        </div>
      )}
    </div>
  );
}
