"use client";

import { PageLoading } from "@/components/shared/PageLoading";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { DashHeader } from "@/components/dashboard/dash-header";
import { CompanyLogoUpload } from "@/components/company-logo-upload";
import { DateSystemPreferenceCard } from "@/components/settings/DateSystemPreferenceCard";
import { BusinessCardGenerator } from "@/components/settings/BusinessCardGenerator";
import { DateInput } from "@/components/shared/DateInput";
import { tenantApi, type Tenant } from "@/lib/api/tenant";
import { useAuth } from "@/lib/context/AuthContext";
import { isTenantOrgAdmin } from "@/lib/tenant/admin-access";
import { useDateSystem } from "@/lib/context/DateSystemContext";
import type { DateCalendarSystem } from "@/lib/dates";
import { getMediaUrl } from "@/lib/utils";
import toast from "react-hot-toast";

// Business type options - matching the onboarding forms
const RETAIL_BUSINESS_TYPES = [
  { value: "retail", label: "General Retail Store" },
  { value: "kirana", label: "Kirana Store / General Store" },
  { value: "grocery", label: "Grocery Store" },
  { value: "supermarket", label: "Supermarket" },
  { value: "convenience_store", label: "Convenience Store" },
  { value: "departmental_store", label: "Departmental Store" },
  { value: "mini_mart", label: "Mini Mart" },
  { value: "provision_store", label: "Provision Store" },
  { value: "dairy_products", label: "Dairy & Milk Products" },
  { value: "bakery", label: "Bakery & Confectionery" },
  { value: "sweet_shop", label: "Sweet Shop / Mithai" },
  { value: "fruits_vegetables", label: "Fruits & Vegetables" },
  { value: "meat_shop", label: "Meat & Poultry Shop" },
  { value: "fish_shop", label: "Fish & Seafood" },
  { value: "beverages", label: "Beverages & Cold Drinks" },
  { value: "tea_coffee", label: "Tea & Coffee Shop" },
  { value: "snacks_namkeen", label: "Snacks & Namkeen" },
  { value: "dry_fruits", label: "Dry Fruits & Nuts" },
  { value: "spices", label: "Spices & Masala" },
  { value: "organic_store", label: "Organic Products Store" },
  { value: "clothing", label: "Clothing & Apparel" },
  { value: "footwear", label: "Footwear & Shoes" },
  { value: "fashion_accessories", label: "Fashion Accessories" },
  { value: "cosmetics", label: "Cosmetics & Beauty Products" },
  { value: "pharmacy", label: "Pharmacy / Medical Store" },
  { value: "stationery", label: "Stationery & Books" },
  { value: "mobile_shop", label: "Mobile & Electronics" },
  { value: "electronics", label: "Electronics & Appliances" },
  { value: "home_decor", label: "Home Decor & Furnishing" },
  { value: "kitchenware", label: "Kitchenware & Utensils" },
  { value: "toys_games", label: "Toys & Games" },
  { value: "sports_goods", label: "Sports Goods & Equipment" },
  { value: "gift_shop", label: "Gift Shop" },
  { value: "jewelry", label: "Jewelry & Ornaments" },
  { value: "optical", label: "Optical / Eyewear" },
  { value: "pet_supplies", label: "Pet Supplies" },
  { value: "automobile_parts", label: "Automobile Parts & Accessories" },
  { value: "other", label: "Other Retail" },
] as const;

const CONSTRUCTION_BUSINESS_TYPES = [
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
] as const;

const HARDWARE_BUSINESS_TYPES = [
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
] as const;

const ORGANIZATION_BUSINESS_TYPES = [
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
] as const;

const ALL_BUSINESS_TYPES = [
  ...ORGANIZATION_BUSINESS_TYPES,
  ...RETAIL_BUSINESS_TYPES,
  ...CONSTRUCTION_BUSINESS_TYPES,
  ...HARDWARE_BUSINESS_TYPES,
] as const;

// Filter business types based on account type - matches onboarding forms
function getBusinessTypesForAccount(accountType?: string) {
  if (accountType === "retail") {
    return RETAIL_BUSINESS_TYPES;
  }
  
  if (accountType === "construction") {
    return CONSTRUCTION_BUSINESS_TYPES;
  }
  
  if (accountType === "hardware") {
    return HARDWARE_BUSINESS_TYPES;
  }
  
  // For organization type, show all organization business types
  return ORGANIZATION_BUSINESS_TYPES;
}

