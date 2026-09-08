"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import {
  Wallet,
  TrendingUp,
  CreditCard,
  Bell,
  Plus,
  Building2,
  Banknote,
  ChevronRight,
  DollarSign,
  AlertCircle,
  Activity,
  ArrowUpCircle,
  ArrowDownCircle,
  ArrowDownLeft,
  ArrowUpRight,
  FolderTree,
  Receipt,
  Clock,
  TrendingDown,
  Users,
  Upload,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import toast from "react-hot-toast";
import { DashHeader } from "@/components/dashboard/dash-header";
import { SkeletonCard } from "@/components/shared/Skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DateInput } from "@/components/shared/DateInput";
import { TransactionDialog } from "@/components/personal-finance/transactions/TransactionDialog";
import { QuickAddCategoryDialog } from "@/components/personal-finance/transactions/QuickAddCategoryDialog";
import { QuickAddAccountDialog } from "@/components/personal-finance/transactions/QuickAddAccountDialog";
import { PartySelector } from "@/app/dashboard/finance/parties/party-selector";
import { ProfilePhotoUpload } from "@/components/profile-photo-upload";
import { useAuth } from "@/lib/context/AuthContext";
import { useApi } from "@/lib/hooks/useApi";
import {
  personalFinanceDashboardAPI,
  financeTransactionAPI,
  financeCategoryAPI,
  financeAccountAPI,
  financeBudgetAPI,
  partyLenderAPI,
  partyTransactionAPI,
  type FinanceTransaction,
  type FinanceCategory,
  type FinanceAccount,
  type FinanceBudget,
} from "@/lib/api/personal-finance";
import { formatNPR } from "@/lib/utils";

type QuickActionId = "transaction" | "payment-in" | "payment-out" | "party" | "budget" | "account";

const quickActions: { id: QuickActionId; label: string; sub: string; icon: typeof Plus; color: string }[] = [
  {
    id: "transaction",
    label: "Add Transaction",
    sub: "Record income/expense",
    icon: Plus,
    color: "bg-gray-50 text-gray-600",
  },
  {
    id: "payment-in",
    label: "Payment In",
    sub: "Money received from party",
    icon: ArrowDownCircle,
    color: "bg-gray-50 text-gray-600",
  },
  {
    id: "payment-out",
    label: "Payment Out",
    sub: "Money paid to party",
    icon: ArrowUpCircle,
    color: "bg-gray-50 text-gray-600",
  },
  {
    id: "party",
    label: "Add Parties",
    sub: "New party/lender",
    icon: Users,
    color: "bg-gray-50 text-gray-600",
  },
  {
    id: "budget",
    label: "Add Budget",
    sub: "Set spending limit",
    icon: Banknote,
    color: "bg-gray-50 text-gray-600",
  },
  {
    id: "account",
    label: "Add Account",
    sub: "Bank/wallet/cash",
    icon: Building2,
    color: "bg-gray-50 text-gray-600",
  },
];

const moduleLinks = [
  {
    href: "/dashboard/finance/budget",
    label: "Budgeting & Saving",
    sub: "Track budgets & goals",
    icon: Banknote,
    color: "bg-gray-50 text-gray-600",
  },
  {
    href: "/dashboard/finance/account",
    label: "Banking",
    sub: "Accounts & transactions",
    icon: Building2,
    color: "bg-gray-50 text-gray-600",
  },
  {
    href: "/dashboard/finance/account",
    label: "Investing",
    sub: "Portfolio management",
    icon: TrendingUp,
    color: "bg-gray-50 text-gray-600",
  },
  {
    href: "/dashboard/finance/bills",
    label: "Loans & Credit",
    sub: "Debt tracking",
    icon: CreditCard,
    color: "bg-gray-50 text-gray-600",
  },
];

const NEPALI_BANKS = [
  "Nabil Bank", "Nepal Investment Mega Bank", "NIC Asia Bank", "Global IME Bank",
  "Himalayan Bank", "Standard Chartered Nepal", "Everest Bank", "Prime Commercial Bank",
  "Sanima Bank", "Kumari Bank", "Machhapuchchhre Bank", "Siddhartha Bank",
  "Nepal Bank Limited", "Rastriya Banijya Bank", "Agricultural Development Bank",
  "Citizens Bank International", "NMB Bank", "Prabhu Bank", "Laxmi Sunrise Bank",
];

