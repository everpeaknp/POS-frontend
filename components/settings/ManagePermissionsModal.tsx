"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  Maximize2,
  Minimize2,
  Search,
  Shield,
  X,
} from "lucide-react";
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
import {
  getAllPermissionKeys,
  getPermissionModuleIcon,
  getVisiblePermissionModules,
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
  Invite: "Add / invite users",
  Assign: "Change user roles",
  Configure: "Set permissions",
};

type WindowMode = "popup" | "fullscreen";

function ModulePermissionCard({
  module,
  rolePermissions,
  onPermissionChange,
  expanded,
  onToggleExpanded,
}: {
  module: PermissionModuleDefinition;
  rolePermissions: Record<string, boolean>;
  onPermissionChange: (key: string, checked: boolean) => void;
  expanded: boolean;
  onToggleExpanded: () => void;
}) {
  const Icon = getPermissionModuleIcon(module.id);

  const keys = module.actions.map((action) => permissionKey(module.name, action));
  const enabledCount = keys.filter((key) => rolePermissions[key] === true).length;
  const allEnabled = enabledCount === keys.length;
  const noneEnabled = enabledCount === 0;
  const progress = keys.length ? Math.round((enabledCount / keys.length) * 100) : 0;

  const toggleAll = (checked: boolean) => {
    for (const key of keys) {
      onPermissionChange(key, checked);
    }
  };

  return (
    <div className="shrink-0 rounded-2xl border border-gray-100 dark:border-border bg-white dark:bg-card overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={onToggleExpanded}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50/80 dark:hover:bg-muted/40 transition-colors"
      >
        <div className="w-10 h-10 rounded-xl bg-[#22C55E]/10 flex items-center justify-center shrink-0">
          {Icon ? (
            <Icon className="h-5 w-5 text-[#22C55E]" />
          ) : (
            <Shield className="h-5 w-5 text-[#22C55E]" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-900 dark:text-foreground">
              {module.name}
            </p>
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
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-1.5 flex-1 max-w-[140px] rounded-full bg-gray-100 dark:bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-[#22C55E] transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-muted-foreground whitespace-nowrap">
              {enabledCount}/{keys.length}
            </p>
          </div>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-gray-400 transition-transform shrink-0",
            expanded && "rotate-180"
          )}
        />
      </button>

      {expanded && (
        <div className="px-4 pb-3 border-t border-gray-50 dark:border-border bg-gray-50/40 dark:bg-muted/10">
          <div className="flex items-center justify-between gap-2 pt-3 pb-2">
            <p className="text-xs text-gray-500 dark:text-muted-foreground">
              Actions for {module.name}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleAll(true)}
                className="text-xs font-medium text-[#16A34A] hover:underline"
              >
                Allow all
              </button>
              <span className="text-gray-300">·</span>
              <button
                type="button"
                onClick={() => toggleAll(false)}
                className="text-xs font-medium text-gray-500 hover:underline dark:text-muted-foreground"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="space-y-1">
            {module.actions.map((action) => {
              const key = permissionKey(module.name, action);
              const checked = rolePermissions[key] === true;
              return (
                <label
                  key={key}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2.5 py-2 cursor-pointer transition-colors",
                    checked
                      ? "bg-[#22C55E]/8"
                      : "hover:bg-white/80 dark:hover:bg-muted/30"
                  )}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(value) => onPermissionChange(key, value === true)}
                    className="data-[state=checked]:bg-[#22C55E] data-[state=checked]:border-[#22C55E]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="text-sm font-medium text-gray-800 dark:text-foreground">
                      {action}
                    </span>
                    <span className="ml-2 text-xs text-gray-500 dark:text-muted-foreground">
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
  const [windowMode, setWindowMode] = useState<WindowMode>("popup");
  const [collapsedModules, setCollapsedModules] = useState<Record<string, boolean>>({});
  const isFullscreen = windowMode === "fullscreen";

  const visibleModules = useMemo(() => {
    const query = search.trim().toLowerCase();
    return getVisiblePermissionModules(activeModules).filter((mod) => {
      if (!query) return true;
      return (
        mod.name.toLowerCase().includes(query) ||
        mod.id.toLowerCase().includes(query) ||
        mod.actions.some((action) => action.toLowerCase().includes(query))
      );
    });
  }, [activeModules, search]);

  const visibleKeys = useMemo(
    () => getAllPermissionKeys(activeModules),
    [activeModules]
  );

  const totalEnabled = useMemo(
    () => visibleKeys.filter((key) => rolePermissions[key] === true).length,
    [rolePermissions, visibleKeys]
  );

  const overallProgress = visibleKeys.length
    ? Math.round((totalEnabled / visibleKeys.length) * 100)
    : 0;

  useEffect(() => {
    if (!open) return;
    setWindowMode("popup");
    setSearch("");
    const initial: Record<string, boolean> = {};
    getVisiblePermissionModules(activeModules).forEach((mod, index) => {
      // Collapse all but the first module by default
      initial[mod.id] = index >= 1;
    });
    setCollapsedModules(initial);
  }, [open, activeModules]);

  const expandAllModules = () => {
    const next: Record<string, boolean> = {};
    visibleModules.forEach((mod) => {
      next[mod.id] = false;
    });
    setCollapsedModules(next);
  };

  const collapseAllModules = () => {
    const next: Record<string, boolean> = {};
    visibleModules.forEach((mod) => {
      next[mod.id] = true;
    });
    setCollapsedModules(next);
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setWindowMode("popup");
      setSearch("");
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        showCloseButton={false}
        fullscreen={isFullscreen}
        className={cn(
          "!flex !flex-col !gap-0 overflow-hidden p-0",
          isFullscreen
            ? "!h-dvh !max-h-dvh !w-screen !max-w-none"
            : "!h-[min(90vh,820px)] sm:!max-w-3xl"
        )}
      >
        <div className="flex h-full min-h-0 flex-col">
          <DialogHeader className="shrink-0 space-y-0 border-b border-gray-100 px-5 pb-4 pt-5 text-left dark:border-border sm:px-6">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#22C55E]/10">
                <Shield className="h-5 w-5 text-[#22C55E]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-foreground">
                      Manage Permissions
                    </DialogTitle>
                    <DialogDescription className="mt-1 text-sm text-gray-600 dark:text-muted-foreground">
                      Configure access for{" "}
                      <span className="font-medium text-gray-800 dark:text-foreground">
                        {userName}
                      </span>
                    </DialogDescription>
                  </div>
                  <div className="-mt-1 flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setWindowMode(isFullscreen ? "popup" : "fullscreen")
                      }
                      className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-muted"
                      title={isFullscreen ? "Exit full screen" : "Full screen"}
                      aria-label={isFullscreen ? "Exit full screen" : "Full screen"}
                    >
                      {isFullscreen ? (
                        <Minimize2 className="h-4 w-4" />
                      ) : (
                        <Maximize2 className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleClose(false)}
                      className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-muted"
                      title="Close"
                      aria-label="Close"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadgeClass}`}
                  >
                    {roleLabel}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-muted-foreground">
                    {totalEnabled} / {visibleKeys.length} enabled · {overallProgress}%
                  </span>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-muted">
                  <div
                    className="h-full rounded-full bg-[#22C55E] transition-all"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5 dark:border-amber-900/40 dark:bg-amber-950/30">
              <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-200">
                Permissions apply to the <strong>{roleLabel}</strong> role. Changes affect
                every user with this role in your organization.
              </p>
            </div>
          </DialogHeader>

          <div className="shrink-0 border-b border-gray-100 bg-gray-50/60 px-5 py-3 dark:border-border dark:bg-muted/20 sm:px-6">
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search modules or actions..."
                  className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm focus:border-[#22C55E] focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20 dark:border-border dark:bg-card"
                />
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={expandAllModules}
                  className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-border dark:bg-card dark:text-muted-foreground dark:hover:bg-muted"
                >
                  Expand all
                </button>
                <button
                  type="button"
                  onClick={collapseAllModules}
                  className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-border dark:bg-card dark:text-muted-foreground dark:hover:bg-muted"
                >
                  Collapse all
                </button>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
            {visibleModules.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-500 dark:text-muted-foreground">
                No modules match your search.
              </div>
            ) : (
              <div
                className={cn(
                  isFullscreen
                    ? "grid grid-cols-1 items-start gap-3 md:grid-cols-2 xl:grid-cols-3"
                    : "flex flex-col gap-3"
                )}
              >
                {visibleModules.map((module) => (
                  <ModulePermissionCard
                    key={module.id}
                    module={module}
                    rolePermissions={rolePermissions}
                    onPermissionChange={onPermissionChange}
                    expanded={collapsedModules[module.id] !== true}
                    onToggleExpanded={() =>
                      setCollapsedModules((prev) => ({
                        ...prev,
                        [module.id]: !prev[module.id],
                      }))
                    }
                  />
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="mx-0 mb-0 shrink-0 gap-3 rounded-none border-t border-gray-100 bg-white px-5 py-4 dark:border-border dark:bg-card sm:justify-between sm:px-6">
            <p className="hidden text-xs text-gray-500 dark:text-muted-foreground sm:block">
              {visibleModules.length} module{visibleModules.length !== 1 ? "s" : ""} shown
            </p>
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose(false)}
                disabled={saving}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={onSave}
                disabled={saving}
                className="flex-1 bg-[#22C55E] text-white hover:bg-[#16A34A] sm:flex-none"
              >
                {saving ? "Saving..." : "Save Permissions"}
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