// Check if a business type value exists in the filtered list
function isBusinessTypeInList(businessType: string, list: readonly { value: string; label: string }[]) {
  return list.some(item => item.value === businessType);
}

// Get all business types including the current one even if it's not in the filtered list
function getBusinessTypesWithFallback(accountType?: string, currentBusinessType?: string) {
  const filteredList = getBusinessTypesForAccount(accountType);
  
  // If current business type is already in the list, just return the filtered list
  if (!currentBusinessType || isBusinessTypeInList(currentBusinessType, filteredList)) {
    return filteredList;
  }
  
  // If current business type is not in the filtered list, find it in ALL_BUSINESS_TYPES and add it
  const allTypes = [...RETAIL_BUSINESS_TYPES, ...CONSTRUCTION_BUSINESS_TYPES, ...HARDWARE_BUSINESS_TYPES, ...ORGANIZATION_BUSINESS_TYPES];
  const currentType = allTypes.find(item => item.value === currentBusinessType);
  
  if (currentType) {
    // Add the current type at the top of the list with a note
    return [
      { ...currentType, label: `${currentType.label} (Current)` },
      ...filteredList
    ];
  }
  
  return filteredList;
}

interface OrgFormState {
  name: string;
  workspace_name: string;
  business_type: string;
  owner_name: string;
  email: string;
  phone: string;
  pan_vat_number: string;
  website: string;
  street: string;
  city: string;
  district: string;
  province: string;
  accounting_start_date: string;
  vat_registered: boolean;
  date_format: DateCalendarSystem;
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

function parseAddress(address: string | undefined) {
  const parts = (address || "").split(", ").filter(Boolean);
  return {
    street: parts[0] || "",
    city: parts[1] || "",
    district: parts[2] || "",
    province: parts[3] || "",
  };
}

function buildAddress(form: OrgFormState) {
  return [form.street, form.city, form.district, form.province]
    .filter(Boolean)
    .join(", ");
}

function tenantToForm(tenant: Tenant, dateSystem: DateCalendarSystem): OrgFormState {
  const address = parseAddress(tenant.address);
  return {
    name: tenant.name || "",
    workspace_name: tenant.workspace_name || tenant.name || "",
    business_type: tenant.business_type || "other",
    owner_name: tenant.owner_name || "",
    email: tenant.email || "",
    phone: tenant.phone || "",
    pan_vat_number: tenant.pan_vat_number || "",
    website: tenant.website || "",
    ...address,
    accounting_start_date: tenant.accounting_start_date || "",
    vat_registered: tenant.vat_registered ?? false,
    date_format: dateSystem,
  };
}

function OrgSettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, refreshUser } = useAuth();
  const { dateSystem, setDateSystem } = useDateSystem();

  // Redirect personal accounts to their dedicated settings
  useEffect(() => {
    if (user?.tenant?.account_type === "personal") {
      router.replace("/dashboard/finance/settings");
    }
  }, [user?.tenant?.account_type, router]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [existingLogoUrl, setExistingLogoUrl] = useState<string | null>(null);
  const [logoCleared, setLogoCleared] = useState(false);
  const [tenantMeta, setTenantMeta] = useState<Pick<Tenant, "slug" | "plan_type" | "user_role" | "account_type"> | null>(null);
  const [form, setForm] = useState<OrgFormState>(() =>
    tenantToForm({ address: "" } as Tenant, "AD")
  );

  // Don't load data if it's a personal account
  if (user?.tenant?.account_type === "personal") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-accent-custom,#22C55E)]"></div>
          <p className="mt-4 text-gray-600">Redirecting to Personal Finance Settings...</p>
        </div>
      </div>
    );
  }

  const canEdit = isTenantOrgAdmin(tenantMeta?.user_role);

  const loadTenantData = useCallback(async () => {
    try {
      const data = await tenantApi.getCurrent();
      setTenantMeta({
        slug: data.slug,
        plan_type: data.plan_type,
        user_role: data.user_role,
        account_type: data.account_type,
      });
      setExistingLogoUrl(getMediaUrl(data.logo));
      setLogoFile(null);
      setLogoCleared(false);
      setForm(tenantToForm(data, dateSystem));
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        toast.error("No organization selected. Open a Khata from ERP first.");
        setTimeout(() => router.push("/erp"), 1500);
      } else {
        toast.error("Failed to load organization settings");
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  }, [dateSystem, router]);

  useEffect(() => {
    loadTenantData();
  }, [loadTenantData]);

  useEffect(() => {
    if (searchParams.get("refresh") === "true") {
      toast.success("Organization created successfully! You can now manage your settings.");
    }
  }, [searchParams]);

  useEffect(() => {
    setForm((prev) => ({ ...prev, date_format: dateSystem }));
  }, [dateSystem]);

  const updateField = <K extends keyof OrgFormState>(key: K, value: OrgFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!canEdit) {
      toast.error("Only organization admins can update settings");
      return;
    }

    if (!form.name.trim()) {
      toast.error("Business name is required");
      return;
    }

    setSubmitting(true);
    try {
      const updateData: Parameters<typeof tenantApi.updateCurrent>[0] = {
        name: form.name.trim(),
        workspace_name: form.workspace_name.trim() || form.name.trim(),
        business_type: form.business_type || "other",
        owner_name: form.owner_name.trim() || undefined,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        pan_vat_number: form.pan_vat_number.trim() || undefined,
        website: form.website.trim() || undefined,
        address: buildAddress(form) || undefined,
        accounting_start_date: form.accounting_start_date || undefined,
        vat_registered: form.vat_registered,
      };

      if (logoFile) {
        updateData.logo = logoFile;
      } else if (logoCleared) {
        updateData.logo = null;
      }

      await tenantApi.updateCurrent(updateData);

      if (form.date_format !== dateSystem) {
        await setDateSystem(form.date_format);
      }

      await refreshUser();
      await loadTenantData();
      toast.success("Organization settings saved");
    } catch (error: unknown) {
      const data = (error as { response?: { data?: Record<string, unknown> } })?.response?.data;
      if (data && typeof data === "object") {
        if (typeof data.detail === "string") {
          toast.error(data.detail);
        } else if (typeof data.error === "string") {
          toast.error(data.error);
        } else {
          Object.entries(data).forEach(([field, messages]) => {
            const msg = Array.isArray(messages) ? messages.join(", ") : String(messages);
            toast.error(`${field}: ${msg}`);
          });
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
        <PageLoading message="Loading…" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashHeader title="Organization Settings" subtitle="Manage your business profile" />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 space-y-8 w-full min-h-full">
          {tenantMeta && (
            <div className="flex flex-wrap gap-4 text-xs text-gray-500 pb-2 border-b border-gray-100">
              <span>
                Workspace slug: <span className="font-medium text-gray-700">{tenantMeta.slug}</span>
              </span>
              <span>
                Plan: <span className="font-medium text-gray-700 capitalize">{tenantMeta.plan_type}</span>
              </span>
              {!canEdit && (
                <span className="text-amber-700">View only — contact an admin to make changes</span>
              )}
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">
              Business Information
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Business Name" required>
                <Input
                  className="h-9 text-sm border-gray-200"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  disabled={!canEdit || submitting}
                />
              </Field>
              <Field label="Workspace Name">
                <Input
                  className="h-9 text-sm border-gray-200"
                  value={form.workspace_name}
                  onChange={(e) => updateField("workspace_name", e.target.value)}
                  disabled={!canEdit || submitting}
                  placeholder="Shown in sidebar and ERP"
                />
              </Field>
              <Field label="Owner Name">
                <Input
                  className="h-9 text-sm border-gray-200"
                  value={form.owner_name}
                  onChange={(e) => updateField("owner_name", e.target.value)}
                  disabled={!canEdit || submitting}
                />
              </Field>
              <Field label="Industry">
                <Select
                  value={form.business_type || ""}
                  onValueChange={(v) => updateField("business_type", v || "other")}
                  disabled={!canEdit || submitting}
                >
                  <SelectTrigger className="h-9 text-sm border-gray-200">
                    <SelectValue>
                      {form.business_type ? (
                        ALL_BUSINESS_TYPES.find(t => t.value === form.business_type)?.label || form.business_type
                      ) : "Select business type"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {getBusinessTypesWithFallback(tenantMeta?.account_type, form.business_type).map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="PAN / VAT Number">
                <Input
                  className="h-9 text-sm border-gray-200"
                  value={form.pan_vat_number}
                  onChange={(e) => updateField("pan_vat_number", e.target.value)}
                  disabled={!canEdit || submitting}
                  placeholder="e.g. 123456789"
                />
              </Field>
              <Field label="Phone">
                <Input
                  className="h-9 text-sm border-gray-200"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  disabled={!canEdit || submitting}
                />
              </Field>
              <Field label="Email">
                <Input
                  type="email"
                  className="h-9 text-sm border-gray-200"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  disabled={!canEdit || submitting}
                />
              </Field>
              <Field label="Website">
                <Input
                  className="h-9 text-sm border-gray-200"
                  value={form.website}
                  onChange={(e) => updateField("website", e.target.value)}
                  disabled={!canEdit || submitting}
                  placeholder="https://example.com"
                />
              </Field>
              </div>
              <div className="lg:col-span-1">
                <CompanyLogoUpload
                  existingUrl={existingLogoUrl}
                  disabled={!canEdit || submitting}
                  onChange={(file) => {
                    setLogoFile(file);
                    if (file) setLogoCleared(false);
                  }}
                  onClearExisting={() => {
                    setExistingLogoUrl(null);
                    setLogoCleared(true);
                  }}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">
              Address
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <Field label="Province">
                <Input
                  className="h-9 text-sm border-gray-200"
                  value={form.province}
                  onChange={(e) => updateField("province", e.target.value)}
                  disabled={!canEdit || submitting}
                />
              </Field>
              <Field label="District">
                <Input
                  className="h-9 text-sm border-gray-200"
                  value={form.district}
                  onChange={(e) => updateField("district", e.target.value)}
                  disabled={!canEdit || submitting}
                />
              </Field>
              <Field label="City">
                <Input
                  className="h-9 text-sm border-gray-200"
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  disabled={!canEdit || submitting}
                />
              </Field>
              <Field label="Street">
                <Input
                  className="h-9 text-sm border-gray-200"
                  value={form.street}
                  onChange={(e) => updateField("street", e.target.value)}
                  disabled={!canEdit || submitting}
                />
              </Field>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">
              Accounting
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              <Field label="Accounting Start Date">
                <DateInput
                  value={form.accounting_start_date}
                  onChange={(date) => updateField("accounting_start_date", date)}
                  disabled={!canEdit || submitting}
                />
              </Field>
              <div className="flex flex-col gap-1.5 justify-end">
                <Label className="text-sm">VAT Registered</Label>
                <label className="flex items-center gap-2 h-9 text-sm text-gray-700">
                  <Checkbox
                    checked={form.vat_registered}
                    onCheckedChange={(checked) =>
                      updateField("vat_registered", checked === true)
                    }
                    disabled={!canEdit || submitting}
                  />
                  Organization is VAT registered in Nepal
                </label>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">
              Preferences
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
              <Field label="Currency">
                <Input
                  className="h-9 text-sm border-gray-200 bg-gray-50 text-gray-600"
                  value="NPR — Nepali Rupee"
                  readOnly
                />
              </Field>
              <Field label="Fiscal Year">
                <Input
                  className="h-9 text-sm border-gray-200 bg-gray-50 text-gray-600"
                  value="Shrawan (Nepali FY)"
                  readOnly
                />
              </Field>
              <Field label="Default VAT Rate">
                <Input
                  className="h-9 text-sm border-gray-200 bg-gray-50 text-gray-600"
                  value="13% (configure in Tax Management)"
                  readOnly
                />
              </Field>
            </div>

            <DateSystemPreferenceCard
              variant="embedded"
              value={form.date_format}
              onValueChange={(system) => updateField("date_format", system)}
              disabled={!canEdit || submitting}
            />
          </div>

          {/* Business Card Generator */}
          <BusinessCardGenerator tenant={form} logoUrl={existingLogoUrl} />

          {canEdit && (
            <div className="pt-2 border-t border-gray-100">
              <Button
                onClick={handleSubmit}
                className="bg-[var(--color-accent-custom,#22C55E)] hover:bg-[#16A34A] text-white px-6"
                disabled={submitting}
              >
                {submitting ? "Saving..." : (
                  "Save Changes"
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OrgSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col h-full min-h-0">
          <DashHeader title="Organization Settings" subtitle="Manage your business profile" />
          <PageLoading message="Loading…" />
        </div>
      }
    >
      <OrgSettingsContent />
    </Suspense>
  );
}