const ACCOUNT_TYPE_OPTIONS = [
  { value: "bank", label: "Bank Account", icon: Building2 },
  { value: "cash", label: "Cash", icon: Wallet },
  { value: "credit_card", label: "Credit Card", icon: CreditCard },
  { value: "loan", label: "Loan", icon: Banknote },
  { value: "investment", label: "Investment", icon: TrendingUp },
] as const;

const AD_MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function PersonalFinanceDashboardPage() {
  const { user } = useAuth();

  const workspaceName =
    user?.tenant?.workspace_name || user?.tenant?.name || "Workspace";
  const subtitle = `${workspaceName} · Personal Finance dashboard and analytics`;

  const { data, loading, error, refetch } = useApi(
    () => personalFinanceDashboardAPI.get(),
    { immediate: true }
  );

  // Supporting data for the quick-action dialogs, loaded in the background
  // (in parallel with the dashboard summary) so a dialog can open instantly
  // on click instead of navigating to its own page first.
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [budgets, setBudgets] = useState<FinanceBudget[]>([]);
  const selectedMonth = useMemo(() => new Date().toISOString().slice(0, 7), []);

  useEffect(() => {
    financeCategoryAPI.list().then(setCategories).catch(() => {});
    financeBudgetAPI.list().then(setBudgets).catch(() => {});
  }, []);

  // ---- Add Transaction dialog ----
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [transactionFormData, setTransactionFormData] = useState<Partial<FinanceTransaction>>({
    date: new Date().toISOString().slice(0, 10),
    type: "expense",
    amount: "0",
    category: undefined,
    account: undefined,
    description: "",
  });
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [categoryComboOpen, setCategoryComboOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [accountComboOpen, setAccountComboOpen] = useState(false);
  const [accountSearch, setAccountSearch] = useState("");
  const [showCategoryQuickAdd, setShowCategoryQuickAdd] = useState(false);
  const [categoryQuickAddData, setCategoryQuickAddData] = useState<Partial<FinanceCategory>>({
    name: "",
    type: "expense",
    description: "",
  });
  const [showAccountQuickAdd, setShowAccountQuickAdd] = useState(false);
  const [accountQuickAddData, setAccountQuickAddData] = useState<Partial<FinanceAccount>>({
    name: "",
    type: "bank",
    opening_balance: "0",
    description: "",
    bank_name: "",
    account_number: "",
  });

  useEffect(() => {
    financeAccountAPI.list().then(setAccounts).catch(() => {});
  }, []);

  const availableCategories = useMemo(() => {
    if (!transactionFormData.type) return categories;
    return categories.filter((c) => c.type === transactionFormData.type);
  }, [transactionFormData.type, categories]);

  const openTransactionDialog = () => {
    setTransactionFormData({
      date: new Date().toISOString().slice(0, 10),
      type: "expense",
      amount: "0",
      category: undefined,
      account: undefined,
      description: "",
    });
    setShowTransactionDialog(true);
  };

  const handleSaveTransaction = async () => {
    if (!transactionFormData.amount || parseFloat(transactionFormData.amount) <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }
    if (!transactionFormData.category) {
      toast.error("Please select a category");
      return;
    }
    if (!transactionFormData.account) {
      toast.error("Please select an account");
      return;
    }
    try {
      await financeTransactionAPI.create({
        date: transactionFormData.date!,
        type: transactionFormData.type as "income" | "expense",
        amount: transactionFormData.amount!,
        category: transactionFormData.category!,
        account: transactionFormData.account!,
        description: transactionFormData.description || "",
      });
      toast.success("Transaction added successfully");
      setShowTransactionDialog(false);
      refetch();
    } catch {
      toast.error("Failed to save transaction");
    }
  };

  const handleQuickAddCategory = async () => {
    if (!categoryQuickAddData.name?.trim()) {
      toast.error("Please enter a category name");
      return;
    }
    try {
      const newCategory = await financeCategoryAPI.create({
        name: categoryQuickAddData.name,
        type: categoryQuickAddData.type as "income" | "expense",
        description: categoryQuickAddData.description || "",
      });
      setCategories((prev) => [...prev, newCategory]);
      setTransactionFormData((prev) => ({ ...prev, category: newCategory.id }));
      setShowCategoryQuickAdd(false);
      toast.success("Category added successfully");
    } catch {
      toast.error("Failed to add category");
    }
  };

  const handleQuickAddAccount = async () => {
    if (!accountQuickAddData.name?.trim()) {
      toast.error("Please enter an account name");
      return;
    }
    try {
      const newAccount = await financeAccountAPI.create({
        name: accountQuickAddData.name,
        type: accountQuickAddData.type as FinanceAccount["type"],
        opening_balance: accountQuickAddData.opening_balance || "0",
        description: accountQuickAddData.description || "",
        bank_name: accountQuickAddData.bank_name || "",
        account_number: accountQuickAddData.account_number || "",
      });
      setAccounts((prev) => [...prev, newAccount]);
      setTransactionFormData((prev) => ({ ...prev, account: newAccount.id }));
      setShowAccountQuickAdd(false);
      toast.success("Account added successfully");
    } catch {
      toast.error("Failed to add account");
    }
  };

  // ---- Payment In / Out dialog (party transactions) ----
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentType, setPaymentType] = useState<"in" | "out">("in");
  const [paymentPartyId, setPaymentPartyId] = useState<number | null>(null);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentFormData, setPaymentFormData] = useState({
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    paymentMethod: "cash",
    note: "",
  });
  const [paymentReceiptFile, setPaymentReceiptFile] = useState<File | null>(null);
  const [paymentReceiptPreview, setPaymentReceiptPreview] = useState<string>("");

  const openPaymentDialog = (type: "in" | "out") => {
    setPaymentType(type);
    setPaymentPartyId(null);
    setPaymentFormData({
      amount: "",
      date: new Date().toISOString().slice(0, 10),
      paymentMethod: "cash",
      note: "",
    });
    setPaymentReceiptFile(null);
    setPaymentReceiptPreview("");
    setShowPaymentDialog(true);
  };

  const handlePaymentReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ["image/jpeg", "image/png", "image/gif", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload an image (JPG, PNG, GIF) or PDF file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }
    setPaymentReceiptFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => setPaymentReceiptPreview(event.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPaymentReceiptPreview("pdf");
    }
  };

  const handleRemovePaymentReceipt = () => {
    setPaymentReceiptFile(null);
    setPaymentReceiptPreview("");
  };

  const handleSavePayment = async () => {
    if (!paymentPartyId) {
      toast.error("Please select a party");
      return;
    }
    if (!paymentFormData.amount || parseFloat(paymentFormData.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    try {
      setPaymentSaving(true);
      const createData = new FormData();
      createData.append("party", String(paymentPartyId));
      createData.append("direction", paymentType);
      createData.append("amount", paymentFormData.amount);
      createData.append("date", paymentFormData.date);
      createData.append("payment_method", paymentFormData.paymentMethod);
      if (paymentFormData.note) createData.append("note", paymentFormData.note);
      if (paymentReceiptFile) createData.append("receipt", paymentReceiptFile);

      await partyTransactionAPI.create(createData);
      toast.success("Transaction recorded successfully");
      setShowPaymentDialog(false);
      refetch();
    } catch {
      toast.error("Failed to record transaction");
    } finally {
      setPaymentSaving(false);
    }
  };

  // ---- Add Party dialog ----
  const [showPartyDialog, setShowPartyDialog] = useState(false);
  const [partySaving, setPartySaving] = useState(false);
  const [partyFormData, setPartyFormData] = useState({ name: "", mobile: "", pan: "", email: "" });
  const [partyPhotoFile, setPartyPhotoFile] = useState<File | null>(null);

  const openPartyDialog = () => {
    setPartyFormData({ name: "", mobile: "", pan: "", email: "" });
    setPartyPhotoFile(null);
    setShowPartyDialog(true);
  };

  const handleSaveParty = async () => {
    if (!partyFormData.name.trim()) {
      toast.error("Party name is required");
      return;
    }
    try {
      setPartySaving(true);
      const createData = new FormData();
      createData.append("name", partyFormData.name);
      if (partyFormData.mobile) createData.append("mobile", partyFormData.mobile);
      if (partyFormData.pan) createData.append("pan", partyFormData.pan);
      if (partyFormData.email) createData.append("email", partyFormData.email);
      if (partyPhotoFile) createData.append("photo", partyPhotoFile);
      await partyLenderAPI.create(createData);
      toast.success("Party added successfully");
      setShowPartyDialog(false);
    } catch {
      toast.error("Failed to save party");
    } finally {
      setPartySaving(false);
    }
  };

  // ---- Add Budget dialog ----
  const [showBudgetDialog, setShowBudgetDialog] = useState(false);
  const [budgetFormData, setBudgetFormData] = useState<{ category: number | null; amount: string }>({
    category: null,
    amount: "0",
  });

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const incomeCategories = categories.filter((c) => c.type === "income");
  const selectedMonthLabel = (() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    if (!year || !month) return selectedMonth;
    return `${AD_MONTH_NAMES[month - 1]} ${year}`;
  })();

  const openBudgetDialog = () => {
    setBudgetFormData({ category: null, amount: "0" });
    setShowBudgetDialog(true);
  };

  const handleSaveBudget = async () => {
    if (!budgetFormData.category) {
      toast.error("Please select a category");
      return;
    }
    if (!budgetFormData.amount || parseFloat(budgetFormData.amount) <= 0) {
      toast.error("Budget amount must be greater than 0");
      return;
    }
    const existingBudget = budgets.find(
      (b) => b.category === budgetFormData.category && b.start_date.startsWith(selectedMonth)
    );
    if (existingBudget) {
      toast.error("Budget already exists for this category in this month");
      return;
    }
    try {
      const category = categories.find((c) => c.id === budgetFormData.category);
      const newBudget = await financeBudgetAPI.create({
        name: `${category?.name || "Budget"} - ${selectedMonth}`,
        category: budgetFormData.category,
        amount: budgetFormData.amount,
        period: "monthly",
        start_date: `${selectedMonth}-01`,
        end_date: null,
      });
      setBudgets((prev) => [...prev, newBudget]);
      toast.success("Budget added successfully");
      setShowBudgetDialog(false);
    } catch {
      toast.error("Failed to save budget");
    }
  };

  // ---- Add Account dialog ----
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [accountFormData, setAccountFormData] = useState({
    name: "",
    type: "bank" as string,
    balance: "0",
    description: "",
    bankName: "",
    accountNumber: "",
  });

  const openAccountDialog = () => {
    setAccountFormData({
      name: "",
      type: "bank",
      balance: "0",
      description: "",
      bankName: "",
      accountNumber: "",
    });
    setShowAccountDialog(true);
  };

  const handleSaveAccount = async () => {
    if (!accountFormData.name.trim()) {
      toast.error("Please enter an account name");
      return;
    }
    if (accountFormData.type === "bank" && !accountFormData.bankName) {
      toast.error("Please select a bank name");
      return;
    }
    try {
      const newAccount = await financeAccountAPI.create({
        name: accountFormData.name,
        type: accountFormData.type as FinanceAccount["type"],
        opening_balance: accountFormData.balance || "0",
        description: accountFormData.description || "",
        bank_name: accountFormData.bankName || "",
        account_number: accountFormData.accountNumber || "",
      });
      setAccounts((prev) => [...prev, newAccount]);
      toast.success("Account added successfully");
      setShowAccountDialog(false);
    } catch {
      toast.error("Failed to save account");
    }
  };

  const handleQuickAction = (id: QuickActionId) => {
    if (id === "transaction") openTransactionDialog();
    else if (id === "payment-in") openPaymentDialog("in");
    else if (id === "payment-out") openPaymentDialog("out");
    else if (id === "party") openPartyDialog();
    else if (id === "budget") openBudgetDialog();
    else if (id === "account") openAccountDialog();
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Personal Finance" subtitle={subtitle} />
        <div className="flex-1 p-6 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Personal Finance" subtitle={subtitle} />
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">Failed to load personal finance overview</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="px-4 py-2 bg-[var(--color-accent-custom,#22C55E)] text-white rounded-lg hover:bg-[var(--color-accent-custom-600,#16A34A)]"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { summary, netWorthTrend, alerts, activities, topAccounts } = data;

  // Helper function to format relative time
  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInMs = now.getTime() - past.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    } else {
      return past.toLocaleDateString();
    }
  };

  // Helper function to get activity icon
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'transaction':
        return ArrowUpCircle;
      case 'account':
        return Building2;
      case 'budget':
        return Wallet;
      case 'bill':
        return Receipt;
      case 'category':
        return FolderTree;
      default:
        return Activity;
    }
  };

  // Helper function to get activity color
  const getActivityColor = (type: string, action: string) => {
    if (action === 'deleted') return 'text-red-500';
    return 'text-gray-600';
  };

  const statCards = [
    {
      label: "Total Balance",
      value: formatNPR(summary.total_balance),
      sub: "Banking accounts",
      icon: Wallet,
      color: "bg-gray-50 text-gray-600",
    },
    {
      label: "Total Investments",
      value: formatNPR(summary.total_investments),
      sub: "Current value",
      icon: TrendingUp,
      color: "bg-gray-50 text-gray-600",
    },
    {
      label: "Total Debt",
      value: formatNPR(summary.total_debt),
      sub: "Loans & credit due",
      icon: CreditCard,
      color: "bg-gray-50 text-gray-600",
    },
    {
      label: "Upcoming Renewals",
      value: summary.upcoming_renewals.toLocaleString(),
      sub: "Insurance & tax",
      icon: Bell,
      color: "bg-gray-50 text-gray-600",
    },
  ];

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Personal Finance" subtitle={subtitle} />

      <div className="flex-1 p-6 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-500">{s.label}</p>
                <div className={`p-2 rounded-lg ${s.color}`}>
                  <s.icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickActions.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => handleQuickAction(action.id)}
                className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:border-[var(--color-accent-custom,#22C55E)]/30 hover:shadow-md transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-lg ${action.color} group-hover:scale-105 transition-transform`}
                  >
                    <action.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{action.label}</p>
                    <p className="text-xs text-gray-500">{action.sub}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Net Worth Trend Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Net Worth Trend</h3>
            {netWorthTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={netWorthTrend} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-accent-custom,#22C55E)" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="var(--color-accent-custom,#22C55E)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    vertical={true}
                    horizontal={false}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    name="Net Worth"
                    stroke="var(--color-accent-custom,#22C55E)"
                    strokeWidth={2.5}
                    fill="url(#netWorthGradient)"
                    dot={{
                      fill: "var(--color-accent-custom,#22C55E)",
                      stroke: "#fff",
                      strokeWidth: 2,
                      r: 5
                    }}
                    activeDot={{
                      r: 7,
                      stroke: "#fff",
                      strokeWidth: 2,
                      fill: "var(--color-accent-custom,#22C55E)"
                    }}
                    connectNulls={true}
                    isAnimationActive={true}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[260px] flex flex-col items-center justify-center text-gray-400 text-sm">
                <DollarSign className="h-10 w-10 mb-2 text-gray-300" />
                No trend data yet
              </div>
            )}
          </div>

          {/* Module navigation */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Module Navigation</h3>
            <div className="space-y-2">
              {moduleLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-50 hover:bg-gray-50 hover:border-gray-100 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${link.color}`}>
                      <link.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{link.label}</p>
                      <p className="text-xs text-gray-500">{link.sub}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Recent Activities */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-gray-700">Recent Activities</h3>
              <Link
                href="/dashboard/finance/activities"
                className="text-xs text-[var(--color-accent-custom,#22C55E)] hover:text-[var(--color-accent-custom-600,#16A34A)] font-medium inline-flex items-center gap-1"
              >
                View all
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {activities.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                No recent activities
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {activities.slice(0, 5).map((activity, idx) => {
                  const IconComponent = getActivityIcon(activity.type);
                  const iconColor = getActivityColor(activity.type, activity.action);

                  return (
                    <div key={idx} className="px-5 py-3 hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg bg-gray-50 ${iconColor}`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 line-clamp-2">{activity.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center text-xs text-gray-500">
                              <Clock className="h-3 w-3 mr-1" />
                              {getRelativeTime(activity.timestamp)}
                            </span>
                            {activity.amount && (
                              <span className={`text-xs font-medium ${
                                activity.type === 'transaction' && activity.description.toLowerCase().includes('expense')
                                  ? 'text-red-600'
                                  : 'text-[var(--color-accent-custom,#22C55E)]'
                              }`}>
                                {formatNPR(activity.amount)}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                          activity.action === 'created'
                            ? 'bg-green-50 text-green-600'
                            : activity.action === 'updated'
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-red-50 text-red-600'
                        }`}>
                          {activity.action}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Alerts */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-gray-700">Alerts</h3>
            </div>
            {alerts.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                No alerts at this time
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {alerts.map((alert, idx) => (
                  <div key={idx} className="px-5 py-3 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <AlertCircle
                        className="h-5 w-5 mt-0.5 shrink-0 text-gray-600"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                        {alert.amount && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            Amount: {formatNPR(alert.amount)}
                          </p>
                        )}
                        {alert.date && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            Date: {new Date(alert.date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Accounts by Balance */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-gray-700">Top Accounts by Balance</h3>
              <Link
                href="/dashboard/finance/account"
                className="text-xs text-[var(--color-accent-custom,#22C55E)] hover:text-[var(--color-accent-custom-600,#16A34A)] font-medium inline-flex items-center gap-1"
              >
                View all
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {topAccounts.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">
                No accounts yet
              </div>
            ) : (
              <div className="space-y-4">
                {topAccounts.map((account, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-700 truncate pr-2">
                        {account.name}
                      </span>
                      <span className="text-xs text-gray-500 shrink-0">
                        {formatNPR(account.balance)}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--color-accent-custom,#22C55E)] transition-all"
                        style={{
                          width: `${(account.balance / topAccounts[0].balance) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Transaction Dialog */}
      <TransactionDialog
        open={showTransactionDialog}
        onOpenChange={setShowTransactionDialog}
        editingTransaction={null}
        formData={transactionFormData}
        onFormDataChange={(data) => setTransactionFormData({ ...transactionFormData, ...data })}
        availableCategories={availableCategories}
        accounts={accounts}
        onSave={handleSaveTransaction}
        receiptFile={null}
        receiptPreview=""
        onReceiptChange={() => {}}
        onRemoveReceipt={() => {}}
        categoryComboOpen={categoryComboOpen}
        setCategoryComboOpen={setCategoryComboOpen}
        categorySearch={categorySearch}
        setCategorySearch={setCategorySearch}
        accountComboOpen={accountComboOpen}
        setAccountComboOpen={setAccountComboOpen}
        accountSearch={accountSearch}
        setAccountSearch={setAccountSearch}
        onShowCategoryDialog={() => {
          setCategoryQuickAddData({ name: "", type: transactionFormData.type || "expense", description: "" });
          setShowCategoryQuickAdd(true);
        }}
        onShowAccountDialog={() => {
          setAccountQuickAddData({ name: "", type: "bank", opening_balance: "0", description: "", bank_name: "", account_number: "" });
          setShowAccountQuickAdd(true);
        }}
      />
      <QuickAddCategoryDialog
        open={showCategoryQuickAdd}
        onOpenChange={setShowCategoryQuickAdd}
        formData={categoryQuickAddData}
        onFormDataChange={(data) => setCategoryQuickAddData({ ...categoryQuickAddData, ...data })}
        onAdd={handleQuickAddCategory}
      />
      <QuickAddAccountDialog
        open={showAccountQuickAdd}
        onOpenChange={setShowAccountQuickAdd}
        formData={accountQuickAddData}
        onFormDataChange={(data) => setAccountQuickAddData({ ...accountQuickAddData, ...data })}
        onAdd={handleQuickAddAccount}
      />

      {/* Payment In / Out Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {paymentType === "in" ? (
                <ArrowDownLeft className="h-5 w-5 text-emerald-600" />
              ) : (
                <ArrowUpRight className="h-5 w-5 text-red-600" />
              )}
              {paymentType === "in" ? "Payment In" : "Payment Out"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <PartySelector
              value={paymentPartyId}
              onChange={(id) => setPaymentPartyId(id)}
              label="Select Party"
              required
            />

            <div>
              <Label>
                Amount (Rs.) <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={paymentFormData.amount}
                onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: e.target.value })}
                className="mt-1"
                step="0.01"
                min="0"
              />
            </div>

            <div>
              <Label>
                Date <span className="text-red-500">*</span>
              </Label>
              <DateInput
                value={paymentFormData.date}
                onChange={(date) => setPaymentFormData({ ...paymentFormData, date })}
                className="mt-1"
              />
            </div>

            <div>
              <Label>
                Payment Method <span className="text-red-500">*</span>
              </Label>
              <select
                value={paymentFormData.paymentMethod}
                onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentMethod: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-custom,#22C55E)]"
              >
                <option value="cash">Cash</option>
                <option value="esewa">eSewa</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </div>

            <div>
              <Label>Receipt (Image/PDF)</Label>
              <div className="mt-1">
                {!paymentReceiptFile ? (
                  <label className="flex items-center justify-center w-full px-3 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[var(--color-accent-custom,#22C55E)] hover:bg-emerald-50 transition">
                    <div className="flex flex-col items-center gap-1">
                      <Upload className="h-4 w-4 text-gray-400" />
                      <span className="text-xs text-gray-600">Click to upload</span>
                    </div>
                    <input
                      type="file"
                      onChange={handlePaymentReceiptChange}
                      accept="image/png,image/jpeg,image/gif,.pdf"
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="space-y-2">
                    {paymentReceiptPreview === "pdf" ? (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                            <span className="text-xs font-bold text-red-600">PDF</span>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-900">{paymentReceiptFile.name}</p>
                            <p className="text-xs text-gray-500">{(paymentReceiptFile.size / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemovePaymentReceipt}
                          className="text-red-600 hover:bg-red-50 h-7 px-2"
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <img
                          src={paymentReceiptPreview}
                          alt="Receipt preview"
                          className="w-full max-h-32 object-contain rounded-lg border border-gray-200"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleRemovePaymentReceipt}
                          className="w-full text-red-600 hover:bg-red-50 h-7 text-xs"
                        >
                          Remove Image
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label>Note (Optional)</Label>
              <textarea
                placeholder="Add a note..."
                value={paymentFormData.note}
                onChange={(e) => setPaymentFormData({ ...paymentFormData, note: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-custom,#22C55E)]"
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-3">
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)} disabled={paymentSaving}>
              Cancel
            </Button>
            <Button
              onClick={handleSavePayment}
              disabled={paymentSaving}
              className={paymentType === "in" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}
            >
              {paymentSaving ? "Saving..." : "Record Transaction"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Party Dialog */}
      <Dialog open={showPartyDialog} onOpenChange={setShowPartyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Party</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="block text-center mb-2">Photo</Label>
              <div className="flex justify-center">
                <ProfilePhotoUpload
                  existingUrl={null}
                  initials={partyFormData.name?.substring(0, 2) || "P"}
                  onChange={(file) => setPartyPhotoFile(file)}
                  onRemove={() => setPartyPhotoFile(null)}
                  variant="compact"
                />
              </div>
            </div>
            <div>
              <Label>
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={partyFormData.name}
                onChange={(e) => setPartyFormData({ ...partyFormData, name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Mobile</Label>
              <Input
                value={partyFormData.mobile}
                onChange={(e) => setPartyFormData({ ...partyFormData, mobile: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>PAN</Label>
              <Input
                value={partyFormData.pan}
                onChange={(e) => setPartyFormData({ ...partyFormData, pan: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={partyFormData.email}
                onChange={(e) => setPartyFormData({ ...partyFormData, email: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={() => setShowPartyDialog(false)} disabled={partySaving}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveParty}
              disabled={partySaving}
              className="bg-[var(--color-accent-custom,#22C55E)] hover:bg-[var(--color-accent-custom,#22C55E)]/90"
            >
              {partySaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Budget Dialog */}
      <Dialog open={showBudgetDialog} onOpenChange={setShowBudgetDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Budget</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>
                Category <span className="text-red-500">*</span>
              </Label>
              <select
                value={budgetFormData.category?.toString() || ""}
                onChange={(e) => setBudgetFormData({ ...budgetFormData, category: parseInt(e.target.value) })}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-custom,#22C55E)]"
              >
                <option value="">Select category</option>
                <optgroup label="Expense Categories">
                  {expenseCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Income Categories">
                  {incomeCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div>
              <Label>
                Budget Amount <span className="text-red-500">*</span>
              </Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                  Rs.
                </span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={budgetFormData.amount || ""}
                  onChange={(e) => setBudgetFormData({ ...budgetFormData, amount: e.target.value })}
                  placeholder="0.00"
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <Label>Month</Label>
              <p className="mt-1 text-sm">
                This budget applies to <span className="font-medium">{selectedMonthLabel}</span>
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={() => setShowBudgetDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveBudget}
              className="bg-[var(--color-accent-custom,#22C55E)] hover:bg-[var(--color-accent-custom,#22C55E)]/90"
            >
              Add Budget
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Account Dialog */}
      <Dialog open={showAccountDialog} onOpenChange={setShowAccountDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>
                Account Type <span className="text-red-500">*</span>
              </Label>
              <div className="mt-2 grid grid-cols-5 gap-2">
                {ACCOUNT_TYPE_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const active = accountFormData.type === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setAccountFormData({ ...accountFormData, type: option.value })}
                      className={`flex flex-col items-center justify-center gap-1.5 h-20 rounded-lg border text-xs font-medium transition-all ${
                        active
                          ? "border-[var(--color-accent-custom,#22C55E)] bg-green-50 text-[#16A34A]"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-center leading-tight px-1">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {accountFormData.type === "bank" && (
              <div>
                <Label>
                  Bank Name <span className="text-red-500">*</span>
                </Label>
                <select
                  value={accountFormData.bankName}
                  onChange={(e) => setAccountFormData({ ...accountFormData, bankName: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-custom,#22C55E)]"
                >
                  <option value="">Select bank</option>
                  {NEPALI_BANKS.map((bank) => (
                    <option key={bank} value={bank}>
                      {bank}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <Label>
                Account Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={accountFormData.name}
                onChange={(e) => setAccountFormData({ ...accountFormData, name: e.target.value })}
                placeholder="e.g., My Checking Account, Main Credit Card"
                className="mt-1"
              />
            </div>

            {accountFormData.type === "bank" && (
              <div>
                <Label>Account Number</Label>
                <Input
                  value={accountFormData.accountNumber}
                  onChange={(e) => setAccountFormData({ ...accountFormData, accountNumber: e.target.value })}
                  placeholder="e.g., 01234567890123"
                  className="mt-1"
                />
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
                  value={accountFormData.balance || "0"}
                  onChange={(e) => setAccountFormData({ ...accountFormData, balance: e.target.value })}
                  placeholder="0.00"
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                For liabilities (credit cards, loans), enter as negative number (e.g., -25000)
              </p>
            </div>

            <div>
              <Label>Description</Label>
              <Input
                value={accountFormData.description}
                onChange={(e) => setAccountFormData({ ...accountFormData, description: e.target.value })}
                placeholder="Optional description"
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={() => setShowAccountDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveAccount}
              className="bg-[var(--color-accent-custom,#22C55E)] hover:bg-[var(--color-accent-custom,#22C55E)]/90"
            >
              Add Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
