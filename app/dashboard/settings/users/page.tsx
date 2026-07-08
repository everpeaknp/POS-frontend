"use client";

import { FormattedDate } from "@/components/shared/FormattedDate";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MoreVertical, Trash2, X, Search, Mail, Shield, Users, UserPlus, CircleCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ManagePermissionsModal } from "@/components/settings/ManagePermissionsModal";
import {
  buildFullRolePermissions,
  countEnabledPermissions,
  getAllPermissionKeys,
} from "@/lib/permissions/catalog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DashHeader } from "@/components/dashboard/dash-header";
import { EmptyState } from "@/components/shared/EmptyState";  
import { SkeletonTable } from "@/components/shared/Skeleton";
import apiClient from "@/lib/api/client";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";
import { invitationApi, Invitation, tenantApi, TenantUserLimits } from "@/lib/api/tenant";
import { permissionsApi, PermissionsMatrix, usersApi, EmployeeInviteOption } from "@/lib/api/auth";
import { usePermissions } from "@/lib/hooks/usePermissions";
import toast from "react-hot-toast";

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  phone?: string;
  is_active: boolean;
  last_login?: string;
  date_joined: string;
  permissions?: any;
  is_super_admin?: boolean;
}

const roleOptions = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "supervisor", label: "Supervisor" },
  { value: "accountant", label: "Accountant" },
  { value: "cashier", label: "Cashier" },
  { value: "viewer", label: "Viewer" },
];

const roleLabel = (role: string) => {
  if (role === "super_admin") return "Super Admin";
  return roleOptions.find((r) => r.value === role)?.label || role;
};

const roleColors: Record<string, string> = {
  super_admin: "bg-emerald-100 text-emerald-800",
  admin: "bg-purple-100 text-purple-700",
  manager: "bg-blue-100 text-blue-700",
  supervisor: "bg-green-100 text-green-700",
  accountant: "bg-orange-100 text-orange-700",
  cashier: "bg-teal-100 text-teal-700",
  viewer: "bg-gray-100 text-gray-600",
};

const cardClass =
  "bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border shadow-sm";
const tableWrapClass = `${cardClass} overflow-hidden`;
const inputClass =
  "w-full h-9 pl-10 pr-4 text-sm border border-gray-200 dark:border-border rounded-lg bg-white dark:bg-card focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent";

