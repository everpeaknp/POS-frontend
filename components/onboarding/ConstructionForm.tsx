"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CompanyLogoUpload } from "@/components/company-logo-upload";
import { cn } from "@/lib/utils";

const constructionIndustries = [
  { value: "general_construction", label: "General Construction Company" },
  { value: "building_contractor", label: "Building Contractor" },
  { value: "civil_contractor", label: "Civil Contractor" },
  { value: "residential_construction", label: "Residential Construction" },
  { value: "commercial_construction", label: "Commercial Construction" },
  { value: "infrastructure", label: "Infrastructure Development" },
  { value: "road_construction", label: "Road & Highway Construction" },
  { value: "bridge_construction", label: "Bridge Construction" },
  { value: "concrete_contractor", label: "Concrete Contractor" },
  { value: "masonry", label: "Masonry & Bricklaying" },
  { value: "steel_structure", label: "Steel Structure Erection" },
  { value: "roofing", label: "Roofing Contractor" },
  { value: "excavation", label: "Excavation & Earthwork" },
  { value: "foundation", label: "Foundation Specialist" },
  { value: "renovation", label: "Renovation & Remodeling" },
  { value: "interior_construction", label: "Interior Construction" },
  { value: "electrical_contractor", label: "Electrical Contractor" },
  { value: "plumbing", label: "Plumbing Contractor" },
  { value: "hvac", label: "HVAC Installation" },
  { value: "painting", label: "Painting & Finishing" },
  { value: "flooring", label: "Flooring Specialist" },
  { value: "tiling", label: "Tiling Contractor" },
  { value: "carpentry", label: "Carpentry & Woodwork" },
  { value: "demolition", label: "Demolition Contractor" },
  { value: "landscape", label: "Landscaping & Site Work" },
  { value: "waterproofing", label: "Waterproofing Specialist" },
  { value: "site_development", label: "Site Development" },
  { value: "project_management", label: "Construction Project Management" },
  { value: "equipment_rental", label: "Construction Equipment Rental" },
  { value: "other", label: "Other Construction" },
];

interface ConstructionFormData {
  organizationName: string;
  businessType: string;
  address: string;
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
                    value === option.value && "bg-green-50 font-medium text-green-700"
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

export function ConstructionForm({
  initialData,
  onNext,
  onBack,
  showBackButton = true,
  submitLabel,
  isSubmitting,
}: RetailFormProps) {
  const router = useRouter();

  const [form, setForm] = useState<ConstructionFormData>(() => ({
    organizationName: initialData?.name || "",
    businessType: initialData?.business_type || "",
    address: initialData?.address || "",
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
    form.workspaceName.trim() !== "" &&
    form.agreeToTerms;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    const formData = {
      name: form.organizationName,
      account_type: "construction" as const,
      business_type: form.businessType,
      address: form.address,
      accounting_start_date: new Date().toISOString().split('T')[0],
      vat_registered: false,
      workspace_name: form.workspaceName,
    };

    if (onNext) {
      onNext(formData);
    }
  };

  const inputCls = "h-11 w-full rounded-lg border border-gray-200 bg-white text-gray-900 shadow-sm placeholder:text-gray-400 focus-visible:border-[#22C55E] focus-visible:ring-[#22C55E]/15 focus-visible:ring-3 text-sm";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <div className="grid grid-cols-1 gap-8 lg:gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <FormSection title="Company details">
            <FieldGroup label="Company Name" required>
              <Input
                placeholder="e.g. Ram Construction Pvt. Ltd."
                value={form.organizationName}
                onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
                required
                className={inputCls}
              />
            </FieldGroup>

            <FieldGroup label="Construction Type" required>
              <SearchableDropdown
                value={form.businessType}
                onChange={(v) => setForm({ ...form, businessType: v })}
                options={constructionIndustries}
                placeholder="Select your construction business type"
                className={inputCls}
              />
            </FieldGroup>

            <FieldGroup label="Company Address" required>
              <Input
                placeholder="e.g. Kalanki, Kathmandu"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                required
                className={inputCls}
              />
            </FieldGroup>
          </FormSection>

          <FormSection title="Workspace setup">
            <FieldGroup label="Workspace Name" required hint="A friendly name for your workspace">
              <Input
                placeholder="e.g. Ram Construction Main Workspace"
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

        {/* Logo Upload Column */}
        <div className="lg:col-span-1 order-first lg:order-last">
          <div className="lg:sticky lg:top-24">
            <FormSection title="Company logo (optional)">
              <CompanyLogoUpload
                onChange={(file) => setForm({ ...form, logo: file })}
              />
            </FormSection>
          </div>
        </div>
      </div>

      {/* Agreement */}
      <div className="flex items-start gap-3 p-4 mt-6 rounded-xl border border-green-100 bg-green-50/50">
        <Checkbox
          id="terms"
          checked={form.agreeToTerms}
          onCheckedChange={(checked) => setForm({ ...form, agreeToTerms: checked === true })}
          className="mt-0.5 data-[state=checked]:bg-[#22C55E] data-[state=checked]:border-[#22C55E]"
        />
        <Label htmlFor="terms" className="text-sm text-gray-700 leading-relaxed cursor-pointer">
          I agree to Khata.app&apos;s{" "}
          <a href="#" className="text-[#22C55E] underline font-medium hover:text-[#16A34A]">Terms of Service</a> and{" "}
          <a href="#" className="text-[#22C55E] underline font-medium hover:text-[#16A34A]">Privacy Policy</a>
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
          className="h-12 flex-1 sm:flex-none sm:min-w-[200px] rounded-xl bg-gradient-to-r from-[#16A34A] to-[#22C55E] hover:from-[#15803d] hover:to-[#16A34A] text-white font-extrabold disabled:opacity-40 gap-1.5 border-transparent shadow-md shadow-green-500/20"
        >
          {submitLabel || "Continue"} <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
