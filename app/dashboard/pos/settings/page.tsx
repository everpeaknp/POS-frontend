"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Settings, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PosPageShell, posCardClass } from "@/components/dashboard/PosPageShell";
import posApi, { type POSSettings } from "@/lib/api/pos";
import toast from "react-hot-toast";

export default function PosSettingsPage() {
  const [settings, setSettings] = useState<POSSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [taxRate, setTaxRate] = useState("");
  const [taxLabel, setTaxLabel] = useState("");
  const [taxInclusive, setTaxInclusive] = useState(false);
  const [receiptHeader, setReceiptHeader] = useState("");
  const [receiptFooter, setReceiptFooter] = useState("");
  const [autoPrint, setAutoPrint] = useState(true);
  const [allowZeroPrice, setAllowZeroPrice] = useState(false);
  const [requireCustomerCredit, setRequireCustomerCredit] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await posApi.getSettings();
      setSettings(data);
      setTaxRate(String(data.tax_rate));
      setTaxLabel(data.tax_label);
      setTaxInclusive(data.tax_inclusive_pricing);
      setReceiptHeader(data.receipt_header);
      setReceiptFooter(data.receipt_footer);
      setAutoPrint(data.auto_print_receipt);
      setAllowZeroPrice(data.allow_zero_price_items);
      setRequireCustomerCredit(data.require_customer_for_credit);
    } catch (error) {
      console.error("Failed to load settings:", error);
      toast.error("Failed to load POS settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const rate = parseFloat(taxRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.error("Tax rate must be between 0 and 100");
      return;
    }

    setSaving(true);
    try {
      const updated = await posApi.updateSettings({
        tax_rate: rate,
        tax_label: taxLabel.trim() || "VAT",
        tax_inclusive_pricing: taxInclusive,
        receipt_header: receiptHeader,
        receipt_footer: receiptFooter,
        auto_print_receipt: autoPrint,
        allow_zero_price_items: allowZeroPrice,
        require_customer_for_credit: requireCustomerCredit,
      });
      setSettings(updated);
      toast.success("POS settings saved");
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PosPageShell title="POS Settings" subtitle="Loading..." variant="fullscreen" loading />
    );
  }

  return (
    <PosPageShell
      title="POS Settings"
      subtitle="Configure tax rates, receipt text, and POS behavior"
      variant="fullscreen"
    >
      <div className="w-full min-h-full space-y-6 max-w-3xl">
        {/* Action bar */}
        <div className="flex flex-wrap items-center gap-2 sticky top-0 z-10 bg-[#F3F4F6] dark:bg-background py-2 -mx-1 px-1">
          <Link href="/dashboard/pos">
            <Button variant="outline" size="sm" className="gap-1.5 h-8">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to POS
            </Button>
          </Link>
          <div className="flex-1" />
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5 h-8"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>

        {/* Tax Configuration */}
        <div className={`${posCardClass} p-6`}>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-foreground mb-4 flex items-center gap-2">
            <Settings className="h-4 w-4 text-[#22C55E]" />
            Tax Configuration
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Tax Rate (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="mt-1"
                placeholder="13.00"
              />
              <p className="text-xs text-gray-500 mt-1">Applied to all POS sales</p>
            </div>
            <div>
              <Label className="text-sm">Tax Label</Label>
              <Input
                value={taxLabel}
                onChange={(e) => setTaxLabel(e.target.value)}
                className="mt-1"
                placeholder="VAT"
              />
              <p className="text-xs text-gray-500 mt-1">Displayed on receipts (e.g., VAT, Tax, GST)</p>
            </div>
          </div>
          <div className="mt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={taxInclusive}
                onChange={(e) => setTaxInclusive(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[#22C55E] focus:ring-[#22C55E]"
              />
              <span className="text-sm text-gray-700 dark:text-foreground">Tax-inclusive pricing</span>
            </label>
            <p className="text-xs text-gray-500 ml-6 mt-1">
              When enabled, product prices already include tax. Tax is extracted rather than added.
            </p>
          </div>
        </div>

        {/* Receipt Configuration */}
        <div className={`${posCardClass} p-6`}>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-foreground mb-4 flex items-center gap-2">
            <Settings className="h-4 w-4 text-[#22C55E]" />
            Receipt Configuration
          </h3>
          <div className="space-y-4">
            <div>
              <Label className="text-sm">Receipt Header</Label>
              <Textarea
                value={receiptHeader}
                onChange={(e) => setReceiptHeader(e.target.value)}
                className="mt-1 resize-none"
                rows={2}
                placeholder="Extra text displayed above items on receipt..."
              />
            </div>
            <div>
              <Label className="text-sm">Receipt Footer</Label>
              <Textarea
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                className="mt-1 resize-none"
                rows={2}
                placeholder="Thank you for your purchase!"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoPrint}
                onChange={(e) => setAutoPrint(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[#22C55E] focus:ring-[#22C55E]"
              />
              <span className="text-sm text-gray-700 dark:text-foreground">Auto-print receipt after checkout</span>
            </label>
          </div>
        </div>

        {/* POS Behavior */}
        <div className={`${posCardClass} p-6`}>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-foreground mb-4 flex items-center gap-2">
            <Settings className="h-4 w-4 text-[#22C55E]" />
            POS Behavior
          </h3>
          <div className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allowZeroPrice}
                onChange={(e) => setAllowZeroPrice(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[#22C55E] focus:ring-[#22C55E]"
              />
              <span className="text-sm text-gray-700 dark:text-foreground">Allow zero-price items</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={requireCustomerCredit}
                onChange={(e) => setRequireCustomerCredit(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[#22C55E] focus:ring-[#22C55E]"
              />
              <span className="text-sm text-gray-700 dark:text-foreground">Require customer selection for credit sales</span>
            </label>
          </div>
        </div>
      </div>
    </PosPageShell>
  );
}
