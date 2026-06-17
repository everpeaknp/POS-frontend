"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashHeader } from "@/components/dashboard/dash-header";
import { tenantApi, Tenant } from "@/lib/api/tenant";
import toast from "react-hot-toast";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}

export default function OrgSettingsPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [form, setForm] = useState({
    name: "",
    business_type: "",
    owner_name: "",
    email: "",
    phone: "",
    pan: "",
    website: "",
    province: "",
    district: "",
    city: "",
    street: "",
    currency: "NPR",
    date_format: "BS",
    vat_rate: "13",
    fiscal_year_start: "Shrawan",
  });

  useEffect(() => {
    loadTenantData();
    
    // Show success message if redirected from org creation
    const refresh = searchParams.get('refresh');
    if (refresh === 'true') {
      toast.success("Organization created successfully! You can now manage your settings.");
    }
  }, [searchParams]);

  const loadTenantData = async () => {
    try {
      const data = await tenantApi.getCurrent();
      
      // Parse address into components
      const addressParts = (data.address || "").split(", ");
      
      setForm({
        name: data.name || "",
        business_type: data.business_type || "",
        owner_name: data.owner_name || "",
        email: data.email || "",
        phone: data.phone || "",
        pan: "",
        website: "",
        street: addressParts[0] || "",
        city: addressParts[1] || "",
        district: addressParts[2] || "",
        province: addressParts[3] || "",
        currency: "NPR",
        date_format: "BS",
        vat_rate: "13",
        fiscal_year_start: "Shrawan",
      });
    } catch (error: any) {
      if (error.response?.status === 404) {
        toast.error("No organization found. Please create one first.");
        // Redirect to create organization page after a short delay
        setTimeout(() => {
          window.location.href = '/erp/new';
        }, 2000);
      } else {
        toast.error("Failed to load organization settings");
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Business name is required");
      return;
    }

    setSubmitting(true);
    try {
      // Build address string
      const address = [
        form.street,
        form.city,
        form.district,
        form.province
      ].filter(Boolean).join(", ");

      const updateData = {
        name: form.name.trim(),
        business_type: form.business_type || undefined,
        owner_name: form.owner_name.trim() || undefined,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        address: address || undefined,
      };

      await tenantApi.updateCurrent(updateData);
      toast.success("Settings saved successfully");
    } catch (error: any) {
      if (error.response?.data) {
        const errors = error.response.data;
        if (typeof errors === 'object') {
          Object.entries(errors).forEach(([field, messages]) => {
            if (Array.isArray(messages)) {
              toast.error(`${field}: ${messages.join(', ')}`);
            }
          });
        } else {
          toast.error(error.response?.data?.message || "Failed to save settings");
        }
      } else {
        toast.error("Failed to save settings");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <DashHeader title="Organization Settings" subtitle="Manage your business profile" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashHeader title="Organization Settings" subtitle="Manage your business profile" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 space-y-8 w-full min-h-full">
          
          <div>
            <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Business Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              <Field label="Business Name">
                <Input 
                  className="h-9 text-sm border-gray-200" 
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </Field>
              <Field label="PAN / VAT Number">
                <Input 
                  className="h-9 text-sm border-gray-200" 
                  value={form.pan}
                  onChange={(e) => setForm({ ...form, pan: e.target.value })}
                />
              </Field>
              <Field label="Phone">
                <Input 
                  className="h-9 text-sm border-gray-200" 
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </Field>
              <Field label="Email">
                <Input 
                  className="h-9 text-sm border-gray-200" 
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </Field>
              <Field label="Website">
                <Input 
                  className="h-9 text-sm border-gray-200" 
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                />
              </Field>
              <Field label="Industry">
                <Select 
                  value={form.business_type || ""} 
                  onValueChange={(v) => setForm({ ...form, business_type: v || "" })}
                >
                  <SelectTrigger className="h-9 text-sm border-gray-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Retail", "Wholesale", "Manufacturing", "Services", "Other"].map((i) => (
                      <SelectItem key={i} value={i.toLowerCase()}>{i}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Address</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <Field label="Province">
                <Input 
                  className="h-9 text-sm border-gray-200" 
                  value={form.province}
                  onChange={(e) => setForm({ ...form, province: e.target.value })}
                />
              </Field>
              <Field label="District">
                <Input 
                  className="h-9 text-sm border-gray-200" 
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })}
                />
              </Field>
              <Field label="City">
                <Input 
                  className="h-9 text-sm border-gray-200" 
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </Field>
              <Field label="Street">
                <Input 
                  className="h-9 text-sm border-gray-200" 
                  value={form.street}
                  onChange={(e) => setForm({ ...form, street: e.target.value })}
                />
              </Field>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Preferences</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <Field label="Currency">
                <Select 
                  value={form.currency || ""} 
                  onValueChange={(v) => setForm({ ...form, currency: v || "" })}
                >
                  <SelectTrigger className="h-9 text-sm border-gray-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NPR">NPR — Nepali Rupee</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Date Format">
                <Select 
                  value={form.date_format || ""} 
                  onValueChange={(v) => setForm({ ...form, date_format: v || "" })}
                >
                  <SelectTrigger className="h-9 text-sm border-gray-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BS">Bikram Sambat (BS)</SelectItem>
                    <SelectItem value="AD">Anno Domini (AD)</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="VAT Rate (%)">
                <Input 
                  type="number" 
                  className="h-9 text-sm border-gray-200" 
                  value={form.vat_rate}
                  onChange={(e) => setForm({ ...form, vat_rate: e.target.value })}
                />
              </Field>
              <Field label="Fiscal Year Start">
                <Select 
                  value={form.fiscal_year_start || ""} 
                  onValueChange={(v) => setForm({ ...form, fiscal_year_start: v || "" })}
                >
                  <SelectTrigger className="h-9 text-sm border-gray-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Shrawan">Shrawan (Month 4)</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <Button 
              onClick={handleSubmit}
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white px-6"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
