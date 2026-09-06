"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CreditCard,
  Plus,
  TrendingUp,
  AlertCircle,
  CircleHelp,
  Trash2,
  Calculator,
  ChevronRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { DashHeader } from "@/components/dashboard/dash-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DateInput } from "@/components/shared/DateInput";
import { useAuth } from "@/lib/context/AuthContext";
import { formatNPR, cn } from "@/lib/utils";
import { financeLoanAPI, type FinanceLoan } from "@/lib/api/personal-finance";
import toast from "react-hot-toast";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

const LOAN_TYPE_OPTIONS: { value: LoanType; label: string }[] = [
  { value: "home", label: "Home Loan" },
  { value: "car", label: "Car Loan" },
  { value: "personal", label: "Personal Loan" },
  { value: "education", label: "Education Loan" },
];

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

export type LoanType = "home" | "car" | "personal" | "education";

export interface LoanTypeDefaults {
  name: string;
  defaultRate: number;
  defaultTenure: number;
  maxTenure: number;
}

export const LOAN_DEFAULTS: Record<LoanType, LoanTypeDefaults> = {
  home: {
    name: "Home Loan",
    defaultRate: 9.5,
    defaultTenure: 20,
    maxTenure: 25,
  },
  car: {
    name: "Car Loan",
    defaultRate: 11,
    defaultTenure: 7,
    maxTenure: 7,
  },
  personal: {
    name: "Personal Loan",
    defaultRate: 16,
    defaultTenure: 5,
    maxTenure: 5,
  },
  education: {
    name: "Education Loan",
    defaultRate: 10,
    defaultTenure: 15,
    maxTenure: 20,
  },
};

export interface AffordabilityInputs {
  monthlyIncome: number;
  monthlyExpenses: number;
  existingEMIs: number;
  affordabilityRatio: number;
  selectedLoanType: LoanType;
  interestRate: number;
  tenureYears: number;
}

export interface AffordabilityResults {
  disposableIncome: number;
  maxTotalEMI: number;
  maxAffordableNewEMI: number;
  maxLoanAmount: number;
  suggestedEMI: number;
  totalInterest: number;
  totalRepayment: number;
  isAffordable: boolean;
}

export interface LoanTypeComparison {
  type: LoanType;
  name: string;
  maxLoanAmount: number;
  emi: number;
  totalInterest: number;
  rate: number;
  tenure: number;
}

export interface ExistingLoan {
  id: number;
  name: string;
  type: LoanType;
  principal: string;
  emi: string;
  remaining_balance: string;
  interest_rate: string;
  start_date: string;
}

// ============================================================================
// CALCULATION FUNCTIONS
// ============================================================================

function calculateEMI(
  principal: number,
  annualRate: number,
  tenureYears: number
): number {
  if (principal <= 0 || annualRate <= 0 || tenureYears <= 0) {
    return 0;
  }

  const monthlyRate = annualRate / 12 / 100;
  const numMonths = tenureYears * 12;

  if (monthlyRate === 0) {
    return principal / numMonths;
  }

  const onePlusR = 1 + monthlyRate;
  const onePlusRPowerN = Math.pow(onePlusR, numMonths);

  const emi = (principal * monthlyRate * onePlusRPowerN) / (onePlusRPowerN - 1);

  return Math.round(emi);
}

function calculateMaxPrincipal(
  emi: number,
  annualRate: number,
  tenureYears: number
): number {
  if (emi <= 0 || annualRate <= 0 || tenureYears <= 0) {
    return 0;
  }

  const monthlyRate = annualRate / 12 / 100;
  const numMonths = tenureYears * 12;

  if (monthlyRate === 0) {
    return emi * numMonths;
  }

  const onePlusR = 1 + monthlyRate;
  const onePlusRPowerN = Math.pow(onePlusR, numMonths);

  const principal =
    (emi * (onePlusRPowerN - 1)) / (monthlyRate * onePlusRPowerN);

  return Math.round(principal);
}

