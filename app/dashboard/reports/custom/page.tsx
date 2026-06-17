"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DashHeader } from "@/components/dashboard/dash-header";
import { customReportsAPI, CustomReport, CustomReportCreateData } from "@/lib/api/reports";
import toast from "react-hot-toast";

export default function CustomReportsPage() {
  const [tab, setTab] = useState("saved");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<CustomReport[]>([]);
  const [formData, setFormData] = useState<CustomReportCreateData>({
    name: "",
    report_type: "table",
    description: "",
    module: "sales",
    fields: [],
    filters: [],
    grouping: {},
    sorting: {},
    chart_config: {},
    schedule: "none",
  });

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
    } catch (error: any) {
      console.error("Failed to load custom reports:", error);
      toast.error(error.response?.data?.detail || "Failed to load custom reports");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReport = async () => {
    try {
      setLoading(true);
      const result = await customReportsAPI.create(formData);
      toast.success(result.message);
      setTab("saved");
      setStep(1);
      setFormData({
        name: "",
        report_type: "table",
        description: "",
        module: "sales",
        fields: [],
        filters: [],
        grouping: {},
        sorting: {},
        chart_config: {},
        schedule: "none",
      });
      fetchReports();
    } catch (error: any) {
      console.error("Failed to create report:", error);
      toast.error(error.response?.data?.detail || "Failed to create report");
    } finally {
      setLoading(false);
    }
  };

  const handleRunReport = async (reportId: string) => {
    try {
      setLoading(true);
      const result = await customReportsAPI.run(reportId);
      toast.success(`Report "${result.report_name}" executed successfully`);
      // In production, you would display the results in a modal or new page
      console.log("Report results:", result);
    } catch (error: any) {
      console.error("Failed to run report:", error);
      toast.error(error.response?.data?.detail || "Failed to run report");
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
    } catch (error: any) {
      console.error("Failed to duplicate report:", error);
      toast.error(error.response?.data?.detail || "Failed to duplicate report");
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
    } catch (error: any) {
      console.error("Failed to delete report:", error);
      toast.error(error.response?.data?.detail || "Failed to delete report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Custom Reports" subtitle="Build and manage custom reports" />
      <div className="flex-1 p-6 space-y-6">
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="saved">Saved Reports</TabsTrigger>
            <TabsTrigger value="builder">Build New Report</TabsTrigger>
          </TabsList>

          {/* Saved Reports Tab */}
          <TabsContent value="saved" className="space-y-4 mt-4">
            <div className="flex justify-end">
              <Button onClick={() => setTab("builder")} className="bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5">
                <Plus className="h-4 w-4" /> New Custom Report
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : reports.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
                <p className="text-gray-500">No custom reports yet. Create your first report to get started.</p>
                <Button onClick={() => setTab("builder")} className="mt-4 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5">
                  <Plus className="h-4 w-4" /> Create Report
                </Button>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {["Report Name", "Created By", "Last Run", "Schedule", "Actions"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {reports.map((report) => (
                      <tr key={report.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium text-gray-900">{report.name}</td>
                        <td className="px-4 py-3 text-gray-600">{report.created_by_name}</td>
                        <td className="px-4 py-3 text-gray-600">{report.last_run_display || 'Never'}</td>
                        <td className="px-4 py-3 text-gray-600 capitalize">{report.schedule}</td>
                        <td className="px-4 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger className="p-1 rounded hover:bg-gray-100 focus:outline-none">
                              <MoreVertical className="h-4 w-4 text-gray-400" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem onClick={() => handleRunReport(report.id)}>Run</DropdownMenuItem>
                              <DropdownMenuItem>Edit</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicateReport(report.id)}>Duplicate</DropdownMenuItem>
                              <DropdownMenuItem>Share</DropdownMenuItem>
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
            )}
          </TabsContent>

          {/* Build Report Tab */}
          <TabsContent value="builder" className="space-y-4 mt-4">
            <div className="max-w-3xl bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              {/* Step Indicator */}
              <div className="flex gap-2 mb-6">
                {[1, 2, 3, 4, 5, 6].map((s) => (
                  <div key={s} className={`flex-1 h-2 rounded-full ${s <= step ? "bg-[#22C55E]" : "bg-gray-200"}`} />
                ))}
              </div>

              {step === 1 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Step 1: Report Setup</h3>
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">Report Name*</Label>
                    <Input 
                      id="name" 
                      placeholder="Enter report name" 
                      value={formData.name} 
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                      className="mt-1 h-9 border-gray-200" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="type" className="text-sm font-medium text-gray-700">Report Type*</Label>
                    <Select value={formData.report_type} onValueChange={(v) => setFormData({ ...formData, report_type: v as any })}>
                      <SelectTrigger className="mt-1 h-9 border-gray-200"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["Table", "Chart", "Both"].map((t) => <SelectItem key={t} value={t.toLowerCase()}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description</Label>
                    <textarea 
                      placeholder="Enter report description" 
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" 
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Step 2: Select Data Source</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {(["sales", "purchase", "inventory", "accounting", "hr", "pos"] as const).map((module) => (
                      <button 
                        key={module} 
                        onClick={() => setFormData({ ...formData, module })} 
                        className={`p-4 rounded-lg border-2 transition-all ${formData.module === module ? "border-[#22C55E] bg-green-50" : "border-gray-200 hover:border-gray-300"}`}
                      >
                        <p className="font-medium text-gray-900 capitalize">{module}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Step 3: Select Fields</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Available Fields</p>
                      <div className="border border-gray-200 rounded-lg p-3 space-y-2 h-64 overflow-y-auto">
                        {["Date", "Amount", "Customer", "Product", "Quantity", "Status"].map((field) => (
                          <div key={field} className="p-2 bg-gray-50 rounded cursor-move text-sm text-gray-700">
                            {field}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Selected Fields</p>
                      <div className="border border-gray-200 rounded-lg p-3 space-y-2 h-64 overflow-y-auto bg-green-50">
                        <div className="p-2 bg-white rounded text-sm text-gray-700">Date</div>
                        <div className="p-2 bg-white rounded text-sm text-gray-700">Amount</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Step 4: Add Filters</h3>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Select>
                        <SelectTrigger className="h-9 flex-1 border-gray-200"><SelectValue placeholder="Select field" /></SelectTrigger>
                        <SelectContent>
                          {["Date", "Amount", "Customer", "Status"].map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Select>
                        <SelectTrigger className="h-9 w-32 border-gray-200"><SelectValue placeholder="Operator" /></SelectTrigger>
                        <SelectContent>
                          {["Equals", "Greater", "Less", "Contains"].map((op) => <SelectItem key={op} value={op}>{op}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Input placeholder="Value" className="h-9 flex-1 border-gray-200" />
                    </div>
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Step 5: Grouping & Sorting</h3>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Group By</Label>
                    <Select>
                      <SelectTrigger className="mt-1 h-9 border-gray-200"><SelectValue placeholder="Select field" /></SelectTrigger>
                      <SelectContent>
                        {["Date", "Customer", "Product", "Category"].map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Sort By</Label>
                    <div className="flex gap-2 mt-1">
                      <Select>
                        <SelectTrigger className="h-9 flex-1 border-gray-200"><SelectValue placeholder="Select field" /></SelectTrigger>
                        <SelectContent>
                          {["Date", "Amount", "Customer"].map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Select>
                        <SelectTrigger className="h-9 w-32 border-gray-200"><SelectValue placeholder="Order" /></SelectTrigger>
                        <SelectContent>
                          {["Ascending", "Descending"].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {step === 6 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Step 6: Chart Settings</h3>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Chart Type</Label>
                    <Select>
                      <SelectTrigger className="mt-1 h-9 border-gray-200"><SelectValue placeholder="Select chart type" /></SelectTrigger>
                      <SelectContent>
                        {["Bar", "Line", "Pie", "Donut", "Area"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">X Axis</Label>
                    <Select>
                      <SelectTrigger className="mt-1 h-9 border-gray-200"><SelectValue placeholder="Select field" /></SelectTrigger>
                      <SelectContent>
                        {["Date", "Category", "Customer"].map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-3 mt-8 pt-6 border-t border-gray-100">
                <Button variant="outline" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1 || loading}>
                  Previous
                </Button>
                {step < 6 ? (
                  <Button onClick={() => setStep(step + 1)} className="bg-[#22C55E] hover:bg-[#16A34A] text-white" disabled={loading}>
                    Next
                  </Button>
                ) : (
                  <>
                    <Button 
                      onClick={handleCreateReport} 
                      className="bg-[#22C55E] hover:bg-[#16A34A] text-white"
                      disabled={loading || !formData.name || !formData.module}
                    >
                      {loading ? 'Saving...' : 'Save Report'}
                    </Button>
                    <Button variant="outline" disabled={loading}>Run Now</Button>
                  </>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
