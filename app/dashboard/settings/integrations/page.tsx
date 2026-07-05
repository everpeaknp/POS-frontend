"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plug,
  ExternalLink,
  CreditCard,
  Mail,
  Landmark,
  Building2,
  MessageSquare,
  Code2,
  type LucideIcon,
} from "lucide-react";
import { DashHeader } from "@/components/dashboard/dash-header";
import { IntegrationCard } from "@/components/settings/IntegrationCard";
import { billingApi } from "@/lib/api/billing";
import toast from "react-hot-toast";

const INTEGRATIONS: Array<{
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  iconClassName: string;
  statusKey: "esewa" | "connected" | "coming_soon";
  href?: string;
}> = [
  {
    id: "esewa",
    name: "eSewa Payments",
    description: "Accept subscription payments and billing via eSewa (configured at platform level).",
    icon: CreditCard,
    iconClassName: "bg-green-50 text-green-600",
    statusKey: "esewa",
    href: "/settings/billing",
  },
  {
    id: "smtp",
    name: "Email (SMTP)",
    description: "Transactional email delivery for invitations, notifications, and campaigns.",
    icon: Mail,
    iconClassName: "bg-blue-50 text-blue-600",
    statusKey: "coming_soon",
  },
  {
    id: "ird",
    name: "IRD Tax Filing",
    description: "Export VAT returns and tax reports for Nepal IRD filing.",
    icon: Landmark,
    iconClassName: "bg-amber-50 text-amber-600",
    statusKey: "coming_soon",
    href: "/dashboard/accounting/tax-management",
  },
  {
    id: "bank",
    name: "Bank Feed",
    description: "Import bank transactions for reconciliation.",
    icon: Building2,
    iconClassName: "bg-purple-50 text-purple-600",
    statusKey: "coming_soon",
    href: "/dashboard/accounting/bank-accounts",
  },
  {
    id: "slack",
    name: "Slack / Teams",
    description: "Send budget alerts and approval notifications to your team chat.",
    icon: MessageSquare,
    iconClassName: "bg-indigo-50 text-indigo-600",
    statusKey: "coming_soon",
  },
  {
    id: "api",
    name: "REST API",
    description: "Use Khata APIs with your own integrations.",
    icon: Code2,
    iconClassName: "bg-gray-100 text-gray-700",
    statusKey: "connected",
    href: process.env.NEXT_PUBLIC_API_URL
      ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api/docs/`
      : "http://localhost:8000/api/docs/",
  },
];

export default function IntegrationsPage() {
  const [esewaEnabled, setEsewaEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    billingApi
      .getOverview()
      .then((o) => setEsewaEnabled(Boolean(o.esewa_enabled)))
      .catch(() => toast.error("Could not load billing status"))
      .finally(() => setLoading(false));
  }, []);

  const resolveStatus = (key: (typeof INTEGRATIONS)[0]["statusKey"]) => {
    if (key === "esewa") {
      return esewaEnabled ? ("connected" as const) : ("not_connected" as const);
    }
    if (key === "connected") return "connected" as const;
    return "coming_soon" as const;
  };

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Integrations" subtitle="Connect payments, email, and third-party services" />
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-900">
          <Plug className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Platform vs organization integrations</p>
            <p className="text-blue-800/80 mt-1">
              eSewa and SMTP are configured by your platform administrator. Organization admins manage
              subscriptions under{" "}
              <Link href="/settings/billing" className="underline font-medium">
                Billing
              </Link>
              .
            </p>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Loading integration status...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {INTEGRATIONS.map((item) => {
              const status = resolveStatus(item.statusKey);
              return (
                <div key={item.id} className="relative">
                  <IntegrationCard
                    name={item.name}
                    description={item.description}
                    icon={item.icon}
                    iconClassName={item.iconClassName}
                    status={status}
                    onConnect={
                      item.href && status === "not_connected"
                        ? () => {
                            window.location.href = item.href!;
                          }
                        : undefined
                    }
                  />
                  {item.href && status !== "coming_soon" && (
                    <a
                      href={item.href}
                      target={item.id === "api" ? "_blank" : undefined}
                      rel={item.id === "api" ? "noopener noreferrer" : undefined}
                      className="absolute top-5 right-5 text-gray-400 hover:text-gray-600"
                      title="Open settings"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
