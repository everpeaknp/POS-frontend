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
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
        {showBack && onBack ? (
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={primaryLoading}
            className="h-11 border-gray-200 text-gray-700 hover:bg-gray-50 gap-1.5 sm:min-w-[120px]"
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
          className="h-11 flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold disabled:opacity-40 gap-1.5 rounded-lg shadow-sm shadow-green-200/50"
        >
          {primaryLoading ? "Processing…" : (
            <>
              {primaryLabel}
              {!primaryLoading && <ArrowRight className="h-4 w-4" />}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
