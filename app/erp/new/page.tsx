"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/context/AuthContext";
import { OrgWizardShell } from "@/components/org-wizard-shell";
import { OrgForm } from "@/components/org-form";
import { ModuleSelection } from "@/components/module-selection";
import { OrgReview } from "@/components/org-review";
import { OrgCreationLoading } from "@/components/org-creation-loading";
import { OrgCreationSuccess } from "@/components/org-creation-success";
import { billingApi } from "@/lib/api/billing";
import { ErpHeader } from "@/components/erp/erp-header";
import { PageLoading } from "@/components/shared/PageLoading";

export default function NewOrgPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [organizationData, setOrganizationData] = useState<any>(null);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdOrgName, setCreatedOrgName] = useState("");
  const [limitsLoading, setLimitsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/auth/login?redirect=/erp/new");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (authLoading || !user) return;
    // After a successful create, limits often flip to can_create_org=false
    // (e.g. Free plan max 1 org). Do not bounce away from the success screen.
    if (isSuccess || isLoading) return;

    let cancelled = false;

    billingApi
      .getAccountLimits()
      .then((limits) => {
        if (cancelled) return;
        if (!limits.can_create_org) {
          const max = limits.max_orgs ?? 0;
          toast.error(
            `Your ${limits.account_plan_name} plan allows up to ${max} organization${max === 1 ? "" : "s"}.`
          );
          router.replace("/erp");
          return;
        }
        setLimitsLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLimitsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, router, isSuccess, isLoading]);

  const handleStep1Complete = (data: any) => {
    setOrganizationData(data);
    setStep(2);
  };

  const handleStep2Complete = (modules: string[]) => {
    setSelectedModules(modules);
    setStep(3);
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] dark:bg-background flex flex-col">
        <ErpHeader />
        <PageLoading message="Loading…" className="flex-1 min-h-[50vh]" />
      </div>
    );
  }

  if (isLoading) {
    return <OrgCreationLoading />;
  }

  if (limitsLoading) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] dark:bg-background flex flex-col">
        <ErpHeader />
        <PageLoading message="Checking plan limits…" className="flex-1 min-h-[50vh]" />
      </div>
    );
  }

  if (isSuccess) {
    return <OrgCreationSuccess organizationName={createdOrgName} />;
  }

  return (
    <OrgWizardShell step={step}>
      {step === 1 && (
        <OrgForm
          initialData={organizationData ?? undefined}
          onNext={handleStep1Complete}
          showBackButton={false}
        />
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
