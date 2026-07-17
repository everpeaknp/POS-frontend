"use client";

import {
  Building2,
  Check,
  ClipboardList,
  LayoutGrid,
} from "lucide-react";
import { KhataLogo } from "@/components/khata-logo";

export const ORG_WIZARD_STEPS = {
  1: {
    eyebrow: "Welcome",
    title: "Tell us about your organization",
    description:
      "This information appears on invoices, reports, and your workspace identity.",
    sidebarLabel: "Organization details",
    icon: Building2,
  },
  2: {
    eyebrow: "Modules",
    title: "Choose your modules",
    description:
      "Pick the features you need now. You can enable more later from Settings.",
    sidebarLabel: "Choose modules",
    icon: LayoutGrid,
  },
  3: {
    eyebrow: "Almost done",
    title: "Review and create",
    description:
      "Double-check your details and selected modules before opening your workspace.",
    sidebarLabel: "Review and finish",
    icon: ClipboardList,
  },
} as const;

const SIDEBAR_STEPS = [
  { id: 1 as const, ...ORG_WIZARD_STEPS[1] },
  { id: 2 as const, ...ORG_WIZARD_STEPS[2] },
  { id: 3 as const, ...ORG_WIZARD_STEPS[3] },
];

interface OrgWizardShellProps {
  step: 1 | 2 | 3;
  children: React.ReactNode;
  /** Optional action (e.g. Skip) shown opposite the progress bar */
  headerEnd?: React.ReactNode;
  /** Override default step title/description */
  title?: string;
  description?: string;
  eyebrow?: string;
  /** Full-viewport overlay mode (onboarding) vs page mode (/erp/new) */
  variant?: "page" | "overlay";
}

