"use client";

import { MoreVertical, AlertTriangle, ExternalLink, Settings, Building2, Wallet, HardHat, Wrench, ShoppingBag } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Organization } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { tenantApi } from "@/lib/api/tenant";
import { useAuth } from "@/lib/context/AuthContext";
import { isTenantOrgAdmin } from "@/lib/tenant/admin-access";
import { KhataLoading } from "@/components/shared/KhataLoading";

interface OrgCardProps {
  org: Organization;
  onDelete?: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

export function OrgCard({ org, onDelete, dragHandleProps }: OrgCardProps) {
  const router = useRouter();
  const { switchOrganization } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  
  // Check if user is a member of THIS specific organization
  // user_role is set by backend if user has membership in this tenant
  const isMember = !!org.user_role;
  const isSuperAdmin = org.user_role === "super_admin" || !!org.can_delete;
  const canManageOrg = isTenantOrgAdmin(org.user_role);
  const isWorkspaceActive = org.status === "active";
  const isPersonalAccount = org.account_type === "personal";
  const roleLabel = isPersonalAccount
    ? "Personal"
    : org.user_role === "super_admin"
      ? "Super Admin"
      : org.user_role
        ? org.user_role.replace(/_/g, " ")
        : null;

  // Get account type label
  const getAccountTypeLabel = () => {
    switch (org.account_type) {
      case "personal":
        return "Personal";
      case "construction":
        return "Construction";
      case "hardware":
        return "Hardware";
      case "retail":
        return "Retail";
      default:
        return "Organization";
    }
  };

  const handleOpenKhata = async () => {
    try {
      setIsOpening(true);
      
      // Show loading toast
      toast.loading(`Opening ${org.workspace_name || org.name}...`, {
        id: 'workspace-open',
      });
      
      // Switch organization in current tab
      await switchOrganization(org.slug, '/dashboard');
      
      // Show success toast
      toast.success(`Opened ${org.workspace_name || org.name}`, {
        id: 'workspace-open',
      });
    } catch (error: unknown) {
      console.error("Failed to switch organization:", error);
      const err = error as { response?: { data?: { error?: string; detail?: string }; status?: number } };
      const message =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        (err.response?.status === 404 ? "Workplace not found" : "Failed to open workplace. Please try again.");
      toast.error(message, {
        id: 'workspace-open',
      });
      setIsOpening(false);
    }
  };

  const handleOpenSettings = () => {
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
      toast.success("Workplace deleted successfully");
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
        toast.error("Workplace not found");
      } else if (error.response?.status === 500) {
        toast.error("Server error. Please ensure you're an admin and try again.");
      } else {
        toast.error(error.response?.data?.detail || "Failed to delete workplace");
      }
      
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
    <div className="bg-card rounded-xl border border-border p-5 flex flex-col gap-3 h-full min-h-[200px] hover:shadow-md hover:border-[var(--color-accent-custom,#22C55E)]/30 transition-all">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div 
            {...dragHandleProps}
            className="w-12 h-12 rounded-xl bg-[var(--color-accent-custom,#22C55E)]/10 flex items-center justify-center text-lg font-bold border border-[var(--color-accent-custom,#22C55E)]/20 overflow-hidden shrink-0 cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-[var(--color-accent-custom,#22C55E)]/30 transition-all"
            title="Drag to reorder"
          >
            {org.logo ? (
              <img src={org.logo} alt="" className="w-full h-full object-cover" />
            ) : org.account_type === "personal" ? (
              <Wallet className="h-6 w-6 text-[var(--color-accent-custom,#16A34A)]" />
            ) : org.account_type === "construction" ? (
              <HardHat className="h-6 w-6 text-[var(--color-accent-custom,#16A34A)]" />
            ) : org.account_type === "hardware" ? (
              <Wrench className="h-6 w-6 text-[var(--color-accent-custom,#16A34A)]" />
            ) : org.account_type === "retail" ? (
              <ShoppingBag className="h-6 w-6 text-[var(--color-accent-custom,#16A34A)]" />
            ) : (
              <Building2 className="h-6 w-6 text-[var(--color-accent-custom,#16A34A)]" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground mb-0.5">{getAccountTypeLabel()}</p>
            {roleLabel && (
              <p className="text-xs text-muted-foreground">
                Role:{" "}
                <span className={`font-medium text-foreground ${isPersonalAccount || isSuperAdmin ? "" : "capitalize"}`}>
                  {roleLabel}
                </span>
              </p>
            )}
          </div>
        </div>
        {(canManageOrg || isSuperAdmin) && (
        <DropdownMenu>
          <DropdownMenuTrigger
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-custom,#22C55E)]/30"
            aria-label="Options"
          >
            <MoreVertical className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {canManageOrg && (
              <DropdownMenuItem 
                className="cursor-pointer text-sm"
                onClick={handleOpenSettings}
              >
                Edit
              </DropdownMenuItem>
            )}
            {isSuperAdmin && (
              <>
                {canManageOrg && <DropdownMenuSeparator />}
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
        )}
      </div>
      <div className="min-w-0">
        <h3
          className="font-semibold text-foreground text-base truncate"
          title={org.workspace_name || org.name}
        >
          {org.workspace_name || org.name}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate" title={org.subdomain}>
          {org.subdomain}
        </p>
      </div>
      {org.status === "expired" && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
          <span className="text-xs text-red-600 dark:text-red-300 font-medium">Workspace deactivated</span>
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-2 pt-1 mt-auto">
        {isMember && isWorkspaceActive ? (
          <>
            <Button 
              size="sm" 
              className="flex-1 bg-[var(--color-accent-custom,#22C55E)] hover:bg-[var(--color-accent-custom-600,#16A34A)] text-white text-xs font-semibold h-9 gap-1.5"
              onClick={handleOpenKhata}
            >
              <ExternalLink className="h-3 w-3" /> Open Khata
            </Button>
            {canManageOrg && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 border-[var(--color-accent-custom,#22C55E)] text-[var(--color-accent-custom,#22C55E)] hover:bg-[var(--color-accent-custom,#22C55E)]/10 text-xs font-semibold h-9 gap-1.5"
                onClick={handleOpenSettings}
              >
                <Settings className="h-3 w-3" /> Settings
              </Button>
            )}
          </>
        ) : !isMember ? (
          <div className="flex-1 text-center py-2 px-3 bg-muted border border-border rounded-lg">
            <p className="text-xs text-muted-foreground">Accept invitation to access this workplace</p>
          </div>
        ) : (
          <div className="flex-1 text-center py-2 px-3 bg-muted border border-border rounded-lg">
            <p className="text-xs text-muted-foreground">This workspace is no longer active</p>
          </div>
        )}
      </div>
    </div>
    {isOpening && <KhataLoading message={`Opening ${org.workspace_name || org.name}...`} />}
    </>
  );
}
