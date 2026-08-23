"use client";

import { useState, useMemo, useEffect } from "react";
import { FileText, Calculator, TrendingUp, Info, ChevronDown, ChevronUp } from "lucide-react";
import { DashHeader } from "@/components/dashboard/dash-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/context/AuthContext";
import { formatCurrency } from "@/lib/utils";
import { FormattedDate } from "@/components/shared/FormattedDate";
import { useDateSystemStore } from "@/lib/stores/dateSystemStore";
import {
  getTransactions,
  getCategories,
  type PFTransaction,
  type PFCategory,
} from "@/lib/personal-finance/store";

interface IncomeEntry {
  id: string;
  date: string;
  description: string;
  amount: number;
  categoryName: string;
}

function toIncomeEntries(transactions: PFTransaction[], categories: PFCategory[]): IncomeEntry[] {
  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name || "Uncategorized";
  return transactions
    .filter((t) => t.type === "income")
    .map((t) => ({
      id: t.id,
      date: t.date,
      description: t.description || categoryName(t.categoryId),
      amount: t.amount,
      categoryName: categoryName(t.categoryId),
    }));
}

// Nepal Tax Slabs for FY 2080/81 (simplified)
// Individual taxpayers
const TAX_SLABS = [
  { min: 0, max: 500000, rate: 0.01, label: "Up to Rs. 5,00,000 (1%)" },
  { min: 500000, max: 700000, rate: 0.10, label: "Rs. 5,00,001 - 7,00,000 (10%)" },
  { min: 700000, max: 1000000, rate: 0.20, label: "Rs. 7,00,001 - 10,00,000 (20%)" },
  { min: 1000000, max: 2000000, rate: 0.30, label: "Rs. 10,00,001 - 20,00,000 (30%)" },
  { min: 2000000, max: Infinity, rate: 0.36, label: "Above Rs. 20,00,000 (36%)" },
];

function calculateTax(totalIncome: number) {
  let tax = 0;
  let remainingIncome = totalIncome;
  const breakdown: { slab: string; taxableAmount: number; rate: number; tax: number }[] = [];

  for (let i = 0; i < TAX_SLABS.length; i++) {
    const slab = TAX_SLABS[i];
    const slabRange = slab.max - slab.min;
    
    if (remainingIncome <= 0) break;
    
    const taxableInThisSlab = Math.min(remainingIncome, slabRange);
    const taxForThisSlab = taxableInThisSlab * slab.rate;
    
    if (taxableInThisSlab > 0) {
      breakdown.push({
        slab: slab.label,
        taxableAmount: taxableInThisSlab,
        rate: slab.rate * 100,
        tax: taxForThisSlab,
      });
      tax += taxForThisSlab;
      remainingIncome -= taxableInThisSlab;
    }
  }

  return { totalTax: tax, breakdown };
}

