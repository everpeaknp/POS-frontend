"use client";

import { useState, useMemo } from "react";
import { Plus, ChevronUp, DollarSign, TrendingDown, CreditCard, BarChart3 } from "@/lib/icons/lucide-react-shim";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { DraggableFab } from "@/components/ui/draggable-fab";

interface QuickAction {
  id: string;
  label_en: string;
  label_ne: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

const personalFinanceActions: QuickAction[] = [
  {
    id: "add-expense",
    label_en: "Add Expense",
    label_ne: "खर्च जोड्नुहोस्",
    icon: TrendingDown,
    href: "/dashboard/personal-finance/transactions?new=1&type=expense",
  },
  {
    id: "add-income",
    label_en: "Add Income",
    label_ne: "आय जोड्नुहोस्",
    icon: TrendingDown,
    href: "/dashboard/personal-finance/transactions?new=1&type=income",
  },
  {
    id: "pay-bill",
    label_en: "Pay a Bill",
    label_ne: "बिल तिर्नुहोस्",
    icon: CreditCard,
    href: "/dashboard/personal-finance/bills?new=1",
  },
  {
    id: "check-tax",
    label_en: "Check Tax Estimate",
    label_ne: "कर अनुमान जाँच्नुहोस्",
    icon: BarChart3,
    href: "/dashboard/personal-finance/tax",
  },
];

const organizationActions: QuickAction[] = [
  {
    id: "add-expense",
    label_en: "Add Expense",
    label_ne: "खर्च जोड्नुहोस्",
    icon: TrendingDown,
    href: "/dashboard/accounting/journal-entries?new=1&type=expense",
  },
  {
    id: "add-income",
    label_en: "Add Income",
    label_ne: "आय जोड्नुहोस्",
    icon: TrendingDown,
    href: "/dashboard/sales/invoices?new=1",
  },
  {
    id: "pay-bill",
    label_en: "Pay a Bill",
    label_ne: "बिल तिर्नुहोस्",
    icon: CreditCard,
    href: "/dashboard/purchase/invoices?new=1",
  },
  {
    id: "check-tax",
    label_en: "Check Tax Estimate",
    label_ne: "कर अनुमान जाँच्नुहोस्",
    icon: BarChart3,
    href: "/dashboard/accounting/tax-management",
  },
];

interface QuickActionButtonProps {
  language: "en" | "ne";
  actions?: QuickAction[];
}

export function QuickActionButton({
  language,
  actions,
}: QuickActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  // Determine which actions to show based on account type
  const defaultActions = useMemo(() => {
    const isPersonal = user?.tenant?.account_type === "personal";
    return isPersonal ? personalFinanceActions : organizationActions;
  }, [user?.tenant?.account_type]);

  const actualActions = actions || defaultActions;

  const handleAction = (href: string) => {
    router.push(href);
    setIsOpen(false);
  };

  return (
    <DraggableFab
      storageKey="quick-action-menu"
      defaultPosition={{ x: window.innerWidth - 80, y: window.innerHeight - 80 }}
    >
      <div className="relative">
        {/* Expanded menu */}
        {isOpen && (
          <>
            {/* Overlay (tap to close) */}
            <div
              className="fixed inset-0 z-30"
              onClick={() => setIsOpen(false)}
              onKeyDown={(e) => e.key === "Escape" && setIsOpen(false)}
              role="button"
              tabIndex={-1}
            />

            {/* Action buttons */}
            <div className="absolute bottom-20 right-0 flex flex-col gap-3 z-50">
              {actualActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={() => handleAction(action.href)}
                    className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-lg hover:bg-gray-50 transition whitespace-nowrap"
                  >
                    <Icon className="h-5 w-5 text-[#22C55E]" />
                    <span className="text-sm font-medium text-gray-900">
                      {language === "en" ? action.label_en : action.label_ne}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Main FAB button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="flex items-center justify-center h-14 w-14 rounded-full bg-[#22C55E] text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
          aria-label={isOpen ? "Close menu" : "Open quick actions"}
          onKeyDown={(e) => e.key === "Escape" && setIsOpen(false)}
          title="Quick Actions (drag to move)"
        >
          <Plus className="h-6 w-6" style={{ transform: isOpen ? "rotate(45deg)" : "rotate(0)", transition: "transform 0.2s" }} />
        </button>
      </div>
    </DraggableFab>
  );
}