function calculateAffordability(
  inputs: AffordabilityInputs
): AffordabilityResults {
  const {
    monthlyIncome,
    monthlyExpenses,
    existingEMIs,
    affordabilityRatio,
    interestRate,
    tenureYears,
  } = inputs;

  const disposableIncome = monthlyIncome - monthlyExpenses - existingEMIs;
  const maxTotalEMI = monthlyIncome * (affordabilityRatio / 100);
  const maxAffordableNewEMI = Math.max(0, maxTotalEMI - existingEMIs);

  const maxLoanAmount = calculateMaxPrincipal(
    maxAffordableNewEMI,
    interestRate,
    tenureYears
  );

  const suggestedEMI = maxAffordableNewEMI;
  const numMonths = tenureYears * 12;
  const totalRepayment = suggestedEMI * numMonths;
  const totalInterest = totalRepayment - maxLoanAmount;

  const isAffordable = maxAffordableNewEMI > 0 && maxLoanAmount > 0;

  return {
    disposableIncome,
    maxTotalEMI,
    maxAffordableNewEMI,
    maxLoanAmount,
    suggestedEMI,
    totalInterest,
    totalRepayment,
    isAffordable,
  };
}

function calculateLoanTypeComparison(
  maxAffordableEMI: number
): LoanTypeComparison[] {
  const loanTypes: LoanType[] = ["home", "car", "personal", "education"];

  return loanTypes.map((type) => {
    const defaults = LOAN_DEFAULTS[type];
    const maxLoanAmount = calculateMaxPrincipal(
      maxAffordableEMI,
      defaults.defaultRate,
      defaults.defaultTenure
    );
    const totalRepayment = maxAffordableEMI * defaults.defaultTenure * 12;
    const totalInterest = totalRepayment - maxLoanAmount;

    return {
      type,
      name: defaults.name,
      maxLoanAmount,
      emi: maxAffordableEMI,
      totalInterest,
      rate: defaults.defaultRate,
      tenure: defaults.defaultTenure,
    };
  });
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function LoansPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const workspaceName =
    user?.tenant?.workspace_name || user?.tenant?.name || "Workspace";
  const subtitle = `${workspaceName} · Bills, loans, and credit management`;

  // ============================================================================
  // STATE - Calculator Inputs
  // ============================================================================

  const [monthlyIncome, setMonthlyIncome] = useState<string>("100000");
  const [monthlyExpenses, setMonthlyExpenses] = useState<string>("40000");
  const [existingEMIs, setExistingEMIs] = useState<string>("0");
  const [affordabilityRatio, setAffordabilityRatio] = useState<string>("40");
  const [selectedLoanType, setSelectedLoanType] = useState<LoanType>("home");
  const [interestRate, setInterestRate] = useState<string>("9.5");
  const [tenureYears, setTenureYears] = useState<string>("20");

  // ============================================================================
  // STATE - Existing Loans List
  // ============================================================================
  
  const [existingLoans, setExistingLoans] = useState<ExistingLoan[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Load loans from API
  useEffect(() => {
    const loadLoans = async () => {
      try {
        setLoading(true);
        const data = await financeLoanAPI.list();
        setExistingLoans(data);
      } catch (error) {
        console.error("Error loading loans:", error);
        toast.error("Failed to load loans");
      } finally {
        setLoading(false);
      }
    };
    loadLoans();
  }, []);

  const [showAddLoanForm, setShowAddLoanForm] = useState(false);

  // Sidebar "+" deep-links with ?new=1 to open the Add Loan dialog directly
  useEffect(() => {
    if (searchParams.get("new") !== "1") return;
    setShowAddLoanForm(true);
    router.replace("/dashboard/finance/bills", { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, router]);

  const [newLoan, setNewLoan] = useState({
    name: "",
    type: "personal" as LoanType,
    principal: "",
    emi: "",
    remaining_balance: "",
    interest_rate: "",
    start_date: "",
  });

  // ============================================================================
  // AUTO-SUM EMIs from existing loans
  // ============================================================================

  const totalEMIsFromLoans = useMemo(() => {
    return existingLoans.reduce((sum, loan) => sum + parseFloat(loan.emi), 0);
  }, [existingLoans]);

  // Auto-populate existingEMIs when loans change, but allow manual override
  useEffect(() => {
    if (totalEMIsFromLoans > 0) {
      setExistingEMIs(totalEMIsFromLoans.toString());
    }
  }, [totalEMIsFromLoans]);

  // ============================================================================
  // LOAN TYPE CHANGE - Auto-update rate and tenure
  // ============================================================================

  const handleLoanTypeChange = (type: LoanType) => {
    setSelectedLoanType(type);
    const defaults = LOAN_DEFAULTS[type];
    setInterestRate(defaults.defaultRate.toString());
    setTenureYears(defaults.defaultTenure.toString());
  };

  // ============================================================================
  // CALCULATIONS
  // ============================================================================

  const inputs: AffordabilityInputs = {
    monthlyIncome: parseFloat(monthlyIncome) || 0,
    monthlyExpenses: parseFloat(monthlyExpenses) || 0,
    existingEMIs: parseFloat(existingEMIs) || 0,
    affordabilityRatio: parseFloat(affordabilityRatio) || 40,
    selectedLoanType,
    interestRate: parseFloat(interestRate) || 0,
    tenureYears: parseFloat(tenureYears) || 0,
  };

  const results = calculateAffordability(inputs);
  const comparison = calculateLoanTypeComparison(results.maxAffordableNewEMI);

  // Chart data
  const chartData = comparison.map((item) => ({
    name: item.name,
    "Max Loan": item.maxLoanAmount,
    "Total Interest": item.totalInterest,
  }));

  // ============================================================================
  // ADD LOAN HANDLER
  // ============================================================================

  const handleAddLoan = async () => {
    if (
      !newLoan.name ||
      !newLoan.principal ||
      !newLoan.emi ||
      !newLoan.remaining_balance ||
      !newLoan.interest_rate ||
      !newLoan.start_date
    ) {
      toast.error("Please fill all loan fields");
      return;
    }

    try {
      const loan = await financeLoanAPI.create({
        name: newLoan.name,
        type: newLoan.type,
        principal: newLoan.principal,
        emi: newLoan.emi,
        remaining_balance: newLoan.remaining_balance,
        interest_rate: newLoan.interest_rate,
        start_date: newLoan.start_date,
      });

      setExistingLoans([...existingLoans, loan]);
      setNewLoan({
        name: "",
        type: "personal",
        principal: "",
        emi: "",
        remaining_balance: "",
        interest_rate: "",
        start_date: "",
      });
      setShowAddLoanForm(false);
      toast.success("Loan added successfully");
    } catch (error) {
      console.error("Error adding loan:", error);
      toast.error("Failed to add loan");
    }
  };

  const handleDeleteLoan = async (id: number) => {
    try {
      await financeLoanAPI.delete(id);
      setExistingLoans(existingLoans.filter((loan) => loan.id !== id));
      toast.success("Loan deleted successfully");
    } catch (error) {
      console.error("Error deleting loan:", error);
      toast.error("Failed to delete loan");
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Bills" subtitle={subtitle} />

      <div className="flex-1 p-6 space-y-6">
        {/* Affordability Calculator Section */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Loan Affordability Calculator
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Calculate how much you can afford to borrow
              </p>
            </div>
          </div>

          {/* Input Form */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Column 1: Income & Expenses */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Monthly Income (Net)
                </label>
                <input
                  type="number"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-custom,#22C55E)] focus:border-transparent"
                  placeholder="100000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Monthly Expenses
                </label>
                <input
                  type="number"
                  value={monthlyExpenses}
                  onChange={(e) => setMonthlyExpenses(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-custom,#22C55E)] focus:border-transparent"
                  placeholder="40000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Existing EMIs
                  {totalEMIsFromLoans > 0 && (
                    <span className="text-xs text-gray-500 ml-2">
                      (Auto-calculated: {formatNPR(totalEMIsFromLoans)})
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  value={existingEMIs}
                  onChange={(e) => setExistingEMIs(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-custom,#22C55E)] focus:border-transparent"
                  placeholder="15000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Affordability Ratio (% of income)
                </label>
                <input
                  type="number"
                  value={affordabilityRatio}
                  onChange={(e) => setAffordabilityRatio(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-custom,#22C55E)] focus:border-transparent"
                  placeholder="40"
                  min="0"
                  max="100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Recommended: 40% (adjustable based on your risk tolerance)
                </p>
              </div>
            </div>

            {/* Column 2: Loan Parameters */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Loan Type
                </label>
                <select
                  value={selectedLoanType}
                  onChange={(e) =>
                    handleLoanTypeChange(e.target.value as LoanType)
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-custom,#22C55E)] focus:border-transparent"
                >
                  <option value="home">Home Loan</option>
                  <option value="car">Car Loan</option>
                  <option value="personal">Personal Loan</option>
                  <option value="education">Education Loan</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Interest Rate (% per annum)
                </label>
                <input
                  type="number"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-custom,#22C55E)] focus:border-transparent"
                  placeholder="9.5"
                  step="0.1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Default for {LOAN_DEFAULTS[selectedLoanType].name}:{" "}
                  {LOAN_DEFAULTS[selectedLoanType].defaultRate}%
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Loan Tenure (years)
                </label>
                <input
                  type="number"
                  value={tenureYears}
                  onChange={(e) => setTenureYears(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-custom,#22C55E)] focus:border-transparent"
                  placeholder="20"
                  min="1"
                  max={LOAN_DEFAULTS[selectedLoanType].maxTenure}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Max for {LOAN_DEFAULTS[selectedLoanType].name}:{" "}
                  {LOAN_DEFAULTS[selectedLoanType].maxTenure} years
                </p>
              </div>
            </div>

            {/* Column 3: Quick Results Preview */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-5 border border-amber-100">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                Quick Summary
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-600">Disposable Income</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatNPR(results.disposableIncome)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Max Total EMI Allowed</p>
                  <p className="text-base font-semibold text-gray-700">
                    {formatNPR(results.maxTotalEMI)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">
                    Max Affordable New EMI
                  </p>
                  <p className="text-base font-semibold text-amber-600">
                    {formatNPR(results.maxAffordableNewEMI)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Results Display */}
          {results.isAffordable ? (
            <div>
              {/* Main Results Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                  <p className="text-xs text-green-700 mb-1">
                    Max Loan Amount
                  </p>
                  <p className="text-xl font-bold text-green-900">
                    {formatNPR(results.maxLoanAmount)}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <p className="text-xs text-blue-700 mb-1">Suggested EMI</p>
                  <p className="text-xl font-bold text-blue-900">
                    {formatNPR(results.suggestedEMI)}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                  <p className="text-xs text-purple-700 mb-1">Total Interest</p>
                  <p className="text-xl font-bold text-purple-900">
                    {formatNPR(results.totalInterest)}
                  </p>
                </div>
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                  <p className="text-xs text-amber-700 mb-1">Total Repayment</p>
                  <p className="text-xl font-bold text-amber-900">
                    {formatNPR(results.totalRepayment)}
                  </p>
                </div>
              </div>

              {/* Comparison Chart */}
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">
                  Loan Type Comparison
                  <span className="text-xs font-normal text-gray-500 ml-2">
                    (Based on your max affordable EMI of{" "}
                    {formatNPR(results.maxAffordableNewEMI)})
                  </span>
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e5e7eb"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "#6b7280" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#6b7280" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) =>
                        `${(value / 100000).toFixed(1)}L`
                      }
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(value: number) => formatNPR(value)}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: "12px" }}
                      iconType="circle"
                    />
                    <Bar
                      dataKey="Max Loan"
                      fill="var(--color-accent-custom,#22C55E)"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="Total Interest"
                      fill="#F59E0B"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>

                {/* Detailed Comparison Table */}
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 text-gray-600 font-medium">
                          Loan Type
                        </th>
                        <th className="text-right py-2 text-gray-600 font-medium">
                          Max Amount
                        </th>
                        <th className="text-right py-2 text-gray-600 font-medium">
                          Rate
                        </th>
                        <th className="text-right py-2 text-gray-600 font-medium">
                          Tenure
                        </th>
                        <th className="text-right py-2 text-gray-600 font-medium">
                          Total Interest
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparison.map((item) => (
                        <tr
                          key={item.type}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-2 text-gray-900 font-medium">
                            {item.name}
                          </td>
                          <td className="text-right text-gray-900">
                            {formatNPR(item.maxLoanAmount)}
                          </td>
                          <td className="text-right text-gray-700">
                            {item.rate}%
                          </td>
                          <td className="text-right text-gray-700">
                            {item.tenure} yrs
                          </td>
                          <td className="text-right text-amber-600 font-medium">
                            {formatNPR(item.totalInterest)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-red-900 mb-2">
                  No Additional Loan Recommended
                </h3>
                <p className="text-sm text-red-800">
                  Your existing expenses and EMIs already use up your full
                  affordable EMI budget (
                  {formatNPR(results.maxTotalEMI)} at {inputs.affordabilityRatio}
                  % of income). Taking an additional loan is not currently
                  recommended.
                </p>
                <p className="text-sm text-red-700 mt-2">
                  Consider reducing existing expenses or increasing income to
                  improve affordability.
                </p>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <CircleHelp className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-800">
              <p className="font-medium mb-1">Important Disclaimer</p>
              <p>
                This is an estimate for planning purposes only, not a loan
                pre-approval. Actual eligibility depends on lender criteria,
                credit score, employment history, existing obligations, and
                other factors. Consult with a financial advisor or lender for
                personalized guidance.
              </p>
            </div>
          </div>
        </div>

        {/* Existing Loans List */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-semibold text-gray-700">
                Your Existing Loans & Credit
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Total EMI: {formatNPR(totalEMIsFromLoans)} /month
              </p>
            </div>
            <button
              onClick={() => setShowAddLoanForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-accent-custom,#22C55E)] text-white text-sm font-medium rounded-lg hover:bg-[#16A34A] transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Loan
            </button>
          </div>

          {/* Loans List */}
          {existingLoans.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              <CreditCard className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No loans added yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Click "Add Loan" to track your existing loans
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {existingLoans.map((loan) => (
                <div
                  key={loan.id}
                  className="px-6 py-4 hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                          <CreditCard className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900">
                            {loan.name}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {LOAN_DEFAULTS[loan.type].name} •{" "}
                            {loan.interest_rate}% interest
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 ml-11">
                        <div>
                          <p className="text-xs text-gray-500">Monthly EMI</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {formatNPR(loan.emi)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">
                            Principal Amount
                          </p>
                          <p className="text-sm text-gray-700">
                            {formatNPR(loan.principal)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">
                            Remaining Balance
                          </p>
                          <p className="text-sm text-gray-700">
                            {formatNPR(parseFloat(loan.remaining_balance))}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Start Date</p>
                          <p className="text-sm text-gray-700">
                            {new Date(loan.start_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteLoan(loan.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete loan"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Loan Dialog */}
      <Dialog open={showAddLoanForm} onOpenChange={setShowAddLoanForm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Loan</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <Field label="Loan Name" required>
              <Input
                className="h-9 text-sm border-gray-200 focus-visible:ring-0 focus-visible:border-input"
                placeholder="e.g. Home Loan - ABC Bank"
                value={newLoan.name}
                onChange={(e) => setNewLoan({ ...newLoan, name: e.target.value })}
              />
            </Field>
            <Field label="Loan Type" required>
              <Select
                value={newLoan.type}
                onValueChange={(v) => v && setNewLoan({ ...newLoan, type: v as LoanType })}
              >
                <SelectTrigger className="h-9 text-sm border-gray-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LOAN_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Principal Amount" required>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                  Rs.
                </span>
                <Input
                  type="number"
                  min="0"
                  className="h-9 pl-9 text-sm border-gray-200 focus-visible:ring-0 focus-visible:border-input"
                  placeholder="0"
                  value={newLoan.principal}
                  onChange={(e) => setNewLoan({ ...newLoan, principal: e.target.value })}
                />
              </div>
            </Field>
            <Field label="Remaining Balance" required>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                  Rs.
                </span>
                <Input
                  type="number"
                  min="0"
                  className="h-9 pl-9 text-sm border-gray-200 focus-visible:ring-0 focus-visible:border-input"
                  placeholder="0"
                  value={newLoan.remaining_balance}
                  onChange={(e) => setNewLoan({ ...newLoan, remaining_balance: e.target.value })}
                />
              </div>
            </Field>
            <Field label="Monthly EMI" required>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                  Rs.
                </span>
                <Input
                  type="number"
                  min="0"
                  className="h-9 pl-9 text-sm border-gray-200 focus-visible:ring-0 focus-visible:border-input"
                  placeholder="0"
                  value={newLoan.emi}
                  onChange={(e) => setNewLoan({ ...newLoan, emi: e.target.value })}
                />
              </div>
            </Field>
            <Field label="Interest Rate (% p.a.)" required>
              <Input
                type="number"
                min="0"
                step="0.1"
                className="h-9 text-sm border-gray-200 focus-visible:ring-0 focus-visible:border-input"
                value={newLoan.interest_rate}
                onChange={(e) => setNewLoan({ ...newLoan, interest_rate: e.target.value })}
              />
            </Field>
            <Field label="Start Date" required>
              <DateInput
                className="h-9 text-sm border-gray-200 focus-visible:ring-0 focus-visible:border-input"
                value={newLoan.start_date}
                onChange={(date) => setNewLoan({ ...newLoan, start_date: date })}
              />
            </Field>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            <Button type="button" variant="ghost" onClick={() => setShowAddLoanForm(false)} className="text-gray-500">
              Cancel
            </Button>
            <Button type="button" onClick={handleAddLoan} className="bg-[var(--color-accent-custom,#22C55E)] hover:bg-[#16A34A] text-white px-6">
              Save Loan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
