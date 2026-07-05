"use client";

import { FormattedDate } from "@/components/shared/FormattedDate";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MoreHorizontal, Trash2, X, Search, Mail, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DashHeader } from "@/components/dashboard/dash-header";
import apiClient from "@/lib/api/client";
import { useAuth } from "@/lib/context/AuthContext";
import { invitationApi, Invitation } from "@/lib/api/tenant";
import { permissionsApi, PermissionsMatrix, usersApi, EmployeeInviteOption } from "@/lib/api/auth";
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
}

const roleOptions = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "supervisor", label: "Supervisor" },
  { value: "accountant", label: "Accountant" },
  { value: "cashier", label: "Cashier" },
  { value: "viewer", label: "Viewer" },
];

const roleColors: Record<string, string> = {
  admin: "bg-purple-100 text-purple-700",
  manager: "bg-blue-100 text-blue-700",
  supervisor: "bg-green-100 text-green-700",
  accountant: "bg-orange-100 text-orange-700",
  cashier: "bg-teal-100 text-teal-700",
  viewer: "bg-gray-100 text-gray-600",
};

const modules = [
  { name: "Sales", actions: ["View", "Create", "Edit", "Delete"] },
  { name: "Purchase", actions: ["View", "Create", "Edit", "Delete"] },
  { name: "Dashboard", actions: ["View"] },
  { name: "Inventory", actions: ["View", "Create", "Edit", "Delete"] },
  { name: "Accounting", actions: ["View", "Create", "Edit", "Delete"] },
  { name: "Construction", actions: ["View", "Create", "Edit", "Delete"] },
  { name: "HR", actions: ["View", "Create", "Edit", "Delete"] },
  { name: "POS", actions: ["View", "Create", "Edit", "Delete"] },
  { name: "Reports", actions: ["View", "Export"] },
  { name: "Settings", actions: ["View", "Edit"] },
];

