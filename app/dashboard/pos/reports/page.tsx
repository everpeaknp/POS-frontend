"use client";

import { PageLoading } from "@/components/shared/PageLoading";

import { FormattedDate } from "@/components/shared/FormattedDate";
import { useState, useEffect, useRef } from "react";
import { Calendar, DollarSign, ShoppingCart, TrendingUp, Eye, Printer, Download, ClipboardList } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/shared/DateInput";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DashHeader } from "@/components/dashboard/dash-header";
import posApi, { type POSDailySalesReport, type ZReport } from "@/lib/api/pos";
import { inventoryApi, type Warehouse } from "@/lib/api/inventory";
import toast from "react-hot-toast";
import { useReactToPrint } from "react-to-print";

export default function POSReportsPage() {
  const [reports, setReports] = useState<POSDailySalesReport[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [filterDate, setFilterDate] = useState("");

  const [activeTab, setActiveTab] = useState<"daily" | "zreport">("daily");
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [zReportDialogOpen, setZReportDialogOpen] = useState(false);
  const [loadingZReport, setLoadingZReport] = useState(false);
  const [zReportData, setZReportData] = useState<ZReport | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrintZReport = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Z-Report-${zReportData?.session_number || "Session"}`,
  });

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await posApi.getSessions();
      // Show closed sessions for Z-Reports
      const closed = (res.results || []).filter(s => s.status === "closed");
      setSessions(closed);
    } catch (error) {
      toast.error("Failed to load sessions");
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    if (activeTab === "zreport") {
      fetchSessions();
    }
  }, [activeTab]);

  const handleViewZReport = async (sessionId: string) => {
    setZReportDialogOpen(true);
    setLoadingZReport(true);
    setZReportData(null);
    try {
      const data = await posApi.generateZReport(sessionId);
      setZReportData(data);
    } catch (error) {
      toast.error("Failed to generate Z-Report");
      setZReportDialogOpen(false);
    } finally {
      setLoadingZReport(false);
    }
  };

  const handleDownloadZReport = () => {
    if (!zReportData) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(zReportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Z-Report-${zReportData.session_number}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reportsRes, warehousesRes] = await Promise.all([
          posApi.getDailySalesReports(),
          inventoryApi.warehouses.list({ page_size: 500 })
        ]);
        setReports(reportsRes.results || []);
        setWarehouses(warehousesRes.data.results || []);
      } catch (error: any) {
        console.error("Error loading reports:", error);
        const errorMessage = error.response?.data?.detail || error.message || "Failed to load reports";
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleGenerateReport = async () => {
    if (!selectedDate) {
      toast.error("Please select a date");
      return;
    }
    
    setGenerating(true);
    try {
      const data: any = { date: selectedDate };
      if (selectedWarehouse) data.warehouse_id = parseInt(selectedWarehouse);
      
      await posApi.generateDailySalesReport(data);
      toast.success("Report generated successfully");
      
      // Refresh reports list
      const reportsRes = await posApi.getDailySalesReports();
      setReports(reportsRes.results || []);
    } catch (error: any) {
      console.error("Error generating report:", error);
      const errorMessage = error.response?.data?.error || error.response?.data?.detail || error.message || "Failed to generate report";
      toast.error(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  const filteredReports = reports.filter(report => {
    if (filterDate && report.date !== filterDate) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="POS Reports" subtitle="Loading..." />
        <PageLoading message="Loading…" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="POS Reports" subtitle="Daily sales reports and analytics" />
      
      <div className="flex-1 p-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab("daily")}
            className={`pb-3 px-4 font-medium text-sm border-b-2 transition-colors -mb-px ${
              activeTab === "daily"
                ? "border-[#22C55E] text-[#22C55E]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Daily Sales Reports
          </button>
          <button
            onClick={() => setActiveTab("zreport")}
            className={`pb-3 px-4 font-medium text-sm border-b-2 transition-colors -mb-px ${
              activeTab === "zreport"
                ? "border-[#22C55E] text-[#22C55E]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Z-Reports (End of Day)
          </button>
        </div>

        {activeTab === "daily" && (
          <div className="space-y-6">
            {/* Info Banner */}
            {reports.length === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold mt-0.5">
                    i
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-blue-900 font-medium mb-1">
                      Welcome to POS Reports
                    </p>
                    <p className="text-xs text-blue-700">
                      This page shows daily sales reports generated from your POS transactions. 
                      To get started, select a date below and click "Generate Report" to create your first report.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Generate Report */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-semibold mb-4">Generate Daily Sales Report</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm">Date *</Label>
                  <DateInput
                    value={selectedDate}
                    onChange={(date) => setSelectedDate(date)}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label className="text-sm">Warehouse (Optional)</Label>
                  <Select value={selectedWarehouse} onValueChange={(value) => setSelectedWarehouse(value || "")}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="All warehouses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Warehouses</SelectItem>
                      {warehouses.map(w => (
                        <SelectItem key={w.id} value={w.id.toString()}>{w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  <Button
                    onClick={handleGenerateReport}
                    disabled={generating}
                    className="w-full bg-[#22C55E] hover:bg-[#16A34A]"
                  >
                    {generating ? "Generating..." : (
                      <>
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Generate Report
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Filter Reports */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center gap-3">
                <Label className="text-sm">Filter by Date:</Label>
                <DateInput
                  value={filterDate}
                  onChange={(date) => setFilterDate(date)}
                  className="max-w-xs"
                />
                {filterDate && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setFilterDate("")}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {/* Reports List */}
            <div className="space-y-4">
              {filteredReports.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-600 font-medium mb-2">No reports found</p>
                  <p className="text-sm text-gray-400 mb-4">
                    {filterDate 
                      ? "No reports exist for the selected date. Try a different date or generate a new report."
                      : "Generate your first report by selecting a date and clicking the 'Generate Report' button above."}
                  </p>
                  {!filterDate && (
                    <p className="text-xs text-gray-400 mt-2">
                      💡 Tip: Reports are generated on-demand and show sales data from POS transactions.
                    </p>
                  )}
                </div>
              ) : (
                filteredReports.map((report) => (
                  <div key={report.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">
                          <FormattedDate value={report.date} />
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {report.warehouse_name || "All Warehouses"} ·{" "}
                          {report.cashier_name || "All Cashiers"}
                        </p>
                      </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <ShoppingCart className="h-4 w-4 text-blue-600" />
                          <span className="text-xs text-blue-600 font-medium">Transactions</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-700">
                          {report.total_transactions}
                        </div>
                      </div>

                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="text-xs text-green-600 font-medium">Gross Sales</span>
                        </div>
                        <div className="text-2xl font-bold text-green-700">
                          Rs. {report.gross_sales.toLocaleString()}
                        </div>
                      </div>

                      <div className="bg-purple-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-purple-600" />
                          <span className="text-xs text-purple-600 font-medium">Net Sales</span>
                        </div>
                        <div className="text-2xl font-bold text-purple-700">
                          Rs. {report.net_sales.toLocaleString()}
                        </div>
                      </div>

                      <div className="bg-orange-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <ShoppingCart className="h-4 w-4 text-orange-600" />
                          <span className="text-xs text-orange-600 font-medium">Items Sold</span>
                        </div>
                        <div className="text-2xl font-bold text-orange-700">
                          {report.total_items_sold}
                        </div>
                      </div>
                    </div>

                    {/* Detailed Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Payment Methods */}
                      <div>
                        <h4 className="font-medium text-sm mb-3 text-gray-700">Payment Methods</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Cash</span>
                            <span className="font-medium">Rs. {report.cash_sales.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Card</span>
                            <span className="font-medium">Rs. {report.card_sales.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">eSewa</span>
                            <span className="font-medium">Rs. {report.esewa_sales.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Khalti</span>
                            <span className="font-medium">Rs. {report.khalti_sales.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Fonepay</span>
                            <span className="font-medium">Rs. {report.fonepay_sales.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Credit</span>
                            <span className="font-medium">Rs. {report.credit_sales.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Other Metrics */}
                      <div>
                        <h4 className="font-medium text-sm mb-3 text-gray-700">Other Metrics</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total Discounts</span>
                            <span className="font-medium text-red-600">Rs. {report.total_discounts.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total Tax</span>
                            <span className="font-medium">Rs. {report.total_tax.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Cancelled Transactions</span>
                            <span className="font-medium">{report.cancelled_transactions}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Refunded Amount</span>
                            <span className="font-medium text-red-600">Rs. {report.refunded_amount.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
                      Generated on {new Date(report.generated_at).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "zreport" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-semibold mb-4">Z-Reports History (Closed POS Sessions)</h3>
              {loadingSessions ? (
                <div className="py-8 text-center text-gray-500">Loading closed sessions...</div>
              ) : sessions.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  <ClipboardList className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium mb-1">No closed sessions found</p>
                  <p className="text-sm">Once you close a POS session, its Z-Report will appear here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Session ID</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Cashier</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Opened</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Closed</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Expected Cash</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Actual Cash</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Variance</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {sessions.map((session) => (
                        <tr key={session.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 font-mono text-xs text-[#22C55E] font-medium">
                            {session.session_number}
                          </td>
                          <td className="px-4 py-3 text-gray-600">{session.cashier_name}</td>
                          <td className="px-4 py-3 text-gray-600">
                            {new Date(session.opened_at).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {session.closed_at ? new Date(session.closed_at).toLocaleString() : "—"}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-800 font-medium">
                            Rs. {session.expected_cash?.toLocaleString() ?? "0"}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-800 font-medium">
                            Rs. {session.closing_cash?.toLocaleString() ?? "0"}
                          </td>
                          <td className={`px-4 py-3 text-right font-semibold ${
                            session.cash_variance < 0 
                              ? "text-red-600" 
                              : session.cash_variance > 0 
                              ? "text-blue-600" 
                              : "text-green-600"
                          }`}>
                            Rs. {session.cash_variance?.toLocaleString() ?? "0"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewZReport(session.id)}
                              className="h-8 gap-1 border-gray-200 text-[#22C55E] hover:text-white hover:bg-[#22C55E]"
                            >
                              <Eye className="h-3.5 w-3.5" /> View Z-Report
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Z-Report Dialog */}
      <Dialog open={zReportDialogOpen} onOpenChange={setZReportDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <ClipboardList className="h-5 w-5 text-[#22C55E]" />
              Z-Report: {loadingZReport ? "Loading..." : zReportData?.session_number}
            </DialogTitle>
          </DialogHeader>

          {loadingZReport ? (
            <div className="py-12 text-center text-gray-500">Generating Z-Report...</div>
          ) : zReportData ? (
            <div className="space-y-6">
              {/* Report Header Information */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg text-sm">
                <div>
                  <span className="text-xs text-gray-400 block">Cashier</span>
                  <span className="font-semibold text-gray-800">{zReportData.cashier}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block">Warehouse</span>
                  <span className="font-semibold text-gray-800">{zReportData.warehouse || "N/A"}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block">Opened</span>
                  <span className="font-medium text-gray-700">
                    {new Date(zReportData.opened_at).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block">Closed</span>
                  <span className="font-medium text-gray-700">
                    {zReportData.closed_at ? new Date(zReportData.closed_at).toLocaleString() : "—"}
                  </span>
                </div>
              </div>

              {/* Main metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="border border-gray-100 rounded-lg p-3 text-center">
                  <span className="text-xs text-gray-400 uppercase block font-medium">Transactions</span>
                  <span className="text-xl font-bold text-gray-800">{zReportData.total_transactions}</span>
                </div>
                <div className="border border-gray-100 rounded-lg p-3 text-center">
                  <span className="text-xs text-gray-400 uppercase block font-medium">Items Sold</span>
                  <span className="text-xl font-bold text-gray-800">{zReportData.total_items_sold}</span>
                </div>
                <div className="border border-gray-100 rounded-lg p-3 text-center">
                  <span className="text-xs text-gray-400 uppercase block font-medium">Gross Sales</span>
                  <span className="text-xl font-bold text-gray-800">Rs. {zReportData.gross_sales.toLocaleString()}</span>
                </div>
                <div className="border border-gray-100 rounded-lg p-3 text-center">
                  <span className="text-xs text-gray-400 uppercase block font-medium">Net Sales</span>
                  <span className="text-xl font-bold text-[#22C55E]">Rs. {zReportData.net_sales.toLocaleString()}</span>
                </div>
              </div>

              {/* Detailed Breakdown Panels */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cash Reconciliation */}
                <div className="bg-white rounded-lg border border-gray-100 p-4 space-y-3">
                  <h4 className="font-bold text-sm text-gray-700 border-b pb-2 uppercase tracking-wider">
                    Cash Reconciliation
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Opening Cash</span>
                      <span>Rs. {zReportData.opening_cash.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Cash In (Deposits)</span>
                      <span className="text-green-600">+ Rs. {zReportData.cash_in.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Cash Out (Withdrawals)</span>
                      <span className="text-red-600">- Rs. {zReportData.cash_out.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-500">Expected Closing Cash</span>
                      <span className="font-semibold text-gray-800">Rs. {zReportData.expected_cash.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Actual Closing Cash</span>
                      <span className="font-semibold text-gray-800">
                        Rs. {zReportData.closing_cash?.toLocaleString() ?? "—"}
                      </span>
                    </div>
                    <div className={`flex justify-between border-t pt-2 font-bold ${
                      zReportData.cash_variance === 0 
                        ? "text-green-600" 
                        : zReportData.cash_variance < 0 
                        ? "text-red-600" 
                        : "text-blue-600"
                    }`}>
                      <span>Reconciliation Status</span>
                      <span>
                        {zReportData.cash_variance === 0 
                          ? "Balanced" 
                          : zReportData.cash_variance < 0 
                          ? `Cash Short (Rs. ${Math.abs(zReportData.cash_variance).toLocaleString()})`
                          : `Cash Over (Rs. ${zReportData.cash_variance.toLocaleString()})`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="bg-white rounded-lg border border-gray-100 p-4 space-y-3">
                  <h4 className="font-bold text-sm text-gray-700 border-b pb-2 uppercase tracking-wider">
                    Payment Method Summary
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Cash Sales</span>
                      <span>Rs. {zReportData.cash_sales.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Card Sales</span>
                      <span>Rs. {zReportData.card_sales.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Credit Sales</span>
                      <span>Rs. {zReportData.credit_sales.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-500">Digital Wallets (Total)</span>
                      <span className="font-semibold text-gray-800">
                        Rs. {zReportData.digital_wallet_sales.toLocaleString()}
                      </span>
                    </div>
                    <div className="pl-4 space-y-1 text-xs text-gray-400">
                      <div className="flex justify-between">
                        <span>eSewa</span>
                        <span>Rs. {zReportData.esewa_sales.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Khalti</span>
                        <span>Rs. {zReportData.khalti_sales.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Fonepay</span>
                        <span>Rs. {zReportData.fonepay_sales.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Refund & Adjustment Summary */}
                <div className="bg-white rounded-lg border border-gray-100 p-4 space-y-3">
                  <h4 className="font-bold text-sm text-gray-700 border-b pb-2 uppercase tracking-wider">
                    Refunds & Adjustments
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Refunded Transactions</span>
                      <span>{zReportData.refunded_transactions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Refunded Amount</span>
                      <span className="text-red-500">Rs. {zReportData.refunded_amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Cancelled Transactions</span>
                      <span>{zReportData.cancelled_transactions}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-500">Total Discounts Given</span>
                      <span className="text-red-500">Rs. {zReportData.total_discounts.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Tax Collections */}
                <div className="bg-white rounded-lg border border-gray-100 p-4 space-y-3">
                  <h4 className="font-bold text-sm text-gray-700 border-b pb-2 uppercase tracking-wider">
                    Tax Collections
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tax Collected</span>
                      <span className="font-semibold">Rs. {zReportData.tax_collected.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button
                  onClick={handleDownloadZReport}
                  variant="outline"
                  className="gap-2"
                >
                  <Download className="h-4 w-4" /> Download JSON
                </Button>
                <Button
                  onClick={handlePrintZReport}
                  className="gap-2 bg-[#22C55E] hover:bg-[#16A34A] text-white"
                >
                  <Printer className="h-4 w-4" /> Print Z-Report
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-red-500">No report data found.</div>
          )}
        </DialogContent>
      </Dialog>

      {/* Hidden Print Template */}
      <div className="hidden">
        <div ref={printRef} className="p-8 space-y-6 text-black bg-white font-mono text-sm max-w-[800px] mx-auto">
          <div className="text-center space-y-1 border-b pb-4">
            <h1 className="text-xl font-bold uppercase">Z-Report (End of Day)</h1>
            <p className="text-xs text-gray-500">Session Number: {zReportData?.session_number}</p>
            <p className="text-xs text-gray-500">Generated: {zReportData ? new Date(zReportData.report_generated_at).toLocaleString() : ""}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div><strong>Cashier:</strong> {zReportData?.cashier}</div>
            <div><strong>Warehouse:</strong> {zReportData?.warehouse || "N/A"}</div>
            <div><strong>Opened At:</strong> {zReportData?.opened_at ? new Date(zReportData.opened_at).toLocaleString() : ""}</div>
            <div><strong>Closed At:</strong> {zReportData?.closed_at ? new Date(zReportData.closed_at).toLocaleString() : ""}</div>
          </div>
          
          <div className="border-t pt-4">
            <h2 className="font-bold mb-2 uppercase text-xs">Sales Summary</h2>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between"><span>Gross Sales:</span> <span>Rs. {zReportData?.gross_sales.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Total Discounts:</span> <span>Rs. {zReportData?.total_discounts.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Tax Collected:</span> <span>Rs. {zReportData?.tax_collected.toLocaleString()}</span></div>
              <div className="flex justify-between font-bold border-t pt-1"><span>Net Sales:</span> <span>Rs. {zReportData?.net_sales.toLocaleString()}</span></div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h2 className="font-bold mb-2 uppercase text-xs">Payment Method Summary</h2>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between"><span>Cash Sales:</span> <span>Rs. {zReportData?.cash_sales.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Card Sales:</span> <span>Rs. {zReportData?.card_sales.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Credit Sales:</span> <span>Rs. {zReportData?.credit_sales.toLocaleString()}</span></div>
              <div className="flex justify-between font-bold border-t pt-1"><span>Digital Wallets (Total):</span> <span>Rs. {zReportData?.digital_wallet_sales.toLocaleString()}</span></div>
              <div className="pl-4 space-y-1 text-[11px] text-gray-500">
                <div className="flex justify-between"><span>eSewa:</span> <span>Rs. {zReportData?.esewa_sales.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Khalti:</span> <span>Rs. {zReportData?.khalti_sales.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Fonepay:</span> <span>Rs. {zReportData?.fonepay_sales.toLocaleString()}</span></div>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h2 className="font-bold mb-2 uppercase text-xs">Cash Reconciliation</h2>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between"><span>Opening Cash:</span> <span>Rs. {zReportData?.opening_cash.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Cash In:</span> <span>Rs. {zReportData?.cash_in.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Cash Out:</span> <span>Rs. {zReportData?.cash_out.toLocaleString()}</span></div>
              <div className="flex justify-between font-bold border-t pt-1"><span>Expected Closing Cash:</span> <span>Rs. {zReportData?.expected_cash.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Actual Closing Cash:</span> <span>Rs. {zReportData?.closing_cash?.toLocaleString() ?? "—"}</span></div>
              <div className="flex justify-between font-bold border-t pt-1">
                <span>Variance:</span> 
                <span>Rs. {zReportData?.cash_variance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span> 
                <span>
                  {zReportData && zReportData.cash_variance === 0 
                    ? "Balanced" 
                    : zReportData && zReportData.cash_variance < 0 
                    ? "Cash Short" 
                    : "Cash Over"}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h2 className="font-bold mb-2 uppercase text-xs">Transaction Summary</h2>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between"><span>Total Transactions:</span> <span>{zReportData?.total_transactions}</span></div>
              <div className="flex justify-between"><span>Total Items Sold:</span> <span>{zReportData?.total_items_sold}</span></div>
              <div className="flex justify-between"><span>Refunded Transactions:</span> <span>{zReportData?.refunded_transactions}</span></div>
              <div className="flex justify-between"><span>Refunded Amount:</span> <span>Rs. {zReportData?.refunded_amount.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Cancelled Transactions:</span> <span>{zReportData?.cancelled_transactions}</span></div>
            </div>
          </div>
          
          <div className="text-center pt-8 border-t text-[10px] text-gray-400">
            End of Z-Report
          </div>
        </div>
      </div>
    </div>
  );
}
