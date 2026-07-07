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
    <nav aria-label="Organization setup progress" className="w-full">
      <ol className="flex items-center">
        {STEPS.map((step, index) => {
          const isComplete = currentStep > step.id;
          const isCurrent = currentStep === step.id;

          return (
            <li
              key={step.id}
              className={`flex items-center ${index < STEPS.length - 1 ? "flex-1" : ""}`}
            >
              <div className="flex flex-col items-center gap-2 min-w-[4.5rem]">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                    isComplete || isCurrent
                      ? "bg-[#22C55E] text-white shadow-sm shadow-green-200/80"
                      : "bg-white border-2 border-gray-200 text-gray-400"
                  }`}
                >
                  {isComplete ? <Check className="h-4 w-4" strokeWidth={2.5} /> : step.id}
                </div>
                <span
                  className={`text-xs font-medium ${
                    isCurrent
                      ? "text-[#16A34A]"
                      : isComplete
                        ? "text-gray-700"
                        : "text-gray-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {index < STEPS.length - 1 && (
                <div
                  className="flex-1 mx-2 sm:mx-4 h-0.5 rounded-full bg-gray-200 overflow-hidden -mt-6"
                  aria-hidden
                >
                  <div
                    className={`h-full bg-[#22C55E] transition-all duration-500 ${
                      isComplete ? "w-full" : isCurrent ? "w-1/2" : "w-0"
                    }`}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export const ORG_WIZARD_STEPS = {
  1: {
    title: "Set up your organization",
    description: "Enter your business details to create a new Khata workspace.",
  },
  2: {
    title: "Choose your modules",
    description: "Pick the features you need now. You can change modules later from Settings.",
  },
  3: {
    title: "Review and create",
    description: "Double-check your details and selected modules before creating the organization.",
  },
} as const;
