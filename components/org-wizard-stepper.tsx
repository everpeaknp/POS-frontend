"use client";

import { Check } from "lucide-react";

const STEPS = [
  { id: 1, label: "Details" },
  { id: 2, label: "Modules" },
  { id: 3, label: "Review" },
] as const;

interface OrgWizardStepperProps {
  currentStep: 1 | 2 | 3;
}

export function OrgWizardStepper({ currentStep }: OrgWizardStepperProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {STEPS.map((step, index) => {
          const isComplete = currentStep > step.id;
          const isCurrent = currentStep === step.id;

          return (
            <div key={step.id} className="flex flex-1 items-center gap-2 sm:gap-3 min-w-0">
              <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <div
                  className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                    isComplete || isCurrent
                      ? "bg-[#22C55E] text-white shadow-sm shadow-green-200"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {isComplete ? <Check className="h-4 w-4" strokeWidth={2.5} /> : step.id}
                </div>
                <span
                  className={`text-[11px] sm:text-xs font-medium whitespace-nowrap ${
                    isCurrent ? "text-[#16A34A]" : isComplete ? "text-gray-700" : "text-gray-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {index < STEPS.length - 1 && (
                <div className="flex-1 h-0.5 rounded-full bg-gray-200 overflow-hidden mb-5">
                  <div
                    className="h-full bg-[#22C55E] transition-all duration-300"
                    style={{ width: currentStep > step.id ? "100%" : "0%" }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const ORG_WIZARD_STEPS = {
  1: {
    title: "Set up your organization",
    description: "Enter your business details to create a new workspace on Khata.",
  },
  2: {
    title: "Choose your modules",
    description: "Select the features that match how your business operates.",
  },
  3: {
    title: "Review and create",
    description: "Confirm everything looks right before we create your organization.",
  },
} as const;
