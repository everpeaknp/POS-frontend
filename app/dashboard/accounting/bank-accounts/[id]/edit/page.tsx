"use client";

import { PageLoading } from "@/components/shared/PageLoading";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { DashHeader } from "@/components/dashboard/dash-header";
import { bankAccountsAPI } from "@/lib/api/accounting";
import { loadBankGlAccounts } from "@/lib/accounting/bank-gl-accounts";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
      {children}
    </div>
  );
}

type AccountType = "Current" | "Savings" | "Fixed" | "Overdraft";
type Status = "active" | "inactive" | "closed";

export default function EditBankAccountPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [glAccounts, setGlAccounts] = useState<Awaited<ReturnType<typeof loadBankGlAccounts>>>([]);
  const [qrCodeFile, setQrCodeFile] = useState<File | null>(null);
  const [esewaQrFile, setEsewaQrFile] = useState<File | null>(null);
  const [khaltiQrFile, setKhaltiQrFile] = useState<File | null>(null);
  const [fonepayQrFile, setFonepayQrFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<{
    bank_name: string;
    account_name: string;
    account_number: string;
    type: AccountType;
    branch: string;
    swift_code: string;
    gl_account: string;
    status: Status;
    esewa_enabled: boolean;
    esewa_number: string;
    khalti_enabled: boolean;
    khalti_number: string;
    fonepay_enabled: boolean;
    fonepay_number: string;
  }>({
    bank_name: "",
    account_name: "",
    account_number: "",
    type: "Current",
    branch: "",
    swift_code: "",
    gl_account: "",
    status: "active",
    esewa_enabled: false,
    esewa_number: "",
    khalti_enabled: false,
    khalti_number: "",
    fonepay_enabled: false,
    fonepay_number: "",
  });

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const glData = await loadBankGlAccounts();
      setGlAccounts(glData);

      const accountData = await bankAccountsAPI.get(id);
      setFormData({
        bank_name: accountData.bank_name,
        account_name: accountData.account_name,
        account_number: accountData.account_number,
        type: accountData.type as AccountType,
        branch: accountData.branch || "",
        swift_code: accountData.swift_code || "",
        gl_account: String(accountData.gl_account),
        status: accountData.status as Status,
        esewa_enabled: accountData.esewa_enabled || false,
        esewa_number: accountData.esewa_number || "",
        khalti_enabled: accountData.khalti_enabled || false,
        khalti_number: accountData.khalti_number || "",
        fonepay_enabled: accountData.fonepay_enabled || false,
        fonepay_number: accountData.fonepay_number || "",
      });
    } catch (error: any) {
      console.error('Failed to load data:', error);
      if (error.response?.status === 404) {
        setError('Bank account not found');
      } else {
        setError('Failed to load bank account details');
      }
      toast.error('Failed to load bank account');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validation
    if (!formData.bank_name.trim()) {
      toast.error('Bank name is required');
      return;
    }
    if (!formData.account_name.trim()) {
      toast.error('Account name is required');
      return;
    }
    if (!formData.account_number.trim()) {
      toast.error('Account number is required');
      return;
    }

    try {
      setSaving(true);
      const formDataToSend = new FormData();
      formDataToSend.append('bank_name', formData.bank_name.trim());
      formDataToSend.append('account_name', formData.account_name.trim());
      formDataToSend.append('account_number', formData.account_number.trim());
      formDataToSend.append('type', formData.type);
      
      // Add digital wallet fields
      formDataToSend.append('esewa_enabled', String(formData.esewa_enabled));
      if (formData.esewa_number) {
        formDataToSend.append('esewa_number', formData.esewa_number.trim());
      }
      if (esewaQrFile) {
        formDataToSend.append('esewa_qr', esewaQrFile);
      }
      
      formDataToSend.append('khalti_enabled', String(formData.khalti_enabled));
      if (formData.khalti_number) {
        formDataToSend.append('khalti_number', formData.khalti_number.trim());
      }
      if (khaltiQrFile) {
        formDataToSend.append('khalti_qr', khaltiQrFile);
      }
      
      formDataToSend.append('fonepay_enabled', String(formData.fonepay_enabled));
      if (formData.fonepay_number) {
        formDataToSend.append('fonepay_number', formData.fonepay_number.trim());
      }
      if (fonepayQrFile) {
        formDataToSend.append('fonepay_qr', fonepayQrFile);
      }
      
      // Add QR code image if new file selected
      if (qrCodeFile) {
        formDataToSend.append('qr_code_image', qrCodeFile);
      }
      
      await bankAccountsAPI.update(id, formDataToSend);
      toast.success('Bank account updated successfully');
      router.push(`/dashboard/accounting/bank-accounts/${id}`);
    } catch (error: any) {
      console.error('Failed to update bank account:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to update bank account';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };
  
  const handleQrCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setQrCodeFile(file);
    }
  };

  const glAccountOptions = useMemo(
    () =>
      glAccounts.map((acc) => ({
        value: String(acc.id),
        label: `${acc.code} — ${acc.name}`,
        subtitle: `${acc.type} · ${acc.sub_type}` })),
    [glAccounts]
  );

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Edit Bank Account" subtitle="Loading..." />
        <PageLoading message="Loading account details…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Edit Bank Account" subtitle="Error" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.push('/dashboard/accounting/bank-accounts')} size="sm" className="bg-[#4A5D7A] hover:bg-[#2E3E52] text-white">
              Back to Bank Accounts
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Edit Bank Account" subtitle="Update bank account details" />
      <div className="flex-1 p-6">
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Bank Name" required>
                <Input 
                  className="h-9 text-sm border-gray-200" 
                  placeholder="e.g. Nabil Bank Ltd."
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  disabled={saving}
                />
              </Field>
              <Field label="Account Name" required>
                <Input 
                  className="h-9 text-sm border-gray-200" 
                  placeholder="e.g. FashionNep Current A/C"
                  value={formData.account_name}
                  onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                  disabled={saving}
                />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Account Number" required>
                <Input 
                  className="h-9 text-sm border-gray-200" 
                  placeholder="Account number"
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  disabled={saving}
                />
              </Field>
              <div /> {/* Spacer for grid alignment */}
            </div>
            
            <div className="pt-4 border-t border-gray-100">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Payment QR Code (Optional)</h4>
              <Field label="QR Code Image">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleQrCodeChange}
                  disabled={saving}
                  className="h-9 text-sm border-gray-200"
                />
              </Field>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Digital Wallet Sub-Methods (Optional)</h4>
              <p className="text-xs text-gray-500 mb-4">Enable digital wallets linked to this bank account for POS checkout</p>
              
              {/* eSewa */}
              <div className="border border-gray-200 rounded-lg p-4 mb-3">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    id="esewa_enabled"
                    checked={formData.esewa_enabled}
                    onChange={(e) => setFormData({ ...formData, esewa_enabled: e.target.checked })}
                    disabled={saving}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="esewa_enabled" className="text-sm font-medium cursor-pointer">
                    Enable eSewa payments via this bank
                  </Label>
                </div>
                {formData.esewa_enabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 ml-6">
                    <Field label="eSewa Number/ID">
                      <Input
                        className="h-9 text-sm border-gray-200"
                        placeholder="e.g. 98XXXXXXXX"
                        value={formData.esewa_number}
                        onChange={(e) => setFormData({ ...formData, esewa_number: e.target.value })}
                        disabled={saving}
                      />
                    </Field>
                    <Field label="eSewa QR Code">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setEsewaQrFile(e.target.files?.[0] || null)}
                        disabled={saving}
                        className="h-9 text-sm border-gray-200"
                      />
                    </Field>
                  </div>
                )}
              </div>

              {/* Khalti */}
              <div className="border border-gray-200 rounded-lg p-4 mb-3">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    id="khalti_enabled"
                    checked={formData.khalti_enabled}
                    onChange={(e) => setFormData({ ...formData, khalti_enabled: e.target.checked })}
                    disabled={saving}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="khalti_enabled" className="text-sm font-medium cursor-pointer">
                    Enable Khalti payments via this bank
                  </Label>
                </div>
                {formData.khalti_enabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 ml-6">
                    <Field label="Khalti Number/ID">
                      <Input
                        className="h-9 text-sm border-gray-200"
                        placeholder="e.g. 98XXXXXXXX"
                        value={formData.khalti_number}
                        onChange={(e) => setFormData({ ...formData, khalti_number: e.target.value })}
                        disabled={saving}
                      />
                    </Field>
                    <Field label="Khalti QR Code">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setKhaltiQrFile(e.target.files?.[0] || null)}
                        disabled={saving}
                        className="h-9 text-sm border-gray-200"
                      />
                    </Field>
                  </div>
                )}
              </div>

              {/* FonePay */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    id="fonepay_enabled"
                    checked={formData.fonepay_enabled}
                    onChange={(e) => setFormData({ ...formData, fonepay_enabled: e.target.checked })}
                    disabled={saving}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="fonepay_enabled" className="text-sm font-medium cursor-pointer">
                    Enable FonePay payments via this bank
                  </Label>
                </div>
                {formData.fonepay_enabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 ml-6">
                    <Field label="FonePay Number/ID">
                      <Input
                        className="h-9 text-sm border-gray-200"
                        placeholder="e.g. merchant ID"
                        value={formData.fonepay_number}
                        onChange={(e) => setFormData({ ...formData, fonepay_number: e.target.value })}
                        disabled={saving}
                      />
                    </Field>
                    <Field label="FonePay QR Code">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFonepayQrFile(e.target.files?.[0] || null)}
                        disabled={saving}
                        className="h-9 text-sm border-gray-200"
                      />
                    </Field>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
              <Button 
                type="button"
                variant="ghost" 
                onClick={() => router.back()} 
                className="gap-1.5 text-gray-500"
                disabled={saving}
              >
                <ArrowLeft className="h-4 w-4" /> Cancel
              </Button>
              <div className="flex-1" />
              <Button 
                type="submit"
                className="bg-[#4A5D7A] hover:bg-[#2E3E52] text-white px-6"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Update Bank Account'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
