"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeleteConfirmDialogProps {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirming?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmDialog({
  open,
  title,
  description,
  confirming = false,
  onCancel,
  onConfirm,
}: DeleteConfirmDialogProps) {
  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={confirming ? undefined : onCancel}
        aria-hidden
      />
      <div
        className="fixed left-1/2 top-[40vh] -translate-x-1/2 z-50 bg-card rounded-xl shadow-xl border border-border p-6 w-full max-w-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center shrink-0">
            <Trash2 className="h-5 w-5 text-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 id="delete-dialog-title" className="text-lg font-semibold text-foreground mb-1">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">{description}</p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                className="border-border text-foreground"
                disabled={confirming}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={onConfirm}
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={confirming}
              >
                {confirming ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
