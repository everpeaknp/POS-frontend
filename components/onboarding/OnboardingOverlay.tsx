"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { useOnboarding } from "@/lib/context/OnboardingContext";
import { OrgWizardShell } from "@/components/org-wizard-shell";
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
} from "lucide-react";
import { billingApi } from "@/lib/api/billing";
import toast from "react-hot-toast";
import { PageLoading } from "@/components/shared/PageLoading";
import confetti from "canvas-confetti";

type WizardStep = 1 | 2 | 3 | "loading" | "success";

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

const HELP_META: Record<
  1 | 2 | 3,
  { title: string; description: string; points: string[]; icon: typeof Building2 }
> = {
  1: {
    title: "Your business profile",
    description: "Organization details power invoices, tax, and workspace identity.",
    icon: Building2,
    points: [
      "Update name, industry, and address anytime in Settings → Organization.",
      "Accounting start date and VAT settings affect your books and tax reports.",
      "Workspace name appears in your Khata URL and team invites.",
    ],
  },
  2: {
    title: "Choose your modules",
    description: "Only enabled modules show in the sidebar. You can change them later.",
    icon: LayoutGrid,
    points: [
      "Sales, Purchase, Inventory, and Reports are ideal for most SMEs.",
      "POS, HR, Construction, and Hardware are available on higher plans.",
      "Manage modules in Settings → Modules without losing your data.",
    ],
  },
  3: {
    title: "Review and continue",
    description: "You’re ready to work in Khata. Next we’ll highlight key screens.",
    icon: ClipboardList,
    points: [
      "Add products, then customers, then create your first invoice.",
      "Record payments to close the money loop.",
      "Use Reports to see sales, stock, and profit.",
    ],
  },
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

function HelpStepBody({ step }: { step: 1 | 2 | 3 }) {
  const tip = HELP_META[step];
  const Icon = tip.icon;
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/50 dark:bg-muted/30 dark:border-border px-4 py-5 space-y-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-500/15 text-[#16A34A]">
        <Icon className="h-5 w-5" />
      </div>
      <ul className="space-y-3">
        {tip.points.map((point) => (
          <li key={point} className="flex gap-2.5 text-sm text-gray-700 dark:text-foreground">
            <CheckCircle2 className="h-4 w-4 text-[#22C55E] shrink-0 mt-0.5" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function OnboardingSuccess({
  organizationName,
  helpMode,
  onContinue,
}: {
  organizationName: string;
  helpMode: boolean;
  onContinue: () => void;
}) {
  useEffect(() => {
    if (helpMode) return;
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
  }, [helpMode]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50/90 dark:bg-background flex flex-col">
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="bg-white dark:bg-card rounded-[28px] shadow-[0_18px_45px_rgba(22,163,74,0.12)] border border-green-100/60 dark:border-border p-10 sm:p-12 w-full max-w-md text-center">
          <div className="flex justify-center mb-6">
            <div className="h-[84px] w-[84px] bg-green-100 dark:bg-green-500/15 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-[#166534]" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-foreground mb-3 tracking-tight">
            {helpMode ? "Guide complete" : "Your workspace is ready"}
          </h2>
          <p className="text-gray-500 dark:text-muted-foreground leading-relaxed mb-8">
            {helpMode
              ? "Next, a short product tour will highlight the most important dashboard options."
              : `${organizationName || "Your organization"} is ready. We’ll show you around the dashboard next.`}
          </p>
          <Button
            type="button"
            className="w-full h-12 rounded-xl bg-gradient-to-r from-[#16A34A] to-[#22C55E] hover:from-[#15803d] hover:to-[#16A34A] text-white font-extrabold border-transparent shadow-md shadow-green-500/20"
            onClick={onContinue}
          >
            {helpMode ? "Start product tour" : "Go to dashboard & start tour"}
          </Button>
        </div>
      </main>
    </div>
  );
}

export function OnboardingOverlay() {
  const { user, refreshUser } = useAuth();
  const {
    completeOverlay,
    skipOverlay,
    refreshOrgCount,
    helpMode,
    startTour,
  } = useOnboarding();
  const [step, setStep] = useState<WizardStep>(1);
  const [organizationData, setOrganizationData] = useState<OrganizationFormData | null>(
    null
  );
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [createdOrgName, setCreatedOrgName] = useState("");
  const [limitsLoading, setLimitsLoading] = useState(!helpMode);
  const [canCreate, setCanCreate] = useState(true);

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
    if (helpMode) {
      setLimitsLoading(false);
      setCanCreate(true);
      return;
    }
    let cancelled = false;
    billingApi
      .getAccountLimits()
      .then((limits) => {
        if (cancelled) return;
        setCanCreate(limits.can_create_org);
        if (!limits.can_create_org) {
          toast.error(
            `Your ${limits.account_plan_name} plan allows up to ${limits.max_orgs ?? 0} organization${
              limits.max_orgs === 1 ? "" : "s"
            }.`
          );
        }
        setLimitsLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLimitsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [helpMode]);

  const handleEnterDashboard = async () => {
    try {
      await refreshUser();
      await refreshOrgCount();
    } catch {
      // ignore
    }
    completeOverlay({ startTour: true });
  };

  if (limitsLoading || !user) {
    return (
      <div className="fixed inset-0 z-[100] bg-gradient-to-br from-green-50 via-white to-emerald-50/90 dark:bg-background flex flex-col overflow-y-auto">
        <PageLoading message="Preparing setup…" className="flex-1 min-h-[50vh]" />
      </div>
    );
  }

  if (!helpMode && !canCreate) {
    return (
      <div className="fixed inset-0 z-[100] bg-gradient-to-br from-green-50 via-white to-emerald-50/90 dark:bg-background flex flex-col overflow-y-auto">
        <main className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="bg-white dark:bg-card rounded-[28px] border border-green-100/60 dark:border-border shadow-[0_18px_45px_rgba(22,163,74,0.12)] max-w-md w-full p-8 text-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-foreground">
              Organization limit reached
            </h2>
            <p className="text-sm text-gray-500 dark:text-muted-foreground mt-2">
              Upgrade a workspace plan to create another organization, or open an existing one.
            </p>
            <Button
              type="button"
              className="mt-6 h-12 rounded-xl bg-gradient-to-r from-[#16A34A] to-[#22C55E] hover:from-[#15803d] hover:to-[#16A34A] text-white border-transparent font-extrabold shadow-md shadow-green-500/20"
              onClick={skipOverlay}
            >
              Go to organizations
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (step === "loading") {
    return (
      <div className="fixed inset-0 z-[100] overflow-y-auto">
        <OrgCreationLoading />
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="fixed inset-0 z-[100] overflow-y-auto">
        <OnboardingSuccess
          organizationName={createdOrgName}
          helpMode={helpMode}
          onContinue={() => {
            if (helpMode) startTour();
            else void handleEnterDashboard();
          }}
        />
      </div>
    );
  }

  const wizardStep = step as 1 | 2 | 3;
  const helpMeta = HELP_META[wizardStep];

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto overscroll-none">
      <OrgWizardShell
        variant="overlay"
        step={wizardStep}
        headerEnd={<SkipLink onClick={skipOverlay} />}
        title={helpMode ? helpMeta.title : undefined}
        description={helpMode ? helpMeta.description : undefined}
      >
        {helpMode ? (
          <div className="flex flex-col">
            <HelpStepBody step={wizardStep} />
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between mt-8 pt-6 border-t border-gray-100 dark:border-border">
              {wizardStep > 1 ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setStep((wizardStep - 1) as WizardStep)}
                  className="h-12 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 border-transparent font-bold sm:min-w-[120px] shadow-none"
                >
                  Back
                </Button>
              ) : (
                <div className="hidden sm:block sm:min-w-[120px]" />
              )}
              <Button
                type="button"
                className="h-12 flex-1 sm:flex-none sm:min-w-[200px] rounded-xl bg-gradient-to-r from-[#16A34A] to-[#22C55E] hover:from-[#15803d] hover:to-[#16A34A] text-white font-extrabold border-transparent shadow-md shadow-green-500/20"
                onClick={() => {
                  if (wizardStep === 3) setStep("success");
                  else setStep((wizardStep + 1) as WizardStep);
                }}
              >
                {wizardStep === 3 ? "Continue" : "Continue"}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {wizardStep === 1 && (
              <OrgForm
                initialData={organizationData ?? undefined}
                onNext={(data: OrganizationFormData) => {
                  setOrganizationData(data);
                  setStep(2);
                }}
                showBackButton={false}
              />
            )}

            {wizardStep === 2 && organizationData && (
              <ModuleSelection
                organizationData={organizationData}
                onBack={() => setStep(1)}
                onNext={(modules) => {
                  setSelectedModules(modules);
                  setStep(3);
                }}
              />
            )}

            {wizardStep === 3 && organizationData && (
              <OrgReview
                organizationData={organizationData}
                selectedModules={selectedModules}
                onBack={() => setStep(2)}
                onEdit={() => setStep(1)}
                onCreationStart={() => setStep("loading")}
                onCreationSuccess={(orgName) => {
                  setCreatedOrgName(orgName);
                  setStep("success");
                }}
                onCreationError={() => setStep(3)}
              />
            )}
          </>
        )}
      </OrgWizardShell>
    </div>
  );
}
