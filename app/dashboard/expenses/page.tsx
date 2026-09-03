"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Receipt, Calendar, DollarSign, FileText, Trash2, Edit } from "lucide-react";
import { DashHeader } from "@/components/dashboard/dash-header";
import { Button } from "@/components/ui/button";
import { AddExpenseModal } from "@/components/expenses/AddExpenseModal";
import { useAuth } from "@/lib/context/AuthContext";
import { formatNPR } from "@/lib/utils";
import { FormattedDate } from "@/components/shared/FormattedDate";
import toast from "react-hot-toast";

interface ExpenseItem {
  description: string;
  amount: number;
}

interface Expense {
  id: string;
  expense_number: string;
  date: string;
  category: string;
  items: ExpenseItem[];
  total_amount: number;
  payment_method: string;
  payment_method_name?: string;
  remarks: string;
  receipt_url?: string | null;
  created_at: string;
}

export default function ExpensesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const workspaceName = user?.tenant?.workspace_name || user?.tenant?.name || "Workspace";
  const subtitle = `${workspaceName} · Track and manage business expenses`;

  // Open modal if ?new=1 is in URL (from sidebar createHref)
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setShowAddModal(true);
      router.replace("/dashboard/expenses", { scroll: false });
    }
  }, [searchParams, router]);

  // Load expenses (mock data for now)
  useEffect(() => {
    const loadExpenses = async () => {
      setLoading(true);
      try {
        // TODO: Replace with actual API call when backend is ready
        // const data = await expensesAPI.list();
        // setExpenses(data);
        
        // Mock data for demonstration
        setExpenses([
          {
            id: "1",
            expense_number: "EXP-20260819-0001",
            date: "2026-08-19",
            category: "Office Supplies",
            items: [
              { description: "Printer paper", amount: 1200 },
              { description: "Pens and markers", amount: 800 },
            ],
            total_amount: 2000,
            payment_method: "cash",
            payment_method_name: "Cash",
            remarks: "Monthly office supplies purchase",
            receipt_url: null,
            created_at: "2026-08-19T10:30:00Z",
          },
        ]);
      } catch (error) {
        console.error("Failed to load expenses:", error);
        toast.error("Failed to load expenses");
      } finally {
        setLoading(false);
      }
    };

    loadExpenses();
  }, []);

  const handleAddExpense = async (expenseData: any) => {
    try {
      // TODO: Replace with actual API call
      // const newExpense = await expensesAPI.create(expenseData);
      
      // Mock: Add to local state
      const newExpense: Expense = {
        id: Date.now().toString(),
        expense_number: expenseData.expense_number,
        date: expenseData.date,
        category: expenseData.category,
        items: expenseData.items,
        total_amount: expenseData.total_amount,
        payment_method: expenseData.payment_method_id,
        payment_method_name: expenseData.payment_method_name,
        remarks: expenseData.remarks,
        receipt_url: null,
        created_at: new Date().toISOString(),
      };
      
      setExpenses((prev) => [newExpense, ...prev]);
      setShowAddModal(false);
      toast.success("Expense added successfully");
    } catch (error) {
      console.error("Failed to add expense:", error);
      toast.error("Failed to add expense");
      throw error;
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) {
      return;
    }
    
    try {
      // TODO: Replace with actual API call
      // await expensesAPI.delete(id);
      
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      toast.success("Expense deleted successfully");
    } catch (error) {
      console.error("Failed to delete expense:", error);
      toast.error("Failed to delete expense");
    }
  };

  // Summary calculations
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.total_amount, 0);
  const expensesThisMonth = expenses.filter((exp) => {
    const expenseDate = new Date(exp.date);
    const now = new Date();
    return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
  });
  const monthTotal = expensesThisMonth.reduce((sum, exp) => sum + exp.total_amount, 0);

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Expenses" subtitle={subtitle} />

      <div className="flex-1 p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Expenses</p>
                <p className="text-2xl font-bold text-gray-900">{formatNPR(totalExpenses)}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <DollarSign className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">This Month</p>
                <p className="text-2xl font-bold text-gray-900">{formatNPR(monthTotal)}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Records</p>
                <p className="text-2xl font-bold text-gray-900">{expenses.length}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <FileText className="h-6 w-6 text-[#22C55E]" />
              </div>
            </div>
          </div>
        </div>

        {/* Expenses List */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">All Expenses</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {expenses.length} {expenses.length === 1 ? "expense" : "expenses"} recorded
              </p>
            </div>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#22C55E] mx-auto mb-2"></div>
              Loading expenses...
            </div>
          ) : expenses.length === 0 ? (
            <div className="p-12 text-center">
              <Receipt className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600 font-medium mb-1">No expenses recorded yet</p>
              <p className="text-sm text-gray-500 mb-4">
                Get started by adding your first expense
              </p>
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-[#22C55E] hover:bg-[#16A34A] text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Expense
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="px-6 py-4 hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-gray-900">
                          {expense.expense_number}
                        </h4>
                        <span className="text-sm text-gray-500">
                          <FormattedDate value={expense.date} />
                        </span>
                      </div>
                      <div className="space-y-1 mb-2">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Category:</span> {expense.category}
                        </p>
                        {expense.items.length > 0 && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Items:</span>
                            <ul className="ml-4 mt-1 space-y-0.5">
                              {expense.items.map((item, idx) => (
                                <li key={idx} className="flex justify-between">
                                  <span>• {item.description}</span>
                                  <span className="ml-4">{formatNPR(item.amount)}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {expense.payment_method_name && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Payment:</span> {expense.payment_method_name}
                          </p>
                        )}
                        {expense.remarks && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Notes:</span> {expense.remarks}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-bold text-gray-900">
                          {formatNPR(expense.total_amount)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete expense"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Expense Modal */}
      <AddExpenseModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddExpense}
      />
    </div>
  );
}
