"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/shared/DateInput";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CompanyLogoUpload } from "@/components/company-logo-upload";
import { cn } from "@/lib/utils";

const organizationIndustries = [
  { value: "technology", label: "Technology & IT Services" },
  { value: "software", label: "Software Development" },
  { value: "consulting", label: "Consulting Services" },
  { value: "financial_services", label: "Financial Services" },
  { value: "accounting", label: "Accounting & Bookkeeping" },
  { value: "legal", label: "Legal Services" },
  { value: "marketing", label: "Marketing & Advertising" },
  { value: "real_estate", label: "Real Estate" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "healthcare", label: "Healthcare Services" },
  { value: "education", label: "Education & Training" },
  { value: "hospitality", label: "Hospitality & Tourism" },
  { value: "restaurant", label: "Restaurant & Food Service" },
  { value: "transportation", label: "Transportation & Logistics" },
  { value: "construction", label: "Construction" },
  { value: "retail", label: "Retail Business" },
  { value: "wholesale", label: "Wholesale & Distribution" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "agriculture", label: "Agriculture & Farming" },
  { value: "energy", label: "Energy & Utilities" },
  { value: "telecommunications", label: "Telecommunications" },
  { value: "media", label: "Media & Entertainment" },
  { value: "publishing", label: "Publishing" },
  { value: "design", label: "Design & Creative Services" },
  { value: "events", label: "Events & Conference Management" },
  { value: "security", label: "Security Services" },
  { value: "cleaning", label: "Cleaning & Facility Services" },
  { value: "automotive", label: "Automotive Services" },
  { value: "nonprofit", label: "Non-Profit Organization" },
  { value: "government", label: "Government" },
  { value: "other", label: "Other" },
];

interface OrganizationFormData {
  organizationName: string;
  businessType: string;
  address: string;
  accountingStartDate: string;
  vatRegistered: boolean;
  panVatNumber: string;
  workspaceName: string;
  logo: File | null;
  agreeToTerms: boolean;
}

interface RetailFormProps {
  initialData?: any;
  onNext?: (data: any) => void;
  onBack?: () => void;
  showBackButton?: boolean;
  submitLabel?: string;
  isSubmitting?: boolean;
}

