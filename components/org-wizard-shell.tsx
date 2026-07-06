"use client";

import { ArrowLeft } from "lucide-react";
import { KhataLogo } from "@/components/khata-logo";
import { Button } from "@/components/ui/button";
import { OrgWizardStepper, ORG_WIZARD_STEPS } from "@/components/org-wizard-stepper";

interface OrgWizardShellProps {
  step: 1 | 2 | 3;
  onBack: () => void;
  children: React.ReactNode;
}

export function OrgWizardShell({ step, onBack, children }: OrgWizardShellProps) {
  const meta = ORG_WIZARD_STEPS[step];

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <KhataLogo size="md" />
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 shrink-0"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Back to Organizations</span>
            <span className="sm:hidden">Back</span>
          </Button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-4 border-b border-gray-100 bg-gradient-to-b from-green-50/40 to-white">
            <div className="inline-flex items-center gap-2 bg-white text-[#16A34A] text-xs font-semibold px-3 py-1 rounded-full border border-green-100 shadow-sm mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
              Step {step} of 3
            </div>

            <OrgWizardStepper currentStep={step} />

            <div className="mt-6 sm:mt-8">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                {meta.title}
              </h1>
              <p className="text-sm text-gray-500 mt-1.5 max-w-2xl">{meta.description}</p>
            </div>
          </div>

          <div className="px-5 sm:px-8 py-6 sm:py-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
