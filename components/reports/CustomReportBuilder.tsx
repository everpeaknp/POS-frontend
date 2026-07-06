"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { reportsCardClass } from "@/components/reports/ReportsPageShell";
import {
  customReportsAPI,
  type CustomReportCreateData,
  type CustomReportFieldCatalog,
} from "@/lib/api/reports";
import {
  CHART_TYPES,
  FILTER_OPERATORS,
  MODULE_OPTIONS,
  SCHEDULE_OPTIONS,
  type CustomReportFilter,
} from "@/lib/reports/customReportConfig";
import toast from "react-hot-toast";

interface CustomReportBuilderProps {
  formData: CustomReportCreateData;
  setFormData: React.Dispatch<React.SetStateAction<CustomReportCreateData>>;
  step: number;
  setStep: (step: number) => void;
  loading: boolean;
  onSave: () => void;
  onSaveAndRun: () => void;
  onCancel: () => void;
}

export function CustomReportBuilder({
  formData,
  setFormData,
  step,
  setStep,
  loading,
  onSave,
  onSaveAndRun,
  onCancel,
}: CustomReportBuilderProps) {
  const [catalog, setCatalog] = useState<CustomReportFieldCatalog | null>(null);

  useEffect(() => {
    customReportsAPI
      .getFields(formData.module)
      .then((data) => {
        const mod = data[formData.module];
        if (mod) setCatalog(mod);
      })
      .catch(() => toast.error("Failed to load field catalog"));
  }, [formData.module]);

  const availableFields = catalog?.fields ?? [];
  const selectedFields = formData.fields ?? [];

  const unselectedFields = useMemo(
    () => availableFields.filter((f) => !selectedFields.includes(f.key)),
    [availableFields, selectedFields]
  );

  const addField = (key: string) => {
    setFormData((prev) => ({
      ...prev,
      fields: [...(prev.fields ?? []), key],
    }));
  };

  const removeField = (key: string) => {
    setFormData((prev) => ({
      ...prev,
      fields: (prev.fields ?? []).filter((f) => f !== key),
    }));
  };

  const updateFilter = (index: number, patch: Partial<CustomReportFilter>) => {
    setFormData((prev) => {
      const filters = [...(prev.filters ?? [])];
      filters[index] = { ...filters[index], ...patch };
      return { ...prev, filters };
    });
  };

  const addFilter = () => {
    const firstField = availableFields[0]?.key ?? "";
    setFormData((prev) => ({
      ...prev,
      filters: [
        ...(prev.filters ?? []),
        { field: firstField, operator: "equals", value: "" },
      ],
    }));
  };

  const removeFilter = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      filters: (prev.filters ?? []).filter((_, i) => i !== index),
    }));
  };

  const validateStep = (current: number): boolean => {
    if (current === 1 && !formData.name.trim()) {
      toast.error("Report name is required");
      return false;
    }
    if (current === 3 && (formData.fields ?? []).length === 0) {
      toast.error("Select at least one field");
      return false;
    }
    return true;
  };

  const goNext = () => {
    if (validateStep(step)) setStep(step + 1);
  };

  const fieldLabel = (key: string) =>
    availableFields.find((f) => f.key === key)?.label ?? key;

  return (
    <div className={`${reportsCardClass} p-6 lg:p-8`}>
      <div className="flex gap-2 mb-6">
        {[1, 2, 3, 4, 5, 6].map((s) => (
          <div
            key={s}
            className={`flex-1 h-2 rounded-full ${s <= step ? "bg-[#22C55E]" : "bg-gray-200 dark:bg-muted"}`}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-foreground border-b border-gray-100 dark:border-border pb-2">
            Step 1: Report Setup
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="name">Report Name*</Label>
              <Input
                id="name"
                placeholder="Enter report name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 h-9"
              />
            </div>
            <div>
              <Label>Report Type*</Label>
              <Select
                value={formData.report_type}
                onValueChange={(v) =>
                  setFormData({ ...formData, report_type: v as CustomReportCreateData["report_type"] })
                }
              >
                <SelectTrigger className="mt-1 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="table">Table</SelectItem>
                  <SelectItem value="chart">Chart</SelectItem>
                  <SelectItem value="both">Table & Chart</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Schedule</Label>
              <Select
                value={formData.schedule ?? "none"}
                onValueChange={(v) =>
                  setFormData({ ...formData, schedule: v as CustomReportCreateData["schedule"] })
                }
              >
                <SelectTrigger className="mt-1 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCHEDULE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              placeholder="Enter report description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-border rounded-lg text-sm resize-none bg-white dark:bg-card"
              rows={3}
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-foreground border-b border-gray-100 dark:border-border pb-2">
            Step 2: Select Data Source
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {MODULE_OPTIONS.map((mod) => (
              <button
                key={mod.value}
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    module: mod.value,
                    fields: [],
                    filters: [],
                    grouping: {},
                    sorting: {},
                  })
                }
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  formData.module === mod.value
                    ? "border-[#22C55E] bg-green-50 dark:bg-green-500/10"
                    : "border-gray-200 dark:border-border hover:border-gray-300"
                }`}
              >
                <p className="font-medium text-gray-900 dark:text-foreground">{mod.label}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-foreground border-b border-gray-100 dark:border-border pb-2">
            Step 3: Select Fields
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-foreground mb-2">
                Available Fields
              </p>
              <div className="border border-gray-200 dark:border-border rounded-lg p-3 space-y-2 h-64 overflow-y-auto">
                {unselectedFields.length === 0 ? (
                  <p className="text-sm text-gray-500 p-2">All fields selected</p>
                ) : (
                  unselectedFields.map((field) => (
                    <button
                      key={field.key}
                      type="button"
                      onClick={() => addField(field.key)}
                      className="w-full text-left p-2 bg-gray-50 dark:bg-muted rounded text-sm hover:bg-green-50 dark:hover:bg-green-500/10"
                    >
                      {field.label}
                      <span className="text-xs text-gray-400 ml-2">({field.type})</span>
                    </button>
                  ))
                )}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-foreground mb-2">
                Selected Fields ({selectedFields.length})
              </p>
              <div className="border border-gray-200 dark:border-border rounded-lg p-3 space-y-2 h-64 overflow-y-auto bg-green-50/50 dark:bg-green-500/5">
                {selectedFields.length === 0 ? (
                  <p className="text-sm text-gray-500 p-2">Click fields on the left to add them</p>
                ) : (
                  selectedFields.map((key) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-2 bg-white dark:bg-card rounded text-sm"
                    >
                      <span>{fieldLabel(key)}</span>
                      <button
                        type="button"
                        onClick={() => removeField(key)}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
              {catalog?.default_fields && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, fields: [...catalog.default_fields] }))
                  }
                >
                  Use default fields
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-border pb-2">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-foreground">
              Step 4: Add Filters
            </h3>
            <Button type="button" variant="outline" size="sm" onClick={addFilter} className="gap-1">
              <Plus className="h-4 w-4" /> Add filter
            </Button>
          </div>
          {(formData.filters ?? []).length === 0 ? (
            <p className="text-sm text-gray-500">No filters — all records in the date range will be included.</p>
          ) : (
            <div className="space-y-3">
              {(formData.filters ?? []).map((filter, index) => (
                <div key={index} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                  <Select
                    value={filter.field}
                    onValueChange={(v) => v && updateFilter(index, { field: v })}
                  >
                    <SelectTrigger className="h-9 flex-1">
                      <SelectValue placeholder="Field" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFields.map((f) => (
                        <SelectItem key={f.key} value={f.key}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={filter.operator}
                    onValueChange={(v) =>
                      v && updateFilter(index, { operator: v as CustomReportFilter["operator"] })
                    }
                  >
                    <SelectTrigger className="h-9 w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FILTER_OPERATORS.map((op) => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Value"
                    value={filter.value}
                    onChange={(e) => updateFilter(index, { value: e.target.value })}
                    className="h-9 flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => removeFilter(index)}
                    className="p-2 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 5 && (
        <div className="space-y-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-foreground border-b border-gray-100 dark:border-border pb-2">
            Step 5: Grouping & Sorting
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Group By (optional)</Label>
              <Select
                value={(formData.grouping as { field?: string })?.field ?? "__none__"}
                onValueChange={(v) =>
                  setFormData({
                    ...formData,
                    grouping: v && v !== "__none__" ? { field: v } : {},
                  })
                }
              >
                <SelectTrigger className="mt-1 h-9">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {selectedFields.map((key) => (
                    <SelectItem key={key} value={key}>
                      {fieldLabel(key)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sort By</Label>
              <div className="flex gap-2 mt-1">
                <Select
                  value={(formData.sorting as { field?: string })?.field ?? ""}
                  onValueChange={(v) =>
                    setFormData({
                      ...formData,
                      sorting: { ...(formData.sorting as object), field: v },
                    })
                  }
                >
                  <SelectTrigger className="h-9 flex-1">
                    <SelectValue placeholder="Default" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedFields.map((key) => (
                      <SelectItem key={key} value={key}>
                        {fieldLabel(key)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={(formData.sorting as { order?: string })?.order ?? "desc"}
                  onValueChange={(v) =>
                    setFormData({
                      ...formData,
                      sorting: {
                        ...(formData.sorting as object),
                        order: v === "asc" ? "asc" : "desc",
                      },
                    })
                  }
                >
                  <SelectTrigger className="h-9 w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Ascending</SelectItem>
                    <SelectItem value="desc">Descending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 6 && (
        <div className="space-y-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-foreground border-b border-gray-100 dark:border-border pb-2">
            Step 6: Chart Settings
          </h3>
          {formData.report_type === "table" ? (
            <p className="text-sm text-gray-500">
              Chart settings apply when report type is Chart or Table & Chart.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label>Chart Type</Label>
                <Select
                  value={(formData.chart_config as { type?: string })?.type ?? "bar"}
                  onValueChange={(v) =>
                    setFormData({
                      ...formData,
                      chart_config: { ...(formData.chart_config as object), type: v },
                    })
                  }
                >
                  <SelectTrigger className="mt-1 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHART_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>X Axis</Label>
                <Select
                  value={(formData.chart_config as { x_axis?: string })?.x_axis ?? ""}
                  onValueChange={(v) =>
                    setFormData({
                      ...formData,
                      chart_config: { ...(formData.chart_config as object), x_axis: v },
                    })
                  }
                >
                  <SelectTrigger className="mt-1 h-9">
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedFields.map((key) => (
                      <SelectItem key={key} value={key}>
                        {fieldLabel(key)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Y Axis (numeric)</Label>
                <Select
                  value={(formData.chart_config as { y_axis?: string })?.y_axis ?? ""}
                  onValueChange={(v) =>
                    setFormData({
                      ...formData,
                      chart_config: { ...(formData.chart_config as object), y_axis: v },
                    })
                  }
                >
                  <SelectTrigger className="mt-1 h-9">
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFields
                      .filter((f) => selectedFields.includes(f.key) && f.type === "number")
                      .map((f) => (
                        <SelectItem key={f.key} value={f.key}>
                          {f.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap justify-between gap-3 mt-8 pt-6 border-t border-gray-100 dark:border-border">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1 || loading}
          >
            Previous
          </Button>
          {step < 6 ? (
            <Button
              type="button"
              onClick={goNext}
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white"
              disabled={loading}
            >
              Next
            </Button>
          ) : (
            <>
              <Button
                type="button"
                onClick={onSave}
                className="bg-[#22C55E] hover:bg-[#16A34A] text-white"
                disabled={loading || !formData.name}
              >
                {loading ? "Saving..." : "Save Report"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onSaveAndRun}
                disabled={loading || !formData.name}
              >
                {loading ? "Running..." : "Save & Run"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