export default function UsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [permissions, setPermissions] = useState<PermissionsMatrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState<number | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<'users' | 'invitations'>('users');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
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

  // Check if current user can manage users (Settings-Edit permission)
  const canManageUsers = () => {
    if (!currentUser?.role || !permissions) return false;
    
    // Capitalize role to match permissions matrix keys
    const roleKey = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1).toLowerCase();
    
    // Check if role exists in permissions matrix
    if (!(roleKey in permissions)) return false;
    
    // Check Settings-Edit permission
    const rolePermissions = permissions[roleKey as keyof PermissionsMatrix];
    return rolePermissions?.['Settings-Edit'] === true;
  };

  useEffect(() => {
    fetchPermissions();
    fetchUsers();
    fetchInvitations();
  }, []);

  useEffect(() => {
    if (permissions && canManageUsers()) {
      fetchEmployees();
    }
  }, [permissions, currentUser?.role]);

  const fetchPermissions = async () => {
    try {
      const data = await permissionsApi.getPermissions();
      setPermissions(data);
    } catch (error: any) {
      console.error("Failed to fetch permissions:", error);
      // Don't show error toast - permissions might not be set up yet
      // Default to no access if permissions can't be loaded
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
    if (!canManageUsers()) {
      toast.error("You don't have permission to invite users");
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
  }, [permissions, currentUser?.role]);

  useEffect(() => {
    if (searchParams.get("invite") !== "1") return;
    if (!permissions) return;

    handleInvite();
    router.replace("/dashboard/settings/users", { scroll: false });
  }, [searchParams, permissions, handleInvite, router]);

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
          
          // User-friendly message for "user not found"
          if (emailError.toLowerCase().includes('no user found')) {
            errorMessages.push("This user hasn't registered yet. Please ask them to sign up first at /auth/signup");
          } else {
            errorMessages.push(emailError);
          }
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
    } catch (error: any) {
      console.error("Failed to cancel invitation:", error);
      toast.error("Failed to cancel invitation");
    }
  };

  const handleDeleteClick = (userId: number) => {
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
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    } catch (error: any) {
      console.error("Failed to delete user:", error);
      toast.dismiss(loadingToast);
      toast.error(error.response?.data?.detail || "Failed to remove user. Please try again.");
    }
  };

  const handlePromoteRoleClick = (userId: number, currentRole: string) => {
    setUserToChangeRole({ id: userId, currentRole });
    setNewRole(currentRole);
    setShowRoleModal(true);
    setMenu(null);
  };

  const handleRoleChangeConfirm = async () => {
    if (!userToChangeRole || !newRole) return;
    
    if (newRole === userToChangeRole.currentRole) {
      toast("Role unchanged", { icon: "ℹ️" });
      setShowRoleModal(false);
      return;
    }

    const loadingToast = toast.loading("Updating user role...");

    try {
      await apiClient.patch(`/auth/users/${userToChangeRole.id}/`, { role: newRole.toLowerCase() });
      toast.dismiss(loadingToast);
      toast.success(`Role successfully updated to ${newRole.charAt(0).toUpperCase() + newRole.slice(1)}`);
      await fetchUsers();
      setShowRoleModal(false);
      setUserToChangeRole(null);
    } catch (error: any) {
      console.error("Failed to update role:", error);
      toast.dismiss(loadingToast);
      toast.error(error.response?.data?.detail || "Failed to update role. Please try again.");
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString();
  };

  const handleViewPermissions = async (user: User) => {
    setUserForPermissions(user);
    setShowPermissionsModal(true);
    
    // Load permissions for this user's role
    try {
      const allPermissions = await permissionsApi.getPermissions();
      const roleKey = user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase();
      setRolePermissions(allPermissions[roleKey as keyof PermissionsMatrix] || {});
    } catch (error: any) {
      console.error("Failed to load permissions:", error);
      toast.error("Failed to load permissions");
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
    
    try {
      // Get all permissions
      const allPermissions = await permissionsApi.getPermissions();
      
      // Update the specific role's permissions
      const roleKey = userForPermissions.role.charAt(0).toUpperCase() + userForPermissions.role.slice(1).toLowerCase();
      allPermissions[roleKey as keyof PermissionsMatrix] = rolePermissions;
      
      // Save back to server
      await permissionsApi.updatePermissions(allPermissions);
      
      toast.dismiss(loadingToast);
      toast.success("Permissions updated successfully");
      setShowPermissionsModal(false);
    } catch (error: any) {
      console.error("Failed to save permissions:", error);
      toast.dismiss(loadingToast);
      toast.error(error.response?.data?.detail || "Failed to save permissions");
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Users & Roles" subtitle="Manage team access" />
      <div className="flex-1 p-6 space-y-4">
        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'users'
                ? 'border-[#22C55E] text-[#22C55E]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Team Members ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('invitations')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'invitations'
                ? 'border-[#22C55E] text-[#22C55E]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Pending Invitations ({invitations.filter(i => i.status === 'pending').length})
          </button>
        </div>

        {activeTab === 'users' && (
          <>
            <div className="flex justify-between items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent"
                />
              </div>
              <Button
                size="sm"
                onClick={handleInvite}
                className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5"
              >
                <Mail className="h-4 w-4" /> Invite User
              </Button>
            </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading users...</div>
        ) : users.length === 0 && !searchTerm ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No users yet</h3>
            <p className="text-gray-500 mb-6">Get started by inviting your first team member</p>
            <Button
              size="sm"
              onClick={handleInvite}
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5"
            >
              <Mail className="h-4 w-4" /> Invite User
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-visible">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["User", "Email", "Role", "Last Login", "Status", ""].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#22C55E]/10 flex items-center justify-center text-xs font-bold text-[#22C55E]">
                            {u.first_name?.[0] || u.username[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-800">
                              {u.first_name} {u.last_name}
                            </div>
                            <div className="text-xs text-gray-500">@{u.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{u.email}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            roleColors[u.role] ?? "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {formatDate(u.last_login)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            u.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {u.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {u.id !== currentUser?.id && canManageUsers() ? (
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('Menu clicked for user:', u.id, 'Current menu:', menu);
                                setMenu(menu === u.id ? null : u.id);
                              }}
                              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                            {menu === u.id && (
                              <>
                                <div 
                                  className="fixed inset-0 z-10" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMenu(null);
                                  }}
                                />
                                <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-xl py-1 min-w-[150px]">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewPermissions(u);
                                    }}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                  >
                                    <Shield className="h-3.5 w-3.5" />
                                    Permissions
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePromoteRoleClick(u.id, u.role);
                                    }}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                  >
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                    </svg>
                                    Change Role
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteClick(u.id);
                                    }}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" /> Remove
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ) : u.id === currentUser?.id ? (
                          <span className="text-xs text-gray-400">You</span>
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
        )}
          </>
        )}

        {/* Invitations Tab */}
        {activeTab === 'invitations' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {invitations.length === 0 ? (
            <div className="p-12 text-center">
              <Mail className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No pending invitations</h3>
              <p className="text-gray-500 mb-6">Invite users to join your organization</p>
              <Button
                size="sm"
                onClick={handleInvite}
                className="bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5"
              >
                <Mail className="h-4 w-4" /> Send Invitation
              </Button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Email", "Role", "Status", "Sent", "Expires", ""].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invitations.filter(inv => inv.status === 'pending').map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-800">{inv.invited_user_name}</div>
                        <div className="text-xs text-gray-500">Invited by {inv.invited_by_name}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          roleColors[inv.role] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {inv.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          inv.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : inv.status === 'accepted'
                            ? 'bg-green-100 text-green-700'
                            : inv.status === 'declined'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      <FormattedDate value={inv.created_at} />
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      <FormattedDate value={inv.expires_at} />
                    </td>
                    <td className="px-4 py-3">
                      {inv.status === 'pending' && (
                        <button
                          onClick={() => handleCancelInvitation(inv.id)}
                          className="text-xs text-red-600 hover:text-red-700 font-medium"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
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

      {/* Change Role Modal */}
      {showRoleModal && userToChangeRole && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800">Change User Role</h2>
              <button
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Role: <span className="text-[#22C55E]">{userToChangeRole.currentRole}</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select New Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                >
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={() => {
                    setShowRoleModal(false);
                    setUserToChangeRole(null);
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleRoleChangeConfirm}
                  className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white"
                >
                  Update Role
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && userForPermissions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl my-8">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Manage Permissions - {userForPermissions.first_name} {userForPermissions.last_name}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Role: <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[userForPermissions.role]}`}>
                    {userForPermissions.role}
                  </span>
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Note: Permissions are role-based. Changes will affect all users with the "{userForPermissions.role}" role.
                </p>
              </div>
              <button
                onClick={() => setShowPermissionsModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-48">
                        Module / Action
                      </th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                        Allowed
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {modules.map((mod, modIdx) => (
                      <React.Fragment key={`module-${modIdx}`}>
                        <tr className="bg-gray-50/50">
                          <td 
                            className="px-4 py-2 font-semibold text-gray-700 text-xs uppercase tracking-wide" 
                            colSpan={2}
                          >
                            {mod.name}
                          </td>
                        </tr>
                        {mod.actions.map((action) => {
                          const key = `${mod.name}-${action}`;
                          const checked = rolePermissions[key] === true;
                          
                          return (
                            <tr 
                              key={`${mod.name}-${action}`} 
                              className="border-t border-gray-50 hover:bg-gray-50/30"
                            >
                              <td className="px-4 py-2.5 text-gray-600 pl-8">{action}</td>
                              <td className="px-4 py-2.5 text-center">
                                <Checkbox 
                                  checked={checked}
                                  onCheckedChange={(checked) => 
                                    handlePermissionChange(key, checked === true)
                                  }
                                  className="data-[state=checked]:bg-[#22C55E] data-[state=checked]:border-[#22C55E]" 
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-100">
              <Button
                type="button"
                onClick={() => setShowPermissionsModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSavePermissions}
                className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white"
              >
                Save Permissions
              </Button>
            </div>
          </div>
        </div>
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
              {employees.length > 0 && (
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
                    {employees.map((emp) => (
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
                  The user must already be registered. They will receive an invitation to join your organization.
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
