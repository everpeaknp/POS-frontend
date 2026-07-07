"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { isModuleActive } from "@/lib/modules/catalog";
import {
  PERMISSION_MODULES,
  getPermissionModuleIcon,
  permissionKey,
  type PermissionAction,
  type PermissionModuleDefinition,
} from "@/lib/permissions/catalog";

interface ManagePermissionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  roleLabel: string;
  roleBadgeClass: string;
  rolePermissions: Record<string, boolean>;
  activeModules?: string[];
  saving?: boolean;
  onPermissionChange: (key: string, checked: boolean) => void;
  onSave: () => void;
}

const ACTION_LABELS: Record<PermissionAction, string> = {
  View: "View records",
  Create: "Create new",
  Edit: "Edit existing",
  Delete: "Delete records",
  Export: "Export data",
  Approve: "Approve requests",
};

function ModulePermissionCard({
  module,
  rolePermissions,
  onPermissionChange,
  defaultExpanded,
}: {
  module: PermissionModuleDefinition;
  rolePermissions: Record<string, boolean>;
  onPermissionChange: (key: string, checked: boolean) => void;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded ?? true);
  const Icon = getPermissionModuleIcon(module.id);

  const keys = module.actions.map((action) => permissionKey(module.name, action));
  const enabledCount = keys.filter((key) => rolePermissions[key] === true).length;
  const allEnabled = enabledCount === keys.length;
  const noneEnabled = enabledCount === 0;

  const toggleAll = (checked: boolean) => {
    for (const key of keys) {
      onPermissionChange(key, checked);
    }
  };

  return (
    <div className="rounded-xl border border-gray-100 dark:border-border bg-white dark:bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50/80 dark:hover:bg-muted/40 transition-colors"
      >
        <div className="w-9 h-9 rounded-lg bg-[#22C55E]/10 flex items-center justify-center shrink-0">
          {Icon ? (
            <Icon className="h-4 w-4 text-[#22C55E]" />
          ) : (
            <Shield className="h-4 w-4 text-[#22C55E]" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-foreground">{module.name}</p>
          <p className="text-xs text-gray-500 dark:text-muted-foreground">
            {enabledCount} of {keys.length} actions allowed
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={cn(
              "text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full",
              allEnabled
                ? "bg-[#22C55E]/10 text-[#16A34A]"
                : noneEnabled
                  ? "bg-gray-100 text-gray-500 dark:bg-muted dark:text-muted-foreground"
                  : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
            )}
          >
            {allEnabled ? "Full" : noneEnabled ? "None" : "Partial"}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-gray-400 transition-transform",
              expanded && "rotate-180"
            )}
          />
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-gray-50 dark:border-border">
          <div className="flex items-center justify-end gap-2 pt-3 pb-2">
            <button
              type="button"
              onClick={() => toggleAll(true)}
              className="text-xs font-medium text-[#16A34A] hover:underline"
            >
              Allow all
            </button>
            <span className="text-gray-300">|</span>
            <button
              type="button"
              onClick={() => toggleAll(false)}
              className="text-xs font-medium text-gray-500 hover:underline dark:text-muted-foreground"
            >
              Clear all
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {module.actions.map((action) => {
              const key = permissionKey(module.name, action);
              const checked = rolePermissions[key] === true;
              return (
                <label
                  key={key}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors",
                    checked
                      ? "border-[#22C55E]/30 bg-[#22C55E]/5"
                      : "border-gray-100 dark:border-border hover:bg-gray-50/50 dark:hover:bg-muted/30"
                  )}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(value) => onPermissionChange(key, value === true)}
                    className="mt-0.5 data-[state=checked]:bg-[#22C55E] data-[state=checked]:border-[#22C55E]"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-gray-800 dark:text-foreground">
                      {action}
                    </span>
                    <span className="block text-xs text-gray-500 dark:text-muted-foreground">
                      {ACTION_LABELS[action]}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function ManagePermissionsModal({
  open,
  onOpenChange,
  userName,
  roleLabel,
  roleBadgeClass,
  rolePermissions,
  activeModules,
  saving = false,
  onPermissionChange,
  onSave,
}: ManagePermissionsModalProps) {
  const [search, setSearch] = useState("");

  const visibleModules = useMemo(() => {
    const query = search.trim().toLowerCase();
    return PERMISSION_MODULES.filter((mod) => {
      if (activeModules?.length) {
        const active = isModuleActive(activeModules, mod.id);
        if (!active) return false;
      }
      if (!query) return true;
      return (
        mod.name.toLowerCase().includes(query) ||
        mod.id.toLowerCase().includes(query) ||
        mod.actions.some((action) => action.toLowerCase().includes(query))
      );
    });
  }, [activeModules, search]);

  const totalEnabled = useMemo(
    () => Object.values(rolePermissions).filter(Boolean).length,
    [rolePermissions]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="sm:max-w-3xl max-h-[min(90vh,880px)] p-0 gap-0 overflow-hidden flex flex-col"
      >
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-border text-left">
          <div className="flex items-start gap-4 pr-8">
            <div className="w-11 h-11 rounded-xl bg-[#22C55E]/10 flex items-center justify-center shrink-0">
              <Shield className="h-5 w-5 text-[#22C55E]" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-foreground">
                Manage Permissions
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-gray-600 dark:text-muted-foreground">
                Configure access for <span className="font-medium text-gray-800 dark:text-foreground">{userName}</span>
              </DialogDescription>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${roleBadgeClass}`}>
                  {roleLabel}
                </span>
                <span className="text-xs text-gray-500 dark:text-muted-foreground">
                  {totalEnabled} permissions enabled
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 px-3 py-2.5">
            <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
              Permissions apply to the <strong>{roleLabel}</strong> role. Changes affect every user with this role in your organization.
            </p>
          </div>
        </DialogHeader>

        <div className="px-6 py-4 border-b border-gray-100 dark:border-border bg-gray-50/50 dark:bg-muted/20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search modules or actions..."
              className="w-full h-10 pl-10 pr-4 text-sm border border-gray-200 dark:border-border rounded-lg bg-white dark:bg-card focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20 focus:border-[#22C55E]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 min-h-0">
          {visibleModules.length === 0 ? (
            <div className="text-center py-12 text-sm text-gray-500 dark:text-muted-foreground">
              No modules match your search.
            </div>
          ) : (
            visibleModules.map((module, index) => (
              <ModulePermissionCard
                key={module.id}
                module={module}
                rolePermissions={rolePermissions}
                onPermissionChange={onPermissionChange}
                defaultExpanded={index < 3}
              />
            ))
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-gray-100 dark:border-border bg-white dark:bg-card sm:justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="bg-[#22C55E] hover:bg-[#16A34A] text-white"
          >
            {saving ? "Saving..." : "Save Permissions"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
