"use client";

import { PageLoading } from "@/components/shared/PageLoading";
import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus, Receipt, FileText, AlertTriangle, CheckCircle2, Search } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AccountingPageShell,
  accountingStatCardClass,
  accountingTableWrapClass,
} from "@/components/dashboard/AccountingPageShell";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { taxRulesAPI, vatReturnsAPI } from "@/lib/api/accounting";
import { FormattedDate } from "@/components/shared/FormattedDate";

const fmt = (n: number) =>
  `Rs. ${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const TABS = ["Tax Rules", "VAT Returns"] as const;

type ConfirmAction =
  | { kind: "deactivate-tax"; id: string }
  | { kind: "file-vat"; id: string }
  | { kind: "mark-paid"; id: string };

const VAT_STATUS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  filed: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700" };

interface TaxRuleRow {
  id: string;
  name: string;
  type: string;
  rate: number;
  applicable_on: string;
  account: string;
  account_name?: string;
  account_code?: string;
  status: string;
}

interface VATReturnRow {
  id: string;
  return_number: string;
  period: string;
  from_date: string;
  to_date: string;
  output_tax: number;
  input_tax: number;
  net_payable: number;
  status: string;
  filed_date?: string;
  paid_date?: string;
}

function TaxManagementContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "vat-returns" ? "VAT Returns" : "Tax Rules";
  const [tab, setTab] = useState<(typeof TABS)[number]>(initialTab);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [taxRules, setTaxRules] = useState<TaxRuleRow[]>([]);
  const [vatReturns, setVatReturns] = useState<VATReturnRow[]>([]);
  const [loadingRules, setLoadingRules] = useState(true);
  const [loadingReturns, setLoadingReturns] = useState(true);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [confirming, setConfirming] = useState(false);

  const fetchTaxRules = useCallback(async () => {
    try {
      setLoadingRules(true);
      const data = await taxRulesAPI.list();
      setTaxRules(
        (Array.isArray(data) ? data : []).map((tax) => ({
          ...tax,
          id: String(tax.id),
          rate: Number(tax.rate) || 0 }))
      );
    } catch (error: unknown) {
      console.error("Failed to load tax rules:", error);
      toast.error("Failed to load tax rules");
    } finally {
      setLoadingRules(false);
    }
  }, []);

  const fetchVATReturns = useCallback(async () => {
    try {
      setLoadingReturns(true);
      const data = await vatReturnsAPI.list();
      setVatReturns(
        (Array.isArray(data) ? data : []).map((vat) => ({
          ...vat,
          id: String(vat.id),
          output_tax: Number(vat.output_tax) || 0,
          input_tax: Number(vat.input_tax) || 0,
          net_payable: Number(vat.net_payable) || 0 }))
      );
    } catch (error: unknown) {
      console.error("Failed to load VAT returns:", error);
      toast.error("Failed to load VAT returns");
    } finally {
      setLoadingReturns(false);
    }
  }, []);

  useEffect(() => {
    fetchTaxRules();
    fetchVATReturns();
  }, [fetchTaxRules, fetchVATReturns]);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    setSearchTerm("");
    setStatusFilter("all");
  }, [tab]);

  const handleDeactivateTaxRule = (id: string) => {
    setConfirmAction({ kind: "deactivate-tax", id });
  };

  const handleFileVATReturn = (id: string) => {
    setConfirmAction({ kind: "file-vat", id });
  };

  const handleMarkPaid = (id: string) => {
    setConfirmAction({ kind: "mark-paid", id });
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;

    setConfirming(true);
    try {
      if (confirmAction.kind === "deactivate-tax") {
        await taxRulesAPI.patch(confirmAction.id, { status: "inactive" });
        toast.success("Tax rule deactivated successfully");
        fetchTaxRules();
      } else if (confirmAction.kind === "file-vat") {
        await vatReturnsAPI.file(confirmAction.id);
        toast.success("VAT return filed successfully");
        fetchVATReturns();
      } else {
        await vatReturnsAPI.markPaid(confirmAction.id);
        toast.success("VAT return marked as paid successfully");
        fetchVATReturns();
      }
      setConfirmAction(null);
    } catch (error: unknown) {
      console.error("Confirmation action failed:", error);
      if (confirmAction.kind === "deactivate-tax") {
        toast.error("Failed to deactivate tax rule");
      } else if (confirmAction.kind === "file-vat") {
        toast.error("Failed to file VAT return");
      } else {
        toast.error("Failed to mark VAT return as paid");
      }
    } finally {
      setConfirming(false);
    }
  };

  const confirmDialogProps =
    confirmAction?.kind === "deactivate-tax"
      ? {
          title: "Deactivate this tax rule?",
          description: "It will no longer be available for use.",
          confirmLabel: "Deactivate",
          icon: <AlertTriangle className="h-5 w-5" />,
          iconWrapperClassName: "bg-orange-100 text-orange-600",
          confirmClassName: "bg-orange-600 hover:bg-orange-700 text-white",
        }
      : confirmAction?.kind === "file-vat"
        ? {
            title: "File this VAT return?",
            description: "This marks it as submitted to IRD.",
            confirmLabel: "File Return",
            icon: <FileText className="h-5 w-5" />,
            iconWrapperClassName: "bg-[#22C55E]/15 text-[#22C55E]",
            confirmClassName: "bg-[#22C55E] hover:bg-[#16A34A] text-white",
          }
        : confirmAction?.kind === "mark-paid"
          ? {
              title: "Mark this return as paid?",
              description: "This confirms the payment has been completed.",
              confirmLabel: "Mark as Paid",
              icon: <CheckCircle2 className="h-5 w-5" />,
              iconWrapperClassName: "bg-[#22C55E]/15 text-[#22C55E]",
              confirmClassName: "bg-[#22C55E] hover:bg-[#16A34A] text-white",
            }
          : null;

  const filteredTaxRules = taxRules.filter((tax) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      tax.name?.toLowerCase().includes(q) ||
      tax.type?.toLowerCase().includes(q) ||
      tax.account_name?.toLowerCase().includes(q) ||
      tax.account_code?.toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (statusFilter === "active") return tax.status === "active";
    if (statusFilter === "inactive") return tax.status === "inactive";
    return true;
  });

  const filteredVatReturns = vatReturns.filter((vat) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      vat.return_number?.toLowerCase().includes(q) ||
      vat.period?.toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (statusFilter !== "all") return vat.status === statusFilter;
    return true;
  });

  return (
    <AccountingPageShell
      title="Tax Management"
      subtitle="Tax rules and VAT returns"
    >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className={accountingStatCardClass}>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Tax Rules</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{loadingRules ? "—" : taxRules.length}</p>
            <p className="text-xs text-gray-400 mt-1">{taxRules.filter((t) => t.status === "active").length} active</p>
          </div>
          <div className={accountingStatCardClass}>
            <p className="text-xs text-gray-500 uppercase tracking-wide">VAT Returns</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{loadingReturns ? "—" : vatReturns.length}</p>
            <p className="text-xs text-gray-400 mt-1">{vatReturns.filter((v) => v.status === "draft").length} drafts</p>
          </div>
        </div>

        <div className="flex gap-3 items-center justify-between">
          <div className="flex gap-3 items-center flex-1 min-w-0">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={
                  tab === "Tax Rules"
                    ? "Search tax rules..."
                    : "Search by return number or period..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-sm border-gray-200"
              />
            </div>
            <Select
              value={tab}
              onValueChange={(v) => setTab((v as (typeof TABS)[number]) || "Tax Rules")}
            >
              <SelectTrigger className="w-[150px] h-9 border-gray-200 shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TABS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v || "all")}>
              <SelectTrigger className="w-[140px] h-9 border-gray-200 shrink-0">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                {tab === "Tax Rules" ? (
                  <>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="filed">Filed</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
          {tab === "Tax Rules" ? (
            <Link href="/dashboard/accounting/tax-management/new" className="shrink-0">
              <Button size="sm" className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5">
                <Plus className="h-4 w-4" /> Add Tax Rule
              </Button>
            </Link>
          ) : (
            <Link href="/dashboard/accounting/tax-management/returns/new" className="shrink-0">
              <Button size="sm" className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5">
                <Plus className="h-4 w-4" /> New VAT Return
              </Button>
            </Link>
          )}
        </div>

        {tab === "Tax Rules" && (
          <div className="space-y-3">
            {!loadingRules && taxRules.length === 0 ? (
              <EmptyState
                  icon={Receipt}
                  title="No tax rules yet"
                  description="Create your first tax rule to apply VAT and other taxes to transactions"
                  actionLabel="Add Tax Rule"
                  actionHref="/dashboard/accounting/tax-management/new"
                />
            ) : (
              <div className={accountingTableWrapClass}>
                  {loadingRules ? (
                    <PageLoading message="Loading…" />
                  ) : filteredTaxRules.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                      No tax rules found matching your filters
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          {["Tax Name", "Type", "Rate", "Applicable On", "Account", "Status", "Actions"].map((h) => (
                            <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredTaxRules.map((tax) => (
                          <tr key={tax.id} className="hover:bg-gray-50/50">
                            <td className="px-4 py-3 font-medium text-gray-800">{tax.name}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  tax.type === "VAT" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
                                }`}
                              >
                                {tax.type}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-gray-800">{tax.rate}%</td>
                            <td className="px-4 py-3 text-gray-600">{tax.applicable_on}</td>
                            <td className="px-4 py-3 text-gray-600">
                              {tax.account_code ? `${tax.account_code} — ${tax.account_name}` : tax.account_name || "—"}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  tax.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                                }`}
                              >
                                {tax.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2 text-xs">
                                <Link
                                  href={`/dashboard/accounting/tax-management/${tax.id}/edit`}
                                  className="text-[#22C55E] hover:underline"
                                >
                                  Edit
                                </Link>
                                {tax.status === "active" && (
                                  <>
                                    <span className="text-gray-300">|</span>
                                    <button
                                      onClick={() => handleDeactivateTaxRule(tax.id)}
                                      className="text-gray-500 hover:text-gray-700"
                                    >
                                      Deactivate
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
              </div>
            )}
          </div>
        )}

        {tab === "VAT Returns" && (
          <div className="space-y-3">
            {!loadingReturns && vatReturns.length === 0 ? (
              <EmptyState
                  icon={FileText}
                  title="No VAT returns yet"
                  description="Create your first VAT return to file with the IRD"
                  actionLabel="New VAT Return"
                  actionHref="/dashboard/accounting/tax-management/returns/new"
                />
            ) : (
              <div className={accountingTableWrapClass}>
                  {loadingReturns ? (
                    <PageLoading message="Loading…" />
                  ) : filteredVatReturns.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                      No VAT returns found matching your filters
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          {["Return #", "Period", "From", "To", "Output Tax", "Input Tax", "Net Payable", "Status", "Actions"].map(
                            (h) => (
                              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                                {h}
                              </th>
                            )
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredVatReturns.map((vat) => (
                          <tr key={vat.id} className="hover:bg-gray-50/50">
                            <td className="px-4 py-3 font-mono text-xs text-gray-500">{vat.return_number}</td>
                            <td className="px-4 py-3 font-medium text-gray-800">{vat.period}</td>
                            <td className="px-4 py-3 text-gray-600"><FormattedDate value={vat.from_date} /></td>
                            <td className="px-4 py-3 text-gray-600"><FormattedDate value={vat.to_date} /></td>
                            <td className="px-4 py-3 text-gray-800">{fmt(vat.output_tax)}</td>
                            <td className="px-4 py-3 text-gray-600">{fmt(vat.input_tax)}</td>
                            <td className="px-4 py-3 font-semibold text-gray-800">{fmt(vat.net_payable)}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  VAT_STATUS[vat.status] ?? "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {vat.status.charAt(0).toUpperCase() + vat.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2 text-xs">
                                <Link
                                  href={`/dashboard/accounting/tax-management/returns/${vat.id}`}
                                  className="text-[#22C55E] hover:underline"
                                >
                                  View
                                </Link>
                                {vat.status === "draft" && (
                                  <>
                                    <span className="text-gray-300">|</span>
                                    <button
                                      onClick={() => handleFileVATReturn(vat.id)}
                                      className="text-blue-500 hover:text-blue-700"
                                    >
                                      File
                                    </button>
                                  </>
                                )}
                                {vat.status === "filed" && (
                                  <>
                                    <span className="text-gray-300">|</span>
                                    <button
                                      onClick={() => handleMarkPaid(vat.id)}
                                      className="text-[#22C55E] hover:text-[#16A34A]"
                                    >
                                      Mark Paid
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
              </div>
            )}
          </div>
        )}
      {confirmDialogProps && (
        <ConfirmDialog
          open
          title={confirmDialogProps.title}
          description={confirmDialogProps.description}
          confirmLabel={confirmDialogProps.confirmLabel}
          icon={confirmDialogProps.icon}
          iconWrapperClassName={confirmDialogProps.iconWrapperClassName}
          confirmClassName={confirmDialogProps.confirmClassName}
          confirming={confirming}
          onCancel={() => setConfirmAction(null)}
          onConfirm={handleConfirmAction}
        />
      )}
    </AccountingPageShell>
  );
}

export default function TaxManagementPage() {
  return (
    <Suspense
      fallback={
        <AccountingPageShell
          title="Tax Management"
          subtitle="Tax rules and VAT returns"
          loading
          loadingMessage="Loading…"
        />
      }
    >
      <TaxManagementContent />
    </Suspense>
  );
}
