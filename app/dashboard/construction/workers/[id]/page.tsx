"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  UserX,
  HardHat,
  Phone,
  MapPin,
  IdCard,
  Building2,
  Wallet,
  ClipboardCheck,
  AlertTriangle,
  User,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashHeader } from "@/components/dashboard/dash-header";
import { SkeletonTable } from "@/components/shared/Skeleton";
import { constructionCardClass } from "@/components/dashboard/ConstructionPageShell";
import { useDateSystem } from "@/lib/context/DateSystemContext";
import { constructionApi, type Worker } from "@/lib/api/construction";
import { formatNPR } from "@/lib/utils";
import toast from "react-hot-toast";

function getCategoryDisplay(category: string) {
  const displays: Record<string, string> = {
    mason: "Mason",
    laborer: "Laborer",
    carpenter: "Carpenter",
    electrician: "Electrician",
    plumber: "Plumber",
    engineer: "Engineer",
    supervisor: "Supervisor",
    helper: "Helper",
    painter: "Painter",
    welder: "Welder",
    driver: "Driver",
    operator: "Equipment Operator",
    other: "Other",
  };
  return displays[category] || category;
}

function getCategoryColor(category: string) {
  const colors: Record<string, string> = {
    mason: "bg-blue-100 text-blue-800",
    carpenter: "bg-yellow-100 text-yellow-800",
    electrician: "bg-purple-100 text-purple-800",
    plumber: "bg-green-100 text-green-800",
    painter: "bg-pink-100 text-pink-800",
    helper: "bg-gray-100 text-gray-800",
    welder: "bg-orange-100 text-orange-800",
    driver: "bg-indigo-100 text-indigo-800",
    operator: "bg-cyan-100 text-cyan-800",
  };
  return colors[category] || "bg-gray-100 text-gray-800";
}