export default function UsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: currentUser } = useAuth();
  const { canEdit, canInviteUsers, canAssignRoles, canConfigurePermissions, loading: permissionsLoading } = usePermissions();
  const canManageSettings = canEdit("settings");
  const canInvite = canInviteUsers();
  const canChangeRoles = canAssignRoles();
  const canSetPermissions = canConfigurePermissions();
  const canManageUsers = canManageSettings || canInvite || canChangeRoles || canSetPermissions;
  const [users, setUsers] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [userLimits, setUserLimits] = useState<TenantUserLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState<number | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<'users' | 'invitations'>('users');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [showActiveConfirm, setShowActiveConfirm] = useState(false);
  const [userToToggleActive, setUserToToggleActive] = useState<User | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [userToChangeRole, setUserToChangeRole] = useState<{id: number, currentRole: string} | null>(null);
  const [newRole, setNewRole] = useState("");
  const [inviteData, setInviteData] = useState({
    invited_user_email: "",
    role: "viewer",
    message: "",
  });
  const [errors, setErrors] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);
  const [employees, setEmployees] = useState<EmployeeInviteOption[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [userForPermissions, setUserForPermissions] = useState<User | null>(null);
  const [rolePermissions, setRolePermissions] = useState<Record<string, boolean>>({});
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [permissionsMatrix, setPermissionsMatrix] = useState<PermissionsMatrix | null>(null);
  const activeModules = currentUser?.tenant?.active_modules;
  const totalPermissionSlots = getAllPermissionKeys(activeModules).length;

  useEffect(() => {
    fetchUsers();
    fetchInvitations();
    fetchUserLimits();
    fetchPermissionsMatrix();
  }, []);

  const fetchPermissionsMatrix = async () => {
    try {
      const data = await permissionsApi.getPermissions();
      setPermissionsMatrix(data);
    } catch {
      try {
        const mine = await permissionsApi.getMyPermissions();
        setPermissionsMatrix(mine);
      } catch (error) {
        console.error("Failed to fetch permissions matrix:", error);
        setPermissionsMatrix(null);
      }
    }
  };

  const countRolePermissions = (role: string): number | null => {
    if (!permissionsMatrix) return null;
    if (role === "super_admin") return totalPermissionSlots;
    const roleKey = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
    const perms = permissionsMatrix[roleKey as keyof PermissionsMatrix];
    return countEnabledPermissions(perms, activeModules);
  };

  useEffect(() => {
    if (canInvite) {
      fetchEmployees();
    }
  }, [canInvite]);

  const fetchUserLimits = async () => {
    try {
      const tenant = await tenantApi.getCurrent();
      setUserLimits(tenant.user_limits ?? null);
    } catch (error) {
      console.error("Failed to fetch user limits:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/auth/users/");
      // API returns paginated data: {count, next, previous, results}
      setUsers(response.data.results || response.data);
    } catch (error: any) {
      console.error("Failed to fetch users:", error);
      if (error.response?.status === 500 || error.response?.status === 403) {
        // User has no tenant - show helpful message
        toast.error("Please create or join an organization first");
        setTimeout(() => {
          window.location.href = "/erp";
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async () => {
    try {
      const response = await invitationApi.getSent();
      setInvitations(response.data);
    } catch (error: any) {
      console.error("Failed to fetch invitations:", error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await usersApi.getEmployeeInviteOptions();
      setEmployees(response.results || []);
    } catch (error: unknown) {
      const err = error as { response?: { status?: number } };
      if (err.response?.status !== 403) {
        console.error("Failed to fetch employee invite options:", error);
      }
      setEmployees([]);
    }
  };

  const handleInvite = useCallback(() => {
    if (!canInvite) {
      toast.error("You don't have permission to invite users");
      return;
    }
    if (userLimits && !userLimits.can_invite) {
      toast.error(
        userLimits.max_users != null
          ? `Your ${userLimits.plan_name} plan allows up to ${userLimits.max_users} users. Upgrade to invite more.`
          : "You cannot invite more users on your current plan."
      );
      return;
    }
    setInviteData({
      invited_user_email: "",
      role: "viewer",
      message: "",
    });
    setSelectedEmployee("");
    setErrors({});
    setShowInviteModal(true);
  }, [canInvite, userLimits]);

  useEffect(() => {
    if (searchParams.get("invite") !== "1") return;
    if (permissionsLoading) return;

    handleInvite();
    router.replace("/dashboard/settings/users", { scroll: false });
  }, [searchParams, permissionsLoading, handleInvite, router]);

  const handleEmployeeSelect = (employeeId: string) => {
    setSelectedEmployee(employeeId);

    if (!employeeId) {
      setInviteData({
        invited_user_email: "",
        role: "viewer",
        message: "",
      });
      return;
    }

    const employee = employees.find((e) => String(e.id) === String(employeeId));

    if (employee) {
      const suggestedRole = mapDesignationToRole(employee.designation);
      setInviteData({
        invited_user_email: employee.email,
        role: suggestedRole,
        message: `Hi ${employee.name},\n\nYou are invited to join our organization as ${employee.designation}.\n\nBest regards`,
      });
      toast.success(`Auto-filled: ${employee.name} (${suggestedRole})`);
    } else {
      toast.error("Employee not found");
    }
  };

  // Map employee designation to system role
  const mapDesignationToRole = (designation: string): string => {
    const designationLower = designation.toLowerCase();
    
    // Admin roles
    if (designationLower.includes('ceo') || 
        designationLower.includes('director') || 
        designationLower.includes('owner') ||
        designationLower.includes('president')) {
      return 'admin';
    }
    
    // Manager roles
    if (designationLower.includes('manager') || 
        designationLower.includes('head') || 
        designationLower.includes('lead')) {
      return 'manager';
    }
    
    // Supervisor roles (includes POS management)
    if (designationLower.includes('supervisor') || 
        designationLower.includes('coordinator') || 
        designationLower.includes('team lead') ||
        designationLower.includes('cashier')) {
      return 'supervisor';
    }
    
    // Accountant roles
    if (designationLower.includes('accountant') || 
        designationLower.includes('finance') || 
        designationLower.includes('accounts')) {
      return 'accountant';
    }
    
    // Default to viewer for all other roles
    return 'viewer';
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});

    try {
      await invitationApi.create(inviteData);
      toast.success("Invitation sent successfully!");
      await fetchInvitations();
      await fetchUserLimits();
      setShowInviteModal(false);
      // Reset form
      setInviteData({
        invited_user_email: "",
        role: "viewer",
        message: "",
      });
      setSelectedEmployee("");
    } catch (error: any) {
      // Check if error.response.data exists and has content
      const hasErrorData = error.response?.data && 
                          typeof error.response.data === 'object' && 
                          Object.keys(error.response.data).length > 0;
      
      if (hasErrorData) {
        setErrors(error.response.data);
        
        // Extract all error messages
        const errorData = error.response.data;
        let errorMessages: string[] = [];
        
        // Check for field-specific errors
        if (errorData.invited_user_email) {
          const emailError = Array.isArray(errorData.invited_user_email) 
            ? errorData.invited_user_email[0] 
            : errorData.invited_user_email;
          
          // Keep API validation messages as-is for invite failures
          errorMessages.push(emailError);
        }
        if (errorData.invited_user) {
          errorMessages.push(Array.isArray(errorData.invited_user) ? errorData.invited_user[0] : errorData.invited_user);
        }
        if (errorData.role) {
          errorMessages.push(Array.isArray(errorData.role) ? errorData.role[0] : errorData.role);
        }
        if (errorData.detail) {
          errorMessages.push(errorData.detail);
        }
        if (errorData.non_field_errors) {
          errorMessages.push(Array.isArray(errorData.non_field_errors) ? errorData.non_field_errors[0] : errorData.non_field_errors);
        }
        
        // If no specific errors found, show generic message
        if (errorMessages.length === 0) {
          errorMessages.push("Failed to send invitation. Please check the form and try again.");
        }
        
        // Show all error messages as toasts
        errorMessages.forEach(msg => toast.error(msg));
      } else {
        // Fallback for unexpected errors
        toast.error("Failed to send invitation. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelInvitation = async (id: number) => {
    if (!confirm("Are you sure you want to cancel this invitation?")) return;

    try {
      await invitationApi.cancel(id);
      toast.success("Invitation cancelled");
      await fetchInvitations();
      await fetchUserLimits();
    } catch (error: any) {
      console.error("Failed to cancel invitation:", error);
      toast.error("Failed to cancel invitation");
    }
  };

  const isSuperAdminUser = (user?: User | null) => {
    if (!user) return false;
    if (user.is_super_admin === true || user.role === "super_admin") return true;
    const createdBy = currentUser?.tenant?.created_by;
    if (createdBy == null) return false;
    return Number(createdBy) === Number(user.id);
  };

  const handleDeleteClick = (userId: number) => {
    const target = users.find((u) => u.id === userId);
    if (isSuperAdminUser(target)) {
      toast.error("No one can remove the Super Admin");
      setMenu(null);
      return;
    }
    setUserToDelete(userId);
    setShowDeleteConfirm(true);
    setMenu(null);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    const loadingToast = toast.loading("Removing user...");
    
    try {
      await apiClient.delete(`/auth/users/${userToDelete}/`);
      toast.dismiss(loadingToast);
      toast.success("User removed successfully from organization");
      await fetchUsers();
      await fetchUserLimits();
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    } catch (error: any) {
      console.error("Failed to delete user:", error);
      toast.dismiss(loadingToast);
      toast.error(error.response?.data?.detail || "Failed to remove user. Please try again.");
    }
  };

  const handleToggleActiveClick = (user: User) => {
    if (isSuperAdminUser(user)) {
      toast.error("No one can enable or disable the Super Admin");
      setMenu(null);
      return;
    }
    if (user.id === currentUser?.id) {
      toast.error("You cannot disable your own access to this organization");
      setMenu(null);
      return;
    }
    setUserToToggleActive(user);
    setShowActiveConfirm(true);
    setMenu(null);
  };

  const handleToggleActiveConfirm = async () => {
    if (!userToToggleActive) return;

    const nextActive = !userToToggleActive.is_active;
    const loadingToast = toast.loading(
      nextActive ? "Enabling organization access..." : "Disabling organization access..."
    );

    try {
      await apiClient.patch(`/auth/users/${userToToggleActive.id}/`, { is_active: nextActive });
      toast.dismiss(loadingToast);
      toast.success(
        nextActive
          ? "User can access this organization again"
          : "User access to this organization disabled"
      );
      setShowActiveConfirm(false);
      setUserToToggleActive(null);
      await fetchUsers();
    } catch (error: any) {
      console.error("Failed to update organization access:", error);
      toast.dismiss(loadingToast);
      toast.error(error.response?.data?.detail || "Failed to update organization access");
    }
  };

  const handlePromoteRoleClick = (userId: number, currentRole: string) => {
    if (!canChangeRoles) {
      toast.error("You don't have permission to change roles");
      setMenu(null);
      return;
    }
    const target = users.find((u) => u.id === userId);
    if (isSuperAdminUser(target)) {
      toast.error("No one can change the Super Admin role");
      setMenu(null);
      return;
    }

    const normalizedRole =
      currentRole === "super_admin"
        ? "admin"
        : (currentRole || "viewer").toLowerCase();

    setMenu(null);
    // Defer modal open so Base UI dropdown can release focus trap first
    window.setTimeout(() => {
      setUserToChangeRole({ id: userId, currentRole: normalizedRole });
      setNewRole(normalizedRole);
      setShowRoleModal(true);
    }, 0);
  };

  const handleRoleChangeConfirm = async () => {
    if (!userToChangeRole) {
      toast.error("No user selected");
      return;
    }

    const nextRole = (newRole || "").toLowerCase().trim();
    if (!nextRole) {
      toast.error("Please select a role");
      return;
    }

    if (nextRole === userToChangeRole.currentRole.toLowerCase()) {
      toast("Role unchanged — pick a different role", { icon: "ℹ️" });
      return;
    }

    const loadingToast = toast.loading("Updating user role...");

    try {
      const response = await apiClient.patch(`/auth/users/${userToChangeRole.id}/`, {
        role: nextRole,
      });
      toast.dismiss(loadingToast);
      const label = roleOptions.find((r) => r.value === nextRole)?.label || nextRole;
      toast.success(`Role updated to ${label}`);

      const updated = response.data;
      if (updated?.id) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === updated.id
              ? {
                  ...u,
                  role: updated.role || nextRole,
                  is_super_admin: updated.is_super_admin,
                  is_active: updated.is_active ?? u.is_active,
                }
              : u
          )
        );
      }

      setShowRoleModal(false);
      setUserToChangeRole(null);
      await fetchUsers();
      await fetchPermissionsMatrix();
    } catch (error: any) {
      console.error("Failed to update role:", error);
      toast.dismiss(loadingToast);
      const data = error.response?.data;
      const message =
        data?.role?.[0] ||
        data?.detail ||
        (typeof data === "string" ? data : null) ||
        "Failed to update role. Please try again.";
      toast.error(message);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewPermissions = async (user: User) => {
    if (!canSetPermissions) {
      toast.error("You don't have permission to manage role permissions");
      setMenu(null);
      return;
    }
    if (isSuperAdminUser(user)) {
      toast.error("No one can change Super Admin permissions");
      setMenu(null);
      return;
    }
    setUserForPermissions(user);
    setShowPermissionsModal(true);
    setRolePermissions({});

    try {
      const allPermissions = await permissionsApi.getPermissions();
      const roleKey = user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase();
      setRolePermissions(
        buildFullRolePermissions(
          allPermissions[roleKey as keyof PermissionsMatrix] || {},
          activeModules
        )
      );
    } catch (error: any) {
      console.error("Failed to load permissions:", error);
      toast.error(
        error.response?.data?.detail || "Failed to load permissions. You may need Settings edit access."
      );
      setShowPermissionsModal(false);
      setUserForPermissions(null);
    }
  };

  const handlePermissionChange = (key: string, checked: boolean) => {
    setRolePermissions(prev => ({
      ...prev,
      [key]: checked
    }));
  };

  const handleSavePermissions = async () => {
    if (!userForPermissions) return;

    const loadingToast = toast.loading("Saving permissions...");
    setSavingPermissions(true);

    try {
      const roleKey =
        userForPermissions.role.charAt(0).toUpperCase() +
        userForPermissions.role.slice(1).toLowerCase();

      // Only send the role being edited to reduce write contention on SQLite
      await permissionsApi.updatePermissions({
        [roleKey]: buildFullRolePermissions(rolePermissions, activeModules),
      } as PermissionsMatrix);

      toast.dismiss(loadingToast);
      toast.success(
        `Permissions for ${roleOptions.find((r) => r.value === userForPermissions.role)?.label || userForPermissions.role} updated`
      );
      await fetchPermissionsMatrix();
      setShowPermissionsModal(false);
      setUserForPermissions(null);
    } catch (error: any) {
      console.error("Failed to save permissions:", error);
      toast.dismiss(loadingToast);
      toast.error(error.response?.data?.detail || "Failed to save permissions");
    } finally {
      setSavingPermissions(false);
    }
  };

  const pendingInvites = invitations.filter((i) => i.status === "pending").length;
  const inviteableEmployees = employees.filter((emp) => emp.email?.trim());

  const limitsLabel = userLimits
    ? userLimits.max_users != null
      ? `${userLimits.seats_used} / ${userLimits.max_users} seats used`
      : `${userLimits.current_users} users · unlimited plan`
    : null;

  return (
    <div className="flex flex-col h-full min-h-0 w-full">
      <DashHeader
        title="Users & Roles"
        subtitle={
          loading
            ? "Loading team..."
            : `${users.length} team member${users.length !== 1 ? "s" : ""}${pendingInvites > 0 ? ` · ${pendingInvites} pending invite${pendingInvites !== 1 ? "s" : ""}` : ""}${limitsLabel ? ` · ${limitsLabel}` : ""}`
        }
      />
      <div className="flex-1 overflow-y-auto p-6 space-y-4 w-full">
        {!permissionsLoading && !canManageUsers && (
          <div className={`${cardClass} p-4 border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20`}>
            <p className="text-sm text-blue-900 dark:text-blue-200">
              You can view team members but need HR &quot;Add / invite users&quot; or &quot;Change user roles&quot; permission to manage the team.
            </p>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 bg-gray-100 dark:bg-muted p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab("users")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "users"
                  ? "bg-white dark:bg-card text-gray-900 dark:text-foreground shadow-sm"
                  : "text-gray-500 dark:text-muted-foreground hover:text-gray-700 dark:hover:text-foreground"
              }`}
            >
              Team Members ({users.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("invitations")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "invitations"
                  ? "bg-white dark:bg-card text-gray-900 dark:text-foreground shadow-sm"
                  : "text-gray-500 dark:text-muted-foreground hover:text-gray-700 dark:hover:text-foreground"
              }`}
            >
              Pending Invitations ({pendingInvites})
            </button>
          </div>
        </div>

        <div
          className={`${cardClass} p-4 ${
            userLimits && canManageUsers && !userLimits.can_invite
              ? "border-amber-200 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/10"
              : ""
          }`}
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
            {activeTab === "users" && (
              <div className="relative w-full lg:flex-1 lg:min-w-[220px] lg:max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={inputClass}
                />
              </div>
            )}

            {userLimits && canManageUsers && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 lg:shrink-0">
                <span className="text-xs text-gray-500 dark:text-muted-foreground">
                  {userLimits.max_users != null ? (
                    <>
                      {userLimits.current_users} member
                      {userLimits.current_users !== 1 ? "s" : ""}
                      {userLimits.pending_invites > 0 &&
                        ` · ${userLimits.pending_invites} pending`}
                      {" · "}
                      <span
                        className={
                          !userLimits.can_invite
                            ? "font-medium text-amber-700 dark:text-amber-400"
                            : ""
                        }
                      >
                        {userLimits.seats_used} of {userLimits.max_users} seats used
                      </span>
                    </>
                  ) : (
                    <>Unlimited users</>
                  )}
                </span>
                {!userLimits.can_invite && (
                  <Link
                    href="/settings/billing"
                    className="text-xs font-semibold text-[#16A34A] hover:underline"
                  >
                    Upgrade plan
                  </Link>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 lg:ml-auto shrink-0">
              {canInvite && (
                <Button
                  size="sm"
                  onClick={handleInvite}
                  disabled={userLimits != null && !userLimits.can_invite}
                  className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5 disabled:opacity-60"
                >
                  <Mail className="h-4 w-4" /> Invite User
                </Button>
              )}
            </div>
          </div>
        </div>

        {activeTab === "users" && (
          <>
            {loading ? (
              <SkeletonTable rows={8} />
            ) : users.length === 0 && !searchTerm ? (
              <EmptyState
                icon={Users}
                title="No team members yet"
                description="Invite colleagues to collaborate in your organization"
                actionLabel={canInvite ? "Invite User" : undefined}
                onAction={canInvite ? handleInvite : undefined}
              />
            ) : (
              <div className={tableWrapClass}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-muted/50 border-b border-gray-100 dark:border-border">
                      <tr>
                        {["User", "Email", "Role", "Permissions", "Status", ""].map((h) => (
                          <th
                            key={h || "actions"}
                            className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-border">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                            No users found matching your search
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-muted/30">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-[#22C55E]/10 flex items-center justify-center text-xs font-bold text-[#22C55E] shrink-0">
                                  {u.first_name?.[0] || u.username[0].toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-medium text-gray-900 dark:text-foreground truncate">
                                    {u.first_name} {u.last_name}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-muted-foreground truncate">
                                    @{u.username}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground whitespace-nowrap">
                              {u.email}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                                  roleColors[u.role] ?? "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {roleLabel(u.role)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground text-xs whitespace-nowrap">
                              {(() => {
                                const count = countRolePermissions(u.role);
                                if (count == null) {
                                  return <span className="text-gray-400">—</span>;
                                }
                                return (
                                  <span className="inline-flex items-center gap-1">
                                    <span className="font-medium text-gray-800 dark:text-foreground">
                                      {count}
                                    </span>
                                    <span className="text-gray-400">/ {totalPermissionSlots}</span>
                                  </span>
                                );
                              })()}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  u.is_active
                                    ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                                    : "bg-gray-100 text-gray-500 dark:bg-muted dark:text-muted-foreground"
                                }`}
                              >
                                {u.is_active ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right whitespace-nowrap">
                              {u.id === currentUser?.id ? (
                                <span className="text-xs text-gray-400">You</span>
                              ) : isSuperAdminUser(u) ? (
                                <span
                                  className="text-xs text-emerald-700 dark:text-emerald-400"
                                  title="No one can enable, disable, change role, or permissions of Super Admin"
                                >
                                  Protected
                                </span>
                              ) : canSetPermissions || canChangeRoles || canInvite ? (
                                <DropdownMenu
                                  open={menu === u.id}
                                  onOpenChange={(open) => setMenu(open ? u.id : null)}
                                >
                                  <DropdownMenuTrigger className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-muted text-gray-400">
                                    <MoreVertical className="h-4 w-4" />
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-40">
                                    {canSetPermissions && (
                                      <DropdownMenuItem onClick={() => handleViewPermissions(u)}>
                                        <Shield className="h-3.5 w-3.5 mr-2" />
                                        Permissions
                                      </DropdownMenuItem>
                                    )}
                                    {canChangeRoles && (
                                      <DropdownMenuItem
                                        onClick={() => handlePromoteRoleClick(u.id, u.role)}
                                      >
                                        <UserPlus className="h-3.5 w-3.5 mr-2" />
                                        Change Role
                                      </DropdownMenuItem>
                                    )}
                                    {canChangeRoles && (
                                      <DropdownMenuItem onClick={() => handleToggleActiveClick(u)}>
                                        {u.is_active ? (
                                          <>
                                            <XCircle className="h-3.5 w-3.5 mr-2" />
                                            Disable
                                          </>
                                        ) : (
                                          <>
                                            <CircleCheck className="h-3.5 w-3.5 mr-2" />
                                            Enable
                                          </>
                                        )}
                                      </DropdownMenuItem>
                                    )}
                                    {canInvite && (
                                      <DropdownMenuItem
                                        className="text-red-600 focus:text-red-600"
                                        onClick={() => handleDeleteClick(u.id)}
                                      >
                                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                                        Remove
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              ) : (
                                <span className="text-xs text-gray-400">No access</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "invitations" && (
          <>
            {invitations.filter((inv) => inv.status === "pending").length === 0 ? (
              <EmptyState
                icon={Mail}
                title="No pending invitations"
                description="Send an invitation to add someone to your organization"
                actionLabel={canInvite ? "Send Invitation" : undefined}
                onAction={canInvite ? handleInvite : undefined}
              />
            ) : (
              <div className={tableWrapClass}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-muted/50 border-b border-gray-100 dark:border-border">
                      <tr>
                        {["User", "Role", "Status", "Sent", "Expires", ""].map((h) => (
                          <th
                            key={h || "actions"}
                            className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-border">
                      {invitations
                        .filter((inv) => inv.status === "pending")
                        .map((inv) => (
                          <tr key={inv.id} className="hover:bg-gray-50/50 dark:hover:bg-muted/30">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="font-medium text-gray-900 dark:text-foreground">
                                {inv.invited_user_name || inv.invited_email || "Pending user"}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-muted-foreground">
                                {inv.invited_email ? `${inv.invited_email} · ` : ""}
                                Invited by {inv.invited_by_name}
                                {inv.requires_signup ? " · awaiting signup" : ""}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                                  roleColors[inv.role] ?? "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {inv.role}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400 capitalize">
                                {inv.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-500 dark:text-muted-foreground text-xs whitespace-nowrap">
                              <FormattedDate value={inv.created_at} />
                            </td>
                            <td className="px-4 py-3 text-gray-500 dark:text-muted-foreground text-xs whitespace-nowrap">
                              <FormattedDate value={inv.expires_at} />
                            </td>
                            <td className="px-4 py-3 text-right whitespace-nowrap">
                              {canInvite ? (
                                <button
                                  type="button"
                                  onClick={() => handleCancelInvitation(inv.id)}
                                  className="text-xs text-red-600 hover:text-red-700 font-medium"
                                >
                                  Cancel
                                </button>
                              ) : (
                                <span className="text-xs text-gray-400">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Remove User</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to remove this user from the organization? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setUserToDelete(null);
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  Remove User
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enable / Disable Organization Access Modal */}
      {showActiveConfirm && userToToggleActive && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                {userToToggleActive.is_active
                  ? "Disable Organization Access"
                  : "Enable Organization Access"}
              </h2>
              <p className="text-gray-600 mb-6">
                {userToToggleActive.is_active
                  ? `Are you sure you want to disable ${userToToggleActive.first_name || userToToggleActive.email}'s access to this organization? They will no longer see this business on their organization list until re-enabled.`
                  : `Are you sure you want to enable ${userToToggleActive.first_name || userToToggleActive.email}'s access to this organization? They will see this business again and can open it.`}
              </p>
              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={() => {
                    setShowActiveConfirm(false);
                    setUserToToggleActive(null);
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleToggleActiveConfirm}
                  className={`flex-1 text-white ${
                    userToToggleActive.is_active
                      ? "bg-amber-600 hover:bg-amber-700"
                      : "bg-[#22C55E] hover:bg-[#16A34A]"
                  }`}
                >
                  {userToToggleActive.is_active ? "Disable Access" : "Enable Access"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Role Modal */}
      {showRoleModal && userToChangeRole && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800">Change User Role</h2>
              <button
                type="button"
                onClick={() => {
                  setShowRoleModal(false);
                  setUserToChangeRole(null);
                }}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Current Role:{" "}
                  <span className="text-[#22C55E]">{roleLabel(userToChangeRole.currentRole)}</span>
                </p>
              </div>

              <div>
                <label
                  htmlFor="change-role-select"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Select New Role <span className="text-red-500">*</span>
                </label>
                <select
                  id="change-role-select"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22C55E] bg-white"
                >
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowRoleModal(false);
                    setUserToChangeRole(null);
                  }}
                  className="flex-1 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleRoleChangeConfirm()}
                  className="flex-1 h-10 rounded-lg bg-[#22C55E] hover:bg-[#16A34A] text-white text-sm font-medium"
                >
                  Update Role
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {userForPermissions && (
        <ManagePermissionsModal
          open={showPermissionsModal}
          onOpenChange={setShowPermissionsModal}
          userName={`${userForPermissions.first_name} ${userForPermissions.last_name}`.trim() || userForPermissions.email}
          roleLabel={roleOptions.find((r) => r.value === userForPermissions.role)?.label || userForPermissions.role}
          roleBadgeClass={roleColors[userForPermissions.role] || roleColors.viewer}
          rolePermissions={rolePermissions}
          activeModules={currentUser?.tenant?.active_modules}
          saving={savingPermissions}
          onPermissionChange={handlePermissionChange}
          onSave={handleSavePermissions}
        />
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800">Invite User to Organization</h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="p-6 space-y-4">
              {/* Employee Selector */}
              {inviteableEmployees.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select from Employees (Optional)
                  </label>
                  <select
                    value={selectedEmployee}
                    onChange={(e) => handleEmployeeSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                  >
                    <option value="">-- Select an employee --</option>
                    {inviteableEmployees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} - {emp.designation} ({emp.email})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Auto-fill invitation details from your HR employees
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={inviteData.invited_user_email}
                  onChange={(e) => setInviteData({ ...inviteData, invited_user_email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                  placeholder="user@example.com"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  They&apos;ll get an email invite. New users can create an account from the link; existing users can accept after signing in.
                </p>
                {errors.invited_user_email && (
                  <p className="text-xs text-red-500 mt-1">{errors.invited_user_email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={inviteData.role}
                  onChange={(e) => setInviteData({ ...inviteData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                  required
                >
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message (Optional)
                </label>
                <textarea
                  value={inviteData.message}
                  onChange={(e) => setInviteData({ ...inviteData, message: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22C55E] resize-none"
                  rows={3}
                  placeholder="Add a personal message..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700"
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white"
                  disabled={submitting}
                >
                  {submitting ? "Sending..." : "Send Invitation"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
