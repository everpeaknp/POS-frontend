"use client";

import Link from "next/link";
import { useState } from "react";
import { ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BillingPanel } from "@/components/settings/BillingPanel";
import { PageLoader } from "@/components/shared/PageLoader";

interface BillingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Where "Open billing page" should navigate. Defaults to account billing. */
  billingHref?: string;
  title?: string;
  description?: string;
}

export function BillingDialog({
  open,
  onOpenChange,
  billingHref = "/settings/billing",
  title = "Upgrade your plan",
  description = "Choose a plan to unlock paid modules for your organizations.",
}: BillingDialogProps) {
  const [loading, setLoading] = useState(true);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setLoading(true);
        onOpenChange(next);
      }}
    >
      <DialogContent
        className="!flex !flex-col sm:!max-w-7xl w-[min(98vw,80rem)] max-h-none overflow-visible p-0 gap-0"
      >
        <DialogHeader className="shrink-0 px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4 pr-8">
            <div>
              <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
              <DialogDescription className="mt-1">{description}</DialogDescription>
            </div>
            <Link
              href={billingHref}
              className="inline-flex items-center gap-1.5 shrink-0 text-xs font-medium text-[#16A34A] hover:underline mt-0.5"
              onClick={() => onOpenChange(false)}
            >
              Open billing page
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 overflow-visible">
          {open && (
            <>
              {loading && (
                <div className="flex items-center justify-center py-16">
                  <PageLoader message="Loading billing plans…" />
                </div>
              )}
              <div className={loading ? "hidden" : undefined}>
                <BillingPanel
                  key={String(open)}
                  onLoadingChange={setLoading}
                  showPaymentHistory={false}
                  compact
                />
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
