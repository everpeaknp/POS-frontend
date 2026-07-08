"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Plus,
  Building2,
  ClipboardList,
  Mail,
  SearchX,
  Check,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ErpHeader } from "@/components/erp/erp-header";
import { OrgTabs } from "@/components/org-tabs";
import { OrgCard } from "@/components/org-card";
import { EmptyState } from "@/components/empty-state";
import { Organization } from "@/lib/types";
import { tenantApi, Tenant, invitationApi, Invitation } from "@/lib/api/tenant";
import { billingApi, type AccountLimits } from "@/lib/api/billing";
import { getMediaUrl } from "@/lib/utils";
import { PageLoading } from "@/components/shared/PageLoading";
import toast from "react-hot-toast";

export default function ErpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("organizations");
  const [searchQuery, setSearchQuery] = useState("");
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountLimits, setAccountLimits] = useState<AccountLimits | null>(null);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "invitation" || tab === "invitations") {
      setActiveTab("invitation");
    } else if (tab === "requests") {
      setActiveTab("requests");
    } else if (tab === "organizations") {
      setActiveTab("organizations");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
    } else {
      fetchTenants();
      fetchInvitations();
      billingApi.getAccountLimits().then(setAccountLimits).catch(() => {});
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

  const handleCreateOrganization = () => {
    if (accountLimits && !accountLimits.can_create_org) {
      const limit = accountLimits.max_orgs ?? 0;
      toast.error(
        `Your ${accountLimits.account_plan_name} plan allows up to ${limit} organization${limit === 1 ? "" : "s"}. Upgrade a workspace to create more.`
      );
      return;
    }
    router.push("/erp/new");
  };

  if (!user || loading) {
    return <PageLoading fullScreen message="Loading organizations…" />;
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
    created_by: tenant.created_by,
    can_delete: tenant.user_role === "super_admin" || tenant.created_by === user?.id,
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
    <div className="min-h-screen bg-[#F3F4F6] dark:bg-background flex flex-col">
      <ErpHeader />

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
              <h1 className="text-xl font-bold text-foreground">{pageMeta.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">{pageMeta.subtitle}</p>
            </div>
            {activeTab === "organizations" && (
              <div className="relative w-full sm:w-72 shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search organizations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 border-gray-200 dark:border-border bg-white dark:bg-card focus-visible:border-[#22C55E] focus-visible:ring-[#22C55E]/20"
                  disabled={hasNoTenants}
                />
              </div>
            )}
          </div>

          {activeTab === "organizations" && (
            <>
              {hasNoTenants ? (
                <div className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border shadow-sm">
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
                <div className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border shadow-sm">
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
            <div className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border shadow-sm">
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
              <div className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border shadow-sm">
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
                    className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border shadow-sm p-5 sm:p-6 hover:border-[#22C55E]/30 hover:shadow-md transition-all"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-11 h-11 rounded-xl bg-[#22C55E]/10 flex items-center justify-center text-[#16A34A] font-bold text-lg shrink-0">
                            {invitation.tenant_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-base font-semibold text-foreground truncate">
                              {invitation.tenant_name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Invited by {invitation.invited_by_name}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Role:</span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#22C55E]/15 text-[#22C55E] capitalize">
                            {invitation.role}
                          </span>
                          {invitation.is_expired && (
                            <span className="px-2 py-0.5 bg-red-500/15 text-red-500 rounded-full text-xs font-medium">
                              Expired
                            </span>
                          )}
                        </div>

                        {invitation.message && (
                          <div className="mt-3 p-3 bg-muted rounded-lg border border-border">
                            <p className="text-sm text-foreground">{invitation.message}</p>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-3">
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
                            className="h-9 gap-1.5 border-border"
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

      {activeTab === "organizations" && (accountLimits?.can_create_org ?? true) && (
        <button
          type="button"
          onClick={handleCreateOrganization}
          className="fixed bottom-8 right-8 w-14 h-14 bg-[#22C55E] hover:bg-[#16A34A] text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-green-300 z-50"
          aria-label="Add new organization"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}
