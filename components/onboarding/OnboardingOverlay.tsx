"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { useOnboarding } from "@/lib/context/OnboardingContext";
import { OrgWizardShell, type WizardStepMeta } from "@/components/org-wizard-shell";
import { AccountTypeSelection, type AccountType } from "@/components/account-type-selection";
import { OrgForm } from "@/components/org-form";
import { ModuleSelection } from "@/components/module-selection";
import { OrgReview } from "@/components/org-review";
import { OrgCreationLoading } from "@/components/org-creation-loading";
import { Button } from "@/components/ui/button";
import {
  Building2,
  CheckCircle2,
  LayoutGrid,
  ClipboardList,
  Users,
  User,
} from "lucide-react";
import { billingApi } from "@/lib/api/billing";
import toast from "react-hot-toast";
import { PageLoading } from "@/components/shared/PageLoading";
import confetti from "canvas-confetti";
import { PERSONAL_ACCOUNT_MODULE_IDS } from "@/lib/modules/catalog";
import { getCreationCopy } from "@/lib/onboarding/creation-copy";

type OrganizationFormData = {
  name: string;
  business_type: string;
  address: string;
  accounting_start_date: string;
  vat_registered: boolean;
  pan_vat_number?: string;
  workspace_name: string;
  owner_name?: string;
  email?: string;
  phone?: string;
  logo?: File | null;
};

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

const ORG_DETAILS_STEP: WizardStepMeta = {
  eyebrow: "Welcome",
  title: "Tell us about your organization",
  description: "This information appears on invoices, reports, and your workspace identity.",
  sidebarLabel: "Organization details",
  icon: Building2,
};

const MODULES_STEP: WizardStepMeta = {
  eyebrow: "Step 2 of 3",
  title: "Choose modules",
  description: "Only enabled modules show in sidebar and ERP selection. You can change these later.",
  sidebarLabel: "Choose modules",
  icon: LayoutGrid,
};

const REVIEW_STEP: WizardStepMeta = {
  eyebrow: "Step 3 of 3",
  title: "Review and finish",
  description: "Review your setup and let's get you started.",
  sidebarLabel: "Review and finish",
  icon: ClipboardList,
};

function SkipLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-sm font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-foreground whitespace-nowrap transition-colors"
    >
      Skip setup
    </button>
  );
}

function OnboardingSuccess({
  organizationName,
  accountType,
  onContinue,
}: {
  organizationName: string;
  accountType: AccountType | null;
  onContinue: () => void;
}) {
  const copy = getCreationCopy(accountType);
  useEffect(() => {
    const duration = 2500;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 28, spread: 360, ticks: 50, zIndex: 120 };
    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }
      const particleCount = 40 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: Math.random() * 0.3 + 0.1, y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: Math.random() * 0.3 + 0.7, y: Math.random() - 0.2 },
      });
    }, 250);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100/90 dark:bg-background flex flex-col">
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="bg-white dark:bg-card rounded-[28px] shadow-[0_18px_45px_rgba(22,163,74,0.12)] border border-slate-100/60 dark:border-border p-10 sm:p-12 w-full max-w-md text-center">
          <div className="flex justify-center mb-6">
            <div className="h-[84px] w-[84px] bg-slate-100 dark:bg-slate-500/15 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-[#166534]" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-foreground mb-3 tracking-tight">
            {copy.successHeading}
          </h2>
          <p className="text-gray-500 dark:text-muted-foreground leading-relaxed mb-8">
            {organizationName || "Your account"} is ready. We'll show you around the dashboard next.
          </p>
          <Button
            type="button"
            className="w-full h-12 rounded-xl bg-gradient-to-r from-[#2E3E52] to-[#4A5D7A] hover:from-[#2E3E52] hover:to-[#2E3E52] text-white font-extrabold border-transparent shadow-md shadow-slate-500/20"
            onClick={onContinue}
          >
            Go to dashboard & start tour
          </Button>
        </div>
      </main>
    </div>
  );
}

