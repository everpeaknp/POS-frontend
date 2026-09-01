"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Edit2, Trash2, Building2, Wallet, CreditCard, Banknote, TrendingUp, Search, X, LayoutGrid, List } from "lucide-react";
import { DashHeader } from "@/components/dashboard/dash-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/context/AuthContext";
import { formatCurrency } from "@/lib/utils";
import { 
  financeAccountAPI, 
  type FinanceAccount 
} from "@/lib/api/personal-finance";
import toast from "react-hot-toast";

type AccountType = "bank" | "cash" | "credit_card" | "loan" | "investment";
type Account = FinanceAccount;

interface AccountFormData {
  name: string;
  type: string;
  balance: string;
  description: string;
  bankName: string;
  accountNumber: string;
}

// Nepali banks list
const NEPALI_BANKS = [
  "Nabil Bank",
  "Nepal Investment Mega Bank",
  "NIC Asia Bank",
  "Global IME Bank",
  "Himalayan Bank",
  "Standard Chartered Nepal",
  "Everest Bank",
  "Prime Commercial Bank",
  "Sanima Bank",
  "Kumari Bank",
  "Machhapuchchhre Bank",
  "Siddhartha Bank",
  "Nepal Bank Limited",
  "Rastriya Banijya Bank",
  "Agricultural Development Bank",
  "Citizens Bank International",
  "NMB Bank",
  "Prabhu Bank",
  "Laxmi Sunrise Bank",
];

const ACCOUNT_TYPE_OPTIONS = [
  { value: "bank", label: "Bank Account", icon: Building2 },
  { value: "cash", label: "Cash", icon: Wallet },
  { value: "credit_card", label: "Credit Card", icon: CreditCard },
  { value: "loan", label: "Loan", icon: Banknote },
  { value: "investment", label: "Investment", icon: TrendingUp },
] as const;

