import { Search, X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateInput } from "@/components/shared/DateInput";

interface Category {
  id: number;
  name: string;
  type: string;
}

interface Account {
  id: number;
  name: string;
}

interface TransactionFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterType: string;
  onFilterTypeChange: (value: string) => void;
  filterCategory: string;
  onFilterCategoryChange: (value: string) => void;
  filterAccount: string;
  onFilterAccountChange: (value: string) => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  categories: Category[];
  accounts: Account[];
  onAddIncome: () => void;
  onAddExpense: () => void;
}

export function TransactionFilters({
  searchTerm,
  onSearchChange,
  filterType,
  onFilterTypeChange,
  filterCategory,
  onFilterCategoryChange,
  filterAccount,
  onFilterAccountChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  hasActiveFilters,
  onClearFilters,
  categories,
  accounts,
  onAddIncome,
  onAddExpense,
}: TransactionFiltersProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none flex-1 min-w-0">
          <div className="relative shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 pr-8 h-9 w-40 text-sm border-gray-200 bg-white focus-visible:ring-0 focus-visible:border-input"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <Select value={filterType} onValueChange={(v) => onFilterTypeChange(v ?? "all")}>
            <SelectTrigger className="h-9 w-32 shrink-0 text-sm border-gray-200 bg-white">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterCategory} onValueChange={(v) => onFilterCategoryChange(v ?? "all")}>
            <SelectTrigger className="h-9 w-36 shrink-0 text-sm border-gray-200 bg-white">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id.toString()}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterAccount} onValueChange={(v) => onFilterAccountChange(v ?? "all")}>
            <SelectTrigger className="h-9 w-36 shrink-0 text-sm border-gray-200 bg-white">
              <SelectValue placeholder="All Accounts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Accounts</SelectItem>
              {accounts.map((acc) => (
                <SelectItem key={acc.id} value={acc.id.toString()}>
                  {acc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 shrink-0">
            <DateInput
              value={dateFrom}
              onChange={onDateFromChange}
              className="h-9 w-36 text-sm border-gray-200 focus-visible:ring-0 focus-visible:border-input"
            />
            <span className="text-sm text-gray-400 shrink-0">to</span>
            <DateInput
              value={dateTo}
              onChange={onDateToChange}
              className="h-9 w-36 text-sm border-gray-200 focus-visible:ring-0 focus-visible:border-input"
            />
          </div>

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="icon"
              onClick={onClearFilters}
              aria-label="Clear filters"
              title="Clear filters"
              className="h-9 w-9 shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <Button 
          onClick={onAddIncome} 
          className="h-7 px-2.5 shrink-0 text-sm bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Income
        </Button>

        <Button 
          onClick={onAddExpense} 
          className="h-7 px-2.5 shrink-0 text-sm bg-red-600 hover:bg-red-700"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Expense
        </Button>
      </div>
    </div>
  );
}
