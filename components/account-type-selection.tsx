"use client";

import { User, Users, ShoppingBag, HardHat, Wrench, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type AccountType = "personal" | "retail" | "construction" | "hardware" | "organization";

interface AccountTypeSelectionProps {
  onSelect: (type: AccountType) => void;
  onBack?: () => void;
  canCreateOrganization?: boolean;
  canCreatePersonal?: boolean;
}

export function AccountTypeSelection({
  onSelect,
  onBack,
  canCreateOrganization = false,
  canCreatePersonal = true,
}: AccountTypeSelectionProps) {
  const accountTypes = [
    {
      type: "personal" as AccountType,
      icon: User,
      title: "Personal",
      description: "Track your own income, expenses, and budgets",
      features: [
        "Personal finance tracking",
        "Budget management",
        "Category-based expenses",
        "Simple reports",
      ],
      disabled: !canCreatePersonal,
      disabledReason: "You already have a personal account",
    },
    {
      type: "retail" as AccountType,
      icon: ShoppingBag,
      title: "Retail / Kirana",
      description: "Run a retail shop or kirana store",
      features: [
        "Point of sale (POS) & billing",
        "Inventory & stock tracking",
        "Udhaaro / credit ledger",
        "Daily sales reports",
      ],
      disabled: !canCreateOrganization,
      disabledReason: "Organization limit reached for your plan",
    },
    {
      type: "organization" as AccountType,
      icon: Users,
      title: "Organization",
      description: "Run a business with your team",
      features: [
        "Full accounting & invoicing",
        "Inventory & sales management",
        "Team collaboration",
        "Advanced reports & modules",
      ],
      disabled: !canCreateOrganization,
      disabledReason: "Organization limit reached for your plan",
    },
    {
      type: "construction" as AccountType,
      icon: HardHat,
      title: "Construction",
      description: "Manage construction sites and projects",
      features: [
        "Site & project management",
        "Worker attendance tracking",
        "Material consumption logs",
        "Equipment usage tracking",
      ],
      disabled: !canCreateOrganization,
      disabledReason: "Organization limit reached for your plan",
    },
    {
      type: "hardware" as AccountType,
      icon: Wrench,
      title: "Hardware Store",
      description: "Run a hardware business with bulk pricing",
      features: [
        "Bulk pricing & discounts",
        "Customer credit management",
        "Inventory & stock tracking",
        "Aging reports",
      ],
      disabled: !canCreateOrganization,
      disabledReason: "Organization limit reached for your plan",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {accountTypes.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.type}
              type="button"
              onClick={() => !option.disabled && onSelect(option.type)}
              disabled={option.disabled}
              className={cn(
                "relative group text-left p-6 rounded-2xl border-2 transition-all duration-200",
                "hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-green-500/20",
                option.disabled
                  ? "border-gray-200 bg-gray-50/50 cursor-not-allowed opacity-60"
                  : "border-gray-200 bg-white hover:border-green-400 hover:bg-green-50/30 cursor-pointer"
              )}
            >
              {option.disabled && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded-md">
                  <AlertCircle className="h-3.5 w-3.5 text-gray-500" />
                  <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
                    Unavailable
                  </span>
                </div>
              )}

              <div
                className={cn(
                  "h-12 w-12 rounded-xl grid place-items-center mb-4 transition-colors",
                  option.disabled
                    ? "bg-gray-100"
                    : "bg-green-50 group-hover:bg-green-100"
                )}
              >
                <Icon
                  className={cn(
                    "h-6 w-6 transition-colors",
                    option.disabled ? "text-gray-400" : "text-green-600"
                  )}
                />
              </div>

              <h3
                className={cn(
                  "text-xl font-bold mb-2 transition-colors",
                  option.disabled
                    ? "text-gray-500"
                    : "text-gray-900 group-hover:text-green-700"
                )}
              >
                {option.title}
              </h3>

              <p
                className={cn(
                  "text-sm mb-4 leading-relaxed",
                  option.disabled ? "text-gray-400" : "text-gray-600"
                )}
              >
                {option.description}
              </p>

              <ul className="space-y-2">
                {option.features.map((feature, index) => (
                  <li
                    key={index}
                    className={cn(
                      "flex items-start gap-2 text-sm",
                      option.disabled ? "text-gray-400" : "text-gray-700"
                    )}
                  >
                    <svg
                      className={cn(
                        "h-5 w-5 shrink-0 mt-0.5",
                        option.disabled ? "text-gray-300" : "text-green-500"
                      )}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {option.disabled && (
                <p className="mt-4 text-xs text-gray-500 italic">
                  {option.disabledReason}
                </p>
              )}

              {!option.disabled && (
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-green-600 group-hover:text-green-700">
                    Choose {option.title}
                    <svg
                      className="h-4 w-4 transition-transform group-hover:translate-x-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {onBack && (
        <div className="flex justify-center pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back to Dashboard
          </Button>
        </div>
      )}
    </div>
  );
}
