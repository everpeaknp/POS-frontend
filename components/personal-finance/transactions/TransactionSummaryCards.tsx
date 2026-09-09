import { TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface TransactionSummaryCardsProps {
  income: number;
  expense: number;
  net: number;
}

export function TransactionSummaryCards({ income, expense, net }: TransactionSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Income</p>
            <p className="text-2xl font-bold text-[#4A5D7A]">{formatCurrency(income)}</p>
          </div>
          <TrendingUp className="h-8 w-8 text-[#4A5D7A]" />
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Expense</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(expense)}</p>
          </div>
          <TrendingDown className="h-8 w-8 text-red-600" />
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Net Balance</p>
            <p className={`text-2xl font-bold ${net >= 0 ? "text-[#4A5D7A]" : "text-red-600"}`}>
              {formatCurrency(net)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
