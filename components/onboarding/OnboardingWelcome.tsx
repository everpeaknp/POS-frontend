"use client";

import { Building2, Package, FileText, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

const highlights = [
  {
    icon: Building2,
    title: "Your workspace",
    body: "Create an organization and choose the modules your business needs.",
  },
  {
    icon: Package,
    title: "Products & stock",
    body: "Add what you sell so invoices, purchases, and reports stay accurate.",
  },
  {
    icon: FileText,
    title: "Sell & get paid",
    body: "Create invoices and record payments — including credit when you need it.",
  },
  {
    icon: BarChart3,
    title: "See the numbers",
    body: "Dashboards and reports pull from the same books you already use.",
  },
];

interface OnboardingWelcomeProps {
  firstName?: string;
  onStart: () => void;
  onSkip: () => void;
}

export function OnboardingWelcome({
  firstName,
  onStart,
  onSkip,
}: OnboardingWelcomeProps) {
  const name = firstName?.trim() || "there";

  return (
    <div className="flex flex-col">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#2E3E52] mb-2">
        Welcome
      </p>
      <h2 className="text-2xl sm:text-[28px] font-medium text-gray-900 dark:text-foreground tracking-tight m-0 mb-2 leading-tight">
        Hi {name} — let&apos;s set up your business
      </h2>
      <p className="text-gray-500 dark:text-muted-foreground m-0 mb-5 leading-relaxed text-sm">
        This short setup uses the same organization tools already in Khata. You can
        change everything later from settings.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {highlights.map((item) => (
          <div
            key={item.title}
            className="rounded-xl border border-gray-200 dark:border-border bg-white dark:bg-card p-3.5 transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/5"
          >
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-500/15 text-[#2E3E52]">
              <item.icon className="h-4 w-4" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-foreground mb-0.5">
              {item.title}
            </p>
            <p className="text-[12px] text-gray-500 dark:text-muted-foreground leading-relaxed">
              {item.body}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
        <button
          type="button"
          onClick={onSkip}
          className="text-sm font-medium text-gray-500 hover:text-gray-800 dark:hover:text-foreground"
        >
          Skip for now
        </button>
        <Button
          type="button"
          onClick={onStart}
          className="h-10 rounded-xl bg-gradient-to-r from-[#2E3E52] to-[#4A5D7A] hover:from-[#2E3E52] hover:to-[#2E3E52] text-white border-transparent px-6 shadow-md shadow-slate-500/20"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
