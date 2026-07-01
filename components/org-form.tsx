"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, ArrowLeft, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { tenantApi } from "@/lib/api/tenant";
import { useAuth } from "@/lib/context/AuthContext";

interface OrgFormData {
  organizationName: string;
  businessType: string;
  address: string;
  logo: File | null;
  // Accounting Details
  accountingStartDate: string;
  vatRegistered: boolean;
  // Workspace Setup
  workspaceName: string;
  // Contact Information (optional)
  ownerName: string;
  email: string;
  phone: string;
  referralCode: string;
  agreeToTerms: boolean;
}

const businessTypes = [
  { value: "construction", label: "Construction" },
  { value: "hardware", label: "Hardware" },
  { value: "retail", label: "Retail" },
  { value: "wholesale", label: "Wholesale" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "services", label: "Services" },
  { value: "other", label: "Other" },
];

const defaultForm: OrgFormData = {
  organizationName: "",
  businessType: "",
  address: "",
  logo: null,
  accountingStartDate: new Date().toISOString().split('T')[0], // Today's date
  vatRegistered: false,
  workspaceName: "",
  ownerName: "",
  email: "",
  phone: "",
  referralCode: "",
  agreeToTerms: false,
};

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-gray-50/40 p-5 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      {children}
    </section>
  );
}

