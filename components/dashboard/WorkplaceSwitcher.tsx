"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, ChevronUp, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/context/AuthContext";
import { tenantApi, type Tenant } from "@/lib/api/tenant";
import { cn, getMediaUrl } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function TenantMark({
  tenant,
  size = "md",
}: {
  tenant: { name: string; logo?: string | null };
  size?: "sm" | "md";
}) {
  const logo = getMediaUrl(tenant.logo);
  const dim = size === "sm" ? "h-7 w-7 text-[11px]" : "h-8 w-8 text-sm";

  return (
    <span
      className={cn(
        "rounded-lg bg-[#22C55E] flex items-center justify-center text-white font-bold shrink-0 overflow-hidden",
        dim
      )}
    >
      {logo ? (
        <img src={logo} alt="" className="h-full w-full object-cover" />
      ) : (
        tenant.name.charAt(0).toUpperCase() || "O"
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
    } as Tenant);

  const handleSwitch = async (tenant: Tenant) => {
    if (tenant.slug === activeSlug || switchingSlug) return;
    try {
      setSwitchingSlug(tenant.slug);
      setOpen(false);
      await switchOrganization(tenant.slug, "/dashboard");
    } catch {
      toast.error(`Could not open ${tenant.name}`);
      setSwitchingSlug(null);
    }
  };

  return (
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
            {user.role && (
              <span className="text-gray-400 text-xs leading-tight truncate capitalize">
                {user.role === "super_admin" ? "Super Admin" : user.role}
              </span>
            )}
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
          return (
            <DropdownMenuItem
              key={tenant.id}
              disabled={busy}
              className="cursor-pointer gap-2"
              onClick={() => void handleSwitch(tenant)}
            >
              <TenantMark tenant={tenant} size="sm" />
              <span className="flex-1 truncate text-sm">{tenant.name}</span>
              {active && <Check className="h-4 w-4 text-[#22C55E] shrink-0" />}
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
            <Plus className="h-3.5 w-3.5" />
          </span>
          <span className="text-sm">Manage workplaces</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
