"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
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
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useAuth } from "@/lib/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ErpHeader } from "@/components/erp/erp-header";
import { OrgCard } from "@/components/org-card";
import { EmptyState } from "@/components/empty-state";
import { tenantApi, invitationApi, Invitation } from "@/lib/api/tenant";
import { billingApi, type AccountLimits } from "@/lib/api/billing";
import { mapTenantToOrganization } from "@/lib/erp/org-mapper";
import { PageLoading } from "@/components/shared/PageLoading";
import type { Organization } from "@/lib/types";
import toast from "react-hot-toast";

interface SortableOrgCardProps {
  org: Organization;
  onDelete: () => void;
}

function SortableOrgCard({ org, onDelete }: SortableOrgCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: org.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <OrgCard org={org} onDelete={onDelete} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  );
}

function ErpPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, switchOrganization } = useAuth();
  const [activeTab, setActiveTab] = useState("organizations");
  const [searchQuery, setSearchQuery] = useState("");
  const [tenants, setTenants] = useState<Awaited<ReturnType<typeof tenantApi.getAll>>>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountLimits, setAccountLimits] = useState<AccountLimits | null>(null);
  const [orgOrder, setOrgOrder] = useState<number[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load saved order from localStorage
  useEffect(() => {
    const savedOrder = localStorage.getItem("khata-org-order");
    if (savedOrder) {
      try {
        setOrgOrder(JSON.parse(savedOrder));
      } catch (e) {
        console.error("Failed to parse saved org order:", e);
      }
    }
  }, []);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "invitation" || tab === "invitations") {
      setActiveTab("invitation");
    } else if (tab === "requests") {
      setActiveTab("requests");
    } else {
      setActiveTab("organizations");
    }
  }, [searchParams]);

  const fetchTenants = useCallback(async () => {
    console.log('[ERP DEBUG] fetchTenants started');
    try {
      setLoading(true);
      const data = await tenantApi.getAll();
      console.log('[ERP DEBUG] fetchTenants success, got', data.length, 'tenants');
      setTenants(data);
    } catch (error) {
      console.error("[ERP] Failed to fetch tenants:", error);
      toast.error("Failed to load workplaces");
    } finally {
      console.log('[ERP DEBUG] fetchTenants finished, setting loading to false');
      setLoading(false);
    }
  }, []);

  const fetchInvitations = useCallback(async () => {
    try {
      const response = await invitationApi.getReceived();
      setInvitations(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("[ERP] Failed to fetch invitations:", error);
    }
  }, []);

  useEffect(() => {
    console.log('[ERP DEBUG] useEffect triggered:', { authLoading, hasUser: !!user, loading });
    
    // Wait for AuthContext — redirecting while loading causes
    // middleware (cookie→/erp) ↔ this push (/auth/login) loops in Electron.
    if (authLoading) {
      console.log('[ERP DEBUG] Still auth loading, returning early');
      return;
    }
    if (!user) {
      console.log('[ERP DEBUG] No user found, redirecting to login');
      router.push("/auth/login");
      return;
    }

    console.log('[ERP DEBUG] User logged in, fetching tenants');
    fetchTenants();
    fetchInvitations();
    billingApi.getAccountLimits().then(setAccountLimits).catch(() => {});
  }, [user, authLoading, router, fetchTenants, fetchInvitations]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "organizations") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    const qs = params.toString();
    router.replace(qs ? `/erp?${qs}` : "/erp");
  };

  const handleCreateOrganization = () => {
    if (accountLimits && !accountLimits.can_create_org) {
      const limit = accountLimits.max_orgs ?? 0;
      toast.error(
        `Your ${accountLimits.account_plan_name} plan allows up to ${limit} workplace${limit === 1 ? "" : "s"}. Upgrade a workspace to create more.`
      );
      return;
    }
    router.push("/erp/new");
  };

  const handleAcceptInvitation = async (id: number) => {
    try {
      const response = await invitationApi.respond(id, "accept");
      toast.success("Invitation accepted! You've joined the workplace.");
      await fetchInvitations();
      const updatedTenants = await tenantApi.getAll();
      setTenants(updatedTenants);

      const invitation = response.data.invitation;
      const joinedTenant = updatedTenants.find((t) => t.id === invitation?.tenant);
      if (joinedTenant?.slug) {
        await switchOrganization(joinedTenant.slug, "/dashboard");
      }
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = organizations.findIndex((org) => org.id === active.id);
      const newIndex = organizations.findIndex((org) => org.id === over.id);

      const newOrder = arrayMove(organizations, oldIndex, newIndex).map((org) => org.id);
      setOrgOrder(newOrder);
      localStorage.setItem("khata-org-order", JSON.stringify(newOrder));
      toast.success("Workplace order saved");
    }
  };

  // Show loading only during auth check or while fetching tenants
  // Don't show loading if !user, as useEffect will redirect to login
  console.log('[ERP DEBUG] Render check:', { authLoading, hasUser: !!user, loading });
  
  if (authLoading || loading) {
    console.log('[ERP DEBUG] Showing loading screen');
    return <PageLoading fullScreen message="Loading workplaces…" />;
  }

  // If no user after auth loading is done, return null (useEffect will redirect)
  if (!user) {
    console.log('[ERP DEBUG] No user, returning null');
    return null;
  }
  
  console.log('[ERP DEBUG] Rendering main content');

  const organizations = tenants.map((tenant) => mapTenantToOrganization(tenant, user.id));

  // Sort organizations based on saved order
  const sortedOrganizations = [...organizations].sort((a, b) => {
    const indexA = orgOrder.indexOf(a.id);
    const indexB = orgOrder.indexOf(b.id);
    
    // If both are in the order list, sort by their position
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    // If only A is in the list, it comes first
    if (indexA !== -1) return -1;
    // If only B is in the list, it comes first
    if (indexB !== -1) return 1;
    // If neither is in the list, maintain original order
    return 0;
  });

  const filteredOrgs = sortedOrganizations.filter(
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
        title: "Your workplaces",
        subtitle: "Open a Khata workspace or create a new one",
      },
      requests: {
        title: "Requests",
        subtitle: "Workplace join requests will appear here",
      },
      invitation: {
        title: "Invitations",
        subtitle: "Accept invites to join other workplaces",
      },
    }[activeTab] ?? {
      title: "Workplaces",
      subtitle: "Manage your Khata workspaces",
    };

  return (
    <div className="min-h-screen h-full bg-[#F3F4F6] dark:bg-background flex flex-col">
      <ErpHeader
        activeTab={activeTab}
        onTabChange={handleTabChange}
        pendingInvitationsCount={pendingInvitations.length}
      />

      <main className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
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
                  placeholder="Search workplaces..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 border-gray-200 dark:border-border bg-white dark:bg-card focus-visible:border-[#4A5D7A] focus-visible:ring-[#4A5D7A]/20"
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
                    title="No workplace yet"
                    subtitle="Get started by creating your first Khata workspace"
                    showButton={accountLimits?.can_create_org ?? true}
                    onAction={handleCreateOrganization}
                  />
                </div>
              ) : filteredOrgs.length > 0 ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={filteredOrgs.map((org) => org.id)}
                    strategy={rectSortingStrategy}
                  >
                    <div className="grid grid-cols-5 gap-4 sm:gap-5">
                      {filteredOrgs.map((org) => (
                        <SortableOrgCard key={org.id} org={org} onDelete={fetchTenants} />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border shadow-sm">
                  <EmptyState
                    icon={SearchX}
                    title="No workplaces found"
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
                subtitle="Workplace join requests will appear here"
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
                  subtitle="Invitations to join other workplaces will appear here"
                  showButton={false}
                />
              </div>
            ) : (
              <div className="space-y-4">
                {invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border shadow-sm p-5 sm:p-6 hover:border-[#4A5D7A]/30 hover:shadow-md transition-all"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-11 h-11 rounded-xl bg-[#4A5D7A]/10 flex items-center justify-center text-[#2E3E52] font-bold text-lg shrink-0">
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
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#4A5D7A]/15 text-[#4A5D7A] capitalize">
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
                            className="bg-[#4A5D7A] hover:bg-[#2E3E52] text-white gap-1.5 h-9"
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

      {activeTab === "organizations" &&
        !hasNoTenants &&
        (accountLimits?.can_create_org ?? true) && (
        <button
          type="button"
          onClick={handleCreateOrganization}
          className="fixed bottom-8 right-8 w-14 h-14 bg-[#4A5D7A] hover:bg-[#2E3E52] text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-green-300 z-50"
          aria-label="Add new workplace"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}

export default function ErpPage() {
  return (
    <Suspense fallback={<PageLoading fullScreen message="Loading workplaces…" />}>
      <ErpPageContent />
    </Suspense>
  );
}