export function OrgWizardShell({
  step,
  children,
  headerEnd,
  title,
  description,
  eyebrow,
  variant = "page",
}: OrgWizardShellProps) {
  const meta = ORG_WIZARD_STEPS[step];
  const total = SIDEBAR_STEPS.length;
  const progressPct = (step / total) * 100;

  const shell = (
    <div
      className={`${
        variant === "overlay"
          ? "min-h-full"
          : "min-h-screen"
      } flex items-stretch sm:items-center justify-center p-0 sm:p-5 lg:p-8 bg-gradient-to-br from-green-50 via-white to-emerald-50/90 dark:from-background dark:via-background dark:to-background`}
    >
      <div className="w-full max-w-[1100px] my-0 sm:my-auto bg-white dark:bg-card sm:rounded-[28px] shadow-[0_18px_45px_rgba(22,163,74,0.12)] overflow-hidden grid grid-cols-1 lg:grid-cols-[300px_1fr] min-h-[100dvh] sm:min-h-[680px] border border-green-100/60 dark:border-border">
        {/* Sidebar — desktop */}
        <aside className="relative hidden lg:flex flex-col bg-gradient-to-b from-[#14532d] via-[#166534] to-[#22C55E] text-white px-8 py-9 overflow-hidden">
          <div
            className="pointer-events-none absolute -right-24 -bottom-16 h-[230px] w-[230px] rounded-full bg-white/10"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -left-10 top-24 h-28 w-28 rounded-full bg-white/5"
            aria-hidden
          />

          <div className="relative z-[1] mb-10">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-[14px] bg-white grid place-items-center shadow-lg shadow-black/20">
                <svg
                  width={26}
                  height={26}
                  viewBox="0 0 32 32"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M16 2L28 10V22L16 30L4 22V10L16 2Z"
                    fill="#22C55E"
                  />
                  <path
                    d="M16 8L22 12V20L16 24L10 20V12L16 8Z"
                    fill="white"
                    opacity="0.2"
                  />
                  <path
                    d="M16 6L26 12V20L16 26L6 20V12L16 6Z"
                    fill="#22C55E"
                  />
                  <path
                    d="M16 10L22 14V18L16 22L10 18V14L16 10Z"
                    fill="white"
                    opacity="0.45"
                  />
                </svg>
              </div>
              <span className="text-[22px] font-extrabold tracking-tight">
                Khata
              </span>
            </div>
          </div>

          <h1 className="relative z-[1] text-[30px] leading-[1.15] font-bold tracking-tight m-0 mb-3.5">
            Set up your business in minutes.
          </h1>
          <p className="relative z-[1] text-white/80 leading-relaxed mb-9 text-[15px]">
            Complete the essentials now. You can change everything later from
            organization settings.
          </p>

          <div className="relative z-[1] flex flex-col gap-[18px]">
            {SIDEBAR_STEPS.map((s) => {
              const isActive = s.id === step;
              const isDone = s.id < step;
              const Icon = s.icon;
              return (
                <div
                  key={s.id}
                  className={`flex items-center gap-3 transition-opacity duration-250 ${
                    isActive || isDone ? "opacity-100" : "opacity-[0.65]"
                  }`}
                >
                  <div
                    className={`h-[34px] w-[34px] rounded-full grid place-items-center text-sm font-bold border transition-colors shrink-0 ${
                      isDone
                        ? "bg-green-100 text-[#166534] border-transparent"
                        : isActive
                          ? "bg-white text-[#14532d] border-transparent"
                          : "bg-white/15 text-white border-white/28"
                    }`}
                  >
                    {isDone ? (
                      <Check className="h-4 w-4" strokeWidth={2.5} />
                    ) : (
                      s.id
                    )}
                  </div>
                  <div className="min-w-0 flex items-center gap-2">
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        isActive ? "text-white" : "text-white/70"
                      }`}
                    />
                    <span className="text-sm font-semibold truncate">
                      {s.sidebarLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Main */}
        <main className="flex flex-col min-w-0 bg-white dark:bg-card">
          {/* Mobile brand + steps */}
          <div className="lg:hidden px-5 pt-5 pb-3 border-b border-gray-100 dark:border-border space-y-4">
            <div className="flex items-center justify-between gap-3">
              <KhataLogo size="sm" />
              {headerEnd}
            </div>
            <ol className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none">
              {SIDEBAR_STEPS.map((s) => {
                const isActive = s.id === step;
                const isDone = s.id < step;
                return (
                  <li
                    key={s.id}
                    className={`flex items-center gap-1.5 shrink-0 rounded-full px-2.5 py-1.5 text-xs font-semibold border transition-colors ${
                      isActive
                        ? "bg-green-50 text-[#166534] border-green-200"
                        : isDone
                          ? "bg-green-100/80 text-[#166534] border-transparent"
                          : "bg-gray-50 text-gray-400 border-gray-100 dark:bg-muted dark:border-border"
                    }`}
                  >
                    <span
                      className={`h-5 w-5 rounded-full grid place-items-center text-[10px] ${
                        isDone || isActive
                          ? "bg-[#22C55E] text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {isDone ? (
                        <Check className="h-3 w-3" strokeWidth={3} />
                      ) : (
                        s.id
                      )}
                    </span>
                    <span className="whitespace-nowrap">{s.sidebarLabel}</span>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Progress topline */}
          <div className="flex items-center justify-between gap-5 px-5 sm:px-8 lg:px-10 pt-5 sm:pt-8 pb-4">
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-gray-500 dark:text-muted-foreground mb-2 font-medium">
                Step {step} of {total}
              </p>
              <div className="h-2 rounded-full bg-gray-100 dark:bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#16A34A] to-[#22C55E] transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
            {headerEnd ? (
              <div className="hidden lg:block shrink-0">{headerEnd}</div>
            ) : null}
          </div>

          {/* Step heading + body */}
          <div className="flex-1 flex flex-col px-5 sm:px-8 lg:px-10 pb-6 sm:pb-9 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#15803d] mb-2">
              {eyebrow ?? meta.eyebrow}
            </p>
            <h2 className="text-[26px] sm:text-[32px] font-bold text-gray-900 dark:text-foreground tracking-tight m-0 leading-tight">
              {title ?? meta.title}
            </h2>
            <p className="text-[15px] text-gray-500 dark:text-muted-foreground mt-2.5 mb-7 leading-relaxed max-w-2xl">
              {description ?? meta.description}
            </p>

            <div className="flex-1">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );

  if (variant === "overlay") {
    return shell;
  }

  return shell;
}