export default function TaxPage() {
  const { user } = useAuth();
  const scope = user?.tenant?.slug ?? null;
  const { dateSystem } = useDateSystemStore();
  const [selectedPeriod, setSelectedPeriod] = useState<"ytd" | "fy2026" | "fy2025">("ytd");
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [incomeEntries, setIncomeEntries] = useState<IncomeEntry[]>(() =>
    toIncomeEntries(getTransactions(scope), getCategories(scope))
  );

  // Transactions/categories live in the shared Personal Finance store — reload
  // whenever the scope (tenant) changes so this stays in sync with what was
  // actually recorded on the Transactions page.
  useEffect(() => {
    setIncomeEntries(toIncomeEntries(getTransactions(scope), getCategories(scope)));
  }, [scope]);

  const workspaceName = user?.tenant?.workspace_name || user?.tenant?.name || "Workspace";
  const subtitle = `${workspaceName} · Tax calculation based on income`;

  // Get display labels for years based on date system
  const currentYearLabel = dateSystem === 'BS' ? '2083' : '2026';
  const fy2026Label = dateSystem === 'BS' ? 'FY 2082/83' : 'FY 2025/26';
  const fy2025Label = dateSystem === 'BS' ? 'FY 2081/82' : 'FY 2024/25';

  // Filter income by period
  const filteredIncome = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();

    switch (selectedPeriod) {
      case "ytd":
        // Year to date
        return incomeEntries.filter(entry => {
          const entryDate = new Date(entry.date);
          return entryDate.getFullYear() === currentYear;
        });
      case "fy2026":
        // Fiscal year 2026 (example: July 2025 - June 2026)
        return incomeEntries.filter(entry => {
          const entryDate = new Date(entry.date);
          return entryDate >= new Date("2025-07-01") && entryDate <= new Date("2026-06-30");
        });
      case "fy2025":
        // Fiscal year 2025
        return incomeEntries.filter(entry => {
          const entryDate = new Date(entry.date);
          return entryDate >= new Date("2024-07-01") && entryDate <= new Date("2025-06-30");
        });
      default:
        return incomeEntries;
    }
  }, [selectedPeriod, incomeEntries]);

  const totalIncome = useMemo(() => {
    return filteredIncome.reduce((sum, entry) => sum + entry.amount, 0);
  }, [filteredIncome]);

  const taxCalculation = useMemo(() => {
    return calculateTax(totalIncome);
  }, [totalIncome]);

  const effectiveTaxRate = totalIncome > 0 ? (taxCalculation.totalTax / totalIncome) * 100 : 0;

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Tax Calculation" subtitle={subtitle} />

      <div className="flex-1 p-6 space-y-6">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900">Auto-calculated Tax Estimate</p>
            <p className="text-xs text-blue-700 mt-1">
              Tax is automatically calculated based on your income entries (Transaction In). 
              Nepal tax slabs for individuals are applied. This is an estimate only.
            </p>
          </div>
        </div>

        {/* Period Selector */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <Label className="text-sm font-medium text-gray-700 mb-3 block">
            Select Period 
            <span className={`ml-2 px-1.5 py-0.5 rounded text-xs font-medium ${dateSystem === 'BS' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
              {dateSystem}
            </span>
          </Label>
          <div className="flex gap-2">
            <Button
              variant={selectedPeriod === "ytd" ? "default" : "outline"}
              onClick={() => setSelectedPeriod("ytd")}
              className={selectedPeriod === "ytd" ? "bg-[#22C55E] hover:bg-[#22C55E]/90" : ""}
            >
              Year to Date ({currentYearLabel})
            </Button>
            <Button
              variant={selectedPeriod === "fy2026" ? "default" : "outline"}
              onClick={() => setSelectedPeriod("fy2026")}
              className={selectedPeriod === "fy2026" ? "bg-[#22C55E] hover:bg-[#22C55E]/90" : ""}
            >
              {fy2026Label}
            </Button>
            <Button
              variant={selectedPeriod === "fy2025" ? "default" : "outline"}
              onClick={() => setSelectedPeriod("fy2025")}
              className={selectedPeriod === "fy2025" ? "bg-[#22C55E] hover:bg-[#22C55E]/90" : ""}
            >
              {fy2025Label}
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-gray-500">Total Income</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Based on {filteredIncome.length} income {filteredIncome.length === 1 ? "entry" : "entries"}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-[#22C55E]" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalIncome)}</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-gray-500">Estimated Tax</p>
                <p className="text-xs text-gray-400 mt-0.5">As per Nepal tax slabs</p>
              </div>
              <Calculator className="h-8 w-8 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-amber-600">{formatCurrency(taxCalculation.totalTax)}</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-gray-500">Effective Tax Rate</p>
                <p className="text-xs text-gray-400 mt-0.5">Average rate applied</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-600">{effectiveTaxRate.toFixed(2)}%</p>
          </div>
        </div>

        {/* Tax Breakdown */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Tax Breakdown by Slab</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="text-[#22C55E] hover:text-[#22C55E]/90"
            >
              {showBreakdown ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Hide
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Show
                </>
              )}
            </Button>
          </div>

          {showBreakdown && (
            <div className="p-5">
              {taxCalculation.breakdown.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No tax calculated (income below taxable threshold)
                </p>
              ) : (
                <div className="space-y-4">
                  {taxCalculation.breakdown.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between pb-4 border-b border-gray-100 last:border-0">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{item.slab}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Taxable: {formatCurrency(item.taxableAmount)} × {item.rate}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">{formatCurrency(item.tax)}</p>
                        <Badge variant="secondary" className="mt-1 bg-amber-100 text-amber-700">
                          {item.rate}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2 border-t-2 border-gray-300">
                    <p className="text-sm font-semibold text-gray-900">Total Tax Liability</p>
                    <p className="text-lg font-bold text-amber-600">{formatCurrency(taxCalculation.totalTax)}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Income Entries Used for Calculation */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700">
              Income Entries ({filteredIncome.length})
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              These Transaction In entries were used for tax calculation
            </p>
          </div>

          {filteredIncome.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-gray-500">No income entries found for this period</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredIncome.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <FormattedDate value={entry.date} />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{entry.description}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{entry.categoryName}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-[#22C55E]">
                        +{formatCurrency(entry.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-gray-900">
                      Total Income
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-[#22C55E]">
                      {formatCurrency(totalIncome)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Tax Slabs Reference */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Nepal Tax Slabs (Individuals)</h3>
          <div className="space-y-2">
            {TAX_SLABS.map((slab, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{slab.label}</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  {(slab.rate * 100).toFixed(0)}%
                </Badge>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Note: This is a simplified calculation. Actual tax may vary based on deductions, exemptions, and other factors. 
            Consult a tax professional for accurate filing.
          </p>
        </div>
      </div>
    </div>
  );
}

function Label({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}
