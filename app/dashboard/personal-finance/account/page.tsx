"use client";

import { useState, useMemo } from "react";
import { Plus, Edit2, Trash2, Building2, Wallet, CreditCard, Banknote, TrendingUp } from "lucide-react";
import { DashHeader } from "@/components/dashboard/dash-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/context/AuthContext";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";

// MOCK DATA STRUCTURE
// TODO: Replace with real backend API calls when endpoints are ready
// Backend needs: GET /api/personal-finance/accounts, POST /accounts, PUT /accounts/:id, DELETE /accounts/:id

type AccountType = "bank" | "cash" | "credit_card" | "loan" | "investment";

interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  description?: string;
  bankName?: string; // For bank accounts only
  accountNumber?: string; // For bank accounts only
  isSystem?: boolean; // System accounts can't be deleted
  createdAt: string;
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

// Initial mock accounts - matches product spec, Personal CoA, and Transactions page
const INITIAL_MOCK_ACCOUNTS: Account[] = [
  // Asset accounts
  { id: "acc_1", name: "Checking Account", type: "bank", balance: 125000, description: "Primary checking/current account", isSystem: true, createdAt: "2026-01-01T00:00:00Z" },
  { id: "acc_2", name: "Savings Account", type: "bank", balance: 350000, description: "Savings and deposit accounts", isSystem: true, createdAt: "2026-01-01T00:00:00Z" },
  { id: "acc_3", name: "Cash Wallet", type: "cash", balance: 15000, description: "Cash on hand and wallet", isSystem: true, createdAt: "2026-01-01T00:00:00Z" },
  { id: "acc_5", name: "Investment Account", type: "investment", balance: 500000, description: "Brokerage and investment accounts", isSystem: false, createdAt: "2026-01-01T00:00:00Z" },
  
  // Liability accounts (negative balances represent debt)
  { id: "acc_4", name: "Credit Card", type: "credit_card", balance: -25000, description: "Credit card balances", isSystem: true, createdAt: "2026-01-01T00:00:00Z" },
  { id: "acc_6", name: "Personal Loan", type: "loan", balance: -180000, description: "Personal loans and borrowings", isSystem: false, createdAt: "2026-01-01T00:00:00Z" },
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
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_MOCK_ACCOUNTS);
  const [showDialog, setShowDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<Omit<Account, "id" | "createdAt">>({
    name: "",
    type: "bank",
    balance: 0,
    description: "",
    bankName: "",
    accountNumber: "",
    isSystem: false,
  });

  const workspaceName = user?.tenant?.workspace_name || user?.tenant?.name || "Workspace";
  const subtitle = `${workspaceName} · Bank accounts, credit cards, and wallets`;

  // Calculate totals
  const summary = useMemo(() => {
    const assets = accounts
      .filter((a) => a.balance >= 0)
      .reduce((sum, a) => sum + a.balance, 0);
    const liabilities = accounts
      .filter((a) => a.balance < 0)
      .reduce((sum, a) => sum + Math.abs(a.balance), 0);
    return { assets, liabilities, netWorth: assets - liabilities };
  }, [accounts]);

  // Group accounts by type
  const groupedAccounts = useMemo(() => {
    const groups: Record<string, Account[]> = {
      bank: [],
      cash: [],
      credit_card: [],
      loan: [],
      investment: [],
    };
    accounts.forEach((acc) => {
      groups[acc.type].push(acc);
    });
    return groups;
  }, [accounts]);

  const openAddDialog = () => {
    setEditingAccount(null);
    setFormData({
      name: "",
      type: "bank",
      balance: 0,
      description: "",
      bankName: "",
      accountNumber: "",
      isSystem: false,
    });
    setShowDialog(true);
  };

  const openEditDialog = (account: Account) => {
    if (account.isSystem) {
      toast.error("System accounts cannot be edited");
      return;
    }
    setEditingAccount(account);
    setFormData({
      name: account.name,
      type: account.type,
      balance: account.balance,
      description: account.description || "",
      bankName: account.bankName || "",
      accountNumber: account.accountNumber || "",
      isSystem: account.isSystem,
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    // Validation
    if (!formData.name.trim()) {
      toast.error("Please enter an account name");
      return;
    }

    // Validate bank-specific fields
    if (formData.type === "bank" && !formData.bankName) {
      toast.error("Please select a bank name");
      return;
    }

    if (editingAccount) {
      // Update existing account
      setAccounts((prev) =>
        prev.map((a) =>
          a.id === editingAccount.id
            ? { 
                ...a, 
                name: formData.name, 
                type: formData.type,
                balance: formData.balance,
                description: formData.description,
                bankName: formData.bankName,
                accountNumber: formData.accountNumber,
              }
            : a
        )
      );
      toast.success("Account updated successfully");
    } else {
      // Add new account
      const newAccount: Account = {
        id: `acc_${Date.now()}`,
        ...formData,
        createdAt: new Date().toISOString(),
      };
      setAccounts((prev) => [...prev, newAccount]);
      toast.success("Account added successfully");
    }

    setShowDialog(false);
  };

  const handleDelete = (id: string) => {
    const account = accounts.find((a) => a.id === id);
    if (account?.isSystem) {
      toast.error("System accounts cannot be deleted");
      setDeleteConfirmId(null);
      return;
    }

    setAccounts((prev) => prev.filter((a) => a.id !== id));
    setDeleteConfirmId(null);
    toast.success("Account deleted successfully");
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
    const isLiability = account.balance < 0;
    const displayBalance = Math.abs(account.balance);
    const last4Digits = account.accountNumber ? account.accountNumber.slice(-4) : null;

    return (
      <div
        key={account.id}
        className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isLiability ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-gray-900">{account.name}</h3>
                {account.isSystem && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-xs">
                    System
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{getAccountTypeLabel(account.type)}</p>
              {account.type === "bank" && account.bankName && (
                <p className="text-xs text-gray-600 mt-0.5 font-medium">{account.bankName}</p>
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
              disabled={account.isSystem}
              className="h-8 w-8 p-0"
              title={account.isSystem ? "System accounts cannot be edited" : "Edit account"}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteConfirmId(account.id)}
              disabled={account.isSystem}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              title={account.isSystem ? "System accounts cannot be deleted" : "Delete account"}
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
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-700">Your Accounts</h2>
              <p className="text-xs text-gray-500 mt-0.5">{accounts.length} accounts total</p>
            </div>
            <Button onClick={openAddDialog} className="bg-[#22C55E] hover:bg-[#22C55E]/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </Button>
          </div>
        </div>

        {/* Accounts List */}
        {accounts.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No accounts yet</p>
            <Button onClick={openAddDialog} className="bg-[#22C55E] hover:bg-[#22C55E]/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Account
            </Button>
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAccount ? "Edit Account" : "Add Account"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>
                Account Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value: AccountType) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bank Name - only show for bank accounts */}
            {formData.type === "bank" && (
              <div>
                <Label>
                  Bank Name <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.bankName}
                  onValueChange={(value) => setFormData({ ...formData, bankName: value })}
                >
                  <SelectTrigger className="mt-1">
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
                className="mt-1"
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
                  className="mt-1"
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
              <Input
                type="number"
                step="0.01"
                value={formData.balance || ""}
                onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                className="mt-1"
              />
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
                className="mt-1"
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
