"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, ChevronUp, Plus, Wallet, HardHat, Wrench, ShoppingBag, Building2, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/context/AuthContext";
import { tenantApi, type Tenant } from "@/lib/api/tenant";
import { cn, getMediaUrl } from "@/lib/utils";
import { getDashboardHref } from "@/lib/onboarding/creation-copy";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { KhataLoading } from "@/components/shared/KhataLoading";

function TenantMark({
  tenant,
  size = "md",
}: {
  tenant: { name: string; logo?: string | null; account_type?: string };
  size?: "sm" | "md";
}) {
  const logo = getMediaUrl(tenant.logo);
  const dim = size === "sm" ? "h-7 w-7 text-[11px]" : "h-8 w-8 text-sm";

  // Get icon based on account type
  const getAccountIcon = () => {
    const iconClass = size === "sm" ? "h-4 w-4" : "h-5 w-5";
    switch (tenant.account_type) {
      case "personal":
        return <Wallet className={iconClass} />;
      case "construction":
        return <HardHat className={iconClass} />;
      case "hardware":
        return <Wrench className={iconClass} />;
      case "retail":
        return <ShoppingBag className={iconClass} />;
      default:
        return <Building2 className={iconClass} />;
    }
  };

  return (
    <span
      className={cn(
        "rounded-lg bg-[var(--color-accent-custom,#22C55E)] flex items-center justify-center text-white font-bold shrink-0 overflow-hidden",
        dim
      )}
    >
      {logo ? (
        <img src={logo} alt="" className="h-full w-full object-cover" />
      ) : (
        getAccountIcon()
      )}
    </span>
  );
}

/**
 * Sidebar workplace switcher — org mark + up/down chevrons (like Slack/Linear).
 */
export function WorkplaceSwitcher({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const { user, switchOrganization } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [switchingSlug, setSwitchingSlug] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const loadTenants = useCallback(async () => {
    try {
      const data = await tenantApi.getAll();
      setTenants(data.filter((t) => t.is_active !== false));
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    void loadTenants();
  }, [user?.id, loadTenants]);

  if (!user?.tenant) return null;

  const activeSlug = user.tenant.slug;
  const current =
    tenants.find((t) => t.slug === activeSlug) ??
    ({
      id: user.tenant.id,
      name: user.tenant.name,
      slug: user.tenant.slug,
      logo: (user.tenant as { logo?: string | null }).logo,
      account_type: user.tenant.account_type,
    } as Tenant);

  const handleSwitch = async (tenant: Tenant) => {
    if (tenant.slug === activeSlug || switchingSlug) return;
    try {
      setSwitchingSlug(tenant.slug);
      setOpen(false);
      
      // Show switching toast
      toast.loading(`Switching to ${tenant.workspace_name || tenant.name}...`, {
        id: 'workspace-switch',
      });
      
      const redirectPath = getDashboardHref(tenant.account_type);
      await switchOrganization(tenant.slug, redirectPath);
      
      // Show success toast
      toast.success(`Switched to ${tenant.workspace_name || tenant.name}`, {
        id: 'workspace-switch',
      });
      
      // Clear immediately after switch completes
      setSwitchingSlug(null);
    } catch {
      toast.error(`Could not switch to ${tenant.name}`, {
        id: 'workspace-switch',
      });
      setSwitchingSlug(null);
    }
  };

  return (
    <>
      {/* Loading overlay when switching workplaces */}
      {switchingSlug && (
        <div className="fixed inset-0 z-[9999] bg-[#f3f4f6] dark:bg-background">
          <KhataLoading message="Switching workspace..." fullScreen={true} />
        </div>
      )}
      
      <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        className={cn(
          "flex items-center gap-1.5 min-w-0 rounded-lg outline-none transition-colors",
          compact
            ? "justify-center p-1 hover:bg-white/10"
            : "flex-1 hover:bg-white/5 -ml-1 pl-1 pr-1.5 py-1"
        )}
        aria-label="Switch workplace"
        title="Switch workplace"
      >
        <TenantMark tenant={current} />
        {!compact && (
          <div className="flex flex-col min-w-0 flex-1 text-left">
            <span className="text-white font-semibold text-sm leading-tight truncate">
              {current.name}
            </span>
            {user.tenant.account_type === "personal" ? (
              <span className="text-gray-400 text-xs leading-tight truncate">
                Personal
              </span>
            ) : user.role ? (
              <span className="text-gray-400 text-xs leading-tight truncate capitalize">
                {user.role === "super_admin" ? "Super Admin" : user.role}
              </span>
            ) : null}
          </div>
        )}
        <span
          className={cn(
            "flex flex-col items-center justify-center text-gray-400 shrink-0",
            compact ? "ml-0" : "ml-0.5"
          )}
          aria-hidden
        >
          <ChevronUp className="h-2.5 w-2.5 -mb-0.5" strokeWidth={2.5} />
          <ChevronDown className="h-2.5 w-2.5 -mt-0.5" strokeWidth={2.5} />
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        side="bottom"
        sideOffset={6}
        className="w-64"
      >
        <div className="px-2 py-1.5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Workplaces
          </p>
        </div>
        {tenants.map((tenant) => {
          const active = tenant.slug === activeSlug;
          const busy = switchingSlug === tenant.slug;
          
          // Get display type based on active modules or account type
          let displayType = "";
          if (tenant.account_type === "personal") {
            displayType = "Personal";
          } else if (tenant.active_modules?.includes("construction")) {
            displayType = "Construction";
          } else if (tenant.active_modules?.includes("hardware")) {
            displayType = "Hardware";
          } else if (tenant.account_type === "retail") {
            displayType = "Retail";
          } else if (tenant.account_type === "construction") {
            displayType = "Construction";
          } else if (tenant.account_type === "hardware") {
            displayType = "Hardware";
          } else {
            displayType = "Business";
          }
          
          return (
            <DropdownMenuItem
              key={tenant.id}
              disabled={busy}
              className="cursor-pointer gap-2"
              onClick={() => void handleSwitch(tenant)}
            >
              <TenantMark tenant={tenant} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">{tenant.name}</div>
                <div className="text-[10px] text-muted-foreground truncate">{displayType}</div>
              </div>
              {active && <Check className="h-4 w-4 text-[var(--color-accent-custom,#22C55E)] shrink-0" />}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer gap-2"
          onClick={() => {
            setOpen(false);
            router.push("/erp");
          }}
        >
          <span className="h-7 w-7 rounded-lg border border-dashed border-border grid place-items-center shrink-0">
            <ArrowLeft className="h-3.5 w-3.5" />
          </span>
          <span className="text-sm">Back to workspaces</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    </>
  );
}
