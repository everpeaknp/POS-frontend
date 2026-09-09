"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, ChevronsUpDown, GripVertical, SlidersHorizontal } from "lucide-react";
import toast from "react-hot-toast";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/lib/context/AuthContext";
import {
  getModuleCatalogSections,
  isModuleActive,
  isModuleAllowed,
  isModuleInActiveList,
  isRequiredModule,
  ORG_MODULE_CATALOG,
  type OrgModuleDefinition,
} from "@/lib/modules/catalog";
import { tenantApi } from "@/lib/api/tenant";
import {
  SIDEBAR_MODULE_ORDER_KEY,
  SIDEBAR_FEATURE_ORDER_KEY,
  SIDEBAR_ORDER_CHANGED_EVENT,
  SIDEBAR_ALWAYS_EXPANDED_MODULES_KEY,
  scopedSidebarKey,
  getOrganizationModuleFeatures,
  sortFeaturesByOrder,
  type NavSubItem,
} from "@/lib/dashboard/nav-items";

interface OrganizationModulePickerProps {
  tenantSlug: string;
  activeModules: string[];
  allowedModules: string[];
  accountType?: string;
  planName?: string;
  canEdit: boolean;
  onUpdated: (modules: string[]) => void | Promise<void>;
}

export function OrganizationModulePicker({
  tenantSlug,
  activeModules,
  allowedModules,
  accountType,
  planName = "Unlimited",
  canEdit,
  onUpdated,
}: OrganizationModulePickerProps) {
  const { user, refreshUser } = useAuth();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [order, setOrder] = useState<string[]>([]);
  const [featureOrder, setFeatureOrder] = useState<Record<string, string[]>>({});
  const [alwaysExpandedModules, setAlwaysExpandedModules] = useState<string[]>([]);
  const [disabledFeatures, setDisabledFeatures] = useState<string[]>([]);
  const [togglingFeature, setTogglingFeature] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // A distance threshold lets the whole card be both clickable (toggle) and
  // draggable (reorder): a small, imprecise pointer move (< 8px) is still
  // treated as a click, only a deliberate drag past that starts a sort.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Load saved drag-and-drop order (also drives the sidebar's item order).
  // Scoped per tenant, since localStorage is shared across the whole origin
  // and these are per-workplace display preferences, not global ones.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(scopedSidebarKey(SIDEBAR_MODULE_ORDER_KEY, tenantSlug));
      setOrder(raw ? JSON.parse(raw) : []);
    } catch {
      setOrder([]);
    }
    try {
      const raw = localStorage.getItem(scopedSidebarKey(SIDEBAR_FEATURE_ORDER_KEY, tenantSlug));
      setFeatureOrder(raw ? JSON.parse(raw) : {});
    } catch {
      setFeatureOrder({});
    }
    try {
      const raw = localStorage.getItem(
        scopedSidebarKey(SIDEBAR_ALWAYS_EXPANDED_MODULES_KEY, tenantSlug)
      );
      setAlwaysExpandedModules(raw ? JSON.parse(raw) : []);
    } catch {
      setAlwaysExpandedModules([]);
    }
  }, [tenantSlug]);

  const handleFeaturesReordered = (moduleId: string, newFeatureOrder: string[]) => {
    setFeatureOrder((prev) => {
      const next = { ...prev, [moduleId]: newFeatureOrder };
      localStorage.setItem(scopedSidebarKey(SIDEBAR_FEATURE_ORDER_KEY, tenantSlug), JSON.stringify(next));
      return next;
    });
    window.dispatchEvent(new Event(SIDEBAR_ORDER_CHANGED_EVENT));
    toast.success("Sidebar order saved");
  };

  const toggleAlwaysExpanded = (moduleId: string) => {
    setAlwaysExpandedModules((prev) => {
      const next = prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId];
      localStorage.setItem(
        scopedSidebarKey(SIDEBAR_ALWAYS_EXPANDED_MODULES_KEY, tenantSlug),
        JSON.stringify(next)
      );
      window.dispatchEvent(new Event(SIDEBAR_ORDER_CHANGED_EVENT));
      toast.success(
        prev.includes(moduleId) ? "Menu will collapse like the others" : "Menu will always stay expanded"
      );
      return next;
    });
  };

  useEffect(() => {
    setDisabledFeatures(user?.tenant?.disabled_features ?? []);
  }, [user?.tenant?.disabled_features]);

  const selectedCount = useMemo(
    () => ORG_MODULE_CATALOG.filter((m) => isModuleActive(activeModules, m.id)).length,
    [activeModules]
  );

  const orderedModules = useMemo(() => {
    const modules = getModuleCatalogSections(accountType).flatMap((section) => section.modules);
    if (!order.length) return modules;
    return [...modules].sort((a, b) => {
      const indexA = order.indexOf(a.id);
      const indexB = order.indexOf(b.id);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return 0;
    });
  }, [accountType, order]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedModules.findIndex((m) => m.id === active.id);
    const newIndex = orderedModules.findIndex((m) => m.id === over.id);
    const newOrder = arrayMove(orderedModules, oldIndex, newIndex).map((m) => m.id);

    setOrder(newOrder);
    localStorage.setItem(scopedSidebarKey(SIDEBAR_MODULE_ORDER_KEY, tenantSlug), JSON.stringify(newOrder));
    window.dispatchEvent(new Event(SIDEBAR_ORDER_CHANGED_EVENT));
    toast.success("Sidebar order saved");
  };

  const toggleModule = async (moduleId: string) => {
    if (!canEdit) {
      toast.error("Only organization admins can change modules");
      return;
    }

    const enabled = isModuleInActiveList(activeModules, moduleId);
    const isRequired = isRequiredModule(moduleId);

    if (isRequired) {
      toast.error("Core modules are always included");
      return;
    }

    setTogglingId(moduleId);

    try {
      if (enabled) {
        await tenantApi.deactivateModule(tenantSlug, moduleId);
        toast.success("Module disabled");
      } else {
        await tenantApi.activateModule(tenantSlug, moduleId);
        toast.success("Module enabled");
      }

      // Refresh tenant data
      const tenant = await tenantApi.getCurrent();

      // Refresh user auth context to update sidebar
      await refreshUser();

      await onUpdated(tenant.active_modules || []);
    } catch (error: unknown) {
      const data = (error as { response?: { data?: { error?: string; detail?: string } } })
        ?.response?.data;
      const message =
        data?.error ||
        (typeof data?.detail === "string" ? data.detail : undefined) ||
        "Failed to update module";
      toast.error(message);
    } finally {
      setTogglingId(null);
    }
  };

  const toggleFeature = async (feature: NavSubItem) => {
    if (!canEdit) {
      toast.error("Only organization admins can change features");
      return;
    }

    const isDisabled = disabledFeatures.includes(feature.href);
    const newList = isDisabled
      ? disabledFeatures.filter((href) => href !== feature.href)
      : [...disabledFeatures, feature.href];

    setTogglingFeature(feature.href);
    const previous = disabledFeatures;
    setDisabledFeatures(newList); // optimistic

    try {
      await tenantApi.updateCurrent({ disabled_features: newList });
      await refreshUser();
      toast.success(isDisabled ? `"${feature.label}" enabled` : `"${feature.label}" disabled`);
    } catch (error: unknown) {
      setDisabledFeatures(previous); // revert on failure
      const data = (error as { response?: { data?: { error?: string; detail?: string } } })
        ?.response?.data;
      toast.error(data?.error || data?.detail || "Failed to update feature");
    } finally {
      setTogglingFeature(null);
    }
  };

  return (
    <div className="space-y-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={orderedModules.map((m) => m.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2.5">
            {orderedModules.map((module) => (
              <SortableModuleCard
                key={module.id}
                module={module}
                isSelected={isModuleActive(activeModules, module.id)}
                isLoading={togglingId === module.id}
                canEdit={canEdit}
                onToggle={() => toggleModule(module.id)}
                expanded={expandedId === module.id}
                onToggleExpand={() =>
                  setExpandedId((prev) => (prev === module.id ? null : module.id))
                }
                disabledFeatures={disabledFeatures}
                togglingFeature={togglingFeature}
                onToggleFeature={toggleFeature}
                featureOrder={featureOrder[module.id]}
                onReorderFeatures={(newOrder) => handleFeaturesReordered(module.id, newOrder)}
                isAlwaysExpanded={alwaysExpandedModules.includes(module.id)}
                onToggleAlwaysExpanded={() => toggleAlwaysExpanded(module.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <p className="text-xs text-gray-400 dark:text-muted-foreground text-center pt-3">
        {selectedCount} of {ORG_MODULE_CATALOG.length} modules enabled · Disabled modules are hidden
        from the sidebar · Drag a card to reorder the sidebar, or drag features inside a module ·
        Pin a module to keep its sidebar menu always expanded
      </p>
    </div>
  );
}

interface SortableModuleCardProps {
  module: OrgModuleDefinition;
  isSelected: boolean;
  isLoading: boolean;
  canEdit: boolean;
  onToggle: () => void;
  expanded: boolean;
  onToggleExpand: () => void;
  disabledFeatures: string[];
  togglingFeature: string | null;
  onToggleFeature: (feature: NavSubItem) => void;
  featureOrder: string[] | undefined;
  onReorderFeatures: (newOrder: string[]) => void;
  isAlwaysExpanded: boolean;
  onToggleAlwaysExpanded: () => void;
}

function SortableModuleCard({
  module,
  isSelected,
  isLoading,
  canEdit,
  onToggle,
  expanded,
  onToggleExpand,
  disabledFeatures,
  togglingFeature,
  onToggleFeature,
  featureOrder,
  onReorderFeatures,
  isAlwaysExpanded,
  onToggleAlwaysExpanded,
}: SortableModuleCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: module.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const featureSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const IconComponent = module.icon;
  const isRequired = isRequiredModule(module.id) || module.required;
  const canToggle = canEdit && !isRequired && !isLoading;
  const features = useMemo(
    () => sortFeaturesByOrder(getOrganizationModuleFeatures(module.id), featureOrder),
    [module.id, featureOrder]
  );
  const hasFeatures = features.length > 0;
  const showPanel = expanded && isSelected && hasFeatures;
  const enabledFeatureCount = features.filter((f) => !disabledFeatures.includes(f.href)).length;

  const handleFeatureDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = features.findIndex((f) => f.href === active.id);
    const newIndex = features.findIndex((f) => f.href === over.id);
    const newOrder = arrayMove(features, oldIndex, newIndex).map((f) => f.href);
    onReorderFeatures(newOrder);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border transition-all ${
        isDragging ? "shadow-lg opacity-90 z-10 relative" : ""
      } ${
        isSelected
          ? "border-[#4A5D7A]/30 bg-[#4A5D7A]/[0.04] dark:bg-slate-500/[0.06]"
          : "border-gray-200 dark:border-border bg-white dark:bg-card"
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        onClick={() => {
          if (canToggle) onToggle();
        }}
        title="Drag anywhere on the card to reorder the sidebar"
        className={`group relative flex items-center gap-3 px-4 py-3.5 transition-colors touch-none rounded-xl ${
          isSelected ? "hover:bg-[#4A5D7A]/[0.07] dark:hover:bg-slate-500/10" : "hover:bg-gray-50 dark:hover:bg-muted/40"
        } ${canToggle ? "cursor-pointer" : "cursor-default"} ${isLoading ? "opacity-70" : ""} ${isDragging ? "cursor-grabbing" : ""}`}
      >
        <div
          aria-hidden="true"
          className="shrink-0 -ml-1 p-1 rounded text-gray-300 dark:text-muted-foreground/50 group-hover:text-gray-400 dark:group-hover:text-muted-foreground"
        >
          <GripVertical className="h-4 w-4" />
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors ${
            isSelected
              ? "bg-[#4A5D7A]/15 text-[#4A5D7A]"
              : "bg-gray-100 dark:bg-muted text-gray-500 dark:text-muted-foreground"
          }`}
        >
          <IconComponent className="h-[18px] w-[18px]" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-foreground">
              {module.name}
            </h3>
            {isRequired && (
              <span className="rounded-full bg-gray-100 dark:bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-muted-foreground">
                Always on
              </span>
            )}
            {!isRequired && module.recommended && (
              <span className="rounded-full bg-[#4A5D7A]/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#2E3E52]">
                Recommended
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-muted-foreground line-clamp-1">
            {module.description}
          </p>
        </div>

        {hasFeatures && isSelected && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleAlwaysExpanded();
            }}
            className={`shrink-0 flex items-center justify-center h-7 w-7 rounded-lg border transition-colors ${
              isAlwaysExpanded
                ? "border-[#4A5D7A]/40 bg-[#4A5D7A]/10 text-[#2E3E52]"
                : "border-gray-200 dark:border-border text-gray-400 dark:text-muted-foreground hover:border-gray-300 hover:text-gray-700 dark:hover:text-foreground"
            }`}
            title={
              isAlwaysExpanded
                ? "Sidebar menu always expanded — click to let it collapse like the others"
                : "Keep this sidebar menu always expanded"
            }
            aria-pressed={isAlwaysExpanded}
          >
            <ChevronsUpDown className="h-3.5 w-3.5" />
          </button>
        )}

        {hasFeatures && isSelected && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
            className={`shrink-0 flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
              showPanel
                ? "border-[#4A5D7A]/40 bg-[#4A5D7A]/10 text-[#2E3E52]"
                : "border-gray-200 dark:border-border text-gray-500 dark:text-muted-foreground hover:border-gray-300 hover:text-gray-700 dark:hover:text-foreground"
            }`}
            title="Show features in this module"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">
              {enabledFeatureCount}/{features.length} features
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${showPanel ? "rotate-180" : ""}`}
            />
          </button>
        )}

        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
          {isLoading ? null : isRequired ? (
            <div
              className="flex h-5 w-5 items-center justify-center rounded-md bg-[#4A5D7A] text-white"
              aria-label={`${module.name} enabled`}
            >
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
            </div>
          ) : (
            <Checkbox
              checked={isSelected}
              disabled={!canEdit}
              onCheckedChange={onToggle}
              className="h-5 w-5 data-[state=checked]:bg-[#4A5D7A] data-[state=checked]:border-[#4A5D7A]"
            />
          )}
        </div>
      </div>

      {showPanel && (
        <div className="border-t border-gray-100 dark:border-border px-4 py-3.5 pl-[4.25rem]">
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-muted-foreground mb-2.5">
            Features in {module.name} · drag to reorder
          </p>
          <DndContext
            sensors={featureSensors}
            collisionDetection={closestCenter}
            onDragEnd={handleFeatureDragEnd}
          >
            <SortableContext
              items={features.map((f) => f.href)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                {features.map((feature) => (
                  <SortableFeatureRow
                    key={feature.href}
                    feature={feature}
                    isDisabled={disabledFeatures.includes(feature.href)}
                    isBusy={togglingFeature === feature.href}
                    canEdit={canEdit}
                    onToggle={() => onToggleFeature(feature)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}

interface SortableFeatureRowProps {
  feature: NavSubItem;
  isDisabled: boolean;
  isBusy: boolean;
  canEdit: boolean;
  onToggle: () => void;
}

function SortableFeatureRow({ feature, isDisabled, isBusy, canEdit, onToggle }: SortableFeatureRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: feature.href,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      title="Drag to reorder in the sidebar"
      className={`flex items-center gap-1.5 rounded-md px-1.5 py-1 touch-none select-none ${
        isDragging ? "z-10 relative shadow-md bg-white dark:bg-card opacity-90" : "hover:bg-gray-50 dark:hover:bg-muted/40"
      } ${isBusy ? "opacity-60" : ""}`}
    >
      <div
        aria-hidden="true"
        className="shrink-0 text-gray-300 dark:text-muted-foreground/40"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </div>
      <label
        className={`flex flex-1 items-center gap-2.5 text-sm text-gray-700 dark:text-foreground ${
          canEdit ? "cursor-pointer" : "cursor-default"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <Checkbox
          checked={!isDisabled}
          disabled={!canEdit || isBusy}
          onCheckedChange={onToggle}
          className="h-4 w-4 data-[state=checked]:bg-[#4A5D7A] data-[state=checked]:border-[#4A5D7A]"
        />
        <span className={isDisabled ? "text-gray-400 dark:text-muted-foreground" : ""}>
          {feature.label}
        </span>
      </label>
    </div>
  );
}
