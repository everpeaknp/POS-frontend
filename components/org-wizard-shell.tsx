"use client";

import { OrgWizardStepper, ORG_WIZARD_STEPS } from "@/components/org-wizard-stepper";
import { ErpHeader } from "@/components/erp/erp-header";

const WIZARD_MAX_WIDTH = "max-w-4xl";

interface OrgWizardShellProps {
  step: 1 | 2 | 3;
  children: React.ReactNode;
}

export function OrgWizardShell({ step, children }: OrgWizardShellProps) {
  const meta = ORG_WIZARD_STEPS[step];

  return (
    <div className="min-h-screen bg-[#F3F4F6] dark:bg-background flex flex-col">
      <ErpHeader />

      <main
        className={`flex-1 w-full ${WIZARD_MAX_WIDTH} mx-auto px-4 sm:px-6 py-6 sm:py-10`}
      >
        <div className="bg-white dark:bg-card rounded-2xl border border-gray-200/80 dark:border-border shadow-sm min-h-[520px] flex flex-col">
          <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-5 border-b border-gray-100 dark:border-border">
            <OrgWizardStepper currentStep={step} />
            <div className="mt-6 sm:mt-7">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#16A34A] mb-1.5">
                Step {step} of 3
              </p>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-foreground tracking-tight">
                {meta.title}
              </h1>
              <p className="text-sm text-gray-500 dark:text-muted-foreground mt-1.5 leading-relaxed">
                {meta.description}
              </p>
            </div>
          </div>

          <div className="flex-1 px-5 sm:px-8 py-6 sm:py-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
