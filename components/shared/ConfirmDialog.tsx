"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  confirming?: boolean;
  icon?: ReactNode;
  iconWrapperClassName?: string;
  confirmClassName?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  confirming = false,
  icon,
  iconWrapperClassName = "bg-[#22C55E]/15 text-[#22C55E]",
  confirmClassName = "bg-[#22C55E] hover:bg-[#16A34A] text-white",
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={confirming ? undefined : onCancel}
    >
      <div
        className="bg-white dark:bg-card rounded-xl shadow-xl border border-gray-100 dark:border-border w-full max-w-md p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          {icon ? (
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${iconWrapperClassName}`}
            >
              {icon}
            </div>
          ) : null}
          <div className="flex-1 min-w-0">
            <h3 id="confirm-dialog-title" className="text-lg font-semibold text-gray-900 dark:text-foreground">
              {title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-muted-foreground mt-1">{description}</p>
            <div className="flex gap-3 justify-end mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                className="border-gray-200 text-gray-700"
                disabled={confirming}
              >
                {cancelLabel}
              </Button>
              <Button
                size="sm"
                onClick={onConfirm}
                className={confirmClassName}
                disabled={confirming}
              >
                {confirming ? "Please wait…" : confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
