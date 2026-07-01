"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OrgWizardShell } from "@/components/org-wizard-shell";
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

  if (isLoading) {
    return <OrgCreationLoading />;
  }

  if (isSuccess) {
    return <OrgCreationSuccess organizationName={createdOrgName} />;
  }

  return (
    <OrgWizardShell step={step} onBack={() => router.push("/erp")}>
      {step === 1 && (
        <OrgForm onNext={handleStep1Complete} showBackButton={false} />
      )}

      {step === 2 && organizationData && (
        <ModuleSelection
          organizationData={organizationData}
          onBack={() => setStep(1)}
          onNext={handleStep2Complete}
        />
      )}

      {step === 3 && organizationData && selectedModules && (
        <OrgReview
          organizationData={organizationData}
          selectedModules={selectedModules}
          onBack={() => setStep(2)}
          onEdit={() => setStep(1)}
          onCreationStart={() => setIsLoading(true)}
          onCreationSuccess={(orgName) => {
            setCreatedOrgName(orgName);
            setIsLoading(false);
            setIsSuccess(true);
          }}
          onCreationError={() => setIsLoading(false)}
        />
      )}
    </OrgWizardShell>
  );
}
