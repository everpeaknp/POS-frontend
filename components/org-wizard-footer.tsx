"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OrgWizardFooterProps {
  onBack?: () => void;
  onPrimary: () => void;
  primaryLabel: string;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  backLabel?: string;
  showBack?: boolean;
}

export function OrgWizardFooter({
  onBack,
  onPrimary,
  primaryLabel,
  primaryDisabled = false,
  primaryLoading = false,
  backLabel = "Back",
  showBack = true,
}: OrgWizardFooterProps) {
  return (
    <div className="mt-8 pt-6 border-t border-gray-100 dark:border-border">
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        {showBack && onBack ? (
          <Button
            type="button"
            variant="secondary"
            onClick={onBack}
            disabled={primaryLoading}
            className="h-12 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 border-transparent font-bold gap-1.5 sm:min-w-[120px] shadow-none"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Button>
        ) : (
          <div className="hidden sm:block sm:min-w-[120px]" />
        )}
        <Button
          type="button"
          onClick={onPrimary}
          disabled={primaryDisabled || primaryLoading}
          className="h-12 flex-1 sm:flex-none sm:min-w-[200px] rounded-xl bg-gradient-to-r from-[#16A34A] to-[#22C55E] hover:from-[#15803d] hover:to-[#16A34A] text-white font-extrabold disabled:opacity-40 gap-1.5 border-transparent shadow-md shadow-green-500/20"
        >
          {primaryLoading ? (
            "Processing…"
          ) : (
            <>
              {primaryLabel}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
