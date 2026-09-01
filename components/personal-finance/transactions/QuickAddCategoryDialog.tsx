import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { FinanceCategory } from "@/lib/api/personal-finance";

interface QuickAddCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: {
    name?: string;
    type?: "income" | "expense";
    description?: string;
  };
  onFormDataChange: (data: Partial<QuickAddCategoryDialogProps["formData"]>) => void;
  onAdd: () => void;
}

export function QuickAddCategoryDialog({
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  onAdd,
}: QuickAddCategoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add {formData.type === "income" ? "Income" : "Expense"} Category</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>
              Type <span className="text-red-500">*</span>
            </Label>
            <div className="mt-1 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onFormDataChange({ type: "expense" })}
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
                onClick={() => onFormDataChange({ type: "income" })}
                className={`flex items-center justify-center gap-2 h-10 rounded-lg border font-medium text-sm transition-all ${
                  formData.type === "income"
                    ? "border-[#22C55E] bg-green-50 text-[#16A34A]"
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
              Category Name <span className="text-red-500">*</span>
            </Label>
            <Input
              value={formData.name}
              onChange={(e) => onFormDataChange({ name: e.target.value })}
              placeholder="e.g., Groceries, Salary, Rent"
              className="mt-1 focus-visible:ring-0 focus-visible:border-input"
              autoFocus
            />
          </div>

          <div>
            <Label>Description</Label>
            <Input
              value={formData.description}
              onChange={(e) => onFormDataChange({ description: e.target.value })}
              placeholder="Optional description"
              className="mt-1 focus-visible:ring-0 focus-visible:border-input"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button onClick={onAdd} className="bg-[#22C55E] hover:bg-[#22C55E]/90">
            Add Category
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
