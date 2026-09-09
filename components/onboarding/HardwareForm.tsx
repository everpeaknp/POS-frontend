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

const hardwareIndustries = [
  { value: "general_hardware", label: "General Hardware Store" },
  { value: "building_materials", label: "Building Materials" },
  { value: "construction_hardware", label: "Construction Hardware" },
  { value: "electrical_hardware", label: "Electrical Hardware & Supplies" },
  { value: "plumbing_supplies", label: "Plumbing Supplies & Fixtures" },
  { value: "paint_supplies", label: "Paint & Painting Supplies" },
  { value: "tools_equipment", label: "Tools & Equipment" },
  { value: "power_tools", label: "Power Tools & Accessories" },
  { value: "hand_tools", label: "Hand Tools" },
  { value: "fasteners", label: "Fasteners & Hardware Fittings" },
  { value: "lumber_timber", label: "Lumber & Timber" },
  { value: "cement_concrete", label: "Cement & Concrete Products" },
  { value: "steel_iron", label: "Steel & Iron Products" },
  { value: "roofing_materials", label: "Roofing Materials" },
  { value: "doors_windows", label: "Doors & Windows" },
  { value: "tiles_flooring", label: "Tiles & Flooring Materials" },
  { value: "bathroom_fittings", label: "Bathroom Fittings & Sanitary" },
  { value: "kitchen_fittings", label: "Kitchen Fittings & Accessories" },
  { value: "locks_security", label: "Locks & Security Hardware" },
  { value: "wire_cable", label: "Wire & Cable" },
  { value: "pipes_fittings", label: "Pipes & Fittings" },
  { value: "safety_equipment", label: "Safety Equipment" },
  { value: "gardening_tools", label: "Gardening Tools & Supplies" },
  { value: "industrial_supplies", label: "Industrial Supplies" },
  { value: "automotive_parts", label: "Automotive Parts & Hardware" },
  { value: "agricultural_tools", label: "Agricultural Tools & Equipment" },
  { value: "welding_supplies", label: "Welding Supplies" },
  { value: "other", label: "Other Hardware" },
];

interface HardwareFormData {
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
          "flex w-full items-center justify-between h-11 px-3 text-sm border rounded-lg bg-white",
          className,
          !value && "text-gray-400"
        )}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform", isOpen && "rotate-180")} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 max-h-80 rounded-lg bg-white shadow-lg border border-gray-200 overflow-hidden">
          <div className="px-2 py-1.5 border-b bg-white sticky top-0">
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
              <div className="py-6 text-center text-sm text-gray-500">No results found</div>
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
                    "px-3 py-2 text-sm rounded cursor-pointer hover:bg-gray-100",
                    value === option.value && "bg-slate-50 font-medium text-slate-700"
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
      <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">{title}</h3>
      <div className="space-y-4">{children}</div>
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

export function HardwareForm({
  initialData,
  onNext,
  onBack,
  showBackButton = true,
  submitLabel,
  isSubmitting,
}: RetailFormProps) {
  const router = useRouter();

  const [form, setForm] = useState<HardwareFormData>(() => ({
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
      account_type: "hardware" as const,
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

  const inputCls = "h-11 w-full rounded-lg border border-gray-200 bg-white text-gray-900 shadow-sm placeholder:text-gray-400 focus-visible:border-[#4A5D7A] focus-visible:ring-[#4A5D7A]/15 focus-visible:ring-3 text-sm";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <div className="grid grid-cols-1 gap-6 lg:gap-5 lg:grid-cols-3 lg:items-start">
        {/* Column 1: Store Details */}
        <div className="space-y-6">
          <FormSection title="Store details">
            <FieldGroup label="Store / Business Name" required>
              <Input
                placeholder="e.g. Shiva Hardware Store"
                value={form.organizationName}
                onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
                required
                className={inputCls}
              />
            </FieldGroup>

            <FieldGroup label="Workspace Name" required hint="A friendly name for your workspace">
              <Input
                placeholder="e.g. Shiva Hardware Main Workspace"
                value={form.workspaceName}
                onChange={(e) => setForm({ ...form, workspaceName: e.target.value })}
                required
                className={inputCls}
              />
            </FieldGroup>

            <FieldGroup label="Hardware Type" required>
              <SearchableDropdown
                value={form.businessType}
                onChange={(v) => setForm({ ...form, businessType: v })}
                options={hardwareIndustries}
                placeholder="Select your hardware business type"
                className={inputCls}
              />
            </FieldGroup>

            <FieldGroup label="Store Address" required>
              <Input
                placeholder="e.g. Balaju, Kathmandu"
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
                      ? "border-[#4A5D7A] bg-slate-50 text-[#2E3E52] shadow-sm"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, vatRegistered: false, panVatNumber: "" })}
                  className={`h-11 rounded-lg border font-medium text-sm transition-all ${
                    !form.vatRegistered
                      ? "border-[#4A5D7A] bg-slate-50 text-[#2E3E52] shadow-sm"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
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
      <div className="flex items-start gap-3 p-4 mt-6 rounded-xl border border-slate-100 bg-slate-50/50">
        <Checkbox
          id="terms"
          checked={form.agreeToTerms}
          onCheckedChange={(checked) => setForm({ ...form, agreeToTerms: checked === true })}
          className="mt-0.5 data-[state=checked]:bg-[#4A5D7A] data-[state=checked]:border-[#4A5D7A]"
        />
        <Label htmlFor="terms" className="text-sm text-gray-700 leading-relaxed cursor-pointer">
          I agree to Khata.app&apos;s{" "}
          <a href="#" className="text-[#4A5D7A] underline font-medium hover:text-[#2E3E52]">Terms of Service</a> and{" "}
          <a href="#" className="text-[#4A5D7A] underline font-medium hover:text-[#2E3E52]">Privacy Policy</a>
        </Label>
      </div>

      {/* Submit Button */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between mt-8 pt-6 border-t border-gray-100">
        {showBackButton && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => (onBack ? onBack() : router.back())}
            className="h-12 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 border-transparent font-bold gap-1.5 sm:min-w-[120px] shadow-none"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        )}
        {!showBackButton && <div className="hidden sm:block sm:min-w-[120px]" />}
        <Button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="h-12 flex-1 sm:flex-none sm:min-w-[200px] rounded-xl bg-gradient-to-r from-[#2E3E52] to-[#4A5D7A] hover:from-[#2E3E52] hover:to-[#2E3E52] text-white font-extrabold disabled:opacity-40 gap-1.5 border-transparent shadow-md shadow-slate-500/20"
        >
          {submitLabel || "Continue"} <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