function FieldGroup({ label, required, children, hint }: {
  label: string; required?: boolean; children: React.ReactNode; hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

interface OrgFormProps {
  initialData?: {
    name: string;
    business_type: string;
    address?: string;
    accounting_start_date?: string;
    vat_registered?: boolean;
    workspace_name?: string;
    owner_name?: string;
    email?: string;
    phone?: string;
  };
  onSubmit?: (data: any) => Promise<void>;
  onNext?: (data: any) => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  showBackButton?: boolean;
}

export function OrgForm({ initialData, onSubmit, onNext, submitLabel, isSubmitting, showBackButton = true }: OrgFormProps) {
  const router = useRouter();
  const { refreshUser } = useAuth();
  
  const [form, setForm] = useState<OrgFormData>(() => {
    if (initialData) {
      return {
        organizationName: initialData.name || "",
        businessType: initialData.business_type || "",
        address: initialData.address || "",
        accountingStartDate: initialData.accounting_start_date || new Date().toISOString().split('T')[0],
        vatRegistered: initialData.vat_registered || false,
        workspaceName: initialData.workspace_name || initialData.name || "",
        ownerName: initialData.owner_name || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        referralCode: "",
        agreeToTerms: true, // Auto-check for edit mode
        logo: null,
      };
    }
    return defaultForm;
  });
  
  const [moreInfoOpen, setMoreInfoOpen] = useState(false);
  const [referralOpen, setReferralOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string>("");

  // Generate workspace URL from workspace name
  const workspaceUrl = form.workspaceName
    ? `${form.workspaceName.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')}.khata.app`
    : "your-workspace.khata.app";

  // Handle logo file selection
  const handleLogoChange = (file: File | null) => {
    setLogoError("");
    
    if (!file) {
      setForm({ ...form, logo: null });
      setLogoPreview(null);
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setLogoError("Please upload a JPG, PNG, or GIF image");
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      setLogoError("File size must be less than 5MB");
      return;
    }

    // Create image to check dimensions
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = () => {
      // Validate minimum dimensions
      if (img.width < 300 || img.height < 300) {
        setLogoError("Image must be at least 300x300 pixels");
        URL.revokeObjectURL(objectUrl);
        return;
      }

      // All validations passed
      setForm({ ...form, logo: file });
      setLogoPreview(objectUrl);
    };

    img.onerror = () => {
      setLogoError("Failed to load image");
      URL.revokeObjectURL(objectUrl);
    };

    img.src = objectUrl;
  };

  const isValid =
    form.organizationName.trim() !== "" &&
    form.businessType !== "" &&
    form.address.trim() !== "" &&
    form.accountingStartDate !== "" &&
    form.workspaceName.trim() !== "" &&
    form.agreeToTerms;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    const formData = {
      name: form.organizationName,
      business_type: form.businessType,
      address: form.address,
      accounting_start_date: form.accountingStartDate,
      vat_registered: form.vatRegistered,
      workspace_name: form.workspaceName,
      owner_name: form.ownerName || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
    };

    // If custom onSubmit is provided (edit mode), use it
    if (onSubmit) {
      await onSubmit(formData);
      return;
    }

    // If onNext is provided (multi-step mode), go to next step
    if (onNext) {
      onNext(formData);
      return;
    }

    // Otherwise, use default create logic (single-step mode - deprecated)
    setLoading(true);
    try {
      const tenant = await tenantApi.create(formData);

      toast.success(`Organization "${tenant.name}" created successfully!`);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('[OrgForm] Refreshing user data...');
      try {
        await refreshUser();
        console.log('[OrgForm] User data refreshed, navigating to /erp');
        router.push("/erp");
      } catch (error) {
        window.location.href = "/erp";
      }
    } catch (err: any) {
      if (err.response?.status === 400) {
        const errorData = err.response?.data;
        if (errorData?.name) {
          toast.error(`Organization Name: ${errorData.name[0]}`);
        } else if (errorData?.email) {
          toast.error(`Email: ${errorData.email[0]}`);
        } else {
          toast.error(errorData?.detail || "Invalid data. Please check your input.");
        }
      } else if (err.response?.status === 500) {
        toast.error("Server error. Please try again later.");
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        toast.error("Network error. Please check your connection.");
      } else {
        toast.error(err.response?.data?.detail || "Failed to create organization. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "h-11 w-full rounded-lg border border-gray-200 bg-white text-gray-900 shadow-sm placeholder:text-gray-400 focus-visible:border-[#22C55E] focus-visible:ring-[#22C55E]/15 focus-visible:ring-3 text-sm [color-scheme:light]";

  const selectContentCls = "bg-white border border-gray-200 shadow-lg";
  const selectItemCls = "focus:bg-green-50 focus:text-green-900";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 [color-scheme:light] [--autofill-bg:#ffffff] [--autofill-text:#111827]">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <FormSection title="Organization details">
            <FieldGroup label="Organization Name" required>
              <Input 
                placeholder="e.g. ABC Construction" 
                value={form.organizationName}
                onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
                required 
                className={inputCls} 
              />
            </FieldGroup>

            <FieldGroup label="Industry" required>
              <Select value={form.businessType} onValueChange={(v) => setForm({ ...form, businessType: v ?? "" })}>
                <SelectTrigger className={inputCls}>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent className={selectContentCls}>
                  {businessTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value} className={selectItemCls}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldGroup>

            <FieldGroup label="Organization Address" required>
              <Input 
                placeholder="e.g. Kathmandu, Nepal" 
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                required 
                className={inputCls} 
              />
            </FieldGroup>
          </FormSection>

          <FormSection title="Accounting details">
            <FieldGroup label="Accounting Start Date" required hint="When your accounting records begin">
              <Input 
                type="date" 
                value={form.accountingStartDate}
                onChange={(e) => setForm({ ...form, accountingStartDate: e.target.value })}
                required 
                className={inputCls} 
              />
            </FieldGroup>

            <FieldGroup label="Registered with VAT?" required>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, vatRegistered: true })}
                  className={`h-11 rounded-lg border font-medium text-sm transition-all ${
                    form.vatRegistered
                      ? "border-[#22C55E] bg-green-50 text-[#16A34A] shadow-sm"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, vatRegistered: false })}
                  className={`h-11 rounded-lg border font-medium text-sm transition-all ${
                    !form.vatRegistered
                      ? "border-[#22C55E] bg-green-50 text-[#16A34A] shadow-sm"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  No
                </button>
              </div>
            </FieldGroup>
          </FormSection>

          <FormSection title="Workspace setup">
            <FieldGroup label="Workspace Name" required hint="A friendly name for your workspace">
              <Input 
                placeholder="e.g. ABC Main Workspace" 
                value={form.workspaceName}
                onChange={(e) => setForm({ ...form, workspaceName: e.target.value })}
                required 
                className={inputCls} 
              />
            </FieldGroup>

            <div className="rounded-lg border border-green-100 bg-green-50/80 px-4 py-3">
              <p className="text-xs font-medium text-green-800 mb-1">Your workspace URL</p>
              <p className="text-sm font-mono text-[#16A34A] break-all">{workspaceUrl}</p>
            </div>
          </FormSection>
        </div>

        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-6">
            <FormSection title="Company logo">
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center bg-white hover:border-[#22C55E]/40 transition-colors">
              {logoPreview ? (
                <div className="space-y-4">
                  <div className="w-full aspect-square border-2 border-gray-200 rounded-lg overflow-hidden bg-white">
                    <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleLogoChange(null)}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Remove Logo
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-20 h-20 mx-auto bg-gray-200 rounded-lg flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <label htmlFor="logo-upload" className="cursor-pointer">
                      <span className="text-sm font-medium text-[#22C55E] hover:text-[#16A34A]">
                        Upload a logo
                      </span>
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif"
                        onChange={(e) => handleLogoChange(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">
                    JPG, PNG or GIF<br />
                    Min 300x300px<br />
                    Max 5MB
                  </p>
                </div>
              )}
              {logoError && (
                <p className="text-xs text-red-500 mt-3">{logoError}</p>
              )}
              </div>
            </FormSection>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
          <Collapsible open={moreInfoOpen} onOpenChange={setMoreInfoOpen}>
            <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <span>Add more organization info (optional)</span>
              {moreInfoOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-4 pt-1 flex flex-col gap-3 border-t border-gray-100 bg-gray-50/50">
                <FieldGroup label="Owner Name">
                  <Input placeholder="John Doe" value={form.ownerName}
                    onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                    className={inputCls} />
                </FieldGroup>
                <FieldGroup label="Email">
                  <Input type="email" placeholder="contact@example.com" value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={inputCls} />
                </FieldGroup>
                <FieldGroup label="Phone Number">
                  <Input placeholder="+977 98XXXXXXXX" value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className={inputCls} />
                </FieldGroup>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Referral Code (Collapsible) */}
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
          <Collapsible open={referralOpen} onOpenChange={setReferralOpen}>
            <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <span>Have a referral code?</span>
              {referralOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-4 pt-1 border-t border-gray-100 bg-gray-50/50">
                <FieldGroup label="Referral Code">
                  <Input placeholder="Enter referral code" value={form.referralCode}
                    onChange={(e) => setForm({ ...form, referralCode: e.target.value })}
                    className={inputCls} />
                </FieldGroup>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>

      {/* Agreement */}
      <div className="flex items-start gap-3 p-4 bg-green-50/50 rounded-xl border border-green-100">
        <Checkbox id="terms" checked={form.agreeToTerms}
          onCheckedChange={(checked) => setForm({ ...form, agreeToTerms: checked === true })}
          className="mt-0.5 data-[state=checked]:bg-[#22C55E] data-[state=checked]:border-[#22C55E]" />
        <Label htmlFor="terms" className="text-sm text-gray-700 leading-relaxed cursor-pointer">
          I agree to Khata.app&apos;s{" "}
          <a href="#" className="text-[#22C55E] underline font-medium hover:text-[#16A34A]">Terms of Service</a> and{" "}
          <a href="#" className="text-[#22C55E] underline font-medium hover:text-[#16A34A]">Privacy Policy</a>
        </Label>
      </div>

      {/* Submit Button */}
      <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
        {showBackButton && (
          <Button type="button" variant="outline" onClick={() => router.back()}
            className="px-5 h-11 border-gray-200 text-gray-700 hover:bg-gray-50 gap-1.5"
            disabled={loading}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        )}
        <Button type="submit" disabled={!isValid || loading || isSubmitting}
          className="flex-1 h-11 bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold disabled:opacity-40 gap-1.5 rounded-lg shadow-sm shadow-green-200/50">
          {loading || isSubmitting ? (submitLabel || "Processing...") : (submitLabel || (onNext ? "Next: Select Modules" : "Create Organization"))} <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