function getStatusColor(status: string) {
  return status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500";
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

export default function WorkerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const workerId = params.id as string;
  const { formatDateTime } = useDateSystem();

  const [worker, setWorker] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (workerId) fetchWorker();
  }, [workerId]);

  const fetchWorker = async () => {
    try {
      setLoading(true);
      const workerData = await constructionApi.workers.get(workerId);
      setWorker(workerData);
    } catch (error: unknown) {
      console.error("Failed to fetch worker:", error);
      toast.error("Failed to load worker details");
      router.push("/dashboard/construction/workers");
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = () => {
    if (!worker) return;

    const confirmDeactivate = () => {
      toast.promise(constructionApi.workers.delete(workerId), {
        loading: "Deactivating worker...",
        success: () => {
          router.push("/dashboard/construction/workers");
          return `Worker "${worker.name}" deactivated successfully`;
        },
        error: (err) =>
          err.response?.data?.detail || err.response?.data?.message || "Failed to deactivate worker",
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
              <p className="font-semibold text-gray-900 text-base">Deactivate {worker.name}?</p>
              <p className="text-sm text-gray-600 mt-1">
                Attendance history will be preserved. They will no longer appear in active lists.
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
                confirmDeactivate();
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              Deactivate
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
        <DashHeader title="Loading..." subtitle="Construction Worker" />
        <div className="flex-1 p-6">
          <SkeletonTable rows={5} />
        </div>
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <DashHeader title="Not Found" subtitle="Construction Worker" />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
          <p className="text-gray-500">Worker not found</p>
          <Link href="/dashboard/construction/workers">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Workers
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const quickLinks = [
    { href: "/dashboard/construction/attendance", label: "Attendance", icon: ClipboardCheck },
    ...(worker.assigned_site
      ? [
          {
            href: `/dashboard/construction/sites/${worker.assigned_site}`,
            label: "Assigned Site",
            icon: Building2,
          },
        ]
      : []),
    {
      href: `/dashboard/construction/workers/${workerId}/edit`,
      label: "Edit Worker",
      icon: Edit,
    },
  ];

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashHeader title={worker.name} subtitle="Construction Worker" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="w-full space-y-6">
          {/* Action bar */}
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/dashboard/construction/workers">
              <Button variant="outline" size="sm" className="gap-1.5 h-8">
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </Button>
            </Link>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(worker.status)}`}
            >
              {worker.status}
            </span>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getCategoryColor(worker.category)}`}
            >
              {getCategoryDisplay(worker.category)}
            </span>
            <div className="flex-1" />
            <Link href={`/dashboard/construction/workers/${workerId}/edit`}>
              <Button variant="outline" size="sm" className="gap-1.5 h-8">
                <Edit className="h-3.5 w-3.5" /> Edit
              </Button>
            </Link>
            {worker.status === "active" && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-8 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                onClick={handleDeactivate}
              >
                <UserX className="h-3.5 w-3.5" /> Deactivate
              </Button>
            )}
          </div>

          {/* Hero */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 lg:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-[#22C55E] text-white text-lg font-bold flex items-center justify-center shrink-0">
                {worker.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-900">{worker.name}</h2>
                <p className="text-sm text-gray-500 mt-1">{getCategoryDisplay(worker.category)}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-600">
                  {worker.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      {worker.phone}
                    </span>
                  )}
                  {worker.id_number && (
                    <span className="flex items-center gap-1">
                      <IdCard className="h-3.5 w-3.5" />
                      {worker.id_number}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-gray-500">Daily Wage</p>
                <p className="text-2xl font-bold text-[#22C55E]">{formatNPR(worker.daily_wage)}</p>
                <p className="text-xs text-gray-400 mt-0.5">per day</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Daily Wage"
              value={formatNPR(worker.daily_wage)}
              icon={Wallet}
              iconClass="bg-green-50 text-green-600"
              valueClass="text-[#22C55E]"
            />
            <StatCard
              label="Category"
              value={getCategoryDisplay(worker.category)}
              icon={HardHat}
              iconClass="bg-blue-50 text-blue-600"
            />
            <StatCard
              label="Assigned Site"
              value={worker.assigned_site_name || "Unassigned"}
              icon={Building2}
              iconClass="bg-orange-50 text-orange-600"
            />
            <StatCard
              label="Status"
              value={worker.status.charAt(0).toUpperCase() + worker.status.slice(1)}
              icon={User}
              iconClass={
                worker.status === "active"
                  ? "bg-green-50 text-green-600"
                  : "bg-gray-100 text-gray-500"
              }
              valueClass={worker.status === "active" ? "text-green-600" : "text-gray-500"}
            />
          </div>

          {/* Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`${constructionCardClass} p-6`}>
              <div className="flex items-center gap-2 mb-5">
                <User className="h-5 w-5 text-[#22C55E]" />
                <h3 className="text-base font-semibold text-gray-900">Personal Information</h3>
              </div>
              <div className="space-y-4">
                <DetailItem label="Full Name">{worker.name}</DetailItem>
                <DetailItem label="Phone">{worker.phone || "—"}</DetailItem>
                <DetailItem label="ID Number">{worker.id_number || "—"}</DetailItem>
                <DetailItem label="Emergency Contact">{worker.emergency_contact || "—"}</DetailItem>
                <DetailItem label="Address">
                  {worker.address ? (
                    <span className="flex items-start gap-1.5 font-normal text-gray-700">
                      <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-gray-400" />
                      {worker.address}
                    </span>
                  ) : (
                    "—"
                  )}
                </DetailItem>
              </div>
            </div>

            <div className={`${constructionCardClass} p-6`}>
              <div className="flex items-center gap-2 mb-5">
                <HardHat className="h-5 w-5 text-[#22C55E]" />
                <h3 className="text-base font-semibold text-gray-900">Work Information</h3>
              </div>
              <div className="space-y-4">
                <DetailItem label="Category">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(worker.category)}`}
                  >
                    {getCategoryDisplay(worker.category)}
                  </span>
                </DetailItem>
                <DetailItem label="Daily Wage">
                  <span className="text-[#22C55E]">{formatNPR(worker.daily_wage)}</span>
                </DetailItem>
                <DetailItem label="Status">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(worker.status)}`}
                  >
                    {worker.status}
                  </span>
                </DetailItem>
                <DetailItem label="Assigned Site">
                  {worker.assigned_site && worker.assigned_site_name ? (
                    <Link
                      href={`/dashboard/construction/sites/${worker.assigned_site}`}
                      className="text-[#22C55E] hover:underline font-medium"
                    >
                      {worker.assigned_site_name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </DetailItem>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className={`${constructionCardClass} p-6`}>
            <h3 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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

          {/* Record info */}
          <div className={`${constructionCardClass} p-6`}>
            <div className="flex items-center gap-2 mb-5">
              <Clock className="h-5 w-5 text-[#22C55E]" />
              <h3 className="text-base font-semibold text-gray-900">Record Information</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailItem label="Created At">
                {formatDateTime(worker.created_at)}
              </DetailItem>
              <DetailItem label="Last Updated">
                {formatDateTime(worker.updated_at)}
              </DetailItem>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
