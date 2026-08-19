"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload } from "lucide-react";
import { DashHeader } from "@/components/dashboard/dash-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PartySelector } from "../party-selector";
import { useAuth } from "@/lib/context/AuthContext";
import toast from "react-hot-toast";
import { partyTransactionAPI } from "@/lib/api/personal-finance";

export default function PartyTransactionOutPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [partyId, setPartyId] = useState<number | null>(null);
  const [partyName, setPartyName] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string>("");
  const [formData, setFormData] = useState({
    amount: "",
    date: new Date().toISOString().split("T")[0],
    paymentMethod: "cash",
    note: "",
  });

  const workspaceName = user?.tenant?.workspace_name || user?.tenant?.name || "Workspace";
  const subtitle = `${workspaceName} · Record money given to a party`;

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ["image/jpeg", "image/png", "image/gif", "application/pdf"];
      if (!validTypes.includes(file.type)) {
        toast.error("Please upload an image (JPG, PNG, GIF) or PDF file");
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }

      setReceiptFile(file);

      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setReceiptPreview(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setReceiptPreview("pdf");
      }
    }
  };

  const handleRemoveReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview("");
  };

  const handleSave = async () => {
    // Validation
    if (!partyId) {
      toast.error("Please select a party");
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!formData.date) {
      toast.error("Please select a date");
      return;
    }
    if (!formData.paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    try {
      setLoading(true);
      const createData = new FormData();
      createData.append("party", String(partyId));
      createData.append("direction", "out");
      createData.append("amount", formData.amount);
      createData.append("date", formData.date);
      createData.append("payment_method", formData.paymentMethod);
      if (formData.note) createData.append("note", formData.note);
      if (receiptFile) createData.append("receipt", receiptFile);

      await partyTransactionAPI.create(createData);
      toast.success("Transaction recorded successfully");
      router.push("/dashboard/personal-finance/parties");
    } catch (error) {
      console.error("Failed to create transaction:", error);
      toast.error("Failed to record transaction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Money Given" subtitle={subtitle} />

      <div className="flex-1 p-6">
        <div className="max-w-2xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          {/* Form Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Record Money Given</h2>

            <div className="space-y-6">
              {/* Party Selector */}
              <PartySelector
                value={partyId}
                onChange={(id, name) => {
                  setPartyId(id);
                  setPartyName(name);
                }}
                label="Select Party"
                required
              />

              {/* Amount */}
              <div>
                <Label>Amount (Rs.) <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="mt-1"
                  step="0.01"
                  min="0"
                />
              </div>

              {/* Date */}
              <div>
                <Label>Date <span className="text-red-500">*</span></Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="mt-1"
                />
              </div>

              {/* Payment Method */}
              <div>
                <Label>Payment Method <span className="text-red-500">*</span></Label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                >
                  <option value="">Select payment method...</option>
                  <option value="cash">Cash</option>
                  <option value="esewa">eSewa</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>

              {/* Receipt Upload */}
              <div>
                <Label>Receipt (Image/PDF)</Label>
                <div className="mt-1">
                  {!receiptFile ? (
                    <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#22C55E] hover:bg-emerald-50 transition">
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-5 w-5 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Click to upload or drag and drop
                        </span>
                        <span className="text-xs text-gray-500">PNG, JPG, GIF or PDF (up to 10MB)</span>
                      </div>
                      <input
                        type="file"
                        onChange={handleReceiptChange}
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
                            onClick={handleRemoveReceipt}
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
                            onClick={handleRemoveReceipt}
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

              {/* Note (Optional) */}
              <div>
                <Label>Note (Optional)</Label>
                <textarea
                  placeholder="Add a note..."
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                  rows={3}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-8 border-t pt-6">
              <Button
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading}
                className="bg-[#22C55E] hover:bg-[#22C55E]/90"
              >
                {loading ? "Saving..." : "Record Transaction"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