function SearchableDropdown({
  value,
  onChange,
  options,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex w-full items-center justify-between h-11 px-3 text-sm border rounded-lg bg-white dark:bg-card dark:border-border",
          className,
          !value && "text-gray-400 dark:text-muted-foreground"
        )}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform", isOpen && "rotate-180")} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 max-h-80 rounded-lg bg-white dark:bg-card shadow-lg border border-gray-200 dark:border-border overflow-hidden">
          <div className="px-2 py-1.5 border-b dark:border-border bg-white dark:bg-card sticky top-0">
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 text-sm"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="overflow-y-auto max-h-64 p-1">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-500 dark:text-muted-foreground">No results found</div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={cn(
                    "px-3 py-2 text-sm rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-muted",
                    value === option.value && "bg-[var(--color-accent-custom-50,#f0fdf4)] dark:bg-[var(--color-accent-custom-950,#052e16)]/40 font-medium text-[var(--color-accent-custom-700,#15803d)] dark:text-[var(--color-accent-custom-400,#4ade80)]"
                  )}
                >
                  {option.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-foreground border-b border-gray-100 dark:border-border pb-2">{title}</h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function FieldGroup({ label, required, children, hint }: {
  label: string; required?: boolean; children: React.ReactNode; hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm font-medium text-gray-700 dark:text-foreground">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-gray-400 dark:text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function OrganizationForm({
  initialData,
  onNext,
  onBack,
  showBackButton = true,
  submitLabel,
  isSubmitting,
}: RetailFormProps) {
  const router = useRouter();

  const [form, setForm] = useState<OrganizationFormData>(() => ({
    organizationName: initialData?.name || "",
    businessType: initialData?.business_type || "",
    address: initialData?.address || "",
    accountingStartDate: initialData?.accounting_start_date || new Date().toISOString().split('T')[0],
    vatRegistered: initialData?.vat_registered || false,
    panVatNumber: initialData?.pan_vat_number || "",
    workspaceName: initialData?.workspace_name || initialData?.name || "",
    logo: null,
    agreeToTerms: false,
  }));

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      setForm({
        organizationName: initialData.name || "",
        businessType: initialData.business_type || "",
        address: initialData.address || "",
        accountingStartDate: initialData.accounting_start_date || new Date().toISOString().split('T')[0],
        vatRegistered: initialData.vat_registered || false,
        panVatNumber: initialData.pan_vat_number || "",
        workspaceName: initialData.workspace_name || initialData.name || "",
        logo: null,
        agreeToTerms: false,
      });
    }
  }, [initialData]);

  const workspaceUrl = form.workspaceName
    ? `${form.workspaceName.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')}.khata.app`
    : "your-workspace.khata.app";

  const isValid =
    form.organizationName.trim() !== "" &&
    form.businessType !== "" &&
    form.address.trim() !== "" &&
    form.accountingStartDate !== "" &&
    form.workspaceName.trim() !== "" &&
    form.agreeToTerms &&
    (!form.vatRegistered || form.panVatNumber.trim() !== "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    const formData = {
      name: form.organizationName,
      business_type: form.businessType,
      address: form.address,
      accounting_start_date: form.accountingStartDate,
      vat_registered: form.vatRegistered,
      pan_vat_number: form.vatRegistered ? form.panVatNumber.trim() : undefined,
      workspace_name: form.workspaceName,
    };

    if (onNext) {
      onNext(formData);
    }
  };

  const inputCls = "h-11 w-full rounded-lg border border-gray-200 dark:border-border bg-white dark:bg-card text-gray-900 dark:text-foreground shadow-sm placeholder:text-gray-400 dark:placeholder:text-muted-foreground focus-visible:border-[var(--color-accent-custom,#22C55E)] focus-visible:ring-[var(--color-accent-custom,#22C55E)]/15 focus-visible:ring-3 text-sm";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <div className="grid grid-cols-1 gap-6 lg:gap-5 lg:grid-cols-3 lg:items-start">
        {/* Column 1: Organization Details */}
        <div className="space-y-6">
          <FormSection title="Organization details">
            <FieldGroup label="Organization Name" required>
              <Input
                placeholder="e.g. ABC Technologies Pvt. Ltd."
                value={form.organizationName}
                onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
                required
                className={inputCls}
              />
            </FieldGroup>

            <FieldGroup label="Workspace Name" required hint="A friendly name for your workspace">
              <Input
                placeholder="e.g. ABC Technologies Main Workspace"
                value={form.workspaceName}
                onChange={(e) => setForm({ ...form, workspaceName: e.target.value })}
                required
                className={inputCls}
              />
            </FieldGroup>

            <FieldGroup label="Industry" required>
              <SearchableDropdown
                value={form.businessType}
                onChange={(v) => setForm({ ...form, businessType: v })}
                options={organizationIndustries}
                placeholder="Select your industry"
                className={inputCls}
              />
            </FieldGroup>

            <FieldGroup label="Business Address" required>
              <Input
                placeholder="e.g. Durbarmarg, Kathmandu"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                required
                className={inputCls}
              />
            </FieldGroup>
          </FormSection>
        </div>

        {/* Column 2: Accounting Details */}
        <div className="space-y-6">
          <FormSection title="Accounting details">
            <FieldGroup label="Accounting Start Date" required hint="When your business records begin">
              <DateInput
                value={form.accountingStartDate}
                onChange={(date) => setForm({ ...form, accountingStartDate: date })}
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
                      ? "border-[var(--color-accent-custom,#22C55E)] bg-[var(--color-accent-custom-50,#f0fdf4)] dark:bg-[var(--color-accent-custom-950,#052e16)]/40 text-[var(--color-accent-custom-700,#15803d)] dark:text-[var(--color-accent-custom-400,#4ade80)] shadow-sm"
                      : "border-gray-200 dark:border-border bg-white dark:bg-card text-gray-600 dark:text-muted-foreground hover:border-gray-300 dark:hover:border-muted-foreground/40"
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, vatRegistered: false, panVatNumber: "" })}
                  className={`h-11 rounded-lg border font-medium text-sm transition-all ${
                    !form.vatRegistered
                      ? "border-[var(--color-accent-custom,#22C55E)] bg-[var(--color-accent-custom-50,#f0fdf4)] dark:bg-[var(--color-accent-custom-950,#052e16)]/40 text-[var(--color-accent-custom-700,#15803d)] dark:text-[var(--color-accent-custom-400,#4ade80)] shadow-sm"
                      : "border-gray-200 dark:border-border bg-white dark:bg-card text-gray-600 dark:text-muted-foreground hover:border-gray-300 dark:hover:border-muted-foreground/40"
                  }`}
                >
                  No
                </button>
              </div>
            </FieldGroup>

            {form.vatRegistered && (
              <FieldGroup label="VAT Number" required hint="Your IRD VAT / PAN registration number">
                <Input
                  placeholder="e.g. 601234567"
                  value={form.panVatNumber}
                  onChange={(e) => setForm({ ...form, panVatNumber: e.target.value })}
                  required
                  className={inputCls}
                />
              </FieldGroup>
            )}
          </FormSection>
        </div>

        {/* Column 3: Logo */}
        <div className="space-y-6">
          <FormSection title="Company logo (optional)">
            <CompanyLogoUpload
              value={form.logo}
              onChange={(file) => setForm({ ...form, logo: file })}
            />
          </FormSection>
        </div>
      </div>

      {/* Agreement */}
      <div className="flex items-start gap-3 p-4 mt-6 rounded-xl border border-[var(--color-accent-custom-100,#dcfce7)] dark:border-[var(--color-accent-custom-900,#14532d)] bg-[var(--color-accent-custom-50,#f0fdf4)]/50 dark:bg-[var(--color-accent-custom-950,#052e16)]/20">
        <Checkbox
          id="terms"
          checked={form.agreeToTerms}
          onCheckedChange={(checked) => setForm({ ...form, agreeToTerms: checked === true })}
          className="mt-0.5 data-[state=checked]:bg-[var(--color-accent-custom,#22C55E)] data-[state=checked]:border-[var(--color-accent-custom,#22C55E)]"
        />
        <Label htmlFor="terms" className="text-sm text-gray-700 dark:text-muted-foreground leading-relaxed cursor-pointer">
          I agree to Khata.app&apos;s{" "}
          <a href="#" className="text-[var(--color-accent-custom,#22C55E)] underline font-medium hover:text-[var(--color-accent-custom-600,#16A34A)]">Terms of Service</a> and{" "}
          <a href="#" className="text-[var(--color-accent-custom,#22C55E)] underline font-medium hover:text-[var(--color-accent-custom-600,#16A34A)]">Privacy Policy</a>
        </Label>
      </div>

      {/* Submit Button */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between mt-8 pt-6 border-t border-gray-100 dark:border-border">
        {showBackButton && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => (onBack ? onBack() : router.back())}
            className="h-12 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-muted dark:hover:bg-muted/80 text-gray-900 dark:text-foreground border-transparent font-bold gap-1.5 sm:min-w-[120px] shadow-none"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        )}
        {!showBackButton && <div className="hidden sm:block sm:min-w-[120px]" />}
        <Button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="h-12 flex-1 sm:flex-none sm:min-w-[200px] rounded-xl bg-[var(--color-accent-custom,#22C55E)] hover:bg-[var(--color-accent-custom-600,#16A34A)] text-white font-extrabold disabled:opacity-40 gap-1.5 border-transparent shadow-md"
        >
          {submitLabel || "Continue"} <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
