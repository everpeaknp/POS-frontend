import { Edit2, Trash2, TrendingUp, TrendingDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormattedDate } from "@/components/shared/FormattedDate";
import { formatCurrency } from "@/lib/utils";
import type { FinanceTransaction } from "@/lib/api/personal-finance";

interface TransactionTableProps {
  transactions: FinanceTransaction[];
  hasActiveFilters: boolean;
  onRowClick: (transaction: FinanceTransaction) => void;
  onEdit: (transaction: FinanceTransaction) => void;
  onDelete: (id: number) => void;
  onAddTransaction: () => void;
}

export function TransactionTable({
  transactions,
  hasActiveFilters,
  onRowClick,
  onEdit,
  onDelete,
  onAddTransaction,
}: TransactionTableProps) {
  if (transactions.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="text-center py-12">
          <p className="text-gray-500">
            {hasActiveFilters ? "No transactions match your filters" : "No transactions yet"}
          </p>
          {!hasActiveFilters && (
            <Button onClick={onAddTransaction} className="mt-4 bg-[var(--color-accent-custom,#22C55E)] hover:bg-[var(--color-accent-custom,#22C55E)]/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Transaction
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Transaction ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Account
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {transactions.map((transaction) => {
              return (
                <tr 
                  key={transaction.id} 
                  onClick={() => onRowClick(transaction)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-sm">
                    <span className="font-mono text-xs text-gray-900">#{transaction.transaction_number}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <FormattedDate value={transaction.date} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {transaction.description || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{transaction.category_name || "-"}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{transaction.account_name || "-"}</td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={transaction.type === "income" ? "default" : "secondary"}
                      className={
                        transaction.type === "income"
                          ? "bg-green-100 text-[var(--color-accent-custom,#22C55E)] hover:bg-green-100"
                          : "bg-red-100 text-red-600 hover:bg-red-100"
                      }
                    >
                      {transaction.type === "income" ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {transaction.type === "income" ? "Income" : "Expense"}
                    </Badge>
                  </td>
                  <td
                    className={`px-4 py-3 text-sm text-right font-medium ${
                      transaction.type === "income" ? "text-[var(--color-accent-custom,#22C55E)]" : "text-red-600"
                    }`}
                  >
                    {transaction.type === "income" ? "+" : "-"}
                    {formatCurrency(parseFloat(transaction.amount))}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(transaction)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(transaction.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
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
    </div>
  );
}
