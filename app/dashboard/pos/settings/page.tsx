"use client";

import { useState, useEffect } from "react";
import { Settings, Receipt, Building2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashHeader } from "@/components/dashboard/dash-header";
import posApi from "@/lib/api/pos";
import { bankAccountsAPI } from "@/lib/api/accounting";
import { toast } from "sonner";

type PaymentMethod = "tax" | "esewa" | "khalti" | "fonepay" | "bank";

// Backend ImageFields — see handleSave for why these need special handling.
const QR_FIELD_KEYS = ["esewa_qr", "khalti_qr", "fonepay_qr", "bank_qr"];

export default function POSSettingsPage() {
  const [settings, setSettings] = useState<any>({
    tax_rate: 13,
    esewa_enabled: true,
    esewa_number: "",
    esewa_name: "",
    esewa_qr: null,
    khalti_enabled: true,
    khalti_number: "",
    khalti_name: "",
    khalti_qr: null,
    fonepay_enabled: true,
    fonepay_number: "",
    fonepay_qr: null,
    bank_transfer_enabled: true,
    linked_bank_account: null,
    bank_qr: null,
    bank_name: "",
    bank_account_number: "",
    bank_account_name: "",
  });
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);

  useEffect(() => {
    loadSettings();
    loadBankAccounts();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await posApi.getSettings();
      if (data) setSettings(data);
    } catch (error) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const loadBankAccounts = async () => {
    try {
      const data = await bankAccountsAPI.list();
      setBankAccounts(data || []);
    } catch (error) {
      console.error("Failed to load bank accounts:", error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Use FormData for file uploads
      const formData = new FormData();

      // Add all text fields. The QR fields are backend ImageFields — once one
      // is uploaded, `settings` holds it as a URL string (from the GET
      // response), not a File. Resending that string as this field's value
      // makes DRF reject it ("submitted data was not a file"), so these are
      // only included when the user picked a new file; otherwise they're left
      // out of the (partial) update entirely, keeping the existing image.
      Object.keys(settings).forEach(key => {
        const value = settings[key];
        if (QR_FIELD_KEYS.includes(key)) {
          if (value instanceof File) {
            formData.append(key, value);
          }
          return;
        }
        if (value instanceof File) {
          formData.append(key, value);
        } else if (value !== null && value !== undefined && typeof value !== 'object') {
          formData.append(key, String(value));
        }
      });

      // Import apiClient dynamically
      const apiClient = (await import('@/lib/api/client')).default;

      // apiClient defaults to Content-Type: application/json, which makes
      // axios JSON-stringify this FormData instead of sending it as
      // multipart — it must be overridden per-request so axios (and then the
      // browser) can set the correct multipart boundary instead.
      const response = await apiClient.patch('/pos/settings/update/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data) {
        setSettings(response.data);
        toast.success("Settings saved successfully!");
        setSelectedMethod(null);
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error: any) {
      console.error('Save error:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          JSON.stringify(error.response?.data) || 
                          "Failed to save settings";
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const paymentMethods = [
    {
      id: "tax" as PaymentMethod,
      name: "Tax Settings",
      description: "Configure tax rate",
      logo: null,
      icon: Receipt,
      color: "bg-gray-100",
      textLogo: null,
      enabled: true,
    },
    {
      id: "esewa" as PaymentMethod,
      name: "eSewa",
      description: "Digital wallet (deprecated)",
      logo: "https://cdn.esewa.com.np/ui/images/logos/esewa_logo.png",
      color: "bg-emerald-50",
      textLogo: { text: "eSewa", color: "text-emerald-600", bgColor: "bg-emerald-100" },
      enabled: settings.esewa_enabled,
      deprecated: true,
    },
    {
      id: "khalti" as PaymentMethod,
      name: "Khalti",
      description: "Digital wallet (deprecated)",
      logo: "https://khalti.com/static/img/logo1.png",
      color: "bg-purple-50",
      textLogo: { text: "Khalti", color: "text-purple-600", bgColor: "bg-purple-100" },
      enabled: settings.khalti_enabled,
      deprecated: true,
    },
    {
      id: "fonepay" as PaymentMethod,
      name: "FonePay",
      description: "Digital wallet (deprecated)",
      logo: "https://fonepay.com/images/fonepay-logo.png",
      color: "bg-blue-50",
      textLogo: { text: "FonePay", color: "text-blue-600", bgColor: "bg-blue-100" },
      enabled: settings.fonepay_enabled,
      deprecated: true,
    },
    {
      id: "bank" as PaymentMethod,
      name: "Bank Transfer",
      description: "Direct bank transfers",
      logo: null,
      icon: Building2,
      color: "bg-indigo-50",
      textLogo: null,
      enabled: settings.bank_transfer_enabled,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#4A5D7A] border-t-transparent mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      <DashHeader
        title="POS Settings"
        subtitle="Configure payment methods and preferences"
        icon={<Settings className="h-6 w-6" />}
      />

      {/* Payment Method Cards Grid - 1 row x 5 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {paymentMethods.map((method) => (
          <Card
            key={method.id}
            className="border border-gray-200 dark:border-gray-700 hover:border-[#4A5D7A] hover:shadow-md transition-all cursor-pointer group overflow-hidden"
            onClick={() => setSelectedMethod(method.id)}
          >
            <CardContent className="p-4">
              {/* Logo Section */}
              <div className={`w-full h-16 flex items-center justify-center rounded-lg mb-3 ${method.color} dark:opacity-80`}>
                {method.textLogo ? (
                  <div className={`px-4 py-2 rounded-md ${method.textLogo.bgColor} dark:opacity-90`}>
                    <span className={`text-xl font-bold ${method.textLogo.color} dark:brightness-110`}>
                      {method.textLogo.text}
                    </span>
                  </div>
                ) : method.icon ? (
                  <method.icon className="h-8 w-8 text-gray-600 dark:text-gray-400" />
                ) : null}
              </div>

              {/* Status Badge */}
              {method.id !== "tax" && (
                <div className="flex justify-center mb-2">
                  <div
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      method.enabled
                        ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {method.enabled ? "Enabled" : "Disabled"}
                  </div>
                </div>
              )}

              {/* Name */}
              <h3 className="text-center text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">{method.name}</h3>
              <p className="text-center text-xs text-gray-500 dark:text-gray-400 mb-3">{method.description}</p>

              {/* Configure Button */}
              <div className="flex items-center justify-center text-[#4A5D7A] dark:text-slate-400 text-xs font-medium group-hover:gap-0.5 transition-all">
                Configure
                <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Configuration Dialog */}
      <Dialog open={selectedMethod !== null} onOpenChange={(open) => !open && setSelectedMethod(null)}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {paymentMethods.find((m) => m.id === selectedMethod)?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            {/* Tax Settings */}
            {selectedMethod === "tax" && (
              <div className="col-span-2">
                <div className="space-y-2">
                  <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                  <Input
                    id="tax_rate"
                    type="number"
                    value={settings.tax_rate}
                    onChange={(e) =>
                      setSettings({ ...settings, tax_rate: parseFloat(e.target.value) || 0 })
                    }
                    step="0.01"
                    className="h-10"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400">VAT rate applied to all sales</p>
                </div>
              </div>
            )}

            {/* eSewa */}
            {selectedMethod === "esewa" && (
              <>
                <div className="col-span-2 mb-4">
                  <div className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">⚠️ Deprecated Payment Method</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      eSewa is now configured as a sub-method under specific Bank Accounts. Please go to <strong>Accounting → Bank Accounts</strong>, 
                      add or edit a bank account, and enable eSewa there. This standalone configuration will be removed in a future update.
                    </p>
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">Enable eSewa</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Accept eSewa payments</p>
                    </div>
                    <Switch
                      checked={settings.esewa_enabled}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, esewa_enabled: checked })
                      }
                    />
                  </div>
                </div>
                {settings.esewa_enabled && (
                  <>
                    {/* Left Column - Form Fields */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="esewa_name">Account Holder Name</Label>
                        <Input
                          id="esewa_name"
                          value={settings.esewa_name || ""}
                          onChange={(e) => setSettings({ ...settings, esewa_name: e.target.value })}
                          placeholder="Enter account holder name"
                          className="h-10"
                        />
                        <p className="text-sm text-gray-500 dark:text-gray-400">Name displayed on receipts</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="esewa_number">eSewa Merchant ID</Label>
                        <Input
                          id="esewa_number"
                          value={settings.esewa_number || ""}
                          onChange={(e) => setSettings({ ...settings, esewa_number: e.target.value })}
                          placeholder="98XXXXXXXX"
                          className="h-10"
                        />
                        <p className="text-sm text-gray-500 dark:text-gray-400">Your eSewa merchant number</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="esewa_qr">eSewa QR Code (Optional)</Label>
                        <Input
                          id="esewa_qr"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setSettings({ ...settings, esewa_qr: file });
                            }
                          }}
                          className="h-10"
                        />
                        <p className="text-sm text-gray-500 dark:text-gray-400">Upload your eSewa payment QR code image</p>
                      </div>
                    </div>

                    {/* Right Column - QR Preview */}
                    <div className="flex items-center justify-center">
                      {settings.esewa_qr ? (
                        <div className="w-full">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 text-center">QR Code Preview</p>
                          <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950 dark:to-green-950 p-6 rounded-xl border-2 border-emerald-200 dark:border-emerald-800 shadow-lg">
                            <img 
                              src={typeof settings.esewa_qr === 'string' ? settings.esewa_qr : URL.createObjectURL(settings.esewa_qr)} 
                              alt="eSewa QR" 
                              className="w-full h-auto object-contain rounded-lg mx-auto" 
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-64 bg-gray-50 dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center">
                          <div className="text-center text-gray-400 dark:text-gray-600">
                            <svg className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-sm">No QR code uploaded</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}

            {/* Khalti */}
            {selectedMethod === "khalti" && (
              <>
                <div className="col-span-2 mb-4">
                  <div className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">⚠️ Deprecated Payment Method</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Khalti is now configured as a sub-method under specific Bank Accounts. Please go to <strong>Accounting → Bank Accounts</strong>, 
                      add or edit a bank account, and enable Khalti there. This standalone configuration will be removed in a future update.
                    </p>
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">Enable Khalti</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Accept Khalti payments</p>
                    </div>
                    <Switch
                      checked={settings.khalti_enabled}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, khalti_enabled: checked })
                      }
                    />
                  </div>
                </div>
                {settings.khalti_enabled && (
                  <>
                    {/* Left Column - Form Fields */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="khalti_name">Account Holder Name</Label>
                        <Input
                          id="khalti_name"
                          value={settings.khalti_name || ""}
                          onChange={(e) => setSettings({ ...settings, khalti_name: e.target.value })}
                          placeholder="Enter account holder name"
                          className="h-10"
                        />
                        <p className="text-sm text-gray-500 dark:text-gray-400">Name displayed on receipts</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="khalti_number">Khalti Merchant ID</Label>
                        <Input
                          id="khalti_number"
                          value={settings.khalti_number || ""}
                          onChange={(e) => setSettings({ ...settings, khalti_number: e.target.value })}
                          placeholder="98XXXXXXXX"
                          className="h-10"
                        />
                        <p className="text-sm text-gray-500 dark:text-gray-400">Your Khalti merchant number</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="khalti_qr">Khalti QR Code (Optional)</Label>
                        <Input
                          id="khalti_qr"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setSettings({ ...settings, khalti_qr: file });
                            }
                          }}
                          className="h-10"
                        />
                        <p className="text-sm text-gray-500 dark:text-gray-400">Upload your Khalti payment QR code image</p>
                      </div>
                    </div>

                    {/* Right Column - QR Preview */}
                    <div className="flex items-center justify-center">
                      {settings.khalti_qr ? (
                        <div className="w-full">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 text-center">QR Code Preview</p>
                          <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950 p-6 rounded-xl border-2 border-purple-200 dark:border-purple-800 shadow-lg">
                            <img 
                              src={typeof settings.khalti_qr === 'string' ? settings.khalti_qr : URL.createObjectURL(settings.khalti_qr)} 
                              alt="Khalti QR" 
                              className="w-full h-auto object-contain rounded-lg mx-auto" 
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-64 bg-gray-50 dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center">
                          <div className="text-center text-gray-400 dark:text-gray-600">
                            <svg className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-sm">No QR code uploaded</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}

            {/* FonePay */}
            {selectedMethod === "fonepay" && (
              <>
                <div className="col-span-2 mb-4">
                  <div className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">⚠️ Deprecated Payment Method</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      FonePay is now configured as a sub-method under specific Bank Accounts. Please go to <strong>Accounting → Bank Accounts</strong>, 
                      add or edit a bank account, and enable FonePay there. This standalone configuration will be removed in a future update.
                    </p>
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">Enable FonePay</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Accept FonePay payments</p>
                    </div>
                    <Switch
                      checked={settings.fonepay_enabled}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, fonepay_enabled: checked })
                      }
                    />
                  </div>
                </div>
                {settings.fonepay_enabled && (
                  <>
                    {/* Left Column - Form Fields */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="fonepay_number">FonePay Merchant ID</Label>
                        <Input
                          id="fonepay_number"
                          value={settings.fonepay_number || ""}
                          onChange={(e) => setSettings({ ...settings, fonepay_number: e.target.value })}
                          placeholder="98XXXXXXXX"
                          className="h-10"
                        />
                        <p className="text-sm text-gray-500 dark:text-gray-400">Your FonePay merchant number</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fonepay_qr">FonePay QR Code (Optional)</Label>
                        <Input
                          id="fonepay_qr"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setSettings({ ...settings, fonepay_qr: file });
                            }
                          }}
                          className="h-10"
                        />
                        <p className="text-sm text-gray-500 dark:text-gray-400">Upload your FonePay payment QR code image</p>
                      </div>
                    </div>

                    {/* Right Column - QR Preview */}
                    <div className="flex items-center justify-center">
                      {settings.fonepay_qr ? (
                        <div className="w-full">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 text-center">QR Code Preview</p>
                          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 p-6 rounded-xl border-2 border-blue-200 dark:border-blue-800 shadow-lg">
                            <img 
                              src={typeof settings.fonepay_qr === 'string' ? settings.fonepay_qr : URL.createObjectURL(settings.fonepay_qr)} 
                              alt="FonePay QR" 
                              className="w-full h-auto object-contain rounded-lg mx-auto" 
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-64 bg-gray-50 dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center">
                          <div className="text-center text-gray-400 dark:text-gray-600">
                            <svg className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-sm">No QR code uploaded</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}

            {/* Bank Transfer */}
            {selectedMethod === "bank" && (
              <>
                <div className="col-span-2">
                  <div className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-950 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">Enable Bank Transfer</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Accept bank transfers</p>
                    </div>
                    <Switch
                      checked={settings.bank_transfer_enabled}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, bank_transfer_enabled: checked })
                      }
                    />
                  </div>
                </div>
                {settings.bank_transfer_enabled && (
                  <>
                    {/* Bank Account Selector */}
                    <div className="space-y-4 mb-6">
                      <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                          Link to Accounting Bank Account (Recommended)
                        </h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                          Select a bank account from Accounting → Bank Accounts. Bank transfer payments will automatically update that account's balance.
                        </p>
                        <div className="space-y-2">
                          <Label htmlFor="linked_bank_account">Select Bank Account</Label>
                          <Select
                            value={settings.linked_bank_account ? String(settings.linked_bank_account) : ""}
                            onValueChange={(value) => 
                              setSettings({ ...settings, linked_bank_account: value ? parseInt(value) : null })
                            }
                          >
                            <SelectTrigger className="bg-white dark:bg-gray-800">
                              <SelectValue placeholder="Select a bank account or set up manually below" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">None (Use manual setup below)</SelectItem>
                              {bankAccounts.filter(acc => acc.status === 'active').map(account => (
                                <SelectItem key={account.id} value={String(account.id)}>
                                  {account.bank_name} - {account.account_number} ({account.account_name})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {bankAccounts.length === 0 && (
                            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                              No bank accounts found. Go to Accounting → Bank Accounts to add one.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Manual Setup (Legacy/Fallback) */}
                    <div className="space-y-4 opacity-60">
                      <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                        Manual setup (optional, only if not using linked account above):
                      </p>
                      <div className="space-y-2">
                        <Label htmlFor="bank_name">Bank Name</Label>
                        <Input
                          id="bank_name"
                          value={settings.bank_name || ""}
                          onChange={(e) => setSettings({ ...settings, bank_name: e.target.value })}
                          placeholder="e.g., NIC Asia Bank"
                          className="h-10"
                          disabled={!!settings.linked_bank_account}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bank_account_number">Account Number</Label>
                        <Input
                          id="bank_account_number"
                          value={settings.bank_account_number || ""}
                          onChange={(e) =>
                            setSettings({ ...settings, bank_account_number: e.target.value })
                          }
                          placeholder="Enter account number"
                          className="h-10"
                          disabled={!!settings.linked_bank_account}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bank_account_name">Account Holder Name</Label>
                        <Input
                          id="bank_account_name"
                          value={settings.bank_account_name || ""}
                          onChange={(e) =>
                            setSettings({ ...settings, bank_account_name: e.target.value })
                          }
                          placeholder="Enter account holder name"
                          className="h-10"
                          disabled={!!settings.linked_bank_account}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bank_qr">Bank Transfer QR Code (Optional)</Label>
                        <Input
                          id="bank_qr"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setSettings({ ...settings, bank_qr: file });
                            }
                          }}
                          className="h-10"
                          disabled={!!settings.linked_bank_account}
                        />
                        <p className="text-sm text-gray-500 dark:text-gray-400">Upload your bank payment QR code image</p>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedMethod(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="bg-[#4A5D7A] hover:bg-[#4A5D7A]/90"
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
