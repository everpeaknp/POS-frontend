"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DashHeader } from "@/components/dashboard/dash-header";
import { DateInput } from "@/components/shared/DateInput";
import { todayIsoDate } from "@/lib/dates";
import { financeCategoryAPI, type FinanceCategory } from "@/lib/api/personal-finance";
import toast from "react-hot-toast";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
      {children}
    </div>
  );
}

export default function NewBillPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [formData, setFormData] = useState({
    billName: "",
    amount: "",
    dueDate: todayIsoDate(),
    categoryId: "",
    recurring: "one-time",
    status: "unpaid",
    notes: "",
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const data = await financeCategoryAPI.list();
      setCategories(data.filter(c => c.type === "expense"));
    } catch (error: unknown) {
      console.error("Failed to fetch categories:", error);
      // Silently fail - form will work without categories loaded
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.billName.trim()) {
      toast.error("Bill name is required");
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error("Valid amount is required");
      return;
    }
    if (!formData.dueDate) {
      toast.error("Due date is required");
      return;
    }

    setSubmitting(true);
    try {
      // TODO: Replace with actual Bill API call when backend endpoint is ready
      // await financeBillAPI.create({
      //   name: formData.billName,
      //   amount: formData.amount,
      //   due_date: formData.dueDate,
      //   category: formData.categoryId ? parseInt(formData.categoryId) : null,
      //   recurring: formData.recurring,
      //   status: formData.status,
      //   notes: formData.notes,
      // });
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      toast.success("Bill added successfully");
      router.push("/dashboard/finance/bills");
      router.refresh();
    } catch (error: unknown) {
      console.error("Failed to create bill:", error);
      toast.error("Failed to create bill");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashHeader title="Add Bill" subtitle="Add a new bill to track" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 w-full min-h-full">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Bill Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <Field label="Bill Name / Title" required>
                  <Input
                    className="h-9 text-sm border-gray-200"
                    placeholder="e.g., Electricity Bill, Rent"
                    value={formData.billName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, billName: e.target.value }))}
                    required
                  />
                </Field>

                <Field label="Amount" required>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    className="h-9 text-sm border-gray-200"
                    placeholder="e.g., 5000.00"
                    value={formData.amount}
                    onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                    required
                  />
                </Field>

                <Field label="Due Date" required>
                  <DateInput
                    value={formData.dueDate}
                    onChange={(value) => setFormData((prev) => ({ ...prev, dueDate: value }))}
                    required
                  />
                </Field>

                <Field label="Category">
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, categoryId: value }))}
                    disabled={loadingCategories}
                  >
                    <SelectTrigger className="h-9 text-sm border-gray-200">
                      <SelectValue placeholder={loadingCategories ? "Loading..." : "Select category"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </div>

            {/* Payment Details */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Payment Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <Field label="Recurring">
                  <Select
                    value={formData.recurring}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, recurring: value }))}
                  >
                    <SelectTrigger className="h-9 text-sm border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one-time">One-time</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Status">
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger className="h-9 text-sm border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Additional Information</h3>
              <Field label="Notes">
                <Textarea
                  className="text-sm border-gray-200 min-h-[100px]"
                  placeholder="Add any additional notes about this bill..."
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </Field>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#22C55E] hover:bg-[#16A34A] text-white px-6"
                disabled={submitting}
              >
                {submitting ? "Saving..." : "Save Bill"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