export default function AccountPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Load accounts from API
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        setLoading(true);
        const data = await financeAccountAPI.list();
        setAccounts(data);
      } catch (error) {
        console.error("Error loading accounts:", error);
        toast.error("Failed to load accounts");
      } finally {
        setLoading(false);
      }
    };
    loadAccounts();
  }, []);
  
  const [showDialog, setShowDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  // Form state
  const [formData, setFormData] = useState<AccountFormData>({
    name: "",
    type: "bank",
    balance: "0",
    description: "",
    bankName: "",
    accountNumber: "",
  });

  const workspaceName = user?.tenant?.workspace_name || user?.tenant?.name || "Workspace";
  const subtitle = `${workspaceName} · Bank accounts, credit cards, and wallets`;

  // Calculate totals
  const summary = useMemo(() => {
    const assets = accounts
      .filter((a) => parseFloat(a.current_balance) >= 0)
      .reduce((sum, a) => sum + parseFloat(a.current_balance), 0);
    const liabilities = accounts
      .filter((a) => parseFloat(a.current_balance) < 0)
      .reduce((sum, a) => sum + Math.abs(parseFloat(a.current_balance)), 0);
    return { assets, liabilities, netWorth: assets - liabilities };
  }, [accounts]);

  // Search + type filter
  const filteredAccounts = useMemo(() => {
    let filtered = accounts;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(lower) ||
          (a.bank_name || "").toLowerCase().includes(lower) ||
          (a.description || "").toLowerCase().includes(lower)
      );
    }
    if (filterType !== "all") {
      filtered = filtered.filter((a) => a.type === filterType);
    }
    return filtered;
  }, [accounts, searchTerm, filterType]);

  const hasActiveFilters = Boolean(searchTerm || filterType !== "all");
  const clearFilters = () => {
    setSearchTerm("");
    setFilterType("all");
  };

  // Group accounts by type
  const groupedAccounts = useMemo(() => {
    const groups: Record<string, Account[]> = {
      bank: [],
      cash: [],
      credit_card: [],
      loan: [],
      investment: [],
    };
    filteredAccounts.forEach((acc) => {
      groups[acc.type].push(acc);
    });
    return groups;
  }, [filteredAccounts]);

  const openAddDialog = () => {
    setEditingAccount(null);
    setFormData({
      name: "",
      type: "bank",
      balance: "0",
      description: "",
      bankName: "",
      accountNumber: "",
    });
    setShowDialog(true);
  };

  // Sidebar "+" deep-links with ?new=1 to open this dialog directly
  useEffect(() => {
    if (searchParams.get("new") !== "1") return;
    openAddDialog();
    router.replace("/dashboard/finance/account", { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, router]);

  const openEditDialog = (account: Account) => {
    if ((account as any).isSystem) {
      toast.error("System accounts cannot be edited");
      return;
    }
    setEditingAccount(account);
    setFormData({
      name: account.name,
      type: account.type as AccountType,
      balance: account.current_balance,
      description: account.description || "",
      bankName: account.bank_name || "",
      accountNumber: account.account_number || "",
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    // Validation
    if (!formData.name?.trim()) {
      toast.error("Please enter an account name");
      return;
    }

    // Validate bank-specific fields
    if (formData.type === "bank" && !formData.bankName) {
      toast.error("Please select a bank name");
      return;
    }

    try {
      const payload = {
        name: formData.name,
        type: formData.type as AccountType,
        opening_balance: formData.balance || "0",
        description: formData.description || "",
        bank_name: formData.bankName || "",
        account_number: formData.accountNumber || "",
      };
      
      console.log('Account payload being sent:', payload);
      
      if (editingAccount) {
        // Update existing account
        const updated = await financeAccountAPI.update(editingAccount.id, payload);
        console.log('Account updated response:', updated);
        setAccounts((prev) =>
          prev.map((a) => (a.id === editingAccount.id ? updated : a))
        );
        toast.success("Account updated successfully");
      } else {
        // Add new account
        const newAccount = await financeAccountAPI.create(payload);
        console.log('Account created response:', newAccount);
        setAccounts((prev) => [...prev, newAccount]);
        toast.success("Account added successfully");
      }

      setShowDialog(false);
    } catch (error) {
      console.error("Error saving account:", error);
      toast.error("Failed to save account");
    }
  };

  const handleDelete = async (id: number) => {
    const account = accounts.find((a) => a.id === id);
    if ((account as any)?.isSystem) {
      toast.error("System accounts cannot be deleted");
      setDeleteConfirmId(null);
      return;
    }

    try {
      await financeAccountAPI.delete(id);
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      setDeleteConfirmId(null);
      toast.success("Account deleted successfully");
    } catch (error: any) {
      console.error("Error deleting account:", error);
      // Check if the error is because account has transactions
      if (error.response?.data?.detail?.includes("transactions")) {
        toast.error("Cannot delete an account that has transactions");
      } else {
        toast.error("Failed to delete account");
      }
      setDeleteConfirmId(null);
    }
  };

  const getAccountIcon = (type: AccountType) => {
    const option = ACCOUNT_TYPE_OPTIONS.find((o) => o.value === type);
    return option?.icon || Building2;
  };

  const getAccountTypeLabel = (type: AccountType) => {
    const option = ACCOUNT_TYPE_OPTIONS.find((o) => o.value === type);
    return option?.label || type;
  };

  const renderAccountCard = (account: Account) => {
    const Icon = getAccountIcon(account.type);
    const balanceNum = parseFloat(account.current_balance);
    const isLiability = balanceNum < 0;
    const displayBalance = Math.abs(balanceNum);
    const last4Digits = account.account_number ? account.account_number.slice(-4) : null;

    return (
      <div
        key={account.id}
        className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-50 text-gray-600">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-gray-900">{account.name}</h3>
                {(account as any).isSystem && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-xs">
                    System
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{getAccountTypeLabel(account.type)}</p>
              {account.type === "bank" && account.bank_name && (
                <p className="text-xs text-gray-600 mt-0.5 font-medium">{account.bank_name}</p>
              )}
              {account.type === "bank" && last4Digits && (
                <p className="text-xs text-gray-400 mt-0.5">•••• {last4Digits}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEditDialog(account)}
              disabled={(account as any).isSystem}
              className="h-8 w-8 p-0"
              title={(account as any).isSystem ? "System accounts cannot be edited" : "Edit account"}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteConfirmId(account.id)}
              disabled={(account as any).isSystem}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              title={(account as any).isSystem ? "System accounts cannot be deleted" : "Delete account"}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-3">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-gray-500">Balance</span>
            <div className="text-right">
              <p className={`text-xl font-bold ${isLiability ? "text-red-600" : "text-[#22C55E]"}`}>
                {isLiability && "-"}
                {formatCurrency(displayBalance)}
              </p>
              {isLiability && (
                <p className="text-xs text-gray-500 mt-0.5">Outstanding</p>
              )}
            </div>
          </div>
          {account.description && (
            <p className="text-xs text-gray-600 mt-2">{account.description}</p>
          )}
        </div>
      </div>
    );
  };

  const renderAccountsTable = () => {
    if (filteredAccounts.length === 0) {
      return (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          {hasActiveFilters ? (
            <>
              <p className="text-gray-500 mb-4">No accounts match your filters</p>
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            </>
          ) : (
            <>
              <p className="text-gray-500 mb-4">No accounts yet</p>
              <Button onClick={openAddDialog} className="bg-[#22C55E] hover:bg-[#22C55E]/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Account
              </Button>
            </>
          )}
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Account Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bank / Details
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Account Number
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Balance
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredAccounts.map((account) => {
              const Icon = getAccountIcon(account.type);
              const balanceNum = parseFloat(account.current_balance);
              const isLiability = balanceNum < 0;
              const displayBalance = Math.abs(balanceNum);
              const last4Digits = account.account_number ? account.account_number.slice(-4) : null;

              return (
                <tr key={account.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gray-50 text-gray-600">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{account.name}</span>
                          {(account as any).isSystem && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-xs">
                              System
                            </Badge>
                          )}
                        </div>
                        {account.description && (
                          <p className="text-xs text-gray-500 mt-0.5">{account.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {getAccountTypeLabel(account.type)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {account.type === "bank" && account.bank_name ? account.bank_name : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {last4Digits ? `•••• ${last4Digits}` : "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-sm font-medium ${isLiability ? "text-red-600" : "text-[#22C55E]"}`}>
                      {isLiability && "-"}
                      {formatCurrency(displayBalance)}
                    </span>
                    {isLiability && (
                      <p className="text-xs text-gray-500 mt-0.5">Outstanding</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(account)}
                        disabled={(account as any).isSystem}
                        className="h-8 w-8 p-0"
                        title={(account as any).isSystem ? "System accounts cannot be edited" : "Edit account"}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirmId(account.id)}
                        disabled={(account as any).isSystem}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        title={(account as any).isSystem ? "System accounts cannot be deleted" : "Delete account"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Accounts" subtitle={subtitle} />

      <div className="flex-1 p-6 space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Assets</p>
                <p className="text-2xl font-bold text-[#22C55E]">{formatCurrency(summary.assets)}</p>
              </div>
              <Building2 className="h-8 w-8 text-[#22C55E]" />
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Liabilities</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.liabilities)}</p>
              </div>
              <CreditCard className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Net Worth</p>
                <p className={`text-2xl font-bold ${summary.netWorth >= 0 ? "text-[#22C55E]" : "text-red-600"}`}>
                  {formatCurrency(summary.netWorth)}
                </p>
              </div>
              <Wallet className="h-8 w-8 text-gray-700" />
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none flex-1 min-w-0">
              <div className="relative shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search accounts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-8 h-9 w-52 text-sm border-gray-200 bg-white focus-visible:ring-0 focus-visible:border-input"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    aria-label="Clear search"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <Select value={filterType} onValueChange={(v) => setFilterType(v ?? "all")}>
                <SelectTrigger className="h-9 w-40 shrink-0 text-sm border-gray-200 bg-white">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {ACCOUNT_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={clearFilters}
                  aria-label="Clear filters"
                  title="Clear filters"
                  className="h-9 w-9 shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
                className={`h-9 w-9 ${viewMode === "list" ? "bg-[#22C55E] hover:bg-[#22C55E]/90" : ""}`}
                title="List view"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
                className={`h-9 w-9 ${viewMode === "grid" ? "bg-[#22C55E] hover:bg-[#22C55E]/90" : ""}`}
                title="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>

            <Button onClick={openAddDialog} className="h-9 shrink-0 bg-[#22C55E] hover:bg-[#22C55E]/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </Button>
          </div>
        </div>

        {/* Accounts List */}
        {viewMode === "list" ? (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {renderAccountsTable()}
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            {hasActiveFilters ? (
              <>
                <p className="text-gray-500 mb-4">No accounts match your filters</p>
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              </>
            ) : (
              <>
                <p className="text-gray-500 mb-4">No accounts yet</p>
                <Button onClick={openAddDialog} className="bg-[#22C55E] hover:bg-[#22C55E]/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Account
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Bank Accounts */}
            {groupedAccounts.bank.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Bank Accounts ({groupedAccounts.bank.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedAccounts.bank.map(renderAccountCard)}
                </div>
              </div>
            )}

            {/* Cash */}
            {groupedAccounts.cash.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Cash ({groupedAccounts.cash.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedAccounts.cash.map(renderAccountCard)}
                </div>
              </div>
            )}

            {/* Investments */}
            {groupedAccounts.investment.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Investments ({groupedAccounts.investment.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedAccounts.investment.map(renderAccountCard)}
                </div>
              </div>
            )}

            {/* Credit Cards */}
            {groupedAccounts.credit_card.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Credit Cards ({groupedAccounts.credit_card.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedAccounts.credit_card.map(renderAccountCard)}
                </div>
              </div>
            )}

            {/* Loans */}
            {groupedAccounts.loan.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Banknote className="h-4 w-4" />
                  Loans ({groupedAccounts.loan.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedAccounts.loan.map(renderAccountCard)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Accounts represent where your money is stored (assets like bank accounts and cash) 
            or money you owe (liabilities like credit cards and loans). System accounts are pre-defined and cannot 
            be deleted. Balances update automatically when you record transactions.
          </p>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingAccount ? "Edit Account" : "Add Account"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>
                Account Type <span className="text-red-500">*</span>
              </Label>
              <div className="mt-2 grid grid-cols-5 gap-2">
                {ACCOUNT_TYPE_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const active = formData.type === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      disabled={!!editingAccount}
                      onClick={() => setFormData({ ...formData, type: option.value })}
                      className={`flex flex-col items-center justify-center gap-1.5 h-20 rounded-lg border text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        active
                          ? "border-[#22C55E] bg-green-50 text-[#16A34A]"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-center leading-tight px-1">{option.label}</span>
                    </button>
                  );
                })}
              </div>
              {editingAccount && (
                <p className="text-xs text-gray-500 mt-2">Account type cannot be changed after creation</p>
              )}
            </div>

            {/* Bank Name - only show for bank accounts */}
            {formData.type === "bank" && (
              <div>
                <Label>
                  Bank Name <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.bankName}
                  onValueChange={(value) => setFormData({ ...formData, bankName: value ?? "" })}
                >
                  <SelectTrigger className="mt-1 focus-visible:ring-0 focus-visible:border-input">
                    <SelectValue placeholder="Select bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {NEPALI_BANKS.map((bank) => (
                      <SelectItem key={bank} value={bank}>
                        {bank}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>
                Account Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., My Checking Account, Main Credit Card"
                className="mt-1 focus-visible:ring-0 focus-visible:border-input"
              />
            </div>

            {/* Account Number - only show for bank accounts */}
            {formData.type === "bank" && (
              <div>
                <Label>Account Number</Label>
                <Input
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  placeholder="e.g., 01234567890123"
                  className="mt-1 focus-visible:ring-0 focus-visible:border-input"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional. Only last 4 digits will be displayed in the list.
                </p>
              </div>
            )}

            <div>
              <Label>
                Current Balance <span className="text-red-500">*</span>
              </Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                  Rs.
                </span>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.balance || "0"}
                  onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                  placeholder="0.00"
                  className="pl-9 focus-visible:ring-0 focus-visible:border-input"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                For liabilities (credit cards, loans), enter as negative number (e.g., -25000)
              </p>
            </div>

            <div>
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
                className="mt-1 focus-visible:ring-0 focus-visible:border-input"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-[#22C55E] hover:bg-[#22C55E]/90">
              {editingAccount ? "Update" : "Add"} Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Account</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-gray-600 py-4">
              Are you sure you want to delete this account? This action cannot be undone. 
              Existing transactions using this account will remain unchanged.
            </p>
            <div className="flex justify-end gap-2 border-t pt-4">
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => handleDelete(deleteConfirmId)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
