"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Settings, LogOut, Building2, ClipboardList, Mail, SearchX, Check, X } from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { Input } from "@/components/ui/input";
import { TiggLogo } from "@/components/tigg-logo";
import { OrgTabs } from "@/components/org-tabs";
import { OrgCard } from "@/components/org-card";
import { EmptyState } from "@/components/empty-state";
import { Organization } from "@/lib/types";
import { tenantApi, Tenant, invitationApi, Invitation } from "@/lib/api/tenant";
import toast from "react-hot-toast";

export default function ErpPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("organizations");
  const [searchQuery, setSearchQuery] = useState("");
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
    } else {
      fetchTenants();
      fetchInvitations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, router]);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const data = await tenantApi.getAll();
      setTenants(data);
    } catch (error) {
      console.error('[ERP] Failed to fetch tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async () => {
    try {
      const response = await invitationApi.getReceived();
      setInvitations(response.data);
    } catch (error) {
      console.error('[ERP] Failed to fetch invitations:', error);
    }
  };

  const handleAcceptInvitation = async (id: number) => {
    try {
      await invitationApi.respond(id, 'accept');
      toast.success("Invitation accepted! You've joined the organization.");
      await fetchInvitations();
      await fetchTenants();
    } catch (error: any) {
      console.error('Failed to accept invitation:', error);
      toast.error(error.response?.data?.error || "Failed to accept invitation");
    }
  };

  const handleDeclineInvitation = async (id: number) => {
    try {
      await invitationApi.respond(id, 'decline');
      toast.success("Invitation declined");
      await fetchInvitations();
    } catch (error: any) {
      console.error('Failed to decline invitation:', error);
      toast.error("Failed to decline invitation");
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
  };

  // Get user initials for avatar
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Convert tenants to Organization format
  const organizations: Organization[] = tenants.map(tenant => ({
    id: tenant.id.toString(),
    slug: tenant.slug,
    name: tenant.name,
    subdomain: `${tenant.slug}.khata.app`,
    icon: tenant.name.charAt(0).toUpperCase(),
    trialDaysLeft: 30, // TODO: Calculate from backend
    status: tenant.is_active ? "active" : "trial",
    user_role: tenant.user_role,
    workspace_name: tenant.workspace_name,
  }));

  // Filter organizations based on search
  const filteredOrgs = organizations.filter((org) =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.subdomain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if user has no tenants at all
  const hasNoTenants = tenants.length === 0;

  return (
    <div className="h-screen bg-[#F3F4F6] flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <TiggLogo size="md" />
          <div className="flex items-center gap-4">
            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen((open) => !open)}
                className="group rounded-full p-1.5 bg-[#22C55E]/10 transition-colors duration-200 hover:bg-[#22C55E]/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22C55E] focus-visible:ring-offset-2"
                aria-label="User menu"
                aria-expanded={profileMenuOpen}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#22C55E] text-white text-sm font-semibold ring-2 ring-[#22C55E] ring-offset-2 transition-colors duration-200 group-hover:bg-[#16A34A]">
                  {getInitials(user.first_name, user.last_name)}
                </span>
              </button>
              {profileMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                  <p className="text-xs text-gray-400 capitalize mt-1">{user.role}</p>
                </div>
                <button
                  onClick={() => router.push("/settings/profile")}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <OrgTabs 
        activeTab={activeTab} 
        onChange={setActiveTab} 
        pendingInvitationsCount={invitations.filter(inv => inv.status === 'pending' && !inv.is_expired).length}
      />

      {/* Content — 1 row × 4 cards, horizontal scroll */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-[1600px] w-full mx-auto px-6 py-8 pb-24">
        {activeTab === "organizations" && (
          <>
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search organizations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 border-gray-200 bg-white focus-visible:border-green-500 focus-visible:ring-green-500/20"
                />
              </div>
            </div>

            {/* Organizations Grid or Empty State */}
            {hasNoTenants ? (
              // Show empty state if user has no tenants
              <EmptyState
                icon={Building2}
                title="No organization yet"
                subtitle="Get started by adding a new organization"
                showButton={true}
              />
            ) : filteredOrgs.length > 0 ? (
              <div className="grid grid-cols-4 gap-5 w-full">
                {filteredOrgs.map((org) => (
                  <OrgCard key={org.id} org={org} onDelete={fetchTenants} />
                ))}
              </div>
            ) : searchQuery ? (
              // Show "not found" if searching and no results
              <EmptyState
                icon={SearchX}
                title="No organizations found"
                subtitle="Try adjusting your search"
                showButton={false}
              />
            ) : null}
          </>
        )}

        {activeTab === "requests" && (
          <EmptyState
            icon={ClipboardList}
            title="No pending requests"
            subtitle="Organization join requests will appear here"
            showButton={false}
          />
        )}

        {activeTab === "invitation" && (
          invitations.length === 0 ? (
            <EmptyState
              icon={Mail}
              title="No invitations"
              subtitle="Invitations to join other organizations will appear here"
              showButton={false}
            />
          ) : (
            <div className="space-y-4">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                          {invitation.tenant_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {invitation.tenant_name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Invited by {invitation.invited_by_name}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-600">Role:</span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 capitalize">
                            {invitation.role}
                          </span>
                        </div>
                        
                        {invitation.message && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">{invitation.message}</p>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-3">
                          <span>Sent {new Date(invitation.created_at).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>Expires {new Date(invitation.expires_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    {invitation.status === 'pending' && !invitation.is_expired && (
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleAcceptInvitation(invitation.id)}
                          className="px-4 py-2 bg-[#22C55E] hover:bg-[#16A34A] text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                        >
                          <Check className="h-4 w-4" />
                          Accept
                        </button>
                        <button
                          onClick={() => handleDeclineInvitation(invitation.id)}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                        >
                          <X className="h-4 w-4" />
                          Decline
                        </button>
                      </div>
                    )}
                    
                    {invitation.is_expired && (
                      <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                        Expired
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => router.push("/erp/new")}
        className="fixed bottom-8 right-8 w-14 h-14 bg-[#22C55E] hover:bg-[#16A34A] text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-green-300 z-50"
        aria-label="Add new organization"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}
