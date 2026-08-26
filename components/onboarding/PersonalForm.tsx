"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/lib/context/AuthContext";
import { cn } from "@/lib/utils";

interface PersonalFormData {
  address: string;
  workspaceName: string;
  agreeToTerms: boolean;
}

interface PersonalFormProps {
  initialData?: {
    address?: string;
    workspace_name?: string;
  };
  onNext?: (data: any) => void;
  onBack?: () => void;
  showBackButton?: boolean;
  submitLabel?: string;
  isSubmitting?: boolean;
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

export function PersonalForm({
  initialData,
  onNext,
  onBack,
  showBackButton = true,
  submitLabel,
  isSubmitting,
}: PersonalFormProps) {
  const router = useRouter();
  const { user } = useAuth();

  const [form, setForm] = useState<PersonalFormData>(() => {
    const registeredName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim();
    return {
      address: initialData?.address || "",
      workspaceName: initialData?.workspace_name || (registeredName ? `${registeredName}'s Personal` : "My Personal Account"),
      agreeToTerms: false,
    };
  });

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      const registeredName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim();
      setForm({
        address: initialData.address || "",
        workspaceName: initialData.workspace_name || (registeredName ? `${registeredName}'s Personal` : "My Personal Account"),
        agreeToTerms: false,
      });
    }
  }, [initialData, user]);

  const workspaceUrl = form.workspaceName
    ? `${form.workspaceName.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')}.khata.app`
    : "your-workspace.khata.app";

  const isValid = form.workspaceName.trim() !== "" && form.agreeToTerms;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    const registeredName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim();
    const formData = {
      name: registeredName || "Personal Account",
      account_type: "personal" as const,
      business_type: "other",
      address: form.address,
      accounting_start_date: new Date().toISOString().split('T')[0],
      vat_registered: false,
      workspace_name: form.workspaceName,
      email: user?.email,
    };

    if (onNext) {
      onNext(formData);
    }
  };

  const inputCls = "h-11 w-full rounded-lg border border-gray-200 bg-white text-gray-900 shadow-sm placeholder:text-gray-400 focus-visible:border-[#22C55E] focus-visible:ring-[#22C55E]/15 focus-visible:ring-3 text-sm";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <div className="grid grid-cols-1 gap-8 lg:max-w-xl">
        <div className="space-y-8">
          <FormSection title="Your details">
            <FieldGroup label="Address" hint="Optional - where you live">
              <Input
                placeholder="e.g. Kathmandu, Nepal"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className={inputCls}
              />
            </FieldGroup>
          </FormSection>

          <FormSection title="Workspace setup">
            <FieldGroup label="Workspace Name" required hint="A friendly name for your personal workspace">
              <Input
                placeholder="e.g. My Personal Account"
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
