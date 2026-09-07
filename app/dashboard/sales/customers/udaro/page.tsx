"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Users, 
  FileText, 
  Clock, 
  TrendingDown, 
  Search, 
  Download,
  Share2,
  Filter,
  Calendar,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashHeader } from "@/components/dashboard/dash-header";
import { KhataLoading } from "@/components/shared/KhataLoading";
import { customerAPI, creditNoteAPI } from "@/lib/api/sales";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type TabType = "ledger" | "aging" | "credit-notes";

interface AgingBucket {
  range: string;
  customers: number;
  amount: number;
}

interface CustomerLedger {
  customer_id: number;
  customer_name: string;
  total_invoices: number;
  total_amount: number;
  total_paid: number;
  balance: number;
  overdue_amount: number;
  credit_limit: number;
  days_overdue: number;
}

export default function UdaroPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabType) || "ledger";

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  
  // Ledger data
  const [ledgerData, setLedgerData] = useState<CustomerLedger[]>([]);
  
  // Aging data
  const [agingData, setAgingData] = useState<AgingBucket[]>([]);
  
  // Credit notes data
  const [creditNotes, setCreditNotes] = useState<any[]>([]);

  // Share dialog
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerLedger | null>(null);

  useEffect(() => {
    // Initial load
    loadData(true);
  }, []);

  useEffect(() => {
    // Subsequent loads when tab or period changes
    if (!initialLoading) {
      loadData(false);
    }
  }, [activeTab, selectedPeriod]);

  const loadData = async (isInitial: boolean = false) => {
    if (isInitial) {
      setInitialLoading(true);
    } else {
      setLoading(true);
    }
    
    try {
      if (activeTab === "ledger") {
        await loadLedgerData();
      } else if (activeTab === "aging") {
        await loadAgingData();
      } else if (activeTab === "credit-notes") {
        await loadCreditNotes();
      }
    } catch (error) {
      console.error("Error loading udaro data:", error);
      toast.error("Failed to load data");
    } finally {
      if (isInitial) {
        setInitialLoading(false);
      } else {
        setLoading(false);
      }
    }
  };

  const loadLedgerData = async () => {
    try {
      const response = await customerAPI.list();
      const customers = response.data.results || [];
      
      // Transform to ledger format
      const ledger: CustomerLedger[] = customers
        .filter((c: any) => c.current_balance > 0)
        .map((c: any) => ({
          customer_id: c.id,
          customer_name: c.name,
          total_invoices: c.total_orders || 0,
          total_amount: c.total_spent || 0,
          total_paid: (c.total_spent || 0) - (c.current_balance || 0),
          balance: c.current_balance || 0,
          overdue_amount: c.overdue_amount || 0,
          credit_limit: c.credit_limit || 0,
          days_overdue: c.days_overdue || 0,
        }));

      setLedgerData(ledger);
    } catch (error) {
      console.error("Error loading ledger:", error);
      throw error;
    }
  };

  const loadAgingData = async () => {
    try {
      const response = await customerAPI.list();
      const customers = response.data.results || [];
      
      // Calculate aging buckets
      const buckets = [
        { range: "Current (0-30 days)", customers: 0, amount: 0 },
        { range: "31-60 days", customers: 0, amount: 0 },
        { range: "61-90 days", customers: 0, amount: 0 },
        { range: "91-120 days", customers: 0, amount: 0 },
        { range: "Over 120 days", customers: 0, amount: 0 },
      ];

      customers.forEach((c: any) => {
        if (c.current_balance <= 0) return;
        
        const days = c.days_overdue || 0;
        let bucketIndex = 0;
        
        if (days > 120) bucketIndex = 4;
        else if (days > 90) bucketIndex = 3;
        else if (days > 60) bucketIndex = 2;
        else if (days > 30) bucketIndex = 1;
        
        buckets[bucketIndex].customers += 1;
        buckets[bucketIndex].amount += c.current_balance || 0;
      });

      setAgingData(buckets);
    } catch (error) {
      console.error("Error loading aging data:", error);
      throw error;
    }
  };

  const loadCreditNotes = async () => {
    try {
      const response = await creditNoteAPI.list();
      setCreditNotes(response.data.results || []);
    } catch (error) {
      console.error("Error loading credit notes:", error);
      throw error;
    }
  };

  const handleShare = (customer: CustomerLedger) => {
    setSelectedCustomer(customer);
    setShareDialogOpen(true);
  };

  const handleShareViaWhatsApp = () => {
    if (!selectedCustomer) return;
    
    const message = encodeURIComponent(
      `*Outstanding Statement*\n\n` +
      `Customer: ${selectedCustomer.customer_name}\n` +
      `Total Outstanding: ${formatCurrency(selectedCustomer.balance)}\n` +
      `Overdue: ${formatCurrency(selectedCustomer.overdue_amount)}\n` +
      `Days Overdue: ${selectedCustomer.days_overdue}\n\n` +
      `Please clear your pending dues at the earliest.\n\n` +
      `Thank you!`
    );
    
    window.open(`https://wa.me/?text=${message}`, "_blank");
    setShareDialogOpen(false);
    toast.success("Opening WhatsApp...");
  };

  const handleShareViaSMS = () => {
    if (!selectedCustomer) return;
    
    const message = encodeURIComponent(
      `Outstanding: ${formatCurrency(selectedCustomer.balance)}. ` +
      `Overdue: ${formatCurrency(selectedCustomer.overdue_amount)}. ` +
      `Please clear pending dues. Thank you!`
    );
    
    window.open(`sms:?body=${message}`, "_blank");
    setShareDialogOpen(false);
    toast.success("Opening SMS app...");
  };

  const handleDownloadReport = () => {
    toast.success("Report download will be implemented soon");
  };

  const filteredLedger = ledgerData.filter((item) =>
    item.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCreditNotes = creditNotes.filter((cn) =>
    cn.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cn.credit_note_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate totals
  const totalOutstanding = ledgerData.reduce((sum, item) => sum + item.balance, 0);
  const totalOverdue = ledgerData.reduce((sum, item) => sum + item.overdue_amount, 0);
  const customersWithBalance = ledgerData.length;
  const totalCreditNotes = creditNotes.reduce((sum, cn) => sum + Number(cn.amount || 0), 0);

  // Show Khata loading for initial load
  if (initialLoading) {
    return <KhataLoading message="Loading Udaro..." fullScreen={false} />;
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader
        title="Udaro (Credit Management)"
        subtitle="Track customer credit, outstanding payments, and aging"
      />

      <div className="flex-1 p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {initialLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white dark:bg-card rounded-lg border border-gray-100 dark:border-border p-4">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              <div className="bg-white dark:bg-card rounded-lg border border-gray-100 dark:border-border p-4 transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-500 dark:text-muted-foreground">Total Outstanding</div>
                  <TrendingDown className="h-5 w-5 text-red-500" />
                </div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(totalOutstanding)}
                </div>
                <div className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
                  {customersWithBalance} customers
                </div>
              </div>

              <div className="bg-white dark:bg-card rounded-lg border border-gray-100 dark:border-border p-4 transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-500 dark:text-muted-foreground">Overdue Amount</div>
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                </div>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {formatCurrency(totalOverdue)}
                </div>
                <div className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
                  Immediate attention needed
                </div>
              </div>

              <div className="bg-white dark:bg-card rounded-lg border border-gray-100 dark:border-border p-4 transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-500 dark:text-muted-foreground">Credit Notes</div>
                  <FileText className="h-5 w-5 text-blue-500" />
                </div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(totalCreditNotes)}
                </div>
                <div className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
                  {creditNotes.length} notes issued
                </div>
              </div>

              <div className="bg-white dark:bg-card rounded-lg border border-gray-100 dark:border-border p-4 transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-500 dark:text-muted-foreground">Customers</div>
                  <Users className="h-5 w-5 text-green-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-foreground">
                  {customersWithBalance}
                </div>
                <div className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
                  With outstanding balance
                </div>
              </div>
            </>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-card rounded-lg border border-gray-100 dark:border-border">
          <div className="border-b border-gray-100 dark:border-border">
            <div className="flex items-center gap-1 p-2">
              <button
                onClick={() => setActiveTab("ledger")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === "ledger"
                    ? "bg-[var(--color-accent-custom,#22C55E)] text-white"
                    : "text-gray-600 dark:text-muted-foreground hover:bg-gray-100 dark:hover:bg-muted"
                }`}
              >
                <Users className="h-4 w-4 inline mr-2" />
                Customer Ledger
              </button>
              <button
                onClick={() => setActiveTab("aging")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === "aging"
                    ? "bg-[var(--color-accent-custom,#22C55E)] text-white"
                    : "text-gray-600 dark:text-muted-foreground hover:bg-gray-100 dark:hover:bg-muted"
                }`}
              >
                <Clock className="h-4 w-4 inline mr-2" />
                Aging Report
              </button>
              <button
                onClick={() => setActiveTab("credit-notes")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === "credit-notes"
                    ? "bg-[var(--color-accent-custom,#22C55E)] text-white"
                    : "text-gray-600 dark:text-muted-foreground hover:bg-gray-100 dark:hover:bg-muted"
                }`}
              >
                <FileText className="h-4 w-4 inline mr-2" />
                Credit Notes
              </button>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="p-4 border-b border-gray-100 dark:border-border">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder={`Search ${activeTab === "credit-notes" ? "credit notes" : "customers"}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-10 border-gray-200 dark:border-border"
                  />
                </div>
                {activeTab !== "aging" && (
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger className="w-[180px] h-10 border-gray-200 dark:border-border">
                      <SelectValue placeholder="Period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="30">Last 30 Days</SelectItem>
                      <SelectItem value="60">Last 60 Days</SelectItem>
                      <SelectItem value="90">Last 90 Days</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              <Button
                onClick={handleDownloadReport}
                variant="outline"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 min-h-[400px]">
            {loading ? (
              <div className="py-12 flex items-center justify-center">
                <KhataLoading message={`Loading ${activeTab === "ledger" ? "customer ledger" : activeTab === "aging" ? "aging report" : "credit notes"}...`} fullScreen={false} />
              </div>
            ) : (
              <div className="animate-in fade-in duration-300">
                {/* Ledger Tab */}
                {activeTab === "ledger" && (
                  <div className="space-y-4">
                    {filteredLedger.length === 0 ? (
                      <div className="py-12 text-center">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-muted-foreground">
                          {searchTerm ? "No customers found" : "No outstanding balances"}
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 dark:bg-muted/50 border-b border-gray-100 dark:border-border">
                            <tr>
                              {["Customer", "Invoices", "Total Amount", "Paid", "Outstanding", "Overdue", "Days", "Actions"].map((h) => (
                                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-muted-foreground uppercase">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-border">
                            {filteredLedger.map((item) => (
                              <tr
                                key={item.customer_id}
                                className="hover:bg-gray-50/50 dark:hover:bg-muted/30 cursor-pointer"
                                onClick={() => router.push(`/dashboard/sales/customers/${item.customer_id}`)}
                              >
                                <td className="px-4 py-3">
                                  <div className="font-medium text-gray-900 dark:text-foreground">
                                    {item.customer_name}
                                  </div>
                                  {item.balance > item.credit_limit && (
                                    <div className="text-xs text-red-500 mt-0.5">
                                      Exceeds credit limit
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground">
                                  {item.total_invoices}
                                </td>
                                <td className="px-4 py-3 font-medium text-gray-900 dark:text-foreground">
                                  {formatCurrency(item.total_amount)}
                                </td>
                                <td className="px-4 py-3 text-green-600 dark:text-green-400">
                                  {formatCurrency(item.total_paid)}
                                </td>
                                <td className="px-4 py-3 font-bold text-red-600 dark:text-red-400">
                                  {formatCurrency(item.balance)}
                                </td>
                                <td className="px-4 py-3 font-medium text-orange-600 dark:text-orange-400">
                                  {formatCurrency(item.overdue_amount)}
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                    item.days_overdue === 0 ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" :
                                    item.days_overdue <= 30 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" :
                                    item.days_overdue <= 60 ? "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" :
                                    "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                                  }`}>
                                    {item.days_overdue}d
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleShare(item);
                                    }}
                                    className="gap-1"
                                  >
                                    <Share2 className="h-3 w-3" />
                                    Share
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Aging Tab */}
                {activeTab === "aging" && (
                  <div className="space-y-4">
                    {agingData.every(b => b.customers === 0) ? (
                      <div className="py-12 text-center">
                        <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-muted-foreground">
                          No aging data available
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {agingData.map((bucket, index) => (
                            <div
                              key={index}
                              className="bg-gradient-to-br from-white to-gray-50 dark:from-card dark:to-muted rounded-lg border border-gray-100 dark:border-border p-5"
                            >
                              <div className="text-sm font-medium text-gray-700 dark:text-muted-foreground mb-3">
                                {bucket.range}
                              </div>
                              <div className="space-y-2">
                                <div>
                                  <div className="text-xs text-gray-500 dark:text-muted-foreground">Customers</div>
                                  <div className="text-xl font-bold text-gray-900 dark:text-foreground">
                                    {bucket.customers}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 dark:text-muted-foreground">Amount</div>
                                  <div className="text-xl font-bold text-red-600 dark:text-red-400">
                                    {formatCurrency(bucket.amount)}
                                  </div>
                                </div>
                              </div>
                              {bucket.amount > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-border">
                                  <div className="text-xs text-gray-500 dark:text-muted-foreground">
                                    Avg per customer: {formatCurrency(bucket.amount / bucket.customers)}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                            <div>
                              <div className="font-medium text-blue-900 dark:text-blue-300 mb-1">
                                Collection Priority
                              </div>
                              <div className="text-sm text-blue-700 dark:text-blue-400">
                                Focus on accounts over 60 days old. Consider sending reminders or implementing payment plans for overdue customers.
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Credit Notes Tab */}
                {activeTab === "credit-notes" && (
                  <div className="space-y-4">
                    {filteredCreditNotes.length === 0 ? (
                      <div className="py-12 text-center">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-muted-foreground mb-4">
                          {searchTerm ? "No credit notes found" : "No credit notes issued yet"}
                        </p>
                        <Button
                          onClick={() => router.push("/dashboard/sales/credit-notes/new")}
                          className="bg-[var(--color-accent-custom,#22C55E)] hover:bg-[var(--color-accent-custom-600,#16A34A)] text-white"
                        >
                          Create Credit Note
                        </Button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 dark:bg-muted/50 border-b border-gray-100 dark:border-border">
                            <tr>
                              {["Credit Note #", "Customer", "Invoice", "Date", "Amount", "Status"].map((h) => (
                                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-muted-foreground uppercase">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-border">
                            {filteredCreditNotes.map((cn) => (
                              <tr
                                key={cn.id}
                                onClick={() => router.push(`/dashboard/sales/credit-notes/${cn.id}`)}
                                className="hover:bg-gray-50/50 dark:hover:bg-muted/30 cursor-pointer"
                              >
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-gray-400" />
                                    <span className="font-mono text-xs text-[var(--color-accent-custom,#22C55E)]">
                                      {cn.credit_note_number}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 font-medium text-gray-900 dark:text-foreground">
                                  {cn.customer_name}
                                </td>
                                <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground text-xs">
                                  {cn.invoice_number}
                                </td>
                                <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground">
                                  {format(new Date(cn.date), "MMM dd, yyyy")}
                                </td>
                                <td className="px-4 py-3 font-bold text-red-600 dark:text-red-400">
                                  {formatCurrency(cn.amount)}
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                                    cn.status === "Applied" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" :
                                    cn.status === "Issued" ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" :
                                    "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                  }`}>
                                    {cn.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Statement</DialogTitle>
            <DialogDescription>
              Share outstanding statement with {selectedCustomer?.customer_name}
            </DialogDescription>
          </DialogHeader>

          {selectedCustomer && (
            <div className="space-y-4 py-4">
              <div className="bg-gray-50 dark:bg-muted rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-muted-foreground">Customer:</span>
                  <span className="font-medium text-gray-900 dark:text-foreground">{selectedCustomer.customer_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-muted-foreground">Outstanding:</span>
                  <span className="font-bold text-red-600 dark:text-red-400">{formatCurrency(selectedCustomer.balance)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-muted-foreground">Overdue:</span>
                  <span className="font-medium text-orange-600 dark:text-orange-400">{formatCurrency(selectedCustomer.overdue_amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-muted-foreground">Days Overdue:</span>
                  <span className="font-medium text-gray-900 dark:text-foreground">{selectedCustomer.days_overdue}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={handleShareViaWhatsApp}
                  className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  Share via WhatsApp
                </Button>
                <Button
                  onClick={handleShareViaSMS}
                  variant="outline"
                  className="w-full gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  Share via SMS
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
