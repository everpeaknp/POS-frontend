"use client";

import { BookOpen, RefreshCw, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DashboardPageShell,
  dashboardCardClass,
} from "@/components/dashboard/DashboardPageShell";
import { useOnboarding } from "@/lib/context/OnboardingContext";

export default function HelpDeskPage() {
  const { replayWizard, startTour } = useOnboarding();

  return (
    <DashboardPageShell
      title="Help Desk"
      subtitle="Replay the setup guide and product tour anytime"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-4xl">
        <div className={`${dashboardCardClass} p-5 sm:p-6`}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 dark:bg-green-500/15 text-[#16A34A] mb-4">
            <Zap className="h-5 w-5" />
          </div>
          <h3 className="text-base font-medium text-gray-900 dark:text-foreground">
            Setup wizard
          </h3>
          <p className="text-sm text-gray-500 dark:text-muted-foreground mt-1.5 leading-relaxed">
            Walk through the full first-time guide again — organization tips, modules,
            and getting started — then continue into the product tour.
          </p>
          <Button
            type="button"
            className="mt-5 bg-gradient-to-r from-[#16A34A] to-[#22C55E] hover:from-[#15803d] hover:to-[#16A34A] text-white border-transparent rounded-xl"
            onClick={replayWizard}
          >
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Replay full wizard
          </Button>
        </div>

        <div className={`${dashboardCardClass} p-5 sm:p-6`}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 dark:bg-green-500/15 text-[#16A34A] mb-4">
            <BookOpen className="h-5 w-5" />
          </div>
          <h3 className="text-base font-medium text-gray-900 dark:text-foreground">
            Product tour
          </h3>
          <p className="text-sm text-gray-500 dark:text-muted-foreground mt-1.5 leading-relaxed">
            Interactive walkthrough of the dashboard sidebar main menu and top
            navbar — organization, modules, notifications, and your account menu.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-5 rounded-xl border-gray-200"
            onClick={startTour}
          >
            <ArrowRight className="h-4 w-4 mr-1.5" />
            Start product tour
          </Button>
        </div>
      </div>
    </DashboardPageShell>
  );
}
