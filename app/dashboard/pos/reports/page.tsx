"use client";

import { useState, useEffect } from "react";
import { Calendar, DollarSign, ShoppingCart, TrendingUp, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashHeader } from "@/components/dashboard/dash-header";
import posApi, { type POSDailySalesReport } from "@/lib/api/pos";
import { inventoryApi, type Warehouse } from "@/lib/api/inventory";
import toast from "react-hot-toast";

export default function POSReportsPage() {
  const [reports, setReports] = useState<POSDailySalesReport[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reportsRes, warehousesRes] = await Promise.all([
          posApi.getDailySalesReports(),
          inventoryApi.warehouses.list()
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
        <div className="flex-1 p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#22C55E]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="POS Reports" subtitle="Daily sales reports and analytics" />
      
      <div className="flex-1 p-6 space-y-6">
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
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
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
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
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
            <Input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
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
                      {new Date(report.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {report.warehouse_name || "All Warehouses"} • 
                      {report.cashier_name || "All Cashiers"}
                    </p>
                  </div>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
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
                        <span className="text-gray-600">UPI/Digital</span>
                        <span className="font-medium">Rs. {report.upi_sales.toLocaleString()}</span>
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
    </div>
  );
}
