"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  ArrowRight, 
  Building2,
  MapPin,
  Calendar,
  CheckCircle2,
  XCircle,
  Globe,
  Briefcase,
  BarChart3,
  Package,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Users,
  HardHat,
  Wrench,
  Monitor,
  Settings,
  type LucideIcon
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { tenantApi } from "@/lib/api/tenant";
import { useAuth } from "@/lib/context/AuthContext";

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

const moduleIcons: Record<string, LucideIcon> = {
  accounting: BarChart3,
  inventory: Package,
  sales: DollarSign,
  purchase: ShoppingCart,
  reports: TrendingUp,
  pos: Monitor,
  hr: Users,
  construction: HardHat,
  hardware: Wrench,
  settings: Settings,
};

const moduleNames: Record<string, string> = {
  accounting: "Accounting",
  inventory: "Inventory Management",
  sales: "Sales & Billing",
  purchase: "Purchase Management",
  reports: "Reports & Analytics",
  pos: "Point of Sale (POS)",
  hr: "HR & Payroll",
  construction: "Construction Management",
  hardware: "Hardware Business",
  settings: "Settings",
};

const businessTypeLabels: Record<string, string> = {
  construction: "Construction",
  hardware: "Hardware",
  retail: "Retail",
  wholesale: "Wholesale",
  manufacturing: "Manufacturing",
  services: "Services",
  other: "Other",
};

export function OrgReview({ 
  organizationData, 
  selectedModules, 
  onBack, 
  onEdit,
  onCreationStart,
  onCreationSuccess,
  onCreationError
}: OrgReviewProps) {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  // Generate workspace URL
  const workspaceUrl = organizationData.workspace_name
    ? `${organizationData.workspace_name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')}.khata.app`
    : "your-workspace.khata.app";

  const handleSubmit = async () => {
    setLoading(true);
    onCreationStart(); // Show loading screen
    
    try {
      // Create tenant with all data
      const tenant = await tenantApi.create({
        ...organizationData,
        active_modules: selectedModules,
      });

      // Wait for backend to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Refresh user data
      console.log('[OrgReview] Refreshing user data...');
      try {
        await refreshUser();
        console.log('[OrgReview] User data refreshed');
      } catch (error) {
        console.error('[OrgReview] Failed to refresh user:', error);
      }

      // Show success screen
      onCreationSuccess(tenant.name);
      
    } catch (err: any) {
      onCreationError(); // Hide loading screen
      setLoading(false);
      
      if (err.response?.status === 400) {
        const errorData = err.response?.data;
        if (errorData?.name) {
          toast.error(`Organization Name: ${errorData.name[0]}`);
        } else {
          toast.error(errorData?.detail || "Invalid data. Please check your input.");
        }
      } else if (err.response?.status === 500) {
        toast.error("Server error. Please try again later.");
      } else {
        toast.error(err.response?.data?.detail || "Failed to create organization. Please try again.");
      }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Your Organization</h2>
        <p className="text-sm text-gray-600">
          Please review the information below before submitting your registration
        </p>
      </div>

      {/* Organization Details Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Organization Details</h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="text-[#22C55E] hover:text-[#16A34A] hover:bg-green-50"
          >
            Edit
          </Button>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div className="flex items-start gap-3">
            <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">Name</p>
              <p className="text-sm font-medium text-gray-900">{organizationData.name}</p>
            </div>
          </div>

          {/* Workspace URL */}
          <div className="flex items-start gap-3">
            <Globe className="h-5 w-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">Workspace URL</p>
              <p className="text-sm font-medium text-blue-600 font-mono">{workspaceUrl}</p>
            </div>
          </div>

          {/* Industry */}
          <div className="flex items-start gap-3">
            <Briefcase className="h-5 w-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">Industry</p>
              <p className="text-sm font-medium text-gray-900">
                {businessTypeLabels[organizationData.business_type] || organizationData.business_type}
              </p>
            </div>
          </div>

          {/* Address */}
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">Address</p>
              <p className="text-sm font-medium text-gray-900">{organizationData.address}</p>
            </div>
          </div>

          {/* Accounting Start Date */}
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">Accounting Start Date</p>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(organizationData.accounting_start_date)}
              </p>
            </div>
          </div>

          {/* VAT Registered */}
          <div className="flex items-start gap-3">
            {organizationData.vat_registered ? (
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 text-gray-400 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">VAT Registered</p>
              <p className="text-sm font-medium text-gray-900">
                {organizationData.vat_registered ? "Yes" : "No"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Features Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Selected Features</h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-[#22C55E] hover:text-[#16A34A] hover:bg-green-50"
          >
            Edit
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {selectedModules.map((moduleId) => {
            const IconComponent = moduleIcons[moduleId];
            const moduleName = moduleNames[moduleId];

            return (
              <div
                key={moduleId}
                className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg"
              >
                <div className="p-2 bg-green-100 rounded-lg">
                  <IconComponent className="h-4 w-4 text-[#22C55E]" />
                </div>
                <span className="text-sm font-medium text-gray-900">{moduleName}</span>
              </div>
            );
          })}
        </div>

        {selectedModules.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            No modules selected
          </p>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Note:</strong> By clicking "Create Organization", you agree to our Terms of Service and Privacy Policy. You can modify these settings later from your organization settings.
        </p>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={loading}
          className="px-5 h-11 border-gray-300 text-gray-700 hover:bg-gray-50 gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 h-11 bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold disabled:opacity-40 gap-1.5 rounded-lg text-base"
        >
          {loading ? "Creating Organization..." : "Create Organization"} <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