export function OnboardingOverlay() {
  const { user, refreshUser } = useAuth();
  const { completeOverlay, skipOverlay, refreshOrgCount } = useOnboarding();
  
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [step, setStep] = useState(1);
  const [organizationData, setOrganizationData] = useState<OrganizationFormData | null>(null);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [createdOrgName, setCreatedOrgName] = useState("");
  const [limitsLoading, setLimitsLoading] = useState(true);
  const [canCreateOrg, setCanCreateOrg] = useState(true);
  const [canCreatePersonal, setCanCreatePersonal] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const steps = useMemo<WizardStepMeta[]>(() => {
    if (accountType === "personal") {
      return [ACCOUNT_TYPE_STEP, PERSONAL_DETAILS_STEP, REVIEW_STEP];
    }
    if (accountType) {
      return [ACCOUNT_TYPE_STEP, ORG_DETAILS_STEP, MODULES_STEP, REVIEW_STEP];
    }
    return [ACCOUNT_TYPE_STEP];
  }, [accountType]);

  useEffect(() => {
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, []);

  useEffect(() => {
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
          skipOverlay();
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
  }, [skipOverlay]);

  const handleEnterDashboard = async () => {
    try {
      await refreshUser();
      await refreshOrgCount();
    } catch {
      // ignore
    }
    completeOverlay({ startTour: true });
  };

  const handleAccountTypeSelected = (type: AccountType) => {
    setAccountType(type);
    setStep(2);
  };

  const handleDetailsComplete = (data: OrganizationFormData) => {
    setOrganizationData(data);
    if (accountType === "personal") {
      setSelectedModules([...PERSONAL_ACCOUNT_MODULE_IDS]);
      setStep(3); // straight to review — no module picker for Personal
    } else {
      setStep(3); // modules step — retail, organization, construction, hardware all pick modules
    }
  };

  const handleModulesComplete = (modules: string[]) => {
    setSelectedModules(modules);
    setStep(4); // review step
  };

  if (limitsLoading || !user) {
    return (
      <div className="fixed inset-0 z-[100] bg-gradient-to-br from-slate-50 via-white to-slate-100/90 dark:bg-background flex flex-col overflow-y-auto">
        <PageLoading message="Preparing setup…" className="flex-1 min-h-[50vh]" />
      </div>
    );
  }

  if (!canCreateOrg && !canCreatePersonal) {
    return (
      <div className="fixed inset-0 z-[100] bg-gradient-to-br from-slate-50 via-white to-slate-100/90 dark:bg-background flex flex-col overflow-y-auto">
        <main className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="bg-white dark:bg-card rounded-[28px] border border-slate-100/60 dark:border-border shadow-[0_18px_45px_rgba(22,163,74,0.12)] max-w-md w-full p-8 text-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-foreground">
              Account limit reached
            </h2>
            <p className="text-sm text-gray-500 dark:text-muted-foreground mt-2">
              Upgrade a workspace plan to create another account, or open an existing one.
            </p>
            <Button
              type="button"
              className="mt-6 h-12 rounded-xl bg-gradient-to-r from-[#2E3E52] to-[#4A5D7A] hover:from-[#2E3E52] hover:to-[#2E3E52] text-white border-transparent font-extrabold shadow-md shadow-slate-500/20"
              onClick={skipOverlay}
            >
              Go to organizations
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[100] overflow-y-auto">
        <OrgCreationLoading accountType={accountType} />
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-[100] overflow-y-auto">
        <OnboardingSuccess
          organizationName={createdOrgName}
          accountType={accountType}
          onContinue={() => void handleEnterDashboard()}
        />
      </div>
    );
  }

  const reviewStep = accountType === "personal" ? 3 : 4;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto overscroll-none">
      <OrgWizardShell
        variant="overlay"
        step={step}
        steps={steps}
        headerEnd={<SkipLink onClick={skipOverlay} />}
      >
        {step === 1 && (
          <AccountTypeSelection
            onSelect={handleAccountTypeSelected}
            canCreateOrganization={canCreateOrg}
            canCreatePersonal={canCreatePersonal}
          />
        )}

        {step === 2 && (
          <OrgForm
            accountType={accountType ?? "organization"}
            initialData={organizationData ?? undefined}
            onNext={handleDetailsComplete}
            showBackButton
            onBack={() => setStep(1)}
          />
        )}

        {accountType && accountType !== "personal" && step === 3 && organizationData && (
          <ModuleSelection
            accountType={accountType}
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
    </div>
  );
}
