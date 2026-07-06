"use client";

import { PageLoading } from "@/components/shared/PageLoading";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CustomReportBuilder } from "@/components/reports/CustomReportBuilder";
import { CustomReportRunModal } from "@/components/reports/CustomReportRunModal";
import { CustomReportRunParamsDialog } from "@/components/reports/CustomReportRunParamsDialog";
import {
  ReportsPageShell,
  ReportsLoadingState,
  reportsCardClass,
  reportsTableWrapClass,
} from "@/components/reports/ReportsPageShell";
import {
  customReportsAPI,
  CustomReport,
  CustomReportCreateData,
  type CustomReportRunResult,
} from "@/lib/api/reports";
import { emptyCustomReportForm } from "@/lib/reports/customReportConfig";
import toast from "react-hot-toast";

export default function CustomReportsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState("saved");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<CustomReport[]>([]);
  const [runResult, setRunResult] = useState<CustomReportRunResult | null>(null);
  const [runModalOpen, setRunModalOpen] = useState(false);
  const [runParamsOpen, setRunParamsOpen] = useState(false);
  const [pendingRunId, setPendingRunId] = useState<string | null>(null);
  const [pendingRunName, setPendingRunName] = useState<string>("");
  const [formData, setFormData] = useState<CustomReportCreateData>(emptyCustomReportForm());

  useEffect(() => {
    if (searchParams.get("tab") !== "builder") return;
    setTab("builder");
    setStep(1);
    router.replace("/dashboard/reports/custom", { scroll: false });
  }, [searchParams, router]);

  useEffect(() => {
    if (tab === "saved") {
      fetchReports();
    }
  }, [tab]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await customReportsAPI.list();
      setReports(data.results);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      console.error("Failed to load custom reports:", error);
      toast.error(err.response?.data?.detail || "Failed to load custom reports");
    } finally {
      setLoading(false);
    }
  };

  const ensureFields = async (data: CustomReportCreateData): Promise<CustomReportCreateData> => {
    if ((data.fields ?? []).length > 0) return data;
    try {
      const catalog = await customReportsAPI.getFields(data.module);
      const mod = catalog[data.module];
      if (mod?.default_fields?.length) {
        return { ...data, fields: [...mod.default_fields] };
      }
    } catch {
      // Builder validation will catch empty fields
    }
    return data;
  };

  const resetBuilder = () => {
    setStep(1);
    setFormData(emptyCustomReportForm());
  };

  const handleCreateReport = async () => {
    try {
      setLoading(true);
      const payload = await ensureFields(formData);
      if ((payload.fields ?? []).length === 0) {
        toast.error("Select at least one field");
        return;
      }
      const result = await customReportsAPI.create(payload);
      toast.success(result.message);
      setTab("saved");
      resetBuilder();
      fetchReports();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      console.error("Failed to create report:", error);
      toast.error(err.response?.data?.detail || "Failed to create report");
    } finally {
      setLoading(false);
    }
  };

  const executeRun = async (
    reportId: string,
    params?: { from_date?: string; to_date?: string }
  ) => {
    if (!reportId || !/^\d+$/.test(String(reportId))) {
      toast.error("Invalid report selected");
      return;
    }

    try {
      setLoading(true);
      const result = await customReportsAPI.run(reportId, params);
      setRunResult(result);
      setRunModalOpen(true);
      toast.success(`Report "${result.report_name}" executed`);
      fetchReports();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      console.error("Failed to run report:", error);
      toast.error(err.response?.data?.detail || "Failed to run report");
    } finally {
      setLoading(false);
      setRunParamsOpen(false);
      setPendingRunId(null);
      setPendingRunName("");
    }
  };

  const openRunDialog = (reportId: string, reportName: string) => {
    setPendingRunId(reportId);
    setPendingRunName(reportName);
    setRunParamsOpen(true);
  };

  const handleRunReport = (reportId: string, reportName: string) => {
    openRunDialog(reportId, reportName);
  };

  const handleCreateAndRun = async () => {
    try {
      setLoading(true);
      const payload = await ensureFields(formData);
      if ((payload.fields ?? []).length === 0) {
        toast.error("Select at least one field");
        return;
      }
      const result = await customReportsAPI.create(payload);
      toast.success(result.message);
      setTab("saved");
      resetBuilder();
      openRunDialog(result.report.id, result.report.name);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      console.error("Failed to create report:", error);
      toast.error(err.response?.data?.detail || "Failed to create report");
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicateReport = async (reportId: string) => {
    try {
      setLoading(true);
      const result = await customReportsAPI.duplicate(reportId);
      toast.success(result.message);
      fetchReports();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      console.error("Failed to duplicate report:", error);
      toast.error(err.response?.data?.detail || "Failed to duplicate report");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReport = async (reportId: string, reportName: string) => {
    if (!confirm(`Are you sure you want to delete "${reportName}"?`)) {
      return;
    }

    try {
      setLoading(true);
      const result = await customReportsAPI.delete(reportId);
      toast.success(result.message);
      fetchReports();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      console.error("Failed to delete report:", error);
      toast.error(err.response?.data?.detail || "Failed to delete report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ReportsPageShell
        title="Custom Reports"
        subtitle="Build and manage custom reports"
      >
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <div className={`${reportsCardClass} p-4`}>
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="saved">Saved Reports</TabsTrigger>
              <TabsTrigger value="builder">Build New Report</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="saved" className="space-y-4 mt-4">
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  resetBuilder();
                  setTab("builder");
                }}
                className="bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5"
              >
                <Plus className="h-4 w-4" /> New Custom Report
              </Button>
            </div>

            {loading && reports.length === 0 ? (
              <div className={`${reportsCardClass} p-12`}>
                <PageLoading message="Loading reports…" />
              </div>
            ) : reports.length === 0 ? (
              <div className={`${reportsCardClass} p-12 text-center`}>
                <p className="text-gray-500 dark:text-muted-foreground">
                  No custom reports yet. Create your first report to get started.
                </p>
                <Button
                  onClick={() => {
                    resetBuilder();
                    setTab("builder");
                  }}
                  className="mt-4 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5"
                >
                  <Plus className="h-4 w-4" /> Create Report
                </Button>
              </div>
            ) : (
              <div className={reportsTableWrapClass}>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-muted border-b border-gray-100 dark:border-border">
                      <tr>
                        {["Report Name", "Module", "Created By", "Last Run", "Schedule", "Actions"].map(
                          (h) => (
                            <th
                              key={h}
                              className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {h}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-border">
                      {reports.map((report) => (
                        <tr key={report.id} className="hover:bg-gray-50/50 dark:hover:bg-muted/30">
                          <td className="px-6 py-3 font-medium text-gray-900 dark:text-foreground">
                            {report.name}
                          </td>
                          <td className="px-6 py-3 text-gray-600 dark:text-muted-foreground capitalize">
                            {report.module}
                          </td>
                          <td className="px-6 py-3 text-gray-600 dark:text-muted-foreground">
                            {report.created_by_name}
                          </td>
                          <td className="px-6 py-3 text-gray-600 dark:text-muted-foreground">
                            {report.last_run_display || "Never"}
                          </td>
                          <td className="px-6 py-3 text-gray-600 dark:text-muted-foreground capitalize">
                            {report.schedule}
                          </td>
                          <td className="px-6 py-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger className="p-1 rounded hover:bg-gray-100 dark:hover:bg-muted focus:outline-none">
                                <MoreVertical className="h-4 w-4 text-gray-400" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem
                                  onClick={() => handleRunReport(report.id, report.name)}
                                >
                                  Run
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDuplicateReport(report.id)}
                                >
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600"
                                  onClick={() => handleDeleteReport(report.id, report.name)}
                                >
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="builder" className="space-y-4 mt-4">
            <CustomReportBuilder
              formData={formData}
              setFormData={setFormData}
              step={step}
              setStep={setStep}
              loading={loading}
              onSave={handleCreateReport}
              onSaveAndRun={handleCreateAndRun}
              onCancel={() => {
                resetBuilder();
                setTab("saved");
              }}
            />
          </TabsContent>
        </Tabs>
      </ReportsPageShell>

      <CustomReportRunParamsDialog
        open={runParamsOpen}
        onOpenChange={(open) => {
          setRunParamsOpen(open);
          if (!open) {
            setPendingRunId(null);
            setPendingRunName("");
          }
        }}
        reportName={pendingRunName}
        loading={loading}
        onConfirm={(params) => {
          if (pendingRunId) {
            executeRun(pendingRunId, params);
          }
        }}
      />

      <CustomReportRunModal
        open={runModalOpen}
        onOpenChange={setRunModalOpen}
        result={runResult}
      />
    </>
  );
}
