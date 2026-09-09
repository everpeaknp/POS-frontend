"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  RefreshCw,
  ArrowRight,
  Zap,
  HelpCircle,
  ChevronDown,
  LifeBuoy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SettingsCard,
  SettingsCardBody,
  SettingsCardHeader,
  SettingsPageContent,
} from "@/components/settings/settings-ui";
import { SettingsPageShell } from "@/components/settings/SettingsPageShell";
import { useOnboarding } from "@/lib/context/OnboardingContext";

const FAQ_ITEMS = [
  {
    q: "How do I invite a teammate to my workspace?",
    a: "Go to Settings → Users & Roles and click Invite. They'll receive an email invitation to join with the role you assign.",
  },
  {
    q: "Can I change which modules are enabled for my workspace?",
    a: "Yes — go to Settings → Modules. Core modules and the module matching your workplace type (e.g. Construction, Hardware) are always on; everything else can be toggled freely.",
  },
  {
    q: "How do I switch between light and dark mode, or customize colors?",
    a: "Open Settings → Appearance to switch theme, pick an accent color, and adjust density, animations, and border radius.",
  },
  {
    q: "Where can I see a history of changes made in my workspace?",
    a: "Settings → Audit Logs records every create/update/delete action, logins, and module changes, with filters by user, action, module, and date range.",
  },
  {
    q: "I found a bug or have a feature request — what should I do?",
    a: "Submit a ticket from your account Settings → Support. An admin can track its status right there.",
  },
];

export default function HelpDeskPage() {
  const { replayWizard, startTour } = useOnboarding();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <SettingsPageShell title="Help Desk" subtitle="Get help and browse FAQs">
      <SettingsPageContent>
        <SettingsCard>
          <SettingsCardHeader
            icon={Zap}
            title="Getting Started"
            description="Replay the setup guide and product tour anytime"
          />
          <SettingsCardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-accent-custom,#22C55E)]/10 text-[var(--color-accent-custom,#22C55E)] mb-4">
                  <Zap className="h-5 w-5" />
                </div>
                <h3 className="text-base font-medium text-foreground">Setup wizard</h3>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  Walk through the full first-time guide again — organization tips, modules,
                  and getting started — then continue into the product tour.
                </p>
                <Button
                  type="button"
                  className="mt-5 bg-gradient-to-r from-[var(--color-accent-custom-600,#16A34A)] to-[var(--color-accent-custom,#22C55E)] hover:from-[var(--color-accent-custom-700,#15803d)] hover:to-[var(--color-accent-custom-600,#16A34A)] text-white border-transparent rounded-xl"
                  onClick={replayWizard}
                >
                  <RefreshCw className="h-4 w-4 mr-1.5" />
                  Replay full wizard
                </Button>
              </div>

              <div className="rounded-xl border border-border p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-accent-custom,#22C55E)]/10 text-[var(--color-accent-custom,#22C55E)] mb-4">
                  <BookOpen className="h-5 w-5" />
                </div>
                <h3 className="text-base font-medium text-foreground">Product tour</h3>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  Interactive walkthrough of the dashboard sidebar main menu and top
                  navbar — organization, modules, notifications, and your account menu.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-5 rounded-xl"
                  onClick={startTour}
                >
                  <ArrowRight className="h-4 w-4 mr-1.5" />
                  Start product tour
                </Button>
              </div>
            </div>
          </SettingsCardBody>
        </SettingsCard>

        <SettingsCard>
          <SettingsCardBody>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-accent-custom,#22C55E)]/10 text-[var(--color-accent-custom,#22C55E)]">
                  <LifeBuoy className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-foreground">Need to contact support?</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Submit a ticket and track its status from your account settings.
                  </p>
                </div>
              </div>
              <Link href="/settings/support">
                <Button variant="outline" className="gap-1.5">
                  Go to Support
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </SettingsCardBody>
        </SettingsCard>

        <SettingsCard>
          <SettingsCardHeader
            icon={HelpCircle}
            title="Frequently Asked Questions"
          />
          <SettingsCardBody className="p-0">
            <div className="divide-y divide-border">
              {FAQ_ITEMS.map((item, index) => {
                const isOpen = openFaq === index;
                return (
                  <div key={item.q}>
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="w-full flex items-center justify-between gap-3 px-6 py-3.5 text-left hover:bg-accent/40 transition-colors"
                      aria-expanded={isOpen}
                    >
                      <span className="text-sm font-medium text-foreground">{item.q}</span>
                      <ChevronDown
                        className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    {isOpen && (
                      <p className="px-6 pb-4 text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </SettingsCardBody>
        </SettingsCard>
      </SettingsPageContent>
    </SettingsPageShell>
  );
}
