"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { User, Users } from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { OrgWizardShell, ORG_WIZARD_STEPS, type WizardStepMeta } from "@/components/org-wizard-shell";
import { AccountTypeSelection, type AccountType } from "@/components/account-type-selection";
import { OrgForm } from "@/components/org-form";
import { ModuleSelection } from "@/components/module-selection";
import { OrgReview } from "@/components/org-review";
import { OrgCreationLoading } from "@/components/org-creation-loading";
import { OrgCreationSuccess } from "@/components/org-creation-success";
import { billingApi } from "@/lib/api/billing";
import { PageLoading } from "@/components/shared/PageLoading";
import { PERSONAL_ACCOUNT_MODULE_IDS } from "@/lib/modules/catalog";

const ACCOUNT_TYPE_STEP: WizardStepMeta = {
  eyebrow: "Welcome",
  title: "How will you use Khata?",
  description: "Choose Personal to track your own money, or Organization to run a business with your team.",
  sidebarLabel: "Account type",
  icon: Users,
};

const PERSONAL_DETAILS_STEP: WizardStepMeta = {
  eyebrow: "Welcome",
  title: "Tell us about you",
  description: "Just the basics — you can change these anytime from Settings.",
  sidebarLabel: "Your details",
  icon: User,
};

export default function NewOrgPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [step, setStep] = useState(1);
  const [organizationData, setOrganizationData] = useState<any>(null);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdOrgName, setCreatedOrgName] = useState("");
  const [limitsLoading, setLimitsLoading] = useState(true);
  const [canCreateOrg, setCanCreateOrg] = useState(true);
  const [canCreatePersonal, setCanCreatePersonal] = useState(true);

  const steps = useMemo<WizardStepMeta[]>(() => {
    if (accountType === "personal") {
      return [ACCOUNT_TYPE_STEP, PERSONAL_DETAILS_STEP, ORG_WIZARD_STEPS[3]];
    }
    if (accountType) {
      return [ACCOUNT_TYPE_STEP, ORG_WIZARD_STEPS[1], ORG_WIZARD_STEPS[2], ORG_WIZARD_STEPS[3]];
    }
    return [ACCOUNT_TYPE_STEP];
  }, [accountType]);

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
        if (!limits.can_create_org && !limits.can_create_personal) {
          const max = limits.max_orgs ?? 0;
          toast.error(
            `Your ${limits.account_plan_name} plan allows up to ${max} organization${max === 1 ? "" : "s"}, and you already have a personal account.`
          );
          router.replace("/erp");
          return;
        }
        setCanCreateOrg(limits.can_create_org);
        setCanCreatePersonal(limits.can_create_personal);
        setLimitsLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLimitsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, router, isSuccess, isLoading]);

  const handleAccountTypeSelected = (type: AccountType) => {
    setAccountType(type);
    setStep(2);
  };

  const handleDetailsComplete = (data: any) => {
    setOrganizationData(data);
    if (accountType === "personal") {
      setSelectedModules([...PERSONAL_ACCOUNT_MODULE_IDS]);
      setStep(3); // straight to review — no module picker for Personal
    } else {
      setStep(3); // module picker — retail, organization, construction, hardware all pick modules
    }
  };

  const handleModulesComplete = (modules: string[]) => {
    setSelectedModules(modules);
    setStep(4);
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50/90 dark:bg-background flex flex-col">
        <PageLoading message="Loading…" className="flex-1 min-h-[50vh]" />
      </div>
    );
  }

  if (isLoading) {
    return <OrgCreationLoading accountType={accountType} />;
  }

  if (limitsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50/90 dark:bg-background flex flex-col">
        <PageLoading message="Checking plan limits…" className="flex-1 min-h-[50vh]" />
      </div>
    );
  }

  if (isSuccess) {
    return <OrgCreationSuccess organizationName={createdOrgName} accountType={accountType} />;
  }

  const reviewStep = accountType === "personal" ? 3 : 4;

  return (
    <OrgWizardShell
      step={step}
      steps={steps}
      headerEnd={
        <button
          type="button"
          onClick={() => router.push("/erp")}
          className="text-sm font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      }
    >
      {step === 1 && (
        <AccountTypeSelection
          onSelect={handleAccountTypeSelected}
          onBack={() => router.push("/erp")}
          canCreateOrganization={canCreateOrg}
          canCreatePersonal={canCreatePersonal}
        />
      )}

      {step === 2 && (
        <OrgForm
          accountType={accountType ?? "organization"}
          initialData={organizationData}
          onNext={handleDetailsComplete}
          showBackButton
          onBack={() => setStep(1)}
        />
      )}

      {accountType && accountType !== "personal" && step === 3 && organizationData && (
        <ModuleSelection
          accountType={accountType ?? "organization"}
          organizationData={organizationData}
          onBack={() => setStep(2)}
          onNext={handleModulesComplete}
        />
      )}

      {step === reviewStep && organizationData && selectedModules.length > 0 && (
        <OrgReview
          accountType={accountType ?? "organization"}
          organizationData={organizationData}
          selectedModules={selectedModules}
          onBack={() => setStep(accountType === "personal" ? 2 : 3)}
          onEdit={() => setStep(2)}
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
