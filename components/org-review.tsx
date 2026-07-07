"use client";

import { useState } from "react";
import {
  Building2,
  MapPin,
  Calendar,
  CheckCircle2,
  XCircle,
  Globe,
  Briefcase,
  Package,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { OrgWizardFooter } from "@/components/org-wizard-footer";
import { tenantApi } from "@/lib/api/tenant";
import { useAuth } from "@/lib/context/AuthContext";
import { getModuleById } from "@/lib/modules/catalog";

interface OrgReviewProps {
  organizationData: {
    name: string;
    business_type: string;
    address: string;
    accounting_start_date: string;
    vat_registered: boolean;
    workspace_name: string;
    owner_name?: string;
    email?: string;
    phone?: string;
    logo?: File | null;
  };
  selectedModules: string[];
  onBack: () => void;
  onEdit: () => void;
  onCreationStart: () => void;
  onCreationSuccess: (orgName: string) => void;
  onCreationError: () => void;
}

const businessTypeLabels: Record<string, string> = {
  construction: "Construction",
  hardware: "Hardware",
  retail: "Retail",
  wholesale: "Wholesale",
  manufacturing: "Manufacturing",
  services: "Services",
  other: "Other",
};

function DetailRow({
  icon: Icon,
  label,
  value,
  valueClassName,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100">
        <Icon className="h-4 w-4 text-gray-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`text-sm font-medium text-gray-900 mt-0.5 break-words ${valueClassName ?? ""}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

export function OrgReview({
  organizationData,
  selectedModules,
  onBack,
  onEdit,
  onCreationStart,
  onCreationSuccess,
  onCreationError,
}: OrgReviewProps) {
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const workspaceUrl = organizationData.workspace_name
    ? `${organizationData.workspace_name.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-")}.khata.app`
    : "your-workspace.khata.app";

  const handleSubmit = async () => {
    setLoading(true);
    onCreationStart();

    try {
      const tenant = await tenantApi.create({
        ...organizationData,
        active_modules: selectedModules,
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      try {
        await refreshUser();
      } catch (error) {
        console.error("[OrgReview] Failed to refresh user:", error);
      }

      onCreationSuccess(tenant.name);
    } catch (err: unknown) {
      onCreationError();
      setLoading(false);

      const error = err as { response?: { status?: number; data?: Record<string, unknown> } };
      if (error.response?.status === 400) {
        const errorData = error.response?.data;
        if (errorData?.name) {
          toast.error(`Organization Name: ${(errorData.name as string[])[0]}`);
        } else if (errorData?.active_modules) {
          const msg = errorData.active_modules;
          toast.error(Array.isArray(msg) ? String(msg[0]) : String(msg));
        } else {
          toast.error(String(errorData?.detail || "Invalid data. Please check your input."));
        }
      } else if (error.response?.status === 500) {
        toast.error("Server error. Please try again later.");
      } else {
        toast.error(String(error.response?.data?.detail || "Failed to create organization."));
      }
    }
  };

  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-gray-900">Organization</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="h-8 text-[#22C55E] hover:text-[#16A34A] hover:bg-green-50"
            >
              Edit
            </Button>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50/50 px-4">
            <DetailRow icon={Building2} label="Name" value={organizationData.name} />
            <DetailRow
              icon={Globe}
              label="Workspace URL"
              value={workspaceUrl}
              valueClassName="font-mono text-[#16A34A] text-xs sm:text-sm"
            />
            <DetailRow
              icon={Briefcase}
              label="Industry"
              value={
                businessTypeLabels[organizationData.business_type] ||
                organizationData.business_type
              }
            />
            <DetailRow icon={MapPin} label="Address" value={organizationData.address} />
            <DetailRow
              icon={Calendar}
              label="Accounting start"
              value={formatDate(organizationData.accounting_start_date)}
            />
            <DetailRow
              icon={organizationData.vat_registered ? CheckCircle2 : XCircle}
              label="VAT registered"
              value={organizationData.vat_registered ? "Yes" : "No"}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-gray-900">
              Modules ({selectedModules.length})
            </h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="h-8 text-[#22C55E] hover:text-[#16A34A] hover:bg-green-50"
            >
              Edit
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {selectedModules.map((moduleId) => {
              const moduleDef = getModuleById(moduleId);
              const IconComponent = moduleDef?.icon ?? Package;
              const moduleName = moduleDef?.name ?? moduleId;

              return (
                <div
                  key={moduleId}
                  className="flex items-center gap-2.5 rounded-lg border border-green-100 bg-green-50/60 px-3 py-2.5"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-green-100">
                    <IconComponent className="h-4 w-4 text-[#22C55E]" />
                  </div>
                  <span className="text-sm font-medium text-gray-900 truncate">{moduleName}</span>
                </div>
              );
            })}
          </div>
          {selectedModules.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-8">No modules selected</p>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-6 leading-relaxed">
        By creating your organization, you agree to Khata&apos;s Terms of Service and Privacy Policy.
        You can update these settings anytime after setup.
      </p>

      <OrgWizardFooter
        onBack={onBack}
        onPrimary={handleSubmit}
        primaryLabel="Create Organization"
        primaryDisabled={loading}
        primaryLoading={loading}
      />
    </div>
  );
}
