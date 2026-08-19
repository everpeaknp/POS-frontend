"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { DashHeader } from "@/components/dashboard/dash-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PartySelector } from "../party-selector";
import { useAuth } from "@/lib/context/AuthContext";
import toast from "react-hot-toast";
import { partyTransactionAPI } from "@/lib/api/personal-finance";

export default function PartyTransactionInPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [partyId, setPartyId] = useState<number | null>(null);
  const [partyName, setPartyName] = useState("");
  const [formData, setFormData] = useState({
    amount: "",
    date: new Date().toISOString().split("T")[0],
    note: "",
  });

  const workspaceName = user?.tenant?.workspace_name || user?.tenant?.name || "Workspace";
  const subtitle = `${workspaceName} · Record money received from a party`;

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

    try {
      setLoading(true);
      const createData = new FormData();
      createData.append("party", String(partyId));
      createData.append("direction", "in");
      createData.append("amount", formData.amount);
      createData.append("date", formData.date);
      if (formData.note) createData.append("note", formData.note);

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
      <DashHeader title="Money Received" subtitle={subtitle} />

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
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Record Money Received</h2>

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
