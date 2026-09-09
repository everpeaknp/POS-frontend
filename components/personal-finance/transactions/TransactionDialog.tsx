import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateInput } from "@/components/shared/DateInput";
import { TrendingUp, TrendingDown, Plus, Upload, ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FinanceTransaction, FinanceCategory, FinanceAccount } from "@/lib/api/personal-finance";

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTransaction: FinanceTransaction | null;
  formData: {
    date?: string;
    type?: "income" | "expense";
    amount?: string;
    category?: number;
    account?: number;
    description?: string;
  };
  onFormDataChange: (data: Partial<TransactionDialogProps["formData"]>) => void;
  availableCategories: FinanceCategory[];
  accounts: FinanceAccount[];
  onSave: () => void;
  receiptFile: File | null;
  receiptPreview: string;
  onReceiptChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveReceipt: () => void;
  categoryComboOpen: boolean;
  setCategoryComboOpen: (open: boolean) => void;
  categorySearch: string;
  setCategorySearch: (search: string) => void;
  accountComboOpen: boolean;
  setAccountComboOpen: (open: boolean) => void;
  accountSearch: string;
  setAccountSearch: (search: string) => void;
  onShowCategoryDialog: () => void;
  onShowAccountDialog: () => void;
}

export function TransactionDialog({
  open,
  onOpenChange,
  editingTransaction,
  formData,
  onFormDataChange,
  availableCategories,
  accounts,
  onSave,
  receiptFile,
  receiptPreview,
  onReceiptChange,
  onRemoveReceipt,
  categoryComboOpen,
  setCategoryComboOpen,
  categorySearch,
  setCategorySearch,
  accountComboOpen,
  setAccountComboOpen,
  accountSearch,
  setAccountSearch,
  onShowCategoryDialog,
  onShowAccountDialog,
}: TransactionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingTransaction ? "Edit Transaction" : "Add Transaction"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>
              Type <span className="text-red-500">*</span>
            </Label>
            <div className="mt-1 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onFormDataChange({ type: "expense", category: undefined })}
                className={`flex items-center justify-center gap-2 h-10 rounded-lg border font-medium text-sm transition-all ${
                  formData.type === "expense"
                    ? "border-red-300 bg-red-50 text-red-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
              >
                <TrendingDown className="h-4 w-4" />
                Expense
              </button>
              <button
                type="button"
                onClick={() => onFormDataChange({ type: "income", category: undefined })}
                className={`flex items-center justify-center gap-2 h-10 rounded-lg border font-medium text-sm transition-all ${
                  formData.type === "income"
                    ? "border-[#4A5D7A] bg-slate-50 text-[#2E3E52]"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                Income
              </button>
            </div>
          </div>

          <div>
            <Label>
              Amount <span className="text-red-500">*</span>
            </Label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                Rs.
              </span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.amount || ""}
                onChange={(e) => onFormDataChange({ amount: e.target.value })}
                placeholder="0.00"
                className="pl-9 focus-visible:ring-0 focus-visible:border-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Category Dropdown */}
            <div className="relative category-dropdown">
              <Label>Category <span className="text-red-500">*</span></Label>
              <button
                type="button"
                onClick={() => {
                  setCategoryComboOpen(!categoryComboOpen);
                  setAccountComboOpen(false);
                }}
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-lg text-left text-sm bg-white hover:bg-gray-50 flex items-center justify-between"
              >
                <span className={formData.category ? "text-gray-900" : "text-gray-500"}>
                  {formData.category
                    ? availableCategories.find((cat) => cat.id === formData.category)?.name
                    : "Select category..."}
                </span>
                <ChevronsUpDown className="h-4 w-4 text-gray-400" />
              </button>

              {categoryComboOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                  <div className="p-2 border-b border-gray-200">
                    <Input
                      placeholder="Search category..."
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      className="h-8"
                      autoFocus
                    />
                  </div>

                  <div className="max-h-60 overflow-y-auto">
                    {availableCategories
                      .filter(cat => cat.name.toLowerCase().includes(categorySearch.toLowerCase()))
                      .map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            onFormDataChange({ category: cat.id });
                            setCategoryComboOpen(false);
                            setCategorySearch("");
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm flex items-center gap-2"
                        >
                          <Check
                            className={cn(
                              "h-4 w-4",
                              formData.category === cat.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {cat.name}
                        </button>
                      ))}
                    {availableCategories.filter(cat => cat.name.toLowerCase().includes(categorySearch.toLowerCase())).length === 0 && (
                      <div className="px-3 py-4 text-center text-sm text-gray-500">
                        No category found
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setCategoryComboOpen(false);
                      setCategorySearch("");
                      onShowCategoryDialog();
                    }}
                    className="w-full px-3 py-2 border-t border-gray-200 text-left text-sm text-[#4A5D7A] hover:bg-emerald-50 flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add new category
                  </button>
                </div>
              )}
            </div>

            {/* Account Dropdown */}
            <div className="relative account-dropdown">
              <Label>Account <span className="text-red-500">*</span></Label>
              <button
                type="button"
                onClick={() => {
                  setAccountComboOpen(!accountComboOpen);
                  setCategoryComboOpen(false);
                }}
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-lg text-left text-sm bg-white hover:bg-gray-50 flex items-center justify-between"
              >
                <span className={formData.account ? "text-gray-900" : "text-gray-500"}>
                  {formData.account
                    ? accounts.find((acc) => acc.id === formData.account)?.name
                    : "Select account..."}
                </span>
                <ChevronsUpDown className="h-4 w-4 text-gray-400" />
              </button>

              {accountComboOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                  <div className="p-2 border-b border-gray-200">
                    <Input
                      placeholder="Search account..."
                      value={accountSearch}
                      onChange={(e) => setAccountSearch(e.target.value)}
                      className="h-8"
                      autoFocus
                    />
                  </div>

                  <div className="max-h-60 overflow-y-auto">
                    {accounts
                      .filter(acc => acc.name.toLowerCase().includes(accountSearch.toLowerCase()))
                      .map((acc) => (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => {
                            onFormDataChange({ account: acc.id });
                            setAccountComboOpen(false);
                            setAccountSearch("");
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm flex items-center gap-2"
                        >
                          <Check
                            className={cn(
                              "h-4 w-4",
                              formData.account === acc.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {acc.name}
                        </button>
                      ))}
                    {accounts.filter(acc => acc.name.toLowerCase().includes(accountSearch.toLowerCase())).length === 0 && (
                      <div className="px-3 py-4 text-center text-sm text-gray-500">
                        No account found
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setAccountComboOpen(false);
                      setAccountSearch("");
                      onShowAccountDialog();
                    }}
                    className="w-full px-3 py-2 border-t border-gray-200 text-left text-sm text-[#4A5D7A] hover:bg-emerald-50 flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add new account
                  </button>
                </div>
              )}
            </div>
          </div>

          <div>
            <Label>Date</Label>
            <DateInput
              value={formData.date || ""}
              onChange={(date) => onFormDataChange({ date })}
              className="mt-1 focus-visible:ring-0 focus-visible:border-input"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Input
              value={formData.description || ""}
              onChange={(e) => onFormDataChange({ description: e.target.value })}
              placeholder="Optional note"
              className="mt-1 focus-visible:ring-0 focus-visible:border-input"
            />
          </div>

          {/* Receipt Upload */}
          <div>
            <Label>Receipt / Bill (Image/PDF)</Label>
            <div className="mt-1">
              {!receiptFile ? (
                <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#4A5D7A] hover:bg-emerald-50 transition">
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Click to upload receipt
                    </span>
                    <span className="text-xs text-gray-500">PNG, JPG, GIF or PDF (up to 10MB)</span>
                  </div>
                  <input
                    type="file"
                    onChange={onReceiptChange}
                    accept="image/png,image/jpeg,image/gif,.pdf"
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="space-y-3">
                  {receiptPreview === "pdf" ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-red-100 rounded flex items-center justify-center">
                          <span className="text-xs font-bold text-red-600">PDF</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{receiptFile.name}</p>
                          <p className="text-xs text-gray-500">
                            {(receiptFile.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onRemoveReceipt}
                        className="text-red-600 hover:bg-red-50"
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <img
                        src={receiptPreview}
                        alt="Receipt preview"
                        className="w-full max-h-64 object-contain rounded-lg border border-gray-200"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onRemoveReceipt}
                        className="w-full text-red-600 hover:bg-red-50"
                      >
                        Remove Image
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSave} className="bg-[#4A5D7A] hover:bg-[#4A5D7A]/90">
            {editingTransaction ? "Update" : "Add"} Transaction
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
