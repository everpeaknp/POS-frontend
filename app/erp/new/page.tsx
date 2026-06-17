"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { TiggLogo } from "@/components/tigg-logo";
import { Button } from "@/components/ui/button";
import { OrgForm } from "@/components/org-form";
import { ModuleSelection } from "@/components/module-selection";
import { OrgReview } from "@/components/org-review";
import { OrgCreationLoading } from "@/components/org-creation-loading";
import { OrgCreationSuccess } from "@/components/org-creation-success";

export default function NewOrgPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [organizationData, setOrganizationData] = useState<any>(null);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdOrgName, setCreatedOrgName] = useState("");

  const handleStep1Complete = (data: any) => {
    setOrganizationData(data);
    setStep(2);
  };

  const handleStep2Complete = (modules: string[]) => {
    setSelectedModules(modules);
    setStep(3);
  };

  const handleBackToStep1 = () => {
    setStep(1);
  };

  const handleBackToStep2 = () => {
    setStep(2);
  };

  const handleCreationStart = () => {
    setIsLoading(true);
  };

  const handleCreationSuccess = (orgName: string) => {
    setCreatedOrgName(orgName);
    setIsLoading(false);
    setIsSuccess(true);
  };

  const handleCreationError = () => {
    setIsLoading(false);
  };

  // Show loading screen
  if (isLoading) {
    return <OrgCreationLoading />;
  }

  // Show success screen
  if (isSuccess) {
    return <OrgCreationSuccess organizationName={createdOrgName} />;
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <TiggLogo size="md" />
          <Button
            variant="ghost"
            onClick={() => router.push("/erp")}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Organizations
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-4xl relative">

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className={`flex items-center gap-2 ${step === 1 ? 'text-[#22C55E]' : step > 1 ? 'text-[#22C55E]' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
              step === 1 ? 'bg-[#22C55E] text-white' : step > 1 ? 'bg-[#22C55E] text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {step > 1 ? '✓' : '1'}
            </div>
            <span className="text-sm font-medium hidden sm:inline">Organization Details</span>
          </div>
          <div className="w-12 h-0.5 bg-gray-200" />
          <div className={`flex items-center gap-2 ${step === 2 ? 'text-[#22C55E]' : step > 2 ? 'text-[#22C55E]' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
              step === 2 ? 'bg-[#22C55E] text-white' : step > 2 ? 'bg-[#22C55E] text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {step > 2 ? '✓' : '2'}
            </div>
            <span className="text-sm font-medium hidden sm:inline">Select Modules</span>
          </div>
          <div className="w-12 h-0.5 bg-gray-200" />
          <div className={`flex items-center gap-2 ${step === 3 ? 'text-[#22C55E]' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
              step === 3 ? 'bg-[#22C55E] text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              3
            </div>
            <span className="text-sm font-medium hidden sm:inline">Review</span>
          </div>
        </div>

        {step === 1 && (
          <>
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1 rounded-full border border-green-100 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Step 1 of 3
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Set Up Your Organization</h1>
              <p className="text-sm text-gray-500 mt-1">
                Fill in the details below to create your organization on Khata.
              </p>
            </div>

            <OrgForm onNext={handleStep1Complete} showBackButton={true} />
          </>
        )}

        {step === 2 && organizationData && (
          <>
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1 rounded-full border border-green-100 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Step 2 of 3
              </div>
            </div>

            <ModuleSelection 
              organizationData={organizationData}
              onBack={handleBackToStep1}
              onNext={handleStep2Complete}
            />
          </>
        )}

        {step === 3 && organizationData && selectedModules && (
          <>
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1 rounded-full border border-green-100 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Step 3 of 3
              </div>
            </div>

            <OrgReview 
              organizationData={organizationData}
              selectedModules={selectedModules}
              onBack={handleBackToStep2}
              onEdit={handleBackToStep1}
              onCreationStart={handleCreationStart}
              onCreationSuccess={handleCreationSuccess}
              onCreationError={handleCreationError}
            />
          </>
        )}
        </div>
      </div>
    </div>
  );
}

