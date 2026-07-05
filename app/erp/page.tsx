"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Settings,
  LogOut,
  Building2,
  ClipboardList,
  Mail,
  SearchX,
  Check,
  X,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TiggLogo } from "@/components/tigg-logo";
import { OrgTabs } from "@/components/org-tabs";
import { OrgCard } from "@/components/org-card";
import { EmptyState } from "@/components/empty-state";
import { Organization } from "@/lib/types";
import { tenantApi, Tenant, invitationApi, Invitation } from "@/lib/api/tenant";
import { getMediaUrl } from "@/lib/utils";
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
      console.error("[ERP] Failed to fetch tenants:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async () => {
    try {
      const response = await invitationApi.getReceived();
      setInvitations(response.data);
    } catch (error) {
      console.error("[ERP] Failed to fetch invitations:", error);
    }
  };

  const handleAcceptInvitation = async (id: number) => {
    try {
      await invitationApi.respond(id, "accept");
      toast.success("Invitation accepted! You've joined the organization.");
      await fetchInvitations();
      await fetchTenants();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || "Failed to accept invitation");
    }
  };

  const handleDeclineInvitation = async (id: number) => {
    try {
      await invitationApi.respond(id, "decline");
      toast.success("Invitation declined");
      await fetchInvitations();
    } catch {
      toast.error("Failed to decline invitation");
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
  };

  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  const avatarUrl = getMediaUrl(user?.avatar);

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3F4F6]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#22C55E] border-t-transparent" />
      </div>
    );
  }

  const organizations: Organization[] = tenants.map((tenant) => ({
    id: tenant.id.toString(),
    slug: tenant.slug,
    name: tenant.name,
    subdomain: `${tenant.slug}.khata.app`,
    icon: tenant.name.charAt(0).toUpperCase(),
    logo: getMediaUrl(tenant.logo) || undefined,
    trialDaysLeft: 30,
    status: tenant.is_active ? "active" : "trial",
    user_role: tenant.user_role,
    workspace_name: tenant.workspace_name,
  }));

  const filteredOrgs = organizations.filter(
    (org) =>
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.subdomain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (org.workspace_name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hasNoTenants = tenants.length === 0;
  const pendingInvitations = invitations.filter(
    (inv) => inv.status === "pending" && !inv.is_expired
  );

  const pageMeta =
    {
      organizations: {
        title: "Your organizations",
        subtitle: "Open a Khata workspace or create a new one",
      },
      requests: {
        title: "Requests",
        subtitle: "Organization join requests will appear here",
      },
      invitation: {
        title: "Invitations",
        subtitle: "Accept invites to join other organizations",
      },
    }[activeTab] ?? {
      title: "Organizations",
      subtitle: "Manage your Khata workspaces",
    };

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <TiggLogo size="md" />
          <div className="relative">
            <button
              onClick={() => setProfileMenuOpen((open) => !open)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22C55E] focus-visible:ring-offset-2"
              aria-label="User menu"
              aria-expanded={profileMenuOpen}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#22C55E] text-white text-sm font-semibold overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  getUserInitials(user.first_name, user.last_name)
                )}
              </span>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-900 leading-tight">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <ChevronDown className="hidden sm:block h-4 w-4 text-gray-400" />
            </button>
            {profileMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setProfileMenuOpen(false)}
                  aria-hidden
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-40">
                  <div className="px-4 py-3 border-b border-gray-100 sm:hidden">
                    <p className="text-sm font-medium text-gray-900">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      router.push("/settings/profile");
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4 text-gray-400" />
                    Settings
                  </button>
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <OrgTabs
        activeTab={activeTab}
        onChange={setActiveTab}
        pendingInvitationsCount={pendingInvitations.length}
      />

      <main className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Page header */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{pageMeta.title}</h1>
              <p className="text-sm text-gray-500 mt-1">{pageMeta.subtitle}</p>
            </div>
            {activeTab === "organizations" && (
              <div className="relative w-full sm:w-72 shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search organizations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 border-gray-200 bg-white focus-visible:border-[#22C55E] focus-visible:ring-[#22C55E]/20"
                  disabled={hasNoTenants}
                />
              </div>
            )}
          </div>

          {activeTab === "organizations" && (
            <>
              {hasNoTenants ? (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                  <EmptyState
                    icon={Building2}
                    title="No organization yet"
                    subtitle="Get started by creating your first Khata workspace"
                    showButton={true}
                  />
                </div>
              ) : filteredOrgs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5">
                  {filteredOrgs.map((org) => (
                    <OrgCard key={org.id} org={org} onDelete={fetchTenants} />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                  <EmptyState
                    icon={SearchX}
                    title="No organizations found"
                    subtitle="Try adjusting your search"
                    showButton={false}
                  />
                </div>
              )}
            </>
          )}

          {activeTab === "requests" && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
              <EmptyState
                icon={ClipboardList}
                title="No pending requests"
                subtitle="Organization join requests will appear here"
                showButton={false}
              />
            </div>
          )}

          {activeTab === "invitation" && (
            invitations.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                <EmptyState
                  icon={Mail}
                  title="No invitations"
                  subtitle="Invitations to join other organizations will appear here"
                  showButton={false}
                />
              </div>
            ) : (
              <div className="space-y-4">
                {invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 sm:p-6 hover:border-green-100 hover:shadow-md transition-all"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-11 h-11 rounded-xl bg-[#22C55E]/10 flex items-center justify-center text-[#16A34A] font-bold text-lg shrink-0">
                            {invitation.tenant_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-base font-semibold text-gray-900 truncate">
                              {invitation.tenant_name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              Invited by {invitation.invited_by_name}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="text-gray-500">Role:</span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-[#16A34A] capitalize">
                            {invitation.role}
                          </span>
                          {invitation.is_expired && (
                            <span className="px-2 py-0.5 bg-red-50 text-red-700 rounded-full text-xs font-medium">
                              Expired
                            </span>
                          )}
                        </div>

                        {invitation.message && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <p className="text-sm text-gray-700">{invitation.message}</p>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400 mt-3">
                          <span>Sent {new Date(invitation.created_at).toLocaleDateString()}</span>
                          <span>Expires {new Date(invitation.expires_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {invitation.status === "pending" && !invitation.is_expired && (
                        <div className="flex gap-2 shrink-0">
                          <Button
                            onClick={() => handleAcceptInvitation(invitation.id)}
                            className="bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5 h-9"
                          >
                            <Check className="h-4 w-4" />
                            Accept
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleDeclineInvitation(invitation.id)}
                            className="h-9 gap-1.5 border-gray-200"
                          >
                            <X className="h-4 w-4" />
                            Decline
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </main>

      {activeTab === "organizations" && (
        <button
          type="button"
          onClick={() => router.push("/erp/new")}
          className="fixed bottom-8 right-8 w-14 h-14 bg-[#22C55E] hover:bg-[#16A34A] text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-green-300 z-50"
          aria-label="Add new organization"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}
