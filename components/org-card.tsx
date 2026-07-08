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
  const isSuperAdmin = org.user_role === "super_admin" || !!org.can_delete;
  const roleLabel =
    org.user_role === "super_admin"
      ? "Super Admin"
      : org.user_role
        ? org.user_role.replace(/_/g, " ")
        : null;

  const handleOpenKhata = async () => {
    try {
      setIsOpening(true);
      const switchedTenant = await tenantApi.switch(org.slug);
      localStorage.setItem("active_tenant_slug", switchedTenant.slug);
      window.open("/dashboard", "_blank", "noopener,noreferrer");
      toast.success(`Opened ${org.workspace_name || org.name} in a new tab`);
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
        const errorMsg =
          error.response?.data?.detail ||
          "Only the Super Admin who created this business can delete it";
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
    <div className="bg-card rounded-xl border border-border p-5 flex flex-col gap-3 h-full min-h-[200px] hover:shadow-md hover:border-[#22C55E]/30 transition-all">
      <div className="flex items-start justify-between gap-2">
        <div className="w-12 h-12 rounded-xl bg-[#22C55E]/10 flex items-center justify-center text-lg font-bold border border-[#22C55E]/20 overflow-hidden shrink-0">
          {org.logo ? (
            <img src={org.logo} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[#16A34A]">{org.icon}</span>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22C55E]/30"
            aria-label="Options"
          >
            <MoreVertical className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem 
              className="cursor-pointer text-sm"
              onClick={handleEdit}
            >
              Edit
            </DropdownMenuItem>
            {isSuperAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer text-sm text-red-600 focus:text-red-600"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : showDeleteConfirm ? "Click again to confirm" : "Delete"}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div>
        <h3 className="font-semibold text-foreground text-base">{org.workspace_name || org.name}</h3>
        <p className="text-xs text-muted-foreground mt-0.5 font-mono">{org.subdomain}</p>
        {roleLabel && (
          <p className="text-xs text-muted-foreground mt-1">
            Role:{" "}
            <span className={`font-medium ${isSuperAdmin ? "text-[#16A34A]" : "text-foreground capitalize"}`}>
              {roleLabel}
            </span>
          </p>
        )}
      </div>
      {org.status === "trial" && org.trialDaysLeft > 0 && (
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          <span className="text-xs text-amber-600 dark:text-amber-300 font-medium">Trial ends in {org.trialDaysLeft} days</span>
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-2 pt-1 mt-auto">
        {isMember ? (
          <>
            <Button size="sm" className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-semibold h-9 gap-1.5"
              onClick={handleOpenKhata}
              disabled={isOpening}>
              <ExternalLink className="h-3 w-3" /> {isOpening ? "Opening..." : "Open Khata"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 border-[#22C55E] text-[#22C55E] hover:bg-[#22C55E]/10 text-xs font-semibold h-9 gap-1.5"
              onClick={handleOpenPOS}
              disabled={isOpeningPos || isOpening}
            >
              <ShoppingCart className="h-3 w-3" /> {isOpeningPos ? "Opening..." : "Open POS"}
            </Button>
          </>
        ) : (
          <div className="flex-1 text-center py-2 px-3 bg-muted border border-border rounded-lg">
            <p className="text-xs text-muted-foreground">Accept invitation to access this organization</p>
          </div>
        )}
      </div>
    </div>
  );
}
