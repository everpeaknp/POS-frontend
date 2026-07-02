"use client";

import { MoreVertical, AlertTriangle, ExternalLink, ShoppingCart } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Organization } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { tenantApi } from "@/lib/api/tenant";
import { useAuth } from "@/lib/context/AuthContext";

interface OrgCardProps {
  org: Organization;
  onDelete?: () => void;
}

export function OrgCard({ org, onDelete }: OrgCardProps) {
  const router = useRouter();
  const { switchOrganization } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [isOpeningPos, setIsOpeningPos] = useState(false);
  
  // Check if user is a member of THIS specific organization
  // user_role is set by backend if user has membership in this tenant
  const isMember = !!org.user_role;

  const handleOpenKhata = async () => {
    try {
      setIsOpening(true);
      await switchOrganization(org.slug);
      toast.success(`Opened ${org.workspace_name || org.name}`);
    } catch (error: unknown) {
      console.error("Failed to switch organization:", error);
      const err = error as { response?: { data?: { error?: string; detail?: string }; status?: number } };
      const message =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        (err.response?.status === 404 ? "Organization not found" : "Failed to open organization. Please try again.");
      toast.error(message);
    } finally {
      setIsOpening(false);
    }
  };

  const handleOpenPOS = async () => {
    try {
      setIsOpeningPos(true);
      await switchOrganization(org.slug, "/dashboard/pos");
      toast.success(`Opened POS for ${org.workspace_name || org.name}`);
    } catch (error: unknown) {
      console.error("Failed to open POS:", error);
      const err = error as { response?: { data?: { error?: string; detail?: string }; status?: number } };
      const message =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        (err.response?.status === 404 ? "Organization not found" : "Failed to open POS. Please try again.");
      toast.error(message);
    } finally {
      setIsOpeningPos(false);
    }
  };

  const handleEdit = () => {
    router.push(`/erp/${org.slug}/edit`);
  };

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    try {
      setIsDeleting(true);
      const slug = org.slug;
      await tenantApi.delete(slug);
      toast.success("Organization deleted successfully");
      setShowDeleteConfirm(false);
      if (onDelete) {
        onDelete();
      }
    } catch (error: any) {
      // Handle different error types
      if (error.response?.status === 403) {
        const errorMsg = error.response?.data?.detail || "Only admins can delete the organization";
        toast.error(errorMsg);
      } else if (error.response?.status === 404) {
        toast.error("Organization not found");
      } else if (error.response?.status === 500) {
        toast.error("Server error. Please ensure you're an admin and try again.");
      } else {
        toast.error(error.response?.data?.detail || "Failed to delete organization");
      }
      
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-3 h-full min-h-[220px] hover:shadow-md hover:border-green-100 transition-all group">
      <div className="flex items-start justify-between">
        <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-2xl border border-green-100">
          {org.icon}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="text-gray-300 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-50 focus:outline-none opacity-0 group-hover:opacity-100 transition-all" aria-label="Options">
            <MoreVertical className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem 
              className="cursor-pointer text-sm"
              onClick={handleEdit}
            >
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="cursor-pointer text-sm text-red-600 focus:text-red-600"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : showDeleteConfirm ? "Click again to confirm" : "Delete"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 text-base">{org.workspace_name || org.name}</h3>
        <p className="text-xs text-gray-400 mt-0.5 font-mono">{org.subdomain}</p>
        {org.user_role && (
          <p className="text-xs text-gray-500 capitalize mt-1">
            Role: <span className="font-medium text-gray-700">{org.user_role}</span>
          </p>
        )}
      </div>
      {org.status === "trial" && org.trialDaysLeft > 0 && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          <span className="text-xs text-amber-700 font-medium">Trial ends in {org.trialDaysLeft} days</span>
        </div>
      )}
      <div className="flex gap-2 pt-1 mt-auto">
        {isMember ? (
          <>
            <Button size="sm" className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-semibold h-8 gap-1.5"
              onClick={handleOpenKhata}
              disabled={isOpening}>
              <ExternalLink className="h-3 w-3" /> {isOpening ? "Opening..." : "Open Khata"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 border-[#22C55E] text-[#22C55E] hover:bg-green-50 text-xs font-semibold h-8 gap-1.5"
              onClick={handleOpenPOS}
              disabled={isOpeningPos || isOpening}
            >
              <ShoppingCart className="h-3 w-3" /> {isOpeningPos ? "Opening..." : "Open POS"}
            </Button>
          </>
        ) : (
          <div className="flex-1 text-center py-2 px-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-xs text-gray-500">Accept invitation to access this organization</p>
          </div>
        )}
      </div>
    </div>
  );
}
