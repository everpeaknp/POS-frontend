"use client";

import { PageLoading } from "@/components/shared/PageLoading";
import { useState, useEffect, useMemo } from "react";
import { Download, FileText } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { DashHeader } from "@/components/dashboard/dash-header";
import { DateInput } from "@/components/shared/DateInput";
import { FormattedDate } from "@/components/shared/FormattedDate";
import { useDateSystem } from "@/lib/context/DateSystemContext";
import { useAuth } from "@/lib/context/AuthContext";
import { customerAPI, type Customer, type CustomerLedger } from "@/lib/api/sales";
import {
  exportTableAsCsv,
  exportTableAsPdf,
  tenantToExportOrg,
  type ExportTableData,
} from "@/lib/utils/export";

const fmt = (n: number) => `Rs. ${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function normalizeLedgerEntries(data: CustomerLedger[]): CustomerLedger[] {
  return (Array.isArray(data) ? data : []).map((entry) => ({
    ...entry,
    debit: Number(entry.debit) || 0,
    credit: Number(entry.credit) || 0,
    running_balance: Number(entry.running_balance) || 0,
  }));
}

export default function PartyLedgerPage() {
  const { formatDate } = useDateSystem();
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [ledgerEntries, setLedgerEntries] = useState<CustomerLedger[]>([]);

  const customerOptions = useMemo(
    () =>
      customers.map((c) => ({
        value: String(c.id),
        label: c.name,
        subtitle: c.phone || c.email || "",
      })),
    [customers]
  );

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await customerAPI.list({ status: "active", ordering: "name" });
      setCustomers(Array.isArray(data) ? data : []);
    } catch (error: unknown) {
      console.error("Failed to load customers:", error);
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!customerId) {
      toast.error("Please select a customer");
      return;
    }

    try {
      setGenerating(true);
      const data = await customerAPI.ledger(customerId);
      
      // Filter by date range if specified
      let filtered = normalizeLedgerEntries(data);
      if (fromDate) {
        filtered = filtered.filter(e => e.date >= fromDate);
      }
      if (toDate) {
        filtered = filtered.filter(e => e.date <= toDate);
      }
      
      setLedgerEntries(filtered);
      setGenerated(true);
      toast.success("Ledger generated successfully");
    } catch (error: unknown) {
      console.error("Failed to generate ledger:", error);
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || "Failed to generate ledger");
    } finally {
      setGenerating(false);
    }
  };

  const handleExportCsv = () => {
    if (!ledgerEntries.length) return;

    const selectedCustomer = customers.find((c) => String(c.id) === customerId);
    const title = selectedCustomer ? `Party Ledger - ${selectedCustomer.name}` : "Party Ledger";

    const tableData: ExportTableData = {
      headers: ["Date", "Type", "Reference", "Description", "Debit", "Credit", "Balance"],
      rows: ledgerEntries.map((e) => [
        formatDate(e.date),
        e.transaction_type,
        e.reference_number,
        e.description,
        fmt(Number(e.debit)),
        fmt(Number(e.credit)),
        fmt(Number(e.running_balance)),
      ]),
    };

    exportTableAsCsv(title, tableData, user?.tenant ? tenantToExportOrg(user.tenant) : undefined);
  };

  const handleExportPdf = () => {
    if (!ledgerEntries.length) return;

    const selectedCustomer = customers.find((c) => String(c.id) === customerId);
    const title = selectedCustomer ? `Party Ledger - ${selectedCustomer.name}` : "Party Ledger";

    const tableData: ExportTableData = {
      headers: ["Date", "Type", "Reference", "Description", "Debit", "Credit", "Balance"],
      rows: ledgerEntries.map((e) => [
        formatDate(e.date),
        e.transaction_type,
        e.reference_number,
        e.description,
        fmt(Number(e.debit)),
        fmt(Number(e.credit)),
        fmt(Number(e.running_balance)),
      ]),
    };

    exportTableAsPdf(title, tableData, user?.tenant ? tenantToExportOrg(user.tenant) : undefined);
  };

  if (loading) return <PageLoading />;

  const selectedCustomer = customers.find((c) => String(c.id) === customerId);

  return (
    <>
      <DashHeader 
        title="Party Ledger" 
        subtitle="View customer transaction history and running balances"
      />

      <div className="space-y-6 p-6">
        {/* Filters */}
        <div className="rounded-lg border bg-card p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="customer">Customer</Label>
              <Combobox
                options={customerOptions}
                value={customerId}
                onValueChange={setCustomerId}
                placeholder="Select customer..."
                emptyText="No customers found"
                searchPlaceholder="Search customers..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="from-date">From Date</Label>
              <DateInput
                id="from-date"
                value={fromDate}
                onChange={(val) => setFromDate(val || "")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="to-date">To Date</Label>
              <DateInput
                id="to-date"
                value={toDate}
                onChange={(val) => setToDate(val || "")}
              />
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button onClick={handleGenerate} disabled={generating || !customerId}>
              {generating ? "Generating..." : "Generate Ledger"}
            </Button>
            
            {generated && ledgerEntries.length > 0 && (
              <>
                <Button variant="outline" onClick={handleExportCsv}>
                  <FileText className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
                <Button variant="outline" onClick={handleExportPdf}>
                  <Download className="mr-2 h-4 w-4" />
                  Export PDF
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Ledger Table */}
        {generated && (
          <div className="rounded-lg border bg-card">
            <div className="border-b p-4">
              <h3 className="font-semibold">
                {selectedCustomer?.name || "Customer"} Ledger
              </h3>
              {(fromDate || toDate) && (
                <p className="text-sm text-muted-foreground">
                  Period: {fromDate ? formatDate(fromDate) : "Start"} to {toDate ? formatDate(toDate) : "End"}
                </p>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Reference</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Description</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Debit</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Credit</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerEntries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                        No transactions found for this period
                      </td>
                    </tr>
                  ) : (
                    ledgerEntries.map((entry) => (
                      <tr key={entry.id} className="border-b hover:bg-muted/50">
                        <td className="px-4 py-3 text-sm">
                          <FormattedDate value={entry.date} />
                        </td>
                        <td className="px-4 py-3 text-sm">{entry.transaction_type}</td>
                        <td className="px-4 py-3 text-sm font-mono">{entry.reference_number}</td>
                        <td className="px-4 py-3 text-sm">{entry.description}</td>
                        <td className="px-4 py-3 text-right text-sm tabular-nums">
                          {Number(entry.debit) > 0 ? fmt(Number(entry.debit)) : "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-sm tabular-nums">
                          {Number(entry.credit) > 0 ? fmt(Number(entry.credit)) : "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium tabular-nums">
                          {fmt(Number(entry.running_balance))}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
